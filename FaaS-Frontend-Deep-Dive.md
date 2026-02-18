# FaaS và Front-End Development — Deep Dive

> **Study Guide cho Senior Front-End Developer**
> Tài liệu này đi sâu vào FaaS (Function as a Service),
> tập trung vào 4 câu hỏi cốt lõi:
>
> 1. Serverless và FaaS LÀ GÌ?
> 2. Các sản phẩm FaaS HIỆN CÓ trên thị trường?
> 3. FaaS mang lại LỢI ÍCH GÌ cho front-end?
> 4. TƯƠNG LAI của FaaS sẽ đi về đâu?

---

## §1. Serverless và FaaS — Tổng Quan Khái Niệm

```
================================================================
  SERVERLESS = ĐIỆN TOÁN KHÔNG MÁY CHỦ!
================================================================


  ĐỊNH NGHĨA SERVERLESS:
  +------------------------------------------------------------+
  |                                                            |
  |  Serverless là MỘT KHÁI NIỆM điện toán đám mây:          |
  |                                                            |
  |  -> Người dùng CHỈ CẦN VIẾT CODE!                         |
  |  -> Mọi việc quản lý server -> NHÀ CUNG CẤP CLOUD lo!    |
  |  -> Không cần quan tâm đến:                                |
  |     - Cấu hình server                                     |
  |     - Mở rộng tài nguyên (scaling)                         |
  |     - Bảo trì hạ tầng (infrastructure)                     |
  |     - Cập nhật hệ điều hành                                |
  |                                                            |
  |  "Serverless ủy thác TOÀN BỘ các công việc liên quan       |
  |   đến server cho nhà cung cấp đám mây, giải phóng         |
  |   người dùng khỏi gánh nặng quản lý server."              |
  |                                                            |
  +------------------------------------------------------------+


  FaaS — TRÁI TIM CỦA SERVERLESS:
  +------------------------------------------------------------+
  |                                                            |
  |  FaaS = Function as a Service                              |
  |       = Hàm dịch vụ (chạy hàm trên cloud!)                |
  |                                                            |
  |  -> FaaS là PHẦN CỐT LÕI của Serverless!                  |
  |  -> Ngoài FaaS, còn có BaaS (Backend as a Service)         |
  |     bổ sung thêm các dịch vụ chuyên biệt.                 |
  |                                                            |
  |  CÔNG THỨC:                                                |
  |  +-------------------------------------------------+       |
  |  |                                                 |       |
  |  |  Serverless = FaaS + BaaS                       |       |
  |  |                                                 |       |
  |  |  FaaS  -> Tính toán tổng quát (general compute) |       |
  |  |  BaaS  -> Hệ sinh thái sản phẩm chuyên biệt:   |       |
  |  |           - Object Storage (lưu trữ đối tượng)  |       |
  |  |           - Database (cơ sở dữ liệu)            |       |
  |  |           - Messaging (cơ chế nhắn tin)          |       |
  |  |                                                 |       |
  |  +-------------------------------------------------+       |
  |                                                            |
  +------------------------------------------------------------+


  MÔ HÌNH HOẠT ĐỘNG:
  +------------------------------------------------------------+
  |                                                            |
  |  TRƯỚC KHI CÓ FaaS:                                       |
  |                                                            |
  |  Developer --> Viết code                                   |
  |            --> Mua/thuê server                             |
  |            --> Cài đặt OS, runtime                         |
  |            --> Deploy code                                 |
  |            --> Cấu hình load balancer                      |
  |            --> Monitor + Maintain                          |
  |            --> Scale khi traffic tăng                      |
  |                                                            |
  |                                                            |
  |  SAU KHI CÓ FaaS:                                         |
  |                                                            |
  |  Developer --> Viết code (function)                        |
  |            --> Upload lên cloud                            |
  |            --> XONG! Cloud lo phần còn lại!                |
  |                                                            |
  |                                                            |
  |  +----------------------+  +-------------------------+     |
  |  | Developer chỉ cần:  |  | Cloud provider lo:      |     |
  |  +----------------------+  +-------------------------+     |
  |  | - Viết business logic|  | - Provisioning server   |     |
  |  | - Upload code        |  | - Auto-scaling          |     |
  |  |                      |  | - High availability     |     |
  |  |                      |  | - Monitoring            |     |
  |  |                      |  | - Security patches      |     |
  |  |                      |  | - Load balancing        |     |
  |  +----------------------+  +-------------------------+     |
  |                                                            |
  +------------------------------------------------------------+


  HÀM ĐÁM MÂY (CLOUD FUNCTIONS) HOẠT ĐỘNG THẾ NÀO?
  +------------------------------------------------------------+
  |                                                            |
  |  (1) Developer VIẾT một function (hàm):                    |
  |                                                            |
  |      exports.handler = async (event) => {                  |
  |        const name = event.queryStringParameters.name;      |
  |        return {                                            |
  |          statusCode: 200,                                  |
  |          body: JSON.stringify({                             |
  |            message: `Xin chào, ${name}!`                   |
  |          })                                                |
  |        };                                                  |
  |      };                                                    |
  |                                                            |
  |  (2) Upload function lên cloud platform                    |
  |                                                            |
  |  (3) Cấu hình trigger (HTTP request, event, schedule...)   |
  |                                                            |
  |  (4) Khi có request -> Cloud TỰ ĐỘNG:                     |
  |      -> Khởi tạo container (cold start)                    |
  |      -> Chạy function                                      |
  |      -> Trả kết quả                                        |
  |      -> Giải phóng tài nguyên (nếu không dùng)            |
  |                                                            |
  |  (5) TÍNH PHÍ theo:                                        |
  |      -> Số lần gọi (invocations)                           |
  |      -> Thời gian thực thi (execution time)                |
  |      -> Bộ nhớ sử dụng (memory)                            |
  |      -> KHÔNG TÍNH PHÍ khi code KHÔNG CHẠY!               |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §2. Các Sản Phẩm FaaS Trên Thị Trường

```
================================================================
  CÁC SẢN PHẨM FaaS ĐÃ CHÍN MUỒI (TÍNH ĐẾN 2020)
================================================================


  1. AWS LAMBDA — TIÊN PHONG FaaS:
  +------------------------------------------------------------+
  |                                                            |
  |  Amazon ra mắt AWS Lambda từ NĂM 2015!                    |
  |                                                            |
  |  SLOGAN:                                                   |
  |  "Chạy code mà KHÔNG CẦN NGHĨ về servers.                |
  |   Chỉ trả tiền cho THỜI GIAN TÍNH TOÁN thực sự dùng."    |
  |                                                            |
  |  -> Developer chỉ cần UPLOAD CODE!                        |
  |  -> Lambda TỰ ĐỘNG xử lý mọi thứ cần thiết:              |
  |     - Chạy code                                            |
  |     - High availability (tính sẵn sàng cao)                |
  |     - Auto-scaling (tự động mở rộng)                       |
  |                                                            |
  |                                                            |
  |  CÁC KỊCH BẢN ỨNG DỤNG CHÍNH:                            |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  (1) XỬ LÝ DỮ LIỆU:                                |  |
  |  |      - Xử lý file theo thời gian thực                |  |
  |  |        (tạo thumbnail, chuyển đổi video,              |  |
  |  |         xử lý log...)                                 |  |
  |  |      - Xử lý luồng dữ liệu thời gian thực           |  |
  |  |        (theo dõi chỉ số truy cập của user)            |  |
  |  |                                                      |  |
  |  |  (2) MACHINE LEARNING:                               |  |
  |  |      - Tiền xử lý dữ liệu trước khi                 |  |
  |  |        đưa vào mô hình ML                             |  |
  |  |                                                      |  |
  |  |  (3) BACKEND:                                        |  |
  |  |      - Xử lý request từ web, mobile,                  |  |
  |  |        IoT và API bên thứ 3                           |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  GÓI MIỄN PHÍ:                                            |
  |  -> AWS Trung Quốc: 25GB NoSQL + 1 triệu request/tháng   |
  |  -> AWS Quốc tế: Tương tự, MIỄN PHÍ VĨNH VIỄN!           |
  |                                                            |
  +------------------------------------------------------------+


  2. ALIBABA CLOUD FC — FUNCTION COMPUTE:
  +------------------------------------------------------------+
  |                                                            |
  |  Alibaba Cloud cũng có giải pháp FaaS: Function Compute   |
  |                                                            |
  |  ĐẶC ĐIỂM:                                                |
  |  -> Dịch vụ tính toán được quản lý TOÀN PHẦN              |
  |  -> Điều khiển bởi SỰ KIỆN (event-driven)                 |
  |  -> Không cần quản lý server hay hạ tầng                   |
  |  -> Chạy code LINH HOẠT và ĐẢM BẢO TIN CẬY               |
  |  -> Cung cấp: log query, monitoring, alerts                |
  |  -> Chỉ trả phí khi CODE ĐANG CHẠY!                       |
  |                                                            |
  |                                                            |
  |  CÁC KỊCH BẢN ỨNG DỤNG:                                  |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  (1) Truyền file xuyên biên giới chi phí thấp:       |  |
  |  |      -> Đồng bộ file quy mô lớn                      |  |
  |  |                                                      |  |
  |  |  (2) Xử lý file:                                     |  |
  |  |      -> Nén/giải nén, chuyển mã,                     |  |
  |  |         thêm watermark cho file trên OSS              |  |
  |  |                                                      |  |
  |  |  (3) Hệ thống CI/CD cho front-end:                   |  |
  |  |      -> Webhook kích hoạt cloud function              |  |
  |  |      -> Upload code front-end lên OSS                 |  |
  |  |      -> Deploy qua CDN                                |  |
  |  |                                                      |  |
  |  |  (4) Xử lý log ETL:                                  |  |
  |  |      -> Xử lý và chuyển giao dữ liệu                 |  |
  |  |                                                      |  |
  |  |  (5) Thiết bị thông minh:                             |  |
  |  |      -> Cung cấp thông tin thời tiết,                 |  |
  |  |         chỉ số môi trường cho smart home              |  |
  |  |                                                      |  |
  |  |  (6) Website vừa và nhỏ:                              |  |
  |  |      -> VD: website serverless với                    |  |
  |  |         Function Compute + WordPress                  |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  LƯU Ý:                                                   |
  |  -> Có gói miễn phí cho nhóm 1-10 người                   |
  |  -> Mức miễn phí KHÔNG MINH BẠCH lắm                      |
  |  -> Có thể bị TÍNH PHÍ trong tương lai                    |
  |  -> Dịch vụ OSS của Alibaba Cloud KHÔNG có miễn phí!      |
  |                                                            |
  +------------------------------------------------------------+


  3. TENCENT CLOUD SCF — SERVERLESS CLOUD FUNCTION:
  +------------------------------------------------------------+
  |                                                            |
  |  SCF = Serverless Cloud Function của Tencent Cloud         |
  |                                                            |
  |  ĐẶC ĐIỂM:                                                |
  |  -> Môi trường thực thi serverless                         |
  |  -> Giúp chạy code LINH HOẠT và AN TOÀN                   |
  |  -> Trên hạ tầng Tencent Cloud                             |
  |  -> Chỉ viết code bằng ngôn ngữ được hỗ trợ và            |
  |     thiết lập điều kiện thực thi là XONG!                  |
  |                                                            |
  |                                                            |
  |  4 KỊCH BẢN ỨNG DỤNG CHÍNH:                               |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  (1) Xử lý file thời gian thực:                      |  |
  |  |      -> Chuyển mã audio/video                         |  |
  |  |                                                      |  |
  |  |  (2) Xử lý dữ liệu ETL:                              |  |
  |  |      -> Phân tích và xử lý dataset lớn                |  |
  |  |      -> (ETL = Extract-Transform-Load)                |  |
  |  |                                                      |  |
  |  |  (3) Backend cho mobile và web:                       |  |
  |  |      -> Hiện thực backend dưới dạng                   |  |
  |  |         cloud functions                               |  |
  |  |                                                      |  |
  |  |  (4) AI Inference & Prediction:                       |  |
  |  |      -> Sau khi train xong mô hình AI,               |  |
  |  |         cung cấp dịch vụ suy luận cho user            |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  LƯU Ý:                                                   |
  |  -> Có một lượng data MIỄN PHÍ mỗi tháng                  |
  |  -> Dữ liệu internet NGOÀI mạng nội bộ -> KHÔNG MIỄN PHÍ!|
  |  -> CẨN THẬN khi thử nghiệm!                              |
  |                                                            |
  +------------------------------------------------------------+


  SO SÁNH NHANH 3 SẢN PHẨM FaaS:
  +------------------------------------------------------------+
  |                                                            |
  |  +------------------+----------+-----------+----------+    |
  |  | Tiêu chí         | AWS      | Alibaba   | Tencent  |    |
  |  |                  | Lambda   | Cloud FC  | SCF      |    |
  |  +------------------+----------+-----------+----------+    |
  |  | Ra mắt           | 2015     | ~2017     | ~2017    |    |
  |  | Gói miễn phí     | CÓ       | CÓ (*)   | CÓ (*)  |    |
  |  | Minh bạch phí    | CAO      | TRUNG BÌNH| THẤP    |    |
  |  | Hệ sinh thái     | RẤT LỚN | LỚN       | LỚN     |    |
  |  | Ngôn ngữ hỗ trợ  | Nhiều    | Nhiều     | Nhiều    |    |
  |  | Event-driven     | CÓ       | CÓ        | CÓ      |    |
  |  | Auto-scaling     | CÓ       | CÓ        | CÓ      |    |
  |  +------------------+----------+-----------+----------+    |
  |                                                            |
  |  (*) Có điều kiện, không hoàn toàn minh bạch              |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §3. FaaS Mang Lại Lợi Ích Gì Cho Front-End? — Tổng Quan

```
================================================================
  CÓ FaaS = FRONT-END DEVELOPER CÓ THÊM "VŨ KHÍ MỚI"!
================================================================


  TRƯỚC KHI CÓ FaaS — Vấn Đề Của Front-End:
  +------------------------------------------------------------+
  |                                                            |
  |  Để deploy một backend service ĐƠN GIẢN                   |
  |  (VD: API aggregation, data orchestration),                |
  |  front-end developer CẦN:                                  |
  |                                                            |
  |  [x] Chọn technology stack (Node.js? Go? Python?)          |
  |  [x] Xem xét cơ chế scaling khi traffic cao               |
  |  [x] Ước lượng peak traffic + xin máy chủ trước           |
  |  [x] Thực hiện quy trình CI/CD                            |
  |  [x] Kết nối hệ thống monitoring và vận hành              |
  |                                                            |
  |  -> CẦN sự giúp đỡ của BACKEND ENGINEER chuyên nghiệp!    |
  |  -> Front-end KHÔNG THỂ tự làm được!                       |
  |  -> Rõ ràng là RÀO CẢN LỚN!                               |
  |                                                            |
  +------------------------------------------------------------+


  SAU KHI CÓ FaaS — Mọi Thứ Thay Đổi:
  +------------------------------------------------------------+
  |                                                            |
  |  Với FaaS, front-end developer CHỈ CẦN:                   |
  |                                                            |
  |  -> Cung cấp MỘT ĐOẠN CODE (function)!                    |
  |                                                            |
  |  FaaS sẽ TỰ ĐỘNG:                                         |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  [✓] Chọn best practices cho tech stack tương ứng    |  |
  |  |  [✓] Tự động mở rộng tài nguyên theo nhu cầu thực tế|  |
  |  |  [✓] Deploy service ra public network DỄ DÀNG        |  |
  |  |  [✓] Cung cấp monitoring và alarm tin cậy            |  |
  |  |  [✓] Đảm bảo high availability                       |  |
  |  |  [✓] Logging sẵn sàng sử dụng                        |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  KẾT QUẢ:                                                 |
  |  -> Đưa 1 function vào FaaS = DEPLOY ĐƯỢC service         |
  |     với HIGH AVAILABILITY!                                 |
  |  -> Yêu cầu chuyên môn để phát triển service interfaces   |
  |     GIẢM XUỐNG ĐÁNG KỂ!                                   |
  |  -> Front-end developer có NHIỀU KHÔNG GIAN hơn           |
  |     để phát huy năng lực!                                  |
  |                                                            |
  +------------------------------------------------------------+


  3 LĨNH VỰC CHÍNH MÀ FaaS MỞ RA CHO FRONT-END:
  +------------------------------------------------------------+
  |                                                            |
  |                    +--------+                              |
  |                    | FaaS   |                              |
  |                    +---+----+                              |
  |                        |                                   |
  |          +-------------+-------------+                     |
  |          |             |             |                     |
  |     +----v----+   +----v----+   +----v----+               |
  |     |  BFF    |   |  SSR    |   | End-to- |               |
  |     |(Backend |   |(Server- |   |  End    |               |
  |     | For     |   | Side    |   | Cloud   |               |
  |     |Frontend)|   |Rendering|   | Dev     |               |
  |     +---------+   +---------+   +---------+               |
  |                                                            |
  |  (1) BFF  -> Tầng trung gian giữa FE và backend           |
  |  (2) SSR  -> Render HTML trên server                       |
  |  (3) End-to-End -> Phát triển tích hợp FE + backend        |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §4. BFF — Backend For Frontend (Tầng Tối Ưu Trải Nghiệm)

```
================================================================
  BFF = BACKEND ĐƯỢC THIẾT KẾ RIÊNG CHO FRONTEND!
================================================================


  KHÁI NIỆM BFF:
  +------------------------------------------------------------+
  |                                                            |
  |  BFF = Backend For Frontend                                |
  |      = Tầng Tối Ưu Trải Nghiệm Người Dùng                |
  |                                                            |
  |  NGUYÊN TẮC:                                               |
  |  "Một backend cho MỖI trải nghiệm người dùng"             |
  |  (One backend per user experience)                         |
  |                                                            |
  |                                                            |
  |  NÓI CÁCH KHÁC:                                            |
  |  -> BFF được THIẾT KẾ cho một trải nghiệm                 |
  |     người dùng CỤ THỂ!                                    |
  |  -> HIỆN THỰC và BẢO TRÌ bởi CHÍNH đội front-end          |
  |     phụ trách phần UI đó!                                  |
  |  -> UI và BFF tương ứng được xử lý bởi CÙNG MỘT ĐỘI!     |
  |                                                            |
  +------------------------------------------------------------+


  MÔ HÌNH BFF:
  +------------------------------------------------------------+
  |                                                            |
  |  KHÔNG CÓ BFF:                                             |
  |                                                            |
  |  +--------+                                                |
  |  | Mobile |----+                                           |
  |  +--------+    |    +----------------+    +----------+     |
  |                +--->| General        |--->| Backend  |     |
  |  +--------+    |    | API Gateway    |    | Services |     |
  |  | Web    |----+    +----------------+    +----------+     |
  |  +--------+    |                                           |
  |                |                                           |
  |  +--------+   |                                            |
  |  | Desktop|---+                                            |
  |  +--------+                                                |
  |                                                            |
  |  VẤN ĐỀ:                                                  |
  |  -> Mỗi platform (mobile, web, desktop)                   |
  |     có NHU CẦU KHÁC NHAU!                                  |
  |  -> General API -> KHÔNG tối ưu cho từng platform!         |
  |  -> Mobile cần ít data hơn, Web cần nhiều hơn...           |
  |                                                            |
  |                                                            |
  |  CÓ BFF:                                                   |
  |                                                            |
  |  +--------+    +--------+                                  |
  |  | Mobile |--->| Mobile |---+                              |
  |  +--------+    | BFF    |   |    +----------+              |
  |                +--------+   +--->| Backend  |              |
  |  +--------+    +--------+   |    | Services |              |
  |  | Web    |--->| Web    |---+    +----------+              |
  |  +--------+    | BFF    |   |                              |
  |                +--------+   |                              |
  |  +--------+    +--------+   |                              |
  |  |Desktop |--->|Desktop |---+                              |
  |  +--------+    | BFF    |                                  |
  |                +--------+                                  |
  |                                                            |
  |  LỢI ÍCH:                                                 |
  |  -> Mỗi platform có BFF RIÊNG, tối ưu cho platform đó!    |
  |  -> BFF tổng hợp, biến đổi data PHÙ HỢP với UI!           |
  |  -> Front-end team KIỂM SOÁT được tầng API của mình!      |
  |                                                            |
  +------------------------------------------------------------+


  BFF VỚI NODE.JS (TRƯỚC FaaS):
  +------------------------------------------------------------+
  |                                                            |
  |  Từ 2018 (hoặc sớm hơn), một số đội đã bắt đầu           |
  |  triển khai BFF dựa trên Node.js:                          |
  |                                                            |
  |  +--------+    +------------------+    +-----------+       |
  |  | Client |--->| BFF (Node.js)    |--->| Backend   |       |
  |  | (FE)   |    | - API aggregation|    | Services  |       |
  |  +--------+    | - Data transform |    +-----------+       |
  |                | - Auth proxy     |                        |
  |                +------------------+                        |
  |                                                            |
  |  Front-end module developer phụ trách                      |
  |  phát triển interface TƯƠNG ỨNG trên tầng BFF.             |
  |                                                            |
  |                                                            |
  |  VẤN ĐỀ:                                                  |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  [!] Đội front-end PHẢI là FULL-STACK!               |  |
  |  |  [!] Khi BFF phát triển -> yêu cầu NGÀY CÀNG CAO:   |  |
  |  |      - Khả năng mở rộng (extensibility)              |  |
  |  |      - Độ ổn định (stability)                        |  |
  |  |      - Xử lý lỗi (error handling)                    |  |
  |  |      - Monitoring & alerting                         |  |
  |  |      - CI/CD pipeline                                |  |
  |  |  [!] Đây là công việc của BACKEND EXPERT!            |  |
  |  |  [!] Front-end engineer bị QUÁ TẢI!                  |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  BFF TIẾN HÓA THÀNH SFF — NHỜ CÓ FaaS:
  +------------------------------------------------------------+
  |                                                            |
  |  SFF = Serverless For Frontend                             |
  |                                                            |
  |  FaaS GIẢI QUYẾT vấn đề của BFF như thế nào?              |
  |                                                            |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  TRƯỚC (BFF):                                        |  |
  |  |  +-------------------------------------------------+ |  |
  |  |  | Front-end engineer phải lo:                      | |  |
  |  |  | [x] Business logic        <- ĐÚNG RỒI!          | |  |
  |  |  | [x] Server management     <- SAI RỒI!           | |  |
  |  |  | [x] Scaling               <- SAI RỒI!           | |  |
  |  |  | [x] Monitoring            <- SAI RỒI!           | |  |
  |  |  | [x] High availability     <- SAI RỒI!           | |  |
  |  |  +-------------------------------------------------+ |  |
  |  |                                                      |  |
  |  |  SAU (SFF = BFF + FaaS):                             |  |
  |  |  +-------------------------------------------------+ |  |
  |  |  | Front-end engineer chỉ lo:                       | |  |
  |  |  | [x] Business logic        <- CHỈ CẦN THẾ NÀY!   | |  |
  |  |  |                                                  | |  |
  |  |  | Cloud provider (FaaS) lo:                        | |  |
  |  |  | [x] Server management     <- CHUYÊN GIA LO!     | |  |
  |  |  | [x] Scaling               <- CHUYÊN GIA LO!     | |  |
  |  |  | [x] Monitoring            <- CHUYÊN GIA LO!     | |  |
  |  |  | [x] High availability     <- CHUYÊN GIA LO!     | |  |
  |  |  +-------------------------------------------------+ |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  ĐIỂM THEN CHỐT:                                          |
  |  -> Framework backend CHUYÊN BIỆT được ĐÓNG GÓI           |
  |     vào trong giải pháp FaaS!                              |
  |  -> Công việc đảm bảo tính sẵn sàng (availability)        |
  |     NGOÀI business logic trong BFF được CHUYỂN GIAO        |
  |     từ front-end engineer -> CHUYÊN GIA backend            |
  |     của nhà cung cấp cloud!                                |
  |  -> Kết quả: CHUYÊN NGHIỆP hơn và HIỆU QUẢ hơn!          |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §5. SSR — Server-Side Rendering Với FaaS

```
================================================================
  SSR + FaaS = HIGH AVAILABILITY DỄ DÀNG!
================================================================


  SSR LÀ GÌ? (Nhắc Lại):
  +------------------------------------------------------------+
  |                                                            |
  |  SSR = Server-Side Rendering                               |
  |      = Render HTML HOÀN CHỈNH trên server!                |
  |                                                            |
  |  -> Tạo trang HTML đầy đủ trên server                     |
  |  -> Gửi HTML SAU CÙNG cho client                           |
  |  -> Client hiển thị NGAY LẬP TỨC                          |
  |                                                            |
  |                                                            |
  |  LỢI ÍCH CỦA SSR:                                         |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  [✓] Loại bỏ chi phí mạng của request dữ liệu thứ 2 |  |
  |  |      từ client (không cần fetch API riêng!)           |  |
  |  |                                                      |  |
  |  |  [✓] Giảm gánh nặng hiệu suất render view template   |  |
  |  |      trên client (server làm trước rồi!)             |  |
  |  |                                                      |  |
  |  |  [✓] Tăng tốc FIRST SCREEN LOADING!                  |  |
  |  |      (user thấy nội dung NHANH hơn!)                  |  |
  |  |                                                      |  |
  |  |  [✓] Tốt cho SEO                                     |  |
  |  |      (search engine đọc được HTML đầy đủ!)            |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  VẤN ĐỀ CỦA SSR (TRƯỚC KHI CÓ FaaS):
  +------------------------------------------------------------+
  |                                                            |
  |  SSR gặp VẤN ĐỀ TƯƠNG TỰ như BFF:                         |
  |                                                            |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  [✓] Dựng một SSR demo -> KHÔNG KHÓ!                 |  |
  |  |                                                      |  |
  |  |  [!] Deploy một SSR rendering engine                  |  |
  |  |      với HIGH AVAILABILITY -> KHÔNG DỄ CHÚT NÀO!     |  |
  |  |                                                      |  |
  |  |  Phải lo:                                             |  |
  |  |  - Server cho SSR engine                              |  |
  |  |  - Scaling khi traffic tăng đột biến                  |  |
  |  |  - Monitoring render errors                           |  |
  |  |  - Fallback khi SSR thất bại                          |  |
  |  |  - Memory leaks trên server                           |  |
  |  |  - Cache strategy                                     |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  FaaS GIẢI QUYẾT VẤN ĐỀ SSR:
  +------------------------------------------------------------+
  |                                                            |
  |  FaaS khiến yêu cầu HIGH AVAILABILITY cho service          |
  |  trở nên DỄ DÀNG ĐẠT ĐƯỢC!                                |
  |                                                            |
  |  TẠI SAO SSR PHÙ HỢP VỚI FaaS?                            |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  (1) STATELESS Template Rendering:                    |  |
  |  |      -> SSR render template là STATELESS!             |  |
  |  |      -> Mỗi request độc lập, không lưu trạng thái!   |  |
  |  |      -> PHÙ HỢP HOÀN HẢO với cloud functions!        |  |
  |  |      (vì cloud functions cũng là stateless!)          |  |
  |  |                                                      |  |
  |  |  (2) Auto-Scaling:                                    |  |
  |  |      -> Traffic tăng đột biến?                        |  |
  |  |      -> FaaS TỰ ĐỘNG scale instances!                 |  |
  |  |      -> Không cần ước lượng peak traffic trước!       |  |
  |  |                                                      |  |
  |  |  (3) Cost-Effective:                                  |  |
  |  |      -> Chỉ trả phí khi CÓ RENDER thực sự!           |  |
  |  |      -> Không traffic = KHÔNG MẤT TIỀN!              |  |
  |  |                                                      |  |
  |  |  (4) Zero Server Management:                          |  |
  |  |      -> Không cần lo server cho SSR engine!           |  |
  |  |      -> Không cần lo memory leaks!                    |  |
  |  |      -> Không cần lo CI/CD!                           |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  VD: SERVERLESS SIDE RENDERING:                            |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  Đã có nhiều giải pháp SSR serverless:                |  |
  |  |                                                      |  |
  |  |  -> ykfe/ssr                                          |  |
  |  |     (Serverless Side Render framework)                |  |
  |  |                                                      |  |
  |  |  Luồng hoạt động:                                     |  |
  |  |  +-------+    +---------+    +----------+             |  |
  |  |  |  User |    | FaaS    |    | API /    |             |  |
  |  |  |Request|--->|Function |--->| Database |             |  |
  |  |  +-------+    | (SSR)   |    +----------+             |  |
  |  |               |         |                             |  |
  |  |               |  Render |                             |  |
  |  |               | template|                             |  |
  |  |               +----+----+                             |  |
  |  |                    |                                  |  |
  |  |                    v                                  |  |
  |  |              +----------+                             |  |
  |  |              | Complete |                             |  |
  |  |              |   HTML   |--> Gửi về client!           |  |
  |  |              +----------+                             |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §6. End-to-End Cloud Integrated Development

```
================================================================
  PHÁT TRIỂN TÍCH HỢP FRONT-END + BACKEND TRÊN CLOUD!
================================================================


  KHÁI NIỆM:
  +------------------------------------------------------------+
  |                                                            |
  |  End-to-End Cloud Integrated Development                   |
  |  = Phát triển tích hợp front-end và back-end               |
  |    trong MỘT DỰ ÁN DUY NHẤT!                              |
  |                                                            |
  |  -> Vừa xử lý HIỂN THỊ front-end                          |
  |  -> Vừa xử lý DATA SERVICES backend                       |
  |  -> Tất cả trong CÙNG MỘT PROJECT!                        |
  |                                                            |
  +------------------------------------------------------------+


  KHÁC GÌ VỚI PHP / JAVA WEB NGÀY XƯA?
  +------------------------------------------------------------+
  |                                                            |
  |  "Có phải chúng ta quay lại thời PHP/Java Web,             |
  |   khi frontend và backend ở chung một chỗ?"               |
  |                                                            |
  |  -> KHÔNG! Hoàn toàn KHÁC BIỆT!                           |
  |                                                            |
  |                                                            |
  |  3 ĐIỂM KHÁC BIỆT CHÍNH:                                  |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  (1) FRONT-END VÀ BACK-END TÁCH LỚP NHƯNG TÍCH HỢP: |  |
  |  |                                                      |  |
  |  |      PHP/Java Web cũ:                                 |  |
  |  |      +------------------------------------------+     |  |
  |  |      | Server-rendered HTML                      |     |  |
  |  |      | + Business logic                          |     |  |
  |  |      | + Database queries                        |     |  |
  |  |      | = TẤT CẢ GHÉP CHẶT VỚI NHAU!            |     |  |
  |  |      +------------------------------------------+     |  |
  |  |                                                      |  |
  |  |      FaaS Integrated Dev:                             |  |
  |  |      +------------------------------------------+     |  |
  |  |      | Frontend layer (React/Vue)                |     |  |
  |  |      |  |                                        |     |  |
  |  |      |  +-- Cloud Functions (FaaS backend)       |     |  |
  |  |      |     (TÁCH LỚP nhưng TÍCH HỢP trong       |     |  |
  |  |      |      cùng một dự án!)                     |     |  |
  |  |      +------------------------------------------+     |  |
  |  |                                                      |  |
  |  |                                                      |  |
  |  |  (2) DỰ ÁN LẤY FRONT-END LÀM TRUNG TÂM:            |  |
  |  |                                                      |  |
  |  |      PHP/Java Web:                                    |  |
  |  |      -> Backend là TRUNG TÂM!                         |  |
  |  |      -> Frontend chỉ là "view layer" phụ thuộc        |  |
  |  |                                                      |  |
  |  |      FaaS Integrated Dev:                             |  |
  |  |      -> Frontend là TRUNG TÂM!                        |  |
  |  |      -> Backend functions PHỤ TRỢ cho frontend        |  |
  |  |                                                      |  |
  |  |                                                      |  |
  |  |  (3) KHÔNG CHỈ GIỚI HẠN Ở WEB:                       |  |
  |  |                                                      |  |
  |  |      PHP/Java Web:                                    |  |
  |  |      -> Chỉ cho WEB!                                  |  |
  |  |                                                      |  |
  |  |      FaaS Integrated Dev:                             |  |
  |  |      -> Web + Mobile + Desktop + IoT!                 |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  TÍCH HỢP THỂ HIỆN Ở ĐÂU?
  +------------------------------------------------------------+
  |                                                            |
  |  (1) MÔI TRƯỜNG IDE TRÊN CLOUD:                           |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  -> IDE phát triển / debug TRÊN CLOUD!                |  |
  |  |  -> Trải nghiệm phát triển LIỀN MẠCH!                |  |
  |  |  -> Không cần setup local environment phức tạp!       |  |
  |  |                                                      |  |
  |  |  VD: Cloud IDE -> Edit code -> Test ngay -> Deploy!   |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |  (2) TẬP TRUNG VÀO FRONT-END:                             |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  -> Bạn (gần như) KHÔNG CẦN lo việc deploy            |  |
  |  |     và bảo trì các dịch vụ backend!                   |  |
  |  |  -> FaaS lo hết phần này cho bạn!                     |  |
  |  |  -> Bạn CHỈ CẦN tập trung vào UX và logic!           |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  |                                                            |
  |  FRAMEWORK TÍCH HỢP FaaS + REACT/VUE:                     |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  -> midwayjs/midway                                   |  |
  |  |     (Framework kết hợp FaaS với React/Vue)            |  |
  |  |                                                      |  |
  |  |  Cấu trúc dự án:                                      |  |
  |  |  my-app/                                              |  |
  |  |  ├── src/                                             |  |
  |  |  │   ├── pages/          <- Front-end pages           |  |
  |  |  │   ├── components/     <- React/Vue components      |  |
  |  |  │   └── functions/      <- Cloud functions (backend) |  |
  |  |  ├── package.json                                     |  |
  |  |  └── f.yml               <- FaaS config              |  |
  |  |                                                      |  |
  |  |  -> Frontend và backend trong CÙNG MỘT REPO!         |  |
  |  |  -> Deploy CÙNG MỘT LẦN!                             |  |
  |  |  -> Nhưng vẫn TÁCH LỚP rõ ràng!                      |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §7. Tương Lai Của FaaS — Những Khả Năng Mới

```
================================================================
  FaaS SẼ MANG LẠI NHỮNG THAY ĐỔI GÌ TRONG TƯƠNG LAI?
================================================================


  (1) NGÀY CÀNG NHIỀU GIẢI PHÁP MIỄN PHÍ / CHI PHÍ THẤP:
  +------------------------------------------------------------+
  |                                                            |
  |  -> Nhắm vào DOANH NGHIỆP NHỎ và CÁ NHÂN:               |
  |     - Mini Program Cloud (đám mây cho ứng dụng nhỏ)       |
  |     - Gói phát triển IoT                                   |
  |     - Gói đám mây miễn phí cho startup                     |
  |                                                            |
  |  -> Xu hướng: FaaS sẽ ngày càng RẺ và DỄ TIẾP CẬN hơn!   |
  |                                                            |
  +------------------------------------------------------------+


  (2) FaaS FRAMEWORK HỘI TỤ VỚI FRAMEWORK TRUYỀN THỐNG:
  +------------------------------------------------------------+
  |                                                            |
  |  -> Web service framework dựa trên FaaS đang               |
  |     HỘI TỤ với framework truyền thống!                     |
  |                                                            |
  |  -> Ứng dụng dựa trên framework truyền thống               |
  |     có thể CHUYỂN ĐỔI sang FaaS với CHI PHÍ THẤP!         |
  |                                                            |
  |                                                            |
  |  VD: Quá trình hội tụ:                                     |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  Express.js App (truyền thống):                       |  |
  |  |  const app = express();                               |  |
  |  |  app.get('/api/users', handler);                      |  |
  |  |  app.listen(3000);                                    |  |
  |  |                                                      |  |
  |  |         |                                             |  |
  |  |         | CHUYỂN ĐỔI CHI PHÍ THẤP                    |  |
  |  |         v                                             |  |
  |  |                                                      |  |
  |  |  FaaS version:                                        |  |
  |  |  exports.handler = async (event) => {                 |  |
  |  |    // Cùng logic, KHÔNG CẦN server!                   |  |
  |  |    return { statusCode: 200, body: users };           |  |
  |  |  };                                                   |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  (3) CÁC CHẾ ĐỘ RENDER TRỞ THÀNH TÙY CHỌN CẤU HÌNH:
  +------------------------------------------------------------+
  |                                                            |
  |  -> SSR, CSR, NSR trở thành CÁC TÙY CHỌN CẤU HÌNH        |
  |     trong web front-end framework!                         |
  |                                                            |
  |  -> Có thể CHUYỂN ĐỔI LINH HOẠT giữa các chế độ render!  |
  |  -> Thậm chí TRỘN LẪN các chế độ trong cùng ứng dụng!    |
  |                                                            |
  |                                                            |
  |  VD: Cấu hình rendering mode:                             |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  // next.config.js (tương lai)                        |  |
  |  |  module.exports = {                                   |  |
  |  |    pages: {                                           |  |
  |  |      '/':          { render: 'SSR' },  // Trang chủ   |  |
  |  |      '/about':     { render: 'SSG' },  // Tĩnh       |  |
  |  |      '/dashboard': { render: 'CSR' },  // Động       |  |
  |  |      '/blog/[id]': { render: 'ISR' },  // Hybrid      |  |
  |  |    }                                                  |  |
  |  |  };                                                   |  |
  |  |                                                      |  |
  |  |  -> Mỗi route có thể dùng RENDERING MODE khác nhau!  |  |
  |  |  -> Tối ưu cho từng use case CỤ THỂ!                 |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+


  (4) FRONT-END CHUYỂN HOÀN TOÀN LÊN CLOUD:
  +------------------------------------------------------------+
  |                                                            |
  |  -> FaaS được áp dụng rộng rãi                             |
  |  -> Hệ sinh thái BaaS CHÍN MUỒI                           |
  |  -> SSR và BFF ngày càng PHỔ BIẾN                          |
  |                                                            |
  |  KẾT QUẢ:                                                 |
  |  -> Front-end development đang CHUYỂN từ                   |
  |     môi trường LOCAL lên CLOUD!                            |
  |                                                            |
  |                                                            |
  |  TƯƠNG LAI CỦA FRONT-END DEVELOPER:                       |
  |  +------------------------------------------------------+  |
  |  |                                                      |  |
  |  |  TRƯỚC (Local Development):                           |  |
  |  |  Developer --> Local IDE                              |  |
  |  |           --> Local server                            |  |
  |  |           --> Local build                             |  |
  |  |           --> Deploy lên server                       |  |
  |  |                                                      |  |
  |  |  SAU (Cloud Development):                             |  |
  |  |  Developer --> Cloud IDE                              |  |
  |  |           --> Cloud Functions (FaaS)                  |  |
  |  |           --> Cloud Database (BaaS)                   |  |
  |  |           --> Auto Deploy (Serverless)                |  |
  |  |                                                      |  |
  |  |  -> Mọi thứ đều Ở TRÊN CLOUD!                        |  |
  |  |  -> Không cần setup môi trường local phức tạp!        |  |
  |  |  -> Code ở đâu cũng được, deploy tự động!            |  |
  |  |                                                      |  |
  |  +------------------------------------------------------+  |
  |                                                            |
  +------------------------------------------------------------+
```

---

## §8. Tổng Kết — Summary

```
================================================================
  TỔNG KẾT: FaaS VÀ FRONT-END DEVELOPMENT
================================================================


  SERVERLESS = FaaS + BaaS:
  +------------------------------------------------------------+
  |                                                            |
  |  -> FaaS là TRÁI TIM của Serverless computing              |
  |  -> Developer CHỈ CẦN viết code (function)                |
  |  -> Cloud provider lo TOÀN BỘ:                            |
  |     server, scaling, monitoring, availability              |
  |                                                            |
  +------------------------------------------------------------+


  3 LỢI ÍCH CHÍNH CỦA FaaS CHO FRONT-END:
  +------------------------------------------------------------+
  |                                                            |
  |  +--+--------------------------------------------+-----+  |
  |  |# | Lợi ích                                    |Mức độ|  |
  |  +--+--------------------------------------------+-----+  |
  |  |1 | BFF -> SFF: Front-end tự xây dựng tầng     | LỚN  |  |
  |  |  | API riêng mà KHÔNG CẦN lo server/scaling   |      |  |
  |  +--+--------------------------------------------+-----+  |
  |  |2 | SSR dễ dàng: Stateless rendering PHÙ HỢP   | LỚN  |  |
  |  |  | với FaaS, high availability MIỄN PHÍ        |      |  |
  |  +--+--------------------------------------------+-----+  |
  |  |3 | End-to-End: Phát triển FE + BE tích hợp     |TRUNG |  |
  |  |  | trong cùng dự án, FE là trung tâm           | BÌNH |  |
  |  +--+--------------------------------------------+-----+  |
  |                                                            |
  +------------------------------------------------------------+


  TƯƠNG LAI:
  +------------------------------------------------------------+
  |                                                            |
  |  [1] Chi phí GIẢM -> Nhiều giải pháp miễn phí hơn         |
  |  [2] Framework HỘI TỤ -> Di cư dễ dàng                    |
  |  [3] Rendering mode -> Tùy chọn cấu hình                  |
  |  [4] Cloud Development -> Phát triển hoàn toàn trên mây   |
  |                                                            |
  +------------------------------------------------------------+


  ĐIỂM THEN CHỐT CẦN NHỚ:
  +------------------------------------------------------------+
  |                                                            |
  |  "Đưa một function vào FaaS = Deploy được service          |
  |   với HIGH AVAILABILITY. Yêu cầu chuyên môn để phát        |
  |   triển service interfaces GIẢM XUỐNG ĐÁNG KỂ, giúp       |
  |   front-end developer có NHIỀU KHÔNG GIAN hơn              |
  |   để phát huy năng lực!"                                   |
  |                                                            |
  |  -> FaaS KHÔNG thay thế backend engineer!                  |
  |  -> FaaS cho phép front-end developer LÀM ĐƯỢC NHIỀU HƠN  |
  |     mà KHÔNG CẦN trở thành backend expert!                 |
  |  -> Đây là cuộc cách mạng về PHÂN CÔNG LAO ĐỘNG            |
  |     trong phát triển web!                                  |
  |                                                            |
  +------------------------------------------------------------+
```

---

> **Tham khảo:**
>
> - Bài gốc: "What benefits has FaaS brought to front-end development?" — Front-End Mind (2020-07-06)
> - AWS Lambda: https://aws.amazon.com/lambda/
> - Alibaba Cloud Function Compute: https://www.alibabacloud.com/product/function-compute
> - Tencent Cloud SCF: https://cloud.tencent.com/product/scf
> - ykfe/ssr: Serverless Side Rendering framework
> - midwayjs/midway: FaaS + React/Vue integrated framework
