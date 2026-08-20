import json
from pathlib import Path

root = Path('/home/ubuntu/sep4-exam-practice-app-v01/source')
data = json.loads((root / 'app-db.json').read_text())
with (root / 'sheet-tabs.tsv').open('w') as out:
    for sheet in data.get('sheets', []):
        props = sheet.get('properties', {})
        out.write(f"\n## {props.get('title')}\t{props.get('sheetId')}\n")
        for grid in sheet.get('data', []):
            for row in grid.get('rowData', []):
                vals = []
                for cell in row.get('values', []):
                    v = cell.get('formattedValue', '')
                    vals.append(str(v).replace('\t', ' ').replace('\n', ' '))
                if vals:
                    out.write('\t'.join(vals) + '\n')
