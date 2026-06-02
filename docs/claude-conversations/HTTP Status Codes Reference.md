# HTTP Status Codes Reference

## You

Common status codes1xx: Accept, continue processing200: Success, and return data201: Created202: Accepted203: Become, but not authorized204: Success, no content205: Success, reset content206: Success, partial content301: Moved Permanently, Redirect302: Temporary move, original URI can be used304: The resource has not been modified, and the cache can be used305: Proxy access required400: Request syntax error401: Authentication Required403: Request Denied404: Resource does not exist500: Server Error
作者：郭东东 链接：https://juejin.cn/post/6844903776512393224 来源：稀土掘金 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

## Claude


# HTTP Status Codes: Hành Trình Từ Foundation Đến Principal Level - Góc Nhìn Của Một Senior Front-end Engineer


## 🌱 Nguồn Gốc & Motivation: Tại Sao HTTP Status Codes Tồn Tại?


### Bối Cảnh Lịch Sử - The Genesis Story


Hãy tưởng tượng bạn đang ở những năm 1990, khi Tim Berners-Lee tại CERN đang thiết kế giao thức HTTP đầu tiên. Lúc đó, chúng ta cần một cách để web servers có thể "nói chuyện" với browsers về việc request đã được xử lý như thế nào. Đây chính là lý do HTTP Status Codes ra đời.


**💭 Principal's Perspective**: Khi tôi mentoring các junior developers tại NAB, tôi thường bắt đầu với câu hỏi: "Làm thế nào để một máy tính biết rằng máy tính khác đã hiểu và xử lý request của nó?" Đây chính là core problem mà status codes giải quyết.


### Problem Statement Chi Tiết


Trước khi có HTTP status codes, việc communication giữa client và server rất primitive. Imagine một thế giới mà khi bạn gửi request, bạn chỉ nhận được:


- Hoặc là response data
- Hoặc là... không có gì cả


Không có cách nào để distinguish giữa:


- "Server đang xử lý, hãy đợi"
- "Data không tồn tại"
- "Bạn không có permission"
- "Server bị crash"
- "Request syntax sai"


### Alternative Solutions & Trade-offs


**Cách 1: Embedded Status trong Response Body**


```javascript
// Hypothetical alternative - embed status in response
{
  "status": "error",
  "message": "Not found",
  "data": null
}
```


**Problems với approach này:**


- Không standardized across servers
- Browsers không thể handle uniformly
- Caching mechanisms không biết cách interpret
- Network infrastructure (proxies, CDNs) không hiểu


**Cách 2: Custom Headers cho Status**


```http
X-Custom-Status: ERROR_NOT_FOUND
X-Custom-Code: 1001
```


**Problems:**


- Không có industry standard
- Mỗi company tự định nghĩa
- Debugging nightmare
- Tooling support limited


**💡 Aha Moment**: HTTP status codes giải quyết bằng cách tạo ra một **universal language** - một standard mà tất cả browsers, servers, proxies, CDNs đều hiểu.


## 🔬 Bản Chất & Mechanism: HTTP Status Codes Hoạt Động Như Thế Nào?


### Core Algorithm Explanation


HTTP status codes hoạt động theo một pattern rất elegant:


```
[1 digit category][2 digits specific code]
```


**Category System (First Digit)**:


- 1xx: "Tôi đã nhận được, đang xử lý..."
- 2xx: "Success! Đây là kết quả"
- 3xx: "Tôi cần redirect bạn đi chỗ khác"
- 4xx: "Bạn đã làm gì đó sai"
- 5xx: "Tôi (server) có vấn đề"


### Data Structure Breakdown


Ở browser level, status code được store như một integer:


```javascript
// Browser internal representation (simplified)
class HTTPResponse {
  constructor() {
    this.status = 0;        // Integer: 200, 404, 500...
    this.statusText = "";   // String: "OK", "Not Found"...
    this.headers = new Map();
    this.body = null;
  }
}
```


### Memory Model Analysis


**💭 Think Out Loud**: Khi tôi đầu tiên học về HTTP, tôi confused về việc tại sao cần cả `status` (number) lẫn `statusText` (string). Aha moment của tôi là nhận ra:


- `status` cho machines (easy comparison, routing logic)
- `statusText` cho humans (debugging, logging)


### Step-by-step Execution Flow


```
1. Browser tạo HTTP request
2. Server receives & processes
3. Server determines outcome
4. Server maps outcome → status code
5. Server constructs response với status code
6. Browser receives response
7. Browser checks status code FIRST
8. Browser decides next action based on status
9. Browser executes appropriate handler
```


**Deep Dive vào Browser Decision Tree:**


```javascript
// Browser internal logic (simplified)
function handleResponse(response) {
  const status = response.status;

  if (status >= 100 && status < 200) {
    // Informational - keep waiting
    return continuePendingRequest();
  }

  if (status >= 200 && status < 300) {
    // Success - process response body
    return processSuccessResponse(response);
  }

  if (status >= 300 && status < 400) {
    // Redirection - follow redirect
    return handleRedirect(response);
  }

  if (status >= 400 && status < 500) {
    // Client error - show error to user
    return handleClientError(response);
  }

  if (status >= 500 && status < 600) {
    // Server error - retry or show error
    return handleServerError(response);
  }
}
```


## 📖 PHẦN CƠ BẢN (Foundation Level): Chi Tiết Từng Status Code


### 🔍 1xx Status Codes - "Processing, Please Wait..."


#### 100 Continue - The Handshake Protocol


**🌱 Nguồn Gốc**:
Tưởng tượng bạn muốn upload một file 1GB. Nếu server không accept file type này, bạn đã waste bandwidth upload toàn bộ file rồi mới biết bị reject. Status 100 giải quyết điều này.


**🔬 Mechanism**:


```http
POST /upload HTTP/1.1
Host: example.com
Content-Length: 1073741824
Expect: 100-continue

[Client waits here...]

HTTP/1.1 100 Continue

[Now client sends the actual body]
```


**💡 Real-world Scenario tại Binance**:
Khi users upload KYC documents (thường rất lớn), chúng tôi sử dụng `Expect: 100-continue` để:


1. Validate user permissions trước
2. Check file type allowed hay không
3. Verify storage quota
4. Chỉ khi OK mới cho client upload actual file


**⚙️ Implementation trong Frontend**:


```javascript
// Fetch API không support 100-continue directly
// Nhưng bạn có thể simulate:

async function uploadLargeFile(file) {
  // Step 1: Pre-flight check
  const preflightResponse = await fetch('/upload/preflight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
      type: file.type
    })
  });

  if (preflightResponse.status !== 200) {
    throw new Error('Upload không được phép');
  }

  // Step 2: Actual upload
  return await fetch('/upload', {
    method: 'POST',
    body: file
  });
}
```


**🎯 Interview Question**:
"Tại sao không phải lúc nào cũng sử dụng 100 Continue cho mọi POST request?"


**Answer**: Vì có overhead - mỗi request cần 2 round trips thay vì 1. Chỉ beneficial cho large payloads hoặc expensive processing.


### 🔍 2xx Success Codes - "Mission Accomplished!"


#### 200 OK - The Universal Success


**🌱 Nguồn Gốc**:
Đây là "default success" - equivalent với "Yes!" trong human communication.


**🔬 Deep Mechanism**:


```javascript
// Browser behavior với 200 OK
if (response.status === 200) {
  // 1. Cache response (nếu cache headers allow)
  if (response.headers.get('Cache-Control') !== 'no-cache') {
    browserCache.store(request.url, response);
  }

  // 2. Update browser history
  if (request.method === 'GET') {
    history.pushState(null, '', request.url);
  }

  // 3. Process response body
  const contentType = response.headers.get('Content-Type');
  if (contentType.includes('application/json')) {
    return response.json();
  } else if (contentType.includes('text/html')) {
    return response.text();
  }
}
```


**💭 Common Misconception**: Nhiều developers nghĩ 200 OK có nghĩa là "everything is perfect". Thực tế, 200 chỉ có nghĩa là "HTTP request được xử lý successfully", business logic bên trong có thể vẫn fail.


**Example từ Webflow**:


```javascript
// API response với status 200 nhưng business logic error
fetch('/api/publish-site')
  .then(response => {
    if (response.status === 200) {
      return response.json();
    }
  })
  .then(data => {
    // data có thể là:
    // { success: false, error: "Domain not verified" }
    // HTTP level: success (200)
    // Business level: failure

    if (!data.success) {
      throw new Error(data.error);
    }
  });
```


#### 201 Created - "I Made Something New!"


**🌱 Nguồn Gốc**:
Khi REST APIs được standardize, cần cách để distinguish giữa "I updated existing resource" (200) vs "I created new resource" (201).


**🔬 Critical Implementation Details**:


```javascript
// Server-side logic cho 201
app.post('/api/users', async (req, res) => {
  const newUser = await User.create(req.body);

  res.status(201)
     .header('Location', `/api/users/${newUser.id}`) // IMPORTANT!
     .json(newUser);
});

// Client-side handling
const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(userData)
});

if (response.status === 201) {
  // Lấy URL của resource vừa tạo
  const location = response.headers.get('Location');
  console.log(`New user created at: ${location}`);
}
```


**💡 Production Insight từ NAB**:
Trong banking systems, việc distinguish giữa 200 vs 201 critical cho audit logs. 201 indicate "new transaction created", 200 indicate "existing transaction updated".


**🎯 Common Interview Trap**:
Q: "Khi nào return 201 thay vì 200?"
Wrong Answer: "Khi create new record"
Right Answer: "Khi create new resource VÀ muốn client biết location của resource đó để có thể access sau này"


#### 202 Accepted - "I'll Get Back To You"


**🌱 Nguồn Gốc**:
Async processing patterns. Khi operation takes too long để complete trong single HTTP request.


**🔬 Real-world Implementation Pattern**:


```javascript
// Server accepts job và return ngay lập tức
app.post('/api/video/process', async (req, res) => {
  const jobId = generateUniqueId();

  // Queue job for async processing
  await jobQueue.add('video-processing', {
    jobId,
    videoFile: req.body.videoFile,
    options: req.body.options
  });

  res.status(202)
     .header('Location', `/api/jobs/${jobId}`)
     .json({
       jobId,
       status: 'processing',
       statusUrl: `/api/jobs/${jobId}`
     });
});

// Client polling pattern
async function processVideoWithPolling(videoData) {
  // Submit job
  const submitResponse = await fetch('/api/video/process', {
    method: 'POST',
    body: JSON.stringify(videoData)
  });

  if (submitResponse.status !== 202) {
    throw new Error('Job submission failed');
  }

  const jobInfo = await submitResponse.json();

  // Poll for completion
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      const statusResponse = await fetch(jobInfo.statusUrl);
      const status = await statusResponse.json();

      if (status.state === 'completed') {
        clearInterval(pollInterval);
        resolve(status.result);
      } else if (status.state === 'failed') {
        clearInterval(pollInterval);
        reject(new Error(status.error));
      }
      // Continue polling nếu still processing
    }, 1000);
  });
}
```


**💭 Advanced Pattern từ Figma**:
Chúng tôi sử dụng 202 cho file imports. User upload file → 202 với job ID → WebSocket connection để real-time updates instead of polling.


#### 203 Non-Authoritative Information - "I'm Relaying This"


**⚠️ Correction**: Trong original list có lỗi "Become, but not authorized". Đúng phải là "Non-Authoritative Information".


**🌱 Nguồn Gốc**:
Khi response đi qua proxy server và proxy modify response trước khi forward về client.


**🔬 Mechanism**:


```
Client → Proxy → Origin Server
              ↑
         Proxy modifies
         response headers
              ↓
Client ← Proxy (203) ← Origin Server (200)
```


**Real Example**:


```javascript
// Origin server returns:
HTTP/1.1 200 OK
Content-Type: application/json
{"data": "sensitive info"}

// Proxy intercepts và modifies:
HTTP/1.1 203 Non-Authoritative Information
Content-Type: application/json
X-Filtered-By: Corporate-Proxy
{"data": "[REDACTED]"}
```


**💡 Production Scenario tại Axon**:
Law enforcement agencies sử dụng proxies để filter sensitive data trước khi serve to officers với different clearance levels.


#### 204 No Content - "Done, But Nothing to Say"


**🌱 Nguồn Gốc**:
Common pattern: DELETE operations, PUT updates, configuration changes - operations successful nhưng không cần return data.


**🔬 Browser Behavior với 204**:


```javascript
// Browser sẽ KHÔNG update page content với 204
// Page stays exactly the same
fetch('/api/settings', {
  method: 'PUT',
  body: JSON.stringify({ theme: 'dark' })
})
.then(response => {
  if (response.status === 204) {
    // response.body sẽ là null hoặc empty
    // Đây là expected behavior
    console.log('Settings updated successfully');
    // Manual UI update required
    updateThemeUI('dark');
  }
});
```


**⚙️ Critical Implementation Pattern**:


```javascript
// DELETE endpoint
app.delete('/api/posts/:id', async (req, res) => {
  await Post.deleteById(req.params.id);

  // DON'T return deleted object
  // Just confirm deletion happened
  res.status(204).end(); // .end() important - no body
});

// Client-side
async function deletePost(postId) {
  const response = await fetch(`/api/posts/${postId}`, {
    method: 'DELETE'
  });

  if (response.status === 204) {
    // Remove from UI immediately
    document.getElementById(`post-${postId}`).remove();

    // Update counters, etc.
    updatePostCount(-1);
  }
}
```


**💭 Common Mistake**: Developers thường return data với 204. Đây là violation của HTTP spec. 204 means explicitly "no content in response body".


#### 205 Reset Content - "Refresh Your Form"


**🌱 Nguồn Gốc**:
Specific use case: form submissions where server muốn client clear form after successful submit.


**🔬 Browser Expected Behavior**:


```javascript
// Server response
HTTP/1.1 205 Reset Content

// Browser should automatically:
// 1. Clear all form fields
// 2. Reset to initial state
// 3. Focus on first field (optional)
```


**⚙️ Modern Implementation** (since browsers don't auto-reset):


```javascript
// Manual implementation
async function submitForm(formData) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    body: formData
  });

  if (response.status === 205) {
    // Server explicitly requests form reset
    document.getElementById('contact-form').reset();

    // Focus first field
    document.querySelector('input[type="text"]').focus();

    // Show success message
    showNotification('Message sent! Form has been reset for next entry.');
  }
}
```


**💡 Real Use Case**: Contact forms, survey submissions, data entry forms where user likely wants to enter multiple entries sequentially.


#### 206 Partial Content - "Here's Part Of What You Asked For"


**🌱 Nguồn Gốc**:
Video streaming, large file downloads, resume interrupted downloads.


**🔬 Advanced Implementation**:


```javascript
// Client request với Range header
fetch('/api/video.mp4', {
  headers: {
    'Range': 'bytes=1024000-2048000' // Request bytes 1MB to 2MB
  }
})
.then(response => {
  if (response.status === 206) {
    const contentRange = response.headers.get('Content-Range');
    // "bytes 1024000-2048000/50000000"

    const [range, total] = contentRange.split('/');
    const [start, end] = range.split(' ')[1].split('-');

    console.log(`Received bytes ${start}-${end} of ${total}`);

    return response.arrayBuffer();
  }
});
```


**🏭 Production Implementation từ Video Platform**:


```javascript
class VideoStreamer {
  constructor(videoUrl) {
    this.videoUrl = videoUrl;
    this.chunks = new Map();
    this.chunkSize = 1024 * 1024; // 1MB chunks
  }

  async getChunk(chunkIndex) {
    if (this.chunks.has(chunkIndex)) {
      return this.chunks.get(chunkIndex);
    }

    const start = chunkIndex * this.chunkSize;
    const end = start + this.chunkSize - 1;

    const response = await fetch(this.videoUrl, {
      headers: {
        'Range': `bytes=${start}-${end}`
      }
    });

    if (response.status === 206) {
      const chunk = await response.arrayBuffer();
      this.chunks.set(chunkIndex, chunk);
      return chunk;
    } else if (response.status === 416) {
      // Range not satisfiable - we've hit end of file
      return null;
    }

    throw new Error(`Unexpected status: ${response.status}`);
  }

  async streamToVideo(videoElement) {
    const mediaSource = new MediaSource();
    videoElement.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer('video/mp4');

      let chunkIndex = 0;
      while (true) {
        const chunk = await this.getChunk(chunkIndex);
        if (!chunk) break; // End of file

        await new Promise(resolve => {
          sourceBuffer.addEventListener('updateend', resolve, { once: true });
          sourceBuffer.appendBuffer(chunk);
        });

        chunkIndex++;
      }

      mediaSource.endOfStream();
    });
  }
}
```


### 🔍 3xx Redirection Codes - "Look Over There!"


#### 301 Moved Permanently - "This Address Changed Forever"


**🌱 Nguồn Gốc**:
Website restructuring, domain changes, permanent URL updates. Tells both browsers và search engines: "Update your bookmarks!"


**🔬 SEO & Browser Implications**:


```javascript
// Browser behavior với 301:
// 1. Update browser cache permanently
// 2. Future requests go directly to new URL
// 3. Update history entry
// 4. Pass search engine authority to new URL

// Server implementation
app.get('/old-path', (req, res) => {
  res.status(301)
     .header('Location', '/new-path')
     .end();
});
```


**💡 Production Pattern từ E-commerce Site**:


```javascript
// URL structure migration
const urlMigrations = {
  '/products/shoes': '/footwear',
  '/products/shirts': '/apparel/shirts',
  '/blog/old-post': '/articles/new-post'
};

app.use((req, res, next) => {
  if (urlMigrations[req.path]) {
    return res.status(301)
              .header('Location', urlMigrations[req.path])
              .end();
  }
  next();
});
```


**⚠️ Critical Gotcha**: 301 được browsers cache indefinitely. Nếu accidentally set sai location, rất khó để undo.


**🎯 Debug Story từ Production**:
Tại Webflow, chúng tôi accidentally set 301 redirect từ `/pricing` → `/pricing-old`. Sau khi fix, users vẫn không thể access `/pricing` vì browser cache. Phải clear browser data hoặc wait cache expire.


#### 302 Found (Temporary Redirect) - "Temporarily Look Over There"


**🌱 Nguồn Gốc**:
Maintenance pages, A/B testing, temporary promotions.


**🔬 Key Difference vs 301**:


```javascript
// 302 behavior:
// 1. Browser KHÔNG cache redirect
// 2. Search engines KHÔNG transfer authority
// 3. Original URL remains in search results

// A/B testing implementation
app.get('/landing', (req, res) => {
  const variant = Math.random() > 0.5 ? 'A' : 'B';

  res.status(302)
     .header('Location', `/landing-${variant}`)
     .header('Cache-Control', 'no-cache') // Prevent caching
     .end();
});
```


**💭 Advanced Pattern**:


```javascript
// User-specific redirects
app.get('/dashboard', authenticateUser, (req, res) => {
  if (req.user.accountType === 'premium') {
    return res.status(302)
              .header('Location', '/premium-dashboard')
              .end();
  }

  if (req.user.needsOnboarding) {
    return res.status(302)
              .header('Location', '/onboarding')
              .end();
  }

  // Default dashboard
  next();
});
```


#### 304 Not Modified - "You Already Have The Latest Version"


**🌱 Nguồn Gốc**:
HTTP caching optimization. Server tells browser: "Your cached version is still valid, use it!"


**🔬 Conditional Request Mechanism**:


```javascript
// Browser's automatic behavior:
// 1. First request - server returns 200 with ETag
// 2. Subsequent requests - browser includes If-None-Match
// 3. Server compares ETag
// 4. If same → 304, if different → 200 with new content

// Server implementation
app.get('/api/profile', (req, res) => {
  const user = getCurrentUser(req);
  const currentETag = generateETag(user);

  // Check if client has current version
  if (req.headers['if-none-match'] === currentETag) {
    return res.status(304).end(); // No body with 304!
  }

  // Client doesn't have current version
  res.status(200)
     .header('ETag', currentETag)
     .header('Cache-Control', 'private, max-age=0')
     .json(user);
});
```


**⚙️ Advanced Cache Strategy**:


```javascript
// Client-side cache handling
class APICache {
  constructor() {
    this.cache = new Map();
  }

  async get(url) {
    const cached = this.cache.get(url);

    const headers = {};
    if (cached && cached.etag) {
      headers['If-None-Match'] = cached.etag;
    }

    const response = await fetch(url, { headers });

    if (response.status === 304) {
      // Use cached data
      return cached.data;
    }

    if (response.status === 200) {
      const data = await response.json();
      const etag = response.headers.get('ETag');

      // Update cache
      this.cache.set(url, { data, etag });

      return data;
    }

    throw new Error(`Unexpected status: ${response.status}`);
  }
}
```


**💡 Performance Impact**: 304 responses save ~95% bandwidth compared to full responses. Critical cho mobile users.


#### 305 Use Proxy - "Go Through This Proxy"


**⚠️ Deprecated**: Removed in HTTP/1.1 due to security concerns. Mentioned for historical completeness.


### 🔍 4xx Client Error Codes - "You Did Something Wrong"


#### 400 Bad Request - "I Don't Understand What You're Asking"


**🌱 Nguồn Gốc**:
Generic client error. Request syntax malformed, invalid JSON, missing required fields.


**🔬 Common Causes & Solutions**:


```javascript
// Cause 1: Invalid JSON
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{ "name": "John" invalid json }'  // Syntax error
});
// Result: 400 Bad Request

// Cause 2: Wrong Content-Type
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' }, // Wrong!
  body: JSON.stringify({ name: 'John' })
});

// Cause 3: Missing required fields
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'john@example.com' }) // Missing 'name'
});
```


**⚙️ Server-side Validation Pattern**:


```javascript
app.post('/api/users', (req, res) => {
  // Validation schema
  const schema = {
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    age: { required: false, type: 'number', min: 0, max: 150 }
  };

  const validation = validateRequest(req.body, schema);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid request data',
      details: validation.errors // Specific field errors
    });
  }

  // Process valid request...
});
```


**💭 Debug Strategy**:


```javascript
// Client-side error handling
async function createUser(userData) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response.status === 400) {
      const errorData = await response.json();

      // Log để debug
      console.error('400 Bad Request Details:', {
        requestData: userData,
        serverErrors: errorData.details,
        requestHeaders: response.request?.headers
      });

      // Show user-friendly errors
      displayValidationErrors(errorData.details);
      return;
    }

    // Handle success...
  } catch (networkError) {
    // Network issues vs HTTP errors
    console.error('Network error:', networkError);
  }
}
```


#### 401 Unauthorized - "Who Are You?"


**🌱 Nguồn Gốc**:
Authentication required nhưng không provided hoặc invalid.


**🔬 Authentication Flow**:


```javascript
// Modern JWT pattern
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401)
              .header('WWW-Authenticate', 'Bearer realm="API"')
              .json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (jwtError) {
    return res.status(401)
              .header('WWW-Authenticate', 'Bearer realm="API"')
              .json({
                error: 'Invalid token',
                details: jwtError.message
              });
  }
});
```


**⚙️ Client-side Token Management**:


```javascript
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async makeAuthenticatedRequest(url, options = {}) {
    // Add auth header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token expired, try refresh
      const refreshed = await this.refreshAuthToken();

      if (refreshed) {
        // Retry original request với new token
        headers['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(url, { ...options, headers });
      } else {
        // Refresh failed, redirect to login
        this.redirectToLogin();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  async refreshAuthToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.status === 200) {
        const data = await response.json();
        this.token = data.accessToken;
        this.refreshToken = data.refreshToken;

        localStorage.setItem('authToken', this.token);
        localStorage.setItem('refreshToken', this.refreshToken);

        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  redirectToLogin() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}
```


**💡 Production Pattern từ Banking App**:


```javascript
// Automatic logout after 401
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.status === 401) {
    // Auto logout cho security
    authManager.logout();
    showSecurityAlert('Session expired for security reasons');
  }
});
```


#### 403 Forbidden - "I Know Who You Are, But You Can't Do This"


**🌱 Nguồn Gốc**:
User authenticated nhưng không có permission cho specific resource/action.


**🔬 Authorization vs Authentication**:


```
401: "I don't know who you are" (Authentication failed)
403: "I know who you are, but you're not allowed" (Authorization failed)
```


**⚙️ Role-based Access Control**:


```javascript
// Server-side authorization
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.roles.includes(requiredRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredRole,
        current: req.user.roles
      });
    }

    next();
  };
};

// Usage
app.delete('/api/users/:id',
  authenticate,           // First: who are you?
  authorize('admin'),     // Then: are you allowed?
  deleteUser             // Finally: do the action
);
```


**💭 Advanced Permission System**:


```javascript
// Resource-level permissions
class PermissionChecker {
  static async canAccessResource(user, resourceType, resourceId, action) {
    // Check role-based permissions
    if (user.roles.includes('admin')) return true;

    // Check resource ownership
    if (action === 'read' || action === 'update') {
      const resource = await getResource(resourceType, resourceId);
      if (resource.ownerId === user.id) return true;
    }

    // Check team permissions
    if (user.teamId) {
      const teamResource = await getTeamResource(resourceType, resourceId);
      if (teamResource.teamId === user.teamId) {
        return teamResource.permissions.includes(action);
      }
    }

    return false;
  }
}

// Middleware usage
app.get('/api/documents/:id', authenticate, async (req, res) => {
  const canAccess = await PermissionChecker.canAccessResource(
    req.user,
    'document',
    req.params.id,
    'read'
  );

  if (!canAccess) {
    return res.status(403).json({
      error: 'Access denied to this document'
    });
  }

  // Proceed với request...
});
```


**🎯 Client-side Permission Handling**:


```javascript
// Progressive disclosure based on permissions
class UIPermissions {
  constructor(userPermissions) {
    this.permissions = userPermissions;
  }

  canShow(element) {
    const requiredPermission = element.dataset.permission;
    return this.permissions.includes(requiredPermission);
  }

  hideUnauthorizedElements() {
    document.querySelectorAll('[data-permission]').forEach(element => {
      if (!this.canShow(element)) {
        element.style.display = 'none';
      }
    });
  }

  async handleForbiddenResponse(response) {
    if (response.status === 403) {
      const errorData = await response.json();

      showPermissionDeniedModal({
        message: errorData.error,
        requiredRole: errorData.required,
        currentRoles: errorData.current,
        suggestedAction: 'Contact administrator for access'
      });

      return true; // Handled
    }
    return false; // Not handled
  }
}
```


#### 404 Not Found - "That Doesn't Exist Here"


**🌱 Nguồn Gốc**:
Most famous HTTP status code! Resource không tồn tại tại URL được request.


**🔬 Different Types of "Not Found"**:


```javascript
// 1. Resource never existed
GET /api/users/99999999 → 404

// 2. Resource existed but was deleted
GET /api/posts/deleted-post-id → 404 (or 410 Gone)

// 3. Invalid URL pattern
GET /api/usssers → 404 (typo in endpoint)

// 4. Missing file
GET /images/non-existent.jpg → 404
```


**⚙️ Smart 404 Handling**:


```javascript
// Server-side with helpful suggestions
app.use((req, res) => {
  // This runs if no other routes matched

  const suggestions = findSimilarRoutes(req.path);

  res.status(404).json({
    error: 'Not Found',
    requestedPath: req.path,
    message: 'The requested resource was not found',
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    timestamp: new Date().toISOString()
  });
});

function findSimilarRoutes(path) {
  const routes = ['/api/users', '/api/posts', '/api/comments'];

  return routes.filter(route => {
    // Simple similarity check (Levenshtein distance could be better)
    const similarity = calculateSimilarity(path, route);
    return similarity > 0.7;
  });
}
```


**💡 Client-side 404 Recovery**:


```javascript
class ResourceManager {
  async fetchWithFallback(primaryUrl, fallbackUrls = []) {
    try {
      const response = await fetch(primaryUrl);

      if (response.status === 404 && fallbackUrls.length > 0) {
        console.warn(`404 on ${primaryUrl}, trying fallbacks...`);

        for (const fallbackUrl of fallbackUrls) {
          try {
            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) {
              return fallbackResponse;
            }
          } catch (fallbackError) {
            console.warn(`Fallback ${fallbackUrl} also failed`);
          }
        }
      }

      return response;
    } catch (networkError) {
      throw new Error(`Network error: ${networkError.message}`);
    }
  }
}

// Usage
const manager = new ResourceManager();

// Try primary CDN, fallback to backup CDN, then origin server
const imageResponse = await manager.fetchWithFallback(
  'https://cdn1.example.com/image.jpg',
  [
    'https://cdn2.example.com/image.jpg',
    'https://origin.example.com/image.jpg'
  ]
);
```


**🎯 SEO-friendly 404 Pages**:


```javascript
// SPA 404 handling
class SPARouter {
  handleNotFound(path) {
    // Update URL without page reload
    history.replaceState(null, '404 - Not Found', path);

    // Show 404 component with helpful content
    this.render404Page({
      requestedPath: path,
      suggestions: this.getSuggestedPages(path),
      searchEnabled: true,
      reportLink: `/report-broken-link?url=${encodeURIComponent(path)}`
    });

    // Track 404s for analytics
    analytics.track('404_error', {
      path: path,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });
  }

  getSuggestedPages(path) {
    // Intelligent suggestions based on site structure
    if (path.includes('/blog/')) {
      return ['/blog', '/blog/recent', '/blog/popular'];
    }

    if (path.includes('/products/')) {
      return ['/products', '/categories', '/search'];
    }

    return ['/home', '/sitemap', '/search'];
  }
}
```


### 🔍 5xx Server Error Codes - "I Messed Up"


#### 500 Internal Server Error - "Something Went Wrong On My End"


**🌱 Nguồn Gốc**:
Generic server error. Code execution failed, uncaught exceptions, database errors.


**🔬 Error Handling Hierarchy**:


```javascript
// Server-side error boundary
app.use((error, req, res, next) => {
  // Log error for debugging
  console.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  // Don't expose internal error details to client
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      requestId: generateRequestId() // For support tracking
    });
  } else {
    // Development: show full error details
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: error.stack
    });
  }
});
```


**⚙️ Graceful Error Recovery**:


```javascript
// Circuit breaker pattern
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage
const dbCircuitBreaker = new CircuitBreaker();

app.get('/api/users', async (req, res) => {
  try {
    const users = await dbCircuitBreaker.execute(() => {
      return database.query('SELECT * FROM users');
    });

    res.json(users);
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      // Database is down, use cache
      const cachedUsers = await cache.get('users');
      if (cachedUsers) {
        return res.json(cachedUsers);
      }
    }

    res.status(500).json({ error: 'Service temporarily unavailable' });
  }
});
```


**💡 Client-side Retry Strategy**:


```javascript
class RetryableRequest {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async fetch(url, options = {}) {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url, options);

        if (response.status === 500 && attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, attempt);
          console.warn(`500 error, retrying in ${delay}ms (attempt ${attempt + 1})`);

          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        return response;
      } catch (networkError) {
        if (attempt === this.maxRetries) {
          throw networkError;
        }

        const delay = this.baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }
}
```


## 🏭 PHẦN TRUNG CẤP (Senior Level): Advanced Patterns & Production Considerations


### 💭 Deep Understanding Process - Senior Developer Perspective


**Khi tôi đầu tiên gặp HTTP status codes tại NAB**, tôi confused về việc khi nào sử dụng 400 vs 422. Aha moment của tôi là nhận ra:


- 400: "I can't parse your request" (syntax level)
- 422: "I understand your request but can't process it" (semantic level)


```javascript
// Example: Payment processing
app.post('/api/payments', (req, res) => {
  // 400: Invalid JSON, missing Content-Type
  if (!req.is('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }

  // 422: Valid JSON but business rule violations
  if (req.body.amount <= 0) {
    return res.status(422).json({
      error: 'Invalid payment amount',
      details: 'Amount must be greater than 0'
    });
  }

  if (req.body.amount > req.user.accountBalance) {
    return res.status(422).json({
      error: 'Insufficient funds',
      available: req.user.accountBalance,
      requested: req.body.amount
    });
  }
});
```


### 🔍 Advanced Status Code Patterns


#### Conditional Status Codes


**Pattern từ Figma**: Bulk operations với mixed results


```javascript
// Bulk user update với detailed results
app.post('/api/users/bulk-update', async (req, res) => {
  const results = [];
  let hasSuccesses = false;
  let hasFailures = false;

  for (const update of req.body.updates) {
    try {
      const user = await User.findById(update.id);
      if (!user) {
        results.push({
          id: update.id,
          status: 404,
          error: 'User not found'
        });
        hasFailures = true;
        continue;
      }

      if (!canUserUpdate(req.user, user)) {
        results.push({
          id: update.id,
          status: 403,
          error: 'Insufficient permissions'
        });
        hasFailures = true;
        continue;
      }

      await user.update(update.data);
      results.push({
        id: update.id,
        status: 200,
        data: user
      });
      hasSuccesses = true;

    } catch (error) {
      results.push({
        id: update.id,
        status: 500,
        error: 'Update failed'
      });
      hasFailures = true;
    }
  }

  // Determine overall status
  let overallStatus;
  if (hasSuccesses && !hasFailures) {
    overallStatus = 200; // All succeeded
  } else if (!hasSuccesses && hasFailures) {
    overallStatus = 400; // All failed
  } else {
    overallStatus = 207; // Multi-Status (partial success)
  }

  res.status(overallStatus).json({
    results,
    summary: {
      total: req.body.updates.length,
      successful: results.filter(r => r.status < 300).length,
      failed: results.filter(r => r.status >= 400).length
    }
  });
});
```


#### Status Code Negotiation


**Advanced Pattern từ API Gateway**:


```javascript
// Content negotiation affects status codes
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const acceptsJson = req.accepts('json');
    const acceptsHtml = req.accepts('html');

    if (acceptsHtml && !acceptsJson) {
      // Browser request → redirect to user-friendly 404 page
      return res.status(302)
                .header('Location', '/404?resource=user')
                .end();
    } else {
      // API request → JSON error
      return res.status(404).json({ error: 'User not found' });
    }
  }

  // User exists, check if it's been modified
  const clientETag = req.headers['if-none-match'];
  const currentETag = generateETag(user);

  if (clientETag === currentETag) {
    return res.status(304).end();
  }

  res.status(200)
     .header('ETag', currentETag)
     .json(user);
});
```


### 🎯 Performance Implications của Status Codes


#### Browser Caching Behavior


```javascript
// Status code directly affects caching strategy
const cachingMiddleware = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Modify caching headers based on status
    switch (res.statusCode) {
      case 200:
        // Cache successful responses
        res.header('Cache-Control', 'public, max-age=300');
        break;

      case 404:
        // Cache 404s briefly to prevent repeated requests
        res.header('Cache-Control', 'public, max-age=60');
        break;

      case 500:
        // Never cache server errors
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        break;

      case 401:
      case 403:
        // Don't cache auth errors
        res.header('Cache-Control', 'private, no-cache');
        break;
    }

    return originalJson.call(this, data);
  };

  next();
};
```


#### CDN Behavior với Status Codes


**Real scenario từ Binance**: CDN caching strategy based on status codes


```javascript
// CDN configuration mapping
const cdnConfig = {
  // Cache successful responses aggressively
  200: { ttl: 3600, edge: true, browser: 300 },

  // Cache redirects shortly
  301: { ttl: 86400, edge: true, browser: 3600 },
  302: { ttl: 300, edge: true, browser: 0 },

  // Cache 404s briefly to protect origin
  404: { ttl: 60, edge: true, browser: 0 },

  // Never cache errors
  500: { ttl: 0, edge: false, browser: 0 },
  502: { ttl: 0, edge: false, browser: 0 },
  503: { ttl: 0, edge: false, browser: 0 }
};

// Origin server hints for CDN
app.use((req, res, next) => {
  const originalStatus = res.status;

  res.status = function(code) {
    const config = cdnConfig[code];
    if (config) {
      if (config.edge) {
        res.header('CDN-Cache-Control', `max-age=${config.ttl}`);
      } else {
        res.header('CDN-Cache-Control', 'no-cache');
      }

      if (config.browser > 0) {
        res.header('Cache-Control', `public, max-age=${config.browser}`);
      } else {
        res.header('Cache-Control', 'no-cache');
      }
    }

    return originalStatus.call(this, code);
  };

  next();
});
```


### 🛠️ Advanced Debugging Strategies


#### Status Code Analytics & Monitoring


**Production monitoring từ Axon**:


```javascript
class StatusCodeMonitor {
  constructor() {
    this.counters = new Map();
    this.responseTimesByStatus = new Map();
    this.alertThresholds = {
      4xx: 0.05, // 5% client errors
      5xx: 0.01  // 1% server errors
    };
  }

  recordResponse(statusCode, responseTime, route) {
    const key = `${route}:${statusCode}`;

    if (!this.counters.has(key)) {
      this.counters.set(key, 0);
    }
    this.counters.set(key, this.counters.get(key) + 1);

    if (!this.responseTimesByStatus.has(statusCode)) {
      this.responseTimesByStatus.set(statusCode, []);
    }
    this.responseTimesByStatus.get(statusCode).push(responseTime);

    this.checkAlerts(route);
  }

  checkAlerts(route) {
    const routeStats = this.getRouteStats(route);

    // Alert on high error rates
    if (routeStats.errorRate4xx > this.alertThresholds['4xx']) {
      this.sendAlert(`High 4xx error rate on ${route}: ${routeStats.errorRate4xx * 100}%`);
    }

    if (routeStats.errorRate5xx > this.alertThresholds['5xx']) {
      this.sendAlert(`High 5xx error rate on ${route}: ${routeStats.errorRate5xx * 100}%`);
    }

    // Alert on slow 5xx responses (indicates server strain)
    const avg5xxTime = this.getAverageResponseTime(500);
    if (avg5xxTime > 10000) { // 10 seconds
      this.sendAlert(`Slow server error responses: ${avg5xxTime}ms average`);
    }
  }

  getRouteStats(route) {
    let total = 0;
    let count4xx = 0;
    let count5xx = 0;

    for (const [key, count] of this.counters.entries()) {
      if (key.startsWith(route + ':')) {
        const statusCode = parseInt(key.split(':')[1]);
        total += count;

        if (statusCode >= 400 && statusCode < 500) {
          count4xx += count;
        } else if (statusCode >= 500) {
          count5xx += count;
        }
      }
    }

    return {
      total,
      errorRate4xx: total > 0 ? count4xx / total : 0,
      errorRate5xx: total > 0 ? count5xx / total : 0
    };
  }
}

// Express middleware
const monitor = new StatusCodeMonitor();

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitor.recordResponse(res.statusCode, responseTime, req.route?.path || req.path);
  });

  next();
});
```


#### Client-side Status Code Debugging


```javascript
// Advanced client-side debugging
class HTTPDebugger {
  constructor() {
    this.requests = [];
    this.statusPatterns = new Map();
    this.enabled = localStorage.getItem('httpDebug') === 'true';
  }

  logRequest(url, options, response, duration) {
    if (!this.enabled) return;

    const entry = {
      timestamp: Date.now(),
      url,
      method: options.method || 'GET',
      status: response.status,
      statusText: response.statusText,
      duration,
      headers: Object.fromEntries(response.headers.entries()),
      requestHeaders: options.headers || {}
    };

    this.requests.push(entry);
    this.analyzePattern(entry);

    // Keep only last 100 requests
    if (this.requests.length > 100) {
      this.requests.shift();
    }
  }

  analyzePattern(entry) {
    const key = `${entry.method} ${entry.url.split('?')[0]}`;

    if (!this.statusPatterns.has(key)) {
      this.statusPatterns.set(key, {
        200: 0, 201: 0, 204: 0,
        400: 0, 401: 0, 403: 0, 404: 0,
        500: 0, 502: 0, 503: 0
      });
    }

    const pattern = this.statusPatterns.get(key);
    if (pattern[entry.status] !== undefined) {
      pattern[entry.status]++;
    }

    // Detect problematic patterns
    this.detectIssues(key, pattern);
  }

  detectIssues(endpoint, pattern) {
    const total = Object.values(pattern).reduce((sum, count) => sum + count, 0);

    // High 401 rate → auth issues
    if (pattern[401] / total > 0.3) {
      console.warn(`🔐 High 401 rate on ${endpoint} - check authentication`);
    }

    // Consistent 404s → wrong endpoint?
    if (pattern[404] / total > 0.8) {
      console.warn(`❓ Consistent 404s on ${endpoint} - check URL`);
    }

    // Many 500s → server issues
    if (pattern[500] / total > 0.1) {
      console.warn(`💥 High server error rate on ${endpoint}`);
    }
  }

  exportDebugData() {
    return {
      requests: this.requests,
      patterns: Object.fromEntries(this.statusPatterns.entries()),
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    const summary = {
      totalRequests: this.requests.length,
      byStatus: {},
      averageResponseTime: 0,
      slowestRequests: []
    };

    let totalTime = 0;
    const sortedByTime = [...this.requests].sort((a, b) => b.duration - a.duration);

    for (const request of this.requests) {
      summary.byStatus[request.status] = (summary.byStatus[request.status] || 0) + 1;
      totalTime += request.duration;
    }

    summary.averageResponseTime = totalTime / this.requests.length;
    summary.slowestRequests = sortedByTime.slice(0, 5);

    return summary;
  }
}

// Global fetch wrapper for debugging
const debugger = new HTTPDebugger();
const originalFetch = window.fetch;

window.fetch = async function(url, options = {}) {
  const startTime = Date.now();

  try {
    const response = await originalFetch(url, options);
    const duration = Date.now() - startTime;

    debugger.logRequest(url, options, response, duration);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    debugger.logRequest(url, options, {
      status: 0,
      statusText: 'Network Error',
      headers: new Map()
    }, duration);

    throw error;
  }
};

// Console commands for debugging
window.httpDebug = {
  enable: () => {
    localStorage.setItem('httpDebug', 'true');
    debugger.enabled = true;
    console.log('HTTP debugging enabled');
  },

  disable: () => {
    localStorage.setItem('httpDebug', 'false');
    debugger.enabled = false;
    console.log('HTTP debugging disabled');
  },

  summary: () => {
    console.table(debugger.exportDebugData().summary);
  },

  patterns: () => {
    console.table(debugger.exportDebugData().patterns);
  },

  export: () => {
    const data = debugger.exportDebugData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `http-debug-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }
};
```


## 🏆 PHẦN CHUYÊN SÂU (Principal Level): Architecture & Strategic Thinking


### 💭 Principal's Mental Model - Strategic Status Code Decisions


**Khi tôi design APIs tại Figma**, status codes không chỉ là technical detail mà là **communication contract** giữa frontend và backend teams. Mỗi status code choice affects:


1. **Frontend developer experience**
2. **Error handling complexity**
3. **Debugging efficiency**
4. **Monitoring & alerting strategies**
5. **API evolution path**


### 🏗️ Status Code Architecture Patterns


#### Domain-Driven Status Codes


**Concept**: Different domains có different error semantics


```javascript
// Payment domain
class PaymentErrors {
  static INSUFFICIENT_FUNDS = { status: 402, code: 'INSUFFICIENT_FUNDS' };
  static PAYMENT_REQUIRED = { status: 402, code: 'PAYMENT_REQUIRED' };
  static CARD_DECLINED = { status: 402, code: 'CARD_DECLINED' };
  static FRAUD_DETECTED = { status: 451, code: 'FRAUD_DETECTED' }; // Legal reasons
}

// Content domain
class ContentErrors {
  static CONTENT_TOO_LARGE = { status: 413, code: 'CONTENT_TOO_LARGE' };
  static UNSAFE_CONTENT = { status: 451, code: 'UNSAFE_CONTENT' };
  static COPYRIGHT_VIOLATION = { status: 451, code: 'COPYRIGHT_VIOLATION' };
}

// User domain
class UserErrors {
  static EMAIL_ALREADY_EXISTS = { status: 409, code: 'EMAIL_CONFLICT' };
  static USERNAME_TAKEN = { status: 409, code: 'USERNAME_CONFLICT' };
  static ACCOUNT_SUSPENDED = { status: 423, code: 'ACCOUNT_LOCKED' };
}
```


**Implementation Strategy**:


```javascript
// Domain-aware error handler
class DomainErrorHandler {
  constructor() {
    this.domainHandlers = new Map([
      ['payment', new PaymentErrorHandler()],
      ['content', new ContentErrorHandler()],
      ['user', new UserErrorHandler()]
    ]);
  }

  handleError(domain, error, req, res) {
    const handler = this.domainHandlers.get(domain);

    if (handler && handler.canHandle(error)) {
      return handler.handle(error, req, res);
    }

    // Fallback to generic error handling
    return this.handleGenericError(error, req, res);
  }
}

class PaymentErrorHandler {
  canHandle(error) {
    return error.type === 'PaymentError';
  }

  handle(error, req, res) {
    const errorMapping = {
      'InsufficientFunds': PaymentErrors.INSUFFICIENT_FUNDS,
      'CardDeclined': PaymentErrors.CARD_DECLINED,
      'FraudDetected': PaymentErrors.FRAUD_DETECTED
    };

    const errorInfo = errorMapping[error.code] || { status: 500, code: 'PAYMENT_ERROR' };

    res.status(errorInfo.status).json({
      error: errorInfo.code,
      message: error.message,
      domain: 'payment',
      retryable: this.isRetryable(error.code),
      suggestedAction: this.getSuggestedAction(error.code)
    });
  }

  isRetryable(errorCode) {
    const nonRetryableErrors = ['FraudDetected', 'CardDeclined'];
    return !nonRetryableErrors.includes(errorCode);
  }

  getSuggestedAction(errorCode) {
    const actions = {
      'InsufficientFunds': 'Add funds to your account or use a different payment method',
      'CardDeclined': 'Contact your bank or try a different card',
      'FraudDetected': 'Contact customer support for account verification'
    };

    return actions[errorCode] || 'Please try again or contact support';
  }
}
```


#### Microservices Status Code Orchestration


**Challenge**: Multiple services, each with own error conditions


```javascript
// API Gateway status code aggregation
class ServiceOrchestrator {
  async handleCompositeRequest(req, res) {
    const serviceResults = await Promise.allSettled([
      this.userService.getUser(req.params.userId),
      this.paymentService.getPaymentMethods(req.params.userId),
      this.orderService.getRecentOrders(req.params.userId)
    ]);

    const [userResult, paymentResult, orderResult] = serviceResults;

    // Analyze service results
    const analysis = this.analyzeServiceResults({
      user: userResult,
      payment: paymentResult,
      order: orderResult
    });

    return this.respondBasedOnAnalysis(analysis, res);
  }

  analyzeServiceResults(results) {
    const analysis = {
      allSuccessful: true,
      criticalFailures: [],
      minorFailures: [],
      partialData: {}
    };

    // User service is critical
    if (results.user.status === 'rejected') {
      const error = results.user.reason;

      if (error.status === 404) {
        analysis.criticalFailures.push('USER_NOT_FOUND');
      } else if (error.status === 403) {
        analysis.criticalFailures.push('USER_ACCESS_DENIED');
      } else {
        analysis.criticalFailures.push('USER_SERVICE_ERROR');
      }

      analysis.allSuccessful = false;
    } else {
      analysis.partialData.user = results.user.value;
    }

    // Payment service is less critical
    if (results.payment.status === 'rejected') {
      analysis.minorFailures.push('PAYMENT_SERVICE_UNAVAILABLE');
      analysis.allSuccessful = false;
    } else {
      analysis.partialData.payment = results.payment.value;
    }

    // Order service is less critical
    if (results.order.status === 'rejected') {
      analysis.minorFailures.push('ORDER_SERVICE_UNAVAILABLE');
      analysis.allSuccessful = false;
    } else {
      analysis.partialData.order = results.order.value;
    }

    return analysis;
  }

  respondBasedOnAnalysis(analysis, res) {
    // Critical failures → appropriate error status
    if (analysis.criticalFailures.includes('USER_NOT_FOUND')) {
      return res.status(404).json({
        error: 'User not found',
        availableData: null
      });
    }

    if (analysis.criticalFailures.includes('USER_ACCESS_DENIED')) {
      return res.status(403).json({
        error: 'Access denied',
        availableData: null
      });
    }

    if (analysis.criticalFailures.length > 0) {
      return res.status(500).json({
        error: 'Critical service failure',
        failures: analysis.criticalFailures
      });
    }

    // No critical failures
    if (analysis.allSuccessful) {
      return res.status(200).json({
        user: analysis.partialData.user,
        paymentMethods: analysis.partialData.payment,
        recentOrders: analysis.partialData.order
      });
    }

    // Partial success → 200 with warnings
    return res.status(200).json({
      user: analysis.partialData.user,
      paymentMethods: analysis.partialData.payment || null,
      recentOrders: analysis.partialData.order || null,
      warnings: analysis.minorFailures,
      message: 'Some data may be incomplete due to service issues'
    });
  }
}
```


### 🎯 Team Education & Knowledge Transfer Strategies


#### Status Code Decision Framework


**Teaching junior developers decision-making process**:


```javascript
// Decision tree cho status code selection
class StatusCodeDecisionTree {
  static decide(context) {
    const {
      requestValid,
      userAuthenticated,
      userAuthorized,
      resourceExists,
      operationSuccessful,
      dataChanged,
      newResourceCreated,
      locationAvailable
    } = context;

    // Authentication check
    if (!userAuthenticated) {
      return 401;
    }

    // Request validation
    if (!requestValid) {
      return 400; // Bad syntax, malformed JSON, etc.
    }

    // Authorization check
    if (!userAuthorized) {
      return 403;
    }

    // Resource existence (for GET, PUT, DELETE)
    if (!resourceExists && context.method !== 'POST') {
      return 404;
    }

    // Operation success
    if (!operationSuccessful) {
      if (context.conflictReason) {
        return 409; // Resource conflict
      }

      if (context.validationErrors) {
        return 422; // Unprocessable entity
      }

      return 500; // Internal server error
    }

    // Success cases
    if (newResourceCreated) {
      return locationAvailable ? 201 : 200;
    }

    if (dataChanged) {
      return 200;
    }

    if (context.method === 'DELETE' || context.method === 'PUT') {
      return 204; // No content to return
    }

    return 200; // Default success
  }

  // Teaching method: explain reasoning
  static explainDecision(context) {
    const decision = this.decide(context);
    const explanations = {
      401: "User needs to authenticate first",
      400: "Request syntax is invalid",
      403: "User authenticated but lacks permission",
      404: "Requested resource doesn't exist",
      409: "Operation conflicts with current resource state",
      422: "Request valid but business rules prevent processing",
      500: "Server error during processing",
      201: "New resource created successfully",
      200: "Operation successful with data to return",
      204: "Operation successful, no data to return"
    };

    return {
      status: decision,
      reasoning: explanations[decision],
      alternatives: this.getAlternatives(context, decision)
    };
  }
}

// Usage in code reviews
const context = {
  requestValid: true,
  userAuthenticated: true,
  userAuthorized: false,
  resourceExists: true,
  method: 'DELETE'
};

const explanation = StatusCodeDecisionTree.explainDecision(context);
console.log(`Should return ${explanation.status}: ${explanation.reasoning}`);
```


#### Common Interview Questions & Deep Answers


**Q1: "Phân biệt giữa 401 và 403"**


**Junior Answer**: "401 là unauthorized, 403 là forbidden"


**Senior Answer**: "401 indicates authentication required hoặc authentication failed. Server không biết user identity. 403 indicates user đã authenticated nhưng lacks sufficient privileges. Server biết who you are nhưng you can't access this resource."


**Principal Answer**:


```javascript
// 401: "Who are you?" - Identity problem
// Server response should include WWW-Authenticate header
res.status(401)
   .header('WWW-Authenticate', 'Bearer realm="API"')
   .json({ error: 'Authentication required' });

// 403: "I know who you are, but you can't do this" - Permission problem
// No WWW-Authenticate header, authentication won't help
res.status(403)
   .json({
     error: 'Insufficient privileges',
     requiredRole: 'admin',
     currentRole: 'user'
   });

// Real-world complexity: User partially authenticated
// Example: 2FA required
res.status(401)
   .header('WWW-Authenticate', 'OTP realm="2FA"')
   .json({
     error: 'Two-factor authentication required',
     nextStep: '/auth/2fa',
     partialToken: 'xxx'
   });
```


**Q2: "Khi nào sử dụng 204 No Content?"**


**Principal Answer với Production Examples**:


```javascript
// 1. DELETE operations - resource removed
app.delete('/api/posts/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.status(204).end(); // No body
});

// 2. PUT updates - full resource replacement
app.put('/api/users/:id', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.status(204).end(); // Updated, but no need to return updated data
});

// 3. Configuration changes
app.post('/api/settings/theme', async (req, res) => {
  await User.updateTheme(req.user.id, req.body.theme);
  res.status(204).end(); // Setting saved, no content to return
});

// WHEN NOT TO USE 204:
// ❌ When client needs confirmation data
app.post('/api/orders', async (req, res) => {
  const order = await Order.create(req.body);
  // Client needs order ID, confirmation number, etc.
  res.status(201).json(order); // NOT 204
});

// ❌ When operation might have side effects client should know about
app.post('/api/users/:id/follow', async (req, res) => {
  const result = await followUser(req.user.id, req.params.id);
  // Client might need to know: mutual follow? notification sent?
  res.status(200).json(result); // NOT 204
});
```


**Q3: "Explain status code 422 và khi nào sử dụng thay vì 400"**


**Principal Level Analysis**:


```javascript
// 400 Bad Request: Syntax/format errors
app.post('/api/users', (req, res) => {
  // Invalid JSON syntax
  if (!req.is('application/json')) {
    return res.status(400).json({
      error: 'Invalid Content-Type',
      expected: 'application/json'
    });
  }

  try {
    JSON.parse(req.body);
  } catch (e) {
    return res.status(400).json({
      error: 'Invalid JSON syntax',
      details: e.message
    });
  }
});

// 422 Unprocessable Entity: Semantic/business rule errors
app.post('/api/users', validateJSON, (req, res) => {
  const errors = [];

  // Business rule validations
  if (req.body.age < 13) {
    errors.push({
      field: 'age',
      code: 'AGE_RESTRICTION',
      message: 'Users must be at least 13 years old'
    });
  }

  if (await User.emailExists(req.body.email)) {
    errors.push({
      field: 'email',
      code: 'EMAIL_TAKEN',
      message: 'This email is already registered'
    });
  }

  if (errors.length > 0) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Process valid request...
});

// Real-world example từ banking: Money transfer
app.post('/api/transfers', validateJSON, authenticate, (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;

  // 400: Malformed request
  if (!fromAccount || !toAccount || !amount) {
    return res.status(400).json({
      error: 'Missing required fields: fromAccount, toAccount, amount'
    });
  }

  // 422: Business rule violations
  if (amount <= 0) {
    return res.status(422).json({
      error: 'Invalid transfer amount',
      code: 'INVALID_AMOUNT',
      message: 'Amount must be greater than 0'
    });
  }

  if (fromAccount === toAccount) {
    return res.status(422).json({
      error: 'Invalid transfer',
      code: 'SAME_ACCOUNT',
      message: 'Cannot transfer to the same account'
    });
  }

  if (amount > req.user.accountBalance) {
    return res.status(422).json({
      error: 'Insufficient funds',
      code: 'INSUFFICIENT_BALANCE',
      available: req.user.accountBalance,
      requested: amount
    });
  }

  // Process transfer...
});
```


### 🚀 Future-Proofing Status Code Strategy


#### API Versioning với Status Codes


```javascript
// Version-aware status code handling
class VersionedStatusHandler {
  constructor() {
    this.versionHandlers = {
      'v1': new V1StatusHandler(),
      'v2': new V2StatusHandler(),
      'v3': new V3StatusHandler()
    };
  }

  handle(version, error, req, res) {
    const handler = this.versionHandlers[version] || this.versionHandlers['v3'];
    return handler.handle(error, req, res);
  }
}

class V1StatusHandler {
  // Legacy: Simple error responses
  handle(error, req, res) {
    if (error.type === 'ValidationError') {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

class V2StatusHandler {
  // Enhanced: More specific status codes
  handle(error, req, res) {
    if (error.type === 'ValidationError') {
      return res.status(422).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    if (error.type === 'ConflictError') {
      return res.status(409).json({
        error: 'Resource conflict',
        conflictingField: error.field
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      requestId: req.id
    });
  }
}

class V3StatusHandler {
  // Modern: Rich error responses với retry guidance
  handle(error, req, res) {
    const errorResponse = {
      error: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      timestamp: new Date().toISOString(),
      requestId: req.id,
      retryable: this.isRetryable(error),
      suggestedAction: this.getSuggestedAction(error)
    };

    if (error.type === 'ValidationError') {
      errorResponse.details = error.details;
      return res.status(422).json(errorResponse);
    }

    if (error.type === 'ConflictError') {
      errorResponse.conflictingResource = error.resource;
      errorResponse.conflictResolution = this.getConflictResolution(error);
      return res.status(409).json(errorResponse);
    }

    if (error.type === 'RateLimitError') {
      return res.status(429)
                .header('Retry-After', error.retryAfter)
                .json({
                  ...errorResponse,
                  retryAfter: error.retryAfter,
                  quotaLimit: error.limit,
                  quotaRemaining: 0,
                  quotaReset: error.resetTime
                });
    }

    return res.status(500).json(errorResponse);
  }
}
```


#### GraphQL và Status Codes


**Challenge**: GraphQL typically returns 200 even for errors


```javascript
// Custom GraphQL error handling với meaningful status codes
class GraphQLStatusExtension {
  static formatError(error) {
    // Extract HTTP status from GraphQL error
    let status = 200; // Default GraphQL behavior

    if (error.extensions?.code) {
      const statusMapping = {
        'UNAUTHENTICATED': 401,
        'FORBIDDEN': 403,
        'NOT_FOUND': 404,
        'BAD_USER_INPUT': 422,
        'INTERNAL_ERROR': 500
      };

      status = statusMapping[error.extensions.code] || 500;
    }

    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: {
        ...error.extensions,
        httpStatus: status
      }
    };
  }

  static createHTTPResponse(result, res) {
    if (result.errors && result.errors.length > 0) {
      // Find highest priority error status
      const statuses = result.errors
        .map(e => e.extensions?.httpStatus || 500)
        .sort((a, b) => b - a); // Descending order

      const primaryStatus = statuses[0];

      // Set HTTP status based on primary error
      res.status(primaryStatus);

      // Add custom headers for client processing
      res.header('X-GraphQL-Errors', result.errors.length.toString());
      res.header('X-Primary-Error-Status', primaryStatus.toString());
    }

    return res.json(result);
  }
}

// Usage với Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: GraphQLStatusExtension.formatError,
  plugins: [
    {
      requestDidStart() {
        return {
          willSendResponse(requestContext) {
            return GraphQLStatusExtension.createHTTPResponse(
              requestContext.response.http.body,
              requestContext.response.http.res
            );
          }
        };
      }
    }
  ]
});
```


### 🎓 Mastery Verification Checkpoints


#### Code Review Red Flags


**❌ Common Mistakes to Watch For:**


```javascript
// 1. Wrong status for business logic errors
app.post('/api/transfer', (req, res) => {
  if (req.body.amount > user.balance) {
    // ❌ This is NOT a bad request - syntax is fine
    return res.status(400).json({ error: 'Insufficient funds' });

    // ✅ Correct: Business rule violation
    return res.status(422).json({
      error: 'Insufficient funds',
      available: user.balance,
      requested: req.body.amount
    });
  }
});

// 2. Inconsistent redirect status usage
app.get('/old-url', (req, res) => {
  // ❌ Using 302 for permanent move
  res.status(302).header('Location', '/new-url').end();

  // ✅ Permanent moves should use 301
  res.status(301).header('Location', '/new-url').end();
});

// 3. Missing Location header với 201
app.post('/api/users', (req, res) => {
  const user = createUser(req.body);

  // ❌ 201 without Location header
  res.status(201).json(user);

  // ✅ 201 with Location header
  res.status(201)
     .header('Location', `/api/users/${user.id}`)
     .json(user);
});

// 4. Returning body với 204
app.delete('/api/posts/:id', (req, res) => {
  deletePost(req.params.id);

  // ❌ 204 với response body
  res.status(204).json({ message: 'Deleted successfully' });

  // ✅ 204 với no body
  res.status(204).end();
});
```


#### Advanced Debugging Scenarios


**Scenario 1**: Users complaining about "random logouts"


```javascript
// Debug approach:
// 1. Check 401 vs 403 patterns
// 2. Analyze token expiry timing
// 3. Look for concurrent session issues

// Debugging tool
class AuthDebugger {
  static analyzeAuthFlow(requests) {
    const authRequests = requests.filter(r =>
      r.status === 401 || r.status === 403
    );

    const patterns = {
      tokenExpiry: this.detectTokenExpiryPattern(authRequests),
      concurrentSessions: this.detectConcurrentSessions(authRequests),
      invalidTokens: this.detectInvalidTokenPattern(authRequests)
    };

    return patterns;
  }

  static detectTokenExpiryPattern(requests) {
    // Look for 401s followed by successful refresh
    const pattern = [];

    for (let i = 0; i < requests.length - 1; i++) {
      if (requests[i].status === 401 &&
          requests[i + 1].url.includes('/refresh') &&
          requests[i + 1].status === 200) {
        pattern.push({
          originalRequest: requests[i],
          refreshRequest: requests[i + 1],
          timeBetween: requests[i + 1].timestamp - requests[i].timestamp
        });
      }
    }

    return pattern;
  }
}
```


**Scenario 2**: API returning inconsistent status codes


```javascript
// Debugging checklist:
class StatusConsistencyChecker {
  static checkEndpoint(endpoint, requests) {
    const endpointRequests = requests.filter(r =>
      r.url.includes(endpoint)
    );

    const byInputHash = new Map();

    endpointRequests.forEach(request => {
      const inputHash = this.hashRequestInput(request);

      if (!byInputHash.has(inputHash)) {
        byInputHash.set(inputHash, []);
      }

      byInputHash.get(inputHash).push(request);
    });

    // Find inconsistencies
    const inconsistencies = [];

    for (const [inputHash, requests] of byInputHash.entries()) {
      const statuses = [...new Set(requests.map(r => r.status))];

      if (statuses.length > 1) {
        inconsistencies.push({
          input: inputHash,
          statuses: statuses,
          requests: requests
        });
      }
    }

    return inconsistencies;
  }
}
```


## 🎯 Performance Optimization với Status Codes


### Caching Strategy based on Status Codes


```javascript
// Intelligent caching based on status patterns
class StatusAwareCacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheStrategies = {
      200: { ttl: 300, staleWhileRevalidate: 600 },
      201: { ttl: 0, skipCache: true }, // Don't cache creates
      204: { ttl: 0, skipCache: true }, // Don't cache updates
      404: { ttl: 60, background: true }, // Short cache for 404s
      401: { ttl: 0, skipCache: true }, // Never cache auth errors
      403: { ttl: 0, skipCache: true }, // Never cache permission errors
      500: { ttl: 0, skipCache: true }, // Never cache server errors
      502: { ttl: 5, retry: true },     // Short cache, enable retry
      503: { ttl: 10, retry: true }     // Short cache, enable retry
    };
  }

  async fetchWithCache(url, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);
    const cached = this.cache.get(cacheKey);

    // Check if we have fresh cached data
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.response.clone();
    }

    // Check if we can serve stale while revalidating
    if (cached && this.canServeStale(cached)) {
      // Serve stale, revalidate in background
      this.revalidateInBackground(url, options, cacheKey);
      return cached.response.clone();
    }

    // Fetch fresh data
    const response = await fetch(url, options);

    // Cache based on status code strategy
    this.cacheResponse(cacheKey, response, url, options);

    return response;
  }

  cacheResponse(cacheKey, response, url, options) {
    const strategy = this.cacheStrategies[response.status];

    if (!strategy || strategy.skipCache) {
      return;
    }

    this.cache.set(cacheKey, {
      response: response.clone(),
      timestamp: Date.now(),
      ttl: strategy.ttl,
      url,
      options,
      status: response.status
    });

    // Set up retry mechanism for 5xx errors
    if (strategy.retry && response.status >= 500) {
      this.scheduleRetry(url, options, cacheKey);
    }
  }

  async scheduleRetry(url, options, cacheKey) {
    // Exponential backoff retry
    const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

    for (const delay of retryDelays) {
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const response = await fetch(url, options);

        if (response.ok) {
          // Success! Update cache
          this.cacheResponse(cacheKey, response, url, options);
          break;
        }
      } catch (error) {
        console.warn(`Retry failed for ${url}:`, error);
      }
    }
  }
}
```


## 🔮 Future Evolution của HTTP Status Codes


### Emerging Patterns & New Standards


```javascript
// HTTP/3 và QUIC implications
class NextGenStatusHandler {
  constructor() {
    this.http3Features = {
      streamMultiplexing: true,
      headerCompression: true,
      serverPush: true
    };
  }

  // Status codes in multiplexed streams
  handleMultiplexedResponse(streamId, response) {
    // Multiple responses per connection
    // Status codes become per-stream

    if (response.status === 103) { // Early Hints
      // Server can send hints before main response
      this.processEarlyHints(streamId, response.headers);
      return; // Don't close stream yet
    }

    // Regular status processing
    this.processMainResponse(streamId, response);
  }

  processEarlyHints(streamId, headers) {
    // 103 Early Hints cho resource preloading
    const linkHeaders = headers.getAll('Link');

    linkHeaders.forEach(link => {
      if (link.includes('rel=preload')) {
        // Start preloading resource
        this.preloadResource(link);
      }
    });
  }
}

// Real-time applications với WebSockets + HTTP status semantics
class RealtimeStatusManager {
  constructor(websocket) {
    this.ws = websocket;
    this.requestCounter = 0;
  }

  // Apply HTTP status concepts to WebSocket messages
  sendRequest(type, data) {
    const requestId = ++this.requestCounter;

    this.ws.send(JSON.stringify({
      id: requestId,
      type,
      data
    }));

    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const response = JSON.parse(event.data);

        if (response.id === requestId) {
          this.ws.removeEventListener('message', handler);

          // Use HTTP status concepts
          if (response.status >= 200 && response.status < 300) {
            resolve(response);
          } else {
            reject(new Error(`WebSocket error ${response.status}: ${response.message}`));
          }
        }
      };

      this.ws.addEventListener('message', handler);
    });
  }
}
```


## 🎓 Tổng Kết: From Beginner to Principal Level


### Key Takeaways cho mỗi Level


#### Beginner Level Checklist ✅


- Hiểu 5 nhóm status codes (1xx, 2xx, 3xx, 4xx, 5xx)
- Biết khi nào dùng 200, 201, 400, 401, 403, 404, 500
- Implement basic error handling trong client code
- Sử dụng đúng status codes cho CRUD operations


#### Intermediate Level Checklist ✅


- Distinguish giữa 400 vs 422
- Implement proper redirect logic (301 vs 302)
- Handle caching với 304 Not Modified
- Use 204 appropriately cho updates/deletes
- Build retry logic cho 5xx errors


#### Senior Level Checklist ✅


- Design consistent error response format
- Implement circuit breakers cho service resilience
- Monitor status code patterns để detect issues
- Use status codes cho API versioning strategy
- Build comprehensive client-side error handling


#### Principal Level Checklist ✅


- Design domain-specific error taxonomy
- Architect status codes cho microservices
- Implement advanced caching strategies
- Lead team education về status code best practices
- Plan future evolution (GraphQL, WebSockets, HTTP/3)


### Final Thought Process - Principal's Perspective


Khi tôi review code hoặc design APIs, tôi không chỉ hỏi "Status code nào đúng?" mà tôi hỏi:


1. **"Consistency"**: Pattern này có consistent với rest của system không?
2. **"Developer Experience"**: Frontend developers có thể dễ dàng handle case này không?
3. **"Debugging"**: Khi production có issue, status code này có giúp pinpoint problem không?
4. **"Monitoring"**: Metrics và alerts có meaningful với status code choice này không?
5. **"Evolution"**: Decision này có support future requirements không?


**Status codes không chỉ là numbers - chúng là communication protocol giữa services, và là foundation cho reliable, maintainable systems.**


---


*"Mastering HTTP status codes is not about memorizing numbers. It's about understanding the communication patterns that make distributed systems reliable, debuggable, and delightful to work with."*


**- Perspective của một Principal Front-end Engineer**
