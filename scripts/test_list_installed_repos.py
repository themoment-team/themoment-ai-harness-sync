import importlib.util
import json
import pathlib
import sys
import types
import unittest
from unittest.mock import patch


MODULE_PATH = pathlib.Path(__file__).with_name("list-installed-repos.py")
SPEC = importlib.util.spec_from_file_location("list_installed_repos", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
yaml = types.ModuleType("yaml")
yaml.safe_load = lambda source: source
sys.modules.setdefault("yaml", yaml)
SPEC.loader.exec_module(MODULE)


class GhApiTest(unittest.TestCase):
    def call_api(self, pages):
        with patch.object(MODULE.subprocess, "run") as run:
            run.return_value.stdout = json.dumps(pages)
            result = MODULE.gh_api("/installation/repositories", "test-token")
            self.assertEqual(
                run.call_args.args[0],
                ["gh", "api", "/installation/repositories", "--paginate", "--slurp"],
            )
        return result

    def test_merges_repository_objects_across_pages(self):
        self.assertEqual(
            self.call_api([
                {"total_count": 2, "repositories": [{"full_name": "acme/api"}]},
                {"total_count": 2, "repositories": [{"full_name": "acme/web"}]},
            ]),
            {
                "total_count": 2,
                "repositories": [{"full_name": "acme/api"}, {"full_name": "acme/web"}],
            },
        )

    def test_preserves_single_repository_page(self):
        page = {"total_count": 1, "repositories": [{"full_name": "acme/api"}]}
        self.assertEqual(self.call_api([page]), page)

    def test_preserves_empty_repository_list(self):
        page = {"total_count": 0, "repositories": []}
        self.assertEqual(self.call_api([page]), page)

    def test_merges_array_pages_without_corrupting_strings(self):
        self.assertEqual(
            self.call_api([[{"name": "a][b"}], [], [{"name": "web"}]]),
            [{"name": "a][b"}, {"name": "web"}],
        )

    def test_preserves_empty_array(self):
        self.assertEqual(self.call_api([[]]), [])

    def test_preserves_other_single_objects(self):
        self.assertEqual(self.call_api([{"id": 123}]), {"id": 123})


class SelectTargetRepositoriesTest(unittest.TestCase):
    def test_returns_only_the_exact_requested_repository(self):
        repositories = [
            {"full_name": "acme/api"},
            {"full_name": "acme/web"},
        ]

        self.assertEqual(
            MODULE.select_target_repositories(repositories, "acme/web"),
            [{"full_name": "acme/web"}],
        )


if __name__ == "__main__":
    unittest.main()
