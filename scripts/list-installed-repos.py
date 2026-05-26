#!/usr/bin/env python3
"""
GitHub App이 설치된 모든 레포를 조회해서 BetaHuhn/repo-file-sync-action용
sync.yml 내용을 stdout으로 출력합니다.

환경변수:
  APP_ID           - GitHub App ID
  APP_PRIVATE_KEY  - GitHub App Private Key (.pem 전체 내용)
  SOURCE_REPO      - 제외할 소스 레포 (기본값: themoment-team/ai-harness)
"""
import json
import os
import subprocess
import sys
import time


SYNC_FILES = [
    (".claude/agents/", ".claude/agents/"),
    (".claude/hooks/", ".claude/hooks/"),
    (".claude/skills/", ".claude/skills/"),
    (".agents/skills/", ".agents/skills/"),
    (".codex/", ".codex/"),
    (".gemini/", ".gemini/"),
]


def generate_jwt(app_id: str, private_key: str) -> str:
    import jwt

    now = int(time.time())
    payload = {"iat": now - 60, "exp": now + 600, "iss": app_id}
    return jwt.encode(payload, private_key, algorithm="RS256")


def gh_api(endpoint: str, token: str) -> any:
    result = subprocess.run(
        ["gh", "api", endpoint, "--paginate"],
        env={**os.environ, "GH_TOKEN": token},
        capture_output=True,
        text=True,
        check=True,
    )
    text = result.stdout.strip()
    if text.startswith("["):
        combined = []
        for chunk in text.replace("][", "]\n[").split("\n"):
            combined.extend(json.loads(chunk))
        return combined
    return json.loads(text)


def main():
    app_id = os.environ.get("APP_ID")
    private_key = os.environ.get("APP_PRIVATE_KEY")
    source_repo = os.environ.get("SOURCE_REPO", "themoment-team/ai-harness")

    if not app_id or not private_key:
        print("Error: APP_ID and APP_PRIVATE_KEY must be set", file=sys.stderr)
        sys.exit(1)

    app_jwt = generate_jwt(app_id, private_key)

    installations = gh_api("/app/installations", app_jwt)
    if not isinstance(installations, list):
        installations = [installations]

    all_repos: list[str] = []
    for inst in installations:
        inst_id = inst["id"]
        data = gh_api(f"/app/installations/{inst_id}/repositories", app_jwt)
        repos = data if isinstance(data, list) else data.get("repositories", [])
        all_repos.extend(r["full_name"] for r in repos)

    target_repos = [r for r in all_repos if r != source_repo]

    if not target_repos:
        print("# No target repos found — check GitHub App installations", file=sys.stderr)
        print("group: []")
        return

    print("group:")
    print("  - repos: |")
    for repo in target_repos:
        print(f"      {repo}")
    print("    files:")
    for source, dest in SYNC_FILES:
        print(f"      - source: {source}")
        print(f"        dest: {dest}")


if __name__ == "__main__":
    main()
