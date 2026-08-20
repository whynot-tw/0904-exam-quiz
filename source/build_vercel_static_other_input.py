import json
from pathlib import Path
src = json.loads(Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-static-input.json').read_text())
src['name'] = '0904-exam-quiz-static-preview'
src['projectSettings'] = {'framework': 'other', 'outputDirectory': '.', 'buildCommand': ''}
Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-static-other-input.json').write_text(json.dumps(src, ensure_ascii=False))
print('files', len(src['files']))
