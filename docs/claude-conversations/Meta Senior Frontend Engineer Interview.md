# Meta Senior Frontend Engineer Interview

## Claude


Tôi sẽ tạo một cuộc mô phỏng phỏng vấn kỹ thuật hoàn chỉnh cho vị trí Senior Frontend Engineer tại Meta dựa trên yêu cầu của bạn. Đây sẽ là một cuộc phỏng vấn chi tiết với các tiêu chuẩn cao của Meta.


Tôi đã tạo một cuộc mô phỏng phỏng vấn kỹ thuật hoàn chỉnh cho vị trí Senior Frontend Engineer tại Meta. Cuộc phỏng vấn này bao gồm:


## Cấu trúc cuộc phỏng vấn:


### 1. Warm-up & Introduction (15 phút)


- Giới thiệu bản thân và kinh nghiệm
- Thảo luận về tech stack và scale tại Meta
- Tìm hiểu về team structure


### 2. Deep Technical Discussion (45 phút)


Covering các topics chính:


- **React Fundamentals**: Class vs Function components, Hooks mental model
- **JavaScript Core**: JSON.stringify limitations, iteration patterns
- **Array Operations**: slice/splice/split differences, array-like conversions
- **Algorithm Implementation**: Deduplication strategies, frequency analysis


### 3. Coding Challenge (30 phút)


- Live coding session với frequency analysis problem
- Performance optimization strategies
- Edge case handling (NaN, circular references)
- React integration patterns
- Production-ready solutions


## Highlights của cuộc phỏng vấn:


✅ **Technical Excellence**: Deep dive vào performance implications và memory considerations

✅ **Real-world Applications**: React hooks, state management, production patterns

✅ **Problem Solving**: Multiple approaches với trade-off analysis

✅ **Modern Development**: Web Workers, TypeScript, testing strategies

✅ **Meta Standards**: L5/L6 level expectations với comprehensive evaluation


Cuộc phỏng vấn demonstrate một assessment toàn diện theo tiêu chuẩn của Meta, từ fundamental concepts đến advanced production scenarios. Candidate được đánh giá **STRONG HIRE** ở level L6.


Bạn có muốn tôi deep dive vào bất kỳ phần nào cụ thể hoặc tạo thêm scenarios khác không?


## Claude


# Mô Phỏng Cuộc Phỏng Vấn Senior Frontend Engineer - Meta


## Thông Tin Cuộc Phỏng Vấn


- **Vị trí**: Senior Frontend Engineer (L5/L6)
- **Công ty**: Meta
- **Thời gian**: 90 phút
- **Định dạng**: Technical Interview Round


---


## PHẦN 1: WARM-UP & INTRODUCTION (15 phút)


**Interviewer**: Chào bạn! Tôi là Alex Chen, Staff Engineer tại Meta, có 12 năm kinh nghiệm trong frontend development. Hôm nay tôi sẽ thực hiện cuộc phỏng vấn kỹ thuật với bạn cho vị trí Senior Frontend Engineer. Trước tiên, bạn có thể giới thiệu bản thân và kinh nghiệm của mình không?


**Candidate**: Chào Alex! Cảm ơn bạn đã dành thời gian. Tôi là Sarah, có 7 năm kinh nghiệm frontend development. Hiện tại tôi đang là Senior Frontend Engineer tại một startup fintech, chủ yếu làm việc với React ecosystem. Tôi đã xây dựng và maintain các ứng dụng có hàng triệu users, từ responsive web apps đến complex dashboard systems.


Kinh nghiệm của tôi bao gồm:


- **React/Next.js**: 5+ năm, từ class components đến modern hooks
- **State Management**: Redux, Zustand, Jotai, React Query cho server state
- **Performance Optimization**: Code splitting, lazy loading, bundle optimization
- **Architecture**: Micro-frontends, component libraries, design systems
- **Testing**: Jest, RTL, Cypress, performance testing


Điều tôi đặc biệt tự hào là đã lead việc migration từ legacy jQuery codebase sang React, cải thiện performance 40% và developer experience đáng kể.


**Interviewer**: Thật ấn tượng! Migration từ jQuery sang React không phải việc đơn giản. Trước khi đi vào technical deep dive, bạn có câu hỏi nào về team structure hay tech stack tại Meta không?


**Candidate**: Có, tôi muốn hiểu về scale mà team sẽ làm việc. Từ những gì tôi biết, Meta có millions of concurrent users. Làm thế nào team approach việc performance optimization và reliability ở scale đó? Và team có sử dụng internal tools hay frameworks đặc biệt nào không?


**Interviewer**: Excellent question! Tại Meta, chúng tôi serving billions of users daily, nên performance và reliability là top priorities. Chúng tôi có extensive monitoring systems, A/B testing infrastructure, và progressive rollout strategies. Về tech stack, ngoài React, chúng tôi còn sử dụng Relay cho GraphQL, Recoil cho state management, và nhiều internal tools như Metro bundler, Flipper cho debugging.


Giờ hãy dive vào technical discussion nhé!


---


## PHẦN 2: DEEP TECHNICAL DISCUSSION (45 phút)


### 2.1 React Fundamentals & Evolution


**Interviewer**: Let's start with React fundamentals. **What is the difference between class components and function components**, và bạn thấy evolution của React đã impact như thế nào đến development practices?


**Candidate**: Đây là câu hỏi fundamental nhưng rất quan trọng. Để answer comprehensively:


#### Syntax & Structure Differences:


**Class Components:**


```javascript
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null, loading: true };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    // method binding required
  }

  render() {
    return <div>{this.state.user?.name}</div>;
  }
}
```


**Function Components:**


```javascript
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleClick = useCallback(() => {
    // automatically bound
  }, []);

  return <div>{user?.name}</div>;
};
```


#### Key Technical Differences:


1. **Instantiation & Memory:**

Class components tạo instance mỗi lần render, có lifecycle methods và this context
Function components là pure functions, được called directly, lighter memory footprint
2. **State Management Evolution:**

Before Hooks: Class components only choice for stateful logic
After Hooks: Function components có thể handle state, side effects, context
3. **Performance Characteristics:**
javascript// Class component - harder to optimize
class ExpensiveComponent extends React.Component {
  shouldComponentUpdate(nextProps) {
    // Manual optimization required
    return nextProps.data !== this.props.data;
  }
}

// Function component - easier optimization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
}, (prevProps, nextProps) => prevProps.data === nextProps.data);
4. **Bundle Size Impact:**

Function components tree-shake better
Class components carry more runtime overhead


#### Evolution Impact on Development:


**Before Hooks Era (2018-):**


- **HOCs và Render Props** cho logic reuse
- **Wrapper hell** problem
- State logic tightly coupled với UI components


**After Hooks Era (2018+):**


- **Custom hooks** cho logic extraction
- **Cleaner composition patterns**
- **Better testing** - easier to test pure functions


```javascript
// Modern approach với custom hooks
const useUserProfile = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser).catch(setError).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
};

const UserProfile = ({ userId }) => {
  const { user, loading, error } = useUserProfile(userId);
  // Clean, testable, reusable
};
```


**Interviewer**: Great comprehensive answer! I can see you understand both the technical and practical implications. Now, bạn mention về custom hooks. **Can you dive deeper into the mental model behind hooks và potential pitfalls mà senior engineers cần aware?**


**Candidate**: Absolutely! **Hooks mental model** là một trong những concepts quan trọng nhất mà senior engineers phải master.


#### Hooks Mental Model:


**1. Closure-based State Management:**


```javascript
const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);

  // Common pitfall - stale closure
  const increment = () => {
    setTimeout(() => {
      setCount(count + 1); // ❌ Stale closure
    }, 1000);
  };

  // Correct approach
  const incrementCorrect = () => {
    setTimeout(() => {
      setCount(prev => prev + 1); // ✅ Function update
    }, 1000);
  };

  return { count, increment: incrementCorrect };
};
```


**2. Dependency Array Mental Model:**


```javascript
const useExpensiveData = (userId, filters) => {
  const [data, setData] = useState(null);

  // ❌ Missing dependencies
  useEffect(() => {
    fetchData(userId, filters).then(setData);
  }, [userId]); // filters missing!

  // ✅ Exhaustive dependencies
  useEffect(() => {
    fetchData(userId, filters).then(setData);
  }, [userId, filters]);

  // ✅ Hoặc use useCallback để stable references
  const fetchCallback = useCallback(() => {
    return fetchData(userId, filters);
  }, [userId, filters]);

  useEffect(() => {
    fetchCallback().then(setData);
  }, [fetchCallback]);
};
```


#### Advanced Patterns & Pitfalls:


**1. Rules of Hooks Violations:**


```javascript
// ❌ Conditional hooks
const BadComponent = ({ shouldFetch }) => {
  if (shouldFetch) {
    const data = useQuery('data'); // Violation!
  }
};

// ✅ Conditional logic inside hooks
const GoodComponent = ({ shouldFetch }) => {
  const { data } = useQuery('data', {
    enabled: shouldFetch
  });
};
```


**2. Complex State Updates:**


```javascript
const useComplexState = () => {
  const [state, setState] = useState({
    user: null,
    preferences: {},
    loading: false
  });

  // ❌ Object mutation
  const updateUser = (user) => {
    state.user = user; // Mutation!
    setState(state);
  };

  // ✅ Immutable updates
  const updateUserCorrect = (user) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, ...user }
    }));
  };

  // ✅ Hoặc sử dụng useReducer cho complex state
  return { state, updateUser: updateUserCorrect };
};
```


**3. Performance Optimization Patterns:**


```javascript
const useOptimizedList = (items, filters) => {
  // ❌ Recreated every render
  const filteredItems = items.filter(item =>
    filters.includes(item.category)
  );

  // ✅ Memoized computation
  const filteredItems = useMemo(() =>
    items.filter(item => filters.includes(item.category)),
    [items, filters]
  );

  // ✅ Stable callbacks
  const handleItemClick = useCallback((id) => {
    // handle click
  }, []);

  return { filteredItems, handleItemClick };
};
```


#### Advanced Custom Hook Patterns:


**1. Compound Hooks Pattern:**


```javascript
const useFormWithValidation = (validationSchema) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((field, value) => {
    const result = validationSchema[field]?.(value);
    setErrors(prev => ({ ...prev, [field]: result }));
    return result;
  }, [validationSchema]);

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    validate(field, value);
  }, [validate]);

  const setTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    isValid: Object.values(errors).every(error => !error)
  };
};
```


**2. Resource Management Hooks:**


```javascript
const useAsyncResource = (asyncFn, deps) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    asyncFn()
      .then(data => {
        if (!cancelled && mountedRef.current) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled && mountedRef.current) {
          setState(prev => ({ ...prev, loading: false, error }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
};
```


**Critical Pitfalls ở Production:**


1. **Infinite re-renders** do missing dependencies
2. **Memory leaks** từ unstable references
3. **Stale closures** trong async operations
4. **Performance degradation** từ unnecessary re-renders


**Interviewer**: Excellent deep dive! You clearly understand the nuances. Now let's shift to a common but tricky topic - **JSON.stringify limitations**. Trong context của React apps, especially khi dealing với API responses và caching, **what are the shortcomings of JSON.stringify và how do you handle them in production?**


### 2.2 JSON.stringify Deep Dive & Production Implications


**Candidate**: JSON.stringify limitations là một topic rất practical trong React development, especially khi work với complex data structures và caching mechanisms.


#### Core Limitations & Production Impact:


**1. Date Objects Loss:**


```javascript
const apiResponse = {
  user: { name: 'John' },
  createdAt: new Date('2024-01-15T10:30:00Z'),
  lastLogin: new Date('2024-01-16T08:15:00Z')
};

// ❌ Problematic serialization
const serialized = JSON.stringify(apiResponse);
const deserialized = JSON.parse(serialized);

console.log(deserialized.createdAt); // "2024-01-15T10:30:00.000Z" (string!)
console.log(deserialized.createdAt instanceof Date); // false

// ✅ Production solution với custom replacer/reviver
const dateReplacer = (key, value) => {
  if (value instanceof Date) {
    return { __type: 'Date', value: value.toISOString() };
  }
  return value;
};

const dateReviver = (key, value) => {
  if (value && value.__type === 'Date') {
    return new Date(value.value);
  }
  return value;
};

const properSerialized = JSON.stringify(apiResponse, dateReplacer);
const properDeserialized = JSON.parse(properSerialized, dateReviver);
```


**2. Function & Undefined Loss - Critical trong Component Serialization:**


```javascript
// ❌ Problematic trong component props caching
const componentProps = {
  data: { name: 'John' },
  onSubmit: () => console.log('submitted'), // Lost!
  metadata: undefined, // Lost!
  config: {
    enabled: true,
    callback: () => alert('done') // Lost!
  }
};

// Result: { data: { name: 'John' }, config: { enabled: true } }

// ✅ Solution: Separate serializable data từ functions
const useSerializableProps = (props) => {
  const { onSubmit, callback, ...serializable } = props;

  // Cache serializable data
  const cacheKey = useMemo(() =>
    JSON.stringify(serializable), [serializable]
  );

  // Store functions separately
  const functionsRef = useRef({ onSubmit, callback });
  functionsRef.current = { onSubmit, callback };

  return { cacheKey, functions: functionsRef.current };
};
```


**3. RegExp & Error Objects - Impact State Management:**


```javascript
const complexState = {
  validationRules: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // ❌ Becomes {}
    phone: /^\+?[\d\s-()]+$/ // ❌ Becomes {}
  },
  lastError: new Error('Network failed'), // ❌ Becomes {}
  retryCount: 3
};

// ✅ Production pattern cho RegExp serialization
class SerializableRegExp {
  constructor(pattern, flags) {
    this.pattern = pattern;
    this.flags = flags;
    this.regex = new RegExp(pattern, flags);
  }

  test(str) {
    return this.regex.test(str);
  }

  toJSON() {
    return {
      __type: 'RegExp',
      pattern: this.pattern,
      flags: this.flags
    };
  }

  static fromJSON(obj) {
    return new SerializableRegExp(obj.pattern, obj.flags);
  }
}

// Custom reviver cho complex objects
const customReviver = (key, value) => {
  if (value && value.__type === 'RegExp') {
    return SerializableRegExp.fromJSON(value);
  }
  if (value && value.__type === 'Error') {
    const error = new Error(value.message);
    error.stack = value.stack;
    return error;
  }
  return value;
};
```


**4. Circular References - Critical trong React DevTools:**


```javascript
// ❌ Common circular reference scenario
const parent = { name: 'Parent' };
const child = { name: 'Child', parent };
parent.children = [child];

// JSON.stringify(parent) // TypeError: Converting circular structure to JSON

// ✅ Production solution
const createCircularSafeStringify = () => {
  const seen = new WeakSet();

  return (obj) => JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  });
};

// Advanced solution với path tracking
const stringifyWithCircularRefs = (obj) => {
  const seen = new Map();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return `[Circular Reference to ${seen.get(value)}]`;
      }
      seen.set(value, key || 'root');
    }
    return value;
  });
};
```


**5. Special Numbers - NaN, Infinity:**


```javascript
const mathResults = {
  validResult: 42,
  invalidResult: NaN, // ❌ Becomes null
  infiniteResult: Infinity, // ❌ Becomes null
  negativeInfinite: -Infinity // ❌ Becomes null
};

// ✅ Production solution
const safeNumberReplacer = (key, value) => {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { __type: 'NaN' };
    if (value === Infinity) return { __type: 'Infinity' };
    if (value === -Infinity) return { __type: '-Infinity' };
  }
  return value;
};

const safeNumberReviver = (key, value) => {
  if (value && value.__type) {
    switch (value.__type) {
      case 'NaN': return NaN;
      case 'Infinity': return Infinity;
      case '-Infinity': return -Infinity;
    }
  }
  return value;
};
```


#### Production Patterns & Solutions:


**1. Enhanced Serialization Library:**


```javascript
class EnhancedSerializer {
  static serialize(obj, options = {}) {
    const { includeFunctions = false, handleCircular = true } = options;

    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (handleCircular && typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      // Handle special types
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }

      if (value instanceof RegExp) {
        return { __type: 'RegExp', pattern: value.source, flags: value.flags };
      }

      if (value instanceof Error) {
        return {
          __type: 'Error',
          message: value.message,
          stack: value.stack,
          name: value.name
        };
      }

      if (typeof value === 'function' && includeFunctions) {
        return { __type: 'Function', source: value.toString() };
      }

      // Handle special numbers
      if (typeof value === 'number') {
        if (Number.isNaN(value)) return { __type: 'NaN' };
        if (value === Infinity) return { __type: 'Infinity' };
        if (value === -Infinity) return { __type: '-Infinity' };
      }

      return value;
    });
  }

  static deserialize(jsonString) {
    return JSON.parse(jsonString, (key, value) => {
      if (value && value.__type) {
        switch (value.__type) {
          case 'Date':
            return new Date(value.value);
          case 'RegExp':
            return new RegExp(value.pattern, value.flags);
          case 'Error':
            const error = new Error(value.message);
            error.stack = value.stack;
            error.name = value.name;
            return error;
          case 'NaN':
            return NaN;
          case 'Infinity':
            return Infinity;
          case '-Infinity':
            return -Infinity;
          case 'Function':
            // Security consideration - only in development
            return process.env.NODE_ENV === 'development'
              ? new Function(`return ${value.source}`)()
              : null;
        }
      }
      return value;
    });
  }
}
```


**2. React-specific Caching Strategy:**


```javascript
const useSerializableCache = () => {
  const cache = useRef(new Map());

  const getCacheKey = useCallback((data) => {
    try {
      return EnhancedSerializer.serialize(data);
    } catch (error) {
      console.warn('Serialization failed, using object reference', error);
      return data;
    }
  }, []);

  const get = useCallback((key) => {
    const serializedKey = getCacheKey(key);
    return cache.current.get(serializedKey);
  }, [getCacheKey]);

  const set = useCallback((key, value) => {
    const serializedKey = getCacheKey(key);
    cache.current.set(serializedKey, value);
  }, [getCacheKey]);

  return { get, set };
};
```


**Real-world Usage trong React Apps:**


- **Redux DevTools** serialization của complex state
- **React Query** caching mechanisms
- **Local Storage** persistence strategies
- **API response caching** với timestamps và metadata
- **Component props memoization** patterns


**Interviewer**: Fantastic analysis! Tôi đặc biệt appreciate việc bạn think về production implications và security considerations. Now let's explore **iteration patterns**. **What are the differences between for...in and for...of, và trong context của React development, when would you use each?**


### 2.3 Iteration Patterns & React Performance


**Candidate**: Great question! **for...in và for...of** có fundamental differences mà impact significantly đến React performance và data handling patterns.


#### Core Differences:


**1. What They Iterate:**


```javascript
const userData = {
  id: 1,
  name: 'John',
  email: 'john@example.com'
};

const permissions = ['read', 'write', 'admin'];

// for...in iterates over KEYS/INDICES
for (let key in userData) {
  console.log(key); // 'id', 'name', 'email'
  console.log(userData[key]); // 1, 'John', 'john@example.com'
}

for (let index in permissions) {
  console.log(index); // '0', '1', '2' (strings!)
  console.log(permissions[index]); // 'read', 'write', 'admin'
}

// for...of iterates over VALUES
for (let permission of permissions) {
  console.log(permission); // 'read', 'write', 'admin'
}

// ❌ for...of doesn't work directly với objects
// for (let value of userData) // TypeError!
```


**2. Prototype Chain Behavior:**


```javascript
const baseUser = { role: 'user' };
const specificUser = Object.create(baseUser);
specificUser.name = 'John';
specificUser.id = 1;

// ❌ for...in traverses prototype chain
for (let key in specificUser) {
  console.log(key); // 'name', 'id', 'role' (includes inherited!)
}

// ✅ Safe iteration patterns
for (let key in specificUser) {
  if (specificUser.hasOwnProperty(key)) {
    console.log(key); // Only 'name', 'id'
  }
}

// ✅ Modern approach
for (let key of Object.keys(specificUser)) {
  console.log(key); // Only own properties
}

// ✅ Or use Object.entries for key-value pairs
for (let [key, value] of Object.entries(specificUser)) {
  console.log(key, value); // Only own properties
}
```


#### React-Specific Use Cases & Performance Implications:


**1. Component Props Iteration:**


```javascript
// ❌ Problematic với inherited properties
const PropsDebugger = (props) => {
  const debugInfo = {};

  for (let key in props) {
    debugInfo[key] = typeof props[key]; // Might include inherited
  }

  return <pre>{JSON.stringify(debugInfo, null, 2)}</pre>;
};

// ✅ Safe props iteration
const SafePropsDebugger = (props) => {
  const debugInfo = {};

  for (let key of Object.keys(props)) {
    debugInfo[key] = typeof props[key]; // Only own props
  }

  return <pre>{JSON.stringify(debugInfo, null, 2)}</pre>;
};

// ✅ Even better - use Object.entries
const BestPropsDebugger = (props) => {
  return (
    <div>
      {Object.entries(props).map(([key, value]) => (
        <div key={key}>
          {key}: {typeof value}
        </div>
      ))}
    </div>
  );
};
```


**2. Form Field Iteration:**


```javascript
const FormRenderer = ({ fields, values, onChange }) => {
  // ❌ Potentially unsafe
  const renderFields = () => {
    const elements = [];
    for (let fieldName in fields) {
      elements.push(
        <input
          key={fieldName}
          name={fieldName}
          value={values[fieldName] || ''}
          onChange={(e) => onChange(fieldName, e.target.value)}
        />
      );
    }
    return elements;
  };

  // ✅ Safe và performant
  const renderFieldsSafe = () => {
    return Object.entries(fields).map(([fieldName, fieldConfig]) => (
      <input
        key={fieldName}
        name={fieldName}
        type={fieldConfig.type}
        value={values[fieldName] || ''}
        onChange={(e) => onChange(fieldName, e.target.value)}
      />
    ));
  };

  return <form>{renderFieldsSafe()}</form>;
};
```


**3. Array Processing for Rendering:**


```javascript
const DataTable = ({ data, columns }) => {
  // ✅ for...of excellent for processing arrays
  const processedData = useMemo(() => {
    const processed = [];

    for (let row of data) {
      const processedRow = {};

      // ✅ Combine với Object.entries cho nested iteration
      for (let [columnKey, columnConfig] of Object.entries(columns)) {
        processedRow[columnKey] = columnConfig.transformer
          ? columnConfig.transformer(row[columnKey])
          : row[columnKey];
      }

      processed.push(processedRow);
    }

    return processed;
  }, [data, columns]);

  return (
    <table>
      <thead>
        <tr>
          {Object.keys(columns).map(key => (
            <th key={key}>{columns[key].label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {processedData.map((row, index) => (
          <tr key={index}>
            {Object.entries(row).map(([key, value]) => (
              <td key={key}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```


#### Performance Considerations:


**1. Iterator Protocol Performance:**


```javascript
// Performance test scenario
const largeArray = new Array(100000).fill(0).map((_, i) => i);
const largeObject = {};
largeArray.forEach(i => largeObject[`key${i}`] = i);

// ✅ for...of - optimized cho arrays
const processArrayForOf = (arr) => {
  const results = [];
  for (let item of arr) {
    results.push(item * 2);
  }
  return results;
};

// ❌ for...in - slower cho arrays, returns string indices
const processArrayForIn = (arr) => {
  const results = [];
  for (let index in arr) {
    results.push(arr[index] * 2); // index is string!
  }
  return results;
};

// ✅ Object iteration - Object.entries usually best
const processObjectEntries = (obj) => {
  const results = [];
  for (let [key, value] of Object.entries(obj)) {
    results.push({ key, doubled: value * 2 });
  }
  return results;
};

// React optimization với useMemo
const OptimizedProcessor = ({ data, isArray }) => {
  const processed = useMemo(() => {
    if (isArray) {
      return processArrayForOf(data);
    } else {
      return processObjectEntries(data);
    }
  }, [data, isArray]);

  return (
    <div>
      {isArray
        ? processed.map((item, index) => <div key={index}>{item}</div>)
        : processed.map(({ key, doubled }) => <div key={key}>{doubled}</div>)
      }
    </div>
  );
};
```


**2. Custom Iterator Implementation:**


```javascript
// Advanced: Custom iterable cho complex data structures
class ReactDataCollection {
  constructor(data) {
    this.data = data;
  }

  // Make it iterable với for...of
  *[Symbol.iterator]() {
    for (let [key, value] of Object.entries(this.data)) {
      yield { key, value, id: `${key}-${Date.now()}` };
    }
  }

  // Method cho component keys
  getReactKeys() {
    return Object.keys(this.data).map(key => `item-${key}`);
  }
}

const CustomIterableComponent = ({ collection }) => {
  return (
    <div>
      {/* ✅ Can use for...of directly */}
      {Array.from(collection).map(({ key, value, id }) => (
        <div key={id}>
          {key}: {value}
        </div>
      ))}
    </div>
  );
};
```


#### Modern React Patterns:


**1. Hooks với Iteration:**


```javascript
const useObjectIterator = (obj) => {
  const entries = useMemo(() => Object.entries(obj), [obj]);
  const keys = useMemo(() => Object.keys(obj), [obj]);
  const values = useMemo(() => Object.values(obj), [obj]);

  const findByKey = useCallback((searchKey) => {
    for (let [key, value] of entries) {
      if (key === searchKey) return value;
    }
    return null;
  }, [entries]);

  return { entries, keys, values, findByKey };
};

const useArrayProcessor = (arr, processor) => {
  return useMemo(() => {
    const results = [];
    for (let item of arr) {
      results.push(processor(item));
    }
    return results;
  }, [arr, processor]);
};
```


**2. TypeScript Considerations:**


```typescript
// Type-safe iteration patterns
interface FormFields {
  [key: string]: {
    type: 'text' | 'email' | 'password';
    required: boolean;
    validation?: (value: string) => boolean;
  };
}

const TypeSafeFormRenderer = ({ fields }: { fields: FormFields }) => {
  return (
    <div>
      {(Object.entries(fields) as [string, FormFields[string]][]).map(
        ([fieldName, config]) => (
          <input
            key={fieldName}
            type={config.type}
            required={config.required}
          />
        )
      )}
    </div>
  );
};
```


**Best Practices Summary:**


- **Arrays**: Always use `for...of` hoặc array methods (`map`, `forEach`)
- **Objects**: Use `Object.keys()`, `Object.entries()`, `Object.values()` với `for...of`
- **Avoid**: `for...in` với arrays và objects without `hasOwnProperty` check
- **Performance**: `for...of` với arrays, `Object.entries()` với objects
- **React**: Always provide stable keys, prefer `.map()` trong JSX


**Interviewer**: Excellent breakdown! Tôi thấy bạn có deep understanding về performance implications. Let's move to another fundamental topic - **array manipulation methods**. **Can you explain the differences between slice, splice, and split, và show some advanced patterns for React state management?**


### 2.4 Array Manipulation & React State Patterns


**Candidate**: Perfect question! **slice, splice, và split** là fundamental array methods nhưng có very different behaviors và use cases trong React development.


#### Core Differences & Signatures:


**1. Array.prototype.slice() - Non-mutating Extraction:**


```javascript
// slice(start, end) - returns new array, original unchanged
const originalArray = [1, 2, 3, 4, 5, 6];

console.log(originalArray.slice(2)); // [3, 4, 5, 6]
console.log(originalArray.slice(1, 4)); // [2, 3, 4] (end index exclusive)
console.log(originalArray.slice(-3)); // [4, 5, 6] (negative = from end)
console.log(originalArray.slice(-4, -1)); // [3, 4, 5]
console.log(originalArray); // [1, 2, 3, 4, 5, 6] (unchanged!)

// ✅ React state pattern - immutable updates
const TodoList = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Task 1', completed: false },
    { id: 2, text: 'Task 2', completed: true },
    { id: 3, text: 'Task 3', completed: false }
  ]);

  const getPendingTodos = () => {
    return todos.slice().filter(todo => !todo.completed);
  };

  const getLastTwoTodos = () => {
    return todos.slice(-2); // Safe copy + extraction
  };

  return (
    <div>
      <h3>Pending: {getPendingTodos().length}</h3>
      <div>Recent todos: {getLastTwoTodos().map(todo => todo.text).join(', ')}</div>
    </div>
  );
};
```


**2. Array.prototype.splice() - Mutating Modification:**


```javascript
// splice(start, deleteCount, ...itemsToAdd) - mutates original, returns deleted items
const mutableArray = [1, 2, 3, 4, 5];

// Delete 2 items starting at index 1
const deleted = mutableArray.splice(1, 2);
console.log(deleted); // [2, 3] (removed items)
console.log(mutableArray); // [1, 4, 5] (original changed!)

// Insert items without deleting
mutableArray.splice(2, 0, 'a', 'b');
console.log(mutableArray); // [1, 4, 'a', 'b', 5]

// Replace items
mutableArray.splice(0, 2, 'x', 'y');
console.log(mutableArray); // ['x', 'y', 'a', 'b', 5]

// ❌ NEVER use directly trong React state!
const BadTodoComponent = () => {
  const [todos, setTodos] = useState([...initialTodos]);

  const removeTodo = (index) => {
    todos.splice(index, 1); // ❌ Mutating state directly!
    setTodos(todos); // React won't detect change
  };
};

// ✅ Correct React pattern - use splice concept with immutable approach
const GoodTodoComponent = () => {
  const [todos, setTodos] = useState([...initialTodos]);

  const removeTodo = (index) => {
    setTodos(prev => [
      ...prev.slice(0, index),
      ...prev.slice(index + 1)
    ]);
  };

  const insertTodo = (index, newTodo) => {
    setTodos(prev => [
      ...prev.slice(0, index),
      newTodo,
      ...prev.slice(index)
    ]);
  };

  const replaceTodos = (startIndex, deleteCount, ...newTodos) => {
    setTodos(prev => [
      ...prev.slice(0, startIndex),
      ...newTodos,
      ...prev.slice(startIndex + deleteCount)
    ]);
  };
};
```


**3. String.prototype.split() - String to Array Conversion:**


```javascript
// split(separator, limit) - converts string to array
const csvData = "John,25,Engineer,New York";
const userInfo = csvData.split(',');
console.log(userInfo); // ['John', '25', 'Engineer', 'New York']

const paragraph = "Hello world. This is a test. End.";
const sentences = paragraph.split('. ');
console.log(sentences); // ['Hello world', 'This is a test', 'End.']

// With limit
const limitedSplit = csvData.split(',', 2);
console.log(limitedSplit); // ['John', '25']

// Empty separator = character array
const chars = "hello".split('');
console.log(chars); // ['h', 'e', 'l', 'l', 'o']

// ✅ React patterns với split
const CSVProcessor = ({ csvString }) => {
  const processedData = useMemo(() => {
    return csvString
      .split('\n')
      .map(row => row.split(','))
      .filter(row => row.length > 1); // Remove empty rows
  }, [csvString]);

  return (
    <table>
      {processedData.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex}>{cell.trim()}</td>
          ))}
        </tr>
      ))}
    </table>
  );
};
```


#### Advanced React State Management Patterns:


**1. Immutable Array Operations Using slice/splice concepts:**


```javascript
const useImmutableArray = (initialArray = []) => {
  const [array, setArray] = useState(initialArray);

  const operations = useMemo(() => ({
    // Slice-based operations
    getSlice: (start, end) => array.slice(start, end),

    // Splice-like operations (immutable)
    insert: (index, ...items) => {
      setArray(prev => [
        ...prev.slice(0, index),
        ...items,
        ...prev.slice(index)
      ]);
    },

    remove: (index, count = 1) => {
      setArray(prev => [
        ...prev.slice(0, index),
        ...prev.slice(index + count)
      ]);
    },

    replace: (index, count, ...newItems) => {
      setArray(prev => [
        ...prev.slice(0, index),
        ...newItems,
        ...prev.slice(index + count)
      ]);
    },

    move: (fromIndex, toIndex) => {
      setArray(prev => {
        const newArray = [...prev];
        const [movedItem] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, movedItem);
        return newArray;
      });
    },

    swap: (index1, index2) => {
      setArray(prev => {
        const newArray = [...prev];
        [newArray[index1], newArray[index2]] = [newArray[index2], newArray[index1]];
        return newArray;
      });
    }
  }), [array]);

  return [array, operations];
};

// Usage trong complex component
const AdvancedTodoList = () => {
  const [todos, todoOps] = useImmutableArray([
    { id: 1, text: 'Learn React', priority: 'high' },
    { id: 2, text: 'Build app', priority: 'medium' },
    { id: 3, text: 'Deploy', priority: 'low' }
  ]);

  const reorderByPriority = () => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...todos].sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Rebuild array với new order
    todos.forEach((todo, index) => {
      const newIndex = sorted.findIndex(item => item.id === todo.id);
      if (index !== newIndex) {
        todoOps.move(index, newIndex);
      }
    });
  };

  return (
    <div>
      <button onClick={reorderByPriority}>Sort by Priority</button>
      {todos.map((todo, index) => (
        <div key={todo.id} className="todo-item">
          <span>{todo.text} ({todo.priority})</span>
          <button onClick={() => todoOps.remove(index)}>Delete</button>
          <button onClick={() => todoOps.move(index, 0)}>Move to Top</button>
        </div>
      ))}
    </div>
  );
};
```


**2. Performance-Optimized String Processing:**


```javascript
const useStringProcessor = () => {
  const processLargeText = useCallback((text, options = {}) => {
    const {
      chunkSize = 1000,
      delimiter = '\n',
      transform = (chunk) => chunk
    } = options;

    // Split large text into manageable chunks
    return text
      .split(delimiter)
      .reduce((acc, line, index) => {
        const chunkIndex = Math.floor(index / chunkSize);

        if (!acc[chunkIndex]) {
          acc[chunkIndex] = [];
        }

        acc[chunkIndex].push(transform(line));
        return acc;
      }, []);
  }, []);

  const searchInText = useCallback((text, searchTerm) => {
    return text
      .split('\n')
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes(searchTerm));
  }, []);

  return { processLargeText, searchInText };
};

const TextAnalyzer = ({ content }) => {
  const { processLargeText, searchInText } = useStringProcessor();
  const [searchTerm, setSearchTerm] = useState('');

  const processedChunks = useMemo(() =>
    processLargeText(content, {
      chunkSize: 100,
      transform: (line) => ({
        text: line,
        wordCount: line.split(' ').length,
        charCount: line.length
      })
    }), [content, processLargeText]
  );

  const searchResults = useMemo(() =>
    searchTerm ? searchInText(content, searchTerm) : [],
    [content, searchTerm, searchInText]
  );

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search in text..."
      />

      <div>Total chunks: {processedChunks.length}</div>

      {searchResults.length > 0 && (
        <div>
          <h3>Search Results:</h3>
          {searchResults.slice(0, 10).map(({ line, index }) => (
            <div key={index} className="search-result">
              Line {index + 1}: {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```


**3. Advanced Array Manipulation Patterns:**


```javascript
const useAdvancedArrayOps = () => {
  // Batch operations for performance
  const batchArrayOps = useCallback((array, operations) => {
    return operations.reduce((acc, op) => {
      switch (op.type) {
        case 'INSERT':
          return [
            ...acc.slice(0, op.index),
            ...op.items,
            ...acc.slice(op.index)
          ];

        case 'REMOVE':
          return [
            ...acc.slice(0, op.index),
            ...acc.slice(op.index + (op.count || 1))
          ];

        case 'REPLACE':
          return [
            ...acc.slice(0, op.index),
            ...op.newItems,
            ...acc.slice(op.index + op.count)
          ];

        case 'MOVE':
          const newArray = [...acc];
          const [movedItem] = newArray.splice(op.fromIndex, 1);
          newArray.splice(op.toIndex, 0, movedItem);
          return newArray;

        default:
          return acc;
      }
    }, array);
  }, []);

  // Virtual scrolling helper
  const getVisibleSlice = useCallback((array, startIndex, endIndex) => {
    return array.slice(
      Math.max(0, startIndex - 5), // Buffer
      Math.min(array.length, endIndex + 5)
    );
  }, []);

  return { batchArrayOps, getVisibleSlice };
};

// Virtual scrolling implementation
const VirtualizedList = ({ items, itemHeight = 50, containerHeight = 400 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const { getVisibleSlice } = useAdvancedArrayOps();

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const visibleItems = getVisibleSlice(items, startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```


**Key Takeaways:**


- **slice**: Non-mutating, perfect for React state với immutable patterns
- **splice**: Mutating, avoid direct usage trong React state, use concepts immutably
- **split**: String processing, essential cho text parsing và CSV handling
- **Performance**: Always consider memory allocation với large arrays
- **Immutability**: Core principle trong React state management


**Interviewer**: Impressive deep dive! You clearly understand both the basics and advanced patterns. Now let's explore **array-like objects**. **How do you convert array-like objects to arrays, và what are the performance implications of different approaches?**


### 2.5 Array-Like Objects & Conversion Patterns


**Candidate**: Excellent question! Array-like objects conversion là một topic quan trọng trong DOM manipulation và modern JavaScript, especially trong React development.


#### Understanding Array-Like Objects:


**1. What are Array-Like Objects:**


```javascript
// Common array-like objects trong web development
const nodeList = document.querySelectorAll('.items'); // NodeList
const htmlCollection = document.getElementsByTagName('div'); // HTMLCollection
const functionArgs = (function() { return arguments; })(1, 2, 3); // Arguments object

// Manual array-like object
const arrayLike = {
  0: 'first',
  1: 'second',
  2: 'third',
  length: 3
};

console.log(arrayLike[0]); // 'first'
console.log(arrayLike.length); // 3
console.log(arrayLike.map); // undefined - no array methods!

// ✅ React scenario - common với refs
const MultiInputComponent = () => {
  const inputRefs = useRef({});

  const focusAllInputs = () => {
    // inputRefs.current is array-like object
    const inputs = Object.values(inputRefs.current); // Convert to array
    inputs.forEach(input => input && input.focus());
  };

  return (
    <div>
      {['name', 'email', 'phone'].map(field => (
        <input
          key={field}
          ref={el => inputRefs.current[field] = el}
          placeholder={field}
        />
      ))}
      <button onClick={focusAllInputs}>Focus All</button>
    </div>
  );
};
```


#### Conversion Methods & Performance Analysis:


**1. Array.prototype.slice.call() - Classic Approach:**


```javascript
// Method 1: slice.call
const convertWithSlice = (arrayLike) => {
  return Array.prototype.slice.call(arrayLike);
};

// Performance test setup
const largeNodeList = document.querySelectorAll('*'); // All elements
const largeArrayLike = { length: 10000 };
for (let i = 0; i < 10000; i++) {
  largeArrayLike[i] = `item-${i}`;
}

// Benchmark slice.call
console.time('slice.call');
const result1 = Array.prototype.slice.call(largeArrayLike);
console.timeEnd('slice.call'); // ~2-3ms

// React usage pattern
const useNodeListProcessor = () => {
  const processElements = useCallback((selector) => {
    const nodeList = document.querySelectorAll(selector);
    const array = Array.prototype.slice.call(nodeList);

    return array.map(element => ({
      tag: element.tagName,
      classes: element.className,
      text: element.textContent.trim()
    }));
  }, []);

  return { processElements };
};
```


**2. Array.prototype.splice.call() - Alternative Approach:**


```javascript
// Method 2: splice.call (creates new array, doesn't modify original)
const convertWithSplice = (arrayLike) => {
  return Array.prototype.splice.call(arrayLike, 0);
};

// ⚠️ Note: This modifies the original array-like if it supports splice
// Safer version:
const convertWithSpliceSafe = (arrayLike) => {
  const copy = Object.assign({}, arrayLike);
  return Array.prototype.splice.call(copy, 0);
};

// Benchmark
console.time('splice.call');
const result2 = convertWithSpliceSafe(largeArrayLike);
console.timeEnd('splice.call'); // ~2-4ms (slightly slower)

// Generally not recommended for conversion
```


**3. Array.prototype.concat.apply() - Spread Approach:**


```javascript
// Method 3: concat.apply
const convertWithConcat = (arrayLike) => {
  return Array.prototype.concat.apply([], arrayLike);
};

// Benchmark
console.time('concat.apply');
const result3 = Array.prototype.concat.apply([], largeArrayLike);
console.timeEnd('concat.apply'); // ~1-2ms (faster)

// React pattern với event delegation
const useEventDelegation = () => {
  const handleContainerClick = useCallback((event) => {
    const clickedElements = document.elementsFromPoint(
      event.clientX,
      event.clientY
    );

    // Convert NodeList to array for processing
    const elementsArray = Array.prototype.concat.apply([], clickedElements);

    const clickableElement = elementsArray.find(el =>
      el.dataset.clickable === 'true'
    );

    if (clickableElement) {
      // Handle click
    }
  }, []);

  return { handleContainerClick };
};
```


**4. Array.from() - Modern Standard:**


```javascript
// Method 4: Array.from (ES6+) - Most versatile
const convertWithArrayFrom = (arrayLike) => {
  return Array.from(arrayLike);
};

// Advanced Array.from với mapping
const convertWithMapping = (arrayLike, mapFn) => {
  return Array.from(arrayLike, mapFn);
};

// Benchmark
console.time('Array.from');
const result4 = Array.from(largeArrayLike);
console.timeEnd('Array.from'); // ~1-2ms

console.time('Array.from with mapping');
const result5 = Array.from(largeArrayLike, (item, index) => `${item}-${index}`);
console.timeEnd('Array.from with mapping'); // ~3-4ms

// ✅ Modern React patterns
const useModernArrayConversion = () => {
  const processFormElements = useCallback((formRef) => {
    if (!formRef.current) return [];

    // Convert HTMLFormControlsCollection to array
    const formElements = Array.from(formRef.current.elements);

    return formElements
      .filter(element => element.name) // Only named elements
      .map(element => ({
        name: element.name,
        value: element.value,
        type: element.type,
        valid: element.checkValidity()
      }));
  }, []);

  const processFileList = useCallback((fileList) => {
    // FileList is array-like, convert to array for processing
    return Array.from(fileList).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    }));
  }, []);

  return { processFormElements, processFileList };
};

// File upload component với array conversion
const FileUploader = () => {
  const [files, setFiles] = useState([]);
  const { processFileList } = useModernArrayConversion();

  const handleFileChange = (event) => {
    const fileList = event.target.files; // FileList object
    const fileArray = processFileList(fileList);
    setFiles(fileArray);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
      />
      <div>
        {files.map((file, index) => (
          <div key={index}>
            {file.name} - {(file.size / 1024).toFixed(2)} KB
          </div>
        ))}
      </div>
    </div>
  );
};
```


#### Performance Comparison & Best Practices:


**1. Comprehensive Performance Test:**


```javascript
const performanceTest = () => {
  const sizes = [100, 1000, 10000, 100000];
  const methods = {
    'slice.call': (arrayLike) => Array.prototype.slice.call(arrayLike),
    'splice.call': (arrayLike) => Array.prototype.splice.call([...arrayLike], 0),
    'concat.apply': (arrayLike) => Array.prototype.concat.apply([], arrayLike),
    'Array.from': (arrayLike) => Array.from(arrayLike),
    'spread': (arrayLike) => [...arrayLike], // ES6 spread
  };

  sizes.forEach(size => {
    console.log(`\nTesting với ${size} elements:`);

    // Create test array-like object
    const arrayLike = { length: size };
    for (let i = 0; i < size; i++) {
      arrayLike[i] = i;
    }

    Object.entries(methods).forEach(([name, method]) => {
      const start = performance.now();

      try {
        const result = method(arrayLike);
        const end = performance.now();
        console.log(`${name}: ${(end - start).toFixed(3)}ms`);
      } catch (error) {
        console.log(`${name}: ERROR - ${error.message}`);
      }
    });
  });
};

// Results typically show:
// - Array.from: Consistent performance, most readable
// - Spread operator: Fastest for small arrays, memory intensive for large
// - slice.call: Good overall performance, widely supported
// - concat.apply: Good performance but can hit call stack limits
```


**2. Spread Operator (...) - ES6 Approach:**


```javascript
// Method 5: Spread operator (ES6+)
const convertWithSpread = (arrayLike) => {
  return [...arrayLike];
};

// ⚠️ Performance considerations
console.time('spread operator');
// const result6 = [...largeArrayLike]; // May be very fast or cause stack overflow
console.timeEnd('spread operator');

// ✅ Safe React usage với spread
const useSpreadConversion = () => {
  const safeSpreadConvert = useCallback((arrayLike, maxSize = 10000) => {
    if (arrayLike.length > maxSize) {
      console.warn(`Array-like object too large (${arrayLike.length}), using Array.from`);
      return Array.from(arrayLike);
    }
    return [...arrayLike];
  }, []);

  return { safeSpreadConvert };
};

// Modern component với spread
const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const { safeSpreadConvert } = useSpreadConversion();

  const importFromAddressBook = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };

        const contactsIterator = await navigator.contacts.select(props, opts);
        // contactsIterator is array-like
        const contactsArray = safeSpreadConvert(contactsIterator);

        setContacts(contactsArray);
      } catch (error) {
        console.error('Contact import failed:', error);
      }
    }
  };

  return (
    <div>
      <button onClick={importFromAddressBook}>
        Import Contacts
      </button>
      {contacts.map((contact, index) => (
        <div key={index}>
          {contact.name} - {contact.email}
        </div>
      ))}
    </div>
  );
};
```


#### Advanced Patterns & Edge Cases:


**1. Handling Different Array-Like Types:**


```javascript
const useUniversalArrayConverter = () => {
  const convertToArray = useCallback((input) => {
    // Type checking và appropriate conversion
    if (Array.isArray(input)) {
      return input; // Already an array
    }

    if (input == null) {
      return []; // Handle null/undefined
    }

    // Check if it's array-like (has length property và numeric indices)
    if (typeof input === 'object' &&
        typeof input.length === 'number' &&
        input.length >= 0) {

      // Special handling cho different types
      if (input instanceof NodeList || input instanceof HTMLCollection) {
        return Array.from(input); // Optimal for DOM collections
      }

      if (input.constructor === Object || input.constructor.name === 'Arguments') {
        return Array.prototype.slice.call(input); // Classic approach
      }

      // Generic array-like
      return Array.from(input);
    }

    // Single value -> array
    return [input];
  }, []);

  return { convertToArray };
};

// Robust React hook cho DOM manipulation
const useDOMArrays = () => {
  const { convertToArray } = useUniversalArrayConverter();

  const getAllElements = useCallback((selector) => {
    const elements = document.querySelectorAll(selector);
    return convertToArray(elements);
  }, [convertToArray]);

  const getFormData = useCallback((formElement) => {
    if (!formElement) return {};

    const formData = new FormData(formElement);
    const entries = convertToArray(formData.entries());

    return entries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }, [convertToArray]);

  return { getAllElements, getFormData };
};
```


**2. Memory Optimization Patterns:**


```javascript
const useMemoryEfficientConversion = () => {
  // Lazy conversion - only convert when needed
  const createLazyArray = useCallback((arrayLike) => {
    return {
      [Symbol.iterator]: function* () {
        for (let i = 0; i < arrayLike.length; i++) {
          yield arrayLike[i];
        }
      },

      toArray: () => Array.from(arrayLike),

      map: (fn) => {
        const result = [];
        for (let i = 0; i < arrayLike.length; i++) {
          result.push(fn(arrayLike[i], i));
        }
        return result;
      },

      filter: (predicate) => {
        const result = [];
        for (let i = 0; i < arrayLike.length; i++) {
          if (predicate(arrayLike[i], i)) {
            result.push(arrayLike[i]);
          }
        }
        return result;
      }
    };
  }, []);

  return { createLazyArray };
};
```


**Performance Summary:**


- **Array.from()**: Best overall choice, readable, consistent performance
- **Spread operator**: Fastest cho small arrays (<1000 items)
- **slice.call()**: Good compatibility, solid performance
- **concat.apply()**: Avoid cho large arrays (call stack limits)
- **splice.call()**: Generally avoid, can mutate original


**Best Practices:**


- Use **Array.from()** as default choice
- Use **spread operator** cho small, known-size collections
- Always consider memory implications với large datasets
- Type-check before conversion để avoid errors
- Consider lazy evaluation cho large datasets


**Interviewer**: Outstanding analysis! Your understanding of performance implications và memory considerations is excellent. Now let's tackle **array deduplication**. **Tell me how to remove duplicates from an array và discuss the trade-offs of different approaches, especially trong context của React state management.**


### 2.6 Array Deduplication Strategies & React Applications


**Candidate**: Great question! Array deduplication là một common task trong React development, đặc biệt khi dealing với API responses, user selections, và state management. Let me break down different approaches với their trade-offs.


#### Method 1: Set-based Deduplication (ES6+):


```javascript
// Basic Set approach - fastest cho primitive values
const dedupeWithSet = (array) => {
  return Array.from(new Set(array));
  // or: return [...new Set(array)];
};

const primitiveArray = [1, 2, 2, 3, 'a', 'a', 'b', true, true, false];
console.log(dedupeWithSet(primitiveArray));
// [1, 2, 3, 'a', 'b', true, false]

// ✅ React usage - simple primitive deduplication
const TagInput = () => {
  const [tags, setTags] = useState(['react', 'javascript', 'react', 'node']);

  const removeDuplicateTags = () => {
    setTags(prev => [...new Set(prev)]);
  };

  const addTag = (newTag) => {
    setTags(prev => [...new Set([...prev, newTag])]);
  };

  return (
    <div>
      <div>Tags: {tags.join(', ')}</div>
      <button onClick={removeDuplicateTags}>Remove Duplicates</button>
    </div>
  );
};

// ⚠️ Limitation: Doesn't work với objects (reference equality)
const objectArray = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
  { id: 1, name: 'John' } // Same values, different objects
];

console.log([...new Set(objectArray)].length); // 3 (no deduplication!)
```


**Performance Analysis:**


```javascript
// Benchmark Set approach
const benchmarkSet = (size) => {
  const testArray = Array(size).fill(0).map(() => Math.floor(Math.random() * size / 2));

  console.time(`Set deduplication (${size} items)`);
  const result = [...new Set(testArray)];
  console.timeEnd(`Set deduplication (${size} items)`);

  return result;
};

// Results: O(n) time complexity, very efficient
// 1K items: ~0.1ms
// 10K items: ~1ms
// 100K items: ~8ms
```


#### Method 2: Map-based Deduplication (Complex Objects):


```javascript
// Advanced Map approach cho objects
const dedupeWithMap = (array, keyExtractor = JSON.stringify) => {
  const seen = new Map();
  const result = [];

  for (const item of array) {
    const key = keyExtractor(item);
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(item);
    }
  }

  return result;
};

// ✅ React pattern - advanced object deduplication
const useAdvancedDeduplication = () => {
  const dedupeByProperty = useCallback((array, property) => {
    const seen = new Map();
    return array.filter(item => {
      const key = item[property];
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, true);
      return true;
    });
  }, []);

  const dedupeByMultipleProps = useCallback((array, properties) => {
    const seen = new Map();
    return array.filter(item => {
      const key = properties.map(prop => item[prop]).join('|');
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, true);
      return true;
    });
  }, []);

  const dedupeByCustomKey = useCallback((array, keyFn) => {
    const seen = new Map();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, true);
      return true;
    });
  }, []);

  return { dedupeByProperty, dedupeByMultipleProps, dedupeByCustomKey };
};

// Real-world example - User management
const UserList = () => {
  const [users, setUsers] = useState([
    { id: 1, email: 'john@example.com', name: 'John Doe', dept: 'Engineering' },
    { id: 2, email: 'jane@example.com', name: 'Jane Smith', dept: 'Design' },
    { id: 3, email: 'john@example.com', name: 'John Doe', dept: 'Engineering' }, // Duplicate
    { id: 4, email: 'bob@example.com', name: 'Bob Wilson', dept: 'Engineering' },
    { id: 5, email: 'jane@example.com', name: 'Jane Smith', dept: 'Marketing' } // Same email, different dept
  ]);

  const { dedupeByProperty, dedupeByMultipleProps, dedupeByCustomKey } = useAdvancedDeduplication();

  const dedupeByEmail = () => {
    setUsers(prev => dedupeByProperty(prev, 'email'));
  };

  const dedupeByEmailAndDept = () => {
    setUsers(prev => dedupeByMultipleProps(prev, ['email', 'dept']));
  };

  const dedupeByNameIgnoreCase = () => {
    setUsers(prev => dedupeByCustomKey(prev, user => user.name.toLowerCase()));
  };

  return (
    <div>
      <button onClick={dedupeByEmail}>Dedupe by Email</button>
      <button onClick={dedupeByEmailAndDept}>Dedupe by Email + Dept</button>
      <button onClick={dedupeByNameIgnoreCase}>Dedupe by Name (Case Insensitive)</button>

      <div>
        {users.map(user => (
          <div key={`${user.id}-${user.email}-${user.dept}`}>
            {user.name} ({user.email}) - {user.dept}
          </div>
        ))}
      </div>
    </div>
  );
};
```


#### Method 3: indexOf/includes-based Approaches:


```javascript
// Method 3a: indexOf approach
const dedupeWithIndexOf = (array) => {
  return array.filter((item, index) => array.indexOf(item) === index);
};

// Method 3b: includes approach
const dedupeWithIncludes = (array) => {
  const result = [];
  for (const item of array) {
    if (!result.includes(item)) {
      result.push(item);
    }
  }
  return result;
};

// Performance comparison
const performanceComparison = () => {
  const sizes = [100, 1000, 10000];
  const methods = {
    'Set': (arr) => [...new Set(arr)],
    'indexOf': dedupeWithIndexOf,
    'includes': dedupeWithIncludes,
    'Map': (arr) => dedupeWithMap(arr, x => x)
  };

  sizes.forEach(size => {
    const testArray = Array(size).fill(0).map(() => Math.floor(Math.random() * size / 2));

    console.log(`\nTesting với ${size} items:`);
    Object.entries(methods).forEach(([name, method]) => {
      console.time(name);
      const result = method(testArray);
      console.timeEnd(name);
      console.log(`${name}: ${result.length} unique items`);
    });
  });
};

/*
Typical results:
100 items:   Set < Map < indexOf < includes
1K items:    Set < Map << indexOf << includes
10K items:   Set < Map <<< indexOf <<<< includes

Time Complexity:
- Set: O(n)
- Map: O(n)
- indexOf: O(n²)
- includes: O(n²)
*/
```


#### Method 4: Object-based Deduplication (Legacy Pattern):


```javascript
// Legacy approach using object properties
const dedupeWithObject = (array) => {
  const seen = {};
  return array.filter(item => {
    const key = typeof item === 'object' ? JSON.stringify(item) : item;
    if (seen[key]) {
      return false;
    }
    seen[key] = true;
    return true;
  });
};

// ⚠️ Issues với object approach:
const problematicCases = [
  { a: 1, b: 2 },
  { b: 2, a: 1 }, // Different order, same content
  'undefined',
  undefined, // Conflict: both become 'undefined' string
  '[object Object]',
  {} // toString() collision
];

console.log(dedupeWithObject(problematicCases)); // Unexpected results!

// ✅ Safer object approach
const safeObjectDedupe = (array, keyFn = item => item) => {
  const seen = Object.create(null); // No prototype
  return array.filter(item => {
    const key = keyFn(item);
    if (key in seen) {
      return false;
    }
    seen[key] = true;
    return true;
  });
};
```


#### Advanced React Patterns:


**1. Conditional Deduplication Hook:**


```javascript
const useConditionalDeduplication = (array, options = {}) => {
  const {
    enabled = true,
    method = 'set', // 'set', 'map', 'property'
    property = null,
    keyExtractor = null,
    compareFunction = null
  } = options;

  return useMemo(() => {
    if (!enabled) return array;

    switch (method) {
      case 'set':
        return [...new Set(array)];

      case 'property':
        if (!property) return array;
        const seenByProp = new Set();
        return array.filter(item => {
          const value = item[property];
          if (seenByProp.has(value)) return false;
          seenByProp.add(value);
          return true;
        });

      case 'map':
        const keyFn = keyExtractor || JSON.stringify;
        const seenByKey = new Map();
        return array.filter(item => {
          const key = keyFn(item);
          if (seenByKey.has(key)) return false;
          seenByKey.set(key, true);
          return true;
        });

      case 'custom':
        if (!compareFunction) return array;
        return array.filter((item, index, arr) => {
          return !arr.slice(0, index).some(prevItem =>
            compareFunction(item, prevItem)
          );
        });

      default:
        return array;
    }
  }, [array, enabled, method, property, keyExtractor, compareFunction]);
};

// Advanced shopping cart example
const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
    { id: 2, name: 'Mouse', price: 25, category: 'Electronics' },
    { id: 1, name: 'Laptop', price: 999, category: 'Electronics' }, // Duplicate
    { id: 3, name: 'Keyboard', price: 75, category: 'Electronics' },
    { id: 2, name: 'Mouse', price: 30, category: 'Electronics' } // Same ID, different price
  ]);

  const [dedupeSettings, setDedupeSettings] = useState({
    enabled: true,
    method: 'property',
    property: 'id'
  });

  const deduplicatedItems = useConditionalDeduplication(cartItems, dedupeSettings);

  const totalPrice = deduplicatedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={dedupeSettings.enabled}
            onChange={(e) => setDedupeSettings(prev => ({
              ...prev,
              enabled: e.target.checked
            }))}
          />
          Enable Deduplication
        </label>
      </div>

      <div>
        <select
          value={dedupeSettings.method}
          onChange={(e) => setDedupeSettings(prev => ({
            ...prev,
            method: e.target.value
          }))}
        >
          <option value="property">By Property</option>
          <option value="map">By Custom Key</option>
          <option value="set">Simple Set</option>
        </select>
      </div>

      <div>
        Original items: {cartItems.length} |
        Deduplicated: {deduplicatedItems.length} |
        Total: ${totalPrice}
      </div>

      {deduplicatedItems.map((item, index) => (
        <div key={`${item.id}-${index}`}>
          {item.name} - ${item.price}
        </div>
      ))}
    </div>
  );
};
```


**2. Performance-Optimized Deduplication:**


```javascript
const useLargeArrayDeduplication = () => {
  // Chunked processing cho large arrays
  const dedupeInChunks = useCallback(async (array, chunkSize = 1000) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    const deduplicatedChunks = [];
    const globalSeen = new Set();

    for (const chunk of chunks) {
      // Process chunk
      const deduplicatedChunk = chunk.filter(item => {
        if (globalSeen.has(item)) return false;
        globalSeen.add(item);
        return true;
      });

      deduplicatedChunks.push(deduplicatedChunk);

      // Yield control để prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return deduplicatedChunks.flat();
  }, []);

  // Web Worker approach cho very large datasets
  const dedupeWithWorker = useCallback((array) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./deduplication-worker.js', import.meta.url));

      worker.postMessage(array);

      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
    });
  }, []);

  return { dedupeInChunks, dedupeWithWorker };
};

// Worker file: deduplication-worker.js
/*
self.onmessage = function(e) {
  const array = e.data;
  const deduplicated = [...new Set(array)];
  self.postMessage(deduplicated);
};
*/
```


#### Real-World Application Patterns:


**1. API Response Deduplication:**


```javascript
const useApiDeduplication = () => {
  const mergeAndDedupe = useCallback((existingData, newData, keyProperty = 'id') => {
    const combined = [...existingData, ...newData];
    const seen = new Map();

    return combined.filter(item => {
      const key = item[keyProperty];
      if (seen.has(key)) {
        // Keep the newer item (assuming newData is more recent)
        const existing = seen.get(key);
        if (newData.includes(item)) {
          seen.set(key, item);
          return true;
        }
        return false;
      }
      seen.set(key, item);
      return true;
    });
  }, []);

  return { mergeAndDedupe };
};

// Real-time data component
const RealTimeDataComponent = () => {
  const [data, setData] = useState([]);
  const { mergeAndDedupe } = useApiDeduplication();

  const handleNewData = useCallback((newItems) => {
    setData(prev => mergeAndDedupe(prev, newItems, 'id'));
  }, [mergeAndDedupe]);

  useEffect(() => {
    const eventSource = new EventSource('/api/realtime');

    eventSource.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      handleNewData(newData);
    };

    return () => eventSource.close();
  }, [handleNewData]);

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```


**Performance Summary:**


- **Set**: O(n) - Best cho primitives
- **Map với custom keys**: O(n) - Best cho objects
- **indexOf/includes**: O(n²) - Avoid cho large arrays
- **Object-based**: O(n) but có edge cases


**Best Practices:**


- Use **Set** cho simple primitive deduplication
- Use **Map với custom key functions** cho complex objects
- Consider **chunked processing** cho very large datasets
- Always benchmark với real data sizes
- Handle edge cases như null, undefined, object property order


**Interviewer**: Excellent comprehensive analysis! You've shown great understanding of performance implications và real-world applications. Now let's discuss a practical problem - **finding the most frequent element trong array**. **Can you walk me through different approaches và their complexity trade-offs?**


---


## PHẦN 3: CODING CHALLENGE (30 phút)


### 3.1 Finding Most Frequent Elements - Live Coding Session


**Interviewer**: Perfect! Now let's do some live coding. Tôi muốn bạn implement một function để **find the most frequent element(s) trong một array**. Requirements:


1. Return the element(s) với highest frequency
2. Handle multiple elements với same max frequency
3. Optimize cho performance
4. Make it reusable trong React context


Bạn có thể start với basic approach rồi optimize?


**Candidate**: Absolutely! Let me start với a basic approach rồi improve it step by step.


```javascript
// Approach 1: Basic frequency counting với Map
const findMostFrequent_v1 = (array) => {
  if (!array || array.length === 0) return [];

  // Step 1: Count frequencies
  const frequencyMap = new Map();

  for (const item of array) {
    frequencyMap.set(item, (frequencyMap.get(item) || 0) + 1);
  }

  // Step 2: Find maximum frequency
  let maxFrequency = 0;
  for (const frequency of frequencyMap.values()) {
    if (frequency > maxFrequency) {
      maxFrequency = frequency;
    }
  }

  // Step 3: Collect all items với max frequency
  const result = [];
  for (const [item, frequency] of frequencyMap.entries()) {
    if (frequency === maxFrequency) {
      result.push(item);
    }
  }

  return result;
};

// Test cases
console.log(findMostFrequent_v1([1, 2, 3, 2, 1, 1])); // [1]
console.log(findMostFrequent_v1([1, 2, 2, 3, 3])); // [2, 3]
console.log(findMostFrequent_v1([])); // []
console.log(findMostFrequent_v1([1])); // [1]
```


**Interviewer**: Good start! Giờ có thể optimize performance không? Và handle edge cases better?


**Candidate**: Sure! Let me optimize này:


```javascript
// Approach 2: Single-pass optimization
const findMostFrequent_v2 = (array) => {
  if (!array || array.length === 0) return [];
  if (array.length === 1) return [array[0]];

  const frequencyMap = new Map();
  let maxFrequency = 0;
  let mostFrequentItems = [];

  for (const item of array) {
    const newFrequency = (frequencyMap.get(item) || 0) + 1;
    frequencyMap.set(item, newFrequency);

    if (newFrequency > maxFrequency) {
      // New maximum found
      maxFrequency = newFrequency;
      mostFrequentItems = [item];
    } else if (newFrequency === maxFrequency) {
      // Tie với current maximum
      if (!mostFrequentItems.includes(item)) {
        mostFrequentItems.push(item);
      }
    }
  }

  return mostFrequentItems;
};

// Further optimization: avoid includes() call
const findMostFrequent_v3 = (array) => {
  if (!array || array.length === 0) return [];
  if (array.length === 1) return [array[0]];

  const frequencyMap = new Map();
  const maxFreqItems = new Set();
  let maxFrequency = 0;

  for (const item of array) {
    const newFrequency = (frequencyMap.get(item) || 0) + 1;
    frequencyMap.set(item, newFrequency);

    if (newFrequency > maxFrequency) {
      maxFrequency = newFrequency;
      maxFreqItems.clear();
      maxFreqItems.add(item);
    } else if (newFrequency === maxFrequency) {
      maxFreqItems.add(item);
    }
  }

  return Array.from(maxFreqItems);
};
```


**Interviewer**: Excellent optimization! Giờ làm thế nào để adapt này cho React usage? Và handle complex objects?


**Candidate**: Great question! Let me create a comprehensive React hook:


```javascript
// Advanced React hook với flexible options
const useMostFrequent = (array, options = {}) => {
  const {
    keyExtractor = item => item, // How to extract key từ complex objects
    returnCount = false, // Whether to return frequency counts
    topN = null, // Return top N most frequent items instead of just max
    minFrequency = 1 // Minimum frequency threshold
  } = options;

  return useMemo(() => {
    if (!array || array.length === 0) {
      return returnCount ? [] : [];
    }

    const frequencyMap = new Map();

    // Count frequencies
    for (const item of array) {
      const key = keyExtractor(item);
      const count = frequencyMap.get(key) || { items: [], count: 0 };

      if (!count.items.some(existing =>
        keyExtractor(existing) === keyExtractor(item))) {
        count.items.push(item);
      }
      count.count += 1;

      frequencyMap.set(key, count);
    }

    // Convert to array và sort by frequency
    const sortedEntries = Array.from(frequencyMap.entries())
      .filter(([key, data]) => data.count >= minFrequency)
      .sort((a, b) => b[1].count - a[1].count);

    if (sortedEntries.length === 0) {
      return returnCount ? [] : [];
    }

    let result;

    if (topN !== null) {
      // Return top N items
      result = sortedEntries.slice(0, topN);
    } else {
      // Return items với maximum frequency
      const maxFreq = sortedEntries[0][1].count;
      result = sortedEntries.filter(([key, data]) => data.count === maxFreq);
    }

    if (returnCount) {
      return result.map(([key, data]) => ({
        key,
        items: data.items,
        count: data.count
      }));
    } else {
      return result.flatMap(([key, data]) => data.items);
    }
  }, [array, keyExtractor, returnCount, topN, minFrequency]);
};

// Example usage trong React component
const DataAnalytics = ({ data }) => {
  // Basic usage - most frequent primitive values
  const mostFrequentValues = useMostFrequent(data);

  // Advanced usage - most frequent by object property
  const mostFrequentByCategory = useMostFrequent(data, {
    keyExtractor: item => item.category,
    returnCount: true,
    topN: 3
  });

  // Most frequent users với minimum threshold
  const activeUsers = useMostFrequent(data, {
    keyExtractor: item => item.userId,
    minFrequency: 5,
    returnCount: true
  });

  return (
    <div>
      <section>
        <h3>Most Frequent Values</h3>
        {mostFrequentValues.map((value, index) => (
          <div key={index}>{JSON.stringify(value)}</div>
        ))}
      </section>

      <section>
        <h3>Top Categories</h3>
        {mostFrequentByCategory.map(({ key, count, items }) => (
          <div key={key}>
            {key}: {count} occurrences ({items.length} unique items)
          </div>
        ))}
      </section>

      <section>
        <h3>Active Users</h3>
        {activeUsers.map(({ key, count }) => (
          <div key={key}>
            User {key}: {count} activities
          </div>
        ))}
      </section>
    </div>
  );
};
```


**Interviewer**: Impressive! Now let's test the performance. **Can you implement a version that handles very large datasets efficiently?**


**Candidate**: Absolutely! For large datasets, we need to consider memory usage và potentially streaming approaches:


```javascript
// High-performance version cho large datasets
const useLargeDataFrequencyAnalysis = () => {
  // Approach 1: Chunked processing với Web Workers
  const findMostFrequentChunked = useCallback(async (array, chunkSize = 10000) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    // Process chunks trong parallel
    const chunkResults = await Promise.all(
      chunks.map(chunk => processChunkInWorker(chunk))
    );

    // Merge results
    return mergeFrequencyResults(chunkResults);
  }, []);

  // Approach 2: Streaming approach cho real-time data
  const createFrequencyStream = useCallback(() => {
    const frequencyMap = new Map();
    let maxFrequency = 0;
    let mostFrequentItems = new Set();

    return {
      addItem: (item) => {
        const newFreq = (frequencyMap.get(item) || 0) + 1;
        frequencyMap.set(item, newFreq);

        if (newFreq > maxFrequency) {
          maxFrequency = newFreq;
          mostFrequentItems.clear();
          mostFrequentItems.add(item);
        } else if (newFreq === maxFrequency) {
          mostFrequentItems.add(item);
        }
      },

      getMostFrequent: () => Array.from(mostFrequentItems),

      getTopN: (n) => {
        return Array.from(frequencyMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, n)
          .map(([item, freq]) => ({ item, frequency: freq }));
      },

      getStats: () => ({
        totalItems: Array.from(frequencyMap.values()).reduce((a, b) => a + b, 0),
        uniqueItems: frequencyMap.size,
        maxFrequency,
        mostFrequentCount: mostFrequentItems.size
      })
    };
  }, []);

  return { findMostFrequentChunked, createFrequencyStream };
};

// Web Worker helper (would be separate file)
const processChunkInWorker = (chunk) => {
  return new Promise((resolve) => {
    // Simulate worker processing
    const frequencyMap = new Map();

    for (const item of chunk) {
      frequencyMap.set(item, (frequencyMap.get(item) || 0) + 1);
    }

    resolve(frequencyMap);
  });
};

// Merge frequency results từ multiple chunks
const mergeFrequencyResults = (chunkResults) => {
  const globalFrequency = new Map();

  for (const chunkMap of chunkResults) {
    for (const [item, frequency] of chunkMap.entries()) {
      globalFrequency.set(item, (globalFrequency.get(item) || 0) + frequency);
    }
  }

  // Find maximum frequency và all items với that frequency
  let maxFreq = 0;
  for (const freq of globalFrequency.values()) {
    if (freq > maxFreq) maxFreq = freq;
  }

  return Array.from(globalFrequency.entries())
    .filter(([item, freq]) => freq === maxFreq)
    .map(([item, freq]) => item);
};

// Real-time analytics component
const RealTimeAnalytics = () => {
  const { createFrequencyStream } = useLargeDataFrequencyAnalysis();
  const [stream] = useState(() => createFrequencyStream());
  const [stats, setStats] = useState(null);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data
      const randomItem = Math.floor(Math.random() * 100);
      stream.addItem(randomItem);

      setStats(stream.getStats());
      setTopItems(stream.getTopN(5));
    }, 100);

    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div>
      {stats && (
        <div>
          <h3>Live Statistics</h3>
          <p>Total items processed: {stats.totalItems}</p>
          <p>Unique items: {stats.uniqueItems}</p>
          <p>Max frequency: {stats.maxFrequency}</p>
          <p>Items với max frequency: {stats.mostFrequentCount}</p>
        </div>
      )}

      <div>
        <h3>Top 5 Most Frequent</h3>
        {topItems.map(({ item, frequency }, index) => (
          <div key={item}>
            #{index + 1}: {item} (appears {frequency} times)
          </div>
        ))}
      </div>
    </div>
  );
};
```


**Interviewer**: Outstanding implementation! Let me test your understanding với a tricky edge case. **What if the array contains NaN values, null, undefined, và complex objects với circular references?**


**Candidate**: Great edge case question! Let me handle all those scenarios:


```javascript
// Robust version handling all edge cases
const useRobustFrequencyAnalysis = () => {
  const normalizeValue = useCallback((value) => {
    // Handle special cases
    if (value === null) return '__NULL__';
    if (value === undefined) return '__UNDEFINED__';
    if (Number.isNaN(value)) return '__NAN__';
    if (value === Infinity) return '__INFINITY__';
    if (value === -Infinity) return '__NEG_INFINITY__';

    // Handle objects với potential circular references
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, (key, val) => {
          if (typeof val === 'object' && val !== null) {
            // Simple circular reference detection
            if (val === value) return '[Circular Reference]';
          }
          return val;
        });
      } catch (error) {
        // Fallback for complex circular references
        return `[Object ${value.constructor?.name || 'Unknown'}]`;
      }
    }

    return value;
  }, []);

  const findMostFrequentRobust = useCallback((array, options = {}) => {
    const {
      handleNaN = true,
      handleNull = true,
      handleUndefined = true,
      handleCircular = true,
      customNormalizer = null
    } = options;

    if (!array || array.length === 0) return [];

    const frequencyMap = new Map();
    const originalValueMap = new Map(); // Keep track of original values

    for (const item of array) {
      let key;

      if (customNormalizer) {
        key = customNormalizer(item);
      } else {
        // Apply filters
        if (!handleNaN && Number.isNaN(item)) continue;
        if (!handleNull && item === null) continue;
        if (!handleUndefined && item === undefined) continue;

        key = normalizeValue(item);
      }

      // Store original value for the first occurrence
      if (!originalValueMap.has(key)) {
        originalValueMap.set(key, item);
      }

      frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
    }

    // Find maximum frequency
    let maxFreq = 0;
    for (const freq of frequencyMap.values()) {
      if (freq > maxFreq) maxFreq = freq;
    }

    // Return original values với max frequency
    const result = [];
    for (const [key, freq] of frequencyMap.entries()) {
      if (freq === maxFreq) {
        result.push(originalValueMap.get(key));
      }
    }

    return result;
  }, [normalizeValue]);

  return { findMostFrequentRobust, normalizeValue };
};

// Comprehensive test cases
const EdgeCaseTests = () => {
  const { findMostFrequentRobust } = useRobustFrequencyAnalysis();

  // Create test array với all edge cases
  const edgeTestArray = [
    1, 1, 1, // Normal numbers
    'hello', 'hello', // Strings
    null, null, null, null, // Nulls (most frequent)
    undefined, undefined, // Undefined
    NaN, NaN, // NaN values
    Infinity, Infinity, // Infinity
    -Infinity,
    { a: 1 }, { a: 1 }, // Objects với same content
    { b: 2 }, { b: 2 },
    [], [], // Empty arrays
    true, false, true // Booleans
  ];

  // Create circular reference object
  const circularObj1 = { name: 'obj1' };
  const circularObj2 = { name: 'obj2', ref: circularObj1 };
  circularObj1.ref = circularObj2;

  const circularTestArray = [
    circularObj1, circularObj1,
    circularObj2,
    { simple: 'object' },
    { simple: 'object' }
  ];

  const basicResults = findMostFrequentRobust(edgeTestArray);
  const circularResults = findMostFrequentRobust(circularTestArray);

  return (
    <div>
      <section>
        <h3>Edge Case Results</h3>
        <p>Most frequent in edge test: {JSON.stringify(basicResults)}</p>
        <p>Expected: null (appears 4 times)</p>
      </section>

      <section>
        <h3>Circular Reference Results</h3>
        <p>Most frequent: {circularResults.length} items</p>
        <p>Can handle circular references: ✅</p>
      </section>

      <section>
        <h3>Filtered Results</h3>
        <p>Without null: {JSON.stringify(
          findMostFrequentRobust(edgeTestArray, { handleNull: false })
        )}</p>
        <p>Without NaN: {JSON.stringify(
          findMostFrequentRobust(edgeTestArray, { handleNaN: false })
        )}</p>
      </section>
    </div>
  );
};
```


**Time & Space Complexity Analysis:**


```javascript
const complexityAnalysis = {
  'Basic Map Approach': {
    time: 'O(n)',
    space: 'O(k)', // k = unique elements
    pros: ['Simple', 'Efficient'],
    cons: ['Single pass only']
  },

  'Optimized Single Pass': {
    time: 'O(n)',
    space: 'O(k)',
    pros: ['No second iteration', 'Early termination possible'],
    cons: ['Slightly more complex']
  },

  'Chunked Processing': {
    time: 'O(n)',
    space: 'O(k + chunk_size)',
    pros: ['Memory efficient', 'Parallelizable'],
    cons: ['More complex', 'Overhead']
  },

  'Streaming Approach': {
    time: 'O(1) per item',
    space: 'O(k)',
    pros: ['Real-time', 'Memory efficient'],
    cons: ['Complex state management']
  }
};
```


**Interviewer**: Exceptional work! You've demonstrated mastery of algorithms, edge cases, performance optimization, và real-world React applications. Let me ask one final integration question: **How would you integrate this frequency analysis into a larger React application với state management (Redux/Zustand) và testing?**


**Candidate**: Excellent question! Let me show you a complete integration strategy:


```javascript
// 1. Redux Integration với RTK Query
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Async thunk cho processing large datasets
export const processFrequencyAnalysis = createAsyncThunk(
  'analytics/processFrequency',
  async ({ data, options }, { rejectWithValue }) => {
    try {
      // Simulate heavy processing (could be Web Worker)
      const result = await new Promise((resolve) => {
        setTimeout(() => {
          const analysis = findMostFrequentRobust(data, options);
          resolve(analysis);
        }, 100);
      });
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Analytics slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    frequencyResults: [],
    loading: false,
    error: null,
    cache: new Map() // Client-side caching
  },
  reducers: {
    clearResults: (state) => {
      state.frequencyResults = [];
    },
    setCacheEntry: (state, action) => {
      const { key, value } = action.payload;
      state.cache.set(key, value);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processFrequencyAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processFrequencyAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.frequencyResults = action.payload;
      })
      .addCase(processFrequencyAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// RTK Query API
export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/analytics' }),
  tagTypes: ['FrequencyData'],
  endpoints: (builder) => ({
    getFrequencyData: builder.query({
      query: (params) => ({
        url: '/frequency',
        method: 'POST',
        body: params
      }),
      providesTags: ['FrequencyData']
    }),

    saveFrequencyResults: builder.mutation({
      query: (results) => ({
        url: '/frequency/save',
        method: 'POST',
        body: results
      }),
      invalidatesTags: ['FrequencyData']
    })
  })
});

// 2. Zustand Integration (Alternative approach)
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AnalyticsStore {
  data: any[];
  frequencyResults: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setData: (data: any[]) => void;
  processFrequency: (options?: any) => Promise<void>;
  clearResults: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    persist(
      (set, get) => ({
        data: [],
        frequencyResults: [],
        isLoading: false,
        error: null,

        setData: (data) => set({ data }),

        processFrequency: async (options = {}) => {
          set({ isLoading: true, error: null });

          try {
            const { data } = get();

            // Use Web Worker cho heavy computation
            const worker = new Worker(new URL('./frequency-worker.js', import.meta.url));

            const result = await new Promise((resolve, reject) => {
              worker.postMessage({ data, options });
              worker.onmessage = (e) => resolve(e.data);
              worker.onerror = (e) => reject(e);
            });

            set({
              frequencyResults: result,
              isLoading: false
            });

          } catch (error) {
            set({
              error: error.message,
              isLoading: false
            });
          }
        },

        clearResults: () => set({ frequencyResults: [] })
      }),
      {
        name: 'analytics-storage',
        partialize: (state) => ({
          frequencyResults: state.frequencyResults
        })
      }
    ),
    { name: 'analytics-store' }
  )
);

// 3. Main Component với Error Boundaries
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';

const AnalyticsErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-boundary">
    <h2>Analytics Error</h2>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Try Again</button>
  </div>
);

const AnalyticsDashboard = () => {
  return (
    <ErrorBoundary
      FallbackComponent={AnalyticsErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<div>Loading analytics...</div>}>
        <FrequencyAnalysisComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

// Main component
const FrequencyAnalysisComponent = () => {
  // Zustand approach
  const {
    data,
    frequencyResults,
    isLoading,
    error,
    setData,
    processFrequency,
    clearResults
  } = useAnalyticsStore();

  // Or Redux approach
  // const dispatch = useDispatch();
  // const { frequencyResults, loading, error } = useSelector(state => state.analytics);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      setData(parsedData);
    } catch (error) {
      console.error('File parsing error:', error);
    }
  }, [setData]);

  const handleAnalyze = useCallback(() => {
    processFrequency({
      handleNaN: true,
      handleNull: true,
      topN: 10
    });
  }, [processFrequency]);

  return (
    <div className="analytics-dashboard">
      <div className="controls">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading || data.length === 0}
        >
          {isLoading ? 'Processing...' : 'Analyze Frequency'}
        </button>
        <button onClick={clearResults}>
          Clear Results
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="results">
        <h3>Data Stats</h3>
        <p>Items loaded: {data.length}</p>

        {frequencyResults.length > 0 && (
          <div>
            <h3>Most Frequent Items</h3>
            {frequencyResults.map((item, index) => (
              <div key={index} className="result-item">
                {JSON.stringify(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Comprehensive Testing Suite
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';

// Mock Web Worker
class MockWorker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage(data) {
    // Simulate async processing
    setTimeout(() => {
      const result = [1, 2, 3]; // Mock result
      this.onmessage({ data: result });
    }, 100);
  }

  terminate() {}
}

global.Worker = MockWorker;

describe('FrequencyAnalysisComponent', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        analytics: analyticsSlice.reducer
      }
    });
  });

  const renderWithProviders = (component) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('should handle file upload và analysis', async () => {
    renderWithProviders(<FrequencyAnalysisComponent />);

    const fileInput = screen.getByRole('textbox', { type: 'file' });
    const analyzeButton = screen.getByText('Analyze Frequency');

    // Mock file upload
    const file = new File(
      ['[1,2,2,3,3,3]'],
      'test.json',
      { type: 'application/json' }
    );

    await userEvent.upload(fileInput, file);

    expect(screen.getByText('Items loaded: 6')).toBeInTheDocument();

    // Test analysis
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Most Frequent Items')).toBeInTheDocument();
    });
  });

  test('should handle errors gracefully', async () => {
    renderWithProviders(<FrequencyAnalysisComponent />);

    // Mock error scenario
    const errorFile = new File(
      ['invalid json'],
      'error.json',
      { type: 'application/json' }
    );

    const fileInput = screen.getByRole('textbox', { type: 'file' });
    await userEvent.upload(fileInput, errorFile);

    // Should show error handling
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});

// Performance testing
describe('Frequency Analysis Performance', () => {
  test('should handle large datasets efficiently', async () => {
    const largeArray = Array(100000).fill(0).map(() =>
      Math.floor(Math.random() * 1000)
    );

    const start = performance.now();
    const result = findMostFrequentRobust(largeArray);
    const end = performance.now();

    expect(end - start).toBeLessThan(1000); // Should complete trong 1 second
    expect(result.length).toBeGreaterThan(0);
  });

  test('should not cause memory leaks', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    // Process multiple large arrays
    for (let i = 0; i < 10; i++) {
      const array = Array(10000).fill(0).map(() => Math.random());
      findMostFrequentRobust(array);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
  });
});
```


**Key Integration Points:**


1. **State Management**: Integrated với both Redux Toolkit và Zustand
2. **Performance**: Web Workers cho heavy computation
3. **Caching**: Client-side caching strategies
4. **Error Handling**: Error boundaries và graceful degradation
5. **Testing**: Unit tests, integration tests, performance tests
6. **Accessibility**: Proper ARIA labels và keyboard navigation
7. **TypeScript**: Type safety throughout the application


**Production Considerations:**


- **Memory Management**: Cleanup functions và proper disposal
- **Progressive Enhancement**: Works without Web Workers
- **Monitoring**: Performance metrics và error tracking
- **Optimization**: Memoization và virtualization cho large results
- **Security**: Input validation và sanitization


**Interviewer**: Absolutely outstanding! You've demonstrated exceptional technical depth, real-world application knowledge, và production-ready thinking. Your understanding spans from fundamental algorithms to complex system integration. That concludes our technical interview - excellent work!


---


## ĐÁNH GIÁ & FEEDBACK


### Điểm Mạnh Của Candidate:


1. **Technical Excellence**: ⭐⭐⭐⭐⭐

Deep understanding của React fundamentals
Mastery của JavaScript concepts và performance implications
Advanced knowledge của state management patterns
2. **Problem Solving**: ⭐⭐⭐⭐⭐

Systematic approach to complex problems
Excellent edge case handling
Multiple solution approaches với trade-off analysis
3. **Communication**: ⭐⭐⭐⭐⭐

Clear explanations của technical concepts
Good use of examples và practical applications
Effective live coding demonstration
4. **Innovation**: ⭐⭐⭐⭐⭐

Creative solutions cho performance optimization
Modern development patterns và best practices
Forward-thinking approach to scalability


### Overall Assessment: STRONG HIRE


**Level: L6 (Senior Engineer)**


Candidate demonstrates exceptional technical skills phù hợp với Meta's high standards. Recommendation là proceed to system design round.


### Feedback cho Candidate:


- **Strengths**: Exceptional depth trong React ecosystem, excellent performance awareness
- **Growth Areas**: Continue exploring advanced architecture patterns, consider exploring more về accessibility standards


---


*Cuộc phỏng vấn này demonstrate một comprehensive evaluation của Senior Frontend Engineer skills, covering từ fundamental concepts đến advanced production scenarios theo Meta's standards.*
