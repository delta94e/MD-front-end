# Interview Final Rounds — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> Business Understanding, Fulfilling Projects, Career Motivation,
> Future Development Plan (Technical & Management),
> Red Envelope Algorithm, Number Formatting,
> Architecture Diagram, HR & Behavioral Questions
> Độ khó: ⭐️⭐️⭐️⭐️ | Senior Frontend Interview (Final Rounds)

---

## Mục Lục

| #   | Phần                                        |
| --- | ------------------------------------------- |
| 1   | Mô tả hệ thống kinh doanh của công ty       |
| 2   | Dự án tâm đắc nhất                          |
| 3   | Tại sao chọn công ty hiện tại?              |
| 4   | Tại sao muốn rời đi?                        |
| 5   | Kế hoạch phát triển tương lai               |
| 6   | Algorithm: Lucky Red Envelope (抢红包)      |
| 7   | Algorithm: Number to String (1,234,567,890) |
| 8   | Vẽ Architecture Diagram — Cách trình bày    |
| 9   | Hiểu Business — Framework trả lời           |
| 10  | Tóm tắt phỏng vấn                           |

---

## §1. Mô tả hệ thống kinh doanh của công ty

```
FRAMEWORK TRẢ LỜI — 3 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① GIỚI THIỆU BUSINESS CỦA CÔNG TY:
  → Công ty làm gì? Lĩnh vực nào?
  → Khách hàng là ai? (B2B / B2C / B2G?)
  → Quy mô: bao nhiêu users, transactions/ngày?

  ② GIỚI THIỆU CÁC HỆ THỐNG (dựa trên business!):
  → Mỗi mảng kinh doanh → có hệ thống tương ứng!
  → Liên kết business flow → technical system!

  ③ CHỨC NĂNG CỦA TỪNG HỆ THỐNG:
  → Chi tiết modules, features!
  → Bạn ĐÃ LÀM gì trong mỗi hệ thống!

  ⚠️ MỤC ĐÍCH: Cho thấy bạn HIỂU BUSINESS,
  không chỉ code mà CÒN hiểu TẠI SAO code!
```

```
VÍ DỤ — CÔNG TY FINTECH:
═══════════════════════════════════════════════════════════════

  ① BUSINESS:
  → Công ty cung cấp dịch vụ tài chính trực tuyến
  → B2C: cho vay cá nhân, thanh toán, đầu tư
  → 500K users, 10K transactions/ngày

  ② CÁC HỆ THỐNG:
  ┌────────────────────────────────────────────────────────┐
  │ BUSINESS FLOW           →  HỆ THỐNG                   │
  ├────────────────────────────────────────────────────────┤
  │ Khách hàng đăng ký      →  User Management System     │
  │ Xét duyệt vay           →  Loan Application System    │
  │ Thanh toán               →  Payment Gateway            │
  │ Quản lý rủi ro           →  Risk Management System     │
  │ Theo dõi nợ              →  Collection System          │
  │ Báo cáo nội bộ           →  Admin Dashboard            │
  │ Giám sát kỹ thuật        →  Monitoring & Alert System  │
  └────────────────────────────────────────────────────────┘

  ③ CHI TIẾT — Monitoring & Alert System:
  → Log tracking: WebSocket service!
  → Business metrics: tỷ lệ vay / thanh toán thành công!
  → Trend charts + thresholds + alarm (Slack/Email)!
  → Tôi là người XÂY DỰNG hệ thống này từ đầu!
```

```
VÍ DỤ — CÔNG TY E-COMMERCE:
═══════════════════════════════════════════════════════════════

  ① BUSINESS:
  → Sàn thương mại điện tử
  → B2C + marketplace (cho phép seller bán hàng)
  → 2M users, 50K orders/ngày

  ② CÁC HỆ THỐNG:
  ┌────────────────────────────────────────────────────────┐
  │ Tìm kiếm sản phẩm       →  Search & Recommendation    │
  │ Giỏ hàng + thanh toán   →  Order & Payment System     │
  │ Quản lý kho              →  Inventory Management       │
  │ Vận chuyển               →  Logistics Tracking         │
  │ Seller quản lý cửa hàng  →  Merchant Platform          │
  │ Marketing                →  Promotion & Coupon System  │
  │ Customer support         →  Ticket & Chat System       │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Dự án tâm đắc nhất

```
FRAMEWORK TRẢ LỜI — MONITORING & ALERTING:
═══════════════════════════════════════════════════════════════

  TẠI SAO TÂM ĐẮC?
  → Chi phí THẤP, hiệu quả CAO! (Low-cost, High-return!)
  → Dùng kỹ thuật để DERIVE business metrics!
  → Monitoring data → SUY RA xu hướng kinh doanh!

  CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │ ① TECHNICAL IMPLEMENTATION:                            │
  │ → WebSocket log service (code + business logs!)        │
  │ → Error monitoring (4 loại error listeners!)           │
  │ → Data pipeline → Data Warehouse → Query API!          │
  │                                                        │
  │ ② BUSINESS METRICS DERIVATION:                         │
  │ → Tracking data các giai đoạn business flow!           │
  │ → VD: tỷ lệ đặt hàng = payment_ok / checkout_click!  │
  │ → Suy ra: conversion rate, abandonment rate!           │
  │                                                        │
  │ ③ BUSINESS INSIGHT:                                    │
  │ → Trend charts → nhìn ra xu hướng kinh doanh!         │
  │ → VD: conversion giảm → có vấn đề checkout!           │
  │ → Alarm → team phản ứng NHANH!                         │
  │                                                        │
  │ ④ IMPACT:                                             │
  │ → Phát hiện bug sớm hơn 2 giờ so với trước!           │
  │ → Giảm 40% incidents ảnh hưởng user!                  │
  │ → Business team dùng data để ra quyết định!            │
  └────────────────────────────────────────────────────────┘

  ⚠️ KEY POINT:
  → Độ phức tạp kỹ thuật KHÔNG CAO!
  → Nhưng GIÁ TRỊ business CỰC LỚN!
  → → Đây là điều interviewer muốn nghe!
```

---

## §3. Tại sao chọn công ty hiện tại?

```
3 GÓC NHÌN:
═══════════════════════════════════════════════════════════════

  ① KHÁM PHÁ NGÀNH MỚI:
  → Đã làm internet, muốn thử FINANCE (tài chính)!
  → Mở rộng kiến thức business domain!
  → Finance = hệ thống phức tạp, dữ liệu nhạy cảm
    → thú vị về mặt kỹ thuật!

  ② PHÁT HUY TỐI ĐA BẢN THÂN:
  → Công ty lớn: chỉ là "ốc vít" trong máy lớn!
  → Làm 1 module nhỏ, không thấy toàn cảnh!
  → Công ty nhỏ hơn: đảm nhiệm NHIỀU vai trò!
  → → Full-stack experience: coding + architecture +
      monitoring + team leading!
  → → Trở thành người TOÀN DIỆN hơn!

  ③ TINH THẦN KHỞI NGHIỆP:
  → Startup team → trải nghiệm entrepreneurship!
  → Tốc độ nhanh, impact lớn!
  → Build from scratch → hiểu SÂU hệ thống!

  ⚠️ TIPS:
  → Thể hiện BẠN chủ động chọn, có lý do RÕ RÀNG!
  → Không phải "không có lựa chọn khác"!
  → Liên kết với giá trị CÁ NHÂN của bạn!
```

---

## §4. Tại sao muốn rời đi?

```
2 LÝ DO CHÍNH:
═══════════════════════════════════════════════════════════════

  ① TRIỂN VỌNG TEAM KHÔNG TỐT:
  → Sếp mới lên → thay đổi hướng team!
  → Từ team SÁNG TẠO, KHÁM PHÁ → team HỖ TRỢ IT!
  → Không phù hợp với kỳ vọng ban đầu!
  → → "Tôi muốn giải quyết bài toán KHÓ,
       không phải chỉ support!"

  ② PHÁT TRIỂN CÁ NHÂN BỊ GIỚI HẠN:
  → Technical: product ÍT users, LOW complexity
    → output nhiều nhưng KHÔNG được thử thách!
  → Management: team size ỔN ĐỊNH
    → ít cơ hội mentor thêm!
  → → "Tôi muốn môi trường có CHALLENGES lớn hơn!"

  ⚠️ RULES KHI TRẢ LỜI:
  → KHÔNG nói xấu sếp cũ / đồng nghiệp!
  → KHÔNG nói vì lương thấp (dù đó là sự thật!)
  → Tập trung vào: GROWTH OPPORTUNITY!
  → Framework: "Tôi ĐÃ HỌC được X, Y. Bây giờ tôi muốn Z."
  → Cho thấy bạn rời đi vì PHÁT TRIỂN, không phải CHẠY TRỐN!
```

---

## §5. Kế hoạch phát triển tương lai

```
2 HƯỚNG PHÁT TRIỂN:
═══════════════════════════════════════════════════════════════

  ① HƯỚNG KỸ THUẬT (Technical Route):
  ┌────────────────────────────────────────────────────────┐
  │ Level 1: NÂNG CAO kỹ năng hiện có                     │
  │ → Frontend architecture, anomaly monitoring,          │
  │   performance optimization, metric systems!            │
  │ → Dùng kỹ thuật → ĐEM LẠI GIÁ TRỊ cho team & biz!   │
  │                                                        │
  │ Level 2: CHUYÊN SÂU một lĩnh vực                      │
  │ → Thành thạo → phát triển METHODOLOGY riêng!          │
  │ → Xây dựng PLATFORM có hệ thống!                      │
  │ → Được áp dụng RỘNG RÃI trong phòng ban / công ty!    │
  │                                                        │
  │ Level 3: MỞ RỘNG liên tục                             │
  │ → Theo dõi công nghệ MỚI!                             │
  │ → Iterate tech stack của team!                         │
  │ → Giữ NĂNG LỰC CẠNH TRANH về kỹ thuật!              │
  └────────────────────────────────────────────────────────┘

  ② HƯỚNG QUẢN LÝ (Management Route):
  ┌────────────────────────────────────────────────────────┐
  │ Step 1: ĐẶT MỤC TIÊU (3 phần!):                      │
  │ → Business support: hoàn thành deliverables!           │
  │ → Technical growth: nâng level kỹ thuật team!          │
  │ → Team development: phát triển con người!              │
  │                                                        │
  │ Step 2: THỰC THI & REVIEW:                             │
  │ → Streamline processes → chuẩn hóa + gọn hơn!         │
  │ → Identify HIGH-POTENTIAL members!                     │
  │ → Tạo CƠ HỘI cho họ phát triển nhanh!                │
  │                                                        │
  │ Step 3: ĐẠT KẾT QUẢ:                                  │
  │ → Kết quả phải ĐO LƯỜNG ĐƯỢC!                         │
  │ → Dữ liệu CỤ THỂ, ĐỊNH LƯỢNG!                        │
  │ → VD: giảm 50% bug, tăng 30% delivery speed!          │
  └────────────────────────────────────────────────────────┘

  ⚠️ TIPS:
  → Nói CẢ HAI hướng → cho thấy bạn có tầm nhìn!
  → Nhấn mạnh: kỹ thuật PHẢI phục vụ business!
  → Management = KHÔNG CHỈ quản người, mà CÒN quản process!
```

---

## §6. Algorithm: Lucky Red Envelope (抢红包)

```
BÀI TOÁN — RED ENVELOPE:
═══════════════════════════════════════════════════════════════

  Chia tiền vào N hồng bao ngẫu nhiên!
  Mỗi lần gọi openRedPackage() → "bốc" 1 hồng bao!
  → In ra số tiền nhận được!
  → Đảm bảo: mỗi người ÍT NHẤT 0.01 đồng!

  VÍ DỤ: 10đ chia cho 5 người:
  → Người 1: 3.21
  → Người 2: 0.55
  → Người 3: 4.12
  → Người 4: 1.67
  → Người 5: 0.45
  → Tổng = 10.00 ✅

  THUẬT TOÁN — RANDOM RATIO:
  → ratio = Math.random() × (remaining / total)
  → Lấy ratio × total = số tiền!
  → Đảm bảo remaining >= count × 0.01 (mỗi người 1 xu!)
  → Người cuối: nhận TOÀN BỘ còn lại!
```

```javascript
// ═══ RED ENVELOPE — IMPLEMENTATION ═══

class RedPackage {
  money = 0; // Tổng tiền gốc!
  count = 0; // Số hồng bao còn lại!
  _remain = 0; // Tiền còn lại!

  constructor(money, count) {
    this.money = money;
    this.count = count;
    this._remain = money;
  }

  openRedPackage() {
    // Đã hết hồng bao:
    if (this.count <= 0) {
      console.log("Hồng bao đã được bốc hết rồi~");
      return;
    }

    // Chỉ còn 1 hồng bao → lấy toàn bộ số dư:
    if (this.count === 1) {
      this.count--;
      console.log(this._remain);
      return;
    }

    // Random ratio (0 → remaining/total):
    const ratio = Math.random() * (this._remain / this.money);

    // Tính số tiền:
    // ⚠️ JS floating-point: dùng toFixed(2) để làm tròn!
    // Production: nên dùng thư viện (decimal.js, big.js)!
    let youGet = +(this.money * ratio).toFixed(2);

    // Tính tiền còn lại SAU KHI phát:
    const tempRemain = +(this._remain - youGet).toFixed(2);

    // Đảm bảo mỗi người còn lại ÍT NHẤT 0.01đ:
    const allLeast = +(this.count * 0.01).toFixed(2);

    if (tempRemain < allLeast) {
      // Không đủ! Giảm số tiền lần này:
      youGet = +(this._remain - allLeast).toFixed(2);
      this._remain = allLeast;
    } else {
      this._remain = tempRemain;
    }

    console.log(youGet);
    this.count--;
  }
}

// TEST:
const rp = new RedPackage(10, 5);
rp.openRedPackage(); // VD: 2.34
rp.openRedPackage(); // VD: 0.89
rp.openRedPackage(); // VD: 4.12
rp.openRedPackage(); // VD: 1.73
rp.openRedPackage(); // VD: 0.92 (tổng = 10!)
rp.openRedPackage(); // "Hồng bao đã được bốc hết rồi~"
```

```
PHÂN TÍCH DEEP DIVE:
═══════════════════════════════════════════════════════════════

  ① TẠI SAO ratio = random × (remain / total)?
  → Giới hạn upper bound!
  → Nếu remain = 8, total = 10 → ratio max = 0.8
  → Không ai lấy QUÁ NHIỀU → phân bổ fair hơn!

  ② VẤN ĐỀ FLOATING-POINT:
  → 0.1 + 0.2 = 0.30000000000000004 trong JS!
  → toFixed(2) → string → cần ép lại number bằng +!
  → Production: dùng decimal.js, big.js, hoặc tính bằng CEN

  ③ EDGE CASES:
  → Người cuối: lấy TOÀN BỘ remaining!
  → Remaining < count × 0.01: giảm youGet!
  → count <= 0: đã hết!

  ④ SO SÁNH VỚI "DOUBLE AVERAGE" (二倍均值法):
  → WeChat dùng: max = (remain / count) × 2
  → Mỗi người: random(0.01, max)
  → Phân bố ĐỀU hơn! (expectation = remain / count)
```

```javascript
// ═══ THUẬT TOÁN WECHAT — DOUBLE AVERAGE (二倍均值法) ═══

class WeChatRedPackage {
  constructor(money, count) {
    this.remain = money;
    this.count = count;
  }

  open() {
    if (this.count <= 0) {
      console.log("Hết rồi!");
      return;
    }

    if (this.count === 1) {
      const last = +this.remain.toFixed(2);
      this.count--;
      console.log(last);
      return;
    }

    // WeChat formula: random(0.01, 2 × average)
    const max = +((this.remain / this.count) * 2).toFixed(2);
    const min = 0.01;

    let amount = +(Math.random() * (max - min) + min).toFixed(2);

    // Đảm bảo còn đủ cho người sau:
    const restMin = +((this.count - 1) * 0.01).toFixed(2);
    if (this.remain - amount < restMin) {
      amount = +(this.remain - restMin).toFixed(2);
    }

    this.remain = +(this.remain - amount).toFixed(2);
    this.count--;
    console.log(amount);
  }
}

// WeChat ĐỀU hơn vì:
// E(amount) = remain / count (expectation = trung bình!)
// Max = 2 × average → không ai lấy QUÁ NHIỀU!
```

---

## §7. Algorithm: Number to String (1,234,567,890)

```
BÀI TOÁN:
═══════════════════════════════════════════════════════════════

  INPUT:  1234567890
  OUTPUT: "1,234,567,890"

  → Thêm dấu phẩy mỗi 3 chữ số từ PHẢI sang TRÁI!
```

```javascript
// ═══ CÁCH 1: toLocaleString() — ĐƠN GIẢN NHẤT ═══

function toString1(num) {
  return num.toLocaleString();
}
// 1234567890 → "1,234,567,890" ✅
// ⚠️ Interviewer có thể hỏi: "ngoài cách này?"

// ═══ CÁCH 2: REVERSE + LOOP — CLASSIC ═══

function toString2(num) {
  const result = [];
  const str = `${num}`.split("").reverse();

  for (let i = 0; i < str.length; i++) {
    // Mỗi 3 chữ số → thêm dấu phẩy!
    if (i > 0 && i % 3 === 0) {
      result.push(",");
    }
    result.push(str[i]);
  }

  return result.reverse().join("");
}
// TRACE: 1234567890
// Reverse: ['0','9','8','7','6','5','4','3','2','1']
// i=0: push '0'                     → ['0']
// i=1: push '9'                     → ['0','9']
// i=2: push '8'                     → ['0','9','8']
// i=3: push ',', push '7'           → ['0','9','8',',','7']
// i=6: push ',', push '4'           → [...,',','4']
// i=9: push ',', push '1'           → [...,',','1']
// Reverse join: "1,234,567,890" ✅

// ═══ CÁCH 3: REGEX — NGẮN GỌN ═══

function toString3(num) {
  return `${num}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// GIẢI THÍCH REGEX:
// \B        → KHÔNG phải đầu string!
// (?=...)   → Lookahead: theo sau bởi...
// (\d{3})+  → 1 hoặc nhiều nhóm 3 chữ số!
// (?!\d)    → KHÔNG theo sau bởi chữ số nữa (kết thúc!)
// → Tìm vị trí phù hợp → chèn dấu phẩy!

// ═══ CÁCH 4: INTL API (Modern!) ═══

function toString4(num) {
  return new Intl.NumberFormat("en-US").format(num);
}
```

```javascript
// ═══ XỬ LÝ EDGE CASES ═══

function formatNumber(num) {
  const [intPart, decPart] = `${num}`.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${formatted}.${decPart}` : formatted;
}

// Test:
formatNumber(1234567890); // "1,234,567,890"
formatNumber(1234.5678); // "1,234.5678"
formatNumber(-1234567); // "-1,234,567"
formatNumber(100); // "100" (không thêm comma!)
formatNumber(0); // "0"
```

---

## §8. Vẽ Architecture Diagram — Cách trình bày

```
FRONTEND ARCHITECTURE DIAGRAM — FRAMEWORK:
═══════════════════════════════════════════════════════════════

  Khi được yêu cầu VẼ architecture diagram:
  → Chia thành CÁC LAYERS rõ ràng!
  → Giải thích TỪNG layer!

  ┌──────────────────────────────────────────────────────────┐
  │                    USER INTERFACE                        │
  │  Pages / Views / Layouts                                │
  ├──────────────────────────────────────────────────────────┤
  │                   COMPONENT LAYER                        │
  │  Business Components / Shared Components / UI Library   │
  ├──────────────────────────────────────────────────────────┤
  │                    STATE LAYER                           │
  │  State Management (Redux/Zustand/Jotai)                 │
  │  Local State / Server Cache (React Query)               │
  ├──────────────────────────────────────────────────────────┤
  │                   SERVICE LAYER                          │
  │  API Client / WebSocket / Auth / Error Handling         │
  ├──────────────────────────────────────────────────────────┤
  │                 INFRASTRUCTURE LAYER                     │
  │  Build (Vite) / CI-CD / Monitoring / Testing            │
  ├──────────────────────────────────────────────────────────┤
  │                    EXTERNAL                              │
  │  Backend APIs / CDN / Third-party Services             │
  └──────────────────────────────────────────────────────────┘

  TRÌNH BÀY:
  → Từ TRÊN xuống DƯỚI!
  → Mỗi layer: giải thích CHỌN tool gì, TẠI SAO!
  → Highlight: điểm KHÁC BIỆT / SÁNG TẠO!
  → Kết nối: layer này giao tiếp layer kia THẾ NÀO!
```

```
TIPS KHI VẼ TRÊN WHITEBOARD:
═══════════════════════════════════════════════════════════════

  ① VẼ BOXES rõ ràng, có LABEL!
  ② VẼ ARROWS chỉ data flow!
  ③ NHẤN MẠNH phần bạn personally built!
  ④ GIẢI THÍCH trade-offs, tại sao chọn X không chọn Y!
  ⑤ CHUẨN BỊ SẴN: vẽ trước ở ProcessOn/Draw.io!
  ⑥ Nói về SCALE: hệ thống handle bao nhiêu users?

  ĐỪNG:
  ❌ Vẽ quá đơn giản (chỉ 2-3 boxes)!
  ❌ Vẽ quá phức tạp (không giải thích được!)!
  ❌ Chỉ nói tên tools mà không nói TẠI SAO!
```

---

## §9. Hiểu Business — Framework trả lời

```
"LÀM SAO HIỂU BUSINESS?" — 3 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① CÔNG TY LÀM GÌ:
  → Lĩnh vực, sản phẩm, khách hàng!
  → VD: "Công ty cung cấp nền tảng giao dịch tài chính
         cho các doanh nghiệp vừa và nhỏ"

  ② CÁC HỆ THỐNG TƯƠNG ỨNG:
  → Mỗi mảng business → 1 hệ thống!
  → VD: "Hệ thống quản lý đơn hàng, hệ thống thanh toán,
         hệ thống giám sát, admin dashboard"

  ③ CHỨC NĂNG TỪNG HỆ THỐNG:
  → Modules, features, tech choices!
  → VD: "Hệ thống giám sát: log tracking (WebSocket),
         business metrics, trend charts, alarm thresholds"

  ⚠️ CÁCH NÓI THỂ HIỆN LEVEL:
  → Junior: "Tôi code feature ABC"
  → Mid: "Tôi hiểu module XYZ phục vụ business gì"
  → Senior: "Tôi THIẾT KẾ hệ thống để giải quyết
              pain point Z của business"
  → Lead: "Tôi nhìn TOÀN CẢNH business → xác định
            PRIORITIES kỹ thuật → xây hệ thống PHỤC VỤ"
```

---

## §10. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Mô tả hệ thống kinh doanh?"
  A: 3 bước: Business công ty → Hệ thống tương ứng → Chức năng!
  → Cho thấy bạn HIỂU business, không chỉ code!

  Q: "Dự án tâm đắc nhất?"
  A: Monitoring & Alerting — low cost, high return!
  → Dùng kỹ thuật derive business metrics!
  → Monitoring data → suy ra xu hướng kinh doanh!

  Q: "Tại sao chọn công ty này?"
  A: 3 lý do: khám phá ngành mới (finance), phát huy bản thân
  (startup = nhiều vai trò), tinh thần khởi nghiệp!

  Q: "Tại sao rời đi?"
  A: Team direction thay đổi (explorer→support IT) +
  personal growth bị giới hạn (low complexity, stable team)!

  Q: "Kế hoạch tương lai?"
  A: Technical: nâng skill → methodology → platform → apply rộng!
  Management: set goals → execute+review → measurable results!

  Q: "Red Envelope algorithm?"
  A: Random ratio × total; đảm bảo remaining >= count × 0.01;
  người cuối lấy hết! WeChat dùng Double Average (2×mean)!

  Q: "Number formatting?"
  A: 4 cách: toLocaleString() / reverse+loop / regex \B(?=(\d{3})+) /
  Intl.NumberFormat! Xử lý edge: decimals, negative!

  Q: "Architecture diagram?"
  A: Chia layers: UI → Components → State → Service → Infra!
  Giải thích tool choices + trade-offs + data flow!
```

---

### Checklist

- [ ] **Business description**: 3 bước: business công ty → hệ thống tương ứng → chức năng từng system!
- [ ] **Dự án tâm đắc**: Monitoring — low cost high return, kỹ thuật derive business metrics, trend → insight!
- [ ] **Chọn công ty**: khám phá ngành (finance), phát huy bản thân (startup nhiều vai trò), entrepreneurship!
- [ ] **Rời đi**: team direction thay đổi (innovation→support IT), personal growth giới hạn (low complexity)!
- [ ] **Future plan Technical**: nâng skill → methodology riêng → platform → áp dụng rộng → follow new tech!
- [ ] **Future plan Management**: set goals (biz+tech+people) → execute review (process+high-potential) → measurable results!
- [ ] **Red Envelope**: ratio = random × (remain/total); ensure remain >= count × 0.01; last person gets all remaining!
- [ ] **WeChat Double Average**: max = 2 × (remain/count); E(amount) = remain/count; phân bố đều hơn!
- [ ] **JS Floating-point**: 0.1+0.2 ≠ 0.3; dùng toFixed(2) + ép number; production → decimal.js!
- [ ] **Number format 4 cách**: toLocaleString(), reverse+loop+comma, regex `\B(?=(\d{3})+(?!\d))`, Intl.NumberFormat!
- [ ] **Architecture diagram**: Layers (UI→Component→State→Service→Infra→External); giải thích trade-offs + data flow!
- [ ] **Hiểu business**: Junior=code feature, Mid=hiểu module, Senior=thiết kế system, Lead=toàn cảnh+priorities!

---

_Nguồn: Helianthuswhite — juejin.cn/post/7298218459795734582_
_Cập nhật lần cuối: Tháng 2, 2026_
