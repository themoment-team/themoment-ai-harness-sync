# Skills

Claude에서 `/skill-name` 으로 호출하는 재사용 가능한 작업 단위입니다.

## Git 워크플로우

| 스킬                                            | 설명                                                              |
|-----------------------------------------------|-----------------------------------------------------------------|
| [git-commit](./git-commit/SKILL.md)           | 변경사항을 논리적 단위로 분리해 컨벤션에 맞는 커밋 생성. Git Flow 자동 감지(develop 브랜치 체크) |
| [write-pr](./write-pr/SKILL.md)               | base 브랜치 이후 커밋 기반으로 PR 제목·본문·라벨 생성 및 GitHub PR 오픈까지 자동화         |
| [resolve-reviews](./resolve-reviews/SKILL.md) | PR 리뷰 코멘트 수집 후 컨벤션 기준으로 판단 — 유효하면 자동 반영, 무효하면 반박 댓글 작성          |

## 코드 품질

| 스킬                                                      | 설명                                                                    |
|---------------------------------------------------------|-----------------------------------------------------------------------|
| [code-review](./code-review/SKILL.md)                   | DTO 어노테이션·Kotlin 스타일·JPA·트랜잭션·테스트·보안 기본값을 체크리스트로 검사. ✓/⚠/✗ 리포트 출력     |
| [security-checklist](./security-checklist/SKILL.md)     | 하드코딩 시크릿·SQL 인젝션·JWT 검증·API 키 마스킹·민감 로깅·인가 검사. auth·API 관련 PR 머지 전 필수 |
| [systematic-debugging](./systematic-debugging/SKILL.md) | 버그·테스트 실패·예상 외 동작 발생 시 수정 제안 전에 실행. 근본 원인 추적 방법론 적용                   |
| [test](./test/SKILL.md)                                 | 컨텍스트 기반으로 테스트 범위(단일/모듈/전체) 결정 후 실행, 커버리지 분석 및 실패 상세 보고                |

## 설계 및 아키텍처

| 스킬                                                  | 설명                                                                                                 |
|-----------------------------------------------------|----------------------------------------------------------------------------------------------------|
| [api-design](./api-design/SKILL.md)                 | 새 엔드포인트 REST 설계 — URL 구조, `@RequestParam` vs `@ModelAttribute`, OpenAPI 어노테이션, `CommonApiResponse` |
| [kotlin-spring-arch](./kotlin-spring-arch/SKILL.md) | Controller/Service/Repository 계층 책임, `@Transactional` 전략, `ExpectedException`, Entity↔DTO 변환 패턴 참조 |
| [plan-deep-dive](./plan-deep-dive/SKILL.md)         | 숨겨진 요구사항·트레이드오프·제약을 발굴하는 구조화된 인터뷰 후 상세 구현 스펙 파일 생성                                                 |
| [migration-guide](./migration-guide/SKILL.md)       | DB 스키마 변경·Entity 수정 영향 분석, 올바른 변경 순서(Entity → DTO → Repository → Service → 테스트), 2단계 컬럼 삭제         |

## 테스트

| 스킬                                      | 설명                                                                                    |
|-----------------------------------------|---------------------------------------------------------------------------------------|
| [kotest-guide](./kotest-guide/SKILL.md) | Kotest + MockK 패턴 — Given/When/Then 구조, mock 생성, stubbing, 코루틴 테스트, 예외 검증 (Kotlin 전용) |
