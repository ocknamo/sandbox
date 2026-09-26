var $t=!1,et=new Set,jt=(t)=>console.warn(t),Jt=jt,Xt="kanabun [dev]: ";function Bt(){return $t||globalThis.__KANABUN_DEV__===!0}function T(t){if(!Bt())return;if(et.has(t))return;et.add(t),Jt(Xt+t)}var L=0,nt=1,C=2,k=3,b=null,f=null,j=0,_=!1,D=[],Kt=1e6,O=(t,e)=>t===e,Vt=()=>!1;function st(t){if(!t||t.equals===void 0)return O;if(t.equals===!1)return Vt;return t.equals}class R{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,r){if(this.equals=n,this.isEffect=e,r){if(this.fn=t,this.value=void 0,this.color=C,f!==null)(f.owned??=[]).push(this),this.owner=f}else this.fn=null,this.value=t,this.color=L}read(){if(this.color===k)return this.value;if(b!==null)(b.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(b!==null&&!b.isEffect)T("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(C)}markStale(t){if(this.color>=t)return;let e=this.color===L;if(this.color=t,e&&this.isEffect)it(this);if(this.observers!==null)for(let n of this.observers)n.markStale(nt)}updateIfNecessary(){if(this.color===L||this.color===k)return;if(this.color===nt&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===C)break}if(this.color===C)this.update();this.color=L}update(){this.cleanNode();let t=b,e=f;b=this,f=this,this.collecting=[];let n,r,s=!1;try{n=this.fn()}catch(i){s=!0,r=i}finally{b=t,f=e}if(s){this.collecting=null,this.color=L,Yt(r,this.owner);return}this.reconcileSources();let a=!this.equals(this.value,n);if(this.value=n,this.color=L,a&&this.observers!==null){for(let i of this.observers)if(i.color!==k&&i.color<C)i.color=C}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))rt(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))Ut(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===k)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)rt(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=k}}function Ut(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function rt(t,e){let n=t.observers;if(n===null)return;let r=n.indexOf(e);if(r===-1)return;if(n[r]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function it(t){D.push(t)}function J(){if(_)return;_=!0;let t=0,e=0;try{while(t<D.length){if(++e>Kt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=D[t++];if(n.color!==k)n.updateIfNecessary()}}finally{D.length=0,_=!1}}function at(t,e){let n=f,r=b;f=t,b=null;try{return e()}finally{f=n,b=r}}function v(t,e){let n=new R(t,!1,st(e),!1),r=()=>n.read(),s=r;return s.set=(a)=>{if(n.write(a),j===0)J()},s.update=(a)=>{if(n.write(a(n.value)),j===0)J()},s.peek=()=>n.value,r}function X(t,e){let n=new R(t,!1,st(e),!0);return()=>n.read()}function E(t){if(f===null)T("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new R(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,O,!0);if(it(e),j===0)J();return()=>e.dispose()}var ot=Symbol("error-handler");function Yt(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&ot in n.context){n.context[ot](t);return}throw t}function P(t){if(f===null){T("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(f.cleanups??=[]).push(t)}function I(t){let e=new R(void 0,!1,O,!1);return e.owner=f,at(e,()=>t(()=>e.dispose()))}function K(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function Wt(t){return t!=null&&typeof t.nodeType==="number"}function Qt(t){return t.nodeType===3}var Gt=new Set(["script","style"]);function V(t,e){let n=K().createElement(t);if(e!==null){for(let r in e){if(r==="children"||r==="ref")continue;ee(n,r,e[r])}if(e.ref!==void 0)te(e.ref,n);if("children"in e)Zt(t,e.children),q(n,e.children)}return n}function Zt(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!Gt.has(t.toLowerCase()))return;T(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function te(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function ee(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){ne(t,n);return}if(typeof n==="function")E(()=>ct(t,e,n()));else ct(t,e,n)}function ne(t,e){for(let n in e){let r=e[n];if(typeof r==="function")E(()=>lt(t,n,r()));else lt(t,n,r)}}function lt(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function ct(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function q(t,e,n=null){if(Array.isArray(e)){for(let r of e)q(t,r,n);return}if(typeof e==="function"){let r=t.insertBefore(K().createComment(""),n);ut(t,e,r,{current:null});return}dt(t,e,null,n)}function ut(t,e,n,r){E(()=>{let s=e();if(typeof s==="function")ut(t,s,n,r);else r.current=dt(t,s,r.current,n)})}function dt(t,e,n,r){if(n!==null&&n.length===1&&Qt(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let s=re(e);return pt(t,n??[],s,r),s.length>0?s:null}function pt(t,e,n,r){if(e.length>0){let a=new Set(n);for(let i of e)if(!a.has(i)&&i.parentNode===t)t.removeChild(i)}let s=r;for(let a=n.length-1;a>=0;a--){let i=n[a];if(i.parentNode!==t||i.nextSibling!==s)t.insertBefore(i,s);s=i}}function re(t){let e=[];return B(e,t),e}function B(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)B(t,n);return}if(Wt(e)){t.push(e);return}if(typeof e==="function"){B(t,e());return}t.push(K().createTextNode(String(e)))}function U(t,e){let n;return I((r)=>{n=r,q(e,t())}),()=>{n(),e.textContent=""}}function ft(t,e){let n=[],r=[],s=[];return P(()=>{for(let a of s)a()}),()=>{let a=t(),i=a.length,u=Array(i),d=Array(i),m=new Map;for(let c=0;c<n.length;c++){let w=m.get(n[c]);if(w)w.push(c);else m.set(n[c],[c])}let H=Array(n.length).fill(!1);for(let c=0;c<i;c++){let w=a[c],A=m.get(w);if(A!==void 0&&A.length>0){let y=A.shift();H[y]=!0,u[c]=r[y],d[c]=s[y]}else{let y,F=I((N)=>(y=e(w,c),N));u[c]=y,d[c]=F}}for(let c=0;c<s.length;c++)if(!H[c])s[c]();return n=a.slice(),r=u,s=d,u}}function h(t){let e=X(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function Y(t){let e=ft(()=>t.each()??[],(n,r)=>t.children(n,r));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var ie=/^@(media|supports|container|document|layer)\b/i;function x(t,...e){let n=typeof t==="string"?t:t.reduce((a,i,u)=>a+i+(u<e.length?String(e[u]):""),""),r=pe(n),s="k-"+r;return ue(r,W(n,"."+s)),s}function ae(t){let e=[],n="",r=0,s="",a="",i="";for(let u=0;u<t.length;u++){let d=t[u];if(d==="{"){if(r===0){let m=s.lastIndexOf(";");n+=s.slice(0,m+1),i=s.slice(m+1),s="",a=""}else a+=d;r++}else if(d==="}")if(r--,r===0)e.push({prelude:i,inner:a});else if(r>0)a+=d;else r=0;else if(r===0)s+=d;else a+=d}return n+=s,{decls:n,blocks:e}}function W(t,e){let{decls:n,blocks:r}=ae(t),s="",a=n.trim();if(a)s+=`${e}{${a}}`;for(let{prelude:i,inner:u}of r){let d=i.trim();if(d[0]==="@")s+=ie.test(d)?`${d}{${W(u,e)}}`:`${d}{${u.trim()}}`;else s+=W(u,le(d,e))}return s}function le(t,e){return ce(t,",").map((n)=>{let r=n.trim();return r.includes("&")?r.replace(/&/g,e):`${e} ${r}`}).join(",")}function ce(t,e){let n=[],r=0,s="";for(let a=0;a<t.length;a++){let i=t[a];if(i==="("||i==="[")r++;else if(i===")"||i==="]")r--;if(i===e&&r===0)n.push(s),s="";else s+=i}return n.push(s),n}var mt=new Map;function ue(t,e){let n=globalThis.document;if(!n){if(!mt.has(t))mt.set(t,e);return}de(n,t,e)}function de(t,e,n){let r=t.head;for(let a of r.childNodes)if(a.nodeType===1&&a.getAttribute("data-k")===e)return;let s=t.createElement("style");s.setAttribute("data-k",e),s.textContent=n,r.appendChild(s)}function pe(t){let e=5381,n=2166136261;for(let r=0;r<t.length;r++){let s=t.charCodeAt(r);e=(e<<5)+e^s,n=Math.imul(n^s,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}var Q=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function gt(t,e){let n=await fetch(Q+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),r=await n.json().catch(()=>({}));if(!n.ok)throw Error(r.message??`${n.status}`);return r}var ht=(t)=>gt("/api/ask",{question:t}),xt=(t)=>gt(`/api/faq/${encodeURIComponent(t)}`);var bt=x`
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
`,G=x`
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
`,vt=x`
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
`,wt=x`
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
`,yt=x`
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
`,At=x`
  margin: 0 0 20px;

  input {
    font: inherit;
    font-size: 17px;
    width: 100%;
    padding: 14px 18px;
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
`,Tt=x`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,kt=x`
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
`,Et=x`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function Mt(t,e,n){if(typeof t==="function")return t(e??{});return V(t,e??null)}function o(t,e,n,r,s,a){return Mt(t,e,n)}var me={idle:"ビットコインのこと、なんでも聞いてください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。",multiple:"いっぺんに聞かれると目が回ります……ひとつずつどうぞ。"},ge=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function Ht(t){return o("div",{class:()=>`${yt} ${t.mood()}`,children:[o("p",{class:"bubble","aria-live":"polite",children:()=>me[t.mood()]},void 0,!1,void 0,this),o("div",{class:"drawing",ref:(e)=>e.innerHTML=ge},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var Z="jev-bitcoin:history",he=50,St=60000;function xe(){try{let t=localStorage.getItem(Z),e=t===null?[]:JSON.parse(t);return Array.isArray(e)?e.filter((n)=>typeof n?.q==="string"):[]}catch{return[]}}function Lt(t){try{localStorage.setItem(Z,JSON.stringify(t))}catch{}}var M=v(xe());function Ct(t,e,n,r){let s=Date.now();M.update((a)=>{let i=a[0],u=i!==void 0&&s-i.at<St&&(t.startsWith(i.q)||i.q.startsWith(t)),m=[{q:t,at:s,id:n,title:r,status:e},...u?a.slice(1):a].slice(0,he);return Lt(m),m})}function Rt(t,e){M.update((n)=>{let r=n[0];if(r===void 0||r.status!=="suggest"||r.id!==void 0)return n;if(Date.now()-r.at>St*5)return n;let s=[{...r,id:t,title:e},...n.slice(1)];return Lt(s),s})}function Nt(){M.set([]);try{localStorage.removeItem(Z)}catch{}}var be={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function Pt(t){return o("div",{class:"prose",children:t.lines.map((e)=>o("p",{children:e},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function It(t){let e=t.entry,n=e.more??[],r=e.related??[],s=e.sources??[],a=(e.tags??[]).map((i)=>be[i]).filter((i)=>i!==void 0);return o("div",{class:vt,children:[o("p",{class:"meta",children:[o("span",{children:e.category.name},void 0,!1,void 0,this),o("a",{href:`#${e.id}`,title:"この答えへのリンク",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("h3",{children:e.title},void 0,!1,void 0,this),o(h,{when:()=>e.answered,fallback:o("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:o(Pt,{lines:e.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(h,{when:()=>n.length>0,children:o("details",{open:t.expand===!0,children:[o("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),o(Pt,{lines:n},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(h,{when:()=>r.length>0,children:o("div",{class:"related",children:[o("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),r.map((i)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(i.id),children:i.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(h,{when:()=>a.length>0,children:o("ul",{class:"notes",children:a.map((i)=>o("li",{children:i},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(h,{when:()=>s.length>0||e.updated!==void 0,children:o("div",{class:"sources",children:[s.map((i)=>/^https?:\/\//.test(i)?o("a",{href:i,target:"_blank",rel:"noopener noreferrer",children:i},void 0,!1,void 0,this):o("span",{children:i},void 0,!1,void 0,this)),o(h,{when:()=>e.updated!==void 0,children:o("span",{class:"updated",children:`${e.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Dt(t){return o("div",{class:wt,children:[o("span",{class:"label",children:t.label},void 0,!1,void 0,this),t.items.map((e)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(e.id),children:e.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}function ve(t){if(t.title!==void 0)return`→ ${t.title}`;if(t.status==="multiple")return"→ 質問がいくつか入っていました";if(t.status==="suggest")return"→ 近い質問がありました";return"→ 答えは見つかりませんでした"}function we(t){let e=new Date(t),n=`${e.getHours()}:${String(e.getMinutes()).padStart(2,"0")}`;return e.toDateString()===new Date().toDateString()?n:`${e.getMonth()+1}/${e.getDate()} ${n}`}function Ot(t){return o(h,{when:()=>M().length>0,children:o("details",{class:kt,children:[o("summary",{children:()=>`これまでの質問（${M().length}）`},void 0,!1,void 0,this),o("ol",{children:o(Y,{each:M,children:(e)=>o("li",{children:[o("button",{type:"button",onClick:()=>t.again(e.q,e.id),children:[o("span",{class:"q",children:e.q},void 0,!1,void 0,this),o("span",{class:"a",children:ve(e)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("span",{class:"at",children:we(e.at)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("p",{class:"foot",children:[o("span",{children:"履歴はこのブラウザの中にだけ保存されています。"},void 0,!1,void 0,this),o("button",{type:"button",class:"clear",onClick:()=>Nt(),children:"履歴を消す"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)}var ye=500,qt=5,zt=(t)=>[...t].length,tt=(t)=>t.trim().replace(/\s+/g," "),Ae=/^[1-9][0-9]*-[1-9][0-9]*$/;function Ft(){let t=v(""),e=v(null),n=v(!1),r=v(""),s,a=!1,i="",u=0,d=()=>{if(n())return"thinking";let l=e();if(l===null)return r()===""?"idle":"miss";return l.status},m=async(l,p)=>{let g=++u;n.set(!0),r.set("");try{let S=await l();if(g===u)e.set(S),p?.(S)}catch(S){if(g===u)r.set(S instanceof Error?S.message:String(S))}finally{if(g===u)n.set(!1)}},H=(l)=>{let p=tt(l);if(zt(p)<qt||p===i)return;i=p,m(()=>ht(p),(g)=>Ct(p,g.status,g.answer?.id,g.answer?.title))},c=()=>{if(clearTimeout(s),a)return;let l=t.peek();if(zt(tt(l))>=qt)s=setTimeout(()=>H(l),ye)},w=(l,p)=>{clearTimeout(s),m(async()=>({status:"answer",answer:await xt(l),categories:[]}),(g)=>{if(p&&g.answer!==void 0)Rt(g.answer.id,g.answer.title)})},A=(l)=>w(l,!1),y=(l)=>w(l,!0),F=(l,p)=>{if(t.set(l),p!==void 0){i=tt(l),A(p);return}i="",clearTimeout(s),H(l)},N=()=>{let l=decodeURIComponent(location.hash.replace(/^#/,""));if(Ae.test(l))A(l)};return N(),window.addEventListener("hashchange",N),P(()=>{window.removeEventListener("hashchange",N),clearTimeout(s)}),E(()=>{let l=e();document.title=l?.answer!==void 0?`${l.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),o("div",{children:[o(Ht,{mood:d},void 0,!1,void 0,this),o("form",{class:At,onSubmit:(l)=>{l.preventDefault(),clearTimeout(s),H(t.peek())},children:o("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:t,ref:(l)=>{if(!window.matchMedia("(pointer: coarse)").matches)l.focus()},onInput:(l)=>{t.set(l.target.value),c()},onCompositionstart:()=>{a=!0,clearTimeout(s)},onCompositionend:()=>{a=!1,c()}},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(h,{when:()=>r()!=="",children:o("p",{class:Et,children:r},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("div",{class:()=>`${Tt} ${n()?"stale":""}`,children:()=>{let l=e();if(l===null)return null;return o("div",{children:[l.answer!==void 0?o("div",{class:G,children:o(It,{entry:l.answer,expand:l.expand,open:A},void 0,!1,void 0,this)},void 0,!1,void 0,this):null,(l.message??[]).length>0&&l.status!=="suggest"?o("div",{class:`${G} message`,children:(l.message??[]).map((p)=>o("p",{children:p},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,(l.suggestions??[]).length>0?o(Dt,{label:l.status==="multiple"?"近い質問":"もしかして",items:l.suggestions??[],open:y},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this),o(Ot,{again:F},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Te(){return o("main",{class:bt,children:[o(Ft,{},void 0,!1,void 0,this),o("footer",{children:["答えはあらかじめ用意したもので、その場で文章を作ることはしません。質問の読み取りに ",o("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",o("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",o("span",{children:Q},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var _t=document.getElementById("app");if(_t)U(()=>o(Te,{},void 0,!1,void 0,this),_t);

//# debugId=924AB0093450CBA164756E2164756E21
//# sourceMappingURL=chunk-f1dwdd7x.js.map
