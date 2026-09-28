var re=!1,at=new Set,oe=(t)=>console.warn(t),ie=oe,se="kanabun [dev]: ";function ae(){return re||globalThis.__KANABUN_DEV__===!0}function k(t){if(!ae())return;if(at.has(t))return;at.add(t),ie(se+t)}var C=0,lt=1,R=2,E=3,w=null,m=null,U=0,K=!1,_=[],le=1e6,j=(t,e)=>t===e,ce=()=>!1;function dt(t){if(!t||t.equals===void 0)return j;if(t.equals===!1)return ce;return t.equals}class N{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,r){if(this.equals=n,this.isEffect=e,r){if(this.fn=t,this.value=void 0,this.color=R,m!==null)(m.owned??=[]).push(this),this.owner=m}else this.fn=null,this.value=t,this.color=C}read(){if(this.color===E)return this.value;if(w!==null)(w.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(w!==null&&!w.isEffect)k("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(R)}markStale(t){if(this.color>=t)return;let e=this.color===C;if(this.color=t,e&&this.isEffect)pt(this);if(this.observers!==null)for(let n of this.observers)n.markStale(lt)}updateIfNecessary(){if(this.color===C||this.color===E)return;if(this.color===lt&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===R)break}if(this.color===R)this.update();this.color=C}update(){this.cleanNode();let t=w,e=m;w=this,m=this,this.collecting=[];let n,r,i=!1;try{n=this.fn()}catch(s){i=!0,r=s}finally{w=t,m=e}if(i){this.collecting=null,this.color=C,de(r,this.owner);return}this.reconcileSources();let a=!this.equals(this.value,n);if(this.value=n,this.color=C,a&&this.observers!==null){for(let s of this.observers)if(s.color!==E&&s.color<R)s.color=R}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))ct(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))ue(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===E)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)ct(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=E}}function ue(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function ct(t,e){let n=t.observers;if(n===null)return;let r=n.indexOf(e);if(r===-1)return;if(n[r]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function pt(t){_.push(t)}function Y(){if(K)return;K=!0;let t=0,e=0;try{while(t<_.length){if(++e>le)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=_[t++];if(n.color!==E)n.updateIfNecessary()}}finally{_.length=0,K=!1}}function ft(t,e){let n=m,r=w;m=t,w=null;try{return e()}finally{m=n,w=r}}function g(t,e){let n=new N(t,!1,dt(e),!1),r=()=>n.read(),i=r;return i.set=(a)=>{if(n.write(a),U===0)Y()},i.update=(a)=>{if(n.write(a(n.value)),U===0)Y()},i.peek=()=>n.value,r}function V(t,e){let n=new N(t,!1,dt(e),!0);return()=>n.read()}function M(t){if(m===null)k("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new N(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,j,!0);if(pt(e),U===0)Y();return()=>e.dispose()}var ut=Symbol("error-handler");function de(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&ut in n.context){n.context[ut](t);return}throw t}function I(t){if(m===null){k("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(m.cleanups??=[]).push(t)}function O(t){let e=new N(void 0,!1,j,!1);return e.owner=m,ft(e,()=>t(()=>e.dispose()))}function Q(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function pe(t){return t!=null&&typeof t.nodeType==="number"}function fe(t){return t.nodeType===3}var me=new Set(["script","style"]);function G(t,e){let n=Q().createElement(t);if(e!==null){for(let r in e){if(r==="children"||r==="ref")continue;xe(n,r,e[r])}if(e.ref!==void 0)he(e.ref,n);if("children"in e)ge(t,e.children),J(n,e.children)}return n}function ge(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!me.has(t.toLowerCase()))return;k(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function he(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function xe(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){be(t,n);return}if(typeof n==="function")M(()=>gt(t,e,n()));else gt(t,e,n)}function be(t,e){for(let n in e){let r=e[n];if(typeof r==="function")M(()=>mt(t,n,r()));else mt(t,n,r)}}function mt(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function gt(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function J(t,e,n=null){if(Array.isArray(e)){for(let r of e)J(t,r,n);return}if(typeof e==="function"){let r=t.insertBefore(Q().createComment(""),n);ht(t,e,r,{current:null});return}xt(t,e,null,n)}function ht(t,e,n,r){M(()=>{let i=e();if(typeof i==="function")ht(t,i,n,r);else r.current=xt(t,i,r.current,n)})}function xt(t,e,n,r){if(n!==null&&n.length===1&&fe(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let i=ve(e);return bt(t,n??[],i,r),i.length>0?i:null}function bt(t,e,n,r){if(e.length>0){let a=new Set(n);for(let s of e)if(!a.has(s)&&s.parentNode===t)t.removeChild(s)}let i=r;for(let a=n.length-1;a>=0;a--){let s=n[a];if(s.parentNode!==t||s.nextSibling!==i)t.insertBefore(s,i);i=s}}function ve(t){let e=[];return W(e,t),e}function W(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)W(t,n);return}if(pe(e)){t.push(e);return}if(typeof e==="function"){W(t,e());return}t.push(Q().createTextNode(String(e)))}function Z(t,e){let n;return O((r)=>{n=r,J(e,t())}),()=>{n(),e.textContent=""}}function vt(t,e){let n=[],r=[],i=[];return I(()=>{for(let a of i)a()}),()=>{let a=t(),s=a.length,u=Array(s),c=Array(s),p=new Map;for(let d=0;d<n.length;d++){let A=p.get(n[d]);if(A)A.push(d);else p.set(n[d],[d])}let b=Array(n.length).fill(!1);for(let d=0;d<s;d++){let A=a[d],H=p.get(A);if(H!==void 0&&H.length>0){let v=H.shift();b[v]=!0,u[d]=r[v],c[d]=i[v]}else{let v,F=O((P)=>(v=e(A,d),P));u[d]=v,c[d]=F}}for(let d=0;d<i.length;d++)if(!b[d])i[d]();return n=a.slice(),r=u,i=c,u}}function x(t){let e=V(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function tt(t){let e=vt(()=>t.each()??[],(n,r)=>t.children(n,r));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var Ae=/^@(media|supports|container|document|layer)\b/i;function h(t,...e){let n=typeof t==="string"?t:t.reduce((a,s,u)=>a+s+(u<e.length?String(e[u]):""),""),r=He(n),i="k-"+r;return Me(r,et(n,"."+i)),i}function Te(t){let e=[],n="",r=0,i="",a="",s="";for(let u=0;u<t.length;u++){let c=t[u];if(c==="{"){if(r===0){let p=i.lastIndexOf(";");n+=i.slice(0,p+1),s=i.slice(p+1),i="",a=""}else a+=c;r++}else if(c==="}")if(r--,r===0)e.push({prelude:s,inner:a});else if(r>0)a+=c;else r=0;else if(r===0)i+=c;else a+=c}return n+=i,{decls:n,blocks:e}}function et(t,e){let{decls:n,blocks:r}=Te(t),i="",a=n.trim();if(a)i+=`${e}{${a}}`;for(let{prelude:s,inner:u}of r){let c=s.trim();if(c[0]==="@")i+=Ae.test(c)?`${c}{${et(u,e)}}`:`${c}{${u.trim()}}`;else i+=et(u,ke(c,e))}return i}function ke(t,e){return Ee(t,",").map((n)=>{let r=n.trim();return r.includes("&")?r.replace(/&/g,e):`${e} ${r}`}).join(",")}function Ee(t,e){let n=[],r=0,i="";for(let a=0;a<t.length;a++){let s=t[a];if(s==="("||s==="[")r++;else if(s===")"||s==="]")r--;if(s===e&&r===0)n.push(i),i="";else i+=s}return n.push(i),n}var wt=new Map;function Me(t,e){let n=globalThis.document;if(!n){if(!wt.has(t))wt.set(t,e);return}Se(n,t,e)}function Se(t,e,n){let r=t.head;for(let a of r.childNodes)if(a.nodeType===1&&a.getAttribute("data-k")===e)return;let i=t.createElement("style");i.setAttribute("data-k",e),i.textContent=n,r.appendChild(i)}function He(t){let e=5381,n=2166136261;for(let r=0;r<t.length;r++){let i=t.charCodeAt(r);e=(e<<5)+e^i,n=Math.imul(n^i,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}var nt=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function yt(t,e){let n=await fetch(nt+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),r=await n.json().catch(()=>({}));if(!n.ok)throw Error(r.message??`${n.status}`);return r}var At=(t)=>yt("/api/ask",{question:t}),Tt=(t)=>yt(`/api/faq/${encodeURIComponent(t)}`);var kt=h`
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 16px 56px;

  .titlebar {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 24px;
    margin: 0;
    letter-spacing: 0.02em;
  }

  h1 a.home {
    color: inherit;
    text-decoration: none;
  }

  .byline {
    color: var(--muted);
    font-size: 13px;
    margin: 2px 0 20px;
  }

  footer {
    color: var(--muted);
    font-size: 12px;
    margin-top: 40px;
    text-align: center;
    overflow-wrap: anywhere;
  }

  footer a {
    color: inherit;
  }
`,rt=h`
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 16px;

  h2 {
    font-size: 13px;
    margin: 0 0 10px;
    color: var(--muted);
    font-weight: 600;
    letter-spacing: 0.08em;
  }
`,Et=h`
  .meta {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: var(--muted);
    margin: 0;
  }

  .meta a {
    color: var(--muted);
    text-decoration: none;
  }

  h3 {
    font-size: 17px;
    line-height: 1.5;
    margin: 2px 0 8px;
  }

  .prose p {
    margin: 0 0 10px;
    white-space: pre-line;
  }

  .pending {
    color: var(--muted);
    font-style: italic;
    margin: 0 0 6px;
  }

  details {
    margin: 4px 0 8px;
    border-left: 2px solid var(--line);
    padding-left: 12px;
  }

  summary {
    cursor: pointer;
    color: var(--accent);
    font-size: 13.5px;
    margin-bottom: 6px;
  }

  .related {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 8px;
  }

  .label {
    font-size: 12px;
    color: var(--muted);
    margin-right: 2px;
  }

  .notes {
    margin: 10px 0 0;
    padding: 6px 12px 6px 28px;
    border-radius: 8px;
    background: var(--bg);
    font-size: 12.5px;
    color: var(--muted);
  }

  .notes li {
    margin: 1px 0;
  }

  .sources {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .sources a {
    color: var(--muted);
  }

  button.chip {
    font-size: 12.5px;
    padding: 3px 12px;
    border-radius: 999px;
    background: transparent;
    color: var(--accent);
    text-align: left;
  }
`,Mt=h`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 8px;

  .label {
    font-size: 12px;
    color: var(--muted);
    margin-right: 2px;
  }

  button.chip {
    font-size: 12.5px;
    padding: 3px 12px;
    border-radius: 999px;
    background: transparent;
    color: var(--accent);
    text-align: left;
  }
`,St=h`
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);

  summary {
    cursor: pointer;
    color: var(--accent);
    font-size: 13.5px;
  }

  pre {
    font-family: inherit;
    font-size: 13px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: var(--muted);
    background: var(--bg);
    border-radius: 8px;
    padding: 8px 12px;
    margin: 8px 0 10px;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    font-size: 13px;
    padding: 4px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--accent);
    cursor: pointer;
  }
`,Ht=h`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0 4px;

  .bubble {
    position: relative;
    margin: 0 0 10px;
    padding: 8px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--card);
    font-size: 14.5px;
    min-height: 1.85em;
    text-align: center;
  }

  .bubble::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -7px;
    width: 12px;
    height: 12px;
    background: var(--card);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    transform: translateX(-50%) rotate(45deg);
  }

  svg {
    width: min(260px, 64vw);
    height: auto;
    display: block;
  }

  .bird,
  .pupils,
  .lid {
    transform-box: fill-box;
  }

  .bird {
    transform-origin: 50% 100%;
    transition: transform 0.3s ease;
  }

  .pupils {
    transition: transform 0.25s ease;
  }

  /* Keyframes are global in kanabun's css helper, hence the owl- prefix.
     The lids sit shut-flat until a blink opens them downward for a moment. */
  .lid {
    transform-origin: 50% 0%;
    transform: scaleY(0);
    animation: owl-blink 5s infinite;
  }

  &.thinking .bird {
    animation: owl-ponder 1.4s ease-in-out infinite;
  }

  &.thinking .pupils {
    transform: translate(3px, -6px);
  }

  &.answer .bird {
    animation: owl-hop 0.5s ease-out 1;
  }

  /* Listening: the owl leans in, eyes wide on the speaker. */
  &.listening .bird {
    transform: translateY(-4px) scale(1.03);
  }

  &.listening .pupils {
    transform: translateY(2px);
  }

  &.suggest .bird,
  &.miss .bird {
    transform: rotate(-8deg);
  }

  &.miss .pupils {
    transform: translate(-3px, 2px);
  }

  /* Several questions at once: the owl's eyes go round in circles. */
  &.multiple .bird {
    animation: owl-dizzy 0.9s ease-in-out 2;
  }

  &.multiple .pupils {
    animation: owl-roll 0.9s linear 2;
  }

  @keyframes owl-blink {
    0%, 94%, 100% { transform: scaleY(0); }
    97% { transform: scaleY(1); }
  }

  @keyframes owl-ponder {
    0%, 100% { transform: rotate(-6deg); }
    50% { transform: rotate(6deg); }
  }

  @keyframes owl-dizzy {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-9deg); }
    75% { transform: rotate(9deg); }
  }

  @keyframes owl-roll {
    0% { transform: translate(3px, 0); }
    25% { transform: translate(0, 3px); }
    50% { transform: translate(-3px, 0); }
    75% { transform: translate(0, -3px); }
    100% { transform: translate(3px, 0); }
  }

  @keyframes owl-hop {
    0% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    100% { transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .lid,
    &.thinking .bird,
    &.answer .bird,
    &.multiple .bird,
    &.multiple .pupils {
      animation: none;
    }
  }
`,Lt=h`
  position: relative;
  margin: 0 0 20px;

  input {
    font: inherit;
    font-size: 17px;
    width: 100%;
    padding: 14px 58px 14px 18px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--fg);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
  }

  input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  button.mic {
    position: absolute;
    top: 50%;
    right: 7px;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    padding: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--muted);
  }

  button.mic:hover {
    color: var(--accent);
  }

  /* Listening: the button fills, and a ring pulses out of it, so it is plain
     from across the room that the page is taking sound. */
  button.mic.on {
    background: var(--accent);
    color: var(--on-accent);
    animation: mic-pulse 1.4s ease-out infinite;
  }

  @keyframes mic-pulse {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); }
    100% { box-shadow: 0 0 0 14px transparent; }
  }

  @media (prefers-reduced-motion: reduce) {
    button.mic.on {
      animation: none;
    }
  }
`,Ct=h`
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: -10px 0 16px;
`,Rt=h`
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin: -8px 0 16px;
`,Nt=h`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,Pt=h`
  margin-top: 28px;
  border-top: 1px solid var(--line);
  padding-top: 10px;

  summary {
    cursor: pointer;
    font-size: 13.5px;
    color: var(--muted);
  }

  ol {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }

  li {
    display: flex;
    gap: 10px;
    align-items: baseline;
    border-bottom: 1px solid var(--line);
    padding: 6px 0;
  }

  li button {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--fg);
    text-align: left;
    cursor: pointer;
    font-size: 14px;
  }

  li button:hover .q {
    color: var(--accent);
  }

  .q {
    overflow-wrap: anywhere;
  }

  .a {
    font-size: 12px;
    color: var(--muted);
  }

  .at {
    flex: 0 0 auto;
    font-size: 11.5px;
    color: var(--muted);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--muted);
    margin: 8px 0 0;
  }

  button.clear {
    font-size: 12px;
    padding: 2px 10px;
    background: transparent;
    color: var(--muted);
    border-color: var(--line);
  }
`,It=h`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function Ot(t,e,n){if(typeof t==="function")return t(e??{});return G(t,e??null)}function o(t,e,n,r,i,a){return Ot(t,e,n)}var Ce={idle:"ビットコインのこと、なんでも聞いてください。",listening:"どうぞ、お話しください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。",multiple:"いっぺんに聞かれると目が回ります……ひとつずつどうぞ。"},Re=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
  <rect x="18" y="186" width="164" height="12" rx="6" fill="#7a4e2d" />

  <g class="bird">
    <path d="M52 52 L44 16 L78 40 Z" fill="#6f4a2f" />
    <path d="M148 52 L156 16 L122 40 Z" fill="#6f4a2f" />
    <ellipse cx="100" cy="112" rx="66" ry="76" fill="#8a5d3b" />
    <ellipse cx="42" cy="128" rx="16" ry="40" fill="#6f4a2f" transform="rotate(12 42 128)" />
    <ellipse cx="158" cy="128" rx="16" ry="40" fill="#6f4a2f" transform="rotate(-12 158 128)" />
    <ellipse cx="100" cy="138" rx="42" ry="44" fill="#ecd6b3" />
    <path
      d="M76 126 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 M70 142 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0"
      fill="none"
      stroke="#d7b98e"
      stroke-width="2"
      stroke-linecap="round"
    />
    <circle cx="100" cy="162" r="11" fill="#f7931a" />
    <text x="100" y="167" text-anchor="middle" font-size="14" font-weight="700" fill="#ffffff">
      ₿
    </text>
    <circle cx="72" cy="86" r="28" fill="#f6ead7" />
    <circle cx="128" cy="86" r="28" fill="#f6ead7" />
    <g class="pupils">
      <circle cx="72" cy="88" r="13" fill="#2b1d12" />
      <circle cx="128" cy="88" r="13" fill="#2b1d12" />
      <circle cx="76" cy="83" r="4" fill="#ffffff" />
      <circle cx="132" cy="83" r="4" fill="#ffffff" />
    </g>
    <ellipse class="lid" cx="72" cy="86" rx="29" ry="29" fill="#8a5d3b" />
    <ellipse class="lid" cx="128" cy="86" rx="29" ry="29" fill="#8a5d3b" />
    <path d="M92 104 L108 104 L100 120 Z" fill="#f2a33a" />
  </g>
  <path d="M78 184 l-6 8 M84 184 v9 M90 184 l6 8" stroke="#f2a33a" stroke-width="4" stroke-linecap="round" />
  <path d="M110 184 l-6 8 M116 184 v9 M122 184 l6 8" stroke="#f2a33a" stroke-width="4" stroke-linecap="round" />
</svg>`;function Dt(t){return o("div",{class:()=>`${Ht} ${t.mood()}`,children:[o("p",{class:"bubble","aria-live":"polite",children:()=>Ce[t.mood()]},void 0,!1,void 0,this),o("div",{class:"drawing",ref:(e)=>e.innerHTML=Re},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var ot="jev-bitcoin:history",Ne=50,qt=60000;function Pe(){try{let t=localStorage.getItem(ot),e=t===null?[]:JSON.parse(t);return Array.isArray(e)?e.filter((n)=>typeof n?.q==="string"):[]}catch{return[]}}function zt(t){try{localStorage.setItem(ot,JSON.stringify(t))}catch{}}var S=g(Pe());function $t(t,e,n,r){let i=Date.now();S.update((a)=>{let s=a[0],u=s!==void 0&&i-s.at<qt&&(t.startsWith(s.q)||s.q.startsWith(t)),p=[{q:t,at:i,id:n,title:r,status:e},...u?a.slice(1):a].slice(0,Ne);return zt(p),p})}function Ft(t,e){S.update((n)=>{let r=n[0];if(r===void 0||r.status!=="suggest"||r.id!==void 0)return n;if(Date.now()-r.at>qt*5)return n;let i=[{...r,id:t,title:e},...n.slice(1)];return zt(i),i})}function _t(){S.set([]);try{localStorage.removeItem(ot)}catch{}}var Ie={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function jt(t){return o("div",{class:"prose",children:t.lines.map((e)=>o("p",{children:e},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function Jt(t){let e=t.entry,n=e.more??[],r=e.related??[],i=e.sources??[],a=(e.tags??[]).map((s)=>Ie[s]).filter((s)=>s!==void 0);return o("div",{class:Et,children:[o("p",{class:"meta",children:[o("span",{children:e.category.name},void 0,!1,void 0,this),o("a",{href:`#${e.id}`,title:"この答えへのリンク",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("h3",{children:e.title},void 0,!1,void 0,this),o(x,{when:()=>e.answered,fallback:o("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:o(jt,{lines:e.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(x,{when:()=>n.length>0,children:o("details",{open:t.expand===!0,children:[o("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),o(jt,{lines:n},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(x,{when:()=>r.length>0,children:o("div",{class:"related",children:[o("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),r.map((s)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(s.id),children:s.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(x,{when:()=>a.length>0,children:o("ul",{class:"notes",children:a.map((s)=>o("li",{children:s},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(x,{when:()=>i.length>0||e.updated!==void 0,children:o("div",{class:"sources",children:[i.map((s)=>/^https?:\/\//.test(s)?o("a",{href:s,target:"_blank",rel:"noopener noreferrer",children:s},void 0,!1,void 0,this):o("span",{children:s},void 0,!1,void 0,this)),o(x,{when:()=>e.updated!==void 0,children:o("span",{class:"updated",children:`${e.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Bt(t){return o("div",{class:Mt,children:[o("span",{class:"label",children:t.label},void 0,!1,void 0,this),t.items.map((e)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(e.id),children:e.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}function Oe(t){if(t.title!==void 0)return`→ ${t.title}`;if(t.status==="multiple")return"→ 質問がいくつか入っていました";if(t.status==="suggest")return"→ 近い質問がありました";return"→ 答えは見つかりませんでした"}function De(t){let e=new Date(t),n=`${e.getHours()}:${String(e.getMinutes()).padStart(2,"0")}`;return e.toDateString()===new Date().toDateString()?n:`${e.getMonth()+1}/${e.getDate()} ${n}`}function Xt(t){return o(x,{when:()=>S().length>0,children:o("details",{class:Pt,children:[o("summary",{children:()=>`これまでの質問（${S().length}）`},void 0,!1,void 0,this),o("ol",{children:o(tt,{each:S,children:(e)=>o("li",{children:[o("button",{type:"button",onClick:()=>t.again(e.q,e.id),children:[o("span",{class:"q",children:e.q},void 0,!1,void 0,this),o("span",{class:"a",children:Oe(e)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("span",{class:"at",children:De(e.at)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("p",{class:"foot",children:[o("span",{children:"履歴はこのブラウザの中にだけ保存されています。"},void 0,!1,void 0,this),o("button",{type:"button",class:"clear",onClick:()=>_t(),children:"履歴を消す"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)}var qe=50,Kt=60,ze="#jevbitcoin";function Ut(t,e){let n=[...t.replace(/\s+/g," ").trim()];return n.length<=e?n.join(""):`${n.slice(0,e-1).join("")}…`}function $e(t){let e=(t.answer[0]??"").replace(/\s+/g," ").trim(),n=e.indexOf("。");if(n>=0&&[...e.slice(0,n+1)].length<=Kt)return e.slice(0,n+1);return Ut(e,Kt)}function Fe(t,e){let n=e!==void 0&&e.answered?$e(e):"まだ答えが見つかりませんでした";return[`Q. ${Ut(t,qe)}`,`A. ${n}`,ze].join(`
`)}function _e(t){let e=new URL(location.href);return e.searchParams.delete("api"),e.hash=t??"",e.toString()}function it(t){let e=t.entry?.answered===!0,n=Fe(t.question,t.entry),r=_e(e?t.entry?.id:void 0),i=g(!1),a=typeof navigator.share==="function",s=()=>{navigator.share({title:t.entry?.title??t.question,text:n,url:r}).catch(()=>{})},u=async()=>{let c=`${n}
${r}`;try{await navigator.clipboard.writeText(c)}catch{let p=document.createElement("textarea");p.value=c,p.style.position="fixed",p.style.opacity="0",document.body.appendChild(p),p.select(),document.execCommand("copy"),p.remove()}i.set(!0),setTimeout(()=>i.set(!1),2000)};return o("details",{class:St,children:[o("summary",{children:e?"この質問と答えを共有する":"この質問を共有する"},void 0,!1,void 0,this),o("pre",{children:`${n}
${r}`},void 0,!1,void 0,this),o("div",{class:"buttons",children:[a?o("button",{type:"button",onClick:s,children:"共有する"},void 0,!1,void 0,this):null,o("button",{type:"button",onClick:()=>void u(),children:()=>i()?"コピーしました":"コピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Yt(){let t=window;return t.SpeechRecognition??t.webkitSpeechRecognition}var Vt=Yt()!==void 0,je={"not-allowed":"マイクの使用が許可されていません。ブラウザの設定で、このページのマイクを許可してください。","service-not-allowed":"このブラウザでは音声入力を使えないようです。","audio-capture":"マイクが見つかりませんでした。","no-speech":"声が聞き取れませんでした。もう一度どうぞ。",network:"音声認識のサービスに接続できませんでした。","language-not-supported":"このブラウザは日本語の音声入力に対応していないようです。"};function Wt(t){let e=Yt();if(e===void 0)return t.error("このブラウザは音声入力に対応していません。"),t.end(),{stop(){}};let n=new e;n.lang="ja-JP",n.interimResults=!0,n.continuous=!1,n.maxAlternatives=1;let r="",i=!1;n.onresult=(a)=>{let s="",u=!1;for(let c=0;c<a.results.length;c++){let p=a.results[c];if(p===void 0)continue;s+=p[0].transcript,u=u||p.isFinal}if(r=s.trim(),u)i=!0,t.final(r);else t.interim(r)},n.onerror=(a)=>{if(a.error==="aborted")return;t.error(je[a.error]??"音声入力でエラーが起きました。")},n.onend=()=>{if(!i&&r!=="")t.final(r);t.end()};try{n.start()}catch{t.error("音声入力を始められませんでした。"),t.end()}return{stop:()=>n.stop()}}var Qt=500,q=5,B=(t)=>[...t].length,z=(t)=>t.trim().replace(/\s+/g," "),Be=/^[1-9][0-9]*-[1-9][0-9]*$/,Xe=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="3" width="6" height="11" rx="3" />
  <path d="M5 11a7 7 0 0 0 14 0" />
  <path d="M12 18v3" />
</svg>`;function Gt(){let t=g(""),e=g(null),n=g(null),r=g(!1),i=g(""),a=g(!1),s=g(!1),u=null,c,p=!1,b="",d=0,A=()=>{if(r())return"thinking";if(a())return"listening";let l=e();if(l===null)return i()===""?"idle":"miss";return l.status},H=async(l,f,T)=>{let y=++d;r.set(!0),i.set("");try{let L=await l();if(y===d)n.set(f),e.set(L),T?.(L)}catch(L){if(y===d)i.set(L instanceof Error?L.message:String(L))}finally{if(y===d)r.set(!1)}},v=(l)=>{let f=z(l);if(B(f)<q||f===b)return;b=f,H(()=>At(f),f,(T)=>$t(f,T.status,T.answer?.id,T.answer?.title))},F=()=>{if(clearTimeout(c),s.set(!1),p)return;let l=t.peek(),f=B(z(l));if(f>=q)c=setTimeout(()=>v(l),Qt);else if(f>0)c=setTimeout(()=>s.set(!0),Qt)},P=(l,f,T)=>{clearTimeout(c),H(async()=>({status:"answer",answer:await Tt(l),categories:[]}),f,(y)=>{if(T&&y.answer!==void 0)Ft(y.answer.id,y.answer.title)})},st=(l)=>P(l,null,!1),te=(l)=>P(l,b===""?null:b,!0),ee=(l,f)=>{if(t.set(l),f!==void 0){b=z(l),P(f,b,!1);return}b="",clearTimeout(c),v(l)},ne=()=>{if(u!==null){u.stop();return}clearTimeout(c),i.set(""),a.set(!0),u=Wt({interim:(l)=>t.set(l),final:(l)=>{if(t.set(l),B(z(l))>=q)b="",v(l);else s.set(!0)},error:(l)=>i.set(l),end:()=>{u=null,a.set(!1)}})},X=()=>{let l=decodeURIComponent(location.hash.replace(/^#/,""));if(Be.test(l))st(l)};return X(),window.addEventListener("hashchange",X),I(()=>{window.removeEventListener("hashchange",X),clearTimeout(c),u?.stop()}),M(()=>{let l=e();document.title=l?.answer!==void 0?`${l.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),o("div",{children:[o(Dt,{mood:A},void 0,!1,void 0,this),o("form",{class:Lt,onSubmit:(l)=>{l.preventDefault(),clearTimeout(c);let f=t.peek();s.set(B(z(f))<q),v(f)},children:[o("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:()=>a()?"聞いています……":"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:t,ref:(l)=>{if(!window.matchMedia("(pointer: coarse)").matches)l.focus()},onInput:(l)=>{u?.stop(),t.set(l.target.value),F()},onCompositionstart:()=>{p=!0,clearTimeout(c),s.set(!1)},onCompositionend:()=>{p=!1,F()}},void 0,!1,void 0,this),Vt?o("button",{type:"button",class:()=>`mic ${a()?"on":""}`,"aria-label":()=>a()?"音声入力を止める":"声で質問する","aria-pressed":()=>a()?"true":"false",title:()=>a()?"音声入力を止める":"声で質問する",onClick:ne,ref:(l)=>l.innerHTML=Xe},void 0,!1,void 0,this):null]},void 0,!0,void 0,this),o(x,{when:a,children:o("p",{class:Ct,children:"話し終えると、そのまま質問します。音声の認識はブラウザの機能で行います（Chrome などでは音声がブラウザ提供元のサーバで処理されます）。"},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(x,{when:s,children:o("p",{class:Rt,children:[q,"文字以上入力してください"]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(x,{when:()=>i()!=="",children:o("p",{class:It,children:i},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("div",{class:()=>`${Nt} ${r()?"stale":""}`,children:()=>{let l=e();if(l===null)return null;return o("div",{children:[l.answer!==void 0?o("div",{class:rt,children:[o(Jt,{entry:l.answer,expand:l.expand,open:st},void 0,!1,void 0,this),o(it,{question:n.peek()??l.answer.title,entry:l.answer},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,(l.message??[]).length>0&&l.status!=="suggest"?o("div",{class:`${rt} message`,children:[(l.message??[]).map((f)=>o("p",{children:f},void 0,!1,void 0,this)),l.answer===void 0&&l.status==="miss"&&n.peek()!==null?o(it,{question:n.peek()??""},void 0,!1,void 0,this):null]},void 0,!0,void 0,this):null,(l.suggestions??[]).length>0?o(Bt,{label:l.status==="multiple"?"近い質問":"もしかして",items:l.suggestions??[],open:te},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this),o(Xt,{again:ee},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Ke(){return o("main",{class:kt,children:[o(Gt,{},void 0,!1,void 0,this),o("footer",{children:["答えはあらかじめ用意したもので、その場で文章を作ることはしません。質問の読み取りに ",o("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",o("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",o("span",{children:nt},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var Zt=document.getElementById("app");if(Zt)Z(()=>o(Ke,{},void 0,!1,void 0,this),Zt);

//# debugId=168DDF3ECB805E0A64756E2164756E21
//# sourceMappingURL=chunk-40jsqmy4.js.map
