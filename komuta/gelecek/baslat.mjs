const classic=new URL(location.href).searchParams.get('arsiv')==='1';
if(classic) {
  const stylesheet=document.querySelector('#game-style');
  stylesheet.href=new URL('../ortak/oyun.css',import.meta.url).href;
  await import('../ortak/oyun.mjs');
  const back=document.createElement('a');
  back.href='./';
  back.textContent='Gelecek savaş alanına dön ›';
  back.style.cssText='display:block;padding:12px 24px;text-align:center;color:var(--aqua)';
  document.body.append(back);
} else {
  await import('./oyun.mjs');
}
