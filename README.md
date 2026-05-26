# ai-harness

여러 프로젝트에 걸쳐 AI 도구 설정 파일을 공유·배포하는 허브 레포지토리입니다.

Claude, Codex, Gemini, Copilot 등의 에이전트·스킬·훅·설정을 중앙에서 관리하고, GitHub Actions를 통해 앱이 설치된 모든 프로젝트에 자동으로 동기화합니다.

## 구조

```
ai-harness/
├── .agents/skills/        → [Codex 호환 스킬](.agents/skills/README.md)
├── .claude/
│   ├── agents/            → [서브에이전트](.claude/agents/README.md)
│   ├── hooks/             # pre/post 훅
│   ├── rules/             # 이 레포 자체 규칙 (각 프로젝트는 별도 관리)
│   └── skills/            → [Claude 스킬](.claude/skills/README.md)
├── .codex/                # Codex 설정
├── .gemini/               # Gemini 설정
├── scripts/
│   └── list-installed-repos.py   # 동기화 대상 자동 생성
└── .github/
    ├── copilot-instructions.md
    ├── sync.yml           # 폴백용 정적 동기화 설정
    └── workflows/
        └── sync.yml       # 자동 동기화 워크플로우
```

## 동기화 방식

`main` 브랜치에 push하면 GitHub Actions가 **App이 설치된 모든 레포**를 자동으로 감지하여 PR을 생성합니다.

새 프로젝트를 sync 대상에 추가하려면 **GitHub App을 해당 레포에 설치**하기만 하면 됩니다. `sync.yml`을 수동으로 수정할 필요가 없습니다.

### 동기화되는 파일

| 경로                | 설명          |
|-------------------|-------------|
| `.claude/agents/` | 서브에이전트      |
| `.claude/hooks/`  | pre/post 훅  |
| `.claude/skills/` | 스킬          |
| `.agents/skills/` | Codex 호환 스킬 |
| `.codex/`         | Codex 설정    |
| `.gemini/`        | Gemini 설정   |

### 각 프로젝트가 직접 관리하는 파일

| 경로                                | 이유               |
|-----------------------------------|------------------|
| `.claude/rules/`                  | 프로젝트별 코딩 컨벤션     |
| `.claude/settings.json`           | 프로젝트별 권한·훅 설정    |
| `CLAUDE.md`                       | 프로젝트 개요·명령어      |
| `AGENTS.md`                       | 프로젝트 개요·명령어      |
| `.github/copilot-instructions.md` | 프로젝트별 Copilot 지시 |

## 초기 설정

### 1. GitHub App 생성

→ `github.com/organizations/themoment-team/settings/apps` 에서 생성. [상세 절차](https://github.com/themoment-team/themoment-ai-harness-sync/wiki/GitHub-App-Setup) 참고.

### 2. 시크릿 등록

이 레포 Settings → Secrets and variables → Actions:

| 시크릿 | 값 |
|--------|-----|
| `APP_ID` | GitHub App ID (숫자) |
| `APP_PRIVATE_KEY` | 발급한 `.pem` 파일 전체 내용 |

### 3. 새 프로젝트 연결

GitHub App을 해당 레포에 Install하면 다음 sync 시 자동으로 포함됩니다.

## 라이선스

MIT License — [themoment-team](https://github.com/themoment-team)