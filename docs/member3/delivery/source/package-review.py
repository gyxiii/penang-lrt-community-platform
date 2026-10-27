from pathlib import Path
from datetime import datetime, timezone
import argparse, hashlib, json, shutil, subprocess, zipfile

repo = Path(__file__).resolve().parents[4]
workspace = repo.parent.parent
git = Path('C:/Users/Hankin Li/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe')
parser = argparse.ArgumentParser()
parser.add_argument('mode', choices=['stage', 'archive'])
args = parser.parse_args()
raw = subprocess.check_output([str(git), '-C', str(repo), 'ls-files', '-c', '--others', '--exclude-standard', '-z'])
paths = sorted(set(raw.decode('utf-8').split('\0')) - {''})
def forbidden(relative):
    p = Path(relative)
    return any(part in {'.git', 'node_modules', '__pycache__'} for part in p.parts) or p.name.startswith(('~$', '.env')) or relative.replace('\\', '/') == 'js/google-map-config.js' or p.suffix in {'.log', '.pyc'}
paths = [p for p in paths if not forbidden(p)]
head = subprocess.check_output([str(git), '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()
if args.mode == 'stage':
    stage = workspace / 'tmp' / 'member3-final' / 'clean-review' / repo.name
    stage.mkdir(parents=True, exist_ok=False)
    for name in paths:
        source = repo / name
        if not source.is_file() or source.is_symlink():
            raise ValueError('Unexpected source path: ' + name)
        target = stage / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    assert not (stage / 'js/google-map-config.js').exists()
    print(json.dumps({'staging': str(stage), 'files': len(paths), 'baseRevision': head}, ensure_ascii=False))
else:
    out = workspace / '交付文件'
    out.mkdir(exist_ok=True)
    archive = out / 'Member3_交付包_2026-10-28.zip'
    manifest = {'createdAt': datetime.now(timezone.utc).isoformat(), 'baseRevision': head, 'branch': 'member3-feedback-ui', 'scope': 'Local review snapshot; formal admin integration and group submission remain external tasks', 'files': []}
    for name in paths:
        data = (repo / name).read_bytes()
        manifest['files'].append({'path': name.replace('\\', '/'), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for entry in manifest['files']:
            z.write(repo / entry['path'], arcname=repo.name + '/' + entry['path'])
        z.writestr(repo.name + '/DELIVERY_CONTENTS.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        names = z.namelist()
        assert not any(forbidden(str(Path(n).relative_to(repo.name))) for n in names)
        assert repo.name + '/feedback.html' in names
        assert repo.name + '/docs/member3/report/Member3_Prototype_Design.docx' in names
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (out / 'Member3_交付包_2026-10-28.sha256').write_text(digest + '  ' + archive.name + '\n', encoding='utf-8')
    (out / '交付文件清单.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'files': len(paths) + 1, 'sha256': digest}, ensure_ascii=False))
