import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
HOOKS = (
    (".claude", "preToolUse.sh", "Bash", "command"),
    (".codex", "pre-tool-use.sh", "shell", "cmd"),
    (".codex", "pre-tool-use.sh", "Bash", "command"),
)


@unittest.skipUnless(
    all(shutil.which(tool) for tool in ("bash", "git", "jq")),
    "bash, git, jq가 필요합니다",
)
class LoggingHooksTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory(prefix="logging-hooks-")
        self.addCleanup(self.temporary_directory.cleanup)
        self.directory = Path(self.temporary_directory.name).resolve()
        self.project = self.directory / "프로젝트 with spaces"
        self.process_directory = self.directory / "other-repository"
        self.project.mkdir()
        self.process_directory.mkdir()
        self.git("init", "-q", str(self.project))
        self.git("init", "-q", str(self.process_directory))

    def git(self, *arguments):
        subprocess.run(
            ["git", *arguments], check=True, capture_output=True, text=True
        )

    def run_hooks(self, project, cwd_fields, expected_root=None, tool_name=None):
        command = 'printf "%s" "로깅 경로 확인"'
        for directory, filename, default_tool, command_key in HOOKS:
            with self.subTest(directory=directory, tool=default_tool):
                for log in self.directory.rglob("command.log"):
                    log.unlink()
                relative_script = Path(directory) / "hooks/modules/logging" / filename
                installed_script = project / relative_script
                installed_script.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(REPOSITORY_ROOT / relative_script, installed_script)
                payload = {
                    "tool_name": tool_name or default_tool,
                    "tool_input": {command_key: command},
                    **cwd_fields,
                }
                environment = dict(os.environ, CLAUDE_PROJECT_DIR=str(project))
                for _ in range(2):
                    result = subprocess.run(
                        ["bash", str(installed_script)],
                        input=json.dumps(payload),
                        cwd=self.process_directory,
                        env=environment,
                        check=True,
                        capture_output=True,
                        text=True,
                    )
                    self.assertEqual(result.stderr, "")
                    self.assertEqual(result.stdout, "")
                logs = sorted(self.directory.rglob("command.log"))
                if expected_root is None:
                    self.assertEqual(logs, [])
                else:
                    expected_log = expected_root / directory / "command.log"
                    self.assertEqual(logs, [expected_log])
                    lines = expected_log.read_text().splitlines()
                    self.assertEqual(len(lines), 2)
                    for line in lines:
                        self.assertTrue(line.endswith("] " + command), line)
                    expected_log.unlink()

    def test_root_cwd_records_at_project_root(self):
        self.run_hooks(self.project, {"cwd": str(self.project)}, self.project)

    def test_nested_cwd_records_at_git_root(self):
        nested = self.project / "src/feature"
        nested.mkdir(parents=True)
        self.run_hooks(self.project, {"cwd": str(nested)}, self.project)

    def test_missing_cwd_uses_installed_project(self):
        for fields in ({}, {"cwd": None}):
            with self.subTest(fields=fields):
                self.run_hooks(self.project, fields, self.project)

    def test_invalid_cwd_uses_installed_project(self):
        self.run_hooks(
            self.project, {"cwd": str(self.directory / "missing")}, self.project
        )

    def test_non_git_project_records_at_installed_project_root(self):
        project = self.directory / "non-git-project"
        nested = project / "src/feature"
        nested.mkdir(parents=True)
        self.run_hooks(project, {"cwd": str(nested)}, project)

    def test_worktree_records_at_its_own_root(self):
        self.git(
            "-C", str(self.project),
            "-c", "user.name=Logging Hook Test",
            "-c", "user.email=logging-hook-test@example.invalid",
            "-c", "commit.gpgsign=false",
            "-c", "core.hooksPath=/dev/null",
            "commit", "--allow-empty", "-qm", "테스트용 초기 커밋",
        )
        worktree = self.directory / "worktree"
        self.git("-C", str(self.project), "worktree", "add", "--detach", str(worktree))
        nested = worktree / "src/feature"
        nested.mkdir(parents=True)
        self.run_hooks(worktree, {"cwd": str(nested)}, worktree)

    def test_non_shell_tool_does_not_create_a_log(self):
        self.run_hooks(self.project, {"cwd": str(self.project)}, tool_name="Read")


if __name__ == "__main__":
    unittest.main()
