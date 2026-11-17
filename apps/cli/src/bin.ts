#!/usr/bin/env node
try {
  process.loadEnvFile?.();
} catch {
  // .env is optional
}
import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import ora from 'ora';
import Conf from 'conf';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  VERSION,
  ContribPilotEngine,
} from '@contribpilot/core';
import {
  printBanner,
  formatGeminiTag,
  formatRecommendedBadge,
} from './theme.js';
import {
  defaultTokenStore,
  GoogleAuthService,
  generatePKCE,
  openBrowser,
} from '@contribpilot/auth';
import { defaultCache } from '@contribpilot/github';
import { defaultAgentDetector } from '@contribpilot/handoff';
import type { Level } from '@contribpilot/shared';

let configDir: string;
try {
  const homeDir = path.join(os.homedir(), '.contribpilot');
  if (!fs.existsSync(homeDir)) {
    fs.mkdirSync(homeDir, { recursive: true });
  }
  configDir = homeDir;
} catch {
  configDir = path.join(process.cwd(), '.contribpilot');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

const config = new Conf({ projectName: 'contribpilot', cwd: configDir });
const program = new Command();

program
  .name('contribpilot')
  .description('ContribPilot: AI-powered Open-Source Contribution Assistant')
  .version(VERSION);

// ----------------------------------------------------
// contribpilot start [repoUrl]
// ----------------------------------------------------
program
  .command('start [repoUrl]')
  .description('Full guided interactive flow: repo -> level -> top 3 -> plan -> handoff')
  .action(async (cliRepoUrl?: string) => {
    printBanner(VERSION);

    // 1. Check user status
    const profile = await defaultTokenStore.getUserProfile();
    const geminiKey = await defaultTokenStore.getApiKey('gemini');
    if (profile?.email) {
      p.log.info(`Signed in as ${pc.green(profile.email)} ${profile.name ? `(${profile.name})` : ''}`);
    } else if (geminiKey) {
      p.log.info(`Using configured Gemini API key (${pc.green('BYOK Mode')})`);
    } else {
      p.log.warn(`No Gemini API key configured. Run ${pc.cyan('contribpilot config --gemini <key>')} or ${pc.cyan('contribpilot login')} for AI evaluations. (Offline deterministic mode active)`);
    }

    // 2. Repo URL prompt if not passed
    let repoUrl = cliRepoUrl;
    if (!repoUrl) {
      const input = await p.text({
        message: 'Paste a public GitHub repo URL (e.g. facebook/react or https://github.com/owner/repo):',
        placeholder: 'https://github.com/owner/repo',
        validate: (value) => {
          if (!value || !value.trim()) return 'Please enter a valid GitHub repository URL.';
          return undefined;
        },
      });
      if (p.isCancel(input)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
      repoUrl = input as string;
    }

    // 3. Level selection
    const savedLevel = (config.get('level') as Level) || 'intermediate';
    const levelPrompt = await p.select<Level>({
      message: 'Choose your contribution level (switchable anytime with `contribpilot level`):',
      initialValue: savedLevel,
      options: [
        { value: 'beginner', label: 'Beginner', hint: 'docs, tests, small bugs, good first issues' },
        { value: 'intermediate', label: 'Intermediate', hint: 'bugs w/ repro, small features, refactors' },
        { value: 'pro', label: 'Pro', hint: 'perf, architecture, concurrency, complex features' },
      ],
    });
    if (p.isCancel(levelPrompt)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    const level = levelPrompt as Level;
    config.set('level', level);

    // 4. Run Analysis
    const spinner = ora().start('Analyzing codebase structure and contribution rules...');
    const engine = new ContribPilotEngine({
      onProgress: (msg) => {
        spinner.text = msg;
      },
    });

    try {
      const { profile: repoProfile, top3, totalOpenIssues, filteredCount } = await engine.getRankedIssues(repoUrl, level);
      spinner.succeed(
        `Repo analyzed: ${pc.bold(`${repoProfile.owner}/${repoProfile.name}`)} (${Object.keys(repoProfile.languages)[0] || 'Code'})`
      );

      p.log.step(
        `Contribution rules: ${repoProfile.contributing.hasGuide ? pc.green('CONTRIBUTING.md found') : pc.yellow('No guide')} · AI policy: ${
          repoProfile.contributing.aiPolicy === 'banned' ? pc.red('BANNED') : pc.green(repoProfile.contributing.aiPolicy)
        }`
      );
      p.log.step(`Scanned ${totalOpenIssues} issues (removed ${filteredCount} claimed/competing/unfit)`);

      if (top3.length === 0) {
        p.outro(pc.yellow('No suitable issues found matching your criteria. Try switching level with `contribpilot level`.'));
        process.exit(0);
      }

      // Display Top 3
      console.log('\n' + formatGeminiTag(`Top 3 Recommended Issues for ${level.toUpperCase()}:`));
      for (const item of top3) {
        const isRec = item.mostRecommended;
        const badge = isRec ? formatRecommendedBadge(item.score) : pc.dim(`   ALTERNATIVE   (Score: ${item.score})`);
        console.log(`\n${badge} #${item.issue.number} ${pc.bold(item.issue.title)}`);
        console.log(`  Why: ${item.fitReason}`);
        console.log(`  Effort: ${item.estimatedEffort} | Risks: ${item.risks.join(', ')}`);
        console.log(`  URL: ${pc.dim(item.issue.url)}`);
      }
      console.log('');

      // 5. Choose issue
      const issueChoice = await p.select<number>({
        message: 'Choose an issue to generate a Contribution Pack:',
        options: top3.map((t) => ({
          value: t.issue.number,
          label: `#${t.issue.number} - ${t.issue.title.slice(0, 50)}`,
          hint: `score ${t.score} · ${t.mostRecommended ? '★ MOST RECOMMENDED' : ''}`,
        })),
      });
      if (p.isCancel(issueChoice)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }

      const pickedNumber = issueChoice as number;
      const packSpinner = ora('Generating CONTRIBUTION_PLAN.md with verified steps and tests...').start();
      const { planPath } = await engine.generateContributionPack(repoUrl, pickedNumber, level);
      packSpinner.succeed(`Generated CONTRIBUTION_PLAN.md -> ${pc.cyan(planPath)}`);

      // 6. Handoff options
      const detected = await defaultAgentDetector.getInstalledAgents();
      const detectedNames = detected.map((d) => d.adapter.displayName).join(', ') || 'none detected in PATH';

      const nextAction = await p.select<string>({
        message: 'What next?',
        options: [
          {
            value: 'handoff',
            label: `Launch an AI coding agent (${detectedNames})`,
            hint: detected.length > 0 ? 'Ready on this device' : 'None found on PATH',
          },
          { value: 'save', label: 'Save the .md plan file only' },
        ],
      });
      if (p.isCancel(nextAction)) {
        p.cancel('Operation finished.');
        process.exit(0);
      }

      if (nextAction === 'handoff' && detected.length > 0) {
        const agentChoice = await p.select<string>({
          message: 'Select agent to launch:',
          options: detected.map((d) => ({
            value: d.adapter.id,
            label: d.adapter.displayName,
            hint: d.result.path || d.result.version,
          })),
        });

        if (!p.isCancel(agentChoice)) {
          const adapter = defaultAgentDetector.getAdapter(agentChoice as string);
          if (adapter) {
            const shouldLaunch = await p.confirm({
              message: `Launch ${adapter.displayName} with target plan?`,
              initialValue: true,
            });

            if (shouldLaunch) {
              p.log.info(`Launching ${adapter.displayName}...`);
              await adapter.launch({
                cwd: process.cwd(),
                planFile: planPath,
                prompt: `You are helping me make an open-source contribution for issue #${pickedNumber}. Read the contribution plan at ${planPath} and show me your approach before editing files.`,
              });
            }
          }
        }
      } else {
        p.outro(pc.green(`✓ Contribution plan saved! Open ${pc.bold(planPath)} to begin your contribution.`));
      }
    } catch (err: unknown) {
      spinner.stop();
      p.log.error(err instanceof Error ? err.message : String(err));
      p.cancel('Contribution flow stopped due to an error.');
    }
  });

// ----------------------------------------------------
// contribpilot doctor
// ----------------------------------------------------
program
  .command('doctor')
  .description('Check environment: node, git, keychain, network, keys, and installed agents')
  .action(async () => {
    console.log('\n' + formatGeminiTag('ContribPilot Doctor Diagnostics') + '\n');

    p.log.step(`Node.js version: ${pc.green(process.version)} (Required >= 20)`);

    // Keychain check
    try {
      await defaultTokenStore.getApiKey('gemini');
      p.log.step(`Secrets Store (keychain / encrypted vault): ${pc.green('Healthy')}`);
    } catch {
      p.log.warn(`Secrets Store: Falling back to encrypted local vault.`);
    }

    // Google Profile / Auth
    const userProfile = await defaultTokenStore.getUserProfile();
    if (userProfile?.email) {
      p.log.step(`Google Account: ${pc.green(userProfile.email)} (${userProfile.name || 'User'})`);
    } else {
      p.log.step(`Google Account: ${pc.yellow('Not signed in')} (Run ${pc.cyan('contribpilot login')})`);
    }

    // Configured keys
    const geminiKey = await defaultTokenStore.getApiKey('gemini');
    p.log.step(`Gemini API Key: ${geminiKey ? pc.green('Configured (BYOK)') : pc.yellow('Not set (run `contribpilot config --gemini <key>`)')}`);

    const githubToken = await defaultTokenStore.getApiKey('github');
    p.log.step(`GitHub Token: ${githubToken ? pc.green('Configured (5000 req/hr)') : pc.dim('Not set (60 req/hr public rate limit)')}`);

    // Detected agents
    const agents = await defaultAgentDetector.getInstalledAgents();
    if (agents.length > 0) {
      console.log('\n' + pc.bold('Detected CLI Coding Agents & IDEs on this device:'));
      for (const a of agents) {
        console.log(`  ✔ ${pc.bold(pc.green(a.adapter.displayName))} -> ${pc.dim(a.result.path || 'installed')}`);
      }
    } else {
      p.log.step(`Detected AI Agents: ${pc.dim('None found on PATH (claude, gemini, opencode, cursor, code, aider, codex)')}`);
    }

    p.outro(pc.green('Doctor check complete!'));
  });

// ----------------------------------------------------
// contribpilot config
// ----------------------------------------------------
program
  .command('config')
  .description('Set Gemini API key (BYOK), GitHub token, Google Client ID, or default level')
  .option('--gemini <key>', 'Set Gemini API key')
  .option('--github <token>', 'Set GitHub Personal Access Token')
  .option('--google-client-id <id>', 'Set Google OAuth Client ID')
  .option('--google-client-secret <secret>', 'Set Google OAuth Client Secret')
  .option('--level <level>', 'Set default level (beginner | intermediate | pro)')
  .action(async (options) => {
    if (options.gemini) {
      await defaultTokenStore.setApiKey('gemini', options.gemini);
      p.log.success('Gemini API key saved to secure vault.');
    }
    if (options.github) {
      await defaultTokenStore.setApiKey('github', options.github);
      p.log.success('GitHub token saved to secure vault.');
    }
    if (options.googleClientId) {
      config.set('googleClientId', options.googleClientId);
      p.log.success('Google OAuth Client ID saved.');
    }
    if (options.googleClientSecret) {
      await defaultTokenStore.setSecret('google_client_secret', options.googleClientSecret);
      p.log.success('Google OAuth Client Secret saved to secure vault.');
    }
    if (options.level) {
      if (['beginner', 'intermediate', 'pro'].includes(options.level)) {
        config.set('level', options.level);
        p.log.success(`Default level set to: ${options.level}`);
      } else {
        p.log.error('Invalid level. Choose beginner, intermediate, or pro.');
      }
    }
    if (!options.gemini && !options.github && !options.googleClientId && !options.googleClientSecret && !options.level) {
      const currentLevel = config.get('level') || 'intermediate';
      const hasGemini = !!(await defaultTokenStore.getApiKey('gemini'));
      const hasGitHub = !!(await defaultTokenStore.getApiKey('github'));
      const hasGoogleId = !!config.get('googleClientId');
      console.log(`Current Configuration:\n  Level: ${currentLevel}\n  Gemini Key: ${hasGemini ? 'Set' : 'Not set'}\n  GitHub Token: ${hasGitHub ? 'Set' : 'Not set'}\n  Google Client ID: ${hasGoogleId ? 'Set' : 'Not set'}`);
    }
  });

// ----------------------------------------------------
// contribpilot level [level]
// ----------------------------------------------------
program
  .command('level [newLevel]')
  .description('Switch level (beginner | intermediate | pro) or display current level')
  .action(async (newLevel?: string) => {
    if (!newLevel) {
      const current = config.get('level') || 'intermediate';
      console.log(`Current level: ${pc.bold(pc.cyan(String(current)))}`);
      return;
    }
    if (['beginner', 'intermediate', 'pro'].includes(newLevel)) {
      config.set('level', newLevel);
      p.log.success(`Switched level to ${pc.bold(pc.green(newLevel))}`);
    } else {
      p.log.error('Invalid level. Must be: beginner | intermediate | pro');
    }
  });

// ----------------------------------------------------
// contribpilot whoami & login & logout
// ----------------------------------------------------
program
  .command('whoami')
  .description('Show current authenticated user profile')
  .action(async () => {
    const profile = await defaultTokenStore.getUserProfile();
    const token = await defaultTokenStore.getToken();
    if (profile?.email) {
      console.log(`\nAuthenticated Google User:`);
      console.log(`  Email:   ${pc.green(profile.email)}`);
      if (profile.name) console.log(`  Name:    ${profile.name}`);
      if (token?.expiresAt) {
        const expiresInMins = Math.round((token.expiresAt - Date.now()) / 60000);
        console.log(`  Session: Active (expires in ${expiresInMins}m)`);
      }
      console.log('');
    } else {
      console.log(pc.dim('\nNot signed in with Google. Use `contribpilot login` to sign in.'));
    }
  });

program
  .command('login')
  .description('Sign in with Google OAuth (Loopback Server + PKCE)')
  .option('--client-id <id>', 'Google OAuth Client ID')
  .option('--client-secret <secret>', 'Google OAuth Client Secret')
  .action(async (options) => {
    p.intro(pc.bold('Google OAuth Sign-In (PKCE)'));

    let clientId = options.clientId || (config.get('googleClientId') as string) || process.env.GOOGLE_CLIENT_ID;
    let clientSecret = options.clientSecret || (await defaultTokenStore.getSecret('google_client_secret')) || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId) {
      p.log.info(
        `Google OAuth requires a Google OAuth 2.0 Client ID (Application type: Desktop app) from the Google Cloud Console.`
      );
      const choice = await p.select<string>({
        message: 'How would you like to sign in?',
        options: [
          { value: 'enter_id', label: 'Enter my Google OAuth Client ID' },
          { value: 'enter_key', label: 'Use Gemini API Key directly (Fastest / BYOK Mode)' },
          { value: 'developer', label: 'Set developer email profile manually' },
        ],
      });

      if (p.isCancel(choice)) {
        p.cancel('Login cancelled.');
        process.exit(0);
      }

      if (choice === 'enter_key') {
        const key = await p.password({ message: 'Enter your Gemini API Key from Google AI Studio:' });
        if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
          await defaultTokenStore.setApiKey('gemini', key.trim());
          p.log.success('Gemini API key saved! AI evaluation and ranking are now active.');
        }
        return;
      }

      if (choice === 'developer') {
        const email = await p.text({
          message: 'Enter your developer email:',
          placeholder: 'developer@example.com',
          validate: (val) => (!val || !val.includes('@') ? 'Enter a valid email address.' : undefined),
        });
        if (!p.isCancel(email) && typeof email === 'string') {
          await defaultTokenStore.setUserProfile({ email });
          p.log.success(`Signed in as developer: ${pc.green(email)}`);
        }
        return;
      }

      const inputId = await p.text({
        message: 'Paste your Google OAuth Client ID:',
        validate: (v) => (!v || !v.trim() ? 'Client ID is required.' : undefined),
      });
      if (p.isCancel(inputId) || typeof inputId !== 'string') {
        p.cancel('Login cancelled.');
        process.exit(0);
      }
      clientId = inputId.trim();
      config.set('googleClientId', clientId);
    }

    const authService = new GoogleAuthService({ clientId, clientSecret: clientSecret || undefined });
    const spinner = ora('Starting local loopback listener...').start();

    try {
      const server = await authService.startLoopbackServer(120000);
      spinner.succeed(`Loopback listener ready on port ${server.port}`);

      const pkce = generatePKCE();
      const state = crypto.randomBytes(16).toString('hex');
      const authUrl = authService.buildAuthUrl(server.redirectUri, state, pkce.challenge);

      p.log.info(`Opening your browser to complete Google Sign-In...`);
      openBrowser(authUrl);

      console.log(`\nIf your browser did not open automatically, visit this URL:\n${pc.cyan(authUrl)}\n`);

      const codeSpinner = ora('Waiting for Google authentication in browser...').start();
      const code = await server.waitForCallback(state);
      codeSpinner.succeed('Authorization code received!');

      const exchangeSpinner = ora('Exchanging code for tokens...').start();
      const token = await authService.exchangeCodeForToken(code, pkce.verifier, server.redirectUri);
      await defaultTokenStore.setToken(token);

      const profile = await authService.fetchUserProfile(token.accessToken);
      await defaultTokenStore.setUserProfile(profile);
      exchangeSpinner.succeed(`Authenticated as ${pc.bold(profile.name || profile.email)}!`);

      p.outro(pc.green(`✓ Successfully signed in as ${pc.bold(profile.email)}`));
    } catch (err: unknown) {
      spinner.stop();
      p.log.error(err instanceof Error ? err.message : String(err));
      p.cancel('Google OAuth sign-in could not be completed.');
    }
  });

program
  .command('logout')
  .description('Sign out and wipe stored tokens')
  .action(async () => {
    await defaultTokenStore.clearToken();
    p.log.success('Signed out. Tokens cleared from secure storage.');
  });

// ----------------------------------------------------
// contribpilot analyze <repoUrl>
// ----------------------------------------------------
program
  .command('analyze <repoUrl>')
  .description('Stage A: Analyze codebase structure, build commands, and contribution rules')
  .action(async (repoUrl: string) => {
    const spinner = ora(`Analyzing ${repoUrl}...`).start();
    try {
      const engine = new ContribPilotEngine();
      const profile = await engine.analyzeRepo(repoUrl);
      spinner.succeed(`Analysis complete for ${profile.owner}/${profile.name}`);
      console.log(JSON.stringify(profile, null, 2));
    } catch (err) {
      spinner.fail(err instanceof Error ? err.message : String(err));
    }
  });

// ----------------------------------------------------
// contribpilot issues <repoUrl>
// ----------------------------------------------------
program
  .command('issues <repoUrl>')
  .description('Stages B+C: Fetch, score, and rank top issues')
  .option('--level <level>', 'Target level (beginner | intermediate | pro)', 'intermediate')
  .option('--json', 'Output results as JSON')
  .action(async (repoUrl: string, opts: { level: Level; json?: boolean }) => {
    const spinner = ora(`Ranking issues for ${repoUrl} [${opts.level}]...`).start();
    try {
      const engine = new ContribPilotEngine();
      const { top3 } = await engine.getRankedIssues(repoUrl, opts.level);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(top3, null, 2));
      } else {
        console.log(`\nTop ${top3.length} Issues:`);
        for (const item of top3) {
          console.log(`- #${item.issue.number} ${item.issue.title} (Score: ${item.score}) ${item.mostRecommended ? '★ MOST RECOMMENDED' : ''}`);
        }
      }
    } catch (err) {
      spinner.fail(err instanceof Error ? err.message : String(err));
    }
  });

// ----------------------------------------------------
// contribpilot pack <repoUrl> <issueNumber>
// ----------------------------------------------------
program
  .command('pack <repoUrl> <issueNumber>')
  .description('Stage D: Generate CONTRIBUTION_PLAN.md for an issue')
  .option('--level <level>', 'Target level', 'intermediate')
  .action(async (repoUrl: string, issueNumberStr: string, opts: { level: Level }) => {
    const issueNumber = parseInt(issueNumberStr, 10);
    const spinner = ora(`Generating Contribution Pack for issue #${issueNumber}...`).start();
    try {
      const engine = new ContribPilotEngine();
      const { planPath } = await engine.generateContributionPack(repoUrl, issueNumber, opts.level);
      spinner.succeed(`Contribution Pack written to: ${planPath}`);
    } catch (err) {
      spinner.fail(err instanceof Error ? err.message : String(err));
    }
  });

// ----------------------------------------------------
// contribpilot agents
// ----------------------------------------------------
program
  .command('agents')
  .description('List detected local AI coding agents on this device')
  .action(async () => {
    const agents = await defaultAgentDetector.getInstalledAgents();
    console.log('\n' + formatGeminiTag('Detected AI Coding Agents on this Device:'));
    if (agents.length === 0) {
      console.log(pc.dim('  No supported agents found on PATH (claude, gemini, opencode, cursor, code, aider, codex)'));
    } else {
      for (const a of agents) {
        console.log(`  ✔ ${pc.bold(pc.green(a.adapter.displayName))}\n     Path: ${pc.cyan(a.result.path || 'installed')}\n     Version: ${pc.dim(a.result.version || 'detected')}`);
      }
    }
    console.log('');
  });

// ----------------------------------------------------
// contribpilot cache clear
// ----------------------------------------------------
program
  .command('cache <action>')
  .description('Manage cache (e.g. `contribpilot cache clear`)')
  .action(async (action: string) => {
    if (action === 'clear') {
      defaultCache.clear();
      p.log.success('Cache cleared.');
    } else {
      p.log.error('Unknown cache action. Use `contribpilot cache clear`.');
    }
  });

program.parse(process.argv);
