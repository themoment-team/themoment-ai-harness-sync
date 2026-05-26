# AI Harness

> Distribute AI tool configurations across all your repositories — automatically.

A central hub that shares Claude skills/agents/hooks, Codex skills, Gemini config, and Copilot instructions with every project that installs the GitHub App. Add a new project in seconds; no manual config editing required.

---

## How It Works

1. Push updates to this repo → GitHub Actions triggers
2. The workflow discovers every repository where the App is installed
3. A PR is opened in each target repo with the updated files

New projects are auto-detected the moment the App is installed — no `sync.yml` edits needed.

## Synced Paths

| Path | Contents |
|------|----------|
| `.claude/agents/` | Claude Code sub-agents |
| `.claude/hooks/` | pre/post tool-use hooks |
| `.claude/skills/` | Claude Code skills |
| `.agents/skills/` | Codex-compatible skills |
| `.codex/` | OpenAI Codex / Agents CLI config |
| `.gemini/` | Gemini CLI config |

Each target repo manages its own `.claude/rules/`, `CLAUDE.md`, `AGENTS.md`, and `.github/copilot-instructions.md` independently.

## Per-repo Customization

Place `.harness/sync.yml` in any target repository to control what gets synced:

```yaml
# .harness/sync.yml
groups:
  - claude   # Claude Code skills, agents, hooks
  - codex    # Codex skills + config
  # - gemini
  # - copilot

exclude:
  - claude/skills/kotest-guide       # remove items you don't need
  - codex/skills/kotlin-spring-arch

include:
  - copilot/instructions             # add items outside your selected groups
```

Without this file, the default groups (`claude`, `codex`, `gemini`) are applied.
See `.harness/sync.yml.example` for the full reference and all available item IDs.

## Repository Structure

```
ai-harness/
├── .agents/skills/        → Codex-compatible skills
├── .claude/
│   ├── agents/            → Claude Code sub-agents
│   ├── hooks/             # pre/post hooks
│   └── skills/            → Claude Code skills
├── .codex/                # Codex config & hooks
├── .gemini/               # Gemini config
├── .harness/
│   └── sync.yml.example   # target repo config template
├── sync-manifest.yml      # item registry and group definitions
├── scripts/
│   └── list-installed-repos.py
└── .github/
    ├── copilot-instructions.md
    └── workflows/
        └── sync.yml
```

## Setup

### 1. Create a GitHub App

Create a GitHub App in your organization settings with these permissions:

| Permission | Level |
|-----------|-------|
| Contents | Read & Write |
| Pull requests | Read & Write |
| Metadata | Read |

Enable **"Request user authorization (OAuth) during installation"** if needed.

### 2. Register Secrets

In this repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `APP_ID` | Your GitHub App ID (number) |
| `APP_PRIVATE_KEY` | Full contents of the generated `.pem` file |

### 3. Connect a Project

Install the GitHub App on any repository. It will be automatically included in the next sync.

---

## Directory Docs

- [Claude Skills](.claude/skills/README.md)
- [Claude Agents](.claude/agents/README.md)
- [Codex Skills](.agents/skills/README.md)

## License

MIT License