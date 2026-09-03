---
title: 전역 컨벤션
description: 커밋, PR, 브랜치 공통 규칙
order: 50
---

# Global Conventions

모든 스코프에 공통으로 적용되는 규칙입니다.

## 커밋 컨벤션

```
type(scope): 한국어 설명
```

### type

| type | 사용 시점 |
|------|----------|
| `add` | 새 스킬·에이전트·설정 추가 |
| `update` | 기존 항목 개선·수정 |
| `fix` | 오류 수정 |
| `docs` | README·Wiki 등 문서 변경 |
| `ci/cd` | 워크플로우·스크립트 변경 |
| `refactor` | 구조 개선 (기능 변경 없음) |

### scope

| scope | 대상 |
|-------|------|
| `global` | 여러 스코프에 걸친 변경, 프로젝트 메타 파일 |
| `claude` | `.claude/` 하위 파일 |
| `codex` | `.codex/`, `.agents/` 하위 파일 |
| `gemini` | `.gemini/` 하위 파일 |
| `copilot` | `.github/copilot-instructions.md` |

### 설명 규칙

- 한국어, 마침표 없음
- 명사형으로 끝내기 (`추가`, `수정`, `개선`)
- 50자 이내

**예시**

```
add(claude): systematic-debugging 스킬 추가
update(global): write-pr 스킬 레퍼런스 경로 수정
docs(global): README 동기화 방식 설명 업데이트
ci/cd(global): 파일 동기화 워크플로우 추가
```

## PR 컨벤션

- 제목: 커밋 컨벤션과 동일한 형식
- 라벨: `harness-sync` (자동 동기화 PR), `enhancement`, `bug`, `documentation`
- 자동 동기화 PR은 리뷰 후 머지 — 무조건 Auto-merge 금지

## 브랜치 컨벤션

```
type/scope-description
```

**예시**

```
add/claude-new-skill
update/global-sync-workflow
fix/codex-hook-path
```

## 파일 네이밍

- 디렉토리: `kebab-case`
- 파일: `kebab-case.md`, `kebab-case.sh`
- 스킬 진입점: 반드시 `SKILL.md` (대문자)
- 에이전트: `kebab-case.md`+
