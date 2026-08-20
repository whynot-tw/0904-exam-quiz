import json
from pathlib import Path

root = Path('/home/ubuntu/sep4-exam-practice-app-v01')
exclude_dirs = {'.git', '.manus-logs', 'node_modules', 'dist', 'source'}
files = []
for path in root.rglob('*'):
    if not path.is_file():
        continue
    rel = path.relative_to(root).as_posix()
    if any(part in exclude_dirs for part in path.relative_to(root).parts):
        continue
    if rel.endswith('.pdf') or rel.endswith('.json') and rel.startswith('drizzle/meta'):
        continue
    files.append({'file': rel, 'data': path.read_text(encoding='utf-8', errors='replace'), 'encoding': 'utf-8'})
Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-deploy-input.json').write_text(json.dumps({'name': '0904-exam-quiz', 'target': 'preview', 'projectSettings': {'buildCommand': 'pnpm build', 'installCommand': 'pnpm install'}, 'files': files}, ensure_ascii=False))
print('files', len(files), 'bytes', Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-deploy-input.json').stat().st_size)
