"""Rebuild the public catalog from the reviewed source, without editing generated HTML."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent
props=json.loads((root/"catalog-source.json").read_text())
assert len({p["id"] for p in props})==len(props)
(root/"dist/properties.json").write_text(json.dumps(props,ensure_ascii=False,indent=2)+"\n")
