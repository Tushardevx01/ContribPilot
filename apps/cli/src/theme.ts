import gradient from 'gradient-string';
import figlet from 'figlet';
import pc from 'picocolors';
import type { RankedIssue } from '@contribpilot/shared';

// Exact Gemini gradient: Cyan -> Google Blue -> Indigo -> Violet -> Magenta -> Pink -> Rose
export const geminiGradient = gradient([
  '#38bdf8', // Cyan
  '#4285f4', // Google Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Magenta
  '#ec4899', // Pink
  '#f43f5e', // Rose
]);

// Secondary neon gradient
export const neonGradient = gradient(['#06b6d4', '#10b981', '#84cc16']);

// Strip ANSI escape codes to calculate visual string width
export function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export function formatGeminiTag(text: string): string {
  const chevron = pc.bold(pc.cyan('> '));
  return `${chevron}${geminiGradient(text)}`;
}

export function renderGeminiLogoTag(): string {
  return pc.bold(`${pc.cyan('>')} ${geminiGradient('GEMINI')}`);
}

export function printBanner(version = '0.1.0'): void {
  try {
    const ascii = figlet.textSync('ContribPilot', {
      font: 'Slant',
      horizontalLayout: 'fitted',
    });
    console.log('\n' + geminiGradient.multiline(ascii));
  } catch {
    console.log('\n' + geminiGradient('  === CONTRIBPILOT ===  '));
  }

  const border = pc.dim('─'.repeat(66));
  console.log(border);
  console.log(`  ${renderGeminiLogoTag()} ${pc.bold('ContribPilot')} ${pc.dim(`v${version}`)} · ${pc.white('AI Open-Source Contribution Engine')}`);
  console.log(`  ${pc.dim('Developer:')} ${pc.bold(pc.white('Sayandeep Pradhan'))} ${pc.cyan('(https://github.com/sayandeep0212)')}`);
  console.log(border + '\n');
}

export function renderBoxCard(
  title: string,
  lines: string[],
  options: {
    borderColor?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'gradient';
    minWidth?: number;
  } = {}
): string {
  const minW = options.minWidth || 68;
  const contentWidths = lines.map((l) => stripAnsi(l).length);
  const titleWidth = stripAnsi(title).length;
  const maxContentW = Math.max(titleWidth + 4, ...contentWidths, minW);
  const width = Math.min(84, maxContentW + 4);

  const topBorder = '╭' + '─'.repeat(width) + '╮';
  const divider = '├' + '─'.repeat(width) + '┤';
  const bottomBorder = '╰' + '─'.repeat(width) + '╯';

  let colorFn = (s: string) => pc.cyan(s);
  if (options.borderColor === 'magenta') colorFn = (s: string) => pc.magenta(s);
  else if (options.borderColor === 'green') colorFn = (s: string) => pc.green(s);
  else if (options.borderColor === 'yellow') colorFn = (s: string) => pc.yellow(s);
  else if (options.borderColor === 'gradient') colorFn = (s: string) => geminiGradient(s);

  const titlePad = ' '.repeat(Math.max(0, width - stripAnsi(title).length - 3));
  const headerLine = `${colorFn('│')} ${pc.bold(title)}${titlePad} ${colorFn('│')}`;

  const bodyLines = lines.map((line) => {
    const visibleLength = stripAnsi(line).length;
    const pad = ' '.repeat(Math.max(0, width - visibleLength - 2));
    return `${colorFn('│')}  ${line}${pad}${colorFn('│')}`;
  });

  return [
    colorFn(topBorder),
    headerLine,
    colorFn(divider),
    ...bodyLines,
    colorFn(bottomBorder),
  ].join('\n');
}

export function renderAccountStatusHeader(user: {
  email?: string;
  name?: string;
  quotaActive?: boolean;
  modelCount?: number;
  isPro?: boolean;
  byok?: boolean;
}): void {
  const badgeMode = user.quotaActive
    ? pc.bgGreen(pc.black(' GOOGLE GEMINI ACTIVE '))
    : user.isPro
    ? pc.bgMagenta(pc.white(' CONTRIBPILOT PRO '))
    : user.byok
    ? pc.bgCyan(pc.black(' BYOK GEMINI '))
    : pc.bgYellow(pc.black(' OFFLINE MODE '));

  console.log(`\n${badgeMode} ${user.email ? pc.bold(pc.green(user.email)) : pc.yellow('Not Signed In')}`);
  if (user.quotaActive) {
    console.log(`  ${pc.dim('Gemini Quota:')} ${pc.green('Connected via Google OAuth')} ${user.modelCount ? pc.dim(`(${user.modelCount} models accessible)`) : ''}`);
  } else if (user.isPro) {
    console.log(`  ${pc.dim('Gemini Quota:')} ${pc.magenta('ContribPilot Pro Hosted Quota Unlocked')}`);
  } else if (user.byok) {
    console.log(`  ${pc.dim('Gemini Quota:')} ${pc.cyan('Personal API Key Configured')}`);
  } else {
    console.log(`  ${pc.dim('Gemini Quota:')} ${pc.yellow('Offline Mode · Sign in with Google to enable AI evaluation')}`);
  }
  console.log('');
}

export function formatRecommendedBadge(score: number): string {
  const label = geminiGradient(' ★ MOST RECOMMENDED ');
  return `${label} ${pc.bold(`(Match Score: ${pc.cyan(score)}/100)`)}`;
}

export function renderIssueCard(item: RankedIssue, rankNumber: number): string {
  const isRec = item.mostRecommended;
  const badge = isRec
    ? pc.bgGreen(pc.black(` RANK #${rankNumber} ★ MOST RECOMMENDED `))
    : pc.bgBlue(pc.white(` RANK #${rankNumber} ALTERNATIVE `));

  const scoreStr = isRec ? pc.bold(pc.green(`${item.score}/100`)) : pc.cyan(`${item.score}/100`);

  const lines = [
    `${badge}  ${scoreStr}`,
    `${pc.bold(pc.white(`#${item.issue.number} ${item.issue.title}`))}`,
    '',
    `  ${pc.cyan('✦ Why It Fits:')} ${item.fitReason}`,
    `  ${pc.yellow('⏱ Estimated Effort:')} ${item.estimatedEffort}`,
    `  ${pc.red('⚠️ Potential Risks:')} ${item.risks.join(', ')}`,
    item.likelyFiles.length > 0 ? `  ${pc.magenta('📁 Target Files:')} ${item.likelyFiles.slice(0, 3).join(', ')}` : '',
    `  ${pc.dim('🔗 Issue Link:')} ${pc.underline(pc.cyan(item.issue.url))}`,
  ].filter(Boolean);

  return renderBoxCard(
    `Issue #${item.issue.number} - Candidate Analysis`,
    lines,
    { borderColor: isRec ? 'gradient' : 'cyan', minWidth: 70 }
  );
}

export function formatStageHeader(stage: string): string {
  return formatGeminiTag(stage.toUpperCase());
}
