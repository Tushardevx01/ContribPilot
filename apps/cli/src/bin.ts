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
  geminiGradient,
  renderBoxCard,
  renderAccountStatusHeader,
  renderIssueCard,
} from './theme.js';
import {
  defaultTokenStore,
  GoogleAuthService,
  generatePKCE,
  openBrowser,
  openPaymentPage,
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

async function runGoogleOAuthFlow(forcedClientId?: string, forcedClientSecret?: string): Promise<boolean> {
  let clientId = forcedClientId || (config.get('googleClientId') as string) || process.env.GOOGLE_CLIENT_ID;
  let clientSecret = forcedClientSecret || (await defaultTokenStore.getSecret('google_client_secret')) || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    console.log('\n' + renderBoxCard('Google OAuth Sign-In Setup', [
      'Sign in with your Google account to automatically use your personal Gemini quota.',
      'A Google OAuth Client ID (Application type: Desktop app) is required.',
      'Create one in Google Cloud Console: https://console.cloud.google.com/apis/credentials',
    ], { borderColor: 'cyan' }) + '\n');

    const choice = await p.select<string>({
      message: 'Choose how to connect your Gemini quota:',
      options: [
        { value: 'enter_id', label: '1. Paste your Google OAuth Client ID (Connects Google Account quota)' },
        { value: 'enter_key', label: '2. Enter Gemini API Key directly (Free BYOK Mode from Google AI Studio)' },
        { value: 'pro', label: '3. Upgrade to ContribPilot Pro (Use hosted Gemini quota · Opens payment page)' },
        { value: 'developer', label: '4. Set developer profile email manually' },
      ],
    });

    if (p.isCancel(choice)) {
      p.cancel('Login cancelled.');
      return false;
    }

    if (choice === 'pro') {
      p.log.info('Opening secure payment webpage in your browser...');
      const paymentUrl = openPaymentPage();
      console.log(`\nIf your browser did not open automatically, visit this URL:\n${pc.cyan(paymentUrl)}\n`);
      const key = await p.password({ message: 'Enter your Pro License Key (or press Enter if purchasing now):' });
      if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
        await defaultTokenStore.setApiKey('pro', key.trim());
        p.log.success('ContribPilot Pro license saved! Hosted Gemini quota is now active.');
        return true;
      }
      return false;
    }

    if (choice === 'enter_key') {
      const key = await p.password({ message: 'Enter your Gemini API Key from Google AI Studio:' });
      if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
        await defaultTokenStore.setApiKey('gemini', key.trim());
        p.log.success('Gemini API key saved! AI evaluation is now active.');
        return true;
      }
      return false;
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
        return true;
      }
      return false;
    }

    const inputId = await p.text({
      message: 'Paste your Google OAuth Client ID:',
      validate: (v) => (!v || !v.trim() ? 'Client ID is required.' : undefined),
    });
    if (p.isCancel(inputId) || typeof inputId !== 'string') {
      p.cancel('Login cancelled.');
      return false;
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

    const quotaSpinner = ora('Fetching Gemini quota for your Google account...').start();
    const quota = await authService.fetchGeminiQuota(token.accessToken);
    if (quota.active) {
      quotaSpinner.succeed(`Gemini Quota Active: ${pc.green(`${quota.models.length} models accessible`)} on your Google account!`);
    } else {
      quotaSpinner.info(`Google account connected. (${quota.message})`);
    }

    p.outro(pc.green(`✓ Successfully signed in as ${pc.bold(profile.email)}. Your Google Gemini quota is active!`));
    return true;
  } catch (err: unknown) {
    spinner.stop();
    p.log.error(err instanceof Error ? err.message : String(err));
    p.cancel('Google OAuth sign-in could not be completed.');
    return false;
  }
}

async function ensureUserAuthenticatedBeforeAnalysis(actionDescription = 'analyze repository'): Promise<boolean> {
  const profile = await defaultTokenStore.getUserProfile();
  const token = await defaultTokenStore.getToken();
  const geminiKey = (await defaultTokenStore.getApiKey('gemini')) || process.env.GEMINI_API_KEY;
  const isPro = (await defaultTokenStore.isProUser()) || !!process.env.CONTRIBPILOT_PRO_KEY;

  if (token) {
    renderAccountStatusHeader({
      email: profile?.email,
      name: profile?.name,
      quotaActive: true,
    });
    return true;
  }

  if (geminiKey) {
    renderAccountStatusHeader({
      byok: true,
    });
    return true;
  }

  if (isPro) {
    renderAccountStatusHeader({
      isPro: true,
    });
    return true;
  }

  // Not authenticated: Prompt to connect Google Gemini quota before analyzing
  console.log('\n' + renderBoxCard('Google Gemini Quota Required', [
    `Before ContribPilot can ${actionDescription}, please sign in.`,
    `This connects your personal Google Gemini quota so the AI can evaluate`,
    `issues, score mergeability, and generate contribution plans.`,
  ], { borderColor: 'gradient' }) + '\n');

  const authOption = await p.select<string>({
    message: 'Connect your Gemini quota to proceed:',
    options: [
      { value: 'google', label: '1. Sign in with Google (Recommended · Uses your Google Gemini quota)' },
      { value: 'byok', label: '2. Enter Gemini API Key (Free BYOK from Google AI Studio)' },
      { value: 'pro', label: '3. Upgrade to ContribPilot Pro (Use hosted Gemini quota · Opens payment page)' },
      { value: 'offline', label: '4. Continue with Offline Rule-Based Mode (Deterministic scoring only)' },
    ],
  });

  if (p.isCancel(authOption)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  if (authOption === 'google') {
    return await runGoogleOAuthFlow();
  } else if (authOption === 'byok') {
    const key = await p.password({ message: 'Enter your Gemini API Key from Google AI Studio:' });
    if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
      await defaultTokenStore.setApiKey('gemini', key.trim());
      p.log.success('Gemini API key saved! AI evaluation is now active.');
      renderAccountStatusHeader({ byok: true });
      return true;
    }
    return false;
  } else if (authOption === 'pro') {
    p.log.info('Opening secure payment webpage in your browser...');
    const paymentUrl = openPaymentPage(profile?.email);
    console.log(`\nIf your browser did not open automatically, visit this URL:\n${pc.cyan(paymentUrl)}\n`);
    const key = await p.password({ message: 'Enter your Pro License Key after completing payment:' });
    if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
      await defaultTokenStore.setApiKey('pro', key.trim());
      p.log.success('ContribPilot Pro license saved! Hosted Gemini quota unlocked.');
      renderAccountStatusHeader({ isPro: true });
      return true;
    }
    return false;
  } else {
    p.log.warn('Proceeding in Offline Deterministic Mode (Rule-based ranking without AI).');
    renderAccountStatusHeader({});
    return false;
  }
}

const program = new Command();

program
  .name('contribpilot')
  .description(`ContribPilot: AI-powered Open-Source Contribution Assistant\nDeveloped by Sayandeep Pradhan (https://github.com/sayandeep0212)`)
  .version(VERSION);

// ----------------------------------------------------
// contribpilot start [repoUrl]
// ----------------------------------------------------
program
  .command('start [repoUrl]')
  .description('Full guided interactive flow: repo -> level -> top 3 -> plan -> handoff')
  .action(async (cliRepoUrl?: string) => {
    printBanner(VERSION);

    // 1. Enforce user sign-in & Gemini quota connection before repo analysis
    await ensureUserAuthenticatedBeforeAnalysis('analyze repository and rank mergeable issues');

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

      // Display Top 3 in Graphical Box Cards
      console.log('\n' + renderBoxCard('Top 3 Recommended Issues for Contribution', [
        `Ranked specifically for your chosen level: ${pc.bold(level.toUpperCase())}`,
        `Scored on testability, reproducibility, maintainer signals, and code scope.`,
      ], { borderColor: 'gradient' }) + '\n');

      top3.forEach((item, index) => {
        console.log(renderIssueCard(item, index + 1) + '\n');
      });

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

      // 6. Direct CLI Coding Agent Choice & Handoff
      const detected = await defaultAgentDetector.getInstalledAgents();
      const detectedNames = detected.map((d) => d.adapter.displayName).join(', ') || 'None found on PATH';

      const nextAction = await p.select<string>({
        message: 'What would you like to do with this contribution plan?',
        options: [
          {
            value: 'handoff',
            label: `Choose and launch an AI coding agent on your device`,
            hint: detected.length > 0 ? `Detected: ${detectedNames}` : 'Choose from supported agents',
          },
          { value: 'save', label: 'Save the .md plan file only (Manual contribution)' },
        ],
      });
      if (p.isCancel(nextAction)) {
        p.cancel('Operation finished.');
        process.exit(0);
      }

      if (nextAction === 'handoff') {
        let selectedAdapterId = '';

        if (detected.length > 0) {
          const agentOptions = detected.map((d) => ({
            value: d.adapter.id,
            label: `${d.adapter.displayName} [Installed]`,
            hint: d.result.path ? path.basename(d.result.path) : 'Ready',
          }));

          const agentChoice = await p.select<string>({
            message: 'Select which existing CLI coding agent to launch:',
            options: agentOptions,
          });

          if (p.isCancel(agentChoice)) {
            p.cancel('Handoff cancelled.');
            return;
          }
          selectedAdapterId = agentChoice as string;
        } else {
          const allAdapters = defaultAgentDetector.getAllAdapters();
          const manualChoice = await p.select<string>({
            message: 'No agent was auto-detected on PATH. Choose an agent to launch or configure:',
            options: allAdapters.map((a) => ({
              value: a.id,
              label: a.displayName,
            })),
          });
          if (p.isCancel(manualChoice)) {
            p.cancel('Handoff cancelled.');
            return;
          }
          selectedAdapterId = manualChoice as string;
        }

        const adapter = defaultAgentDetector.getAdapter(selectedAdapterId);
        if (adapter) {
          const shouldLaunch = await p.confirm({
            message: `Launch ${adapter.displayName} now with CONTRIBUTION_PLAN.md?`,
            initialValue: true,
          });

          if (shouldLaunch && !p.isCancel(shouldLaunch)) {
            p.log.info(`Launching ${adapter.displayName}...`);
            await adapter.launch({
              cwd: process.cwd(),
              planFile: planPath,
              prompt: `You are helping me make an open-source contribution for issue #${pickedNumber}. Read the contribution plan at ${planPath} and show me your approach before editing files.`,
            });
          } else {
            p.log.info(`You can launch ${adapter.displayName} manually anytime with:\n  ${pc.cyan(`code ${planPath}`)} or ${pc.cyan(`claude "${planPath}"`)}`);
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
    p.log.step(`Developer: ${pc.bold(pc.white('Sayandeep Pradhan'))} ${pc.cyan('(https://github.com/sayandeep0212)')}`);

    // Keychain check
    try {
      await defaultTokenStore.getApiKey('gemini');
      p.log.step(`Secrets Store (keychain / encrypted vault): ${pc.green('Healthy')}`);
    } catch {
      p.log.warn(`Secrets Store: Falling back to encrypted local vault.`);
    }

    // Google Profile & Gemini Quota
    const userProfile = await defaultTokenStore.getUserProfile();
    const token = await defaultTokenStore.getToken();
    if (userProfile?.email && token) {
      p.log.step(`Google Account: ${pc.green(userProfile.email)} (${userProfile.name || 'User'})`);
      p.log.step(`Gemini Quota: ${pc.green('Active (Connected via Google Account)')}`);
    } else {
      p.log.step(`Google Account: ${pc.yellow('Not signed in')} (Run ${pc.cyan('contribpilot login')})`);
      const geminiKey = await defaultTokenStore.getApiKey('gemini');
      p.log.step(`Gemini Quota: ${geminiKey ? pc.green('Connected via Gemini API Key (BYOK)') : pc.yellow('Not connected (login or set key)')}`);
    }

    // ContribPilot Pro (Hosted Gemini Quota for paying users)
    const isPro = await defaultTokenStore.isProUser();
    const proKey = await defaultTokenStore.getApiKey('pro');
    const hostedKey = process.env.CONTRIBPILOT_HOSTED_GEMINI_KEY;
    if (isPro) {
      p.log.step(`ContribPilot Pro: ${pc.green(`Active (License: ${proKey ? proKey.slice(0, 8) + '...' : 'Valid'})`)}`);
      p.log.step(`Hosted Gemini Access: ${hostedKey ? pc.green('Ready & Active') : pc.yellow('Pro enabled (Hosted endpoint configured)')}`);
    } else {
      p.log.step(`ContribPilot Pro: ${pc.dim('Inactive (Run `contribpilot upgrade` to subscribe for hosted Gemini quota)')}`);
    }

    // Groq Auto-Failover
    const groqKey = (await defaultTokenStore.getApiKey('groq')) || process.env.GROQ_API_KEY;
    p.log.step(`Groq Failover: ${groqKey ? pc.green('Active (llama-3.3-70b auto-switches if Gemini quota ends)') : pc.dim('Not configured (Run `contribpilot config --groq <key>`)')}`);

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
  .description('Set Gemini API key (BYOK), Groq failover key, Pro license key, GitHub token, Google Client ID, or default level')
  .option('--gemini <key>', 'Set Gemini API key (BYOK mode)')
  .option('--groq <key>', 'Set Groq API key (automatic failover when Gemini quota ends)')
  .option('--pro <key>', 'Set ContribPilot Pro license key (to use hosted Gemini quota)')
  .option('--github <token>', 'Set GitHub Personal Access Token')
  .option('--google-client-id <id>', 'Set Google OAuth Client ID')
  .option('--google-client-secret <secret>', 'Set Google OAuth Client Secret')
  .option('--level <level>', 'Set default level (beginner | intermediate | pro)')
  .action(async (options) => {
    if (options.gemini) {
      await defaultTokenStore.setApiKey('gemini', options.gemini);
      p.log.success('Gemini API key saved to secure vault.');
    }
    if (options.groq) {
      await defaultTokenStore.setApiKey('groq', options.groq);
      p.log.success('Groq API key saved! Automatic failover is now active when Gemini quota ends.');
    }
    if (options.pro) {
      await defaultTokenStore.setApiKey('pro', options.pro);
      p.log.success('ContribPilot Pro license key saved! Hosted Gemini quota unlocked.');
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
    if (!options.gemini && !options.groq && !options.pro && !options.github && !options.googleClientId && !options.googleClientSecret && !options.level) {
      const currentLevel = config.get('level') || 'intermediate';
      const hasGemini = !!(await defaultTokenStore.getApiKey('gemini'));
      const hasGroq = !!(await defaultTokenStore.getApiKey('groq'));
      const isPro = await defaultTokenStore.isProUser();
      const hasGitHub = !!(await defaultTokenStore.getApiKey('github'));
      const hasGoogleId = !!config.get('googleClientId');
      console.log(`Current Configuration:\n  Level: ${currentLevel}\n  Gemini Key: ${hasGemini ? 'Set' : 'Not set'}\n  Groq Key: ${hasGroq ? 'Set (Failover Active)' : 'Not set'}\n  Pro Plan: ${isPro ? pc.green('Active') : pc.dim('Inactive')}\n  GitHub Token: ${hasGitHub ? 'Set' : 'Not set'}\n  Google Client ID: ${hasGoogleId ? 'Set' : 'Not set'}`);
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
// contribpilot upgrade / pro / pay
// ----------------------------------------------------
program
  .command('upgrade')
  .alias('pro')
  .alias('pay')
  .description('Upgrade to ContribPilot Pro to use hosted Gemini quota (opens payment webpage)')
  .option('--key <licenseKey>', 'Activate an existing Pro license key')
  .action(async (options) => {
    if (options.key) {
      await defaultTokenStore.setApiKey('pro', options.key.trim());
      p.log.success(`✓ Pro license key activated! ContribPilot Pro is now enabled.`);
      return;
    }

    const isPro = await defaultTokenStore.isProUser();
    const profile = await defaultTokenStore.getUserProfile();

    console.log(pc.bold(geminiGradient('\n=== ContribPilot Pro (Hosted Gemini Quota) ===\n')));
    console.log(`ContribPilot Pro provides managed Google Gemini 2.5 Flash access:`);
    console.log(`  ✓ No Google Cloud setup or personal API keys required`);
    console.log(`  ✓ Unlimited deep semantic issue ranking & synthesis`);
    console.log(`  ✓ Complete CONTRIBUTION_PLAN.md with reproduction steps & agent prompts`);
    console.log(`  ✓ Developed by Sayandeep Pradhan (https://github.com/sayandeep0212)\n`);

    if (isPro) {
      const proKey = await defaultTokenStore.getApiKey('pro');
      p.log.success(`You are already a ContribPilot Pro subscriber! (Key: ${proKey ? proKey.slice(0, 8) + '...' : 'Active'})`);
      const manageChoice = await p.select<string>({
        message: 'Manage your subscription:',
        options: [
          { value: 'billing', label: 'Open Billing & Invoices page in browser' },
          { value: 'update_key', label: 'Update Pro License Key' },
          { value: 'cancel', label: 'Done' },
        ],
      });
      if (manageChoice === 'billing') {
        const url = openPaymentPage(profile?.email);
        p.log.info(`Opening billing page in browser: ${pc.cyan(url)}`);
      } else if (manageChoice === 'update_key') {
        const newKey = await p.password({ message: 'Enter new Pro License Key:' });
        if (!p.isCancel(newKey) && typeof newKey === 'string' && newKey.trim()) {
          await defaultTokenStore.setApiKey('pro', newKey.trim());
          p.log.success('Pro license key updated.');
        }
      }
      return;
    }

    p.log.info(`Opening secure payment page in your browser...`);
    const paymentUrl = openPaymentPage(profile?.email);
    console.log(`\nIf your browser did not open automatically, visit this URL:\n${pc.cyan(paymentUrl)}\n`);

    const hasKey = await p.confirm({
      message: 'Have you completed payment and received your Pro License Key?',
      initialValue: false,
    });

    if (hasKey && !p.isCancel(hasKey)) {
      const key = await p.password({ message: 'Enter your Pro License Key:' });
      if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
        await defaultTokenStore.setApiKey('pro', key.trim());
        p.outro(pc.green(`✓ Successfully upgraded to ContribPilot Pro! Hosted Gemini quota is now active.`));
        return;
      }
    }

    p.outro(pc.dim(`You can activate your Pro subscription anytime with: ${pc.cyan('contribpilot config --pro <licenseKey>')}`));
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
    await runGoogleOAuthFlow(options.clientId, options.clientSecret);
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
    printBanner(VERSION);
    await ensureUserAuthenticatedBeforeAnalysis('analyze repository structure');

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
    printBanner(VERSION);
    await ensureUserAuthenticatedBeforeAnalysis('fetch and rank candidate issues');

    const spinner = ora(`Ranking issues for ${repoUrl} [${opts.level}]...`).start();
    try {
      const engine = new ContribPilotEngine();
      const { top3 } = await engine.getRankedIssues(repoUrl, opts.level);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(top3, null, 2));
      } else {
        console.log('\n' + renderBoxCard('Top Recommended Issues', [
          `Target Contribution Level: ${pc.bold(opts.level.toUpperCase())}`,
          `Filtered to non-competing, unassigned, reproducible issues.`,
        ], { borderColor: 'gradient' }) + '\n');

        top3.forEach((item, index) => {
          console.log(renderIssueCard(item, index + 1) + '\n');
        });
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
    printBanner(VERSION);
    await ensureUserAuthenticatedBeforeAnalysis('generate contribution pack');

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
// contribpilot quota
// ----------------------------------------------------
program
  .command('quota')
  .description('Inspect AI quotas (Google Gemini, Groq Failover, Pro Hosted, and device agents)')
  .action(async () => {
    printBanner(VERSION);
    console.log(pc.bold(geminiGradient('\n=== ContribPilot AI Quotas & System Status ===\n')));

    // 1. Google Gemini Quota
    const profile = await defaultTokenStore.getUserProfile();
    const token = await defaultTokenStore.getToken();
    const authService = new GoogleAuthService();

    if (token) {
      const quotaSpinner = ora('Checking Google Account Gemini quota...').start();
      const quota = await authService.fetchGeminiQuota(token.accessToken);
      if (quota.active) {
        quotaSpinner.succeed(`Google Gemini Quota: ${pc.green('ACTIVE')} (${profile?.email || 'OAuth Token'})`);
        console.log(`  Accessible Models: ${quota.models.slice(0, 5).join(', ')}${quota.models.length > 5 ? ` + ${quota.models.length - 5} more` : ''}`);
        const expiresInMins = Math.round((token.expiresAt - Date.now()) / 60000);
        console.log(`  Token Expiration: Valid for ${expiresInMins} more minutes (auto-refreshes seamlessly)`);
      } else {
        quotaSpinner.warn(`Google Gemini Quota: ${pc.yellow('Limited')} (${quota.message})`);
      }
    } else {
      console.log(`Google Account: ${pc.dim('Not signed in (Run `contribpilot login` to connect personal Google Gemini quota)')}`);
    }

    // 2. Personal BYOK Gemini Key
    const geminiKey = (await defaultTokenStore.getApiKey('gemini')) || process.env.GEMINI_API_KEY;
    console.log(`BYOK Gemini API Key: ${geminiKey ? pc.green('Configured (Google AI Studio quota)') : pc.dim('Not configured')}`);

    // 3. Groq Failover Quota
    const groqKey = (await defaultTokenStore.getApiKey('groq')) || process.env.GROQ_API_KEY;
    if (groqKey) {
      console.log(`Groq Failover: ${pc.green('ACTIVE (llama-3.3-70b-versatile auto-switches if Gemini quota ends)')}`);
    } else {
      console.log(`Groq Failover: ${pc.dim('Not configured (Run `contribpilot config --groq <key>` to enable auto-failover)')}`);
    }

    // 4. Pro Subscription & Hosted Quota
    const isPro = (await defaultTokenStore.isProUser()) || !!process.env.CONTRIBPILOT_PRO_KEY;
    const proKey = await defaultTokenStore.getApiKey('pro');
    if (isPro) {
      console.log(`ContribPilot Pro: ${pc.green(`ACTIVE (License: ${proKey ? proKey.slice(0, 8) + '...' : 'Verified'})`)}`);
      const hostedKey = process.env.CONTRIBPILOT_HOSTED_GEMINI_KEY;
      console.log(`  Hosted Gemini Access: ${hostedKey ? pc.green('Connected & Ready') : pc.yellow('Ready (Awaiting hosted key)')}`);
    } else {
      console.log(`ContribPilot Pro: ${pc.dim('Inactive (Run `contribpilot upgrade` to unlock hosted Gemini & security audit)')}`);
    }

    // 5. Detected CLI Coding Agents on machine
    console.log('\n' + pc.bold('Detected CLI Coding Agents on Device:'));
    const agents = await defaultAgentDetector.getInstalledAgents();
    if (agents.length > 0) {
      for (const a of agents) {
        console.log(`  ✔ ${pc.bold(pc.green(a.adapter.displayName))} -> ${pc.cyan(a.result.path || 'active')}`);
      }
    } else {
      console.log(pc.dim('  No coding agents found on system PATH.'));
    }
    console.log('');
  });

// ----------------------------------------------------
// contribpilot audit <repoUrl> (PRO FEATURE)
// ----------------------------------------------------
program
  .command('audit <repoUrl>')
  .alias('health')
  .description('[PRO FEATURE] Audit repository health, code structure, project summary & secret leaks')
  .option('--json', 'Output results as JSON')
  .action(async (repoUrl: string, opts: { json?: boolean }) => {
    printBanner(VERSION);

    // Check if user is Pro
    const isPro = (await defaultTokenStore.isProUser()) || !!process.env.CONTRIBPILOT_PRO_KEY;

    if (!isPro) {
      console.log(pc.bold(geminiGradient('\n🔒 ContribPilot Pro: Repository Health & Security Audit\n')));
      console.log(`The Repository Health & Security Audit includes:`);
      console.log(`  ✓ Complete Code Structure & Architectural Style Breakdown`);
      console.log(`  ✓ Code Health & Maintainability Scoring (Testing, CI/CD, Docs, Typing)`);
      console.log(`  ✓ Secret Leak Scanner across commit history & files (.env, AWS, GitHub tokens, database passwords)`);
      console.log(`  ✓ Executive Project Summary & REPO_HEALTH_AUDIT.md Export\n`);

      const shouldUpgrade = await p.confirm({
        message: 'This is a ContribPilot Pro feature. Would you like to upgrade now (opens payment webpage)?',
        initialValue: true,
      });

      if (shouldUpgrade && !p.isCancel(shouldUpgrade)) {
        const profile = await defaultTokenStore.getUserProfile();
        p.log.info('Opening secure payment webpage in your browser...');
        const paymentUrl = openPaymentPage(profile?.email);
        console.log(`\nIf your browser did not open automatically, visit this URL:\n${pc.cyan(paymentUrl)}\n`);

        const key = await p.password({ message: 'Enter your Pro License Key after completing payment:' });
        if (!p.isCancel(key) && typeof key === 'string' && key.trim()) {
          await defaultTokenStore.setApiKey('pro', key.trim());
          p.log.success('✓ Pro license key activated! Proceeding with deep audit...');
        } else {
          p.cancel('Upgrade skipped. Pro features remain locked.');
          return;
        }
      } else {
        p.cancel('Audit requires ContribPilot Pro subscription.');
        return;
      }
    }

    // Perform Audit
    const spinner = ora(`Auditing ${repoUrl} for health, architecture, and secret leaks...`).start();
    try {
      const engine = new ContribPilotEngine();
      const auditResult = await engine.auditRepo(repoUrl);
      spinner.succeed(`Audit complete for ${auditResult.repo.owner}/${auditResult.repo.name}!`);

      if (opts.json) {
        console.log(JSON.stringify(auditResult, null, 2));
        return;
      }

      console.log('\n' + pc.bold('=== Executive Project Summary ==='));
      console.log(auditResult.executiveSummary);

      console.log('\n' + pc.bold('=== Code Structure & Architecture ==='));
      console.log(`  Architecture: ${pc.cyan(auditResult.codeStructure.architecturalStyle)}`);
      console.log(`  Total Indexed Files: ${auditResult.codeStructure.totalFiles}`);
      console.log(`  Key Directories:`);
      for (const d of auditResult.codeStructure.directories.slice(0, 6)) {
        console.log(`    - ${pc.bold(d.path)} (${d.fileCount} files): ${pc.dim(d.role)}`);
      }

      console.log('\n' + pc.bold('=== Code Health & Quality Score ==='));
      const scoreColor = auditResult.health.overallScore >= 80 ? pc.green : auditResult.health.overallScore >= 60 ? pc.yellow : pc.red;
      console.log(`  Overall Health: ${scoreColor(pc.bold(`${auditResult.health.overallScore}/100 [${auditResult.health.rating}]`))}`);
      console.log(`  • Testing:         ${auditResult.health.breakdown.testing}/25`);
      console.log(`  • CI/CD Pipelines: ${auditResult.health.breakdown.ciCd}/25`);
      console.log(`  • Documentation:   ${auditResult.health.breakdown.documentation}/25`);
      console.log(`  • Maintainability: ${auditResult.health.breakdown.maintainability}/25`);

      if (auditResult.health.strengths.length > 0) {
        console.log('\n  ' + pc.green('Strengths:'));
        for (const s of auditResult.health.strengths) console.log(`    ✔ ${s}`);
      }
      if (auditResult.health.recommendations.length > 0) {
        console.log('\n  ' + pc.yellow('Recommendations:'));
        for (const r of auditResult.health.recommendations) console.log(`    ➜ ${r}`);
      }

      console.log('\n' + pc.bold('=== Secret Leak & Security Scan ==='));
      if (auditResult.security.safe) {
        console.log(`  ${pc.green('✔ SAFE: 0 secret leaks detected across commits and codebase files.')}`);
      } else {
        console.log(`  ${pc.red(`⚠️ DETECTED ${auditResult.security.leaks.length} LEAKED SECRETS!`)}`);
        for (const leak of auditResult.security.leaks) {
          const sevColor = leak.severity === 'CRITICAL' ? pc.bgRed(pc.white(' CRITICAL ')) : pc.bgYellow(pc.black(' HIGH '));
          console.log(`\n  ${sevColor} ${pc.bold(leak.type)} in ${pc.cyan(leak.source)}`);
          console.log(`    Sample: ${pc.dim(leak.sample)}`);
          console.log(`    Remediation: ${pc.yellow(leak.remediation)}`);
        }
      }

      // Write REPO_HEALTH_AUDIT.md
      const auditMdPath = path.join(process.cwd(), 'REPO_HEALTH_AUDIT.md');
      const mdContent = `# Repository Health & Security Audit: ${auditResult.repo.owner}/${auditResult.repo.name}\n\n` +
        `**Generated by ContribPilot Pro** | Developer: Sayandeep Pradhan (https://github.com/sayandeep0212)\n\n` +
        `## Executive Summary\n${auditResult.executiveSummary}\n\n` +
        `## Health Score: ${auditResult.health.overallScore}/100 (${auditResult.health.rating})\n` +
        `- Testing: ${auditResult.health.breakdown.testing}/25\n` +
        `- CI/CD: ${auditResult.health.breakdown.ciCd}/25\n` +
        `- Documentation: ${auditResult.health.breakdown.documentation}/25\n` +
        `- Maintainability: ${auditResult.health.breakdown.maintainability}/25\n\n` +
        `## Architecture & Code Structure\n` +
        `Architectural Style: **${auditResult.codeStructure.architecturalStyle}** (${auditResult.codeStructure.totalFiles} files)\n\n` +
        auditResult.codeStructure.directories.map((d) => `- \`${d.path}\`: ${d.role} (${d.fileCount} files)`).join('\n') +
        `\n\n## Secret Leak Scanner Results\n` +
        (auditResult.security.safe ? `✔ **Zero secret leaks found.**` : auditResult.security.leaks.map((l) => `### ⚠️ ${l.type} (${l.severity})\n- **Source**: \`${l.source}\`\n- **Remediation**: ${l.remediation}`).join('\n\n')) +
        `\n\n## Actionable Recommendations\n` +
        auditResult.health.recommendations.map((r) => `- ${r}`).join('\n') + '\n';

      fs.writeFileSync(auditMdPath, mdContent, 'utf8');
      p.outro(pc.green(`✓ Audit report generated and exported to ${pc.bold(auditMdPath)}`));
    } catch (err: unknown) {
      spinner.stop();
      p.log.error(err instanceof Error ? err.message : String(err));
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

// ----------------------------------------------------
// contribpilot about
// ----------------------------------------------------
program
  .command('about')
  .description('Show information about ContribPilot and developer')
  .action(() => {
    printBanner(VERSION);
  });

program.parse(process.argv);
