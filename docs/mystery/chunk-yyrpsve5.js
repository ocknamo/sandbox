var kt=!1,ke=new Set,Tt=(e)=>console.warn(e),St=Tt,Et="kanabun [dev]: ";function Rt(){return kt||globalThis.__KANABUN_DEV__===!0}function I(e){if(!Rt())return;if(ke.has(e))return;ke.add(e),St(Et+e)}var J=0,Te=1,X=2,O=3,k=null,m=null,oe=0,re=!1,W=[],Lt=1e6,j=(e,t)=>e===t,Ct=()=>!1;function Re(e){if(!e||e.equals===void 0)return j;if(e.equals===!1)return Ct;return e.equals}class D{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(e,t,n,o){if(this.equals=n,this.isEffect=t,o){if(this.fn=e,this.value=void 0,this.color=X,m!==null)(m.owned??=[]).push(this),this.owner=m}else this.fn=null,this.value=e,this.color=J}read(){if(this.color===O)return this.value;if(k!==null)(k.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(e){if(k!==null&&!k.isEffect)I("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,e))return;if(this.value=e,this.observers!==null)for(let t of this.observers)t.markStale(X)}markStale(e){if(this.color>=e)return;let t=this.color===J;if(this.color=e,t&&this.isEffect)Le(this);if(this.observers!==null)for(let n of this.observers)n.markStale(Te)}updateIfNecessary(){if(this.color===J||this.color===O)return;if(this.color===Te&&this.sources!==null){for(let e of this.sources)if(e.updateIfNecessary(),this.color===X)break}if(this.color===X)this.update();this.color=J}update(){this.cleanNode();let e=k,t=m;k=this,m=this,this.collecting=[];let n,o,s=!1;try{n=this.fn()}catch(a){s=!0,o=a}finally{k=e,m=t}if(s){this.collecting=null,this.color=J,Pt(o,this.owner);return}this.reconcileSources();let i=!this.equals(this.value,n);if(this.value=n,this.color=J,i&&this.observers!==null){for(let a of this.observers)if(a.color!==O&&a.color<X)a.color=X}}reconcileSources(){let e=this.collecting;this.collecting=null;let t=[];for(let n of e)if(!t.includes(n))t.push(n);if(this.sources!==null){for(let n of this.sources)if(!t.includes(n))Se(n,this)}for(let n of t)if(this.sources===null||!this.sources.includes(n))Ht(n,this);this.sources=t.length>0?t:null}disposeOwned(){if(this.owned===null)return;let e=this.owned;this.owned=null;for(let t=e.length-1;t>=0;t--)e[t].dispose()}runCleanups(){if(this.cleanups===null)return;let e=this.cleanups;this.cleanups=null;for(let t=e.length-1;t>=0;t--)e[t]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===O)return;if(this.cleanNode(),this.sources!==null){for(let e of this.sources)Se(e,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=O}}function Ht(e,t){if(e.observers===null)e.observers=[t];else e.observers.push(t)}function Se(e,t){let n=e.observers;if(n===null)return;let o=n.indexOf(t);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)e.observers=null}function Le(e){W.push(e)}function se(){if(re)return;re=!0;let e=0,t=0;try{while(e<W.length){if(++t>Lt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=W[e++];if(n.color!==O)n.updateIfNecessary()}}finally{W.length=0,re=!1}}function Ce(e,t){let n=m,o=k;m=e,k=null;try{return t()}finally{m=n,k=o}}function ie(e,t){let n=m;m=e;try{return t()}finally{m=n}}function He(){let e=new D(void 0,!1,j,!1);if(e.owner=m,m!==null)(m.owned??=[]).push(e);return e}function h(e,t){let n=new D(e,!1,Re(t),!1),o=()=>n.read(),s=o;return s.set=(i)=>{if(n.write(i),oe===0)se()},s.update=(i)=>{if(n.write(i(n.value)),oe===0)se()},s.peek=()=>n.value,o}function H(e,t){let n=new D(e,!1,Re(t),!0);return()=>n.read()}function E(e){if(m===null)I("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let t=new D(()=>{let n=e();if(typeof n==="function")(t.cleanups??=[]).push(n)},!0,j,!0);if(Le(t),oe===0)se();return()=>t.dispose()}function U(e){let t=k;k=null;try{return e()}finally{k=t}}var Ee=Symbol("error-handler");function Pt(e,t){for(let n=t;n!==null;n=n.owner)if(n.context!==null&&Ee in n.context){n.context[Ee](e);return}throw e}function P(e){if(m===null){I("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(m.cleanups??=[]).push(e)}function M(e){let t=new D(void 0,!1,j,!1);return t.owner=m,Ce(t,()=>e(()=>t.dispose()))}function Mt(e,t){let n=He();return n.context={[e]:t},n}function F(e){let t=Symbol("context");return{id:t,defaultValue:e,Provider(n){let o=Mt(t,n.value),s=n.children,i=ie(o,()=>typeof s==="function"?s():s);return typeof i==="function"?()=>ie(o,i):i}}}function N(e){for(let t=m;t!==null;t=t.owner)if(t.context!==null&&e.id in t.context)return t.context[e.id];return e.defaultValue}function le(){let e=globalThis.document;if(!e)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return e}function Nt(e){return e!=null&&typeof e.nodeType==="number"}function It(e){return e.nodeType===3}var Ot=new Set(["script","style"]);function ce(e,t){let n=le().createElement(e);if(t!==null){for(let o in t){if(o==="children"||o==="ref")continue;Ft(n,o,t[o])}if(t.ref!==void 0)Dt(t.ref,n);if("children"in t)$t(e,t.children),G(n,t.children)}return n}function $t(e,t){if(t==null||t==="")return;if(Array.isArray(t)&&t.length===0)return;if(!Ot.has(e.toLowerCase()))return;I(`a child of <${e.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function Dt(e,t){if(typeof e==="function")e(t);else if(e!==null&&typeof e==="object")e.current=t}function Ft(e,t,n){if(t.length>2&&t[0]==="o"&&t[1]==="n"){e.addEventListener(t.slice(2).toLowerCase(),n);return}if(t==="style"&&n!==null&&typeof n==="object"){_t(e,n);return}if(typeof n==="function")E(()=>Me(e,t,n()));else Me(e,t,n)}function _t(e,t){for(let n in t){let o=t[n];if(typeof o==="function")E(()=>Pe(e,n,o()));else Pe(e,n,o)}}function Pe(e,t,n){e.style.setProperty(t,n==null?"":String(n))}function Me(e,t,n){if(t==="value"||t==="checked"||t==="selected"){e[t]=n;return}if(t==="className")t="class";if(n==null||n===!1)e.removeAttribute(t);else if(n===!0)e.setAttribute(t,"");else e.setAttribute(t,String(n))}function G(e,t,n=null){if(Array.isArray(t)){for(let o of t)G(e,o,n);return}if(typeof t==="function"){let o=e.insertBefore(le().createComment(""),n);Ne(e,t,o,{current:null});return}Ie(e,t,null,n)}function Ne(e,t,n,o){E(()=>{let s=t();if(typeof s==="function")Ne(e,s,n,o);else o.current=Ie(e,s,o.current,n)})}function Ie(e,t,n,o){if(n!==null&&n.length===1&&It(n[0])&&(typeof t==="string"||typeof t==="number"))return n[0].data=String(t),n;let s=zt(t);return Oe(e,n??[],s,o),s.length>0?s:null}function Oe(e,t,n,o){if(t.length>0){let i=new Set(n);for(let a of t)if(!i.has(a)&&a.parentNode===e)e.removeChild(a)}let s=o;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.parentNode!==e||a.nextSibling!==s)e.insertBefore(a,s);s=a}}function zt(e){let t=[];return ae(t,e),t}function ae(e,t){if(t==null||t===!1||t===!0||t==="")return;if(Array.isArray(t)){for(let n of t)ae(e,n);return}if(Nt(t)){e.push(t);return}if(typeof t==="function"){ae(e,t());return}e.push(le().createTextNode(String(t)))}function ue(e,t){let n;return M((o)=>{n=o,G(t,e())}),()=>{n(),t.textContent=""}}function $e(e,t){let n=[],o=[],s=[];return P(()=>{for(let i of s)i()}),()=>{let i=e(),a=i.length,l=Array(a),c=Array(a),f=new Map;for(let p=0;p<n.length;p++){let b=f.get(n[p]);if(b)b.push(p);else f.set(n[p],[p])}let v=Array(n.length).fill(!1);for(let p=0;p<a;p++){let b=i[p],A=f.get(b);if(A!==void 0&&A.length>0){let w=A.shift();v[w]=!0,l[p]=o[w],c[p]=s[w]}else{let w,_=M((S)=>(w=t(b,p),S));l[p]=w,c[p]=_}}for(let p=0;p<s.length;p++)if(!v[p])s[p]();return n=i.slice(),o=l,s=c,l}}function g(e){let t=H(()=>!!e.when());return()=>t()?e.children:e.fallback??null}function R(e){let t=$e(()=>e.each()??[],(n,o)=>e.children(n,o));return()=>{let n=t();return n.length>0?n:e.fallback??null}}var Vt=F(null);function q(e,t){let n=t!==void 0,o=n?e:()=>!0,s=n?t:e,i=h(void 0),a=h(void 0),l=h(!1),c=N(Vt),f=!1,v=!1,p=0,b=()=>{if(c!==null&&!f&&!v)c.increment(),f=!0},A=()=>{if(f)f=!1,c.decrement()},w=(x,K)=>{let z=++p;l.set(!0),b();let ne={value:i.peek(),refetching:K};Promise.resolve().then(()=>s(x,ne)).then((V)=>{if(z!==p)return;i.set(V),a.set(void 0),l.set(!1),v=!0,A()},(V)=>{if(z!==p)return;a.set(V),l.set(!1),A()})};if(n)E(()=>{let x=o();if(x===!1||x===null||x===void 0){p++,l.set(!1),A();return}U(()=>w(x,!1))});else w(!0,!1);P(()=>{p++,A()});let _=()=>i(),S=_;return S.loading=()=>l(),S.error=()=>a(),[_,{mutate:(x)=>{p++,l.set(!1),a.set(void 0),A(),v=!0,i.set(x)},refetch:()=>{let x=U(o);if(x===!1||x===null||x===void 0)return;w(x,!0)}}]}var jt=/^@(media|supports|container|document|layer)\b/i;function y(e,...t){let n=typeof e==="string"?e:e.reduce((i,a,l)=>i+a+(l<t.length?String(t[l]):""),""),o=Gt(n),s="k-"+o;return Wt(o,de(n,"."+s)),s}function qt(e){let t=[],n="",o=0,s="",i="",a="";for(let l=0;l<e.length;l++){let c=e[l];if(c==="{"){if(o===0){let f=s.lastIndexOf(";");n+=s.slice(0,f+1),a=s.slice(f+1),s="",i=""}else i+=c;o++}else if(c==="}")if(o--,o===0)t.push({prelude:a,inner:i});else if(o>0)i+=c;else o=0;else if(o===0)s+=c;else i+=c}return n+=s,{decls:n,blocks:t}}function de(e,t){let{decls:n,blocks:o}=qt(e),s="",i=n.trim();if(i)s+=`${t}{${i}}`;for(let{prelude:a,inner:l}of o){let c=a.trim();if(c[0]==="@")s+=jt.test(c)?`${c}{${de(l,t)}}`:`${c}{${l.trim()}}`;else s+=de(l,Bt(c,t))}return s}function Bt(e,t){return Kt(e,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,t):`${t} ${o}`}).join(",")}function Kt(e,t){let n=[],o=0,s="";for(let i=0;i<e.length;i++){let a=e[i];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===t&&o===0)n.push(s),s="";else s+=a}return n.push(s),n}var De=new Map;function Wt(e,t){let n=globalThis.document;if(!n){if(!De.has(e))De.set(e,t);return}Ut(n,e,t)}function Ut(e,t,n){let o=e.head;for(let i of o.childNodes)if(i.nodeType===1&&i.getAttribute("data-k")===t)return;let s=e.createElement("style");s.setAttribute("data-k",t),s.textContent=n,o.appendChild(s)}function Gt(e){let t=5381,n=2166136261;for(let o=0;o<e.length;o++){let s=e.charCodeAt(o);t=(t<<5)+t^s,n=Math.imul(n^s,16777619)}return(t>>>0).toString(36)+(n>>>0).toString(36)}function pe(e,t,n){if(typeof e==="function")return e(t??{});return ce(e,t??null)}function ze(e){let t=new URL(e,"http://kanabun.local"),n={};return t.searchParams.forEach((o,s)=>{n[s]=o}),{pathname:t.pathname,search:t.search,hash:t.hash,query:n}}function Fe(e){let t=[];for(let n of e.split("/"))if(n!=="")t.push(n);return t}function _e(e){try{return decodeURIComponent(e)}catch{return e}}function Je(e,t){let n=Fe(e),o=Fe(t),s={};for(let i=0;i<n.length;i++){let a=n[i];if(a[0]==="*"){let c=a.slice(1),f=o.slice(i);if(c!=="")s[c]=f.map(_e).join("/");return{params:s,rest:"/"+f.join("/")}}let l=o[i];if(l===void 0)return null;if(a[0]===":")s[a.slice(1)]=_e(l);else if(a!==l)return null}return o.length===n.length?{params:s,rest:null}:null}function Xe(e,t){let n=t.startsWith("/")?t:"/"+t,o=new URL(e,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function Ve(){let e=globalThis.window;if(!e)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return e}function fe(e=Ve()){return{location:()=>e.location.pathname+e.location.search+e.location.hash,push:(n)=>e.history.pushState(null,"",n),replace:(n)=>e.history.replaceState(null,"",n),subscribe(n){return e.addEventListener("popstate",n),()=>e.removeEventListener("popstate",n)}}}function he(e=Ve()){return{location:()=>{let n=e.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{e.location.hash=n},replace:(n)=>e.history.replaceState(null,"","#"+n),subscribe(n){return e.addEventListener("hashchange",n),()=>e.removeEventListener("hashchange",n)}}}var qe=F(null),me=F(null),je=F(null),Be=Object.freeze({});function Yt(e){let t=N(qe);if(t===null)throw Error(`kanabun/router: ${e} must be used inside a <Router>.`);return t}function ge(e){let t=e.source??fe(),n=h(t.location());P(t.subscribe(()=>n.set(t.location())));let o=H(()=>ze(n())),s=(i,a)=>{let l=Zt(i)?i:Xe(i,o().pathname);if(a?.replace)t.replace(l);else t.push(l);n.set(t.location())};return qe.Provider({value:{location:o,navigate:s},children:e.children})}function ve(){return N(me)??(()=>Be)}function Y(e){let{location:t}=Yt("<Route>"),n=N(me),s=N(je)??(()=>t().pathname),i=H(()=>Je(e.path,s())),a=H(()=>i()!==null),l=H(()=>{let b=i()?.params??Be;return n===null?b:{...n(),...b}}),c=()=>i()?.rest??"/",f=()=>me.Provider({value:l,children:()=>je.Provider({value:c,children:()=>{if(e.component!==void 0)return e.component({params:l});if(typeof e.children==="function")return e.children(l);return e.children}})}),v=Ke(),p=()=>{if(a())return v(f);return v(null),e.fallback??null};return p.$matched=a,p.$content=f,p}function Ke(){let e=null;return P(()=>e?.()),(t)=>{if(e!==null)e(),e=null;if(t===null)return null;let n;return e=M((o)=>(n=t(),o)),n}}function Qt(e){return typeof e==="function"&&"$matched"in e}function We(e,t){if(Array.isArray(e))for(let n of e)We(n,t);else if(Qt(e))t.push(e)}function be(e){let t=[];We(e.children,t);let n=Ke();return()=>{for(let o of t)if(o.$matched())return n(o.$content);return n(null),e.fallback??null}}function Zt(e){return/^[a-z][a-z0-9+.-]*:/i.test(e)||e.startsWith("//")}var Q=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function Ue(e){return/^https?:\/\//i.test(e)?e:`${Q}/${e.replace(/^\/+/,"")}`}async function Z(e,t){let n=await fetch(Q+e,{method:t===void 0?"GET":"POST",headers:t===void 0?void 0:{"Content-Type":"application/json"},body:t===void 0?void 0:JSON.stringify(t)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var Ge=()=>Z("/api/cases"),Ye=(e)=>Z("/api/new",{case:e}),Qe=(e,t)=>Z("/api/act",{state:e,input:t}),Ze=(e,t)=>Z("/api/accuse",{state:e,answer:t});var tt=y`
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
`;function r(e,t,n,o,s,i){return pe(e,t,n)}function ut(){let[e]=q(()=>Ge());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.loading(),children:r("p",{class:ee,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:T,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:B,children:()=>String(e.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:ct,children:r(R,{each:()=>e()?.cases??[],children:(t)=>r("a",{href:`#${t.id}`,children:[r("p",{class:"title",children:t.title},void 0,!1,void 0,this),r(g,{when:()=>t.byline!==void 0,children:r("p",{class:"byline",children:t.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${t.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function dt(e){let t=e.person,n=h(0);return r("div",{class:ot,children:[r("span",{children:t.avatar||"？"},void 0,!1,void 0,this),()=>{if(!t.image||n()>=2)return null;let o=Ue(t.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:t.name,loading:"lazy",onError:()=>n.update((s)=>s+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function pt(e){return r("div",{class:T,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:rt,children:[r("p",{class:"name",children:()=>e.view().scene.name},void 0,!1,void 0,this),()=>e.view().scene.description.map((t)=>r("p",{class:"desc",children:t},void 0,!1,void 0,this)),r("div",{class:"people",children:r(R,{each:()=>e.view().people??[],fallback:r("p",{class:B,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(t)=>r("div",{class:"person",children:[r(dt,{person:t},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:t.name},void 0,!1,void 0,this),r("div",{class:"role",children:t.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function ft(e){return r("div",{class:T,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:st,children:r(R,{each:()=>e.view().evidence??[],fallback:r("p",{class:B,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(t)=>r("div",{class:"item",children:[r("div",{class:"name",children:t.name},void 0,!1,void 0,this),r("div",{class:"desc",children:t.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function ht(e){let t=e.entry;if(t.kind==="narration")return r("div",{class:"entry",children:t.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(t.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:t.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(t.kind==="ending")return r(en,{verdict:t.verdict,share:t.share},void 0,!1,void 0,this);return r("div",{class:t.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+t.input},void 0,!1,void 0,this),t.speaker?r("div",{class:"speaker",children:[r(dt,{person:t.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:t.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,t.did?r("p",{class:"did",children:t.did},void 0,!1,void 0,this):null,t.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),t.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),t.moved?r("div",{class:"moved",children:"— "+t.moved+" —"},void 0,!1,void 0,this):null,t.arrival.length>0?r("div",{class:"arrival",children:t.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,t.interlude.length>0?r("div",{class:"interlude",children:t.interlude.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function en(e){let t=e.verdict,n=t.correct?`犯人を言い当てた（${t.named_name}）`:t.named_name?`${t.named_name}を指した`:"犯人を名指ししなかった",o=(f,v)=>[r("span",{class:f?"mark":"mark no",children:f?"○":"×"},void 0,!1,void 0,this),r("span",{children:v},void 0,!1,void 0,this)],s=t.points.filter((f)=>f.hit),i=t.points.length-s.length,a=`${Math.round(100*t.coherence/(t.coherence_top||1))}%`,l=t.celebrate===!0,c=mt(t)?"完 全 解 決":"事 件 解 決";return r("div",{class:l?"entry said won":"entry said",children:[l?r("p",{class:"solved",children:c},void 0,!1,void 0,this):null,r("h3",{children:t.title},void 0,!1,void 0,this),t.text.map((f)=>r("p",{children:f},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(t.correct,n),s.map((f)=>o(!0,f.label)),i>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${i} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${t.coherence.toFixed(1)} / ${t.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.coherence_legend!==void 0,children:t.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this),e.share?r(rn,{text:tn(t,e.share),title:e.share.title},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function mt(e){if(e.celebrate!==!0)return!1;return e.complete===!0||e.correct&&e.points.every((t)=>t.hit)}function tn(e,t){let n=e.points.filter((i)=>i.hit).length,o=mt(e)?"完全解決":e.celebrate===!0?"事件解決":"未解決",s=e.points.map((i)=>i.hit?"○":"×").join("");return[`『${t.title}』${o}`,`犯人 ${e.correct?"○":"×"}／真相 ${s} ${n}/${e.points.length}`,`筋の通り ${e.coherence.toFixed(1)}/${e.coherence_top}・${t.turns}手`,"#jevmystery"].join(`
`)}function nn(){let e=new URL(location.href);return e.searchParams.delete("api"),e.toString()}function rn(e){let t=nn(),n=h(!1),o=typeof navigator.share==="function",s=()=>{navigator.share({title:e.title,text:e.text,url:t}).catch(()=>{})},i=async()=>{let a=`${e.text}
${t}`;try{await navigator.clipboard.writeText(a)}catch{let l=document.createElement("textarea");l.value=a,l.style.position="fixed",l.style.opacity="0",document.body.appendChild(l),l.select(),document.execCommand("copy"),l.remove()}n.set(!0),setTimeout(()=>n.set(!1),2000)};return r("div",{class:"share",children:[r("pre",{children:e.text},void 0,!1,void 0,this),r("div",{class:"buttons",children:[o?r("button",{type:"button",class:"secondary",onClick:s,children:"共有する"},void 0,!1,void 0,this):null,r("button",{type:"button",class:"secondary",onClick:()=>void i(),children:()=>n()?"コピーしました":"結果をコピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var we=(e)=>`jev-mystery:${e}`;function on(e){try{let t=localStorage.getItem(we(e));return t===null?null:JSON.parse(t)}catch{return null}}function sn(e,t){try{localStorage.setItem(we(e),JSON.stringify(t))}catch{}}function an(e){try{localStorage.removeItem(we(e))}catch{}}function gt(){let e=ve(),[t,{refetch:n}]=q(()=>e().case??!1,(u)=>Ye(u)),o=h(""),s=h(null),i=h([]),a=h("playing"),l=h(""),c=h(!1),f=h(""),v=h(""),p=h([]),b=h(0),A=null,w=null,_=()=>e().case??"",S="";E(()=>{let u=t();if(u===void 0)return;document.title=u.title,l.set(""),f.set(""),S=_();let d=on(S);if(d!==null){o.set(d.token),s.set(d.view),i.set(d.entries),a.set(d.phase),v.set(d.beforeAnswer),p.set(d.hints),b.set(d.shown),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}));return}o.set(u.state),s.set(u.view);let C=u.arrival??[];i.set([{kind:"narration",lines:u.opening},{kind:"narration",lines:u.incident},...C.length>0?[{kind:"narration",lines:C}]:[]]),a.set("playing"),v.set(""),p.set([]),b.set(0)}),E(()=>{let u=s();if(u===null||S==="")return;sn(S,{token:o(),view:u,entries:i(),phase:a(),beforeAnswer:v(),hints:p(),shown:b()})});let Ae=()=>{s.set(null),an(S),n()},x=(u)=>{i.update((d)=>[...d,u]),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}))},K=(u)=>f.set(u instanceof Error?u.message:String(u)),z=async(u)=>{if(c.peek()||u==="")return;c.set(!0),f.set("");try{let d=await Qe(o.peek(),u);if(o.set(d.state),s.set(d.view),x({kind:"turn",input:u,matched:d.matched,did:d.did,speaker:d.speaker,lines:d.text,gained:d.gained??[],moved:d.moved_to===void 0?void 0:d.view.scene.name,arrival:d.arrival??[],interlude:d.interlude??[]}),d.finale===!0)a.set("accusing")}catch(d){K(d)}finally{c.set(!1),w?.focus()}},ne=async(u)=>{if(c.peek()||u==="")return;c.set(!0),f.set(""),x({kind:"answer",text:u});try{let d=o.peek(),C=await Ze(d,u);if(v.set(d),o.set(C.state),C.hints!==void 0&&C.hints.length>0)p.set(C.hints);x({kind:"ending",verdict:C,share:{title:t()?.title??"",turns:s()?.turn??0}}),a.set("closed")}catch(d){K(d)}finally{c.set(!1)}},V=()=>{if(c.peek()||v.peek()==="")return;o.set(v.peek()),f.set(""),x({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),a.set("accusing")},L=()=>s(),bt=()=>r("div",{children:[r(g,{when:()=>L().finale_open&&a()==="playing",children:r("div",{class:lt,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:c,onClick:()=>z(L().finale_label??"全員を集める"),children:()=>L().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:nt,children:[r("div",{children:[r(pt,{view:L},void 0,!1,void 0,this),r(ft,{view:L},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${T} ${it}`,ref:(u)=>A=u,children:[r(R,{each:i,children:(u)=>r(ht,{entry:u},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:c,children:r("p",{class:ee,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",fallback:()=>r(yt,{},void 0,!1,void 0,this),children:()=>r(xt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>p().length>0,children:()=>r(wt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),xt=()=>r("div",{class:`${T} ${xe}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(At,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(u)=>{u.preventDefault();let d=l.peek().trim();l.set(""),z(d)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:l,disabled:c,ref:(u)=>{w=u,w.focus()},onInput:(u)=>l.set(u.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:c,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>L().finale_open,children:r("div",{class:ye,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>z(L().finale_label??"全員を集める"),children:()=>L().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>f()!=="",children:r("p",{class:"error",children:f},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),yt=()=>r("div",{class:`${T} ${xe}`,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:V,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),wt=()=>r("div",{class:`${T} ${at}`,children:[r(R,{each:()=>p().slice(0,b()),children:(u,d)=>r("p",{children:`ヒント${d+1}　${u}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>b()<p().length,children:r("button",{type:"button",class:"secondary",onClick:()=>b.update((u)=>u+1),children:()=>b()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),At=()=>{let u=h("");return r("div",{children:[r("form",{class:"stacked",onSubmit:(d)=>{d.preventDefault(),ne(u.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:u,disabled:c,ref:(d)=>d.focus(),onInput:(d)=>u.set(d.target.value)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:c,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),r("div",{class:ye,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>a.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>t()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>t()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>t()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:c,onClick:Ae,children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:T,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>s()!==null,children:bt},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function ln(){return r("main",{class:tt,children:[r(be,{children:[r(Y,{path:"/",component:ut},void 0,!1,void 0,this),r(Y,{path:"/:case",component:gt},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:Q},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function cn(){return r(ge,{source:he(),children:()=>r(ln,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var vt=document.getElementById("app");if(vt)ue(()=>r(cn,{},void 0,!1,void 0,this),vt);

//# debugId=A76AA3804774A65C64756E2164756E21
//# sourceMappingURL=chunk-yyrpsve5.js.map
