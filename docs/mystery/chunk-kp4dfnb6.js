var _t=!1,Pe=new Set,zt=(e)=>console.warn(e),Vt=zt,Xt="kanabun [dev]: ";function qt(){return _t||globalThis.__KANABUN_DEV__===!0}function _(e){if(!qt())return;if(Pe.has(e))return;Pe.add(e),Vt(Xt+e)}var q=0,Ie=1,K=2,z=3,E=null,b=null,de=0,ue=!1,te=[],Kt=1e6,W=(e,t)=>e===t,jt=()=>!1;function Je(e){if(!e||e.equals===void 0)return W;if(e.equals===!1)return jt;return e.equals}class V{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(e,t,n,o){if(this.equals=n,this.isEffect=t,o){if(this.fn=e,this.value=void 0,this.color=K,b!==null)(b.owned??=[]).push(this),this.owner=b}else this.fn=null,this.value=e,this.color=q}read(){if(this.color===z)return this.value;if(E!==null)(E.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(e){if(E!==null&&!E.isEffect)_("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,e))return;if(this.value=e,this.observers!==null)for(let t of this.observers)t.markStale(K)}markStale(e){if(this.color>=e)return;let t=this.color===q;if(this.color=e,t&&this.isEffect)Fe(this);if(this.observers!==null)for(let n of this.observers)n.markStale(Ie)}updateIfNecessary(){if(this.color===q||this.color===z)return;if(this.color===Ie&&this.sources!==null){for(let e of this.sources)if(e.updateIfNecessary(),this.color===K)break}if(this.color===K)this.update();this.color=q}update(){this.cleanNode();let e=E,t=b;E=this,b=this,this.collecting=[];let n,o,s=!1;try{n=this.fn()}catch(a){s=!0,o=a}finally{E=e,b=t}if(s){this.collecting=null,this.color=q,Zt(o,this.owner);return}this.reconcileSources();let i=!this.equals(this.value,n);if(this.value=n,this.color=q,i&&this.observers!==null){for(let a of this.observers)if(a.color!==z&&a.color<K)a.color=K}}reconcileSources(){let e=this.collecting;this.collecting=null;let t=[];for(let n of e)if(!t.includes(n))t.push(n);if(this.sources!==null){for(let n of this.sources)if(!t.includes(n))Ne(n,this)}for(let n of t)if(this.sources===null||!this.sources.includes(n))$t(n,this);this.sources=t.length>0?t:null}disposeOwned(){if(this.owned===null)return;let e=this.owned;this.owned=null;for(let t=e.length-1;t>=0;t--)e[t].dispose()}runCleanups(){if(this.cleanups===null)return;let e=this.cleanups;this.cleanups=null;for(let t=e.length-1;t>=0;t--)e[t]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===z)return;if(this.cleanNode(),this.sources!==null){for(let e of this.sources)Ne(e,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=z}}function $t(e,t){if(e.observers===null)e.observers=[t];else e.observers.push(t)}function Ne(e,t){let n=e.observers;if(n===null)return;let o=n.indexOf(t);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)e.observers=null}function Fe(e){te.push(e)}function pe(){if(ue)return;ue=!0;let e=0,t=0;try{while(e<te.length){if(++t>Kt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=te[e++];if(n.color!==z)n.updateIfNecessary()}}finally{te.length=0,ue=!1}}function Oe(e,t){let n=b,o=E;b=e,E=null;try{return t()}finally{b=n,E=o}}function fe(e,t){let n=b;b=e;try{return t()}finally{b=n}}function _e(){let e=new V(void 0,!1,W,!1);if(e.owner=b,b!==null)(b.owned??=[]).push(e);return e}function m(e,t){let n=new V(e,!1,Je(t),!1),o=()=>n.read(),s=o;return s.set=(i)=>{if(n.write(i),de===0)pe()},s.update=(i)=>{if(n.write(i(n.value)),de===0)pe()},s.peek=()=>n.value,o}function J(e,t){let n=new V(e,!1,Je(t),!0);return()=>n.read()}function L(e){if(b===null)_("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let t=new V(()=>{let n=e();if(typeof n==="function")(t.cleanups??=[]).push(n)},!0,W,!0);if(Fe(t),de===0)pe();return()=>t.dispose()}function j(e){let t=E;E=null;try{return e()}finally{E=t}}var Be=Symbol("error-handler");function Zt(e,t){for(let n=t;n!==null;n=n.owner)if(n.context!==null&&Be in n.context){n.context[Be](e);return}throw e}function I(e){if(b===null){_("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(b.cleanups??=[]).push(e)}function F(e){let t=new V(void 0,!1,W,!1);return t.owner=b,Oe(t,()=>e(()=>t.dispose()))}function Yt(e,t){let n=_e();return n.context={[e]:t},n}function X(e){let t=Symbol("context");return{id:t,defaultValue:e,Provider(n){let o=Yt(t,n.value),s=n.children,i=fe(o,()=>typeof s==="function"?s():s);return typeof i==="function"?()=>fe(o,i):i}}}function O(e){for(let t=b;t!==null;t=t.owner)if(t.context!==null&&e.id in t.context)return t.context[e.id];return e.defaultValue}function me(){let e=globalThis.document;if(!e)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return e}function Wt(e){return e!=null&&typeof e.nodeType==="number"}function Gt(e){return e.nodeType===3}var Dt=new Set(["script","style"]);function ge(e,t){let n=me().createElement(e);if(t!==null){for(let o in t){if(o==="children"||o==="ref")continue;en(n,o,t[o])}if(t.ref!==void 0)Ut(t.ref,n);if("children"in t)Qt(e,t.children),ne(n,t.children)}return n}function Qt(e,t){if(t==null||t==="")return;if(Array.isArray(t)&&t.length===0)return;if(!Dt.has(e.toLowerCase()))return;_(`a child of <${e.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function Ut(e,t){if(typeof e==="function")e(t);else if(e!==null&&typeof e==="object")e.current=t}function en(e,t,n){if(t.length>2&&t[0]==="o"&&t[1]==="n"){e.addEventListener(t.slice(2).toLowerCase(),n);return}if(t==="style"&&n!==null&&typeof n==="object"){tn(e,n);return}if(typeof n==="function")L(()=>Ve(e,t,n()));else Ve(e,t,n)}function tn(e,t){for(let n in t){let o=t[n];if(typeof o==="function")L(()=>ze(e,n,o()));else ze(e,n,o)}}function ze(e,t,n){e.style.setProperty(t,n==null?"":String(n))}function Ve(e,t,n){if(t==="value"||t==="checked"||t==="selected"){e[t]=n;return}if(t==="className")t="class";if(n==null||n===!1)e.removeAttribute(t);else if(n===!0)e.setAttribute(t,"");else e.setAttribute(t,String(n))}function ne(e,t,n=null){if(Array.isArray(t)){for(let o of t)ne(e,o,n);return}if(typeof t==="function"){let o=e.insertBefore(me().createComment(""),n);Xe(e,t,o,{current:null});return}qe(e,t,null,n)}function Xe(e,t,n,o){L(()=>{let s=t();if(typeof s==="function")Xe(e,s,n,o);else o.current=qe(e,s,o.current,n)})}function qe(e,t,n,o){if(n!==null&&n.length===1&&Gt(n[0])&&(typeof t==="string"||typeof t==="number"))return n[0].data=String(t),n;let s=nn(t);return Ke(e,n??[],s,o),s.length>0?s:null}function Ke(e,t,n,o){if(t.length>0){let i=new Set(n);for(let a of t)if(!i.has(a)&&a.parentNode===e)e.removeChild(a)}let s=o;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.parentNode!==e||a.nextSibling!==s)e.insertBefore(a,s);s=a}}function nn(e){let t=[];return he(t,e),t}function he(e,t){if(t==null||t===!1||t===!0||t==="")return;if(Array.isArray(t)){for(let n of t)he(e,n);return}if(Wt(t)){e.push(t);return}if(typeof t==="function"){he(e,t());return}e.push(me().createTextNode(String(t)))}function ve(e,t){let n;return F((o)=>{n=o,ne(t,e())}),()=>{n(),t.textContent=""}}function je(e,t){let n=[],o=[],s=[];return I(()=>{for(let i of s)i()}),()=>{let i=e(),a=i.length,l=Array(a),f=Array(a),h=new Map;for(let c=0;c<n.length;c++){let x=h.get(n[c]);if(x)x.push(c);else h.set(n[c],[c])}let v=Array(n.length).fill(!1);for(let c=0;c<a;c++){let x=i[c],w=h.get(x);if(w!==void 0&&w.length>0){let y=w.shift();v[y]=!0,l[c]=o[y],f[c]=s[y]}else{let y,R=F((M)=>(y=t(x,c),M));l[c]=y,f[c]=R}}for(let c=0;c<s.length;c++)if(!v[c])s[c]();return n=i.slice(),o=l,s=f,l}}function g(e){let t=J(()=>!!e.when());return()=>t()?e.children:e.fallback??null}function C(e){let t=je(()=>e.each()??[],(n,o)=>e.children(n,o));return()=>{let n=t();return n.length>0?n:e.fallback??null}}var sn=X(null);function G(e,t){let n=t!==void 0,o=n?e:()=>!0,s=n?t:e,i=m(void 0),a=m(void 0),l=m(!1),f=O(sn),h=!1,v=!1,c=0,x=()=>{if(f!==null&&!h&&!v)f.increment(),h=!0},w=()=>{if(h)h=!1,f.decrement()},y=(k,B)=>{let p=++c;l.set(!0),x();let T={value:i.peek(),refetching:B};Promise.resolve().then(()=>s(k,T)).then((Z)=>{if(p!==c)return;i.set(Z),a.set(void 0),l.set(!1),v=!0,w()},(Z)=>{if(p!==c)return;a.set(Z),l.set(!1),w()})};if(n)L(()=>{let k=o();if(k===!1||k===null||k===void 0){c++,l.set(!1),w();return}j(()=>y(k,!1))});else y(!0,!1);I(()=>{c++,w()});let R=()=>i(),M=R;return M.loading=()=>l(),M.error=()=>a(),[R,{mutate:(k)=>{c++,l.set(!1),a.set(void 0),w(),v=!0,i.set(k)},refetch:()=>{let k=j(o);if(k===!1||k===null||k===void 0)return;y(k,!0)}}]}var an=/^@(media|supports|container|document|layer)\b/i;function S(e,...t){let n=typeof e==="string"?e:e.reduce((i,a,l)=>i+a+(l<t.length?String(t[l]):""),""),o=fn(n),s="k-"+o;return dn(o,be(n,"."+s)),s}function ln(e){let t=[],n="",o=0,s="",i="",a="";for(let l=0;l<e.length;l++){let f=e[l];if(f==="{"){if(o===0){let h=s.lastIndexOf(";");n+=s.slice(0,h+1),a=s.slice(h+1),s="",i=""}else i+=f;o++}else if(f==="}")if(o--,o===0)t.push({prelude:a,inner:i});else if(o>0)i+=f;else o=0;else if(o===0)s+=f;else i+=f}return n+=s,{decls:n,blocks:t}}function be(e,t){let{decls:n,blocks:o}=ln(e),s="",i=n.trim();if(i)s+=`${t}{${i}}`;for(let{prelude:a,inner:l}of o){let f=a.trim();if(f[0]==="@")s+=an.test(f)?`${f}{${be(l,t)}}`:`${f}{${l.trim()}}`;else s+=be(l,cn(f,t))}return s}function cn(e,t){return un(e,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,t):`${t} ${o}`}).join(",")}function un(e,t){let n=[],o=0,s="";for(let i=0;i<e.length;i++){let a=e[i];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===t&&o===0)n.push(s),s="";else s+=a}return n.push(s),n}var $e=new Map;function dn(e,t){let n=globalThis.document;if(!n){if(!$e.has(e))$e.set(e,t);return}pn(n,e,t)}function pn(e,t,n){let o=e.head;for(let i of o.childNodes)if(i.nodeType===1&&i.getAttribute("data-k")===t)return;let s=e.createElement("style");s.setAttribute("data-k",t),s.textContent=n,o.appendChild(s)}function fn(e){let t=5381,n=2166136261;for(let o=0;o<e.length;o++){let s=e.charCodeAt(o);t=(t<<5)+t^s,n=Math.imul(n^s,16777619)}return(t>>>0).toString(36)+(n>>>0).toString(36)}function xe(e,t,n){if(typeof e==="function")return e(t??{});return ge(e,t??null)}function We(e){let t=new URL(e,"http://kanabun.local"),n={};return t.searchParams.forEach((o,s)=>{n[s]=o}),{pathname:t.pathname,search:t.search,hash:t.hash,query:n}}function Ze(e){let t=[];for(let n of e.split("/"))if(n!=="")t.push(n);return t}function Ye(e){try{return decodeURIComponent(e)}catch{return e}}function Ge(e,t){let n=Ze(e),o=Ze(t),s={};for(let i=0;i<n.length;i++){let a=n[i];if(a[0]==="*"){let f=a.slice(1),h=o.slice(i);if(f!=="")s[f]=h.map(Ye).join("/");return{params:s,rest:"/"+h.join("/")}}let l=o[i];if(l===void 0)return null;if(a[0]===":")s[a.slice(1)]=Ye(l);else if(a!==l)return null}return o.length===n.length?{params:s,rest:null}:null}function De(e,t){let n=t.startsWith("/")?t:"/"+t,o=new URL(e,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function Qe(){let e=globalThis.window;if(!e)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return e}function ye(e=Qe()){return{location:()=>e.location.pathname+e.location.search+e.location.hash,push:(n)=>e.history.pushState(null,"",n),replace:(n)=>e.history.replaceState(null,"",n),subscribe(n){return e.addEventListener("popstate",n),()=>e.removeEventListener("popstate",n)}}}function ke(e=Qe()){return{location:()=>{let n=e.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{e.location.hash=n},replace:(n)=>e.history.replaceState(null,"","#"+n),subscribe(n){return e.addEventListener("hashchange",n),()=>e.removeEventListener("hashchange",n)}}}var et=X(null),we=X(null),Ue=X(null),tt=Object.freeze({});function hn(e){let t=O(et);if(t===null)throw Error(`kanabun/router: ${e} must be used inside a <Router>.`);return t}function Ae(e){let t=e.source??ye(),n=m(t.location());I(t.subscribe(()=>n.set(t.location())));let o=J(()=>We(n())),s=(i,a)=>{let l=gn(i)?i:De(i,o().pathname);if(a?.replace)t.replace(l);else t.push(l);n.set(t.location())};return et.Provider({value:{location:o,navigate:s},children:e.children})}function Se(){return O(we)??(()=>tt)}function re(e){let{location:t}=hn("<Route>"),n=O(we),s=O(Ue)??(()=>t().pathname),i=J(()=>Ge(e.path,s())),a=J(()=>i()!==null),l=J(()=>{let x=i()?.params??tt;return n===null?x:{...n(),...x}}),f=()=>i()?.rest??"/",h=()=>we.Provider({value:l,children:()=>Ue.Provider({value:f,children:()=>{if(e.component!==void 0)return e.component({params:l});if(typeof e.children==="function")return e.children(l);return e.children}})}),v=nt(),c=()=>{if(a())return v(h);return v(null),e.fallback??null};return c.$matched=a,c.$content=h,c}function nt(){let e=null;return I(()=>e?.()),(t)=>{if(e!==null)e(),e=null;if(t===null)return null;let n;return e=F((o)=>(n=t(),o)),n}}function mn(e){return typeof e==="function"&&"$matched"in e}function rt(e,t){if(Array.isArray(e))for(let n of e)rt(n,t);else if(mn(e))t.push(e)}function Te(e){let t=[];rt(e.children,t);let n=nt();return()=>{for(let o of t)if(o.$matched())return n(o.$content);return n(null),e.fallback??null}}function gn(e){return/^[a-z][a-z0-9+.-]*:/i.test(e)||e.startsWith("//")}var oe=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");function ot(e){return/^https?:\/\//i.test(e)?e:`${oe}/${e.replace(/^\/+/,"")}`}async function se(e,t){let n=await fetch(oe+e,{method:t===void 0?"GET":"POST",headers:t===void 0?void 0:{"Content-Type":"application/json"},body:t===void 0?void 0:JSON.stringify(t)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var st=()=>se("/api/cases"),it=(e)=>se("/api/new",{case:e}),at=(e,t)=>se("/api/act",{state:e,input:t}),lt=(e,t)=>se("/api/accuse",{state:e,answer:t});var ut=S`
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
`,ht=S`
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
`,D=S`
  color: var(--muted);
  font-size: 13px;
`,mt=S`
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
`,Re=S`
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
`,Ee=S`
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
`,ie=S`
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

  .new {
    background: var(--warn);
    color: #fff;
  }

  .jot {
    flex: 0 0 auto;
    padding: 3px 10px;
    border: 1px solid var(--leather-ink);
    background: transparent;
    color: var(--leather-ink);
    font-size: 12.5px;
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
`;function r(e,t,n,o,s,i){return xe(e,t,n)}function kt(){let[e]=G(()=>st());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.loading(),children:r("p",{class:ie,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:H,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:D,children:()=>String(e.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:bt,children:r(C,{each:()=>e()?.cases??[],children:(t)=>r("a",{href:`#${t.id}`,children:[r("p",{class:"title",children:t.title},void 0,!1,void 0,this),r(g,{when:()=>t.byline!==void 0,children:r("p",{class:"byline",children:t.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${t.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}var wt="./notebook-closed-0ve9trf2.png";var At="./notebook-open-d3mm1df3.png";function ae(e){let t=e.person,n=m(0);return r("div",{class:ft,children:[r("span",{children:t.avatar||"？"},void 0,!1,void 0,this),()=>{if(!t.image||n()>=2)return null;let o=ot(t.image);return r("img",{src:n()===0?o:`${o}${o.includes("?")?"&":"?"}retry=${n()}`,alt:t.name,loading:"lazy",onError:()=>n.update((s)=>s+1)},void 0,!1,void 0,this)}]},void 0,!0,void 0,this)}function St(e){return r("div",{class:H,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:pt,children:[r("p",{class:"name",children:()=>e.view().scene.name},void 0,!1,void 0,this),()=>e.view().scene.description.map((t)=>r("p",{class:"desc",children:t},void 0,!1,void 0,this)),r("div",{class:"people",children:r(C,{each:()=>e.view().people??[],fallback:r("p",{class:D,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(t)=>r("div",{class:"person",children:[r(ae,{person:t},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:t.name},void 0,!1,void 0,this),r("div",{class:"role",children:t.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Tt(e){return r("div",{class:H,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:ht,children:r(C,{each:()=>e.view().evidence??[],fallback:r("p",{class:D,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(t)=>r("div",{class:"item",children:[r("div",{class:"name",children:t.name},void 0,!1,void 0,this),r("div",{class:"desc",children:t.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Rt(e){let t=e.entry;if(t.kind==="narration")return r("div",{class:"entry",children:t.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(t.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:t.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(t.kind==="ending")return r(xn,{verdict:t.verdict,share:t.share},void 0,!1,void 0,this);return r("div",{class:t.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+t.input},void 0,!1,void 0,this),t.speaker?r("div",{class:"speaker",children:[r(ae,{person:t.speaker},void 0,!1,void 0,this),r("div",{class:"who",children:t.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,t.did?r("p",{class:"did",children:t.did},void 0,!1,void 0,this):null,t.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),t.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),t.moved?r("div",{class:"moved",children:"— "+t.moved+" —"},void 0,!1,void 0,this):null,t.arrival.length>0?r("div",{class:"arrival",children:t.arrival.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null,t.interlude.length>0?r("div",{class:"interlude",children:t.interlude.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function xn(e){let t=e.verdict,n=t.correct?`犯人を言い当てた（${t.named_name}）`:t.named_name?`${t.named_name}を指した`:"犯人を名指ししなかった",o=(h,v)=>[r("span",{class:h?"mark":"mark no",children:h?"○":"×"},void 0,!1,void 0,this),r("span",{children:v},void 0,!1,void 0,this)],s=t.points.filter((h)=>h.hit),i=t.points.length-s.length,a=`${Math.round(100*t.coherence/(t.coherence_top||1))}%`,l=t.celebrate===!0,f=Et(t)?"完 全 解 決":"事 件 解 決";return r("div",{class:l?"entry said won":"entry said",children:[l?r("p",{class:"solved",children:f},void 0,!1,void 0,this):null,r("h3",{children:t.title},void 0,!1,void 0,this),t.text.map((h)=>r("p",{children:h},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(t.correct,n),s.map((h)=>o(!0,h.label)),i>0?[r("span",{class:"mark no",children:"×"},void 0,!1,void 0,this),r("span",{class:"veiled",children:`辿り着かなかったことが、あと ${i} つ`},void 0,!1,void 0,this)]:null]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${t.coherence.toFixed(1)} / ${t.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:a}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.coherence_legend!==void 0,children:t.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this),e.share?r(wn,{text:yn(t,e.share),title:e.share.title},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function Et(e){if(e.celebrate!==!0)return!1;return e.complete===!0||e.correct&&e.points.every((t)=>t.hit)}function yn(e,t){let n=e.points.filter((i)=>i.hit).length,o=Et(e)?"完全解決":e.celebrate===!0?"事件解決":"未解決",s=e.points.map((i)=>i.hit?"○":"×").join("");return[`『${t.title}』${o}`,`犯人 ${e.correct?"○":"×"}／真相 ${s} ${n}/${e.points.length}`,`筋の通り ${e.coherence.toFixed(1)}/${e.coherence_top}・${t.turns}手`,"#jevmystery"].join(`
`)}function kn(){let e=new URL(location.href);return e.searchParams.delete("api"),e.toString()}function wn(e){let t=kn(),n=m(!1),o=typeof navigator.share==="function",s=()=>{navigator.share({title:e.title,text:e.text,url:t}).catch(()=>{})},i=async()=>{let a=`${e.text}
${t}`;try{await navigator.clipboard.writeText(a)}catch{let l=document.createElement("textarea");l.value=a,l.style.position="fixed",l.style.opacity="0",document.body.appendChild(l),l.select(),document.execCommand("copy"),l.remove()}n.set(!0),setTimeout(()=>n.set(!1),2000)};return r("div",{class:"share",children:[r("pre",{children:e.text},void 0,!1,void 0,this),r("div",{class:"buttons",children:[o?r("button",{type:"button",class:"secondary",onClick:s,children:"共有する"},void 0,!1,void 0,this):null,r("button",{type:"button",class:"secondary",onClick:()=>void i(),children:()=>n()?"コピーしました":"結果をコピー"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Ct(e){let t=m(!1),n=m("people"),o=()=>e.view().evidence??[],s=j(()=>o().length),i=m(s),a=m(s),l=()=>Math.max(0,o().length-i()),f=null,h=()=>{if(l()>0)n.set("evidence");a.set(i.peek()),i.set(o().length),t.set(!0),requestAnimationFrame(()=>f?.focus())},v=()=>{i.set(o().length),t.set(!1)},c=()=>t.peek()?v():h(),x=(p)=>{if(p.key==="Escape"&&t.peek())v()};document.addEventListener("keydown",x),I(()=>document.removeEventListener("keydown",x));let w=(p)=>{let T=e.write();if(T===null)return;v(),T(p)},y=(p)=>(e.view().people??[]).some((T)=>T.id===p.id),R=(p)=>r(g,{when:()=>e.write()!==null,children:r("button",{type:"button",class:"jot","aria-label":p.label,onClick:()=>w(p.text),children:"✎ 書き込む"},void 0,!1,void 0,this)},void 0,!1,void 0,this),M=(p)=>r("button",{type:"button",role:"tab",class:()=>n()===p.id?"tab on":"tab","aria-selected":()=>String(n()===p.id),onClick:()=>n.set(p.id),children:p.label},void 0,!1,void 0,this),N=()=>r("div",{class:"list",children:r(C,{each:e.met,fallback:r("p",{class:"none",children:"まだ誰にも会っていない。"},void 0,!1,void 0,this),children:(p)=>r("div",{class:"row",children:[r(ae,{person:p},void 0,!1,void 0,this),r("div",{class:"body",children:[r("div",{class:"name",children:[p.name,r(g,{when:()=>y(p),children:r("span",{class:"here",children:"ここにいる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"desc",children:p.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(R,{text:p.name,label:`${p.name}の名前を入力欄に書き込む`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),k=()=>r("div",{class:"list",children:r(C,{each:o,fallback:r("p",{class:"none",children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(p,T)=>r("div",{class:"row",children:[r("div",{class:"body",children:[r("div",{class:"name",children:[p.name,r(g,{when:()=>T>=a(),children:r("span",{class:"new",children:"新"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"desc",children:p.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(R,{text:p.name,label:`${p.name}を入力欄に書き込む`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this),B=()=>r("div",{class:"list",children:[r("p",{class:"scene",children:()=>e.view().scene.name},void 0,!1,void 0,this),()=>e.view().scene.description.map((p)=>r("p",{class:"desc",children:p},void 0,!1,void 0,this)),r("p",{class:"present",children:()=>{let p=e.view().people??[];return p.length===0?"ここには誰もいない。":`ここにいるのは、${p.map((T)=>T.name).join("、")}。`}},void 0,!1,void 0,this)]},void 0,!0,void 0,this);return r("div",{class:yt,children:[r(g,{when:t,children:[r("div",{class:"backdrop",onClick:v},void 0,!1,void 0,this),r("section",{class:"book",role:"dialog","aria-label":"手帳",tabindex:-1,ref:(p)=>f=p,children:[r("header",{children:[r("h2",{children:"手帳"},void 0,!1,void 0,this),r("button",{type:"button",class:"close","aria-label":"手帳を閉じる",onClick:v,children:"×"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"tabs",role:"tablist",children:[r(M,{id:"people",label:()=>`人物 ${e.met().length}`},void 0,!1,void 0,this),r(M,{id:"evidence",label:()=>`証拠 ${o().length}`},void 0,!1,void 0,this),r(M,{id:"place",label:()=>"現在地"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{class:"page",children:[()=>n()==="people"?r(N,{},void 0,!1,void 0,this):n()==="evidence"?r(k,{},void 0,!1,void 0,this):r(B,{},void 0,!1,void 0,this),r(g,{when:()=>e.write()!==null&&n()!=="place",children:r("p",{class:"tip",children:"「書き込む」で、その名前を入力欄に書き込めます。"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),r("button",{type:"button",class:()=>e.hidden()?"fab gone":t()?"fab opened":"fab","aria-label":()=>t()?"手帳を閉じる":"手帳を開く","aria-expanded":()=>String(t()),onClick:c,children:[r("img",{src:()=>t()?At:wt,alt:"",width:"64",height:"64"},void 0,!1,void 0,this),r(g,{when:()=>l()>0&&!t(),children:r("span",{class:"badge",children:()=>`+${l()}`},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}var Me=(e)=>`jev-mystery:${e}`;function An(e){try{let t=localStorage.getItem(Me(e));return t===null?null:JSON.parse(t)}catch{return null}}function Sn(e,t){try{localStorage.setItem(Me(e),JSON.stringify(t))}catch{}}function Ce(e,t){let n=[...e];for(let o of t)if(o!==void 0&&!n.some((s)=>s.id===o.id))n.push(o);return n.length===e.length?e:n}function Tn(e){try{localStorage.removeItem(Me(e))}catch{}}function Mt(){let e=Se(),[t,{refetch:n}]=G(()=>e().case??!1,(d)=>it(d)),o=m(""),s=m(null),i=m([]),a=m("playing"),l=m(""),f=m(""),h=m([]),v=m(!1),c=m(!1),x=m(""),w=m(""),y=m([]),R=m(0),M=null,N=null,k=null,B=window.matchMedia("(pointer: coarse)").matches,p=()=>e().case??"",T="";L(()=>{let d=t();if(d===void 0)return;document.title=d.title,l.set(""),f.set(""),x.set(""),T=p();let u=An(T);if(u!==null){o.set(u.token),s.set(u.view),i.set(u.entries),a.set(u.phase),w.set(u.beforeAnswer),y.set(u.hints),R.set(u.shown),h.set(u.met??Ce([],[...u.view.people??[],...u.entries.map((Y)=>Y.kind==="turn"?Y.speaker:void 0)])),requestAnimationFrame(()=>M?.lastElementChild?.scrollIntoView({block:"end"}));return}o.set(d.state),h.set(Ce([],d.view.people??[])),s.set(d.view);let A=d.arrival??[];i.set([{kind:"narration",lines:d.opening},{kind:"narration",lines:d.incident},...A.length>0?[{kind:"narration",lines:A}]:[]]),a.set("playing"),w.set(""),y.set([]),R.set(0)}),L(()=>{let d=s();if(d===null||T==="")return;Sn(T,{token:o(),view:d,entries:i(),phase:a(),beforeAnswer:w(),hints:y(),shown:R(),met:h()})}),L(()=>{a(),v.set(!1)});let Z=()=>{s.set(null),Tn(T),n()},U=(d)=>{i.update((u)=>[...u,d]),requestAnimationFrame(()=>M?.lastElementChild?.scrollIntoView({block:"end"}))},Le=(d)=>x.set(d instanceof Error?d.message:String(d)),le=async(d)=>{if(c.peek()||d==="")return;c.set(!0),x.set("");try{let u=await at(o.peek(),d);if(o.set(u.state),h.update((A)=>Ce(A,[...u.view.people??[],u.speaker])),s.set(u.view),U({kind:"turn",input:d,matched:u.matched,did:u.did,speaker:u.speaker,lines:u.text,gained:u.gained??[],moved:u.moved_to===void 0?void 0:u.view.scene.name,arrival:u.arrival??[],interlude:u.interlude??[]}),u.finale===!0)a.set("accusing")}catch(u){Le(u)}finally{if(c.set(!1),!B)N?.focus()}},Ht=async(d)=>{if(c.peek()||d==="")return;c.set(!0),x.set(""),U({kind:"answer",text:d});try{let u=o.peek(),A=await lt(u,d);if(w.set(u),o.set(A.state),A.hints!==void 0&&A.hints.length>0)y.set(A.hints);U({kind:"ending",verdict:A,share:{title:t()?.title??"",turns:s()?.turn??0}}),a.set("closed")}catch(u){Le(u)}finally{c.set(!1)}},Pt=()=>{if(c.peek()||w.peek()==="")return;o.set(w.peek()),x.set(""),U({kind:"narration",lines:["――もう一度、考え直すことにした。"]}),a.set("accusing")},He=()=>{if(c()||a()==="closed")return null;return(d)=>{let u=a.peek()==="accusing",A=u?k:N,Y=u?f:l;if(A===null||!A.isConnected||A.disabled)return;let ce=Y.peek(),ee=A.selectionStart??ce.length,Ot=A.selectionEnd??ee;Y.set(ce.slice(0,ee)+d+ce.slice(Ot)),A.focus(),A.setSelectionRange(ee+d.length,ee+d.length)}},P=()=>s(),It=()=>r("div",{children:[r(g,{when:()=>P().finale_open&&a()==="playing",children:r("div",{class:vt,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:c,onClick:()=>le(P().finale_label??"全員を集める"),children:()=>P().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:dt,children:[r("div",{children:[r(St,{view:P},void 0,!1,void 0,this),r(Tt,{view:P},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${H} ${mt}`,ref:(d)=>M=d,children:[r(C,{each:i,children:(d)=>r(Rt,{entry:d},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:c,children:r("p",{class:ie,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",fallback:()=>r(Bt,{},void 0,!1,void 0,this),children:()=>r(Nt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>y().length>0,children:()=>r(Jt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),r(Ct,{view:P,met:h,write:He,hidden:()=>B&&v()},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Nt=()=>r("div",{class:`${H} ${Re}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(Ft,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(d)=>{d.preventDefault();let u=l.peek().trim();if(l.set(""),B)N?.blur();le(u)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:l,disabled:c,ref:(d)=>{if(N=d,!B)N.focus()},onFocus:()=>v.set(!0),onBlur:()=>v.set(!1),onInput:(d)=>l.set(d.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:c,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。 ここにいる人には、何を訊いても構いません。話を聞かせてくれと頼んでも、 「〜ですか」と一言で確かめても、どちらでも通ります。"},void 0,!1,void 0,this),r(g,{when:()=>P().finale_open,children:r("div",{class:Ee,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>le(P().finale_label??"全員を集める"),children:()=>P().finale_label??"全員を集める"},void 0,!1,void 0,this),r("p",{class:"hint",children:"いつでも集められます。まだ聞き込みを続けても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>x()!=="",children:r("p",{class:"error",children:x},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Bt=()=>r("div",{class:`${H} ${Re}`,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:Pt,children:"推理を述べる前に戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"集めた手がかりはそのままに、推理だけを書き直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Jt=()=>r("div",{class:`${H} ${gt}`,children:[r(C,{each:()=>y().slice(0,R()),children:(d,u)=>r("p",{children:`ヒント${u+1}　${d}`},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>R()<y().length,children:r("button",{type:"button",class:"secondary",onClick:()=>R.update((d)=>d+1),children:()=>R()===0?"ヒントを見る":"次のヒントを見る"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),Ft=()=>{let d=()=>(P().suspects??[]).map((u)=>u.replace(/（[^（）]*）$/,""));return r("div",{children:[r("form",{class:"stacked",onSubmit:(u)=>{u.preventDefault(),Ht(f.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:f,disabled:c,ref:(u)=>{k=u,k.focus()},onFocus:()=>v.set(!0),onBlur:()=>v.set(!1),onInput:(u)=>f.set(u.target.value)},void 0,!1,void 0,this),r(g,{when:()=>d().length>0,children:r("div",{class:xt,children:[r("span",{children:"名前を入れる"},void 0,!1,void 0,this),r(C,{each:d,children:(u)=>r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>He()?.(u),children:u},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:c,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this),r("div",{class:Ee,children:[r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>a.set("playing"),children:"聞き込みに戻る"},void 0,!1,void 0,this),r("p",{class:"hint",children:"まだ推理を述べずに、館の中を調べ直せます。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>t()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>t()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>t()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:c,onClick:Z,children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:H,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>s()!==null,children:It},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Rn(){return r("main",{class:ut,children:[r(Te,{children:[r(re,{path:"/",component:kt},void 0,!1,void 0,this),r(re,{path:"/:case",component:Mt},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:oe},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function En(){return r(Ae,{source:ke(),children:()=>r(Rn,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var Lt=document.getElementById("app");if(Lt)ve(()=>r(En,{},void 0,!1,void 0,this),Lt);

//# debugId=90BE826E35D3819D64756E2164756E21
//# sourceMappingURL=chunk-kp4dfnb6.js.map
