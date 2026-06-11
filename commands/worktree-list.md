---
description: List plugin-managed worktrees and git worktree status
agent: build
---

Call `worktreeList` and summarize:
- Active plugin-managed sessions (branch, path, session id)
- All git worktrees from the repository
- Default storage location pattern

Prefer this over `git worktree list` bash.