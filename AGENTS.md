**한국어로 응답하고 작업해주세요 (Please respond and work in Korean).**

## Overview

This is a central AI harness repository. It stores shared AI tool configurations and distributes them to member projects via GitHub App.

## What This Repo Does

- Centralizes Claude skills/agents/hooks, Codex skills, Gemini config, and Copilot instructions
- Auto-syncs configured files to all App-installed repos on push to `main`
- Each target repo controls what gets synced via `.harness/sync.yml`

## Adding Content

| Content | Path |
|---------|------|
| Claude skill | `.claude/skills/<name>/SKILL.md` |
| Codex skill (mirror) | `.agents/skills/<name>/SKILL.md` |
| Claude agent | `.claude/agents/<name>.md` |

After adding: register the new path in `sync-manifest.yml` under `items:`.

## Commit Format

`type(scope): 한국어 설명`

- Types: `add` / `update` / `fix` / `refactor` / `ci/cd` / `docs`
- Scopes: `global`, `claude`, `codex`, `gemini`, `copilot`, `ci/cd`
- Description: Korean, no period

## Key Files

- `sync-manifest.yml` — item registry and group definitions
- `scripts/list-installed-repos.py` — installation discovery script
- `.github/workflows/sync.yml` — sync workflow
- `.harness/sync.yml.example` — target repo config template