"""Restore the reviewed source transport with an exact SHA-256 allowlist.
Transport is temporary; decoded source files are committed only after tests.
"""
from pathlib import Path
import base64, hashlib, json, zlib
ROOT=Path(__file__).resolve().parents[1]
EXPECTED='f2833f6d94d447494f9c86c9153817e43b8fb29f5520f12ebbc557a2a4728d22'
ALLOWED={'shared/kurulus-core.js','shared/kurulus-entry.js','shared/tank-adapter.js','shared/kurulus-runtime.js','shared/kurulus.css','shared/site-adapter.inc.js','shared/range-adapter.inc.js','shared/kurulus.test.cjs','shared/radio-tr.js','kurulus/index.html','kurulus/manifest.webmanifest','kurulus/campaign.js','scripts/kurulus-integrate.cjs','scripts/kurulus-browser.cjs'}
parts=[ROOT/('scripts/kurulus-pack-'+str(i)+'.txt') for i in range(3)]
if not any(p.exists() for p in parts):
 if not all((ROOT/p).is_file() for p in ALLOWED):raise SystemExit('Missing source transport and expanded sources')
 print('Expanded sources already present')
 raise SystemExit(0)
encoded=''.join(p.read_text().strip() for p in parts)
# Correct three observed transport transcription artifacts, never application code.
# Full decoded hash below remains authoritative; any other alteration fails closed.
encoded=encoded.replace('3G5fd3G5fd3','3G5fd3').replace('Wi4T6r','Wi4X6r').replace('GE4YC7Ah','GE4QD7Ah')
raw=zlib.decompress(base64.b64decode(encoded,validate=True))
if len(raw)!=85345 or hashlib.sha256(raw).hexdigest()!=EXPECTED:raise SystemExit('Source package checksum mismatch')
files=json.loads(raw)
if set(files)!=ALLOWED or not all(isinstance(v,str) for v in files.values()):raise SystemExit('Unexpected source file set')
for name,text in files.items():
 p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')
print('Restored',len(files),'source files; SHA-256',EXPECTED)
