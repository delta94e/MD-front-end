# React Source Code (v15.4.1) — Foreword Deep Dive: Phân Tích Mã Nguồn React Từ Số 0

> 📅 2026-02-17 · ⏱ 45 phút đọc
>
> Phù hợp cho người đã có kinh nghiệm dự án React và hiểu cơ bản các React API thường dùng.
> Việc nghiên cứu mã nguồn React kết hợp giữa các bài phân tích online và hiểu biết cá nhân.
> Ban đầu tìm hiểu vì gặp vấn đề hiệu suất trong dự án, không tìm được thông tin liên quan online,
> nên muốn tìm ra chính xác các điểm ảnh hưởng.
> Phân tích dựa trên phiên bản **15.4.1**, đã loại bỏ warning môi trường dev.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: React Internals

---

## Mục Lục

```
§1.  Khái niệm cơ bản — ReactElement
§2.  Khái niệm cơ bản — ReactComponent
§3.  Khái niệm cơ bản — ReactClass
§4.  Object Pool — Tái sử dụng đối tượng
§5.  Transaction — Cơ chế giao dịch
§6.  Event Distribution — Phân phối sự kiện
§7.  Life Cycle — Vòng đời component (Mount)
§8.  Life Cycle — Vòng đời component (Update & setState)
§9.  Diff Algorithm — Thuật toán so sánh
§10. Một số điểm khác — Interface
§11. Tóm tắt & Câu hỏi phỏng vấn
```

---

## §1. Khái Niệm Cơ Bản — ReactElement

```
═══════════════════════════════════════════════════════════════
  REACTELEMENT = LỚP DỮ LIỆU MÔ TẢ UI!
═══════════════════════════════════════════════════════════════


  ĐỊNH NGHĨA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactElement = DATA CLASS (lớp dữ liệu thuần)       │
  │                                                        │
  │  Chỉ chứa:                                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  • props   → thuộc tính truyền vào      │          │
  │  │  • refs    → tham chiếu đến DOM/inst    │          │
  │  │  • key     → định danh cho diff         │          │
  │  │  • type    → loại component             │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  KHÔNG chứa:                                           │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ✗ state (trạng thái)                   │          │
  │  │  ✗ lifecycle methods                     │          │
  │  │  ✗ logic xử lý                          │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  → ReactElement CHỈ MÔ TẢ "trông như thế nào"!       │
  │  → KHÔNG BIẾT "làm gì"!                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  CÁCH TẠO — React.createElement (ReactElement.js):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① React.createElement('div', {id: 'app'}, children) │
  │     → Trả về 1 ReactElement object!                   │
  │                                                        │
  │  ② Phương thức render() trong React.createClass       │
  │     → CŨNG trả về ReactElement!                       │
  │                                                        │
  │  ③ JSX <div id="app" /> biên dịch thành:              │
  │     → React.createElement('div', {id: 'app'})        │
  │     → = ReactElement!                                  │
  │                                                        │
  │  SƠ ĐỒ:                                               │
  │  ┌──────────┐  biên dịch  ┌──────────────────┐        │
  │  │   JSX    │ ──────────→ │ createElement()  │        │
  │  │ <App />  │             │                  │        │
  │  └──────────┘             └────────┬─────────┘        │
  │                                    │                   │
  │                                    ▼                   │
  │                           ┌────────────────┐           │
  │                           │ ReactElement   │           │
  │                           │ {              │           │
  │                           │   type: App,   │           │
  │                           │   props: {},   │           │
  │                           │   key: null,   │           │
  │                           │   ref: null    │           │
  │                           │ }              │           │
  │                           └────────────────┘           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

> **Tóm lại:** ReactElement = "bản thiết kế" mô tả UI, chỉ là plain object chứa `type`, `props`, `key`, `ref`. Nó KHÔNG phải component instance, KHÔNG có state, KHÔNG có lifecycle.

---

## §2. Khái Niệm Cơ Bản — ReactComponent

```
═══════════════════════════════════════════════════════════════
  REACTCOMPONENT = LỚP ĐIỀU KHIỂN, CÓ STATE & METHODS!
═══════════════════════════════════════════════════════════════


  ĐỊNH NGHĨA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactComponent = CONTROL CLASS (lớp điều khiển)      │
  │                                                        │
  │  Bao gồm:                                             │
  │  ┌──────────────────────────────────────────┐          │
  │  │  • state     → trạng thái component     │          │
  │  │  • methods   → phương thức xử lý        │          │
  │  │  • lifecycle → vòng đời component       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  4 LOẠI COMPONENT:                                     │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ① ReactEmptyComponent   → node rỗng   │          │
  │  │  ② ReactDOMTextComponent → text node    │          │
  │  │  ③ ReactDOMComponent     → DOM gốc      │          │
  │  │  ④ ReactCompositeComponent → tùy chỉnh │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  FACTORY PATTERN — instantiateReactComponent.js:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Khi mount component, gọi instantiateReactComponent   │
  │  → Dùng FACTORY PATTERN trả về component phù hợp!   │
  │                                                        │
  │  SƠ ĐỒ QUYẾT ĐỊNH:                                    │
  │                                                        │
  │  instantiateReactComponent(node)                       │
  │         │                                              │
  │         ├── node === null/false ?                       │
  │         │   └── YES → ReactEmptyComponent.create()     │
  │         │                                              │
  │         ├── typeof node === 'object' ?                  │
  │         │   ├── element.type === 'string' ?             │
  │         │   │   └── YES → ReactHostComponent            │
  │         │   │            .createInternalComponent()     │
  │         │   │            (VD: 'div', 'span'...)        │
  │         │   │                                          │
  │         │   └── Khác (custom component) ?               │
  │         │       └── YES → new ReactCompositeComponent  │
  │         │                  Wrapper(element)             │
  │         │                                              │
  │         └── typeof node === 'string'/'number' ?         │
  │             └── YES → ReactHostComponent               │
  │                      .createInstanceForText(node)       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — instantiateReactComponent.js

```javascript
function instantiateReactComponent(node, shouldHaveDebugID) {
  var instance;

  if (node === null || node === false) {
    // ① Node rỗng → tạo component rỗng
    instance = ReactEmptyComponent.create(instantiateReactComponent);
  } else if (typeof node === "object") {
    var element = node;

    if (typeof element.type === "string") {
      // ② Type là string ('div', 'span') → tạo DOM component
      instance = ReactHostComponent.createInternalComponent(element);
    } else if (isInternalComponentType(element.type)) {
      // Tạm thời cho internal component types (không phải string)
      // Sẽ bỏ trong tương lai
    } else {
      // ③ Custom component (class/function) → tạo Composite component
      instance = new ReactCompositeComponentWrapper(element);
    }
  } else if (typeof node === "string" || typeof node === "number") {
    // ④ Text hoặc số → tạo text component
    instance = ReactHostComponent.createInstanceForText(node);
  }

  // These two fields are used by the DOM and ART diffing algorithms
  // respectively. Instead of using expandos on components, we should be
  // storing the state needed by the diffing algorithms elsewhere.
  instance._mountIndex = 0;
  instance._mountImage = null;

  return instance;
}
```

```
  SO SÁNH ĐỘ PHỨC TẠP CỦA CÁC LOẠI COMPONENT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌────────────────────────┬───────────────────────┐    │
  │  │ Component              │ Độ phức tạp           │    │
  │  ├────────────────────────┼───────────────────────┤    │
  │  │ ReactDOMTextComponent  │ ★☆☆ Chỉ quan tâm text│    │
  │  │ ReactDOMComponent      │ ★★☆ Đơn giản hơn     │    │
  │  │ ReactCompositeComponent│ ★★★ Phức tạp NHẤT!   │    │
  │  │                        │ Cần lấy rendered DOM, │    │
  │  │                        │ quản lý state, lifecycle│   │
  │  └────────────────────────┴───────────────────────┘    │
  │                                                        │
  │  → ReactCompositeComponent phức tạp nhất vì:          │
  │    ① Phải gọi render() để lấy ReactElement            │
  │    ② Phải đệ quy tạo child components                │
  │    ③ Phải quản lý state + lifecycle                   │
  │    ④ Phải xử lý shouldComponentUpdate                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Khái Niệm Cơ Bản — ReactClass

```
═══════════════════════════════════════════════════════════════
  REACTCLASS = 2 CÚ PHÁP, CÙNG BẢN CHẤT!
═══════════════════════════════════════════════════════════════


  SO SÁNH 2 CÚ PHÁP:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ═══ ES5 (createClass) ═══                             │
  │  var MyComponent = React.createClass({                 │
  │    getInitialState: function() {                       │
  │      return { count: 0 };                              │
  │    },                                                  │
  │    render: function() {                                │
  │      return <div>{this.state.count}</div>;             │
  │    }                                                   │
  │  });                                                   │
  │                                                        │
  │  ═══ ES6 (extends Component) ═══                       │
  │  class MyComponent extends React.Component {           │
  │    constructor(props) {                                │
  │      super(props);                                     │
  │      this.state = { count: 0 };                        │
  │    }                                                   │
  │    render() {                                          │
  │      return <div>{this.state.count}</div>;             │
  │    }                                                   │
  │  }                                                     │
  │                                                        │
  │  CÂU HỎI: Tại sao createClass → ra Component?        │
  │  → Vì bản chất implementation GẦN NHƯ GIỐNG NHAU!   │
  │  → ES6 đơn giản hơn, bỏ API riêng getInitialState!  │
  │  → React sẽ BỎ createClass ở phiên bản sau!         │
  │  → Thêm: createClass tự động autobind methods!        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactClass.js (createClass)

```javascript
var ReactClass = {
  createClass: function (spec) {
    // Đảm bảo Constructor.name !== 'Constructor'
    var Constructor = identity(function (props, context, updater) {
      // Tự động bind methods (autobind)
      if (this.__reactAutoBindPairs.length) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
      this.state = null;

      // ReactClasses KHÔNG có constructors!
      // Thay vào đó, dùng getInitialState và componentWillMount
      var initialState = this.getInitialState ? this.getInitialState() : null;
      this.state = initialState;
    });

    // Kế thừa từ ReactClassComponent
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;
    Constructor.prototype.__reactAutoBindPairs = [];

    // Trộn mixins vào
    injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));
    mixSpecIntoComponent(Constructor, spec);

    // Khởi tạo defaultProps SAU KHI tất cả mixins đã merge
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    // Đặt null cho methods chưa định nghĩa → tăng tốc tra cứu
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    return Constructor;
  },
};

// ReactClassComponent kế thừa từ ReactComponent!
var ReactClassComponent = function () {};
_assign(
  ReactClassComponent.prototype,
  ReactComponent.prototype, // ← Kế thừa từ ReactComponent!
  ReactClassMixin,
);
```

### Mã nguồn — ReactComponent.js (Base Class)

```javascript
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

// Đánh dấu đây là React Component
ReactComponent.prototype.isReactComponent = {};

// setState: đẩy state vào hàng đợi
ReactComponent.prototype.setState = function (partialState, callback) {
  // updater là bridge đến React internal update mechanism
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, "setState");
  }
};

// forceUpdate: ép buộc re-render (bỏ qua shouldComponentUpdate)
ReactComponent.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this);
  if (callback) {
    this.updater.enqueueCallback(this, callback, "forceUpdate");
  }
};
```

```
  CHUỖI KẾ THỪA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactComponent (Base)                                 │
  │  ├── .isReactComponent = {}                            │
  │  ├── .setState(partialState, cb)                       │
  │  │    └── updater.enqueueSetState(this, partialState) │
  │  └── .forceUpdate(cb)                                  │
  │       └── updater.enqueueForceUpdate(this)             │
  │         │                                              │
  │         ▼                                              │
  │  ReactClassComponent (extends ReactComponent)          │
  │  ├── = ReactComponent.prototype                        │
  │  └── + ReactClassMixin (thêm methods)                  │
  │         │                                              │
  │         ▼                                              │
  │  Constructor (createClass tạo ra)                      │
  │  ├── .prototype = new ReactClassComponent()            │
  │  ├── .__reactAutoBindPairs = []                        │
  │  ├── .getInitialState()                                │
  │  └── autobind methods!                                 │
  │                                                        │
  │                                                        │
  │  ĐẶC BIỆT: AUTOBIND trong createClass!               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  createClass → TỰ ĐỘNG bind this!       │          │
  │  │  ES6 class   → PHẢI bind thủ công!       │          │
  │  │                                          │          │
  │  │  // createClass: onClick hoạt động ngay! │          │
  │  │  render: function() {                    │          │
  │  │    return <div onClick={this.handle} />  │          │
  │  │  }                                       │          │
  │  │                                          │          │
  │  │  // ES6 class: phải bind!                │          │
  │  │  constructor() {                         │          │
  │  │    this.handle = this.handle.bind(this); │          │
  │  │  }                                       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Object Pool — Tái Sử Dụng Đối Tượng

```
═══════════════════════════════════════════════════════════════
  OBJECT POOL = TÁI SỬ DỤNG ĐỐI TƯỢNG, GIẢM GC!
═══════════════════════════════════════════════════════════════


  TẠI SAO CẦN OBJECT POOL?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VẤN ĐỀ:                                              │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Tạo mới đối tượng = CÓ GIÁ!          │          │
  │  │  ① Cấp phát bộ nhớ (memory allocation) │          │
  │  │  ② Khởi tạo (initialization)            │          │
  │  │  ③ Thu hồi (garbage collection - GC)    │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  Memory Churn (xáo trộn bộ nhớ):                     │
  │  ┌──────────────────────────────────────────┐          │
  │  │  = Tạo NHIỀU objects → XÓA NGAY!       │          │
  │  │  → GC chạy LIÊN TỤC!                   │          │
  │  │  → GC = TỐN HIỆU SUẤT + THỜI GIAN!   │          │
  │  │  → UI GIẬT LAG!                         │          │
  │  │                                          │          │
  │  │  Timeline:                               │          │
  │  │  new → dùng → bỏ → GC! ← tốn!        │          │
  │  │  new → dùng → bỏ → GC! ← tốn!        │          │
  │  │  new → dùng → bỏ → GC! ← tốn!        │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  GIẢI PHÁP = OBJECT POOL:                             │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Giảm số lần TẠO MỚI + HỦY objects! │          │
  │  │  → Dùng xong → TRẢ VỀ pool!           │          │
  │  │  → Cần dùng → LẤY TỪ pool!            │          │
  │  │  → KHÔNG tạo mới, KHÔNG GC!            │          │
  │  │                                          │          │
  │  │  Timeline:                               │          │
  │  │  pool.get → dùng → pool.release ← rẻ!│          │
  │  │  pool.get → dùng → pool.release ← rẻ!│          │
  │  │  (cùng 1 object được tái sử dụng!)      │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  QUY TẮC SỬ DỤNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① getPooled() và release() PHẢI dùng CẶP!          │
  │  ② Sau khi release → đặt biến nội bộ = null!        │
  │     (để lần dùng sau không bị dữ liệu cũ)            │
  │  ③ Pool có SIZE TỐI ĐA (mặc định = 10)              │
  │     → Nếu pool ĐẦY → phải tạo mới (new)!           │
  │     → Object mới KHÔNG được tái sử dụng!             │
  │                                                        │
  │  SƠ ĐỒ HOẠT ĐỘNG:                                     │
  │                                                        │
  │  ┌──────────────────────────────────────────┐          │
  │  │            OBJECT POOL                   │          │
  │  │  ┌─────┬─────┬─────┬─────┬─────┐       │          │
  │  │  │ obj │ obj │ obj │     │     │       │          │
  │  │  │  1  │  2  │  3  │ ... │ 10  │       │          │
  │  │  └──┬──┴─────┴─────┴─────┴─────┘       │          │
  │  │     │                    ▲               │          │
  │  │     │ getPooled()        │ release()     │          │
  │  │     │ (pop từ pool)      │ (push vào pool│          │
  │  │     │                    │  nếu chưa đầy)│          │
  │  │     ▼                    │               │          │
  │  │  ┌──────────┐           │               │          │
  │  │  │  SỬ DỤNG │───────────┘               │          │
  │  │  │  object  │                            │          │
  │  │  └──────────┘                            │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — PooledClass.js (viết tay lại)

```javascript
// ═══ Pooler cho 1 tham số ═══
var oneArgumentPooler = function (copyFieldsFrom) {
  var Klass = this; // this = class constructor

  if (Klass.instancePool.length) {
    // Pool CÒN object → lấy ra tái sử dụng!
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom); // Khởi tạo lại
    return instance;
  } else {
    // Pool TRỐNG → tạo mới!
    return new Klass(copyFieldsFrom);
  }
};

// ═══ Hàm trả object về pool ═══
var standardReleaser = function (instance) {
  var Klass = this;

  if (Klass.instancePool.length < Klass.poolSize) {
    // Pool CHƯA ĐẦY → push vào!
    Klass.instancePool.push(instance);
  }
  // Pool ĐẦY → bỏ qua (để GC thu hồi)
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

// ═══ Thêm pooling vào bất kỳ class nào ═══
var addPoolingTo = function (CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler, // 2 tham số
  threeArgumentPooler: threeArgumentPooler, // 3 tham số
  fourArgumentPooler: fourArgumentPooler, // 4 tham số
  fiveArgumentPooler: fiveArgumentPooler, // 5 tham số
};

module.exports = PooledClass;
```

### Ví dụ sử dụng — ReactUpdate.js

```javascript
// ① LẤY từ pool (getPooled)
var transaction = ReactUpdatesFlushTransaction.getPooled();

// ... sử dụng transaction ...

// ② TRẢ VỀ pool (release) — trong destructor
destructor: function () {
  // Reset tất cả biến nội bộ = null!
  this.dirtyComponentsLength = null;
  CallbackQueue.release(this.callbackQueue);
  this.callbackQueue = null;
  ReactUpdates.ReactReconcileTransaction.release(
    this.reconcileTransaction
  );
  this.reconcileTransaction = null;
}

// ③ RELEASE transaction
ReactUpdatesFlushTransaction.release(transaction);
```

```
  SO SÁNH VỚI CÁC LOẠI POOL KHÁC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────┬───────────────┬──────────────────┐   │
  │  │ Object Pool  │ Connection    │ Thread Pool      │   │
  │  │ (React)      │ Pool (DB)     │ (Backend)        │   │
  │  ├──────────────┼───────────────┼──────────────────┤   │
  │  │ Tái sử dụng │ Tái sử dụng  │ Tái sử dụng     │   │
  │  │ JS objects   │ DB connections│ worker threads   │   │
  │  │              │               │                  │   │
  │  │ Giảm GC     │ Giảm chi phí │ Giảm chi phí    │   │
  │  │ pressure     │ TCP handshake │ tạo/hủy thread  │   │
  │  │              │               │                  │   │
  │  │ Pool đầy →  │ Connection    │ Task queue khi   │   │
  │  │ tạo mới,    │ KHÔNG bị hủy │ thread busy      │   │
  │  │ KHÔNG tái   │ SAU khi task  │ → giữ lại để   │   │
  │  │ sử dụng!    │ xong → tái  │ chạy task khác   │   │
  │  │              │ sử dụng!     │                  │   │
  │  └──────────────┴───────────────┴──────────────────┘   │
  │                                                        │
  │  ⚠ ĐIỂM KHÁC BIỆT QUAN TRỌNG:                        │
  │  → Object Pool (React): pool đầy → tạo mới           │
  │  → Connection Pool: connection KHÔNG bị hủy           │
  │    (reuse cho task khác)                               │
  │  → Thread Pool: thread idle → chờ task mới            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Transaction — Cơ Chế Giao Dịch

```
═══════════════════════════════════════════════════════════════
  TRANSACTION = WRAPPER TRƯỚC/SAU + THỰC THI CHÍNH!
═══════════════════════════════════════════════════════════════


  SƠ ĐỒ TRANSACTION (Transaction.js):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │              TRANSACTION                         │   │
  │  │                                                  │   │
  │  │  ┌─────────────┐                                │   │
  │  │  │  Wrapper 1  │                                │   │
  │  │  │ initialize  │                                │   │
  │  │  └──────┬──────┘                                │   │
  │  │         ▼                                        │   │
  │  │  ┌─────────────┐                                │   │
  │  │  │  Wrapper 2  │                                │   │
  │  │  │ initialize  │                                │   │
  │  │  └──────┬──────┘                                │   │
  │  │         ▼                                        │   │
  │  │  ╔═════════════════════════════╗                │   │
  │  │  ║  PERFORM (method chính!)   ║                │   │
  │  │  ║  method.call(scope, args)   ║                │   │
  │  │  ╚═══════════════╤═════════════╝                │   │
  │  │                  ▼                               │   │
  │  │  ┌─────────────┐                                │   │
  │  │  │  Wrapper 2  │                                │   │
  │  │  │   close     │                                │   │
  │  │  └──────┬──────┘                                │   │
  │  │         ▼                                        │   │
  │  │  ┌─────────────┐                                │   │
  │  │  │  Wrapper 1  │                                │   │
  │  │  │   close     │                                │   │
  │  │  └─────────────┘                                │   │
  │  │                                                  │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                        │
  │  LUỒNG: initialize ALL → perform → close ALL          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — Transaction.js

```javascript
var TransactionImpl = {
  perform: function (method, scope, a, b, c, d, e, f) {
    var errorThrown;
    var ret;
    try {
      this._isInTransaction = true;
      // Đặt errorThrown = true TRƯỚC
      // Nếu sau khi gọi close vẫn true → có lỗi!
      errorThrown = true;

      // ① Gọi TẤT CẢ wrapper.initialize()
      this.initializeAll(0);

      // ② Thực thi PHƯƠNG THỨC CHÍNH
      ret = method.call(scope, a, b, c, d, e, f);

      errorThrown = false;
    } finally {
      try {
        if (errorThrown) {
          // method ném lỗi → ưu tiên hiện stack trace lỗi đó
          // → bắt lỗi closeAll nhưng KHÔNG ném thêm
          try {
            this.closeAll(0);
          } catch (err) {}
        } else {
          // method KHÔNG lỗi → nếu closeAll lỗi, để nó ném!
          this.closeAll(0);
        }
      } finally {
        this._isInTransaction = false;
      }
    }
    return ret;
  },

  // Thực thi tất cả wrapper.initialize()
  initializeAll: function (startIndex) {
    // Lặp qua transactionWrappers, gọi .initialize()
  },

  // Thực thi tất cả wrapper.close()
  closeAll: function (startIndex) {
    // Lặp qua transactionWrappers, gọi .close()
  },
};

module.exports = TransactionImpl;
```

```
  SO SÁNH VỚI BACKEND TRANSACTION:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────────┬──────────────────────────────┐   │
  │  │ React Transaction│ Backend Transaction (DB)     │   │
  │  ├──────────────────┼──────────────────────────────┤   │
  │  │ initialize →     │ BEGIN TRANSACTION            │   │
  │  │ perform →        │ SQL statements               │   │
  │  │ close            │ COMMIT / ROLLBACK            │   │
  │  │                  │                              │   │
  │  │ KHÔNG có commit! │ CÓ commit!                   │   │
  │  │ TỰ ĐỘNG thực thi│ CẦN gọi commit thủ công     │   │
  │  │ initialize không │ CÓ rollback!                 │   │
  │  │ cung cấp rollback│                              │   │
  │  │ (wrapper phụ     │                              │   │
  │  │ cung cấp)        │                              │   │
  │  └──────────────────┴──────────────────────────────┘   │
  │                                                        │
  │  💡 Giống AOP (Aspect-Oriented Programming) hơn!      │
  │  → initialize = @Before                                │
  │  → close = @After                                      │
  │  → Wrapper = Aspect!                                   │
  │                                                        │
  │  ReactReconcileTransaction.js cung cấp rollback        │
  │  thông qua wrapper phụ!                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Event Distribution — Phân Phối Sự Kiện

```
═══════════════════════════════════════════════════════════════
  EVENTS ĐƯỢC BIND VÀO DOCUMENT, KHÔNG PHẢI NODE CỤ THỂ!
═══════════════════════════════════════════════════════════════


  SƠ ĐỒ HỆ THỐNG SỰ KIỆN (ReactBrowserEventEmitter.js):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │          Top Level (document)                    │   │
  │  │                                                  │   │
  │  │  onClick, onChange, onScroll... TẤT CẢ          │   │
  │  │  được delegate lên DOCUMENT!                    │   │
  │  │                                                  │   │
  │  │  ┌──────────────────────────────────────────┐    │   │
  │  │  │ ReactEventListener                       │    │   │
  │  │  │ → Đăng ký event trên document           │    │   │
  │  │  │ → Dispatch event khi xảy ra             │    │   │
  │  │  └────────────────────┬─────────────────────┘    │   │
  │  │                       │ dispatchEvent             │   │
  │  │                       ▼                           │   │
  │  │  ┌──────────────────────────────────────────┐    │   │
  │  │  │ EventPluginHub                           │    │   │
  │  │  │ → Lưu trữ events trong listenerBank    │    │   │
  │  │  │ → Quản lý tất cả event listeners       │    │   │
  │  │  └────────────────────┬─────────────────────┘    │   │
  │  │                       │                           │   │
  │  │                       ▼                           │   │
  │  │  ┌──────────────────────────────────────────┐    │   │
  │  │  │ Plugin (Event Plugins)                   │    │   │
  │  │  │ → Tạo SyntheticEvent phù hợp            │    │   │
  │  │  │ → Kết nối native event ↔ component     │    │   │
  │  │  │ → VD: SimpleEventPlugin, ChangeEvent...  │    │   │
  │  │  └────────────────────┬─────────────────────┘    │   │
  │  │                       │                           │   │
  │  │                       ▼                           │   │
  │  │  ┌──────────────────────────────────────────┐    │   │
  │  │  │ ReactEventEmitter                        │    │   │
  │  │  │ → Thực thi callback                     │    │   │
  │  │  │ → Bubbling từ component → tổ tiên      │    │   │
  │  │  └──────────────────────────────────────────┘    │   │
  │  │                                                  │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  QUÁ TRÌNH KHI EVENT XẢY RA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① User click vào <Button>                            │
  │     │                                                  │
  │     ▼                                                  │
  │  ② Native event bubble lên document                   │
  │     │                                                  │
  │     ▼                                                  │
  │  ③ ReactEventListener.dispatchEvent() được gọi       │
  │     │                                                  │
  │     ▼                                                  │
  │  ④ Tìm ReactComponent tương ứng với target           │
  │     │                                                  │
  │     ▼                                                  │
  │  ⑤ Duyệt NGƯỢC LÊN qua parent components            │
  │     → Thực hiện EVENT BUBBLING trong React!           │
  │     │                                                  │
  │     ▼                                                  │
  │  ⑥ Gọi callback đã đăng ký trên mỗi component      │
  │                                                        │
  │                                                        │
  │  <App>                                                 │
  │    <Parent onClick={handleParentClick}>                │
  │      <Child onClick={handleChildClick}>                │
  │        <Button onClick={handleButtonClick} />          │
  │      </Child>                                          │
  │    </Parent>                                           │
  │  </App>                                                │
  │                                                        │
  │  Click Button → thứ tự gọi:                          │
  │  ① handleButtonClick (target)                         │
  │  ② handleChildClick  (bubble lên)                     │
  │  ③ handleParentClick (bubble tiếp)                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  ƯU ĐIỂM CỦA EVENT DELEGATION:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① GIẢM BỘ NHỚ:                                      │
  │  → 100 buttons = 100 listeners? KHÔNG!                 │
  │  → Chỉ 1 listener trên document!                      │
  │                                                        │
  │  ② ĐƠN GIẢN HÓA native DOM events:                   │
  │  → React tạo SyntheticEvent nhất quán                 │
  │  → Cross-browser compatible!                           │
  │                                                        │
  │  ③ SỬ DỤNG OBJECT POOL cho SyntheticEvent:           │
  │  → Tạo/hủy event objects = tốn!                       │
  │  → Pool → tái sử dụng event objects!                  │
  │                                                        │
  │  ⚠ CHÚ Ý:                                             │
  │  → stopPropagation() của React CHỈ ngăn bubbling      │
  │    TRONG React! KHÔNG ngăn native events!              │
  │  → TRÁNH bind native events thủ công!                 │
  │    (vì chúng sẽ bubble TRƯỚC React event system)      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

> **Ứng dụng thực tế:** Cách tiếp cận "thu thập tập trung + phân phối" (centralized collection & distribution) này có thể áp dụng cho các project cụ thể, ví dụ: centralized logging, analytics event tracking, command dispatching.

---

## §7. Life Cycle — Vòng Đời Component (Mount)

```
═══════════════════════════════════════════════════════════════
  MOUNT = KHỞI TẠO + GẮN VÀO DOM LẦN ĐẦU!
═══════════════════════════════════════════════════════════════


  SƠ ĐỒ MOUNT TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactDOM.render(<App />, container)                   │
  │         │                                              │
  │         ▼                                              │
  │  ┌─────────────────────────────────────┐               │
  │  │ instantiateReactComponent(element)  │               │
  │  │ → Tạo internal component instance  │               │
  │  └──────────────────┬──────────────────┘               │
  │                     │                                  │
  │                     ▼                                  │
  │  ┌─────────────────────────────────────┐               │
  │  │ mountComponent(transaction, ...)    │               │
  │  │ → Bắt đầu quá trình mount!        │               │
  │  └──────────────────┬──────────────────┘               │
  │                     │                                  │
  │         ┌───────────┴───────────┐                      │
  │         ▼                       ▼                      │
  │  ┌─────────────┐        ┌─────────────┐               │
  │  │ Composite   │        │   DOM       │               │
  │  │ Component   │        │ Component   │               │
  │  │ (custom)    │        │ ('div'...)  │               │
  │  └──────┬──────┘        └──────┬──────┘               │
  │         │                      │                       │
  │         ▼                      ▼                       │
  │  Lifecycle methods!      Tạo DOM nodes!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  MOUNT CHI TIẾT — ReactCompositeComponent:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  mountComponent(transaction, hostParent, ...)          │
  │         │                                              │
  │         ├── ① Khởi tạo instance                       │
  │         │   → shouldConstruct(Component) ?             │
  │         │   → CÓ → new Component(props, context)      │
  │         │   → KHÔNG → Component(props, context)        │
  │         │     (= Stateless Functional Component)       │
  │         │                                              │
  │         ├── ② Gán props, context, refs, updater       │
  │         │   → inst.props = publicProps                 │
  │         │   → inst.context = publicContext             │
  │         │   → inst.refs = emptyObject                  │
  │         │   → inst.updater = updateQueue               │
  │         │                                              │
  │         ├── ③ Khởi tạo state                           │
  │         │   → inst.state || null                       │
  │         │                                              │
  │         ├── ④ componentWillMount() ← GỌI ở đây!      │
  │         │   → setState() TRONG componentWillMount     │
  │         │     → MERGE vào state NGAY + ĐỒNG BỘ!      │
  │         │     → KHÔNG trigger re-render thêm!          │
  │         │                                              │
  │         ├── ⑤ render() ← GỌI ở đây!                  │
  │         │   → Trả về ReactElement                     │
  │         │   → Đệ quy mount children!                  │
  │         │                                              │
  │         └── ⑥ componentDidMount() ← ENQUEUE!         │
  │             → KHÔNG gọi ngay!                          │
  │             → Đưa vào transaction callback queue!     │
  │             → Chạy SAU KHI toàn bộ tree mount xong!  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactCompositeComponent.js (mountComponent)

```javascript
mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
  this._context = context;
  this._mountOrder = nextMountID++;
  this._hostParent = hostParent;
  this._hostContainerInfo = hostContainerInfo;

  var publicProps = this._currentElement.props;
  var publicContext = this._processContext(context);
  var Component = this._currentElement.type;
  var updateQueue = transaction.getUpdateQueue();

  // ① Quyết định: new Component() hay Component() ?
  var doConstruct = shouldConstruct(Component);
  var inst = this._constructComponent(
    doConstruct, publicProps, publicContext, updateQueue
  );

  var renderedElement;
  // Kiểm tra Stateless Functional Component
  if (!doConstruct && (inst == null || inst.render == null)) {
    renderedElement = inst;
    inst = new StatelessComponent(Component);
    this._compositeType = CompositeTypes.StatelessFunctional;
  } else {
    if (isPureComponent(Component)) {
      this._compositeType = CompositeTypes.PureClass;
    } else {
      this._compositeType = CompositeTypes.ImpureClass;
    }
  }

  // ② Gán properties
  inst.props = publicProps;
  inst.context = publicContext;
  inst.refs = emptyObject;
  inst.updater = updateQueue;
  this._instance = inst;

  // Lưu mapping: public instance ↔ internal instance
  ReactInstanceMap.set(inst, this);

  // ③ Khởi tạo state
  var initialState = inst.state;
  if (initialState === undefined) {
    inst.state = initialState = null;
  }

  this._pendingStateQueue = null;
  this._pendingReplaceState = false;
  this._pendingForceUpdate = false;

  // ④⑤ Perform initial mount (gọi willMount + render)
  var markup;
  if (inst.unstable_handleError) {
    markup = this.performInitialMountWithErrorHandling(
      renderedElement, hostParent, hostContainerInfo,
      transaction, context
    );
  } else {
    markup = this.performInitialMount(
      renderedElement, hostParent, hostContainerInfo,
      transaction, context
    );
  }

  // ⑥ componentDidMount → ENQUEUE (không gọi ngay!)
  if (inst.componentDidMount) {
    transaction.getReactMountReady().enqueue(
      inst.componentDidMount, inst
    );
  }

  return markup;
}
```

```
  ⚠ ĐIỂM QUAN TRỌNG VỀ componentDidMount:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  componentDidMount KHÔNG được gọi NGAY!               │
  │                                                        │
  │  → Được ENQUEUE vào transaction callback queue!       │
  │  → Chạy SAU KHI tất cả children đã mount xong!       │
  │  → Đảm bảo TOÀN BỘ tree có trong DOM trước!          │
  │                                                        │
  │  THỨ TỰ GỌI (cho nested components):                 │
  │  ┌──────────────────────────────────────────┐          │
  │  │                                          │          │
  │  │  <Parent>        willMount  ①            │          │
  │  │    <Child>       willMount  ②            │          │
  │  │      <GrandChild> willMount ③           │          │
  │  │      </GrandChild> didMount ④ ← FIRST! │          │
  │  │    </Child>      didMount   ⑤           │          │
  │  │  </Parent>       didMount   ⑥ ← LAST!  │          │
  │  │                                          │          │
  │  │  → Từ trong ra ngoài (bottom-up)!       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Life Cycle — Vòng Đời Component (Update & setState)

```
═══════════════════════════════════════════════════════════════
  UPDATE = CẬP NHẬT COMPONENT SAU KHI ĐÃ MOUNT!
═══════════════════════════════════════════════════════════════


  SƠ ĐỒ UPDATE TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setState() / forceUpdate()                            │
  │  / nhận props mới                                      │
  │         │                                              │
  │         ▼                                              │
  │  ┌─────────────────────────────────────┐               │
  │  │ updateComponent(transaction, ...)   │               │
  │  └──────────────────┬──────────────────┘               │
  │                     │                                  │
  │         ┌───────────┴───────────┐                      │
  │         ▼                       ▼                      │
  │  Props thay đổi?         State thay đổi?              │
  │         │                       │                      │
  │         ▼                       ▼                      │
  │  componentWill           _processPendingState          │
  │  ReceiveProps()          (merge tất cả states)         │
  │         │                       │                      │
  │         └───────────┬───────────┘                      │
  │                     ▼                                  │
  │  ┌─────────────────────────────────────┐               │
  │  │ shouldComponentUpdate(next, next)?  │               │
  │  └──────────────────┬──────────────────┘               │
  │              ┌──────┴──────┐                           │
  │              ▼             ▼                           │
  │          true ✓        false ✗                        │
  │              │             │                           │
  │              ▼             ▼                           │
  │  _performComponent     Gán props/state               │
  │  Update()              MỚI nhưng KHÔNG               │
  │  ├── componentWill     render lại!                    │
  │  │   Update()                                          │
  │  ├── render()                                          │
  │  ├── diff + patch                                      │
  │  └── componentDid                                      │
  │      Update()                                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactCompositeComponent.js (updateComponent)

```javascript
updateComponent: function (
  transaction, prevParentElement, nextParentElement,
  prevUnmaskedContext, nextUnmaskedContext
) {
  var inst = this._instance;
  var willReceive = false;
  var nextContext;

  // Kiểm tra context có thay đổi không
  if (this._context === nextUnmaskedContext) {
    nextContext = inst.context;
  } else {
    nextContext = this._processContext(nextUnmaskedContext);
    willReceive = true;
  }

  var prevProps = prevParentElement.props;
  var nextProps = nextParentElement.props;

  // Element thay đổi → sẽ nhận props mới
  if (prevParentElement !== nextParentElement) {
    willReceive = true;
  }

  // ① componentWillReceiveProps — chỉ gọi khi nhận props mới!
  if (willReceive && inst.componentWillReceiveProps) {
    inst.componentWillReceiveProps(nextProps, nextContext);
  }

  // ② Merge tất cả pending states
  var nextState = this._processPendingState(nextProps, nextContext);
  var shouldUpdate = true;

  // ③ shouldComponentUpdate — quyết định có render lại không
  if (!this._pendingForceUpdate) {
    if (inst.shouldComponentUpdate) {
      shouldUpdate = inst.shouldComponentUpdate(
        nextProps, nextState, nextContext
      );
    } else {
      // PureComponent → shallow compare tự động!
      if (this._compositeType === CompositeTypes.PureClass) {
        shouldUpdate =
          !shallowEqual(prevProps, nextProps) ||
          !shallowEqual(inst.state, nextState);
      }
    }
  }

  this._updateBatchNumber = null;

  if (shouldUpdate) {
    // ④ CẦN update → thực hiện render + diff + patch
    this._pendingForceUpdate = false;
    this._performComponentUpdate(
      nextParentElement, nextProps, nextState,
      nextContext, transaction, nextUnmaskedContext
    );
  } else {
    // ⑤ KHÔNG cần update → chỉ gán giá trị mới
    this._currentElement = nextParentElement;
    this._context = nextUnmaskedContext;
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;
  }
}
```

```
  SETSTATE — LUỒNG XỬ LÝ CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  this.setState({ count: 1 })                           │
  │         │                                              │
  │         ▼                                              │
  │  ReactComponent.setState(partialState, callback)       │
  │         │                                              │
  │         ├── updater.enqueueSetState(this, partialState)│
  │         │         │                                    │
  │         │         ▼                                    │
  │         │  ReactUpdateQueue.enqueueSetState            │
  │         │         │                                    │
  │         │         ├── Lấy internalInstance             │
  │         │         ├── Push vào _pendingStateQueue      │
  │         │         └── enqueueUpdate(internalInstance)  │
  │         │                   │                          │
  │         │                   ▼                          │
  │         │  ┌────────────────────────────────┐          │
  │         │  │ isBatchingUpdates?             │          │
  │         │  ├────────┬───────────────────────┤          │
  │         │  │ TRUE   │ FALSE                 │          │
  │         │  │ ↓      │ ↓                     │          │
  │         │  │ Push   │ batchedUpdates(        │          │
  │         │  │ vào    │   enqueueUpdate,       │          │
  │         │  │ dirty  │   component            │          │
  │         │  │ Comps  │ )                      │          │
  │         │  │        │ → Thực thi NGAY!      │          │
  │         │  └────────┴───────────────────────┘          │
  │         │                                              │
  │         └── callback ? enqueueCallback(callback)       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactUpdateQueue.js (enqueueSetState)

```javascript
enqueueSetState: function (publicInstance, partialState) {
  // Lấy internal instance từ public instance
  var internalInstance = getInternalInstanceReadyForUpdate(
    publicInstance, 'setState'
  );

  if (!internalInstance) {
    return;
  }

  // Push partialState vào hàng đợi
  var queue = internalInstance._pendingStateQueue ||
    (internalInstance._pendingStateQueue = []);
  queue.push(partialState);

  // Lên lịch update!
  enqueueUpdate(internalInstance);
}
```

### Mã nguồn — ReactUpdates.js (enqueueUpdate + runBatchedUpdates)

```javascript
// ═══ enqueueUpdate — quyết định batch hay thực thi ngay ═══
function enqueueUpdate(component) {
  // Nếu KHÔNG đang batch → bắt đầu batch mới!
  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }

  // Đang batch → thêm vào danh sách dirty components
  dirtyComponents.push(component);
  if (component._updateBatchNumber == null) {
    component._updateBatchNumber = updateBatchNumber + 1;
  }
}

// ═══ runBatchedUpdates — xử lý tất cả dirty components ═══
function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength;

  // Sắp xếp theo thứ tự MOUNT (cha trước, con sau)
  dirtyComponents.sort(mountOrderComparator);

  updateBatchNumber++;

  for (var i = 0; i < len; i++) {
    var component = dirtyComponents[i];
    var callbacks = component._pendingCallbacks;
    component._pendingCallbacks = null;

    // Thực hiện update cho từng component
    ReactReconciler.performUpdateIfNecessary(
      component,
      transaction.reconcileTransaction,
      updateBatchNumber,
    );

    // Xử lý callbacks (từ setState callback)
    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(
          callbacks[j],
          component.getPublicInstance(),
        );
      }
    }
  }
}
```

### Mã nguồn — ReactDefaultBatchingStrategy.js

```javascript
var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  batchedUpdates: function (callback, a, b, c, d, e) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    // Đặt cờ batch = true
    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    if (alreadyBatchingUpdates) {
      // Đang trong batch rồi → chỉ gọi callback thôi
      return callback(a, b, c, d, e);
    } else {
      // Chưa batch → bọc trong transaction!
      return transaction.perform(callback, null, a, b, c, d, e);
      // → Khi transaction close:
      //   ① isBatchingUpdates = false
      //   ② flushBatchedUpdates() → xử lý dirtyComponents!
    }
  },
};
```

```
  ⚠ TẠI SAO setState LÀ "BẤT ĐỒNG BỘ"?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  THỰC TẾ: setState KHÔNG thực sự async!               │
  │  → Nó là ĐỒNG BỘ, nhưng bị BATCH!                   │
  │                                                        │
  │  ═══ TRONG event handler (React events) ═══           │
  │  ┌──────────────────────────────────────────┐          │
  │  │  handleClick() {                         │          │
  │  │    // isBatchingUpdates = true!           │          │
  │  │    this.setState({a: 1}); // → queue     │          │
  │  │    console.log(this.state.a); // CHƯA!   │          │
  │  │    this.setState({b: 2}); // → queue     │          │
  │  │    // Sau khi hàm xong → flush updates! │          │
  │  │  }                                       │          │
  │  │  → 2 setState = 1 lần render!            │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ═══ NGOÀI event handler (setTimeout, fetch) ═══      │
  │  ┌──────────────────────────────────────────┐          │
  │  │  setTimeout(() => {                      │          │
  │  │    // isBatchingUpdates = false!          │          │
  │  │    this.setState({a: 1}); // → NGAY!     │          │
  │  │    console.log(this.state.a); // = 1 ✓   │          │
  │  │    this.setState({b: 2}); // → NGAY!     │          │
  │  │  }, 0);                                  │          │
  │  │  → 2 setState = 2 lần render!            │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  💡 Tóm lại:                                           │
  │  → Trong React event: BATCH (gộp update)              │
  │  → Ngoài React event: NGAY LẬP TỨC                   │
  │  → Muốn đọc state mới? Dùng callback:                │
  │    setState({a: 1}, () => console.log(this.state.a))  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Diff Algorithm — Thuật Toán So Sánh

```
═══════════════════════════════════════════════════════════════
  DIFF = O(n) THAY VÌ O(n³) NHỜ 3 GIẢ ĐỊNH THÔNG MINH!
═══════════════════════════════════════════════════════════════


  VẤN ĐỀ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  So sánh 2 cây DOM truyền thống = O(n³)!             │
  │  (n = số nodes)                                        │
  │                                                        │
  │  1000 nodes → 1,000,000,000 phép so sánh!             │
  │  → KHÔNG THỂ chấp nhận cho UI!                        │
  │                                                        │
  │  React giảm xuống O(n) nhờ 3 GIẢ ĐỊNH:               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ① TREE DIFF: Hiếm khi di chuyển node  │          │
  │  │     qua các tầng (cross-level).          │          │
  │  │     → Chỉ so sánh CÙNG TẦNG!           │          │
  │  │                                          │          │
  │  │  ② COMPONENT DIFF: Cùng class →        │          │
  │  │     generate cùng cấu trúc cây.          │          │
  │  │     Khác class → cây KHÁC HOÀN TOÀN.   │          │
  │  │                                          │          │
  │  │  ③ ELEMENT DIFF: Siblings có KEY duy    │          │
  │  │     nhất → tránh tạo/xóa không cần!    │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ① TREE DIFF — Chỉ so sánh cùng tầng!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Old Tree:              New Tree:                      │
  │      A                      A                          │
  │    / | \                  / | \                        │
  │   B  C  D                B  C  D                      │
  │  /|     |               /|     |                      │
  │ E  F    G              E  F    H   ← G→H (cùng tầng) │
  │                                                        │
  │  So sánh:                                              │
  │  Tầng 0: A ↔ A ✓ (giữ nguyên)                       │
  │  Tầng 1: B ↔ B ✓, C ↔ C ✓, D ↔ D ✓               │
  │  Tầng 2: E ↔ E ✓, F ↔ F ✓, G ↔ H ✗ (thay G→H)   │
  │                                                        │
  │  ⚠ NẾU di chuyển node qua tầng:                       │
  │  Old:       New:                                       │
  │    A          A                                        │
  │   / \        / \                                      │
  │  B   C      C   B                                     │
  │ /            \                                        │
  │ D             D                                       │
  │                                                        │
  │  React KHÔNG di chuyển D sang C!                      │
  │  → Xóa toàn bộ B + D (unmount)                       │
  │  → Tạo mới B trống + D mới dưới C (remount)          │
  │  → TỐN KÉM! Tránh thay đổi cấu trúc cây!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ② COMPONENT DIFF — Cùng type thì update, khác thì replace!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÙNG TYPE (cùng class):                               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Old: <UserProfile name="A" />           │          │
  │  │  New: <UserProfile name="B" />           │          │
  │  │  → Cùng type → UPDATE (diff props)!     │          │
  │  │  → Gọi shouldComponentUpdate             │          │
  │  │  → Giữ instance, gọi lifecycle          │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  KHÁC TYPE (khác class):                               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Old: <UserProfile />                    │          │
  │  │  New: <AdminProfile />                   │          │
  │  │  → Khác type → REPLACE TOÀN BỘ!        │          │
  │  │  → Unmount UserProfile + tất cả con!    │          │
  │  │  → Mount mới AdminProfile!              │          │
  │  │  → KHÔNG so sánh bên trong nữa!        │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — shouldUpdateReactComponent.js

```javascript
function shouldUpdateReactComponent(prevElement, nextElement) {
  var prevEmpty = prevElement === null || prevElement === false;
  var nextEmpty = nextElement === null || nextElement === false;

  if (prevEmpty || nextEmpty) {
    return prevEmpty === nextEmpty;
  }

  var prevType = typeof prevElement;
  var nextType = typeof nextElement;

  if (prevType === "string" || prevType === "number") {
    // Text/number → chỉ cần update nội dung
    return nextType === "string" || nextType === "number";
  } else {
    // Object → so sánh TYPE + KEY!
    return (
      nextType === "object" &&
      prevElement.type === nextElement.type &&
      prevElement.key === nextElement.key
    );
  }
}
```

```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ③ ELEMENT DIFF — 3 thao tác: INSERT, MOVE, REMOVE!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  3 THAO TÁC:                                           │
  │  ┌──────────────────────────────────────────┐          │
  │  │  INSERT_MARKUP → Thêm node MỚI         │          │
  │  │  MOVE_EXISTING → Di chuyển node CŨ      │          │
  │  │  REMOVE_NODE   → Xóa node THỪA         │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  VÍ DỤ VỚI KEY:                                        │
  │                                                        │
  │  Old: [A, B, C, D]                                     │
  │  New: [B, A, D, C]                                     │
  │                                                        │
  │  CÓ KEY → React so sánh theo key:                     │
  │  ┌──────────────────────────────────────────┐          │
  │  │  nextIndex  lastIndex  Thao tác          │          │
  │  │  ──────────────────────────────────────  │          │
  │  │  B: idx=0   last=0     B._mount=1 > 0   │          │
  │  │                        → KHÔNG move!    │          │
  │  │                        lastIdx = max(1,0)│          │
  │  │                        = 1               │          │
  │  │                                          │          │
  │  │  A: idx=1   last=1     A._mount=0 < 1   │          │
  │  │                        → MOVE A tới 1!  │          │
  │  │                        lastIdx = max(0,1)│          │
  │  │                        = 1               │          │
  │  │                                          │          │
  │  │  D: idx=2   last=1     D._mount=3 > 1   │          │
  │  │                        → KHÔNG move!    │          │
  │  │                        lastIdx = max(3,1)│          │
  │  │                        = 3               │          │
  │  │                                          │          │
  │  │  C: idx=3   last=3     C._mount=2 < 3   │          │
  │  │                        → MOVE C tới 3!  │          │
  │  │                        lastIdx = max(2,3)│          │
  │  │                        = 3               │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  → Chỉ MOVE 2 node (A, C)! Tiết kiệm!               │
  │                                                        │
  │  KHÔNG CÓ KEY → unmount TẤT CẢ + mount lại!          │
  │  → Rất lãng phí!                                       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactMultiChild.js (\_updateChildren)

```javascript
_updateChildren: function (
  nextNestedChildrenElements, transaction, context
) {
  var prevChildren = this._renderedChildren;
  var removedNodes = {};
  var mountImages = [];
  var nextChildren = this._reconcileUpdateChildren(
    prevChildren, nextNestedChildrenElements,
    mountImages, removedNodes, transaction, context
  );

  if (!nextChildren && !prevChildren) {
    return;
  }

  var updates = null;
  var name;
  var nextIndex = 0;
  var lastIndex = 0;
  var nextMountIndex = 0;
  var lastPlacedNode = null;

  for (name in nextChildren) {
    if (!nextChildren.hasOwnProperty(name)) {
      continue;
    }
    var prevChild = prevChildren && prevChildren[name];
    var nextChild = nextChildren[name];

    if (prevChild === nextChild) {
      // ← CÙNG instance → có thể MOVE!
      updates = enqueue(updates,
        this.moveChild(prevChild, lastPlacedNode,
          nextIndex, lastIndex)
      );
      lastIndex = Math.max(prevChild._mountIndex, lastIndex);
      prevChild._mountIndex = nextIndex;
    } else {
      if (prevChild) {
        // ← Có prev nhưng khác → prev bị thay thế
        lastIndex = Math.max(prevChild._mountIndex, lastIndex);
      }
      // ← Mount child MỚI (INSERT_MARKUP)
      updates = enqueue(updates,
        this._mountChildAtIndex(nextChild,
          mountImages[nextMountIndex],
          lastPlacedNode, nextIndex,
          transaction, context)
      );
      nextMountIndex++;
    }
    nextIndex++;
    lastPlacedNode = ReactReconciler.getHostNode(nextChild);
  }

  // Xóa các node THỪA (REMOVE_NODE)
  for (name in removedNodes) {
    if (removedNodes.hasOwnProperty(name)) {
      updates = enqueue(updates,
        this._unmountChild(prevChildren[name],
          removedNodes[name])
      );
    }
  }

  if (updates) {
    processQueue(this, updates);
  }
  this._renderedChildren = nextChildren;
}
```

```
  ⚠ TRƯỜNG HỢP XẤU NHẤT CỦA ELEMENT DIFF:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Old: [A, B, C, D]                                     │
  │  New: [D, A, B, C]                                     │
  │                                                        │
  │  Thuật toán sẽ:                                        │
  │  D: _mount=3 ≥ last=0 → KHÔNG move! last=3           │
  │  A: _mount=0 < last=3 → MOVE A! last=3                │
  │  B: _mount=1 < last=3 → MOVE B! last=3                │
  │  C: _mount=2 < last=3 → MOVE C! last=3                │
  │                                                        │
  │  → MOVE 3 nodes! (A, B, C đều phải di chuyển)        │
  │  → LÝ TƯỞNG chỉ cần move D ra đầu!                  │
  │  → Đây là HẠNG CHẾ của thuật toán!                   │
  │                                                        │
  │  💡 BEST PRACTICE:                                     │
  │  → TRÁNH đưa node cuối lên đầu danh sách!            │
  │  → Dùng KEY ổn định (id), KHÔNG dùng index!           │
  │  → Tránh thay đổi cấu trúc cây quá nhiều!            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Một Số Điểm Khác — ReactClassInterface

```
═══════════════════════════════════════════════════════════════
  REACTCLASSINTERFACE = HỢP ĐỒNG ĐỊNH NGHĨA COMPONENT!
═══════════════════════════════════════════════════════════════


  ReactClassInterface quy định CÁCH MERGE mỗi method:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌────────────────────┬──────────────────────────────┐ │
  │  │ Method             │ Merge Strategy               │ │
  │  ├────────────────────┼──────────────────────────────┤ │
  │  │ mixins             │ DEFINE_MANY                  │ │
  │  │ statics            │ DEFINE_MANY                  │ │
  │  │ propTypes           │ DEFINE_MANY                  │ │
  │  │ contextTypes        │ DEFINE_MANY                  │ │
  │  │ childContextTypes   │ DEFINE_MANY                  │ │
  │  ├────────────────────┼──────────────────────────────┤ │
  │  │ getDefaultProps     │ DEFINE_MANY_MERGED           │ │
  │  │ getInitialState     │ DEFINE_MANY_MERGED           │ │
  │  │ getChildContext     │ DEFINE_MANY_MERGED           │ │
  │  ├────────────────────┼──────────────────────────────┤ │
  │  │ render             │ DEFINE_ONCE ← DUY NHẤT!     │ │
  │  │ shouldComponent    │ DEFINE_ONCE ← DUY NHẤT!     │ │
  │  │ Update             │                              │ │
  │  ├────────────────────┼──────────────────────────────┤ │
  │  │ componentWillMount │ DEFINE_MANY                  │ │
  │  │ componentDidMount  │ DEFINE_MANY                  │ │
  │  │ componentWillUpdate│ DEFINE_MANY                  │ │
  │  │ componentDidUpdate │ DEFINE_MANY                  │ │
  │  │ componentWill      │ DEFINE_MANY                  │ │
  │  │ ReceiveProps       │                              │ │
  │  │ componentWill      │ DEFINE_MANY                  │ │
  │  │ Unmount            │                              │ │
  │  ├────────────────────┼──────────────────────────────┤ │
  │  │ updateComponent    │ OVERRIDE_BASE                │ │
  │  └────────────────────┴──────────────────────────────┘ │
  │                                                        │
  │  Giải thích:                                           │
  │  • DEFINE_MANY: Có thể định nghĩa NHIỀU LẦN          │
  │    (qua mixins). Tất cả đều được gọi!                 │
  │  • DEFINE_MANY_MERGED: Nhiều lần nhưng merge          │
  │    kết quả (Object.assign-style)!                      │
  │  • DEFINE_ONCE: CHỈ 1 LẦN! (lỗi nếu define 2 lần)  │
  │  • OVERRIDE_BASE: Cho phép ghi đè method cơ sở!      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §11. Tóm Tắt & Câu Hỏi Phỏng Vấn

```
═══════════════════════════════════════════════════════════════
  TÓM TẮT TOÀN BỘ FOREWORD
═══════════════════════════════════════════════════════════════


  BẢN ĐỒ TƯ DUY REACT INTERNALS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React Source Code v15.4.1                             │
  │  ┌──────────────────────────────────────────┐          │
  │  │                                          │          │
  │  │  ┌── Data Layer ──────────────────────┐  │          │
  │  │  │  ReactElement (bản thiết kế UI)    │  │          │
  │  │  │  → type, props, key, ref          │  │          │
  │  │  └────────────────────────────────────┘  │          │
  │  │            │                              │          │
  │  │            ▼                              │          │
  │  │  ┌── Control Layer ───────────────────┐  │          │
  │  │  │  ReactComponent (điều khiển)       │  │          │
  │  │  │  → state, lifecycle, methods      │  │          │
  │  │  │  4 loại: Empty/Text/DOM/Composite │  │          │
  │  │  └────────────────────────────────────┘  │          │
  │  │            │                              │          │
  │  │            ▼                              │          │
  │  │  ┌── API Layer ──────────────────────┐   │          │
  │  │  │  ReactClass (createClass / ES6)    │  │          │
  │  │  │  → autobind, mixins, interface   │  │          │
  │  │  └────────────────────────────────────┘  │          │
  │  │            │                              │          │
  │  │            ▼                              │          │
  │  │  ┌── Performance Layer ──────────────┐   │          │
  │  │  │  Object Pool → giảm GC           │  │          │
  │  │  │  Transaction → batch operations   │  │          │
  │  │  │  Event Delegation → gộp events   │  │          │
  │  │  │  Diff Algorithm → O(n) so sánh   │  │          │
  │  │  └────────────────────────────────────┘  │          │
  │  │            │                              │          │
  │  │            ▼                              │          │
  │  │  ┌── Lifecycle Layer ────────────────┐   │          │
  │  │  │  Mount → willMount/render/didMount│  │          │
  │  │  │  Update → willReceive/should/will │  │          │
  │  │  │  setState → batch + enqueue      │  │          │
  │  │  └────────────────────────────────────┘  │          │
  │  │                                          │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Câu Hỏi Phỏng Vấn Thường Gặp

```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q1. ReactElement và ReactComponent khác nhau thế nào?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: ReactElement = plain object mô tả UI (data class).
     ReactComponent = instance có state, lifecycle (control class).
     Element chỉ chứa type/props/key/ref. Component có methods.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q2. setState là đồng bộ hay bất đồng bộ?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: setState bản chất là ĐỒNG BỘ, nhưng bị BATCHED!
     - Trong React event handler: batch → "trông như" async
     - Trong setTimeout/native events: thực thi NGAY
     - React 18+ auto-batch MỌI NƠI (createRoot)!

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q3. Diff algorithm hoạt động thế nào? Tại sao cần key?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: Dựa trên 3 giả định → giảm O(n³) xuống O(n):
     ① Tree diff: chỉ so sánh cùng tầng
     ② Component diff: cùng type → update, khác → replace
     ③ Element diff: key xác định node để MOVE thay REMOVE+INSERT
     Key giúp React tái sử dụng node thay vì tạo mới!

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q4. Transaction trong React dùng để làm gì?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: Transaction = AOP pattern (wrapper trước/sau):
     - initialize() → method chính → close()
     - Dùng cho: batch state updates, quản lý DOM reads/writes,
       cleanup sau operations
     - KHÔNG giống DB transaction (không có rollback)!

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q5. Tại sao React bind events vào document?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: Event Delegation:
     - Giảm memory (1 listener thay vì N listeners)
     - SyntheticEvent cho cross-browser compatibility
     - Object Pool cho event objects → giảm GC
     - Tự implement bubbling trong React tree

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q6. componentDidMount được gọi ở đâu, khi nào?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: componentDidMount KHÔNG gọi ngay sau render()!
     → Được enqueue vào transaction callback queue
     → Chạy SAU KHI toàn bộ tree mount xong
     → Thứ tự: bottom-up (con trước, cha sau)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q7. Object Pool trong React giúp ích gì?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: Giảm Memory Churn → giảm GC pressure:
     - getPooled(): lấy object từ pool (tái sử dụng)
     - release(): trả object về pool (reset fields = null)
     - Pool size mặc định = 10
     - Dùng cho: transactions, synthetic events, callbacks

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q8. PureComponent khác Component thế nào (trong mã nguồn)?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: Trong updateComponent, khi KHÔNG có shouldComponentUpdate:
     - Component (ImpureClass): LUÔN return true → luôn render
     - PureComponent (PureClass): tự động shallowEqual(props)
       && shallowEqual(state) → tránh render không cần thiết!
```

---

> **Kết luận:** Phần Foreword này cung cấp nền tảng để hiểu sâu hơn về React Internals. Mỗi phần tiếp theo trong loạt bài phân tích sẽ đi sâu vào từng module cụ thể: `ReactDOM.render`, `ReactReconciler`, `ReactDOMComponent`, v.v. Mục tiêu là có thể đọc mã nguồn React một cách tự tin và tìm ra giải pháp cho các vấn đề hiệu suất trong dự án thực tế.

---

# PHẦN 2: React Source Code Analysis — Series Hoàn Chỉnh (v15)

> Loạt bài phân tích mã nguồn React v15 hoàn chỉnh, chia thành 4 phần:
>
> - **Part 1:** Component Implementation & Mounting
> - **Part 2:** Component Types & Lifecycles
> - **Part 3:** Transactions & Update Queues
> - **Part 4:** Event System

---

## §12. Lời Nói Đầu Series — 3 Vấn Đề & 3 Cải Tiến

```
═══════════════════════════════════════════════════════════════
  BÀI HỌC TỪ VIẾT SOURCE CODE ANALYSIS!
═══════════════════════════════════════════════════════════════


  3 VẤN ĐỀ KHI VIẾT PHÂN TÍCH MÃ NGUỒN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① QUÁ NHIỀU CODE MẪU:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  → Hầu hết mọi người đều có thể ĐOÁN được     │  │
  │  │    luồng nội bộ từ lifecycle API                 │  │
  │  │  → Quá nhiều code → NHÀM CHÁN!                 │  │
  │  │  → Code dài + comment lớn → giảm trải nghiệm  │  │
  │  │    đọc NGHIÊM TRỌNG!                            │  │
  │  │                                                  │  │
  │  │  ❌ Sai:                                         │  │
  │  │  // dòng 1: khai báo biến x                     │  │
  │  │  // dòng 2: gán giá trị y                       │  │
  │  │  // dòng 3: gọi hàm z                           │  │
  │  │  // ... (100 dòng comment dư thừa)              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② PHÂN TÍCH KIỂU "LUỒNG Ý THỨC":                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Code = luồng ý thức cho MÁY TÍNH               │  │
  │  │  Phân tích code ≠ luồng ý thức cho CON NGƯỜI!  │  │
  │  │                                                  │  │
  │  │  ❌ Sai: Cố hiểu TỪNG DÒNG, TỪNG BIẾN         │  │
  │  │    → "Tụng kinh" — nhạt nhẽo, vô hồn!         │  │
  │  │                                                  │  │
  │  │  ✅ Đúng: BIRD'S-EYE VIEW (nhìn tổng quan)     │  │
  │  │    → Hiểu architecture trước, chi tiết sau!     │  │
  │  │    → Viết phân tích từ GÓC NHÌN CAO!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ THIẾU RÚT GỌN / TINH HOA:                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Giống bài văn cần "TƯ TƯỞNG TRUNG TÂM"!      │  │
  │  │                                                  │  │
  │  │  → Đọc xong phân tích source code...            │  │
  │  │    Người đọc HIỂU gì? Tác giả RÚT RA gì?      │  │
  │  │  → Nhiều bài → đọc xong HIỂU ĐƯỢC mà            │  │
  │  │    không HIỂU ĐƯỢC → mơ hồ hoàn toàn!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  3 CẢI TIẾN ĐÃ ÁP DỤNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① GIẢM CODE, TĂNG HÌNH ẢNH:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Con người tiếp thu HÌNH ẢNH nhanh hơn CHỮ!    │  │
  │  │  (→ Vì sao "HTTP Illustrated" bán chạy toàn cầu)│ │
  │  │                                                  │  │
  │  │  → Bỏ code thừa, thay bằng MIND MAP            │  │
  │  │  → Bỏ giải thích dàidòng, thay bằng FLOWCHART │  │
  │  │  → Chỉ GIỮ code quan trọng!                    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② CẢI THIỆN LAYOUT:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Code dài → trải nghiệm đọc KHÔNG TỐT          │  │
  │  │  (Đặc biệt trên mobile!)                        │  │
  │  │                                                  │  │
  │  │  → Dùng công cụ hiển thị code đẹp hơn          │  │
  │  │  → Chia code thành ĐOẠN NHỎ có giải thích      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ RÚT GỌN Ý TƯỞNG (Idea Extraction):                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Mục tiêu đọc source code KHÔNG PHẢI để        │  │
  │  │  viết lại React/Vue!                             │  │
  │  │                                                  │  │
  │  │  → Mà để HỌC Ý TƯỞNG + PHƯƠNG PHÁP            │  │
  │  │  → Áp dụng vào DỰ ÁN THỰC TẾ                  │  │
  │  │  → Nâng cao KỸ NĂNG LẬP TRÌNH!                 │  │
  │  │                                                  │  │
  │  │  Mỗi bài phân tích sẽ có phần:                 │  │
  │  │    ✦ "LÀ GÌ" (What) — kiến thức               │  │
  │  │    ✦ "TẠI SAO" (Why) — tư duy                  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  MỤC LỤC SERIES (React v15):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Part 1: Component Implementation & Mounting           │
  │  ─────────────────────────────────────────             │
  │  → Component là gì? (= JavaScript Object!)            │
  │  → Component khởi tạo như thế nào?                    │
  │  → Component mount lên DOM ra sao?                    │
  │                                                        │
  │  Part 2: Component Types & Lifecycles                  │
  │  ─────────────────────────────────────────             │
  │  → 4 loại component chi tiết                          │
  │  → Lifecycle đầy đủ từ mount → update → unmount      │
  │                                                        │
  │  Part 3: Transactions & Update Queues                  │
  │  ─────────────────────────────────────────             │
  │  → Transaction mechanism chi tiết                     │
  │  → setState batching & update queue                   │
  │                                                        │
  │  Part 4: Event System                                  │
  │  ─────────────────────────────────────────             │
  │  → Event delegation trên document                     │
  │  → SyntheticEvent & event pooling                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §13. Part 1: Component — Thực Thể & Quá Trình Mount

```
═══════════════════════════════════════════════════════════════
  COMPONENT = KHÔNG PHẢI DOM! LÀ JAVASCRIPT OBJECT!
═══════════════════════════════════════════════════════════════
```

### 13.1. Component Là Gì?

```
  THỰC NGHIỆM: console.log(<A />) là gì?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Viết 1 component đơn giản:                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  class A extends React.Component {       │          │
  │  │    render() {                            │          │
  │  │      return <div>Đây là component A</div>│          │
  │  │    }                                     │          │
  │  │  }                                       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  console.log(<A />):                                   │
  │  ┌──────────────────────────────────────────┐          │
  │  │  {                                       │          │
  │  │    $$typeof: Symbol(react.element),      │          │
  │  │    type: function A,                     │          │
  │  │    key: null,                            │          │
  │  │    ref: null,                            │
  │  │    props: {},      ← TRỐNG! (không truyền props) │
  │  │    _owner: null                          │          │
  │  │  }                                       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  → <A /> KHÔNG phải DOM thật!                         │
  │  → Chỉ là 1 JAVASCRIPT OBJECT!                       │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  KHI LỒNG COMPONENT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  console.log(<A><div>Đây là A</div></A>):             │
  │                                                        │
  │  {                                                     │
  │    $$typeof: Symbol(react.element),                    │
  │    type: function A,                                   │
  │    key: null,                                          │
  │    ref: null,                                          │
  │    props: {                                            │
  │      children: {                 ← ĐÃ CÓ children!   │
  │        $$typeof: Symbol(react.element),                │
  │        type: "div",              ← string = DOM tag!  │
  │        props: {                                        │
  │          children: "Đây là A"   ← text content!      │
  │        }                                               │
  │      }                                                 │
  │    },                                                  │
  │    _owner: null                                        │
  │  }                                                     │
  │                                                        │
  │                                                        │
  │  QUY TẮC:                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  • Component con → thêm vào props.children      │  │
  │  │    của component cha!                             │  │
  │  │                                                  │  │
  │  │  • Lồng NHIỀU cấp = LỒNG nhiều tầng object!    │  │
  │  │    Parent { props: { children: Child { ... } } } │  │
  │  │                                                  │  │
  │  │  • ES5 createClass({}) cho KẾT QUẢ GIỐNG HỆT!  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.2. Component Được Xây Dựng Từ Đâu?

```
  CÂU HỎI: <A /> trông giống HTML nhưng thực ra là OBJECT
  → Nó được tạo ra NHƯ THẾ NÀO?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Bước 1: Mở React.js (entry point)                    │
  │  ┌──────────────────────────────────────────┐          │
  │  │  var React = {                           │          │
  │  │    Component: ReactComponent,            │          │
  │  │    createElement: ReactElement.createElement, │     │
  │  │    createClass: ReactClass.createClass,   │          │
  │  │    ...                                   │          │
  │  │  };                                      │          │
  │  │  module.exports = React;                 │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  Khi import React from 'react':                        │
  │  → Lấy được object React ở trên!                     │
  │                                                        │
  │  Khi extends Component:                                │
  │  → Kế thừa từ ReactComponent class!                  │
  │                                                        │
  │                                                        │
  │  2 ĐIỂM CẦN LƯU Ý:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① module.exports vs export default:             │  │
  │  │     Source code dùng module.exports (CommonJS)   │  │
  │  │     Nhưng vẫn import được nhờ BABEL PARSER!     │  │
  │  │     → import (ES6) === require (CommonJS)       │  │
  │  │     ⚠ TypeScript NGHIÊM NGẶT hơn,              │  │
  │  │       không chấp nhận cách import này!           │  │
  │  │                                                  │  │
  │  │  ② extends Component vs extends React.Component: │  │
  │  │     KHÔNG CÓ KHÁC BIỆT!                         │  │
  │  │     Component === React.Component (cùng ref!)    │  │
  │  │     Dùng cách nào cũng được!                     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.3. ReactComponent — Base Class Constructor

```javascript
// node_modules/react/lib/ReactComponent.js

// ═══════════════════════════════════════════════════════════
// ReactComponent = Constructor Function cơ bản!
// ═══════════════════════════════════════════════════════════

function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

// setState → đẩy state vào HÀNG ĐỢI (queue)
ReactComponent.prototype.setState = function (partialState, callback) {
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, "setState");
  }
};

// forceUpdate → ép re-render (bỏ qua shouldComponentUpdate)
ReactComponent.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this);
  if (callback) {
    this.updater.enqueueCallback(this, callback, "forceUpdate");
  }
};
```

```
  PROTOTYPE CHAIN CỦA COMPONENT A:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  class A extends Component { ... }                     │
  │                                                        │
  │  A.__proto__ = ReactComponent                          │
  │                                                        │
  │  A instance:                                           │
  │  ┌──────────────────────────────────────────┐          │
  │  │  this.props                              │          │
  │  │  this.context                            │          │
  │  │  this.refs                               │          │
  │  │  this.updater                            │          │
  │  │  ──── __proto__ ─────────────────        │          │
  │  │  │  render()          (A tự định nghĩa)│          │
  │  │  │  handleClick()     (A tự định nghĩa)│          │
  │  │  │  ──── __proto__ ──────────────        │          │
  │  │  │  │  setState()     (ReactComponent) │          │
  │  │  │  │  forceUpdate()  (ReactComponent) │          │
  │  │  └──┘──────────────────────────────────┘          │
  │                                                        │
  │  → Component A = ReactComponent subclass              │
  │  → Có setState, forceUpdate trên prototype chain      │
  │  → Đây là "hình dạng cơ bản nhất" của component!     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.4. Component Khởi Tạo — Babel Biên Dịch JSX

```
  JSX → BABEL → React.createElement (ReactElement)
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CODE GỐC (ES6 + JSX):                                │
  │  ┌──────────────────────────────────────────┐          │
  │  │  class A extends Component {             │          │
  │  │    render() {                            │          │
  │  │      return <div>Đây là A</div>          │          │
  │  │    }                                     │          │
  │  │  }                                       │          │
  │  └──────────┬───────────────────────────────┘          │
  │             │ Babel biên dịch                          │
  │             ▼                                          │
  │  ┌──────────────────────────────────────────┐          │
  │  │  var A = (function (_Component) {        │          │
  │  │    _inherits(A, _Component);             │          │
  │  │                                          │          │
  │  │    function A() {                        │          │
  │  │      _classCallCheck(this, A);           │          │
  │  │      return _possibleConstructorReturn(  │          │
  │  │        this, _Component.apply(this, args)│          │
  │  │      );                                  │          │
  │  │    }                                     │          │
  │  │                                          │          │
  │  │    A.prototype.render = function() {     │          │
  │  │      return React.createElement(         │          │
  │  │        'div', null, 'Đây là A'          │          │
  │  │      );   ← ⭐ PHÁT HIỆN QUAN TRỌNG!   │          │
  │  │    };                                    │          │
  │  │                                          │          │
  │  │    return A;                             │          │
  │  │  })(Component);                          │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ⭐ PHÁT HIỆN:                                         │
  │  → render() method thực chất gọi React.createElement! │
  │  → React.createElement = ReactElement.createElement   │
  │  → Trả về 1 ReactElement object!                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.5. ReactElement — Đối Tượng Mô Tả Component

```
  ReactElement.js — Tạo "description object":
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React.createElement() → trả về ReactElement object:  │
  │                                                        │
  │  ReactElement = {                                      │
  │    $$typeof   → Định danh component (Symbol)          │
  │    key        → ID cấu trúc DOM (tối ưu update)      │
  │    props      → Thông tin con + thuộc tính            │
  │                  (children nếu có, style, class...)    │
  │    ref        → Tham chiếu đến DOM thật              │
  │    _owner     → Object TẠO RA component hiện tại     │
  │                  (ReactCurrentOwner.current)           │
  │                  Mặc định = null                       │
  │  }                                                     │
  │                                                        │
  │                                                        │
  │  BẢNG THAM SỐ REACTELEMENT:                           │
  │  ┌────────────┬────────────────────────────────────┐   │
  │  │ Tham số    │ Chức năng                          │   │
  │  ├────────────┼────────────────────────────────────┤   │
  │  │ $$typeof   │ Định danh loại component           │   │
  │  │ key        │ Cải thiện hiệu suất cập nhật      │   │
  │  │ props      │ Chứa children (nếu có) + style... │   │
  │  │ ref        │ Tham chiếu DOM thật               │   │
  │  │ _owner     │ Đối tượng tạo ra component này    │   │
  │  └────────────┴────────────────────────────────────┘   │
  │                                                        │
  │                                                        │
  │  TÓM TẮT:                                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  JSX (<A />) → Babel → React.createElement()    │  │
  │  │     → ReactElement (JS object)                   │  │
  │  │                                                  │  │
  │  │  Cho đến khi được PARSE thành DOM thật,          │  │
  │  │  React component vẫn CHỈ LÀ JavaScript object  │  │
  │  │  kiểu ReactElement!                              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.6. Component Mounting — Cách React Chèn Vào DOM

```
═══════════════════════════════════════════════════════════════
  REACTDOM.RENDER() = ENTRY POINT ĐỂ MOUNT COMPONENT!
═══════════════════════════════════════════════════════════════


  LUỒNG GỌI NỘI BỘ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactDOM.render(<A />, container)                     │
  │      │                                                │
  │      ▼                                                │
  │  ReactMount.render()                                   │
  │      │                                                │
  │      ▼                                                │
  │  ReactMount._renderSubtreeIntoContainer()              │
  │  (= chèn "cây DOM con" vào container)                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  THAM SỐ _renderSubtreeIntoContainer:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────┬───────────────────────────────┐   │
  │  │ Tham số         │ Chức năng                     │   │
  │  ├─────────────────┼───────────────────────────────┤   │
  │  │ parentComponent │ Component cha, lần đầu = null │   │
  │  │ nextElement     │ Component cần mount           │   │
  │  │                 │ (VD: <A /> → ReactElement)   │   │
  │  │ container       │ DOM container (VD: #root)     │   │
  │  │ callback        │ Callback sau khi mount xong   │   │
  │  └─────────────────┴───────────────────────────────┘   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  LOGIC BÊN TRONG _renderSubtreeIntoContainer:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Dòng 1: Thêm component hiện tại vào props            │
  │    └── Quan hệ cha-con được xây qua props.children   │
  │                                                        │
  │  Dòng 2-22: Kiểm tra prevComponent trong container    │
  │    │                                                   │
  │    ├── CÓ prevComponent:                               │
  │    │   └── Gọi _updateRootComponent()                 │
  │    │       (= cập nhật, KHÔNG mount mới!)             │
  │    │                                                   │
  │    └── KHÔNG CÓ prevComponent:                         │
  │        └── Gỡ bỏ (unmountComponentAtNode)             │
  │                                                        │
  │  Dòng 24: DÙ update hay unmount → cuối cùng phải     │
  │    MOUNT lên DOM thật!                                 │
  │    └── Gọi _renderNewRootComponent()                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  _renderNewRootComponent — LUỒNG MOUNT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  _renderNewRootComponent()                             │
  │      │                                                │
  │      ▼ ① instantiateReactComponent()                  │
  │      │   → Bọc component thành ĐÚNG LOẠI             │
  │      │   → Trả về componentInstance                   │
  │      │                                                │
  │      ▼ ② batchedMountComponentIntoNode()              │
  │      │   → Dạng TRANSACTION!                          │
  │      │   → Gọi mountComponentIntoNode()               │
  │      │   → mountComponent() trả về HTML markup        │
  │      │                                                │
  │      ▼ ③ _mountImageIntoNode()                        │
  │          → Gọi cuối cùng!                             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — \_mountImageIntoNode

```javascript
// ═══════════════════════════════════════════════════════════
// _mountImageIntoNode — CHÈN HTML VÀO DOM THẬT!
// ═══════════════════════════════════════════════════════════

_mountImageIntoNode = function (
  markup,
  container,
  instance,
  shouldReuseMarkup,
  transaction,
) {
  // ① Set innerHTML = markup
  //    → Chèn HTML đã render vào container!
  setInnerHTML(container, markup);

  // ② Cache component object đã xử lý
  //    → Tăng tốc cập nhật cấu trúc về sau!
  ReactDOMComponentTree.precacheNode(instance, container.firstChild);
};
```

```
  GIẢI THÍCH _mountImageIntoNode:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setInnerHTML(container, markup):                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  container = <div id="root"></div>               │  │
  │  │  markup = "<div>Đây là A</div>" (HTML string)   │  │
  │  │                                                  │  │
  │  │  → container.innerHTML = markup                  │  │
  │  │  → DOM thật bây giờ:                             │  │
  │  │    <div id="root">                               │  │
  │  │      <div>Đây là A</div>   ← ĐÃ MOUNT!        │  │
  │  │    </div>                                        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  precacheNode(instance, container.firstChild):         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  → Lưu component object vào CACHE               │  │
  │  │  → Lần update sau → tìm nhanh hơn!             │  │
  │  │  → Không cần traverse DOM!                      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.7. instantiateReactComponent — 4 Loại Component

```
  FACTORY: Tạo đúng loại component dựa vào input!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  instantiateReactComponent(node)                       │
  │      │                                                │
  │      ├── node === null/false ?                          │
  │      │   → ReactEmptyComponent                        │
  │      │   (component RỖNG — render ra nothing!)        │
  │      │                                                │
  │      ├── typeof node === 'object' ?                     │
  │      │   ├── type === 'string' ? ('div','span'...)     │
  │      │   │   → ReactDOMComponent                      │
  │      │   │   (Virtual DOM → DOM element thật!)        │
  │      │   │                                            │
  │      │   └── type !== 'string' ? (class/function)      │
  │      │       → ReactCompositeComponent                │
  │      │       (⭐ React component TÙY CHỈNH!)          │
  │      │       (Có lifecycle, state, render!)            │
  │      │                                                │
  │      └── typeof node === 'string'/'number' ?            │
  │          → ReactDOMTextComponent                      │
  │          (Text node — chỉ hiển thị chuỗi/số!)        │
  │                                                        │
  │                                                        │
  │  BẢNG TÓM TẮT:                                        │
  │  ┌───────────────────┬──────────────┬────────────────┐ │
  │  │ node              │ Tham số TT   │ Kết quả        │ │
  │  ├───────────────────┼──────────────┼────────────────┤ │
  │  │ null / false      │ null         │ EmptyComponent │ │
  │  │ object + string   │ Virtual DOM  │ DOMComponent   │ │
  │  │ object + non-str  │ React comp   │ Composite      │ │
  │  │ string            │ "hello"      │ TextComponent  │ │
  │  │ number            │ 42           │ TextComponent  │ │
  │  └───────────────────┴──────────────┴────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — instantiateReactComponent.js

```javascript
function instantiateReactComponent(node, shouldHaveDebugID) {
  var instance;

  if (node === null || node === false) {
    // ① EMPTY → ReactEmptyComponent
    instance = ReactEmptyComponent.create(instantiateReactComponent);
  } else if (typeof node === "object") {
    var element = node;
    if (typeof element.type === "string") {
      // ② DOM ELEMENT ('div', 'span'...) → ReactDOMComponent
      instance = ReactHostComponent.createInternalComponent(element);
    } else if (isInternalComponentType(element.type)) {
      // Internal type (sẽ bỏ trong tương lai)
      instance = new element.type(element);
    } else {
      // ③ CUSTOM COMPONENT → ReactCompositeComponent
      instance = new ReactCompositeComponentWrapper(element);
    }
  } else if (typeof node === "string" || typeof node === "number") {
    // ④ TEXT → ReactDOMTextComponent
    instance = ReactHostComponent.createInstanceForText(node);
  }

  // Hai fields dùng cho diffing algorithm
  instance._mountIndex = 0;
  instance._mountImage = null;

  return instance;
}
```

### 13.8. Quy Trình Mount — 3 Bước Chính

```
  TOÀN BỘ QUY TRÌNH MOUNT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  BƯỚC 1: Bọc component thành 4 loại                   │
  │  ──────────────────────────────────                    │
  │  ReactDOM.render(<A />, container)                     │
  │          │                                             │
  │          ▼                                             │
  │  instantiateReactComponent(<A />)                      │
  │          │                                             │
  │          ▼                                             │
  │  ┌──────────────────────────┐                          │
  │  │ ReactCompositeComponent  │  (vì <A /> là custom)   │
  │  └───────────┬──────────────┘                          │
  │              │                                         │
  │              ▼                                         │
  │  BƯỚC 2: Lấy HTML markup từ component                 │
  │  ──────────────────────────────────                    │
  │  mountComponentIntoNode()                              │
  │          │                                             │
  │          ▼                                             │
  │  mountComponent() — mỗi loại component có             │
  │  mountComponent riêng!                                 │
  │          │                                             │
  │          ├── ReactCompositeComponent.mountComponent:   │
  │          │   ① Gán props                              │
  │          │   ② Khởi tạo state                         │
  │          │   ③ Gọi componentWillMount()               │
  │          │   ④ Gọi render() → lấy ReactElement       │
  │          │   ⑤ Gọi componentDidMount()                │
  │          │   ⑥ Đệ quy cho child components           │
  │          │                                             │
  │          ├── ReactDOMComponent.mountComponent:         │
  │          │   → Tạo HTML tag trực tiếp                 │
  │          │                                             │
  │          └── ReactDOMTextComponent.mountComponent:     │
  │              → Tạo text node                          │
  │          │                                             │
  │          ▼                                             │
  │  markup = "<div>Đây là A</div>" (HTML string)         │
  │              │                                         │
  │              ▼                                         │
  │  BƯỚC 3: Chèn HTML vào DOM thật                       │
  │  ──────────────────────────────────                    │
  │  _mountImageIntoNode()                                 │
  │          │                                             │
  │          ▼                                             │
  │  setInnerHTML(container, markup)                        │
  │  → container.innerHTML = markup                        │
  │  → DOM THẬT ĐÃ ĐƯỢC CẬP NHẬT! ✅                     │
  │          │                                             │
  │          ▼                                             │
  │  precacheNode(instance, container.firstChild)          │
  │  → Cache để update nhanh hơn!                         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 13.9. Tóm Tắt Part 1 — Mind Map

```
  TOÀN BỘ LUỒNG TỪ KHAI BÁO → KHỞI TẠO → MOUNT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │                  ReactComponent                        │
  │                 (Base Constructor)                      │
  │  ┌───────┐    ┌───────┐    ┌────────┐                 │
  │  │context│    │ props │    │  refs  │                  │
  │  └───┬───┘    └───┬───┘    └───┬────┘                 │
  │      └──────┬─────┘            │                       │
  │             │                  │     ┌─────────────┐   │
  │             ▼                  │     │  prototype  │   │
  │  ┌──────────────────┐         │     │ ├ setState  │   │
  │  │  updater          │         │     │ └ forceUpdate│  │
  │  │ (ReactNoopUpdate  │         │     └─────────────┘   │
  │  │  Queue)           │         │                       │
  │  └──────────────────┘         │                       │
  │                                │                       │
  │          ┌─────────────────────┘                       │
  │          ▼                                             │
  │  ┌──────────────────────────────────┐                  │
  │  │  Thực thi ReactElement method   │                  │
  │  │  (React.createElement())        │                  │
  │  └───────────────┬────────────────┘                  │
  │                  ▼                                     │
  │  ┌──────────────────────────────────┐                  │
  │  │  Tạo ReactElement object        │                  │
  │  │  (= component <A /> thực tế)    │                  │
  │  └───────────────┬────────────────┘                  │
  │                  ▼                                     │
  │  ┌──────────────────────────────────┐                  │
  │  │  ReactDOM.render(<A/>, container)│                  │
  │  └───────────────┬────────────────┘                  │
  │                  ▼                                     │
  │  ┌──────────────────────────────────┐                  │
  │  │  instantiateReactComponent()    │                  │
  │  │  → Phân loại thành 4 loại:     │                  │
  │  │    • ReactEmptyComponent        │                  │
  │  │    • ReactDOMComponent          │                  │
  │  │    • ReactDOMTextComponent      │                  │
  │  │    • ReactCompositeComponent    │                  │
  │  └───────────────┬────────────────┘                  │
  │                  ▼                                     │
  │  ┌──────────────────────────────────┐                  │
  │  │  mountComponent()               │                  │
  │  │  → Parse ReactElement → HTML   │                  │
  │  │  → Trigger lifecycles!          │                  │
  │  └───────────────┬────────────────┘                  │
  │                  ▼                                     │
  │  ┌──────────────────────────────────┐                  │
  │  │  setInnerHTML → chèn vào DOM!  │                  │
  │  │  precacheNode → cache lại!      │                  │
  │  └──────────────────────────────────┘                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ⭐ RÚT GỌN Ý TƯỞNG (TAKEAWAYS):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. Component = KHÔNG phải DOM, mà là JS Object!      │
  │     → ReactElement object mô tả UI                   │
  │     → Chỉ khi mount mới trở thành DOM thật           │
  │                                                        │
  │  2. Lồng component = Lồng JS object nhiều tầng!      │
  │     → Parent.props.children = Child ReactElement      │
  │     → Cấu trúc cây = cây object lồng nhau            │
  │                                                        │
  │  3. JSX → Babel → React.createElement()               │
  │     → Hiểu được tại sao phải import React!            │
  │     → Không có React trong scope → lỗi biên dịch!    │
  │                                                        │
  │  4. ReactDOM.render() thực chất dùng innerHTML!       │
  │     → setInnerHTML(container, markup)                  │
  │     → Không phức tạp như ta tưởng!                    │
  │                                                        │
  │  5. Factory Pattern: 4 loại component tùy input       │
  │     → null/false → Empty                              │
  │     → object + string type → DOM                      │
  │     → object + class/fn type → Composite              │
  │     → string/number → Text                            │
  │                                                        │
  │  6. mountComponent() là nơi TRIGGER lifecycle!        │
  │     → componentWillMount() → render() → mount        │
  │     → componentDidMount() → chạy SAU khi mount!      │
  │                                                        │
  │  7. precacheNode() — cache component instance!        │
  │     → Tăng tốc cập nhật cấu trúc về sau              │
  │     → Tránh traverse DOM cây                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §14. Part 2: Component Types & Lifecycles — 4 Loại Component Chi Tiết

```
═══════════════════════════════════════════════════════════════
  LIFECYCLE CHỈ TỒN TẠI TRONG ReactCompositeComponent!
  3 LOẠI CÒN LẠI = KHÔNG CÓ LIFECYCLE!
═══════════════════════════════════════════════════════════════


  NHẮC LẠI (từ Part 1):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactDOM.render() → qua factory method tạo ra       │
  │  4 loại component khác nhau tùy vào tham số:          │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① ReactDOMEmptyComponent   → null/false        │  │
  │  │  ② ReactDOMTextComponent    → string/number     │  │
  │  │  ③ ReactDOMComponent        → object + 'div'... │  │
  │  │  ④ ReactCompositeComponent  → object + class/fn │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Mỗi loại đều có mountComponent() riêng!              │
  │  → mountComponent() = nơi trigger lifecycle           │
  │                                                        │
  │  NHƯNG lifecycle CHỈ CÓ TRONG ④!                     │
  │  → ①②③ đơn giản hơn nhiều!                          │
  │  → Phân tích từ ĐƠN GIẢN → PHỨC TẠP!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.1. ReactDOMEmptyComponent — Component Rỗng

```
  COMPONENT RỖNG = MOUNT RA HTML COMMENT <!---->!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Khi nào tạo ra?                                       │
  │  → ReactDOM.render(null, container)                   │
  │  → ReactDOM.render(false, container)                  │
  │  → Component return null trong render()               │
  │                                                        │
  │  Đặc điểm:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  • TẤT CẢ properties = null!                    │  │
  │  │  • KHÔNG có lifecycle!                           │  │
  │  │  • Chỉ có mount + unmount!                      │  │
  │  │  • mountComponent trả về <!-- --> (HTML rỗng)   │  │
  │  │  • receiveComponent = function() {} (rỗng!)     │  │
  │  │  • getHostNode = function() {} (rỗng!)          │  │
  │  │  • unmountComponent = function() {} (rỗng!)     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactDOMEmptyComponent.js

```javascript
// ═══════════════════════════════════════════════════════════
// ReactDOMEmptyComponent — Component RỖNG nhất!
// ═══════════════════════════════════════════════════════════

var ReactDOMEmptyComponent = function (instantiate) {
  // TẤT CẢ properties = null!
  this._currentElement = null;
  this._hostNode = null;
  this._hostParent = null;
  this._hostContainerInfo = null;
};

_assign(ReactDOMEmptyComponent.prototype, {
  mountComponent: function (
    transaction,
    hostParent,
    hostContainerInfo,
    context,
  ) {
    // Lưu lại container info
    this._hostContainerInfo = hostContainerInfo;

    // Tạo node value dạng: " react-empty: <id> "
    var nodeValue = " react-empty: " + this._domID + " ";

    if (transaction.useCreateElement) {
      // ═══ Cách 1: Dùng DOM API ═══
      var ownerDocument = hostContainerInfo._ownerDocument;

      // Tạo HTML comment node: <!-- react-empty: 1 -->
      var node = ownerDocument.createComment(nodeValue);

      // Cache lại để truy cập nhanh
      ReactDOMComponentTree.precacheNode(this, node);

      // Trả về lazy tree chứa comment node
      return DOMLazyTree(node);
    } else {
      // ═══ Cách 2: Trả về HTML string ═══
      // Kết quả: "<!-- react-empty: 1 -->"
      return "<!--" + nodeValue + "-->";
    }
  },

  // ĐỀU RỖNG! Không làm gì cả!
  receiveComponent: function () {},
  getHostNode: function () {},
  unmountComponent: function () {},
});

module.exports = ReactDOMEmptyComponent;
```

```
  OUTPUT CỦA mountComponent:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  transaction.useCreateElement === true:                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ownerDocument.createComment(nodeValue)          │  │
  │  │  → Tạo DOM Comment node                         │  │
  │  │  → <!-- react-empty: 1 -->                      │  │
  │  │  → Trả về DOMLazyTree(node)                     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  transaction.useCreateElement === false:                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Trả về string: "<!-- react-empty: 1 -->"     │  │
  │  │  → Sẽ được chèn qua innerHTML                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  KẾT QUẢ TRONG DOM THẬT:                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <div id="root">                                │  │
  │  │    <!-- react-empty: 1 -->    ← CHỈ CÓ COMMENT!│  │
  │  │  </div>                                         │  │
  │  │                                                  │  │
  │  │  → Người dùng KHÔNG thấy gì trên màn hình!    │  │
  │  │  → Nhưng DOM VẪN CÓ 1 node (comment)!          │  │
  │  │  → React cần node này làm "placeholder"         │  │
  │  │    để biết vị trí khi cần update sau!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.2. ReactDOMTextComponent — Component Văn Bản

```
  TEXT COMPONENT = ESCAPE + BỌC TRONG COMMENT MARKERS!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Khi nào tạo ra?                                       │
  │  → ReactDOM.render("Hello World", container)          │
  │  → ReactDOM.render(42, container)                     │
  │  → Hoặc text nodes trong JSX                          │
  │                                                        │
  │  Đặc điểm:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  • Phức tạp hơn EmptyComponent một chút        │  │
  │  │  • Cần VALIDATE tham số (kiểm tra khoảng trắng)│  │
  │  │  • Cần ESCAPE text để tránh XSS                 │  │
  │  │  • Bọc text trong comment markers               │  │
  │  │  • KHÔNG có lifecycle!                           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactDOMTextComponent.js

```javascript
// ═══════════════════════════════════════════════════════════
// ReactDOMTextComponent — Xử lý text nodes!
// ═══════════════════════════════════════════════════════════

mountComponent: function (transaction, hostParent,
                          hostContainerInfo, context) {
    // Tạo ID định danh
    var domID = hostContainerInfo._idCounter++;

    // Comment markers để React nhận diện text node
    var openingValue = ' react-text: ' + domID + ' ';
    var closingValue = ' /react-text ';

    this._domID = domID;
    this._hostParent = hostParent;

    if (transaction.useCreateElement) {
        // ═══ Cách 1: Dùng DOM API ═══
        var ownerDocument = hostContainerInfo._ownerDocument;

        // Tạo 2 comment nodes làm boundary markers
        var openingComment = ownerDocument.createComment(openingValue);
        var closingComment = ownerDocument.createComment(closingValue);

        // Tạo document fragment chứa tất cả
        var lazyTree = DOMLazyTree(
            ownerDocument.createDocumentFragment()
        );

        // Cấu trúc: <!-- react-text: 1 --> text <!-- /react-text -->
        DOMLazyTree.queueChild(lazyTree, DOMLazyTree(openingComment));

        if (this._stringText) {
            // Chèn text node vào giữa 2 comment markers
            DOMLazyTree.queueChild(
                lazyTree,
                DOMLazyTree(
                    ownerDocument.createTextNode(this._stringText)
                )
            );
        }

        DOMLazyTree.queueChild(lazyTree, DOMLazyTree(closingComment));

        // Cache lại
        ReactDOMComponentTree.precacheNode(this, openingComment);
        this._closingComment = closingComment;

        return lazyTree;
    } else {
        // ═══ Cách 2: Trả về HTML string ═══

        // ESCAPE text để tránh XSS!
        var escapedText = escapeTextContentForBrowser(this._stringText);

        // Kết quả: "<!-- react-text: 1 -->escaped text<!-- /react-text -->"
        return '<!--' + openingValue + '-->'
             + escapedText
             + '<!--' + closingValue + '-->';
    }
}
```

```
  CẤU TRÚC OUTPUT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Input: "Hello <b>World</b>"                           │
  │                                                        │
  │  Bước 1: Escape text (chống XSS!)                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  escapeTextContentForBrowser("Hello <b>World</b>")│ │
  │  │  → "Hello &lt;b&gt;World&lt;/b&gt;"              │  │
  │  │  (Biến HTML tags thành text an toàn!)             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Bước 2: Bọc trong comment markers                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <!-- react-text: 1 -->                          │  │
  │  │  Hello &lt;b&gt;World&lt;/b&gt;                  │  │
  │  │  <!-- /react-text -->                            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Tại sao cần COMMENT MARKERS?                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → React cần BIẾT text node NÀO thuộc về       │  │
  │  │    component NÀO!                                │  │
  │  │  → Comment markers = boundary markers            │  │
  │  │  → Khi update → React tìm đúng text node       │  │
  │  │    giữa 2 markers để thay đổi!                  │  │
  │  │  → Không có markers → không phân biệt được!    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.3. ReactDOMComponent — Component DOM Gốc

```
  DOM COMPONENT = TẠO TRỰC TIẾP HTML TAG!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Khi nào tạo ra?                                       │
  │  → Khi element.type === 'string'                      │
  │  → VD: <div>, <span>, <input>, <img>, ...             │
  │                                                        │
  │  Đặc điểm:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  • KHÔNG có lifecycle (không phải custom comp)   │  │
  │  │  • Xử lý các HTML tags đặc biệt qua switch     │  │
  │  │  • Tạo HTML string trực tiếp: <tag></tag>       │  │
  │  │  • Phức tạp hơn Text/Empty nhưng vẫn "thẳng"  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactDOMComponent.js (mountComponent)

```javascript
// ═══════════════════════════════════════════════════════════
// ReactDOMComponent — Xử lý DOM elements gốc!
// ═══════════════════════════════════════════════════════════

mountComponent: function (transaction, hostParent,
                          hostContainerInfo, context) {
    // Tạo IDs
    this._rootNodeID = globalIdCounter++;
    this._domID = hostContainerInfo._idCounter++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    // Lấy props từ element hiện tại
    var props = this._currentElement.props;

    // ═══ Switch: Xử lý các tag HTML đặc biệt ═══
    switch (this._tag) {
        case 'audio':
        case 'form':
        case 'iframe':
        case 'img':
        case 'link':
        case 'object':
        case 'source':
        case 'video':
            // Xử lý đặc biệt cho media/form elements
            // (đăng ký event listeners, validate props...)
            break;
    }

    // ... xử lý props (style, events, attributes...)

    // ═══ Tạo HTML markup ═══
    // Tạo element string: '<div></div>', '<span></span>'...
    div.innerHTML = '<' + type + '></' + type + '>';

    // ... xử lý children, chèn nội dung con...

    // Trả về HTML string hoặc DOM node
}
```

```
  PHÂN TÍCH SWITCH CASE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  switch(this._tag) xử lý CHO TỪNG LOẠI TAG:          │
  │                                                        │
  │  ┌──────────┬─────────────────────────────────────┐    │
  │  │ Tag      │ Xử lý đặc biệt                     │    │
  │  ├──────────┼─────────────────────────────────────┤    │
  │  │ audio    │ Media events (play, pause, load...) │    │
  │  │ form     │ Submit events, validation           │    │
  │  │ iframe   │ Load event, sandbox security        │    │
  │  │ img      │ Load/error events, src validation   │    │
  │  │ link     │ Stylesheet loading                  │    │
  │  │ object   │ Plugin loading                      │    │
  │  │ source   │ Media source handling               │    │
  │  │ video    │ Media events (giống audio)          │    │
  │  ├──────────┼─────────────────────────────────────┤    │
  │  │ div,span │ Không xử lý đặc biệt              │    │
  │  │ p,h1...  │ → Tạo HTML bình thường!            │    │
  │  └──────────┴─────────────────────────────────────┘    │
  │                                                        │
  │  LOGIC CHUNG:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① Xử lý tag đặc biệt (switch)                 │  │
  │  │  ② Xử lý props (attributes, events, style...)   │  │
  │  │  ③ Tạo HTML: '<tag>' + content + '</tag>'       │  │
  │  │  ④ Trả về HTML string/DOM node                  │  │
  │  │                                                  │  │
  │  │  → KHÔNG có lifecycle!                           │  │
  │  │  → KHÔNG có state!                               │  │
  │  │  → Chỉ tạo HTML tag từ element description!    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.4. ReactCompositeComponent — ⭐ Component Tùy Chỉnh (CÓ LIFECYCLE!)

```
═══════════════════════════════════════════════════════════════
  ĐÂY LÀ LOẠI COMPONENT PHỨC TẠP NHẤT VÀ QUAN TRỌNG NHẤT!
  LIFECYCLE CHỈ TỒN TẠI Ở ĐÂY!
═══════════════════════════════════════════════════════════════


  ReactCompositeComponent.mountComponent — LUỒNG ĐẦY ĐỦ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactCompositeComponent                               │
  │       │                                                │
  │       ▼                                                │
  │  mountComponent()                                      │
  │       │                                                │
  │       ▼ ① XỬ LÝ PROPS                                │
  │       │   → Gán this.props từ element.props            │
  │       │   → Merge defaultProps nếu có                  │
  │       │   → Validate propTypes (dev mode)              │
  │       │                                                │
  │       ▼ ② KIỂM TRA: Stateful hay Stateless?          │
  │       │   ┌─────────────────────────────────────┐      │
  │       │   │ Có render() method?                  │      │
  │       │   │                                     │      │
  │       │   │ CÓ → Stateful Component (class)    │      │
  │       │   │       → new Component(props,context)│      │
  │       │   │       → Tạo instance đầy đủ!       │      │
  │       │   │                                     │      │
  │       │   │ KHÔNG → Stateless Component (fn)    │      │
  │       │   │          → Component(props,context)  │      │
  │       │   │          → Chỉ gọi function!        │      │
  │       │   │          → KHÔNG có state/lifecycle! │      │
  │       │   └─────────────────────────────────────┘      │
  │       │                                                │
  │       ▼ ③ XỬ LÝ STATE                                │
  │       │   → this.state = instance.state                │
  │       │   → Nếu state undefined → set null!           │
  │       │                                                │
  │       ▼ ④ GỌI componentWillMount()                    │
  │       │   → Hook TRƯỚC KHI mount!                     │
  │       │   → Có thể gọi setState() ở đây              │
  │       │   → setState trong WillMount = ĐỒNG BỘ!      │
  │       │     (merge trực tiếp vào state,                │
  │       │      KHÔNG trigger re-render!)                  │
  │       │                                                │
  │       ▼ ⑤ GỌI render()                                │
  │       │   → Thực thi render() method                   │
  │       │   → Lấy được ReactElement (VDOM)              │
  │       │   → Đệ quy vào child components!              │
  │       │                                                │
  │       ▼ ⑥ GỌI componentDidMount()                     │
  │       │   → Hook SAU KHI mount xong!                  │
  │       │   → DOM thật ĐÃ sẵn sàng!                   │
  │       │   → Có thể access DOM, gọi API ở đây!       │
  │       │   → setState ở đây = BẤT ĐỒNG BỘ!            │
  │       │     (trigger re-render!)                        │
  │       │                                                │
  │       ▼ ⑦ ĐỆ QUY CHO CHILD COMPONENTS                │
  │           → Với mỗi child trong render output:         │
  │           → Lặp lại toàn bộ quy trình từ ①!          │
  │           → Cho đến khi hết children!                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Phân biệt Stateful vs Stateless Component

```
  STATEFUL vs STATELESS — TẠI SAO CẦN PHÂN BIỆT?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │             STATEFUL COMPONENT                   │  │
  │  │  ┌──────────────────────────────────────────┐    │  │
  │  │  │  class MyComp extends Component {        │    │  │
  │  │  │    constructor(props) {                  │    │  │
  │  │  │      super(props);                       │    │  │
  │  │  │      this.state = { count: 0 };          │    │  │
  │  │  │    }                                     │    │  │
  │  │  │    render() {                            │    │  │
  │  │  │      return <div>{this.state.count}</div>│    │  │
  │  │  │    }                                     │    │  │
  │  │  │  }                                       │    │  │
  │  │  └──────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  ✅ CÓ render() method trên prototype            │  │
  │  │  ✅ CÓ state                                     │  │
  │  │  ✅ CÓ lifecycle (componentDidMount, ...)        │  │
  │  │  ✅ Tạo qua: new Component(props, context)       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │             STATELESS COMPONENT                  │  │
  │  │  ┌──────────────────────────────────────────┐    │  │
  │  │  │  function MyComp(props) {                │    │  │
  │  │  │    return <div>{props.name}</div>         │    │  │
  │  │  │  }                                       │    │  │
  │  │  └──────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  ❌ KHÔNG có render() (bản thân nó LÀ render)   │  │
  │  │  ❌ KHÔNG có state                               │  │
  │  │  ❌ KHÔNG có lifecycle                           │  │
  │  │  ❌ Gọi như function: Component(props, context)  │  │
  │  │  ✅ Nhẹ hơn, nhanh hơn, ít bộ nhớ hơn!        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÁCH REACT PHÂN BIỆT (trong source code):            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // Kiểm tra instance có render() không?        │  │
  │  │  if (inst.render) {                              │  │
  │  │    // → Stateful! Xử lý state + lifecycle!     │  │
  │  │  } else {                                        │  │
  │  │    // → Stateless! Chỉ lấy output từ function! │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — ReactCompositeComponent.js (mountComponent tóm tắt)

```javascript
// ═══════════════════════════════════════════════════════════
// ReactCompositeComponent.mountComponent — PHỨC TẠP NHẤT!
// (Tóm tắt, bỏ phần xử lý lỗi và dev warnings)
// ═══════════════════════════════════════════════════════════

mountComponent: function (transaction, hostParent,
                          hostContainerInfo, context) {

    // ① XỬ LÝ PROPS
    this._currentElement = element;
    this._context = context;

    var publicProps = element.props;
    var publicContext = this._processContext(context);

    var Component = this._currentElement.type;

    // ② KIỂM TRA STATEFUL HAY STATELESS
    var inst;
    var renderedElement;

    if (Component.prototype && Component.prototype.isReactComponent) {
        // ═══ STATEFUL: Tạo instance đầy đủ! ═══
        inst = new Component(publicProps, publicContext, updateQueue);
    } else {
        // ═══ STATELESS: Chỉ gọi function! ═══
        inst = Component(publicProps, publicContext, updateQueue);

        if (inst == null || inst.render == null) {
            renderedElement = inst;
            // → Không có state, không có lifecycle
            // → renderedElement = output trực tiếp!
        }
    }

    // ③ XỬ LÝ STATE
    this._instance = inst;
    inst.props = publicProps;
    inst.context = publicContext;
    inst.refs = emptyObject;
    inst.updater = updateQueue;

    var initialState = inst.state;
    if (initialState === undefined) {
        inst.state = initialState = null;
    }

    // ④ GỌI componentWillMount()
    if (inst.componentWillMount) {
        inst.componentWillMount();
        // ⚠ Nếu setState() trong componentWillMount → ĐỒNG BỘ!
        // → state sẽ được merge NGAY trước khi render!
        // → KHÔNG trigger re-render riêng!
        initialState = inst.state;
    }

    // ⑤ GỌI render() → lấy ReactElement
    var renderedComponent = inst.render();

    // ⑥ ĐỆ QUY: Mount child component
    var child = instantiateReactComponent(renderedComponent);
    this._renderedComponent = child;
    var markup = child.mountComponent(
        transaction, hostParent, hostContainerInfo, context
    );

    // ⑦ ĐĂNG KÝ componentDidMount() (gọi SAU KHI mount xong!)
    if (inst.componentDidMount) {
        transaction.getReactMountReady().enqueue(
            inst.componentDidMount, inst
        );
        // → componentDidMount được ĐĂNG KÝ qua transaction
        // → Chỉ chạy SAU KHI toàn bộ cây đã mount xong!
    }

    return markup;
}
```

```
  ⚠ ĐIỂM QUAN TRỌNG: setState TRONG LIFECYCLE
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  componentWillMount():                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  setState() = ĐỒNG BỘ!                          │  │
  │  │  → State được merge TRƯỚC KHI render()          │  │
  │  │  → KHÔNG trigger re-render riêng!               │  │
  │  │  → Vì component CHƯA mount → chưa có DOM!     │  │
  │  │                                                  │  │
  │  │  componentWillMount() {                          │  │
  │  │    this.setState({ x: 1 }); // ← đồng bộ!     │  │
  │  │    console.log(this.state.x); // ← 1 ngay!     │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  componentDidMount():                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  setState() = BẤT ĐỒNG BỘ!                      │  │
  │  │  → Component ĐÃ mount, ĐÃ có DOM!              │  │
  │  │  → setState sẽ trigger RE-RENDER!               │  │
  │  │  → Đi qua update queue bình thường!             │  │
  │  │                                                  │  │
  │  │  componentDidMount() {                           │  │
  │  │    this.setState({ x: 1 }); // ← bất đồng bộ! │  │
  │  │    console.log(this.state.x); // ← CHƯA = 1!   │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.5. So Sánh 4 Loại Component — Bảng Tổng Hợp

```
  BẢNG SO SÁNH ĐẦY ĐỦ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌────────────────┬──────────┬───────┬───────┬──────┐ │
  │  │                │ Empty    │ Text  │ DOM   │Compo-│ │
  │  │                │ Comp     │ Comp  │ Comp  │ site │ │
  │  ├────────────────┼──────────┼───────┼───────┼──────┤ │
  │  │ Input          │null/false│str/num│element│class/│ │
  │  │                │          │       │string │fn    │ │
  │  ├────────────────┼──────────┼───────┼───────┼──────┤ │
  │  │ Lifecycle      │    ❌    │  ❌   │  ❌   │ ✅  │ │
  │  ├────────────────┼──────────┼───────┼───────┼──────┤ │
  │  │ State          │    ❌    │  ❌   │  ❌   │ ✅  │ │
  │  ├────────────────┼──────────┼───────┼───────┼──────┤ │
  │  │ mount output   │ <!-- --> │ text  │<tag/> │ HTML │ │
  │  │                │ comment  │+marker│markup │from  │ │
  │  │                │          │       │       │render│ │
  │  ├────────────────┼──────────┼───────┼───────┼──────┤ │
  │  │ Phức tạp       │  ★☆☆☆   │ ★★☆☆ │★★★☆  │★★★★ │ │
  │  ├────────────────┼──────────┼───────┼───────┼──────┤ │
  │  │ Dùng cho       │null rend │"hello"│<div/> │<App/>│ │
  │  │                │er output │ 42    │<span/>│<List>│ │
  │  └────────────────┴──────────┴───────┴───────┴──────┘ │
  │                                                        │
  │                                                        │
  │  MỤC ĐÍCH CỦA mountComponent():                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Dù là loại component nào, mountComponent()      │  │
  │  │  đều có CÙNG 1 MỤC ĐÍCH:                         │  │
  │  │                                                  │  │
  │  │  ┌──────────────────────────────────────┐        │  │
  │  │  │  ReactElement → PARSE → HTML markup │        │  │
  │  │  └──────────────────────────────────────┘        │  │
  │  │                                                  │  │
  │  │  Lifecycle CHÍNH LÀ quá trình parse này!        │  │
  │  │  → Khi parse → trigger từng lifecycle hook!     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.6. Lifecycle Mount — Sơ Đồ Chi Tiết

```
  LIFECYCLE TRONG QUÁ TRÌNH MOUNT (ReactCompositeComponent):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactDOM.render(<App />, container)                   │
  │       │                                                │
  │       ▼                                                │
  │  instantiateReactComponent(<App />)                    │
  │  → new ReactCompositeComponentWrapper(element)         │
  │       │                                                │
  │       ▼                                                │
  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
  │  ┃            mountComponent()                      ┃  │
  │  ┃                                                  ┃  │
  │  ┃  ┌────────────────────────────────┐              ┃  │
  │  ┃  │  Xử lý props                  │              ┃  │
  │  ┃  │  → Gán publicProps            │              ┃  │
  │  ┃  │  → Merge defaultProps          │              ┃  │
  │  ┃  └──────────────┬─────────────────┘              ┃  │
  │  ┃                 ▼                                ┃  │
  │  ┃  ┌────────────────────────────────┐              ┃  │
  │  ┃  │  Kiểm tra: Stateful / Less?   │              ┃  │
  │  ┃  │  → inst.render tồn tại?       │              ┃  │
  │  ┃  └──────────────┬─────────────────┘              ┃  │
  │  ┃                 ▼                                ┃  │
  │  ┃  ┌────────────────────────────────┐              ┃  │
  │  ┃  │  Xử lý state                  │              ┃  │
  │  ┃  │  → inst.state = initialState  │              ┃  │
  │  ┃  │  → undefined → set null!     │              ┃  │
  │  ┃  └──────────────┬─────────────────┘              ┃  │
  │  ┃                 ▼                                ┃  │
  │  ┃  ╔════════════════════════════════╗              ┃  │
  │  ┃  ║  componentWillMount()         ║              ┃  │
  │  ┃  ║  → setState ở đây = ĐỒNG BỘ ║              ┃  │
  │  ┃  ║  → Merge trước khi render    ║              ┃  │
  │  ┃  ╚═══════════════╤══════════════╝              ┃  │
  │  ┃                  ▼                               ┃  │
  │  ┃  ╔════════════════════════════════╗              ┃  │
  │  ┃  ║  render()                      ║              ┃  │
  │  ┃  ║  → Lấy ReactElement output   ║              ┃  │
  │  ┃  ║  → = Virtual DOM tree!        ║              ┃  │
  │  ┃  ╚═══════════════╤══════════════╝              ┃  │
  │  ┃                  ▼                               ┃  │
  │  ┃  ┌────────────────────────────────┐              ┃  │
  │  ┃  │  instantiateReactComponent()  │              ┃  │
  │  ┃  │  → ĐỆ QUY cho child!         │              ┃  │
  │  ┃  │  → Child cũng đi qua toàn bộ │              ┃  │
  │  ┃  │    quy trình này!             │              ┃  │
  │  ┃  └──────────────┬─────────────────┘              ┃  │
  │  ┃                 ▼                                ┃  │
  │  ┃  ╔════════════════════════════════╗              ┃  │
  │  ┃  ║  componentDidMount()          ║              ┃  │
  │  ┃  ║  → Đăng ký qua transaction!  ║              ┃  │
  │  ┃  ║  → Chạy SAU KHI toàn bộ cây ║              ┃  │
  │  ┃  ║    đã mount xong!             ║              ┃  │
  │  ┃  ║  → setState = BẤT ĐỒNG BỘ!  ║              ┃  │
  │  ┃  ╚════════════════════════════════╝              ┃  │
  │  ┃                                                  ┃  │
  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
  │       │                                                │
  │       ▼                                                │
  │  HTML markup → setInnerHTML → DOM thật! ✅             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.7. Ví Dụ Thực Tế — Cây Component Mount

```
  VÍ DỤ: Mount cây component phức tạp
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Code:                                                 │
  │  ReactDOM.render(                                      │
  │    <App>                      ← ReactComposite        │
  │      <Header />               ← ReactComposite        │
  │      <div className="main">   ← ReactDOM              │
  │        <Content />            ← ReactComposite        │
  │        Xin chào!              ← ReactDOMText          │
  │      </div>                                            │
  │    </App>,                                             │
  │    document.getElementById('root')                     │
  │  );                                                    │
  │                                                        │
  │                                                        │
  │  THỨ TỰ MOUNT (ĐỆ QUY - PREORDER DFS):               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  1️⃣ App (ReactCompositeComponent)                │  │
  │  │     → componentWillMount()                      │  │
  │  │     → render()                                  │  │
  │  │     │                                           │  │
  │  │     ├── 2️⃣ Header (ReactCompositeComponent)     │  │
  │  │     │   → componentWillMount()                  │  │
  │  │     │   → render()                              │  │
  │  │     │   → child mount...                        │  │
  │  │     │   → componentDidMount() ← đăng ký       │  │
  │  │     │                                           │  │
  │  │     └── 3️⃣ <div> (ReactDOMComponent)            │  │
  │  │         → mountComponent() (không lifecycle)    │  │
  │  │         │                                       │  │
  │  │         ├── 4️⃣ Content (ReactComposite)         │  │
  │  │         │   → componentWillMount()              │  │
  │  │         │   → render()                          │  │
  │  │         │   → componentDidMount() ← đăng ký   │  │
  │  │         │                                       │  │
  │  │         └── 5️⃣ "Xin chào!" (ReactDOMText)      │  │
  │  │             → mountComponent() (escape text)    │  │
  │  │                                                  │  │
  │  │  → App.componentDidMount() ← đăng ký          │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │                                                        │
  │  THỨ TỰ componentDidMount THỰC TẾ CHẠY:               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  1. Header.componentDidMount()    ← CON trước! │  │
  │  │  2. Content.componentDidMount()                 │  │
  │  │  3. App.componentDidMount()       ← CHA sau!   │  │
  │  │                                                  │  │
  │  │  → Children didMount TRƯỚC parent!              │  │
  │  │  → Vì children mount XONG trước parent!        │  │
  │  │  → Transaction đảm bảo thứ tự này!             │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.8. Mind Map Cập Nhật — Full Picture

```
  MIND MAP HOÀN CHỈNH (CẬP NHẬT TỪ PART 1):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │                ReactComponent                          │
  │               (Base Constructor)                       │
  │     ┌─────┐  ┌─────┐  ┌─────┐  ┌──────────┐         │
  │     │ctx  │  │props│  │refs │  │prototype │         │
  │     └──┬──┘  └──┬──┘  └──┬──┘  │├setState │         │
  │        └────┬───┘        │     │└forceUpd │         │
  │             │            │     └──────────┘         │
  │             ▼            │                           │
  │      ┌────────────┐     │                           │
  │      │  updater    │     │                           │
  │      └────────────┘     │                           │
  │             │            │                           │
  │             ▼            │                           │
  │  ┌──────────────────────┴──┐                        │
  │  │  React.createElement()  │                        │
  │  └───────────┬─────────────┘                        │
  │              ▼                                       │
  │  ┌──────────────────────────┐                        │
  │  │  ReactElement object     │                        │
  │  │  === <A /> component     │                        │
  │  └───────────┬──────────────┘                        │
  │              ▼                                       │
  │  ┌──────────────────────────┐                        │
  │  │  ReactDOM.render()       │                        │
  │  └───────────┬──────────────┘                        │
  │              ▼                                       │
  │  ┌──────────────────────────────────────────────┐    │
  │  │ instantiateReactComponent() → 4 loại:       │    │
  │  │                                              │    │
  │  │ ReactDOMEmptyComp ──┐                        │    │
  │  │   mountComponent    │                        │    │
  │  │   → <!--comment--> │                        │    │
  │  │                     │                        │    │
  │  │ ReactDOMComponent ──┤   mountComponent()     │    │
  │  │   mountComponent    ├──→ Parse ReactElement  │    │
  │  │   → <tag>HTML</tag>│    → Lấy HTML markup  │    │
  │  │                     │                        │    │
  │  │ ReactDOMTextComp ───┤                        │    │
  │  │   mountComponent    │                        │    │
  │  │   → escaped text   │                        │    │
  │  │                     │                        │    │
  │  │ ReactCompositeComp ─┘                        │    │
  │  │   mountComponent ──→ ⭐ CÓ LIFECYCLE!       │    │
  │  │                                              │    │
  │  └──────────────────────┬───────────────────────┘    │
  │                         │                             │
  │                         ▼                             │
  │   ReactCompositeComponent.mountComponent:             │
  │   ┌──────────────────────────────────────┐            │
  │   │  ① Xử lý props                     │            │
  │   │  ② Stateful / Stateless?            │            │
  │   │  ③ Xử lý state                     │            │
  │   │  ④ componentWillMount() ← SYNC!    │            │
  │   │  ⑤ render() → lấy VDOM            │            │
  │   │  ⑥ componentDidMount() ← ASYNC!   │            │
  │   │  ⑦ Đệ quy children                │            │
  │   └──────────────────┬───────────────────┘            │
  │                      ▼                                │
  │          ┌─────────────────────┐                      │
  │          │  setInnerHTML()     │                      │
  │          │  → Chèn vào DOM!  │                      │
  │          │  precacheNode()    │                      │
  │          └─────────────────────┘                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 14.9. Tóm Tắt Part 2 — Rút Gọn Ý Tưởng

```
  ⭐ TAKEAWAYS TỪ PART 2:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. Lifecycle = QUÁ TRÌNH MOUNT SÂU HƠN!             │
  │     → Nghiên cứu lifecycle = nghiên cứu sâu           │
  │       quy trình mount của component!                   │
  │                                                        │
  │  2. CHỈ ReactCompositeComponent có lifecycle!          │
  │     → 3 loại còn lại (Empty, Text, DOM) = KHÔNG!     │
  │     → Chúng chỉ tạo HTML trực tiếp, đơn giản!       │
  │                                                        │
  │  3. ReactDOMEmptyComponent:                            │
  │     → Render ra <!-- comment --> (placeholder!)        │
  │     → Cần để React biết "vị trí" khi update           │
  │                                                        │
  │  4. ReactDOMTextComponent:                             │
  │     → ESCAPE text (chống XSS!)                        │
  │     → Bọc trong <!-- react-text --> markers            │
  │     → Markers giúp tìm đúng text node khi update     │
  │                                                        │
  │  5. ReactDOMComponent:                                 │
  │     → Switch/case cho tags đặc biệt (audio,form...)  │
  │     → Tạo HTML: '<tag>' + content + '</tag>'          │
  │                                                        │
  │  6. ReactCompositeComponent = PHỨC TẠP NHẤT!          │
  │     → Có TOÀN BỘ lifecycle!                           │
  │     → Phân biệt Stateful (class) vs Stateless (fn)   │
  │     → ĐỆ QUY mount cho children                      │
  │                                                        │
  │  7. setState trong componentWillMount = ĐỒNG BỘ!     │
  │     → Merge TRƯỚC khi render()!                       │
  │     → KHÔNG trigger re-render riêng!                  │
  │                                                        │
  │  8. setState trong componentDidMount = BẤT ĐỒNG BỘ!  │
  │     → Đã có DOM → trigger re-render qua queue!       │
  │                                                        │
  │  9. componentDidMount: CHILDREN chạy TRƯỚC PARENT!    │
  │     → Vì children mount xong trước parent!            │
  │     → Transaction đảm bảo thứ tự!                    │
  │                                                        │
  │  10. Mục đích của lifecycle = PARSE ReactElement!     │
  │      → Parse ra HTML markup → chèn vào DOM!          │
  │      → Lifecycle hooks = "điểm can thiệp" trong quá │
  │        trình parse này!                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §15. Part 3: Transaction & Update Queue — setState Hoạt Động Như Thế Nào?

```
═══════════════════════════════════════════════════════════════
  TRANSACTION = CƠ CHẾ "BỌC" (WRAPPER) FUNCTION!
  UPDATE QUEUE = HÀNG ĐỢI CẬP NHẬT STATE!
  → 2 khái niệm NỀN TẢNG để hiểu setState!
═══════════════════════════════════════════════════════════════
```

### 15.1. Truy Vết setState — Từ Đâu Mà Ra?

```
  TRUY VẾT: this.setState() → ĐI ĐẾN ĐÂU?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Từ Part 1, ta đã biết:                                │
  │  ReactComponent.prototype.setState = function(         │
  │    partialState, callback                               │
  │  ) {                                                    │
  │    this.updater.enqueueSetState(this, partialState);   │
  │    if (callback) {                                      │
  │      this.updater.enqueueCallback(this, callback);     │
  │    }                                                    │
  │  };                                                     │
  │                                                        │
  │  2 THAM SỐ:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  partialState → Giá trị state mới              │  │
  │  │  callback     → Hàm callback sau khi update     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÂU HỎI: this.updater LÀ GÌ?                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Nhìn lại constructor của ReactComponent:        │  │
  │  │  function ReactComponent(props, context, updater)│  │
  │  │  {                                               │  │
  │  │    this.updater = updater || ReactNoopUpdateQueue│  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  → updater được TRUYỀN VÀO qua constructor!    │  │
  │  │  → Tìm nơi gọi new ReactComponent()!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — Tìm updater trong ReactCompositeComponent

```javascript
// Trong _constructComponentWithoutOwner:
// → Đây là nơi tạo instance của custom component!

return new Component(publicProps, publicContext, updateQueue);
//                                               ^^^^^^^^^^^
//                                               updater CHÍNH LÀ updateQueue!

// Vậy this.updater.enqueueSetState() thực chất là:
// updateQueue.enqueueSetState()
```

```
  CHUỖI GỌI setState:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  this.setState(newState)                                │
  │       │                                                │
  │       ▼                                                │
  │  this.updater.enqueueSetState(this, newState)          │
  │       │                                                │
  │       │  updater = updateQueue (truyền qua constructor)│
  │       ▼                                                │
  │  updateQueue.enqueueSetState(component, newState)      │
  │       │                                                │
  │       ▼  (Xem section tiếp theo)                       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.2. enqueueSetState — Hàng Đợi Cập Nhật State

```javascript
// ═══════════════════════════════════════════════════════════
// enqueueSetState — Xếp state mới vào hàng đợi!
// ═══════════════════════════════════════════════════════════

enqueueSetState: function (publicInstance, partialState) {

    // ① Lấy component object hiện tại
    var internalInstance = getInternalInstanceReadyForUpdate(
        publicInstance, 'setState'
    );

    if (!internalInstance) {
        return; // Component chưa mount → bỏ qua!
    }

    // ② Kiểm tra: đã có hàng đợi chưa?
    var queue = internalInstance._pendingStateQueue
             || (internalInstance._pendingStateQueue = []);
    //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //           Nếu CHƯA CÓ → tạo array mới!
    //           Nếu ĐÃ CÓ → dùng array hiện tại!

    // ③ PUSH state mới vào hàng đợi!
    queue.push(partialState);
    // → KHÔNG merge ngay! Chỉ thêm vào queue!
    // → Nhiều setState() liên tiếp = nhiều items trong queue!

    // ④ Gọi enqueueUpdate để trigger update process
    enqueueUpdate(internalInstance);
}
```

```
  ĐIỂM QUAN TRỌNG: _pendingStateQueue LÀ ARRAY!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VD: Gọi setState 3 lần liên tiếp:                    │
  │                                                        │
  │  this.setState({ a: 1 });                               │
  │  this.setState({ b: 2 });                               │
  │  this.setState({ c: 3 });                               │
  │                                                        │
  │  _pendingStateQueue SAU 3 lần push:                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  [ { a: 1 }, { b: 2 }, { c: 3 } ]               │  │
  │  │    ^^^^^^^^   ^^^^^^^^   ^^^^^^^^                │  │
  │  │    push #1    push #2    push #3                 │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → CHƯA merge! Chỉ xếp hàng!                         │
  │  → Merge SAU trong _processPendingState()             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.3. enqueueUpdate — Nút Giao Thông Quan Trọng

```javascript
// ═══════════════════════════════════════════════════════════
// enqueueUpdate — Quyết định: Update NGAY hay ĐỢI?
// ═══════════════════════════════════════════════════════════

function enqueueUpdate(component) {
  ensureInjected(); // Đảm bảo dependency injection

  // ═══ NÚT GIAO THÔNG QUAN TRỌNG! ═══
  if (!batchingStrategy.isBatchingUpdates) {
    // ═══ ĐƯỜNG 1: CHƯA trong batch → chạy NGAY! ═══
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }

  // ═══ ĐƯỜNG 2: ĐANG trong batch → xếp hàng! ═══
  dirtyComponents.push(component);
  // → Component được thêm vào "danh sách bẩn"
  // → Sẽ được xử lý SAU khi batch kết thúc!
}
```

```
  SƠ ĐỒ QUYẾT ĐỊNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │              enqueueUpdate(component)                   │
  │                      │                                  │
  │                      ▼                                  │
  │    ┌────────────────────────────────────┐               │
  │    │ batchingStrategy.isBatchingUpdates │               │
  │    │         (ban đầu = false)          │               │
  │    └──────────┬─────────────┬───────────┘               │
  │               │             │                           │
  │          false│             │true                       │
  │               ▼             ▼                           │
  │    ┌──────────────┐  ┌──────────────────┐              │
  │    │ batchedUpda- │  │ dirtyComponents  │              │
  │    │ tes(enqueue- │  │   .push(comp)    │              │
  │    │ Update, comp)│  │                  │              │
  │    │              │  │ → Xếp hàng đợi! │              │
  │    │ → CHẠY qua  │  │ → Xử lý SAU!   │              │
  │    │   TRANSACTION│  │                  │              │
  │    └──────────────┘  └──────────────────┘              │
  │                                                        │
  │  ⚠ TẠI SAO CÓ 2 ĐƯỜNG?                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  React dùng "STATE MACHINE" (máy trạng thái)!   │  │
  │  │  → Logic khác nhau tùy vào TRẠNG THÁI!         │  │
  │  │                                                  │  │
  │  │  Nếu CHƯA batch: Bắt đầu transaction mới!      │  │
  │  │  Nếu ĐANG batch: Chỉ thêm vào queue!           │  │
  │  │  → Tránh re-render nhiều lần!                   │  │
  │  │  → Gộp updates → render 1 lần duy nhất!       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.4. Transaction — Cơ Chế "Bọc" Hàm

```
  TRANSACTION LÀ GÌ? = BỌC HÀM VỚI initialize + close!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SƠ ĐỒ TỪ SOURCE CODE:                                │
  │                                                        │
  │        wrappers (inject khi tạo transaction)           │
  │                  +          +                           │
  │                  |          |                           │
  │  +-─────────────-|──────────|-──────────────-+         │
  │  |               v          |                |         │
  │  |     +──────────────+     |                |         │
  │  | +---|   wrapper1   |-----|-----+          |         │
  │  | |   +──────────────+     v     |          |         │
  │  | |        +──────────────+      |          |         │
  │  | |   +----|   wrapper2   |------+----+     |         │
  │  | |   |    +──────────────+      |    |     |         │
  │  | |   |                          |    |     |         │
  │  | v   v                          v    v     |         │
  │  |+---++---+  +-----------+  +---++---+|     │         │
  │  ||ini||ini|  |           |  |clo||clo||     │         │
  │  ||t  ||t  |  | anyMethod |  |se ||se ||     │         │
  │  ||1  ||2  |  |           |  |2  ||1  ||     │         │
  │  |+---++---+  +-----------+  +---++---+|     │         │
  │  | initialize                  close   |     │         │
  │  +-────────────────────────────────────-+     │         │
  │                                                        │
  │  LUỒNG THỰC THI:                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  transaction.perform(myMethod)                   │  │
  │  │                                                  │  │
  │  │  ① wrapper1.initialize()  ← chạy trước        │  │
  │  │  ② wrapper2.initialize()  ← chạy trước        │  │
  │  │  ③ myMethod()             ← hàm chính!        │  │
  │  │  ④ wrapper2.close()       ← chạy sau          │  │
  │  │  ⑤ wrapper1.close()       ← chạy sau          │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH: Có và không có Transaction                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  KHÔNG CÓ Transaction:                           │  │
  │  │  function method() { console.log('111'); }       │  │
  │  │  method();                                       │  │
  │  │  // Output: '111'                                │  │
  │  │                                                  │  │
  │  │  CÓ Transaction:                                 │  │
  │  │  transaction.perform(method);                    │  │
  │  │  // Output:                                      │  │
  │  │  // → initialize() chạy                         │  │
  │  │  // → '111'                                     │  │
  │  │  // → close() chạy                              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### batchingStrategy — 2 Wrappers Quan Trọng

```javascript
// ═══════════════════════════════════════════════════════════
// ReactDefaultBatchingStrategy — Chiến lược batch mặc định
// ═══════════════════════════════════════════════════════════

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false, // ← Ban đầu = false!

  batchedUpdates: function (callback, a, b, c, d, e) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    // ĐẶT FLAG = TRUE! (đang trong batch!)
    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    if (alreadyBatchingUpdates) {
      // Nếu ĐÃ ĐANG batch → chỉ gọi callback!
      callback(a, b, c, d, e);
    } else {
      // Nếu CHƯA batch → chạy qua TRANSACTION!
      transaction.perform(callback, null, a, b, c, d, e);
    }
  },
};

// 2 WRAPPERS TRONG TRANSACTION:
var RESET_BATCHED_UPDATES = {
  initialize: function () {}, // ← RỖNG! Không làm gì!
  close: function () {
    // ĐẶT LẠI flag = false!
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  },
};

var FLUSH_BATCHED_UPDATES = {
  initialize: function () {}, // ← RỖNG!
  close: function () {
    // CHẠY CẬP NHẬT cho tất cả dirty components!
    flushBatchedUpdates();
  },
};
```

```
  2 WRAPPERS GIẢI THÍCH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  RESET_BATCHED_UPDATES:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Nhiệm vụ: QUẢN LÝ TRẠNG THÁI batch!           │  │
  │  │                                                  │  │
  │  │  initialize() → rỗng (không làm gì)            │  │
  │  │  close() → isBatchingUpdates = false            │  │
  │  │                                                  │  │
  │  │  → Sau khi batch xong → reset lại flag!        │  │
  │  │  → Lần gọi setState tiếp = batch MỚI!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  FLUSH_BATCHED_UPDATES:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Nhiệm vụ: THỰC SỰ CẬP NHẬT COMPONENTS!       │  │
  │  │                                                  │  │
  │  │  initialize() → rỗng (không làm gì)            │  │
  │  │  close() → flushBatchedUpdates()                │  │
  │  │                                                  │  │
  │  │  → Duyệt dirtyComponents[]                      │  │
  │  │  → Chạy updateComponent() cho từng cái!        │  │
  │  │  → ĐÂY LÀ NƠI THỰC SỰ RE-RENDER!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LUỒNG ĐẦY ĐỦ KHI GỌI setState:                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① RESET_BATCHED_UPDATES.initialize()           │  │
  │  │     → (rỗng)                                    │  │
  │  │                                                  │  │
  │  │  ② enqueueUpdate(component)                      │  │
  │  │     → isBatchingUpdates = true (đã set ở trên) │  │
  │  │     → dirtyComponents.push(component)            │  │
  │  │                                                  │  │
  │  │  ③ FLUSH_BATCHED_UPDATES.close()                 │  │
  │  │     → flushBatchedUpdates()                      │  │
  │  │     → Duyệt dirtyComponents → updateComponent! │  │
  │  │                                                  │  │
  │  │  ④ RESET_BATCHED_UPDATES.close()                 │  │
  │  │     → isBatchingUpdates = false                  │  │
  │  │     → Reset trạng thái!                          │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠ TẠI SAO CẦN TRANSACTION?                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  TRÁNH INFINITE LOOP!                            │  │
  │  │                                                  │  │
  │  │  Nếu không có wrapper:                           │  │
  │  │  enqueueUpdate → batchedUpdates →               │  │
  │  │  enqueueUpdate → batchedUpdates → ... ∞!       │  │
  │  │                                                  │  │
  │  │  Với wrapper:                                    │  │
  │  │  Lần 1: isBatchingUpdates = false               │  │
  │  │    → batchedUpdates → set true → perform!      │  │
  │  │  Trong perform: isBatchingUpdates = true        │  │
  │  │    → dirtyComponents.push() (KHÔNG gọi lại!)   │  │
  │  │  Sau perform: close() → reset false + flush!    │  │
  │  │                                                  │  │
  │  │  → KHÔNG CÓ infinite loop! ✅                   │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.5. flushBatchedUpdates — Thực Sự Cập Nhật

```javascript
// ═══════════════════════════════════════════════════════════
// flushBatchedUpdates — Duyệt dirtyComponents và update!
// ═══════════════════════════════════════════════════════════

var flushBatchedUpdates = function () {
  while (dirtyComponents.length || asapEnqueued) {
    if (dirtyComponents.length) {
      // Lấy transaction từ pool (tái sử dụng!)
      var transaction = ReactUpdatesFlushTransaction.getPooled();

      // Chạy runBatchedUpdates qua TRANSACTION!
      transaction.perform(runBatchedUpdates, null, transaction);

      // Trả transaction về pool
      ReactUpdatesFlushTransaction.release(transaction);
    }
    // ...
  }
};

// runBatchedUpdates LÀM 2 VIỆC:
// ① Gọi updateComponent() cho từng dirty component
// ② Nếu setState có callback → lưu vào callbackQueue
```

```
  flushBatchedUpdates FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  dirtyComponents = [comp1, comp2, comp3, ...]          │
  │       │                                                │
  │       ▼             while(dirtyComponents.length)      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Lấy transaction từ pool                        │  │
  │  │  transaction.perform(runBatchedUpdates)          │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  ┌──────────────────────────────────────┐        │  │
  │  │  │  comp1.updateComponent()             │        │  │
  │  │  │  comp2.updateComponent()             │        │  │
  │  │  │  comp3.updateComponent()             │        │  │
  │  │  │  ...                                  │        │  │
  │  │  └──────────────────────────────────────┘        │  │
  │  │                                                  │  │
  │  │  Trả transaction về pool                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.6. updateComponent — Luồng Cập Nhật Component

```javascript
// ═══════════════════════════════════════════════════════════
// updateComponent — Lifecycle trong quá trình UPDATE!
// ═══════════════════════════════════════════════════════════

updateComponent: function (transaction, prevParentElement,
                           nextParentElement, prevUnmaskedContext,
                           nextUnmaskedContext) {
    // ...

    // ① componentWillReceiveProps (nếu props thay đổi)
    if (willReceive && inst.componentWillReceiveProps) {
        inst.componentWillReceiveProps(nextProps, nextContext);
    }

    // ② _processPendingState → MERGE TẤT CẢ STATE!
    var nextState = this._processPendingState(nextProps, nextContext);

    // ③ shouldComponentUpdate → CÓ CẦN UPDATE KHÔNG?
    var shouldUpdate = true;

    if (!this._pendingForceUpdate) {
        if (inst.shouldComponentUpdate) {
            shouldUpdate = inst.shouldComponentUpdate(
                nextProps, nextState, nextContext
            );
        }
    }

    // ④ Nếu shouldUpdate = true → thực hiện update!
    if (shouldUpdate) {
        this._pendingForceUpdate = false;
        this._performComponentUpdate(
            nextParentElement, nextProps, nextState,
            nextContext, transaction, nextUnmaskedContext
        );
    }
}
```

```
  updateComponent FLOW — LIFECYCLE UPDATE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  updateComponent()                                     │
  │       │                                                │
  │       ▼ ① componentWillReceiveProps()                  │
  │       │   → CHỈ gọi khi PROPS thay đổi!              │
  │       │   → Không gọi khi chỉ setState!              │
  │       │                                                │
  │       ▼ ② _processPendingState()                       │
  │       │   → MERGE tất cả state trong queue!           │
  │       │   → Chi tiết ở section 15.7                   │
  │       │                                                │
  │       ▼ ③ shouldComponentUpdate()                      │
  │       │   → Trả về true/false!                        │
  │       │   → false → DỪNG! Không update!              │
  │       │   → true → Tiếp tục!                         │
  │       │                                                │
  │       ▼ ④ _performComponentUpdate()                    │
  │       │   (Xem chi tiết bên dưới)                     │
  │       │                                                │
  │       └──→ Component được update! ✅                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.7. \_processPendingState — Merge State Queue

```javascript
// ═══════════════════════════════════════════════════════════
// _processPendingState — MERGE tất cả state trong queue!
// ═══════════════════════════════════════════════════════════

_processPendingState: function (props, context) {
    var inst = this._instance;
    var queue = this._pendingStateQueue;

    // Reset queue = null NGAY!
    this._pendingStateQueue = null;

    // Trường hợp 1: Queue rỗng → trả state hiện tại!
    if (!queue) {
        return inst.state;
    }

    // Trường hợp 2: Queue có 1 item → trả luôn!
    if (queue.length === 1) {
        return queue[0];
    }

    // Trường hợp 3: Queue có NHIỀU items → MERGE!
    var nextState = _assign({}, inst.state);
    for (var i = 0; i < queue.length; i++) {
        var partial = queue[i];
        // Hỗ trợ cả function dạng: (prevState) => newState
        _assign(
            nextState,
            typeof partial === 'function'
                ? partial.call(inst, nextState, props, context)
                : partial
        );
    }
    return nextState;
}
```

```
  _processPendingState — 3 TRƯỜNG HỢP:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TH1: Queue = null (không có update)                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Trả về inst.state (state hiện tại)           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TH2: Queue có 1 item                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  queue = [ { count: 1 } ]                        │  │
  │  │  → Trả về { count: 1 } (không cần merge)       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TH3: Queue có NHIỀU items → FOR LOOP MERGE!          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  state = { a: 0, b: 0 }                          │  │
  │  │  queue = [ { a: 1 }, { b: 2 }, { a: 3 } ]       │  │
  │  │                                                  │  │
  │  │  Vòng 1: Object.assign({a:0,b:0}, {a:1})        │  │
  │  │         → { a: 1, b: 0 }                        │  │
  │  │  Vòng 2: Object.assign({a:1,b:0}, {b:2})        │  │
  │  │         → { a: 1, b: 2 }                        │  │
  │  │  Vòng 3: Object.assign({a:1,b:2}, {a:3})        │  │
  │  │         → { a: 3, b: 2 }  ← KẾT QUẢ CUỐI!    │  │
  │  │                                                  │  │
  │  │  ⚠ MERGE NÔNG (shallow merge)!                  │  │
  │  │  → Key trùng = GHI ĐÈ! (a: 1 → a: 3!)       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠ setState TRÙNG KEY = CHỈ GIỮ LẦN CUỐI!           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  this.setState({ count: this.state.count + 1 }); │  │
  │  │  this.setState({ count: this.state.count + 1 }); │  │
  │  │  this.setState({ count: this.state.count + 1 }); │  │
  │  │                                                  │  │
  │  │  Kết quả: count CHỈ TĂNG 1! (không phải 3!)    │  │
  │  │  → Vì this.state.count CHƯA cập nhật!          │  │
  │  │  → 3 lần đều push { count: 0 + 1 } = {count:1}│  │
  │  │  → Merge: {count:1} → chỉ tăng 1!             │  │
  │  │                                                  │  │
  │  │  GIẢI PHÁP: Dùng function form!                 │  │
  │  │  this.setState(prev => ({count: prev.count+1})); │  │
  │  │  this.setState(prev => ({count: prev.count+1})); │  │
  │  │  this.setState(prev => ({count: prev.count+1})); │  │
  │  │  // → count TĂNG 3! ✅ (mỗi lần nhận prev mới)│  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.8. \_performComponentUpdate & \_updateRenderedComponent

```javascript
// _performComponentUpdate — Thực hiện update với lifecycle!
_performComponentUpdate: function (nextElement, nextProps,
                                   nextState, nextContext,
                                   transaction, unmaskedContext) {

    var hasComponentDidUpdate = Boolean(inst.componentDidUpdate);
    var prevProps, prevState, prevContext;

    // Lưu lại giá trị CŨ (cho componentDidUpdate)
    if (hasComponentDidUpdate) {
        prevProps = inst.props;
        prevState = inst.state;
        prevContext = inst.context;
    }

    // ① GỌI componentWillUpdate()
    if (inst.componentWillUpdate) {
        inst.componentWillUpdate(nextProps, nextState, nextContext);
    }

    // ② GÁN props/state MỚI!
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;

    // ③ THỰC SỰ UPDATE rendered component!
    this._updateRenderedComponent(transaction, unmaskedContext);

    // ④ GỌI componentDidUpdate() (đăng ký qua transaction!)
    if (hasComponentDidUpdate) {
        transaction.getReactMountReady().enqueue(
            inst.componentDidUpdate.bind(inst,
                prevProps, prevState, prevContext),
            inst
        );
    }
}
```

```javascript
// _updateRenderedComponent — Quyết định: update hay remount?
_updateRenderedComponent: function (transaction, context) {
    var prevRenderedComponent = this._renderedComponent;
    var prevRenderedElement = prevRenderedComponent._currentElement;

    // Lấy element MỚI từ render()
    var nextRenderedElement = this._renderValidatedComponent();

    // ═══ QUYẾT ĐỊNH QUAN TRỌNG ═══
    if (shouldUpdateReactComponent(prevRenderedElement,
                                    nextRenderedElement)) {
        // ═══ CÙNG LOẠI → UPDATE component cũ! ═══
        prevRenderedComponent.receiveComponent(
            nextRenderedElement, transaction, context
        );
    } else {
        // ═══ KHÁC LOẠI → UNMOUNT cũ + MOUNT mới! ═══
        var oldHostNode = prevRenderedComponent.getHostNode();
        prevRenderedComponent.unmountComponent(false);

        var child = instantiateReactComponent(nextRenderedElement);
        this._renderedComponent = child;
        var nextMarkup = child.mountComponent(/*...*/);

        // Thay thế DOM node cũ bằng mới!
        this._replaceNodeWithMarkup(oldHostNode, nextMarkup);
    }
}
```

```
  _updateRenderedComponent — UPDATE hay REMOUNT?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  shouldUpdateReactComponent(prevElement, nextElement)   │
  │       │                                                │
  │       ▼                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  So sánh element cũ và mới:                      │  │
  │  │                                                  │  │
  │  │  • Cùng type + cùng key?                        │  │
  │  │    → return TRUE → UPDATE (giữ component)       │  │
  │  │    → Gọi receiveComponent()                     │  │
  │  │    → Nhanh hơn! Tái sử dụng DOM!               │  │
  │  │                                                  │  │
  │  │  • Khác type hoặc khác key?                     │  │
  │  │    → return FALSE → REMOUNT (tạo mới!)         │  │
  │  │    → unmount component cũ                       │  │
  │  │    → mount component mới                        │  │
  │  │    → Thay thế DOM node!                         │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ĐÂY LÀ LÝ DO key QUAN TRỌNG TRONG LISTS:           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  key khác → remount (chậm!)                     │  │
  │  │  key giống → update (nhanh!)                    │  │
  │  │  → key giúp React nhận diện component!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### ⚠ Tại Sao Không Được Gọi setState Trong componentWillUpdate?

```
  setState TRONG componentWillUpdate = CRASH!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  GIẢI THÍCH:                                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  componentWillUpdate() {                         │  │
  │  │    this.setState({ x: 1 }); // ← ĐỪ-NG!       │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  CHUYỆN GÌ XẢY RA:                               │  │
  │  │  setState() → _pendingStateQueue = [...] (true!) │  │
  │  │           → enqueueUpdate()                      │  │
  │  │           → performUpdateIfNecessary()            │  │
  │  │           → updateComponent()                    │  │
  │  │           → componentWillUpdate() ← LẠI GỌI!  │  │
  │  │           → setState() ← VÒNG LẶP VÔ TẬN!    │  │
  │  │                                                  │  │
  │  │  ┌──────────────────────────────────────┐        │  │
  │  │  │  componentWillUpdate                 │        │  │
  │  │  │    → setState                        │        │  │
  │  │  │      → updateComponent               │        │  │
  │  │  │        → componentWillUpdate         │        │  │
  │  │  │          → setState                  │        │  │
  │  │  │            → ... 💥 CRASH!           │        │  │
  │  │  └──────────────────────────────────────┘        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SAU KHI merge xong, React set:                        │
  │  this._pendingStateQueue = null                        │
  │  → dirtyComponent KHÔNG vào lại batch trùng lặp!     │
  │  → Đảm bảo mỗi component CHỈ update 1 lần!          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 15.9. Tóm Tắt Part 3 — Mind Map & Takeaways

```
  MIND MAP TOÀN BỘ setState FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  this.setState(partialState)                            │
  │       │                                                │
  │       ▼                                                │
  │  updater.enqueueSetState()                             │
  │       │                                                │
  │       ▼                                                │
  │  _pendingStateQueue.push(partialState)                 │
  │       │                                                │
  │       ▼                                                │
  │  enqueueUpdate(component)                              │
  │       │                                                │
  │       ├─── isBatchingUpdates = false ──┐               │
  │       │                                 ▼               │
  │       │    batchedUpdates(enqueueUpdate)                │
  │       │    → isBatchingUpdates = true                  │
  │       │    → transaction.perform(enqueueUpdate)        │
  │       │              │                                  │
  │       ├─── isBatchingUpdates = true ───┐               │
  │       │                                 ▼               │
  │       │    dirtyComponents.push(comp)                   │
  │       │              │                                  │
  │       │              ◀──────────────────┘               │
  │       │              │                                  │
  │       │              ▼                                  │
  │       │  FLUSH_BATCHED_UPDATES.close()                  │
  │       │         │                                       │
  │       │         ▼                                       │
  │       │  flushBatchedUpdates()                          │
  │       │  → duyệt dirtyComponents[]                    │
  │       │         │                                       │
  │       │         ▼                                       │
  │       │  updateComponent()                              │
  │       │    ├─ componentWillReceiveProps()               │
  │       │    ├─ _processPendingState() ← MERGE state!   │
  │       │    ├─ shouldComponentUpdate()                   │
  │       │    ├─ componentWillUpdate()                     │
  │       │    ├─ render() → lấy VDOM mới                 │
  │       │    ├─ _updateRenderedComponent()                │
  │       │    │   ├─ shouldUpdate → receiveComponent()    │
  │       │    │   └─ !shouldUpdate → unmount + mount()   │
  │       │    └─ componentDidUpdate()                      │
  │       │         │                                       │
  │       │         ▼                                       │
  │       │  RESET_BATCHED_UPDATES.close()                  │
  │       │  → isBatchingUpdates = false                   │
  │       │                                                │
  │       └──→ ✅ Update hoàn tất!                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  ⭐ TAKEAWAYS TỪ PART 3:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. setState() KHÔNG update ngay!                      │
  │     → Push vào _pendingStateQueue (array)!            │
  │     → Merge SAU trong _processPendingState()!         │
  │                                                        │
  │  2. Transaction = cơ chế "bọc" function!              │
  │     → initialize() → method() → close()              │
  │     → Đảm bảo setup/cleanup tự động!                 │
  │                                                        │
  │  3. batchingStrategy = "máy trạng thái"!              │
  │     → isBatchingUpdates flag quyết định logic!        │
  │     → false: bắt đầu batch mới!                      │
  │     → true: chỉ push vào dirtyComponents!             │
  │                                                        │
  │  4. 2 Wrappers trong transaction:                      │
  │     → RESET_BATCHED_UPDATES: quản lý flag batch!      │
  │     → FLUSH_BATCHED_UPDATES: thực sự update!          │
  │                                                        │
  │  5. Wrapper TRÁNH infinite loop!                       │
  │     → Lần 1: set true + perform                       │
  │     → Trong perform: push queue (không gọi lại!)     │
  │     → Sau perform: flush + reset!                     │
  │                                                        │
  │  6. _processPendingState merge bằng Object.assign!     │
  │     → SHALLOW MERGE! Key trùng = ghi đè!             │
  │     → setState cùng key 3 lần = chỉ giữ lần cuối!   │
  │     → Giải pháp: dùng function form!                  │
  │                                                        │
  │  7. shouldComponentUpdate() = "cửa chặn"!             │
  │     → return false → DỪNG update!                    │
  │     → QUAN TRỌNG cho performance optimization!        │
  │                                                        │
  │  8. _updateRenderedComponent quyết định:               │
  │     → Cùng type+key → UPDATE (nhanh!)                │
  │     → Khác type/key → UNMOUNT+MOUNT (chậm!)          │
  │     → Đây là lý do key QUAN TRỌNG trong lists!       │
  │                                                        │
  │  9. KHÔNG gọi setState trong componentWillUpdate!     │
  │     → Gây vòng lặp vô tận → CRASH browser!          │
  │                                                        │
  │  10. componentDidUpdate = an toàn cho setState!       │
  │      → Đăng ký qua transaction → bất đồng bộ!       │
  │                                                        │
  │  11. Dependency Injection trong React:                 │
  │      → ReactDefaultBatchingStrategy được INJECT!      │
  │      → Qua ReactDefaultInjection.js khi khởi tạo!    │
  │      → Cho phép thay thế strategy (VD: SSR)!          │
  │                                                        │
  │  12. Sau merge, _pendingStateQueue = null!             │
  │      → Tránh component vào batch trùng lặp!          │
  │      → Đảm bảo mỗi comp CHỈ update 1 lần/batch!    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §16. Part 4: Event System — React Xử Lý Sự Kiện Như Thế Nào?

```
═══════════════════════════════════════════════════════════════
  REACT KHÔNG BIND EVENT LÊN TỪNG DOM!
  → TẤT CẢ EVENT BIND LÊN document (Event Delegation)!
  → Tạo SyntheticEvent để cross-browser compatibility!
  → Destroy sau khi xử lý → giảm memory overhead!
═══════════════════════════════════════════════════════════════
```

### 16.1. Native Event vs React Event

```
  SO SÁNH: Native Event vs React Event
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  NATIVE EVENT (Sự kiện gốc):                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  button.addEventListener('click', handler);      │  │
  │  │                                                  │  │
  │  │  → Bind trực tiếp lên DOM element!              │  │
  │  │  → Mỗi element = 1 listener!                   │  │
  │  │  → 100 buttons = 100 listeners! 😰              │  │
  │  │  → Tốn memory + giảm performance!               │  │
  │  │                                                  │  │
  │  │    ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │  │
  │  │    │btn1 │  │btn2 │  │btn3 │  │btn4 │ ...       │  │
  │  │    │click│  │click│  │click│  │click│           │  │
  │  │    └─────┘  └─────┘  └─────┘  └─────┘          │  │
  │  │       ↓        ↓        ↓        ↓              │  │
  │  │    handler  handler  handler  handler            │  │
  │  │    (riêng)  (riêng)  (riêng)  (riêng)            │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  REACT EVENT (Sự kiện React):                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  <Component onClick={this.handleClick} />        │  │
  │  │                                                  │  │
  │  │  → KHÔNG bind lên Component DOM!                │  │
  │  │  → TẤT CẢ bind lên document!                   │  │
  │  │  → 100 buttons = 1 listener trên document! 🎉   │  │
  │  │  → Event Delegation Pattern!                    │  │
  │  │                                                  │  │
  │  │    ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │  │
  │  │    │btn1 │  │btn2 │  │btn3 │  │btn4 │ ...       │  │
  │  │    └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘          │  │
  │  │       │        │        │        │              │  │
  │  │       └────────┴────────┴────────┘              │  │
  │  │                   │ (bubble lên)                │  │
  │  │                   ▼                              │  │
  │  │    ┌──────────────────────────────────┐          │  │
  │  │    │         document                  │          │  │
  │  │    │  (1 listener duy nhất cho click) │          │  │
  │  │    │  → dispatch → tìm component    │          │  │
  │  │    │  → gọi đúng handler!           │          │  │
  │  │    └──────────────────────────────────┘          │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 16.2. Event Registration — Đăng Ký Sự Kiện

```
  KHI NÀO ĐĂNG KÝ? → Trong mountComponent!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  <Component onClick={this.handleClick} />              │
  │       │                                                │
  │       ▼  mountComponent()                              │
  │       │                                                │
  │       ▼  _updateDOMProperties()                        │
  │       │   → Duyệt tất cả props!                      │
  │       │   → Tìm props bắt đầu bằng "on"!             │
  │       │   → VD: onClick, onChange, onSubmit...        │
  │       │                                                │
  │       ▼  enqueuePutListener()                          │
  │       │                                                │
  │       └──→ Bắt đầu đăng ký event!                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — enqueuePutListener

```javascript
// ═══════════════════════════════════════════════════════════
// enqueuePutListener — Entry point đăng ký event!
// ═══════════════════════════════════════════════════════════

function enqueuePutListener(inst, registrationName, listener, transaction) {
  // ① Tìm thực DOM
  var isDocumentFragment =
    containerInfo._node && containerInfo._node.nodeType === DOC_FRAGMENT_TYPE;
  var doc = isDocumentFragment
    ? containerInfo._node
    : containerInfo._ownerDocument;

  // ② Gọi listenTo để ĐĂNG KÝ event lên document!
  listenTo(registrationName, doc);

  // ③ Đưa vào transaction queue để LƯU TRỮ callback!
  transaction.getReactMountReady().enqueue(putListener, {
    inst: inst,
    registrationName: registrationName,
    listener: listener,
  });
}
```

```
  listenTo → trapBubbledEvent / trapCapturedEvent
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  listenTo(registrationName, doc)                       │
  │       │                                                │
  │       ▼                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Kiểm tra: event này đã đăng ký CHƯA?           │  │
  │  │  (Tránh đăng ký trùng lặp!)                     │  │
  │  └──────────┬──────────────────┬────────────────────┘  │
  │             │                  │                        │
  │       Chưa đăng ký       Đã đăng ký                   │
  │             │                  │                        │
  │             ▼                  ▼                        │
  │  ┌────────────────┐     (Bỏ qua!)                     │
  │  │ Phân loại event│                                    │
  │  └────┬───────┬───┘                                    │
  │       │       │                                        │
  │   Bubbling  Capturing                                  │
  │       │       │                                        │
  │       ▼       ▼                                        │
  │  trapBubbled trapCaptured                              │
  │  Event()     Event()                                   │
  │       │       │                                        │
  │       ▼       ▼                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // Cả 2 đều gọi cùng 1 API gốc:               │  │
  │  │  document.addEventListener(                      │  │
  │  │    eventType,       // 'click', 'change', etc.   │  │
  │  │    dispatchEvent,   // handler thống nhất!       │  │
  │  │    useCapture        // true hoặc false          │  │
  │  │  );                                              │  │
  │  │                                                  │  │
  │  │  // Khi unmount:                                 │  │
  │  │  document.removeEventListener(                   │  │
  │  │    eventType, dispatchEvent, useCapture           │  │
  │  │  );                                              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠ ĐIỂM MẤU CHỐT:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → CHỈ 1 listener/event type trên document!    │  │
  │  │  → dispatchEvent = handler THỐNG NHẤT!          │  │
  │  │  → React TỰ dispatch đến đúng component!       │  │
  │  │  → Giảm memory: N events → 1 listener!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 16.3. Event Storage — Lưu Trữ Callback

```javascript
// ═══════════════════════════════════════════════════════════
// EventPluginHub.putListener — Lưu callback vào listenerBank!
// ═══════════════════════════════════════════════════════════

putListener: function (inst, registrationName, listener) {
    // listenerBank = { onClick: { '.0.1': handler, '.0.2': handler },
    //                  onChange: { '.0.3': handler } }

    var key = getDictionaryKey(inst);
    // key = component ID, VD: '.0.1', '.0.2.3'

    var bankForRegistrationName =
        listenerBank[registrationName] || {};
    // Lấy hoặc tạo bank cho event type này!

    bankForRegistrationName[key] = listener;
    // Lưu listener theo component key!

    listenerBank[registrationName] = bankForRegistrationName;
}
```

```
  CẤU TRÚC listenerBank — 2D LOOKUP TABLE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  listenerBank = {                                      │
  │    'onClick': {                                        │
  │      '.0.1':     handleClick_ButtonA,                  │
  │      '.0.2':     handleClick_ButtonB,                  │
  │      '.0.3.1':   handleClick_Link,                     │
  │    },                                                  │
  │    'onChange': {                                        │
  │      '.0.4':     handleChange_Input,                   │
  │      '.0.5':     handleChange_Select,                  │
  │    },                                                  │
  │    'onSubmit': {                                        │
  │      '.0':       handleSubmit_Form,                    │
  │    }                                                   │
  │  };                                                    │
  │                                                        │
  │  TRUY VẤN:                                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  listenerBank['onClick']['.0.1']                 │  │
  │  │       │              │                            │  │
  │  │   Event Type    Component Key                     │  │
  │  │                                                  │  │
  │  │  → Tìm đúng handler  trong O(1)! ⚡             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 16.4. Event Dispatch — Phân Phối Sự Kiện

```
  KHI USER CLICK → CHUYỆN GÌ XẢY RA?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  User click button                                     │
  │       │                                                │
  │       ▼ (native event bubble lên)                      │
  │                                                        │
  │  document nhận được event!                             │
  │       │                                                │
  │       ▼ dispatchEvent (handler thống nhất)             │
  │       │                                                │
  │       ▼ handleTopLevelImpl(bookKeeping)                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Mã nguồn — handleTopLevelImpl

```javascript
// ═══════════════════════════════════════════════════════════
// handleTopLevelImpl — Entry point khi event xảy ra!
// ═══════════════════════════════════════════════════════════

function handleTopLevelImpl(bookKeeping) {
  // ① Tìm DOM target đã trigger event
  let targetInst = bookKeeping.targetInst;
  let ancestor = targetInst;

  // ② LƯU cấu trúc DOM hiện tại trước khi xử lý!
  //    (Vì callback có thể thay đổi DOM!)
  do {
    bookKeeping.ancestors.push(ancestor);
    const root = findRootContainerNode(ancestor);
    bookKeeping.ancestors.push(ancestor);
    ancestor = getClosestInstanceFromNode(root);
  } while (ancestor);

  // ③ Duyệt ancestors → gọi _handleTopLevel cho từng cái!
  for (let i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    _handleTopLevel(
      bookKeeping.topLevelType, // 'click'
      targetInst, // component instance
      bookKeeping.nativeEvent, // native event object
      getEventTarget(bookKeeping.nativeEvent), // DOM target
    );
  }
}
```

```
  TẠI SAO LƯU ancestors TRƯỚC?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ⚠ CALLBACK CÓ THỂ THAY ĐỔI DOM!                    │
  │                                                        │
  │  VD:                                                   │
  │  handleClick() {                                       │
  │    this.setState({ show: false }); // Xóa element!    │
  │  }                                                     │
  │                                                        │
  │  Nếu KHÔNG lưu trước:                                  │
  │  → DOM thay đổi giữa chừng!                          │
  │  → Duyệt sai ancestors!                               │
  │  → Event dispatch bị lỗi!                             │
  │                                                        │
  │  GIẢI PHÁP: Snapshot DOM vào array TRƯỚC!             │
  │  → Duyệt array ổn định!                              │
  │  → Không bị ảnh hưởng bởi DOM changes!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 16.5. SyntheticEvent — Sự Kiện Tổng Hợp

```
  _handleTopLevel → extractEvents → SyntheticEvent!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  _handleTopLevel(topLevelType, targetInst,             │
  │                  nativeEvent, nativeTarget)             │
  │       │                                                │
  │       ▼                                                │
  │  EventPluginHub.extractEvents(                         │
  │    topLevelType,  // 'click'                           │
  │    targetInst,    // component instance                 │
  │    nativeEvent,   // native browser event              │
  │    nativeTarget   // DOM target element                │
  │  );                                                    │
  │       │                                                │
  │       ▼                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  extractEvents NỘI BỘ:                          │  │
  │  │                                                  │  │
  │  │  switch (topLevelType) {                         │  │
  │  │    case 'click':                                 │  │
  │  │    case 'dblclick':                              │  │
  │  │    case 'mousedown':                             │  │
  │  │      → Dùng SimpleEventPlugin!                  │  │
  │  │      → Tạo SyntheticMouseEvent!                 │  │
  │  │                                                  │  │
  │  │    case 'change':                                │  │
  │  │      → Dùng ChangeEventPlugin!                  │  │
  │  │      → Tạo SyntheticEvent!                      │  │
  │  │                                                  │  │
  │  │    case 'mouseenter':                            │  │
  │  │    case 'mouseleave':                            │  │
  │  │      → Dùng EnterLeaveEventPlugin!              │  │
  │  │      → Tạo SyntheticMouseEvent!                 │  │
  │  │                                                  │  │
  │  │    case 'select':                                │  │
  │  │      → Dùng SelectEventPlugin!                  │  │
  │  │                                                  │  │
  │  │    case 'beforeInput':                           │  │
  │  │      → Dùng BeforeInputEventPlugin!             │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │       │                                                │
  │       ▼                                                │
  │  Trả về SyntheticEvent instance!                       │
  │  → Cross-browser compatible!                          │
  │  → Có nativeEvent bên trong!                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### EventPluginHub — 5 Plugins

```javascript
// ═══════════════════════════════════════════════════════════
// EventPluginHub — Inject qua Dependency Injection!
// ═══════════════════════════════════════════════════════════

ReactInjection.EventPluginHub.injectEventPluginsByName({
  SimpleEventPlugin: SimpleEventPlugin,
  EnterLeaveEventPlugin: EnterLeaveEventPlugin,
  ChangeEventPlugin: ChangeEventPlugin,
  SelectEventPlugin: SelectEventPlugin,
  BeforeInputEventPlugin: BeforeInputEventPlugin,
});

// Mỗi plugin xử lý 1 nhóm event type!
// → Tạo SyntheticEvent phù hợp!
// → Cross-browser normalization!
```

```
  5 EVENT PLUGINS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────────┬───────────────────────────┐   │
  │  │ Plugin              │ Xử lý events              │   │
  │  ├─────────────────────┼───────────────────────────┤   │
  │  │ SimpleEventPlugin   │ click, dblclick, mousedown│   │
  │  │                     │ mouseup, touchstart, etc. │   │
  │  ├─────────────────────┼───────────────────────────┤   │
  │  │ EnterLeaveEvent     │ mouseenter, mouseleave    │   │
  │  │ Plugin              │                           │   │
  │  ├─────────────────────┼───────────────────────────┤   │
  │  │ ChangeEventPlugin   │ change                    │   │
  │  ├─────────────────────┼───────────────────────────┤   │
  │  │ SelectEventPlugin   │ select                    │   │
  │  ├─────────────────────┼───────────────────────────┤   │
  │  │ BeforeInputEvent    │ beforeInput,              │   │
  │  │ Plugin              │ compositionStart, etc.    │   │
  │  └─────────────────────┴───────────────────────────┘   │
  │                                                        │
  │  ⚠ Tất cả inject qua Dependency Injection!            │
  │  → Dễ thay thế, mở rộng!                             │
  │  → Mỗi plugin tự biết cách normalize event!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 16.6. Event Handling — Xử Lý Sự Kiện (Batch!)

```javascript
// ═══════════════════════════════════════════════════════════
// Event Handling — Batch giống setState!
// ═══════════════════════════════════════════════════════════

// Trong handleTopLevel:

// ① Event vào hàng đợi!
EventPluginHub.enqueueEvents(events);

// ② Xử lý hàng đợi!
EventPluginHub.processEventQueue(false);
```

```javascript
// processEventQueue — Duyệt event queue!
processEventQueue: function (simulated) {
    var processingEventQueue = eventQueue;
    eventQueue = null; // Reset queue!

    // Duyệt từng event
    forEachAccumulated(processingEventQueue, function (event) {
        executeDispatchesAndReleaseSimulated(event);
        //                    ^^^^^^^^^^^^^^^^
        //                    XỬ LÝ + GIẢI PHÓNG!
    });
}
```

```
  LUỒNG XỬ LÝ EVENT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  processEventQueue                                     │
  │       │                                                │
  │       ▼ Duyệt từng event                              │
  │       │                                                │
  │       ▼ executeDispatchesAndReleaseSimulated(event)    │
  │       │                                                │
  │       ├── executeDispatchesInOrder(event)               │
  │       │       │                                        │
  │       │       ▼                                        │
  │       │   var dispatchListeners = event._dispatchLis-  │
  │       │                           teners;              │
  │       │   var dispatchInstances = event._dispatchIns-  │
  │       │                           tances;              │
  │       │       │                                        │
  │       │       ▼ Duyệt từng listener                   │
  │       │       │                                        │
  │       │       ▼ executeDispatch(event, simulated,      │
  │       │                         listener, inst)        │
  │       │       │                                        │
  │       │       ▼ ReactErrorUtils.invokeGuardedCallback( │
  │       │            type, listener, event)               │
  │       │       │                                        │
  │       │       ▼ invokeGuardedCallback(name, func, a)   │
  │       │       │                                        │
  │       │       ▼ func(a)                                │
  │       │         │                                      │
  │       │         │  func = listener (callback bạn viết!)│
  │       │         │  a = event (SyntheticEvent!)         │
  │       │         │                                      │
  │       │         ▼ this.handleClick(syntheticEvent) ✅  │
  │       │                                                │
  │       └── event.constructor.release(event)             │
  │            │                                           │
  │            ▼ GIẢI PHÓNG SyntheticEvent!               │
  │              → Reduce memory overhead!                │
  │              → Event object trở thành null!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  CỐT LÕI CỦA EVENT HANDLING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  // Tưởng phức tạp, thực ra CỐT LÕI chỉ có:         │
  │                                                        │
  │  function invokeGuardedCallback(name, func, a) {       │
  │      func(a);                                          │
  │  }                                                     │
  │                                                        │
  │  // func = listener = handleClick (callback bạn viết!) │
  │  // a = event = SyntheticEvent instance                 │
  │                                                        │
  │  // VẬY NÊN:                                           │
  │  // handleClick(event) ← event ở đây là SyntheticEvent│
  │  // event.nativeEvent  ← native browser event bên trong│
  │  // event.target       ← DOM target                    │
  │  // event.preventDefault() ← cross-browser!           │
  │  // event.stopPropagation() ← cross-browser!          │
  │                                                        │
  │  ⚠ SAU KHI XỬ LÝ → release(event)!                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  event.constructor.release(event)                │  │
  │  │  → Tất cả properties = null!                    │  │
  │  │  → Trả event object về pool!                    │  │
  │  │  → Tái sử dụng cho event tiếp theo!             │  │
  │  │                                                  │  │
  │  │  ⚠ KHÔNG thể truy cập event SAU callback!      │  │
  │  │  handleClick(event) {                            │  │
  │  │    setTimeout(() => {                            │  │
  │  │      console.log(event.target);                  │  │
  │  │      // → null! (đã bị release!)               │  │
  │  │    }, 0);                                        │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  GIẢI PHÁP: event.persist()                     │  │
  │  │  → Ngăn React release event!                    │  │
  │  │  → Giữ reference lâu dài!                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 16.7. Tổng Kết — Mind Map Toàn Bộ Event System

```
  MIND MAP: REACT EVENT SYSTEM
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─ ĐĂNG KÝ (Registration) ─────────────────────────┐ │
  │  │                                                    │ │
  │  │  <Comp onClick={handler} />                        │ │
  │  │       │                                            │ │
  │  │       ▼ mountComponent()                           │ │
  │  │       ▼ _updateDOMProperties()                     │ │
  │  │       ▼ enqueuePutListener()                       │ │
  │  │       ├─ listenTo() → document.addEventListener()  │ │
  │  │       └─ putListener() → listenerBank[type][key]   │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  │  ┌─ LƯU TRỮ (Storage) ──────────────────────────────┐ │
  │  │                                                    │ │
  │  │  listenerBank = {                                  │ │
  │  │    onClick:  { '.0.1': fn, '.0.2': fn },           │ │
  │  │    onChange: { '.0.3': fn }                         │ │
  │  │  }                                                 │ │
  │  │  → 2D lookup: O(1) tìm handler!                  │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  │  ┌─ PHÂN PHỐI (Dispatch) ────────────────────────────┐ │
  │  │                                                    │ │
  │  │  User click → event bubble → document              │ │
  │  │       │                                            │ │
  │  │       ▼ handleTopLevelImpl()                       │ │
  │  │       ▼ Snapshot ancestors (tránh DOM thay đổi!)  │ │
  │  │       ▼ _handleTopLevel()                          │ │
  │  │       ▼ extractEvents() → SyntheticEvent!         │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  │  ┌─ XỬ LÝ (Handling) ───────────────────────────────┐ │
  │  │                                                    │ │
  │  │  enqueueEvents() → eventQueue                     │ │
  │  │  processEventQueue()                               │ │
  │  │       ▼ executeDispatchesInOrder()                 │ │
  │  │       ▼ invokeGuardedCallback(type, listener, evt)│ │
  │  │       ▼ listener(syntheticEvent) ← BẠN VIẾT!    │ │
  │  │       ▼ release(event) → giải phóng memory!      │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Bảng So Sánh: Native Event vs React Event

```
  ┌──────────────────┬────────────────────┬────────────────────┐
  │ Tiêu chí         │ Native Event       │ React Event        │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Bind lên         │ Từng DOM element   │ document (1 nơi!)  │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Memory           │ N listeners        │ 1 listener/type    │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Cross-browser    │ Tự xử lý          │ SyntheticEvent!    │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Callback storage │ Trên DOM node      │ listenerBank (2D)  │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Lifecycle        │ Manual remove      │ Tự cleanup khi     │
  │                  │                    │ unmount!            │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Event object     │ Giữ mãi           │ Release sau xử lý │
  │                  │                    │ (event pooling!)   │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ Performance      │ Giảm khi DOM lớn  │ Ổn định (O(1)!)   │
  └──────────────────┴────────────────────┴────────────────────┘
```

### 16.8. Takeaways

```
  ⭐ TAKEAWAYS TỪ PART 4:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. React KHÔNG bind event lên từng DOM!              │
  │     → Tất cả bind lên document!                      │
  │     → Event Delegation Pattern!                       │
  │                                                        │
  │  2. Đăng ký event xảy ra trong mountComponent!        │
  │     → _updateDOMProperties → enqueuePutListener      │
  │     → listenTo → document.addEventListener           │
  │                                                        │
  │  3. Callback lưu trong listenerBank (2D table)!       │
  │     → listenerBank[eventType][componentKey]           │
  │     → Truy vấn O(1)!                                 │
  │                                                        │
  │  4. SyntheticEvent = event wrapper cross-browser!     │
  │     → extractEvents() tạo qua EventPluginHub         │
  │     → 5 plugins cho các nhóm event khác nhau         │
  │     → Dependency Injection để linh hoạt!              │
  │                                                        │
  │  5. Event XỬ LÝ theo batch (giống setState!)         │
  │     → enqueueEvents → processEventQueue              │
  │     → executeDispatchesInOrder                        │
  │                                                        │
  │  6. Cốt lõi: invokeGuardedCallback → func(a)!       │
  │     → func = listener (callback bạn viết!)           │
  │     → a = SyntheticEvent instance!                    │
  │     → Đó là lý do callback nhận được event!          │
  │                                                        │
  │  7. Event Pooling: release sau khi xử lý!            │
  │     → event.constructor.release(event)               │
  │     → Properties trở thành null!                     │
  │     → Tái sử dụng object → giảm GC!                │
  │                                                        │
  │  8. CẢNH BÁO: Không truy cập event bất đồng bộ!     │
  │     → setTimeout(() => event.target) // null!        │
  │     → GIẢI PHÁP: event.persist()!                    │
  │                                                        │
  │  9. Snapshot ancestors trước khi dispatch!             │
  │     → Vì callback có thể thay đổi DOM!              │
  │     → Lưu vào array → duyệt ổn định!               │
  │                                                        │
  │  10. Kết luận: React quản lý event TẬP TRUNG!       │
  │      → Thay vì phân tán trên từng DOM!              │
  │      → Capture → SyntheticEvent → Dispatch →        │
  │        Execute → Release!                             │
  │      → Tăng responsiveness + giảm memory!            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §17. Tự Viết React Từ Đầu (Part 1): JSX & Virtual DOM

```
═══════════════════════════════════════════════════════════════
  SERIES: IMPLEMENTING REACT FROM SCRATCH
  → Không dùng thư viện, tự viết TẤT CẢ bằng tay!
  → Part 1: JSX + Virtual DOM + render()
  → Hiểu WHY Virtual DOM tồn tại!
═══════════════════════════════════════════════════════════════
```

### 17.1. JSX — Bản Chất Là Gì?

```
  JSX KHÔNG PHẢI JavaScript!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  JSX = Syntactic Sugar (đường cú pháp)!               │
  │  → Cho phép viết HTML trong JavaScript!               │
  │  → NHƯNG browser KHÔNG hiểu JSX!                     │
  │  → Cần Babel transform trước!                         │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │           JSX (Developer viết)                   │  │
  │  │                                                  │  │
  │  │  const title = (                                 │  │
  │  │    <h1 className="title">                        │  │
  │  │      Hello, world!                               │  │
  │  │    </h1>                                         │  │
  │  │  );                                              │  │
  │  │                                                  │  │
  │  └──────────────────┬───────────────────────────────┘  │
  │                     │                                  │
  │                     ▼  Babel transform-react-jsx       │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │        JavaScript (Browser hiểu)                 │  │
  │  │                                                  │  │
  │  │  const title = React.createElement(              │  │
  │  │    'h1',                    // tag name          │  │
  │  │    { className: 'title' }, // attributes        │  │
  │  │    'Hello, world!'          // children          │  │
  │  │  );                                              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Babel Config — transform-react-jsx

```javascript
// .babelrc — Cấu hình Babel!
{
    "presets": ["env"],
    "plugins": [
        ["transform-react-jsx", {
            "pragma": "React.createElement"
            //         ^^^^^^^^^^^^^^^^^^^^^
            //  pragma = tên hàm mà JSX sẽ TRANSFORM thành!
            //
            //  Mặc định: React.createElement
            //  Có thể đổi thành: h (Preact), createElement, etc.
            //
            //  VÌ VẬY: import React from 'react' là BẮT BUỘC!
            //  → Dù code không dùng React trực tiếp!
            //  → Vì JSX transform NGẦM gọi React.createElement!
        }]
    ]
}
```

```
  ⚠ GIẢI ĐÁP CÂU HỎI KINH ĐIỂN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "Tại sao phải import React dù không dùng trực tiếp?" │
  │                                                        │
  │  import React from 'react';  // ← Tại sao?           │
  │  import ReactDOM from 'react-dom';                     │
  │                                                        │
  │  ReactDOM.render(<App />, document.getElementById(     │
  │    'root'));                                            │
  │                                                        │
  │  // <App /> sẽ bị Babel transform thành:              │
  │  // React.createElement(App, null)                     │
  │  //   ^^^^^^^^                                        │
  │  //   CẦN React object!                               │
  │  //   → Nếu không import → ReferenceError!           │
  │                                                        │
  │  TRẢ LỜI: Vì Babel transform JSX thành                │
  │  React.createElement() → cần React trong scope!       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.2. Ví Dụ Phức Tạp — JSX Transform

```
  JSX phức tạp:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  // Developer viết:                                    │
  │  const element = (                                     │
  │    <div>                                               │
  │      hello                                             │
  │      <span>world!</span>                               │
  │    </div>                                              │
  │  );                                                    │
  │                                                        │
  │                   │ Babel transform                    │
  │                   ▼                                    │
  │                                                        │
  │  // Thành ra:                                          │
  │  const element = React.createElement(                  │
  │    'div',    // tag = 'div'                            │
  │    null,     // attrs = null (không có)                │
  │    'hello',  // child 1 = text node                    │
  │    React.createElement(                                │
  │      'span', // tag = 'span'                           │
  │      null,   // attrs = null                           │
  │      'world!'// child = text node                      │
  │    )                                                   │
  │  );                                                    │
  │                                                        │
  │  ⚠ NESTED: createElement lồng createElement!          │
  │  → Children cũng là createElement!                    │
  │  → Đệ quy tự nhiên!                                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.3. Tự Viết React.createElement — Tạo Virtual DOM

```
  CHÚNG TA SẼ TỰ VIẾT LẠI React.createElement!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  createElement(tag, attrs, child1, child2, child3...)  │
  │                                                        │
  │  Tham số:                                              │
  │  ┌─────────┬─────────────────────────────────────────┐ │
  │  │ tag     │ Tên thẻ: 'div', 'h1', 'span', etc.     │ │
  │  ├─────────┼─────────────────────────────────────────┤ │
  │  │ attrs   │ Object chứa attributes:                 │ │
  │  │         │ { className, id, onClick, style, ... }  │ │
  │  ├─────────┼─────────────────────────────────────────┤ │
  │  │ children│ Từ tham số thứ 3 trở đi = child nodes! │ │
  │  │         │ Có thể là string hoặc createElement()   │ │
  │  └─────────┴─────────────────────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: React.createElement
// → Trả về 1 object mô tả DOM node!
// → Object này chính là VIRTUAL DOM!
// ═══════════════════════════════════════════════════════════

function createElement(tag, attrs, ...children) {
  // ...children = ES6 rest parameters!
  // → Thu thập child1, child2, child3... thành array!
  //
  // VD: createElement('div', null, 'hello', span_vdom)
  //   → children = ['hello', span_vdom]

  return {
    tag, // 'div', 'h1', 'span', ...
    attrs, // { className: 'title', onClick: fn } hoặc null
    children, // ['hello', { tag: 'span', ... }]
  };
}

// Đặt vào object React:
const React = {
  createElement,
};
```

```
  GỌI THỬ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  const element = (                                     │
  │    <div>                                               │
  │      hello<span>world!</span>                          │
  │    </div>                                              │
  │  );                                                    │
  │                                                        │
  │  console.log(element);                                 │
  │                                                        │
  │  // KẾT QUẢ:                                          │
  │  {                                                     │
  │    tag: 'div',                                         │
  │    attrs: null,                                        │
  │    children: [                                         │
  │      'hello',              // ← text node             │
  │      {                                                 │
  │        tag: 'span',                                    │
  │        attrs: null,                                    │
  │        children: ['world!'] // ← text node            │
  │      }                                                 │
  │    ]                                                   │
  │  }                                                     │
  │                                                        │
  │  ⭐ Object này = VIRTUAL DOM!                         │
  │  → Ghi lại toàn bộ thông tin của DOM tree!           │
  │  → Từ object này → có thể tạo Real DOM!             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.4. Virtual DOM — Tại Sao Tồn Tại?

```
  VIRTUAL DOM = JavaScript Object mô tả Real DOM!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  WHY VIRTUAL DOM?                                      │
  │                                                        │
  │  ① Real DOM rất NẶNG!                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  var div = document.createElement('div');        │  │
  │  │  console.log(Object.keys(div).length);           │  │
  │  │  // → 200+ properties! 😱                       │  │
  │  │  // align, title, lang, className, style,       │  │
  │  │  // draggable, hidden, tabIndex, dir, ...       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② Virtual DOM rất NHẸ!                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  { tag: 'div', attrs: null, children: [] }      │  │
  │  │  // → Chỉ 3 properties!                        │  │
  │  │  // Tạo nhanh, so sánh nhanh!                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ Quy trình:                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  State thay đổi                                  │  │
  │  │       │                                          │  │
  │  │       ▼  Tạo Virtual DOM MỚI (object nhẹ!)     │  │
  │  │       │                                          │  │
  │  │       ▼  So sánh (diff) với Virtual DOM CŨ     │  │
  │  │       │  (So sánh JS objects = NHANH!)          │  │
  │  │       │                                          │  │
  │  │       ▼  Tìm ra CHỈ phần thay đổi!            │  │
  │  │       │                                          │  │
  │  │       ▼  Cập nhật CHỈ phần đó lên Real DOM!   │  │
  │  │          (Minimal DOM operations!)               │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH:                                              │
  │  ┌──────────────┬─────────────┬─────────────────────┐  │
  │  │              │ Không VDOM  │ Có VDOM             │  │
  │  ├──────────────┼─────────────┼─────────────────────┤  │
  │  │ Cập nhật     │ innerHTML   │ Chỉ phần thay đổi │  │
  │  │              │ toàn bộ!   │ (patch!)            │  │
  │  ├──────────────┼─────────────┼─────────────────────┤  │
  │  │ DOM ops      │ Nhiều, nặng │ Ít, nhẹ            │  │
  │  ├──────────────┼─────────────┼─────────────────────┤  │
  │  │ Performance  │ Giảm nhanh │ Ổn định            │  │
  │  └──────────────┴─────────────┴─────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.5. Tự Viết ReactDOM.render — Render Virtual DOM → Real DOM

```
  render(vnode, container) → Biến Virtual DOM thành Real DOM!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactDOM.render(                                      │
  │    <h1>Hello, world!</h1>,     // ← Virtual DOM       │
  │    document.getElementById('root') // ← container     │
  │  );                                                    │
  │                                                        │
  │  // Sau Babel transform:                               │
  │  ReactDOM.render(                                      │
  │    React.createElement('h1', null, 'Hello, world!'),   │
  │    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^        │
  │    //  = { tag: 'h1', attrs: null,                     │
  │    //      children: ['Hello, world!'] }               │
  │    document.getElementById('root')                     │
  │  );                                                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: render() — Biến VDOM → Real DOM!
// ═══════════════════════════════════════════════════════════

function render(vnode, container) {
  // ① BASE CASE: vnode là string → tạo text node!
  if (typeof vnode === "string") {
    const textNode = document.createTextNode(vnode);
    return container.appendChild(textNode);
  }

  // ② Tạo Real DOM element từ tag name!
  const dom = document.createElement(vnode.tag);
  //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //  VD: vnode.tag = 'div' → document.createElement('div')

  // ③ Set attributes (className, style, onClick, etc.)
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      const value = vnode.attrs[key];
      setAttribute(dom, key, value);
    });
  }

  // ④ ĐỆ QUY: Render từng child node!
  vnode.children.forEach((child) => render(child, dom));
  //                                      ^^^    ^^^
  //                                   child vnode  mount vào dom

  // ⑤ Mount vào container!
  return container.appendChild(dom);
}
```

```
  LUỒNG ĐỆ QUY CỦA render():
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  render({ tag: 'div', children: [                      │
  │    'hello',                                            │
  │    { tag: 'span', children: ['world!'] }               │
  │  ]}, document.getElementById('root'))                  │
  │       │                                                │
  │       ▼ ② createElement('div') → <div>                │
  │       │                                                │
  │       ▼ ④ Duyệt children:                            │
  │       │                                                │
  │       ├── child[0] = 'hello' (string!)                │
  │       │   │                                            │
  │       │   ▼ ① createTextNode('hello')                 │
  │       │   ▼ appendChild vào <div>                     │
  │       │                                                │
  │       └── child[1] = { tag: 'span', ... }             │
  │           │                                            │
  │           ▼ ② createElement('span') → <span>          │
  │           │                                            │
  │           ▼ ④ Duyệt children:                        │
  │           │                                            │
  │           └── child[0] = 'world!' (string!)           │
  │               │                                        │
  │               ▼ ① createTextNode('world!')            │
  │               ▼ appendChild vào <span>                │
  │                                                        │
  │           ▼ appendChild <span> vào <div>              │
  │                                                        │
  │       ▼ ⑤ appendChild <div> vào #root                │
  │                                                        │
  │  KẾT QUẢ:                                             │
  │  <div id="root">                                       │
  │    <div>                                               │
  │      hello                                             │
  │      <span>world!</span>                               │
  │    </div>                                              │
  │  </div>                                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.6. Tự Viết setAttribute — Xử Lý Attributes Thông Minh

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: setAttribute — Xử lý MỌI loại attribute!
// ═══════════════════════════════════════════════════════════

function setAttribute(dom, name, value) {
  // ① className → class (JSX dùng className vì class là keyword!)
  if (name === "className") name = "class";

  // ② onXXX → Event listener! (onClick, onChange, etc.)
  if (/on\w+/.test(name)) {
    name = name.toLowerCase();
    //     ^^^^^^^^^^^^^^^^^
    //  onClick → onclick (DOM property name!)
    dom[name] = value || "";
    //  dom.onclick = handleClick;
  }

  // ③ style → Xử lý style object!
  else if (name === "style") {
    if (!value || typeof value === "string") {
      // style="color: red; font-size: 14px"
      dom.style.cssText = value || "";
    } else if (value && typeof value === "object") {
      // style={{ color: 'red', fontSize: 14 }}
      for (let name in value) {
        dom.style[name] =
          typeof value[name] === "number"
            ? value[name] + "px" // Tự thêm 'px' nếu là số!
            : value[name];
      }
    }
  }

  // ④ Normal attributes (id, class, href, src, etc.)
  else {
    if (name in dom) {
      dom[name] = value || "";
    }
    if (value) {
      dom.setAttribute(name, value);
    } else {
      dom.removeAttribute(name);
      //  ^^^^^^^^^^^^^^^^^
      //  value falsy → XÓA attribute!
    }
  }
}
```

```
  setAttribute XỬ LÝ 4 LOẠI ATTRIBUTE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────┬──────────────────────────────────┐    │
  │  │ Loại        │ Cách xử lý                      │    │
  │  ├─────────────┼──────────────────────────────────┤    │
  │  │ className   │ Đổi thành 'class'                │    │
  │  │             │ (class là JS keyword!)           │    │
  │  ├─────────────┼──────────────────────────────────┤    │
  │  │ onXXX       │ toLowerCase → gán lên DOM       │    │
  │  │ (events)    │ dom.onclick = handler            │    │
  │  ├─────────────┼──────────────────────────────────┤    │
  │  │ style       │ String → cssText                 │    │
  │  │             │ Object → từng property           │    │
  │  │             │ Số → tự thêm 'px'!              │    │
  │  ├─────────────┼──────────────────────────────────┤    │
  │  │ Others      │ setAttribute trực tiếp          │    │
  │  │             │ value falsy → removeAttribute   │    │
  │  └─────────────┴──────────────────────────────────┘    │
  │                                                        │
  │  VD:                                                   │
  │  <div className="box"                                  │
  │       onClick={handleClick}                            │
  │       style={{ color: 'red', width: 100 }}             │
  │       id="main">                                       │
  │                                                        │
  │  → setAttribute(dom, 'className', 'box')              │
  │    → dom.setAttribute('class', 'box')                 │
  │                                                        │
  │  → setAttribute(dom, 'onClick', handleClick)          │
  │    → dom.onclick = handleClick                        │
  │                                                        │
  │  → setAttribute(dom, 'style', {color:'red',width:100})│
  │    → dom.style.color = 'red'                          │
  │    → dom.style.width = '100px'  // Tự thêm px!      │
  │                                                        │
  │  → setAttribute(dom, 'id', 'main')                    │
  │    → dom.setAttribute('id', 'main')                   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.7. ReactDOM Object — Wrapper Với Clear

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: ReactDOM — Wrapper cho render với clear!
// ═══════════════════════════════════════════════════════════

const ReactDOM = {
  render: (vnode, container) => {
    // ⚠ XÓA nội dung cũ trước khi render mới!
    container.innerHTML = "";
    //              ^^^^^^^
    //  Nếu không xóa → mỗi lần render sẽ THÊM vào!
    //  VD: render 3 lần → 3 bản copy! ❌

    return render(vnode, container);
  },
};
```

```
  TẠI SAO CẦN innerHTML = '' ?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  KHÔNG CÓ CLEAR:                                      │
  │                                                        │
  │  ReactDOM.render(<h1>A</h1>, root);                    │
  │  // root: <h1>A</h1>                                   │
  │                                                        │
  │  ReactDOM.render(<h1>B</h1>, root);                    │
  │  // root: <h1>A</h1><h1>B</h1>  ← THÊM VÀO! ❌     │
  │                                                        │
  │  CÓ CLEAR:                                            │
  │                                                        │
  │  ReactDOM.render(<h1>A</h1>, root);                    │
  │  // root: <h1>A</h1>                                   │
  │                                                        │
  │  ReactDOM.render(<h1>B</h1>, root);                    │
  │  // root: <h1>B</h1>  ← THAY THẾ! ✅               │
  │                                                        │
  │  ⚠ Đây là cách ĐƠN GIẢN nhất!                        │
  │  React thật sự dùng diff algorithm phức tạp hơn!      │
  │  → Không xóa toàn bộ → chỉ update phần thay đổi!   │
  │  → Sẽ tìm hiểu ở Part 3 (DOM Diff)!                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.8. Rendering Thực Tế — Hello World & Dynamic Clock

```javascript
// ═══════════════════════════════════════════════════════════
// VD1: Hello, World! — Static Rendering
// ═══════════════════════════════════════════════════════════

// index.html: <div id="root"></div>

ReactDOM.render(<h1>Hello, world!</h1>, document.getElementById("root"));

// KẾT QUẢ:
// <div id="root">
//   <h1>Hello, world!</h1>
// </div>
```

```javascript
// ═══════════════════════════════════════════════════════════
// VD2: Dynamic Clock — Rendering Liên Tục!
// ═══════════════════════════════════════════════════════════

function tick() {
  const element = (
    <div>
      <h1>Hello, world!</h1>
      <h2>It is {new Date().toLocaleTimeString()}.</h2>
    </div>
  );

  ReactDOM.render(element, document.getElementById("root"));
}

setInterval(tick, 1000);
// → Mỗi giây render lại!
// → innerHTML = '' → render mới!
// → Hiển thị đồng hồ realtime!
```

```
  LUỒNG DYNAMIC RENDERING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setInterval(tick, 1000)                               │
  │       │                                                │
  │       ▼ (mỗi 1 giây)                                  │
  │                                                        │
  │  tick()                                                │
  │       │                                                │
  │       ▼ JSX → createElement → VDOM object mới!       │
  │       │  {                                             │
  │       │    tag: 'div',                                 │
  │       │    children: [                                 │
  │       │      { tag: 'h1', children: ['Hello...'] },   │
  │       │      { tag: 'h2', children: ['It is 10:30:15.│
  │       │                               ']}             │
  │       │    ]                                           │
  │       │  }                                             │
  │       │                                                │
  │       ▼ ReactDOM.render(element, root)                 │
  │       │                                                │
  │       ├─ container.innerHTML = '' (xóa cũ!)           │
  │       │                                                │
  │       └─ render(vdom, container) (tạo mới!)           │
  │                                                        │
  │  ⚠ VẤN ĐỀ: Xóa + tạo TOÀN BỘ mỗi giây!            │
  │  → Không hiệu quả! (Chỉ thay đổi thời gian!)       │
  │  → Cần DOM DIFF! (Part 3 sẽ giải quyết!)            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 17.9. Tổng Kết — Full Code & Mind Map

```javascript
// ═══════════════════════════════════════════════════════════
// TOÀN BỘ CODE: Simple React — Part 1
// ═══════════════════════════════════════════════════════════

// ─── 1. createElement ────────────────────────────────────
function createElement(tag, attrs, ...children) {
  return { tag, attrs, children };
}

// ─── 2. setAttribute ─────────────────────────────────────
function setAttribute(dom, name, value) {
  if (name === "className") name = "class";

  if (/on\w+/.test(name)) {
    name = name.toLowerCase();
    dom[name] = value || "";
  } else if (name === "style") {
    if (!value || typeof value === "string") {
      dom.style.cssText = value || "";
    } else if (value && typeof value === "object") {
      for (let name in value) {
        dom.style[name] =
          typeof value[name] === "number" ? value[name] + "px" : value[name];
      }
    }
  } else {
    if (name in dom) {
      dom[name] = value || "";
    }
    if (value) {
      dom.setAttribute(name, value);
    } else {
      dom.removeAttribute(name);
    }
  }
}

// ─── 3. render ───────────────────────────────────────────
function render(vnode, container) {
  if (typeof vnode === "string") {
    const textNode = document.createTextNode(vnode);
    return container.appendChild(textNode);
  }

  const dom = document.createElement(vnode.tag);

  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      const value = vnode.attrs[key];
      setAttribute(dom, key, value);
    });
  }

  vnode.children.forEach((child) => render(child, dom));

  return container.appendChild(dom);
}

// ─── 4. Export ───────────────────────────────────────────
const React = { createElement };
const ReactDOM = {
  render: (vnode, container) => {
    container.innerHTML = "";
    return render(vnode, container);
  },
};
```

```
  MIND MAP: PART 1 — JSX & VIRTUAL DOM
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─ JSX ─────────────────────────────────────────────┐ │
  │  │                                                    │ │
  │  │  Developer viết JSX                                │ │
  │  │       │                                            │ │
  │  │       ▼ Babel transform-react-jsx                  │ │
  │  │       │ (pragma: "React.createElement")            │ │
  │  │       │                                            │ │
  │  │       ▼ React.createElement(tag, attrs, ...kids)   │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ Virtual DOM ─────────────────────────────────────┐ │
  │  │                                                    │ │
  │  │  { tag, attrs, children }                          │ │
  │  │  → JS object nhẹ (3 props vs 200+ của Real DOM!) │ │
  │  │  → Mô tả DOM tree!                               │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ render() ────────────────────────────────────────┐ │
  │  │                                                    │ │
  │  │  render(vnode, container)                           │ │
  │  │       │                                            │ │
  │  │       ├─ string? → createTextNode()                │ │
  │  │       │                                            │ │
  │  │       ├─ createElement(tag)                        │ │
  │  │       │                                            │ │
  │  │       ├─ setAttribute(dom, name, value)            │ │
  │  │       │   ├─ className → class                    │ │
  │  │       │   ├─ onXXX → event listener               │ │
  │  │       │   ├─ style → cssText / object             │ │
  │  │       │   └─ others → setAttribute/remove         │ │
  │  │       │                                            │ │
  │  │       ├─ ĐỆ QUY: children.forEach(render)         │ │
  │  │       │                                            │ │
  │  │       └─ appendChild → mount vào container!       │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ ReactDOM ────────────────────────────────────────┐ │
  │  │                                                    │ │
  │  │  ReactDOM.render(vnode, container)                  │ │
  │  │       │                                            │ │
  │  │       ├─ container.innerHTML = '' (clear!)         │ │
  │  │       └─ render(vnode, container)                  │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Takeaways

```
  ⭐ TAKEAWAYS TỪ PART 1:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. JSX = Syntactic Sugar!                            │
  │     → Babel transform thành React.createElement()    │
  │     → Đó là lý do PHẢI import React!                │
  │                                                        │
  │  2. React.createElement() TỰ VIẾT chỉ 4 dòng!       │
  │     → return { tag, attrs, children }                │
  │     → Object này = Virtual DOM!                      │
  │                                                        │
  │  3. Virtual DOM = JS object nhẹ mô tả DOM!           │
  │     → Real DOM: 200+ properties (NẶNG!)              │
  │     → Virtual DOM: 3 properties (NHẸ!)               │
  │     → So sánh, tạo mới đều NHANH!                   │
  │                                                        │
  │  4. render() TỰ VIẾT = đệ quy!                       │
  │     → Base case: string → createTextNode()           │
  │     → Recursive: children.forEach(render)            │
  │     → Mount: appendChild()                           │
  │                                                        │
  │  5. setAttribute() xử lý 4 loại:                      │
  │     → className → class                              │
  │     → onXXX → event listener                          │
  │     → style → cssText hoặc object                     │
  │     → others → setAttribute/removeAttribute          │
  │                                                        │
  │  6. Style number → tự thêm 'px'!                     │
  │     → style={{ width: 100 }}                          │
  │     → dom.style.width = '100px'                      │
  │                                                        │
  │  7. ReactDOM.render() clear trước khi render!         │
  │     → innerHTML = '' → tránh duplicate!              │
  │     → Đơn giản nhưng CHƯA TỐI ƯU!                  │
  │                                                        │
  │  8. Dynamic rendering với setInterval!                │
  │     → Mỗi giây tạo VDOM mới → render lại!          │
  │     → VẤN ĐỀ: xóa + tạo TOÀN BỘ!                  │
  │     → GIẢI PHÁP: DOM Diff (Part 3!)                  │
  │                                                        │
  │  9. Toàn bộ code "React" Part 1 chỉ ~60 dòng!       │
  │     → createElement: 3 dòng!                         │
  │     → render: 15 dòng!                                │
  │     → setAttribute: 25 dòng!                          │
  │     → ReactDOM: 5 dòng!                               │
  │                                                        │
  │  10. "React = Đơn giản ở thiết kế, phức tạp ở chi     │
  │      tiết!" — Không magic, chỉ là JavaScript objects! │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §18. Tự Viết React Từ Đầu (Part 2): Components & Lifecycle

```
═══════════════════════════════════════════════════════════════
  SERIES: IMPLEMENTING REACT FROM SCRATCH
  → Part 2: Components + Lifecycle Methods!
  → Function Components vs Class Components!
  → setState → renderComponent → DOM update!
  → Tự viết TẤT CẢ bằng tay!
═══════════════════════════════════════════════════════════════
```

### 18.1. Component Là Gì? — Hai Cách Định Nghĩa

```
  COMPONENT = Đơn vị tái sử dụng trong React!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÁCH 1: Function Component (đơn giản)                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function Welcome(props) {                       │  │
  │  │      return <h1>Hello, {props.name}</h1>;        │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  → Nhận props → trả về JSX!                    │  │
  │  │  → Không có state, không có lifecycle!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÁCH 2: Class Component (đầy đủ)                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  class Welcome extends React.Component {         │  │
  │  │      render() {                                  │  │
  │  │          return <h1>Hello, {this.props.name}</h1>│  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  → Có state, có lifecycle methods!              │  │
  │  │  → Extends React.Component!                     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠ Function = simplified version của Class!           │
  │  → Chúng ta sẽ thống nhất cả 2 về Class!            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.2. createElement Thay Đổi Gì Cho Component?

```
  QUAN TRỌNG: Khi JSX là component → tag = FUNCTION!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  // Native DOM element:                                │
  │  <div className="box">Hello</div>                      │
  │  // → createElement('div', {className:'box'}, 'Hello') │
  │  //                  ^^^^^ tag = STRING!               │
  │                                                        │
  │  // Component:                                         │
  │  <Welcome name="Sara" />                               │
  │  // → createElement(Welcome, {name:'Sara'})            │
  │  //                 ^^^^^^^ tag = FUNCTION!            │
  │                                                        │
  │  ⭐ babel-plugin-transform-react-jsx tự phân biệt!   │
  │  → Chữ hoa đầu dòng = Component = truyền function!  │
  │  → Chữ thường đầu dòng = Native = truyền string!    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  KHÔNG CẦN SỬA createElement!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  function createElement(tag, attrs, ...children) {     │
  │      return { tag, attrs, children };                  │
  │  }                                                     │
  │                                                        │
  │  // tag có thể là:                                     │
  │  // ① 'div' (string) → native DOM                    │
  │  // ② Welcome (function) → component!                │
  │  //                                                    │
  │  // ĐỂ PHÂN BIỆT: typeof tag === 'function'          │
  │  // → Xử lý ở render()!                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.3. Tự Viết React.Component — Base Class

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: React.Component — Base class cho mọi component!
// ═══════════════════════════════════════════════════════════

class Component {
  constructor(props = {}) {
    this.state = {};
    //   ^^^^^^^^^^
    //   Mỗi component có state riêng!
    //   → State thay đổi → re-render!

    this.props = props;
    //   ^^^^^^^^^^^^
    //   Props từ parent truyền xuống!
    //   → Read-only! Không được modify!
  }

  setState(stateChange) {
    // Merge stateChange vào this.state!
    Object.assign(this.state, stateChange);
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  VD: this.state = { num: 0 }
    //      stateChange = { num: 1 }
    //      → this.state = { num: 1 }
    //
    //  ⚠ SHALLOW MERGE! Chỉ merge level 1!
    //  → { a: 1, b: 2 } + { b: 3 } = { a: 1, b: 3 }

    // Re-render component!
    renderComponent(this);
    //  ^^^^^^^^^^^^^^^^^^^^
    //  setState → re-render NGAY LẬP TỨC!
    //  ⚠ Đây là phiên bản ĐƠN GIẢN!
    //  React thật sự dùng batching + async!
    //  (Đã phân tích ở §14!)
  }
}
```

```
  COMPONENT = { state, props, setState, render }
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Component instance:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  this.state = {}    ← Private data!             │  │
  │  │  this.props = {}    ← Data từ parent!           │  │
  │  │  this.base = null   ← Real DOM node!            │  │
  │  │                        (sẽ gán sau khi render)  │  │
  │  │                                                  │  │
  │  │  setState(change)   ← Cập nhật state!           │  │
  │  │    → Object.assign(state, change)               │  │
  │  │    → renderComponent(this)                      │  │
  │  │                                                  │  │
  │  │  render()           ← Trả về Virtual DOM!       │  │
  │  │    → return <h1>Hello</h1>                      │  │
  │  │    → return { tag: 'h1', ... }                  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⭐ this.base = tham chiếu tới Real DOM!             │
  │  → Dùng để replaceChild khi re-render!              │
  │  → Cầu nối giữa component và DOM thật!             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.4. Sửa render() — Hỗ Trợ Component

```javascript
// ═══════════════════════════════════════════════════════════
// SỬA: _render() — Thêm logic xử lý Component!
// ═══════════════════════════════════════════════════════════

function _render(vnode) {
  // ① Xử lý null, undefined, boolean
  if (vnode === undefined || vnode === null || typeof vnode === "boolean") {
    vnode = "";
  }

  // ② Xử lý number → convert thành string
  if (typeof vnode === "number") {
    vnode = String(vnode);
  }

  // ③ Xử lý string → tạo text node
  if (typeof vnode === "string") {
    let textNode = document.createTextNode(vnode);
    return textNode;
  }

  // ════════════════════════════════════════════
  // ④ MỚI: Xử lý COMPONENT! (tag = function)
  // ════════════════════════════════════════════
  if (typeof vnode.tag === "function") {
    //         ^^^^^^^^^^^^^^^^^^^^^^
    //  tag là function → ĐÂY LÀ COMPONENT!

    // Bước 1: Tạo component instance!
    const component = createComponent(
      vnode.tag, // Welcome (function hoặc class)
      vnode.attrs, // { name: 'Sara' }
    );

    // Bước 2: Set props → trigger lifecycle!
    setComponentProps(component, vnode.attrs);

    // Bước 3: Trả về Real DOM đã render!
    return component.base;
    //     ^^^^^^^^^^^^^^
    //  component.base = Real DOM node!
    //  (được gán trong renderComponent)
  }

  // ⑤ Xử lý native DOM element (tag = string)
  const dom = document.createElement(vnode.tag);

  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      const value = vnode.attrs[key];
      setAttribute(dom, key, value);
    });
  }

  // ⑥ Render children đệ quy
  vnode.children.forEach((child) => render(child, dom));

  return dom;
}
```

```
  LUỒNG _render() MỚI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  _render(vnode)                                        │
  │       │                                                │
  │       ├── null/undefined/boolean? → ''                │
  │       ├── number? → String(vnode)                     │
  │       ├── string? → createTextNode(vnode)             │
  │       │                                                │
  │       ├── typeof tag === 'function'?  ← MỚI!        │
  │       │   │                                            │
  │       │   ├── createComponent(tag, attrs)              │
  │       │   ├── setComponentProps(component, attrs)      │
  │       │   └── return component.base (Real DOM!)       │
  │       │                                                │
  │       └── string tag? → createElement(tag)            │
  │           ├── setAttribute(dom, ...)                   │
  │           ├── children.forEach(render)                 │
  │           └── return dom                               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.5. Tự Viết createComponent — Tạo Instance

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: createComponent — Tạo component instance!
// → Thống nhất Function và Class thành 1 format!
// ═══════════════════════════════════════════════════════════

function createComponent(component, props) {
  let inst;

  // ① Class Component: có prototype.render → tạo instance!
  if (component.prototype && component.prototype.render) {
    inst = new component(props);
    //     ^^^^^^^^^^^^^^^^^^^^
    //  VD: new Welcome({ name: 'Sara' })
    //  → gọi constructor(props)
    //  → this.state = {}, this.props = props
  }

  // ② Function Component: KHÔNG có prototype.render
  //    → "Nâng cấp" thành class-like!
  else {
    inst = new Component(props);
    //     ^^^^^^^^^^^^^^^^^^^
    //  Tạo Component instance trống!

    inst.constructor = component;
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^
    //  Gán lại constructor = function component gốc!

    inst.render = function () {
      return this.constructor(props);
      //     ^^^^^^^^^^^^^^^^^^^^^^^^
      //  render() = gọi function component!
      //  VD: this.constructor = Welcome
      //      → Welcome({ name: 'Sara' })
      //      → return <h1>Hello, Sara</h1>
    };
  }

  return inst;
}
```

```
  createComponent XỬ LÝ 2 LOẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CASE 1: Class Component                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  class Welcome extends Component {               │  │
  │  │      render() { return <h1>Hello</h1>; }        │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  component.prototype.render? → YES!             │  │
  │  │  → inst = new Welcome(props)                    │  │
  │  │  → inst.render = Welcome.prototype.render()     │  │
  │  │  → inst.state = {}, inst.props = props          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE 2: Function Component                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function Welcome(props) {                       │  │
  │  │      return <h1>Hello, {props.name}</h1>;        │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  component.prototype.render? → NO!              │  │
  │  │  → inst = new Component(props)                  │  │
  │  │  → inst.constructor = Welcome                   │  │
  │  │  → inst.render = function() {                   │  │
  │  │        return this.constructor(props);           │  │
  │  │    }                                             │  │
  │  │  → Giờ nó CÓ render() giống class!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⭐ SAU createComponent:                              │
  │  → CẢ HAI đều là object có render()!                │
  │  → Phần còn lại xử lý GIỐNG NHAU!                  │
  │  → Thống nhất logic!                                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.6. Tự Viết setComponentProps — Props + Lifecycle

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: setComponentProps — Gán props + lifecycle!
// ═══════════════════════════════════════════════════════════

function setComponentProps(component, props) {
  // ① CHƯA MOUNT (lần đầu render)
  if (!component.base) {
    //  ^^^^^^^^^^^^^^
    //  component.base = null → chưa mount lên DOM!

    if (component.componentWillMount) {
      component.componentWillMount();
      //  → Lifecycle: Chuẩn bị mount!
      //  → Gọi TRƯỚC khi render lần đầu!
    }
  }

  // ② ĐÃ MOUNT (nhận props mới = re-render)
  else if (component.componentWillReceiveProps) {
    component.componentWillReceiveProps(props);
    //  → Lifecycle: Nhận props mới!
    //  → Gọi KHI component đã mount + nhận props mới!
  }

  // ③ Gán props!
  component.props = props;

  // ④ Render component!
  renderComponent(component);
}
```

```
  setComponentProps LOGIC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setComponentProps(component, props)                   │
  │       │                                                │
  │       ▼ component.base tồn tại?                       │
  │       │                                                │
  │       ├── NO (lần đầu mount!)                         │
  │       │   │                                            │
  │       │   ▼ componentWillMount()  ← Lifecycle!       │
  │       │     "Tôi CHUẨN BỊ được mount!"               │
  │       │                                                │
  │       └── YES (đã mount, nhận props mới!)             │
  │           │                                            │
  │           ▼ componentWillReceiveProps(props)           │
  │             "Tôi nhận được props MỚI!"                │
  │                                                        │
  │       ▼ component.props = props  ← Gán props!        │
  │       │                                                │
  │       ▼ renderComponent(component) ← Render!          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.7. Tự Viết renderComponent — Trái Tim Của Component!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: renderComponent — Render component ra Real DOM!
// → setState() gọi hàm này để re-render!
// → Lifecycle methods được trigger ở đây!
// ═══════════════════════════════════════════════════════════

function renderComponent(component) {
  let base;

  // ① Gọi component.render() → lấy Virtual DOM!
  const renderer = component.render();
  //              ^^^^^^^^^^^^^^^^^^^^
  //  VD: class Welcome → render() → <h1>Hello</h1>
  //  → renderer = { tag: 'h1', attrs: null,
  //                 children: ['Hello'] }

  // ② Lifecycle: componentWillUpdate (khi RE-RENDER)
  if (component.base && component.componentWillUpdate) {
    component.componentWillUpdate();
    //  → "UPDATE sắp xảy ra!"
    //  → Chỉ gọi khi component ĐÃ mount (base tồn tại)
  }

  // ③ Chuyển Virtual DOM → Real DOM!
  base = _render(renderer);
  //     ^^^^^^^^^^^^^^^^^
  //  _render() = hàm đã viết ở trên!
  //  → Tạo Real DOM element!

  // ④ Lifecycle: componentDidUpdate hoặc componentDidMount
  if (component.base) {
    // ĐÃ MOUNT → đây là UPDATE!
    if (component.componentDidUpdate) {
      component.componentDidUpdate();
      //  → "UPDATE đã hoàn tất!"
    }
  } else if (component.componentDidMount) {
    // CHƯA MOUNT → đây là MOUNT LẦN ĐẦU!
    component.componentDidMount();
    //  → "MOUNT đã hoàn tất!"
    //  → Chỉ gọi 1 LẦN DUY NHẤT!
  }

  // ⑤ THAY THẾ Real DOM cũ bằng DOM mới!
  if (component.base && component.base.parentNode) {
    component.base.parentNode.replaceChild(base, component.base);
    //                        ^^^^^^^^^^^^
    //  replaceChild(new, old)
    //  → Thay DOM cũ bằng DOM mới trên cây DOM!
    //  → Không xóa toàn bộ container!
  }

  // ⑥ Lưu tham chiếu 2 chiều!
  component.base = base;
  //  ^^^^^^^^^^^^^^^^^^
  //  Component → biết Real DOM của nó!
  //  → Dùng cho lần update tiếp theo!

  base._component = component;
  //  ^^^^^^^^^^^^^^^^^^^^^^^^
  //  Real DOM → biết Component nào sở hữu nó!
  //  → Dùng cho diff algorithm (Part 3)!
}
```

```
  renderComponent — LUỒNG CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  renderComponent(component)                            │
  │       │                                                │
  │       ▼ ① component.render() → Virtual DOM!           │
  │       │  VD: { tag: 'h1', children: ['Hello'] }       │
  │       │                                                │
  │       ▼ ② component.base tồn tại?                    │
  │       │                                                │
  │       ├── YES: componentWillUpdate()                   │
  │       │        "Chuẩn bị UPDATE!"                     │
  │       │                                                │
  │       └── NO: (bỏ qua, chưa mount)                   │
  │                                                        │
  │       ▼ ③ _render(renderer) → Real DOM MỚI!          │
  │       │                                                │
  │       ▼ ④ component.base tồn tại?                    │
  │       │                                                │
  │       ├── YES: componentDidUpdate()                    │
  │       │        "UPDATE hoàn tất!"                      │
  │       │                                                │
  │       └── NO: componentDidMount()                     │
  │               "MOUNT lần đầu hoàn tất!"               │
  │               (chỉ gọi 1 LẦN!)                       │
  │                                                        │
  │       ▼ ⑤ replaceChild(new, old) trên DOM!           │
  │       │   (thay DOM cũ bằng DOM mới!)                │
  │       │                                                │
  │       ▼ ⑥ Lưu tham chiếu:                            │
  │           component.base = base (mới!)                │
  │           base._component = component                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.8. Lifecycle — Sơ Đồ Tổng Quan

```
  LIFECYCLE CỦA COMPONENT CHÚNG TA TỰ VIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─ MOUNTING (Lần đầu render) ──────────────────────┐ │
  │  │                                                    │ │
  │  │  <Welcome name="Sara" />                           │ │
  │  │       │                                            │ │
  │  │       ▼ createElement(Welcome, {name:'Sara'})      │ │
  │  │       │ → { tag: Welcome, ... }                    │ │
  │  │       │                                            │ │
  │  │       ▼ _render() → typeof tag === 'function'      │ │
  │  │       │                                            │ │
  │  │       ▼ createComponent(Welcome, props)            │ │
  │  │       │ → inst = new Welcome(props)                │ │
  │  │       │                                            │ │
  │  │       ▼ setComponentProps(inst, props)              │ │
  │  │       │                                            │ │
  │  │       ├── component.base? NO!                      │ │
  │  │       │   ▼ ★ componentWillMount()                │ │
  │  │       │                                            │ │
  │  │       ▼ renderComponent(inst)                      │ │
  │  │       │                                            │ │
  │  │       ├── inst.render() → Virtual DOM              │ │
  │  │       ├── _render(vdom) → Real DOM                 │ │
  │  │       ├── component.base? NO!                      │ │
  │  │       │   ▼ ★ componentDidMount()                 │ │
  │  │       ├── component.base = dom                     │ │
  │  │       └── dom._component = inst                    │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  │  ┌─ UPDATING (setState hoặc nhận props mới) ────────┐ │
  │  │                                                    │ │
  │  │  CASE A: setState({ num: 1 })                      │ │
  │  │       │                                            │ │
  │  │       ▼ Object.assign(state, { num: 1 })           │ │
  │  │       │                                            │ │
  │  │       ▼ renderComponent(inst)                      │ │
  │  │       │                                            │ │
  │  │       ├── inst.render() → Virtual DOM MỚI         │ │
  │  │       ├── component.base? YES!                     │ │
  │  │       │   ▼ ★ componentWillUpdate()               │ │
  │  │       ├── _render(vdom) → Real DOM MỚI            │ │
  │  │       ├── component.base? YES!                     │ │
  │  │       │   ▼ ★ componentDidUpdate()                │ │
  │  │       ├── replaceChild(new, old)                   │ │
  │  │       └── component.base = dom mới                 │ │
  │  │                                                    │ │
  │  │  CASE B: Parent truyền props mới                   │ │
  │  │       │                                            │ │
  │  │       ▼ setComponentProps(inst, newProps)           │ │
  │  │       │                                            │ │
  │  │       ├── component.base? YES!                     │ │
  │  │       │   ▼ ★ componentWillReceiveProps(newProps)  │ │
  │  │       ├── component.props = newProps               │ │
  │  │       └── renderComponent(inst) → giống Case A    │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  │  THỨ TỰ GỌI:                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Mount:                                          │  │
  │  │  componentWillMount → render → componentDidMount│  │
  │  │                                                  │  │
  │  │  Update (setState):                              │  │
  │  │  componentWillUpdate → render → componentDidUpd.│  │
  │  │                                                  │  │
  │  │  Update (new props):                             │  │
  │  │  componentWillReceiveProps → componentWillUpdate │  │
  │  │  → render → componentDidUpdate                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.9. Ví Dụ Thực Tế — Counter Component

```javascript
// ═══════════════════════════════════════════════════════════
// VD: Counter — Class Component với state + lifecycle!
// ═══════════════════════════════════════════════════════════

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      num: 0,
    };
  }

  componentWillMount() {
    console.log("mount");
    //  → Chỉ log 1 LẦN DUY NHẤT khi mount!
  }

  componentWillUpdate() {
    console.log("update");
    //  → Log MỖI LẦN setState!
  }

  onClick() {
    this.setState({ num: this.state.num + 1 });
    //  ①  Object.assign(state, { num: 1 })
    //  ②  renderComponent(this)
    //  ③  componentWillUpdate() → "update"
    //  ④  render() → VDOM mới
    //  ⑤  _render(vdom) → Real DOM mới
    //  ⑥  componentDidUpdate()
    //  ⑦  replaceChild(new, old)
  }

  render() {
    return (
      <div onClick={() => this.onClick()}>
        <h1>number: {this.state.num}</h1>
        <button>add</button>
      </div>
    );
  }
}

ReactDOM.render(<Counter />, document.getElementById("root"));
```

```
  COUNTER — LUỒNG CHẠY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ReactDOM.render(<Counter />, root)                    │
  │       │                                                │
  │       ▼ createElement(Counter, null) → { tag: Counter }│
  │       │                                                │
  │       ▼ _render({ tag: Counter })                      │
  │       │ typeof Counter === 'function' → COMPONENT!    │
  │       │                                                │
  │       ▼ createComponent(Counter, null)                 │
  │       │ Counter.prototype.render? YES!                 │
  │       │ → inst = new Counter(null)                    │
  │       │ → state = { num: 0 }                          │
  │       │                                                │
  │       ▼ setComponentProps(inst, null)                   │
  │       │ inst.base? NO → componentWillMount()          │
  │       │ Console: "mount" ← CHỈ 1 LẦN!               │
  │       │                                                │
  │       ▼ renderComponent(inst)                          │
  │       │ inst.render() → <div>...<h1>number: 0</h1>...│
  │       │ _render(vdom) → <div>...<h1>number: 0</h1>...│
  │       │ inst.base? NO → componentDidMount()           │
  │       │ inst.base = <div>...</div>                     │
  │       │                                                │
  │       ▼ appendChild vào root!                         │
  │                                                        │
  │  ═══════════════ CLICK! ═══════════════                │
  │                                                        │
  │  onClick()                                             │
  │       │                                                │
  │       ▼ setState({ num: 1 })                           │
  │       │ Object.assign(state, { num: 1 })               │
  │       │ state = { num: 1 }                             │
  │       │                                                │
  │       ▼ renderComponent(inst)                          │
  │       │ inst.base? YES → componentWillUpdate()        │
  │       │ Console: "update"                              │
  │       │                                                │
  │       │ inst.render() → <div>...<h1>number: 1</h1>...│
  │       │ _render(vdom) → NEW Real DOM!                 │
  │       │                                                │
  │       │ inst.base? YES → componentDidUpdate()         │
  │       │                                                │
  │       │ replaceChild(newDOM, oldDOM)                   │
  │       │ inst.base = newDOM                             │
  │       │                                                │
  │       ▼ Màn hình: number: 1                           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 18.10. Tổng Kết — Full Code & Mind Map

```javascript
// ═══════════════════════════════════════════════════════════
// TOÀN BỘ CODE: Simple React — Part 2 (Components)
// ═══════════════════════════════════════════════════════════

// ─── 1. Component Base Class ─────────────────────────────
class Component {
  constructor(props = {}) {
    this.state = {};
    this.props = props;
  }

  setState(stateChange) {
    Object.assign(this.state, stateChange);
    renderComponent(this);
  }
}

// ─── 2. createComponent ──────────────────────────────────
function createComponent(component, props) {
  let inst;
  if (component.prototype && component.prototype.render) {
    inst = new component(props);
  } else {
    inst = new Component(props);
    inst.constructor = component;
    inst.render = function () {
      return this.constructor(props);
    };
  }
  return inst;
}

// ─── 3. setComponentProps ────────────────────────────────
function setComponentProps(component, props) {
  if (!component.base) {
    if (component.componentWillMount) {
      component.componentWillMount();
    }
  } else if (component.componentWillReceiveProps) {
    component.componentWillReceiveProps(props);
  }
  component.props = props;
  renderComponent(component);
}

// ─── 4. renderComponent ─────────────────────────────────
function renderComponent(component) {
  let base;
  const renderer = component.render();

  if (component.base && component.componentWillUpdate) {
    component.componentWillUpdate();
  }

  base = _render(renderer);

  if (component.base) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate();
    }
  } else if (component.componentDidMount) {
    component.componentDidMount();
  }

  if (component.base && component.base.parentNode) {
    component.base.parentNode.replaceChild(base, component.base);
  }

  component.base = base;
  base._component = component;
}

// ─── 5. _render (với component support) ──────────────────
function _render(vnode) {
  if (vnode === undefined || vnode === null || typeof vnode === "boolean")
    vnode = "";
  if (typeof vnode === "number") vnode = String(vnode);
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }

  // MỚI: Component!
  if (typeof vnode.tag === "function") {
    const component = createComponent(vnode.tag, vnode.attrs);
    setComponentProps(component, vnode.attrs);
    return component.base;
  }

  const dom = document.createElement(vnode.tag);
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      setAttribute(dom, key, vnode.attrs[key]);
    });
  }
  vnode.children.forEach((child) => render(child, dom));
  return dom;
}

// ─── 6. Export ───────────────────────────────────────────
const React = { createElement, Component };
const ReactDOM = {
  render: (vnode, container) => {
    container.innerHTML = "";
    return render(vnode, container);
  },
};
```

```
  MIND MAP: PART 2 — COMPONENTS & LIFECYCLE
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─ JSX → createElement ────────────────────────────┐ │
  │  │                                                    │ │
  │  │  <Welcome />                                       │ │
  │  │       │                                            │ │
  │  │       ▼ Babel transform                            │ │
  │  │       │                                            │ │
  │  │       ▼ createElement(Welcome, props)              │ │
  │  │       │ → { tag: Welcome, attrs: props }          │ │
  │  │       │                                            │ │
  │  │       │ ⭐ tag = function (không phải string!)    │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ _render() — Component Detection ────────────────┐ │
  │  │                                                    │ │
  │  │  typeof tag === 'function'?                        │ │
  │  │       │                                            │ │
  │  │       ▼ YES → Component pipeline!                 │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ createComponent ────────────────────────────────┐  │
  │  │                                                    │ │
  │  │  Class? → new component(props)                    │ │
  │  │  Function? → new Component(props) + mock render() │ │
  │  │  → Thống nhất thành 1 format!                    │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ setComponentProps ──────────────────────────────┐  │
  │  │                                                    │ │
  │  │  !base? → componentWillMount()                    │ │
  │  │  base?  → componentWillReceiveProps()             │ │
  │  │  props = newProps                                  │ │
  │  │       │                                            │ │
  │  │       ▼ renderComponent()                          │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                    │                                    │
  │                    ▼                                    │
  │  ┌─ renderComponent ───────────────────────────────┐   │
  │  │                                                    │ │
  │  │  ① render() → Virtual DOM                         │ │
  │  │       │                                            │ │
  │  │  ② base? → componentWillUpdate()                  │ │
  │  │       │                                            │ │
  │  │  ③ _render(vdom) → Real DOM                       │ │
  │  │       │                                            │ │
  │  │  ④ base? → componentDidUpdate()                   │ │
  │  │    !base? → componentDidMount()                   │ │
  │  │       │                                            │ │
  │  │  ⑤ replaceChild(new, old)                         │ │
  │  │       │                                            │ │
  │  │  ⑥ component.base = base ← tham chiếu!          │ │
  │  │    base._component = component ← 2 chiều!        │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  │  ┌─ setState() ─────────────────────────────────────┐  │
  │  │                                                    │ │
  │  │  Object.assign(state, change)                      │ │
  │  │       │                                            │ │
  │  │       ▼ renderComponent(this) → RE-RENDER!        │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Takeaways

```
  ⭐ TAKEAWAYS TỪ PART 2:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. Component = function hoặc class → Babel phân biệt!│
  │     → Chữ hoa = Component, chữ thường = native DOM! │
  │     → tag = function (không phải string!)             │
  │                                                        │
  │  2. createElement KHÔNG CẦN SỬA!                     │
  │     → tag có thể là string hoặc function!            │
  │     → Xử lý phân biệt ở _render()!                  │
  │                                                        │
  │  3. React.Component chỉ có state, props, setState!    │
  │     → setState = Object.assign + renderComponent()   │
  │     → Phiên bản đơn giản: synchronous!               │
  │                                                        │
  │  4. createComponent THỐNG NHẤT 2 loại component!      │
  │     → Class: new component(props)                    │
  │     → Function: new Component + mock render()        │
  │     → Sau đó xử lý GIỐNG NHAU!                      │
  │                                                        │
  │  5. component.base = tham chiếu Real DOM quan trọng!  │
  │     → base = null → chưa mount!                     │
  │     → base tồn tại → đã mount, là update!           │
  │     → Dùng replaceChild để swap DOM!                 │
  │                                                        │
  │  6. Tham chiếu 2 CHIỀU:                               │
  │     → component.base → Real DOM                      │
  │     → base._component → Component instance           │
  │     → Cầu nối 2 chiều Component ↔ DOM!             │
  │                                                        │
  │  7. Lifecycle gọi đúng thứ tự:                        │
  │     MOUNT: WillMount → render → DidMount             │
  │     UPDATE: WillUpdate → render → DidUpdate          │
  │     NEW PROPS: WillReceiveProps → WillUpdate →       │
  │                render → DidUpdate                     │
  │                                                        │
  │  8. componentDidMount chỉ gọi 1 LẦN DUY NHẤT!       │
  │     → Lần đầu component mount lên DOM!              │
  │     → Dùng để: fetch data, setup subscriptions!      │
  │                                                        │
  │  9. VẪN CÒN VẤN ĐỀ: re-render toàn bộ component!   │
  │     → replaceChild thay toàn bộ DOM cũ!             │
  │     → Không diff → không tối ưu!                    │
  │     → GIẢI PHÁP: DOM Diff algorithm (Part 3!)       │
  │                                                        │
  │  10. Code Part 2 thêm khoảng ~80 dòng!               │
  │      Tổng cộng "React" = Part 1 + Part 2 = ~140 dòng!│
  │      → Nguyên bộ React core chỉ ~140 dòng JS!       │
  │      → "Simple but not easy" ✨                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §19. Tự Viết React Từ Đầu (Part 3): Diff Algorithm

```
═══════════════════════════════════════════════════════════════
  SERIES: IMPLEMENTING REACT FROM SCRATCH
  → Part 3: DOM Diff Algorithm!
  → So sánh Real DOM vs Virtual DOM → chỉ update thay đổi!
  → Diff Text Nodes, DOM Nodes, Attributes, Children, Components!
  → Tự viết TẤT CẢ bằng tay!
═══════════════════════════════════════════════════════════════
```

### 19.1. Tại Sao Cần Diff? — Vấn Đề Của Part 2

```
  VẤN ĐỀ CỦA PART 2:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setState({ num: 1 })                                  │
  │       │                                                │
  │       ▼ renderComponent(this)                          │
  │       │                                                │
  │       ▼ render() → Virtual DOM MỚI                    │
  │       │                                                │
  │       ▼ _render(vdom) → Real DOM MỚI hoàn toàn!      │
  │       │                                                │
  │       ▼ replaceChild(newDOM, oldDOM)                   │
  │       │                                                │
  │       ▼ THAY THẾ TOÀN BỘ DOM CŨ! 😱                  │
  │                                                        │
  │  VD: Counter component có:                             │
  │  <div>                                                 │
  │    <h1>number: 1</h1>    ← CHỈ SỐ thay đổi!         │
  │    <button>add</button>  ← KHÔNG đổi!                │
  │  </div>                                                │
  │                                                        │
  │  ⚠ Nhưng replaceChild thay TOÀN BỘ <div>!           │
  │  → Cả <h1> lẫn <button> đều bị TẠO LẠI!            │
  │  → Lãng phí! DOM manipulation rất đắt!               │
  │                                                        │
  │  ✅ GIẢI PHÁP: DIFF ALGORITHM!                        │
  │  → So sánh oldDOM vs newVDOM                          │
  │  → Chỉ update PHẦN THAY ĐỔI!                        │
  │  → <h1> text thay đổi → chỉ update textContent!     │
  │  → <button> không đổi → GIỮ NGUYÊN!                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.2. Chiến Lược So Sánh — Same-Level Only!

```
  DIFF STRATEGY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① So sánh Real DOM hiện tại vs Virtual DOM mới!     │
  │     (KHÔNG lưu Virtual DOM cũ!)                       │
  │     → So sánh trực tiếp DOM thật + VDOM mới!         │
  │     → Vừa so sánh vừa update!                        │
  │                                                        │
  │  ② Chỉ so sánh CÙNG CẤP (same level)!              │
  │     → KHÔNG so sánh cross-level!                     │
  │                                                        │
  │  ┌─────── Tree A (Real DOM) ──┐ ┌── Tree B (VDOM) ──┐│
  │  │          div               │ │       div          ││
  │  │         / | \              │ │      / | \         ││
  │  │      h1  p  span           │ │   h1  p  span     ││
  │  │     /       |              │ │  /       |         ││
  │  │  text     text             │ │text    text        ││
  │  └────────────────────────────┘ └────────────────────┘│
  │                                                        │
  │  Level 0: ─── div ↔ div ────────── So sánh!         │
  │  Level 1: ─── h1,p,span ↔ h1,p,span ── So sánh!    │
  │  Level 2: ─── text ↔ text ────────── So sánh!       │
  │                                                        │
  │  ✅ Chỉ so sánh cùng level!                          │
  │  → O(n) thay vì O(n³)!                               │
  │  → Rất hiếm khi DOM di chuyển cross-level!           │
  │                                                        │
  │  FULL TREE DIFF:  O(n³) = 1000 nodes → 10⁹ ops! 😱  │
  │  SAME LEVEL DIFF: O(n)  = 1000 nodes → 10³ ops! ✅   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.3. Hàm diff() — Entry Point

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: diff() — So sánh Real DOM vs Virtual DOM!
// → Trả về Real DOM đã được update!
// ═══════════════════════════════════════════════════════════

/**
 * @param {HTMLElement} dom   - Real DOM hiện tại (có thể null)
 * @param {vnode}       vnode - Virtual DOM mới
 * @returns {HTMLElement}     - Real DOM đã update!
 */
function diff(dom, vnode) {
  let out = dom;

  // ═══════════════════════════════════
  // CASE 1: vnode = string → Text Node!
  // ═══════════════════════════════════
  if (typeof vnode === "string" || typeof vnode === "number") {
    // ① DOM hiện tại LÀ text node?
    if (dom && dom.nodeType === 3) {
      //           ^^^^^^^^^^^^^^
      //  nodeType === 3 = TEXT_NODE!
      //  (1 = ELEMENT, 3 = TEXT, 8 = COMMENT)

      // Chỉ update nếu text KHÁC!
      if (dom.textContent !== vnode) {
        dom.textContent = vnode;
        //  ^^^^^^^^^^^^^^^^^^^^^^^
        //  Chỉ thay TEXT! Không tạo node mới!
        //  → CỰC KỲ nhẹ! Không reflow!
      }
    }

    // ② DOM hiện tại KHÔNG phải text node!
    else {
      out = document.createTextNode(vnode);
      //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //  Tạo text node mới!

      if (dom && dom.parentNode) {
        dom.parentNode.replaceChild(out, dom);
        //  Thay thế DOM cũ (VD: <p>) bằng text!
      }
    }

    return out;
    //  Text node xong! Không có attrs/children!
  }

  // ═══════════════════════════════════
  // CASE 2: vnode.tag = function → Component!
  // ═══════════════════════════════════
  if (typeof vnode.tag === "function") {
    return diffComponent(dom, vnode);
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  Component diff riêng! (18.9)
  }

  // ═══════════════════════════════════
  // CASE 3: vnode.tag = string → Native DOM element!
  // ═══════════════════════════════════

  // ③ DOM không tồn tại HOẶC type khác nhau!
  if (
    !dom ||
    !dom.tagName ||
    dom.tagName.toLowerCase() !== vnode.tag.toLowerCase()
  ) {
    out = document.createElement(vnode.tag);
    //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  Type khác → tạo DOM mới!

    if (dom) {
      // Di chuyển children cũ sang DOM mới!
      [...dom.childNodes].map(out.appendChild.bind(out));
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //  VD: <div> thành <section>
      //  → Tạo <section> mới
      //  → Move tất cả children từ <div> sang <section>

      if (dom.parentNode) {
        dom.parentNode.replaceChild(out, dom);
        //  Thay <div> bằng <section> trên DOM tree!
      }
    }
  }

  // ④ So sánh CHILDREN đệ quy!
  if (
    (vnode.children && vnode.children.length > 0) ||
    (out.childNodes && out.childNodes.length > 0)
  ) {
    diffChildren(out, vnode.children);
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  So sánh từng child! (19.6)
  }

  // ⑤ So sánh ATTRIBUTES!
  diffAttributes(out, vnode);
  //  ^^^^^^^^^^^^^^^^^^^^^^
  //  So sánh attrs cũ vs mới! (19.4)

  return out;
}
```

```
  diff() — LUỒNG TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  diff(dom, vnode)                                      │
  │       │                                                │
  │       ▼ typeof vnode === 'string'?                    │
  │       │                                                │
  │       ├── YES: DIFF TEXT NODE!                        │
  │       │   ├── dom.nodeType === 3? → update text!     │
  │       │   └── else → createTextNode + replace!       │
  │       │   → return!                                   │
  │       │                                                │
  │       ▼ typeof vnode.tag === 'function'?              │
  │       │                                                │
  │       ├── YES: diffComponent(dom, vnode)              │
  │       │   → return!                                   │
  │       │                                                │
  │       ▼ NATIVE DOM ELEMENT!                           │
  │       │                                                │
  │       ├── dom type khác? → createElement + migrate!  │
  │       │                                                │
  │       ├── diffChildren(out, vnode.children)           │
  │       │   (so sánh children đệ quy!)                 │
  │       │                                                │
  │       ├── diffAttributes(out, vnode)                  │
  │       │   (so sánh attrs!)                            │
  │       │                                                │
  │       └── return out (Real DOM đã update!)            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.4. Diff Text Node — Chi Tiết

```
  DIFF TEXT NODE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CASE A: DOM hiện tại LÀ text node (nodeType === 3)   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Real DOM:  "Hello"                              │  │
  │  │  VDOM:      "World"                              │  │
  │  │                                                  │  │
  │  │  → dom.textContent = "World"                    │  │
  │  │  → CHỈ update text! Không tạo mới!             │  │
  │  │  → Siêu nhẹ! O(1)!                             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE B: DOM hiện tại KHÔNG phải text (VD: <p>)       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Real DOM:  <p>Hello</p>                         │  │
  │  │  VDOM:      "World"                              │  │
  │  │                                                  │  │
  │  │  → out = createTextNode("World")                │  │
  │  │  → replaceChild(textNode, <p>)                  │  │
  │  │  → Thay <p> bằng text node!                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE C: DOM không tồn tại (null)                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Real DOM:  null                                 │  │
  │  │  VDOM:      "Hello"                              │  │
  │  │                                                  │  │
  │  │  → out = createTextNode("Hello")                │  │
  │  │  → return! (parent sẽ appendChild)              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⭐ nodeType VALUES:                                  │
  │  ┌──────────┬──────────────────────────────────────┐  │
  │  │  Value   │  Meaning                             │  │
  │  ├──────────┼──────────────────────────────────────┤  │
  │  │  1       │  ELEMENT_NODE (<div>, <h1>, ...)     │  │
  │  │  3       │  TEXT_NODE ("Hello")                  │  │
  │  │  8       │  COMMENT_NODE (<!-- ... -->)          │  │
  │  │  9       │  DOCUMENT_NODE (document)            │  │
  │  │  11      │  DOCUMENT_FRAGMENT_NODE              │  │
  │  └──────────┴──────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.5. Diff Attributes — So Sánh Thuộc Tính

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: diffAttributes — So sánh old attrs vs new attrs!
// ═══════════════════════════════════════════════════════════

function diffAttributes(dom, vnode) {
  const old = {}; // Attrs hiện tại trên Real DOM!
  const attrs = vnode.attrs || {}; // Attrs mới từ VDOM!

  // ① Thu thập TẤT CẢ attrs hiện tại của Real DOM!
  for (let i = 0; i < dom.attributes.length; i++) {
    const attr = dom.attributes[i];
    old[attr.name] = attr.value;
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^
    //  VD: <div class="box" id="main">
    //  → old = { class: 'box', id: 'main' }
  }

  // ② XÓA attrs cũ không còn trong VDOM mới!
  for (let name in old) {
    if (!(name in attrs)) {
      setAttribute(dom, name, undefined);
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //  VD: old có 'title' nhưng attrs mới KHÔNG có
      //  → setAttribute(dom, 'title', undefined)
      //  → XÓA attribute 'title'!
    }
  }

  // ③ UPDATE attrs có giá trị KHÁC!
  for (let name in attrs) {
    if (old[name] !== attrs[name]) {
      setAttribute(dom, name, attrs[name]);
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //  VD: old.className = 'box'
      //      attrs.className = 'box active'
      //  → setAttribute(dom, 'className', 'box active')
      //  → CHỈ update attribute thay đổi!
    }
  }
}
```

```
  diffAttributes — 3 BƯỚC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VD: Real DOM hiện tại:                                │
  │  <div class="box" title="old" id="main">               │
  │                                                        │
  │  VDOM mới:                                             │
  │  { tag: 'div', attrs: { className: 'box active',      │
  │                         id: 'main',                    │
  │                         onClick: fn } }                │
  │                                                        │
  │  ① Thu thập old:                                      │
  │     old = { class: 'box', title: 'old', id: 'main' } │
  │                                                        │
  │  ② Xóa attrs không còn:                              │
  │     'title' không có trong attrs mới → XÓA!          │
  │     setAttribute(dom, 'title', undefined)              │
  │                                                        │
  │  ③ Update attrs thay đổi:                            │
  │     className: 'box' → 'box active' → UPDATE!       │
  │     id: 'main' → 'main' → GIỐNG NHAU → SKIP!       │
  │     onClick: undefined → fn → THÊM MỚI!             │
  │                                                        │
  │  KẾT QUẢ:                                             │
  │  <div class="box active" id="main" onclick="fn">       │
  │  → title bị xóa! class đổi! onclick thêm!           │
  │  → id giữ nguyên! ✅                                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.6. Diff Children — Phần Phức Tạp Nhất!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: diffChildren — So sánh danh sách children!
// → Dùng KEY để match children tối ưu!
// → Children không có key → match theo type!
// ═══════════════════════════════════════════════════════════

function diffChildren(dom, vchildren) {
  const domChildren = dom.childNodes;
  const children = []; // Children KHÔNG có key!
  const keyed = {}; // Children CÓ key!

  // ═══════════════════════════════════
  // BƯỚC 1: Phân loại children cũ (Real DOM)
  // → Có key → vào map keyed!
  // → Không key → vào array children!
  // ═══════════════════════════════════
  if (domChildren.length > 0) {
    for (let i = 0; i < domChildren.length; i++) {
      const child = domChildren[i];
      const key = child.key;
      if (key) {
        keyed[key] = child;
        //  VD: key="a" → keyed['a'] = <li>A</li>
      } else {
        children.push(child);
        //  Không key → push theo thứ tự!
      }
    }
  }

  // ═══════════════════════════════════
  // BƯỚC 2: Duyệt children mới (VDOM) → tìm match!
  // ═══════════════════════════════════
  if (vchildren && vchildren.length > 0) {
    let min = 0;
    let childrenLen = children.length;

    for (let i = 0; i < vchildren.length; i++) {
      const vchild = vchildren[i];
      const key = vchild.key;
      let child;

      // ① CÓ key → tìm trong keyed map!
      if (key) {
        if (keyed[key]) {
          child = keyed[key];
          keyed[key] = undefined;
          //  ^^^^^^^^^^^^^^^^^^^^^^^
          //  Tìm thấy! Đánh dấu đã dùng!
        }
      }

      // ② KHÔNG key → tìm cùng type trong children!
      else if (min < childrenLen) {
        for (let j = min; j < childrenLen; j++) {
          let c = children[j];

          if (c && isSameNodeType(c, vchild)) {
            //   ^^^^^^^^^^^^^^^^^^^^^^^^
            //   Cùng type? (VD: <li> ↔ <li>)
            //   → Match! Dùng node này!

            child = c;
            children[j] = undefined;
            //  Đánh dấu đã dùng!

            // Tối ưu: thu hẹp khoảng tìm kiếm!
            if (j === childrenLen - 1) childrenLen--;
            if (j === min) min++;
            break;
          }
        }
      }

      // ③ ĐỆ QUY DIFF child!
      child = diff(child, vchild);
      //     ^^^^^^^^^^^^^^^^^^^^^
      //  Gọi lại diff() cho từng child!
      //  → child = null → tạo mới!
      //  → child tồn tại → update!

      // ④ Update vị trí trên DOM!
      const f = domChildren[i];
      //  f = child hiện tại ở vị trí i trên DOM thật!

      if (child && child !== dom && child !== f) {
        if (!f) {
          // Vị trí i trống → THÊM MỚI!
          dom.appendChild(child);
        } else if (child === f.nextSibling) {
          // child = node TIẾP THEO của f
          // → f cần bị XÓA!
          removeNode(f);
        } else {
          // Di chuyển child tới vị trí đúng!
          dom.insertBefore(child, f);
          //  insertBefore(nodeToInsert, referenceNode)
          //  → Chèn child TRƯỚC f!
        }
      }
    }
  }
}
```

```
  diffChildren — LUỒNG CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VD: Real DOM children:                                │
  │  <ul>                                                  │
  │    <li key="a">A</li>                                  │
  │    <li key="b">B</li>                                  │
  │    <li key="c">C</li>                                  │
  │  </ul>                                                 │
  │                                                        │
  │  VDOM children mới:                                    │
  │  [                                                     │
  │    { tag: 'li', key: 'c', children: ['C'] },           │
  │    { tag: 'li', key: 'a', children: ['A-NEW'] },       │
  │    { tag: 'li', key: 'b', children: ['B'] },           │
  │  ]                                                     │
  │                                                        │
  │  BƯỚC 1: Phân loại children cũ:                       │
  │  keyed = { a: <li>A</li>, b: <li>B</li>,              │
  │            c: <li>C</li> }                             │
  │                                                        │
  │  BƯỚC 2: Duyệt VDOM children:                        │
  │                                                        │
  │  i=0: vchild.key='c' → child = keyed['c'] = <li>C</li>│
  │       diff(<li>C</li>, vchild) → <li>C</li> (giữ!)   │
  │       insertBefore(<li>C</li>, <li>A</li>)             │
  │                                                        │
  │  i=1: vchild.key='a' → child = keyed['a'] = <li>A</li>│
  │       diff(<li>A</li>, vchild) → text: A→A-NEW!      │
  │       insertBefore(<li>A-NEW</li>, <li>B</li>)         │
  │                                                        │
  │  i=2: vchild.key='b' → child = keyed['b'] = <li>B</li>│
  │       diff(<li>B</li>, vchild) → giữ nguyên!         │
  │       Đúng vị trí → skip!                             │
  │                                                        │
  │  KẾT QUẢ: <ul>                                        │
  │    <li key="c">C</li>       ← DI CHUYỂN!             │
  │    <li key="a">A-NEW</li>   ← UPDATE text!           │
  │    <li key="b">B</li>       ← GIỮ NGUYÊN!           │
  │  </ul>                                                 │
  │                                                        │
  │  ⭐ Nhờ KEY: chỉ 1 text update + 1 move!             │
  │  → Không KEY: phải tạo lại 3 <li>! 😱               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  isSameNodeType — Helper Function:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  function isSameNodeType(dom, vnode) {                  │
  │                                                        │
  │      // Text node?                                     │
  │      if (typeof vnode === 'string'                      │
  │          || typeof vnode === 'number') {                │
  │          return dom.nodeType === 3;                     │
  │          //  DOM là text node? → cùng type!           │
  │      }                                                 │
  │                                                        │
  │      // Element node?                                  │
  │      if (typeof vnode.tag === 'string') {               │
  │          return dom.nodeName.toLowerCase()              │
  │              === vnode.tag.toLowerCase();               │
  │          //  Cùng tag name? (div ↔ div) → YES!       │
  │      }                                                 │
  │                                                        │
  │      // Component?                                     │
  │      return dom._component                             │
  │          && dom._component.constructor === vnode.tag;   │
  │      //  Cùng constructor? → cùng component type!    │
  │  }                                                     │
  │                                                        │
  │  removeNode — Helper Function:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function removeNode(dom) {                      │  │
  │  │      if (dom && dom.parentNode) {                │  │
  │  │          dom.parentNode.removeChild(dom);        │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.7. Diff Component — So Sánh Component

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: diffComponent — So sánh Real DOM vs VDOM component!
// ═══════════════════════════════════════════════════════════

function diffComponent(dom, vnode) {
  // Lấy component instance từ Real DOM!
  let c = dom && dom._component;
  //              ^^^^^^^^^^^^^^
  //  Nhớ ở Part 2: base._component = component
  //  → Real DOM biết Component nào sở hữu nó!

  let oldDom = dom;

  // ═══════════════════════════════════
  // CASE 1: CÙNG component type → chỉ update props!
  // ═══════════════════════════════════
  if (c && c.constructor === vnode.tag) {
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  VD: cũ = Counter, mới = Counter
    //  → CÙNG component! Chỉ cần update props!

    setComponentProps(c, vnode.attrs);
    //  → componentWillReceiveProps(newProps)!
    //  → renderComponent(c)!
    //  → Diff bên trong component!

    dom = c.base;
    //  Lấy DOM MỚI sau khi re-render!
  }

  // ═══════════════════════════════════
  // CASE 2: KHÁC component type → unmount + tạo mới!
  // ═══════════════════════════════════
  else {
    // Unmount component cũ!
    if (c) {
      unmountComponent(c);
      //  → Cleanup: remove event listeners, etc.
      oldDom = null;
    }

    // Tạo component MỚI!
    c = createComponent(vnode.tag, vnode.attrs);

    // Set props → mount!
    setComponentProps(c, vnode.attrs);
    //  → componentWillMount()
    //  → renderComponent(c)
    //  → componentDidMount()

    dom = c.base;

    // Xóa DOM cũ nếu khác!
    if (oldDom && dom !== oldDom) {
      oldDom._component = null;
      removeNode(oldDom);
    }
  }

  return dom;
}
```

```
  diffComponent — 2 CASES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CASE 1: CÙNG TYPE → UPDATE PROPS!                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  OLD: <Counter num={1} />                        │  │
  │  │  NEW: <Counter num={2} />                        │  │
  │  │                                                  │  │
  │  │  Counter === Counter → CÙNG!                    │  │
  │  │  → setComponentProps(c, { num: 2 })             │  │
  │  │  → componentWillReceiveProps({ num: 2 })        │  │
  │  │  → renderComponent(c)                           │  │
  │  │  → diff() bên trong → chỉ update text!        │  │
  │  │                                                  │  │
  │  │  ⭐ Component instance GIỮ NGUYÊN!             │  │
  │  │  → state vẫn còn!                              │  │
  │  │  → Chỉ props thay đổi!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE 2: KHÁC TYPE → UNMOUNT + TẠO MỚI!             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  OLD: <Counter />                                │  │
  │  │  NEW: <Timer />                                  │  │
  │  │                                                  │  │
  │  │  Counter !== Timer → KHÁC!                      │  │
  │  │  → unmountComponent(Counter) → cleanup!        │  │
  │  │  → createComponent(Timer, props)                │  │
  │  │  → setComponentProps(Timer, props) → mount!    │  │
  │  │  → removeNode(oldDom) → xóa DOM cũ!           │  │
  │  │                                                  │  │
  │  │  ⚠ Component cũ bị HỦY hoàn toàn!             │  │
  │  │  → State mất hết!                              │  │
  │  │  → Component mới tạo từ đầu!                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.8. Sửa renderComponent — Dùng diff() Thay Vì \_render()

```javascript
// ═══════════════════════════════════════════════════════════
// SỬA: renderComponent — Thay _render() bằng diff()!
// → CHỈ CẦN SỬA 2 CHỖ so với Part 2!
// ═══════════════════════════════════════════════════════════

function renderComponent(component) {
  let base;

  const renderer = component.render();

  if (component.base && component.componentWillUpdate) {
    component.componentWillUpdate();
  }

  // ════════════════════════════════════════
  // SỬA 1: Thay _render bằng diff!
  // ════════════════════════════════════════
  // CŨ: base = _render(renderer);
  // MỚI:
  base = diff(component.base, renderer);
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //  diff(oldDOM, newVDOM) → chỉ update thay đổi!
  //  Không tạo lại toàn bộ DOM!

  if (component.base) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate();
    }
  } else if (component.componentDidMount) {
    component.componentDidMount();
  }

  // ════════════════════════════════════════
  // SỬA 2: XÓA replaceChild!
  // ════════════════════════════════════════
  // CŨ:
  // if (component.base && component.base.parentNode) {
  //     component.base.parentNode.replaceChild(
  //         base, component.base
  //     );
  // }
  //
  // → KHÔNG CẦN NỮA!
  // → diff() đã update IN-PLACE trên DOM!
  // → Không cần swap toàn bộ!

  component.base = base;
  base._component = component;
}
```

```
  renderComponent — TRƯỚC vs SAU:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PART 2 (TRƯỚC diff):                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  render() → VDOM                                 │  │
  │  │       │                                          │  │
  │  │       ▼ _render(VDOM) → DOM MỚI hoàn toàn!     │  │
  │  │       │                                          │  │
  │  │       ▼ replaceChild(mới, cũ) → SWAP!          │  │
  │  │       │                                          │  │
  │  │       ⚠ Tạo lại TOÀN BỘ DOM tree!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  PART 3 (SAU diff):                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  render() → VDOM                                 │  │
  │  │       │                                          │  │
  │  │       ▼ diff(oldDOM, VDOM) → UPDATE IN-PLACE!   │  │
  │  │       │                                          │  │
  │  │       ✅ Chỉ update phần thay đổi!             │  │
  │  │       ✅ Không replaceChild!                    │  │
  │  │       ✅ DOM tái sử dụng!                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CHỈ SỬA 2 DÒNG:                                     │
  │  ① _render(renderer)                                  │
  │     → diff(component.base, renderer)                  │
  │  ② Xóa block replaceChild()                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.9. Ví Dụ Thực Tế — Counter Với Diff

```
  VD: Counter — KHÔNG DIFF vs CÓ DIFF:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  class Counter extends React.Component {               │
  │      state = { num: 1 }                                │
  │      onClick() {                                       │
  │          this.setState({ num: this.state.num + 1 });   │
  │      }                                                 │
  │      render() {                                        │
  │          return (                                       │
  │              <div>                                      │
  │                  <h1>count: {this.state.num}</h1>       │
  │                  <button onClick={...}>add</button>     │
  │              </div>                                     │
  │          );                                            │
  │      }                                                 │
  │  }                                                     │
  │                                                        │
  │  ════════════════════════════════════                   │
  │                                                        │
  │  KHÔNG DIFF (Part 2):                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Click "add":                                    │  │
  │  │       │                                          │  │
  │  │       ▼ setState({ num: 2 })                    │  │
  │  │       ▼ renderComponent()                        │  │
  │  │       ▼ _render() → TẠO LẠI toàn bộ:          │  │
  │  │           ✗ <div> → TẠO LẠI!                   │  │
  │  │           ✗ <h1> → TẠO LẠI!                    │  │
  │  │           ✗ "count: 2" → TẠO LẠI!             │  │
  │  │           ✗ <button> → TẠO LẠI!               │  │
  │  │           ✗ "add" → TẠO LẠI!                  │  │
  │  │       ▼ replaceChild(mới, cũ) → SWAP!          │  │
  │  │                                                  │  │
  │  │  → 5 DOM operations! Blink TOÀN BỘ! 😱        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÓ DIFF (Part 3):                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Click "add":                                    │  │
  │  │       │                                          │  │
  │  │       ▼ setState({ num: 2 })                    │  │
  │  │       ▼ renderComponent()                        │  │
  │  │       ▼ diff(oldDOM, VDOM):                     │  │
  │  │           ○ <div> ↔ <div> → GIỐNG → skip!     │  │
  │  │           ○ <h1> ↔ <h1> → GIỐNG → skip!      │  │
  │  │           ● "count: 1" ↔ "count: 2"           │  │
  │  │             → KHÁC! textContent = "count: 2"   │  │
  │  │           ○ <button> ↔ <button> → GIỐNG!      │  │
  │  │           ○ "add" ↔ "add" → GIỐNG → skip!    │  │
  │  │                                                  │  │
  │  │  → CHỈ 1 DOM operation! Blink <h1> text! ✅    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Chrome DevTools (phần nhấp nháy = phần update):       │
  │                                                        │
  │  KHÔNG DIFF:                 CÓ DIFF:                 │
  │  ┌──────────────────┐       ┌──────────────────┐      │
  │  │ ██████████████████│       │                  │      │
  │  │ ██ count: 2 █████│       │ ██ count: 2 ████│      │
  │  │ ██████████████████│       │                  │      │
  │  │ ████ add ████████│       │    add           │      │
  │  │ ██████████████████│       │                  │      │
  │  └──────────────────┘       └──────────────────┘      │
  │  ↑ TOÀN BỘ nhấp nháy!     ↑ CHỈ text nhấp nháy!    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 19.10. Tổng Kết — Mind Map & Takeaways

```
  MIND MAP: PART 3 — DIFF ALGORITHM
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setState() / new props                                │
  │       │                                                │
  │       ▼ renderComponent(component)                     │
  │       │                                                │
  │       ▼ component.render() → Virtual DOM MỚI          │
  │       │                                                │
  │       ▼ diff(component.base, VDOM)  ← THAY ĐỔI!     │
  │       │                                                │
  │       ├── Text Node?                                   │
  │       │   ├── nodeType===3? → textContent = vnode     │
  │       │   └── else → createTextNode + replace         │
  │       │                                                │
  │       ├── Component? (typeof tag === 'function')       │
  │       │   ├── CÙNG type → setComponentProps (update)  │
  │       │   └── KHÁC type → unmount + createComponent   │
  │       │                                                │
  │       └── Native DOM? (typeof tag === 'string')       │
  │           ├── Type khác? → createElement + migrate    │
  │           │                                            │
  │           ├── diffAttributes(dom, vnode)               │
  │           │   ├── Xóa attrs cũ!                       │
  │           │   └── Update attrs mới!                   │
  │           │                                            │
  │           └── diffChildren(dom, vchildren)            │
  │               ├── Phân loại: keyed + unkeyed          │
  │               ├── Match by key (O(1) lookup!)         │
  │               ├── Match by type (linear scan)         │
  │               ├── diff(child, vchild) ← ĐỆ QUY!     │
  │               └── Update vị trí DOM!                  │
  │                   ├── appendChild (thêm mới!)         │
  │                   ├── removeNode (xóa!)               │
  │                   └── insertBefore (di chuyển!)       │
  │                                                        │
  │  ┌── KEY INSIGHT ────────────────────────────────────┐ │
  │  │                                                    │ │
  │  │  diff() thay _render() trong renderComponent!      │ │
  │  │  → _render = TẠO MỚI toàn bộ (Part 2)            │ │
  │  │  → diff = SO SÁNH + UPDATE tại chỗ (Part 3)      │ │
  │  │  → KHÔNG CẦN replaceChild nữa!                   │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Takeaways

```
  ⭐ TAKEAWAYS TỪ PART 3:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. Diff = so sánh Real DOM vs Virtual DOM trực tiếp! │
  │     → KHÔNG lưu Virtual DOM cũ!                      │
  │     → Vừa so sánh vừa update!                        │
  │                                                        │
  │  2. Chỉ so sánh CÙNG CẤP (same level)!              │
  │     → O(n) thay vì O(n³)!                            │
  │     → 1000 nodes: 1000 ops thay vì 10⁹! 🚀         │
  │                                                        │
  │  3. Diff chia 3 loại: Text, Component, Native DOM!    │
  │     → Text: textContent update (siêu nhẹ!)           │
  │     → Component: cùng type→update, khác→unmount      │
  │     → Native: diffAttributes + diffChildren          │
  │                                                        │
  │  4. diffAttributes: 3 bước!                           │
  │     → Thu thập old → Xóa stale → Update changed     │
  │     → Chỉ setAttribute cho attrs THAY ĐỔI!          │
  │                                                        │
  │  5. diffChildren: KEY là chìa khóa tối ưu!           │
  │     → CÓ key → O(1) lookup từ map!                  │
  │     → KHÔNG key → linear scan tìm cùng type!        │
  │     → KEY giúp React biết node nào di chuyển!        │
  │                                                        │
  │  6. ĐÂY LÀ LÝ DO CẦN KEY TRONG LIST!               │
  │     → Không key → React phải đoán match!            │
  │     → Có key → match chính xác → ít DOM ops!       │
  │     → Key phải UNIQUE + STABLE (không dùng index!)   │
  │                                                        │
  │  7. renderComponent CHỈ SỬA 2 DÒNG!                  │
  │     → _render() → diff()                             │
  │     → Xóa replaceChild()                             │
  │     → Diff update IN-PLACE, ko cần swap!             │
  │                                                        │
  │  8. Tham chiếu 2 chiều vẫn QUAN TRỌNG!               │
  │     → component.base → Real DOM                      │
  │     → dom._component → Component                     │
  │     → diffComponent dùng dom._component để tìm       │
  │       component instance từ DOM!                      │
  │                                                        │
  │  9. VẪN CÒN VẤN ĐỀ: setState SYNCHRONOUS!           │
  │     → Mỗi setState → renderComponent NGAY!          │
  │     → 100 setState → 100 re-renders! 😱             │
  │     → GIẢI PHÁP: Async setState + batching (Part 4!) │
  │                                                        │
  │  10. Code Part 3 thêm ~100 dòng (diff functions)!    │
  │      Tổng: Part 1 + 2 + 3 = ~240 dòng JS!           │
  │      → Đủ: createElement + Component + setState     │
  │         + render + diff (same-level) → React core!   │
  │      → React thật phức tạp hơn NHIỀU (Fiber, etc.)  │
  │      → Nhưng TƯ TƯỞNG cốt lõi giống hệt! ✨        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §20. Tự Viết React Từ Đầu (Part 4): Asynchronous setState

```
═══════════════════════════════════════════════════════════════
  SERIES: IMPLEMENTING REACT FROM SCRATCH
  → Part 4 (FINAL): Asynchronous setState!
  → Gộp nhiều setState thành 1 lần render!
  → setState Queue + Flush + Defer (Microtask)!
  → setState nhận FUNCTION → lấy prevState!
  → Tự viết TẤT CẢ bằng tay!
═══════════════════════════════════════════════════════════════
```

### 20.1. Vấn Đề Của Part 3 — setState Synchronous

```
  VẤN ĐỀ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Part 2 + 3: setState GỌI renderComponent NGAY!      │
  │                                                        │
  │  setState(stateChange) {                               │
  │      Object.assign(this.state, stateChange);           │
  │      renderComponent(this);  ← RENDER NGAY!          │
  │  }                                                     │
  │                                                        │
  │  VẤN ĐỀ:                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  onClick() {                                     │  │
  │  │      for (let i = 0; i < 100; i++) {             │  │
  │  │          this.setState({                         │  │
  │  │              num: this.state.num + 1             │  │
  │  │          });                                     │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  i=0: setState → renderComponent → diff → DOM! │  │
  │  │  i=1: setState → renderComponent → diff → DOM! │  │
  │  │  i=2: setState → renderComponent → diff → DOM! │  │
  │  │  ...                                             │  │
  │  │  i=99: setState → renderComponent → diff → DOM!│  │
  │  │                                                  │  │
  │  │  → 100 lần render! 100 lần diff! 😱            │  │
  │  │  → Chỉ cần render 1 LẦN CUỐI là đủ!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ GIẢI PHÁP: Async setState!                        │
  │  → KHÔNG render ngay!                                 │
  │  → Đưa vào QUEUE!                                    │
  │  → Sau khi TẤT CẢ sync code chạy xong → FLUSH!     │
  │  → Gộp state + render 1 LẦN!                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.2. React Thật Hoạt Động Như Thế Nào?

```
  REACT THẬT — setState BEHAVIOR:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VD 1: setState nhận OBJECT:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  componentDidMount() {                           │  │
  │  │      for (let i = 0; i < 100; i++) {             │  │
  │  │          this.setState({                         │  │
  │  │              num: this.state.num + 1             │  │
  │  │          });                                     │  │
  │  │          console.log(this.state.num); // → ?    │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ:                                        │  │
  │  │  console: 0, 0, 0, ..., 0 (100 lần!)            │  │
  │  │  render: <h1>1</h1>  (KHÔNG phải 100!)           │  │
  │  │                                                  │  │
  │  │  TẠI SAO?                                        │  │
  │  │  → setState KHÔNG update ngay!                  │  │
  │  │  → this.state.num LUÔN = 0 trong loop!          │  │
  │  │  → Mỗi lần: { num: 0 + 1 } = { num: 1 }       │  │
  │  │  → Gộp 100 lần { num: 1 } = { num: 1 }!       │  │
  │  │  → Object.assign({}, {num:1}, {num:1}, ...)     │  │
  │  │  → KẾT QUẢ: num = 1!                           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VD 2: setState nhận FUNCTION → lấy prevState!       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  componentDidMount() {                           │  │
  │  │      for (let i = 0; i < 100; i++) {             │  │
  │  │          this.setState(prevState => {             │  │
  │  │              console.log(prevState.num);          │  │
  │  │              return {                            │  │
  │  │                  num: prevState.num + 1           │  │
  │  │              };                                  │  │
  │  │          });                                     │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ:                                        │  │
  │  │  console: 0, 1, 2, 3, ..., 99                    │  │
  │  │  render: <h1>100</h1>  ← ĐÚNG!                  │  │
  │  │                                                  │  │
  │  │  TẠI SAO?                                        │  │
  │  │  → Function nhận prevState (state MỚI NHẤT!)    │  │
  │  │  → i=0: prevState.num = 0 → return { num: 1 }  │  │
  │  │  → i=1: prevState.num = 1 → return { num: 2 }  │  │
  │  │  → ...                                          │  │
  │  │  → i=99: prevState.num = 99 → { num: 100 }     │  │
  │  │  → Giống Array.reduce()!                        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⭐ HAI MỤC TIÊU CẦN ĐẠT:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Async state update: gộp nhiều setState       │  │
  │  │     trong cùng event loop → 1 lần render!       │  │
  │  │                                                  │  │
  │  │  ② setState(function): nhận prevState!          │  │
  │  │     → giải quyết vấn đề stale state!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.3. Kiến Trúc setState Queue

```
  setState QUEUE — ARCHITECTURE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─── setState calls ─────────────────────────────┐   │
  │  │                                                 │   │
  │  │  setState({ num: 1 })  ←── call 1              │   │
  │  │  setState({ num: 2 })  ←── call 2              │   │
  │  │  setState(fn)          ←── call 3              │   │
  │  │                                                 │   │
  │  └───────────┬─────────────────────────────────────┘   │
  │              │                                         │
  │              ▼ enqueueSetState()                       │
  │              │                                         │
  │  ┌───────────▼─────────────────────────────────────┐   │
  │  │  QUEUE: [ {stateChange, component}, ... ]       │   │
  │  │  ┌────┬────┬────┐                               │   │
  │  │  │ s1 │ s2 │ s3 │  ← FIFO (First In First Out)│   │
  │  │  └────┴────┴────┘                               │   │
  │  │  push ──→         ──→ shift                     │   │
  │  └────────────────────────────────────────────────┘   │
  │              │                                         │
  │  ┌───────────▼─────────────────────────────────────┐   │
  │  │  RENDER QUEUE: [component] (KHÔNG trùng lặp!)  │   │
  │  │  ┌──────┐                                       │   │
  │  │  │ comp │  ← Mỗi component chỉ 1 lần!        │   │
  │  │  └──────┘                                       │   │
  │  └────────────────────────────────────────────────┘   │
  │              │                                         │
  │              ▼ DEFER (Promise.resolve / microTask)     │
  │              │                                         │
  │  ┌───────────▼─────────────────────────────────────┐   │
  │  │  flush() — SAU KHI sync code xong!             │   │
  │  │  ① Duyệt queue → merge state!                 │   │
  │  │  ② Duyệt renderQueue → render 1 lần mỗi comp!│   │
  │  └────────────────────────────────────────────────┘   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.4. Tự Viết enqueueSetState + Sửa setState

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: enqueueSetState — Đưa setState vào hàng đợi!
// ═══════════════════════════════════════════════════════════

const setStateQueue = []; // Queue lưu setState data!
const renderQueue = []; // Queue lưu component cần render!

function enqueueSetState(stateChange, component) {
  // ① Lần ĐẦU TIÊN thêm vào queue → schedule flush!
  if (setStateQueue.length === 0) {
    defer(flush);
    //  ^^^^^^^^^
    //  CHỈ schedule 1 LẦN!
    //  → flush sẽ chạy SAU KHI tất cả sync code xong!
    //  → Các setState tiếp theo chỉ push vào queue!
  }

  // ② Push vào setState queue!
  setStateQueue.push({
    stateChange, // Object hoặc Function!
    component, // Component nào gọi setState!
  });

  // ③ Thêm component vào renderQueue (KHÔNG trùng lặp!)
  if (!renderQueue.some((item) => item === component)) {
    renderQueue.push(component);
    //  ^^^^^^^^^^^^^^^^^^^^^^^^
    //  VD: Counter gọi setState 100 lần
    //  → renderQueue chỉ có 1 Counter!
    //  → Render 1 LẦN duy nhất!
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// SỬA: setState — Không render ngay, đưa vào queue!
// ═══════════════════════════════════════════════════════════

class Component {
  // ...

  setState(stateChange) {
    // CŨ (Part 2):
    // Object.assign(this.state, stateChange);
    // renderComponent(this);

    // MỚI (Part 4):
    enqueueSetState(stateChange, this);
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  → KHÔNG update state ngay!
    //  → KHÔNG render ngay!
    //  → Chỉ đưa vào queue!
    //  → flush() sẽ xử lý sau!
  }
}
```

```
  setState MỚI vs CŨ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CŨ (Part 2 — Synchronous):                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  setState({ num: 1 })                            │  │
  │  │       │                                          │  │
  │  │       ▼ Object.assign(state, { num: 1 }) NGAY! │  │
  │  │       ▼ renderComponent(this) NGAY!             │  │
  │  │       ▼ diff() NGAY!                            │  │
  │  │       ▼ DOM update NGAY!                        │  │
  │  │                                                  │  │
  │  │  → Mỗi setState = 1 render cycle! 😱           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  MỚI (Part 4 — Asynchronous):                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  setState({ num: 1 })                            │  │
  │  │       │                                          │  │
  │  │       ▼ enqueueSetState({ num: 1 }, this)       │  │
  │  │       │                                          │  │
  │  │       ├── queue.length === 0? → defer(flush)!  │  │
  │  │       ├── queue.push({ stateChange, comp })     │  │
  │  │       └── renderQueue.push(comp) (if new!)      │  │
  │  │                                                  │  │
  │  │  → Chỉ đưa vào queue! KHÔNG render!            │  │
  │  │  → flush() chạy SAU KHI sync xong!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.5. Tự Viết flush() — Xử Lý Queue

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: flush() — Xử lý TOÀN BỘ queue!
// → Gộp state + Render mỗi component 1 lần!
// ═══════════════════════════════════════════════════════════

function flush() {
  let item, component;

  // ════════════════════════════════════════
  // BƯỚC 1: Duyệt setStateQueue → MERGE STATE!
  // ════════════════════════════════════════
  while ((item = setStateQueue.shift())) {
    //       ^^^^^^^^^^^^^^^^^^^^^^
    //  shift() = Lấy phần tử ĐẦU TIÊN ra!
    //  → FIFO: xử lý theo thứ tự gọi setState!

    const { stateChange, component } = item;

    // Lưu prevState cho lần đầu!
    if (!component.prevState) {
      component.prevState = Object.assign({}, component.state);
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //  Clone state HIỆN TẠI làm prevState!
      //  → Object.assign({}, ...) = shallow copy!
      //  → prevState KHÔNG bị ảnh hưởng khi state thay đổi!
    }

    // ① stateChange = FUNCTION?
    if (typeof stateChange === "function") {
      Object.assign(
        component.state,
        stateChange(component.prevState, component.props),
        //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //  Gọi function với prevState (state MỚI NHẤT)!
        //  → Return value = state mới!
        //
        //  VD: setState(prev => ({ num: prev.num + 1 }))
        //  i=0: prev.num = 0 → state = { num: 1 }
        //  i=1: prev.num = 1 → state = { num: 2 }
        //  → Mỗi lần nhận prevState CẬP NHẬT!
      );
    }

    // ② stateChange = OBJECT?
    else {
      Object.assign(component.state, stateChange);
      //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //  Merge trực tiếp!
      //  → VD: 100 lần { num: 0 + 1 } = { num: 1 }
      //  → Tất cả GIỐNG nhau → gộp = { num: 1 }!
    }

    // Update prevState cho lần gọi TIẾP THEO!
    component.prevState = component.state;
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  Quan trọng! Nếu setState tiếp theo là function
    //  → nó sẽ nhận prevState = state SAU khi merge!
  }

  // ════════════════════════════════════════
  // BƯỚC 2: Duyệt renderQueue → RENDER!
  // ════════════════════════════════════════
  while ((component = renderQueue.shift())) {
    renderComponent(component);
    //  ^^^^^^^^^^^^^^^^^^^^^^^^
    //  Render MỖI component CHỈ 1 LẦN!
    //  → Dù setState được gọi 100 lần!
    //  → renderQueue không trùng → 1 lần render!
  }
}
```

```
  flush() — LUỒNG CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VD: Counter gọi setState 100 lần (Object):           │
  │                                                        │
  │  TRƯỚC flush:                                          │
  │  setStateQueue = [                                     │
  │    { stateChange: {num:1}, comp: Counter },            │
  │    { stateChange: {num:1}, comp: Counter },            │
  │    ... (100 items)                                     │
  │  ]                                                     │
  │  renderQueue = [ Counter ]  (chỉ 1!)                  │
  │                                                        │
  │  BƯỚC 1: Duyệt setStateQueue:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  item 0: { num: 1 }                              │  │
  │  │    → prevState = { num: 0 } (clone!)            │  │
  │  │    → Object.assign(state, { num: 1 })           │  │
  │  │    → state = { num: 1 }                         │  │
  │  │                                                  │  │
  │  │  item 1: { num: 1 }                              │  │
  │  │    → Object.assign(state, { num: 1 })           │  │
  │  │    → state = { num: 1 } (GIỐNG! ghi đè!)       │  │
  │  │                                                  │  │
  │  │  ... (98 items nữa, đều { num: 1 })              │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ: state = { num: 1 } 😱                │  │
  │  │  → 100 lần setState nhưng num chỉ = 1!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VD: Counter gọi setState 100 lần (Function):         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  item 0: fn(prev) → { num: prev.num + 1 }       │  │
  │  │    → prevState = { num: 0 }                     │  │
  │  │    → return { num: 0 + 1 } = { num: 1 }        │  │
  │  │    → state = { num: 1 }                         │  │
  │  │                                                  │  │
  │  │  item 1: fn(prev) → { num: prev.num + 1 }       │  │
  │  │    → prevState = { num: 1 }  ← CẬP NHẬT!      │  │
  │  │    → return { num: 1 + 1 } = { num: 2 }        │  │
  │  │    → state = { num: 2 }                         │  │
  │  │                                                  │  │
  │  │  ... (98 items nữa)                              │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ: state = { num: 100 } ✅              │  │
  │  │  → Giống Array.reduce()!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  BƯỚC 2: Duyệt renderQueue:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  renderComponent(Counter)                        │  │
  │  │  → render() → VDOM mới                          │  │
  │  │  → diff(oldDOM, VDOM) → update DOM!            │  │
  │  │                                                  │  │
  │  │  ⭐ CHỈ 1 LẦN render! Dù 100 setState!        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.6. defer() — Chìa Khóa Của Async!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: defer() — Trì hoãn flush SAU sync code!
// ═══════════════════════════════════════════════════════════

function defer(fn) {
  return Promise.resolve().then(fn);
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //  Promise.resolve().then() = MICROTASK!
  //  → Chạy SAU KHI call stack trống!
  //  → TRƯỚC setTimeout (macrotask)!
}
```

```
  EVENT LOOP — TẠI SAO defer HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  JavaScript EVENT LOOP:                                │
  │                                                        │
  │  ┌──── Call Stack ────┐                                │
  │  │  componentDidMount │  ← sync code chạy trước!     │
  │  │  ├─ setState(1)    │  → enqueue! defer(flush)!     │
  │  │  ├─ setState(2)    │  → enqueue! (đã có defer)     │
  │  │  ├─ setState(3)    │  → enqueue!                   │
  │  │  ├─ ...            │                                │
  │  │  └─ setState(100)  │  → enqueue!                   │
  │  └────────────────────┘                                │
  │           │                                            │
  │           ▼ Call stack TRỐNG!                          │
  │           │                                            │
  │  ┌──── Microtask Queue ────┐                           │
  │  │  flush()                │  ← Promise.resolve!      │
  │  │  → Duyệt 100 items!   │                            │
  │  │  → Merge state!       │                            │
  │  │  → Render 1 lần!      │                            │
  │  └────────────────────────┘                            │
  │           │                                            │
  │           ▼                                            │
  │  ┌──── Macrotask Queue ────┐                           │
  │  │  (setTimeout, events)    │                           │
  │  └────────────────────────┘                            │
  │                                                        │
  │  THỨ TỰ THỰC THI:                                    │
  │  ① Sync code (call stack) — setState 100 lần!        │
  │  ② Microtask (Promise) — flush()!                     │
  │  ③ Macrotask (setTimeout) — nếu có!                  │
  │                                                        │
  │  ⭐ KEY INSIGHT:                                       │
  │  → defer(flush) được gọi ở setState ĐẦU TIÊN!       │
  │  → flush được schedule vào MICROTASK!                 │
  │  → 99 setState còn lại chỉ push vào queue!           │
  │  → SAU KHI tất cả 100 setState xong (sync)           │
  │  → flush() chạy! Duyệt 100 items! Render 1 lần!     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  THỰC CHỨNG: Thứ tự thực thi:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setTimeout(() => console.log(2), 0);                  │
  │  Promise.resolve().then(() => console.log(1));         │
  │  console.log(3);                                       │
  │                                                        │
  │  OUTPUT:                                               │
  │  3   ← Sync! (call stack)                             │
  │  1   ← Microtask! (Promise.resolve)                   │
  │  2   ← Macrotask! (setTimeout)                        │
  │                                                        │
  │  → Promise.resolve chạy TRƯỚC setTimeout!            │
  │  → Đây là lý do dùng Promise cho defer!              │
  │  → flush() chạy ngay sau sync, TRƯỚC macrotask!      │
  │                                                        │
  │  CÁC CÁCH THAY THẾ CHO defer():                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① Promise.resolve().then(fn)  ← MICROTASK!    │  │
  │  │     → Nhanh nhất! Chạy ngay sau sync!          │  │
  │  │                                                  │  │
  │  │  ② setTimeout(fn, 0)  ← MACROTASK!             │  │
  │  │     → Chậm hơn! Sau microtask!                 │  │
  │  │                                                  │  │
  │  │  ③ requestAnimationFrame(fn)                    │  │
  │  │     → Sync với rendering cycle trình duyệt!    │  │
  │  │     → ~16ms (60fps)                             │  │
  │  │                                                  │  │
  │  │  ④ requestIdleCallback(fn)                      │  │
  │  │     → Chạy khi browser RẢNH!                   │  │
  │  │     → Không đảm bảo thời gian!                 │  │
  │  │                                                  │  │
  │  │  ⭐ React thật dùng kết hợp nhiều chiến lược!  │  │
  │  │     → Scheduler + MessageChannel + rIC!        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.7. Ví Dụ Thực Tế — Counter Với Async setState

```
  VD: Counter — Object vs Function setState:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VD 1: setState OBJECT (100 lần):                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  componentDidMount() {                           │  │
  │  │      for (let i = 0; i < 100; i++) {             │  │
  │  │          this.setState({                         │  │
  │  │              num: this.state.num + 1             │  │
  │  │          });                                     │  │
  │  │          console.log(this.state.num);             │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  TIMELINE:                                       │  │
  │  │  ────────────────────────────────────────────    │  │
  │  │  SYNC PHASE (call stack):                        │  │
  │  │  ────────────────────────────────────────────    │  │
  │  │  i=0: enqueue({num:0+1=1}) → defer(flush)!     │  │
  │  │       console.log(state.num) → 0 (chưa update!) │  │
  │  │  i=1: enqueue({num:0+1=1}) → queue grows!      │  │
  │  │       console.log(state.num) → 0                │  │
  │  │  i=2: enqueue({num:0+1=1})                      │  │
  │  │       console.log(state.num) → 0                │  │
  │  │  ... (97 more)                                   │  │
  │  │  i=99: enqueue({num:0+1=1})                     │  │
  │  │        console.log(state.num) → 0               │  │
  │  │                                                  │  │
  │  │  Console: 0 0 0 0 0 ... 0 (100 lần!)            │  │
  │  │  ────────────────────────────────────────────    │  │
  │  │  MICROTASK PHASE (Promise):                      │  │
  │  │  ────────────────────────────────────────────    │  │
  │  │  flush():                                        │  │
  │  │    merge 100x {num:1} → state = {num:1}         │  │
  │  │    renderComponent(Counter) → 1 lần!            │  │
  │  │    diff() → <h1> text: "0" → "1"               │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ: <h1>1</h1> (không phải 100!)         │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VD 2: setState FUNCTION (100 lần):                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  componentDidMount() {                           │  │
  │  │      for (let i = 0; i < 100; i++) {             │  │
  │  │          this.setState(prevState => {             │  │
  │  │              console.log(prevState.num);          │  │
  │  │              return {                            │  │
  │  │                  num: prevState.num + 1           │  │
  │  │              };                                  │  │
  │  │          });                                     │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  TIMELINE:                                       │  │
  │  │  ────────────────────────────────────────────    │  │
  │  │  SYNC PHASE: enqueue(fn) x 100                  │  │
  │  │    (fn chưa được GỌI! chỉ push vào queue!)     │  │
  │  │  ────────────────────────────────────────────    │  │
  │  │  MICROTASK PHASE:                                │  │
  │  │  flush():                                        │  │
  │  │    item 0: fn(prev={num:0}) → {num:1}           │  │
  │  │            console: 0                            │  │
  │  │    item 1: fn(prev={num:1}) → {num:2}           │  │
  │  │            console: 1                            │  │
  │  │    item 2: fn(prev={num:2}) → {num:3}           │  │
  │  │            console: 2                            │  │
  │  │    ... (97 more)                                 │  │
  │  │    item 99: fn(prev={num:99}) → {num:100}       │  │
  │  │             console: 99                          │  │
  │  │                                                  │  │
  │  │  Console: 0 1 2 3 4 ... 99 ✅                   │  │
  │  │  KẾT QUẢ: <h1>100</h1> ✅                      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⭐ SO SÁNH:                                          │
  │  ┌────────────────┬──────────────┬──────────────┐     │
  │  │                │ Object       │ Function     │     │
  │  ├────────────────┼──────────────┼──────────────┤     │
  │  │ Kết quả num   │ 1            │ 100          │     │
  │  │ console.log   │ 0,0,0,...,0  │ 0,1,2,...,99 │     │
  │  │ Render lần    │ 1            │ 1            │     │
  │  │ Cơ chế        │ Ghi đè!     │ Giống reduce │     │
  │  │ Dùng khi      │ Đơn giản    │ Cần prevState│     │
  │  └────────────────┴──────────────┴──────────────┘     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.8. Code Hoàn Chỉnh — Part 4 (Async setState)

```javascript
// ═══════════════════════════════════════════════════════════
// COMPLETE CODE: Async setState Module
// → Thêm vào Part 1 + 2 + 3!
// ═══════════════════════════════════════════════════════════

// ─── defer: Trì hoãn fn sang microtask! ───
function defer(fn) {
  return Promise.resolve().then(fn);
}

// ─── Queue: Lưu trữ setState! ───
const setStateQueue = [];
const renderQueue = [];

// ─── enqueueSetState: Đưa setState vào hàng đợi! ───
function enqueueSetState(stateChange, component) {
  if (setStateQueue.length === 0) {
    defer(flush);
  }

  setStateQueue.push({ stateChange, component });

  if (!renderQueue.some((item) => item === component)) {
    renderQueue.push(component);
  }
}

// ─── flush: Xử lý queue! ───
function flush() {
  let item, component;

  while ((item = setStateQueue.shift())) {
    const { stateChange, component } = item;

    if (!component.prevState) {
      component.prevState = Object.assign({}, component.state);
    }

    if (typeof stateChange === "function") {
      Object.assign(
        component.state,
        stateChange(component.prevState, component.props),
      );
    } else {
      Object.assign(component.state, stateChange);
    }

    component.prevState = component.state;
  }

  while ((component = renderQueue.shift())) {
    renderComponent(component);
  }
}

// ─── SỬA Component class: setState dùng queue! ───
class Component {
  constructor(props) {
    this.state = {};
    this.props = props;
  }

  setState(stateChange) {
    enqueueSetState(stateChange, this);
  }
}
```

```
  CODE SUMMARY — TẤT CẢ 4 PARTS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PART 1: JSX → Virtual DOM → Real DOM    (~50 dòng)  │
  │  ├── createElement(tag, attrs, ...children)            │
  │  ├── setAttribute(dom, key, value)                     │
  │  ├── _render(vnode) → Real DOM!                       │
  │  └── render(vnode, container)                          │
  │                                                        │
  │  PART 2: Components + Lifecycle          (~60 dòng)   │
  │  ├── Component { state, props, setState }              │
  │  ├── createComponent(component, props)                 │
  │  ├── setComponentProps(component, props)                │
  │  └── renderComponent(component)                        │
  │                                                        │
  │  PART 3: Diff Algorithm                  (~100 dòng)  │
  │  ├── diff(dom, vnode)                                  │
  │  ├── diffAttributes(dom, vnode)                        │
  │  ├── diffChildren(dom, vchildren)                      │
  │  ├── diffComponent(dom, vnode)                         │
  │  ├── isSameNodeType(dom, vnode)                        │
  │  └── removeNode(dom)                                   │
  │                                                        │
  │  PART 4: Async setState                  (~50 dòng)   │
  │  ├── defer(fn) → Promise.resolve().then(fn)           │
  │  ├── enqueueSetState(stateChange, component)           │
  │  ├── flush() → merge state + render!                  │
  │  └── SỬA: setState → enqueueSetState()               │
  │                                                        │
  │  ══════════════════════════════════════════════════    │
  │  TỔNG: ~260 dòng JavaScript!                          │
  │  → Đủ để implement React core!                       │
  │  → createElement + Component + diff + async setState  │
  │  ══════════════════════════════════════════════════    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 20.9. Tổng Kết Toàn Bộ Series — Mind Map & Takeaways

```
  MIND MAP: TOÀN BỘ SERIES — TỰ VIẾT REACT TỪ ĐẦU!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  JSX Code                                              │
  │  <App name="world" />                                  │
  │       │                                                │
  │       ▼ BABEL TRANSFORM                               │
  │       │                                                │
  │  Part 1: createElement(App, {name:'world'})           │
  │       │                                                │
  │       ▼ VIRTUAL DOM                                   │
  │       { tag: App, attrs: {name:'world'}, children: [] }│
  │       │                                                │
  │       ├── tag = string? → createElement (DOM)        │
  │       └── tag = function? → COMPONENT! (Part 2)      │
  │                │                                       │
  │  Part 2:       ▼ createComponent()                    │
  │                │ (Class → new, Function → wrap)       │
  │                ▼ setComponentProps()                   │
  │                │ (WillMount / WillReceiveProps)        │
  │                ▼ renderComponent()                     │
  │                │ (render → VDOM → diff → lifecycle)  │
  │                │                                       │
  │  Part 3:       ▼ diff(oldDOM, newVDOM)                │
  │                ├── Text: textContent update            │
  │                ├── Native: diffAttrs + diffChildren!  │
  │                │   └── KEY matching! (O(1) lookup)    │
  │                └── Component: diffComponent           │
  │                    ├── Same type → update props       │
  │                    └── Diff type → unmount + create   │
  │                │                                       │
  │  Part 4:  setState(stateChange)                       │
  │                │                                       │
  │                ▼ enqueueSetState()                     │
  │                │ (push to queue!)                       │
  │                │                                       │
  │                ▼ defer(flush) ← MICROTASK!            │
  │                │ (chỉ schedule 1 lần!)                │
  │                │                                       │
  │                ▼ ... sync code tiếp tục ...           │
  │                │                                       │
  │                ▼ CALL STACK TRỐNG!                     │
  │                │                                       │
  │                ▼ flush()                               │
  │                ├── Merge state (Object / Function!)    │
  │                └── renderComponent() → 1 LẦN!        │
  │                    └── diff() → chỉ update thay đổi! │
  │                        └── DOM update! ✅             │
  │                                                        │
  │  ┌── EVOLUTION ──────────────────────────────────────┐ │
  │  │                                                    │ │
  │  │  Part 1: JSX → VDOM → _render() → DOM            │ │
  │  │  Part 2: + Component + Lifecycle + setState       │ │
  │  │  Part 3: _render() → diff() (update tại chỗ!)   │ │
  │  │  Part 4: setState sync → async (queue+flush!)    │ │
  │  │                                                    │ │
  │  │  ⭐ Mỗi Part giải quyết 1 VẤN ĐỀ của Part trước!│ │
  │  │  → Part 2: thêm Component (thiếu ở Part 1)      │ │
  │  │  → Part 3: diff thay _render (hiệu năng!)       │ │
  │  │  → Part 4: async thay sync (hiệu năng!)         │ │
  │  │                                                    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Takeaways — Toàn Bộ Series!

```
  ⭐ TAKEAWAYS TỪ PART 4 + TOÀN BỘ SERIES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. setState ASYNC: không update state NGAY!          │
  │     → Đưa vào QUEUE → flush sau khi sync xong!      │
  │     → Nhiều setState gộp thành 1 lần render!         │
  │                                                        │
  │  2. TWO FORMS of setState:                             │
  │     → Object: setState({num: 1})                      │
  │       → GHI ĐÈ! 100 lần = {num:1} (không phải 100!) │
  │     → Function: setState(prev => ({num: prev.num+1})) │
  │       → CHAIN! 100 lần = {num:100} ✅                │
  │                                                        │
  │  3. Queue = FIFO: push() + shift()!                   │
  │     → setStateQueue: lưu {stateChange, component}    │
  │     → renderQueue: lưu component (KHÔNG trùng!)      │
  │                                                        │
  │  4. defer = Promise.resolve().then(fn)!               │
  │     → MICROTASK! Chạy sau sync, trước macrotask!     │
  │     → CHỈ schedule 1 lần (queue.length === 0)!       │
  │                                                        │
  │  5. flush = 2 bước: merge state + render!             │
  │     → BƯỚC 1: duyệt queue → Object.assign state!    │
  │     → BƯỚC 2: duyệt renderQueue → renderComponent!  │
  │     → Tách riêng để tránh render trùng!              │
  │                                                        │
  │  ═══════════════════════════════════════════════════   │
  │  SERIES SUMMARY:                                       │
  │  ═══════════════════════════════════════════════════   │
  │                                                        │
  │  6. ~260 dòng JS = React core đầy đủ!                │
  │     → createElement + Component + diff + async!      │
  │     → React thật ~10,000+ dòng (Fiber, Scheduler...) │
  │     → Nhưng TƯ TƯỞNG cốt lõi GIỐNG HỆT!            │
  │                                                        │
  │  7. Virtual DOM = JavaScript Object (nhẹ hơn DOM!)    │
  │     → {tag, attrs, children} = mô tả UI!             │
  │     → So sánh Object nhanh hơn so sánh DOM!          │
  │     → diff() tìm thay đổi tối thiểu!                │
  │                                                        │
  │  8. Diff Algorithm = O(n) same-level only!            │
  │     → KEY quan trọng cho list rendering!              │
  │     → component.base = cầu nối 2 chiều!              │
  │     → diff thay _render → update tại chỗ!           │
  │                                                        │
  │  9. setState = trái tim của React!                    │
  │     → Part 2: sync (đơn giản nhưng chậm)            │
  │     → Part 4: async queue (gộp + render 1 lần)       │
  │     → React thật: batching + Scheduler + Fiber       │
  │                                                        │
  │  10. SERIES CHƯA COVER:                               │
  │     → Fiber Architecture (React 16+)                  │
  │       → Chia nhỏ render thành chunks!                │
  │       → requestIdleCallback-style scheduling!         │
  │     → Hooks (React 16.8+)                             │
  │       → useState, useEffect, useMemo...              │
  │     → Concurrent Mode (React 18+)                     │
  │       → Suspense, Transitions, Streaming SSR         │
  │     → Server Components (React 19+)                   │
  │       → RSC, Server Actions                          │
  │     → Nhưng NỀN TẢNG vẫn là những gì ta đã viết!   │
  │     → Hiểu core → hiểu tất cả phần nâng cao! ✨    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  SERIES COMPLETE! ✅
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Part 1: JSX + Virtual DOM + Render      ✅           │
  │  Part 2: Components + Lifecycle          ✅           │
  │  Part 3: Diff Algorithm                  ✅           │
  │  Part 4: Async setState (FINAL)          ✅           │
  │                                                        │
  │  → ~260 dòng JS = React core hoàn chỉnh! 🎉        │
  │  → Từ JSX → Virtual DOM → Real DOM → Diff → Async! │
  │  → Hiểu TẠI SAO React được thiết kế như vậy!        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §21. Triết Lý Thiết Kế React Team — Qua Lăng Kính setState Promise

```
═══════════════════════════════════════════════════════════════
  CHUYÊN ĐỀ: setState & Promise — Tại Sao React KHÔNG
  cho setState trả về Promise?
  → Bí mật đằng sau thiết kế setState!
  → Issue #2642: Make setState return a promise!
  → Phân tích source code ReactBaseClasses.js!
  → Quan điểm Dan Abramov + sebmarkbage!
  → Anti-pattern: tự wrap Promise cho setState!
═══════════════════════════════════════════════════════════════
```

### 21.1. Bí Mật setState Ai Cũng Biết Nhưng Ít Ai Hiểu Sâu

```
  setState — "BÍ MẬT" AI CŨNG BIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  HẦU HẾT developer đều biết:                         │
  │  → setState "CÓ THỂ" là asynchronous!               │
  │                                                        │
  │  NHƯNG ÍT AI tự hỏi:                                 │
  │  → TẠI SAO phải async?                               │
  │  → TẠI SAO không dùng Promise?                       │
  │  → React team đã BÀN LUẬN gì về vấn đề này?         │
  │  → Thiết kế hiện tại phản ánh TRIẾT LÝ gì?          │
  │                                                        │
  │  TẠI SAO setState ASYNC?                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  setState → re-render → TỐN HIỆU NĂNG!        │  │
  │  │                                                  │  │
  │  │  Nếu SYNC:                                      │  │
  │  │  setState({a:1}) → render!                      │  │
  │  │  setState({b:2}) → render!                      │  │
  │  │  setState({c:3}) → render!                      │  │
  │  │  → 3 lần render liên tiếp = LÃNG PHÍ!         │  │
  │  │                                                  │  │
  │  │  Nếu ASYNC (batching):                          │  │
  │  │  setState({a:1}) → queue!                       │  │
  │  │  setState({b:2}) → queue!                       │  │
  │  │  setState({c:3}) → queue!                       │  │
  │  │  → flush → merge {a:1,b:2,c:3} → render 1 LẦN!│  │
  │  │                                                  │  │
  │  │  ⭐ BATCHING = gộp nhiều setState                │  │
  │  │     → chỉ TRIGGER 1 lần re-render!              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  VẤN ĐỀ KINH ĐIỂN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  function incrementMultiple() {                        │
  │      this.setState({ count: this.state.count + 1 });   │
  │      this.setState({ count: this.state.count + 1 });   │
  │      this.setState({ count: this.state.count + 1 });   │
  │  }                                                     │
  │                                                        │
  │  TRỰC GIÁC: count tăng 3!                             │
  │  THỰC TẾ: count chỉ tăng 1! 😱                       │
  │                                                        │
  │  TẠI SAO?                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  state = { count: 0 }                            │  │
  │  │                                                  │  │
  │  │  Lần 1: { count: 0 + 1 } = { count: 1 }        │  │
  │  │  Lần 2: { count: 0 + 1 } = { count: 1 }        │  │
  │  │         ← this.state.count VẪN = 0!             │  │
  │  │         ← vì setState chưa update ngay!         │  │
  │  │  Lần 3: { count: 0 + 1 } = { count: 1 }        │  │
  │  │                                                  │  │
  │  │  Batching merge:                                 │  │
  │  │  Object.assign({},                               │  │
  │  │    { count: 1 },                                 │  │
  │  │    { count: 1 },                                 │  │
  │  │    { count: 1 }                                  │  │
  │  │  ) = { count: 1 }                                │  │
  │  │                                                  │  │
  │  │  → GHI ĐÈ! Không phải cộng dồn!               │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.2. Ba "Hack" Để setState Update Liên Tục

```
  3 CÁCH GIẢI QUYẾT setState BATCHING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÁCH 1: Functional setState (truyền FUNCTION!)       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  this.setState(prev => ({                        │  │
  │  │      count: prev.count + 1                       │  │
  │  │  }));                                            │  │
  │  │  this.setState(prev => ({                        │  │
  │  │      count: prev.count + 1                       │  │
  │  │  }));                                            │  │
  │  │  this.setState(prev => ({                        │  │
  │  │      count: prev.count + 1                       │  │
  │  │  }));                                            │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ: count = 3 ✅                          │  │
  │  │                                                  │  │
  │  │  TẠI SAO?                                        │  │
  │  │  → Function nhận prevState MỚI NHẤT!            │  │
  │  │  → fn1(prev={count:0}) → {count:1}             │  │
  │  │  → fn2(prev={count:1}) → {count:2}             │  │
  │  │  → fn3(prev={count:2}) → {count:3}             │  │
  │  │  → Giống Array.reduce! (đã giải thích ở §20)   │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÁCH 2: setState callback (tham số thứ 2!)           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  setState(updater, [callback])                    │  │
  │  │            │           │                          │  │
  │  │            │           └── Hàm chạy SAU update!  │  │
  │  │            └── Object hoặc Function!             │  │
  │  │                                                  │  │
  │  │  this.setState({ count: this.state.count + 1 },  │  │
  │  │      () => {                                     │  │
  │  │          // state ĐÃ update ở đây!              │  │
  │  │          this.setState({                         │  │
  │  │              count: this.state.count + 1         │  │
  │  │          }, () => {                              │  │
  │  │              // lần 3...                         │  │
  │  │              this.setState({                     │  │
  │  │                  count: this.state.count + 1     │  │
  │  │              });                                 │  │
  │  │          });                                     │  │
  │  │      }                                           │  │
  │  │  );                                              │  │
  │  │                                                  │  │
  │  │  ⚠️ VẤN ĐỀ: CALLBACK HELL!                    │  │
  │  │  → Nest sâu 3 tầng! Giống callback cổ điển!   │  │
  │  │  → Rất khó đọc + maintain!                     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÁCH 3: Lifecycle hooks!                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  → Đặt logic vào componentDidUpdate!            │  │
  │  │                                                  │  │
  │  │  componentDidUpdate(prevProps, prevState) {       │  │
  │  │      if (prevState.count !== this.state.count) {  │  │
  │  │          // State đã update! Thực hiện bước tiếp!│  │
  │  │          this.doNextStep();                       │  │
  │  │      }                                           │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  ✅ SẠCH! Không callback hell!                  │  │
  │  │  ✅ Lifecycle tự nhiên của React!               │  │
  │  │  ⚠️ Nhưng logic phân tán (khó theo dõi flow)  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.3. Issue #2642 — Đề Xuất setState Trả Về Promise!

```
  ISSUE #2642: Make setState return a promise!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  🔗 github.com/facebook/react/issues/2642             │
  │                                                        │
  │  BỐI CẢNH THỰC TẾ:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Bảng có thể chỉnh sửa (Editable Table):        │  │
  │  │                                                  │  │
  │  │  Yêu cầu:                                        │  │
  │  │  ① Khi user nhấn Enter → con trỏ di chuyển     │  │
  │  │     xuống dòng tiếp theo (setState move cursor)  │  │
  │  │  ② Nếu đang ở dòng CUỐI + nhấn Enter:          │  │
  │  │     → B1: TẠO dòng mới (setState create row)   │  │
  │  │     → B2: SAU KHI tạo xong → focus vào dòng mới│  │
  │  │          (setState move cursor)                  │  │
  │  │                                                  │  │
  │  │  VẤN ĐỀ: B2 PHỤ THUỘC vào B1 hoàn thành!     │  │
  │  │  → setState async → B2 chạy trước B1 xong?    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CODE SAI (không xử lý async):                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  this.setState({                                 │  │
  │  │      selected: input  // Tạo dòng mới!          │  │
  │  │  });                                             │  │
  │  │                                                  │  │
  │  │  // ⚠️ this.state.selected CÓ THỂ CHƯA UPDATE! │  │
  │  │  this.props.didSelect(this.state.selected);       │  │
  │  │  //                     ^^^^^^^^^^^^^^^^^         │  │
  │  │  //  Giá trị CŨ! Chưa phải dòng mới!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CODE ĐÚNG (callback — tham số thứ 2):                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  this.setState({                                 │  │
  │  │      selected: input                             │  │
  │  │  }, () => {  // ← Callback SAU KHI update!      │  │
  │  │      this.props.didSelect(this.state.selected);   │  │
  │  │      //                   ^^^^^^^^^^^^^^^^^       │  │
  │  │      //  Giá trị MỚI! Đúng dòng mới!           │  │
  │  │  });                                             │  │
  │  │                                                  │  │
  │  │  ⚠️ VẤN ĐỀ: Nesting nhiều tầng = CALLBACK HELL!│  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ĐỀ XUẤT: setState trả về PROMISE!                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  "setState() currently accepts an optional       │  │
  │  │   second argument for callback and returns       │  │
  │  │   undefined. This results in callback hell for   │  │
  │  │   a very stateful component. Having it return    │  │
  │  │   a promise would make it much more manageable." │  │
  │  │                                                  │  │
  │  │  — Issue #2642 author                           │  │
  │  │                                                  │  │
  │  │  Code đề xuất:                                   │  │
  │  │  this.setState({                                 │  │
  │  │      selected: input                             │  │
  │  │  }).then(() => {                                 │  │
  │  │      this.props.didSelect(this.state.selected);   │  │
  │  │  });                                             │  │
  │  │                                                  │  │
  │  │  → Nhìn SẠCH hơn callback hell!                │  │
  │  │  → Quen thuộc cho JS developer!                 │  │
  │  │  → Chain được nhiều steps!                      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.4. Khám Phá Source Code — Biến setState Thành Promise

```
  SOURCE CODE: ReactBaseClasses.js
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  📁 react/src/isomorphic/modern/class/                 │
  │     ReactBaseClasses.js                                │
  │                                                        │
  │  CODE GỐC:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ReactComponent.prototype.setState =              │  │
  │  │    function(partialState, callback) {              │  │
  │  │                                                  │  │
  │  │      invariant(                                  │  │
  │  │        typeof partialState === 'object' ||       │  │
  │  │        typeof partialState === 'function' ||     │  │
  │  │        partialState == null,                     │  │
  │  │        'setState(...): takes an object...'       │  │
  │  │      );                                          │  │
  │  │                                                  │  │
  │  │      this.updater.enqueueSetState(               │  │
  │  │        this,                                     │  │
  │  │        partialState,                             │  │
  │  │        callback,    ← Optional callback!         │  │
  │  │        'setState'                                │  │
  │  │      );                                          │  │
  │  │                                                  │  │
  │  │    };                                            │  │
  │  │    // → return UNDEFINED! Không có Promise!     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  GHI CHÚ QUAN TRỌNG TRONG SOURCE:                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① "You can provide an optional callback that   │  │
  │  │     will be executed when the call to setState   │  │
  │  │     is actually completed."                      │  │
  │  │     → Cơ sở cho callback (tham số thứ 2)!      │  │
  │  │                                                  │  │
  │  │  ② "When a function is provided to setState,    │  │
  │  │     it will be called at some point in the       │  │
  │  │     future (not synchronously)."                 │  │
  │  │     → Cơ sở cho functional setState!            │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH SỬA SOURCE CODE ĐỂ setState TRẢ VỀ PROMISE!
// (Từ Issue #2642 — PR đề xuất)
// ═══════════════════════════════════════════════════════════

ReactComponent.prototype.setState = function (partialState, callback) {
  invariant(
    typeof partialState === "object" ||
      typeof partialState === "function" ||
      partialState == null,
    "setState(...): takes an object of state variables to update or a " +
      "function which returns an object of state variables.",
  );

  // ══════════════ THÊM MỚI ══════════════
  let callbackPromise;

  if (!callback) {
    // Nếu KHÔNG có callback → tạo Promise!

    // Deferred pattern — tách resolve/reject ra ngoài!
    class Deferred {
      constructor() {
        this.promise = new Promise((resolve, reject) => {
          this.reject = reject;
          this.resolve = resolve;
        });
      }
    }
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  DEFERRED PATTERN:
    //  → Bình thường: resolve/reject nằm TRONG Promise constructor!
    //  → Deferred: "lôi" resolve/reject RA NGOÀI!
    //  → Có thể gọi resolve() ở BẤT KỲ ĐÂU!

    callbackPromise = new Deferred();

    // Biến resolve thành callback!
    callback = () => {
      callbackPromise.resolve();
      //  ^^^^^^^^^^^^^^^^^^^^^^^^
      //  Khi React gọi callback (state đã update)
      //  → resolve Promise!
      //  → .then() handlers chạy!
    };
  }
  // ════════════════════════════════════════

  this.updater.enqueueSetState(this, partialState, callback, "setState");

  // ══════════════ THÊM MỚI ══════════════
  if (callbackPromise) {
    return callbackPromise.promise;
    //     ^^^^^^^^^^^^^^^^^^^^^
    //  TRẢ VỀ Promise thay vì undefined!
    //  → Developer có thể .then()!
  }
  // ════════════════════════════════════════
};
```

```
  LUỒNG HOẠT ĐỘNG SAU KHI SỬA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TRƯỚC (CODE GỐC):                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  const result = this.setState({ count: 1 });     │  │
  │  │  console.log(result); // undefined!              │  │
  │  │                                                  │  │
  │  │  → Không thể chain!                             │  │
  │  │  → Phải dùng callback hoặc lifecycle!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SAU (CODE SỬA):                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Nếu CÓ callback:                               │  │
  │  │  this.setState({ count: 1 }, () => {...});        │  │
  │  │  // → return undefined (giữ nguyên!)            │  │
  │  │                                                  │  │
  │  │  Nếu KHÔNG CÓ callback:                         │  │
  │  │  this.setState({ count: 1 })                     │  │
  │  │      .then(() => {                               │  │
  │  │          // state đã update!                     │  │
  │  │          console.log(this.state.count); // 1     │  │
  │  │      });                                         │  │
  │  │  // → return Promise! ✅                        │  │
  │  │                                                  │  │
  │  │  ⭐ BACKWARDS COMPATIBLE!                        │  │
  │  │  → Có callback → vẫn hoạt động như cũ!        │  │
  │  │  → Không callback → trả về Promise mới!       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.5. React Team TỪ CHỐI — Triết Lý Thiết Kế!

```
  TẠI SAO REACT TEAM TỪ CHỐI PROMISE setState?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  LÝ DO 1: ĐÃ CÓ GIẢI PHÁP TỐT HƠN!                │
  │  (sebmarkbage — Facebook engineer, React core dev)     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  "Có nhiều cách giải quyết vấn đề async mà     │  │
  │  │   không cần Promise!"                            │  │
  │  │                                                  │  │
  │  │  ① componentDidMount + componentDidUpdate:       │  │
  │  │     → Logic chạy SAU render = tự nhiên!        │  │
  │  │     → Phù hợp lifecycle React!                  │  │
  │  │                                                  │  │
  │  │  ② Refs callback:                               │  │
  │  │     → <input ref={el => el && el.focus()} />    │  │
  │  │     → Callback chạy khi DOM mount!              │  │
  │  │     → KHÔNG CẦN đợi setState!                  │  │
  │  │                                                  │  │
  │  │  → Tất cả đều THAY THẾ được Promise!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LÝ DO 2: BATCHING STRATEGY CÒN ĐANG THAY ĐỔI!     │
  │  (sebmarkbage — quote nổi tiếng!)                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  "Honestly, the current batching strategy comes  │  │
  │  │   with a set of problems right now. I'm          │  │
  │  │   hesitant to expand its API before we're sure   │  │
  │  │   that we're going to keep the current model."   │  │
  │  │                                                  │  │
  │  │  DỊCH:                                           │  │
  │  │  "Thành thật mà nói, chiến lược batching hiện   │  │
  │  │   tại đang gây ra hàng loạt vấn đề. Tôi ngại   │  │
  │  │   mở rộng API trước khi chắc chắn chúng tôi     │  │
  │  │   sẽ GIỮ NGUYÊN mô hình hiện tại."              │  │
  │  │                                                  │  │
  │  │  → Batching CÓ THỂ thay đổi trong tương lai!  │  │
  │  │  → Thêm Promise API bây giờ = THIỂN CẬN!      │  │
  │  │  → "Temporary escape" = giải pháp TẠM!        │  │
  │  │                                                  │  │
  │  │  ⭐ THỰC TẾ CHỨNG MINH:                         │  │
  │  │  → React 18+ đã thay đổi batching!             │  │
  │  │  → Automatic Batching (createRoot)!             │  │
  │  │  → Batching trong setTimeout, Promise, events!  │  │
  │  │  → sebmarkbage ĐÚNG khi ngại mở rộng API!      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LÝ DO 3: DAN ABRAMOV — componentDidUpdate ĐỦ RỒI! │
  │  (Dan Abramov — Creator of Redux!)                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  "In my experience, whenever I'm tempted to     │  │
  │  │   use setState callback, I can achieve the      │  │
  │  │   same by overriding componentDidUpdate          │  │
  │  │   (and/or componentDidMount)."                   │  │
  │  │                                                  │  │
  │  │  DỊCH:                                           │  │
  │  │  "Theo kinh nghiệm của tôi, bất kỳ khi nào    │  │
  │  │   tôi muốn dùng setState callback, tôi ĐỀU    │  │
  │  │   có thể đạt được bằng cách override            │  │
  │  │   componentDidUpdate (hoặc componentDidMount)."  │  │
  │  │                                                  │  │
  │  │  ⭐ TRIẾT LÝ:                                    │  │
  │  │  → ĐÃ CÓ lifecycle hooks = ĐỦ!                │  │
  │  │  → KHÔNG CẦN thêm Promise API!                 │  │
  │  │  → Giữ API SIMPLE!                              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LÝ DO 4: PROMISE KHÔNG PHÙ HỢP MỌI TRƯỜNG HỢP!   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  TRƯỜNG HỢP ĐẶC BIỆT:                          │  │
  │  │  → Cần xử lý SYNC TRƯỚC KHI DOM mount!        │  │
  │  │  → VD: tính toán layout trước paint!            │  │
  │  │                                                  │  │
  │  │  Promise = LUÔN ASYNC!                           │  │
  │  │  → Không thể dùng cho trường hợp sync!        │  │
  │  │  → .then() LUÔN chạy ở microtask TIẾP THEO!   │  │
  │  │  → Không thể block render!                     │  │
  │  │                                                  │  │
  │  │  Nếu setState hỗ trợ CẢ callback + Promise:    │  │
  │  │  → 2 cách làm CÙNG 1 việc = THỪA + CONFUSING! │  │
  │  │  → API surface tăng = khó maintain!             │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LÝ DO 5: HIỆU NĂNG!                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Nếu MỖI setState đều return Promise:            │  │
  │  │  → Tạo Promise object MỖI LẦN setState!       │  │
  │  │  → Callback (resolve) phải được LƯU TRỮ!      │  │
  │  │  → Trigger resolve ĐÚng thời điểm!            │  │
  │  │                                                  │  │
  │  │  setState được gọi RẤT NHIỀU LẦN:               │  │
  │  │  → 100 setState = 100 Promise objects!          │  │
  │  │  → Memory + GC pressure tăng!                   │  │
  │  │  → Overhead cho mỗi Promise lifecycle!          │  │
  │  │                                                  │  │
  │  │  So sánh: thư viện thứ 3 dùng Promise cho      │  │
  │  │  file I/O, network = ĐÚNG (thật sự async!)     │  │
  │  │  Nhưng setState? → In-memory state update!     │  │
  │  │  → Overhead Promise KHÔNG đáng!                │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.6. Anti-Pattern — Tự Wrap Promise Cho setState!

```
  "CỨNG ĐẦU" — TỰ LÀM PROMISE setState!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ⚠️ CẢNH BÁO: Đây là ANTI-PATTERN!                   │
  │  → React team KHÔNG khuyến khích!                     │
  │  → Nhưng HIỂU NÓ rất có giá trị! 🧠               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// ANTI-PATTERN 1: Dùng bluebird promisify!
// ═══════════════════════════════════════════════════════════

import Promise from "bluebird";

// Mixin — inject vào component!
export default {
  componentWillMount() {
    this.setStateAsync = Promise.promisify(this.setState);
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  bluebird.promisify BIẾN hàm callback-style
    //  → thành hàm return Promise!
    //
    //  setState(state, callback) → callback-style!
    //  promisify(setState) → return Promise!
  },
};

// Sử dụng:
this.setStateAsync({ loading: true })
  .then(this.loadSomething)
  .then((result) => {
    return this.setStateAsync({ result, loading: false });
  });
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  ĐẸP! Chain được! Không callback hell!
//  NHƯNG: dùng thư viện bên ngoài (bluebird)!
```

```javascript
// ═══════════════════════════════════════════════════════════
// ANTI-PATTERN 2: Tự viết Promise wrapper (KHÔNG thư viện!)
// ═══════════════════════════════════════════════════════════

function setStatePromise(that, newState) {
  return new Promise((resolve) => {
    that.setState(newState, () => {
      resolve();
      //  ^^^^^^^^
      //  Khi callback chạy (state đã update)
      //  → resolve Promise!
    });
  });
}
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  NGUYÊN LÝ:
//  → Wrap setState(state, callback) trong Promise!
//  → callback → resolve()!
//  → Developer .then() được!

// Sử dụng:
setStatePromise(this, { selected: input }).then(() => {
  this.props.didSelect(this.state.selected);
});
```

```javascript
// ═══════════════════════════════════════════════════════════
// ANTI-PATTERN 3: Async/Await — Đỉnh cao readability!
// ═══════════════════════════════════════════════════════════

// Helper:
function setStateAsync(component, newState) {
    return new Promise(resolve => {
        component.setState(newState, resolve);
        //                          ^^^^^^^
        //  resolve CHÍNH LÀ callback!
        //  → Khi React gọi callback → resolve()!
    });
}

// Sử dụng trong async method:
async handleEnterKey() {
    // B1: Tạo dòng mới!
    await setStateAsync(this, { selected: input });
    //^^^^^
    //  ĐẲNG cho đến khi state UPDATE XONG!

    // B2: Focus vào dòng mới (state đã update!)
    this.props.didSelect(this.state.selected);
    // → this.state.selected = GIÁ TRỊ MỚI! ✅
}
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  ĐỌC NHƯ sync code!
//  NHƯNG: "very dirty" — Dan Abramov 😅
```

```
  SO SÁNH 3 ANTI-PATTERNS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────┬────────────┬──────────┬────────┐ │
  │  │                 │ bluebird   │ Promise  │ async/ │ │
  │  │                 │ promisify  │ wrapper  │ await  │ │
  │  ├─────────────────┼────────────┼──────────┼────────┤ │
  │  │ Thư viện ngoài │ CẦN!       │ KHÔNG    │ KHÔNG  │ │
  │  │ Readability    │ Tốt        │ Tốt      │ TUYỆT! │ │
  │  │ LoC thêm       │ ~3 dòng    │ ~7 dòng  │ ~5 dòng│ │
  │  │ Recommend?     │ ❌ KHÔNG   │ ❌ KHÔNG │ ❌ KHÔNG│ │
  │  └─────────────────┴────────────┴──────────┴────────┘ │
  │                                                        │
  │  ⚠️ TẤT CẢ đều là ANTI-PATTERN!                      │
  │  → React team KHÔNG khuyến khích!                     │
  │  → Dùng lifecycle hooks hoặc functional setState!     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.7. Sơ Đồ Quyết Định — Khi Nào Dùng Gì?

```
  DECISION MIND MAP: setState Patterns!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  setState được gọi:                                    │
  │       │                                                │
  │       ├── Cần prevState? (cộng dồn nhiều lần?)        │
  │       │       │                                        │
  │       │       ├── CÓ → Functional setState!           │
  │       │       │    this.setState(prev => ({...}))       │
  │       │       │    ✅ GỌI NHIỀU LẦN = cộng dồn!     │
  │       │       │                                        │
  │       │       └── KHÔNG → Object setState!            │
  │       │            this.setState({key: value})          │
  │       │            ✅ Đơn giản! Merge auto!           │
  │       │                                                │
  │       ├── Cần thực hiện logic SAU update?              │
  │       │       │                                        │
  │       │       ├── Logic liên quan đến DOM?             │
  │       │       │       │                                │
  │       │       │       ├── CÓ → componentDidUpdate!    │
  │       │       │       │    componentDidUpdate() {       │
  │       │       │       │        // DOM đã update!       │
  │       │       │       │        this.doSomething();      │
  │       │       │       │    }                           │
  │       │       │       │    ✅ CÁCH TỐT NHẤT!         │
  │       │       │       │                                │
  │       │       │       └── KHÔNG → Callback (arg 2)!  │
  │       │       │            setState(state, callback)    │
  │       │       │            ⚠️ Tránh nest nhiều tầng!  │
  │       │       │                                        │
  │       │       └── Logic phức tạp? Nhiều steps?        │
  │       │               │                                │
  │       │               └── Hooks era (React 16.8+):    │
  │       │                    useEffect(() => {           │
  │       │                        // Chạy sau render!    │
  │       │                    }, [dependency]);            │
  │       │                    ✅ HIỆN ĐẠI NHẤT!         │
  │       │                                                │
  │       └── PROMISE setState? (Issue #2642)              │
  │               │                                        │
  │               └── ❌ KHÔNG DÙNG!                      │
  │                    → React team từ chối!              │
  │                    → Anti-pattern!                     │
  │                    → Performance overhead!             │
  │                    → Lifecycle hooks ĐỦ RỒI!         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  EVOLUTION: setState QUA CÁC PHIÊN BẢN REACT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React 0.x → 15:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  setState(object)              ← Cơ bản!        │  │
  │  │  setState(object, callback)    ← Tham số 2!     │  │
  │  │  setState(function)            ← prevState!     │  │
  │  │                                                  │  │
  │  │  Batching: CHỈ trong React event handlers!      │  │
  │  │  → setTimeout → KHÔNG batch!                   │  │
  │  │  → Promise.then → KHÔNG batch!                 │  │
  │  │  → fetch callback → KHÔNG batch!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │       │                                                │
  │       ▼                                               │
  │  React 16 (Fiber):                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Fiber architecture = có thể batch tốt hơn!  │  │
  │  │  → NHƯNG vẫn không batch ngoài React events!   │  │
  │  │  → unstable_batchedUpdates để force batch!      │  │
  │  └──────────────────────────────────────────────────┘  │
  │       │                                                │
  │       ▼                                               │
  │  React 16.8 (Hooks):                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  useState + useEffect THAY THẾ setState!        │  │
  │  │  const [count, setCount] = useState(0);          │  │
  │  │                                                  │  │
  │  │  useEffect(() => {                               │  │
  │  │      // Chạy SAU render! Thay componentDidUpdate!│  │
  │  │  }, [count]);                                    │  │
  │  │                                                  │  │
  │  │  → KHÔNG CẦN callback, Promise, hay override!  │  │
  │  │  → Declarative! Dependency array!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │       │                                                │
  │       ▼                                               │
  │  React 18 (Automatic Batching):                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ⭐ AUTOMATIC BATCHING!                          │  │
  │  │  → createRoot() → batch EVERYWHERE!             │  │
  │  │  → setTimeout → BATCH!                          │  │
  │  │  → Promise.then → BATCH!                        │  │
  │  │  → fetch callback → BATCH!                      │  │
  │  │  → Native events → BATCH!                       │  │
  │  │                                                  │  │
  │  │  sebmarkbage ĐÚNG!                               │  │
  │  │  → Batching strategy ĐÃ THAY ĐỔI!             │  │
  │  │  → Nếu đã thêm Promise API ở React 15...       │  │
  │  │  → Sẽ phải maintain code THỪA!                 │  │
  │  │  → Quyết định từ chối Issue #2642 = SÁNG SUỐT! │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 21.8. Takeaways — Triết Lý Thiết Kế React Team

```
  ⭐ TAKEAWAYS — setState Promise & React Design Philosophy:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. setState ASYNC vì BATCHING:                       │
  │     → Gộp nhiều update = 1 lần render!               │
  │     → Re-render TỐN HIỆU NĂNG!                     │
  │     → Async = tối ưu tự động!                        │
  │                                                        │
  │  2. 3 CÁCH GIẢI QUYẾT vấn đề async:                  │
  │     → ① Functional setState: prev => ({...})         │
  │     → ② Callback: setState(state, callback)          │
  │     → ③ Lifecycle: componentDidUpdate                │
  │     → (Modern: useEffect)                             │
  │                                                        │
  │  3. Issue #2642: setState return Promise?              │
  │     → ĐỀ XUẤT: giải callback hell bằng Promise!     │
  │     → KỸ THUẬT: Deferred pattern + promisify!        │
  │     → KẾT QUẢ: React team TỪ CHỐI! ❌               │
  │                                                        │
  │  4. TRIẾT LÝ: "Đừng mở rộng API vội vàng!"          │
  │     → sebmarkbage: batching CÒN ĐANG THAY ĐỔI!     │
  │     → Thêm Promise API = thiển cận!                   │
  │     → "Temporary escape" = giải pháp TẠM!           │
  │     → THỰC TẾ: React 18 thay đổi batching! 💯       │
  │                                                        │
  │  5. Dan Abramov: "componentDidUpdate ĐỦ RỒI!"       │
  │     → Lifecycle hooks = giải pháp tự nhiên!          │
  │     → KHÔNG cần thêm Promise!                        │
  │     → Giữ API SIMPLE = tốt hơn!                     │
  │                                                        │
  │  6. Promise = LUÔN ASYNC!                              │
  │     → Không thể dùng cho trường hợp sync!           │
  │     → .then() = microtask TIẾP THEO!                 │
  │     → Callback linh hoạt hơn (sync possible!)        │
  │                                                        │
  │  7. HIỆU NĂNG: mỗi Promise = overhead!               │
  │     → 100 setState = 100 Promise objects!             │
  │     → Memory + GC pressure!                           │
  │     → setState = in-memory, KHÔNG cần Promise!       │
  │                                                        │
  │  8. ANTI-PATTERN tồn tại nhưng KHÔNG NÊN dùng:       │
  │     → bluebird.promisify(setState)                    │
  │     → new Promise(resolve => setState(s, resolve))   │
  │     → async/await wrapper                             │
  │     → "Very dirty" — cộng đồng React! 😅            │
  │                                                        │
  │  9. BÀI HỌC thiết kế API:                            │
  │     → KHÔNG thêm feature chỉ vì "trendy"!           │
  │     → Xem xét TƯƠNG LAI (batching sẽ thay đổi?)     │
  │     → ĐÃ CÓ giải pháp → KHÔNG thêm cách mới!      │
  │     → API surface nhỏ = dễ maintain + ít bugs!       │
  │                                                        │
  │  10. MODERN REACT (Hooks) giải quyết TẤT CẢ:        │
  │     → useState thay setState!                         │
  │     → useEffect thay componentDidUpdate!              │
  │     → Dependency array thay callback!                 │
  │     → Không cần Promise, callback, hay lifecycle!    │
  │     → React 18 Automatic Batching!                    │
  │     → Vấn đề Issue #2642 KHÔNG CÒN TỒN TẠI! ✨    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  🎯 Qua Issue #2642, ta học được:                     │
  │                                                        │
  │  ① React team KHÔNG THÊM feature một cách bốc đồng! │
  │  ② Họ nghĩ về TƯƠNG LAI của architecture!            │
  │  ③ API nhỏ gọn > API phình to!                       │
  │  ④ Đã có giải pháp → KHÔNG thêm cách mới!          │
  │  ⑤ Thực tế chứng minh: React 18 Automatic Batching  │
  │     → Nếu thêm Promise API ở React 15 = legacy code! │
  │                                                        │
  │  → ĐỌC REACT ISSUES = HIỂU TRIẾT LÝ THIẾT KẾ!     │
  │  → Không chỉ DÙNG React, mà HIỂU TẠI SAO! 🧠      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §22. Thiết Kế Ứng Dụng React — Ứng Dụng Thông Minh Currying

```
═══════════════════════════════════════════════════════════════
  CHUYÊN ĐỀ: CURRYING TRONG REACT!
  → Không chỉ connect() của Redux!
  → Ứng dụng thực tế: E-commerce Filter Component!
  → Từ code THỪA → code TINH GỌN với Currying!
  → Component Design + Data Flow + Functional Programming!
  → Tự viết tay TOÀN BỘ, không thư viện!
═══════════════════════════════════════════════════════════════
```

### 22.1. Giới Thiệu Bài Toán — E-commerce Filter

```
  BÀI TOÁN: Trang bán thực phẩm online!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────┬───────────────────────────────┐   │
  │  │   BỘ LỌC (trái) │   SẢN PHẨM (phải)            │   │
  │  │                 │                               │   │
  │  │  ┌───────────┐  │  ┌─────┐ ┌─────┐ ┌─────┐    │   │
  │  │  │ Giá       │  │  │ 🍎  │ │ 🍕  │ │ 🧁  │    │   │
  │  │  │ 50-100k   │  │  │ Táo │ │Pizza│ │ Cake│    │   │
  │  │  │ 100-200k  │  │  │ 50k │ │120k │ │ 80k │    │   │
  │  │  └───────────┘  │  └─────┘ └─────┘ └─────┘    │   │
  │  │                 │                               │   │
  │  │  ┌───────────┐  │  ┌─────┐ ┌─────┐ ┌─────┐    │   │
  │  │  │ Năm SX    │  │  │ 🥤  │ │ 🍰  │ │ 🍩  │    │   │
  │  │  │ 2024      │  │  │Juice│ │ Pie │ │Donut│    │   │
  │  │  │ 2025      │  │  │ 35k │ │ 95k │ │ 45k │    │   │
  │  │  └───────────┘  │  └─────┘ └─────┘ └─────┘    │   │
  │  │                 │                               │   │
  │  │  ┌───────────┐  │                               │   │
  │  │  │ Thương hiệu│  │                               │   │
  │  │  │ Brand A   │  │                               │   │
  │  │  │ Brand B   │  │                               │   │
  │  │  └───────────┘  │                               │   │
  │  │                 │                               │   │
  │  └─────────────────┴───────────────────────────────┘   │
  │                                                        │
  │  CHỨC NĂNG:                                            │
  │  → User chọn bộ lọc bên TRÁI!                       │
  │  → Sản phẩm bên PHẢI cập nhật theo bộ lọc!         │
  │  → 3 loại filter: Giá, Năm SX, Thương hiệu!        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.2. Phân Tách Component — Tư Duy React

```
  COMPONENT DESIGN: Phân tách theo UX!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React = COMPONENT-BASED!                              │
  │  → Bước 1: Nhìn UI → tách thành components!         │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │               <Products>                         │  │
  │  │  ┌─────────────────┬────────────────────────┐    │  │
  │  │  │    <Filters>    │   <ProductResults />   │    │  │
  │  │  │                 │                        │    │  │
  │  │  │ <PriceFilter/>  │   Hiển thị sản phẩm   │    │  │
  │  │  │ <AgeFilter/>    │   theo bộ lọc          │    │  │
  │  │  │ <BrandFilter/>  │                        │    │  │
  │  │  │                 │                        │    │  │
  │  │  └─────────────────┴────────────────────────┘    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÂY COMPONENT:                                       │
  │                                                        │
  │       Products (STATE: filterSelections)                │
  │       ├── Filters (nhận props + handler)               │
  │       │   ├── PriceFilter (giá)                        │
  │       │   ├── AgeFilter (năm sản xuất)                 │
  │       │   └── BrandFilter (thương hiệu)                │
  │       └── ProductResults (nhận filterSelections)        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```jsx
// CODE TƯƠNG ỨNG:
<Products>
  <Filters>
    <PriceFilter />
    <AgeFilter />
    <BrandFilter />
  </Filters>
  <ProductResults />
</Products>
```

### 22.3. Application State — Dữ Liệu Bộ Lọc

```
  STATE DESIGN: filterSelections!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  filterSelections = {                                   │
  │      price: ...,    ← Khoảng giá đã chọn!            │
  │      ages: ...,     ← Năm sản xuất đã chọn!          │
  │      brands: ...,   ← Thương hiệu đã chọn!           │
  │  }                                                     │
  │                                                        │
  │  STATE NẰM Ở ĐÂU?                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Products ← ĐÂY! (Parent chung!)               │  │
  │  │  ├── Filters → CẦN filterSelections!           │  │
  │  │  └── ProductResults → CẦN filterSelections!    │  │
  │  │                                                  │  │
  │  │  → Cả 2 child đều cần → đặt ở PARENT!        │  │
  │  │  → Đây là nguyên tắc "LIFTING STATE UP"!      │  │
  │  │  → State CHUNG → đặt ở ancestor gần nhất!    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  DATA FLOW:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │   Products                                       │  │
  │  │   state: { filterSelections }                    │  │
  │  │      │                                           │  │
  │  │      ├──→ Filters                                │  │
  │  │      │    props: filterSelections (ĐỌC)         │  │
  │  │      │    props: selectionsChanged (GHI!)        │  │
  │  │      │    │                                      │  │
  │  │      │    ├──→ PriceFilter  (price + handler)    │  │
  │  │      │    ├──→ AgeFilter    (ages + handler)     │  │
  │  │      │    └──→ BrandFilter  (brands + handler)   │  │
  │  │      │                                           │  │
  │  │      └──→ ProductResults                         │  │
  │  │           props: filterSelections (ĐỌC)         │  │
  │  │                                                  │  │
  │  │  → ONE-WAY DATA FLOW!                           │  │
  │  │  → State chảy XUỐNG qua props!                 │  │
  │  │  → Update NGƯỢC LÊN qua handler function!     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.4. Cách Hiện Thực "Thông Thường" — VẤN ĐỀ!

```javascript
// ═══════════════════════════════════════════════════════════
// PRODUCTS COMPONENT — Parent giữ state!
// ═══════════════════════════════════════════════════════════

class Products extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filterSelections: {
                price: null,   // Khoảng giá!
                ages: [],      // Các năm SX đã chọn!
                brands: [],    // Các thương hiệu đã chọn!
            }
        };
    }

    // Handler để UPDATE bộ lọc!
    updateFilters = (newSelections) => {
        this.setState({
            filterSelections: newSelections
        });
    };
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  Nhận TOÀN BỘ filterSelections mới!
    //  → Thay thế state cũ!

    render() {
        return (
            <div>
                <Filters
                    filterSelections={this.state.filterSelections}
                    selectionsChanged={this.updateFilters}
                    {/*                 ^^^^^^^^^^^^^^^^^^^ */}
                    {/*  Truyền handler XUỐNG cho Filters! */}
                />
                <ProductResults
                    filterSelections={this.state.filterSelections}
                />
            </div>
        );
    }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// FILTERS COMPONENT — Cách "thông thường" (CHƯA currying!)
// ═══════════════════════════════════════════════════════════

class Filters extends React.Component {
  // Handler 1: Price!
  updatePriceFilter = (newValue) => {
    this.props.selectionsChanged({
      ...this.props.filterSelections,
      price: newValue,
      //^^^^^ CHỈ thay đổi price!
    });
  };

  // Handler 2: Ages!
  updateAgeFilter = (newValue) => {
    this.props.selectionsChanged({
      ...this.props.filterSelections,
      ages: newValue,
      //^^^^ CHỈ thay đổi ages!
    });
  };

  // Handler 3: Brands!
  updateBrandFilter = (newValue) => {
    this.props.selectionsChanged({
      ...this.props.filterSelections,
      brands: newValue,
      //^^^^^^ CHỈ thay đổi brands!
    });
  };

  render() {
    return (
      <div>
        <PriceFilter
          price={this.props.filterSelections.price}
          priceChanged={this.updatePriceFilter}
        />
        <AgeFilter
          ages={this.props.filterSelections.ages}
          agesChanged={this.updateAgeFilter}
        />
        <BrandFilter
          brands={this.props.filterSelections.brands}
          brandsChanged={this.updateBrandFilter}
        />
      </div>
    );
  }
}
```

```
  PHÂN TÍCH VẤN ĐỀ CỦA CÁCH "THÔNG THƯỜNG":
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  3 hàm handler GẦN NHƯ GIỐNG HỆT NHAU:              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  updatePriceFilter = (newValue) => {              │  │
  │  │      ...this.props.filterSelections,              │  │
  │  │      price: newValue  ← CHỈ KHÁC TÊN FIELD!    │  │
  │  │  };                                              │  │
  │  │                                                  │  │
  │  │  updateAgeFilter = (newValue) => {                │  │
  │  │      ...this.props.filterSelections,              │  │
  │  │      ages: newValue   ← CHỈ KHÁC TÊN FIELD!    │  │
  │  │  };                                              │  │
  │  │                                                  │  │
  │  │  updateBrandFilter = (newValue) => {              │  │
  │  │      ...this.props.filterSelections,              │  │
  │  │      brands: newValue ← CHỈ KHÁC TÊN FIELD!    │  │
  │  │  };                                              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ VẤN ĐỀ:                                          │
  │  ① CODE LẶP LẠI! 3 hàm logic gần giống nhau!       │
  │  ② Chỉ KHÁC tên field: price / ages / brands!        │
  │  ③ Nếu thêm filter MỚI (VD: color, size, origin):   │
  │     → Phải viết THÊM 3 hàm "song sinh" nữa!        │
  │     → 6 filter = 6 hàm handler!                      │
  │     → 10 filter = 10 hàm handler! 😱                │
  │  ④ Vi phạm nguyên tắc DRY (Don't Repeat Yourself)!  │
  │  ⑤ KHÔNG SCALABLE!                                   │
  │                                                        │
  │  → CẦN giải pháp THANH LỊCH hơn!                   │
  │  → CURRYING! 🎯                                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.5. Currying Là Gì? — Nền Tảng Lý Thuyết

```
  CURRYING — KHÁI NIỆM CỐT LÕI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ĐỊNH NGHĨA:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Currying = BIẾN ĐỔI hàm f thành f'            │  │
  │  │  → f' nhận MỘT PHẦN tham số của f             │  │
  │  │  → f' TRẢ VỀ hàm f'' mới                      │  │
  │  │  → f'' nhận PHẦN CÒN LẠI tham số              │  │
  │  │  → f'' trả về KẾT QUẢ cuối cùng               │  │
  │  │                                                  │  │
  │  │  f(a, b, c) → f'(a)(b)(c)                       │  │
  │  │  ^^^^^^^^^    ^^^^^^^^^^^^                       │  │
  │  │  Nhiều tham    Từng tham số                      │  │
  │  │  số 1 lần!    1 lần!                             │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// VÍ DỤ ĐƠN GIẢN: Hàm cộng!
// ═══════════════════════════════════════════════════════════

// TRƯỚC currying — hàm bình thường:
const add = (x, y) => x + y;
add(1, 2); // → 3
//  ^^^^
//  Truyền CẢ 2 tham số CÙNG LÚC!

// ─────────────────────────────────────────────────────────

// SAU currying — hàm curried:
const curriedAdd = (x) => {
  return (y) => {
    return x + y;
  };
};
//  ^^^^^^^^^^^^^^^^^^^
//  Hàm NGOÀI: nhận x!
//  Hàm TRONG: nhận y! (closure giữ x!)
//  → Trả về x + y!

curriedAdd(1)(2); // → 3
//         ^  ^
//         │  └── Bước 2: truyền y = 2!
//         └── Bước 1: truyền x = 1! (trả về hàm mới!)
```

```javascript
// ═══════════════════════════════════════════════════════════
// RÚT GỌN với arrow function:
// ═══════════════════════════════════════════════════════════

const curriedAdd = (x) => (y) => x + y;
//                  ^      ^     ^^^^^
//                  │      │     Body!
//                  │      └── Tham số thứ 2!
//                  └── Tham số thứ 1!

// ĐÂY CHÍNH LÀ SỨC MẠNH CỦA ARROW FUNCTION!
// → Currying trở nên CỰC KỲ ngắn gọn!
```

```
  PARTIAL APPLICATION — ỨNG DỤNG TỪNG PHẦN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  const addOne = curriedAdd(1);                         │
  │  //    ^^^^^^                                          │
  │  //    "Partial Application"!                          │
  │  //    → Đã "điền" x = 1!                            │
  │  //    → TRẢ VỀ HÀM MỚI chờ y!                     │
  │  //    → addOne = (y) => 1 + y                       │
  │                                                        │
  │  addOne(2);  // → 3                                   │
  │  addOne(5);  // → 6                                   │
  │  addOne(10); // → 11                                  │
  │                                                        │
  │  SƠ ĐỒ:                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  curriedAdd(1)                                   │  │
  │  │       │                                          │  │
  │  │       ▼                                         │  │
  │  │  addOne = (y) => 1 + y   ← Partial Application!│  │
  │  │       │                                          │  │
  │  │       ├── addOne(2) → 3                         │  │
  │  │       ├── addOne(5) → 6                         │  │
  │  │       └── addOne(10) → 11                       │  │
  │  │                                                  │  │
  │  │  "Currying a regular function lets us perform    │  │
  │  │   partial application on it."                    │  │
  │  │                                                  │  │
  │  │  Currying = cho phép "ĐIỀN TRƯỚC" 1 phần        │  │
  │  │  tham số → tạo hàm MỚI chuyên biệt hơn!      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.6. Áp Dụng Currying Vào Bài Toán Filter — Giải Pháp Thanh Lịch!

```javascript
// ═══════════════════════════════════════════════════════════
// CURRIED updateSelections — 1 HÀM thay 3!
// ═══════════════════════════════════════════════════════════

// TRƯỚC: 3 hàm lặp lại!
// updatePriceFilter = (newValue) => { ... price: newValue }
// updateAgeFilter   = (newValue) => { ... ages: newValue }
// updateBrandFilter = (newValue) => { ... brands: newValue }

// SAU CURRYING: CHỈ 1 HÀM!
updateSelections = (selectionType) => {
  return (newValue) => {
    this.props.selectionsChanged({
      ...this.props.filterSelections,
      [selectionType]: newValue,
      //^^^^^^^^^^^^^^
      //  ES6 Computed Property Names!
      //  → [selectionType] = dùng BIẾN làm tên key!
      //  → 'price' → { price: newValue }
      //  → 'ages'  → { ages: newValue }
      //  → 'brands' → { brands: newValue }
    });
  };
};
```

```javascript
// ═══════════════════════════════════════════════════════════
// RÚT GỌN với arrow function:
// ═══════════════════════════════════════════════════════════

updateSelections = (selectionType) => (newValue) => {
  this.props.selectionsChanged({
    ...this.props.filterSelections,
    [selectionType]: newValue,
  });
};
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  TỪ 3 HÀM → 1 HÀM!
//  TỪ ~20 dòng → ~5 dòng!
//  SẠCH, GỌN, SCALABLE!
```

```
  PARTIAL APPLICATION TRONG THỰC TẾ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  updateSelections('price')                              │
  │       │                                                │
  │       ▼                                               │
  │  (newValue) => {                                       │
  │      selectionsChanged({                                │
  │          ...filterSelections,                            │
  │          price: newValue  ← selectionType = 'price'!  │
  │      });                                                │
  │  }                                                     │
  │  → Hàm CHUYÊN cho PriceFilter!                       │
  │                                                        │
  │  updateSelections('ages')                               │
  │       │                                                │
  │       ▼                                               │
  │  (newValue) => {                                       │
  │      selectionsChanged({                                │
  │          ...filterSelections,                            │
  │          ages: newValue   ← selectionType = 'ages'!   │
  │      });                                                │
  │  }                                                     │
  │  → Hàm CHUYÊN cho AgeFilter!                         │
  │                                                        │
  │  updateSelections('brands')                             │
  │       │                                                │
  │       ▼                                               │
  │  (newValue) => {                                       │
  │      selectionsChanged({                                │
  │          ...filterSelections,                            │
  │          brands: newValue ← selectionType = 'brands'! │
  │      });                                                │
  │  }                                                     │
  │  → Hàm CHUYÊN cho BrandFilter!                       │
  │                                                        │
  │  ⭐ CÙNG 1 HÀM gốc, TẠO 3 hàm CHUYÊN BIỆT!        │
  │  → Partial Application = "điền trước" selectionType! │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// FILTERS COMPONENT HOÀN CHỈNH — VỚI CURRYING!
// ═══════════════════════════════════════════════════════════

class Filters extends React.Component {

    // CHỈ 1 HÀM duy nhất — curried!
    updateSelections = (selectionType) => {
        return (newValue) => {
            this.props.selectionsChanged({
                ...this.props.filterSelections,
                [selectionType]: newValue,
            });
        };
    };

    render() {
        return (
            <div>
                <PriceFilter
                    price={this.props.filterSelections.price}
                    priceChanged={this.updateSelections('price')}
                    {/*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
                    {/*  Partial Application! */}
                    {/*  → Trả về hàm (newValue) => {...price: newValue} */}
                />
                <AgeFilter
                    ages={this.props.filterSelections.ages}
                    agesChanged={this.updateSelections('ages')}
                    {/*         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
                    {/*  Partial Application! */}
                    {/*  → Trả về hàm (newValue) => {...ages: newValue} */}
                />
                <BrandFilter
                    brands={this.props.filterSelections.brands}
                    brandsChanged={this.updateSelections('brands')}
                    {/*           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
                    {/*  Partial Application! */}
                    {/*  → Trả về hàm (newValue) => {...brands: newValue} */}
                />
            </div>
        );
    }
}

// ═══════════════════════════════════════════════════════════
// LỢI ÍCH:
// → Thêm filter mới? VD: <ColorFilter />?
//   priceChanged={this.updateSelections('color')}
//   → CHỈ THÊM 1 DÒNG! Không cần viết hàm mới!
// → 10 filter = VẪN CHỈ 1 HÀM updateSelections!
// → SCALABLE! DRY! ELEGANT!
// ═══════════════════════════════════════════════════════════
```

### 22.7. So Sánh: Uncurried Version — Inline Arrow Function

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 2 (KHÔNG currying): Dùng inline arrow trong render!
// ═══════════════════════════════════════════════════════════

class Filters extends React.Component {

    // Hàm UNCURRIED — nhận 2 tham số cùng lúc!
    updateSelections = (selectionType, newValue) => {
        this.props.selectionsChanged({
            ...this.props.filterSelections,
            [selectionType]: newValue,
        });
    };
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  Nhận CẢ 2 tham số: selectionType + newValue!
    //  → Cần gọi với ĐẦY ĐỦ 2 params!

    render() {
        return (
            <div>
                <PriceFilter
                    price={this.props.filterSelections.price}
                    priceChanged={(value) => this.updateSelections('price', value)}
                    {/*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
                    {/*  Inline arrow function! */}
                    {/*  → Tạo HÀM MỚI mỗi lần render! */}
                />
                <AgeFilter
                    ages={this.props.filterSelections.ages}
                    agesChanged={(value) => this.updateSelections('ages', value)}
                />
                <BrandFilter
                    brands={this.props.filterSelections.brands}
                    brandsChanged={(value) => this.updateSelections('brands', value)}
                />
            </div>
        );
    }
}
```

```
  SO SÁNH 3 CÁCH TIẾP CẬN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────┬──────────────┬──────────────────┐   │
  │  │   Tiêu chí   │  Currying    │ Inline Arrow     │   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Số hàm       │ 1 hàm       │ 1 hàm            │   │
  │  │ handler      │ curried     │ uncurried         │   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Trong        │ updateSelect│ (value) =>        │   │
  │  │ render()     │ ions('price')│ update('price',  │   │
  │  │              │ ← gọi 1 lần│  value)           │   │
  │  │              │             │ ← arrow mỗi lần!│   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Hàm mới      │ TẠO 1 LẦN  │ TẠO MỖI RENDER! │   │
  │  │ mỗi render?  │ ✅ KHÔNG!   │ ⚠️ CÓ!          │   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Performance  │ TỐT hơn     │ KÉM hơn          │   │
  │  │              │ (ít GC)     │ (nhiều GC)        │   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Coupling     │ THẤP!       │ TRUNG BÌNH!       │   │
  │  │              │ Child không │ Child cần biết    │   │
  │  │              │ biết field  │ cách gọi handler  │   │
  │  │              │ name!       │ với đúng params!  │   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Readability  │ ⭐ Sạch     │ OK nhưng dài     │   │
  │  ├──────────────┼──────────────┼──────────────────┤   │
  │  │ Scalability  │ ⭐⭐⭐     │ ⭐⭐             │   │
  │  └──────────────┴──────────────┴──────────────────┘   │
  │                                                        │
  │  ⚠️ VẤN ĐỀ CỦA INLINE ARROW FUNCTION:               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // Mỗi lần Filters render:                      │  │
  │  │  priceChanged={(value) => this.updateSelections(  │  │
  │  │      'price', value                               │  │
  │  │  )}                                               │  │
  │  │                                                  │  │
  │  │  → Tạo HÀM MỚI mỗi lần render!                │  │
  │  │  → PriceFilter nhận REFERENCE MỚI!              │  │
  │  │  → PriceFilter luôn RE-RENDER (nếu dùng PureC)!│  │
  │  │  → Garbage Collector phải thu hàm cũ!           │  │
  │  │                                                  │  │
  │  │  VỚI CURRYING:                                   │  │
  │  │  priceChanged={this.updateSelections('price')}    │  │
  │  │                                                  │  │
  │  │  → CŨNG tạo hàm mới mỗi render!               │  │
  │  │  → Nhưng code SẠCH hơn, DỄ ĐỌC hơn!          │  │
  │  │  → Ý ĐỊNH rõ ràng hơn (Partial Application!)   │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  💡 THỰC TẾ: Cả 2 cách đều tạo hàm mới mỗi render!│
  │  → Nhưng currying EXPRESS Ý ĐỊNH tốt hơn!           │
  │  → Code DECLARATIVE hơn!                              │
  │  → Trong trường hợp cần optimize:                    │
  │     → useMemo / useCallback (Hooks)!                 │
  │     → Hoặc bind trong constructor (Class)!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.8. Deep Dive — ES6 Computed Property Names

```javascript
// ═══════════════════════════════════════════════════════════
// ES6 COMPUTED PROPERTY NAMES — Chìa khóa của currying!
// ═══════════════════════════════════════════════════════════

// ① TRƯỚC ES6 — cần tạo object rồi gán:
var key = "price";
var obj = {};
obj[key] = 100;
// obj = { price: 100 }

// ② SAU ES6 — Computed Property Names:
const key = "price";
const obj = { [key]: 100 };
// obj = { price: 100 }
//        ^^^^^
//        [key] = dùng BIẾN làm tên property!
```

```
  COMPUTED PROPERTY NAMES — GIẢI THÍCH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  const field = 'price';                                │
  │                                                        │
  │  // KHÔNG có dấu ngoặc vuông:                         │
  │  { field: 100 }                                        │
  │  // ↑ key = "field" (literal string!)                 │
  │  // → { field: 100 } ← KHÔNG PHẢI "price"!          │
  │                                                        │
  │  // CÓ dấu ngoặc vuông []:                           │
  │  { [field]: 100 }                                      │
  │  // ↑ key = giá trị của biến field = "price"!        │
  │  // → { price: 100 } ← ĐÚNG!                        │
  │                                                        │
  │  ĐÂY LÀ LÝ DO CURRYING HOẠT ĐỘNG:                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  updateSelections = (selectionType) => (val) => { │  │
  │  │      ...filterSelections,                         │  │
  │  │      [selectionType]: val,                        │  │
  │  │      //^^^^^^^^^^^^^^^                            │  │
  │  │      // selectionType = 'price'                   │  │
  │  │      // → { price: val }                         │  │
  │  │      // selectionType = 'ages'                    │  │
  │  │      // → { ages: val }                          │  │
  │  │      // selectionType = 'brands'                  │  │
  │  │      // → { brands: val }                        │  │
  │  │  };                                               │  │
  │  │                                                  │  │
  │  │  → 1 HÀM xử lý DYNAMIC KEY!                    │  │
  │  │  → Không cần hardcode field name!                │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.9. Tự Viết Utility — Generic Curry Function

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT generic curry — không thư viện!
// ═══════════════════════════════════════════════════════════

// CÁCH 1: Curry đơn giản (2 tham số)
function curry(fn) {
  return function (firstArg) {
    return function (secondArg) {
      return fn(firstArg, secondArg);
    };
  };
}

// VÍ DỤ sử dụng:
const add = (x, y) => x + y;
const curriedAdd = curry(add);
curriedAdd(1)(2); // → 3!

// CÁCH 2: Curry GENERIC (N tham số!)
function genericCurry(fn) {
  // fn.length = số tham số mà fn khai báo!
  const arity = fn.length;

  return function curried(...args) {
    // Nếu ĐỦ tham số → gọi fn!
    if (args.length >= arity) {
      return fn(...args);
    }
    // Nếu CHƯA ĐỦ → trả về hàm chờ thêm!
    return function (...moreArgs) {
      return curried(...args, ...moreArgs);
    };
  };
}

// VÍ DỤ:
const add3 = (a, b, c) => a + b + c;
const curriedAdd3 = genericCurry(add3);

curriedAdd3(1)(2)(3); // → 6!
curriedAdd3(1, 2)(3); // → 6!
curriedAdd3(1)(2, 3); // → 6!
curriedAdd3(1, 2, 3); // → 6!
// → TẤT CẢ đều hoạt động!
```

```
  GENERIC CURRY — SƠ ĐỒ HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  genericCurry(add3)  // add3 cần 3 tham số!           │
  │       │                                                │
  │       ▼                                               │
  │  curried = (...args) => {                              │
  │      if (args.length >= 3) return add3(...args);       │
  │      return (...moreArgs) => curried(...args, ...more);│
  │  }                                                     │
  │                                                        │
  │  FLOW: curriedAdd3(1)(2)(3)                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Step 1: curried(1)                               │  │
  │  │    args = [1], length = 1 < 3                     │  │
  │  │    → Trả về (...more) => curried(1, ...more)    │  │
  │  │                                                  │  │
  │  │  Step 2: curried(1, 2)                            │  │
  │  │    args = [1, 2], length = 2 < 3                  │  │
  │  │    → Trả về (...more) => curried(1, 2, ...more) │  │
  │  │                                                  │  │
  │  │  Step 3: curried(1, 2, 3)                         │  │
  │  │    args = [1, 2, 3], length = 3 >= 3              │  │
  │  │    → GỌI add3(1, 2, 3) → 6! ✅                  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  fn.length — SỐ THAM SỐ CỦA HÀM:                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ((a, b) => a + b).length         // → 2        │  │
  │  │  ((a, b, c) => a + b + c).length  // → 3        │  │
  │  │  ((...args) => args).length       // → 0 (rest!)│  │
  │  │  ((a, b = 1) => a + b).length     // → 1 (def!) │  │
  │  │                                                  │  │
  │  │  ⚠️ Rest params và default params                │  │
  │  │     KHÔNG được tính vào length!                  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.10. Áp Dụng Generic Curry Vào React Filter

```javascript
// ═══════════════════════════════════════════════════════════
// ĐƯA GENERIC CURRY VÀO THỰC TẾ:
// ═══════════════════════════════════════════════════════════

// Utility curry function (tự viết, không thư viện!)
function curry(fn) {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}

// ──────────────────────────────────────────────────────────

// Hàm updateFilter THƯỜNG (uncurried):
function updateFilter(
  selectionsChanged,
  filterSelections,
  selectionType,
  newValue,
) {
  selectionsChanged({
    ...filterSelections,
    [selectionType]: newValue,
  });
}

// Curry nó!
const curriedUpdateFilter = curry(updateFilter);

// ──────────────────────────────────────────────────────────

// Trong Filters component:
class Filters extends React.Component {
  render() {
    const { selectionsChanged, filterSelections } = this.props;

    // Partial Application — điền 2 params đầu!
    const updateFor = curriedUpdateFilter(selectionsChanged, filterSelections);
    //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // 4 params cần: selectionsChanged, filterSelections, selectionType, newValue
    // Đã điền 2  → còn 2: selectionType, newValue
    // updateFor = (selectionType, newValue) => { ... }

    // Partial Application tiếp — điền selectionType!
    const updatePrice = updateFor("price");
    const updateAges = updateFor("ages");
    const updateBrands = updateFor("brands");
    // Còn 1 param: newValue → chính là callback truyền cho child!

    return (
      <div>
        <PriceFilter
          price={filterSelections.price}
          priceChanged={updatePrice}
        />
        <AgeFilter ages={filterSelections.ages} agesChanged={updateAges} />
        <BrandFilter
          brands={filterSelections.brands}
          brandsChanged={updateBrands}
        />
      </div>
    );
  }
}
```

```
  FLOW CỦA GENERIC CURRY TRONG REACT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  updateFilter(a, b, c, d)  ← 4 params!               │
  │       │                                                │
  │       ▼ curry()                                       │
  │  curriedUpdateFilter                                   │
  │       │                                                │
  │       ▼ (selectionsChanged, filterSelections)         │
  │  updateFor ← còn 2 params (selectionType, newValue)  │
  │       │                                                │
  │       ├── ('price') → updatePrice  ← còn 1 (value) │
  │       ├── ('ages')  → updateAges   ← còn 1 (value) │
  │       └── ('brands')→ updateBrands ← còn 1 (value) │
  │                                                        │
  │  PriceFilter gọi: updatePrice(50000)                   │
  │  → updateFilter(selectionsChanged, filterSels,        │
  │                   'price', 50000)                       │
  │  → selectionsChanged({...filterSels, price: 50000})   │
  │                                                        │
  │  ⭐ Generic Curry = LINH HOẠT hơn!                    │
  │  → Có thể curry BẤT KỲ hàm nào!                    │
  │  → Không phụ thuộc vào class context!                │
  │  → Có thể tách ra thành utility riêng!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.11. Scalability — Thêm Filter Mới

```
  SCALABILITY: Thêm 3 filter mới!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TRƯỚC: 3 filter (price, ages, brands)                 │
  │  SAU: 6 filter (+color, size, origin)                  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CÁCH THÔNG THƯỜNG (không currying):             │  │
  │  │                                                  │  │
  │  │  updatePriceFilter  = (val) => {...price: val}   │  │
  │  │  updateAgeFilter    = (val) => {...ages: val}    │  │
  │  │  updateBrandFilter  = (val) => {...brands: val}  │  │
  │  │  updateColorFilter  = (val) => {...color: val}   │  │
  │  │  updateSizeFilter   = (val) => {...size: val}    │  │
  │  │  updateOriginFilter = (val) => {...origin: val}  │  │
  │  │  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^│
  │  │  6 HÀM! Logic gần GIỐNG HỆT NHAU! 😱           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                          VS                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CÁCH CURRYING:                                  │  │
  │  │                                                  │  │
  │  │  updateSelections = (type) => (val) => {          │  │
  │  │      ...filterSelections,                         │  │
  │  │      [type]: val,                                 │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  VẪN CHỈ 1 HÀM! Thêm bao nhiêu filter cũng OK!│  │
  │  │                                                  │  │
  │  │  priceChanged={this.updateSelections('price')}    │  │
  │  │  agesChanged={this.updateSelections('ages')}      │  │
  │  │  brandsChanged={this.updateSelections('brands')}  │  │
  │  │  colorChanged={this.updateSelections('color')}    │  │
  │  │  sizeChanged={this.updateSelections('size')}      │  │
  │  │  originChanged={this.updateSelections('origin')}  │  │
  │  │  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^│
  │  │  CHỈ THÊM DÒNG TRONG RENDER! ✅                 │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ĐỒ THỊ PHỨC TẠP KHI SCALE:                          │
  │                                                        │
  │  Số hàm handler                                        │
  │  │                                                     │
  │  │     Không currying                                  │
  │  │     /                                               │
  │  │    /                                                │
  │  10──/───────────────────────── ← 10 hàm riêng!     │
  │  │  /                                                  │
  │  │ /                                                   │
  │  5/───────────────────────────── ← 5 hàm riêng!     │
  │  │                                                     │
  │  │ ──────────────────────────── Currying: LUÔN 1!     │
  │  1/                                                    │
  │  └──────────────────────────────── Số filter          │
  │  3    5     10    15    20                              │
  │                                                        │
  │  → Currying = O(1) hàm handler!                      │
  │  → Không currying = O(n) hàm handler!                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 22.12. Modern React (Hooks) — Currying Vẫn Hữu Ích!

```javascript
// ═══════════════════════════════════════════════════════════
// CÙNG BÀI TOÁN — VỚI HOOKS!
// ═══════════════════════════════════════════════════════════

function Filters({ filterSelections, onSelectionsChanged }) {
  // Curried handler — GIỐNG HỆT logic class component!
  const updateSelections = (selectionType) => (newValue) => {
    onSelectionsChanged({
      ...filterSelections,
      [selectionType]: newValue,
    });
  };
  //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //  Currying KHÔNG phụ thuộc vào Class hay Hooks!
  //  → Pure JavaScript pattern!
  //  → Hoạt động ở MỌI NƠI!

  return (
    <div>
      <PriceFilter
        price={filterSelections.price}
        priceChanged={updateSelections("price")}
      />
      <AgeFilter
        ages={filterSelections.ages}
        agesChanged={updateSelections("ages")}
      />
      <BrandFilter
        brands={filterSelections.brands}
        brandsChanged={updateSelections("brands")}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VỚI useCallback ĐỂ OPTIMIZE:
// ═══════════════════════════════════════════════════════════

function Filters({ filterSelections, onSelectionsChanged }) {
  // useCallback + currying = BEST performance!
  const updateSelections = useCallback(
    (selectionType) => (newValue) => {
      onSelectionsChanged((prev) => ({
        ...prev,
        [selectionType]: newValue,
      }));
    },
    [onSelectionsChanged],
    // ↑ Chỉ tạo lại khi onSelectionsChanged thay đổi!
  );

  // ...render giống như trên!
}

// ═══════════════════════════════════════════════════════════
// LƯU Ý: useCallback wrap hàm NGOÀI (curried function)!
// → Hàm TRONG vẫn tạo mới mỗi lần gọi!
// → Nhưng updateSelections reference KHÔNG ĐỔI!
// → Child components có thể dùng React.memo hiệu quả!
// ═══════════════════════════════════════════════════════════
```

### 22.13. Takeaways — Currying Trong React

```
  ⭐ TAKEAWAYS — CURRYING & REACT DESIGN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① CURRYING = biến f(a, b) thành f(a)(b)!            │
  │     → Partial Application = "điền trước" 1 phần!    │
  │     → Tạo hàm CHUYÊN BIỆT từ hàm TỔNG QUÁT!       │
  │                                                        │
  │  ② Trong React: giảm CODE LẶP ở handler functions!  │
  │     → 10 filter ≠ 10 handler functions!              │
  │     → 10 filter = 1 curried handler! ✅              │
  │                                                        │
  │  ③ ES6 Computed Property Names là CHÌA KHÓA!         │
  │     → [selectionType]: newValue                       │
  │     → Biến tên field thành THAM SỐ ĐỘNG!            │
  │                                                        │
  │  ④ Currying giảm COUPLING giữa parent-child!         │
  │     → Child KHÔNG cần biết field name!                │
  │     → Child chỉ gọi handler(newValue)!                │
  │     → Parent "đã điền sẵn" field name!               │
  │                                                        │
  │  ⑤ Currying là FUNCTIONAL PROGRAMMING pattern!        │
  │     → Không phụ thuộc vào React!                      │
  │     → Không phụ thuộc vào Class/Hooks!                │
  │     → Hoạt động ở MỌI NƠI trong JavaScript!         │
  │                                                        │
  │  ⑥ Đừng chỉ biết connect() của Redux!               │
  │     → connect = currying: connect(mapState)(Comp)     │
  │     → Currying có THỂ áp dụng RỘNG hơn nhiều!       │
  │     → Event handlers, API calls, middleware!           │
  │                                                        │
  │  ⑦ Generic curry utility có thể TỰ VIẾT!             │
  │     → Dùng fn.length + recursion!                     │
  │     → Không cần lodash/ramda!                         │
  │     → Hiểu NGUYÊN LÝ = sáng tạo linh hoạt hơn!    │
  │                                                        │
  │  ⑧ SCALABILITY:                                       │
  │     → Không currying: O(n) handler functions!          │
  │     → Có currying: O(1) handler function!              │
  │     → Scale 3 → 30 filter: VẪN 1 HÀM!             │
  │                                                        │
  │  ⑨ KẾT HỢP với Hooks:                                │
  │     → useCallback + currying = performance tốt nhất!  │
  │     → React.memo + stable reference = tránh re-render!│
  │                                                        │
  │  ⑩ React + Functional Programming = SẠCH + MẠNH!     │
  │     → Currying, Composition, Higher-Order Functions!   │
  │     → HOC = Higher-Order Component = currying mindset!│
  │     → Hooks = composition mindset!                     │
  │     → Cả 2 đều từ FP!                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  MIND MAP: CURRYING TRONG REACT!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │          ┌─── Hàm cộng: add(x)(y) ──┐                │
  │          │                            │                │
  │     Lý thuyết                 Partial Application      │
  │          │                            │                │
  │  ┌───── CURRYING ──────────────────────┐               │
  │  │       │                              │              │
  │  │   React Filter    Generic Curry     ES6 Computed   │
  │  │   Scenario        Utility           Property Names │
  │  │       │                │                 │          │
  │  │   updateSelections  curry(fn)        [key]: val    │
  │  │   ('type')(val)     fn.length         Dynamic!     │
  │  │       │             recursion             │         │
  │  │       │                │                  │         │
  │  │   ┌───┴────────────────┴──────────────────┘         │
  │  │   │                                                 │
  │  │   ▼                                                │
  │  │   LỌAI BỎ CODE TRÙNG LẶP!                         │
  │  │   O(n) handlers → O(1) handler!                    │
  │  │        │                                            │
  │  │        ├── Class Component: this.updateSel('x')     │
  │  │        ├── Function Component: updateSel('x')       │
  │  │        └── useCallback: stable + curried!           │
  │  │                                                     │
  │  └─────────────────────────────────────────────────────┘
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §23. React Fiber Là Gì? — Engine Mới Của React!

```
═══════════════════════════════════════════════════════════════
  CHUYÊN ĐỀ: REACT FIBER!
  → Từ React cũ → React Fiber: tại sao cần engine MỚI?
  → Browser Main Thread & vấn đề SINGLE-THREADED!
  → Stack Reconciler → Fiber Reconciler!
  → Cooperative Multitasking + Task Priority!
  → Reconcile Phase (CÓ THỂ gián đoạn)!
  → Commit Phase (KHÔNG thể gián đoạn)!
  → Tự viết tay mô phỏng TOÀN BỘ, không thư viện!
═══════════════════════════════════════════════════════════════
```

### 23.1. Browser Main Thread — Vấn Đề Single-Threaded

```
  BROWSER RENDERING ENGINE — SINGLE THREADED!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Browser Main Thread = 1 LUỒNG DUY NHẤT!              │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │           MAIN THREAD (1 LUỒNG!)                 │  │
  │  │                                                  │  │
  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │  │
  │  │  │Parse │ │Parse │ │ JS   │ │Layout│ │Paint │ │  │
  │  │  │HTML  │ │CSS   │ │Exec  │ │      │ │      │ │  │
  │  │  │DOM   │ │CSSOM │ │      │ │      │ │      │ │  │
  │  │  │Tree  │ │Tree  │ │      │ │      │ │      │ │  │
  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │  │
  │  │     │        │        │        │        │       │  │
  │  │     ▼        ▼        ▼        ▼        ▼      │  │
  │  │  ──────────────────────────────────────────→    │  │
  │  │              TUẦN TỰ! 1 VIỆC 1 LÚC!           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ CHỈ CÓ NETWORK OPERATIONS chạy ở thread khác!   │
  │  → Mọi thứ khác: CÙNG 1 MAIN THREAD!                │
  │                                                        │
  │  HỆ QUẢ:                                              │
  │  ① Main thread chỉ làm 1 việc tại 1 thời điểm!     │
  │  ② Nếu JS chạy QUÁ LÂU → block mọi thứ khác!     │
  │  ③ User KHÔNG THỂ tương tác khi JS đang bận!       │
  │  ④ Trang web BỊ "đơ" (unresponsive)!                │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  DOM đơn giản? → OK, không thấy vấn đề!       │  │
  │  │  DOM PHỨC TẠP? → LAG, ĐỨNG, CRASH! 💥         │  │
  │  │  User tương tác nhiều? → Càng tệ hơn!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → React ra đời để GIẢI QUYẾT vấn đề DOM!          │
  │  → Nhưng bản thân React cũng gây ra vấn đề MỚI!   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.2. Virtual DOM & Diff — Ôn Lại Cách React Hoạt Động

```
  VIRTUAL DOM — LUỒNG HOẠT ĐỘNG CỦA REACT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Developer gọi setState({timesOfButtonClicked: 1})  │
  │                                                        │
  │  ② React tạo Virtual DOM MỚI:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Old VDOM              New VDOM                  │  │
  │  │  ┌──────┐              ┌──────┐                 │  │
  │  │  │ div  │              │ div  │                 │  │
  │  │  └──┬───┘              └──┬───┘                 │  │
  │  │     ├── input              ├── input              │  │
  │  │     ├── button             ├── button             │  │
  │  │     └── BlockList          └── BlockList          │  │
  │  │         ├── Block(0)           ├── Block(1) 🟡   │  │
  │  │         └── Block(0)           └── Block(1) 🟡   │  │
  │  │                                                  │  │
  │  │  🟡 = state đã thay đổi (0 → 1)!              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ React DIFF: so sánh Old vs New VDOM!               │
  │     → Tìm ra elements CẦN CẬP NHẬT!                │
  │     → Đưa vào UPDATE QUEUE!                          │
  │                                                        │
  │  ④ React duyệt update queue → cập nhật REAL DOM!     │
  │     → Browser recalculate DOM Tree!                    │
  │     → Browser repaint!                                 │
  │                                                        │
  │  BROWSER MAIN THREAD TRONG QUÁ TRÌNH NÀY:            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
  │  │  │     setState → Diff → Update DOM            │  │
  │  │  │     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^         │  │
  │  │  │     React chiếm TOÀN BỘ main thread!        │  │
  │  │  │                          │ Recalc │ Paint │  │  │
  │  │  │                          │  DOM   │       │  │  │
  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
  │  │                                                  │  │
  │  │  → Với DOM đơn giản: OK, nhanh!                │  │
  │  │  → Với DOM PHỨC TẠP: CHẬM! 😱                 │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUÁ TRÌNH CHIA THÀNH 2 GIAI ĐOẠN:                   │
  │                                                        │
  │  GIAI ĐOẠN 1: SCHEDULING (Lập lịch)                   │
  │  ├── Tạo Virtual DOM mới từ data mới!                 │
  │  ├── Duyệt toàn bộ Virtual DOM!                       │
  │  ├── Diff algorithm: tìm nodes cần update!            │
  │  └── Đưa vào update queue!                            │
  │                                                        │
  │  GIAI ĐOẠN 2: RENDERING (Hiển thị)                    │
  │  ├── Duyệt update queue!                               │
  │  ├── Cập nhật DOM tương ứng!                          │
  │  ├── Browser: update DOM elements!                      │
  │  └── (Hoặc: Native, VR, hardware...)                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.3. VẤN ĐỀ MỚI — Khi DOM Phức Tạp!

```
  VẤN ĐỀ: 100,000 ELEMENTS!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  DEMO CỤ THỂ:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │   const NUMBER_OF_BLOCK = 100000;                │  │
  │  │   //                       ^^^^^^                │  │
  │  │   // 100,000 block elements!                     │  │
  │  │   // Mô phỏng trang web PHỨC TẠP!              │  │
  │  │                                                  │  │
  │  │   ┌──────────────────────────────────┐           │  │
  │  │   │ [input____________]              │           │  │
  │  │   │ [  Click Me  ]                   │           │  │
  │  │   │ ┌────┐ ┌────┐ ┌────┐ ... 100000 │           │  │
  │  │   │ │ 0  │ │ 0  │ │ 0  │            │           │  │
  │  │   │ └────┘ └────┘ └────┘            │           │  │
  │  │   └──────────────────────────────────┘           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  KỊCH BẢN:                                            │
  │  ① Click button → setState → page bắt đầu update! │
  │  ② Click input → gõ "hireact"!                      │
  │  ③ ĐỢI... TRANG KHÔNG PHẢN HỒI! 😱                │
  │  ④ SAU 7 GIÂY → "hireact" đột nhiên xuất hiện!     │
  │     → BlockList cũng cập nhật thành 1!               │
  │                                                        │
  │  PERFORMANCE BREAKDOWN (7 giây!):                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ┌─ 0ms ─────────────── 7000ms ─────── 7850ms ─┐│  │
  │  │  │                                              ││  │
  │  │  │  ████████████████████████████████ │░░░│▓▓│   ││  │
  │  │  │  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^  ^^   ││  │
  │  │  │  VÀNG: JavaScript = 6330ms!       TÍM  XANH ││  │
  │  │  │  (React chiếm main thread!)       DOM  Paint ││  │
  │  │  │                                   635  28ms  ││  │
  │  │  │                                              ││  │
  │  │  └──────────────────────────────────────────────┘│  │
  │  │                                                  │  │
  │  │  TỔNG: 7061ms!                                   │  │
  │  │  ├── Scripting (JS):   6330ms (89.6%!) 🟡       │  │
  │  │  ├── Rendering (DOM):   635ms (9.0%)   🟣       │  │
  │  │  ├── Painting:           28ms (0.4%)   🟢       │  │
  │  │  ├── Other:              45ms           ⚪       │  │
  │  │  └── Idle:               23ms           ⬜       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  PHÂN TÍCH:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Rendering (635ms) + Painting (28ms):             │  │
  │  │  → Browser PHẢI làm! Không tránh được!          │  │
  │  │  → Recalculate DOM Tree + repaint = BẮT BUỘC!  │  │
  │  │                                                  │  │
  │  │  Scripting (6330ms):                              │  │
  │  │  → React CHIẾM main thread 6.3 GIÂY!           │  │
  │  │  → Trong 6.3s này: user KHÔNG thể tương tác!  │  │
  │  │  → Input không nhận ký tự!                      │  │
  │  │  → Button không click được!                     │  │
  │  │  → Scroll không hoạt động!                      │  │
  │  │  → Trang web "CHẾT"! 💀                        │  │
  │  │                                                  │  │
  │  │  ⚠️ VẤN ĐỀ CHÍNH: React chiếm main thread     │  │
  │  │     QUÁ LÂU! User không nhận được feedback!      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.4. Stack Reconciler — Nguyên Nhân Gốc Rễ!

```
  STACK RECONCILER — TẠI SAO CHẬM?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Stack Reconciler = CHIẾN LƯỢC CŨ của React!          │
  │                                                        │
  │  CÁCH HOẠT ĐỘNG: Giống FUNCTION CALL STACK!            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  updateComponent                                  │  │
  │  │  ▓▓                                              │  │
  │  │    ▓▓ A                                          │  │
  │  │       ▓▓                                         │  │
  │  │         ▓▓ input                                 │  │
  │  │              ▓▓                                   │  │
  │  │                ▓▓ button                          │  │
  │  │                     ▓▓                            │  │
  │  │                       ▓▓ BlockList                │  │
  │  │                            ▓▓                     │  │
  │  │                              ▓▓ Block             │  │
  │  │                                   ▓▓              │  │
  │  │                                     ▓▓ div        │  │
  │  │                                          ▓▓       │  │
  │  │                                            ▓▓ Blk2│  │
  │  │                                                 ▓▓│  │
  │  │  ─────────────────────────────────────────── →   │  │
  │  │            DEPTH-FIRST TRAVERSAL!                │  │
  │  │            KHÔNG THỂ DỪNG Ở GIỮA!              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ĐẶC ĐIỂM:                                           │
  │  ① Depth-First Traversal: duyệt SÂU trước!          │
  │  ② ĐỒNG BỘ: phải duyệt TOÀN BỘ Virtual DOM!       │
  │  ③ KHÔNG THỂ DỪNG giữa chừng!                       │
  │  ④ Chỉ "pop stack" khi ĐÃ XONG mọi thứ!           │
  │  ⑤ Main thread BỊ CHIẾM cho đến khi hoàn tất!      │
  │                                                        │
  │  TƯƠNG TỰ FUNCTION CALL STACK:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  function processA() {                            │  │
  │  │      processInput();     // push stack            │  │
  │  │      processButton();    // push stack            │  │
  │  │      processBlockList(); // push stack            │  │
  │  │      // ← mỗi hàm gọi hàm con!                │  │
  │  │      // ← KHÔNG THỂ yield giữa chừng!          │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  → Giống RECURSION: vào SÂU rồi mới quay lại! │  │
  │  │  → Phải CHẠY XONG mới trả lại main thread!     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VẤN ĐỀ VỚI ANIMATION:                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  60 FPS = mỗi frame cần render trong 16.6ms!    │  │
  │  │                                                  │  │
  │  │  Frame 1    Frame 2    Frame 3                    │  │
  │  │  ┌──────┐  ┌──────┐  ┌──────┐                   │  │
  │  │  │ 16ms │  │ 16ms │  │ 16ms │  ← IDEAL!       │  │
  │  │  └──────┘  └──────┘  └──────┘                   │  │
  │  │                                                  │  │
  │  │  NHƯNG nếu React chiếm 100ms:                    │  │
  │  │  ┌────────────────────────────┐  ┌──────┐        │  │
  │  │  │      100ms (React!)        │  │16ms  │        │  │
  │  │  └────────────────────────────┘  └──────┘        │  │
  │  │        ^^^^^^^^^^^^^^^^^^                         │  │
  │  │        BỎ LỠ 5-6 frames!                         │  │
  │  │        Animation GIẬT! STUTTERING! 😱            │  │
  │  │                                                  │  │
  │  │  → Mắt người nhận ra > 16.6ms giữa 2 frames!  │  │
  │  │  → Animation không smooth = UX TỆ!             │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.5. Fiber Reconciler — Giải Pháp Mới!

```
  FIBER — KHÁI NIỆM CỐT LÕI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  FIBER LÀ GÌ?                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Fiber = LIGHTWEIGHT EXECUTION THREAD!            │  │
  │  │  (Luồng thực thi SIÊU NHẸ!)                     │  │
  │  │                                                  │  │
  │  │  ┌────────── Thread ──────────┐                   │  │
  │  │  │                            │                   │  │
  │  │  │  • Managed by OS!          │                   │  │
  │  │  │  • PREEMPTIVE multitask!   │                   │  │
  │  │  │  • OS quyết định khi nào   │                   │  │
  │  │  │    chuyển task!            │                   │  │
  │  │  │  • Nặng, tốn tài nguyên!  │                   │  │
  │  │  │                            │                   │  │
  │  │  └────────────────────────────┘                   │  │
  │  │                                                  │  │
  │  │  ┌────────── Fiber ───────────┐                   │  │
  │  │  │                            │                   │  │
  │  │  │  • SELF-INVOKING!          │                   │  │
  │  │  │  • COOPERATIVE multitask!  │                   │  │
  │  │  │  • TỰ QUYẾT ĐỊNH khi nào  │                   │  │
  │  │  │    nhường quyền!           │                   │  │
  │  │  │  • Nhẹ, hiệu quả!         │                   │  │
  │  │  │  • Shares address space!   │                   │  │
  │  │  │                            │                   │  │
  │  │  └────────────────────────────┘                   │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH:                                              │
  │  ┌────────────┬───────────────────┬─────────────────┐  │
  │  │            │    Thread          │    Fiber         │  │
  │  ├────────────┼───────────────────┼─────────────────┤  │
  │  │ Quản lý    │    OS              │    Chương trình  │  │
  │  │ Scheduling │    Preemptive      │    Cooperative  │  │
  │  │ Chuyển task│    OS quyết định  │    TỰ nhường    │  │
  │  │ Tài nguyên │    Nặng            │    Nhẹ          │  │
  │  │ Ví dụ      │    pthreads        │    React Fiber  │  │
  │  └────────────┴───────────────────┴─────────────────┘  │
  │                                                        │
  │  COOPERATIVE MULTITASKING:                             │
  │  → Task TỰ NGUYỆN nhường main thread!                │
  │  → Sau mỗi "unit of work" nhỏ → kiểm tra!         │
  │  → Có task QUAN TRỌNG hơn? → NHƯỜNG!               │
  │  → Không có? → Tiếp tục!                            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  FIBER RECONCILER — 2 THAY ĐỔI LỚN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① CHIA NHỎ CÔNG VIỆC (Time Slicing):                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  STACK RECONCILER (cũ):                          │  │
  │  │  ┌──────────────────────────────────────────┐    │  │
  │  │  │ ██████████████████████████████████████████│    │  │
  │  │  │ ← 1 TASK LỚN, không thể dừng! →       │    │  │
  │  │  └──────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  FIBER RECONCILER (mới):                         │  │
  │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │  │
  │  │  │ T1 │ │ T2 │ │ T3 │ │ T4 │ │ T5 │ │ T6 │   │  │
  │  │  │ ██ │ │ ██ │ │ ██ │ │ ██ │ │ ██ │ │ ██ │   │  │
  │  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘   │  │
  │  │     ↑      ↑      ↑      ↑      ↑      ↑      │  │
  │  │     └──────┴──────┴──────┴──────┴──────┘       │  │
  │  │     Mỗi task nhỏ XONG → kiểm tra!             │  │
  │  │     → Có task ưu tiên? → NHƯỜNG!              │  │
  │  │     → Không? → Tiếp tục task kế!              │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② ƯU TIÊN TASK (Task Priority):                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  KHÔNG PHẢI task nào cũng quan trọng NHƯ NHAU! │  │
  │  │                                                  │  │
  │  │  Priority LEVELS:                                 │  │
  │  │  ┌────────────────────────────────────────────┐  │  │
  │  │  │  🔴 Synchronous    = Ngay lập tức!         │  │  │
  │  │  │  🟠 Task           = Trước frame kế!       │  │  │
  │  │  │  🟡 Animation      = Trước frame kế!       │  │  │
  │  │  │  🟢 High           = Sớm nhất có thể!     │  │  │
  │  │  │  🔵 Low            = Có thể trì hoãn!     │  │  │
  │  │  │  ⚪ Offscreen      = Ưu tiên THẤP nhất!   │  │  │
  │  │  └────────────────────────────────────────────┘  │  │
  │  │                                                  │  │
  │  │  VÍ DỤ:                                          │  │
  │  │  → User đang GÕ input = HIGH PRIORITY! 🔴      │  │
  │  │  → Component off-screen update = LOW! 🔵        │  │
  │  │  → Animation rendering = ANIMATION! 🟡         │  │
  │  │                                                  │  │
  │  │  → Khi user gõ + component đang update:        │  │
  │  │     Fiber DỪNG component update!                 │  │
  │  │     → Xử lý user input TRƯỚC!                  │  │
  │  │     → Quay lại component update SAU!            │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.6. Hai Giai Đoạn Mới — Reconcile & Commit

```
  2 PHASES CỦA FIBER RECONCILER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PHASE 1: RECONCILE (Lập lịch)                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  • Duyệt component tree TUẦN TỰ!                │  │
  │  │  • Diff algorithm: component CẦN update?          │  │
  │  │  • YES → GẮN TAG "cần update"!                 │  │
  │  │  • Sau khi duyệt xong → tạo EFFECT LIST!       │  │
  │  │  • Effect List = danh sách mọi thay đổi!        │  │
  │  │                                                  │  │
  │  │  ⭐ CÓ THỂ BỊ GIÁN ĐOẠN!                       │  │
  │  │  → Fiber có thể DỪNG giữa chừng!               │  │
  │  │  → Xử lý task ưu tiên cao hơn!                 │  │
  │  │  → Quay lại reconcile sau!                       │  │
  │  │                                                  │  │
  │  │  FLOW:                                            │  │
  │  │       tag         tag              tag             │  │
  │  │        ↑           ↑                ↑             │  │
  │  │  ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓  │  │
  │  │  A   input button Block  Block  div   div  ...   │  │
  │  │     List                                          │  │
  │  │  ← Reconcile Phase (CÓ THỂ dừng!) →            │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  PHASE 2: COMMIT (Áp dụng)                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  • Duyệt Effect List!                             │  │
  │  │  • Cập nhật DOM THỰC!                             │  │
  │  │  • Gọi lifecycle hooks (didMount, didUpdate)!     │  │
  │  │                                                  │  │
  │  │  ⚠️ KHÔNG THỂ GIÁN ĐOẠN!                        │  │
  │  │  → Phải chạy 1 mạch!                             │  │
  │  │  → Vì DOM update PHẢI nhất quán!                │  │
  │  │  → Nếu dừng giữa chừng → UI không đồng bộ!   │  │
  │  │                                                  │  │
  │  │  FLOW:                                            │  │
  │  │  ┌────────────────────────────────┐               │  │
  │  │  │ updateDomByEffectList()       │               │  │
  │  │  │ ████████████████████████████  │               │  │
  │  │  │ ← Commit Phase (1 MẠCH!) → │               │  │
  │  │  └────────────────────────────────┘               │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH STACK vs FIBER:                               │
  │                                                        │
  │  STACK RECONCILER:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ ████████████████████████████████████████████████ │  │
  │  │ ← Diff + Update DOM = 1 KHỐI! KHÔNG DỪNG! → │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  FIBER RECONCILER:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ │ ████████████████████████ │  │
  │  │ ←── Reconcile ───→ │ ←──── Commit ───────→ │  │
  │  │ (CÓ THỂ dừng!)      │ (KHÔNG dừng!)          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.7. Task Priority Trong Thực Tế — Demo

```
  TASK PRIORITY — FLOW VỚI USER INPUT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  KỊCH BẢN:                                            │
  │  ① Click button → setState (lowPriority!)             │
  │  ② React bắt đầu Reconcile Phase...                  │
  │  ③ User gõ vào input!                                 │
  │  ④ Fiber DỪNG reconcile → xử lý input!              │
  │  ⑤ Xong input → quay lại reconcile!                 │
  │  ⑥ Reconcile xong → Commit Phase (1 mạch)!          │
  │                                                        │
  │  MAIN THREAD FLOW:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  lowPriority      User types!    Continue!        │  │
  │  │  component         ┌─────────┐   reconcile        │  │
  │  │  reconcile...      │ HEY!    │                    │  │
  │  │                    │ User is │                    │  │
  │  │  tag  tag  tag     │inputting│  tag  tag           │  │
  │  │   ↑    ↑    ↑     │something│   ↑    ↑           │  │
  │  │  ▓▓  ▓▓  ▓▓      │ 🔴     │  ▓▓  ▓▓            │  │
  │  │                    └────┬────┘                    │  │
  │  │                         │                         │  │
  │  │                    mainThread:                     │  │
  │  │                    "OK! I will                     │  │
  │  │                     respond to                     │  │
  │  │                     user NOW!"                     │  │
  │  │                         │                         │  │
  │  │                    ┌────┴────┐                    │  │
  │  │                    │ STOP!  │                    │  │
  │  │                    │reconcile│                    │  │
  │  │                    │ Handle  │                    │  │
  │  │                    │ user    │                    │  │
  │  │                    │ input!  │                    │  │
  │  │                    └─────────┘                    │  │
  │  │                                                  │  │
  │  │  ├── Reconcile ──┤ input ├── Reconcile ──┤       │  │
  │  │                                                  │  │
  │  │                            effectList             │  │
  │  │                            .push(tag)             │  │
  │  │                                 │                 │  │
  │  │                                 ▼                │  │
  │  │                    ┌──────────────────┐           │  │
  │  │                    │  COMMIT PHASE    │           │  │
  │  │                    │  updateDom       │           │  │
  │  │                    │  ByEffectList()  │           │  │
  │  │                    │  ██████████████  │           │  │
  │  │                    │  ← 1 MẠCH! →  │           │  │
  │  │                    └──────────────────┘           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  KẾT QUẢ:                                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Input:  h → hi → hir → hire → hirea → hireact│  │
  │  │          ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑     │  │
  │  │          Browser PHẢN HỒI mỗi keystroke!        │  │
  │  │          GIỮA LÚC React đang update! ✅         │  │
  │  │                                                  │  │
  │  │  Block: 9 → 9 → 9 → 9 → 9 → 10 (cuối cùng!) │  │
  │  │                                                  │  │
  │  │  PERFORMANCE: 2727ms total!                       │  │
  │  │  ├── Scripting:  1020ms (37%!) 🟡 (vs 6330ms!) │  │
  │  │  ├── Rendering:   879ms 🟣                      │  │
  │  │  ├── Painting:    230ms 🟢                      │  │
  │  │  ├── Other:       520ms ⚪                      │  │
  │  │  └── Idle:         77ms ⬜                      │  │
  │  │                                                  │  │
  │  │  ⭐ JS time: 6330ms → 1020ms! (-84%!)          │  │
  │  │  ⭐ Nhưng QUAN TRỌNG HƠN:                      │  │
  │  │     User CÓ THỂ tương tác GIỮA LÚC update!    │  │
  │  │     Browser PHẢN HỒI mỗi keystroke!             │  │
  │  │     UX tốt hơn ĐÁNG KỂ!                        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.8. Browser APIs — requestIdleCallback & requestAnimationFrame

```javascript
// ═══════════════════════════════════════════════════════════
// requestIdleCallback — CHỜ BROWSER RẢNH!
// ═══════════════════════════════════════════════════════════

// Browser gọi callback khi MAIN THREAD rảnh!
requestIdleCallback((deadline) => {
  // deadline.timeRemaining() = còn bao nhiêu ms RẢNH!
  console.log(deadline.timeRemaining());
  // → Ví dụ: 12.5 (ms) = browser còn 12.5ms rảnh!

  // KIỂM TRA: còn thời gian không?
  while (deadline.timeRemaining() > 0) {
    // Làm việc NHẸ ở đây!
    doSmallUnitOfWork();
  }
  // Hết thời gian? → DỪNG! Nhường main thread!
});

// ═══════════════════════════════════════════════════════════
// requestAnimationFrame — TRƯỚC MỖI FRAME!
// ═══════════════════════════════════════════════════════════

// Browser gọi callback TRƯỚC KHI vẽ frame tiếp theo!
requestAnimationFrame((timestamp) => {
  // timestamp = thời điểm hiện tại (ms)!
  // Dùng cho animation!
  moveElement();
  requestAnimationFrame(animate); // Loop!
});
```

```
  requestIdleCallback — SƠ ĐỒ HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  FRAME LIFECYCLE (mỗi 16.6ms ở 60FPS):               │
  │                                                        │
  │  ┌─────── 1 Frame (16.6ms) ──────┐                    │
  │  │                                 │                    │
  │  │ Input → JS → rAF → Layout → Paint → Idle Time │   │
  │  │ events  exec  anim   calc     ████   ▒▒▒▒▒▒▒  │   │
  │  │                                        ^^^^^^^  │   │
  │  │                                    requestIdle  │   │
  │  │                                    Callback     │   │
  │  │                                    GỌI Ở ĐÂY! │   │
  │  │                                                 │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                        │
  │  Flow:                                                 │
  │  ① Browser xử lý input events!                        │
  │  ② Chạy JavaScript!                                   │
  │  ③ requestAnimationFrame callbacks!                    │
  │  ④ Tính toán Layout!                                   │
  │  ⑤ Paint (vẽ lên màn hình)!                          │
  │  ⑥ CÒN THỜI GIAN? → IDLE TIME!                      │
  │  ⑦ requestIdleCallback ĐƯỢC GỌI!                     │
  │                                                        │
  │  FIBER SỬ DỤNG requestIdleCallback ĐỂ:               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  1. Nhận idle time từ browser!                    │  │
  │  │  2. Làm 1 "unit of work" nhỏ!                   │  │
  │  │  3. Kiểm tra: còn idle time?                      │  │
  │  │     → CÓ: tiếp tục unit tiếp theo!             │  │
  │  │     → KHÔNG: DỪNG! Nhường main thread!          │  │
  │  │  4. Browser xử lý events, paint, etc.!            │  │
  │  │  5. Rảnh lại? → requestIdleCallback lần nữa!    │  │
  │  │  6. Lặp lại cho đến khi xong!                    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ LƯU Ý:                                            │
  │  requestIdleCallback chỉ là POLYFILL concept!          │
  │  React Fiber thực tế dùng MessageChannel + scheduler! │
  │  Nhưng Ý TƯỞNG giống nhau:                            │
  │  → Chia nhỏ → kiểm tra → nhường → tiếp tục!      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.9. Fiber Node — Cấu Trúc Dữ Liệu

```javascript
// ═══════════════════════════════════════════════════════════
// FIBER NODE — mỗi component/element = 1 Fiber Node!
// ═══════════════════════════════════════════════════════════

// Fiber Node = JavaScript Object:
const fiberNode = {
  // ① TYPE: loại element!
  type: "div", // hoặc: MyComponent (function/class)
  props: { children: [] },

  // ② DOM reference:
  dom: null, // → DOM element thật!

  // ③ LINKED LIST POINTERS (quan trọng!):
  parent: null, // → Fiber node CHA!
  child: null, // → Fiber node CON ĐẦU TIÊN!
  sibling: null, // → Fiber node ANH EM kế tiếp!

  // ④ ALTERNATE (Work-in-Progress):
  alternate: null, // → Fiber node CŨ (để so sánh diff)!

  // ⑤ EFFECT TAG:
  effectTag: null, // → 'PLACEMENT' | 'UPDATE' | 'DELETION'
  //                        → Loại thay đổi cần áp dụng!

  // ⑥ HOOKS (cho Function Components):
  hooks: [],
};
```

```
  FIBER NODE — TẠI SAO LINKED LIST?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TREE THÔNG THƯỜNG: Mỗi node có MẢNG children!       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  { type: 'div', children: [                      │  │
  │  │      { type: 'h1', children: [] },               │  │
  │  │      { type: 'p',  children: [                   │  │
  │  │          { type: 'span', children: [] }           │  │
  │  │      ]}                                           │  │
  │  │  ]}                                               │  │
  │  │                                                  │  │
  │  │  → Phải duyệt mảng children bằng RECURSION!    │  │
  │  │  → KHÔNG THỂ dừng giữa chừng recursion!        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  FIBER LINKED LIST: child + sibling + parent!          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │         div (root)                                │  │
  │  │        / │                                        │  │
  │  │  child/  │                                        │  │
  │  │      /   │                                        │  │
  │  │     h1 ──→ p ──→ null                            │  │
  │  │    sibling sibling                                │  │
  │  │            │                                      │  │
  │  │       child│                                      │  │
  │  │            ▼                                     │  │
  │  │          span ──→ null                            │  │
  │  │                                                  │  │
  │  │  → Mỗi Fiber chỉ có 3 pointers:                │  │
  │  │    child    → con ĐẦU TIÊN                      │  │
  │  │    sibling  → anh em KẾ TIẾP                    │  │
  │  │    parent   → bố mẹ (để quay lại!)             │  │
  │  │                                                  │  │
  │  │  → DUYỆT = chạy vòng WHILE LOOP!               │  │
  │  │  → CÓ THỂ DỪNG ở bất kỳ bước nào!            │  │
  │  │  → Resume = tiếp tục từ fiber hiện tại!         │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  THỨ TỰ DUYỆT FIBER:                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │          div (1)                                  │  │
  │  │         ╱                                        │  │
  │  │       h1 (2) → p (4)                             │  │
  │  │                 │                                 │  │
  │  │               span (5)                            │  │
  │  │                 │                                 │  │
  │  │           parent (6: quay lại p)                  │  │
  │  │                 │                                 │  │
  │  │           parent (7: quay lại div)                │  │
  │  │                                                  │  │
  │  │  RULE:                                            │  │
  │  │  ① Có child? → đi xuống child! (2→h1)          │  │
  │  │  ② Không child? Có sibling? → qua sibling!     │  │
  │  │  ③ Không child, không sibling? → lên parent!    │  │
  │  │  ④ Parent có sibling? → qua sibling! (4→p)     │  │
  │  │  ⑤ Lặp lại cho đến khi về root!                │  │
  │  │                                                  │  │
  │  │  → Depth-first NHƯNG dùng WHILE LOOP!           │  │
  │  │  → Không dùng RECURSION!                         │  │
  │  │  → CÓ THỂ DỪNG ở bất kỳ node nào!            │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.10. Code — Tự Viết Fiber Reconciler!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT FIBER RECONCILER — TỪ ĐẦU, KHÔNG THƯ VIỆN!
// ═══════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────
// 1. BIẾN TOÀN CỤC — Fiber State
// ────────────────────────────────────────────────────────

let nextUnitOfWork = null; // Fiber node tiếp theo cần xử lý!
let currentRoot = null; // Root fiber hiện tại (đã commit)!
let wipRoot = null; // Work-In-Progress root fiber!
let deletions = null; // Mảng fiber cần xóa!

// ────────────────────────────────────────────────────────
// 2. createElement — Tạo Virtual DOM element!
// ────────────────────────────────────────────────────────

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child),
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// ────────────────────────────────────────────────────────
// 3. createDom — Tạo DOM THẬT từ Fiber!
// ────────────────────────────────────────────────────────

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

// ────────────────────────────────────────────────────────
// 4. updateDom — Cập nhật DOM properties!
// ────────────────────────────────────────────────────────

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // ① XÓA event listeners CŨ!
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // ② XÓA properties CŨ!
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // ③ THÊM properties MỚI!
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // ④ THÊM event listeners MỚI!
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
```

```
  createDom + updateDom — SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  fiber = { type: 'div', props: {                       │
  │      className: 'box',                                 │
  │      onClick: handleClick,                             │
  │      children: [...]                                   │
  │  }}                                                    │
  │       │                                                │
  │       ▼ createDom(fiber)                              │
  │                                                        │
  │  ① document.createElement('div')                      │
  │       │                                                │
  │       ▼ updateDom(dom, {}, fiber.props)               │
  │                                                        │
  │  ② isProperty('className') = true!                    │
  │     → dom.className = 'box'                           │
  │                                                        │
  │  ③ isEvent('onClick') = true!                         │
  │     → dom.addEventListener('click', handleClick)      │
  │                                                        │
  │  ④ isProperty('children') = false! (bỏ qua!)         │
  │                                                        │
  │  → DOM element sẵn sàng! 🎉                         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ────────────────────────────────────────────────────────
// 5. commitRoot — Commit Phase = CẬP NHẬT DOM!
// ────────────────────────────────────────────────────────

function commitRoot() {
  // Xóa các node đã bị remove!
  deletions.forEach(commitWork);
  // Commit toàn bộ Fiber tree!
  commitWork(wipRoot.child);
  // Lưu lại root hiện tại!
  currentRoot = wipRoot;
  wipRoot = null;
}

// ────────────────────────────────────────────────────────
// 6. commitWork — Áp dụng EFFECT lên DOM!
// ────────────────────────────────────────────────────────

function commitWork(fiber) {
  if (!fiber) return;

  // Tìm parent DOM node!
  const domParent = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    // THÊM MỚI!
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    // CẬP NHẬT!
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    // XÓA!
    domParent.removeChild(fiber.dom);
  }

  // Commit children và siblings!
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

```
  COMMIT PHASE — SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  commitRoot() — GỌI SAU KHI RECONCILE XONG!          │
  │                                                        │
  │  effectTag     Hành động                               │
  │  ┌────────────┬──────────────────────────────────────┐ │
  │  │ PLACEMENT  │ domParent.appendChild(fiber.dom)     │ │
  │  │            │ → THÊM element mới vào DOM!         │ │
  │  ├────────────┼──────────────────────────────────────┤ │
  │  │ UPDATE     │ updateDom(fiber.dom, oldProps, new)  │ │
  │  │            │ → CẬP NHẬT props (className, etc.) │ │
  │  ├────────────┼──────────────────────────────────────┤ │
  │  │ DELETION   │ domParent.removeChild(fiber.dom)     │ │
  │  │            │ → XÓA element khỏi DOM!             │ │
  │  └────────────┴──────────────────────────────────────┘ │
  │                                                        │
  │  ⚠️ COMMIT PHASE KHÔNG THỂ GIÁN ĐOẠN!                │
  │  → Duyệt TOÀN BỘ fiber tree bằng RECURSION!         │
  │  → commitWork(child) → commitWork(sibling)!          │
  │  → Phải XONG mới trả lại main thread!               │
  │  → Nhưng chỉ update fiber CÓ EFFECT TAG!            │
  │  → Nên nhẹ hơn rebuild toàn bộ DOM!                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ────────────────────────────────────────────────────────
// 7. render — Entry Point!
// ────────────────────────────────────────────────────────

function render(element, container) {
  // Tạo ROOT fiber!
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
    // ↑ alternate = fiber CŨ (để diff!)
  };
  deletions = [];
  // BẮT ĐẦU từ root!
  nextUnitOfWork = wipRoot;
}

// ────────────────────────────────────────────────────────
// 8. workLoop — VÒNG LẶP CHÍNH CỦA FIBER!
// ────────────────────────────────────────────────────────

function workLoop(deadline) {
  let shouldYield = false;

  // VÒNG LẶP: làm việc cho đến khi hết thời gian!
  while (nextUnitOfWork && !shouldYield) {
    // ① Thực hiện 1 unit of work!
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    // ② Kiểm tra: còn thời gian không?
    shouldYield = deadline.timeRemaining() < 1;
    // ← Còn < 1ms? DỪNG! Nhường browser!
  }

  // ③ Nếu KHÔNG còn unit nào + có wipRoot → COMMIT!
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  // ④ Đăng ký lại cho idle cycle tiếp theo!
  requestIdleCallback(workLoop);
}

// BẮT ĐẦU vòng lặp!
requestIdleCallback(workLoop);
```

```
  workLoop — SƠ ĐỒ HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  requestIdleCallback(workLoop)                         │
  │       │                                                │
  │       ▼                                               │
  │  ┌─── workLoop(deadline) ─────────────────────────┐   │
  │  │                                                  │   │
  │  │  while (nextUnitOfWork && !shouldYield):         │   │
  │  │  ┌──────────────────────────────────────────┐   │   │
  │  │  │                                          │   │   │
  │  │  │  nextUnit = performUnitOfWork(current)   │   │   │
  │  │  │       │                                  │   │   │
  │  │  │       ▼                                 │   │   │
  │  │  │  shouldYield = deadline.timeRemaining() │   │   │
  │  │  │               < 1ms?                     │   │   │
  │  │  │       │                                  │   │   │
  │  │  │       ├── CÒN TIME → tiếp tục while!  │   │   │
  │  │  │       └── HẾT TIME → thoát while!     │   │   │
  │  │  │                                          │   │   │
  │  │  └──────────────────────────────────────────┘   │   │
  │  │                                                  │   │
  │  │  Sau while:                                      │   │
  │  │  ├── Còn nextUnitOfWork?                         │   │
  │  │  │   → requestIdleCallback(workLoop) lần nữa!  │   │
  │  │  │   → ĐỢI browser rảnh rồi tiếp tục!        │   │
  │  │  │                                               │   │
  │  │  └── Không còn nextUnitOfWork + có wipRoot?      │   │
  │  │      → commitRoot()! COMMIT PHASE!               │   │
  │  │      → CẬP NHẬT DOM 1 MẠCH!                    │   │
  │  │                                                  │   │
  │  └──────────────────────────────────────────────────┘   │
  │                                                        │
  │  ⭐ ĐÂY LÀ CORE CỦA FIBER!                          │
  │  → workLoop = vòng lặp chia nhỏ công việc!           │
  │  → performUnitOfWork = 1 đơn vị công việc nhỏ!      │
  │  → deadline.timeRemaining() = browser còn rảnh?      │
  │  → CÓ THỂ DỪNG ở bất kỳ lúc nào!                  │
  │  → NHƯỜNG main thread cho browser!                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ────────────────────────────────────────────────────────
// 9. performUnitOfWork — XỬ LÝ 1 FIBER NODE!
// ────────────────────────────────────────────────────────

function performUnitOfWork(fiber) {
  // ① Tạo DOM nếu chưa có!
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // ② Tạo fiber cho children!
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  // ③ Trả về FIBER TIẾP THEO (theo linked list order!)

  // Có child? → đi xuống child!
  if (fiber.child) {
    return fiber.child;
  }

  // Không child → tìm sibling hoặc lên parent!
  let nextFiber = fiber;
  while (nextFiber) {
    // Có sibling? → qua sibling!
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // Không sibling → lên parent!
    nextFiber = nextFiber.parent;
  }

  // Về root? → null = XONG!
  return null;
}
```

```
  performUnitOfWork — THỨ TỰ DUYỆT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VÍ DỤ: Component tree đơn giản:                      │
  │                                                        │
  │        ROOT                                            │
  │        ╱                                              │
  │      div                                               │
  │      ╱   ╲                                            │
  │    h1     p                                            │
  │          ╱                                            │
  │        span                                            │
  │                                                        │
  │  LINKED LIST:                                          │
  │  ROOT → div → h1 → (sibling) p → span → null       │
  │                                                        │
  │  DUYỆT TUẦN TỰ:                                      │
  │  ┌─────────────────────────────────────────────┐      │
  │  │  Step 1: fiber = ROOT                        │      │
  │  │    → có child? CÓ (div)!                    │      │
  │  │    → return div                              │      │
  │  │                                               │      │
  │  │  Step 2: fiber = div                          │      │
  │  │    → có child? CÓ (h1)!                     │      │
  │  │    → return h1                               │      │
  │  │                                               │      │
  │  │  Step 3: fiber = h1                           │      │
  │  │    → có child? KHÔNG!                        │      │
  │  │    → có sibling? CÓ (p)!                    │      │
  │  │    → return p                                │      │
  │  │                                               │      │
  │  │  Step 4: fiber = p                            │      │
  │  │    → có child? CÓ (span)!                   │      │
  │  │    → return span                             │      │
  │  │                                               │      │
  │  │  Step 5: fiber = span                         │      │
  │  │    → có child? KHÔNG!                        │      │
  │  │    → có sibling? KHÔNG!                      │      │
  │  │    → lên parent (p)                           │      │
  │  │    → p có sibling? KHÔNG!                    │      │
  │  │    → lên parent (div)                         │      │
  │  │    → div có sibling? KHÔNG!                  │      │
  │  │    → lên parent (ROOT)                        │      │
  │  │    → return null = XONG! ✅                  │      │
  │  │                                               │      │
  │  │  ⚠️ FLAG: CÓ THỂ dừng sau bất kỳ Step nào!│      │
  │  │  → Resume từ nextUnitOfWork (Step tiếp!)    │      │
  │  │                                               │      │
  │  └─────────────────────────────────────────────┘      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ────────────────────────────────────────────────────────
// 10. reconcileChildren — DIFF ALGORITHM CỦA FIBER!
// ────────────────────────────────────────────────────────

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  // oldFiber = fiber CŨ (từ lần render trước!)
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // So sánh TYPE: cũ vs mới!
    const sameType = oldFiber && element && element.type === oldFiber.type;

    // ① CÙNG TYPE → UPDATE!
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props, // Props MỚI!
        dom: oldFiber.dom, // TÁI SỬ DỤNG DOM!
        parent: wipFiber,
        alternate: oldFiber, // Reference cũ!
        effectTag: "UPDATE", // TAG: cập nhật!
      };
    }

    // ② KHÁC TYPE + có element MỚI → PLACEMENT!
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null, // DOM MỚI!
        parent: wipFiber,
        alternate: null, // Không có cũ!
        effectTag: "PLACEMENT", // TAG: thêm mới!
      };
    }

    // ③ KHÁC TYPE + có fiber CŨ → DELETION!
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); // Thêm vào xóa!
    }

    // Di chuyển oldFiber sang sibling tiếp!
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // Xây dựng LINKED LIST!
    if (index === 0) {
      wipFiber.child = newFiber; // Child đầu tiên!
    } else if (element) {
      prevSibling.sibling = newFiber; // Sibling kế!
    }

    prevSibling = newFiber;
    index++;
  }
}
```

```
  reconcileChildren — DIFF LOGIC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SO SÁNH OLD FIBER vs NEW ELEMENT:                    │
  │                                                        │
  │  ┌──────────────┬───────────────┬──────────────────┐  │
  │  │  Điều kiện    │ effectTag     │ Hành động         │  │
  │  ├──────────────┼───────────────┼──────────────────┤  │
  │  │ sameType     │ 'UPDATE'      │ Giữ DOM cũ!      │  │
  │  │ (type giống) │               │ Chỉ update props! │  │
  │  ├──────────────┼───────────────┼──────────────────┤  │
  │  │ element mới  │ 'PLACEMENT'   │ Tạo DOM mới!      │  │
  │  │ type khác    │               │ appendChild!       │  │
  │  ├──────────────┼───────────────┼──────────────────┤  │
  │  │ oldFiber     │ 'DELETION'    │ Xóa DOM cũ!       │  │
  │  │ type khác    │               │ removeChild!       │  │
  │  └──────────────┴───────────────┴──────────────────┘  │
  │                                                        │
  │  VÍ DỤ:                                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  OLD:  div → h1 → p                            │  │
  │  │  NEW:  div → h1 → span                         │  │
  │  │                                                  │  │
  │  │  div: sameType!  → UPDATE  (giữ DOM!)          │  │
  │  │  h1:  sameType!  → UPDATE  (giữ DOM!)          │  │
  │  │  p→span: KHÁC!  → DELETION (xóa p!)           │  │
  │  │                    PLACEMENT (thêm span!)       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  XÂY DỰNG LINKED LIST:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  index === 0:                                     │  │
  │  │    wipFiber.child = newFiber                      │  │
  │  │    (Con ĐẦU TIÊN gắn vào .child!)              │  │
  │  │                                                  │  │
  │  │  index > 0:                                       │  │
  │  │    prevSibling.sibling = newFiber                 │  │
  │  │    (Các con TIẾP THEO gắn vào .sibling!)       │  │
  │  │                                                  │  │
  │  │  → Kết quả: Linked list!                        │  │
  │  │  wipFiber → child → sibling → sibling → null  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.11. Demo App — Counter Với Fiber!

```javascript
// ═══════════════════════════════════════════════════════════
// DEMO: COUNTER APP VỚI FIBER RECONCILER TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① createElement đã có sẵn (section 23.10)!
// ② render đã có sẵn!
// ③ workLoop + requestIdleCallback đã chạy!

// Tạo app:
const container = document.getElementById("root");

const updateValue = (e) => {
  rerender(e.target.value);
};

const rerender = (value) => {
  const element = createElement(
    "div",
    null,
    createElement("input", { onInput: updateValue, value: value }),
    createElement("h2", null, "Hello, ", value),
  );
  render(element, container);
};

rerender("World");

// ═══════════════════════════════════════════════════════════
// KẾT QUẢ:
//
//   ┌──────────────────────────────────┐
//   │                                  │
//   │   [World___________]             │
//   │   Hello, World                   │
//   │                                  │
//   │   → Gõ "React" vào input!       │
//   │                                  │
//   │   [React___________]             │
//   │   Hello, React                   │
//   │                                  │
//   └──────────────────────────────────┘
//
// → Input PHẢN HỒI NGAY mỗi keystroke!
// → Không bị block!
// → Fiber chia nhỏ reconcile!
// → Commit phase chỉ update elements CẦN THIẾT!
// ═══════════════════════════════════════════════════════════
```

### 23.12. Lifecycle Methods — Ảnh Hưởng Của 2 Phases

```
  LIFECYCLE METHODS & 2 PHASES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  RECONCILE PHASE (CÓ THỂ gián đoạn!):                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Các method được gọi TRONG phase này:            │  │
  │  │  ┌──────────────────────────────────────────┐    │  │
  │  │  │  • [UNSAFE_] componentWillMount          │    │  │
  │  │  │  • [UNSAFE_] componentWillReceiveProps   │    │  │
  │  │  │  • getDerivedStateFromProps              │    │  │
  │  │  │  • shouldComponentUpdate                 │    │  │
  │  │  │  • [UNSAFE_] componentWillUpdate         │    │  │
  │  │  │  • render()                              │    │  │
  │  │  └──────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  ⚠️ CÓ THỂ BỊ GỌI NHIỀU LẦN!                 │  │
  │  │  → Vì Fiber có thể DỪNG rồi BẮT ĐẦU LẠI!   │  │
  │  │  → componentWillMount có thể bị gọi 2-3 lần!  │  │
  │  │  → componentWillUpdate cũng vậy!               │  │
  │  │                                                  │  │
  │  │  → ĐÂY LÀ LÝ DO React deprecate:              │  │
  │  │     componentWillMount                           │  │
  │  │     componentWillReceiveProps                     │  │
  │  │     componentWillUpdate                           │  │
  │  │     → Thêm prefix UNSAFE_ để cảnh báo!        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  COMMIT PHASE (KHÔNG gián đoạn!):                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Các method được gọi TRONG phase này:            │  │
  │  │  ┌──────────────────────────────────────────┐    │  │
  │  │  │  • componentDidMount                     │    │  │
  │  │  │  • componentDidUpdate                    │    │  │
  │  │  │  • componentWillUnmount                  │    │  │
  │  │  │  • getSnapshotBeforeUpdate               │    │  │
  │  │  └──────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  ✅ CHỈ ĐƯỢC GỌI 1 LẦN!                        │  │
  │  │  → Commit Phase không bị gián đoạn!             │  │
  │  │  → Mỗi method chỉ gọi ĐÚNG 1 LẦN!             │  │
  │  │  → AN TOÀN để side effects!                     │  │
  │  │  → DOM đã nhất quán!                             │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LÝ DO REACT DEPRECATE componentWillXxx:              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // TRƯỚC Fiber:                                  │  │
  │  │  componentWillMount() {                           │  │
  │  │      fetchData(); // gọi API 1 LẦN — OK!        │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  // SAU Fiber:                                    │  │
  │  │  componentWillMount() {                           │  │
  │  │      fetchData(); // GỌI 1 LẦN?                 │  │
  │  │      // KHÔNG!                                    │  │
  │  │      // Fiber DỪNG → BẮT ĐẦU LẠI → gọi LẠI! │  │
  │  │      // fetchData() gọi 2-3 lần! BUG! 🐛       │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  // FIX: Dùng componentDidMount (Commit Phase!)   │  │
  │  │  componentDidMount() {                            │  │
  │  │      fetchData(); // CHỈ GỌI 1 LẦN! ✅          │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.13. Hooks & Fiber — useState Hoạt Động Thế Nào?

```javascript
// ═══════════════════════════════════════════════════════════
// HOOKS + FIBER — TỰ VIẾT useState!
// ═══════════════════════════════════════════════════════════

// Biến toàn cục cho hooks:
let wipFiber = null; // Fiber đang xử lý!
let hookIndex = null; // Index hook hiện tại!

// Sửa performUnitOfWork cho Function Components:
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  // Gọi function component!
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

// ────────────────────────────────────────────────────────
// useState — TỰ VIẾT!
// ────────────────────────────────────────────────────────

function useState(initial) {
  // Lấy hook CŨ (nếu có, từ lần render trước!)
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // Tạo hook MỚI!
  const hook = {
    // Nếu có hook cũ → dùng state cũ!
    // Nếu không → dùng initial value!
    state: oldHook ? oldHook.state : initial,
    queue: [], // Queue chứa setState actions!
  };

  // Xử lý các actions trong queue (từ setState trước đó!)
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state =
      typeof action === "function"
        ? action(hook.state) // Functional update!
        : action; // Direct value!
  });

  // setState function!
  const setState = (action) => {
    hook.queue.push(action);

    // Trigger re-render: tạo WIP root mới!
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // Lưu hook vào fiber!
  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG:
// ═══════════════════════════════════════════════════════════

function Counter() {
  const [count, setCount] = useState(0);

  return createElement(
    "div",
    null,
    createElement("h1", null, "Count: ", count),
    createElement(
      "button",
      { onClick: () => setCount((c) => c + 1) },
      "Click me!",
    ),
  );
}

const element = createElement(Counter, null);
render(element, document.getElementById("root"));

// ═══════════════════════════════════════════════════════════
// KẾT QUẢ:
//
//   ┌──────────────────────────────────┐
//   │                                  │
//   │   Count: 0                       │
//   │   [ Click me! ]                  │
//   │                                  │
//   │   → Click button!               │
//   │                                  │
//   │   Count: 1                       │
//   │   [ Click me! ]                  │
//   │                                  │
//   └──────────────────────────────────┘
// ═══════════════════════════════════════════════════════════
```

```
  useState + FIBER — SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  LẦN RENDER ĐẦU TIÊN:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  useState(0)                                      │  │
  │  │    → oldHook = null (chưa có!)                   │  │
  │  │    → hook.state = 0 (initial!)                    │  │
  │  │    → hook.queue = []                              │  │
  │  │    → return [0, setState]                         │  │
  │  │                                                  │  │
  │  │  fiber.hooks = [{ state: 0, queue: [] }]          │  │
  │  │                   ↑ hookIndex = 0                 │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CLICK BUTTON → setState(c => c + 1):                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① setState nhận action: (c) => c + 1            │  │
  │  │  ② Push action vào hook.queue!                    │  │
  │  │     hook.queue = [(c) => c + 1]                   │  │
  │  │  ③ Tạo wipRoot MỚI → trigger re-render!        │  │
  │  │  ④ nextUnitOfWork = wipRoot                       │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LẦN RENDER THỨ HAI (re-render!):                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  useState(0) — GỌI LẠI!                          │  │
  │  │    → oldHook = { state: 0, queue: [(c)=>c+1] }   │  │
  │  │    → hook.state = oldHook.state = 0               │  │
  │  │    → Xử lý queue:                                │  │
  │  │       action = (c) => c + 1                       │  │
  │  │       hook.state = action(0) = 1!                 │  │
  │  │    → return [1, setState] ← state MỚI!          │  │
  │  │                                                  │  │
  │  │  fiber.hooks = [{ state: 1, queue: [] }]          │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⭐ HOOKS GẮN VỚI FIBER!                             │
  │  → Mỗi fiber có mảng hooks!                          │
  │  → hookIndex đảm bảo đúng thứ tự!                  │
  │  → ĐÂY LÀ LÝ DO hooks không được đặt trong if!     │
  │     → hookIndex sẽ LỆCH!                             │
  │     → Truy cập SAI hook! BUG! 🐛                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 23.14. Takeaways — React Fiber

```
  ⭐ TAKEAWAYS — REACT FIBER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Browser = SINGLE THREADED!                         │
  │     → JS chạy lâu = block mọi thứ!                  │
  │     → User input, animation, paint: TẤT CẢ chờ!    │
  │                                                        │
  │  ② Stack Reconciler = CHẠY 1 MẠCH!                   │
  │     → Depth-first recursion = KHÔNG THỂ DỪNG!        │
  │     → 100k elements = 7 giây ĐỨNG HÌNH!             │
  │     → UX TỆ: user không tương tác được!             │
  │                                                        │
  │  ③ Fiber = COOPERATIVE MULTITASKING!                  │
  │     → Task TỰ NGUYỆN nhường main thread!              │
  │     → Chia nhỏ thành "units of work"!                │
  │     → Kiểm tra browser rảnh (requestIdleCallback)!   │
  │                                                        │
  │  ④ 2 PHASES mới:                                      │
  │     → Reconcile: diff + tag changes (CÓ THỂ dừng!)  │
  │     → Commit: apply to DOM (KHÔNG thể dừng!)          │
  │                                                        │
  │  ⑤ Task PRIORITY cho phép:                            │
  │     → User input ưu tiên CAO nhất! 🔴               │
  │     → Component off-screen = LOW priority! 🔵        │
  │     → Animation = trước mỗi frame! 🟡               │
  │                                                        │
  │  ⑥ Fiber Node = LINKED LIST!                          │
  │     → child, sibling, parent pointers!                 │
  │     → Duyệt bằng WHILE LOOP (không recursion!)       │
  │     → CÓ THỂ DỪNG ở bất kỳ node nào!              │
  │     → Resume = tiếp tục từ fiber hiện tại!            │
  │                                                        │
  │  ⑦ Lifecycle methods bị ảnh hưởng!                   │
  │     → componentWillMount → UNSAFE! (gọi nhiều lần!) │
  │     → componentDidMount → AN TOÀN! (Commit Phase!)  │
  │     → Dùng getDerivedStateFromProps thay componentW*! │
  │                                                        │
  │  ⑧ Hooks GẮN VỚI Fiber node!                         │
  │     → fiber.hooks = mảng các hook!                    │
  │     → hookIndex đảm bảo THỨ TỰ!                    │
  │     → KHÔNG được gọi hooks trong if/loop!             │
  │     → hookIndex sẽ LỆCH = BUG!                       │
  │                                                        │
  │  ⑨ Performance:                                       │
  │     → Stack: 6330ms JS (89% time!)                     │
  │     → Fiber: 1020ms JS (37% time!) ← -84%!          │
  │     → NHƯNG QUAN TRỌNG HƠN: user CÓ THỂ tương tác!│
  │                                                        │
  │  ⑩ Tự viết Fiber Reconciler:                          │
  │     → createElement → createDom → updateDom!          │
  │     → workLoop → performUnitOfWork!                   │
  │     → reconcileChildren → commitRoot → commitWork!   │
  │     → useState: hook.state + hook.queue + setState!    │
  │     → KHÔNG THƯ VIỆN! Hiểu từ first principles! ✅  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  MIND MAP: REACT FIBER — TOÀN CẢNH!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │     Browser Single Thread                              │
  │          │                                             │
  │          ▼                                            │
  │     Stack Reconciler PROBLEM!                          │
  │     (Depth-first, blocking, 7s freeze!)                │
  │          │                                             │
  │          ▼                                            │
  │     ┌── FIBER RECONCILER ──────────────────────┐      │
  │     │                                           │      │
  │     │  Time Slicing     Task Priority            │      │
  │     │  (chia nhỏ!)      (ưu tiên!)              │      │
  │     │       │                │                   │      │
  │     │       ▼               ▼                   │      │
  │     │  workLoop      Priority Levels             │      │
  │     │  requestIdle    🔴 Sync                    │      │
  │     │  Callback       🟡 Animation               │      │
  │     │       │         🔵 Low                     │      │
  │     │       ▼                                   │      │
  │     │  2 PHASES                                  │      │
  │     │  ├── Reconcile (CÓ THỂ dừng!)            │      │
  │     │  │   ├── Diff algorithm                    │      │
  │     │  │   ├── effectTag: PLACEMENT/UPDATE/DEL   │      │
  │     │  │   └── Linked list traversal             │      │
  │     │  │                                         │      │
  │     │  └── Commit (KHÔNG dừng!)                  │      │
  │     │      ├── appendChild / updateDom           │      │
  │     │      ├── removeChild                       │      │
  │     │      └── componentDidMount ✅              │      │
  │     │                                           │      │
  │     │  Fiber Node Structure                      │      │
  │     │  ├── child (con đầu)                      │      │
  │     │  ├── sibling (anh em)                      │      │
  │     │  ├── parent (bố mẹ)                       │      │
  │     │  ├── alternate (fiber cũ)                  │      │
  │     │  ├── effectTag                             │      │
  │     │  └── hooks[] (useState!)                   │      │
  │     │                                           │      │
  │     └───────────────────────────────────────────┘      │
  │                                                        │
  │  KẾT QUẢ: React chuyển từ BLOCKING → COOPERATIVE!   │
  │  → UX mượt mà hơn ĐÁNG KỂ! ✨                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---
