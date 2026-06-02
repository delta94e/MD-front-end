# React Rendering Technical Deep Dive

## You

Present technical deep dives to engineering Meta org về chủ đề bài viết bên dưới bằng tiếng việt đầy đủ chuyên sâu đi vào bản chất và dễ hiểu:

## Claude


# React Rendering Process - Kiến thức nền tảng cần thiết


## Giới thiệu


Để hiểu sâu về source code của React, chúng ta cần nắm vững một số khái niệm cơ bản trước. Bài viết này sẽ đi sâu vào hai khái niệm quan trọng nhất: **Fiber** và **Lane** - những nền tảng của hệ thống rendering hiện đại của React.


## 1. Fiber Architecture - Kiến trúc Fiber


### 1.1 Tại sao cần Fiber?


Trước React 16, quá trình rendering có những hạn chế nghiêm trọng:


**Vấn đề của React 15:**


- **Blocking Rendering**: Một khi bắt đầu render, không thể ngắt quá trình cho đến khi hoàn thành
- **Poor User Experience**: UI bị đóng băng, gây trải nghiệm người dùng kém
- **No Priority System**: Không có cách nào để phân ưu tiên các task khác nhau


**Giải pháp Fiber mang lại:**


🔹 **Time Slicing**: Chia nhỏ công việc rendering thành các chunk nhỏ, có thể thực hiện trong những khoảng thời gian rảnh


🔹 **Interruptible Tasks**: Có thể tạm dừng task hiện tại để xử lý những task có priority cao hơn


🔹 **Resumable Tasks**: Sau khi xử lý xong task ưu tiên cao, có thể tiếp tục task đã bị tạm dừng


🔹 **Lane Model**: Hệ thống phân ưu tiên thông minh, ưu tiên các tương tác của user


### 1.2 Fiber là gì?


Fiber có hai ý nghĩa chính:


#### A. Data Structure (Cấu trúc dữ liệu)


- Bản chất là một JavaScript object
- Mỗi component instance tương ứng với một Fiber node
- Lưu trữ thông tin về component type, props, state, side effects


#### B. Execution Unit (Đơn vị thực thi)


- React chia nhỏ một rendering task thành nhiều Fiber tasks nhỏ
- Các units này có thể được thực thi theo batch, pause, resume, hoặc discard


### 1.3 Cấu trúc Fiber Node


```typescript
interface FiberNode {
  // Định danh và loại
  tag: number;                    // Loại node (FunctionComponent, ClassComponent, etc.)
  key: string | null;             // Unique identifier cho diff algorithm
  elementType: any;               // Loại gốc sau khi JSX được convert
  type: any;                      // Component type hoặc tag name

  // Quan hệ cha con
  return: Fiber | null;           // Trỏ đến parent node
  child: Fiber | null;            // Child node đầu tiên
  sibling: Fiber | null;          // Sibling node tiếp theo
  index: number;                  // Vị trí trong danh sách sibling

  // Dữ liệu component
  stateNode: any;                 // DOM node thực hoặc component instance
  ref: any;                       // Component ref
  pendingProps: any;              // Props mới cho lần render này
  memoizedProps: any;             // Props từ lần render trước
  memoizedState: any;             // State hoặc hooks từ lần render trước

  // Update và side effects
  updateQueue: any;               // Queue chứa setState và các updates khác
  flags: number;                  // Side effect flags của node hiện tại
  subtreeFlags: number;           // Tập hợp side effects của subtree
  deletions: Fiber[] | null;      // Danh sách child nodes sẽ bị xóa

  // Priority và scheduling
  lanes: number;                  // Priority set của node hiện tại
  childLanes: number;             // Priority set của subtree

  // Double buffering
  alternate: Fiber | null;        // Fiber node khác (workInProgress)
}
```


### 1.4 Fiber Tree Structure


Fiber Tree tổ chức thành cấu trúc cây với các mối quan hệ:


```
Fiber A (root)
      /              \
  child           alternate
    |                 |
 Fiber B ←→ sibling → Fiber C
    ↑                   ↑
  return              return
    |                   |
   Fiber A'         Fiber A'
```


**Double Buffering**: React duy trì hai cây Fiber:


- **Current Tree**: Cây hiện tại đang được hiển thị
- **WorkInProgress Tree**: Cây đang được xây dựng cho lần render tiếp theo


## 2. Lane Model - Hệ thống ưu tiên


### 2.1 Khái niệm Lane


Lane là hệ thống quản lý priority nội bộ của React scheduler. Mỗi Lane được biểu diễn bằng một binary bit, và có thể kết hợp nhiều Lane bằng phép OR bitwise.


### 2.2 Các loại Lane chính


```typescript
// Định nghĩa các Lane priorities
const SyncLane = 0b0000000000000000000000000000001;           // Priority cao nhất
const InputContinuousLane = 0b0000000000000000000000000000010;  // Input liên tục
const DefaultLane = 0b0000000000000000000000000000100;         // Priority mặc định
const TransitionLane1 = 0b0000000000000000000000000001000;     // Transition đầu tiên
// ... TransitionLane2 đến TransitionLane16
const IdleLane = 0b0100000000000000000000000000000000;         // Priority thấp nhất
```


### 2.3 Mapping Events to Priorities


```
DiscreteEventPrioritySyncLaneContinuousEventPriorityInputContinuousLaneDefaultEventPriorityDefaultLaneIdleEventPriorityIdleLane
```


### 2.4 Các phương thức Lane quan trọng


#### A. getHighestPriorityLane


```typescript
function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;  // Lấy bit 1 rightmost (priority cao nhất)
}
```


**Giải thích**:


- `-lanes = ~lanes + 1` (Two's complement)
- `lanes & -lanes` trả về bit 1 rightmost
- Trong thiết kế Lane, bit rightmost có priority cao nhất


#### B. mergeLanes


```typescript
function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;  // Merge hai priorities
}
```


**Ví dụ**: `001 | 010 = 011` - Kết hợp hai priorities thành một


#### C. removeLanes


```typescript
function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;  // Loại bỏ subset khỏi set
}
```


#### D. isSubsetOfLanes


```typescript
function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane): boolean {
  return (set & subset) === subset;
}
```


**Logic**: Nếu giao của `set` và `subset` bằng `subset`, thì `subset` là con của `set`


### 2.5 Priority Scheduling Algorithm


```typescript
function higherPriorityLane(a: Lane, b: Lane): Lane {
  // Số nhỏ hơn = priority cao hơn
  return a !== NoLane && a < b ? a : b;
}
```


**Quy tắc**: Trong hệ thống Lane, số càng nhỏ thì priority càng cao.


## 3. Practical Applications


### 3.1 Concurrent Rendering Flow


```javascript
// Ví dụ: User click button trong khi có animation đang chạy
function handleClick() {
  // DiscreteEventPriority (SyncLane) - Highest priority
  setCount(count + 1);
}

function runAnimation() {
  // TransitionLane - Lower priority
  startTransition(() => {
    setAnimationFrame(frame + 1);
  });
}
```


**Scheduling behavior**:


1. User click được xử lý ngay lập tức (SyncLane)
2. Animation có thể bị tạm dừng để xử lý click
3. Sau khi click xong, animation tiếp tục từ điểm dừng


### 3.2 Lane Operations trong Practice


```typescript
// Merge multiple priorities
const combinedLanes = mergeLanes(SyncLane, DefaultLane);
// Result: 0b101 (contains both sync and default priorities)

// Check if high priority work exists
const hasUrgentWork = includesSomeLane(workInProgressRootRenderLanes, SyncLane);

// Remove completed work
const remainingWork = removeLanes(pendingLanes, completedLanes);
```


## 4. Performance Benefits


### 4.1 Before Fiber (React 15)


```
Task Start → [Long Blocking Work] → Task Complete
              ↑
          UI Frozen, Poor UX
```


### 4.2 With Fiber (React 16+)


```
Task Start → [Chunk 1] → [High Priority Interrupt] → [Resume Chunk 2] → Complete
              ↑              ↑                        ↑
          Interruptible   Handle User Input       Smooth Experience
```


### 4.3 Scheduling Advantages


🚀 **Time Slicing**: Chia nhỏ công việc, tránh blocking main thread


⚡ **Priority-based Scheduling**: Xử lý user interactions trước, background tasks sau


🔄 **Concurrent Features**: Hỗ trợ Suspense, Concurrent Mode, và các tính năng hiện đại


## 5. Kết luận


Fiber và Lane là hai trụ cột của kiến trúc React hiện đại:


- **Fiber** cung cấp cơ sở hạ tầng cho concurrent rendering thông qua cấu trúc dữ liệu linh hoạt và khả năng interrupt/resume
- **Lane** cung cấp hệ thống priority thông minh, đảm bảo user experience mượt mà


Hiểu rõ hai khái niệm này là chìa khóa để:


- Tối ưu hóa performance ứng dụng React
- Debug các vấn đề rendering phức tạp
- Tận dụng tối đa các tính năng concurrent của React
- Đọc hiểu source code React một cách sâu sắc


Những kiến thức này sẽ là nền tảng vững chắc cho việc nghiên cứu sâu hơn về React internals và các pattern optimization nâng cao.
