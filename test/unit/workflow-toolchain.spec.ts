import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const WORKFLOW_DIR = join(process.cwd(), '.github', 'workflows');

// Commands that fetch a toolchain from the registry.
const INSTALL_CMD = /\b(?:npm|yarn\s+dlx|pnpm\s+dlx|npx)\b[^\n]*/g;
// A mutable dist-tag on an install spec (`pkg@latest`, `@scope/pkg@next`).
const MUTABLE_TAG = /@(?:latest|next|beta|canary|rc)\b/;
// A bare unpinned global install of the package manager (`npm i -g npm`).
const UNPINNED_GLOBAL = /\b(?:install|i|add)\s+(?:-g|--global)\b[^\n]*\b(?:npm|yarn|pnpm)\b(?!@\d)/;

function workflowFiles(): string[] {
  return readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
}

describe('workflow toolchain pinning', () => {
  it('does not fetch any toolchain from a mutable tag inside a workflow', () => {
    const offenders: string[] = [];

    for (const file of workflowFiles()) {
      const path = join(WORKFLOW_DIR, file);
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const cmd of line.match(INSTALL_CMD) ?? []) {
            if (MUTABLE_TAG.test(cmd) || UNPINNED_GLOBAL.test(cmd)) {
              offenders.push(`${file}:${i + 1}: ${cmd.trim()}`);
            }
          }
        });
    }

    expect(offenders, `Mutable toolchain references found in workflows:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('pins the npm CLI used by the OIDC publish job to an exact version', () => {
    const publish = readFileSync(join(WORKFLOW_DIR, 'publish.yml'), 'utf8');
    // The publish job holds `id-token: write`; its toolchain must be immutable.
    expect(publish).toMatch(/npm@\d+\.\d+\.\d+/);
    expect(publish).not.toMatch(/npm@latest/);
    expect(publish).toMatch(/--ignore-scripts/);
  });
});
