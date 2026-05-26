## Overview

This is a central AI harness repository that distributes AI tool configurations — Claude skills/agents/hooks, Codex skills, Gemini config, and Copilot instructions — to multiple projects via GitHub App and automated sync.

## Commit Conventions

Format: `type(scope): 한국어 설명`

- **Types**: `add` / `update` / `fix` / `refactor` / `ci/cd` / `docs`
- **Scopes**: `global` (cross-cutting), `claude`, `codex`, `gemini`, `copilot`, `ci/cd`
- **Description**: Korean, no period

## Adding a New Skill or Agent

1. Add skill files under `.claude/skills/<name>/` (and mirror in `.agents/skills/<name>/` for Codex)
2. Register each new path in `sync-manifest.yml` under `items:` with a unique `id`
3. Commit: `add(claude): 새 스킬 추가` or `add(global): claude/codex 양쪽에 추가`

## Key Files

- `sync-manifest.yml` — available sync groups and item registry
- `scripts/list-installed-repos.py` — discovers App installations and generates per-installation sync configs
- `.github/workflows/sync.yml` — auto-sync workflow (matrix per installation)
- `.harness/sync.yml.example` — template for target repos to opt-in/opt-out of specific items