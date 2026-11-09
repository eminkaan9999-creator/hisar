// HISAR TETIK - sensor oturma olcusu deneme baskisi (M5StickC Plus2)
// Calistirma: JSCAD=/yol/@jscad/modeling node olcu-deneme.js  (ardindan: python3 fix_mesh.py olcu-deneme.stl)
//
// Ayni yaziciyla basilan parcalar yazicidan yaziciya birkac onda mm farkli cikar: eski kizak (yan bosluk 0.3 mm) bol geldi.
// Bu baski 4 kucuk U kelepce: ic genislikleri sensorun genisliginden (24.0 mm) yan basina 0.0 / 0.1 / 0.2 / 0.3 mm buyuk.
// U oldugu icin sensor eski kizaktayken de denenir: kelepce sensorun ekran tarafindan, USB ucundan 1 cm surulur
// (kollar 7 mm: kizagin 3.5 mm yan kenarina degmez). Sirttaki centik sayisi = numara (1 en siki, 4 eski kizak kadar).
// Sensor hangisinde oynamadan ve zorlamadan kayiyorsa yeni tutucu o boslukla cizilir.
// Kollar 2.6, sirt 3.5 mm kalin (esnemez, olcu yaniltmaz); kol uclarinin ic kenari pahli (kolay baslar).
// Eksenler: Z = baski yuksekligi (U profili tablada: genislik XY'de dogru cikar).

const path = require('path')
const M = require(process.env.JSCAD || '@jscad/modeling')
const { cuboid, polygon } = M.primitives
const { extrudeLinear } = M.extrusions
const { union, subtract } = M.booleans
const { translate } = M.transforms
const { geom3, poly3 } = M.geometries
const fs = require('fs')

// cokgen noktalarini saat yonunun tersine cevirir (JSCAD dis cokgeni boyle bekler)
const ccw = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0 } return a < 0 ? pts.slice().reverse() : pts }
const box = (x0, x1, y0, y1, z0, z1) =>
  cuboid({ size: [x1 - x0, y1 - y0, z1 - z0], center: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] })

const DEV_W = 24.0                     // M5StickC Plus2 genisligi (M5Stack resmi belge: 48.0 x 24.0 x 13.5)
const ARM = 2.6, BACK = 3.5, DEPTH = 7.0, H = 8.0, PAH = 0.6
const BOSLUK = [0.0, 0.1, 0.2, 0.3]

// U profili XY'de: sirt y in [0, BACK], kollar y in [BACK, BACK+DEPTH]; ic genislik x in [-wi/2, wi/2]
// tek cokgenden (temiz, su gecirmez ag): dis alt kenarda numara centikleri, kol uclarinda ic pah (sensore kolay baslasin)
const kelepce = (c, n) => {
  const a = DEV_W / 2 + c, A = a + ARM, y1 = BACK + DEPTH, pts = [[-A, 0]]
  for (let k = 0; k < n; k++) { const x = -(n - 1) * 1.7 + k * 3.4; pts.push([x - 0.5, 0], [x - 0.5, 0.6], [x + 0.5, 0.6], [x + 0.5, 0]) }
  pts.push([A, 0], [A, y1], [a + PAH, y1], [a, y1 - PAH], [a, BACK], [-a, BACK], [-a, y1 - PAH], [-a - PAH, y1], [-A, y1])
  return extrudeLinear({ height: H }, polygon({ points: ccw(pts) }))
}

const parts = BOSLUK.map((c, i) => translate([i * (DEV_W + 2 * ARM + 6), 0, 0], kelepce(c, i + 1)))
const plate = union(...parts)

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
