var t1=!1,B1=new Set,r1=(J)=>console.warn(J),s1=r1,e1="kanabun [dev]: ";function J6(){return t1||globalThis.__KANABUN_DEV__===!0}function R(J){if(!J6())return;if(B1.has(J))return;B1.add(J),s1(e1+J)}var m=0,G1=1,V=2,O=3,A=null,H=null,l=0,d=!1,x=[],Z6=1e6,v=(J,Z)=>J===Z,$6=()=>!1;function z1(J){if(!J||J.equals===void 0)return v;if(J.equals===!1)return $6;return J.equals}class g{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(J,Z,$,B){if(this.equals=$,this.isEffect=Z,B){if(this.fn=J,this.value=void 0,this.color=V,H!==null)(H.owned??=[]).push(this),this.owner=H}else this.fn=null,this.value=J,this.color=m}read(){if(this.color===O)return this.value;if(A!==null)(A.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(J){if(A!==null&&!A.isEffect)R("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,J))return;if(this.value=J,this.observers!==null)for(let Z of this.observers)Z.markStale(V)}markStale(J){if(this.color>=J)return;let Z=this.color===m;if(this.color=J,Z&&this.isEffect)K1(this);if(this.observers!==null)for(let $ of this.observers)$.markStale(G1)}updateIfNecessary(){if(this.color===m||this.color===O)return;if(this.color===G1&&this.sources!==null){for(let J of this.sources)if(J.updateIfNecessary(),this.color===V)break}if(this.color===V)this.update();this.color=m}update(){this.cleanNode();let J=A,Z=H;A=this,H=this,this.collecting=[];let $,B,Q=!1;try{$=this.fn()}catch(X){Q=!0,B=X}finally{A=J,H=Z}if(Q){this.collecting=null,this.color=m,G6(B,this.owner);return}this.reconcileSources();let z=!this.equals(this.value,$);if(this.value=$,this.color=m,z&&this.observers!==null){for(let X of this.observers)if(X.color!==O&&X.color<V)X.color=V}}reconcileSources(){let J=this.collecting;this.collecting=null;let Z=[];for(let $ of J)if(!Z.includes($))Z.push($);if(this.sources!==null){for(let $ of this.sources)if(!Z.includes($))Q1($,this)}for(let $ of Z)if(this.sources===null||!this.sources.includes($))B6($,this);this.sources=Z.length>0?Z:null}disposeOwned(){if(this.owned===null)return;let J=this.owned;this.owned=null;for(let Z=J.length-1;Z>=0;Z--)J[Z].dispose()}runCleanups(){if(this.cleanups===null)return;let J=this.cleanups;this.cleanups=null;for(let Z=J.length-1;Z>=0;Z--)J[Z]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===O)return;if(this.cleanNode(),this.sources!==null){for(let J of this.sources)Q1(J,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=O}}function B6(J,Z){if(J.observers===null)J.observers=[Z];else J.observers.push(Z)}function Q1(J,Z){let $=J.observers;if($===null)return;let B=$.indexOf(Z);if(B===-1)return;if($[B]=$[$.length-1],$.pop(),$.length===0)J.observers=null}function K1(J){x.push(J)}function a(){if(d)return;d=!0;let J=0,Z=0;try{while(J<x.length){if(++Z>Z6)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let $=x[J++];if($.color!==O)$.updateIfNecessary()}}finally{x.length=0,d=!1}}function U1(J,Z){let $=H,B=A;H=J,A=null;try{return Z()}finally{H=$,A=B}}function C(J,Z){let $=new g(J,!1,z1(Z),!1),B=()=>$.read(),Q=B;return Q.set=(z)=>{if($.write(z),l===0)a()},Q.update=(z)=>{if($.write(z($.value)),l===0)a()},Q.peek=()=>$.value,B}function i(J,Z){let $=new g(J,!1,z1(Z),!0);return()=>$.read()}function S(J){if(H===null)R("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let Z=new g(()=>{let $=J();if(typeof $==="function")(Z.cleanups??=[]).push($)},!0,v,!0);if(K1(Z),l===0)a();return()=>Z.dispose()}var X1=Symbol("error-handler");function G6(J,Z){for(let $=Z;$!==null;$=$.owner)if($.context!==null&&X1 in $.context){$.context[X1](J);return}throw J}function k(J){if(H===null){R("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(H.cleanups??=[]).push(J)}function D(J){let Z=new g(void 0,!1,v,!1);return Z.owner=H,U1(Z,()=>J(()=>Z.dispose()))}function n(){let J=globalThis.document;if(!J)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return J}function Q6(J){return J!=null&&typeof J.nodeType==="number"}function X6(J){return J.nodeType===3}var z6=new Set(["script","style"]);function t(J,Z){let $=n().createElement(J);if(Z!==null){for(let B in Z){if(B==="children"||B==="ref")continue;W6($,B,Z[B])}if(Z.ref!==void 0)U6(Z.ref,$);if("children"in Z)K6(J,Z.children),h($,Z.children)}return $}function K6(J,Z){if(Z==null||Z==="")return;if(Array.isArray(Z)&&Z.length===0)return;if(!z6.has(J.toLowerCase()))return;R(`a child of <${J.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function U6(J,Z){if(typeof J==="function")J(Z);else if(J!==null&&typeof J==="object")J.current=Z}function W6(J,Z,$){if(Z.length>2&&Z[0]==="o"&&Z[1]==="n"){J.addEventListener(Z.slice(2).toLowerCase(),$);return}if(Z==="style"&&$!==null&&typeof $==="object"){Y6(J,$);return}if(typeof $==="function")S(()=>Y1(J,Z,$()));else Y1(J,Z,$)}function Y6(J,Z){for(let $ in Z){let B=Z[$];if(typeof B==="function")S(()=>W1(J,$,B()));else W1(J,$,B)}}function W1(J,Z,$){J.style.setProperty(Z,$==null?"":String($))}function Y1(J,Z,$){if(Z==="value"||Z==="checked"||Z==="selected"){J[Z]=$;return}if(Z==="className")Z="class";if($==null||$===!1)J.removeAttribute(Z);else if($===!0)J.setAttribute(Z,"");else J.setAttribute(Z,String($))}function h(J,Z,$=null){if(Array.isArray(Z)){for(let B of Z)h(J,B,$);return}if(typeof Z==="function"){let B=J.insertBefore(n().createComment(""),$);F1(J,Z,B,{current:null});return}_1(J,Z,null,$)}function F1(J,Z,$,B){S(()=>{let Q=Z();if(typeof Q==="function")F1(J,Q,$,B);else B.current=_1(J,Q,B.current,$)})}function _1(J,Z,$,B){if($!==null&&$.length===1&&X6($[0])&&(typeof Z==="string"||typeof Z==="number"))return $[0].data=String(Z),$;let Q=F6(Z);return H1(J,$??[],Q,B),Q.length>0?Q:null}function H1(J,Z,$,B){if(Z.length>0){let z=new Set($);for(let X of Z)if(!z.has(X)&&X.parentNode===J)J.removeChild(X)}let Q=B;for(let z=$.length-1;z>=0;z--){let X=$[z];if(X.parentNode!==J||X.nextSibling!==Q)J.insertBefore(X,Q);Q=X}}function F6(J){let Z=[];return o(Z,J),Z}function o(J,Z){if(Z==null||Z===!1||Z===!0||Z==="")return;if(Array.isArray(Z)){for(let $ of Z)o(J,$);return}if(Q6(Z)){J.push(Z);return}if(typeof Z==="function"){o(J,Z());return}J.push(n().createTextNode(String(Z)))}function r(J,Z){let $;return D((B)=>{$=B,h(Z,J())}),()=>{$(),Z.textContent=""}}function L1(J,Z){let $=[],B=[],Q=[];return k(()=>{for(let z of Q)z()}),()=>{let z=J(),X=z.length,U=Array(X),W=Array(X),_=new Map;for(let Y=0;Y<$.length;Y++){let T=_.get($[Y]);if(T)T.push(Y);else _.set($[Y],[Y])}let I=Array($.length).fill(!1);for(let Y=0;Y<X;Y++){let T=z[Y],q=_.get(T);if(q!==void 0&&q.length>0){let N=q.shift();I[N]=!0,U[Y]=B[N],W[Y]=Q[N]}else{let N,w=D((f)=>{return N=Z(T,Y),f});U[Y]=N,W[Y]=w}}for(let Y=0;Y<Q.length;Y++)if(!I[Y])Q[Y]();return $=z.slice(),B=U,Q=W,U}}function L(J){let Z=i(()=>!!J.when());return()=>Z()?J.children:J.fallback??null}function s(J){let Z=L1(()=>J.each()??[],($,B)=>J.children($,B));return()=>{let $=Z();return $.length>0?$:J.fallback??null}}var L6=/^@(media|supports|container|document|layer)\b/i;function M(J,...Z){let $=typeof J==="string"?J:J.reduce((z,X,U)=>z+X+(U<Z.length?String(Z[U]):""),""),B=T6($),Q="k-"+B;return A6(B,e($,"."+Q)),Q}function M6(J){let Z=[],$="",B=0,Q="",z="",X="";for(let U=0;U<J.length;U++){let W=J[U];if(W==="{"){if(B===0){let _=Q.lastIndexOf(";");$+=Q.slice(0,_+1),X=Q.slice(_+1),Q="",z=""}else z+=W;B++}else if(W==="}")if(B--,B===0)Z.push({prelude:X,inner:z});else if(B>0)z+=W;else B=0;else if(B===0)Q+=W;else z+=W}return $+=Q,{decls:$,blocks:Z}}function e(J,Z){let{decls:$,blocks:B}=M6(J),Q="",z=$.trim();if(z)Q+=`${Z}{${z}}`;for(let{prelude:X,inner:U}of B){let W=X.trim();if(W[0]==="@")Q+=L6.test(W)?`${W}{${e(U,Z)}}`:`${W}{${U.trim()}}`;else Q+=e(U,P6(W,Z))}return Q}function P6(J,Z){return C6(J,",").map(($)=>{let B=$.trim();return B.includes("&")?B.replace(/&/g,Z):`${Z} ${B}`}).join(",")}function C6(J,Z){let $=[],B=0,Q="";for(let z=0;z<J.length;z++){let X=J[z];if(X==="("||X==="[")B++;else if(X===")"||X==="]")B--;if(X===Z&&B===0)$.push(Q),Q="";else Q+=X}return $.push(Q),$}var M1=new Map;function A6(J,Z){let $=globalThis.document;if(!$){if(!M1.has(J))M1.set(J,Z);return}N6($,J,Z)}function N6(J,Z,$){let B=J.head;for(let z of B.childNodes)if(z.nodeType===1&&z.getAttribute("data-k")===Z)return;let Q=J.createElement("style");Q.setAttribute("data-k",Z),Q.textContent=$,B.appendChild(Q)}function T6(J){let Z=5381,$=2166136261;for(let B=0;B<J.length;B++){let Q=J.charCodeAt(B);Z=(Z<<5)+Z^Q,$=Math.imul($^Q,16777619)}return(Z>>>0).toString(36)+($>>>0).toString(36)}var J1=(new URLSearchParams(location.search).get("api")??"https://jev-bitcoin-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function P1(J,Z){let $=await fetch(J1+J,{method:Z===void 0?"GET":"POST",headers:Z===void 0?void 0:{"Content-Type":"application/json"},body:Z===void 0?void 0:JSON.stringify(Z)}),B=await $.json().catch(()=>({}));if(!$.ok)throw Error(B.message??`${$.status}`);return B}var C1=(J)=>P1("/api/ask",{question:J}),A1=(J)=>P1(`/api/faq/${encodeURIComponent(J)}`);var N1=M`
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
`,Z1=M`
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
`,T1=M`
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
`,q1=M`
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
`,I1=M`
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
`,R1=M`
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
`,O1=M`
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: -10px 0 16px;
`,S1=M`
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin: -8px 0 16px;
`,j1=M`
  transition: opacity 0.2s ease;

  &.stale {
    opacity: 0.45;
  }

  .message p {
    margin: 0 0 4px;
    color: var(--muted);
  }
`,b1=M`
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
`,m1=M`
  color: var(--warn);
  font-size: 13px;
  text-align: center;
  margin: -8px 0 16px;
`;function V1(J,Z,$){if(typeof J==="function")return J(Z??{});return t(J,Z??null)}function G(J,Z,$,B,Q,z){return V1(J,Z,$)}var I6={idle:"ビットコインのこと、なんでも聞いてください。",listening:"どうぞ、お話しください。",thinking:"ふむふむ……",answer:"お答えします。",suggest:"もしかして、これのことでしょうか？",miss:"うーん、それはまだ勉強中です。",multiple:"いっぺんに聞かれると目が回ります……ひとつずつどうぞ。"},R6=`<svg viewBox="0 0 200 210" role="img" aria-label="フクロウ">
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
</svg>`;function g1(J){return G("div",{class:()=>`${I1} ${J.mood()}`,children:[G("p",{class:"bubble","aria-live":"polite",children:()=>I6[J.mood()]},void 0,!1,void 0,this),G("div",{class:"drawing",ref:(Z)=>Z.innerHTML=R6},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var $1="jev-bitcoin:history",O6=50,f1=60000;function S6(){try{let J=localStorage.getItem($1),Z=J===null?[]:JSON.parse(J);return Array.isArray(Z)?Z.filter(($)=>typeof $?.q==="string"):[]}catch{return[]}}function k1(J){try{localStorage.setItem($1,JSON.stringify(J))}catch{}}var j=C(S6());function D1(J,Z,$,B){let Q=Date.now();j.update((z)=>{let X=z[0],U=X!==void 0&&Q-X.at<f1&&(J.startsWith(X.q)||X.q.startsWith(J)),_=[{q:J,at:Q,id:$,title:B,status:Z},...U?z.slice(1):z].slice(0,O6);return k1(_),_})}function y1(J,Z){j.update(($)=>{let B=$[0];if(B===void 0||B.status!=="suggest"||B.id!==void 0)return $;if(Date.now()-B.at>f1*5)return $;let Q=[{...B,id:J,title:Z},...$.slice(1)];return k1(Q),Q})}function E1(){j.set([]);try{localStorage.removeItem($1)}catch{}}var j6={時点依存:"時期によって変わる情報です。",研究提案:"提案・研究の段階の内容で、いまのBitcoinのルールではありません。",実装依存:"ソフトウェアやそのバージョンによって変わります。",法域依存:"国や地域によって答えが変わります。",要一次確認:"最新の一次資料での確認をおすすめします。"};function w1(J){return G("div",{class:"prose",children:J.lines.map((Z)=>G("p",{children:Z},void 0,!1,void 0,this))},void 0,!1,void 0,this)}function x1(J){let Z=J.entry,$=Z.more??[],B=Z.related??[],Q=Z.sources??[],z=(Z.tags??[]).map((X)=>j6[X]).filter((X)=>X!==void 0);return G("div",{class:T1,children:[G("p",{class:"meta",children:[G("span",{children:Z.category.name},void 0,!1,void 0,this),G("a",{href:`#${Z.id}`,title:"この答えへのリンク",children:`#${Z.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),G("h3",{children:Z.title},void 0,!1,void 0,this),G(L,{when:()=>Z.answered,fallback:G("p",{class:"pending",children:"この質問への回答は準備中です。"},void 0,!1,void 0,this),children:G(w1,{lines:Z.answer},void 0,!1,void 0,this)},void 0,!1,void 0,this),G(L,{when:()=>$.length>0,children:G("details",{open:J.expand===!0,children:[G("summary",{children:"もっと詳しく"},void 0,!1,void 0,this),G(w1,{lines:$},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),G(L,{when:()=>B.length>0,children:G("div",{class:"related",children:[G("span",{class:"label",children:"関連する質問"},void 0,!1,void 0,this),B.map((X)=>G("button",{type:"button",class:"chip",onClick:()=>J.open(X.id),children:X.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)},void 0,!1,void 0,this),G(L,{when:()=>z.length>0,children:G("ul",{class:"notes",children:z.map((X)=>G("li",{children:X},void 0,!1,void 0,this))},void 0,!1,void 0,this)},void 0,!1,void 0,this),G(L,{when:()=>Q.length>0||Z.updated!==void 0,children:G("div",{class:"sources",children:[Q.map((X)=>/^https?:\/\//.test(X)?G("a",{href:X,target:"_blank",rel:"noopener noreferrer",children:X},void 0,!1,void 0,this):G("span",{children:X},void 0,!1,void 0,this)),G(L,{when:()=>Z.updated!==void 0,children:G("span",{class:"updated",children:`${Z.updated} 時点`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function v1(J){return G("div",{class:q1,children:[G("span",{class:"label",children:J.label},void 0,!1,void 0,this),J.items.map((Z)=>G("button",{type:"button",class:"chip",onClick:()=>J.open(Z.id),children:Z.title},void 0,!1,void 0,this))]},void 0,!0,void 0,this)}function b6(J){if(J.title!==void 0)return`→ ${J.title}`;if(J.status==="multiple")return"→ 質問がいくつか入っていました";if(J.status==="suggest")return"→ 近い質問がありました";return"→ 答えは見つかりませんでした"}function m6(J){let Z=new Date(J),$=`${Z.getHours()}:${String(Z.getMinutes()).padStart(2,"0")}`;return Z.toDateString()===new Date().toDateString()?$:`${Z.getMonth()+1}/${Z.getDate()} ${$}`}function h1(J){return G(L,{when:()=>j().length>0,children:G("details",{class:b1,children:[G("summary",{children:()=>`これまでの質問（${j().length}）`},void 0,!1,void 0,this),G("ol",{children:G(s,{each:j,children:(Z)=>G("li",{children:[G("button",{type:"button",onClick:()=>J.again(Z.q,Z.id),children:[G("span",{class:"q",children:Z.q},void 0,!1,void 0,this),G("span",{class:"a",children:b6(Z)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),G("span",{class:"at",children:m6(Z.at)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),G("p",{class:"foot",children:[G("span",{children:"履歴はこのブラウザの中にだけ保存されています。"},void 0,!1,void 0,this),G("button",{type:"button",class:"clear",onClick:()=>E1(),children:"履歴を消す"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)}function c1(){let J=window;return J.SpeechRecognition??J.webkitSpeechRecognition}var u1=c1()!==void 0,V6={"not-allowed":"マイクの使用が許可されていません。ブラウザの設定で、このページのマイクを許可してください。","service-not-allowed":"このブラウザでは音声入力を使えないようです。","audio-capture":"マイクが見つかりませんでした。","no-speech":"声が聞き取れませんでした。もう一度どうぞ。",network:"音声認識のサービスに接続できませんでした。","language-not-supported":"このブラウザは日本語の音声入力に対応していないようです。"};function p1(J){let Z=c1();if(Z===void 0)return J.error("このブラウザは音声入力に対応していません。"),J.end(),{stop(){}};let $=new Z;$.lang="ja-JP",$.interimResults=!0,$.continuous=!1,$.maxAlternatives=1;let B="",Q=!1;$.onresult=(z)=>{let X="",U=!1;for(let W=0;W<z.results.length;W++){let _=z.results[W];if(_===void 0)continue;X+=_[0].transcript,U=U||_.isFinal}if(B=X.trim(),U)Q=!0,J.final(B);else J.interim(B)},$.onerror=(z)=>{if(z.error==="aborted")return;J.error(V6[z.error]??"音声入力でエラーが起きました。")},$.onend=()=>{if(!Q&&B!=="")J.final(B);J.end()};try{$.start()}catch{J.error("音声入力を始められませんでした。"),J.end()}return{stop:()=>$.stop()}}var d1=500,y=5,u=(J)=>[...J].length,E=(J)=>J.trim().replace(/\s+/g," "),f6=/^[1-9][0-9]*-[1-9][0-9]*$/,k6=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="3" width="6" height="11" rx="3" />
  <path d="M5 11a7 7 0 0 0 14 0" />
  <path d="M12 18v3" />
</svg>`;function l1(){let J=C(""),Z=C(null),$=C(!1),B=C(""),Q=C(!1),z=C(!1),X=null,U,W=!1,_="",I=0,Y=()=>{if($())return"thinking";if(Q())return"listening";let K=Z();if(K===null)return B()===""?"idle":"miss";return K.status},T=async(K,F)=>{let P=++I;$.set(!0),B.set("");try{let b=await K();if(P===I)Z.set(b),F?.(b)}catch(b){if(P===I)B.set(b instanceof Error?b.message:String(b))}finally{if(P===I)$.set(!1)}},q=(K)=>{let F=E(K);if(u(F)<y||F===_)return;_=F,T(()=>C1(F),(P)=>D1(F,P.status,P.answer?.id,P.answer?.title))},N=()=>{if(clearTimeout(U),z.set(!1),W)return;let K=J.peek(),F=u(E(K));if(F>=y)U=setTimeout(()=>q(K),d1);else if(F>0)U=setTimeout(()=>z.set(!0),d1)},w=(K,F)=>{clearTimeout(U),T(async()=>{return{status:"answer",answer:await A1(K),categories:[]}},(P)=>{if(F&&P.answer!==void 0)y1(P.answer.id,P.answer.title)})},f=(K)=>w(K,!1),i1=(K)=>w(K,!0),o1=(K,F)=>{if(J.set(K),F!==void 0){_=E(K),f(F);return}_="",clearTimeout(U),q(K)},n1=()=>{if(X!==null){X.stop();return}clearTimeout(U),B.set(""),Q.set(!0),X=p1({interim:(K)=>J.set(K),final:(K)=>{if(J.set(K),u(E(K))>=y)_="",q(K);else z.set(!0)},error:(K)=>B.set(K),end:()=>{X=null,Q.set(!1)}})},p=()=>{let K=decodeURIComponent(location.hash.replace(/^#/,""));if(f6.test(K))f(K)};return p(),window.addEventListener("hashchange",p),k(()=>{window.removeEventListener("hashchange",p),clearTimeout(U),X?.stop()}),S(()=>{let K=Z();document.title=K?.answer!==void 0?`${K.answer.title} | ビットコイン Q&A`:"ビットコイン Q&A"}),G("div",{children:[G(g1,{mood:Y},void 0,!1,void 0,this),G("form",{class:R1,onSubmit:(K)=>{K.preventDefault(),clearTimeout(U);let F=J.peek();z.set(u(E(F))<y),q(F)},children:[G("input",{type:"text",autocomplete:"off",enterkeyhint:"search","aria-label":"ビットコインについての質問",placeholder:()=>Q()?"聞いています……":"例：秘密鍵をなくしたらどうなる？",maxLength:400,value:J,ref:(K)=>{if(!window.matchMedia("(pointer: coarse)").matches)K.focus()},onInput:(K)=>{X?.stop(),J.set(K.target.value),N()},onCompositionstart:()=>{W=!0,clearTimeout(U),z.set(!1)},onCompositionend:()=>{W=!1,N()}},void 0,!1,void 0,this),u1?G("button",{type:"button",class:()=>`mic ${Q()?"on":""}`,"aria-label":()=>Q()?"音声入力を止める":"声で質問する","aria-pressed":()=>Q()?"true":"false",title:()=>Q()?"音声入力を止める":"声で質問する",onClick:n1,ref:(K)=>K.innerHTML=k6},void 0,!1,void 0,this):null]},void 0,!0,void 0,this),G(L,{when:Q,children:G("p",{class:O1,children:"話し終えると、そのまま質問します。音声の認識はブラウザの機能で行います（Chrome などでは音声がブラウザ提供元のサーバで処理されます）。"},void 0,!1,void 0,this)},void 0,!1,void 0,this),G(L,{when:z,children:G("p",{class:S1,children:[y,"文字以上入力してください"]},void 0,!0,void 0,this)},void 0,!1,void 0,this),G(L,{when:()=>B()!=="",children:G("p",{class:m1,children:B},void 0,!1,void 0,this)},void 0,!1,void 0,this),G("div",{class:()=>`${j1} ${$()?"stale":""}`,children:()=>{let K=Z();if(K===null)return null;return G("div",{children:[K.answer!==void 0?G("div",{class:Z1,children:G(x1,{entry:K.answer,expand:K.expand,open:f},void 0,!1,void 0,this)},void 0,!1,void 0,this):null,(K.message??[]).length>0&&K.status!=="suggest"?G("div",{class:`${Z1} message`,children:(K.message??[]).map((F)=>G("p",{children:F},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,(K.suggestions??[]).length>0?G(v1,{label:K.status==="multiple"?"近い質問":"もしかして",items:K.suggestions??[],open:i1},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}},void 0,!1,void 0,this),G(h1,{again:o1},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function D6(){return G("main",{class:N1,children:[G(l1,{},void 0,!1,void 0,this),G("footer",{children:["答えはあらかじめ用意したもので、その場で文章を作ることはしません。質問の読み取りに ",G("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。売買の判断や価格の予想にはお答えしません。 ・ ",G("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-bitcoin",children:"ソース"},void 0,!1,void 0,this)," ・ ",G("span",{children:J1},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var a1=document.getElementById("app");if(a1)r(()=>G(D6,{},void 0,!1,void 0,this),a1);

//# debugId=487FD41A858E50EB64756E2164756E21
//# sourceMappingURL=chunk-y75kaxnw.js.map
