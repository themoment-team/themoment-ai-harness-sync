---
title: Claude 컨벤션
description: Claude 스킬, 에이전트, 훅 작성 규칙
order: 60
---

# Claude 컨벤션

스킬은 `.claude/skills/<name>/SKILL.md`, 에이전트는 `.claude/agents/<name>.md`에 둡니다. 새 동기화 항목은 `sync-manifest.yml`에도 등록해야 합니다.

훅은 기본 수신 대상이 아닙니다. 필요한 프로젝트에서만 `overrides`로 명시적으로 활성화합니다.
