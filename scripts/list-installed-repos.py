#!/usr/bin/env python3
"""
GitHub App이 설치된 모든 레포를 installation 단위로 조회해서
GitHub Actions matrix용 JSON을 stdout으로 출력합니다.

출력 형식:
  [{"id": 12345, "config": "group:\n  - repos: |..."}, ...]

각 레포 루트의 .harness/sync.yml을 읽어 동기화할 항목을 결정합니다.
파일이 없으면 sync-manifest.yml의 defaults 그룹을 모두 적용합니다.

.harness/sync.yml 형식:
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
import io
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
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


def gh_api(endpoint: str, token: str) -> any:
    """Installation token 인증이 필요한 엔드포인트 호출 (gh CLI 사용)."""
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


SETTINGS_WITH_HOOKS = ".claude/settings.json"
SETTINGS_BASE = ".claude/templates/settings-base.json"


def resolve_files(
    config: dict | None,
    manifest: dict,
    default_groups: list[str],
) -> list[tuple[str, str]]:
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
        overrides: dict[str, bool] = {}
    else:
        selected_groups = config.get("groups", default_groups)
        overrides = config.get("overrides", {})
        # 하위 호환: 구형 exclude/include 형식 지원
        if not overrides and ("exclude" in config or "include" in config):
            for item_id in config.get("exclude", []):
                overrides[item_id] = False
            for item_id in config.get("include", []):
                overrides[item_id] = True

    selected: dict[str, tuple[str, str]] = {}

    for item_id, groups in item_groups.items():
        if any(g in selected_groups for g in groups):
            selected[item_id] = all_items[item_id]

    for item_id, override in overrides.items():
        if isinstance(override, str):
            versioned_id = f"{item_id}@{override}"
            if versioned_id in all_items:
                canonical_dest = all_items.get(item_id, all_items[versioned_id])[1]
                selected[item_id] = (all_items[versioned_id][0], canonical_dest)
            else:
                print(
                    f"Warning: {versioned_id} not in manifest, skipping pin",
                    file=sys.stderr,
                )
        elif override:
            if item_id in all_items:
                selected[item_id] = all_items[item_id]
        else:
            selected.pop(item_id, None)

    # hooks 포함 여부에 따라 settings.json 소스 파일 분기
    if "claude/settings" in selected:
        has_hooks = any(item_id.startswith("claude/hooks/") for item_id in selected)
        dest = selected["claude/settings"][1]
        selected["claude/settings"] = (
            SETTINGS_WITH_HOOKS if has_hooks else SETTINGS_BASE,
            dest,
        )

    return list(selected.values())


def build_sync_config(full_name: str, files: list[tuple[str, str]]) -> str:
    """BetaHuhn/repo-file-sync-action용 YAML 설정 문자열을 생성합니다 (레포 1개)."""
    if not files:
        return "group: []"

    buf = io.StringIO()
    buf.write("group:\n")
    buf.write("  - repos: |\n")
    buf.write(f"      {full_name}\n")
    buf.write("    files:\n")
    for src, dest in files:
        buf.write(f"      - source: {src}\n")
        buf.write(f"        dest: {dest}\n")
    return buf.getvalue()


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

    # 레포 단위 matrix (per-repo per-installation)
    matrix: list[dict] = []

    for inst in installations:
        inst_id = inst["id"]
        try:
            inst_token = get_installation_token(inst_id, app_jwt)
        except urllib.error.HTTPError as e:
            print(f"Warning: failed to get token for installation {inst_id}: {e}", file=sys.stderr)
            continue

        data = gh_api("/installation/repositories", inst_token)
        repos = data if isinstance(data, list) else data.get("repositories", [])

        for repo in repos:
            full_name = repo["full_name"]
            if full_name == source_repo:
                continue

            default_branch = repo.get("default_branch", "main")
            config = get_repo_harness_config(full_name, inst_token)

            branch_prefix = "harness-sync/"
            base_branch = default_branch
            if config:
                branch_prefix = config.get("branch_prefix", "harness-sync/")
                base_branch = config.get("base_branch", default_branch)
                overrides_log = config.get("overrides") or {
                    k: False for k in config.get("exclude", [])
                } | {k: True for k in config.get("include", [])}
                print(
                    f"  [{inst_id}] {full_name}: groups={config.get('groups')} "
                    f"overrides={overrides_log} "
                    f"branch_prefix={branch_prefix} base_branch={base_branch}",
                    file=sys.stderr,
                )
            else:
                print(
                    f"  [{inst_id}] {full_name}: no config, using defaults={default_groups} "
                    f"base_branch={base_branch}",
                    file=sys.stderr,
                )

            files = resolve_files(config, manifest, default_groups)
            if not files:
                continue

            matrix.append({
                "inst_id": inst_id,
                "repo": full_name,
                "branch_prefix": branch_prefix,
                "base_branch": base_branch,
                "config": build_sync_config(full_name, files),
            })

    print(json.dumps(matrix))


if __name__ == "__main__":
    main()