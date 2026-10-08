"""Execute the generated trigger-review page in a real Chromium browser."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

NODE_TEST = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent(fs.readFileSync(process.argv[1], 'utf8'));
    if (process.argv[2] === 'labels') {
      for (const number of [1, 2]) {
        const query = page.getByRole('textbox', { name: `Query ${number}`, exact: true });
        assert.equal(await query.count(), 1, `Query ${number} needs an accessible row label`);
        const trigger = page.getByRole('checkbox', {
          name: `Should trigger for query ${number}`, exact: true,
        });
        assert.equal(await trigger.count(), 1, `Trigger ${number} needs an accessible row label`);
      }
    } else {
      await page.getByRole('button', { name: '+ Add Query', exact: true }).click();
      const activeQuery = await page.evaluate(() => document.activeElement.value);
      assert.equal(activeQuery, '', 'Add Query must focus the inserted blank query after sorting');
      await page.keyboard.type('new positive query');
      const added = page.getByRole('textbox', { name: 'Query 3', exact: true });
      assert.equal(await added.inputValue(), 'new positive query');
      assert.equal(await page.getByRole('checkbox', {
        name: 'Should trigger for query 3', exact: true,
      }).isChecked(), true);
      assert.equal(await page.locator('textarea').nth(2).inputValue(), 'existing negative query');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
"""


@unittest.skipUnless(shutil.which("node"), "Node is required for the real-browser UI regression")
class EvalReviewBrowserTests(unittest.TestCase):
    def run_browser_case(self, case: str) -> None:
        creator = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill = root / "skill"
            skill.mkdir()
            (skill / "SKILL.md").write_text(
                "---\nname: demo\ndescription: test skill\n---\n", encoding="utf-8"
            )
            source = root / "evals.json"
            source.write_text(json.dumps([
                {"query": "existing positive query", "should_trigger": True},
                {"query": "existing negative query", "should_trigger": False},
            ]), encoding="utf-8")
            output = root / "review.html"
            generated = subprocess.run(
                [sys.executable, str(creator / "scripts" / "generate_eval_review.py"),
                 "--eval-set", str(source), "--skill-path", str(skill),
                 "--output", str(output)],
                capture_output=True, text=True, check=False,
            )
            self.assertEqual(generated.returncode, 0, generated.stderr)
            browser = subprocess.run(
                ["node", "--eval", NODE_TEST, str(output), case],
                cwd=creator, capture_output=True, text=True, check=False, timeout=30,
            )
            self.assertEqual(browser.returncode, 0, browser.stderr)

    def test_query_and_trigger_controls_have_accessible_row_labels(self) -> None:
        self.run_browser_case("labels")

    def test_add_query_focuses_inserted_positive_row_before_existing_negative(self) -> None:
        self.run_browser_case("focus")


if __name__ == "__main__":
    unittest.main()
