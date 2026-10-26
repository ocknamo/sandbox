var zt=!1,Pe=new Set,Vt=(t)=>console.warn(t),Xt=Vt,qt="kanabun [dev]: ";function Kt(){return zt||globalThis.__KANABUN_DEV__===!0}function z(t){if(!Kt())return;if(Pe.has(t))return;Pe.add(t),Xt(qt+t)}var j=0,Ie=1,Z=2,V=3,E=null,x=null,pe=0,de=!1,ne=[],$t=1e6,G=(t,e)=>t===e,jt=()=>!1;function Je(t){if(!t||t.equals===void 0)return G;if(t.equals===!1)return jt;return t.equals}class X{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,o){if(this.equals=n,this.isEffect=e,o){if(this.fn=t,this.value=void 0,this.color=Z,x!==null)(x.owned??=[]).push(this),this.owner=x}else this.fn=null,this.value=t,this.color=j}read(){if(this.color===V)return this.value;if(E!==null)(E.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(E!==null&&!E.isEffect)z("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(Z)}markStale(t){if(this.color>=t)return;let e=this.color===j;if(this.color=t,e&&this.isEffect)Fe(this);if(this.observers!==null)for(let n of this.observers)n.markStale(Ie)}updateIfNecessary(){if(this.color===j||this.color===V)return;if(this.color===Ie&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===Z)break}if(this.color===Z)this.update();this.color=j}update(){this.cleanNode();let t=E,e=x;E=this,x=this,this.collecting=[];let n,o,s=!1;try{n=this.fn()}catch(a){s=!0,o=a}finally{E=t,x=e}if(s){this.collecting=null,this.color=j,Yt(o,this.owner);return}this.reconcileSources();let i=!this.equals(this.value,n);if(this.value=n,this.color=j,i&&this.observers!==null){for(let a of this.observers)if(a.color!==V&&a.color<Z)a.color=Z}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))Ne(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))Zt(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===V)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)Ne(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=V}}function Zt(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function Ne(t,e){let n=t.observers;if(n===null)return;let o=n.indexOf(e);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function Fe(t){ne.push(t)}function fe(){if(de)return;de=!0;let t=0,e=0;try{while(t<ne.length){if(++e>$t)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=ne[t++];if(n.color!==V)n.updateIfNecessary()}}finally{ne.length=0,de=!1}}function Oe(t,e){let n=x,o=E;x=t,E=null;try{return e()}finally{x=n,E=o}}function me(t,e){let n=x;x=t;try{return e()}finally{x=n}}function _e(){let t=new X(void 0,!1,G,!1);if(t.owner=x,x!==null)(x.owned??=[]).push(t);return t}function h(t,e){let n=new X(t,!1,Je(e),!1),o=()=>n.read(),s=o;return s.set=(i)=>{if(n.write(i),pe===0)fe()},s.update=(i)=>{if(n.write(i(n.value)),pe===0)fe()},s.peek=()=>n.value,o}function F(t,e){let n=new X(t,!1,Je(e),!0);return()=>n.read()}function L(t){if(x===null)z("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new X(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,G,!0);if(Fe(e),pe===0)fe();return()=>e.dispose()}function Y(t){let e=E;E=null;try{return t()}finally{E=e}}var Be=Symbol("error-handler");function Yt(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&Be in n.context){n.context[Be](t);return}throw t}function I(t){if(x===null){z("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(x.cleanups??=[]).push(t)}function O(t){let e=new X(void 0,!1,G,!1);return e.owner=x,Oe(e,()=>t(()=>e.dispose()))}function Wt(t,e){let n=_e();return n.context={[t]:e},n}function q(t){let e=Symbol("context");return{id:e,defaultValue:t,Provider(n){let o=Wt(e,n.value),s=n.children,i=me(o,()=>typeof s==="function"?s():s);return typeof i==="function"?()=>me(o,i):i}}}function _(t){for(let e=x;e!==null;e=e.owner)if(e.context!==null&&t.id in e.context)return e.context[t.id];return t.defaultValue}function ge(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function Gt(t){return t!=null&&typeof t.nodeType==="number"}function Dt(t){return t.nodeType===3}var Qt=new Set(["script","style"]);function ve(t,e){let n=ge().createElement(t);if(e!==null){for(let o in e){if(o==="children"||o==="ref")continue;tn(n,o,e[o])}if(e.ref!==void 0)en(e.ref,n);if("children"in e)Ut(t,e.children),re(n,e.children)}return n}function Ut(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!Qt.has(t.toLowerCase()))return;z(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function en(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function tn(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){nn(t,n);return}if(typeof n==="function")L(()=>Ve(t,e,n()));else Ve(t,e,n)}function nn(t,e){for(let n in e){let o=e[n];if(typeof o==="function")L(()=>ze(t,n,o()));else ze(t,n,o)}}function ze(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function Ve(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function re(t,e,n=null){if(Array.isArray(e)){for(let o of e)re(t,o,n);return}if(typeof e==="function"){let o=t.insertBefore(ge().createComment(""),n);Xe(t,e,o,{current:null});return}qe(t,e,null,n)}function Xe(t,e,n,o){L(()=>{let s=e();if(typeof s==="function")Xe(t,s,n,o);else o.current=qe(t,s,o.current,n)})}function qe(t,e,n,o){if(n!==null&&n.length===1&&Dt(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let s=rn(e);return Ke(t,n??[],s,o),s.length>0?s:null}function Ke(t,e,n,o){if(e.length>0){let i=new Set(n);for(let a of e)if(!i.has(a)&&a.parentNode===t)t.removeChild(a)}let s=o;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.parentNode!==t||a.nextSibling!==s)t.insertBefore(a,s);s=a}}function rn(t){let e=[];return he(e,t),e}function he(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)he(t,n);return}if(Gt(e)){t.push(e);return}if(typeof e==="function"){he(t,e());return}t.push(ge().createTextNode(String(e)))}function be(t,e){let n;return O((o)=>{n=o,re(e,t())}),()=>{n(),e.textContent=""}}function $e(t,e){let n=[],o=[],s=[];return I(()=>{for(let i of s)i()}),()=>{let i=t(),a=i.length,d=Array(a),f=Array(a),m=new Map;for(let l=0;l<n.length;l++){let y=m.get(n[l]);if(y)y.push(l);else m.set(n[l],[l])}let v=Array(n.length).fill(!1);for(let l=0;l<a;l++){let y=i[l],w=m.get(y);if(w!==void 0&&w.length>0){let b=w.shift();v[b]=!0,d[l]=o[b],f[l]=s[b]}else{let b,T=O((M)=>(b=e(y,l),M));d[l]=b,f[l]=T}}for(let l=0;l<s.length;l++)if(!v[l])s[l]();return n=i.slice(),o=d,s=f,d}}function g(t){let e=F(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function C(t){let e=$e(()=>t.each()??[],(n,o)=>t.children(n,o));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var an=q(null);function D(t,e){let n=e!==void 0,o=n?t:()=>!0,s=n?e:t,i=h(void 0),a=h(void 0),d=h(!1),f=_(an),m=!1,v=!1,l=0,y=()=>{if(f!==null&&!m&&!v)f.increment(),m=!0},w=()=>{if(m)m=!1,f.decrement()},b=(k,J)=>{let K=++l;d.set(!0),y();let B={value:i.peek(),refetching:J};Promise.resolve().then(()=>s(k,B)).then((p)=>{if(K!==l)return;i.set(p),a.set(void 0),d.set(!1),v=!0,w()},(p)=>{if(K!==l)return;a.set(p),d.set(!1),w()})};if(n)L(()=>{let k=o();if(k===!1||k===null||k===void 0){l++,d.set(!1),w();return}Y(()=>b(k,!1))});else b(!0,!1);I(()=>{l++,w()});let T=()=>i(),M=T;return M.loading=()=>d(),M.error=()=>a(),[T,{mutate:(k)=>{l++,d.set(!1),a.set(void 0),w(),v=!0,i.set(k)},refetch:()=>{let k=Y(o);if(k===!1||k===null||k===void 0)return;b(k,!0)}}]}var ln=/^@(media|supports|container|document|layer)\b/i;function S(t,...e){let n=typeof t==="string"?t:t.reduce((i,a,d)=>i+a+(d<e.length?String(e[d]):""),""),o=mn(n),s="k-"+o;return pn(o,xe(n,"."+s)),s}function cn(t){let e=[],n="",o=0,s="",i="",a="";for(let d=0;d<t.length;d++){let f=t[d];if(f==="{"){if(o===0){let m=s.lastIndexOf(";");n+=s.slice(0,m+1),a=s.slice(m+1),s="",i=""}else i+=f;o++}else if(f==="}")if(o--,o===0)e.push({prelude:a,inner:i});else if(o>0)i+=f;else o=0;else if(o===0)s+=f;else i+=f}return n+=s,{decls:n,blocks:e}}function xe(t,e){let{decls:n,blocks:o}=cn(t),s="",i=n.trim();if(i)s+=`${e}{${i}}`;for(let{prelude:a,inner:d}of o){let f=a.trim();if(f[0]==="@")s+=ln.test(f)?`${f}{${xe(d,e)}}`:`${f}{${d.trim()}}`;else s+=xe(d,un(f,e))}return s}function un(t,e){return dn(t,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,e):`${e} ${o}`}).join(",")}function dn(t,e){let n=[],o=0,s="";for(let i=0;i<t.length;i++){let a=t[i];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===e&&o===0)n.push(s),s="";else s+=a}return n.push(s),n}var je=new Map;function pn(t,e){let n=globalThis.document;if(!n){if(!je.has(t))je.set(t,e);return}fn(n,t,e)}function fn(t,e,n){let o=t.head;for(let i of o.childNodes)if(i.nodeType===1&&i.getAttribute("data-k")===e)return;let s=t.createElement("style");s.setAttribute("data-k",e),s.textContent=n,o.appendChild(s)}function mn(t){let e=5381,n=2166136261;for(let o=0;o<t.length;o++){let s=t.charCodeAt(o);e=(e<<5)+e^s,n=Math.imul(n^s,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}function ye(t,e,n){if(typeof t==="function")return t(e??{});return ve(t,e??null)}function We(t){let e=new URL(t,"http://kanabun.local"),n={};return e.searchParams.forEach((o,s)=>{n[s]=o}),{pathname:e.pathname,search:e.search,hash:e.hash,query:n}}function Ze(t){let e=[];for(let n of t.split("/"))if(n!=="")e.push(n);return e}function Ye(t){try{return decodeURIComponent(t)}catch{return t}}function Ge(t,e){let n=Ze(t),o=Ze(e),s={};for(let i=0;i<n.length;i++){let a=n[i];if(a[0]==="*"){let f=a.slice(1),m=o.slice(i);if(f!=="")s[f]=m.map(Ye).join("/");return{params:s,rest:"/"+m.join("/")}}let d=o[i];if(d===void 0)return null;if(a[0]===":")s[a.slice(1)]=Ye(d);else if(a!==d)return null}return o.length===n.length?{params:s,rest:null}:null}function De(t,e){let n=e.startsWith("/")?e:"/"+e,o=new URL(t,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function Qe(){let t=globalThis.window;if(!t)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return t}function ke(t=Qe()){return{location:()=>t.location.pathname+t.location.search+t.location.hash,push:(n)=>t.history.pushState(null,"",n),replace:(n)=>t.history.replaceState(null,"",n),subscribe(n){return t.addEventListener("popstate",n),()=>t.removeEventListener("popstate",n)}}}function we(t=Qe()){return{location:()=>{let n=t.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{t.location.hash=n},replace:(n)=>t.history.replaceState(null,"","#"+n),subscribe(n){return t.addEventListener("hashchange",n),()=>t.removeEventListener("hashchange",n)}}}var et=q(null),Ae=q(null),Ue=q(null),tt=Object.freeze({});function hn(t){let e=_(et);if(e===null)throw Error(`kanabun/router: ${t} must be used inside a <Router>.`);return e}function Se(t){let e=t.source??ke(),n=h(e.location());I(e.subscribe(()=>n.set(e.location())));let o=F(()=>We(n())),s=(i,a)=>{let d=vn(i)?i:De(i,o().pathname);if(a?.replace)e.replace(d);else e.push(d);n.set(e.location())};return et.Provider({value:{location:o,navigate:s},children:t.children})}function Te(){return _(Ae)??(()=>tt)}function oe(t){let{location:e}=hn("<Route>"),n=_(Ae),s=_(Ue)??(()=>e().pathname),i=F(()=>Ge(t.path,s())),a=F(()=>i()!==null),d=F(()=>{let y=i()?.params??tt;return n===null?y:{...n(),...y}}),f=()=>i()?.rest??"/",m=()=>Ae.Provider({value:d,children:()=>Ue.Provider({value:f,children:()=>{if(t.component!==void 0)return t.component({params:d});if(typeof t.children==="function")return t.children(d);return t.children}})}),v=nt(),l=()=>{if(a())return v(m);return v(null),t.fallback??null};return l.$matched=a,l.$content=m,l}function nt(){let t=null;return I(()=>t?.()),(e)=>{if(t!==null)t(),t=null;if(e===null)return null;let n;return t=O((o)=>(n=e(),o)),n}}function gn(t){return typeof t==="function"&&"$matched"in t}function rt(t,e){if(Array.isArray(t))for(let n of t)rt(n,e);else if(gn(t))e.push(t)}function Re(t){let e=[];rt(t.children,e);let n=nt();return()=>{for(let o of e)if(o.$matched())return n(o.$content);return n(null),t.fallback??null}}function vn(t){return/^[a-z][a-z0-9+.-]*:/i.test(t)||t.startsWith("//")}var se=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function ot(t){return/^https?:\/\//i.test(t)?t:`${se}/${t.replace(/^\/+/,"")}`}async function ie(t,e){let n=await fetch(se+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var st=()=>ie("/api/cases"),it=(t)=>ie("/api/new",{case:t}),at=(t,e)=>ie("/api/act",{state:t,input:e}),lt=(t,e)=>ie("/api/accuse",{state:t,answer:e});var ut=S`
  max-width: 960px;
  margin: 0 auto;
  /* Room at the bottom for the notebook in the corner, so the last of the
     page can always be scrolled out from under it. */
  padding: 32px 20px calc(104px + env(safe-area-inset-bottom));

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
`,dt=S`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,H=S`
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
`,pt=S`
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
`,ft=S`
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
`,mt=S`
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
`,Q=S`
  color: var(--muted);
  font-size: 13px;
`,ht=S`
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
`,Ee=S`
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
`,Ce=S`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`,gt=S`
  margin-top: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,vt=S`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,bt=S`
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
`,ae=S`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`,xt=S`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  font-family: var(--ui);
  font-size: 12px;
  color: var(--muted);

  button {
    font-size: 13px;
    padding: 2px 12px;
    border-radius: 999px;
  }
`,yt=S`
  .fab {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 30;
    width: 72px;
    height: 72px;
    padding: 4px;
    border: none;
    border-radius: 50%;
    background: transparent;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
    transition: transform 120ms ease-out, opacity 120ms ease-out;
  }

  .fab:hover {
    transform: translateY(-2px);
  }

  .fab:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .fab img {
    display: block;
    width: 64px;
    height: 64px;
  }

  .fab.gone {
    opacity: 0;
    pointer-events: none;
  }

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--warn);
    color: #fff;
    font: 600 12px/22px var(--ui);
    text-align: center;
  }

  .backdrop {
    display: none;
  }

  .book {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
    bottom: calc(max(16px, env(safe-area-inset-bottom)) + 84px);
    z-index: 31;
    width: 380px;
    max-height: min(70vh, 640px);
    display: flex;
    flex-direction: column;
    padding: 7px;
    border-radius: 14px;
    background: var(--leather);
    /* The stitching around the cover. */
    outline: 1.5px dashed var(--stitch);
    outline-offset: -4px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
    color: var(--ink);
    font-size: 14px;
  }

  .book:focus {
    outline: 1.5px dashed var(--stitch);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 6px 6px 10px;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.3em;
    color: var(--stitch);
    font-family: var(--ui);
  }

  .close {
    padding: 0 10px;
    border: none;
    background: transparent;
    color: var(--stitch);
    font-size: 20px;
    line-height: 1.4;
  }

  .tabs {
    display: flex;
    gap: 4px;
    padding: 0 6px;
  }

  .tab {
    flex: 1 1 0;
    padding: 5px 4px;
    border: none;
    border-radius: 8px 8px 0 0;
    background: var(--paper-edge);
    color: var(--ink-muted);
    font-size: 13px;
  }

  .tab.on {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
  }

  .page {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px 14px 14px;
    border-radius: 8px;
    background: var(--paper);
    /* The red rule across the top of the page. */
    box-shadow: inset 0 3px 0 var(--rule);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--paper-edge);
  }

  .row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .body {
    flex: 1 1 auto;
    min-width: 0;
  }

  .name {
    font-size: 14.5px;
    line-height: 1.5;
  }

  .desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--ink-muted);
  }

  .here,
  .victim,
  .new {
    margin-left: 8px;
    padding: 0 7px;
    border-radius: 999px;
    font: 11px/18px var(--ui);
    vertical-align: 1px;
  }

  .here {
    border: 1px solid var(--accent);
    color: var(--accent);
  }

  .victim {
    border: 1px solid var(--ink-muted);
    color: var(--ink-muted);
  }

  .new {
    background: var(--warn);
    color: #fff;
  }

  .copy {
    flex: 0 0 auto;
    /* Wide enough for either label, so the row does not shift on a copy. */
    min-width: 7.5em;
    padding: 3px 10px;
    border: 1px solid var(--leather-ink);
    background: transparent;
    color: var(--leather-ink);
    font-size: 12.5px;
  }

  .copy.done {
    border-color: var(--accent);
    color: var(--accent);
  }

  .scene {
    margin: 0;
    font-size: 16px;
  }

  .present {
    margin: 6px 0 0;
    font-size: 13px;
  }

  .none,
  .tip {
    margin: 0;
    font-size: 12.5px;
    color: var(--ink-muted);
    font-family: var(--ui);
  }

  .tip {
    margin-top: 12px;
  }

  @media (max-width: 720px) {
    .fab.opened {
      opacity: 0;
      pointer-events: none;
    }

    .backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 31;
      background: rgba(0, 0, 0, 0.45);
    }

    .book {
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 32;
      width: auto;
      max-height: 82vh;
      max-height: 82dvh;
      padding: 8px 8px max(8px, env(safe-area-inset-bottom));
      border-radius: 16px 16px 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fab {
      transition: none;
    }

    .fab:hover {
      transform: none;
    }
  }
`;function r(t,e,n,o,s,i){return ye(t,e,n)}function kt(){let[t]=D(()=>st());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.loading(),children:r("p",{class:ae,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:H,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:Q,children:()=>String(t.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:bt,children:r(C,{each:()=>t()?.cases??[],children:(e)=>r("a",{href:`#${e.id}`,children:[r("p",{class:"title",children:e.title},void 0,!1,void 0,this),r(g,{when:()=>e.byline!==void 0,children:r("p",{class:"byline",children:e.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var wt="./notebook-closed-0ve9trf2.png";var At="./notebook-open-d3mm1df3.png";function le(t){let e=t.person,n=h(0);return r("div",{class:ft,children:[r("span",{children:e.avatar||"？"},void 0,!1,void 0,this),()=>{if(!e.image||n()>=2)return null;let o=ot(e.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:e.name,loading:"lazy",onError:()=>n.update((s)=>s+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function St(t){return r("div",{class:H,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:pt,children:[r("p",{class:"name",children:()=>t.view().scene.name},void 0,!1,void 0,this),()=>t.view().scene.description.map((e)=>r("p",{class:"desc",children:e},void 0,!1,void 0,this)),r("div",{class:"people",children:r(C,{each:()=>t.view().people??[],fallback:r("p",{class:Q,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"person",children:[r(le,{person:e},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:e.name},void 0,!1,void 0,this),r("div",{class:"role",children:e.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Tt(t){return r("div",{class:H,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:mt,children:r(C,{each:()=>t.view().evidence??[],fallback:r("p",{class:Q,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"item",children:[r("div",{class:"name",children:e.name},void 0,!1,void 0,this),r("div",{class:"desc",children:e.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Rt(t){let e=t.entry;if(e.kind==="narration")return r("div",{class:"entry",children:e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(e.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:e.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(e.kind==="ending")return r(yn,{verdict:e.verdict,share:e.share},void 0,!1,void 0,this);return r("div",{class:e.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+e.input},void 0,!1,void 0,this),e.speaker?r("div",{class:"speaker",children:[r(le,{person:e.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:e.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,e.did?r("p",{class:"did",children:e.did},void 0,!1,void 0,this):null,e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),e.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),e.moved?r("div",{class:"moved",children:"— "+e.moved+" —"},void 0,!1,void 0,this):null,e.arrival.length>0?r("div",{class:"arrival",children:e.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,e.interlude.length>0?r("div",{class:"interlude",children:e.interlude.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function yn(t){let e=t.verdict,n=e.correct?`犯人を言い当てた（${e.named_name}）`:e.named_name?`${e.named_name}を指した`:"犯人を名指ししなかった",o=(m,v)=>[r("span",{class:m?"mark":"mark no",children:m?"○":"×"},void 0,!1,void 0,this),r("span",{children:v},void 0,!1,void 0,this)],s=e.points.filter((m)=>m.hit),i=e.points.length-s.length,a=`${Math.round(100*e.coherence/(e.coherence_top||1))}%`,d=e.celebrate===!0,f=Et(e)?"完 全 解 決":"事 件 解 決";return r("div",{class:d?"entry said won":"entry said",children:[d?r("p",{class:"solved",children:f},void 0,!1,void 0,this):null,r("h3",{children:e.title},void 0,!1,void 0,this),e.text.map((m)=>r("p",{children:m},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(e.correct,n),s.map((m)=>o(!0,m.label)),i>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${i} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${e.coherence.toFixed(1)} / ${e.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.coherence_legend!==void 0,children:e.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this),t.share?r(An,{text:kn(e,t.share),title:t.share.title},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function Et(t){if(t.celebrate!==!0)return!1;return t.complete===!0||t.correct&&t.points.every((e)=>e.hit)}function kn(t,e){let n=t.points.filter((i)=>i.hit).length,o=Et(t)?"完全解決":t.celebrate===!0?"事件解決":"未解決",s=t.points.map((i)=>i.hit?"○":"×").join("");return[`『${e.title}』${o}`,`犯人 ${t.correct?"○":"×"}／真相 ${s} ${n}/${t.points.length}`,`筋の通り ${t.coherence.toFixed(1)}/${t.coherence_top}・${e.turns}手`,"#jevmystery"].join(`
`)}function wn(){let t=new URL(location.href);return t.searchParams.delete("api"),t.toString()}async function Me(t){try{await navigator.clipboard.writeText(t)}catch{let e=document.createElement("textarea");e.value=t,e.style.position="fixed",e.style.opacity="0",document.body.appendChild(e),e.select(),document.execCommand("copy"),e.remove()}}function An(t){let e=wn(),n=h(!1),o=typeof navigator.share==="function",s=()=>{navigator.share({title:t.title,text:t.text,url:e}).catch(()=>{})},i=async()=>{await Me(`${t.text}
${e}`),n.set(!0),setTimeout(()=>n.set(!1),2000)};return r("div",{class:"share",children:[r("pre",{children:t.text},void 0,!1,void 0,this),r("div",{class:"buttons",children:[o?r("button",{type:"button",class:"secondary",onClick:s,children:"共有する"},void 0,!1,void 0,this):null,r("button",{type:"button",class:"secondary",onClick:()=>void i(),children:()=>n()?"コピーしました":"結果をコピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Ct(t){let e=h(!1),n=h("people"),o=()=>t.view().evidence??[],s=Y(()=>o().length),i=h(s),a=h(s),d=()=>Math.max(0,o().length-i()),f=null,m=()=>{if(d()>0)n.set("evidence");a.set(i.peek()),i.set(o().length),e.set(!0),requestAnimationFrame(()=>f?.focus())},v=()=>{i.set(o().length),e.set(!1)},l=()=>e.peek()?v():m(),y=(p)=>{if(p.key==="Escape"&&e.peek())v()};document.addEventListener("keydown",y),I(()=>document.removeEventListener("keydown",y));let w=(p)=>(t.view().people??[]).some((R)=>R.id===p.id),b=()=>t.view().victim,T=()=>t.met().filter((p)=>p.id!==b()?.id),M=(p)=>{let R=h(!1),ee=async()=>{await Me(p.text),R.set(!0),setTimeout(()=>R.set(!1),1500)};return r("button",{type:"button",class:()=>R()?"copy done":"copy","aria-label":p.label,onClick:()=>void ee(),children:()=>R()?"✓ コピー済み":"コピー"},void 0,!1,void 0,this)},N=(p)=>r("div",{class:"row",children:[r(le,{person:p.person},void 0,!1,void 0,this),r("div",{class:"body",children:[r("div",{class:"name",children:[p.person.name,p.victim?r("span",{class:"victim",children:"被害者"},void 0,!1,void 0,this):null,r(g,{when:()=>w(p.person),children:r("span",{class:"here",children:"ここにいる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"desc",children:p.person.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(M,{text:p.person.name,label:`${p.person.name}の名前をコピー`},void 0,!1,void 0,this)]},void 0,!0,void 0,this),k=(p)=>r("button",{type:"button",role:"tab",class:()=>n()===p.id?"tab on":"tab","aria-selected":()=>String(n()===p.id),onClick:()=>n.set(p.id),children:p.label},void 0,!1,void 0,this),J=()=>r("div",{class:"list",children:[()=>{let p=b();return p===void 0?null:r(N,{person:p,victim:!0},void 0,!1,void 0,this)},r(C,{each:T,fallback:r("p",{class:"none",children:"まだ誰にも会っていない。"},void 0,!1,void 0,this),children:(p)=>r(N,{person:p},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),K=()=>r("div",{class:"list",children:r(C,{each:o,fallback:r("p",{class:"none",children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(p,R)=>r("div",{class:"row",children:[r("div",{class:"body",children:[r("div",{class:"name",children:[p.name,r(g,{when:()=>R>=a(),children:r("span",{class:"new",children:"新"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"desc",children:p.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(M,{text:p.name,label:`${p.name}をコピー`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),B=()=>r("div",{class:"list",children:[r("p",{class:"scene",children:()=>t.view().scene.name},void 0,!1,void 0,this),()=>t.view().scene.description.map((p)=>r("p",{class:"desc",children:p},void 0,!1,void 0,this)),r("p",{class:"present",children:()=>{let p=t.view().people??[];return p.length===0?"ここには誰もいない。":`ここにいるのは、${p.map((R)=>R.name).join("、")}。`}},void 0,!1,void 0,this)]},void 0,!0,void 0,this);return r("div",{class:yt,children:[r(g,{when:e,children:[r("div",{class:"backdrop",onClick:v},void 0,!1,void 0,this),r("section",{class:"book",role:"dialog","aria-label":"手帳",tabindex:-1,ref:(p)=>f=p,children:[r("header",{children:[r("h2",{children:"手帳"},void 0,!1,void 0,this),r("button",{type:"button",class:"close","aria-label":"手帳を閉じる",onClick:v,children:"×"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"tabs",role:"tablist",children:[r(k,{id:"people",label:()=>`人物 ${T().length+(b()===void 0?0:1)}`},void 0,!1,void 0,this),r(k,{id:"evidence",label:()=>`証拠 ${o().length}`},void 0,!1,void 0,this),r(k,{id:"place",label:()=>"現在地"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"page",children:[()=>n()==="people"?r(J,{},void 0,!1,void 0,this):n()==="evidence"?r(K,{},void 0,!1,void 0,this):r(B,{},void 0,!1,void 0,this),r(g,{when:()=>n()!=="place",children:r("p",{class:"tip",children:"名前をコピーして、入力欄に貼り付けられます。"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),r("button",{type:"button",class:()=>t.hidden()?"fab gone":e()?"fab opened":"fab","aria-label":()=>e()?"手帳を閉じる":"手帳を開く","aria-expanded":()=>String(e()),onClick:l,children:[r("img",{src:()=>e()?At:wt,alt:"",width:"64",height:"64"},void 0,!1,void 0,this),r(g,{when:()=>d()>0&&!e(),children:r("span",{class:"badge",children:()=>`+${d()}`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var He=(t)=>`jev-mystery:${t}`;function Sn(t){try{let e=localStorage.getItem(He(t));return e===null?null:JSON.parse(e)}catch{return null}}function Tn(t,e){try{localStorage.setItem(He(t),JSON.stringify(e))}catch{}}function Le(t,e){let n=[...t];for(let o of e)if(o!==void 0&&!n.some((s)=>s.id===o.id))n.push(o);return n.length===t.length?t:n}function Rn(t){try{localStorage.removeItem(He(t))}catch{}}function Mt(){let t=Te(),[e,{refetch:n}]=D(()=>t().case??!1,(u)=>it(u)),o=h(""),s=h(null),i=h([]),a=h("playing"),d=h(""),f=h(""),m=h([]),v=h(!1),l=h(!1),y=h(""),w=h(""),b=h([]),T=h(0),M=null,N=null,k=null,J=window.matchMedia("(pointer: coarse)").matches,K=()=>t().case??"",B="";L(()=>{let u=e();if(u===void 0)return;document.title=u.title,d.set(""),f.set(""),y.set(""),B=K();let c=Sn(B);if(c!==null){o.set(c.token),s.set(c.view),i.set(c.entries),a.set(c.phase),w.set(c.beforeAnswer),b.set(c.hints),T.set(c.shown),m.set(c.met??Le([],[...c.view.people??[],...c.entries.map((W)=>W.kind==="turn"?W.speaker:void 0)])),requestAnimationFrame(()=>M?.lastElementChild?.scrollIntoView({block:"end"}));return}o.set(u.state),m.set(Le([],u.view.people??[])),s.set(u.view);let A=u.arrival??[];i.set([{kind:"narration",lines:u.opening},{kind:"narration",lines:u.incident},...A.length>0?[{kind:"narration",lines:A}]:[]]),a.set("playing"),w.set(""),b.set([]),T.set(0)}),L(()=>{let u=s();if(u===null||B==="")return;Tn(B,{token:o(),view:u,entries:i(),phase:a(),beforeAnswer:w(),hints:b(),shown:T(),met:m()})}),L(()=>{a(),v.set(!1)});let p=()=>{s.set(null),Rn(B),n()},R=(u)=>{i.update((c)=>[...c,u]),requestAnimationFrame(()=>M?.lastElementChild?.scrollIntoView({block:"end"}))},ee=(u)=>y.set(u instanceof Error?u.message:String(u)),ce=async(u)=>{if(l.peek()||u==="")return;l.set(!0),y.set("");try{let c=await at(o.peek(),u);if(o.set(c.state),m.update((A)=>Le(A,[...c.view.people??[],c.speaker])),s.set(c.view),R({kind:"turn",input:u,matched:c.matched,did:c.did,speaker:c.speaker,lines:c.text,gained:c.gained??[],moved:c.moved_to===void 0?void 0:c.view.scene.name,arrival:c.arrival??[],interlude:c.interlude??[]}),c.finale===!0)a.set("accusing")}catch(c){ee(c)}finally{if(l.set(!1),!J)N?.focus()}},Ht=async(u)=>{if(l.peek()||u==="")return;l.set(!0),y.set(""),R({kind:"answer",text:u});try{let c=o.peek(),A=await lt(c,u);if(w.set(c),o.set(A.state),A.hints!==void 0&&A.hints.length>0)b.set(A.hints);R({kind:"ending",verdict:A,share:{title:e()?.title??"",turns:s()?.turn??0}}),a.set("closed")}catch(c){ee(c)}finally{l.set(!1)}},Pt=()=>{if(l.peek()||w.peek()==="")return;o.set(w.peek()),y.set(""),R({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),a.set("accusing")},It=()=>{if(l()||a()==="closed")return null;return(u)=>{let c=a.peek()==="accusing",A=c?k:N,W=c?f:d;if(A===null||!A.isConnected||A.disabled)return;let ue=W.peek(),te=A.selectionStart??ue.length,_t=A.selectionEnd??te;W.set(ue.slice(0,te)+u+ue.slice(_t)),A.focus(),A.setSelectionRange(te+u.length,te+u.length)}},P=()=>s(),Nt=()=>r("div",{children:[r(g,{when:()=>P().finale_open&&a()==="playing",children:r("div",{class:vt,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:l,onClick:()=>ce(P().finale_label??"全員を集める"),children:()=>P().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:dt,children:[r("div",{children:[r(St,{view:P},void 0,!1,void 0,this),r(Tt,{view:P},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${H} ${ht}`,ref:(u)=>M=u,children:[r(C,{each:i,children:(u)=>r(Rt,{entry:u},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:l,children:r("p",{class:ae,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",fallback:()=>r(Jt,{},void 0,!1,void 0,this),children:()=>r(Bt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>b().length>0,children:()=>r(Ft,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),r(Ct,{view:P,met:m,hidden:()=>J&&v()},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Bt=()=>r("div",{class:`${H} ${Ee}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(Ot,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(u)=>{u.preventDefault();let c=d.peek().trim();if(d.set(""),J)N?.blur();ce(c)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:d,disabled:l,ref:(u)=>{if(N=u,!J)N.focus()},onFocus:()=>v.set(!0),onBlur:()=>v.set(!1),onInput:(u)=>d.set(u.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:l,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>P().finale_open,children:r("div",{class:Ce,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>ce(P().finale_label??"全員を集める"),children:()=>P().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>y()!=="",children:r("p",{class:"error",children:y},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Jt=()=>r("div",{class:`${H} ${Ee}`,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:Pt,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Ft=()=>r("div",{class:`${H} ${gt}`,children:[r(C,{each:()=>b().slice(0,T()),children:(u,c)=>r("p",{children:`ヒント${c+1}　${u}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>T()<b().length,children:r("button",{type:"button",class:"secondary",onClick:()=>T.update((u)=>u+1),children:()=>T()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Ot=()=>{let u=()=>(P().suspects??[]).map((c)=>c.replace(/（[^（）]*）$/,""));return r("div",{children:[r("form",{class:"stacked",onSubmit:(c)=>{c.preventDefault(),Ht(f.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:f,disabled:l,ref:(c)=>{k=c,k.focus()},onFocus:()=>v.set(!0),onBlur:()=>v.set(!1),onInput:(c)=>f.set(c.target.value)},void 0,!1,void 0,this),r(g,{when:()=>u().length>0,children:r("div",{class:xt,children:[r("span",{children:"名前を入れる"},void 0,!1,void 0,this),r(C,{each:u,children:(c)=>r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>It()?.(c),children:c},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:l,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),r("div",{class:Ce,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>a.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>e()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>e()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:l,onClick:p,children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:H,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>s()!==null,children:Nt},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function En(){return r("main",{class:ut,children:[r(Re,{children:[r(oe,{path:"/",component:kt},void 0,!1,void 0,this),r(oe,{path:"/:case",component:Mt},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:se},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Cn(){return r(Se,{source:we(),children:()=>r(En,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var Lt=document.getElementById("app");if(Lt)be(()=>r(Cn,{},void 0,!1,void 0,this),Lt);

//# debugId=3BD3EAA5D86C451764756E2164756E21
//# sourceMappingURL=chunk-b1s7ae5r.js.map
