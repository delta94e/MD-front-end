# 🛠️ Thư Viện Quan Trọng — Tuần 5-6: requests, FastAPI, Pydantic, dotenv

> 📅 Thuộc Phase 1 của [AI Solution Engineer Roadmap](./AI%20Solution%20Engineer%20Roadmap.md)
> 📖 Tiếp nối [Python Nâng Cao — Tuần 3-4](./Python%20Nâng%20Cao%20-%20Tuần%203-4.md)
> 🎯 Mục tiêu: Xây được API server, gọi được API bên ngoài, validate data, quản lý secrets

---

## 🗺️ Mental Map — 4 thư viện này nằm ở đâu?

```mermaid
graph TD
    A["👤 USER gửi request"] --> B["FastAPI Server (Tuần 5-6)"]
    B --> C["Pydantic — validate input"]
    C --> D["Business Logic"]
    D --> E["requests/httpx — gọi API ngoài"]
    E --> F["OpenAI / Anthropic / DB"]
    
    G["dotenv — quản lý API keys"] -.-> B
    G -.-> E

    style B fill:#009688,color:white
    style C fill:#FF9800,color:white
    style E fill:#2196F3,color:white
    style G fill:#9C27B0,color:white
```

```
  Hình dung: Bạn xây 1 AI API Service

  ┌──────────────────────────────────────────────────────┐
  │                    AI API Service                     │
  │                                                      │
  │  dotenv ──→ Load API keys từ .env file               │
  │                                                      │
  │  FastAPI ──→ Nhận HTTP request từ client              │
  │      │                                               │
  │  Pydantic ──→ Validate & parse input data             │
  │      │                                               │
  │  requests ──→ Gọi OpenAI/Anthropic API               │
  │      │                                               │
  │  Pydantic ──→ Validate & format output               │
  │      │                                               │
  │  FastAPI ──→ Trả response cho client                  │
  └──────────────────────────────────────────────────────┘

  Mỗi thư viện = 1 "CÔNG NHÂN" chuyên biệt!
```

---

## 📖 Mục lục

1. [HTTP Fundamentals — Hiểu trước khi code](#1-http-fundamentals--hiểu-trước-khi-code)
2. [requests & httpx — Gọi API bên ngoài](#2-requests--httpx--gọi-api-bên-ngoài)
3. [dotenv — Quản lý secrets an toàn](#3-dotenv--quản-lý-secrets-an-toàn)
4. [Pydantic — Data Validation tự động](#4-pydantic--data-validation-tự-động)
5. [FastAPI — Xây REST API hiện đại](#5-fastapi--xây-rest-api-hiện-đại)
6. [Project tổng hợp: AI Proxy API](#6-project-tổng-hợp-ai-proxy-api)

---

# 1. HTTP Fundamentals — Hiểu trước khi code

> 🧱 **Pattern: First Principles — API = giao tiếp qua HTTP**

### HTTP = Ngôn ngữ của Internet

```
  🔍 5 Whys: Tại sao phải hiểu HTTP?

  Q1: Tại sao AI Engineer cần biết HTTP?
  A1: Vì MỌI LLM API (OpenAI, Anthropic...) giao tiếp qua HTTP!

  Q2: HTTP hoạt động thế nào?
  A2: Client GỬI request → Server TRẢ response. Thế thôi!

  Q3: Request gồm gì?
  A3: Method (GET/POST) + URL + Headers + Body

  Q4: Response gồm gì?
  A4: Status Code (200/404/500) + Headers + Body (data)

  Q5: Tại sao cần biết chi tiết?
  A5: Debug API lỗi = PHẢI đọc được status code, headers, body!
```

```
  HTTP Request/Response:

  CLIENT                                         SERVER
    │                                               │
    │ ──── HTTP Request ──────────────────────────→  │
    │  POST /v1/chat/completions                    │
    │  Host: api.openai.com                          │
    │  Authorization: Bearer sk-abc123               │
    │  Content-Type: application/json                │
    │  Body: {"model": "gpt-4", "messages": [...]}   │
    │                                               │
    │ ←──── HTTP Response ────────────────────────   │
    │  200 OK                                       │
    │  Content-Type: application/json                │
    │  Body: {"choices": [...], "usage": {...}}       │
    │                                               │
```

### HTTP Methods — Hành động bạn muốn làm

```
  ┌────────┬──────────────────────┬────────────────────┐
  │ Method │ Mục đích             │ Ví dụ AI           │
  ├────────┼──────────────────────┼────────────────────┤
  │ GET    │ LẤY dữ liệu         │ Lấy list models    │
  │ POST   │ TẠO / GỬI dữ liệu   │ Gửi prompt → LLM  │
  │ PUT    │ CẬP NHẬT toàn bộ    │ Update config      │
  │ PATCH  │ CẬP NHẬT 1 phần     │ Sửa temperature    │
  │ DELETE │ XÓA                  │ Xóa fine-tuned model│
  └────────┴──────────────────────┴────────────────────┘

  90% công việc AI Engineer = GET + POST!
```

### Status Codes — Server "trả lời" bạn

```
  ┌─────┬──────────────────┬──────────────────────────┐
  │ Code│ Nghĩa            │ Khi nào gặp?             │
  ├─────┼──────────────────┼──────────────────────────┤
  │ 200 │ OK               │ Thành công!              │
  │ 201 │ Created          │ Tạo mới thành công       │
  │ 400 │ Bad Request      │ Gửi sai format           │
  │ 401 │ Unauthorized     │ API key sai/hết hạn!     │
  │ 403 │ Forbidden        │ Không có quyền           │
  │ 404 │ Not Found        │ URL sai                  │
  │ 422 │ Unprocessable    │ Validation lỗi           │
  │ 429 │ Too Many Requests│ RATE LIMITED! (gặp NHIỀU)│
  │ 500 │ Server Error     │ Server bên kia lỗi       │
  └─────┴──────────────────┴──────────────────────────┘

  ⚠️ 429 = gặp RẤT THƯỜNG khi dùng LLM API!
     → Cần: retry logic + exponential backoff!
```

---

# 2. requests & httpx — Gọi API bên ngoài

> 🔄 **Pattern: Contextual History — requests là thư viện Python được download nhiều nhất!**

### Lịch sử

```
  Trước requests (2011):
    → Dùng urllib2 (built-in Python) → code DÀI, KHÓ ĐỌC!
    → 15 dòng code chỉ để gọi 1 GET request!

  requests ra đời (Kenneth Reitz, 2011):
    → "HTTP for Humans" — code ĐƠN GIẢN, ĐẸP!
    → 2 dòng = xong 1 API call!
    → 300 TRIỆU downloads/tháng!

  httpx ra đời (2019):
    → "requests nhưng có async!" — cần cho AI apps
    → API giống hệt requests → dễ chuyển đổi!
```

### requests — Cơ bản

```python
import requests

# ═══ GET — Lấy dữ liệu ═══

response = requests.get("https://api.github.com/users/torvalds")

print(response.status_code)    # 200
print(response.headers)        # {'Content-Type': 'application/json', ...}
print(response.json())         # {'login': 'torvalds', 'name': 'Linus Torvalds', ...}

# ═══ POST — Gửi dữ liệu ═══

response = requests.post(
    "https://api.openai.com/v1/chat/completions",
    headers={
        "Authorization": "Bearer sk-abc123",
        "Content-Type": "application/json",
    },
    json={                     # json= tự set Content-Type + serialize!
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": "Hello!"}
        ],
        "temperature": 0.7,
    },
    timeout=30,                # Timeout sau 30s!
)

if response.status_code == 200:
    data = response.json()
    answer = data["choices"][0]["message"]["content"]
    print(answer)
else:
    print(f"Lỗi: {response.status_code} - {response.text}")
```

### Giải thích chi tiết

```
  requests.post(url, headers=..., json=..., timeout=...)

  url:     Địa chỉ API (string)
  headers: Metadata gửi kèm
    → Authorization: API key
    → Content-Type: format data (json, form, xml...)
  json:    Body data — tự chuyển dict → JSON string!
    → Khác data=: dùng data= cho form data
  timeout: Chờ tối đa bao lâu (giây)
    → LUÔN đặt timeout! Không có → chờ VÔ HẠN nếu server treo!

  response object:
    .status_code → 200, 401, 429...
    .json()      → parse body thành dict
    .text        → body dạng string (nếu không phải JSON)
    .headers     → response headers
    .raise_for_status() → raise exception nếu 4xx/5xx
```

### Error Handling thực tế

```python
import requests
import time

def call_api_safe(url, payload, api_key, max_retries=3):
    """Gọi API với retry + exponential backoff"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=30,
            )

            # Thành công!
            if response.status_code == 200:
                return response.json()

            # Rate limited → chờ rồi thử lại
            if response.status_code == 429:
                wait = 2 ** attempt    # 1s, 2s, 4s (exponential backoff)
                print(f"⏳ Rate limited! Chờ {wait}s...")
                time.sleep(wait)
                continue

            # Lỗi khác
            response.raise_for_status()

        except requests.Timeout:
            print(f"⏰ Timeout lần {attempt + 1}/{max_retries}")

        except requests.ConnectionError:
            print(f"🔌 Mất kết nối lần {attempt + 1}/{max_retries}")

    raise Exception(f"❌ Thất bại sau {max_retries} lần!")
```

### httpx — requests nhưng có async! ⭐

```python
import httpx
import asyncio

# ═══ Sync (giống hệt requests!) ═══
response = httpx.get("https://api.github.com/users/torvalds")
print(response.json())

# ═══ Async — GỌI SONG SONG! ═══
async def fetch_multiple():
    async with httpx.AsyncClient() as client:
        # Gửi 3 requests CÙNG LÚC!
        tasks = [
            client.get("https://api.github.com/users/torvalds"),
            client.get("https://api.github.com/users/gvanrossum"),
            client.get("https://api.github.com/users/kennethreitz"),
        ]
        responses = await asyncio.gather(*tasks)

    for r in responses:
        data = r.json()
        print(f"{data['login']}: {data.get('name', 'N/A')}")

asyncio.run(fetch_multiple())
# → 3 requests cùng lúc = nhanh gấp 3!
```

```
  📐 Trade-off: requests vs httpx

  ┌───────────┬──────────────────┬──────────────────┐
  │           │ requests         │ httpx            │
  ├───────────┼──────────────────┼──────────────────┤
  │ Async     │ ❌ Không         │ ✅ Có!           │
  │ HTTP/2    │ ❌ Không         │ ✅ Có!           │
  │ API       │ Quen thuộc       │ Gần giống        │
  │ Streaming │ Cơ bản           │ ✅ Tốt hơn       │
  │ Phổ biến  │ ⭐⭐⭐⭐⭐      │ ⭐⭐⭐⭐         │
  │ AI rec    │ Dùng cho script  │ Dùng cho API ✅  │
  └───────────┴──────────────────┴──────────────────┘

  → Script đơn giản: requests (quen, dễ)
  → AI API service: httpx (async, HTTP/2)
```

---

# 3. dotenv — Quản lý secrets an toàn

> 🧱 **Pattern: First Principles — API keys KHÔNG BAO GIỜ đưa vào code!**

### Vấn đề: Hardcode secrets = THẢM HỌA!

```
  🔍 5 Whys: Tại sao cần dotenv?

  Q1: Tại sao không hardcode API key trong code?
  A1: Vì push lên GitHub = AI BẤT KỲ có thể lấy key của bạn!

  Q2: Hậu quả là gì?
  A2: Key OpenAI bị lộ → ai đó dùng gọi API → BẠN trả tiền!
      → Có người mất $10,000+ trong 1 đêm vì leak API key!

  Q3: Ngoài bảo mật, còn lý do nào khác?
  A3: Mỗi môi trường (dev, staging, prod) cần KEY KHÁC NHAU!
      → Hardcode = phải SỬA CODE mỗi lần deploy!

  Q4: Biến môi trường (env var) giải quyết thế nào?
  A4: Key lưu NGOÀI code (trong hệ thống) → code KHÔNG chứa secret!

  Q5: dotenv giải quyết gì thêm?
  A5: Env var phải set thủ công → dotenv TỰ ĐỘNG đọc từ file .env!
```

```python
# ❌ TUYỆT ĐỐI ĐỪNG LÀM NÀY!
api_key = "sk-abc123xyz789..."    # 💀 LEAK KHI PUSH GIT!

# ✅ CÁCH ĐÚNG: dotenv
```

### Setup dotenv

```bash
# 1. Cài đặt
pip install python-dotenv

# 2. Tạo file .env (ở thư mục gốc project)
cat > .env << 'EOF'
OPENAI_API_KEY=sk-abc123xyz789
ANTHROPIC_API_KEY=sk-ant-abc123
DATABASE_URL=postgresql://user:pass@localhost/mydb
DEBUG=true
MAX_TOKENS=1000
EOF

# 3. Thêm .env vào .gitignore — QUAN TRỌNG!
echo ".env" >> .gitignore
```

```python
# ═══ Dùng dotenv ═══

import os
from dotenv import load_dotenv

# Load biến từ .env vào environment
load_dotenv()  # Tìm file .env tự động!

# Đọc biến
api_key = os.getenv("OPENAI_API_KEY")
debug = os.getenv("DEBUG", "false")        # "false" = default nếu không có
max_tokens = int(os.getenv("MAX_TOKENS", "500"))

print(api_key)      # "sk-abc123xyz789"
print(debug)         # "true"
print(max_tokens)    # 1000
```

### Pattern: Config class với Pydantic

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Tự đọc từ .env + validate!"""
    openai_api_key: str
    anthropic_api_key: str = ""        # Optional, default ""
    debug: bool = False
    max_tokens: int = 1000
    temperature: float = 0.7

    class Config:
        env_file = ".env"              # Đọc từ file nào

# Dùng:
settings = Settings()                  # Tự load + validate!
print(settings.openai_api_key)         # "sk-abc123xyz789"
print(settings.debug)                  # True (tự chuyển "true" → bool!)
print(settings.max_tokens)             # 1000 (tự chuyển "1000" → int!)

# ⚠️ Nếu thiếu OPENAI_API_KEY trong .env → ValidationError ngay!
```

```
  📐 BEST PRACTICES cho secrets:

  ✅ DOs:
    → .env file cho LOCAL development
    → .gitignore chứa .env
    → Tạo .env.example (không có giá trị) để guide team
    → Production: dùng cloud secrets (AWS Secrets Manager, Vault)

  ❌ DON'Ts:
    → KHÔNG hardcode trong source code
    → KHÔNG commit .env lên Git
    → KHÔNG log/print API keys
    → KHÔNG share qua chat/email
```

---

# 4. Pydantic — Data Validation tự động

> 🔧 **Pattern: Reverse Engineering — Hiểu Pydantic bằng cách xây validation thủ công trước!**

### Vấn đề: Data validation KHÔNG CÓ Pydantic

```python
# ❌ Validation THỦCÔNG — code DÀI, DỄ THIẾU, KHÓ MAINTAIN!

def create_user(data: dict):
    # Kiểm tra field tồn tại
    if "name" not in data:
        raise ValueError("Thiếu field 'name'!")
    if "age" not in data:
        raise ValueError("Thiếu field 'age'!")
    if "email" not in data:
        raise ValueError("Thiếu field 'email'!")

    # Kiểm tra type
    if not isinstance(data["name"], str):
        raise TypeError("name phải là string!")
    if not isinstance(data["age"], int):
        raise TypeError("age phải là int!")

    # Kiểm tra giá trị
    if len(data["name"]) < 1:
        raise ValueError("name không được rỗng!")
    if data["age"] < 0 or data["age"] > 150:
        raise ValueError("age phải từ 0-150!")
    if "@" not in data["email"]:
        raise ValueError("email không hợp lệ!")

    return data

# → 20+ dòng code validation cho 3 fields!
# → Thêm 1 field = thêm 5-10 dòng!
# → DỄ QUÊN, DỄ SAI, KHÔNG AI MUỐN VIẾT!
```

### ✅ Với Pydantic — 10 dòng thay 30 dòng!

```python
from pydantic import BaseModel, Field, EmailStr

class User(BaseModel):
    name: str = Field(min_length=1)
    age: int = Field(ge=0, le=150)      # ge=greater equal, le=less equal
    email: EmailStr                      # Tự validate format email!

# ✅ Valid
user = User(name="An", age=25, email="an@mail.com")
print(user.name)       # "An"
print(user.model_dump())  # {'name': 'An', 'age': 25, 'email': 'an@mail.com'}

# ❌ Invalid — Pydantic BẮT LỖI tự động!
try:
    bad = User(name="", age=200, email="not-email")
except Exception as e:
    print(e)
    # 3 errors:
    # name: String should have at least 1 character
    # age: Input should be less than or equal to 150
    # email: value is not a valid email address
```

### Giải thích Pydantic chi tiết

```
  Pydantic hoạt động thế nào? (First Principles)

  1. Bạn KHAI BÁO type hints trên class
  2. Pydantic SINH CODE validation TỪ type hints
  3. Khi tạo object → Pydantic CHẠY validation tự động
  4. Sai → raise ValidationError (chi tiết!)
  5. Đúng → trả về object đã CHUẨN HÓA

  ┌───────────────────────────────────────┐
  │  User(name="An", age="25")           │ ← Input (age là STRING!)
  │            │                          │
  │  Pydantic: "age khai báo int..."     │
  │            │                          │
  │  Coercion: "25" → 25                 │ ← Tự chuyển string → int!
  │            │                          │
  │  Validate: 0 <= 25 <= 150 ✅          │
  │            │                          │
  │  user.age = 25 (int!)                │ ← Output đã chuẩn hóa!
  └───────────────────────────────────────┘

  ⚠️ TYPE COERCION: Pydantic TỰ CHUYỂN ĐỔI type nếu có thể!
     "25" → 25 (str → int) ✅
     "abc" → int → ❌ FAIL!
```

### Pydantic nâng cao — Patterns dùng trong AI

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum

# ═══ 1. Enum cho giá trị cố định ═══

class ModelName(str, Enum):
    GPT4 = "gpt-4"
    GPT35 = "gpt-3.5-turbo"
    CLAUDE = "claude-3-opus"

# ═══ 2. Nested Models ═══

class Message(BaseModel):
    role: str = Field(pattern="^(system|user|assistant)$")
    content: str = Field(min_length=1)

class ChatRequest(BaseModel):
    model: ModelName = ModelName.GPT4
    messages: list[Message]            # List of Pydantic models!
    temperature: float = Field(ge=0, le=2, default=0.7)
    max_tokens: Optional[int] = None
    stream: bool = False

    # ═══ 3. Custom Validator ═══
    @field_validator("messages")
    @classmethod
    def must_have_messages(cls, v):
        if len(v) == 0:
            raise ValueError("Phải có ít nhất 1 message!")
        return v

# Dùng:
request = ChatRequest(
    messages=[
        Message(role="system", content="You are helpful."),
        Message(role="user", content="Hello!"),
    ]
)
print(request.model_dump_json(indent=2))
# {
#   "model": "gpt-4",
#   "messages": [
#     {"role": "system", "content": "You are helpful."},
#     {"role": "user", "content": "Hello!"}
#   ],
#   "temperature": 0.7,
#   "max_tokens": null,
#   "stream": false
# }
```

```python
# ═══ 4. Response Models — Parse API output ═══

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

    @property
    def cost_usd(self) -> float:
        """Tính chi phí (GPT-4 pricing)"""
        return (self.prompt_tokens * 0.03 + self.completion_tokens * 0.06) / 1000

class Choice(BaseModel):
    index: int
    message: Message
    finish_reason: str

class ChatResponse(BaseModel):
    id: str
    choices: list[Choice]
    usage: Usage

# Parse JSON response từ API:
raw_json = {
    "id": "chatcmpl-123",
    "choices": [{"index": 0, "message": {"role": "assistant", "content": "Hi!"}, "finish_reason": "stop"}],
    "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
}

response = ChatResponse(**raw_json)
print(response.choices[0].message.content)  # "Hi!"
print(f"Cost: ${response.usage.cost_usd:.4f}")  # "Cost: $0.0006"
```

---

# 5. FastAPI — Xây REST API hiện đại

> 🔄 **Pattern: Contextual History — Từ CGI đến FastAPI: 30 năm tiến hóa**

### Lịch sử Web Frameworks Python

```
  1995: CGI Scripts     → 1 request = 1 process = CHẬM!
  2003: Django          → Full framework, "batteries included"
                         → Nặng cho microservices!
  2010: Flask           → Micro framework, nhẹ, linh hoạt
                         → Không có validation, không async!
  2018: FastAPI 🚀      → Flask + Pydantic + Async + Auto docs!
                         → SINH RA cho AI APIs!

  🔍 5 Whys: Tại sao FastAPI cho AI?

  Q1: Tại sao AI dùng FastAPI mà không dùng Django/Flask?
  A1: FastAPI có ASYNC built-in → gọi LLM API song song!

  Q2: Tại sao async quan trọng cho AI API?
  A2: Mỗi LLM call mất 2-10s → sync = 1 user phải chờ user trước!

  Q3: Flask không async được sao?
  A3: Flask = sync by default, thêm async = phức tạp!
      FastAPI = async by default, đơn giản!

  Q4: FastAPI có gì ngoài async?
  A4: AUTO VALIDATION (Pydantic) + AUTO DOCS (Swagger/OpenAPI)!
      → Viết code = tự có docs + validation FREE!

  Q5: Vậy FastAPI có nhược điểm gì?
  A5: Nhỏ hơn Django (ít built-in), community nhỏ hơn Flask
      → Trade-off: ĐÚNG MỤC ĐÍCH cho AI microservices!
```

### FastAPI đầu tiên — 5 phút setup!

```python
# main.py
from fastapi import FastAPI

# Tạo app
app = FastAPI(
    title="My AI API",
    description="API cho AI services",
    version="1.0.0",
)

# Route đầu tiên — GET endpoint
@app.get("/")
def read_root():
    return {"message": "Hello from AI API! 🤖"}

# Route với parameter
@app.get("/greet/{name}")
def greet(name: str, lang: str = "vi"):
    """
    name: path parameter (BẮT BUỘC)
    lang: query parameter (TÙY CHỌN, default="vi")
    """
    greetings = {"vi": "Xin chào", "en": "Hello", "ja": "こんにちは"}
    greeting = greetings.get(lang, "Hello")
    return {"message": f"{greeting}, {name}!"}
```

```bash
# Chạy server:
pip install fastapi uvicorn

uvicorn main:app --reload
# → Server chạy tại http://127.0.0.1:8000
# → Auto docs tại http://127.0.0.1:8000/docs  ← Swagger UI tự động!
```

```
  Giải thích:
    uvicorn       = ASGI server (chạy async Python apps)
    main:app      = file main.py, object app
    --reload      = tự restart khi sửa code (dev mode)

  FastAPI tự tạo:
    /docs      → Swagger UI (test API trực tiếp trên browser!)
    /redoc     → ReDoc (docs đẹp hơn)
    /openapi.json → OpenAPI schema (machine readable)
```

### POST endpoint với Pydantic validation

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI()

# ═══ Request & Response Models ═══

class ChatRequest(BaseModel):
    """Pydantic model = tự validate input!"""
    prompt: str = Field(min_length=1, max_length=10000)
    model: str = "gpt-4"
    temperature: float = Field(ge=0, le=2, default=0.7)
    max_tokens: Optional[int] = Field(ge=1, le=4096, default=None)

class ChatResponse(BaseModel):
    answer: str
    model: str
    tokens_used: int

# ═══ POST endpoint ═══

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Nhận prompt, trả về AI response.

    FastAPI tự động:
    1. Parse JSON body → ChatRequest object
    2. Validate TẤT CẢ fields (type, range, length...)
    3. Trả 422 nếu validation fail → BẠN KHÔNG CẦN CHECK!
    """
    # Business logic
    if request.prompt.strip() == "":
        raise HTTPException(status_code=400, detail="Prompt rỗng!")

    # Giả lập gọi LLM (thực tế dùng OpenAI SDK)
    answer = f"[AI Response to: {request.prompt[:50]}...]"

    return ChatResponse(
        answer=answer,
        model=request.model,
        tokens_used=42,
    )
```

### Giải thích flow chi tiết

```
  Client POST /chat:
  {
    "prompt": "Python là gì?",
    "temperature": 0.5
  }

  FastAPI nhận request:
  ┌─────────────────────────────────────────────┐
  │ 1. Parse JSON body                          │
  │    → {"prompt": "Python là gì?", ...}       │
  │                                             │
  │ 2. Pydantic Validation                      │
  │    prompt: "Python là gì?" ← str, len >= 1 ✅│
  │    model: "gpt-4" ← dùng default ✅         │
  │    temperature: 0.5 ← 0 <= 0.5 <= 2 ✅      │
  │    max_tokens: None ← Optional, OK ✅        │
  │                                             │
  │ 3. Tạo ChatRequest object                   │
  │    request.prompt = "Python là gì?"         │
  │    request.temperature = 0.5                │
  │                                             │
  │ 4. Gọi function chat(request)               │
  │                                             │
  │ 5. Return ChatResponse → serialize JSON     │
  └─────────────────────────────────────────────┘

  Nếu client gửi SAI:
  { "prompt": "", "temperature": 5.0 }
  → FastAPI tự trả 422:
  {
    "detail": [
      {"field": "prompt", "msg": "min_length 1"},
      {"field": "temperature", "msg": "le 2"}
    ]
  }
  → BẠN KHÔNG VIẾT DÒNG VALIDATION NÀO!
```

### Async endpoint — Gọi LLM thật

```python
from fastapi import FastAPI
from pydantic import BaseModel
import httpx

app = FastAPI()

class AskRequest(BaseModel):
    question: str
    model: str = "gpt-4"

class AskResponse(BaseModel):
    answer: str
    tokens: int

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """Gọi OpenAI API bất đồng bộ"""
    import os

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"},
            json={
                "model": request.model,
                "messages": [{"role": "user", "content": request.question}],
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

    return AskResponse(
        answer=data["choices"][0]["message"]["content"],
        tokens=data["usage"]["total_tokens"],
    )
```

### Middleware, CORS, Error Handling

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

app = FastAPI()

# ═══ CORS — Cho phép frontend gọi API ═══
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══ Middleware: đo thời gian mỗi request ═══
@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    return response

# ═══ Global Error Handler ═══
@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detail": "Lỗi server!"},
    )
```

---

# 6. Project tổng hợp: AI Proxy API

> 🔧 **Pattern: Reverse Engineering — Xây 1 API server hoàn chỉnh!**

```python
# ═══ project structure ═══
# ai_proxy/
# ├── .env                  ← secrets
# ├── .env.example           ← template (commit được)
# ├── main.py                ← FastAPI app
# ├── config.py              ← Settings
# ├── models.py              ← Pydantic models
# └── requirements.txt       ← dependencies

# ─── .env ───
# OPENAI_API_KEY=sk-abc123
# MAX_RETRIES=3

# ─── .env.example ───
# OPENAI_API_KEY=your-key-here
# MAX_RETRIES=3
```

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    max_retries: int = 3
    default_model: str = "gpt-4"
    default_temperature: float = 0.7

    class Config:
        env_file = ".env"

settings = Settings()
```

```python
# models.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class ModelName(str, Enum):
    GPT4 = "gpt-4"
    GPT35 = "gpt-3.5-turbo"

class ChatRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=10000)
    model: ModelName = ModelName.GPT4
    temperature: float = Field(ge=0, le=2, default=0.7)
    max_tokens: Optional[int] = Field(ge=1, le=4096, default=None)

class ChatResponse(BaseModel):
    answer: str
    model: str
    tokens_used: int
    cost_usd: float

class HealthResponse(BaseModel):
    status: str
    version: str
```

```python
# main.py
from fastapi import FastAPI, HTTPException
import httpx
import time

from config import settings
from models import ChatRequest, ChatResponse, HealthResponse

app = FastAPI(title="AI Proxy API", version="1.0.0")

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", version="1.0.0")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Proxy request đến OpenAI với retry logic"""

    for attempt in range(settings.max_retries):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openai_api_key}",
                    },
                    json={
                        "model": request.model.value,
                        "messages": [{"role": "user", "content": request.prompt}],
                        "temperature": request.temperature,
                        **({"max_tokens": request.max_tokens} if request.max_tokens else {}),
                    },
                    timeout=30,
                )

            if resp.status_code == 429:
                wait = 2 ** attempt
                await asyncio.sleep(wait)
                continue

            resp.raise_for_status()
            data = resp.json()

            usage = data["usage"]
            cost = (usage["prompt_tokens"] * 0.03 + usage["completion_tokens"] * 0.06) / 1000

            return ChatResponse(
                answer=data["choices"][0]["message"]["content"],
                model=request.model.value,
                tokens_used=usage["total_tokens"],
                cost_usd=round(cost, 6),
            )

        except httpx.TimeoutException:
            if attempt == settings.max_retries - 1:
                raise HTTPException(504, "OpenAI API timeout!")

    raise HTTPException(429, "Rate limited after retries!")
```

---

## 📐 Tổng kết Mental Map

```mermaid
graph LR
    A["🛠️ Thư Viện Quan Trọng"] --> B["requests/httpx"]
    A --> C["dotenv"]
    A --> D["Pydantic"]
    A --> E["FastAPI"]

    B --> B1["GET/POST"]
    B --> B2["Headers, Auth"]
    B --> B3["Retry + Backoff"]
    B --> B4["httpx.AsyncClient"]

    C --> C1[".env file"]
    C --> C2[".gitignore!"]
    C --> C3["pydantic-settings"]

    D --> D1["BaseModel"]
    D --> D2["Field validators"]
    D --> D3["Nested models"]
    D --> D4["JSON serialize"]

    E --> E1["@app.get/post"]
    E --> E2["Auto validation"]
    E --> E3["Auto docs /docs"]
    E --> E4["Async endpoints"]

    style A fill:#009688,color:white
    style E fill:#FF5722,color:white
```

```
  ┌────────────────────────────────────────────────────────┐
  │  Tuần 5-6 Checklist:                                   │
  │                                                        │
  │  HTTP:                                                 │
  │  □ GET vs POST — khi nào dùng gì                      │
  │  □ Status codes: 200, 401, 429, 500                    │
  │  □ Headers: Authorization, Content-Type                │
  │                                                        │
  │  requests/httpx:                                       │
  │  □ requests.get/post — sync API calls                 │
  │  □ httpx.AsyncClient — async API calls                │
  │  □ Error handling + retry + exponential backoff        │
  │  □ timeout — LUÔN ĐẶT!                                │
  │                                                        │
  │  dotenv:                                               │
  │  □ .env file + .gitignore                             │
  │  □ load_dotenv() + os.getenv()                        │
  │  □ pydantic-settings cho production                   │
  │                                                        │
  │  Pydantic:                                             │
  │  □ BaseModel — khai báo bằng type hints               │
  │  □ Field(ge=, le=, min_length=...) — constraints       │
  │  □ Nested models — model trong model                   │
  │  □ model_dump() / model_dump_json() — serialize       │
  │                                                        │
  │  FastAPI:                                              │
  │  □ @app.get / @app.post — route endpoints             │
  │  □ Request body = Pydantic model — auto validation    │
  │  □ response_model — auto serialize output              │
  │  □ /docs — auto Swagger UI                            │
  │  □ async def — cho I/O bound operations               │
  │  □ HTTPException — trả lỗi chuẩn                     │
  └────────────────────────────────────────────────────────┘
```

---

## 📚 Tài liệu đọc thêm

```
  📖 Docs (QUAN TRỌNG NHẤT):
    fastapi.tiangolo.com — FastAPI official docs (CỰC TỐT!)
    docs.pydantic.dev — Pydantic v2 docs
    www.python-httpx.org — httpx docs

  🎥 Video:
    "FastAPI Full Course" — freeCodeCamp (YouTube, free)
    "Pydantic V2 Tutorial" — ArjanCodes (YouTube)
    "Building AI APIs with FastAPI" — various

  📖 Sách:
    "Building Data Science Applications with FastAPI" — François Voron

  🏋️ Luyện tập:
    Xây REST API quản lý todo list (CRUD)
    Thêm authentication (API key middleware)
    Deploy lên Render/Railway (free hosting)
    Xây AI proxy như project ở trên!
```
