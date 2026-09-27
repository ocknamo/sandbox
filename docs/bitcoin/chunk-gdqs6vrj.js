var $6=!1,z1=new Set,B6=(J)=>console.warn(J),G6=B6,X6="kanabun [dev]: ";function z6(){return $6||globalThis.__KANABUN_DEV__===!0}function R(J){if(!z6())return;if(z1.has(J))return;z1.add(J),G6(X6+J)}var V=0,K1=1,g=2,O=3,A=null,L=null,a=0,l=!1,h=[],K6=1e6,c=(J,Z)=>J===Z,Q6=()=>!1;function W1(J){if(!J||J.equals===void 0)return c;if(J.equals===!1)return Q6;return J.equals}class f{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(J,Z,$,B){if(this.equals=$,this.isEffect=Z,B){if(this.fn=J,this.value=void 0,this.color=g,L!==null)(L.owned??=[]).push(this),this.owner=L}else this.fn=null,this.value=J,this.color=V}read(){if(this.color===O)return this.value;if(A!==null)(A.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(J){if(A!==null&&!A.isEffect)R("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,J))return;if(this.value=J,this.observers!==null)for(let Z of this.observers)Z.markStale(g)}markStale(J){if(this.color>=J)return;let Z=this.color===V;if(this.color=J,Z&&this.isEffect)Y1(this);if(this.observers!==null)for(let $ of this.observers)$.markStale(K1)}updateIfNecessary(){if(this.color===V||this.color===O)return;if(this.color===K1&&this.sources!==null){for(let J of this.sources)if(J.updateIfNecessary(),this.color===g)break}if(this.color===g)this.update();this.color=V}update(){this.cleanNode();let J=A,Z=L;A=this,L=this,this.collecting=[];let $,B,X=!1;try{$=this.fn()}catch(z){X=!0,B=z}finally{A=J,L=Z}if(X){this.collecting=null,this.color=V,W6(B,this.owner);return}this.reconcileSources();let K=!this.equals(this.value,$);if(this.value=$,this.color=V,K&&this.observers!==null){for(let z of this.observers)if(z.color!==O&&z.color<g)z.color=g}}reconcileSources(){let J=this.collecting;this.collecting=null;let Z=[];for(let $ of J)if(!Z.includes($))Z.push($);if(this.sources!==null){for(let $ of this.sources)if(!Z.includes($))Q1($,this)}for(let $ of Z)if(this.sources===null||!this.sources.includes($))U6($,this);this.sources=Z.length>0?Z:null}disposeOwned(){if(this.owned===null)return;let J=this.owned;this.owned=null;for(let Z=J.length-1;Z>=0;Z--)J[Z].dispose()}runCleanups(){if(this.cleanups===null)return;let J=this.cleanups;this.cleanups=null;for(let Z=J.length-1;Z>=0;Z--)J[Z]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===O)return;if(this.cleanNode(),this.sources!==null){for(let J of this.sources)Q1(J,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=O}}function U6(J,Z){if(J.observers===null)J.observers=[Z];else J.observers.push(Z)}function Q1(J,Z){let $=J.observers;if($===null)return;let B=$.indexOf(Z);if(B===-1)return;if($[B]=$[$.length-1],$.pop(),$.length===0)J.observers=null}function Y1(J){h.push(J)}function i(){if(l)return;l=!0;let J=0,Z=0;try{while(J<h.length){if(++Z>K6)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let $=h[J++];if($.color!==O)$.updateIfNecessary()}}finally{h.length=0,l=!1}}function F1(J,Z){let $=L,B=A;L=J,A=null;try{return Z()}finally{L=$,A=B}}function H(J,Z){let $=new f(J,!1,W1(Z),!1),B=()=>$.read(),X=B;return X.set=(K)=>{if($.write(K),a===0)i()},X.update=(K)=>{if($.write(K($.value)),a===0)i()},X.peek=()=>$.value,B}function o(J,Z){let $=new f(J,!1,W1(Z),!0);return()=>$.read()}function S(J){if(L===null)R("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let Z=new f(()=>{let $=J();if(typeof $==="function")(Z.cleanups??=[]).push($)},!0,c,!0);if(Y1(Z),a===0)i();return()=>Z.dispose()}var U1=Symbol("error-handler");function W6(J,Z){for(let $=Z;$!==null;$=$.owner)if($.context!==null&&U1 in $.context){$.context[U1](J);return}throw J}function D(J){if(L===null){R("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(L.cleanups??=[]).push(J)}function y(J){let Z=new f(void 0,!1,c,!1);return Z.owner=L,F1(Z,()=>J(()=>Z.dispose()))}function t(){let J=globalThis.document;if(!J)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return J}function Y6(J){return J!=null&&typeof J.nodeType==="number"}function F6(J){return J.nodeType===3}var _6=new Set(["script","style"]);function r(J,Z){let $=t().createElement(J);if(Z!==null){for(let B in Z){if(B==="children"||B==="ref")continue;M6($,B,Z[B])}if(Z.ref!==void 0)H6(Z.ref,$);if("children"in Z)L6(J,Z.children),u($,Z.children)}return $}function L6(J,Z){if(Z==null||Z==="")return;if(Array.isArray(Z)&&Z.length===0)return;if(!_6.has(J.toLowerCase()))return;R(`a child of <${J.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function H6(J,Z){if(typeof J==="function")J(Z);else if(J!==null&&typeof J==="object")J.current=Z}function M6(J,Z,$){if(Z.length>2&&Z[0]==="o"&&Z[1]==="n"){J.addEventListener(Z.slice(2).toLowerCase(),$);return}if(Z==="style"&&$!==null&&typeof $==="object"){P6(J,$);return}if(typeof $==="function")S(()=>L1(J,Z,$()));else L1(J,Z,$)}function P6(J,Z){for(let $ in Z){let B=Z[$];if(typeof B==="function")S(()=>_1(J,$,B()));else _1(J,$,B)}}function _1(J,Z,$){J.style.setProperty(Z,$==null?"":String($))}function L1(J,Z,$){if(Z==="value"||Z==="checked"||Z==="selected"){J[Z]=$;return}if(Z==="className")Z="class";if($==null||$===!1)J.removeAttribute(Z);else if($===!0)J.setAttribute(Z,"");else J.setAttribute(Z,String($))}function u(J,Z,$=null){if(Array.isArray(Z)){for(let B of Z)u(J,B,$);return}if(typeof Z==="function"){let B=J.insertBefore(t().createComment(""),$);H1(J,Z,B,{current:null});return}M1(J,Z,null,$)}function H1(J,Z,$,B){S(()=>{let X=Z();if(typeof X==="function")H1(J,X,$,B);else B.current=M1(J,X,B.current,$)})}function M1(J,Z,$,B){if($!==null&&$.length===1&&F6($[0])&&(typeof Z==="string"||typeof Z==="number"))return $[0].data=String(Z),$;let X=C6(Z);return P1(J,$??[],X,B),X.length>0?X:null}function P1(J,Z,$,B){if(Z.length>0){let K=new Set($);for(let z of Z)if(!K.has(z)&&z.parentNode===J)J.removeChild(z)}let X=B;for(let K=$.length-1;K>=0;K--){let z=$[K];if(z.parentNode!==J||z.nextSibling!==X)J.insertBefore(z,X);X=z}}function C6(J){let Z=[];return n(Z,J),Z}function n(J,Z){if(Z==null||Z===!1||Z===!0||Z==="")return;if(Array.isArray(Z)){for(let $ of Z)n(J,$);return}if(Y6(Z)){J.push(Z);return}if(typeof Z==="function"){n(J,Z());return}J.push(t().createTextNode(String(Z)))}function s(J,Z){let $;return y((B)=>{$=B,u(Z,J())}),()=>{$(),Z.textContent=""}}function C1(J,Z){let $=[],B=[],X=[];return D(()=>{for(let K of X)K()}),()=>{let K=J(),z=K.length,W=Array(z),U=Array(z),F=new Map;for(let Y=0;Y<$.length;Y++){let I=F.get($[Y]);if(I)I.push(Y);else F.set($[Y],[Y])}let C=Array($.length).fill(!1);for(let Y=0;Y<z;Y++){let I=K[Y],b=F.get(I);if(b!==void 0&&b.length>0){let N=b.shift();C[N]=!0,W[Y]=B[N],U[Y]=X[N]}else{let N,v=y((k)=>{return N=Z(I,Y),k});W[Y]=N,U[Y]=v}}for(let Y=0;Y<X.length;Y++)if(!C[Y])X[Y]();return $=K.slice(),B=W,X=U,W}}function P(J){let Z=o(()=>!!J.when());return()=>Z()?J.children:J.fallback??null}function e(J){let Z=C1(()=>J.each()??[],($,B)=>J.children($,B));return()=>{let $=Z();return $.length>0?$:J.fallback??null}}var T6=/^@(media|supports|container|document|layer)\b/i;function M(J,...Z){let $=typeof J==="string"?J:J.reduce((K,z,W)=>K+z+(W<Z.length?String(Z[W]):""),""),B=m6($),X="k-"+B;return O6(B,J1($,"."+X)),X}function I6(J){let Z=[],$="",B=0,X="",K="",z="";for(let W=0;W<J.length;W++){let U=J[W];if(U==="{"){if(B===0){let F=X.lastIndexOf(";");$+=X.slice(0,F+1),z=X.slice(F+1),X="",K=""}else K+=U;B++}else if(U==="}")if(B--,B===0)Z.push({prelude:z,inner:K});else if(B>0)K+=U;else B=0;else if(B===0)X+=U;else K+=U}return $+=X,{decls:$,blocks:Z}}function J1(J,Z){let{decls:$,blocks:B}=I6(J),X="",K=$.trim();if(K)X+=`${Z}{${K}}`;for(let{prelude:z,inner:W}of B){let U=z.trim();if(U[0]==="@")X+=T6.test(U)?`${U}{${J1(W,Z)}}`:`${U}{${W.trim()}}`;else X+=J1(W,q6(U,Z))}return X}function q6(J,Z){return R6(J,",").map(($)=>{let B=$.trim();return B.includes("&")?B.replace(/&/g,Z):`${Z} ${B}`}).join(",")}function R6(J,Z){let $=[],B=0,X="";for(let K=0;K<J.length;K++){let z=J[K];if(z==="("||z==="[")B++;else if(z===")"||z==="]")B--;if(z===Z&&B===0)$.push(X),X="";else X+=z}return $.push(X),$}var N1=new Map;function O6(J,Z){let $=globalThis.document;if(!$){if(!N1.has(J))N1.set(J,Z);return}S6($,J,Z)}function S6(J,Z,$){let B=J.head;for(let K of B.childNodes)if(K.nodeType===1&&K.getAttribute("data-k")===Z)return;let X=J.createElement("style");X.setAttribute("data-k",Z),X.textContent=$,B.appendChild(X)}function m6(J){let Z=5381,$=2166136261;for(let B=0;B<J.length;B++){let X=J.charCodeAt(B);Z=(Z<<5)+Z^X,$=Math.imul($^X,16777619)}return(Z>>>0).toString(36)+($>>>0).toString(36)}var Z1=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function A1(J,Z){let $=await fetch(Z1+J,{method:Z===void 0?"GET":"POST",headers:Z===void 0?void 0:{"Content-Type":"application/json"},body:Z===void 0?void 0:JSON.stringify(Z)}),B=await $.json().catch(()=>({}));if(!$.ok)throw Error(B.message??`${$.status}`);return B}var T1=(J)=>A1("/api/ask",{question:J}),I1=(J)=>A1(`/api/faq/${encodeURIComponent(J)}`);var q1=M`
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
`,$1=M`
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
`,R1=M`
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
`,O1=M`
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
`,S1=M`
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
`,m1=M`
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
`,b1=M`
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
`,j1=M`
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: -10px 0 16px;
`,V1=M`
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin: -8px 0 16px;
`,g1=M`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,f1=M`
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
`,k1=M`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function D1(J,Z,$){if(typeof J==="function")return J(Z??{});return r(J,Z??null)}function G(J,Z,$,B,X,K){return D1(J,Z,$)}var j6={idle:"ビットコインのこと、なんでも聞いてください。",listening:"どうぞ、お話しください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。",multiple:"いっぺんに聞かれると目が回ります……ひとつずつどうぞ。"},V6=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function y1(J){return G("div",{class:()=>`${m1} ${J.mood()}`,children:[G("p",{class:"bubble","aria-live":"polite",children:()=>j6[J.mood()]},void 0,!1,void 0,this),G("div",{class:"drawing",ref:(Z)=>Z.innerHTML=V6},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var B1="jev-bitcoin:history",g6=50,w1=60000;function f6(){try{let J=localStorage.getItem(B1),Z=J===null?[]:JSON.parse(J);return Array.isArray(Z)?Z.filter(($)=>typeof $?.q==="string"):[]}catch{return[]}}function E1(J){try{localStorage.setItem(B1,JSON.stringify(J))}catch{}}var m=H(f6());function x1(J,Z,$,B){let X=Date.now();m.update((K)=>{let z=K[0],W=z!==void 0&&X-z.at<w1&&(J.startsWith(z.q)||z.q.startsWith(J)),F=[{q:J,at:X,id:$,title:B,status:Z},...W?K.slice(1):K].slice(0,g6);return E1(F),F})}function v1(J,Z){m.update(($)=>{let B=$[0];if(B===void 0||B.status!=="suggest"||B.id!==void 0)return $;if(Date.now()-B.at>w1*5)return $;let X=[{...B,id:J,title:Z},...$.slice(1)];return E1(X),X})}function h1(){m.set([]);try{localStorage.removeItem(B1)}catch{}}var k6={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function c1(J){return G("div",{class:"prose",children:J.lines.map((Z)=>G("p",{children:Z},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function u1(J){let Z=J.entry,$=Z.more??[],B=Z.related??[],X=Z.sources??[],K=(Z.tags??[]).map((z)=>k6[z]).filter((z)=>z!==void 0);return G("div",{class:R1,children:[G("p",{class:"meta",children:[G("span",{children:Z.category.name},void 0,!1,void 0,this),G("a",{href:`#${Z.id}`,title:"この答えへのリンク",children:`#${Z.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),G("h3",{children:Z.title},void 0,!1,void 0,this),G(P,{when:()=>Z.answered,fallback:G("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:G(c1,{lines:Z.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),G(P,{when:()=>$.length>0,children:G("details",{open:J.expand===!0,children:[G("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),G(c1,{lines:$},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),G(P,{when:()=>B.length>0,children:G("div",{class:"related",children:[G("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),B.map((z)=>G("button",{type:"button",class:"chip",onClick:()=>J.open(z.id),children:z.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),G(P,{when:()=>K.length>0,children:G("ul",{class:"notes",children:K.map((z)=>G("li",{children:z},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),G(P,{when:()=>X.length>0||Z.updated!==void 0,children:G("div",{class:"sources",children:[X.map((z)=>/^https?:\/\//.test(z)?G("a",{href:z,target:"_blank",rel:"noopener noreferrer",children:z},void 0,!1,void 0,this):G("span",{children:z},void 0,!1,void 0,this)),G(P,{when:()=>Z.updated!==void 0,children:G("span",{class:"updated",children:`${Z.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function d1(J){return G("div",{class:O1,children:[G("span",{class:"label",children:J.label},void 0,!1,void 0,this),J.items.map((Z)=>G("button",{type:"button",class:"chip",onClick:()=>J.open(Z.id),children:Z.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}function D6(J){if(J.title!==void 0)return`→ ${J.title}`;if(J.status==="multiple")return"→ 質問がいくつか入っていました";if(J.status==="suggest")return"→ 近い質問がありました";return"→ 答えは見つかりませんでした"}function y6(J){let Z=new Date(J),$=`${Z.getHours()}:${String(Z.getMinutes()).padStart(2,"0")}`;return Z.toDateString()===new Date().toDateString()?$:`${Z.getMonth()+1}/${Z.getDate()} ${$}`}function p1(J){return G(P,{when:()=>m().length>0,children:G("details",{class:f1,children:[G("summary",{children:()=>`これまでの質問（${m().length}）`},void 0,!1,void 0,this),G("ol",{children:G(e,{each:m,children:(Z)=>G("li",{children:[G("button",{type:"button",onClick:()=>J.again(Z.q,Z.id),children:[G("span",{class:"q",children:Z.q},void 0,!1,void 0,this),G("span",{class:"a",children:D6(Z)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),G("span",{class:"at",children:y6(Z.at)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),G("p",{class:"foot",children:[G("span",{children:"履歴はこのブラウザの中にだけ保存されています。"},void 0,!1,void 0,this),G("button",{type:"button",class:"clear",onClick:()=>h1(),children:"履歴を消す"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)}var w6=50,l1=60,E6="#jevbitcoin";function a1(J,Z){let $=[...J.replace(/\s+/g," ").trim()];return $.length<=Z?$.join(""):`${$.slice(0,Z-1).join("")}…`}function x6(J){let Z=(J.answer[0]??"").replace(/\s+/g," ").trim(),$=Z.indexOf("。");if($>=0&&[...Z.slice(0,$+1)].length<=l1)return Z.slice(0,$+1);return a1(Z,l1)}function v6(J,Z){let $=Z!==void 0&&Z.answered?x6(Z):"まだ答えが見つかりませんでした";return[`Q. ${a1(J,w6)}`,`A. ${$}`,E6].join(`
`)}function h6(J){let Z=new URL(location.href);return Z.searchParams.delete("api"),Z.hash=J??"",Z.toString()}function G1(J){let Z=J.entry?.answered===!0,$=v6(J.question,J.entry),B=h6(Z?J.entry?.id:void 0),X=H(!1),K=typeof navigator.share==="function",z=()=>{navigator.share({title:J.entry?.title??J.question,text:$,url:B}).catch(()=>{})},W=async()=>{let U=`${$}
${B}`;try{await navigator.clipboard.writeText(U)}catch{let F=document.createElement("textarea");F.value=U,F.style.position="fixed",F.style.opacity="0",document.body.appendChild(F),F.select(),document.execCommand("copy"),F.remove()}X.set(!0),setTimeout(()=>X.set(!1),2000)};return G("details",{class:S1,children:[G("summary",{children:Z?"この質問と答えを共有する":"この質問を共有する"},void 0,!1,void 0,this),G("pre",{children:`${$}
${B}`},void 0,!1,void 0,this),G("div",{class:"buttons",children:[K?G("button",{type:"button",onClick:z,children:"共有する"},void 0,!1,void 0,this):null,G("button",{type:"button",onClick:()=>void W(),children:()=>X()?"コピーしました":"コピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function i1(){let J=window;return J.SpeechRecognition??J.webkitSpeechRecognition}var o1=i1()!==void 0,c6={"not-allowed":"マイクの使用が許可されていません。ブラウザの設定で、このページのマイクを許可してください。","service-not-allowed":"このブラウザでは音声入力を使えないようです。","audio-capture":"マイクが見つかりませんでした。","no-speech":"声が聞き取れませんでした。もう一度どうぞ。",network:"音声認識のサービスに接続できませんでした。","language-not-supported":"このブラウザは日本語の音声入力に対応していないようです。"};function n1(J){let Z=i1();if(Z===void 0)return J.error("このブラウザは音声入力に対応していません。"),J.end(),{stop(){}};let $=new Z;$.lang="ja-JP",$.interimResults=!0,$.continuous=!1,$.maxAlternatives=1;let B="",X=!1;$.onresult=(K)=>{let z="",W=!1;for(let U=0;U<K.results.length;U++){let F=K.results[U];if(F===void 0)continue;z+=F[0].transcript,W=W||F.isFinal}if(B=z.trim(),W)X=!0,J.final(B);else J.interim(B)},$.onerror=(K)=>{if(K.error==="aborted")return;J.error(c6[K.error]??"音声入力でエラーが起きました。")},$.onend=()=>{if(!X&&B!=="")J.final(B);J.end()};try{$.start()}catch{J.error("音声入力を始められませんでした。"),J.end()}return{stop:()=>$.stop()}}var t1=500,E=5,d=(J)=>[...J].length,x=(J)=>J.trim().replace(/\s+/g," "),d6=/^[1-9][0-9]*-[1-9][0-9]*$/,p6=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="3" width="6" height="11" rx="3" />
  <path d="M5 11a7 7 0 0 0 14 0" />
  <path d="M12 18v3" />
</svg>`;function r1(){let J=H(""),Z=H(null),$=H(null),B=H(!1),X=H(""),K=H(!1),z=H(!1),W=null,U,F=!1,C="",Y=0,I=()=>{if(B())return"thinking";if(K())return"listening";let Q=Z();if(Q===null)return X()===""?"idle":"miss";return Q.status},b=async(Q,_,q)=>{let T=++Y;B.set(!0),X.set("");try{let j=await Q();if(T===Y)$.set(_),Z.set(j),q?.(j)}catch(j){if(T===Y)X.set(j instanceof Error?j.message:String(j))}finally{if(T===Y)B.set(!1)}},N=(Q)=>{let _=x(Q);if(d(_)<E||_===C)return;C=_,b(()=>T1(_),_,(q)=>x1(_,q.status,q.answer?.id,q.answer?.title))},v=()=>{if(clearTimeout(U),z.set(!1),F)return;let Q=J.peek(),_=d(x(Q));if(_>=E)U=setTimeout(()=>N(Q),t1);else if(_>0)U=setTimeout(()=>z.set(!0),t1)},k=(Q,_,q)=>{clearTimeout(U),b(async()=>{return{status:"answer",answer:await I1(Q),categories:[]}},_,(T)=>{if(q&&T.answer!==void 0)v1(T.answer.id,T.answer.title)})},X1=(Q)=>k(Q,null,!1),e1=(Q)=>k(Q,C===""?null:C,!0),J6=(Q,_)=>{if(J.set(Q),_!==void 0){C=x(Q),k(_,C,!1);return}C="",clearTimeout(U),N(Q)},Z6=()=>{if(W!==null){W.stop();return}clearTimeout(U),X.set(""),K.set(!0),W=n1({interim:(Q)=>J.set(Q),final:(Q)=>{if(J.set(Q),d(x(Q))>=E)C="",N(Q);else z.set(!0)},error:(Q)=>X.set(Q),end:()=>{W=null,K.set(!1)}})},p=()=>{let Q=decodeURIComponent(location.hash.replace(/^#/,""));if(d6.test(Q))X1(Q)};return p(),window.addEventListener("hashchange",p),D(()=>{window.removeEventListener("hashchange",p),clearTimeout(U),W?.stop()}),S(()=>{let Q=Z();document.title=Q?.answer!==void 0?`${Q.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),G("div",{children:[G(y1,{mood:I},void 0,!1,void 0,this),G("form",{class:b1,onSubmit:(Q)=>{Q.preventDefault(),clearTimeout(U);let _=J.peek();z.set(d(x(_))<E),N(_)},children:[G("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:()=>K()?"聞いています……":"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:J,ref:(Q)=>{if(!window.matchMedia("(pointer: coarse)").matches)Q.focus()},onInput:(Q)=>{W?.stop(),J.set(Q.target.value),v()},onCompositionstart:()=>{F=!0,clearTimeout(U),z.set(!1)},onCompositionend:()=>{F=!1,v()}},void 0,!1,void 0,this),o1?G("button",{type:"button",class:()=>`mic ${K()?"on":""}`,"aria-label":()=>K()?"音声入力を止める":"声で質問する","aria-pressed":()=>K()?"true":"false",title:()=>K()?"音声入力を止める":"声で質問する",onClick:Z6,ref:(Q)=>Q.innerHTML=p6},void 0,!1,void 0,this):null]},void 0,!0,void 0,this),G(P,{when:K,children:G("p",{class:j1,children:"話し終えると、そのまま質問します。音声の認識はブラウザの機能で行います（Chrome などでは音声がブラウザ提供元のサーバで処理されます）。"},void 0,!1,void 0,this)},void 0,!1,void 0,this),G(P,{when:z,children:G("p",{class:V1,children:[E,"文字以上入力してください"]},void 0,!0,void 0,this)},void 0,!1,void 0,this),G(P,{when:()=>X()!=="",children:G("p",{class:k1,children:X},void 0,!1,void 0,this)},void 0,!1,void 0,this),G("div",{class:()=>`${g1} ${B()?"stale":""}`,children:()=>{let Q=Z();if(Q===null)return null;return G("div",{children:[Q.answer!==void 0?G("div",{class:$1,children:[G(u1,{entry:Q.answer,expand:Q.expand,open:X1},void 0,!1,void 0,this),G(G1,{question:$.peek()??Q.answer.title,entry:Q.answer},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,(Q.message??[]).length>0&&Q.status!=="suggest"?G("div",{class:`${$1} message`,children:[(Q.message??[]).map((_)=>G("p",{children:_},void 0,!1,void 0,this)),Q.answer===void 0&&Q.status==="miss"&&$.peek()!==null?G(G1,{question:$.peek()??""},void 0,!1,void 0,this):null]},void 0,!0,void 0,this):null,(Q.suggestions??[]).length>0?G(d1,{label:Q.status==="multiple"?"近い質問":"もしかして",items:Q.suggestions??[],open:e1},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this),G(p1,{again:J6},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function l6(){return G("main",{class:q1,children:[G(r1,{},void 0,!1,void 0,this),G("footer",{children:["答えはあらかじめ用意したもので、その場で文章を作ることはしません。質問の読み取りに ",G("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",G("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",G("span",{children:Z1},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var s1=document.getElementById("app");if(s1)s(()=>G(l6,{},void 0,!1,void 0,this),s1);

//# debugId=89370A42B58A9B1564756E2164756E21
//# sourceMappingURL=chunk-gdqs6vrj.js.map
