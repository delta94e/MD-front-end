# React Chuyên Sâu: Từ Mixin → HOC → Hooks — Deep Dive

> 📅 2026-02-12 · ⏱ 22 phút đọc
>
> Nguồn: TikTok Front-End Security Team (ByteDance) · 70,309 lượt đọc
> Lộ trình tái sử dụng logic trạng thái trong React
> Mixin (đã chết) → HOC (đang thịnh) → Hooks (tương lai)
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Senior-level React Interview

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Giới thiệu — Vấn đề tái sử dụng logic   |
| 2   | Mixin Pattern — Cơ chế & Tại sao bị bỏ  |
| 3   | Decorator Pattern — Nền tảng cho HOC    |
| 4   | HOC — 2 Cách triển khai                 |
| 5   | HOC — 6 Khả năng                        |
| 6   | HOC — Cách sử dụng (compose, decorator) |
| 7   | HOC — 5 Ứng dụng thực tế                |
| 8   | HOC — 5 Lưu ý quan trọng                |
| 9   | Hooks — useState, useEffect, useRef     |
| 10  | Custom Hooks — Tái sử dụng logic        |
| 11  | Hooks — Quy tắc & Hạn chế               |
| 12  | So sánh Mixin vs HOC vs Hooks           |
| 13  | Tổng kết & Checklist phỏng vấn          |

---

## §1. Giới thiệu — Vấn đề tái sử dụng logic

```
VẤN ĐỀ CỐT LÕI:
═══════════════════════════════════════════════════════════════

  Nhiều component có LOGIC GIỐNG NHAU:
  → Ghi log user behavior
  → Kiểm tra quyền truy cập
  → Form validation
  → Fetch data khi mount
  → Subscribe/unsubscribe events

  Nếu copy-paste logic vào mỗi component → CODE TRÙNG LẶP! 💀
  Cần cơ chế TÁI SỬ DỤNG LOGIC mà không lặp code.

  LỊCH SỬ PHÁT TRIỂN:
  ┌──────────┬───────────┬───────────────────────────────────┐
  │ Giai đoạn │ Kỹ thuật  │ Trạng thái                        │
  ├──────────┼───────────┼───────────────────────────────────┤
  │ 2013+    │ Mixin     │ ❌ Đã bỏ — quá nhiều vấn đề      │
  │ 2015+    │ HOC       │ ✅ Đang dùng — pattern chính      │
  │ 2019+    │ Hooks     │ ⭐ Tương lai — đơn giản & mạnh   │
  └──────────┴───────────┴───────────────────────────────────┘
```

---

## §2. Mixin Pattern — Cơ chế & Tại sao bị bỏ

```
MIXIN LÀ GÌ?
═══════════════════════════════════════════════════════════════

  Mixin = "trộn" thuộc tính của object này vào object khác
  → Copy methods từ một object sang object mới
  → Mục đích: tái sử dụng code

  Bản chất: Object.assign() / _.extend()
  → Không phải kế thừa (inheritance)!
  → Là copy thuộc tính (composition by copying)
```

```javascript
// Mixin cơ bản với Underscore
var LogMixin = {
  actionLog: function () {
    console.log("action...");
  },
  requestLog: function () {
    console.log("request...");
  },
};

function User() {
  /* ... */
}
function Goods() {
  /* ... */
}

// "Trộn" LogMixin vào User và Goods
_.extend(User.prototype, LogMixin);
_.extend(Goods.prototype, LogMixin);

var user = new User();
user.actionLog(); // ✅ Hoạt động!

// Tự viết hàm Mixin:
function setMixin(target, mixin) {
  if (arguments[2]) {
    // Copy chỉ các method được chỉ định
    for (var i = 2; i < arguments.length; i++) {
      target.prototype[arguments[i]] = mixin.prototype[arguments[i]];
    }
  } else {
    // Copy tất cả methods
    for (var methodName in mixin.prototype) {
      if (!Object.hasOwnProperty(target.prototype, methodName)) {
        target.prototype[methodName] = mixin.prototype[methodName];
      }
    }
  }
}
```

### Mixin trong React (createClass — đã deprecated!)

```javascript
// ⚠️ CHỈ HOẠT ĐỘNG VỚI React.createClass (đã bỏ!)
var LogMixin = {
  log: function () {
    console.log("log");
  },
  componentDidMount: function () {
    console.log("vào trang");
  },
  componentWillUnmount: function () {
    console.log("rời trang");
  },
};

var User = React.createClass({
  mixins: [LogMixin], // ← "Trộn" LogMixin vào component
  render: function () {
    return <div>...</div>;
  },
});
// → User tự động có log(), componentDidMount, componentWillUnmount!
```

```
TẠI SAO MIXIN BỊ BỎ — 3 VẤN ĐỀ CHẾT NGƯỜI:
═══════════════════════════════════════════════════════════════

  (React official: "Mixins Considered Harmful")

  ① PHỤ THUỘC NGẦM — Tightly coupled
  → Mixin A dùng this.state.x
  → Mixin B cũng dùng this.state.x
  → Thay đổi A → B hỏng! Không biết tại sao!
  → Mixin phụ thuộc vào internal state của component 💀

  ② XUNG ĐỘT TÊN — Name collision
  → Mixin A có method handleChange()
  → Mixin B cũng có handleChange()
  → Dùng cả 2 → XÓA MẤT method của nhau! 💀

  ③ ĐỘ PHỨC TẠP TĂNG KIỂU TUYẾT LĂN — Snowball
  → Mixin nhỏ ban đầu → component biết về mixin
  → Thêm logic → mixin phình to
  → Thêm mixin nữa → component không hiểu nổi
  → KHÔNG THỂ REFACTOR vì quá nhiều thứ phụ thuộc!

  KẾT LUẬN: React KHÔNG còn khuyến khích Mixin!
  → Thay thế bằng HOC (Higher-Order Components)
```

---

## §3. Decorator Pattern — Nền tảng cho HOC

```
DECORATOR PATTERN (Mẫu Trang trí):
═══════════════════════════════════════════════════════════════

  Ý tưởng: THÊM chức năng cho object khi RUNTIME
  → Không thay đổi bản thân object!
  → Nhẹ hơn kế thừa (inheritance)

  Minh họa:
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │   ┌─────────┐    ┌──────────────┐                 │
  │   │ Cà phê  │ → │ Cà phê       │                 │
  │   │ đen     │    │ + sữa       │   ← Decorator 1 │
  │   │         │    │ + đường     │   ← Decorator 2 │
  │   └─────────┘    └──────────────┘                 │
  │                                                    │
  │   Object gốc      Object được "trang trí"        │
  │   KHÔNG THAY ĐỔI  THÊM chức năng mới             │
  └────────────────────────────────────────────────────┘

  HOC chính là DECORATOR PATTERN trong React!
  → Nhận component gốc → trả về component MỚI (đã tăng cường)
  → Component gốc KHÔNG BỊ THAY ĐỔI!
```

---

## §4. HOC — 2 Cách triển khai

```
HOC LÀ GÌ?
═══════════════════════════════════════════════════════════════

  HOC = Higher-Order Component
  = Hàm nhận component → trả về component MỚI (đã tăng cường)

  KHÔNG PHẢI React API!
  Chỉ là một PATTERN tự nhiên từ tính composition của React.

  const EnhancedComponent = higherOrderComponent(WrappedComponent);
```

### Cách 1: Property Proxy (Ủy quyền thuộc tính)

```javascript
// HOC TRẢ VỀ component MỚI, gói component gốc bên trong
function proxyHOC(WrappedComponent) {
  return class extends Component {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

// HOC TRƯỜNG HỢP: Ẩn/hiện component
function visible(WrappedComponent) {
  return class extends Component {
    render() {
      const { visible, ...props } = this.props;
      if (visible === false) return null;
      return <WrappedComponent {...props} />;
    }
  };
}
```

```
PROPERTY PROXY — CÓ THỂ LÀM GÌ:
═══════════════════════════════════════════════════════════════

  ✅ Thao tác tất cả props đầu vào
  ✅ Truy cập lifecycle của component
  ✅ Truy cập static methods
  ✅ Lấy refs

  ❌ KHÔNG thể thao tác state gốc
  ❌ KHÔNG thể hijack render trực tiếp

  Cấu trúc:
  ┌──────────────────────────────┐
  │ HOC Component (cha)         │
  │  ┌──────────────────────┐   │
  │  │ Wrapped Component    │   │
  │  │ (con, nhận props)    │   │
  │  └──────────────────────┘   │
  └──────────────────────────────┘
```

### Cách 2: Reverse Inheritance (Kế thừa ngược)

```javascript
// HOC KẾ THỪA TỪ component gốc!
function inheritHOC(WrappedComponent) {
  return class extends WrappedComponent {
    // ← extends gốc!
    render() {
      return super.render(); // Gọi render() gốc
    }
  };
}
```

```
REVERSE INHERITANCE — MẠNH HƠN:
═══════════════════════════════════════════════════════════════

  ✅ Tất cả khả năng của Property Proxy
  ✅ Thao tác STATE gốc (via this.state)
  ✅ Render Hijacking (chặn + sửa render output)

  ⚠️ Nguy hiểm hơn — có thể gây conflict!

  Cấu trúc:
  ┌──────────────────────────────┐
  │ HOC extends WrappedComponent │
  │ → Truy cập this.state       │
  │ → Truy cập this.props       │
  │ → Override render()         │
  │ → Gọi super.render()       │
  └──────────────────────────────┘

  SO SÁNH 2 CÁCH:
  ┌────────────────┬────────────────┬──────────────────┐
  │ Khả năng       │ Property Proxy │ Reverse Inherit. │
  ├────────────────┼────────────────┼──────────────────┤
  │ Thao tác props │ ✅             │ ✅               │
  │ Lifecycle      │ ✅             │ ✅               │
  │ Static methods │ ✅             │ ✅               │
  │ Lấy refs       │ ✅             │ ✅               │
  │ Thao tác state │ ❌             │ ✅               │
  │ Render hijack  │ ❌             │ ✅               │
  │ An toàn        │ ✅ Cao         │ ⚠️ Thấp hơn     │
  └────────────────┴────────────────┴──────────────────┘
```

---

## §5. HOC — 6 Khả năng

### 5a. Kết hợp render (Composite Rendering)

```javascript
// Thêm layout/style bao quanh component gốc
function styleHOC(WrappedComponent) {
  return class extends Component {
    render() {
      return (
        <div>
          <div className="title">{this.props.title}</div>
          <WrappedComponent {...this.props} />
        </div>
      );
    }
  };
}
```

### 5b. Render có điều kiện (Conditional Rendering)

```javascript
// Hiển thị hoặc ẩn dựa trên props
function visibleHOC(WrappedComponent) {
  return class extends Component {
    render() {
      if (this.props.visible === false) return null;
      return <WrappedComponent {...this.props} />;
    }
  };
}
```

### 5c. Thao tác Props

```javascript
// Thêm, sửa, xóa props trước khi truyền xuống
function proxyHOC(WrappedComponent) {
  return class extends Component {
    render() {
      const newProps = {
        ...this.props,
        user: "ConardLi", // ← Thêm prop mới!
      };
      return <WrappedComponent {...newProps} />;
    }
  };
}
```

### 5d. Lấy Refs

```javascript
// Truy cập ref của component gốc
function refHOC(WrappedComponent) {
  return class extends Component {
    componentDidMount() {
      this.wrapperRef.log(); // Gọi method của component gốc!
    }
    render() {
      return (
        <WrappedComponent
          {...this.props}
          ref={(ref) => {
            this.wrapperRef = ref;
          }}
        />
      );
    }
  };
}
```

### 5e. Quản lý State (Property Proxy)

```javascript
// Trích state ra khỏi component → biến thành controlled component
function proxyHOC(WrappedComponent) {
  return class extends Component {
    constructor(props) {
      super(props);
      this.state = { value: "" };
    }
    onChange = (event) => {
      const { onChange } = this.props;
      this.setState({ value: event.target.value }, () => {
        if (typeof onChange === "function") onChange(event);
      });
    };
    render() {
      const newProps = {
        value: this.state.value,
        onChange: this.onChange,
      };
      return <WrappedComponent {...this.props} {...newProps} />;
    }
  };
}
```

### 5f. Render Hijacking (Reverse Inheritance)

```javascript
// Chặn render output → sửa đổi React elements!
function hijackHOC(WrappedComponent) {
  return class extends WrappedComponent {
    render() {
      const tree = super.render();
      // React elements là IMMUTABLE (writable: false)!
      // → Phải dùng React.cloneElement() để tạo bản sao mới!
      let newProps = {};
      if (tree && tree.type === "input") {
        newProps = { value: "Render đã bị chặn!" };
      }
      const props = Object.assign({}, tree.props, newProps);
      return React.cloneElement(tree, props, tree.props.children);
    }
  };
}
```

```
TẠI SAO PHẢI DÙNG cloneElement?
═══════════════════════════════════════════════════════════════

  React.createElement() tạo ra React Element
  → Tất cả properties đều writable: false (IMMUTABLE!)
  → KHÔNG THỂ sửa trực tiếp: tree.props.value = 'xxx' ❌

  React.cloneElement(element, props, children)
  → Tạo BẢN SAO mới với props mới
  → Giữ key và ref từ element gốc
  → Tương đương: <element.type {...element.props} {...props}>
```

---

## §6. HOC — Cách sử dụng

### 6a. Gọi hàm cơ bản

```javascript
class MyComponent extends Component {
  render() {
    return <span>Component gốc</span>;
  }
}

// Gọi HOC → nhận component đã tăng cường
export default inheritHOC(MyComponent);
```

### 6b. Compose — Kết hợp nhiều HOC

```javascript
// ❌ KHÓ ĐỌC — nhiều HOC lồng nhau:
logger(visible(style(Input)));

// ✅ COMPOSE — dễ đọc hơn:
const compose = (...fns) =>
  fns.reduce(
    (f, g) =>
      (...args) =>
        g(f(...args)),
  );
compose(logger, visible, style)(Input);

// Nhiều thư viện cung cấp compose:
// → lodash.flowRight
// → Redux combineReducers
```

```
COMPOSE — DECORATOR PATTERN VISUALIZATION:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────────────────┐
  │ logger                            │
  │  ┌────────────────────────────┐   │
  │  │ visible                    │   │
  │  │  ┌─────────────────────┐   │   │
  │  │  │ style               │   │   │
  │  │  │  ┌──────────────┐   │   │   │
  │  │  │  │   Input      │   │   │   │
  │  │  │  │  (gốc)       │   │   │   │
  │  │  │  └──────────────┘   │   │   │
  │  │  └─────────────────────┘   │   │
  │  └────────────────────────────┘   │
  └───────────────────────────────────┘

  → Mỗi lớp HOC bao quanh component bên trong
  → Component gốc KHÔNG BỊ THAY ĐỔI!
```

### 6c. ES7 Decorators (@)

```javascript
// Cần cài: babel-plugin-transform-decorators-legacy
// Config: "plugins": ["transform-decorators-legacy"]

@logger
@visible
@style
class Input extends Component {
  // ...
}

// Kết hợp compose + decorator:
const hoc = compose(logger, visible, style);
@hoc
class Input extends Component {
  // ...
}
```

---

## §7. HOC — 5 Ứng dụng thực tế

### 7a. Ghi log (Logging)

```javascript
function logHOC(WrappedComponent) {
  return class extends Component {
    componentWillMount() {
      this.start = Date.now();
    }
    componentDidMount() {
      this.end = Date.now();
      console.log(
        `${WrappedComponent.displayName} render: ${this.end - this.start}ms`,
      );
      console.log(`${user} vào ${WrappedComponent.displayName}`);
    }
    componentWillUnmount() {
      console.log(`${user} rời ${WrappedComponent.displayName}`);
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
```

### 7b. Kiểm tra quyền (Access Control)

```javascript
function auth(WrappedComponent) {
    return class extends Component {
        render() {
            const { visible, auth, display = null, ...props } = this.props;
            // Nếu ẩn HOẶC không có quyền → hiện component thay thế (hoặc null)
            if (visible === false || (auth && authList.indexOf(auth) === -1)) {
                return display;
            }
            return <WrappedComponent {...props} />;
        }
    };
}

// Sử dụng:
@auth
class Input extends Component { /* ... */ }

<Button auth="user/addUser">Thêm người dùng</Button>
<Input auth="user/search" visible={false} />
```

### 7c. Two-way Binding (Liên kết hai chiều)

```javascript
// Form component cung cấp context cho các children
class Form extends Component {
  static childContextTypes = {
    model: PropTypes.object,
    changeModel: PropTypes.func,
  };
  constructor(props, context) {
    super(props, context);
    this.state = { model: props.model || {} };
  }
  changeModel = (name, value) => {
    this.setState({ model: { ...this.state.model, [name]: value } });
  };
  getChildContext() {
    return {
      changeModel: this.changeModel,
      model: this.props.model || this.state.model,
    };
  }
  onSubmit = () => console.log(this.state.model);
  render() {
    return (
      <div>
        {this.props.children}
        <button onClick={this.onSubmit}>Submit</button>
      </div>
    );
  }
}

// HOC proxy onChange + value qua context
function proxyHOC(WrappedComponent) {
  return class extends Component {
    static contextTypes = {
      model: PropTypes.object,
      changeModel: PropTypes.func,
    };
    onChange = (event) => {
      this.context.changeModel(this.props.v_model, event.target.value);
    };
    render() {
      const { model } = this.context;
      return (
        <WrappedComponent
          {...this.props}
          value={model[this.props.v_model]}
          onChange={this.onChange}
        />
      );
    }
  };
}

// Sử dụng — giống v-model trong Vue!
<Form>
  <Input v_model="name" />
  <Input v_model="pwd" />
</Form>;
```

### 7d. Form Validation

```javascript
function validateHOC(WrappedComponent) {
    return class extends Component {
        state = { error: '' };
        onChange = (event) => {
            const { validator } = this.props;
            if (validator && typeof validator.func === 'function') {
                if (!validator.func(event.target.value)) {
                    this.setState({ error: validator.msg });
                } else {
                    this.setState({ error: '' });
                }
            }
        };
        render() {
            return (
                <div>
                    <WrappedComponent onChange={this.onChange} {...this.props} />
                    <div style={{ color: 'red' }}>{this.state.error}</div>
                </div>
            );
        }
    };
}

// Sử dụng:
<HOCInput validator={{ func: v => v && !isNaN(v), msg: 'Nhập số!' }} v_model="name" />
<HOCInput validator={{ func: v => v && v.length > 6, msg: 'Mật khẩu > 6 ký tự' }} v_model="pwd" />
```

### 7e. Redux Connect (đơn giản hóa)

```javascript
export const connect =
  (mapStateToProps, mapDispatchToProps) => (WrappedComponent) => {
    class Connect extends Component {
      static contextTypes = { store: PropTypes.object };
      state = { allProps: {} };

      componentWillMount() {
        const { store } = this.context;
        this._updateProps();
        store.subscribe(() => this._updateProps());
      }

      _updateProps() {
        const { store } = this.context;
        const stateProps = mapStateToProps
          ? mapStateToProps(store.getState(), this.props)
          : {};
        const dispatchProps = mapDispatchToProps
          ? mapDispatchToProps(store.dispatch, this.props)
          : {};
        this.setState({
          allProps: { ...stateProps, ...dispatchProps, ...this.props },
        });
      }

      render() {
        return <WrappedComponent {...this.state.allProps} />;
      }
    }
    return Connect;
  };

// connect chỉ làm 1 việc:
// → Giải nén mapStateToProps + mapDispatchToProps
// → Truyền state & dispatch vào component gốc qua props
```

---

## §8. HOC — 5 Lưu ý quan trọng

```
5 LƯU Ý KHI DÙNG HOC:
═══════════════════════════════════════════════════════════════

  ⚠️ ① STATIC METHODS BỊ MẤT!
  → HOC trả về component MỚI → static methods không tự copy!
  → Fix: dùng hoist-non-react-statics

  ⚠️ ② REFS KHÔNG TRUYỀN THẲNG!
  → ref trỏ vào HOC wrapper, KHÔNG phải component gốc!
  → Fix: React.forwardRef (16.3+)

  ⚠️ ③ KHÔNG TẠO HOC TRONG render()!
  → Mỗi render() → HOC mới → component mới → UNMOUNT + REMOUNT!
  → React diff thấy identity khác → xóa cây cũ, tạo cây mới!
  → State mất hết! Performance tệ! 💀

  ⚠️ ④ KHÔNG THAY ĐỔI component gốc!
  → HOC là pure function, không có side effects!
  → Chỉ TĂNG CƯỜNG, không THAY ĐỔI!

  ⚠️ ⑤ TRUYỀN THẲNG props không liên quan!
  → HOC chỉ dùng vài props → phải forward phần còn lại!
  → const { myProp, ...rest } = this.props;
  → <WrappedComponent {...rest} />
```

```javascript
// ⚠️ ① Fix Static Methods:
import hoistNonReactStatic from 'hoist-non-react-statics';

function proxyHOC(WrappedComponent) {
    class HOCComponent extends Component {
        render() { return <WrappedComponent {...this.props} />; }
    }
    hoistNonReactStatic(HOCComponent, WrappedComponent); // ← Copy statics!
    return HOCComponent;
}

// ⚠️ ② Fix Refs — React.forwardRef (16.3+):
function hoc(WrappedComponent) {
    class HOC extends Component {
        render() {
            const { forwardedRef, ...props } = this.props;
            return <WrappedComponent ref={forwardedRef} {...props} />;
        }
    }
    return React.forwardRef((props, ref) => {
        return <HOC forwardedRef={ref} {...props} />;
    });
}

// ⚠️ ⑤ Convention — displayName cho DevTools:
static displayName = `Visible(${WrappedComponent.displayName || WrappedComponent.name})`;
```

```
TẠI SAO HOC TỐT HƠN MIXIN:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬─────────────┬──────────────────────────┐
  │ Vấn đề          │ Mixin       │ HOC                      │
  ├─────────────────┼─────────────┼──────────────────────────┤
  │ Phụ thuộc ngầm  │ ❌ Có       │ ✅ Không (pure function) │
  │ Xung đột tên    │ ❌ Có       │ ⚠️ Có thể tránh         │
  │ Phức tạp tăng   │ ❌ Snowball │ ✅ Không — component gốc │
  │                 │             │   không biết về HOC      │
  └─────────────────┴─────────────┴──────────────────────────┘

  NHƯNG HOC VẪN CÓ HẠN CHẾ:
  → Wrapper Hell — nhiều HOC lồng nhau → khó debug!
  → Props hijacking — có thể ghi đè props nếu không cẩn thận
  → Khó theo dõi dữ liệu đến từ HOC nào
```

---

## §9. Hooks — useState, useEffect, useRef

```
HOOKS LÀ GÌ?
═══════════════════════════════════════════════════════════════

  React v16.8.0 (2019) — CHÍNH THỨC ỔN ĐỊNH

  Hooks = Dùng state và các tính năng React
          TRONG functional component!
  → Không cần class!
  → Không cần this!
  → Logic tái sử dụng qua CUSTOM HOOKS!

  Giải quyết ĐỒNG THỜI vấn đề của Mixin VÀ HOC! ⭐
```

### 9a. useState

```javascript
// Class component:
class Count extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }
  render() {
    return (
      <div>
        <p>Bạn đã click {this.state.count} lần</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Click me
        </button>
      </div>
    );
  }
}

// ✅ Hooks — NGẮN GỌN HƠN RẤT NHIỀU:
function Count() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Bạn đã click {count} lần</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}

// useState(initialValue) → [currentValue, setterFunction]
// → Có thể gọi NHIỀU LẦN cho nhiều state khác nhau
```

### 9b. useEffect

```javascript
// useEffect(callback, dependencies)
// → callback chạy SAU mỗi render (không block render!)
// → dependencies: mảng state → chỉ chạy khi state thay đổi

// Chạy mỗi render:
useEffect(() => {
  console.log("Render xong!");
});

// Chỉ chạy khi count thay đổi:
useEffect(() => {
  console.log("count thay đổi:", count);
}, [count]);

// Cleanup function — chạy TRƯỚC effect tiếp theo:
useEffect(() => {
  console.log("Thực thi...", count);
  return () => {
    console.log("Dọn dẹp...", count); // ← Cleanup effect trước!
  };
}, [count]);
```

```
useEffect CLEANUP — THỨ TỰ THỰC THI:
═══════════════════════════════════════════════════════════════

  Click 3 lần:

  Render trang...1
  Thực thi... 1       ← Effect chạy sau render

  Render trang...2
  Dọn dẹp... 1        ← Cleanup của effect CŨ (count=1)
  Thực thi... 2       ← Effect mới

  Render trang...3
  Dọn dẹp... 2        ← Cleanup của effect cũ (count=2)
  Thực thi... 3       ← Effect mới

  TẠI SAO CLEANUP CÓ GIÁ TRỊ CŨ?
  → useEffect trả về FUNCTION → tạo CLOSURE!
  → Closure "nhớ" biến từ lần render trước
  → Giống như: clean = effect(1); flag = 2; clean(); // in 1!
```

```javascript
// Mô phỏng componentDidMount:
function useDidMount(callback) {
  useEffect(callback, []); // [] → chỉ chạy 1 lần sau mount!
}

// Mô phỏng componentWillUnmount:
function useUnMount(callback) {
  useEffect(() => callback, []); // cleanup chỉ chạy khi unmount!
}

// Mô phỏng componentDidUpdate (BỎ QUA lần mount đầu):
function useDidUpdate(callback, deps) {
  const init = useRef(true);
  useEffect(() => {
    if (init.current) {
      init.current = false; // Lần đầu → bỏ qua!
    } else {
      return callback();
    }
  }, deps);
}
```

### 9c. useRef

```javascript
// Lấy DOM ref:
function Input() {
  const inputEl = useRef(null);
  const onButtonClick = () => {
    inputEl.current.focus(); // ← .current chứa DOM element!
  };
  return (
    <div>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus input</button>
    </div>
  );
}

// useRef KHÔNG CHỈ cho DOM!
// → .current là mutable container, lưu BẤT KỲ giá trị nào
// → Thay đổi .current KHÔNG gây re-render!
// → Dùng để lưu giá trị qua các render (giống instance variable)
```

---

## §10. Custom Hooks — Tái sử dụng logic

```
CUSTOM HOOKS:
═══════════════════════════════════════════════════════════════

  → Hàm bắt đầu bằng "use" (convention)
  → Bên trong dùng useState, useEffect, useRef...
  → Trích logic ra khỏi component → TÁI SỬ DỤNG được!
  → Không wrapper hell! Không HOC nesting! ✅
```

```javascript
// ① useLogger — Ghi log lifecycle
const useLogger = (componentName, ...params) => {
  useDidMount(() => {
    console.log(`${componentName} khởi tạo`, ...params);
  });
  useUnMount(() => {
    console.log(`${componentName} hủy`, ...params);
  });
  useDidUpdate(() => {
    console.log(`${componentName} cập nhật`, ...params);
  });
};

function Page1(props) {
  useLogger("Page1", props);
  return <div>...</div>;
}

// ② useTitle — Thay đổi document.title
function useTitle(title) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = "Trang chủ";
    };
  }, [title]);
}

function Page1() {
  useTitle("Trang 1");
  return <div>...</div>;
}

// ③ useBind — Two-way binding cho form
function useBind(init) {
  const [value, setValue] = useState(init);
  const onChange = useCallback((event) => {
    setValue(event.currentTarget.value);
  }, []);
  return { value, onChange };
}

function Page1() {
  const name = useBind("");
  const pwd = useBind("");
  return (
    <div>
      <input {...name} placeholder="Tên" />
      <input {...pwd} type="password" placeholder="Mật khẩu" />
    </div>
  );
}
// → Cực kỳ sạch! Không wrapper, không context, không HOC!
```

---

## §11. Hooks — Quy tắc & Hạn chế

```
2 QUY TẮC BẮT BUỘC CỦA HOOKS:
═══════════════════════════════════════════════════════════════

  ① CHỈ GỌI Ở TOP LEVEL!
  → KHÔNG gọi trong loops, conditions, hay nested functions!
  → Tại sao? Hooks dùng MẢNG nội bộ + index!
  → Mỗi render phải gọi cùng số hooks, cùng thứ tự!
  → If/loop thay đổi thứ tự → index lệch → SAI STATE! 💀

  ② CHỈ GỌI TRONG REACT FUNCTIONS!
  → Functional components
  → Custom Hooks (hàm bắt đầu bằng "use")
  → KHÔNG gọi trong: class component, regular function, callback

  CÀI ĐẶT ESLINT ĐỂ KIỂM TRA:
  npm install eslint-plugin-react-hooks --save-dev

  // .eslintrc:
  {
    "plugins": ["react-hooks"],
    "rules": {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
```

```
TẠI SAO THỨ TỰ QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  React lưu hooks trong LINKED LIST theo thứ tự gọi:

  Render 1:                    Render 2:
  useState(0)  → slot 0       useState(0)  → slot 0 ✅
  useState('') → slot 1       useState('') → slot 1 ✅
  useEffect(f) → slot 2       useEffect(f) → slot 2 ✅

  NẾU CÓ CONDITION:
  if (name !== '') {
    useEffect(...);  // ← Có thể BỊ BỎ QUA!
  }

  Render 1: (name = 'Jun')    Render 2: (name = '')
  useState(0)  → slot 0       useState(0)  → slot 0 ✅
  useState('') → slot 1       useState('') → slot 1 ✅
  useEffect(f) → slot 2       ← BỊ BỎ QUA!
                               useRef(null) → slot 2 ← SAI! Đây là slot 3!
  → Index lệch → TẤT CẢ hooks phía sau bị SAI! 💀
```

---

## §12. So sánh Mixin vs HOC vs Hooks

```
BẢNG SO SÁNH TOÀN DIỆN:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────┬──────────┬───────────────┐
  │ Tiêu chí           │ Mixin    │ HOC      │ Hooks         │
  ├────────────────────┼──────────┼──────────┼───────────────┤
  │ Tái sử dụng logic  │ ✅       │ ✅       │ ✅            │
  │ Phụ thuộc ngầm     │ ❌ Có    │ ✅ Không │ ✅ Không      │
  │ Xung đột tên       │ ❌ Có    │ ⚠️ Props │ ✅ Không      │
  │ Wrapper nesting    │ ✅ Không │ ❌ Nhiều │ ✅ Không      │
  │ Debug dễ           │ ❌       │ ⚠️       │ ✅            │
  │ Hiểu data nguồn từ │ ❌ Khó   │ ⚠️ Khó  │ ✅ Rõ ràng    │
  │ Dùng với class     │ ✅       │ ✅       │ ❌            │
  │ Dùng với function  │ ❌       │ ✅       │ ✅            │
  │ Trạng thái         │ ❌ Chết  │ ✅ Dùng  │ ⭐ Tương lai  │
  └────────────────────┴──────────┴──────────┴───────────────┘

  MIXIN:
  → Component và Mixin TRỘN LẪN → khó tách rời
  → Hình tròn chồng nhau → ranh giới mờ

  HOC:
  → Các lớp BỌC QUANH component → rõ ràng hơn
  → Nhưng lồng quá nhiều → wrapper hell

  HOOKS:
  → Logic PHẲNG — không wrapper, không nesting
  → Gọi hook → nhận giá trị → xong!
```

```
KHI NÀO DÙNG GÌ:
═══════════════════════════════════════════════════════════════

  ① Dự án mới, functional components → HOOKS ⭐
  ② Dự án cũ, class components → HOC
  ③ Shared layout / conditional render → HOC
  ④ Reuse stateful logic → HOOKS (custom hook)
  ⑤ Redux connect, React Router withRouter → HOC (thư viện)
  ⑥ Never ever → MIXIN ❌

  React team: "Không có kế hoạch remove class components"
  → class + hooks có thể CÙNG TỒN TẠI
  → Không cần refactor toàn bộ
```

---

## §13. Tổng kết & Checklist phỏng vấn

### Checklist

- [ ] **Mixin**: copy properties giữa objects, `_.extend()`, `React.createClass({ mixins: [...] })`
- [ ] **Mixin 3 hại**: phụ thuộc ngầm, xung đột tên, phức tạp tuyết lăn
- [ ] **Decorator pattern**: thêm chức năng runtime, không thay đổi object gốc
- [ ] **HOC definition**: hàm nhận component → trả về component MỚI (đã tăng cường)
- [ ] **Property Proxy**: return class wraps `<WrappedComponent />`, proxy props
- [ ] **Reverse Inheritance**: return class extends WrappedComponent, access state + render hijack
- [ ] **6 khả năng HOC**: composite render, conditional render, manipulate props, refs, state management, render hijacking
- [ ] **React.cloneElement**: vì React elements là immutable (writable: false)
- [ ] **compose**: `const compose = (...fns) => fns.reduce((f,g) => (...args) => g(f(...args)))`
- [ ] **ES7 @decorator**: `@logger @visible class Input` — cần babel plugin
- [ ] **HOC ứng dụng**: logging, auth/access control, two-way binding, form validation, Redux connect
- [ ] **5 lưu ý HOC**: static copy (hoist-non-react-statics), refs (forwardRef), không tạo trong render(), không mutate gốc, pass-through props
- [ ] **displayName convention**: `HOCName(WrappedComponentName)` cho DevTools
- [ ] **useState**: `const [val, setVal] = useState(init)` — state trong function component
- [ ] **useEffect**: callback sau render, cleanup trả về function (closure!), deps array
- [ ] **useEffect []**: = componentDidMount (chạy 1 lần)
- [ ] **useEffect cleanup**: chạy TRƯỚC effect tiếp theo, closure giữ giá trị cũ
- [ ] **useRef**: `.current` mutable container, không gây re-render, lưu bất kỳ giá trị
- [ ] **Custom Hooks**: hàm `use*`, trích logic + state, TÁI SỬ DỤNG không wrapper
- [ ] **Hooks rules**: chỉ top-level (không if/loop), chỉ React functions, vì linked list + index
- [ ] **Kết luận**: Mixin (chết) → HOC (đang dùng) → Hooks (tương lai) ⭐

---

_Nguồn: "React In-Depth: Từ Mixin đến HOC và Hooks" — TikTok Front-End Team (ByteDance) · 70,309 lượt đọc_
_Cập nhật lần cuối: Tháng 2, 2026_
