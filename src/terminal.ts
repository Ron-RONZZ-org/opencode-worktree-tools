import { chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { buildBashArgv, buildBatchArgv, escapeBash, escapeBatch } from "./shell";

export interface TerminalResult {
  success: boolean;
  error?: string;
}

function isInsideTmux(): boolean {
  return !!process.env.TMUX;
}

function wrapBashSelfCleanup(script: string): string {
  return `#!/bin/bash
trap 'rm -f "$0"' EXIT INT TERM
${script}`;
}

function wrapBatchSelfCleanup(script: string): string {
  return `@echo off
${script}
(goto) 2>nul & del "%~f0"`;
}

async function writeTempScript(content: string, ext: ".sh" | ".bat"): Promise<string> {
  const scriptPath = path.join(
    tmpdir(),
    `oc-worktree-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
  );
  await Bun.write(scriptPath, content);
  await chmod(scriptPath, 0o755);
  return scriptPath;
}

export async function openTmuxWindow(options: {
  windowName: string;
  cwd: string;
  argv?: string[];
}): Promise<TerminalResult> {
  const { windowName, cwd, argv = [] } = options;
  const command = argv.length ? buildBashArgv(argv) : "";

  try {
    const tmuxArgs = ["new-window", "-n", windowName, "-c", cwd];
    if (command) {
      const scriptPath = await writeTempScript(
        wrapBashSelfCleanup(`cd "${escapeBash(cwd)}" || exit 1\n${command}\nexec $SHELL`),
        ".sh",
      );
      tmuxArgs.push("--", "bash", scriptPath);
    }

    const result = Bun.spawnSync(["tmux", ...tmuxArgs]);
    if (result.exitCode !== 0) {
      return { success: false, error: result.stderr.toString().trim() || "tmux new-window failed" };
    }
    await Bun.sleep(150);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function openWindowsTerminal(cwd: string, argv: string[] = []): Promise<TerminalResult> {
  if (!cwd) return { success: false, error: "Working directory is required" };

  const command = argv.length ? buildBatchArgv(argv) : "";
  const scriptContent = wrapBatchSelfCleanup(
    command
      ? `cd /d "${escapeBatch(cwd)}"\r\n${command}\r\ncmd /k`
      : `cd /d "${escapeBatch(cwd)}"\r\ncmd /k`,
  );

  const scriptPath = await writeTempScript(scriptContent, ".bat");

  try {
    const wtCheck = Bun.spawnSync(["where", "wt"], { stdout: "pipe", stderr: "pipe" });
    if (wtCheck.exitCode === 0) {
      const proc = Bun.spawn(["wt.exe", "-d", cwd, "cmd", "/k", scriptPath], {
        detached: true,
        stdio: ["ignore", "ignore", "ignore"],
      });
      proc.unref();
      return { success: true };
    }

    const proc = Bun.spawn(["cmd", "/c", "start", "", scriptPath], {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    });
    proc.unref();
    return { success: true };
  } catch (error) {
    await rm(scriptPath, { force: true }).catch(() => {});
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function openUnixTerminal(cwd: string, argv: string[] = []): Promise<TerminalResult> {
  if (!cwd) return { success: false, error: "Working directory is required" };

  const command = argv.length ? buildBashArgv(argv) : "";
  const scriptContent = wrapBashSelfCleanup(
    command
      ? `cd "${escapeBash(cwd)}" && ${command}\nexec bash`
      : `cd "${escapeBash(cwd)}"\nexec bash`,
  );
  const scriptPath = await writeTempScript(scriptContent, ".sh");

  const attempts: Array<{ name: string; args: string[] }> = [
    { name: "xdg-terminal-exec", args: ["xdg-terminal-exec", "--", "bash", scriptPath] },
    { name: "gnome-terminal", args: ["gnome-terminal", "--working-directory", cwd, "--", "bash", scriptPath] },
    { name: "kitty", args: ["kitty", "--directory", cwd, "-e", "bash", scriptPath] },
    { name: "open", args: ["open", "-a", "Terminal", scriptPath] },
  ];

  for (const { name, args } of attempts) {
    const check = Bun.spawnSync(["which", name], { stdout: "pipe", stderr: "pipe" });
    if (check.exitCode !== 0) continue;
    try {
      const proc = Bun.spawn(args, { detached: true, stdio: ["ignore", "ignore", "ignore"] });
      proc.unref();
      return { success: true };
    } catch {
      // try next terminal
    }
  }

  await rm(scriptPath, { force: true }).catch(() => {});
  return { success: false, error: "No supported terminal emulator found" };
}

export async function openTerminal(
  cwd: string,
  argv: string[] = [],
  windowName?: string,
): Promise<TerminalResult> {
  if (isInsideTmux()) {
    return openTmuxWindow({ windowName: windowName ?? "worktree", cwd, argv });
  }

  if (process.platform === "win32") {
    return openWindowsTerminal(cwd, argv);
  }

  return openUnixTerminal(cwd, argv);
}

export function buildOpenCodeLaunchArgv(sessionId: string): string[] {
  return ["opencode", "--session", sessionId];
}