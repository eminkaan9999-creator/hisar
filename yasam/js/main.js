/* HİSAR SİMÜLATÖR · oyun akışı
 * Modlar: 'foot' (yaya). Tank ve Uçangöz modları bu akışa bağlanır.
 * E / ETKİLEŞİM: yakındaki noktanın eylemini çalıştırır (H.actions[id]).
 */
(function () {
  'use strict';
  var H = window.HISAR;
  H.mode = 'foot';

  var hint = document.getElementById('hint');
  hint.textContent = H.isTouch
    ? 'Sol alan yürü · sağ alan bakar · KOŞ · ETKİLEŞİM'
    : 'WASD yürü · Shift koş · fare bakar (tıkla: kilitle) · E etkileşim';

  // yer eylemleri: tank ve tüfek sonraki dilimde bağlanır
  H.actions = {
    garaj: function () { H.toast('Garaj: tank çıkarma bir sonraki adımda bağlanacak.'); },
    rack: function () { H.toast('Tüfek rafı: poligon silahları bir sonraki adımda.'); }
  };

  function zoneName(x, z) {
    for (var i = 0; i < H.zones.length; i++) {
      var q = H.zones[i];
      if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return q.name;
    }
    return 'ARAZİ';
  }

  H.onUpdate(function () {
    if (H.mode !== 'foot') return;
    var P = H.player;

    var best = null, bd = 1e9;
    for (var i = 0; i < H.anchors.length; i++) {
      var a = H.anchors[i];
      var d = Math.hypot(a.x - P.x, a.z - P.z);
      if (d <= a.r && d < bd) { bd = d; best = a; }
    }
    if (best) {
      H.prompt((H.isTouch ? 'ETKİLEŞİM' : '<b>E</b>') + ' · ' + best.label);
      if (H.pressed('act') && H.actions[best.id]) H.actions[best.id](best);
    } else {
      H.prompt('');
    }

    H.setText('zoneTxt', zoneName(P.x, P.z));
    H.setText('modeTxt', 'YAYA');
  });

  H.toast('Üs · Şantiye doğuda · Poligon kuzeybatıda', 3200);
})();
