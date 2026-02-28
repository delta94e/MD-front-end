# React SSR API — Deep Dive

> **Study Guide cho Senior React/Next.js Developer**
> Tai lieu nay phan tich CHI TIET cac React SSR API:
> - **Server-side**: `react-dom/server` (4 APIs)
> - **Client-side**: `react-dom` (hydrate)
> - **Limitations**: Lifecycle, Error Boundary, Portal

---

## §1. Tong Quan — React SSR API Map

```
================================================================
  REACT SSR = 2 PHAN: SERVER + CLIENT!
================================================================


  TOAN CANH SSR API:
  +------------------------------------------------------------+
  |                                                            |
  |  react-dom/server (SERVER SIDE):                           |
  |  +------------------------------------------------------+  |
  |  |                                                       |  |
  |  |  Cross-environment (Node.js + Browser):               |  |
  |  |  +--------------------------------------------------+ |  |
  |  |  | (1) renderToString(element)                       | |  |
  |  |  |     -> HTML string + data-reactroot               | |  |
  |  |  |                                                   | |  |
  |  |  | (2) renderToStaticMarkup(element)                 | |  |
  |  |  |     -> Clean HTML (khong extra attributes!)       | |  |
  |  |  +--------------------------------------------------+ |  |
  |  |                                                       |  |
  |  |  Node.js only (Stream APIs):                          |  |
  |  |  +--------------------------------------------------+ |  |
  |  |  | (3) renderToNodeStream(element)                   | |  |
  |  |  |     -> Readable Stream (tuong ung renderToString) | |  |
  |  |  |                                                   | |  |
  |  |  | (4) renderToStaticNodeStream(element)             | |  |
  |  |  |     -> Readable Stream (tuong ung StaticMarkup)   | |  |
  |  |  +--------------------------------------------------+ |  |
  |  |                                                       |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  react-dom (CLIENT SIDE):                                  |
  |  +------------------------------------------------------+  |
  |  |                                                       |  |
  |  |  (5) ReactDOM.hydrate(element, container[, callback])|  |
  |  |      -> Reuse server HTML + attach events!           |  |
  |  |                                                       |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  CHON API NAO?
  +------------------------------------------------------------+
  |                                                            |
  |  +-----------------------+------+--------+-------+------+  |
  |  | Tinh huong            | rTS  | rTSM   | rTNS  | rTSNS|  |
  |  +-----------------------+------+--------+-------+------+  |
  |  | SSR + hydrate         | YES  |        | YES   |      |  |
  |  | Static pages (email)  |      | YES    |       | YES  |  |
  |  | Need streaming        |      |        | YES   | YES  |  |
  |  | Browser environment   | YES  | YES    |       |      |  |
  |  +-----------------------+------+--------+-------+------+  |
  |                                                            |
  |  rTS  = renderToString                                     |
  |  rTSM = renderToStaticMarkup                               |
  |  rTNS = renderToNodeStream                                 |
  |  rTSNS= renderToStaticNodeStream                           |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §2. renderToString — API Co Ban Nhat

```
================================================================
  renderToString = COMPONENT --> HTML STRING!
================================================================


  FUNCTION SIGNATURE:
  +------------------------------------------------------------+
  |                                                            |
  |  ReactDOMServer.renderToString(element)                    |
  |                                                            |
  |  INPUT:  ReactElement (component)                          |
  |  OUTPUT: HTML string (voi data-reactroot!)                 |
  |                                                            |
  +------------------------------------------------------------+
```

```typescript
// INPUT: React Component
class MyComponent extends React.Component {
  state = {
    title: 'Welcome to React SSR!',
  }

  render() {
    return (
      <div>
        <h1 className="here">
          {this.state.title} Hello There!
        </h1>
      </div>
    );
  }
}

// RENDER:
const html = ReactDOMServer.renderToString(<MyComponent />);

// OUTPUT:
// '<div data-reactroot="">
//    <h1 class="here">
//      Welcome to React SSR!<!-- --> Hello There!
//    </h1>
//  </div>'
```

```
  PHAN TICH OUTPUT:
  +------------------------------------------------------------+
  |                                                            |
  |  (1) data-reactroot=""                                     |
  |  -> Danh dau ROOT element!                                 |
  |  -> Chi co tren element NGOAI CUNG!                        |
  |  -> Dung cho hydrate() de nhan dien SSR output!            |
  |                                                            |
  |  (2) className --> class                                   |
  |  -> React prop duoc MAP sang HTML attribute!               |
  |  -> className (JSX) = class (HTML)                         |
  |                                                            |
  |  (3) <!-- --> (comment node)                               |
  |  -> SEPARATES adjacent text nodes!                         |
  |  -> "Welcome to React SSR!" va " Hello There!"            |
  |     la 2 text nodes RIENG BIET!                            |
  |  -> Comment node giup hydrate() NHAN DIEN tung node!       |
  |                                                            |
  |  (4) onClick --> BI BO QUA!                                |
  |  -> Server KHONG render event handlers!                    |
  |  -> hydrate() se attach events tren client!                |
  |                                                            |
  +------------------------------------------------------------+


  WORKFLOW:
  +------------------------------------------------------------+
  |                                                            |
  |  Server:                                                   |
  |  renderToString(<App />) --> HTML string                   |
  |       |                                                    |
  |       v                                                    |
  |  res.send(html) --> gui HTML cho client                    |
  |       |                                                    |
  |       v                                                    |
  |  Client:                                                   |
  |  Browser hien HTML NGAY (co content!)                      |
  |       |                                                    |
  |       v                                                    |
  |  JS bundle load xong                                       |
  |       |                                                    |
  |       v                                                    |
  |  ReactDOM.hydrate(<App />, container)                      |
  |  -> Reuse DOM + attach events = INTERACTIVE!               |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §3. renderToStaticMarkup — HTML Sach

```
================================================================
  renderToStaticMarkup = HTML SACH, KHONG REACT ATTRIBUTES!
================================================================


  FUNCTION SIGNATURE:
  +------------------------------------------------------------+
  |                                                            |
  |  ReactDOMServer.renderToStaticMarkup(element)              |
  |                                                            |
  |  INPUT:  ReactElement (component)                          |
  |  OUTPUT: Clean HTML string (KHONG data-reactroot!)         |
  |                                                            |
  +------------------------------------------------------------+


  SO SANH renderToString vs renderToStaticMarkup:
  +------------------------------------------------------------+
  |                                                            |
  |  // renderToString:                                        |
  |  '<div data-reactroot="">                                  |
  |     <h1 class="here">                                      |
  |       Welcome to React SSR!<!-- --> Hello There!           |
  |     </h1>                                                  |
  |   </div>'                                                  |
  |                                                            |
  |  // renderToStaticMarkup:                                  |
  |  '<div>                                                    |
  |     <h1 class="here">                                      |
  |       Welcome to React SSR! Hello There!                   |
  |     </h1>                                                  |
  |   </div>'                                                  |
  |                                                            |
  |                                                            |
  |  SU KHAC BIET:                                             |
  |  +---------------------+---------------+-----------+       |
  |  |                     | renderToString | Static    |       |
  |  +---------------------+---------------+-----------+       |
  |  | data-reactroot=""   | CO             | KHONG     |       |
  |  | <!-- --> separators | CO             | KHONG     |       |
  |  | Hydrate compatible  | CO             | KHONG!    |       |
  |  | Text node merge     | KHONG          | CO        |       |
  |  | Size                | Lon hon chut   | Nho hon   |       |
  |  +---------------------+---------------+-----------+       |
  |                                                            |
  +------------------------------------------------------------+
```

```
  DUNG KHI NAO?
  +------------------------------------------------------------+
  |                                                            |
  |  renderToStaticMarkup PHU HOP cho:                         |
  |  [+] Static page generator (blog, docs)                    |
  |  [+] Email templates (khong can JS!)                       |
  |  [+] RSS feeds                                             |
  |  [+] Bat ky noi dung KHONG CAN INTERACTIVE!                |
  |                                                            |
  |  KHONG PHU HOP cho:                                        |
  |  [-] SSR + hydrate (khong co data-reactroot!)              |
  |  [-] Interactive pages (khong attach duoc events!)         |
  |  [-] SPA with SSR                                          |
  |                                                            |
  |  "If you plan to use React on the client to make           |
  |   the markup interactive, do not use this method."         |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §4. React 15 vs 16 — Su Thay Doi Lon Ve SSR

```
================================================================
  REACT 15 -> 16: THAY DOI CACH REUSE HTML NODES!
================================================================


  REACT 15: CHECKSUM-BASED REUSE
  +------------------------------------------------------------+
  |                                                            |
  |  // React 15 renderToString output:                        |
  |  <div data-reactroot=""                                    |
  |       data-reactid="1"                                     |
  |       data-react-checksum="122239856">                     |
  |    <!-- react-text: 2 -->                                  |
  |    This is some                                            |
  |    <!-- /react-text -->                                    |
  |    <span data-reactid="3">server-generated</span>         |
  |    <!-- react-text: 4-->                                   |
  |     ...                                                    |
  |    <!-- /react-text -->                                    |
  |    <span data-reactid="5">HTML.</span>                     |
  |  </div>                                                    |
  |                                                            |
  |  VAN DE:                                                   |
  |  -> data-reactid TREN MOI NODE! (cuc ky nhieu!)           |
  |  -> data-react-checksum cho TOAN BO tree!                  |
  |  -> <!-- react-text --> wrappers cho text nodes!           |
  |  -> SIZE LON!                                              |
  |  -> Neu checksum KHONG KHOP -> BO HET, render lai!        |
  |  -> ALL-OR-NOTHING approach!                               |
  |                                                            |
  +------------------------------------------------------------+


  REACT 16: SINGLE-NODE VALIDATION
  +------------------------------------------------------------+
  |                                                            |
  |  // React 16 renderToString output:                        |
  |  <div data-reactroot="">                                   |
  |    This is some                                            |
  |    <span>server-generated</span>                           |
  |     ...                                                    |
  |    <span>HTML.</span>                                      |
  |  </div>                                                    |
  |                                                            |
  |  SU CAI TIEN:                                              |
  |  [+] KHONG con data-reactid!                               |
  |  [+] KHONG con data-react-checksum!                        |
  |  [+] KHONG con <!-- react-text --> wrappers!               |
  |  [+] Chi con data-reactroot="" tren ROOT!                  |
  |  [+] Size NHO HON NHIEU!                                   |
  |  [+] Single-node validation (khong all-or-nothing!)        |
  |                                                            |
  +------------------------------------------------------------+


  SO SANH SIZE:
  +------------------------------------------------------------+
  |                                                            |
  |  REACT 15:                                                 |
  |  -> renderToString: RAT NHIEU extra attributes             |
  |  -> renderToStaticMarkup: clean HTML                       |
  |  -> SU KHAC BIET VE SIZE: LON!                             |
  |                                                            |
  |  REACT 16:                                                 |
  |  -> renderToString: chi them data-reactroot + <!-- -->     |
  |  -> renderToStaticMarkup: clean HTML                       |
  |  -> SU KHAC BIET VE SIZE: NHO (khong dang ke!)            |
  |                                                            |
  |  => React 16 lam cho su khac biet giua 2 API              |
  |     tro nen KHONG CON QUAN TRONG ve mat size!              |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §5. renderToNodeStream — Streaming API

```
================================================================
  renderToNodeStream = renderToString + STREAMING!
================================================================


  FUNCTION SIGNATURE:
  +------------------------------------------------------------+
  |                                                            |
  |  ReactDOMServer.renderToNodeStream(element)                |
  |                                                            |
  |  INPUT:  ReactElement (component)                          |
  |  OUTPUT: Node.js Readable Stream (UTF-8!)                  |
  |                                                            |
  |  CHU Y:                                                    |
  |  -> CHI chay tren Node.js! (dung Stream API!)              |
  |  -> KHONG chay tren browser!                               |
  |  -> Output GIONG renderToString (co data-reactroot!)       |
  |  -> Nhung gui TUNG PHAN thay vi MOT LAN!                   |
  |                                                            |
  +------------------------------------------------------------+
```

```typescript
// Server setup voi Express:
import { renderToNodeStream } from 'react-dom/server';
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  // Gui PHAN DAU cua HTML
  res.write(`
    <!DOCTYPE html>
    <html>
    <head><title>SSR</title></head>
    <body><div id="root">
  `);

  // Stream React component
  const stream = renderToNodeStream(<App />);

  // Pipe stream vao response!
  stream.pipe(res, { end: false });

  stream.on('end', () => {
    // Gui PHAN CUOI cua HTML
    res.write(`
      </div>
      <script src="/bundle.js"></script>
      </body></html>
    `);
    res.end();
  });
});
```

```
  SO SANH renderToString vs renderToNodeStream:
  +------------------------------------------------------------+
  |                                                            |
  |  +------------------------+---------------------------+    |
  |  | renderToString         | renderToNodeStream        |    |
  |  +------------------------+---------------------------+    |
  |  | Tra ve: string         | Tra ve: Readable Stream   |    |
  |  | Doc HET roi gui        | Gui TUNG PHAN             |    |
  |  | TTFB: CAO              | TTFB: THAP!               |    |
  |  | Memory: giu toan bo    | Memory: tung chunk        |    |
  |  | Node.js + Browser      | Node.js ONLY!             |    |
  |  | Don gian               | Phuc tap hon              |    |
  |  | Hydrate: YES           | Hydrate: YES              |    |
  |  | Output: GIONG NHAU!    | Output: GIONG NHAU!       |    |
  |  +------------------------+---------------------------+    |
  |                                                            |
  |                                                            |
  |  TAI SAO STREAMING TOT HON?                                |
  |  +------------------------------------------------------+  |
  |  |                                                       |  |
  |  |  renderToString:                                      |  |
  |  |  [===== render XONG =====][ gui ]                     |  |
  |  |  |<--- doi render ------>|         TTFB cao!          |  |
  |  |                                                       |  |
  |  |  renderToNodeStream:                                  |  |
  |  |  [=gui=][=gui=][=gui=][=gui=]                         |  |
  |  |  |<>| TTFB THAP!  (gui ngay chunk dau tien!)          |  |
  |  |                                                       |  |
  |  |  -> User thay content SOM HON!                        |  |
  |  |  -> Server dung IT MEMORY hon! (khong buffer het!)    |  |
  |  |  -> SEO: search engines nhan content SOM HON!         |  |
  |  |                                                       |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §6. renderToStaticNodeStream — Streaming + Static

```
================================================================
  renderToStaticNodeStream = renderToStaticMarkup + STREAMING!
================================================================


  FUNCTION SIGNATURE:
  +------------------------------------------------------------+
  |                                                            |
  |  ReactDOMServer.renderToStaticNodeStream(element)          |
  |                                                            |
  |  INPUT:  ReactElement (component)                          |
  |  OUTPUT: Node.js Readable Stream (UTF-8!)                  |
  |                                                            |
  |  = renderToStaticMarkup + streaming!                       |
  |  -> Clean HTML (khong data-reactroot!)                     |
  |  -> Gui tung phan (stream!)                                |
  |  -> Node.js only!                                          |
  |  -> KHONG the hydrate!                                     |
  |                                                            |
  +------------------------------------------------------------+


  TOM TAT 4 SERVER APIs:
  +------------------------------------------------------------+
  |                                                            |
  |  +-------------------+---------+--------+---------+        |
  |  | API               | Output  | Stream | Hydrate |        |
  |  +-------------------+---------+--------+---------+        |
  |  | renderToString    | string  | NO     | YES     |        |
  |  | renderToStatic    | string  | NO     | NO      |        |
  |  |   Markup          |         |        |         |        |
  |  | renderToNode      | stream  | YES    | YES     |        |
  |  |   Stream          |         |        |         |        |
  |  | renderToStatic    | stream  | YES    | NO      |        |
  |  |   NodeStream      |         |        |         |        |
  |  +-------------------+---------+--------+---------+        |
  |                                                            |
  |  PATTERN:                                                  |
  |  -> "Static" = clean HTML, KHONG hydrate duoc             |
  |  -> "Stream" = Node.js Readable Stream                     |
  |  -> KHONG co "Static" = co extra attributes, hydrate duoc |
  |  -> UTF-8 encoding mac dinh cho tat ca Stream APIs!        |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §7. ReactDOM.hydrate() — Lam Song Trang

```
================================================================
  hydrate() = REUSE SERVER HTML + ATTACH EVENTS!
================================================================


  FUNCTION SIGNATURE:
  +------------------------------------------------------------+
  |                                                            |
  |  ReactDOM.hydrate(element, container[, callback])          |
  |  ReactDOM.render(element, container[, callback])           |
  |                                                            |
  |  -> CUNG function signature!                               |
  |  -> KHAC nhau o behavior!                                  |
  |                                                            |
  +------------------------------------------------------------+


  hydrate() vs render():
  +------------------------------------------------------------+
  |                                                            |
  |  +------------------------+------------------------------+ |
  |  | render()               | hydrate()                    | |
  |  +------------------------+------------------------------+ |
  |  | Xoa HET innerHTML      | GIU NGUYEN server HTML!      | |
  |  | Tao DOM nodes MOI      | REUSE DOM nodes da co!       | |
  |  | Set TAT CA attributes  | Chi update neu KHAC          | |
  |  | Full render tu scratch | CHI attach events!           | |
  |  | Dung cho client-only   | Dung cho SSR!                | |
  |  | Trang trang -> content | Content CO SAN -> interactive| |
  |  +------------------------+------------------------------+ |
  |                                                            |
  |  "React will attempt to attach event listeners             |
  |   to the existing markup."                                 |
  |                                                            |
  +------------------------------------------------------------+
```

```
  HYDRATION MISMATCH — XU LY NHU THE NAO?
  +------------------------------------------------------------+
  |                                                            |
  |  Khi server HTML KHAC voi client render:                   |
  |                                                            |
  |  (1) TEXT NODES:                                           |
  |  -> Auto-correct! (sua thanh client value!)                |
  |  -> VD: server "Hello" -> client "Hi" -> DOM = "Hi"        |
  |                                                            |
  |  (2) MOI THU KHAC (attributes, structure):                 |
  |  -> CHI WARNING trong development mode!                    |
  |  -> KHONG tu sua! GIU SERVER VALUE!                        |
  |  -> "There are no guarantees that attribute                |
  |      differences will be patched up"                       |
  |                                                            |
  |  TAI SAO KHONG TU SUA?                                     |
  |  -> Performance! Validate toan bo markup = TON KEM!        |
  |  -> "Validating all markup would be                        |
  |      prohibitively expensive"                              |
  |  -> Mismatch la HIEM -> khong dang optimize!               |
  |                                                            |
  |                                                            |
  |  QUAN TRONG:                                               |
  |  -> Warnings PHAI duoc coi la ERRORS!                      |
  |  -> Fix TAT CA HydrationWarning trong dev mode!            |
  |  -> Mismatch = BUG trong code!                             |
  |                                                            |
  +------------------------------------------------------------+


  XU LY INTENTIONAL MISMATCH:
  +------------------------------------------------------------+
  |                                                            |
  |  Truong hop HOP LY khi server/client KHAC NHAU:           |
  |  -> Timestamps (server time != client time!)               |
  |  -> User-specific content (auth state...)                  |
  |                                                            |
  |  CACH 1: suppressHydrationWarning                          |
  |  +------------------------------------------------------+  |
  |  |  <div suppressHydrationWarning={true}>                |  |
  |  |    {new Date().toLocaleString()}                      |  |
  |  |  </div>                                               |  |
  |  |                                                       |  |
  |  |  -> TAT WARNING! (nhung khong sua loi!)               |  |
  |  |  -> Server value VAN DUOC GIU!                        |  |
  |  |  -> Chi dung cho known differences!                   |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  CACH 2: Two-pass rendering (RECOMMENDED!)                 |
  |  +------------------------------------------------------+  |
  |  |  class MyComponent extends React.Component {          |  |
  |  |    state = { isClient: false };                       |  |
  |  |                                                       |  |
  |  |    render() {                                         |  |
  |  |      return this.state.isClient                       |  |
  |  |        ? 'Render...client content'                    |  |
  |  |        : 'Render...server content';                   |  |
  |  |    }                                                  |  |
  |  |                                                       |  |
  |  |    componentDidMount() {                              |  |
  |  |      // componentDidMount CHI chay tren CLIENT!       |  |
  |  |      this.setState({ isClient: true });               |  |
  |  |      // -> Trigger re-render voi client content!      |  |
  |  |    }                                                  |  |
  |  |  }                                                    |  |
  |  |                                                       |  |
  |  |  -> INITIAL render: GIONG server! (khong mismatch!)   |  |
  |  |  -> ComponentDidMount: update thanh client content!   |  |
  |  |  -> Slight performance cost (2 renders!)              |  |
  |  |  -> Nhung DAM BAO khong co mismatch warning!          |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §8. SSR Lifecycle Limitations — Lifecycle Bi Gioi Han

```
================================================================
  SERVER CHI CHAY 3 LIFECYCLE FUNCTIONS!
================================================================


  LIFECYCLE TREN SERVER:
  +------------------------------------------------------------+
  |                                                            |
  |  CHI 3 LIFECYCLE DUOC CHAY:                                |
  |  +------------------------------------------------------+  |
  |  |  (1) constructor()                                    |  |
  |  |  (2) getDerivedStateFromProps()  [static]             |  |
  |  |  (3) render()                                         |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  KHONG DUOC CHAY tren server:                              |
  |  +------------------------------------------------------+  |
  |  |  [-] componentDidMount      (client only!)            |  |
  |  |  [-] componentDidUpdate     (client only!)            |  |
  |  |  [-] componentWillUnmount   (client only!)            |  |
  |  |  [-] getSnapshotBeforeUpdate(client only!)            |  |
  |  |  [-] shouldComponentUpdate  (client only!)            |  |
  |  |  [-] getDerivedStateFromError   (KHONG HO TRO!)       |  |
  |  |  [-] componentDidCatch          (KHONG HO TRO!)       |  |
  |  |  [-] useEffect              (client only!)            |  |
  |  |  [-] useLayoutEffect        (client only!)            |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  DEPRECATED LIFECYCLE + MUTUAL EXCLUSION:
  +------------------------------------------------------------+
  |                                                            |
  |  componentWillMount: DEPRECATED! (tu React 16.3)          |
  |  UNSAFE_componentWillMount: DEPRECATED!                    |
  |                                                            |
  |  MUTUAL EXCLUSION RULE:                                    |
  |  +------------------------------------------------------+  |
  |  |                                                       |  |
  |  |  NEU component co BAT KY lifecycle MOI nao:           |  |
  |  |  -> getDerivedStateFromProps                          |  |
  |  |  -> getSnapshotBeforeUpdate                           |  |
  |  |                                                       |  |
  |  |  THI lifecycle CU se KHONG duoc goi:                  |  |
  |  |  -> componentWillMount                                |  |
  |  |  -> UNSAFE_componentWillMount                         |  |
  |  |                                                       |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  -> Day la "mutual exclusion" mechanism!                   |
  |  -> Ngan chan viec dung CA CU LAN MOI cung luc!            |
  |  -> Lifecycle MOI co PRIORITY cao hon!                     |
  |                                                            |
  +------------------------------------------------------------+


  ASCII DIAGRAM — SERVER vs CLIENT LIFECYCLE:
  +------------------------------------------------------------+
  |                                                            |
  |  SERVER:                                                   |
  |  constructor                                               |
  |       |                                                    |
  |       v                                                    |
  |  getDerivedStateFromProps                                  |
  |       |                                                    |
  |       v                                                    |
  |  render()                                                  |
  |       |                                                    |
  |       X  DUNG O DAY! (server xong!)                        |
  |                                                            |
  |                                                            |
  |  CLIENT (hydrate):                                         |
  |  constructor                                               |
  |       |                                                    |
  |       v                                                    |
  |  getDerivedStateFromProps                                  |
  |       |                                                    |
  |       v                                                    |
  |  render() --> reconcile voi server HTML!                   |
  |       |                                                    |
  |       v                                                    |
  |  componentDidMount   <-- MOI! (server khong co!)           |
  |       |                                                    |
  |       v                                                    |
  |  useEffect()         <-- MOI! (server khong co!)           |
  |       |                                                    |
  |       v                                                    |
  |  [...updates, events, interactions...]                     |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §9. Error Boundary & Portal — KHONG Ho Tro SSR

```
================================================================
  STREAMING KHONG THE "QUAY LAI" -> KHONG HO TRO 2 FEATURE!
================================================================


  TAI SAO KHONG HO TRO?
  +------------------------------------------------------------+
  |                                                            |
  |  "With streaming rendering it's impossible to              |
  |   'call back' markup that has already been sent"           |
  |                                                            |
  |  STREAMING = gui TUNG PHAN, KHONG THE SUA LAI!            |
  |                                                            |
  |  +------------------------------------------------------+  |
  |  |  Stream: [chunk1] --> [chunk2] --> [chunk3] -->        |  |
  |  |                                                       |  |
  |  |  Neu chunk1 da GUI roi, khong the:                    |  |
  |  |  -> Thay the chunk1 bang error UI!                    |  |
  |  |  -> Chen DOM node vao vi tri KHAC!                    |  |
  |  |  -> Sua doi HTML da gui!                              |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  De dam bao CONSISTENCY giua:                              |
  |  -> renderToString output = renderToNodeStream output      |
  |  -> 2 API phai cho CUNG KET QUA!                           |
  |  -> Nen ca 2 deu KHONG ho tro Error Boundary + Portal!    |
  |                                                            |
  +------------------------------------------------------------+


  ERROR BOUNDARY — KHONG HO TRO:
  +------------------------------------------------------------+
  |                                                            |
  |  Error Boundary can gi?                                    |
  |  -> Bat LOI runtime trong descendant components!           |
  |  -> Render FALLBACK UI thay the!                           |
  |                                                            |
  |  Tai sao KHONG DUOC tren SSR?                              |
  |  -> Neu error xay ra SAU KHI chunk da gui:                |
  |  -> KHONG THE thay the chunk da gui bang fallback UI!      |
  |  -> Streaming khong cho phep "quay lai"!                   |
  |                                                            |
  |  APIs KHONG hoat dong:                                     |
  |  -> getDerivedStateFromError: KHONG chay!                  |
  |  -> componentDidCatch: KHONG chay!                         |
  |                                                            |
  |  GIAI PHAP:                                                |
  |  -> Try/catch BAO QUANH renderToString!                    |
  |  -> Render error page TU DAU neu co loi!                   |
  |  -> Hoac dung streaming voi error handling middleware!     |
  |                                                            |
  +------------------------------------------------------------+


  PORTAL — KHONG HO TRO:
  +------------------------------------------------------------+
  |                                                            |
  |  Portal can gi?                                            |
  |  -> Render component vao BAT KY DOM node nao!              |
  |  -> VD: Modal render vao document.body                     |
  |  -> Giu nguyen event bubbling theo component tree!         |
  |                                                            |
  |  Tai sao KHONG DUOC tren SSR?                              |
  |  -> Can "nhay" den DOM node KHAC de render!                |
  |  -> Streaming KHONG THE insert HTML vao vi tri KHAC!       |
  |  -> Phai render TUYEN TINH (tren xuong duoi!)              |
  |                                                            |
  |  TUONG TU KHONG HO TRO:                                    |
  |  -> Dynamic <head> injection (<style>, <script>)           |
  |  -> Bat ky gi can "render backtracking"!                   |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §10. Best Practices — Thuc Hanh Tot Nhat

```
================================================================
  LAM DU AN SSR? NHO NHUNG DIEU NAY!
================================================================


  (1) CHON DUNG API:
  +------------------------------------------------------------+
  |  -> SSR + hydrate? -> renderToString / renderToNodeStream  |
  |  -> Static content? -> renderToStaticMarkup                |
  |  -> Large pages? -> renderToNodeStream (streaming!)         |
  |  -> Email templates? -> renderToStaticMarkup               |
  +------------------------------------------------------------+


  (2) FIX TAT CA HYDRATION WARNINGS:
  +------------------------------------------------------------+
  |  -> Warnings = BUGS! Khong duoc bo qua!                    |
  |  -> Server render va client render PHAI GIONG NHAU!        |
  |  -> Dung suppressHydrationWarning chi khi THAT SU can!    |
  |  -> Dung two-pass rendering cho intentional differences!  |
  +------------------------------------------------------------+


  (3) LIFECYCLE AWARENESS:
  +------------------------------------------------------------+
  |  -> KHONG dat side effects trong constructor!              |
  |  -> KHONG dat API calls trong componentWillMount!          |
  |  -> Dung componentDidMount cho client-only logic!          |
  |  -> Dung useEffect cho client-only side effects!           |
  |  -> NHO: server chi chay constructor + gDSFP + render!    |
  +------------------------------------------------------------+


  (4) ERROR HANDLING:
  +------------------------------------------------------------+
  |  -> Error Boundary KHONG hoat dong tren server!            |
  |  -> Wrap renderToString trong try/catch!                   |
  |  -> Co fallback page cho server errors!                    |
  |  -> Log errors tren server (monitoring!)                   |
  +------------------------------------------------------------+


  (5) PERFORMANCE:
  +------------------------------------------------------------+
  |  -> Dung streaming cho large pages (TTFB thap!)            |
  |  -> Component caching (renderToString result!)             |
  |  -> Avoid deep component trees (stack depth!)              |
  |  -> React 16+ SSR nhanh hon 15 (khong vDOM!)              |
  +------------------------------------------------------------+
```

---

## §11. Interview Q&A — Cau Hoi Phong Van

```
================================================================
  Q&A = HIEU SAU DE TRA LOI CHINH XAC!
================================================================


  Q1: Ke ten 4 ReactDOMServer APIs va su khac biet?
  +------------------------------------------------------------+
  |  -> renderToString: HTML string, hydrate-compatible!       |
  |  -> renderToStaticMarkup: clean HTML, KHONG hydrate!       |
  |  -> renderToNodeStream: Readable Stream, hydrate-compatible|
  |  -> renderToStaticNodeStream: Readable Stream, KHONG hydrate|
  |  -> "Static" = khong co react attributes, khong hydrate   |
  |  -> "Stream" = Node.js only, gui tung phan!               |
  +------------------------------------------------------------+


  Q2: renderToString vs renderToNodeStream, khi nao dung cai nao?
  +------------------------------------------------------------+
  |  -> renderToString: don gian, small pages, can browser env |
  |  -> renderToNodeStream: large pages, TTFB quan trong!     |
  |  -> Cung output! Chi khac cach GUI (mot lan vs tung phan) |
  |  -> Streaming tot hon cho UX (user thay content som hon!) |
  +------------------------------------------------------------+


  Q3: Tai sao Error Boundary khong hoat dong tren SSR?
  +------------------------------------------------------------+
  |  -> Streaming khong the "quay lai" content da gui!         |
  |  -> getDerivedStateFromError + componentDidCatch = NO!     |
  |  -> De dam bao consistency: String API = Stream API output |
  |  -> Giai phap: try/catch quanh renderToString!            |
  +------------------------------------------------------------+


  Q4: Hydration mismatch xu ly the nao?
  +------------------------------------------------------------+
  |  -> Text nodes: AUTO CORRECT thanh client value!           |
  |  -> Attributes: CHI WARNING, KHONG sua!                   |
  |  -> Ly do: performance (validate all = too expensive!)     |
  |  -> PHAI fix ALL warnings trong dev mode!                  |
  |  -> suppressHydrationWarning cho known differences!        |
  |  -> Two-pass rendering pattern cho client-only content!   |
  +------------------------------------------------------------+


  Q5: React 15 SSR khac React 16 nhu the nao?
  +------------------------------------------------------------+
  |  -> React 15: checksum-based, data-reactid TREN MOI NODE! |
  |  -> React 16: single-node validation, chi data-reactroot! |
  |  -> React 16: NHO HON nhieu (it extra attributes!)        |
  |  -> React 16: NHANH HON (khong xay vDOM tren server!)     |
  |  -> React 16: KHOAN DUNG HON (khong all-or-nothing!)      |
  +------------------------------------------------------------+


  Q6: Server chay nhung lifecycle nao?
  +------------------------------------------------------------+
  |  -> CHI 3: constructor, getDerivedStateFromProps, render!  |
  |  -> componentDidMount: KHONG! (client only!)              |
  |  -> useEffect: KHONG! (client only!)                       |
  |  -> componentWillMount: DEPRECATED + mutual exclusion!     |
  |  -> Error lifecycle (gDSFE, cDC): KHONG HO TRO!           |
  +------------------------------------------------------------+


  Q7: Portal co hoat dong tren SSR khong?
  +------------------------------------------------------------+
  |  -> KHONG! SSR render TUYEN TINH (tren xuong duoi!)        |
  |  -> Portal can "nhay" den DOM node khac -> khong duoc!    |
  |  -> Streaming khong cho phep insert HTML o vi tri khac!   |
  |  -> Tuong tu: dynamic <head> injection cung khong duoc!   |
  +------------------------------------------------------------+


  Q8: suppressHydrationWarning dung khi nao?
  +------------------------------------------------------------+
  |  -> Chi dung cho KNOWN DIFFERENCES (timestamps, dates!)    |
  |  -> Chi TAT WARNING, KHONG sua loi!                        |
  |  -> Server value VAN DUOC GIU tren DOM!                    |
  |  -> KHONG dung de "an" bugs! Phai fix root cause!         |
  |  -> Alternative: two-pass rendering (tot hon!)            |
  +------------------------------------------------------------+
```

---

> **KET LUAN:**
> React SSR API la kien thuc NEN TANG cho Senior Engineer vi:
> - **4 Server APIs**: String vs Stream, Normal vs Static (2x2 matrix!)
> - **hydrate()**: Reuse DOM + attach events, khong render lai!
> - **Mismatch handling**: chi auto-fix text, con lai chi warning!
> - **React 15 → 16**: Big improvement (no vDOM, no checksum, less attrs!)
> - **Lifecycle**: chi 3 lifecycle tren server (constructor, gDSFP, render)
> - **Limitations**: Error Boundary + Portal KHONG ho tro SSR!
>
> Diem noi bat:
> - **suppressHydrationWarning** = chi TAT warning, KHONG sua loi!
> - **Two-pass rendering** = pattern chinh thuc cho intentional mismatch!
> - **Streaming limitation** = ly do Error Boundary + Portal khong duoc!
> - **React 15 vs 16** = checksum vs single-node (nhieu nguoi khong biet!)
