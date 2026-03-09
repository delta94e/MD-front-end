# UI Components Deep Dive — Phần 2: Tooltip, Dialog, Table

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Tooltip, Dialog (Modal), Table
> Version: Vanilla JavaScript + React
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component | Vanilla JS | React | Advanced Patterns | Web Component |
| --- | --------- | ---------- | ----- | ----------------- | ------------- |
| 4   | Tooltip   | §4.1       | §4.2  | §4.3              | §4.4          |
| 5   | Dialog    | §5.1       | §5.2  | §5.3              | §5.4          |
| 6   | Table     | §6.1       | §6.2  | §6.3              | §6.4          |

---

# 💬 Component 4: Tooltip

## Kiến Trúc Tooltip

```
TOOLTIP:
═══════════════════════════════════════════════════════════════

  Tooltip positions:

       ┌─────────┐
       │ Tooltip  │  ← top
       └────┬────┘
            ▼
       [  Button  ]  ← trigger
            ▲
       ┌────┴────┐
       │ Tooltip  │  ← bottom
       └─────────┘

  [Button]──┐
            ├──┌─────────┐
            │  │ Tooltip  │  ← right
            ├──└─────────┘

  Features:
  • Show on hover/focus!
  • 4 positions: top, bottom, left, right!
  • Smart positioning (viewport collision!)
  • Delay show/hide!
  • Arrow pointer!
  • Accessible: role="tooltip", aria-describedby!
```

---

## §4.1 Tooltip — Vanilla JavaScript

```css
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  z-index: 1000;
  padding: 8px 12px;
  background: #1a202c;
  color: #fff;
  font-size: 13px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.tooltip-content.visible {
  opacity: 1;
  transform: scale(1);
}

/* Arrow */
.tooltip-content::after {
  content: "";
  position: absolute;
  border: 5px solid transparent;
}

.tooltip-content[data-position="top"] {
  bottom: calc(100% + 8px);
  left: 50%;
  transform-origin: bottom center;
}

.tooltip-content[data-position="top"].visible {
  transform: translateX(-50%) scale(1);
}

.tooltip-content[data-position="top"]::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: #1a202c;
}

.tooltip-content[data-position="bottom"] {
  top: calc(100% + 8px);
  left: 50%;
}

.tooltip-content[data-position="bottom"].visible {
  transform: translateX(-50%) scale(1);
}

.tooltip-content[data-position="bottom"]::after {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: #1a202c;
}
```

```javascript
// ═══ Vanilla JS Tooltip ═══

class Tooltip {
  constructor(trigger, options = {}) {
    this.trigger =
      typeof trigger === "string" ? document.querySelector(trigger) : trigger;

    this.options = {
      text: "",
      position: "top", // top | bottom | left | right
      delay: 200, // ms before showing
      hideDelay: 100, // ms before hiding
      ...options,
    };

    this.tooltipEl = null;
    this.showTimeout = null;
    this.hideTimeout = null;
    this.isVisible = false;

    this._createTooltip();
    this._bindEvents();
  }

  _createTooltip() {
    // Wrap trigger trong relative container:
    const wrapper = document.createElement("div");
    wrapper.className = "tooltip-wrapper";
    this.trigger.parentNode.insertBefore(wrapper, this.trigger);
    wrapper.appendChild(this.trigger);

    // Tạo tooltip element:
    this.tooltipEl = document.createElement("div");
    this.tooltipEl.className = "tooltip-content";
    this.tooltipEl.setAttribute("role", "tooltip");
    this.tooltipEl.setAttribute("data-position", this.options.position);
    this.tooltipEl.textContent = this.options.text;

    // Unique ID cho aria-describedby:
    const id = "tooltip-" + Math.random().toString(36).slice(2, 9);
    this.tooltipEl.id = id;
    this.trigger.setAttribute("aria-describedby", id);

    wrapper.appendChild(this.tooltipEl);
  }

  _bindEvents() {
    // Mouse events:
    this.trigger.addEventListener("mouseenter", () => this._scheduleShow());
    this.trigger.addEventListener("mouseleave", () => this._scheduleHide());

    // Focus events (keyboard accessibility!):
    this.trigger.addEventListener("focus", () => this._scheduleShow());
    this.trigger.addEventListener("blur", () => this._scheduleHide());

    // Escape key to dismiss:
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.hide();
    });
  }

  _scheduleShow() {
    clearTimeout(this.hideTimeout);
    this.showTimeout = setTimeout(() => this.show(), this.options.delay);
  }

  _scheduleHide() {
    clearTimeout(this.showTimeout);
    this.hideTimeout = setTimeout(() => this.hide(), this.options.hideDelay);
  }

  show() {
    this.isVisible = true;
    this.tooltipEl.classList.add("visible");
    this._updatePosition();
  }

  hide() {
    this.isVisible = false;
    this.tooltipEl.classList.remove("visible");
  }

  _updatePosition() {
    const pos = this.options.position;
    const triggerRect = this.trigger.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();

    // Viewport collision detection:
    if (pos === "top" && triggerRect.top < tooltipRect.height + 16) {
      this.tooltipEl.setAttribute("data-position", "bottom");
    } else if (
      pos === "bottom" &&
      window.innerHeight - triggerRect.bottom < tooltipRect.height + 16
    ) {
      this.tooltipEl.setAttribute("data-position", "top");
    } else {
      this.tooltipEl.setAttribute("data-position", pos);
    }
  }

  setText(text) {
    this.options.text = text;
    this.tooltipEl.textContent = text;
  }

  destroy() {
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
    const wrapper = this.trigger.parentNode;
    wrapper.parentNode.insertBefore(this.trigger, wrapper);
    wrapper.remove();
    this.trigger.removeAttribute("aria-describedby");
  }
}

// Usage:
new Tooltip("#myButton", {
  text: "Click để thêm item mới!",
  position: "top",
  delay: 300,
});
```

---

## §4.2 Tooltip — React

```javascript
// ═══ React Tooltip ═══
import { useState, useRef, useCallback, useEffect } from "react";

function useTooltip(delay = 200) {
  const [isVisible, setIsVisible] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);

  const show = useCallback(() => {
    clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setIsVisible(false), 100);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  return { isVisible, show, hide };
}

function Tooltip({ text, position = "top", delay = 200, children }) {
  const { isVisible, show, hide } = useTooltip(delay);
  const tooltipId = useRef(
    "tooltip-" + Math.random().toString(36).slice(2, 9),
  ).current;

  const positionStyles = {
    top: {
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: `translateX(-50%) scale(${isVisible ? 1 : 0.95})`,
    },
    bottom: {
      top: "calc(100% + 8px)",
      left: "50%",
      transform: `translateX(-50%) scale(${isVisible ? 1 : 0.95})`,
    },
    left: {
      right: "calc(100% + 8px)",
      top: "50%",
      transform: `translateY(-50%) scale(${isVisible ? 1 : 0.95})`,
    },
    right: {
      left: "calc(100% + 8px)",
      top: "50%",
      transform: `translateY(-50%) scale(${isVisible ? 1 : 0.95})`,
    },
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <div aria-describedby={isVisible ? tooltipId : undefined}>{children}</div>
      <div
        id={tooltipId}
        role="tooltip"
        style={{
          position: "absolute",
          zIndex: 1000,
          padding: "8px 12px",
          background: "#1a202c",
          color: "#fff",
          fontSize: "13px",
          borderRadius: "6px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.15s, transform 0.15s",
          ...positionStyles[position],
        }}
      >
        {text}
      </div>
    </div>
  );
}

// Usage:
// <Tooltip text="Xoá item" position="top">
//   <button>🗑️</button>
// </Tooltip>
```

---

## §4.4 Tooltip — Web Component

```javascript
// ═══ Web Component Tooltip ═══
// Shadow DOM + position: absolute!

class MyTooltip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._visible = false;
    this._showTimer = null;
    this._hideTimer = null;
  }

  static get observedAttributes() {
    return ["text", "position", "delay"];
  }

  connectedCallback() {
    const text = this.getAttribute("text") || "";
    const position = this.getAttribute("position") || "top";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: relative;
          display: inline-block;
        }

        .tip {
          position: absolute;
          padding: 8px 12px;
          background: #1a202c;
          color: #fff;
          border-radius: 6px;
          font-size: 13px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 9999;
        }
        .tip.visible { opacity: 1; }

        /* Position variants! */
        .tip.top {
          bottom: calc(100% + 8px);
          left: 50%; transform: translateX(-50%);
        }
        .tip.bottom {
          top: calc(100% + 8px);
          left: 50%; transform: translateX(-50%);
        }
        .tip.left {
          right: calc(100% + 8px);
          top: 50%; transform: translateY(-50%);
        }
        .tip.right {
          left: calc(100% + 8px);
          top: 50%; transform: translateY(-50%);
        }
      </style>

      <slot></slot>
      <div class="tip ${position}" role="tooltip">${text}</div>
    `;

    this._tip = this.shadowRoot.querySelector(".tip");
    this._delay = parseInt(this.getAttribute("delay") || "200");

    // Events trên :host (bao gồm cả children!):
    this.addEventListener("mouseenter", () => this._show());
    this.addEventListener("mouseleave", () => this._hide());
    this.addEventListener("focus", () => this._show(), true);
    this.addEventListener("blur", () => this._hide(), true);

    // Escape đóng ngay:
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this._hideImmediate();
    });
  }

  _show() {
    clearTimeout(this._hideTimer);
    this._showTimer = setTimeout(() => {
      this._tip.classList.add("visible");
    }, this._delay);
  }

  _hide() {
    clearTimeout(this._showTimer);
    this._hideTimer = setTimeout(() => {
      this._tip.classList.remove("visible");
    }, 100);
  }

  _hideImmediate() {
    clearTimeout(this._showTimer);
    clearTimeout(this._hideTimer);
    this._tip.classList.remove("visible");
  }

  disconnectedCallback() {
    clearTimeout(this._showTimer);
    clearTimeout(this._hideTimer);
  }
}

customElements.define("my-tooltip", MyTooltip);
```

```html
<!-- Usage -->
<my-tooltip text="Xoá item này" position="top">
  <button>🗑️ Xoá</button>
</my-tooltip>

<my-tooltip text="Sao chép link" position="right" delay="300">
  <button>📋 Copy</button>
</my-tooltip>

<!-- <slot> = children từ light DOM được chèn vào shadow DOM -->
<!-- Hover lên button → tooltip hiện! -->
```

---

# 🪟 Component 5: Dialog (Modal)

## Kiến Trúc Dialog

```
DIALOG:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────── page ───────────────────────┐
  │                                                     │
  │    ┌──────── overlay (backdrop) ────────┐           │
  │    │                                     │          │
  │    │   ┌──── dialog ────────────┐        │          │
  │    │   │ × Title                │        │          │
  │    │   │─────────────────────── │        │          │
  │    │   │ Content area           │        │          │
  │    │   │                        │        │          │
  │    │   │─────────────────────── │        │          │
  │    │   │    [Cancel] [Confirm]  │        │          │
  │    │   └────────────────────────┘        │          │
  │    │                                     │          │
  │    └─────────────────────────────────────┘          │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  Features:
  • Focus trap (Tab cycles within dialog!)
  • Click overlay to close!
  • Escape key to close!
  • Scroll lock (body overflow: hidden!)
  • Return focus to trigger on close!
  • Portal rendering (React!)
  • role="dialog", aria-modal="true"!
```

---

## §5.1 Dialog — Vanilla JavaScript

```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.dialog-overlay.open {
  opacity: 1;
  visibility: visible;
}

.dialog-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  transform: scale(0.95) translateY(10px);
  transition: transform 0.2s ease;
}

.dialog-overlay.open .dialog-box {
  transform: scale(1) translateY(0);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #a0aec0;
  padding: 4px;
  border-radius: 4px;
}

.dialog-close:hover {
  color: #e53e3e;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

```javascript
// ═══ Vanilla JS Dialog ═══

class Dialog {
  constructor(options = {}) {
    this.options = {
      title: "",
      content: "",
      showClose: true,
      closeOnOverlay: true,
      closeOnEscape: true,
      onOpen: null,
      onClose: null,
      buttons: [], // [{ text, onClick, variant }]
      ...options,
    };

    this.overlay = null;
    this.dialog = null;
    this.previousFocus = null; // trả focus khi đóng!
    this.isOpen = false;

    this._create();
  }

  _create() {
    // Overlay:
    this.overlay = document.createElement("div");
    this.overlay.className = "dialog-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-labelledby", "dialog-title");

    // Dialog box:
    this.dialog = document.createElement("div");
    this.dialog.className = "dialog-box";

    // Header:
    const header = document.createElement("div");
    header.className = "dialog-header";

    const title = document.createElement("h2");
    title.className = "dialog-title";
    title.id = "dialog-title";
    title.textContent = this.options.title;
    header.appendChild(title);

    if (this.options.showClose) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "dialog-close";
      closeBtn.innerHTML = "✕";
      closeBtn.setAttribute("aria-label", "Đóng");
      closeBtn.addEventListener("click", () => this.close());
      header.appendChild(closeBtn);
    }

    // Body:
    const body = document.createElement("div");
    body.className = "dialog-body";
    if (typeof this.options.content === "string") {
      body.innerHTML = this.options.content;
    } else {
      body.appendChild(this.options.content);
    }

    // Footer:
    const footer = document.createElement("div");
    footer.className = "dialog-footer";

    this.options.buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.text;
      button.style.cssText =
        btn.variant === "primary"
          ? "padding:10px 20px;background:#3182ce;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;"
          : "padding:10px 20px;background:#edf2f7;color:#4a5568;border:none;border-radius:6px;cursor:pointer;";
      button.addEventListener("click", () => {
        btn.onClick?.();
        if (btn.closeOnClick !== false) this.close();
      });
      footer.appendChild(button);
    });

    this.dialog.append(header, body);
    if (this.options.buttons.length > 0) {
      this.dialog.appendChild(footer);
    }
    this.overlay.appendChild(this.dialog);

    // Click overlay to close:
    if (this.options.closeOnOverlay) {
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    // Escape to close:
    this._handleKeyDown = (e) => {
      if (e.key === "Escape" && this.options.closeOnEscape) {
        this.close();
      }
      // FOCUS TRAP!
      if (e.key === "Tab") {
        this._trapFocus(e);
      }
    };

    document.body.appendChild(this.overlay);
  }

  _trapFocus(e) {
    const focusable = this.dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: backward
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: forward
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  open() {
    this.isOpen = true;
    this.previousFocus = document.activeElement; // save focus!

    this.overlay.classList.add("open");
    document.body.style.overflow = "hidden"; // scroll lock!
    document.addEventListener("keydown", this._handleKeyDown);

    // Focus first focusable element in dialog:
    requestAnimationFrame(() => {
      const firstFocusable = this.dialog.querySelector(
        "button, [href], input, select, textarea",
      );
      firstFocusable?.focus();
    });

    this.options.onOpen?.();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove("open");
    document.body.style.overflow = ""; // unlock scroll!
    document.removeEventListener("keydown", this._handleKeyDown);

    // Return focus to trigger!
    this.previousFocus?.focus();
    this.options.onClose?.();
  }

  destroy() {
    this.close();
    this.overlay.remove();
  }
}

// Usage:
const dialog = new Dialog({
  title: "Xác nhận xoá",
  content:
    "<p>Bạn có chắc muốn xoá item này? Hành động không thể hoàn tác.</p>",
  buttons: [
    { text: "Huỷ", variant: "secondary" },
    {
      text: "Xoá",
      variant: "primary",
      onClick: () => console.log("Deleted!"),
    },
  ],
});

// Gắn vào button:
document
  .querySelector("#deleteBtn")
  .addEventListener("click", () => dialog.open());
```

---

### §4.3 Advanced React Patterns — Tooltip

```javascript
// ═══ PATTERN 1: Portal Tooltip (thoát khỏi overflow!) ═══
// Tooltip render vào document.body — không bị clip bởi overflow:hidden!

function PortalTooltip({ text, children, position = "top" }) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    const positions = {
      top: {
        top: rect.top - 8 + window.scrollY,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      },
      bottom: {
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      },
    };
    setCoords(positions[position]);
  }, [position]);

  const show = () => {
    updatePosition();
    setIsVisible(true);
  };
  const hide = () => setIsVisible(false);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {isVisible &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "absolute",
              zIndex: 99999,
              ...coords,
              padding: "8px 12px",
              background: "#1a202c",
              color: "#fff",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}
// → Không bị clip bởi overflow:hidden trên parent!
// → Position tính từ getBoundingClientRect (absolute to viewport)!

// ═══ PATTERN 2: Smart Positioning (viewport collision!) ═══
// Tự flip position khi tooltip bị cắt bởi viewport!

function useSmartPosition(triggerRef, isVisible, preferredPosition) {
  const [position, setPosition] = useState(preferredPosition);

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // Flip if overflowing viewport:
    const flips = {
      top: rect.top < 60 ? "bottom" : "top",
      bottom: window.innerHeight - rect.bottom < 60 ? "top" : "bottom",
      left: rect.left < 120 ? "right" : "left",
      right: window.innerWidth - rect.right < 120 ? "left" : "right",
    };
    setPosition(flips[preferredPosition]);
  }, [isVisible, preferredPosition, triggerRef]);

  return position;
}
// → position="top" nhưng gần top viewport? Auto flip to bottom!

// ═══ PATTERN 3: Controlled Tooltip ═══
// Parent quyết định khi nào show/hide!

function ControlledTooltip({ isOpen, text, children }) {
  // Không có internal state! Parent controls!
  if (!isOpen) return children;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {children}
      <div
        role="tooltip"
        style={
          {
            /* tooltip styles */
          }
        }
      >
        {text}
      </div>
    </div>
  );
}
// <ControlledTooltip isOpen={showHelp} text="Click here!">
//   <button>?</button>
// </ControlledTooltip>
// → Useful cho onboarding tours, guided walkthroughs!

// ═══ PATTERN 4: Rich Content Tooltip ═══
// Tooltip chứa JSX phức tạp, hover được!

function RichTooltip({ content, children }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef();

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
  };
  const handleLeave = () => {
    // Delay hide để user có thể hover vào tooltip!
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            pointerEvents: "auto", // Cho phép hover vào!
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
// <RichTooltip content={
//   <div>
//     <img src="avatar.jpg" />
//     <strong>Scott Moss</strong>
//     <p>Senior Engineer</p>
//     <button>Follow</button>
//   </div>
// }>
//   <a href="#">@scottmoss</a>
// </RichTooltip>
// → User có thể hover VÀO tooltip để click button!
```

---

## §5.2 Dialog — React

```javascript
// ═══ React Dialog ═══
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

function useFocusTrap(ref, isOpen) {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const dialog = ref.current;

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const focusable = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    // Focus first element:
    const firstFocusable = dialog.querySelector("button, input");
    firstFocusable?.focus();

    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, ref]);
}

function useScrollLock(isOpen) {
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);
}

function Dialog({ isOpen, onClose, title, children, buttons = [] }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useFocusTrap(dialogRef, isOpen);
  useScrollLock(isOpen);

  // Save and restore focus:
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Escape to close:
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        style={{
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h2
            id="dialog-title"
            style={{
              fontSize: "18px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              color: "#a0aec0",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {buttons.length > 0 && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            {buttons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: btn.variant === "primary" ? 600 : 400,
                  background: btn.variant === "primary" ? "#3182ce" : "#edf2f7",
                  color: btn.variant === "primary" ? "#fff" : "#4a5568",
                }}
              >
                {btn.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body, // Portal: render outside component tree!
  );
}

// Usage:
function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Xác nhận xoá"
        buttons={[
          { text: "Huỷ", onClick: () => setOpen(false) },
          {
            text: "Xoá",
            variant: "primary",
            onClick: () => {
              console.log("deleted!");
              setOpen(false);
            },
          },
        ]}
      >
        <p>Bạn có chắc muốn xoá?</p>
      </Dialog>
    </>
  );
}
```

---

### §5.3 Advanced React Patterns — Dialog

```javascript
// ═══ PATTERN 1: useImperativeHandle — Gọi dialog.open() từ parent ═══
// Thay vì truyền isOpen state, ref API trực tiếp!

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

const ImperativeDialog = forwardRef(function ImperativeDialog(
  { title, children, buttons },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);

  // Expose open/close methods cho parent!
  useImperativeHandle(
    ref,
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen: () => isOpen,
    }),
    [isOpen],
  );

  if (!isOpen) return null;
  return createPortal(
    <div
      style={
        {
          /* overlay styles */
        }
      }
    >
      <div>
        {title} — {children}
      </div>
    </div>,
    document.body,
  );
});

// Usage:
function App() {
  const dialogRef = useRef(null);
  return (
    <>
      <button onClick={() => dialogRef.current.open()}>Open</button>
      <ImperativeDialog ref={dialogRef} title="Hello">
        <p>Content here!</p>
      </ImperativeDialog>
    </>
  );
}
// → Không cần useState ở parent!
// → dialogRef.current.open() / .close() trực tiếp!

// ═══ PATTERN 2: Confirmation Dialog Pattern ═══
// Return Promise — await kết quả confirm/cancel!

function useConfirmDialog() {
  const [state, setState] = useState({
    isOpen: false,
    title: "",
    message: "",
    resolve: null,
  });

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, title, message, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const ConfirmDialog = () => {
    if (!state.isOpen) return null;
    return createPortal(
      <div
        style={
          {
            /* overlay */
          }
        }
      >
        <div>
          <h2>{state.title}</h2>
          <p>{state.message}</p>
          <button onClick={handleCancel}>Huỷ</button>
          <button onClick={handleConfirm}>Xác nhận</button>
        </div>
      </div>,
      document.body,
    );
  };

  return { confirm, ConfirmDialog };
}

// Usage (async/await!):
function App() {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async () => {
    const ok = await confirm("Xoá item?", "Không thể hoàn tác!");
    if (ok) {
      await deleteItem(id);
      toast("Đã xoá!");
    }
    // ok === false nếu user cancel!
  };

  return (
    <>
      <button onClick={handleDelete}>Xoá</button>
      <ConfirmDialog />
    </>
  );
}
// → await confirm() — code đọc như synchronous!
// → Không cần state management phức tạp!

// ═══ PATTERN 3: Stacked Dialogs (Dialog trong Dialog!) ═══
// Quản lý nhiều dialog cùng lúc!

function useDialogStack() {
  const [stack, setStack] = useState([]);

  const push = useCallback((dialog) => {
    setStack((prev) => [...prev, { id: Date.now(), ...dialog }]);
  }, []);

  const pop = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const closeAll = useCallback(() => setStack([]), []);

  return { stack, push, pop, closeAll, count: stack.length };
}
// → Dialog 1 mở → trong đó mở Dialog 2 → stack!
// → pop() đóng dialog trên cùng!
// → Mỗi dialog có overlay riêng!

// ═══ PATTERN 4: Async Content Loading ═══
// Load data khi dialog mở, show loading state!

function useAsyncDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (fetchFn) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, loading, open, close };
}
// Usage:
// const dialog = useAsyncDialog();
// <button onClick={() => dialog.open(() => fetchUserDetails(id))}>
// {dialog.loading ? <Spinner /> : <UserDetails data={dialog.data} />}
```

---

## §5.4 Dialog — Web Component

```javascript
// ═══ Web Component Dialog ═══
// Focus trap + scroll lock + Portal (không cần vì Shadow DOM cô lập!)

class MyDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._isOpen = false;
    this._previousFocus = null;
  }

  static get observedAttributes() {
    return ["open"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "open") {
      if (newVal !== null) this._openDialog();
      else this._closeDialog();
    }
  }

  connectedCallback() {
    const title = this.getAttribute("title") || "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; }
        :host([open]) { display: block; }

        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s;
        }
        @keyframes fadeIn { from { opacity: 0; } }

        .dialog {
          background: #fff; border-radius: 12px;
          padding: 0; min-width: 400px; max-width: 90vw;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: scaleIn 0.2s;
        }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } }

        .header {
          display: flex; justify-content: space-between;
          align-items: center; padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .title { font-size: 18px; font-weight: 600; color: #1a202c; }
        .close-btn {
          background: none; border: none; font-size: 20px;
          cursor: pointer; color: #a0aec0; padding: 4px;
        }
        .close-btn:hover { color: #e53e3e; }

        .body { padding: 24px; color: #4a5568; line-height: 1.6; }

        .footer {
          display: flex; justify-content: flex-end; gap: 12px;
          padding: 16px 24px; border-top: 1px solid #e2e8f0;
        }
      </style>

      <div class="overlay">
        <div class="dialog" role="dialog" aria-modal="true"
             aria-label="${title}">
          <div class="header">
            <span class="title">${title}</span>
            <button class="close-btn" aria-label="Đóng">×</button>
          </div>
          <div class="body">
            <slot></slot>
          </div>
          <div class="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;

    // Close button:
    this.shadowRoot
      .querySelector(".close-btn")
      .addEventListener("click", () => this.close());

    // Overlay click:
    this.shadowRoot.querySelector(".overlay").addEventListener("click", (e) => {
      if (e.target.classList.contains("overlay")) this.close();
    });

    // Escape key:
    this._escHandler = (e) => {
      if (e.key === "Escape" && this._isOpen) this.close();
    };
  }

  // Public API:
  open() {
    this.setAttribute("open", "");
  }
  close() {
    this.removeAttribute("open");
  }

  _openDialog() {
    this._isOpen = true;
    this._previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", this._escHandler);

    // Auto-focus first focusable in dialog:
    setTimeout(() => {
      const focusable = this.shadowRoot.querySelector(
        "button, [href], input, select, textarea",
      );
      focusable?.focus();
    });

    this.dispatchEvent(new CustomEvent("dialog-open", { bubbles: true }));
  }

  _closeDialog() {
    this._isOpen = false;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", this._escHandler);
    this._previousFocus?.focus();

    this.dispatchEvent(new CustomEvent("dialog-close", { bubbles: true }));
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._escHandler);
    document.body.style.overflow = "";
  }
}

customElements.define("my-dialog", MyDialog);
```

```html
<!-- Usage -->
<button onclick="document.querySelector('#myDialog').open()">Mở Dialog</button>

<my-dialog id="myDialog" title="Xác nhận xoá">
  <p>Bạn có chắc chắn muốn xoá item này?</p>
  <p>Hành động này không thể hoàn tác!</p>

  <!-- Named slot cho footer buttons! -->
  <div slot="footer">
    <button onclick="this.closest('my-dialog').close()">Huỷ</button>
    <button onclick="deleteItem(); this.closest('my-dialog').close()">
      Xác nhận xoá
    </button>
  </div>
</my-dialog>

<script>
  document.querySelector("#myDialog").addEventListener("dialog-close", () => {
    console.log("Dialog đóng!");
  });
</script>
```

---

# 📊 Component 6: Table

## Kiến Trúc Table

```
TABLE:
═══════════════════════════════════════════════════════════════

  ┌─────┬──────────┬───────┬─────────┬──────┐
  │  #  │ Name ▲   │ Email │ Role    │ Actions│
  ├─────┼──────────┼───────┼─────────┼──────┤
  │  1  │ Alice    │ a@... │ Admin   │ ✏️ 🗑 │
  │  2  │ Bob      │ b@... │ User    │ ✏️ 🗑 │
  │  3  │ Charlie  │ c@... │ Editor  │ ✏️ 🗑 │
  └─────┴──────────┴───────┴─────────┴──────┘
  │ ◀ 1 2 3 ... 10 ▶ │  Showing 1-10 of 100  │

  Features:
  • Sortable columns (click header!)
  • Pagination!
  • Search/filter!
  • Responsive (horizontal scroll!)
  • Accessible: scope="col", aria-sort!
```

---

## §6.1 Table — Vanilla JavaScript

```css
.data-table-wrapper {
  font-family: system-ui, sans-serif;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e2e8f0;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f7fafc;
  font-weight: 600;
  font-size: 13px;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.data-table th:hover {
  background: #edf2f7;
}
.data-table th .sort-icon {
  margin-left: 4px;
  opacity: 0.3;
}
.data-table th.sorted .sort-icon {
  opacity: 1;
}

.data-table tr:hover td {
  background: #f7fafc;
}

.table-search {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 100%;
  max-width: 300px;
  margin-bottom: 16px;
  font-size: 14px;
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  color: #4a5568;
}

.table-pagination button {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.table-pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}

.table-pagination button:hover:not(:disabled) {
  background: #edf2f7;
}
```

```javascript
// ═══ Vanilla JS Data Table ═══

class DataTable {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    this.options = {
      columns: [], // [{ key, label, sortable }]
      data: [],
      pageSize: 10,
      searchable: true,
      ...options,
    };

    this.state = {
      currentPage: 1,
      sortKey: null,
      sortDir: "asc", // 'asc' | 'desc'
      searchTerm: "",
    };

    this._render();
  }

  // ═══ DATA PROCESSING ═══

  _getFilteredData() {
    let data = [...this.options.data];

    // Search filter:
    if (this.state.searchTerm) {
      const term = this.state.searchTerm.toLowerCase();
      data = data.filter((row) =>
        this.options.columns.some((col) =>
          String(row[col.key]).toLowerCase().includes(term),
        ),
      );
    }

    // Sort:
    if (this.state.sortKey) {
      data.sort((a, b) => {
        const valA = a[this.state.sortKey];
        const valB = b[this.state.sortKey];
        let cmp = 0;

        if (typeof valA === "number") {
          cmp = valA - valB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }

        return this.state.sortDir === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }

  _getPaginatedData() {
    const filtered = this._getFilteredData();
    const start = (this.state.currentPage - 1) * this.options.pageSize;
    const end = start + this.options.pageSize;

    return {
      rows: filtered.slice(start, end),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / this.options.pageSize),
    };
  }

  // ═══ RENDERING ═══

  _render() {
    this.container.innerHTML = "";
    this.container.className = "data-table-wrapper";

    // Search:
    if (this.options.searchable) {
      const search = document.createElement("input");
      search.className = "table-search";
      search.placeholder = "Tìm kiếm...";
      search.value = this.state.searchTerm;
      search.addEventListener("input", (e) => {
        this.state.searchTerm = e.target.value;
        this.state.currentPage = 1; // reset page on search!
        this._renderTable();
        this._renderPagination();
      });
      this.container.appendChild(search);
    }

    // Table container:
    this.tableContainer = document.createElement("div");
    this.container.appendChild(this.tableContainer);

    // Pagination container:
    this.paginationContainer = document.createElement("div");
    this.container.appendChild(this.paginationContainer);

    this._renderTable();
    this._renderPagination();
  }

  _renderTable() {
    const { rows } = this._getPaginatedData();

    const table = document.createElement("table");
    table.className = "data-table";

    // Header:
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    this.options.columns.forEach((col) => {
      const th = document.createElement("th");
      th.scope = "col"; // accessibility!
      th.textContent = col.label;

      if (col.sortable !== false) {
        const sortIcon = document.createElement("span");
        sortIcon.className = "sort-icon";

        if (this.state.sortKey === col.key) {
          th.classList.add("sorted");
          sortIcon.textContent = this.state.sortDir === "asc" ? "▲" : "▼";
          th.setAttribute(
            "aria-sort",
            this.state.sortDir === "asc" ? "ascending" : "descending",
          );
        } else {
          sortIcon.textContent = "⇅";
        }

        th.appendChild(sortIcon);
        th.addEventListener("click", () => this._sort(col.key));
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body:
    const tbody = document.createElement("tbody");

    if (rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = this.options.columns.length;
      td.textContent = "Không có dữ liệu";
      td.style.textAlign = "center";
      td.style.padding = "32px";
      td.style.color = "#a0aec0";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        this.options.columns.forEach((col) => {
          const td = document.createElement("td");
          if (col.render) {
            const content = col.render(row[col.key], row);
            if (typeof content === "string") {
              td.innerHTML = content;
            } else {
              td.appendChild(content);
            }
          } else {
            td.textContent = row[col.key] ?? "";
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);

    this.tableContainer.innerHTML = "";
    this.tableContainer.appendChild(table);
  }

  _renderPagination() {
    const { total, totalPages } = this._getPaginatedData();
    const start = (this.state.currentPage - 1) * this.options.pageSize + 1;
    const end = Math.min(this.state.currentPage * this.options.pageSize, total);

    this.paginationContainer.innerHTML = "";
    this.paginationContainer.className = "table-pagination";

    const info = document.createElement("span");
    info.textContent =
      total > 0 ? `Hiển thị ${start}-${end} / ${total}` : "Không có kết quả";

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "8px";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀ Trước";
    prevBtn.disabled = this.state.currentPage <= 1;
    prevBtn.addEventListener("click", () =>
      this._goToPage(this.state.currentPage - 1),
    );

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Sau ▶";
    nextBtn.disabled = this.state.currentPage >= totalPages;
    nextBtn.addEventListener("click", () =>
      this._goToPage(this.state.currentPage + 1),
    );

    controls.append(prevBtn, nextBtn);
    this.paginationContainer.append(info, controls);
  }

  // ═══ ACTIONS ═══

  _sort(key) {
    if (this.state.sortKey === key) {
      this.state.sortDir = this.state.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.state.sortKey = key;
      this.state.sortDir = "asc";
    }
    this._renderTable();
  }

  _goToPage(page) {
    this.state.currentPage = page;
    this._renderTable();
    this._renderPagination();
  }

  setData(data) {
    this.options.data = data;
    this.state.currentPage = 1;
    this._renderTable();
    this._renderPagination();
  }
}

// Usage:
const table = new DataTable("#myTable", {
  columns: [
    { key: "id", label: "#", sortable: true },
    { key: "name", label: "Tên", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Vai trò", sortable: true },
  ],
  data: [
    { id: 1, name: "Alice", email: "alice@test.com", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@test.com", role: "User" },
    // ...
  ],
  pageSize: 5,
  searchable: true,
});
```

---

## §6.2 Table — React

```javascript
// ═══ React Data Table ═══
import { useState, useMemo, useCallback } from "react";

function useTableState(initialPageSize = 10) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const toggleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const handleSearch = useCallback((term) => {
    setSearch(term);
    setPage(1);
  }, []);

  return { sortKey, sortDir, page, search, toggleSort, setPage, handleSearch };
}

function useProcessedData(
  data,
  columns,
  { sortKey, sortDir, search, page, pageSize },
) {
  return useMemo(() => {
    let result = [...data];

    // Filter:
    if (search) {
      const term = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) =>
          String(row[col.key]).toLowerCase().includes(term),
        ),
      );
    }

    // Sort:
    if (sortKey) {
      result.sort((a, b) => {
        const vA = a[sortKey],
          vB = b[sortKey];
        const cmp =
          typeof vA === "number"
            ? vA - vB
            : String(vA).localeCompare(String(vB));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    // Paginate:
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const rows = result.slice(start, start + pageSize);

    return { rows, total, totalPages };
  }, [data, columns, sortKey, sortDir, search, page, pageSize]);
}

function DataTable({ columns, data, pageSize = 10, searchable = true }) {
  const { sortKey, sortDir, page, search, toggleSort, setPage, handleSearch } =
    useTableState(pageSize);

  const { rows, total, totalPages } = useProcessedData(data, columns, {
    sortKey,
    sortDir,
    search,
    page,
    pageSize,
  });

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div style={{ fontFamily: "system-ui" }}>
      {searchable && (
        <input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: "10px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            width: "100%",
            maxWidth: "300px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        />
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #e2e8f0",
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f7fafc",
                    fontWeight: 600,
                    fontSize: "13px",
                    color: "#4a5568",
                    cursor: col.sortable !== false ? "pointer" : "default",
                    userSelect: "none",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span
                      style={{
                        marginLeft: "4px",
                        opacity: sortKey === col.key ? 1 : 0.3,
                      }}
                    >
                      {sortKey === col.key
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : "⇅"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#a0aec0",
                  }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          fontSize: "14px",
          color: "#4a5568",
        }}
      >
        <span>
          {total > 0
            ? `Hiển thị ${start}-${end} / ${total}`
            : "Không có kết quả"}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            style={{
              padding: "6px 12px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              borderRadius: "4px",
              cursor: page <= 1 ? "default" : "pointer",
              opacity: page <= 1 ? 0.4 : 1,
            }}
          >
            ◀ Trước
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            style={{
              padding: "6px 12px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              borderRadius: "4px",
              cursor: page >= totalPages ? "default" : "pointer",
              opacity: page >= totalPages ? 0.4 : 1,
            }}
          >
            Sau ▶
          </button>
        </div>
      </div>
    </div>
  );
}

// Usage:
// <DataTable
//   columns={[
//     { key: 'id', label: '#' },
//     { key: 'name', label: 'Tên' },
//     { key: 'email', label: 'Email' },
//     { key: 'role', label: 'Vai trò' },
//   ]}
//   data={users}
//   pageSize={5}
// />
```

---

### §6.3 Advanced React Patterns — Table

```javascript
// ═══ PATTERN 1: Virtualization (1000+ rows!) ═══
// Chỉ render rows visible trong viewport!

function useVirtualization(totalItems, itemHeight, containerHeight) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems,
  );
  const visibleItems = endIndex - startIndex;
  const totalHeight = totalItems * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

function VirtualTable({ columns, data, rowHeight = 48 }) {
  const containerHeight = 400;
  const { startIndex, endIndex, totalHeight, offsetY, setScrollTop } =
    useVirtualization(data.length, rowHeight, containerHeight);

  const visibleRows = data.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Spacer tạo scrollbar đúng kích thước! */}
      <div style={{ height: totalHeight, position: "relative" }}>
        <table style={{ position: "absolute", top: offsetY, width: "100%" }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={startIndex + i} style={{ height: rowHeight }}>
                {columns.map((c) => (
                  <td key={c.key}>{row[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// → 10,000 rows? Chỉ render ~10 visible rows!
// → Smooth scrolling với spacer div!
// → Tối ưu cho large datasets!

// ═══ PATTERN 2: Column Resize ═══
// User kéo resize header columns!

function useColumnResize(initialWidths) {
  const [widths, setWidths] = useState(initialWidths);
  const dragRef = useRef({ colIndex: -1, startX: 0, startWidth: 0 });

  const startResize = useCallback(
    (colIndex, e) => {
      dragRef.current = {
        colIndex,
        startX: e.clientX,
        startWidth: widths[colIndex],
      };

      const onMouseMove = (e) => {
        const diff = e.clientX - dragRef.current.startX;
        const newWidth = Math.max(50, dragRef.current.startWidth + diff);
        setWidths((prev) => {
          const next = [...prev];
          next[dragRef.current.colIndex] = newWidth;
          return next;
        });
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [widths],
  );

  return { widths, startResize };
}
// → Drag handle giữa 2 columns!
// → Min width 50px!
// → Smooth resize theo mouse!

// ═══ PATTERN 3: Row Selection (Checkbox!) ═══
// Select/deselect rows với checkbox!

function useRowSelection(data) {
  const [selected, setSelected] = useState(new Set());

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(
      (prev) =>
        prev.size === data.length
          ? new Set() // deselect all!
          : new Set(data.map((r) => r.id)), // select all!
    );
  }, [data]);

  const isSelected = useCallback((id) => selected.has(id), [selected]);
  const isAllSelected = selected.size === data.length && data.length > 0;
  const selectedCount = selected.size;

  return {
    toggleOne,
    toggleAll,
    isSelected,
    isAllSelected,
    selectedCount,
    selectedItems: [...selected],
  };
}
// Bulk actions:
// const { selectedItems } = useRowSelection(data);
// <button onClick={() => deleteMany(selectedItems)}>
//   Xoá {selectedCount} items
// </button>

// ═══ PATTERN 4: Inline Editing ═══
// Click cell để edit trực tiếp!

function EditableCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <td onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
        {value}
      </td>
    );
  }

  return (
    <td>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onSave(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(draft);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        style={{ width: "100%", padding: "4px" }}
      />
    </td>
  );
}
// → Click cell → input appears!
// → Enter: save, Escape: cancel!
// → Blur: auto-save!

// ═══ PATTERN 5: Debounced Search ═══
// Không search mỗi keystroke — đợi user dừng gõ!

function useDebouncedSearch(delay = 300) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), delay);
    return () => clearTimeout(timer);
  }, [search, delay]);

  return { search, setSearch, debouncedSearch };
}
// → User gõ liên tục: không re-filter!
// → User dừng gõ 300ms: filter!
// → Tối ưu khi data lớn!
```

---

## §6.4 Table — Web Component

```javascript
// ═══ Web Component Table ═══
// Sort + search + pagination!

class MyDataTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = [];
    this._columns = [];
    this._sortKey = "";
    this._sortDir = "asc";
    this._search = "";
    this._page = 1;
    this._pageSize = 5;
  }

  // Public API: set data từ JS!
  set data(val) {
    this._data = val;
    this._render();
  }
  set columns(val) {
    this._columns = val;
    this._render();
  }

  connectedCallback() {
    this._pageSize = parseInt(this.getAttribute("page-size") || "5");

    // Try parse data từ attribute (JSON):
    const dataAttr = this.getAttribute("data");
    if (dataAttr) this._data = JSON.parse(dataAttr);

    const colsAttr = this.getAttribute("columns");
    if (colsAttr) this._columns = JSON.parse(colsAttr);

    this._render();
  }

  _getProcessedData() {
    let result = [...this._data];

    // Filter:
    if (this._search) {
      const term = this._search.toLowerCase();
      result = result.filter((row) =>
        this._columns.some((col) =>
          String(row[col.key]).toLowerCase().includes(term),
        ),
      );
    }

    // Sort:
    if (this._sortKey) {
      result.sort((a, b) => {
        const vA = a[this._sortKey],
          vB = b[this._sortKey];
        const cmp =
          typeof vA === "number"
            ? vA - vB
            : String(vA).localeCompare(String(vB));
        return this._sortDir === "asc" ? cmp : -cmp;
      });
    }

    // Paginate:
    const total = result.length;
    const totalPages = Math.ceil(total / this._pageSize) || 1;
    const start = (this._page - 1) * this._pageSize;
    const rows = result.slice(start, start + this._pageSize);

    return { rows, total, totalPages };
  }

  _render() {
    const { rows, total, totalPages } = this._getProcessedData();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, sans-serif; }
        .toolbar {
          display: flex; justify-content: space-between;
          margin-bottom: 12px;
        }
        input {
          padding: 8px 12px; border: 1px solid #e2e8f0;
          border-radius: 6px; font-size: 14px; width: 250px;
        }
        table {
          width: 100%; border-collapse: collapse;
          border: 1px solid #e2e8f0;
        }
        th {
          padding: 12px 16px; text-align: left;
          background: #f7fafc; font-weight: 600;
          cursor: pointer; user-select: none;
          border-bottom: 2px solid #e2e8f0;
        }
        th:hover { background: #edf2f7; }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        tr:hover td { background: #f7fafc; }
        .pagination {
          display: flex; justify-content: space-between;
          align-items: center; margin-top: 12px;
          font-size: 14px; color: #718096;
        }
        button {
          padding: 6px 12px; border: 1px solid #e2e8f0;
          background: #fff; border-radius: 4px; cursor: pointer;
        }
        button:disabled { opacity: 0.4; cursor: default; }
      </style>

      <div class="toolbar">
        <input type="text" placeholder="Tìm kiếm..."
          value="${this._search}" />
        <span>${total} kết quả</span>
      </div>

      <table>
        <thead>
          <tr>
            ${this._columns
              .map(
                (col) => `
              <th scope="col" data-key="${col.key}"
                ${
                  this._sortKey === col.key
                    ? `aria-sort="${this._sortDir === "asc" ? "ascending" : "descending"}"`
                    : ""
                }>
                ${col.label}
                ${
                  this._sortKey === col.key
                    ? this._sortDir === "asc"
                      ? " ▲"
                      : " ▼"
                    : " ⇅"
                }
              </th>
            `,
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `
            <tr>
              ${this._columns
                .map(
                  (col) => `
                <td>${row[col.key] ?? ""}</td>
              `,
                )
                .join("")}
            </tr>
          `,
                  )
                  .join("")
              : `
            <tr><td colspan="${this._columns.length}"
              style="text-align:center;color:#a0aec0;padding:24px;">
              Không có kết quả
            </td></tr>
          `
          }
        </tbody>
      </table>

      <div class="pagination">
        <span>Trang ${this._page} / ${totalPages}</span>
        <div>
          <button class="prev" ${this._page <= 1 ? "disabled" : ""}>
            ◀ Trước
          </button>
          <button class="next" ${this._page >= totalPages ? "disabled" : ""}>
            Sau ▶
          </button>
        </div>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    // Search:
    let debounceTimer;
    this.shadowRoot.querySelector("input").addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this._search = e.target.value;
        this._page = 1;
        this._render();
      }, 300);
    });

    // Sort:
    this.shadowRoot.querySelectorAll("th").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (this._sortKey === key) {
          this._sortDir = this._sortDir === "asc" ? "desc" : "asc";
        } else {
          this._sortKey = key;
          this._sortDir = "asc";
        }
        this._page = 1;
        this._render();
      });
    });

    // Pagination:
    this.shadowRoot.querySelector(".prev")?.addEventListener("click", () => {
      if (this._page > 1) {
        this._page--;
        this._render();
      }
    });
    this.shadowRoot.querySelector(".next")?.addEventListener("click", () => {
      const { totalPages } = this._getProcessedData();
      if (this._page < totalPages) {
        this._page++;
        this._render();
      }
    });
  }
}

customElements.define("my-data-table", MyDataTable);
```

```html
<!-- Usage -->
<my-data-table id="table" page-size="5"></my-data-table>

<script>
  const table = document.querySelector("#table");

  // Set columns và data qua JS API:
  table.columns = [
    { key: "id", label: "#" },
    { key: "name", label: "Tên" },
    { key: "email", label: "Email" },
    { key: "role", label: "Vai trò" },
  ];

  table.data = [
    { id: 1, name: "Nguyễn Văn A", email: "a@test.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@test.com", role: "User" },
    { id: 3, name: "Lê Văn C", email: "c@test.com", role: "Editor" },
    // ... more data
  ];
</script>
```

---

## 📖 Deep Dive: Component Design Principles

### 1. Focus Trap (Dialog)

Focus trap giữ focus bên trong dialog — khi user nhấn Tab ở element cuối, focus quay lại element đầu. Đây là **WCAG 2.1** requirement cho modals. Nếu thiếu focus trap, keyboard users sẽ tab ra phía sau overlay — UX rất tệ.

### 2. Return Focus (Dialog)

Khi đóng dialog, focus phải quay lại **element đã trigger** mở dialog. Nếu không, focus mất và keyboard users phải tab lại từ đầu page.

### 3. Portal Rendering (React Dialog)

`createPortal` render dialog **ngoài component tree** — trực tiếp vào `document.body`. Tránh issues với `overflow: hidden`, `z-index` stacking context, và CSS positioning.

### 4. Normalized Cache vs Re-render (Table)

React Table dùng `useMemo` để tính filtered/sorted/paginated data — chỉ recalculate khi dependencies thay đổi. Vanilla JS re-render toàn bộ table bằng `innerHTML` — đơn giản hơn nhưng không tối ưu. Ở scale lớn (1000+ rows), cần thêm virtualization.

### 5. Đóng Gói State

Mỗi component đều tách **state logic** và **rendering**:

- Vanilla JS: class methods + private state
- React: custom hooks (`useAccordion`, `useStarRating`, `useTabs`, `useTooltip`, `useFocusTrap`, `useTableState`)

Pattern này giúp tái sử dụng logic mà không phụ thuộc vào UI.

---

# 🎤 RADIO Interview Walkthrough — Part 2

> Pattern **RADIO**: **R**equirements → **A**rchitecture → **D**esign → **I**mplementation → **O**ptimization
> Think out loud tại mỗi bước — show interviewer cách bạn tư duy!

---

## 🎤 RADIO: Tooltip

### R — Requirements

> 🗣 "Tooltip trông đơn giản nhưng có nhiều edge cases — để tôi clarify..."

1. **Trigger event?** — Hover, focus, click, hay tất cả?
   - → Hover + focus (accessibility!), click optional
2. **Delay show/hide?** — Show ngay hay delay 200ms?
   - → Delay show (tránh flicker khi lướt qua), delay hide (cho user hover vào tooltip)
3. **Positioning?** — Top, bottom, left, right? Auto-flip?
   - → 4 positions + auto-flip khi bị viewport cắt
4. **Content type?** — Text only hay rich content (images, buttons)?
   - → Nếu rich: tooltip phải hoverable (pointerEvents: auto!)
5. **Parent có overflow:hidden?** — Tooltip bị clip?
   - → Nếu có: cần Portal rendering
6. **Nhiều tooltips cùng lúc?** — Chỉ 1 hay nhiều?

### A — Architecture

> 🗣 "Cốt lõi tooltip: positioning problem! Đây là phần khó nhất..."

```
KIẾN TRÚC TOOLTIP:
═══════════════════════════════════════════════════════

  Positioning Strategy:
  ┌─────────────────────────────────────────┐
  │              viewport                    │
  │                                          │
  │    overflow:hidden container             │
  │    ┌──────────────────────┐              │
  │    │  ┌──────┐            │              │
  │    │  │Button│ ← trigger  │              │
  │    │  └──────┘            │              │
  │    │                      │              │
  │    └──────────────────────┘              │
  │                                          │
  │    ┌──────────────┐                      │
  │    │  Tooltip!     │ ← PORTAL vào body!  │
  │    └──────────────┘   (thoát overflow!)  │
  └──────────────────────────────────────────┘

  State Machine:
  HIDDEN → (mouseenter/focus) → WAITING → (delay) → VISIBLE
  VISIBLE → (mouseleave/blur) → HIDING → (delay) → HIDDEN
  VISIBLE → (Escape key) → HIDDEN (instant!)
  VISIBLE → (scroll) → recalculate position!

  Position Calculation:
  1. getBoundingClientRect() trên trigger!
  2. Tính toạ độ tooltip dựa trên position preference!
  3. Check viewport collision!
  4. Auto-flip nếu bị cắt!
```

> 🗣 "Có 2 approaches: **relative positioning** (tooltip là child của trigger wrapper) vs **Portal + absolute** (tooltip render vào body). Portal tốt hơn vì thoát overflow:hidden!"

### D — Design

> 🗣 "Quyết định quan trọng nhất: position tính thế nào?"

```javascript
// CÁCH 1: CSS relative (simple! nhưng bị clip!)
<div style={{ position: "relative" }}>
  {" "}
  // wrapper
  <button>Trigger</button>
  <div style={{ position: "absolute", bottom: "100%" }}>
    {" "}
    // tooltip Content!
  </div>
</div>;
// ❌ Bị clip nếu parent có overflow:hidden!

// CÁCH 2: Portal + getBoundingClientRect (robust!)
const rect = trigger.getBoundingClientRect();
// rect = { top, left, width, height } relative to viewport!
const tooltipPos = {
  top: rect.top - tooltipHeight - gap + window.scrollY,
  left: rect.left + rect.width / 2 - tooltipWidth / 2,
};
// ✅ Render vào body → không bị clip!
// ✅ Position chính xác bằng viewport coords!

// CÁCH 3 (nâng cao): Floating UI algorithm
// Tự flip, shift, overlap khi collision!
```

> 🗣 "Tôi chọn Cách 2 cho production. Cách 1 chỉ ok cho prototype."

### I — Implementation

> 🗣 "Focus vào 2 phần tricky nhất: delay logic và viewport collision..."

```javascript
// DELAY LOGIC — Tại sao cần delay?
// Problem: user lướt mouse qua nhiều triggers → flicker!
// Solution: delay show + delay hide!

function useTooltip(showDelay = 200, hideDelay = 100) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);

  const show = () => {
    clearTimeout(hideTimer.current); // cancel pending hide!
    showTimer.current = setTimeout(
      () => setVisible(true),
      showDelay, // đợi 200ms trước khi show!
    );
  };

  const hide = () => {
    clearTimeout(showTimer.current); // cancel pending show!
    hideTimer.current = setTimeout(
      () => setVisible(false),
      hideDelay, // đợi 100ms trước khi hide!
      // TẠI SAO hideDelay < showDelay?
      // → User muốn đóng nhanh hơn mở!
      // → hideDelay > 0 để user kịp hover vào tooltip!
    );
  };

  // CLEANUP — tránh memory leak!
  useEffect(
    () => () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );

  return { visible, show, hide };
}

// VIEWPORT COLLISION — Auto flip!
function getFlippedPosition(triggerRect, preferredPos) {
  const gap = 60; // minimum space needed

  // Không đủ chỗ ở preferred position → flip!
  if (preferredPos === "top" && triggerRect.top < gap) return "bottom";
  if (
    preferredPos === "bottom" &&
    window.innerHeight - triggerRect.bottom < gap
  )
    return "top";
  if (preferredPos === "left" && triggerRect.left < gap) return "right";
  if (preferredPos === "right" && window.innerWidth - triggerRect.right < gap)
    return "left";

  return preferredPos; // đủ chỗ → giữ nguyên!
}
```

> 🗣 "Gotcha: `hideDelay` phải > 0 nếu tooltip có interactive content (links, buttons). Nếu = 0, user không kịp hover vào tooltip trước khi nó biến mất!"

### O — Optimization

1. **`requestAnimationFrame`** — throttle position recalculation khi scroll
2. **Portal** — tránh forced reflow trên parent khi tooltip appear
3. **`will-change: transform`** — browser pre-composite tooltip layer
4. **Lazy portal** — chỉ tạo portal khi tooltip visible lần đầu
5. **Event delegation** — 100 triggers? 1 event listener trên container, không phải 100!
6. **Intersection Observer** — recalc position khi trigger scroll vào/ra viewport

---

## 🎤 RADIO: Dialog (Modal)

### R — Requirements

> 🗣 "Modal là component phức tạp nhất! Nhiều requirements về accessibility và UX..."

1. **Focus trap?** — Tab/Shift+Tab cycle trong dialog
2. **Scroll lock?** — Body không scroll khi dialog mở
3. **Return focus?** — Focus quay lại trigger khi đóng
4. **Close mechanisms?** — Escape key, overlay click, X button
5. **Stacked modals?** — Dialog trong dialog?
6. **Animation?** — Fade in, scale up, slide?
7. **Content type?** — Form? Confirmation? Async data?
8. **Responsive?** — Full screen trên mobile?

> 🗣 "Tất cả! Đây là component cần đầy đủ nhất. Thiếu bất kỳ feature nào = fail accessibility audit."

### A — Architecture

```
KIẾN TRÚC DIALOG:
═══════════════════════════════════════════════════════

  Lifecycle:
  CLOSED → open() → OPENING → (animation done) → OPEN
  OPEN → close() → CLOSING → (animation done) → CLOSED

  Focus Management:
  ┌──────────────────────────────────────────────┐
  │  Page (z-index: 0)                           │
  │  ┌──── Button [focus here!] ← trigger ──┐   │
  │  │     ↕ save activeElement!             │   │
  │  │                                        │   │
  │  │  ┌─── Overlay (z-index: 9999) ───────┐│   │
  │  │  │  ┌── Dialog ────────────────────┐ ││   │
  │  │  │  │  [×] Title         ← close   │ ││   │
  │  │  │  │  ──────────────────          │ ││   │
  │  │  │  │  Content                     │ ││   │
  │  │  │  │  ──────────────────          │ ││   │
  │  │  │  │  [Cancel] [OK] ← first focus │ ││   │
  │  │  │  └──────────────────────────────┘ ││   │
  │  │  │    ↑ click outside = close!       ││   │
  │  │  └───────────────────────────────────┘│   │
  │  │     ↕ restore activeElement!          │   │
  │  └──── Button [focus restored!] ─────────┘   │
  └──────────────────────────────────────────────┘

  FOCUS TRAP (Tab key cycle):
  [×] → [Cancel] → [OK] → [×] → [Cancel] → ...
  (Shift+Tab: ngược lại!)

  Tab ở element cuối → focus element đầu!
  Shift+Tab ở element đầu → focus element cuối!

  3 TRỤY CỘT của Dialog:
  1. FOCUS TRAP — Tab key không thoát ra ngoài!
  2. SCROLL LOCK — Body overflow:hidden!
  3. RETURN FOCUS — Đóng → focus lại trigger!
```

> 🗣 "3 thứ PHẢI CÓ: focus trap, scroll lock, return focus. Thiếu 1 trong 3 = accessibility failure."

### D — Design

> 🗣 "Quyết định quan trọng: Portal hay inline?"

```javascript
// TẠI SAO CẦN Portal?
// 1. z-index stacking context: nếu dialog là child của
//    component có z-index, nó bị trapped trong stacking context!
// 2. overflow:hidden: dialog bị clip!
// 3. CSS positioning: relative/absolute ancestors ảnh hưởng!

// PORTAL giải quyết tất cả:
createPortal(
  <div className="overlay">
    <div className="dialog">...</div>
  </div>,
  document.body, // render trực tiếp vào body!
);
// → Dialog nằm ngoài React component tree!
// → Nhưng VẪN nhận React context, events! (Portal magic!)

// API Design:
// Simple:
<Dialog isOpen={open} onClose={() => setOpen(false)} title="Xoá?">
  <p>Bạn chắc chưa?</p>
</Dialog>;

// Confirmation (Promise-based!):
const ok = await confirm("Xoá item?", "Không hoàn tác!");
if (ok) {
  /* delete */
}
```

### I — Implementation

> 🗣 "3 hooks quan trọng nhất: useFocusTrap, useScrollLock, useReturnFocus..."

**Bước 1 — Focus Trap:**

```javascript
// CÂU HỎI: Làm sao "trap" focus bên trong dialog?
// TRẢ LỜI: Intercept Tab key, redirect focus!

function useFocusTrap(dialogRef, isOpen) {
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;

    // Bước 1: Tìm TẤT CẢ focusable elements!
    const getFocusable = () =>
      dialog.querySelectorAll(
        // Selector này cover TẤT CẢ focusable elements!
        "button, [href], input, select, textarea, " +
          '[tabindex]:not([tabindex="-1"])',
        // Chú ý: [tabindex="-1"] KHÔNG nằm trong list!
        // → Vì -1 = programmatically focusable only!
      );

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return; // chỉ care Tab!

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: backward
        if (document.activeElement === first) {
          e.preventDefault(); // BLOCK browser default!
          last.focus(); // Wrap to last!
        }
      } else {
        // Tab: forward
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus(); // Wrap to first!
        }
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);

    // Auto-focus first focusable element!
    const first = getFocusable()[0];
    first?.focus();

    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dialogRef]);
}
```

> 🗣 "Gotcha: `getFocusable()` gọi MỖI LẦN Tab — vì focusable elements có thể thay đổi (disabled buttons, dynamic content). Nếu cache → stale!"

**Bước 2 — Scroll Lock:**

```javascript
// TẠI SAO scroll lock?
// → User cuộn trang phía sau dialog = confusing UX!
// → Mobile: pull-to-refresh trigger khi cuộn dialog!

function useScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    // Save original overflow!
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // GOTCHA: Scrollbar biến mất → layout shift!
    // Fix: thêm padding-right = scrollbar width!
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = original;
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);
}
```

> 🗣 "Subtlety: khi set `overflow: hidden`, scrollbar biến mất → content shift sang phải! Fix bằng padding-right bằng scrollbar width!"

**Bước 3 — Return Focus:**

```javascript
// TẠI SAO return focus?
// → Keyboard user nhấn button → dialog mở → đóng dialog
// → Focus ở ĐÂU? Nếu không return → focus mất!
// → User phải Tab từ đầu page = terrible UX!

function useReturnFocus(isOpen) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Save element đang focus TRƯỚC KHI dialog mở!
      previousFocusRef.current = document.activeElement;
    } else if (previousFocusRef.current) {
      // Dialog đóng → trả focus lại!
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);
}
```

### O — Optimization

1. **Lazy render** — Dialog DOM chỉ tồn tại khi `isOpen=true`
2. **Animation performance** — `transform: scale()` + `opacity` (composite-only, không reflow!)
3. **Chia nhỏ overlay vs dialog** — Overlay animation riêng, dialog animation riêng (parallel!)
4. **`<dialog>` element** — HTML5 native! Built-in focus trap, Escape key, backdrop pseudo!
5. **Stacked modals**: Track dialog stack → chỉ trap focus ở dialog trên cùng
6. **Body padding trick** — Prevent layout shift khi scrollbar biến mất

---

## 🎤 RADIO: Table

### R — Requirements

> 🗣 "Table là component phức tạp nhất về data processing..."

1. **Data size?** — 100 rows? 10,000? 1M?
   - → <1000: client-side. >1000: server-side pagination hoặc virtualization
2. **Sorting?** — Client-side hay server-side?
3. **Filtering/Search?** — Column filter? Global search? Debounced?
4. **Pagination?** — Client-side hay server-side (cursor/offset)?
5. **Row actions?** — Edit, delete, select?
6. **Column features?** — Resize, reorder, pin, hide?
7. **Responsive?** — Horizontal scroll? Collapse columns?
8. **Accessibility?** — `scope="col"`, `aria-sort`, screen reader?

> 🗣 "Tôi sẽ build client-side table: sort, search, pagination, responsive. Nếu data > 1000, tôi sẽ note cần virtualization."

### A — Architecture

```
KIẾN TRÚC TABLE:
═══════════════════════════════════════════════════════

  Data Pipeline (luồng xử lý data!):

  Raw Data (props!)
      │
      ▼
  ┌── FILTER ──────────────────────────┐
  │   searchTerm → filter ALL columns  │
  │   O(n × cols) mỗi keystroke!       │
  │   → debounce 300ms!                │
  └────────┬───────────────────────────┘
           │ filtered data
           ▼
  ┌── SORT ────────────────────────────┐
  │   sortKey + sortDir (asc/desc!)    │
  │   localeCompare cho strings!       │
  │   numeric comparison cho numbers!  │
  └────────┬───────────────────────────┘
           │ sorted data
           ▼
  ┌── PAGINATE ────────────────────────┐
  │   page + pageSize → slice!         │
  │   totalPages = ceil(total/pageSize)│
  └────────┬───────────────────────────┘
           │ visible rows
           ▼
  ┌── RENDER ──────────────────────────┐
  │   <thead> sortable headers!        │
  │   <tbody> data rows!               │
  │   <tfoot> pagination controls!     │
  └────────────────────────────────────┘

  Thứ tự QUAN TRỌNG: Filter → Sort → Paginate!
  • Filter TRƯỚC sort: ít items hơn để sort!
  • Sort TRƯỚC paginate: sort toàn bộ, rồi cắt page!
  • Nếu đảo: sort chỉ áp dụng cho page hiện tại!
```

> 🗣 "Pipeline: filter → sort → paginate. Thứ tự RẤT quan trọng! Nếu paginate trước rồi sort → chỉ sort 10 rows trong page, không phải toàn bộ data!"

### D — Design

> 🗣 "Quyết định: `useMemo` hay tính toán mỗi render?"

```javascript
// TẠI SAO useMemo?
// → filter + sort = expensive (O(n log n) cho sort!)
// → Không nên tính lại nếu data/params không đổi!

const processedData = useMemo(() => {
  let result = [...data]; // clone!

  // Step 1: Filter
  if (search) {
    const term = search.toLowerCase();
    result = result.filter((row) =>
      columns.some((col) => String(row[col.key]).toLowerCase().includes(term)),
    );
  }

  // Step 2: Sort
  if (sortKey) {
    result.sort((a, b) => {
      const vA = a[sortKey],
        vB = b[sortKey];
      // Detect type → sort strategy!
      const cmp =
        typeof vA === "number"
          ? vA - vB // numeric sort!
          : String(vA).localeCompare(String(vB)); // string sort!
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  // Step 3: Paginate
  const total = result.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const rows = result.slice(start, start + pageSize);

  return { rows, total, totalPages };
}, [data, columns, search, sortKey, sortDir, page, pageSize]);
// → Chỉ recalculate khi dependencies thay đổi!
```

> 🗣 "Clone data trước khi sort! `Array.sort()` mutates in-place — nếu sort trực tiếp data, React sẽ confused vì reference không đổi!"

### I — Implementation

> 🗣 "Focus vào sort logic — phần hay bị sai..."

```javascript
// SORT: Toggle asc/desc khi click cùng column!
const toggleSort = (key) => {
  if (sortKey === key) {
    // Click cùng column: toggle direction!
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  } else {
    // Click column mới: reset to asc!
    setSortKey(key);
    setSortDir("asc");
  }
  // QUAN TRỌNG: Reset page về 1 khi sort thay đổi!
  // → User đang ở page 5, sort → kết quả page 5 hoàn toàn khác!
  setPage(1);
};

// SEARCH: Debounce!
// TẠI SAO debounce?
// → "abc" = 3 keystrokes = 3 filter operations!
// → Với 10,000 rows: 3 × O(n) = expensive!
// → Debounce: đợi user dừng gõ 300ms → 1 filter!

function useDebouncedSearch(delay = 300) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), delay);
    return () => clearTimeout(timer);
    // Cleanup: mỗi keystroke cancel timer trước!
    // Chỉ fire sau khi user dừng gõ {delay}ms!
  }, [search, delay]);

  return { search, setSearch, debouncedSearch };
}

// ARIA cho sortable headers:
<th
  scope="col"
  aria-sort={
    sortKey === col.key
      ? sortDir === "asc"
        ? "ascending"
        : "descending"
      : undefined // không set nếu column chưa sort!
  }
  onClick={() => toggleSort(col.key)}
>
  {col.label}
  {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
</th>;
```

> 🗣 "`aria-sort` chỉ set trên column đang sort! Nếu set trên tất cả columns = screen reader confused."

### O — Optimization

1. **`useMemo`** — Cache processed data, chỉ recalc khi deps thay đổi
2. **Debounced search** — Tránh filter mỗi keystroke (300ms)
3. **Virtualization** — 10,000+ rows? Chỉ render visible rows (~15)!
4. **Web Worker** — Sort 100k+ rows? Offload sang Worker thread!
5. **Column memoization** — `React.memo` cho mỗi cell, column không thay đổi = skip render
6. **Stable row keys** — Dùng `row.id` thay vì array index = better reconciliation
7. **Server-side** — Data quá lớn? Sort/filter/paginate trên server, client chỉ render!

```
Performance Thresholds:
═══════════════════════
< 100 rows     → Client-side, no optimization needed!
100 - 1,000    → Client-side + useMemo + debounce!
1,000 - 10,000 → Client-side + virtualization!
10,000+        → Server-side pagination + virtualization!
100,000+       → Server-side + Web Worker + infinite scroll!
```

---

## Checklist Part 2

```
[ ] Tooltip: hover/focus show, delay, viewport collision!
[ ] Tooltip: aria-describedby, role="tooltip"!
[ ] Dialog: focus trap, scroll lock, return focus!
[ ] Dialog: Escape close, overlay click close!
[ ] Dialog: Portal rendering (React createPortal)!
[ ] Dialog: role="dialog", aria-modal="true"!
[ ] Table: sort (toggle asc/desc), search filter!
[ ] Table: pagination (prev/next, page info)!
[ ] Table: scope="col", aria-sort on headers!
[ ] Table: custom render function per column!
[ ] Tất cả: Vanilla JS class + React hooks pattern!
[ ] Tất cả: Full accessibility (ARIA roles, keyboard!)!
[ ] Tất cả: RADIO walkthrough (R→A→D→I→O)!
```
