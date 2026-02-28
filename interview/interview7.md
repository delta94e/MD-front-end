# CUỘC PHỎNG VẤN MÔ PHỎNG: SENIOR FRONTEND ENGINEER TẠI GOOGLE

## Full-Day Onsite Interview Simulation

---

**Thông tin ứng viên:** Nguyễn Minh Tuấn - 6 năm kinh nghiệm Frontend
**Vị trí ứng tuyển:** Senior Frontend Engineer (L5)
**Địa điểm:** Google Singapore Office
**Thời gian:** 8:30 AM - 5:30 PM

---

# ROUND 1: CODING QUESTIONS (2 tiếng)

## Interviewer: Sarah Chen - Senior Staff Engineer, Google Search Team

---

**8:30 AM - Bắt đầu**

**Sarah:** Chào Tuấn, rất vui được gặp em hôm nay. Anh là Sarah, hiện đang làm Senior Staff Engineer trong team Google Search. Hôm nay mình sẽ bắt đầu với phần coding nhé. Em có cần nghỉ ngơi gì không hay mình bắt đầu luôn?

**Tuấn:** Dạ chào chị Sarah, em cảm ơn chị. Em sẵn sàng rồi ạ, mình bắt đầu luôn được ạ.

**Sarah:** Tuyệt vời. Trước khi vào bài, chị muốn em biết là trong suốt buổi phỏng vấn, chị quan tâm đến cách em suy nghĩ và approach vấn đề hơn là chỉ đưa ra đáp án đúng. Nên em cứ thoải mái think out loud nhé, nếu có chỗ nào chưa rõ thì cứ hỏi chị.

**Tuấn:** Dạ vâng, em hiểu rồi ạ. Em sẽ cố gắng giải thích rõ thought process của em.

---

## Bài 1: Algorithmic Coding - LRU Cache Implementation

**Sarah:** Được rồi, bài đầu tiên chị muốn em implement một LRU Cache. Em biết LRU Cache là gì chứ?

**Tuấn:** Dạ có ạ. LRU là Least Recently Used, là một caching strategy mà khi cache đầy, item nào lâu nhất không được sử dụng sẽ bị loại bỏ để nhường chỗ cho item mới. Nó thường được dùng trong các scenario như browser cache, database query cache, hay memory management.

**Sarah:** Đúng rồi. Vậy em implement cho chị một LRU Cache với hai operation chính là get và put. Get sẽ trả về value nếu key tồn tại, còn không thì trả về negative one. Put sẽ thêm hoặc update key-value pair. Cache có capacity cố định, khi đầy thì evict item least recently used. Requirement là cả hai operation phải có time complexity O của một. Em nghĩ sao?

**Tuấn:** Dạ, để đạt được O của một cho cả hai operation thì em cần phải kết hợp hai data structure. Nếu chỉ dùng array thôi thì việc tìm kiếm sẽ là O của n. Nếu chỉ dùng hash map thì em không track được thứ tự access.

**Sarah:** Tiếp tục đi em, chị đang nghe.

**Tuấn:** Dạ, em nghĩ mình cần kết hợp một Hash Map với một Doubly Linked List. Hash Map sẽ cho phép em lookup key trong O của một. Còn Doubly Linked List sẽ giúp em maintain thứ tự access, với item được access gần nhất ở đầu list và item lâu nhất ở cuối list.

**Sarah:** Tại sao lại là Doubly Linked List mà không phải Singly Linked List?

**Tuấn:** À câu hỏi hay ạ. Với Singly Linked List, khi em muốn remove một node ở giữa, em cần phải traverse từ đầu để tìm node trước đó, việc này sẽ tốn O của n. Nhưng với Doubly Linked List, mỗi node có pointer đến cả node trước và sau, nên em có thể remove node bất kỳ trong O của một chỉ bằng cách update pointer của hai node adjacent.

**Sarah:** Tốt. Vậy em mô tả cho chị flow của operation get và put sẽ như thế nào?

**Tuấn:** Dạ, với operation get, đầu tiên em check trong Hash Map xem key có tồn tại không. Nếu không có thì return negative one. Nếu có, em sẽ lấy node tương ứng, move nó lên đầu linked list vì nó vừa được access, rồi return value.

**Sarah:** Move lên đầu cụ thể em làm sao?

**Tuấn:** Em sẽ cần hai bước. Bước một là remove node khỏi vị trí hiện tại bằng cách connect node trước với node sau. Bước hai là insert node đó vào đầu list. Để tiện, em sẽ dùng dummy head và dummy tail để không phải handle các edge case khi list rỗng hoặc chỉ có một phần tử.

**Sarah:** Interesting. Tiếp tục với put đi.

**Tuấn:** Dạ với put, em chia làm hai case. Case một là key đã tồn tại trong cache, lúc này em chỉ cần update value của node đó và move nó lên đầu list giống như get. Case hai là key chưa tồn tại, em cần tạo node mới, thêm vào Hash Map, và insert vào đầu linked list. Nhưng trước khi insert, em cần check xem cache đã đầy chưa. Nếu đầy rồi thì em phải evict node ở cuối list, xóa nó khỏi Hash Map, rồi mới thêm node mới vào.

**Sarah:** Em nói đến dummy head và dummy tail, em giải thích kỹ hơn được không? Tại sao cần dùng chúng?

**Tuấn:** Dạ được ạ. Dummy nodes là các sentinel nodes không chứa data thực, chúng đóng vai trò như boundary markers. Dummy head sẽ luôn trỏ đến node đầu tiên có data thực, và dummy tail sẽ luôn được trỏ bởi node cuối cùng có data thực. Lý do em dùng chúng là để simplify code. Không có dummy nodes, mỗi khi em add hoặc remove node, em phải check xem list có rỗng không, node đó có phải là head hay tail không, rồi update các pointer tương ứng. Với dummy nodes, em luôn có một structure consistent, việc add và remove chỉ đơn giản là update pointer mà không cần if else gì cả.

**Sarah:** Cho chị một ví dụ cụ thể về vấn đề nếu không dùng dummy nodes?

**Tuấn:** Dạ ví dụ khi em remove một node. Nếu không có dummy nodes, em phải check: node này có phải head không? Nếu đúng thì head phải point đến node sau. Node này có phải tail không? Nếu đúng thì tail phải point đến node trước. Node có previous không? Nếu có thì previous.next bằng node.next. Tương tự cho next. Còn với dummy nodes, em chỉ cần viết: node.prev.next bằng node.next, và node.next.prev bằng node.prev. Hai dòng code, không có condition nào cả, vì em biết chắc node.prev và node.next luôn tồn tại, ít nhất là dummy nodes.

**Sarah:** Rất tốt. Bây giờ em code cho chị xem.

**Tuấn:** Dạ vâng. Em sẽ bắt đầu với việc define class Node trước. Node sẽ có key, value, prev pointer và next pointer. Em cần lưu key trong node vì khi evict, em cần biết key để xóa khỏi Hash Map.

_Tuấn bắt đầu code_

**Tuấn:** Em tạo constructor cho LRUCache, nhận vào capacity. Em initialize một Map để làm cache storage, lưu capacity, rồi tạo dummy head và tail, connect chúng với nhau.

**Sarah:** Em đang dùng JavaScript Map, tại sao không dùng plain object?

**Tuấn:** Dạ có vài lý do. Thứ nhất, Map guarantee O của một cho get và set operations, trong khi plain object cũng gần như vậy nhưng có thể bị ảnh hưởng bởi hidden class trong V8 engine khi có quá nhiều dynamic properties. Thứ hai, Map có property size built-in, em có thể check size trong O của một thay vì phải gọi Object.keys rồi lấy length. Thứ ba, với Map em có thể dùng bất kỳ data type nào làm key, không bị coerce sang string như object.

**Sarah:** V8 hidden class em nói là gì?

**Tuấn:** À đây là internal optimization của V8 engine. Khi em tạo object, V8 tạo một hidden class để track shape của object đó, tức là có những properties nào. Khi em add thêm property, V8 tạo hidden class mới. Nếu em liên tục add và delete properties một cách dynamic, V8 sẽ phải tạo rất nhiều hidden classes, và object có thể bị chuyển sang dictionary mode, lúc đó lookup sẽ chậm hơn. Với Map thì được design từ đầu cho dynamic key-value storage nên không có vấn đề này.

**Sarah:** Impressive. Tiếp tục code đi em.

**Tuấn:** Dạ vâng. Bây giờ em viết helper method để add node vào đầu list. Em sẽ connect node với head.next, tức là node đầu tiên có data thực, rồi update các pointer.

_Tuấn tiếp tục code_

**Tuấn:** Tiếp theo là method remove node khỏi list. Như em nói, chỉ cần update pointer của adjacent nodes.

**Sarah:** Okay, còn get và put?

**Tuấn:** Dạ với get, em check map có key không. Nếu có thì lấy node, move lên đầu bằng cách remove rồi add lại, return value. Nếu không có return negative one.

_Tuấn code get method_

**Tuấn:** Với put, em check key tồn tại chưa. Nếu có rồi thì update value, move to head. Nếu chưa có thì tạo node mới, add vào map và linked list. Nhưng trước đó check size, nếu đạt capacity thì evict node cuối.

**Sarah:** Node cuối em lấy như thế nào?

**Tuấn:** Dạ node cuối là tail.prev, vì tail là dummy node. Em lấy key từ node đó để delete khỏi map, rồi remove node khỏi list.

_Tuấn hoàn thành code_

**Sarah:** Okay em đã xong. Bây giờ chị hỏi em một số câu follow-up. Nếu chị muốn thêm feature expire time cho mỗi entry, tức là entry sẽ tự động invalid sau một khoảng thời gian, em sẽ modify design như thế nào?

**Tuấn:** Ồ câu hỏi hay ạ. Em nghĩ có vài approach. Approach đầu tiên là lazy expiration, em thêm field expireAt vào mỗi node, và trong method get, trước khi return value, em check xem node đã expire chưa. Nếu expire rồi thì delete nó và return negative one. Approach này đơn giản nhưng có nhược điểm là expired entries vẫn chiếm memory cho đến khi được access.

**Sarah:** Nhược điểm đó có thể gây vấn đề gì?

**Tuấn:** Dạ nếu có nhiều entries được put vào nhưng không bao giờ được get lại, chúng sẽ chiếm memory mãi mà không bị clean up. Trong worst case, cache có thể bị đầy bởi toàn expired entries trong khi capacity thực tế available là zero.

**Sarah:** Vậy approach khác thì sao?

**Tuấn:** Approach thứ hai là active expiration. Em có thể dùng một min-heap hoặc priority queue để track expiration times, và periodically check heap để remove expired entries. Cái này tốt hơn về memory nhưng phức tạp hơn về implementation và có overhead của việc maintain heap.

**Sarah:** Periodically check nghĩa là dùng setInterval?

**Tuấn:** Có thể dùng setInterval, nhưng trong môi trường production em sẽ cẩn thận hơn. setInterval có thể bị drift và không chính xác lắm. Em có thể dùng setTimeout và reschedule sau mỗi lần check, hoặc tích hợp với event loop một cách thông minh hơn. Trong Node.js có thể dùng setImmediate hoặc process.nextTick tùy theo requirement.

**Sarah:** Nếu cache này cần thread-safe thì sao? Giả sử em đang ở môi trường có multiple threads như Web Workers.

**Tuấn:** Đây là một vấn đề phức tạp hơn ạ. JavaScript main thread là single-threaded nên bình thường không cần lo về synchronization. Nhưng với Web Workers thì mỗi worker có memory space riêng, không share được object trực tiếp. Em có vài options.

**Sarah:** Kể ra đi.

**Tuấn:** Option một là dùng SharedArrayBuffer để share memory giữa main thread và workers. Nhưng cái này phức tạp vì em phải serialize data structure thành binary format, và dùng Atomics để synchronize access. Option hai là dùng một dedicated worker làm cache owner, các workers khác communicate qua postMessage. Option này đơn giản hơn về implementation nhưng có latency của message passing. Option ba là mỗi worker có local cache riêng và có một sync mechanism để keep chúng eventually consistent.

**Sarah:** Thú vị. Okay, chị nghĩ bài này em làm tốt rồi. Chuyển sang bài tiếp theo nhé.

---

## Bài 2: JavaScript Advanced - Promise.all với Concurrency Limit

**Sarah:** Bài tiếp theo liên quan đến Promises. Em implement cho chị một function tương tự Promise.all nhưng có thêm concurrency limit. Tức là thay vì run tất cả promises cùng lúc, em chỉ được run tối đa N promises đồng thời.

**Tuấn:** Dạ em hiểu rồi. Ví dụ như em có 10 promises và limit là 3, thì tại bất kỳ thời điểm nào cũng chỉ có tối đa 3 promises đang pending.

**Sarah:** Đúng vậy. Và function phải return một promise resolve với array kết quả theo đúng thứ tự input, giống như Promise.all. Nếu bất kỳ promise nào reject thì cả function reject.

**Tuấn:** Dạ được ạ. Để em suy nghĩ một chút... Em sẽ cần một queue để hold các tasks chưa được execute, một counter để track số promises đang running, và một array để store results theo đúng index.

**Sarah:** Tại sao em cần lưu index?

**Tuấn:** Vì promises complete theo thứ tự không xác định, nhưng em cần return results theo thứ tự input. Nên mỗi khi em start một promise, em cần nhớ index của nó, và khi nó resolve, em put result vào đúng vị trí trong result array.

**Sarah:** Make sense. Tiếp đi.

**Tuấn:** Em sẽ wrap everything trong một Promise constructor. Bên trong, em maintain một index pointer để track task tiếp theo cần execute, một running counter, và một completed counter. Khi một promise complete, em giảm running counter, tăng completed counter, store result, rồi check xem còn task nào trong queue không. Nếu còn và running chưa đạt limit thì start task tiếp theo.

**Sarah:** Nếu một task reject thì em handle như thế nào?

**Tuấn:** Khi bất kỳ task nào reject, em sẽ reject cả outer promise ngay lập tức với error đó. Nhưng em cần cẩn thận một điều là các tasks đang running khác vẫn tiếp tục chạy vì không có cách cancel Promise trong JavaScript. Em chỉ đơn giản là không process results của chúng nữa sau khi đã reject.

**Sarah:** Vậy có memory leak không? Các promises đó vẫn hold references?

**Tuấn:** Đúng là có potential issue. Nếu em muốn handle clean hơn, em có thể dùng AbortController để signal cancellation cho các async operations nếu chúng support. Hoặc đơn giản hơn là set một flag isRejected, và trong callback của mỗi promise, check flag đó trước khi làm bất cứ gì.

**Sarah:** Okay, code đi em.

_Tuấn bắt đầu code_

**Tuấn:** Em define function promiseAllWithLimit nhận vào array of functions trả về promises và limit number. Em không nhận array of promises trực tiếp vì một khi promise được tạo ra thì nó đã start executing rồi, em không control được.

**Sarah:** Giải thích rõ hơn điểm đó?

**Tuấn:** Dạ trong JavaScript, Promise là eager evaluation, tức là ngay khi em gọi new Promise hoặc gọi một async function, code bên trong bắt đầu chạy ngay. Nên nếu caller pass vào array of promises đã được tạo sẵn, tất cả chúng đã đang chạy rồi, em không có cách nào limit được. Vì vậy em yêu cầu caller pass vào array of functions, mỗi function khi được gọi sẽ tạo và return một promise. Em control việc gọi những functions này.

**Sarah:** Tốt, đó là một point quan trọng. Tiếp tục.

_Tuấn tiếp tục code_

**Tuấn:** Em khởi tạo results array với length bằng số tasks, running counter bằng zero, completed counter bằng zero, và currentIndex bằng zero. Em cũng có hasRejected flag để track rejection state.

_Tuấn code logic để start initial batch_

**Tuấn:** Ban đầu em start một số tasks bằng limit hoặc số tasks nếu ít hơn limit. Function runNext sẽ lấy task tiếp theo từ queue, execute nó, và handle result.

**Sarah:** Em implement runNext như thế nào?

**Tuấn:** Trong runNext, em check nếu currentIndex đã vượt quá số tasks hoặc đã rejected thì return. Còn không thì em lấy index hiện tại, tăng currentIndex, tăng running counter, rồi gọi task function để get promise. Promise resolve thì em store result vào đúng index, giảm running, tăng completed. Nếu completed bằng total thì resolve outer promise với results array. Nếu chưa xong và còn tasks thì gọi runNext tiếp.

**Sarah:** Còn rejection case?

**Tuấn:** Nếu promise reject, em check hasRejected flag. Nếu chưa reject trước đó thì set flag và reject outer promise với error. Nếu đã reject rồi thì ignore.

_Tuấn hoàn thành code_

**Sarah:** Câu hỏi follow-up: nếu chị muốn thêm feature retry, mỗi task được retry tối đa N lần khi fail, em modify như thế nào?

**Tuấn:** Em sẽ wrap mỗi task function trong một retry wrapper. Wrapper này sẽ try execute task, nếu fail thì wait một khoảng delay rồi retry. Em có thể implement exponential backoff để delay tăng dần giữa các retries.

**Sarah:** Exponential backoff em implement như thế nào?

**Tuấn:** Delay cho lần retry thứ n sẽ là baseDelay nhân với 2 mũ n, có thể thêm một random jitter để tránh thundering herd problem khi nhiều requests cùng retry đồng thời. Em sẽ có maxDelay để cap lại không cho delay quá lớn.

**Sarah:** Thundering herd là gì?

**Tuấn:** Đó là khi nhiều clients cùng retry cùng một lúc, ví dụ sau một server outage. Nếu tất cả retry với cùng một delay pattern, chúng sẽ hit server đồng thời, có thể cause server overload again. Random jitter làm cho retry times spread out, giảm load peak.

**Sarah:** Nếu chị muốn có thể cancel toàn bộ operation đang chạy thì sao?

**Tuấn:** Em sẽ integrate với AbortController API. Function nhận thêm một optional AbortSignal, và em pass signal này xuống các underlying async operations nếu chúng support, như fetch. Em cũng check signal.aborted trước mỗi lần start task mới và trong các callbacks.

**Sarah:** Tốt lắm. Bài cuối cho phần coding nhé.

---

## Bài 3: UI Coding - Virtualized List Component

**Sarah:** Bài này em implement một Virtualized List component. Giả sử em có một list với hàng triệu items, render tất cả sẽ kill performance. Em chỉ render những items visible trong viewport.

**Tuấn:** Dạ em hiểu. Đây là technique windowing hoặc virtualization, chỉ render một subset của data visible với user, khi user scroll thì render items mới và unmount items không còn visible.

**Sarah:** Đúng vậy. Assumptions là mỗi item có fixed height, em biết trước total number of items và height của mỗi item.

**Tuấn:** Dạ, fixed height làm cho calculation đơn giản hơn nhiều. Nếu dynamic height thì phức tạp hơn, em sẽ cần measure và cache heights.

**Sarah:** Đúng, để đơn giản mình assume fixed height. Em approach như thế nào?

**Tuấn:** Em sẽ cần một container với fixed height, có overflow scroll. Bên trong là một spacer element với height bằng total items nhân với item height, để tạo đúng scrollbar length. Rồi em có một inner container absolute positioned, chứa chỉ những items visible. Em cần track scroll position, tính toán start index và end index của visible items, render chỉ những items đó.

**Sarah:** Spacer element có cần thiết không? Có cách nào khác không?

**Tuấn:** Spacer element giúp tạo ra native scrollbar behavior chính xác. Nếu không có nó, em phải manually handle scrollbar, phức tạp và không smooth bằng native. Cách khác là dùng padding-top và padding-bottom trên inner container thay vì spacer riêng. Padding-top bằng startIndex nhân itemHeight, padding-bottom bằng remaining items nhân itemHeight. Approach này cũng work.

**Sarah:** Em chọn approach nào?

**Tuấn:** Em thích approach dùng transform translateY hơn. Em có một inner container với transform translateY bằng startIndex nhân itemHeight. Advantage là transform không trigger layout, chỉ trigger paint và composite, performance tốt hơn padding approach vì padding thay đổi sẽ trigger layout.

**Sarah:** Giải thích thêm về layout, paint, composite?

**Tuấn:** Đây là các phases trong browser rendering pipeline. Layout là phase browser tính toán kích thước và vị trí của elements. Paint là phase convert layout thành pixels. Composite là phase combine các layers thành final image. Thay đổi properties như width, height, padding trigger layout lại từ đầu, expensive. Thay đổi background color chỉ trigger paint. Thay đổi transform hoặc opacity chỉ trigger composite, cheapest. Nên dùng transform cho animations và position changes performance critical.

**Sarah:** Tốt. Bây giờ nói về calculation. Làm sao em biết render items nào?

**Tuấn:** Từ scroll position và container height, em tính được visible range. Start index là floor của scrollTop chia itemHeight. End index là ceil của scrollTop cộng containerHeight chia itemHeight. Em cũng add một overscan, tức render thêm vài items trên và dưới visible range, để khi scroll nhanh user không thấy blank space.

**Sarah:** Overscan bao nhiêu là hợp lý?

**Tuấn:** Depend on use case. Typically em dùng 3 đến 5 items. Nhiều hơn thì smoother nhưng render nhiều hơn. Nếu items phức tạp, render expensive thì overscan nhỏ. Nếu items đơn giản thì overscan lớn hơn okay.

**Sarah:** Scroll event fire rất nhiều, em handle như thế nào để không re-render quá nhiều?

**Tuấn:** Có vài techniques. Một là throttle scroll handler, chỉ process mỗi N milliseconds. Hai là requestAnimationFrame, queue scroll handling vào next frame, naturally throttle at display refresh rate. Ba là chỉ re-render khi start index hoặc end index thực sự thay đổi, so sánh với previous values.

**Sarah:** Em implement cái nào?

**Tuấn:** Em sẽ combine requestAnimationFrame với check index change. Trong scroll handler em schedule một RAF call, trong RAF callback em tính new indices, so sánh với previous, chỉ setState nếu khác.

**Sarah:** Code đi em. Dùng React nhé.

_Tuấn bắt đầu code_

**Tuấn:** Em tạo component VirtualizedList nhận props: items array, itemHeight number, containerHeight number, và renderItem function. Em dùng useState cho scrollTop, và useMemo để tính visibleItems từ scrollTop.

_Tuấn code component structure_

**Sarah:** Em dùng useMemo, giải thích rationale?

**Tuấn:** useMemo memoize kết quả calculation, chỉ recalculate khi dependencies change. Ở đây dependencies là scrollTop, items, itemHeight, containerHeight. Nếu không có useMemo, mỗi re-render sẽ recalculate visible items dù scrollTop không đổi, wasteful.

**Sarah:** Có case nào useMemo không nên dùng không?

**Tuấn:** Có ạ. Nếu calculation rất simple và cheap, overhead của useMemo có khi còn cao hơn calculation itself. useMemo cần so sánh dependencies mỗi render. Nếu dependencies là objects hay arrays, comparison có thể không work as expected nếu reference thay đổi dù value giống. Nên dùng useMemo cho expensive calculations, không phải mọi thứ.

_Tuấn tiếp tục code_

**Tuấn:** Trong scroll handler, em check nếu đã có pending RAF thì return, không schedule thêm. Nếu chưa có thì schedule RAF, trong callback em update scrollTop và clear pending flag.

**Sarah:** Nếu items có key không phải là index thì sao?

**Tuấn:** Good point. Em nên dùng stable unique key cho mỗi item thay vì index. Dùng index làm key có vấn đề khi items reorder hoặc items được add/remove ở đầu list. React có thể reuse wrong component instances, cause bugs. Em sẽ expect items có id property và dùng đó làm key.

_Tuấn hoàn thành basic implementation_

**Sarah:** Bây giờ giả sử items có variable height, em sẽ approach khác như thế nào?

**Tuấn:** Đây là significant complexity increase. Em sẽ cần maintain một array hoặc map của measured heights. Initial render có thể estimate heights, sau đó measure actual DOM heights và update. Em cũng cần một cumulative height array để binary search tìm visible range thay vì simple division.

**Sarah:** Measure DOM heights như thế nào trong React?

**Tuấn:** Em dùng refs để access DOM elements. Có thể dùng ResizeObserver để observe size changes. Hoặc đơn giản hơn là measure trong useLayoutEffect sau mỗi render, dùng getBoundingClientRect. useLayoutEffect chạy synchronously after DOM mutations nhưng trước browser paint, nên user không thấy flash of wrong size.

**Sarah:** useLayoutEffect vs useEffect khác nhau chỗ nào?

**Tuấn:** useEffect runs asynchronously after paint, browser có cơ hội paint intermediate state trước khi effect chạy. useLayoutEffect runs synchronously after DOM updates but before paint, block painting cho đến khi hoàn thành. Nên dùng useLayoutEffect khi cần measure DOM hoặc sync DOM mutations để tránh visual flickering. Nhưng cẩn thận vì nó có thể delay first paint nếu effect chạy lâu.

**Sarah:** Nếu list có search/filter, khi filter changes từ 1 triệu items xuống còn 100, có vấn đề gì không?

**Tuấn:** Scroll position có thể invalid. Nếu trước đó user scroll xuống item thứ 500,000, giờ chỉ còn 100 items, scrollTop có thể quá lớn so với new total height. Em cần reset scrollTop hoặc clamp nó về valid range khi items array changes dramatically.

**Sarah:** Em handle như thế nào trong code?

**Tuấn:** Em có thể dùng useEffect watch items length, khi length giảm significantly, reset scrollTop về zero hoặc adjust scrollTop proportionally. Hoặc let browser auto-adjust, vì scrollTop sẽ bị clamp bởi max scroll position automatically, nhưng em vẫn cần trigger re-render.

**Sarah:** Tốt lắm Tuấn. Phần coding đến đây thôi. Em làm rất well, clear thinking và good understanding của underlying mechanics. Mình take a break 15 phút rồi chuyển sang system design nhé.

**Tuấn:** Dạ em cảm ơn chị. Em sẽ nghỉ ngơi một chút ạ.

---

## FINAL CODE - Round 1

### Bài 1: LRU Cache

```javascript
/**
 * LRU Cache Implementation
 *
 * Data Structure: Hash Map + Doubly Linked List
 * - Hash Map: O(1) key lookup
 * - Doubly Linked List: O(1) insertion/deletion, maintains access order
 *
 * Time Complexity: O(1) for both get and put
 * Space Complexity: O(capacity) for storing cache entries
 */

// Node class cho Doubly Linked List
// Mỗi node lưu key-value pair và pointers đến adjacent nodes
// Lưu key trong node để khi evict có thể xóa khỏi HashMap
class ListNode {
  constructor(key, value) {
    this.key = key; // Cần để xóa khỏi map khi evict
    this.value = value;
    this.prev = null; // Pointer đến node trước
    this.next = null; // Pointer đến node sau
  }
}

class LRUCache {
  constructor(capacity) {
    // Validate capacity
    if (capacity <= 0) {
      throw new Error("Capacity must be positive");
    }

    this.capacity = capacity;

    // Dùng Map thay vì plain object vì:
    // 1. Guaranteed O(1) operations
    // 2. Built-in size property
    // 3. Keys không bị coerce sang string
    // 4. Better performance với dynamic add/delete
    this.cache = new Map();

    // Dummy head và tail nodes
    // Lý do dùng dummy nodes:
    // - Simplify add/remove logic, không cần check edge cases
    // - Head.next luôn là most recently used
    // - Tail.prev luôn là least recently used
    this.head = new ListNode(null, null);
    this.tail = new ListNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Add node ngay sau head (most recently used position)
   * Vì dùng dummy head nên không cần check list empty
   */
  _addToHead(node) {
    // Connect node với head và head.next
    node.prev = this.head;
    node.next = this.head.next;

    // Update adjacent nodes' pointers
    this.head.next.prev = node;
    this.head.next = node;
  }

  /**
   * Remove node khỏi current position
   * Vì dùng dummy nodes nên không cần check if head/tail
   * Time: O(1) - chỉ update 2 pointers
   */
  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * Move node lên đầu (mark as recently used)
   * Combine remove và add operations
   */
  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  /**
   * Remove và return node cuối (least recently used)
   * Node cuối là tail.prev (vì tail là dummy)
   */
  _removeTail() {
    const node = this.tail.prev;
    this._removeNode(node);
    return node;
  }

  /**
   * Get value by key
   * Time: O(1)
   *
   * @param {*} key - Key to lookup
   * @returns {*} Value nếu key tồn tại, -1 nếu không
   */
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    // Key exists - get node và move to head (recently used)
    const node = this.cache.get(key);
    this._moveToHead(node);

    return node.value;
  }

  /**
   * Put key-value pair vào cache
   * Time: O(1)
   *
   * Cases:
   * 1. Key exists: update value, move to head
   * 2. Key new + space available: create node, add to head
   * 3. Key new + full: evict LRU, then add new
   *
   * @param {*} key - Key
   * @param {*} value - Value
   */
  put(key, value) {
    if (this.cache.has(key)) {
      // Case 1: Key exists - update và move to head
      const node = this.cache.get(key);
      node.value = value;
      this._moveToHead(node);
    } else {
      // Case 2 & 3: New key

      // Check capacity và evict nếu cần
      if (this.cache.size >= this.capacity) {
        // Remove LRU (tail.prev) khỏi cả list và map
        const lruNode = this._removeTail();
        this.cache.delete(lruNode.key);
      }

      // Create new node và add
      const newNode = new ListNode(key, value);
      this.cache.set(key, newNode);
      this._addToHead(newNode);
    }
  }

  /**
   * Optional: Debug method để visualize cache state
   */
  debug() {
    const items = [];
    let current = this.head.next;
    while (current !== this.tail) {
      items.push(`${current.key}:${current.value}`);
      current = current.next;
    }
    return `[${items.join(" -> ")}] (MRU -> LRU)`;
  }
}

// Example usage và verification:
const cache = new LRUCache(3);
cache.put("a", 1); // Cache: [a:1]
cache.put("b", 2); // Cache: [b:2 -> a:1]
cache.put("c", 3); // Cache: [c:3 -> b:2 -> a:1]
console.log(cache.get("a")); // Returns 1, Cache: [a:1 -> c:3 -> b:2]
cache.put("d", 4); // Evicts 'b', Cache: [d:4 -> a:1 -> c:3]
console.log(cache.get("b")); // Returns -1 (evicted)

/**
 * Edge Cases Handled:
 * 1. Get non-existent key -> returns -1
 * 2. Put existing key -> updates value
 * 3. Full cache -> evicts LRU before adding new
 * 4. Capacity of 1 -> works correctly
 *
 * Potential Extensions:
 * 1. TTL support: Add expireAt field, check on get
 * 2. Size-based eviction: Track total size, not just count
 * 3. Persistence: Serialize to localStorage/IndexedDB
 * 4. Events: onEvict callback for cleanup
 */
```

### Bài 2: Promise.all with Concurrency Limit

```javascript
/**
 * Promise.all với Concurrency Limit
 *
 * Giống Promise.all nhưng giới hạn số promises chạy đồng thời
 *
 * Key Insight: Nhận array of FUNCTIONS (không phải promises)
 * vì Promise là eager - tạo ra là chạy ngay, không control được
 *
 * Time Complexity: O(n) where n = number of tasks
 * Space Complexity: O(n) for results array
 *
 * @param {Function[]} taskFunctions - Array of functions that return promises
 * @param {number} limit - Max concurrent executions
 * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
 * @returns {Promise<any[]>} Results array in original order
 */
function promiseAllWithLimit(taskFunctions, limit, signal = null) {
  return new Promise((resolve, reject) => {
    // Edge cases
    if (!Array.isArray(taskFunctions)) {
      reject(new TypeError("First argument must be an array"));
      return;
    }

    if (taskFunctions.length === 0) {
      resolve([]);
      return;
    }

    if (limit <= 0) {
      reject(new Error("Limit must be positive"));
      return;
    }

    // Results array - pre-allocate với đúng length
    // Results sẽ được fill theo index, không theo completion order
    const results = new Array(taskFunctions.length);

    // State tracking
    let currentIndex = 0; // Next task index to start
    let runningCount = 0; // Currently running tasks
    let completedCount = 0; // Successfully completed tasks
    let hasRejected = false; // Flag to prevent multiple rejections

    /**
     * Start next available task
     * Called initially and after each task completion
     */
    function runNext() {
      // Check abort signal
      if (signal?.aborted) {
        if (!hasRejected) {
          hasRejected = true;
          reject(new DOMException("Aborted", "AbortError"));
        }
        return;
      }

      // Check if all tasks started or already rejected
      if (currentIndex >= taskFunctions.length || hasRejected) {
        return;
      }

      // Capture current index for closure
      // Quan trọng: phải capture trước khi increment
      const taskIndex = currentIndex;
      currentIndex++;
      runningCount++;

      // Get task function và execute
      const taskFn = taskFunctions[taskIndex];

      // Wrap trong try-catch để handle non-promise returns
      // và sync errors trong task function
      let taskPromise;
      try {
        taskPromise = taskFn();
        // Ensure nó là promise
        if (!(taskPromise instanceof Promise)) {
          taskPromise = Promise.resolve(taskPromise);
        }
      } catch (syncError) {
        // Task function threw synchronously
        taskPromise = Promise.reject(syncError);
      }

      taskPromise
        .then((result) => {
          // Check if already rejected
          if (hasRejected) return;

          // Store result at correct index
          // Đây là key để maintain order
          results[taskIndex] = result;
          runningCount--;
          completedCount++;

          // Check if all done
          if (completedCount === taskFunctions.length) {
            resolve(results);
          } else {
            // Start next task if available
            runNext();
          }
        })
        .catch((error) => {
          // Only reject once
          if (hasRejected) return;

          hasRejected = true;
          reject(error);

          // Note: Other running tasks continue but results ignored
          // Không có cách native để cancel đang-chạy promises
        });
    }

    // Start initial batch
    // Số lượng = min(limit, total tasks)
    const initialBatch = Math.min(limit, taskFunctions.length);
    for (let i = 0; i < initialBatch; i++) {
      runNext();
    }
  });
}

/**
 * Enhanced version với retry support
 *
 * @param {Function[]} taskFunctions
 * @param {number} limit
 * @param {Object} options
 * @param {number} options.retries - Max retry attempts per task
 * @param {number} options.retryDelay - Base delay in ms
 * @param {boolean} options.exponentialBackoff - Use exponential backoff
 * @param {AbortSignal} options.signal - Abort signal
 */
function promiseAllWithLimitAndRetry(taskFunctions, limit, options = {}) {
  const {
    retries = 0,
    retryDelay = 1000,
    exponentialBackoff = false,
    maxDelay = 30000,
    signal = null,
  } = options;

  // Wrap each task function với retry logic
  const wrappedTasks = taskFunctions.map((taskFn) => {
    return async () => {
      let lastError;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await taskFn();
        } catch (error) {
          lastError = error;

          // Don't delay after last attempt
          if (attempt < retries) {
            // Calculate delay
            let delay = retryDelay;
            if (exponentialBackoff) {
              delay = Math.min(retryDelay * Math.pow(2, attempt), maxDelay);
              // Add jitter (0-25% random addition)
              // Prevents thundering herd
              delay += delay * Math.random() * 0.25;
            }

            // Wait before retry
            await new Promise((res) => setTimeout(res, delay));
          }
        }
      }

      // All retries failed
      throw lastError;
    };
  });

  return promiseAllWithLimit(wrappedTasks, limit, signal);
}

// Example usage:
async function example() {
  // Simulate API calls với different delays
  const createTask = (id, delay, shouldFail = false) => {
    return () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldFail) {
            reject(new Error(`Task ${id} failed`));
          } else {
            console.log(`Task ${id} completed`);
            resolve(`Result ${id}`);
          }
        }, delay);
      });
  };

  const tasks = [
    createTask(1, 100),
    createTask(2, 200),
    createTask(3, 150),
    createTask(4, 300),
    createTask(5, 50),
  ];

  console.log("Starting with limit=2...");
  const results = await promiseAllWithLimit(tasks, 2);
  console.log("Results:", results);
  // Output: ["Result 1", "Result 2", "Result 3", "Result 4", "Result 5"]
  // Execution order varies but results maintain input order
}

/**
 * Edge Cases:
 * 1. Empty array -> resolves with []
 * 2. Limit > array length -> all start immediately
 * 3. Task throws sync -> handled as rejection
 * 4. Task returns non-promise -> wrapped in Promise.resolve
 * 5. Multiple failures -> first failure rejects, others ignored
 *
 * Production Considerations:
 * 1. Add timeout per task using Promise.race
 * 2. Add progress callback for UI updates
 * 3. Add partial results option (resolve with completed even if some fail)
 * 4. Memory: Clear references after completion to allow GC
 */
```

### Bài 3: Virtualized List Component

```javascript
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  memo,
} from "react";

/**
 * VirtualizedList - Renders only visible items for performance
 *
 * Technique: Windowing/Virtualization
 * - Container có fixed height và overflow scroll
 * - Chỉ render items trong viewport + overscan buffer
 * - Dùng transform thay vì padding để position items (GPU accelerated)
 *
 * Performance Optimizations:
 * 1. useMemo cho visible items calculation
 * 2. requestAnimationFrame để throttle scroll handling
 * 3. memo cho item components
 * 4. Stable keys cho React reconciliation
 *
 * @param {Object} props
 * @param {any[]} props.items - Full data array
 * @param {number} props.itemHeight - Height of each item in px
 * @param {number} props.containerHeight - Viewport height in px
 * @param {Function} props.renderItem - (item, index) => ReactNode
 * @param {number} [props.overscan=3] - Extra items to render above/below
 */
const VirtualizedList = memo(function VirtualizedList({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = "",
}) {
  // Scroll position state
  const [scrollTop, setScrollTop] = useState(0);

  // Ref để track pending RAF
  const rafIdRef = useRef(null);

  // Container ref cho scroll handling
  const containerRef = useRef(null);

  // Calculate total height for proper scrollbar
  // Đây là "virtual" height - container thực sự nhỏ hơn nhiều
  const totalHeight = items.length * itemHeight;

  /**
   * Calculate visible items với overscan buffer
   * useMemo vì calculation có thể expensive với large arrays
   *
   * Dependencies:
   * - scrollTop: position changes on scroll
   * - items: data array
   * - itemHeight, containerHeight: dimension props
   * - overscan: buffer config
   */
  const { visibleItems, startIndex, offsetY } = useMemo(() => {
    // Tính index của item đầu tiên visible (có thể partially visible)
    const rawStartIndex = Math.floor(scrollTop / itemHeight);

    // Apply overscan buffer phía trên
    // Math.max để không xuống dưới 0
    const startIdx = Math.max(0, rawStartIndex - overscan);

    // Số items visible trong viewport
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    // End index với overscan phía dưới
    // Math.min để không vượt quá array length
    const endIdx = Math.min(
      items.length - 1,
      rawStartIndex + visibleCount + overscan
    );

    // Slice visible portion của array
    const visible = [];
    for (let i = startIdx; i <= endIdx; i++) {
      visible.push({
        item: items[i],
        index: i,
        // Mỗi item cần key - prefer item.id nếu có
        key: items[i]?.id ?? i,
      });
    }

    // Calculate offset để position visible items correctly
    // Dùng transform translateY cho GPU acceleration
    const offset = startIdx * itemHeight;

    return {
      visibleItems: visible,
      startIndex: startIdx,
      offsetY: offset,
    };
  }, [scrollTop, items, itemHeight, containerHeight, overscan]);

  /**
   * Scroll handler với RAF throttling
   *
   * RAF throttling:
   * - Scroll event có thể fire 60+ times/second
   * - RAF limits updates to display refresh rate (typically 60fps)
   * - Prevents unnecessary re-renders
   */
  const handleScroll = useCallback((event) => {
    // Nếu đã có pending RAF, skip
    // Prevents queueing multiple updates
    if (rafIdRef.current !== null) {
      return;
    }

    // Capture scroll position synchronously
    // (event target có thể thay đổi trước RAF callback)
    const newScrollTop = event.target.scrollTop;

    // Schedule state update trong next animation frame
    rafIdRef.current = requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
      rafIdRef.current = null;
    });
  }, []);

  /**
   * Reset scroll khi items array changes dramatically
   * Prevents invalid scroll position khi filter/search
   */
  useLayoutEffect(() => {
    // Nếu current scrollTop > max valid scrollTop
    const maxScrollTop = Math.max(0, totalHeight - containerHeight);
    if (scrollTop > maxScrollTop) {
      setScrollTop(maxScrollTop);
      if (containerRef.current) {
        containerRef.current.scrollTop = maxScrollTop;
      }
    }
  }, [items.length, totalHeight, containerHeight, scrollTop]);

  /**
   * Cleanup RAF on unmount
   * Memory leak prevention
   */
  useLayoutEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    // Outer container - has fixed height, handles scroll
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      {/* Spacer - creates correct scrollbar length */}
      {/* Height = total virtual height */}
      {/* Không có content, chỉ để tạo scroll area */}
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        {/* Inner container - holds visible items */}
        {/* Positioned with transform for GPU acceleration */}
        {/* transform không trigger layout, chỉ composite */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
            // will-change hints browser về incoming transforms
            // Có thể improve animation smoothness
            willChange: "transform",
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div
              key={key}
              style={{
                height: itemHeight,
                // Box-sizing ensures height includes padding/border
                boxSizing: "border-box",
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Example Item Component - memoized để prevent unnecessary re-renders
 * React.memo shallow compares props
 */
const ListItem = memo(function ListItem({ data, style }) {
  return (
    <div style={{ ...style, padding: "10px", borderBottom: "1px solid #eee" }}>
      <strong>{data.title}</strong>
      <p>{data.description}</p>
    </div>
  );
});

// Example usage:
function App() {
  // Generate large dataset
  const items = useMemo(() => {
    return Array.from({ length: 100000 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    }));
  }, []);

  const renderItem = useCallback((item, index) => {
    return <ListItem data={item} />;
  }, []);

  return (
    <VirtualizedList
      items={items}
      itemHeight={80}
      containerHeight={600}
      renderItem={renderItem}
      overscan={5}
    />
  );
}

/**
 * Edge Cases Handled:
 * 1. Empty items array -> renders empty scrollable container
 * 2. Items fewer than viewport -> no virtualization needed but works
 * 3. Rapid scrolling -> RAF prevents jank
 * 4. Items array changes -> scroll position adjusted
 * 5. Container resize -> handled via containerHeight prop
 *
 * Known Limitations (Fixed Height Version):
 * 1. All items must have same height
 * 2. No support for sticky headers
 * 3. No horizontal virtualization
 *
 * For Variable Height, Would Need:
 * 1. Height estimation or measurement
 * 2. Height cache (Map<index, measuredHeight>)
 * 3. Cumulative height array for binary search
 * 4. ResizeObserver for dynamic height changes
 * 5. More complex scroll position calculation
 */

export default VirtualizedList;
```

---

# ROUND 2: FRONTEND SYSTEM DESIGN (2 tiếng)

## Interviewer: Michael Park - Principal Engineer, Google Docs Team

---

**10:45 AM - Sau break**

**Michael:** Chào Tuấn, tôi là Michael, Principal Engineer trong team Google Docs. Round này mình sẽ focus vào system design. Em đã dùng Google Docs bao giờ chưa?

**Tuấn:** Dạ chào anh Michael. Em dùng Google Docs khá thường xuyên ạ, cả cho công việc và personal projects.

**Michael:** Tốt. Vậy hôm nay em sẽ design một collaborative document editor tương tự Google Docs. Mình sẽ không đi vào backend chi tiết mà focus vào frontend architecture. Em có 90 phút, mình sẽ discuss qua lại trong suốt quá trình. Ready?

**Tuấn:** Dạ em sẵn sàng.

**Michael:** Okay, trước khi design em cần clarify requirements. Em sẽ hỏi gì?

**Tuấn:** Dạ em có vài câu hỏi. Thứ nhất về scale, có bao nhiêu concurrent users trên một document? Thứ hai về features, mình cần support những gì, rich text formatting, images, tables, comments? Thứ ba về latency requirements, real-time sync cần nhanh cỡ nào? Thứ tư về offline support, users có thể edit khi offline không?

**Michael:** Good questions. Mình assume document có thể có tối đa 100 concurrent editors, thousands của viewers. Features cần có basic rich text, images, comments, và presence indicators showing who's currently editing. Latency mình target dưới 100ms cho typing experience, sync với other users trong vài giây acceptable. Offline support là nice-to-have, mình sẽ discuss nếu có time.

**Tuấn:** Dạ em hiểu rồi. Vậy em bắt đầu với high-level architecture nhé.

**Michael:** Đi thôi.

---

## High-Level Architecture

**Tuấn:** Dạ, để anh hình dung rõ hơn, em sẽ vẽ sơ đồ kiến trúc tổng quan:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│  │   React App     │     │  Collaboration  │     │    Local Storage    │   │
│  │   (UI Layer)    │◄───►│     Engine      │◄───►│   (Offline Cache)   │   │
│  └────────┬────────┘     └────────┬────────┘     └─────────────────────┘   │
│           │                       │                                         │
│           ▼                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Document State Manager                            │   │
│  │              (CRDT/OT Document Model + Undo Stack)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                       │                                         │
│           ▼                       ▼                                         │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │  Editor Engine  │     │   Selection &   │                               │
│  │  (ContentEditable│     │   Cursor Mgmt   │                               │
│  │   or Custom)    │     │                 │                               │
│  └─────────────────┘     └─────────────────┘                               │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    │ WebSocket (Bi-directional)
                                    │ + HTTP/2 (Document Load, Assets)
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                             API GATEWAY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │   Auth   │  │ Rate Limiter  │  │    Router    │  │  Load Balancer │     │
│  │ Service  │  │  (Per User)   │  │ (Sticky Sess)│  │                │     │
│  └──────────┘  └───────────────┘  └──────────────┘  └────────────────┘     │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   Collaboration │     │   Document Service  │     │  Presence       │
│     Server      │     │   (CRUD, History)   │     │  Service        │
│   (OT/CRDT)     │     │                     │     │  (Who's online) │
└────────┬────────┘     └──────────┬──────────┘     └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │       Data Layer         │
                    ├──────────────────────────┤
                    │  ┌────────┐ ┌──────────┐ │
                    │  │Primary │ │  Redis   │ │
                    │  │   DB   │ │ (Cache,  │ │
                    │  │(Source │ │ Pub/Sub) │ │
                    │  │of Truth│ │          │ │
                    │  └────────┘ └──────────┘ │
                    └──────────────────────────┘
```

**Tuấn:** Như anh thấy, em chia client thành nhiều layers. Ở trên cùng là React App cho UI rendering. Bên cạnh đó là Collaboration Engine để handle syncing với other users. Local Storage để cache document cho offline access. Document State Manager ở giữa là trung tâm, hold document model và manage state transformations. Editor Engine handle actual text editing, có thể dùng ContentEditable hoặc custom renderer. Selection và Cursor Management track user's cursor và other users' cursors.

**Michael:** Tại sao em tách Collaboration Engine ra riêng thay vì để trong React App?

**Tuấn:** Dạ vì separation of concerns và cũng vì performance. Collaboration logic như transform operations, buffer pending changes, handle conflict resolution khá phức tạp và không liên quan đến UI rendering. Nếu để trong React component, mỗi operation có thể trigger unnecessary re-renders. Tách ra thì Collaboration Engine có thể process operations independently, chỉ update React state khi cần thiết. Cũng dễ test hơn khi tách riêng.

**Michael:** Em đề cập đến CRDT slash OT trong Document State Manager. Em hiểu sự khác biệt như thế nào?

**Tuấn:** OT là Operational Transformation, đã được dùng lâu trong collaborative editing, Google Docs dùng approach này. Idea là transform operations dựa trên concurrent operations để maintain consistency. Ví dụ user A insert ở position 5, user B delete ở position 3, khi merge thì insert của A phải được transform thành position 4 vì delete của B đã shift positions.

**Michael:** Còn CRDT?

**Tuấn:** CRDT là Conflict-free Replicated Data Types, newer approach, được dùng bởi Figma. Idea là design data structure sao cho concurrent operations tự động converge mà không cần transformation. Mỗi character hoặc element có unique ID, operations reference ID thay vì position, nên không cần transform. Trade-off là CRDT thường cần nhiều memory hơn để store IDs và có complexity trong garbage collection.

**Michael:** Nếu em design, em chọn cái nào?

**Tuấn:** Cho document editor với text focus, em lean towards CRDT, specifically Yjs library. Lý do là implementation simplicity ở client side, không cần central server để coordinate transforms, tốt cho offline support, và Yjs đã proven at scale. OT requires server-side coordination và complex transform logic.

**Michael:** Interesting. Bây giờ em drill down vào React component architecture đi.

---

## Component Architecture

**Tuấn:** Dạ em vẽ component tree:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              <DocumentApp>                                   │
│                     (Root - handles document loading)                        │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐     ┌─────────────────────────┐     ┌───────────────────┐
│    <Toolbar>      │     │      <EditorArea>       │     │   <SidePanel>     │
│  (Formatting btns)│     │    (Main edit zone)     │     │ (Comments, TOC)   │
└───────────────────┘     └────────────┬────────────┘     └───────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
    │<PresenceLayer>  │    │   <DocumentBody>    │    │<SelectionLayer> │
    │(Cursors overlay)│    │  (Content renderer) │    │(Selection boxes)│
    └─────────────────┘    └──────────┬──────────┘    └─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │<Paragraph>  │   │  <Image>    │   │  <Table>    │
            │(Text block) │   │ (Embedded)  │   │ (Grid data) │
            └──────┬──────┘   └─────────────┘   └──────┬──────┘
                   │                                    │
                   ▼                                    ▼
            ┌─────────────┐                     ┌─────────────┐
            │<TextSpan>   │                     │<TableCell>  │
            │(Formatted)  │                     │             │
            └─────────────┘                     └─────────────┘

LAYER RESPONSIBILITIES:
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Application Shell                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ DocumentApp                                                            │ │
│  │ • Document loading/saving                                              │ │
│  │ • Auth context                                                         │ │
│  │ • Error boundaries                                                     │ │
│  │ • Route handling                                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Layout Components                                                  │
│  ┌──────────────┐  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │   Toolbar    │  │      EditorArea        │  │      SidePanel         │  │
│  │              │  │                        │  │                        │  │
│  │ • Format     │  │ • Scroll container     │  │ • Comments list        │  │
│  │   commands   │  │ • Focus management     │  │ • Table of contents    │  │
│  │ • Undo/Redo  │  │ • Keyboard shortcuts   │  │ • Revision history     │  │
│  └──────────────┘  └────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Overlay Layers (Positioned Absolute)                               │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐  │
│  │   PresenceLayer    │  │   SelectionLayer   │  │   CommentAnchors     │  │
│  │                    │  │                    │  │                      │  │
│  │ • Remote cursors   │  │ • Selection rects  │  │ • Comment markers    │  │
│  │ • User names       │  │ • Drag handles     │  │ • Highlight ranges   │  │
│  │ • Typing indicator │  │                    │  │                      │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Content Nodes (Virtual Tree)                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         DocumentBody                                  │   │
│  │                                                                       │   │
│  │    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │   │
│  │    │Paragraph │    │Paragraph │    │  Image   │    │  Table   │     │   │
│  │    │  (H1)    │    │  (Body)  │    │ (Block)  │    │ (Block)  │     │   │
│  │    └──────────┘    └──────────┘    └──────────┘    └──────────┘     │   │
│  │         │               │                               │           │   │
│  │         ▼               ▼                               ▼           │   │
│  │    ┌──────────┐    ┌──────────┐                   ┌──────────┐     │   │
│  │    │ TextSpan │    │ TextSpan │                   │TableCell │     │   │
│  │    │ (Bold)   │    │ (Normal) │                   │          │     │   │
│  │    └──────────┘    └──────────┘                   └──────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tuấn:** DocumentApp là root component, handle document loading, authentication, và error boundaries. Bên dưới có ba main areas: Toolbar cho formatting controls, EditorArea là main editing zone, và SidePanel cho comments, outline, history.

**Michael:** Tại sao em có PresenceLayer và SelectionLayer tách riêng khỏi DocumentBody?

**Tuấn:** Đây là một optimization quan trọng ạ. Remote cursors và selections update rất frequently khi other users đang type. Nếu em render chúng như part của document content, mỗi cursor movement sẽ trigger re-render của document nodes. Bằng cách tách thành separate layers positioned absolute trên document, cursor updates chỉ re-render PresenceLayer, document content không bị affect.

**Michael:** Vậy làm sao PresenceLayer biết position để render cursor đúng chỗ?

**Tuấn:** Em sẽ cần coordinate system mapping. Document model có positions theo character index hoặc CRDT IDs. Em cần function để convert từ document position sang screen coordinates. Cách làm là query DOM element tại vị trí đó, dùng Range API và getBoundingClientRect để lấy pixel position. Cache kết quả và invalidate khi document scrolls hoặc resizes.

**Michael:** Nếu document rất dài, có performance issues gì không?

**Tuấn:** Có ạ, đây là nơi virtualization có thể cần. Với document vài nghìn paragraphs, render tất cả sẽ costly. Em có thể apply similar technique như virtualized list ở round trước, chỉ render visible content plus buffer. Tuy nhiên document editor phức tạp hơn vì content height không fixed, em cần measure và cache paragraph heights.

**Michael:** Em estimate height chưa measure như thế nào?

**Tuấn:** Có vài approaches. Một là estimate dựa trên character count và average character width. Hai là dùng một estimation factor rồi adjust khi measure thực tế. Ba là render hidden, measure, rồi show. Approach em prefer là render with estimated height trước, user có thể thấy slight jump khi actual heights applied, nhưng better than blocking render.

---

## Data Flow & State Management

**Michael:** Okay, bây giờ nói về data flow. Em manage state như thế nào?

**Tuấn:** Dạ em vẽ data flow diagram:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

    USER INPUT                 REMOTE CHANGES              INITIAL LOAD
        │                           │                           │
        │ (keypress, paste,        │ (WebSocket                │ (HTTP GET)
        │  click, drag)            │  messages)                │
        ▼                          ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          INPUT HANDLERS                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │ Keyboard Handler│  │  Mouse Handler  │  │  WebSocket Handler     │   │
│  │                 │  │                 │  │                        │   │
│  │ • Intercept key │  │ • Selection     │  │ • Parse operations     │   │
│  │ • Map to action │  │ • Click targets │  │ • Validate integrity   │   │
│  │ • Handle IME    │  │ • Drag gestures │  │ • Queue if needed      │   │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬───────────┘   │
│           │                    │                        │                │
│           └────────────────────┴────────────────────────┘                │
│                                │                                          │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        COMMAND DISPATCHER                                  │
│                                                                           │
│  Normalizes all inputs into Operations:                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  { type: 'insert', position: {...}, text: 'hello', attributes: {} } │ │
│  │  { type: 'delete', range: { start: {...}, end: {...} } }            │ │
│  │  { type: 'format', range: {...}, attributes: { bold: true } }       │ │
│  │  { type: 'cursor', userId: 'abc', position: {...} }                 │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                │                                          │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
┌─────────────────────────────┐  ┌─────────────────────────────────────────┐
│     UNDO/REDO MANAGER       │  │         COLLABORATION ENGINE            │
│                             │  │                                         │
│ ┌─────────────────────────┐ │  │  ┌─────────────────────────────────┐   │
│ │     Undo Stack          │ │  │  │        CRDT Document            │   │
│ │  ┌───┬───┬───┬───┬───┐  │ │  │  │     (Yjs Y.Doc instance)        │   │
│ │  │Op1│Op2│Op3│Op4│Op5│  │ │  │  │                                 │   │
│ │  └───┴───┴───┴───┴───┘  │ │  │  │  • Apply local operations      │   │
│ │          ▲              │ │  │  │  • Merge remote operations      │   │
│ │          │              │ │  │  │  • Generate sync updates        │   │
│ │     Redo Stack          │ │  │  │  • Conflict resolution          │   │
│ │  ┌───┬───┬───┐          │ │  │  │                                 │   │
│ │  │Op6│Op7│   │          │ │  │  └─────────────┬───────────────────┘   │
│ │  └───┴───┴───┘          │ │  │                │                       │
│ └─────────────────────────┘ │  │                │ Emit: 'doc-updated'   │
│                             │  │                ▼                       │
│  • Group operations         │  │  ┌─────────────────────────────────┐   │
│  • Selective undo           │  │  │      WebSocket Sync             │   │
│  • Collaboration-aware      │  │  │  • Broadcast to server          │   │
│                             │  │  │  • Receive from server          │   │
└─────────────────────────────┘  │  │  • Reconnection handling        │   │
                                 │  └─────────────────────────────────┘   │
                                 └─────────────────────────────────────────┘
                                                   │
                                                   │ State Changed Event
                                                   ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         REACT STATE LAYER                                  │
│                                                                           │
│  ┌───────────────────────┐    ┌───────────────────────┐                  │
│  │   Document Context    │    │    UI State Store     │                  │
│  │                       │    │     (Zustand/Redux)   │                  │
│  │  • doc: Y.Doc ref     │    │                       │                  │
│  │  • selection: Range   │    │  • toolbar state      │                  │
│  │  • users: Map         │    │  • panel visibility   │                  │
│  │  • version: number    │    │  • modal states       │                  │
│  │                       │    │  • loading indicators │                  │
│  └───────────┬───────────┘    └───────────┬───────────┘                  │
│              │                            │                               │
│              └────────────┬───────────────┘                               │
│                           │                                               │
│                           │ useContext / useStore                         │
│                           ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    REACT COMPONENT TREE                              │ │
│  │                  (Re-renders on state change)                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Virtual DOM Diff
                                 ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                              DOM                                          │
└───────────────────────────────────────────────────────────────────────────┘
```

**Tuấn:** Flow bắt đầu từ user input hoặc remote changes. Input handlers normalize everything thành operations. Operations đi qua Undo Manager để track history và Collaboration Engine để sync. Collaboration Engine dùng CRDT document, khi state thay đổi nó emit event. React layer subscribe vào event đó và re-render.

**Michael:** Em dùng Zustand thay vì Redux, tại sao?

**Tuấn:** Zustand simpler và lighter, không cần boilerplate như Redux với actions, reducers, action creators. Với collaborative editor, phần lớn state complexity nằm trong CRDT document, không cần Redux's structured approach. Zustand cũng có built-in subscription mechanism, em có thể select specific slices của state để minimize re-renders. Tuy nhiên nếu team đã familiar với Redux và có existing patterns thì Redux cũng fine.

**Michael:** Undo redo trong collaborative environment phức tạp như thế nào?

**Tuấn:** Rất phức tạp ạ. Vấn đề là khi em undo, em chỉ muốn undo operations của mình, không phải của other users. Nhưng operations có thể interleaved. Ví dụ em type "hello", user B type "world" xen vào, em undo thì phải undo "hello" mà giữ "world". CRDT giúp phần nào vì operations không depend on positions. Yjs có built-in undo manager support collaborative undo.

**Michael:** Nếu em implement từ đầu, approach như thế nào?

**Tuấn:** Em sẽ cần tag mỗi operation với user ID và timestamp. Undo stack chỉ chứa operations của current user. Khi undo, em apply inverse operation. Inverse của insert là delete same text at same ID. Vì CRDT dùng IDs không positions, inverse operation valid bất kể other changes. Tuy nhiên có edge cases như undo formatting khi text đã bị delete bởi other user, cần handle gracefully.

---

## Real-time Sync Flow

**Michael:** Nói thêm về real-time sync. Em design sequence diagram cho một edit operation được sync như thế nào?

**Tuấn:** Dạ em vẽ sequence diagram:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           SEQUENCE DIAGRAM: Collaborative Edit Operation                     │
└─────────────────────────────────────────────────────────────────────────────┘

    User A                User B               Server            Database
    (Editor)              (Editor)          (Collab Hub)
       │                     │                   │                   │
       │                     │                   │                   │
   ════╪═════════════════════╪═══════════════════╪═══════════════════╪════════
       │  USER A TYPES "Hi"  │                   │                   │
   ════╪═════════════════════╪═══════════════════╪═══════════════════╪════════
       │                     │                   │                   │
    ┌──┴──┐                  │                   │                   │
    │Type │                  │                   │                   │
    │"Hi" │                  │                   │                   │
    └──┬──┘                  │                   │                   │
       │                     │                   │                   │
       │ 1. Local Apply      │                   │                   │
       │ (Optimistic)        │                   │                   │
       ├────────────┐        │                   │                   │
       │            │        │                   │                   │
       │◄───────────┘        │                   │                   │
       │ [UI Updates         │                   │                   │
       │  Immediately]       │                   │                   │
       │                     │                   │                   │
       │ 2. Generate CRDT Update                 │                   │
       │────────────────────────────────────────►│                   │
       │    WebSocket: {                         │                   │
       │      type: 'update',                    │                   │
       │      docId: 'doc123',                   │                   │
       │      data: <binary CRDT update>,        │                   │
       │      clientId: 'userA',                 │                   │
       │      clock: 42                          │                   │
       │    }                                    │                   │
       │                     │                   │                   │
       │                     │    3. Server      │                   │
       │                     │    Receives       │                   │
       │                     │                   ├──────────────────►│
       │                     │                   │  Persist Update   │
       │                     │                   │  (Append-only)    │
       │                     │                   │◄──────────────────┤
       │                     │                   │                   │
       │                     │    4. Broadcast   │                   │
       │                     │◄──────────────────┤                   │
       │                     │  to other clients │                   │
       │                     │                   │                   │
       │                     │ 5. Merge CRDT     │                   │
       │                     │    Update         │                   │
       │                  ┌──┴──┐                │                   │
       │                  │Merge│                │                   │
       │                  │ Op  │                │                   │
       │                  └──┬──┘                │                   │
       │                     │                   │                   │
       │                     │ [User B sees      │                   │
       │                     │  "Hi" appear]     │                   │
       │                     │                   │                   │
       │ 6. ACK (optional)   │                   │                   │
       │◄────────────────────────────────────────┤                   │
       │    { ack: true, clock: 42 }             │                   │
       │                     │                   │                   │
   ════╪═════════════════════╪═══════════════════╪═══════════════════╪════════
       │  CONCURRENT EDIT    │                   │                   │
       │  User B types "Bye" │                   │                   │
   ════╪═════════════════════╪═══════════════════╪═══════════════════╪════════
       │                     │                   │                   │
       │                  ┌──┴──┐                │                   │
       │                  │Type │                │                   │
       │                  │"Bye"│                │                   │
       │                  └──┬──┘                │                   │
       │                     │                   │                   │
       │                     │ Local Apply ──────┤                   │
       │                     ├─────────────┐     │                   │
       │                     │             │     │                   │
       │                     │◄────────────┘     │                   │
       │                     │                   │                   │
       │                     │──────────────────►│                   │
       │                     │  WebSocket update │                   │
       │                     │                   │                   │
       │◄────────────────────────────────────────┤  Broadcast        │
       │     Receive update  │                   │                   │
       │                     │                   │                   │
    ┌──┴──┐                  │                   │                   │
    │Merge│                  │                   │                   │
    │ Op  │                  │                   │                   │
    └──┬──┘                  │                   │                   │
       │                     │                   │                   │
       │ [CRDT auto-merges   │                   │                   │
       │  - no conflicts!]   │                   │                   │
       │                     │                   │                   │
       ▼                     ▼                   ▼                   ▼


TIMING DETAILS:
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────┬──────────────────────────────────────────────────────────┐
│   Step         │   Latency Target                                          │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ 1. Local Apply │   < 16ms (single frame) - immediate visual feedback       │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ 2. WS Send     │   < 50ms - network round trip                             │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ 3. Server Proc │   < 10ms - minimal processing                             │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ 4. Broadcast   │   < 50ms - fan out to clients                             │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ 5. Remote Merge│   < 16ms - apply and render                               │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ TOTAL E2E      │   ~150-200ms typical                                      │
└─────────────────┴──────────────────────────────────────────────────────────┘
```

**Tuấn:** Key point là optimistic update, user A thấy change immediately mà không cần wait for server. Server receives, persists, broadcasts. User B merges CRDT update, vì CRDT designed cho convergence nên không có conflict. Server chỉ relay, không need transform logic.

**Michael:** Nếu user offline rồi online lại thì sync như thế nào?

**Tuấn:** CRDT shine ở đây. Khi offline, user tiếp tục edit locally, operations stored trong local CRDT document. Khi reconnect, client gửi full state vector hoặc missing updates từ last known sync point. Server compare với its state, send back any updates client missing. Yjs handle này automatically với sync protocol.

**Michael:** State vector là gì?

**Tuấn:** Mỗi client có clock counter, mỗi operation tagged với client ID và clock. State vector là map từ client ID tới last known clock. Ví dụ state vector là A colon 10, B colon 15 nghĩa là đã thấy operations từ A up to clock 10, từ B up to clock 15. Khi sync, gửi state vector, server biết client thiếu những operations nào và gửi lại.

**Michael:** Conflict có thể xảy ra không?

**Tuấn:** Với CRDT, conflicts về data consistency không xảy ra by design. Tuy nhiên có "semantic conflicts" mà CRDT không giải quyết. Ví dụ hai users cùng edit một sentence, result là merge của cả hai edits, có thể không make sense. Đây là inherent trade-off của eventual consistency. Solution là UI level, show users merge result và let them resolve manually nếu cần.

---

## Performance Optimization

**Michael:** Nói về performance optimization cho editor này. Em sẽ focus vào những gì?

**Tuấn:** Dạ em vẽ một diagram về performance optimization points:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATION MAP                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  1. INITIAL LOAD OPTIMIZATION                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Time ──────────────────────────────────────────────────────────────►     │
│                                                                             │
│    ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────────────┐   │
│    │ Critical │ │   First    │ │  Document   │ │    Full Document     │   │
│    │   CSS    │ │   Paint    │ │   Skeleton  │ │    Content Loaded    │   │
│    │ (inline) │ │  (< 1.5s)  │ │   Visible   │ │                      │   │
│    └──────────┘ └────────────┘ └─────────────┘ └──────────────────────┘   │
│         │            │              │                    │                 │
│         ▼            ▼              ▼                    ▼                 │
│    [Inlined]   [App Shell]   [Placeholder    [Progressive               │
│                              content with     content hydration]          │
│                              shimmer UI]                                   │
│                                                                             │
│    STRATEGIES:                                                              │
│    • Code split editor into chunks (toolbar, sidepanel, core)              │
│    • Preload critical resources in <head>                                  │
│    • Stream document content (first page first)                            │
│    • Defer non-critical features (comments, history)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. TYPING PERFORMANCE (Critical Path)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Keypress ───► Process ───► Update ───► Render ───► Paint                │
│       │            │           │            │           │                   │
│       │          <1ms        <5ms        <10ms       <16ms                 │
│       │                                                                     │
│    TARGET: < 16ms total (60fps)                                            │
│                                                                             │
│    ┌────────────────────────────────────────────────────────────────────┐  │
│    │                    OPTIMIZATION TECHNIQUES                         │  │
│    ├────────────────────────────────────────────────────────────────────┤  │
│    │                                                                    │  │
│    │  INPUT HANDLING:                                                   │  │
│    │  • Use 'input' event not 'keydown' for text                       │  │
│    │  • Batch rapid keystrokes with requestIdleCallback                │  │
│    │  • Handle IME (Input Method Editor) correctly                      │  │
│    │                                                                    │  │
│    │  STATE UPDATE:                                                     │  │
│    │  • Mutate CRDT doc directly (not immutable copies)                │  │
│    │  • Debounce React state updates (but not DOM)                     │  │
│    │  • Use React.memo() extensively                                    │  │
│    │                                                                    │  │
│    │  RENDERING:                                                        │  │
│    │  • Only re-render changed paragraph                               │  │
│    │  • Use CSS containment: contain: layout paint style               │  │
│    │  • Avoid layout thrashing (batch reads, batch writes)             │  │
│    │                                                                    │  │
│    └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. LARGE DOCUMENT HANDLING                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Document with 10,000+ paragraphs:                                        │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                    VIEWPORT (visible)                           │     │
│    │           ┌──────────────────────────────────┐                  │     │
│    │           │                                  │                  │     │
│    │   ▲       │   Actually Rendered              │       ▲          │     │
│    │   │       │   (~50 paragraphs)               │       │          │     │
│    │   │       │                                  │       │          │     │
│    │ Buffer    └──────────────────────────────────┘    Buffer       │     │
│    │ (20 p.)                                           (20 p.)      │     │
│    │   │                                                  │          │     │
│    │   ▼                                                  ▼          │     │
│    │                                                                 │     │
│    │   [....... Virtual placeholders .......]                       │     │
│    │   (Height calculated, not rendered)                            │     │
│    │                                                                 │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│    VIRTUALIZATION STRATEGY:                                                 │
│    • Render visible + buffer paragraphs only                               │
│    • Use IntersectionObserver to detect visibility                         │
│    • Cache measured heights                                                 │
│    • Use transform for positioning (GPU accelerated)                       │
│    • Recycle DOM nodes when possible                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. MEMORY MANAGEMENT                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────────────────────────────────────────────────────────┐    │
│    │                    MEMORY BUDGET: ~200MB                         │    │
│    ├──────────────────────────────────────────────────────────────────┤    │
│    │                                                                  │    │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│    │  │   CRDT Doc  │  │  Undo Stack │  │   Images    │              │    │
│    │  │   (50MB)    │  │   (30MB)    │  │  (Variable) │              │    │
│    │  │             │  │             │  │             │              │    │
│    │  │ • Text data │  │ • Limited   │  │ • Lazy load │              │    │
│    │  │ • Metadata  │  │   depth     │  │ • Unload    │              │    │
│    │  │ • IDs       │  │ • Compress  │  │   offscreen │              │    │
│    │  │             │  │   old ops   │  │             │              │    │
│    │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│    │                                                                  │    │
│    │  LEAK PREVENTION:                                                │    │
│    │  • WeakMap for DOM-to-data mappings                             │    │
│    │  • Cleanup subscriptions in useEffect                           │    │
│    │  • Limit undo history depth                                     │    │
│    │  • Garbage collect deleted CRDT tombstones periodically         │    │
│    │                                                                  │    │
│    └──────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  5. NETWORK OPTIMIZATION                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌────────────────────────────────────────────────────────────────────┐  │
│    │                                                                    │  │
│    │  LOCAL CHANGES                         SYNC TO SERVER              │  │
│    │       │                                      ▲                     │  │
│    │       ▼                                      │                     │  │
│    │  ┌─────────┐     ┌─────────┐     ┌─────────┐                      │  │
│    │  │Operation│────►│ Buffer  │────►│ Batch   │                      │  │
│    │  │         │     │ (50ms)  │     │ & Send  │                      │  │
│    │  └─────────┘     └─────────┘     └─────────┘                      │  │
│    │                                                                    │  │
│    │  • Buffer operations for 50ms before sending                      │  │
│    │  • Reduces network overhead for rapid typing                      │  │
│    │  • CRDT updates are binary (compact)                              │  │
│    │  • Use binary WebSocket frames (not JSON)                         │  │
│    │                                                                    │  │
│    │  RECONNECTION:                                                     │  │
│    │  • Exponential backoff with jitter                                │  │
│    │  • Queue operations while disconnected                            │  │
│    │  • Sync state vector on reconnect                                 │  │
│    │  • Handle "stale client" scenario                                 │  │
│    │                                                                    │  │
│    └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tuấn:** Như anh thấy, em chia optimization thành năm areas chính. Initial load focus vào code splitting và progressive loading. Typing performance là critical path, cần dưới 16ms để đạt 60fps. Large document cần virtualization. Memory management để prevent leaks và stay within budget. Network optimization để reduce latency và handle connectivity issues.

**Michael:** Typing performance 16ms, em đo như thế nào?

**Tuấn:** Em dùng Performance API, specifically performance.mark và performance.measure để instrument key points. Trong development có React DevTools Profiler để identify slow components. Chrome DevTools Performance tab cho overall analysis. Em cũng setup performance monitoring trong production, track P50, P95 latencies cho critical operations.

**Michael:** Nếu em thấy typing lag, debugging approach như thế nào?

**Tuấn:** Em sẽ dùng Chrome Performance tab, record một typing session, analyze flame chart. Em look for long tasks blocking main thread, excessive re-renders, layout thrashing. Common culprits là: synchronous DOM measurements causing forced layout, large React tree re-rendering on each keystroke, expensive selectors or style calculations. Từ đó em biết chỗ cần optimize.

**Michael:** CSS containment em đề cập, explain kỹ hơn?

**Tuấn:** CSS contain property tells browser về element's isolation. contain layout means element's layout is independent, changes inside don't affect outside layout, cho phép browser skip recalculating layout của ancestors. contain paint means content doesn't paint outside bounds, browser can skip painting checks. Với editor, mỗi paragraph có contain layout paint style sẽ giúp browser optimize rendering khi content changes.

**Michael:** Good. Bây giờ nói về accessibility. Collaborative editor cần handle những gì?

**Tuấn:** Accessibility cho editor là challenging area. Key considerations: Screen reader support với proper ARIA roles và live regions để announce changes. Keyboard navigation cho tất cả actions, không chỉ typing mà cả formatting, navigation, selection. High contrast mode support. Focus management đặc biệt quan trọng với complex UI.

**Michael:** Làm sao screen reader biết có changes từ other users?

**Tuấn:** Em dùng ARIA live regions. Có một hidden div với aria-live polite hoặc assertive, khi remote change arrives, em update text content của div đó, screen reader sẽ announce. Ví dụ user B starts editing paragraph 3, em update live region text thành user B is editing paragraph 3. Cần balance giữa informative và not too noisy.

**Michael:** Rất comprehensive. Một câu hỏi cuối: nếu em phải prioritize, top 3 technical risks khi build system này là gì?

**Tuấn:** Top 3 risks em nghĩ là. Một, Real-time sync reliability, edge cases như network partitions, concurrent edits on same character, clock drift có thể cause inconsistencies, cần extensive testing và fallback strategies. Hai, Performance at scale, với large documents và many concurrent users, maintaining smooth typing experience challenging, cần constant profiling và optimization. Ba, Editor complexity, ContentEditable notoriously difficult to work with cross-browser, IME handling for international users complicated, undo redo in collaborative context tricky.

**Michael:** Good thinking. Em prepared well cho round này. Mình take lunch break rồi chuyển sang quiz round nhé.

**Tuấn:** Dạ em cảm ơn anh Michael.

---

# ROUND 3: QUIZ QUESTIONS (1.5 tiếng)

## Interviewer: Lisa Wong - Staff Engineer, Chrome Performance Team

---

**1:30 PM - Sau lunch**

**Lisa:** Chào Tuấn, tôi là Lisa từ Chrome Performance Team. Round này mình sẽ đi qua một series câu hỏi technical để assess depth of understanding. Format là tôi hỏi, em trả lời, tôi có thể follow up. Ready?

**Tuấn:** Dạ chào chị Lisa, em sẵn sàng ạ.

---

### Question 1: React Reconciliation

**Lisa:** Đầu tiên, explain cho chị React's reconciliation algorithm hoạt động như thế nào?

**Tuấn:** Dạ reconciliation là process React dùng để determine những changes nào cần apply vào DOM khi component re-render. Khi state hoặc props thay đổi, React tạo một Virtual DOM tree mới, compare với tree trước đó, và compute minimal set of DOM operations.

**Lisa:** Algorithm để compare hai trees là gì?

**Tuấn:** React dùng heuristic-based diffing algorithm với O của n complexity thay vì optimal O của n cubed. Hai assumptions chính: elements of different types produce different trees, và developer can hint stable elements via key prop. Comparison bắt đầu từ root, nếu type khác thì tear down cả subtree. Nếu type giống, React updates attributes và recurses on children.

**Lisa:** Nói về key prop, tại sao cần nó và điều gì xảy ra nếu dùng index làm key?

**Tuấn:** Key giúp React identify elements khi list thay đổi. Không có key, React compares by position, insert at beginning shifts all indices, React thinks all items changed và re-renders everything. Với unique keys, React matches elements regardless of position, chỉ update những cái thực sự changed.

**Lisa:** Index làm key thì sao?

**Tuấn:** Dùng index làm key có issues khi list reorders hoặc items add/remove ở giữa. Ví dụ list là A B C với indices 0 1 2. Insert X ở đầu thành X A B C với indices 0 1 2 3. React thấy key 0 có item khác, key 1 có item khác, v.v., thinks tất cả changed. Worse, nếu items có internal state như input values, state sẽ bị mismatched với wrong items.

**Lisa:** Fiber architecture khác gì với reconciliation algorithm cũ?

**Tuấn:** Fiber là rewrite của React's core algorithm, introduced React 16. Key difference là incremental rendering. Algorithm cũ, Stack reconciler, process whole tree synchronously, block main thread cho large updates. Fiber breaks work into units called fibers, can pause and resume, prioritize updates, và yield to browser for high priority tasks like user input.

**Lisa:** Làm sao Fiber prioritize updates?

**Tuấn:** Fiber có scheduler với priority lanes. User interactions như clicks, typing có high priority, sync lane. Data fetching responses có lower priority. Animation có dedicated lane. Scheduler processes high priority updates first, can interrupt low priority work if high priority comes in. Điều này cho phép responsive UI even during heavy computations.

---

### Question 2: Browser Rendering Pipeline

**Lisa:** Tiếp theo, walk chị through browser's critical rendering path từ khi receive HTML đến khi pixels appear on screen.

**Tuấn:** Dạ, browser rendering có nhiều stages. Đầu tiên là Parse HTML để construct DOM tree. Cùng lúc, Parse CSS để construct CSSOM. DOM và CSSOM combined thành Render Tree, chỉ contains visible elements với computed styles. Tiếp là Layout phase, calculate positions và sizes. Rồi Paint phase, fill in pixels. Cuối cùng Composite, combine layers và display.

**Lisa:** DOM construction block by CSS hay JavaScript?

**Tuấn:** CSS không block DOM construction, nhưng blocks rendering. Browser có thể parse HTML tiếp trong khi wait for CSS, nhưng không render cho đến khi CSSOM ready vì cần styles để know what to display. JavaScript trong script tag blocks DOM parsing by default vì script có thể modify DOM với document.write. Đó là lý do defer và async attributes quan trọng.

**Lisa:** Khác biệt giữa defer và async?

**Tuấn:** Cả hai download scripts asynchronously, không block parsing. Async execute ngay khi download xong, order không guaranteed. Defer wait until HTML parse hoàn thành, execute theo document order. Với modern apps, defer thường preferred vì preserve execution order và execute after DOM ready.

**Lisa:** Trong pipeline, what triggers Layout versus just Paint?

**Tuấn:** Layout triggered khi geometry changes, properties như width, height, position, margin, padding. Paint triggered khi visual properties change mà không affect geometry, như background-color, visibility, shadows. Có một category nữa là Composite-only changes như transform và opacity, these avoid both layout và paint, chỉ need composite, fastest.

**Lisa:** Tại sao transform và opacity chỉ trigger composite?

**Tuấn:** Browser can promote elements with these properties to their own compositor layers. Transform và opacity changes can be handled entirely on GPU without involving main thread layout or paint. Đó là why animations using transform smooth hơn animations using left/top positions.

**Lisa:** Làm sao em know which properties trigger what?

**Tuấn:** Có resource csstriggers.com lists all properties và their effects. In general, geometric properties trigger layout, visual properties trigger paint, transform and opacity are composite-only. In practice, em profile với DevTools để verify assumptions.

---

### Question 3: JavaScript Event Loop

**Lisa:** Explain event loop, specifically microtasks versus macrotasks.

**Tuấn:** Event loop là mechanism browser dùng để handle asynchronous operations trong single-threaded environment. Loop có phases: execute script, process microtask queue until empty, render if needed, then pick one macrotask from queue và repeat.

**Lisa:** Microtask queue versus macrotask queue, specific examples?

**Tuấn:** Microtasks include Promise callbacks, queueMicrotask, và MutationObserver callbacks. Macrotasks include setTimeout, setInterval, setImmediate trong Node, I/O callbacks, và UI rendering events. Key difference là all microtasks are processed before next macrotask, microtask queue drains completely each cycle.

**Lisa:** Cho chị một code example để illustrate order?

**Tuấn:** Dạ ví dụ em có: console log A, setTimeout log B với delay 0, Promise resolve then log C, console log D. Execution order là: A logs immediately, D logs immediately vì synchronous. Promise callback C queued as microtask. setTimeout callback B queued as macrotask. End of sync code, process microtasks, C logs. Then event loop picks macrotask, B logs. So order is A, D, C, B.

**Lisa:** Nếu trong microtask em queue thêm microtask thì sao?

**Tuấn:** Microtask queue drains completely before proceeding, so new microtasks queued during processing are also processed in same cycle. This can cause issues nếu infinite loop of microtasks, browser would hang, no macrotasks or rendering would happen.

**Lisa:** Làm sao rendering fits into event loop?

**Tuấn:** Rendering happens between macrotask cycles nếu browser determines it's needed. Browser có rendering budget, typically 60fps means 16ms per frame. If enough time, browser runs: process microtasks, run requestAnimationFrame callbacks, calculate styles, layout, paint, composite. If no time, rendering may be skipped until next opportunity.

---

### Question 4: Memory Management & Leaks

**Lisa:** How does JavaScript garbage collection work và common causes of memory leaks trong web apps?

**Tuấn:** V8 uses generational garbage collection. Objects allocated in Young Generation, most objects die young. Frequent minor GC scans young generation, surviving objects promoted to Old Generation. Less frequent major GC scans entire heap. Algorithm is mark-and-sweep, starting from roots như global object, stack variables, traces reachable objects, unreachable ones are collected.

**Lisa:** Common memory leak patterns trong React apps?

**Tuấn:** Một, forgotten event listeners, addEventListener without removeEventListener on cleanup. Hai, stale closures holding references to large objects. Ba, growing data structures không being trimmed như unbounded caches, logs. Bốn, detached DOM nodes, element removed from DOM nhưng still referenced in JS. Năm, với React specifically, forgetting cleanup in useEffect, setInterval without clearInterval, subscriptions without unsubscribe.

**Lisa:** Làm sao detect memory leaks trong production?

**Tuấn:** Development phase dùng Chrome DevTools Memory tab, take heap snapshots, compare over time để see what's growing. Look for detached DOM trees. Performance Monitor shows memory graph real-time. Production monitoring có thể dùng performance.memory API nếu available, hoặc monitor page crashes, long session degradation reports. Some APM tools offer memory profiling.

**Lisa:** WeakMap và WeakRef giúp như thế nào?

**Tuấn:** WeakMap holds weak references to keys, nếu key object không có other strong references, nó can be garbage collected, entry automatically removed from WeakMap. Useful for associating metadata với DOM elements without preventing their garbage collection. WeakRef là ES2021 addition, provides explicit weak reference to object, can be garbage collected anytime, deref method returns object hoặc undefined nếu collected.

---

### Question 5: Web Security

**Lisa:** Common web security vulnerabilities và mitigations?

**Tuấn:** XSS, Cross-Site Scripting, attacker injects malicious scripts. Mitigations include escaping output, Content Security Policy, using frameworks like React that escape by default. CSRF, Cross-Site Request Forgery, attacker tricks user into making unintended requests. Mitigations include CSRF tokens, SameSite cookie attribute. Clickjacking, embedding site in iframe to trick clicks. Mitigation is X-Frame-Options header or CSP frame-ancestors.

**Lisa:** React escapes by default, nhưng có exceptions không?

**Tuấn:** Có, dangerouslySetInnerHTML explicitly sets innerHTML, không escape, developer must sanitize input. href attributes với javascript protocol có thể execute code. Style prop với user-controlled CSS có potential CSS injection. Event handlers như onClick nếu passed user string. Links với user-controlled URLs cần validation.

**Lisa:** Content Security Policy, explain directives?

**Tuấn:** CSP là HTTP header limiting what resources page can load. default-src fallback for all resource types. script-src controls JavaScript sources. style-src for CSS. img-src for images. connect-src for fetch, XHR, WebSocket. frame-ancestors controls who can embed this page. Có special values như self for same origin, none to block, unsafe-inline để allow inline scripts nhưng reduces security.

**Lisa:** Nếu em cần inline scripts, làm sao secure hơn unsafe-inline?

**Tuấn:** Dùng nonce-based approach. Server generates random nonce per request, adds to CSP header and script tag's nonce attribute. Only scripts with matching nonce execute. Alternatively, hash-based, compute hash of script content, add to CSP. Both allow specific inline scripts while blocking injected ones.

---

### Question 6: Performance Metrics & Web Vitals

**Lisa:** Core Web Vitals là gì và tại sao important?

**Tuấn:** Core Web Vitals là three metrics Google uses for ranking và user experience. LCP, Largest Contentful Paint, measures loading performance, time until largest content element visible, target under 2.5 seconds. FID, First Input Delay, measures interactivity, time from first interaction to browser can respond, target under 100ms. CLS, Cumulative Layout Shift, measures visual stability, sum of unexpected layout shifts, target under 0.1.

**Lisa:** FID đang được replace bởi metric nào?

**Tuấn:** Interaction to Next Paint, INP, replacing FID in March 2024. FID chỉ measures first interaction, INP considers all interactions throughout page lifecycle, reports worst or near-worst latency. Better represents overall interactivity, catches issues that appear later in session.

**Lisa:** Làm sao optimize LCP?

**Tuấn:** Identify LCP element first, usually hero image hoặc large text block. For images, use srcset for appropriate sizes, preload critical images, use modern formats like WebP or AVIF, consider lazy loading below-fold images but not LCP image. For text, ensure fonts load fast với font-display swap, preload critical fonts. Reduce server response time với caching, CDN. Minimize render-blocking resources.

**Lisa:** CLS causes và fixes?

**Tuấn:** Common causes: images without dimensions, browser doesn't know size until loaded, content shifts. Fix với explicit width and height or aspect-ratio CSS. Ads and embeds loading late, reserve space với placeholder. Web fonts causing text to reflow, use font-display swap và match fallback font metrics. Dynamic content inserted above existing content, add at bottom or use transform animations.

---

### Question 7: React Hooks Deep Dive

**Lisa:** useCallback và useMemo, khi nào thực sự cần dùng?

**Tuấn:** useCallback memoizes function reference, useMemo memoizes computed value. Cần dùng khi: function passed to memoized child component, without useCallback mới function reference mỗi render causes child re-render even với React.memo. useMemo cho expensive computations để avoid recalculating mỗi render.

**Lisa:** Khi nào không nên dùng?

**Tuấn:** Premature optimization khi computation cheap, overhead của memoization có thể cao hơn computation itself. Khi dependencies change frequently, memoization doesn't help và adds overhead. Khi component renders infrequently anyway. Rule of thumb là measure first, optimize khi có evidence of problem.

**Lisa:** useLayoutEffect versus useEffect?

**Tuấn:** useEffect fires asynchronously after browser paint, safe for most side effects như data fetching, subscriptions. useLayoutEffect fires synchronously after DOM mutations but before paint, blocks visual update until complete. Use for DOM measurements hoặc mutations that need to happen before user sees, như measuring element size để position tooltip.

**Lisa:** Custom hooks best practices?

**Tuấn:** Extract reusable stateful logic, keep hooks focused on single responsibility. Prefix with use for linting and convention. Return consistent interface, either object for many values hoặc tuple for few. Handle cleanup properly. Consider error và loading states. Test with React Testing Library's renderHook.

---

### Question 8: CSS Layout

**Lisa:** Flexbox versus Grid, khi nào dùng cái nào?

**Tuấn:** Flexbox là one-dimensional, tốt cho layouts along single axis, như navigation bars, card rows, centering content. Grid là two-dimensional, tốt cho complex layouts với rows và columns, như page layouts, dashboards, galleries. Thường combine cả hai, Grid cho overall page structure, Flexbox cho components within grid areas.

**Lisa:** CSS specificity rules?

**Tuấn:** Specificity determines which styles apply khi multiple rules target same element. Calculated as four components: inline styles, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements. Higher number wins. Inline style beats ID beats class beats element. Equal specificity, later rule wins. Important flag overrides normal specificity.

**Lisa:** Làm sao manage specificity trong large codebase?

**Tuấn:** Strategies include: BEM naming convention keeps specificity low và consistent. CSS Modules hoặc CSS-in-JS scope styles automatically. Avoid IDs for styling, reserve for JavaScript hooks. Minimize nesting to avoid specificity escalation. Utility classes like Tailwind have consistent low specificity. Avoid important except for truly exceptional cases.

---

### Question 9: TypeScript

**Lisa:** any versus unknown versus never types?

**Tuấn:** any opts out of type checking, can do anything with it, defeats purpose of TypeScript. unknown là type-safe any, can assign anything to it nhưng must narrow type before using, forces runtime checks. never represents impossible values, function that always throws, infinite loops, exhaustive type checks.

**Lisa:** Generics use cases trong React?

**Tuấn:** Generic components accepting different data types, như Table component với T for row data type. Generic hooks returning typed values, like useState with T. Generic utility types, Pick, Omit, Partial. Higher-order components preserving wrapped component props. API response types with generics for data payload.

**Lisa:** Type inference limitations và khi nào cần explicit types?

**Tuấn:** TypeScript infers well from initialization, return statements, but struggles với: function parameters without context, often need explicit types. Empty arrays, inferred as never array, need type annotation. Object literals assigned to broader types, may lose specific properties. Complex generic inference, sometimes needs explicit type arguments.

---

### Question 10: Testing

**Lisa:** Testing pyramid trong frontend context?

**Tuấn:** Base là unit tests, many, fast, test individual functions và components in isolation. Middle là integration tests, fewer, test component interactions, data flow. Top là E2E tests, fewest, slowest, test complete user flows in real browser. Frontend often has inverted ratio, more integration tests because components rarely useful in complete isolation.

**Lisa:** React Testing Library philosophy khác gì Enzyme?

**Tuấn:** RTL encourages testing behavior not implementation. Query elements by accessible names, roles, text, like users would find them. Don't test internal state, test what user sees. Enzyme allows shallow rendering, testing component internals, implementation details. RTL approach leads to more resilient tests that survive refactors.

**Lisa:** Mocking trong unit tests, best practices?

**Tuấn:** Mock external dependencies như API calls, not internal implementation. Use dependency injection để make mocking easier. Mock at highest level possible, prefer mocking fetch over mocking entire module. Keep mocks minimal, only what's needed for test. Reset mocks between tests to avoid state leakage. Consider MSW for API mocking, intercepts at network level.

**Lisa:** Tốt lắm Tuấn, em answer rất well. Mình take short break rồi chuyển sang behavioral round.

---

# ROUND 4: BEHAVIORAL QUESTIONS (1.5 tiếng)

## Interviewer: James Liu - Engineering Manager, Google Cloud Team

---

**3:30 PM**

**James:** Hi Tuấn, I'm James, Engineering Manager at Google Cloud. This round focuses on your experiences, leadership, and how you handle various situations. We use STAR format - Situation, Task, Action, Result. Feel free to share specific examples from your career.

**Tuấn:** Dạ chào anh James. Em sẵn sàng.

---

### Question 1: Technical Leadership

**James:** Tell me about a time you led a significant technical initiative. What was the challenge and how did you drive it to completion?

**Tuấn:** Dạ, ở công ty trước, em led initiative để migrate từ legacy jQuery codebase sang React. Đây là codebase khoảng 200,000 lines JavaScript, team 8 người, serving millions users daily.

**James:** What made this challenging?

**Tuấn:** Challenge lớn nhất là không thể stop development để migrate. Business vẫn cần features, bug fixes ongoing. Codebase có years của accumulated technical debt, inconsistent patterns, minimal tests. Team members có varying levels React experience. Stakeholders questioned whether migration worth the investment.

**James:** How did you approach it?

**Tuấn:** Em started bằng building business case với metrics. Page load times averaged 8 seconds, user complaints increasing, developer productivity decreasing vì hard to maintain. Em presented to leadership với specific targets: 50% load time reduction, 30% fewer production bugs, measurable developer velocity improvements.

**James:** Did they approve immediately?

**Tuấn:** Không ạ, có pushback. CTO asked why not Vue or Angular, em had to justify React choice với ecosystem support, hiring pool, long-term viability. Finance wanted ROI timeline, em committed to measurable improvements within 6 months, full migration in 18 months.

**James:** Once approved, how did you execute?

**Tuấn:** Em created detailed migration strategy. Phase one, set up React infrastructure alongside existing jQuery, establish component library, create bridge layer allowing React components in jQuery pages. Phase two, migrate highest-traffic pages first, validate performance improvements. Phase three, systematic migration of remaining features. Phase four, decommission jQuery.

**James:** How did you handle the team?

**Tuấn:** Em assessed skills, paired senior React devs với those learning. Created internal workshops, documentation. Established code review standards specifically for migration code. Weekly demos to celebrate progress và identify blockers. Em took on some của most complex migration pieces personally to unblock team.

**James:** What was the result?

**Tuấn:** After 6 months, top 10 pages migrated, load time dropped from 8 seconds to 2.5 seconds. Bug tickets decreased 40%. Developer satisfaction improved in surveys. Full migration completed in 14 months, ahead of schedule. Project became template for other teams' migrations.

**James:** What would you do differently?

**Tuấn:** Em would have invested more upfront in automated testing migration. We ended up with test coverage gaps during transition. Also would have established clearer component ownership earlier, some components had unclear ownership leading to inconsistent patterns.

---

### Question 2: Conflict Resolution

**James:** Tell me about a time you had a significant disagreement with a colleague. How did you handle it?

**Tuấn:** Em had disagreement với senior backend engineer về API design for new product feature. Em was designing frontend, needed specific data structure. He insisted on different structure that worked better for backend but required significant frontend transformation.

**James:** What was the specific disagreement?

**Tuấn:** API returned nested objects three levels deep với inconsistent field naming. Em needed flattened structure với consistent naming for React state management. He argued backend shouldn't change to accommodate frontend, frontend should adapt.

**James:** How did you initially respond?

**Tuấn:** Honestly, initially em was frustrated. Em felt dismissed, like frontend concerns weren't valued equally. But em took step back, scheduled one-on-one meeting thay vì arguing in group setting.

**James:** What happened in that meeting?

**Tuấn:** Em came prepared với data. Showed performance impact of deep object traversal và transformation. Demonstrated code complexity required on frontend, potential bugs from inconsistent naming. Also asked him to explain backend constraints em might not understand.

**James:** Did he share backend perspective?

**Tuấn:** Có, turned out changing API structure would require significant database query changes. His deadline was tight, em hadn't fully appreciated his constraints. We both had valid concerns.

**James:** How did you resolve it?

**Tuấn:** We compromised. Em created transformation layer on frontend, he agreed to consistent field naming convention. For future APIs, we established joint design sessions upfront. Em wrote shared documentation of API contracts both sides agreed to.

**James:** What did you learn?

**Tuấn:** Em learned importance of understanding full context before pushing back. Also that in-person conversations resolve conflicts better than async debates. Building relationship first makes technical disagreements easier to navigate.

---

### Question 3: Failure and Learning

**James:** Tell me about a time you failed. What happened and what did you learn?

**Tuấn:** Em launched a feature that caused production outage. It was performance optimization em implemented without adequate testing.

**James:** Describe what happened.

**Tuấn:** Em added aggressive caching to reduce API calls. Logic seemed straightforward, but em missed edge case where cache invalidation didn't trigger correctly. Users started seeing stale data, some saw other users' data due to caching bug.

**James:** How severe was it?

**Tuấn:** Pretty severe. Took 2 hours to identify, another hour to fix. Affected approximately 50,000 users. Data privacy concern because of cross-user data exposure. Had to send notifications, some users lost trust.

**James:** What was immediate response?

**Tuấn:** Once identified, em immediately rolled back my changes. Then investigated root cause, the cache key wasn't unique enough. Em wrote detailed post-mortem, didn't hide or minimize my responsibility.

**James:** What did leadership say?

**Tuấn:** Manager was disappointed but appreciated transparency. Incident review focused on process gaps not blame. Em felt terrible, offered to give up bonus that quarter, manager said that wasn't necessary but appreciated accountability.

**James:** What changes resulted?

**Tuấn:** Several process improvements. Mandatory staging environment testing with production-like data. Enhanced code review checklist specifically for caching changes. Feature flags for gradual rollout. Em also created internal training on caching pitfalls.

**James:** How has this affected your approach?

**Tuấn:** Em much more cautious with optimizations now. Test edge cases more thoroughly. Prefer incremental rollouts. Not afraid to slow down when something seems risky. Also more empathetic when teammates make mistakes.

---

### Question 4: Mentoring

**James:** Tell me about a time you helped a teammate grow significantly.

**Tuấn:** Em mentored junior developer who joined straight from bootcamp. Initial skills were basic, struggled with codebase complexity, felt overwhelmed.

**James:** What specific challenges did she have?

**Tuấn:** Difficulty breaking down large problems into smaller tasks. Code reviews revealed gaps in fundamentals like algorithm complexity, design patterns. Communication challenges in technical discussions, often quiet in meetings.

**James:** How did you approach mentoring?

**Tuấn:** First em built trust through regular one-on-ones, not just about work nhưng career goals, learning style preferences. Then created structured learning plan based on skill gaps identified.

**James:** What did the learning plan include?

**Tuấn:** Weekly pairing sessions on real tasks, em explained thought process out loud. Assigned progressively complex tasks with clear success criteria. Recommended specific resources, books, courses aligned với identified gaps. Created safe space for questions, emphasized no question is stupid.

**James:** How did you handle code reviews?

**Tuấn:** Em changed approach for her reviews. Instead of just pointing out issues, explained why something was problematic, what better approach would be, provided resources to learn more. Celebrated improvements, not just caught mistakes.

**James:** Did she improve?

**Tuấn:** Significantly. After 6 months, she was handling medium-complexity features independently. Started contributing thoughtfully in design discussions. Code review feedback decreased substantially. She mentioned mentorship in her performance review as key factor.

**James:** What made the biggest difference?

**Tuấn:** Em think creating psychological safety was crucial. She wasn't afraid to admit confusion, ask questions. Also setting clear expectations with measurable progress helped her see growth, stay motivated.

---

### Question 5: Ambiguity and Decision Making

**James:** Tell me about a time you had to make an important decision with incomplete information.

**Tuấn:** Em had to choose architecture for new real-time feature with unclear requirements. Product was still defining use cases, deadline was firm, em couldn't wait for complete specs.

**James:** What was the decision?

**Tuấn:** Choosing between WebSocket-based solution requiring new infrastructure versus polling-based solution using existing infrastructure. WebSocket better for real-time but significant investment. Polling simpler but might not meet performance needs if requirements escalated.

**James:** How did you analyze options?

**Tuấn:** Em mapped out known requirements versus likely future requirements based on product discussions. Identified key uncertainties: scale expectations, latency requirements, update frequency. Created decision matrix with costs, risks, flexibility for each option.

**James:** What factors weighed most heavily?

**Tuấn:** Two factors. First, reversibility, polling could be upgraded to WebSocket later, going from WebSocket to polling would be step backward. Second, time to market, polling ready in 2 weeks, WebSocket needed 6 weeks. Given deadline pressure, em leaned toward polling.

**James:** Did you decide alone?

**Tuấn:** Không, em presented analysis to team and tech lead. They had additional input, tech lead mentioned upcoming projects that would benefit from WebSocket infrastructure. This changed calculus toward WebSocket despite higher upfront cost.

**James:** How did it turn out?

**Tuấn:** We built WebSocket infrastructure, met deadline with some scope reduction negotiated with product. Real-time feature performed well. Infrastructure was reused by three other teams within next year. Decision validated.

**James:** What if it had been wrong decision?

**Tuấn:** Em had documented reasoning, so we could have analyzed where thinking went wrong. Being wrong with good process is more acceptable than being right by luck. Em would have owned the mistake và led remediation.

---

### Question 6: Impact at Scale

**James:** Tell me about the project with the biggest impact you've worked on.

**Tuấn:** Em built shared component library adopted across organization of 200 plus developers, 15 products.

**James:** What was the problem you solved?

**Tuấn:** Each team built common components independently, buttons, forms, modals. Inconsistent UX across products confused users. Designers frustrated by implementation variations. New developers had to learn different patterns joining different teams. Significant duplicated effort.

**James:** How did you identify this as important?

**Tuấn:** Em noticed pattern during code reviews across teams. Mentioned to design lead, she confirmed frustration. Proposed component library to engineering leadership với estimated efficiency gains.

**James:** How did you build it?

**Tuấn:** Started small with most common components, buttons, inputs, modals. Worked closely với design team to establish spec. Prioritized developer experience, easy to use, well-documented, accessible by default. Released beta, gathered feedback from early adopter teams.

**James:** Adoption challenges?

**Tuấn:** Có ạ. Some teams had existing component libraries, reluctant to switch. Em addressed by showing migration path, offering migration support, demonstrating benefits with metrics from adopter teams. Some components didn't fit all use cases, em added customization options without compromising consistency.

**James:** What was the result?

**Tuấn:** After one year, 85 percent adoption across organization. Design consistency improved, measured by user surveys. Estimated 20 percent reduction in frontend development time for new features. Library became standard for new projects.

**James:** What made it successful?

**Tuấn:** Combination of technical quality and stakeholder management. Library had to be genuinely good, well-documented, performant. But also needed buy-in from design, product, engineering leadership. Em spent significant time building relationships, gathering feedback, incorporating suggestions.

---

### Question 7: Working with Stakeholders

**James:** Tell me about a time you had to push back on a stakeholder request.

**Tuấn:** Product manager requested feature that would take 3 months but wanted it in 3 weeks for marketing campaign.

**James:** How did you respond initially?

**Tuấn:** First em made sure em understood the request fully. Asked about specific requirements, must-haves versus nice-to-haves, reasons behind timeline. Turns out marketing campaign date was fixed due to external partnership.

**James:** How did you push back?

**Tuấn:** Em didn't say no outright. Instead presented options với trade-offs. Option A, full feature in 3 months as estimated. Option B, minimal viable version in 3 weeks với reduced functionality. Option C, different approach that might meet core need faster.

**James:** What was option C?

**Tuấn:** Instead of building custom feature, em proposed leveraging third-party tool integrated with our system. Less control but much faster. Em had researched alternatives before meeting.

**James:** How did PM respond?

**Tuấn:** Initially resistant to third-party solution, concerned about customization. Em addressed specific concerns, showed how integration would work, what customization was possible. PM consulted with marketing, third-party solution acceptable for campaign, custom feature could come later.

**James:** Result?

**Tuấn:** Launched with third-party solution for campaign, achieved marketing goals. Built custom feature over following months with proper timeline. PM appreciated having options rather than just pushback.

**James:** What if they had insisted on impossible timeline?

**Tuấn:** Em would have escalated concerns clearly, documented risks of rushing. If overruled, would have done best effort while making sure leadership understood trade-offs. Important to be collaborative but also honest about what's achievable.

---

### Question 8: Continuous Learning

**James:** How do you stay current with rapidly evolving frontend ecosystem?

**Tuấn:** Em có multiple approaches. Read newsletters like JavaScript Weekly, Frontend Focus for broad awareness. Follow key people on Twitter/X for emerging trends. Read technical blogs from companies facing similar challenges, Meta, Vercel, Netflix engineering blogs.

**James:** How do you decide what to learn deeply versus just be aware of?

**Tuấn:** Em assess relevance to current work và predicted importance. If technology solves problem em facing, dig deep. If it's interesting but not immediately applicable, bookmark for later. For major shifts like new React features, invest time regardless.

**James:** How do you apply new learning?

**Tuấn:** Em try to apply in side projects first, low risk experimentation. If promising, propose proof of concept at work. Share learnings với team through presentations, documentation. Teaching solidifies understanding và helps team.

**James:** Example of something you learned recently that you applied?

**Tuấn:** React Server Components. Read documentation, built personal project to understand. When opportunity arose for new feature, proposed RSC approach for performance benefits. Led implementation, documented learnings for team.

---

**James:** Great Tuấn, really enjoyed our conversation. You've given thoughtful, specific examples throughout the day. Any questions for me?

**Tuấn:** Dạ em có vài questions. What does success look like for this role in first 6 months? What are the biggest challenges the team is facing right now? How would you describe the team culture?

**James:** Great questions. Let me address each...

_[Interview continues with James answering Tuấn's questions]_

---

# KẾT THÚC PHỎNG VẤN

**5:15 PM**

**James:** That wraps up our interview day Tuấn. You'll hear from our recruiting team within about a week regarding next steps. Thank you for spending the day with us.

**Tuấn:** Dạ em cảm ơn anh James và tất cả các interviewers hôm nay. Em rất appreciate cơ hội được discuss technical problems và share experiences. Em look forward to hearing back.

---

## INTERVIEW SUMMARY

### Round 1 - Coding (Sarah Chen)

- **LRU Cache**: Strong understanding of data structures, explained trade-offs well
- **Promise.all with limit**: Good grasp of async patterns, handled edge cases
- **Virtualized List**: Excellent knowledge of React optimization techniques

### Round 2 - System Design (Michael Park)

- **Collaborative Editor Design**: Comprehensive architecture với clear reasoning
- Strong understanding of CRDT vs OT trade-offs
- Good performance optimization knowledge
- Covered accessibility considerations

### Round 3 - Quiz (Lisa Wong)

- **React Internals**: Deep knowledge of reconciliation, Fiber
- **Browser Rendering**: Strong understanding of critical rendering path
- **Security**: Good grasp of common vulnerabilities
- **Performance**: Solid Web Vitals knowledge

### Round 4 - Behavioral (James Liu)

- **Leadership**: Clear example of driving technical initiative
- **Conflict**: Mature approach to disagreements
- **Failure**: Honest, learned from mistakes
- **Mentoring**: Thoughtful approach to developing others

---

_End of Interview Simulation_
