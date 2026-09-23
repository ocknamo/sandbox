var bt=!1,we=new Set,xt=(t)=>console.warn(t),yt=xt,wt="kanabun [dev]: ";function At(){return bt||globalThis.__KANABUN_DEV__===!0}function I(t){if(!At())return;if(we.has(t))return;we.add(t),yt(wt+t)}var _=0,Ae=1,z=2,O=3,A=null,h=null,oe=0,re=!1,K=[],kt=1e6,V=(t,e)=>t===e,Tt=()=>!1;function Se(t){if(!t||t.equals===void 0)return V;if(t.equals===!1)return Tt;return t.equals}class D{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,o){if(this.equals=n,this.isEffect=e,o){if(this.fn=t,this.value=void 0,this.color=z,h!==null)(h.owned??=[]).push(this),this.owner=h}else this.fn=null,this.value=t,this.color=_}read(){if(this.color===O)return this.value;if(A!==null)(A.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(A!==null&&!A.isEffect)I("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(z)}markStale(t){if(this.color>=t)return;let e=this.color===_;if(this.color=t,e&&this.isEffect)Ee(this);if(this.observers!==null)for(let n of this.observers)n.markStale(Ae)}updateIfNecessary(){if(this.color===_||this.color===O)return;if(this.color===Ae&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===z)break}if(this.color===z)this.update();this.color=_}update(){this.cleanNode();let t=A,e=h;A=this,h=this,this.collecting=[];let n,o,i=!1;try{n=this.fn()}catch(a){i=!0,o=a}finally{A=t,h=e}if(i){this.collecting=null,this.color=_,Et(o,this.owner);return}this.reconcileSources();let s=!this.equals(this.value,n);if(this.value=n,this.color=_,s&&this.observers!==null){for(let a of this.observers)if(a.color!==O&&a.color<z)a.color=z}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))ke(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))St(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===O)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)ke(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=O}}function St(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function ke(t,e){let n=t.observers;if(n===null)return;let o=n.indexOf(e);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function Ee(t){K.push(t)}function ie(){if(re)return;re=!0;let t=0,e=0;try{while(t<K.length){if(++e>kt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=K[t++];if(n.color!==O)n.updateIfNecessary()}}finally{K.length=0,re=!1}}function Re(t,e){let n=h,o=A;h=t,A=null;try{return e()}finally{h=n,A=o}}function se(t,e){let n=h;h=t;try{return e()}finally{h=n}}function Le(){let t=new D(void 0,!1,V,!1);if(t.owner=h,h!==null)(h.owned??=[]).push(t);return t}function m(t,e){let n=new D(t,!1,Se(e),!1),o=()=>n.read(),i=o;return i.set=(s)=>{if(n.write(s),oe===0)ie()},i.update=(s)=>{if(n.write(s(n.value)),oe===0)ie()},i.peek=()=>n.value,o}function H(t,e){let n=new D(t,!1,Se(e),!0);return()=>n.read()}function R(t){if(h===null)I("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new D(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,V,!0);if(Ee(e),oe===0)ie();return()=>e.dispose()}function W(t){let e=A;A=null;try{return t()}finally{A=e}}var Te=Symbol("error-handler");function Et(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&Te in n.context){n.context[Te](t);return}throw t}function M(t){if(h===null){I("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(h.cleanups??=[]).push(t)}function P(t){let e=new D(void 0,!1,V,!1);return e.owner=h,Re(e,()=>t(()=>e.dispose()))}function Rt(t,e){let n=Le();return n.context={[t]:e},n}function F(t){let e=Symbol("context");return{id:e,defaultValue:t,Provider(n){let o=Rt(e,n.value),i=n.children,s=se(o,()=>typeof i==="function"?i():i);return typeof s==="function"?()=>se(o,s):s}}}function C(t){for(let e=h;e!==null;e=e.owner)if(e.context!==null&&t.id in e.context)return e.context[t.id];return t.defaultValue}function le(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function Lt(t){return t!=null&&typeof t.nodeType==="number"}function Ht(t){return t.nodeType===3}var Mt=new Set(["script","style"]);function ce(t,e){let n=le().createElement(t);if(e!==null){for(let o in e){if(o==="children"||o==="ref")continue;Nt(n,o,e[o])}if(e.ref!==void 0)Ct(e.ref,n);if("children"in e)Pt(t,e.children),U(n,e.children)}return n}function Pt(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!Mt.has(t.toLowerCase()))return;I(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function Ct(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function Nt(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){It(t,n);return}if(typeof n==="function")R(()=>Me(t,e,n()));else Me(t,e,n)}function It(t,e){for(let n in e){let o=e[n];if(typeof o==="function")R(()=>He(t,n,o()));else He(t,n,o)}}function He(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function Me(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function U(t,e,n=null){if(Array.isArray(e)){for(let o of e)U(t,o,n);return}if(typeof e==="function"){let o=t.insertBefore(le().createComment(""),n);Pe(t,e,o,{current:null});return}Ce(t,e,null,n)}function Pe(t,e,n,o){R(()=>{let i=e();if(typeof i==="function")Pe(t,i,n,o);else o.current=Ce(t,i,o.current,n)})}function Ce(t,e,n,o){if(n!==null&&n.length===1&&Ht(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let i=Ot(e);return Ne(t,n??[],i,o),i.length>0?i:null}function Ne(t,e,n,o){if(e.length>0){let s=new Set(n);for(let a of e)if(!s.has(a)&&a.parentNode===t)t.removeChild(a)}let i=o;for(let s=n.length-1;s>=0;s--){let a=n[s];if(a.parentNode!==t||a.nextSibling!==i)t.insertBefore(a,i);i=a}}function Ot(t){let e=[];return ae(e,t),e}function ae(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)ae(t,n);return}if(Lt(e)){t.push(e);return}if(typeof e==="function"){ae(t,e());return}t.push(le().createTextNode(String(e)))}function ue(t,e){let n;return P((o)=>{n=o,U(e,t())}),()=>{n(),e.textContent=""}}function Ie(t,e){let n=[],o=[],i=[];return M(()=>{for(let s of i)s()}),()=>{let s=t(),a=s.length,c=Array(a),l=Array(a),p=new Map;for(let d=0;d<n.length;d++){let b=p.get(n[d]);if(b)b.push(d);else p.set(n[d],[d])}let v=Array(n.length).fill(!1);for(let d=0;d<a;d++){let b=s[d],k=p.get(b);if(k!==void 0&&k.length>0){let w=k.shift();v[w]=!0,c[d]=o[w],l[d]=i[w]}else{let w,E=P((N)=>(w=e(b,d),N));c[d]=w,l[d]=E}}for(let d=0;d<i.length;d++)if(!v[d])i[d]();return n=s.slice(),o=c,i=l,c}}function g(t){let e=H(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function L(t){let e=Ie(()=>t.each()??[],(n,o)=>t.children(n,o));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var _t=F(null);function j(t,e){let n=e!==void 0,o=n?t:()=>!0,i=n?e:t,s=m(void 0),a=m(void 0),c=m(!1),l=C(_t),p=!1,v=!1,d=0,b=()=>{if(l!==null&&!p&&!v)l.increment(),p=!0},k=()=>{if(p)p=!1,l.decrement()},w=(y,te)=>{let T=++d;c.set(!0),b();let ne={value:s.peek(),refetching:te};Promise.resolve().then(()=>i(y,ne)).then((J)=>{if(T!==d)return;s.set(J),a.set(void 0),c.set(!1),v=!0,k()},(J)=>{if(T!==d)return;a.set(J),c.set(!1),k()})};if(n)R(()=>{let y=o();if(y===!1||y===null||y===void 0){d++,c.set(!1),k();return}W(()=>w(y,!1))});else w(!0,!1);M(()=>{d++,k()});let E=()=>s(),N=E;return N.loading=()=>c(),N.error=()=>a(),[E,{mutate:(y)=>{d++,c.set(!1),a.set(void 0),k(),v=!0,s.set(y)},refetch:()=>{let y=W(o);if(y===!1||y===null||y===void 0)return;w(y,!0)}}]}var zt=/^@(media|supports|container|document|layer)\b/i;function x(t,...e){let n=typeof t==="string"?t:t.reduce((s,a,c)=>s+a+(c<e.length?String(e[c]):""),""),o=qt(n),i="k-"+o;return Vt(o,de(n,"."+i)),i}function Jt(t){let e=[],n="",o=0,i="",s="",a="";for(let c=0;c<t.length;c++){let l=t[c];if(l==="{"){if(o===0){let p=i.lastIndexOf(";");n+=i.slice(0,p+1),a=i.slice(p+1),i="",s=""}else s+=l;o++}else if(l==="}")if(o--,o===0)e.push({prelude:a,inner:s});else if(o>0)s+=l;else o=0;else if(o===0)i+=l;else s+=l}return n+=i,{decls:n,blocks:e}}function de(t,e){let{decls:n,blocks:o}=Jt(t),i="",s=n.trim();if(s)i+=`${e}{${s}}`;for(let{prelude:a,inner:c}of o){let l=a.trim();if(l[0]==="@")i+=zt.test(l)?`${l}{${de(c,e)}}`:`${l}{${c.trim()}}`;else i+=de(c,$t(l,e))}return i}function $t(t,e){return Xt(t,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,e):`${e} ${o}`}).join(",")}function Xt(t,e){let n=[],o=0,i="";for(let s=0;s<t.length;s++){let a=t[s];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===e&&o===0)n.push(i),i="";else i+=a}return n.push(i),n}var Oe=new Map;function Vt(t,e){let n=globalThis.document;if(!n){if(!Oe.has(t))Oe.set(t,e);return}jt(n,t,e)}function jt(t,e,n){let o=t.head;for(let s of o.childNodes)if(s.nodeType===1&&s.getAttribute("data-k")===e)return;let i=t.createElement("style");i.setAttribute("data-k",e),i.textContent=n,o.appendChild(i)}function qt(t){let e=5381,n=2166136261;for(let o=0;o<t.length;o++){let i=t.charCodeAt(o);e=(e<<5)+e^i,n=Math.imul(n^i,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}function pe(t,e,n){if(typeof t==="function")return t(e??{});return ce(t,e??null)}function _e(t){let e=new URL(t,"http://kanabun.local"),n={};return e.searchParams.forEach((o,i)=>{n[i]=o}),{pathname:e.pathname,search:e.search,hash:e.hash,query:n}}function De(t){let e=[];for(let n of t.split("/"))if(n!=="")e.push(n);return e}function Fe(t){try{return decodeURIComponent(t)}catch{return t}}function ze(t,e){let n=De(t),o=De(e),i={};for(let s=0;s<n.length;s++){let a=n[s];if(a[0]==="*"){let l=a.slice(1),p=o.slice(s);if(l!=="")i[l]=p.map(Fe).join("/");return{params:i,rest:"/"+p.join("/")}}let c=o[s];if(c===void 0)return null;if(a[0]===":")i[a.slice(1)]=Fe(c);else if(a!==c)return null}return o.length===n.length?{params:i,rest:null}:null}function Je(t,e){let n=e.startsWith("/")?e:"/"+e,o=new URL(t,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function $e(){let t=globalThis.window;if(!t)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return t}function fe(t=$e()){return{location:()=>t.location.pathname+t.location.search+t.location.hash,push:(n)=>t.history.pushState(null,"",n),replace:(n)=>t.history.replaceState(null,"",n),subscribe(n){return t.addEventListener("popstate",n),()=>t.removeEventListener("popstate",n)}}}function he(t=$e()){return{location:()=>{let n=t.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{t.location.hash=n},replace:(n)=>t.history.replaceState(null,"","#"+n),subscribe(n){return t.addEventListener("hashchange",n),()=>t.removeEventListener("hashchange",n)}}}var Ve=F(null),me=F(null),Xe=F(null),je=Object.freeze({});function Bt(t){let e=C(Ve);if(e===null)throw Error(`kanabun/router: ${t} must be used inside a <Router>.`);return e}function ge(t){let e=t.source??fe(),n=m(e.location());M(e.subscribe(()=>n.set(e.location())));let o=H(()=>_e(n())),i=(s,a)=>{let c=Wt(s)?s:Je(s,o().pathname);if(a?.replace)e.replace(c);else e.push(c);n.set(e.location())};return Ve.Provider({value:{location:o,navigate:i},children:t.children})}function ve(){return C(me)??(()=>je)}function G(t){let{location:e}=Bt("<Route>"),n=C(me),i=C(Xe)??(()=>e().pathname),s=H(()=>ze(t.path,i())),a=H(()=>s()!==null),c=H(()=>{let b=s()?.params??je;return n===null?b:{...n(),...b}}),l=()=>s()?.rest??"/",p=()=>me.Provider({value:c,children:()=>Xe.Provider({value:l,children:()=>{if(t.component!==void 0)return t.component({params:c});if(typeof t.children==="function")return t.children(c);return t.children}})}),v=qe(),d=()=>{if(a())return v(p);return v(null),t.fallback??null};return d.$matched=a,d.$content=p,d}function qe(){let t=null;return M(()=>t?.()),(e)=>{if(t!==null)t(),t=null;if(e===null)return null;let n;return t=P((o)=>(n=e(),o)),n}}function Kt(t){return typeof t==="function"&&"$matched"in t}function Be(t,e){if(Array.isArray(t))for(let n of t)Be(n,e);else if(Kt(t))e.push(t)}function be(t){let e=[];Be(t.children,e);let n=qe();return()=>{for(let o of e)if(o.$matched())return n(o.$content);return n(null),t.fallback??null}}function Wt(t){return/^[a-z][a-z0-9+.-]*:/i.test(t)||t.startsWith("//")}var Y=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function Ke(t){return/^https?:\/\//i.test(t)?t:`${Y}/${t.replace(/^\/+/,"")}`}async function Q(t,e){let n=await fetch(Y+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var We=()=>Q("/api/cases"),Ue=(t)=>Q("/api/new",{case:t}),Ge=(t,e)=>Q("/api/act",{state:t,input:e}),Ye=(t,e)=>Q("/api/accuse",{state:t,answer:e});var Ze=x`
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
`,et=x`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,S=x`
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
`,tt=x`
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
`,nt=x`
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
`,rt=x`
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
`,q=x`
  color: var(--muted);
  font-size: 13px;
`,ot=x`
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
`,xe=x`
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
`,ye=x`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`,it=x`
  margin-top: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,st=x`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,at=x`
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
`,Z=x`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function r(t,e,n,o,i,s){return pe(t,e,n)}function lt(){let[t]=j(()=>We());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.loading(),children:r("p",{class:Z,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:S,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:q,children:()=>String(t.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:at,children:r(L,{each:()=>t()?.cases??[],children:(e)=>r("a",{href:`#${e.id}`,children:[r("p",{class:"title",children:e.title},void 0,!1,void 0,this),r(g,{when:()=>e.byline!==void 0,children:r("p",{class:"byline",children:e.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function ct(t){let e=t.person,n=m(0);return r("div",{class:nt,children:[r("span",{children:e.avatar||"？"},void 0,!1,void 0,this),()=>{if(!e.image||n()>=2)return null;let o=Ke(e.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:e.name,loading:"lazy",onError:()=>n.update((i)=>i+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function ut(t){return r("div",{class:S,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:tt,children:[r("p",{class:"name",children:()=>t.view().scene.name},void 0,!1,void 0,this),()=>t.view().scene.description.map((e)=>r("p",{class:"desc",children:e},void 0,!1,void 0,this)),r("div",{class:"people",children:r(L,{each:()=>t.view().people??[],fallback:r("p",{class:q,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"person",children:[r(ct,{person:e},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:e.name},void 0,!1,void 0,this),r("div",{class:"role",children:e.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function dt(t){return r("div",{class:S,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:rt,children:r(L,{each:()=>t.view().evidence??[],fallback:r("p",{class:q,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"item",children:[r("div",{class:"name",children:e.name},void 0,!1,void 0,this),r("div",{class:"desc",children:e.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function pt(t){let e=t.entry;if(e.kind==="narration")return r("div",{class:"entry",children:e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(e.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:e.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(e.kind==="ending")return r(Ut,{verdict:e.verdict},void 0,!1,void 0,this);return r("div",{class:e.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+e.input},void 0,!1,void 0,this),e.speaker?r("div",{class:"speaker",children:[r(ct,{person:e.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:e.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,e.did?r("p",{class:"did",children:e.did},void 0,!1,void 0,this):null,e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),e.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),e.moved?r("div",{class:"moved",children:"— "+e.moved+" —"},void 0,!1,void 0,this):null,e.arrival.length>0?r("div",{class:"arrival",children:e.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function Ut(t){let e=t.verdict,n=e.correct?`犯人を言い当てた（${e.named_name}）`:e.named_name?`${e.named_name}を指した`:"犯人を名指ししなかった",o=(p,v)=>[r("span",{class:p?"mark":"mark no",children:p?"○":"×"},void 0,!1,void 0,this),r("span",{children:v},void 0,!1,void 0,this)],i=e.points.filter((p)=>p.hit),s=e.points.length-i.length,a=`${Math.round(100*e.coherence/(e.coherence_top||1))}%`,c=e.celebrate===!0,l=c&&e.correct&&s===0?"完 全 解 決":"事 件 解 決";return r("div",{class:c?"entry said won":"entry said",children:[c?r("p",{class:"solved",children:l},void 0,!1,void 0,this):null,r("h3",{children:e.title},void 0,!1,void 0,this),e.text.map((p)=>r("p",{children:p},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(e.correct,n),i.map((p)=>o(!0,p.label)),s>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${s} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${e.coherence.toFixed(1)} / ${e.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.coherence_legend!==void 0,children:e.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function ft(){let t=ve(),[e,{refetch:n}]=j(()=>t().case??!1,(u)=>Ue(u)),o=m(""),i=m(null),s=m([]),a=m("playing"),c=m(""),l=m(!1),p=m(""),v=m(""),d=m([]),b=m(0),k=null,w=null;R(()=>{let u=e();if(u===void 0)return;o.set(u.state),i.set(u.view);let f=u.arrival??[];s.set([{kind:"narration",lines:u.opening},{kind:"narration",lines:u.incident},...f.length>0?[{kind:"narration",lines:f}]:[]]),a.set("playing"),c.set(""),p.set(""),v.set(""),d.set([]),b.set(0),document.title=u.title});let E=(u)=>{s.update((f)=>[...f,u]),requestAnimationFrame(()=>k?.lastElementChild?.scrollIntoView({block:"end"}))},N=(u)=>p.set(u instanceof Error?u.message:String(u)),B=async(u)=>{if(l.peek()||u==="")return;l.set(!0),p.set("");try{let f=await Ge(o.peek(),u);if(o.set(f.state),i.set(f.view),E({kind:"turn",input:u,matched:f.matched,did:f.did,speaker:f.speaker,lines:f.text,gained:f.gained??[],moved:f.moved_to===void 0?void 0:f.view.scene.name,arrival:f.arrival??[]}),f.finale===!0)a.set("accusing")}catch(f){N(f)}finally{l.set(!1),w?.focus()}},y=async(u)=>{if(l.peek()||u==="")return;l.set(!0),p.set(""),E({kind:"answer",text:u});try{let f=o.peek(),X=await Ye(f,u);if(v.set(f),o.set(X.state),X.hints!==void 0&&X.hints.length>0)d.set(X.hints);E({kind:"ending",verdict:X}),a.set("closed")}catch(f){N(f)}finally{l.set(!1)}},te=()=>{if(l.peek()||v.peek()==="")return;o.set(v.peek()),p.set(""),E({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),a.set("accusing")},T=()=>i(),ne=()=>r("div",{children:[r(g,{when:()=>T().finale_open&&a()==="playing",children:r("div",{class:st,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:l,onClick:()=>B(T().finale_label??"全員を集める"),children:()=>T().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:et,children:[r("div",{children:[r(ut,{view:T},void 0,!1,void 0,this),r(dt,{view:T},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${S} ${ot}`,ref:(u)=>k=u,children:[r(L,{each:s,children:(u)=>r(pt,{entry:u},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:l,children:r("p",{class:Z,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",fallback:()=>r(mt,{},void 0,!1,void 0,this),children:()=>r(J,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>d().length>0,children:()=>r(gt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),J=()=>r("div",{class:`${S} ${xe}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(vt,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(u)=>{u.preventDefault();let f=c.peek().trim();c.set(""),B(f)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:c,disabled:l,ref:(u)=>{w=u,w.focus()},onInput:(u)=>c.set(u.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:l,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>T().finale_open,children:r("div",{class:ye,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>B(T().finale_label??"全員を集める"),children:()=>T().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>p()!=="",children:r("p",{class:"error",children:p},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),mt=()=>r("div",{class:`${S} ${xe}`,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:te,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),gt=()=>r("div",{class:`${S} ${it}`,children:[r(L,{each:()=>d().slice(0,b()),children:(u,f)=>r("p",{children:`ヒント${f+1}　${u}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>b()<d().length,children:r("button",{type:"button",class:"secondary",onClick:()=>b.update((u)=>u+1),children:()=>b()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),vt=()=>{let u=m("");return r("div",{children:[r("form",{class:"stacked",onSubmit:(f)=>{f.preventDefault(),y(u.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:u,disabled:l,ref:(f)=>f.focus(),onInput:(f)=>u.set(f.target.value)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:l,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),r("div",{class:ye,children:[r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>a.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>e()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>e()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:l,onClick:()=>n(),children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:S,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>i()!==null,children:ne},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Gt(){return r("main",{class:Ze,children:[r(be,{children:[r(G,{path:"/",component:lt},void 0,!1,void 0,this),r(G,{path:"/:case",component:ft},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:Y},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Yt(){return r(ge,{source:he(),children:()=>r(Gt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var ht=document.getElementById("app");if(ht)ue(()=>r(Yt,{},void 0,!1,void 0,this),ht);

//# debugId=B9A595C08415AC7764756E2164756E21
//# sourceMappingURL=chunk-gscff472.js.map
