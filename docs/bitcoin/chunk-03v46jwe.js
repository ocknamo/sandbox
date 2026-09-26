var Me=!1,U=new Set,He=(t)=>console.warn(t),Le=He,Se="kanabun [dev]: ";function Ce(){return Me||globalThis.__KANABUN_DEV__===!0}function h(t){if(!Ce())return;if(U.has(t))return;U.add(t),Le(Se+t)}var w=0,V=1,A=2,b=3,f=null,d=null,P=0,R=!1,k=[],Re=1e6,M=(t,e)=>t===e,Pe=()=>!1;function Q(t){if(!t||t.equals===void 0)return M;if(t.equals===!1)return Pe;return t.equals}class y{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,r){if(this.equals=n,this.isEffect=e,r){if(this.fn=t,this.value=void 0,this.color=A,d!==null)(d.owned??=[]).push(this),this.owner=d}else this.fn=null,this.value=t,this.color=w}read(){if(this.color===b)return this.value;if(f!==null)(f.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(f!==null&&!f.isEffect)h("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(A)}markStale(t){if(this.color>=t)return;let e=this.color===w;if(this.color=t,e&&this.isEffect)G(this);if(this.observers!==null)for(let n of this.observers)n.markStale(V)}updateIfNecessary(){if(this.color===w||this.color===b)return;if(this.color===V&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===A)break}if(this.color===A)this.update();this.color=w}update(){this.cleanNode();let t=f,e=d;f=this,d=this,this.collecting=[];let n,r,o=!1;try{n=this.fn()}catch(l){o=!0,r=l}finally{f=t,d=e}if(o){this.collecting=null,this.color=w,Ie(r,this.owner);return}this.reconcileSources();let s=!this.equals(this.value,n);if(this.value=n,this.color=w,s&&this.observers!==null){for(let l of this.observers)if(l.color!==b&&l.color<A)l.color=A}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))Y(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))Ne(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===b)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)Y(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=b}}function Ne(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function Y(t,e){let n=t.observers;if(n===null)return;let r=n.indexOf(e);if(r===-1)return;if(n[r]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function G(t){k.push(t)}function N(){if(R)return;R=!0;let t=0,e=0;try{while(t<k.length){if(++e>Re)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=k[t++];if(n.color!==b)n.updateIfNecessary()}}finally{k.length=0,R=!1}}function Z(t,e){let n=d,r=f;d=t,f=null;try{return e()}finally{d=n,f=r}}function x(t,e){let n=new y(t,!1,Q(e),!1),r=()=>n.read(),o=r;return o.set=(s)=>{if(n.write(s),P===0)N()},o.update=(s)=>{if(n.write(s(n.value)),P===0)N()},o.peek=()=>n.value,r}function I(t,e){let n=new y(t,!1,Q(e),!0);return()=>n.read()}function v(t){if(d===null)h("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new y(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,M,!0);if(G(e),P===0)N();return()=>e.dispose()}var W=Symbol("error-handler");function Ie(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&W in n.context){n.context[W](t);return}throw t}function O(t){if(d===null){h("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(d.cleanups??=[]).push(t)}function D(t){let e=new y(void 0,!1,M,!1);return e.owner=d,Z(e,()=>t(()=>e.dispose()))}function F(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function Oe(t){return t!=null&&typeof t.nodeType==="number"}function De(t){return t.nodeType===3}var qe=new Set(["script","style"]);function z(t,e){let n=F().createElement(t);if(e!==null){for(let r in e){if(r==="children"||r==="ref")continue;_e(n,r,e[r])}if(e.ref!==void 0)ze(e.ref,n);if("children"in e)Fe(t,e.children),H(n,e.children)}return n}function Fe(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!qe.has(t.toLowerCase()))return;h(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function ze(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function _e(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){Xe(t,n);return}if(typeof n==="function")v(()=>te(t,e,n()));else te(t,e,n)}function Xe(t,e){for(let n in e){let r=e[n];if(typeof r==="function")v(()=>ee(t,n,r()));else ee(t,n,r)}}function ee(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function te(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function H(t,e,n=null){if(Array.isArray(e)){for(let r of e)H(t,r,n);return}if(typeof e==="function"){let r=t.insertBefore(F().createComment(""),n);ne(t,e,r,{current:null});return}re(t,e,null,n)}function ne(t,e,n,r){v(()=>{let o=e();if(typeof o==="function")ne(t,o,n,r);else r.current=re(t,o,r.current,n)})}function re(t,e,n,r){if(n!==null&&n.length===1&&De(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let o=$e(e);return oe(t,n??[],o,r),o.length>0?o:null}function oe(t,e,n,r){if(e.length>0){let s=new Set(n);for(let l of e)if(!s.has(l)&&l.parentNode===t)t.removeChild(l)}let o=r;for(let s=n.length-1;s>=0;s--){let l=n[s];if(l.parentNode!==t||l.nextSibling!==o)t.insertBefore(l,o);o=l}}function $e(t){let e=[];return q(e,t),e}function q(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)q(t,n);return}if(Oe(e)){t.push(e);return}if(typeof e==="function"){q(t,e());return}t.push(F().createTextNode(String(e)))}function _(t,e){let n;return D((r)=>{n=r,H(e,t())}),()=>{n(),e.textContent=""}}function g(t){let e=I(()=>!!t.when());return()=>e()?t.children:t.fallback??null}var Be=/^@(media|supports|container|document|layer)\b/i;function m(t,...e){let n=typeof t==="string"?t:t.reduce((s,l,c)=>s+l+(c<e.length?String(e[c]):""),""),r=Qe(n),o="k-"+r;return Ye(r,X(n,"."+o)),o}function Ke(t){let e=[],n="",r=0,o="",s="",l="";for(let c=0;c<t.length;c++){let u=t[c];if(u==="{"){if(r===0){let T=o.lastIndexOf(";");n+=o.slice(0,T+1),l=o.slice(T+1),o="",s=""}else s+=u;r++}else if(u==="}")if(r--,r===0)e.push({prelude:l,inner:s});else if(r>0)s+=u;else r=0;else if(r===0)o+=u;else s+=u}return n+=o,{decls:n,blocks:e}}function X(t,e){let{decls:n,blocks:r}=Ke(t),o="",s=n.trim();if(s)o+=`${e}{${s}}`;for(let{prelude:l,inner:c}of r){let u=l.trim();if(u[0]==="@")o+=Be.test(u)?`${u}{${X(c,e)}}`:`${u}{${c.trim()}}`;else o+=X(c,Ue(u,e))}return o}function Ue(t,e){return Ve(t,",").map((n)=>{let r=n.trim();return r.includes("&")?r.replace(/&/g,e):`${e} ${r}`}).join(",")}function Ve(t,e){let n=[],r=0,o="";for(let s=0;s<t.length;s++){let l=t[s];if(l==="("||l==="[")r++;else if(l===")"||l==="]")r--;if(l===e&&r===0)n.push(o),o="";else o+=l}return n.push(o),n}var ie=new Map;function Ye(t,e){let n=globalThis.document;if(!n){if(!ie.has(t))ie.set(t,e);return}We(n,t,e)}function We(t,e,n){let r=t.head;for(let s of r.childNodes)if(s.nodeType===1&&s.getAttribute("data-k")===e)return;let o=t.createElement("style");o.setAttribute("data-k",e),o.textContent=n,r.appendChild(o)}function Qe(t){let e=5381,n=2166136261;for(let r=0;r<t.length;r++){let o=t.charCodeAt(r);e=(e<<5)+e^o,n=Math.imul(n^o,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}var j=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function se(t,e){let n=await fetch(j+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),r=await n.json().catch(()=>({}));if(!n.ok)throw Error(r.message??`${n.status}`);return r}var ae=(t)=>se("/api/ask",{question:t}),le=(t)=>se(`/api/faq/${encodeURIComponent(t)}`);var ce=m`
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
`,J=m`
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
`,ue=m`
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
`,de=m`
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
`,pe=m`
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
`,fe=m`
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
`,me=m`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,ge=m`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function he(t,e,n){if(typeof t==="function")return t(e??{});return z(t,e??null)}function i(t,e,n,r,o,s){return he(t,e,n)}var Ze={idle:"ビットコインのこと、なんでも聞いてください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。"},et=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function be(t){return i("div",{class:()=>`${pe} ${t.mood()}`,children:[i("p",{class:"bubble","aria-live":"polite",children:()=>Ze[t.mood()]},void 0,!1,void 0,this),i("div",{class:"drawing",ref:(e)=>e.innerHTML=et},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function xe(t){return i("div",{class:"prose",children:t.lines.map((e)=>i("p",{children:e},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function ve(t){let e=t.entry,n=e.more??[],r=e.related??[],o=e.sources??[];return i("div",{class:ue,children:[i("p",{class:"meta",children:[i("span",{children:e.category.name},void 0,!1,void 0,this),i("a",{href:`#${e.id}`,title:"この答えへのリンク",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),i("h3",{children:e.title},void 0,!1,void 0,this),i(g,{when:()=>e.answered,fallback:i("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:i(xe,{lines:e.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),i(g,{when:()=>n.length>0,children:i("details",{open:t.expand===!0,children:[i("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),i(xe,{lines:n},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),i(g,{when:()=>r.length>0,children:i("div",{class:"related",children:[i("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),r.map((s)=>i("button",{type:"button",class:"chip",onClick:()=>t.open(s.id),children:s.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),i(g,{when:()=>o.length>0||e.updated!==void 0,children:i("div",{class:"sources",children:[o.map((s)=>/^https?:\/\//.test(s)?i("a",{href:s,target:"_blank",rel:"noopener noreferrer",children:s},void 0,!1,void 0,this):i("span",{children:s},void 0,!1,void 0,this)),i(g,{when:()=>e.updated!==void 0,children:i("span",{class:"updated",children:`${e.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function we(t){return i("div",{class:de,children:[i("span",{class:"label",children:"もしかして"},void 0,!1,void 0,this),t.items.map((e)=>i("button",{type:"button",class:"chip",onClick:()=>t.open(e.id),children:e.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}var tt=500,Ae=5,ye=(t)=>[...t].length,Te=(t)=>t.trim().replace(/\s+/g," "),nt=/^[1-9][0-9]*-[1-9][0-9]*$/;function Ee(){let t=x(""),e=x(null),n=x(!1),r=x(""),o,s=!1,l="",c=0,u=()=>{if(n())return"thinking";let a=e();if(a===null)return r()===""?"idle":"miss";return a.status},T=async(a)=>{let p=++c;n.set(!0),r.set("");try{let E=await a();if(p===c)e.set(E)}catch(E){if(p===c)r.set(E instanceof Error?E.message:String(E))}finally{if(p===c)n.set(!1)}},B=(a)=>{let p=Te(a);if(ye(p)<Ae||p===l)return;l=p,T(()=>ae(p))},K=()=>{if(clearTimeout(o),s)return;let a=t.peek();if(ye(Te(a))>=Ae)o=setTimeout(()=>B(a),tt)},S=(a)=>{clearTimeout(o),T(async()=>({status:"answer",answer:await le(a),categories:[]}))},C=()=>{let a=decodeURIComponent(location.hash.replace(/^#/,""));if(nt.test(a))S(a)};return C(),window.addEventListener("hashchange",C),O(()=>{window.removeEventListener("hashchange",C),clearTimeout(o)}),v(()=>{let a=e();document.title=a?.answer!==void 0?`${a.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),i("div",{children:[i(be,{mood:u},void 0,!1,void 0,this),i("form",{class:fe,onSubmit:(a)=>{a.preventDefault(),clearTimeout(o),B(t.peek())},children:i("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:t,ref:(a)=>{if(!window.matchMedia("(pointer: coarse)").matches)a.focus()},onInput:(a)=>{t.set(a.target.value),K()},onCompositionstart:()=>{s=!0,clearTimeout(o)},onCompositionend:()=>{s=!1,K()}},void 0,!1,void 0,this)},void 0,!1,void 0,this),i(g,{when:()=>r()!=="",children:i("p",{class:ge,children:r},void 0,!1,void 0,this)},void 0,!1,void 0,this),i("div",{class:()=>`${me} ${n()?"stale":""}`,children:()=>{let a=e();if(a===null)return null;return i("div",{children:[a.answer!==void 0?i("div",{class:J,children:i(ve,{entry:a.answer,expand:a.expand,open:S},void 0,!1,void 0,this)},void 0,!1,void 0,this):null,(a.message??[]).length>0&&(a.suggestions??[]).length===0?i("div",{class:`${J} message`,children:(a.message??[]).map((p)=>i("p",{children:p},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,(a.suggestions??[]).length>0?i(we,{items:a.suggestions??[],open:S},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function rt(){return i("main",{class:ce,children:[i(Ee,{},void 0,!1,void 0,this),i("footer",{children:["答えの文章はすべて人が書いたものです。質問の読み取りに ",i("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",i("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",i("span",{children:j},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var ke=document.getElementById("app");if(ke)_(()=>i(rt,{},void 0,!1,void 0,this),ke);

//# debugId=3F0ABCDA1E51D6F964756E2164756E21
//# sourceMappingURL=chunk-03v46jwe.js.map
