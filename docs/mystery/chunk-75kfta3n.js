var W6=!1,L1=new Set,X6=(Z)=>console.warn(Z),H6=X6,_6="kanabun [dev]: ";function M6(){return W6||globalThis.__KANABUN_DEV__===!0}function b(Z){if(!M6())return;if(L1.has(Z))return;L1.add(Z),H6(_6+Z)}var E=0,q1=1,x=2,f=3,I=null,U=null,r=0,s=!1,c=[],Y6=1e6,v=(Z,J)=>Z===J,U6=()=>!1;function F1(Z){if(!Z||Z.equals===void 0)return v;if(Z.equals===!1)return U6;return Z.equals}class y{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(Z,J,$,z){if(this.equals=$,this.isEffect=J,z){if(this.fn=Z,this.value=void 0,this.color=x,U!==null)(U.owned??=[]).push(this),this.owner=U}else this.fn=null,this.value=Z,this.color=E}read(){if(this.color===f)return this.value;if(I!==null)(I.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(Z){if(I!==null&&!I.isEffect)b("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,Z))return;if(this.value=Z,this.observers!==null)for(let J of this.observers)J.markStale(x)}markStale(Z){if(this.color>=Z)return;let J=this.color===E;if(this.color=Z,J&&this.isEffect)A1(this);if(this.observers!==null)for(let $ of this.observers)$.markStale(q1)}updateIfNecessary(){if(this.color===E||this.color===f)return;if(this.color===q1&&this.sources!==null){for(let Z of this.sources)if(Z.updateIfNecessary(),this.color===x)break}if(this.color===x)this.update();this.color=E}update(){this.cleanNode();let Z=I,J=U;I=this,U=this,this.collecting=[];let $,z,G=!1;try{$=this.fn()}catch(Q){G=!0,z=Q}finally{I=Z,U=J}if(G){this.collecting=null,this.color=E,q6(z,this.owner);return}this.reconcileSources();let B=!this.equals(this.value,$);if(this.value=$,this.color=E,B&&this.observers!==null){for(let Q of this.observers)if(Q.color!==f&&Q.color<x)Q.color=x}}reconcileSources(){let Z=this.collecting;this.collecting=null;let J=[];for(let $ of Z)if(!J.includes($))J.push($);if(this.sources!==null){for(let $ of this.sources)if(!J.includes($))N1($,this)}for(let $ of J)if(this.sources===null||!this.sources.includes($))L6($,this);this.sources=J.length>0?J:null}disposeOwned(){if(this.owned===null)return;let Z=this.owned;this.owned=null;for(let J=Z.length-1;J>=0;J--)Z[J].dispose()}runCleanups(){if(this.cleanups===null)return;let Z=this.cleanups;this.cleanups=null;for(let J=Z.length-1;J>=0;J--)Z[J]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===f)return;if(this.cleanNode(),this.sources!==null){for(let Z of this.sources)N1(Z,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=f}}function L6(Z,J){if(Z.observers===null)Z.observers=[J];else Z.observers.push(J)}function N1(Z,J){let $=Z.observers;if($===null)return;let z=$.indexOf(J);if(z===-1)return;if($[z]=$[$.length-1],$.pop(),$.length===0)Z.observers=null}function A1(Z){c.push(Z)}function e(){if(s)return;s=!0;let Z=0,J=0;try{while(Z<c.length){if(++J>Y6)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let $=c[Z++];if($.color!==f)$.updateIfNecessary()}}finally{c.length=0,s=!1}}function I1(Z,J){let $=U,z=I;U=Z,I=null;try{return J()}finally{U=$,I=z}}function J1(Z,J){let $=U;U=Z;try{return J()}finally{U=$}}function T1(){let Z=new y(void 0,!1,v,!1);if(Z.owner=U,U!==null)(U.owned??=[]).push(Z);return Z}function L(Z,J){let $=new y(Z,!1,F1(J),!1),z=()=>$.read(),G=z;return G.set=(B)=>{if($.write(B),r===0)e()},G.update=(B)=>{if($.write(B($.value)),r===0)e()},G.peek=()=>$.value,z}function k(Z,J){let $=new y(Z,!1,F1(J),!0);return()=>$.read()}function R(Z){if(U===null)b("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let J=new y(()=>{let $=Z();if(typeof $==="function")(J.cleanups??=[]).push($)},!0,v,!0);if(A1(J),r===0)e();return()=>J.dispose()}function u(Z){let J=I;I=null;try{return Z()}finally{I=J}}var P1=Symbol("error-handler");function q6(Z,J){for(let $=J;$!==null;$=$.owner)if($.context!==null&&P1 in $.context){$.context[P1](Z);return}throw Z}function m(Z){if(U===null){b("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(U.cleanups??=[]).push(Z)}function g(Z){let J=new y(void 0,!1,v,!1);return J.owner=U,I1(J,()=>Z(()=>J.dispose()))}function N6(Z,J){let $=T1();return $.context={[Z]:J},$}function D(Z){let J=Symbol("context");return{id:J,defaultValue:Z,Provider($){let z=N6(J,$.value),G=$.children,B=J1(z,()=>typeof G==="function"?G():G);return typeof B==="function"?()=>J1(z,B):B}}}function j(Z){for(let J=U;J!==null;J=J.owner)if(J.context!==null&&Z.id in J.context)return J.context[Z.id];return Z.defaultValue}function $1(){let Z=globalThis.document;if(!Z)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return Z}function P6(Z){return Z!=null&&typeof Z.nodeType==="number"}function F6(Z){return Z.nodeType===3}var A6=new Set(["script","style"]);function K1(Z,J){let $=$1().createElement(Z);if(J!==null){for(let z in J){if(z==="children"||z==="ref")continue;C6($,z,J[z])}if(J.ref!==void 0)T6(J.ref,$);if("children"in J)I6(Z,J.children),p($,J.children)}return $}function I6(Z,J){if(J==null||J==="")return;if(Array.isArray(J)&&J.length===0)return;if(!A6.has(Z.toLowerCase()))return;b(`a child of <${Z.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function T6(Z,J){if(typeof Z==="function")Z(J);else if(Z!==null&&typeof Z==="object")Z.current=J}function C6(Z,J,$){if(J.length>2&&J[0]==="o"&&J[1]==="n"){Z.addEventListener(J.slice(2).toLowerCase(),$);return}if(J==="style"&&$!==null&&typeof $==="object"){O6(Z,$);return}if(typeof $==="function")R(()=>O1(Z,J,$()));else O1(Z,J,$)}function O6(Z,J){for(let $ in J){let z=J[$];if(typeof z==="function")R(()=>C1(Z,$,z()));else C1(Z,$,z)}}function C1(Z,J,$){Z.style.setProperty(J,$==null?"":String($))}function O1(Z,J,$){if(J==="value"||J==="checked"||J==="selected"){Z[J]=$;return}if(J==="className")J="class";if($==null||$===!1)Z.removeAttribute(J);else if($===!0)Z.setAttribute(J,"");else Z.setAttribute(J,String($))}function p(Z,J,$=null){if(Array.isArray(J)){for(let z of J)p(Z,z,$);return}if(typeof J==="function"){let z=Z.insertBefore($1().createComment(""),$);R1(Z,J,z,{current:null});return}S1(Z,J,null,$)}function R1(Z,J,$,z){R(()=>{let G=J();if(typeof G==="function")R1(Z,G,$,z);else z.current=S1(Z,G,z.current,$)})}function S1(Z,J,$,z){if($!==null&&$.length===1&&F6($[0])&&(typeof J==="string"||typeof J==="number"))return $[0].data=String(J),$;let G=R6(J);return k1(Z,$??[],G,z),G.length>0?G:null}function k1(Z,J,$,z){if(J.length>0){let B=new Set($);for(let Q of J)if(!B.has(Q)&&Q.parentNode===Z)Z.removeChild(Q)}let G=z;for(let B=$.length-1;B>=0;B--){let Q=$[B];if(Q.parentNode!==Z||Q.nextSibling!==G)Z.insertBefore(Q,G);G=Q}}function R6(Z){let J=[];return Z1(J,Z),J}function Z1(Z,J){if(J==null||J===!1||J===!0||J==="")return;if(Array.isArray(J)){for(let $ of J)Z1(Z,$);return}if(P6(J)){Z.push(J);return}if(typeof J==="function"){Z1(Z,J());return}Z.push($1().createTextNode(String(J)))}function z1(Z,J){let $;return g((z)=>{$=z,p(J,Z())}),()=>{$(),J.textContent=""}}function m1(Z,J){let $=[],z=[],G=[];return m(()=>{for(let B of G)B()}),()=>{let B=Z(),Q=B.length,W=Array(Q),X=Array(Q),Y=new Map;for(let _=0;_<$.length;_++){let P=Y.get($[_]);if(P)P.push(_);else Y.set($[_],[_])}let T=Array($.length).fill(!1);for(let _=0;_<Q;_++){let P=B[_],C=Y.get(P);if(C!==void 0&&C.length>0){let A=C.shift();T[A]=!0,W[_]=z[A],X[_]=G[A]}else{let A,w=g((O)=>{return A=J(P,_),O});W[_]=A,X[_]=w}}for(let _=0;_<G.length;_++)if(!T[_])G[_]();return $=B.slice(),z=W,G=X,W}}function q(Z){let J=k(()=>!!Z.when());return()=>J()?Z.children:Z.fallback??null}function V(Z){let J=m1(()=>Z.each()??[],($,z)=>Z.children($,z));return()=>{let $=J();return $.length>0?$:Z.fallback??null}}var m6=D(null);function h(Z,J){let $=J!==void 0,z=$?Z:()=>!0,G=$?J:Z,B=L(void 0),Q=L(void 0),W=L(!1),X=j(m6),Y=!1,T=!1,_=0,P=()=>{if(X!==null&&!Y&&!T)X.increment(),Y=!0},C=()=>{if(Y)Y=!1,X.decrement()},A=(N,n)=>{let H=++_;W.set(!0),P();let M={value:B.peek(),refetching:n};Promise.resolve().then(()=>G(N,M)).then((t)=>{if(H!==_)return;B.set(t),Q.set(void 0),W.set(!1),T=!0,C()},(t)=>{if(H!==_)return;Q.set(t),W.set(!1),C()})};if($)R(()=>{let N=z();if(N===!1||N===null||N===void 0){_++,W.set(!1),C();return}u(()=>A(N,!1))});else A(!0,!1);m(()=>{_++,C()});let w=()=>B(),O=w;return O.loading=()=>W(),O.error=()=>Q(),[w,{mutate:(N)=>{_++,W.set(!1),Q.set(void 0),C(),T=!0,B.set(N)},refetch:()=>{let N=u(z);if(N===!1||N===null||N===void 0)return;A(N,!0)}}]}var g6=/^@(media|supports|container|document|layer)\b/i;function F(Z,...J){let $=typeof Z==="string"?Z:Z.reduce((B,Q,W)=>B+Q+(W<J.length?String(J[W]):""),""),z=D6($),G="k-"+z;return f6(z,G1($,"."+G)),G}function j6(Z){let J=[],$="",z=0,G="",B="",Q="";for(let W=0;W<Z.length;W++){let X=Z[W];if(X==="{"){if(z===0){let Y=G.lastIndexOf(";");$+=G.slice(0,Y+1),Q=G.slice(Y+1),G="",B=""}else B+=X;z++}else if(X==="}")if(z--,z===0)J.push({prelude:Q,inner:B});else if(z>0)B+=X;else z=0;else if(z===0)G+=X;else B+=X}return $+=G,{decls:$,blocks:J}}function G1(Z,J){let{decls:$,blocks:z}=j6(Z),G="",B=$.trim();if(B)G+=`${J}{${B}}`;for(let{prelude:Q,inner:W}of z){let X=Q.trim();if(X[0]==="@")G+=g6.test(X)?`${X}{${G1(W,J)}}`:`${X}{${W.trim()}}`;else G+=G1(W,V6(X,J))}return G}function V6(Z,J){return b6(Z,",").map(($)=>{let z=$.trim();return z.includes("&")?z.replace(/&/g,J):`${J} ${z}`}).join(",")}function b6(Z,J){let $=[],z=0,G="";for(let B=0;B<Z.length;B++){let Q=Z[B];if(Q==="("||Q==="[")z++;else if(Q===")"||Q==="]")z--;if(Q===J&&z===0)$.push(G),G="";else G+=Q}return $.push(G),$}var g1=new Map;function f6(Z,J){let $=globalThis.document;if(!$){if(!g1.has(Z))g1.set(Z,J);return}y6($,Z,J)}function y6(Z,J,$){let z=Z.head;for(let B of z.childNodes)if(B.nodeType===1&&B.getAttribute("data-k")===J)return;let G=Z.createElement("style");G.setAttribute("data-k",J),G.textContent=$,z.appendChild(G)}function D6(Z){let J=5381,$=2166136261;for(let z=0;z<Z.length;z++){let G=Z.charCodeAt(z);J=(J<<5)+J^G,$=Math.imul($^G,16777619)}return(J>>>0).toString(36)+($>>>0).toString(36)}function B1(Z,J,$){if(typeof Z==="function")return Z(J??{});return K1(Z,J??null)}function b1(Z){let J=new URL(Z,"http://kanabun.local"),$={};return J.searchParams.forEach((z,G)=>{$[G]=z}),{pathname:J.pathname,search:J.search,hash:J.hash,query:$}}function j1(Z){let J=[];for(let $ of Z.split("/"))if($!=="")J.push($);return J}function V1(Z){try{return decodeURIComponent(Z)}catch{return Z}}function f1(Z,J){let $=j1(Z),z=j1(J),G={};for(let B=0;B<$.length;B++){let Q=$[B];if(Q[0]==="*"){let X=Q.slice(1),Y=z.slice(B);if(X!=="")G[X]=Y.map(V1).join("/");return{params:G,rest:"/"+Y.join("/")}}let W=z[B];if(W===void 0)return null;if(Q[0]===":")G[Q.slice(1)]=V1(W);else if(Q!==W)return null}return z.length===$.length?{params:G,rest:null}:null}function y1(Z,J){let $=J.startsWith("/")?J:"/"+J,z=new URL(Z,"http://kanabun.local"+$);return z.pathname+z.search+z.hash}function D1(){let Z=globalThis.window;if(!Z)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return Z}function Q1(Z=D1()){return{location:()=>Z.location.pathname+Z.location.search+Z.location.hash,push:($)=>Z.history.pushState(null,"",$),replace:($)=>Z.history.replaceState(null,"",$),subscribe($){return Z.addEventListener("popstate",$),()=>Z.removeEventListener("popstate",$)}}}function W1(Z=D1()){return{location:()=>{let $=Z.location.hash,z=$.startsWith("#")?$.slice(1):$;return z===""?"/":z},push:($)=>{Z.location.hash=$},replace:($)=>Z.history.replaceState(null,"","#"+$),subscribe($){return Z.addEventListener("hashchange",$),()=>Z.removeEventListener("hashchange",$)}}}var E1=D(null),X1=D(null),w1=D(null),x1=Object.freeze({});function w6(Z){let J=j(E1);if(J===null)throw Error(`kanabun/router: ${Z} must be used inside a <Router>.`);return J}function H1(Z){let J=Z.source??Q1(),$=L(J.location());m(J.subscribe(()=>$.set(J.location())));let z=k(()=>b1($())),G=(B,Q)=>{let W=x6(B)?B:y1(B,z().pathname);if(Q?.replace)J.replace(W);else J.push(W);$.set(J.location())};return E1.Provider({value:{location:z,navigate:G},children:Z.children})}function _1(){return j(X1)??(()=>x1)}function l(Z){let{location:J}=w6("<Route>"),$=j(X1),G=j(w1)??(()=>J().pathname),B=k(()=>f1(Z.path,G())),Q=k(()=>B()!==null),W=k(()=>{let P=B()?.params??x1;return $===null?P:{...$(),...P}}),X=()=>B()?.rest??"/",Y=()=>X1.Provider({value:W,children:()=>w1.Provider({value:X,children:()=>{if(Z.component!==void 0)return Z.component({params:W});if(typeof Z.children==="function")return Z.children(W);return Z.children}})}),T=v1(),_=()=>{if(Q())return T(Y);return T(null),Z.fallback??null};return _.$matched=Q,_.$content=Y,_}function v1(){let Z=null;return m(()=>Z?.()),(J)=>{if(Z!==null)Z(),Z=null;if(J===null)return null;let $;return Z=g((z)=>{return $=J(),z}),$}}function E6(Z){return typeof Z==="function"&&"$matched"in Z}function h1(Z,J){if(Array.isArray(Z))for(let $ of Z)h1($,J);else if(E6(Z))J.push(Z)}function M1(Z){let J=[];h1(Z.children,J);let $=v1();return()=>{for(let z of J)if(z.$matched())return $(z.$content);return $(null),Z.fallback??null}}function x6(Z){return/^[a-z][a-z0-9+.-]*:/i.test(Z)||Z.startsWith("//")}var Y1=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function i(Z,J){let $=await fetch(Y1+Z,{method:J===void 0?"GET":"POST",headers:J===void 0?void 0:{"Content-Type":"application/json"},body:J===void 0?void 0:JSON.stringify(J)}),z=await $.json().catch(()=>({}));if(!$.ok)throw Error(z.message??`${$.status}`);return z}var d1=()=>i("/api/cases"),c1=(Z)=>i("/api/new",{case:Z}),u1=(Z,J)=>i("/api/act",{state:Z,input:J}),p1=(Z,J)=>i("/api/accuse",{state:Z,answer:J});var i1=F`
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
`,a1=F`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,S=F`
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
`,o1=F`
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
`,n1=F`
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--bg);
  display: grid;
  place-items: center;
  font-size: 19px;
`,t1=F`
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
`,d=F`
  color: var(--muted);
  font-size: 13px;
`,s1=F`
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

  h3 {
    font-size: 19px;
    margin: 0 0 10px;
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
`,r1=F`
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
`,e1=F`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,J6=F`
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
`,a=F`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function K(Z,J,$,z,G,B){return B1(Z,J,$)}function Z6(){let[Z]=h(()=>d1());return K("div",{children:[K("div",{class:"titlebar",children:K("div",{children:[K("h1",{children:"事件簿"},void 0,!1,void 0,this),K("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),K(q,{when:()=>Z.loading(),children:K("p",{class:a,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),K(q,{when:()=>Z.error()!==void 0,children:K("div",{class:S,children:[K("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),K("p",{class:d,children:()=>String(Z.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),K("div",{class:J6,children:K(V,{each:()=>Z()?.cases??[],children:(J)=>K("a",{href:`#${J.id}`,children:[K("p",{class:"title",children:J.title},void 0,!1,void 0,this),K(q,{when:()=>J.byline!==void 0,children:K("p",{class:"byline",children:J.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),K("p",{class:"hash",children:`#${J.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function $6(Z){return K("div",{class:n1,children:Z.glyph||"？"},void 0,!1,void 0,this)}function K6(Z){return K("div",{class:S,children:[K("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),K("div",{class:o1,children:[K("p",{class:"name",children:()=>Z.view().scene.name},void 0,!1,void 0,this),()=>Z.view().scene.description.map((J)=>K("p",{class:"desc",children:J},void 0,!1,void 0,this)),K("div",{class:"people",children:K(V,{each:()=>Z.view().people??[],fallback:K("p",{class:d,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(J)=>K("div",{class:"person",children:[K($6,{glyph:J.avatar},void 0,!1,void 0,this),K("div",{children:[K("div",{class:"who",children:J.name},void 0,!1,void 0,this),K("div",{class:"role",children:J.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function z6(Z){return K("div",{class:S,children:[K("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),K("div",{class:t1,children:K(V,{each:()=>Z.view().evidence??[],fallback:K("p",{class:d,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(J)=>K("div",{class:"item",children:[K("div",{class:"name",children:J.name},void 0,!1,void 0,this),K("div",{class:"desc",children:J.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function G6(Z){let J=Z.entry;if(J.kind==="narration")return K("div",{class:"entry",children:J.lines.map(($)=>K("p",{children:$},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(J.kind==="answer")return K("div",{class:"entry said",children:K("p",{class:"typed",children:J.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(J.kind==="ending")return K(v6,{verdict:J.verdict},void 0,!1,void 0,this);return K("div",{class:J.matched?"entry said":"entry said miss",children:[K("p",{class:"typed",children:"> "+J.input},void 0,!1,void 0,this),J.speaker?K("div",{class:"speaker",children:[K($6,{glyph:J.speaker.avatar},void 0,!1,void 0,this),K("div",{class:"who",children:J.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,J.did?K("p",{class:"did",children:J.did},void 0,!1,void 0,this):null,J.lines.map(($)=>K("p",{children:$},void 0,!1,void 0,this)),J.gained.map(($)=>K("div",{class:"found",children:"見つけた: "+$.name},void 0,!1,void 0,this)),J.moved?K("div",{class:"moved",children:"— "+J.moved+" —"},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function v6(Z){let J=Z.verdict,$=J.correct?`犯人を言い当てた（${J.named_name}）`:J.named_name?`${J.named_name}を指した`:"犯人を名指ししなかった",z=(B,Q)=>[K("span",{class:B?"mark":"mark no",children:B?"○":"×"},void 0,!1,void 0,this),K("span",{children:Q},void 0,!1,void 0,this)],G=`${Math.round(100*J.coherence/(J.coherence_top||1))}%`;return K("div",{class:"entry said",children:[K("h3",{children:J.title},void 0,!1,void 0,this),J.text.map((B)=>K("p",{children:B},void 0,!1,void 0,this)),K("div",{class:"score",children:[z(J.correct,$),J.points.map((B)=>z(B.hit,B.label))]},void 0,!0,void 0,this),K("div",{class:"coherence",children:[`筋の通り ${J.coherence.toFixed(1)} / ${J.coherence_top}`,K("div",{class:"track",children:K("div",{style:{width:G}},void 0,!1,void 0,this)},void 0,!1,void 0,this),K(q,{when:()=>J.coherence_legend!==void 0,children:J.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function B6(){let Z=_1(),[J,{refetch:$}]=h(()=>Z().case??!1,(H)=>c1(H)),z=L(""),G=L(null),B=L([]),Q=L("playing"),W=L(""),X=L(!1),Y=L(""),T=null,_=null;R(()=>{let H=J();if(H===void 0)return;z.set(H.state),G.set(H.view),B.set([{kind:"narration",lines:H.opening},{kind:"narration",lines:H.incident}]),Q.set("playing"),W.set(""),Y.set(""),document.title=H.title});let P=(H)=>{B.update((M)=>[...M,H]),requestAnimationFrame(()=>T?.lastElementChild?.scrollIntoView({block:"end"}))},C=(H)=>Y.set(H instanceof Error?H.message:String(H)),A=async(H)=>{if(X.peek()||H==="")return;X.set(!0),Y.set("");try{let M=await u1(z.peek(),H);if(z.set(M.state),G.set(M.view),P({kind:"turn",input:H,matched:M.matched,did:M.did,speaker:M.speaker,lines:M.text,gained:M.gained??[],moved:M.moved_to===void 0?void 0:M.view.scene.name}),M.finale===!0)Q.set("accusing")}catch(M){C(M)}finally{X.set(!1),_?.focus()}},w=async(H)=>{if(X.peek()||H==="")return;X.set(!0),Y.set(""),P({kind:"answer",text:H});try{let M=await p1(z.peek(),H);z.set(M.state),P({kind:"ending",verdict:M}),Q.set("closed")}catch(M){C(M)}finally{X.set(!1)}},O=()=>G(),U1=()=>{return K("div",{children:[K(q,{when:()=>O().finale_open&&Q()==="playing",children:K("div",{class:e1,children:[K("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),K("button",{type:"button",disabled:X,onClick:()=>A(O().finale_label??"全員を集める"),children:()=>O().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),K("div",{class:a1,children:[K("div",{children:[K(K6,{view:O},void 0,!1,void 0,this),K(z6,{view:O},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K("div",{children:[K("div",{class:`${S} ${s1}`,ref:(H)=>T=H,children:[K(V,{each:B,children:(H)=>K(G6,{entry:H},void 0,!1,void 0,this)},void 0,!1,void 0,this),K(q,{when:X,children:K("p",{class:a,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K(q,{when:()=>Q()!=="closed",children:()=>K(N,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},N=()=>K("div",{class:`${S} ${r1}`,children:[K(q,{when:()=>Q()==="playing",fallback:()=>K(n,{},void 0,!1,void 0,this),children:K("div",{children:[K("form",{onSubmit:(H)=>{H.preventDefault();let M=W.peek().trim();W.set(""),A(M)},children:[K("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:W,disabled:X,ref:(H)=>{_=H,_.focus()},onInput:(H)=>W.set(H.target.value)},void 0,!1,void 0,this),K("button",{type:"submit",disabled:X,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),K(q,{when:()=>Y()!=="",children:K("p",{class:"error",children:Y},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),n=()=>{let H=L("");return K("div",{children:[K("form",{class:"stacked",onSubmit:(M)=>{M.preventDefault(),w(H.peek().trim())},children:[K("textarea",{placeholder:"誰が、どうやって、なぜ。",value:H,disabled:X,ref:(M)=>M.focus(),onInput:(M)=>H.set(M.target.value)},void 0,!1,void 0,this),K("p",{children:K("button",{type:"submit",disabled:X,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)};return K("div",{children:[K("div",{class:"titlebar",children:[K("div",{children:[K("h1",{children:()=>J()?.title??"……"},void 0,!1,void 0,this),K("p",{class:"byline",children:()=>J()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K(q,{when:()=>J()!==void 0,children:K("button",{type:"button",class:"secondary",disabled:X,onClick:()=>$(),children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K(q,{when:()=>J.error()!==void 0,children:K("div",{class:S,children:[K("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),K("p",{children:K("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),K(q,{when:()=>G()!==null,children:U1},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function h6(){return K("main",{class:i1,children:[K(M1,{children:[K(l,{path:"/",component:Z6},void 0,!1,void 0,this),K(l,{path:"/:case",component:B6},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K("footer",{children:[K("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",K("span",{children:Y1},void 0,!1,void 0,this)," ・ ソースは ",K("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",K("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function d6(){return K(H1,{source:W1(),children:()=>K(h6,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var Q6=document.getElementById("app");if(Q6)z1(()=>K(d6,{},void 0,!1,void 0,this),Q6);

//# debugId=FDB603A1A9679B2964756E2164756E21
//# sourceMappingURL=chunk-75kfta3n.js.map
