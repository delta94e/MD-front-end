# CDN (Content Delivery Network) — Deep Dive

> 📅 2026-02-11 · ⏱ 15 phút đọc
>
> Tài liệu chuyên sâu về CDN: Khái niệm, 3 thành phần
> (Cache, Load Balancing, Operations), vai trò (Performance + Security),
> nguyên lý hoạt động (DNS + CDN flow, CNAME), và Use Cases.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Network Infrastructure & Performance

---

## Mục Lục

0. [CDN là gì? — 3 Thành phần](#0-cdn-là-gì--3-thành-phần)
1. [Vai trò của CDN (Performance & Security)](#1-vai-trò-của-cdn-performance--security)
2. [Nguyên lý hoạt động (DNS + CDN Flow)](#2-nguyên-lý-hoạt-động-dns--cdn-flow)
3. [CDN Use Cases](#3-cdn-use-cases)
4. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#4-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. CDN là gì? — 3 Thành phần

> **🎯 CDN = mạng lưới server phân tán, phục vụ nội dung TỪ VỊ TRÍ GẦN NHẤT**

```
CDN — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  CDN (Content Delivery Network) = hệ thống mạng máy tính
  kết nối qua Internet, sử dụng SERVERS GẦN NHẤT với user
  để phân phối nội dung:

  → Nhạc, hình ảnh, video, ứng dụng, files
  → Nhanh hơn, tin cậy hơn
  → High-performance, scalable, low-cost

  ┌──────┐          ┌──────────────────────────┐
  │ User │◄────────►│   CDN Edge Server        │
  │ (VN) │  GẦN!    │   (Ho Chi Minh)          │
  └──────┘          └──────────────────────────┘
                           │ sync
  ┌──────┐          ┌──────────────────────────┐
  │ User │◄────────►│   CDN Edge Server        │
  │ (US) │  GẦN!    │   (California)           │
  └──────┘          └──────────────────────────┘
                           │ sync
                    ┌──────────────────────────┐
                    │    ORIGIN SERVER          │
                    │    (Source of truth)       │
                    └──────────────────────────┘
```

### 3 Thành phần chính

```
3 THÀNH PHẦN CDN:
═══════════════════════════════════════════════════════════════

  ① CACHE DEVICES (Thiết bị lưu cache — Edge Cache)
  ┌──────────────────────────────────────────────────────────┐
  │ → ĐƠN VỊ VẬN HÀNH CƠ BẢN nhất của CDN               │
  │ → TRỰC TIẾP phản hồi yêu cầu end-user                 │
  │ → Cung cấp NHANH nội dung đã cache local               │
  │ → Đồng bộ nội dung với ORIGIN SITE:                    │
  │   · Lấy content MỚI CẬP NHẬT từ origin                │
  │   · Lấy content CHƯA CÓ local → lưu local             │
  │ → SỐ LƯỢNG + QUY MÔ cache = chỉ số đánh giá          │
  │   năng lực phục vụ CDN                                   │
  └──────────────────────────────────────────────────────────┘

  ② LOAD BALANCING SYSTEM (Hệ thống cân bằng tải)
  ┌──────────────────────────────────────────────────────────┐
  │ CHỨC NĂNG: Điều phối access cho TẤT CẢ users          │
  │ → Xác định ACTUAL ACCESS ADDRESS cho mỗi user         │
  │                                                          │
  │ 2 CẤP ĐỘ:                                               │
  │ ┌────────────────────────────────────────────────────┐  │
  │ │ GSLB (Global Server Load Balancing)                │  │
  │ │ → Xác định VỊ TRÍ VẬT LÝ cache server            │  │
  │ │ → Theo nguyên tắc USER PROXIMITY (gần nhất)       │  │
  │ │ → Đánh giá "tối ưu" cho từng service node         │  │
  │ ├────────────────────────────────────────────────────┤  │
  │ │ SLB (Server Load Balancing — Local)                │  │
  │ │ → Cân bằng tải BÊN TRONG mỗi node                │  │
  │ │ → Chọn cache server phù hợp nhất trong node      │  │
  │ └────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────┘

  ③ OPERATIONS MANAGEMENT SYSTEM (Hệ thống quản lý vận hành)
  ┌──────────────────────────────────────────────────────────┐
  │ Gồm 2 phân hệ:                                          │
  │ → Operations Management (quản lý vận hành)              │
  │ → Network Management (quản lý mạng)                     │
  │                                                          │
  │ CHỨC NĂNG:                                               │
  │ → Customer Management (quản lý khách hàng)              │
  │ → Product Management (quản lý sản phẩm)                │
  │ → Billing Management (quản lý thanh toán)               │
  │ → Statistical Analysis (phân tích thống kê)             │
  └──────────────────────────────────────────────────────────┘
```

---

## 1. Vai trò của CDN (Performance & Security)

> **🎯 CDN dùng cho: web resources, downloadable files, applications**

```
CDN HOSTING:
═══════════════════════════════════════════════════════════════

  CDN thường dùng cho:
  → Web resources: text, images, scripts
  → Downloadable: media files, software, documents
  → Applications: portals, web apps
  → Mục đích: TĂNG TỐC truy cập tất cả resources trên
```

### Performance

```
CDN — PERFORMANCE:
═══════════════════════════════════════════════════════════════

  ① LOWER LATENCY + FASTER LOADING:
  ┌──────────────────────────────────────────────────────────┐
  │ User nhận nội dung từ DATA CENTER GẦN NHẤT             │
  │ → Latency THẤP hơn                                     │
  │ → Content loading NHANH hơn                             │
  └──────────────────────────────────────────────────────────┘

  ② GIẢM SERVER LOAD:
  ┌──────────────────────────────────────────────────────────┐
  │ 1 phần resource requests → PHÂN TÁN tới CDN            │
  │ → Origin server GIẢM TẢI đáng kể                      │
  │ → Hỗ trợ TRAFFIC PEAKS (đột biến lưu lượng)          │
  └──────────────────────────────────────────────────────────┘

  KHÔNG CÓ CDN:              CÓ CDN:
  ┌──────┐                    ┌──────┐
  │ User │──── 200ms ────►   │ User │── 20ms ──►┌─────┐
  │ (VN) │                    │ (VN) │           │CDN  │
  └──────┘                    └──────┘           │(VN) │
       │                                         └──┬──┘
       │                                            │
  ┌────▼────┐                                 ┌────▼────┐
  │ Origin  │                                 │ Origin  │
  │ (US)    │                                 │ (US)    │
  └─────────┘                                 └─────────┘
  Origin xử lý                               CDN xử lý
  TẤT CẢ requests                            phần lớn requests
```

### Security

```
CDN — SECURITY:
═══════════════════════════════════════════════════════════════

  ① CHỐNG DDoS:
  ┌──────────────────────────────────────────────────────────┐
  │ → Monitor + phân tích ABNORMAL TRAFFIC                  │
  │ → GIỚI HẠN frequency requests                          │
  │ → Traffic phân tán qua NHIỀU edge nodes                │
  │ → Khó tấn công 1 điểm duy nhất                        │
  └──────────────────────────────────────────────────────────┘

  ② CHỐNG MITM (Man-in-the-Middle):
  ┌──────────────────────────────────────────────────────────┐
  │ → End-to-end HTTPS communication                        │
  │ → Origin Server ↔ CDN Node ↔ ISP ↔ User              │
  │ → TẤT CẢ đoạn đều mã hóa HTTPS                       │
  └──────────────────────────────────────────────────────────┘

  ③ ƯU ĐIỂM KHÁC (Cloud Service):
  ┌──────────────────────────────────────────────────────────┐
  │ → Resource hosting                                       │
  │ → On-demand scaling (tự scale khi traffic tăng)        │
  │ → Xử lý traffic peaks (flash sales, events)            │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. Nguyên lý hoạt động (DNS + CDN Flow)

> **🎯 CDN gắn liền với DNS resolution process**

### DNS Resolution Process (Ôn lại)

```
DNS RESOLUTION — QUY TRÌNH:
═══════════════════════════════════════════════════════════════

  Nhập www.test.com vào browser:

  ┌──────────────────────────────────────────────────────────┐
  │ ① Kiểm tra BROWSER CACHE                                │
  │      │ miss                                              │
  │      ▼                                                   │
  │ ② Kiểm tra OS CACHE (hosts file)                        │
  │      │ miss                                              │
  │      ▼                                                   │
  │ ③ Kiểm tra ROUTER CACHE                                 │
  │      │ miss                                              │
  │      ▼                                                   │
  │ ④ Query ISP's LDNS server                               │
  │      │ miss                                              │
  │      ▼                                                   │
  │ ⑤ Query ROOT NAME SERVER                                │
  │      │                                                   │
  │      ├─→ Root → trả TLD server (.com)                  │
  │      │                                                   │
  │      ├─→ TLD (.com) → trả SLD server (.test)           │
  │      │                                                   │
  │      ├─→ SLD (.test) → trả IP cho www.test.com         │
  │      │                                                   │
  │      └─→ Local DNS CACHE kết quả → trả về user        │
  └──────────────────────────────────────────────────────────┘
```

### Không dùng CDN vs Dùng CDN

```
KHÔNG CÓ CDN — FLOW:
═══════════════════════════════════════════════════════════════

  ① DNS resolve domain → lấy IP
  ② Browser gửi request tới server (IP)
  ③ Server trả response về browser

  ┌──────┐  ① DNS   ┌─────┐  ② request  ┌──────┐
  │ User │─────────►│ DNS │             │Origin│
  │      │◄─── IP ──│     │  ──────────►│Server│
  │      │          └─────┘             │      │
  │      │◄──────── ③ response ─────────│      │
  └──────┘                              └──────┘
```

```
CÓ CDN — FLOW (7 BƯỚC):
═══════════════════════════════════════════════════════════════

  ┌──────┐     ┌──────────┐     ┌──────────┐
  │ User │ ①  │ Website  │ ①  │ CDN DNS  │
  │      │────►│ DNS      │────►│ Server   │
  │      │     │ Server   │     │ (CNAME)  │
  │      │     └──────────┘     └────┬─────┘
  │      │                           │
  │      │◄──── ② IP of GSLB ───────┘
  │      │
  │      │ ③ request
  │      ├─────────────────────►┌──────────────┐
  │      │                      │ GSLB         │
  │      │                      │ (Global LB)  │
  │      │                      └──────┬───────┘
  │      │                        ④    │   ⑤
  │      │                      ┌──────▼───────┐
  │      │                      │ Regional LB  │
  │      │                      │ (SLB)        │
  │      │                      └──────┬───────┘
  │      │                             │ chọn cache
  │      │◄──── ⑥ Cache Server IP ────┘
  │      │
  │      │ ⑦ request to cache server
  │      ├─────────────────────►┌──────────────┐
  │      │◄─── response ───────│ Cache Server │
  └──────┘                      │ (Edge)       │
                                └──────────────┘

  CHI TIẾT 7 BƯỚC:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Local DNS resolve URL → phát hiện CNAME              │
  │   trỏ tới CDN DNS server → chuyển quyền resolve       │
  │                                                          │
  │ ② CDN DNS server trả IP của GSLB                       │
  │   (CDN Global Load Balancer)                             │
  │                                                          │
  │ ③ User gửi request tới GSLB                            │
  │                                                          │
  │ ④ GSLB dựa vào USER IP + REQUEST URL                   │
  │   → chọn REGIONAL LB phù hợp                           │
  │   → chỉ user gửi request tới Regional LB              │
  │                                                          │
  │ ⑤ Regional LB chọn CACHE SERVER phù hợp               │
  │   → trả IP cache server về GSLB                        │
  │                                                          │
  │ ⑥ GSLB trả IP cache server về USER                     │
  │                                                          │
  │ ⑦ User gửi request tới CACHE SERVER                    │
  │   → Cache server phản hồi nội dung                     │
  └──────────────────────────────────────────────────────────┘

  ⚠️ CACHE MISS:
  ┌──────────────────────────────────────────────────────────┐
  │ Nếu cache server KHÔNG CÓ content user cần:            │
  │ → Request lên PARENT cache server                       │
  │ → Tiếp tục lên trên cho tới khi tìm thấy              │
  │ → Cuối cùng vẫn không có → về ORIGIN SERVER            │
  │                                                          │
  │ Cache → Parent Cache → ... → Origin Server             │
  └──────────────────────────────────────────────────────────┘
```

### CNAME (Canonical Name)

```
CNAME — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  CNAME = ALIAS (bí danh) cho domain name

  Khi DNS resolve domain:
  → Thường resolve ra IP ADDRESS
  → HOẶC resolve ra CNAME (alias domain)
  → Sau đó dùng CNAME để tìm IP tương ứng

  VÍ DỤ:
  www.test.com → CNAME → cdn.test.com → IP: 1.2.3.4

  ┌────────────────┐  CNAME  ┌────────────────┐  resolve
  │ www.test.com   │────────►│ cdn.test.com   │─────────►IP
  │                │         │ (CDN domain)   │
  └────────────────┘         └────────────────┘

  → Đây là cách CDN "xen vào" DNS resolution
  → Local DNS thấy CNAME → chuyển quyền cho CDN DNS
  → CDN DNS trả IP của edge server GẦN NHẤT
```

---

## 3. CDN Use Cases

```
CDN USE CASES:
═══════════════════════════════════════════════════════════════

  ① THIRD-PARTY CDN SERVICE:
  ┌──────────────────────────────────────────────────────────┐
  │ → Open-source projects sử dụng CDN bên thứ 3          │
  │ → VD: cdnjs, jsDelivr, unpkg                           │
  │ → Thư viện JS, CSS framework nhanh chóng deploy        │
  │                                                          │
  │ VD: <script src="https://cdn.jsdelivr.net/              │
  │        npm/vue@3.3/dist/vue.global.min.js">             │
  └──────────────────────────────────────────────────────────┘

  ② STATIC RESOURCE CACHING:
  ┌──────────────────────────────────────────────────────────┐
  │ → Host static resources: JS, CSS, images                │
  │ → Có thể đặt TOÀN BỘ project trên CDN                 │
  │ → One-click deployment                                   │
  │ → Giảm load cho origin server                           │
  │                                                          │
  │ VD: Assets trên AWS CloudFront / Cloudflare             │
  └──────────────────────────────────────────────────────────┘

  ③ LIVE STREAMING DELIVERY:
  ┌──────────────────────────────────────────────────────────┐
  │ → Live streaming dùng STREAMING MEDIA để phân phối     │
  │ → CDN hỗ trợ streaming media delivery                  │
  │ → Tăng tốc access cho live stream                      │
  │                                                          │
  │ ⚠️ KHÁC QUY TẮC FILE THƯỜNG:                           │
  │ → File thường: cache miss → tìm tiếp lên parent       │
  │ → Streaming: data volume RẤT LỚN                       │
  │ → Back-to-origin → performance issue                   │
  │ → Streaming dùng PROACTIVE PUSH (đẩy chủ động)        │
  │   thay vì pull on-demand                                │
  │                                                          │
  │ File thường:  Cache Miss → Pull từ Parent/Origin       │
  │ Streaming:    PUSH chủ động tới Edge Servers           │
  └──────────────────────────────────────────────────────────┘
```

---

## 4. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
CDN — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  CDN = Content Delivery Network
  → Server GẦN NHẤT phục vụ → giảm latency

  3 THÀNH PHẦN:
    ① Cache Devices (edge cache) — phục vụ trực tiếp user
    ② Load Balancing (GSLB + SLB) — chọn server tối ưu
    ③ Operations Management — quản lý vận hành

  PERFORMANCE: lower latency, giảm server load
  SECURITY: chống DDoS (rate limit), chống MITM (HTTPS e2e)

  CDN FLOW (7 bước):
    ① DNS → CNAME → CDN DNS
    ② CDN DNS → IP of GSLB
    ③ User → GSLB
    ④ GSLB → Regional LB
    ⑤ Regional LB → chọn cache server
    ⑥ GSLB → cache server IP → user
    ⑦ User → cache server → response

  CNAME: alias domain → CDN xen vào DNS resolution

  USE CASES: 3rd-party CDN, static caching, live streaming
  STREAMING: proactive push (khác pull on-demand cho files)
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. CDN là gì? Gồm những thành phần nào?**

> **Content Delivery Network** — mạng server phân tán, phục vụ nội dung từ vị trí **gần nhất** với user. 3 thành phần: ① **Cache Devices** (edge cache, đơn vị cơ bản, trực tiếp phục vụ user, sync với origin). ② **Load Balancing** (GSLB chọn node gần nhất + SLB cân bằng trong node). ③ **Operations Management** (customer, product, billing, statistics).

**2. CDN giúp gì cho Performance?**

> ① User nhận content từ **data center gần nhất** → latency thấp, loading nhanh. ② Một phần requests **phân tán tới CDN** → giảm origin server load. Thêm: resource hosting + on-demand scaling (xử lý traffic peaks).

**3. CDN giúp gì cho Security?**

> ① **Chống DDoS**: monitor abnormal traffic, rate limiting, traffic phân tán qua nhiều edge nodes. ② **Chống MITM**: end-to-end **HTTPS** từ origin → CDN node → ISP → user.

**4. CDN hoạt động như thế nào (7 bước)?**

> ① Local DNS resolve → thấy **CNAME** trỏ tới CDN DNS. ② CDN DNS trả IP **GSLB**. ③ User request tới GSLB. ④ GSLB chọn **Regional LB** theo user IP + URL. ⑤ Regional LB chọn **cache server** phù hợp. ⑥ GSLB trả cache server IP cho user. ⑦ User request tới cache server → nhận content. Cache miss → request lên parent → cuối cùng → origin.

**5. CNAME là gì? Vai trò trong CDN?**

> CNAME = **alias** (bí danh) cho domain. DNS resolve domain → thấy CNAME → tiếp tục resolve CNAME → tìm IP. CDN dùng CNAME để **"xen vào"** DNS resolution: local DNS thấy CNAME trỏ CDN → chuyển quyền resolve cho CDN DNS → CDN trả IP edge server **gần nhất**.

**6. CDN xử lý live streaming khác file thường thế nào?**

> File thường: cache miss → **pull** từ parent cache → origin (on-demand). Streaming: data volume **rất lớn** → back-to-origin gây performance issue → dùng **proactive push** (đẩy chủ động content tới edge servers trước).

**7. GSLB vs SLB khác gì?**

> **GSLB** (Global): xác định **vị trí vật lý** cache server gần user nhất (proximity principle), đánh giá tối ưu giữa **các nodes**. **SLB** (Local/Server): cân bằng tải **bên trong** 1 node, chọn cache server phù hợp nhất trong node đó.

---

## Checklist Học Tập

- [ ] Hiểu CDN là gì (Content Delivery Network)
- [ ] Biết 3 thành phần: Cache, Load Balancing, Operations
- [ ] Hiểu vai trò Performance (latency, server load)
- [ ] Hiểu vai trò Security (DDoS, MITM)
- [ ] Biết DNS resolution process (5 bước)
- [ ] Hiểu CDN flow 7 bước (DNS → CNAME → GSLB → SLB → Cache)
- [ ] Biết CNAME (alias → CDN xen vào DNS)
- [ ] Biết cache miss flow (parent → origin)
- [ ] Hiểu 3 use cases (3rd-party, static, streaming)
- [ ] Phân biệt file caching vs streaming (pull vs push)

---

_Cập nhật lần cuối: Tháng 2, 2026_
