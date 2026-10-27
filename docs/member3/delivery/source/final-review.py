from pathlib import Path
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib, json, re, shutil

repo = Path(__file__).resolve().parents[4]
workspace = repo.parent.parent
stage = workspace / 'tmp/member3-final/clean-review' / repo.name
member = repo / 'docs/member3'
evidence = member / 'delivery/evidence'
evidence.mkdir(parents=True, exist_ok=True)
suite_files = [('feedback', 'verification.json', 62), ('ui', 'ui-verification.json', 58), ('integration', 'integration-verification.json', 20)]
suites = []
for name, filename, expected in suite_files:
    p = stage / 'docs/member3' / filename
    result = json.loads(p.read_text(encoding='utf-8'))
    assert len(result['checks']) == expected and all(check['result'] == 'PASS' for check in result['checks']), name
    assert not result.get('errors') and not result.get('badLocal') and not result.get('failure'), name
    dest = member / filename if name == 'integration' else evidence / (name + '-clean.json')
    shutil.copy2(p, dest)
    suites.append({'suite': name, 'passed': expected, 'evidence': dest.relative_to(member).as_posix()})

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {'href', 'src', 'action'} and value:
                self.links.append(value)

references = []
missing = []
generated = []
htmls = sorted(list(repo.glob('*.html')) + list((member / 'ui').glob('*.html')))
def inspect(source, value):
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return
    target = (repo / unquote(url.path.lstrip('/')) if url.path.startswith('/') else source.parent / unquote(url.path)).resolve()
    row = {'source': source.relative_to(repo).as_posix(), 'target': target.relative_to(repo).as_posix()}
    if row['target'] == 'js/google-map-config.js':
        generated.append(row)
    elif not target.exists():
        missing.append(row)
    references.append(row)

for p in htmls:
    parser = Links()
    parser.feed(p.read_text(encoding='utf-8'))
    for value in parser.links:
        inspect(p, value)
for p in sorted(list((repo / 'css').glob('*.css')) + list((repo / 'assets/vendor/leaflet').glob('*.css')) + list((member / 'ui').glob('*.css'))):
    for value in re.findall(r'url\(\s*[\'"]?([^\)\'\"]+)', p.read_text(encoding='utf-8')):
        inspect(p, value.strip())
assert set(row['target'] for row in missing) == {'admin.html'}, missing

image_root = repo / 'assets/vendor/leaflet/images'
image_source = json.loads((image_root / 'SOURCE.json').read_text(encoding='utf-8'))
for item in image_source['files']:
    assert hashlib.sha256((image_root / item['name']).read_bytes()).hexdigest() == item['sha256']
    assert (stage / 'assets/vendor/leaflet/images' / item['name']).read_bytes() == (image_root / item['name']).read_bytes()

checked_source = []
for source in stage.rglob('*'):
    if not source.is_file() or source.suffix not in {'.html', '.css', '.js', '.cjs', '.py', '.ps1', '.cmd', '.svg', '.docx'}:
        continue
    relative = source.relative_to(stage)
    if relative.as_posix() == 'js/google-map-config.js':
        continue
    original = repo / relative
    assert original.is_file() and source.read_bytes() == original.read_bytes(), relative
    checked_source.append(relative.as_posix())

report = member / 'report/Member3_Prototype_Design.docx'
report_check = json.loads((member / 'report/report-verification.json').read_text(encoding='utf-8'))
assert hashlib.sha256(report.read_bytes()).hexdigest() == report_check['sha256']
assert report_check['pages'] == 2 and report_check['figureCount'] == 4
assert (stage / 'js/google-map-config.js').is_file()
staged_config = (stage / 'js/google-map-config.js').read_text(encoding='utf-8')
assert re.search(r"apiKey\s*:\s*['\"]['\"]", staged_config), 'The clean launcher configuration is not blank'

output = member / 'final-verification.json'
md_checked = []
for p in [repo / 'README.md', *member.rglob('*.md')]:
    for value in re.findall(r'\]\(([^)]+)\)', p.read_text(encoding='utf-8')):
        u = urlsplit(value)
        if u.scheme or u.netloc or not u.path:
            continue
        target = (p.parent / unquote(u.path)).resolve()
        assert target.exists() or target == output, (p, value)
    md_checked.append(p.relative_to(repo).as_posix())

result = {
    'checkedAt': datetime.now(timezone.utc).isoformat(),
    'environment': 'Clean copied project without Git metadata or original private map configuration',
    'baseRevision': 'ba524b170181c86623d9d6a9c1a5134c38579fea',
    'remoteMainAtCheck': 'ba524b170181c86623d9d6a9c1a5134c38579fea',
    'suites': suites,
    'browserChecksPassed': sum(s['passed'] for s in suites),
    'scriptErrors': [], 'failedModuleRequests': [],
    'sourceFilesIdenticalToTestedCopy': len(checked_source),
    'htmlPagesAudited': len(htmls), 'localReferencesAudited': len(references),
    'unexpectedMissingTargets': [],
    'restoredLeafletImages': {'version': image_source['version'], 'count': len(image_source['files']), 'source': 'assets/vendor/leaflet/images/SOURCE.json', 'hashesVerified': True},
    'knownMissingTargets': missing,
    'generatedLocalConfiguration': generated,
    'launcher': 'Prepare-only generated a blank map configuration in the clean copy; source private configuration was not copied or changed',
    'report': {'pages': 2, 'figures': 4, 'sha256': report_check['sha256'], 'changedSinceWordReview': False},
    'markdownFilesAudited': md_checked,
    'limitations': ['Formal admin.html and a staff UI connected to the shared feedback store remain for the administrator module owner', 'No real server, database or staff authentication is claimed', 'Personal video and group coursework submission remain human/group tasks'],
    'git': {'branch': 'member3-feedback-ui', 'committed': False, 'pushed': False, 'pullRequestCreated': False}
}
output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'browserChecksPassed': result['browserChecksPassed'], 'htmlPages': len(htmls), 'localReferences': len(references), 'knownMissingTargets': len(missing), 'unexpectedMissingTargets': 0, 'sourceFilesMatched': len(checked_source)}, ensure_ascii=False))
