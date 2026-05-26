#!/usr/bin/env python3
"""
GitHub App이 설치된 모든 레포를 조회해서 BetaHuhn/repo-file-sync-action용
sync.yml 내용을 stdout으로 출력합니다.

각 레포 루트의 .harness-sync.yml을 읽어 동기화할 항목을 결정합니다.
파일이 없으면 sync-manifest.yml의 defaults 그룹을 모두 적용합니다.

.harness-sync.yml 형식:
  groups:        # 포함할 그룹 (기본값: defaults 그룹 전체)
    - claude
    - codex
  exclude:       # groups에서 제외할 항목 ID
    - claude/skills/kotest-guide
  include:       # groups 외에 추가할 항목 ID
    - copilot/instructions

환경변수:
  APP_ID           - GitHub App ID
  APP_PRIVATE_KEY  - GitHub App Private Key (.pem 전체 내용)
  SOURCE_REPO      - 제외할 소스 레포 (기본값: themoment-team/themoment-ai-harness-sync)
"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
from collections import defaultdict
from pathlib import Path

import yaml


MANIFEST_PATH = Path(__file__).parent.parent / "sync-manifest.yml"
GH_API_BASE = "https://api.github.com"


def load_manifest() -> dict:
    with open(MANIFEST_PATH) as f:
        return yaml.safe_load(f)


def generate_jwt(app_id: str, private_key: str) -> str:
    import jwt

    now = int(time.time())
    payload = {"iat": now - 60, "exp": now + 600, "iss": app_id}
    return jwt.encode(payload, private_key, algorithm="RS256")


def app_api(endpoint: str, app_jwt: str, method: str = "GET") -> any:
    """App JWT 인증이 필요한 엔드포인트 호출 (Bearer 스킴 사용)."""
    results = []
    url = f"{GH_API_BASE}{endpoint}"
    while url:
        req = urllib.request.Request(
            url,
            data=b"" if method == "POST" else None,
            method=method,
            headers={
                "Authorization": f"Bearer {app_jwt}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            link_header = resp.headers.get("Link", "")
            if isinstance(data, list):
                results.extend(data)
            else:
                return data
            next_url = None
            for part in link_header.split(","):
                if 'rel="next"' in part:
                    next_url = part.strip().split(";")[0].strip().strip("<>")
                    break
            url = next_url
    return results


def get_installation_token(inst_id: int, app_jwt: str) -> str:
    data = app_api(f"/app/installations/{inst_id}/access_tokens", app_jwt, method="POST")
    return data["token"]


def get_repo_harness_config(full_name: str, token: str) -> dict | None:
    result = subprocess.run(
        ["gh", "api", f"/repos/{full_name}/contents/.harness/sync.yml"],
        env={**os.environ, "GH_TOKEN": token},
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    data = json.loads(result.stdout)
    content = base64.b64decode(data["content"]).decode()
    return yaml.safe_load(content)


def resolve_files(
    config: dict | None,
    manifest: dict,
    default_groups: list[str],
) -> list[tuple[str, str]]:
    """
    config: 대상 레포의 .harness-sync.yml 파싱 결과 (없으면 None)
    반환: (src, dest) 튜플 리스트 (순서 보존, 중복 제거)
    """
    all_items: dict[str, tuple[str, str]] = {
        item["id"]: (item["src"], item["dest"])
        for item in manifest["items"]
    }
    item_groups: dict[str, list[str]] = {
        item["id"]: item["groups"]
        for item in manifest["items"]
    }

    if config is None:
        selected_groups = default_groups
        excludes: list[str] = []
        includes: list[str] = []
    else:
        selected_groups = config.get("groups", default_groups)
        excludes = config.get("exclude", [])
        includes = config.get("include", [])

    selected: dict[str, tuple[str, str]] = {}

    # 선택된 그룹에 속하는 항목 추가
    for item_id, groups in item_groups.items():
        if any(g in selected_groups for g in groups):
            selected[item_id] = all_items[item_id]

    # exclude 적용
    for item_id in excludes:
        selected.pop(item_id, None)

    # include 추가 (그룹에 없더라도 강제 포함)
    for item_id in includes:
        if item_id in all_items and item_id not in selected:
            selected[item_id] = all_items[item_id]

    return list(selected.values())


def main():
    app_id = os.environ.get("APP_ID")
    private_key = os.environ.get("APP_PRIVATE_KEY")
    source_repo = os.environ.get("SOURCE_REPO", "themoment-team/themoment-ai-harness-sync")

    if not app_id or not private_key:
        print("Error: APP_ID and APP_PRIVATE_KEY must be set", file=sys.stderr)
        sys.exit(1)

    manifest = load_manifest()
    default_groups: list[str] = manifest.get("defaults", [])

    app_jwt = generate_jwt(app_id, private_key)

    installations = app_api("/app/installations", app_jwt)
    if not isinstance(installations, list):
        installations = [installations]

    # repo full_name → resolved (src, dest) file list
    repo_files: dict[str, list[tuple[str, str]]] = {}

    for inst in installations:
        inst_id = inst["id"]
        try:
            inst_token = get_installation_token(inst_id, app_jwt)
        except urllib.error.HTTPError as e:
            print(f"Warning: failed to get token for installation {inst_id}: {e}", file=sys.stderr)
            continue

        data = app_api(f"/app/installations/{inst_id}/repositories", app_jwt)
        repos = data if isinstance(data, list) else data.get("repositories", [])

        for repo in repos:
            full_name = repo["full_name"]
            if full_name == source_repo:
                continue

            config = get_repo_harness_config(full_name, inst_token)
            if config:
                groups = config.get("groups", default_groups)
                excludes = config.get("exclude", [])
                includes = config.get("include", [])
                print(
                    f"  {full_name}: groups={groups} exclude={excludes} include={includes}",
                    file=sys.stderr,
                )
            else:
                print(f"  {full_name}: no config, using defaults={default_groups}", file=sys.stderr)

            repo_files[full_name] = resolve_files(config, manifest, default_groups)

    if not repo_files:
        print("# No target repos found — check GitHub App installations", file=sys.stderr)
        print("group: []")
        return

    # 동일한 파일 셋을 원하는 레포끼리 하나의 group 항목으로 묶음
    files_to_repos: dict[tuple, list[str]] = defaultdict(list)
    for repo, files in repo_files.items():
        key = tuple(files)
        files_to_repos[key].append(repo)

    print("group:")
    for files_key, repos in files_to_repos.items():
        print("  - repos: |")
        for repo in repos:
            print(f"      {repo}")
        print("    files:")
        for src, dest in files_key:
            print(f"      - source: {src}")
            print(f"        dest: {dest}")


if __name__ == "__main__":
    main()