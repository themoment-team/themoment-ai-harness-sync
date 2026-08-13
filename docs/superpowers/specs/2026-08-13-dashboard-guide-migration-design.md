# AI Harness 가이드 이전 설계

## 목적

기존 GitHub Wiki를 점진적으로 폐기하고, AI Harness 대시보드 안에서 설정·사용 가이드를 제공한다.

문서 작성과 변경 검토는 코드 에디터와 Pull Request를 사용한다. 대시보드는 문서의 웹 열람 경로만 제공하며, 문서 관리용 데이터베이스나 웹 편집 기능은 만들지 않는다.

## 확정 사항

- 문서 원본은 AI Harness 레포의 Markdown 파일이다.
- 문서 파일은 `docs/guide/` 아래에서 관리한다.
- 대시보드의 공개 문서 경로는 `/guide`다.
- 가이드는 로그인하지 않은 사용자도 열람할 수 있다.
- 프로젝트 설정 조회·변경과 설정 PR 생성은 기존처럼 GitHub 로그인과 `write` 이상 권한이 필요하다.
- 대시보드를 별도 레포로 분리해도, 문서 원본은 AI Harness 레포에 유지한다.
- 기존 GitHub Wiki는 이전 기간 동안 새 가이드로 이동하라는 안내를 제공한 뒤 폐기한다.

## 문서 원본 구조

```text
docs/
  guide/
    getting-started.md
    github-app-setup.md
    sync-configuration.md
    dashboard-guide.md
    conventions/
      global.md
      claude.md
      codex.md
      gemini.md
      copilot.md
    architecture/
      frontend.md
```

문서의 제목·설명·정렬 순서는 파일명이나 별도 메타데이터가 아니라 Markdown frontmatter로 관리한다.

```yaml
---
title: 동기화 설정
description: 프로젝트별 AI Harness 수신 항목과 동기화 상태를 설정하는 방법
order: 30
---
```

문서 파일은 `main` 브랜치의 내용을 기준으로 제공한다. 문서 변경은 Harness 변경과 같은 PR에서 함께 검토한다.

## 정보 구조와 라우팅

```text
/guide                         가이드 홈과 문서 목록
/guide/[...slug]               단일 문서
/guide/reference/skills        sync-manifest.yml 기반 스킬 목록
/guide/reference/agents        sync-manifest.yml 기반 에이전트 목록
/guide/reference/hooks         sync-manifest.yml 기반 훅 목록
```

- 전역 헤더에 `가이드` 메뉴를 추가한다.
- `/guide` 홈은 시작하기, 동기화 설정, 대시보드 사용법을 먼저 보여 준다.
- 단일 문서는 데스크톱에서 좌측 문서 탐색과 우측 목차를 제공하고, 모바일에서는 본문 흐름을 우선한다.
- 기존 Wiki의 `[[문서명]]` 링크는 대응하는 `/guide/...` 내부 링크로 변환한다.
- 외부 링크는 새 탭에서 열고, 원본 Markdown 파일 링크와 GitHub 편집 페이지 링크는 제공하지 않는다.

## 레퍼런스의 원천 분리

설명과 정책은 Markdown 문서로 관리한다. 반면 다음 목록은 중복 Markdown 표로 관리하지 않는다.

| 대상 | 대시보드 원천 | 이유 |
|---|---|---|
| 스킬·에이전트·훅 목록 | `sync-manifest.yml` | 새 항목 추가·삭제 시 목록이 자동으로 최신 상태를 유지한다. |
| 각 항목의 설명·트리거 | 해당 `SKILL.md`, agent 정의 파일 | 매니페스트에 없는 설명을 중복 관리하지 않는다. |
| 동기화 설정 사용법·권한·정책 | `docs/guide/*.md` | 선택의 이유와 운영 절차를 사람이 읽기 좋게 설명한다. |

`Per-Repo-Config`의 긴 항목 ID 표는 동기화 설정 가이드와 동적 레퍼런스 링크로 나눈다. 이로써 매니페스트 변경 때 문서 표가 낡는 문제를 제거한다.

## 문서 조회

대시보드 서버는 이미 사용하는 GitHub App 설치 토큰으로 `HARNESS_REPOSITORY`의 다음 파일을 읽는다.

```text
docs/guide/**/*.md
sync-manifest.yml
.claude/skills/**/SKILL.md
.claude/agents/*.md
.codex/agents/*.toml
```

- GitHub Contents API 응답을 서버에서 Base64 디코딩한다.
- 레포 기본 브랜치의 파일만 읽는다.
- 문서가 존재하지 않으면 404 가이드 화면을 표시한다.
- GitHub API 오류는 재시도하지 않고, 일반적인 문서 로드 오류 화면을 표시한다.
- 데이터베이스·문서 사본·웹 편집 API는 만들지 않는다.

문서 목록과 본문은 짧은 재검증 캐시를 사용할 수 있으나, 캐시 무효화용 별도 웹훅은 첫 출시 범위에 넣지 않는다.

## Markdown 렌더링과 스타일

`themoment-blog`의 디자인 토큰과 `prose` 규칙을 기준으로 한다. 대시보드는 이미 같은 색상·타이포그래피 토큰을 사용하므로 문서 렌더링에 필요한 스타일만 추가한다.

### 포함

- `react-markdown`과 `remark-gfm`
- 제목 ID와 헤딩 앵커
- h1~h4, 문단, 링크, 인라인 코드, 코드 블록, 인용문, 목록, 구분선, 표
- 라이트·다크 모드의 동일한 `--bg`, `--fg`, `--accent`, `--border` 토큰
- h2~h3 기반 목차와 현재 읽는 섹션 강조

### 제외

- raw HTML 렌더링과 `rehype-raw`
- 문서 내 JavaScript·MDX 실행
- Shiki 문법 강조, 이미지 업로드, Markdown 웹 편집기
- 블로그의 포스트 메타데이터·댓글·좋아요·조회수 기능

문서 원본은 팀이 관리하지만 Markdown HTML을 허용하지 않는다. 대시보드는 `dangerouslySetInnerHTML`로 GitHub에서 받은 원문을 삽입하지 않는다.

## 기존 Wiki 이전 매핑

| 기존 Wiki | 이전 위치 | 처리 |
|---|---|---|
| Home | `/guide` | 새 가이드 홈으로 재작성 |
| Per-Repo-Config | `docs/guide/sync-configuration.md` | 현재 `enabled`, 자동 수신, 고정 선택, 대시보드 설정 PR 흐름으로 갱신 |
| Global-Conventions | `docs/guide/conventions/global.md` | 이전 |
| Claude/Codex/Gemini/Copilot-Conventions | `docs/guide/conventions/*.md` | 이전 후 현 코드 기준 검토 |
| Frontend-Architecture | `docs/guide/architecture/frontend.md` | 이전 |
| Skills/Agents/Hooks Reference | `/guide/reference/*` | 정적 Wiki 표를 이전하지 않고 매니페스트 기반 화면으로 대체 |
| _Sidebar, _Footer | 대시보드 가이드 레이아웃 | Markdown으로 이전하지 않음 |

현재 README가 가리키지만 Wiki에 없는 `Getting Started`, `GitHub App Setup` 문서는 신규 작성한다.

## 단계별 이전

1. `docs/guide/` 구조와 핵심 문서(`getting-started`, `github-app-setup`, `sync-configuration`, `dashboard-guide`)를 만든다.
2. 기존 컨벤션·프런트엔드 아키텍처 문서를 이전하고, 현행 설정과 어긋난 설명을 수정한다.
3. 대시보드에 공개 `/guide` 목록·본문·목차·동적 레퍼런스 화면을 구현한다.
4. README의 Wiki 링크를 `/guide` 링크로 바꾼다.
5. 기존 Wiki Home과 각 문서 상단에 새 가이드 안내와 대응 링크를 추가한다.
6. 팀이 새 가이드를 기준으로 충분히 사용한 뒤 Wiki를 읽기 전용 안내 페이지로 축소하거나 폐기한다.

## 검증 기준

- 비로그인 사용자가 `/guide` 목록·본문·동적 레퍼런스를 볼 수 있다.
- 로그인·프로젝트 권한과 무관하게 가이드 접근이 가능하다.
- 존재하지 않는 슬러그는 404를 반환하고, GitHub API 실패는 일반 오류 화면을 보인다.
- GFM 표·목록·코드 블록·인용문·내부 링크가 라이트·다크 모드에서 모두 읽힌다.
- Markdown raw HTML과 `javascript:` 링크가 렌더링되지 않는다.
- `sync-manifest.yml`의 항목 추가·삭제가 레퍼런스 화면에 반영되고, 별도 Markdown 표를 수정할 필요가 없다.
- 모바일에서 문서 본문·표·코드 블록이 가로 레이아웃을 깨지 않는다.
