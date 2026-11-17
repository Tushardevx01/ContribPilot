import which from 'which';
import { execa } from 'execa';
import type { AgentAdapter, AgentDetectionResult } from '@contribpilot/shared';

export interface LaunchOptions {
  cwd: string;
  planFile: string;
  prompt: string;
}

export abstract class BaseAgentAdapter implements AgentAdapter {
  abstract id: string;
  abstract displayName: string;
  abstract candidateBinaries: string[];
  resolvedPath?: string;

  async detect(): Promise<AgentDetectionResult> {
    for (const bin of this.candidateBinaries) {
      try {
        const binPath = await which(bin, { nothrow: true });
        if (binPath) {
          this.resolvedPath = binPath;
          try {
            const { stdout } = await execa(binPath, ['--version'], { timeout: 3000 });
            const firstLine = stdout.trim().split('\n')[0] || '';
            return { installed: true, path: binPath, version: firstLine };
          } catch {
            return { installed: true, path: binPath };
          }
        }
      } catch {
        // Continue checking other candidate binaries
      }
    }
    return { installed: false };
  }

  abstract launch(opts: LaunchOptions): Promise<void>;
}

export class ClaudeCodeAdapter extends BaseAgentAdapter {
  id = 'claude';
  displayName = 'Claude Code';
  candidateBinaries = ['claude', 'claude.exe'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'claude';
    const initialPrompt = `${opts.prompt}\n\nContribution Plan File: ${opts.planFile}`;
    await execa(bin, [initialPrompt], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class GeminiCLIAdapter extends BaseAgentAdapter {
  id = 'gemini';
  displayName = 'Gemini CLI';
  candidateBinaries = ['gemini', 'gemini.cmd', 'gemini.exe'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'gemini';
    const initialPrompt = `${opts.prompt}\n\nContribution Plan File: ${opts.planFile}`;
    await execa(bin, ['-i', initialPrompt], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class OpenCodeAdapter extends BaseAgentAdapter {
  id = 'opencode';
  displayName = 'OpenCode';
  candidateBinaries = ['opencode', 'opencode.cmd', 'opencode.exe'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'opencode';
    await execa(bin, [opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class AiderAdapter extends BaseAgentAdapter {
  id = 'aider';
  displayName = 'Aider';
  candidateBinaries = ['aider', 'aider.exe'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'aider';
    await execa(bin, ['--message', opts.prompt, opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class CodexAdapter extends BaseAgentAdapter {
  id = 'codex';
  displayName = 'OpenAI Codex';
  candidateBinaries = ['codex', 'codex.exe'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'codex';
    await execa(bin, [opts.prompt], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class CursorAgentAdapter extends BaseAgentAdapter {
  id = 'cursor';
  displayName = 'Cursor';
  candidateBinaries = ['cursor', 'cursor.cmd', 'cursor.exe', 'cursor-agent'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'cursor';
    // Opens the repository folder and the plan file directly inside Cursor
    await execa(bin, [opts.cwd, opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class VSCodeAdapter extends BaseAgentAdapter {
  id = 'code';
  displayName = 'Visual Studio Code';
  candidateBinaries = ['code', 'code.cmd', 'code.exe'];

  async launch(opts: LaunchOptions): Promise<void> {
    const bin = this.resolvedPath || 'code';
    // Opens the repository folder and the plan file directly inside VS Code
    await execa(bin, [opts.cwd, opts.planFile], {
      cwd: opts.cwd,
      stdio: 'inherit',
    });
  }
}

export class AgentDetector {
  private adapters: BaseAgentAdapter[] = [
    new ClaudeCodeAdapter(),
    new GeminiCLIAdapter(),
    new OpenCodeAdapter(),
    new CursorAgentAdapter(),
    new VSCodeAdapter(),
    new AiderAdapter(),
    new CodexAdapter(),
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
