# STATE MANAGEMENT - CHI TIẾT CHO SENIOR/LEAD LEVEL (5+ YEARS)

## You

truy cập đoạn chat này: Front-end React Leader Interview Prep

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần 2. STATE MANAGEMENT

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần Redux - actions, reducers, store, middleware

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần Redux - Thunk

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần Context API

## Claude


I'll help you find that conversation about Front-end React Leader Interview Prep. Let me search for it.


Tôi đã tìm thấy cuộc trò chuyện về "Front-end React Leader Interview Prep" của bạn. Đây là link để truy cập:


**https://claude.ai/chat/44d1cd7f-147c-4c8c-ac4c-8f663a6db964**


Cuộc trò chuyện này bao gồm những nội dung chính:


**Nội dung đã thảo luận:**


- **15 chủ đề chính** cần chuẩn bị cho interview vị trí Front-end React Leader
- **Chi tiết về React.js Core Principles** cho level senior (5+ năm kinh nghiệm)
- **Performance Optimization** trong React với các kỹ thuật advanced
- **Isomorphic React/SSR** concepts và implementation
- **Leadership skills** và team management requirements
- **Technical skills** từ cơ bản đến nâng cao


**Những phần đã được detail:**


- Component Architecture & Patterns
- Advanced React Hooks
- State Management strategies
- Performance optimization techniques
- SSR/SSG implementation
- Code review scenarios và practical exercises


Bạn có thể click vào link trên để tiếp tục cuộc trò chuyện đó hoặc review lại những nội dung đã thảo luận để chuẩn bị cho interview.


## Claude


## STATE MANAGEMENT - CHI TIẾT CHO SENIOR/LEAD LEVEL (5+ YEARS)


### 1. REDUX ECOSYSTEM - ADVANCED CONCEPTS


**Core Redux Principles:**


- **Three Principles**: Single source of truth, State is read-only, Changes với pure functions
- **Unidirectional Data Flow** - action → reducer → store → view
- **Immutable State Updates** - spread operators, Immer library
- **Pure Functions** trong reducers - side effects handling
- **Time Travel Debugging** với Redux DevTools


**Advanced Redux Patterns:**


```javascript
// Normalized State Structure
const initialState = {
  users: {
    byId: {},
    allIds: []
  },
  posts: {
    byId: {},
    allIds: []
  }
}

// Selector Patterns với Reselect
const getUserPosts = createSelector(
  [getUsers, getPosts, getUserId],
  (users, posts, userId) => {
    return posts.filter(post => post.authorId === userId)
  }
)
```


**Redux Toolkit (RTK) - Modern Approach:**


- **createSlice()** - reducers + actions generation
- **createAsyncThunk()** - async action creators
- **RTK Query** - data fetching và caching
- **configureStore()** - store setup với best practices
- **createEntityAdapter()** - CRUD operations optimization


### 2. MODERN REDUX PATTERNS


**RTK Query Advanced:**


```javascript
// Advanced RTK Query với cache invalidation
const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
      transformResponse: (response) => normalize(response, userSchema)
    }),
    updateUser: builder.mutation({
      query: ({id, ...patch}) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: ['User']
    })
  })
})
```


**Redux Middleware:**


- **Thunk** - async actions handling
- **Saga** - complex async flows với generators
- **Observable** - reactive programming với RxJS
- **Custom Middleware** - logging, analytics, caching
- **Middleware Composition** strategies


### 3. CONTEXT API - ADVANCED USAGE


**Context Performance Optimization:**


```javascript
// Split Context Pattern
const StateContext = createContext()
const DispatchContext = createContext()

// Multiple Contexts cho different domains
const UserContext = createContext()
const ThemeContext = createContext()
const NotificationContext = createContext()

// Context với useReducer
const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState)

  const contextValue = useMemo(() => ({
    state,
    dispatch
  }), [state])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}
```


**Context Anti-Patterns & Solutions:**


- **Value Object Recreation** - useMemo optimization
- **Unnecessary Re-renders** - context splitting strategies
- **Deep Component Trees** - context composition patterns
- **Provider Hell** - context combining techniques


### 4. MODERN STATE MANAGEMENT SOLUTIONS


**Zustand - Lightweight State Management:**


```javascript
// Simple store creation
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),

  // Async actions
  fetchData: async () => {
    const data = await api.getData()
    set({ data, loading: false })
  }
}))

// Slices pattern với Zustand
const createUserSlice = (set, get) => ({
  user: null,
  login: async (credentials) => {
    const user = await auth.login(credentials)
    set({ user })
  }
})
```


**Jotai - Atomic State Management:**


```javascript
// Atomic approach
const countAtom = atom(0)
const doubleCountAtom = atom((get) => get(countAtom) * 2)

// Async atoms
const userAtom = atom(async (get) => {
  const userId = get(userIdAtom)
  return fetchUser(userId)
})

// Write-only atoms
const incrementAtom = atom(null, (get, set) => {
  set(countAtom, get(countAtom) + 1)
})
```


**Valtio - Proxy-based State:**


```javascript
// Proxy-based reactivity
const state = proxy({
  user: null,
  posts: [],
  loading: false
})

// Mutations
const actions = {
  login: async (credentials) => {
    state.loading = true
    state.user = await auth.login(credentials)
    state.loading = false
  },

  addPost: (post) => {
    state.posts.push(post)
  }
}
```


### 5. STATE ARCHITECTURE PATTERNS


**Flux Architecture Variations:**


- **Traditional Flux** - Facebook's original pattern
- **Redux** - predictable state container
- **MobX** - reactive state management
- **Recoil** - experimental React state library
- **SWR/React Query** - server state management


**State Layers Architecture:**


```javascript
// Layered state architecture
// 1. Server State - API data caching
const useServerData = () => {
  return useQuery('users', fetchUsers, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

// 2. Client State - UI state
const useClientState = () => {
  return useContext(AppContext)
}

// 3. URL State - routing state
const useURLState = () => {
  return useParams()
}

// 4. Component State - local state
const useLocalState = () => {
  return useState()
}
```


### 6. PERFORMANCE CONSIDERATIONS


**State Update Optimization:**


- **Batch Updates** - automatic trong React 18
- **Selective Updates** - chỉ update components cần thiết
- **Memoization Strategies** - useMemo, useCallback cho selectors
- **State Normalization** - flat state structure
- **Lazy Loading** state modules


**Memory Management:**


```javascript
// State cleanup strategies
useEffect(() => {
  return () => {
    // Cleanup subscriptions
    store.dispatch(cleanup())
  }
}, [])

// Memory leak prevention
const useAsyncState = () => {
  const [state, setState] = useState()
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const setStateIfMounted = (newState) => {
    if (mountedRef.current) {
      setState(newState)
    }
  }

  return [state, setStateIfMounted]
}
```


### 7. TESTING STATE MANAGEMENT


**Redux Testing Strategies:**


```javascript
// Testing reducers
describe('userReducer', () => {
  it('should handle LOGIN_SUCCESS', () => {
    const action = { type: 'LOGIN_SUCCESS', payload: user }
    const newState = userReducer(initialState, action)
    expect(newState.user).toEqual(user)
  })
})

// Testing connected components
const renderWithRedux = (component, initialState) => {
  const store = createStore(reducer, initialState)
  return render(<Provider store={store}>{component}</Provider>)
}

// Testing async actions với Redux Toolkit
const store = configureStore({
  reducer: { api: apiSlice.reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware)
})
```


### 8. ARCHITECTURE DECISION FRAMEWORK


**When to Choose Different Solutions:**


**Redux - Choose khi:**


- Large, complex applications
- Predictable state updates required
- Time travel debugging needed
- Team familiar với functional programming
- Complex async flows


**Context API - Choose khi:**


- Simple to medium state sharing
- Avoiding prop drilling
- Theme, authentication, localization
- Small team applications


**Zustand/Jotai - Choose khi:**


- Lightweight alternative to Redux
- Flexible state structure needed
- Modern React patterns preferred
- Bundle size concerns


### 9. SENIOR/LEAD INTERVIEW SCENARIOS


**Architectural Questions:**


1. **State Architecture**: How do you design state architecture for large applications?
2. **Performance**: What strategies do you use để prevent unnecessary re-renders?
3. **Migration**: How do you migrate from Redux to modern alternatives?
4. **Team Standards**: How do you establish state management conventions?


**Code Review Scenarios:**


- Identify performance issues trong state management
- Optimize Redux store structure
- Review Context usage patterns
- Evaluate state management choice


**Technical Deep Dives:**


1. **Redux vs Context**: When would you choose one over the other?
2. **Server State**: How do you handle server vs client state separation?
3. **State Persistence**: What strategies do you use for state persistence?
4. **Error Handling**: How do you handle errors trong different state management solutions?


**Leadership Questions:**


1. How do you train team members on state management best practices?
2. What's your approach to establishing state management architecture?
3. How do you evaluate và choose state management solutions?
4. How do you handle technical debt trong existing state management?


Với kiến thức sâu về State Management này, bạn có thể demonstrate expertise trong **application architecture**, **performance optimization**, **modern React patterns**, và **technical leadership** - những skills quan trọng cho senior/lead roles trong complex React applications.


## Claude


## REDUX - ACTIONS, REDUCERS, STORE, MIDDLEWARE - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. ACTIONS - ADVANCED CONCEPTS


**Action Structure & Standards:**


```javascript
// Standard Action Structure (FSA - Flux Standard Action)
const action = {
  type: 'FETCH_USER_SUCCESS',
  payload: {
    user: userData,
    timestamp: Date.now()
  },
  meta: {
    requestId: 'req_123',
    fromCache: false
  },
  error: false
}

// Error Action
const errorAction = {
  type: 'FETCH_USER_FAILURE',
  payload: new Error('Network error'),
  error: true,
  meta: {
    requestId: 'req_123'
  }
}
```


**Action Creators - Traditional vs Modern:**


```javascript
// Traditional Action Creators
const loginRequest = () => ({
  type: 'LOGIN_REQUEST'
})

const loginSuccess = (user) => ({
  type: 'LOGIN_SUCCESS',
  payload: { user }
})

const loginFailure = (error) => ({
  type: 'LOGIN_FAILURE',
  payload: error,
  error: true
})

// RTK createAction (Modern approach)
import { createAction } from '@reduxjs/toolkit'

const login = createAction('user/login', (credentials) => ({
  payload: credentials,
  meta: {
    timestamp: Date.now(),
    source: 'user_form'
  }
}))

// Generates: login.type === 'user/login'
// Usage: dispatch(login({ email, password }))
```


**Async Action Creators - Thunk Pattern:**


```javascript
// Traditional Thunk
const loginUser = (credentials) => {
  return async (dispatch, getState) => {
    dispatch(loginRequest())

    try {
      const currentUser = getState().auth.user
      if (currentUser) {
        throw new Error('User already logged in')
      }

      const response = await api.login(credentials)
      const user = response.data

      // Dispatch multiple actions
      dispatch(loginSuccess(user))
      dispatch(updateProfile(user.profile))

      // Navigate programmatically
      history.push('/dashboard')

    } catch (error) {
      dispatch(loginFailure(error.message))
      // Log error to analytics
      analytics.track('login_failed', { error: error.message })
    }
  }
}

// RTK createAsyncThunk (Modern approach)
const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { getState, dispatch, rejectWithValue }) => {
    try {
      const currentUser = getState().auth.user
      if (currentUser) {
        return rejectWithValue('User already logged in')
      }

      const response = await api.login(credentials)

      // Side effects
      dispatch(updateProfile(response.data.profile))

      return response.data
    } catch (error) {
      analytics.track('login_failed', { error: error.message })
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)
```


**Action Type Conventions & Organization:**


```javascript
// Traditional string constants
export const FETCH_USERS_REQUEST = 'users/FETCH_USERS_REQUEST'
export const FETCH_USERS_SUCCESS = 'users/FETCH_USERS_SUCCESS'
export const FETCH_USERS_FAILURE = 'users/FETCH_USERS_FAILURE'

// Namespace organization
const USER_ACTIONS = {
  FETCH_REQUEST: 'users/FETCH_REQUEST',
  FETCH_SUCCESS: 'users/FETCH_SUCCESS',
  FETCH_FAILURE: 'users/FETCH_FAILURE',
  UPDATE_REQUEST: 'users/UPDATE_REQUEST',
  UPDATE_SUCCESS: 'users/UPDATE_SUCCESS',
  UPDATE_FAILURE: 'users/UPDATE_FAILURE'
}

// RTK automatic type generation
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchRequest: (state) => {
      state.loading = true
    },
    fetchSuccess: (state, action) => {
      state.loading = false
      state.users = action.payload
    }
  }
})
// Auto-generated: users/fetchRequest, users/fetchSuccess
```


### 2. REDUCERS - ADVANCED PATTERNS


**Pure Reducer Functions:**


```javascript
// Traditional Reducer với immutable updates
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_USER_SUCCESS':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, ...action.payload }
            : user
        ),
        lastUpdated: Date.now()
      }

    case 'DELETE_USER_SUCCESS':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload.id),
        totalCount: state.totalCount - 1
      }

    default:
      return state
  }
}
```


**Advanced Reducer Patterns:**


```javascript
// Reducer Composition
const createEntityReducer = (entityName) => {
  return (state = { byId: {}, allIds: [] }, action) => {
    switch (action.type) {
      case `FETCH_${entityName}_SUCCESS`:
        const entities = action.payload.reduce((acc, entity) => {
          acc[entity.id] = entity
          return acc
        }, {})

        return {
          byId: { ...state.byId, ...entities },
          allIds: [...new Set([...state.allIds, ...Object.keys(entities)])]
        }

      case `UPDATE_${entityName}_SUCCESS`:
        return {
          ...state,
          byId: {
            ...state.byId,
            [action.payload.id]: {
              ...state.byId[action.payload.id],
              ...action.payload
            }
          }
        }

      case `DELETE_${entityName}_SUCCESS`:
        const { [action.payload.id]: deleted, ...restById } = state.byId
        return {
          byId: restById,
          allIds: state.allIds.filter(id => id !== action.payload.id)
        }

      default:
        return state
    }
  }
}

// Usage
const usersReducer = createEntityReducer('USERS')
const postsReducer = createEntityReducer('POSTS')
```


**RTK createSlice - Modern Approach:**


```javascript
// Immer integration - mutative logic that produces immutable updates
const userSlice = createSlice({
  name: 'users',
  initialState: {
    entities: {},
    ids: [],
    loading: false,
    error: null,
    filters: {
      search: '',
      status: 'all'
    }
  },
  reducers: {
    // Standard reducers
    setLoading: (state, action) => {
      state.loading = action.payload
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    // Prepare callback để customize payload
    addUser: {
      reducer: (state, action) => {
        const user = action.payload
        state.entities[user.id] = user
        state.ids.push(user.id)
      },
      prepare: (userData) => ({
        payload: {
          id: nanoid(),
          ...userData,
          createdAt: Date.now()
        }
      })
    }
  },

  // Handle async actions
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.entities = {}
        state.ids = []

        action.payload.forEach(user => {
          state.entities[user.id] = user
          state.ids.push(user.id)
        })
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})
```


**Reducer Higher-Order Functions:**


```javascript
// HOF để tái sử dụng reducer logic
const createAsyncReducer = (actionTypes) => {
  const [REQUEST, SUCCESS, FAILURE] = actionTypes

  return (state = { data: null, loading: false, error: null }, action) => {
    switch (action.type) {
      case REQUEST:
        return {
          ...state,
          loading: true,
          error: null
        }

      case SUCCESS:
        return {
          data: action.payload,
          loading: false,
          error: null
        }

      case FAILURE:
        return {
          data: null,
          loading: false,
          error: action.payload
        }

      default:
        return state
    }
  }
}

// Usage
const usersReducer = createAsyncReducer([
  'FETCH_USERS_REQUEST',
  'FETCH_USERS_SUCCESS',
  'FETCH_USERS_FAILURE'
])
```


### 3. STORE - ADVANCED CONFIGURATION


**Store Creation & Enhancement:**


```javascript
// Traditional store setup
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  posts: postsReducer,
  ui: uiReducer
})

// Middleware composition
const middleware = [thunk]

if (process.env.NODE_ENV === 'development') {
  const { logger } = require('redux-logger')
  middleware.push(logger)
}

// DevTools extension
const composeEnhancers =
  (typeof window !== 'undefined' &&
   window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(...middleware))
)
```


**RTK configureStore - Modern Approach:**


```javascript
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    users: usersSlice.reducer,
    posts: postsSlice.reducer,
    api: apiSlice.reducer
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // RTK default middleware includes thunk, serializable check, etc.
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['api.queries']
      },
      immutableCheck: {
        ignoredPaths: ['api.queries']
      }
    })
    .concat(apiSlice.middleware) // Add RTK Query middleware
    .concat(analyticsMiddleware) // Custom middleware
    .concat(crashReportingMiddleware),

  devTools: process.env.NODE_ENV !== 'production' && {
    trace: true,
    traceLimit: 25,
    actionSanitizer: (action) => ({
      ...action,
      // Remove sensitive data from DevTools
      payload: action.type.includes('password') ? '[REDACTED]' : action.payload
    }),
    stateSanitizer: (state) => ({
      ...state,
      auth: {
        ...state.auth,
        token: state.auth.token ? '[REDACTED]' : null
      }
    })
  },

  preloadedState: {
    // Initial state từ localStorage hoặc server
    auth: {
      user: JSON.parse(localStorage.getItem('user')),
      token: localStorage.getItem('token')
    }
  }
})

// Type definitions cho TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```


**Store Subscription & Listeners:**


```javascript
// Manual subscriptions
const unsubscribe = store.subscribe(() => {
  const state = store.getState()

  // Persist auth state
  localStorage.setItem('user', JSON.stringify(state.auth.user))
  localStorage.setItem('token', state.auth.token)

  // Analytics tracking
  if (state.analytics.events.length > 0) {
    analytics.track(state.analytics.events)
    store.dispatch(clearAnalyticsEvents())
  }
})

// RTK Listener Middleware (Modern approach)
const listenerMiddleware = createListenerMiddleware()

// Listen để specific actions
listenerMiddleware.startListening({
  actionCreator: authSlice.actions.login,
  effect: async (action, listenerApi) => {
    // Side effects after login
    listenerApi.dispatch(fetchUserProfile())
    listenerApi.dispatch(initializeNotifications())

    // Analytics
    analytics.identify(action.payload.user.id)
  }
})

// Listen để state changes
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    return currentState.cart.items.length !== previousState.cart.items.length
  },
  effect: (action, listenerApi) => {
    const state = listenerApi.getState()
    analytics.track('cart_updated', {
      itemCount: state.cart.items.length
    })
  }
})
```


### 4. MIDDLEWARE - ADVANCED CONCEPTS


**Custom Middleware Development:**


```javascript
// Basic middleware structure
const customMiddleware = (store) => (next) => (action) => {
  // Before reducer
  console.log('Dispatching:', action)
  console.log('Current state:', store.getState())

  // Call next middleware/reducer
  const result = next(action)

  // After reducer
  console.log('Next state:', store.getState())

  return result
}

// Analytics middleware
const analyticsMiddleware = (store) => (next) => (action) => {
  // Track all user actions
  if (action.type.startsWith('user/')) {
    analytics.track(action.type, {
      payload: action.payload,
      timestamp: Date.now(),
      userId: store.getState().auth.user?.id
    })
  }

  return next(action)
}

// Error reporting middleware
const crashReportingMiddleware = (store) => (next) => (action) => {
  try {
    return next(action)
  } catch (error) {
    console.error('Redux error:', error)

    // Send to error reporting service
    errorReporting.captureException(error, {
      action,
      state: store.getState(),
      timestamp: Date.now()
    })

    // Dispatch error action
    store.dispatch({
      type: 'GLOBAL_ERROR',
      payload: error.message,
      error: true
    })

    throw error
  }
}
```


**Advanced Middleware Patterns:**


```javascript
// API middleware với automatic retry
const apiMiddleware = (store) => (next) => (action) => {
  if (!action.meta?.api) {
    return next(action)
  }

  const { endpoint, method = 'GET', body, retries = 3 } = action.meta.api

  const makeRequest = async (attempt = 0) => {
    try {
      store.dispatch({
        type: `${action.type}_REQUEST`,
        meta: { attempt }
      })

      const response = await fetch(endpoint, {
        method,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.getState().auth.token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      store.dispatch({
        type: `${action.type}_SUCCESS`,
        payload: data
      })

    } catch (error) {
      if (attempt < retries && error.name !== 'ValidationError') {
        // Exponential backoff
        setTimeout(() => makeRequest(attempt + 1), Math.pow(2, attempt) * 1000)
      } else {
        store.dispatch({
          type: `${action.type}_FAILURE`,
          payload: error.message,
          error: true
        })
      }
    }
  }

  makeRequest()
  return next(action)
}

// Caching middleware
const cacheMiddleware = (store) => (next) => (action) => {
  if (action.meta?.cache) {
    const cacheKey = action.meta.cache.key
    const ttl = action.meta.cache.ttl || 300000 // 5 minutes

    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < ttl) {
      store.dispatch({
        type: `${action.type}_SUCCESS`,
        payload: cached.data,
        meta: { fromCache: true }
      })
      return
    }
  }

  return next(action)
}
```


**Middleware Composition & Order:**


```javascript
// Middleware execution order matters
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(crashReportingMiddleware) // First - catch all errors
      .concat(analyticsMiddleware)      // Second - track actions
      .concat(cacheMiddleware)          // Third - check cache
      .concat(apiMiddleware)            // Fourth - make API calls
      .concat(loggerMiddleware)         // Last - log everything
})
```


### 5. PERFORMANCE & OPTIMIZATION


**Selector Optimization:**


```javascript
// Reselect cho memoized selectors
import { createSelector } from '@reduxjs/toolkit'

const selectUsers = (state) => state.users.entities
const selectUserFilters = (state) => state.users.filters

const selectFilteredUsers = createSelector(
  [selectUsers, selectUserFilters],
  (users, filters) => {
    return Object.values(users).filter(user => {
      if (filters.search) {
        return user.name.toLowerCase().includes(filters.search.toLowerCase())
      }
      if (filters.status !== 'all') {
        return user.status === filters.status
      }
      return true
    })
  }
)

// Parametrized selectors
const makeSelectUserPosts = () => createSelector(
  [(state) => state.posts.entities, (state, userId) => userId],
  (posts, userId) => {
    return Object.values(posts).filter(post => post.authorId === userId)
  }
)
```


**Store Structure Optimization:**


```javascript
// Normalized state structure
const initialState = {
  // Entities - normalized data
  users: {
    byId: {},
    allIds: []
  },
  posts: {
    byId: {},
    allIds: []
  },

  // UI State - separate từ business data
  ui: {
    users: {
      loading: false,
      error: null,
      selectedId: null,
      filters: {}
    },
    posts: {
      loading: false,
      error: null,
      currentPage: 1
    }
  },

  // App State - global app state
  app: {
    theme: 'light',
    language: 'en',
    notifications: []
  }
}
```


### 6. TESTING STRATEGIES


**Testing Actions:**


```javascript
// Testing action creators
describe('user actions', () => {
  it('should create login action', () => {
    const credentials = { email: 'test@example.com', password: 'password' }
    const expectedAction = {
      type: 'user/login',
      payload: credentials
    }
    expect(login(credentials)).toEqual(expectedAction)
  })
})

// Testing async actions
describe('async user actions', () => {
  it('should dispatch login success', async () => {
    const mockStore = configureMockStore([thunk])
    const store = mockStore({})

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    await store.dispatch(loginUser(credentials))

    const actions = store.getActions()
    expect(actions[0]).toEqual({ type: 'auth/loginUser/pending' })
    expect(actions[1]).toEqual({
      type: 'auth/loginUser/fulfilled',
      payload: mockUser
    })
  })
})
```


**Testing Reducers:**


```javascript
describe('user reducer', () => {
  it('should handle login success', () => {
    const previousState = {
      user: null,
      loading: true,
      error: null
    }

    const action = {
      type: 'auth/loginUser/fulfilled',
      payload: mockUser
    }

    const newState = authReducer(previousState, action)

    expect(newState).toEqual({
      user: mockUser,
      loading: false,
      error: null
    })
  })

  it('should not mutate state', () => {
    const previousState = { users: [mockUser] }
    const action = { type: 'users/add', payload: newUser }

    const newState = usersReducer(previousState, action)

    expect(newState).not.toBe(previousState)
    expect(newState.users).not.toBe(previousState.users)
  })
})
```


### 7. SENIOR/LEAD INTERVIEW SCENARIOS


**Architectural Questions:**


1. **Redux vs Context**: When would you choose Redux over Context API?
2. **State Normalization**: How do you structure normalized state for complex relationships?
3. **Middleware Order**: Why does middleware order matter và how do you decide?
4. **Performance**: What strategies do you use để optimize large Redux applications?


**Code Review Scenarios:**


- Review reducer purity và immutability
- Optimize expensive selector computations
- Identify middleware performance issues
- Evaluate action creator patterns


**Technical Deep Dives:**


1. **Time Travel**: How does Redux enable time travel debugging?
2. **Hot Reloading**: How do you implement hot reloading với Redux?
3. **Code Splitting**: How do you implement code splitting với Redux?
4. **SSR**: What considerations are there for Redux với SSR?


**Leadership Questions:**


1. How do you establish Redux conventions trong team?
2. What's your approach để migrating legacy Redux code?
3. How do you train junior developers on Redux patterns?
4. How do you evaluate när Redux is overkill for a project?


Với kiến thức sâu về Redux này, bạn có thể demonstrate expertise trong **predictable state management**, **application architecture**, **performance optimization**, và **complex async flow handling** - những skills quan trọng cho senior/lead positions trong large-scale React applications.


## Claude


## REDUX THUNK - CHI TIẾT CHO SENIOR/LEAD LEVEL (5+ YEARS)


### 1. THUNK FUNDAMENTALS


**What is Redux Thunk:**


```javascript
// Without Thunk - chỉ có thể dispatch plain objects
const action = {
  type: 'INCREMENT',
  payload: 1
}
store.dispatch(action) // ✅ Works

// With Thunk - có thể dispatch functions
const thunkAction = (dispatch, getState) => {
  dispatch({ type: 'INCREMENT', payload: 1 })
}
store.dispatch(thunkAction) // ✅ Works with thunk middleware
```


**Thunk Middleware Implementation:**


```javascript
// Simplified thunk middleware implementation
const thunk = ({ dispatch, getState }) => (next) => (action) => {
  // If action is a function, call it với dispatch và getState
  if (typeof action === 'function') {
    return action(dispatch, getState)
  }

  // Otherwise, pass action to next middleware
  return next(action)
}

// Full redux-thunk source (simplified)
const createThunkMiddleware = (extraArgument) => {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument)
    }
    return next(action)
  }
}
```


### 2. BASIC THUNK PATTERNS


**Simple Async Actions:**


```javascript
// Basic async thunk
const fetchUsers = () => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: 'FETCH_USERS_REQUEST' })

      const response = await api.getUsers()
      const users = response.data

      dispatch({
        type: 'FETCH_USERS_SUCCESS',
        payload: users
      })

    } catch (error) {
      dispatch({
        type: 'FETCH_USERS_FAILURE',
        payload: error.message
      })
    }
  }
}

// Usage
store.dispatch(fetchUsers())
```


**Conditional Dispatching:**


```javascript
const fetchUserIfNeeded = (userId) => {
  return (dispatch, getState) => {
    const state = getState()
    const user = state.users.byId[userId]

    // Only fetch if user doesn't exist hoặc data is stale
    if (!user || isStale(user.lastUpdated)) {
      return dispatch(fetchUser(userId))
    }

    // Return resolved promise để maintain consistent API
    return Promise.resolve(user)
  }
}

const isStale = (timestamp) => {
  const FIVE_MINUTES = 5 * 60 * 1000
  return Date.now() - timestamp > FIVE_MINUTES
}
```


**Sequential Actions:**


```javascript
const loginAndFetchDashboard = (credentials) => {
  return async (dispatch, getState) => {
    try {
      // Step 1: Login
      await dispatch(login(credentials))

      // Step 2: Get user from updated state
      const user = getState().auth.user

      // Step 3: Fetch user-specific data
      await Promise.all([
        dispatch(fetchUserProfile(user.id)),
        dispatch(fetchUserNotifications(user.id)),
        dispatch(fetchUserPreferences(user.id))
      ])

      // Step 4: Initialize real-time connections
      dispatch(initializeWebSocket(user.id))

    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Login failed: ' + error.message
      }))
    }
  }
}
```


### 3. ADVANCED THUNK PATTERNS


**Thunk với Return Values:**


```javascript
const fetchUser = (userId) => {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_USER_REQUEST', payload: { userId } })

    try {
      const response = await api.getUser(userId)
      const user = response.data

      dispatch({
        type: 'FETCH_USER_SUCCESS',
        payload: user
      })

      // Return user để caller có thể sử dụng
      return user

    } catch (error) {
      dispatch({
        type: 'FETCH_USER_FAILURE',
        payload: { userId, error: error.message }
      })

      // Re-throw để caller có thể handle error
      throw error
    }
  }
}

// Usage với returned value
const handleUserSelect = (userId) => {
  return async (dispatch) => {
    try {
      const user = await dispatch(fetchUser(userId))

      // Use returned user data
      dispatch(updateSelectedUser(user))
      dispatch(fetchUserPosts(user.id))

    } catch (error) {
      console.error('Failed to select user:', error)
    }
  }
}
```


**Higher-Order Thunks:**


```javascript
// Generic async thunk creator
const createAsyncThunk = (types, apiCall) => {
  const [REQUEST, SUCCESS, FAILURE] = types

  return (...args) => {
    return async (dispatch, getState) => {
      dispatch({ type: REQUEST })

      try {
        const result = await apiCall(...args)
        dispatch({ type: SUCCESS, payload: result })
        return result
      } catch (error) {
        dispatch({ type: FAILURE, payload: error.message })
        throw error
      }
    }
  }
}

// Usage
const fetchUsers = createAsyncThunk(
  ['FETCH_USERS_REQUEST', 'FETCH_USERS_SUCCESS', 'FETCH_USERS_FAILURE'],
  api.getUsers
)

const fetchUser = createAsyncThunk(
  ['FETCH_USER_REQUEST', 'FETCH_USER_SUCCESS', 'FETCH_USER_FAILURE'],
  api.getUser
)
```


**Thunk với Extra Arguments:**


```javascript
// Configure thunk với extra arguments
const thunk = require('redux-thunk').default

const api = {
  getUsers: () => fetch('/api/users'),
  getPosts: () => fetch('/api/posts')
}

const logger = console

const store = createStore(
  reducer,
  applyMiddleware(thunk.withExtraArgument({ api, logger }))
)

// Thunk sử dụng extra arguments
const fetchUsers = () => {
  return async (dispatch, getState, { api, logger }) => {
    logger.info('Fetching users...')

    try {
      const response = await api.getUsers()
      const users = await response.json()

      dispatch({
        type: 'FETCH_USERS_SUCCESS',
        payload: users
      })

      logger.info('Users fetched successfully')

    } catch (error) {
      logger.error('Failed to fetch users:', error)
      dispatch({
        type: 'FETCH_USERS_FAILURE',
        payload: error.message
      })
    }
  }
}
```


### 4. ERROR HANDLING STRATEGIES


**Comprehensive Error Handling:**


```javascript
const fetchUserWithErrorHandling = (userId) => {
  return async (dispatch, getState) => {
    const requestId = `fetch_user_${userId}_${Date.now()}`

    dispatch({
      type: 'FETCH_USER_REQUEST',
      payload: { userId, requestId }
    })

    try {
      const response = await api.getUser(userId)

      // Handle different response scenarios
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const user = await response.json()

      // Validate response data
      if (!user || !user.id) {
        throw new Error('Invalid user data received')
      }

      dispatch({
        type: 'FETCH_USER_SUCCESS',
        payload: user,
        meta: { requestId }
      })

      return user

    } catch (error) {
      let errorMessage = 'An unexpected error occurred'
      let errorCode = 'UNKNOWN_ERROR'

      if (error.name === 'NetworkError') {
        errorMessage = 'Network connection failed'
        errorCode = 'NETWORK_ERROR'
      } else if (error.message.includes('404')) {
        errorMessage = 'User not found'
        errorCode = 'USER_NOT_FOUND'
      } else if (error.message.includes('401')) {
        errorMessage = 'Unauthorized access'
        errorCode = 'UNAUTHORIZED'
        // Auto logout on auth errors
        dispatch(logout())
      }

      dispatch({
        type: 'FETCH_USER_FAILURE',
        payload: {
          userId,
          error: errorMessage,
          code: errorCode,
          originalError: error.message
        },
        meta: { requestId }
      })

      // Log error để monitoring
      console.error('Fetch user error:', {
        userId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })

      throw error
    }
  }
}
```


**Global Error Handling:**


```javascript
const withGlobalErrorHandling = (thunk) => {
  return (...args) => {
    return async (dispatch, getState, extraArg) => {
      try {
        return await thunk(...args)(dispatch, getState, extraArg)
      } catch (error) {
        // Global error handling
        dispatch({
          type: 'GLOBAL_ERROR_OCCURRED',
          payload: {
            error: error.message,
            action: thunk.name || 'unknown',
            timestamp: Date.now(),
            userId: getState().auth.user?.id
          }
        })

        // Send to error reporting service
        if (window.Sentry) {
          window.Sentry.captureException(error, {
            tags: {
              action: thunk.name,
              userId: getState().auth.user?.id
            }
          })
        }

        throw error
      }
    }
  }
}

// Usage
const fetchUsers = withGlobalErrorHandling(() => {
  return async (dispatch) => {
    const response = await api.getUsers()
    dispatch({ type: 'FETCH_USERS_SUCCESS', payload: response.data })
  }
})
```


### 5. CANCELLATION & CLEANUP


**Request Cancellation:**


```javascript
// Using AbortController để cancel requests
const fetchUsersWithCancellation = () => {
  return async (dispatch, getState) => {
    // Cancel any ongoing request
    const currentController = getState().api.usersController
    if (currentController) {
      currentController.abort()
    }

    const controller = new AbortController()

    dispatch({
      type: 'FETCH_USERS_REQUEST',
      payload: { controller }
    })

    try {
      const response = await fetch('/api/users', {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const users = await response.json()

      dispatch({
        type: 'FETCH_USERS_SUCCESS',
        payload: users
      })

    } catch (error) {
      if (error.name === 'AbortError') {
        dispatch({ type: 'FETCH_USERS_CANCELLED' })
      } else {
        dispatch({
          type: 'FETCH_USERS_FAILURE',
          payload: error.message
        })
      }
    }
  }
}

// Cancel action
const cancelFetchUsers = () => {
  return (dispatch, getState) => {
    const controller = getState().api.usersController
    if (controller) {
      controller.abort()
    }
  }
}
```


**Cleanup on Component Unmount:**


```javascript
// Track ongoing requests
const requestTracker = new Map()

const createCancellableThunk = (key, thunk) => {
  return (...args) => {
    return async (dispatch, getState, extraArg) => {
      // Cancel previous request với same key
      if (requestTracker.has(key)) {
        requestTracker.get(key).cancel()
      }

      let cancelled = false
      const cancel = () => { cancelled = true }

      requestTracker.set(key, { cancel })

      try {
        const result = await thunk(...args)(dispatch, getState, extraArg)

        if (cancelled) {
          throw new Error('Operation cancelled')
        }

        return result

      } finally {
        requestTracker.delete(key)
      }
    }
  }
}

// Usage trong component
useEffect(() => {
  dispatch(fetchUserData(userId))

  return () => {
    // Cleanup on unmount
    dispatch(cancelUserDataFetch())
  }
}, [userId])
```


### 6. PERFORMANCE OPTIMIZATION


**Debounced Thunks:**


```javascript
// Debounce search requests
const debouncedSearch = (() => {
  let timeoutId

  return (searchTerm) => {
    return (dispatch) => {
      clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        dispatch(performSearch(searchTerm))
      }, 300)
    }
  }
})()

const performSearch = (searchTerm) => {
  return async (dispatch) => {
    if (!searchTerm.trim()) {
      dispatch({ type: 'CLEAR_SEARCH_RESULTS' })
      return
    }

    dispatch({ type: 'SEARCH_REQUEST', payload: searchTerm })

    try {
      const response = await api.search(searchTerm)
      dispatch({
        type: 'SEARCH_SUCCESS',
        payload: response.data
      })
    } catch (error) {
      dispatch({
        type: 'SEARCH_FAILURE',
        payload: error.message
      })
    }
  }
}
```


**Caching Strategies:**


```javascript
// Simple memory cache
const cache = new Map()

const fetchUserWithCache = (userId, forceRefresh = false) => {
  return async (dispatch, getState) => {
    const cacheKey = `user_${userId}`
    const cached = cache.get(cacheKey)

    // Return cached data if available và not forcing refresh
    if (cached && !forceRefresh) {
      const age = Date.now() - cached.timestamp
      const MAX_AGE = 5 * 60 * 1000 // 5 minutes

      if (age < MAX_AGE) {
        dispatch({
          type: 'FETCH_USER_SUCCESS',
          payload: cached.data,
          meta: { fromCache: true }
        })
        return cached.data
      }
    }

    // Fetch fresh data
    dispatch({ type: 'FETCH_USER_REQUEST', payload: userId })

    try {
      const response = await api.getUser(userId)
      const user = response.data

      // Update cache
      cache.set(cacheKey, {
        data: user,
        timestamp: Date.now()
      })

      dispatch({
        type: 'FETCH_USER_SUCCESS',
        payload: user
      })

      return user

    } catch (error) {
      dispatch({
        type: 'FETCH_USER_FAILURE',
        payload: error.message
      })
      throw error
    }
  }
}
```


### 7. TESTING REDUX THUNKS


**Basic Thunk Testing:**


```javascript
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fetchMock from 'fetch-mock'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('async actions', () => {
  afterEach(() => {
    fetchMock.restore()
  })

  it('creates FETCH_USERS_SUCCESS when fetching users has been done', async () => {
    const users = [{ id: 1, name: 'John' }]

    fetchMock.getOnce('/api/users', {
      body: users,
      headers: { 'content-type': 'application/json' }
    })

    const expectedActions = [
      { type: 'FETCH_USERS_REQUEST' },
      { type: 'FETCH_USERS_SUCCESS', payload: users }
    ]

    const store = mockStore({ users: [] })

    await store.dispatch(fetchUsers())
    expect(store.getActions()).toEqual(expectedActions)
  })

  it('creates FETCH_USERS_FAILURE when fetch fails', async () => {
    fetchMock.getOnce('/api/users', {
      status: 500,
      body: { message: 'Internal Server Error' }
    })

    const expectedActions = [
      { type: 'FETCH_USERS_REQUEST' },
      {
        type: 'FETCH_USERS_FAILURE',
        payload: 'HTTP 500: Internal Server Error'
      }
    ]

    const store = mockStore({ users: [] })

    await store.dispatch(fetchUsers())
    expect(store.getActions()).toEqual(expectedActions)
  })
})
```


**Advanced Testing với Mocks:**


```javascript
// Mock external dependencies
jest.mock('../../services/api')
jest.mock('../../utils/analytics')

describe('complex thunk testing', () => {
  let store
  let mockApi
  let mockAnalytics

  beforeEach(() => {
    mockApi = require('../../services/api')
    mockAnalytics = require('../../utils/analytics')
    store = mockStore({
      auth: { user: { id: 1 } },
      users: { byId: {}, allIds: [] }
    })
  })

  it('should handle conditional fetching', async () => {
    // Setup mocks
    mockApi.getUser.mockResolvedValueOnce({
      data: { id: 1, name: 'John', lastUpdated: Date.now() }
    })

    await store.dispatch(fetchUserIfNeeded(1))

    // Verify API was called
    expect(mockApi.getUser).toHaveBeenCalledWith(1)

    // Verify analytics tracking
    expect(mockAnalytics.track).toHaveBeenCalledWith(
      'user_fetched',
      expect.any(Object)
    )

    // Verify dispatched actions
    const actions = store.getActions()
    expect(actions).toContainEqual(
      expect.objectContaining({ type: 'FETCH_USER_SUCCESS' })
    )
  })

  it('should skip fetch if data is fresh', async () => {
    // Update store state với fresh data
    store = mockStore({
      users: {
        byId: {
          1: { id: 1, name: 'John', lastUpdated: Date.now() }
        }
      }
    })

    await store.dispatch(fetchUserIfNeeded(1))

    // Verify API was not called
    expect(mockApi.getUser).not.toHaveBeenCalled()
  })
})
```


### 8. MIGRATION TO MODERN ALTERNATIVES


**From Thunk to RTK createAsyncThunk:**


```javascript
// Old thunk approach
const fetchUsers = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_USERS_REQUEST' })
    try {
      const response = await api.getUsers()
      dispatch({ type: 'FETCH_USERS_SUCCESS', payload: response.data })
    } catch (error) {
      dispatch({ type: 'FETCH_USERS_FAILURE', payload: error.message })
    }
  }
}

// New RTK approach
const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getUsers()
      return response.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Handle trong slice
const usersSlice = createSlice({
  name: 'users',
  initialState: { data: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})
```


### 9. SENIOR/LEAD INTERVIEW SCENARIOS


**Architectural Questions:**


1. **When to Use Thunk**: When would you choose thunk over saga hoặc observable?
2. **Performance**: How do you optimize thunk performance trong large applications?
3. **Error Handling**: What's your strategy for global error handling trong thunks?
4. **Testing**: How do you test complex thunk scenarios với multiple dependencies?


**Code Review Scenarios:**


```javascript
// Problem: Inefficient thunk
const fetchUserPosts = (userId) => {
  return async (dispatch) => {
    const user = await dispatch(fetchUser(userId))
    const posts = await dispatch(fetchPosts(user.id))
    return { user, posts }
  }
}

// Issues to identify:
// 1. Sequential requests instead of parallel
// 2. No error handling
// 3. Redundant user fetch
// 4. No caching strategy
```


**Technical Deep Dives:**


1. **Thunk vs Promise**: How do thunks handle promises differently than regular action creators?
2. **Memory Leaks**: What are common memory leak patterns trong thunks?
3. **Race Conditions**: How do you handle race conditions trong async thunks?
4. **State Consistency**: How do you ensure state consistency với multiple concurrent thunks?


**Real-World Scenarios:**


1. **E-commerce Cart**: Implement cart operations với optimistic updates
2. **Real-time Chat**: Handle WebSocket connections và message synchronization
3. **File Upload**: Implement progress tracking và cancellation
4. **Offline Support**: Handle offline scenarios với queue management


**Leadership Questions:**


1. How do you establish thunk patterns và conventions cho team?
2. What's your approach để migrating from thunk to modern alternatives?
3. How do you train junior developers on async flow patterns?
4. How do you debug complex thunk issues trong production?


Với kiến thức sâu về Redux Thunk này, bạn có thể demonstrate expertise trong **asynchronous state management**, **complex data flow orchestration**, **error handling strategies**, và **performance optimization** - những skills quan trọng cho senior/lead positions trong applications yêu cầu sophisticated async operations.


## Claude


## REACT CONTEXT API - CHI TIẾT CHO SENIOR/LEAD LEVEL (5+ YEARS)


### 1. CONTEXT FUNDAMENTALS


**What is Context API:**


```javascript
// Problem: Prop drilling
function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  return (
    <Header user={user} theme={theme} />
    <Main user={user} theme={theme} />
    <Footer theme={theme} />
  )
}

function Header({ user, theme }) {
  return <Navigation user={user} theme={theme} />
}

function Navigation({ user, theme }) {
  return <UserProfile user={user} theme={theme} />
}

// Solution: Context API
const UserContext = createContext()
const ThemeContext = createContext()

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <Header />
        <Main />
        <Footer />
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}
```


**Context Creation Patterns:**


```javascript
// Basic context creation
const MyContext = createContext()

// Context với default value
const ThemeContext = createContext('light')

// Context với complex default value
const AppContext = createContext({
  user: null,
  theme: 'light',
  language: 'en',
  updateUser: () => {},
  updateTheme: () => {},
  updateLanguage: () => {}
})

// Context với TypeScript
interface User {
  id: string
  name: string
  email: string
}

interface UserContextValue {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextValue | null>(null)
```


### 2. PROVIDER PATTERNS


**Basic Provider Setup:**


```javascript
// Simple provider
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const value = {
    theme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
```


**Provider với useReducer:**


```javascript
// Complex state management với useReducer
const initialState = {
  user: null,
  loading: false,
  error: null,
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: true
  }
}

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      }

    case 'LOGOUT':
      return { ...initialState }

    default:
      return state
  }
}

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Action creators
  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const user = await auth.login(credentials)
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    auth.logout()
  }

  const updatePreferences = (preferences) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }

  const value = {
    ...state,
    login,
    logout,
    updatePreferences
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
```


**Performance Optimized Provider:**


```javascript
// Split context để prevent unnecessary re-renders
const StateContext = createContext()
const ActionsContext = createContext()

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Memoize actions để prevent re-creation
  const actions = useMemo(() => ({
    login: async (credentials) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const user = await auth.login(credentials)
        dispatch({ type: 'SET_USER', payload: user })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    },
    logout: () => {
      dispatch({ type: 'LOGOUT' })
      auth.logout()
    }
  }), [])

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  )
}
```


### 3. CONTEXT CONSUMPTION PATTERNS


**useContext Hook:**


```javascript
// Basic consumption
const MyComponent = () => {
  const { user, theme } = useContext(AppContext)

  return (
    <div className={`app-${theme}`}>
      <h1>Welcome, {user?.name}</h1>
    </div>
  )
}

// Error handling trong context consumption
const MyComponent = () => {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('MyComponent must be used within AppProvider')
  }

  const { user, theme } = context

  return (
    <div className={`app-${theme}`}>
      <h1>Welcome, {user?.name}</h1>
    </div>
  )
}
```


**Custom Context Hooks:**


```javascript
// Custom hook với error handling
const useAppContext = () => {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }

  return context
}

// Custom hook với selector pattern
const useAppState = () => {
  const context = useContext(StateContext)

  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }

  return context
}

const useAppActions = () => {
  const context = useContext(ActionsContext)

  if (!context) {
    throw new Error('useAppActions must be used within AppProvider')
  }

  return context
}

// Selector-based consumption
const useUser = () => {
  const { user } = useAppState()
  return user
}

const useTheme = () => {
  const { preferences } = useAppState()
  return preferences.theme
}

const useIsLoading = () => {
  const { loading } = useAppState()
  return loading
}
```


**Context Consumer (Legacy Pattern):**


```javascript
// Consumer pattern (legacy, but still useful trong certain cases)
const MyComponent = () => {
  return (
    <AppContext.Consumer>
      {(context) => {
        if (!context) {
          return <div>Loading...</div>
        }

        const { user, theme } = context

        return (
          <div className={`app-${theme}`}>
            <h1>Welcome, {user?.name}</h1>
          </div>
        )
      }}
    </AppContext.Consumer>
  )
}

// Multiple context consumption
const MyComponent = () => {
  return (
    <UserContext.Consumer>
      {user => (
        <ThemeContext.Consumer>
          {theme => (
            <div className={`app-${theme}`}>
              <h1>Welcome, {user?.name}</h1>
            </div>
          )}
        </ThemeContext.Consumer>
      )}
    </UserContext.Consumer>
  )
}
```


### 4. PERFORMANCE OPTIMIZATION


**Preventing Unnecessary Re-renders:**


```javascript
// Problem: Object recreation causes re-renders
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  // ❌ Bad: Creates new object on every render
  const value = {
    user,
    theme,
    setUser,
    setTheme
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// ✅ Solution: Memoize context value
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  const value = useMemo(() => ({
    user,
    theme,
    setUser,
    setTheme
  }), [user, theme])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
```


**Context Splitting Strategy:**


```javascript
// Split frequently changing và rarely changing data
const UserContext = createContext() // Rarely changes
const UIContext = createContext()   // Frequently changes (theme, modals, etc.)

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const value = useMemo(() => ({
    user,
    setUser
  }), [user])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

const UIProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [sidebar, setSidebar] = useState(false)

  const value = useMemo(() => ({
    theme,
    sidebar,
    setTheme,
    setSidebar
  }), [theme, sidebar])

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}

// App structure
function App() {
  return (
    <UserProvider>
      <UIProvider>
        <Router>
          <Routes />
        </Router>
      </UIProvider>
    </UserProvider>
  )
}
```


**Selective Context Updates:**


```javascript
// Fine-grained updates với multiple contexts
const createStore = (initialState) => {
  const StateContext = createContext()
  const UpdaterContext = createContext()

  const Provider = ({ children }) => {
    const [state, setState] = useState(initialState)

    // Memoize updater functions
    const updaters = useMemo(() => ({
      updateUser: (user) => setState(prev => ({ ...prev, user })),
      updateTheme: (theme) => setState(prev => ({ ...prev, theme })),
      updatePreferences: (preferences) => setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...preferences }
      }))
    }), [])

    return (
      <StateContext.Provider value={state}>
        <UpdaterContext.Provider value={updaters}>
          {children}
        </UpdaterContext.Provider>
      </StateContext.Provider>
    )
  }

  const useState = () => {
    const state = useContext(StateContext)
    const updaters = useContext(UpdaterContext)

    if (!state || !updaters) {
      throw new Error('useState must be used within Provider')
    }

    return [state, updaters]
  }

  return { Provider, useState }
}

// Usage
const { Provider: AppProvider, useState: useAppState } = createStore({
  user: null,
  theme: 'light',
  preferences: {}
})
```


### 5. ADVANCED PATTERNS


**Context với Immer:**


```javascript
import { produce } from 'immer'

const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState)

  const updateState = useCallback((updater) => {
    setState(current => produce(current, updater))
  }, [])

  const actions = useMemo(() => ({
    updateUser: (userData) => {
      updateState(draft => {
        draft.user = { ...draft.user, ...userData }
      })
    },

    addNotification: (notification) => {
      updateState(draft => {
        draft.notifications.push({
          ...notification,
          id: nanoid(),
          timestamp: Date.now()
        })
      })
    },

    removeNotification: (id) => {
      updateState(draft => {
        const index = draft.notifications.findIndex(n => n.id === id)
        if (index !== -1) {
          draft.notifications.splice(index, 1)
        }
      })
    }
  }), [updateState])

  const value = useMemo(() => ({
    state,
    actions
  }), [state, actions])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
```


**Context với Persistence:**


```javascript
const createPersistedContext = (key, initialValue) => {
  const Context = createContext()

  const Provider = ({ children }) => {
    const [state, setState] = useState(() => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : initialValue
      } catch {
        return initialValue
      }
    })

    // Persist changes
    useEffect(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to persist state:', error)
      }
    }, [state])

    const value = useMemo(() => ({
      state,
      setState
    }), [state])

    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    )
  }

  const useContext = () => {
    const context = useContext(Context)
    if (!context) {
      throw new Error('useContext must be used within Provider')
    }
    return context
  }

  return { Provider, useContext }
}

// Usage
const { Provider: PreferencesProvider, useContext: usePreferences } =
  createPersistedContext('user-preferences', {
    theme: 'light',
    language: 'en',
    notifications: true
  })
```


**Context Factory Pattern:**


```javascript
// Reusable context factory
const createAsyncResourceContext = (name, fetcher) => {
  const Context = createContext()

  const Provider = ({ children, resourceId }) => {
    const [state, setState] = useState({
      data: null,
      loading: false,
      error: null
    })

    const fetch = useCallback(async (id = resourceId) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const data = await fetcher(id)
        setState({ data, loading: false, error: null })
      } catch (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }))
      }
    }, [resourceId])

    const refetch = useCallback(() => fetch(resourceId), [fetch, resourceId])

    useEffect(() => {
      if (resourceId) {
        fetch(resourceId)
      }
    }, [resourceId, fetch])

    const value = useMemo(() => ({
      ...state,
      fetch,
      refetch
    }), [state, fetch, refetch])

    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    )
  }

  const useResource = () => {
    const context = useContext(Context)
    if (!context) {
      throw new Error(`use${name} must be used within ${name}Provider`)
    }
    return context
  }

  return { Provider, useResource }
}

// Usage
const { Provider: UserProvider, useResource: useUser } =
  createAsyncResourceContext('User', api.getUser)

const { Provider: PostsProvider, useResource: usePosts } =
  createAsyncResourceContext('Posts', api.getPosts)
```


### 6. CONTEXT COMPOSITION


**Multiple Context Providers:**


```javascript
// Context composition pattern
const AppProviders = ({ children }) => {
  return (
    <ErrorBoundaryProvider>
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <RouterProvider>
                {children}
              </RouterProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundaryProvider>
  )
}

// Or with composition helper
const composeProviders = (...providers) => {
  return providers.reduce(
    (AccumulatedProviders, CurrentProvider) => {
      return ({ children }) => (
        <AccumulatedProviders>
          <CurrentProvider>
            {children}
          </CurrentProvider>
        </AccumulatedProviders>
      )
    },
    ({ children }) => <>{children}</>
  )
}

const AppProviders = composeProviders(
  ErrorBoundaryProvider,
  QueryProvider,
  AuthProvider,
  ThemeProvider,
  NotificationProvider
)
```


**Context Dependencies:**


```javascript
// Dependent contexts
const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null)

  const value = useMemo(() => ({
    user: auth?.user || null,
    token: auth?.token || null,
    login: async (credentials) => {
      const response = await api.login(credentials)
      setAuth(response.data)
    },
    logout: () => {
      setAuth(null)
      api.logout()
    }
  }), [auth])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

const UserProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [preferences, setPreferences] = useState(null)

  useEffect(() => {
    if (user && token) {
      Promise.all([
        api.getUserProfile(user.id),
        api.getUserPreferences(user.id)
      ]).then(([profileData, preferencesData]) => {
        setProfile(profileData)
        setPreferences(preferencesData)
      })
    } else {
      setProfile(null)
      setPreferences(null)
    }
  }, [user, token])

  const value = useMemo(() => ({
    profile,
    preferences,
    updateProfile: setProfile,
    updatePreferences: setPreferences
  }), [profile, preferences])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
```


### 7. ERROR HANDLING & BOUNDARIES


**Context Error Boundaries:**


```javascript
const ContextErrorBoundary = ({ children, fallback, contextName }) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleError = (error) => {
      if (error.message.includes(contextName)) {
        setHasError(true)
        setError(error)
      }
    }

    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('error', handleError)
    }
  }, [contextName])

  if (hasError) {
    return fallback ? fallback(error) : (
      <div>
        <h2>Context Error</h2>
        <p>Failed to load {contextName} context</p>
        <button onClick={() => setHasError(false)}>
          Retry
        </button>
      </div>
    )
  }

  return children
}

// Usage
const App = () => {
  return (
    <ContextErrorBoundary
      contextName="Auth"
      fallback={(error) => <AuthErrorFallback error={error} />}
    >
      <AuthProvider>
        <Main />
      </AuthProvider>
    </ContextErrorBoundary>
  )
}
```


**Context Validation:**


```javascript
const createValidatedContext = (name, validator) => {
  const Context = createContext()

  const Provider = ({ value, children }) => {
    const validatedValue = useMemo(() => {
      try {
        return validator(value)
      } catch (error) {
        throw new Error(`Invalid ${name} context value: ${error.message}`)
      }
    }, [value])

    return (
      <Context.Provider value={validatedValue}>
        {children}
      </Context.Provider>
    )
  }

  const useContext = () => {
    const context = useContext(Context)
    if (context === undefined) {
      throw new Error(`use${name} must be used within ${name}Provider`)
    }
    return context
  }

  return { Provider, useContext }
}

// Usage với validation
const userValidator = (value) => {
  if (!value) throw new Error('User context value is required')
  if (!value.user && !value.loading) {
    throw new Error('Either user or loading state must be present')
  }
  return value
}

const { Provider: UserProvider, useContext: useUser } =
  createValidatedContext('User', userValidator)
```


### 8. TESTING CONTEXT


**Testing Context Providers:**


```javascript
import { render, screen } from '@testing-library/react'
import { act } from '@testing-library/react-hooks'

// Test utilities
const renderWithContext = (component, contextValue) => {
  const TestProvider = ({ children }) => (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )

  return render(component, { wrapper: TestProvider })
}

const createMockContextValue = (overrides = {}) => ({
  user: null,
  theme: 'light',
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  updateTheme: jest.fn(),
  ...overrides
})

describe('AppContext', () => {
  it('should provide default values', () => {
    const TestComponent = () => {
      const { user, theme } = useAppContext()
      return (
        <div>
          <span data-testid="user">{user?.name || 'No user'}</span>
          <span data-testid="theme">{theme}</span>
        </div>
      )
    }

    const contextValue = createMockContextValue()
    renderWithContext(<TestComponent />, contextValue)

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('should handle user login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ id: 1, name: 'John' })
    const contextValue = createMockContextValue({ login: mockLogin })

    const TestComponent = () => {
      const { login } = useAppContext()

      return (
        <button onClick={() => login({ email: 'test@example.com' })}>
          Login
        </button>
      )
    }

    renderWithContext(<TestComponent />, contextValue)

    await act(async () => {
      fireEvent.click(screen.getByText('Login'))
    })

    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com' })
  })
})

// Testing context hooks
import { renderHook } from '@testing-library/react-hooks'

describe('useAppContext', () => {
  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => useAppContext())

    expect(result.error).toEqual(
      Error('useAppContext must be used within AppProvider')
    )
  })

  it('should return context value when used within provider', () => {
    const contextValue = createMockContextValue({
      user: { id: 1, name: 'John' }
    })

    const wrapper = ({ children }) => (
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    )

    const { result } = renderHook(() => useAppContext(), { wrapper })

    expect(result.current.user).toEqual({ id: 1, name: 'John' })
  })
})
```


**Integration Testing:**


```javascript
describe('Context Integration', () => {
  it('should handle complete user flow', async () => {
    const App = () => (
      <AppProvider>
        <LoginForm />
        <UserProfile />
      </AppProvider>
    )

    render(<App />)

    // Initial state
    expect(screen.getByText('Please login')).toBeInTheDocument()

    // Login
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password' }
    })

    fireEvent.click(screen.getByText('Login'))

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument()
    })

    // Logout
    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByText('Please login')).toBeInTheDocument()
    })
  })
})
```


### 9. REAL-WORLD USE CASES


**Authentication Context:**


```javascript
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    loading: true,
    initialized: false
  })

  // Initialize auth from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const user = await api.validateToken(token)
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } })
        }
      } catch (error) {
        localStorage.removeItem('token')
      } finally {
        dispatch({ type: 'AUTH_INITIALIZED' })
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_REQUEST' })

    try {
      const response = await api.login(credentials)
      const { user, token } = response.data

      localStorage.setItem('token', token)
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } })

      return { success: true }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message })
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    dispatch({ type: 'AUTH_LOGOUT' })
    api.logout()
  }, [])

  const value = useMemo(() => ({
    ...state,
    login,
    logout
  }), [state, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```


**Theme Context với System Preference:**


```javascript
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  // Listen để system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e) => {
      const stored = localStorage.getItem('theme')
      if (!stored) { // Only follow system if user hasn't set preference
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Persist theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
    isLight: theme === 'light',
    isDark: theme === 'dark'
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
```


### 10. PERFORMANCE ANTI-PATTERNS


**Common Mistakes:**


```javascript
// ❌ Anti-pattern: Object creation trong render
const BadProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      // New object every render!
      metadata: { lastLogin: new Date() }
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ✅ Better: Memoized values
const GoodProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const value = useMemo(() => ({
    user,
    setUser,
    metadata: user ? { lastLogin: user.lastLogin } : null
  }), [user])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// ❌ Anti-pattern: Large context values
const MonolithicProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    posts: [],
    comments: [],
    notifications: [],
    ui: { theme: 'light', sidebar: false },
    preferences: {},
    analytics: {},
    cache: {}
  })

  // Any change causes all consumers to re-render
  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  )
}

// ✅ Better: Split contexts
const UserProvider = ({ children }) => { /* User-specific state */ }
const PostsProvider = ({ children }) => { /* Posts-specific state */ }
const UIProvider = ({ children }) => { /* UI-specific state */ }
```


### 11. SENIOR/LEAD INTERVIEW SCENARIOS


**Architectural Questions:**


1. **Context vs Redux**: When would you choose Context API over Redux?
2. **Performance**: How do you prevent Context from causing performance issues?
3. **Testing**: What's your strategy for testing Context providers và consumers?
4. **Migration**: How would you migrate from Redux to Context API?


**Code Review Scenarios:**


```javascript
// Problem: Identify issues trong this context implementation
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = async (credentials) => {
    setLoading(true)
    const response = await api.login(credentials)
    setUser(response.data)
    setLoading(false)
  }

  return (
    <AppContext.Provider value={{
      user,
      loading,
      login
    }}>
      {children}
    </AppContext.Provider>
  )
}

// Issues to identify:
// 1. No error handling trong async function
// 2. Value object recreated on every render
// 3. No cleanup on component unmount
// 4. No memoization of functions
// 5. State updates after unmount possible
```


**Technical Deep Dives:**


1. **Context Propagation**: How does React propagate context changes through the component tree?
2. **Bailout Optimization**: When does React skip re-rendering context consumers?
3. **Context vs Prop Drilling**: What are the trade-offs between Context và prop drilling?
4. **Server-Side Rendering**: What considerations are there for Context với SSR?


**Design Questions:**


1. How do you design a scalable context architecture for large applications?
2. What patterns do you use để compose multiple context providers?
3. How do you handle context dependency injection trong testing?
4. What's your approach để context state persistence?


**Leadership Questions:**


1. How do you establish Context patterns và conventions trong team?
2. What's your approach để training developers on Context best practices?
3. How do you evaluate when Context is appropriate vs other state solutions?
4. How do you handle Context performance issues trong large codebases?


Với kiến thức sâu về Context API này, bạn có thể demonstrate expertise trong **React state management**, **component architecture**, **performance optimization**, và **scalable application design** - những skills quan trọng cho senior/lead positions trong modern React applications.
