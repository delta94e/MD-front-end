# Hướng Dẫn Học Tập: React Fiber và Cơ Chế Điều Phối

## 1. Fiber là gì?

### Định nghĩa
**Fiber** là đơn vị lập lịch cốt lõi trong React 16 trở lên, giải quyết vấn đề không thể gián đoạn của Stack Reconciler truyền thống (React 15 và các phiên bản trước đó).

### Cách hoạt động
React chuyển đổi cây component thành **danh sách Fiber** (duyệt theo chiều sâu - depth-first traversal), trong đó mỗi node Fiber tương ứng với một React element (component hoặc DOM node).

### Cấu trúc dữ liệu Fiber

```typescript
// Cấu trúc dữ liệu Fiber
interface Fiber {
  // Thông tin định danh
  tag: WorkTag;        // Loại component (function component/class component/DOM node, v.v.)
  key: string | null;  // Định danh duy nhất giữa các node cùng cấp
  type: any;           // Hàm khởi tạo component hoặc tên thẻ DOM (ví dụ: 'div')

  // Quan hệ cấu trúc cây
  return: Fiber | null;    // Node cha
  child: Fiber | null;     // Node con đầu tiên
  sibling: Fiber | null;   // Node anh em tiếp theo
  alternate: Fiber | null; // Fiber cũ tương ứng với node hiện tại (dùng cho Diff)

  // Trạng thái và hiệu ứng phụ
  memoizedState: any;   // Danh sách liên kết Hook (trạng thái function component)
  stateNode: any;       // Instance (DOM node/instance của class component)
  flags: Flags;         // Đánh dấu các thao tác cần thực hiện (như Placement/Update)
  lanes: Lanes;         // Độ ưu tiên (mô hình làn đường)

  // Tiến độ công việc
  pendingProps: any;    // Props đang chờ xử lý
  memoizedProps: any;   // Props của lần render trước
}
```

### Các thuộc tính quan trọng

#### 1. Thông tin định danh
- **tag**: Xác định loại component (function, class, DOM node)
- **key**: Giúp React nhận diện các node trong danh sách
- **type**: Lưu trữ hàm component hoặc tên thẻ HTML

#### 2. Quan hệ cây (Tree Structure)
- **return**: Trỏ đến node cha
- **child**: Trỏ đến con đầu tiên
- **sibling**: Trỏ đến anh em kế tiếp
- **alternate**: Liên kết với Fiber cũ để so sánh (Diff algorithm)

#### 3. Trạng thái và hiệu ứng
- **memoizedState**: Lưu trữ state và Hook chain
- **stateNode**: Tham chiếu đến DOM node thực tế hoặc instance
- **flags**: Đánh dấu các thao tác cần thực hiện (thêm, cập nhật, xóa)
- **lanes**: Quản lý độ ưu tiên của task

## 2. Cơ Chế Điều Phối (Scheduling) của React

### Mô hình làn đường (Lane Model)
React 18 giới thiệu **mô hình làn đường** để quản lý độ ưu tiên của các task.

#### Phân chia độ ưu tiên

```javascript
// Các mức độ ưu tiên
export const SyncLane = 0b0001;              // Task đồng bộ (như sự kiện click)
export const InputContinuousLane = 0b0010;   // Input liên tục (như cuộn trang)
export const DefaultLane = 0b0100;           // Cập nhật thông thường
```

**Giải thích:**
- **SyncLane**: Độ ưu tiên cao nhất, xử lý ngay lập tức (ví dụ: click chuột)
- **InputContinuousLane**: Độ ưu tiên cao cho các tương tác liên tục (scroll, drag)
- **DefaultLane**: Độ ưu tiên mặc định cho các cập nhật thông thường

### Cơ chế ưu tiên (Priority Preemption)

Task có độ ưu tiên cao có thể **gián đoạn** task có độ ưu tiên thấp:

```javascript
function ensureRootIsScheduled(root) {
  // Lấy task có độ ưu tiên cao nhất
  const nextLanes = getNextLanes(root);
  if (nextLanes === NoLanes) return;

  // Nếu tồn tại task có độ ưu tiên cao hơn, hủy task hiện tại
  if (existingCallbackPriority !== newCallbackPriority) {
    cancelCallback(existingCallbackNode);
  }
}
```

**Quy trình:**
1. Kiểm tra task có độ ưu tiên cao nhất
2. So sánh với task đang chạy
3. Nếu có task quan trọng hơn → hủy task hiện tại và chạy task mới

## 3. Cơ Chế Render Có Thể Gián Đoạn

### Time Slicing (Chia nhỏ thời gian)

React chia nhỏ công việc render thành nhiều **đơn vị công việc Fiber**, được thực thi trong các khoảng thời gian rảnh rỗi thông qua các API của trình duyệt như `requestIdleCallback` hoặc `MessageChannel`.

#### Sơ đồ quy trình

```
Scheduler → React → Browser
    ↓         ↓         ↓
1. Gửi task cập nhật (scheduleUpdateOnFiber)
2. Yêu cầu callback rảnh rỗi (requestIdleCallback)
3. Thực thi task (performWorkUntilDeadline)
4. Xử lý từng đơn vị Fiber (performUnitOfWork)
5. Kiểm tra thời gian còn lại (shouldYield)
   
   [Có thời gian] → Tiếp tục xử lý Fiber tiếp theo
   [Hết thời gian] → Tạm dừng và lập lịch lại
```

### Công nghệ Double Buffering (Bộ đệm kép)

React duy trì **hai cây Fiber**:

#### 1. Current Tree (Cây hiện tại)
- Cây đang được render (tương ứng với nội dung hiển thị trên màn hình)
- Đại diện cho UI hiện tại mà người dùng đang thấy

#### 2. WorkInProgress Tree (Cây đang xây dựng)
- Cây mới đang được xây dựng (có thể bị gián đoạn để chỉnh sửa)
- Được xây dựng trong nền, không ảnh hưởng đến UI hiện tại

#### Cơ chế hoạt động

**Khi bị gián đoạn:**
- Lưu con trỏ đến node Fiber đang được xử lý (`workInProgress`)
- Giữ nguyên trạng thái công việc

**Khi tiếp tục:**
- Tiếp tục xử lý từ node Fiber bị gián đoạn lần trước
- Không cần bắt đầu lại từ đầu

```javascript
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
  // Nếu bị gián đoạn, workInProgress sẽ giữ lại node hiện tại
}
```

**Giải thích code:**
- Vòng lặp tiếp tục xử lý các Fiber node
- `shouldYield()`: Kiểm tra xem có cần nhường quyền cho trình duyệt không
- Nếu bị gián đoạn, biến `workInProgress` vẫn giữ vị trí hiện tại

## 4. Tổng Kết Các Khái Niệm Quan Trọng

### Fiber Node
- Đơn vị công việc nhỏ nhất trong React
- Chứa thông tin về component, state, props
- Liên kết với nhau tạo thành cây

### Lane Model
- Hệ thống quản lý độ ưu tiên bằng bit mask
- Cho phép nhiều độ ưu tiên tồn tại đồng thời
- Hỗ trợ gián đoạn và tiếp tục công việc

### Time Slicing
- Chia nhỏ công việc render thành các đơn vị nhỏ
- Thực thi trong thời gian rảnh của trình duyệt
- Đảm bảo UI luôn mượt mà, không bị đơ

### Double Buffering
- Hai cây Fiber: Current và WorkInProgress
- Cho phép xây dựng UI mới mà không ảnh hưởng UI cũ
- Hỗ trợ rollback khi có lỗi

## 5. Lợi Ích của Fiber Architecture

### 1. Trải nghiệm người dùng tốt hơn
- UI không bị đơ khi render component phức tạp
- Tương tác người dùng được ưu tiên

### 2. Hiệu suất tốt hơn
- Tận dụng thời gian rảnh của trình duyệt
- Có thể hủy công việc không cần thiết

### 3. Tính linh hoạt cao
- Hỗ trợ Concurrent Mode
- Cho phép Suspense và Error Boundaries hoạt động hiệu quả

### 4. Khả năng mở rộng
- Dễ dàng thêm các tính năng mới
- Hỗ trợ Server Components và Streaming SSR

## 6. Câu Hỏi Ôn Tập

1. **Fiber giải quyết vấn đề gì của React 15?**
   - Giải quyết vấn đề render không thể gián đoạn, gây đơ UI

2. **Sự khác biệt giữa Current Tree và WorkInProgress Tree là gì?**
   - Current: UI đang hiển thị
   - WorkInProgress: UI mới đang xây dựng

3. **Lane Model hoạt động như thế nào?**
   - Sử dụng bit mask để quản lý nhiều mức độ ưu tiên
   - Task ưu tiên cao có thể gián đoạn task ưu tiên thấp

4. **Time Slicing là gì?**
   - Kỹ thuật chia nhỏ công việc render thành các đơn vị nhỏ
   - Thực thi trong thời gian rảnh để không chặn main thread

5. **Tại sao cần thuộc tính `alternate` trong Fiber?**
   - Liên kết giữa Current và WorkInProgress tree
   - Hỗ trợ thuật toán Diff để tối ưu cập nhật

## 7. Tài Liệu Tham Khảo

- React Official Documentation
- React Fiber Architecture (GitHub)
- Inside Fiber: in-depth overview of the new reconciliation algorithm in React

---

**Lưu ý:** Study guide này tổng hợp kiến thức về React Fiber từ React 16 trở lên. Để hiểu sâu hơn, nên thực hành với các ví dụ thực tế và đọc source code của React.
