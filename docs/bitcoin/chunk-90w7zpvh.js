var Qt=!1,ot=new Set,Gt=(t)=>console.warn(t),Zt=Gt,te="kanabun [dev]: ";function ee(){return Qt||globalThis.__KANABUN_DEV__===!0}function k(t){if(!ee())return;if(ot.has(t))return;ot.add(t),Zt(te+t)}var L=0,it=1,C=2,E=3,v=null,m=null,K=0,X=!1,z=[],ne=1e6,F=(t,e)=>t===e,re=()=>!1;function lt(t){if(!t||t.equals===void 0)return F;if(t.equals===!1)return re;return t.equals}class R{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,r){if(this.equals=n,this.isEffect=e,r){if(this.fn=t,this.value=void 0,this.color=C,m!==null)(m.owned??=[]).push(this),this.owner=m}else this.fn=null,this.value=t,this.color=L}read(){if(this.color===E)return this.value;if(v!==null)(v.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(v!==null&&!v.isEffect)k("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(C)}markStale(t){if(this.color>=t)return;let e=this.color===L;if(this.color=t,e&&this.isEffect)ct(this);if(this.observers!==null)for(let n of this.observers)n.markStale(it)}updateIfNecessary(){if(this.color===L||this.color===E)return;if(this.color===it&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===C)break}if(this.color===C)this.update();this.color=L}update(){this.cleanNode();let t=v,e=m;v=this,m=this,this.collecting=[];let n,r,i=!1;try{n=this.fn()}catch(s){i=!0,r=s}finally{v=t,m=e}if(i){this.collecting=null,this.color=L,ie(r,this.owner);return}this.reconcileSources();let a=!this.equals(this.value,n);if(this.value=n,this.color=L,a&&this.observers!==null){for(let s of this.observers)if(s.color!==E&&s.color<C)s.color=C}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))st(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))oe(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===E)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)st(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=E}}function oe(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function st(t,e){let n=t.observers;if(n===null)return;let r=n.indexOf(e);if(r===-1)return;if(n[r]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function ct(t){z.push(t)}function Y(){if(X)return;X=!0;let t=0,e=0;try{while(t<z.length){if(++e>ne)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=z[t++];if(n.color!==E)n.updateIfNecessary()}}finally{z.length=0,X=!1}}function ut(t,e){let n=m,r=v;m=t,v=null;try{return e()}finally{m=n,v=r}}function b(t,e){let n=new R(t,!1,lt(e),!1),r=()=>n.read(),i=r;return i.set=(a)=>{if(n.write(a),K===0)Y()},i.update=(a)=>{if(n.write(a(n.value)),K===0)Y()},i.peek=()=>n.value,r}function V(t,e){let n=new R(t,!1,lt(e),!0);return()=>n.read()}function M(t){if(m===null)k("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new R(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,F,!0);if(ct(e),K===0)Y();return()=>e.dispose()}var at=Symbol("error-handler");function ie(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&at in n.context){n.context[at](t);return}throw t}function P(t){if(m===null){k("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(m.cleanups??=[]).push(t)}function I(t){let e=new R(void 0,!1,F,!1);return e.owner=m,ut(e,()=>t(()=>e.dispose()))}function W(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function se(t){return t!=null&&typeof t.nodeType==="number"}function ae(t){return t.nodeType===3}var le=new Set(["script","style"]);function Q(t,e){let n=W().createElement(t);if(e!==null){for(let r in e){if(r==="children"||r==="ref")continue;de(n,r,e[r])}if(e.ref!==void 0)ue(e.ref,n);if("children"in e)ce(t,e.children),_(n,e.children)}return n}function ce(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!le.has(t.toLowerCase()))return;k(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function ue(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function de(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){pe(t,n);return}if(typeof n==="function")M(()=>pt(t,e,n()));else pt(t,e,n)}function pe(t,e){for(let n in e){let r=e[n];if(typeof r==="function")M(()=>dt(t,n,r()));else dt(t,n,r)}}function dt(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function pt(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function _(t,e,n=null){if(Array.isArray(e)){for(let r of e)_(t,r,n);return}if(typeof e==="function"){let r=t.insertBefore(W().createComment(""),n);ft(t,e,r,{current:null});return}mt(t,e,null,n)}function ft(t,e,n,r){M(()=>{let i=e();if(typeof i==="function")ft(t,i,n,r);else r.current=mt(t,i,r.current,n)})}function mt(t,e,n,r){if(n!==null&&n.length===1&&ae(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let i=fe(e);return gt(t,n??[],i,r),i.length>0?i:null}function gt(t,e,n,r){if(e.length>0){let a=new Set(n);for(let s of e)if(!a.has(s)&&s.parentNode===t)t.removeChild(s)}let i=r;for(let a=n.length-1;a>=0;a--){let s=n[a];if(s.parentNode!==t||s.nextSibling!==i)t.insertBefore(s,i);i=s}}function fe(t){let e=[];return U(e,t),e}function U(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)U(t,n);return}if(se(e)){t.push(e);return}if(typeof e==="function"){U(t,e());return}t.push(W().createTextNode(String(e)))}function G(t,e){let n;return I((r)=>{n=r,_(e,t())}),()=>{n(),e.textContent=""}}function ht(t,e){let n=[],r=[],i=[];return P(()=>{for(let a of i)a()}),()=>{let a=t(),s=a.length,c=Array(s),u=Array(s),f=new Map;for(let d=0;d<n.length;d++){let y=f.get(n[d]);if(y)y.push(d);else f.set(n[d],[d])}let T=Array(n.length).fill(!1);for(let d=0;d<s;d++){let y=a[d],A=f.get(y);if(A!==void 0&&A.length>0){let w=A.shift();T[w]=!0,c[d]=r[w],u[d]=i[w]}else{let w,q=I((N)=>(w=e(y,d),N));c[d]=w,u[d]=q}}for(let d=0;d<i.length;d++)if(!T[d])i[d]();return n=a.slice(),r=c,i=u,c}}function g(t){let e=V(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function Z(t){let e=ht(()=>t.each()??[],(n,r)=>t.children(n,r));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var he=/^@(media|supports|container|document|layer)\b/i;function h(t,...e){let n=typeof t==="string"?t:t.reduce((a,s,c)=>a+s+(c<e.length?String(e[c]):""),""),r=Ae(n),i="k-"+r;return we(r,tt(n,"."+i)),i}function xe(t){let e=[],n="",r=0,i="",a="",s="";for(let c=0;c<t.length;c++){let u=t[c];if(u==="{"){if(r===0){let f=i.lastIndexOf(";");n+=i.slice(0,f+1),s=i.slice(f+1),i="",a=""}else a+=u;r++}else if(u==="}")if(r--,r===0)e.push({prelude:s,inner:a});else if(r>0)a+=u;else r=0;else if(r===0)i+=u;else a+=u}return n+=i,{decls:n,blocks:e}}function tt(t,e){let{decls:n,blocks:r}=xe(t),i="",a=n.trim();if(a)i+=`${e}{${a}}`;for(let{prelude:s,inner:c}of r){let u=s.trim();if(u[0]==="@")i+=he.test(u)?`${u}{${tt(c,e)}}`:`${u}{${c.trim()}}`;else i+=tt(c,be(u,e))}return i}function be(t,e){return ve(t,",").map((n)=>{let r=n.trim();return r.includes("&")?r.replace(/&/g,e):`${e} ${r}`}).join(",")}function ve(t,e){let n=[],r=0,i="";for(let a=0;a<t.length;a++){let s=t[a];if(s==="("||s==="[")r++;else if(s===")"||s==="]")r--;if(s===e&&r===0)n.push(i),i="";else i+=s}return n.push(i),n}var xt=new Map;function we(t,e){let n=globalThis.document;if(!n){if(!xt.has(t))xt.set(t,e);return}ye(n,t,e)}function ye(t,e,n){let r=t.head;for(let a of r.childNodes)if(a.nodeType===1&&a.getAttribute("data-k")===e)return;let i=t.createElement("style");i.setAttribute("data-k",e),i.textContent=n,r.appendChild(i)}function Ae(t){let e=5381,n=2166136261;for(let r=0;r<t.length;r++){let i=t.charCodeAt(r);e=(e<<5)+e^i,n=Math.imul(n^i,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}var et=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function bt(t,e){let n=await fetch(et+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),r=await n.json().catch(()=>({}));if(!n.ok)throw Error(r.message??`${n.status}`);return r}var vt=(t)=>bt("/api/ask",{question:t}),wt=(t)=>bt(`/api/faq/${encodeURIComponent(t)}`);var yt=h`
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
`,nt=h`
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
`,At=h`
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
`,Tt=h`
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
`,kt=h`
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
`,Et=h`
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
`,Mt=h`
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: -10px 0 16px;
`,St=h`
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin: -8px 0 16px;
`,Ht=h`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,Lt=h`
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
`,Ct=h`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function Rt(t,e,n){if(typeof t==="function")return t(e??{});return Q(t,e??null)}function o(t,e,n,r,i,a){return Rt(t,e,n)}var ke={idle:"ビットコインのこと、なんでも聞いてください。",listening:"どうぞ、お話しください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。",multiple:"いっぺんに聞かれると目が回ります……ひとつずつどうぞ。"},Ee=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function Nt(t){return o("div",{class:()=>`${kt} ${t.mood()}`,children:[o("p",{class:"bubble","aria-live":"polite",children:()=>ke[t.mood()]},void 0,!1,void 0,this),o("div",{class:"drawing",ref:(e)=>e.innerHTML=Ee},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var rt="jev-bitcoin:history",Me=50,Pt=60000;function Se(){try{let t=localStorage.getItem(rt),e=t===null?[]:JSON.parse(t);return Array.isArray(e)?e.filter((n)=>typeof n?.q==="string"):[]}catch{return[]}}function It(t){try{localStorage.setItem(rt,JSON.stringify(t))}catch{}}var S=b(Se());function Dt(t,e,n,r){let i=Date.now();S.update((a)=>{let s=a[0],c=s!==void 0&&i-s.at<Pt&&(t.startsWith(s.q)||s.q.startsWith(t)),f=[{q:t,at:i,id:n,title:r,status:e},...c?a.slice(1):a].slice(0,Me);return It(f),f})}function Ot(t,e){S.update((n)=>{let r=n[0];if(r===void 0||r.status!=="suggest"||r.id!==void 0)return n;if(Date.now()-r.at>Pt*5)return n;let i=[{...r,id:t,title:e},...n.slice(1)];return It(i),i})}function qt(){S.set([]);try{localStorage.removeItem(rt)}catch{}}var He={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function zt(t){return o("div",{class:"prose",children:t.lines.map((e)=>o("p",{children:e},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function Ft(t){let e=t.entry,n=e.more??[],r=e.related??[],i=e.sources??[],a=(e.tags??[]).map((s)=>He[s]).filter((s)=>s!==void 0);return o("div",{class:At,children:[o("p",{class:"meta",children:[o("span",{children:e.category.name},void 0,!1,void 0,this),o("a",{href:`#${e.id}`,title:"この答えへのリンク",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("h3",{children:e.title},void 0,!1,void 0,this),o(g,{when:()=>e.answered,fallback:o("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:o(zt,{lines:e.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(g,{when:()=>n.length>0,children:o("details",{open:t.expand===!0,children:[o("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),o(zt,{lines:n},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(g,{when:()=>r.length>0,children:o("div",{class:"related",children:[o("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),r.map((s)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(s.id),children:s.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(g,{when:()=>a.length>0,children:o("ul",{class:"notes",children:a.map((s)=>o("li",{children:s},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(g,{when:()=>i.length>0||e.updated!==void 0,children:o("div",{class:"sources",children:[i.map((s)=>/^https?:\/\//.test(s)?o("a",{href:s,target:"_blank",rel:"noopener noreferrer",children:s},void 0,!1,void 0,this):o("span",{children:s},void 0,!1,void 0,this)),o(g,{when:()=>e.updated!==void 0,children:o("span",{class:"updated",children:`${e.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function _t(t){return o("div",{class:Tt,children:[o("span",{class:"label",children:t.label},void 0,!1,void 0,this),t.items.map((e)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(e.id),children:e.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}function Le(t){if(t.title!==void 0)return`→ ${t.title}`;if(t.status==="multiple")return"→ 質問がいくつか入っていました";if(t.status==="suggest")return"→ 近い質問がありました";return"→ 答えは見つかりませんでした"}function Ce(t){let e=new Date(t),n=`${e.getHours()}:${String(e.getMinutes()).padStart(2,"0")}`;return e.toDateString()===new Date().toDateString()?n:`${e.getMonth()+1}/${e.getDate()} ${n}`}function $t(t){return o(g,{when:()=>S().length>0,children:o("details",{class:Lt,children:[o("summary",{children:()=>`これまでの質問（${S().length}）`},void 0,!1,void 0,this),o("ol",{children:o(Z,{each:S,children:(e)=>o("li",{children:[o("button",{type:"button",onClick:()=>t.again(e.q,e.id),children:[o("span",{class:"q",children:e.q},void 0,!1,void 0,this),o("span",{class:"a",children:Le(e)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("span",{class:"at",children:Ce(e.at)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("p",{class:"foot",children:[o("span",{children:"履歴はこのブラウザの中にだけ保存されています。"},void 0,!1,void 0,this),o("button",{type:"button",class:"clear",onClick:()=>qt(),children:"履歴を消す"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)}function jt(){let t=window;return t.SpeechRecognition??t.webkitSpeechRecognition}var Jt=jt()!==void 0,Re={"not-allowed":"マイクの使用が許可されていません。ブラウザの設定で、このページのマイクを許可してください。","service-not-allowed":"このブラウザでは音声入力を使えないようです。","audio-capture":"マイクが見つかりませんでした。","no-speech":"声が聞き取れませんでした。もう一度どうぞ。",network:"音声認識のサービスに接続できませんでした。","language-not-supported":"このブラウザは日本語の音声入力に対応していないようです。"};function Bt(t){let e=jt();if(e===void 0)return t.error("このブラウザは音声入力に対応していません。"),t.end(),{stop(){}};let n=new e;n.lang="ja-JP",n.interimResults=!0,n.continuous=!1,n.maxAlternatives=1;let r="",i=!1;n.onresult=(a)=>{let s="",c=!1;for(let u=0;u<a.results.length;u++){let f=a.results[u];if(f===void 0)continue;s+=f[0].transcript,c=c||f.isFinal}if(r=s.trim(),c)i=!0,t.final(r);else t.interim(r)},n.onerror=(a)=>{if(a.error==="aborted")return;t.error(Re[a.error]??"音声入力でエラーが起きました。")},n.onend=()=>{if(!i&&r!=="")t.final(r);t.end()};try{n.start()}catch{t.error("音声入力を始められませんでした。"),t.end()}return{stop:()=>n.stop()}}var Xt=500,D=5,J=(t)=>[...t].length,O=(t)=>t.trim().replace(/\s+/g," "),Pe=/^[1-9][0-9]*-[1-9][0-9]*$/,Ie=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="3" width="6" height="11" rx="3" />
  <path d="M5 11a7 7 0 0 0 14 0" />
  <path d="M12 18v3" />
</svg>`;function Kt(){let t=b(""),e=b(null),n=b(!1),r=b(""),i=b(!1),a=b(!1),s=null,c,u=!1,f="",T=0,d=()=>{if(n())return"thinking";if(i())return"listening";let l=e();if(l===null)return r()===""?"idle":"miss";return l.status},y=async(l,p)=>{let x=++T;n.set(!0),r.set("");try{let H=await l();if(x===T)e.set(H),p?.(H)}catch(H){if(x===T)r.set(H instanceof Error?H.message:String(H))}finally{if(x===T)n.set(!1)}},A=(l)=>{let p=O(l);if(J(p)<D||p===f)return;f=p,y(()=>vt(p),(x)=>Dt(p,x.status,x.answer?.id,x.answer?.title))},w=()=>{if(clearTimeout(c),a.set(!1),u)return;let l=t.peek(),p=J(O(l));if(p>=D)c=setTimeout(()=>A(l),Xt);else if(p>0)c=setTimeout(()=>a.set(!0),Xt)},q=(l,p)=>{clearTimeout(c),y(async()=>({status:"answer",answer:await wt(l),categories:[]}),(x)=>{if(p&&x.answer!==void 0)Ot(x.answer.id,x.answer.title)})},N=(l)=>q(l,!1),Vt=(l)=>q(l,!0),Ut=(l,p)=>{if(t.set(l),p!==void 0){f=O(l),N(p);return}f="",clearTimeout(c),A(l)},Wt=()=>{if(s!==null){s.stop();return}clearTimeout(c),r.set(""),i.set(!0),s=Bt({interim:(l)=>t.set(l),final:(l)=>{if(t.set(l),J(O(l))>=D)f="",A(l);else a.set(!0)},error:(l)=>r.set(l),end:()=>{s=null,i.set(!1)}})},B=()=>{let l=decodeURIComponent(location.hash.replace(/^#/,""));if(Pe.test(l))N(l)};return B(),window.addEventListener("hashchange",B),P(()=>{window.removeEventListener("hashchange",B),clearTimeout(c),s?.stop()}),M(()=>{let l=e();document.title=l?.answer!==void 0?`${l.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),o("div",{children:[o(Nt,{mood:d},void 0,!1,void 0,this),o("form",{class:Et,onSubmit:(l)=>{l.preventDefault(),clearTimeout(c);let p=t.peek();a.set(J(O(p))<D),A(p)},children:[o("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:()=>i()?"聞いています……":"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:t,ref:(l)=>{if(!window.matchMedia("(pointer: coarse)").matches)l.focus()},onInput:(l)=>{s?.stop(),t.set(l.target.value),w()},onCompositionstart:()=>{u=!0,clearTimeout(c),a.set(!1)},onCompositionend:()=>{u=!1,w()}},void 0,!1,void 0,this),Jt?o("button",{type:"button",class:()=>`mic ${i()?"on":""}`,"aria-label":()=>i()?"音声入力を止める":"声で質問する","aria-pressed":()=>i()?"true":"false",title:()=>i()?"音声入力を止める":"声で質問する",onClick:Wt,ref:(l)=>l.innerHTML=Ie},void 0,!1,void 0,this):null]},void 0,!0,void 0,this),o(g,{when:i,children:o("p",{class:Mt,children:"話し終えると、そのまま質問します。音声の認識はブラウザの機能で行います（Chrome などでは音声がブラウザ提供元のサーバで処理されます）。"},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(g,{when:a,children:o("p",{class:St,children:[D,"文字以上入力してください"]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(g,{when:()=>r()!=="",children:o("p",{class:Ct,children:r},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("div",{class:()=>`${Ht} ${n()?"stale":""}`,children:()=>{let l=e();if(l===null)return null;return o("div",{children:[l.answer!==void 0?o("div",{class:nt,children:o(Ft,{entry:l.answer,expand:l.expand,open:N},void 0,!1,void 0,this)},void 0,!1,void 0,this):null,(l.message??[]).length>0&&l.status!=="suggest"?o("div",{class:`${nt} message`,children:(l.message??[]).map((p)=>o("p",{children:p},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,(l.suggestions??[]).length>0?o(_t,{label:l.status==="multiple"?"近い質問":"もしかして",items:l.suggestions??[],open:Vt},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this),o($t,{again:Ut},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function De(){return o("main",{class:yt,children:[o(Kt,{},void 0,!1,void 0,this),o("footer",{children:["答えはあらかじめ用意したもので、その場で文章を作ることはしません。質問の読み取りに ",o("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",o("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",o("span",{children:et},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var Yt=document.getElementById("app");if(Yt)G(()=>o(De,{},void 0,!1,void 0,this),Yt);

//# debugId=2A65479A794384D664756E2164756E21
//# sourceMappingURL=chunk-90w7zpvh.js.map
