var ct=!1,ge=new Set,ut=(t)=>console.warn(t),dt=ut,pt="kanabun [dev]: ";function ft(){return ct||globalThis.__KANABUN_DEV__===!0}function C(t){if(!ft())return;if(ge.has(t))return;ge.add(t),dt(pt+t)}var F=0,ve=1,_=2,N=3,w=null,m=null,Z=0,Q=!1,V=[],mt=1e6,J=(t,e)=>t===e,ht=()=>!1;function ye(t){if(!t||t.equals===void 0)return J;if(t.equals===!1)return ht;return t.equals}class I{value;fn;observers=null;sources=null;collecting=null;color;isEffect;cleanups=null;owned=null;owner=null;context=null;equals;constructor(t,e,n,o){if(this.equals=n,this.isEffect=e,o){if(this.fn=t,this.value=void 0,this.color=_,m!==null)(m.owned??=[]).push(this),this.owner=m}else this.fn=null,this.value=t,this.color=F}read(){if(this.color===N)return this.value;if(w!==null)(w.collecting??=[]).push(this);if(this.fn!==null)this.updateIfNecessary();return this.value}write(t){if(w!==null&&!w.isEffect)C("a signal was written while a computed was evaluating. Derivations must "+"be pure (no side effects) — move the write into an effect or an "+"event handler.");if(this.equals(this.value,t))return;if(this.value=t,this.observers!==null)for(let e of this.observers)e.markStale(_)}markStale(t){if(this.color>=t)return;let e=this.color===F;if(this.color=t,e&&this.isEffect)we(this);if(this.observers!==null)for(let n of this.observers)n.markStale(ve)}updateIfNecessary(){if(this.color===F||this.color===N)return;if(this.color===ve&&this.sources!==null){for(let t of this.sources)if(t.updateIfNecessary(),this.color===_)break}if(this.color===_)this.update();this.color=F}update(){this.cleanNode();let t=w,e=m;w=this,m=this,this.collecting=[];let n,o,i=!1;try{n=this.fn()}catch(a){i=!0,o=a}finally{w=t,m=e}if(i){this.collecting=null,this.color=F,vt(o,this.owner);return}this.reconcileSources();let s=!this.equals(this.value,n);if(this.value=n,this.color=F,s&&this.observers!==null){for(let a of this.observers)if(a.color!==N&&a.color<_)a.color=_}}reconcileSources(){let t=this.collecting;this.collecting=null;let e=[];for(let n of t)if(!e.includes(n))e.push(n);if(this.sources!==null){for(let n of this.sources)if(!e.includes(n))xe(n,this)}for(let n of e)if(this.sources===null||!this.sources.includes(n))gt(n,this);this.sources=e.length>0?e:null}disposeOwned(){if(this.owned===null)return;let t=this.owned;this.owned=null;for(let e=t.length-1;e>=0;e--)t[e].dispose()}runCleanups(){if(this.cleanups===null)return;let t=this.cleanups;this.cleanups=null;for(let e=t.length-1;e>=0;e--)t[e]()}cleanNode(){this.disposeOwned(),this.runCleanups()}dispose(){if(this.color===N)return;if(this.cleanNode(),this.sources!==null){for(let t of this.sources)xe(t,this);this.sources=null}this.observers=null,this.collecting=null,this.owner=null,this.color=N}}function gt(t,e){if(t.observers===null)t.observers=[e];else t.observers.push(e)}function xe(t,e){let n=t.observers;if(n===null)return;let o=n.indexOf(e);if(o===-1)return;if(n[o]=n[n.length-1],n.pop(),n.length===0)t.observers=null}function we(t){V.push(t)}function ee(){if(Q)return;Q=!0;let t=0,e=0;try{while(t<V.length){if(++e>mt)throw Error("kanabun: effect flush did not stabilize — likely an effect that "+"writes a signal it also depends on (infinite update loop).");let n=V[t++];if(n.color!==N)n.updateIfNecessary()}}finally{V.length=0,Q=!1}}function Ae(t,e){let n=m,o=w;m=t,w=null;try{return e()}finally{m=n,w=o}}function te(t,e){let n=m;m=t;try{return e()}finally{m=n}}function Te(){let t=new I(void 0,!1,J,!1);if(t.owner=m,m!==null)(m.owned??=[]).push(t);return t}function h(t,e){let n=new I(t,!1,ye(e),!1),o=()=>n.read(),i=o;return i.set=(s)=>{if(n.write(s),Z===0)ee()},i.update=(s)=>{if(n.write(s(n.value)),Z===0)ee()},i.peek=()=>n.value,o}function R(t,e){let n=new I(t,!1,ye(e),!0);return()=>n.read()}function S(t){if(m===null)C("effect() was created outside any owner (createRoot/render). It won't be "+"disposed automatically — keep the returned disposer and call it, or "+"create the effect inside a root.");let e=new I(()=>{let n=t();if(typeof n==="function")(e.cleanups??=[]).push(n)},!0,J,!0);if(we(e),Z===0)ee();return()=>e.dispose()}function j(t){let e=w;w=null;try{return t()}finally{w=e}}var be=Symbol("error-handler");function vt(t,e){for(let n=e;n!==null;n=n.owner)if(n.context!==null&&be in n.context){n.context[be](t);return}throw t}function L(t){if(m===null){C("onCleanup() was called outside an owner; the cleanup will never run. Call it during a render or inside an effect/createRoot.");return}(m.cleanups??=[]).push(t)}function H(t){let e=new I(void 0,!1,J,!1);return e.owner=m,Ae(e,()=>t(()=>e.dispose()))}function xt(t,e){let n=Te();return n.context={[t]:e},n}function O(t){let e=Symbol("context");return{id:e,defaultValue:t,Provider(n){let o=xt(e,n.value),i=n.children,s=te(o,()=>typeof i==="function"?i():i);return typeof s==="function"?()=>te(o,s):s}}}function M(t){for(let e=m;e!==null;e=e.owner)if(e.context!==null&&t.id in e.context)return e.context[t.id];return t.defaultValue}function re(){let t=globalThis.document;if(!t)throw Error("kanabun: no `document` is available — the DOM runtime needs a browser "+"(or a DOM mock on globalThis.document).");return t}function bt(t){return t!=null&&typeof t.nodeType==="number"}function yt(t){return t.nodeType===3}var wt=new Set(["script","style"]);function oe(t,e){let n=re().createElement(t);if(e!==null){for(let o in e){if(o==="children"||o==="ref")continue;kt(n,o,e[o])}if(e.ref!==void 0)Tt(e.ref,n);if("children"in e)At(t,e.children),q(n,e.children)}return n}function At(t,e){if(e==null||e==="")return;if(Array.isArray(e)&&e.length===0)return;if(!wt.has(t.toLowerCase()))return;C(`a child of <${t.toLowerCase()}> is treated as raw text and is not `+"HTML-escaped — never place untrusted data here (it can execute or "+"inject markup); use the css helper for styles.")}function Tt(t,e){if(typeof t==="function")t(e);else if(t!==null&&typeof t==="object")t.current=e}function kt(t,e,n){if(e.length>2&&e[0]==="o"&&e[1]==="n"){t.addEventListener(e.slice(2).toLowerCase(),n);return}if(e==="style"&&n!==null&&typeof n==="object"){St(t,n);return}if(typeof n==="function")S(()=>Se(t,e,n()));else Se(t,e,n)}function St(t,e){for(let n in e){let o=e[n];if(typeof o==="function")S(()=>ke(t,n,o()));else ke(t,n,o)}}function ke(t,e,n){t.style.setProperty(e,n==null?"":String(n))}function Se(t,e,n){if(e==="value"||e==="checked"||e==="selected"){t[e]=n;return}if(e==="className")e="class";if(n==null||n===!1)t.removeAttribute(e);else if(n===!0)t.setAttribute(e,"");else t.setAttribute(e,String(n))}function q(t,e,n=null){if(Array.isArray(e)){for(let o of e)q(t,o,n);return}if(typeof e==="function"){let o=t.insertBefore(re().createComment(""),n);Ee(t,e,o,{current:null});return}Re(t,e,null,n)}function Ee(t,e,n,o){S(()=>{let i=e();if(typeof i==="function")Ee(t,i,n,o);else o.current=Re(t,i,o.current,n)})}function Re(t,e,n,o){if(n!==null&&n.length===1&&yt(n[0])&&(typeof e==="string"||typeof e==="number"))return n[0].data=String(e),n;let i=Et(e);return Le(t,n??[],i,o),i.length>0?i:null}function Le(t,e,n,o){if(e.length>0){let s=new Set(n);for(let a of e)if(!s.has(a)&&a.parentNode===t)t.removeChild(a)}let i=o;for(let s=n.length-1;s>=0;s--){let a=n[s];if(a.parentNode!==t||a.nextSibling!==i)t.insertBefore(a,i);i=a}}function Et(t){let e=[];return ne(e,t),e}function ne(t,e){if(e==null||e===!1||e===!0||e==="")return;if(Array.isArray(e)){for(let n of e)ne(t,n);return}if(bt(e)){t.push(e);return}if(typeof e==="function"){ne(t,e());return}t.push(re().createTextNode(String(e)))}function ie(t,e){let n;return H((o)=>{n=o,q(e,t())}),()=>{n(),e.textContent=""}}function He(t,e){let n=[],o=[],i=[];return L(()=>{for(let s of i)s()}),()=>{let s=t(),a=s.length,l=Array(a),c=Array(a),f=new Map;for(let d=0;d<n.length;d++){let x=f.get(n[d]);if(x)x.push(d);else f.set(n[d],[d])}let A=Array(n.length).fill(!1);for(let d=0;d<a;d++){let x=s[d],T=f.get(x);if(T!==void 0&&T.length>0){let y=T.shift();A[y]=!0,l[d]=o[y],c[d]=i[y]}else{let y,D=H((k)=>(y=e(x,d),k));l[d]=y,c[d]=D}}for(let d=0;d<i.length;d++)if(!A[d])i[d]();return n=s.slice(),o=l,i=c,l}}function g(t){let e=R(()=>!!t.when());return()=>e()?t.children:t.fallback??null}function P(t){let e=He(()=>t.each()??[],(n,o)=>t.children(n,o));return()=>{let n=e();return n.length>0?n:t.fallback??null}}var Ht=O(null);function z(t,e){let n=e!==void 0,o=n?t:()=>!0,i=n?e:t,s=h(void 0),a=h(void 0),l=h(!1),c=M(Ht),f=!1,A=!1,d=0,x=()=>{if(c!==null&&!f&&!A)c.increment(),f=!0},T=()=>{if(f)f=!1,c.decrement()},y=(v,G)=>{let u=++d;l.set(!0),x();let p={value:s.peek(),refetching:G};Promise.resolve().then(()=>i(v,p)).then((Y)=>{if(u!==d)return;s.set(Y),a.set(void 0),l.set(!1),A=!0,T()},(Y)=>{if(u!==d)return;a.set(Y),l.set(!1),T()})};if(n)S(()=>{let v=o();if(v===!1||v===null||v===void 0){d++,l.set(!1),T();return}j(()=>y(v,!1))});else y(!0,!1);L(()=>{d++,T()});let D=()=>s(),k=D;return k.loading=()=>l(),k.error=()=>a(),[D,{mutate:(v)=>{d++,l.set(!1),a.set(void 0),T(),A=!0,s.set(v)},refetch:()=>{let v=j(o);if(v===!1||v===null||v===void 0)return;y(v,!0)}}]}var Mt=/^@(media|supports|container|document|layer)\b/i;function b(t,...e){let n=typeof t==="string"?t:t.reduce((s,a,l)=>s+a+(l<e.length?String(e[l]):""),""),o=Dt(n),i="k-"+o;return It(o,se(n,"."+i)),i}function Pt(t){let e=[],n="",o=0,i="",s="",a="";for(let l=0;l<t.length;l++){let c=t[l];if(c==="{"){if(o===0){let f=i.lastIndexOf(";");n+=i.slice(0,f+1),a=i.slice(f+1),i="",s=""}else s+=c;o++}else if(c==="}")if(o--,o===0)e.push({prelude:a,inner:s});else if(o>0)s+=c;else o=0;else if(o===0)i+=c;else s+=c}return n+=i,{decls:n,blocks:e}}function se(t,e){let{decls:n,blocks:o}=Pt(t),i="",s=n.trim();if(s)i+=`${e}{${s}}`;for(let{prelude:a,inner:l}of o){let c=a.trim();if(c[0]==="@")i+=Mt.test(c)?`${c}{${se(l,e)}}`:`${c}{${l.trim()}}`;else i+=se(l,Ct(c,e))}return i}function Ct(t,e){return Nt(t,",").map((n)=>{let o=n.trim();return o.includes("&")?o.replace(/&/g,e):`${e} ${o}`}).join(",")}function Nt(t,e){let n=[],o=0,i="";for(let s=0;s<t.length;s++){let a=t[s];if(a==="("||a==="[")o++;else if(a===")"||a==="]")o--;if(a===e&&o===0)n.push(i),i="";else i+=a}return n.push(i),n}var Me=new Map;function It(t,e){let n=globalThis.document;if(!n){if(!Me.has(t))Me.set(t,e);return}Ot(n,t,e)}function Ot(t,e,n){let o=t.head;for(let s of o.childNodes)if(s.nodeType===1&&s.getAttribute("data-k")===e)return;let i=t.createElement("style");i.setAttribute("data-k",e),i.textContent=n,o.appendChild(i)}function Dt(t){let e=5381,n=2166136261;for(let o=0;o<t.length;o++){let i=t.charCodeAt(o);e=(e<<5)+e^i,n=Math.imul(n^i,16777619)}return(e>>>0).toString(36)+(n>>>0).toString(36)}function ae(t,e,n){if(typeof t==="function")return t(e??{});return oe(t,e??null)}function Ne(t){let e=new URL(t,"http://kanabun.local"),n={};return e.searchParams.forEach((o,i)=>{n[i]=o}),{pathname:e.pathname,search:e.search,hash:e.hash,query:n}}function Pe(t){let e=[];for(let n of t.split("/"))if(n!=="")e.push(n);return e}function Ce(t){try{return decodeURIComponent(t)}catch{return t}}function Ie(t,e){let n=Pe(t),o=Pe(e),i={};for(let s=0;s<n.length;s++){let a=n[s];if(a[0]==="*"){let c=a.slice(1),f=o.slice(s);if(c!=="")i[c]=f.map(Ce).join("/");return{params:i,rest:"/"+f.join("/")}}let l=o[s];if(l===void 0)return null;if(a[0]===":")i[a.slice(1)]=Ce(l);else if(a!==l)return null}return o.length===n.length?{params:i,rest:null}:null}function Oe(t,e){let n=e.startsWith("/")?e:"/"+e,o=new URL(t,"http://kanabun.local"+n);return o.pathname+o.search+o.hash}function De(){let t=globalThis.window;if(!t)throw Error("kanabun/router: no `window` is available — createBrowserSource needs a "+"browser (or pass a window-like object explicitly).");return t}function le(t=De()){return{location:()=>t.location.pathname+t.location.search+t.location.hash,push:(n)=>t.history.pushState(null,"",n),replace:(n)=>t.history.replaceState(null,"",n),subscribe(n){return t.addEventListener("popstate",n),()=>t.removeEventListener("popstate",n)}}}function ce(t=De()){return{location:()=>{let n=t.location.hash,o=n.startsWith("#")?n.slice(1):n;return o===""?"/":o},push:(n)=>{t.location.hash=n},replace:(n)=>t.history.replaceState(null,"","#"+n),subscribe(n){return t.addEventListener("hashchange",n),()=>t.removeEventListener("hashchange",n)}}}var _e=O(null),ue=O(null),Fe=O(null),Je=Object.freeze({});function Ft(t){let e=M(_e);if(e===null)throw Error(`kanabun/router: ${t} must be used inside a <Router>.`);return e}function de(t){let e=t.source??le(),n=h(e.location());L(e.subscribe(()=>n.set(e.location())));let o=R(()=>Ne(n())),i=(s,a)=>{let l=Jt(s)?s:Oe(s,o().pathname);if(a?.replace)e.replace(l);else e.push(l);n.set(e.location())};return _e.Provider({value:{location:o,navigate:i},children:t.children})}function pe(){return M(ue)??(()=>Je)}function B(t){let{location:e}=Ft("<Route>"),n=M(ue),i=M(Fe)??(()=>e().pathname),s=R(()=>Ie(t.path,i())),a=R(()=>s()!==null),l=R(()=>{let x=s()?.params??Je;return n===null?x:{...n(),...x}}),c=()=>s()?.rest??"/",f=()=>ue.Provider({value:l,children:()=>Fe.Provider({value:c,children:()=>{if(t.component!==void 0)return t.component({params:l});if(typeof t.children==="function")return t.children(l);return t.children}})}),A=ze(),d=()=>{if(a())return A(f);return A(null),t.fallback??null};return d.$matched=a,d.$content=f,d}function ze(){let t=null;return L(()=>t?.()),(e)=>{if(t!==null)t(),t=null;if(e===null)return null;let n;return t=H((o)=>(n=e(),o)),n}}function _t(t){return typeof t==="function"&&"$matched"in t}function Xe(t,e){if(Array.isArray(t))for(let n of t)Xe(n,e);else if(_t(t))e.push(t)}function fe(t){let e=[];Xe(t.children,e);let n=ze();return()=>{for(let o of e)if(o.$matched())return n(o.$content);return n(null),t.fallback??null}}function Jt(t){return/^[a-z][a-z0-9+.-]*:/i.test(t)||t.startsWith("//")}var me=(new URLSearchParams(location.search).get("api")??"https://jev-mystery-api-329294726644.asia-northeast1.run.app").replace(/\/+$/,"");async function K(t,e){let n=await fetch(me+t,{method:e===void 0?"GET":"POST",headers:e===void 0?void 0:{"Content-Type":"application/json"},body:e===void 0?void 0:JSON.stringify(e)}),o=await n.json().catch(()=>({}));if(!n.ok)throw Error(o.message??`${n.status}`);return o}var Ve=()=>K("/api/cases"),$e=(t)=>K("/api/new",{case:t}),je=(t,e)=>K("/api/act",{state:t,input:e}),qe=(t,e)=>K("/api/accuse",{state:t,answer:e});var Ke=b`
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
`,We=b`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,E=b`
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
`,Ue=b`
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
`,Ge=b`
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--bg);
  display: grid;
  place-items: center;
  font-size: 19px;
`,Ye=b`
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
`,X=b`
  color: var(--muted);
  font-size: 13px;
`,Qe=b`
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
`,Ze=b`
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
`,et=b`
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;

  p {
    margin: 0 0 10px;
    font-size: 14px;
  }
`,tt=b`
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
`,W=b`
  color: var(--muted);
  font-size: 13px;
  font-family: var(--ui);
  font-style: italic;
`;function r(t,e,n,o,i,s){return ae(t,e,n)}function nt(){let[t]=z(()=>Ve());return r("div",{children:[r("div",{class:"titlebar",children:r("div",{children:[r("h1",{children:"事件簿"},void 0,!1,void 0,this),r("p",{class:"byline",children:"選択肢は表示されません。やりたいことを文章で書いてください。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.loading(),children:r("p",{class:W,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>t.error()!==void 0,children:r("div",{class:E,children:[r("p",{children:"事件の一覧を読み込めませんでした。"},void 0,!1,void 0,this),r("p",{class:X,children:()=>String(t.error())},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:tt,children:r(P,{each:()=>t()?.cases??[],children:(e)=>r("a",{href:`#${e.id}`,children:[r("p",{class:"title",children:e.title},void 0,!1,void 0,this),r(g,{when:()=>e.byline!==void 0,children:r("p",{class:"byline",children:e.byline},void 0,!1,void 0,this)},void 0,!1,void 0,this),r("p",{class:"hash",children:`#${e.id}`},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function rt(t){return r("div",{class:Ge,children:t.glyph||"？"},void 0,!1,void 0,this)}function ot(t){return r("div",{class:E,children:[r("h2",{children:"いま いる ところ"},void 0,!1,void 0,this),r("div",{class:Ue,children:[r("p",{class:"name",children:()=>t.view().scene.name},void 0,!1,void 0,this),()=>t.view().scene.description.map((e)=>r("p",{class:"desc",children:e},void 0,!1,void 0,this)),r("div",{class:"people",children:r(P,{each:()=>t.view().people??[],fallback:r("p",{class:X,children:"ここには誰もいない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"person",children:[r(rt,{glyph:e.avatar},void 0,!1,void 0,this),r("div",{children:[r("div",{class:"who",children:e.name},void 0,!1,void 0,this),r("div",{class:"role",children:e.role},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function it(t){return r("div",{class:E,children:[r("h2",{children:"手 の 中 の もの"},void 0,!1,void 0,this),r("div",{class:Ye,children:r(P,{each:()=>t.view().evidence??[],fallback:r("p",{class:X,children:"まだ何も持っていない。"},void 0,!1,void 0,this),children:(e)=>r("div",{class:"item",children:[r("div",{class:"name",children:e.name},void 0,!1,void 0,this),r("div",{class:"desc",children:e.description},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function st(t){let e=t.entry;if(e.kind==="narration")return r("div",{class:"entry",children:e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this))},void 0,!1,void 0,this);if(e.kind==="answer")return r("div",{class:"entry said",children:r("p",{class:"typed",children:e.text},void 0,!1,void 0,this)},void 0,!1,void 0,this);if(e.kind==="ending")return r(zt,{verdict:e.verdict},void 0,!1,void 0,this);return r("div",{class:e.matched?"entry said":"entry said miss",children:[r("p",{class:"typed",children:"> "+e.input},void 0,!1,void 0,this),e.speaker?r("div",{class:"speaker",children:[r(rt,{glyph:e.speaker.avatar},void 0,!1,void 0,this),r("div",{class:"who",children:e.speaker.name},void 0,!1,void 0,this)]},void 0,!0,void 0,this):null,e.did?r("p",{class:"did",children:e.did},void 0,!1,void 0,this):null,e.lines.map((n)=>r("p",{children:n},void 0,!1,void 0,this)),e.gained.map((n)=>r("div",{class:"found",children:"見つけた: "+n.name},void 0,!1,void 0,this)),e.moved?r("div",{class:"moved",children:"— "+e.moved+" —"},void 0,!1,void 0,this):null]},void 0,!0,void 0,this)}function zt(t){let e=t.verdict,n=e.correct?`犯人を言い当てた（${e.named_name}）`:e.named_name?`${e.named_name}を指した`:"犯人を名指ししなかった",o=(s,a)=>[r("span",{class:s?"mark":"mark no",children:s?"○":"×"},void 0,!1,void 0,this),r("span",{children:a},void 0,!1,void 0,this)],i=`${Math.round(100*e.coherence/(e.coherence_top||1))}%`;return r("div",{class:"entry said",children:[r("h3",{children:e.title},void 0,!1,void 0,this),e.text.map((s)=>r("p",{children:s},void 0,!1,void 0,this)),r("div",{class:"score",children:[o(e.correct,n),e.points.map((s)=>o(s.hit,s.label))]},void 0,!0,void 0,this),r("div",{class:"coherence",children:[`筋の通り ${e.coherence.toFixed(1)} / ${e.coherence_top}`,r("div",{class:"track",children:r("div",{style:{width:i}},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>e.coherence_legend!==void 0,children:e.coherence_legend},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function at(){let t=pe(),[e,{refetch:n}]=z(()=>t().case??!1,(u)=>$e(u)),o=h(""),i=h(null),s=h([]),a=h("playing"),l=h(""),c=h(!1),f=h(""),A=null,d=null;S(()=>{let u=e();if(u===void 0)return;o.set(u.state),i.set(u.view),s.set([{kind:"narration",lines:u.opening},{kind:"narration",lines:u.incident}]),a.set("playing"),l.set(""),f.set(""),document.title=u.title});let x=(u)=>{s.update((p)=>[...p,u]),requestAnimationFrame(()=>A?.lastElementChild?.scrollIntoView({block:"end"}))},T=(u)=>f.set(u instanceof Error?u.message:String(u)),y=async(u)=>{if(c.peek()||u==="")return;c.set(!0),f.set("");try{let p=await je(o.peek(),u);if(o.set(p.state),i.set(p.view),x({kind:"turn",input:u,matched:p.matched,did:p.did,speaker:p.speaker,lines:p.text,gained:p.gained??[],moved:p.moved_to===void 0?void 0:p.view.scene.name}),p.finale===!0)a.set("accusing")}catch(p){T(p)}finally{c.set(!1),d?.focus()}},D=async(u)=>{if(c.peek()||u==="")return;c.set(!0),f.set(""),x({kind:"answer",text:u});try{let p=await qe(o.peek(),u);o.set(p.state),x({kind:"ending",verdict:p}),a.set("closed")}catch(p){T(p)}finally{c.set(!1)}},k=()=>i(),he=()=>r("div",{children:[r(g,{when:()=>k().finale_open&&a()==="playing",children:r("div",{class:et,children:[r("p",{children:"手の中のもので、そろそろ話がつながりそうだ。"},void 0,!1,void 0,this),r("button",{type:"button",disabled:c,onClick:()=>y(k().finale_label??"全員を集める"),children:()=>k().finale_label??"全員を集める"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r("div",{class:We,children:[r("div",{children:[r(ot,{view:k},void 0,!1,void 0,this),r(it,{view:k},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("div",{children:[r("div",{class:`${E} ${Qe}`,ref:(u)=>A=u,children:[r(P,{each:s,children:(u)=>r(st,{entry:u},void 0,!1,void 0,this)},void 0,!1,void 0,this),r(g,{when:c,children:r("p",{class:W,children:"……"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>a()!=="closed",children:()=>r(v,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)]},void 0,!0,void 0,this),v=()=>r("div",{class:`${E} ${Ze}`,children:[r(g,{when:()=>a()==="playing",fallback:()=>r(G,{},void 0,!1,void 0,this),children:r("div",{children:[r("form",{onSubmit:(u)=>{u.preventDefault();let p=l.peek().trim();l.set(""),y(p)},children:[r("input",{type:"text",autocomplete:"off",placeholder:"何をしますか",value:l,disabled:c,ref:(u)=>{d=u,d.focus()},onInput:(u)=>l.set(u.target.value)},void 0,!1,void 0,this),r("button",{type:"submit",disabled:c,children:"する"},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"思いついたことを書いてください。できることの一覧はありません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>f()!=="",children:r("p",{class:"error",children:f},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),G=()=>{let u=h("");return r("div",{children:[r("form",{class:"stacked",onSubmit:(p)=>{p.preventDefault(),D(u.peek().trim())},children:[r("textarea",{placeholder:"誰が、どうやって、なぜ。",value:u,disabled:c,ref:(p)=>p.focus(),onInput:(p)=>u.set(p.target.value)},void 0,!1,void 0,this),r("p",{children:r("button",{type:"submit",disabled:c,children:"推理を述べる"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("p",{class:"hint",children:"文章で書いてください。名指しだけでも、筋道まで書いても構いません。"},void 0,!1,void 0,this)]},void 0,!0,void 0,this)};return r("div",{children:[r("div",{class:"titlebar",children:[r("div",{children:[r("h1",{children:()=>e()?.title??"……"},void 0,!1,void 0,this),r("p",{class:"byline",children:()=>e()?.byline??""},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e()!==void 0,children:r("button",{type:"button",class:"secondary",disabled:c,onClick:()=>n(),children:"最初から"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r(g,{when:()=>e.error()!==void 0,children:r("div",{class:E,children:[r("p",{children:"この事件は見つかりませんでした。"},void 0,!1,void 0,this),r("p",{children:r("a",{href:"#",children:"事件の一覧へ"},void 0,!1,void 0,this)},void 0,!1,void 0,this)]},void 0,!0,void 0,this)},void 0,!1,void 0,this),r(g,{when:()=>i()!==null,children:he},void 0,!1,void 0,this)]},void 0,!0,void 0,this)}function Xt(){return r("main",{class:Ke,children:[r(fe,{children:[r(B,{path:"/",component:nt},void 0,!1,void 0,this),r(B,{path:"/:case",component:at},void 0,!1,void 0,this)]},void 0,!0,void 0,this),r("footer",{children:[r("a",{href:"#",children:"事件簿"},void 0,!1,void 0,this)," ・ ",r("span",{children:me},void 0,!1,void 0,this)," ・ ソースは ",r("a",{href:"https://github.com/ocknamo/sandbox/tree/main/jev-mystery",children:"jev-mystery"},void 0,!1,void 0,this),"。入力の解釈と推理の採点に ",r("a",{href:"https://docs.typesafe.ai/introduction",children:"Jev"},void 0,!1,void 0,this)," を使っています。"]},void 0,!0,void 0,this)]},void 0,!0,void 0,this)}function Vt(){return r(de,{source:ce(),children:()=>r(Xt,{},void 0,!1,void 0,this)},void 0,!1,void 0,this)}var lt=document.getElementById("app");if(lt)ie(()=>r(Vt,{},void 0,!1,void 0,this),lt);

//# debugId=508DFB5EB4E751C564756E2164756E21
//# sourceMappingURL=chunk-dy78xes5.js.map
