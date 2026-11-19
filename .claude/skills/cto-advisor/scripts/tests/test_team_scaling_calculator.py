#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / 'team_scaling_calculator.py'
SPEC = importlib.util.spec_from_file_location('team_scaling_calculator', MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
tsc = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = tsc
SPEC.loader.exec_module(tsc)

HIRING_PLAN = {
    'by_role': {
        'senior_engineer': {'hires_needed': 2},
        'qa': {'hires_needed': 1},
    },
    'total_hires_needed': 3,
}


class CalculateBudgetTests(unittest.TestCase):
    def setUp(self) -> None:
        self.calculator = tsc.TeamScalingCalculator()

    def salary_cost(self, location: str) -> float:
        budget = self.calculator._calculate_budget(HIRING_PLAN, location)
        return budget['annual_salary_cost']

    def test_us_baseline(self) -> None:
        self.assertEqual(self.salary_cost('US'), 2 * 160000 + 100000)

    def test_eu_scales_us_by_0_8(self) -> None:
        self.assertAlmostEqual(self.salary_cost('EU'), self.salary_cost('US') * 0.8)

    def test_apac_scales_us_by_0_6(self) -> None:
        self.assertAlmostEqual(self.salary_cost('APAC'), self.salary_cost('US') * 0.6)


if __name__ == '__main__':
    unittest.main()
