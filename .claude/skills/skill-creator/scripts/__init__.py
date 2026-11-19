"""Skill Creator tools: Python 3.14.x is required for package/module execution."""

import sys

if sys.version_info[:2] != (3, 14):
    raise RuntimeError(
        'skill-creator requires Python 3.14.x; '
        f'current runtime is {sys.version_info.major}.{sys.version_info.minor}.'
        f'{sys.version_info.micro}. '
        'Use python3.14 -m scripts.<module>.'
    )
