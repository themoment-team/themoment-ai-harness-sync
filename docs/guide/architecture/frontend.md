---
title: 프론트엔드 아키텍처
description: Next.js App Router와 Feature-Sliced Design 규칙
order: 100
---

# 프론트엔드 아키텍처

Next.js App Router 프로젝트는 표준 FSD의 `pages` 대신 `views`를 사용합니다.

```text
app → views → widgets → features → entities → shared
```

`src/app`에는 라우팅·layout·provider만 두고 화면 조합은 `views`에 둡니다. 서버 전용 조회 함수는 소유 slice의 `api`에 두고 `index.server.ts`를 통해 공개합니다.

FSD 검사 설정은 매니페스트에서 `nextjs/fsd/steiger-config`, `nextjs/fsd/dependency-check`를 opt-in으로 선택합니다.
