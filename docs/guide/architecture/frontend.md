---
title: 프론트엔드 아키텍처
description: Next.js App Router와 FSD 규칙
order: 100
---

# Frontend Architecture

Next.js App Router 프로젝트를 위한 Feature-Sliced Design(FSD), Turborepo, UI·데이터 계층 규칙입니다.

## 적용 범위

이 하네스의 FSD는 Next.js App Router에 맞춘 프로젝트 규약입니다. 표준 FSD의 `pages` 레이어 대신 `views`를 사용하고, FSD `app` 레이어를 Next.js `src/app`과 통합합니다.

```text
src/
├── app/         # routes, layouts, metadata, providers, route guards
├── views/       # page composition
├── widgets/     # reusable page sections
├── features/    # user actions, forms, mutations
├── entities/    # domain types, API functions, query hooks, entity UI
└── shared/      # shared clients, hooks, stores, utilities, config, assets
```

## FSD 규칙

의존 방향은 아래와 같습니다. 한 레이어는 오른쪽 레이어만 import할 수 있습니다.

```text
app → views → widgets → features → entities → shared
```

- business slice는 `ui`, `model`, `api`, `lib`, `config` 세그먼트를 사용합니다.
- 전역 설정은 `shared/config`, 앱 초기화 설정은 `app/config`에 둡니다.
- 다른 business slice의 내부 세그먼트는 import하지 않고 공개 진입점만 사용합니다.
- 같은 레이어의 slice import는 금지합니다. 단, 불가피한 entity 관계는 소비자를 명시한 `entities/<slice>/@x/<consumer>` 공개 API만 허용합니다.
- `src/app`에는 라우팅·layout·provider만 두고, 화면 조합은 `views`에 둡니다.
- 서버 전용 fetch 함수는 slice의 `api`에 두고 `index.server.ts`로 공개합니다.

## 검증 도구

FSD 프로젝트는 [동기화 설정](/guide/sync-configuration)에서 다음 opt-in 항목을 활성화합니다.

```yaml
overrides:
  nextjs/fsd/steiger-config: true
  nextjs/fsd/dependency-check: true
```

이 설정은 프로젝트 루트에 `steiger.config.mjs`, `scripts/`에 의존성 검사기를 배포합니다. 대상 프로젝트에서 `steiger`와 `@feature-sliced/steiger-plugin`을 개발 의존성으로 설치한 뒤 아래 스크립트를 추가합니다.

```json
"lint:fsd": "node scripts/check-fsd-dependencies.mjs && steiger src --fail-on-warnings"
```

검사기는 표준 Steiger 규칙에 더해 `views` 레이어, 같은 레이어 slice import, dynamic `import()`를 검사합니다. `entities/@x/<consumer>` 공개 API는 같은 레이어 예외로 통과합니다.

### Turborepo

앱별 상위 레이어는 `apps/*/src`, 공유 하위 레이어는 `packages/core/src`에 둡니다.

```text
apps/*/src: app → views → widgets → features → entities → shared
packages/core/src: entities → shared
packages/ui: shared/ui design system
```

앱 간 직접 import는 금지하며, 공유 패키지는 공개 `@scope/core`, `@scope/ui` 진입점으로만 사용합니다. 여러 앱을 검사할 때는 모든 앱 source root를 검사기에 전달합니다.

```json
"lint:fsd": "node scripts/check-fsd-dependencies.mjs apps/client/src apps/admin/src && steiger apps/client/src --fail-on-warnings && steiger apps/admin/src --fail-on-warnings && steiger packages/core/src --fail-on-warnings"
```

source-consumed workspace package가 RSC directive를 내보낼 때만 각 앱의 `transpilePackages`에 넣습니다. 빌드된 UI package는 JavaScript·CSS·선언 파일을 배포하고 재컴파일하지 않습니다.

## UI와 데이터 규칙

- Tailwind 정적 클래스는 문자열로 작성하고, 조건부 클래스나 외부 `className` 병합에만 `cn()`을 사용합니다.
- 디자인 토큰·base layer는 공통 Tailwind 설정에, shadcn primitive는 UI package에, 도메인 UI는 소유 slice에 둡니다.
- API 호출은 프로젝트의 typed HTTP wrapper를 사용합니다. URL factory와 query key는 소유 entity 또는 feature에 둡니다.
- TanStack Query key는 `all()` 루트와 계층형 배열을 사용합니다.
- Zod schema는 `PascalCaseSchema`, 추론 request type은 `ReqType` 접미사를 사용합니다. `enum`보다 union과 `Record<Union, Metadata>`를 우선합니다.

## 자동 검사 에이전트

`프론트엔드 컨벤션 검사해줘` 또는 `frontend-convention-validator 실행해`라고 요청하면 TypeScript/TSX 변경 파일을 읽기 전용으로 검사합니다. FSD, Tailwind/shadcn, TanStack Query/Zod, server-only 공개 API 규칙을 확인합니다.

스킬 목록은 [스킬 레퍼런스](/guide/reference/skills), 에이전트 상세는 [에이전트 레퍼런스](/guide/reference/agents)를 참고하세요.
