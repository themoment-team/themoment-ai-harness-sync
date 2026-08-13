---
title: 동기화 설정
description: 수신 항목, 자동 수신 여부, 동기화 활성 상태를 설정하는 방법
order: 30
---

# 동기화 설정

프로젝트별 설정은 레포의 `.harness/sync.yml`에 저장됩니다. 대시보드는 이 파일을 직접 수정하지 않고 검토 가능한 설정 PR을 만듭니다.

## 고정 선택

새 항목을 자동 수신하지 않으려면 그룹을 비우고 필요한 항목만 `true`로 선택합니다.

```yaml
enabled: true
groups: []
overrides:
  claude/skills/api-design: true
  codex/skills/api-design: true
```

## 그룹 기반 자동 수신

`groups`에 `claude`, `codex`, `gemini` 등을 넣으면 해당 그룹에 새로 추가되는 항목도 받습니다. 원하지 않는 항목은 `overrides`에서 `false`로 제외할 수 있습니다.

`enabled: false`면 새로운 동기화 PR과 고아 파일 정리 PR이 모두 생성되지 않습니다.
