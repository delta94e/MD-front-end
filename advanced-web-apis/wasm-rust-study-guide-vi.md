# Hướng Dẫn Học Tập: WebAssembly và Rust

## 1. WebAssembly (WASM) là gì?

### Định nghĩa
WebAssembly (viết tắt là WASM) là một định dạng lệnh nhị phân được thiết kế để thực thi code với tốc độ gần như native (tốc độ máy) trong trình duyệt web.

### Đặc điểm chính
- **Hiệu suất cao**: Chạy với tốc độ gần bằng code native
- **Đa ngôn ngữ**: Code WASM thường được biên dịch từ các ngôn ngữ như C/C++/Rust
- **Tương tác với JavaScript**: Có thể tích hợp và gọi lẫn nhau với JavaScript một cách liền mạch
- **An toàn**: Chạy trong môi trường sandbox của trình duyệt
- **Portable**: Chạy được trên nhiều nền tảng khác nhau

### Ứng dụng thực tế
- Game trên web
- Xử lý video/audio
- Ứng dụng đồ họa 3D
- Công cụ chỉnh sửa (editors)
- Mã hóa/giải mã dữ liệu

---

## 2. Rust + WebAssembly

### Quy trình biên dịch

```
Code Rust → wasm-pack → File WASM → JavaScript gọi hàm
```

### Ví dụ cơ bản

#### Bước 1: Viết code Rust

```rust
// src/lib.rs
#[no_mangle]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

**Giải thích:**
- `#[no_mangle]`: Giữ nguyên tên hàm khi biên dịch (không bị "name mangling")
- `pub`: Hàm công khai, có thể gọi từ bên ngoài
- `i32`: Kiểu số nguyên 32-bit

#### Bước 2: Biên dịch với wasm-pack

```bash
wasm-pack build --target web
```

#### Bước 3: Gọi từ JavaScript

```javascript
import init, { add }from './pkg/your_module.js';

await init(); // Khởi tạo module WASM
console.log(add(2, 3)); // Kết quả: 5
```

---

## 3. Hệ Thống Ownership trong Rust

### Tại sao cần Ownership?
Rust quản lý vòng đời của bộ nhớ và tài nguyên thông qua hệ thống ownership, đảm bảo an toàn bộ nhớ **mà không cần garbage collector**.

### Ba nguyên tắc cốt lõi

#### Nguyên tắc 1: Mỗi giá trị có duy nhất một chủ sở hữu (owner)

```rust
let s1 = String::from("hello"); // s1 là chủ sở hữu
let s2 = s1;                    // Quyền sở hữu chuyển từ s1 sang s2 (Move)
println!("{}", s1);             // ❌ LỖI BIÊN DỊCH! s1 đã không còn hiệu lực
```

**Giải thích:**
- `String` lưu dữ liệu trên heap
- Khi gán `s2 = s1`, quyền sở hữu được **chuyển giao** (Move)
- `s1` trở nên không hợp lệ, không thể sử dụng nữa
- Điều này ngăn chặn "double free" (giải phóng bộ nhớ hai lần)

**Sơ đồ minh họa:**
```
Trước:  s1 → ["hello" trên heap]
Sau:    s1 (❌ không hợp lệ)
        s2 → ["hello" trên heap]
```

#### Nguyên tắc 2: Quyền sở hữu có thể chuyển giao (Move), nhưng không thể chia sẻ (trừ khi mượn - borrow)

**Mượn bất biến (Immutable Borrow):**
```rust
let s = String::from("hello");
let len = calculate_length(&s); // Truyền tham chiếu bất biến

fn calculate_length(s: &String) -> usize {
    s.len()  // Có thể đọc nhưng không thể sửa đổi
}
```

**Quy tắc mượn:**
- Có thể có **nhiều tham chiếu bất biến** (`&T`) cùng lúc
- Hoặc **chỉ một tham chiếu khả biến** (`&mut T`)
- Không thể có cả hai cùng lúc (ngăn chặn data race)

**Ví dụ về mượn khả biến:**
```rust
let mut s = String::from("hello");

fn change(s: &mut String) {
    s.push_str(", world");
}

change(&mut s);
println!("{}", s); // "hello, world"
```

**Ví dụ lỗi data race:**
```rust
let mut s = String::from("hello");
let r1 = &s;     // OK
let r2 = &s;     // OK - nhiều tham chiếu bất biến
let r3 = &mut s; // ❌ LỖI! Không thể có tham chiếu khả biến khi đã có tham chiếu bất biến
```

#### Nguyên tắc 3: Khi chủ sở hữu ra khỏi phạm vi (scope), giá trị tự động được dọn dẹp

```rust
fn main() {
    {
        let s = String::from("hello"); // s vào phạm vi, cấp phát bộ nhớ trên heap
        println!("{}", s);             // In ra "hello"
    } // s ra khỏi phạm vi → tự động gọi hàm drop() → giải phóng bộ nhớ
    
    // ❌ Không thể truy cập s ở đây
}
```

**Lợi ích:**
- Không cần gọi `free()` hoặc `delete` thủ công
- Không có memory leak
- Không có dangling pointer (con trỏ treo)

---

## 4. So Sánh: Rust vs Các Ngôn Ngữ Khác

| Đặc điểm | Rust | C/C++ | JavaScript | Python |
|----------|------|-------|------------|--------|
| Quản lý bộ nhớ | Ownership | Thủ công | Garbage Collector | Garbage Collector |
| An toàn bộ nhớ | ✅ Compile-time | ❌ Runtime errors | ✅ GC | ✅ GC |
| Hiệu suất | Rất cao | Rất cao | Trung bình | Thấp |
| Học tập | Khó | Khó | Dễ | Dễ |

---

## 5. Các Khái Niệm Quan Trọng

### Move vs Copy

**Move (Chuyển giao):**
```rust
let s1 = String::from("hello");
let s2 = s1; // Move - s1 không còn hợp lệ
```

**Copy (Sao chép):**
```rust
let x = 5;
let y = x; // Copy - x vẫn hợp lệ
println!("{}, {}", x, y); // OK!
```

Các kiểu dữ liệu đơn giản (integers, floats, bool, char) implement trait `Copy`, nên chúng được sao chép thay vì chuyển giao.

### Clone (Nhân bản)

Nếu muốn sao chép sâu (deep copy) dữ liệu trên heap:

```rust
let s1 = String::from("hello");
let s2 = s1.clone(); // Tạo bản sao độc lập
println!("{}, {}", s1, s2); // OK!
```

---

## 6. Bài Tập Thực Hành

### Bài 1: Xác định lỗi
```rust
fn main() {
    let s = String::from("hello");
    takes_ownership(s);
    println!("{}", s); // Lỗi ở đâu?
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
}
```

**Đáp án:** Lỗi vì `s` đã bị move vào hàm `takes_ownership`, không thể sử dụng sau đó.

**Cách sửa:** Dùng tham chiếu
```rust
fn takes_ownership(some_string: &String) {
    println!("{}", some_string);
}
```

### Bài 2: Viết hàm WASM
Viết một hàm Rust tính giai thừa và export sang WASM:

```rust
#[no_mangle]
pub fn factorial(n: u32) -> u32 {
    if n <= 1 {
        1
    }else {
        n * factorial(n - 1)
    }
}
```

### Bài 3: Phân tích ownership
```rust
fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &s;
    println!("{} and {}", r1, r2);
    
    let r3 = &mut s;
    r3.push_str(" world");
    println!("{}", r3);
}
```

**Câu hỏi:** Code này có chạy được không? Tại sao?

**Đáp án:** Có! Vì `r1` và `r2` không còn được sử dụng sau `println!`, nên Rust cho phép tạo `r3` (Non-Lexical Lifetimes).

---

## 7. Tài Nguyên Học Tập

### Tài liệu chính thức
- [The Rust Book (tiếng Anh)](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [WebAssembly Documentation](https://webassembly.org/)

### Công cụ cần thiết
- **rustup**: Quản lý phiên bản Rust
- **wasm-pack**: Build Rust thành WASM
- **cargo**: Package manager của Rust

### Cài đặt
```bash
# Cài Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Cài wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

---

## 8. Tóm Tắt

### WebAssembly
- Định dạng nhị phân chạy nhanh trên trình duyệt
- Biên dịch từ C/C++/Rust
- Tương tác tốt với JavaScript

### Rust Ownership
1. **Mỗi giá trị có một chủ sở hữu duy nhất**
2. **Có thể mượn (borrow) nhưng phải tuân thủ quy tắc**
3. **Tự động dọn dẹp khi ra khỏi phạm vi**

### Lợi ích
- ✅ An toàn bộ nhớ không cần GC
- ✅ Hiệu suất cao
- ✅ Phát hiện lỗi tại compile-time
- ✅ Không có data race

---

**Chúc bạn học tốt! 🦀**