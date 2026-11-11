/* Built inside the original app closure; no external requests or clinical data edits. */
(() => {
  'use strict';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  const known = id => typeof id === 'string' && own(U, id);
  const cleanNotes = raw => {
    const out = {};
    if (obj(raw)) for (const [id, value] of Object.entries(raw)) {
      if (known(id) && typeof value === 'string') out[id] = value.slice(0, 1500);
    }
    return out;
  };
  D.notes = cleanNotes(D.notes);
  D.ux = obj(D.ux) ? D.ux : {};
  if (!['auto', 'light', 'dark'].includes(D.ux.theme)) D.ux.theme = 'auto';
  D.ux.large = D.ux.large === true;
  let storageWarned = false;
  store.save = function () {
    try { localStorage.setItem(this.key, JSON.stringify(this.d)); return true; }
    catch (_) {
      if (!storageWarned) { storageWarned = true; toast('Cihaza kaydedilemiyor. Değişiklikler bu oturumda kalır; Defterim’den yedek alın.', 6500); }
      return false;
    }
  };
  const theme = () => {
    if (D.ux.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = D.ux.theme;
    document.documentElement.classList.toggle('ux-large', D.ux.large);
  };
  theme();
  $('#q').maxLength = 120;
  $('#q').setAttribute('aria-label', 'İlaç adı veya etken madde ara');
  $('#q').placeholder = 'İlaç adı, etken madde ya da şikâyet';
  const X = { key: '', limit: 40, group: '', form: '', fav: false, order: 'relevance' };
  const oldSearch = ara, cache = new Map();
  ara = function (query) {
    const key = norm(query);
    if (cache.has(key)) return cache.get(key);
    const result = oldSearch(query);
    cache.set(key, result);
    if (cache.size > 30) cache.delete(cache.keys().next().value);
    return result;
  };
  const option = (value, text, selected) => `<option value="${esc(value)}"${selected === value ? ' selected' : ''}>${esc(text)}</option>`;
  const forms = [...new Set(V.urun.map(u => u.form).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
  vSonuc = function () {
    const result = ara(S.q);
    if (!result) return '';
    if (X.key !== norm(S.q)) { X.key = norm(S.q); X.limit = 40; }
    const active = X.group || X.form || X.fav;
    let list = result.urun.filter(u => (!X.group || grupOf(u) === X.group) && (!X.form || u.form === X.form) && (!X.fav || D.fav[u.id]));
    if (X.order === 'az') list = list.slice().sort(byName);
    if (X.order === 'za') list = list.slice().sort((a, b) => byName(b, a));
    let h = `<section class="ux-filters" aria-label="Arama filtreleri"><div class="ux-grid"><label>İlaç grubu<select id="ux-group">${option('', 'Tüm gruplar', X.group)}${V.grup.filter(g => grupUrun[g.id]).map(g => option(g.id, g.ad, X.group)).join('')}</select></label><label>Ürün formu<select id="ux-form">${option('', 'Tüm formlar', X.form)}${forms.map(f => option(f, f, X.form)).join('')}</select></label><label>Sıralama<select id="ux-order">${option('relevance', 'Metin eşleşmesi', X.order)}${option('az', 'Ada göre A–Z', X.order)}${option('za', 'Ada göre Z–A', X.order)}</select></label></div><div class="ux-actions"><button class="chip${X.fav ? ' ux-on' : ''}" data-ux="fav-filter" aria-pressed="${X.fav}">${ic.star}Yalnızca favoriler</button>${active ? '<button class="chip" data-ux="clear-filters">Filtreleri temizle</button>' : ''}</div></section>`;
    const sl = result.siks.filter(s => sikVar(s.id));
    if (!active && sl.length) h += `<section class="sec"><h2>Şikâyet başlıkları</h2><div class="chips">${sl.map(s => `<button class="chip" data-a="sik" data-id="${s.id}">${esc(s.ad)}</button>`).join('')}</div></section>`;
    if (!active && result.grups.length) h += `<section class="sec"><h2>İlgili gruplar</h2><div class="chips">${result.grups.map(g => `<button class="chip" data-a="grup" data-id="${g.id}">${esc(g.ad)}</button>`).join('')}</div></section>`;
    h += `<section class="sec" id="ux-results"><h2>${result.exact === 0 && list.length ? 'Benzer yazılan ürünler' : 'Ürünler'} <small id="ux-search-status" role="status">${list.length} sonuç · ${Math.min(X.limit, list.length)} gösteriliyor</small></h2>`;
    if (result.exact === 0 && list.length) h += '<p class="hint">İsim benzerliği ilaçların aynı veya birbirinin yerine kullanılabilir olduğu anlamına gelmez.</p>';
    h += list.length ? rows(list.slice(0, X.limit)) : `<div class="empty"><b>Bu aramada ürün bulunamadı</b>${active ? 'Filtreleri temizleyerek tekrar deneyin.' : 'İlacın adını veya etken maddesini farklı bir yazımla arayın.'}</div>`;
    if (list.length > X.limit) h += `<button class="cta ghost ux-more" data-ux="more">40 sonuç daha göster <span>(${list.length - X.limit} kaldı)</span></button>`;
    return h + '</section>';
  };
  const originalHome = vAra;
  vAra = function () {
    let html = originalHome();
    if (S.q.trim() || S.nav.length) return html;
    const count = Object.keys(D.fav).filter(known).length;
    return `<section class="ux-overview" aria-label="Defter özeti"><div class="ux-eyebrow">KARDELEN’İN KÜÇÜK ECZANESİ <span class="ux-network" role="status">${navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı'}</span></div><h2>Defterine hızlı bakış</h2><p>Ürünleri bul, raftaki yerini gör, öğrendiklerini kaydet.</p><div class="ux-stats"><div><strong>${V.urun.length}</strong><span>kayıtlı ürün</span></div><div><strong>${V.foto.length}</strong><span>raf fotoğrafı</span></div><div><strong>${count}</strong><span>favori</span></div></div></section>` + html;
  };
  const originalCard = kartHTML;
  kartHTML = function (u) {
    const note = D.notes[u.id] || '';
    const controls = `<section class="kt ux-note"><h3>Kişisel öğrenme notum</h3><p class="hint">Yalnızca bu tarayıcıda saklanır. Hasta bilgisi veya hassas kişisel veri yazmayın.</p><label class="ux-sr" for="ux-note">${esc(u.ad)} için not</label><textarea id="ux-note" data-note-id="${u.id}" maxlength="1500" rows="3" placeholder="Öğrendiğin bir ayrıntıyı not et…">${esc(note)}</textarea><div class="ux-actions"><span id="ux-note-status" class="hint" role="status">${note ? 'Kayıtlı not' : 'Yazdıkça kaydedilir'}</span><button class="chip" data-ux="copy-name" data-id="${u.id}">Ürün adını kopyala</button></div></section>`;
    return originalCard(u).replace(/<\/div><\/div>\s*$/, controls + '</div></div>')
      .replace('raftaki muadiller', 'aynı etken maddeyle kayıtlı ürünler');
  };
  const prefs = () => `<section class="sec"><h2>Görünüm ve yedekleme</h2><div class="ux-filters"><div class="ux-grid"><label>Görünüm<select id="ux-theme">${option('auto', 'Cihaz ayarı', D.ux.theme)}${option('light', 'Açık', D.ux.theme)}${option('dark', 'Koyu', D.ux.theme)}</select></label><label class="ux-check"><input id="ux-large" type="checkbox"${D.ux.large ? ' checked' : ''}> Büyük metin</label></div><p class="hint">Favoriler, öğrenme notları ve oyun ilerlemesi bu tarayıcıdadır. Yedek dosyası kişisel verilerinizi içerebilir; güvenli saklayın.</p><div class="ux-actions"><button class="cta" data-ux="export">Yedeği indir</button><button class="cta ghost" data-ux="import">Yedekten birleştir</button><input type="file" id="ux-import" accept="application/json,.json" hidden></div><div id="ux-import-preview" role="status"></div><p class="hint">İçe aktarma mevcut kayıtları silmez. Çakışan notlarda bu cihazdaki not korunur.</p></div></section>`;
  const originalNotebook = vDefter;
  vDefter = function () { return prefs() + originalNotebook(); };
  const nav = document.createElement('nav');
  nav.className = 'ux-dock'; nav.setAttribute('aria-label', 'Hızlı gezinme');
  nav.innerHTML = [['ara', 'Ana sayfa', ic.ev], ['gruplar', 'Gruplar', ic.izgara], ['raflar', 'Raflar', ic.raf], ['defterim', 'Defterim', ic.defter]].map(([id, name, icon]) => `<button data-a="git" data-id="${id}">${icon}<span>${name}</span></button>`).join('');
  $('.main').append(nav);
  const originalRender = render;
  render = function () {
    originalRender();
    nav.querySelectorAll('button').forEach(b => {
      if (b.dataset.id === S.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  };
  const zoomAtCenter = value => {
    if (!S.foto) return;
    const stage = $('#stage'), old = S.foto.zoom;
    const x = (stage.scrollLeft + stage.clientWidth / 2) / old;
    const y = (stage.scrollTop + stage.clientHeight / 2) / old;
    S.foto.zoom = Math.max(1, Math.min(4, value));
    drawFoto(false);
    stage.scrollLeft = x * S.foto.zoom - stage.clientWidth / 2;
    stage.scrollTop = y * S.foto.zoom - stage.clientHeight / 2;
  };
  const originalPhoto = drawFoto;
  drawFoto = function (first) {
    originalPhoto(first);
    if (!$('#ux-zoom')) {
      const bar = document.createElement('div'); bar.id = 'ux-zoom'; bar.className = 'ux-zoom';
      bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Raf yakınlaştırma');
      bar.innerHTML = '<button data-ux="zoom-out" aria-label="Uzaklaştır">−</button><output id="ux-zoom-value" aria-live="polite"></output><button data-ux="zoom-in" aria-label="Yakınlaştır">+</button><button data-ux="zoom-reset">Sığdır</button>';
      $('#stage').before(bar);
    }
    $('#ux-zoom-value').textContent = Math.round(S.foto.zoom * 100) + '%';
    $('[data-ux="zoom-out"]').disabled = S.foto.zoom <= 1;
    $('[data-ux="zoom-in"]').disabled = S.foto.zoom >= 4;
    $('#bmarks').setAttribute('aria-pressed', String(!!S.foto.marks));
    const photo = $('#ph');
    if (first) photo.addEventListener('error', () => {
      const warning = document.createElement('p'); warning.className = 'medical-note'; warning.id = 'ux-photo-error';
      warning.innerHTML = 'Raf fotoğrafı yüklenemedi. <button class="linkbtn" data-ux="photo-retry">Tekrar dene</button>';
      if (!$('#ux-photo-error')) $('#stage').before(warning);
    });
  };
  const refresh = focusId => {
    const y = $('#view').scrollTop;
    render(); $('#view').scrollTop = y;
    const node = focusId && document.getElementById(focusId);
    if (node) node.focus({ preventScroll: true });
  };
  const count = v => obj(v) ? Object.keys(v).length : 0;
  const integer = n => Number.isSafeInteger(n) && n >= 0 && n <= 100000000 ? n : 0;
  function parseBackup(raw) {
    if (!obj(raw) || raw.app !== 'kardelen-ilac-defteri' || raw.schema !== 1 || !obj(raw.data)) throw new Error('format');
    const d = raw.data, out = { fav: {}, kutu: {}, son: [], notes: cleanNotes(d.notes) };
    if (obj(d.fav)) for (const id of Object.keys(d.fav)) if (known(id) && d.fav[id]) out.fav[id] = 1;
    if (obj(d.kutu)) for (const [id, n] of Object.entries(d.kutu)) if (known(id) && Number.isInteger(n) && n >= 0 && n <= 100) out.kutu[id] = n;
    if (Array.isArray(d.son)) out.son = [...new Set(d.son.filter(known))].slice(0, 15);
    for (const key of ['puan', 'seri', 'enIyi', 'tur']) out[key] = integer(d[key]);
    return out;
  }
  let pending = null;
  document.addEventListener('input', e => {
    if (e.target.id !== 'ux-note') return;
    const id = e.target.dataset.noteId;
    if (!known(id)) return;
    const value = e.target.value.slice(0, 1500);
    if (value) D.notes[id] = value; else delete D.notes[id];
    const ok = store.save();
    $('#ux-note-status').textContent = ok ? 'Bu cihazda kaydedildi' : 'Kaydedilemedi; yedek alın';
  });
  document.addEventListener('change', async e => {
    const id = e.target.id;
    if (['ux-group', 'ux-form', 'ux-order'].includes(id)) {
      X[id.slice(3)] = e.target.value; X.limit = 40; refresh(id);
    } else if (id === 'ux-theme') { D.ux.theme = e.target.value; theme(); store.save(); }
    else if (id === 'ux-large') { D.ux.large = e.target.checked; theme(); store.save(); }
    else if (id === 'ux-import') {
      pending = null;
      const preview = $('#ux-import-preview'), file = e.target.files[0];
      if (!file) return;
      try {
        if (file.size > 1024 * 1024) throw new Error('size');
        const data = parseBackup(JSON.parse(await file.text()));
        pending = data;
        if (!preview.isConnected) { pending = null; return; }
        preview.innerHTML = `<p><b>${count(data.fav)} favori, ${count(data.notes)} not, ${count(data.kutu)} öğrenme kaydı.</b> Mevcut kayıtlar korunarak birleştirilsin mi?</p><div class="ux-actions"><button class="cta" data-ux="import-confirm">Birleştir</button><button class="cta ghost" data-ux="import-cancel">Vazgeç</button></div>`;
      } catch (_) { if (preview.isConnected) preview.textContent = 'Dosya okunamadı. Bu uygulamadan alınmış, 1 MB’tan küçük geçerli JSON yedeği seçin.'; }
      e.target.value = '';
    }
  });
  document.addEventListener('click', async e => {
    const button = e.target.closest('[data-ux]'); if (!button) return;
    const action = button.dataset.ux;
    if (action === 'more') {
      const oldLimit = X.limit, y = $('#view').scrollTop; X.limit += 40; render();
      $('#view').scrollTop = y;
      const next = document.querySelectorAll('#ux-results .row')[oldLimit]; if (next) next.focus({ preventScroll: true });
    } else if (action === 'fav-filter') { X.fav = !X.fav; X.limit = 40; refresh(); $('[data-ux="fav-filter"]').focus({ preventScroll: true }); }
    else if (action === 'clear-filters') { X.group = ''; X.form = ''; X.fav = false; X.limit = 40; refresh('ux-group'); }
    else if (action === 'copy-name') {
      const u = U[button.dataset.id]; if (!u) return;
      try { await navigator.clipboard.writeText(u.ad); toast('Ürün adı kopyalandı.'); }
      catch (_) { toast('Panoya erişilemedi. Ürün adını seçerek kopyalayabilirsiniz.'); }
    } else if (action === 'zoom-in') zoomAtCenter(S.foto.zoom + .5);
    else if (action === 'zoom-out') zoomAtCenter(S.foto.zoom - .5);
    else if (action === 'zoom-reset') zoomAtCenter(1);
    else if (action === 'photo-retry') { $('#ux-photo-error')?.remove(); const image = $('#ph'); image.src = 'img/f' + S.foto.f + '.jpg'; }
    else if (action === 'export') {
      const data = { fav: D.fav, kutu: D.kutu, son: D.son, notes: D.notes, puan: D.puan, seri: D.seri, enIyi: D.enIyi, tur: D.tur };
      const file = new Blob([JSON.stringify({ app: 'kardelen-ilac-defteri', schema: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file), a = document.createElement('a'); a.href = url;
      a.download = 'kardelen-yedek-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } else if (action === 'import') $('#ux-import').click();
    else if (action === 'import-cancel') { pending = null; $('#ux-import-preview').textContent = 'İçe aktarma iptal edildi.'; }
    else if (action === 'import-confirm' && pending) {
      const d = pending; pending = null;
      for (const id of Object.keys(d.fav)) D.fav[id] = 1;
      for (const [id, value] of Object.entries(d.notes)) if (!D.notes[id]) D.notes[id] = value;
      for (const [id, n] of Object.entries(d.kutu)) D.kutu[id] = Math.max(Number(D.kutu[id]) || 0, n);
      D.son = [...new Set(D.son.concat(d.son))].filter(known).slice(0, 15);
      for (const key of ['puan', 'seri', 'enIyi', 'tur']) D[key] = Math.max(integer(D[key]), d[key]);
      const ok = store.save(); render(); toast(ok ? 'Yedek birleştirildi. Mevcut kayıtlar korundu.' : 'Birleştirildi ancak cihaza kaydedilemedi. Yedek alın.', 5000);
    }
  });
  const online = () => document.querySelectorAll('.ux-network').forEach(el => { el.textContent = navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı'; });
  window.addEventListener('online', online); window.addEventListener('offline', online);
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !S.stack.length && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); git('ara'); $('#q').focus(); }
  });
})();
