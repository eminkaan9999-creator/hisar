"""Expand the hash-verified source transport once; no network downloads."""
from pathlib import Path
import hashlib, io, zipfile
root=Path(__file__).resolve().parent
if not (root/'build.py').exists():
    raw=b''.join((root/f'transport/part{i}.bin').read_bytes() for i in range(1,4))
    assert hashlib.sha256(raw).hexdigest()=='a56752f14fd2f7c400a68596cf04298992270fdb815df539b6d9b0a322474923', 'Source checksum mismatch'
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        for name in z.namelist():
            p=Path(name)
            assert not p.is_absolute() and '..' not in p.parts
            assert name in ['build.py','README.md','tests/unit.cjs','tests/browser.cjs'] or name.startswith('app/')
        z.extractall(root)
    print('Verified KOMUTA sources expanded')
else:
    print('Plain KOMUTA sources already present')
