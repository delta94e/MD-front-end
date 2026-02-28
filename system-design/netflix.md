# Netflix Frontend High-Level Design (HLD)

**Author:** Senior Principal Front End Engineer  
**Version:** 2.0  
**Date:** January 2026  
**Target Audience:** Senior Engineers, System Design Interview Preparation

---

## Table of Contents

1. [Problem Statement & Requirements](#1-problem-statement--requirements)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [Data Flow & API Communication](#5-data-flow--api-communication)
6. [Performance Optimization](#6-performance-optimization)
7. [Error Handling & Edge Cases](#7-error-handling--edge-cases)
8. [Testing Strategy](#8-testing-strategy)
9. [Security Considerations](#9-security-considerations)
10. [Interview Cross-Questions](#10-interview-cross-questions)
11. [Summary & Architecture Rationale](#11-summary--architecture-rationale)

---

## 1. Problem Statement & Requirements

### 1.1 Problem Statement

Netflix là nền tảng streaming video lớn nhất thế giới, phục vụ hơn 230 triệu subscribers trên 190+ quốc gia. Frontend cần handle các thách thức unique:

**Core Challenges:**

- **Massive Scale**: 230M+ subscribers với 100M+ daily active users
- **Global Distribution**: Content delivery across 190+ countries với varying network conditions
- **Device Diversity**: Web, Smart TVs, Gaming Consoles, Mobile devices với different capabilities
- **Real-time Personalization**: ML-powered recommendations cần instant updates
- **Video Streaming Complexity**: Adaptive bitrate streaming, DRM, offline downloads
- **Engagement Optimization**: Giữ users engaged qua personalized UI/UX

### 1.2 Functional Requirements

#### Core Features

| Feature                 | Description                              | Priority |
| ----------------------- | ---------------------------------------- | -------- |
| **Video Playback**      | HLS/DASH streaming với adaptive bitrate  | P0       |
| **Content Discovery**   | Personalized rows, search, categories    | P0       |
| **User Profiles**       | Multiple profiles per account, Kids mode | P0       |
| **Watch History**       | Continue watching, progress sync         | P0       |
| **Offline Download**    | Download for offline viewing             | P1       |
| **Social Features**     | Profiles, watch parties                  | P2       |
| **Interactive Content** | Bandersnatch-style branching             | P2       |

#### User Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ROLES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   GUEST      │    │  SUBSCRIBER  │    │    ADMIN     │      │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤      │
│  │ • Browse     │    │ • Full       │    │ • Analytics  │      │
│  │   content    │    │   streaming  │    │ • Content    │      │
│  │ • Sign up    │    │ • Profiles   │    │   management │      │
│  │ • Pricing    │    │ • Downloads  │    │ • A/B tests  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │  KIDS USER   │    │   PREMIUM    │                          │
│  ├──────────────┤    ├──────────────┤                          │
│  │ • Filtered   │    │ • 4K/HDR     │                          │
│  │   content    │    │ • 4 screens  │                          │
│  │ • No mature  │    │ • Spatial    │                          │
│  │   ratings    │    │   audio      │                          │
│  └──────────────┘    └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Non-Functional Requirements

#### Performance Metrics

| Metric                             | Target                   | Rationale              |
| ---------------------------------- | ------------------------ | ---------------------- |
| **Time to First Byte (TTFB)**      | < 200ms                  | Global CDN requirement |
| **Largest Contentful Paint (LCP)** | < 2.5s                   | Core Web Vital         |
| **First Input Delay (FID)**        | < 100ms                  | Core Web Vital         |
| **Cumulative Layout Shift (CLS)**  | < 0.1                    | Core Web Vital         |
| **Time to Interactive (TTI)**      | < 3.5s                   | User engagement        |
| **Initial JS Bundle**              | < 200KB (gzipped)        | Fast initial load      |
| **Video Start Time**               | < 2s                     | Industry benchmark     |
| **Seek Latency**                   | < 500ms                  | Smooth UX              |
| **Frame Rate**                     | 60fps UI, 24-60fps video | Smooth animations      |
| **Memory Usage**                   | < 300MB (web)            | Device constraints     |

#### Reliability Targets

| Metric            | Target                            |
| ----------------- | --------------------------------- |
| **Availability**  | 99.99% (52 minutes downtime/year) |
| **Error Rate**    | < 0.1% of requests                |
| **Crash Rate**    | < 0.01% of sessions               |
| **Recovery Time** | < 5s for network failures         |

### 1.4 Scale Estimates

```
┌─────────────────────────────────────────────────────────────────┐
│                      SCALE METRICS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Subscribers     │ 230,000,000                           │
│  Daily Active Users    │ 100,000,000                           │
│  Peak Concurrent Users │ 15,000,000                            │
│  Avg Session Duration  │ 90 minutes                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    DAILY REQUESTS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Requests/Day      │ 50 billion                            │
│  Video Streams Started │ 500 million                           │
│  Search Queries        │ 200 million                           │
│  Recommendation Calls  │ 1 billion                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    DATA TRANSFER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Video Data/Day        │ 400 PB (Petabytes)                    │
│  API Data/Day          │ 5 TB                                  │
│  Image/Artwork Data    │ 50 TB                                 │
│  WebSocket Messages    │ 10 billion/day                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. High-Level Architecture

### 2.1 Architecture Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NETFLIX FRONTEND ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CDN LAYER (Edge)                                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │   CloudFront  │ │    Fastly     │ │   Akamai      │ │   Netflix     │       │
│  │    (Static)   │ │   (Video)     │ │  (Fallback)   │ │  Open Connect │       │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    WEB CLIENT       │    │   TV/DEVICE CLIENT  │    │   MOBILE CLIENT     │
│  (React + TS)       │    │  (React Native TV)  │    │  (React Native)     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION SHELL                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Service Worker Layer                             │   │
│  │  • Offline Support  • Cache Management  • Background Sync  • Push       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Router    │ │    Auth     │ │  Feature    │ │   Error     │              │
│  │   Layer     │ │   Guard     │ │   Flags     │ │  Boundary   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FEATURE MODULES (Lazy Loaded)                          │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │   BROWSE MODULE  │  │   WATCH MODULE   │  │  SEARCH MODULE   │             │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │             │
│  │  │ Hero       │  │  │  │ Player     │  │  │  │ Search Bar │  │             │
│  │  │ Carousel   │  │  │  │ Controls   │  │  │  │ Results    │  │             │
│  │  │ Content    │  │  │  │ Subtitles  │  │  │  │ Filters    │  │             │
│  │  │ Row        │  │  │  │ Quality    │  │  │  │ Suggest    │  │             │
│  │  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │             │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘             │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │  PROFILE MODULE  │  │ SETTINGS MODULE  │  │  ACCOUNT MODULE  │             │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STATE LAYER                                         │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     GLOBAL STATE (Zustand)                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │   User   │ │  Player  │ │   UI     │ │ Feature  │ │  Device  │      │   │
│  │  │  Store   │ │  Store   │ │  Store   │ │  Flags   │ │  Store   │      │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     SERVER STATE (TanStack Query)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │   │
│  │  │ Content  │ │  Search  │ │  User    │ │ Playback │                    │   │
│  │  │  Cache   │ │  Cache   │ │  Data    │ │  State   │                    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Request Manager                                  │   │
│  │  • Request Queue  • Retry Logic  • Rate Limiting  • Circuit Breaker     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │   REST Client    │  │  GraphQL Client  │  │  WebSocket       │             │
│  │   (Axios)        │  │  (Apollo/urql)   │  │  Client          │             │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES (BFF Pattern)                         │
│                                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │   API       │ │  Playback    │ │ Personalize  │ │   Search     │          │
│  │  Gateway    │ │  Service     │ │  Service     │ │   Service    │          │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT HIERARCHY                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    App
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ErrorBoundary    AuthProvider    ThemeProvider
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                              ┌──────┴──────┐
                              │   Router    │
                              └──────┬──────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
   ┌────┴────┐                 ┌─────┴─────┐                ┌────┴────┐
   │ Landing │                 │   Main    │                │  Auth   │
   │  Page   │                 │   Layout  │                │  Pages  │
   └─────────┘                 └─────┬─────┘                └─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐
              │  Header   │   │   Main    │   │  Footer   │
              │           │   │  Content  │   │           │
              └─────┬─────┘   └─────┬─────┘   └───────────┘
                    │               │
         ┌──────────┼──────────┐    │
         │          │          │    │
    ┌────┴───┐ ┌────┴───┐ ┌───┴────┐
    │ Logo   │ │ NavBar │ │Profile │
    │        │ │        │ │Dropdown│
    └────────┘ └────────┘ └────────┘

                           Main Content Routes
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
┌───┴────┐                  ┌─────┴─────┐                  ┌───┴────┐
│ Browse │                  │   Watch   │                  │ Search │
│  Page  │                  │   Page    │                  │  Page  │
└───┬────┘                  └─────┬─────┘                  └───┬────┘
    │                             │                             │
┌───┴───────────────┐    ┌───────┴───────────┐    ┌────────────┴───┐
│ ┌───────────────┐ │    │ ┌───────────────┐ │    │ ┌────────────┐ │
│ │   HeroBanner  │ │    │ │  VideoPlayer  │ │    │ │ SearchBar  │ │
│ └───────────────┘ │    │ └───────────────┘ │    │ └────────────┘ │
│ ┌───────────────┐ │    │ ┌───────────────┐ │    │ ┌────────────┐ │
│ │ ContentRow(s) │ │    │ │PlayerControls │ │    │ │SearchResult│ │
│ │  ┌─────────┐  │ │    │ └───────────────┘ │    │ │   Grid     │ │
│ │  │TitleCard│  │ │    │ ┌───────────────┐ │    │ └────────────┘ │
│ │  └─────────┘  │ │    │ │   Subtitles   │ │    │ ┌────────────┐ │
│ └───────────────┘ │    │ └───────────────┘ │    │ │  Filters   │ │
│ ┌───────────────┐ │    │ ┌───────────────┐ │    │ └────────────┘ │
│ │ ContentModal │ │    │ │ EpisodeList  │ │    └────────────────┘
│ └───────────────┘ │    │ └───────────────┘ │
└───────────────────┘    └───────────────────┘
```

### 2.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW DIAGRAM                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

                        ┌───────────────────┐
                        │   User Action     │
                        │  (Click, Scroll,  │
                        │   Input, etc.)    │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │   Event Handler   │
                        │  (React Component)│
                        └─────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  Local State    │ │  Global State   │ │  Server Action  │
    │  (useState)     │ │   (Zustand)     │ │  (API Call)     │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
             │                   │                   ▼
             │                   │         ┌─────────────────┐
             │                   │         │   API Layer     │
             │                   │         │  (Interceptors, │
             │                   │         │   Error Handle) │
             │                   │         └────────┬────────┘
             │                   │                   │
             │                   │                   ▼
             │                   │         ┌─────────────────┐
             │                   │         │  TanStack Query │
             │                   │         │  (Cache, Retry, │
             │                   │         │   Dedupe)       │
             │                   │         └────────┬────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   State Update  │
                        │   (Immutable)   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  React Re-render│
                        │  (Reconciliation)│
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   DOM Update    │
                        │  (Batch Update) │
                        └─────────────────┘
```

### 2.4 Architecture Principles

#### WHY This Architecture?

**1. Micro-Frontend Ready Structure**

```
Rationale: Netflix có nhiều teams độc lập phát triển features.
           Module-based architecture cho phép teams deploy independently.

Trade-off: + Independent deployment
           + Team autonomy
           - Bundle coordination complexity
           - Shared state challenges
```

**2. Server State vs Client State Separation**

```
Rationale: Server data (content, user info) và UI state (modal open, scroll position)
           có lifecycles hoàn toàn khác nhau.

Server State (TanStack Query):
  - Caching
  - Background refetching
  - Stale-while-revalidate

Client State (Zustand):
  - UI state
  - User preferences
  - Transient data
```

**3. BFF (Backend For Frontend) Pattern**

```
Rationale: Different clients (Web, TV, Mobile) cần different data shapes.
           BFF aggregates và transforms data cho từng platform.

Benefits:
  - Optimized payloads per platform
  - GraphQL flexibility
  - Reduced over-fetching
```

### 2.5 System Invariants

**Critical Rules That Must NEVER Be Violated:**

```typescript
/**
 * SYSTEM INVARIANTS - Netflix Frontend
 *
 * These are absolute rules that must be maintained
 * regardless of feature requirements or optimizations.
 */

// 1. Authentication State Consistency
invariant(
  !isAuthenticated || (user !== null && token !== null),
  "Authenticated users must always have valid user and token"
);

// 2. DRM Protection
invariant(
  !isPlaying || (drmLicense !== null && contentDecrypted),
  "Content playback requires valid DRM license"
);

// 3. Kids Profile Safety
invariant(
  !isKidsProfile || (maturityRating <= "PG" && parentalControlsActive),
  "Kids profiles must only show age-appropriate content"
);

// 4. Playback State Machine
invariant(
  playerState in ["idle", "loading", "buffering", "playing", "paused", "error"],
  "Player state must be in valid state machine states"
);

// 5. Memory Budget
invariant(
  memoryUsage < MAX_MEMORY_MB,
  "Memory usage must stay within device limits"
);

// 6. Network Request Deduplication
invariant(
  !hasDuplicateInflightRequests(requestKey),
  "Duplicate inflight requests must be deduplicated"
);

// 7. Offline Data Integrity
invariant(
  offlineContent.every((item) => item.expiryDate > now && item.licenseValid),
  "Offline content must have valid licenses and not be expired"
);
```

---

## 3. Component Architecture

### 3.1 Component Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       COMPONENT ARCHITECTURE                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

                            ATOMIC DESIGN LEVELS
    ─────────────────────────────────────────────────────────────────────────────

    ATOMS (Smallest units, no dependencies on other components)
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Button  │ │  Icon   │ │  Text   │ │  Image  │ │ Spinner │ │ Tooltip │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

    MOLECULES (Combinations of atoms)
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │ SearchInput    │ │ ProgressBar    │ │ RatingBadge    │ │ PlayButton     │
    │ ┌────┐ ┌────┐  │ │ ┌──────────┐   │ │ ┌────┐ ┌────┐  │ │ ┌────┐ ┌────┐  │
    │ │Icon│ │Input│  │ │ │Progress │   │ │ │Icon│ │Text│  │ │ │Icon│ │Text│  │
    │ └────┘ └────┘  │ │ └──────────┘   │ │ └────┘ └────┘  │ │ └────┘ └────┘  │
    └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

    ORGANISMS (Complex UI sections)
    ┌──────────────────────────────────────────────────────────────────────────┐
    │  ContentCard                                                             │
    │  ┌──────────────────────────────────────────────────────────────────┐   │
    │  │  ┌─────────────────────────┐  ┌─────────────────────────────┐   │   │
    │  │  │      ThumbnailImage     │  │        HoverPreview         │   │   │
    │  │  │  ┌─────┐ ┌───────────┐  │  │  ┌──────┐ ┌─────────────┐  │   │   │
    │  │  │  │Image│ │ProgressBar│  │  │  │Video │ │  InfoPanel  │  │   │   │
    │  │  │  └─────┘ └───────────┘  │  │  └──────┘ └─────────────┘  │   │   │
    │  │  └─────────────────────────┘  └─────────────────────────────┘   │   │
    │  │  ┌──────────────────────────────────────────────────────────┐   │   │
    │  │  │                      ActionBar                           │   │   │
    │  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │   │   │
    │  │  │  │ Play │ │ Add  │ │ Like │ │Unlike│ │ More │           │   │   │
    │  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │   │   │
    │  │  └──────────────────────────────────────────────────────────┘   │   │
    │  └──────────────────────────────────────────────────────────────────┘   │
    └──────────────────────────────────────────────────────────────────────────┘

    TEMPLATES (Page-level layouts)
    ┌──────────────────────────────────────────────────────────────────────────┐
    │  BrowseTemplate                                                          │
    │  ┌──────────────────────────────────────────────────────────────────┐   │
    │  │                           Header                                  │   │
    │  └──────────────────────────────────────────────────────────────────┘   │
    │  ┌──────────────────────────────────────────────────────────────────┐   │
    │  │                         HeroBanner                                │   │
    │  └──────────────────────────────────────────────────────────────────┘   │
    │  ┌──────────────────────────────────────────────────────────────────┐   │
    │  │  ContentRow: "Continue Watching"                                  │   │
    │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │   │
    │  │  │ Card   │ │ Card   │ │ Card   │ │ Card   │ │ Card   │   ...    │   │
    │  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │   │
    │  └──────────────────────────────────────────────────────────────────┘   │
    │  ┌──────────────────────────────────────────────────────────────────┐   │
    │  │  ContentRow: "Trending Now"                                       │   │
    │  └──────────────────────────────────────────────────────────────────┘   │
    └──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Smart vs Dumb Components

```typescript
// ============================================================================
// SMART COMPONENT (Container) - Handles logic, data fetching, state
// ============================================================================

/**
 * ContentRowContainer - Smart component that manages data and business logic
 *
 * Responsibilities:
 * - Data fetching via TanStack Query
 * - User interaction handling
 * - Analytics tracking
 * - Error state management
 */
interface ContentRowContainerProps {
  rowId: string;
  title: string;
  genre?: string;
}

const ContentRowContainer: React.FC<ContentRowContainerProps> = ({
  rowId,
  title,
  genre,
}) => {
  // Server state - TanStack Query handles caching, refetching, etc.
  const {
    data: contents,
    isLoading,
    isError,
    error,
    refetch,
  } = useContentRow(rowId, genre);

  // Local UI state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Global state - user preferences
  const { isAutoplayEnabled } = useUserPreferences();

  // Derived state
  const visibleItems = useMemo(
    () => contents?.slice(scrollPosition, scrollPosition + VISIBLE_COUNT),
    [contents, scrollPosition]
  );

  // Event handlers with analytics
  const handleItemHover = useCallback(
    (index: number, content: Content) => {
      setHoveredIndex(index);

      // Track engagement
      trackEvent("content_hover", {
        contentId: content.id,
        rowId,
        position: index,
      });
    },
    [rowId]
  );

  const handleItemClick = useCallback(
    (content: Content) => {
      // Navigation with state
      navigate(`/watch/${content.id}`, {
        state: { fromRow: rowId },
      });
    },
    [rowId]
  );

  // Error boundary fallback
  if (isError) {
    return <ContentRowError error={error} onRetry={() => refetch()} />;
  }

  // Delegate rendering to dumb component
  return (
    <ContentRowPresenter
      title={title}
      items={visibleItems}
      isLoading={isLoading}
      hoveredIndex={hoveredIndex}
      onItemHover={handleItemHover}
      onItemClick={handleItemClick}
      onScroll={setScrollPosition}
      showAutoplay={isAutoplayEnabled}
    />
  );
};

// ============================================================================
// DUMB COMPONENT (Presentational) - Pure rendering, no side effects
// ============================================================================

/**
 * ContentRowPresenter - Dumb component that only handles presentation
 *
 * Characteristics:
 * - Pure function of props
 * - No internal state (except UI-only state like animation)
 * - No data fetching
 * - Highly reusable and testable
 */
interface ContentRowPresenterProps {
  title: string;
  items: Content[] | undefined;
  isLoading: boolean;
  hoveredIndex: number | null;
  onItemHover: (index: number, content: Content) => void;
  onItemClick: (content: Content) => void;
  onScroll: (position: number) => void;
  showAutoplay: boolean;
}

const ContentRowPresenter: React.FC<ContentRowPresenterProps> = memo(
  ({
    title,
    items,
    isLoading,
    hoveredIndex,
    onItemHover,
    onItemClick,
    onScroll,
    showAutoplay,
  }) => {
    // Animation-only state is acceptable in dumb components
    const [isAnimating, setIsAnimating] = useState(false);

    if (isLoading) {
      return <ContentRowSkeleton />;
    }

    return (
      <section className="content-row" aria-label={title}>
        <h2 className="content-row__title">{title}</h2>

        <div
          className="content-row__slider"
          role="list"
          aria-busy={isAnimating}
        >
          {items?.map((item, index) => (
            <ContentCard
              key={item.id}
              content={item}
              isHovered={hoveredIndex === index}
              showAutoplay={showAutoplay && hoveredIndex === index}
              onHover={() => onItemHover(index, item)}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>

        <ScrollControls onScroll={onScroll} />
      </section>
    );
  }
);

ContentRowPresenter.displayName = "ContentRowPresenter";
```

### 3.3 Component API Design (Props Interface)

```typescript
// ============================================================================
// COMPONENT API DESIGN - Best Practices
// ============================================================================

/**
 * VideoPlayer Component API
 *
 * Design Principles:
 * 1. Required props are minimal and essential
 * 2. Optional props have sensible defaults
 * 3. Callbacks follow consistent naming (onXxx)
 * 4. Generic types for flexibility
 * 5. Discriminated unions for mutually exclusive props
 */

// --- Base Types ---
type PlaybackState =
  | "idle"
  | "loading"
  | "buffering"
  | "playing"
  | "paused"
  | "error";
type QualityLevel = "auto" | "4k" | "1080p" | "720p" | "480p" | "360p";

interface VideoTrack {
  id: string;
  label: string;
  language: string;
  isDefault: boolean;
}

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
}

// --- Event Handlers ---
interface VideoPlayerEvents {
  /** Called when playback state changes */
  onStateChange?: (state: PlaybackState) => void;

  /** Called on playback progress (throttled to 1 second) */
  onProgress?: (progress: {
    current: number;
    duration: number;
    percentage: number;
  }) => void;

  /** Called when video ends */
  onEnded?: () => void;

  /** Called on playback error with error details */
  onError?: (error: PlaybackError) => void;

  /** Called when quality level changes (user or auto) */
  onQualityChange?: (quality: QualityLevel, isAuto: boolean) => void;

  /** Called when user interacts with player controls */
  onUserInteraction?: (action: PlayerAction) => void;
}

// --- Main Props Interface ---
interface VideoPlayerProps extends VideoPlayerEvents {
  // Required
  /** Video content metadata */
  content: {
    id: string;
    title: string;
    manifestUrl: string;
    thumbnailUrl: string;
    duration: number;
  };

  // Optional with defaults
  /** Initial playback position in seconds @default 0 */
  startPosition?: number;

  /** Whether to autoplay when ready @default false */
  autoPlay?: boolean;

  /** Volume level 0-1 @default 1 */
  volume?: number;

  /** Muted state @default false */
  muted?: boolean;

  /** Preferred quality level @default 'auto' */
  preferredQuality?: QualityLevel;

  /** Available subtitle tracks */
  subtitles?: SubtitleTrack[];

  /** Available audio tracks */
  audioTracks?: VideoTrack[];

  /** Show/hide player controls @default true */
  showControls?: boolean;

  /** Keyboard shortcuts enabled @default true */
  keyboardShortcuts?: boolean;

  // Render Props for customization
  /** Custom loading indicator */
  renderLoader?: () => React.ReactNode;

  /** Custom error display */
  renderError?: (error: PlaybackError, onRetry: () => void) => React.ReactNode;

  /** Custom controls overlay */
  renderControls?: (controlProps: ControlsRenderProps) => React.ReactNode;
}

// --- Compound Component Pattern for Video Player ---
interface VideoPlayerComposition {
  Controls: typeof VideoPlayerControls;
  Subtitles: typeof VideoPlayerSubtitles;
  QualitySelector: typeof QualitySelector;
  ProgressBar: typeof ProgressBar;
  VolumeControl: typeof VolumeControl;
}

// Usage Example:
/*
<VideoPlayer content={movieData} autoPlay>
  <VideoPlayer.Controls position="bottom">
    <VideoPlayer.ProgressBar />
    <VideoPlayer.VolumeControl />
    <VideoPlayer.QualitySelector />
  </VideoPlayer.Controls>
  <VideoPlayer.Subtitles language="en" />
</VideoPlayer>
*/
```

### 3.4 Custom Hooks with Dependency Injection

```typescript
// ============================================================================
// CUSTOM HOOKS - Dependency Injection Pattern
// ============================================================================

/**
 * useVideoPlayer Hook with Dependency Injection
 *
 * DI Benefits:
 * - Testability (inject mock services)
 * - Flexibility (swap implementations)
 * - Decoupling (components don't know concrete implementations)
 */

// Define interfaces for dependencies
interface AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void;
}

interface PlaybackService {
  createPlayer(element: HTMLVideoElement): Player;
  destroyPlayer(player: Player): void;
}

interface DRMService {
  requestLicense(contentId: string): Promise<ArrayBuffer>;
  releaseLicense(contentId: string): void;
}

// Default implementations
const defaultAnalytics: AnalyticsService = {
  track: (event, props) => window.analytics?.track(event, props),
};

const defaultPlaybackService: PlaybackService = {
  createPlayer: (element) => new ShakaPlayer(element),
  destroyPlayer: (player) => player.destroy(),
};

// Hook with dependency injection
interface UseVideoPlayerOptions {
  analytics?: AnalyticsService;
  playbackService?: PlaybackService;
  drmService?: DRMService;
}

interface UseVideoPlayerReturn {
  playerRef: React.RefObject<HTMLVideoElement>;
  state: PlaybackState;
  currentTime: number;
  duration: number;
  buffered: number;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setQuality: (quality: QualityLevel) => void;
}

const useVideoPlayer = (
  content: VideoContent,
  options: UseVideoPlayerOptions = {}
): UseVideoPlayerReturn => {
  // Inject dependencies with defaults
  const {
    analytics = defaultAnalytics,
    playbackService = defaultPlaybackService,
    drmService,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);

  const [state, setState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  // Initialize player
  useEffect(() => {
    if (!videoRef.current) return;

    const initPlayer = async () => {
      setState("loading");

      try {
        // Create player using injected service
        const player = playbackService.createPlayer(videoRef.current!);
        playerRef.current = player;

        // Configure DRM if content is protected
        if (content.isDRMProtected && drmService) {
          const license = await drmService.requestLicense(content.id);
          await player.configureDRM(license);
        }

        // Load manifest
        await player.load(content.manifestUrl);

        setState("idle");
        setDuration(player.getDuration());

        // Track analytics
        analytics.track("video_loaded", {
          contentId: content.id,
          loadTime: performance.now(),
        });
      } catch (error) {
        setState("error");
        analytics.track("video_error", {
          contentId: content.id,
          error: (error as Error).message,
        });
      }
    };

    initPlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        playbackService.destroyPlayer(playerRef.current);
        drmService?.releaseLicense(content.id);
      }
    };
  }, [content.id, playbackService, drmService, analytics]);

  // Player controls
  const play = useCallback(async () => {
    try {
      await videoRef.current?.play();
      setState("playing");
      analytics.track("video_play", {
        contentId: content.id,
        position: currentTime,
      });
    } catch (error) {
      // Handle autoplay blocking
      if ((error as Error).name === "NotAllowedError") {
        analytics.track("autoplay_blocked", { contentId: content.id });
      }
    }
  }, [content.id, currentTime, analytics]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setState("paused");
    analytics.track("video_pause", {
      contentId: content.id,
      position: currentTime,
    });
  }, [content.id, currentTime, analytics]);

  const seek = useCallback(
    (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        analytics.track("video_seek", {
          contentId: content.id,
          from: currentTime,
          to: time,
        });
      }
    },
    [content.id, currentTime, analytics]
  );

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const setQuality = useCallback(
    (quality: QualityLevel) => {
      playerRef.current?.setQualityLevel(quality);
      analytics.track("quality_change", { contentId: content.id, quality });
    },
    [content.id, analytics]
  );

  return {
    playerRef: videoRef,
    state,
    currentTime,
    duration,
    buffered,
    play,
    pause,
    seek,
    setVolume,
    setQuality,
  };
};
```

---

## 4. State Management

### 4.1 State Management Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  React Context  │
                              │   (UI Theme,    │
                              │   Locale, etc.) │
                              └────────┬────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                           CLIENT STATE                                    │
    │                          (Zustand Stores)                                 │
    │                                                                          │
    │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
    │  │  UserStore    │  │  PlayerStore  │  │   UIStore     │                │
    │  ├───────────────┤  ├───────────────┤  ├───────────────┤                │
    │  │ • profile     │  │ • state       │  │ • modalStack  │                │
    │  │ • preferences │  │ • currentTime │  │ • sidebarOpen │                │
    │  │ • watchlist   │  │ • volume      │  │ • toasts      │                │
    │  │ • isKids      │  │ • quality     │  │ • searchOpen  │                │
    │  └───────────────┘  └───────────────┘  └───────────────┘                │
    │                                                                          │
    │  ┌───────────────┐  ┌───────────────┐                                   │
    │  │  DeviceStore  │  │FeatureFlagStr │                                   │
    │  ├───────────────┤  ├───────────────┤                                   │
    │  │ • viewport    │  │ • flags       │                                   │
    │  │ • orientation │  │ • experiments │                                   │
    │  │ • connection  │  │ • overrides   │                                   │
    │  │ • capabilities│  └───────────────┘                                   │
    │  └───────────────┘                                                       │
    └──────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Hydration / Sync
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                           SERVER STATE                                    │
    │                        (TanStack Query)                                   │
    │                                                                          │
    │  ┌───────────────────────────────────────────────────────────────────┐  │
    │  │                        Query Cache                                 │  │
    │  │                                                                    │  │
    │  │  ['content', 'browse']        ──► Content rows data               │  │
    │  │  ['content', id]              ──► Single content details          │  │
    │  │  ['search', query]            ──► Search results                  │  │
    │  │  ['user', 'profile']          ──► User profile data               │  │
    │  │  ['user', 'watchHistory']     ──► Watch history                   │  │
    │  │  ['recommendations', profile] ──► ML recommendations              │  │
    │  │  ['playback', contentId]      ──► Playback URLs & DRM             │  │
    │  └───────────────────────────────────────────────────────────────────┘  │
    │                                                                          │
    │  ┌───────────────────────┐  ┌───────────────────────┐                   │
    │  │   Mutation State      │  │   Optimistic Updates  │                   │
    │  │   (pending ops)       │  │   (instant UI feedback│                   │
    │  └───────────────────────┘  └───────────────────────┘                   │
    └──────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Persist / Offline
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                         PERSISTENT STATE                                  │
    │                                                                          │
    │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
    │  │    LocalStorage   │  │     IndexedDB     │  │   Service Worker  │   │
    │  ├───────────────────┤  ├───────────────────┤  ├───────────────────┤   │
    │  │ • Auth tokens     │  │ • Offline content │  │ • Cached assets   │   │
    │  │ • User prefs      │  │ • Download queue  │  │ • API responses   │   │
    │  │ • Theme           │  │ • Watch progress  │  │ • Background sync │   │
    │  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
    └──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Global State Structure (JSON Example)

```typescript
// ============================================================================
// COMPLETE GLOBAL STATE STRUCTURE
// ============================================================================

interface GlobalState {
  // ========== USER STORE ==========
  user: {
    isAuthenticated: boolean;
    account: {
      id: string;
      email: string;
      plan: "basic" | "standard" | "premium";
      memberSince: string;
    } | null;
    currentProfile: {
      id: string;
      name: string;
      avatarUrl: string;
      isKids: boolean;
      maturityRating: "G" | "PG" | "PG-13" | "R" | "NC-17";
      language: string;
      subtitlePreferences: {
        enabled: boolean;
        language: string;
        size: "small" | "medium" | "large";
      };
      autoplayEnabled: boolean;
    } | null;
    profiles: Array<{
      id: string;
      name: string;
      avatarUrl: string;
      isKids: boolean;
    }>;
    myList: string[]; // Content IDs
    watchHistory: Array<{
      contentId: string;
      episodeId?: string;
      progress: number;
      totalDuration: number;
      lastWatched: string;
    }>;
  };

  // ========== PLAYER STORE ==========
  player: {
    state: "idle" | "loading" | "buffering" | "playing" | "paused" | "error";
    currentContent: {
      id: string;
      type: "movie" | "episode";
      title: string;
      manifestUrl: string;
      duration: number;
    } | null;
    playback: {
      currentTime: number;
      duration: number;
      buffered: Array<{ start: number; end: number }>;
      playbackRate: number;
    };
    audio: {
      volume: number;
      muted: boolean;
      currentTrack: string;
      availableTracks: Array<{ id: string; label: string; language: string }>;
    };
    video: {
      quality: "auto" | "4k" | "1080p" | "720p" | "480p" | "360p";
      actualQuality: string;
      availableQualities: string[];
    };
    subtitles: {
      enabled: boolean;
      currentTrack: string | null;
      availableTracks: Array<{ id: string; label: string; language: string }>;
    };
    error: { code: string; message: string; retryable: boolean } | null;
  };

  // ========== UI STORE ==========
  ui: {
    theme: "dark" | "light";
    modalStack: Array<{
      id: string;
      type: "content-detail" | "profile-select" | "settings";
      props: Record<string, unknown>;
    }>;
    sidebarOpen: boolean;
    searchOpen: boolean;
    searchQuery: string;
    headerTransparent: boolean;
    toasts: Array<{
      id: string;
      type: "success" | "error" | "info" | "warning";
      message: string;
    }>;
  };

  // ========== DEVICE STORE ==========
  device: {
    type: "web" | "tv" | "mobile" | "tablet";
    viewport: {
      width: number;
      height: number;
      orientation: "portrait" | "landscape";
    };
    connection: {
      type: "wifi" | "4g" | "3g" | "2g" | "offline";
      effectiveType: "slow-2g" | "2g" | "3g" | "4g";
      downlink: number;
      saveData: boolean;
    };
    capabilities: {
      supportsHDR: boolean;
      supports4K: boolean;
      supportsOffline: boolean;
      supportsPiP: boolean;
    };
  };

  // ========== FEATURE FLAGS STORE ==========
  featureFlags: {
    flags: {
      newHomeLayout: boolean;
      interactiveContent: boolean;
      spatialAudio: boolean;
      watchParty: boolean;
    };
    experiments: Array<{
      id: string;
      name: string;
      variant: string;
      params: Record<string, unknown>;
    }>;
  };
}
```

### 4.3 Zustand Store Implementation

```typescript
// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// --------------------------------------------------------------------------
// USER STORE
// --------------------------------------------------------------------------

interface UserState {
  isAuthenticated: boolean;
  currentProfile: Profile | null;
  profiles: Profile[];
  myList: string[];
  watchHistory: WatchHistoryItem[];
}

interface UserActions {
  setAuthenticated: (isAuth: boolean) => void;
  setCurrentProfile: (profile: Profile) => void;
  addToMyList: (contentId: string) => void;
  removeFromMyList: (contentId: string) => void;
  updateWatchProgress: (contentId: string, progress: number) => void;
  logout: () => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          // Initial state
          isAuthenticated: false,
          currentProfile: null,
          profiles: [],
          myList: [],
          watchHistory: [],

          // Actions
          setAuthenticated: (isAuth) =>
            set(
              (state) => {
                state.isAuthenticated = isAuth;
              },
              false,
              "user/setAuthenticated"
            ),

          setCurrentProfile: (profile) =>
            set(
              (state) => {
                state.currentProfile = profile;
              },
              false,
              "user/setCurrentProfile"
            ),

          addToMyList: (contentId) =>
            set(
              (state) => {
                if (!state.myList.includes(contentId)) {
                  state.myList.unshift(contentId);
                }
              },
              false,
              "user/addToMyList"
            ),

          removeFromMyList: (contentId) =>
            set(
              (state) => {
                state.myList = state.myList.filter((id) => id !== contentId);
              },
              false,
              "user/removeFromMyList"
            ),

          updateWatchProgress: (contentId, progress) =>
            set(
              (state) => {
                const existing = state.watchHistory.find(
                  (item) => item.contentId === contentId
                );

                if (existing) {
                  existing.progress = progress;
                  existing.lastWatched = new Date().toISOString();
                } else {
                  state.watchHistory.unshift({
                    contentId,
                    progress,
                    lastWatched: new Date().toISOString(),
                    totalDuration: 0,
                  });
                }
              },
              false,
              "user/updateWatchProgress"
            ),

          logout: () =>
            set(
              (state) => {
                state.isAuthenticated = false;
                state.currentProfile = null;
                state.profiles = [];
                state.myList = [];
                state.watchHistory = [];
              },
              false,
              "user/logout"
            ),
        }))
      ),
      {
        name: "netflix-user-store",
        partialize: (state) => ({
          myList: state.myList,
          watchHistory: state.watchHistory.slice(0, 100),
        }),
      }
    ),
    { name: "UserStore" }
  )
);

// Selectors for performance optimization
export const selectIsAuthenticated = (state: UserStore) =>
  state.isAuthenticated;
export const selectCurrentProfile = (state: UserStore) => state.currentProfile;
export const selectMyList = (state: UserStore) => state.myList;
export const selectIsInMyList = (contentId: string) => (state: UserStore) =>
  state.myList.includes(contentId);

// --------------------------------------------------------------------------
// PLAYER STORE
// --------------------------------------------------------------------------

interface PlayerState {
  state: PlaybackState;
  currentContent: VideoContent | null;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  quality: QualityLevel;
  isFullscreen: boolean;
  error: PlaybackError | null;
}

interface PlayerActions {
  loadContent: (content: VideoContent) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setQuality: (quality: QualityLevel) => void;
  setError: (error: PlaybackError | null) => void;
  reset: () => void;
}

const initialPlayerState: PlayerState = {
  state: "idle",
  currentContent: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  quality: "auto",
  isFullscreen: false,
  error: null,
};

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        ...initialPlayerState,

        loadContent: (content) =>
          set((state) => {
            state.state = "loading";
            state.currentContent = content;
            state.currentTime = 0;
            state.error = null;
          }),

        play: () =>
          set((state) => {
            if (state.state !== "error") state.state = "playing";
          }),

        pause: () =>
          set((state) => {
            state.state = "paused";
          }),

        seek: (time) =>
          set((state) => {
            state.currentTime = Math.max(0, Math.min(time, state.duration));
          }),

        setVolume: (volume) =>
          set((state) => {
            state.volume = Math.max(0, Math.min(1, volume));
            if (volume > 0) state.muted = false;
          }),

        toggleMute: () =>
          set((state) => {
            state.muted = !state.muted;
          }),

        setQuality: (quality) =>
          set((state) => {
            state.quality = quality;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
            state.state = error ? "error" : "idle";
          }),

        reset: () => set(() => initialPlayerState),
      }))
    ),
    { name: "PlayerStore" }
  )
);
```

### 4.4 TanStack Query - Server State

```typescript
// ============================================================================
// TANSTACK QUERY - SERVER STATE MANAGEMENT
// ============================================================================

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  QueryClient,
} from "@tanstack/react-query";

// --------------------------------------------------------------------------
// QUERY CLIENT CONFIGURATION
// --------------------------------------------------------------------------

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
    },
  },
});

// --------------------------------------------------------------------------
// QUERY KEYS FACTORY
// --------------------------------------------------------------------------

export const queryKeys = {
  content: {
    all: ["content"] as const,
    lists: () => [...queryKeys.content.all, "list"] as const,
    list: (filters: ContentFilters) =>
      [...queryKeys.content.lists(), filters] as const,
    details: () => [...queryKeys.content.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.content.details(), id] as const,
    episodes: (seriesId: string, seasonId: string) =>
      [...queryKeys.content.detail(seriesId), "episodes", seasonId] as const,
  },

  search: {
    all: ["search"] as const,
    query: (q: string) => [...queryKeys.search.all, q] as const,
    suggestions: (q: string) =>
      [...queryKeys.search.all, "suggestions", q] as const,
  },

  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    watchHistory: () => [...queryKeys.user.all, "watchHistory"] as const,
    myList: () => [...queryKeys.user.all, "myList"] as const,
    recommendations: (profileId: string) =>
      [...queryKeys.user.all, "recommendations", profileId] as const,
  },

  browse: {
    all: ["browse"] as const,
    rows: (profileId: string) =>
      [...queryKeys.browse.all, "rows", profileId] as const,
  },

  playback: {
    all: ["playback"] as const,
    manifest: (contentId: string) =>
      [...queryKeys.playback.all, "manifest", contentId] as const,
  },
} as const;

// --------------------------------------------------------------------------
// CUSTOM QUERY HOOKS
// --------------------------------------------------------------------------

export const useContentDetails = (contentId: string) => {
  return useQuery({
    queryKey: queryKeys.content.detail(contentId),
    queryFn: () => contentApi.getDetails(contentId),
    placeholderData: (previousData) => previousData,
    enabled: Boolean(contentId),
    staleTime: 10 * 60 * 1000,
  });
};

export const useBrowseRows = (profileId: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.browse.rows(profileId),
    queryFn: ({ pageParam = 0 }) => browseApi.getRows(profileId, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
};

export const useSearchContent = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: ({ signal }) => searchApi.search(query, { signal }),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev,
    staleTime: 60 * 1000,
  });
};

// --------------------------------------------------------------------------
// OPTIMISTIC UPDATES
// --------------------------------------------------------------------------

export const useAddToMyList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => userApi.addToMyList(contentId),

    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.myList() });

      const previousMyList = queryClient.getQueryData<string[]>(
        queryKeys.user.myList()
      );

      queryClient.setQueryData<string[]>(
        queryKeys.user.myList(),
        (old = []) => [contentId, ...old]
      );

      return { previousMyList };
    },

    onError: (err, contentId, context) => {
      if (context?.previousMyList) {
        queryClient.setQueryData(
          queryKeys.user.myList(),
          context.previousMyList
        );
      }
      toast.error("Failed to add to My List");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.myList() });
    },
  });
};

export const useUpdateWatchProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentId,
      progress,
    }: {
      contentId: string;
      progress: number;
    }) => playbackApi.updateProgress(contentId, progress),

    onMutate: async ({ contentId, progress }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.user.watchHistory(),
      });

      queryClient.setQueryData<WatchHistoryItem[]>(
        queryKeys.user.watchHistory(),
        (old = []) => {
          const updated = [...old];
          const index = updated.findIndex(
            (item) => item.contentId === contentId
          );

          if (index >= 0) {
            updated[index] = { ...updated[index], progress };
          } else {
            updated.unshift({
              contentId,
              progress,
              lastWatched: new Date().toISOString(),
            });
          }

          return updated;
        }
      );
    },
  });
};
```

### 4.5 State Persistence Strategy

```typescript
// ============================================================================
// STATE PERSISTENCE - IndexedDB for Offline Support
// ============================================================================

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface NetflixDBSchema extends DBSchema {
  "watch-history": {
    key: string;
    value: WatchHistoryItem;
    indexes: { "by-date": string };
  };
  "offline-content": {
    key: string;
    value: {
      contentId: string;
      metadata: ContentMetadata;
      segments: Blob[];
      downloadedAt: string;
      expiresAt: string;
    };
  };
}

class OfflineStorage {
  private db: IDBPDatabase<NetflixDBSchema> | null = null;

  async init() {
    this.db = await openDB<NetflixDBSchema>("netflix-offline", 1, {
      upgrade(db) {
        const historyStore = db.createObjectStore("watch-history", {
          keyPath: "contentId",
        });
        historyStore.createIndex("by-date", "lastWatched");

        db.createObjectStore("offline-content", { keyPath: "contentId" });
      },
    });
  }

  async saveWatchProgress(item: WatchHistoryItem) {
    if (!this.db) await this.init();
    await this.db!.put("watch-history", item);
  }

  async getWatchHistory(): Promise<WatchHistoryItem[]> {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex("watch-history", "by-date");
  }

  async syncWithServer(api: typeof userApi) {
    const localHistory = await this.getWatchHistory();
    const serverHistory = await api.getWatchHistory();

    // Merge: Take most recent progress for each content
    const merged = new Map<string, WatchHistoryItem>();

    [...serverHistory, ...localHistory].forEach((item) => {
      const existing = merged.get(item.contentId);
      if (
        !existing ||
        new Date(item.lastWatched) > new Date(existing.lastWatched)
      ) {
        merged.set(item.contentId, item);
      }
    });

    // Sync back
    await api.batchUpdateWatchHistory(Array.from(merged.values()));

    for (const item of merged.values()) {
      await this.saveWatchProgress(item);
    }
  }
}

export const offlineStorage = new OfflineStorage();
```

---

## 5. Data Flow & API Communication

### 5.1 API Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API LAYER ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   Component     │
                              │  (useQuery)     │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Custom Hooks   │
                              │ (useContentRow) │
                              └────────┬────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │           API SERVICE LAYER          │
                    │  ┌────────────┐  ┌────────────────┐ │
                    │  │ ContentAPI │  │ PlaybackAPI    │ │
                    │  │ SearchAPI  │  │ UserAPI        │ │
                    │  └────────────┘  └────────────────┘ │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │          HTTP CLIENT LAYER           │
                    │     ┌─────────────────────────┐     │
                    │     │    Request Interceptor   │     │
                    │     │  • Add auth token        │     │
                    │     │  • Add request ID        │     │
                    │     │  • Add device info       │     │
                    │     └─────────────────────────┘     │
                    │                  │                   │
                    │                  ▼                   │
                    │     ┌─────────────────────────┐     │
                    │     │      Axios Instance      │     │
                    │     └─────────────────────────┘     │
                    │                  │                   │
                    │                  ▼                   │
                    │     ┌─────────────────────────┐     │
                    │     │   Response Interceptor   │     │
                    │     │  • Error normalization   │     │
                    │     │  • Token refresh         │     │
                    │     │  • Retry logic           │     │
                    │     └─────────────────────────┘     │
                    └──────────────────────────────────────┘
```

### 5.2 HTTP Client Implementation

```typescript
// ============================================================================
// HTTP CLIENT LAYER - Axios Configuration
// ============================================================================

import axios, { AxiosInstance, AxiosError } from "axios";

const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request Interceptor
  client.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      config.headers["X-Request-ID"] = generateRequestId();
      config.headers["X-Device-Type"] = getDeviceType();

      const profileId = getCurrentProfileId();
      if (profileId) {
        config.headers["X-Profile-ID"] = profileId;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Token refresh on 401
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAuthToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        } catch {
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      return Promise.reject(normalizeApiError(error));
    }
  );

  return client;
};

export const httpClient = createHttpClient();

// --------------------------------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------------------------------

interface ApiError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
}

const normalizeApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    const data = error.response.data as Record<string, unknown>;
    return {
      code: (data.code as string) || "SERVER_ERROR",
      message: (data.message as string) || "An error occurred",
      status: error.response.status,
      retryable: error.response.status >= 500,
    };
  }

  if (error.code === "ECONNABORTED") {
    return {
      code: "TIMEOUT",
      message: "Request timed out",
      status: 0,
      retryable: true,
    };
  }

  if (!navigator.onLine) {
    return {
      code: "OFFLINE",
      message: "No internet connection",
      status: 0,
      retryable: true,
    };
  }

  return {
    code: "NETWORK_ERROR",
    message: "Network error",
    status: 0,
    retryable: true,
  };
};

// --------------------------------------------------------------------------
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// --------------------------------------------------------------------------

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const apiError = error as ApiError;
      if (!apiError.retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        30000
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

// --------------------------------------------------------------------------
// API SERVICES
// --------------------------------------------------------------------------

export const contentApi = {
  getDetails: (id: string) =>
    withRetry(() => httpClient.get<ContentDetails>(`/content/${id}`)).then(
      (res) => res.data
    ),

  getRow: (rowId: string, page = 0) =>
    withRetry(() =>
      httpClient.get<ContentRow>(`/content/row/${rowId}`, {
        params: { page, limit: 20 },
      })
    ).then((res) => res.data),
};

export const searchApi = {
  search: (query: string, options?: { signal?: AbortSignal }) =>
    httpClient
      .get<SearchResults>("/search", {
        params: { q: query },
        signal: options?.signal,
      })
      .then((res) => res.data),
};

export const playbackApi = {
  getManifest: (contentId: string) =>
    withRetry(() =>
      httpClient.get<PlaybackManifest>(`/playback/${contentId}/manifest`)
    ).then((res) => res.data),

  updateProgress: (contentId: string, progress: number) =>
    httpClient.post(`/playback/${contentId}/progress`, { progress }),
};
```

### 5.3 WebSocket Real-time Communication

```typescript
// ============================================================================
// WEBSOCKET CLIENT - Real-time Updates
// ============================================================================

type MessageHandler = (data: unknown) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timer | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.dispatchMessage(message);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        if (!event.wasClean) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = reject;
    });
  }

  private dispatchMessage(message: { type: string; payload: unknown }) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => handler(message.payload));
  }

  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => this.handlers.get(type)?.delete(handler);
  }

  send(type: string, payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => this.send("ping", {}), 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = 1000 * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => this.connect().catch(console.error), delay);
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
  }
}

// React Hook
export const useWebSocket = () => {
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    const client = new WebSocketClient(process.env.NEXT_PUBLIC_WS_URL!);
    clientRef.current = client;
    client.connect().catch(console.error);

    return () => client.disconnect();
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    return clientRef.current?.subscribe(type, handler) ?? (() => {});
  }, []);

  const send = useCallback((type: string, payload: unknown) => {
    clientRef.current?.send(type, payload);
  }, []);

  return { subscribe, send };
};
```

---

## 6. Performance Optimization

### 6.1 Bundle Optimization

```typescript
// ============================================================================
// BUNDLE OPTIMIZATION STRATEGIES
// ============================================================================

// --------------------------------------------------------------------------
// CODE SPLITTING - Route-based & Component-based
// --------------------------------------------------------------------------

// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 20,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: "react-vendor",
            chunks: "all",
            priority: 30,
          },
          player: {
            test: /[\\/]node_modules[\\/](shaka-player|hls.js)[\\/]/,
            name: "player-vendor",
            chunks: "async",
            priority: 25,
          },
        },
      };
    }
    return config;
  },
};

// --------------------------------------------------------------------------
// LAZY LOADING COMPONENTS
// --------------------------------------------------------------------------

import dynamic from "next/dynamic";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
  loading: () => <PlayerSkeleton />,
  ssr: false,
});

const ContentModal = dynamic(() => import("@/components/ContentModal"), {
  loading: () => <ModalSkeleton />,
});

// --------------------------------------------------------------------------
// TREE SHAKING - Import Optimization
// --------------------------------------------------------------------------

// ❌ Bad: Import entire library
// import _ from 'lodash';

// ✅ Good: Import specific function
import debounce from "lodash/debounce";

// ✅ Even better: Native implementation
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
```

### 6.2 Rendering Optimization

```typescript
// ============================================================================
// RENDERING OPTIMIZATION
// ============================================================================

// --------------------------------------------------------------------------
// VIRTUALIZATION - Large Lists
// --------------------------------------------------------------------------

import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualizedContentRow: React.FC<ContentRowProps> = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    horizontal: true,
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card width
    overscan: 3, // Render 3 extra items on each side
  });

  return (
    <div
      ref={parentRef}
      className="content-row__container"
      style={{ overflowX: "auto" }}
    >
      <div
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          height: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${virtualItem.size}px`,
              transform: `translateX(${virtualItem.start}px)`,
            }}
          >
            <ContentCard content={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// MEMOIZATION STRATEGIES
// --------------------------------------------------------------------------

// Memo with custom comparison
const ContentCard = memo<ContentCardProps>(
  ({ content, isHovered, onHover, onClick }) => {
    return (
      <div
        className={`content-card ${isHovered ? "hovered" : ""}`}
        onMouseEnter={onHover}
        onClick={onClick}
      >
        <img src={content.thumbnailUrl} alt={content.title} />
        <h3>{content.title}</h3>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.content.id === nextProps.content.id &&
      prevProps.isHovered === nextProps.isHovered
    );
  }
);

// useMemo for expensive computations
const BrowsePage: React.FC = () => {
  const { data: rows } = useBrowseRows();

  // Memoize filtered/sorted data
  const processedRows = useMemo(() => {
    if (!rows) return [];

    return rows
      .filter((row) => row.items.length > 0)
      .map((row) => ({
        ...row,
        items: row.items.slice(0, 20), // Limit visible items
      }));
  }, [rows]);

  return <ContentGrid rows={processedRows} />;
};

// useCallback for stable function references
const ContentRow: React.FC<ContentRowProps> = ({ row, onItemClick }) => {
  // Stable callback reference
  const handleItemClick = useCallback(
    (content: Content) => {
      onItemClick(content);
    },
    [onItemClick]
  );

  return (
    <div className="content-row">
      {row.items.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          onClick={() => handleItemClick(item)}
        />
      ))}
    </div>
  );
};

// --------------------------------------------------------------------------
// CONCURRENT RENDERING WITH SUSPENSE
// --------------------------------------------------------------------------

import { Suspense, lazy, startTransition, useDeferredValue } from "react";

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Defer the search query to avoid blocking UI
  const deferredQuery = useDeferredValue(searchQuery);

  // Use startTransition for non-urgent updates
  const handleSearchChange = (value: string) => {
    // High priority: Update input immediately
    setSearchQuery(value);

    // Low priority: Can be interrupted
    startTransition(() => {
      // Analytics, etc.
    });
  };

  return (
    <div className="search-page">
      <SearchInput value={searchQuery} onChange={handleSearchChange} />

      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </div>
  );
};
```

### 6.3 Network & Image Optimization

```typescript
// ============================================================================
// NETWORK & IMAGE OPTIMIZATION
// ============================================================================

// --------------------------------------------------------------------------
// PREFETCHING STRATEGIES
// --------------------------------------------------------------------------

/**
 * Prefetch content on hover - improves perceived performance
 */
const usePrefetchOnHover = () => {
  const queryClient = useQueryClient();
  const prefetchTimeout = useRef<NodeJS.Timeout>();

  const prefetch = useCallback(
    (contentId: string) => {
      // Delay prefetch to avoid unnecessary requests on quick hover
      prefetchTimeout.current = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: queryKeys.content.detail(contentId),
          queryFn: () => contentApi.getDetails(contentId),
          staleTime: 5 * 60 * 1000,
        });
      }, 200);
    },
    [queryClient]
  );

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
    }
  }, []);

  return { prefetch, cancelPrefetch };
};

/**
 * Prefetch next page data for infinite scroll
 */
const useInfiniteScrollPrefetch = (
  hasNextPage: boolean,
  fetchNextPage: () => void
) => {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" } // Prefetch 100px before visible
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return loadMoreRef;
};

// --------------------------------------------------------------------------
// IMAGE OPTIMIZATION
// --------------------------------------------------------------------------

/**
 * Responsive image component with lazy loading
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1920];
    return widths
      .filter((w) => w <= width * 2) // Don't upscale more than 2x
      .map((w) => `${getImageUrl(baseSrc, w, quality)} ${w}w`)
      .join(", ");
  };

  // Netflix CDN image URL builder
  const getImageUrl = (src: string, w: number, q: number) => {
    return `https://occ-0-4344-2186.1.nflxso.net/dnm/api/v6/E8vDc/image.jpg?r=f7a&w=${w}&q=${q}&src=${encodeURIComponent(
      src
    )}`;
  };

  return (
    <div
      className="image-container"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {!isLoaded && !hasError && (
        <div className="image-placeholder">
          <Shimmer />
        </div>
      )}

      <img
        ref={imgRef}
        src={getImageUrl(src, width, quality)}
        srcSet={generateSrcSet(src)}
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />

      {hasError && <ImageFallback />}
    </div>
  );
};

// --------------------------------------------------------------------------
// CORE WEB VITALS OPTIMIZATION
// --------------------------------------------------------------------------

/**
 * Performance Budget Table
 *
 * | Metric | Budget | Measurement |
 * |--------|--------|-------------|
 * | LCP    | < 2.5s | Hero image load |
 * | FID    | < 100ms | Input responsiveness |
 * | CLS    | < 0.1 | Layout stability |
 * | TTFB   | < 200ms | Server response |
 * | FCP    | < 1.8s | First paint |
 * | TTI    | < 3.5s | Interactive |
 * | TBT    | < 200ms | Blocking time |
 */

// LCP Optimization - Preload critical resources
const LCPOptimization: React.FC = () => {
  useEffect(() => {
    // Preload hero image
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/hero-banner.webp";
    link.fetchPriority = "high";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
};

// CLS Prevention - Reserve space for dynamic content
const ContentRowWithReservedSpace: React.FC = () => {
  return (
    <div
      className="content-row"
      style={{
        minHeight: "200px", // Reserve space
        contain: "layout", // CSS containment
      }}
    >
      <Suspense fallback={<RowSkeleton height={200} />}>
        <ContentRowContent />
      </Suspense>
    </div>
  );
};
```

### 6.4 Memory Management

```typescript
// ============================================================================
// MEMORY LEAK PREVENTION
// ============================================================================

// --------------------------------------------------------------------------
// CLEANUP PATTERNS
// --------------------------------------------------------------------------

/**
 * Video Player with proper cleanup
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ content }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ShakaPlayer | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize player
    const player = new ShakaPlayer(video);
    playerRef.current = player;

    // Setup intersection observer for visibility tracking
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          player.pause();
        }
      },
      { threshold: 0.5 }
    );
    observerRef.current.observe(video);

    // Load content
    player.load(content.manifestUrl);

    // CRITICAL: Cleanup function
    return () => {
      // Disconnect observer
      observerRef.current?.disconnect();
      observerRef.current = null;

      // Destroy player and release memory
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Clear video src
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [content.manifestUrl]);

  return <video ref={videoRef} />;
};

/**
 * Custom hook for subscription cleanup
 */
const useEventSubscription = <T>(
  eventSource: EventEmitter,
  eventName: string,
  handler: (data: T) => void
) => {
  useEffect(() => {
    eventSource.on(eventName, handler);

    return () => {
      eventSource.off(eventName, handler);
    };
  }, [eventSource, eventName, handler]);
};

/**
 * AbortController for fetch cleanup
 */
const useCancellableFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          signal: abortController.signal,
        });
        const result = await response.json();
        setData(result);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup: Abort inflight request
    return () => {
      abortController.abort();
    };
  }, [url]);

  return { data, loading, error };
};

// --------------------------------------------------------------------------
// WEB WORKERS FOR HEAVY COMPUTATION
// --------------------------------------------------------------------------

/**
 * Offload heavy computation to Web Worker
 */

// worker.ts
self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case "PROCESS_SUBTITLES":
      const processed = processSubtitles(payload);
      self.postMessage({ type: "SUBTITLES_PROCESSED", payload: processed });
      break;

    case "COMPUTE_RECOMMENDATIONS":
      const recommendations = computeRecommendations(payload);
      self.postMessage({
        type: "RECOMMENDATIONS_COMPUTED",
        payload: recommendations,
      });
      break;
  }
};

// useWorker hook
const useWorker = (workerScript: string) => {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    workerRef.current = new Worker(workerScript);

    workerRef.current.onmessage = (event) => {
      setResult(event.data);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [workerScript]);

  const postMessage = useCallback((message: unknown) => {
    workerRef.current?.postMessage(message);
  }, []);

  return { result, postMessage };
};
```

---

## 7. Error Handling & Edge Cases

### 7.1 Error Boundary Implementation

```typescript
// ============================================================================
// ERROR BOUNDARIES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: unknown[];
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to error tracking service
    errorTracker.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset on key change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !areArraysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback error={this.state.error!} resetError={this.reset} />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="error-fallback" role="alert">
      <div className="error-content">
        <h2>Something went wrong</h2>
        <p>We're having trouble loading this content.</p>

        {process.env.NODE_ENV === "development" && (
          <details>
            <summary>Error details</summary>
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </details>
        )}

        <div className="error-actions">
          <button onClick={resetError}>Try Again</button>
          <button onClick={() => (window.location.href = "/")}>Go Home</button>
        </div>
      </div>
    </div>
  );
};

// Specialized Error Boundaries
const VideoPlayerErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    fallback={
      <div className="player-error">
        <h3>Video playback error</h3>
        <p>We couldn't play this video. Please try again.</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    }
    onError={(error) => {
      analytics.track("playback_error", {
        error: error.message,
        type: "boundary_catch",
      });
    }}
  >
    {children}
  </ErrorBoundary>
);
```

### 7.2 Graceful Degradation

```typescript
// ============================================================================
// GRACEFUL DEGRADATION STRATEGIES
// ============================================================================

/**
 * Feature detection and fallbacks
 */
const useFeatureDetection = () => {
  const [features, setFeatures] = useState({
    webp: false,
    avif: false,
    hdr: false,
    webgl: false,
    serviceWorker: false,
    indexedDB: false,
    webSocket: false,
  });

  useEffect(() => {
    const detectFeatures = async () => {
      setFeatures({
        webp: await supportsWebP(),
        avif: await supportsAVIF(),
        hdr: supportsHDR(),
        webgl: supportsWebGL(),
        serviceWorker: "serviceWorker" in navigator,
        indexedDB: "indexedDB" in window,
        webSocket: "WebSocket" in window,
      });
    };

    detectFeatures();
  }, []);

  return features;
};

/**
 * Offline Support with Service Worker
 */

// service-worker.ts
const CACHE_NAME = "netflix-v1";
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/static/logo.svg",
  "/static/offline-poster.jpg",
];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener("fetch", (event: FetchEvent) => {
  // Network-first for API calls
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

/**
 * Network failure handling component
 */
const NetworkAwareContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<string>("4g");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor connection quality
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionQuality(connection.effectiveType);
      connection.addEventListener("change", () => {
        setConnectionQuality(connection.effectiveType);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <OfflineView />;
  }

  // Reduce quality for slow connections
  return (
    <ConnectionContext.Provider value={{ isOnline, connectionQuality }}>
      {children}
    </ConnectionContext.Provider>
  );
};
```

### 7.3 Race Condition Prevention

```typescript
// ============================================================================
// RACE CONDITION PREVENTION
// ============================================================================

/**
 * Abort previous request when new one starts
 */
const useLatestRequest = <T>(fetchFn: (signal: AbortSignal) => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortController.signal);

      // Only update if this is still the latest request
      if (!abortController.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err as Error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { data, loading, error, execute };
};

/**
 * Debounced search with race condition handling
 */
const useSearch = (initialQuery: string = "") => {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async ({ signal }) => {
      if (!debouncedQuery) return { results: [] };
      return searchApi.search(debouncedQuery, { signal });
    },
    enabled: debouncedQuery.length >= 2,
    // Keep previous data while loading new
    placeholderData: (prev) => prev,
  });

  return {
    query,
    setQuery,
    results: data?.results ?? [],
    isLoading,
    error,
  };
};

/**
 * Mutex for preventing concurrent mutations
 */
class AsyncMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this.locked) {
          this.locked = true;
          resolve(() => this.release());
        } else {
          this.queue.push(tryAcquire);
        }
      };

      tryAcquire();
    });
  }

  private release() {
    this.locked = false;
    const next = this.queue.shift();
    if (next) next();
  }
}

// Usage in optimistic updates
const progressMutex = new AsyncMutex();

const updateWatchProgress = async (contentId: string, progress: number) => {
  const release = await progressMutex.acquire();

  try {
    await playbackApi.updateProgress(contentId, progress);
  } finally {
    release();
  }
};
```

---

## 8. Testing Strategy

### 8.1 Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TESTING PYRAMID                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ▲
                                   ╱ ╲
                                  ╱   ╲
                                 ╱ E2E ╲        10%
                                ╱  Tests ╲      (Playwright)
                               ╱─────────╲
                              ╱           ╲
                             ╱ Integration ╲    20%
                            ╱    Tests      ╲   (Testing Library)
                           ╱─────────────────╲
                          ╱                   ╲
                         ╱    Unit Tests       ╲  70%
                        ╱      (Vitest)         ╲
                       ╱─────────────────────────╲
```

### 8.2 Unit Testing

```typescript
// ============================================================================
// UNIT TESTING - Vitest Examples
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --------------------------------------------------------------------------
// Testing Custom Hooks
// --------------------------------------------------------------------------

describe("useVideoPlayer", () => {
  const mockContent = {
    id: "movie-123",
    title: "Test Movie",
    manifestUrl: "https://example.com/manifest.mpd",
    duration: 7200,
  };

  const mockAnalytics = {
    track: vi.fn(),
  };

  const mockPlaybackService = {
    createPlayer: vi.fn(() => ({
      load: vi.fn().mockResolvedValue(undefined),
      getDuration: vi.fn(() => 7200),
      destroy: vi.fn(),
    })),
    destroyPlayer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize player on mount", async () => {
    const { result } = renderHook(() =>
      useVideoPlayer(mockContent, {
        analytics: mockAnalytics,
        playbackService: mockPlaybackService,
      })
    );

    expect(result.current.state).toBe("loading");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockPlaybackService.createPlayer).toHaveBeenCalled();
    expect(mockAnalytics.track).toHaveBeenCalledWith(
      "video_loaded",
      expect.any(Object)
    );
  });

  it("should cleanup player on unmount", () => {
    const { unmount } = renderHook(() =>
      useVideoPlayer(mockContent, {
        playbackService: mockPlaybackService,
      })
    );

    unmount();

    expect(mockPlaybackService.destroyPlayer).toHaveBeenCalled();
  });

  it("should track play event on play()", async () => {
    const { result } = renderHook(() =>
      useVideoPlayer(mockContent, {
        analytics: mockAnalytics,
        playbackService: mockPlaybackService,
      })
    );

    await act(async () => {
      await result.current.play();
    });

    expect(mockAnalytics.track).toHaveBeenCalledWith(
      "video_play",
      expect.objectContaining({ contentId: mockContent.id })
    );
  });
});

// --------------------------------------------------------------------------
// Testing Zustand Stores
// --------------------------------------------------------------------------

describe("useUserStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useUserStore.setState({
      isAuthenticated: false,
      currentProfile: null,
      myList: [],
      watchHistory: [],
    });
  });

  it("should add content to my list", () => {
    const { addToMyList } = useUserStore.getState();

    addToMyList("content-123");

    const { myList } = useUserStore.getState();
    expect(myList).toContain("content-123");
  });

  it("should not add duplicate content to my list", () => {
    const { addToMyList } = useUserStore.getState();

    addToMyList("content-123");
    addToMyList("content-123");

    const { myList } = useUserStore.getState();
    expect(myList.filter((id) => id === "content-123")).toHaveLength(1);
  });

  it("should update watch progress", () => {
    const { updateWatchProgress } = useUserStore.getState();

    updateWatchProgress("content-123", 1800);

    const { watchHistory } = useUserStore.getState();
    expect(watchHistory[0]).toMatchObject({
      contentId: "content-123",
      progress: 1800,
    });
  });
});

// --------------------------------------------------------------------------
// Testing Components
// --------------------------------------------------------------------------

describe("ContentCard", () => {
  const mockContent = {
    id: "movie-123",
    title: "Test Movie",
    thumbnailUrl: "https://example.com/thumb.jpg",
    rating: 8.5,
  };

  it("should render content information", () => {
    render(<ContentCard content={mockContent} />);

    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Test Movie");
  });

  it("should call onHover when hovered", async () => {
    const onHover = vi.fn();
    render(<ContentCard content={mockContent} onHover={onHover} />);

    await userEvent.hover(screen.getByRole("article"));

    expect(onHover).toHaveBeenCalled();
  });

  it("should be keyboard accessible", async () => {
    const onClick = vi.fn();
    render(<ContentCard content={mockContent} onClick={onClick} />);

    const card = screen.getByRole("article");
    card.focus();
    await userEvent.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalled();
  });
});
```

### 8.3 Integration & E2E Testing

```typescript
// ============================================================================
// INTEGRATION TESTING - Testing Library
// ============================================================================

describe("Browse Page Integration", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  it("should load and display content rows", async () => {
    render(<BrowsePage />, { wrapper });

    // Should show loading state
    expect(screen.getAllByTestId("row-skeleton")).toHaveLength(5);

    // Should show content after loading
    await waitFor(() => {
      expect(screen.getByText("Continue Watching")).toBeInTheDocument();
      expect(screen.getByText("Trending Now")).toBeInTheDocument();
    });
  });

  it("should open content modal on card click", async () => {
    render(<BrowsePage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Test Movie"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Watch Now")).toBeInTheDocument();
    });
  });
});

// ============================================================================
// E2E TESTING - Playwright
// ============================================================================

// tests/e2e/playback.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Video Playback", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/browse");
  });

  test("should play video when clicking play button", async ({ page }) => {
    await page.goto("/watch/movie-123");

    // Wait for player to load
    await page.waitForSelector('[data-testid="video-player"]');

    // Click play
    await page.click('[data-testid="play-button"]');

    // Verify video is playing
    const video = page.locator("video");
    await expect(video).toHaveJSProperty("paused", false);
  });

  test("should show progress bar on hover", async ({ page }) => {
    await page.goto("/watch/movie-123");

    const player = page.locator('[data-testid="video-player"]');
    await player.hover();

    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test("should remember playback position", async ({ page }) => {
    await page.goto("/watch/movie-123");

    // Seek to 5 minutes
    const video = page.locator("video");
    await video.evaluate((el: HTMLVideoElement) => {
      el.currentTime = 300;
    });

    // Navigate away and back
    await page.goto("/browse");
    await page.goto("/watch/movie-123");

    // Should resume from saved position
    await expect(video).toHaveJSProperty("currentTime", 300);
  });
});
```

---

## 9. Security Considerations

### 9.1 XSS Prevention

```typescript
// ============================================================================
// XSS PREVENTION
// ============================================================================

/**
 * Content sanitization for user-generated content
 */
import DOMPurify from "dompurify";

const sanitizeUserContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "target"],
    ALLOW_DATA_ATTR: false,
  });
};

// Usage in component
const UserReview: React.FC<{ review: string }> = ({ review }) => {
  const sanitizedReview = useMemo(() => sanitizeUserContent(review), [review]);

  return (
    <div
      className="user-review"
      dangerouslySetInnerHTML={{ __html: sanitizedReview }}
    />
  );
};

/**
 * URL validation
 */
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Prevent javascript: URLs
const SafeLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => {
  if (!isValidUrl(href)) {
    console.warn(`Invalid URL blocked: ${href}`);
    return <span>{children}</span>;
  }

  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
};
```

### 9.2 CSRF & Token Security

```typescript
// ============================================================================
// CSRF PROTECTION & SECURE TOKEN HANDLING
// ============================================================================

/**
 * CSRF Token handling
 */
const getCsrfToken = (): string | null => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute("content") ?? null;
};

// Add CSRF token to all mutating requests
httpClient.interceptors.request.use((config) => {
  if (
    ["post", "put", "patch", "delete"].includes(
      config.method?.toLowerCase() ?? ""
    )
  ) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }
  return config;
});

/**
 * Secure token storage
 */
class SecureTokenStorage {
  private readonly ACCESS_TOKEN_KEY = "netflix_at";
  private readonly REFRESH_TOKEN_KEY = "netflix_rt";

  // Store access token in memory (more secure)
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;

    // Also store in sessionStorage for tab persistence
    // (NOT localStorage - would persist after browser close)
    try {
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, this.encrypt(token));
    } catch {
      // SessionStorage might be disabled
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const encrypted = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (encrypted) {
        this.accessToken = this.decrypt(encrypted);
        return this.accessToken;
      }
    } catch {
      // SessionStorage might be disabled
    }

    return null;
  }

  // Refresh token in httpOnly cookie (set by server)
  // We don't handle it in JavaScript for security

  clearTokens() {
    this.accessToken = null;
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  private encrypt(data: string): string {
    // Simple obfuscation (real implementation would use proper encryption)
    return btoa(data);
  }

  private decrypt(data: string): string {
    return atob(data);
  }
}

export const tokenStorage = new SecureTokenStorage();
```

### 9.3 Content Security Policy

```typescript
// ============================================================================
// CONTENT SECURITY POLICY
// ============================================================================

// next.config.js - CSP Headers
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.netflix.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://*.nflxvideo.net blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.netflix.com wss://ws.netflix.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 10. Interview Cross-Questions

### Q1: Why Zustand over Redux for state management?

**Answer:**

```
Trade-off Analysis:

Zustand Pros:
- Minimal boilerplate (no actions, reducers, action creators)
- Better TypeScript inference
- Smaller bundle size (~1.5KB vs ~7KB for Redux Toolkit)
- No Provider wrapper required
- Built-in middleware (persist, devtools)
- Simpler mental model

Redux Pros:
- More established ecosystem
- Better debugging with Redux DevTools
- More structured for large teams
- Middleware ecosystem (saga, thunk)

For Netflix scale:
- Server state is handled by TanStack Query (not Redux)
- Client state is relatively simple (UI state, preferences)
- Multiple independent stores align with micro-frontend architecture
- Performance: Zustand's selector pattern prevents unnecessary re-renders

Conclusion: Zustand provides sufficient power with less complexity.
The separation of server state (TanStack Query) and client state (Zustand)
is the key architectural decision that makes this work.
```

### Q2: How would you handle video playback across 10,000+ concurrent viewers on a popular release?

**Answer:**

```typescript
/**
 * Strategy for high-concurrency video playback:
 *
 * 1. CDN Layer (Netflix Open Connect)
 *    - Content cached at ISP level
 *    - Multiple CDN fallbacks (Akamai, CloudFront)
 *    - Geographic distribution
 *
 * 2. Adaptive Bitrate Streaming
 *    - Start with lower quality, scale up
 *    - Buffer management to prevent stalls
 *    - Quality switching based on bandwidth estimation
 *
 * 3. Manifest Caching
 *    - Cache HLS/DASH manifests in service worker
 *    - Periodic background refresh
 *
 * 4. Connection Management
 */

const startPlayback = async (contentId: string) => {
  // 1. Request manifest with retry and fallback CDNs
  const manifest = await withRetry(() => playbackApi.getManifest(contentId), {
    maxRetries: 3,
    onRetry: (attempt) => {
      // Switch to fallback CDN on retry
      return switchCDN(attempt);
    },
  });

  // 2. Configure adaptive bitrate
  const player = new ShakaPlayer(videoElement);
  player.configure({
    abr: {
      enabled: true,
      defaultBandwidthEstimate: 5_000_000, // 5 Mbps conservative start
      switchInterval: 8, // seconds between quality switches
      bandwidthUpgradeTarget: 0.85, // Upgrade at 85% confidence
      bandwidthDowngradeTarget: 0.95,
    },
    streaming: {
      bufferBehind: 30, // seconds to keep buffered
      bufferingGoal: 10, // seconds ahead to buffer
      rebufferingGoal: 2, // minimum before resuming
      retryParameters: {
        maxAttempts: 5,
        baseDelay: 1000,
        backoffFactor: 2,
      },
    },
  });

  // 3. Monitor and report metrics
  player.addEventListener("buffering", (e) => {
    analytics.track("buffering", {
      contentId,
      duration: e.bufferingTime,
      quality: player.getCurrentQuality(),
    });
  });
};
```

### Q3: How do you prevent memory leaks in a long-running SPA?

**Answer:**

```typescript
/**
 * Memory Leak Prevention Strategies:
 *
 * 1. Cleanup in useEffect
 * 2. AbortController for fetch requests
 * 3. Proper event listener removal
 * 4. WeakMap/WeakRef for caches
 * 5. Virtualization for large lists
 * 6. Image cleanup and blob URL revocation
 */

// Common leak patterns and solutions:

// ❌ LEAK: Event listener not removed
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);

// ✅ FIX: Remove in cleanup
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// ❌ LEAK: Fetch continues after unmount
useEffect(() => {
  fetch("/api/data").then(setData);
}, []);

// ✅ FIX: AbortController
useEffect(() => {
  const controller = new AbortController();
  fetch("/api/data", { signal: controller.signal })
    .then(setData)
    .catch(() => {});
  return () => controller.abort();
}, []);

// ❌ LEAK: setInterval not cleared
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);
}, []);

// ✅ FIX: Clear interval
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);

// ❌ LEAK: Blob URLs not revoked
const url = URL.createObjectURL(blob);
img.src = url;

// ✅ FIX: Revoke when done
useEffect(() => {
  const url = URL.createObjectURL(blob);
  return () => URL.revokeObjectURL(url);
}, [blob]);

// Memory monitoring hook
const useMemoryMonitor = () => {
  useEffect(() => {
    if ("memory" in performance) {
      const checkMemory = () => {
        const { usedJSHeapSize, jsHeapSizeLimit } = (performance as any).memory;

        const usage = usedJSHeapSize / jsHeapSizeLimit;

        if (usage > 0.9) {
          console.warn("High memory usage:", usage);
          // Trigger cleanup or warn user
        }
      };

      const id = setInterval(checkMemory, 30000);
      return () => clearInterval(id);
    }
  }, []);
};
```

### Q4: Explain your approach to optimistic updates and rollback

**Answer:**

```typescript
/**
 * Optimistic Update Pattern:
 *
 * 1. Update UI immediately (optimistic)
 * 2. Send request to server
 * 3. On success: Confirm (optionally refetch)
 * 4. On error: Rollback to previous state
 *
 * Key considerations:
 * - Snapshot previous state before mutation
 * - Handle race conditions (user clicks rapidly)
 * - Queue mutations to maintain order
 * - Show subtle loading indicator for pending state
 */

const useOptimisticAddToList = () => {
  const queryClient = useQueryClient();
  const pendingMutations = useRef(new Set<string>());

  return useMutation({
    mutationFn: (contentId: string) => userApi.addToMyList(contentId),

    onMutate: async (contentId) => {
      // Prevent double-add
      if (pendingMutations.current.has(contentId)) {
        throw new Error("Mutation already pending");
      }
      pendingMutations.current.add(contentId);

      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ["myList"] });

      // Snapshot previous state
      const previousList = queryClient.getQueryData<string[]>(["myList"]);

      // Optimistically update
      queryClient.setQueryData<string[]>(["myList"], (old = []) => [
        contentId,
        ...old,
      ]);

      return { previousList, contentId };
    },

    onError: (error, contentId, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueryData(["myList"], context.previousList);
      }

      // Show error toast
      toast.error("Failed to add to list. Please try again.");
    },

    onSettled: (_, __, contentId) => {
      pendingMutations.current.delete(contentId);

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["myList"] });
    },
  });
};
```

### Q5: How would you implement real-time features like "Who's Watching"?

**Answer:**

```typescript
/**
 * Real-time "Who's Watching" Implementation
 *
 * Requirements:
 * - Show which profiles are currently active
 * - Update in real-time across devices
 * - Handle offline/reconnection
 */

// WebSocket message types
type PresenceMessage =
  | {
      type: "presence_update";
      profileId: string;
      status: "watching" | "idle" | "offline";
    }
  | { type: "presence_sync"; profiles: PresenceState[] };

// Presence hook
const usePresence = (profileId: string) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceState>>(
    new Map()
  );
  const { subscribe, send, isConnected } = useWebSocket();

  // Send heartbeat to maintain presence
  useEffect(() => {
    if (!isConnected) return;

    // Initial presence
    send("presence_join", { profileId });

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      send("presence_heartbeat", { profileId });
    }, 30000);

    // Cleanup: Send offline status
    return () => {
      clearInterval(heartbeat);
      send("presence_leave", { profileId });
    };
  }, [profileId, isConnected]);

  // Listen for presence updates
  useEffect(() => {
    const unsubscribe = subscribe("presence", (message: PresenceMessage) => {
      if (message.type === "presence_update") {
        setPresenceMap((prev) => {
          const next = new Map(prev);
          next.set(message.profileId, {
            profileId: message.profileId,
            status: message.status,
            lastSeen: Date.now(),
          });
          return next;
        });
      } else if (message.type === "presence_sync") {
        setPresenceMap(new Map(message.profiles.map((p) => [p.profileId, p])));
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Update activity on user interaction
  const updateActivity = useCallback(
    debounce((activity: "watching" | "idle") => {
      send("presence_activity", { profileId, activity });
    }, 5000),
    [profileId, send]
  );

  return {
    presenceMap,
    updateActivity,
    activeProfiles: Array.from(presenceMap.values()).filter(
      (p) => p.status !== "offline"
    ),
  };
};
```

### Q6: How do you handle different device capabilities (TV vs Mobile vs Web)?

**Answer:**

```typescript
/**
 * Device Capability Adaptation Strategy
 *
 * 1. Feature Detection
 * 2. Responsive Component Variants
 * 3. Input Method Adaptation
 * 4. Performance Budgets per Device
 */

// Device detection and capability checking
const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    type: "web",
    supportsTouch: false,
    supportsHDR: false,
    supports4K: false,
    inputMethod: "mouse",
    connectionType: "4g",
    memory: "high",
  });

  useEffect(() => {
    const detect = async () => {
      // Detect device type
      const type = detectDeviceType();

      // Check capabilities
      const caps: DeviceCapabilities = {
        type,
        supportsTouch: "ontouchstart" in window,
        supportsHDR: await checkHDRSupport(),
        supports4K: window.screen.width >= 3840,
        inputMethod: detectInputMethod(),
        connectionType: (navigator as any).connection?.effectiveType || "4g",
        memory: getMemoryTier(),
      };

      setCapabilities(caps);
    };

    detect();
  }, []);

  return capabilities;
};

// Adaptive component rendering
const ContentCard: React.FC<ContentCardProps> = (props) => {
  const { type, inputMethod } = useDeviceCapabilities();

  // TV: Larger cards, D-pad navigation
  if (type === "tv") {
    return (
      <TVContentCard
        {...props}
        focusable
        onFocus={props.onHover}
        onEnter={props.onClick}
      />
    );
  }

  // Mobile: Touch-optimized, swipe gestures
  if (type === "mobile") {
    return (
      <MobileContentCard
        {...props}
        onTap={props.onClick}
        onLongPress={props.onShowDetails}
      />
    );
  }

  // Web: Hover interactions
  return (
    <WebContentCard
      {...props}
      onMouseEnter={props.onHover}
      onClick={props.onClick}
    />
  );
};

// Performance budgets per device
const PERFORMANCE_BUDGETS: Record<DeviceType, PerformanceBudget> = {
  tv: {
    initialBundleSize: 300_000, // 300KB - TVs have limited memory
    imageQuality: "medium",
    animationFrameRate: 30,
    maxConcurrentRequests: 4,
  },
  mobile: {
    initialBundleSize: 150_000, // 150KB - Mobile data constraints
    imageQuality: "adaptive", // Based on connection
    animationFrameRate: 60,
    maxConcurrentRequests: 6,
  },
  web: {
    initialBundleSize: 200_000, // 200KB
    imageQuality: "high",
    animationFrameRate: 60,
    maxConcurrentRequests: 10,
  },
};
```

### Q7: How would you implement offline video download?

**Answer:**

```typescript
/**
 * Offline Download Implementation
 *
 * Components:
 * 1. Download Manager - Manages queue and state
 * 2. Service Worker - Intercepts requests, serves cached content
 * 3. IndexedDB - Stores video segments and metadata
 * 4. DRM Offline License - Time-limited playback rights
 */

class DownloadManager {
  private db: IDBDatabase;
  private activeDownloads: Map<string, DownloadTask> = new Map();

  async queueDownload(
    content: Content,
    quality: QualityLevel
  ): Promise<string> {
    const downloadId = generateId();

    // Check storage quota
    const estimate = await navigator.storage.estimate();
    const required = this.estimateSize(content, quality);

    if (estimate.quota! - estimate.usage! < required) {
      throw new Error("Insufficient storage space");
    }

    // Request offline DRM license
    const offlineLicense = await this.requestOfflineLicense(content.id);

    // Save download metadata
    await this.db.put("downloads", {
      id: downloadId,
      contentId: content.id,
      quality,
      status: "pending",
      progress: 0,
      totalSegments: 0,
      downloadedSegments: 0,
      license: offlineLicense,
      expiresAt: offlineLicense.expiresAt,
      createdAt: Date.now(),
    });

    // Start download
    this.startDownload(downloadId, content, quality);

    return downloadId;
  }

  private async startDownload(
    downloadId: string,
    content: Content,
    quality: QualityLevel
  ) {
    // Get manifest
    const manifest = await playbackApi.getManifest(content.id);
    const segments = this.parseSegments(manifest, quality);

    // Update total segments
    await this.updateDownload(downloadId, {
      status: "downloading",
      totalSegments: segments.length,
    });

    // Download segments with concurrency limit
    const CONCURRENT_DOWNLOADS = 3;
    let downloadedCount = 0;

    for (let i = 0; i < segments.length; i += CONCURRENT_DOWNLOADS) {
      const batch = segments.slice(i, i + CONCURRENT_DOWNLOADS);

      await Promise.all(
        batch.map(async (segment) => {
          const blob = await this.fetchSegment(segment.url);
          await this.storeSegment(downloadId, segment.index, blob);

          downloadedCount++;
          await this.updateDownload(downloadId, {
            downloadedSegments: downloadedCount,
            progress: downloadedCount / segments.length,
          });
        })
      );

      // Check if cancelled
      if (this.activeDownloads.get(downloadId)?.cancelled) {
        await this.cleanupDownload(downloadId);
        return;
      }
    }

    // Mark complete
    await this.updateDownload(downloadId, {
      status: "complete",
      progress: 1,
    });
  }

  async playOffline(downloadId: string): Promise<string> {
    const download = await this.getDownload(downloadId);

    // Check license validity
    if (Date.now() > download.expiresAt) {
      throw new Error("Offline license expired");
    }

    // Generate blob URL for playback
    const segments = await this.getSegments(downloadId);
    const blob = new Blob(segments, { type: "video/mp4" });

    return URL.createObjectURL(blob);
  }
}
```

### Q8-Q15: Additional Interview Questions

```typescript
/**
 * Q8: How do you handle A/B testing in the frontend?
 *
 * Answer: Feature flags with experiment assignment
 * - Server assigns user to experiment variant
 * - Frontend receives flag values at app init
 * - Components conditionally render based on flags
 * - Analytics track exposure and conversion
 */

/**
 * Q9: How would you implement skip intro/recap?
 *
 * Answer:
 * - Content metadata includes timestamps for intro/recap
 * - Player shows skip button at appropriate time
 * - Click handler seeks to end of intro
 * - Track skip rate for analytics
 */

/**
 * Q10: How do you handle internationalization at scale?
 *
 * Answer:
 * - Dynamic locale loading (code split by language)
 * - ICU message format for pluralization
 * - RTL support with logical CSS properties
 * - Server-side locale detection
 * - Lazy load translations per route
 */

/**
 * Q11: What's your approach to accessibility?
 *
 * Answer:
 * - WCAG 2.1 AA compliance
 * - Screen reader testing (NVDA, VoiceOver)
 * - Keyboard navigation throughout
 * - Focus management for modals/routes
 * - Color contrast checking
 * - Reduced motion support
 */

/**
 * Q12: How do you handle search with typeahead?
 *
 * Answer:
 * - Debounced input (300ms)
 * - Cancel previous request (AbortController)
 * - Show suggestions from cache first
 * - Keyboard navigation for suggestions
 * - Recent searches from localStorage
 */

/**
 * Q13: How would you implement "Continue Watching" sync?
 *
 * Answer:
 * - Debounced progress updates (every 10s)
 * - Optimistic local update
 * - Background sync when offline
 * - Conflict resolution (latest timestamp wins)
 * - IndexedDB for offline storage
 */

/**
 * Q14: What monitoring/observability would you set up?
 *
 * Answer:
 * - Core Web Vitals tracking (LCP, FID, CLS)
 * - Error tracking (Sentry)
 * - User timing API for custom metrics
 * - Playback quality metrics
 * - Real User Monitoring (RUM)
 * - Synthetic monitoring (Lighthouse CI)
 */

/**
 * Q15: How would you approach migrating from an old architecture?
 *
 * Answer:
 * - Strangler fig pattern
 * - Feature flags for gradual rollout
 * - Shared component library
 * - Parallel systems with traffic splitting
 * - Comprehensive testing before cutover
 * - Rollback plan
 */
```

---

## 11. Summary & Architecture Rationale

### 11.1 Key Architectural Decisions

| Decision             | Choice                   | Rationale                                 |
| -------------------- | ------------------------ | ----------------------------------------- |
| **UI Framework**     | React 18+                | Concurrent rendering, Suspense, ecosystem |
| **State Management** | Zustand + TanStack Query | Separation of client/server state         |
| **Styling**          | CSS Modules + Tailwind   | Scoped styles, utility classes            |
| **Bundler**          | Next.js/Turbopack        | SSR, code splitting, optimization         |
| **Video Player**     | Shaka Player             | Adaptive streaming, DRM support           |
| **API**              | GraphQL (BFF) + REST     | Flexible queries, optimized payloads      |
| **Real-time**        | WebSocket                | Live features, presence                   |
| **Testing**          | Vitest + Playwright      | Fast unit tests, reliable E2E             |

### 11.2 Trade-off Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TRADE-OFF ANALYSIS                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

Performance vs Bundle Size
├─ Decision: Aggressive code splitting
├─ Trade-off: More network requests vs smaller initial load
└─ Result: 200KB initial bundle, lazy load features

Developer Experience vs Performance
├─ Decision: TypeScript strict mode
├─ Trade-off: Slower builds vs type safety
└─ Result: Caught bugs at compile time, better IDE support

Flexibility vs Simplicity
├─ Decision: Compound components pattern
├─ Trade-off: More complex API vs better customization
└─ Result: Reusable components that scale

Freshness vs Efficiency
├─ Decision: Stale-while-revalidate caching
├─ Trade-off: Potentially stale data vs fast perceived performance
└─ Result: Instant UI with background updates

Offline Support vs Complexity
├─ Decision: Service Worker + IndexedDB
├─ Trade-off: Significant complexity vs offline capability
└─ Result: Full offline playback for downloaded content
```

### 11.3 Scaling Considerations

```
Future Scaling Paths:

1. Micro-frontends
   - Independent team deployments
   - Technology diversity allowed
   - Shared design system

2. Edge Computing
   - Edge-rendered personalization
   - Reduced latency globally
   - CDN-level A/B testing

3. WebAssembly
   - High-performance video processing
   - Client-side ML inference
   - Faster image manipulation

4. Web Components
   - Framework-agnostic components
   - Better encapsulation
   - Cross-platform sharing
```

### 11.4 Final Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    NETFLIX FRONTEND - FINAL ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    User
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CDN / Edge                                          │
│                    (Static Assets, Video Segments)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Application Shell                                     │
│              (Service Worker, Router, Error Boundaries)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
            │    Browse     │ │     Watch     │ │    Search     │
            │    Module     │ │    Module     │ │    Module     │
            └───────────────┘ └───────────────┘ └───────────────┘
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
            │   UI Store    │ │  User Store   │ │ Player Store  │
            │   (Zustand)   │ │   (Zustand)   │ │   (Zustand)   │
            └───────────────┘ └───────────────┘ └───────────────┘
                                      │
                              ┌───────┴───────┐
                              ▼               ▼
                    ┌───────────────┐ ┌───────────────┐
                    │  TanStack     │ │   WebSocket   │
                    │    Query      │ │    Client     │
                    └───────┬───────┘ └───────┬───────┘
                            │                 │
                            └────────┬────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │            API Layer                │
                    │  (Interceptors, Retry, Rate Limit)  │
                    └────────────────┬────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │         Backend Services            │
                    │    (BFF, Microservices, ML)         │
                    └─────────────────────────────────────┘
```

---

**Document Version:** 2.0  
**Last Updated:** January 2026  
**Author:** Senior Principal Front End Engineer  
**Review Status:** Ready for System Design Interview
