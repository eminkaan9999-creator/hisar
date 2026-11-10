/* Kardelen v8: visual shelf map and local stock movement history */
(()=>{'use strict';
const KEY='kardelen.inventory.v1', LOG='kardelen.inventory.events.v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string').slice(0,5000):[];}catch{return [];}};
const events=()=>{try{const v=JSON.parse(localStorage.getItem(LOG)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&typeof x.at==='string'&&typeof x.action==='string').slice(-300):[];}catch{return [];}};
let history=events();
const save=()=>{try{localStorage.setItem(LOG,JSON.stringify(history.slice(-300)));}catch{$('#map-status').textContent='Hareket geçmişi kaydedilemedi. Tarayıcı depolamasını kontrol edin.';}};
const add=(action,name,delta,shelf)=>{history.push({at:new Date().toISOString(),action,name:String(name||'').slice(0,120),delta,shelf:String(shelf||'').slice(0,80)});history=history.slice(-300);save();};
const section=document.createElement('section');section.id='shelf-map';section.innerHTML='<h2>Dijital raf haritası</h2><p class="hint">Stok kayıtlarındaki raf konumlarına göre otomatik oluşturulur. Bu harita fiziksel raf sayımının yerine geçmez.</p><div class="grid"><label>Raf ara<input id="map-search" type="search" placeholder="Dolap veya raf adı"></label><label>Görünüm<select id="map-filter"><option value="all">Tüm raflar</option><option value="low">Kritik stok bulunanlar</option><option value="expiry">SKT uyarısı bulunanlar</option></select></label></div><div id="map-cards" class="map-cards" aria-live="polite"></div><h3>Son stok hareketleri</h3><p class="hint">Bu cihazda yapılan ekleme, silme ve adet değişiklikleri kaydedilir. Önceki işlemler geriye dönük oluşturulmaz.</p><div class="actions"><button id="map-log-export" class="secondary" type="button">Hareket geçmişini indir</button><button id="map-log-clear" class="secondary" type="button">Geçmişi temizle</button></div><p id="map-status" class="hint" role="status"></p><div class="scroll"><table><thead><tr><th>Tarih</th><th>İşlem</th><th>Ürün</th><th>Değişim</th><th>Raf</th></tr></thead><tbody id="map-log"></tbody></table></div>';
document.querySelector('main').append(section);
const css=document.createElement('style');css.textContent='.map-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:12px;margin-top:16px}.map-card{border:1px solid #dedee5;border-radius:14px;padding:15px;background:var(--surface,#fafafd);min-width:0}.map-card h3{margin:0 0 8px;overflow-wrap:anywhere}.map-card .map-count{font-size:13px;opacity:.8}.map-card ul{padding-left:18px;margin:10px 0 0}.map-card li{font-size:13px;margin:6px 0;overflow-wrap:anywhere}.map-flag{font-weight:700;color:#ae1729}.map-good{color:#127045;font-weight:700}.map-card button{margin-top:10px}.map-card:focus-within{outline:2px solid #2475cf}@media(prefers-color-scheme:dark){.map-card{background:#303039;border-color:#53535c}.map-good{color:#7cdda7}.map-flag{color:#ff9ca9}}';document.head.append(css);
const near=x=>{if(!x.expiry)return false;const d=new Date(x.expiry+'T12:00:00Z');return Number.isFinite(+d)&&d-new Date()<=31*86400000;};
function refresh(){
 const rows=get(),groups=new Map();
 for(const x of rows){const shelf=(x.shelf||'').trim()||'Konum belirtilmemiş';if(!groups.has(shelf))groups.set(shelf,[]);groups.get(shelf).push(x);}
 const q=$('#map-search').value.toLocaleLowerCase('tr'),filter=$('#map-filter').value;
 const selected=[...groups].filter(([s,x])=>s.toLocaleLowerCase('tr').includes(q)&&(filter==='all'||filter==='low'&&x.some(v=>v.qty<=v.min)||filter==='expiry'&&x.some(near))).sort((a,b)=>a[0].localeCompare(b[0],'tr'));
 $('#map-cards').innerHTML=selected.map(([s,list])=>{
 const low=list.filter(x=>x.qty<=x.min).length,exp=list.filter(near).length;
 return '<article class="map-card"><h3>'+esc(s)+'</h3><div class="map-count">'+list.length+' ürün kaydı</div><p>'+(low?'<span class="map-flag">'+low+' kritik stok</span>':'<span class="map-good">Stok eşiği normal</span>')+' · '+(exp?'<span class="map-flag">'+exp+' SKT uyarısı</span>':'SKT uyarısı yok')+'</p><ul>'+list.slice(0,8).map(x=>'<li>'+esc(x.name)+' — '+x.qty+' adet</li>').join('')+'</ul>'+(list.length>8?'<p class="hint">+'+(list.length-8)+' ürün daha</p>':'')+'<button type="button" class="secondary" data-map-shelf="'+esc(s)+'">Envanterde göster</button></article>';
 }).join('')||'<p class="hint">Bu filtrede raf bulunamadı. Önce stok kaydına raf konumu ekleyin.</p>';
 $('#map-log').innerHTML=history.slice(-50).reverse().map(x=>'<tr><td>'+esc(new Date(x.at).toLocaleString('tr-TR'))+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.delta)+'</td><td>'+esc(x.shelf)+'</td></tr>').join('')||'<tr><td colspan="5">Henüz hareket kaydı yok.</td></tr>';
}
$('#map-search').addEventListener('input',refresh);$('#map-filter').addEventListener('change',refresh);
$('#map-cards').addEventListener('click',e=>{const b=e.target.closest('[data-map-shelf]');if(!b)return;$('#search').value=b.dataset.mapShelf;$('#search').dispatchEvent(new Event('input',{bubbles:true}));$('#search').scrollIntoView({behavior:'smooth',block:'center'});$('#search').focus({preventScroll:true});});
const download=(body,name)=>{const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);};
$('#map-log-export').addEventListener('click',()=>download(JSON.stringify({app:'kardelen-inventory-events',schema:1,events:history},null,2),'kardelen-stok-hareketleri.json'));
$('#map-log-clear').addEventListener('click',()=>{if(!confirm('Yalnızca stok hareket geçmişi temizlensin mi? Envanter kayıtları korunur.'))return;history=[];save();refresh();$('#map-status').textContent='Hareket geçmişi temizlendi. Envanter kayıtları korunuyor.';});
const before=new Map(get().map(x=>[x.id,{...x}]));
function reconcile(){const current=get(),next=new Map(current.map(x=>[x.id,{...x}]));for(const [id,x] of next){const old=before.get(id);if(!old)add('Yeni kayıt',x.name,x.qty,x.shelf);else if(old.qty!==x.qty)add('Stok değişimi',x.name,x.qty-old.qty,x.shelf);}for(const [id,x] of before)if(!next.has(id))add('Kayıt silindi',x.name,-x.qty,x.shelf);before.clear();for(const [id,x] of next)before.set(id,x);refresh();}
$('#form').addEventListener('submit',()=>setTimeout(reconcile,0));
$('#rows').addEventListener('click',e=>{if(e.target.closest('[data-action]'))setTimeout(reconcile,0);});
$('#import').addEventListener('change',()=>setTimeout(reconcile,400));
refresh();
})();