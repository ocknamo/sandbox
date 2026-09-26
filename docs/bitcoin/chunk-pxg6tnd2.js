var Vt=!1,ot=new Set,Ut=(t)=>console.warn(t),Wt=Ut,Qt="kanabun [dev]: ";function Gt(){return Vt||globalThis.__KANABUN_DEV__===!0}function A(t){if(!Gt())return;if(ot.has(t))return;ot.add(t),Wt(Qt+t)}var H=0,it=1,L=2,T=3,v=null,g=null,B=0,J=!1,D=[],Zt=1e6,O=(t,e)=>t===e,te=()=>!1;function lt(t){if(!t||t.equals===void 0)return O;if(t.equals===!1)return te;return t.equals}class C{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,r){if(this.equals=n,this.isEffect=e,r){if(this.fn=t,this.value=void 0,this.color=L,g!==null)(g.owned??=[]).push(this),this.owner=g}else this.fn=null,this.value=t,this.color=H}read(){if(this.color===T)return this.value;if(v!==null)(v.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(v!==null&&!v.isEffect)A("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(L)}markStale(t){if(this.color>=t)return;let e=this.color===H;if(this.color=t,e&&this.isEffect)ct(this);if(this.observers!==null)for(let n of this.observers)n.markStale(it)}updateIfNecessary(){if(this.color===H||this.color===T)return;if(this.color===it&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===L)break}if(this.color===L)this.update();this.color=H}update(){this.cleanNode();let t=v,e=g;v=this,g=this,this.collecting=[];let n,r,o=!1;try{n=this.fn()}catch(s){o=!0,r=s}finally{v=t,g=e}if(o){this.collecting=null,this.color=H,ne(r,this.owner);return}this.reconcileSources();let a=!this.equals(this.value,n);if(this.value=n,this.color=H,a&&this.observers!==null){for(let s of this.observers)if(s.color!==T&&s.color<L)s.color=L}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))st(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))ee(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===T)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)st(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=T}}function ee(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function st(t,e){let n=t.observers;if(n===null)return;let r=n.indexOf(e);if(r===-1)return;if(n[r]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function ct(t){D.push(t)}function X(){if(J)return;J=!0;let t=0,e=0;try{while(t<D.length){if(++e>Zt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=D[t++];if(n.color!==T)n.updateIfNecessary()}}finally{D.length=0,J=!1}}function ut(t,e){let n=g,r=v;g=t,v=null;try{return e()}finally{g=n,v=r}}function w(t,e){let n=new C(t,!1,lt(e),!1),r=()=>n.read(),o=r;return o.set=(a)=>{if(n.write(a),B===0)X()},o.update=(a)=>{if(n.write(a(n.value)),B===0)X()},o.peek=()=>n.value,r}function K(t,e){let n=new C(t,!1,lt(e),!0);return()=>n.read()}function k(t){if(g===null)A("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new C(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,O,!0);if(ct(e),B===0)X();return()=>e.dispose()}var at=Symbol("error-handler");function ne(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&at in n.context){n.context[at](t);return}throw t}function N(t){if(g===null){A("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(g.cleanups??=[]).push(t)}function P(t){let e=new C(void 0,!1,O,!1);return e.owner=g,ut(e,()=>t(()=>e.dispose()))}function V(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function re(t){return t!=null&&typeof t.nodeType==="number"}function oe(t){return t.nodeType===3}var ie=new Set(["script","style"]);function U(t,e){let n=V().createElement(t);if(e!==null){for(let r in e){if(r==="children"||r==="ref")continue;le(n,r,e[r])}if(e.ref!==void 0)ae(e.ref,n);if("children"in e)se(t,e.children),q(n,e.children)}return n}function se(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!ie.has(t.toLowerCase()))return;A(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function ae(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function le(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){ce(t,n);return}if(typeof n==="function")k(()=>pt(t,e,n()));else pt(t,e,n)}function ce(t,e){for(let n in e){let r=e[n];if(typeof r==="function")k(()=>dt(t,n,r()));else dt(t,n,r)}}function dt(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function pt(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function q(t,e,n=null){if(Array.isArray(e)){for(let r of e)q(t,r,n);return}if(typeof e==="function"){let r=t.insertBefore(V().createComment(""),n);ft(t,e,r,{current:null});return}gt(t,e,null,n)}function ft(t,e,n,r){k(()=>{let o=e();if(typeof o==="function")ft(t,o,n,r);else r.current=gt(t,o,r.current,n)})}function gt(t,e,n,r){if(n!==null&&n.length===1&&oe(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let o=ue(e);return mt(t,n??[],o,r),o.length>0?o:null}function mt(t,e,n,r){if(e.length>0){let a=new Set(n);for(let s of e)if(!a.has(s)&&s.parentNode===t)t.removeChild(s)}let o=r;for(let a=n.length-1;a>=0;a--){let s=n[a];if(s.parentNode!==t||s.nextSibling!==o)t.insertBefore(s,o);o=s}}function ue(t){let e=[];return Y(e,t),e}function Y(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)Y(t,n);return}if(re(e)){t.push(e);return}if(typeof e==="function"){Y(t,e());return}t.push(V().createTextNode(String(e)))}function W(t,e){let n;return P((r)=>{n=r,q(e,t())}),()=>{n(),e.textContent=""}}function ht(t,e){let n=[],r=[],o=[];return N(()=>{for(let a of o)a()}),()=>{let a=t(),s=a.length,u=Array(s),c=Array(s),p=new Map;for(let d=0;d<n.length;d++){let b=p.get(n[d]);if(b)b.push(d);else p.set(n[d],[d])}let I=Array(n.length).fill(!1);for(let d=0;d<s;d++){let b=a[d],M=p.get(b);if(M!==void 0&&M.length>0){let y=M.shift();I[y]=!0,u[d]=r[y],c[d]=o[y]}else{let y,R=P((_)=>(y=e(b,d),_));u[d]=y,c[d]=R}}for(let d=0;d<o.length;d++)if(!I[d])o[d]();return n=a.slice(),r=u,o=c,u}}function h(t){let e=K(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function Q(t){let e=ht(()=>t.each()??[],(n,r)=>t.children(n,r));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var fe=/^@(media|supports|container|document|layer)\b/i;function x(t,...e){let n=typeof t==="string"?t:t.reduce((a,s,u)=>a+s+(u<e.length?String(e[u]):""),""),r=ve(n),o="k-"+r;return xe(r,G(n,"."+o)),o}function ge(t){let e=[],n="",r=0,o="",a="",s="";for(let u=0;u<t.length;u++){let c=t[u];if(c==="{"){if(r===0){let p=o.lastIndexOf(";");n+=o.slice(0,p+1),s=o.slice(p+1),o="",a=""}else a+=c;r++}else if(c==="}")if(r--,r===0)e.push({prelude:s,inner:a});else if(r>0)a+=c;else r=0;else if(r===0)o+=c;else a+=c}return n+=o,{decls:n,blocks:e}}function G(t,e){let{decls:n,blocks:r}=ge(t),o="",a=n.trim();if(a)o+=`${e}{${a}}`;for(let{prelude:s,inner:u}of r){let c=s.trim();if(c[0]==="@")o+=fe.test(c)?`${c}{${G(u,e)}}`:`${c}{${u.trim()}}`;else o+=G(u,me(c,e))}return o}function me(t,e){return he(t,",").map((n)=>{let r=n.trim();return r.includes("&")?r.replace(/&/g,e):`${e} ${r}`}).join(",")}function he(t,e){let n=[],r=0,o="";for(let a=0;a<t.length;a++){let s=t[a];if(s==="("||s==="[")r++;else if(s===")"||s==="]")r--;if(s===e&&r===0)n.push(o),o="";else o+=s}return n.push(o),n}var xt=new Map;function xe(t,e){let n=globalThis.document;if(!n){if(!xt.has(t))xt.set(t,e);return}be(n,t,e)}function be(t,e,n){let r=t.head;for(let a of r.childNodes)if(a.nodeType===1&&a.getAttribute("data-k")===e)return;let o=t.createElement("style");o.setAttribute("data-k",e),o.textContent=n,r.appendChild(o)}function ve(t){let e=5381,n=2166136261;for(let r=0;r<t.length;r++){let o=t.charCodeAt(r);e=(e<<5)+e^o,n=Math.imul(n^o,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}var Z=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function bt(t,e){let n=await fetch(Z+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),r=await n.json().catch(()=>({}));if(!n.ok)throw Error(r.message??`${n.status}`);return r}var vt=(t)=>bt("/api/ask",{question:t}),wt=(t)=>bt(`/api/faq/${encodeURIComponent(t)}`);var yt=x`
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
`,tt=x`
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
`,At=x`
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
`,Tt=x`
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
`,kt=x`
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
`,Et=x`
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
`,Mt=x`
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: -10px 0 16px;
`,St=x`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,Ht=x`
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
`,Lt=x`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function Ct(t,e,n){if(typeof t==="function")return t(e??{});return U(t,e??null)}function i(t,e,n,r,o,a){return Ct(t,e,n)}var ye={idle:"ビットコインのこと、なんでも聞いてください。",listening:"どうぞ、お話しください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。",multiple:"いっぺんに聞かれると目が回ります……ひとつずつどうぞ。"},Ae=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function Rt(t){return i("div",{class:()=>`${kt} ${t.mood()}`,children:[i("p",{class:"bubble","aria-live":"polite",children:()=>ye[t.mood()]},void 0,!1,void 0,this),i("div",{class:"drawing",ref:(e)=>e.innerHTML=Ae},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var et="jev-bitcoin:history",Te=50,Nt=60000;function ke(){try{let t=localStorage.getItem(et),e=t===null?[]:JSON.parse(t);return Array.isArray(e)?e.filter((n)=>typeof n?.q==="string"):[]}catch{return[]}}function Pt(t){try{localStorage.setItem(et,JSON.stringify(t))}catch{}}var E=w(ke());function It(t,e,n,r){let o=Date.now();E.update((a)=>{let s=a[0],u=s!==void 0&&o-s.at<Nt&&(t.startsWith(s.q)||s.q.startsWith(t)),p=[{q:t,at:o,id:n,title:r,status:e},...u?a.slice(1):a].slice(0,Te);return Pt(p),p})}function Dt(t,e){E.update((n)=>{let r=n[0];if(r===void 0||r.status!=="suggest"||r.id!==void 0)return n;if(Date.now()-r.at>Nt*5)return n;let o=[{...r,id:t,title:e},...n.slice(1)];return Pt(o),o})}function Ot(){E.set([]);try{localStorage.removeItem(et)}catch{}}var Ee={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function qt(t){return i("div",{class:"prose",children:t.lines.map((e)=>i("p",{children:e},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function zt(t){let e=t.entry,n=e.more??[],r=e.related??[],o=e.sources??[],a=(e.tags??[]).map((s)=>Ee[s]).filter((s)=>s!==void 0);return i("div",{class:At,children:[i("p",{class:"meta",children:[i("span",{children:e.category.name},void 0,!1,void 0,this),i("a",{href:`#${e.id}`,title:"この答えへのリンク",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),i("h3",{children:e.title},void 0,!1,void 0,this),i(h,{when:()=>e.answered,fallback:i("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:i(qt,{lines:e.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),i(h,{when:()=>n.length>0,children:i("details",{open:t.expand===!0,children:[i("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),i(qt,{lines:n},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),i(h,{when:()=>r.length>0,children:i("div",{class:"related",children:[i("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),r.map((s)=>i("button",{type:"button",class:"chip",onClick:()=>t.open(s.id),children:s.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),i(h,{when:()=>a.length>0,children:i("ul",{class:"notes",children:a.map((s)=>i("li",{children:s},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),i(h,{when:()=>o.length>0||e.updated!==void 0,children:i("div",{class:"sources",children:[o.map((s)=>/^https?:\/\//.test(s)?i("a",{href:s,target:"_blank",rel:"noopener noreferrer",children:s},void 0,!1,void 0,this):i("span",{children:s},void 0,!1,void 0,this)),i(h,{when:()=>e.updated!==void 0,children:i("span",{class:"updated",children:`${e.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Ft(t){return i("div",{class:Tt,children:[i("span",{class:"label",children:t.label},void 0,!1,void 0,this),t.items.map((e)=>i("button",{type:"button",class:"chip",onClick:()=>t.open(e.id),children:e.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}function Me(t){if(t.title!==void 0)return`→ ${t.title}`;if(t.status==="multiple")return"→ 質問がいくつか入っていました";if(t.status==="suggest")return"→ 近い質問がありました";return"→ 答えは見つかりませんでした"}function Se(t){let e=new Date(t),n=`${e.getHours()}:${String(e.getMinutes()).padStart(2,"0")}`;return e.toDateString()===new Date().toDateString()?n:`${e.getMonth()+1}/${e.getDate()} ${n}`}function _t(t){return i(h,{when:()=>E().length>0,children:i("details",{class:Ht,children:[i("summary",{children:()=>`これまでの質問（${E().length}）`},void 0,!1,void 0,this),i("ol",{children:i(Q,{each:E,children:(e)=>i("li",{children:[i("button",{type:"button",onClick:()=>t.again(e.q,e.id),children:[i("span",{class:"q",children:e.q},void 0,!1,void 0,this),i("span",{class:"a",children:Me(e)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),i("span",{class:"at",children:Se(e.at)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),i("p",{class:"foot",children:[i("span",{children:"履歴はこのブラウザの中にだけ保存されています。"},void 0,!1,void 0,this),i("button",{type:"button",class:"clear",onClick:()=>Ot(),children:"履歴を消す"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)}function $t(){let t=window;return t.SpeechRecognition??t.webkitSpeechRecognition}var jt=$t()!==void 0,He={"not-allowed":"マイクの使用が許可されていません。ブラウザの設定で、このページのマイクを許可してください。","service-not-allowed":"このブラウザでは音声入力を使えないようです。","audio-capture":"マイクが見つかりませんでした。","no-speech":"声が聞き取れませんでした。もう一度どうぞ。",network:"音声認識のサービスに接続できませんでした。","language-not-supported":"このブラウザは日本語の音声入力に対応していないようです。"};function Jt(t){let e=$t();if(e===void 0)return t.error("このブラウザは音声入力に対応していません。"),t.end(),{stop(){}};let n=new e;n.lang="ja-JP",n.interimResults=!0,n.continuous=!1,n.maxAlternatives=1;let r="",o=!1;n.onresult=(a)=>{let s="",u=!1;for(let c=0;c<a.results.length;c++){let p=a.results[c];if(p===void 0)continue;s+=p[0].transcript,u=u||p.isFinal}if(r=s.trim(),u)o=!0,t.final(r);else t.interim(r)},n.onerror=(a)=>{if(a.error==="aborted")return;t.error(He[a.error]??"音声入力でエラーが起きました。")},n.onend=()=>{if(!o&&r!=="")t.final(r);t.end()};try{n.start()}catch{t.error("音声入力を始められませんでした。"),t.end()}return{stop:()=>n.stop()}}var Ce=500,nt=5,rt=(t)=>[...t].length,F=(t)=>t.trim().replace(/\s+/g," "),Re=/^[1-9][0-9]*-[1-9][0-9]*$/,Ne=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="3" width="6" height="11" rx="3" />
  <path d="M5 11a7 7 0 0 0 14 0" />
  <path d="M12 18v3" />
</svg>`;function Bt(){let t=w(""),e=w(null),n=w(!1),r=w(""),o=w(!1),a=null,s,u=!1,c="",p=0,I=()=>{if(n())return"thinking";if(o())return"listening";let l=e();if(l===null)return r()===""?"idle":"miss";return l.status},d=async(l,f)=>{let m=++p;n.set(!0),r.set("");try{let S=await l();if(m===p)e.set(S),f?.(S)}catch(S){if(m===p)r.set(S instanceof Error?S.message:String(S))}finally{if(m===p)n.set(!1)}},b=(l)=>{let f=F(l);if(rt(f)<nt||f===c)return;c=f,d(()=>vt(f),(m)=>It(f,m.status,m.answer?.id,m.answer?.title))},M=()=>{if(clearTimeout(s),u)return;let l=t.peek();if(rt(F(l))>=nt)s=setTimeout(()=>b(l),Ce)},y=(l,f)=>{clearTimeout(s),d(async()=>({status:"answer",answer:await wt(l),categories:[]}),(m)=>{if(f&&m.answer!==void 0)Dt(m.answer.id,m.answer.title)})},R=(l)=>y(l,!1),_=(l)=>y(l,!0),Kt=(l,f)=>{if(t.set(l),f!==void 0){c=F(l),R(f);return}c="",clearTimeout(s),b(l)},Yt=()=>{if(a!==null){a.stop();return}clearTimeout(s),r.set(""),o.set(!0),a=Jt({interim:(l)=>t.set(l),final:(l)=>{if(t.set(l),rt(F(l))>=nt)c="",b(l)},error:(l)=>r.set(l),end:()=>{a=null,o.set(!1)}})},j=()=>{let l=decodeURIComponent(location.hash.replace(/^#/,""));if(Re.test(l))R(l)};return j(),window.addEventListener("hashchange",j),N(()=>{window.removeEventListener("hashchange",j),clearTimeout(s),a?.stop()}),k(()=>{let l=e();document.title=l?.answer!==void 0?`${l.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),i("div",{children:[i(Rt,{mood:I},void 0,!1,void 0,this),i("form",{class:Et,onSubmit:(l)=>{l.preventDefault(),clearTimeout(s),b(t.peek())},children:[i("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:()=>o()?"聞いています……":"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:t,ref:(l)=>{if(!window.matchMedia("(pointer: coarse)").matches)l.focus()},onInput:(l)=>{a?.stop(),t.set(l.target.value),M()},onCompositionstart:()=>{u=!0,clearTimeout(s)},onCompositionend:()=>{u=!1,M()}},void 0,!1,void 0,this),jt?i("button",{type:"button",class:()=>`mic ${o()?"on":""}`,"aria-label":()=>o()?"音声入力を止める":"声で質問する","aria-pressed":()=>o()?"true":"false",title:()=>o()?"音声入力を止める":"声で質問する",onClick:Yt,ref:(l)=>l.innerHTML=Ne},void 0,!1,void 0,this):null]},void 0,!0,void 0,this),i(h,{when:o,children:i("p",{class:Mt,children:"話し終えると、そのまま質問します。音声の認識はブラウザの機能で行います（Chrome などでは音声がブラウザ提供元のサーバで処理されます）。"},void 0,!1,void 0,this)},void 0,!1,void 0,this),i(h,{when:()=>r()!=="",children:i("p",{class:Lt,children:r},void 0,!1,void 0,this)},void 0,!1,void 0,this),i("div",{class:()=>`${St} ${n()?"stale":""}`,children:()=>{let l=e();if(l===null)return null;return i("div",{children:[l.answer!==void 0?i("div",{class:tt,children:i(zt,{entry:l.answer,expand:l.expand,open:R},void 0,!1,void 0,this)},void 0,!1,void 0,this):null,(l.message??[]).length>0&&l.status!=="suggest"?i("div",{class:`${tt} message`,children:(l.message??[]).map((f)=>i("p",{children:f},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,(l.suggestions??[]).length>0?i(Ft,{label:l.status==="multiple"?"近い質問":"もしかして",items:l.suggestions??[],open:_},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this),i(_t,{again:Kt},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Pe(){return i("main",{class:yt,children:[i(Bt,{},void 0,!1,void 0,this),i("footer",{children:["答えはあらかじめ用意したもので、その場で文章を作ることはしません。質問の読み取りに ",i("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",i("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",i("span",{children:Z},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var Xt=document.getElementById("app");if(Xt)W(()=>i(Pe,{},void 0,!1,void 0,this),Xt);

//# debugId=1614FEB4E2CEEFDA64756E2164756E21
//# sourceMappingURL=chunk-pxg6tnd2.js.map
