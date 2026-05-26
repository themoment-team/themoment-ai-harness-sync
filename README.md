# ai-harness

여러 프로젝트에 걸쳐 AI 도구 설정 파일을 공유·배포하는 허브 레포지토리입니다.

Claude, Codex, Gemini, Copilot 등의 에이전트·스킬·훅·설정을 중앙에서 관리하고, GitHub Actions를 통해 등록된 모든 프로젝트에 자동으로 동기화합니다.

## 구조

```
ai-harness/
├── .agents/skills/        # Codex 호환 스킬
├── .claude/
│   ├── agents/            # Claude 서브에이전트 정의
│   ├── hooks/             # pre/post 훅
│   ├── rules/             # 이 레포 자체 규칙 (각 프로젝트는 별도 관리)
│   └── skills/            # 범용 + 도메인 특화 스킬
├── .codex/                # Codex 설정
├── .gemini/               # Gemini 설정
└── .github/
    ├── copilot-instructions.md
    ├── sync.yml           # 동기화 대상 및 파일 매핑
    └── workflows/
        └── sync.yml       # 자동 동기화 워크플로우
```

## 동기화 방식

`main` 브랜치에 push하면 GitHub Actions가 `.github/sync.yml`에 정의된 프로젝트들에 자동으로 PR을 생성합니다.

### 동기화되는 파일

| 경로 | 설명 |
|------|------|
| `.claude/agents/` | 범용 서브에이전트 |
| `.claude/hooks/` | pre/post 훅 |
| `.claude/skills/` | 범용 + 도메인 스킬 |
| `.agents/skills/` | Codex 호환 스킬 |
| `.codex/` | Codex 설정 |
| `.gemini/` | Gemini 설정 |

### 각 프로젝트가 직접 관리하는 파일

| 경로 | 이유 |
|------|------|
| `.claude/rules/` | 프로젝트별 코딩 컨벤션 |
| `.claude/settings.json` | 프로젝트별 권한·훅 설정 |
| `CLAUDE.md` | 프로젝트 개요·명령어 |
| `AGENTS.md` | 프로젝트 개요·명령어 |
| `.github/copilot-instructions.md` | 프로젝트별 Copilot 지시 |

## 스킬 목록

| 스킬 | 설명 |
|------|------|
| `git-commit` | 컨벤셔널 커밋 메시지 작성 |
| `write-pr` | PR 본문 작성 |
| `code-review` | 코드 리뷰 |
| `resolve-reviews` | 리뷰 코멘트 반영 |
| `security-checklist` | 보안 점검 |
| `systematic-debugging` | 체계적 디버깅 |
| `plan-deep-dive` | 구현 계획 수립 |
| `migration-guide` | 마이그레이션 가이드 |
| `api-design` | API 설계 |
| `kotest-guide` | Kotest 테스트 작성 (Kotlin) |
| `kotlin-spring-arch` | Kotlin Spring 아키텍처 (Kotlin) |
| `test` | 테스트 작성 |

## 에이전트 목록

| 에이전트 | 역할 |
|----------|------|
| `convention-validator` | 컨벤션 준수 검사 |
| `contradiction-finder` | 문서·코드 모순 탐지 |
| `doc-polisher` | 문서 품질 개선 |
| `prompt-polisher` | 프롬프트 개선 |
| `test-fixer` | 테스트 실패 수정 |
| `web-researcher` | 웹 정보 수집 |

## 새 프로젝트 연결

`.github/sync.yml`에 레포와 동기화할 파일 목록을 추가합니다:

```yaml
group:
  - repos: |
      your-org/new-repo
    files:
      - source: .claude/agents/
        dest: .claude/agents/
      - source: .claude/hooks/
        dest: .claude/hooks/
      - source: .claude/skills/
        dest: .claude/skills/
      - source: .agents/skills/
        dest: .agents/skills/
      - source: .codex/
        dest: .codex/
      - source: .gemini/
        dest: .gemini/
```

## 초기 설정

### GitHub App 설정

동기화에는 GitHub App 토큰을 사용합니다. 이 레포 Settings → Secrets and variables → Actions에 아래 두 시크릿을 등록합니다:

| 시크릿               | 값                   |
|-------------------|---------------------|
| `APP_ID`          | GitHub App의 ID (숫자) |
| `APP_PRIVATE_KEY` | 발급한 `.pem` 파일 전체 내용 |

설정 완료 후 `main`에 push하거나 Actions 탭에서 수동으로 워크플로우를 실행하면 동기화가 시작됩니다.

## 라이선스

MIT License — [themoment-team](https://github.com/themoment-team)