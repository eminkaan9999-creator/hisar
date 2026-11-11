/* HİSAR SİMÜLATÖR · tüfek kataloğu
 * Kaynak: poligon/index.html, RIFLES (ad, kalibre, şarjör, ateş hızı, geri tepme, balistik düşüş).
 * Veri aynen taşındı. Dışa açılan: H.RIFLES
 */
(function () {
  'use strict';
  var H = window.HISAR;
const RIFLES={
  hk33:{len:'920–940 mm',bar:'390 mm',kg:'3,65 kg',rng:'200–400 m (gez-arpacık)',vel:950,maker:'MKE lisanslı üretim',cls:'tufek',name:'HK33',cal:'5.56×45 mm',mag:30,magTxt:"30'luk",mech:'makaralı gecikmeli geri tepme',rpm:750,disp:.28,kick:2.6,recov:9,drop:{100:0,200:.35,300:1.0,400:2.1},wind:.035,hole:.0057,iron:'hk',tone:1500,magStyle:'curve',guard:.24,v:950},
  mpt76:{len:'900–1000 mm (dipçik ayarlı)',bar:'406 mm',kg:'4,1 kg (MH ~3,75 kg)',rng:'600 m',vel:800,maker:'MKE · yerli',yerli:1,cls:'tufek',name:'MPT-76',cal:'7.62×51 mm',mag:20,magTxt:"20'lik",mech:'kısa stroklu gaz pistonlu, döner kilitli',rpm:700,disp:.2,kick:5.2,recov:6,drop:{100:0,200:.5,300:1.27,400:2.4},wind:.03,hole:.0078,iron:'mpt',tone:900,magStyle:'short',guard:.27,v:800},
  mpt55:{len:'—',bar:'370 mm',kg:'3,3 kg',rng:'—',vel:900,maker:'MKE · yerli',yerli:1,cls:'tufek',name:'MPT-55',cal:'5.56×45 mm',mag:30,magTxt:"30'luk",mech:'gaz pistonlu, döner kilitli',rpm:700,disp:.26,kick:2.5,recov:9.5,drop:{100:0,200:.35,300:1.0,400:2.1},wind:.035,hole:.0057,iron:'mpt',tone:1550,magStyle:'curve',guard:.25,v:780},
  g3:{len:'1025 mm',bar:'450 mm',kg:'4,38 kg',rng:'400 m (gez-arpacık)',vel:800,maker:'MKE lisanslı üretim',cls:'tufek',name:'G-3',cal:'7.62×51 mm',mag:20,magTxt:"20'lik",mech:'makaralı gecikmeli geri tepme',rpm:550,disp:.24,kick:5.6,recov:6,drop:{100:0,200:.5,300:1.27,400:2.4},wind:.03,hole:.0078,iron:'hk',tone:950,magStyle:'straight',guard:.27,v:800},
  ak:{len:'880 mm',bar:'415 mm',kg:'3,3 kg',rng:'300 m',vel:715,maker:'yabancı',cls:'tufek',name:'Kaleşnikof',cal:'7.62×39 mm',mag:30,magTxt:"30'luk",mech:'uzun stroklu gaz pistonlu, döner kilitli',rpm:600,disp:.45,kick:3.6,recov:7.5,drop:{100:0,200:.95,300:2.35,400:4.4},wind:.05,hole:.0078,iron:'ak',tone:1100,magStyle:'ak',guard:.22,wood:1,v:715},
  knt76:{len:'1020 mm',bar:'508 mm',kg:'4,7 kg',rng:'800 m',vel:800,maker:'MKE · yerli',yerli:1,cls:'keskin',name:'KNT-76',cal:'7.62×51 mm',mag:10,magTxt:"10'luk",mech:'keskin nişancı tüfeği, yarı otomatik',rpm:0,semi:1,disp:.09,kick:4.6,recov:6,drop:{100:0,200:.5,300:1.27,400:2.4,500:3.8,600:5.5,700:7.6,800:10.1},wind:.028,hole:.0078,iron:'none',scopeOnly:1,scopeX:10,tone:880,magStyle:'short',guard:.3,v:800},
  mp5:{len:'680 mm',bar:'225 mm',kg:'2,54 kg',rng:'200 m',vel:400,maker:'MKE lisanslı üretim',cls:'mt',name:'MP5',cal:'9×19 mm',mag:30,magTxt:"30'luk",mech:'makineli tabanca, makaralı gecikmeli',rpm:800,disp:.5,kick:1.8,recov:11,drop:{100:0,150:1.2,200:3},wind:.06,hole:.009,iron:'hk',tone:1250,magStyle:'curve',guard:.18,v:400,swayK:1.05},
  yavuz16:{len:'217 mm',bar:'—',kg:'850 g',rng:'50 m',vel:350,maker:'MKE · yerli',yerli:1,cls:'tabanca',name:'Yavuz 16',cal:'9×19 mm',mag:16,magTxt:"16'lık",mech:'tabanca, kısa geri tepmeli, yarı otomatik',rpm:0,semi:1,disp:.75,kick:3.2,recov:12,drop:{25:0,50:.4,100:2},wind:.06,hole:.009,iron:'pistol',tone:1300,v:350,swayK:1.5,noScope:1},
  tp9:{dots:'1',len:'—',bar:'113 mm (4,46")',kg:'—',rng:'50 m',vel:360,maker:'Canik · yerli',yerli:1,cls:'tabanca',name:'Canik TP9SF',cal:'9×19 mm',mag:18,magTxt:"18'lik",mech:'tabanca, kısa geri tepmeli, polimer gövde',rpm:0,semi:1,disp:.68,kick:2.9,recov:13,drop:{25:0,50:.4,100:2},wind:.06,hole:.009,iron:'pistol',tone:1350,v:350,swayK:1.45,noScope:1},
  sar9:{len:'193 mm',bar:'113 mm',kg:'790 g',rng:'50 m',vel:360,maker:'Sarsılmaz · yerli',yerli:1,cls:'tabanca',name:'Sarsılmaz SAR9',cal:'9×19 mm',mag:17,magTxt:"17'lik",mech:'tabanca, kısa geri tepmeli, polimer gövde',rpm:0,semi:1,disp:.72,kick:3.0,recov:12.5,drop:{25:0,50:.4,100:2},wind:.06,hole:.009,iron:'pistol',tone:1320,v:350,swayK:1.5,noScope:1}
};
  H.RIFLES = RIFLES;
})();
