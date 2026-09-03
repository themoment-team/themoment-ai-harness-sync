---
title: 스킬 레퍼런스
description: 스킬 목록과 역할
order: 130
---

# Skills Reference

Claude Code에서 `/skill-name` 으로 직접 호출하는 스킬 목록입니다.

> 각 스킬은 `.claude/skills/<name>/` 에 위치하며, Claude가 컨텍스트를 보고 자동 제안하기도 합니다.

---

## 개발 워크플로

| 스킬 | 호출 | 설명 |
|------|------|------|
| `git-commit` | `/git-commit` | 변경사항을 논리 단위로 분리해 커밋 생성. `develop` 브랜치 감지 시 feature 브랜치 자동 체크아웃 |
| `write-pr` | `/write-pr` | 베이스 브랜치 이후 커밋을 분석해 PR 제목·본문·라벨 자동 생성 후 GitHub PR 오픈 |
| `planning` | `/planning [instructions]` | 요구사항 인터뷰를 진행하고 구현 스펙 문서(`.md`)를 생성 |
| `resolve-reviews` | `/resolve-reviews` | 열린 PR의 리뷰 댓글을 수집해 유효한 것은 자동 적용, 무효한 것은 반박 댓글 작성 |

## 코드 품질

| 스킬 | 호출 | 설명 |
|------|------|------|
| `systematic-debugging` | `/systematic-debugging` | 버그·테스트 실패·예상 외 동작 발생 시 픽스 전에 먼저 실행. 원인 분석 → 가설 수립 → 검증 순서로 안내 |
| `security-checklist` | `/security-checklist` | 하드코딩 시크릿, SQL 인젝션, JWT 검증, API 키 마스킹, 민감 로깅, 인가 체크 등 보안 취약점 검증. auth·API 관련 변경 전 실행 |
| `test` | `/test` | 테스트 실행 범위(단일 테스트 / 모듈 / 전체)를 컨텍스트로 판단하고 커버리지 결과 보고 |

## 백엔드 (Kotlin / Spring Boot)

| 스킬 | 호출 | 설명 |
|------|------|------|
| `kotlin-spring-arch` | `/kotlin-spring-arch` | Controller·Service·Repository 레이어 책임, `@Transactional` 전략(readOnly 최적화, N+1 방지), `ExpectedException` 사용법, Entity↔DTO 변환 패턴 |
| `kotest-guide` | `/kotest-guide` | Kotest + MockK 테스트 패턴. Given/When/Then 구조, mock 생성, stubbing, argument capture, 코루틴 테스팅, 예외 검증 |
| `migration-guide` | `/migration-guide` | DB 스키마 변경 및 Entity 수정 시 올바른 변경 순서(Entity → DTO → Repository → Service → Tests), JPA DDL 전략, 컬럼 2단계 삭제 |
| `api-design` | `/api-design` | RESTful URL 구조, `@RequestParam` vs `@ModelAttribute` 바인딩 규칙, OpenAPI 어노테이션, `CommonApiResponse` 사용법 |
| `database-schema` | `/database-schema` | 테이블·컬럼 네이밍 컨벤션, 인덱스 전략, JPA 엔티티 매핑 패턴 |
| `java-spring-arch` | `/java-spring-arch` | Java + Spring Boot 4.0 레이어 구조 및 트랜잭션·DTO 패턴 가이드, `ExpectedException` 사용법, Entity↔DTO 변환 패턴 |
| `the-sdk` | `/the-sdk` | the-sdk 공통 라이브러리 가이드. Logging(`Log-ID` 자동 부여), `CommonApiResponse` 래핑, `ExpectedException` 처리, Swagger 자동 구성 |

## 인프라

| 스킬 | 호출 | 설명 |
|------|------|------|
| `docker` | `/docker` | Dockerfile·docker-compose 작성 가이드. 멀티스테이지 빌드, 레이어 캐싱, 보안 best practice, compose 서비스 연결 |

## 프론트엔드 (Next.js / FSD)

| 스킬 | 호출 | 설명 |
|------|------|------|
| `nextjs-fsd-architecture` | `/nextjs-fsd-architecture` | Next.js App Router 단일 앱의 FSD 구조, `views` 레이어, `config` 세그먼트, `entities/@x` 공개 API, FSD 검사 설정 |
| `nextjs-turborepo-fsd` | `/nextjs-turborepo-fsd` | 다중 Next.js 앱과 공유 FSD package의 경계, 엔티티 승격, 다중 source root 검사 |
| `nextjs-package-boundaries` | `/nextjs-package-boundaries` | server-only 진입점, source-consumed package와 prebuilt UI package의 경계, `transpilePackages` 기준 |
| `tailwind-shadcn` | `/tailwind-shadcn` | Tailwind 클래스와 `cn()`, 디자인 토큰, shadcn primitive·도메인 UI 소유권 |
| `tanstack-query-zod` | `/tanstack-query-zod` | typed API wrapper, TanStack Query key·hook, Zod schema와 inferred request type 규칙 |

설치와 프로젝트 구조는 [프론트엔드 아키텍처](/guide/architecture/frontend)를 참고하세요.

