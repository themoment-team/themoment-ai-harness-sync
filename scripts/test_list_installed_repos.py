import importlib.util
import pathlib
import sys
import types
import unittest


MODULE_PATH = pathlib.Path(__file__).with_name("list-installed-repos.py")
SPEC = importlib.util.spec_from_file_location("list_installed_repos", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
yaml = types.ModuleType("yaml")
yaml.safe_load = lambda source: source
sys.modules.setdefault("yaml", yaml)
SPEC.loader.exec_module(MODULE)


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
