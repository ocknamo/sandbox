var Me=!1,U=new Set,He=(t)=>console.warn(t),Le=He,Se="kanabun [dev]: ";function Ce(){return Me||globalThis.__KANABUN_DEV__===!0}function h(t){if(!Ce())return;if(U.has(t))return;U.add(t),Le(Se+t)}var w=0,V=1,A=2,b=3,f=null,d=null,P=0,R=!1,k=[],Re=1e6,M=(t,e)=>t===e,Pe=()=>!1;function Q(t){if(!t||t.equals===void 0)return M;if(t.equals===!1)return Pe;return t.equals}class y{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,r){if(this.equals=n,this.isEffect=e,r){if(this.fn=t,this.value=void 0,this.color=A,d!==null)(d.owned??=[]).push(this),this.owner=d}else this.fn=null,this.value=t,this.color=w}read(){if(this.color===b)return this.value;if(f!==null)(f.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(f!==null&&!f.isEffect)h("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(A)}markStale(t){if(this.color>=t)return;let e=this.color===w;if(this.color=t,e&&this.isEffect)G(this);if(this.observers!==null)for(let n of this.observers)n.markStale(V)}updateIfNecessary(){if(this.color===w||this.color===b)return;if(this.color===V&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===A)break}if(this.color===A)this.update();this.color=w}update(){this.cleanNode();let t=f,e=d;f=this,d=this,this.collecting=[];let n,r,i=!1;try{n=this.fn()}catch(s){i=!0,r=s}finally{f=t,d=e}if(i){this.collecting=null,this.color=w,Ie(r,this.owner);return}this.reconcileSources();let a=!this.equals(this.value,n);if(this.value=n,this.color=w,a&&this.observers!==null){for(let s of this.observers)if(s.color!==b&&s.color<A)s.color=A}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))Y(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))Ne(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===b)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)Y(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=b}}function Ne(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function Y(t,e){let n=t.observers;if(n===null)return;let r=n.indexOf(e);if(r===-1)return;if(n[r]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function G(t){k.push(t)}function N(){if(R)return;R=!0;let t=0,e=0;try{while(t<k.length){if(++e>Re)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=k[t++];if(n.color!==b)n.updateIfNecessary()}}finally{k.length=0,R=!1}}function Z(t,e){let n=d,r=f;d=t,f=null;try{return e()}finally{d=n,f=r}}function x(t,e){let n=new y(t,!1,Q(e),!1),r=()=>n.read(),i=r;return i.set=(a)=>{if(n.write(a),P===0)N()},i.update=(a)=>{if(n.write(a(n.value)),P===0)N()},i.peek=()=>n.value,r}function I(t,e){let n=new y(t,!1,Q(e),!0);return()=>n.read()}function v(t){if(d===null)h("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new y(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,M,!0);if(G(e),P===0)N();return()=>e.dispose()}var W=Symbol("error-handler");function Ie(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&W in n.context){n.context[W](t);return}throw t}function O(t){if(d===null){h("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(d.cleanups??=[]).push(t)}function D(t){let e=new y(void 0,!1,M,!1);return e.owner=d,Z(e,()=>t(()=>e.dispose()))}function F(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function Oe(t){return t!=null&&typeof t.nodeType==="number"}function De(t){return t.nodeType===3}var qe=new Set(["script","style"]);function z(t,e){let n=F().createElement(t);if(e!==null){for(let r in e){if(r==="children"||r==="ref")continue;_e(n,r,e[r])}if(e.ref!==void 0)ze(e.ref,n);if("children"in e)Fe(t,e.children),H(n,e.children)}return n}function Fe(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!qe.has(t.toLowerCase()))return;h(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function ze(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function _e(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){Xe(t,n);return}if(typeof n==="function")v(()=>te(t,e,n()));else te(t,e,n)}function Xe(t,e){for(let n in e){let r=e[n];if(typeof r==="function")v(()=>ee(t,n,r()));else ee(t,n,r)}}function ee(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function te(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function H(t,e,n=null){if(Array.isArray(e)){for(let r of e)H(t,r,n);return}if(typeof e==="function"){let r=t.insertBefore(F().createComment(""),n);ne(t,e,r,{current:null});return}re(t,e,null,n)}function ne(t,e,n,r){v(()=>{let i=e();if(typeof i==="function")ne(t,i,n,r);else r.current=re(t,i,r.current,n)})}function re(t,e,n,r){if(n!==null&&n.length===1&&De(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let i=$e(e);return oe(t,n??[],i,r),i.length>0?i:null}function oe(t,e,n,r){if(e.length>0){let a=new Set(n);for(let s of e)if(!a.has(s)&&s.parentNode===t)t.removeChild(s)}let i=r;for(let a=n.length-1;a>=0;a--){let s=n[a];if(s.parentNode!==t||s.nextSibling!==i)t.insertBefore(s,i);i=s}}function $e(t){let e=[];return q(e,t),e}function q(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)q(t,n);return}if(Oe(e)){t.push(e);return}if(typeof e==="function"){q(t,e());return}t.push(F().createTextNode(String(e)))}function _(t,e){let n;return D((r)=>{n=r,H(e,t())}),()=>{n(),e.textContent=""}}function m(t){let e=I(()=>!!t.when());return()=>e()?t.children:t.fallback??null}var Je=/^@(media|supports|container|document|layer)\b/i;function g(t,...e){let n=typeof t==="string"?t:t.reduce((a,s,c)=>a+s+(c<e.length?String(e[c]):""),""),r=Qe(n),i="k-"+r;return Ye(r,X(n,"."+i)),i}function Ke(t){let e=[],n="",r=0,i="",a="",s="";for(let c=0;c<t.length;c++){let u=t[c];if(u==="{"){if(r===0){let T=i.lastIndexOf(";");n+=i.slice(0,T+1),s=i.slice(T+1),i="",a=""}else a+=u;r++}else if(u==="}")if(r--,r===0)e.push({prelude:s,inner:a});else if(r>0)a+=u;else r=0;else if(r===0)i+=u;else a+=u}return n+=i,{decls:n,blocks:e}}function X(t,e){let{decls:n,blocks:r}=Ke(t),i="",a=n.trim();if(a)i+=`${e}{${a}}`;for(let{prelude:s,inner:c}of r){let u=s.trim();if(u[0]==="@")i+=Je.test(u)?`${u}{${X(c,e)}}`:`${u}{${c.trim()}}`;else i+=X(c,Ue(u,e))}return i}function Ue(t,e){return Ve(t,",").map((n)=>{let r=n.trim();return r.includes("&")?r.replace(/&/g,e):`${e} ${r}`}).join(",")}function Ve(t,e){let n=[],r=0,i="";for(let a=0;a<t.length;a++){let s=t[a];if(s==="("||s==="[")r++;else if(s===")"||s==="]")r--;if(s===e&&r===0)n.push(i),i="";else i+=s}return n.push(i),n}var ie=new Map;function Ye(t,e){let n=globalThis.document;if(!n){if(!ie.has(t))ie.set(t,e);return}We(n,t,e)}function We(t,e,n){let r=t.head;for(let a of r.childNodes)if(a.nodeType===1&&a.getAttribute("data-k")===e)return;let i=t.createElement("style");i.setAttribute("data-k",e),i.textContent=n,r.appendChild(i)}function Qe(t){let e=5381,n=2166136261;for(let r=0;r<t.length;r++){let i=t.charCodeAt(r);e=(e<<5)+e^i,n=Math.imul(n^i,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}var j=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function se(t,e){let n=await fetch(j+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),r=await n.json().catch(()=>({}));if(!n.ok)throw Error(r.message??`${n.status}`);return r}var ae=(t)=>se("/api/ask",{question:t}),le=(t)=>se(`/api/faq/${encodeURIComponent(t)}`);var ce=g`
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
`,B=g`
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
`,ue=g`
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
`,de=g`
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
`,pe=g`
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

  @keyframes owl-blink {
    0%, 94%, 100% { transform: scaleY(0); }
    97% { transform: scaleY(1); }
  }

  @keyframes owl-ponder {
    0%, 100% { transform: rotate(-6deg); }
    50% { transform: rotate(6deg); }
  }

  @keyframes owl-hop {
    0% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    100% { transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .lid,
    &.thinking .bird,
    &.answer .bird {
      animation: none;
    }
  }
`,fe=g`
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
`,me=g`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,ge=g`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function he(t,e,n){if(typeof t==="function")return t(e??{});return z(t,e??null)}function o(t,e,n,r,i,a){return he(t,e,n)}var Ze={idle:"ビットコインのこと、なんでも聞いてください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。"},et=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function be(t){return o("div",{class:()=>`${pe} ${t.mood()}`,children:[o("p",{class:"bubble","aria-live":"polite",children:()=>Ze[t.mood()]},void 0,!1,void 0,this),o("div",{class:"drawing",ref:(e)=>e.innerHTML=et},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var tt={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function xe(t){return o("div",{class:"prose",children:t.lines.map((e)=>o("p",{children:e},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function ve(t){let e=t.entry,n=e.more??[],r=e.related??[],i=e.sources??[],a=(e.tags??[]).map((s)=>tt[s]).filter((s)=>s!==void 0);return o("div",{class:ue,children:[o("p",{class:"meta",children:[o("span",{children:e.category.name},void 0,!1,void 0,this),o("a",{href:`#${e.id}`,title:"この答えへのリンク",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),o("h3",{children:e.title},void 0,!1,void 0,this),o(m,{when:()=>e.answered,fallback:o("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:o(xe,{lines:e.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(m,{when:()=>n.length>0,children:o("details",{open:t.expand===!0,children:[o("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),o(xe,{lines:n},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(m,{when:()=>r.length>0,children:o("div",{class:"related",children:[o("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),r.map((s)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(s.id),children:s.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),o(m,{when:()=>a.length>0,children:o("ul",{class:"notes",children:a.map((s)=>o("li",{children:s},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(m,{when:()=>i.length>0||e.updated!==void 0,children:o("div",{class:"sources",children:[i.map((s)=>/^https?:\/\//.test(s)?o("a",{href:s,target:"_blank",rel:"noopener noreferrer",children:s},void 0,!1,void 0,this):o("span",{children:s},void 0,!1,void 0,this)),o(m,{when:()=>e.updated!==void 0,children:o("span",{class:"updated",children:`${e.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function we(t){return o("div",{class:de,children:[o("span",{class:"label",children:"もしかして"},void 0,!1,void 0,this),t.items.map((e)=>o("button",{type:"button",class:"chip",onClick:()=>t.open(e.id),children:e.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}var nt=500,Ae=5,ye=(t)=>[...t].length,Te=(t)=>t.trim().replace(/\s+/g," "),rt=/^[1-9][0-9]*-[1-9][0-9]*$/;function Ee(){let t=x(""),e=x(null),n=x(!1),r=x(""),i,a=!1,s="",c=0,u=()=>{if(n())return"thinking";let l=e();if(l===null)return r()===""?"idle":"miss";return l.status},T=async(l)=>{let p=++c;n.set(!0),r.set("");try{let E=await l();if(p===c)e.set(E)}catch(E){if(p===c)r.set(E instanceof Error?E.message:String(E))}finally{if(p===c)n.set(!1)}},J=(l)=>{let p=Te(l);if(ye(p)<Ae||p===s)return;s=p,T(()=>ae(p))},K=()=>{if(clearTimeout(i),a)return;let l=t.peek();if(ye(Te(l))>=Ae)i=setTimeout(()=>J(l),nt)},S=(l)=>{clearTimeout(i),T(async()=>({status:"answer",answer:await le(l),categories:[]}))},C=()=>{let l=decodeURIComponent(location.hash.replace(/^#/,""));if(rt.test(l))S(l)};return C(),window.addEventListener("hashchange",C),O(()=>{window.removeEventListener("hashchange",C),clearTimeout(i)}),v(()=>{let l=e();document.title=l?.answer!==void 0?`${l.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),o("div",{children:[o(be,{mood:u},void 0,!1,void 0,this),o("form",{class:fe,onSubmit:(l)=>{l.preventDefault(),clearTimeout(i),J(t.peek())},children:o("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:t,ref:(l)=>{if(!window.matchMedia("(pointer: coarse)").matches)l.focus()},onInput:(l)=>{t.set(l.target.value),K()},onCompositionstart:()=>{a=!0,clearTimeout(i)},onCompositionend:()=>{a=!1,K()}},void 0,!1,void 0,this)},void 0,!1,void 0,this),o(m,{when:()=>r()!=="",children:o("p",{class:ge,children:r},void 0,!1,void 0,this)},void 0,!1,void 0,this),o("div",{class:()=>`${me} ${n()?"stale":""}`,children:()=>{let l=e();if(l===null)return null;return o("div",{children:[l.answer!==void 0?o("div",{class:B,children:o(ve,{entry:l.answer,expand:l.expand,open:S},void 0,!1,void 0,this)},void 0,!1,void 0,this):null,(l.message??[]).length>0&&(l.suggestions??[]).length===0?o("div",{class:`${B} message`,children:(l.message??[]).map((p)=>o("p",{children:p},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,(l.suggestions??[]).length>0?o(we,{items:l.suggestions??[],open:S},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function ot(){return o("main",{class:ce,children:[o(Ee,{},void 0,!1,void 0,this),o("footer",{children:["答えの文章はすべて人が書いたものです。質問の読み取りに ",o("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",o("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",o("span",{children:j},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var ke=document.getElementById("app");if(ke)_(()=>o(ot,{},void 0,!1,void 0,this),ke);

//# debugId=F5C240FA98A1B77064756E2164756E21
//# sourceMappingURL=chunk-36p5e2at.js.map
