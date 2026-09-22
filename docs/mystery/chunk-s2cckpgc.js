var dt=!1,ge=new Set,pt=(t)=>console.warn(t),ft=pt,ht="kanabun [dev]: ";function mt(){return dt||globalThis.__KANABUN_DEV__===!0}function C(t){if(!mt())return;if(ge.has(t))return;ge.add(t),ft(ht+t)}var _=0,ve=1,F=2,N=3,k=null,h=null,ee=0,Z=!1,V=[],gt=1e6,z=(t,e)=>t===e,vt=()=>!1;function ye(t){if(!t||t.equals===void 0)return z;if(t.equals===!1)return vt;return t.equals}class I{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,o){if(this.equals=n,this.isEffect=e,o){if(this.fn=t,this.value=void 0,this.color=F,h!==null)(h.owned??=[]).push(this),this.owner=h}else this.fn=null,this.value=t,this.color=_}read(){if(this.color===N)return this.value;if(k!==null)(k.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(k!==null&&!k.isEffect)C("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(F)}markStale(t){if(this.color>=t)return;let e=this.color===_;if(this.color=t,e&&this.isEffect)we(this);if(this.observers!==null)for(let n of this.observers)n.markStale(ve)}updateIfNecessary(){if(this.color===_||this.color===N)return;if(this.color===ve&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===F)break}if(this.color===F)this.update();this.color=_}update(){this.cleanNode();let t=k,e=h;k=this,h=this,this.collecting=[];let n,o,i=!1;try{n=this.fn()}catch(a){i=!0,o=a}finally{k=t,h=e}if(i){this.collecting=null,this.color=_,bt(o,this.owner);return}this.reconcileSources();let s=!this.equals(this.value,n);if(this.value=n,this.color=_,s&&this.observers!==null){for(let a of this.observers)if(a.color!==N&&a.color<F)a.color=F}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))xe(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))xt(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===N)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)xe(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=N}}function xt(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function xe(t,e){let n=t.observers;if(n===null)return;let o=n.indexOf(e);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function we(t){V.push(t)}function te(){if(Z)return;Z=!0;let t=0,e=0;try{while(t<V.length){if(++e>gt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=V[t++];if(n.color!==N)n.updateIfNecessary()}}finally{V.length=0,Z=!1}}function Ae(t,e){let n=h,o=k;h=t,k=null;try{return e()}finally{h=n,k=o}}function ne(t,e){let n=h;h=t;try{return e()}finally{h=n}}function ke(){let t=new I(void 0,!1,z,!1);if(t.owner=h,h!==null)(h.owned??=[]).push(t);return t}function m(t,e){let n=new I(t,!1,ye(e),!1),o=()=>n.read(),i=o;return i.set=(s)=>{if(n.write(s),ee===0)te()},i.update=(s)=>{if(n.write(s(n.value)),ee===0)te()},i.peek=()=>n.value,o}function R(t,e){let n=new I(t,!1,ye(e),!0);return()=>n.read()}function S(t){if(h===null)C("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new I(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,z,!0);if(we(e),ee===0)te();return()=>e.dispose()}function j(t){let e=k;k=null;try{return t()}finally{k=e}}var be=Symbol("error-handler");function bt(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&be in n.context){n.context[be](t);return}throw t}function L(t){if(h===null){C("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(h.cleanups??=[]).push(t)}function H(t){let e=new I(void 0,!1,z,!1);return e.owner=h,Ae(e,()=>t(()=>e.dispose()))}function yt(t,e){let n=ke();return n.context={[t]:e},n}function O(t){let e=Symbol("context");return{id:e,defaultValue:t,Provider(n){let o=yt(e,n.value),i=n.children,s=ne(o,()=>typeof i==="function"?i():i);return typeof s==="function"?()=>ne(o,s):s}}}function M(t){for(let e=h;e!==null;e=e.owner)if(e.context!==null&&t.id in e.context)return e.context[t.id];return t.defaultValue}function oe(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function wt(t){return t!=null&&typeof t.nodeType==="number"}function At(t){return t.nodeType===3}var kt=new Set(["script","style"]);function ie(t,e){let n=oe().createElement(t);if(e!==null){for(let o in e){if(o==="children"||o==="ref")continue;Et(n,o,e[o])}if(e.ref!==void 0)St(e.ref,n);if("children"in e)Tt(t,e.children),q(n,e.children)}return n}function Tt(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!kt.has(t.toLowerCase()))return;C(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function St(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function Et(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){Rt(t,n);return}if(typeof n==="function")S(()=>Se(t,e,n()));else Se(t,e,n)}function Rt(t,e){for(let n in e){let o=e[n];if(typeof o==="function")S(()=>Te(t,n,o()));else Te(t,n,o)}}function Te(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function Se(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function q(t,e,n=null){if(Array.isArray(e)){for(let o of e)q(t,o,n);return}if(typeof e==="function"){let o=t.insertBefore(oe().createComment(""),n);Ee(t,e,o,{current:null});return}Re(t,e,null,n)}function Ee(t,e,n,o){S(()=>{let i=e();if(typeof i==="function")Ee(t,i,n,o);else o.current=Re(t,i,o.current,n)})}function Re(t,e,n,o){if(n!==null&&n.length===1&&At(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let i=Lt(e);return Le(t,n??[],i,o),i.length>0?i:null}function Le(t,e,n,o){if(e.length>0){let s=new Set(n);for(let a of e)if(!s.has(a)&&a.parentNode===t)t.removeChild(a)}let i=o;for(let s=n.length-1;s>=0;s--){let a=n[s];if(a.parentNode!==t||a.nextSibling!==i)t.insertBefore(a,i);i=a}}function Lt(t){let e=[];return re(e,t),e}function re(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)re(t,n);return}if(wt(e)){t.push(e);return}if(typeof e==="function"){re(t,e());return}t.push(oe().createTextNode(String(e)))}function se(t,e){let n;return H((o)=>{n=o,q(e,t())}),()=>{n(),e.textContent=""}}function He(t,e){let n=[],o=[],i=[];return L(()=>{for(let s of i)s()}),()=>{let s=t(),a=s.length,l=Array(a),c=Array(a),p=new Map;for(let d=0;d<n.length;d++){let y=p.get(n[d]);if(y)y.push(d);else p.set(n[d],[d])}let b=Array(n.length).fill(!1);for(let d=0;d<a;d++){let y=s[d],T=p.get(y);if(T!==void 0&&T.length>0){let w=T.shift();b[w]=!0,l[d]=o[w],c[d]=i[w]}else{let w,D=H((A)=>(w=e(y,d),A));l[d]=w,c[d]=D}}for(let d=0;d<i.length;d++)if(!b[d])i[d]();return n=s.slice(),o=l,i=c,l}}function g(t){let e=R(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function P(t){let e=He(()=>t.each()??[],(n,o)=>t.children(n,o));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var Pt=O(null);function J(t,e){let n=e!==void 0,o=n?t:()=>!0,i=n?e:t,s=m(void 0),a=m(void 0),l=m(!1),c=M(Pt),p=!1,b=!1,d=0,y=()=>{if(c!==null&&!p&&!b)c.increment(),p=!0},T=()=>{if(p)p=!1,c.decrement()},w=(v,Y)=>{let u=++d;l.set(!0),y();let f={value:s.peek(),refetching:Y};Promise.resolve().then(()=>i(v,f)).then((Q)=>{if(u!==d)return;s.set(Q),a.set(void 0),l.set(!1),b=!0,T()},(Q)=>{if(u!==d)return;a.set(Q),l.set(!1),T()})};if(n)S(()=>{let v=o();if(v===!1||v===null||v===void 0){d++,l.set(!1),T();return}j(()=>w(v,!1))});else w(!0,!1);L(()=>{d++,T()});let D=()=>s(),A=D;return A.loading=()=>l(),A.error=()=>a(),[D,{mutate:(v)=>{d++,l.set(!1),a.set(void 0),T(),b=!0,s.set(v)},refetch:()=>{let v=j(o);if(v===!1||v===null||v===void 0)return;w(v,!0)}}]}var Ct=/^@(media|supports|container|document|layer)\b/i;function x(t,...e){let n=typeof t==="string"?t:t.reduce((s,a,l)=>s+a+(l<e.length?String(e[l]):""),""),o=Ft(n),i="k-"+o;return Dt(o,ae(n,"."+i)),i}function Nt(t){let e=[],n="",o=0,i="",s="",a="";for(let l=0;l<t.length;l++){let c=t[l];if(c==="{"){if(o===0){let p=i.lastIndexOf(";");n+=i.slice(0,p+1),a=i.slice(p+1),i="",s=""}else s+=c;o++}else if(c==="}")if(o--,o===0)e.push({prelude:a,inner:s});else if(o>0)s+=c;else o=0;else if(o===0)i+=c;else s+=c}return n+=i,{decls:n,blocks:e}}function ae(t,e){let{decls:n,blocks:o}=Nt(t),i="",s=n.trim();if(s)i+=`${e}{${s}}`;for(let{prelude:a,inner:l}of o){let c=a.trim();if(c[0]==="@")i+=Ct.test(c)?`${c}{${ae(l,e)}}`:`${c}{${l.trim()}}`;else i+=ae(l,It(c,e))}return i}function It(t,e){return Ot(t,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,e):`${e} ${o}`}).join(",")}function Ot(t,e){let n=[],o=0,i="";for(let s=0;s<t.length;s++){let a=t[s];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===e&&o===0)n.push(i),i="";else i+=a}return n.push(i),n}var Me=new Map;function Dt(t,e){let n=globalThis.document;if(!n){if(!Me.has(t))Me.set(t,e);return}_t(n,t,e)}function _t(t,e,n){let o=t.head;for(let s of o.childNodes)if(s.nodeType===1&&s.getAttribute("data-k")===e)return;let i=t.createElement("style");i.setAttribute("data-k",e),i.textContent=n,o.appendChild(i)}function Ft(t){let e=5381,n=2166136261;for(let o=0;o<t.length;o++){let i=t.charCodeAt(o);e=(e<<5)+e^i,n=Math.imul(n^i,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}function le(t,e,n){if(typeof t==="function")return t(e??{});return ie(t,e??null)}function Ne(t){let e=new URL(t,"http://kanabun.local"),n={};return e.searchParams.forEach((o,i)=>{n[i]=o}),{pathname:e.pathname,search:e.search,hash:e.hash,query:n}}function Pe(t){let e=[];for(let n of t.split("/"))if(n!=="")e.push(n);return e}function Ce(t){try{return decodeURIComponent(t)}catch{return t}}function Ie(t,e){let n=Pe(t),o=Pe(e),i={};for(let s=0;s<n.length;s++){let a=n[s];if(a[0]==="*"){let c=a.slice(1),p=o.slice(s);if(c!=="")i[c]=p.map(Ce).join("/");return{params:i,rest:"/"+p.join("/")}}let l=o[s];if(l===void 0)return null;if(a[0]===":")i[a.slice(1)]=Ce(l);else if(a!==l)return null}return o.length===n.length?{params:i,rest:null}:null}function Oe(t,e){let n=e.startsWith("/")?e:"/"+e,o=new URL(t,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function De(){let t=globalThis.window;if(!t)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return t}function ce(t=De()){return{location:()=>t.location.pathname+t.location.search+t.location.hash,push:(n)=>t.history.pushState(null,"",n),replace:(n)=>t.history.replaceState(null,"",n),subscribe(n){return t.addEventListener("popstate",n),()=>t.removeEventListener("popstate",n)}}}function ue(t=De()){return{location:()=>{let n=t.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{t.location.hash=n},replace:(n)=>t.history.replaceState(null,"","#"+n),subscribe(n){return t.addEventListener("hashchange",n),()=>t.removeEventListener("hashchange",n)}}}var Fe=O(null),de=O(null),_e=O(null),ze=Object.freeze({});function zt(t){let e=M(Fe);if(e===null)throw Error(`kanabun/router: ${t} must be used inside a <Router>.`);return e}function pe(t){let e=t.source??ce(),n=m(e.location());L(e.subscribe(()=>n.set(e.location())));let o=R(()=>Ne(n())),i=(s,a)=>{let l=Xt(s)?s:Oe(s,o().pathname);if(a?.replace)e.replace(l);else e.push(l);n.set(e.location())};return Fe.Provider({value:{location:o,navigate:i},children:t.children})}function fe(){return M(de)??(()=>ze)}function B(t){let{location:e}=zt("<Route>"),n=M(de),i=M(_e)??(()=>e().pathname),s=R(()=>Ie(t.path,i())),a=R(()=>s()!==null),l=R(()=>{let y=s()?.params??ze;return n===null?y:{...n(),...y}}),c=()=>s()?.rest??"/",p=()=>de.Provider({value:l,children:()=>_e.Provider({value:c,children:()=>{if(t.component!==void 0)return t.component({params:l});if(typeof t.children==="function")return t.children(l);return t.children}})}),b=Je(),d=()=>{if(a())return b(p);return b(null),t.fallback??null};return d.$matched=a,d.$content=p,d}function Je(){let t=null;return L(()=>t?.()),(e)=>{if(t!==null)t(),t=null;if(e===null)return null;let n;return t=H((o)=>(n=e(),o)),n}}function Jt(t){return typeof t==="function"&&"$matched"in t}function Xe(t,e){if(Array.isArray(t))for(let n of t)Xe(n,e);else if(Jt(t))e.push(t)}function he(t){let e=[];Xe(t.children,e);let n=Je();return()=>{for(let o of e)if(o.$matched())return n(o.$content);return n(null),t.fallback??null}}function Xt(t){return/^[a-z][a-z0-9+.-]*:/i.test(t)||t.startsWith("//")}var K=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function $e(t){return/^https?:\/\//i.test(t)?t:`${K}/${t.replace(/^\/+/,"")}`}async function W(t,e){let n=await fetch(K+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var Ve=()=>W("/api/cases"),je=(t)=>W("/api/new",{case:t}),qe=(t,e)=>W("/api/act",{state:t,input:e}),Be=(t,e)=>W("/api/accuse",{state:t,answer:e});var We=x`
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
`,Ue=x`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,E=x`
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
`,Ge=x`
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
`,Ye=x`
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
`,Qe=x`
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
`,X=x`
  color: var(--muted);
  font-size: 13px;
`,Ze=x`
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
`,et=x`
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
`,tt=x`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`,nt=x`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,rt=x`
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
`,U=x`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function r(t,e,n,o,i,s){return le(t,e,n)}function ot(){let[t]=J(()=>Ve());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.loading(),children:r("p",{class:U,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:E,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:X,children:()=>String(t.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:rt,children:r(P,{each:()=>t()?.cases??[],children:(e)=>r("a",{href:`#${e.id}`,children:[r("p",{class:"title",children:e.title},void 0,!1,void 0,this),r(g,{when:()=>e.byline!==void 0,children:r("p",{class:"byline",children:e.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function it(t){let e=t.person,n=m(0);return r("div",{class:Ye,children:[r("span",{children:e.avatar||"？"},void 0,!1,void 0,this),()=>{if(!e.image||n()>=2)return null;let o=$e(e.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:e.name,loading:"lazy",onError:()=>n.update((i)=>i+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function st(t){return r("div",{class:E,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:Ge,children:[r("p",{class:"name",children:()=>t.view().scene.name},void 0,!1,void 0,this),()=>t.view().scene.description.map((e)=>r("p",{class:"desc",children:e},void 0,!1,void 0,this)),r("div",{class:"people",children:r(P,{each:()=>t.view().people??[],fallback:r("p",{class:X,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"person",children:[r(it,{person:e},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:e.name},void 0,!1,void 0,this),r("div",{class:"role",children:e.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function at(t){return r("div",{class:E,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:Qe,children:r(P,{each:()=>t.view().evidence??[],fallback:r("p",{class:X,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"item",children:[r("div",{class:"name",children:e.name},void 0,!1,void 0,this),r("div",{class:"desc",children:e.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function lt(t){let e=t.entry;if(e.kind==="narration")return r("div",{class:"entry",children:e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(e.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:e.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(e.kind==="ending")return r($t,{verdict:e.verdict},void 0,!1,void 0,this);return r("div",{class:e.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+e.input},void 0,!1,void 0,this),e.speaker?r("div",{class:"speaker",children:[r(it,{person:e.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:e.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,e.did?r("p",{class:"did",children:e.did},void 0,!1,void 0,this):null,e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),e.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),e.moved?r("div",{class:"moved",children:"— "+e.moved+" —"},void 0,!1,void 0,this):null,e.arrival.length>0?r("div",{class:"arrival",children:e.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function $t(t){let e=t.verdict,n=e.correct?`犯人を言い当てた（${e.named_name}）`:e.named_name?`${e.named_name}を指した`:"犯人を名指ししなかった",o=(p,b)=>[r("span",{class:p?"mark":"mark no",children:p?"○":"×"},void 0,!1,void 0,this),r("span",{children:b},void 0,!1,void 0,this)],i=e.points.filter((p)=>p.hit),s=e.points.length-i.length,a=`${Math.round(100*e.coherence/(e.coherence_top||1))}%`,l=e.celebrate===!0,c=l&&e.correct&&s===0?"完 全 解 決":"事 件 解 決";return r("div",{class:l?"entry said won":"entry said",children:[l?r("p",{class:"solved",children:c},void 0,!1,void 0,this):null,r("h3",{children:e.title},void 0,!1,void 0,this),e.text.map((p)=>r("p",{children:p},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(e.correct,n),i.map((p)=>o(!0,p.label)),s>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${s} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${e.coherence.toFixed(1)} / ${e.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.coherence_legend!==void 0,children:e.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function ct(){let t=fe(),[e,{refetch:n}]=J(()=>t().case??!1,(u)=>je(u)),o=m(""),i=m(null),s=m([]),a=m("playing"),l=m(""),c=m(!1),p=m(""),b=null,d=null;S(()=>{let u=e();if(u===void 0)return;o.set(u.state),i.set(u.view);let f=u.arrival??[];s.set([{kind:"narration",lines:u.opening},{kind:"narration",lines:u.incident},...f.length>0?[{kind:"narration",lines:f}]:[]]),a.set("playing"),l.set(""),p.set(""),document.title=u.title});let y=(u)=>{s.update((f)=>[...f,u]),requestAnimationFrame(()=>b?.lastElementChild?.scrollIntoView({block:"end"}))},T=(u)=>p.set(u instanceof Error?u.message:String(u)),w=async(u)=>{if(c.peek()||u==="")return;c.set(!0),p.set("");try{let f=await qe(o.peek(),u);if(o.set(f.state),i.set(f.view),y({kind:"turn",input:u,matched:f.matched,did:f.did,speaker:f.speaker,lines:f.text,gained:f.gained??[],moved:f.moved_to===void 0?void 0:f.view.scene.name,arrival:f.arrival??[]}),f.finale===!0)a.set("accusing")}catch(f){T(f)}finally{c.set(!1),d?.focus()}},D=async(u)=>{if(c.peek()||u==="")return;c.set(!0),p.set(""),y({kind:"answer",text:u});try{let f=await Be(o.peek(),u);o.set(f.state),y({kind:"ending",verdict:f}),a.set("closed")}catch(f){T(f)}finally{c.set(!1)}},A=()=>i(),me=()=>r("div",{children:[r(g,{when:()=>A().finale_open&&a()==="playing",children:r("div",{class:nt,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:c,onClick:()=>w(A().finale_label??"全員を集める"),children:()=>A().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:Ue,children:[r("div",{children:[r(st,{view:A},void 0,!1,void 0,this),r(at,{view:A},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${E} ${Ze}`,ref:(u)=>b=u,children:[r(P,{each:s,children:(u)=>r(lt,{entry:u},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:c,children:r("p",{class:U,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",children:()=>r(v,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),v=()=>r("div",{class:`${E} ${et}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(Y,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(u)=>{u.preventDefault();let f=l.peek().trim();l.set(""),w(f)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:l,disabled:c,ref:(u)=>{d=u,d.focus()},onInput:(u)=>l.set(u.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:c,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>A().finale_open,children:r("div",{class:tt,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>w(A().finale_label??"全員を集める"),children:()=>A().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>p()!=="",children:r("p",{class:"error",children:p},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Y=()=>{let u=m("");return r("div",{children:[r("form",{class:"stacked",onSubmit:(f)=>{f.preventDefault(),D(u.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:u,disabled:c,ref:(f)=>f.focus(),onInput:(f)=>u.set(f.target.value)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:c,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>e()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>e()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>n(),children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:E,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>i()!==null,children:me},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Vt(){return r("main",{class:We,children:[r(he,{children:[r(B,{path:"/",component:ot},void 0,!1,void 0,this),r(B,{path:"/:case",component:ct},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:K},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function jt(){return r(pe,{source:ue(),children:()=>r(Vt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var ut=document.getElementById("app");if(ut)se(()=>r(jt,{},void 0,!1,void 0,this),ut);

//# debugId=6905411B09F58AA264756E2164756E21
//# sourceMappingURL=chunk-s2cckpgc.js.map
