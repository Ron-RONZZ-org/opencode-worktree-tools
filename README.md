# opencode-worktree-tools

Global OpenCode plugin for **isolated git worktrees** — rewritten from [opencode-worktree](https://github.com/kdcokenny/opencode-worktree) using the same patterns as `opencode-git-tools`.

## Features

- **worktreeCreate** — create a git worktree, sync config files, run hooks, fork session, spawn terminal with OpenCode
- **worktreeDelete** — mark session for cleanup (auto-commit + remove worktree on `session.idle`)
- **worktreeList** — list plugin sessions and `git worktree list`
- AI guidance hooks (instructions + message transform + compacting)
- Slash commands: `/worktree-create`, `/worktree-delete`, `/worktree-list`

## Improvements over upstream

| Area | Change |
|------|--------|
| Architecture | Follows `opencode-git-tools` plugin + install + commands layout |
| Dependencies | No OCX / jsonc-parser / zod — uses `tool.schema` and built-in JSONC stripper |
| Launch | Plain `opencode --session <id>` (no OCX profile required) |
| Commit | Quiet file-based commit on delete (no terminal noise) |
| Tools | Added `worktreeList`; camelCase tool names matching git tools |
| Windows | First-class Windows Terminal + cmd fallback |

## Install

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

```bash
./install.sh
```

Restart OpenCode after install.

## Configuration

Auto-created at `.opencode/worktree.jsonc`:

```jsonc
{
  "worktreePath": "~/my-worktrees",  // optional
  "sync": {
    "copyFiles": [".env", ".env.local"],
    "symlinkDirs": ["node_modules"]
  },
  "hooks": {
    "postCreate": ["npm install"],
    "preDelete": ["docker compose down"]
  }
}
```

Worktrees are stored at `~/.local/share/opencode/worktree/<project-id>/<branch>/` by default.

## Verify

```bash
opencode run "call worktreeList and show the result"
```

In TUI: `/worktree-list`

## License

MIT