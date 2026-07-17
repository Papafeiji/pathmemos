#!/usr/bin/env python3
"""
Check that sqlc-generated Go code is internally consistent:
for each query, the number of selected columns in the SQL string
must equal the number of Scan destinations in the generated function.

This catches the common failure mode where backend/internal/db/sqlc/*.sql
is updated but the corresponding *.sql.go is not regenerated, leaving the
query string stale while the struct/Scan targets reflect the new SQL.
"""

import re
import sys
from pathlib import Path

SQLC_DIR = Path("backend/internal/db/sqlc")


def count_select_columns(sql: str) -> int | None:
    """Count columns in a SELECT or RETURNING clause. Returns None for non-SELECT."""
    sql_lower = sql.lower()

    # Find top-level RETURNING clause
    returning_idx = sql_lower.rfind(" returning ")
    if returning_idx != -1:
        # Ensure 'returning' is not inside parentheses
        depth = 0
        valid = True
        for ch in sql_lower[:returning_idx]:
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
        if depth == 0:
            cols = sql[returning_idx + len(" returning "):].strip()
            if cols == "*":
                return None
            return _split_top_level_columns(cols)

    # Find top-level SELECT ... FROM
    if not sql_lower.startswith("select "):
        return None

    # Locate the top-level FROM (not inside parentheses)
    depth = 0
    from_idx = None
    i = len("select")
    while i < len(sql_lower):
        ch = sql_lower[i]
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif depth == 0 and sql_lower.startswith(" from ", i):
            from_idx = i
            break
        i += 1

    if from_idx is None:
        return None

    cols = sql[len("select"):from_idx].strip()
    if cols == "*":
        return None
    return _split_top_level_columns(cols)


def _split_top_level_columns(cols: str) -> int:
    """Split a comma-separated column list, respecting parentheses nesting."""
    depth = 0
    parts = []
    current = []
    for ch in cols:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "," and depth == 0:
            parts.append("".join(current))
            current = []
            continue
        current.append(ch)
    if current:
        parts.append("".join(current))
    return len([p for p in parts if p.strip()])


def extract_query_consts(path: Path) -> dict:
    """Extract query constants from a generated .sql.go file."""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r'const (\w+) = `-- name: (\w+) :(\w+)\n(.*?)`', re.DOTALL)
    result = {}
    for const_name, query_name, cmd, body in pattern.findall(text):
        result[const_name] = {
            "query_name": query_name,
            "cmd": cmd,
            "body": body.strip(),
        }
    return result


def extract_scan_counts(path: Path) -> dict:
    """For each query function, count the number of Scan destinations."""
    text = path.read_text(encoding="utf-8")
    # Match function bodies that call row.Scan(...) or rows.Scan(...)
    pattern = re.compile(
        r'func \(q \*Queries\) (\w+)\(.*?'  # function signature
        r'(?:row|rows)\.Scan\((.*?)\)',
        re.DOTALL,
    )
    result = {}
    for func_name, scan_args in pattern.findall(text):
        # Count non-empty &i.X arguments
        args = [a.strip() for a in scan_args.split(",") if a.strip()]
        result[func_name] = len(args)
    return result


def main() -> int:
    mismatches = []
    for go_file in sorted(SQLC_DIR.glob("*.sql.go")):
        consts = extract_query_consts(go_file)
        scans = extract_scan_counts(go_file)
        for const_name, info in consts.items():
            cmd = info["cmd"]
            if cmd not in ("one", "many", "batchmany"):
                # :exec, :execrows, etc. do not Scan results
                continue
            func_name = info["query_name"]
            col_count = count_select_columns(info["body"])
            scan_count = scans.get(func_name)
            if col_count is None or scan_count is None:
                continue
            if col_count != scan_count:
                mismatches.append({
                    "file": str(go_file),
                    "query": info["query_name"],
                    "const": const_name,
                    "columns": col_count,
                    "scan_targets": scan_count,
                })

    if not mismatches:
        print("sqlc generated code is internally consistent: all SELECT/RETURNING column counts match Scan target counts.")
        return 0

    print(f"Found {len(mismatches)} sqlc generated query with mismatched columns/scan targets:\n")
    for m in mismatches:
        print(f"--- {m['file']} :: {m['query']} ---")
        print(f"  SQL columns: {m['columns']}, Scan targets: {m['scan_targets']}")
    print("\nThis usually means backend/internal/db/sqlc/*.sql was updated but *.sql.go was not regenerated.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
