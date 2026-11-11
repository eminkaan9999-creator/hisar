/* KOMUTA save isolation: no writes to sibling-game keys. */
(function(){'use strict';const prefix='hisar-komuta-standalone-v1:';
for(const name of ['localStorage','sessionStorage']){let raw;try{raw=window[name];}catch{continue;}
 const own=()=>{const keys=[];for(let i=0;i<raw.length;i++){const k=raw.key(i);if(k&&k.startsWith(prefix))keys.push(k.slice(prefix.length));}return keys;};
 const methods={getItem(k){return raw.getItem(prefix+String(k));},setItem(k,v){raw.setItem(prefix+String(k),String(v));},removeItem(k){raw.removeItem(prefix+String(k));},key(i){return own()[Number(i)]??null;},clear(){for(const k of own())raw.removeItem(prefix+k);}};
 const storage=new Proxy(methods,{get(t,k){if(k==='length')return own().length;if(k===Symbol.toStringTag)return 'Storage';if(typeof k==='symbol')return undefined;if(k in t)return t[k];return t.getItem(k)??undefined;},set(t,k,v){t.setItem(k,v);return true;},deleteProperty(t,k){t.removeItem(k);return true;},ownKeys(){return own();},getOwnPropertyDescriptor(t,k){if(own().includes(k))return {configurable:true,enumerable:true,writable:true,value:t.getItem(k)};}});
 Object.defineProperty(window,name,{configurable:true,get:()=>storage});
}window.KomutaStorageIsolation=Object.freeze({prefix});})();
