---
description: Delete the current worktree session (commit + cleanup on session end)
agent: build
---

Use plugin tools only.

1. Call `worktreeList` if you need to confirm the current worktree context.
2. Call `worktreeDelete` with a short `reason`. Use `$ARGUMENTS` as the reason when provided.
3. Tell the user cleanup runs when the session ends (commit snapshot + worktree removal).

Do not run `git worktree remove` in bash when worktreeDelete is available.