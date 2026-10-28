"""STL ag onarimi: kopuk kose (T-baglanti) noktalarini ucgen kenarlarina ekler,
boylece her kenari tam iki ucgen paylasir (su gecirmez, dilimleyici uyari vermez)."""
import struct, sys, collections
import numpy as np

def load(path):
    d = open(path, 'rb').read()
    n = struct.unpack('<I', d[80:84])[0]
    tris = []
    for i in range(n):
        v = struct.unpack('<12f', d[84 + i*50: 84 + i*50 + 48])
        tris.append((v[3:6], v[6:9], v[9:12]))
    return tris

def weld(tris, q=1e-4):
    idx = {}
    verts = []
    out = []
    for t in tris:
        ids = []
        for p in t:
            k = tuple(int(round(c / q)) for c in p)
            if k not in idx:
                idx[k] = len(verts); verts.append(p)
            ids.append(idx[k])
        if len(set(ids)) == 3:
            out.append(tuple(ids))
    return np.array(verts, dtype=float), out

def split_tjunctions(V, F, eps=1e-4):
    changed = True
    rounds = 0
    while changed and rounds < 20:
        changed = False; rounds += 1
        newF = []
        for f in F:
            done = False
            for e in range(3):
                a, b = f[e], f[(e+1) % 3]
                pa, pb = V[a], V[b]
                ab = pb - pa; L2 = ab @ ab
                if L2 < 1e-12: continue
                t = ((V - pa) @ ab) / L2
                proj = pa + np.outer(t, ab)
                dist = np.linalg.norm(V - proj, axis=1)
                cand = np.where((t > 1e-6) & (t < 1 - 1e-6) & (dist < eps))[0]
                cand = [c for c in cand if c not in f]
                if cand:
                    c = min(cand, key=lambda i: t[i])  # en yakin noktadan bol
                    o = f[(e+2) % 3]
                    newF.append((a, c, o)); newF.append((c, b, o))
                    done = True; changed = True
                    break
            if not done:
                newF.append(f)
        F = newF
    return F

def fill_holes(F):
    """Kalan kucuk catlaklari (acik kenar donguleri) kapatir."""
    half = collections.Counter()
    for f in F:
        for e in range(3):
            half[(f[e], f[(e+1) % 3])] += 1
    need = {}
    for (a, b), k in half.items():
        if half.get((b, a), 0) == 0:
            need.setdefault(b, []).append(a)   # dolgu ucgeni b->a kenarini kullanmali
    added = []
    used = set()
    for start in list(need.keys()):
        for nxt in list(need.get(start, [])):
            if (start, nxt) in used: continue
            loop = [start]; cur = nxt; used.add((start, nxt)); ok = True
            while cur != start:
                loop.append(cur)
                cands = [n for n in need.get(cur, []) if (cur, n) not in used]
                if not cands or len(loop) > 64: ok = False; break
                n = cands[0]; used.add((cur, n)); cur = n
            if ok and len(loop) >= 3:
                for i in range(1, len(loop) - 1):
                    added.append((loop[0], loop[i], loop[i+1]))
    return F + added

def check(F):
    ec = collections.Counter()
    for f in F:
        for e in range(3):
            a, b = f[e], f[(e+1) % 3]
            ec[(min(a, b), max(a, b))] += 1
    return sum(1 for k in ec.values() if k != 2)

def save(path, V, F):
    buf = bytearray(84 + 50 * len(F))
    buf[0:26] = b'HISAR TETIK sensor aparati'
    struct.pack_into('<I', buf, 80, len(F))
    o = 84
    for f in F:
        a, b, c = V[f[0]], V[f[1]], V[f[2]]
        n = np.cross(b - a, c - a); ln = np.linalg.norm(n); n = n / ln if ln > 0 else n
        struct.pack_into('<12fH', buf, o, *n, *a, *b, *c, 0); o += 50
    open(path, 'wb').write(buf)

for p in sys.argv[1:]:
    V, F = weld(load(p))
    before = check(F)
    F = split_tjunctions(V, F)
    if check(F):
        F = fill_holes(F)
    after = check(F)
    save(p, V, F)
    print(p.split('/')[-1], 'kenar hatasi:', before, '->', after, 'ucgen:', len(F))
