# Flux Architecture — Deep Dive

> **Study Guide cho Senior Front-End Developer**
> Tài liệu này đi sâu vào Flux Architecture,
> tập trung vào 5 câu hỏi cốt lõi:
>
> 1. Flux ĐỊNH VỊ ở đâu trong hệ sinh thái front-end?
> 2. Flux GIẢI QUYẾT vấn đề gì?
> 3. CẤU TRÚC của Flux hoạt động thế nào?
> 4. ĐẶC ĐIỂM nổi bật của Flux là gì?
> 5. QUY ƯỚC (best practices) khi dùng Flux?

---

## §1. Định Vị — Flux Là Gì?

```
═══════════════════════════════════════════════════════════════
  FLUX = MỘT PATTERN TĂNG CƯỜNG LUỒNG DỮ LIỆU MỘT CHIỀU!
═══════════════════════════════════════════════════════════════


  ĐỊNH NGHĨA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Flux là MỘT PATTERN (mẫu kiến trúc),                │
  │  KHÔNG phải framework hay thư viện!                   │
  │                                                        │
  │  MỤC ĐÍCH:                                            │
  │  → Tăng cường LUỒNG DỮ LIỆU MỘT CHIỀU              │
  │    (Unidirectional Data Flow)                          │
  │                                                        │
  │  PHÁT MINH BỞI:                                       │
  │  → Facebook (nay là Meta)                              │
  │  → Sinh ra cùng thời với React                        │
  │                                                        │
  │  MỐI QUAN HỆ VỚI REACT:                              │
  │  ┌──────────────────────────────────────────┐          │
  │  │  React  → làm UI DỰ ĐOÁN ĐƯỢC!         │          │
  │  │  Flux   → làm DATA DỰ ĐOÁN ĐƯỢC!       │          │
  │  │                                          │          │
  │  │  React + Flux = UI + Data đều            │          │
  │  │                  DỰ ĐOÁN ĐƯỢC!           │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Chức Năng — Flux Giải Quyết Vấn Đề Gì?

```
═══════════════════════════════════════════════════════════════
  FLUX = TÁCH LỚP DỮ LIỆU ĐỂ DỮ LIỆU DỰ ĐOÁN ĐƯỢC!
═══════════════════════════════════════════════════════════════


  VẤN ĐỀ CỦA MVC TRUYỀN THỐNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Trong MVC truyền thống:                              │
  │                                                        │
  │  Model ◀═══════▶ View                                 │
  │    ↕                ↕                                  │
  │  Model ◀═══════▶ View                                 │
  │    ↕                ↕                                  │
  │  Model ◀═══════▶ View                                 │
  │                                                        │
  │  → M và V ẢNH HƯỞNG LẪN NHAU!                       │
  │  → Luồng dữ liệu KHÔNG RÕ RÀNG!                    │
  │  → Cascading updates (cập nhật liên hoàn)!           │
  │  → Khó debug, khó dự đoán trạng thái!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  CÁCH FLUX GIẢI QUYẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  3 NGUYÊN TẮC CỐT LÕI:                               │
  │                                                        │
  │  ① DÙNG DỮ LIỆU TƯỜNG MINH, KHÔNG DỮ LIỆU PHÁ SINH│
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Khai báo dữ liệu TRƯỚC, rồi mới     │          │
  │  │    sử dụng!                               │          │
  │  │  → KHÔNG tạo dữ liệu "ngẫu hứng"        │          │
  │  │    (on the fly)!                           │          │
  │  │  → Mọi dữ liệu đều có NGUỒN GỐC rõ     │          │
  │  │    ràng!                                   │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ② TÁCH DỮ LIỆU VÀ TRẠNG THÁI GIAO DIỆN            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Tách riêng lớp dữ liệu (data layer) │          │
  │  │  → View state ≠ Data state               │          │
  │  │  → Mỗi cái quản lý riêng!               │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ③ TRÁNH CASCADING UPDATES                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → M và V KHÔNG ảnh hưởng lẫn nhau!     │          │
  │  │  → Luồng dữ liệu luôn MỘT CHIỀU!       │          │
  │  │  → Tránh được "hiệu ứng domino"         │          │
  │  │    khi cập nhật!                           │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  HIỆU QUẢ ĐẠT ĐƯỢC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Cải thiện TÍNH NHẤT QUÁN dữ liệu                 │
  │     → Data consistency tăng!                           │
  │                                                        │
  │  ② Dễ dàng XÁC ĐỊNH BUG                              │
  │     → Truy ngược từ view → action → store!            │
  │                                                        │
  │  ③ Hỗ trợ UNIT TESTING                               │
  │     → Mỗi phần có thể test độc lập!                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Cấu Trúc — Kiến Trúc Flux

```
═══════════════════════════════════════════════════════════════
  CẤU TRÚC FLUX = 4 THÀNH PHẦN CHÍNH!
═══════════════════════════════════════════════════════════════


  LUỒNG DỮ LIỆU:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │            tạo action       truyền action              │
  │  View ──────────────→ Dispatcher ──────────→ Stores   │
  │   ▲                                           │        │
  │   │              cập nhật state                │        │
  │   └────────────────────────────────────────────┘        │
  │                                                        │
  │  → LUỒNG MỘT CHIỀU!                                  │
  │  → View KHÔNG BAO GIỜ cập nhật Store trực tiếp!      │
  │  → Mọi thứ đều đi qua Dispatcher!                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  QUY TẮC QUAN TRỌNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Dispatcher: CHỈ CÓ MỘT instance duy nhất (global)!  │
  │  Store:      CÓ THỂ có NHIỀU instances!               │
  │                                                        │
  │  Dispatcher CHỈ chịu trách nhiệm:                    │
  │  → Phân phối / truyền tải action                      │
  │  → KHÔNG xử lý logic nghiệp vụ!                      │
  │                                                        │
  │  Store KHÔNG phải đơn giản là tập hợp states:         │
  │  → Store = States + Update Logic!                      │
  │  → Mapping action → thay đổi state cụ thể            │
  │    được duy trì BÊN TRONG store!                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §3.1. Dispatcher — Bộ Điều Phối Trung Tâm

```
  DISPATCHER = TRUNG TÂM (HUB) CỦA MỌI LUỒNG DỮ LIỆU!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CHỨC NĂNG:                                            │
  │  → Duy trì một REGISTRY các callbacks                 │
  │  → Thiết lập kết nối với các stores                   │
  │  → CHỈ chịu trách nhiệm chuyển action đến stores     │
  │                                                        │
  │  CÁCH HOẠT ĐỘNG:                                      │
  │  ┌──────────────────────────────────────────┐          │
  │  │  (1) Mỗi store ĐĂNG KÝ với dispatcher   │          │
  │  │      → cung cấp một callback             │          │
  │  │                                          │          │
  │  │  (2) Dispatcher NHẬN action              │          │
  │  │                                          │          │
  │  │  (3) Dispatcher GỌI TẤT CẢ callbacks    │          │
  │  │      đã đăng ký                          │          │
  │  │                                          │          │
  │  │  (4) Mỗi store NHẬN action + dữ liệu   │          │
  │  │      qua callback của mình               │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  QUẢN LÝ PHỤ THUỘC (khi app lớn):                    │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Khi app lớn hơn, dispatcher phải quản   │          │
  │  │  lý THỨ TỰ gọi callbacks giữa các       │          │
  │  │  stores!                                  │          │
  │  │                                          │          │
  │  │  → Store A có thể KHAI BÁO TƯỜNG MINH   │          │
  │  │    rằng nó cần ĐỢI Store B cập nhật     │          │
  │  │    xong trước khi tự cập nhật!           │          │
  │  │                                          │          │
  │  │  VD: waitFor([StoreB.dispatchToken])     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §3.2. Stores — Kho Chứa Trạng Thái

```
  STORES = CHỨA STATE + LOGIC CỦA ỨNG DỤNG!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  STORE KHÁC GÌ VỚI MODEL TRONG MVC?                  │
  │  ┌──────────────────────────────────────────┐          │
  │  │  MVC Model (ORM):                        │          │
  │  │  → Đại diện cho MỘT bản ghi dữ liệu    │          │
  │  │  → VD: User model = 1 user record        │          │
  │  │                                          │          │
  │  │  Backbone Collection:                     │          │
  │  │  → Quản lý nhóm ORM-style objects        │          │
  │  │                                          │          │
  │  │  Flux Store:                              │          │
  │  │  → Quản lý MỘT "MIỀN" chức năng!        │          │
  │  │  → Không chia theo model/kiểu dữ liệu!  │          │
  │  │  → Chia theo CHỨC NĂNG NGHIỆP VỤ!       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  VÍ DỤ:                                               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ImageStore  → quản lý state của ẢNH     │          │
  │  │  TodoStore   → quản lý state của TO-DO   │          │
  │  │  MessageStore → quản lý state TIN NHẮN   │          │
  │  │                                          │          │
  │  │  Mỗi store = TẬP HỢP models về dữ liệu │          │
  │  │            + MỘT chức năng về logic!     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  CƠ CHẾ HOẠT ĐỘNG:                                   │
  │  ┌──────────────────────────────────────────┐          │
  │  │  (1) Store đăng ký callback với          │          │
  │  │      dispatcher                           │          │
  │  │                                          │          │
  │  │  (2) Callback nhận action làm tham số    │          │
  │  │                                          │          │
  │  │  (3) Bên trong có switch(action.type)    │          │
  │  │      → dispatch đến phương thức cập nhật │          │
  │  │         state tương ứng                   │          │
  │  │                                          │          │
  │  │  (4) Cập nhật xong → BROADCAST event     │          │
  │  │      thông báo state đã thay đổi         │          │
  │  │                                          │          │
  │  │  (5) View lắng nghe event → lấy state    │          │
  │  │      mới → tự cập nhật!                  │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §3.3. Views & Controller-Views

```
  VIEWS = CÁC THÀNH PHẦN GIAO DIỆN LẮNG NGHE STORE!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CONTROLLER-VIEW = VIEW ĐẶC BIỆT!                    │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Lắng nghe broadcast events từ store   │          │
  │  │  → Chứa logic FETCH DỮ LIỆU từ store    │          │
  │  │  → TRUYỀN DỮ LIỆU xuống views con       │          │
  │  │  → Mỗi controller-view tương ứng với     │          │
  │  │    một KHỐI NỘI DUNG logic trên trang    │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  KHI NHẬN SỰ KIỆN TỪ STORE:                          │
  │  ┌──────────────────────────────────────────┐          │
  │  │  (1) Controller-view gọi store.getter()  │          │
  │  │      → lấy dữ liệu mới                  │          │
  │  │                                          │          │
  │  │  (2) Gọi setState() hoặc forceUpdate()   │          │
  │  │                                          │          │
  │  │  (3) Kích hoạt render() của chính nó     │          │
  │  │                                          │          │
  │  │  (4) Kích hoạt render() của các views    │          │
  │  │      con theo chuỗi                       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  TRUYỀN STATE XUỐNG DƯỚi:                             │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Truyền KHỐI LỚN state xuống theo     │          │
  │  │    cây phân cấp                           │          │
  │  │  → Mỗi cấp chỉ lấy PHẦN CẦN THIẾT!    │          │
  │  │  → Giảm lượng state cần quản lý!        │          │
  │  │  → Giữ views con CÀng THUẦN TÚY        │          │
  │  │    càng tốt (pure components)!            │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §3.4. Actions — Các Hành Động

```
  ACTIONS = MÔ TẢ HÀNH VI NGƯỜI DÙNG!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÁCH TẠO VÀ ĐĂNG KÝ ACTION:                         │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Thường được ĐÓNG GÓI bằng công cụ    │          │
  │  │    (action creators)                      │          │
  │  │  → Bên trong duy trì kết nối giữa       │          │
  │  │    store và action (qua action.type)     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  NGUỒN GỐC CỦA ACTION:                               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ① Từ tương tác người dùng (user events) │          │
  │  │     → click, submit, drag...              │          │
  │  │                                          │          │
  │  │  ② Từ server (server-side)               │          │
  │  │     → Khởi tạo dữ liệu ban đầu         │          │
  │  │     → Server trả về mã lỗi              │          │
  │  │     → Server cập nhật dữ liệu           │          │
  │  │     → Kích hoạt action để đồng bộ view  │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §3.5. Business Logic — Logic Nghiệp Vụ Ở Đâu?

```
  PHÂN BỔ LOGIC NGHIỆP VỤ TRONG FLUX:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────────────────────────────────┐          │
  │  │  PHẦN LỚN logic nghiệp vụ:              │          │
  │  │  → Nằm trong STORE!                      │          │
  │  │                                          │          │
  │  │  PHẦN NHỎ (tương tác + async):           │          │
  │  │  → Nằm trong VIEW components!            │          │
  │  │  → VD: React components xử lý           │          │
  │  │    sự kiện click, fetch API...            │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  VẤN ĐỀ CASCADING UPDATES:                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  VÍ DỤ thực tế:                          │          │
  │  │  User đánh dấu tin nhắn "đã đọc":       │          │
  │  │                                          │          │
  │  │  ❌ CÁCH CŨ (MVC):                       │          │
  │  │  click → đánh dấu đã đọc                │          │
  │  │       → cập nhật style tin nhắn          │          │
  │  │       → giảm số unread                   │          │
  │  │       → mỗi bước kích hoạt bước tiếp!   │          │
  │  │  → CASCADING! Khó theo dõi!             │          │
  │  │                                          │          │
  │  │  ✅ CÁCH FLUX:                            │          │
  │  │  click → dispatch MỘT action:            │          │
  │  │          MARK_THREAD_READ                 │          │
  │  │       → action này "làm phẳng" tất cả   │          │
  │  │         các cập nhật liên hoàn!           │          │
  │  │       → Giữ quan hệ cascading ở TOP     │          │
  │  │         LEVEL, gắn trực tiếp với         │          │
  │  │         thao tác tương tác!              │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  ĐẢO NGƯỢC ĐIỀU KHIỂN (Inversion of Control):        │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Store KHÔNG cho phép bên ngoài       │          │
  │  │    setXXX() vào state bên trong!         │          │
  │  │  → Cách DUY NHẤT để cập nhật:            │          │
  │  │    Qua callbacks đăng ký với dispatcher! │          │
  │  │  → Store nhận data từ action → tự cập   │          │
  │  │    nhật state nội bộ!                     │          │
  │  │  → Tách biệt mối quan tâm rõ ràng!      │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Đặc Điểm — Những Tính Chất Nổi Bật

```
═══════════════════════════════════════════════════════════════
  ĐẶC ĐIỂM FLUX = 4 TÍNH CHẤT QUAN TRỌNG!
═══════════════════════════════════════════════════════════════


  ① BẮT BUỘC ĐỒNG BỘ (Forced Synchronization):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Phân phối action + cập nhật state trong store      │
  │    đều là ĐỒNG BỘ!                                    │
  │  → Thao tác bất đồng bộ (async) → khi hoàn thành    │
  │    mới kích hoạt action THỦ CÔNG!                     │
  │  → Cơ chế KHÔNG quản lý async!                       │
  │                                                        │
  │  TẠI SAO?                                              │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Luồng thông tin cực kỳ RÕ RÀNG!      │          │
  │  │  → Truy ngược bug:                       │          │
  │  │    view → action → store → state          │          │
  │  │  → Tất cả các giai đoạn đều ĐỒNG BỘ    │          │
  │  │    → DỰ ĐOÁN ĐƯỢC!                       │          │
  │  │  → Loại bỏ vấn đề timing bất ngờ!       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ② ĐẢO NGƯỢC ĐIỀU KHIỂN (Inversion of Control):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Store tự cập nhật state BÊN TRONG!                 │
  │  → KHÔNG có setter từ bên ngoài!                      │
  │  → Các phần khác KHÔNG CẦN BIẾT cấu trúc state!     │
  │  → Thay đổi state CHỈ ẢNH HƯỞNG store đó!           │
  │                                                        │
  │  LỢI ÍCH CHO UNIT TESTING:                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Store chỉ nhận action                 │          │
  │  │  → Test = cung cấp initial state          │          │
  │  │         → truyền vào action               │          │
  │  │         → kiểm tra final state!           │          │
  │  │  → CỰC KỲ ĐƠN GIẢN!                     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ③ ACTIONS CÓ NGỮ NGHĨA (Semantic Actions):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Action KHÔNG CHỈ ĐỊNH cách cập nhật state!         │
  │  → Action MÔ TẢ KẾT QUẢ MONG MUỐN!                  │
  │                                                        │
  │  VÍ DỤ:                                               │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ✅ MARK_THREAD_READ                      │          │
  │  │     → "Đánh dấu thread đã đọc"          │          │
  │  │     → CÓ ngữ nghĩa!                      │          │
  │  │     → Ổn định (hiếm khi cần sửa)!       │          │
  │  │                                          │          │
  │  │  ❌ SET_THREAD_READ_FLAG_TRUE             │          │
  │  │     → Chỉ định cách cập nhật             │          │
  │  │     → KHÔNG có ngữ nghĩa!                │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  → Thông tin ngữ nghĩa giúp THEO DÕI                 │
  │    thay đổi state qua debugging tools!                │
  │  → VD: Redux DevTools!                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ④ KHÔNG CÓ CASCADING ACTION:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Một action KHÔNG THỂ kích hoạt action khác!        │
  │  → Tránh độ phức tạp debug từ cascading updates!      │
  │  → Action là "NGUYÊN TỬ" (atomic)!                    │
  │  → KHÔNG có quan hệ phân cấp phức tạp!               │
  │                                                        │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ❌ SAI:                                  │          │
  │  │  ACTION_A → kích hoạt → ACTION_B         │          │
  │  │           → kích hoạt → ACTION_C         │          │
  │  │  → Cascading! Khó debug!                  │          │
  │  │                                          │          │
  │  │  ✅ ĐÚNG:                                 │          │
  │  │  ACTION_A → cập nhật state A, B, C       │          │
  │  │  → Một action, nhiều cập nhật!            │          │
  │  │  → Flat! Dễ theo dõi!                    │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Quy Ước — Best Practices Của Flux

```
═══════════════════════════════════════════════════════════════
  QUY ƯỚC = "HỢP ĐỒNG ĐẠO ĐỨC" CỦA FLUX!
═══════════════════════════════════════════════════════════════


  A. QUY ƯỚC VỀ STORE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Cache dữ liệu                                     │
  │                                                        │
  │  ② Chỉ expose GETTER để truy cập dữ liệu,           │
  │     KHÔNG cung cấp setter!                             │
  │                                                        │
  │  ③ Chỉ phản hồi action CỤ THỂ từ dispatcher!        │
  │                                                        │
  │  ④ Kích hoạt change event MỖI KHI có dữ liệu        │
  │     thay đổi!                                          │
  │                                                        │
  │  ⑤ Change event CHỈ được kích hoạt TRONG QUÁ TRÌNH  │
  │     dispatch!                                          │
  │                                                        │
  │  ⑥ Duy trì state nội bộ, CHỈ cập nhật state bên     │
  │     trong store!                                       │
  │                                                        │
  │  ⑦ Tập trung vào action CỤ THỂ; khi dữ liệu thay  │
  │     đổi → kích hoạt change event!                     │
  │     KHÔNG kích hoạt ở thời điểm khác trừ khi do      │
  │     dispatcher kích hoạt!                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  B. QUY ƯỚC VỀ ACTION:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Mô tả HÀNH VI người dùng!                          │
  │  → KHÔNG phải setter!                                  │
  │                                                        │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ✅ ĐÚNG: select-page                    │          │
  │  │     → "Người dùng chọn trang"            │          │
  │  │     → Mô tả hành vi!                     │          │
  │  │                                          │          │
  │  │  ❌ SAI:  set-page-id                     │          │
  │  │     → "Đặt ID trang"                     │          │
  │  │     → Đây là setter, không có ngữ nghĩa!│          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  C. QUY ƯỚC VỀ CONTAINER (CONTROLLER-VIEW):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Container = React component dùng để ĐIỀU KHIỂN!      │
  │                                                        │
  │  CHỨC NĂNG CƠ BẢN:                                    │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Thu thập thông tin từ CÁC store       │          │
  │  │  → Lưu trữ vào state CỦA CHÍNH NÓ      │          │
  │  │  → KHÔNG chứa logic UI!                  │          │
  │  │  → KHÔNG chứa props!                     │          │
  │  │                                          │          │
  │  │  Bản chất là controller-view,             │          │
  │  │  khác view thường ở 3 điểm trên!         │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  D. QUY ƯỚC VỀ VIEW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  View = React component được ĐIỀU KHIỂN bởi           │
  │         container!                                     │
  │                                                        │
  │  ĐẶC ĐIỂM:                                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Chứa UI và rendering logic!           │          │
  │  │  → Nhận TẤT CẢ thông tin và callbacks   │          │
  │  │    qua PROPS!                             │          │
  │  │  → Là view bình thường, KHÔNG có gì      │          │
  │  │    đặc biệt!                              │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ================================================
// VÍ DỤ MINH HỌA — FLUX TRONG THỰC TẾ
// ================================================

// --- Action Types ---
const ActionTypes = {
  MARK_THREAD_READ: "MARK_THREAD_READ",
  SELECT_PAGE: "SELECT_PAGE",
  RECEIVE_MESSAGES: "RECEIVE_MESSAGES",
};

// --- Action Creators ---
// Mô tả HÀNH VI, không phải setter!
const MessageActions = {
  markThreadRead(threadId: string) {
    AppDispatcher.dispatch({
      type: ActionTypes.MARK_THREAD_READ,
      threadId,
    });
  },

  selectPage(pageId: string) {
    // ✅ select-page (hành vi)
    // ❌ set-page-id (setter)
    AppDispatcher.dispatch({
      type: ActionTypes.SELECT_PAGE,
      pageId,
    });
  },
};

// --- Store ---
// Chỉ có GETTER, không có SETTER!
class MessageStore extends EventEmitter {
  private threads: Map<string, Thread> = new Map();
  private unreadCount: number = 0;

  constructor() {
    super();
    // Đăng ký callback với dispatcher
    AppDispatcher.register((action: Action) => {
      switch (action.type) {
        case ActionTypes.MARK_THREAD_READ:
          // Store TỰ cập nhật state bên trong!
          // → Đánh dấu đã đọc
          // → Cập nhật style tin nhắn
          // → Giảm số unread
          // TẤT CẢ trong MỘT action! (không cascading!)
          this._markAsRead(action.threadId);
          this._updateUnreadCount();
          this.emit("change"); // Broadcast event!
          break;
      }
    });
  }

  // Chỉ expose GETTER!
  getThreads() {
    return this.threads;
  }
  getUnreadCount() {
    return this.unreadCount;
  }

  // KHÔNG có setter public!
  private _markAsRead(threadId: string) {
    /* ... */
  }
  private _updateUnreadCount() {
    /* ... */
  }
}

// --- Controller-View (Container) ---
// Thu thập thông tin từ store → truyền xuống view
/*
const MessageContainer: React.FC = () => {
  const [threads, setThreads] = useState(messageStore.getThreads());
  const [unreadCount, setUnreadCount] = useState(messageStore.getUnreadCount());

  useEffect(() => {
    const handleChange = () => {
      setThreads(messageStore.getThreads());
      setUnreadCount(messageStore.getUnreadCount());
    };
    messageStore.on('change', handleChange);
    return () => messageStore.off('change', handleChange);
  }, []);

  // Truyền KHỐI LỚN state xuống views con!
  return (
    <MessageList
      threads={threads}
      unreadCount={unreadCount}
      onMarkRead={MessageActions.markThreadRead}
    />
  );
};
*/

// --- View (Pure Component) ---
// Nhận TẤT CẢ qua props! Không biết store tồn tại!
/*
const MessageList: React.FC<Props> = ({
  threads,
  unreadCount,
  onMarkRead,
}) => {
  return (
    <div>
      <h2>Tin nhắn ({unreadCount} chưa đọc)</h2>
      {threads.map(thread => (
        <MessageItem
          key={thread.id}
          thread={thread}
          onMarkRead={() => onMarkRead(thread.id)}
        />
      ))}
    </div>
  );
};
*/
```

---

## §6. Tổng Kết

```
═══════════════════════════════════════════════════════════════
  TỔNG KẾT = FLUX TRONG MỘT CÁI NHÌN!
═══════════════════════════════════════════════════════════════


  LUỒNG DỮ LIỆU HOÀN CHỈNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  User click "Đánh dấu đã đọc"                        │
  │       │                                                │
  │       ▼                                                │
  │  Action Creator tạo action:                            │
  │  { type: MARK_THREAD_READ, threadId: "123" }          │
  │       │                                                │
  │       ▼                                                │
  │  Dispatcher nhận + phân phối action                    │
  │  → gọi TẤT CẢ callbacks đã đăng ký                  │
  │       │                                                │
  │       ▼                                                │
  │  MessageStore nhận action qua callback                 │
  │  → switch(action.type)                                 │
  │  → _markAsRead() + _updateUnreadCount()                │
  │  → emit('change')                                      │
  │       │                                                │
  │       ▼                                                │
  │  Container (controller-view) lắng nghe 'change'       │
  │  → gọi store.getter() lấy state mới                  │
  │  → setState() → re-render!                             │
  │       │                                                │
  │       ▼                                                │
  │  View nhận props mới → hiển thị UI cập nhật!          │
  │                                                        │
  │  → MỌI THỨ ĐỀU MỘT CHIỀU!                           │
  │  → MỌI THỨ ĐỀU ĐỒNG BỘ!                             │
  │  → MỌI THỨ ĐỀU DỰ ĐOÁN ĐƯỢC!                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

> **KẾT LUẬN:**
> Flux là pattern kiến trúc nền tảng cho hệ sinh thái React, và là tiền thân của Redux:
>
> - **Unidirectional Data Flow** — Luồng dữ liệu luôn MỘT CHIỀU
> - **Dispatcher** — Bộ điều phối trung tâm DUY NHẤT
> - **Stores** — Chứa state + logic, chia theo CHỨC NĂNG nghiệp vụ
> - **Actions** — Mô tả HÀNH VI, có ngữ nghĩa, nguyên tử
> - **Inversion of Control** — Store tự quản lý state, không có setter
>
> Điểm nổi bật SO VỚI MVC:
>
> - **Không cascading** = Mỗi action là nguyên tử, không kích hoạt action khác!
> - **Forced sync** = Mọi cập nhật đồng bộ, dễ debug!
> - **Semantic actions** = Tên action mô tả KẾT QUẢ, không phải CÁC BƯỚC!
