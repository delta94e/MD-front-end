# Stripe Interview Experience — Deep Dive

> 📅 2026-02-14 · ⏱ 22 phút đọc
>
> Payment Ledger (Idempotent Writes, Refunds, Currency Conversion),
> Rate Limiter (Sliding Window, Token Bucket, Leaky Bucket, Redis),
> Webhook Delivery System (Retry, Backoff, At-least-once, Dedup),
> Payment Reconciliation, Eventual Consistency
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Stripe Backend Engineer Interview

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Tổng quan quy trình phỏng vấn Stripe           |
| 2   | Payment Ledger — Idempotent Writes             |
| 3   | Payment Ledger — Refunds & Currency Conversion |
| 4   | Floating-Point Precision & Rounding            |
| 5   | Rate Limiter — Sliding Window                  |
| 6   | Rate Limiter — Token Bucket vs Leaky Bucket    |
| 7   | Rate Limiter — Redis & Distributed             |
| 8   | Webhook Delivery System — Architecture         |
| 9   | Webhook — Retry, Backoff, Deduplication        |
| 10  | Webhook — Signature & Schema Versioning        |
| 11  | Payment Reconciliation & Eventual Consistency  |
| 12  | Behavioral — Decisive Under Ambiguity          |
| 13  | Tóm tắt phỏng vấn                              |

---

## §1. Tổng quan quy trình phỏng vấn Stripe

```
STRIPE INTERVIEW — 4 VÒNG:
═══════════════════════════════════════════════════════════════

  ① ONLINE ASSESSMENT (OA):
  → API Design + Data Consistency!
  → Implement PAYMENT LEDGER:
    • Idempotent writes (ghi trùng = kết quả GIỐNG!)
    • Refunds (hoàn tiền!)
    • Currency conversion (chuyển đổi tiền tệ!)
    • Strong consistency guarantees!
  → Floating-point precision, rounding rules!
  → Replay-safe request handling!

  ② TECHNICAL INTERVIEW 1:
  → Data Structures + Systems Fundamentals!
  → Design IN-MEMORY RATE LIMITER:
    • Sliding window!
    • Distributed enforcement!
    • Per-customer overrides!
  → Token bucket vs Leaky bucket!
  → Redis vs local memory!
  → Concurrency + Atomicity!

  ③ SYSTEM DESIGN:
  → Design WEBHOOK DELIVERY SYSTEM:
    • Retry semantics, exponential backoff!
    • At-least-once delivery!
    • Deduplication strategies!
    • Signature verification!
    • Schema versioning!

  ④ BEHAVIORAL + DEEP DIVE:
  → Walk through past projects!
  → Payment reconciliation system!
  → Eventual consistency trade-offs!
  → ⚠️ FEEDBACK: "Be more DECISIVE under AMBIGUITY!"

  💡 KEY INSIGHT from candidate:
  → "Review WEB FUNDAMENTALS, not just regular programming!"
  → "They want NICHE KNOWLEDGE!"
```

---

## §2. Payment Ledger — Idempotent Writes

```
PAYMENT LEDGER — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  Ledger = SỔ CÁI ghi lại MỌI giao dịch tài chính!
  → Mỗi entry = 1 dòng: ai, bao nhiêu, khi nào, loại gì!
  → KHÔNG BAO GIỜ xóa hoặc sửa entry! (append-only!)
  → Hoàn tiền = THÊM entry mới (không xóa entry cũ!)

  IDEMPOTENCY — ĐỊNH NGHĨA:
  → Gửi CÙNG request NHIỀU LẦN → kết quả GIỐNG HỆT!
  → Tại sao cần? Network timeout → client retry!
  → Nếu KHÔNG idempotent: charge user 2 lần! ❌

  VÍ DỤ:
  Client gửi: "Charge $100 từ user_123"
  → Request 1: timeout (client KHÔNG biết thành/thất bại!)
  → Client retry: gửi CÙNG request!
  → Server PHẢI nhận ra: "À, request này đã xử lý rồi!"
  → → Trả lại KẾT QUẢ CŨ, KHÔNG charge lần 2!
```

```
IDEMPOTENCY KEY — CÁCH IMPLEMENT:
═══════════════════════════════════════════════════════════════

  ① CLIENT tạo IDEMPOTENCY KEY (unique per request!):
  → Header: Idempotency-Key: "uuid-abc-123"
  → Key do CLIENT tạo (UUID v4!)

  ② SERVER nhận request:
  → Kiểm tra key trong database/cache!
  → Nếu KEY ĐÃ TỒN TẠI:
    → Trả lại STORED RESPONSE! (không xử lý lại!)
  → Nếu KEY CHƯA TỒN TẠI:
    → Xử lý request → Lưu key + response → Trả kết quả!

  ③ KEY EXPIRY:
  → Keys hết hạn sau 24-48 giờ!
  → Tránh database phình to vô hạn!
```

```typescript
// ═══ PAYMENT LEDGER — IDEMPOTENT WRITES ═══

interface LedgerEntry {
  id: string;
  idempotencyKey: string;
  type: "charge" | "refund" | "transfer";
  amount: number; // Cent! KHÔNG dùng dollar!
  currency: string; // 'USD', 'VND', 'EUR'
  fromAccount: string;
  toAccount: string;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  metadata?: Record<string, string>;
}

class PaymentLedger {
  private entries: Map<string, LedgerEntry> = new Map();
  private idempotencyStore: Map<string, LedgerEntry> = new Map();

  // ═══ IDEMPOTENT WRITE ═══
  charge(request: {
    idempotencyKey: string;
    amount: number; // Cents!
    currency: string;
    fromAccount: string;
    toAccount: string;
  }): LedgerEntry {
    // ① Kiểm tra idempotency:
    const existing = this.idempotencyStore.get(request.idempotencyKey);
    if (existing) {
      // ĐÃ XỬ LÝ! Trả kết quả cũ!
      return existing;
    }

    // ② Validate:
    if (request.amount <= 0) throw new Error("Amount must be positive");
    if (!Number.isInteger(request.amount)) {
      throw new Error("Amount must be integer (cents)!");
    }

    // ③ Tạo ledger entry:
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      idempotencyKey: request.idempotencyKey,
      type: "charge",
      amount: request.amount,
      currency: request.currency,
      fromAccount: request.fromAccount,
      toAccount: request.toAccount,
      status: "completed",
      createdAt: new Date(),
    };

    // ④ Double-entry bookkeeping:
    // Debit from customer, Credit to merchant!
    this.entries.set(entry.id, entry);

    // ⑤ Lưu idempotency:
    this.idempotencyStore.set(request.idempotencyKey, entry);

    return entry;
  }
}
```

---

## §3. Payment Ledger — Refunds & Currency Conversion

```typescript
// ═══ REFUND — HOÀN TIỀN ═══

class PaymentLedger {
  // ... (charge method ở trên)

  refund(request: {
    idempotencyKey: string;
    originalChargeId: string;
    amount?: number; // Partial refund! Nếu undefined = full!
  }): LedgerEntry {
    // ① Idempotency check:
    const existing = this.idempotencyStore.get(request.idempotencyKey);
    if (existing) return existing;

    // ② Tìm charge gốc:
    const original = this.entries.get(request.originalChargeId);
    if (!original) throw new Error("Charge not found");
    if (original.type !== "charge") throw new Error("Not a charge");
    if (original.status !== "completed")
      throw new Error("Charge not completed");

    // ③ Tính refund amount:
    const refundAmount = request.amount ?? original.amount;

    // ④ Kiểm tra TỔNG refund không vượt charge:
    const previousRefunds = this.getRefundsForCharge(request.originalChargeId);
    const totalRefunded = previousRefunds.reduce((sum, r) => sum + r.amount, 0);

    if (totalRefunded + refundAmount > original.amount) {
      throw new Error("Refund exceeds original charge!");
    }

    // ⑤ Tạo REFUND entry (REVERSE direction!):
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      idempotencyKey: request.idempotencyKey,
      type: "refund",
      amount: refundAmount,
      currency: original.currency,
      fromAccount: original.toAccount, // REVERSE!
      toAccount: original.fromAccount, // REVERSE!
      status: "completed",
      createdAt: new Date(),
      metadata: { originalChargeId: request.originalChargeId },
    };

    this.entries.set(entry.id, entry);
    this.idempotencyStore.set(request.idempotencyKey, entry);

    return entry;
  }

  private getRefundsForCharge(chargeId: string): LedgerEntry[] {
    return [...this.entries.values()].filter(
      (e) => e.type === "refund" && e.metadata?.originalChargeId === chargeId,
    );
  }
}
```

```
CURRENCY CONVERSION:
═══════════════════════════════════════════════════════════════

  ⚠️ RULES:
  → Lưu trữ bằng SMALLEST UNIT (cent, xu, fen!)
  → 1 USD = 100 cents → lưu 100, KHÔNG lưu 1.00!
  → Tránh floating-point errors!

  CONVERSION FLOW:
  → fromAmount (cents) × exchangeRate → toAmount (cents)
  → Rounding: BANKER'S ROUNDING (round half to even!)
  → Luôn lưu CÙNG LÚC: fromAmount + toAmount + rate + timestamp!
  → Rate SNAPSHOT tại thời điểm giao dịch!
```

```typescript
// ═══ CURRENCY CONVERSION ═══

function convertCurrency(
  amountCents: number, // 1050 = $10.50
  rate: number, // 1.08 (EUR/USD)
  toCurrencyDecimals: number = 2,
): number {
  // ⚠️ KHÔNG dùng floating-point arithmetic trực tiếp!
  // Dùng integer arithmetic → rounding cuối cùng!

  const multiplier = Math.pow(10, toCurrencyDecimals);
  const rawResult = amountCents * rate;

  // Banker's Rounding (round half to even):
  return bankersRound(rawResult);
}

function bankersRound(value: number): number {
  // Nếu phần thập phân CHÍNH XÁC = 0.5:
  // → Round to EVEN number!
  // 2.5 → 2 (even!), 3.5 → 4 (even!), 4.5 → 4 (even!)

  const floor = Math.floor(value);
  const decimal = value - floor;

  if (Math.abs(decimal - 0.5) < Number.EPSILON) {
    // Exactly 0.5! Round to even!
    return floor % 2 === 0 ? floor : floor + 1;
  }

  return Math.round(value);
}

// VD: $10.50 USD → EUR (rate 0.92)
// 1050 × 0.92 = 966 cents = €9.66 ✅
```

---

## §4. Floating-Point Precision & Rounding

```
FLOATING-POINT — VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  JavaScript dùng IEEE 754 double-precision!
  → 0.1 + 0.2 = 0.30000000000000004 ❌
  → 0.1 * 3 = 0.30000000000000004 ❌

  TRONG FINTECH → SAI 1 XU = THẢM HỌA!
  → Hàng triệu transactions/ngày × sai 0.01 = HÀNG NGHÌN ĐÔ!

  GIẢI PHÁP:
  ┌────────────────────────────────────────────────────────┐
  │ ① DÙNG INTEGER (cents/xu!):                            │
  │ → $10.50 → lưu 1050 (integer!)                        │
  │ → Cộng trừ nhân chia đều CHÍNH XÁC!                   │
  │ → Chỉ convert sang dollar KHI HIỂN THỊ!               │
  │                                                        │
  │ ② DÙNG LIBRARY:                                        │
  │ → decimal.js, big.js, bignumber.js                     │
  │ → Tính toán CHÍNH XÁC với số thập phân!                │
  │                                                        │
  │ ③ BACKEND: Java BigDecimal, Python Decimal              │
  └────────────────────────────────────────────────────────┘

  ROUNDING RULES:
  ┌──────────────┬────────────────────────────────────────┐
  │ Method       │ Behavior                               │
  ├──────────────┼────────────────────────────────────────┤
  │ Round Up     │ 2.5 → 3, 3.5 → 4 (luôn lên!)         │
  │ Round Down   │ 2.5 → 2, 3.5 → 3 (luôn xuống!)       │
  │ Round Half   │ 2.5 → 3, 3.5 → 4 (JS Math.round!)    │
  │ Banker's     │ 2.5 → 2, 3.5 → 4 (round to EVEN!)    │
  └──────────────┴────────────────────────────────────────┘

  → BANKER'S ROUNDING: chuẩn trong tài chính!
  → Không bias lên/xuống → tổng hợp CHÍNH XÁC hơn!
```

---

## §5. Rate Limiter — Sliding Window

```
RATE LIMITER — TẠI SAO CẦN?
═══════════════════════════════════════════════════════════════

  → Chống DDoS / abuse!
  → Giới hạn: "Max 100 requests / phút / customer"!
  → Stripe API: different limits per endpoint + per customer!

  3 THUẬT TOÁN:
  ① Fixed Window
  ② Sliding Window Log
  ③ Sliding Window Counter
```

```
FIXED WINDOW:
═══════════════════════════════════════════════════════════════

  Chia thời gian thành CỬA SỔ CỐ ĐỊNH (VD: mỗi phút!):
  00:00-01:00 | 01:00-02:00 | 02:00-03:00

  ❌ VẤN ĐỀ BIÊN GIỚI (Boundary Problem!):
  Limit = 100 req/min

  00:00        00:30        01:00        01:30
    |           |             |           |
    |    50 req |  50 req     | 50 req    |
    |           |             |           |
    └───Window 1──┘ └───Window 2──┘

  → 00:30 - 01:30 = 100 requests trong 1 phút!
  → Nhưng cả 2 windows đều pass (50 < 100!)
  → ❌ BURST ở boundary!
```

```
SLIDING WINDOW LOG:
═══════════════════════════════════════════════════════════════

  Lưu TIMESTAMP của MỌI request!
  → Khi request mới đến: đếm requests trong [now - 60s, now]!
  → Nếu > limit → REJECT!

  ✅ Chính xác! Không boundary problem!
  ❌ TỐN BỘ NHỚ! Lưu mọi timestamp!
```

```
SLIDING WINDOW COUNTER (CÂN BẰNG!):
═══════════════════════════════════════════════════════════════

  Kết hợp Fixed Window + trọng số!

  Current window count = current_count
  Previous window count = prev_count
  Overlap ratio = (window_size - elapsed) / window_size

  Estimated count = prev_count × overlap + current_count

  VD: limit=100, window=60s
  Prev window: 80 requests
  Current window: 30 requests (elapsed: 15s)
  Overlap = (60-15)/60 = 0.75
  Estimated = 80 × 0.75 + 30 = 90 → ALLOW! (< 100)
```

```typescript
// ═══ SLIDING WINDOW LOG — IMPLEMENTATION ═══

class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map(); // key → timestamps
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowSeconds: number) {
    this.limit = limit;
    this.windowMs = windowSeconds * 1000;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Lấy timestamps của key:
    let timestamps = this.windows.get(key) || [];

    // Loại bỏ timestamps QUÁ CŨ:
    timestamps = timestamps.filter((t) => t > windowStart);

    // Kiểm tra limit:
    if (timestamps.length >= this.limit) {
      this.windows.set(key, timestamps);
      return false; // REJECTED!
    }

    // Thêm timestamp mới:
    timestamps.push(now);
    this.windows.set(key, timestamps);
    return true; // ALLOWED!
  }
}

// Per-customer overrides:
class CustomerRateLimiter {
  private defaultLimit = 100;
  private overrides: Map<string, number> = new Map();
  private limiter: Map<string, SlidingWindowRateLimiter> = new Map();

  setOverride(customerId: string, limit: number) {
    this.overrides.set(customerId, limit);
  }

  isAllowed(customerId: string): boolean {
    const limit = this.overrides.get(customerId) || this.defaultLimit;

    if (!this.limiter.has(customerId)) {
      this.limiter.set(customerId, new SlidingWindowRateLimiter(limit, 60));
    }

    return this.limiter.get(customerId)!.isAllowed(customerId);
  }
}
```

---

## §6. Rate Limiter — Token Bucket vs Leaky Bucket

```
TOKEN BUCKET vs LEAKY BUCKET:
═══════════════════════════════════════════════════════════════

  TOKEN BUCKET:
  ┌────────────────────────────────────────────────────────┐
  │ → Xô chứa TOKENS (VD: max 100 tokens!)                │
  │ → Tokens được THÊM VÀO đều đặn (VD: 10/s!)           │
  │ → Mỗi request TIÊU 1 token!                            │
  │ → Hết tokens → REJECT!                                 │
  │ → Cho phép BURST! (nếu xô đầy = 100 requests 1 lúc!) │
  │                                                        │
  │  Tokens: ●●●●●●●●●● (10 tokens)                       │
  │  Request đến: tiêu 1 token → ●●●●●●●●● (9)            │
  │  Refill rate: +10 tokens/giây                          │
  └────────────────────────────────────────────────────────┘

  LEAKY BUCKET:
  ┌────────────────────────────────────────────────────────┐
  │ → Xô chứa requests (queue!)                            │
  │ → Requests RỈ RA (process) ĐỀU ĐẶN!                   │
  │ → Xô đầy → REJECT requests mới!                       │
  │ → KHÔNG cho phép burst! Luôn ĐỀU ĐẶN!                │
  │                                                        │
  │  Queue: [req1][req2][req3]                              │
  │  Process rate: 10 req/s (đều đặn!)                     │
  │  Xô đầy (100 queue) → reject!                          │
  └────────────────────────────────────────────────────────┘

  ┌───────────────┬────────────────┬────────────────────┐
  │               │ Token Bucket   │ Leaky Bucket       │
  ├───────────────┼────────────────┼────────────────────┤
  │ Burst         │ ✅ Cho phép!   │ ❌ Không!          │
  │ Steady rate   │ Trung bình!    │ ✅ Rất đều!        │
  │ Implementation│ Đơn giản!      │ Queue phức tạp hơn!│
  │ Use case      │ API rate limit │ Traffic shaping!   │
  │ Stripe dùng?  │ ✅ (phổ biến!) │ Ít hơn!           │
  └───────────────┴────────────────┴────────────────────┘
```

```typescript
// ═══ TOKEN BUCKET — IMPLEMENTATION ═══

class TokenBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens/second
  private lastRefill: number;

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens; // Bắt đầu ĐẦY!
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true; // ALLOWED!
    }

    return false; // REJECTED!
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// VD: Max 100 tokens, refill 10/s
const bucket = new TokenBucket(100, 10);
// → Burst: 100 requests 1 lúc OK!
// → Sau đó: 10 req/s đều đặn!
```

---

## §7. Rate Limiter — Redis & Distributed

```
DISTRIBUTED RATE LIMITING:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Nhiều server instances!
  → Local memory: mỗi server đếm RIÊNG!
  → Limit 100 → 5 servers → thực tế 500! ❌

  GIẢI PHÁP: REDIS centralized counter!
  → TẤT CẢ servers đếm CHUNG trên Redis!
  → Redis = single-threaded → ATOMIC operations!
  → Lua script: đảm bảo GET + INCREMENT + EXPIRE atomically!

  FAILURE MODES:
  ┌────────────────────────────────────────────────────────┐
  │ Redis down → WHAT TO DO?                               │
  │                                                        │
  │ Option 1: FAIL OPEN (cho pass tất cả!)                │
  │ → Risk: no rate limiting! DDoS possible!               │
  │ → Nhưng: service vẫn chạy!                            │
  │                                                        │
  │ Option 2: FAIL CLOSED (reject tất cả!)                │
  │ → Risk: service DOWN cho mọi user!                    │
  │ → Nhưng: an toàn hơn!                                 │
  │                                                        │
  │ Option 3: FALLBACK to local memory!                    │
  │ → Graceful degradation!                                │
  │ → Limit = total_limit / num_instances (chia đều!)      │
  │ → RECOMMENDED!                                         │
  └────────────────────────────────────────────────────────┘
```

```lua
-- ═══ REDIS LUA SCRIPT — ATOMIC RATE LIMITING ═══

-- KEYS[1] = rate limit key (VD: "ratelimit:customer_123")
-- ARGV[1] = limit (100)
-- ARGV[2] = window in seconds (60)

local current = redis.call('INCR', KEYS[1])

-- Nếu là request ĐẦU TIÊN → set TTL!
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end

-- Kiểm tra limit:
if current > tonumber(ARGV[1]) then
    return 0  -- REJECTED!
end

return 1  -- ALLOWED!

-- ⚠️ TẠI SAO LUA SCRIPT?
-- → Redis execute Lua ATOMICALLY!
-- → Không race condition giữa GET và INCR!
-- → Multiple commands = 1 atomic operation!
```

---

## §8. Webhook Delivery System — Architecture

```
WEBHOOK DELIVERY — KIẾN TRÚC:
═══════════════════════════════════════════════════════════════

  Webhook = Stripe GỌI API của MERCHANT khi có event!
  VD: Payment succeeded → POST https://merchant.com/webhook

  ┌──────────┐  event   ┌──────────┐  publish  ┌──────────┐
  │ Payment  │ ───────→│  Event   │ ────────→│  Message │
  │ Service  │         │  Bus     │          │  Queue   │
  └──────────┘         └──────────┘          └────┬─────┘
                                                   │
                                             ┌─────▼─────┐
                                             │  Webhook  │
                                             │  Workers  │
                                             └─────┬─────┘
                                                   │ POST
                                             ┌─────▼─────┐
                                             │ Merchant  │
                                             │ Endpoint  │
                                             └─────┬─────┘
                                                   │ 2xx?
                                          ┌────────┴────────┐
                                          │                 │
                                     ✅ Success        ❌ Fail
                                     Mark done!        → RETRY!

  AT-LEAST-ONCE DELIVERY:
  → Đảm bảo event được gửi ÍT NHẤT 1 LẦN!
  → Có thể gửi NHIỀU LẦN (nếu ack bị mất!)
  → → Merchant phải xử lý DEDUPLICATION!
  → → Stripe KHÔNG đảm bảo exactly-once!
```

---

## §9. Webhook — Retry, Backoff, Deduplication

```
RETRY + EXPONENTIAL BACKOFF:
═══════════════════════════════════════════════════════════════

  Retry schedule (Stripe thật sự dùng!):
  Attempt 1: ngay lập tức!
  Attempt 2: 5 phút sau!
  Attempt 3: 30 phút sau!
  Attempt 4: 2 giờ sau!
  Attempt 5: 5 giờ sau!
  Attempt 6: 10 giờ sau!
  Attempt 7: 24 giờ sau!
  → Tổng: retry trong 72 giờ → sau đó DỪNG!

  FORMULA:
  delay = min(baseDelay × 2^attempt + jitter, maxDelay)

  JITTER: thêm random delay!
  → Tránh "thundering herd" (tất cả retry CÙNG LÚC!)
  → jitter = random(0, delay × 0.1)
```

```typescript
// ═══ WEBHOOK WORKER — RETRY + BACKOFF ═══

interface WebhookEvent {
  id: string;
  type: string; // 'payment_intent.succeeded'
  data: Record<string, any>;
  endpoint: string; // Merchant URL
  attempt: number;
  maxAttempts: number;
  createdAt: Date;
}

class WebhookWorker {
  private baseDelay = 5 * 60 * 1000; // 5 phút
  private maxDelay = 24 * 60 * 60 * 1000; // 24 giờ

  async deliver(event: WebhookEvent): Promise<void> {
    try {
      const response = await fetch(event.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": this.sign(event), // HMAC!
          "Stripe-Event-Id": event.id, // Dedup!
        },
        body: JSON.stringify({
          id: event.id,
          type: event.type,
          data: event.data,
          created: event.createdAt.getTime() / 1000,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout!
      });

      if (response.ok) {
        // ✅ Success! Mark as delivered!
        await this.markDelivered(event);
      } else {
        // ❌ Non-2xx! Schedule retry!
        await this.scheduleRetry(event);
      }
    } catch (error) {
      // ❌ Network error! Schedule retry!
      await this.scheduleRetry(event);
    }
  }

  private async scheduleRetry(event: WebhookEvent) {
    event.attempt++;
    if (event.attempt >= event.maxAttempts) {
      await this.markFailed(event); // Give up sau 7 attempts!
      return;
    }

    // Exponential backoff + jitter:
    const delay = Math.min(
      this.baseDelay * Math.pow(2, event.attempt),
      this.maxDelay,
    );
    const jitter = Math.random() * delay * 0.1;

    // Enqueue for later:
    await this.enqueue(event, delay + jitter);
  }

  private sign(event: WebhookEvent): string {
    // HMAC-SHA256 signature!
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${timestamp}.${JSON.stringify(event.data)}`;
    const signature = crypto
      .createHmac("sha256", event.signingSecret)
      .update(payload)
      .digest("hex");
    return `t=${timestamp},v1=${signature}`;
  }
}
```

```
DEDUPLICATION — MERCHANT SIDE:
═══════════════════════════════════════════════════════════════

  Vì AT-LEAST-ONCE → merchant CÓ THỂ nhận event NHIỀU LẦN!
  → Merchant PHẢI deduplicate!

  CÁCH LÀM:
  ① Lưu EVENT ID đã xử lý vào database!
  ② Khi nhận event → kiểm tra ID đã tồn tại?
  ③ Nếu CÓ → ignore! Nếu CHƯA → xử lý + lưu ID!

  // Merchant code:
  app.post('/webhook', (req, res) => {
      const eventId = req.headers['stripe-event-id'];

      // Đã xử lý rồi? → 200 OK, nhưng KHÔNG xử lý lại!
      if (await db.exists('processed_events', eventId)) {
          return res.sendStatus(200);
      }

      // Xử lý event...
      await processEvent(req.body);

      // Lưu event ID:
      await db.insert('processed_events', { id: eventId });

      res.sendStatus(200);
  });
```

---

## §10. Webhook — Signature & Schema Versioning

```
SIGNATURE VERIFICATION:
═══════════════════════════════════════════════════════════════

  TẠI SAO? Đảm bảo webhook THẬT SỰ từ Stripe, không bị giả!

  FLOW:
  ① Stripe gửi: Header "Stripe-Signature: t=timestamp,v1=hash"
  ② Merchant verify:
     → Lấy timestamp + body → tạo expected hash
     → So sánh hash → KHỚP = authentic!
     → Check timestamp < 5 phút (chống replay attack!)
```

```typescript
// ═══ MERCHANT — VERIFY WEBHOOK SIGNATURE ═══

function verifyWebhookSignature(
  payload: string,
  header: string,
  secret: string,
): boolean {
  // Parse header: "t=1234567890,v1=abc123..."
  const parts = header.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !signature) return false;

  // ① Check timestamp (chống replay attack!):
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) return false; // > 5 phút = REJECT!

  // ② Compute expected signature:
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  // ③ Timing-safe comparison (chống timing attack!):
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

```
SCHEMA VERSIONING — BREAKING CHANGES:
═══════════════════════════════════════════════════════════════

  Stripe webhook schema THAY ĐỔI theo thời gian!
  → Thêm field mới = NON-BREAKING (backward compatible!)
  → Đổi tên / xóa field = BREAKING!

  CHIẾN LƯỢC:
  ┌────────────────────────────────────────────────────────┐
  │ ① API VERSIONING:                                     │
  │ → Mỗi merchant đăng ký API version!                   │
  │ → VD: "2024-01-01" → nhận schema version đó!          │
  │ → Merchant upgrade version KHI SẴN SÀNG!              │
  │                                                        │
  │ ② SUNSET PERIOD:                                       │
  │ → Thông báo deprecation 6-12 tháng trước!             │
  │ → Migration guides + changelog!                        │
  │                                                        │
  │ ③ DUAL-WRITE:                                          │
  │ → Gửi CẢ HAI versions trong transition period!        │
  │ → Merchant nhận both old + new format!                 │
  │                                                        │
  │ ④ FEATURE FLAGS:                                       │
  │ → Merchant opt-in new schema features!                 │
  │ → Gradual rollout!                                     │
  └────────────────────────────────────────────────────────┘
```

---

## §11. Payment Reconciliation & Eventual Consistency

```
PAYMENT RECONCILIATION:
═══════════════════════════════════════════════════════════════

  Reconciliation = ĐỐI SOÁT thanh toán!
  → So sánh DỮ LIỆU STRIPE với MERCHANT records!
  → Phát hiện SÃNH LỆCH (drift!)

  TẠI SAO EVENTUAL CONSISTENCY?
  → Payment processing = NHIỀU hệ thống khác nhau!
  → Stripe + Bank + Merchant DB + Payment Gateway!
  → Tất cả CẬP NHẬT KHÔNG ĐỒNG THỜI!
  → → Chấp nhận "eventually" mọi thứ sẽ THỐNG NHẤT!
  → → Thay vì ép buộc strong consistency (TỐN KÉM!)

  RECONCILIATION DRIFT:
  ┌────────────────────────────────────────────────────────┐
  │ Stripe ghi: Payment $100 SUCCEEDED!                    │
  │ Bank ghi: Chưa nhận!                                  │
  │ → DRIFT! Đợi 24-48h → bank xác nhận!                 │
  │ → Nếu vẫn drift → MANUAL investigation!               │
  └────────────────────────────────────────────────────────┘

  CÁCH XỬ LÝ:
  ① Batch reconciliation job (daily/hourly!)
  ② So sánh records → tìm mismatches!
  ③ Auto-resolve: timing issues, pending txns!
  ④ Flag: unresolvable → alert team!
  ⑤ Dashboard: track drift rate over time!
```

---

## §12. Behavioral — Decisive Under Ambiguity

```
"DECISIVE UNDER AMBIGUITY" — FEEDBACK STRIPE:
═══════════════════════════════════════════════════════════════

  Ứng viên bị REJECT vì:
  → System design SOLID nhưng...
  → KHÔNG ĐỦ DECISIVE khi gặp ambiguity!

  AMBIGUITY = câu hỏi KHÔNG CÓ ĐÁP ÁN ĐÚNG 100%!
  → "Nên dùng SQL hay NoSQL?"
  → "At-least-once hay exactly-once?"
  → "Consistency hay availability?"

  CÁCH XỬ LÝ ĐÚNG:
  ┌────────────────────────────────────────────────────────┐
  │ ❌ SAI: "Hmm, tùy trường hợp..." (vague!)            │
  │ ❌ SAI: "Có thể dùng cả hai..." (indecisive!)        │
  │                                                        │
  │ ✅ ĐÚNG: Framework QUYẾT ĐOÁN:                        │
  │                                                        │
  │ 1. STATE TRADEOFFS rõ ràng:                            │
  │    "SQL cho data integrity, NoSQL cho throughput"      │
  │                                                        │
  │ 2. MAKE A DECISION:                                    │
  │    "Trong context này, TÔI CHỌN SQL vì..."            │
  │                                                        │
  │ 3. JUSTIFY with reasoning:                             │
  │    "...payment data cần ACID, consistency quan trọng"  │
  │                                                        │
  │ 4. ACKNOWLEDGE tradeoffs:                              │
  │    "Tradeoff: throughput thấp hơn, nhưng chấp nhận    │
  │     vì correctness quan trọng hơn trong fintech"      │
  │                                                        │
  │ → QUYẾT ĐOÁN + có lý do = STRONG SIGNAL! ✅           │
  └────────────────────────────────────────────────────────┘
```

---

## §13. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Payment Ledger?"
  A: Append-only entries, idempotency key (UUID per request),
  refund = reverse entry, currency = integer cents,
  banker's rounding, double-entry bookkeeping!

  Q: "Rate Limiter?"
  A: Sliding window log (chính xác) hoặc counter (tiết kiệm).
  Token bucket (cho burst) vs Leaky bucket (đều đặn).
  Distributed: Redis Lua script atomic.
  Failure: fallback local memory!

  Q: "Webhook Delivery?"
  A: At-least-once delivery, exponential backoff + jitter,
  retry 7 lần trong 72h, HMAC-SHA256 signature,
  merchant deduplicate bằng event ID,
  schema versioning cho breaking changes!

  Q: "Payment Reconciliation?"
  A: Eventual consistency giữa Stripe/Bank/Merchant.
  Batch reconciliation job (daily). Drift detection.
  Auto-resolve timing issues, flag unresolvable!

  Q: "Decisive under ambiguity?"
  A: State tradeoffs → MAKE DECISION → justify → acknowledge!
```

---

### Checklist

- [ ] **Idempotency**: Client tạo UUID key, server check key trước khi xử lý, lưu response, TTL 24-48h!
- [ ] **Payment Ledger**: Append-only, double-entry bookkeeping, refund = reverse entry!
- [ ] **Floating-point**: Dùng INTEGER (cents/xu!), banker's rounding (half to even!), decimal.js cho production!
- [ ] **Currency conversion**: amountCents × rate, snapshot rate + timestamp, rounding cuối cùng!
- [ ] **Rate Limiter 3 loại**: Fixed window (boundary problem), Sliding window log (chính xác, tốn memory), Counter (balanced)!
- [ ] **Token vs Leaky Bucket**: Token = cho burst (API limit), Leaky = đều đặn (traffic shaping)!
- [ ] **Distributed**: Redis Lua script (INCR + EXPIRE atomic!); Failure mode: fallback local memory!
- [ ] **Webhook**: At-least-once, exponential backoff + jitter, 7 attempts / 72h, HMAC-SHA256 signature!
- [ ] **Deduplication**: Merchant lưu processed event IDs, check trước khi xử lý!
- [ ] **Schema versioning**: API version per merchant, sunset period 6-12 months, dual-write transition!
- [ ] **Reconciliation**: Batch job daily, drift detection, auto-resolve timing, flag unresolvable!
- [ ] **Behavioral**: State tradeoffs → MAKE DECISION → justify reasoning → acknowledge tradeoffs! Quyết đoán!

---

_Nguồn: Reddit — Stripe interview experience_
_Cập nhật lần cuối: Tháng 2, 2026_
