# React Chuyên Sâu: Cơ Chế Thực Thi của setState — Deep Dive

> 📅 2026-02-12 · ⏱ 12 phút đọc
>
> Nguồn: TikTok Front-End Security Team (ByteDance) · 34,891 lượt đọc
> setState là ĐỒNG BỘ hay BẤT ĐỒNG BỘ? — Câu trả lời sẽ khiến bạn bất ngờ!
> Batch update, isBatchingUpdates, Transaction, partialState merge
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know React Interview Question

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | Các vấn đề thường gặp khi dùng setState       |
| 2   | setState trong lifecycle & synthetic events   |
| 3   | setState trong setTimeout & native events     |
| 4   | Tại sao 2 lần setState chỉ có tác dụng 1 lần? |
| 5   | Quy trình thực thi setState (Flowchart)       |
| 6   | 10 bước thực thi chi tiết                     |
| 7   | Cơ chế merging — Object vs Function           |
| 8   | Transaction Mechanism                         |
| 9   | Gọi setState trong các lifecycle khác nhau    |
| 10  | Tổng kết & Checklist phỏng vấn                |

---

## §1. Các vấn đề thường gặp

```
3 CÂU HỎI KINH ĐIỂN VỀ setState:
═══════════════════════════════════════════════════════════════

  ① setState là ĐỒNG BỘ hay BẤT ĐỒNG BỘ?
     → Tại sao có khi lấy được giá trị mới, có khi không?

  ② Tại sao gọi setState 2 lần nhưng chỉ cập nhật 1 lần?
     → Truyền object vs truyền function: khác nhau thế nào?

  ③ Có nên gọi setState trong componentDidMount không?
     → Và TUYỆT ĐỐI KHÔNG gọi ở đâu?

  → Tất cả đều liên quan đến CƠ CHẾ BATCH UPDATE của React!
```

---

## §2. setState trong Lifecycle & Synthetic Events

### Kịch bản: Gọi setState trong componentDidMount

```javascript
componentWillUpdate() {
    console.log('componentWillUpdate');
}
componentDidUpdate() {
    console.log('componentDidUpdate');
}
componentDidMount() {
    console.log('Gọi setState lần 1');
    this.setState({ index: this.state.index + 1 });
    console.log('state', this.state.index);  // ← Giá trị CŨ!

    console.log('Gọi setState lần 2');
    this.setState({ index: this.state.index + 1 });
    console.log('state', this.state.index);  // ← Vẫn giá trị CŨ!
}
```

```
KẾT QUẢ THỰC THI:
═══════════════════════════════════════════════════════════════

  Gọi setState lần 1
  state 0                  ← KHÔNG CẬP NHẬT NGAY!
  Gọi setState lần 2
  state 0                  ← VẪN LÀ 0!
  componentWillUpdate      ← Update xảy ra SAU KHI didMount kết thúc
  componentDidUpdate

  3 NHẬN XÉT QUAN TRỌNG:
  ┌────────────────────────────────────────────────────────┐
  │ ① setState KHÔNG cập nhật ngay lập tức                │
  │   → Cả 2 lần đều in ra giá trị CŨ (0)               │
  │                                                        │
  │ ② Tất cả component dùng CHUNG cơ chế update          │
  │   → Child didMount → Parent didMount → rồi mới update│
  │                                                        │
  │ ③ Nhiều setState được GỘP (batch/merge)               │
  │   → 2 lần setState → chỉ trigger 1 lần update!       │
  │   → componentWillUpdate chỉ chạy 1 lần!              │
  └────────────────────────────────────────────────────────┘
```

---

## §3. setState trong setTimeout & Native Events

### Kịch bản: Gọi setState trong setTimeout

```javascript
componentDidMount() {
    setTimeout(() => {
        console.log('Gọi setState lần 1');
        this.setState({ index: this.state.index + 1 });
        console.log('state', this.state.index);  // ← Giá trị MỚI!

        console.log('Gọi setState lần 2');
        this.setState({ index: this.state.index + 1 });
        console.log('state', this.state.index);  // ← Giá trị MỚI!
    }, 0);
}
```

```
KẾT QUẢ THỰC THI:
═══════════════════════════════════════════════════════════════

  Gọi setState lần 1
  componentWillUpdate       ← Update NGAY LẬP TỨC!
  componentDidUpdate
  state 1                   ← ĐÃ CẬP NHẬT!

  Gọi setState lần 2
  componentWillUpdate       ← Update NGAY LẬP TỨC lần 2!
  componentDidUpdate
  state 2                   ← ĐÃ CẬP NHẬT!

  NHẬN XÉT:
  ┌────────────────────────────────────────────────────────┐
  │ ① setState ĐỒNG BỘ trong setTimeout!                  │
  │   → Cập nhật ngay, đọc được giá trị mới              │
  │                                                        │
  │ ② Mỗi setState trigger 1 lần update RIÊNG            │
  │   → KHÔNG batch! 2 lần setState = 2 lần render!      │
  │                                                        │
  │ ③ Tương tự với: native DOM events,                    │
  │   Promise callbacks, fetch/XMLHttpRequest callbacks   │
  └────────────────────────────────────────────────────────┘
```

```
BẢNG SO SÁNH HÀNH VI setState:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────┬───────────────────┐
  │ Ngữ cảnh                │ Batch?     │ Hành vi           │
  ├──────────────────────────┼────────────┼───────────────────┤
  │ Lifecycle (didMount...)  │ ✅ CÓ      │ Không update ngay │
  │ React synthetic events   │ ✅ CÓ      │ Không update ngay │
  │ (onClick, onChange...)   │            │                   │
  ├──────────────────────────┼────────────┼───────────────────┤
  │ setTimeout / setInterval │ ❌ KHÔNG   │ Update NGAY       │
  │ Native DOM events        │ ❌ KHÔNG   │ Update NGAY       │
  │ Promise .then()          │ ❌ KHÔNG   │ Update NGAY       │
  │ fetch/XHR callbacks      │ ❌ KHÔNG   │ Update NGAY       │
  └──────────────────────────┴────────────┴───────────────────┘

  ⚠️ LƯU Ý REACT 18+:
  → React 18 tự động batch TẤT CẢ setState (kể cả setTimeout!)
  → Dùng flushSync() nếu muốn force update ngay
  → Bảng trên áp dụng cho React 16/17!
```

---

## §4. Tại sao 2 lần setState chỉ có tác dụng 1 lần?

### Kịch bản A: Truyền OBJECT

```javascript
componentDidMount() {
    // state.index ban đầu = 0
    this.setState({ index: this.state.index + 1 }, () => {
        console.log(this.state.index); // → 1
    });
    this.setState({ index: this.state.index + 1 }, () => {
        console.log(this.state.index); // → 1  ← KHÔNG PHẢI 2!
    });
}
// Kết quả: 1, 1
```

### Kịch bản B: Truyền FUNCTION

```javascript
componentDidMount() {
    // state.index ban đầu = 0
    this.setState((preState) => ({ index: preState.index + 1 }), () => {
        console.log(this.state.index); // → 2
    });
    this.setState((preState) => ({ index: preState.index + 1 }), () => {
        console.log(this.state.index); // → 2  ← ĐÚNG!
    });
}
// Kết quả: 2, 2
```

```
TẠI SAO LẠI KHÁC NHAU?
═══════════════════════════════════════════════════════════════

  TRUYỀN OBJECT → BỊ MERGE!
  Nội bộ React dùng Object.assign():

  Object.assign(
      nextState,
      { index: state.index + 1 },  // = { index: 0 + 1 } = { index: 1 }
      { index: state.index + 1 }   // = { index: 0 + 1 } = { index: 1 }
  )
  → Cả 2 đều đọc state.index = 0 (giá trị CŨ!)
  → Object.assign merge → { index: 1 }
  → Kết quả: CHỈ TĂNG 1! ❌

  TRUYỀN FUNCTION → KHÔNG BỊ MERGE!
  → Function nhận preState là kết quả merge TRƯỚC ĐÓ
  → Lần 1: preState.index = 0 → return { index: 1 }
  → Lần 2: preState.index = 1 → return { index: 2 }  ✅
  → Kết quả: TĂNG 2 lần đúng!

  QUY TẮC VÀNG:
  ┌────────────────────────────────────────────────────────┐
  │ → Khi state mới PHỤ THUỘC state cũ → TRUYỀN FUNCTION │
  │ → this.setState(prev => ({ count: prev.count + 1 }))  │
  │                                                        │
  │ → Khi state mới KHÔNG phụ thuộc cũ → truyền object OK │
  │ → this.setState({ name: 'Jun' })                      │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Quy trình thực thi setState (Flowchart)

```
SETSTATE FLOWCHART — TOÀN BỘ QUY TRÌNH:
═══════════════════════════════════════════════════════════════

  setState(partialState)
       │
       ▼
  ┌─────────────────────────────────────┐
  │ updater.enqueueSetState()           │
  │ → Lấy instance component hiện tại  │
  └───────────────┬─────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────┐
  │ Component có _pendingStateQueue?    │──── Không ────┐
  └───────────────┬─────────────────────┘               │
                  │ Có                                   │
                  ▼                                      ▼
  ┌─────────────────────────────────────┐   ┌───────────────────┐
  │ Push partialState vào               │   │ Tạo mới           │
  │ _pendingStateQueue                  │   │ _pendingStateQueue│
  └───────────────┬─────────────────────┘   └───────┬───────────┘
                  │                                  │
                  ▼◄─────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ updater.enqueueUpdate()             │
  └───────────────┬─────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────┐
  │ isBatchingUpdates === true?         │ ← CÂU HỎI QUYẾT ĐỊNH!
  └──────┬──────────────────┬───────────┘
         │ TRUE             │ FALSE
         ▼                  ▼
  ┌──────────────┐   ┌──────────────────────────────┐
  │ Thêm vào     │   │ Set isBatchingUpdates = true  │
  │ dirtyComps   │   │ Dùng transaction gọi lại      │
  │ (chờ đợi!)   │   │ → thêm vào dirtyComponents   │
  └──────────────┘   │ → rồi FLUSH ngay lập tức     │
                     └──────────────────────────────┘
         │                  │
         ▼                  ▼
  ┌─────────────────────────────────────┐
  │ FLUSH_BATCHED_UPDATES               │
  │ (Transaction waper.close)           │
  └───────────────┬─────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────┐
  │ Duyệt dirtyComponents              │
  │ → Từng component thực thi update   │
  └───────────────┬─────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────┐
  │ updateComponent()                   │
  │                                     │
  │ ① componentWillReceiveProps        │
  │ ② _processPendingState (merge!)    │
  │ ③ componentShouldUpdate → false?   │
  │    → DỪNG! Không update!           │
  │ ④ componentWillUpdate              │
  │ ⑤ render() → cập nhật giao diện   │
  │ ⑥ componentDidUpdate              │
  └─────────────────────────────────────┘
```

```
5 KHÁI NIỆM QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────┬────────────────────────────────────┐
  │ Khái niệm             │ Giải thích                         │
  ├───────────────────────┼────────────────────────────────────┤
  │ partialState          │ Arg đầu tiên của setState          │
  │                       │ (object HOẶC function)             │
  ├───────────────────────┼────────────────────────────────────┤
  │ _pendingStateQueue    │ Hàng đợi state chờ update         │
  │                       │ của TỪNG component                 │
  ├───────────────────────┼────────────────────────────────────┤
  │ isBatchingUpdates     │ Cờ batch update — DÙNG CHUNG!     │
  │                       │ true = đang batch, chưa update!   │
  ├───────────────────────┼────────────────────────────────────┤
  │ dirtyComponents       │ Hàng đợi CÁC component            │
  │                       │ đang chờ update                    │
  ├───────────────────────┼────────────────────────────────────┤
  │ Transaction           │ Cơ chế của React: thực thi method │
  │                       │ bọc bởi N wrappers                │
  │                       │ (wrapper.init → method → .close)  │
  └───────────────────────┴────────────────────────────────────┘
```

---

## §6. 10 bước thực thi chi tiết

```
10 BƯỚC setState:
═══════════════════════════════════════════════════════════════

  ① Lưu partialState vào _pendingStateQueue
     → Hàng đợi state chờ xử lý của component hiện tại

  ② Kiểm tra isBatchingUpdates
     → TRUE: React đang trong quá trình update
       → Chỉ thêm component vào dirtyComponents → DỪNG!
     → FALSE: tiếp tục bước 3

  ③ Set isBatchingUpdates = true
     → Dùng transaction để gọi lại quy trình
     → Đảm bảo component được thêm vào dirtyComponents

  ④ Transaction waper.close gọi FLUSH_BATCHED_UPDATES
     → Duyệt qua TẤT CẢ dirtyComponents
     → Thực thi update cho từng component

  ⑤ componentWillReceiveProps (nếu có props mới)

  ⑥ _processPendingState — MERGE STATE!
     → Merge tất cả state trong _pendingStateQueue
     → Dùng Object.assign() cho objects
     → Gọi function(prevState) cho functions
     → Xóa _pendingStateQueue sau khi merge

  ⑦ componentShouldUpdate
     → return false? → DỪNG! Không update tiếp!
     → return true? → tiếp tục

  ⑧ componentWillUpdate

  ⑨ render() — CẬP NHẬT GIAO DIỆN

  ⑩ componentDidUpdate
```

---

## §7. Cơ chế Merging — Object vs Function

### Source code `_processPendingState`

```javascript
_processPendingState: function(props, context) {
    var inst = this._instance;
    var queue = this._pendingStateQueue;
    var replace = this._pendingReplaceState;
    this._pendingReplaceState = false;
    this._pendingStateQueue = null;

    if (!queue) {
        return inst.state;
    }

    if (replace && queue.length === 1) {
        return queue[0];
    }

    var nextState = _assign({}, replace ? queue[0] : inst.state);
    for (var i = replace ? 1 : 0; i < queue.length; i++) {
        var partial = queue[i];
        // ← DÒNG QUAN TRỌNG NHẤT!
        _assign(
            nextState,
            typeof partial === 'function'
                ? partial.call(inst, nextState, props, context)  // ← Function: nhận prevState!
                : partial  // ← Object: merge trực tiếp!
        );
    }
    return nextState;
},
```

```
PHÂN TÍCH DÒNG CODE QUYẾT ĐỊNH:
═══════════════════════════════════════════════════════════════

  _assign(nextState, typeof partial === 'function'
      ? partial.call(inst, nextState, props, context)
      : partial
  );

  TRƯỜNG HỢP 1: partial là OBJECT
  → Object.assign(nextState, { index: 1 }, { index: 1 })
  → Cùng key "index" → giá trị sau ghi đè trước!
  → Kết quả: { index: 1 } ← CHỈ TĂNG 1!

  TRƯỜNG HỢP 2: partial là FUNCTION
  → Lần 1: partial(nextState={index:0}) → return {index:1}
  →         nextState bây giờ = { index: 1 }
  → Lần 2: partial(nextState={index:1}) → return {index:2}
  →         nextState bây giờ = { index: 2 }
  → Kết quả: { index: 2 } ← ĐÚNG! ✅

  VÌ SAO: Function nhận nextState (kết quả merge TRƯỚC ĐÓ)!
```

```
MINH HỌA MERGER CHI TIẾT:
═══════════════════════════════════════════════════════════════

  BAN ĐẦU: state = { index: 0, name: 'Jun' }

  GỌI 3 LẦN setState:
  ┌────┬────────────────────────────────┬──────────────────────┐
  │ #  │ setState call                  │ _pendingStateQueue   │
  ├────┼────────────────────────────────┼──────────────────────┤
  │ 1  │ setState({ index: 1 })        │ [{ index: 1 }]       │
  │ 2  │ setState({ index: 2 })        │ [{ index: 1 },       │
  │    │                                │  { index: 2 }]       │
  │ 3  │ setState({ name: 'Lee' })     │ [{ index: 1 },       │
  │    │                                │  { index: 2 },       │
  │    │                                │  { name: 'Lee' }]    │
  └────┴────────────────────────────────┴──────────────────────┘

  KHI FLUSH:
  nextState = Object.assign({}, state)         = { index: 0, name: 'Jun' }
  nextState = Object.assign(ns, { index: 1 })  = { index: 1, name: 'Jun' }
  nextState = Object.assign(ns, { index: 2 })  = { index: 2, name: 'Jun' }
  nextState = Object.assign(ns, { name:'Lee'}) = { index: 2, name: 'Lee' }

  KẾT QUẢ CUỐI CÙNG: { index: 2, name: 'Lee' }
  → CHỈ 1 lần render cho 3 lần setState!
```

---

## §8. Transaction Mechanism

```
REACT TRANSACTION — CƠ CHẾ BỌC HÀM:
═══════════════════════════════════════════════════════════════

  Transaction = Bọc 1 hàm với N wrappers
  → Mỗi wrapper có: init() và close()

  THỨ TỰ THỰC THI:
  ┌─────────────────────────────────────────────────────────┐
  │ wrapper1.init()                                         │
  │   wrapper2.init()                                       │
  │     ┌───────────────────────────────────────┐           │
  │     │ PHƯƠNG THỨC CHÍNH ĐƯỢC GỌI            │           │
  │     │ (ví dụ: batchedUpdates)               │           │
  │     └───────────────────────────────────────┘           │
  │   wrapper2.close()                                      │
  │ wrapper1.close()                                        │
  └─────────────────────────────────────────────────────────┘

  TRONG CONTEXT setState:

  Transaction batchedUpdates:
  ┌─────────────────────────────────────────────────────────┐
  │ init: isBatchingUpdates = true                          │
  │                                                         │
  │   → Lifecycle methods chạy                             │
  │   → setState gọi → thêm vào queue (vì isBatch = true) │
  │   → setState gọi → thêm vào queue (vì isBatch = true) │
  │                                                         │
  │ close: FLUSH_BATCHED_UPDATES                            │
  │   → Duyệt dirtyComponents                              │
  │   → Merge state                                         │
  │   → Render tất cả                                       │
  │   → isBatchingUpdates = false                           │
  └─────────────────────────────────────────────────────────┘

  VÌ SAO setTimeout KHÁC:

  Transaction batchedUpdates:
  ┌─────────────────────────────────────────────────────────┐
  │ init: isBatchingUpdates = true                          │
  │                                                         │
  │   → componentDidMount() {                              │
  │       setTimeout(() => {                                │
  │         // ← Code này chạy SAU close!                  │
  │         // → isBatchingUpdates = false rồi!            │
  │         // → setState update NGAY!                     │
  │       }, 0);                                            │
  │     }                                                   │
  │                                                         │
  │ close: FLUSH_BATCHED_UPDATES                            │
  │   → isBatchingUpdates = false                           │
  └─────────────────────────────────────────────────────────┘
  → setTimeout callback chạy NGOÀI transaction!
  → isBatchingUpdates = false → setState ĐỒNG BỘ!
```

---

## §9. Gọi setState trong các lifecycle

```
setState TRONG CÁC LIFECYCLE:
═══════════════════════════════════════════════════════════════

  ✅ componentDidMount:
  → Được phép nhưng KHÔNG KHUYẾN KHÍCH!
  → Gây thêm 1 lần render (performance waste)
  → Nhưng xảy ra TRƯỚC khi browser paint → user không thấy!
  → CÁC TRƯỜNG HỢP HỢP LỆ:
    - Modal/tooltip: cần đo DOM trước khi render
    - Gọi API → setState trong callback (đây là ĐÚNG!)
    - State phụ thuộc vào kích thước DOM element
  → Nếu có thể, khởi tạo state trong constructor() thay thế!

  ❌ componentWillUpdate — TUYỆT ĐỐI KHÔNG!
  → Gọi setState → trigger update → gọi lại componentWillUpdate
  → → trigger update → gọi lại componentWillUpdate
  → → → VÒNG LẶP VÔ HẠN! App crash! 💀

  ❌ componentDidUpdate — TUYỆT ĐỐI KHÔNG!
  → Lý do tương tự: VÒNG LẶP VÔ HẠN!
  → setState → render → componentDidUpdate → setState → ...
  → (Trừ khi bọc trong condition: if (prevProps !== this.props))

  ✅ componentWillReceiveProps:
  → An toàn — React xử lý đúng, không gây vòng lặp

  ✅ Synthetic events (onClick, onChange...):
  → An toàn — trong batch update context

  ┌────────────────────────────┬─────────┬──────────────────┐
  │ Lifecycle                  │ Gọi?    │ Ghi chú          │
  ├────────────────────────────┼─────────┼──────────────────┤
  │ constructor                │ ❌      │ Dùng this.state= │
  │ componentWillMount         │ ⚠️      │ Deprecated!      │
  │ render                     │ ❌      │ Pure function!   │
  │ componentDidMount          │ ⚠️      │ Được, nhưng cẩn  │
  │ componentWillReceiveProps  │ ✅      │ An toàn           │
  │ shouldComponentUpdate      │ ❌      │ Vòng lặp!        │
  │ componentWillUpdate        │ ❌❌    │ VÒNG LẶP! 💀     │
  │ componentDidUpdate         │ ❌❌    │ VÒNG LẶP! 💀     │
  │ componentWillUnmount       │ ❌      │ Không render nữa │
  └────────────────────────────┴─────────┴──────────────────┘
```

---

## §10. Tổng kết & Checklist phỏng vấn

```
CÂU TRẢ LỜI HOÀN HẢO: "setState ĐỒNG BỘ HAY BẤT ĐỒNG BỘ?"
═══════════════════════════════════════════════════════════════

  "setState BẢN CHẤT là ĐỒNG BỘ!
   Nó chỉ TRÔNG GIỐNG bất đồng bộ trong một số ngữ cảnh."

  GIẢI THÍCH:
  → Trong lifecycle/synthetic events:
    - React đang batch update (isBatchingUpdates = true)
    - setState chỉ thêm vào queue, CHƯA update
    - Sau khi lifecycle chạy xong → flush tất cả
    → TRÔNG NHƯ bất đồng bộ, nhưng thực ra CHỈ LÀ TRÌ HOÃN!

  → Trong setTimeout/native events:
    - Nằm NGOÀI React transaction
    - isBatchingUpdates = false
    - setState update NGAY LẬP TỨC
    → Đồng bộ rõ ràng!

  → REACT 18+ (Automatic Batching):
    - TẤT CẢ setState đều batch (kể cả setTimeout!)
    - Dùng ReactDOM.flushSync() để force update ngay
```

```
CÁCH DÙNG setState ĐƯỢC KHUYẾN KHÍCH:
═══════════════════════════════════════════════════════════════

  // ✅ CÁCH 1: Truyền function khi phụ thuộc state cũ
  this.setState(
      (prevState) => ({ count: prevState.count + 1 }),
      () => {
          // Callback — chạy SAU KHI update xong!
          console.log('Giá trị mới:', this.state.count);
      }
  );

  // ✅ CÁCH 2: Truyền object khi không phụ thuộc state cũ
  this.setState(
      { name: 'Jun' },
      () => console.log(this.state.name) // 'Jun'
  );

  // ❌ SAI: Đọc state ngay sau setState (trong batch context)
  this.setState({ count: this.state.count + 1 });
  console.log(this.state.count); // ← GIÁ TRỊ CŨ!
```

### Checklist

- [ ] **setState bản chất**: ĐỒNG BỘ — chỉ trì hoãn trong batch update context
- [ ] **Lifecycle + synthetic events**: isBatchingUpdates = true → queue → flush sau
- [ ] **setTimeout + native events**: isBatchingUpdates = false → update NGAY (React 16/17)
- [ ] **React 18+**: Automatic Batching — TẤT CẢ đều batch, dùng `flushSync()` để opt-out
- [ ] **Object merge**: `Object.assign()` ghi đè key trùng → 2 lần setState cùng key = 1 lần
- [ ] **Function merge**: nhận `prevState` từ merge trước → kết quả chính xác ✅
- [ ] **Quy tắc vàng**: phụ thuộc state cũ → truyền function; không → truyền object
- [ ] **5 khái niệm**: partialState, `_pendingStateQueue`, isBatchingUpdates, dirtyComponents, Transaction
- [ ] **Transaction**: init → method → close; `FLUSH_BATCHED_UPDATES` nằm trong close
- [ ] **setTimeout ngoài transaction**: callback chạy SAU close → isBatch = false → sync!
- [ ] **componentDidMount**: được nhưng không khuyến khích (thêm render), trừ khi cần đo DOM
- [ ] **componentWillUpdate / componentDidUpdate**: ❌ TUYỆT ĐỐI KHÔNG → vòng lặp vô hạn!
- [ ] **`_processPendingState`**: source code quyết định merge object hay gọi function
- [ ] **Callback**: `setState(state, callback)` — callback chạy SAU update xong, lấy giá trị mới
- [ ] **Batch update flow**: setState → queue → check isBatch → dirtyComps → flush → merge → shouldUpdate → render

---

_Nguồn: "React In-Depth: Cơ Chế Thực Thi của setState" — TikTok Front-End Team (ByteDance) · 34,891 lượt đọc_
_Cập nhật lần cuối: Tháng 2, 2026_
