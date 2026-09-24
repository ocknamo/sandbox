var Tt=!1,ke=new Set,St=(e)=>console.warn(e),Et=St,Rt="kanabun [dev]: ";function Lt(){return Tt||globalThis.__KANABUN_DEV__===!0}function I(e){if(!Lt())return;if(ke.has(e))return;ke.add(e),Et(Rt+e)}var X=0,Te=1,V=2,O=3,k=null,m=null,ie=0,oe=!1,G=[],Ct=1e6,K=(e,t)=>e===t,Ht=()=>!1;function Re(e){if(!e||e.equals===void 0)return K;if(e.equals===!1)return Ht;return e.equals}class D{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(e,t,n,o){if(this.equals=n,this.isEffect=t,o){if(this.fn=e,this.value=void 0,this.color=V,m!==null)(m.owned??=[]).push(this),this.owner=m}else this.fn=null,this.value=e,this.color=X}read(){if(this.color===O)return this.value;if(k!==null)(k.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(e){if(k!==null&&!k.isEffect)I("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,e))return;if(this.value=e,this.observers!==null)for(let t of this.observers)t.markStale(V)}markStale(e){if(this.color>=e)return;let t=this.color===X;if(this.color=e,t&&this.isEffect)Le(this);if(this.observers!==null)for(let n of this.observers)n.markStale(Te)}updateIfNecessary(){if(this.color===X||this.color===O)return;if(this.color===Te&&this.sources!==null){for(let e of this.sources)if(e.updateIfNecessary(),this.color===V)break}if(this.color===V)this.update();this.color=X}update(){this.cleanNode();let e=k,t=m;k=this,m=this,this.collecting=[];let n,o,i=!1;try{n=this.fn()}catch(a){i=!0,o=a}finally{k=e,m=t}if(i){this.collecting=null,this.color=X,Pt(o,this.owner);return}this.reconcileSources();let s=!this.equals(this.value,n);if(this.value=n,this.color=X,s&&this.observers!==null){for(let a of this.observers)if(a.color!==O&&a.color<V)a.color=V}}reconcileSources(){let e=this.collecting;this.collecting=null;let t=[];for(let n of e)if(!t.includes(n))t.push(n);if(this.sources!==null){for(let n of this.sources)if(!t.includes(n))Se(n,this)}for(let n of t)if(this.sources===null||!this.sources.includes(n))Mt(n,this);this.sources=t.length>0?t:null}disposeOwned(){if(this.owned===null)return;let e=this.owned;this.owned=null;for(let t=e.length-1;t>=0;t--)e[t].dispose()}runCleanups(){if(this.cleanups===null)return;let e=this.cleanups;this.cleanups=null;for(let t=e.length-1;t>=0;t--)e[t]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===O)return;if(this.cleanNode(),this.sources!==null){for(let e of this.sources)Se(e,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=O}}function Mt(e,t){if(e.observers===null)e.observers=[t];else e.observers.push(t)}function Se(e,t){let n=e.observers;if(n===null)return;let o=n.indexOf(t);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)e.observers=null}function Le(e){G.push(e)}function se(){if(oe)return;oe=!0;let e=0,t=0;try{while(e<G.length){if(++t>Ct)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=G[e++];if(n.color!==O)n.updateIfNecessary()}}finally{G.length=0,oe=!1}}function Ce(e,t){let n=m,o=k;m=e,k=null;try{return t()}finally{m=n,k=o}}function ae(e,t){let n=m;m=e;try{return t()}finally{m=n}}function He(){let e=new D(void 0,!1,K,!1);if(e.owner=m,m!==null)(m.owned??=[]).push(e);return e}function h(e,t){let n=new D(e,!1,Re(t),!1),o=()=>n.read(),i=o;return i.set=(s)=>{if(n.write(s),ie===0)se()},i.update=(s)=>{if(n.write(s(n.value)),ie===0)se()},i.peek=()=>n.value,o}function H(e,t){let n=new D(e,!1,Re(t),!0);return()=>n.read()}function S(e){if(m===null)I("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let t=new D(()=>{let n=e();if(typeof n==="function")(t.cleanups??=[]).push(n)},!0,K,!0);if(Le(t),ie===0)se();return()=>t.dispose()}function Y(e){let t=k;k=null;try{return e()}finally{k=t}}var Ee=Symbol("error-handler");function Pt(e,t){for(let n=t;n!==null;n=n.owner)if(n.context!==null&&Ee in n.context){n.context[Ee](e);return}throw e}function M(e){if(m===null){I("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(m.cleanups??=[]).push(e)}function P(e){let t=new D(void 0,!1,K,!1);return t.owner=m,Ce(t,()=>e(()=>t.dispose()))}function Nt(e,t){let n=He();return n.context={[e]:t},n}function F(e){let t=Symbol("context");return{id:t,defaultValue:e,Provider(n){let o=Nt(t,n.value),i=n.children,s=ae(o,()=>typeof i==="function"?i():i);return typeof s==="function"?()=>ae(o,s):s}}}function N(e){for(let t=m;t!==null;t=t.owner)if(t.context!==null&&e.id in t.context)return t.context[e.id];return e.defaultValue}function ce(){let e=globalThis.document;if(!e)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return e}function It(e){return e!=null&&typeof e.nodeType==="number"}function Ot(e){return e.nodeType===3}var $t=new Set(["script","style"]);function ue(e,t){let n=ce().createElement(e);if(t!==null){for(let o in t){if(o==="children"||o==="ref")continue;_t(n,o,t[o])}if(t.ref!==void 0)Ft(t.ref,n);if("children"in t)Dt(e,t.children),Q(n,t.children)}return n}function Dt(e,t){if(t==null||t==="")return;if(Array.isArray(t)&&t.length===0)return;if(!$t.has(e.toLowerCase()))return;I(`a child of <${e.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function Ft(e,t){if(typeof e==="function")e(t);else if(e!==null&&typeof e==="object")e.current=t}function _t(e,t,n){if(t.length>2&&t[0]==="o"&&t[1]==="n"){e.addEventListener(t.slice(2).toLowerCase(),n);return}if(t==="style"&&n!==null&&typeof n==="object"){zt(e,n);return}if(typeof n==="function")S(()=>Pe(e,t,n()));else Pe(e,t,n)}function zt(e,t){for(let n in t){let o=t[n];if(typeof o==="function")S(()=>Me(e,n,o()));else Me(e,n,o)}}function Me(e,t,n){e.style.setProperty(t,n==null?"":String(n))}function Pe(e,t,n){if(t==="value"||t==="checked"||t==="selected"){e[t]=n;return}if(t==="className")t="class";if(n==null||n===!1)e.removeAttribute(t);else if(n===!0)e.setAttribute(t,"");else e.setAttribute(t,String(n))}function Q(e,t,n=null){if(Array.isArray(t)){for(let o of t)Q(e,o,n);return}if(typeof t==="function"){let o=e.insertBefore(ce().createComment(""),n);Ne(e,t,o,{current:null});return}Ie(e,t,null,n)}function Ne(e,t,n,o){S(()=>{let i=t();if(typeof i==="function")Ne(e,i,n,o);else o.current=Ie(e,i,o.current,n)})}function Ie(e,t,n,o){if(n!==null&&n.length===1&&Ot(n[0])&&(typeof t==="string"||typeof t==="number"))return n[0].data=String(t),n;let i=Jt(t);return Oe(e,n??[],i,o),i.length>0?i:null}function Oe(e,t,n,o){if(t.length>0){let s=new Set(n);for(let a of t)if(!s.has(a)&&a.parentNode===e)e.removeChild(a)}let i=o;for(let s=n.length-1;s>=0;s--){let a=n[s];if(a.parentNode!==e||a.nextSibling!==i)e.insertBefore(a,i);i=a}}function Jt(e){let t=[];return le(t,e),t}function le(e,t){if(t==null||t===!1||t===!0||t==="")return;if(Array.isArray(t)){for(let n of t)le(e,n);return}if(It(t)){e.push(t);return}if(typeof t==="function"){le(e,t());return}e.push(ce().createTextNode(String(t)))}function de(e,t){let n;return P((o)=>{n=o,Q(t,e())}),()=>{n(),t.textContent=""}}function $e(e,t){let n=[],o=[],i=[];return M(()=>{for(let s of i)s()}),()=>{let s=e(),a=s.length,l=Array(a),c=Array(a),f=new Map;for(let p=0;p<n.length;p++){let b=f.get(n[p]);if(b)b.push(p);else f.set(n[p],[p])}let v=Array(n.length).fill(!1);for(let p=0;p<a;p++){let b=s[p],A=f.get(b);if(A!==void 0&&A.length>0){let y=A.shift();v[y]=!0,l[p]=o[y],c[p]=i[y]}else{let y,R=P((_)=>(y=t(b,p),_));l[p]=y,c[p]=R}}for(let p=0;p<i.length;p++)if(!v[p])i[p]();return n=s.slice(),o=l,i=c,l}}function g(e){let t=H(()=>!!e.when());return()=>t()?e.children:e.fallback??null}function E(e){let t=$e(()=>e.each()??[],(n,o)=>e.children(n,o));return()=>{let n=t();return n.length>0?n:e.fallback??null}}var jt=F(null);function W(e,t){let n=t!==void 0,o=n?e:()=>!0,i=n?t:e,s=h(void 0),a=h(void 0),l=h(!1),c=N(jt),f=!1,v=!1,p=0,b=()=>{if(c!==null&&!f&&!v)c.increment(),f=!0},A=()=>{if(f)f=!1,c.decrement()},y=(w,J)=>{let j=++p;l.set(!0),b();let q={value:s.peek(),refetching:J};Promise.resolve().then(()=>i(w,q)).then((B)=>{if(j!==p)return;s.set(B),a.set(void 0),l.set(!1),v=!0,A()},(B)=>{if(j!==p)return;a.set(B),l.set(!1),A()})};if(n)S(()=>{let w=o();if(w===!1||w===null||w===void 0){p++,l.set(!1),A();return}Y(()=>y(w,!1))});else y(!0,!1);M(()=>{p++,A()});let R=()=>s(),_=R;return _.loading=()=>l(),_.error=()=>a(),[R,{mutate:(w)=>{p++,l.set(!1),a.set(void 0),A(),v=!0,s.set(w)},refetch:()=>{let w=Y(o);if(w===!1||w===null||w===void 0)return;y(w,!0)}}]}var qt=/^@(media|supports|container|document|layer)\b/i;function x(e,...t){let n=typeof e==="string"?e:e.reduce((s,a,l)=>s+a+(l<t.length?String(t[l]):""),""),o=Yt(n),i="k-"+o;return Ut(o,pe(n,"."+i)),i}function Bt(e){let t=[],n="",o=0,i="",s="",a="";for(let l=0;l<e.length;l++){let c=e[l];if(c==="{"){if(o===0){let f=i.lastIndexOf(";");n+=i.slice(0,f+1),a=i.slice(f+1),i="",s=""}else s+=c;o++}else if(c==="}")if(o--,o===0)t.push({prelude:a,inner:s});else if(o>0)s+=c;else o=0;else if(o===0)i+=c;else s+=c}return n+=i,{decls:n,blocks:t}}function pe(e,t){let{decls:n,blocks:o}=Bt(e),i="",s=n.trim();if(s)i+=`${t}{${s}}`;for(let{prelude:a,inner:l}of o){let c=a.trim();if(c[0]==="@")i+=qt.test(c)?`${c}{${pe(l,t)}}`:`${c}{${l.trim()}}`;else i+=pe(l,Kt(c,t))}return i}function Kt(e,t){return Wt(e,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,t):`${t} ${o}`}).join(",")}function Wt(e,t){let n=[],o=0,i="";for(let s=0;s<e.length;s++){let a=e[s];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===t&&o===0)n.push(i),i="";else i+=a}return n.push(i),n}var De=new Map;function Ut(e,t){let n=globalThis.document;if(!n){if(!De.has(e))De.set(e,t);return}Gt(n,e,t)}function Gt(e,t,n){let o=e.head;for(let s of o.childNodes)if(s.nodeType===1&&s.getAttribute("data-k")===t)return;let i=e.createElement("style");i.setAttribute("data-k",t),i.textContent=n,o.appendChild(i)}function Yt(e){let t=5381,n=2166136261;for(let o=0;o<e.length;o++){let i=e.charCodeAt(o);t=(t<<5)+t^i,n=Math.imul(n^i,16777619)}return(t>>>0).toString(36)+(n>>>0).toString(36)}function fe(e,t,n){if(typeof e==="function")return e(t??{});return ue(e,t??null)}function ze(e){let t=new URL(e,"http://kanabun.local"),n={};return t.searchParams.forEach((o,i)=>{n[i]=o}),{pathname:t.pathname,search:t.search,hash:t.hash,query:n}}function Fe(e){let t=[];for(let n of e.split("/"))if(n!=="")t.push(n);return t}function _e(e){try{return decodeURIComponent(e)}catch{return e}}function Je(e,t){let n=Fe(e),o=Fe(t),i={};for(let s=0;s<n.length;s++){let a=n[s];if(a[0]==="*"){let c=a.slice(1),f=o.slice(s);if(c!=="")i[c]=f.map(_e).join("/");return{params:i,rest:"/"+f.join("/")}}let l=o[s];if(l===void 0)return null;if(a[0]===":")i[a.slice(1)]=_e(l);else if(a!==l)return null}return o.length===n.length?{params:i,rest:null}:null}function Xe(e,t){let n=t.startsWith("/")?t:"/"+t,o=new URL(e,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function Ve(){let e=globalThis.window;if(!e)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return e}function he(e=Ve()){return{location:()=>e.location.pathname+e.location.search+e.location.hash,push:(n)=>e.history.pushState(null,"",n),replace:(n)=>e.history.replaceState(null,"",n),subscribe(n){return e.addEventListener("popstate",n),()=>e.removeEventListener("popstate",n)}}}function me(e=Ve()){return{location:()=>{let n=e.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{e.location.hash=n},replace:(n)=>e.history.replaceState(null,"","#"+n),subscribe(n){return e.addEventListener("hashchange",n),()=>e.removeEventListener("hashchange",n)}}}var qe=F(null),ge=F(null),je=F(null),Be=Object.freeze({});function Qt(e){let t=N(qe);if(t===null)throw Error(`kanabun/router: ${e} must be used inside a <Router>.`);return t}function ve(e){let t=e.source??he(),n=h(t.location());M(t.subscribe(()=>n.set(t.location())));let o=H(()=>ze(n())),i=(s,a)=>{let l=en(s)?s:Xe(s,o().pathname);if(a?.replace)t.replace(l);else t.push(l);n.set(t.location())};return qe.Provider({value:{location:o,navigate:i},children:e.children})}function be(){return N(ge)??(()=>Be)}function Z(e){let{location:t}=Qt("<Route>"),n=N(ge),i=N(je)??(()=>t().pathname),s=H(()=>Je(e.path,i())),a=H(()=>s()!==null),l=H(()=>{let b=s()?.params??Be;return n===null?b:{...n(),...b}}),c=()=>s()?.rest??"/",f=()=>ge.Provider({value:l,children:()=>je.Provider({value:c,children:()=>{if(e.component!==void 0)return e.component({params:l});if(typeof e.children==="function")return e.children(l);return e.children}})}),v=Ke(),p=()=>{if(a())return v(f);return v(null),e.fallback??null};return p.$matched=a,p.$content=f,p}function Ke(){let e=null;return M(()=>e?.()),(t)=>{if(e!==null)e(),e=null;if(t===null)return null;let n;return e=P((o)=>(n=t(),o)),n}}function Zt(e){return typeof e==="function"&&"$matched"in e}function We(e,t){if(Array.isArray(e))for(let n of e)We(n,t);else if(Zt(e))t.push(e)}function xe(e){let t=[];We(e.children,t);let n=Ke();return()=>{for(let o of t)if(o.$matched())return n(o.$content);return n(null),e.fallback??null}}function en(e){return/^[a-z][a-z0-9+.-]*:/i.test(e)||e.startsWith("//")}var ee=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function Ue(e){return/^https?:\/\//i.test(e)?e:`${ee}/${e.replace(/^\/+/,"")}`}async function te(e,t){let n=await fetch(ee+e,{method:t===void 0?"GET":"POST",headers:t===void 0?void 0:{"Content-Type":"application/json"},body:t===void 0?void 0:JSON.stringify(t)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var Ge=()=>te("/api/cases"),Ye=(e)=>te("/api/new",{case:e}),Qe=(e,t)=>te("/api/act",{state:e,input:t}),Ze=(e,t)=>te("/api/accuse",{state:e,answer:t});var tt=x`
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
`,nt=x`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,T=x`
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
`,rt=x`
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
`,ot=x`
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
`,it=x`
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
`,U=x`
  color: var(--muted);
  font-size: 13px;
`,st=x`
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
`,ye=x`
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
`,we=x`
  border-top: 1px solid var(--line);
  margin-top: 12px;
  padding-top: 12px;

  .hint {
    margin: 6px 0 0;
  }
`,at=x`
  margin-top: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,lt=x`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,ct=x`
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
`,ne=x`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function r(e,t,n,o,i,s){return fe(e,t,n)}function ut(){let[e]=W(()=>Ge());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.loading(),children:r("p",{class:ne,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:T,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:U,children:()=>String(e.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:ct,children:r(E,{each:()=>e()?.cases??[],children:(t)=>r("a",{href:`#${t.id}`,children:[r("p",{class:"title",children:t.title},void 0,!1,void 0,this),r(g,{when:()=>t.byline!==void 0,children:r("p",{class:"byline",children:t.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${t.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function dt(e){let t=e.person,n=h(0);return r("div",{class:ot,children:[r("span",{children:t.avatar||"？"},void 0,!1,void 0,this),()=>{if(!t.image||n()>=2)return null;let o=Ue(t.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:t.name,loading:"lazy",onError:()=>n.update((i)=>i+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function pt(e){return r("div",{class:T,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:rt,children:[r("p",{class:"name",children:()=>e.view().scene.name},void 0,!1,void 0,this),()=>e.view().scene.description.map((t)=>r("p",{class:"desc",children:t},void 0,!1,void 0,this)),r("div",{class:"people",children:r(E,{each:()=>e.view().people??[],fallback:r("p",{class:U,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(t)=>r("div",{class:"person",children:[r(dt,{person:t},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:t.name},void 0,!1,void 0,this),r("div",{class:"role",children:t.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function ft(e){return r("div",{class:T,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:it,children:r(E,{each:()=>e.view().evidence??[],fallback:r("p",{class:U,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(t)=>r("div",{class:"item",children:[r("div",{class:"name",children:t.name},void 0,!1,void 0,this),r("div",{class:"desc",children:t.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function ht(e){let t=e.entry;if(t.kind==="narration")return r("div",{class:"entry",children:t.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(t.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:t.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(t.kind==="ending")return r(tn,{verdict:t.verdict,share:t.share},void 0,!1,void 0,this);return r("div",{class:t.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+t.input},void 0,!1,void 0,this),t.speaker?r("div",{class:"speaker",children:[r(dt,{person:t.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:t.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,t.did?r("p",{class:"did",children:t.did},void 0,!1,void 0,this):null,t.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),t.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),t.moved?r("div",{class:"moved",children:"— "+t.moved+" —"},void 0,!1,void 0,this):null,t.arrival.length>0?r("div",{class:"arrival",children:t.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,t.interlude.length>0?r("div",{class:"interlude",children:t.interlude.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function tn(e){let t=e.verdict,n=t.correct?`犯人を言い当てた（${t.named_name}）`:t.named_name?`${t.named_name}を指した`:"犯人を名指ししなかった",o=(f,v)=>[r("span",{class:f?"mark":"mark no",children:f?"○":"×"},void 0,!1,void 0,this),r("span",{children:v},void 0,!1,void 0,this)],i=t.points.filter((f)=>f.hit),s=t.points.length-i.length,a=`${Math.round(100*t.coherence/(t.coherence_top||1))}%`,l=t.celebrate===!0,c=mt(t)?"完 全 解 決":"事 件 解 決";return r("div",{class:l?"entry said won":"entry said",children:[l?r("p",{class:"solved",children:c},void 0,!1,void 0,this):null,r("h3",{children:t.title},void 0,!1,void 0,this),t.text.map((f)=>r("p",{children:f},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(t.correct,n),i.map((f)=>o(!0,f.label)),s>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${s} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${t.coherence.toFixed(1)} / ${t.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.coherence_legend!==void 0,children:t.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this),e.share?r(on,{text:nn(t,e.share),title:e.share.title},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function mt(e){if(e.celebrate!==!0)return!1;return e.complete===!0||e.correct&&e.points.every((t)=>t.hit)}function nn(e,t){let n=e.points.filter((s)=>s.hit).length,o=mt(e)?"完全解決":e.celebrate===!0?"事件解決":"未解決",i=e.points.map((s)=>s.hit?"○":"×").join("");return[`『${t.title}』${o}`,`犯人 ${e.correct?"○":"×"}／真相 ${i} ${n}/${e.points.length}`,`筋の通り ${e.coherence.toFixed(1)}/${e.coherence_top}・${t.turns}手`,"#jevmystery"].join(`
`)}function rn(){let e=new URL(location.href);return e.searchParams.delete("api"),e.toString()}function on(e){let t=rn(),n=h(!1),o=typeof navigator.share==="function",i=()=>{navigator.share({title:e.title,text:e.text,url:t}).catch(()=>{})},s=async()=>{let a=`${e.text}
${t}`;try{await navigator.clipboard.writeText(a)}catch{let l=document.createElement("textarea");l.value=a,l.style.position="fixed",l.style.opacity="0",document.body.appendChild(l),l.select(),document.execCommand("copy"),l.remove()}n.set(!0),setTimeout(()=>n.set(!1),2000)};return r("div",{class:"share",children:[r("pre",{children:e.text},void 0,!1,void 0,this),r("div",{class:"buttons",children:[o?r("button",{type:"button",class:"secondary",onClick:i,children:"共有する"},void 0,!1,void 0,this):null,r("button",{type:"button",class:"secondary",onClick:()=>void s(),children:()=>n()?"コピーしました":"結果をコピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var Ae=(e)=>`jev-mystery:${e}`;function sn(e){try{let t=localStorage.getItem(Ae(e));return t===null?null:JSON.parse(t)}catch{return null}}function an(e,t){try{localStorage.setItem(Ae(e),JSON.stringify(t))}catch{}}function ln(e){try{localStorage.removeItem(Ae(e))}catch{}}function gt(){let e=be(),[t,{refetch:n}]=W(()=>e().case??!1,(u)=>Ye(u)),o=h(""),i=h(null),s=h([]),a=h("playing"),l=h(""),c=h(!1),f=h(""),v=h(""),p=h([]),b=h(0),A=null,y=null,R=window.matchMedia("(pointer: coarse)").matches,_=()=>e().case??"",z="";S(()=>{let u=t();if(u===void 0)return;document.title=u.title,l.set(""),f.set(""),z=_();let d=sn(z);if(d!==null){o.set(d.token),i.set(d.view),s.set(d.entries),a.set(d.phase),v.set(d.beforeAnswer),p.set(d.hints),b.set(d.shown),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}));return}o.set(u.state),i.set(u.view);let C=u.arrival??[];s.set([{kind:"narration",lines:u.opening},{kind:"narration",lines:u.incident},...C.length>0?[{kind:"narration",lines:C}]:[]]),a.set("playing"),v.set(""),p.set([]),b.set(0)}),S(()=>{let u=i();if(u===null||z==="")return;an(z,{token:o(),view:u,entries:s(),phase:a(),beforeAnswer:v(),hints:p(),shown:b()})});let w=()=>{i.set(null),ln(z),n()},J=(u)=>{s.update((d)=>[...d,u]),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}))},j=(u)=>f.set(u instanceof Error?u.message:String(u)),q=async(u)=>{if(c.peek()||u==="")return;c.set(!0),f.set("");try{let d=await Qe(o.peek(),u);if(o.set(d.state),i.set(d.view),J({kind:"turn",input:u,matched:d.matched,did:d.did,speaker:d.speaker,lines:d.text,gained:d.gained??[],moved:d.moved_to===void 0?void 0:d.view.scene.name,arrival:d.arrival??[],interlude:d.interlude??[]}),d.finale===!0)a.set("accusing")}catch(d){j(d)}finally{if(c.set(!1),!R)y?.focus()}},B=async(u)=>{if(c.peek()||u==="")return;c.set(!0),f.set(""),J({kind:"answer",text:u});try{let d=o.peek(),C=await Ze(d,u);if(v.set(d),o.set(C.state),C.hints!==void 0&&C.hints.length>0)p.set(C.hints);J({kind:"ending",verdict:C,share:{title:t()?.title??"",turns:i()?.turn??0}}),a.set("closed")}catch(d){j(d)}finally{c.set(!1)}},bt=()=>{if(c.peek()||v.peek()==="")return;o.set(v.peek()),f.set(""),J({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),a.set("accusing")},L=()=>i(),xt=()=>r("div",{children:[r(g,{when:()=>L().finale_open&&a()==="playing",children:r("div",{class:lt,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:c,onClick:()=>q(L().finale_label??"全員を集める"),children:()=>L().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:nt,children:[r("div",{children:[r(pt,{view:L},void 0,!1,void 0,this),r(ft,{view:L},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${T} ${st}`,ref:(u)=>A=u,children:[r(E,{each:s,children:(u)=>r(ht,{entry:u},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:c,children:r("p",{class:ne,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",fallback:()=>r(wt,{},void 0,!1,void 0,this),children:()=>r(yt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>p().length>0,children:()=>r(At,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),yt=()=>r("div",{class:`${T} ${ye}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(kt,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(u)=>{u.preventDefault();let d=l.peek().trim();if(l.set(""),R)y?.blur();q(d)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:l,disabled:c,ref:(u)=>{if(y=u,!R)y.focus()},onInput:(u)=>l.set(u.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:c,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>L().finale_open,children:r("div",{class:we,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>q(L().finale_label??"全員を集める"),children:()=>L().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>f()!=="",children:r("p",{class:"error",children:f},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),wt=()=>r("div",{class:`${T} ${ye}`,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:bt,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),At=()=>r("div",{class:`${T} ${at}`,children:[r(E,{each:()=>p().slice(0,b()),children:(u,d)=>r("p",{children:`ヒント${d+1}　${u}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>b()<p().length,children:r("button",{type:"button",class:"secondary",onClick:()=>b.update((u)=>u+1),children:()=>b()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),kt=()=>{let u=h("");return r("div",{children:[r("form",{class:"stacked",onSubmit:(d)=>{d.preventDefault(),B(u.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:u,disabled:c,ref:(d)=>d.focus(),onInput:(d)=>u.set(d.target.value)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:c,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),r("div",{class:we,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>a.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>t()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>t()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>t()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:c,onClick:w,children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:T,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>i()!==null,children:xt},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function cn(){return r("main",{class:tt,children:[r(xe,{children:[r(Z,{path:"/",component:ut},void 0,!1,void 0,this),r(Z,{path:"/:case",component:gt},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:ee},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function un(){return r(ve,{source:me(),children:()=>r(cn,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var vt=document.getElementById("app");if(vt)de(()=>r(un,{},void 0,!1,void 0,this),vt);

//# debugId=353D71A049E5DE3164756E2164756E21
//# sourceMappingURL=chunk-a2bx6xe6.js.map
