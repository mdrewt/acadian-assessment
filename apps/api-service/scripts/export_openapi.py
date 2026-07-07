"""Export the FastAPI OpenAPI schema to a JSON file (no server required).

Used by the SDK build to regenerate the TypeScript client from the backend's
contract. Importing the app does not perform any network I/O.

Usage:
    python scripts/export_openapi.py [output_path]

Defaults to libs/sdk/openapi.json at the repo root.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure the api-service root is importable when run as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import create_app

DEFAULT_OUTPUT = (
    Path(__file__).resolve().parent.parent.parent.parent / "libs" / "sdk" / "openapi.json"
)


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    output.parent.mkdir(parents=True, exist_ok=True)

    schema = create_app().openapi()
    output.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote OpenAPI schema to {output}")


if __name__ == "__main__":
    main()
