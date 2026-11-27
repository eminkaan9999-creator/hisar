export const modes = {
  memory: {name:'Işık Dizisi', type:'Hafıza', tip:'Işıkların sırasını izle, sonra aynı sırayla dokun.', icon:'memory'},
  circuit: {name:'Devre Yolu', type:'Bulmaca', tip:'Parçaları döndürerek girişten çıkışa kesintisiz bir yol aç.', icon:'circuit'},
  rhythm: {name:'Ritim Hattı', type:'Ritim', tip:'Işık işaretli vuruşa geldiğinde ritim düğmesine dokun.', icon:'rhythm'}
};
export const order = Object.keys(modes);
export const acts = ['Kıvılcım','Prizma','Akış','Yankı','Kesişim','Doruk'];
export const shapes = ['Daire','Üçgen','Kare','Baklava'];
export const bits = [1,2,4,8];
const dx = [0,1,0,-1], dy = [-1,0,1,0];

export function hash(text) {
  let value = 2166136261;
  for (const c of text) value = Math.imul(value ^ c.charCodeAt(0), 16777619);
  return value >>> 0;
}
function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function dayKey(date = new Date()) {
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function rotate(mask) { return ((mask << 1) & 15) | (mask >> 3); }
function neighbor(index, direction, size) {
  const x = index % size + dx[direction], y = Math.floor(index/size) + dy[direction];
  return x >= 0 && x < size && y >= 0 && y < size ? y*size+x : -1;
}
export function connected(board) {
  const {tiles,size,start,end} = board;
  const seen = new Set();
  if (!(tiles[start] & 8)) return {seen, solved:false};
  seen.add(start);
  const queue = [start];
  for (let at = 0; at < queue.length; at++) {
    const i = queue[at];
    bits.forEach((bit, d) => {
      const next = neighbor(i,d,size);
      if ((tiles[i] & bit) && next >= 0 && !seen.has(next) && (tiles[next] & bits[(d+2)%4])) {
        seen.add(next); queue.push(next);
      }
    });
  }
  return {seen, solved:seen.has(end) && !!(tiles[end] & 2)};
}
export function circuit(size, rng) {
  const start = Math.floor(rng()*size)*size, end = Math.floor(rng()*size)*size+size-1;
  const seen = new Set([start]), path = [start];
  function walk(i) {
    if (i === end) return true;
    const directions = [0,1,2,3];
    for (let j=3;j>0;j--) {
      const k=Math.floor(rng()*(j+1));
      [directions[j],directions[k]]=[directions[k],directions[j]];
    }
    for (const d of directions) {
      const next=neighbor(i,d,size);
      if (next < 0 || seen.has(next)) continue;
      seen.add(next); path.push(next);
      if (walk(next)) return true;
      path.pop();
    }
    return false;
  }
  walk(start);
  const tiles=Array.from({length:size*size},()=>rng()<.5?3:5);
  path.forEach((i,k)=>{
    let mask=k===0?8:0;
    if (k===path.length-1) mask |= 2;
    bits.forEach((bit,d)=>{
      const n=neighbor(i,d,size);
      if (n>=0 && (n===path[k-1] || n===path[k+1])) mask |= bit;
    });
    tiles[i]=mask;
  });
  for(let i=0;i<tiles.length;i++) {
    const turns=Math.floor(rng()*4);
    for(let j=0;j<turns;j++) tiles[i]=rotate(tiles[i]);
  }
  const board={size,start,end,tiles,moves:0};
  if (connected(board).solved) {
    do { tiles[start]=rotate(tiles[start]); } while(tiles[start]&8);
  }
  return board;
}
export function roundFor(game) {
  const mode=game.kind==='daily'?order[game.round]:game.mode;
  const rng=random(hash(game.seed+'|'+game.round));
  const difficulty=game.difficulty;
  if (mode==='circuit') return {mode,board:circuit(Math.min(5,3+Math.floor((difficulty-1+game.round)/3)),rng)};
  if (mode==='memory') {
    const count=3+Math.floor((difficulty-1)/2)+game.round;
    const sequence=[];
    for(let k=0;k<count;k++) {
      const last=sequence[k-1];
      const next=k?((last+1+Math.floor(rng()*3))%4):Math.floor(rng()*4);
      sequence.push(next);
    }
    return {mode,sequence,cursor:0};
  }
  const targets=[];
  for(let i=0;i<2+Math.floor((difficulty+game.round)/3);i++) {
    const prev=targets[i-1];
    targets.push(i?(prev+2+Math.floor(rng()*5))%8:2+Math.floor(rng()*5));
  }
  return {mode,targets,hits:0,period:Math.max(275,550-30*difficulty-18*game.round)};
}
export function createGame(kind,mode,difficulty,stage,day,id) {
  const seed=kind==='daily'?'daily:'+day:kind==='campaign'?'stage:'+stage:id;
  const g={id,day,kind,mode,difficulty,stage,seed,round:0,hearts:3,points:0,phase:'ready'};
  g.puzzle=roundFor(g);
  return g;
}
export function resultFor(game) {
  const won=game.phase==='won';
  return {id:game.id,day:game.day,at:Date.now(),kind:game.kind,mode:game.mode,stage:game.stage,
    score:game.points,stars:won?game.hearts:0,won,rounds:won?3:game.round,
    xp:won?50+game.hearts*15:game.round*10};
}
