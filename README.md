# AI Harness

> Distribute AI tool configurations across all your repositories — automatically.

A central hub that shares Claude skills/agents/hooks, Codex skills, Gemini config, and Copilot instructions with every project that installs the GitHub App. Add a new project in seconds; no manual config editing required.

## How It Works

1. Push updates to this repo → GitHub Actions triggers
2. The workflow discovers every repository where the App is installed (across orgs and personal accounts)
3. A PR is opened in each target repo with the updated files

New projects are auto-detected the moment the App is installed — no `sync.yml` edits needed.

## Documentation

Full setup and usage guides are on the [Wiki](../../wiki):

- [Getting Started](../../wiki/Getting-Started) — end-to-end setup for harness operators
- [GitHub App Setup](../../wiki/GitHub-App-Setup) — App creation, permissions, and secrets
- [Per-Repo Config](../../wiki/Per-Repo-Config) — control what each repo receives via `.harness/sync.yml`
- [Conventions](../../wiki/Global-Conventions) — commit, PR, and skill authoring conventions

## Directory Docs

- [Claude Skills](.claude/skills/README.md)
- [Claude Agents](.claude/agents/README.md)
- [Codex Skills](.agents/skills/README.md)

## License

MIT License