#!/usr/bin/env python3
"""
GitHub App이 설치된 모든 레포를 조회해서 BetaHuhn/repo-file-sync-action용
sync.yml 내용을 stdout으로 출력합니다.

각 레포 루트의 .harness-sync.yml을 읽어 동기화할 그룹을 결정합니다.
파일이 없으면 sync-manifest.yml의 defaults 그룹을 사용합니다.

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
from collections import defaultdict
from pathlib import Path

import yaml


MANIFEST_PATH = Path(__file__).parent.parent / "sync-manifest.yml"


def load_manifest() -> dict:
    with open(MANIFEST_PATH) as f:
        return yaml.safe_load(f)


def generate_jwt(app_id: str, private_key: str) -> str:
    import jwt

    now = int(time.time())
    payload = {"iat": now - 60, "exp": now + 600, "iss": app_id}
    return jwt.encode(payload, private_key, algorithm="RS256")


def gh_api(endpoint: str, token: str, method: str = "GET") -> any:
    cmd = ["gh", "api", endpoint]
    if method == "POST":
        cmd += ["--method", "POST"]
    else:
        cmd += ["--paginate"]
    result = subprocess.run(
        cmd,
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


def get_installation_token(inst_id: int, app_jwt: str) -> str:
    data = gh_api(f"/app/installations/{inst_id}/access_tokens", app_jwt, method="POST")
    return data["token"]


def get_repo_harness_config(full_name: str, token: str) -> dict | None:
    result = subprocess.run(
        ["gh", "api", f"/repos/{full_name}/contents/.harness-sync.yml"],
        env={**os.environ, "GH_TOKEN": token},
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    data = json.loads(result.stdout)
    content = base64.b64decode(data["content"]).decode()
    return yaml.safe_load(content)


def resolve_files(groups: list[str], manifest: dict) -> list[tuple[str, str]]:
    seen: set[tuple[str, str]] = set()
    files: list[tuple[str, str]] = []
    for group in groups:
        for entry in manifest["groups"].get(group, []):
            pair = (entry["src"], entry["dest"])
            if pair not in seen:
                seen.add(pair)
                files.append(pair)
    return files


def main():
    app_id = os.environ.get("APP_ID")
    private_key = os.environ.get("APP_PRIVATE_KEY")
    source_repo = os.environ.get("SOURCE_REPO", "themoment-team/themoment-ai-harness-sync")

    if not app_id or not private_key:
        print("Error: APP_ID and APP_PRIVATE_KEY must be set", file=sys.stderr)
        sys.exit(1)

    manifest = load_manifest()
    default_groups: list[str] = manifest.get("defaults", list(manifest["groups"].keys()))

    app_jwt = generate_jwt(app_id, private_key)

    installations = gh_api("/app/installations", app_jwt)
    if not isinstance(installations, list):
        installations = [installations]

    # repo full_name → resolved (src, dest) file list
    repo_files: dict[str, list[tuple[str, str]]] = {}

    for inst in installations:
        inst_id = inst["id"]
        try:
            inst_token = get_installation_token(inst_id, app_jwt)
        except subprocess.CalledProcessError:
            print(f"Warning: failed to get token for installation {inst_id}", file=sys.stderr)
            continue

        data = gh_api(f"/app/installations/{inst_id}/repositories", app_jwt)
        repos = data if isinstance(data, list) else data.get("repositories", [])

        for repo in repos:
            full_name = repo["full_name"]
            if full_name == source_repo:
                continue

            config = get_repo_harness_config(full_name, inst_token)
            if config and "groups" in config:
                groups = config["groups"]
                print(f"  {full_name}: groups={groups}", file=sys.stderr)
            else:
                groups = default_groups
                print(f"  {full_name}: no config, using defaults={groups}", file=sys.stderr)

            repo_files[full_name] = resolve_files(groups, manifest)

    if not repo_files:
        print("# No target repos found — check GitHub App installations", file=sys.stderr)
        print("group: []")
        return

    # 동일한 파일 셋을 원하는 레포끼리 하나의 group 항목으로 묶음
    files_to_repos: dict[tuple, list[str]] = defaultdict(list)
    for repo, files in repo_files.items():
        key = tuple(files)  # 순서 보존 (그룹 선언 순서 반영)
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