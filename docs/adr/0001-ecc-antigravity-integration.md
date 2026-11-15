# ADR 0001: Integration of Everything Claude Code (ECC) in Google Antigravity

## Status
Accepted

## Date
2026-11-15

## Context
GK WhizWheel is a multi-vertical operations platform built with Laravel 11, React 18, and MySQL. To establish consistent engineering rigor, automated workflows, planning protocols, code review standards, and architectural persistence across development sessions, we evaluated integrating Everything Claude Code (ECC) v2.2.3 into our Google Antigravity 2.0 workspace.

Google Antigravity 2.0 uses project-local `.agents/` as its discovery root for workspace rules, workflows, skills, and agents. We needed a clean, non-destructive installation method that:
1. Adheres to ECC's official native Antigravity installation target (`--target antigravity`).
2. Does NOT copy Claude Code-specific configs, hooks, or plugins blindly.
3. Preserves all existing custom tools, including Graphify (`graphify-out/`, `.agents/rules/graphify.md`), `security-audit`, and `ui-ux-pro-max`.
4. Provides continuous learning and architectural memory across fresh Antigravity conversations.

## Decision
1. **Official Native Target:**
   Installed ECC v2.2.3 using ECC's official Antigravity target:
   ```bash
   install.sh --profile developer --target antigravity
   ```
   This automatically maps:
   - Rules: `rules/` -> `.agents/rules/` (with Antigravity `trigger: always_on` and `trigger: glob` frontmatter)
   - Workflows: `commands/` -> `.agents/workflows/` (slash workflows executable via `/<workflow>`)
   - Skills: `skills/` -> `.agents/skills/` (with compliant `SKILL.md`)
   - Agents: `agents/` -> `.agents/agents/` (with Antigravity tool and model tier adaptations)

2. **Supported Capabilities in Antigravity:**
   - 123 Workspace Rules with automatic glob/always_on triggers.
   - 99 Slash Workflows (`/plan`, `/tdd`, `/code-review`, `/build-fix`, etc.).
   - 135 Agent Skills including `laravel-patterns`, `react-patterns`, `codebase-onboarding`, `database-migrations`, `architecture-decision-records`.
   - 71 Custom Agents and Subagents with Antigravity tool mappings and `flash`/`pro` models.
   - State tracking & diagnostics via `.agents/ecc-install-state.json`, `scripts/doctor.js`, and `scripts/list-installed.js`.

3. **Unsupported / Inactive Features in Antigravity:**
   - **Claude Code Hooks:** Antigravity does not execute arbitrary shell hooks before/after tool calls. ECC installer automatically skips `hooks-runtime`.
   - **Claude Code Plugin Manager:** Antigravity relies on `.agents/` and MCP configurations rather than Claude plugin slugs.
   - **Interactive Hook Memory:** SessionStart prompt injections via hooks are inactive. Instead, persistent knowledge is anchored to disk in `AGENTS.md`, `docs/adr/`, and `graphify-out/`.
   - **Plan Canvas Browser GUI:** The interactive Plan Canvas local web server is not supported in Antigravity.

4. **Integration with Graphify & Ponytail Standard:**
   ECC works synergistically with Graphify and our Ponytail lazy senior developer standard:
   - **Planning:** `/plan` uses Graphify queries (`graphify query`, `graphify path`) to trace affected models, controllers, and endpoints before writing code.
   - **Implementation:** Governed by Ponytail rules (minimal diff, reuse existing codebase helpers, root cause over symptom).
   - **Verification:** TDD workflow (`php artisan test`) and frontend build (`npm run build`).
   - **Review:** `/code-review` runs code-reviewer agent checks.
   - **Sync:** Incremental AST graph update (`graphify update .`) and ADR updates.

## Consequences
- Clean, collision-safe project workspace with zero interference to existing custom files.
- Automated code reviews and consistent planning checklists available directly in chat via slash commands.
- Transparent record of managed files in `.agents/ecc-install-state.json`.
