# CUỘC PHỎNG VẤN MÔ PHỎNG SENIOR FRONTEND ENGINEER - GOOGLE

## ROUND 1: CODING QUESTIONS (2 tiếng)

### Phần 1: Algorithmic Coding (45 phút)

**Interviewer:** "Chào em, mình là Sarah từ Google Search team. Hôm nay chúng ta sẽ có một buổi phỏng vấn khoảng 2 tiếng về coding. Em đã sẵn sàng chưa?"

**Candidate:** "Dạ em sẵn sàng rồi ạ. Rất vui được gặp chị."

**Interviewer:** "Tốt. Vậy chúng ta bắt đầu với bài đầu tiên nhé. Em hãy tưởng tượng chúng ta đang build một feature autocomplete cho Google Search. Khi user gõ một query, chúng ta muốn suggest các query phổ biến nhất dựa trên prefix mà user đã gõ. Em sẽ thiết kế một data structure và implement function để support feature này như thế nào?"

**Candidate:** "Dạ, em hiểu rồi ạ. Vậy là em cần build một hệ thống có thể lưu trữ các query và retrieve được top k queries phổ biến nhất khi có một prefix cho trước. Em nghĩ ngay đến cấu trúc Trie vì nó rất phù hợp cho việc search theo prefix. Em sẽ tạo một Trie node, mỗi node sẽ có một map để lưu các children node, và mỗi node cũng cần lưu frequency của các query kết thúc tại node đó..."

**Interviewer:** "Ừm, nhưng em có thấy vấn đề gì không nếu em chỉ lưu frequency tại leaf node? Khi user search với một prefix, em sẽ phải làm gì?"

**Candidate:** "À đúng rồi ạ, nếu em chỉ lưu ở leaf node thì khi search với prefix, em sẽ phải traverse toàn bộ subtree từ prefix node đó để tìm tất cả các query, rồi sort lại theo frequency. Điều này sẽ rất chậm nếu subtree lớn. Vậy em nghĩ là em nên pre-compute và lưu luôn top k queries tại mỗi node. Như vậy khi search, em chỉ cần đi đến prefix node và lấy ra danh sách top k queries đã được lưu sẵn..."

**Interviewer:** "Hay đấy. Nhưng vậy thì khi em insert một query mới hoặc update frequency của một query cũ, em sẽ phải update top k list ở tất cả các node trên đường đi từ root đến leaf phải không? Điều này có ảnh hưởng gì đến complexity?"

**Candidate:** "Dạ đúng ạ. Khi insert hoặc update, em sẽ phải traverse từ root xuống và update top k list ở mỗi node trên đường đi. Với mỗi node, em cần merge query mới vào danh sách top k hiện tại. Nếu em dùng min heap để maintain top k thì operation này sẽ mất O log k time. Độ sâu của Trie là L với L là độ dài trung bình của query, vậy insert operation sẽ có complexity là O của L nhân log k..."

**Interviewer:** "Tốt. Nhưng em nghĩ sao về việc maintain top k list này? Nếu k lớn, ví dụ k bằng một nghìn, thì việc lưu một nghìn queries tại mỗi node có wasteful không?"

**Candidate:** "Dạ em thấy đây là một trade-off giữa space và time ạ. Nếu em lưu ít hơn thì sẽ tiết kiệm space nhưng query time sẽ chậm hơn vì phải traverse subtree. Còn nếu lưu nhiều thì query sẽ nhanh nhưng tốn space. Với production system như Google Search, em nghĩ việc optimize cho query time là quan trọng hơn vì query frequency cao hơn nhiều so với update frequency. Hơn nữa, em có thể áp dụng một số optimization như chỉ lưu top k tại các node hay được query, còn các node khác thì compute on-demand..."

**Interviewer:** "Interesting. Vậy giờ em implement cho mình xem. Em có thể explain từng bước trong khi code không?"

**Candidate:** "Dạ được ạ. Đầu tiên em sẽ tạo class TrieNode. Mỗi node cần có một Map để lưu children, key là character còn value là TrieNode tiếp theo. Em cũng cần một field để lưu danh sách top queries, em sẽ dùng array để lưu các object chứa query string và frequency. Sau đó em sẽ tạo class AutocompleteSystem với method insert để thêm query mới và method search để lấy suggestions..."

**Interviewer:** "Khoan đã. Em vừa nói là dùng array để lưu top queries. Vậy khi insert một query mới, em sẽ update array này như thế nào? Em có maintain sorted order không?"

**Candidate:** "Dạ em sẽ maintain sorted order luôn ạ. Khi insert một query, nếu query đó đã có trong top list thì em tăng frequency và resort. Nếu chưa có thì em check xem frequency của nó có lớn hơn query cuối cùng trong top list không. Nếu có thì em insert vào đúng vị trí để maintain sorted order. Em có thể dùng binary search để tìm vị trí insert, mất O log k time, rồi shift các elements phía sau, mất O k time..."

**Interviewer:** "Ờ nhưng mà việc shift elements trong array tốn O k time như em nói. Nếu k lớn thì không tốt lắm. Em có cách nào optimize hơn không?"

**Candidate:** "À dạ, em nghĩ ra rồi ạ. Thay vì dùng array, em có thể dùng một data structure khác. Em có thể dùng một TreeMap hoặc balanced BST để lưu các query được sort theo frequency. Như vậy insert và delete sẽ chỉ mất O log k time. Nhưng khi return kết quả, em cũng cần traverse để lấy top k elements, điều này vẫn mất O k time..."

**Interviewer:** "Vậy so với array thì approach này có lợi thế gì?"

**Candidate:** "Dạ lợi thế là ở insert time ạ. Với array thì insert worst case là O k vì phải shift, còn với BST thì chỉ O log k. Về query time thì cả hai đều O k khi phải return k results. Nhưng thực tế thì với k nhỏ như mười hoặc hai mươi suggestions thì difference không đáng kể. Em nghĩ với Google Search, k thường là khoảng mười, nên dùng array có lẽ đơn giản hơn và cache-friendly hơn vì data locality tốt hơn..."

**Interviewer:** "Good point về cache locality. Vậy em tiếp tục implement đi, dùng approach nào em thấy tốt nhất."

**Candidate:** "Dạ em sẽ dùng array cho đơn giản ạ. Vậy trong TrieNode, em có children map và topQueries array. Bây giờ em implement method insert. Em sẽ traverse từ root theo từng character của query. Nếu character chưa tồn tại trong children map thì em tạo node mới. Sau khi traverse hết query, em mark node cuối là end of word và update frequency. Sau đó em phải backtrack và update topQueries của tất cả các node trên đường đi..."

**Interviewer:** "Em nói backtrack. Vậy em có nghĩ đến việc dùng recursion hay iteration? Trade-off của mỗi cách là gì?"

**Candidate:** "Dạ đây là điểm hay ạ. Nếu em dùng recursion thì code sẽ clean hơn, dễ hiểu hơn. Nhưng với query dài thì call stack có thể deep và tốn memory. Với iteration, em sẽ phải manually maintain một stack hoặc parent pointers để có thể backtrack. Em nghĩ với độ dài query trung bình của Google Search khoảng năm mươi đến một trăm characters, recursion depth không quá lớn, nên em chọn recursion cho code rõ ràng hơn..."

**Interviewer:** "Okay. Nhưng production system phải handle được edge cases. Nếu có ai đó gửi một query dài hàng nghìn characters để exploit system thì sao?"

**Candidate:** "Dạ đúng ạ, em cần phải validate input. Em sẽ set một max length cho query, ví dụ hai trăm characters, và reject hoặc truncate các query vượt quá giới hạn này. Đây cũng là một biện pháp để prevent DOS attack. Em cũng cần sanitize input để tránh các special characters hoặc injection attacks..."

**Interviewer:** "Tốt. Giờ nói về space complexity. Worst case, Trie của em sẽ tốn bao nhiêu space?"

**Candidate:** "Dạ worst case là khi tất cả các query không share prefix gì cả, ví dụ như random strings. Nếu em có n queries, mỗi query có độ dài trung bình L, thì số node trong Trie sẽ là O của n nhân L. Mỗi node lưu top k queries, mỗi query có string và frequency, vậy mỗi node tốn O của k nhân L space cho topQueries array. Tổng space complexity là O của n nhân L nhân k nhân L, tức là O của n nhân L bình nhân k..."

**Interviewer:** "Em thấy con số đó có lớn không? Ví dụ với một triệu queries, độ dài trung bình năm mươi, k bằng mười?"

**Candidate:** "Dạ tính ra sẽ là một triệu nhân năm mươi nhân năm mươi nhân mười... à em tính sai rồi ạ. Thực ra mỗi query string em chỉ cần lưu reference hoặc ID thôi, không cần lưu full string ở mỗi node. Nếu em dùng một global map để lưu mapping từ ID đến string, và trong topQueries chỉ lưu ID với frequency, thì mỗi entry trong topQueries chỉ tốn O một space. Như vậy space cho topQueries ở mỗi node sẽ chỉ là O k. Tổng space complexity sẽ giảm xuống còn O của n nhân L cộng tổng số nodes nhân k..."

**Interviewer:** "Chính xác. Đây là một optimization quan trọng. Vậy em code luôn đi, bao gồm cả optimization này nhé."

**Candidate:** "Dạ vâng ạ. Em bắt đầu code. Em sẽ tạo một Map global để lưu queryId map với query string. Mỗi khi có query mới, em assign một ID duy nhất, increment từ zero. Trong TrieNode, topQueries sẽ là array của objects chứa queryId và frequency thay vì full string. Khi return results, em sẽ map queryId trở lại string. Em cũng cần method để update topQueries, em sẽ tạo một helper function updateTopQueries, function này nhận vào queryId và frequency mới, rồi update array topQueries..."

**Interviewer:** "Được rồi. Bây giờ chúng ta move on, em đã explain khá rõ approach rồi. Giờ mình muốn hỏi về một optimization khác. Trong real-world, Google có hàng tỷ queries. Làm sao để fit cả Trie vào memory?"

**Candidate:** "Dạ đây là vấn đề rất thực tế ạ. Em nghĩ sẽ có nhiều approach. Thứ nhất là em có thể shard Trie theo prefix. Ví dụ các query bắt đầu bằng chữ a sẽ đi vào một Trie, chữ b vào Trie khác. Như vậy em có thể distribute Trie across multiple machines. Thứ hai là em có thể cache chỉ các queries phổ biến. Theo quy luật Zipf's law, một số lượng nhỏ queries chiếm majority của traffic. Em có thể keep trong memory chỉ top một triệu queries và các prefix của chúng, còn lại store ở disk hoặc remote cache như Memcached..."

**Interviewer:** "Hay đấy. Vậy nếu em shard theo prefix, khi user gõ một query, em sẽ route request đến machine nào?"

**Candidate:** "Dạ em sẽ dựa vào first character của prefix. Em có một hash function hoặc simple mapping từ character đến machine ID. Ví dụ character từ a đến d đi vào machine một, e đến h vào machine hai... Hoặc em có thể dùng consistent hashing để dễ scale khi thêm machines. Khi user gõ apple, em extract first character a, route request đến machine phụ trách a..."

**Interviewer:** "Nhưng nếu queries distribution không uniform thì sao? Ví dụ queries bắt đầu bằng s rất nhiều vì từ search, shopping, social... thì machine đó sẽ bị overload?"

**Candidate:** "Dạ đúng là có issue đó ạ. Em cần phải balance load tốt hơn. Em có thể shard theo hai hoặc ba first characters thay vì một. Hoặc em có thể dùng một load balancer thông minh hơn, monitor traffic của từng machine và adjust sharding strategy dynamically. Em cũng có thể replicate các hot prefix lên nhiều machines để distribute load. Ví dụ nếu prefix s quá hot, em có thể có ba machines cùng serve prefix s, request được round-robin hoặc load-balanced giữa ba machines đó..."

**Interviewer:** "Excellent. Vậy em đã có big picture rồi. Giờ chúng ta wrap up phần này. Em có câu hỏi gì về bài toán không?"

**Candidate:** "Dạ em có một question ạ. Trong thực tế, Google có cho phép personalized suggestions dựa trên search history của user không? Nếu có thì em sẽ integrate vào Trie như thế nào ạ?"

**Interviewer:** "Câu hỏi hay. Đúng là có personalization. Nhưng em nghĩ có nên integrate trực tiếp vào Trie không? Hay nên là một separate layer?"

**Candidate:** "Dạ em nghĩ nên là separate layer ạ. Vì Trie này serve global top queries, còn personalization là per-user data. Em có thể có một service riêng để track user's search history và preferences. Khi user search, em query cả global Trie và personalization service, rồi merge results với một ranking algorithm, có thể dùng machine learning model để rank based on global popularity, personal history, và context như location, time of day..."

**Interviewer:** "Perfect. Okay chúng ta move sang bài tiếp theo."

### Phần 2: JavaScript Advanced (45 phút)

**Interviewer:** "Bài tiếp theo về JavaScript nâng cao. Em hãy implement một function retry, function này nhận vào một async function và số lần retry tối đa. Nếu async function fail, nó sẽ tự động retry cho đến khi succeed hoặc hết số lần retry. Em sẽ làm như thế nào?"

**Candidate:** "Dạ em hiểu rồi ạ. Vậy function retry sẽ nhận vào một async function fn và một số maxRetries. Em sẽ tạo một wrapper function, function này sẽ try call fn. Nếu fn reject thì em catch error và retry lại. Em sẽ track số lần đã retry, nếu vượt quá maxRetries thì em throw error cuối cùng..."

**Interviewer:** "Okay. Vậy em sẽ implement retry logic bằng recursion hay iteration?"

**Candidate:** "Dạ em nghĩ dùng recursion sẽ clean hơn ạ. Em sẽ tạo một inner async function attemptCall, function này nhận vào attemptNumber hiện tại. Function sẽ try await fn, nếu succeed thì return result. Nếu fail thì check attemptNumber, nếu còn retries thì gọi đệ quy attemptCall với attemptNumber cộng một, nếu hết retries thì throw error..."

**Interviewer:** "Ừ nhưng em có nghĩ về stack overflow không? Nếu maxRetries lớn?"

**Candidate:** "À dạ, em nghĩ với async function thì không có vấn đề stack overflow ạ. Vì khi em await, execution context sẽ được giải phóng, không bị giữ trên call stack như synchronous recursion. Mỗi lần retry là một async call mới, không accumulate stack frames..."

**Interviewer:** "Chính xác. Vậy em có biết về tail call optimization không? JavaScript engine có support không?"

**Candidate:** "Dạ em có nghe về tail call optimization ạ. Đây là kỹ thuật compiler optimization khi function cuối cùng là một function call và không có operation nào sau đó, thì compiler có thể reuse stack frame thay vì tạo mới. Nhưng em biết là JavaScript engine support rất limited, chỉ có Safari WebKit có implement proper tail call optimization trong strict mode, còn Chrome V8 đã remove support. Nên trong practice thì em không rely vào tail call optimization..."

**Interviewer:** "Good. Vậy quay lại bài toán, em implement đi."

**Candidate:** "Dạ vâng. Em sẽ viết function retry nhận fn và maxRetries. Bên trong em tạo async function attemptCall nhận attemptNumber. Function này wrap fn call trong try catch block. Nếu succeed thì return result. Trong catch block, em check nếu attemptNumber nhỏ hơn maxRetries thì em gọi lại attemptCall với attemptNumber cộng một. Nếu không thì em throw error. Cuối cùng em return attemptCall với attemptNumber ban đầu là zero..."

**Interviewer:** "Okay. Bây giờ em thêm một feature: delay giữa các lần retry. Em sẽ làm thế nào?"

**Candidate:** "Dạ em sẽ thêm một parameter delay vào function retry. Trong catch block, trước khi retry, em sẽ await một Promise mà resolve sau delay milliseconds. Em có thể tạo một helper function sleep nhận milliseconds, function này return một Promise mà set timeout để resolve sau đúng thời gian đó. Sau khi await sleep thì em mới gọi attemptCall tiếp theo..."

**Interviewer:** "Hay. Nhưng trong production, thường người ta không dùng fixed delay. Em có biết về exponential backoff không?"

**Candidate:** "Dạ có ạ. Exponential backoff là strategy mà delay giữa các retry tăng exponentially. Ví dụ lần đầu delay một giây, lần hai delay hai giây, lần ba delay bốn giây... Điều này giúp tránh overwhelm server khi server đang có issue. Em sẽ modify để delay được tính bằng base delay nhân hai mũ attemptNumber. Em cũng có thể thêm một max delay để cap upper bound..."

**Interviewer:** "Chính xác. Vậy còn jitter thì sao? Em có biết không?"

**Candidate:** "Dạ jitter là việc thêm một randomness vào delay ạ. Ví dụ thay vì delay chính xác bốn giây, em có thể delay từ ba đến năm giây randomly. Mục đích là tránh thundering herd problem, tức là khi có nhiều clients cùng retry đồng thời, nếu cùng delay thì sẽ cùng hit server cùng lúc, tạo spike. Với jitter thì các requests sẽ spread out hơn. Em sẽ thêm một random value vào computed delay..."

**Interviewer:** "Excellent. Giờ em implement full version với exponential backoff và jitter đi."

**Candidate:** "Dạ vâng ạ. Em sẽ thêm parameters baseDelay, maxDelay vào retry function. Trong attemptCall, em tính actualDelay bằng baseDelay nhân hai mũ attemptNumber, nhưng không vượt quá maxDelay. Sau đó em thêm jitter bằng cách nhân actualDelay với một random number từ zero point five đến một point five, hoặc có thể dùng formula khác. Rồi em await sleep với actualDelay này trước khi retry..."

**Interviewer:** "Tốt. Bây giờ mình hỏi về edge case. Nếu fn không phải là async function mà là sync function throw error thì sao?"

**Candidate:** "Dạ nếu fn là sync function throw error thì khi em await fn, JavaScript sẽ tự động wrap error đó trong một rejected Promise. Nên catch block của em vẫn sẽ catch được error và retry bình thường. Nhưng nếu fn là sync function return value thì await sẽ wrap value trong resolved Promise. Vậy code của em vẫn work cho cả sync và async functions..."

**Interviewer:** "Đúng rồi. Nhưng có một edge case nữa. Nếu fn không phải là function thì sao?"

**Candidate:** "À dạ, em cần validate input. Em sẽ check typeof fn bằng function ở đầu retry function. Nếu không phải function thì em throw một TypeError với message rõ ràng. Đây là defensive programming practice..."

**Interviewer:** "Good. Giờ mình hỏi về memory leak. Trong implementation của em, có potential memory leak nào không?"

**Candidate:** "Dạ để em nghĩ... Em nghĩ nếu fn tạo ra resources như event listeners, timers, hoặc file handles mà không cleanup, thì mỗi lần retry sẽ create thêm resources mà không release. Nhưng đây là issue của fn itself chứ không phải của retry function. Về phía retry function, em không thấy leak rõ ràng vì em không hold references gì persist sau khi retry complete hay fail..."

**Interviewer:** "Đúng. Nhưng nếu em muốn support cancellation thì sao? Ví dụ user muốn cancel retry process?"

**Candidate:** "Dạ đây là feature hay ạ. Em sẽ thêm support cho AbortSignal. Em add parameter signal vào retry function, signal này là instance của AbortSignal. Trong attemptCall, trước khi retry, em check signal.aborted. Nếu true thì em throw một AbortError. Em cũng có thể listen vào abort event của signal để cancel ngay lập tức thay vì phải chờ đến lần retry tiếp theo..."

**Interviewer:** "Hay đấy. Vậy nếu fn cũng accept AbortSignal thì sao? Em sẽ pass signal vào fn như thế nào?"

**Candidate:** "Dạ em sẽ modify để fn có thể nhận signal. Khi call fn, em pass signal như một parameter. Ví dụ fn có signature async function fn signal. Nhưng vấn đề là không phải fn nào cũng expect signal parameter. Em có thể make it optional, hoặc em có thể check fn.length để xem fn expect bao nhiêu parameters. Nếu expect một parameter thì em pass signal, nếu không thì em call without arguments..."

**Interviewer:** "Ừm, nhưng cách đó không reliable vì fn có thể có default parameters hoặc rest parameters. Em có cách nào tốt hơn không?"

**Candidate:** "Dạ em nghĩ approach tốt hơn là let caller decide. Em có thể modify retry để nhận một function factory thay vì direct function. Hoặc em có thể document rằng nếu fn muốn support cancellation thì phải handle signal internally, và retry function chỉ check signal trước mỗi retry. Đây là separation of concerns, retry function handle retry logic, fn handle cancellation logic..."

**Interviewer:** "Okay makes sense. Giờ nói về error handling. Nếu em muốn distinguish giữa các loại errors để decide có nên retry hay không? Ví dụ network timeout thì nên retry, nhưng authentication error thì không nên retry?"

**Candidate:** "Dạ đây là use case thực tế ạ. Em sẽ thêm một parameter shouldRetry, đây là một function nhận error và return boolean. Trong catch block, trước khi retry, em check shouldRetry của error. Nếu return false thì em throw error ngay, không retry. Nếu return true thì em proceed với retry. Caller có thể provide custom logic để check error type, status code, hay error message..."

**Interviewer:** "Perfect. Vậy với tất cả các features em vừa nói, final signature của retry function sẽ là gì?"

**Candidate:** "Dạ em nghĩ sẽ là async function retry với parameters: fn là function cần retry, options là object chứa maxRetries, baseDelay, maxDelay, shouldRetry function, và signal. Em dùng options object để flexible hơn, dễ extend sau này. Em cũng có thể set default values cho các options..."

**Interviewer:** "Tốt lắm. Bây giờ câu hỏi cuối về bài này. Em implement retry function như vậy thì complexity là bao nhiêu, và có optimization nào không?"

**Candidate:** "Dạ time complexity depend on fn execution time và number of retries. Nếu fn mất T time và em retry R lần thì worst case là O của R nhân T. Space complexity là O một vì em không store intermediate results, chỉ có recursive call stack nhưng như em đã nói async không tạo stack frames. Về optimization, em nghĩ có thể cache successful result nếu fn is idempotent và expensive. Em cũng có thể track statistics như số lần retry, total time, để monitoring và debugging..."

**Interviewer:** "Excellent. Được rồi, em đã cover khá comprehensive rồi. Move on bài cuối của round này."

### Phần 3: UI Component Implementation (30 phút)

**Interviewer:** "Bài cuối cùng, em sẽ implement một virtualized list component. Em có biết virtualized list là gì không?"

**Candidate:** "Dạ em biết ạ. Virtualized list là technique để render large list efficiently bằng cách chỉ render các items đang visible trong viewport thay vì render toàn bộ list. Khi user scroll, các items cũ bị remove khỏi DOM và items mới được add vào. Điều này giúp giảm số lượng DOM nodes và improve performance khi có hàng nghìn hoặc triệu items..."

**Interviewer:** "Chính xác. Vậy em implement một React component VirtualizedList. Component nhận props items là array of data, và renderItem là function để render mỗi item. Em sẽ approach như thế nào?"

**Candidate:** "Dạ đầu tiên em cần tính toán xem có bao nhiêu items có thể fit trong viewport. Em sẽ cần biết height của container và height của mỗi item. Giả sử mỗi item có fixed height, em có thể tính số visible items bằng container height chia cho item height. Sau đó dựa vào scroll position, em tính xem items nào đang visible và chỉ render những items đó..."

**Interviewer:** "Ừ nhưng em nói fixed height. Trong real-world, items thường có dynamic height. Em sẽ handle như thế nào?"

**Candidate:** "Dạ đúng là khó hơn nhiều với dynamic height ạ. Với fixed height thì em có thể calculate everything với simple math. Nhưng với dynamic height, em không thể biết trước height của mỗi item cho đến khi nó được render. Em sẽ cần maintain một map hoặc array để store actual height của mỗi item sau khi render. Initially em có thể estimate average height, rồi measure actual height sau khi mount và update lại calculations..."

**Interviewer:** "Hay. Vậy em sẽ measure height như thế nào?"

**Candidate:** "Dạ em sẽ dùng ref để get reference đến DOM element của mỗi item. Sau khi component mount, trong useEffect em call getBoundingClientRect hoặc offsetHeight để get actual height. Em store height này vào state hoặc một ref. Mỗi khi có items được render hoặc content change, em phải re-measure. Nhưng vấn đề là việc này có thể cause layout thrashing nếu measure và update quá nhiều. Em cần debounce hoặc batch measurements..."

**Interviewer:** "Chính xác về layout thrashing. Vậy em có biết về IntersectionObserver API không? Có thể dùng được không?"

**Candidate:** "Dạ có ạ, IntersectionObserver là API để observe khi elements enter hoặc exit viewport. Em có thể dùng IntersectionObserver để detect khi item nào đang visible thay vì manually calculate based on scroll position. Điều này performant hơn vì browser handle calculation internally. Em create một IntersectionObserver, observe tất cả item elements, và trong callback em sẽ biết được items nào intersect với viewport..."

**Interviewer:** "Tốt. Nhưng với virtualized list, em không render all items mà chỉ render visible items. Vậy làm sao em observe items chưa render?"

**Candidate:** "À dạ đúng rồi ạ, đây là catch twenty two. Em không thể observe items chưa exist trong DOM. Vậy em vẫn phải dùng scroll position để calculate visible range. Nhưng em có thể dùng IntersectionObserver cho một mục đích khác: detect khi user scroll đến top hoặc bottom của visible range để load thêm items, như infinite scroll. Hoặc em có thể dùng để detect visibility của sentinel elements đặt ở đầu và cuối visible range..."

**Interviewer:** "Interesting approach. Vậy quay lại implementation, em sẽ manage scroll position như thế nào?"

**Candidate:** "Dạ em cần listen scroll event trên container element. Em tạo một ref cho container, attach scroll event listener trong useEffect. Trong event handler, em get scrollTop value, đây là số pixels đã scroll từ top. Dựa vào scrollTop và item heights, em calculate startIndex và endIndex của visible items. Em store startIndex và endIndex vào state, và chỉ render items từ startIndex đến endIndex..."

**Interviewer:** "Em nói listen scroll event. Vậy em có concern gì về performance không? Scroll event fire rất frequently."

**Candidate:** "Dạ đúng ạ, scroll event có thể fire hàng trăm lần per second khi user scroll nhanh. Nếu em update state mỗi lần scroll event fire thì sẽ cause quá nhiều re-renders. Em cần throttle hoặc debounce scroll handler. Với throttle, em sẽ limit số lần handler được execute trong một time window, ví dụ maximum một lần per mười ms. Với debounce, em sẽ wait cho user stop scrolling một khoảng time trước khi execute handler..."

**Interviewer:** "Vậy trong trường hợp này em chọn throttle hay debounce? Tại sao?"

**Candidate:** "Dạ em chọn throttle ạ. Vì với debounce, handler chỉ execute khi user stop scrolling, nghĩa là trong lúc scrolling thì items sẽ không update, user sẽ thấy blank space hoặc wrong items. Với throttle, handler vẫn execute periodically trong lúc scrolling, chỉ là limit frequency, nên items sẽ update smooth hơn. Em có thể dùng requestAnimationFrame thay vì set timeout để sync với browser repaint cycle, điều này optimize hơn nữa..."

**Interviewer:** "Excellent. Vậy em có biết về passive event listeners không? Có liên quan không?"

**Candidate:** "Dạ có ạ, passive event listeners là option em pass khi add event listener, indicate rằng listener sẽ không call preventDefault. Điều này allow browser optimize scroll performance vì browser không cần phải wait cho listener execute để check xem scroll có bị prevent không. Với scroll event listener, em nên set passive true. Ví dụ addEventListener scroll, handler, passive true. Nhưng em cần cẩn thận vì nếu set passive mà trong handler có call preventDefault thì sẽ bị ignore và console warning..."

**Interviewer:** "Perfect. Giờ nói về rendering. Khi em chỉ render visible items, em sẽ position chúng như thế nào để đúng vị trí trong scroll container?"

**Candidate:** "Dạ em cần set correct offset cho visible items. Em sẽ wrap visible items trong một container div, và set position absolute hoặc relative. Em calculate offsetTop cho container này bằng tổng heights của tất cả items trước startIndex. Ví dụ nếu startIndex là một trăm và mỗi item cao năm mươi px thì offsetTop sẽ là năm nghìn px. Em set style transform translateY với offsetTop này để đẩy visible items xuống đúng vị trí. Em cũng cần một spacer div với height bằng tổng height của toàn bộ list để maintain correct scrollbar size..."

**Interviewer:** "Em nói transform translateY. Tại sao không dùng top hay margin-top?"

**Candidate:** "Dạ vì transform performant hơn ạ. Khi em change top hoặc margin, browser phải reflow và recalculate layout của toàn bộ page. Nhưng với transform, browser có thể optimize bằng GPU acceleration và không trigger reflow. Transform chỉ affect composite layer. Đây là best practice cho animation và dynamic positioning. Em cũng có thể thêm will-change transform để hint cho browser optimize further..."

**Interviewer:** "Tốt lắm. Bây giờ em nghĩ về một edge case: nếu items có different heights và heights change dynamically based on content, ví dụ expandable items?"

**Candidate:** "Dạ đây là challenge lớn ạ. Khi item height change, em phải re-measure và update stored heights. Điều này affect calculations của tất cả items sau item đó vì total offset change. Em sẽ cần trigger re-calculation of visible range và re-render. Em có thể expose một API cho parent component hoặc item component để notify khi height change. Ví dụ một callback onHeightChange được pass vào renderItem function. Khi item expand hoặc collapse, nó call callback này, và virtualized list component update heights và re-calculate..."

**Interviewer:** "Okay. Vậy còn về accessibility thì sao? Virtualized list có issues gì?"

**Candidate:** "Dạ có một số accessibility concerns ạ. Thứ nhất, screen readers có thể không announce correct total number of items vì DOM chỉ chứa visible items. Em cần set aria attributes để indicate total count, ví dụ aria-setsize và aria-posinset trên mỗi item. Thứ hai, keyboard navigation có thể bị broken vì items ngoài viewport không có trong DOM, nên user không thể tab hoặc arrow key đến. Em cần manually handle keyboard events để scroll và render items when user navigate bằng keyboard..."

**Interviewer:** "Hay đấy. Vậy em có biết về react-window hoặc react-virtualized libraries không? Em có dùng qua không?"

**Candidate:** "Dạ em có dùng react-window ạ. Đây là library của Brian Vaughn, core team React. Library này provide FixedSizeList và VariableSizeList components đã implement tất cả những gì em vừa discuss. react-window lightweight hơn react-virtualized và performance tốt hơn. Nhưng hiểu underlying implementation như em vừa explain giúp em debug issues và customize behavior khi cần. Em cũng có thể extend hoặc fork library nếu requirements đặc biệt..."

**Interviewer:** "Excellent. Được rồi em đã demonstrate khá sâu về virtualized list. Time complexity của solution em là bao nhiêu?"

**Candidate:** "Dạ với fixed height items, calculate visible range là O một vì chỉ cần chia scrollTop cho item height. Rendering là O của k với k là số visible items, không depend on total n items. Vậy overall là O k. Với variable height, calculate visible range worst case có thể là O n nếu em phải iterate qua tất cả items để tính cumulative heights. Nhưng em có thể optimize bằng prefix sum array để reduce về O log n với binary search. Space complexity là O n để store heights của n items..."

**Interviewer:** "Perfect. Okay em đã hoàn thành round một rất tốt. Chúng ta break mười lăm phút nhé."

---

## ROUND 2: FRONTEND SYSTEM DESIGN (2 tiếng)

**Interviewer:** "Xin chào em, mình là Michael, Tech Lead của Google Docs team. Round này chúng ta sẽ discuss về system design. Em đã nghỉ ngơi đủ chưa?"

**Candidate:** "Dạ vâng, em đã sẵn sàng ạ."

**Interviewer:** "Tốt. Hôm nay em sẽ design một collaborative document editor giống Google Docs. Đây là một complex system nên chúng ta sẽ break down từng phần. Đầu tiên, em có câu hỏi gì về requirements không?"

**Candidate:** "Dạ em có một vài câu hỏi ạ. Về scale, em cần support bao nhiêu concurrent users trên một document? Và có giới hạn về document size không? Về features, em cần support formatting như bold, italic, hay chỉ plain text? Và có cần support comments, suggestions mode như Google Docs không ạ?"

**Interviewer:** "Hay là em assume tầm năm mươi concurrent users per document, document size max khoảng năm MB. Em cần support rich text formatting cơ bản: bold, italic, underline, font size, color. Comments thì có, nhưng suggestions mode có thể là nice-to-have, không required. Vậy em sẽ bắt đầu từ đâu?"

**Candidate:** "Dạ em nghĩ đầu tiên em cần define high-level architecture. Hệ thống sẽ có frontend client chạy trên browser, backend servers để handle business logic và coordination, và database để persist data. Em cũng cần real-time communication layer, có thể dùng WebSocket hoặc Server-Sent Events để push updates từ server đến clients. Em sẽ bắt đầu với data model, vì đây là foundation của toàn bộ system..."

**Interviewer:** "Okay tốt. Vậy em sẽ represent document content như thế nào? Plain string có đủ không?"

**Candidate:** "Dạ không ạ, plain string không đủ vì em cần track formatting. Em có thể dùng một structured format. Một approach là represent document như một tree structure, giống DOM. Mỗi node có thể là text node hoặc element node với formatting properties. Ví dụ một paragraph node chứa text nodes và inline format nodes như bold, italic. Nhưng với approach này, apply operations như insert hoặc delete text sẽ phức tạp vì phải navigate tree và update multiple nodes..."

**Interviewer:** "Ừ. Vậy em có biết về alternative representations không? Ví dụ như Delta hoặc CRDT?"

**Candidate:** "Dạ em có nghe về Delta format của Quill editor ạ. Delta represent document như một array of operations, mỗi operation describe một piece of content với attributes. Ví dụ insert 'Hello' với bold true, rồi insert ' world' với bold false. Đây là compact và dễ serialize. Về CRDT, đây là Conflict-free Replicated Data Types, được design cho collaborative editing. CRDTs guarantee eventual consistency mà không cần central coordination. Ví dụ như Yjs library implement CRDT for text editing..."

**Interviewer:** "Em biết khá nhiều đấy. Vậy giữa Delta và CRDT, em chọn cái nào và tại sao?"

**Candidate:** "Dạ em nghĩ cho Google Docs scale thì CRDT tốt hơn ạ. Vì với Delta, khi có concurrent edits từ multiple users, em cần operational transformation để resolve conflicts, đây là complex algorithm. Với CRDT, conflicts được resolve automatically based on mathematical properties. Mỗi user có một local replica của document, changes được merge mà không cần server coordination. Điều này reduce latency và allow offline editing. Tuy nhiên CRDT có overhead về memory và network bandwidth vì phải maintain metadata for each character..."

**Interviewer:** "Hay. Nhưng em nói CRDT reduce server coordination. Vậy em có cần server không? Có thể pure peer-to-peer không?"

**Candidate:** "Dạ em vẫn cần server ạ. Tuy CRDT allow local merging, nhưng em cần server để làm source of truth, persist data, và broadcast changes đến các clients khác. Pure P2P có issues về NAT traversal, firewall, và không reliable. Server cũng handle authentication, authorization, và versioning. Em có thể có một hybrid approach: clients sync với server, nhưng nếu server down hoặc network issue, clients vẫn có thể continue editing locally và sync sau..."

**Interviewer:** "Makes sense. Giờ nói về real-time sync. Em sẽ implement như thế nào để khi user A type, user B thấy ngay?"

**Candidate:** "Dạ em sẽ dùng WebSocket connection giữa client và server. Khi user A type một character, client A tạo một change event describe the change, ví dụ insert char x at position y. Client A send event qua WebSocket đến server. Server receive event, validate, apply lên server state, persist to database, và broadcast event đến tất cả connected clients khác của cùng document. Client B receive event qua WebSocket, merge change vào local state, và update UI. Toàn bộ process này nên xảy ra trong vài chục milliseconds để feel real-time..."

**Interviewer:** "Em nói validate ở server. Validate những gì?"

**Candidate:** "Dạ em validate nhiều thứ ạ. Thứ nhất, check permissions xem user A có quyền edit document không. Thứ hai, validate operation itself, ví dụ position có valid không, có out of bounds không. Thứ ba, check cho concurrent conflicts. Nếu user A và user B cùng edit cùng position, em phải resolve conflict. Với CRDT thì conflict resolution tự động, nhưng em vẫn cần validate to prevent malicious operations hoặc bugs..."

**Interviewer:** "Okay. Vậy nói về performance, nếu có năm mươi users cùng typing, server phải handle năm mươi WebSocket messages và broadcast mỗi message đến bốn mươi chín users khác. Đó là rất nhiều messages. Em optimize như thế nào?"

**Candidate:** "Dạ em có một số optimization strategies ạ. Thứ nhất, em có thể batch operations. Thay vì send mỗi keystroke ngay lập tức, client có thể buffer changes trong một khoảng time ngắn, ví dụ năm mươi ms, và send một batch of operations. Điều này reduce số messages. Thứ hai, em có thể use compression cho message payload, ví dụ gzip hoặc brotli. Thứ ba, ở server side, em có thể use efficient broadcast mechanism. Thay vì loop qua tất cả clients và send individually, em có thể use pub-sub pattern với message queues như Redis..."

**Interviewer:** "Em nói batch operations. Nhưng điều đó có tăng latency không? User có thể thấy delay?"

**Candidate:** "Dạ đúng là có trade-off ạ. Nếu em batch quá lâu thì latency tăng, user experience kém. Nhưng năm mươi ms là rất nhỏ, con người khó perceive được. Em cũng có thể dynamic adjust batch interval based on network conditions. Nếu network fast và low latency, em có thể reduce batch time. Nếu network slow, em increase để save bandwidth. Em cũng có thể differentiate: user's own edits reflected locally ngay lập tức trong UI optimistically, còn sync với server và other users thì batched..."

**Interviewer:** "Hay đấy, optimistic UI updates. Vậy nếu operation failed ở server thì em rollback như thế nào?"

**Candidate:** "Dạ khi client send operation, client apply operation locally ngay để UI responsive. Client cũng mark operation as pending. Khi server acknowledge success, client clear pending flag. Nếu server reject operation, ví dụ vì conflict hoặc permission issue, server send error response. Client nhận error, rollback local operation, và có thể show error message cho user. Việc rollback có thể tricky nếu user đã continue typing sau đó. Em cần maintain một queue of pending operations và undo correctly..."

**Interviewer:** "Chính xác, rollback rất tricky. Có approach nào tránh rollback không?"

**Candidate:** "Dạ một approach là client không apply optimistically mà wait cho server confirmation. Nhưng điều này tăng perceived latency, user sẽ feel laggy. Một approach khác là dùng server-side validation trước khi broadcast. Server validate operation đầu tiên, nếu invalid thì reject ngay và không broadcast. Client chỉ apply locally sau khi receive từ server broadcast. Điều này đảm bảo client state luôn consistent với server. Nhưng latency sẽ cao hơn vì round-trip time..."

**Interviewer:** "Trade-offs luôn. Vậy về offline support, nếu user mất connection, em handle như thế nào?"

**Candidate:** "Dạ khi detect connection loss, client switch sang offline mode. User vẫn có thể continue editing, tất cả changes được queue locally. Client có thể persist queue to localStorage để survive page refresh. Khi connection restored, client send queued operations đến server. Server apply operations và send back current state. Client merge server state với local changes. Với CRDT, merge này automatic. Em cũng cần show UI indicator để user biết đang offline và changes chưa synced..."

**Interviewer:** "Nếu user offline lâu và document đã changed nhiều ở server, khi reconnect làm sao merge không bị conflict overload?"

**Candidate:** "Dạ đây là edge case khó ạ. Nếu offline quá lâu, local state có thể diverge significantly từ server state. Khi reconnect, thay vì send tất cả queued operations, client có thể request server state hiện tại. Client compare với local state, detect conflicts, và show conflict resolution UI cho user. User có thể choose keep local, keep server, hoặc manually merge. Đây giống như git merge conflicts. Nhưng với Google Docs, em nghĩ offline lâu là rare case, thường chỉ vài phút, nên CRDT automatic merge đủ..."

**Interviewer:** "Okay. Giờ nói về rendering. Em có document state trong memory, làm sao render ra UI efficiently?"

**Candidate:** "Dạ em sẽ dùng React để render UI. Document state được store trong một global state management solution như Redux hoặc Zustand. Mỗi khi có change, state update, và React re-render affected components. Nhưng nếu document lớn, re-render toàn bộ sẽ slow. Em cần optimize bằng cách break document thành smaller components, ví dụ mỗi paragraph là một component. Dùng React.memo hoặc useMemo để prevent unnecessary re-renders. Em cũng có thể virtualize rendering như bài trước, chỉ render paragraphs trong viewport..."

**Interviewer:** "Em nói mỗi paragraph là component. Nhưng khi user type vào middle of paragraph, cả paragraph re-render phải không?"

**Candidate:** "Dạ đúng ạ. Đây là limitation. Để optimize hơn nữa, em có thể break paragraph thành smaller units, ví dụ mỗi text node hoặc formatted span là một component. Nhưng điều này increase component tree complexity và có thể counterproductive. Một approach khác là dùng contentEditable div và manually update DOM thay vì rely toàn bộ vào React. Ví dụ Quill và ProseMirror editors không dùng React để render, mà manipulate DOM directly cho performance. Em có thể wrap những editors đó trong React component..."

**Interviewer:** "Hay. Em có biết về Draft.js không? Facebook's rich text editor framework."

**Candidate:** "Dạ em có biết ạ. Draft.js là framework built on React cho rich text editing. Nó provide model for content representation, editor state management, và rendering. Draft.js dùng immutable data structures để optimize re-rendering. Nhưng em nghe Draft.js không còn được maintain actively. Facebook đã chuyển sang Lexical, một framework mới modern hơn. Lexical có better performance và extensibility. Nếu em build Google Docs clone, em sẽ consider dùng Lexical hoặc ProseMirror làm foundation thay vì build từ scratch..."

**Interviewer:** "Chính xác về Lexical. Vậy ngoài rendering, em cần handle user input như thế nào? contentEditable có issues gì?"

**Candidate:** "Dạ contentEditable có nhiều quirks ạ. Behavior không consistent across browsers. Ví dụ cách handle paste, undo/redo, hoặc IME input khác nhau. Browser cũng tự động thêm các tags như span hoặc div khi user format text, gây khó khăn cho parsing. Một approach là listen các events như keydown, paste, beforeinput, prevent default behavior, và manually handle input. Em capture user intent, update internal state, và render accordingly. Đây là controlled component pattern. Nhưng implement correctly rất complex vì phải handle tất cả edge cases..."

**Interviewer:** "Em nói beforeinput event. Em có biết difference giữa beforeinput và input event không?"

**Candidate:** "Dạ beforeinput fire trước khi browser apply input vào DOM, cho phép em prevent default và handle manually. input event fire sau khi browser đã modify DOM. Với beforeinput, em có thể extract inputType và data từ event, biết user muốn làm gì, ví dụ insertText, deleteContentBackward, formatBold... Em có thể prevent event và apply change vào internal model thay vì let browser modify DOM. Điều này give em full control. Nhưng beforeinput không support đầy đủ trên tất cả browsers, đặc biệt old browsers, nên em cần fallback to keydown và input events..."

**Interviewer:** "Excellent. Giờ nói về selection và cursor. Làm sao em track cursor position của multiple users?"

**Candidate:** "Dạ mỗi user có một local cursor position. Client track cursor position bằng Selection API của browser. Khi cursor move, client send cursor position update đến server. Server broadcast đến other clients. Mỗi client render cursors của other users trên UI, có thể là colored vertical bars với user name label. Nhưng vấn đề là represent position. Nếu dùng absolute index, khi document change, position phải recalculate. Em cần một position representation mà stable khi content change. Một approach là dùng relative position trong CRDT model, hoặc path-based position như array of indices in tree structure..."

**Interviewer:** "Hay. Vậy về selections, nếu user select một range of text để copy hoặc format, em handle như thế nào?"

**Candidate:** "Dạ tương tự như cursor, em track selection range với start và end positions. User select text, client capture selection using document.getSelection API, convert to internal position format, và send to server. Server broadcast đến other clients. Other clients render selection của user đó, có thể highlight với màu transparent corresponding to user color. Khi user apply formatting lên selected text, client send operation như applyFormat bold to range start end, server apply và broadcast. Về copy, khi user copy, em serialize selected content to clipboard với rich text format, ví dụ HTML hoặc RTF, để preserve formatting khi paste to other applications..."

**Interviewer:** "Nói về paste, nếu user paste content từ external source như Word hoặc web page, có thể chứa styling không mong muốn. Em xử lý thế nào?"

**Candidate:** "Dạ khi user paste, em listen paste event. Event object chứa clipboardData với nhiều formats: text/plain, text/html, image... Em extract HTML content, parse it, và sanitize. Sanitization include remove các tags không support, inline styles không allow, scripts, event handlers... Em chỉ keep các tags và styles em support. Em có thể dùng library như DOMPurify để sanitize. Sau khi sanitize, em convert HTML to internal document format và insert vào document. Em cũng cần handle paste images, em có thể upload image đến server, get URL, và insert image node vào document..."

**Interviewer:** "Em nói upload image. Vậy với large images hoặc multiple images, làm sao handle efficiently?"

**Candidate:** "Dạ với large images, em không nên embed trực tiếp vào document dưới dạng base64 vì sẽ bloat document size. Thay vào đó, em upload image to separate storage, ví dụ S3 hoặc GCS, get URL, và store URL trong document. Khi render, em load image từ URL. Về upload process, em có thể show progress bar cho user. Em nên resize hoặc compress image trước khi upload to save bandwidth và storage. Em cũng có thể generate thumbnails cho preview nhanh. Với multiple images, em có thể upload parallel để fast hơn, nhưng limit concurrency để không overload network..."

**Interviewer:** "Tốt. Giờ về undo/redo, em sẽ implement như thế nào trong collaborative environment?"

**Candidate:** "Dạ undo/redo trong collaborative editing rất tricky ạ. Vì user A có thể undo own operation, nhưng trong khi đó user B đã make changes. Em không thể simply revert state to previous state global. Em cần implement per-user undo stack. Mỗi user có một local stack lưu own operations. Khi user press undo, em pop operation từ stack, create inverse operation, ví dụ nếu operation là insert text thì inverse là delete text, apply inverse operation và send to server. Server apply và broadcast. Nhưng nếu document đã changed bởi other users, inverse operation có thể không apply cleanly. Em cần transform inverse operation against intervening operations..."

**Interviewer:** "Phức tạp đấy. Em có biết về Operational Transformation không? Có liên quan không?"

**Candidate:** "Dạ có ạ, Operational Transformation là algorithm để transform concurrent operations để maintain consistency. Ví dụ nếu user A insert at position năm và user B insert at position ba, khi B's operation arrive at A, A phải transform own operation để adjust position. OT được dùng nhiều trong Google Docs và Google Wave trước đây. Nhưng OT rất complex, có nhiều edge cases, và cần correct implementation of transform functions. Đây là lý do nhiều người chuyển sang CRDT vì đơn giản hơn và không cần central coordination. Tuy nhiên CRDT có overhead về space và bandwidth..."

**Interviewer:** "Em nói CRDT có overhead. Cụ thể overhead là bao nhiêu?"

**Candidate:** "Dạ depend on CRDT algorithm ạ. Ví dụ với CRDT like RGA hay WOOT, mỗi character cần metadata như unique ID, gồm site ID và logical clock. Điều này có thể double hoặc triple space requirement so với plain text. Khi sync, em phải send metadata cùng với content. Nhưng có compression techniques để reduce overhead. Ví dụ em có thể use compact encoding cho IDs, hoặc send only delta changes instead of full state. Libraries như Yjs đã optimize tốt, overhead thực tế không lớn lắm, acceptable cho hầu hết use cases..."

**Interviewer:** "Okay. Giờ nói về scalability. Nếu em có hàng triệu documents và hàng nghìn concurrent documents being edited, architecture em sẽ như thế nào?"

**Candidate:** "Dạ em cần scale horizontally ạ. Em sẽ có multiple backend servers behind load balancer. Vấn đề là WebSocket connections are stateful, nên em cần sticky sessions hoặc consistent hashing để ensure user's requests đều đến cùng server. Hoặc em có thể dùng message broker như Redis Pub/Sub hoặc Kafka để broadcast messages across servers. Khi user A trên server một send change, server publish to message broker, tất cả servers subscribe nhận message và forward đến clients của chúng. Về database, em có thể shard documents across multiple databases based on document ID. Em cũng có thể cache hot documents trong memory với Redis hoặc Memcached..."

**Interviewer:** "Em nói cache documents in memory. Nhưng với real-time editing, làm sao maintain cache consistency?"

**Candidate:** "Dạ đây là challenge ạ. Khi document update, em phải invalidate cache hoặc update cache atomically. Một approach là use write-through cache: khi update document, em update both database và cache synchronously. Hoặc em có thể use cache-aside pattern: update database first, invalidate cache, lazy load vào cache khi accessed. Với Redis, em có thể use Pub/Sub để notify tất cả cache nodes khi có update. Nhưng thực tế, với documents đang được actively edited, em có thể skip caching và keep document in memory của servers handling active sessions. Chỉ persist to database periodically hoặc when session ends..."

**Interviewer:** "Hay. Vậy về versioning và revision history, em implement như thế nào?"

**Candidate:** "Dạ em cần save snapshots của document ở different points in time. Một approach đơn giản là save full snapshot mỗi interval, ví dụ mỗi năm phút hoặc sau một số thay đổi. Nhưng điều này wasteful về space. Efficient hơn là save incremental changes. Em có thể store a base snapshot và một stream of operations. Để recreate document tại một thời điểm, em apply operations từ base snapshot. Em có thể optimize bằng cách save periodic snapshots, ví dụ mỗi một trăm operations, để không phải replay quá nhiều operations. Về UI, user có thể browse revision history, select revision để view hoặc restore..."

**Interviewer:** "Em nói restore revision. Nếu user restore một old revision trong khi có other users đang editing, conflict như thế nào?"

**Candidate:** "Dạ đây là tricky case ạ. Em không nên simply replace current document với old revision vì sẽ lose other users' recent changes. Một approach là treat restore như một new operation: delete current content và insert old revision content. Với CRDT, điều này merge correctly. Other users sẽ see their own changes bị replaced, và có thể undo nếu muốn. Nhưng em nghĩ Google Docs prevent restoring khi có active editors. Em có thể show warning và require close current editing session before restore. Hoặc create a new copy của old revision instead of replace current..."

**Interviewer:** "Makes sense. Giờ nói về permissions và access control. Em handle như thế nào?"

**Candidate:** "Dạ document có permissions settings: owner, editors, viewers. Owner có full control, có thể delete, change permissions. Editors có thể edit content. Viewers chỉ có thể view, không edit. Permissions được store trong database. Khi user mở document, server check permission. Nếu user chỉ là viewer, client rendered trong read-only mode, không allow editing. Nếu editor, em enable editing. Về sharing, owner có thể invite users bằng email hoặc share link. Share link có thể là public hoặc restricted. Em cũng có thể have expiring links hoặc password-protected links..."

**Interviewer:** "Nếu permission change trong khi user đang editing, ví dụ owner revoke edit permission, em handle như thế nào real-time?"

**Candidate:** "Dạ server phải send permission change event đến affected user's client. Client nhận event, update local permission state, và disable editing UI. Nếu user đang type, em có thể show modal notification rằng permission đã changed. Pending operations sẽ bị rejected bởi server. Em cũng có thể gracefully degrade: allow user finish current edit, save locally, và show message để contact owner to regain access. Về implementation, em có thể use WebSocket để push permission updates real-time..."

**Interviewer:** "Tốt. Giờ về comments, user có thể comment on specific text range. Em model như thế nào?"

**Candidate:** "Dạ comment được attach to một text range trong document. Em store comment với start và end positions, comment text, author, timestamp. Khi document content change, positions có thể shift. Em cần update comment positions accordingly. Một approach là anchor comments to CRDT positions, which are stable. Khi render, em display comment icon hoặc highlight text range. User click vào comment icon để view comment thread. Comments có thể be nested, có replies. Em có thể use threaded comment structure. About real-time, khi user add comment, em send to server, broadcast to other clients, và other clients render comment ngay..."

**Interviewer:** "Em nói comment positions shift when content change. Nếu text được commented bị delete thì sao?"

**Candidate:** "Dạ nếu text bị delete hoàn toàn, em có options: một là delete comment luôn, hai là mark comment as orphaned hoặc resolved. Google Docs thường keep comment và attach to nearest position. User có thể see comment và biết rằng referenced text đã không còn. Owner có thể manually resolve or delete comment. Em có thể show resolved comments với strikethrough hoặc grayed out. About implementation, em track nếu comment's range không còn exist trong document, flag comment và update UI accordingly..."

**Interviewer:** "Okay. Em đã cover khá nhiều aspects. Giờ tóm tắt lại architecture tổng thể đi."

**Candidate:** "Dạ vâng ạ. High-level architecture gồm có frontend clients chạy trên browser, dùng React hoặc editor framework như Lexical. Clients connect đến backend servers qua WebSocket để real-time sync. Backend servers được scale horizontally behind load balancer, dùng Redis Pub/Sub để broadcast messages across servers. Document state được represent bằng CRDT để support collaborative editing without complex OT. Documents được persist in database, có thể sharded by document ID. Em có caching layer với Redis để improve read performance. Image và file uploads go to object storage như S3. Permission và user data stored in relational database. Revision history được saved as incremental snapshots. Comments và annotations stored separately và linked to document positions. Toàn bộ system designed để be highly available, scalable, và provide real-time collaboration experience..."

**Interviewer:** "Excellent. Em có cover most important aspects. Có điểm nào em thấy cần discuss thêm không?"

**Candidate:** "Dạ em nghĩ có một số topics em chưa đề cập sâu ạ. Ví dụ về security, em cần protect against XSS attacks khi render user content. Em phải sanitize HTML, use CSP headers. Về performance monitoring, em cần track metrics như latency, operation throughput, WebSocket connection stability. Em có thể use APM tools như Datadog. Về error handling, em cần graceful degradation khi services down. Về internationalization, support multiple languages và locales. Về mobile app, em cần consider responsive design hoặc native apps với sync protocol. Nhưng em nghĩ trong thời gian limited, em đã cover được main architectural components..."

**Interviewer:** "Rất tốt. Em có câu hỏi gì cho mình không về team hoặc role này?"

**Candidate:** "Dạ em có một vài câu hỏi ạ. Google Docs hiện tại dùng technology stack như thế nào? Có dùng CRDT hay OT? Team size như thế nào? Và challenges lớn nhất mà team đang face là gì ạ?"

**Interviewer:** "Google Docs dùng một variant của Operational Transformation. Chúng mình có một distributed system khá complex với custom protocols. Team size khoảng thirty engineers. Challenges hiện tại là improve performance với very large documents, và scale to support more concurrent users. Okay, cảm ơn em đã participate. Em có twenty minutes break trước round tiếp."

---

## ROUND 3: QUIZ QUESTIONS (1.5 tiếng)

**Interviewer:** "Xin chào em, mình là Jessica, Senior Staff Engineer. Round này mình sẽ hỏi em một số câu hỏi technical sâu về frontend. Mỗi câu em trả lời, mình sẽ có follow-up questions để đào sâu. Sẵn sàng chưa?"

**Candidate:** "Dạ vâng, em sẵn sàng ạ."

**Interviewer:** "Tốt. Câu đầu tiên, em giải thích cho mình nghe React reconciliation algorithm hoạt động như thế nào?"

**Candidate:** "Dạ reconciliation là process mà React dùng để update DOM efficiently khi component state hoặc props change. Khi component re-render, React tạo một virtual DOM tree mới, compare với old virtual DOM tree, và chỉ update những nodes thay đổi trong real DOM. Algorithm được gọi là Diffing Algorithm. React traverse cả hai trees đồng thời, so sánh nodes. Nếu nodes có same type thì React keep DOM node và chỉ update attributes. Nếu types khác nhau thì React unmount old node và mount new node..."

**Interviewer:** "Em nói compare nodes. Làm sao React biết node nào ứng với node nào khi có list of elements?"

**Candidate:** "Dạ đây là lý do cần key prop ạ. Khi render list, React dùng key để identify elements. Nếu không có key, React dùng index trong array, nhưng điều này có thể gây issues khi list reordered. Với unique stable key, React có thể track element nào moved, added, or removed. Ví dụ nếu em add một element vào đầu list, mà dùng index as key, React sẽ nghĩ tất cả elements changed vì index shift. Nhưng với unique key, React biết rằng chỉ có một element mới được added, còn lại giữ nguyên..."

**Interviewer:** "Chính xác. Vậy nếu em dùng random generated key mỗi lần render thì sao?"

**Candidate:** "Dạ điều đó rất bad ạ. Vì mỗi lần render, keys change, React nghĩ tất cả elements là mới, unmount và remount tất cả. Điều này lose internal state của components, ví dụ input focus, scroll position. Nó cũng cause performance issue vì phải recreate DOM nodes. Key phải stable across renders. Nếu data không có unique ID, em có thể generate ID once khi fetch data và keep stable, chứ không generate trong render function..."

**Interviewer:** "Hay. Vậy em có biết về React Fiber không? Nó liên quan như thế nào đến reconciliation?"

**Candidate:** "Dạ React Fiber là reimplementation của reconciliation engine, được introduce trong React 16. Trước đó, React dùng stack reconciler, là synchronous và recursive. Nếu component tree lớn, reconciliation có thể block main thread lâu, cause UI freeze. Fiber introduce incremental rendering, có khả năng split work into chunks và spread over multiple frames. Fiber có thể pause work, check nếu có higher priority tasks, và resume sau. Điều này improve responsiveness. Mỗi element được represent bởi một Fiber node, có thể be a unit of work. Fiber scheduler decide khi nào work on which fibers based on priorities..."

**Interviewer:** "Em nói priorities. React assign priorities như thế nào? Ví dụ cụ thể được không?"

**Candidate:** "Dạ React có multiple priority levels ạ. User interactions như clicks, typing có highest priority vì trực tiếp affect responsiveness. Data fetching updates có lower priority. Background tasks như analytics có lowest priority. Khi có high priority update, React có thể interrupt current low priority work, work on high priority update first, và resume low priority sau. Ví dụ user đang scroll một long list, React rendering list items. User click một button, React pause rendering list, handle button click first để UI responsive, rồi resume rendering list sau. Cơ chế này được implement qua scheduler package, dùng requestIdleCallback và requestAnimationFrame..."

**Interviewer:** "Hay đấy. Vậy Concurrent Mode là gì? Khác gì so với default mode?"

**Candidate:** "Dạ Concurrent Mode là một set of features leverage Fiber architecture để improve user experience. Trong default mode, updates là synchronous, React commit toàn bộ work. Trong Concurrent Mode, React có thể render multiple versions of UI concurrently và decide version nào to commit. Features include Suspense cho data fetching, useTransition để mark updates as non-urgent, useDeferredValue để defer updates. Ví dụ với useTransition, em có thể wrap state update, tell React rằng update này có thể be interrupted. Nếu higher priority update comes, React abandon current work và start new work. Điều này prevent stuttering UI when typing vào search box mà trigger expensive filter operations..."

**Interviewer:** "Excellent. Vậy khi React commit changes to DOM, browser re-render. Em giải thích browser rendering pipeline được không?"

**Candidate:** "Dạ browser rendering gồm several stages ạ. Đầu tiên là Parse HTML to construct DOM tree. Đồng thời, parse CSS to construct CSSOM tree. Sau đó, combine DOM và CSSOM to create Render Tree, chỉ include visible nodes. Next stage là Layout or Reflow, calculate exact position và size của mỗi node. Sau đó là Paint, rasterize nodes to pixels, create layers. Cuối cùng là Composite, combine layers và draw to screen. Mỗi stage có cost, nên minimize triggering reflow và repaint improve performance..."

**Interviewer:** "Em nói minimize reflow. Những gì trigger reflow?"

**Candidate:** "Dạ các operations change layout sẽ trigger reflow ạ. Ví dụ add hoặc remove DOM nodes, change width, height, padding, margin, border, position. Changing font size cũng trigger reflow vì affect text layout. Reading computed styles như offsetWidth, offsetHeight cũng force synchronous reflow vì browser phải calculate up-to-date values. Best practice là batch DOM changes, ví dụ dùng DocumentFragment để build subtree offline, rồi attach một lần. Avoid reading layout properties trong loop. Use CSS classes instead of inline styles. Use transform và opacity cho animations vì chúng chỉ trigger composite, không trigger layout hay paint..."

**Interviewer:** "Em nói transform và opacity. Tại sao chúng không trigger layout?"

**Candidate:** "Dạ vì transform và opacity được handle bởi compositor thread, separate từ main thread. Khi em set transform hoặc opacity, browser có thể apply changes directly on GPU without recalculating layout hay repainting. Compositor chỉ combine layers với updated transform hoặc opacity. Đây là tại sao animations dùng transform và opacity rất smooth, có thể achieve 60 fps. Còn nếu animate properties như left, top, width, height, browser phải recalculate layout và repaint every frame, rất expensive. Em có thể promote element to own layer bằng will-change hoặc transform translateZ zero để optimize animations..."

**Interviewer:** "Hay. Vậy về event loop trong browser, em giải thích được không?"

**Candidate:** "Dạ event loop là cơ chế JavaScript runtime dùng để handle asynchronous operations. JavaScript là single-threaded, có một call stack. Khi execute code, functions được push lên stack, execute, và pop off. Nhưng asynchronous operations như setTimeout, fetch không block stack. Chúng được delegate to Web APIs provided by browser. Khi async operation complete, callback được push vào task queue hoặc microtask queue. Event loop continuously check nếu call stack empty, nếu yes, nó pop task from queue và push to stack to execute. Microtasks có higher priority than tasks. Microtask queue được processed toàn bộ trước khi move to next task..."

**Interviewer:** "Em phân biệt tasks và microtasks. Cho mình ví dụ cụ thể?"

**Candidate:** "Dạ tasks include setTimeout, setInterval, setImmediate, I/O operations, UI rendering. Microtasks include Promise callbacks, queueMicrotask, MutationObserver callbacks. Ví dụ em có code: console log một, setTimeout với log ba, zero delay, Promise resolve log hai. Khi execute, log một execute ngay. setTimeout callback được push to task queue. Promise then callback được push to microtask queue. Sau khi current script finish, event loop check microtask queue, execute log hai. Sau đó check task queue, execute log ba. Vậy output là một, hai, ba. Mặc dù setTimeout có zero delay, nhưng vì Promise callback là microtask, được processed trước..."

**Interviewer:** "Chính xác. Vậy nếu trong microtask callback, em tạo một microtask mới, điều gì xảy ra?"

**Candidate:** "Dạ microtask mới được add vào microtask queue và sẽ được execute trước khi event loop move sang task. Nếu microtask liên tục create new microtasks, có thể cause infinite loop, block event loop. Browser có thể không render UI vì không bao giờ finish processing microtasks để move đến rendering step. Đây là potential issue cần avoid. Nếu cần schedule work mà không block, nên dùng setTimeout hoặc requestAnimationFrame thay vì chain microtasks..."

**Interviewer:** "Hay. Vậy requestAnimationFrame fit vào event loop như thế nào?"

**Candidate:** "Dạ requestAnimationFrame callbacks được execute trước khi browser repaint, typically 60 times per second aligned với display refresh rate. Trong event loop cycle, sau khi process microtasks và trước khi render, browser execute tất cả scheduled rAF callbacks. Điều này ensure animations được updated synchronously với browser repaint, avoid visual tearing hay jank. Nếu dùng setTimeout cho animation, timing không aligned với repaint, có thể skip frames hoặc render unnecessary frames. rAF cũng automatically paused khi tab không active, save CPU và battery..."

**Interviewer:** "Tốt lắm. Giờ nói về React hooks. Em giải thích useEffect works như thế nào internally?"

**Candidate:** "Dạ useEffect cho phép em perform side effects trong function components. Khi component render, React schedule effect to run sau khi DOM được updated và browser painted. Effects run asynchronously để không block browser painting. React maintain một queue of effects. Sau commit phase, React iterate qua queue và execute effects. Nếu effect return một cleanup function, React sẽ call cleanup trước khi run effect again hoặc khi component unmount. useEffect có dependency array, React compare dependencies với previous render bằng Object.is. Nếu dependencies unchanged, effect không run. Nếu không provide dependency array, effect run every render..."

**Interviewer:** "Em nói Object.is comparison. Vậy nếu dependency là object hoặc array, có vấn đề gì không?"

**Candidate:** "Dạ có ạ. Object.is compare by reference, không compare by value. Nếu object hoặc array được recreated every render, reference khác nhau, effect run every render mặc dù content giống nhau. Ví dụ nếu em pass object literal như value: count to dependency array, object recreated every render, effect always run. To fix, em nên extract specific values làm dependencies, ví dụ count thay vì object chứa count. Hoặc em dùng useMemo để memoize object, chỉ recreate khi specific dependencies change. This is common pitfall với useEffect..."

**Interviewer:** "Chính xác. Vậy nếu trong useEffect, em setState, điều gì xảy ra?"

**Candidate:** "Dạ nếu em call setState trong useEffect, component sẽ re-render. Nếu không careful, có thể cause infinite loop. Ví dụ nếu em setState mà không có dependency array hoặc dependency array missing dependencies affect setState, effect run every render, set state, cause re-render, effect run again... To prevent, em phải ensure dependencies correct. Hoặc em có thể dùng functional update form của setState, avoid dependency on state variable. Ví dụ setState prevState prevState plus one thay vì setState state plus one. Functional update không require state in dependency array..."

**Interviewer:** "Hay. Vậy useLayoutEffect khác useEffect như thế nào?"

**Candidate:** "Dạ useLayoutEffect similar to useEffect but fires synchronously sau khi DOM mutations nhưng trước khi browser paint. Điều này allow em read layout from DOM và synchronously re-render trước khi user see screen update. Use case là khi em cần measure DOM element sizes or positions và adjust based on measurements. Nếu dùng useEffect, measurement sẽ happen sau khi paint, có thể cause flicker vì user see layout một lúc rồi change. Nhưng vì useLayoutEffect synchronous, nó block browser painting, nên chỉ nên dùng khi necessary. Thông thường useEffect là preferred..."

**Interviewer:** "Excellent. Giờ về performance, em có biết về React.memo không? Khi nào nên dùng?"

**Candidate:** "Dạ React.memo là higher-order component wrap around functional component để prevent unnecessary re-renders. Nó shallow compare props, nếu props unchanged, component không re-render. Nên dùng khi component expensive to render và receive same props thường xuyên. Ví dụ một component render large list hoặc heavy computation. Nhưng không nên overuse vì memo itself có cost: phải compare props every render. Nếu props change frequently, memo waste effort. Nên profile trước khi optimize. Em cũng có thể provide custom comparison function as second argument to React.memo nếu cần custom logic..."

**Interviewer:** "Em nói shallow compare props. Vậy nếu prop là object hoặc function?"

**Candidate:** "Dạ shallow compare chỉ check reference, không check deep equality. Nếu prop là object recreated every render, React.memo sẽ nghĩ prop changed và re-render. Tương tự với function props, nếu define inline function in parent, function recreated every render. To fix, em nên dùng useMemo cho object props và useCallback cho function props. useMemo memoize computed value, chỉ recompute khi dependencies change. useCallback memoize function, return same function instance khi dependencies unchanged. Kết hợp React.memo với useMemo và useCallback giúp prevent unnecessary re-renders effectively..."

**Interviewer:** "Hay. Vậy về useMemo và useCallback, khi nào thực sự cần dùng?"

**Candidate:** "Dạ không phải lúc nào cũng cần dùng ạ. useMemo và useCallback có overhead: React phải store memoized value và compare dependencies every render. Nếu computation cheap hoặc dependencies change frequently, overhead có thể lớn hơn benefit. Nên dùng khi computation expensive, ví dụ filter hoặc sort large array, hoặc khi value được pass to child component wrapped trong React.memo. Với useCallback, chủ yếu dùng khi function được pass to memoized child component hoặc used in dependency array của useEffect. Không nên blindly wrap everything trong useMemo và useCallback. Profile first, optimize based on actual bottlenecks..."

**Interviewer:** "Chính xác. Giờ nói về web security. Em giải thích XSS attack và cách prevent?"

**Candidate:** "Dạ XSS là Cross-Site Scripting, attacker inject malicious script vào web page. Có ba types: Stored XSS, script được save to server và serve to users. Reflected XSS, script in URL parameters được reflect in response. DOM-based XSS, script inject qua client-side code. Ví dụ nếu em render user input trực tiếp vào DOM bằng innerHTML without sanitization, attacker có thể inject script tag. Để prevent, em phải sanitize user input, escape special characters. Với React, default behavior là escape values trong JSX, prevent XSS. Nhưng nếu dùng dangerouslySetInnerHTML, em phải sanitize manually bằng library như DOMPurify. Em cũng nên set Content Security Policy headers để restrict script sources..."

**Interviewer:** "Em nói CSP headers. Cụ thể CSP làm gì và configure như thế nào?"

**Candidate:** "Dạ CSP là Content Security Policy, một HTTP header allow server specify which sources browser can load resources from. Ví dụ em có thể restrict scripts chỉ load from same origin, prevent inline scripts. Header format là Content-Security-Policy với directives. Ví dụ script-src self nghĩa là chỉ allow scripts from same origin. script-src self https://apis.google.com allow scripts from self và Google APIs. Em có thể add nonce hoặc hash to allow specific inline scripts. CSP help mitigate XSS vì ngay cả khi attacker inject script, browser sẽ block execute nếu script source không allowed. Configure CSP cần careful để không break functionality, nên test thoroughly..."

**Interviewer:** "Hay. Vậy về CSRF attack, em biết gì và làm sao prevent?"

**Candidate:** "Dạ CSRF là Cross-Site Request Forgery, attacker trick user's browser vào sending request đến site mà user authenticated. Ví dụ user logged into banking site, mở tab khác với malicious site. Malicious site chứa form auto-submit to banking site để transfer money. Vì user's cookies được send automatically, server nghĩ là legitimate request. Để prevent, em dùng CSRF tokens, là random values generated by server và embedded trong form hoặc sent in header. Khi submit request, client include token. Server validate token. Nếu không match, reject request. Malicious site không biết token nên không thể forge request. Em cũng có thể dùng SameSite cookie attribute để prevent cookies sent in cross-site requests..."

**Interviewer:** "Em nói SameSite cookie attribute. Các values là gì và khác nhau như thế nào?"

**Candidate:** "Dạ SameSite có ba values ạ: Strict, Lax, None. Với Strict, cookie chỉ sent when request originates from same site. Không sent trong any cross-site requests, kể cả link clicks. Điều này most secure nhưng có thể inconvenient, ví dụ user click link to site trong email, họ sẽ not authenticated initially. Lax là default, cookie sent with top-level navigation bằng safe methods như GET, nhưng không sent with POST or AJAX. None allow cookie sent in all cross-site requests, nhưng require Secure attribute. SameSite help prevent CSRF attacks by limiting khi cookies sent..."

**Interviewer:** "Excellent. Giờ về accessibility, em biết gì về ARIA attributes và khi nào dùng?"

**Candidate:** "Dạ ARIA là Accessible Rich Internet Applications, là spec define attributes để improve accessibility cho web apps. ARIA attributes provide semantic information cho assistive technologies như screen readers. Ví dụ aria-label provide accessible name for element. aria-describedby link element to description. aria-live announce dynamic content changes. Nhưng first rule of ARIA là không dùng ARIA nếu có native HTML element phù hợp. Ví dụ dùng button tag thay vì div với role button. ARIA chỉ nên dùng khi HTML semantics không đủ, ví dụ custom widgets như date picker, tabs, modal. Sử dụng ARIA incorrectly có thể làm worse accessibility..."

**Interviewer:** "Em nói aria-live. Các values là gì và use cases?"

**Candidate:** "Dạ aria-live có ba values ạ: off, polite, assertive. off là default, không announce changes. polite announce changes khi screen reader idle, không interrupt current announcement. assertive announce ngay lập tức, interrupt current announcement. polite thường dùng cho notifications không urgent, ví dụ status updates, search results updated. assertive dùng cho urgent notifications, ví dụ error messages, warnings. Em cũng có thể combine với aria-atomic để control announce entire region hay chỉ changes. Và aria-relevant để specify what types of changes to announce: additions, removals, text, all..."

**Interviewer:** "Hay. Vậy về keyboard navigation, em ensure accessible như thế nào?"

**Candidate:** "Dạ em phải ensure tất cả interactive elements có thể access bằng keyboard. Elements như button, link, input naturally focusable. Nhưng nếu em tạo custom interactive elements bằng div hoặc span, em phải add tabindex zero để make focusable. Em cũng cần ensure logical tab order, tránh tab traps mà user không thể escape. Khi implement custom widgets như dropdown, modal, em phải handle keyboard events như Enter, Escape, Arrow keys. Ví dụ modal phải trap focus, khi open, focus move vào modal, tab cycle within modal, Escape close modal và restore focus to trigger element. Em có thể test keyboard navigation bằng cách navigate site chỉ dùng keyboard, không dùng mouse..."

**Interviewer:** "Chính xác. Giờ câu hỏi cuối. Em giải thích về Service Workers và use cases?"

**Candidate:** "Dạ Service Worker là script chạy in background, separate from web page, không có access to DOM. Nó act như proxy between web app và network, có thể intercept và modify requests. Main use case là offline support và caching. Khi install Service Worker, nó có thể cache static assets như HTML, CSS, JavaScript, images. Khi user offline, Service Worker serve cached resources instead of network request. Service Worker cũng enable background sync, push notifications. Về lifecycle, Service Worker có các phases: install, activate, idle, terminated. Khi update Service Worker, new version wait until old version no longer controlling pages. Để implement, em register Service Worker trong main JavaScript file, sau đó trong Service Worker file, em listen events như fetch, push, sync..."

**Interviewer:** "Em nói cache strategies. Có những strategies nào?"

**Candidate:** "Dạ có nhiều cache strategies ạ. Cache First là check cache trước, nếu có thì return cached response, nếu không thì fetch from network và cache. Tốt cho static assets không change thường xuyên. Network First là try fetch from network trước, nếu fail thì fall back to cache. Tốt cho content cần fresh nhưng muốn offline fallback. Stale While Revalidate là return cached response ngay, đồng thời fetch from network and update cache for next time. Tốt cho content cần fast response nhưng cũng cần eventually fresh. Network Only và Cache Only là extreme cases, dùng cho specific scenarios. Em có thể mix strategies for different types of resources..."

**Interviewer:** "Perfect. Em đã answer rất comprehensive. Cảm ơn em. Chúng ta chuyển sang round cuối nhé."

---

## ROUND 4: BEHAVIORAL QUESTIONS (1.5 tiếng)

**Interviewer:** "Xin chào em, mình là David, Engineering Manager. Round cuối này chúng ta sẽ discuss về experiences và soft skills của em. Em thoải mái chưa?"

**Candidate:**"Dạ vâng, em sẵn sàng ạ."

**Interviewer:** "Tốt. Đầu tiên, em kể cho mình nghe về một technical decision khó khăn mà em phải make. Em approached như thế nào và outcome là gì?"

**Candidate:** "Dạ em nhớ có một lần ở project trước, team đang build một e-commerce platform. Chúng em phải decide giữa server-side rendering với Next.js hay client-side rendering với Create React App. Đây là khó vì có nhiều trade-offs. Em đã làm research, compare performance, SEO, development complexity. Em tạo prototype cả hai approaches với real data để benchmark. Em present findings cho team, discuss pros và cons. Server-side rendering có better SEO và initial load performance, nhưng require node server và more complex deployment. Client-side rendering đơn giản hơn, có thể deploy to static hosting, nhưng SEO kém hơn. Cuối cùng, team decide chọn Next.js vì SEO critical cho e-commerce. Em lead migration effort, setup infrastructure, train team members. Outcome là site có significantly better SEO rankings và faster initial load time..."

**Interviewer:** "Em nói em lead migration. Có challenges gì trong quá trình migration?"

**Candidate:** "Dạ có nhiều challenges ạ. Thứ nhất là học curve, một số team members chưa familiar với server-side rendering concepts. Em organize training sessions, pair programming to help. Thứ hai là code structure khác nhiều, phải refactor nhiều components. Em break work into incremental chunks, migrate từng page một thay vì big bang migration. Thứ ba là deployment pipeline phải change vì cần node server. Em work với DevOps team để setup container orchestration với Kubernetes. Có moments frustrating khi encounter unexpected issues, ví dụ third-party libraries không compatible với SSR. Em phải find alternatives hoặc contribute fixes. Nhưng em maintain positive attitude, communicate progress regularly với stakeholders, và cuối cùng successfully delivered..."

**Interviewer:** "Hay. Vậy nếu được quay lại, em có làm gì khác không?"

**Candidate:** "Dạ em nghĩ em sẽ allocate nhiều time hơn cho prototyping và testing third-party libraries compatibility trước khi commit to decision. Em cũng sẽ involve DevOps team sớm hơn trong planning phase để avoid surprises về deployment. Một điều nữa là em có thể set up better monitoring và performance metrics từ đầu để track improvements objectively. Nhưng overall, em think decision đúng và execution tốt, chỉ có thể refine process một chút..."

**Interviewer:** "Tốt lắm. Câu tiếp theo, em kể về một lần em phải mentor hoặc train một junior engineer. Em approached như thế nào?"

**Candidate:** "Dạ em có mentor một junior engineer tên là Minh. Minh mới graduate, có foundation tốt nhưng chưa có production experience. Em bắt đầu bằng việc understand Minh's current level và learning style. Em assign tasks phù hợp với level, không quá easy cũng không quá hard. Đầu tiên là bug fixes để familiar với codebase, sau đó là small features. Em schedule daily one-on-ones ban đầu để answer questions và unblock. Em encourage Minh code independently, nhưng review code carefully và give constructive feedback. Em không chỉ point out issues mà explain why và suggest better approaches. Em cũng share resources như articles, videos để Minh self-learn. Sau vài tháng, Minh improve significantly, có thể handle medium complexity features independently..."

**Interviewer:** "Em nói give constructive feedback. Em có ví dụ cụ thể không về một tough feedback conversation?"

**Candidate:** "Dạ có một lần Minh submit code với deeply nested conditionals, rất khó read và maintain. Thay vì simply nói code bad, em explain tại sao deep nesting là issue: hard to understand logic, difficult to test, error-prone. Em suggest refactor bằng early returns và extract helper functions. Em pair với Minh to refactor together, demonstrate thought process. Em cũng share coding principles như Single Responsibility, Keep It Simple. Minh initially defensive một chút, nhưng khi em show how refactored code cleaner và easier to test, Minh appreciate feedback. Em emphasize rằng code review is learning opportunity, không phải criticism. Since then, Minh's code quality improve a lot..."

**Interviewer:** "Excellent. Giờ em kể về một conflict với teammate. Em handled như thế nào?"

**Candidate:** "Dạ em có conflict với một senior engineer tên Hùng về architecture decision. Em propose dùng GraphQL cho API, nhưng Hùng muốn stick with REST. Hùng argue rằng REST đơn giản hơn, team familiar, không cần learn new technology. Em argue GraphQL flexible hơn, reduce over-fetching, better for complex queries. Discussions trở nên heated một chút. Em realize cần de-escalate. Em suggest chúng em làm một PoC cho cả hai approaches với một real feature, rồi evaluate objectively based on criteria như performance, developer experience, maintainability. Chúng em agree. Em làm GraphQL version, Hùng làm REST version. Em present findings trong team meeting, invite everyone's input. Team discuss và vote. Kết quả là team decide chọn REST vì team's current expertise và project timeline tight. Em accept decision mặc dù disagree. Em học được rằng sometimes team cohesion và pragmatism important hơn technical purity..."

**Interviewer:** "Em nói em accept decision mặc dù disagree. Điều đó affect relationship với Hùng không?"

**Candidate:** "Dạ không ạ. Em approach Hùng sau meeting, nói em appreciate Hùng's perspective và em respect team's decision. Em cũng nói rằng em vẫn think GraphQL có value, nhưng em understand concerns về timeline và learning curve. Em propose có thể revisit decision trong future khi team có more bandwidth. Hùng appreciate em's professionalism. Actually, conflict help chúng em hiểu nhau better. Sau đó chúng em collaborate tốt hơn, Hùng cũng more open to em's ideas. Em học được rằng handle conflict với respect và focus on data rather than emotions build stronger relationships..."

**Interviewer:** "Hay lắm. Câu tiếp theo, em kể về một project mà em phải work under tight deadline. Em managed như thế nào?"

**Candidate:** "Dạ có một lần em phải deliver một major feature trong hai tuần thay vì usual một tháng vì business urgency. Em đầu tiên là break down feature into smaller tasks, estimate effort, identify critical path. Em prioritize ruthlessly, focus on must-haves, defer nice-to-haves. Em communicate với stakeholders để align expectations, clarify requirements. Em increase collaboration, có daily standups thay vì weekly. Em identify blockers early và resolve quickly. Em cũng work extra hours một số ngày, nhưng cẩn thận không burn out. Em encourage team take breaks, maintain quality. Em setup continuous integration to catch issues early. Hai tuần đó stressful nhưng em maintain clear communication, everyone knew status. Cuối cùng em delivered feature on time với good quality. Stakeholders happy và team felt accomplished..."

**Interviewer:** "Em nói defer nice-to-haves. Em decided dựa vào gì là must-have versus nice-to-have?"

**Candidate:** "Dạ em collaborate với product manager để understand business goals và user needs. Em ask questions như what's the core value proposition? What's minimum functionality to deliver value? What can wait for next iteration? Em apply eighty-twenty rule, focus on twenty percent features deliver eighty percent value. Em cũng consider technical dependencies, some features block others. Em draft một prioritized list và get approval from stakeholders. Trong process, em discover một feature em thought critical actually nice-to-have based on user research. Flexibility và data-driven decision making là key..."

**Interviewer:** "Tốt. Giờ em kể về một failure hoặc mistake lớn mà em made. Em learned gì?"

**Candidate:** "Dạ em có một lần deploy code lên production mà cause major bug. Em đã test locally và staging, but missed một edge case. Khi deploy, một percentage of users bị crash app. Em immediately rollback, mitigate issue. Em then investigate root cause, realized em missed edge case vì test data không cover scenario đó. Em felt terrible vì affect users. Em write detailed postmortem, analyze what went wrong và how to prevent. Em propose improvements: better test coverage, especially edge cases, more rigorous staging testing mimic production data, implement feature flags để gradually rollout. Em share learnings với team trong blameless postmortem meeting. Em take responsibility, không blame others. Team appreciate honesty. Since then, em extra cautious about testing, always think về edge cases. Em learned failure is learning opportunity nếu approach correctly..."

**Interviewer:** "Em nói blameless postmortem. Em có thể elaborate về culture đó không?"

**Candidate:** "Dạ blameless postmortem culture focus on learning rather than blaming individuals. Khi incident happens, goal is understand what went wrong về systems và processes, không phải punish người responsible. Em facilitate meetings where team discuss timeline of events, identify contributing factors, suggest preventive measures. Em encourage open communication, psychological safety, people feel comfortable share mistakes. Em emphasize everybody makes mistakes, important là học và improve. Ví dụ trong meeting, instead of asking 'Who caused this?', em ask 'What led to this?', 'How can we prevent?'. Em document action items, assign owners, follow up. Culture này help team more transparent, innovate faster vì không fear của making mistakes..."

**Interviewer:** "Excellent. Em kể về một time em had to influence someone without authority."

**Candidate:** "Dạ có một lần em muốn team adopt code review best practices, nhưng em không phải team lead. Một số members không see value, think code review waste time. Em không force, thay vào đó em demonstrate value. Em volunteer review others' code, give helpful feedback. Em share articles về benefits của code review: catch bugs early, knowledge sharing, improve code quality. Em organize một workshop về effective code reviews, invite guest speaker. Em present data from other teams showed reduced bugs sau khi adopt code reviews. Gradually, members see value. Em propose lightweight process: review chỉ critical changes initially, rồi expand. Members more receptive. Em lead by example, make code reviews constructive và efficient. Sau vài months, code review became standard practice. Em learned influence through demonstration và education more effective than authority..."

**Interviewer:** "Em nói present data. Em gathered data như thế nào?"

**Candidate:** "Dạ em reach out to other teams đã implement code reviews, ask về experiences. Em collect metrics like bug rate before and after, time to resolution, developer satisfaction surveys. Em also research industry studies về ROI của code reviews. Em compile findings into một presentation với charts, testimonials. Em make sure data relevant và credible. Em cũng address common objections với data, ví dụ concern về time spent, em show data rằng time saved from reduced bugs outweigh review time. Em present to team lead first, get buy-in, then to team. Data-driven approach help overcome skepticism..."

**Interviewer:** "Hay lắm. Câu cuối cùng. Em có câu hỏi gì cho mình về team, role, hoặc Google?"

**Candidate:** "Dạ em có một vài questions ạ. Về team, anh có thể share về team culture và how collaboration works? Về growth, có opportunities nào cho senior engineers to grow technically hoặc move to leadership roles? Về projects, team đang work on challenges gì hiện tại? Và về onboarding, process như thế nào để help new hires ramp up successfully?"

**Interviewer:** "Câu hỏi rất thoughtful. Team culture của chúng mình là collaborative và innovative. Chúng mình encourage knowledge sharing qua tech talks, code reviews, pairing sessions. About growth, Google có rõ ràng career ladder, senior engineers có thể move to Staff or Principal levels if focus technical track, hoặc move to management if interested. Chúng mình provide mentorship, training, conferences. Current challenges mainly về scale, improve performance với increasing users và data. About onboarding, chúng mình có structured program, assign buddy, ramp-up tasks, regular check-ins. Chúng mình invest heavily vào onboarding success. Okay, đó là hết các câu hỏi của mình. Cảm ơn em rất nhiều đã tham gia. Em sẽ nghe kết quả trong vòng một tuần."

**Candidate:** "Dạ cảm ơn anh và team đã cho em opportunity. Em rất 期待 được contribute to Google. Chúc anh một ngày tốt lành ạ."

---

## FINAL CODE & NOTES

### Round 1 - Problem 1: Autocomplete System với Trie

```javascript
/**
 * AUTOCOMPLETE SYSTEM IMPLEMENTATION
 *
 * Cấu trúc: Sử dụng Trie (Prefix Tree) với optimization:
 * - Mỗi node lưu top-k queries để O(1) lookup
 * - Query strings được store riêng và reference bằng ID để tiết kiệm space
 * - Support dynamic update với efficient insertion
 *
 * Time Complexity:
 * - Insert: O(L * log k) với L = query length, k = số suggestions
 * - Search: O(L + k) để traverse đến prefix node và return top k
 *
 * Space Complexity:
 * - O(N * L) với N = số unique queries, L = average length
 * - Mỗi node: O(k) cho top queries array
 *
 * Trade-offs:
 * - Pre-compute top-k tại mỗi node: insert chậm hơn nhưng search cực nhanh
 * - Suitable cho read-heavy workload như Google Search
 */

class TrieNode {
  constructor() {
    // Map từ character -> child TrieNode
    this.children = new Map();

    // Array chứa top k queries: [{queryId, frequency}]
    // Maintained in descending order của frequency
    this.topQueries = [];

    // Flag đánh dấu end of a query
    this.isEndOfQuery = false;

    // QueryId nếu node này kết thúc một query
    this.queryId = null;
  }

  /**
   * Update topQueries list với query mới hoặc frequency mới
   * Maintain sorted order và limit to k items
   */
  updateTopQueries(queryId, frequency, k = 10) {
    // Tìm query trong list hiện tại
    const existingIndex = this.topQueries.findIndex(
      (item) => item.queryId === queryId
    );

    if (existingIndex !== -1) {
      // Update frequency nếu đã tồn tại
      this.topQueries[existingIndex].frequency = frequency;
    } else {
      // Add query mới
      this.topQueries.push({ queryId, frequency });
    }

    // Sort descending by frequency, then by queryId for stability
    this.topQueries.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.queryId - b.queryId; // Tie-breaker
    });

    // Keep only top k
    if (this.topQueries.length > k) {
      this.topQueries = this.topQueries.slice(0, k);
    }
  }
}

class AutocompleteSystem {
  constructor(k = 10) {
    this.root = new TrieNode();
    this.k = k; // Number of suggestions to return

    // Global storage: queryId -> query string
    // Cho phép share query strings across nodes, save memory
    this.queryMap = new Map();

    // Global storage: query string -> {queryId, frequency}
    // Fast lookup để check query đã exist và get ID
    this.queryIndex = new Map();

    // Counter cho unique query IDs
    this.nextQueryId = 0;

    // Frequency map: queryId -> frequency
    this.frequencies = new Map();
  }

  /**
   * Insert hoặc update một query với frequency
   * @param {string} query - Query string cần insert
   * @param {number} frequency - Frequency của query (default = 1)
   */
  insert(query, frequency = 1) {
    // Validation
    if (typeof query !== "string" || query.length === 0) {
      throw new TypeError("Query must be non-empty string");
    }

    // Limit query length để prevent abuse
    const MAX_QUERY_LENGTH = 200;
    if (query.length > MAX_QUERY_LENGTH) {
      query = query.substring(0, MAX_QUERY_LENGTH);
    }

    // Get hoặc create queryId
    let queryId, currentFreq;

    if (this.queryIndex.has(query)) {
      // Query đã exist, update frequency
      const existing = this.queryIndex.get(query);
      queryId = existing.queryId;
      currentFreq = this.frequencies.get(queryId) + frequency;
      this.frequencies.set(queryId, currentFreq);
    } else {
      // New query, assign ID
      queryId = this.nextQueryId++;
      currentFreq = frequency;

      this.queryMap.set(queryId, query);
      this.queryIndex.set(query, { queryId, frequency: currentFreq });
      this.frequencies.set(queryId, currentFreq);
    }

    // Traverse Trie và update topQueries tại mỗi node
    let node = this.root;
    const pathNodes = [node]; // Track all nodes trên path để update

    for (const char of query) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
      pathNodes.push(node);
    }

    // Mark end of query
    node.isEndOfQuery = true;
    node.queryId = queryId;

    // Backtrack và update topQueries tại tất cả nodes trên path
    for (const pathNode of pathNodes) {
      pathNode.updateTopQueries(queryId, currentFreq, this.k);
    }
  }

  /**
   * Search suggestions cho một prefix
   * @param {string} prefix - Prefix để search
   * @returns {string[]} - Array of top k query suggestions
   */
  search(prefix) {
    // Validation
    if (typeof prefix !== "string") {
      return [];
    }

    // Traverse đến prefix node
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        // Prefix không exist, return empty
        return [];
      }
      node = node.children.get(char);
    }

    // Return top queries từ prefix node
    // Map queryId back to query string
    return node.topQueries.map((item) => this.queryMap.get(item.queryId));
  }

  /**
   * Get suggestions với additional metadata (frequency)
   */
  searchWithMetadata(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }

    return node.topQueries.map((item) => ({
      query: this.queryMap.get(item.queryId),
      frequency: item.frequency,
    }));
  }
}

// USAGE EXAMPLE:
/*
const autocomplete = new AutocompleteSystem(5); // top 5 suggestions

// Insert queries với frequencies
autocomplete.insert('apple', 10);
autocomplete.insert('application', 8);
autocomplete.insert('apply', 12);
autocomplete.insert('appetite', 5);
autocomplete.insert('banana', 20);

// Search
console.log(autocomplete.search('app')); 
// Output: ['apply', 'apple', 'application'] - sorted by frequency

console.log(autocomplete.search('ba'));  
// Output: ['banana']

// Update existing query
autocomplete.insert('application', 5); // Tăng frequency lên 13
console.log(autocomplete.search('app')); 
// Output: ['application', 'apply', 'apple'] - order changed
*/

/**
 * OPTIMIZATIONS FOR PRODUCTION:
 *
 * 1. Sharding: Chia Trie theo first characters
 *    - Distribute across multiple servers
 *    - Use consistent hashing cho load balancing
 *
 * 2. Caching:
 *    - Cache hot prefixes trong Redis
 *    - TTL-based invalidation
 *
 * 3. Personalization Layer:
 *    - Separate service track user history
 *    - Merge global suggestions với personal
 *    - ML model to rank results
 *
 * 4. Compression:
 *    - Compact trie representation
 *    - Compress query strings
 *
 * 5. Analytics:
 *    - Track query patterns
 *    - Identify trending queries
 *    - A/B test suggestion algorithms
 */
```

### Round 1 - Problem 2: Retry Function with Exponential Backoff

```javascript
/**
 * ADVANCED RETRY FUNCTION
 *
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry conditions
 * - AbortSignal support
 * - Comprehensive error handling
 * - Works with both sync and async functions
 *
 * @param {Function} fn - Function cần retry
 * @param {Object} options - Configuration options
 * @returns {Promise} - Result of successful function call
 */

async function retry(fn, options = {}) {
  // Validate input
  if (typeof fn !== "function") {
    throw new TypeError("First argument must be a function");
  }

  // Default options
  const {
    maxRetries = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 30000, // 30 seconds
    shouldRetry = () => true, // Default: retry all errors
    signal = null, // AbortSignal for cancellation
    onRetry = null, // Callback khi retry: (error, attempt) => {}
  } = options;

  /**
   * Helper: Sleep với exponential backoff và jitter
   * Formula: min(maxDelay, baseDelay * 2^attemptNumber * random(0.5, 1.5))
   */
  const sleep = (attemptNumber) => {
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber);
    const cappedDelay = Math.min(exponentialDelay, maxDelay);

    // Add jitter: random between 50% and 150% of delay
    const jitter = 0.5 + Math.random(); // Random between 0.5 and 1.5
    const actualDelay = Math.floor(cappedDelay * jitter);

    return new Promise((resolve) => setTimeout(resolve, actualDelay));
  };

  /**
   * Inner function thực hiện retry logic
   */
  const attemptCall = async (attemptNumber) => {
    try {
      // Check if aborted trước khi attempt
      if (signal?.aborted) {
        throw new DOMException("Operation aborted", "AbortError");
      }

      // Call function - tự động wrap sync function trong Promise
      const result = await fn();

      // Success - return result
      return result;
    } catch (error) {
      // Check if còn retries
      const retriesLeft = maxRetries - attemptNumber;

      // Call onRetry callback nếu provided
      if (onRetry && typeof onRetry === "function") {
        try {
          onRetry(error, attemptNumber);
        } catch (callbackError) {
          // Ignore callback errors
          console.warn("onRetry callback error:", callbackError);
        }
      }

      // Check if should retry với custom logic
      const canRetry = retriesLeft > 0 && shouldRetry(error);

      if (!canRetry) {
        // Exhausted retries hoặc shouldRetry returned false
        throw error;
      }

      // Wait với exponential backoff
      await sleep(attemptNumber);

      // Check again if aborted sau sleep
      if (signal?.aborted) {
        throw new DOMException("Operation aborted", "AbortError");
      }

      // Recursive retry
      return attemptCall(attemptNumber + 1);
    }
  };

  // Start với attempt 0
  return attemptCall(0);
}

/**
 * HELPER: Common shouldRetry implementations
 */
const retryStrategies = {
  // Retry chỉ network errors
  networkErrors: (error) => {
    return (
      error.name === "TypeError" || // Fetch network error
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT"
    );
  },

  // Retry HTTP errors với specific status codes
  retryableHttpStatus: (error) => {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return error.response && retryableStatuses.includes(error.response.status);
  },

  // Combine multiple strategies
  combine: (...strategies) => {
    return (error) => strategies.some((strategy) => strategy(error));
  },
};

// USAGE EXAMPLES:

/*
// Example 1: Basic usage với default options
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) throw new Error('HTTP error');
  return response.json();
}

const data = await retry(fetchData, { maxRetries: 5 });


// Example 2: Custom shouldRetry với HTTP status codes
const data = await retry(fetchData, {
  maxRetries: 3,
  shouldRetry: retryStrategies.retryableHttpStatus,
  onRetry: (error, attempt) => {
    console.log(`Retry attempt ${attempt} due to:`, error.message);
  }
});


// Example 3: Với AbortSignal để cancellation
const controller = new AbortController();

// Cancel sau 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  const data = await retry(fetchData, {
    maxRetries: 10,
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled');
  }
}


// Example 4: Retry với custom backoff settings
const data = await retry(fetchData, {
  maxRetries: 5,
  baseDelay: 500,    // Start với 500ms
  maxDelay: 10000,   // Cap tại 10s
  shouldRetry: retryStrategies.combine(
    retryStrategies.networkErrors,
    retryStrategies.retryableHttpStatus
  )
});


// Example 5: Wrap trong higher-order function
function createRetryableFetch(options) {
  return async function retryableFetch(url, fetchOptions) {
    return retry(
      () => fetch(url, fetchOptions).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      options
    );
  };
}

const safeFetch = createRetryableFetch({ maxRetries: 3 });
const data = await safeFetch('https://api.example.com/data');
*/

/**
 * ADVANCED: Retry với Circuit Breaker Pattern
 *
 * Circuit breaker prevent overwhelming một failing service
 * bằng cách "mở circuit" sau nhiều failures liên tiếp
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN");
      }
      // Try half-open
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

// Usage với circuit breaker:
/*
const breaker = new CircuitBreaker({ 
  failureThreshold: 3,
  resetTimeout: 30000 
});

const result = await retry(
  () => breaker.execute(() => fetchData()),
  { maxRetries: 3 }
);
*/
```

Cuộc phỏng vấn mô phỏng đã complete với đầy đủ 4 rounds theo yêu cầu. Mỗi round được thiết kế để test different aspects của senior frontend engineer:

- **Round 1**: Technical coding skills (algorithms, JS, UI)
- **Round 2**: System design thinking
- **Round 3**: Deep technical knowledge
- **Round 4**: Soft skills và experience

Format hội thoại tự nhiên, follow-up questions đào sâu, và realistic như cuộc phỏng vấn thật tại Big Tech company.
