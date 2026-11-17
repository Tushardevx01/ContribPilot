import gradient from 'gradient-string';
import figlet from 'figlet';
import pc from 'picocolors';

// Exact Gemini gradient: Google Blue -> Indigo -> Violet -> Magenta -> Pink -> Rose
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

// Secondary subtle gradient for badges and highlights
export const sunsetGradient = gradient(['#f59e0b', '#ef4444', '#ec4899']);

export function formatGeminiTag(text: string): string {
  const chevron = pc.bold(pc.cyan('> '));
  return `${chevron}${geminiGradient(text)}`;
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
  console.log(`  ${formatGeminiTag(`ContribPilot v${version}`)} ${pc.dim('· AI-Powered Open Source Contribution Assistant')}`);
  console.log(`  ${pc.dim('Developer:')} ${pc.bold(pc.white('Sayandeep Pradhan'))} ${pc.cyan('(https://github.com/sayandeep0212)')}\n`);
}

export function formatRecommendedBadge(score: number): string {
  const label = geminiGradient(' ★ MOST RECOMMENDED ');
  return `${label} ${pc.bold(`(Score: ${pc.cyan(score)})`)}`;
}

export function formatStageHeader(stage: string): string {
  return formatGeminiTag(stage.toUpperCase());
}
