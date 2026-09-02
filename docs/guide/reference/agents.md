---
title: 에이전트 레퍼런스
description: 에이전트 트리거와 역할
order: 110
---

# Agents Reference

트리거 문구를 입력하면 Claude(또는 Codex)가 자동으로 위임하는 서브에이전트 목록입니다.  
직접 이름을 언급해 호출할 수도 있습니다.

> 각 에이전트는 Claude용 `.claude/agents/<name>.md` 와 Codex용 `.codex/agents/<name>.toml` 에 동일한 본문으로 정의되어 있습니다.
> 본문은 같지만 헤더 포맷이 다릅니다 — Claude는 YAML frontmatter, Codex는 TOML(`name`/`description`/`developer_instructions` + `sandbox_mode`·`model_reasoning_effort`). 두 디렉토리는 독립 시스템이라 각각 유지됩니다.
> 작성 규칙은 [Claude 컨벤션](/guide/conventions/claude) / [Codex 컨벤션](/guide/conventions/codex)를 참고하세요.

---

## 코드 품질

### contradiction-finder
문서·코드·에이전트 간 **모순·충돌을 감사**합니다. 4계층으로 검사합니다.

| 계층 | 검사 내용 |
|------|----------|
| doc ↔ doc | CLAUDE.md, styleguide.md, CONTRIBUTING.md, copilot-instructions.md 간 충돌 규칙 |
| doc ↔ code | 문서에 명시된 규칙이 실제 `.kt` 파일에서 지켜지는지 |
| doc ↔ agent/skill | 에이전트·스킬 정의가 CLAUDE.md 규칙을 반영하는지 |
| agent ↔ agent | 에이전트 간 트리거 조건 중복·범위 충돌 |

**트리거**: `모순 찾아줘` / `충돌 검사해줘` / `일관성 검사해줘` / `contradiction-finder 실행해`

---

### kotlin-convention-validator
**Kotlin 전용.** `git diff HEAD` 기준 변경된 `.kt` 파일에서 컨벤션 위반을 감지하고 자동 수정합니다.  
변경된 Kotlin 파일이 없으면 즉시 종료됩니다.

검사 항목: DTO 어노테이션 타겟(`@field:` vs `@param:`), 로깅 스타일, `ExpectedException` 메시지 형식, `val/var` 사용, 생성자 주입, `@Transactional` 위치  
수정 후 `ktlintFormat`으로 최종 포맷을 정리합니다.

**트리거**: `컨벤션 검사해줘` / `kotlin-convention-validator 실행해`

---

### frontend-convention-validator
**TypeScript/TSX 전용 읽기 검사기**입니다. FSD import 방향·같은 layer slice 경계(`entities/@x/<consumer>` 예외), Tailwind/shadcn 소유권, TanStack Query/Zod 규칙, server-only 진입점을 검사합니다.

FSD 프로젝트에 `lint:fsd` 스크립트가 있으면 실행 결과를 보고하며, 근거 없는 FSD 위반을 추정하지 않습니다. 파일을 수정하거나 커밋하지 않습니다.

**트리거**: `프론트엔드 컨벤션 검사해줘` / `frontend-convention-validator 실행해`

---

### doc-polisher
프로젝트 **문서 파일을 업데이트하고 정리**합니다. 코드 스니펫을 최신 `.kt` 파일 패턴으로 갱신하고, 설명을 단순화하며, 누락된 컨벤션을 추가합니다.

대상 파일: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `.gemini/styleguide.md`, `.claude/agents/*.md`, `.claude/skills/**/*.md`

**트리거**: `문서 갱신해줘` / `문서 정리해줘` / `doc-polisher 실행해` / 특정 문서 파일명 언급

---

### prompt-polisher
에이전트·스킬 **프롬프트 파일의 개선안을 Before/After diff 형식으로 제안**합니다. 파일을 직접 수정하지는 않습니다.

검사 항목: 영어 문법·톤, frontmatter 완성도, 섹션 순서, 트리거 문구 구체성, 파일 내 중복·모순

**트리거**: `프롬프트 다듬어줘` / `에이전트 설명 다듬어줘` / `prompt-polisher 실행해`

---

## 테스트

### kotlin-test-fixer
**Kotlin 전용.** Kotlin/Kotest 테스트를 실행하고 **실패를 진단·수정**합니다. 서비스 코드가 진실의 원천 — 서비스 동작이 바뀌면 테스트를 업데이트하고, 서비스 버그(NPE, 잘못된 로직)는 서비스에서 수정합니다. Gradle 모듈 구조를 동적으로 감지하며 최대 3회 재시도 후 결과 보고.

**트리거**: `테스트 고쳐줘` / `kotlin-test-fixer 실행해줘` / `<모듈명> 테스트 고쳐줘`

---

## 리서치

### web-researcher
**최신 웹 정보를 수집**합니다. 학습 데이터 범위 밖의 릴리스 노트, 보안 권고, 라이브러리 비교, CVE 등을 검색합니다.

**트리거**: `최신 정보 조사해줘` / `web-researcher 실행해` / 최신 릴리스·CVE 관련 질문

