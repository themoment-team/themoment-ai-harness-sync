---
title: 프론트엔드 아키텍처
description: Next.js App Router와 FSD 규칙
order: 100
---

# Frontend Architecture

Next.js App Router 프로젝트를 위한 Feature-Sliced Design(FSD), Turborepo, UI·데이터 계층 규칙입니다. 상세 가이드는 `nextjs-fsd-architecture`, `react-conventions`, `data-and-forms`, `tailwind-shadcn` 스킬에 있습니다.

## 적용 범위

FSD 공식 Next.js 가이드를 따릅니다. Next.js가 `src/app`과 `src/pages`를 라우터 폴더로 읽기 때문에 FSD `app`·`pages` 레이어 폴더에 밑줄을 붙입니다. Steiger는 밑줄을 떼고 레이어로 인식합니다.

```text
app/             # Next.js 라우트만 둔다 (FSD 밖, Steiger 검사 대상 아님)
src/
├── _app/        # app 레이어: provider, 전역 스타일, 초기화 설정
├── _pages/      # pages 레이어: 라우트 하나에 대응하는 화면
├── widgets/     # 여러 화면에 들어가는 큰 블록
├── features/    # 사용자 동작 하나 (폼·버튼과 mutation)
├── entities/    # 도메인 개념과 조회 (타입, query key, 조회 훅, entity UI)
└── shared/      # 도메인을 모르는 공통 코드 (api, config, lib, ui)
```

## FSD 규칙

의존 방향은 아래와 같습니다. 한 레이어는 오른쪽 레이어만 import할 수 있습니다.

```text
_app → _pages → widgets → features → entities → shared
```

- business slice는 목적 이름 세그먼트(`ui`, `model`, `api`, `lib`, `config`)를 쓰고, 필요할 때만 만듭니다.
- slice 밖에서는 `index.ts` 공개 API로만 import합니다. 서버 전용 코드는 `index.server.ts`로 따로 공개합니다.
- 같은 레이어의 slice import는 금지합니다. 불가피한 entity 관계만 `entities/<slice>/@x/<consumer>` 공개 API로 허용합니다.
- 루트 `app/`의 라우트 파일은 `_pages`의 페이지를 재수출하거나 얇게 조합만 합니다. 데이터 prefetch와 `HydrationBoundary`는 `_pages`의 페이지 컴포넌트가 맡습니다.
- 처음에는 `_pages` 안에서 시작하고, 두 번째 소비처가 생길 때 아래 레이어로 내립니다.

## 검증 도구

FSD 프로젝트는 [동기화 설정](../sync-configuration.md)에서 Steiger 설정을 opt-in으로 받습니다.

```yaml
overrides:
  nextjs/fsd/steiger-config: true
```

대상 프로젝트에 `steiger`와 `@feature-sliced/steiger-plugin`을 개발 의존성으로 설치한 뒤 아래 스크립트를 추가합니다.

```json
"lint:fsd": "steiger ./src --fail-on-warnings"
```

배포되는 설정은 recommended 규칙에 `_app`·`_pages`의 `fsd/typo-in-layer-name`, `_app/providers`의 `fsd/segments-by-purpose` 예외만 둡니다. 공식 구조에서는 Steiger가 모든 레이어를 직접 검사하므로 v1의 `check-fsd-dependencies.mjs`가 필요하지 않습니다.

### Turborepo

앱별 레이어는 `apps/*/src`, 공유 하위 레이어는 `packages/core/src`에 둡니다.

```text
apps/*/src:          _app → _pages → widgets → features → entities → shared
packages/core/src:   entities → shared
```

- 앱 간 직접 import는 금지하고, 패키지는 `package.json`의 `exports` 진입점으로만 사용합니다.
- entity는 처음 쓰는 앱에 두고, 두 앱 이상이 쓰면 `packages/core/src/entities`로 옮깁니다.
- core는 루트 배럴 없이 slice 단위 서브패스로 공개합니다(`@scope/core/shared/<segment>`, `@scope/core/entities/<slice>`, 각각의 `/server`). import 경로에 레이어가 드러나므로, 앱의 `src/shared`가 core의 entities를 가져오는 위반을 ESLint `no-restricted-imports`로 막습니다.
- 각 앱과 `packages/core/src`에서 Steiger를 실행합니다. core에서는 앱의 참조가 보이지 않으므로 `entities`의 `fsd/insignificant-slice`를 끕니다(배포 설정에 포함).
- React 코드를 담는 패키지는 앱과 같은 React·hooks·접근성 lint 규칙을 쓰고, `tsconfig.json`에 `.tsx`와 `"jsx": "react-jsx"`를 둡니다.
- source-consumed workspace package만 각 앱의 `transpilePackages`에 넣습니다. 빌드된 UI package는 다시 컴파일하지 않습니다.

## UI와 데이터 규칙

- Tailwind 정적 클래스는 문자열로 쓰고, 조건부 클래스나 외부 `className` 병합에만 `cn()`을 씁니다. 색·간격은 `@theme` 토큰을 씁니다.
- shadcn primitive는 단일 앱의 `src/shared/ui` 또는 공유 UI 패키지에, 도메인 UI는 소유 slice에 둡니다.
- API 호출은 프로젝트의 typed HTTP wrapper를 사용합니다. URL 상수, query key factory, 조회 훅은 소유 entity의 `api/`에, mutation 훅은 동작을 맡는 feature의 `api/`에 둡니다.
- TanStack Query key는 `all()` 루트의 계층 factory로 만들고, mutation은 영향받는 가장 좁은 key만 무효화합니다.
- Zod schema는 `PascalCaseSchema`, 추론 request type은 `ReqType` 접미사를 씁니다. `enum`보다 union과 `Record<Union, Metadata>`를 우선합니다.

## v1에서 옮기기

v1은 Next.js `src/app`을 FSD app 레이어와 함께 쓰고 `pages` 대신 `views`를 썼습니다. 옮기기 전까지는 [동기화 설정](../sync-configuration.md)의 버전 고정으로 v1 스킬·에이전트·Steiger 설정을 유지할 수 있습니다.

| v1 | v2 |
|----|----|
| `src/app/**`의 라우트, layout, route handler | 루트 `app/**` (얇게 유지) |
| `src/app`의 provider, 전역 스타일, 앱 설정 | `src/_app/{providers,styles,config}` |
| `src/views/<slice>` | `src/_pages/<slice>` |
| `scripts/check-fsd-dependencies.mjs` | 삭제. Turborepo는 ESLint 규칙으로 패키지 간 위반을 막음 |
| `@scope/core` 루트 배럴 | `@scope/core/shared/<segment>`, `@scope/core/entities/<slice>` |

- 폴더는 `git mv`로 옮겨 이력을 유지하고, `@/` import와 `tsconfig.json` `paths`, Tailwind `@source`, 테스트 glob을 함께 고칩니다.
- `.harness/sync.yml`에서 v1 고정과 `nextjs/fsd/dependency-check`를 지우고 `nextjs/fsd/steiger-config: true`만 남깁니다.
- 앱 하나를 옮길 때마다 FSD lint, 타입 검사, 빌드, 테스트를 실행합니다.

## 자동 검사 에이전트

`프론트엔드 컨벤션 검사해줘` 또는 `frontend-convention-validator 실행해`라고 요청하면 TypeScript/TSX 변경 파일을 읽기 전용으로 검사합니다. lint·Steiger·타입 검사 결과를 먼저 인용하고, 도구가 잡지 못하는 라우트 파일·레이어 배치·서버/클라이언트 경계·데이터와 폼·스타일 규칙을 확인합니다.

스킬 목록은 [스킬 레퍼런스](../reference/skills.md), 에이전트 상세는 [에이전트 레퍼런스](../reference/agents.md)를 참고하세요.
