"""Tests for package-level public API exports."""

from skills_ref import read_properties, to_prompt, validate


def test_package_exports_documented_api():
    assert callable(validate)
    assert callable(read_properties)
    assert callable(to_prompt)
