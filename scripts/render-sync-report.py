#!/usr/bin/env python3
"""Sync 워크플로우 결과를 취합해 GitHub Actions 잡 요약으로 렌더링한다.

각 매트릭스 레그가 업로드한 result-*.json 을 읽어 통계와 실패 내역을
`$GITHUB_STEP_SUMMARY` 에 마크다운으로 출력한다.

- 대표적이고 명확한 오류(base_branch 없음, 토큰 실패 등)는 레포 링크와 함께
  분명한 한 줄 메시지로 표시한다.
- 그 외 알 수 없는 오류는 해당 잡의 원시 로그를 함께 첨부한다.

env:
  RESULTS_DIR     result-*.json 이 있는 디렉터리 (기본 results)
  STATS           prepare 잡이 출력한 통계 JSON
  PREPARE_RESULT  prepare 잡 result
  SYNC_RESULT     sync 잡 result
  GH_REPO         소스 레포 (github.repository) — 잡/로그 API 조회용
  RUN_ID          github.run_id
  SERVER_URL      github.server_url
  GH_TOKEN        actions:read 권한 토큰 (github.token)
  GITHUB_STEP_SUMMARY  요약 출력 파일 경로
"""
import glob
import json
import os
import subprocess
import sys

RESULTS_DIR = os.environ.get("RESULTS_DIR", "results")
GH_REPO = os.environ.get("GH_REPO", "")
RUN_ID = os.environ.get("RUN_ID", "")
SERVER_URL = os.environ.get("SERVER_URL", "https://github.com")
PREPARE_RESULT = os.environ.get("PREPARE_RESULT", "")
SYNC_RESULT = os.environ.get("SYNC_RESULT", "")


def load_stats() -> dict:
    raw = os.environ.get("STATS", "")
    try:
        return json.loads(raw) if raw else {}
    except (ValueError, TypeError):
        return {}


def load_results() -> list[dict]:
    results = []
    for path in sorted(glob.glob(os.path.join(RESULTS_DIR, "result-*.json"))):
        try:
            with open(path) as f:
                results.append(json.load(f))
        except (OSError, ValueError):
            pass
    return results


def fetch_jobs() -> dict:
    """잡 이름 → {id, url} 매핑. continue-on-error가 conclusion을 감추므로
    상태 판정엔 쓰지 않고, 실패 레그의 원시 로그/링크를 찾는 데만 쓴다."""
    result = subprocess.run(
        [
            "gh", "api",
            f"/repos/{GH_REPO}/actions/runs/{RUN_ID}/jobs?per_page=100",
            "--paginate",
            "--jq", ".jobs[] | {name: .name, id: .id, url: .html_url}",
        ],
        capture_output=True,
        text=True,
    )
    jobs = {}
    if result.returncode == 0:
        for line in result.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                jobs[obj["name"]] = {"id": obj["id"], "url": obj["url"]}
            except (ValueError, KeyError):
                pass
    return jobs


def fetch_log_tail(job_id: int, max_chars: int = 12000) -> str:
    result = subprocess.run(
        ["gh", "api", f"/repos/{GH_REPO}/actions/jobs/{job_id}/logs"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not result.stdout:
        return ""
    log = result.stdout
    if len(log) > max_chars:
        log = "... (앞부분 생략) ...\n" + log[-max_chars:]
    return log


def main() -> None:
    stats = load_stats()
    results = load_results()

    successes = [r for r in results if r.get("status") == "success"]
    skipped = [r for r in results if r.get("status") == "skipped"]
    failures = [r for r in results if r.get("status") == "failed"]

    lines: list[str] = []
    lines.append("# 🔄 AI Harness Sync 결과")
    lines.append("")
    lines.append(f"**Prepare:** `{PREPARE_RESULT}` · **Sync:** `{SYNC_RESULT}`")
    lines.append("")

    if stats:
        lines.append(
            f"- 동기화 시도: **{stats.get('attempted', 0)} / "
            f"{stats.get('total_repos', 0)}** 레포 "
            f"(설치 {stats.get('installations', 0)}개)"
        )
        lines.append(
            f"- 건너뜀: 열린 PR {stats.get('skipped_open_pr', 0)} · "
            f"대상 파일 없음 {stats.get('skipped_no_files', 0)}"
        )
    lines.append(
        f"- 결과: ✅ 성공 {len(successes)} · "
        f"⏭️ 건너뜀 {len(skipped)} · ❌ 실패 {len(failures)}"
    )
    lines.append("")

    # prepare 자체가 실패한 경우(매트릭스 산출 크래시 등)
    if PREPARE_RESULT == "failure":
        lines.append("---")
        lines.append("## 🚨 prepare 단계 실패")
        lines.append("")
        lines.append("매트릭스 산출 단계가 실패해 이번 실행은 동기화를 진행하지 못했습니다.")
        jobs = fetch_jobs()
        info = jobs.get("prepare")
        if info:
            log = fetch_log_tail(info["id"])
            if log:
                lines.append("")
                lines.append("<details><summary>로그 원문 보기</summary>")
                lines.append("")
                lines.append("```text")
                lines.append(log.rstrip())
                lines.append("```")
                lines.append("")
                lines.append("</details>")
            lines.append("")
            lines.append(f"[전체 job 로그 열기]({info['url']})")

    if failures:
        lines.append("---")
        lines.append("## 실패한 레포")
        lines.append("")
        # 원시 로그가 필요한 경우에만 잡 목록을 조회한다
        needs_logs = any(f.get("error_class") == "sync-action-failed" for f in failures)
        jobs = fetch_jobs() if needs_logs else {}

        for f in failures:
            repo = f.get("repo", "?")
            repo_url = f.get("repo_url", "")
            error_class = f.get("error_class", "")
            message = f.get("message", "")

            if error_class == "sync-action-failed":
                lines.append(f"### [🚨]({repo_url}) `{repo}` — 알 수 없는 오류")
                info = jobs.get(f.get("job_name", ""))
                if info:
                    log = fetch_log_tail(info["id"])
                    if log:
                        lines.append("")
                        lines.append("<details><summary>로그 원문 보기</summary>")
                        lines.append("")
                        lines.append("```text")
                        lines.append(log.rstrip())
                        lines.append("```")
                        lines.append("")
                        lines.append("</details>")
                    lines.append("")
                    lines.append(f"[전체 job 로그 열기]({info['url']})")
            else:
                lines.append(f"### [⚠️]({repo_url}) `{repo}` — {message}")
            lines.append("")

    if not failures and PREPARE_RESULT != "failure":
        lines.append("모든 동기화가 문제없이 처리되었습니다. 🎉")
        lines.append("")

    report = "\n".join(lines) + "\n"

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a") as f:
            f.write(report)
    else:
        # 로컬 실행 등 요약 파일이 없으면 stdout으로
        sys.stdout.write(report)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # 보고는 best-effort — 잡을 실패시키지 않는다
        print(f"render-sync-report 실패(무시): {e}", file=sys.stderr)
