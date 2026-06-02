# Large File Upload System Design

## Claude


# Phân Tích Chuyên Sâu: Large File Upload System - Từ First Principles đến Production Engineering


*Góc nhìn Principal Frontend Engineer từ NAB, Axon, Binance, Webflow, Figma*


## 🌟 Mở Đầu: Tại Sao Large File Upload Là Một "Wicked Problem"?


### 💭 Think Out Loud - Principal's First Encounter:


Khi tôi lần đầu tiên gặp bài toán large file upload tại NAB trong dự án modernize banking platform, reaction đầu tiên của tôi không phải là "làm sao upload file lớn", mà là "tại sao browser lại không handle được việc này một cách native?". Đây chính là starting point để hiểu sâu về bản chất của problem này.


🔬 **Fundamental Question**: Tại sao một task tưởng chừng đơn giản như "gửi file từ client lên server" lại trở thành một engineering challenge phức tạp đến vậy?


### 📖 Network & Browser Fundamentals - Foundation Level:


#### 🌱 Nguồn Gốc & Motivation:


**HTTP Protocol Limitations:**
Ban đầu, HTTP được thiết kế cho việc transfer text documents nhỏ. Khi Tim Berners-Lee tạo ra HTTP/1.0 vào năm 1991, concept của "large file" chưa tồn tại trong web context. Protocol này hoạt động theo request-response model đơn giản:


```
Client: "Tôi muốn gửi data này"
Server: "OK, gửi đi"
Client: [Gửi toàn bộ data trong 1 request]
Server: "Received, cảm ơn"
```


**Problem với Large Files:**


1. **Timeout Issues**: HTTP có default timeout (thường 30s-2min). File 1GB qua connection 10Mbps cần ~13 phút
2. **Memory Constraints**: Browser phải load toàn bộ file vào memory trước khi send
3. **Network Reliability**: Bất kỳ connection drop nào đều khiến phải restart from beginning
4. **User Experience**: Không có progress indication, không thể cancel/resume


#### 🔬 Bản Chất & Mechanism:


**Memory Model Analysis:**


```javascript
// Đây là điều xảy ra khi user chọn 1 file 1GB:
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0]; // File object - chưa load vào memory

    // PROBLEM: Khi gọi FormData hoặc FileReader
    const formData = new FormData();
    formData.append('file', file); // Toàn bộ 1GB load vào RAM

    fetch('/upload', {
        method: 'POST',
        body: formData // Browser serialize toàn bộ 1GB thành HTTP body
    });
});
```


**Browser Internals - V8 Engine Perspective:**
Khi V8 engine process file upload:


1. **Heap Allocation**: File được allocate trong V8 heap (limited ~2GB trên 32-bit systems)
2. **Garbage Collection Pressure**: Large objects gây GC pauses
3. **Buffer Management**: Browser phải maintain entire file buffer during network transmission
4. **Event Loop Blocking**: Synchronous file operations block main thread


#### 💡 Intuitive Understanding - Real World Analogy:


Tưởng tượng bạn cần chuyển 1000 cuốn sách từ nhà này sang nhà khác:


**Traditional Upload (Problematic)**:


- Bạn phải mang tất cả 1000 cuốn cùng lúc
- Nếu trên đường bị té, phải quay về lấy lại tất cả
- Tay bạn chỉ mang được 50 cuốn → impossible


**Chunked Upload (Solution)**:


- Chia thành 20 trips, mỗi trip 50 cuốn
- Nếu trip thứ 15 bị té, chỉ cần làm lại từ trip 15
- Có thể gọi thêm bạn bè để cùng chuyển (parallel)
- Có thể đánh dấu những cuốn đã chuyển xong (resume)


### 🏭 Production Reality - What I've Learned:


**At Binance** (Trading Platform):


- Users upload trading history CSV files (500MB+)
- Network trong trading environment thường unstable (WiFi, mobile)
- Timeout 1 lần có thể làm trader miss critical market opportunity
- Solution: Chunked upload với automatic retry strategy


**At Webflow** (Design Tool):


- Designers upload video assets, PSD files (2-5GB common)
- Creative workflow không thể bị interrupt
- Bandwidth varies wildly (agency offices vs coffee shops)
- Challenge: Maintaining upload progress across browser sessions


## 📖 Core Concepts Deep Dive


### 🔬 [File Chunking] - Phân Mảnh File


#### 🌱 Nguồn Gốc & Motivation:


**Historical Context:**
File chunking concept xuất hiện từ những năm 1970s trong distributed systems. IBM's System R database đã implement record splitting để handle large data sets. Trong web context, chunking được popularize bởi resumable upload protocols như TUS (Tusio Resumable Upload Protocol).


**Problem Statement:**


```javascript
// Vấn đề cốt lõi:
const largeFile = new File([...], '1GB-video.mp4'); // 1,073,741,824 bytes

// Traditional approach - PROBLEMATIC:
fetch('/upload', {
    method: 'POST',
    body: largeFile // Entire 1GB phải được load vào memory trước khi send
});

// Browser limitations:
// - V8 heap limit: ~2GB (32-bit), ~4GB (64-bit)
// - Network timeout: 30-120 seconds default
// - No progress tracking
// - No resumability
```


#### 🔬 Bản Chất & Mechanism:


**File.slice() API Deep Dive:**


```javascript
// File.slice() implementation understanding:
const file = new File([...], 'large.pdf');

// Slice hoạt động như thế nào?
const chunk = file.slice(0, 1024 * 1024); // First 1MB

/* Browser internals:
 * 1. File object maintain reference to file trên disk
 * 2. slice() tạo new Blob object với:
 *    - start: byte offset
 *    - end: byte offset
 *    - type: MIME type inherited
 * 3. NO actual data copying diễn ra yet
 * 4. Data chỉ được read khi:
 *    - FileReader.readAs...()
 *    - FormData serialization
 *    - Fetch body serialization
 */
```


**Memory-Efficient Chunking Algorithm:**


```javascript
// Functional approach - avoiding mutations
const createChunks = (file, chunkSize = 1024 * 1024) => {
    // First principle: Không load toàn bộ file vào memory
    const totalChunks = Math.ceil(file.size / chunkSize);

    // Tạo array of chunk descriptors thay vì actual chunks
    return Array.from({ length: totalChunks }, (_, index) => ({
        start: index * chunkSize,
        end: Math.min((index + 1) * chunkSize, file.size),
        index,
        createBlob: () => file.slice(index * chunkSize, Math.min((index + 1) * chunkSize, file.size))
    }));
};

// Tại sao approach này hiệu quả?
// 1. Lazy evaluation: Blob chỉ được tạo khi cần
// 2. Memory footprint: Chỉ 1 chunk tại một thời điểm
// 3. Functional: Immutable, predictable, testable
```


#### 💭 Think Out Loud - Debugging Mental Model:


**Khi debug chunking issues tại Figma:**


```javascript
// Red flag #1: Memory usage spike
const debugChunking = (file) => {
    const initialMemory = performance.memory.usedJSHeapSize;
    console.log(`Initial memory: ${initialMemory / 1024 / 1024}MB`);

    const chunks = createChunks(file);
    const afterChunkingMemory = performance.memory.usedJSHeapSize;
    console.log(`After chunking: ${afterChunkingMemory / 1024 / 1024}MB`);

    // Expected: Minimal memory increase (chỉ metadata)
    // Red flag: Significant memory increase = chunks being materialized
};

// Red flag #2: Chunk boundary issues
const validateChunkBoundaries = (file, chunks) => {
    const totalSize = chunks.reduce((acc, chunk) => acc + (chunk.end - chunk.start), 0);
    console.assert(totalSize === file.size, 'Chunk boundaries mismatch!');

    // Check overlaps
    chunks.forEach((chunk, i) => {
        if (i > 0) {
            console.assert(chunk.start === chunks[i-1].end, `Gap/overlap at chunk ${i}`);
        }
    });
};
```


#### ⚙️ Implementation Deep Dive:


**Browser-Specific Optimizations:**


```javascript
// Optimal chunk size analysis
const determineOptimalChunkSize = () => {
    // Factors to consider:
    // 1. Browser memory limits
    // 2. Network MTU (Maximum Transmission Unit)
    // 3. HTTP/2 frame size limits
    // 4. Mobile vs desktop constraints

    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const connectionSpeed = navigator.connection?.effectiveType;

    let chunkSize;

    if (isMobile) {
        // Mobile: Smaller chunks, conserve memory
        chunkSize = isAndroid ? 512 * 1024 : 1024 * 1024; // 512KB Android, 1MB iOS
    } else {
        // Desktop: Larger chunks, optimize for throughput
        switch (connectionSpeed) {
            case 'slow-2g':
            case '2g': chunkSize = 256 * 1024; break;
            case '3g': chunkSize = 1024 * 1024; break;
            case '4g':
            default: chunkSize = 5 * 1024 * 1024; break; // 5MB
        }
    }

    return chunkSize;
};

// Progressive chunking strategy
const createProgressiveChunks = (file) => {
    // Start với smaller chunks để test network stability
    // Tăng dần chunk size nếu network perform well

    let currentChunkSize = 256 * 1024; // Start 256KB
    const maxChunkSize = 5 * 1024 * 1024; // Max 5MB
    const chunks = [];
    let position = 0;

    while (position < file.size) {
        const chunkEnd = Math.min(position + currentChunkSize, file.size);

        chunks.push({
            start: position,
            end: chunkEnd,
            size: chunkEnd - position,
            index: chunks.length,
            createBlob: () => file.slice(position, chunkEnd)
        });

        position = chunkEnd;

        // Tăng chunk size progressively
        currentChunkSize = Math.min(currentChunkSize * 1.5, maxChunkSize);
    }

    return chunks;
};
```


#### 🎯 Verification Checklist:


**Understanding Checkpoints:**


1. **Concept Understanding**: "Tại sao không upload toàn bộ file một lần?"
2. **API Understanding**: "File.slice() có copy data không?"
3. **Memory Understanding**: "Chunking giúp tiết kiệm memory như thế nào?"
4. **Boundary Understanding**: "Làm sao ensure chunks không overlap?"


**Practical Exercises:**


```javascript
// Exercise 1: Manual chunk validation
const validateChunks = async (file, chunks) => {
    // Reconstruct file từ chunks và so sánh hash
    const reconstructed = new Blob(
        await Promise.all(chunks.map(chunk => chunk.createBlob()))
    );

    const originalHash = await calculateFileHash(file);
    const reconstructedHash = await calculateFileHash(reconstructed);

    console.assert(originalHash === reconstructedHash, 'Chunking corrupted file!');
};

// Exercise 2: Memory efficiency test
const testMemoryEfficiency = (file) => {
    const measureMemory = () => performance.memory.usedJSHeapSize;

    const before = measureMemory();
    const chunks = createChunks(file);
    const after = measureMemory();

    const memoryIncrease = (after - before) / 1024 / 1024;
    console.log(`Memory increase: ${memoryIncrease}MB`);

    // Expected: <1MB increase regardless of file size
    return memoryIncrease < 1;
};
```


### 🔬 [File Hashing] - Tính Toán Hash Hiệu Quả


#### 🌱 Nguồn Gốc & Motivation:


**Cryptographic Hash Functions History:**
MD5 được Ron Rivest phát triển năm 1991 như successor của MD4. Mặc dù MD5 đã bị considered cryptographically broken (collision attacks), nhưng vẫn perfectly suitable cho file integrity checking trong non-adversarial contexts.


**Problem Statement - Tại sao cần hash?**


```javascript
// Scenario: User upload file "document.pdf"
// Làm sao server biết đây là file nào trong những trường hợp:
// 1. User rename "important.pdf" thành "document.pdf"
// 2. User upload cùng content nhưng different filename
// 3. User resume upload sau browser crash
// 4. Multiple users upload same file

// Traditional approach - FLAWED:
const fileIdentifier = file.name + file.size + file.lastModified;
// Problems:
// - Different files có thể có same name + size
// - lastModified có thể bị manipulate
// - Không detect content changes
```


**Hash-based Solution:**


```javascript
// Content-based identification:
const fileHash = await calculateMD5(file); // "a1b2c3d4e5f6..."
// Properties:
// - Same content → same hash (deterministic)
// - Different content → different hash (collision-resistant)
// - Fixed length output regardless of file size
// - Fast computation
```


#### 🔬 Bản Chất & Mechanism:


**MD5 Algorithm Understanding:**


```javascript
// MD5 internals (simplified):
const md5Process = (input) => {
    // 1. Padding: Add bits để message length ≡ 448 (mod 512)
    // 2. Append original length as 64-bit
    // 3. Initialize 4 32-bit hash values (magic constants)
    // 4. Process message in 512-bit chunks:
    //    - Break chunk into sixteen 32-bit words
    //    - Apply 4 rounds of operations (16 operations each)
    //    - Each operation uses one word + constants + bit manipulation
    // 5. Final hash = concatenation of 4 hash values
};

// Browser implementation using crypto-js:
import SparkMD5 from 'spark-md5';

const calculateFileHash = async (file) => {
    return new Promise((resolve) => {
        const spark = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();

        fileReader.onload = (e) => {
            spark.append(e.target.result); // ArrayBuffer
            resolve(spark.end()); // Finalize hash computation
        };

        fileReader.readAsArrayBuffer(file);
    });
};
```


**Performance Problem - Full File Read:**


```javascript
// Problem với approach trên:
const calculateHashNaive = async (file) => {
    // fileReader.readAsArrayBuffer(file) đọc TOÀN BỘ file vào memory
    // File 2GB → cần 2GB RAM chỉ để calculate hash
    // Mobile devices sẽ crash/lag severely
};

// Impact analysis:
// - 100MB file: ~200ms hash calculation
// - 1GB file: ~2000ms hash calculation
// - 5GB file: Browser crash hoặc 10+ seconds blocking
```


#### 💡 Sampling Strategy - Breakthrough Innovation:


**Concept:**
Thay vì đọc toàn bộ file, chúng ta sample một subset nhỏ nhưng representative. Điều này base trên assumption: nếu 2 files khác nhau, probability chúng có identical samples rất thấp.


```javascript
// Sampling strategy explanation:
const createSamplingStrategy = (chunks) => {
    const samples = [];

    chunks.forEach((chunk, index) => {
        if (index === 0 || index === chunks.length - 1) {
            // Head và tail chunks: full content
            // Lý do: File format headers/footers thường unique
            samples.push(chunk.createBlob());
        } else {
            // Middle chunks: sample 3 positions
            const blob = chunk.createBlob();
            const chunkSize = chunk.end - chunk.start;

            // Sample 2 bytes từ 3 positions: đầu, giữa, cuối
            samples.push(blob.slice(0, 2));
            samples.push(blob.slice(chunkSize / 2, chunkSize / 2 + 2));
            samples.push(blob.slice(chunkSize - 2, chunkSize));
        }
    });

    return samples;
};

// Tại sao strategy này work?
// Statistical analysis:
// - Nếu 2 files khác nhau 1 byte ở middle chunk
// - Probability sample miss difference = (chunkSize - 6) / chunkSize
// - Với 1MB chunks: ~99.9994% miss rate PER chunk
// - Với 100 chunks: Overall miss probability ≈ 0.6%
// - Trade-off acceptable: 0.6% false positive vs 99%+ performance gain
```


#### ⚙️ Advanced Sampling Implementation:


```javascript
// Production-grade sampling với adaptive strategy
const calculateSampledHash = async (file) => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    const chunks = createChunks(file, CHUNK_SIZE);

    // Adaptive sampling based trên file size
    const sampleStrategy = determineSampleStrategy(file.size);
    const samples = await createAdaptiveSamples(chunks, sampleStrategy);

    // Calculate hash từ combined samples
    const combinedBlob = new Blob(samples);
    return calculateFileHash(combinedBlob);
};

const determineSampleStrategy = (fileSize) => {
    if (fileSize < 10 * 1024 * 1024) { // <10MB
        return { type: 'full', reason: 'Small file, full hash acceptable' };
    } else if (fileSize < 100 * 1024 * 1024) { // 10-100MB
        return {
            type: 'moderate',
            headTailFull: true,
            middleSampleBytes: 6,
            reason: 'Medium file, moderate sampling'
        };
    } else { // >100MB
        return {
            type: 'aggressive',
            headTailFull: true,
            middleSampleBytes: 2,
            maxSampleChunks: 50, // Chỉ sample tối đa 50 chunks dù file có 1000 chunks
            reason: 'Large file, aggressive sampling'
        };
    }
};

const createAdaptiveSamples = async (chunks, strategy) => {
    const samples = [];

    if (strategy.type === 'full') {
        // Small files: no sampling
        return chunks.map(chunk => chunk.createBlob());
    }

    const sampleIndices = strategy.maxSampleChunks
        ? selectRepresentativeChunks(chunks, strategy.maxSampleChunks)
        : chunks.map((_, i) => i);

    for (const index of sampleIndices) {
        const chunk = chunks[index];

        if (index === 0 || index === chunks.length - 1) {
            // Head/tail: full content
            samples.push(chunk.createBlob());
        } else {
            // Middle: sample bytes
            const blob = chunk.createBlob();
            const sampleSize = strategy.middleSampleBytes;
            const chunkSize = chunk.end - chunk.start;

            samples.push(blob.slice(0, sampleSize));
            samples.push(blob.slice(chunkSize / 2, chunkSize / 2 + sampleSize));
            samples.push(blob.slice(chunkSize - sampleSize, chunkSize));
        }
    }

    return samples;
};

// Chọn representative chunks để sample
const selectRepresentativeChunks = (chunks, maxCount) => {
    if (chunks.length <= maxCount) {
        return chunks.map((_, i) => i);
    }

    // Ensure we always include first and last chunks
    const indices = [0, chunks.length - 1];
    const remainingSlots = maxCount - 2;

    // Distribute remaining slots evenly
    const step = (chunks.length - 2) / remainingSlots;
    for (let i = 0; i < remainingSlots; i++) {
        const index = Math.round(1 + i * step);
        if (!indices.includes(index)) {
            indices.push(index);
        }
    }

    return indices.sort((a, b) => a - b);
};
```


#### 💭 Think Out Loud - Production Debugging:


**Real debugging session tại Axon (Body camera footage uploads):**


```javascript
// Issue: Hash collisions causing wrong "duplicate file" detection
// Debugging process:

// Step 1: Reproduce collision
const debugHashCollision = async (file1, file2) => {
    console.log('File 1:', file1.name, file1.size);
    console.log('File 2:', file2.name, file2.size);

    const hash1 = await calculateSampledHash(file1);
    const hash2 = await calculateSampledHash(file2);

    console.log('Hash 1:', hash1);
    console.log('Hash 2:', hash2);
    console.log('Match:', hash1 === hash2);

    // If hashes match but files different, investigate sampling
    if (hash1 === hash2 && file1.size !== file2.size) {
        console.warn('HASH COLLISION DETECTED!');
        await investigateCollision(file1, file2);
    }
};

// Step 2: Deep dive collision analysis
const investigateCollision = async (file1, file2) => {
    // Compare full hashes
    const fullHash1 = await calculateFileHash(file1);
    const fullHash2 = await calculateFileHash(file2);

    console.log('Full hash 1:', fullHash1);
    console.log('Full hash 2:', fullHash2);

    if (fullHash1 !== fullHash2) {
        console.error('SAMPLING STRATEGY FLAW: Different files, same sampled hash!');

        // Analyze sample patterns
        await analyzeSamplePattern(file1, file2);
    }
};

// Step 3: Sample pattern analysis
const analyzeSamplePattern = async (file1, file2) => {
    const chunks1 = createChunks(file1);
    const chunks2 = createChunks(file2);

    // Compare samples chunk by chunk
    for (let i = 0; i < Math.min(chunks1.length, chunks2.length); i++) {
        const sample1 = await getSample(chunks1[i]);
        const sample2 = await getSample(chunks2[i]);

        if (sample1 === sample2) {
            console.log(`Chunk ${i}: Samples match`);
        } else {
            console.log(`Chunk ${i}: Samples differ`);
            // First differing chunk found - collision was in non-sampled area
            break;
        }
    }
};
```


**Resolution Strategy:**


```javascript
// Enhanced sampling to reduce collision probability
const enhancedSamplingStrategy = {
    // Increase sample size for critical applications
    minimumSampleBytes: 64, // Up from 2-6 bytes

    // Add random sampling positions
    randomSamplePoints: 3,

    // Include file metadata in hash
    includeMetadata: true,

    // Fallback to full hash for small files
    fullHashThreshold: 50 * 1024 * 1024 // 50MB
};
```


#### 🏭 Production Considerations:


**At Binance - Trading Data Upload:**


```javascript
// High-frequency trading data files - collision = financial loss
const criticalFileHash = async (file) => {
    // Multi-algorithm approach for critical files
    const [md5Hash, sha1Hash] = await Promise.all([
        calculateSampledHash(file, 'MD5'),
        calculateSampledHash(file, 'SHA1')
    ]);

    return `${md5Hash}-${sha1Hash}`;
};

// Performance monitoring
const hashPerformanceMonitor = {
    trackHashingTime: (fileSize, hashingTime) => {
        const throughput = fileSize / hashingTime; // bytes/ms

        // Alert nếu throughput drop dramatically
        if (throughput < EXPECTED_THROUGHPUT * 0.5) {
            console.warn('Hash performance degraded:', {
                fileSize: fileSize / 1024 / 1024 + 'MB',
                time: hashingTime + 'ms',
                throughput: throughput + 'bytes/ms'
            });
        }
    }
};
```


### 🔬 [Upload Verification] - Kiểm Tra Trạng Thái Upload


#### 🌱 Nguồn Gốc & Motivation:


**The "Upload State Problem":**
Trong distributed systems, maintaining state consistency giữa client và server là fundamental challenge. Với file uploads, chúng ta cần track:


1. **File existence**: File đã exist trên server chưa?
2. **Partial progress**: Những chunks nào đã upload thành công?
3. **Integrity**: Uploaded chunks có corrupted không?
4. **Metadata**: File metadata có consistent không?


**Historical Context:**
HTTP protocol là stateless by design - mỗi request independent. Điều này tốt cho scalability nhưng tạo challenges cho resumable operations. Solutions như WebDAV, FTP đã attempt solve này, nhưng không suitable cho modern web apps.


#### 🔬 Bản Chất & Mechanism:


**State Synchronization Protocol:**


```javascript
// Client-Server state synchronization flow:

// Phase 1: Client announces intent
const uploadIntent = {
    fileHash: 'a1b2c3d4e5f6...',
    fileName: 'document.pdf',
    fileSize: 1073741824, // 1GB
    chunkSize: 1024 * 1024, // 1MB chunks
    totalChunks: 1024,
    clientId: generateClientId(),
    timestamp: Date.now()
};

// Phase 2: Server responds với current state
const serverResponse = {
    status: 'partial', // 'complete' | 'partial' | 'missing'
    existingChunks: ['a1b2c3-0', 'a1b2c3-1', 'a1b2c3-5'], // Already uploaded
    missingChunks: ['a1b2c3-2', 'a1b2c3-3', 'a1b2c3-4'], // Need upload
    integrityChecks: {
        'a1b2c3-0': 'chunk0hash',
        'a1b2c3-1': 'chunk1hash',
        'a1b2c3-5': 'chunk5hash'
    }
};
```


**Server-Side State Management:**


```javascript
// File system structure for tracking upload state:
// uploads/
//   ├── a1b2c3d4e5f6.../          (File hash directory)
//   │   ├── metadata.json         (Upload metadata)
//   │   ├── a1b2c3d4e5f6-0        (Chunk 0)
//   │   ├── a1b2c3d4e5f6-1        (Chunk 1)
//   │   └── ...
//   └── complete/
//       └── a1b2c3d4e5f6.pdf      (Final merged file)

// Metadata structure:
const uploadMetadata = {
    fileHash: 'a1b2c3d4e5f6...',
    originalName: 'document.pdf',
    fileSize: 1073741824,
    chunkSize: 1024 * 1024,
    totalChunks: 1024,
    uploadedChunks: new Set(['a1b2c3-0', 'a1b2c3-1']),
    chunkIntegrity: new Map([
        ['a1b2c3-0', { hash: 'chunk0hash', size: 1048576 }],
        ['a1b2c3-1', { hash: 'chunk1hash', size: 1048576 }]
    ]),
    startTime: '2025-01-15T10:30:00Z',
    lastActivity: '2025-01-15T10:35:23Z',
    clientId: 'client-123',
    status: 'uploading' // 'uploading' | 'paused' | 'completed' | 'failed'
};
```


#### ⚙️ Implementation Deep Dive:


**Advanced Verification Logic:**


```javascript
// Server-side verification endpoint
const verifyUploadState = async (req, res) => {
    const { fileHash, fileName, fileSize, chunkSize } = req.body;

    // Step 1: Validate input parameters
    const validation = validateUploadRequest({
        fileHash,
        fileName,
        fileSize,
        chunkSize
    });

    if (!validation.valid) {
        return res.status(400).json({
            error: 'Invalid request',
            details: validation.errors
        });
    }

    try {
        // Step 2: Check for complete file existence
        const completeFilePath = getCompleteFilePath(fileHash, fileName);
        if (await fileExists(completeFilePath)) {
            // Instant upload case
            return res.json({
                status: 'complete',
                shouldUpload: false,
                message: 'File already exists'
            });
        }

        // Step 3: Check partial upload state
        const partialState = await getPartialUploadState(fileHash);

        if (!partialState) {
            // Fresh upload
            return res.json({
                status: 'fresh',
                shouldUpload: true,
                existingChunks: [],
                totalChunks: Math.ceil(fileSize / chunkSize)
            });
        }

        // Step 4: Validate existing chunks integrity
        const validatedChunks = await validateExistingChunks(
            partialState.uploadedChunks,
            fileHash
        );

        // Step 5: Determine missing chunks
        const totalChunks = Math.ceil(fileSize / chunkSize);
        const missingChunks = findMissingChunks(validatedChunks, totalChunks);

        // Step 6: Return resumption state
        return res.json({
            status: 'partial',
            shouldUpload: true,
            existingChunks: validatedChunks,
            missingChunks: missingChunks,
            totalChunks: totalChunks,
            uploadProgress: validatedChunks.length / totalChunks
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            shouldUpload: true,
            existingChunks: [] // Fail safe: assume fresh upload
        });
    }
};

// Chunk integrity validation
const validateExistingChunks = async (uploadedChunks, fileHash) => {
    const validChunks = [];

    for (const chunkId of uploadedChunks) {
        try {
            const chunkPath = getChunkPath(fileHash, chunkId);

            // Check file existence
            if (!await fileExists(chunkPath)) {
                console.warn(`Chunk ${chunkId} missing from disk`);
                continue;
            }

            // Validate file size
            const chunkStats = await fs.stat(chunkPath);
            const expectedSize = getExpectedChunkSize(chunkId, fileHash);

            if (chunkStats.size !== expectedSize) {
                console.warn(`Chunk ${chunkId} size mismatch: ${chunkStats.size} vs ${expectedSize}`);
                await fs.unlink(chunkPath); // Remove corrupted chunk
                continue;
            }

            // Optional: Validate chunk hash
            if (ENABLE_CHUNK_HASH_VALIDATION) {
                const chunkHash = await calculateChunkHash(chunkPath);
                const expectedHash = getExpectedChunkHash(chunkId);

                if (chunkHash !== expectedHash) {
                    console.warn(`Chunk ${chunkId} hash mismatch`);
                    await fs.unlink(chunkPath);
                    continue;
                }
            }

            validChunks.push(chunkId);

        } catch (error) {
            console.error(`Error validating chunk ${chunkId}:`, error);
            // Continue với other chunks
        }
    }

    return validChunks;
};
```


**Client-Side Verification Handling:**


```javascript
// Sophisticated client verification logic
const performUploadVerification = async (file) => {
    const fileHash = await calculateFileHash(file);
    const chunks = createChunks(file);

    try {
        // Send verification request
        const verificationResponse = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileHash,
                fileName: file.name,
                fileSize: file.size,
                chunkSize: CHUNK_SIZE,
                clientId: getClientId()
            })
        });

        if (!verificationResponse.ok) {
            throw new Error(`Verification failed: ${verificationResponse.status}`);
        }

        const verificationResult = await verificationResponse.json();

        // Handle different verification outcomes
        return await handleVerificationResult(
            verificationResult,
            file,
            chunks
        );

    } catch (error) {
        console.error('Verification error:', error);

        // Fallback strategy: assume fresh upload
        return {
            shouldUpload: true,
            chunksToUpload: chunks,
            resumeFrom: 0,
            strategy: 'fresh-upload-fallback'
        };
    }
};

const handleVerificationResult = async (result, file, chunks) => {
    switch (result.status) {
        case 'complete':
            // Instant upload success
            showUploadSuccess('File already exists on server');
            return { shouldUpload: false };

        case 'fresh':
            // New upload
            return {
                shouldUpload: true,
                chunksToUpload: chunks,
                resumeFrom: 0,
                strategy: 'fresh-upload'
            };

        case 'partial':
            // Resume upload
            const chunksToUpload = filterUnuploadedChunks(
                chunks,
                result.existingChunks
            );

            showResumeNotification(
                result.uploadProgress,
                chunksToUpload.length
            );

            return {
                shouldUpload: true,
                chunksToUpload,
                resumeFrom: result.existingChunks.length,
                strategy: 'resume-upload',
                existingChunks: result.existingChunks
            };

        default:
            throw new Error(`Unknown verification status: ${result.status}`);
    }
};

// Filter chunks that haven't been uploaded
const filterUnuploadedChunks = (allChunks, existingChunkIds) => {
    const existingSet = new Set(existingChunkIds);

    return allChunks.filter((chunk, index) => {
        const chunkId = `${chunk.fileHash}-${index}`;
        return !existingSet.has(chunkId);
    });
};
```


#### 💭 Think Out Loud - Edge Cases & Debugging:


**Complex debugging scenario tại Webflow:**


```javascript
// Issue: Users report "upload restarting from beginning" despite having uploaded 80%
// Root cause analysis:

const debugVerificationIssues = async (uploadSession) => {
    console.group('🔍 Upload Verification Debug');

    // Step 1: Check client-server time sync
    const clientTime = Date.now();
    const serverTime = await getServerTime();
    const timeDrift = Math.abs(clientTime - serverTime);

    console.log('Time sync check:', {
        clientTime: new Date(clientTime).toISOString(),
        serverTime: new Date(serverTime).toISOString(),
        drift: timeDrift + 'ms'
    });

    if (timeDrift > 5000) { // 5 second drift
        console.warn('⚠️ Significant time drift detected');
    }

    // Step 2: Validate file hash consistency
    const clientHash = uploadSession.fileHash;
    const serverHash = await recalculateServerHash(uploadSession.fileId);

    console.log('Hash consistency:', {
        client: clientHash,
        server: serverHash,
        match: clientHash === serverHash
    });

    if (clientHash !== serverHash) {
        console.error('❌ Hash mismatch - possible file corruption or tampering');
    }

    // Step 3: Check chunk boundary alignment
    const clientChunkBoundaries = calculateChunkBoundaries(
        uploadSession.fileSize,
        uploadSession.chunkSize
    );

    const serverChunkBoundaries = await getServerChunkBoundaries(
        uploadSession.fileId
    );

    console.log('Chunk boundary alignment:', {
        clientBoundaries: clientChunkBoundaries.slice(0, 3), // First 3
        serverBoundaries: serverChunkBoundaries.slice(0, 3),
        match: JSON.stringify(clientChunkBoundaries) === JSON.stringify(serverChunkBoundaries)
    });

    // Step 4: Validate existing chunks on server
    const chunkValidationResults = await Promise.all(
        uploadSession.existingChunks.map(async (chunkId) => {
            const isValid = await validateChunkOnServer(chunkId);
            return { chunkId, isValid };
        })
    );

    const invalidChunks = chunkValidationResults.filter(r => !r.isValid);
    console.log('Chunk validation:', {
        total: uploadSession.existingChunks.length,
        valid: chunkValidationResults.length - invalidChunks.length,
        invalid: invalidChunks.length,
        invalidChunkIds: invalidChunks.map(r => r.chunkId)
    });

    // Step 5: Network connectivity test
    const networkQuality = await testNetworkQuality();
    console.log('Network quality:', networkQuality);

    console.groupEnd();
};

// Network quality assessment
const testNetworkQuality = async () => {
    const startTime = performance.now();

    try {
        // Small test request to measure latency
        await fetch('/api/ping', { method: 'HEAD' });
        const latency = performance.now() - startTime;

        // Bandwidth estimation (crude)
        const testDataSize = 1024 * 100; // 100KB
        const bandwidthTestStart = performance.now();

        await fetch('/api/bandwidth-test', {
            method: 'POST',
            body: new ArrayBuffer(testDataSize)
        });

        const bandwidthTestTime = performance.now() - bandwidthTestStart;
        const estimatedBandwidth = testDataSize / bandwidthTestTime; // bytes/ms

        return {
            latency: Math.round(latency),
            estimatedBandwidth: Math.round(estimatedBandwidth * 8), // bits/ms
            quality: classifyNetworkQuality(latency, estimatedBandwidth)
        };

    } catch (error) {
        return {
            latency: Infinity,
            estimatedBandwidth: 0,
            quality: 'poor',
            error: error.message
        };
    }
};
```


**Verification State Machine:**


```javascript
// State machine for upload verification flow
const createUploadVerificationStateMachine = () => {
    return {
        initial: 'idle',
        states: {
            idle: {
                on: {
                    START_VERIFICATION: 'verifying'
                }
            },

            verifying: {
                entry: ['calculateFileHash', 'sendVerificationRequest'],
                on: {
                    VERIFICATION_SUCCESS: {
                        target: 'verified',
                        actions: ['storeVerificationResult']
                    },
                    VERIFICATION_FAILED: 'error',
                    NETWORK_ERROR: 'retrying'
                }
            },

            retrying: {
                entry: ['scheduleRetry'],
                after: {
                    RETRY_DELAY: 'verifying'
                },
                on: {
                    MAX_RETRIES_REACHED: 'error',
                    CANCEL: 'idle'
                }
            },

            verified: {
                on: {
                    INSTANT_UPLOAD: 'completed',
                    RESUME_UPLOAD: 'ready_to_upload',
                    FRESH_UPLOAD: 'ready_to_upload'
                }
            },

            ready_to_upload: {
                on: {
                    START_UPLOAD: 'uploading'
                }
            },

            uploading: {
                // Will transition to upload state machine
            },

            completed: {
                entry: ['notifyUploadComplete']
            },

            error: {
                entry: ['logError', 'notifyUser'],
                on: {
                    RETRY: 'idle'
                }
            }
        }
    };
};
```


### 🔬 [Concurrent Upload Control] - Điều Khiển Upload Đồng Thời


#### 🌱 Nguồn Gốc & Motivation:


**The Concurrency Dilemma:**
Khi có 1000 chunks cần upload, intuitive approach là upload tất cả cùng lúc để maximize throughput. Tuy nhiên, điều này create một cascade của problems:


1. **Browser Connection Limits**: Chrome limit 6 concurrent HTTP/1.1 connections per domain
2. **Server Resource Exhaustion**: Mỗi request consume memory, file descriptors, CPU
3. **Network Congestion**: Too many simultaneous requests can saturate bandwidth
4. **Request Queuing**: Browser queue additional requests, creating unpredictable delays


**Historical Context:**
HTTP/1.1 connection limits được design vào năm 1997 khi web pages có ~3 images. Modern SPAs với hundreds of resources đã expose limitations này. HTTP/2 multiplexing solve một phần, nhưng server-side resource limits vẫn tồn tại.


#### 🔬 Bản Chất & Mechanism:


**Browser Connection Pool Analysis:**


```javascript
// Browser internal connection management (simplified model):
const BrowserConnectionPool = {
    maxConnectionsPerHost: 6, // HTTP/1.1 limit
    activeConnections: new Map(), // hostname -> connection count
    requestQueue: [], // Queued requests waiting for available connections

    canMakeRequest(url) {
        const hostname = new URL(url).hostname;
        const activeCount = this.activeConnections.get(hostname) || 0;

        return activeCount < this.maxConnectionsPerHost;
    },

    makeRequest(url, options) {
        if (this.canMakeRequest(url)) {
            return this.executeRequest(url, options);
        } else {
            // Queue request until connection available
            return this.queueRequest(url, options);
        }
    }
};

// Manifestation trong file upload:
const uploadAllChunksNaive = async (chunks) => {
    // ❌ PROBLEMATIC: Tạo 1000 requests đồng thời
    const uploadPromises = chunks.map(chunk =>
        fetch('/upload', {
            method: 'POST',
            body: createFormData(chunk)
        })
    );

    // Browser behavior:
    // - First 6 requests: Execute immediately
    // - Remaining 994 requests: Queued
    // - As connections free up: Execute queued requests
    // - Result: Unpredictable timing, potential timeouts

    return Promise.all(uploadPromises);
};
```


**Server-Side Resource Impact:**


```javascript
// Server resource consumption per request:
const serverResourceAnalysis = {
    perRequest: {
        memory: 1024 * 1024, // ~1MB buffer per upload
        fileDescriptors: 2, // Input stream + temp file
        cpuTime: 50, // ms processing time
        diskIO: 'write-intensive'
    },

    // Impact of 1000 concurrent requests:
    totalImpact: {
        memory: 1024 * 1024 * 1000, // 1GB RAM
        fileDescriptors: 2000, // May exceed ulimit
        cpuUtilization: 'saturated',
        diskThroughput: 'bottlenecked'
    }
};

// Server crash scenarios:
// 1. Memory exhaustion: 1GB RAM consumption spike
// 2. File descriptor limit: EMFILE errors
// 3. CPU saturation: Request timeouts due to processing delays
// 4. Disk I/O bottleneck: Write queue overflow
```


#### 💡 Solution: Request Pool Pattern


**Core Concept:**
Thay vì unlimited concurrent requests, maintain một "pool" of active requests với fixed size. Khi request complete, immediately start next queued request.


```javascript
// Request pool implementation:
class ConcurrentUploadManager {
    constructor(maxConcurrency = 6) {
        this.maxConcurrency = maxConcurrency;
        this.activeRequests = new Set(); // Currently executing requests
        this.requestQueue = []; // Pending requests
        this.completedCount = 0;
        this.totalCount = 0;
    }

    async uploadChunks(chunks) {
        this.totalCount = chunks.length;
        this.completedCount = 0;

        // Convert chunks to request descriptors
        const requests = chunks.map((chunk, index) => ({
            id: `chunk-${index}`,
            chunk,
            execute: () => this.executeChunkUpload(chunk),
            retryCount: 0
        }));

        this.requestQueue = [...requests];

        // Start initial batch of requests
        await this.processRequestQueue();
    }

    async processRequestQueue() {
        // Fill request pool to capacity
        while (
            this.activeRequests.size < this.maxConcurrency &&
            this.requestQueue.length > 0
        ) {
            const request = this.requestQueue.shift();
            this.startRequest(request);
        }

        // Wait for all requests to complete
        while (this.activeRequests.size > 0) {
            await Promise.race([...this.activeRequests]);
        }
    }

    async startRequest(request) {
        const requestPromise = this.executeRequestWithRetry(request)
            .then(result => {
                this.onRequestComplete(request, result);
            })
            .catch(error => {
                this.onRequestError(request, error);
            })
            .finally(() => {
                this.activeRequests.delete(requestPromise);
                this.processNextRequest();
            });

        this.activeRequests.add(requestPromise);
    }

    async executeRequestWithRetry(request) {
        const MAX_RETRIES = 3;
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await request.execute();
            } catch (error) {
                lastError = error;

                if (attempt < MAX_RETRIES && this.isRetryableError(error)) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    await this.sleep(delay);
                    continue;
                }

                throw error;
            }
        }

        throw lastError;
    }

    processNextRequest() {
        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            this.startRequest(nextRequest);
        }
    }

    onRequestComplete(request, result) {
        this.completedCount++;
        console.log(`✅ Chunk ${request.id} uploaded (${this.completedCount}/${this.totalCount})`);

        // Update progress
        this.updateProgress(this.completedCount / this.totalCount);
    }

    onRequestError(request, error) {
        console.error(`❌ Chunk ${request.id} failed:`, error);

        // Could implement error aggregation, user notification, etc.
        this.handleUploadError(request, error);
    }
}
```


#### ⚙️ Advanced Concurrency Strategies:


**Adaptive Concurrency Control:**


```javascript
// Dynamic concurrency adjustment based on network conditions
class AdaptiveConcurrencyManager extends ConcurrentUploadManager {
    constructor(initialConcurrency = 6) {
        super(initialConcurrency);

        this.performanceMetrics = {
            throughput: [], // Requests per second history
            errorRate: [], // Error rate history
            responseTime: [] // Average response time history
        };

        this.adaptiveSettings = {
            minConcurrency: 2,
            maxConcurrency: 12,
            adjustmentThreshold: 5, // requests before adjustment
            targetThroughput: null // Will be calculated
        };

        this.requestCounter = 0;
    }

    async startRequest(request) {
        const startTime = performance.now();
        this.requestCounter++;

        const requestPromise = super.startRequest(request)
            .then(result => {
                this.recordSuccess(performance.now() - startTime);
                return result;
            })
            .catch(error => {
                this.recordError(performance.now() - startTime);
                throw error;
            });

        // Evaluate performance every N requests
        if (this.requestCounter % this.adaptiveSettings.adjustmentThreshold === 0) {
            this.adjustConcurrency();
        }

        return requestPromise;
    }

    recordSuccess(responseTime) {
        this.performanceMetrics.responseTime.push(responseTime);
        this.performanceMetrics.errorRate.push(0);

        // Keep only recent data
        this.trimMetricsHistory();
    }

    recordError(responseTime) {
        this.performanceMetrics.responseTime.push(responseTime);
        this.performanceMetrics.errorRate.push(1);

        this.trimMetricsHistory();
    }

    adjustConcurrency() {
        const recentMetrics = this.calculateRecentMetrics();

        if (recentMetrics.errorRate > 0.1) { // >10% error rate
            // Decrease concurrency - network/server struggling
            this.maxConcurrency = Math.max(
                this.adaptiveSettings.minConcurrency,
                this.maxConcurrency - 1
            );

            console.log(`🔻 Reducing concurrency to ${this.maxConcurrency} (high error rate: ${recentMetrics.errorRate})`);

        } else if (recentMetrics.responseTime < 2000 && recentMetrics.errorRate < 0.05) {
            // Good performance - try increasing concurrency
            this.maxConcurrency = Math.min(
                this.adaptiveSettings.maxConcurrency,
                this.maxConcurrency + 1
            );

            console.log(`🔺 Increasing concurrency to ${this.maxConcurrency} (good performance)`);
        }

        // Log current status
        console.log('📊 Performance metrics:', recentMetrics);
    }

    calculateRecentMetrics() {
        const recentData = 10; // Last 10 data points
        const errorRates = this.performanceMetrics.errorRate.slice(-recentData);
        const responseTimes = this.performanceMetrics.responseTime.slice(-recentData);

        return {
            errorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
            avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            throughput: 1000 / (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) // req/sec estimate
        };
    }
}
```


**Connection Pooling với HTTP/2:**


```javascript
// HTTP/2-aware upload manager
class HTTP2UploadManager {
    constructor() {
        this.isHTTP2 = this.detectHTTP2Support();
        this.concurrencyLimit = this.isHTTP2 ? 50 : 6; // HTTP/2 allows more multiplexing
    }

    detectHTTP2Support() {
        // Check if current connection uses HTTP/2
        // Note: Limited browser API support for this detection
        return 'serviceWorker' in navigator && window.chrome;
    }

    createOptimalRequestStrategy() {
        if (this.isHTTP2) {
            return {
                concurrency: 50,
                pipelining: true,
                serverPush: true,
                streamPriority: 'high'
            };
        } else {
            return {
                concurrency: 6,
                pipelining: false,
                connectionReuse: true,
                keepAlive: true
            };
        }
    }
}
```


#### 💭 Think Out Loud - Production Debugging:


**Debugging concurrency issues tại Figma:**


```javascript
// Issue: Upload progress stalling at random percentages
// Investigation process:

const debugConcurrencyStall = async (uploadManager) => {
    console.group('🔍 Concurrency Stall Debug');

    // Instrument upload manager với detailed logging
    const originalStartRequest = uploadManager.startRequest.bind(uploadManager);

    uploadManager.startRequest = async function(request) {
        const requestId = request.id;
        const timestamp = Date.now();

        console.log(`🚀 Starting request ${requestId} at ${new Date(timestamp).toISOString()}`);
        console.log(`📊 Active: ${this.activeRequests.size}, Queued: ${this.requestQueue.length}`);

        const startTime = performance.now();

        try {
            const result = await originalStartRequest(request);
            const duration = performance.now() - startTime;

            console.log(`✅ Completed request ${requestId} in ${Math.round(duration)}ms`);

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            console.error(`❌ Failed request ${requestId} after ${Math.round(duration)}ms:`, error);

            // Analyze error patterns
            this.analyzeErrorPattern(requestId, error, duration);

            throw error;
        }
    };

    // Monitor request pool state
    const poolMonitor = setInterval(() => {
        console.log('Pool state:', {
            active: uploadManager.activeRequests.size,
            queued: uploadManager.requestQueue.length,
            completed: uploadManager.completedCount,
            total: uploadManager.totalCount
        });

        // Detect stall condition
        if (
            uploadManager.activeRequests.size === 0 &&
            uploadManager.requestQueue.length > 0
        ) {
            console.error('🚫 STALL DETECTED: No active requests but queue not empty!');
            debugRequestQueueState(uploadManager);
        }
    }, 2000);

    // Clean up monitoring
    setTimeout(() => {
        clearInterval(poolMonitor);
        console.groupEnd();
    }, 60000); // Stop after 1 minute
};

const debugRequestQueueState = (uploadManager) => {
    console.group('🔍 Request Queue Analysis');

    // Inspect first few queued requests
    const sampleRequests = uploadManager.requestQueue.slice(0, 3);

    sampleRequests.forEach((request, index) => {
        console.log(`Queue item ${index}:`, {
            id: request.id,
            retryCount: request.retryCount,
            hasExecuteFunction: typeof request.execute === 'function',
            chunkSize: request.chunk?.size
        });
    });

    // Check for potential issues
    const issues = [];

    if (uploadManager.maxConcurrency <= 0) {
        issues.push('Max concurrency is <= 0');
    }

    if (sampleRequests.some(r => typeof r.execute !== 'function')) {
        issues.push('Some requests missing execute function');
    }

    if (issues.length > 0) {
        console.error('❌ Issues found:', issues);
    } else {
        console.log('✅ No obvious issues with queue state');
    }

    console.groupEnd();
};
```


#### 🏭 Production Considerations:


**At Axon (Body Camera Upload):**


```javascript
// Real-world production configuration
const productionUploadConfig = {
    // Environment-specific concurrency limits
    concurrency: {
        development: 2, // Gentle on dev servers
        staging: 4,     // Moderate load testing
        production: 6   // Optimized for production servers
    },

    // Retry strategy for critical uploads
    retryPolicy: {
        maxRetries: 5,
        baseDelay: 1000, // 1 second
        maxDelay: 30000, // 30 seconds max
        backoffMultiplier: 2,
        retryableErrors: [
            'NetworkError',
            'TimeoutError',
            'ServiceUnavailable'
        ]
    },

    // Circuit breaker pattern
    circuitBreaker: {
        failureThreshold: 5, // Trip after 5 consecutive failures
        resetTimeout: 60000,  // Try again after 1 minute
        monitoringWindow: 300000 // 5 minute window
    },

    // Performance monitoring
    monitoring: {
        logSlowRequests: 10000, // Log requests > 10s
        alertHighErrorRate: 0.1, // Alert if >10% error rate
        metricsReportingInterval: 30000 // Report metrics every 30s
    }
};

// Circuit breaker implementation
class UploadCircuitBreaker {
    constructor(config) {
        this.config = config;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
    }

    async execute(uploadFunction) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await uploadFunction();
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
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }
}
```


### 🔬 [Manual Upload Interruption] - Xử Lý Ngắt Upload


#### 🌱 Nguồn Gốc & Motivation:


**The User Control Problem:**
Trong traditional web applications, khi user click "upload" button, họ lose control completely cho đến khi process complete hoặc fail. Đây là poor UX pattern, đặc biệt với large file uploads có thể take hours.


**Psychology của User Control:**
Research trong HCI (Human-Computer Interaction) shows rằng users feel frustrated khi không thể cancel long-running operations. This creates anxiety và negative perception của application, even khi upload eventually succeeds.


**Technical Challenges:**


1. **Inflight Requests**: Làm sao cancel requests đã được sent?
2. **Partial State**: Làm sao preserve partial progress khi user resumes?
3. **Resource Cleanup**: Làm sao prevent memory leaks từ cancelled operations?
4. **State Synchronization**: Làm sao ensure client-server state remains consistent?


#### 🔬 Bản Chất & Mechanism:


**AbortController Deep Dive:**


```javascript
// AbortController là browser-native API cho cancellation
// Introduced trong DOM Living Standard để replace proprietary XMLHttpRequest.abort()

// Basic mechanism:
const controller = new AbortController();
const signal = controller.signal;

// Signal properties và events:
console.log(signal.aborted); // false initially
signal.addEventListener('abort', () => {
    console.log('Operation was aborted');
    console.log('Abort reason:', signal.reason);
});

// Trigger abort:
controller.abort('User cancelled upload');

// Signal state changes:
console.log(signal.aborted); // true after abort
console.log(signal.reason); // 'User cancelled upload'
```


**Fetch API Integration:**


```javascript
// AbortController integration với Fetch API
const uploadChunkWithCancellation = async (chunk, signal) => {
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: createFormData(chunk),
            signal: signal // Key: pass abort signal
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        if (error.name === 'AbortError') {
            // User-initiated cancellation
            console.log('Upload cancelled by user');
            throw new UploadCancelledError('User cancelled upload');
        } else {
            // Network or server error
            console.error('Upload failed:', error);
            throw new UploadFailedError(error.message);
        }
    }
};

// Custom error types for better error handling
class UploadCancelledError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UploadCancelledError';
        this.code = 'USER_CANCELLED';
    }
}

class UploadFailedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UploadFailedError';
        this.code = 'UPLOAD_FAILED';
    }
}
```


#### ⚙️ Advanced Cancellation Implementation:


**Multi-Request Cancellation Manager:**


```javascript
// Sophisticated cancellation system for concurrent uploads
class UploadCancellationManager {
    constructor() {
        this.controllers = new Map(); // requestId -> AbortController
        this.requestGroups = new Map(); // groupId -> Set of requestIds
        this.cancellationCallbacks = new Map(); // requestId -> cleanup function
    }

    // Create cancellable request
    createCancellableRequest(requestId, groupId = null) {
        const controller = new AbortController();
        this.controllers.set(requestId, controller);

        if (groupId) {
            if (!this.requestGroups.has(groupId)) {
                this.requestGroups.set(groupId, new Set());
            }
            this.requestGroups.get(groupId).add(requestId);
        }

        // Auto-cleanup when request completes
        const originalSignal = controller.signal;
        const enhancedSignal = this.enhanceSignal(originalSignal, requestId);

        return { controller, signal: enhancedSignal };
    }

    enhanceSignal(signal, requestId) {
        // Add cleanup hooks
        signal.addEventListener('abort', () => {
            this.cleanupRequest(requestId);
        });

        return signal;
    }

    // Cancel single request
    cancelRequest(requestId, reason = 'Request cancelled') {
        const controller = this.controllers.get(requestId);

        if (controller && !controller.signal.aborted) {
            console.log(`Cancelling request ${requestId}: ${reason}`);
            controller.abort(reason);
        }
    }

    // Cancel entire group (e.g., all chunks of a file)
    cancelGroup(groupId, reason = 'Group cancelled') {
        const requestIds = this.requestGroups.get(groupId);

        if (requestIds) {
            console.log(`Cancelling group ${groupId} (${requestIds.size} requests): ${reason}`);

            requestIds.forEach(requestId => {
                this.cancelRequest(requestId, reason);
            });

            this.requestGroups.delete(groupId);
        }
    }

    // Cancel all active requests
    cancelAll(reason = 'All requests cancelled') {
        console.log(`Cancelling all requests (${this.controllers.size} active): ${reason}`);

        this.controllers.forEach((controller, requestId) => {
            if (!controller.signal.aborted) {
                controller.abort(reason);
            }
        });

        this.cleanup();
    }

    // Register cleanup callback for request
    onRequestCleanup(requestId, callback) {
        this.cancellationCallbacks.set(requestId, callback);
    }

    cleanupRequest(requestId) {
        // Execute cleanup callback
        const callback = this.cancellationCallbacks.get(requestId);
        if (callback) {
            try {
                callback();
            } catch (error) {
                console.error(`Cleanup callback failed for ${requestId}:`, error);
            }
        }

        // Remove from tracking
        this.controllers.delete(requestId);
        this.cancellationCallbacks.delete(requestId);

        // Remove from groups
        this.requestGroups.forEach((requestIds, groupId) => {
            if (requestIds.has(requestId)) {
                requestIds.delete(requestId);

                // Clean up empty groups
                if (requestIds.size === 0) {
                    this.requestGroups.delete(groupId);
                }
            }
        });
    }

    cleanup() {
        this.controllers.clear();
        this.requestGroups.clear();
        this.cancellationCallbacks.clear();
    }

    // Get status information
    getStatus() {
        return {
            activeRequests: this.controllers.size,
            activeGroups: this.requestGroups.size,
            groups: Array.from(this.requestGroups.entries()).map(([groupId, requestIds]) => ({
                groupId,
                requestCount: requestIds.size
            }))
        };
    }
}
```


**Integration với Upload Manager:**


```javascript
// Upload manager với comprehensive cancellation support
class CancellableUploadManager {
    constructor(maxConcurrency = 6) {
        this.maxConcurrency = maxConcurrency;
        this.activeRequests = new Map(); // requestId -> Promise
        this.requestQueue = [];
        this.cancellationManager = new UploadCancellationManager();
        this.uploadState = 'idle'; // idle, uploading, paused, cancelled, completed
        this.fileId = null;
    }

    async uploadFile(file, onProgress = null, onStateChange = null) {
        this.fileId = await calculateFileHash(file);
        this.uploadState = 'uploading';

        if (onStateChange) onStateChange('uploading');

        try {
            const chunks = createChunks(file);
            const verification = await this.verifyFile(file);

            if (verification.shouldUpload) {
                const chunksToUpload = this.filterUnuploadedChunks(
                    chunks,
                    verification.existingChunks
                );

                await this.uploadChunks(chunksToUpload, onProgress);
                await this.mergeChunks(file);

                this.uploadState = 'completed';
                if (onStateChange) onStateChange('completed');

                return { success: true, fileId: this.fileId };
            } else {
                this.uploadState = 'completed';
                if (onStateChange) onStateChange('completed');

                return { success: true, instantUpload: true };
            }

        } catch (error) {
            if (error instanceof UploadCancelledError) {
                this.uploadState = 'cancelled';
                if (onStateChange) onStateChange('cancelled');
            } else {
                this.uploadState = 'failed';
                if (onStateChange) onStateChange('failed', error);
            }

            throw error;
        }
    }

    async uploadChunks(chunks, onProgress) {
        this.requestQueue = chunks.map((chunk, index) => ({
            id: `${this.fileId}-${index}`,
            chunk,
            index,
            retryCount: 0
        }));

        let completedCount = 0;
        const totalCount = chunks.length;

        const processRequests = async () => {
            while (this.activeRequests.size < this.maxConcurrency && this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                await this.startChunkUpload(request, () => {
                    completedCount++;
                    if (onProgress) {
                        onProgress(completedCount / totalCount);
                    }
                });
            }

            if (this.activeRequests.size > 0) {
                await Promise.race(this.activeRequests.values());
                await processRequests(); // Continue processing
            }
        };

        await processRequests();
    }

    async startChunkUpload(request, onComplete) {
        const { controller, signal } = this.cancellationManager.createCancellableRequest(
            request.id,
            this.fileId // Group ID
        );

        // Register cleanup callback
        this.cancellationManager.onRequestCleanup(request.id, () => {
            this.activeRequests.delete(request.id);
        });

        const uploadPromise = this.executeChunkUpload(request, signal)
            .then(result => {
                this.activeRequests.delete(request.id);
                onComplete();
                return result;
            })
            .catch(error => {
                this.activeRequests.delete(request.id);

                if (error instanceof UploadCancelledError) {
                    // Don't retry cancelled requests
                    throw error;
                }

                // Retry logic for failed requests
                if (request.retryCount < 3) {
                    request.retryCount++;
                    this.requestQueue.unshift(request); // Add back to front of queue
                    return; // Don't propagate error for retryable requests
                }

                throw error;
            });

        this.activeRequests.set(request.id, uploadPromise);
    }

    async executeChunkUpload(request, signal) {
        const formData = new FormData();
        formData.append('fileHash', this.fileId);
        formData.append('chunkHash', request.id);
        formData.append('chunkIndex', request.index);
        formData.append('chunk', request.chunk.createBlob());

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
            signal // Critical: pass abort signal
        });

        if (!response.ok) {
            throw new UploadFailedError(`Chunk upload failed: ${response.status}`);
        }

        return response.json();
    }

    // Public cancellation methods
    pauseUpload() {
        if (this.uploadState === 'uploading') {
            this.uploadState = 'paused';
            this.cancellationManager.cancelGroup(this.fileId, 'Upload paused by user');
            console.log('Upload paused. Can be resumed later.');
        }
    }

    cancelUpload() {
        if (['uploading', 'paused'].includes(this.uploadState)) {
            this.uploadState = 'cancelled';
            this.cancellationManager.cancelGroup(this.fileId, 'Upload cancelled by user');
            console.log('Upload cancelled by user.');
        }
    }

    resumeUpload() {
        if (this.uploadState === 'paused') {
            // Would need to re-implement upload logic with current state
            // This is simplified - real implementation would store intermediate state
            console.log('Resume functionality would re-verify and continue upload');
        }
    }
}
```


#### 💭 Think Out Loud - User Experience Considerations:


**UX challenges tại Webflow:**


```javascript
// Challenge: Users frequently cancel large video uploads midway
// Analysis: Why do users cancel? How can we reduce cancellations?

const analyzeCancellationPatterns = () => {
    // Telemetry data analysis (anonymized)
    const cancellationReasons = {
        // Time-based cancellations
        'took_too_long': 34%, // Users cancel after 2+ minutes
        'no_progress_indicator': 18%, // Users think upload froze
        'accidental_click': 12%, // UI placement issues

        // Context switching
        'need_to_leave': 15%, // Users need to close browser/laptop
        'wrong_file': 11%, // Realized uploaded wrong file
        'network_issues': 7%, // Connection problems
        'other': 3%
    };

    // UX improvement strategies:
    const improvements = {
        // Address "took_too_long"
        better_time_estimates: {
            implementation: 'Show accurate ETA based on current network speed',
            impact: 'Reduce anxiety about upload duration'
        },

        // Address "no_progress_indicator"
        rich_progress_feedback: {
            implementation: 'Show chunks completed, current speed, time remaining',
            impact: 'Users understand something is happening'
        },

        // Address "accidental_click"
        confirmation_dialog: {
            implementation: 'Confirm before cancelling uploads >50% complete',
            impact: 'Prevent accidental cancellations'
        },

        // Address "need_to_leave"
        background_upload: {
            implementation: 'Continue upload in Service Worker',
            impact: 'Upload survives tab/window closes'
        }
    };

    return { cancellationReasons, improvements };
};

// Implementation of improved cancellation UX
const createUserFriendlyCancellation = () => {
    return {
        // Confirmation dialog for substantial uploads
        showCancellationDialog: (uploadProgress, estimatedTimeRemaining) => {
            if (uploadProgress > 0.5) { // >50% complete
                const dialog = {
                    title: 'Cancel upload?',
                    message: `Your upload is ${Math.round(uploadProgress * 100)}% complete.
                             Estimated ${formatTime(estimatedTimeRemaining)} remaining.`,
                    actions: [
                        {
                            text: 'Keep uploading',
                            action: 'continue',
                            style: 'primary'
                        },
                        {
                            text: 'Pause upload',
                            action: 'pause',
                            style: 'secondary'
                        },
                        {
                            text: 'Cancel upload',
                            action: 'cancel',
                            style: 'destructive'
                        }
                    ]
                };

                return showModal(dialog);
            } else {
                // Low progress - allow immediate cancellation
                return Promise.resolve('cancel');
            }
        },

        // Graceful cancellation with cleanup
        performGracefulCancellation: async (uploadManager) => {
            // 1. Stop accepting new requests
            uploadManager.pauseUpload();

            // 2. Allow inflight requests to complete (with timeout)
            const gracePeriod = 10000; // 10 seconds

            try {
                await Promise.race([
                    waitForInflightRequests(uploadManager),
                    delay(gracePeriod)
                ]);
            } catch (error) {
                console.warn('Some requests did not complete gracefully');
            }

            // 3. Force cancellation of remaining requests
            uploadManager.cancelUpload();

            // 4. Show user-friendly message
            showNotification({
                type: 'info',
                message: 'Upload cancelled. Your progress has been saved.',
                action: {
                    text: 'Resume later',
                    handler: () => openUploadResumePage()
                }
            });
        }
    };
};
```


#### 🎯 Production Implementation Checklist:


**Critical Requirements:**


```javascript
const productionCancellationChecklist = {
    // ✅ Must-have features
    essentialFeatures: [
        'Immediate response to cancel button',
        'Prevent new requests after cancellation',
        'Clean up active requests gracefully',
        'Preserve partial upload progress',
        'Clear user feedback about cancellation status'
    ],

    // ✅ Error handling
    errorHandling: [
        'Distinguish user cancellation from network errors',
        'Proper cleanup on cancellation errors',
        'Prevent memory leaks from cancelled requests',
        'Handle race conditions between cancel and completion'
    ],

    // ✅ User experience
    userExperience: [
        'Confirmation dialog for substantial progress',
        'Pause option as alternative to cancellation',
        'Clear indication of cancellation status',
        'Ability to resume cancelled uploads'
    ],

    // ✅ Technical robustness
    technicalRobustness: [
        'AbortController support check and polyfill',
        'Proper signal propagation to all requests',
        'Resource cleanup (controllers, listeners, timers)',
        'State consistency after cancellation'
    ]
};

// Production-ready cancellation implementation
class ProductionCancellationSystem {
    constructor() {
        this.cancellationManager = new UploadCancellationManager();
        this.userConfirmation = new CancellationConfirmationService();
        this.telemetry = new CancellationTelemetryService();
    }

    async requestCancellation(uploadSession, reason = 'user_request') {
        // Record cancellation attempt for analytics
        this.telemetry.recordCancellationAttempt(uploadSession, reason);

        try {
            // Check if confirmation needed
            const confirmationResult = await this.userConfirmation.checkNeedConfirmation(
                uploadSession
            );

            if (confirmationResult.needsConfirmation) {
                const userChoice = await this.userConfirmation.showDialog(
                    confirmationResult.dialogConfig
                );

                switch (userChoice) {
                    case 'continue':
                        this.telemetry.recordCancellationAborted(uploadSession);
                        return { cancelled: false, action: 'continued' };

                    case 'pause':
                        await this.performPause(uploadSession);
                        return { cancelled: false, action: 'paused' };

                    case 'cancel':
                        await this.performCancellation(uploadSession, 'confirmed');
                        return { cancelled: true, action: 'cancelled' };
                }
            } else {
                // Direct cancellation
                await this.performCancellation(uploadSession, 'immediate');
                return { cancelled: true, action: 'cancelled' };
            }

        } catch (error) {
            console.error('Cancellation request failed:', error);
            this.telemetry.recordCancellationError(uploadSession, error);

            // Fail-safe: perform emergency cancellation
            await this.performEmergencyCancellation(uploadSession);
            return { cancelled: true, action: 'emergency' };
        }
    }

    async performCancellation(uploadSession, type) {
        const startTime = performance.now();

        try {
            // 1. Update session state
            uploadSession.status = 'cancelling';

            // 2. Cancel all requests for this session
            this.cancellationManager.cancelGroup(
                uploadSession.fileId,
                'User cancelled upload'
            );

            // 3. Perform cleanup
            await this.cleanupCancelledSession(uploadSession);

            // 4. Update final state
            uploadSession.status = 'cancelled';
            uploadSession.cancelledAt = new Date().toISOString();

            // 5. Record telemetry
            const duration = performance.now() - startTime;
            this.telemetry.recordSuccessfulCancellation(uploadSession, type, duration);

            console.log(`Upload cancelled successfully in ${Math.round(duration)}ms`);

        } catch (error) {
            console.error('Cancellation failed:', error);
            throw new CancellationError('Failed to cancel upload', error);
        }
    }
}
```


## 🔬 [File Merging Strategy] - Chiến Lược Ghép File


#### 🌱 Nguồn Gốc & Motivation:


**The Reassembly Challenge:**
Sau khi tất cả chunks được upload thành công, server phải "reconstruct" original file từ pieces. Đây không phải simple concatenation - cần ensure:


1. **Correct Order**: Chunks must be assembled trong đúng sequence
2. **Data Integrity**: No corruption during transfer hoặc storage
3. **Atomicity**: Either complete file hoặc no file (no partial corrupted files)
4. **Performance**: Minimize memory usage và disk I/O
5. **Cleanup**: Remove temporary chunks sau khi merge


**Traditional Approaches và Limitations:**


```javascript
// Naive approach - ❌ PROBLEMATIC for large files:
const mergeChunksNaive = async (chunks) => {
    let mergedData = new Uint8Array(0);

    for (const chunk of chunks) {
        const chunkData = await readFile(chunk.path);
        // Problem: This creates new array mỗi lần, copying all previous data
        mergedData = concatArrays(mergedData, chunkData);
    }

    await writeFile('merged.file', mergedData);
};

// Issues with naive approach:
// 1. Memory usage: O(n²) where n is file size
// 2. Time complexity: O(n²) due to repeated copying
// 3. Memory peak: Up to 2x file size in memory
// 4. Risk of out-of-memory errors for large files
```


#### 🔬 Bản Chất & Mechanism:


**Stream-Based Merging:**
Thay vì load entire file vào memory, sử dụng streams để read chunks và write trực tiếp to final file:


```javascript
// Server-side streaming merge implementation
const mergeChunksEfficiently = async (fileHash, originalFileName, chunkSize) => {
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
    const finalPath = path.resolve(UPLOAD_DIR, 'complete', `${fileHash}${getFileExtension(originalFileName)}`);

    // 1. Discover và sort chunks
    const chunkFiles = await discoverChunks(chunkDir);
    const sortedChunks = sortChunksByIndex(chunkFiles);

    // 2. Validate chunk sequence
    await validateChunkSequence(sortedChunks, fileHash);

    // 3. Stream-based merge
    await streamMergeChunks(sortedChunks, finalPath, chunkSize);

    // 4. Cleanup temporary files
    await cleanupChunkDirectory(chunkDir);

    return finalPath;
};

// Chunk discovery và sorting
const discoverChunks = async (chunkDir) => {
    const files = await fs.readdir(chunkDir);

    return files
        .filter(filename => filename.includes('-')) // Filter out metadata files
        .map(filename => {
            const fullPath = path.join(chunkDir, filename);
            const parts = filename.split('-');
            const chunkIndex = parseInt(parts[parts.length - 1]);

            return {
                filename,
                fullPath,
                index: chunkIndex
            };
        });
};

const sortChunksByIndex = (chunks) => {
    return chunks.sort((a, b) => a.index - b.index);
};

// Critical validation step
const validateChunkSequence = async (chunks, expectedFileHash) => {
    // Check for missing chunks
    const expectedIndices = Array.from({ length: chunks.length }, (_, i) => i);
    const actualIndices = chunks.map(chunk => chunk.index);

    const missingIndices = expectedIndices.filter(i => !actualIndices.includes(i));

    if (missingIndices.length > 0) {
        throw new Error(`Missing chunks: ${missingIndices.join(', ')}`);
    }

    // Check for duplicate chunks
    const duplicateIndices = actualIndices.filter((index, pos) =>
        actualIndices.indexOf(index) !== pos
    );

    if (duplicateIndices.length > 0) {
        throw new Error(`Duplicate chunks: ${duplicateIndices.join(', ')}`);
    }

    // Validate chunk naming convention
    chunks.forEach(chunk => {
        const expectedName = `${expectedFileHash}-${chunk.index}`;
        if (!chunk.filename.startsWith(expectedName)) {
            throw new Error(`Invalid chunk name: ${chunk.filename}`);
        }
    });
};
```


**Advanced Stream Merging:**


```javascript
// High-performance streaming merge với positioned writes
const streamMergeChunks = async (chunks, finalPath, chunkSize) => {
    // Create write stream với specified file descriptor mode
    const writeStream = fs.createWriteStream(finalPath, {
        flags: 'w',  // Write mode, truncate if exists
        highWaterMark: 64 * 1024 // 64KB buffer để optimize disk writes
    });

    let totalBytesWritten = 0;

    try {
        for (const [index, chunk] of chunks.entries()) {
            console.log(`Merging chunk ${index + 1}/${chunks.length}: ${chunk.filename}`);

            // Calculate expected position
            const expectedPosition = index * chunkSize;

            // Validate actual file position
            if (totalBytesWritten !== expectedPosition) {
                throw new Error(
                    `Position mismatch at chunk ${index}: expected ${expectedPosition}, got ${totalBytesWritten}`
                );
            }

            // Stream chunk data trực tiếp to final file
            const bytesWritten = await streamChunkToFile(chunk.fullPath, writeStream);

            totalBytesWritten += bytesWritten;

            // Validate chunk size (except possibly last chunk)
            if (index < chunks.length - 1 && bytesWritten !== chunkSize) {
                throw new Error(
                    `Chunk ${index} size mismatch: expected ${chunkSize}, got ${bytesWritten}`
                );
            }
        }

    } finally {
        // Ensure write stream is properly closed
        await new Promise((resolve, reject) => {
            writeStream.end((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    console.log(`Merge completed: ${totalBytesWritten} bytes written to ${finalPath}`);

    return totalBytesWritten;
};

// Helper function để stream individual chunk
const streamChunkToFile = (chunkPath, writeStream) => {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        let bytesWritten = 0;

        readStream.on('data', (chunk) => {
            bytesWritten += chunk.length;

            if (!writeStream.write(chunk)) {
                // Back-pressure: pause reading until drain
                readStream.pause();
                writeStream.once('drain', () => readStream.resume());
            }
        });

        readStream.on('end', () => {
            resolve(bytesWritten);
        });

        readStream.on('error', (error) => {
            reject(new Error(`Failed to read chunk ${chunkPath}: ${error.message}`));
        });
    });
};
```


#### ⚙️ Advanced Merging Strategies:


**Parallel Positioned Writes:**
For systems with multiple disks hoặc SSD arrays, có thể optimize bằng positioned writes:


```javascript
// Advanced parallel merge với positioned writes
const parallelPositionedMerge = async (chunks, finalPath, chunkSize) => {
    // Pre-allocate file với correct size
    const totalSize = calculateTotalFileSize(chunks, chunkSize);
    await preallocateFile(finalPath, totalSize);

    // Open file descriptor for positioned writes
    const fd = await fs.open(finalPath, 'r+'); // Read-write mode

    try {
        // Process chunks in parallel với positioned writes
        const mergePromises = chunks.map(async (chunk, index) => {
            const position = index * chunkSize;
            const chunkData = await fs.readFile(chunk.fullPath);

            // Write directly to position trong file
            await fd.write(chunkData, 0, chunkData.length, position);

            return chunkData.length;
        });

        const bytesWritten = await Promise.all(mergePromises);
        const totalBytesWritten = bytesWritten.reduce((sum, bytes) => sum + bytes, 0);

        console.log(`Parallel merge completed: ${totalBytesWritten} bytes`);

        return totalBytesWritten;

    } finally {
        await fd.close();
    }
};

const preallocateFile = async (filePath, size) => {
    // Create sparse file với correct size
    const fd = await fs.open(filePath, 'w');

    try {
        // Truncate to desired size (creates sparse file)
        await fd.truncate(size);
    } finally {
        await fd.close();
    }
};

const calculateTotalFileSize = (chunks, chunkSize) => {
    // Most chunks are full size, except possibly the last one
    const fullChunks = chunks.length - 1;
    let totalSize = fullChunks * chunkSize;

    // Add size of last chunk (may be smaller)
    const lastChunk = chunks[chunks.length - 1];
    const lastChunkSize = fs.statSync(lastChunk.fullPath).size;
    totalSize += lastChunkSize;

    return totalSize;
};
```


**Integrity Verification During Merge:**


```javascript
// Merge với integrated integrity checking
const mergeWithIntegrityCheck = async (chunks, finalPath, originalFileHash) => {
    const hasher = crypto.createHash('md5');
    let totalBytesProcessed = 0;

    const writeStream = fs.createWriteStream(finalPath);

    try {
        for (const chunk of chunks) {
            const chunkData = await fs.readFile(chunk.fullPath);

            // Update running hash
            hasher.update(chunkData);

            // Write to final file
            writeStream.write(chunkData);

            totalBytesProcessed += chunkData.length;

            // Optional: Verify individual chunk integrity
            if (ENABLE_CHUNK_VERIFICATION) {
                const chunkHash = crypto.createHash('md5').update(chunkData).digest('hex');
                const expectedChunkHash = await getStoredChunkHash(chunk.filename);

                if (chunkHash !== expectedChunkHash) {
                    throw new Error(`Chunk integrity check failed: ${chunk.filename}`);
                }
            }
        }

        writeStream.end();
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Verify final file hash
        const finalFileHash = hasher.digest('hex');

        if (finalFileHash !== originalFileHash) {
            // Delete corrupted file
            await fs.unlink(finalPath);

            throw new Error(
                `File integrity check failed: expected ${originalFileHash}, got ${finalFileHash}`
            );
        }

        console.log(`✅ File merge và integrity check completed: ${finalPath}`);

        return {
            path: finalPath,
            size: totalBytesProcessed,
            hash: finalFileHash,
            verified: true
        };

    } catch (error) {
        // Cleanup partial file on error
        try {
            await fs.unlink(finalPath);
        } catch (cleanupError) {
            console.error('Failed to cleanup partial file:', cleanupError);
        }

        throw error;
    }
};
```


#### 💭 Think Out Loud - Production Debugging:


**Real debugging scenario tại NAB:**


```javascript
// Issue: Some merged files were corrupted - random bytes missing
// Investigation revealed race condition trong parallel merging

const debugMergeCorruption = async (uploadSession) => {
    console.group('🔍 Merge Corruption Debug');

    // Step 1: Verify chunk integrity before merge
    const chunks = await discoverChunks(uploadSession.chunkDir);
    const chunkVerificationResults = await Promise.all(
        chunks.map(async (chunk) => {
            const chunkData = await fs.readFile(chunk.fullPath);
            const actualSize = chunkData.length;
            const expectedSize = chunk.index < chunks.length - 1
                ? uploadSession.chunkSize
                : uploadSession.fileSize % uploadSession.chunkSize || uploadSession.chunkSize;

            return {
                filename: chunk.filename,
                index: chunk.index,
                actualSize,
                expectedSize,
                isValid: actualSize === expectedSize
            };
        })
    );

    const corruptedChunks = chunkVerificationResults.filter(r => !r.isValid);

    if (corruptedChunks.length > 0) {
        console.error('❌ Corrupted chunks detected:', corruptedChunks);
    } else {
        console.log('✅ All chunks verified intact');
    }

    // Step 2: Test merge với different strategies
    const mergeStrategies = [
        { name: 'sequential', fn: streamMergeChunks },
        { name: 'parallel', fn: parallelPositionedMerge }
    ];

    const mergeResults = [];

    for (const strategy of mergeStrategies) {
        console.log(`Testing ${strategy.name} merge...`);

        const tempPath = `${uploadSession.finalPath}.${strategy.name}.tmp`;

        try {
            const startTime = performance.now();
            const result = await strategy.fn(chunks, tempPath, uploadSession.chunkSize);
            const duration = performance.now() - startTime;

            // Verify merged file
            const mergedData = await fs.readFile(tempPath);
            const mergedHash = crypto.createHash('md5').update(mergedData).digest('hex');

            mergeResults.push({
                strategy: strategy.name,
                success: true,
                duration,
                size: mergedData.length,
                hash: mergedHash,
                matchesExpected: mergedHash === uploadSession.expectedHash
            });

            // Cleanup test file
            await fs.unlink(tempPath);

        } catch (error) {
            mergeResults.push({
                strategy: strategy.name,
                success: false,
                error: error.message
            });
        }
    }

    console.table(mergeResults);

    // Step 3: Analyze results
    const workingStrategies = mergeResults.filter(r => r.success && r.matchesExpected);
    const failingStrategies = mergeResults.filter(r => !r.success || !r.matchesExpected);

    if (failingStrategies.length > 0) {
        console.error('❌ Strategies that failed:', failingStrategies);
    }

    if (workingStrategies.length > 0) {
        console.log('✅ Working strategies:', workingStrategies);

        // Recommend optimal strategy
        const fastest = workingStrategies.reduce((prev, current) =>
            current.duration < prev.duration ? current : prev
        );

        console.log(`🏆 Recommended strategy: ${fastest.strategy} (${Math.round(fastest.duration)}ms)`);
    }

    console.groupEnd();
};
```


#### 🏭 Production Considerations:


**At Binance - High Volume File Processing:**


```javascript
// Production merge system với queuing và monitoring
class ProductionMergeSystem {
    constructor() {
        this.mergeQueue = new Map(); // fileHash -> merge job
        this.activeMerges = new Set(); // Currently processing
        this.maxConcurrentMerges = 3; // Limit concurrent disk I/O
        this.metrics = new MergeMetrics();
    }

    async enqueueMerge(uploadSession) {
        const mergeJob = {
            id: generateId(),
            fileHash: uploadSession.fileHash,
            uploadSession,
            status: 'queued',
            enqueuedAt: Date.now(),
            attempts: 0
        };

        this.mergeQueue.set(uploadSession.fileHash, mergeJob);

        console.log(`Merge job ${mergeJob.id} queued for file ${uploadSession.fileHash}`);

        // Start processing if capacity available
        this.processQueue();

        return mergeJob.id;
    }

    async processQueue() {
        while (
            this.activeMerges.size < this.maxConcurrentMerges &&
            this.mergeQueue.size > 0
        ) {
            const [fileHash, mergeJob] = this.mergeQueue.entries().next().value;
            this.mergeQueue.delete(fileHash);

            this.startMergeJob(mergeJob);
        }
    }

    async startMergeJob(mergeJob) {
        mergeJob.status = 'processing';
        mergeJob.startedAt = Date.now();
        this.activeMerges.add(mergeJob.id);

        try {
            console.log(`Starting merge job ${mergeJob.id}`);

            // Execute merge với timeout
            const mergeResult = await Promise.race([
                this.executeMergeWithRetry(mergeJob),
                this.createTimeoutPromise(5 * 60 * 1000) // 5 minute timeout
            ]);

            mergeJob.status = 'completed';
            mergeJob.completedAt = Date.now();
            mergeJob.result = mergeResult;

            this.metrics.recordSuccess(mergeJob);

            console.log(`✅ Merge job ${mergeJob.id} completed successfully`);

        } catch (error) {
            mergeJob.status = 'failed';
            mergeJob.error = error.message;
            mergeJob.failedAt = Date.now();

            this.metrics.recordFailure(mergeJob, error);

            console.error(`❌ Merge job ${mergeJob.id} failed:`, error);

            // Retry logic
            if (mergeJob.attempts < 2 && this.isRetryableError(error)) {
                console.log(`Retrying merge job ${mergeJob.id} (attempt ${mergeJob.attempts + 1})`);

                mergeJob.attempts++;
                mergeJob.status = 'queued';
                this.mergeQueue.set(mergeJob.fileHash, mergeJob);
            }

        } finally {
            this.activeMerges.delete(mergeJob.id);

            // Continue processing queue
            setImmediate(() => this.processQueue());
        }
    }

    async executeMergeWithRetry(mergeJob) {
        const { uploadSession } = mergeJob;

        // Pre-merge validation
        await this.validatePreMergeConditions(uploadSession);

        // Execute merge
        const mergeResult = await this.executeMerge(uploadSession);

        // Post-merge validation
        await this.validatePostMergeResult(mergeResult, uploadSession);

        // Cleanup temporary files
        await this.cleanupTempFiles(uploadSession);

        return mergeResult;
    }

    async validatePreMergeConditions(uploadSession) {
        // Check all chunks exist
        const chunks = await discoverChunks(uploadSession.chunkDir);

        if (chunks.length !== uploadSession.expectedChunkCount) {
            throw new Error(
                `Missing chunks: expected ${uploadSession.expectedChunkCount}, found ${chunks.length}`
            );
        }

        // Check disk space
        const requiredSpace = uploadSession.fileSize * 1.5; // 50% buffer
        const availableSpace = await this.getAvailableDiskSpace();

        if (availableSpace < requiredSpace) {
            throw new Error(
                `Insufficient disk space: required ${requiredSpace}, available ${availableSpace}`
            );
        }

        // Check system load
        const systemLoad = await this.getSystemLoad();

        if (systemLoad.cpu > 80 || systemLoad.memory > 90) {
            throw new Error(
                `High system load: CPU ${systemLoad.cpu}%, Memory ${systemLoad.memory}%`
            );
        }
    }

    createTimeoutPromise(timeoutMs) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Merge operation timeout after ${timeoutMs}ms`));
            }, timeoutMs);
        });
    }

    isRetryableError(error) {
        const retryableErrors = [
            'ENOSPC', // No space left
            'EMFILE', // Too many open files
            'EAGAIN', // Resource temporarily unavailable
            'EIO'     // I/O error
        ];

        return retryableErrors.some(code => error.message.includes(code));
    }
}

// Metrics collection for monitoring
class MergeMetrics {
    constructor() {
        this.successCount = 0;
        this.failureCount = 0;
        this.totalProcessingTime = 0;
        this.averageFileSize = 0;
    }

    recordSuccess(mergeJob) {
        this.successCount++;

        const processingTime = mergeJob.completedAt - mergeJob.startedAt;
        this.totalProcessingTime += processingTime;

        const fileSize = mergeJob.uploadSession.fileSize;
        this.averageFileSize = (this.averageFileSize * (this.successCount - 1) + fileSize) / this.successCount;

        console.log('📊 Merge metrics updated:', this.getMetrics());
    }

    recordFailure(mergeJob, error) {
        this.failureCount++;

        console.error('📊 Merge failure recorded:', {
            jobId: mergeJob.id,
            error: error.message,
            totalFailures: this.failureCount
        });
    }

    getMetrics() {
        const totalJobs = this.successCount + this.failureCount;
        const successRate = totalJobs > 0 ? (this.successCount / totalJobs) * 100 : 0;
        const averageProcessingTime = this.successCount > 0 ? this.totalProcessingTime / this.successCount : 0;

        return {
            totalJobs,
            successCount: this.successCount,
            failureCount: this.failureCount,
            successRate: successRate.toFixed(2) + '%',
            averageProcessingTime: Math.round(averageProcessingTime) + 'ms',
            averageFileSize: Math.round(this.averageFileSize / 1024 / 1024) + 'MB'
        };
    }
}
```


## 🎯 Production Engineering Insights


### 💭 Think Out Loud - Architectural Decisions:


**Khi tôi design large file upload system tại các công ty:**


**At NAB (Banking Platform):**


- **Challenge**: Regulatory requirements về data integrity và audit trails
- **Solution**: Implemented cryptographic signatures cho mỗi chunk + immutable audit log
- **Learning**: Financial services cần absolutely bulletproof error handling


**At Axon (Law Enforcement):**


- **Challenge**: Body camera footage (100GB+ files) từ mobile networks unstable
- **Solution**: Advanced retry strategies với exponential backoff + offline queuing
- **Learning**: Public safety applications cần work trong worst-case network conditions


**At Binance (Trading Platform):**


- **Challenge**: High-frequency trading data uploads với millisecond precision requirements
- **Solution**: Custom TCP-based protocol để minimize latency overhead
- **Learning**: Sometimes REST/HTTP không phải optimal solution cho performance-critical apps


**At Webflow (Design Tool):**


- **Challenge**: Creative workflows cần seamless experience - uploads shouldn't interrupt design process
- **Solution**: Background service worker uploads + progressive enhancement
- **Learning**: UX trumps technical elegance - invisible uploads are best uploads


**At Figma (Collaborative Design):**


- **Challenge**: Real-time collaboration during file uploads
- **Solution**: Incremental upload của design asset changes + conflict resolution
- **Learning**: Modern apps cần handle concurrent operations gracefully


### 🔧 Advanced Topics & Follow-up Questions:


#### Scaling Considerations:


1. **How do you handle upload storms?**

Load balancing across multiple upload servers
Rate limiting per user/IP
Circuit breaker patterns
Auto-scaling based on upload queue depth
2. **Database design cho upload metadata?**

Partitioning strategies cho large-scale uploads
Indexing cho efficient queries
Cleanup policies cho old upload sessions
Sharding considerations
3. **CDN integration strategies?**

Direct-to-CDN uploads
Edge-based chunk processing
Global upload acceleration
Cost optimization


#### Security Deep Dive:


1. **How do you prevent malicious uploads?**

File type validation beyond MIME types
Content scanning và malware detection
Size limits và quota enforcement
Sandboxed processing environments
2. **Authentication và authorization cho uploads?**

JWT tokens với upload scopes
Pre-signed URLs cho direct uploads
Rate limiting strategies
Audit logging


#### Error Handling & Resilience:


1. **Comprehensive error taxonomy:**

Network errors (timeout, connection reset, etc.)
Server errors (disk full, permission denied, etc.)
Client errors (invalid chunks, hash mismatches, etc.)
Business logic errors (quota exceeded, file too large, etc.)
2. **Recovery strategies:**

Automatic retry với intelligent backoff
Circuit breaker patterns
Graceful degradation
Manual intervention processes


### 📋 Interview Questions - Different Levels:


#### Junior Level:


1. "Explain tại sao chúng ta không thể upload một file 2GB trong một HTTP request?"
2. "File.slice() hoạt động như thế nào? Nó có copy data không?"
3. "AbortController là gì và tại sao chúng ta cần nó?"


#### Mid Level:


1. "Design một strategy để calculate file hash without loading entire file vào memory"
2. "How would you implement resumable uploads? Walk through the client-server flow"
3. "What happens nếu user closes browser tab during upload? How do you handle này?"


#### Senior Level:


1. "Design a distributed file upload system that can handle 100,000 concurrent uploads"
2. "How do you ensure data integrity across the entire upload pipeline? Consider network, disk, và memory corruption"
3. "Implement a fairness algorithm cho resource allocation during concurrent uploads"


#### Principal Level:


1. "You're tasked với migrating from single-server uploads to microservices architecture. Design the system và migration strategy"
2. "Design một upload system for a global application with strict compliance requirements (GDPR, SOX, HIPAA)"
3. "How would you architect uploads for a real-time collaborative application where files are being edited during upload?"


### 🎯 Verification & Mastery Checkpoints:


#### Fundamental Understanding:


- Can explain HTTP limitations với large files
- Understands browser memory constraints
- Knows difference between File API và FileReader API
- Can implement basic chunking algorithm


#### Intermediate Mastery:


- Can implement hash calculation với sampling strategy
- Understands concurrency control patterns
- Can handle upload cancellation gracefully
- Implements proper error handling và retry logic


#### Advanced Expertise:


- Can design scalable upload architecture
- Implements comprehensive monitoring và alerting
- Handles edge cases và failure scenarios
- Optimizes for different network conditions


#### Principal-Level Thinking:


- Makes informed architectural trade-offs
- Considers business requirements trong technical design
- Plans for evolution và maintenance
- Mentors team on complex upload scenarios


### 🌟 Final Thoughts - What Makes This Complex:


Large file upload không phải chỉ về moving data từ client to server. It's about:


1. **User Experience**: Making something inherently slow feel fast và responsive
2. **Reliability**: Working across diverse network conditions và device constraints
3. **Scalability**: Handling growth from hundreds to millions of concurrent uploads
4. **Security**: Protecting against malicious uploads while maintaining performance
5. **Maintainability**: Building systems that teams can understand, debug, và evolve


**The real challenge** isn't implementing upload - it's making it invisible to users while being bulletproof under the hood. Every edge case you don't handle will surface in production, usually at the worst possible time.


**Success metrics** aren't just "files get uploaded" - they're:


- Upload success rate > 99.9%
- Average time-to-completion perception
- Zero data loss/corruption incidents
- Graceful handling of network interruptions
- Intuitive user controls và progress indication


This is why senior engineers spend 80% of time on the "boring" parts (error handling, monitoring, cleanup) và only 20% on the "fun" parts (the actual upload logic). The magic is in the details that users never see.


---


*"The best upload system is the one users never think about - it just works, every time, under any conditions."*
