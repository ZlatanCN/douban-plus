## Agent skills

### Issue tracker

Issues and PRs are tracked on GitHub Issues. External PRs are treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The standard five triage labels are used. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` at the repo root. See `docs/agents/domain.md`.

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
