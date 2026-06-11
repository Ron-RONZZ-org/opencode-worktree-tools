---
description: Create an isolated git worktree with OpenCode in a new terminal
agent: build
---

Use plugin tools only — do not run raw `git worktree` bash.

1. If needed, confirm the branch name with the user. Use `$ARGUMENTS` as the branch when provided.
2. Call `worktreeCreate` with `branch` (required) and optional `baseBranch`.
3. Summarize: worktree path, branch, session id, and that a new terminal was spawned.

Example branch names: `feature/dark-mode`, `fix/login-bug`, `experiment/refactor`.