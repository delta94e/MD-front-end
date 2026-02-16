# React SSR: Principles — Deep Dive

> **Study Guide cho Senior React/Next.js Developer**
> Tai lieu nay di sau vao SOURCE CODE cua React SSR,
> tap trung vao 3 cau hoi cot loi:
> 1. Component duoc chuyen thanh HTML string NHU THE NAO?
> 2. String duoc ghep noi va stream DONG THOI ra sao?
> 3. Hydrate LAM GI chinh xac?

---

## §1. Problem Overview — Tong Quan Van De

```
================================================================
  REACT SSR = RENDER COMPONENT THANH HTML TREN SERVER!
================================================================


  THE GIOI THUC:
  +------------------------------------------------------------+
  |                                                            |
  |  User request --> Server --> ?????? --> HTML string         |
  |                                                            |
  |  INPUT:                                                    |
  |  +--------------------------------------------------+      |
  |  |  class MyComponent extends React.Component {      |      |
  |  |    state = { title: 'Welcome to React SSR!' };    |      |
  |  |    handleClick() { alert('clicked'); }            |      |
  |  |    render() {                                     |      |
  |  |      return (                                     |      |
  |  |        <div>                                      |      |
  |  |          <h1 className="site-title"               |      |
  |  |              onClick={this.handleClick}>          |      |
  |  |            {this.state.title} Hello There!        |      |
  |  |          </h1>                                    |      |
  |  |        </div>                                     |      |
  |  |      );                                           |      |
  |  |    }                                              |      |
  |  |  }                                                |      |
  |  +--------------------------------------------------+      |
  |                                                            |
  |  OUTPUT (sau renderToString):                              |
  |  +--------------------------------------------------+      |
  |  |  '<div data-reactroot="">                         |      |
  |  |    <h1 class="site-title">                        |      |
  |  |      Welcome to React SSR!<!-- --> Hello There!   |      |
  |  |    </h1>                                          |      |
  |  |  </div>'                                          |      |
  |  +--------------------------------------------------+      |
  |                                                            |
  |  NHAN XET:                                                 |
  |  -> className --> class (HTML attribute!)                   |
  |  -> onClick --> BI BO QUA! (server khong can!)             |
  |  -> data-reactroot="" --> danh dau root element!           |
  |  -> <!-- --> --> text separator (React internal!)           |
  |                                                            |
  +------------------------------------------------------------+


  3 CAU HOI COT LOI:
  +------------------------------------------------------------+
  |                                                            |
  |  (1) Component --> HTML string NHU THE NAO?                |
  |      -> Tao instance -> lifecycle -> map DOM -> string     |
  |                                                            |
  |  (2) String duoc ghep noi + stream DONG THOI?              |
  |      -> Stack-based rendering, tung node mot               |
  |      -> Giong React Fiber nhung workload-based!            |
  |                                                            |
  |  (3) Hydrate lam gi chinh xac?                             |
  |      -> Reuse DOM nodes da render tren server              |
  |      -> Attach event handlers + complete lifecycle         |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §2. Component Instance Creation — Tao Instance

```
================================================================
  BUOC 1: TAO COMPONENT INSTANCE VOI CUSTOM UPDATER!
================================================================


  CACH TAO INSTANCE:
  +------------------------------------------------------------+
  |                                                            |
  |  inst = new Component(element.props, publicContext, updater)|
  |                                                            |
  |  3 THAM SO:                                                |
  |  (1) element.props  --> props cua component                |
  |  (2) publicContext  --> context                            |
  |  (3) updater        --> CUSTOM UPDATER! (bi mat o day!)    |
  |                                                            |
  +------------------------------------------------------------+


  CUSTOM UPDATER — THAY THE VDOM!
  +------------------------------------------------------------+
  |                                                            |
  |  React 15 (cu):                                            |
  |  -> Server render = xay FULL Virtual DOM!                  |
  |  -> CHAM! (virtual DOM toan bo component tree!)            |
  |                                                            |
  |  React 16+ (moi):                                         |
  |  -> KHONG xay Virtual DOM!                                 |
  |  -> Thay vao do: INTERCEPT setState bang custom updater!   |
  |  -> NHANH HON NHIEU!                                       |
  |                                                            |
  |  "In React 16, the core team rewrote the server            |
  |   renderer from scratch, and it doesn't do any             |
  |   vDOM work at all."                                       |
  |                                                            |
  +------------------------------------------------------------+
```

```typescript
// Custom updater — intercept setState tren server!
const updater = {
  isMounted: (publicInstance) => {
    return false;  // Server KHONG BAO GIO mounted!
  },

  enqueueForceUpdate: (publicInstance) => {
    if (queue === null) {
      warnNoop(publicInstance, 'forceUpdate');
      return null;
    }
  },

  enqueueReplaceState: (publicInstance, completeState) => {
    replace = true;        // Flag: THAY THE toan bo state!
    queue = [completeState];
  },

  enqueueSetState: (publicInstance, currentPartialState) => {
    if (queue === null) {
      warnNoop(publicInstance, 'setState');
      return null;
    }
    queue.push(currentPartialState);
    // -> KHONG trigger re-render!
    // -> Chi PUSH vao queue, xu ly sau!
  }
};
```

```
  UPDATER DUOC INJECT NHU THE NAO?
  +------------------------------------------------------------+
  |                                                            |
  |  // React.Component base class:                            |
  |  function Component(props, context, updater) {             |
  |    this.props = props;                                     |
  |    this.context = context;                                 |
  |    this.refs = emptyObject;                                |
  |    this.updater = updater || ReactNoopUpdateQueue;         |
  |    //                  ^^^^^^                              |
  |    //  Server truyen CUSTOM updater vao day!               |
  |    //  Client dung DEFAULT updater (trigger re-render!)    |
  |  }                                                         |
  |                                                            |
  |  -> Constructor cua React.Component NHAN updater           |
  |     lam tham so thu 3!                                     |
  |  -> Day la "dependency injection" pattern!                 |
  |  -> Server inject updater KHAC voi Client!                 |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §3. Component Rendering Lifecycle — Lifecycle Tren Server

```
================================================================
  BUOC 2: CHAY LIFECYCLE TRUOC KHI RENDER!
================================================================


  THU TU THUC THI:
  +------------------------------------------------------------+
  |                                                            |
  |  (1) getDerivedStateFromProps (STATIC method!)             |
  |      |                                                     |
  |      v                                                     |
  |  (2) componentWillMount / UNSAFE_componentWillMount        |
  |      |    (CHI chay neu KHONG co getDerivedStateFromProps!) |
  |      v                                                     |
  |  (3) Check updater queue (setState trong WillMount?)       |
  |      |                                                     |
  |      v                                                     |
  |  (4) render()                                              |
  |      |                                                     |
  |      v                                                     |
  |  (5) Recursive processChild cho children!                  |
  |                                                            |
  |                                                            |
  |  CHU Y: Server CHI chay lifecycle TRUOC render!            |
  |  -> KHONG co componentDidMount!                            |
  |  -> KHONG co componentDidUpdate!                           |
  |  -> KHONG co useEffect!                                    |
  |                                                            |
  +------------------------------------------------------------+


  MUTUAL EXCLUSION — OLD vs NEW LIFECYCLE:
  +------------------------------------------------------------+
  |                                                            |
  |  NEU co getDerivedStateFromProps:                           |
  |  -> componentWillMount BI BO QUA!                          |
  |  -> UNSAFE_componentWillMount BI BO QUA!                   |
  |                                                            |
  |  NEU KHONG co getDerivedStateFromProps:                     |
  |  -> componentWillMount DUOC CHAY!                          |
  |  -> UNSAFE_componentWillMount CUNG DUOC CHAY!              |
  |  -> (neu ca 2 cung ton tai -> chay CA 2!)                  |
  |                                                            |
  +------------------------------------------------------------+
```

```typescript
// getDerivedStateFromProps
const partialState = Component.getDerivedStateFromProps.call(
  null,
  element.props,
  inst.state
);
inst.state = Object.assign({}, inst.state, partialState);

// componentWillMount (old lifecycle)
if (typeof Component.getDerivedStateFromProps !== 'function') {
  inst.componentWillMount();
}

// UNSAFE_componentWillMount
if (
  typeof inst.UNSAFE_componentWillMount === 'function' &&
  typeof Component.getDerivedStateFromProps !== 'function'
) {
  inst.UNSAFE_componentWillMount();
}

// --- CHECK QUEUE (setState trong WillMount?) ---
if (queue.length) {
  let nextState = oldReplace ? oldQueue[0] : inst.state;
  for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
    const partial = oldQueue[i];
    const _partialState =
      typeof partial === 'function'
        ? partial.call(inst, nextState, element.props, publicContext)
        : partial;
    nextState = Object.assign({}, nextState, _partialState);
  }
  inst.state = nextState;
  // -> setState trong WillMount DUOC XU LY NGAY!
  // -> State moi nhat truoc khi render()!
}

// --- RENDER ---
child = inst.render();
```

```
  RECURSIVE processChild — DE QUY DEN NATIVE DOM!
  +------------------------------------------------------------+
  |                                                            |
  |  while (React.isValidElement(child)) {                     |
  |    const element = child;                                  |
  |    const Component = element.type;                         |
  |                                                            |
  |    if (typeof Component !== 'function') {                  |
  |      break;  // <-- Gap NATIVE DOM element -> DUNG!        |
  |    }                                                       |
  |                                                            |
  |    processChild(element, Component);                       |
  |    // -> Lap lai: tao instance -> lifecycle -> render()    |
  |  }                                                         |
  |                                                            |
  |  // Khi gap native DOM element (div, h1, span...):         |
  |  if (typeof elementType === 'string') {                    |
  |    return this.renderDOM(nextElement, context, namespace); |
  |    // -> Chuyen DOM element thanh HTML STRING!             |
  |  }                                                         |
  |                                                            |
  |                                                            |
  |  LUONG XU LY:                                              |
  |  +----------+    +----------+    +----------+              |
  |  | MyApp    |--->| MyPage   |--->| MyButton |              |
  |  | (class)  |    | (class)  |    | (class)  |              |
  |  +----------+    +----------+    +-----+----+              |
  |                                        |                   |
  |                                        v                   |
  |                                  +----------+              |
  |                                  | <button> |              |
  |                                  | (native) |              |
  |                                  +----------+              |
  |                                        |                   |
  |                                        v                   |
  |                                  renderDOM()               |
  |                                  -> HTML string!           |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §4. DOM Element to HTML String — "Render" DOM

```
================================================================
  BUOC 3: CHUYEN DOM ELEMENT THANH HTML STRING!
================================================================


  BUOC 4.1: TIEN XU LY CONTROLLED COMPONENTS
  +------------------------------------------------------------+
  |                                                            |
  |  React can xu ly DAC BIET cac controlled components:       |
  |                                                            |
  |  (1) <input>:                                              |
  |  -> defaultChecked --> checked                             |
  |  -> defaultValue --> value                                 |
  |  -> Dam bao gia tri HIEN TAI duoc render!                  |
  |                                                            |
  |  (2) <textarea>:                                           |
  |  -> value --> children (vi textarea dung innerHTML!)        |
  |  -> children = '' + initialValue                           |
  |                                                            |
  |  (3) <select>:                                             |
  |  -> value --> bo! (xu ly o <option> thay the!)             |
  |                                                            |
  |  (4) <option>:                                             |
  |  -> selected duoc tinh toan tu <select> value!             |
  |  -> children = optionChildren                              |
  |                                                            |
  +------------------------------------------------------------+
```

```typescript
// input: merge defaultValue/defaultChecked vao value/checked
props = Object.assign({
  type: undefined
}, props, {
  defaultChecked: undefined,
  defaultValue: undefined,
  value: props.value != null ? props.value : props.defaultValue,
  checked: props.checked != null ? props.checked : props.defaultChecked
});

// textarea: value thanh children
props = Object.assign({}, props, {
  value: undefined,
  children: '' + initialValue
});

// select: bo value (xu ly o option)
props = Object.assign({}, props, { value: undefined });

// option: tinh toan selected
props = Object.assign({
  selected: undefined,
  children: undefined
}, props, {
  selected: selected,
  children: optionChildren
});
```

```
  BUOC 4.2: TAO OPENING TAG
  +------------------------------------------------------------+
  |                                                            |
  |  function createOpenTagMarkup(                             |
  |    tagVerbatim,   // ten tag goc (div, h1...)              |
  |    tagLowercase,  // ten tag lowercase                     |
  |    props,         // component props                       |
  |    namespace,                                              |
  |    makeStaticMarkup,  // renderToStaticMarkup?             |
  |    isRootElement      // la root element?                  |
  |  ) {                                                       |
  |    let ret = '<' + tagVerbatim;                            |
  |                                                            |
  |    for (propKey in props) {                                |
  |       // (1) Style -> serialize thanh CSS string            |
  |       if (propKey === STYLE) {                             |
  |         propValue = createMarkupForStyles(propValue);      |
  |       }                                                    |
  |                                                            |
  |       // (2) Tao attribute markup                          |
  |       markup = createMarkupForProperty(propKey, propValue);|
  |                                                            |
  |       // (3) Ghep vao opening tag                          |
  |       if (markup) ret += ' ' + markup;                     |
  |    }                                                       |
  |                                                            |
  |    // renderToStaticMarkup -> tra ve SACH (khong react attrs)|
  |    if (makeStaticMarkup) return ret;                       |
  |                                                            |
  |    // renderToString -> them data-reactroot="" cho root!   |
  |    if (isRootElement) {                                    |
  |      ret += ' ' + createMarkupForRoot();                   |
  |      // -> data-reactroot=""                               |
  |    }                                                       |
  |                                                            |
  |    return ret;                                             |
  |  }                                                         |
  |                                                            |
  +------------------------------------------------------------+


  BUOC 4.3: CLOSING TAG + CHILDREN
  +------------------------------------------------------------+
  |                                                            |
  |  // Closing tag:                                           |
  |  let footer = '';                                          |
  |  if (omittedCloseTags[tag]) {                              |
  |    out += '/>';        // Self-closing: <br/>, <img/>      |
  |  } else {                                                  |
  |    out += '>';         // Normal: <div>                    |
  |    footer = '</' + element.type + '>';  // </div>          |
  |  }                                                         |
  |                                                            |
  |                                                            |
  |  // Text children -> ghep TRUC TIEP vao opening tag!       |
  |  const innerMarkup = getNonChildrenInnerMarkup(props);     |
  |  if (innerMarkup != null) {                                |
  |    out += innerMarkup;                                     |
  |  } else {                                                  |
  |    children = toArray(props.children);                     |
  |  }                                                         |
  |                                                            |
  |                                                            |
  |  // Non-text children -> PUSH vao stack!                   |
  |  const frame = {                                           |
  |    domNamespace: getChildNamespace(parentNS, element.type),|
  |    type: tag,                                              |
  |    children: children,                                     |
  |    childIndex: 0,                                          |
  |    context: context,                                       |
  |    footer: footer     // <-- Closing tag LUU O DAY!        |
  |  };                                                        |
  |  this.stack.push(frame);                                   |
  |  return out;  // <-- TRA VE opening tag NGAY!              |
  |                                                            |
  |                                                            |
  |  DIEM QUAN TRONG:                                          |
  |  -> Opening tag HOAN THANH va OUTPUT NGAY!                 |
  |  -> Closing tag LUU vao stack, doi children render xong!   |
  |  -> Day la ly do streaming HOAT DONG DUOC!                 |
  |                                                            |
  +------------------------------------------------------------+


  VD: RENDER <div><h1>Hello</h1></div>
  +------------------------------------------------------------+
  |                                                            |
  |  Buoc 1: Render <div>                                      |
  |  -> OUTPUT: '<div>'                                        |
  |  -> STACK:  [{type:'div', footer:'</div>', children:[h1]}] |
  |                                                            |
  |  Buoc 2: Render <h1>Hello</h1>                             |
  |  -> OUTPUT: '<h1>Hello</h1>'                               |
  |  -> STACK:  [{type:'div', footer:'</div>', children DONE}] |
  |                                                            |
  |  Buoc 3: div children xong -> pop stack, them footer       |
  |  -> OUTPUT: '</div>'                                       |
  |  -> STACK:  [] (XONG!)                                     |
  |                                                            |
  |  KET QUA: '<div><h1>Hello</h1></div>'                      |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §5. Event Attributes — Tai Sao onClick Bi Bo Qua?

```
================================================================
  SERVER KHONG XU LY EVENT HANDLERS!
================================================================


  NGUYEN NHAN:
  +------------------------------------------------------------+
  |                                                            |
  |  function shouldIgnoreAttribute(name, propertyInfo,        |
  |                                 isCustomComponentTag) {    |
  |    // Bat dau bang "on" hoac "On" -> BO QUA!               |
  |    if (name.length > 2 &&                                  |
  |        (name[0] === 'o' || name[0] === 'O') &&             |
  |        (name[1] === 'n' || name[1] === 'N')) {             |
  |      return true;  // IGNORE!                              |
  |    }                                                       |
  |  }                                                         |
  |                                                            |
  |  -> onClick, onChange, onSubmit... TAT CA BI BO QUA!       |
  |  -> Server chi can HTML TINH -> khong can events!          |
  |  -> Events se duoc attach lai boi HYDRATE tren client!     |
  |                                                            |
  +------------------------------------------------------------+


  NHUNG GI SERVER KHONG LAM:
  +------------------------------------------------------------+
  |                                                            |
  |  [-] Event handlers (onClick, onChange...)                  |
  |  [-] componentDidMount                                     |
  |  [-] componentDidUpdate                                    |
  |  [-] useEffect / useLayoutEffect                           |
  |  [-] Refs (khong co DOM tren server!)                      |
  |                                                            |
  |  -> Component CHUA DUOC "render" DAY DU!                   |
  |  -> Can HYDRATE tren client de hoan tat!                   |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §6. Streaming — Ghep Noi Va Stream Dong Thoi

```
================================================================
  STREAMING = RENDER TUNG NODE, GUI TUNG PHAN!
================================================================


  STACK-BASED RENDERING LOOP:
  +------------------------------------------------------------+
  |                                                            |
  |  function read(bytes) {                                    |
  |    let out = [''];                                         |
  |                                                            |
  |    // Render cho den khi DU bytes HOAC het task!            |
  |    while (out[0].length < bytes) {                         |
  |                                                            |
  |      // Het task -> DUNG!                                  |
  |      if (this.stack.length === 0) break;                   |
  |                                                            |
  |      // Lay task TREN CUNG cua stack                       |
  |      const frame = this.stack[this.stack.length - 1];      |
  |                                                            |
  |      // Tat ca children da render xong?                    |
  |      if (frame.childIndex >= frame.children.length) {      |
  |        const footer = frame.footer;                        |
  |        this.stack.pop();       // Pop task!                |
  |        out[0] += footer;       // Them closing tag!        |
  |        continue;                                           |
  |      }                                                     |
  |                                                            |
  |      // Render TUNG child, tang childIndex                 |
  |      const child = frame.children[frame.childIndex++];     |
  |      let outBuffer = '';                                   |
  |      outBuffer += this.render(child, frame.context,        |
  |                               frame.domNamespace);         |
  |      out[0] += outBuffer;                                  |
  |    }                                                       |
  |                                                            |
  |    return out[0];                                          |
  |  }                                                         |
  |                                                            |
  +------------------------------------------------------------+


  SO SANH VOI REACT FIBER:
  +------------------------------------------------------------+
  |                                                            |
  |  +---------------------+---------------------+            |
  |  | SSR Streaming       | React Fiber         |            |
  |  +---------------------+---------------------+            |
  |  | Workload-based      | Time-based          |            |
  |  | while(len < bytes)  | while(time < 5ms)   |            |
  |  | Render tung NODE    | Render tung FIBER    |            |
  |  | Stack-based         | LinkedList-based     |            |
  |  | Server-side         | Client-side          |            |
  |  | Output: strings     | Output: DOM updates  |            |
  |  +---------------------+---------------------+            |
  |                                                            |
  |  GIONG NHAU:                                               |
  |  -> Ca 2 deu chia cong viec thanh SMALL TASKS!             |
  |  -> Ca 2 deu co the NGAT + TIEP TUC!                      |
  |  -> Ca 2 deu cho phep output TUNG PHAN!                    |
  |                                                            |
  +------------------------------------------------------------+


  VD: RENDER TREE VOI STREAMING
  +------------------------------------------------------------+
  |                                                            |
  |  Component tree:                                           |
  |    <div>                                                   |
  |      <h1>Title</h1>                                        |
  |      <p>Content</p>                                        |
  |    </div>                                                  |
  |                                                            |
  |  read(50):  // Doc 50 bytes                                |
  |  -> Render <div>       -> out = '<div>'                    |
  |  -> Push frame {children:[h1,p], footer:'</div>'}          |
  |  -> Render <h1>Title   -> out += '<h1>Title</h1>'          |
  |  -> len=23 < 50 -> TIEP TUC!                              |
  |  -> Render <p>Content  -> out += '<p>Content</p>'          |
  |  -> Children done -> pop + footer                          |
  |  -> out += '</div>'                                        |
  |  -> return '<div><h1>Title</h1><p>Content</p></div>'       |
  |                                                            |
  |  read(15):  // Doc 15 bytes (workload nho hon!)            |
  |  -> Render <div>       -> out = '<div>'                    |
  |  -> Render <h1>Title   -> out += '<h1>Title</h1>'          |
  |  -> len=23 > 15 -> DUNG! GUI NGAY!                        |
  |  -> return '<div><h1>Title</h1>'                           |
  |  -> Lan read tiep -> '<p>Content</p></div>'                |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §7. Readable Stream Wrapper — Boc Thanh Stream

```
================================================================
  WRAP RENDERER THANH NODE.JS READABLE STREAM!
================================================================


  IMPLEMENTATION:
  +------------------------------------------------------------+
  |                                                            |
  |  class ReactMarkupReadableStream extends Readable {        |
  |    constructor(element, makeStaticMarkup, options) {        |
  |      super({});                                            |
  |      // Dung CUNG rendering logic voi renderToString!      |
  |      this.partialRenderer =                                |
  |        new ReactDOMServerRenderer(element,                 |
  |                                   makeStaticMarkup,        |
  |                                   options);                |
  |    }                                                       |
  |                                                            |
  |    // Override _read() — moi lan doc 'size' bytes!         |
  |    _read(size) {                                           |
  |      try {                                                 |
  |        this.push(                                          |
  |          this.partialRenderer.read(size)                   |
  |        );                                                  |
  |      } catch (err) {                                       |
  |        this.destroy(err);                                  |
  |      }                                                     |
  |    }                                                       |
  |  }                                                         |
  |                                                            |
  +------------------------------------------------------------+


  API CONG KHAI:
  +------------------------------------------------------------+
  |                                                            |
  |  // STREAMING API:                                         |
  |  function renderToNodeStream(element, options) {           |
  |    return new ReactMarkupReadableStream(                   |
  |      element, false, options                               |
  |    );                                                      |
  |  }                                                         |
  |  // -> Tra ve Readable Stream!                             |
  |  // -> Doc tung phan, gui tung phan!                       |
  |                                                            |
  |                                                            |
  |  // NON-STREAMING API:                                     |
  |  function renderToString(element, options) {               |
  |    const renderer = new ReactDOMServerRenderer(            |
  |      element, false, options                               |
  |    );                                                      |
  |    try {                                                   |
  |      const markup = renderer.read(Infinity);               |
  |      //                          ^^^^^^^^                  |
  |      //  read(Infinity) = DOC HET MOT LAN!                |
  |      //  KHONG streaming, doi render XONG roi tra ve!      |
  |      return markup;                                        |
  |    } finally {                                             |
  |      renderer.destroy();                                   |
  |    }                                                       |
  |  }                                                         |
  |                                                            |
  +------------------------------------------------------------+


  SU KHAC BIET:
  +------------------------------------------------------------+
  |                                                            |
  |  +------------------------+------------------------+       |
  |  | renderToString         | renderToNodeStream     |       |
  |  +------------------------+------------------------+       |
  |  | read(Infinity)         | read(size) nhieu lan   |       |
  |  | Doc HET mot lan        | Doc TUNG PHAN          |       |
  |  | Tra ve string          | Tra ve Readable Stream |       |
  |  | Block cho den khi xong | GUI NGAY khi co data   |       |
  |  | TTFB cao              | TTFB thap!             |       |
  |  | Don gian               | Can pipe() vao res     |       |
  |  +========================+========================+       |
  |                                                            |
  |  renderToStaticMarkup / renderToStaticNodeStream:          |
  |  -> Giong nhau nhung KHONG them data-reactroot=""          |
  |  -> KHONG the hydrate duoc!                                |
  |  -> Dung cho static pages (email templates, RSS...)        |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §8. Hydrate Overview — Tong Quan Hydrate

```
================================================================
  HYDRATE = HOAN TAT RENDERING TREN CLIENT!
================================================================


  TAI SAO CAN HYDRATE?
  +------------------------------------------------------------+
  |                                                            |
  |  Server render:                                            |
  |  [+] HTML co noi dung -> hien thi NGAY!                    |
  |  [-] KHONG co event handlers!                              |
  |  [-] KHONG chay componentDidMount!                         |
  |  [-] KHONG co interactive behavior!                        |
  |                                                            |
  |  -> User THAY content nhung KHONG THE TUONG TAC!           |
  |  -> Can hydrate de "lam song" trang!                       |
  |                                                            |
  +------------------------------------------------------------+


  hydrate() vs render():
  +------------------------------------------------------------+
  |                                                            |
  |  // Cung function signature!                               |
  |  ReactDOM.hydrate(element, container[, callback])          |
  |  ReactDOM.render(element, container[, callback])           |
  |                                                            |
  |  +------------------------+------------------------+       |
  |  | render()               | hydrate()              |       |
  |  +------------------------+------------------------+       |
  |  | Bat dau TU SCRATCH     | Bat dau TREN SERVER    |       |
  |  |                        | RENDER ARTIFACTS!      |       |
  |  | Tao DOM nodes MOI      | REUSE DOM nodes        |       |
  |  |                        | da ton tai!            |       |
  |  | Set ALL attributes     | Chi UPDATE neu khac    |       |
  |  | Full render cost       | Tiet kiem DOM creation |       |
  |  +------------------------+------------------------+       |
  |                                                            |
  |  -> hydrate() KHONG tao DOM nodes moi!                     |
  |  -> hydrate() TIM VA TAI SU DUNG nodes da co!              |
  |  -> Chi khac biet: TIET KIEM viec tao DOM nodes!           |
  |  -> Workload tuong duong render() trong moi khia canh khac!|
  |                                                            |
  +------------------------------------------------------------+
```

---

## §9. Hydrate Phase 1 — Node Reuse Strategy (Tim Node Tai Su Dung)

```
================================================================
  PHASE 1 (RENDER): TIM NODE CO THE TAI SU DUNG!
================================================================


  LUONG XU LY:
  +------------------------------------------------------------+
  |                                                            |
  |  (1) updateHostRoot:                                       |
  |      -> Tim child DAU TIEN co the reuse tu container       |
  |                                                            |
  |  (2) enterHydrationState:                                  |
  |      -> Lay firstChild cua container                       |
  |      -> Luu vao bien global: nextHydratableInstance         |
  |                                                            |
  |  (3) updateHostComponent:                                  |
  |      -> Khi gap native component (div, h1...)              |
  |      -> Thu reuse node da pre-select                       |
  |                                                            |
  |  (4) tryHydrate:                                           |
  |      -> Kiem tra node co MATCH khong                        |
  |      -> Neu match -> attach vao fiber.stateNode!           |
  |                                                            |
  +------------------------------------------------------------+
```

```typescript
// Buoc 1: Tim child dau tien co the hydrate
function enterHydrationState(fiber) {
  const parentInstance = fiber.stateNode.containerInfo;
  // Tim child DAU TIEN co the reuse!
  nextHydratableInstance =
    getFirstHydratableChild(parentInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  return true;
}

// Buoc 2: Tim element node hoac text node
function getNextHydratable(node) {
  for (; node != null; node = node.nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE ||    // nodeType === 1
        nodeType === TEXT_NODE) {        // nodeType === 3
      break;
    }
  }
  return node;
  // -> Chi chap nhan ELEMENT hoac TEXT nodes!
  // -> Comment nodes, processing instructions -> BO QUA!
}

// Buoc 3: Khi gap HostComponent -> thu reuse
function updateHostComponent(current, workInProgress, renderLanes) {
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
}

// Buoc 4: Thu reuse node
function tryHydrate(fiber, nextInstance) {
  const type = fiber.type;
  const instance = canHydrateInstance(nextInstance, type);

  if (instance !== null) {
    fiber.stateNode = instance;
    // ^^^ ATTACH node vao fiber!
    // -> TAM THOI coi nhu rendering result!
    return true;
  }
}
```

```
  TIEU CHI MATCH — CHI CAN CUNG TAG NAME!
  +------------------------------------------------------------+
  |                                                            |
  |  function canHydrateInstance(instance, type, props) {      |
  |    if (instance.nodeType !== ELEMENT_NODE ||               |
  |        type.toLowerCase() !==                              |
  |          instance.nodeName.toLowerCase()) {                |
  |      return null;                                          |
  |    }                                                       |
  |    return instance;                                        |
  |  }                                                         |
  |                                                            |
  |  CHU Y:                                                    |
  |  -> Chi kiem tra TAG NAME!                                 |
  |  -> KHONG kiem tra attributes!                             |
  |  -> <div class="a"> va <div class="b">                    |
  |     -> VAN DUOC COI LA MATCH!                              |
  |  -> Attributes check o PHASE 2!                            |
  |                                                            |
  +------------------------------------------------------------+


  VD: HYDRATE <div><h1>Title</h1><p>Text</p></div>
  +------------------------------------------------------------+
  |                                                            |
  |  Server HTML:                                              |
  |  <div id="root">                                           |
  |    <div data-reactroot="">                                 |
  |      <h1 class="title">Title</h1>                         |
  |      <p>Text</p>                                           |
  |    </div>                                                  |
  |  </div>                                                    |
  |                                                            |
  |  Phase 1:                                                  |
  |  (1) enterHydrationState -> nextHydratable = <div>         |
  |  (2) Fiber div -> canHydrate(<div>, 'div')? YES!           |
  |      -> fiber.stateNode = <div> node                       |
  |  (3) Fiber h1 -> canHydrate(<h1>, 'h1')? YES!             |
  |      -> fiber.stateNode = <h1> node                        |
  |  (4) Fiber p -> canHydrate(<p>, 'p')? YES!                 |
  |      -> fiber.stateNode = <p> node                         |
  |                                                            |
  |  -> TAT CA nodes duoc reuse!                               |
  |  -> KHONG tao DOM node nao moi!                            |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §10. Hydrate Phase 2 — Attribute Consistency Check (Kiem Tra Thuoc Tinh)

```
================================================================
  PHASE 2 (COMMIT): KIEM TRA + SUA LOI ATTRIBUTES!
================================================================


  DIEM VAO:
  +------------------------------------------------------------+
  |                                                            |
  |  function completeWork(current, workInProgress, renderLanes)|
  |  {                                                         |
  |    const _wasHydrated = popHydrationState(workInProgress); |
  |                                                            |
  |    if (_wasHydrated) {                                     |
  |      // Co node MATCH -> kiem tra attributes!               |
  |      if (prepareToHydrateHostInstance(                     |
  |        workInProgress,                                     |
  |        rootContainerInstance,                               |
  |        currentHostContext                                  |
  |      )) {                                                  |
  |        // Can update -> danh dau!                          |
  |        markUpdate(workInProgress);                         |
  |        // -> Sua loi o COMMIT PHASE!                       |
  |      }                                                     |
  |    } else {                                                |
  |      // KHONG co node match!                               |
  |      // -> Tao node MOI (nhu render() binh thuong!)        |
  |      const instance = createInstance(                      |
  |        type, newProps, rootContainerInstance,               |
  |        currentHostContext, workInProgress                  |
  |      );                                                    |
  |      appendAllChildren(instance, workInProgress, ...);     |
  |      workInProgress.stateNode = instance;                  |
  |    }                                                       |
  |  }                                                         |
  |                                                            |
  +------------------------------------------------------------+


  diffHydratedProperties — 3 HANH DONG:
  +------------------------------------------------------------+
  |                                                            |
  |  (1) TEXT CHILDREN KHAC NHAU:                              |
  |  +------------------------------------------------------+  |
  |  |  Server: <h1>Hello Server</h1>                        |  |
  |  |  Client: <h1>Hello Client</h1>                        |  |
  |  |                                                       |  |
  |  |  -> WARNING + AUTO CORRECT!                           |  |
  |  |  -> DOM duoc UPDATE thanh "Hello Client"!             |  |
  |  |  -> Day la TRUONG HOP DUY NHAT duoc sua tu dong!     |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  (2) STYLE / CLASS KHAC NHAU:                              |
  |  +------------------------------------------------------+  |
  |  |  Server: <div class="dark">                           |  |
  |  |  Client: <div class="light">                          |  |
  |  |                                                       |  |
  |  |  -> CHI WARNING! KHONG TU SUA!                        |  |
  |  |  -> DOM van giu "dark" (server value!)                |  |
  |  |  -> Developer PHAI tu fix!                            |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  (3) DOM CO EXTRA ATTRIBUTES:                              |
  |  +------------------------------------------------------+  |
  |  |  Server: <div data-extra="true">                      |  |
  |  |  Client: <div>  (khong co data-extra)                 |  |
  |  |                                                       |  |
  |  |  -> CHI WARNING! KHONG XOA!                           |  |
  |  |  -> Extra attributes VAN TON TAI tren DOM!            |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  TOM TAT HYDRATION MISMATCH HANDLING:
  +------------------------------------------------------------+
  |                                                            |
  |  +--------------------+----------+----------+              |
  |  | Loai mismatch      | Warning  | Auto-fix |              |
  |  +--------------------+----------+----------+              |
  |  | Text children      | YES      | YES!     |              |
  |  | style values       | YES      | NO       |              |
  |  | class values       | YES      | NO       |              |
  |  | other attributes   | YES      | NO       |              |
  |  | extra DOM attrs    | YES      | NO       |              |
  |  +--------------------+----------+----------+              |
  |                                                            |
  |  CRITICAL:                                                 |
  |  -> Chi co TEXT CHILDREN duoc tu dong sua!                  |
  |  -> Moi thu khac CHI WARNING!                              |
  |  -> PHAI nghiem tuc voi hydration warnings!                |
  |  -> Mismatch = BUG trong code!                             |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §11. Hydrate Component Lifecycle — Lifecycle Day Du

```
================================================================
  HYDRATE CHAY FULL LIFECYCLE (KE CA SERVER-SIDE!)
================================================================


  LIFECYCLE KHI HYDRATE:
  +------------------------------------------------------------+
  |                                                            |
  |  // (1) Tao component instance                             |
  |  const instance = new ctor(props, context);                |
  |                                                            |
  |  // (2) getDerivedStateFromProps <-- CHAY LAI!             |
  |  // (3) componentWillMount       <-- CHAY LAI!             |
  |  // (4) UNSAFE_componentWillMount <-- CHAY LAI!            |
  |                                                            |
  |  // (5) render()                 <-- CHAY LAI!             |
  |  nextChildren = instance.render();                         |
  |                                                            |
  |  // (6) componentDidMount       <-- MOI! (server ko co!)  |
  |  instance.componentDidMount();                             |
  |                                                            |
  |                                                            |
  |  CHU Y QUAN TRONG:                                         |
  |  -> Lifecycle TRUOC render() CHAY LAI tren client!         |
  |  -> componentWillMount chay 2 LAN (server + client!)       |
  |  -> componentDidMount chi chay 1 LAN (client only!)        |
  |  -> Khong nen co side effects trong componentWillMount!    |
  |                                                            |
  +------------------------------------------------------------+


  HYDRATE PERFORMANCE:
  +------------------------------------------------------------+
  |                                                            |
  |  hydrate() TIET KIEM duoc gi?                              |
  |                                                            |
  |  [+] KHONG tao DOM nodes moi (reuse!)                      |
  |  [+] KHONG set initial attribute values!                   |
  |                                                            |
  |  [-] VAN phai tao component instances!                     |
  |  [-] VAN phai chay FULL lifecycle!                         |
  |  [-] VAN phai chay render()!                               |
  |  [-] VAN phai reconcile (find matching nodes!)             |
  |  [-] VAN phai attach event handlers!                       |
  |                                                            |
  |  -> Workload TUONG DUONG render()!                         |
  |  -> Chi tiet kiem DOM creation + initial attrs!            |
  |  -> LOI ICH CHINH la USER THAY CONTENT SOM HON!           |
  |     (khong phai performance improvement!)                  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §12. Toan Bo Pipeline — Tom Tat

```
================================================================
  FULL PIPELINE: SERVER RENDER -> CLIENT HYDRATE
================================================================


  +------------------------------------------------------------+
  |                                                            |
  |  SERVER SIDE:                                              |
  |  +------------------------------------------------------+  |
  |  |                                                       |  |
  |  |  (1) Component instance (custom updater!)             |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  |  (2) Lifecycle (getDerivedStateFromProps,              |  |
  |  |      componentWillMount)                              |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  |  (3) render() -> recursive processChild               |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  |  (4) renderDOM() -> HTML string                       |  |
  |  |       |  (opening tag -> output NGAY!)                |  |
  |  |       |  (closing tag -> stack!)                       |  |
  |  |       v                                               |  |
  |  |  (5) Stack-based loop (workload-based scheduling!)    |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  |  (6) Readable Stream -> pipe to response!             |  |
  |  |                                                       |  |
  |  +------------------------------------------------------+  |
  |       |                                                    |
  |       | HTML string (streaming hoac mot lan)               |
  |       v                                                    |
  |  CLIENT SIDE:                                              |
  |  +------------------------------------------------------+  |
  |  |                                                       |  |
  |  |  (7) Browser hien HTML NGAY (co content!)             |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  |  (8) JS bundle load xong -> hydrate() bat dau!       |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  |  (9) PHASE 1 (render/reconciliation):                 |  |
  |  |      -> Tim reusable nodes (tag name match!)          |  |
  |  |      -> Attach vao fiber.stateNode                    |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  | (10) PHASE 2 (commit):                                |  |
  |  |      -> diffHydratedProperties                        |  |
  |  |      -> Auto-fix text children                        |  |
  |  |      -> Warning for other mismatches                  |  |
  |  |       |                                               |  |
  |  |       v                                               |  |
  |  | (11) Attach event handlers (onClick, onChange...)      |  |
  |  | (12) componentDidMount / useEffect                    |  |
  |  |      -> App DAY DU TUONG TAC!                         |  |
  |  |                                                       |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §13. Interview Q&A — Cau Hoi Phong Van

```
================================================================
  Q&A = HIEU SAU DE TRA LOI CHINH XAC!
================================================================


  Q1: React 16 SSR nhanh hon React 15 nhu the nao?
  +------------------------------------------------------------+
  |  -> React 15: xay FULL Virtual DOM tren server!            |
  |  -> React 16: VIET LAI tu dau, KHONG dung vDOM!           |
  |  -> Thay vao do: intercept setState bang CUSTOM UPDATER!   |
  |  -> Chi collect state changes, KHONG diff vDOM!            |
  |  -> Ket qua: NHANH HON NHIEU!                             |
  +------------------------------------------------------------+


  Q2: renderToString vs renderToNodeStream?
  +------------------------------------------------------------+
  |  -> renderToString: read(Infinity) -> DOC HET mot lan!     |
  |  -> renderToNodeStream: read(size) nhieu lan -> STREAMING! |
  |  -> Cung rendering logic (ReactDOMServerRenderer)!         |
  |  -> Stream = TTFB thap hon, user thay content som hon!     |
  |  -> String = don gian hon, phu hop khi khong can streaming!|
  +------------------------------------------------------------+


  Q3: Tai sao onClick bi bo qua tren server?
  +------------------------------------------------------------+
  |  -> Server chi can HTML TINH -> khong can event handlers!  |
  |  -> Moi attribute bat dau bang "on"/"On" bi IGNORE!        |
  |  -> Event handlers duoc ATTACH LAI boi hydrate() tren client|
  |  -> Day la phan cong: server = content, client = behavior! |
  +------------------------------------------------------------+


  Q4: hydrate() khac gi render()?
  +------------------------------------------------------------+
  |  -> render(): tao DOM nodes MOI tu scratch!                |
  |  -> hydrate(): REUSE DOM nodes da co tu server!            |
  |  -> hydrate() chi tiet kiem DOM creation!                  |
  |  -> Van chay FULL lifecycle + render() + reconciliation!   |
  |  -> Loi ich CHINH: user THAY CONTENT SOM (khong doi JS!)  |
  +------------------------------------------------------------+


  Q5: Tieu chi nao de hydrate reuse mot DOM node?
  +------------------------------------------------------------+
  |  -> CHI CAN TAG NAME GIONG NHAU!                           |
  |  -> <div class="a"> va <div class="b"> = MATCH!           |
  |  -> Attributes KHONG duoc kiem tra o phase 1!              |
  |  -> Phase 2 moi check: diffHydratedProperties             |
  |  -> Chi auto-fix TEXT CHILDREN, con lai chi WARNING!       |
  +------------------------------------------------------------+


  Q6: Hydration mismatch xu ly the nao?
  +------------------------------------------------------------+
  |  -> Text children khac: WARNING + AUTO CORRECT!            |
  |  -> Style/class khac: CHI WARNING, KHONG SUA!             |
  |  -> Extra DOM attributes: CHI WARNING, KHONG XOA!         |
  |  -> QUAN TRONG: phai fix ALL warnings trong dev mode!      |
  |  -> Mismatch = BUG, co the gay UI khong nhat quan!        |
  +------------------------------------------------------------+


  Q7: componentWillMount chay may lan trong SSR + hydrate?
  +------------------------------------------------------------+
  |  -> componentWillMount chay 2 LAN!                         |
  |  -> Lan 1: TREN SERVER (truoc renderToString)              |
  |  -> Lan 2: TREN CLIENT (trong hydrate)                     |
  |  -> componentDidMount chi chay 1 LAN (client only!)        |
  |  -> Vi vay: KHONG nen co side effects trong WillMount!     |
  |  -> Dung componentDidMount cho API calls, subscriptions!   |
  +------------------------------------------------------------+


  Q8: SSR streaming workload-based vs Fiber time-based?
  +------------------------------------------------------------+
  |  -> SSR: while(output.length < bytes) -> render them!      |
  |  -> Fiber: while(currentTime < deadline) -> render them!   |
  |  -> Ca 2 deu chia nho cong viec!                           |
  |  -> SSR: output tung phan HTML string!                     |
  |  -> Fiber: output tung phan DOM updates!                   |
  |  -> SSR: stack-based (push/pop frames)!                    |
  |  -> Fiber: linked-list-based (return/child/sibling)!       |
  +------------------------------------------------------------+


  Q9: renderToStaticMarkup dung khi nao?
  +------------------------------------------------------------+
  |  -> Tao HTML SACH (khong co data-reactroot!)               |
  |  -> KHONG the hydrate duoc!                                |
  |  -> Dung cho: email templates, RSS feeds, static pages!    |
  |  -> Nhe hon renderToString (it attributes hon!)            |
  +------------------------------------------------------------+
```

---

> **KET LUAN:**
> React SSR Principles la kien thuc QUAN TRONG cho Senior Engineer vi:
> - **Custom Updater** — Hieu tai sao React 16 SSR nhanh (khong dung vDOM!)
> - **Stack-based Rendering** — Workload scheduling (giong Fiber nhung khac!)
> - **Streaming** — read(size) vs read(Infinity), Readable Stream wrapper
> - **Hydrate 2 Phases** — Tag name match (phase 1) + attribute diff (phase 2)
> - **Mismatch Handling** — Chi auto-fix text, con lai chi warning!
> - **Lifecycle** — componentWillMount chay 2 lan, componentDidMount chi 1 lan
>
> Diem noi bat:
> - **Custom Updater injection** = dependency injection pattern (hiem ai biet!)
> - **Workload-based scheduling** = giong Fiber nhung cho server (hiem ai de cap!)
> - **Only text auto-fix** = nhieu developer khong biet (tuong la tu sua het!)
