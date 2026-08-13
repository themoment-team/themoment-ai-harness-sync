# AI Harness Dashboard

프로젝트 팀이 AI Harness 동기화 항목을 선택하고, 대상 레포의 `.harness/sync.yml`을 변경하는 설정 PR을 만드는 Next.js 애플리케이션입니다.

## 실행

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

`http://localhost:3000`에서 실행합니다.

## 환경 변수

| 변수 | 발급·설정 위치 |
| --- | --- |
| `GITHUB_CLIENT_ID` | GitHub App 설정의 **Client ID** |
| `GITHUB_CLIENT_SECRET` | GitHub App 설정의 **Generate a new client secret** |
| `GITHUB_APP_ID` | GitHub App 설정의 **App ID** |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App 설정의 **Generate a private key**로 받은 PEM 파일 전문 |
| `AUTH_SECRET` | `openssl rand -base64 32`로 생성 |
| `HARNESS_REPOSITORY` | Harness 원본 레포의 `owner/repository` 형식 이름 |

로컬에서는 GitHub App의 **Callback URL**에 다음 값을 등록합니다.

```text
http://localhost:3000/api/auth/callback/github
```

배포 환경은 실제 도메인의 같은 경로를 Callback URL 목록에 추가합니다. GitHub App 설치 시 사용자 인증이 필요하다면 **Request user authorization (OAuth) during installation**을 활성화합니다.

## 권한

대시보드는 GitHub App이 설치된 레포 중 로그인한 사용자에게 `write`, `maintain`, `admin` 권한이 있는 레포만 보여 줍니다. 설정 변경은 사용자 OAuth 토큰으로 권한을 확인한 뒤, GitHub App 설치 토큰으로 `harness-config/<timestamp>` 브랜치와 PR을 생성합니다.

## 검증

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
