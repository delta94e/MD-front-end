# Technical Interview Simulation Design

## Claude


I'll conduct a comprehensive technical interview simulation for the Senior Frontend Engineer position at NAB, focusing on JavaScript array sorting and React ecosystem technologies. Let me create this detailed interview scenario:


I've created a comprehensive **NAB Senior Frontend Engineer Technical Interview Simulation** that covers all the aspects you outlined in your prompt. This simulation includes:


## 🎯 Interview Structure Covered


- **Part 1**: Warm-up & Introduction (15 minutes)
- **Part 2**: Deep Technical Discussion (25 minutes)
- **Part 3**: Live Coding Challenge (20 minutes)


## 🔧 Technical Focus Areas


- **JavaScript Array Sorting**: From basic concepts to enterprise-scale optimization
- **React Ecosystem**: React Query, Zustand, TypeScript, performance patterns
- **Financial Applications**: Trading dashboards, real-time data, calculation engines
- **Testing Strategy**: Unit, integration, property-based, and E2E testing for financial systems


## 💡 Key Highlights


- **Production-quality code examples** with TypeScript
- **Performance optimization** for large datasets (virtual scrolling, Web Workers)
- **Real-time data management** with WebSocket simulation
- **Financial calculation engines** with intelligent caching
- **Comprehensive testing approaches** for regulatory compliance
- **Mobile optimization** and accessibility considerations


## 🏆 NAB-Specific Excellence


- **Enterprise-scale challenges** (millions of users, high-frequency data)
- **Financial domain expertise** (risk calculations, trading systems)
- **Regulatory compliance** considerations
- **System architecture** for banking applications


The simulation demonstrates the **depth of technical knowledge**, **problem-solving approach**, and **communication skills** expected for a senior-level position at NAB, with realistic dialogue and production-ready solutions throughout.


Would you like me to expand on any particular section or adjust the focus to emphasize specific technologies or challenges?


## Claude


# NAB Senior Frontend Engineer Technical Interview Simulation


## Interview Panel


**Interviewer**: Sarah Chen - Principal Frontend Engineer at NAB (10+ years experience)

**Candidate**: Alex Thompson - Senior Frontend Developer with 6+ years experience


---


## Part 1: Warm-up & Introduction (15 minutes)


**Interviewer**: Good morning Alex! Thanks for joining us today. I'm Sarah, Principal Frontend Engineer here at NAB. Before we dive into the technical discussion, could you tell me about your journey as a frontend developer and what attracted you to this Senior Frontend Engineer role at NAB?


**Candidate**: Good morning Sarah! Thank you for having me. I've been passionate about frontend development for over 6 years now. I started my career working with vanilla JavaScript and jQuery, but quickly moved into the React ecosystem when I realized its power for building scalable applications.


What really attracted me to NAB is your commitment to **digital transformation in banking** and the scale of your applications. From my research, I understand NAB serves millions of customers, and the frontend engineering challenges around **performance, accessibility, and user experience** at that scale are exactly what I'm passionate about solving.


I've spent the last 3 years at a fintech startup where I led the frontend architecture decisions, implementing React with Next.js, managing complex state with Redux and Zustand, and optimizing data fetching with React Query and SWR. The intersection of **financial services and cutting-edge frontend technology** is where I thrive.


**Interviewer**: That's great to hear! At NAB, we definitely face unique challenges with our scale. Can you tell me about a particularly complex frontend challenge you've solved recently that you're proud of?


**Candidate**: Absolutely! One of the most challenging projects I worked on was rebuilding our trading platform's **real-time dashboard**. We had about 50,000 concurrent users monitoring live market data, and the existing implementation was causing significant performance issues.


The core challenge was **efficiently managing and displaying thousands of rapidly updating data points** without blocking the UI thread. Here's how I approached it:


1. **Data Architecture**: I implemented a hybrid approach using **React Query for server state** and **Zustand for client state**. React Query handled the WebSocket connections and data caching, while Zustand managed UI state like filters and user preferences.
2. **Performance Optimization**: I used **React.memo and useMemo extensively** to prevent unnecessary re-renders. For the most critical components, I implemented **virtual scrolling** to handle large datasets efficiently.
3. **Smart Batching**: Instead of updating individual components on every WebSocket message, I implemented a **batching mechanism** that collected updates over 16ms intervals and applied them in a single render cycle.


The results were significant: **CPU usage dropped by 60%**, memory consumption reduced by 40%, and we eliminated the UI freezing issues completely. The solution handled 10x more concurrent data streams than the previous implementation.


**Interviewer**: Impressive! I can see you understand the performance considerations that are crucial for our applications. Let's dive deeper into some technical aspects.


---


## Part 2: Deep Technical Discussion (25 minutes)


### JavaScript Array Sorting & Data Management


**Interviewer**: Given your experience with data-heavy applications, I'd like to explore your understanding of JavaScript array sorting. We often deal with complex datasets at NAB - customer transactions, account balances, trading data. Can you walk me through the challenges and considerations when implementing efficient sorting in a React application?


**Candidate**: Excellent question! Array sorting in production React applications, especially in financial services, involves several critical considerations that go beyond basic `Array.sort()` usage.


Let me break this down into **key challenges and solutions**:


#### 1. Performance at Scale


```javascript
// Problematic approach for large datasets
const TransactionList = ({ transactions }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // This runs on every render - performance killer!
  const sortedTransactions = transactions.sort((a, b) => {
    return sortDirection === 'asc'
      ? a[sortField] - b[sortField]
      : b[sortField] - a[sortField];
  });

  return <div>{/* render logic */}</div>;
};
```


**The problem**: This approach sorts the entire array on every render, which is catastrophic for large datasets.


**Optimized solution**:


```javascript
const TransactionList = ({ transactions }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Memoized sorting with dependency tracking
  const sortedTransactions = useMemo(() => {
    // Create a copy to avoid mutating original data
    return [...transactions].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      // Handle different data types appropriately
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        const timeA = valueA.getTime();
        const timeB = valueB.getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // String comparison with proper locale support
      const result = String(valueA).localeCompare(String(valueB), 'en', {
        numeric: true,
        sensitivity: 'base'
      });

      return sortDirection === 'asc' ? result : -result;
    });
  }, [transactions, sortField, sortDirection]);

  return <div>{/* render logic */}</div>;
};
```


#### 2. Multi-Criteria Sorting for Financial Data


In banking applications, we often need **complex sorting logic**. For example, sorting transactions by priority (urgent > normal > low), then by amount, then by date:


```javascript
const useAdvancedSort = (data, sortCriteria) => {
  return useMemo(() => {
    return [...data].sort((a, b) => {
      for (const criterion of sortCriteria) {
        const { field, direction, type, priority } = criterion;

        let valueA = a[field];
        let valueB = b[field];

        // Handle priority mapping for business logic
        if (type === 'priority') {
          const priorityMap = { urgent: 3, normal: 2, low: 1 };
          valueA = priorityMap[valueA] || 0;
          valueB = priorityMap[valueB] || 0;
        }

        // Handle currency amounts with precision
        if (type === 'currency') {
          valueA = parseFloat(valueA) || 0;
          valueB = parseFloat(valueB) || 0;
        }

        if (valueA !== valueB) {
          const comparison = type === 'string'
            ? String(valueA).localeCompare(String(valueB))
            : valueA - valueB;

          return direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [data, sortCriteria]);
};

// Usage in component
const TransactionList = ({ transactions }) => {
  const sortCriteria = [
    { field: 'priority', direction: 'desc', type: 'priority' },
    { field: 'amount', direction: 'desc', type: 'currency' },
    { field: 'date', direction: 'desc', type: 'date' }
  ];

  const sortedTransactions = useAdvancedSort(transactions, sortCriteria);

  return <div>{/* render logic */}</div>;
};
```


#### 3. Integration with State Management


When dealing with **server state and sorting**, the approach differs significantly:


```javascript
// Using React Query with sorting
const useTransactions = (sortField, sortDirection) => {
  return useQuery({
    queryKey: ['transactions', sortField, sortDirection],
    queryFn: async () => {
      // Server-side sorting for initial data
      const response = await fetch(`/api/transactions?sort=${sortField}&order=${sortDirection}`);
      return response.json();
    },
    // Client-side sorting for real-time updates
    select: (data) => {
      if (!data.needsClientSort) return data.transactions;

      return [...data.transactions].sort((a, b) => {
        // Sorting logic here
      });
    },
    staleTime: 30000, // 30 seconds for financial data
  });
};

// Zustand store for complex sorting state
const useSortStore = create((set, get) => ({
  sortConfigs: [],
  addSortConfig: (config) => set((state) => ({
    sortConfigs: [...state.sortConfigs, config]
  })),
  removeSortConfig: (index) => set((state) => ({
    sortConfigs: state.sortConfigs.filter((_, i) => i !== index)
  })),
  applySorting: (data) => {
    const { sortConfigs } = get();
    return sortConfigs.reduce((sortedData, config) => {
      return sortedData.sort(/* sorting logic based on config */);
    }, [...data]);
  }
}));
```


**Interviewer**: Excellent breakdown! I particularly appreciate your consideration of **locale-aware string comparison** and **server-side vs client-side sorting trade-offs**. Let's dive deeper into performance. How would you handle sorting extremely large datasets - say 100,000+ transaction records that need to be searchable and sortable in real-time?


**Candidate**: Great question! Handling 100,000+ records requires a fundamentally different approach. You can't simply sort everything in memory on the client side. Here's my **multi-layered strategy**:


#### 1. Virtual Scrolling with Sorted Views


```javascript
import { FixedSizeList as List } from 'react-window';

const VirtualizedTransactionList = ({
  totalCount,
  sortField,
  sortDirection,
  onSortChange
}) => {
  // Only load what's visible + buffer
  const { data, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: ['transactions', sortField, sortDirection],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/transactions?page=${pageParam}&sort=${sortField}&order=${sortDirection}&limit=50`
      );
      return response.json();
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
  });

  // Flatten pages for virtual scrolling
  const items = useMemo(() =>
    data?.pages.flatMap(page => page.transactions) || [],
    [data]
  );

  const Row = useCallback(({ index, style }) => {
    const transaction = items[index];

    // Trigger pagination near the end
    if (index === items.length - 10) {
      fetchNextPage();
    }

    return (
      <div style={style}>
        <TransactionRow transaction={transaction} />
      </div>
    );
  }, [items, fetchNextPage]);

  return (
    <List
      height={600}
      itemCount={totalCount}
      itemSize={60}
      onItemsRendered={({ visibleStopIndex }) => {
        // Preload data as user scrolls
        if (visibleStopIndex > items.length - 20) {
          fetchNextPage();
        }
      }}
    >
      {Row}
    </List>
  );
};
```


#### 2. Hybrid Client-Server Sorting Strategy


```javascript
const useHybridSorting = (baseQuery, clientSortConfig) => {
  // Server handles initial sorting and pagination
  const serverData = useQuery({
    queryKey: ['transactions-server', baseQuery.sort, baseQuery.filters],
    queryFn: () => fetchTransactions(baseQuery),
  });

  // Client handles real-time updates and secondary sorting
  const { data: realtimeUpdates } = useQuery({
    queryKey: ['transactions-realtime'],
    queryFn: getRealtimeUpdates,
    refetchInterval: 5000, // 5 second polling
  });

  return useMemo(() => {
    if (!serverData.data) return [];

    let combinedData = [...serverData.data];

    // Apply real-time updates
    if (realtimeUpdates) {
      realtimeUpdates.forEach(update => {
        const index = combinedData.findIndex(item => item.id === update.id);
        if (index !== -1) {
          combinedData[index] = { ...combinedData[index], ...update };
        } else {
          combinedData.unshift(update); // New transactions at top
        }
      });
    }

    // Apply client-side secondary sorting
    if (clientSortConfig.secondarySort) {
      return combinedData.sort((a, b) => {
        // Primary sort is handled by server
        // Apply secondary sort criteria
        return compareBySecondaryRules(a, b, clientSortConfig.secondarySort);
      });
    }

    return combinedData;
  }, [serverData.data, realtimeUpdates, clientSortConfig]);
};
```


#### 3. Advanced Performance Optimization


```javascript
// Web Worker for heavy sorting operations
const useSortWorker = () => {
  const workerRef = useRef();

  useEffect(() => {
    workerRef.current = new Worker('/workers/sort-worker.js');
    return () => workerRef.current?.terminate();
  }, []);

  const sortInWorker = useCallback((data, sortConfig) => {
    return new Promise((resolve) => {
      workerRef.current.postMessage({ data, sortConfig });
      workerRef.current.onmessage = (e) => resolve(e.data);
    });
  }, []);

  return sortInWorker;
};

// sort-worker.js
self.onmessage = function(e) {
  const { data, sortConfig } = e.data;

  // Complex sorting logic runs in background thread
  const sorted = data.sort((a, b) => {
    // Implement sophisticated sorting algorithm
    return advancedSortComparison(a, b, sortConfig);
  });

  self.postMessage(sorted);
};

// Usage in component
const TransactionAnalytics = ({ rawData }) => {
  const sortInWorker = useSortWorker();
  const [sortedData, setSortedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleComplexSort = useCallback(async (sortConfig) => {
    setIsProcessing(true);
    try {
      const result = await sortInWorker(rawData, sortConfig);
      setSortedData(result);
    } finally {
      setIsProcessing(false);
    }
  }, [rawData, sortInWorker]);

  return (
    <div>
      {isProcessing && <LoadingSpinner />}
      <DataVisualization data={sortedData} />
    </div>
  );
};
```


#### 4. Caching Strategy for Sorted Views


```javascript
const useSortedDataCache = () => {
  const cache = useRef(new Map());

  const getCachedSort = useCallback((data, sortKey) => {
    const cacheKey = `${JSON.stringify(sortKey)}-${data.length}`;

    if (cache.current.has(cacheKey)) {
      return cache.current.get(cacheKey);
    }

    const sorted = performSort(data, sortKey);

    // Limit cache size to prevent memory issues
    if (cache.current.size > 10) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }

    cache.current.set(cacheKey, sorted);
    return sorted;
  }, []);

  return getCachedSort;
};
```


The key insight for **large-scale financial data** is that you need to **combine multiple strategies**: server-side sorting for the primary view, client-side optimization for interactions, virtual scrolling for rendering performance, and smart caching to avoid redundant computations.


**Interviewer**: Outstanding! Your approach shows deep understanding of both the technical challenges and the business requirements. I particularly like your **hybrid client-server strategy** and the use of **Web Workers for non-blocking operations**.


Now, let's talk about a specific challenge we face at NAB: **handling complex financial calculations while maintaining sort performance**. Imagine you need to sort a list of investment portfolios by calculated metrics like "risk-adjusted returns" or "portfolio beta" that require multiple mathematical operations. How would you approach this?


**Candidate**: This is a fascinating challenge that combines **computational complexity with data presentation performance**. In financial applications, calculated metrics often depend on multiple data sources and complex algorithms. Here's my comprehensive approach:


#### 1. Calculated Field Architecture


```javascript
// Define calculation strategies
const calculationStrategies = {
  riskAdjustedReturn: {
    dependencies: ['returns', 'volatility', 'riskFreeRate'],
    calculate: (portfolio) => {
      const { returns, volatility, riskFreeRate } = portfolio;
      return (returns - riskFreeRate) / volatility; // Sharpe ratio
    },
    cacheDuration: 300000, // 5 minutes for financial data
  },

  portfolioBeta: {
    dependencies: ['securities', 'marketData', 'correlations'],
    calculate: (portfolio) => {
      // Complex beta calculation
      return portfolio.securities.reduce((beta, security) => {
        const weight = security.allocation / 100;
        const securityBeta = calculateSecurityBeta(security, portfolio.marketData);
        return beta + (weight * securityBeta);
      }, 0);
    },
    cacheDuration: 600000, // 10 minutes
  },

  valueAtRisk: {
    dependencies: ['positions', 'correlationMatrix', 'volatilities'],
    calculate: (portfolio) => {
      // Monte Carlo simulation for VaR
      return monteCarloVaR(portfolio, { confidence: 0.95, timeHorizon: 1 });
    },
    cacheDuration: 1800000, // 30 minutes - expensive calculation
  }
};

// Calculation engine with intelligent caching
class PortfolioCalculationEngine {
  constructor() {
    this.cache = new Map();
    this.calculationQueue = [];
    this.isProcessing = false;
  }

  async calculateMetric(portfolio, metricName) {
    const strategy = calculationStrategies[metricName];
    if (!strategy) throw new Error(`Unknown metric: ${metricName}`);

    // Generate cache key based on dependencies
    const cacheKey = this.generateCacheKey(portfolio, strategy.dependencies, metricName);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < strategy.cacheDuration) {
        return cached.value;
      }
    }

    // Queue calculation if not in progress
    return this.queueCalculation(portfolio, metricName, strategy, cacheKey);
  }

  generateCacheKey(portfolio, dependencies, metricName) {
    const dependencyValues = dependencies.map(dep => {
      const value = this.getNestedValue(portfolio, dep);
      return typeof value === 'object' ? JSON.stringify(value) : value;
    });

    return `${portfolio.id}-${metricName}-${hash(dependencyValues.join(':'))}`;
  }

  async queueCalculation(portfolio, metricName, strategy, cacheKey) {
    return new Promise((resolve, reject) => {
      this.calculationQueue.push({
        portfolio,
        metricName,
        strategy,
        cacheKey,
        resolve,
        reject
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    this.isProcessing = true;

    while (this.calculationQueue.length > 0) {
      const batch = this.calculationQueue.splice(0, 5); // Process in batches

      await Promise.all(batch.map(async (item) => {
        try {
          const result = await this.executeCalculation(item);
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        }
      }));

      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this.isProcessing = false;
  }

  async executeCalculation({ portfolio, strategy, cacheKey }) {
    const result = await strategy.calculate(portfolio);

    // Cache the result
    this.cache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    this.cleanupCache();

    return result;
  }

  cleanupCache() {
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20% of entries
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }
}
```


#### 2. React Integration with Suspense for Calculated Fields


```javascript
const calculationEngine = new PortfolioCalculationEngine();

// Hook for calculated metrics with suspense support
const useCalculatedMetric = (portfolio, metricName) => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    calculationEngine.calculateMetric(portfolio, metricName)
      .then(value => {
        if (!isCancelled) {
          setResult(value);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!isCancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [portfolio.id, metricName, portfolio.lastUpdated]);

  return { result, isLoading, error };
};

// Portfolio row component with calculated fields
const PortfolioRow = ({ portfolio, sortField }) => {
  const sharpeRatio = useCalculatedMetric(portfolio, 'riskAdjustedReturn');
  const beta = useCalculatedMetric(portfolio, 'portfolioBeta');
  const var95 = useCalculatedMetric(portfolio, 'valueAtRisk');

  return (
    <tr>
      <td>{portfolio.name}</td>
      <td>{portfolio.value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}</td>
      <td>
        {sharpeRatio.isLoading ? (
          <CalculationSpinner />
        ) : sharpeRatio.error ? (
          <ErrorIndicator />
        ) : (
          <span className={sortField === 'riskAdjustedReturn' ? 'highlighted' : ''}>
            {sharpeRatio.result?.toFixed(3)}
          </span>
        )}
      </td>
      <td>
        {beta.isLoading ? <CalculationSpinner /> : beta.result?.toFixed(2)}
      </td>
      <td>
        {var95.isLoading ? <CalculationSpinner /> :
         `${(var95.result?.value * 100).toFixed(1)}%`}
      </td>
    </tr>
  );
};
```


#### 3. Smart Sorting with Calculated Fields


```javascript
const usePortfolioSorting = (portfolios, sortConfig) => {
  const [sortedPortfolios, setSortedPortfolios] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const calculationProgress = useRef(0);

  const sortWithCalculatedFields = useCallback(async (portfolios, sortField, direction) => {
    setIsCalculating(true);
    calculationProgress.current = 0;

    try {
      // Pre-calculate all required metrics
      const portfoliosWithMetrics = await Promise.all(
        portfolios.map(async (portfolio, index) => {
          let calculatedValue;

          if (calculationStrategies[sortField]) {
            calculatedValue = await calculationEngine.calculateMetric(portfolio, sortField);
          } else {
            calculatedValue = portfolio[sortField];
          }

          // Update progress
          calculationProgress.current = ((index + 1) / portfolios.length) * 100;

          return {
            ...portfolio,
            [sortField]: calculatedValue
          };
        })
      );

      // Sort with calculated values
      const sorted = portfoliosWithMetrics.sort((a, b) => {
        const valueA = a[sortField];
        const valueB = b[sortField];

        if (valueA === null || valueA === undefined) return 1;
        if (valueB === null || valueB === undefined) return -1;

        const comparison = typeof valueA === 'number'
          ? valueA - valueB
          : String(valueA).localeCompare(String(valueB));

        return direction === 'asc' ? comparison : -comparison;
      });

      setSortedPortfolios(sorted);
    } catch (error) {
      console.error('Sorting calculation failed:', error);
      // Fallback to sorting without calculated fields
      setSortedPortfolios([...portfolios].sort((a, b) => {
        return direction === 'asc'
          ? String(a.name).localeCompare(String(b.name))
          : String(b.name).localeCompare(String(a.name));
      }));
    } finally {
      setIsCalculating(false);
      calculationProgress.current = 0;
    }
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) {
      sortWithCalculatedFields(portfolios, sortConfig.field, sortConfig.direction);
    }
  }, [portfolios, sortConfig, sortWithCalculatedFields]);

  return {
    sortedPortfolios,
    isCalculating,
    progress: calculationProgress.current
  };
};
```


#### 4. Progressive Enhancement for Sort Performance


```javascript
const PortfolioList = ({ portfolios }) => {
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const { sortedPortfolios, isCalculating, progress } = usePortfolioSorting(portfolios, sortConfig);

  const handleSort = useCallback((field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Progressive enhancement: show immediate feedback
  const getColumnClass = (field) => {
    if (sortConfig.field === field) {
      return `sorted ${sortConfig.direction}`;
    }
    return 'sortable';
  };

  return (
    <div className="portfolio-list">
      {isCalculating && (
        <div className="calculation-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>Calculating metrics... {progress.toFixed(1)}%</span>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th
              className={getColumnClass('name')}
              onClick={() => handleSort('name')}
            >
              Portfolio Name
            </th>
            <th
              className={getColumnClass('value')}
              onClick={() => handleSort('value')}
            >
              Value (AUD)
            </th>
            <th
              className={getColumnClass('riskAdjustedReturn')}
              onClick={() => handleSort('riskAdjustedReturn')}
              title="Sharpe Ratio - calculated metric"
            >
              Risk-Adjusted Return
              {calculationStrategies.riskAdjustedReturn && (
                <CalculationIndicator />
              )}
            </th>
            <th
              className={getColumnClass('portfolioBeta')}
              onClick={() => handleSort('portfolioBeta')}
            >
              Beta
            </th>
            <th
              className={getColumnClass('valueAtRisk')}
              onClick={() => handleSort('valueAtRisk')}
            >
              VaR (95%)
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPortfolios.map(portfolio => (
            <PortfolioRow
              key={portfolio.id}
              portfolio={portfolio}
              sortField={sortConfig.field}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
```


The key principles for **financial calculation sorting** are:


1. **Intelligent Caching**: Cache expensive calculations with appropriate TTL based on data volatility
2. **Progressive Calculation**: Show immediate feedback while calculations process in background
3. **Batch Processing**: Process multiple calculations together to optimize resource usage
4. **Error Resilience**: Graceful fallbacks when calculations fail
5. **User Feedback**: Clear indicators when sorting involves calculated fields


This approach ensures that **complex financial metrics don't block the user interface** while providing accurate, up-to-date sorting capabilities.


**Interviewer**: Brilliant! Your solution demonstrates excellent understanding of both the **computational complexity** and **user experience challenges** in financial applications. The **progressive calculation approach** and **intelligent caching strategy** are exactly the kind of thinking we need at NAB.


Let me ask you one more theoretical question before we move to the coding challenge: How would you approach **testing** these complex sorting and calculation systems, especially when dealing with financial data where accuracy is paramount?


**Candidate**: Testing financial calculation and sorting systems requires a **multi-layered approach** that ensures both **functional correctness** and **performance reliability**. Let me break down my comprehensive testing strategy:


#### 1. Unit Testing for Calculation Logic


```javascript
// calculation-engine.test.js
import { PortfolioCalculationEngine, calculationStrategies } from '../PortfolioCalculationEngine';

describe('PortfolioCalculationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new PortfolioCalculationEngine();
  });

  describe('Sharpe Ratio Calculation', () => {
    it('should calculate correct Sharpe ratio for positive returns', () => {
      const portfolio = {
        id: 'test-1',
        returns: 0.12,     // 12% return
        volatility: 0.15,  // 15% volatility
        riskFreeRate: 0.02 // 2% risk-free rate
      };

      const result = calculationStrategies.riskAdjustedReturn.calculate(portfolio);

      // Expected: (0.12 - 0.02) / 0.15 = 0.667
      expect(result).toBeCloseTo(0.667, 3);
    });

    it('should handle negative Sharpe ratios correctly', () => {
      const portfolio = {
        id: 'test-2',
        returns: 0.01,     // 1% return (below risk-free rate)
        volatility: 0.20,  // 20% volatility
        riskFreeRate: 0.03 // 3% risk-free rate
      };

      const result = calculationStrategies.riskAdjustedReturn.calculate(portfolio);

      // Expected: (0.01 - 0.03) / 0.20 = -0.1
      expect(result).toBeCloseTo(-0.1, 3);
    });

    it('should handle edge cases - zero volatility', () => {
      const portfolio = {
        id: 'test-3',
        returns: 0.05,
        volatility: 0,     // Zero volatility (cash portfolio)
        riskFreeRate: 0.02
      };

      const result = calculationStrategies.riskAdjustedReturn.calculate(portfolio);

      // Should return Infinity for zero volatility with positive excess return
      expect(result).toBe(Infinity);
    });
  });

  describe('Portfolio Beta Calculation', () => {
    const mockPortfolio = {
      id: 'beta-test',
      securities: [
        { symbol: 'CBA', allocation: 30, beta: 1.2 },
        { symbol: 'BHP', allocation: 25, beta: 1.5 },
        { symbol: 'CSL', allocation: 20, beta: 0.8 },
        { symbol: 'WBC', allocation: 25, beta: 1.1 }
      ]
    };

    it('should calculate weighted portfolio beta correctly', () => {
      const result = calculationStrategies.portfolioBeta.calculate(mockPortfolio);

      // Expected: (0.3 * 1.2) + (0.25 * 1.5) + (0.2 * 0.8) + (0.25 * 1.1) = 1.195
      expect(result).toBeCloseTo(1.195, 3);
    });

    it('should handle portfolios with missing beta values', () => {
      const portfolioWithMissingBeta = {
        ...mockPortfolio,
        securities: [
          ...mockPortfolio.securities,
          { symbol: 'NEW-IPO', allocation: 10, beta: null }
        ]
      };

      // Should handle gracefully and not crash
      expect(() => {
        calculationStrategies.portfolioBeta.calculate(portfolioWithMissingBeta);
      }).not.toThrow();
    });
  });
});
```


#### 2. Integration Testing with Mock Data


```javascript
// sorting-integration.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PortfolioList } from '../PortfolioList';

// Mock calculation engine for consistent testing
jest.mock('../PortfolioCalculationEngine');

const mockPortfolios = [
  {
    id: 'port-1',
    name: 'Conservative Growth',
    value: 1500000,
    lastUpdated: '2024-01-15T10:00:00Z',
    // Pre-calculated values for testing
    expectedSharpe: 0.85,
    expectedBeta: 0.75,
    expectedVaR: 0.032
  },
  {
    id: 'port-2',
    name: 'Aggressive Growth',
    value: 2300000,
    lastUpdated: '2024-01-15T10:00:00Z',
    expectedSharpe: 1.25,
    expectedBeta: 1.45,
    expectedVaR: 0.058
  },
  {
    id: 'port-3',
    name: 'Balanced Fund',
    value: 1800000,
    lastUpdated: '2024-01-15T10:00:00Z',
    expectedSharpe: 0.95,
    expectedBeta: 1.05,
    expectedVaR: 0.041
  }
];

describe('Portfolio Sorting Integration', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should sort portfolios by calculated Sharpe ratio correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PortfolioList portfolios={mockPortfolios} />
      </QueryClientProvider>
    );

    // Click on Risk-Adjusted Return header to sort
    const sharpeHeader = screen.getByText('Risk-Adjusted Return');
    await userEvent.click(sharpeHeader);

    // Wait for calculations to complete
    await waitFor(() => {
      expect(screen.queryByText('Calculating metrics...')).not.toBeInTheDocument();
    });

    // Verify sorting order (ascending Sharpe ratio)
    const portfolioRows = screen.getAllByRole('row');
    expect(portfolioRows[1]).toHaveTextContent('Conservative Growth'); // 0.85
    expect(portfolioRows[2]).toHaveTextContent('Balanced Fund');      // 0.95
    expect(portfolioRows[3]).toHaveTextContent('Aggressive Growth');  // 1.25
  });

  it('should show loading indicators during calculation', async () => {
    // Mock slow calculation
    const mockEngine = require('../PortfolioCalculationEngine').PortfolioCalculationEngine;
    mockEngine.prototype.calculateMetric = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(0.85), 500))
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PortfolioList portfolios={mockPortfolios} />
      </QueryClientProvider>
    );

    const sharpeHeader = screen.getByText('Risk-Adjusted Return');
    await userEvent.click(sharpeHeader);

    // Should show progress indicator
    expect(screen.getByText(/Calculating metrics/)).toBeInTheDocument();

    // Should show spinner in individual cells
    expect(screen.getAllByTestId('calculation-spinner')).toHaveLength(mockPortfolios.length);
  });

  it('should handle calculation errors gracefully', async () => {
    // Mock calculation failure
    const mockEngine = require('../PortfolioCalculationEngine').PortfolioCalculationEngine;
    mockEngine.prototype.calculateMetric = jest.fn().mockRejectedValue(
      new Error('Market data unavailable')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PortfolioList portfolios={mockPortfolios} />
      </QueryClientProvider>
    );

    const sharpeHeader = screen.getByText('Risk-Adjusted Return');
    await userEvent.click(sharpeHeader);

    await waitFor(() => {
      // Should fallback to name sorting
      const portfolioRows = screen.getAllByRole('row');
      expect(portfolioRows[1]).toHaveTextContent('Aggressive Growth'); // Alphabetical
      expect(portfolioRows[2]).toHaveTextContent('Balanced Fund');
      expect(portfolioRows[3]).toHaveTextContent('Conservative Growth');
    });

    // Should show error indicators
    expect(screen.getAllByTestId('error-indicator')).toHaveLength(mockPortfolios.length);
  });
});
```


#### 3. Property-Based Testing for Financial Accuracy


```javascript
// property-based-tests.js
import fc from 'fast-check';
import { calculationStrategies } from '../PortfolioCalculationEngine';

describe('Property-Based Financial Tests', () => {
  describe('Sharpe Ratio Properties', () => {
    it('should always be finite for positive volatility', () => {
      fc.assert(fc.property(
        fc.float({ min: -0.5, max: 2.0 }), // returns
        fc.float({ min: 0.001, max: 1.0 }), // volatility (positive)
        fc.float({ min: 0, max: 0.1 }),     // risk-free rate
        (returns, volatility, riskFreeRate) => {
          const portfolio = { returns, volatility, riskFreeRate };
          const sharpe = calculationStrategies.riskAdjustedReturn.calculate(portfolio);

          expect(Number.isFinite(sharpe)).toBe(true);
        }
      ));
    });

    it('should increase when excess return increases (volatility constant)', () => {
      fc.assert(fc.property(
        fc.float({ min: 0.01, max: 0.30 }), // volatility
        fc.float({ min: 0, max: 0.05 }),    // risk-free rate
        fc.float({ min: 0.01, max: 0.50 }), // return difference
        (volatility, riskFreeRate, returnDiff) => {
          const portfolio1 = {
            returns: riskFreeRate + 0.05,
            volatility,
            riskFreeRate
          };
          const portfolio2 = {
            returns: riskFreeRate + 0.05 + returnDiff,
            volatility,
            riskFreeRate
          };

          const sharpe1 = calculationStrategies.riskAdjustedReturn.calculate(portfolio1);
          const sharpe2 = calculationStrategies.riskAdjustedReturn.calculate(portfolio2);

          expect(sharpe2).toBeGreaterThan(sharpe1);
        }
      ));
    });
  });

  describe('Portfolio Beta Properties', () => {
    it('should be weighted average of individual betas', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          allocation: fc.float({ min: 5, max: 40 }),
          beta: fc.float({ min: 0.1, max: 3.0 })
        }), { minLength: 2, maxLength: 10 }),
        (securities) => {
          // Normalize allocations to sum to 100
          const totalAllocation = securities.reduce((sum, s) => sum + s.allocation, 0);
          const normalizedSecurities = securities.map(s => ({
            ...s,
            allocation: (s.allocation / totalAllocation) * 100
          }));

          const portfolio = { securities: normalizedSecurities };
          const portfolioBeta = calculationStrategies.portfolioBeta.calculate(portfolio);

          // Manual calculation
          const expectedBeta = normalizedSecurities.reduce((beta, security) => {
            return beta + (security.allocation / 100) * security.beta;
          }, 0);

          expect(portfolioBeta).toBeCloseTo(expectedBeta, 5);
        }
      ));
    });
  });
});
```


#### 4. Performance Testing for Large Datasets


```javascript
// performance.test.js
describe('Sorting Performance Tests', () => {
  const generateLargePortfolioDataset = (size) => {
    return Array.from({ length: size }, (_, i) => ({
      id: `portfolio-${i}`,
      name: `Portfolio ${i}`,
      value: Math.random() * 10000000,
      returns: Math.random() * 0.3 - 0.1, // -10% to +20%
      volatility: Math.random() * 0.4 + 0.05, // 5% to 45%
      riskFreeRate: 0.025,
      securities: Array.from({ length: 10 }, (_, j) => ({
        allocation: 10,
        beta: Math.random() * 2 + 0.5 // 0.5 to 2.5
      }))
    }));
  };

  it('should sort 10,000 portfolios within acceptable time', async () => {
    const largeDataset = generateLargePortfolioDataset(10000);
    const engine = new PortfolioCalculationEngine();

    const startTime = performance.now();

    // Calculate Sharpe ratios for all portfolios
    const calculations = largeDataset.map(portfolio =>
      engine.calculateMetric(portfolio, 'riskAdjustedReturn')
    );

    await Promise.all(calculations);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within 5 seconds for 10k portfolios
    expect(duration).toBeLessThan(5000);
  });

  it('should handle memory efficiently with large datasets', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const largeDataset = generateLargePortfolioDataset(50000);
    const engine = new PortfolioCalculationEngine();

    // Process in batches to test memory management
    for (let i = 0; i < largeDataset.length; i += 1000) {
      const batch = largeDataset.slice(i, i + 1000);
      await Promise.all(
        batch.map(portfolio =>
          engine.calculateMetric(portfolio, 'riskAdjustedReturn')
        )
      );
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 500MB)
    expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024);
  });
});
```


#### 5. End-to-End Testing with Real User Scenarios


```javascript
// e2e-sorting.spec.js (Playwright/Cypress)
import { test, expect } from '@playwright/test';

test.describe('Portfolio Sorting E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses with consistent test data
    await page.route('/api/portfolios', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          portfolios: testPortfolios,
          marketData: testMarketData
        })
      });
    });

    await page.goto('/portfolios');
  });

  test('should sort by risk-adjusted return and maintain accuracy', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('[data-testid="portfolio-list"]')).toBeVisible();

    // Click sort header
    await page.click('[data-testid="sort-risk-adjusted-return"]');

    // Wait for calculations to complete
    await expect(page.locator('[data-testid="calculation-progress"]')).not.toBeVisible();

    // Verify sorting order by checking values
    const sharpeValues = await page.$$eval(
      '[data-testid="sharpe-ratio-cell"]',
      cells => cells.map(cell => parseFloat(cell.textContent))
    );

    // Should be in ascending order
    for (let i = 1; i < sharpeValues.length; i++) {
      expect(sharpeValues[i]).toBeGreaterThanOrEqual(sharpeValues[i - 1]);
    }
  });

  test('should handle network errors during calculations gracefully', async ({ page }) => {
    // Simulate network failure during calculation
    await page.route('/api/market-data', route => {
      route.abort('failed');
    });

    await page.click('[data-testid="sort-portfolio-beta"]');

    // Should show error state
    await expect(page.locator('[data-testid="calculation-error"]')).toBeVisible();

    // Should fallback to basic sorting
    const portfolioNames = await page.$$eval(
      '[data-testid="portfolio-name"]',
      cells => cells.map(cell => cell.textContent)
    );

    expect(portfolioNames).toEqual([...portfolioNames].sort());
  });
});
```


#### 6. Financial Accuracy Validation


```javascript
// financial-validation.test.js
describe('Financial Calculation Validation', () => {
  // Use real market data for validation
  const realWorldTestCases = [
    {
      name: 'ASX 200 ETF equivalent',
      portfolio: {
        returns: 0.089,      // Historical ASX 200 return
        volatility: 0.156,   // Historical volatility
        riskFreeRate: 0.025  // RBA cash rate
      },
      expectedSharpe: 0.410, // Known benchmark
      tolerance: 0.01
    },
    {
      name: 'Conservative balanced fund',
      portfolio: {
        returns: 0.065,
        volatility: 0.085,
        riskFreeRate: 0.025
      },
      expectedSharpe: 0.471,
      tolerance: 0.01
    }
  ];

  realWorldTestCases.forEach(testCase => {
    it(`should calculate correct Sharpe ratio for ${testCase.name}`, () => {
      const result = calculationStrategies.riskAdjustedReturn.calculate(testCase.portfolio);
      expect(result).toBeCloseTo(testCase.expectedSharpe, 2);
    });
  });

  // Regulatory compliance tests
  it('should match APRA risk weighting calculations', () => {
    const bankPortfolio = {
      securities: [
        { type: 'cash', allocation: 10, riskWeight: 0 },
        { type: 'government_bonds', allocation: 30, riskWeight: 0 },
        { type: 'corporate_bonds', allocation: 25, riskWeight: 0.2 },
        { type: 'residential_mortgages', allocation: 35, riskWeight: 0.35 }
      ]
    };

    const riskWeightedAllocation = calculateAPRARiskWeighting(bankPortfolio);
    expect(riskWeightedAllocation).toBeCloseTo(0.1725, 4); // Expected regulatory calculation
  });
});
```


This comprehensive testing approach ensures:


1. **Mathematical Accuracy**: Unit tests validate calculation formulas
2. **Integration Reliability**: Tests verify components work together correctly
3. **Property Validation**: Property-based tests ensure mathematical properties hold
4. **Performance Assurance**: Load tests validate system handles scale
5. **User Experience**: E2E tests verify real user workflows
6. **Regulatory Compliance**: Validation against industry standards


For **financial applications at NAB**, this testing strategy provides the **confidence and accuracy** required for production systems handling billions of dollars in assets.


---


## Part 3: Coding Challenge (20 minutes)


**Interviewer**: Excellent testing approach! Your understanding of both technical requirements and regulatory compliance is impressive. Now let's move to our coding challenge.


I'd like you to implement a **real-time trading dashboard component** that displays a list of securities with the ability to sort by multiple criteria. Here are the requirements:


1. **Display a list of securities** with the following fields:

Symbol (e.g., "CBA.AX")
Name (e.g., "Commonwealth Bank")
Current Price
Price Change ($)
Price Change (%)
Volume
Market Cap
2. **Implement multi-column sorting** - users can sort by any column, with visual indicators
3. **Add real-time price updates** - simulate WebSocket updates every 2 seconds
4. **Performance optimization** - the list should handle 1000+ securities smoothly
5. **Use modern React patterns** - hooks, context, and proper TypeScript types


You have 20 minutes. I'll be looking for **clean code architecture**, **performance considerations**, and **proper error handling**. Please think aloud as you code so I can understand your approach.


**Candidate**: Perfect! This is exactly the kind of challenge I love. Let me break down my approach before I start coding:


**Architecture Plan**:


1. **TypeScript interfaces** for type safety
2. **Custom hooks** for data management and sorting logic
3. **Context for real-time updates** to avoid prop drilling
4. **Memoization** for performance optimization
5. **Virtual scrolling** for large datasets
6. **Error boundaries** for resilience


Let me start implementing:


```typescript
// types/trading.ts
export interface Security {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: Date;
}

export interface SortConfig {
  field: keyof Security;
  direction: 'asc' | 'desc';
}

export interface PriceUpdate {
  id: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  timestamp: Date;
}
```


Now the real-time data context:


```typescript
// context/TradingDataContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Security, PriceUpdate } from '../types/trading';

interface TradingDataContextType {
  securities: Security[];
  isConnected: boolean;
  error: string | null;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
}

const TradingDataContext = createContext<TradingDataContextType | null>(null);

export const useTradingData = () => {
  const context = useContext(TradingDataContext);
  if (!context) {
    throw new Error('useTradingData must be used within TradingDataProvider');
  }
  return context;
};

export const TradingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securities, setSecurities] = useState<Security[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());

  // Simulate WebSocket connection
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const simulateRealTimeUpdates = () => {
      if (subscribedSymbols.size === 0) return;

      const updates: PriceUpdate[] = Array.from(subscribedSymbols).map(symbol => {
        const security = securities.find(s => s.symbol === symbol);
        if (!security) return null;

        // Simulate price movement (random walk)
        const volatility = 0.02; // 2% volatility
        const randomChange = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = security.currentPrice * (1 + randomChange);
        const priceChange = newPrice - security.currentPrice;
        const priceChangePercent = (priceChange / security.currentPrice) * 100;

        return {
          id: security.id,
          currentPrice: newPrice,
          priceChange,
          priceChangePercent,
          volume: security.volume + Math.floor(Math.random() * 10000),
          timestamp: new Date()
        };
      }).filter(Boolean) as PriceUpdate[];

      if (updates.length > 0) {
        setSecurities(prev => prev.map(security => {
          const update = updates.find(u => u.id === security.id);
          return update ? { ...security, ...update, lastUpdated: update.timestamp } : security;
        }));
      }
    };

    if (subscribedSymbols.size > 0) {
      setIsConnected(true);
      setError(null);
      intervalId = setInterval(simulateRealTimeUpdates, 2000);
    } else {
      setIsConnected(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [subscribedSymbols, securities]);

  const subscribe = useCallback((symbols: string[]) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      symbols.forEach(symbol => newSet.add(symbol));
      return newSet;
    });
  }, []);

  const unsubscribe = useCallback((symbols: string[]) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      symbols.forEach(symbol => newSet.delete(symbol));
      return newSet;
    });
  }, []);

  // Initialize with mock data
  useEffect(() => {
    const mockSecurities: Security[] = [
      {
        id: '1',
        symbol: 'CBA.AX',
        name: 'Commonwealth Bank',
        currentPrice: 108.50,
        priceChange: 2.30,
        priceChangePercent: 2.16,
        volume: 1250000,
        marketCap: 184000000000,
        lastUpdated: new Date()
      },
      {
        id: '2',
        symbol: 'BHP.AX',
        name: 'BHP Group',
        currentPrice: 42.15,
        priceChange: -0.85,
        priceChangePercent: -1.98,
        volume: 2100000,
        marketCap: 213000000000,
        lastUpdated: new Date()
      },
      {
        id: '3',
        symbol: 'CSL.AX',
        name: 'CSL Limited',
        currentPrice: 275.20,
        priceChange: 5.40,
        priceChangePercent: 2.00,
        volume: 450000,
        marketCap: 132000000000,
        lastUpdated: new Date()
      },
      // Add more mock data...
    ];

    setSecurities(mockSecurities);
    subscribe(mockSecurities.map(s => s.symbol));
  }, [subscribe]);

  return (
    <TradingDataContext.Provider value={{
      securities,
      isConnected,
      error,
      subscribe,
      unsubscribe
    }}>
      {children}
    </TradingDataContext.Provider>
  );
};
```


Now the sorting hook:


```typescript
// hooks/useSorting.ts
import { useMemo, useState, useCallback } from 'react';
import { Security, SortConfig } from '../types/trading';

export const useSorting = (data: Security[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'symbol',
    direction: 'asc'
  });

  const sortedData = useMemo(() => {
    if (!data.length) return [];

    return [...data].sort((a, b) => {
      const { field, direction } = sortConfig;
      const aValue = a[field];
      const bValue = b[field];

      let comparison = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = useCallback((field: keyof Security) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  return {
    sortedData,
    sortConfig,
    handleSort
  };
};
```


The main trading dashboard component:


```typescript
// components/TradingDashboard.tsx
import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useTradingData } from '../context/TradingDataContext';
import { useSorting } from '../hooks/useSorting';
import { Security } from '../types/trading';
import './TradingDashboard.css';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-AU').format(value);

const formatMarketCap = (value: number) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return formatCurrency(value);
};

interface SecurityRowProps {
  index: number;
  style: React.CSSProperties;
  data: Security[];
}

const SecurityRow = memo<SecurityRowProps>(({ index, style, data }) => {
  const security = data[index];
  const isPositive = security.priceChange >= 0;

  return (
    <div style={style} className="security-row">
      <div className="cell symbol">{security.symbol}</div>
      <div className="cell name">{security.name}</div>
      <div className="cell price">{formatCurrency(security.currentPrice)}</div>
      <div className={`cell change ${isPositive ? 'positive' : 'negative'}`}>
        {formatCurrency(security.priceChange)}
      </div>
      <div className={`cell change-percent ${isPositive ? 'positive' : 'negative'}`}>
        {security.priceChangePercent.toFixed(2)}%
      </div>
      <div className="cell volume">{formatNumber(security.volume)}</div>
      <div className="cell market-cap">{formatMarketCap(security.marketCap)}</div>
    </div>
  );
});

interface HeaderCellProps {
  field: keyof Security;
  label: string;
  sortConfig: { field: keyof Security; direction: 'asc' | 'desc' };
  onSort: (field: keyof Security) => void;
}

const HeaderCell = memo<HeaderCellProps>(({ field, label, sortConfig, onSort }) => {
  const isActive = sortConfig.field === field;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <div
      className={`header-cell ${isActive ? 'active' : ''}`}
      onClick={() => onSort(field)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSort(field);
        }
      }}
    >
      {label}
      {direction && (
        <span className="sort-indicator">
          {direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
});

export const TradingDashboard: React.FC = () => {
  const { securities, isConnected, error } = useTradingData();
  const { sortedData, sortConfig, handleSort } = useSorting(securities);

  const connectionStatus = useMemo(() => ({
    className: isConnected ? 'connected' : 'disconnected',
    text: isConnected ? 'Live' : 'Disconnected'
  }), [isConnected]);

  if (error) {
    return (
      <div className="trading-dashboard error">
        <h2>Trading Dashboard - Error</h2>
        <p>Error loading market data: {error}</p>
      </div>
    );
  }

  return (
    <div className="trading-dashboard">
      <div className="dashboard-header">
        <h2>NAB Trading Dashboard</h2>
        <div className={`connection-status ${connectionStatus.className}`}>
          <span className="status-dot" />
          {connectionStatus.text}
        </div>
      </div>

      <div className="securities-table">
        <div className="table-header">
          <HeaderCell field="symbol" label="Symbol" sortConfig={sortConfig} onSort={handleSort} />
          <HeaderCell field="name" label="Name" sortConfig={sortConfig} onSort={handleSort} />
          <HeaderCell field="currentPrice" label="Price" sortConfig={sortConfig} onSort={handleSort} />
          <HeaderCell field="priceChange" label="Change ($)" sortConfig={sortConfig} onSort={handleSort} />
          <HeaderCell field="priceChangePercent" label="Change (%)" sortConfig={sortConfig} onSort={handleSort} />
          <HeaderCell field="volume" label="Volume" sortConfig={sortConfig} onSort={handleSort} />
          <HeaderCell field="marketCap" label="Market Cap" sortConfig={sortConfig} onSort={handleSort} />
        </div>

        <List
          height={600}
          itemCount={sortedData.length}
          itemSize={50}
          itemData={sortedData}
          className="securities-list"
        >
          {SecurityRow}
        </List>
      </div>

      <div className="dashboard-footer">
        <span>Showing {sortedData.length} securities</span>
        <span>Last updated: {securities[0]?.lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
```


And finally, the CSS for styling:


```css
/* components/TradingDashboard.css */
.trading-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e1e5e9;
}

.dashboard-header h2 {
  color: #1a1a1a;
  margin: 0;
  font-weight: 600;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
}

.connection-status.connected {
  background-color: #d4edda;
  color: #155724;
}

.connection-status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

.securities-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 200px 120px 120px 120px 120px 140px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.header-cell {
  padding: 16px 12px;
  font-weight: 600;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.header-cell:hover {
  background-color: #e9ecef;
}

.header-cell.active {
  background-color: #d1ecf1;
  color: #0c5460;
}

.sort-indicator {
  font-size: 12px;
  opacity: 0.7;
}

.securities-list {
  scrollbar-width: thin;
  scrollbar-color: #cbd3da #f8f9fa;
}

.securities-list::-webkit-scrollbar {
  width: 8px;
}

.securities-list::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.securities-list::-webkit-scrollbar-thumb {
  background: #cbd3da;
  border-radius: 4px;
}

.security-row {
  display: grid;
  grid-template-columns: 100px 200px 120px 120px 120px 120px 140px;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s;
}

.security-row:hover {
  background-color: #f8f9fa;
}

.cell {
  padding: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.cell.symbol {
  font-weight: 600;
  color: #1a73e8;
}

.cell.name {
  color: #3c4043;
}

.cell.price {
  font-weight: 500;
  text-align: right;
  justify-content: flex-end;
}

.cell.change.positive {
  color: #137333;
}

.cell.change.negative {
  color: #d93025;
}

.cell.change,
.cell.change-percent {
  font-weight: 500;
  text-align: right;
  justify-content: flex-end;
}

.cell.volume,
.cell.market-cap {
  text-align: right;
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
}

.dashboard-footer {
  margin-top: 16px;
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #6c757d;
}

.error {
  text-align: center;
  padding: 40px;
  color: #d93025;
}

/* Responsive design */
@media (max-width: 1200px) {
  .table-header,
  .security-row {
    grid-template-columns: 80px 180px 100px 100px 100px 100px 120px;
  }
}

@media (max-width: 768px) {
  .table-header,
  .security-row {
    grid-template-columns: 1fr 2fr 1fr 1fr;
  }

  .cell.volume,
  .cell.market-cap,
  .cell.name {
    display: none;
  }
}
```


**Interviewer**: *Time!*


Wow, Alex! That's impressive work. In 20 minutes, you've created a **production-quality trading dashboard** with several advanced features. Let me highlight what I particularly liked:


1. **Excellent TypeScript usage** - proper interfaces and type safety throughout
2. **Smart architecture** - separating concerns with context, hooks, and components
3. **Performance optimization** - virtual scrolling for large datasets and proper memoization
4. **Real-time simulation** - WebSocket-like updates with proper state management
5. **Accessibility considerations** - keyboard navigation and proper ARIA attributes
6. **Responsive design** - mobile-friendly grid layout


A few **follow-up questions**:


**How would you handle error recovery if the WebSocket connection drops?**


**Candidate**: Great question! Error recovery is critical for trading applications. Here's how I'd enhance the connection management:


```typescript
// Enhanced context with reconnection logic
const useWebSocketWithRecovery = () => {
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useMemo(() =>
    Math.min(1000 * Math.pow(2, reconnectAttempts), 30000), // Exponential backoff, max 30s
    [reconnectAttempts]
  );

  const reconnect = useCallback(() => {
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        // Trigger reconnection logic
      }, reconnectDelay);
    }
  }, [reconnectAttempts, reconnectDelay]);

  // Reset attempts on successful connection
  const onConnectionSuccess = useCallback(() => {
    setReconnectAttempts(0);
    setError(null);
  }, []);

  return { reconnect, onConnectionSuccess, reconnectAttempts };
};
```


I'd also implement **data staleness indicators** to show users when their data might be outdated, and **offline caching** using IndexedDB to maintain some functionality during network outages.


**How would you optimize this for mobile devices where performance is more constrained?**


**Candidate**: Mobile optimization would involve several strategies:


1. **Adaptive rendering**: Reduce the number of visible columns on smaller screens and lower the virtual scrolling item height for smoother performance
2. **Data prioritization**: Only load essential fields initially and lazy-load additional data on demand
3. **Touch-friendly interactions**: Implement swipe gestures for sorting and horizontal scrolling for table navigation
4. **Battery optimization**: Reduce update frequency when the app is backgrounded using the Page Visibility API


```typescript
// Mobile-optimized version
const useMobileOptimizations = () => {
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const updateInterval = useMemo(() =>
    isBackgrounded ? 10000 : 2000, // Slower updates when backgrounded
    [isBackgrounded]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackgrounded(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return { updateInterval, isBackgrounded };
};
```


**What about handling large-scale data updates - say 10,000 securities updating simultaneously?**


**Candidate**: For enterprise-scale updates, I'd implement **batched updates with priority queuing**:


1. **Update batching**: Collect updates over a time window (e.g., 16ms) and apply them in a single render cycle
2. **Priority-based updates**: Update visible rows first, then off-screen data
3. **Differential updates**: Only update changed fields rather than replacing entire objects
4. **Background processing**: Use Web Workers for heavy calculations like sorting large datasets


```typescript
const useBatchedUpdates = () => {
  const updateQueue = useRef<PriceUpdate[]>([]);
  const batchTimeout = useRef<NodeJS.Timeout>();

  const queueUpdate = useCallback((update: PriceUpdate) => {
    updateQueue.current.push(update);

    if (batchTimeout.current) clearTimeout(batchTimeout.current);

    batchTimeout.current = setTimeout(() => {
      // Process batch
      const batch = updateQueue.current.splice(0);
      applyBatchedUpdates(batch);
    }, 16); // One frame
  }, []);

  return queueUpdate;
};
```


This approach ensures **60fps performance** even with thousands of concurrent updates.


**Interviewer**: Outstanding! Your solutions demonstrate **deep understanding of performance optimization** and **real-world scalability challenges**. The exponential backoff for reconnections and the adaptive mobile strategies show excellent production experience.


---


## Interview Wrap-up


**Interviewer**: Alex, this has been an exceptional interview. Let me summarize what impressed me most:


### Technical Excellence ⭐⭐⭐⭐⭐


- **Deep JavaScript knowledge**: Your array sorting explanations were comprehensive and production-ready
- **React expertise**: Modern patterns, performance optimization, and proper architecture
- **TypeScript proficiency**: Clean interfaces and type safety throughout
- **Performance mindset**: Virtual scrolling, memoization, and Web Workers for heavy operations


### Problem-Solving Approach ⭐⭐⭐⭐⭐


- **Systematic thinking**: Breaking down complex problems into manageable pieces
- **Trade-off analysis**: Always considering performance vs complexity vs maintainability
- **Edge case handling**: Proactive error management and graceful degradation
- **Scalability consideration**: Solutions that work at NAB's enterprise scale


### Communication & Leadership ⭐⭐⭐⭐⭐


- **Clear explanations**: Technical concepts explained accessibly
- **Production experience**: Real-world examples and battle-tested solutions
- **Testing mindset**: Comprehensive testing strategy for financial applications
- **Architecture vision**: Clean separation of concerns and maintainable code


### NAB-Specific Strengths ⭐⭐⭐⭐⭐


- **Financial domain knowledge**: Understanding of trading systems and regulatory requirements
- **Performance at scale**: Solutions for millions of users and high-frequency data
- **Risk management**: Error handling and data accuracy prioritization
- **Innovation**: Modern approaches that improve user experience


### Areas That Stand Out:


1. **Your hybrid client-server sorting strategy** - brilliant approach for large financial datasets
2. **The calculation engine with intelligent caching** - exactly what we need for complex financial metrics
3. **Comprehensive testing philosophy** - critical for financial applications
4. **Real-time dashboard implementation** - production-quality code in 20 minutes


### Final Assessment:


Alex, you've demonstrated **Senior/Principal level expertise** (L6+ on our scale) with both the technical depth and practical experience we need at NAB. Your understanding of **performance optimization**, **financial calculations**, and **enterprise-scale challenges** aligns perfectly with our requirements.


**Next Steps**:
I'm recommending you advance to the **final round with our Engineering Director**. You can expect discussions about:


- **System design** for NAB's trading platform architecture
- **Leadership scenarios** and mentoring approaches
- **Strategic technical decisions** and long-term vision


Any questions for me about the role, team, or NAB's technical culture?


**Candidate**: Thank you so much, Sarah! This has been an incredibly engaging interview. I'm excited about the opportunity to contribute to NAB's digital transformation.


A few questions:


1. **What's the biggest technical challenge** the frontend team is currently facing?
2. **How does NAB approach modernizing legacy systems** while maintaining regulatory compliance?
3. **What opportunities exist for innovation** in the customer-facing applications?


**Interviewer**: Great questions!


1. **Biggest challenge**: We're migrating from our legacy monolithic frontend to a **micro-frontend architecture** while maintaining 99.99% uptime. It's complex but exciting work.
2. **Legacy modernization**: We use **strangler fig pattern** - gradually replacing old systems with new React applications behind feature flags. Regulatory compliance is built into our CI/CD pipeline with automated testing.
3. **Innovation opportunities**: We're exploring **AI-powered financial insights**, **voice banking interfaces**, and **advanced data visualization** for our wealth management platform. Your background would be perfect for these initiatives.


Thanks for a fantastic interview, Alex. Looking forward to hearing about your final round!


---


## Interview Reflection & Key Insights


This **NAB Senior Frontend Engineer interview simulation** demonstrated several critical aspects of high-level technical interviewing:


### Technical Depth Required


- **Beyond basic React**: Understanding performance implications, state management patterns, and production-scale challenges
- **Financial domain expertise**: Knowledge of trading systems, calculations, and regulatory requirements
- **Systems thinking**: Ability to design scalable solutions for enterprise environments


### Modern React Ecosystem Mastery


- **State Management**: React Query, Zustand, Context patterns for different use cases
- **Performance**: Virtual scrolling, memoization, Web Workers, and mobile optimization
- **Architecture**: Clean separation of concerns, custom hooks, and maintainable code structures


### Production Readiness


- **Testing**: Comprehensive strategy covering unit, integration, property-based, and E2E testing
- **Error Handling**: Graceful degradation, reconnection strategies, and user feedback
- **Accessibility**: Keyboard navigation, screen reader support, and inclusive design


### Interview Success Factors


1. **Think aloud**: Explaining reasoning demonstrates problem-solving approach
2. **Consider trade-offs**: Always discuss performance vs complexity vs maintainability
3. **Real-world examples**: Draw from actual project experience with specific metrics
4. **Ask clarifying questions**: Shows critical thinking and requirements gathering skills
5. **Code quality**: Write production-ready code even under time pressure


This interview format effectively evaluates candidates for **senior-level positions** where technical leadership, system design capabilities, and domain expertise are essential for success at enterprise scale.
