import json
from pathlib import Path

for name in ("manus-command", "spec"):
    src = Path(f"/home/ubuntu/sep4-exam-practice-app-v01/source/{name}.json")
    dst = src.with_suffix(".txt")
    data = json.loads(src.read_text())
    parts = []
    for item in data.get("body", {}).get("content", []):
        paragraph = item.get("paragraph", {})
        for element in paragraph.get("elements", []):
            text = element.get("textRun", {}).get("content")
            if text:
                parts.append(text)
    dst.write_text("".join(parts))
    print(dst)
