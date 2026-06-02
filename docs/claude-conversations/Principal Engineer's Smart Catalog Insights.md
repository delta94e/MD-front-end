# Principal Engineer's Smart Catalog Insights

## Claude


# Phân Tích Chuyên Sâu: "Smart Catalog Component" - Góc Nhìn Principal Engineer Tại MAANG


## Lời Mở Đầu: Mindset của Principal Engineer


💭 **Suy nghĩ thầm lặng của một Principal Engineer:**


*"Khi tôi đầu tiên đọc bài viết này, điều đầu tiên tôi nghĩ đến không phải là code, mà là: 'Tại sao problem này lại xuất hiện?' và 'Đây có phải là pattern chúng ta sẽ gặp lại nhiều lần trong scale lớn không?'. Ở level Principal, chúng ta không chỉ solve problem trước mắt, mà phải architect solution có thể scale, maintain, và reuse across multiple teams."*


Bài viết này là một case study tuyệt vời về component design thinking, nhưng khi nhìn từ góc độ Principal Engineer tại các công ty như Meta, Google, Netflix, chúng ta cần đào sâu hơn nhiều. Chúng ta không chỉ build component, mà build **component system** có thể support hàng triệu users, maintain bởi hàng trăm engineers, và evolve theo business requirements.


## PHẦN I: FOUNDATION LEVEL - XÂY DỰNG NỀN TẢNG HIỂU BIẾT


### 1. Context Problem Analysis - Hiểu Vấn Đề Từ Gốc Rễ


📖 **Table of Contents (TOC) Component - Khái Niệm Cốt Lõi**


🌱 **Nguồn Gốc & Motivation:**


Để hiểu tại sao TOC component lại cần thiết, chúng ta phải quay về với nature của human information processing. Khi con người đọc content dài, não bộ cần "mental map" để navigate và track progress. Đây là lý do tại sao sách vở từ hàng nghìn năm trước đã có mục lục.


**Problem Statement Chi Tiết:**


- **Cognitive Load Problem**: Khi page có nhiều sections, users bị overwhelmed và không biết bắt đầu từ đâu
- **Navigation Efficiency**: Users muốn jump đến specific section mà không cần scroll manual
- **Progress Tracking**: Users cần visual indicator về position hiện tại trong overall content
- **Accessibility**: Screen readers và assistive technologies cần structured navigation


**Historical Context:**
Trước khi có automated TOC, developers phải manually maintain navigation menu. Mỗi khi thêm/xóa section, phải update ở multiple places:


```javascript
// Cách cũ - Manual maintenance nightmare
const menuItems = [
  { id: 'section-1', title: 'Introduction' },
  { id: 'section-2', title: 'Technical Details' },
  // ... phải sync với actual content
]
```


**Alternative Solutions & Trade-offs:**


1. **Static Menu**: Simple nhưng maintenance nightmare
2. **Server-side Generation**: Fast nhưng không dynamic
3. **Manual DOM Traversal**: Flexible nhưng performance issues
4. **React-based Auto-generation**: Balance giữa flexibility và performance


🔬 **Bản Chất & Mechanism:**


**Core Algorithm Explanation:**
TOC auto-generation về bản chất là một **tree traversal problem** combined với **DOM manipulation**. Chúng ta cần:


1. **Parse React Element Tree**: Traverse virtual DOM để find elements với anchor props
2. **Build Hierarchical Structure**: Construct tree data structure representing content hierarchy
3. **Generate DOM IDs**: Create unique identifiers cho scroll targets
4. **Inject Navigation Elements**: Modify virtual DOM để add navigation structure


**Data Structure Breakdown:**


```javascript
// Core data structure - Tree Node
interface AnchorItem {
  id: string;           // Unique identifier
  title: string;        // Display text
  level: number;        // Hierarchy depth
  children?: AnchorItem[]; // Sub-sections
  element: ReactElement;   // Reference to original element
}
```


**Memory Model Analysis:**


- **Virtual DOM References**: Mỗi AnchorItem giữ reference đến React element
- **Tree Structure**: Nested arrays tạo hierarchical memory layout
- **String Interning**: IDs và titles được stored as strings trong memory
- **Garbage Collection**: Cleanup khi component unmount để avoid memory leaks


💡 **Intuitive Understanding:**


**Real-world Analogies:**
Hãy tưởng tượng TOC component như một **smart building directory**:


- **Building (Page)**: Chứa nhiều floors và rooms
- **Directory System (TOC)**: Automatically detect all rooms và tạo navigation
- **Elevator (Smooth Scroll)**: Transport users đến destination
- **Floor Plans (Hierarchy)**: Show relationships between spaces


**Visual Metaphors:**
TOC component hoạt động như **GPS system cho webpage**:


- **Route Discovery**: Scan content để find all destinations
- **Map Generation**: Build navigation structure
- **Navigation**: Provide click-to-go functionality
- **Current Location**: Highlight user's current position


**Common Mental Models:**


1. **Tree Explorer**: Giống file system explorer với expandable folders
2. **Chapter Navigator**: Như book chapters với sub-sections
3. **Site Map**: Hierarchical overview của page content


### 2. React Children API Deep Dive - Nền Tảng Kỹ Thuật


📖 **React.Children - Component Traversal Foundation**


🌱 **Nguồn Gốc & Motivation:**


**Problem Statement:**
React components thường nhận `children` prop, nhưng `children` có thể là:


- Single element: `<div>Hello</div>`
- Array of elements: `[<div>A</div>, <div>B</div>]`
- String: `"Hello World"`
- Number: `42`
- Fragment: `<><div>A</div><div>B</div></>`
- Function: `() => <div>Dynamic</div>`


Vấn đề là làm sao để **safely traverse** và **manipulate** những children types khác nhau này?


**Historical Context:**
Trước React 16, children manipulation rất error-prone:


```javascript
// Cách cũ - Không safe
function OldWay({ children }) {
  // Crash nếu children là string hoặc single element
  return children.map(child => /* modify child */)
}
```


React team tạo ra `React.Children` utilities để solve những edge cases này.


🔬 **Bản Chất & Mechanism:**


**Core Algorithm Explanation:**


`React.Children.toArray()` internally thực hiện:


1. **Type Checking**: Determine children type (element, array, string, etc.)
2. **Normalization**: Convert all types thành array format
3. **Flattening**: Handle nested arrays và fragments
4. **Key Assignment**: Ensure mỗi child có unique key


**Step-by-step Execution Flow:**


```javascript
// Internal React.Children.toArray implementation (simplified)
function toArray(children) {
  const result = [];

  // Step 1: Handle null/undefined
  if (children == null) return result;

  // Step 2: Handle different types
  if (Array.isArray(children)) {
    // Recursive flatten arrays
    children.forEach((child, index) => {
      result.push(...toArray(child));
    });
  } else if (isValidElement(children)) {
    // Single React element
    result.push(children);
  } else if (typeof children === 'string' || typeof children === 'number') {
    // Text nodes
    result.push(children);
  }

  return result;
}
```


**Browser Engine Interaction:**


- **V8 Engine**: Children arrays được stored trong V8's hidden classes
- **Memory Layout**: Contiguous memory allocation cho array elements
- **Garbage Collection**: Incremental GC handles child element cleanup


⚙️ **Implementation Deep Dive:**


**Extract Directory Information Function Analysis:**


```javascript
function extractAnchors(nodes: ReactNode): AnchorItem[] {
  return React.Children.toArray(nodes)  // Normalization step
    .map((node: any) => {               // Transform each child
      if (!isValidElement(node)) return null; // Type guard

      const { anchor, visible = true, title, children: sub } = node.props;
      if (!visible || !anchor) return null;   // Filter invalid

      const id = `Anchor-${anchor.replace(/\s+/g, '-')}`;  // Generate ID
      const childrenAnchors = extractAnchors(sub);         // Recursive call

      return {
        title: title || anchor,
        id,
        children: childrenAnchors.length > 0 ? childrenAnchors : undefined,
      };
    })
    .filter(Boolean);  // Remove null values
}
```


**Performance Characteristics (Big O):**


- **Time Complexity**: O(n) where n = total number of React elements
- **Space Complexity**: O(d) where d = maximum depth of nesting
- **Memory Allocation**: Each recursive call creates new stack frame


**Edge Cases & Error Handling:**


1. **Circular References**: Component references itself
2. **Null Children**: Empty or undefined children props
3. **Dynamic Children**: Children generated by functions
4. **Fragment Handling**: React.Fragment unwrapping


### 3. isValidElement Deep Understanding - Type Safety Foundation


📖 **React.isValidElement - Element Validation Mechanism**


🌱 **Nguồn Gốc & Motivation:**


**Problem Statement:**
Trong React ecosystem, `children` prop có thể chứa bất kỳ JavaScript value nào. Khi traverse children để build TOC, chúng ta chỉ muốn process **valid React elements**, không phải strings, numbers, hay objects thông thường.


**Tại Sao Cần Type Guard:**


```javascript
// Scenarios gây crash nếu không có type checking
const children = [
  <Card anchor="section1" />,  // Valid React element
  "Some text",                 // String - không có props
  null,                        // Null value
  undefined,                   // Undefined value
  42,                          // Number
  { anchor: "fake" },          // Plain object - KHÔNG phải React element
];

// Crash without type checking:
children.map(child => child.props.anchor); // TypeError trên non-elements
```


🔬 **Bản Chất & Mechanism:**


**Core Algorithm trong React Source:**


```javascript
// React internals - isValidElement implementation
function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```


**Memory Model Analysis:**


- **REACT_ELEMENT_TYPE**: Special Symbol để identify React elements
- **Object Shape**: Valid elements có specific property structure
- **Type Field**: Element type (component function/class hoặc DOM tag)


**Browser Engine Processing:**


1. **Type Checking**: JavaScript engine checks object type
2. **Symbol Comparison**: Compare $$typeof với known Symbol
3. **Property Access**: Safe access to element properties
4. **Memory Reference**: Validate object reference integrity


⚙️ **Implementation Deep Dive:**


**Type Guard Pattern:**


```javascript
function processChildren(children: ReactNode) {
  return React.Children.toArray(children)
    .filter((child): child is ReactElement => {
      // TypeScript type predicate function
      return isValidElement(child);
    })
    .map(child => {
      // TypeScript now knows child is ReactElement
      // Safe to access child.props without type errors
      return child.props;
    });
}
```


**Performance Implications:**


- **Runtime Overhead**: Type checking có small performance cost
- **Early Return**: Fail fast trên invalid elements
- **Memory Safety**: Prevent invalid memory access


💭 **Principal's Perspective:**


*"Ở Meta, chúng tôi đã gặp production bugs khi skip type checking. Một component nhận children từ third-party library, và library đó pass plain object thay vì React element. Crash trên production với millions of users. Lesson learned: Always validate input types, especially ở component boundaries."*


## PHẦN II: SENIOR LEVEL - ARCHITECTURAL PATTERNS & ADVANCED CONCEPTS


### 4. React Element Cloning & Injection Pattern


📖 **cloneElement - Immutable Element Modification**


🌱 **Nguồn Gốc & Motivation:**


**Problem Statement Chi Tiết:**
React elements are **immutable by design**. Khi chúng ta muốn add thêm props (như `id` attribute) vào existing elements, chúng ta không thể modify trực tiếp:


```javascript
// WRONG - Mutation approach (không work)
function addId(element) {
  element.props.id = 'new-id';  // Error: Cannot assign to read only property
  return element;
}

// CORRECT - Immutable approach với cloneElement
function addId(element) {
  return React.cloneElement(element, { id: 'new-id' });
}
```


**Why Immutability Matters:**


1. **React Reconciliation**: React depends on reference equality để optimize re-renders
2. **Predictable State**: Immutable objects prevent unintended side effects
3. **Time Travel Debugging**: React DevTools có thể track state changes
4. **Concurrent Features**: React 18's concurrent features require immutable updates


🔬 **Bản Chất & Mechanism:**


**Core Algorithm Analysis:**


```javascript
// React.cloneElement simplified implementation
function cloneElement(element, config, ...children) {
  // Step 1: Extract current element properties
  const { key, ref, props: oldProps } = element;

  // Step 2: Merge old props với new props
  const newProps = Object.assign({}, oldProps, config);

  // Step 3: Handle special props (key, ref)
  if (config && config.key !== undefined) {
    newProps.key = config.key;
  }

  // Step 4: Create new element với merged props
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: element.type,
    key: newProps.key,
    ref: newProps.ref,
    props: newProps,
    _owner: element._owner,
  };
}
```


**Memory Model Deep Dive:**


- **Shallow Copy**: cloneElement creates shallow copy của props object
- **Reference Sharing**: Children arrays vẫn share references unless explicitly overridden
- **Memory Efficiency**: React reuses element types và other immutable properties


**Performance Characteristics:**


- **Time Complexity**: O(1) cho element cloning, O(n) cho props merging
- **Space Complexity**: O(1) additional memory per cloned element
- **GC Impact**: Old elements eligible cho garbage collection


⚙️ **Implementation Deep Dive:**


**Auto ID Injection Function:**


```javascript
function injectId(nodes: ReactNode): ReactNode {
  return React.Children.map(nodes, (child: any) => {
    // Type guard - only process valid React elements
    if (!isValidElement(child)) return child;

    // Extract props with destructuring
    const { anchor, visible = true, children: sub } = child.props;

    // Business logic validation
    if (!visible || !anchor) return child;

    // Generate unique ID
    const id = `Anchor-${anchor.replace(/\s+/g, '-')}`;

    // Recursive processing của children
    const processedChildren = injectId(sub);

    // Clone element với new props
    return cloneElement(child, {
      id,                           // Add ID prop
      children: processedChildren,  // Update children
    });
  });
}
```


**Advanced Cloning Patterns:**


```javascript
// Pattern 1: Conditional prop injection
function conditionalClone(element, condition, newProps) {
  return condition
    ? cloneElement(element, newProps)
    : element;
}

// Pattern 2: Prop transformation
function transformProps(element, transformer) {
  const transformedProps = transformer(element.props);
  return cloneElement(element, transformedProps);
}

// Pattern 3: Recursive prop injection
function deepClone(element, propInjector) {
  const newProps = propInjector(element.props);
  const newChildren = React.Children.map(element.props.children, child =>
    isValidElement(child) ? deepClone(child, propInjector) : child
  );

  return cloneElement(element, { ...newProps, children: newChildren });
}
```


**Edge Cases & Error Handling:**


1. **Null Elements**: Handle null/undefined children gracefully
2. **Circular References**: Detect và prevent infinite recursion
3. **Prop Conflicts**: Handle cases where injected props conflict với existing props
4. **Key Preservation**: Maintain React keys cho optimal reconciliation


### 5. Recursive Tree Building - Computer Science Fundamentals


📖 **Tree Construction Algorithms in React Context**


🌱 **Nguồn Gốc & Motivation:**


**Computer Science Background:**
Tree construction từ flat data là fundamental algorithm trong computer science. Trong context của TOC component, chúng ta đang solve một variation của **"Build Tree from Parent-Child Relationships"** problem.


**Problem Variations:**


1. **Bottom-up Construction**: Build tree từ leaf nodes lên root
2. **Top-down Construction**: Build tree từ root xuống leaves
3. **Level-order Construction**: Build tree theo breadth-first manner
4. **Recursive Construction**: Build tree using recursive traversal


**Trong React TOC Context:**
Chúng ta có **nested JSX structure** và cần convert thành **flat tree data structure** có thể render bởi Ant Design components.


🔬 **Bản Chất & Mechanism:**


**Algorithm Analysis:**


```javascript
// Stack-based approach cho tree construction
function buildHierarchy(flatItems: FlatItem[]): TreeNode[] {
  const stack: TreeNode[] = [];
  const result: TreeNode[] = [];

  flatItems.forEach(item => {
    const node: TreeNode = {
      ...item,
      children: [],
      level: calculateLevel(item.anchor)
    };

    // Pop nodes với higher or equal level từ stack
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Root level node
      result.push(node);
    } else {
      // Child of last node trong stack
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return result;
}
```


**Recursive Approach Analysis:**


```javascript
function extractAnchorsRecursive(nodes: ReactNode, level = 0): AnchorItem[] {
  const items: AnchorItem[] = [];

  React.Children.forEach(nodes, child => {
    if (!isValidElement(child)) return;

    const { anchor, visible = true, title, children: sub } = child.props;
    if (!visible || !anchor) return;

    const item: AnchorItem = {
      id: generateId(anchor),
      title: title || anchor,
      level,
      children: extractAnchorsRecursive(sub, level + 1) // Recursive call
    };

    items.push(item);
  });

  return items;
}
```


**Computational Complexity:**


- **Time Complexity**: O(n) where n = total số React elements
- **Space Complexity**: O(h) where h = maximum tree height (call stack)
- **Memory Usage**: Each recursive call consumes stack frame


⚙️ **Implementation Deep Dive:**


**Optimized Tree Construction:**


```javascript
interface TreeBuildContext {
  maxDepth: number;
  nodeCount: number;
  memoryUsage: number;
}

function buildTreeWithMetrics(nodes: ReactNode): [AnchorItem[], TreeBuildContext] {
  const context: TreeBuildContext = {
    maxDepth: 0,
    nodeCount: 0,
    memoryUsage: 0
  };

  function traverse(nodes: ReactNode, depth = 0): AnchorItem[] {
    context.maxDepth = Math.max(context.maxDepth, depth);
    const items: AnchorItem[] = [];

    React.Children.forEach(nodes, child => {
      if (!isValidElement(child)) return;

      context.nodeCount++;
      const { anchor, visible = true, title, children: sub } = child.props;

      if (!visible || !anchor) return;

      const childItems = traverse(sub, depth + 1);
      const item: AnchorItem = {
        id: generateId(anchor),
        title: title || anchor,
        level: depth,
        children: childItems.length > 0 ? childItems : undefined
      };

      context.memoryUsage += estimateItemSize(item);
      items.push(item);
    });

    return items;
  }

  const tree = traverse(nodes);
  return [tree, context];
}
```


**Memory-Efficient Approach:**


```javascript
// Lazy evaluation approach
function createLazyTree(nodes: ReactNode) {
  return {
    *[Symbol.iterator]() {
      yield* traverseNodes(nodes);
    },

    toArray() {
      return Array.from(this);
    },

    find(predicate: (item: AnchorItem) => boolean) {
      for (const item of this) {
        if (predicate(item)) return item;
      }
      return null;
    }
  };
}

function* traverseNodes(nodes: ReactNode): Generator<AnchorItem> {
  for (const child of React.Children.toArray(nodes)) {
    if (!isValidElement(child)) continue;

    const { anchor, visible = true, title, children: sub } = child.props;
    if (!visible || !anchor) continue;

    yield {
      id: generateId(anchor),
      title: title || anchor,
      children: sub ? Array.from(traverseNodes(sub)) : undefined
    };
  }
}
```


💭 **Principal's Perspective:**


*"Ở Google, chúng tôi có document viewer component cần handle documents với thousands of sections. Recursive approach đơn giản gây stack overflow. Chúng tôi phải implement iterative approach với manual stack management. Key lesson: Always consider worst-case scenarios khi design recursive algorithms."*


### 6. DOM Manipulation & Scroll Behavior


📖 **scrollIntoView API - Browser Navigation Mechanics**


🌱 **Nguồn Gốc & Motivation:**


**Historical Context:**
Trước khi có `scrollIntoView()`, developers phải manually calculate scroll positions:


```javascript
// Cách cũ - Manual scroll calculation
function scrollToElement(elementId) {
  const element = document.getElementById(elementId);
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset + rect.top;

  window.scrollTo({
    top: scrollTop,
    behavior: 'smooth'
  });
}
```


**Modern scrollIntoView Benefits:**


1. **Browser Optimization**: Browsers có optimized implementations
2. **Accessibility**: Screen readers understand scroll intent
3. **Cross-browser Compatibility**: Standardized behavior
4. **Performance**: Hardware acceleration support


🔬 **Bản Chất & Mechanism:**


**Browser Engine Processing:**


1. **Layout Calculation**: Browser calculates element position trong document
2. **Viewport Analysis**: Determine current viewport position
3. **Scroll Distance**: Calculate required scroll distance
4. **Animation**: Perform smooth scroll animation (nếu requested)
5. **Callback**: Fire scroll events và update history


**scrollIntoView Algorithm:**


```javascript
// Browser internal logic (simplified)
function scrollIntoView(element, options = {}) {
  const { behavior = 'auto', block = 'start', inline = 'nearest' } = options;

  // Step 1: Get element bounding rect
  const elementRect = element.getBoundingClientRect();
  const containerRect = getScrollContainer(element).getBoundingClientRect();

  // Step 2: Calculate scroll distances
  const scrollTop = calculateVerticalScroll(elementRect, containerRect, block);
  const scrollLeft = calculateHorizontalScroll(elementRect, containerRect, inline);

  // Step 3: Perform scroll
  if (behavior === 'smooth') {
    animateScroll(scrollTop, scrollLeft);
  } else {
    setScrollPosition(scrollTop, scrollLeft);
  }
}
```


⚙️ **Implementation Deep Dive:**


**Enhanced Scroll Handler:**


```javascript
interface ScrollOptions {
  behavior?: 'auto' | 'smooth';
  offset?: number;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
}

function createScrollHandler(options: ScrollOptions = {}) {
  const { behavior = 'smooth', offset = 0, onScrollStart, onScrollEnd } = options;

  return (e: React.MouseEvent, link: { href: string }) => {
    e.preventDefault();

    const id = link.href.slice(1); // Remove '#' prefix
    const element = document.getElementById(id);

    if (!element) {
      console.warn(`Element với ID "${id}" không tồn tại`);
      return;
    }

    onScrollStart?.();

    // Calculate offset position
    const elementRect = element.getBoundingClientRect();
    const offsetTop = window.pageYOffset + elementRect.top - offset;

    // Perform smooth scroll
    window.scrollTo({
      top: offsetTop,
      behavior
    });

    // Detect scroll completion
    let scrollEndTimer: NodeJS.Timeout;
    const handleScrollEnd = () => {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        window.removeEventListener('scroll', handleScrollEnd);
        onScrollEnd?.();
      }, 150); // Debounce scroll end detection
    };

    window.addEventListener('scroll', handleScrollEnd);
  };
}
```


**Performance Optimization:**


```javascript
// Throttled scroll performance
function createOptimizedScrollHandler() {
  let isScrolling = false;

  return (e: React.MouseEvent, link: { href: string }) => {
    if (isScrolling) return; // Prevent rapid scroll calls

    isScrolling = true;

    requestAnimationFrame(() => {
      const element = document.getElementById(link.href.slice(1));
      element?.scrollIntoView({ behavior: 'smooth' });

      setTimeout(() => {
        isScrolling = false;
      }, 1000); // Reset after animation completes
    });
  };
}
```


**Cross-browser Compatibility:**


```javascript
// Polyfill cho older browsers
function scrollIntoViewPolyfill(element: Element, options: ScrollIntoViewOptions = {}) {
  if ('scrollIntoView' in element) {
    // Native support
    element.scrollIntoView(options);
  } else {
    // Fallback implementation
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset + rect.top;

    if (options.behavior === 'smooth') {
      smoothScrollTo(scrollTop);
    } else {
      window.scrollTo(0, scrollTop);
    }
  }
}

function smoothScrollTo(targetY: number) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  const duration = 500; // ms
  let startTime: number;

  function animation(currentTime: number) {
    if (!startTime) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // Easing function
    const easeInOut = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;

    window.scrollTo(0, startY + distance * easeInOut);

    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}
```


**Accessibility Considerations:**


```javascript
function accessibleScrollHandler(e: React.MouseEvent, link: { href: string }) {
  e.preventDefault();

  const element = document.getElementById(link.href.slice(1));
  if (!element) return;

  // Announce scroll action to screen readers
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `Navigating to ${element.textContent}`;
  document.body.appendChild(announcement);

  // Focus management
  element.setAttribute('tabindex', '-1');
  element.focus();

  // Smooth scroll
  element.scrollIntoView({ behavior: 'smooth' });

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(announcement);
    element.removeAttribute('tabindex');
  }, 1000);
}
```


## PHẦN III: PRINCIPAL LEVEL - SYSTEM DESIGN & ARCHITECTURE


### 7. Component Architecture Patterns


📖 **Compound Component Pattern - Advanced Component Design**


🌱 **Nguồn Gốc & Motivation:**


**Pattern Evolution:**
Compound Component pattern evolved từ need để create **flexible, composable UI components** mà vẫn maintain **tight coupling between related parts**.


**Problem Statement:**
Traditional approach với monolithic components:


```javascript
// Monolithic approach - Không flexible
<TableOfContents
  items={[
    { id: '1', title: 'Section 1', children: [...] },
    { id: '2', title: 'Section 2', children: [...] }
  ]}
  renderStyle="tree"
  showIcons={true}
  onItemClick={handleClick}
/>
```


Problems với approach này:


1. **Configuration Explosion**: Too many props cho mọi possible option
2. **Limited Flexibility**: Khó customize specific parts
3. **Poor Composition**: Không thể mix-and-match behaviors
4. **Maintenance Overhead**: Single component phải handle all use cases


**Compound Component Solution:**


```javascript
// Compound approach - Flexible & composable
<AutoDirectory>
  <Card anchor="section1" title="Introduction" visible>
    <Card anchor="subsection1a" title="Overview" />
    <Card anchor="subsection1b" title="Goals" />
  </Card>
  <Card anchor="section2" title="Implementation" visible />
</AutoDirectory>
```


🔬 **Bản Chất & Mechanism:**


**Core Implementation Pattern:**


```javascript
// Context-based compound component
const DirectoryContext = React.createContext<DirectoryContextValue>({});

export const AutoDirectory: FC<{ children: ReactNode }> & {
  Card: typeof DirectoryCard;
} = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [anchorTree, setAnchorTree] = useState<AnchorItem[]>([]);

  const contextValue = useMemo(() => ({
    currentSection,
    setCurrentSection,
    registerAnchor: (id: string, title: string) => {
      // Register anchor với parent directory
    },
    unregisterAnchor: (id: string) => {
      // Cleanup anchor khi component unmount
    }
  }), [currentSection]);

  useEffect(() => {
    const extractedTree = extractAnchors(children);
    setAnchorTree(extractedTree);
  }, [children]);

  return (
    <DirectoryContext.Provider value={contextValue}>
      <div className="directory-container">
        <div className="content">{injectId(children)}</div>
        <div className="navigation">
          <DirectoryNavigation tree={anchorTree} />
        </div>
      </div>
    </DirectoryContext.Provider>
  );
};

// Attached sub-component
const DirectoryCard: FC<CardProps> = ({ anchor, title, visible = true, children }) => {
  const { registerAnchor, unregisterAnchor } = useContext(DirectoryContext);

  useEffect(() => {
    if (anchor && visible) {
      registerAnchor(anchor, title);
      return () => unregisterAnchor(anchor);
    }
  }, [anchor, title, visible, registerAnchor, unregisterAnchor]);

  if (!visible) return null;

  return (
    <div className="directory-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
};

// Attach sub-component to main component
AutoDirectory.Card = DirectoryCard;
```


**Advanced Pattern - Render Props Integration:**


```javascript
interface DirectoryRenderProps {
  tree: AnchorItem[];
  currentSection: string | null;
  navigateToSection: (id: string) => void;
}

export const AutoDirectory: FC<{
  children: ReactNode;
  renderNavigation?: (props: DirectoryRenderProps) => ReactNode;
}> = ({ children, renderNavigation }) => {
  // ... existing logic

  const renderProps: DirectoryRenderProps = {
    tree: anchorTree,
    currentSection,
    navigateToSection: (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      setCurrentSection(id);
    }
  };

  return (
    <DirectoryContext.Provider value={contextValue}>
      <div className="directory-container">
        <div className="content">{injectId(children)}</div>
        <div className="navigation">
          {renderNavigation ?
            renderNavigation(renderProps) :
            <DefaultNavigation {...renderProps} />
          }
        </div>
      </div>
    </DirectoryContext.Provider>
  );
};
```


⚙️ **Implementation Deep Dive:**


**Type-Safe Compound Components:**


```typescript
// Advanced TypeScript patterns
interface DirectoryComponents {
  Card: typeof DirectoryCard;
  Section: typeof DirectorySection;
  Navigation: typeof DirectoryNavigation;
}

interface DirectoryProps {
  children: ReactNode;
  layout?: 'horizontal' | 'vertical';
  sticky?: boolean;
  offset?: number;
}

type DirectoryComponent = FC<DirectoryProps> & DirectoryComponents;

export const AutoDirectory: DirectoryComponent = ({ children, layout = 'horizontal', sticky = true, offset = 80 }) => {
  // Implementation với full type safety
};

// Type-safe sub-components
AutoDirectory.Card = DirectoryCard;
AutoDirectory.Section = DirectorySection;
AutoDirectory.Navigation = DirectoryNavigation;
```


**Performance Optimization:**


```javascript
// Memoized compound component
export const AutoDirectory = React.memo<DirectoryProps>(({ children, ...props }) => {
  const memoizedChildren = useMemo(() => children, [children]);
  const memoizedTree = useMemo(() => extractAnchors(memoizedChildren), [memoizedChildren]);

  return (
    <DirectoryProvider tree={memoizedTree} {...props}>
      <DirectoryLayout>
        <DirectoryContent>{injectId(memoizedChildren)}</DirectoryContent>
        <DirectoryNavigation />
      </DirectoryLayout>
    </DirectoryProvider>
  );
});

// Memoized sub-components
AutoDirectory.Card = React.memo(DirectoryCard);
```


### 8. State Management & Context Patterns


📖 **Context-based State Management - Advanced Patterns**


🌱 **Nguồn Gốc & Motivation:**


**Evolution of State Management:**


1. **Component State Era**: Mọi state ở component level
2. **Prop Drilling Era**: Pass state through multiple component layers
3. **Redux Era**: Centralized global state management
4. **Context Era**: Scoped state management với React Context
5. **Hook Era**: Composable state logic với custom hooks


**Problem với Traditional Approaches:**


```javascript
// Prop drilling nightmare
function App() {
  const [currentSection, setCurrentSection] = useState(null);
  return (
    <Layout>
      <Content>
        <Section currentSection={currentSection} onSectionChange={setCurrentSection}>
          <SubSection currentSection={currentSection} onSectionChange={setCurrentSection}>
            <Item currentSection={currentSection} onSectionChange={setCurrentSection} />
          </SubSection>
        </Section>
      </Content>
      <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
    </Layout>
  );
}
```


🔬 **Bản Chất & Mechanism:**


**Context Architecture Design:**


```typescript
// Layered context architecture
interface DirectoryState {
  // Navigation state
  currentSection: string | null;
  anchorTree: AnchorItem[];

  // UI state
  isNavigationVisible: boolean;
  navigationWidth: number;

  // Behavior state
  scrollBehavior: 'smooth' | 'auto';
  offset: number;

  // Performance state
  virtualizedRendering: boolean;
  lazyLoading: boolean;
}

interface DirectoryActions {
  // Navigation actions
  navigateToSection: (id: string) => void;
  registerAnchor: (anchor: AnchorInfo) => void;
  unregisterAnchor: (id: string) => void;

  // UI actions
  toggleNavigation: () => void;
  setNavigationWidth: (width: number) => void;

  // Configuration actions
  updateScrollBehavior: (behavior: 'smooth' | 'auto') => void;
  setOffset: (offset: number) => void;
}

type DirectoryContextValue = DirectoryState & DirectoryActions;
```


**Advanced Context Implementation:**


```typescript
// Context với reducer pattern
type DirectoryAction =
  | { type: 'NAVIGATE_TO_SECTION'; payload: string }
  | { type: 'REGISTER_ANCHOR'; payload: AnchorInfo }
  | { type: 'UNREGISTER_ANCHOR'; payload: string }
  | { type: 'TOGGLE_NAVIGATION' }
  | { type: 'SET_NAVIGATION_WIDTH'; payload: number }
  | { type: 'UPDATE_TREE'; payload: AnchorItem[] };

const directoryReducer = (state: DirectoryState, action: DirectoryAction): DirectoryState => {
  switch (action.type) {
    case 'NAVIGATE_TO_SECTION':
      return {
        ...state,
        currentSection: action.payload,
        // Update URL hash without page refresh
        // Update browser history
      };

    case 'REGISTER_ANCHOR':
      return {
        ...state,
        anchorTree: insertAnchorInTree(state.anchorTree, action.payload),
      };

    case 'UNREGISTER_ANCHOR':
      return {
        ...state,
        anchorTree: removeAnchorFromTree(state.anchorTree, action.payload),
      };

    case 'UPDATE_TREE':
      return {
        ...state,
        anchorTree: action.payload,
        // Reset current section nếu không tồn tại trong new tree
        currentSection: validateCurrentSection(state.currentSection, action.payload),
      };

    default:
      return state;
  }
};

// Context provider với advanced features
export const DirectoryProvider: FC<{ children: ReactNode; initialConfig?: Partial<DirectoryState> }> = ({
  children,
  initialConfig = {}
}) => {
  const [state, dispatch] = useReducer(directoryReducer, {
    currentSection: null,
    anchorTree: [],
    isNavigationVisible: true,
    navigationWidth: 250,
    scrollBehavior: 'smooth',
    offset: 80,
    virtualizedRendering: false,
    lazyLoading: true,
    ...initialConfig,
  });

  // Memoized actions để prevent unnecessary re-renders
  const actions = useMemo(() => ({
    navigateToSection: (id: string) => {
      dispatch({ type: 'NAVIGATE_TO_SECTION', payload: id });

      // Side effects
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({
          behavior: state.scrollBehavior,
          block: 'start'
        });

        // Update URL hash
        window.history.replaceState(null, '', `#${id}`);

        // Analytics tracking
        trackNavigation(id);
      }
    },

    registerAnchor: (anchor: AnchorInfo) => {
      dispatch({ type: 'REGISTER_ANCHOR', payload: anchor });
    },

    unregisterAnchor: (id: string) => {
      dispatch({ type: 'UNREGISTER_ANCHOR', payload: id });
    },

    toggleNavigation: () => {
      dispatch({ type: 'TOGGLE_NAVIGATION' });
    },

    setNavigationWidth: (width: number) => {
      dispatch({ type: 'SET_NAVIGATION_WIDTH', payload: width });
    },

    updateScrollBehavior: (behavior: 'smooth' | 'auto') => {
      dispatch({ type: 'UPDATE_SCROLL_BEHAVIOR', payload: behavior });
    },

    setOffset: (offset: number) => {
      dispatch({ type: 'SET_OFFSET', payload: offset });
    },
  }), [state.scrollBehavior]);

  const contextValue = useMemo(() => ({
    ...state,
    ...actions,
  }), [state, actions]);

  return (
    <DirectoryContext.Provider value={contextValue}>
      {children}
    </DirectoryContext.Provider>
  );
};
```


⚙️ **Implementation Deep Dive:**


**Custom Hooks cho State Access:**


```typescript
// Typed hooks cho different use cases
export const useDirectoryNavigation = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectoryNavigation must be used within DirectoryProvider');
  }

  return {
    currentSection: context.currentSection,
    navigateToSection: context.navigateToSection,
    anchorTree: context.anchorTree,
  };
};

export const useDirectoryUI = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectoryUI must be used within DirectoryProvider');
  }

  return {
    isNavigationVisible: context.isNavigationVisible,
    navigationWidth: context.navigationWidth,
    toggleNavigation: context.toggleNavigation,
    setNavigationWidth: context.setNavigationWidth,
  };
};

export const useDirectoryConfig = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectoryConfig must be used within DirectoryProvider');
  }

  return {
    scrollBehavior: context.scrollBehavior,
    offset: context.offset,
    updateScrollBehavior: context.updateScrollBehavior,
    setOffset: context.setOffset,
  };
};

// Advanced hook với selector pattern
export const useDirectorySelector = <T>(selector: (state: DirectoryContextValue) => T): T => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectorySelector must be used within DirectoryProvider');
  }

  return useMemo(() => selector(context), [context, selector]);
};

// Usage examples
const currentSection = useDirectorySelector(state => state.currentSection);
const navigationWidth = useDirectorySelector(state => state.navigationWidth);
```


**Performance Optimization với Context Splitting:**


```typescript
// Split contexts để minimize re-renders
const DirectoryStateContext = React.createContext<DirectoryState | undefined>(undefined);
const DirectoryActionsContext = React.createContext<DirectoryActions | undefined>(undefined);

export const DirectoryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(directoryReducer, initialState);

  // Actions không change reference khi state thay đổi
  const actions = useRef<DirectoryActions>({
    navigateToSection: (id: string) => {
      dispatch({ type: 'NAVIGATE_TO_SECTION', payload: id });
    },
    // ... other actions
  }).current;

  return (
    <DirectoryStateContext.Provider value={state}>
      <DirectoryActionsContext.Provider value={actions}>
        {children}
      </DirectoryActionsContext.Provider>
    </DirectoryStateContext.Provider>
  );
};

// Separate hooks cho state và actions
export const useDirectoryState = () => {
  const state = useContext(DirectoryStateContext);
  if (!state) {
    throw new Error('useDirectoryState must be used within DirectoryProvider');
  }
  return state;
};

export const useDirectoryActions = () => {
  const actions = useContext(DirectoryActionsContext);
  if (!actions) {
    throw new Error('useDirectoryActions must be used within DirectoryProvider');
  }
  return actions;
};
```


💭 **Principal's Perspective:**


*"Ở Netflix, chúng tôi có video player component với hơn 50 different state pieces. Ban đầu chúng tôi dùng single giant context, nhưng mỗi state change trigger re-render cho entire player UI. Performance terrible. Chúng tôi phải split thành multiple contexts theo feature boundaries. Lesson: Context granularity matters for performance."*


### 9. Performance Optimization Strategies


📖 **React Performance Optimization - Production-Ready Patterns**


🌱 **Nguồn Gốc & Motivation:**


**Performance Challenges trong TOC Component:**


1. **Large DOM Trees**: Documents với hundreds of sections
2. **Frequent Re-renders**: Navigation state changes trigger renders
3. **Memory Leaks**: Event listeners và timers not cleaned up
4. **Layout Thrashing**: Frequent DOM measurements
5. **Bundle Size**: Large dependencies như Ant Design


**Real-world Performance Issues:**


- **Meta's Doc Platform**: 10,000+ section documents gây browser freeze
- **Google Docs**: Smooth scrolling performance on low-end devices
- **Notion**: Real-time collaboration với TOC updates
- **Confluence**: Large page rendering optimization


🔬 **Bản Chất & Mechanism:**


**React Rendering Pipeline Analysis:**


```typescript
// Performance monitoring wrapper
function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    const renderStart = performance.now();
    const [renderCount, setRenderCount] = useState(0);

    useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      console.log(`${componentName} render #${renderCount + 1}: ${renderTime.toFixed(2)}ms`);
      setRenderCount(prev => prev + 1);

      // Report to performance monitoring service
      reportRenderTime(componentName, renderTime);
    });

    return <WrappedComponent {...props} />;
  });
}
```


**Memory Optimization Patterns:**


```typescript
// Virtualized TOC cho large documents
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTOCProps {
  items: AnchorItem[];
  height: number;
  itemHeight: number;
}

const VirtualizedTOC: FC<VirtualizedTOCProps> = ({ items, height, itemHeight }) => {
  const flattenedItems = useMemo(() => {
    const flatten = (items: AnchorItem[], level = 0): FlatItem[] => {
      return items.reduce<FlatItem[]>((acc, item) => {
        acc.push({ ...item, level });
        if (item.children) {
          acc.push(...flatten(item.children, level + 1));
        }
        return acc;
      }, []);
    };
    return flatten(items);
  }, [items]);

  const renderItem = useCallback(({ index, style }: { index: number; style: CSSProperties }) => {
    const item = flattenedItems[index];
    return (
      <div style={style} className={`toc-item level-${item.level}`}>
        <TOCItem item={item} />
      </div>
    );
  }, [flattenedItems]);

  return (
    <List
      height={height}
      itemCount={flattenedItems.length}
      itemSize={itemHeight}
      itemData={flattenedItems}
    >
      {renderItem}
    </List>
  );
};
```


⚙️ **Implementation Deep Dive:**


**Advanced Memoization Strategies:**


```typescript
// Selective memoization cho complex objects
const selectivelyMemoizedExtractAnchors = useMemo(() => {
  const memoCache = new WeakMap<ReactElement, AnchorItem>();

  return function extractAnchors(nodes: ReactNode): AnchorItem[] {
    return React.Children.toArray(nodes)
      .map((node: any) => {
        if (!isValidElement(node)) return null;

        // Check cache first
        if (memoCache.has(node)) {
          return memoCache.get(node)!;
        }

        const { anchor, visible = true, title, children: sub } = node.props;
        if (!visible || !anchor) return null;

        const id = `Anchor-${anchor.replace(/\s+/g, '-')}`;
        const childrenAnchors = extractAnchors(sub);

        const item: AnchorItem = {
          title: title || anchor,
          id,
          children: childrenAnchors.length > 0 ? childrenAnchors : undefined,
        };

        // Cache result
        memoCache.set(node, item);
        return item;
      })
      .filter(Boolean);
  };
}, []);
```


**Efficient Event Handling:**


```typescript
// Debounced scroll handling
const useOptimizedScrollHandler = (onSectionChange: (id: string) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Debounce section changes
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          const visibleEntry = entries.find(entry => entry.isIntersecting);
          if (visibleEntry) {
            onSectionChange(visibleEntry.target.id);
          }
        }, 100);
      },
      {
        rootMargin: '-20% 0px -80% 0px', // Only trigger khi section is prominently visible
        threshold: 0.1
      }
    );

    observerRef.current = observer;

    // Observe all section elements
    document.querySelectorAll('[id^="Anchor-"]').forEach(el => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutRef.current);
    };
  }, [onSectionChange]);

  return observerRef.current;
};
```


**Bundle Size Optimization:**


```typescript
// Tree-shaking friendly imports
import { Anchor } from 'antd/es/anchor';
import { Tree } from 'antd/es/tree';
import type { AnchorProps } from 'antd/es/anchor';
import type { TreeProps } from 'antd/es/tree';

// Dynamic imports cho optional features
const LazyTreeComponent = React.lazy(() =>
  import('./TreeNavigation').then(module => ({
    default: module.TreeNavigation
  }))
);

const LazyAnchorComponent = React.lazy(() =>
  import('./AnchorNavigation').then(module => ({
    default: module.AnchorNavigation
  }))
);

// Conditional loading based on props
const NavigationComponent: FC<NavigationProps> = ({ type, ...props }) => {
  const Component = type === 'tree' ? LazyTreeComponent : LazyAnchorComponent;

  return (
    <Suspense fallback={<div>Loading navigation...</div>}>
      <Component {...props} />
    </Suspense>
  );
};
```


**Advanced Performance Monitoring:**


```typescript
// Custom hook cho performance tracking
const usePerformanceMetrics = (componentName: string) => {
  const metricsRef = useRef({
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  });

  const startTime = useRef<number>(0);

  // Track render start
  startTime.current = performance.now();

  useLayoutEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    metricsRef.current.renderCount++;
    metricsRef.current.lastRenderTime = renderTime;
    metricsRef.current.totalRenderTime += renderTime;
    metricsRef.current.averageRenderTime =
      metricsRef.current.totalRenderTime / metricsRef.current.renderCount;

    // Report performance issues
    if (renderTime > 16) { // Longer than one frame
      console.warn(`${componentName}: Slow render detected - ${renderTime.toFixed(2)}ms`);
    }

    // Send metrics to monitoring service
    if (metricsRef.current.renderCount % 10 === 0) {
      sendPerformanceMetrics(componentName, metricsRef.current);
    }
  });

  return metricsRef.current;
};
```


**Production-Ready Error Boundaries:**


```typescript
interface ErrorInfo {
  componentStack: string;
  errorBoundary: string;
}

class DirectoryErrorBoundary extends React.Component
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error với full context
    console.error('DirectoryErrorBoundary caught an error:', error, errorInfo);

    // Send error to monitoring service
    reportError({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      component: 'AutoDirectory',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Track error in analytics
    trackError('directory_component_error', {
      error_message: error.message,
      error_type: error.name
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h3>Something went wrong with the table of contents</h3>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```


💭 **Principal's Perspective:**


*"Performance optimization ở Netflix không chỉ là code optimization. Chúng tôi phải consider user device capabilities, network conditions, và content scale. Một video với 200 chapters cần completely different approach so với 5 chapters. Key insight: Performance is a product feature, not just a technical concern."*


### 10. Accessibility & User Experience


📖 **Web Accessibility (a11y) - Inclusive Design Principles**


🌱 **Nguồn Gốc & Motivation:**


**Why Accessibility Matters:**


1. **Legal Compliance**: ADA, Section 508, WCAG requirements
2. **User Base**: 15% population có some form of disability
3. **SEO Benefits**: Screen reader optimizations help search engines
4. **Better UX**: Accessibility features benefit all users
5. **Brand Reputation**: Inclusive design reflects company values


**Common A11y Issues trong TOC Components:**


- **Missing Landmarks**: Screen readers can't identify navigation regions
- **Poor Focus Management**: Tab navigation doesn't work properly
- **No Skip Links**: Users can't skip navigation if desired
- **Missing Labels**: Interactive elements không có descriptive text
- **Color Dependencies**: Information conveyed only through color


🔬 **Bản Chất & Mechanism:**


**ARIA (Accessible Rich Internet Applications) Fundamentals:**


```typescript
// Comprehensive ARIA implementation
interface AccessibleTOCProps {
  tree: AnchorItem[];
  ariaLabel?: string;
  landmark?: boolean;
  skipLink?: boolean;
}

const AccessibleTOC: FC<AccessibleTOCProps> = ({
  tree,
  ariaLabel = "Table of contents",
  landmark = true,
  skipLink = true
}) => {
  const tocRef = useRef<HTMLElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  return (
    <>
      {skipLink && (

          ref={skipLinkRef}
          href="#main-content"
          className="sr-only focus:not-sr-only"
          onFocus={() => {
            // Announce skip link availability
            announceToScreenReader("Skip to main content link available");
          }}
        >
          Skip to main content
        </a>
      )}

      <nav
        ref={tocRef}
        role={landmark ? "navigation" : undefined}
        aria-label={ariaLabel}
        aria-describedby="toc-description"
      >
        <div id="toc-description" className="sr-only">
          Navigation menu with {tree.length} main sections.
          Use arrow keys to navigate between items.
        </div>

        <Tree
          treeData={tree}
          aria-activedescendant={getCurrentActiveId()}
          onKeyDown={handleKeyNavigation}
          onSelect={handleAccessibleSelect}
          itemHeight={40} // Minimum touch target size
        />
      </nav>
    </>
  );
};

// Screen reader announcements
const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Cleanup after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
```


**Keyboard Navigation Implementation:**


```typescript
const useKeyboardNavigation = (tree: AnchorItem[]) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const flatTree = useMemo(() => flattenTree(tree), [tree]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, flatTree.length - 1));
        announceToScreenReader(`${flatTree[focusedIndex + 1]?.title}`);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        announceToScreenReader(`${flatTree[focusedIndex - 1]?.title}`);
        break;

      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        announceToScreenReader(`First item: ${flatTree[0]?.title}`);
        break;

      case 'End':
        e.preventDefault();
        setFocusedIndex(flatTree.length - 1);
        announceToScreenReader(`Last item: ${flatTree[flatTree.length - 1]?.title}`);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        const currentItem = flatTree[focusedIndex];
        if (currentItem) {
          navigateToSection(currentItem.id);
          announceToScreenReader(`Navigated to ${currentItem.title}`, 'assertive');
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        // Expand collapsed node
        expandNode(flatTree[focusedIndex]?.id);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        // Collapse expanded node
        collapseNode(flatTree[focusedIndex]?.id);
        break;
    }
  }, [focusedIndex, flatTree]);

  return { focusedIndex, handleKeyDown };
};
```


⚙️ **Implementation Deep Dive:**


**Focus Management:**


```typescript
const useFocusManagement = () => {
  const previousFocus = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const saveFocus = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocus.current) {
      previousFocus.current.focus();
    }
  }, []);

  return { trapFocus, saveFocus, restoreFocus };
};
```


**High Contrast & Theme Support:**


```typescript
// System preference detection
const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargePrint: false,
    prefersDarkMode: false
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersLargePrint: window.matchMedia('(min-resolution: 192dpi)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
      });
    };

    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      '(prefers-reduced-motion: reduce)',
      '(prefers-contrast: high)',
      '(min-resolution: 192dpi)',
      '(prefers-color-scheme: dark)'
    ];

    const listeners = mediaQueries.map(query => {
      const mq = window.matchMedia(query);
      mq.addListener(updatePreferences);
      return () => mq.removeListener(updatePreferences);
    });

    return () => {
      listeners.forEach(cleanup => cleanup());
    };
  }, []);

  return preferences;
};

// Adaptive styling based on preferences
const AdaptiveTOC: FC<TOCProps> = ({ tree, ...props }) => {
  const preferences = useAccessibilityPreferences();

  const adaptiveStyles = useMemo(() => ({
    animationDuration: preferences.prefersReducedMotion ? '0s' : '0.3s',
    fontSize: preferences.prefersLargePrint ? '1.2em' : '1em',
    colorScheme: preferences.prefersDarkMode ? 'dark' : 'light',
    outline: preferences.prefersHighContrast ? '2px solid' : 'none'
  }), [preferences]);

  return (
    <div style={adaptiveStyles} className="adaptive-toc">
      <TOCNavigation tree={tree} {...props} />
    </div>
  );
};
```


**Testing Accessibility:**


```typescript
// Automated a11y testing integration
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('AutoDirectory Accessibility', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(
      <AutoDirectory>
        <Card anchor="section1" title="Section 1" visible>
          <Card anchor="subsection1" title="Subsection 1" visible />
        </Card>
      </AutoDirectory>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should support keyboard navigation', () => {
    const { getByRole } = render(<AutoDirectory>{/* ... */}</AutoDirectory>);
    const navigation = getByRole('navigation');

    // Test tab navigation
    userEvent.tab();
    expect(navigation).toHaveFocus();

    // Test arrow key navigation
    userEvent.keyboard('{ArrowDown}');
    expect(getByRole('treeitem')).toHaveFocus();
  });

  test('should announce navigation changes', async () => {
    const announcements: string[] = [];

    // Mock aria-live announcements
    const mockAnnounce = jest.fn((message: string) => {
      announcements.push(message);
    });

    render(<AutoDirectory onAnnounce={mockAnnounce}>{/* ... */}</AutoDirectory>);

    // Navigate to section
    userEvent.click(getByText('Section 1'));

    await waitFor(() => {
      expect(announcements).toContain('Navigated to Section 1');
    });
  });
});
```


💭 **Principal's Perspective:**


*"Accessibility ở Apple không phải là afterthought - nó là core requirement từ design phase. Mỗi component phải pass comprehensive a11y testing trước khi ship. Chúng tôi có dedicated a11y engineers review every interface. Cost upfront cao hơn, nhưng maintenance cost và user satisfaction tốt hơn nhiều."*


## PHẦN IV: PRODUCTION ENGINEERING & SCALE


### 11. Testing Strategies - Comprehensive Coverage


📖 **Testing Pyramid for Complex Components**


🌱 **Nguồn Gốc & Motivation:**


**Testing Challenges trong Component Systems:**


1. **Integration Complexity**: Multiple components work together
2. **State Dependencies**: Component behavior depends on context state
3. **DOM Manipulation**: Direct DOM interaction cần testing
4. **Async Behavior**: Scroll animations và event handling
5. **Edge Cases**: Infinite nesting, circular references, performance limits


**Testing Philosophy at MAANG:**


- **Meta**: Fast feedback loops với snapshot testing
- **Google**: Hermetic testing với isolated environments
- **Netflix**: Chaos engineering cho component resilience
- **Amazon**: Property-based testing cho edge cases
- **Apple**: Accessibility testing integration


🔬 **Bản Chất & Mechanism:**


**Testing Architecture:**


```typescript
// Test setup với comprehensive mocking
const createTestEnvironment = () => {
  // Mock DOM APIs
  Object.defineProperty(window, 'scrollTo', {
    value: jest.fn(),
    writable: true
  });

  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: jest.fn(),
    writable: true
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    trigger: (entries: any[]) => callback(entries) // Helper cho testing
  }));

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn()
    }
  });

  return {
    cleanup: () => {
      jest.clearAllMocks();
    }
  };
};
```


**Unit Testing Patterns:**


```typescript
describe('extractAnchors', () => {
  test('should extract simple anchor structure', () => {
    const children = (
      <>
        <Card anchor="section1" title="Section 1" visible />
        <Card anchor="section2" title="Section 2" visible />
      </>
    );

    const result = extractAnchors(children);

    expect(result).toEqual([
      { id: 'Anchor-section1', title: 'Section 1', children: undefined },
      { id: 'Anchor-section2', title: 'Section 2', children: undefined }
    ]);
  });

  test('should handle nested anchor structure', () => {
    const children = (
      <Card anchor="parent" title="Parent" visible>
        <Card anchor="child1" title="Child 1" visible />
        <Card anchor="child2" title="Child 2" visible>
          <Card anchor="grandchild" title="Grandchild" visible />
        </Card>
      </Card>
    );

    const result = extractAnchors(children);

    expect(result).toMatchSnapshot(); // Complex structure verification
  });

  test('should filter invisible anchors', () => {
    const children = (
      <>
        <Card anchor="visible" title="Visible" visible />
        <Card anchor="hidden" title="Hidden" visible={false} />
        <Card anchor="undefined" title="Undefined" />
      </>
    );

    const result = extractAnchors(children);

    expect(result).toHaveLength(2); // visible và undefined (default true)
  });

  test('should handle edge cases', () => {
    // Empty children
    expect(extractAnchors(null)).toEqual([]);
    expect(extractAnchors(undefined)).toEqual([]);
    expect(extractAnchors([])).toEqual([]);

    // Non-React elements
    expect(extractAnchors(['string', 42, null])).toEqual([]);

    // Missing anchor prop
    expect(extractAnchors(<div>No anchor</div>)).toEqual([]);
  });
});
```


**Integration Testing:**


```typescript
describe('AutoDirectory Integration', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeEach(() => {
    testEnv = createTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  test('should render complete directory structure', () => {
    const { getByRole, getByText } = render(
      <AutoDirectory>
        <Card anchor="intro" title="Introduction" visible>
          <Card anchor="overview" title="Overview" visible />
        </Card>
        <Card anchor="details" title="Details" visible />
      </AutoDirectory>
    );

    // Navigation should be present
    expect(getByRole('navigation')).toBeInTheDocument();

    // All sections should be clickable
    expect(getByText('Introduction')).toBeInTheDocument();
    expect(getByText('Overview')).toBeInTheDocument();
    expect(getByText('Details')).toBeInTheDocument();
  });

  test('should handle navigation clicks', async () => {
    const mockScrollIntoView = jest.fn();
    document.getElementById = jest.fn().mockReturnValue({
      scrollIntoView: mockScrollIntoView
    });

    const { getByText } = render(
      <AutoDirectory>
        <Card anchor="section1" title="Section 1" visible />
      </AutoDirectory>
    );

    // Click navigation item
    userEvent.click(getByText('Section 1'));

    await waitFor(() => {
      expect(document.getElementById).toHaveBeenCalledWith('Anchor-section1');
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  test('should update navigation khi content changes', () => {
    const { rerender, getByText, queryByText } = render(
      <AutoDirectory>
        <Card anchor="initial" title="Initial Section" visible />
      </AutoDirectory>
    );

    expect(getByText('Initial Section')).toBeInTheDocument();

    // Update content
    rerender(
      <AutoDirectory>
        <Card anchor="updated" title="Updated Section" visible />
      </AutoDirectory>
    );

    expect(queryByText('Initial Section')).not.toBeInTheDocument();
    expect(getByText('Updated Section')).toBeInTheDocument();
  });
});
```


⚙️ **Implementation Deep Dive:**


**Property-Based Testing:**


```typescript
import fc from 'fast-check';

// Generators cho test data
const anchorStringArb = fc.string().filter(s => s.length > 0 && s.length < 100);
const visibleArb = fc.boolean();

const cardPropsArb = fc.record({
  anchor: anchorStringArb,
  title: fc.option(anchorStringArb),
  visible: fc.option(visibleArb, { nil: undefined })
});

const nestedCardArb: fc.Arbitrary<ReactElement> = fc.letrec(tie => ({
  card: fc.record({
    props: cardPropsArb,
    children: fc.option(fc.array(tie('card'), { maxLength: 3 }))
  }).map(({ props, children }) =>
    <Card {...props}>{children}</Card>
  )
})).card;

describe('AutoDirectory Property-Based Tests', () => {
  test('extractAnchors should always return valid structure', () => {
    fc.assert(fc.property(
      fc.array(nestedCardArb, { maxLength: 10 }),
      (cards) => {
        const result = extractAnchors(cards);

        // Properties that should always hold
        expect(Array.isArray(result)).toBe(true);
        result.forEach(item => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('title');
          expect(typeof item.id).toBe('string');
          expect(typeof item.title).toBe('string');
        });
      }
    ));
  });

  test('injectId should preserve element count', () => {
    fc.assert(fc.property(
      fc.array(nestedCardArb, { maxLength: 5 }),
      (cards) => {
        const original = React.Children.toArray(cards);
        const injected = React.Children.toArray(injectId(cards));

        expect(injected.length).toBe(original.length);
      }
    ));
  });
});
```


**Performance Testing:**


```typescript
describe('AutoDirectory Performance', () => {
  test('should handle large directory structures', () => {
    const startTime = performance.now();

    // Generate large nested structure
    const largeStructure = Array.from({ length: 100 }, (_, i) => (
      <Card key={i} anchor={`section-${i}`} title={`Section ${i}`} visible>
        {Array.from({ length: 10 }, (_, j) => (
          <Card key={j} anchor={`section-${i}-${j}`} title={`Subsection ${j}`} visible />
        ))}
      </Card>
    ));

    const { container } = render(
      <AutoDirectory>{largeStructure}</AutoDirectory>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time
    expect(renderTime).toBeLessThan(100); // 100ms threshold

    // Should not have memory leaks
    expect(container.querySelectorAll('[id^="Anchor-"]')).toHaveLength(1100);
  });

  test('should not cause memory leaks on unmount', async () => {
    const { unmount } = render(
      <AutoDirectory>
        <Card anchor="test" title="Test" visible />
      </AutoDirectory>
    );

    // Force garbage collection (test environment only)
    if (global.gc) {
      global.gc();
    }

    const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;

    unmount();

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    if (global.gc) {
      global.gc();
    }

    const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Memory should not increase significantly
    expect(afterMemory - beforeMemory).toBeLessThan(1000000); // 1MB threshold
  });
});
```


**Visual Regression Testing:**


```typescript
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

describe('AutoDirectory Visual Tests', () => {
  test('should match visual snapshot', async () => {
    const { container } = render(
      <AutoDirectory>
        <Card anchor="visual-test" title="Visual Test Section" visible>
          <Card anchor="subsection" title="Subsection" visible />
        </Card>
      </AutoDirectory>
    );

    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(container).toMatchImageSnapshot({
      threshold: 0.1,
      failureThresholdType: 'percent'
    });
  });

  test('should handle responsive layouts', async () => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      global.innerWidth = viewport.width;
      global.innerHeight = viewport.height;
      global.dispatchEvent(new Event('resize'));

      const { container } = render(
        <AutoDirectory>
          <Card anchor="responsive-test" title="Responsive Test" visible />
        </AutoDirectory>
      );

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(container).toMatchImageSnapshot({
        customSnapshotIdentifier: `${viewport.width}x${viewport.height}`
      });
    }
  });
});
```


💭 **Principal's Perspective:**


*"Testing strategy ở Meta evolved significantly. Initially chúng tôi focus heavy vào unit tests, nhưng discovered integration tests catch more real bugs. Now chúng tôi have balanced pyramid: 40% unit, 40% integration, 20% e2e. Key insight: Test behavior, not implementation. Components should work correctly regardless của internal refactoring."*


### 12. Error Handling & Resilience


📖 **Defensive Programming - Bulletproof Components**


🌱 **Nguồn Gốc & Motivation:**


**Error Categories trong Production:**


1. **Runtime Errors**: Null reference exceptions, type errors
2. **State Inconsistencies**: Invalid component state transitions
3. **External Dependencies**: Network failures, library bugs
4. **User Input**: Malformed props, unexpected children
5. **Performance Issues**: Memory leaks, infinite loops
6. **Browser Compatibility**: API availability, behavior differences


**Real Production Failures:**


- **Facebook News Feed**: TOC component crashed khi user posted malformed content
- **Google Docs**: Memory leak trong large document navigation
- **Slack**: Thread navigation broke với circular message references


🔬 **Bản Chất & Mechanism:**


**Comprehensive Error Boundary:**


```typescript
interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

class DirectoryErrorBoundary extends React.Component
  {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    maxRetries?: number;
  },
  ErrorBoundaryState
> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enhancedError = {
      ...error,
      errorId: this.state.errorId,
      component: 'AutoDirectory',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to monitoring service
    this.logError(enhancedError, errorInfo);

    // Track error metrics
    this.trackErrorMetrics(error);

    // Auto-retry for transient errors
    if (this.isTransientError(error) && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  private isTransientError(error: Error): boolean {
    // Identify errors that might resolve on retry
    const transientPatterns = [
      /network/i,
      /timeout/i,
      /failed to fetch/i,
      /loading chunk failed/i
    ];

    return transientPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private scheduleRetry = () => {
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }, Math.pow(2, this.state.retryCount) * 1000); // Exponential backoff
  };

  private logError(error: any, errorInfo: ErrorInfo) {
    // Structured logging
    console.error('DirectoryErrorBoundary:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      context: {
        errorId: error.errorId,
        retryCount: error.retryCount,
        timestamp: error.timestamp
      }
    });

    // Send to external monitoring
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          errorBoundary: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          component: 'AutoDirectory',
          errorId: error.errorId
        }
      });
    }
  }

  private trackErrorMetrics(error: Error) {
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: 'AutoDirectory'
        }
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const retry = () => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined
        });
      };

      return this.props.fallback?.(this.state.error, retry) || (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={retry}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
        />
      );
    }

    return this.props.children;
  }
}
```


**Defensive Data Processing:**


```typescript
// Safe anchor extraction với comprehensive validation
function safeExtractAnchors(nodes: ReactNode): AnchorItem[] {
  try {
    // Validate input
    if (!nodes) {
      console.warn('extractAnchors: No children provided');
      return [];
    }

    const children = React.Children.toArray(nodes);
    if (children.length === 0) {
      return [];
    }

    const results: AnchorItem[] = [];
    const seenIds = new Set<string>();

    for (const child of children) {
      try {
        const item = processChild(child, seenIds);
        if (item) {
          results.push(item);
        }
      } catch (childError) {
        console.error('Error processing child element:', childError);
        // Continue processing other children
        continue;
      }
    }

    return results;

  } catch (error) {
    console.error('Fatal error in extractAnchors:', error);

    // Return safe fallback
    return [];
  }
}

function processChild(child: any, seenIds: Set<string>): AnchorItem | null {
  // Type validation
  if (!isValidElement(child)) {
    return null;
  }

  // Props validation
  const props = child.props || {};
  const { anchor, visible = true, title, children: sub } = props;

  // Business logic validation
  if (!visible) {
    return null;
  }

  if (!anchor || typeof anchor !== 'string') {
    console.warn('Invalid anchor prop:', anchor);
    return null;
  }

  // Sanitize anchor text
  const sanitizedAnchor = sanitizeAnchor(anchor);
  if (!sanitizedAnchor) {
    console.warn('Anchor sanitization failed:', anchor);
    return null;
  }

  const id = `Anchor-${sanitizedAnchor}`;

  // Check for duplicates
  if (seenIds.has(id)) {
    console.warn(`Duplicate anchor ID: ${id}`);
    return null;
  }

  seenIds.add(id);

  // Recursive processing với depth limit
  const childrenAnchors = sub ? safeExtractAnchorsWithDepth(sub, seenIds, 1) : [];

  return {
    title: title || anchor,
    id,
    children: childrenAnchors.length > 0 ? childrenAnchors : undefined,
  };
}

function safeExtractAnchorsWithDepth(
  nodes: ReactNode,
  seenIds: Set<string>,
  depth: number,
  maxDepth: number = 10
): AnchorItem[] {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    console.warn(`Maximum nesting depth (${maxDepth}) exceeded`);
    return [];
  }

  return safeExtractAnchors(nodes);
}

function sanitizeAnchor(anchor: string): string | null {
  try {
    // Remove potentially dangerous characters
    const sanitized = anchor
      .replace(/[<>'"&]/g, '') // XSS prevention
      .replace(/\s+/g, '-')     // Normalize spaces
      .replace(/[^\w-]/g, '')   // Remove special chars
      .toLowerCase()
      .slice(0, 100);           // Length limit

    return sanitized || null;
  } catch (error) {
    console.error('Anchor sanitization error:', error);
    return null;
  }
}
```


⚙️ **Implementation Deep Dive:**


**Circuit Breaker Pattern:**


```typescript
class ComponentCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private monitor?: (state: string, error?: Error) => void
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.monitor?.('HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }

  private recordFailure(error: Error) {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.monitor?.('OPEN', error);
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.monitor?.('CLOSED');
  }
}

// Usage trong AutoDirectory
const directoryCircuitBreaker = new ComponentCircuitBreaker(3, 30000, (state, error) => {
  console.log(`Directory circuit breaker: ${state}`, error);
});

const ResilientAutoDirectory: FC<DirectoryProps> = (props) => {
  const [isHealthy, setIsHealthy] = useState(true);

  const safeRender = useCallback(async () => {
    try {
      return await directoryCircuitBreaker.execute(async () => {
        // Potentially failing operations
        const tree = extractAnchors(props.children);
        const injectedChildren = injectId(props.children);

        return { tree, injectedChildren };
      });
    } catch (error) {
      setIsHealthy(false);
      throw error;
    }
  }, [props.children]);

  if (!isHealthy) {
    return <DirectoryFallback onReset={() => setIsHealthy(true)} />;
  }

  return (
    <DirectoryErrorBoundary
      onError={() => setIsHealthy(false)}
      fallback={(error, retry) => (
        <DirectoryFallback
          error={error}
          onReset={() => {
            setIsHealthy(true);
            retry();
          }}
        />
      )}
    >
      <Suspense fallback={<DirectoryLoadingSkeleton />}>
        <AutoDirectoryCore {...props} />
      </Suspense>
    </DirectoryErrorBoundary>
  );
};
```


**Graceful Degradation:**


```typescript
// Feature detection và fallback
const useFeatureDetection = () => {
  const [features, setFeatures] = useState({
    intersectionObserver: false,
    smoothScroll: false,
    cssScrollBehavior: false,
    requestAnimationFrame: false
  });

  useEffect(() => {
    setFeatures({
      intersectionObserver: 'IntersectionObserver' in window,
      smoothScroll: 'scrollBehavior' in document.documentElement.style,
      cssScrollBehavior: CSS.supports('scroll-behavior', 'smooth'),
      requestAnimationFrame: 'requestAnimationFrame' in window
    });
  }, []);

  return features;
};

const AdaptiveAutoDirectory: FC<DirectoryProps> = (props) => {
  const features = useFeatureDetection();

  // Choose implementation based on available features
  const NavigationComponent = useMemo(() => {
    if (features.intersectionObserver && features.smoothScroll) {
      return ModernDirectoryNavigation;
    } else if (features.smoothScroll) {
      return StandardDirectoryNavigation;
    } else {
      return LegacyDirectoryNavigation;
    }
  }, [features]);

  return (
    <DirectoryProvider>
      <NavigationComponent {...props} />
    </DirectoryProvider>
  );
};

// Fallback implementations
const LegacyDirectoryNavigation: FC<DirectoryProps> = ({ children }) => {
  const handleClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault();

    // Fallback scroll without smooth behavior
    const element = document.getElementById(href.slice(1));
    if (element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top;
      window.scrollTo(0, scrollTop);
    }
  }, []);

  return (
    <div>
      <div>{injectId(children)}</div>
      <nav>
        <SimpleAnchorList onItemClick={handleClick} />
      </nav>
    </div>
  );
};
```


💭 **Principal's Perspective:**


*"Error handling ở Google không chỉ là technical challenge - nó là user experience priority. Mỗi error có potential impact millions of users. Chúng tôi learned: Fail fast trong development, fail gracefully trong production. Key metrics: Time to recovery, user impact scope, và prevention effectiveness."*


### 13. Monitoring & Observability


📖 **Production Monitoring - Visibility into Component Health**


🌱 **Nguồn Gốc & Motivation:**


**Why Monitoring Matters:**


- **User Experience**: Detect performance degradation before users complain
- **Business Impact**: Component failures can affect conversion rates
- **Debugging**: Reproduce và fix issues faster với detailed telemetry
- **Capacity Planning**: Understand usage patterns để optimize resources
- **Compliance**: Meet SLA requirements với proactive monitoring


**Key Metrics Categories:**


1. **Performance Metrics**: Render time, scroll performance, memory usage
2. **Functional Metrics**: Navigation success rate, error frequency
3. **User Experience**: Interaction latency, accessibility usage
4. **Business Metrics**: Feature adoption, user engagement


🔬 **Bản Chất & Mechanism:**


**Comprehensive Telemetry System:**


```typescript
interface DirectoryTelemetry {
  // Performance metrics
  renderTime: number;
  treeBuildTime: number;
  navigationLatency: number;
  memoryUsage: number;

  // Functional metrics
  navigationSuccessRate: number;
  errorRate: number;
  retryCount: number;

  // Usage metrics
  sectionsCount: number;
  maxDepth: number;
  userInteractions: number;

  // Context
  timestamp: number;
  sessionId: string;
  userId?: string;
  viewport: { width: number; height: number };
  userAgent: string;
}

class DirectoryMonitor {
  private metrics: Partial<DirectoryTelemetry> = {};
  private startTime = 0;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(
    private config: {
      sampleRate: number;
      endpoint?: string;
      bufferSize: number;
    }
  ) {
    this.initializeObservers();
  }

  startRender() {
    this.startTime = performance.now();
    this.metrics.timestamp = Date.now();
    this.metrics.sessionId = getSessionId();
    this.metrics.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  endRender() {
    this.metrics.renderTime = performance.now() - this.startTime;
    this.reportMetrics();
  }

  recordNavigation(targetId: string, success: boolean, latency: number) {
    // Update navigation metrics
    this.metrics.navigationLatency = latency;

    // Track success rate
    const currentRate = this.metrics.navigationSuccessRate || 1;
    this.metrics.navigationSuccessRate = success
      ? Math.min(currentRate + 0.1, 1)
      : Math.max(currentRate - 0.1, 0);

    // Custom event for detailed analysis
    this.track('directory_navigation', {
      targetId,
      success,
      latency,
      timestamp: Date.now()
    });
  }

  recordError(error: Error, context: any) {
    this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;

    this.track('directory_error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: Date.now()
    });
  }

  recordPerformanceIssue(type: string, value: number, threshold: number) {
    if (value > threshold) {
      this.track('directory_performance_issue', {
        type,
        value,
        threshold,
        severity: value > threshold * 2 ? 'high' : 'medium',
        timestamp: Date.now()
      });
    }
  }

  private initializeObservers() {
    // Memory usage observer
    if ('memory' in performance) {
      const memoryObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'measure') {
            this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
          }
        });
      });

      memoryObserver.observe({ entryTypes: ['measure'] });
      this.observers.set('memory', memoryObserver);
    }

    // Long task observer
    if ('PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordPerformanceIssue('long_task', entry.duration, 50);
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    }
  }

  private track(eventName: string, properties: any) {
    // Sample based on configuration
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    const event = {
      event: eventName,
      properties: {
        ...properties,
        component: 'AutoDirectory',
        version: '1.0.0'
      },
      timestamp: Date.now()
    };

    // Send to analytics service
    this.sendToAnalytics(event);
  }

  private sendToAnalytics(event: any) {
    // Buffer events để batch send
    if (!this.config.endpoint) {
      console.log('Directory Analytics:', event);
      return;
    }

    // Use Navigator.sendBeacon cho reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        this.config.endpoint,
        JSON.stringify(event)
      );
    } else {
      // Fallback to fetch
      fetch(this.config.endpoint, {
        method: 'POST',
        body: JSON.stringify(event),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(error => {
        console.error('Failed to send analytics:', error);
      });
    }
  }

  private reportMetrics() {
    // Send complete metrics
    this.track('directory_metrics', this.metrics);

    // Reset for next measurement
    this.metrics = {};
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
```


**Real User Monitoring (RUM):**


```typescript
// Hook cho automatic monitoring
const useDirectoryMonitoring = (enabled = true) => {
  const monitor = useRef<DirectoryMonitor>();
  const [performanceData, setPerformanceData] = useState<any>({});

  useEffect(() => {
    if (!enabled) return;

    monitor.current = new DirectoryMonitor({
      sampleRate: 0.1, // 10% sampling
      endpoint: '/api/analytics/directory',
      bufferSize: 50
    });

    return () => {
      monitor.current?.destroy();
    };
  }, [enabled]);

  const trackRender = useCallback((renderFn: () => void) => {
    if (!monitor.current) return renderFn();

    monitor.current.startRender();
    const result = renderFn();
    monitor.current.endRender();

    return result;
  }, []);

  const trackNavigation = useCallback(async (targetId: string) => {
    if (!monitor.current) return;

    const startTime = performance.now();
    const success = await performNavigation(targetId);
    const latency = performance.now() - startTime;

    monitor.current.recordNavigation(targetId, success, latency);
  }, []);

  const trackError = useCallback((error: Error, context?: any) => {
    monitor.current?.recordError(error, context);
  }, []);

  return {
    trackRender,
    trackNavigation,
    trackError,
    performanceData
  };
};

// Usage trong component
const MonitoredAutoDirectory: FC<DirectoryProps> = (props) => {
  const { trackRender, trackNavigation, trackError } = useDirectoryMonitoring();

  const renderContent = useCallback(() => {
    try {
      return trackRender(() => {
        const tree = extractAnchors(props.children);
        const injectedChildren = injectId(props.children);
        return { tree, injectedChildren };
      });
    } catch (error) {
      trackError(error as Error, { phase: 'render' });
      throw error;
    }
  }, [props.children, trackRender, trackError]);

  const handleNavigation = useCallback(async (targetId: string) => {
    try {
      await trackNavigation(targetId);
    } catch (error) {
      trackError(error as Error, { phase: 'navigation', targetId });
    }
  }, [trackNavigation, trackError]);

  return (
    <DirectoryProvider onNavigate={handleNavigation}>
      <AutoDirectoryCore {...props} />
    </DirectoryProvider>
  );
};
```


⚙️ **Implementation Deep Dive:**


**Advanced Performance Monitoring:**


```typescript
// Web Vitals integration
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class DirectoryWebVitals {
  private vitals: Map<string, number> = new Map();

  constructor(private onVital: (name: string, value: number) => void) {
    this.initializeVitals();
  }

  private initializeVitals() {
    // Core Web Vitals
    getCLS((metric) => {
      this.vitals.set('CLS', metric.value);
      this.onVital('CLS', metric.value);
    });

    getFID((metric) => {
      this.vitals.set('FID', metric.value);
      this.onVital('FID', metric.value);
    });

    getLCP((metric) => {
      this.vitals.set('LCP', metric.value);
      this.onVital('LCP', metric.value);
    });

    // Additional metrics
    getFCP((metric) => {
      this.vitals.set('FCP', metric.value);
      this.onVital('FCP', metric.value);
    });

    getTTFB((metric) => {
      this.vitals.set('TTFB', metric.value);
      this.onVital('TTFB', metric.value);
    });
  }

  getVitals() {
    return Object.fromEntries(this.vitals);
  }
}

// Custom performance observer cho Directory-specific metrics
class DirectoryPerformanceObserver {
  private observer?: PerformanceObserver;
  private metrics: Map<string, number[]> = new Map();

  start() {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.name.startsWith('directory-')) {
          const metricName = entry.name.replace('directory-', '');
          const values = this.metrics.get(metricName) || [];
          values.push(entry.duration);
          this.metrics.set(metricName, values);
        }
      });
    });

    this.observer.observe({ entryTypes: ['measure'] });
  }

  measure(name: string, startMark: string, endMark: string) {
    try {
      performance.measure(`directory-${name}`, startMark, endMark);
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error);
    }
  }

  mark(name: string) {
    try {
      performance.mark(`directory-${name}`);
    } catch (error) {
      console.warn(`Failed to mark ${name}:`, error);
    }
  }

  getMetrics() {
    const result: Record<string, any> = {};

    this.metrics.forEach((values, name) => {
      result[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      };
    });

    return result;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  stop() {
    this.observer?.disconnect();
  }
}
```


**Alerting System:**


```typescript
interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  value: number;
  timestamp: number;
}

class DirectoryAlerting {
  private thresholds = {
    renderTime: { high: 100, critical: 500 },
    errorRate: { medium: 0.05, high: 0.1, critical: 0.2 },
    navigationLatency: { high: 1000, critical: 3000 },
    memoryUsage: { high: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 }
  };

  private alerts: Map<string, Alert> = new Map();

  checkMetric(name: keyof typeof this.thresholds, value: number) {
    const threshold = this.thresholds[name];
    let severity: Alert['severity'] | null = null;
    let thresholdValue = 0;

    if (value >= threshold.critical) {
      severity = 'critical';
      thresholdValue = threshold.critical;
    } else if (value >= threshold.high) {
      severity = 'high';
      thresholdValue = threshold.high;
    } else if ('medium' in threshold && value >= threshold.medium) {
      severity = 'medium';
      thresholdValue = threshold.medium;
    }

    if (severity) {
      this.createAlert(name, severity, value, thresholdValue);
    } else {
      this.resolveAlert(name);
    }
  }

  private createAlert(
    metric: string,
    severity: Alert['severity'],
    value: number,
    threshold: number
  ) {
    const alertId = `directory-${metric}`;
    const existingAlert = this.alerts.get(alertId);

    // Only create new alert if severity increased or no existing alert
    if (!existingAlert || this.getSeverityLevel(severity) > this.getSeverityLevel(existingAlert.severity)) {
      const alert: Alert = {
        id: alertId,
        severity,
        message: `Directory ${metric} exceeded threshold: ${value} > ${threshold}`,
        threshold,
        value,
        timestamp: Date.now()
      };

      this.alerts.set(alertId, alert);
      this.sendAlert(alert);
    }
  }

  private resolveAlert(metric: string) {
    const alertId = `directory-${metric}`;
    if (this.alerts.has(alertId)) {
      this.alerts.delete(alertId);
      this.sendResolution(alertId);
    }
  }

  private getSeverityLevel(severity: Alert['severity']): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity];
  }

  private sendAlert(alert: Alert) {
    // Send to monitoring service
    console.warn('Directory Alert:', alert);

    // Integration với alerting systems
    if (alert.severity === 'critical') {
      this.sendToPagerDuty(alert);
    }

    this.sendToSlack(alert);
  }

  private sendResolution(alertId: string) {
    console.info(`Directory Alert Resolved: ${alertId}`);
  }

  private sendToPagerDuty(alert: Alert) {
    // PagerDuty integration cho critical alerts
    if (typeof window !== 'undefined' && window.PagerDuty) {
      window.PagerDuty.trigger({
        routing_key: 'directory-critical',
        event_action: 'trigger',
        payload: {
          summary: alert.message,
          severity: alert.severity,
          source: 'AutoDirectory Component'
        }
      });
    }
  }

  private sendToSlack(alert: Alert) {
    // Slack webhook integration
    const webhook = process.env.REACT_APP_SLACK_WEBHOOK;
    if (webhook) {
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.message}`,
          attachments: [{
            color: this.getSeverityColor(alert.severity),
            fields: [
              { title: 'Metric', value: alert.id, short: true },
              { title: 'Value', value: alert.value.toString(), short: true },
              { title: 'Threshold', value: alert.threshold.toString(), short: true },
              { title: 'Severity', value: alert.severity, short: true }
            ]
          }]
        })
      });
    }
  }

  private getSeverityColor(severity: Alert['severity']): string {
    const colors = {
      low: '#36a64f',
      medium: '#ffcc00',
      high: '#ff9900',
      critical: '#ff0000'
    };
    return colors[severity];
  }
}
```


💭 **Principal's Perspective:**


*"Monitoring ở Netflix taught us: You can't improve what you don't measure. But measuring everything is noise. Key insight: Monitor user-impacting metrics first, then drill down to technical metrics. Our directory component monitoring focuses on: Time to interactive, navigation success rate, và error impact scope. Technical metrics như memory usage are important, but business metrics drive priorities."*


## KẾT LUẬN: LESSONS LEARNED & BEST PRACTICES


### 14. Architecture Decision Records (ADRs)


📖 **Decision Documentation - Why We Chose This Approach**


Sau khi phân tích comprehensive bài viết về "smart" catalog component, đây là key architectural decisions và rationale:


**ADR-001: Component Pattern Selection**


- **Decision**: Chọn Compound Component pattern over render props hay hook-only approach
- **Rationale**: Provides optimal balance giữa flexibility và ease of use
- **Trade-offs**: Slightly more complex implementation, nhưng better developer experience
- **Status**: Accepted


**ADR-002: State Management Strategy**


- **Decision**: Context-based local state over Redux global state
- **Rationale**: TOC state is component-scoped, không cần global persistence
- **Trade-offs**: Có thể limit cross-component communication
- **Status**: Accepted


**ADR-003: Performance Strategy**


- **Decision**: React.memo + selective re-rendering over virtualization
- **Rationale**: Most documents có reasonable section counts (<100)
- **Trade-offs**: May need virtualization cho extremely large documents
- **Status**: Under Review


### 15. Principal Engineer Perspective - Strategic Insights


💭 **What Would I Do Differently at MAANG Scale:**


**1. Architecture Decisions:**


- **Micro-frontend Consideration**: Ở scale của Meta hay Google, TOC component có thể need to work across different applications
- **Cross-team Standardization**: Establish component design system để prevent fragmentation
- **API Design**: Create stable interfaces để allow different implementations


**2. Performance at Scale:**


- **Bundle Splitting**: TOC features should be code-split để not impact main bundle
- **CDN Strategy**: Component assets should be CDN-optimized với proper caching
- **Edge Computing**: Consider server-side rendering cho SEO-critical pages


**3. Team Dynamics:**


- **Component Ownership**: Clear ownership model với designated maintainers
- **Documentation Strategy**: Living documentation với interactive examples
- **Version Management**: Semantic versioning với deprecation policies


**4. Long-term Maintainability:**


- **Technology Evolution**: Design cho future React features (Concurrent Mode, Suspense)
- **Legacy Support**: Graceful degradation cho older browsers
- **Migration Paths**: Clear upgrade paths khi major changes needed


### 16. Learning Checklist - Verify Your Understanding


✅ **Foundation Level Mastery:**


- Understand React.Children API và use cases
- Can implement isValidElement type guards
- Know cloneElement pattern và when to use it
- Understand tree traversal algorithms


✅ **Senior Level Mastery:**


- Can design compound components from scratch
- Implement context-based state management
- Handle performance optimization strategies
- Write comprehensive test suites


✅ **Principal Level Mastery:**


- Make architectural decisions với clear trade-offs
- Design for scale và maintainability
- Implement monitoring và observability
- Lead technical discussions về component design


### 17. Interview Preparation - Common Questions


**Junior to Mid-level Questions:**


1. "Explain React.Children.map vs Array.map differences"
2. "When would you use cloneElement over regular props?"
3. "How do you handle recursive component structures?"


**Senior Level Questions:**


1. "Design a TOC component that can handle 1000+ sections"
2. "How would you test a component với complex nested structures?"
3. "Explain different approaches để component composition"


**Principal Level Questions:**


1. "How would you architect a component system cho multiple teams?"
2. "Design monitoring strategy cho component library"
3. "Make architectural trade-offs between flexibility và performance"


### 18. Final Thoughts - The Journey Continues


Bài viết original là một excellent starting point, nhưng production-ready components require much deeper thinking. Key takeaways:


**1. Think Beyond the Code:**


- User experience is paramount
- Performance affects business metrics
- Accessibility is not optional
- Monitoring provides valuable insights


**2. Plan for Evolution:**


- Requirements will change
- Teams will grow
- Technology will evolve
- Scale will increase


**3. Focus on Fundamentals:**


- Solid computer science principles
- Clean architecture patterns
- Comprehensive testing
- Clear documentation


**4. Learn from the Community:**


- Study open-source implementations
- Participate trong design discussions
- Share knowledge với team members
- Stay updated với latest patterns


💭 **Personal Reflection:**


*"Building production-ready components ở MAANG level đã taught me rằng technical excellence is just the foundation. Real impact comes từ understanding user needs, business constraints, và team dynamics. The journey từ 'working code' đến 'production system' is where principal engineers add most value."*


**Continue Learning:**


- Follow React core team discussions
- Study component libraries source code
- Practice architectural thinking
- Build real-world projects


Remember: Great components are not just about clever code - they're about solving real problems cho real users at real scale. Keep building, keep learning, keep improving!


---


*Bài phân tích này demonstrates journey từ simple requirement ("add a table of contents") đến comprehensive production solution. Every line of code has purpose, every architectural decision has rationale, và every optimization serves user experience. That's the mindset của Principal Engineer.*
