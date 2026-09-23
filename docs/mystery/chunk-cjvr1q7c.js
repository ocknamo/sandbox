var At=!1,ke=new Set,kt=(t)=>console.warn(t),Tt=kt,St="kanabun [dev]: ";function Et(){return At||globalThis.__KANABUN_DEV__===!0}function I(t){if(!Et())return;if(ke.has(t))return;ke.add(t),Tt(St+t)}var J=0,Te=1,X=2,O=3,k=null,h=null,oe=0,re=!1,W=[],Rt=1e6,j=(t,e)=>t===e,Lt=()=>!1;function Re(t){if(!t||t.equals===void 0)return j;if(t.equals===!1)return Lt;return t.equals}class D{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,o){if(this.equals=n,this.isEffect=e,o){if(this.fn=t,this.value=void 0,this.color=X,h!==null)(h.owned??=[]).push(this),this.owner=h}else this.fn=null,this.value=t,this.color=J}read(){if(this.color===O)return this.value;if(k!==null)(k.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(k!==null&&!k.isEffect)I("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(X)}markStale(t){if(this.color>=t)return;let e=this.color===J;if(this.color=t,e&&this.isEffect)Le(this);if(this.observers!==null)for(let n of this.observers)n.markStale(Te)}updateIfNecessary(){if(this.color===J||this.color===O)return;if(this.color===Te&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===X)break}if(this.color===X)this.update();this.color=J}update(){this.cleanNode();let t=k,e=h;k=this,h=this,this.collecting=[];let n,o,s=!1;try{n=this.fn()}catch(a){s=!0,o=a}finally{k=t,h=e}if(s){this.collecting=null,this.color=J,Mt(o,this.owner);return}this.reconcileSources();let i=!this.equals(this.value,n);if(this.value=n,this.color=J,i&&this.observers!==null){for(let a of this.observers)if(a.color!==O&&a.color<X)a.color=X}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))Se(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))Ht(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===O)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)Se(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=O}}function Ht(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function Se(t,e){let n=t.observers;if(n===null)return;let o=n.indexOf(e);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function Le(t){W.push(t)}function se(){if(re)return;re=!0;let t=0,e=0;try{while(t<W.length){if(++e>Rt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=W[t++];if(n.color!==O)n.updateIfNecessary()}}finally{W.length=0,re=!1}}function He(t,e){let n=h,o=k;h=t,k=null;try{return e()}finally{h=n,k=o}}function ie(t,e){let n=h;h=t;try{return e()}finally{h=n}}function Me(){let t=new D(void 0,!1,j,!1);if(t.owner=h,h!==null)(h.owned??=[]).push(t);return t}function m(t,e){let n=new D(t,!1,Re(e),!1),o=()=>n.read(),s=o;return s.set=(i)=>{if(n.write(i),oe===0)se()},s.update=(i)=>{if(n.write(i(n.value)),oe===0)se()},s.peek=()=>n.value,o}function M(t,e){let n=new D(t,!1,Re(e),!0);return()=>n.read()}function E(t){if(h===null)I("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new D(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,j,!0);if(Le(e),oe===0)se();return()=>e.dispose()}function U(t){let e=k;k=null;try{return t()}finally{k=e}}var Ee=Symbol("error-handler");function Mt(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&Ee in n.context){n.context[Ee](t);return}throw t}function P(t){if(h===null){I("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(h.cleanups??=[]).push(t)}function C(t){let e=new D(void 0,!1,j,!1);return e.owner=h,He(e,()=>t(()=>e.dispose()))}function Pt(t,e){let n=Me();return n.context={[t]:e},n}function F(t){let e=Symbol("context");return{id:e,defaultValue:t,Provider(n){let o=Pt(e,n.value),s=n.children,i=ie(o,()=>typeof s==="function"?s():s);return typeof i==="function"?()=>ie(o,i):i}}}function N(t){for(let e=h;e!==null;e=e.owner)if(e.context!==null&&t.id in e.context)return e.context[t.id];return t.defaultValue}function le(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function Ct(t){return t!=null&&typeof t.nodeType==="number"}function Nt(t){return t.nodeType===3}var It=new Set(["script","style"]);function ce(t,e){let n=le().createElement(t);if(e!==null){for(let o in e){if(o==="children"||o==="ref")continue;Ft(n,o,e[o])}if(e.ref!==void 0)Dt(e.ref,n);if("children"in e)Ot(t,e.children),G(n,e.children)}return n}function Ot(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!It.has(t.toLowerCase()))return;I(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function Dt(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function Ft(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){_t(t,n);return}if(typeof n==="function")E(()=>Ce(t,e,n()));else Ce(t,e,n)}function _t(t,e){for(let n in e){let o=e[n];if(typeof o==="function")E(()=>Pe(t,n,o()));else Pe(t,n,o)}}function Pe(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function Ce(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function G(t,e,n=null){if(Array.isArray(e)){for(let o of e)G(t,o,n);return}if(typeof e==="function"){let o=t.insertBefore(le().createComment(""),n);Ne(t,e,o,{current:null});return}Ie(t,e,null,n)}function Ne(t,e,n,o){E(()=>{let s=e();if(typeof s==="function")Ne(t,s,n,o);else o.current=Ie(t,s,o.current,n)})}function Ie(t,e,n,o){if(n!==null&&n.length===1&&Nt(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let s=zt(e);return Oe(t,n??[],s,o),s.length>0?s:null}function Oe(t,e,n,o){if(e.length>0){let i=new Set(n);for(let a of e)if(!i.has(a)&&a.parentNode===t)t.removeChild(a)}let s=o;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.parentNode!==t||a.nextSibling!==s)t.insertBefore(a,s);s=a}}function zt(t){let e=[];return ae(e,t),e}function ae(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)ae(t,n);return}if(Ct(e)){t.push(e);return}if(typeof e==="function"){ae(t,e());return}t.push(le().createTextNode(String(e)))}function ue(t,e){let n;return C((o)=>{n=o,G(e,t())}),()=>{n(),e.textContent=""}}function De(t,e){let n=[],o=[],s=[];return P(()=>{for(let i of s)i()}),()=>{let i=t(),a=i.length,u=Array(a),l=Array(a),f=new Map;for(let p=0;p<n.length;p++){let b=f.get(n[p]);if(b)b.push(p);else f.set(n[p],[p])}let v=Array(n.length).fill(!1);for(let p=0;p<a;p++){let b=i[p],A=f.get(b);if(A!==void 0&&A.length>0){let w=A.shift();v[w]=!0,u[p]=o[w],l[p]=s[w]}else{let w,_=C((S)=>(w=e(b,p),S));u[p]=w,l[p]=_}}for(let p=0;p<s.length;p++)if(!v[p])s[p]();return n=i.slice(),o=u,s=l,u}}function g(t){let e=M(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function R(t){let e=De(()=>t.each()??[],(n,o)=>t.children(n,o));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var Xt=F(null);function q(t,e){let n=e!==void 0,o=n?t:()=>!0,s=n?e:t,i=m(void 0),a=m(void 0),u=m(!1),l=N(Xt),f=!1,v=!1,p=0,b=()=>{if(l!==null&&!f&&!v)l.increment(),f=!0},A=()=>{if(f)f=!1,l.decrement()},w=(x,K)=>{let z=++p;u.set(!0),b();let ne={value:i.peek(),refetching:K};Promise.resolve().then(()=>s(x,ne)).then((V)=>{if(z!==p)return;i.set(V),a.set(void 0),u.set(!1),v=!0,A()},(V)=>{if(z!==p)return;a.set(V),u.set(!1),A()})};if(n)E(()=>{let x=o();if(x===!1||x===null||x===void 0){p++,u.set(!1),A();return}U(()=>w(x,!1))});else w(!0,!1);P(()=>{p++,A()});let _=()=>i(),S=_;return S.loading=()=>u(),S.error=()=>a(),[_,{mutate:(x)=>{p++,u.set(!1),a.set(void 0),A(),v=!0,i.set(x)},refetch:()=>{let x=U(o);if(x===!1||x===null||x===void 0)return;w(x,!0)}}]}var Vt=/^@(media|supports|container|document|layer)\b/i;function y(t,...e){let n=typeof t==="string"?t:t.reduce((i,a,u)=>i+a+(u<e.length?String(e[u]):""),""),o=Ut(n),s="k-"+o;return Kt(o,de(n,"."+s)),s}function jt(t){let e=[],n="",o=0,s="",i="",a="";for(let u=0;u<t.length;u++){let l=t[u];if(l==="{"){if(o===0){let f=s.lastIndexOf(";");n+=s.slice(0,f+1),a=s.slice(f+1),s="",i=""}else i+=l;o++}else if(l==="}")if(o--,o===0)e.push({prelude:a,inner:i});else if(o>0)i+=l;else o=0;else if(o===0)s+=l;else i+=l}return n+=s,{decls:n,blocks:e}}function de(t,e){let{decls:n,blocks:o}=jt(t),s="",i=n.trim();if(i)s+=`${e}{${i}}`;for(let{prelude:a,inner:u}of o){let l=a.trim();if(l[0]==="@")s+=Vt.test(l)?`${l}{${de(u,e)}}`:`${l}{${u.trim()}}`;else s+=de(u,qt(l,e))}return s}function qt(t,e){return Bt(t,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,e):`${e} ${o}`}).join(",")}function Bt(t,e){let n=[],o=0,s="";for(let i=0;i<t.length;i++){let a=t[i];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===e&&o===0)n.push(s),s="";else s+=a}return n.push(s),n}var Fe=new Map;function Kt(t,e){let n=globalThis.document;if(!n){if(!Fe.has(t))Fe.set(t,e);return}Wt(n,t,e)}function Wt(t,e,n){let o=t.head;for(let i of o.childNodes)if(i.nodeType===1&&i.getAttribute("data-k")===e)return;let s=t.createElement("style");s.setAttribute("data-k",e),s.textContent=n,o.appendChild(s)}function Ut(t){let e=5381,n=2166136261;for(let o=0;o<t.length;o++){let s=t.charCodeAt(o);e=(e<<5)+e^s,n=Math.imul(n^s,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}function pe(t,e,n){if(typeof t==="function")return t(e??{});return ce(t,e??null)}function Je(t){let e=new URL(t,"http://kanabun.local"),n={};return e.searchParams.forEach((o,s)=>{n[s]=o}),{pathname:e.pathname,search:e.search,hash:e.hash,query:n}}function _e(t){let e=[];for(let n of t.split("/"))if(n!=="")e.push(n);return e}function ze(t){try{return decodeURIComponent(t)}catch{return t}}function $e(t,e){let n=_e(t),o=_e(e),s={};for(let i=0;i<n.length;i++){let a=n[i];if(a[0]==="*"){let l=a.slice(1),f=o.slice(i);if(l!=="")s[l]=f.map(ze).join("/");return{params:s,rest:"/"+f.join("/")}}let u=o[i];if(u===void 0)return null;if(a[0]===":")s[a.slice(1)]=ze(u);else if(a!==u)return null}return o.length===n.length?{params:s,rest:null}:null}function Xe(t,e){let n=e.startsWith("/")?e:"/"+e,o=new URL(t,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function Ve(){let t=globalThis.window;if(!t)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return t}function fe(t=Ve()){return{location:()=>t.location.pathname+t.location.search+t.location.hash,push:(n)=>t.history.pushState(null,"",n),replace:(n)=>t.history.replaceState(null,"",n),subscribe(n){return t.addEventListener("popstate",n),()=>t.removeEventListener("popstate",n)}}}function he(t=Ve()){return{location:()=>{let n=t.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{t.location.hash=n},replace:(n)=>t.history.replaceState(null,"","#"+n),subscribe(n){return t.addEventListener("hashchange",n),()=>t.removeEventListener("hashchange",n)}}}var qe=F(null),me=F(null),je=F(null),Be=Object.freeze({});function Gt(t){let e=N(qe);if(e===null)throw Error(`kanabun/router: ${t} must be used inside a <Router>.`);return e}function ge(t){let e=t.source??fe(),n=m(e.location());P(e.subscribe(()=>n.set(e.location())));let o=M(()=>Je(n())),s=(i,a)=>{let u=Qt(i)?i:Xe(i,o().pathname);if(a?.replace)e.replace(u);else e.push(u);n.set(e.location())};return qe.Provider({value:{location:o,navigate:s},children:t.children})}function ve(){return N(me)??(()=>Be)}function Y(t){let{location:e}=Gt("<Route>"),n=N(me),s=N(je)??(()=>e().pathname),i=M(()=>$e(t.path,s())),a=M(()=>i()!==null),u=M(()=>{let b=i()?.params??Be;return n===null?b:{...n(),...b}}),l=()=>i()?.rest??"/",f=()=>me.Provider({value:u,children:()=>je.Provider({value:l,children:()=>{if(t.component!==void 0)return t.component({params:u});if(typeof t.children==="function")return t.children(u);return t.children}})}),v=Ke(),p=()=>{if(a())return v(f);return v(null),t.fallback??null};return p.$matched=a,p.$content=f,p}function Ke(){let t=null;return P(()=>t?.()),(e)=>{if(t!==null)t(),t=null;if(e===null)return null;let n;return t=C((o)=>(n=e(),o)),n}}function Yt(t){return typeof t==="function"&&"$matched"in t}function We(t,e){if(Array.isArray(t))for(let n of t)We(n,e);else if(Yt(t))e.push(t)}function be(t){let e=[];We(t.children,e);let n=Ke();return()=>{for(let o of e)if(o.$matched())return n(o.$content);return n(null),t.fallback??null}}function Qt(t){return/^[a-z][a-z0-9+.-]*:/i.test(t)||t.startsWith("//")}var Q=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function Ue(t){return/^https?:\/\//i.test(t)?t:`${Q}/${t.replace(/^\/+/,"")}`}async function Z(t,e){let n=await fetch(Q+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var Ge=()=>Z("/api/cases"),Ye=(t)=>Z("/api/new",{case:t}),Qe=(t,e)=>Z("/api/act",{state:t,input:e}),Ze=(t,e)=>Z("/api/accuse",{state:t,answer:e});var tt=y`
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
`,nt=y`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,T=y`
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
`,rt=y`
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
`,ot=y`
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
`,st=y`
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
`,B=y`
  color: var(--muted);
  font-size: 13px;
`,it=y`
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
`,xe=y`
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
`,ye=y`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`,at=y`
  margin-top: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,lt=y`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,ct=y`
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
`,ee=y`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function r(t,e,n,o,s,i){return pe(t,e,n)}function ut(){let[t]=q(()=>Ge());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.loading(),children:r("p",{class:ee,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:T,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:B,children:()=>String(t.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:ct,children:r(R,{each:()=>t()?.cases??[],children:(e)=>r("a",{href:`#${e.id}`,children:[r("p",{class:"title",children:e.title},void 0,!1,void 0,this),r(g,{when:()=>e.byline!==void 0,children:r("p",{class:"byline",children:e.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function dt(t){let e=t.person,n=m(0);return r("div",{class:ot,children:[r("span",{children:e.avatar||"？"},void 0,!1,void 0,this),()=>{if(!e.image||n()>=2)return null;let o=Ue(e.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:e.name,loading:"lazy",onError:()=>n.update((s)=>s+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function pt(t){return r("div",{class:T,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:rt,children:[r("p",{class:"name",children:()=>t.view().scene.name},void 0,!1,void 0,this),()=>t.view().scene.description.map((e)=>r("p",{class:"desc",children:e},void 0,!1,void 0,this)),r("div",{class:"people",children:r(R,{each:()=>t.view().people??[],fallback:r("p",{class:B,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"person",children:[r(dt,{person:e},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:e.name},void 0,!1,void 0,this),r("div",{class:"role",children:e.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function ft(t){return r("div",{class:T,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:st,children:r(R,{each:()=>t.view().evidence??[],fallback:r("p",{class:B,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"item",children:[r("div",{class:"name",children:e.name},void 0,!1,void 0,this),r("div",{class:"desc",children:e.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function ht(t){let e=t.entry;if(e.kind==="narration")return r("div",{class:"entry",children:e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(e.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:e.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(e.kind==="ending")return r(Zt,{verdict:e.verdict},void 0,!1,void 0,this);return r("div",{class:e.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+e.input},void 0,!1,void 0,this),e.speaker?r("div",{class:"speaker",children:[r(dt,{person:e.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:e.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,e.did?r("p",{class:"did",children:e.did},void 0,!1,void 0,this):null,e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),e.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),e.moved?r("div",{class:"moved",children:"— "+e.moved+" —"},void 0,!1,void 0,this):null,e.arrival.length>0?r("div",{class:"arrival",children:e.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,e.interlude.length>0?r("div",{class:"interlude",children:e.interlude.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function Zt(t){let e=t.verdict,n=e.correct?`犯人を言い当てた（${e.named_name}）`:e.named_name?`${e.named_name}を指した`:"犯人を名指ししなかった",o=(f,v)=>[r("span",{class:f?"mark":"mark no",children:f?"○":"×"},void 0,!1,void 0,this),r("span",{children:v},void 0,!1,void 0,this)],s=e.points.filter((f)=>f.hit),i=e.points.length-s.length,a=`${Math.round(100*e.coherence/(e.coherence_top||1))}%`,u=e.celebrate===!0,l=u&&e.correct&&i===0?"完 全 解 決":"事 件 解 決";return r("div",{class:u?"entry said won":"entry said",children:[u?r("p",{class:"solved",children:l},void 0,!1,void 0,this):null,r("h3",{children:e.title},void 0,!1,void 0,this),e.text.map((f)=>r("p",{children:f},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(e.correct,n),s.map((f)=>o(!0,f.label)),i>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${i} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${e.coherence.toFixed(1)} / ${e.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.coherence_legend!==void 0,children:e.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var we=(t)=>`jev-mystery:${t}`;function en(t){try{let e=localStorage.getItem(we(t));return e===null?null:JSON.parse(e)}catch{return null}}function tn(t,e){try{localStorage.setItem(we(t),JSON.stringify(e))}catch{}}function nn(t){try{localStorage.removeItem(we(t))}catch{}}function mt(){let t=ve(),[e,{refetch:n}]=q(()=>t().case??!1,(c)=>Ye(c)),o=m(""),s=m(null),i=m([]),a=m("playing"),u=m(""),l=m(!1),f=m(""),v=m(""),p=m([]),b=m(0),A=null,w=null,_=()=>t().case??"",S="";E(()=>{let c=e();if(c===void 0)return;document.title=c.title,u.set(""),f.set(""),S=_();let d=en(S);if(d!==null){o.set(d.token),s.set(d.view),i.set(d.entries),a.set(d.phase),v.set(d.beforeAnswer),p.set(d.hints),b.set(d.shown),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}));return}o.set(c.state),s.set(c.view);let H=c.arrival??[];i.set([{kind:"narration",lines:c.opening},{kind:"narration",lines:c.incident},...H.length>0?[{kind:"narration",lines:H}]:[]]),a.set("playing"),v.set(""),p.set([]),b.set(0)}),E(()=>{let c=s();if(c===null||S==="")return;tn(S,{token:o(),view:c,entries:i(),phase:a(),beforeAnswer:v(),hints:p(),shown:b()})});let Ae=()=>{s.set(null),nn(S),n()},x=(c)=>{i.update((d)=>[...d,c]),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}))},K=(c)=>f.set(c instanceof Error?c.message:String(c)),z=async(c)=>{if(l.peek()||c==="")return;l.set(!0),f.set("");try{let d=await Qe(o.peek(),c);if(o.set(d.state),s.set(d.view),x({kind:"turn",input:c,matched:d.matched,did:d.did,speaker:d.speaker,lines:d.text,gained:d.gained??[],moved:d.moved_to===void 0?void 0:d.view.scene.name,arrival:d.arrival??[],interlude:d.interlude??[]}),d.finale===!0)a.set("accusing")}catch(d){K(d)}finally{l.set(!1),w?.focus()}},ne=async(c)=>{if(l.peek()||c==="")return;l.set(!0),f.set(""),x({kind:"answer",text:c});try{let d=o.peek(),H=await Ze(d,c);if(v.set(d),o.set(H.state),H.hints!==void 0&&H.hints.length>0)p.set(H.hints);x({kind:"ending",verdict:H}),a.set("closed")}catch(d){K(d)}finally{l.set(!1)}},V=()=>{if(l.peek()||v.peek()==="")return;o.set(v.peek()),f.set(""),x({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),a.set("accusing")},L=()=>s(),vt=()=>r("div",{children:[r(g,{when:()=>L().finale_open&&a()==="playing",children:r("div",{class:lt,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:l,onClick:()=>z(L().finale_label??"全員を集める"),children:()=>L().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:nt,children:[r("div",{children:[r(pt,{view:L},void 0,!1,void 0,this),r(ft,{view:L},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${T} ${it}`,ref:(c)=>A=c,children:[r(R,{each:i,children:(c)=>r(ht,{entry:c},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:l,children:r("p",{class:ee,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",fallback:()=>r(xt,{},void 0,!1,void 0,this),children:()=>r(bt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>p().length>0,children:()=>r(yt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),bt=()=>r("div",{class:`${T} ${xe}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(wt,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(c)=>{c.preventDefault();let d=u.peek().trim();u.set(""),z(d)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:u,disabled:l,ref:(c)=>{w=c,w.focus()},onInput:(c)=>u.set(c.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:l,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>L().finale_open,children:r("div",{class:ye,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>z(L().finale_label??"全員を集める"),children:()=>L().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>f()!=="",children:r("p",{class:"error",children:f},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),xt=()=>r("div",{class:`${T} ${xe}`,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:V,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),yt=()=>r("div",{class:`${T} ${at}`,children:[r(R,{each:()=>p().slice(0,b()),children:(c,d)=>r("p",{children:`ヒント${d+1}　${c}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>b()<p().length,children:r("button",{type:"button",class:"secondary",onClick:()=>b.update((c)=>c+1),children:()=>b()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),wt=()=>{let c=m("");return r("div",{children:[r("form",{class:"stacked",onSubmit:(d)=>{d.preventDefault(),ne(c.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:c,disabled:l,ref:(d)=>d.focus(),onInput:(d)=>c.set(d.target.value)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:l,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),r("div",{class:ye,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>a.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>e()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>e()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:l,onClick:Ae,children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:T,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>s()!==null,children:vt},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function rn(){return r("main",{class:tt,children:[r(be,{children:[r(Y,{path:"/",component:ut},void 0,!1,void 0,this),r(Y,{path:"/:case",component:mt},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:Q},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function on(){return r(ge,{source:he(),children:()=>r(rn,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var gt=document.getElementById("app");if(gt)ue(()=>r(on,{},void 0,!1,void 0,this),gt);

//# debugId=BA4D6FE74AAD41C564756E2164756E21
//# sourceMappingURL=chunk-cjvr1q7c.js.map
