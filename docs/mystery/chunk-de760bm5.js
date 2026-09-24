var C6=!1,A1=new Set,O6=(J)=>console.warn(J),R6=O6,S6="kanabun [dev]: ";function k6(){return C6||globalThis.__KANABUN_DEV__===!0}function y(J){if(!k6())return;if(A1.has(J))return;A1.add(J),R6(S6+J)}var d=0,C1=1,c=2,w=3,C=null,L=null,G1=0,z1=!1,n=[],m6=1e6,i=(J,Z)=>J===Z,g6=()=>!1;function S1(J){if(!J||J.equals===void 0)return i;if(J.equals===!1)return g6;return J.equals}class D{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(J,Z,$,G){if(this.equals=$,this.isEffect=Z,G){if(this.fn=J,this.value=void 0,this.color=c,L!==null)(L.owned??=[]).push(this),this.owner=L}else this.fn=null,this.value=J,this.color=d}read(){if(this.color===w)return this.value;if(C!==null)(C.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(J){if(C!==null&&!C.isEffect)y("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,J))return;if(this.value=J,this.observers!==null)for(let Z of this.observers)Z.markStale(c)}markStale(J){if(this.color>=J)return;let Z=this.color===d;if(this.color=J,Z&&this.isEffect)k1(this);if(this.observers!==null)for(let $ of this.observers)$.markStale(C1)}updateIfNecessary(){if(this.color===d||this.color===w)return;if(this.color===C1&&this.sources!==null){for(let J of this.sources)if(J.updateIfNecessary(),this.color===c)break}if(this.color===c)this.update();this.color=d}update(){this.cleanNode();let J=C,Z=L;C=this,L=this,this.collecting=[];let $,G,W=!1;try{$=this.fn()}catch(K){W=!0,G=K}finally{C=J,L=Z}if(W){this.collecting=null,this.color=d,j6(G,this.owner);return}this.reconcileSources();let B=!this.equals(this.value,$);if(this.value=$,this.color=d,B&&this.observers!==null){for(let K of this.observers)if(K.color!==w&&K.color<c)K.color=c}}reconcileSources(){let J=this.collecting;this.collecting=null;let Z=[];for(let $ of J)if(!Z.includes($))Z.push($);if(this.sources!==null){for(let $ of this.sources)if(!Z.includes($))O1($,this)}for(let $ of Z)if(this.sources===null||!this.sources.includes($))b6($,this);this.sources=Z.length>0?Z:null}disposeOwned(){if(this.owned===null)return;let J=this.owned;this.owned=null;for(let Z=J.length-1;Z>=0;Z--)J[Z].dispose()}runCleanups(){if(this.cleanups===null)return;let J=this.cleanups;this.cleanups=null;for(let Z=J.length-1;Z>=0;Z--)J[Z]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===w)return;if(this.cleanNode(),this.sources!==null){for(let J of this.sources)O1(J,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=w}}function b6(J,Z){if(J.observers===null)J.observers=[Z];else J.observers.push(Z)}function O1(J,Z){let $=J.observers;if($===null)return;let G=$.indexOf(Z);if(G===-1)return;if($[G]=$[$.length-1],$.pop(),$.length===0)J.observers=null}function k1(J){n.push(J)}function W1(){if(z1)return;z1=!0;let J=0,Z=0;try{while(J<n.length){if(++Z>m6)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let $=n[J++];if($.color!==w)$.updateIfNecessary()}}finally{n.length=0,z1=!1}}function m1(J,Z){let $=L,G=C;L=J,C=null;try{return Z()}finally{L=$,C=G}}function B1(J,Z){let $=L;L=J;try{return Z()}finally{L=$}}function g1(){let J=new D(void 0,!1,i,!1);if(J.owner=L,L!==null)(L.owned??=[]).push(J);return J}function U(J,Z){let $=new D(J,!1,S1(Z),!1),G=()=>$.read(),W=G;return W.set=(B)=>{if($.write(B),G1===0)W1()},W.update=(B)=>{if($.write(B($.value)),G1===0)W1()},W.peek=()=>$.value,G}function b(J,Z){let $=new D(J,!1,S1(Z),!0);return()=>$.read()}function R(J){if(L===null)y("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let Z=new D(()=>{let $=J();if(typeof $==="function")(Z.cleanups??=[]).push($)},!0,i,!0);if(k1(Z),G1===0)W1();return()=>Z.dispose()}function t(J){let Z=C;C=null;try{return J()}finally{C=Z}}var R1=Symbol("error-handler");function j6(J,Z){for(let $=Z;$!==null;$=$.owner)if($.context!==null&&R1 in $.context){$.context[R1](J);return}throw J}function j(J){if(L===null){y("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(L.cleanups??=[]).push(J)}function V(J){let Z=new D(void 0,!1,i,!1);return Z.owner=L,m1(Z,()=>J(()=>Z.dispose()))}function V6(J,Z){let $=g1();return $.context={[J]:Z},$}function E(J){let Z=Symbol("context");return{id:Z,defaultValue:J,Provider($){let G=V6(Z,$.value),W=$.children,B=B1(G,()=>typeof W==="function"?W():W);return typeof B==="function"?()=>B1(G,B):B}}}function f(J){for(let Z=L;Z!==null;Z=Z.owner)if(Z.context!==null&&J.id in Z.context)return Z.context[J.id];return J.defaultValue}function Q1(){let J=globalThis.document;if(!J)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return J}function f6(J){return J!=null&&typeof J.nodeType==="number"}function y6(J){return J.nodeType===3}var w6=new Set(["script","style"]);function X1(J,Z){let $=Q1().createElement(J);if(Z!==null){for(let G in Z){if(G==="children"||G==="ref")continue;x6($,G,Z[G])}if(Z.ref!==void 0)E6(Z.ref,$);if("children"in Z)D6(J,Z.children),r($,Z.children)}return $}function D6(J,Z){if(Z==null||Z==="")return;if(Array.isArray(Z)&&Z.length===0)return;if(!w6.has(J.toLowerCase()))return;y(`a child of <${J.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function E6(J,Z){if(typeof J==="function")J(Z);else if(J!==null&&typeof J==="object")J.current=Z}function x6(J,Z,$){if(Z.length>2&&Z[0]==="o"&&Z[1]==="n"){J.addEventListener(Z.slice(2).toLowerCase(),$);return}if(Z==="style"&&$!==null&&typeof $==="object"){v6(J,$);return}if(typeof $==="function")R(()=>j1(J,Z,$()));else j1(J,Z,$)}function v6(J,Z){for(let $ in Z){let G=Z[$];if(typeof G==="function")R(()=>b1(J,$,G()));else b1(J,$,G)}}function b1(J,Z,$){J.style.setProperty(Z,$==null?"":String($))}function j1(J,Z,$){if(Z==="value"||Z==="checked"||Z==="selected"){J[Z]=$;return}if(Z==="className")Z="class";if($==null||$===!1)J.removeAttribute(Z);else if($===!0)J.setAttribute(Z,"");else J.setAttribute(Z,String($))}function r(J,Z,$=null){if(Array.isArray(Z)){for(let G of Z)r(J,G,$);return}if(typeof Z==="function"){let G=J.insertBefore(Q1().createComment(""),$);V1(J,Z,G,{current:null});return}f1(J,Z,null,$)}function V1(J,Z,$,G){R(()=>{let W=Z();if(typeof W==="function")V1(J,W,$,G);else G.current=f1(J,W,G.current,$)})}function f1(J,Z,$,G){if($!==null&&$.length===1&&y6($[0])&&(typeof Z==="string"||typeof Z==="number"))return $[0].data=String(Z),$;let W=h6(Z);return y1(J,$??[],W,G),W.length>0?W:null}function y1(J,Z,$,G){if(Z.length>0){let B=new Set($);for(let K of Z)if(!B.has(K)&&K.parentNode===J)J.removeChild(K)}let W=G;for(let B=$.length-1;B>=0;B--){let K=$[B];if(K.parentNode!==J||K.nextSibling!==W)J.insertBefore(K,W);W=K}}function h6(J){let Z=[];return K1(Z,J),Z}function K1(J,Z){if(Z==null||Z===!1||Z===!0||Z==="")return;if(Array.isArray(Z)){for(let $ of Z)K1(J,$);return}if(f6(Z)){J.push(Z);return}if(typeof Z==="function"){K1(J,Z());return}J.push(Q1().createTextNode(String(Z)))}function _1(J,Z){let $;return V((G)=>{$=G,r(Z,J())}),()=>{$(),Z.textContent=""}}function w1(J,Z){let $=[],G=[],W=[];return j(()=>{for(let B of W)B()}),()=>{let B=J(),K=B.length,Q=Array(K),X=Array(K),Y=new Map;for(let M=0;M<$.length;M++){let P=Y.get($[M]);if(P)P.push(M);else Y.set($[M],[M])}let N=Array($.length).fill(!1);for(let M=0;M<K;M++){let P=B[M],A=Y.get(P);if(A!==void 0&&A.length>0){let I=A.shift();N[I]=!0,Q[M]=G[I],X[M]=W[I]}else{let I,k=V((x)=>{return I=Z(P,M),x});Q[M]=I,X[M]=k}}for(let M=0;M<W.length;M++)if(!N[M])W[M]();return $=B.slice(),G=Q,W=X,Q}}function q(J){let Z=b(()=>!!J.when());return()=>Z()?J.children:J.fallback??null}function S(J){let Z=w1(()=>J.each()??[],($,G)=>J.children($,G));return()=>{let $=Z();return $.length>0?$:J.fallback??null}}var u6=E(null);function a(J,Z){let $=Z!==void 0,G=$?J:()=>!0,W=$?Z:J,B=U(void 0),K=U(void 0),Q=U(!1),X=f(u6),Y=!1,N=!1,M=0,P=()=>{if(X!==null&&!Y&&!N)X.increment(),Y=!0},A=()=>{if(Y)Y=!1,X.decrement()},I=(T,h)=>{let u=++M;Q.set(!0),P();let l={value:B.peek(),refetching:h};Promise.resolve().then(()=>W(T,l)).then((p)=>{if(u!==M)return;B.set(p),K.set(void 0),Q.set(!1),N=!0,A()},(p)=>{if(u!==M)return;K.set(p),Q.set(!1),A()})};if($)R(()=>{let T=G();if(T===!1||T===null||T===void 0){M++,Q.set(!1),A();return}t(()=>I(T,!1))});else I(!0,!1);j(()=>{M++,A()});let k=()=>B(),x=k;return x.loading=()=>Q(),x.error=()=>K(),[k,{mutate:(T)=>{M++,Q.set(!1),K.set(void 0),A(),N=!0,B.set(T)},refetch:()=>{let T=t(G);if(T===!1||T===null||T===void 0)return;I(T,!0)}}]}var l6=/^@(media|supports|container|document|layer)\b/i;function F(J,...Z){let $=typeof J==="string"?J:J.reduce((B,K,Q)=>B+K+(Q<Z.length?String(Z[Q]):""),""),G=t6($),W="k-"+G;return o6(G,H1($,"."+W)),W}function p6(J){let Z=[],$="",G=0,W="",B="",K="";for(let Q=0;Q<J.length;Q++){let X=J[Q];if(X==="{"){if(G===0){let Y=W.lastIndexOf(";");$+=W.slice(0,Y+1),K=W.slice(Y+1),W="",B=""}else B+=X;G++}else if(X==="}")if(G--,G===0)Z.push({prelude:K,inner:B});else if(G>0)B+=X;else G=0;else if(G===0)W+=X;else B+=X}return $+=W,{decls:$,blocks:Z}}function H1(J,Z){let{decls:$,blocks:G}=p6(J),W="",B=$.trim();if(B)W+=`${Z}{${B}}`;for(let{prelude:K,inner:Q}of G){let X=K.trim();if(X[0]==="@")W+=l6.test(X)?`${X}{${H1(Q,Z)}}`:`${X}{${Q.trim()}}`;else W+=H1(Q,i6(X,Z))}return W}function i6(J,Z){return a6(J,",").map(($)=>{let G=$.trim();return G.includes("&")?G.replace(/&/g,Z):`${Z} ${G}`}).join(",")}function a6(J,Z){let $=[],G=0,W="";for(let B=0;B<J.length;B++){let K=J[B];if(K==="("||K==="[")G++;else if(K===")"||K==="]")G--;if(K===Z&&G===0)$.push(W),W="";else W+=K}return $.push(W),$}var D1=new Map;function o6(J,Z){let $=globalThis.document;if(!$){if(!D1.has(J))D1.set(J,Z);return}n6($,J,Z)}function n6(J,Z,$){let G=J.head;for(let B of G.childNodes)if(B.nodeType===1&&B.getAttribute("data-k")===Z)return;let W=J.createElement("style");W.setAttribute("data-k",Z),W.textContent=$,G.appendChild(W)}function t6(J){let Z=5381,$=2166136261;for(let G=0;G<J.length;G++){let W=J.charCodeAt(G);Z=(Z<<5)+Z^W,$=Math.imul($^W,16777619)}return(Z>>>0).toString(36)+($>>>0).toString(36)}function M1(J,Z,$){if(typeof J==="function")return J(Z??{});return X1(J,Z??null)}function v1(J){let Z=new URL(J,"http://kanabun.local"),$={};return Z.searchParams.forEach((G,W)=>{$[W]=G}),{pathname:Z.pathname,search:Z.search,hash:Z.hash,query:$}}function E1(J){let Z=[];for(let $ of J.split("/"))if($!=="")Z.push($);return Z}function x1(J){try{return decodeURIComponent(J)}catch{return J}}function h1(J,Z){let $=E1(J),G=E1(Z),W={};for(let B=0;B<$.length;B++){let K=$[B];if(K[0]==="*"){let X=K.slice(1),Y=G.slice(B);if(X!=="")W[X]=Y.map(x1).join("/");return{params:W,rest:"/"+Y.join("/")}}let Q=G[B];if(Q===void 0)return null;if(K[0]===":")W[K.slice(1)]=x1(Q);else if(K!==Q)return null}return G.length===$.length?{params:W,rest:null}:null}function d1(J,Z){let $=Z.startsWith("/")?Z:"/"+Z,G=new URL(J,"http://kanabun.local"+$);return G.pathname+G.search+G.hash}function c1(){let J=globalThis.window;if(!J)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return J}function Y1(J=c1()){return{location:()=>J.location.pathname+J.location.search+J.location.hash,push:($)=>J.history.pushState(null,"",$),replace:($)=>J.history.replaceState(null,"",$),subscribe($){return J.addEventListener("popstate",$),()=>J.removeEventListener("popstate",$)}}}function U1(J=c1()){return{location:()=>{let $=J.location.hash,G=$.startsWith("#")?$.slice(1):$;return G===""?"/":G},push:($)=>{J.location.hash=$},replace:($)=>J.history.replaceState(null,"","#"+$),subscribe($){return J.addEventListener("hashchange",$),()=>J.removeEventListener("hashchange",$)}}}var l1=E(null),L1=E(null),u1=E(null),p1=Object.freeze({});function r6(J){let Z=f(l1);if(Z===null)throw Error(`kanabun/router: ${J} must be used inside a <Router>.`);return Z}function q1(J){let Z=J.source??Y1(),$=U(Z.location());j(Z.subscribe(()=>$.set(Z.location())));let G=b(()=>v1($())),W=(B,K)=>{let Q=e6(B)?B:d1(B,G().pathname);if(K?.replace)Z.replace(Q);else Z.push(Q);$.set(Z.location())};return l1.Provider({value:{location:G,navigate:W},children:J.children})}function N1(){return f(L1)??(()=>p1)}function s(J){let{location:Z}=r6("<Route>"),$=f(L1),W=f(u1)??(()=>Z().pathname),B=b(()=>h1(J.path,W())),K=b(()=>B()!==null),Q=b(()=>{let P=B()?.params??p1;return $===null?P:{...$(),...P}}),X=()=>B()?.rest??"/",Y=()=>L1.Provider({value:Q,children:()=>u1.Provider({value:X,children:()=>{if(J.component!==void 0)return J.component({params:Q});if(typeof J.children==="function")return J.children(Q);return J.children}})}),N=i1(),M=()=>{if(K())return N(Y);return N(null),J.fallback??null};return M.$matched=K,M.$content=Y,M}function i1(){let J=null;return j(()=>J?.()),(Z)=>{if(J!==null)J(),J=null;if(Z===null)return null;let $;return J=V((G)=>{return $=Z(),G}),$}}function s6(J){return typeof J==="function"&&"$matched"in J}function a1(J,Z){if(Array.isArray(J))for(let $ of J)a1($,Z);else if(s6(J))Z.push(J)}function P1(J){let Z=[];a1(J.children,Z);let $=i1();return()=>{for(let G of Z)if(G.$matched())return $(G.$content);return $(null),J.fallback??null}}function e6(J){return/^[a-z][a-z0-9+.-]*:/i.test(J)||J.startsWith("//")}var e=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function o1(J){return/^https?:\/\//i.test(J)?J:`${e}/${J.replace(/^\/+/,"")}`}async function J1(J,Z){let $=await fetch(e+J,{method:Z===void 0?"GET":"POST",headers:Z===void 0?void 0:{"Content-Type":"application/json"},body:Z===void 0?void 0:JSON.stringify(Z)}),G=await $.json().catch(()=>({}));if(!$.ok)throw Error(G.message??`${$.status}`);return G}var n1=()=>J1("/api/cases"),t1=(J)=>J1("/api/new",{case:J}),r1=(J,Z)=>J1("/api/act",{state:J,input:Z}),s1=(J,Z)=>J1("/api/accuse",{state:J,answer:Z});var J6=F`
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 20px 56px;

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

  .byline {
    color: var(--muted);
    font-size: 13px;
    margin: 2px 0 20px;
  }

  footer {
    color: var(--muted);
    font-size: 12px;
    margin-top: 28px;
    font-family: var(--ui);
  }

  footer a {
    color: inherit;
  }
`,Z6=F`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,O=F`
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
    font-family: var(--ui);
  }
`,$6=F`
  .name {
    font-size: 17px;
    margin: 0 0 8px;
  }

  .desc {
    color: var(--muted);
    font-size: 13.5px;
    margin: 0 0 4px;
  }

  .people {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }

  .person {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .person .who {
    font-size: 14px;
    line-height: 1.3;
  }

  .person .role {
    font-size: 12px;
    color: var(--muted);
  }
`,z6=F`
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--bg);
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 19px;

  /* The picture covers the glyph rather than replacing it, so the glyph is
     what shows while the picture loads and what is left if it never does. */
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,G6=F`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .item {
    border-left: 2px solid var(--accent);
    padding-left: 10px;
  }

  .item .name {
    font-size: 13.5px;
  }

  .item .desc {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
  }
`,o=F`
  color: var(--muted);
  font-size: 13px;
`,W6=F`
  min-height: 260px;

  .entry {
    margin: 0 0 16px;
  }

  .entry:last-child {
    margin-bottom: 0;
  }

  .entry.said {
    border-top: 1px solid var(--line);
    padding-top: 14px;
  }

  .entry p {
    margin: 0 0 4px;
  }

  .entry.miss p {
    color: var(--muted);
    font-style: italic;
  }

  .typed {
    font-family: var(--ui);
    font-size: 13px;
    color: var(--accent);
    margin: 0 0 6px;
  }

  .did {
    font-size: 12.5px;
    color: var(--muted);
    font-family: var(--ui);
    margin: 0 0 6px;
  }

  .speaker {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 6px;
  }

  .speaker .who {
    font-size: 12.5px;
    color: var(--muted);
    font-family: var(--ui);
  }

  .found {
    display: inline-block;
    font-family: var(--ui);
    font-size: 12px;
    border: 1px solid var(--accent);
    color: var(--accent);
    border-radius: 999px;
    padding: 1px 10px;
    margin-top: 4px;
  }

  .moved {
    font-family: var(--ui);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.06em;
  }

  /* The room the player just walked into, set apart from what they did to
     get there: the log reads as narration, and this is the stage direction. */
  .arrival {
    border-left: 2px solid var(--line);
    padding-left: 12px;
    margin-top: 8px;
  }

  .arrival p {
    color: var(--muted);
  }

  /* The detective thinking aloud, unprompted. It follows the turn that set it
     off but is not part of it, so it sits apart and reads as an aside. */
  .interlude {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed var(--line);
  }

  .interlude p {
    font-style: italic;
  }

  /* An element of the truth the player did not reach. It is counted and left
     unnamed: naming it here would hand over the part of the case they were
     still working on. */
  .score .veiled {
    color: var(--muted);
    font-style: italic;
  }

  h3 {
    font-size: 19px;
    margin: 0 0 10px;
  }

  /* An ending the case counts as a win. The log is otherwise deliberately
     flat — every turn looks like every other turn — so the one place worth
     breaking that is the one the player played for. */
  .entry.won {
    border-top: 2px solid var(--accent);
    padding-top: 18px;
  }

  .entry.won h3 {
    font-size: 23px;
    color: var(--accent);
  }

  .solved {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--ui);
    font-size: 13px;
    letter-spacing: 0.22em;
    color: var(--accent);
    margin: 0 0 8px;
  }

  .solved::before,
  .solved::after {
    content: "";
    flex: 1 1 auto;
    height: 1px;
    background: var(--accent);
    opacity: 0.4;
  }

  /* The badge arrives rather than simply being there: the ending is read
     from the top down, and this is the line that answers the question the
     player has been holding. A player who has asked for less motion gets the
     same screen without it. */
  .entry.won .solved {
    animation: jev-solved 700ms ease-out both;
  }

  @keyframes jev-solved {
    from {
      opacity: 0;
      letter-spacing: 0.02em;
    }
    to {
      opacity: 1;
      letter-spacing: 0.22em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .entry.won .solved {
      animation: none;
    }
  }

  .score {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px;
    font-family: var(--ui);
    font-size: 13px;
    margin-top: 14px;
  }

  .score .mark {
    color: var(--accent);
  }

  .score .mark.no {
    color: var(--muted);
  }

  .coherence {
    margin-top: 12px;
    font-family: var(--ui);
    font-size: 13px;
    color: var(--muted);
  }

  .track {
    background: var(--bar);
    border-radius: 3px;
    height: 6px;
    margin: 6px 0;
  }

  .track > div {
    background: var(--accent);
    height: 6px;
    border-radius: 3px;
  }

  /* The result as it will be posted, shown before it is, so the player can
     see that it gives nothing away. */
  .share {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }

  .share pre {
    font-family: var(--ui);
    font-size: 13px;
    white-space: pre-wrap;
    color: var(--muted);
    margin: 0 0 10px;
  }

  .share .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`,F1=F`
  form {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  form.stacked {
    display: block;
  }

  input[type="text"],
  textarea {
    font: inherit;
    flex: 1 1 auto;
    min-width: 0;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--fg);
  }

  textarea {
    width: 100%;
    min-height: 130px;
    resize: vertical;
    line-height: 1.8;
  }

  .hint {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--ui);
    margin: 8px 0 0;
  }

  .error {
    color: var(--warn);
    font-size: 13px;
    font-family: var(--ui);
    margin: 8px 0 0;
  }
`,I1=F`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`,B6=F`
  margin-top: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,K6=F`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,Q6=F`
  display: flex;
  flex-direction: column;
  gap: 12px;

  a {
    display: block;
    text-decoration: none;
    color: inherit;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 18px;
  }

  a:hover {
    border-color: var(--accent);
  }

  .title {
    font-size: 18px;
    margin: 0 0 4px;
  }

  .byline {
    color: var(--muted);
    font-size: 13px;
    margin: 0;
  }

  .hash {
    font-family: var(--ui);
    font-size: 12px;
    color: var(--accent);
    margin: 6px 0 0;
  }
`,Z1=F`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function z(J,Z,$,G,W,B){return M1(J,Z,$)}function X6(){let[J]=a(()=>n1());return z("div",{children:[z("div",{class:"titlebar",children:z("div",{children:[z("h1",{children:"事件簿"},void 0,!1,void 0,this),z("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>J.loading(),children:z("p",{class:Z1,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>J.error()!==void 0,children:z("div",{class:O,children:[z("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),z("p",{class:o,children:()=>String(J.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),z("div",{class:Q6,children:z(S,{each:()=>J()?.cases??[],children:(Z)=>z("a",{href:`#${Z.id}`,children:[z("p",{class:"title",children:Z.title},void 0,!1,void 0,this),z(q,{when:()=>Z.byline!==void 0,children:z("p",{class:"byline",children:Z.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),z("p",{class:"hash",children:`#${Z.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function _6(J){let Z=J.person,$=U(0);return z("div",{class:z6,children:[z("span",{children:Z.avatar||"？"},void 0,!1,void 0,this),()=>{if(!Z.image||$()>=2)return null;let G=o1(Z.image);return z("img",{src:$()===0?G:`${G}${G.includes("?")?"&":"?"}retry=${$()}`,alt:Z.name,loading:"lazy",onError:()=>$.update((W)=>W+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function H6(J){return z("div",{class:O,children:[z("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),z("div",{class:$6,children:[z("p",{class:"name",children:()=>J.view().scene.name},void 0,!1,void 0,this),()=>J.view().scene.description.map((Z)=>z("p",{class:"desc",children:Z},void 0,!1,void 0,this)),z("div",{class:"people",children:z(S,{each:()=>J.view().people??[],fallback:z("p",{class:o,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(Z)=>z("div",{class:"person",children:[z(_6,{person:Z},void 0,!1,void 0,this),z("div",{children:[z("div",{class:"who",children:Z.name},void 0,!1,void 0,this),z("div",{class:"role",children:Z.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function M6(J){return z("div",{class:O,children:[z("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),z("div",{class:G6,children:z(S,{each:()=>J.view().evidence??[],fallback:z("p",{class:o,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(Z)=>z("div",{class:"item",children:[z("div",{class:"name",children:Z.name},void 0,!1,void 0,this),z("div",{class:"desc",children:Z.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Y6(J){let Z=J.entry;if(Z.kind==="narration")return z("div",{class:"entry",children:Z.lines.map(($)=>z("p",{children:$},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(Z.kind==="answer")return z("div",{class:"entry said",children:z("p",{class:"typed",children:Z.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(Z.kind==="ending")return z(J4,{verdict:Z.verdict,share:Z.share},void 0,!1,void 0,this);return z("div",{class:Z.matched?"entry said":"entry said miss",children:[z("p",{class:"typed",children:"> "+Z.input},void 0,!1,void 0,this),Z.speaker?z("div",{class:"speaker",children:[z(_6,{person:Z.speaker},void 0,!1,void 0,this),z("div",{class:"who",children:Z.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,Z.did?z("p",{class:"did",children:Z.did},void 0,!1,void 0,this):null,Z.lines.map(($)=>z("p",{children:$},void 0,!1,void 0,this)),Z.gained.map(($)=>z("div",{class:"found",children:"見つけた: "+$.name},void 0,!1,void 0,this)),Z.moved?z("div",{class:"moved",children:"— "+Z.moved+" —"},void 0,!1,void 0,this):null,Z.arrival.length>0?z("div",{class:"arrival",children:Z.arrival.map(($)=>z("p",{children:$},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,Z.interlude.length>0?z("div",{class:"interlude",children:Z.interlude.map(($)=>z("p",{children:$},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function J4(J){let Z=J.verdict,$=Z.correct?`犯人を言い当てた（${Z.named_name}）`:Z.named_name?`${Z.named_name}を指した`:"犯人を名指ししなかった",G=(Y,N)=>[z("span",{class:Y?"mark":"mark no",children:Y?"○":"×"},void 0,!1,void 0,this),z("span",{children:N},void 0,!1,void 0,this)],W=Z.points.filter((Y)=>Y.hit),B=Z.points.length-W.length,K=`${Math.round(100*Z.coherence/(Z.coherence_top||1))}%`,Q=Z.celebrate===!0,X=U6(Z)?"完 全 解 決":"事 件 解 決";return z("div",{class:Q?"entry said won":"entry said",children:[Q?z("p",{class:"solved",children:X},void 0,!1,void 0,this):null,z("h3",{children:Z.title},void 0,!1,void 0,this),Z.text.map((Y)=>z("p",{children:Y},void 0,!1,void 0,this)),z("div",{class:"score",children:[G(Z.correct,$),W.map((Y)=>G(!0,Y.label)),B>0?[z("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),z("span",{class:"veiled",children:`辿り着かなかったことが、あと ${B} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),z("div",{class:"coherence",children:[`筋の通り ${Z.coherence.toFixed(1)} / ${Z.coherence_top}`,z("div",{class:"track",children:z("div",{style:{width:K}},void 0,!1,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>Z.coherence_legend!==void 0,children:Z.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this),J.share?z(z4,{text:Z4(Z,J.share),title:J.share.title},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function U6(J){if(J.celebrate!==!0)return!1;return J.complete===!0||J.correct&&J.points.every((Z)=>Z.hit)}function Z4(J,Z){let $=J.points.filter((B)=>B.hit).length,G=U6(J)?"完全解決":J.celebrate===!0?"事件解決":"未解決",W=J.points.map((B)=>B.hit?"○":"×").join("");return[`『${Z.title}』${G}`,`犯人 ${J.correct?"○":"×"}／真相 ${W} ${$}/${J.points.length}`,`筋の通り ${J.coherence.toFixed(1)}/${J.coherence_top}・${Z.turns}手`,"#jevmystery"].join(`
`)}function $4(){let J=new URL(location.href);return J.searchParams.delete("api"),J.toString()}function z4(J){let Z=$4(),$=U(!1),G=typeof navigator.share==="function",W=()=>{navigator.share({title:J.title,text:J.text,url:Z}).catch(()=>{})},B=async()=>{let K=`${J.text}
${Z}`;try{await navigator.clipboard.writeText(K)}catch{let Q=document.createElement("textarea");Q.value=K,Q.style.position="fixed",Q.style.opacity="0",document.body.appendChild(Q),Q.select(),document.execCommand("copy"),Q.remove()}$.set(!0),setTimeout(()=>$.set(!1),2000)};return z("div",{class:"share",children:[z("pre",{children:J.text},void 0,!1,void 0,this),z("div",{class:"buttons",children:[G?z("button",{type:"button",class:"secondary",onClick:W,children:"共有する"},void 0,!1,void 0,this):null,z("button",{type:"button",class:"secondary",onClick:()=>void B(),children:()=>$()?"コピーしました":"結果をコピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var T1=(J)=>`jev-mystery:${J}`;function G4(J){try{let Z=localStorage.getItem(T1(J));return Z===null?null:JSON.parse(Z)}catch{return null}}function W4(J,Z){try{localStorage.setItem(T1(J),JSON.stringify(Z))}catch{}}function B4(J){try{localStorage.removeItem(T1(J))}catch{}}function L6(){let J=N1(),[Z,{refetch:$}]=a(()=>J().case??!1,(_)=>t1(_)),G=U(""),W=U(null),B=U([]),K=U("playing"),Q=U(""),X=U(!1),Y=U(""),N=U(""),M=U([]),P=U(0),A=null,I=null,k=window.matchMedia("(pointer: coarse)").matches,x=()=>J().case??"",v="";R(()=>{let _=Z();if(_===void 0)return;document.title=_.title,Q.set(""),Y.set(""),v=x();let H=G4(v);if(H!==null){G.set(H.token),W.set(H.view),B.set(H.entries),K.set(H.phase),N.set(H.beforeAnswer),M.set(H.hints),P.set(H.shown),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}));return}G.set(_.state),W.set(_.view);let g=_.arrival??[];B.set([{kind:"narration",lines:_.opening},{kind:"narration",lines:_.incident},...g.length>0?[{kind:"narration",lines:g}]:[]]),K.set("playing"),N.set(""),M.set([]),P.set(0)}),R(()=>{let _=W();if(_===null||v==="")return;W4(v,{token:G(),view:_,entries:B(),phase:K(),beforeAnswer:N(),hints:M(),shown:P()})});let T=()=>{W.set(null),B4(v),$()},h=(_)=>{B.update((H)=>[...H,_]),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}))},u=(_)=>Y.set(_ instanceof Error?_.message:String(_)),l=async(_)=>{if(X.peek()||_==="")return;X.set(!0),Y.set("");try{let H=await r1(G.peek(),_);if(G.set(H.state),W.set(H.view),h({kind:"turn",input:_,matched:H.matched,did:H.did,speaker:H.speaker,lines:H.text,gained:H.gained??[],moved:H.moved_to===void 0?void 0:H.view.scene.name,arrival:H.arrival??[],interlude:H.interlude??[]}),H.finale===!0)K.set("accusing")}catch(H){u(H)}finally{if(X.set(!1),!k)I?.focus()}},p=async(_)=>{if(X.peek()||_==="")return;X.set(!0),Y.set(""),h({kind:"answer",text:_});try{let H=G.peek(),g=await s1(H,_);if(N.set(H),G.set(g.state),g.hints!==void 0&&g.hints.length>0)M.set(g.hints);h({kind:"ending",verdict:g,share:{title:Z()?.title??"",turns:W()?.turn??0}}),K.set("closed")}catch(H){u(H)}finally{X.set(!1)}},N6=()=>{if(X.peek()||N.peek()==="")return;G.set(N.peek()),Y.set(""),h({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),K.set("accusing")},m=()=>W(),P6=()=>{return z("div",{children:[z(q,{when:()=>m().finale_open&&K()==="playing",children:z("div",{class:K6,children:[z("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),z("button",{type:"button",disabled:X,onClick:()=>l(m().finale_label??"全員を集める"),children:()=>m().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),z("div",{class:Z6,children:[z("div",{children:[z(H6,{view:m},void 0,!1,void 0,this),z(M6,{view:m},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z("div",{children:[z("div",{class:`${O} ${W6}`,ref:(_)=>A=_,children:[z(S,{each:B,children:(_)=>z(Y6,{entry:_},void 0,!1,void 0,this)},void 0,!1,void 0,this),z(q,{when:X,children:z("p",{class:Z1,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z(q,{when:()=>K()!=="closed",fallback:()=>z(I6,{},void 0,!1,void 0,this),children:()=>z(F6,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>M().length>0,children:()=>z(T6,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},F6=()=>z("div",{class:`${O} ${F1}`,children:[z(q,{when:()=>K()==="playing",fallback:()=>z(A6,{},void 0,!1,void 0,this),children:z("div",{children:[z("form",{onSubmit:(_)=>{_.preventDefault();let H=Q.peek().trim();if(Q.set(""),k)I?.blur();l(H)},children:[z("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:Q,disabled:X,ref:(_)=>{if(I=_,!k)I.focus()},onInput:(_)=>Q.set(_.target.value)},void 0,!1,void 0,this),z("button",{type:"submit",disabled:X,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),z(q,{when:()=>m().finale_open,children:z("div",{class:I1,children:[z("button",{type:"button",class:"secondary",disabled:X,onClick:()=>l(m().finale_label??"全員を集める"),children:()=>m().finale_label??"全員を集める"},void 0,!1,void 0,this),z("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>Y()!=="",children:z("p",{class:"error",children:Y},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),I6=()=>z("div",{class:`${O} ${F1}`,children:[z("button",{type:"button",class:"secondary",disabled:X,onClick:N6,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),z("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),T6=()=>z("div",{class:`${O} ${B6}`,children:[z(S,{each:()=>M().slice(0,P()),children:(_,H)=>z("p",{children:`ヒント${H+1}　${_}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>P()<M().length,children:z("button",{type:"button",class:"secondary",onClick:()=>P.update((_)=>_+1),children:()=>P()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),A6=()=>{let _=U("");return z("div",{children:[z("form",{class:"stacked",onSubmit:(H)=>{H.preventDefault(),p(_.peek().trim())},children:[z("textarea",{placeholder:"誰が、どうやって、なぜ。",value:_,disabled:X,ref:(H)=>H.focus(),onInput:(H)=>_.set(H.target.value)},void 0,!1,void 0,this),z("p",{children:z("button",{type:"submit",disabled:X,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),z("div",{class:I1,children:[z("button",{type:"button",class:"secondary",disabled:X,onClick:()=>K.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),z("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return z("div",{children:[z("div",{class:"titlebar",children:[z("div",{children:[z("h1",{children:()=>Z()?.title??"……"},void 0,!1,void 0,this),z("p",{class:"byline",children:()=>Z()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z(q,{when:()=>Z()!==void 0,children:z("button",{type:"button",class:"secondary",disabled:X,onClick:T,children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z(q,{when:()=>Z.error()!==void 0,children:z("div",{class:O,children:[z("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),z("p",{children:z("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),z(q,{when:()=>W()!==null,children:P6},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function K4(){return z("main",{class:J6,children:[z(P1,{children:[z(s,{path:"/",component:X6},void 0,!1,void 0,this),z(s,{path:"/:case",component:L6},void 0,!1,void 0,this)]},void 0,!0,void 0,this),z("footer",{children:[z("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",z("span",{children:e},void 0,!1,void 0,this)," ・ ソースは ",z("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",z("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Q4(){return z(q1,{source:U1(),children:()=>z(K4,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var q6=document.getElementById("app");if(q6)_1(()=>z(Q4,{},void 0,!1,void 0,this),q6);

//# debugId=0074AF9BF960249164756E2164756E21
//# sourceMappingURL=chunk-de760bm5.js.map
