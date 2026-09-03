---
title: Gemini 설정
description: Gemini 설정과 스타일가이드 작성 규칙
order: 80
---

# Gemini Conventions

`.gemini/` 디렉토리 하위 파일 작성 규칙입니다.

## 디렉토리 구조

```
.gemini/
├── settings.json   # Gemini 동작 설정
└── styleguide.md   # 코딩 스타일 가이드
```

## settings.json

```json
{
  "theme": "...",
  "language": "korean"
}
```

- 응답 언어(`language`), 테마 등 Gemini CLI 동작 제어
- 프로젝트 공통 설정만 포함

## styleguide.md

Gemini가 코드 작성 시 참조하는 스타일 가이드입니다.

> **참고**: `styleguide.md`는 harness 동기화 대상이 아닙니다(`gemini` 그룹은 `settings.json`만 배포). 각 레포가 직접 작성·관리하세요.

### 작성 원칙

- 각 프로젝트의 공통 코딩 컨벤션을 기술
- 섹션 구성 예:
  - 언어별 스타일 규칙
  - 네이밍 컨벤션
  - 아키텍처 패턴
  - 금지 패턴 (Anti-patterns)
- 예시 코드는 실제 프로젝트 패턴 기반으로 작성
- 너무 길면 Gemini 컨텍스트 초과 — 핵심만 간결하게

### 업데이트 주기

실제 코드와 괴리가 생기면 `doc-polisher` 에이전트로 갱신합니다.+
