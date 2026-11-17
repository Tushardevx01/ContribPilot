import which from 'which';
import { execa } from 'execa';
import type { AgentAdapter, AgentDetectionResult } from '@contribpilot/shared';

export interface LaunchOptions {
  cwd: string;
  planFile: string;
  prompt: string;
}

abstract class BaseAgentAdapter implements AgentAdapter {
  abstract id: string;
  abstract displayName: string;
  abstract binary: string;

  async detect(): Promise<AgentDetectionResult> {
    try {
      const binPath = await which(this.binary, { nothrow: true });
      if (!binPath) {
        return { installed: false };
      }
      try {
        const { stdout } = await execa(binPath, ['--version'], { timeout: 3000 });
        return { installed: true, path: binPath, version: stdout.trim().split('\n')[0] };
      } catch {
        return { installed: true, path: binPath };
      }
    } catch {
      return { installed: false };
    }
  }

  abstract launch(opts: LaunchOptions): Promise<void>;
}

export class ClaudeCodeAdapter extends BaseAgentAdapter {
  id = 'claude';
  displayName = 'Claude Code';
  binary = 'claude';

  async launch(opts: LaunchOptions): Promise<void> {
    const fullPrompt = `${opts.prompt}\n\nPlease read plan file: ${opts.planFile}`;
    await execa(this.binary, [fullPrompt], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class GeminiCLIAdapter extends BaseAgentAdapter {
  id = 'gemini';
  displayName = 'Gemini CLI';
  binary = 'gemini';

  async launch(opts: LaunchOptions): Promise<void> {
    const fullPrompt = `${opts.prompt}\n\nPlease read plan file: ${opts.planFile}`;
    await execa(this.binary, ['-i', fullPrompt], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class AiderAdapter extends BaseAgentAdapter {
  id = 'aider';
  displayName = 'Aider';
  binary = 'aider';

  async launch(opts: LaunchOptions): Promise<void> {
    await execa(this.binary, ['--message', opts.prompt, opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class CodexAdapter extends BaseAgentAdapter {
  id = 'codex';
  displayName = 'OpenAI Codex';
  binary = 'codex';

  async launch(opts: LaunchOptions): Promise<void> {
    await execa(this.binary, [opts.prompt], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class CursorAgentAdapter extends BaseAgentAdapter {
  id = 'cursor';
  displayName = 'Cursor Agent';
  binary = 'cursor-agent';

  async launch(opts: LaunchOptions): Promise<void> {
    await execa(this.binary, [opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class VSCodeAdapter extends BaseAgentAdapter {
  id = 'code';
  displayName = 'Visual Studio Code';
  binary = 'code';

  async launch(opts: LaunchOptions): Promise<void> {
    await execa(this.binary, [opts.cwd, opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class AgentDetector {
  private adapters: BaseAgentAdapter[] = [
    new ClaudeCodeAdapter(),
    new GeminiCLIAdapter(),
    new AiderAdapter(),
    new CodexAdapter(),
    new CursorAgentAdapter(),
    new VSCodeAdapter(),
  ];

  async getInstalledAgents(): Promise<{ adapter: AgentAdapter; result: AgentDetectionResult }[]> {
    const detected: { adapter: AgentAdapter; result: AgentDetectionResult }[] = [];
    for (const adapter of this.adapters) {
      const result = await adapter.detect();
      if (result.installed) {
        detected.push({ adapter, result });
      }
    }
    return detected;
  }

  getAdapter(id: string): AgentAdapter | undefined {
    return this.adapters.find((a) => a.id === id);
  }
}

export const defaultAgentDetector = new AgentDetector();
