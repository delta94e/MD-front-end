# CUỘC PHỎNG VẤN MÔ PHỎNG: SENIOR FRONTEND ENGINEER TẠI BIG TECH

**Thời gian**: Full-day onsite (khoảng 8 tiếng)
**Vị trí**: Senior Frontend Engineer
**Công ty**: Big Tech (Google/Meta/Amazon level)

---

# ROUND 1: CODING QUESTIONS (2 tiếng)

## Phần 1.1: Algorithmic Coding - Longest Increasing Path in Matrix

**Interviewer**: Chào em, anh là Minh, anh sẽ phỏng vấn em phần coding hôm nay. Em uống nước chưa, cần gì không?

**Candidate**: Dạ em chào anh, em ổn rồi ạ. Cảm ơn anh.

**Interviewer**: Ok, vậy mình bắt đầu nhé. Anh có một bài toán thế này. Cho em một matrix hai chiều với các số nguyên, em cần tìm độ dài của đường đi tăng dần dài nhất trong matrix đó. Từ mỗi ô, em có thể di chuyển sang bốn hướng lên, xuống, trái, phải. Em không được di chuyển ra ngoài biên hoặc di chuyển đến ô có giá trị nhỏ hơn hoặc bằng ô hiện tại. Em hiểu bài toán chưa?

**Candidate**: Dạ, để em clarify lại nhé anh. Nghĩa là em có một matrix, ví dụ như là ba nhân ba chẳng hạn, và em cần tìm một đường đi sao cho mỗi bước đi tiếp theo phải có giá trị lớn hơn bước trước đó đúng không ạ? Và đường đi này có thể bắt đầu từ bất kỳ ô nào?

**Interviewer**: Đúng rồi. Ví dụ cho em một matrix như thế này nhé: hàng đầu là chín, chín, bốn, hàng hai là sáu, sáu, tám, hàng ba là hai, một, một. Thì đường đi dài nhất sẽ là gì?

**Candidate**: Dạ để em trace qua. Em thấy có thể đi từ một ở vị trí cuối cùng, rồi đi lên tám, nhưng không, tám lớn hơn một nên được. Rồi từ tám đi đâu được nhỉ... À không, để em nghĩ lại. Nếu bắt đầu từ một ở góc dưới phải, em có thể đi sang trái đến một, nhưng một bằng một nên không được. Để em tìm path khác. Từ một ở hàng ba cột hai, em có thể đi lên sáu, rồi từ sáu đi lên chín, hoặc đi sang phải tám. Nếu đi lên chín thì dừng vì xung quanh toàn số nhỏ hơn hoặc bằng. Vậy path một, sáu, chín là ba bước. Còn nếu từ một đi lên sáu rồi sang tám, từ tám có thể đi đâu không? Xung quanh tám là sáu và bốn và một, đều nhỏ hơn. Vậy path một, sáu, tám cũng là ba. Hmm, có path nào dài hơn không? À, từ một đi lên hai được không? Một nhỏ hơn hai nên được. Từ hai đi lên sáu, rồi sáu đi sang tám hoặc lên chín. Vậy là một, hai, sáu, tám hoặc chín, được bốn bước. Đáp án là bốn đúng không anh?

**Interviewer**: Đúng rồi, đáp án là bốn. Vậy em approach bài này như thế nào?

**Candidate**: Dạ, em thấy bài này có tính chất overlapping subproblems vì từ mỗi ô, kết quả của nó có thể được reuse nếu em đã tính trước đó. Ví dụ khi em tính longest path từ ô sáu, kết quả này có thể được dùng lại khi em tính từ ô một hoặc ô hai. Vậy em nghĩ đến dynamic programming với memoization. Em sẽ tạo một cache để lưu kết quả đã tính. Với mỗi ô, em sẽ dùng DFS để explore bốn hướng, và chỉ đi tiếp nếu giá trị ô kế tiếp lớn hơn ô hiện tại. Kết quả của mỗi ô sẽ là một cộng với max của kết quả bốn hướng.

**Interviewer**: Ok, vậy tại sao em chọn DFS với memoization mà không phải BFS?

**Candidate**: Dạ, với BFS thì em sẽ khó track được path length một cách tự nhiên như DFS. DFS cho phép em đi sâu hết một path rồi quay lui, và với memoization thì em có thể cache kết quả của từng ô. BFS thì thường dùng cho shortest path trong unweighted graph, còn ở đây em cần longest path với constraint là increasing values. Hơn nữa, với DFS recursive, code sẽ clean hơn và dễ reason about hơn.

**Interviewer**: Có approach nào khác không? Ví dụ như em có thể dùng topological sort không?

**Candidate**: À đúng rồi anh, em có thể nhìn bài này dưới góc độ DAG. Vì em chỉ đi từ ô nhỏ đến ô lớn, nên sẽ không có cycle, nghĩa là đây là một Directed Acyclic Graph. Em có thể build một graph với edges từ ô nhỏ đến ô lớn liền kề, rồi dùng topological sort. Sau đó em process các node theo thứ tự topological và update longest path. Nhưng mà approach này phức tạp hơn trong việc implement, và time complexity vẫn tương đương, đều là O của m nhân n với m và n là dimensions của matrix. Em prefer DFS với memo vì nó straightforward hơn.

**Interviewer**: Space complexity của solution em là gì?

**Candidate**: Dạ, em cần một memo array có size m nhân n để cache kết quả. Ngoài ra, với DFS recursive thì call stack có thể lên tới m nhân n trong worst case, ví dụ khi matrix là một dãy tăng dần liên tục. Vậy space complexity là O của m nhân n.

**Interviewer**: Nếu matrix rất lớn và em bị stack overflow thì sao?

**Candidate**: Dạ, trong trường hợp đó em có thể convert DFS recursive sang iterative bằng cách dùng explicit stack. Hoặc em có thể dùng approach topological sort mà em đề cập ở trên vì nó iterative. Một cách khác là em có thể sort tất cả các ô theo giá trị tăng dần, rồi process từng ô theo thứ tự đó. Với mỗi ô, em check bốn neighbor có giá trị nhỏ hơn và lấy max của longest path của chúng cộng một. Cách này cũng iterative và tránh được stack overflow.

**Interviewer**: Interesting. Vậy em có thể giải thích chi tiết hơn cách sort và process không?

**Candidate**: Dạ được ạ. Em sẽ tạo một array chứa tất cả các ô với tọa độ và giá trị của chúng. Rồi em sort array này theo giá trị tăng dần. Em cũng tạo một dp matrix với kích thước m nhân n, initialize tất cả bằng một vì mỗi ô ít nhất là một path của chính nó. Sau đó em iterate qua sorted array. Với mỗi ô, em check bốn neighbor. Nếu neighbor có giá trị nhỏ hơn ô hiện tại, nghĩa là từ neighbor có thể đi đến ô hiện tại, thì dp của ô hiện tại sẽ là max của dp hiện tại và dp của neighbor cộng một. Cuối cùng em return max value trong dp matrix.

**Interviewer**: Time complexity của approach này?

**Candidate**: Dạ, sort sẽ tốn O của m nhân n nhân log của m nhân n. Sau đó em iterate qua m nhân n ô, mỗi ô check bốn neighbor là constant. Vậy total là O của m nhân n nhân log của m nhân n, dominated by sorting. Space thì vẫn là O của m nhân n cho dp matrix và sorted array.

**Interviewer**: So với DFS approach thì approach nào tốt hơn?

**Candidate**: Dạ, DFS với memo có time complexity O của m nhân n vì mỗi ô chỉ được tính một lần. Còn sorting approach là O của m nhân n log m nhân n do sorting. Về mặt time complexity thì DFS tốt hơn. Nhưng sorting approach có ưu điểm là iterative nên không bị stack overflow, và có thể dễ parallelize hơn nếu cần. Trong practice, với matrix size vừa phải thì DFS với memo là đủ và code đơn giản hơn.

**Interviewer**: Ok tốt. Em implement DFS solution đi.

**Candidate**: Dạ vâng. Em sẽ tạo một function chính nhận vào matrix. Đầu tiên em check edge cases, nếu matrix rỗng hoặc có zero rows thì return zero. Em sẽ lấy số rows là m và số columns là n từ matrix. Em tạo một memo matrix cùng kích thước, initialize bằng negative one hoặc zero để mark là chưa tính. Em cũng define một array directions với bốn cặp delta row và delta column cho bốn hướng di chuyển.

Rồi em tạo một helper function DFS nhận vào row và column hiện tại. Trong helper này, đầu tiên em check nếu memo đã có giá trị thì return luôn, đây là memoization. Nếu chưa, em initialize result bằng một vì ô hiện tại là một path. Sau đó em loop qua bốn directions, tính new row và new column. Nếu new position nằm trong bounds và giá trị tại new position lớn hơn giá trị hiện tại, em recursive call DFS cho new position và update result bằng max của result và một cộng với kết quả recursive call. Cuối cùng em gán memo tại vị trí hiện tại bằng result và return.

Ở function chính, em sẽ loop qua tất cả các ô, gọi DFS cho mỗi ô, và track max result. Return max đó.

**Interviewer**: Em có nghĩ đến edge cases nào không?

**Candidate**: Dạ có ạ. Matrix rỗng thì return zero. Matrix chỉ có một ô thì return một. Matrix với tất cả các giá trị giống nhau thì mỗi ô là một path riêng nên return một. Matrix với negative numbers thì không ảnh hưởng logic vì em chỉ compare values. À còn một case là matrix rất dài một chiều, như là một row hoặc một column, thì vẫn work bình thường vì em iterate qua mọi ô.

**Interviewer**: Perfect. Anh hài lòng với phần này rồi. Mình move on sang câu tiếp nhé.

---

## Phần 1.2: JavaScript Coding - Implement Promise.all with Concurrency Limit

**Interviewer**: Câu tiếp theo về JavaScript nâng cao nhé. Em đã dùng Promise.all chưa?

**Candidate**: Dạ rồi ạ, Promise.all nhận vào một array of promises và return một promise mà resolve khi tất cả promises trong array đều resolve, hoặc reject ngay khi có bất kỳ promise nào reject.

**Interviewer**: Đúng. Bây giờ anh muốn em implement một version của Promise.all nhưng có thêm concurrency limit. Nghĩa là em có một array of functions, mỗi function return một promise, và em muốn execute chúng nhưng tại bất kỳ thời điểm nào cũng chỉ có tối đa N promises đang pending. Em hiểu yêu cầu không?

**Candidate**: Dạ em hiểu. Ví dụ nếu em có mười functions và limit là ba, thì ban đầu em execute ba functions đầu tiên. Khi một trong ba cái đó resolve, em mới execute function thứ tư, và cứ tiếp tục như vậy. Tại mọi thời điểm không quá ba promises đang chạy. Kết quả cuối cùng vẫn là một array chứa results theo đúng thứ tự của input.

**Interviewer**: Chính xác. Em tiếp cận như thế nào?

**Candidate**: Dạ, em nghĩ đến việc maintain một counter để track số promises đang chạy. Em sẽ có một index pointer để biết function tiếp theo cần execute là gì. Em cũng cần một results array để store kết quả theo đúng thứ tự.

Cách làm là em sẽ tạo một function helper, gọi là executeNext chẳng hạn. Function này sẽ check nếu còn functions chưa execute và số đang chạy chưa đạt limit, thì nó sẽ lấy function tiếp theo, execute nó, increment counter. Khi promise đó settle, decrement counter, store result vào đúng vị trí, và gọi lại executeNext để có thể start task mới.

Ban đầu em sẽ kick off bằng cách gọi executeNext limit lần, hoặc ít hơn nếu số functions ít hơn limit.

**Interviewer**: Làm sao em handle việc result phải theo đúng thứ tự?

**Candidate**: Dạ, khi em lấy một function ra để execute, em capture index hiện tại của nó. Khi promise resolve, em gán result vào results array tại đúng index đó. Như vậy dù các promises resolve theo thứ tự nào, results array vẫn đúng thứ tự.

**Interviewer**: Còn error handling thì sao? Nếu một promise reject thì behavior như thế nào?

**Candidate**: Dạ, em có hai options. Một là giống Promise.all gốc, reject ngay lập tức khi có bất kỳ promise nào reject. Hai là giống Promise.allSettled, đợi tất cả hoàn thành rồi trả về array với status của từng promise. Anh muốn em implement behavior nào ạ?

**Interviewer**: Implement giống Promise.all đi, reject immediately.

**Candidate**: Dạ vâng. Vậy em sẽ wrap toàn bộ trong một new Promise. Khi có bất kỳ promise nào reject, em gọi reject của outer promise và có thể set một flag để ngăn việc start new tasks.

Để em walk through chi tiết hơn. Em tạo function promiseAllWithLimit nhận vào functions array và limit number. Em return một new Promise với resolve và reject. Bên trong, em declare results là empty array với length bằng functions length. Em có activeCount bằng zero, nextIndex bằng zero, và một flag hasRejected bằng false.

Em define executeNext function. Trong đó, while activeCount nhỏ hơn limit và nextIndex nhỏ hơn functions length và chưa rejected, em lấy currentIndex bằng nextIndex, increment nextIndex, increment activeCount. Rồi em gọi function tại currentIndex và chain then và catch. Trong then, em gán result vào results tại currentIndex, decrement activeCount. Nếu nextIndex bằng functions length và activeCount bằng zero, nghĩa là done, em gọi resolve với results. Không thì em gọi executeNext tiếp. Trong catch, nếu chưa rejected thì set hasRejected true và gọi reject với error.

Cuối cùng em gọi executeNext một lần để kick off.

**Interviewer**: Có vấn đề gì với logic em vừa describe không?

**Candidate**: Hmm để em review lại... À, em thấy một issue. Khi em gọi executeNext trong while loop, em start multiple promises. Nhưng mỗi promise khi resolve sẽ gọi executeNext lại, và executeNext sẽ tiếp tục start thêm promises nếu có slot. Cái này đúng behavior.

Nhưng wait, em đang gọi executeNext ban đầu chỉ một lần, và trong while loop em start tối đa limit promises. Hmm thực ra em cần xem lại. Nếu em có executeNext với while loop, thì gọi một lần sẽ start tối đa limit tasks. Rồi khi mỗi task complete, nó gọi executeNext lại để start task mới. Cái này có vẻ đúng.

À nhưng có một edge case. Nếu functions array rỗng thì nextIndex bằng functions length bằng zero, while loop không execute, và em không bao giờ resolve. Em cần handle case này ở đầu, check nếu functions length bằng zero thì resolve với empty array luôn.

**Interviewer**: Good catch. Còn gì nữa không?

**Candidate**: Để em nghĩ... Nếu limit lớn hơn functions length thì sao? Ví dụ có ba functions và limit là năm. While loop sẽ chỉ iterate ba lần vì nextIndex reach functions length. Đúng behavior.

Còn nếu limit bằng zero hoặc negative thì sẽ có vấn đề vì while condition activeCount nhỏ hơn limit sẽ không bao giờ true. Em nên validate limit ở đầu function, throw error hoặc default limit to one.

Một case nữa là nếu functions chứa non-function elements thì khi gọi sẽ throw. Em có thể wrap trong try catch hoặc để nó propagate tự nhiên như Promise.all behavior.

**Interviewer**: Rất tốt. Giả sử một function trong array đó không return promise mà return một giá trị bình thường thì sao?

**Candidate**: Dạ, nếu function return một giá trị bình thường, ví dụ number hoặc string, thì khi em gọi then trên nó sẽ không work vì non-promise không có then method. À không, actually trong JavaScript nếu em gọi Promise.resolve trên một non-promise value, nó sẽ wrap thành promise. Nhưng trong code em đang assume function return promise. Để safe hơn, em có thể wrap result của function call trong Promise.resolve. Như vậy dù function return promise hay raw value, nó đều được handle đúng.

**Interviewer**: Nếu function return thenable thì sao?

**Candidate**: Dạ, thenable là object có then method nhưng không phải native Promise. Promise.resolve sẽ handle thenable correctly, nó sẽ call then method và adopt state từ thenable. Nên wrap trong Promise.resolve là safe choice.

**Interviewer**: Ok, em giải thích về event loop và tại sao code này work được không? Các promises execute concurrently như thế nào?

**Candidate**: Dạ, trong JavaScript, code run trong main thread và là single-threaded. Khi em gọi một async function hoặc create một promise, phần synchronous code chạy ngay, còn phần async như network request hay setTimeout được delegate cho browser hoặc Node runtime. Khi async operation complete, callback hoặc promise resolution được đưa vào task queue hoặc microtask queue.

Cụ thể với promises, khi một promise resolve, then callback được đưa vào microtask queue. Event loop sẽ process hết microtasks trước khi handle task queue items.

Trong code em, khi em start multiple promises, ví dụ ba cái, cả ba execute async operations của chúng concurrently, không phải sequentially. Browser có thể fire ba network requests cùng lúc chẳng hạn. Khi mỗi cái complete, then callback vào microtask queue và được process.

Nên "concurrency" ở đây không phải parallel execution như multi-threading, mà là overlapping I/O operations. JavaScript vẫn single-threaded nhưng I/O operations được handled bởi runtime một cách concurrent.

**Interviewer**: Nếu các functions đó là CPU-intensive, ví dụ heavy computation, thì concurrency limit có giúp gì không?

**Candidate**: Dạ, nếu functions là synchronous CPU-intensive tasks, thì không. Vì JavaScript single-threaded, mỗi task sẽ block main thread cho đến khi xong. Concurrency limit trong trường hợp này chỉ control thứ tự start, không tạo ra parallel execution thực sự.

Để có parallel execution cho CPU tasks, em cần dùng Web Workers trong browser hoặc Worker Threads trong Node. Mỗi worker có thread riêng và có thể run parallel. Hoặc nếu dùng Node, có thể dùng child_process để spawn processes.

**Interviewer**: Excellent. Anh impressed với depth của em. Move on nhé.

---

## Phần 1.3: UI Coding - Implement Virtualized List

**Interviewer**: Câu cuối phần coding, về UI component nhé. Em biết virtualized list hay windowing là gì không?

**Candidate**: Dạ có ạ. Virtualized list là technique để render một list rất dài mà chỉ render các items hiện đang visible trong viewport, thay vì render toàn bộ list. Điều này giúp improve performance đáng kể khi list có hàng nghìn hoặc hàng triệu items. Các items ngoài viewport được "recycled" hoặc không render.

**Interviewer**: Đúng. Bây giờ em implement một virtualized list component với React. Giả sử mỗi item có fixed height. Em được cho total number of items, item height, và container height. Render sao cho efficient.

**Candidate**: Dạ vâng. Để em break down approach nhé anh.

Đầu tiên em cần track scroll position của container. Em sẽ dùng useRef cho container element và attach một onScroll handler.

Dựa vào scroll position, em tính được item nào đang visible. Với fixed height items, nếu scroll position là scrollTop và item height là itemHeight, thì first visible item index là scrollTop chia itemHeight, rounded down. Số items visible là container height chia item height, rounded up, cộng thêm một hai buffer items phía trên và dưới để tránh flickering khi scroll nhanh.

Em chỉ render các items trong range đó. Để maintain scroll behavior chính xác, em cần một wrapper div có total height bằng total items nhân item height. Các rendered items được positioned absolute hoặc dùng transform translateY để đặt đúng vị trí visual.

**Interviewer**: Em nói về buffer items, giải thích thêm được không?

**Candidate**: Dạ, buffer hay overscan items là việc render thêm một vài items phía trên và dưới visible range. Ví dụ nếu items từ index mười đến hai mươi đang visible, em sẽ render từ index tám đến hai mươi hai chẳng hạn, với overscan là hai.

Lý do là khi user scroll, có một khoảng delay nhỏ trước khi React re-render với new visible range. Trong khoảng đó, nếu không có buffer items, user sẽ thấy blank space xuất hiện. Với buffer, những blank space này được fill bởi pre-rendered items, làm scroll mượt hơn.

**Interviewer**: Làm sao em position các items?

**Candidate**: Dạ có hai approaches chính.

Approach một là dùng absolute positioning. Container có position relative. Mỗi item có position absolute với top bằng index nhân itemHeight. CSS transform cũng work tương tự, dùng translateY.

Approach hai là dùng padding. Wrapper có padding-top bằng startIndex nhân itemHeight và height của inner content tương ứng. Items render bình thường theo flow. Nhưng cách này phức tạp hơn khi tính toán.

Em prefer dùng absolute positioning hoặc transform vì dễ reason about và perform tốt. Transform có lợi thế là không trigger layout, chỉ composite, nên có thể smooth hơn.

**Interviewer**: Trong React, làm sao em trigger re-render khi scroll mà không bị performance issue?

**Candidate**: Dạ đây là key point. Mỗi scroll event fire rất nhiều lần, có thể hàng trăm lần per second khi user scroll nhanh. Nếu mỗi event trigger setState và re-render, sẽ có performance issue.

Em có vài strategies. Một là throttle scroll handler, chỉ handle một lần mỗi mười sáu milliseconds chẳng hạn, tương đương sáu mươi fps. Có thể dùng requestAnimationFrame để align với browser paint cycle.

Hai là minimize state updates. Thay vì store scrollTop trong state, em có thể chỉ store startIndex và endIndex. Chỉ khi index thay đổi thì mới trigger re-render.

Ba là dùng useRef để store scroll position và chỉ setState khi visible range actually change. Check trong handler, nếu new start index khác old thì mới update state.

Bốn là dùng CSS containment với contain property để hint browser về painting boundaries.

**Interviewer**: Em có thể elaborate về requestAnimationFrame approach không?

**Candidate**: Dạ được ạ. requestAnimationFrame là browser API mà schedule một function chạy trước next repaint, thường là sáu mươi lần per second khớp với monitor refresh rate.

Trong scroll handler, thay vì process ngay, em schedule với RAF. Em có thể giữ một flag để biết có pending RAF hay chưa. Nếu chưa có, em request một RAF và set flag. Trong RAF callback, em process scroll event và clear flag. Như vậy dù scroll event fire nhiều lần, em chỉ process một lần per frame.

Code pseudo như thế này: trong scroll handler, em check nếu ticking flag false, em set ticking true, rồi call requestAnimationFrame với một function. Trong function đó, em update state based on current scrollTop từ ref, rồi set ticking false.

**Interviewer**: Nếu item height không fixed mà dynamic thì approach sẽ khác như thế nào?

**Candidate**: Ồ đây là significantly more complex. Với variable height items, em không thể simply calculate position bằng index nhân height.

Approach thường dùng là maintain một cache của item heights. Initial render có thể estimate heights dựa trên average. Khi item actually render, em measure real height và update cache. Có một ResizeObserver hoặc ref callback để detect size changes.

Với heights cache, em build một prefix sum array để quickly lookup position of any index. Position của item i là sum của heights từ zero đến i minus one.

Tìm first visible item becomes a binary search trên prefix sum array thay vì simple division.

Popular libraries như react-window và react-virtualized handle này với APIs như VariableSizeList. Họ yêu cầu một function trả về height estimate cho mỗi index, và có mechanism để update khi actual height known.

**Interviewer**: Nếu items có variable height và user scroll rất nhanh, jump từ đầu list đến cuối, thì có vấn đề gì không?

**Candidate**: Dạ có ạ. Vì heights chưa được measured cho items chưa render, em chỉ có estimates. Jump scroll có thể cause incorrect position calculation. User có thể thấy list "jump" hoặc scroll position không accurate.

Một mitigation là có reasonable estimates và accept small inaccuracies. Khi user settles, heights get measured và list self-corrects.

Approach khác là pre-measure items off-screen, nhưng expensive.

Có technique gọi là "just-in-time measurement" kết hợp với scroll anchoring. Browser có scroll anchoring feature để prevent content shifts, và em có thể leverage đó.

Honestly với variable heights và extreme scroll behaviors, nên dùng battle-tested library như react-virtuoso hoặc TanStack Virtual thay vì build from scratch.

**Interviewer**: Great discussion. Cho anh nghe em giải thích code structure của fixed height implementation.

**Candidate**: Dạ vâng. Component em đặt tên là VirtualizedList, nhận props là items array, itemHeight number, containerHeight number.

Trong component, em dùng useRef với tên containerRef để ref đến outer div. Em dùng useState với scrollTop, initialize zero.

Em define handleScroll function, trong đó em get scrollTop từ event target và update state, có thể wrap trong RAF như đã discuss.

Với scrollTop state, em compute startIndex bằng Math floor của scrollTop chia itemHeight. Em compute endIndex bằng startIndex cộng Math ceil của containerHeight chia itemHeight cộng thêm overscan, ví dụ cộng thêm hai. Em clamp endIndex để không exceed items length.

Em slice items từ startIndex đến endIndex để get visible items.

Trong render, outer div có ref là containerRef, style overflow auto và height bằng containerHeight. onScroll handler là handleScroll.

Bên trong là inner div có height bằng items length nhân itemHeight và position relative. Đây là "spacer" để create scrollable area.

Rồi em map visible items, mỗi item render trong một div có position absolute, top bằng actual index nhân itemHeight, và height bằng itemHeight. Actual index là startIndex cộng với index trong visible array.

**Interviewer**: Perfect. Em đã demonstrate understanding sâu. Anh sẽ stop phần coding ở đây.

---

## Final Code - Round 1

### Bài 1: Longest Increasing Path in Matrix

```javascript
/**
 * Tìm độ dài đường đi tăng dần dài nhất trong matrix
 *
 * Approach: DFS với Memoization
 * - Từ mỗi ô, explore 4 hướng và chỉ đi tiếp nếu ô kế tiếp có giá trị lớn hơn
 * - Cache kết quả của mỗi ô để tránh tính lại
 * - Kết quả của mỗi ô = 1 + max(kết quả của các neighbor hợp lệ)
 *
 * Time Complexity: O(m * n) - mỗi ô chỉ được tính một lần
 * Space Complexity: O(m * n) - cho memo matrix + call stack trong worst case
 */
function longestIncreasingPath(matrix) {
  // Edge case: matrix rỗng
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    return 0;
  }

  const m = matrix.length; // số hàng
  const n = matrix[0].length; // số cột

  // Memo matrix để cache kết quả đã tính
  // -1 nghĩa là chưa tính, số dương là kết quả
  const memo = Array(m)
    .fill(null)
    .map(() => Array(n).fill(-1));

  // 4 hướng di chuyển: lên, xuống, trái, phải
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  /**
   * DFS helper function
   * @param {number} row - hàng hiện tại
   * @param {number} col - cột hiện tại
   * @returns {number} - độ dài path dài nhất bắt đầu từ ô này
   */
  function dfs(row, col) {
    // Nếu đã tính rồi thì return cached result
    if (memo[row][col] !== -1) {
      return memo[row][col];
    }

    // Ít nhất có path length 1 (chính ô này)
    let maxLength = 1;

    // Explore 4 hướng
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      // Check bounds và check giá trị phải lớn hơn
      if (
        newRow >= 0 &&
        newRow < m &&
        newCol >= 0 &&
        newCol < n &&
        matrix[newRow][newCol] > matrix[row][col]
      ) {
        // Recursive call và update max
        maxLength = Math.max(maxLength, 1 + dfs(newRow, newCol));
      }
    }

    // Cache kết quả trước khi return
    memo[row][col] = maxLength;
    return maxLength;
  }

  // Tìm max path length starting from mỗi ô
  let result = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result = Math.max(result, dfs(i, j));
    }
  }

  return result;
}

// Test với example
const matrix = [
  [9, 9, 4],
  [6, 6, 8],
  [2, 1, 1],
];
console.log(longestIncreasingPath(matrix)); // Output: 4 (path: 1→2→6→9)
```

### Bài 2: Promise.all with Concurrency Limit

```javascript
/**
 * Promise.all với giới hạn số lượng promises chạy đồng thời
 *
 * Approach:
 * - Maintain một counter cho số promises đang active
 * - Khi có slot trống và còn tasks, start task mới
 * - Khi task complete, giảm counter và có thể start task tiếp theo
 * - Results được lưu theo đúng thứ tự index
 *
 * @param {Function[]} functions - array of functions, mỗi function return promise
 * @param {number} limit - số lượng promises tối đa chạy đồng thời
 * @returns {Promise<any[]>} - promise resolve với array kết quả theo thứ tự
 */
function promiseAllWithLimit(functions, limit) {
  return new Promise((resolve, reject) => {
    // Edge case: không có functions
    if (functions.length === 0) {
      resolve([]);
      return;
    }

    // Validate limit
    if (!limit || limit <= 0) {
      limit = 1;
    }

    // Array để store results theo đúng thứ tự
    const results = new Array(functions.length);

    // Counter cho số promises đang chạy
    let activeCount = 0;

    // Index của function tiếp theo cần execute
    let nextIndex = 0;

    // Số tasks đã hoàn thành (dùng để biết khi nào done)
    let completedCount = 0;

    // Flag để ngăn start new tasks sau khi có rejection
    let hasRejected = false;

    /**
     * Execute next available task nếu có slot
     */
    function executeNext() {
      // Nếu đã rejected thì không làm gì
      if (hasRejected) return;

      // Start tasks while có slot và còn tasks
      while (
        activeCount < limit &&
        nextIndex < functions.length &&
        !hasRejected
      ) {
        // Capture index hiện tại để closure giữ đúng
        const currentIndex = nextIndex;
        nextIndex++;
        activeCount++;

        // Wrap trong Promise.resolve để handle cả promise và non-promise return
        Promise.resolve()
          .then(() => functions[currentIndex]())
          .then((result) => {
            // Nếu đã rejected thì ignore
            if (hasRejected) return;

            // Store result vào đúng vị trí
            results[currentIndex] = result;
            activeCount--;
            completedCount++;

            // Nếu tất cả done thì resolve
            if (completedCount === functions.length) {
              resolve(results);
            } else {
              // Còn tasks thì tiếp tục execute
              executeNext();
            }
          })
          .catch((error) => {
            // Reject immediately on first error
            if (!hasRejected) {
              hasRejected = true;
              reject(error);
            }
          });
      }
    }

    // Kick off execution
    executeNext();
  });
}

// Utility function để test
function delay(ms, value) {
  return () => new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Test
const tasks = [
  delay(100, "A"),
  delay(50, "B"),
  delay(75, "C"),
  delay(25, "D"),
  delay(60, "E"),
];

promiseAllWithLimit(tasks, 2)
  .then((results) => console.log(results)) // ['A', 'B', 'C', 'D', 'E']
  .catch((err) => console.error(err));
```

### Bài 3: Virtualized List Component

```jsx
/**
 * Virtualized List Component với Fixed Height Items
 *
 * Approach:
 * - Chỉ render items visible trong viewport
 * - Track scroll position để tính visible range
 * - Dùng absolute positioning để place items đúng vị trí
 * - Buffer items (overscan) để smooth scrolling
 *
 * Time Complexity: O(visible items) per render - không phụ thuộc total items
 * Space Complexity: O(visible items) trong DOM
 */
import React, { useState, useRef, useCallback, useMemo } from "react";

function VirtualizedList({
  items, // Array of items to render
  itemHeight, // Fixed height của mỗi item (pixels)
  containerHeight, // Height của visible container (pixels)
  overscan = 3, // Số items buffer phía trên và dưới
  renderItem, // Function(item, index) => ReactNode
}) {
  // Ref cho container để access scrollTop
  const containerRef = useRef(null);

  // State cho scroll position
  // Dùng scrollTop thay vì index để có granular control
  const [scrollTop, setScrollTop] = useState(0);

  // RAF ticking flag để throttle scroll updates
  const tickingRef = useRef(false);

  /**
   * Scroll handler với requestAnimationFrame throttling
   * Đảm bảo chỉ update state một lần per frame
   */
  const handleScroll = useCallback((e) => {
    // Capture scrollTop immediately (event có thể bị pooled trong React)
    const currentScrollTop = e.target.scrollTop;

    if (!tickingRef.current) {
      tickingRef.current = true;

      requestAnimationFrame(() => {
        setScrollTop(currentScrollTop);
        tickingRef.current = false;
      });
    }
  }, []);

  /**
   * Tính toán visible range
   * Memoize để tránh recalculate khi không cần thiết
   */
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    // First visible item (có thể partially visible)
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

    // Last visible item
    // Số items fit trong container + buffer + 1 (partial visibility)
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.floor(scrollTop / itemHeight) + visibleCount + overscan
    );

    // Slice items cho visible range
    const visible = items.slice(start, end + 1).map((item, idx) => ({
      item,
      index: start + idx, // Actual index trong original array
    }));

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: visible,
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  // Total scrollable height
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
    >
      {/* Inner container với full height để create scroll */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Render only visible items */}
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: itemHeight,
              // Dùng transform thay vì top để trigger GPU compositing
              transform: `translateY(${index * itemHeight}px)`,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Example usage:
function App() {
  // Generate 10000 items
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }));

  return (
    <VirtualizedList
      items={items}
      itemHeight={50}
      containerHeight={500}
      overscan={5}
      renderItem={(item, index) => (
        <div
          style={{
            padding: "10px",
            borderBottom: "1px solid #eee",
            background: index % 2 ? "#f9f9f9" : "white",
          }}
        >
          {item.text}
        </div>
      )}
    />
  );
}

export default VirtualizedList;
```

---

# ROUND 2: FRONTEND SYSTEM DESIGN (2 tiếng)

## Đề bài: Design Google Docs - Real-time Collaborative Document Editor

**Interviewer**: Chào em, anh là Hùng, anh sẽ interview em phần system design. Bài hôm nay là em sẽ design frontend cho một collaborative document editor giống Google Docs. Em có mười phút để clarify requirements, rồi mình đi vào design nhé.

**Candidate**: Dạ vâng anh. Để em clarify một số điểm.

Về functional requirements, em assume document editor này support basic text editing như typing, delete, format text với bold italic underline. Users có thể see cursor và selections của other users realtime. Changes được sync across all users immediately. Có presence indicators showing who's online. Document auto-save. Anh confirm giúp em những features này đúng không ạ?

**Interviewer**: Đúng, em thêm comment và suggestion feature vào nữa nhé.

**Candidate**: Dạ noted. Về non-functional requirements, em assume cần low latency cho realtime sync, target dưới một trăm milliseconds cho local feel. System cần handle concurrent edits từ nhiều users mà không conflict. Offline support để users có thể edit khi mất mạng và sync khi reconnect. Cần scalable để support nhiều users per document, em assume có thể lên tới một trăm concurrent users per doc. Performance phải smooth, không lag khi type. Anh có thêm constraint nào không ạ?

**Interviewer**: Good. Em cũng consider mobile support và accessibility nhé.

**Candidate**: Dạ vâng. Để em vẽ high-level architecture trước.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HIGH-LEVEL ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CLIENT (Browser/Mobile)                       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐      │   │
│  │   │  React App  │    │   CRDT       │    │   IndexedDB       │      │   │
│  │   │  + Editor   │◄───┤   Engine     │◄───┤   (Offline Cache) │      │   │
│  │   │  Component  │    │   (Yjs)      │    │                   │      │   │
│  │   └──────┬──────┘    └──────┬───────┘    └───────────────────┘      │   │
│  │          │                  │                                        │   │
│  │          ▼                  ▼                                        │   │
│  │   ┌──────────────────────────────────────────────────────────┐      │   │
│  │   │              State Management (Zustand)                   │      │   │
│  │   │  - UI State    - Document State    - Presence State       │      │   │
│  │   └──────────────────────────┬───────────────────────────────┘      │   │
│  │                              │                                       │   │
│  │   ┌──────────────────────────▼───────────────────────────────┐      │   │
│  │   │           WebSocket Manager + Service Worker              │      │   │
│  │   │  - Connection handling    - Message queuing               │      │   │
│  │   │  - Reconnection logic     - Background sync               │      │   │
│  │   └──────────────────────────┬───────────────────────────────┘      │   │
│  │                              │                                       │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 │                                           │
│                                 │ WebSocket (ws://)                         │
│                                 │ + HTTP/2 (fallback)                       │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          BACKEND SERVICES                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │   │
│  │   │   API        │   │   WebSocket  │   │   Document           │    │   │
│  │   │   Gateway    │   │   Server     │   │   Service            │    │   │
│  │   │   (REST)     │   │   Cluster    │   │   (CRDT Sync)        │    │   │
│  │   └──────────────┘   └──────────────┘   └──────────────────────┘    │   │
│  │          │                  │                    │                   │   │
│  │          ▼                  ▼                    ▼                   │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │                    Data Layer                               │    │   │
│  │   │   ┌────────────┐  ┌────────────┐  ┌──────────────────┐    │    │   │
│  │   │   │  Redis     │  │ PostgreSQL │  │  Object Storage  │    │    │   │
│  │   │   │  (Pub/Sub) │  │ (Metadata) │  │  (Doc Snapshots) │    │    │   │
│  │   │   └────────────┘  └────────────┘  └──────────────────┘    │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Như anh thấy, em chia system thành hai phần chính là client side và backend services. Ở client, core của collaborative editing sẽ là CRDT engine, em chọn Yjs là một library implement CRDT phổ biến. React app interact với CRDT engine để render và capture edits. Offline data được persist vào IndexedDB.

**Interviewer**: Em chọn CRDT, tại sao không phải Operational Transformation như Google Docs original?

**Candidate**: Dạ đây là một key architectural decision. OT và CRDT đều giải quyết concurrent editing conflict nhưng theo cách khác nhau.

OT transform operations dựa trên history, đòi hỏi central server maintain canonical order. Implementation complex và khó scale vì server phải process mọi operation theo sequence.

CRDT thiết kế data structure sao cho concurrent operations converge automatically mà không cần coordination. Mỗi client có thể apply operations locally ngay lập tức, và sync eventually. CRDT thân thiện với offline-first vì không cần server để resolve conflicts.

Trade-off là CRDT có thể có memory overhead cao hơn vì maintain extra metadata. Nhưng với modern CRDT implementations như Yjs, overhead này acceptable.

Với requirements của mình là offline support và low latency, CRDT phù hợp hơn.

**Interviewer**: Ok thú vị. Em giải thích chi tiết hơn về component structure trong React app đi.

**Candidate**: Dạ vâng, để em vẽ component tree.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT TREE STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            ┌──────────────────┐                             │
│                            │       App        │                             │
│                            │  - Auth check    │                             │
│                            │  - Route setup   │                             │
│                            └────────┬─────────┘                             │
│                                     │                                        │
│                    ┌────────────────┼────────────────┐                      │
│                    │                │                │                      │
│                    ▼                ▼                ▼                      │
│         ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐            │
│         │   Toolbar    │  │  DocumentView   │  │  Sidebar     │            │
│         │  - Format    │  │  - Editor core  │  │  - Comments  │            │
│         │  - Actions   │  │  - Cursors      │  │  - Outline   │            │
│         └──────────────┘  └────────┬────────┘  │  - Share     │            │
│                                    │           └──────────────┘            │
│                    ┌───────────────┼───────────────┐                       │
│                    │               │               │                       │
│                    ▼               ▼               ▼                       │
│         ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐          │
│         │   Editor     │  │  Cursors     │  │  Selection       │          │
│         │   Core       │  │  Layer       │  │  Overlay         │          │
│         │              │  │              │  │                  │          │
│         │  - Yjs       │  │  - Remote    │  │  - Multi-user    │          │
│         │    binding   │  │    cursors   │  │    selections    │          │
│         │  - Key       │  │  - Caret     │  │  - Color coded   │          │
│         │    handlers  │  │    position  │  │                  │          │
│         │  - IME       │  │  - User      │  │                  │          │
│         │    support   │  │    labels    │  │                  │          │
│         └──────┬───────┘  └──────────────┘  └──────────────────┘          │
│                │                                                           │
│      ┌─────────┼─────────┬─────────────────┐                              │
│      │         │         │                 │                              │
│      ▼         ▼         ▼                 ▼                              │
│  ┌───────┐ ┌───────┐ ┌────────┐    ┌─────────────┐                       │
│  │ Block │ │ Block │ │ Block  │    │ VirtualList │                       │
│  │ Para  │ │ Head  │ │ List   │    │ (for large  │                       │
│  │       │ │       │ │        │    │  documents) │                       │
│  └───┬───┘ └───────┘ └────────┘    └─────────────┘                       │
│      │                                                                    │
│      ▼                                                                    │
│  ┌──────────────────────────────────────────┐                            │
│  │              Leaf Nodes                   │                            │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │                            │
│  │  │  Text   │ │  Link   │ │  Inline │    │                            │
│  │  │  Span   │ │         │ │  Image  │    │                            │
│  │  └─────────┘ └─────────┘ └─────────┘    │                            │
│  └──────────────────────────────────────────┘                            │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

Em giải thích từng component nhé. App là root, handle authentication và routing. DocumentView là container chính cho editor, nó compose ba main parts.

Toolbar ở trên cho formatting actions. Editor Core là main editing area, nó wrap một contenteditable div hoặc custom rendering. Sidebar bên phải cho comments và outline.

Editor Core quan trọng nhất. Nó integrate với Yjs thông qua bindings. Có riêng Cursors Layer để render remote users' cursors. Selection Overlay để show selections của other users với màu khác nhau.

Document content được render thành Blocks. Mỗi block type có component riêng như paragraph, heading, list. Blocks chứa Leaf nodes là text spans, links, inline elements.

**Interviewer**: Với document rất dài, performance sẽ như thế nào?

**Candidate**: Dạ good question. Với long documents, render toàn bộ sẽ slow và memory intensive. Em áp dụng virtualization giống câu coding lúc nãy.

Em chia document thành blocks và chỉ render blocks visible trong viewport. Blocks ngoài viewport được unmount hoặc render placeholder. Khi user scroll, em dynamically render blocks mới.

Challenge với virtualized text editor là handle cursor navigation và selection across unmounted blocks. Em cần maintain một abstract representation của toàn bộ document trong memory nhưng chỉ render DOM cho visible portion.

Yjs already efficient trong memory vì nó store operations not full text. Nhưng DOM rendering là bottleneck, nên virtualization critical.

**Interviewer**: Làm sao em handle selection span across multiple blocks khi một số blocks không rendered?

**Candidate**: Đây là tricky. Em có vài approaches.

Một là luôn render một buffer quanh selection. Khi selection extend, em expand rendered range accordingly.

Hai là maintain selection state separately từ rendered state. Selection highlight có thể render như overlay independent of actual blocks.

Ba là implement custom selection drawing bằng canvas overlay thay vì native browser selection. Mình control hoàn toàn và không depend on DOM.

Thực tế, em sẽ combine approaches. For normal scrolling, virtualize blocks. Khi selection starts, expand render range to include selection. Nếu selection quá large, fallback to custom overlay.

**Interviewer**: Ok, em nói về data flow và state management đi.

**Candidate**: Dạ để em vẽ data flow diagram.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         LOCAL EDITING FLOW                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   User Types    ──►  Input Handler  ──►  Yjs Document  ──►  React    │   │
│  │   "Hello"           (keydown/input)      (apply delta)      State    │   │
│  │                           │                    │              │       │   │
│  │                           ▼                    ▼              ▼       │   │
│  │                     ┌──────────┐         ┌─────────┐    ┌─────────┐  │   │
│  │                     │ Debounce │         │  CRDT   │    │  DOM    │  │   │
│  │                     │ (16ms)   │         │  Merge  │    │  Patch  │  │   │
│  │                     └──────────┘         └─────────┘    └─────────┘  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                         SYNC FLOW (OUTBOUND)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   Yjs Doc    ──►   Awareness    ──►   WebSocket    ──►   Server     │   │
│  │   Update           Protocol          Manager             Broadcast   │   │
│  │      │                │                 │                    │       │   │
│  │      ▼                ▼                 ▼                    ▼       │   │
│  │  ┌────────┐     ┌──────────┐     ┌──────────┐        ┌──────────┐  │   │
│  │  │ Binary │     │ Cursor   │     │ Queue +  │        │ Pub/Sub  │  │   │
│  │  │ Encode │     │ Position │     │ Retry    │        │ (Redis)  │  │   │
│  │  └────────┘     └──────────┘     └──────────┘        └──────────┘  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                         SYNC FLOW (INBOUND)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   WebSocket   ──►   Message    ──►   Yjs Doc    ──►   React State   │   │
│  │   Message           Parser          (merge)          (re-render)    │   │
│  │       │                │               │                  │          │   │
│  │       ▼                ▼               ▼                  ▼          │   │
│  │  ┌─────────┐    ┌──────────┐    ┌──────────┐      ┌───────────┐    │   │
│  │  │ Binary  │    │ Validate │    │ CRDT     │      │ Selective │    │   │
│  │  │ Decode  │    │ + Auth   │    │ Resolve  │      │ Re-render │    │   │
│  │  └─────────┘    └──────────┘    └──────────┘      └───────────┘    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                         PRESENCE FLOW                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐   │   │
│  │  │ Cursor   │ ──► │ Throttle │ ──► │ Broadcast│ ──► │ Render   │   │   │
│  │  │ Move     │     │ (50ms)   │     │ Presence │     │ Cursors  │   │   │
│  │  └──────────┘     └──────────┘     └──────────┘     └──────────┘   │   │
│  │                                                                       │   │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                     │   │
│  │  │ User     │ ──► │ Heartbeat│ ──► │ Presence │                     │   │
│  │  │ Activity │     │ (30s)    │     │ Timeout  │                     │   │
│  │  └──────────┘     └──────────┘     └──────────┘                     │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Em explain data flow nhé. Khi user type, input event được captured, em convert thành Yjs operation và apply vào local document. Yjs trigger update event, mình update React state để re-render.

Đồng thời, Yjs update được serialize và queue để send qua WebSocket. Server nhận và broadcast cho other clients. Server không process hay transform, nó relay only vì CRDT handle conflicts client-side.

Incoming messages được decoded, validated, và merge vào local Yjs doc. Yjs automatic resolves conflicts và triggers re-render.

Presence là separate stream. Cursor positions và user activity được throttle và broadcast separately. Em không send cursor position mỗi pixel move, mà throttle ở khoảng năm mươi milliseconds.

**Interviewer**: State management em chọn Zustand, tại sao không Redux hay Context?

**Candidate**: Dạ vài reasons.

Redux powerful nhưng boilerplate heavy cho realtime app. Actions, reducers, selectors cho every state change adds friction. Với fast-changing state như cursor positions, Redux middleware overhead noticeable.

Context API có re-render issue. Any context change re-renders all consumers. Với editor có nhiều components subscribe different parts of state, Context cause unnecessary re-renders.

Zustand là lightweight, minimal boilerplate. Nó allow selective subscriptions, components chỉ re-render khi subscribed slice changes. API đơn giản với hooks. Performance comparable to Redux without overhead.

Cho document state specifically, em không store raw document trong Zustand. Yjs already maintain document state. Zustand store derived UI state như selected block, sidebar visibility, và references to Yjs observables.

**Interviewer**: Làm sao em handle undo/redo với collaborative editing?

**Candidate**: Ồ đây là interesting challenge. Trong single-user editor, undo simply reverts last operation. Trong collaborative, multiple users interleave operations, naive undo breaks others' work.

Yjs có built-in UndoManager. Nó track operations by origin, means nó biết operation nào từ local user. Undo chỉ revert local user's operations, preserving others'.

Cách work là UndoManager maintain two stacks: undo và redo. Mỗi local operation được push to undo stack. Khi user undo, operation được reversed và push to redo stack.

Key insight là Yjs undo creates inverse operation, not time travel. So nếu user A type "Hello", user B type "World", user A undo, result là "World" not empty. User A's operation "Hello" là inverse removed, but B's "World" preserved.

**Interviewer**: Nếu user A và B cùng type vào một chỗ, kết quả resolve như thế nào?

**Candidate**: CRDT resolve concurrent insertions deterministically based on ordering rules. Yjs use client ID và logical clock để determine order.

Ví dụ both type at same position, final order depends on client ID comparison. Result consistent across all clients vì họ apply same rules.

User experience có thể slightly surprising, text họ type có thể shift position if another user's text gets inserted before. Nhưng no data loss, và eventual consistency guaranteed.

Để improve UX, em có thể show indicator khi concurrent edit happens nearby. Or briefly highlight text inserted by others.

**Interviewer**: Talk about offline support.

**Candidate**: Dạ offline là critical feature. Em design với IndexedDB và Service Worker.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OFFLINE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ONLINE MODE                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   Edit  ───►  Yjs Doc  ───►  IndexedDB   ───►  WebSocket  ───► Server│   │
│  │                              (persist)         (sync)                 │   │
│  │                                  │                                    │   │
│  │                                  ▼                                    │   │
│  │                           ┌────────────┐                             │   │
│  │                           │  Debounced │                             │   │
│  │                           │  Save      │                             │   │
│  │                           │  (1 sec)   │                             │   │
│  │                           └────────────┘                             │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              OFFLINE MODE                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   Edit  ───►  Yjs Doc  ───►  IndexedDB  ───►  Queue Ops             │   │
│  │                              (persist)        (pending)              │   │
│  │                                                   │                  │   │
│  │                              ┌────────────────────┘                  │   │
│  │                              ▼                                        │   │
│  │                      ┌──────────────┐                                │   │
│  │                      │ Service      │                                │   │
│  │                      │ Worker       │                                │   │
│  │                      │ (detect      │                                │   │
│  │                      │  reconnect)  │                                │   │
│  │                      └──────────────┘                                │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                           RECONNECTION FLOW                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   1. Detect Online                                                    │   │
│  │          │                                                            │   │
│  │          ▼                                                            │   │
│  │   2. Re-establish WebSocket                                          │   │
│  │          │                                                            │   │
│  │          ▼                                                            │   │
│  │   3. Sync State                                                       │   │
│  │      ┌────────────────────────────────────────┐                      │   │
│  │      │  Send local Yjs state vector           │                      │   │
│  │      │         │                              │                      │   │
│  │      │         ▼                              │                      │   │
│  │      │  Receive missing updates from server  │                      │   │
│  │      │         │                              │                      │   │
│  │      │         ▼                              │                      │   │
│  │      │  Merge + resolve conflicts (CRDT)      │                      │   │
│  │      │         │                              │                      │   │
│  │      │         ▼                              │                      │   │
│  │      │  Send local pending updates           │                      │   │
│  │      └────────────────────────────────────────┘                      │   │
│  │          │                                                            │   │
│  │          ▼                                                            │   │
│  │   4. Resume Real-time Sync                                           │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Khi online, edits persist to IndexedDB debounced, và sync via WebSocket. IndexedDB store full Yjs document state.

Khi offline detected, WebSocket fails, app continue accepting edits. All edits saved locally. Service Worker monitor network status.

Khi reconnect, em perform sync handshake. Client send state vector, which encodes what updates it has. Server compare và send missing updates. Client merge received updates, CRDT resolves any conflicts. Then client send its pending updates to server.

This bidirectional sync ensure eventual consistency regardless of how long offline.

**Interviewer**: Conflict scenario cụ thể: user offline edit paragraph A, user online delete paragraph A. Reconnect thì sao?

**Candidate**: Interesting scenario. Với CRDT text like Yjs, delete là soft-delete với tombstones. Text không actually disappear from data structure, nó được marked deleted.

Khi offline user sync, their edits to paragraph A được applied to tombstoned positions. Outcome depends on CRDT semantics.

In practice, offline user's edits likely resurrect deleted content partially. This can be confusing UX.

Em có vài approaches. One là detect such conflicts và show UI prompt "Content you edited was deleted by [user]. Keep your edits?" cho user decide.

Two là implement garbage collection with conflict detection. If local edits collide with deleted range, surface conflict resolution UI.

Three là accept CRDT resolution as-is. Deleted plus edit equals edit wins or delete wins based on CRDT rules. Yjs typically preserves insertions within deleted ranges.

Honestly no perfect answer here, depends on product requirements which behavior preferred.

**Interviewer**: Good analysis. Let's talk about performance optimization.

**Candidate**: Dạ performance critical cho editor feel responsive. Em address multiple areas.

Đầu tiên rendering performance. Em dùng React reconciliation optimization. Key props stable để tránh unnecessary unmount/remount. Memo blocks that don't change frequently. useMemo, useCallback cho expensive computations.

Editor input specifically, em avoid React render cycle cho every keystroke if possible. Update DOM directly, batch state updates. Yjs bindings often work outside React, only trigger re-render khi block structure changes, not every character.

Second, network optimization. Batch operations before sending. Compress Yjs binary updates. Use delta sync not full document. Rate limit presence updates.

Third, bundle optimization. Code split editor separately, nó large với Yjs và rendering logic. Lazy load sidebar components. Prefetch editor assets based on user navigation patterns.

Fourth, memory optimization. Virtualize long documents. Periodically GC tombstones from Yjs. IndexedDB cleanup old versions.

**Interviewer**: Numbers-wise, em target những metrics nào?

**Candidate**: Dạ em align với RAIL model.

Response: Keystroke to visual feedback dưới một trăm milliseconds. Actually cho typing, target dưới mười sáu milliseconds để feel instant.

Animation: Cursor movement và selection smooth at sáu mươi fps.

Idle: Background sync và save không block main thread.

Load: Initial document visible dưới hai seconds for typical document. Critical path prioritize: load editor shell, render visible content, lazy load rest.

Specific metrics em track: Time to Interactive under ba seconds. First Contentful Paint under một second. Input latency p99 under năm mươi milliseconds. Sync latency p50 under hai trăm milliseconds.

**Interviewer**: Ok, cuối cùng, em nói về accessibility.

**Candidate**: Dạ accessibility essential cho editor. Multiple aspects.

Keyboard navigation. All formatting accessible via keyboard shortcuts. Tab navigation through UI elements. Focus management when modal opens or content changes.

Screen reader support. Proper ARIA labels on toolbar buttons. Live regions announce changes like "Bold applied" or "Comment added". Semantic HTML structure.

Visual accessibility. High contrast support. Respect system font size preferences. Không rely solely on color for state indication.

Contenteditable inherently có accessibility issues. Em might need custom handling for complex interactions. Test với actual screen readers like VoiceOver và NVDA.

Mobile accessibility. Touch targets minimum bốn mươi tám pixels. Pinch zoom support. VoiceOver on iOS, TalkBack on Android.

**Interviewer**: Excellent em. Rất comprehensive. Anh satisfied với system design của em.

---

# ROUND 3: QUIZ QUESTIONS (1.5 tiếng)

**Interviewer**: Chào em, anh là Long, anh sẽ hỏi em một loạt câu hỏi technical nhanh. Mỗi câu em có vài phút suy nghĩ, anh sẽ follow-up để đào sâu. Ready?

**Candidate**: Dạ vâng anh, em sẵn sàng.

---

### Câu 1: React Reconciliation

**Interviewer**: Em giải thích React Reconciliation algorithm hoạt động như thế nào?

**Candidate**: Dạ, Reconciliation là quá trình React compare previous Virtual DOM tree với new tree để determine những changes cần apply lên Real DOM.

React implement điều này với diffing algorithm có complexity O của n thay vì O của n cube của generic tree diff. Để achieve này, React làm hai assumptions.

Assumption một là elements của different types produce different trees. Nếu root element change từ div sang span, React destroys entire subtree và rebuild.

Assumption hai là developer hint React về stable elements through key prop. Keys help React identify elements across renders.

Khi diff, React compare node by node. Same type element, React keeps DOM node, only updates changed attributes. Different type, React unmount old và mount new.

For lists, keys critical. Without keys, React uses index which cause issues when list reorder. With stable keys, React correctly matches elements và minimizes DOM operations.

**Interviewer**: Em mention O của n complexity. Generic tree diff tại sao O của n cube?

**Candidate**: Dạ, để transform one tree sang another tree, generic algorithm cần consider mọi possible mappings giữa nodes. Với n nodes mỗi tree, có n squared possible pairs. Rồi cho mỗi pair, computing optimal operations là O của n. Hence O của n cube.

React sidesteps này bằng không attempt cross-level matching. Nó chỉ compare nodes at same level. If structure fundamentally changes, nó accept destroying subtree rather than expensive transformation.

**Interviewer**: Nếu em có một list và swap hai elements, React handle như thế nào?

**Candidate**: Depends on keys. If using index as key, React sees position 0 và position 1 have different content, nó update DOM cho cả hai positions. Effectively re-render both.

If using stable IDs as keys, React realizes element với key A moved from index 0 to index 1, element với key B moved from index 1 to index 0. React có thể just reorder DOM nodes without re-render component internals.

**Interviewer**: Trong Fiber architecture, Reconciliation có gì khác?

**Candidate**: Fiber introduced incremental reconciliation. Pre-Fiber, reconciliation synchronous, phải complete trong một lần. Long lists block main thread.

Fiber breaks work into units. Each fiber represents one component. Reconciliation visits fibers, có thể pause giữa chừng nếu browser cần handle user input.

Fiber maintain hai trees: current và workInProgress. Reconciliation build workInProgress tree incrementally. When complete, swap them.

Key concept là priority. User interactions có high priority. Background updates low priority. Fiber scheduler interleave work based on priority.

**Interviewer**: Fiber có liên quan gì tới useTransition hook?

**Candidate**: useTransition là API cho developer mark certain updates as low priority. Khi wrap state update trong startTransition, React knows update is interruptible.

If high priority update comes trong khi transition running, React pause transition, handle urgent update, rồi resume transition.

This enables concurrent rendering. UI remains responsive because urgent updates not blocked by expensive re-renders.

---

### Câu 2: Browser Rendering Pipeline

**Interviewer**: Walk anh through browser rendering pipeline từ khi nhận HTML đến khi pixels on screen.

**Candidate**: Dạ vâng. Pipeline có several stages.

Đầu tiên parsing. Browser parse HTML thành DOM tree, và CSS thành CSSOM. Parsing có thể bị block bởi script tags without async/defer.

Sau đó style calculation. Browser combine DOM và CSSOM để determine computed styles cho mỗi element. This produce render tree với chỉ visible elements.

Layout phase tiếp theo. Browser calculate geometry của mỗi element, position và dimensions. Layout flow depends on box model, flow, positioning schemes.

Paint phase. Browser convert render tree vào paint records. Each layer gets paint instructions.

Composite phase. Browser combine layers theo correct order. GPU acceleration happens here. Composited frame sent to screen.

**Interviewer**: Em mention layers. Khi nào browser create new layer?

**Candidate**: Browser create stacking contexts và layers based on CSS properties. Transform với 3D như translateZ, will-change property, video elements, canvas, opacity animated, position fixed, all typically promote to own layer.

Layer promotion allows compositor to animate without triggering layout or paint. Transform và opacity changes chỉ affect composite phase, hence smooth sixty fps.

**Interviewer**: What triggers layout? What triggers paint?

**Candidate**: Layout triggered khi geometry changes. Width, height, margin, padding, position, font-size modifications all cause layout. Layout also called reflow.

Paint triggered khi visual appearance changes without geometry change. Color, background-image, box-shadow, visibility. Paint usually follows layout.

Some properties chỉ trigger composite, như transform và opacity. This why we prefer animating these.

Reading layout properties like offsetWidth, scrollTop can force layout if pending changes exist. This called forced synchronous layout, performance anti-pattern.

**Interviewer**: Giải thích forced synchronous layout chi tiết hơn.

**Candidate**: Normally browser batches DOM changes và do layout once per frame. But if JavaScript reads layout property after making changes, browser must flush pending layout to return accurate value.

Example: you set element.style.width = "100px", then immediately read element.offsetWidth. Browser forced to layout synchronously to calculate new offsetWidth.

Worse is layout thrashing, where code alternates between write and read in loop. Each iteration forces layout.

Solution is batch reads and writes. Read all values first, then write all. Or use requestAnimationFrame to defer writes to next frame.

**Interviewer**: Compositor thread là gì và tại sao important?

**Candidate**: Main thread handles JavaScript, layout, paint. Compositor thread handles compositing layers.

If animation chỉ involves compositor properties, animation runs on compositor thread independent of main thread. Even if main thread blocked by JavaScript, animation continues smoothly.

This why scroll can be smooth while JS running. Scroll handled by compositor. Same for transform animations.

Properties that run on compositor: transform, opacity, và scroll position. Others require main thread involvement.

---

### Câu 3: Event Loop và Microtasks

**Interviewer**: Explain JavaScript event loop. Differentiate macrotasks và microtasks.

**Candidate**: Event loop là mechanism cho JavaScript handle asynchronous operations despite single-threaded nature.

Loop structure: execute script, check microtask queue, execute all microtasks, check macrotask queue, execute one macrotask, repeat.

Microtasks include Promise callbacks, queueMicrotask, MutationObserver. Macrotasks include setTimeout, setInterval, I/O, rendering.

Key difference: toàn bộ microtask queue drains before next macrotask. Nếu microtask queue keeps getting items, macrotasks starve.

**Interviewer**: Cho code example, predict output order.

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```

**Candidate**: Output là 1, 4, 3, 2.

First, synchronous code runs. console.log('1'), setTimeout schedules macrotask, Promise.then schedules microtask, console.log('4').

After sync code, microtask queue processed. console.log('3').

Then macrotask. console.log('2').

**Interviewer**: Nếu trong Promise callback có thêm Promise?

```javascript
Promise.resolve()
  .then(() => {
    console.log("A");
    Promise.resolve().then(() => console.log("B"));
  })
  .then(() => console.log("C"));
```

**Candidate**: Output A, B, C.

First microtask logs A, schedules new microtask for B, và .then chain schedules C.

Microtask queue now has B và C. In which order? B was scheduled first, so A, B, C.

Wait, let me reconsider. Original promise chain, first then logs A và returns, this resolves second then which schedules C. Meanwhile inside first then, new Promise schedules B.

So after A, queue has: C (from original chain's second then) và B (from inner Promise). Actually no, let me trace again.

When first then callback runs, it logs A và calls Promise.resolve().then(() => B). This immediately schedules B into microtask queue. Then first then returns undefined, which triggers second then to schedule C.

So queue after A: B, then C gets added. Order: A, B, C.

**Interviewer**: Correct. What about requestAnimationFrame?

**Candidate**: requestAnimationFrame không phải macrotask hay microtask. Nó scheduled to run before next paint.

In event loop, after microtasks drain và before paint, browser checks if requestAnimationFrame callbacks queued. If visual change needed, RAF callbacks run, then paint.

RAF aligned with display refresh rate, typically sixty times per second. This why RAF preferred for visual animations over setTimeout.

**Interviewer**: What if RAF callback schedules another RAF?

**Candidate**: Newly scheduled RAF runs in next frame, not current. Unlike microtasks where scheduling more microtasks extend current batch, RAF batched per frame.

This prevents RAF callback from causing infinite loop within single frame.

---

### Câu 4: Closures và Memory

**Interviewer**: Giải thích closures và potential memory issues.

**Candidate**: Closure là function kèm theo lexical environment của nó. Khi inner function reference variables từ outer scope, those variables kept alive even after outer function returns.

Memory concern arises khi closures unintentionally retain large objects. Classic example là event handlers retaining references.

```javascript
function setup() {
  const largeData = new Array(1000000);
  button.addEventListener("click", () => {
    console.log(largeData.length);
  });
}
```

Handler closure retains largeData. Even if setup returns, largeData cannot be garbage collected until handler removed.

**Interviewer**: How detect such memory leaks?

**Candidate**: Chrome DevTools Memory panel. Take heap snapshot before và after suspected leak. Compare snapshots, look for objects that should be collected but aren't.

Timeline recording shows memory growth over time. Sawtooth pattern normal with GC. Steadily rising indicates leak.

Retained size in snapshot shows how much memory would be freed if object collected. Large retained size on unexpected objects là red flag.

**Interviewer**: What about closures trong loops?

**Candidate**: Classic gotcha với var trong loops:

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Logs: 3, 3, 3
```

var is function-scoped, not block-scoped. Single i shared across all closures. By time timeouts run, loop finished, i is 3.

Solutions: use let which is block-scoped, each iteration gets own i. Or IIFE to create new scope each iteration.

**Interviewer**: Ngoài closures, còn memory leak patterns nào trong frontend?

**Candidate**: Dạ vài patterns phổ biến.

Detached DOM nodes. Element removed from DOM nhưng JavaScript still references it. Node và its children cannot be GCed.

Event listeners not removed. Add listener on mount, forget to remove on unmount. Component gone but handler keeps reference chain alive.

Forgotten timers. setInterval without clearInterval when component unmounts.

Global variables. Accidentally creating globals retains data indefinitely.

Caches without eviction. Storing data in Map without size limit or expiration.

React specific: storing references in module scope, stale closures in useEffect without proper deps.

---

### Câu 5: Web Security - XSS

**Interviewer**: Explain XSS attacks và prevention.

**Candidate**: XSS là Cross-Site Scripting. Attacker inject malicious script vào website viewed by other users.

Three types. Stored XSS: malicious script saved in server database, executed when other users load page. Reflected XSS: script in URL or form input, reflected back in response. DOM-based XSS: client-side JavaScript processes untrusted data into DOM.

Prevention measures. Input validation và sanitization. Never trust user input. Validate expected format, reject or escape dangerous characters.

Output encoding. When rendering user content, encode HTML entities. "&lt;" instead of "<", etc. Frameworks like React auto-escape trong JSX.

Content Security Policy. HTTP header restricting sources of scripts. "script-src 'self'" disallows inline scripts và scripts from other domains.

HttpOnly cookies. Cookies với HttpOnly flag inaccessible to JavaScript, mitigating session theft via XSS.

**Interviewer**: React tự escape, vậy còn XSS risk không?

**Candidate**: React escapes string interpolation trong JSX. But risk remains nếu use dangerouslySetInnerHTML. Developer must sanitize HTML trước khi pass vào.

Also, href attributes can have javascript: protocol. React doesn't block this. Malicious link như href="javascript:alert(1)" vẫn execute.

Third-party libraries might not escape properly. Need audit dependencies.

Server-side rendering có thêm concerns. If initial state serialized into HTML, malicious data could escape và execute.

**Interviewer**: CSP cụ thể prevent những gì?

**Candidate**: CSP restrict resource loading. script-src controls where scripts loaded from. Nonce or hash based CSP allows specific inline scripts.

style-src controls stylesheets. img-src controls images. connect-src controls fetch/XHR destinations.

default-src sets fallback for unspecified directives.

report-uri collects violation reports for monitoring.

Strict CSP có thể break functionality initially. Need careful rollout. start with report-only mode.

---

### Câu 6: Performance Metrics

**Interviewer**: Explain Core Web Vitals.

**Candidate**: Core Web Vitals là ba metrics Google uses for ranking và user experience.

LCP, Largest Contentful Paint. Time until largest content element renders. Measures loading performance. Good under 2.5 seconds.

FID, First Input Delay. Time from user interaction to browser response. Measures interactivity. Good under 100 milliseconds. Being replaced by INP.

CLS, Cumulative Layout Shift. Sum of unexpected layout shifts. Measures visual stability. Good under 0.1.

**Interviewer**: How improve LCP?

**Candidate**: LCP element thường là hero image, heading, hoặc large text block.

For images: optimize size, use modern formats như WebP. Preload critical images. Use proper dimensions to avoid layout recalculation.

For text: avoid web font FOIT. Use font-display swap. Inline critical CSS.

Server side: reduce TTFB. Use CDN. Server-side rendering for faster first paint.

Remove render-blocking resources. Defer non-critical JavaScript. Async load non-critical CSS.

**Interviewer**: What about CLS specifically?

**Candidate**: CLS happens khi elements shift after initial render.

Common causes: images without dimensions, ads injecting, fonts causing FOUT, dynamic content above existing content.

Fixes: always specify width height on images và videos. Reserve space for ads. Use font-display optional hoặc fallback fonts matching web fonts. Insert dynamic content below viewport hoặc reserve space.

Animations không cause CLS nếu use transform. Moving element with transform không shift document flow.

**Interviewer**: Difference between FID và INP?

**Candidate**: FID measures only first interaction's delay. INP measures all interactions throughout page lifecycle.

INP aggregates interaction latencies. Reports something like 75th percentile. Better represents overall page responsiveness.

INP replacing FID in Core Web Vitals because single first interaction không representative of actual user experience.

---

### Câu 7: CSS Specificity

**Interviewer**: Explain CSS specificity calculation.

**Candidate**: Specificity determines which CSS rules apply when multiple rules target same element.

Calculated as tuple: (inline, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements).

Inline styles highest. Then IDs count. Then classes, attributes, pseudo-classes like :hover. Then elements và pseudo-elements like ::before.

Example: #header .nav a có specificity (0, 1, 1, 1). One ID, one class, one element.

.nav a:hover là (0, 0, 2, 1). Two in class column (class + pseudo-class), one element.

First rule wins because ID column beats class column.

**Interviewer**: Where does !important fit?

**Candidate**: !important overrides specificity entirely. Important declaration beats any non-important regardless of specificity.

If both have !important, then specificity compares among important declarations.

Generally avoid !important, makes maintenance hard. Exception: utility classes sometimes justified, third-party override necessity.

**Interviewer**: CSS cascade order?

**Candidate**: Full cascade order: origin và importance.

User agent styles lowest. Author styles next. Then user styles. Important declarations reverse order.

Within same origin, specificity applies. Same specificity, later rule wins.

**Interviewer**: How does cascade layers (@layer) affect this?

**Candidate**: @layer introduced for managing cascade priority. Layers declared explicitly, earlier layers lower priority than later.

Unlayered styles có highest priority within author origin.

Inside each layer, normal specificity rules apply. But unlayered beats any layer regardless of specificity.

Allows framework styles in layer to be easily overridden by application styles unlayered.

---

### Câu 8: Accessibility - ARIA

**Interviewer**: When should ARIA be used?

**Candidate**: First rule of ARIA: don't use ARIA if native HTML element exists. Native elements have built-in semantics và keyboard behavior.

ARIA needed khi building custom widgets not available in HTML. Custom dropdown, tab panel, modal, carousel.

ARIA provides roles để define what element is. States and properties describe current state. Labels provide accessible names.

**Interviewer**: Explain ARIA live regions.

**Candidate**: Live regions announce dynamic content changes to screen reader users.

aria-live="polite" announces when user idle. aria-live="assertive" interrupts immediately.

aria-atomic tells whether announce entire region or just changes. aria-relevant specifies what changes trigger announcement: additions, removals, text changes.

Common use: form validation messages, notification toasts, chat messages, live scores.

**Interviewer**: Focus management with ARIA?

**Candidate**: aria-activedescendant manages focus within composite widget like listbox. Visual focus stays on container, aria-activedescendant points to currently active option.

tabindex controls tab order. tabindex="0" includes in natural order. tabindex="-1" programmatically focusable but not in tab order. Positive tabindex generally avoided.

Focus trap for modals. When modal opens, trap focus inside. ESC closes and returns focus to trigger.

**Interviewer**: Semantic HTML examples that reduce ARIA need?

**Candidate**: button instead of div with role="button". Native button has focus, keyboard activation, accessible name from content.

nav, main, aside, header, footer provide landmarks without explicit ARIA roles.

form inputs with label element via for attribute. No need for aria-labelledby.

details/summary for disclosure widgets. Built-in toggle behavior và accessibility.

output element for live calculation results. Has implicit aria-live.

---

### Câu 9: Module Systems

**Interviewer**: Difference between CommonJS và ES Modules?

**Candidate**: CommonJS là Node.js original module system. require() function loads modules synchronously. module.exports exports values. Runtime resolution.

ES Modules là standard. import/export syntax. Static analysis possible, enabling tree shaking. Browser native support.

Key differences. CJS synchronous, ESM can be async. CJS copies values, ESM live bindings. CJS runtime resolution, ESM static determined at parse time.

ESM has import() for dynamic import. Returns promise.

**Interviewer**: Explain tree shaking.

**Candidate**: Tree shaking eliminates unused exports from bundle. Static analysis of imports allows bundler to know what's used.

Requires ES Modules because static. CJS dynamic nature prevents safe removal.

sideEffects field in package.json tells bundler if module has side effects. False allows aggressive removal.

Gotchas: re-exports can preserve unused code. IIFE side effects. Property access on namespace imports.

**Interviewer**: Difference between named và default exports regarding tree shaking?

**Candidate**: Named exports better for tree shaking. Each export individually trackable.

Default export is single binding. If default exports object, accessing one property still imports entire object in some cases.

Best practice: use named exports. Avoid export default { ... } pattern.

---

### Câu 10: Testing Strategies

**Interviewer**: Explain testing pyramid for frontend.

**Candidate**: Testing pyramid suggests more unit tests, fewer integration, even fewer e2e.

Unit tests fast, isolated. Test individual functions, hooks, utilities. Mock dependencies.

Integration tests verify components work together. Test component rendering, user interactions, state changes. Tools like Testing Library.

E2E tests full flow. Browser automation, real backend. Slow nhưng catch integration issues. Cypress, Playwright.

**Interviewer**: Testing Library philosophy?

**Candidate**: Testing Library encourages testing như user uses app. Query by accessible roles, text, labels rather than implementation details như class names, IDs.

getByRole finds elements by ARIA role. getByLabelText finds form inputs. getByText finds by visible text.

Avoid testing implementation: don't test internal state, don't query by component internals.

Test behavior: render component, simulate user action, assert outcome.

**Interviewer**: When use mocks vs real implementations?

**Candidate**: Mock external services: APIs, third-party libraries. Mocks make tests deterministic, fast.

Avoid mocking what you own. If testing component A that uses component B, render both. Mocking B risks missing integration issues.

Mock boundaries: network boundary, time (mock timers), browser APIs không available in test environment.

Integration tests can use mock server like MSW. Intercept network, return fixture data. More realistic than mocking fetch directly.

---

### Câu 11: React Hooks Deep Dive

**Interviewer**: Explain useEffect cleanup function.

**Candidate**: Cleanup function returned from useEffect runs before effect re-runs và before unmount.

Purpose: clean up side effects from previous effect. Remove event listeners, cancel subscriptions, abort fetch requests, clear timers.

Execution order: on re-render với dependency change, cleanup of previous effect runs first, then new effect. On unmount, cleanup runs.

**Interviewer**: What happens nếu quên cleanup?

**Candidate**: Memory leaks. Event listeners accumulate. Subscriptions pile up. State updates on unmounted component cause warning.

With async effects, stale closures update wrong state. Need cleanup flag hoặc AbortController.

```javascript
useEffect(() => {
  let cancelled = false;
  fetchData().then((data) => {
    if (!cancelled) setData(data);
  });
  return () => {
    cancelled = true;
  };
}, [id]);
```

**Interviewer**: Explain useLayoutEffect vs useEffect.

**Candidate**: useEffect runs after browser paint. useLayoutEffect runs synchronously after DOM mutations, before paint.

useLayoutEffect blocks visual update. Use for DOM measurements, synchronous visual adjustments.

Most effects don't need layout timing. Default to useEffect. useLayoutEffect cho DOM reads that need to happen before user sees, or DOM writes that must synchronize with reads.

Example: tooltip positioning. Need to read trigger element position, calculate tooltip position, write tooltip style. All before paint to avoid flicker.

**Interviewer**: Custom hooks best practices?

**Candidate**: Prefix with "use" for lint rules. Encapsulate reusable stateful logic.

Return stable references. useMemo for object returns, useCallback for function returns.

Compose from other hooks. useFetch built from useState, useEffect, potentially useRef.

Don't over-abstract. Hook should have clear purpose. Avoid god hooks with too many responsibilities.

Test custom hooks with renderHook from Testing Library.

---

### Câu 12: TypeScript for Frontend

**Interviewer**: Benefits of TypeScript for large frontend codebases?

**Candidate**: Type safety catches errors at compile time. Missing props, wrong prop types, undefined access.

IDE support: autocomplete, refactoring, go to definition. Confidence when changing code.

Documentation. Types serve as inline documentation. Interface defines expected shape.

Refactoring safety. Rename symbol, find all usages. Type errors guide updates.

**Interviewer**: React component typing best practices?

**Candidate**: Prefer FC type or explicit return type. FC includes children implicitly, though this changed in React 18.

Interface for props. Make optional props explicit. Use union types for variant props.

```typescript
interface ButtonProps {
  variant: "primary" | "secondary";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
```

Generic components for reusable patterns. List component generic over item type.

Event handlers: React.MouseEvent<HTMLButtonElement> cho button clicks.

**Interviewer**: Utility types useful for React?

**Candidate**: Partial<T> makes all props optional. Useful for update functions.

Pick<T, K> selects subset of props. Omit<T, K> removes props.

ReturnType<T> extracts return type. Useful for inferring hook return types.

ComponentProps<typeof Component> extracts props from component.

React.PropsWithChildren<P> adds children prop.

**Interviewer**: Type guards?

**Candidate**: Type guards narrow types at runtime. Custom functions returning type predicate.

```typescript
function isError(response: Success | Error): response is Error {
  return "error" in response;
}
```

Used for discriminated unions. Check discriminant property, TypeScript narrows type trong branch.

typeof và instanceof built-in guards cho primitives và classes.

---

### Câu 13: State Management Patterns

**Interviewer**: Compare Redux, Context, và Zustand.

**Candidate**: Redux: centralized store, actions, reducers. Predictable state updates. DevTools time travel. Middleware for async. Verbose boilerplate.

Context: built-in React. Provider/Consumer pattern. Simple for prop drilling avoidance. Performance concern: any context change re-renders all consumers.

Zustand: minimal API. Create store with create function. Subscribe selectively. No provider needed. Automatic render optimization.

**Interviewer**: When choose each?

**Candidate**: Redux for complex apps needing strict patterns, team collaboration, robust DevTools. Enterprise apps with many developers.

Context for simple shared state. Theme, locale, auth status. Infrequent updates.

Zustand for medium complexity. Need better performance than Context. Less boilerplate than Redux. Good for feature-specific stores.

Also consider: Jotai for atomic state, Recoil for graph-based state, React Query for server state.

**Interviewer**: Server state vs client state?

**Candidate**: Server state: data from APIs. Has remote source of truth. Needs caching, synchronization, refetching.

Client state: local only. UI state, form state, user preferences. No external sync needed.

Mixing them in same store problematic. Server state has different lifecycle: loading, error, stale, revalidation.

React Query, SWR dedicated for server state. Handle caching, deduplication, background refetch, optimistic updates.

Client state in simpler solutions: useState, useReducer, Zustand.

---

### Câu 14: Bundle Optimization

**Interviewer**: Strategies to reduce bundle size?

**Candidate**: Code splitting. Split by route. Each route loads own chunk. React.lazy và Suspense.

Tree shaking. Remove unused exports. Requires ES modules. Check sideEffects in package.json.

Dynamic imports for large dependencies. Load heavy library only when needed.

Analyze bundle. webpack-bundle-analyzer, source-map-explorer. Identify large dependencies.

Replace heavy libraries. moment.js with date-fns. lodash full với lodash-es or individual imports.

**Interviewer**: Explain chunk splitting strategies.

**Candidate**: Entry points: separate chunks for separate entry files. Multi-page apps.

Vendor splitting: separate node_modules into vendor chunk. Changes less frequently, better caching.

Runtime chunk: webpack runtime separate. Tiny chunk, very cacheable.

Async chunks: dynamic imports create separate chunks loaded on demand.

Common chunks: shared code between multiple chunks extracted. Avoid duplication.

**Interviewer**: How measure impact of optimizations?

**Candidate**: Bundle size comparison before/after. Track main bundle, vendor, async chunks.

Lighthouse performance score. Includes bundle impact on load time.

Real User Monitoring. Track Time to Interactive, First Contentful Paint in production.

Coverage report in DevTools. Shows unused JavaScript/CSS on page load.

---

### Câu 15: Micro-frontends

**Interviewer**: Explain micro-frontend architecture.

**Candidate**: Micro-frontends decompose frontend by domain. Each team owns feature slice end-to-end. Independent development, deployment.

Integration approaches. Build-time: npm packages, compiled together. Runtime: load separately, compose in browser. Server-side: compose HTML from multiple services.

Runtime options: iframes isolated but limited communication. Module federation shares code dynamically. Web Components encapsulate styling và behavior.

**Interviewer**: Module Federation specifically?

**Candidate**: Webpack 5 feature. Apps expose modules, consume from other apps at runtime.

Host app loads remotes. Remote exposes components. Shared dependencies avoid duplication.

Configuration in webpack config. exposes defines what to share. remotes defines where to load from. shared manages common dependencies.

Challenges: version mismatches, shared state across remotes, consistent styling, routing coordination.

**Interviewer**: Trade-offs of micro-frontends?

**Candidate**: Pros: team autonomy, independent deployments, technology flexibility, isolated failures.

Cons: complexity overhead. Build và deploy pipeline for each. Consistent UX across teams challenging. Performance if loading multiple bundles. Shared state coordination. Testing integration points.

Not suitable for small teams or simple apps. Organizational benefit requires organizational scale.

---

### Câu 16: Web APIs

**Interviewer**: Explain Intersection Observer.

**Candidate**: Intersection Observer detects when element enters or exits viewport or ancestor element.

Use cases: lazy load images, infinite scroll, analytics visibility tracking, animations on scroll.

Create observer with callback và options. Options specify root, rootMargin, threshold. observe() starts watching element.

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadImage(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
```

Performance better than scroll listeners. Browser optimizes, runs off main thread.

**Interviewer**: ResizeObserver?

**Candidate**: ResizeObserver detects size changes of elements.

Use cases: responsive component behavior, chart resizing, container queries polyfill.

Reports content rect dimensions when element resizes. Works for any cause: window resize, DOM changes, CSS.

Replace window resize listener for component-level responsiveness.

**Interviewer**: MutationObserver?

**Candidate**: MutationObserver watches DOM tree changes. Attributes, child list, character data.

Configure what to observe: attributes, childList, subtree, attributeOldValue, characterDataOldValue.

Use cases: react to third-party DOM changes, accessibility tools, polyfills, analytics.

Careful of infinite loops if callback modifies DOM triggering more mutations.

---

**Interviewer**: Great job em. Anh rất impressed với breadth và depth của knowledge em. Chúng ta move on sang behavioral round nhé.

---

# ROUND 4: BEHAVIORAL QUESTIONS (1.5 tiếng)

**Interviewer**: Chào em, anh là Tuấn, anh sẽ phỏng vấn em phần behavioral hôm nay. Anh sẽ hỏi một số câu về experience và cách em handle các situations. Em trả lời theo STAR framework nhé: Situation, Task, Action, Result. Ready?

**Candidate**: Dạ vâng anh, em sẵn sàng.

---

### Câu 1: Technical Leadership

**Interviewer**: Tell me about a time you led a significant technical initiative.

**Candidate**: Dạ, em sẽ kể về việc em lead migration từ legacy jQuery codebase sang React cho product chính của công ty.

Situation là codebase đã hơn năm năm tuổi, hơn hai trăm nghìn lines of code. Performance ngày càng tệ, bugs khó trace, và developers mới onboard rất chậm. Management nhận thấy velocity giảm và muốn modernize.

Task của em là propose và lead migration strategy. Challenge là không thể stop feature development để rewrite. Business cần continuous delivery.

Action em làm đầu tiên là research và propose strangler fig pattern. Thay vì big bang rewrite, em wrap React components trong legacy pages. Gradually replace from inside out.

Em present proposal cho engineering leadership với timeline, risks, và milestones. Sau approval, em create migration guide documentation, set up tooling cho interoperability, và run workshops để upskill team trên React.

Em identify high-impact, low-complexity pages để migrate first. Build momentum với quick wins. Create shared component library để ensure consistency.

Weekly migration sync để track progress, address blockers, share learnings. Em personally reviewed migration PRs để ensure quality và knowledge transfer.

Result sau một năm, em migrate được khoảng sáu mươi phần trăm codebase. Page load time giảm bốn mươi phần trăm on migrated pages. Developer velocity tăng vì React ecosystem tooling. Bug rate giảm đáng kể với better state management.

Team grew more confident với modern stack. Hiring easier vì React attractive to candidates.

**Interviewer**: What was the biggest technical challenge trong migration?

**Candidate**: Dạ, biggest challenge là shared state between React và jQuery code. Some features span both worlds.

Em implement một shared event bus. Both sides emit và listen events. State changes propagate correctly. Temporary solution until full migration.

Also, styling conflicts. Legacy CSS global, React components có own styles. Em introduce CSS modules cho React, namespace legacy CSS to prevent clashes.

**Interviewer**: How did you handle pushback from team members?

**Candidate**: Dạ, có một senior engineer resist change. Concern về learning curve và project delays.

Em schedule one-on-one để understand concerns deeply. Valid points about team capacity. Em propose pairing sessions, where em work alongside him on first migration.

Through hands-on experience, he saw benefits và became advocate. His domain knowledge plus new React skills made him key contributor.

Lesson: address resistance with empathy và demonstration, not just arguments.

---

### Câu 2: Conflict Resolution

**Interviewer**: Describe a situation where you had a disagreement with a colleague about a technical decision.

**Candidate**: Dạ, em had significant disagreement với another senior engineer về state management choice cho new feature.

Situation là em đang build complex dashboard với real-time updates. Em propose using Redux vì team familiar và has DevTools. Colleague strongly advocate cho MobX vì less boilerplate và reactive model fits real-time updates better.

Task là reach decision without damaging relationship và shipping on time.

Action, đầu tiên em suggest we both prepare technical comparison document. Objective criteria: learning curve, performance, debugging, team experience, long-term maintenance.

Em research MobX thoroughly even though em prefer Redux. Found valid advantages cho our use case. Colleague did same for Redux.

Em schedule meeting với full team. Both present pros cons. Open discussion, không personal.

Em propose compromise: use MobX cho this specific feature as pilot. If successful, consider broader adoption. If problematic, fallback to Redux. Set specific evaluation criteria.

Result: team agreed. MobX pilot successful, code was indeed cleaner for reactive updates. Em learned new tool, broadened perspective. Colleague appreciated em's openness. No damaged relationship.

Later, team standardized on Redux Toolkit với RTK Query for most cases, MobX cho specific reactive-heavy features.

**Interviewer**: What would you do differently?

**Candidate**: Dạ, em wish em propose spike earlier. Before positions hardened, short investigation phase comparing both trong context của our specific feature. Would have reduced friction.

Also, em realize em held onto preference partly vì familiarity, not objective analysis. Try to recognize that bias earlier.

---

### Câu 3: Mentoring

**Interviewer**: Tell me about experience mentoring junior engineers.

**Candidate**: Dạ, em mentored several juniors. Em share về one specific mentee.

Situation: fresh graduate joined team, strong academics but struggled with production code. Code reviews revealed gaps in debugging, testing, và understanding codebase.

Task: help him become independent contributor within three months.

Action: em establish weekly one-on-ones. Not just status updates but technical discussions. Review his learnings, answer questions, suggest resources.

Em assign gradually complex tasks. Start với well-defined bugs, good for learning codebase và debugging. Then small features với clear specs. Eventually ambiguous features requiring more initiative.

Em pair program sessions. Not em driving while he watches. Em let him drive, em ask questions to guide thinking. "What would happen if input is empty?" "How would you test this?"

Em encourage asking questions publicly in Slack. Normalize not knowing. Other team members answer, builds connections.

Em share em's own struggles và mistakes. Imposter syndrome is real. Knowing seniors also struggled helps.

Result: within three months, he shipped significant feature independently. Code quality improved dramatically. He started helping other juniors.

He told em mentorship changed his confidence and career trajectory. Em felt fulfilled.

**Interviewer**: What's your mentoring philosophy?

**Candidate**: Dạ, core belief là guide don't direct. Em's job không phải give answers but help them find answers.

Ask questions before giving solutions. "What have you tried?" "What do you think is happening?" "Where would you look for this information?"

Create safe environment for mistakes. Mistakes are learning opportunities if handled correctly.

Celebrate growth, not just outcomes. Acknowledge improvement in approach even if result not perfect yet.

Tailor to individual. Some need more structure, some more autonomy. Some prefer written feedback, some verbal. Adapt style.

---

### Câu 4: Handling Failure

**Interviewer**: Describe a time when you made a significant mistake or your project failed.

**Candidate**: Dạ, em will share about an outage em caused.

Situation: em pushed config change to production thinking nó minor. Change to feature flag defaults. Didn't follow full rollout process because deemed low risk.

Change had unintended interaction with another config. Result: main user flow broken for fifteen minutes until em rolled back.

Task: fix immediately, then do proper post-mortem.

Action ngay lập tức: em recognize từ monitoring alerts. Em immediately rollback change. Communicate in incident channel. Page on-call nếu cần support. Service restored.

After incident: em owned the mistake completely. Không blame process or tools. Em write detailed post-mortem: timeline, root cause, impact, corrective actions.

Root cause analysis: em skip peer review for "simple" change. Staging environment không match production config fully. Monitoring alerts not specific enough.

Corrective actions em propose: all config changes require peer review regardless of perceived simplicity. Improve staging-production parity. Add specific alert for this interaction.

Em present post-mortem to team. Uncomfortable but necessary. Team sees em take accountability, builds trust.

Result: process improved. Similar incidents prevented. Team more disciplined about change management. Em personally never skip review again.

**Interviewer**: How did you handle the emotional aspect?

**Candidate**: Dạ honestly, em felt terrible. Embarrassed, guilty. Imposter syndrome spiked.

Em remind self that mistakes happen to everyone. What matters is response. Own it, learn from it, improve systems.

Support from manager helped. Manager said "This is why we have rollback capability. You handled it well." Not excusing mistake but acknowledging good response.

Em talk openly về feeling với team. Others share their war stories. Normalizes that production incidents happen. Culture of blame-free learning.

---

### Câu 5: Prioritization Under Pressure

**Interviewer**: Tell me about a time when you had to balance multiple critical priorities.

**Candidate**: Dạ, có quarter em faced competing priorities.

Situation: em leading React migration while simultaneously two critical bugs emerged in production affecting revenue. Plus quarterly performance reviews em responsible for as tech lead.

Task: deliver on all fronts without burning out or sacrificing quality.

Action: em first assess priorities ruthlessly. Production bugs are P0, immediate revenue impact. Performance reviews have deadline. Migration can flex timeline.

Em communicate transparently with manager. "Here's what's on my plate, here's my proposed prioritization, here's what will slip." Manager agreed và communicated to stakeholders.

For bugs: em take one personally, assign other to senior team member. Daily sync until resolved.

For reviews: block time in calendar. Non-negotiable focus time. Delegate review logistics to HR partner.

For migration: communicate delay to team and stakeholders. Explain why. Adjust timeline expectations.

Em also protect team from context switching. Shield them from changing priorities. Em absorb the chaos so they can focus.

Self-care: em recognize burnout risk. Ensure adequate sleep even if means shorter working hours. More productive rested.

Result: bugs fixed within three days. Reviews completed on time với quality feedback. Migration delayed two weeks but delivered successfully.

Learned to proactively communicate when overloaded. Stakeholders prefer early heads-up over missed deadlines.

**Interviewer**: How do you typically prioritize?

**Candidate**: Dạ em use framework: impact và urgency.

Impact: how many users affected, revenue impact, strategic importance.

Urgency: deadline driven or self-imposed. Hard deadlines vs flexible.

Matrix: high impact high urgency first. High impact low urgency gets scheduled. Low impact high urgency questioned - why urgent if low impact? Low impact low urgency deprioritized.

Also consider: who else can do this? Delegate where possible. What happens if we don't do this? Sometimes answer is "nothing bad" and task gets dropped.

---

### Câu 6: Ambiguity

**Interviewer**: Describe a situation where you had to make a decision with incomplete information.

**Candidate**: Dạ, em share about technical decision under ambiguity.

Situation: em need to choose third-party analytics vendor. Multiple options, each with different strengths. Timeline tight, full evaluation not possible.

Requirements from product unclear. They said "we need analytics" but specific use cases vague.

Task: make decision that won't regret, given constraints.

Action: em first push back on timeline. "Can we get one more week?" Answer was no, business deal depended on having analytics.

Em list must-have vs nice-to-have. Must-have: basic event tracking, user identification, data export. Nice-to-have: funnel analysis, cohort analysis, real-time dashboards.

Em narrow to two vendors meeting must-haves. For differentiators, em make assumptions về future needs based on product roadmap và industry trends.

Em document decision rationale clearly. "We chose A over B because X assumption. If assumption wrong, we can switch with Y effort."

Em also negotiate contract terms allowing exit if needed. Không locked in long-term on uncertain choice.

Result: chose vendor A. Six months later, assumption mostly correct. One use case needed from vendor B, but workaround found. Decision held up.

Key learning: perfect information never exists. Make best decision with available info, document rationale, build in flexibility.

**Interviewer**: How do you get comfortable with ambiguity?

**Candidate**: Dạ honestly, early career em struggled. Wanted all answers before deciding.

Over time, em realize waiting for certainty is itself a decision - often worse than imperfect forward motion.

Em develop mental model: what's worst case if wrong? Can we reverse? If reversible and worst case acceptable, proceed.

Em also distinguish "two-way door" và "one-way door" decisions. Two-way doors can be walked back, bias toward action. One-way doors deserve more deliberation.

---

### Câu 7: Cross-functional Collaboration

**Interviewer**: Tell me about working with non-engineering stakeholders.

**Candidate**: Dạ, em frequently work with Product, Design, và Business.

Specific example: launching major feature requiring alignment across functions.

Situation: new feature for premium users. Product had vision, Design had concepts, Business had timeline. Engineering (em) needed to assess feasibility và plan.

Task: align all parties và deliver on time.

Action: em initiate kickoff meeting với all stakeholders. Not separate meetings, together. Hear same information, discuss openly.

Em create shared document: requirements, designs, technical constraints, timeline. Everyone edits và comments. Single source of truth.

When Product requested feature X, em explain technical complexity. "This adds three weeks." Product prioritizes: what's core for launch vs V2. Em help them understand trade-offs.

When Design proposed animation, em assess performance impact. "This may affect load time on mobile." Design simplifies animation maintaining essence.

Em give regular updates in non-technical language. "We're seventy percent done, on track for deadline." Not "we completed Redux integration and API endpoints."

When blockers arise, em bring to stakeholders immediately with options. "Issue Y found. Options: A takes two weeks extra, B reduces scope, C requires additional resources."

Result: feature launched on time. Stakeholders felt informed và respected. Relationship strengthened for future collaborations.

**Interviewer**: How do you handle conflicting stakeholder priorities?

**Candidate**: Dạ, conflict inevitable. Product wants features, Design wants polish, Business wants speed.

Em facilitate conversation to surface trade-offs explicitly. "If we do X, we can't do Y in this timeline." Let them negotiate priorities, not em decide.

Em provide data to inform. "Based on our velocity, here's what's realistic."

Sometimes escalation needed. If stakeholders can't agree, elevate to leadership with clear framing của trade-offs.

Em's role: honest broker. Not advocate for one stakeholder. Present facts, facilitate decision.

---

### Câu 8: Driving Impact

**Interviewer**: Tell me about a time you identified and solved a problem that wasn't assigned to you.

**Candidate**: Dạ, em share about improving our development workflow.

Situation: em notice developers spending significant time on repetitive tasks. Manual environment setup, manual deployment, manual testing steps.

No one assigned optimization because everyone busy với features. Accepted as "how things are."

Task: em take initiative to improve, without neglecting assigned work.

Action: em first quantify problem. Survey team: how much time per week on these tasks? Result: average two hours per developer per week. Team of ten, twenty hours weekly wasted.

Em write proposal với ROI calculation. Two hours weekly times ten developers times fifty weeks equals one thousand hours annually. If automation takes one hundred hours to build, payback in under two months.

Em present to manager. Get buy-in to spend twenty percent time on this.

Em implement: Docker compose for local environment, one command setup. CI/CD pipeline improvements, deploy với one click. Automated test suite for common scenarios.

Em document everything. Onboarding guide updated. Team training session.

Result: setup time reduced from half day to thirty minutes. Deployment from manual steps to automated. Test cycles faster.

Team velocity measurably improved. Em credited for initiative, became go-to for process improvements.

**Interviewer**: How do you identify such opportunities?

**Candidate**: Dạ em pay attention to friction. What annoys developers? What do people complain about in retros?

Em ask "why" repeatedly. Why do we do this manually? Often answer is "always done this way."

Em look at metrics. Long cycle times might indicate process issues, not just technical issues.

Em listen during onboarding new hires. Fresh eyes see inefficiencies we've normalized.

---

### Câu 9: Receiving Feedback

**Interviewer**: Tell me about a time you received difficult feedback.

**Candidate**: Dạ, em share về feedback from manager.

Situation: during performance review, manager said em communicate too much technical detail in meetings với non-engineers. Stakeholders confused and meetings ran long.

Initially em felt defensive. Em proud of technical depth. Felt like being told to dumb down.

Task: process feedback và improve.

Action: em first ask for specific examples. Manager provide two instances. Em re-read meeting notes, saw the issue.

Em realize em communicating for self (showing thoroughness) not for audience (understanding decisions).

Em practice summarizing. Before meeting, em write one-sentence summary của technical topic. If em can't summarize simply, em don't understand it well enough.

Em ask "what do they need to know to make decision?" Focus on that, skip implementation details unless asked.

Em get feedback from colleagues. "Am em being clear?" Iterate based on input.

Result: next stakeholder meetings smoother. Decisions faster. Manager recognized improvement.

Lesson: feedback is gift even when uncomfortable. Action on feedback matters more than initial reaction.

**Interviewer**: How do you distinguish valid feedback from invalid?

**Candidate**: Dạ, first em try not to dismiss any feedback immediately. Even poorly delivered feedback might have truth.

Em look for patterns. One person's feedback might be preference. Multiple similar feedbacks indicate real issue.

Em consider source. Does person have relevant context? Well-intentioned?

Em try implementing suggested change experimentally. If results improve, valid. If not, revisit.

Em avoid confirmation bias. Don't just seek opinions that agree với existing view.

Ultimately, em own development. Em decide what to act on, but with open mind.

---

### Câu 10: Future Goals

**Interviewer**: Where do you see yourself in five years?

**Candidate**: Dạ, in five years em want to be in a Staff or Principal Engineer role where em có significant technical influence across organization.

Em want to tackle harder problems: architecture decisions affecting many teams, technical strategy alignment với business goals, building platforms that multiply developer productivity.

Em also want to grow in leadership. Not necessarily people management, but technical leadership. Setting direction, mentoring seniors, representing engineering in cross-functional strategy.

Em interested in staying hands-on somewhat. Em don't want to be purely meetings và documents. Still contribute code, still understand systems deeply.

Specifically at this company, em drawn to [specific domain or product]. Em believe there's opportunity to [specific impact em could have].

**Interviewer**: Why Staff/Principal track instead of Engineering Manager?

**Candidate**: Dạ, em considered management. Em enjoy mentoring và leading initiatives.

But em realize em energized most by technical challenges. Debugging tough production issues, designing elegant systems, exploring new technologies.

Management success measured by team output, not personal technical contribution. Em prefer role where em's individual technical work directly creates impact.

Staff/Principal allows leadership without giving up technical depth. Influence through expertise và collaboration, not authority.

Em might revisit management later in career. For now, IC track aligns better với what motivates em.

---

**Interviewer**: Em, đó là câu hỏi cuối cùng. Cảm ơn em đã dành thời gian phỏng vấn hôm nay. Em có câu hỏi gì cho anh không?

**Candidate**: Dạ em cảm ơn anh. Em có vài câu hỏi.

Đầu tiên, team hiện tại đang face technical challenges lớn nhất là gì?

**Interviewer**: Anh nói thật thì scalability là issue chính. User base growing nhanh hơn infrastructure. Cần rethink một số core systems.

**Candidate**: Dạ interesting. Câu tiếp theo, culture của team đối với technical debt như thế nào? Em muốn hiểu balance giữa shipping features và paying down debt.

**Interviewer**: Good question. Chúng anh có dedicated tech debt sprints quarterly. Not perfect nhưng có commitment. Em sẽ có voice trong prioritization.

**Candidate**: Cuối cùng, anh personally enjoy nhất điều gì khi làm ở đây?

**Interviewer**: Anh appreciate người ở đây. Smart, motivated, collaborative. Problems interesting và impact real. Anh feel ownership over work.

**Candidate**: Dạ em cảm ơn anh nhiều. Em rất excited về opportunity này.

**Interviewer**: Anh cũng impressed với em hôm nay. Em sẽ nghe từ recruiter trong vài ngày. Take care!

**Candidate**: Dạ vâng, cảm ơn anh. Chào anh!

---

# KẾT THÚC CUỘC PHỎNG VẤN

**Tổng kết đánh giá:**

Round 1 (Coding): Candidate demonstrated strong algorithmic thinking, deep JavaScript knowledge, và practical UI implementation skills. Follow-up handling excellent.

Round 2 (System Design): Comprehensive architecture proposal với clear trade-off analysis. Diagrams well-structured. Handled edge cases và scaling considerations maturely.

Round 3 (Quiz): Broad và deep technical knowledge across browser internals, React, performance, security, accessibility. Few gaps, quick recovery when challenged.

Round 4 (Behavioral): Clear STAR stories, self-aware, growth mindset. Leadership potential evident. Good cultural fit indicators.

**Overall: Strong Hire recommendation**
