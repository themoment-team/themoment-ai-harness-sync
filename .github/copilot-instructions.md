# AI Harness — Copilot Instructions

**한국어로 응답해주세요.**

## 이 레포지토리란?

여러 프로젝트에 AI 도구 설정 파일(Claude 스킬·에이전트·훅, Codex 설정, Gemini 설정)을 공유·배포하는 허브입니다.

## 작업 시 주의사항

- `.claude/rules/`는 이 레포 자체 규칙이므로 프로젝트 동기화 대상이 아님
- `.github/sync.yml`이 동기화 대상 레포와 파일 매핑을 정의함
- 스킬(`SKILL.md`)과 에이전트(`.claude/agents/*.md`)는 특정 언어에 종속되지 않게 작성 권장
- 새 프로젝트 추가 시 `.github/sync.yml`에 레포 항목만 추가하면 됨

## 커밋 컨벤션

- `add`: 새 스킬·에이전트·훅 추가
- `update`: 기존 스킬·에이전트·훅 개선
- `fix`: 오류 수정
- `chore`: sync 설정, 워크플로우, 메타 파일 변경
- `docs`: README 등 문서 변경