---
title: AI Harness 가이드
description: 하네스 설치와 문서 탐색
order: 10
---

# AI Harness 가이드

레포에 `.harness/sync.yml` 파일 하나를 추가하면 Claude, Codex, Gemini 설정이 자동으로 동기화됩니다.

## 빠른 시작

```yaml
# .harness/sync.yml
groups:
  - claude
  - codex
```

이것만으로 Claude Code 스킬·에이전트와 Codex 스킬이 자동 배포됩니다.  
세부 제어가 필요하다면 [동기화 설정](/guide/sync-configuration)를 참고하세요.

## 문서

### 설정
- [동기화 설정](/guide/sync-configuration) — 그룹 선택, 훅 활성화, 버전 고정 등 동기화 항목 제어

### 레퍼런스
- [스킬 레퍼런스](/guide/reference/skills) — 스킬 목록과 각 스킬의 역할
- [에이전트 레퍼런스](/guide/reference/agents) — 서브에이전트 목록과 트리거 문구
- [훅 레퍼런스](/guide/reference/hooks) — 훅 모듈 목록과 프로젝트 유형별 추천 조합
- [프론트엔드 아키텍처](/guide/architecture/frontend) — Next.js App Router, FSD, Turborepo 프론트엔드 규칙

### 컨벤션
- [Claude 컨벤션](/guide/conventions/claude) — 스킬·에이전트·훅 작성 규칙
- [Codex 컨벤션](/guide/conventions/codex) — Codex 설정·훅 작성 규칙
- [Gemini 컨벤션](/guide/conventions/gemini) — Gemini 설정·스타일가이드 작성 규칙
- [Copilot 컨벤션](/guide/conventions/copilot) — copilot-instructions.md 작성 규칙
- [전역 컨벤션](/guide/conventions/global) — 커밋·PR·브랜치 공통 규칙
