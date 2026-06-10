## Overview

This is a central AI harness repository that distributes AI tool configurations — Claude skills/agents/hooks, Codex skills, Gemini config, and Copilot instructions — to multiple projects via GitHub App and automated sync.

## Commit Conventions

Format: `type(scope): 한국어 설명`

- **Types**: `add` / `update` / `fix` / `refactor` / `ci/cd` / `docs`
- **Scopes**: `global` (cross-cutting), `claude`, `codex`, `gemini`, `copilot`, `ci/cd`
- **Description**: Korean, no period

## Adding a New Skill

1. Add skill files under `.claude/skills/<name>/` (and mirror in `.agents/skills/<name>/` for Codex)
2. Register each new path in `sync-manifest.yml` under `items:` with a unique `id`
3. Commit: `add(claude): 새 스킬 추가` or `add(global): claude/codex 양쪽에 추가`

## Adding a New Agent

Claude와 Codex는 에이전트 포맷이 다릅니다. 본문은 같아도 헤더 형식을 각각 맞춰야 합니다.

1. Claude: `.claude/agents/<name>.md` 작성 — YAML frontmatter (`name`, `description` 필수; `tools`, `model`, `color`, `memory`, `maxTurns`, `permissionMode` 선택) + 본문 프롬프트
   Codex: `.codex/agents/<name>.toml` 작성 — `name`, `description`, `developer_instructions` 필수; 선택 필드 `model_reasoning_effort`(`low`/`medium`/`high`), `sandbox_mode`(`read-only`/`workspace-write`), `mcp_servers`, `skills.config`, `nickname_candidates`
2. 포맷 변환 주의:
   - `developer_instructions`는 TOML **literal string**(`'''…'''`)으로 작성한다 — 본문의 grep 정규식 백슬래시가 basic string 이스케이프와 충돌함
   - Claude `tools:` allowlist는 Codex에 1:1 대응이 없다 → 읽기 전용 에이전트는 `sandbox_mode = "read-only"`, 편집 에이전트는 `"workspace-write"`로 매핑
   - Codex `model`은 잘못된 ID 위험이 있으므로 생략해 부모 세션(`.codex/config.toml`) 설정을 상속하고, 작업 무게는 `model_reasoning_effort`로 차등한다
3. `sync-manifest.yml`에 양쪽 경로를 각각 등록 (`claude/agents/<name>`, `codex/agents/<name>`, `groups: [claude]` / `[codex]`)
4. `.claude/agents/README.md`와 `.codex/agents/README.md` 표에 항목 추가
5. Commit: `add(global): <이름> 에이전트 추가` or `add(claude): <이름> 에이전트 추가`

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
- `"v1"` (문자열): 해당 항목을 아카이브된 버전으로 고정
- 구형 `exclude`/`include` 형식도 하위 호환으로 지원

`language` 필드로 sync PR 제목·본문 언어를 설정할 수 있습니다 (기본값: `en`):

```yaml
language: ko   # PR 제목: "[global] {가장 규모가 큰 커밋의 ': ' 이후 텍스트}"
               # PR 본문: 한국어
               # 생략 시 기본값 en (영어 제목·본문)
```

## 파일 이름 변경 / 삭제 시 타깃 레포 정리

파일명을 바꾸거나 항목을 삭제하면 타깃 레포에 구 파일이 그대로 남습니다.
`sync-manifest.yml`의 `deletions` 목록에 등록하면 다음 sync 시 자동으로 PR이 생성됩니다.

```yaml
deletions:
  - dest: .claude/skills/old-skill-name/
    reason: "new-skill-name 으로 이름 변경"
    since: "2026-05-29"
```

- `dest`: 타깃 레포에서 삭제할 경로 (파일 또는 디렉터리)
- `reason`: 사람이 읽기 위한 메모 (선택)
- `since`: 등록 날짜 (선택)
- 모든 타깃 레포에서 정리가 완료된 것을 확인한 후 목록에서 제거

## Breaking Change 릴리스 (버전 아카이브)

스킬/에이전트에 breaking change를 적용하기 전:

1. 기존 파일을 `_archive/<name>/<vN>/` 에 복사
   ```
   cp -r .claude/skills/git-commit .claude/skills/_archive/git-commit/v1
   cp -r .agents/skills/git-commit .agents/skills/_archive/git-commit/v1
   ```
2. `sync-manifest.yml`에 `@v1` 항목 등록 (`groups: []`)
3. 최신 스킬을 수정한다
4. Wiki Per-Repo-Config에 changelog 기재
5. Commit: `update(claude): git-commit v2, archive v1`

타깃 레포는 `overrides: { claude/skills/git-commit: "v1" }` 로 구 버전을 유지할 수 있다.

## Key Files

- `sync-manifest.yml` — available sync groups and item registry
- `scripts/list-installed-repos.py` — discovers App installations and generates per-repo sync configs
- `.github/workflows/sync.yml` — auto-sync workflow (matrix per repo)
- `.harness/sync.yml.example` — template for target repos to opt-in/opt-out of specific items
- `.claude/templates/settings-base.json` — hooks 미포함 시 전파되는 settings.json 기반 파일