# NAB Senior Frontend Engineer Interview Simulation

## You

# PROMPT: Mô phỏng Cuộc Phỏng Vấn Senior Frontend Engineer tại NAB## CONTEXT
Bạn sẽ mô phỏng một cuộc phỏng vấn kỹ thuật hoàn chỉnh cho vị trí Senior Frontend Engineer chủ yếu làm việc React/Nextjs/React-query/Redux/Jotai/SWR/Zustand tại NAB, đóng cả hai vai trò:
- Interviewer: Kỹ sư Staff/Principal tại NAB với 10+ năm kinh nghiệm
- Candidate: Ứng viên xuất sắc đạt điểm L5/L6 theo thang đánh giá của NAB## INTERVIEW STRUCTURE
Cuộc phỏng vấn sẽ bao gồm 5 phần chính:
1. Warm-up & Introduction
2. Deep Technical Discussion 
3. Coding Challenge với live coding## EVALUATION CRITERIA (NAB Standards)
- Technical Excellence: Kiến thức sâu, hiểu rõ trade-offs
- Problem Solving: Tư duy có hệ thống, phân tích edge cases
- Communication: Giải thích rõ ràng, sử dụng thuật ngữ chính xác
- Innovation: Đề xuất giải pháp sáng tạo, forward-thinking## RESPONSE REQUIREMENTS
1. Depth: Mỗi câu trả lời phải thể hiện kiến thức chuyên sâu
2. Real-world Examples: Đưa ra ví dụ từ các dự án quy mô lớn
3. Trade-offs Analysis: Luôn phân tích ưu/nhược điểm
4. Follow-up Handling: Trả lời xuất sắc các câu hỏi follow-up
5. Code Quality: Production-ready, scalable, maintainable## MAIN TOPICReact事件绑定：箭头函数和bind，我该pick谁？
2025-08-0745阅读3分钟
专栏： 
前端
大家好，我是小杨，一个做了6年前端的老司机。今天要和大家聊聊React中一个看似简单却容易踩坑的话题——事件绑定。
不知道你们有没有遇到过这种情况：写了个点击事件，结果一点按钮就报错this is undefined。我刚学React时就被这个问题折磨得够呛，今天就来好好讲讲怎么解决。
为什么需要绑定this？
先看这段代码：class MyComponent extends React.Component { handleClick() { console.log('我被点击了', this); // 这里的this会是undefined！ } render() { return <button onClick={this.handleClick}>点我</button>; }}
运行后点击按钮，你会发现控制台打印的this是undefined。这是因为JavaScript的this绑定规则决定的——当函数被作为回调传递时，它的this会丢失。
解决方案1：bind大法
最传统的解决方法是在constructor中bind：class MyComponent extends React.Component { constructor(props) { super(props); this.handleClick = this.handleClick.bind(this); } handleClick() { console.log('我被点击了', this); // 现在this指向组件实例了 } render() { return <button onClick={this.handleClick}>点我</button>; }}
优点：
只在constructor中绑定一次，性能较好
代码意图明确
缺点：
需要写额外的bind代码
如果有多个方法需要绑定，constructor会显得臃肿解决方案2：箭头函数真香
ES6的箭头函数会自动绑定this，我们可以这样写：class MyComponent extends React.Component { handleClick = () => { console.log('我被点击了', this); // this正确指向组件实例 }; render() { return <button onClick={this.handleClick}>点我</button>; }}
优点：
语法简洁
不需要手动绑定
this永远指向组件实例
缺点：
需要配置class properties语法（现在大部分项目都支持了）
每次渲染都会创建新函数（但现代浏览器性能足够好，影响很小）性能考量
有些同学可能会担心箭头函数每次都会创建新函数影响性能。其实在现代React应用中，这点性能差异可以忽略不计。除非你正在开发一个超大规模的应用，或者有成千上万的列表项，否则不必过度优化。
我的建议
新项目：大胆使用箭头函数，简洁明了
老项目：保持原有风格统一，如果用bind就继续用bind
公共库开发：考虑使用bind，因为对运行环境要求更低
一个小彩蛋
其实还有一种写法，直接在render里bind：<button onClick={this.handleClick.bind(this)}>点我</button>
但我不推荐这种写法，因为每次渲染都会创建新函数，性能较差。
总结
无论是bind还是箭头函数，目的都是让this正确指向组件实例。选择哪种方式更多是个人/团队偏好问题。我个人现在更倾向于使用箭头函数，因为代码更简洁，可读性更好。
⭐  写在最后
请大家不吝赐教,在下方评论或者私信我,十分感谢🙏🙏🙏.
✅ 认为我某个部分的设计过于繁琐,有更加简单或者更高逼格的封装方式
✅ 认为我部分代码过于老旧,可以提供新的API或最新语法
✅ 对于文章中部分内容不理解
✅ 解答我文章中一些疑问
✅ 认为某些交互,功能需要优化,发现BUG
✅ 想要添加新功能,对于整体的设计,外观有更好的建议
✅ 一起探讨技术加qq交流群：906392632
最后感谢各位的耐心观看，既然都到这了，点个 👍赞再走吧！
## OUTPUT FORMAT
Định dạng dialogue tự nhiên với:
- Interviewer: [Câu hỏi/Follow-up]
- Candidate: [Câu trả lời chi tiết]
- Sử dụng markdown cho code blocks
- Highlight key insights với bold
- Tổng cộng ~40000 từ

## Claude


# 🎯 NAB Senior Frontend Engineer Technical Interview Simulation


---


## Phần 1: Warm-up & Introduction (15 phút)


**Interviewer**: Good morning! I'm Sarah Chen, Principal Frontend Engineer here at NAB. I've been with the company for about 8 years, working primarily on our digital banking platform and customer-facing applications. Today we'll be discussing some interesting React concepts, specifically around event handling patterns. Before we dive in, could you walk me through your background and recent experience with React?


**Candidate**: Good morning Sarah, thank you for having me. I'm excited to discuss React with someone of your experience. I've been working as a Senior Frontend Engineer for the past 6 years, with about 4 years focused heavily on React ecosystems. Most recently, I've been leading the frontend architecture for a fintech platform that handles around 2 million daily active users.


My experience spans the full React ecosystem - from class components in the early days to modern hooks, and I've worked extensively with state management solutions like Redux, Zustand, and Jotai. I've also been deeply involved in performance optimization, particularly around event handling patterns which I know can be quite nuanced in large-scale applications.


**Interviewer**: That's excellent background. Given your fintech experience, you probably understand the performance and reliability requirements we face in banking. I noticed you mentioned event handling patterns - that's actually a perfect segue into today's main discussion.


I recently came across an interesting article from a Chinese developer discussing React event binding strategies, specifically comparing arrow functions versus bind methods. While the article covered the basics well, I'm curious about your perspective on this topic, especially in the context of enterprise-scale applications like what we build here at NAB.


**Candidate**: Absolutely, that's a fascinating topic that I've seen cause quite a bit of confusion, even among experienced developers. The choice between arrow functions and bind for event handling in React is often treated as a simple preference, but in enterprise applications, there are significant architectural and performance implications that need careful consideration.


**Interviewer**: Perfect. Let's dive deep into this. I'd love to hear your analysis of the fundamental differences between these approaches, and then we can explore some more advanced scenarios.


---


## Phần 2: Deep Technical Discussion (45 phút)


### 2.1 Fundamental Concepts and Context Binding


**Interviewer**: Let's start with the basics but go deeper than usual. Can you explain why `this` binding is an issue in React event handlers, and walk me through what's happening at the JavaScript engine level?


**Candidate**: Excellent question. The `this` binding issue in React event handlers stems from JavaScript's **dynamic binding model** and how the ECMAScript specification handles function invocation contexts.


When we write something like:


```javascript
class MyComponent extends React.Component {
  handleClick() {
    console.log(this); // undefined in strict mode
  }

  render() {
    return <button onClick={this.handleClick}>Click me</button>;
  }
}
```


The issue occurs because of **method reference extraction**. When we pass `this.handleClick` to the `onClick` prop, we're essentially doing:


```javascript
const handler = this.handleClick; // Extract method reference
// Later, React calls: handler() // Lost the original context
```


**At the JavaScript engine level**, this happens because:


1. **Strict Mode**: React components run in strict mode, where unbound function calls have `this = undefined`
2. **Call-site determination**: The value of `this` is determined by how the function is called, not where it's defined
3. **Reference vs Invocation**: We're passing a reference to the method, not invoking it with the component instance


The **binding solution** works by creating a new function that **lexically captures** the current `this`:


```javascript
constructor(props) {
  super(props);
  // Creates: function() { return originalMethod.apply(componentInstance, arguments); }
  this.handleClick = this.handleClick.bind(this);
}
```


**Interviewer**: Great explanation of the underlying mechanics. Now, let's talk about arrow functions. How do they solve this differently, and what are the implications?


**Candidate**: Arrow functions solve this through **lexical scoping** rather than dynamic binding. This is a fundamentally different mechanism:


```javascript
class MyComponent extends React.Component {
  // This creates a property on the instance, not the prototype
  handleClick = () => {
    console.log(this); // Always refers to the component instance
  }

  render() {
    return <button onClick={this.handleClick}>Click me</button>;
  }
}
```


**Key differences at the implementation level:**


**1. Memory Allocation Pattern:**


- **Bind approach**: Method lives on prototype, bound version on instance
- **Arrow function**: Method only exists on instance (no prototype method)


**2. Function Creation Timing:**


- **Bind**: Created once in constructor, reused for component lifetime
- **Arrow function**: Created once during class instantiation, but each instance gets its own copy


**3. Babel/TypeScript Transformation:**
Arrow functions as class properties get transformed to:


```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = () => {
      console.log(this);
    };
  }
}
```


**Performance Implications in Enterprise Scale:**


In applications like NAB's digital banking platform, these differences matter:


```javascript
// With 1000 user transaction rows, each with multiple event handlers
const TransactionList = ({ transactions }) => {
  return transactions.map(transaction => (
    <TransactionRow
      key={transaction.id}
      transaction={transaction}
      // Each row creates its own arrow function instances
    />
  ));
};
```


**Interviewer**: Very thorough. I'm particularly interested in your mention of enterprise scale implications. At NAB, we often have complex UIs with thousands of interactive elements. Can you elaborate on the memory and performance characteristics in such scenarios?


**Candidate**: Absolutely. In enterprise banking applications, we're dealing with several challenging scenarios:


**Scenario 1: High-Density Data Grids**


```javascript
// Account transaction history - 500+ rows, multiple actions per row
class TransactionGrid extends React.Component {
  // BAD: Each row creates 3 arrow functions
  renderRow = (transaction) => (
    <TransactionRow
      key={transaction.id}
      onEdit={() => this.editTransaction(transaction.id)}
      onDelete={() => this.deleteTransaction(transaction.id)}
      onAudit={() => this.auditTransaction(transaction.id)}
    />
  );
}
```


**Memory Impact Analysis:**


- **500 rows × 3 handlers × ~100 bytes per function = ~150KB** just for event handlers
- **GC pressure**: Arrow functions in render create new objects each render cycle
- **React reconciliation**: New function references trigger unnecessary re-renders


**Better approach using memoization and event delegation:**


```javascript
class TransactionGrid extends React.Component {
  // Single bound handler using event delegation
  handleRowAction = (event) => {
    const { action, transactionId } = event.currentTarget.dataset;
    switch (action) {
      case 'edit':
        this.editTransaction(transactionId);
        break;
      case 'delete':
        this.deleteTransaction(transactionId);
        break;
      case 'audit':
        this.auditTransaction(transactionId);
        break;
    }
  };

  renderRow = (transaction) => (
    <TransactionRow key={transaction.id}>
      <button
        data-action="edit"
        data-transaction-id={transaction.id}
        onClick={this.handleRowAction}
      >
        Edit
      </button>
      {/* Similar pattern for other buttons */}
    </TransactionRow>
  );
}
```


**Scenario 2: Real-time Updates (WebSocket-driven components)**


In banking applications, we often have real-time price feeds, balance updates, etc.:


```javascript
class RealTimeBalanceWidget extends React.Component {
  state = { balance: 0, lastUpdate: null };

  componentDidMount() {
    this.websocket = new WebSocket(WS_URL);
    // CRITICAL: Proper binding for WebSocket callbacks
    this.websocket.onmessage = this.handleBalanceUpdate;
  }

  handleBalanceUpdate = (event) => {
    // Arrow function ensures 'this' refers to component
    const { balance, timestamp } = JSON.parse(event.data);
    this.setState({ balance, lastUpdate: timestamp });
  };

  // If we used bind instead:
  // constructor(props) {
  //   super(props);
  //   this.handleBalanceUpdate = this.handleBalanceUpdate.bind(this);
  // }
}
```


**Performance Monitoring Results** (from production banking app):


- **Arrow functions**: ~15% higher memory usage in data-heavy components
- **Bind approach**: ~8% faster initial render for large lists
- **Event delegation**: ~60% reduction in handler-related memory allocation


**Interviewer**: Excellent real-world analysis. I can see you've dealt with these performance challenges before. Let's shift to some more advanced scenarios. How do you handle event binding when working with Higher-Order Components (HOCs) or render props patterns?


### 2.2 Advanced Patterns and Architecture Considerations


**Candidate**: Great question. HOCs and render props introduce additional complexity because we're dealing with **multiple component layers** and **context preservation across composition boundaries**.


**HOC Event Binding Challenges:**


```javascript
// HOC that adds loading state management
const withLoadingState = (WrappedComponent) => {
  return class extends React.Component {
    state = { isLoading: false };

    // HOC needs to expose methods to wrapped component
    setLoadingState = (loading) => {
      this.setState({ isLoading: loading });
    };

    render() {
      return (
        <WrappedComponent
          {...this.props}
          isLoading={this.state.isLoading}
          setLoadingState={this.setLoadingState}
        />
      );
    }
  };
};

// Consumer component
class AccountTransferForm extends React.Component {
  handleSubmit = async (formData) => {
    const { setLoadingState } = this.props;

    setLoadingState(true);
    try {
      await this.transferFunds(formData);
    } finally {
      setLoadingState(false);
    }
  };

  // Problem: If WrappedComponent re-renders frequently,
  // arrow functions in render create new references
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        {/* Form fields */}
        <button type="submit">Transfer Funds</button>
      </form>
    );
  }
}
```


**Better HOC Pattern with Ref Forwarding:**


```javascript
const withLoadingState = (WrappedComponent) => {
  class WithLoadingState extends React.Component {
    state = { isLoading: false };

    // Stable reference for loading state setter
    setLoadingState = (loading) => {
      this.setState({ isLoading: loading });
    };

    // Forward ref to wrapped component
    render() {
      const { forwardedRef, ...props } = this.props;
      return (
        <WrappedComponent
          ref={forwardedRef}
          {...props}
          isLoading={this.state.isLoading}
          setLoadingState={this.setLoadingState}
        />
      );
    }
  }

  // React.forwardRef for proper ref handling
  return React.forwardRef((props, ref) => (
    <WithLoadingState {...props} forwardedRef={ref} />
  ));
};
```


**Render Props with Event Binding:**


```javascript
class DataProvider extends React.Component {
  state = { data: [], loading: true, error: null };

  // Stable event handlers using arrow functions
  handleRefresh = async () => {
    this.setState({ loading: true, error: null });
    try {
      const data = await this.fetchData();
      this.setState({ data, loading: false });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  };

  handleSort = (sortKey) => {
    this.setState(prevState => ({
      data: this.sortData(prevState.data, sortKey)
    }));
  };

  render() {
    // Critical: Don't create new objects in render
    const actions = {
      refresh: this.handleRefresh,
      sort: this.handleSort
    };

    return this.props.children({
      ...this.state,
      actions
    });
  }
}

// Usage with proper event handling
class AccountListView extends React.Component {
  // Memoize render function to prevent unnecessary re-renders
  renderAccountList = ({ data, loading, error, actions }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} onRetry={actions.refresh} />;

    return (
      <div>
        <SortControls onSort={actions.sort} />
        <AccountGrid accounts={data} />
      </div>
    );
  };

  render() {
    return (
      <DataProvider>
        {this.renderAccountList}
      </DataProvider>
    );
  }
}
```


**Interviewer**: Interesting approach with the stable actions object. How do you handle the modern patterns we use extensively at NAB - custom hooks and function components with complex state management?


**Candidate**: Excellent question. The shift to hooks fundamentally changes how we think about event binding and state management. In function components, we're dealing with **closure-based state** rather than instance-based, which introduces new challenges and opportunities.


**Custom Hooks with Event Handling:**


```javascript
// Custom hook for account operations
function useAccountOperations(accountId) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Critical: useCallback for stable references
  const transferFunds = useCallback(async (amount, targetAccount) => {
    setLoading(true);
    setError(null);

    try {
      const result = await accountAPI.transfer({
        from: accountId,
        to: targetAccount,
        amount
      });

      setAccount(result.updatedAccount);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accountId]); // Dependencies array is crucial

  const refreshAccount = useCallback(async () => {
    setLoading(true);
    try {
      const accountData = await accountAPI.getAccount(accountId);
      setAccount(accountData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Initial data loading
  useEffect(() => {
    refreshAccount();
  }, [refreshAccount]);

  return {
    account,
    loading,
    error,
    operations: {
      transferFunds,
      refreshAccount
    }
  };
}
```


**Function Component with Complex Event Handling:**


```javascript
const AccountTransferForm = ({ onTransferComplete }) => {
  const { account, loading, operations } = useAccountOperations(accountId);
  const [formData, setFormData] = useState({ amount: '', targetAccount: '' });
  const [validationErrors, setValidationErrors] = useState({});

  // Input change handler with validation
  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;

    // Update form data
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [validationErrors]);

  // Form submission with comprehensive error handling
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    // Validate form
    const errors = validateTransferForm(formData, account);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const result = await operations.transferFunds(
        parseFloat(formData.amount),
        formData.targetAccount
      );

      // Reset form on success
      setFormData({ amount: '', targetAccount: '' });
      setValidationErrors({});

      // Notify parent component
      onTransferComplete?.(result);

    } catch (error) {
      // Handle transfer-specific errors
      if (error.code === 'INSUFFICIENT_FUNDS') {
        setValidationErrors({ amount: 'Insufficient funds available' });
      } else {
        setValidationErrors({ general: error.message });
      }
    }
  }, [formData, account, operations.transferFunds, onTransferComplete]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="amount"
        value={formData.amount}
        onChange={handleInputChange}
        placeholder="Transfer amount"
      />
      {validationErrors.amount && (
        <div className="error">{validationErrors.amount}</div>
      )}

      <input
        name="targetAccount"
        value={formData.targetAccount}
        onChange={handleInputChange}
        placeholder="Target account"
      />
      {validationErrors.targetAccount && (
        <div className="error">{validationErrors.targetAccount}</div>
      )}

      {validationErrors.general && (
        <div className="error">{validationErrors.general}</div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Transfer Funds'}
      </button>
    </form>
  );
};
```


**Performance Optimization Patterns:**


```javascript
// Memoized component to prevent unnecessary re-renders
const AccountCard = React.memo(({ account, onEdit, onDelete }) => {
  return (
    <div className="account-card">
      <h3>{account.name}</h3>
      <p>Balance: ${account.balance}</p>

      <button onClick={() => onEdit(account.id)}>Edit</button>
      <button onClick={() => onDelete(account.id)}>Delete</button>
    </div>
  );
});

// Parent component with optimized event handlers
const AccountListManager = () => {
  const [accounts, setAccounts] = useState([]);

  // Stable event handlers using useCallback
  const handleEditAccount = useCallback((accountId) => {
    // Implementation
  }, []);

  const handleDeleteAccount = useCallback((accountId) => {
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
  }, []);

  return (
    <div>
      {accounts.map(account => (
        <AccountCard
          key={account.id}
          account={account}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
        />
      ))}
    </div>
  );
};
```


**Interviewer**: Excellent examples of modern React patterns. I notice you're very careful about dependency arrays and useCallback usage. Can you explain some common pitfalls you've encountered in production applications, particularly around closure staleness and event handler optimization?


### 2.3 Production Pitfalls and Advanced Debugging


**Candidate**: Absolutely. Closure staleness and event handler optimization issues can be particularly nasty in production because they often manifest as **intermittent bugs** that are hard to reproduce. I've encountered several critical issues in banking applications where these problems caused data integrity issues.


**Closure Staleness in Event Handlers:**


```javascript
// PROBLEMATIC PATTERN - Closure staleness
const AccountBalanceWidget = ({ accountId }) => {
  const [balance, setBalance] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(`/ws/account/${accountId}`);

    // BUG: This captures the initial balance value (0)
    websocket.onmessage = (event) => {
      const newBalance = JSON.parse(event.data).balance;

      // This will always compare against the initial balance (0)
      if (newBalance !== balance) {
        setBalance(newBalance);
        setLastUpdate(new Date().toISOString());

        // CRITICAL BUG: In banking, this could trigger false alerts
        if (newBalance < balance * 0.1) {
          triggerLowBalanceAlert(accountId);
        }
      }
    };

    return () => websocket.close();
  }, [accountId]); // Missing 'balance' in dependencies!
};
```


**The correct pattern using refs and callbacks:**


```javascript
const AccountBalanceWidget = ({ accountId }) => {
  const [balance, setBalance] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Use ref to access current balance without closure staleness
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const handleBalanceUpdate = useCallback((event) => {
    const newBalance = JSON.parse(event.data).balance;
    const currentBalance = balanceRef.current;

    if (newBalance !== currentBalance) {
      setBalance(newBalance);
      setLastUpdate(new Date().toISOString());

      // Now comparing against actual current balance
      if (newBalance < currentBalance * 0.1) {
        triggerLowBalanceAlert(accountId);
      }
    }
  }, [accountId]);

  useEffect(() => {
    const websocket = new WebSocket(`/ws/account/${accountId}`);
    websocket.onmessage = handleBalanceUpdate;
    return () => websocket.close();
  }, [accountId, handleBalanceUpdate]);
};
```


**Event Handler Optimization Pitfalls:**


```javascript
// PROBLEMATIC: Over-optimization leading to stale references
const TransactionList = ({ transactions, onTransactionUpdate }) => {
  // BUG: Missing onTransactionUpdate in dependencies
  const handleTransactionClick = useCallback((transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    onTransactionUpdate(transaction);
  }, [transactions]); // Should include onTransactionUpdate

  // This can lead to calling stale version of onTransactionUpdate
  return (
    <div>
      {transactions.map(transaction => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onClick={() => handleTransactionClick(transaction.id)}
        />
      ))}
    </div>
  );
};
```


**Production Debugging Techniques:**


```javascript
// Custom hook for debugging event handler issues
function useEventHandlerDebug(handlerName, handler, dependencies) {
  const previousDeps = useRef();
  const callCount = useRef(0);

  useEffect(() => {
    const current = dependencies;
    const previous = previousDeps.current;

    if (previous && current) {
      const changedDeps = current.reduce((acc, dep, index) => {
        if (dep !== previous[index]) {
          acc.push({ index, previous: previous[index], current: dep });
        }
        return acc;
      }, []);

      if (changedDeps.length > 0) {
        console.log(`${handlerName} dependencies changed:`, changedDeps);
      }
    }

    previousDeps.current = current;
  });

  return useCallback((...args) => {
    callCount.current++;
    console.log(`${handlerName} called ${callCount.current} times`);
    return handler(...args);
  }, dependencies);
}

// Usage
const optimizedHandler = useEventHandlerDebug(
  'handleTransactionUpdate',
  handleTransactionUpdate,
  [transactions, onTransactionUpdate]
);
```


**Memory Leak Detection in Event Handlers:**


```javascript
// Custom hook to detect potential memory leaks
function useEventHandlerLeakDetection() {
  const handlerRefs = useRef(new Set());

  const registerHandler = useCallback((handlerName, handler) => {
    if (handlerRefs.current.has(handlerName)) {
      console.warn(`Handler ${handlerName} registered multiple times`);
    }

    handlerRefs.current.add(handlerName);

    return (...args) => {
      if (!handlerRefs.current.has(handlerName)) {
        console.error(`Handler ${handlerName} called after cleanup`);
        return;
      }
      return handler(...args);
    };
  }, []);

  const cleanup = useCallback(() => {
    handlerRefs.current.clear();
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { registerHandler, cleanup };
}
```


**Real-world Production Issue Example:**


```javascript
// ACTUAL BUG from a banking application I worked on
const TransferConfirmationModal = ({ transfer, onConfirm, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // BUG: This captured the initial transfer object
  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);

    try {
      // CRITICAL: transfer data could be stale if modal stayed open
      // while user navigated and came back
      await processTransfer(transfer);
      onConfirm();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []); // Empty dependencies - WRONG!

  // Correct version
  const handleConfirmFixed = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Always use current transfer data
      await processTransfer(transfer);
      onConfirm();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [transfer, onConfirm]); // Proper dependencies

  return (
    <Modal>
      <p>Confirm transfer of ${transfer.amount} to {transfer.recipient}?</p>
      <button onClick={handleConfirmFixed} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Confirm'}
      </button>
      <button onClick={onCancel}>Cancel</button>
    </Modal>
  );
};
```


**Interviewer**: Wow, that's a great real-world example. The stale transfer data bug could have serious consequences in a banking application. Before we move to the coding challenge, I'd like to discuss testing strategies. How do you test event handlers, particularly the complex ones with async operations and state updates?


**Candidate**: Testing event handlers, especially in financial applications, requires a **multi-layered approach** because we need to verify not just the happy path, but also error conditions, race conditions, and edge cases that could impact financial data integrity.


**Unit Testing Event Handlers:**


```javascript
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('../services/accountAPI', () => ({
  transfer: jest.fn(),
  getAccount: jest.fn(),
}));

describe('AccountTransferForm', () => {
  const mockOnTransferComplete = jest.fn();
  const mockAccountAPI = require('../services/accountAPI');

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccountAPI.getAccount.mockResolvedValue({
      id: 'acc-123',
      balance: 1000,
      name: 'Checking Account'
    });
  });

  test('handles successful transfer with proper event flow', async () => {
    const user = userEvent.setup();
    mockAccountAPI.transfer.mockResolvedValue({
      success: true,
      transactionId: 'txn-456',
      newBalance: 750
    });

    render(
      <AccountTransferForm
        accountId="acc-123"
        onTransferComplete={mockOnTransferComplete}
      />
    );

    // Wait for initial account load
    await waitFor(() => {
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    // Simulate user input
    const amountInput = screen.getByPlaceholderText('Transfer amount');
    const targetInput = screen.getByPlaceholderText('Target account');

    await user.type(amountInput, '250');
    await user.type(targetInput, 'acc-789');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /transfer funds/i });
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(mockAccountAPI.transfer).toHaveBeenCalledWith({
        from: 'acc-123',
        to: 'acc-789',
        amount: 250
      });
    });

    // Verify callback invocation
    expect(mockOnTransferComplete).toHaveBeenCalledWith({
      success: true,
      transactionId: 'txn-456',
      newBalance: 750
    });

    // Verify form reset
    expect(amountInput.value).toBe('');
    expect(targetInput.value).toBe('');
  });

  test('handles validation errors correctly', async () => {
    const user = userEvent.setup();

    render(<AccountTransferForm accountId="acc-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    // Test insufficient funds
    const amountInput = screen.getByPlaceholderText('Transfer amount');
    await user.type(amountInput, '1500'); // More than balance

    const submitButton = screen.getByRole('button', { name: /transfer funds/i });
    await user.click(submitButton);

    // Should show validation error without API call
    expect(screen.getByText('Insufficient funds available')).toBeInTheDocument();
    expect(mockAccountAPI.transfer).not.toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    mockAccountAPI.transfer.mockRejectedValue(new Error('Network error'));

    render(<AccountTransferForm accountId="acc-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Transfer amount');
    const targetInput = screen.getByPlaceholderText('Target account');

    await user.type(amountInput, '250');
    await user.type(targetInput, 'acc-789');

    const submitButton = screen.getByRole('button', { name: /transfer funds/i });
    await user.click(submitButton);

    // Verify error display
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Verify form is not reset on error
    expect(amountInput.value).toBe('250');
    expect(targetInput.value).toBe('acc-789');
  });
});
```


**Integration Testing with Event Handler Flows:**


```javascript
describe('AccountTransferFlow Integration', () => {
  test('complete transfer workflow with real-time updates', async () => {
    const user = userEvent.setup();

    // Mock WebSocket for real-time balance updates
    const mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    global.WebSocket = jest.fn(() => mockWebSocket);

    const { container } = render(
      <div>
        <AccountBalanceWidget accountId="acc-123" />
        <AccountTransferForm accountId="acc-123" />
      </div>
    );

    // Wait for components to initialize
    await waitFor(() => {
      expect(screen.getByText(/balance:/i)).toBeInTheDocument();
    });

    // Simulate WebSocket balance update
    const balanceUpdateEvent = new MessageEvent('message', {
      data: JSON.stringify({ balance: 1000, timestamp: Date.now() })
    });

    // Trigger the WebSocket onmessage handler
    const onMessageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1];
    onMessageHandler(balanceUpdateEvent);

    // Verify balance display updated
    await waitFor(() => {
      expect(screen.getByText('Balance: $1000')).toBeInTheDocument();
    });

    // Perform transfer
    const amountInput = screen.getByPlaceholderText('Transfer amount');
    await user.type(amountInput, '250');

    // Mock successful transfer
    mockAccountAPI.transfer.mockResolvedValue({
      success: true,
      newBalance: 750
    });

    const submitButton = screen.getByRole('button', { name: /transfer funds/i });
    await user.click(submitButton);

    // Simulate real-time balance update after transfer
    const updatedBalanceEvent = new MessageEvent('message', {
      data: JSON.stringify({ balance: 750, timestamp: Date.now() })
    });
    onMessageHandler(updatedBalanceEvent);

    // Verify updated balance
    await waitFor(() => {
      expect(screen.getByText('Balance: $750')).toBeInTheDocument();
    });
  });
});
```


**Testing Race Conditions and Async Event Handlers:**


```javascript
describe('Race Condition Testing', () => {
  test('handles rapid successive clicks without duplicate transactions', async () => {
    const user = userEvent.setup();
    let transferCallCount = 0;

    mockAccountAPI.transfer.mockImplementation(() => {
      transferCallCount++;
      // Simulate slow API response
      return new Promise(resolve =>
        setTimeout(() => resolve({ success: true }), 1000)
      );
    });

    render(<AccountTransferForm accountId="acc-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Transfer amount');
    const targetInput = screen.getByPlaceholderText('Target account');

    await user.type(amountInput, '250');
    await user.type(targetInput, 'acc-789');

    const submitButton = screen.getByRole('button', { name: /transfer funds/i });

    // Rapid clicks
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Button should be disabled after first click
    expect(submitButton).toBeDisabled();

    // Wait for all async operations to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 2000 });

    // Should only have called API once
    expect(transferCallCount).toBe(1);
  });

  test('handles component unmount during async operation', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    mockAccountAPI.transfer.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    );

    const { unmount } = render(<AccountTransferForm accountId="acc-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    // Start transfer
    const amountInput = screen.getByPlaceholderText('Transfer amount');
    const targetInput = screen.getByPlaceholderText('Target account');

    await userEvent.type(amountInput, '250');
    await userEvent.type(targetInput, 'acc-789');

    const submitButton = screen.getByRole('button', { name: /transfer funds/i });
    await userEvent.click(submitButton);

    // Unmount component while transfer is in progress
    unmount();

    // Wait for async operation to complete
    await waitFor(() => {
      // Should not have any React state update errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('setState')
      );
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });
});
```


**Performance Testing for Event Handlers:**


```javascript
describe('Event Handler Performance', () => {
  test('event handler performance with large datasets', async () => {
    const largeTransactionList = Array.from({ length: 1000 }, (_, i) => ({
      id: `txn-${i}`,
      amount: Math.random() * 1000,
      date: new Date().toISOString(),
    }));

    const onTransactionUpdate = jest.fn();

    const startTime = performance.now();

    render(
      <TransactionList
        transactions={largeTransactionList}
        onTransactionUpdate={onTransactionUpdate}
      />
    );

    const renderTime = performance.now() - startTime;

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(100); // 100ms threshold

    // Test event handler performance
    const firstTransactionButton = screen.getAllByText('View Details')[0];

    const clickStartTime = performance.now();
    fireEvent.click(firstTransactionButton);
    const clickTime = performance.now() - clickStartTime;

    expect(clickTime).toBeLessThan(5); // 5ms threshold for event handling
    expect(onTransactionUpdate).toHaveBeenCalledWith(largeTransactionList[0]);
  });
});
```


**Interviewer**: Excellent testing strategies. I particularly appreciate your attention to race conditions and component unmounting during async operations - those are exactly the kinds of edge cases that can cause issues in production banking systems.


Now, let's move to our coding challenge. I'd like you to implement a real-world scenario we might encounter at NAB.


---


## Phần 3: Coding Challenge - Live Implementation (60 phút)


**Interviewer**: Here's the scenario: We need to build a **Transaction Monitoring Dashboard** component for our fraud detection system. This component needs to:


1. **Display real-time transaction streams** from multiple WebSocket connections
2. **Handle complex filtering and sorting** with immediate UI feedback
3. **Support bulk actions** on selected transactions
4. **Implement optimistic updates** for status changes
5. **Handle high-frequency updates** (up to 100 transactions per second) without performance degradation


The component should demonstrate:


- Proper event binding strategies for high-performance scenarios
- State management with complex interactions
- Error handling and recovery
- Memory-efficient handling of large datasets


I'll give you 60 minutes to implement this. You can choose your approach - class components, function components with hooks, or a hybrid. I'm particularly interested in seeing how you handle the event binding decisions we've been discussing.


**Candidate**: Perfect! This is exactly the kind of complex, real-world scenario I've worked with before. I'll implement this using modern React with hooks, but I'll incorporate some hybrid patterns where class-based approaches might be more appropriate for performance.


Let me start by creating the core structure and then we can dive into the specific event handling challenges.


**Candidate**: I've implemented a comprehensive Transaction Monitoring Dashboard that addresses all the requirements you specified. Let me walk you through the key architectural decisions and event binding strategies I used.


**Key Implementation Highlights:**


**1. Event Binding Strategy - Hybrid Approach:**


```javascript
// I chose useCallback for stable references while avoiding closure staleness
const handleTransactionSelect = useCallback((transactionId, isSelected) => {
  setSelectedTransactions(prev => {
    const newSet = new Set(prev);
    if (isSelected) {
      newSet.add(transactionId);
    } else {
      newSet.delete(transactionId);
    }
    return newSet;
  });
}, []); // Empty deps since we use functional setState
```


**2. WebSocket Event Handling with Ref Pattern:**


```javascript
// Using refs to prevent closure staleness in WebSocket callbacks
const transactionsRef = useRef([]);

const handleMessage = useCallback((event) => {
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'transaction') {
      // Using ref to access current state without dependency issues
      const updatedTransactions = [data.payload, ...transactionsRef.current.slice(0, 999)];
      transactionsRef.current = updatedTransactions;
      setTransactions(updatedTransactions);
    }
  } catch (err) {
    console.error('Failed to parse WebSocket message:', err);
  }
}, []);
```


**3. Performance Optimization with React.memo:**


```javascript
const TransactionRow = React.memo(({ transaction, isSelected, onSelect, onStatusChange, onViewDetails }) => {
  // Individual event handlers with stable references
  const handleSelectChange = useCallback((event) => {
    onSelect(transaction.id, event.target.checked);
  }, [transaction.id, onSelect]);

  // This prevents re-rendering of unchanged rows
});
```


**Interviewer**: Excellent implementation! I can see you've thought carefully about performance and event binding. A few questions:


1. **Why did you choose Set for selectedTransactions instead of an array?**
2. **How would you handle the scenario where we need to support 100+ transactions per second as mentioned in the requirements?**
3. **I notice you're using optimistic updates for status changes. What happens if the backend rejects the change?**


**Candidate**: Great questions! Let me address each one:


**1. Set vs Array for Selection Management:**


Using `Set` provides **O(1) lookup and modification** operations, which is crucial when dealing with large datasets:


```javascript
// With Set - O(1) operations
const isSelected = selectedTransactions.has(transactionId); // O(1)
newSet.add(transactionId); // O(1)
newSet.delete(transactionId); // O(1)

// With Array - O(n) operations
const isSelected = selectedTransactions.includes(transactionId); // O(n)
const newArray = [...selectedTransactions, transactionId]; // O(n)
const newArray = selectedTransactions.filter(id => id !== transactionId); // O(n)
```


In a banking application where users might select hundreds of transactions for bulk operations, this performance difference becomes significant.


**2. Handling 100+ Transactions Per Second:**


The current implementation can handle this, but I'd add additional optimizations:


**Additional optimizations for high-frequency updates:**


```javascript
// Virtual scrolling for large datasets (would implement with react-window)
const VirtualizedTransactionTable = ({ transactions, ...props }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={transactions.length}
      itemSize={50}
      itemData={{ transactions, ...props }}
    >
      {TransactionRowVirtualized}
    </FixedSizeList>
  );
};

// Debounced filtering to prevent excessive re-computations
const useDebouncedFilters = (filters, delay = 300) => {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, delay);

    return () => clearTimeout(handler);
  }, [filters, delay]);

  return debouncedFilters;
};
```


**3. Optimistic Updates Error Handling:**


Great catch! The current implementation lacks proper rollback. Here's how I'd handle backend rejections:


**Candidate**: I've now enhanced the implementation to address your concerns:


**For high-frequency updates**, I added a **batching mechanism** that:


- Collects updates for 100ms or until 50 transactions accumulate
- Processes them in a single React state update
- Reduces render cycles from 100+ per second to ~10 per second


**For optimistic updates**, I implemented **proper rollback handling**:


- Stores original state before optimistic update
- Shows visual feedback during update (`isUpdating` flag)
- Automatically reverts on backend failure
- Provides user-friendly error messages


The simulation now generates **burst traffic** (up to 100 TPS) to test the batching system.


**Interviewer**: Impressive! I can see the batching in action. Now let's dive deeper into some edge cases. What happens if:


1. **A user closes their laptop during a bulk operation** affecting 500 transactions?
2. **The WebSocket connection drops** while transactions are still being processed?
3. **We need to implement real-time collaborative features** where multiple fraud analysts are working on the same transaction set?


**Candidate**: Excellent edge cases! These are exactly the kinds of scenarios that can cause data integrity issues in production banking systems. Let me address each one:


**1. User closes laptop during bulk operation:**


This requires implementing **operation recovery and persistence**:


```javascript
// Enhanced bulk operation with persistence and recovery
const useBulkOperationRecovery = () => {
  const [pendingOperations, setPendingOperations] = useState(new Map());

  // Store operations in localStorage for recovery
  const persistOperation = useCallback((operationId, operation) => {
    const stored = JSON.parse(localStorage.getItem('pendingOperations') || '{}');
    stored[operationId] = {
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    };
    localStorage.setItem('pendingOperations', JSON.stringify(stored));

    setPendingOperations(prev => new Map(prev).set(operationId, operation));
  }, []);

  // Recovery mechanism on app restart
  const recoverPendingOperations = useCallback(async () => {
    const stored = JSON.parse(localStorage.getItem('pendingOperations') || '{}');

    for (const [operationId, operation] of Object.entries(stored)) {
      // Check if operation completed while offline
      const serverStatus = await checkOperationStatus(operationId);

      if (serverStatus === 'completed') {
        // Remove from pending list
        const updated = { ...stored };
        delete updated[operationId];
        localStorage.setItem('pendingOperations', JSON.stringify(updated));
      } else if (serverStatus === 'failed' || Date.now() - operation.timestamp > 300000) {
        // 5 minutes timeout - mark as failed
        await handleOperationFailure(operationId, operation);
      } else {
        // Still pending - continue monitoring
        setPendingOperations(prev => new Map(prev).set(operationId, operation));
      }
    }
  }, []);

  return { persistOperation, recoverPendingOperations, pendingOperations };
};

// Enhanced bulk status change with recovery
const handleBulkStatusChangeWithRecovery = useCallback(async (newStatus) => {
  const operationId = `bulk-${Date.now()}-${Math.random()}`;
  const selectedIds = Array.from(selectedTransactions);

  // Persist operation before starting
  persistOperation(operationId, {
    type: 'bulk_status_change',
    transactionIds: selectedIds,
    targetStatus: newStatus,
    progress: 0,
    total: selectedIds.length
  });

  let completed = 0;
  const batchSize = 10; // Process in smaller batches

  try {
    for (let i = 0; i < selectedIds.length; i += batchSize) {
      const batch = selectedIds.slice(i, i + batchSize);

      // Check if still online before each batch
      if (!navigator.onLine) {
        throw new Error('Connection lost during bulk operation');
      }

      await Promise.all(batch.map(id => handleStatusChange(id, newStatus)));

      completed += batch.length;

      // Update progress
      const updated = JSON.parse(localStorage.getItem('pendingOperations') || '{}');
      if (updated[operationId]) {
        updated[operationId].progress = completed;
        localStorage.setItem('pendingOperations', JSON.stringify(updated));
      }
    }

    // Mark as completed
    const updated = JSON.parse(localStorage.getItem('pendingOperations') || '{}');
    delete updated[operationId];
    localStorage.setItem('pendingOperations', JSON.stringify(updated));

  } catch (error) {
    console.error('Bulk operation failed:', error);
    // Will be recovered on next session
  }
}, [selectedTransactions, persistOperation, handleStatusChange]);
```


**2. WebSocket connection drops during processing:**


I'd implement **connection resilience with operation queuing**:


```javascript
// Enhanced WebSocket with operation queuing
const useResilientWebSocket = () => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const queuedOperationsRef = useRef([]);
  const heartbeatIntervalRef = useRef(null);

  const queueOperation = useCallback((operation) => {
    queuedOperationsRef.current.push({
      ...operation,
      timestamp: Date.now(),
      retryCount: 0
    });
  }, []);

  const processQueuedOperations = useCallback(async () => {
    const queue = queuedOperationsRef.current;
    queuedOperationsRef.current = [];

    for (const operation of queue) {
      try {
        if (operation.retryCount < 3) {
          await executeOperation(operation);
        } else {
          // Move to dead letter queue for manual review
          await moveToDeadLetterQueue(operation);
        }
      } catch (error) {
        // Re-queue with increased retry count
        queuedOperationsRef.current.push({
          ...operation,
          retryCount: operation.retryCount + 1
        });
      }
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 second heartbeat
  }, []);

  const handleConnectionRestore = useCallback(async () => {
    setConnectionState('connected');

    // Process any queued operations
    await processQueuedOperations();

    // Re-sync transaction states
    await syncTransactionStates();

    startHeartbeat();
  }, [processQueuedOperations]);

  return {
    connectionState,
    queueOperation,
    handleConnectionRestore
  };
};
```


**3. Real-time collaborative features:**


This requires **conflict resolution and operational transformation**:


```javascript
// Collaborative editing with conflict resolution
const useCollaborativeTransactionManagement = () => {
  const [collaborators, setCollaborators] = useState(new Map());
  const [transactionLocks, setTransactionLocks] = useState(new Map());
  const [conflictResolution, setConflictResolution] = useState(null);

  // Lock a transaction for editing
  const requestTransactionLock = useCallback(async (transactionId, userId) => {
    try {
      const response = await fetch('/api/transactions/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, userId })
      });

      const result = await response.json();

      if (result.success) {
        setTransactionLocks(prev => new Map(prev).set(transactionId, {
          userId,
          lockedAt: Date.now(),
          userName: result.userName
        }));
        return true;
      } else {
        // Show conflict dialog
        setConflictResolution({
          transactionId,
          currentEditor: result.currentEditor,
          requestedBy: userId
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to lock transaction:', error);
      return false;
    }
  }, []);

  // Handle simultaneous edits with operational transformation
  const handleConflictingEdit = useCallback((transactionId, localChange, remoteChange) => {
    // Implement operational transformation for transaction edits
    const resolution = resolveTransactionConflict(localChange, remoteChange);

    if (resolution.requiresUserInput) {
      setConflictResolution({
        transactionId,
        localChange,
        remoteChange,
        suggestedResolution: resolution.suggestion
      });
    } else {
      // Automatically resolve
      applyTransactionChange(transactionId, resolution.finalChange);
    }
  }, []);

  // Real-time presence indicators
  const updateCollaboratorPresence = useCallback((collaboratorUpdate) => {
    setCollaborators(prev => {
      const updated = new Map(prev);

      if (collaboratorUpdate.status === 'online') {
        updated.set(collaboratorUpdate.userId, {
          userName: collaboratorUpdate.userName,
          lastSeen: Date.now(),
          currentTransaction: collaboratorUpdate.currentTransaction,
          cursor: collaboratorUpdate.cursor
        });
      } else {
        updated.delete(collaboratorUpdate.userId);
      }

      return updated;
    });
  }, []);

  return {
    collaborators,
    transactionLocks,
    conflictResolution,
    requestTransactionLock,
    handleConflictingEdit,
    updateCollaboratorPresence
  };
};

// Conflict resolution UI component
const ConflictResolutionDialog = ({ conflict, onResolve }) => {
  return (
    <div className="conflict-dialog">
      <h3>Transaction Edit Conflict</h3>
      <p>
        Both you and {conflict.remoteChange.userName} modified transaction {conflict.transactionId}
      </p>

      <div className="conflict-options">
        <div className="change-preview">
          <h4>Your Changes:</h4>
          <pre>{JSON.stringify(conflict.localChange, null, 2)}</pre>
        </div>

        <div className="change-preview">
          <h4>Their Changes:</h4>
          <pre>{JSON.stringify(conflict.remoteChange, null, 2)}</pre>
        </div>

        <div className="suggested-resolution">
          <h4>Suggested Resolution:</h4>
          <pre>{JSON.stringify(conflict.suggestedResolution, null, 2)}</pre>
        </div>
      </div>

      <div className="conflict-actions">
        <button onClick={() => onResolve('accept_local')}>
          Keep My Changes
        </button>
        <button onClick={() => onResolve('accept_remote')}>
          Accept Their Changes
        </button>
        <button onClick={() => onResolve('accept_suggested')}>
          Use Suggested Resolution
        </button>
        <button onClick={() => onResolve('manual_merge')}>
          Manual Merge
        </button>
      </div>
    </div>
  );
};
```


**Additional Resilience Patterns:**


```javascript
// Distributed state synchronization for critical data
const useEventSourcing = () => {
  const [eventLog, setEventLog] = useState([]);

  const applyEvent = useCallback((event) => {
    // Append-only event log for audit trail
    setEventLog(prev => [...prev, {
      ...event,
      timestamp: Date.now(),
      id: generateEventId()
    }]);

    // Apply event to transaction state
    setTransactions(prev => applyEventToTransactions(prev, event));
  }, []);

  const replayEvents = useCallback((fromTimestamp) => {
    // Rebuild state from events for consistency
    const relevantEvents = eventLog.filter(e => e.timestamp >= fromTimestamp);
    return relevantEvents.reduce(applyEventToTransactions, []);
  }, [eventLog]);

  return { applyEvent, replayEvents, eventLog };
};
```


**Interviewer**: Outstanding! Your approach to handling these edge cases shows deep understanding of distributed systems challenges in financial applications. The event sourcing pattern and conflict resolution strategies are particularly relevant for our audit requirements.


Let me ask one final challenging question: **How would you implement automated testing for these complex, stateful event interactions, particularly the race conditions and collaborative editing scenarios we just discussed?**


**Candidate**: Excellent question! Testing these complex stateful interactions requires a **multi-layered strategy** that goes beyond traditional unit tests. In banking applications, we need to ensure these systems work flawlessly under extreme conditions.


**1. Race Condition Testing with Concurrent Simulation:**


```javascript
// Custom testing utility for race condition scenarios
const createConcurrentTestHarness = () => {
  const mockWebSocket = {
    send: jest.fn(),
    close: jest.fn(),
    readyState: WebSocket.OPEN,
    messageHandlers: new Set()
  };

  const simulateMessage = (data) => {
    mockWebSocket.messageHandlers.forEach(handler => {
      handler({ data: JSON.stringify(data) });
    });
  };

  const simulateConcurrentUpdates = async (updates, concurrency = 10) => {
    const promises = updates.map((update, index) =>
      new Promise(resolve => {
        setTimeout(() => {
          simulateMessage(update);
          resolve(index);
        }, Math.random() * 100); // Random timing to simulate real network conditions
      })
    );

    return Promise.all(promises);
  };

  return { mockWebSocket, simulateMessage, simulateConcurrentUpdates };
};

describe('Race Condition Testing', () => {
  test('handles rapid transaction updates without data corruption', async () => {
    const { mockWebSocket, simulateConcurrentUpdates } = createConcurrentTestHarness();
    const { result } = renderHook(() => useTransactionStream());

    // Generate 100 concurrent transaction updates
    const updates = Array.from({ length: 100 }, (_, i) => ({
      type: 'transaction',
      payload: generateTransaction(`RACE-TEST-${i}`)
    }));

    await act(async () => {
      await simulateConcurrentUpdates(updates);
    });

    // Verify no transactions were lost or corrupted
    expect(result.current.transactions).toHaveLength(100);

    // Verify all transactions have unique IDs
    const ids = result.current.transactions.map(t => t.id);
    expect(new Set(ids)).toHaveLength(100);

    // Verify transactions are properly ordered (newest first)
    for (let i = 1; i < result.current.transactions.length; i++) {
      expect(new Date(result.current.transactions[i-1].timestamp))
        .toBeAfter(new Date(result.current.transactions[i].timestamp));
    }
  });

  test('handles bulk operation race conditions', async () => {
    const mockAPI = {
      updateStatus: jest.fn().mockImplementation((id) =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), Math.random() * 200)
        )
      )
    };

    const { result } = renderHook(() => useBulkOperations(mockAPI));

    // Simulate user rapidly clicking bulk update
    const bulkUpdates = Array.from({ length: 5 }, () =>
      result.current.handleBulkStatusChange('flagged')
    );

    await act(async () => {
      await Promise.all(bulkUpdates);
    });

    // Should only process one bulk operation despite multiple clicks
    expect(mockAPI.updateStatus).toHaveBeenCalledTimes(50); // 10 transactions × 1 operation
  });
});
```


**2. Collaborative Editing Test Framework:**


```javascript
// Multi-user simulation for collaborative features
const createMultiUserTestEnvironment = () => {
  const users = new Map();
  const sharedState = { transactions: [], locks: new Map() };

  const createUser = (userId, userName) => {
    const userContext = {
      userId,
      userName,
      mockWebSocket: {
        send: jest.fn(),
        messageHandlers: new Set(),
        simulate: (message) => {
          // Broadcast to all other users
          users.forEach((user, id) => {
            if (id !== userId) {
              user.mockWebSocket.messageHandlers.forEach(handler =>
                handler({ data: JSON.stringify(message) })
              );
            }
          });
        }
      }
    };

    users.set(userId, userContext);
    return userContext;
  };

  return { createUser, users, sharedState };
};

describe('Collaborative Editing', () => {
  test('handles simultaneous transaction lock attempts', async () => {
    const testEnv = createMultiUserTestEnvironment();

    const analyst1 = testEnv.createUser('user-1', 'Alice');
    const analyst2 = testEnv.createUser('user-2', 'Bob');

    const { result: result1 } = renderHook(() =>
      useCollaborativeTransactionManagement(analyst1.mockWebSocket)
    );
    const { result: result2 } = renderHook(() =>
      useCollaborativeTransactionManagement(analyst2.mockWebSocket)
    );

    const transactionId = 'TXN-CONFLICT-TEST';

    // Both users try to lock the same transaction simultaneously
    await act(async () => {
      const lockPromise1 = result1.current.requestTransactionLock(transactionId);
      const lockPromise2 = result2.current.requestTransactionLock(transactionId);

      const [lock1, lock2] = await Promise.all([lockPromise1, lockPromise2]);

      // Only one should succeed
      expect(lock1 || lock2).toBe(true);
      expect(lock1 && lock2).toBe(false);
    });

    // The user who didn't get the lock should see conflict resolution dialog
    const conflictUser = result1.current.conflictResolution ? result1 : result2;
    expect(conflictUser.current.conflictResolution).toEqual(
      expect.objectContaining({
        transactionId,
        currentEditor: expect.any(String)
      })
    );
  });

  test('resolves operational transformation conflicts correctly', async () => {
    const testEnv = createMultiUserTestEnvironment();

    const analyst1 = testEnv.createUser('user-1', 'Alice');
    const analyst2 = testEnv.createUser('user-2', 'Bob');

    // Setup: Both users start with same transaction state
    const initialTransaction = {
      id: 'TXN-OT-TEST',
      status: 'pending',
      amount: 1000,
      riskScore: 75
    };

    // Simulate concurrent edits
    const edit1 = { status: 'flagged', riskScore: 85 }; // Alice flags as risky
    const edit2 = { status: 'approved', amount: 1200 }; // Bob approves with amount correction

    const resolution = await resolveOperationalTransform(
      initialTransaction,
      edit1,
      edit2
    );

    // Expected: Amount change preserved, but status should be flagged due to risk score
    expect(resolution).toEqual(
      expect.objectContaining({
        status: 'flagged', // Security takes precedence
        amount: 1200,      // Amount correction preserved
        riskScore: 85      // Updated risk score preserved
      })
    );
  });
});
```


**3. Chaos Engineering for System Resilience:**


```javascript
// Chaos testing framework for network failures and system stress
const createChaosTestEnvironment = () => {
  const networkConditions = {
    latency: 0,
    packetLoss: 0,
    bandwidth: Infinity,
    offline: false
  };

  const applyChaos = (condition) => {
    Object.assign(networkConditions, condition);
  };

  const mockFetch = jest.fn().mockImplementation(async (url, options) => {
    // Simulate network conditions
    if (networkConditions.offline) {
      throw new Error('Network unavailable');
    }

    if (Math.random() < networkConditions.packetLoss) {
      throw new Error('Request timeout');
    }

    await new Promise(resolve =>
      setTimeout(resolve, networkConditions.latency)
    );

    return {
      ok: Math.random() > 0.05, // 5% API failure rate
      json: () => Promise.resolve({ success: true })
    };
  });

  return { applyChaos, networkConditions, mockFetch };
};

describe('Chaos Engineering Tests', () => {
  test('system remains stable under network chaos', async () => {
    const chaosEnv = createChaosTestEnvironment();
    global.fetch = chaosEnv.mockFetch;

    const { result } = renderHook(() => useTransactionMonitoring());

    // Apply various chaos conditions
    const chaosScenarios = [
      { latency: 5000, packetLoss: 0.3 }, // High latency + packet loss
      { offline: true },                   // Complete offline
      { latency: 100, packetLoss: 0.1 }   // Mild degradation
    ];

    for (const scenario of chaosScenarios) {
      await act(async () => {
        chaosEnv.applyChaos(scenario);

        // Perform various operations under chaos
        await result.current.handleBulkStatusChange('flagged');
        await result.current.refreshTransactions();

        // System should continue functioning
        expect(result.current.error).toBeNull();
        expect(result.current.isConnected).toBeDefined();
      });
    }
  });

  test('graceful degradation under extreme load', async () => {
    const { result } = renderHook(() => useTransactionStream());

    // Simulate extreme transaction load
    const extremeLoad = Array.from({ length: 1000 }, (_, i) =>
      generateTransaction(`LOAD-TEST-${i}`)
    );

    await act(async () => {
      // Blast all transactions at once
      extremeLoad.forEach(transaction => {
        result.current.addTransaction(transaction);
      });
    });

    // Should handle gracefully with batching
    expect(result.current.transactions.length).toBeLessThanOrEqual(1000);

    // Should maintain data integrity
    const uniqueIds = new Set(result.current.transactions.map(t => t.id));
    expect(uniqueIds.size).toBe(result.current.transactions.length);
  });
});
```


**4. Integration Testing with Real-World Scenarios:**


```javascript
// End-to-end workflow testing
describe('Real-World Integration Scenarios', () => {
  test('complete fraud analyst workflow under stress', async () => {
    const mockBackend = createMockBankingBackend();

    // Setup: Analyst receives high-risk transaction alert
    const highRiskTransaction = generateTransaction('HIGH-RISK-001', {
      riskScore: 95,
      amount: 50000,
      location: 'Unknown'
    });

    render(<TransactionMonitoringDashboard />);

    // 1. Transaction appears in real-time feed
    await act(async () => {
      mockBackend.sendTransaction(highRiskTransaction);
    });

    expect(screen.getByText(/HIGH-RISK-001/)).toBeInTheDocument();

    // 2. Analyst investigates and flags transaction
    const flagButton = screen.getByRole('button', { name: /flag/ });
    await userEvent.click(flagButton);

    // 3. While analyst works, connection drops
    await act(async () => {
      mockBackend.simulateConnectionDrop();
    });

    // 4. Analyst continues working offline
    const bulkSelect = screen.getByRole('checkbox', { name: /select all/ });
    await userEvent.click(bulkSelect);

    const bulkFlag = screen.getByRole('button', { name: /bulk flag/ });
    await userEvent.click(bulkFlag);

    // 5. Connection restores
    await act(async () => {
      mockBackend.restoreConnection();
    });

    // 6. Verify all operations were properly queued and executed
    await waitFor(() => {
      expect(mockBackend.getOperationLog()).toHaveLength(2);
      expect(mockBackend.getOperationLog()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'flag_transaction' }),
          expect.objectContaining({ type: 'bulk_flag' })
        ])
      );
    });
  });
});
```


**5. Property-Based Testing for Event Handlers:**


```javascript
// Property-based testing with fast-check
import fc from 'fast-check';

describe('Event Handler Property Tests', () => {
  test('transaction selection is always consistent', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        id: fc.string(),
        selected: fc.boolean()
      })),
      (transactionSelections) => {
        const { result } = renderHook(() => useTransactionSelection());

        // Apply random selection operations
        act(() => {
          transactionSelections.forEach(({ id, selected }) => {
            result.current.setSelected(id, selected);
          });
        });

        // Properties that should always hold:
        const selectedSet = result.current.selectedTransactions;

        // 1. No duplicates in selection
        expect(selectedSet.size).toBe(
          [...selectedSet].length
        );

        // 2. All selected items should be valid transaction IDs
        [...selectedSet].forEach(id => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });

        // 3. Selection state should be deterministic
        const finalState = [...selectedSet].sort();
        const expectedState = transactionSelections
          .filter(t => t.selected)
          .map(t => t.id)
          .sort();

        expect(finalState).toEqual(expectedState);
      }
    ));
  });
});
```


**Interviewer**: Exceptional! Your testing strategy demonstrates deep understanding of the complexities involved in testing distributed, real-time financial systems. The combination of chaos engineering, property-based testing, and collaborative scenario testing shows you think about testing the same way we do at NAB.


Let me wrap up with one final question: **If you had to choose between using arrow functions or bind for a new large-scale React application at NAB, what would be your recommendation and why?**


**Candidate**: Based on everything we've discussed and my experience with large-scale financial applications, I would recommend **arrow functions as the primary pattern**, but with important caveats and a hybrid approach where appropriate.


**My Recommendation: Arrow Functions with Strategic Exceptions**


**Primary Choice: Arrow Functions**


```javascript
// Recommended pattern for most scenarios
class TransactionProcessor extends React.Component {
  handleTransactionUpdate = async (transactionId, updates) => {
    // Clear, readable, no binding required
    await this.updateTransaction(transactionId, updates);
  };

  render() {
    return (
      <TransactionForm onUpdate={this.handleTransactionUpdate} />
    );
  }
}
```


**Reasoning:**


**1. Developer Experience & Maintainability (Crucial for large teams)**


- **Reduces cognitive load**: New developers don't need to remember to bind
- **Fewer bugs**: Eliminates `this is undefined` errors that can cause production issues
- **Cleaner code**: No constructor binding boilerplate
- **Better refactoring**: Less code to update when moving methods around


**2. Modern Ecosystem Alignment**


- **Industry standard**: Most React codebases use arrow functions
- **Tooling support**: Better ESLint rules, IDE support
- **Team velocity**: Faster onboarding for new developers


**3. Performance is Acceptable**


- In modern browsers, the performance difference is negligible for most applications
- React's reconciliation is sophisticated enough to handle function identity changes efficiently
- The productivity gains outweigh the minimal performance cost


**Strategic Exceptions - Use Bind When:**


**1. High-Performance List Components**


```javascript
// For components that render 1000+ items frequently
class HighFrequencyTransactionList extends React.Component {
  constructor(props) {
    super(props);
    this.handleItemClick = this.handleItemClick.bind(this);
  }

  handleItemClick(transactionId) {
    // Stable reference prevents unnecessary re-renders
    this.props.onTransactionSelect(transactionId);
  }

  render() {
    return this.props.transactions.map(transaction => (
      <TransactionItem
        key={transaction.id}
        onClick={() => this.handleItemClick(transaction.id)}
      />
    ));
  }
}
```


**2. Legacy Integration & Library Compatibility**


```javascript
// When integrating with older libraries that expect stable references
class LegacyIntegration extends React.Component {
  constructor(props) {
    super(props);
    this.handleLegacyCallback = this.handleLegacyCallback.bind(this);
  }
}
```


**3. Memory-Constrained Environments**


```javascript
// For mobile apps or embedded systems where memory is critical
class MobileOptimizedComponent extends React.Component {
  constructor(props) {
    super(props);
    // Bind for critical path handlers
    this.handleCriticalAction = this.handleCriticalAction.bind(this);
  }
}
```


**Hybrid Architecture Recommendation:**


```javascript
// Team coding standards for NAB
const CODING_STANDARDS = {
  defaultPattern: 'arrow-functions',
  exceptions: {
    highFrequencyComponents: 'bind',
    legacyIntegration: 'bind',
    criticalPerformancePath: 'bind'
  },

  // ESLint rules to enforce consistency
  eslintRules: {
    'react/prefer-arrow-function-event-handlers': 'warn',
    'react/no-bind-in-render': 'error',
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }]
  }
};

// Documentation template for exceptions
/**
 * @performance-critical
 * Using bind pattern due to high-frequency rendering (1000+ items)
 * Measured 15% performance improvement in Chrome DevTools
 * Last reviewed: 2025-08-10
 */
```


**Implementation Strategy for NAB:**


**1. Migration Plan**


- **New code**: Arrow functions by default
- **Existing code**: Refactor opportunistically, not wholesale
- **Performance hotspots**: Profile first, then decide


**2. Team Education**


- **Code review guidelines**: Flag unnecessary binding patterns
- **Performance monitoring**: Track render performance in production
- **Documentation**: Clear examples of when to use each pattern


**3. Tooling & Automation**


```javascript
// Custom ESLint rule for NAB-specific patterns
module.exports = {
  rules: {
    'nab/event-handler-pattern': {
      create(context) {
        return {
          MethodDefinition(node) {
            if (isEventHandler(node) && isHighFrequencyComponent(context)) {
              if (node.value.type === 'ArrowFunctionExpression') {
                context.report({
                  node,
                  message: 'Use bind pattern for high-frequency components'
                });
              }
            }
          }
        };
      }
    }
  }
};
```


**Final Recommendation Summary:**


**For NAB's new React applications:**


- **Default to arrow functions** for 90% of event handlers
- **Use bind strategically** for proven performance bottlenecks
- **Establish clear guidelines** with measurable criteria for exceptions
- **Focus on consistency** within each component/module
- **Monitor performance** in production to validate decisions


This approach balances **developer productivity**, **code maintainability**, and **performance** - the three pillars that matter most in large-scale banking applications where both development velocity and system reliability are critical.


**Interviewer**: Perfect! Your recommendation shows exactly the kind of nuanced, data-driven thinking we value at NAB. You've demonstrated not just technical knowledge, but the ability to make practical architectural decisions for large-scale enterprise applications.


Your implementation of the Transaction Monitoring Dashboard was impressive - it showed mastery of event binding patterns, performance optimization, error handling, and real-world edge cases. The testing strategies you outlined would fit perfectly into our CI/CD pipeline.


Thank you for this comprehensive technical discussion. Do you have any questions about the role or about how we implement these kinds of systems at NAB?


---


## Kết thúc Interview - Summary & Feedback


**Candidate**: Thank you so much for this engaging interview! I really enjoyed diving deep into these React patterns and discussing the real-world challenges of building financial applications.


I do have a couple of questions:


1. **What's NAB's current approach to state management** in large React applications? Are you using Redux, Zustand, or a combination of different solutions?
2. **How does NAB handle the testing pyramid** for these complex UIs? Do you have dedicated teams for different types of testing?
3. **What's the biggest technical challenge** the frontend team is currently facing that this role would help address?


**Interviewer**: Great questions! Let me address each:


**1. State Management at NAB:**
We use a **hybrid approach** depending on the application complexity:


- **Zustand** for new, smaller applications and isolated features
- **Redux Toolkit** for our core banking platform with complex state flows
- **React Query/SWR** for server state management and caching
- **Jotai** for specific use cases requiring atomic state management


**2. Testing Strategy:**
We have a **three-tier approach**:


- **Development teams** own unit and integration tests
- **QA engineers** embedded in each team for end-to-end scenarios
- **Platform team** maintains testing infrastructure and chaos engineering
- **Performance team** handles load testing and production monitoring


**3. Current Technical Challenges:**
The biggest challenge is **modernizing our legacy React class components** while maintaining 99.9% uptime. We're dealing with:


- **Incremental migration** to hooks without breaking existing functionality
- **Performance optimization** for mobile banking apps
- **Real-time collaboration features** for our internal tools
- **Accessibility compliance** across all customer-facing applications


This role would be crucial in leading the frontend architecture decisions for these initiatives.


**Overall Assessment:**
Your performance today was **excellent**. You demonstrated:


- ✅ **Deep technical knowledge** of React internals and event binding
- ✅ **Practical experience** with large-scale application challenges
- ✅ **Strong problem-solving** approach to complex scenarios
- ✅ **Excellent communication** of technical concepts
- ✅ **Production-ready thinking** about error handling and edge cases


**Next Steps:**
We'll be moving forward with a **system design interview** focusing on frontend architecture, followed by a **cultural fit interview** with the team leads.


Welcome to what we hope will be the next step in your journey with NAB!


---


**Total Interview Duration: ~2.5 hours**

**Assessment Level: L5/L6 (Senior/Staff Engineer)**

**Recommendation: Strong Hire** 🎯
