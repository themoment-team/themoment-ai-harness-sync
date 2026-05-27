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

## Adding a New Hook Module

Hook 모듈은 dispatcher가 자동으로 스캔하는 구조입니다.

1. Claude: `.claude/hooks/modules/<name>/preToolUse.sh` 또는 `postToolUse.sh` 작성
   Codex: `.codex/hooks/modules/<name>/pre-tool-use.sh` 또는 `post-tool-use.sh` 작성
2. 모듈 인터페이스: `exit 2` = 실행 차단, `exit 0` = 정상 통과
3. `sync-manifest.yml`에 항목 등록 (`groups: []` = opt-in 전용)
4. Commit: `add(claude): <이름> hook 모듈 추가`

## Hook 구조

```
.claude/hooks/
  dispatcher/          ← opt-in (overrides: {claude/hooks/dispatcher: true})
    preToolUse.sh      ← modules/*/preToolUse.sh 자동 스캔·실행
    postToolUse.sh
  modules/
    logging/           ← opt-in
    command-guard/     ← opt-in
    ktlint/            ← opt-in
    kotest/            ← opt-in
```

## .harness/sync.yml 설정 포맷

타깃 레포의 `.harness/sync.yml`은 `groups` + `overrides` 구조를 사용합니다.

```yaml
groups:
  - claude
  - codex

overrides:
  claude/skills/git-commit: false   # 그룹 내 항목 비활성화
  claude/hooks/ktlint: true         # opt-in 항목 활성화
```

- `false`: groups에 포함된 항목을 제외 (구형 `exclude`)
- `true`: groups에 없는 opt-in 항목을 추가 (구형 `include`)
- 구형 `exclude`/`include` 형식도 하위 호환으로 지원

## Key Files

- `sync-manifest.yml` — available sync groups and item registry
- `scripts/list-installed-repos.py` — discovers App installations and generates per-repo sync configs
- `.github/workflows/sync.yml` — auto-sync workflow (matrix per repo)
- `.harness/sync.yml.example` — template for target repos to opt-in/opt-out of specific items
- `.claude/templates/settings-base.json` — hooks 미포함 시 전파되는 settings.json 기반 파일