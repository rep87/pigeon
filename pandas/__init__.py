"""Lightweight pandas stub for offline testing.

This module implements a very small subset of the pandas API used by the
simulator. It is not a drop-in replacement for real pandas but is sufficient
for deterministic smoke tests in constrained environments.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, Iterator, List, Sequence


class Series:
    def __init__(self, data: Sequence[Any]):
        self.data = list(data)

    def __iter__(self) -> Iterator[Any]:
        return iter(self.data)

    def __len__(self) -> int:  # pragma: no cover - trivial
        return len(self.data)

    def __getitem__(self, idx: int) -> Any:
        return self.data[idx]

    def __setitem__(self, idx: int, value: Any) -> None:
        self.data[idx] = value

    def __add__(self, other: Any) -> "Series":
        if isinstance(other, Series):
            return Series([a + b for a, b in zip(self.data, other.data)])
        return Series([a + other for a in self.data])

    def __sub__(self, other: Any) -> "Series":
        if isinstance(other, Series):
            return Series([a - b for a, b in zip(self.data, other.data)])
        return Series([a - other for a in self.data])

    def __rsub__(self, other: Any) -> "Series":
        return Series([other - a for a in self.data])

    def __mul__(self, other: Any) -> "Series":
        if isinstance(other, Series):
            return Series([a * b for a, b in zip(self.data, other.data)])
        return Series([a * other for a in self.data])

    def __truediv__(self, other: Any) -> "Series":
        if isinstance(other, Series):
            return Series([a / b for a, b in zip(self.data, other.data)])
        return Series([a / other for a in self.data])

    def __eq__(self, other: Any) -> "Series":
        return Series([a == other for a in self.data])

    def sum(self) -> float:
        return float(sum(self.data))

    def clip(self, lower: float | None = None) -> "Series":
        if lower is None:
            return Series(self.data)
        return Series([max(lower, v) for v in self.data])

    @property
    def iloc(self) -> "_ILocAccessor":
        return _ILocAccessor(self.data)


class _ILocAccessor:
    def __init__(self, data: Sequence[Any]):
        self.data = list(data)

    def __getitem__(self, idx: int) -> Any:
        return self.data[idx]


class Row(dict):
    def copy(self) -> "Row":  # pragma: no cover - trivial
        return Row(self)


class DataFrame:
    def __init__(self, rows: Iterable[Dict[str, Any]] | None = None):
        self.rows: List[Row] = [Row(r) for r in rows] if rows is not None else []

    @property
    def columns(self) -> List[str]:
        if not self.rows:
            return []
        cols = set()
        for row in self.rows:
            cols.update(row.keys())
        return list(cols)

    def copy(self) -> "DataFrame":
        return DataFrame([dict(r) for r in self.rows])

    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, str):
            return Series([row.get(key) for row in self.rows])
        if isinstance(key, Series):
            mask = key.data
            filtered = [row for row, keep in zip(self.rows, mask) if keep]
            return DataFrame(filtered)
        raise TypeError("Unsupported key type")

    def __setitem__(self, key: str, value: Any) -> None:
        if isinstance(value, Series):
            for row, val in zip(self.rows, value.data):
                row[key] = val
        else:
            for row in self.rows:
                row[key] = value

    @property
    def empty(self) -> bool:
        return len(self.rows) == 0

    def merge(self, other: "DataFrame", on: str, how: str = "left") -> "DataFrame":
        combined: List[Row] = []
        for row in self.rows:
            matches = [o for o in other.rows if o.get(on) == row.get(on)]
            if not matches:
                if how == "left":
                    combined.append(Row({**row}))
                continue
            for match in matches:
                merged_row = Row({**row, **match})
                combined.append(merged_row)
        return DataFrame(combined)

    def iterrows(self):
        for idx, row in enumerate(self.rows):
            yield idx, row

    def __len__(self) -> int:  # pragma: no cover - trivial
        return len(self.rows)

    def __bool__(self) -> bool:  # pragma: no cover - trivial
        return bool(self.rows)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"DataFrame({self.rows!r})"

    @property
    def iloc(self) -> "_DataFrameILoc":
        return _DataFrameILoc(self.rows)


class _DataFrameILoc:
    def __init__(self, rows: List[Row]):
        self.rows = rows

    def __getitem__(self, idx: int) -> Row:
        return self.rows[idx]


def notna(value: Any) -> bool:
    return value is not None


__all__ = ["DataFrame", "Series", "notna"]
