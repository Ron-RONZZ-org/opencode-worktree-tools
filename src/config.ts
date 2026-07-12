import { mkdir } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export interface WorktreeConfig {
  worktreePath?: string;
  sync: {
    copyFiles: string[];
    symlinkDirs: string[];
    exclude: string[];
  };
  hooks: {
    postCreate: string[];
    preDelete: string[];
  };
}

const DEFAULT_CONFIG: WorktreeConfig = {
  sync: { copyFiles: [], symlinkDirs: [], exclude: [] },
  hooks: { postCreate: [], preDelete: [] },
};

const DEFAULT_CONFIG_TEMPLATE = `{
  "$schema": "https://opencode.ai/config.json",

  // Custom base path for worktree storage (supports ~)
  // Default: ~/.local/share/opencode/worktree
  // "worktreePath": "~/my-worktrees",

  "sync": {
    "copyFiles": [],
    "symlinkDirs": [],
    "exclude": []
  },

  "hooks": {
    "postCreate": [],
    "preDelete": []
  }
}
`;

/** Strip // and /* comments from JSONC (simple, sufficient for config files). */
function stripJsoncComments(text: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      i++;
      continue;
    }

    if (ch === "/" && next === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

function resolveHomePath(p: string): string {
  if (p === "~" || p.startsWith("~/") || p.startsWith("~\\")) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

function normalizeConfig(raw: unknown): WorktreeConfig {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sync = (obj.sync && typeof obj.sync === "object" ? obj.sync : {}) as Record<string, unknown>;
  const hooks = (obj.hooks && typeof obj.hooks === "object" ? obj.hooks : {}) as Record<string, unknown>;

  const config: WorktreeConfig = {
    sync: {
      copyFiles: Array.isArray(sync.copyFiles) ? sync.copyFiles.filter((x) => typeof x === "string") : [],
      symlinkDirs: Array.isArray(sync.symlinkDirs) ? sync.symlinkDirs.filter((x) => typeof x === "string") : [],
      exclude: Array.isArray(sync.exclude) ? sync.exclude.filter((x) => typeof x === "string") : [],
    },
    hooks: {
      postCreate: Array.isArray(hooks.postCreate) ? hooks.postCreate.filter((x) => typeof x === "string") : [],
      preDelete: Array.isArray(hooks.preDelete) ? hooks.preDelete.filter((x) => typeof x === "string") : [],
    },
  };

  if (typeof obj.worktreePath === "string" && obj.worktreePath.trim()) {
    config.worktreePath = resolveHomePath(obj.worktreePath.trim());
  }

  return config;
}

export function getDefaultWorktreeBase(): string {
  return path.join(os.homedir(), ".local", "share", "opencode", "worktree");
}

export async function loadWorktreeConfig(
  directory: string,
  log: (level: "info" | "warn", msg: string) => void,
): Promise<WorktreeConfig> {
  const configPath = path.join(directory, ".opencode", "worktree.jsonc");

  try {
    const file = Bun.file(configPath);
    if (!(await file.exists())) {
      await mkdir(path.join(directory, ".opencode"), { recursive: true });
      await Bun.write(configPath, DEFAULT_CONFIG_TEMPLATE);
      log("info", `Created default config: ${configPath}`);
      return { ...DEFAULT_CONFIG };
    }

    const parsed = JSON.parse(stripJsoncComments(await file.text()));
    return normalizeConfig(parsed);
  } catch (error) {
    log("warn", `Failed to load worktree config: ${error}`);
    return { ...DEFAULT_CONFIG };
  }
}