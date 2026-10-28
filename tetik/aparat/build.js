// HISAR TETIK - vidasiz sensor aparati (M5StickC Plus2) 3B model ureticisi
// Calistirma: JSCAD=/yol/@jscad/modeling node build.js  (ardindan: python3 fix_mesh.py *.stl)
//
// Sistem (hepsi baskiyla, vida yok):
//  1) kizak.stl          : sensor kizagi. Sensor icine bir kez 3M VHB bantla yapistirilir.
//                          Altindaki kirlangic dili, plakaya/adaptore surulup yay disiyle "tik" diye kilitlenir.
//  2) sarjor-plakasi.stl : her sarjorun tabanina VHB ile yapistirilan yuva (butun tabancalar, G3, HK33).
//  3) ray-adaptoru.stl   : MPT-76 / MPT-55 pikatini rayina onden surulen yuva. Yayli tirnak ray yuvasina oturur.
//
// Olculer (mm):
//  M5StickC Plus2: 48.0 x 24.0 x 13.5 (M5Stack resmi belge)
//  Pikatini (MIL-STD-1913): dis genislik 21.2, boyun 15.67, 45 derece yanaklar, yuva 5.23 genis, 10.01 aralik, 3.0 derin
//
// Eksenler: X = namlu yonu (+X namlu agzina dogru), Y = enine, Z = montaj yuzunden disari

const path = require('path')
const fs = require('fs')
const M = require(process.env.JSCAD || '@jscad/modeling')
const { cuboid, polygon } = M.primitives
const { extrudeLinear } = M.extrusions
const { union, subtract } = M.booleans
const { translate, rotateX, transform } = M.transforms
const { geom3, poly3 } = M.geometries

// ---------------------------------------------------------------- yardimcilar
// cokgen noktalarini saat yonunun tersine cevirir (JSCAD dis cokgeni boyle bekler)
const ccw = (pts) => {
  let a = 0
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0 }
  return a < 0 ? pts.slice().reverse() : pts
}
const prism = (pts, h) => extrudeLinear({ height: h }, polygon({ points: ccw(pts) }))
// (y,z) profilini X boyunca uzatir
const yzAlongX = (pts, x0, x1) => transform([0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, x0, 0, 0, 1], prism(pts, x1 - x0))
// (x,z) profilini Y boyunca uzatir (y0..y1)
const xzAlongY = (pts, y0, y1) => transform([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, y1, 0, 1], prism(pts, y1 - y0))
// (x,y) profilini Z boyunca uzatir
const xyAlongZ = (pts, z0, z1) => translate([0, 0, z0], prism(pts, z1 - z0))
const box = (x0, x1, y0, y1, z0, z1) =>
  cuboid({ size: [x1 - x0, y1 - y0, z1 - z0], center: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] })
const mirrorYpts = (pts) => pts.map(([y, z]) => [-y, z]).reverse()

// ---------------------------------------------------------------- sensor kizagi
const DEV = { L: 48.0, W: 24.0, T: 13.5 }
const CLR = 0.3
const PL = DEV.L + 2 * CLR          // 48.6
const PW = DEV.W + 2 * CLR          // 24.6
const FRONT_WALL = 2.4
const OL = PL + FRONT_WALL + 0.4    // 51.4 (arka ucu acik: USB-C ve kablo icin)
const YC = 14.5                     // kizak yari genisligi
const FLOOR = 3.0
const RIM = 3.5                     // yan dugmelere degmeyen alcak kenar
const NOTCH = 14.0

// ---------------------------------------------------------------- hizli gecme (kirlangic) arayuzu
const QR = {
  W: 20.0,        // dil alt genisligi
  V: 1.2,         // dik yanak yuksekligi
  H: 3.0,         // dil yuksekligi
  C: 0.2,         // yanal bosluk (her yan)
  Z: 0.15,        // dikey bosluk
  L: 32.0,        // yuva boyu
  TL: 26.0,       // dil boyu
  STOP: 2.4,      // on durdurucu
  OUT: 13.6,      // yuva duvari dis yari genislik
  FINGER: 16.0,   // yay parmak boyu
  BUMP_TX: 3.0,   // tirnak merkezi (dilin arka ucundan)
  BUMP_H: 0.75,   // tirnak yuksekligi
  NOTCH_D: 0.4,   // yuvadaki centik derinligi (yanal on yuk 0.15 kalir)
  NOTCH_OFS: 0.25 // centik tirnaktan 0.25 mm onde: kizagi durdurucuya bastirir
}
const HW = QR.W / 2                       // 10.0
const ROOT = HW - (QR.H - QR.V)           // 8.2
const SEAT_X0 = QR.L - QR.STOP - QR.TL    // dil oturdugunda arka ucu: 3.6

// disi yuva duvarlari + on durdurucu + centik (taban ust yuzu z = zf)
const qrSocket = (zf) => {
  const c = QR.C, h = QR.H + QR.Z               // 3.15
  const left = [[-QR.OUT, 0], [-(HW + c), 0], [-(HW + c), QR.V + QR.Z], [-(ROOT + c), h], [-QR.OUT, h]]
    .map(([y, z]) => [y, z + zf])
  const xf = SEAT_X0 + QR.TL + 0.1                // durdurucu yuzu (ust)
  let s = union(
    yzAlongX(left, 0, QR.L),
    yzAlongX(mirrorYpts(left), 0, QR.L),
    // on durdurucu: 45 derece yuz (dilin pahli ucuna tam oturur)
    xzAlongY([[xf - h, zf], [QR.L, zf], [QR.L, zf + h], [xf, zf + h]], -(HW + c), HW + c)
  )
  // centik (sol duvarin ic dik yuzunde)
  const xn = SEAT_X0 + QR.BUMP_TX + QR.NOTCH_OFS
  const d = HW + c + QR.NOTCH_D
  s = subtract(s, xyAlongZ([[xn - 1.15, -(HW + c) + 0.3], [xn - 0.55, -d], [xn + 0.55, -d], [xn + 1.15, -(HW + c) + 0.3]],
    zf + 0.05, zf + QR.V + QR.Z - 0.05))
  return s
}

// erkek dil (kizak altinda): z=0 kizak alt yuzu, asagi dogru -H
const qrTongue = (x0) => {
  const prof = [[-ROOT, 0], [-HW, -(QR.H - QR.V)], [-HW, -QR.H], [HW, -QR.H], [HW, -(QR.H - QR.V)], [ROOT, 0]]
  let t = yzAlongX(prof, x0, x0 + QR.TL)
  // on uc 45 derece pah (durdurucuya oturur, takarken yol gosterir)
  t = subtract(t, xzAlongY([[x0 + QR.TL + 0.01, 0.01], [x0 + QR.TL + 0.01, -QR.H - 0.1], [x0 + QR.TL - QR.H - 0.11, -QR.H - 0.1]], -HW - 1, HW + 1))
  // yay parmak: sol yanagin dis kismi; arkada serbest, onde bagli
  t = subtract(t, box(x0 - 0.1, x0 + QR.FINGER, -(ROOT + 0.4), -(ROOT - 0.6), -QR.H - 0.1, 0.0))
  // tirnak (parmagin dis dik yuzunde)
  const b0 = x0 + QR.BUMP_TX, bh = QR.BUMP_H
  t = union(t, xyAlongZ([[b0 - 0.55 - bh, -HW + 0.1], [b0 - 0.55, -HW - bh], [b0 + 0.55, -HW - bh], [b0 + 0.55 + bh, -HW + 0.1]],
    -QR.H + 0.1, -(QR.H - QR.V) - 0.05))
  return t
}

const sledge = () => {
  const zf = FLOOR
  let c = union(
    box(0, OL, -YC, YC, 0, zf),                            // taban
    box(0, OL, PW / 2, YC, zf, zf + RIM),                  // +Y kenar
    box(0, OL, -YC, -PW / 2, zf, zf + RIM),                // -Y kenar
    box(OL - FRONT_WALL, OL, -YC, YC, zf, zf + RIM)        // on duvar (geri tepmede sensoru tutar)
  )
  c = subtract(c, box(OL - FRONT_WALL - 0.01, OL + 1, -NOTCH / 2, NOTCH / 2, zf, zf + RIM + 1))
  const x0 = (OL - QR.TL) / 2
  c = union(c, qrTongue(x0))
  return { solid: c, tongueX0: x0 }
}

// ---------------------------------------------------------------- sarjor plakasi
const PLATE_T = 2.0
const PLATE_Y = 14.0
const magPlate = () => {
  let p = union(box(0, QR.L, -PLATE_Y, PLATE_Y, 0, PLATE_T), qrSocket(PLATE_T))
  // namlu yonu oku (yuva tabanina 0.4 mm oyulu)
  p = subtract(p, xyAlongZ([[12, -4], [12, 4], [20, 0]], PLATE_T - 0.4, PLATE_T + 0.01))
  return p
}

// ---------------------------------------------------------------- pikatini ray adaptoru (vidasiz, onden surulur)
const RAIL_HALF = 21.2 / 2
const RAIL_NECK_HALF = 15.67 / 2
const FLANK_TOP_Z = -(RAIL_HALF - RAIL_NECK_HALF)      // -2.765
const FLANK_BOT_Z = 2 * FLANK_TOP_Z                    // -5.53
const RA = { L: QR.L, UNDER: 0.6, CLR: 0.3, JAW_BOT: -5.1, OUT: 14.0, LEAF_T: 1.8, POCKET_TOP: 6.2, TOP: 8.0, ATTACH: 6.0 }
const railAdapter = () => {
  const yi = RAIL_HALF + RA.CLR                                     // 10.9
  const yD = -yi - (RA.JAW_BOT - FLANK_TOP_Z)                       // 45 derece yuzun alt ucu
  const jawL = [[-RA.OUT, RA.UNDER], [-RA.OUT, RA.JAW_BOT], [yD, RA.JAW_BOT], [-yi, FLANK_TOP_Z], [-yi, RA.UNDER]]
  let a = union(
    box(0, RA.L, -RA.OUT, RA.OUT, RA.UNDER, RA.TOP),
    yzAlongX(jawL, 0, RA.L),
    yzAlongX(mirrorYpts(jawL), 0, RA.L),
    qrSocket(RA.TOP)
  )
  const leafTop = RA.UNDER + RA.LEAF_T                               // 2.4
  // yay boslugu (on ucu 45 derece: destek gerektirmez)
  a = subtract(a, xzAlongY([[-1, leafTop], [RA.L - RA.ATTACH, leafTop], [RA.L - RA.ATTACH - (RA.POCKET_TOP - leafTop), RA.POCKET_TOP], [-1, RA.POCKET_TOP]], -7.6, 7.6))
  // yaprak yaylari ayiran yariklar
  for (const [y0, y1] of [[2.5, 3.3], [-3.3, -2.5], [7.0, 7.7], [-7.7, -7.0]]) {
    a = subtract(a, box(-1, RA.L - RA.ATTACH, y0, y1, RA.UNDER - 0.1, leafTop + 0.05))
  }
  // orta yaprak: ray yuvasina oturan kilit tirnagi (on yuzu dik: geri tepmede kaymaz; arka yuzu rampali: surerek takilir)
  a = union(a, xzAlongY([[8.1, RA.UNDER], [3.0, RA.UNDER], [3.0, -0.3], [5.6, -2.9], [8.1, -2.9]], -2.5, 2.5))
  // yan yapraklar: ray ustune bastiran on yuk pedleri (bosluk birakmaz)
  for (const [y0, y1] of [[3.3, 7.0], [-7.0, -3.3]]) {
    a = union(a, xzAlongY([[1.0, RA.UNDER], [1.0, 0.1], [1.6, -0.5], [12.4, -0.5], [13.0, 0.1], [13.0, RA.UNDER]], y0, y1))
  }
  return a
}

// ---------------------------------------------------------------- onizleme (basilmaz)
const previewRail = () => {
  const pts = [[-15, -10], [15, -10], [15, -8], [RAIL_NECK_HALF, -8], [RAIL_NECK_HALF, FLANK_BOT_Z],
    [RAIL_HALF, FLANK_TOP_Z], [RAIL_NECK_HALF, 0], [-RAIL_NECK_HALF, 0], [-RAIL_HALF, FLANK_TOP_Z],
    [-RAIL_NECK_HALF, FLANK_BOT_Z], [-RAIL_NECK_HALF, -8], [-15, -8]]
  let r = yzAlongX(pts, -40, 80)
  for (let i = -4; i < 12; i++) {
    const xc = 5.55 + i * 10.01
    r = subtract(r, box(xc - 5.23 / 2, xc + 5.23 / 2, -12, 12, -3.0, 1))
  }
  return r
}
const sensorDummy = () => M.primitives.roundedCuboid({ size: [DEV.L, DEV.W, DEV.T], roundRadius: 2.0, segments: 16,
  center: [CLR + DEV.L / 2, 0, FLOOR + 1.0 + DEV.T / 2] })
// ornek sarjor (taban plakasi + govde), z=0 sarjor alt yuzu, yukari dogru
const magDummy = () => union(box(-1, 33, -13.0, 13.0, 0.0, 6.0), box(1, 31, -11.0, 11.0, 6.0, 46.0))

const fix = (g) => M.modifiers.generalize({ snap: true, triangulate: true, repair: true }, g)

// ---------------------------------------------------------------- STL yazici
const writeStl = (geom, file) => {
  const polys = geom3.toPolygons(geom)
  const tris = []
  for (const p of polys) {
    const v = p.vertices
    const pl = poly3.plane(p)
    for (let i = 1; i < v.length - 1; i++) tris.push([pl, v[0], v[i], v[i + 1]])
  }
  const buf = Buffer.alloc(84 + tris.length * 50)
  buf.write('HISAR TETIK sensor aparati', 0, 'ascii')
  buf.writeUInt32LE(tris.length, 80)
  let o = 84
  for (const [pl, a, b, c] of tris) {
    for (const n of [pl[0], pl[1], pl[2]]) { buf.writeFloatLE(n, o); o += 4 }
    for (const vtx of [a, b, c]) for (const k of vtx) { buf.writeFloatLE(k, o); o += 4 }
    buf.writeUInt16LE(0, o); o += 2
  }
  fs.writeFileSync(file, buf)
  return tris.length
}

// ---------------------------------------------------------------- uret
const out = __dirname
const sl = sledge()
const seatShift = SEAT_X0 - sl.tongueX0           // kizagin yuvaya oturdugu X kaymasi
const seatZ = (zf) => zf + QR.H + QR.Z            // kizak alt yuzunun yuksekligi

// sarjor gorunumu gercek konumda: sarjor ustte, plaka altinda, kizak ve sensor en altta
const flip = (g) => rotateX(Math.PI, g)
const parts = {
  'kizak.stl': fix(sl.solid),
  'sarjor-plakasi.stl': fix(magPlate()),
  'ray-adaptoru.stl': fix(railAdapter()),
  'onizleme-sarjor.stl': translate([0, 0, 0], magDummy()),
  'onizleme-sarjor-plaka.stl': flip(magPlate()),
  'onizleme-sarjor-kizak.stl': flip(translate([seatShift, 0, seatZ(PLATE_T)], sl.solid)),
  'onizleme-sarjor-sensor.stl': flip(translate([seatShift, 0, seatZ(PLATE_T)], sensorDummy())),
  'onizleme-ray.stl': previewRail(),
  'onizleme-ray-kizak.stl': translate([seatShift, 0, seatZ(RA.TOP)], sl.solid),
  'onizleme-ray-sensor.stl': translate([seatShift, 0, seatZ(RA.TOP)], sensorDummy())
}
for (const [name, g] of Object.entries(parts)) {
  const n = writeStl(g, path.join(out, name))
  const b = M.measurements.measureBoundingBox(g)
  const vol = M.measurements.measureVolume(g)
  console.log(name.padEnd(28), 'ucgen:', String(n).padStart(5), ' kutu:', b.map(v => v.map(x => x.toFixed(2)).join(',')).join(' / '), ' hacim:', vol.toFixed(0))
}
