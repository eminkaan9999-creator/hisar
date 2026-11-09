// HISAR TETIK - sensor oturma olcusu deneme baskisi (M5StickC Plus2)
// Calistirma: JSCAD=/yol/@jscad/modeling node olcu-deneme.js  (ardindan: python3 fix_mesh.py olcu-deneme.stl)
//
// Ayni yaziciyla basilan parcalar yazicidan yaziciya birkac onda mm farkli cikar: eski kizak (yan bosluk 0.3 mm) bol geldi.
// Bu baski 4 kucuk cerceve: ic olculeri sensorun kesitinden (24.0 x 13.5 mm) yan basina 0.0 / 0.1 / 0.2 / 0.3 mm buyuk.
// Ust kenardaki centik sayisi = numara (1 en siki, 4 eski kizak kadar). Sensor hangisine oynamadan ve zorlamadan
// geciyorsa yeni tutucu o boslukla cizilir. Alt ic kenarda 0.5 mm pah: ilk katmanin icerı tasmasi olcuyu bozmasin.
// Eksenler: Z = baski yuksekligi (cerceveler dik basilir: kesit tablada, olcu XY'de dogru cikar).

const path = require('path')
const M = require(process.env.JSCAD || '@jscad/modeling')
const { cuboid } = M.primitives
const { union, subtract } = M.booleans
const { translate } = M.transforms
const { geom3, poly3 } = M.geometries
const fs = require('fs')

const box = (x0, x1, y0, y1, z0, z1) =>
  cuboid({ size: [x1 - x0, y1 - y0, z1 - z0], center: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] })

const DEV = { W: 24.0, T: 13.5 }        // M5StickC Plus2 kesiti (M5Stack resmi belge: 48.0 x 24.0 x 13.5)
const WALL = 1.6, H = 6.0, PAH = 0.5
const BOSLUK = [0.0, 0.1, 0.2, 0.3]

const cerceve = (c, n) => {
  const wi = DEV.W + 2 * c, ti = DEV.T + 2 * c
  let f = subtract(
    box(-wi / 2 - WALL, wi / 2 + WALL, -ti / 2 - WALL, ti / 2 + WALL, 0, H),
    box(-wi / 2, wi / 2, -ti / 2, ti / 2, -1, H + 1),
    box(-wi / 2 - PAH, wi / 2 + PAH, -ti / 2 - PAH, ti / 2 + PAH, -1, PAH)      // alt ic kenar pahi
  )
  // numara: ust kenarda, uzun duvarin dis yuzunde n centik (1 mm genis, 0.8 mm derin, 1.5 mm yuksek)
  for (let k = 0; k < n; k++) {
    const x = -(n - 1) * 1.6 + k * 3.2
    f = subtract(f, box(x - 0.5, x + 0.5, ti / 2 + WALL - 0.8, ti / 2 + WALL + 1, H - 1.5, H + 1))
  }
  return f
}

const parts = BOSLUK.map((c, i) => translate([0, i * (DEV.T + 2 * WALL + 6), 0], cerceve(c, i + 1)))
const plate = M.modifiers.generalize({ snap: true, triangulate: true, repair: true }, union(...parts))

// ---------------------------------------------------------------- STL yazici (build.js ile ayni)
const polys = geom3.toPolygons(plate), tris = []
for (const p of polys) { const v = p.vertices, pl = poly3.plane(p); for (let i = 1; i < v.length - 1; i++) tris.push([pl, v[0], v[i], v[i + 1]]) }
const buf = Buffer.alloc(84 + tris.length * 50)
buf.write('HISAR TETIK olcu denemesi', 0, 'ascii'); buf.writeUInt32LE(tris.length, 80)
let o = 84
for (const [pl, a, b, c] of tris) {
  for (const n of [pl[0], pl[1], pl[2]]) { buf.writeFloatLE(n, o); o += 4 }
  for (const vtx of [a, b, c]) for (const k of vtx) { buf.writeFloatLE(k, o); o += 4 }
  buf.writeUInt16LE(0, o); o += 2
}
const file = path.join(__dirname, 'olcu-deneme.stl')
fs.writeFileSync(file, buf)
const bb = M.measurements.measureBoundingBox(plate)
console.log('olcu-deneme.stl', tris.length, 'ucgen, kutu', bb.map(v => v.map(x => x.toFixed(2)).join(',')).join(' / '), 'hacim', M.measurements.measureVolume(plate).toFixed(0), 'mm3')
