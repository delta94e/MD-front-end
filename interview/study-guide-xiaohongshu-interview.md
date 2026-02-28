# Study Guide - Phỏng Vấn Xiaohongshu (Tiếng Việt)

## Tổng Quan
Tài liệu này tổng hợp kiến thức từ 3 vòng phỏng vấn tại Xiaohongshu, tập trung vào React, tối ưu hóa hiệu suất, và thuật toán.

---

## VÒNG 1: CƠ BẢN REACT & THUẬT TOÁN ĐƠN GIẢN (50 phút)

### 1. React Synthetic Events (Sự Kiện Tổng Hợp)

#### Ưu điểm của Synthetic Events:
- **Tương thích đa trình duyệt**: Loại bỏ sự khác biệt giữa các trình duyệt, cung cấp API thống nhất
- **Tối ưu hiệu suất**: Sử dụng event delegation (ủy quyền sự kiện) để giảm tiêu thụ bộ nhớ

#### Quy trình hoạt động:

**Bước 1: Khởi động ứng dụng**
```
React bind native DOM events → Root element (làm delegate object)
```

**Bước 2: Render component**
```
JSX parsing → Map events to native events
```

**Bước 3: User interaction**
```
User click → Event bubbles to root → dispatchEvent() được gọi
```

**Bước 4: Event dispatching**
```
dispatchEvent() → Tìm fiber node tương ứng → Thêm synthetic event vào queue → Thực thi tuần tự
```

#### Sơ đồ luồng:
```
[User Click] 
    ↓
[Event Bubbles Up]
    ↓
[Root Element Listener]
    ↓
[dispatchEvent()]
    ↓
[Find Fiber Node]
    ↓
[Add to Execution Queue]
    ↓
[Execute Functions]
```

---

### 2. React Batch Update Process (Quy Trình Cập Nhật Hàng Loạt)

#### Kiến trúc React mới:

**Scheduler (Bộ lập lịch)**
- Nhiệm vụ: Lập lịch tạo và cập nhật Fiber nodes
- Thực thi tasks theo độ ưu tiên

**Reconciler (Bộ điều phối)**
- Thực thi `render()` method
- Xử lý đệ quy Fiber nodes
- Tạo workInProgressFiber tree

**Renderer (Bộ render)**
- Thực hiện diff operations (patch process)
- Cập nhật DOM

#### Quy trình chi tiết:

**1. Component Update**
```javascript
Component updates → Reconciler executes render() → Generate child Fiber nodes
```

**2. Task Scheduling**
```javascript
Each Fiber node generation = 1 task
→ Scheduler receives via callback
→ Execute by priority (Lane Model)
```

**3. Priority System (Lane Model)**
```
React có nhiều categories, mỗi category có priority khác nhau
Tất cả được enumerate trong React
```

**4. Async Execution**
```javascript
After each task → requestIdleCallback() checks remaining time
→ If not enough time: Interrupt + hand control to browser
→ Continue in next frame
```

**5. Commit Phase**
```javascript
Scheduler completes → New workInProgressFiber tree
→ Reconciler triggers Commit phase
→ Renderer performs diff (PATCH PROCESS)
```

---

### 3. React Diff Algorithm

#### A. Single Node Diff (Đơn giản)

**Quy trình:**
```
1. Check if old Fiber node exists
   → NO: Add new node + update DOM
   
2. Check if key values match
   → NO: Delete old + add new
   
3. Check if type matches
   → NO: Delete old + add new
   
4. If key & type match
   → Reuse old node
```

#### B. Multi-Node Diff (Phức tạp)

**3 trường hợp:**
- Thêm nodes
- Xóa nodes  
- Di chuyển nodes

**Phương pháp: Double Traversal (Duyệt 2 lần)**

**Lần duyệt thứ 1:**
```javascript
Compare children[i] with currentFiber
Compare children[i++] with currentFiber.sibling

→ If node unreusable: End early
```

**Các kết quả có thể:**

```javascript
// Case 1: Không kết thúc sớm
→ Tất cả nodes có thể reuse → Return old node

// Case 2: children complete, currentFiber incomplete
→ DELETE operation → Mark incomplete siblings for deletion

// Case 3: children incomplete, currentFiber complete  
→ ADD operation → Generate new workInProgressFiber nodes

// Case 4: Both incomplete
→ MOVE operation → Iterate remaining currentFiber
→ Find old node in children by key
→ Replace old position with new position
```

---

### 4. Bài Toán Thuật Toán: Longest Common Prefix

**Đề bài:**
```javascript
Input: strs = ['abcdef', 'abdefw', 'abc']
Output: 'ab' (hoặc '' nếu không có)
```

**Giải pháp:**
```javascript
const findCommonPrefix = arr => {
    let str = '';
    // Tìm độ dài string ngắn nhất
    const n = arr.map(item => item.length).sort()[0];
    
    for (let i = 0; i < n; i++) {
        str += arr[0][i];
        // Kiểm tra xem tất cả strings có bắt đầu với str không
        if (arr.some(item => !item.startsWith(str))) {
            return str.slice(0, str.length - 1);
        }
    }
    return str;
}
```

**Độ phức tạp:**
- Time: O(n × m) - n là số strings, m là độ dài prefix
- Space: O(1)

---

## VÒNG 2: TỐI ƯU HÓA & KIẾN TRÚC (75 phút)

### 1. Tối Ưu Hiệu Suất Mini-Program

#### Kiến trúc & Nguyên lý render:

**Các yếu tố ảnh hưởng hiệu suất:**
- Số lần gọi setData
- Lượng data trong setData
- Độ sâu nesting của WXML
- Số lượng nodes
- Framework overhead (React/Vue)

#### Kỹ thuật tối ưu:

**1. Sử dụng Native Syntax**
```
❌ React/Vue frameworks
✅ WeChat Mini Program native syntax
```

**2. Tối ưu setData**
```javascript
// ❌ Bad: Multiple calls
this.setData({ a: 1 });
this.setData({ b: 2 });
this.setData({ c: 3 });

// ✅ Good: Single call
this.setData({ a: 1, b: 2, c: 3 });

// ✅ Good: Reduce data amount
this.setData({ 'list[0].name': 'John' }); // Chỉ update 1 field
```

**3. Request Preloading**
```javascript
// Override route method
const originalNavigateTo = wx.navigateTo;
wx.navigateTo = function(options) {
    // Gọi API của page tiếp theo trước
    preloadNextPageData(options.url);
    return originalNavigateTo.call(this, options);
}
```

**4. Tối ưu WXML/WXSS**
```xml
<!-- ❌ Bad: Deep nesting -->
<view>
  <view>
    <view>
      <view>Content</view>
    </view>
  </view>
</view>

<!-- ✅ Good: Flat structure -->
<view>Content</view>
```

```css
/* ✅ Merge same styles */
.btn-primary, .btn-secondary, .btn-danger {
    padding: 10px;
    border-radius: 4px;
}
```

**5. Kỹ thuật phổ biến khác:**
- **Skeleton screen**: Hiển thị placeholder khi loading
- **First-screen caching**: Cache data màn hình đầu
- **Package splitting**: Chia nhỏ package
- **Subpackage preloading**: Preload subpackages
- **First-screen API merging**: Gộp nhiều API thành 1
- **Lazy loading**: Load khi cần thiết

---

### 2. Triển Khai Request Library

#### Kiến trúc tổng quan:

```javascript
XMLHttpRequest 
    ↓
Promise wrapper
    ↓
Plugin mechanism (middleware pattern - inspired by Koa)
    ↓
Decorator support
```

#### Core Implementation:

**1. Plugin Queues**
```javascript
class RequestClient {
    constructor() {
        this.requestPlugins = [];   // Request interceptors
        this.responsePlugins = [];  // Response interceptors
    }
    
    use(plugin) {
        if (plugin.request) {
            this.requestPlugins.push(plugin.request);
        }
        if (plugin.response) {
            this.responsePlugins.push(plugin.response);
        }
    }
}
```

**2. Request Flow**
```javascript
async request(config) {
    // Execute request plugins
    for (let plugin of this.requestPlugins) {
        config = await plugin(config);
    }
    
    // Make actual request
    const response = await this.xhr(config);
    
    // Execute response plugins
    for (let plugin of this.responsePlugins) {
        response = await plugin(response);
    }
    
    return response;
}
```

**3. Decorator Support**
```javascript
class API {
    @UsePlugin(authPlugin)
    @UsePlugin(retryPlugin)
    async getUserInfo() {
        return this.client.get('/user/info');
    }
}
```

#### Lý do tạo custom library:

**1. Yêu cầu business:**
- Framework-independent (không phụ thuộc React/Vue)
- Tương thích với hàng chục products khác nhau
- Integration đơn giản
- Hỗ trợ customization cho từng product line

**2. Hạn chế của Axios:**
- API call method khác với expectation
- Không hỗ trợ plugins lúc đó (giờ có rồi)
- Chỉ có hooks, khó maintain khi cần standardization với variations

**3. Tính năng mở rộng:**
- SMS verification
- Exception handling
- Retry on failure
- Plug-and-play approach

**GitHub:** helianthuswhite/RestClient

---

### 3. Triển Khai Sketch Plugin

#### Kiến trúc:

```
CocoaScript (Native layer)
    ↑↓ Message passing
WebView (UI layer - Front-end page)
```

#### Quy trình hoạt động:

**1. Plugin Panel**
```
Front-end page trong WebView
→ Hiển thị components/icons
```

**2. Drag & Drop**
```javascript
// User drags component
webView.postMessage({
    type: 'component',
    id: 'button-primary',
    position: { x: 100, y: 200 }
});

// Native code receives
function onMessage(message) {
    const component = findBuiltInComponent(message.id);
    placeOnCanvas(component, message.position);
}
```

**3. Built-in Component Package**
```
Plugin installation → Install sketch组件包
→ Mỗi component có unique identifier
→ 1-1 mapping với sketch组件
```

**4. Export Process**
```
Traverse canvas templates/components
→ Find corresponding component code
→ Assemble code
```

---

### 4. Logs & Monitoring trong Mini-Program

#### Phần 1: Log Tracking & Upload

**A. Code Logs & Business Logs**

```javascript
// Custom WebSocket log service
class LogService {
    constructor() {
        this.ws = new WebSocket('wss://log-server.com');
    }
    
    log(level, message, data) {
        this.ws.send(JSON.stringify({
            level,
            message,
            data,
            timestamp: Date.now()
        }));
    }
}

// Usage
const logger = new LogService();
logger.log('info', 'User clicked button', { buttonId: 'submit' });
```

**B. Server Processing**
```
WebSocket Server receives logs
    ↓
Forward to company data warehouse
    ↓
Query via data warehouse API
```

**C. Business Data Tracking**
```javascript
// Track user actions
wx.trackEvent('user_click', {
    page: 'product_detail',
    action: 'add_to_cart',
    productId: '12345'
});
```

#### Phần 2: Alarm Implementation

**1. Infrastructure**
```
Company's unified alarm platform
```

**2. Trend Charts**
```
Tracking data → Display trends → Set thresholds
```

**3. Alarm Strategy**
```javascript
// Example: Payment success rate
const alarmRule = {
    metric: 'payment_success_rate',
    threshold: 0.95,
    condition: 'less_than',
    duration: '5min'
};

// If payment_success_rate < 95% for 5 minutes → Trigger alarm
```

**4. Optimization**
```
Manual threshold setting
    ↓
Monitor actual conditions
    ↓
Adjust thresholds
    ↓
Achieve accurate alarms
```

---

### 5. Đo Lường Business Value của Technology

#### Phương pháp 1: Direct Measurement

**Định nghĩa business metrics:**
```javascript
// Example: Payment conversion rate
用户下单支付率 = 用户最终支付的埋点数 / 用户下单的埋点数

// Before tech upgrade
const beforeRate = 5000 / 10000 = 0.50 (50%)

// After tech upgrade  
const afterRate = 6000 / 10000 = 0.60 (60%)

// Business value = +10% conversion rate
```

**Quy trình:**
```
1. Define business metrics
2. Measure before upgrade
3. Implement tech upgrade
4. Measure after upgrade
5. Compare results
6. Calculate business value
```

#### Phương pháp 2: Indirect Measurement

**Khi không thể quantify trực tiếp:**

```
1. Break down tech-to-business process
2. Measure upstream value
3. Extrapolate downstream impact
4. Calculate overall business value
```

**Ví dụ:**
```
Tech: Improve API response time from 2s to 0.5s
    ↓
Upstream: Page load time reduces 1.5s
    ↓
Impact: User engagement increases 15%
    ↓
Business: Revenue increases 8%
```

---

## VÒNG 3: CROSS-DEPARTMENT INTERVIEW (70 phút)

### Bài Toán Thuật Toán: String Decoding

**Đề bài:**
```javascript
Input: s = "3[a2[c]]"
Output: "accaccacc"
```

**Giải thích:**
```
2[c] = cc
a2[c] = acc
3[a2[c]] = accaccacc
```

**Giải pháp: Sử dụng Stack**

```javascript
function decodeString(s) {
    const stack = [];
    let numStr = '';
    let i = 0;

    while (i < s.length) {
        // 1. Kiểm tra nếu là số
        if (!isNaN(+s[i])) {
            numStr += s[i];
        } else {
            // 2. Xử lý số nhiều chữ số
            if (numStr) {
                stack.push(numStr);
                numStr = '';
            }

            // 3. Gặp ']' → Thực hiện decode
            if (s[i] === ']') {
                const temp = [];
                
                // 4. Pop cho đến khi gặp '['
                while (true) {
                    const current = stack.pop();
                    
                    if (current === '[') {
                        // 5. Lấy số lần lặp
                        const num = +stack.pop();
                        
                        // 6. Tạo string lặp lại (chú ý reverse)
                        const tempResult = Array(num)
                            .fill(temp.reverse().join(''))
                            .join('');
                        
                        // 7. Push kết quả vào stack
                        stack.push(tempResult);
                        break;
                    }else {
                        temp.push(current);
                    }
                }
            } else {
                // 8. Các ký tự khác → Push vào stack
                stack.push(s[i]);
            }
        }
        i++;
    }

    return stack.join('');
}
```

**Trace Example:**

```
Input: "3[a2[c]]"

Step-by-step:
i=0: '3' → numStr='3'
i=1: '[' → stack=['3','[']
i=2: 'a' → stack=['3','[','a']
i=3: '2' → numStr='2'
i=4: '[' → stack=['3','[','a','2','[']
i=5: 'c' → stack=['3','[','a','2','[','c']
i=6: ']' → Pop until '[':
         temp=['c']
         num=2
         result='cc'
         stack=['3','[','a','cc']
i=7: ']' → Pop until '[':
         temp=['cc','a'] → reverse → ['a','cc']
         num=3
         result='accaccacc'
         stack=['accaccacc']

Output: 'accaccacc'
```

**Độ phức tạp:**
- Time: O(n) - n là độ dài string
- Space: O(n) - stack space

**Key Points:**
1. Sử dụng stack để xử lý nested structure
2. Xử lý số nhiều chữ số (numStr)
3. Reverse temp array trước khi join (vì pop ngược thứ tự)
4. Kết quả decode trở thành element mới trong stack (xử lý nested)

---

## TỔNG KẾT & TIPS

### Kiến thức cần nắm vững:

**1. React Core:**
- ✅ Synthetic Events & Event Delegation
- ✅ Fiber Architecture
- ✅ Scheduler & Reconciler
- ✅ Diff Algorithm (Single & Multi-node)
- ✅ Batch Updates & Lane Model

**2. Performance Optimization:**
- ✅ Mini-program optimization techniques
- ✅ Request optimization & preloading
- ✅ Code splitting & lazy loading
- ✅ Caching strategies

**3. Architecture & Design:**
- ✅ Plugin mechanism & middleware pattern
- ✅ Event-driven architecture
- ✅ Logging & monitoring systems
- ✅ Cross-platform solutions

**4. Algorithms:**
- ✅ String manipulation
- ✅ Stack-based problems
- ✅ Array traversal
- ✅ Recursion & nested structures

### Chiến lược phỏng vấn:

**1. Trình bày project:**
- Nói về technical & business perspectives
- Highlight key difficulties & solutions
- Explain business value & measurement
- Thời gian: ~30 phút

**2. Trả lời technical questions:**
- Giải thích từ high-level trước
- Đi sâu vào implementation details
- Vẽ diagrams nếu cần
- Đưa ra examples cụ thể

**3. Coding challenges:**
- Clarify requirements trước
- Explain approach trước khi code
- Write clean, readable code
- Test với examples
- Analyze complexity

### Tài nguyên tham khảo:

- React Official Docs: https://react.dev
- GitHub: helianthuswhite/RestClient
- Original Article: https://juejin.cn/post/7298927442488754213

---

**Chúc bạn phỏng vấn thành công! 🎉**
