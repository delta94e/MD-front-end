# React.js Accessibility — Triển Khai Thực Tế! Deep Dive!

> **Chủ đề**: Examples of implementing Web accessibility in React.js
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. React & A11y — Tổng Quan Vấn Đề!](#1)
2. [§2. Semantic HTML Trong React!](#2)
3. [§3. Focus Management — SPA Challenge!](#3)
4. [§4. Accessible Forms!](#4)
5. [§5. Keyboard Navigation!](#5)
6. [§6. Live Regions & Dynamic Content!](#6)
7. [§7. Accessible Modal!](#7)
8. [§8. Skip Link & Routing!](#8)
9. [§9. Tự Viết — Accessible Component Library!](#9)
10. [§10. Tổng Kết & Câu Hỏi Phỏng Vấn!](#10)

---

## §1. React & A11y — Tổng Quan Vấn Đề!

```
  REACT & ACCESSIBILITY — CÁC VẤN ĐỀ ĐẶC THÙ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React là SPA → có NHIỀU vấn đề a11y hơn MPA!        │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  VẤN ĐỀ #1: SPA ROUTING                         │  │
  │  │  MPA: navigate → browser tải trang mới →        │  │
  │  │       screen reader đọc <title> mới!            │  │
  │  │  SPA: navigate → JS swap content →               │  │
  │  │       screen reader KHÔNG BIẾT!                  │  │
  │  │  → Phải TỰ announce page change!                │  │
  │  │  → Phải TỰ move focus!                          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  VẤN ĐỀ #2: DYNAMIC CONTENT                     │  │
  │  │  React setState → DOM cập nhật →                 │  │
  │  │  Screen reader KHÔNG TỰ ĐỌC content mới!       │  │
  │  │  → Phải dùng aria-live hoặc focus management!   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  VẤN ĐỀ #3: JSX = HTML-like nhưng KHÁC!        │  │
  │  │  → htmlFor (không for)                          │  │
  │  │  → className (không class)                      │  │
  │  │  → tabIndex (camelCase)                         │  │
  │  │  → aria-* GIỮ NGUYÊN dấu gạch ngang!           │  │
  │  │    aria-label, aria-describedby, aria-expanded  │  │
  │  │  → role GIỮ NGUYÊN lowercase!                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  VẤN ĐỀ #4: DIV SOUP                            │  │
  │  │  React components hay return <div> bọc ngoài!   │  │
  │  │  → Dùng Fragment <> thay div không cần thiết!   │  │
  │  │  → Dùng semantic HTML: header, nav, main...     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  VẤN ĐỀ #5: EVENT HANDLERS                      │  │
  │  │  <div onClick> → KHÔNG keyboard accessible!     │  │
  │  │  → Phải dùng <button onClick>!                  │  │
  │  │  → Hoặc thêm: role, tabIndex, onKeyDown!       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Semantic HTML Trong React!

```javascript
// ═══════════════════════════════════════════════════════════
// ❌ SAI — DIV SOUP:
// ═══════════════════════════════════════════════════════════

function BadPage() {
  return React.createElement(
    "div",
    { className: "page" },
    React.createElement(
      "div",
      { className: "header" },
      React.createElement(
        "div",
        { className: "nav" },
        React.createElement(
          "div",
          {
            className: "nav-item",
            onClick: function () {
              navigate("/");
            },
          },
          "Home",
        ),
        React.createElement(
          "div",
          {
            className: "nav-item",
            onClick: function () {
              navigate("/about");
            },
          },
          "About",
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "content" },
      React.createElement("div", { className: "title" }, "Xin chào"),
      React.createElement("div", { className: "text" }, "Nội dung..."),
    ),
    React.createElement("div", { className: "footer" }, "© 2024"),
  );
  // → Screen reader: "generic, generic, generic..."
  // → Keyboard: KHÔNG Tab được vào nav items!
  // → Google: KHÔNG hiểu cấu trúc!
}

// ═══════════════════════════════════════════════════════════
// ✅ ĐÚNG — SEMANTIC HTML:
// ═══════════════════════════════════════════════════════════

function GoodPage() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "header",
      null,
      React.createElement(
        "nav",
        {
          "aria-label": "Điều hướng chính",
        },
        React.createElement(
          "ul",
          null,
          React.createElement(
            "li",
            null,
            React.createElement(
              "a",
              {
                href: "/",
                "aria-current": "page",
              },
              "Home",
            ),
          ),
          React.createElement(
            "li",
            null,
            React.createElement(
              "a",
              {
                href: "/about",
              },
              "About",
            ),
          ),
        ),
      ),
    ),
    React.createElement(
      "main",
      null,
      React.createElement("h1", null, "Xin chào"),
      React.createElement("p", null, "Nội dung..."),
    ),
    React.createElement(
      "footer",
      null,
      React.createElement("p", null, "© 2024"),
    ),
  );
  // → SR: "banner, navigation, link Home, main, heading 1..."
  // → Keyboard: Tab focus vào links tự nhiên!
}

// ═══════════════════════════════════════════════════════════
// ❌ vs ✅ INTERACTIVE ELEMENTS:
// ═══════════════════════════════════════════════════════════

// ❌ SAI:
function BadButton(props) {
  return React.createElement(
    "div",
    {
      className: "btn",
      onClick: props.onClick,
    },
    props.children,
  );
  // → Không focus, không keyboard, không role!
}

// ✅ ĐÚNG:
function GoodButton(props) {
  return React.createElement(
    "button",
    {
      className: "btn",
      onClick: props.onClick,
      type: props.type || "button",
      disabled: props.disabled,
      "aria-label": props.ariaLabel,
    },
    props.children,
  );
  // → Tự có: focus, Enter/Space, role="button"!
}

// ❌ SAI: Link giả
function BadLink(props) {
  return React.createElement(
    "span",
    {
      className: "link",
      onClick: function () {
        window.location = props.href;
      },
    },
    props.children,
  );
}

// ✅ ĐÚNG: Link thật
function GoodLink(props) {
  return React.createElement(
    "a",
    {
      href: props.href,
      target: props.external ? "_blank" : null,
      rel: props.external ? "noopener noreferrer" : null,
    },
    props.children,
    props.external
      ? React.createElement(
          "span",
          {
            className: "sr-only",
          },
          " (mở tab mới)",
        )
      : null,
  );
  // → SR: "link text (mở tab mới), link"
  // → Keyboard: Tab + Enter tự nhiên!
}
```

---

## §3. Focus Management — SPA Challenge!

```javascript
// ═══════════════════════════════════════════════════════════
// ① HOOK: useFocusOnMount
// Focus vào element khi component mount!
// ═══════════════════════════════════════════════════════════

function useFocusOnMount(ref) {
  React.useEffect(function () {
    if (ref.current) {
      // Delay nhỏ để DOM sẵn sàng:
      var timer = setTimeout(function () {
        ref.current.focus();
      }, 50);
      return function () {
        clearTimeout(timer);
      };
    }
  }, []);
}

// Sử dụng:
function PageContent(props) {
  var headingRef = React.useRef(null);
  useFocusOnMount(headingRef);

  return React.createElement(
    "main",
    null,
    React.createElement(
      "h1",
      {
        ref: headingRef,
        tabIndex: -1, // focusable bằng JS, không Tab!
      },
      props.title,
    ),
    React.createElement("p", null, props.content),
  );
  // → Khi navigate đến page mới → focus vào <h1>!
  // → Screen reader đọc tiêu đề ngay!
}

// ═══════════════════════════════════════════════════════════
// ② HOOK: useFocusReturn
// Lưu focus trước khi mở modal, restore khi đóng!
// ═══════════════════════════════════════════════════════════

function useFocusReturn() {
  var triggerRef = React.useRef(null);

  React.useEffect(function () {
    // Lưu element đang focus:
    triggerRef.current = document.activeElement;

    return function () {
      // Restore focus khi unmount:
      if (triggerRef.current && triggerRef.current.focus) {
        triggerRef.current.focus();
      }
    };
  }, []);

  return triggerRef;
}

// ═══════════════════════════════════════════════════════════
// ③ HOOK: useFocusTrap
// Giữ focus BÊN TRONG container (cho modal)!
// ═══════════════════════════════════════════════════════════

function useFocusTrap(containerRef) {
  React.useEffect(function () {
    var container = containerRef.current;
    if (!container) return;

    function getFocusable() {
      return container.querySelectorAll(
        "a[href], button:not([disabled]), " +
          "input:not([disabled]), select:not([disabled]), " +
          'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    }

    function handleKeyDown(event) {
      if (event.key !== "Tab") return;

      var focusable = getFocusable();
      if (focusable.length === 0) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: nếu đang ở first → nhảy về last
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab: nếu đang ở last → nhảy về first
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    // Focus element đầu tiên:
    var focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();

    return function () {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
```

```
  FOCUS MANAGEMENT TRONG SPA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① PAGE NAVIGATION:                                   │
  │                                                        │
  │  User click "About" link                               │
  │       ↓                                                │
  │  React Router thay đổi URL                             │
  │       ↓                                                │
  │  Component <About/> mount                              │
  │       ↓                                                │
  │  useFocusOnMount → focus vào <h1>About Us</h1>        │
  │       ↓                                                │
  │  Screen reader: "About Us, heading level 1"            │
  │  → User BIẾT đã đến trang mới!                        │
  │                                                        │
  │  ② MODAL OPEN/CLOSE:                                   │
  │                                                        │
  │  User click "Edit" button                              │
  │       ↓                                                │
  │  useFocusReturn → lưu "Edit" button ref               │
  │       ↓                                                │
  │  Modal mount + useFocusTrap                            │
  │       ↓                                                │
  │  Focus → first focusable in modal                     │
  │  Tab cycle: first ↔ last (trapped!)                   │
  │       ↓                                                │
  │  User đóng modal (Escape / close button)              │
  │       ↓                                                │
  │  useFocusReturn cleanup → focus về "Edit" button      │
  │  → User QUAY LẠI đúng vị trí!                         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Accessible Forms!

```javascript
// ═══════════════════════════════════════════════════════════
// ACCESSIBLE FORM — TỰ VIẾT HOÀN CHỈNH!
// ═══════════════════════════════════════════════════════════

function AccessibleForm() {
  var state = React.useState({
    name: "",
    email: "",
    role: "",
    agree: false,
  });
  var formData = state[0];
  var setFormData = state[1];

  var errState = React.useState({});
  var errors = errState[0];
  var setErrors = errState[1];

  var errSummaryRef = React.useRef(null);

  function validate() {
    var errs = {};
    if (!formData.name.trim()) errs.name = "Vui lòng nhập họ tên";
    if (!formData.email.trim()) errs.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Email không hợp lệ";
    if (!formData.role) errs.role = "Vui lòng chọn vai trò";
    if (!formData.agree) errs.agree = "Vui lòng đồng ý điều khoản";
    return errs;
  }

  function handleSubmit(event) {
    event.preventDefault();
    var errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Focus vào error summary:
      setTimeout(function () {
        if (errSummaryRef.current) {
          errSummaryRef.current.focus();
        }
      }, 50);
      return;
    }
    // Submit OK!
  }

  function handleChange(field) {
    return function (event) {
      var value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      var updated = {};
      for (var k in formData) updated[k] = formData[k];
      updated[field] = value;
      setFormData(updated);

      // Clear error khi user sửa:
      if (errors[field]) {
        var newErrors = {};
        for (var e in errors) newErrors[e] = errors[e];
        delete newErrors[field];
        setErrors(newErrors);
      }
    };
  }

  var errorKeys = Object.keys(errors);

  return React.createElement(
    "form",
    {
      onSubmit: handleSubmit,
      "aria-label": "Đăng ký tài khoản",
      noValidate: true,
    },
    // ① ERROR SUMMARY — screen reader đọc tất cả lỗi:
    errorKeys.length > 0
      ? React.createElement(
          "div",
          {
            ref: errSummaryRef,
            role: "alert",
            tabIndex: -1,
            className: "error-summary",
          },
          React.createElement(
            "h2",
            null,
            "Có " + errorKeys.length + " lỗi cần sửa:",
          ),
          React.createElement(
            "ul",
            null,
            errorKeys.map(function (key) {
              return React.createElement(
                "li",
                { key: key },
                React.createElement(
                  "a",
                  {
                    href: "#field-" + key,
                  },
                  errors[key],
                ),
              );
            }),
          ),
        )
      : null,

    React.createElement(
      "fieldset",
      null,
      React.createElement("legend", null, "Thông tin cá nhân"),

      // ② TEXT INPUT with label + error:
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          {
            htmlFor: "field-name",
          },
          "Họ tên ",
          React.createElement(
            "span",
            {
              "aria-hidden": "true",
            },
            "*",
          ),
        ),
        React.createElement("input", {
          id: "field-name",
          type: "text",
          value: formData.name,
          onChange: handleChange("name"),
          "aria-required": "true",
          "aria-invalid": errors.name ? "true" : "false",
          "aria-describedby": errors.name ? "err-name" : null,
        }),
        errors.name
          ? React.createElement(
              "span",
              {
                id: "err-name",
                className: "error",
                role: "alert",
              },
              errors.name,
            )
          : null,
      ),

      // ③ EMAIL INPUT:
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          {
            htmlFor: "field-email",
          },
          "Email ",
          React.createElement(
            "span",
            {
              "aria-hidden": "true",
            },
            "*",
          ),
        ),
        React.createElement("input", {
          id: "field-email",
          type: "email",
          value: formData.email,
          onChange: handleChange("email"),
          "aria-required": "true",
          "aria-invalid": errors.email ? "true" : "false",
          "aria-describedby": errors.email ? "err-email" : "help-email",
        }),
        React.createElement(
          "span",
          {
            id: "help-email",
            className: "help-text",
          },
          "VD: user@example.com",
        ),
        errors.email
          ? React.createElement(
              "span",
              {
                id: "err-email",
                className: "error",
                role: "alert",
              },
              errors.email,
            )
          : null,
      ),

      // ④ SELECT:
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          {
            htmlFor: "field-role",
          },
          "Vai trò",
        ),
        React.createElement(
          "select",
          {
            id: "field-role",
            value: formData.role,
            onChange: handleChange("role"),
            "aria-required": "true",
            "aria-invalid": errors.role ? "true" : "false",
          },
          React.createElement(
            "option",
            {
              value: "",
            },
            "-- Chọn vai trò --",
          ),
          React.createElement(
            "option",
            {
              value: "dev",
            },
            "Developer",
          ),
          React.createElement(
            "option",
            {
              value: "designer",
            },
            "Designer",
          ),
        ),
      ),

      // ⑤ CHECKBOX:
      React.createElement(
        "div",
        null,
        React.createElement("input", {
          id: "field-agree",
          type: "checkbox",
          checked: formData.agree,
          onChange: handleChange("agree"),
          "aria-invalid": errors.agree ? "true" : "false",
        }),
        React.createElement(
          "label",
          {
            htmlFor: "field-agree",
          },
          "Tôi đồng ý với điều khoản sử dụng",
        ),
      ),
    ),

    React.createElement(
      "button",
      {
        type: "submit",
      },
      "Đăng ký",
    ),
  );
}
```

```
  ACCESSIBLE FORM — GIẢI THÍCH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① ERROR SUMMARY:                                     │
  │  → role="alert" → SR đọc NGAY khi xuất hiện!         │
  │  → tabIndex=-1 → focus bằng JS!                       │
  │  → Liệt kê TẤT CẢ lỗi + link đến field lỗi!        │
  │  → Click link → nhảy đến field! (href="#field-name")  │
  │                                                        │
  │  ② LABEL + INPUT:                                     │
  │  → htmlFor → liên kết label với input!                │
  │  → Click label → focus input!                         │
  │  → SR: "Họ tên, required, edit"                       │
  │                                                        │
  │  ③ REQUIRED + ERROR:                                   │
  │  → aria-required="true" → SR đọc "required"!         │
  │  → aria-invalid="true" → SR đọc "invalid entry"!     │
  │  → aria-describedby → SR đọc error message!           │
  │  → role="alert" trên error → SR đọc ngay khi có!    │
  │                                                        │
  │  ④ VISUAL * (asterisk):                                │
  │  → aria-hidden="true" → SR bỏ qua *!                 │
  │  → Vì đã có aria-required → không đọc * thừa!        │
  │                                                        │
  │  ⑤ HELP TEXT:                                          │
  │  → aria-describedby="help-email"                      │
  │  → SR: "Email, required, edit... VD: user@example"   │
  │  → Chuyển sang error khi invalid!                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Keyboard Navigation!

```javascript
// ═══════════════════════════════════════════════════════════
// ① useRovingTabIndex — Arrow key navigation!
// Dùng cho: tabs, toolbars, radio groups, menus
// ═══════════════════════════════════════════════════════════

function useRovingTabIndex(itemCount, options) {
  options = options || {};
  var orientation = options.orientation || "horizontal";
  var loop = options.loop !== false;

  var indexState = React.useState(0);
  var activeIndex = indexState[0];
  var setActiveIndex = indexState[1];
  var itemRefs = React.useRef([]);

  function setRef(index) {
    return function (el) {
      itemRefs.current[index] = el;
    };
  }

  function handleKeyDown(event) {
    var nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    var prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

    var newIndex = activeIndex;

    if (event.key === nextKey) {
      event.preventDefault();
      newIndex = activeIndex + 1;
      if (newIndex >= itemCount) {
        newIndex = loop ? 0 : itemCount - 1;
      }
    } else if (event.key === prevKey) {
      event.preventDefault();
      newIndex = activeIndex - 1;
      if (newIndex < 0) {
        newIndex = loop ? itemCount - 1 : 0;
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      newIndex = itemCount - 1;
    } else {
      return;
    }

    setActiveIndex(newIndex);
    if (itemRefs.current[newIndex]) {
      itemRefs.current[newIndex].focus();
    }
  }

  function getItemProps(index) {
    return {
      ref: setRef(index),
      tabIndex: index === activeIndex ? 0 : -1,
      onKeyDown: handleKeyDown,
    };
  }

  return {
    activeIndex: activeIndex,
    setActiveIndex: setActiveIndex,
    getItemProps: getItemProps,
  };
}

// ═══════════════════════════════════════════════════════════
// ② ACCESSIBLE TABS dùng useRovingTabIndex:
// ═══════════════════════════════════════════════════════════

function AccessibleTabs(props) {
  var tabs = props.tabs;
  var roving = useRovingTabIndex(tabs.length, {
    orientation: "horizontal",
  });
  var panelState = React.useState(0);
  var activePanel = panelState[0];
  var setActivePanel = panelState[1];

  function selectTab(index) {
    roving.setActiveIndex(index);
    setActivePanel(index);
  }

  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        role: "tablist",
        "aria-label": props.label,
      },
      tabs.map(function (tab, i) {
        var itemProps = roving.getItemProps(i);
        return React.createElement(
          "button",
          {
            key: i,
            ref: itemProps.ref,
            role: "tab",
            id: "tab-" + i,
            "aria-selected": String(i === activePanel),
            "aria-controls": "panel-" + i,
            tabIndex: itemProps.tabIndex,
            onKeyDown: function (e) {
              itemProps.onKeyDown(e);
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTab(i);
              }
            },
            onClick: function () {
              selectTab(i);
            },
          },
          tab.title,
        );
      }),
    ),
    tabs.map(function (tab, i) {
      if (i !== activePanel) return null;
      return React.createElement(
        "div",
        {
          key: i,
          role: "tabpanel",
          id: "panel-" + i,
          "aria-labelledby": "tab-" + i,
          tabIndex: 0,
        },
        tab.content,
      );
    }),
  );
}

// ═══════════════════════════════════════════════════════════
// ③ DROPDOWN MENU — Keyboard accessible:
// ═══════════════════════════════════════════════════════════

function AccessibleDropdown(props) {
  var openState = React.useState(false);
  var isOpen = openState[0];
  var setOpen = openState[1];
  var btnRef = React.useRef(null);
  var menuRef = React.useRef(null);
  var roving = useRovingTabIndex(props.items.length, {
    orientation: "vertical",
  });

  // Close khi click ngoài:
  React.useEffect(function () {
    function handleClick(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return function () {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // Focus first item khi mở:
  React.useEffect(
    function () {
      if (isOpen) {
        var items =
          menuRef.current &&
          menuRef.current.querySelectorAll('[role="menuitem"]');
        if (items && items.length > 0) items[0].focus();
      }
    },
    [isOpen],
  );

  function handleButtonKeyDown(event) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      btnRef.current.focus(); // Focus về trigger!
    }
  }

  return React.createElement(
    "div",
    { className: "dropdown" },
    React.createElement(
      "button",
      {
        ref: btnRef,
        "aria-expanded": String(isOpen),
        "aria-haspopup": "true",
        "aria-controls": "dropdown-menu",
        onClick: function () {
          setOpen(!isOpen);
        },
        onKeyDown: handleButtonKeyDown,
      },
      props.label,
    ),

    isOpen
      ? React.createElement(
          "ul",
          {
            ref: menuRef,
            id: "dropdown-menu",
            role: "menu",
            "aria-label": props.label,
            onKeyDown: handleMenuKeyDown,
          },
          props.items.map(function (item, i) {
            var itemProps = roving.getItemProps(i);
            return React.createElement(
              "li",
              {
                key: i,
                ref: itemProps.ref,
                role: "menuitem",
                tabIndex: itemProps.tabIndex,
                onKeyDown: itemProps.onKeyDown,
                onClick: function () {
                  item.onClick();
                  setOpen(false);
                  btnRef.current.focus();
                },
              },
              item.label,
            );
          }),
        )
      : null,
  );
}
```

---

## §6. Live Regions & Dynamic Content!

```javascript
// ═══════════════════════════════════════════════════════════
// ① useLiveAnnouncer — Hook thông báo screen reader:
// ═══════════════════════════════════════════════════════════

function useLiveAnnouncer() {
  var politeRef = React.useRef(null);
  var assertiveRef = React.useRef(null);

  React.useEffect(function () {
    // Sr-only CSS class:
    var style = document.createElement("style");
    style.textContent =
      ".sr-only{position:absolute;width:1px;height:1px;" +
      "padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);" +
      "white-space:nowrap;border:0}";
    document.head.appendChild(style);

    // Create live regions:
    var polite = document.createElement("div");
    polite.setAttribute("aria-live", "polite");
    polite.setAttribute("aria-atomic", "true");
    polite.className = "sr-only";
    document.body.appendChild(polite);
    politeRef.current = polite;

    var assertive = document.createElement("div");
    assertive.setAttribute("aria-live", "assertive");
    assertive.setAttribute("aria-atomic", "true");
    assertive.className = "sr-only";
    document.body.appendChild(assertive);
    assertiveRef.current = assertive;

    return function () {
      document.body.removeChild(polite);
      document.body.removeChild(assertive);
      document.head.removeChild(style);
    };
  }, []);

  function announce(message, priority) {
    var ref = priority === "assertive" ? assertiveRef : politeRef;
    if (ref.current) {
      ref.current.textContent = "";
      setTimeout(function () {
        ref.current.textContent = message;
      }, 100);
    }
  }

  return announce;
}

// ═══════════════════════════════════════════════════════════
// ② SEARCH VỚI LIVE RESULTS:
// ═══════════════════════════════════════════════════════════

function AccessibleSearch() {
  var queryState = React.useState("");
  var query = queryState[0];
  var setQuery = queryState[1];

  var resultsState = React.useState([]);
  var results = resultsState[0];
  var setResults = resultsState[1];

  var loadingState = React.useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var announce = useLiveAnnouncer();

  function handleSearch(event) {
    var value = event.target.value;
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Giả lập API call:
    setTimeout(function () {
      var fakeResults = ["Kết quả 1", "Kết quả 2", "Kết quả 3"];
      setResults(fakeResults);
      setLoading(false);
      // Announce kết quả:
      announce(
        fakeResults.length + ' kết quả tìm thấy cho "' + value + '"',
        "polite",
      );
    }, 500);
  }

  return React.createElement(
    "div",
    {
      role: "search",
      "aria-label": "Tìm kiếm",
    },
    React.createElement(
      "label",
      {
        htmlFor: "search-input",
      },
      "Tìm kiếm:",
    ),
    React.createElement("input", {
      id: "search-input",
      type: "search",
      value: query,
      onChange: handleSearch,
      "aria-describedby": "search-help",
      "aria-autocomplete": "list",
      "aria-controls": "search-results",
    }),
    React.createElement(
      "span",
      {
        id: "search-help",
        className: "help-text",
      },
      "Nhập ít nhất 2 ký tự",
    ),

    // Loading:
    loading
      ? React.createElement(
          "div",
          {
            role: "status",
            "aria-live": "polite",
          },
          "Đang tìm kiếm...",
        )
      : null,

    // Results:
    results.length > 0
      ? React.createElement(
          "ul",
          {
            id: "search-results",
            role: "listbox",
          },
          results.map(function (r, i) {
            return React.createElement(
              "li",
              {
                key: i,
                role: "option",
              },
              r,
            );
          }),
        )
      : null,
  );
  // → SR tự đọc "3 kết quả tìm thấy cho ..." khi kết quả xuất hiện!
}
```

---

## §7. Accessible Modal!

```javascript
// ═══════════════════════════════════════════════════════════
// ACCESSIBLE MODAL — HOÀN CHỈNH!
// ═══════════════════════════════════════════════════════════

function AccessibleModal(props) {
  // props: isOpen, onClose, title, children

  var modalRef = React.useRef(null);

  // Focus trap:
  useFocusTrap(modalRef);

  // Focus return:
  useFocusReturn();

  // Escape to close:
  React.useEffect(
    function () {
      function handleKeyDown(event) {
        if (event.key === "Escape") {
          props.onClose();
        }
      }
      document.addEventListener("keydown", handleKeyDown);
      return function () {
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    [props.onClose],
  );

  // Prevent body scroll:
  React.useEffect(function () {
    document.body.style.overflow = "hidden";
    return function () {
      document.body.style.overflow = "";
    };
  }, []);

  // Hide background from screen reader:
  React.useEffect(function () {
    var main = document.getElementById("main-content");
    if (main) main.setAttribute("aria-hidden", "true");
    return function () {
      if (main) main.removeAttribute("aria-hidden");
    };
  }, []);

  if (!props.isOpen) return null;

  return React.createElement(
    "div",
    {
      className: "modal-overlay",
      onClick: function (e) {
        // Click outside = close:
        if (e.target === e.currentTarget) props.onClose();
      },
    },
    React.createElement(
      "div",
      {
        ref: modalRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "modal-title",
        "aria-describedby": "modal-desc",
        className: "modal-content",
      },
      // Close button (đầu tiên = focus đầu tiên):
      React.createElement(
        "button",
        {
          onClick: props.onClose,
          "aria-label": "Đóng dialog",
          className: "modal-close",
        },
        "✕",
      ),

      React.createElement(
        "h2",
        {
          id: "modal-title",
        },
        props.title,
      ),

      React.createElement(
        "div",
        {
          id: "modal-desc",
        },
        props.children,
      ),

      React.createElement(
        "div",
        {
          className: "modal-actions",
        },
        React.createElement(
          "button",
          {
            onClick: props.onClose,
          },
          "Hủy",
        ),
        React.createElement(
          "button",
          {
            onClick: props.onConfirm,
          },
          "Xác nhận",
        ),
      ),
    ),
  );
}
```

```
  ACCESSIBLE MODAL — CHECKLIST:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ✅ role="dialog" → SR biết đây là dialog             │
  │  ✅ aria-modal="true" → SR chỉ đọc trong modal       │
  │  ✅ aria-labelledby → SR đọc title của modal          │
  │  ✅ Focus trap → Tab cycle trong modal                │
  │  ✅ Focus return → đóng modal → focus về trigger      │
  │  ✅ Escape → đóng modal                               │
  │  ✅ Click outside → đóng modal                        │
  │  ✅ Body scroll locked                                │
  │  ✅ Background aria-hidden="true"                     │
  │  ✅ Close button có aria-label                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Skip Link & Routing!

```javascript
// ═══════════════════════════════════════════════════════════
// ① SKIP LINK — Bỏ qua navigation!
// ═══════════════════════════════════════════════════════════

function SkipLink() {
  return React.createElement(
    "a",
    {
      href: "#main-content",
      className: "skip-link",
      onClick: function (event) {
        event.preventDefault();
        var main = document.getElementById("main-content");
        if (main) {
          main.tabIndex = -1;
          main.focus();
          // Scroll to:
          main.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    "Bỏ qua đến nội dung chính",
  );
}

// CSS cho skip link:
// .skip-link {
//   position: absolute;
//   left: -9999px;
//   top: auto;
//   width: 1px;
//   height: 1px;
//   overflow: hidden;
// }
// .skip-link:focus {
//   position: fixed;
//   top: 10px;
//   left: 10px;
//   width: auto;
//   height: auto;
//   padding: 10px 20px;
//   background: #000;
//   color: #fff;
//   z-index: 10000;
//   font-size: 16px;
// }

// ═══════════════════════════════════════════════════════════
// ② ROUTE ANNOUNCER — Thông báo khi đổi page!
// ═══════════════════════════════════════════════════════════

function useRouteAnnouncer() {
  var announce = useLiveAnnouncer();
  var prevPath = React.useRef(window.location.pathname);

  React.useEffect(function () {
    function checkRoute() {
      var currentPath = window.location.pathname;
      if (currentPath !== prevPath.current) {
        prevPath.current = currentPath;

        // Announce page change:
        var title = document.title || currentPath;
        announce("Đã chuyển đến trang: " + title, "assertive");

        // Focus heading:
        setTimeout(function () {
          var h1 = document.querySelector("h1");
          if (h1) {
            h1.tabIndex = -1;
            h1.focus();
          }
        }, 100);
      }
    }

    // Listen popstate:
    window.addEventListener("popstate", checkRoute);

    // Interval kiểm tra (cho pushState):
    var interval = setInterval(checkRoute, 200);

    return function () {
      window.removeEventListener("popstate", checkRoute);
      clearInterval(interval);
    };
  }, []);
}

// ═══════════════════════════════════════════════════════════
// ③ DOCUMENT TITLE HOOK — Cập nhật title mỗi page!
// ═══════════════════════════════════════════════════════════

function useDocumentTitle(title) {
  React.useEffect(
    function () {
      var prevTitle = document.title;
      document.title = title;
      return function () {
        document.title = prevTitle;
      };
    },
    [title],
  );
}

// Sử dụng:
function AboutPage() {
  useDocumentTitle("Giới thiệu — MyApp");
  useRouteAnnouncer();

  var headingRef = React.useRef(null);
  useFocusOnMount(headingRef);

  return React.createElement(
    "main",
    { id: "main-content" },
    React.createElement(
      "h1",
      {
        ref: headingRef,
        tabIndex: -1,
      },
      "Giới thiệu",
    ),
    React.createElement("p", null, "Nội dung trang giới thiệu..."),
  );
}
```

---

## §9. Tự Viết — Accessible Component Library!

```javascript
// ═══════════════════════════════════════════════════════════
// ACCESSIBLE TOOLTIP:
// ═══════════════════════════════════════════════════════════

function AccessibleTooltip(props) {
  var showState = React.useState(false);
  var show = showState[0];
  var setShow = showState[1];
  var tooltipId = "tooltip-" + (props.id || "default");

  return React.createElement(
    "span",
    {
      className: "tooltip-wrapper",
      onMouseEnter: function () {
        setShow(true);
      },
      onMouseLeave: function () {
        setShow(false);
      },
      onFocus: function () {
        setShow(true);
      },
      onBlur: function () {
        setShow(false);
      },
    },
    // Trigger:
    React.createElement(
      "span",
      {
        tabIndex: 0,
        "aria-describedby": show ? tooltipId : null,
      },
      props.children,
    ),

    // Tooltip:
    show
      ? React.createElement(
          "span",
          {
            id: tooltipId,
            role: "tooltip",
            className: "tooltip",
          },
          props.text,
        )
      : null,
  );
  // → SR: "text... description: tooltip content"
  // → Hiện khi focus hoặc hover!
  // → Escape ẩn tooltip (nên thêm!)
}

// ═══════════════════════════════════════════════════════════
// ACCESSIBLE PROGRESS BAR:
// ═══════════════════════════════════════════════════════════

function AccessibleProgress(props) {
  var announce = useLiveAnnouncer();
  var prevValue = React.useRef(props.value);

  React.useEffect(
    function () {
      // Announce mỗi 25%:
      var prev = prevValue.current;
      var curr = props.value;
      var milestones = [25, 50, 75, 100];
      for (var i = 0; i < milestones.length; i++) {
        var m = milestones[i];
        if (prev < m && curr >= m) {
          announce(props.label + ": " + m + "% hoàn thành", "polite");
        }
      }
      prevValue.current = curr;
    },
    [props.value],
  );

  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        role: "progressbar",
        "aria-valuenow": props.value,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": props.label,
        "aria-valuetext": props.value + "% hoàn thành",
        className: "progress-bar",
      },
      React.createElement("div", {
        className: "progress-fill",
        style: { width: props.value + "%" },
      }),
    ),
  );
  // → SR: "Upload file: 50% hoàn thành, progressbar"
}

// ═══════════════════════════════════════════════════════════
// ACCESSIBLE ACCORDION:
// ═══════════════════════════════════════════════════════════

function AccessibleAccordion(props) {
  var openState = React.useState({});
  var openPanels = openState[0];
  var setOpenPanels = openState[1];

  function toggle(index) {
    var updated = {};
    for (var k in openPanels) updated[k] = openPanels[k];
    updated[index] = !updated[index];
    setOpenPanels(updated);
  }

  return React.createElement(
    "div",
    { className: "accordion" },
    props.items.map(function (item, i) {
      var isOpen = !!openPanels[i];
      var headingId = "acc-heading-" + i;
      var panelId = "acc-panel-" + i;

      return React.createElement(
        "div",
        { key: i },
        React.createElement(
          "h3",
          null,
          React.createElement(
            "button",
            {
              id: headingId,
              "aria-expanded": String(isOpen),
              "aria-controls": panelId,
              onClick: function () {
                toggle(i);
              },
              className: "accordion-trigger",
            },
            item.title,
          ),
        ),
        React.createElement(
          "div",
          {
            id: panelId,
            role: "region",
            "aria-labelledby": headingId,
            hidden: !isOpen,
            className: "accordion-panel",
          },
          item.content,
        ),
      );
      // → SR: "Section 1, button, expanded/collapsed"
      // → Enter/Space → toggle!
    }),
  );
}
```

---

## §10. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  REACT A11Y — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SEMANTIC: <button> không <div onClick>!              │
  │            Fragment thay div thừa!                     │
  │            header/nav/main/footer!                     │
  │                                                        │
  │  FOCUS:    useFocusOnMount — page navigation          │
  │            useFocusTrap — modal                        │
  │            useFocusReturn — restore sau modal          │
  │                                                        │
  │  FORMS:    htmlFor + label, aria-required,             │
  │            aria-invalid, aria-describedby,             │
  │            Error summary + role="alert"                │
  │                                                        │
  │  KEYBOARD: useRovingTabIndex — tabs/menus             │
  │            Arrow keys + Home/End                       │
  │            Escape close dropdowns/modals               │
  │                                                        │
  │  DYNAMIC:  useLiveAnnouncer — polite/assertive        │
  │            Announce search results, page changes       │
  │                                                        │
  │  ROUTING:  useRouteAnnouncer — page change             │
  │            useDocumentTitle — update <title>           │
  │            SkipLink — skip to main content             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: Cho ví dụ triển khai accessibility trong React?**

> ① **Semantic HTML**: dùng `<button>` thay `<div onClick>`, Fragment `<>` thay div thừa, `<nav>`, `<main>`, `<header>`. ② **Focus management**: `useFocusOnMount` focus heading khi navigate page, `useFocusTrap` giữ focus trong modal, `useFocusReturn` restore focus khi đóng modal. ③ **Forms**: `htmlFor` liên kết label-input, `aria-required`, `aria-invalid`, `aria-describedby` cho error messages, Error Summary với `role="alert"`. ④ **Keyboard**: `useRovingTabIndex` cho tabs/menus (Arrow keys), Escape đóng modal/dropdown. ⑤ **Dynamic content**: `useLiveAnnouncer` thông báo SR khi content thay đổi. ⑥ **Routing**: announce page change, update `document.title`, Skip Link.

**❓ Q2: Focus management trong React SPA như thế nào?**

> SPA không tải trang mới → SR **không tự biết** khi navigate. Giải pháp: ① **useFocusOnMount**: khi component mount, focus vào `<h1>` (tabIndex=-1) → SR đọc tiêu đề mới. ② **useRouteAnnouncer**: lắng nghe URL change → announce qua `aria-live="assertive"`. ③ **useDocumentTitle**: cập nhật `<title>` mỗi page. ④ **Modal**: `useFocusTrap` giữ Tab trong modal, `useFocusReturn` lưu trigger element và restore focus khi đóng.

**❓ Q3: Làm accessible form trong React?**

> ① Mỗi input PHẢI có `<label htmlFor>`. ② Required fields: `aria-required="true"`. ③ Invalid fields: `aria-invalid="true"` + `aria-describedby` trỏ đến error message. ④ Error messages: `role="alert"` để SR đọc ngay. ⑤ Error Summary: focus vào summary khi submit fail, liệt kê ALL errors, link nhảy đến field lỗi. ⑥ Help text: `aria-describedby` trỏ đến help span. ⑦ Visual `*`: `aria-hidden="true"` vì `aria-required` đã xử lý.

**❓ Q4: aria-live dùng thế nào trong React?**

> Tạo hook `useLiveAnnouncer`: mount 2 div ẩn (sr-only) với `aria-live="polite"` và `aria-live="assertive"`. Khi cần thông báo: clear textContent → setTimeout → set textContent mới → SR tự đọc! **Polite**: search results count, form success, status updates. **Assertive**: errors, connection lost, page navigation. VD: `announce("3 kết quả tìm thấy", "polite")`.

**❓ Q5: Modal accessible cần gì?**

> ① `role="dialog"` + `aria-modal="true"`. ② `aria-labelledby` trỏ đến title. ③ **Focus trap**: Tab cycle chỉ trong modal (first ↔ last). ④ **Focus return**: lưu trigger → đóng modal → focus về trigger. ⑤ **Escape** đóng modal. ⑥ Click outside đóng. ⑦ Body scroll locked. ⑧ Background `aria-hidden="true"`. ⑨ Close button có `aria-label`. ⑩ Focus vào element đầu tiên khi mở.

---

> 📝 **Ghi nhớ cuối cùng:**
> "React a11y = Semantic HTML + Focus Management + Keyboard + Live Regions + Routing! Dùng <button> không <div onClick>! SPA phải tự manage focus khi navigate! Forms cần label + aria-required + aria-invalid + error summary! Modal cần focus trap + focus return + Escape! Dynamic content dùng aria-live announce!"
