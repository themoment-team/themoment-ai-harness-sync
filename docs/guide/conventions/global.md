---
title: 전역 컨벤션
description: 커밋, PR, 브랜치, 파일 이름 규칙
order: 50
---

# 전역 컨벤션

커밋 제목은 `type(scope): 한국어 설명` 형식을 사용합니다. type은 `add`, `update`, `fix`, `refactor`, `ci/cd`, `docs` 중 하나이며 설명은 마침표 없는 한국어 명사형으로 작성합니다.

브랜치는 `type/scope-description` 형식을 사용합니다. 디렉터리와 일반 문서는 kebab-case를 사용하고, 스킬 진입점은 반드시 `SKILL.md`입니다.

자동 동기화 PR은 검토 후 병합하며 Auto-merge를 기본으로 사용하지 않습니다.
