from typing import Any


class YAML:
    @property
    def data(self) -> object: ...


class YAMLError(Exception): ...


def load(
    yaml_string: str,
    schema: object | None = None,
    label: str = "<unicode string>",
) -> YAML: ...
