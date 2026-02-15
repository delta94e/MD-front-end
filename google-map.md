Google Maps Frontend - High-Level Design (HLD)

1. Problem Statement & Requirements
   1.1 Problem Statement
   Google Maps is a complex, data-intensive mapping application that needs to render millions of geographic features, handle real-time location updates, provide turn-by-turn navigation, and support multiple interaction modes (map exploration, search, directions, Street View) while maintaining 60 FPS performance on devices ranging from low-end mobile phones to desktop computers.
   Core Challenges:
   Rendering massive tile-based maps with smooth panning/zooming at 60 FPS
   Managing multi-layered data (roads, buildings, POIs, traffic, satellite imagery)
   Real-time GPS tracking and route recalculation
   Handling offline scenarios with cached map data
   Supporting multiple concurrent features (navigation + traffic + POI markers)
   Minimizing data transfer while maintaining map quality
   Complex 3D rendering for Street View and Earth mode
   1.2 Functional Requirements
   Core Features:
   Map Rendering & Interaction

Pan, zoom, rotate, and tilt operations
Multi-touch gestures support
Smooth animations between zoom levels (16 zoom levels: 0-21)
Support for multiple map types (roadmap, satellite, terrain, hybrid)
Marker clustering for dense POI areas
Search & Discovery

Location search with autocomplete (debounced, <200ms response)
POI search with filters (restaurants, gas stations, etc.)
Nearby search with radius filtering
Search history and favorites
Directions & Navigation

Multi-modal routing (driving, walking, transit, cycling)
Alternative routes display
Real-time turn-by-turn navigation
ETA calculation with traffic data
Route recalculation on deviation
Street View

360° panoramic imagery
Smooth transitions between panoramas
Time travel feature (historical imagery)
Indoor imagery support
Real-time Features

Live traffic layer
Real-time location sharing
Public transit tracking
Crowdsourced incident reporting
User Roles:
Anonymous Users: Basic map viewing, search
Authenticated Users: Saved places, location history, contributions
Business Owners: Business listing management
Local Guides: Reviews, photos, edits
1.3 Non-Functional Requirements
Performance Metrics:
Metric
Target
Measurement
Initial Load Time (FCP)
< 1.5s
Time to first map tile rendered
Time to Interactive (TTI)
< 3.0s
Map fully interactive
Frame Rate
60 FPS
During pan/zoom operations
Tile Load Time
< 100ms
Per 256x256 tile at good connection
Search Response
< 200ms
Autocomplete suggestions
Route Calculation
< 500ms
Simple route, < 2s complex
Memory Usage
< 150MB
Sustained on mobile devices
Bundle Size (Initial)
< 300KB (gzipped)
Main bundle
Bundle Size (Total)
< 2MB
All chunks loaded
LCP (Largest Contentful Paint)
< 2.5s
Core Web Vital
FID (First Input Delay)
< 100ms
Core Web Vital
CLS (Cumulative Layout Shift)
< 0.1
Core Web Vital

Availability & Reliability:
99.9% uptime
Graceful degradation on slow networks (2G fallback)
Offline map viewing for cached areas
Progressive enhancement for older browsers
Scalability:
Support 100M+ DAU globally
Handle 10K+ concurrent tile requests per region
Support maps with 1M+ markers (with clustering)
1.4 Scale Estimates
User Metrics:

- Total Users: 1B+ monthly active users
- DAU (Daily Active Users): 100M+
- Peak Concurrent Users: 10M+
- Average Session Duration: 15 minutes
- Sessions per DAU: 2.5

Data Transfer:

- Map Tiles: ~50KB per viewport (256x256 tiles)
- Tiles per session: 100-200 tiles
- Data per session: 5-10MB
- Total data transfer: 500TB - 1PB per day
- API Calls: 1B+ requests per day

Geographic Distribution:

- 50+ countries with localized maps
- 20+ languages
- 200+ regions with detailed POI data
- 1M+ km of roads tracked for traffic

Real-time Data:

- 10M+ GPS pings per minute
- 1M+ traffic updates per minute
- 100K+ concurrent navigation sessions

2. High-Level Architecture
   2.1 Architecture Overview
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ GOOGLE MAPS FRONTEND │
   ├─────────────────────────────────────────────────────────────────────────┤
   │ │
   │ ┌────────────────────────────────────────────────────────────────┐ │
   │ │ PRESENTATION LAYER │ │
   │ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │
   │ │ │ Map Canvas │ │ Search Panel │ │ Nav Panel │ │ │
   │ │ │ (WebGL/2D) │ │ (React) │ │ (React) │ │ │
   │ │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ │
   │ │ │ │ │ │ │
   │ │ └──────────────────┼──────────────────┘ │ │
   │ │ │ │ │
   │ └────────────────────────────┼───────────────────────────────────┘ │
   │ │ │
   │ ┌────────────────────────────┼───────────────────────────────────┐ │
   │ │ CONTAINER LAYER │ │
   │ │ ┌──────────────┐ ┌──────┴───────┐ ┌──────────────┐ │ │
   │ │ │MapContainer │ │SearchContainer│ │NavContainer │ │ │
   │ │ │ (State Mgmt) │ │(State Mgmt) │ │(State Mgmt) │ │ │
   │ │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ │
   │ │ │ │ │ │ │
   │ └─────────┼──────────────────┼──────────────────┼────────────────┘ │
   │ │ │ │ │
   │ ┌─────────┼──────────────────┼──────────────────┼────────────────┐ │
   │ │ │ STATE MANAGEMENT LAYER │ │ │
   │ │ │ │ │ │ │
   │ │ ┌────▼────┐ ┌───▼────┐ ┌────▼────┐ │ │
   │ │ │ Map │ │ Search │ │ Nav │ │ │
   │ │ │ Store │◄───────┤ Store │───────►│ Store │ │ │
   │ │ │(Zustand)│ │(Zustand) │(Zustand)│ │ │
   │ │ └────┬────┘ └───┬────┘ └────┬────┘ │ │
   │ │ │ │ │ │ │
   │ │ ┌────▼──────────────────▼──────────────────▼────┐ │ │
   │ │ │ React Query Cache Layer │ │ │
   │ │ │ (Server State: Tiles, POI, Routes) │ │ │
   │ │ └────────────────────┬──────────────────────────┘ │ │
   │ └─────────────────────────┼─────────────────────────────────────┘ │
   │ │ │
   │ ┌─────────────────────────┼─────────────────────────────────────┐ │
   │ │ DATA ACCESS / API LAYER │ │
   │ │ ┌────────────────┼────────────────┐ │ │
   │ │ │ │ │ │ │
   │ │ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ │ │
   │ │ │ Tile │ │ Places │ │ Routes │ │ │
   │ │ │ Service │ │ Service │ │ Service │ │ │
   │ │ └────┬────┘ └────┬────┘ └────┬────┘ │ │
   │ │ │ │ │ │ │
   │ │ └───────────────┼───────────────┘ │ │
   │ │ │ │ │
   │ │ ┌────────────────────▼────────────────────┐ │ │
   │ │ │ HTTP Client (Axios/Fetch) │ │ │
   │ │ │ - Interceptors │ │ │
   │ │ │ - Retry Logic │ │ │
   │ │ │ - Request Deduplication │ │ │
   │ │ └────────────────────┬────────────────────┘ │ │
   │ └─────────────────────────┼─────────────────────────────────────┘ │
   │ │ │
   │ ┌─────────────────────────┼─────────────────────────────────────┐ │
   │ │ INFRASTRUCTURE LAYER │ │
   │ │ ┌───────────┐ ┌─────▼──────┐ ┌──────────────┐ │ │
   │ │ │ IndexedDB │ │ Web Worker │ │Service Worker│ │ │
   │ │ │ Cache │ │ Pool │ │ (Offline) │ │ │
   │ │ └───────────┘ └────────────┘ └──────────────┘ │ │
   │ └────────────────────────────────────────────────────────────────┘ │
   │ │
   └─────────────────────────────────────────────────────────────────────────┘
   │
   │ HTTPS/WSS
   ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ BACKEND SERVICES │
   │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
   │ │ Tile │ │ Places │ │ Routing │ │ Traffic │ │
   │ │ Server │ │ API │ │ API │ │ API │ │
   │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
   │ │
   │ ┌──────────────────────────────────────────────────────────┐ │
   │ │ WebSocket Server (Real-time) │ │
   │ │ - GPS Updates - Traffic - Transit Tracking │ │
   │ └──────────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────────────────────┘

2.2 Component Hierarchy
App
├── ErrorBoundary
│ └── AppShell
│ ├── Header
│ │ ├── Logo
│ │ ├── SearchBox (Autocomplete)
│ │ └── UserMenu
│ │
│ ├── MainContent
│ │ ├── MapCanvas (WebGL/Canvas)
│ │ │ ├── TileLayer
│ │ │ ├── VectorLayer (roads, labels)
│ │ │ ├── MarkerLayer
│ │ │ ├── TrafficLayer
│ │ │ └── OverlayLayer
│ │ │
│ │ ├── SidePanel (conditional)
│ │ │ ├── SearchResults
│ │ │ │ └── PlaceCard[]
│ │ │ ├── DirectionsPanel
│ │ │ │ ├── RouteInput
│ │ │ │ ├── RouteOptions
│ │ │ │ └── RouteSteps
│ │ │ └── PlaceDetails
│ │ │ ├── Photos
│ │ │ ├── Reviews
│ │ │ └── BusinessInfo
│ │ │
│ │ └── MapControls
│ │ ├── ZoomControls
│ │ ├── CompassControl
│ │ ├── LayerSelector
│ │ └── MyLocationButton
│ │
│ ├── NavigationPanel (fullscreen mode)
│ │ ├── RoutePreview
│ │ ├── NextTurnCard
│ │ ├── ETADisplay
│ │ └── NavigationMap
│ │
│ └── StreetViewPanel (conditional)
│ ├── PanoramaViewer
│ ├── TimelineSlider
│ └── NavigationArrows
│
└── GlobalModals
├── ShareLocationModal
├── SavePlaceModal
└── SettingsModal

2.3 Data Flow Diagram
┌─────────────────────────────────────────────────────────────────┐
│ USER INTERACTIONS │
└────────┬────────────────────────────────────────────────────────┘
│
│ (pan, zoom, click, search, navigate)
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ EVENT HANDLERS │
│ - onMapMove() - onSearch() - onDirectionsRequest() │
└────────┬────────────────────────────────────────────────────────┘
│
│ Dispatch Actions
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ STATE STORES (Zustand) │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ mapStore │ │ searchStore │ │ navStore │ │
│ │ │ │ │ │ │ │
│ │ - viewport │ │ - query │ │ - origin │ │
│ │ - zoom │ │ - results │ │ - destination│ │
│ │ - center │ │ - selected │ │ - route │ │
│ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
│ │ │
│ Trigger Queries │ │
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ REACT QUERY (Server State Cache) │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │useMapTiles │ │usePlaceSearch│ │useDirections │ │
│ │ │ │ │ │ │ │
│ │queryKey: │ │queryKey: │ │queryKey: │ │
│ │[bounds,zoom] │ │[query,bounds]│ │[origin,dest] │ │
│ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
│ │ │
│ HTTP Requests │ │
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ API SERVICES │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ TileService │ │PlacesService │ │RoutesService │ │
│ │ │ │ │ │ │ │
│ │getTiles() │ │searchPlaces()│ │getRoute() │ │
│ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
│ │ │
│ Check Cache │ │
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ CACHE LAYER │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ IndexedDB │ │Memory Cache │ │Service Worker│ │
│ │ │ │ │ │ │ │
│ │ (Tiles, POI) │ │ (Hot Data) │ │ (Offline) │ │
│ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
│ │ │
│ If miss → Network Request │
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ HTTP CLIENT │
│ (Axios with interceptors) │
│ │
│ - Request Deduplication │
│ - Retry with Exponential Backoff │
│ - Response Caching │
└────────┬────────────────────────────────────────────────────────┘
│
│ HTTPS
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND APIs │
│ /api/v1/tiles /api/v1/places /api/v1/routes │
└─────────────────────────────────────────────────────────────────┘

2.4 Architecture Principles
WHY This Architecture?

1. Separation of Rendering from Business Logic
   Map rendering (WebGL/Canvas) is isolated from React component tree
   Prevents React re-renders from affecting map performance
   Allows independent optimization of rendering pipeline
   Map updates via imperative API, React handles UI controls
2. Multi-Layer State Management
   Server State (React Query)
   ↓ Fetches & Caches
   Client State (Zustand)
   ↓ Derived & UI State
   Component State (useState/useReducer)
   ↓ Local ephemeral state

Rationale:
React Query: Server data, caching, background refetching, deduplication
Zustand: Lightweight global state, no boilerplate, middleware support
Component State: Form inputs, toggles, temporary UI state 3. Tile-Based Rendering Architecture
Maps divided into 256x256 pixel tiles
Only visible tiles + 1-tile buffer are loaded
Pyramid structure: zoom level 0 = 1 tile, level 21 = 4.4 trillion tiles
Enables progressive loading and efficient caching 4. Service Worker + IndexedDB for Offline
Tiles cached in IndexedDB (50-100MB per region)
Service Worker intercepts network requests
Serves cached tiles when offline
Background sync for user contributions 5. Web Worker Pool for Heavy Computation
Route calculations
Marker clustering (k-means)
GeoJSON parsing and simplification
Keeps main thread free for 60 FPS rendering
2.5 System Invariants
NEVER violate these rules:
Frame Budget: 16.67ms per frame (60 FPS)

No synchronous operations > 10ms on main thread
Batch DOM updates using requestAnimationFrame
Throttle scroll/pan events to max 60Hz
Tile Loading Priority

Priority Order:

1. Viewport center tiles (highest LOD)
2. Viewport edge tiles
3. Adjacent buffer tiles (1-tile radius)
4. Prefetch tiles (direction of pan)

Memory Budget: < 150MB sustained

Unload tiles outside 2-tile buffer radius
Limit marker DOM nodes to 1000 (cluster above)
Clear route polylines on new search
GC vector layers not in viewport
State Consistency Rules

Map viewport is single source of truth for visible bounds
All spatial queries derived from viewport bounds
No duplicate marker rendering (dedupe by place_id)
Route state cleared before new route request
Network Request Constraints

Max 6 concurrent tile requests per domain (HTTP/1.1)
Max 100 concurrent requests (HTTP/2 multiplexing)
Deduplicate identical requests within 100ms window
Cancel in-flight requests on viewport change > 50% overlap
Data Immutability

Never mutate state directly (use Immer for complex updates)
Route objects are immutable (new route = new object)
Tile cache entries never modified after storage

3. Component Architecture
   3.1 Component Breakdown
   3.1.1 Map Canvas Component (Smart Component)
   /\*\*

- MapCanvas - WebGL/Canvas-based map renderer
- This is NOT a React component but a class that manages map rendering
- React component wraps this and provides lifecycle management
  \*/

interface MapCanvasProps {
container: HTMLDivElement;
initialViewport: Viewport;
onViewportChange: (viewport: Viewport) => void;
onFeatureClick: (feature: MapFeature) => void;
}

interface Viewport {
center: { lat: number; lng: number };
zoom: number;
bearing: number; // 0-360 degrees
pitch: number; // 0-60 degrees
}

class MapCanvasEngine {
private gl: WebGL2RenderingContext;
private tileManager: TileManager;
private vectorRenderer: VectorRenderer;
private markerRenderer: MarkerRenderer;
private camera: Camera;

constructor(props: MapCanvasProps) {
this.initWebGL(props.container);
this.setupRenderers();
this.startRenderLoop();
}

/\*\*

- Main render loop - runs at 60 FPS
- Uses requestAnimationFrame for smooth rendering
  \*/
  private renderLoop = () => {
  const frameStart = performance.now();

  // Update camera matrix
  this.camera.update();

  // Render layers in order (back to front)
  this.renderTileLayer(); // Raster tiles (satellite/terrain)
  this.renderVectorLayer(); // Roads, buildings, labels
  this.renderMarkerLayer(); // POI markers
  this.renderOverlayLayer(); // Routes, polygons

  // Monitor frame time
  const frameTime = performance.now() - frameStart;
  if (frameTime > 16.67) {
  console.warn(`Frame dropped: ${frameTime}ms`);
  this.optimizeRendering(); // Adaptive quality
  }

  requestAnimationFrame(this.renderLoop);

};

/\*\*

- Tile rendering with frustum culling
- Only render tiles in view frustum
  \*/
  private renderTileLayer() {
  const visibleTiles = this.tileManager.getVisibleTiles(
  this.camera.getViewport(),
  this.camera.zoom
  );

  // Batch draw calls for performance
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

  for (const tile of visibleTiles) {
  if (!tile.isLoaded) continue;

      // Calculate tile transform matrix
      const tileMatrix = this.camera.getTileMatrix(tile.bounds);

      // Draw tile texture
      this.drawTileTexture(tile.texture, tileMatrix);

  }

}

/\*\*

- Adaptive quality based on performance
- Degrades rendering quality if FPS drops
  \*/
  private optimizeRendering() {
  // Reduce texture quality
  this.tileManager.setTextureQuality('medium');

  // Simplify vector features
  this.vectorRenderer.setSimplificationTolerance(2.0);

  // Reduce marker count
  this.markerRenderer.setClusterThreshold(50);

}

// Public API for React component
public setViewport(viewport: Viewport) {
this.camera.setViewport(viewport);
}

public destroy() {
cancelAnimationFrame(this.animationFrame);
this.gl.getExtension('WEBGL_lose_context')?.loseContext();
}
}

/\*\*

- React wrapper component
  \*/
  const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapCanvasEngine | null>(null);
  const viewport = useMapStore(state => state.viewport);

useEffect(() => {
if (!containerRef.current) return;

    // Initialize map engine
    engineRef.current = new MapCanvasEngine({
      container: containerRef.current,
      initialViewport: viewport,
      onViewportChange: (vp) => {
        useMapStore.getState().setViewport(vp);
      },
      onFeatureClick: (feature) => {
        // Handle feature click
      }
    });

    return () => {
      engineRef.current?.destroy();
    };

}, []);

// Sync viewport changes from state to engine
useEffect(() => {
engineRef.current?.setViewport(viewport);
}, [viewport]);

return (

<div
ref={containerRef}
className="map-canvas"
style={{ width: '100%', height: '100%' }}
/>
);
};

3.1.2 Search Components (Container/Presentational)
/\*\*

- SearchContainer - Smart component managing search logic
  \*/
  const SearchContainer: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

// React Query for autocomplete
const { data: suggestions, isLoading } = useQuery({
queryKey: ['autocomplete', debouncedQuery],
queryFn: () => PlacesService.autocomplete(debouncedQuery),
enabled: debouncedQuery.length >= 3,
staleTime: 5 _ 60 _ 1000, // 5 minutes
gcTime: 10 _ 60 _ 1000, // 10 minutes
});

// Search execution
const searchMutation = useMutation({
mutationFn: PlacesService.search,
onSuccess: (results) => {
useSearchStore.getState().setResults(results);
// Fit map to results bounds
const bounds = calculateBounds(results);
useMapStore.getState().fitBounds(bounds);
}
});

const handleSearch = useCallback((selectedSuggestion: Suggestion) => {
searchMutation.mutate({
query: selectedSuggestion.text,
bounds: useMapStore.getState().viewport.bounds
});
}, []);

return (
<SearchBox
query={query}
onQueryChange={setQuery}
suggestions={suggestions || []}
isLoading={isLoading}
onSelectSuggestion={handleSearch}
/>
);
};

/\*\*

- SearchBox - Presentational component
  \*/
  interface SearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: Suggestion[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  }

const SearchBox: React.FC<SearchBoxProps> = ({
query,
onQueryChange,
suggestions,
isLoading,
onSelectSuggestion
}) => {
const [isFocused, setIsFocused] = useState(false);
const inputRef = useRef<HTMLInputElement>(null);

// Keyboard navigation
const [selectedIndex, setSelectedIndex] = useState(-1);

const handleKeyDown = (e: KeyboardEvent) => {
switch (e.key) {
case 'ArrowDown':
e.preventDefault();
setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
break;
case 'ArrowUp':
e.preventDefault();
setSelectedIndex(i => Math.max(i - 1, -1));
break;
case 'Enter':
if (selectedIndex >= 0) {
onSelectSuggestion(suggestions[selectedIndex]);
}
break;
case 'Escape':
inputRef.current?.blur();
break;
}
};

return (

<div className="search-box">
<input
ref={inputRef}
type="text"
value={query}
onChange={(e) => onQueryChange(e.target.value)}
onFocus={() => setIsFocused(true)}
onBlur={() => setTimeout(() => setIsFocused(false), 200)}
onKeyDown={handleKeyDown}
placeholder="Search Google Maps"
aria-label="Search"
aria-autocomplete="list"
aria-controls="search-suggestions"
/>

      {isFocused && suggestions.length > 0 && (
        <SuggestionList
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={onSelectSuggestion}
          isLoading={isLoading}
        />
      )}
    </div>

);
};

3.1.3 Navigation Component (Atomic Design)
Navigation Feature (Organism)
├── RouteInputPanel (Molecule)
│ ├── LocationInput (Atom) - Origin
│ ├── LocationInput (Atom) - Destination
│ └── RouteOptionsButton (Atom)
│
├── RoutePreviewList (Molecule)
│ └── RouteCard (Atom)[] - Multiple route options
│
└── NavigationView (Molecule)
├── NextTurnCard (Atom)
├── ETADisplay (Atom)
└── ManeuverList (Molecule)

/\*\*

- Atomic Component: LocationInput
  \*/
  interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: 'origin' | 'destination';
  }

const LocationInput: React.FC<LocationInputProps> = ({
value,
onChange,
placeholder,
type
}) => {
return (

<div className="location-input">
<Icon name={type === 'origin' ? 'dot' : 'pin'} />
<input
type="text"
value={value}
onChange={(e) => onChange(e.target.value)}
placeholder={placeholder}
/>
<button aria-label="Clear">×</button>
</div>
);
};

/\*\*

- Molecule: RouteInputPanel
  \*/
  const RouteInputPanel: React.FC = () => {
  const { origin, destination, setOrigin, setDestination } =
  useNavStore();

const handleSwap = () => {
useNavStore.getState().swapOriginDestination();
};

return (

<div className="route-input-panel">
<LocationInput
        value={origin}
        onChange={setOrigin}
        placeholder="Choose starting point"
        type="origin"
      />

      <button
        onClick={handleSwap}
        aria-label="Swap origin and destination"
      >
        ⇅
      </button>

      <LocationInput
        value={destination}
        onChange={setDestination}
        placeholder="Choose destination"
        type="destination"
      />

      <RouteOptionsButton />
    </div>

);
};

/\*\*

- Organism: NavigationContainer
  \*/
  const NavigationContainer: React.FC = () => {
  const { origin, destination, travelMode } = useNavStore();

// Fetch routes when inputs change
const { data: routes, isLoading } = useQuery({
queryKey: ['routes', origin, destination, travelMode],
queryFn: () => RoutesService.getRoutes({
origin,
destination,
mode: travelMode
}),
enabled: !!origin && !!destination,
staleTime: 5 _ 60 _ 1000,
});

// Select route
const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

useEffect(() => {
if (routes && routes.length > 0) {
setSelectedRoute(routes[0]); // Auto-select first route

      // Draw route on map
      useMapStore.getState().setActiveRoute(routes[0]);
    }

}, [routes]);

if (!origin || !destination) {
return <RouteInputPanel />;
}

return (
<>
<RouteInputPanel />

      {isLoading && <LoadingSpinner />}

      {routes && (
        <RoutePreviewList
          routes={routes}
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
        />
      )}
    </>

);
};

3.2 Smart vs Presentational Components
Smart Components (Container):
Manage state and business logic
Connect to stores (Zustand) and server state (React Query)
Handle side effects (API calls, navigation)
Pass data down as props
Examples: MapContainer, SearchContainer, NavigationContainer
Presentational Components (Dumb):
Receive data via props
Emit events via callbacks
No direct state management (except local UI state)
Highly reusable and testable
Examples: SearchBox, RouteCard, PlaceCard, Button
3.3 Component API Design
/\*\*

- PlaceCard Component API
- Displays information about a place (POI, business, address)
  \*/
  interface PlaceCardProps {
  // Data
  place: Place;

// Interaction callbacks
onClick?: (place: Place) => void;
onDirectionsClick?: (place: Place) => void;
onSaveClick?: (place: Place) => void;
onShareClick?: (place: Place) => void;

// Display options
variant?: 'compact' | 'detailed' | 'minimal';
showDistance?: boolean;
showRating?: boolean;
showPhotos?: boolean;

// Accessibility
'aria-label'?: string;
tabIndex?: number;
}

/\*\*

- Usage Example:
  \*/
  <PlaceCard
  place={selectedPlace}
  variant="detailed"
  showDistance={true}
  showRating={true}
  onClick={(place) => {
  useMapStore.getState().panTo(place.location);
  }}
  onDirectionsClick={(place) => {
  useNavStore.getState().setDestination(place);
  }}
  />

  3.4 Compound Components Pattern
  /\*\*

- LayerControl - Compound component for map layer selection
- Allows flexible composition of layer options
  \*/
  const LayerControl: React.FC<{ children: ReactNode }> & {
  Toggle: typeof LayerToggle;
  Option: typeof LayerOption;
  Separator: typeof LayerSeparator;
  } = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

return (
<LayerControlContext.Provider value={{ isOpen, setIsOpen }}>

<div className="layer-control">
{children}
</div>
</LayerControlContext.Provider>
);
};

const LayerToggle: React.FC = () => {
const { isOpen, setIsOpen } = useLayerControlContext();
return (
<button onClick={() => setIsOpen(!isOpen)}>
<LayersIcon />
</button>
);
};

const LayerOption: React.FC<{
layerId: string;
label: string;
icon: ReactNode;
}> = ({ layerId, label, icon }) => {
const { isOpen } = useLayerControlContext();
const { activeLayers, toggleLayer } = useMapStore();

if (!isOpen) return null;

const isActive = activeLayers.includes(layerId);

return (
<button
onClick={() => toggleLayer(layerId)}
className={isActive ? 'active' : ''} >
{icon}
<span>{label}</span>
{isActive && <CheckIcon />}
</button>
);
};

LayerControl.Toggle = LayerToggle;
LayerControl.Option = LayerOption;
LayerControl.Separator = LayerSeparator;

/\*\*

- Usage:
  \*/
  <LayerControl>
  <LayerControl.Toggle />
  <LayerControl.Option
  layerId="traffic"
  label="Traffic"
  icon={<TrafficIcon />}
  />
  <LayerControl.Option
  layerId="transit"
  label="Transit"
  icon={<BusIcon />}
  />
  <LayerControl.Separator />
  <LayerControl.Option
  layerId="satellite"
  label="Satellite"
  icon={<SatelliteIcon />}
  />
  </LayerControl>

4. State Management
   4.1 Global State Structure
   /\*\*

- Complete state shape for Google Maps
  \*/
  interface GlobalState {
  // Map State (Zustand store)
  map: {
  viewport: {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
  pitch: number;
  bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
  };
  };
  activeLayers: string[]; // ['traffic', 'transit', 'bicycle']
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  interactions: {
  isPanning: boolean;
  isZooming: boolean;
  isDraggingMarker: boolean;
  };
  selectedFeature: {
  type: 'place' | 'marker' | 'route' | null;
  id: string | null;
  data: any;
  };
  };

// Search State (Zustand store)
search: {
query: string;
filters: {
category: string | null;
rating: number | null;
priceLevel: number | null;
openNow: boolean;
};
results: Place[];
selectedPlace: Place | null;
recentSearches: string[];
savedPlaces: Place[];
};

// Navigation State (Zustand store)
navigation: {
origin: Location | null;
destination: Location | null;
waypoints: Location[];
travelMode: 'driving' | 'walking' | 'transit' | 'bicycling';
routes: Route[];
selectedRoute: Route | null;
activeNavigation: {
isNavigating: boolean;
currentStep: number;
distanceRemaining: number; // meters
timeRemaining: number; // seconds
currentLocation: { lat: number; lng: number };
heading: number; // degrees
} | null;
};

// User State (Zustand store)
user: {
isAuthenticated: boolean;
profile: UserProfile | null;
preferences: {
units: 'metric' | 'imperial';
language: string;
defaultTravelMode: string;
trafficNotifications: boolean;
};
location: {
current: { lat: number; lng: number } | null;
isTracking: boolean;
accuracy: number; // meters
};
};

// UI State (Zustand store)
ui: {
sidePanel: {
isOpen: boolean;
activeTab: 'search' | 'directions' | 'details' | null;
};
modals: {
share: boolean;
settings: boolean;
savePlace: boolean;
};
toasts: Toast[];
isLoading: {
tiles: boolean;
search: boolean;
routing: boolean;
};
};
}

/\*\*

- Example state with actual values
  \*/
  const exampleState: GlobalState = {
  map: {
  viewport: {
  center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  zoom: 13,
  bearing: 0,
  pitch: 0,
  bounds: {
  north: 37.8324,
  south: 37.7174,
  east: -122.3544,
  west: -122.4844
  }
  },
  activeLayers: ['traffic', 'transit'],
  mapType: 'roadmap',
  interactions: {
  isPanning: false,
  isZooming: false,
  isDraggingMarker: false
  },
  selectedFeature: {
  type: 'place',
  id: 'ChIJVVVVVVVVVVV',
  data: {
  name: 'Ferry Building',
  address: '1 Ferry Building, San Francisco, CA 94111'
  }
  }
  },

search: {
query: 'coffee near me',
filters: {
category: 'cafe',
rating: 4.0,
priceLevel: 2,
openNow: true
},
results: [
{
placeId: 'ChIJ...',
name: 'Blue Bottle Coffee',
rating: 4.5,
userRatingsTotal: 1234,
vicinity: 'Ferry Building',
location: { lat: 37.7955, lng: -122.3937 }
}
],
selectedPlace: null,
recentSearches: ['coffee near me', 'restaurants', 'gas stations'],
savedPlaces: []
},

navigation: {
origin: {
lat: 37.7749,
lng: -122.4194,
address: 'Current Location'
},
destination: {
lat: 37.7955,
lng: -122.3937,
address: 'Ferry Building, SF'
},
waypoints: [],
travelMode: 'driving',
routes: [
{
id: 'route_1',
summary: 'via Market St',
distance: 3200, // meters
duration: 480, // seconds (8 minutes)
steps: [
{
instruction: 'Head north on Main St',
distance: 500,
duration: 60,
polyline: 'encoded_polyline_string'
}
],
bounds: {
north: 37.8,
south: 37.77,
east: -122.39,
west: -122.42
}
}
],
selectedRoute: null,
activeNavigation: null
},

user: {
isAuthenticated: true,
profile: {
id: 'user_123',
name: 'John Doe',
email: 'john@example.com'
},
preferences: {
units: 'metric',
language: 'en-US',
defaultTravelMode: 'driving',
trafficNotifications: true
},
location: {
current: { lat: 37.7749, lng: -122.4194 },
isTracking: true,
accuracy: 10 // meters
}
},

ui: {
sidePanel: {
isOpen: true,
activeTab: 'search'
},
modals: {
share: false,
settings: false,
savePlace: false
},
toasts: [],
isLoading: {
tiles: false,
search: false,
routing: false
}
}
};

4.2 State Management Implementation
/\*\*

- Map Store - Zustand with Immer for immutable updates
  \*/
  import { create } from 'zustand';
  import { immer } from 'zustand/middleware/immer';
  import { devtools, persist } from 'zustand/middleware';

interface MapState {
viewport: Viewport;
activeLayers: string[];
mapType: MapType;
selectedFeature: SelectedFeature | null;

// Actions
setViewport: (viewport: Viewport) => void;
panTo: (location: { lat: number; lng: number }) => void;
zoomTo: (zoom: number) => void;
fitBounds: (bounds: Bounds) => void;
toggleLayer: (layerId: string) => void;
setMapType: (type: MapType) => void;
selectFeature: (feature: SelectedFeature) => void;
clearSelection: () => void;
}

export const useMapStore = create<MapState>()(
devtools(
immer((set, get) => ({
// Initial state
viewport: {
center: { lat: 0, lng: 0 },
zoom: 2,
bearing: 0,
pitch: 0,
bounds: { north: 85, south: -85, east: 180, west: -180 }
},
activeLayers: [],
mapType: 'roadmap',
selectedFeature: null,

      // Actions
      setViewport: (viewport) => set({ viewport }),

      panTo: (location) => set((state) => {
        state.viewport.center = location;
        // Recalculate bounds based on zoom
        state.viewport.bounds = calculateBounds(location, state.viewport.zoom);
      }),

      zoomTo: (zoom) => set((state) => {
        state.viewport.zoom = zoom;
        state.viewport.bounds = calculateBounds(
          state.viewport.center,
          zoom
        );
      }),

      fitBounds: (bounds) => set((state) => {
        const { center, zoom } = calculateViewportFromBounds(bounds);
        state.viewport.center = center;
        state.viewport.zoom = zoom;
        state.viewport.bounds = bounds;
      }),

      toggleLayer: (layerId) => set((state) => {
        const index = state.activeLayers.indexOf(layerId);
        if (index > -1) {
          state.activeLayers.splice(index, 1);
        } else {
          state.activeLayers.push(layerId);
        }
      }),

      setMapType: (type) => set({ mapType: type }),

      selectFeature: (feature) => set({ selectedFeature: feature }),

      clearSelection: () => set({ selectedFeature: null })
    })),
    { name: 'MapStore' }

)
);

/\*\*

- Navigation Store with middleware
  \*/
  interface NavState {
  origin: Location | null;
  destination: Location | null;
  travelMode: TravelMode;
  routes: Route[];
  selectedRoute: Route | null;
  activeNavigation: ActiveNavigation | null;

// Actions
setOrigin: (location: Location) => void;
setDestination: (location: Location) => void;
swapOriginDestination: () => void;
setTravelMode: (mode: TravelMode) => void;
setRoutes: (routes: Route[]) => void;
selectRoute: (route: Route) => void;
startNavigation: (route: Route) => void;
updateNavigationProgress: (data: NavigationUpdate) => void;
stopNavigation: () => void;
}

export const useNavStore = create<NavState>()(
devtools(
persist(
immer((set, get) => ({
origin: null,
destination: null,
travelMode: 'driving',
routes: [],
selectedRoute: null,
activeNavigation: null,

        setOrigin: (location) => set({ origin: location }),

        setDestination: (location) => set({ destination: location }),

        swapOriginDestination: () => set((state) => {
          const temp = state.origin;
          state.origin = state.destination;
          state.destination = temp;
        }),

        setTravelMode: (mode) => set({ travelMode: mode }),

        setRoutes: (routes) => set({ routes, selectedRoute: routes[0] }),

        selectRoute: (route) => set((state) => {
          state.selectedRoute = route;
          // Update map to show selected route
          useMapStore.getState().selectFeature({
            type: 'route',
            id: route.id,
            data: route
          });
        }),

        startNavigation: (route) => set({
          activeNavigation: {
            isNavigating: true,
            currentStep: 0,
            distanceRemaining: route.distance,
            timeRemaining: route.duration,
            currentLocation: route.steps[0].startLocation,
            heading: route.steps[0].bearing
          }
        }),

        updateNavigationProgress: (data) => set((state) => {
          if (state.activeNavigation) {
            Object.assign(state.activeNavigation, data);
          }
        }),

        stopNavigation: () => set({ activeNavigation: null })
      })),
      {
        name: 'nav-storage',
        partialize: (state) => ({
          // Only persist these fields
          travelMode: state.travelMode
        })
      }
    ),
    { name: 'NavStore' }

)
);

4.3 Server State Management (React Query)
/\*\*

- React Query setup with custom defaults
  \*/
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
defaultOptions: {
queries: {
staleTime: 5 _ 60 _ 1000, // 5 minutes
gcTime: 10 _ 60 _ 1000, // 10 minutes (formerly cacheTime)
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 \* 2 \*\* attemptIndex, 30000),
refetchOnWindowFocus: false,
refetchOnReconnect: true,
},
mutations: {
retry: 1,
retryDelay: 1000,
}
}
});

/\*\*

- Custom hook for map tiles with intelligent caching
  \*/
  const useMapTiles = (viewport: Viewport) => {
  const { bounds, zoom } = viewport;

return useQuery({
queryKey: ['tiles', bounds, zoom],
queryFn: async () => {
const tiles = getTileCoordinates(bounds, zoom);

      // Fetch tiles in parallel with priority queue
      const tilePromises = tiles.map((tile, index) =>
        TileService.getTile(tile, {
          priority: index < 9 ? 'high' : 'normal' // Center 9 tiles high priority
        })
      );

      return Promise.all(tilePromises);
    },
    staleTime: Infinity, // Tiles never go stale
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    // Prefetch adjacent tiles
    placeholderData: (previousData) => previousData, // Keep showing old tiles while loading

});
};

/\*\*

- Custom hook for place search with debouncing
  \*/
  const usePlaceSearch = (query: string, bounds: Bounds) => {
  const debouncedQuery = useDebounce(query, 300);

return useQuery({
queryKey: ['places', debouncedQuery, bounds],
queryFn: () => PlacesService.search({
query: debouncedQuery,
bounds,
limit: 20
}),
enabled: debouncedQuery.length >= 3,
staleTime: 10 _ 60 _ 1000, // Search results valid for 10 minutes
select: (data) => {
// Transform and sort data
return data.results.sort((a, b) => b.rating - a.rating);
}
});
};

/\*\*

- Custom hook for directions with optimistic updates
  \*/
  const useDirections = () => {
  const queryClient = useQueryClient();

return useMutation({
mutationFn: RoutesService.getDirections,

    // Optimistic update - show loading state immediately
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['routes'] });

      // Snapshot previous value
      const previousRoutes = queryClient.getQueryData(['routes']);

      // Optimistically update to loading state
      useNavStore.getState().setRoutes([]);

      return { previousRoutes };
    },

    // On success, update cache
    onSuccess: (data) => {
      queryClient.setQueryData(['routes'], data);
      useNavStore.getState().setRoutes(data.routes);
    },

    // On error, rollback
    onError: (err, variables, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(['routes'], context.previousRoutes);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    }

});
};

/\*\*

- Prefetching strategy for tiles
  \*/
  const useTilePrefetch = () => {
  const queryClient = useQueryClient();
  const viewport = useMapStore(state => state.viewport);

useEffect(() => {
// Prefetch tiles in the direction of pan
const prefetchDirection = detectPanDirection(viewport);
const prefetchBounds = calculatePrefetchBounds(viewport, prefetchDirection);
const prefetchZoom = viewport.zoom;

    // Prefetch tiles
    queryClient.prefetchQuery({
      queryKey: ['tiles', prefetchBounds, prefetchZoom],
      queryFn: () => TileService.getTiles(prefetchBounds, prefetchZoom)
    });

}, [viewport, queryClient]);
};

4.4 Caching Strategy
/\*\*

- Multi-tier caching architecture
  \*/

// Tier 1: Memory Cache (React Query)
// - Hot data, frequently accessed
// - Automatic garbage collection
// - 10-30 minute TTL

// Tier 2: IndexedDB (Persistent Cache)
// - Tiles, place details, offline data
// - 50-100MB storage
// - Manual eviction with LRU

// Tier 3: Service Worker Cache
// - Static assets, critical tiles
// - Offline support
// - Version-based invalidation

/\*\*

- IndexedDB tile cache implementation
  _/
  class TileCacheDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'google-maps-tiles';
  private readonly STORE_NAME = 'tiles';
  private readonly MAX_SIZE = 100 _ 1024 \* 1024; // 100MB

async init() {
return new Promise<void>((resolve, reject) => {
const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store with indexes
        const store = db.createObjectStore(this.STORE_NAME, {
          keyPath: 'key'
        });

        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('size', 'size', { unique: false });
      };
    });

}

async get(key: string): Promise<Blob | null> {
if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Update access timestamp for LRU
          this.updateTimestamp(key);
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });

}

async set(key: string, blob: Blob): Promise<void> {
if (!this.db) await this.init();

    // Check cache size and evict if necessary
    const currentSize = await this.getCacheSize();
    const blobSize = blob.size;

    if (currentSize + blobSize > this.MAX_SIZE) {
      await this.evictLRU(blobSize);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.put({
        key,
        blob,
        timestamp: Date.now(),
        size: blobSize
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

}

/\*\*

- Evict least recently used tiles to free up space
  \*/
  private async evictLRU(requiredSpace: number): Promise<void> {
  return new Promise((resolve, reject) => {
  const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
  const store = transaction.objectStore(this.STORE_NAME);
  const index = store.index('timestamp');
  let freedSpace = 0;
  const request = index.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;

          if (cursor && freedSpace < requiredSpace) {
            const record = cursor.value;
            freedSpace += record.size;
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });

  }
  }

export const tileCacheDB = new TileCacheDB();

4.5 State Persistence
/\*\*

- Selective state persistence with Zustand persist middleware
  \*/
  const useUserStore = create<UserState>()(
  persist(
  (set, get) => ({
  preferences: {
  units: 'metric',
  language: 'en-US',
  defaultTravelMode: 'driving',
  trafficNotifications: true
  },
  recentSearches: [],
  savedPlaces: [],
  // Actions
  updatePreferences: (prefs) => set({ preferences: prefs }),
  addRecentSearch: (query) => set((state) => ({
  recentSearches: [query, ...state.recentSearches.slice(0, 9)]
  })),
  savePlace: (place) => set((state) => ({
  savedPlaces: [...state.savedPlaces, place]
  }))
  }),
  {
  name: 'user-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
  // Only persist these fields
  preferences: state.preferences,
  recentSearches: state.recentSearches,
  savedPlaces: state.savedPlaces
  }),
  version: 1,
  migrate: (persistedState: any, version: number) => {
  if (version === 0) {
  // Migration from v0 to v1
  return {
  ...persistedState,
  preferences: {
  ...persistedState.preferences,
  trafficNotifications: true // New field
  }
  };
  }
  return persistedState;
  }
  }
  )
  );

5. Data Flow & API Communication
   5.1 API Architecture
   /\*\*

- API Client with interceptors and retry logic
  \*/
  import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
private client: AxiosInstance;
private pendingRequests: Map<string, Promise<any>> = new Map();

constructor(baseURL: string) {
this.client = axios.create({
baseURL,
timeout: 10000,
headers: {
'Content-Type': 'application/json'
}
});

    this.setupInterceptors();

}

private setupInterceptors() {
// Request interceptor
this.client.interceptors.request.use(
(config) => {
// Add auth token
const token = getAuthToken();
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}

        // Add request ID for tracing
        config.headers['X-Request-ID'] = generateRequestId();

        // Add client metadata
        config.headers['X-Client-Version'] = APP_VERSION;
        config.headers['X-Platform'] = getPlatform();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        // Retry logic with exponential backoff
        if (this.shouldRetry(error)) {
          config.__retryCount = config.__retryCount || 0;

          if (config.__retryCount < 3) {
            config.__retryCount++;

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.min(1000 * 2 ** config.__retryCount, 10000);
            await new Promise(resolve => setTimeout(resolve, delay));

            return this.client(config);
          }
        }

        // Handle specific error codes
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          await this.refreshToken();
          return this.client(config);
        }

        if (error.response?.status === 429) {
          // Rate limited, use exponential backoff
          const retryAfter = error.response.headers['retry-after'] || 60;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );

}

private shouldRetry(error: any): boolean {
// Retry on network errors or 5xx server errors
return (
!error.response ||
(error.response.status >= 500 && error.response.status <= 599) ||
error.code === 'ECONNABORTED' ||
error.code === 'ETIMEDOUT'
);
}

/\*\*

- Request deduplication - prevent multiple identical requests
  \*/
  async request<T>(config: AxiosRequestConfig): Promise<T> {
  const requestKey = this.getRequestKey(config);

  // Check if identical request is already in flight
  if (this.pendingRequests.has(requestKey)) {
  console.log('Deduplicating request:', requestKey);
  return this.pendingRequests.get(requestKey)!;
  }

  // Create new request promise
  const requestPromise = this.client(config).then(
  (response) => {
  this.pendingRequests.delete(requestKey);
  return response.data;
  },
  (error) => {
  this.pendingRequests.delete(requestKey);
  throw error;
  }
  );

  this.pendingRequests.set(requestKey, requestPromise);
  return requestPromise;

}

private getRequestKey(config: AxiosRequestConfig): string {
return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
}

private async refreshToken(): Promise<void> {
// Implementation for token refresh
const refreshToken = getRefreshToken();
const response = await axios.post('/auth/refresh', { refreshToken });
setAuthToken(response.data.accessToken);
}
}

export const apiClient = new APIClient(process.env.REACT_APP_API_BASE_URL!);

5.2 Service Layer Abstraction
/\*\*

- Tile Service - Handles map tile fetching
  \*/
  class TileServiceClass {
  private readonly TILE_SIZE = 256;
  private readonly MAX_ZOOM = 21;

/\*\*

- Get a single tile with caching
  \*/
  async getTile(
  x: number,
  y: number,
  zoom: number,
  options: { priority?: 'high' | 'normal' } = {}
  ): Promise<Blob> {
  const tileKey = `${zoom}/${x}/${y}`;

  // Check IndexedDB cache first
  const cached = await tileCacheDB.get(tileKey);
  if (cached) {
  return cached;
  }

  // Fetch from network
  const url = this.getTileURL(x, y, zoom);
  const response = await fetch(url, {
  priority: options.priority === 'high' ? 'high' : 'auto'
  } as any);

  const blob = await response.blob();

  // Cache in IndexedDB
  await tileCacheDB.set(tileKey, blob);

  return blob;

}

/\*\*

- Batch fetch multiple tiles
  \*/
  async getTiles(bounds: Bounds, zoom: number): Promise<TileData[]> {
  const tiles = this.getTileCoordinates(bounds, zoom);

  // Fetch with concurrency limit (6 per domain for HTTP/1.1)
  const chunks = chunk(tiles, 6);
  const results: TileData[] = [];

  for (const chunk of chunks) {
  const chunkResults = await Promise.allSettled(
  chunk.map(tile => this.getTile(tile.x, tile.y, zoom))
  );

      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            ...chunk[index],
            blob: result.value
          });
        }
      });

  }

  return results;

}

/\*\*

- Calculate which tiles are needed for given bounds
  \*/
  private getTileCoordinates(bounds: Bounds, zoom: number): TileCoord[] {
  const tiles: TileCoord[] = [];

  // Convert lat/lng bounds to tile coordinates
  const minTile = this.latLngToTile(
  bounds.south,
  bounds.west,
  zoom
  );
  const maxTile = this.latLngToTile(
  bounds.north,
  bounds.east,
  zoom
  );

  // Generate all tiles in range
  for (let x = minTile.x; x <= maxTile.x; x++) {
  for (let y = minTile.y; y <= maxTile.y; y++) {
  tiles.push({ x, y, zoom });
  }
  }

  return tiles;

}

private latLngToTile(
lat: number,
lng: number,
zoom: number
): { x: number; y: number } {
const n = Math.pow(2, zoom);
const x = Math.floor(((lng + 180) / 360) _ n);
const y = Math.floor(
((1 - Math.log(Math.tan((lat _ Math.PI) / 180) +
1 / Math.cos((lat _ Math.PI) / 180)) / Math.PI) / 2) _ n
);

    return { x, y };

}

private getTileURL(x: number, y: number, zoom: number): string {
// Use multiple tile servers for load balancing
const server = ['mt0', 'mt1', 'mt2', 'mt3'][Math.floor(Math.random() * 4)];
return `https://${server}.googleapis.com/vt?x=${x}&y=${y}&z=${zoom}`;
}
}

export const TileService = new TileServiceClass();

/\*\*

- Places Service - Search and place details
  \*/
  class PlacesServiceClass {
  async search(params: SearchParams): Promise<SearchResponse> {
  const response = await apiClient.request<SearchResponse>({
  method: 'POST',
  url: '/api/v1/places/search',
  data: params
  });
  return response;
  }

async autocomplete(query: string): Promise<Suggestion[]> {
// Use GET for autocomplete to enable browser caching
const response = await apiClient.request<AutocompleteResponse>({
method: 'GET',
url: '/api/v1/places/autocomplete',
params: { query }
});

    return response.suggestions;

}

async getDetails(placeId: string): Promise<PlaceDetails> {
const response = await apiClient.request<PlaceDetails>({
method: 'GET',
url: `/api/v1/places/${placeId}`,
});

    return response;

}

async getNearby(params: NearbySearchParams): Promise<Place[]> {
const response = await apiClient.request<NearbySearchResponse>({
method: 'POST',
url: '/api/v1/places/nearby',
data: params
});

    return response.results;

}
}

export const PlacesService = new PlacesServiceClass();

/\*\*

- Routes Service - Directions and navigation
  \*/
  class RoutesServiceClass {
  async getDirections(params: DirectionsParams): Promise<DirectionsResponse> {
  const response = await apiClient.request<DirectionsResponse>({
  method: 'POST',
  url: '/api/v1/routes/directions',
  data: params
  });
  return response;
  }

/\*\*

- Get real-time traffic data
  \*/
  async getTraffic(bounds: Bounds): Promise<TrafficData> {
  const response = await apiClient.request<TrafficData>({
  method: 'GET',
  url: '/api/v1/traffic',
  params: {
  north: bounds.north,
  south: bounds.south,
  east: bounds.east,
  west: bounds.west
  }
  });

  return response;

}
}

export const RoutesService = new RoutesServiceClass();

5.3 Real-time Communication (WebSocket)
/\*\*

- WebSocket manager for real-time updates
  \*/
  class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000;
  private messageHandlers: Map<string, Set<Function>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

connect(url: string) {
this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      // Send authentication
      this.send('auth', { token: getAuthToken() });

      // Start ping/pong to keep connection alive
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.stopPing();
      this.attemptReconnect(url);
    };

}

private handleMessage(message: WSMessage) {
const handlers = this.messageHandlers.get(message.type);
if (handlers) {
handlers.forEach(handler => handler(message.data));
}
}

/\*\*

- Subscribe to message type
  \*/
  on(messageType: string, handler: Function) {
  if (!this.messageHandlers.has(messageType)) {
  this.messageHandlers.set(messageType, new Set());
  }
  this.messageHandlers.get(messageType)!.add(handler);

  // Return unsubscribe function
  return () => {
  this.messageHandlers.get(messageType)?.delete(handler);
  };

}

/\*\*

- Send message to server
  \*/
  send(type: string, data: any) {
  if (this.ws?.readyState === WebSocket.OPEN) {
  this.ws.send(JSON.stringify({ type, data }));
  }
  }

private attemptReconnect(url: string) {
if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
this.reconnectAttempts++;
const delay = this.RECONNECT_DELAY \* Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect(url);
      }, delay);
    }

}

private startPing() {
this.pingInterval = setInterval(() => {
this.send('ping', {});
}, 30000); // Ping every 30 seconds
}

private stopPing() {
if (this.pingInterval) {
clearInterval(this.pingInterval);
this.pingInterval = null;
}
}

disconnect() {
this.stopPing();
if (this.ws) {
this.ws.close();
this.ws = null;
}
}
}

export const wsManager = new WebSocketManager();

/\*\*

- Hook for real-time traffic updates
  \*/
  const useRealtimeTraffic = () => {
  const viewport = useMapStore(state => state.viewport);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);

useEffect(() => {
// Subscribe to traffic updates for current viewport
wsManager.send('subscribe_traffic', {
bounds: viewport.bounds
});

    // Handle traffic updates
    const unsubscribe = wsManager.on('traffic_update', (data: TrafficData) => {
      setTrafficData(data);
    });

    return () => {
      wsManager.send('unsubscribe_traffic', {
        bounds: viewport.bounds
      });
      unsubscribe();
    };

}, [viewport.bounds]);

return trafficData;
};

/\*\*

- Hook for real-time navigation updates
  \*/
  const useRealtimeNavigation = () => {
  const { activeNavigation } = useNavStore();

useEffect(() => {
if (!activeNavigation?.isNavigating) return;

    // Subscribe to navigation updates
    wsManager.send('start_navigation', {
      routeId: activeNavigation.routeId
    });

    // Handle GPS updates
    const unsubscribeGPS = wsManager.on('gps_update', (location) => {
      useNavStore.getState().updateNavigationProgress({
        currentLocation: location
      });
    });

    // Handle route recalculation
    const unsubscribeRoute = wsManager.on('route_recalculated', (route) => {
      useNavStore.getState().setRoutes([route]);
    });

    return () => {
      wsManager.send('stop_navigation', {});
      unsubscribeGPS();
      unsubscribeRoute();
    };

}, [activeNavigation?.isNavigating]);
};

6. Performance Optimization
   6.1 Bundle Optimization
   /\*\*

- Code splitting strategy
  \*/

// Route-based code splitting
import { lazy, Suspense } from 'react';

const MapView = lazy(() => import('./views/MapView'));
const StreetView = lazy(() => import('./views/StreetView'));
const NavigationView = lazy(() => import('./views/NavigationView'));

const App = () => {
return (
<Router>
<Suspense fallback={<LoadingSpinner />}>
<Routes>
<Route path="/" element={<MapView />} />
<Route path="/streetview" element={<StreetView />} />
<Route path="/navigate" element={<NavigationView />} />
</Routes>
</Suspense>
</Router>
);
};

/\*\*

- Dynamic imports for heavy libraries
  _/
  const loadClusteringLibrary = async () => {
  const { MarkerClusterer } = await import(
  /_ webpackChunkName: "clustering" \*/
  '@googlemaps/markerclusterer'
  );
  return MarkerClusterer;
  };

/\*\*

- Webpack configuration for optimization
  \*/
  module.exports = {
  optimization: {
  splitChunks: {
  chunks: 'all',
  cacheGroups: {
  // Vendor bundle
  vendor: {
  test: /[\\/]node_modules[\\/]/,
  name: 'vendors',
  priority: 10
  },
  // Map rendering engine (large, rarely changes)
  mapEngine: {
  test: /[\\/]src[\\/]map-engine[\\/]/,
  name: 'map-engine',
  priority: 20
  },
  // UI components (changes frequently)
  ui: {
  test: /[\\/]src[\\/]components[\\/]/,
  name: 'ui',
  priority: 5
  }
  }
  },
  runtimeChunk: 'single', // Extract webpack runtime
  moduleIds: 'deterministic', // Stable module IDs
  },

// Tree shaking
mode: 'production',

// Minimize bundle size
performance: {
maxEntrypointSize: 300 _ 1024, // 300KB
maxAssetSize: 200 _ 1024, // 200KB
hints: 'warning'
}
};

/\*\*

- Bundle analysis
  \*/
  // npm run build -- --analyze
  import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

plugins: [
new BundleAnalyzerPlugin({
analyzerMode: 'static',
reportFilename: 'bundle-report.html'
})
]

6.2 Rendering Optimization
/\*\*

- Virtual scrolling for large lists (search results, place reviews)
  \*/
  import { FixedSizeList } from 'react-window';

const SearchResultsList: React.FC<{ results: Place[] }> = ({ results }) => {
const Row = ({ index, style }: { index: number; style: CSSProperties }) => (

<div style={style}>
<PlaceCard place={results[index]} />
</div>
);

return (
<FixedSizeList
      height={600}
      itemCount={results.length}
      itemSize={120}
      width="100%"
    >
{Row}
</FixedSizeList>
);
};

/\*\*

- Memoization to prevent unnecessary re-renders
  \*/
  const PlaceCard = memo<PlaceCardProps>(({ place, onClick }) => {
  return (
  <div className="place-card" onClick={() => onClick(place)}>
  <img src={place.photo} alt={place.name} loading="lazy" />
  <h3>{place.name}</h3>
  <Rating value={place.rating} />
  </div>
  );
  }, (prevProps, nextProps) => {
  // Custom comparison - only re-render if place ID changes
  return prevProps.place.placeId === nextProps.place.placeId;
  });

/\*\*

- useCallback for stable function references
  \*/
  const MapContainer: React.FC = () => {
  const handleMarkerClick = useCallback((marker: Marker) => {
  useMapStore.getState().selectFeature({
  type: 'marker',
  id: marker.id,
  data: marker
  });
  }, []); // No dependencies - function never changes

return <MapCanvas onMarkerClick={handleMarkerClick} />;
};

/\*\*

- useMemo for expensive computations
  \*/
  const RoutesList: React.FC<{ routes: Route[] }> = ({ routes }) => {
  const sortedRoutes = useMemo(() => {
  return routes
  .slice()
  .sort((a, b) => {
  // Complex sorting logic
  const scoreA = calculateRouteScore(a);
  const scoreB = calculateRouteScore(b);
  return scoreB - scoreA;
  });
  }, [routes]);

return (

<div>
{sortedRoutes.map(route => (
<RouteCard key={route.id} route={route} />
))}
</div>
);
};

/\*\*

- React.startTransition for non-urgent updates
  \*/
  const SearchBox: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

const handleQueryChange = (newQuery: string) => {
// Urgent update - update input immediately
setQuery(newQuery);

    // Non-urgent update - can be interrupted
    startTransition(() => {
      const filtered = filterResults(newQuery);
      setResults(filtered);
    });

};

return (
<input
value={query}
onChange={(e) => handleQueryChange(e.target.value)}
/>
);
};

/\*\*

- Debouncing and throttling
  \*/
  const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

useEffect(() => {
const handler = setTimeout(() => {
setDebouncedValue(value);
}, delay);

    return () => clearTimeout(handler);

}, [value, delay]);

return debouncedValue;
};

const useThrottle = <T extends (...args: any[]) => any>(
callback: T,
delay: number
): T => {
const lastRun = useRef(Date.now());

return useCallback((...args: Parameters<T>) => {
const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }

}, [callback, delay]) as T;
};

// Usage
const MapCanvas: React.FC = () => {
const handlePan = useThrottle((delta: { x: number; y: number }) => {
// Update viewport
updateViewport(delta);
}, 16); // 60 FPS (1000ms / 60 = 16.67ms)

return <canvas onMouseMove={handlePan} />;
};

6.3 Network Optimization
/\*\*

- Resource hints for critical resources
\*/
// In HTML <head>
<link rel="preconnect" href="https://maps.googleapis.com" />
<link rel="dns-prefetch" href="https://mt0.googleapis.com" />
<link rel="preload" href="/map-engine.js" as="script" />

/\*\*

- Image optimization
  _/
  const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  }> = ({ src, alt, width, height }) => {
  // Generate srcset for different device pixel ratios
  const srcset = `
  ${src}?w=${width} 1x,
  ${src}?w=${width _ 2} 2x,
  ${src}?w=${width \* 3} 3x
  `;

return (
<img
src={`${src}?w=${width}`}
srcSet={srcset}
alt={alt}
width={width}
height={height}
loading="lazy"
decoding="async"
/>
);
};

/\*\*

- Prefetching tiles based on pan direction
  \*/
  class PrefetchManager {
  private lastViewport: Viewport | null = null;

prefetchTiles(currentViewport: Viewport) {
if (!this.lastViewport) {
this.lastViewport = currentViewport;
return;
}

    // Detect pan direction
    const deltaLat = currentViewport.center.lat - this.lastViewport.center.lat;
    const deltaLng = currentViewport.center.lng - this.lastViewport.center.lng;

    // Calculate prefetch bounds in pan direction
    const prefetchBounds = this.calculatePrefetchBounds(
      currentViewport,
      { lat: deltaLat, lng: deltaLng }
    );

    // Prefetch tiles with low priority
    TileService.getTiles(prefetchBounds, currentViewport.zoom, {
      priority: 'low'
    });

    this.lastViewport = currentViewport;

}

private calculatePrefetchBounds(
viewport: Viewport,
delta: { lat: number; lng: number }
): Bounds {
// Extend bounds in direction of movement
const { bounds } = viewport;
const extension = 0.1; // 10% extension

    return {
      north: delta.lat > 0 ? bounds.north * (1 + extension) : bounds.north,
      south: delta.lat < 0 ? bounds.south * (1 - extension) : bounds.south,
      east: delta.lng > 0 ? bounds.east * (1 + extension) : bounds.east,
      west: delta.lng < 0 ? bounds.west * (1 - extension) : bounds.west
    };

}
}

/\*\*

- Compression and content encoding
  \*/
  // Axios interceptor for compression
  axios.interceptors.request.use((config) => {
  config.headers['Accept-Encoding'] = 'gzip, deflate, br';
  return config;
  });

/\*\*

- HTTP/2 Server Push configuration
  _/
  // In server configuration (nginx/apache)
  /_
  Link: </map-engine.js>; rel=preload; as=script
  Link: </critical.css>; rel=preload; as=style
  \*/

  6.4 Web Worker for Heavy Computation
  /\*\*

- Web Worker for marker clustering
  \*/
  // clustering.worker.ts
  interface ClusterInput {
  markers: Marker[];
  zoom: number;
  bounds: Bounds;
  }

self.onmessage = (e: MessageEvent<ClusterInput>) => {
const { markers, zoom, bounds } = e.data;

// K-means clustering algorithm
const clusters = performClustering(markers, zoom);

// Filter clusters in viewport
const visibleClusters = clusters.filter(cluster =>
isInBounds(cluster.position, bounds)
);

self.postMessage(visibleClusters);
};

function performClustering(markers: Marker[], zoom: number): Cluster[] {
const gridSize = 100; // pixels
const clusterMap = new Map<string, Cluster>();

markers.forEach(marker => {
// Convert lat/lng to pixel coordinates at current zoom
const pixel = latLngToPixel(marker.position, zoom);

    // Snap to grid
    const gridX = Math.floor(pixel.x / gridSize);
    const gridY = Math.floor(pixel.y / gridSize);
    const key = `${gridX},${gridY}`;

    if (!clusterMap.has(key)) {
      clusterMap.set(key, {
        position: marker.position,
        markers: [],
        count: 0
      });
    }

    const cluster = clusterMap.get(key)!;
    cluster.markers.push(marker);
    cluster.count++;

});

return Array.from(clusterMap.values());
}

// Main thread usage
const clusteringWorker = new Worker(
new URL('./clustering.worker.ts', import.meta.url)
);

const useMarkerClustering = (markers: Marker[]) => {
const viewport = useMapStore(state => state.viewport);
const [clusters, setClusters] = useState<Cluster[]>([]);

useEffect(() => {
clusteringWorker.postMessage({
markers,
zoom: viewport.zoom,
bounds: viewport.bounds
});

    const handleMessage = (e: MessageEvent<Cluster[]>) => {
      setClusters(e.data);
    };

    clusteringWorker.addEventListener('message', handleMessage);

    return () => {
      clusteringWorker.removeEventListener('message', handleMessage);
    };

}, [markers, viewport.zoom, viewport.bounds]);

return clusters;
};

6.5 Core Web Vitals Optimization
/\*\*

- LCP (Largest Contentful Paint) optimization
\*/
// Optimize map canvas rendering - largest content
<link rel="preload" href="/map-tileset.json" as="fetch" crossorigin />

// Prioritize critical CSS

<style>{criticalCSS}</style>

// Defer non-critical CSS

<link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />

/\*\*

- FID (First Input Delay) optimization
  \*/
  // Break up long tasks using scheduler API
  const yieldToMain = () => {
  return new Promise(resolve => {
  setTimeout(resolve, 0);
  });
  };

const processLargeDataset = async (data: any[]) => {
const CHUNK_SIZE = 100;

for (let i = 0; i < data.length; i += CHUNK_SIZE) {
const chunk = data.slice(i, i + CHUNK_SIZE);
processChunk(chunk);

// Yield to main thread await yieldToMain(); } };
/**
CLS (Cumulative Layout Shift) prevention \*/ // Reserve space for dynamic content const PlaceCard: React.FC = () => { return ( <div className="place-card" style={{ minHeight: '120px', // Reserve space aspectRatio: '16/9' // For images }} > <img src={place.photo} alt={place.name} width={320} height={180} loading="lazy" /> </div>
); };
// Avoid injecting content above viewport const SearchResults: React.FC = () => { const containerRef = useRef<HTMLDivElement>(null);
const addResult = (result: Place) => { // Append to bottom, not top containerRef.current?.appendChild(createResultElement(result)); };
return <div ref={containerRef} />; };
/**
Performance monitoring \*/ import { onCLS, onFID, onLCP } from 'web-vitals';
// Report to analytics onCLS((metric) => { analytics.track('CLS', { value: metric.value }); });
onFID((metric) => { analytics.track('FID', { value: metric.value }); });
onLCP((metric) => { analytics.track('LCP', { value: metric.value }); });
// Custom performance marks performance.mark('map-render-start'); // ... map rendering ... performance.mark('map-render-end');
performance.measure( 'map-render', 'map-render-start', 'map-render-end' );
const measure = performance.getEntriesByName('map-render')[0]; console.log(Map render took ${measure.duration}ms);

### 6.6 Memory Leak Prevention

````typescript
/**
 * Cleanup event listeners
 */
const MapCanvas: React.FC = () => {
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
};

/**
 * Cleanup timers and intervals
 */
const useLocationTracking = () => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateLocation();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
};

/**
 * Cleanup WebGL resources
 */
class MapCanvasEngine {
  destroy() {
    // Delete textures
    this.textures.forEach(texture => {
      this.gl.deleteTexture(texture);
    });

    // Delete buffers
    this.buffers.forEach(buffer => {
      this.gl.deleteBuffer(buffer);
    });

    // Delete programs
    this.programs.forEach(program => {
      this.gl.deleteProgram(program);
    });

    // Lose WebGL context
    const ext = this.gl.getExtension('WEBGL_lose_context');
    ext?.loseContext();
  }
}

/**
 * Weak references for caches
 */
class TileCache {
  private cache = new Map<string, WeakRef<Blob>>();
  private registry = new FinalizationRegistry((key: string) => {
    this.cache.delete(key);
  });

  set(key: string, value: Blob) {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    this.registry.register(value, key);
  }

  get(key: string): Blob | undefined {
    const ref = this.cache.get(key);
    return ref?.deref();
  }
}

/**
 * Monitor memory usage
 */
const monitorMemory = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log({
      usedJSHeapSize: memory.usedJSHeapSize / (1024 * 1024),
      totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024),
      jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024)
    });
  }
};

setInterval(monitorMemory, 10000);


7. Error Handling & Edge Cases
7.1 Error Boundary Implementation
/**
 * Top-level error boundary
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    // Track in analytics
    analytics.track('error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error fallback UI
 */
const ErrorFallback: React.FC<{
  error: Error | null;
  onReset: () => void;
}> = ({ error, onReset }) => {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error?.message || 'An unexpected error occurred'}</p>
      <button onClick={onReset}>Try again</button>
      <button onClick={() => window.location.reload()}>
        Reload page
      </button>
    </div>
  );
};

/**
 * Usage in app
 */
<ErrorBoundary
  fallback={<MapErrorFallback />}
  onError={(error) => {
    // Send to Sentry/DataDog
    errorReporter.captureException(error);
  }}
>
  <MapCanvas />
</ErrorBoundary>

7.2 Graceful Degradation
/**
 * Feature detection and fallbacks
 */
const detectFeatures = () => {
  return {
    webgl2: !!document.createElement('canvas').getContext('webgl2'),
    webgl: !!document.createElement('canvas').getContext('webgl'),
    webp: checkWebPSupport(),
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    geolocation: 'geolocation' in navigator
  };
};

/**
 * Adaptive rendering based on capabilities
 */
const MapCanvas: React.FC = () => {
  const features = detectFeatures();

  if (features.webgl2) {
    return <WebGL2MapRenderer />;
  } else if (features.webgl) {
    return <WebGLMapRenderer />;
  } else {
    // Fallback to Canvas 2D
    return <Canvas2DMapRenderer />;
  }
};

/**
 * Network-aware loading
 */
const useNetworkAdaptiveQuality = () => {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateQuality = () => {
        const effectiveType = connection.effectiveType;

        switch (effectiveType) {
          case '4g':
            setQuality('high');
            break;
          case '3g':
            setQuality('medium');
            break;
          case '2g':
          case 'slow-2g':
            setQuality('low');
            break;
        }
      };

      connection.addEventListener('change', updateQuality);
      updateQuality();

      return () => {
        connection.removeEventListener('change', updateQuality);
      };
    }
  }, []);

  return quality;
};

/**
 * Progressive enhancement for older browsers
 */
const SearchBox: React.FC = () => {
  const [supportsAutocomplete] = useState(
    'IntersectionObserver' in window && 'fetch' in window
  );

  if (supportsAutocomplete) {
    return <ModernSearchBox />;
  } else {
    // Basic search without autocomplete
    return <BasicSearchBox />;
  }
};

7.3 Offline Support
/**
 * Service Worker registration
 */
// service-worker.ts
const CACHE_NAME = 'google-maps-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/map-engine.js'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Cache-first strategy for tiles
  if (request.url.includes('/tiles/')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          // Cache the new tile
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      }).catch(() => {
        // Return offline tile placeholder
        return caches.match('/offline-tile.png');
      })
    );
    return;
  }

  // Network-first strategy for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});

/**
 * Offline state management
 */
const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Offline indicator UI
 */
const OfflineIndicator: React.FC = () => {
  const isOnline = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <CloudOffIcon />
      <span>You're offline. Showing cached maps.</span>
    </div>
  );
};

/**
 * Background sync for queued actions
 */
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(registration => {
    // Queue actions when offline
    const queueAction = async (action: Action) => {
      await saveToIndexedDB('pending-actions', action);
      await registration.sync.register('sync-actions');
    };

    // Process queued actions when back online
    self.addEventListener('sync', (event: SyncEvent) => {
      if (event.tag === 'sync-actions') {
        event.waitUntil(
          processPendingActions()
        );
      }
    });
  });
}

7.4 Race Condition Prevention
/**
 * Request cancellation with AbortController
 */
const useAbortableRequest = <T,>(
  requestFn: (signal: AbortSignal) => Promise<T>
) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Cancel previous request
    abortControllerRef.current?.abort();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await requestFn(abortControllerRef.current.signal);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }
      throw error;
    }
  }, [requestFn]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return execute;
};

/**
 * Debounced search with race condition prevention
 */
const SearchContainer: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const searchIdRef = useRef(0);

  const { data: results } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async ({ signal }) => {
      const searchId = ++searchIdRef.current;

      const response = await PlacesService.search(debouncedQuery, { signal });

      // Discard if not the latest search
      if (searchId !== searchIdRef.current) {
        throw new Error('Stale search');
      }

      return response;
    },
    enabled: debouncedQuery.length >= 3
  });

  return <SearchBox results={results} />;
};

/**
 * Optimistic updates with rollback
 */
const useSavePlace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: PlacesService.savePlace,

    onMutate: async (newPlace) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['saved-places'] });

      // Snapshot previous value
      const previousPlaces = queryClient.getQueryData(['saved-places']);

      // Optimistically update
      queryClient.setQueryData(['saved-places'], (old: Place[]) => {
        return [...old, newPlace];
      });

      return { previousPlaces };
    },

    onError: (err, newPlace, context) => {
      // Rollback on error
      queryClient.setQueryData(['saved-places'], context?.previousPlaces);

      // Show error toast
      toast.error('Failed to save place');
    },

    onSuccess: () => {
      toast.success('Place saved successfully');
    }
  });
};

7.5 Form Validation
/**
 * Location input validation
 */
const validateLocation = (input: string): ValidationResult => {
  const errors: string[] = [];

  // Check if empty
  if (!input.trim()) {
    errors.push('Location cannot be empty');
  }

  // Check if valid coordinates
  const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
  if (coordRegex.test(input)) {
    const [lat, lng] = input.split(',').map(Number);

    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Form validation hook
 */
const useFormValidation = <T,>(
  initialValues: T,
  validationRules: ValidationRules<T>
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = useCallback((fieldName?: keyof T) => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    const fieldsToValidate = fieldName
      ? [fieldName]
      : Object.keys(validationRules) as (keyof T)[];

    fieldsToValidate.forEach(field => {
      const rule = validationRules[field];
      const value = values[field];
      const error = rule(value);

      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate on change if field was touched
    if (touched[field]) {
      validate(field);
    }
  };

  const handleBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field);
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate
  };
};

/**
 * Usage in directions form
 */
const DirectionsForm: React.FC = () => {
  const { values, errors, handleChange, handleBlur, validate } =
    useFormValidation(
      { origin: '', destination: '' },
      {
        origin: (value) => !value ? 'Origin is required' : null,
        destination: (value) => !value ? 'Destination is required' : null
      }
    );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validate()) {
      // Submit form
      getDirections(values.origin, values.destination);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.origin}
        onChange={(e) => handleChange('origin', e.target.value)}
        onBlur={() => handleBlur('origin')}
      />
      {errors.origin && <span className="error">{errors.origin}</span>}

      <input
        value={values.destination}
        onChange={(e) => handleChange('destination', e.target.value)}
        onBlur={() => handleBlur('destination')}
      />
      {errors.destination && <span className="error">{errors.destination}</span>}

      <button type="submit">Get Directions</button>
    </form>
  );
};


8. Testing Strategy
8.1 Unit Testing
/**
 * Testing utilities with React Testing Library
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Test wrapper with providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Component tests
 */
describe('SearchBox', () => {
  it('should show suggestions when typing', async () => {
    render(<SearchBox />, { wrapper: createTestWrapper() });

    const input = screen.getByPlaceholderText('Search Google Maps');

    // Type query
    fireEvent.change(input, { target: { value: 'coffee' } });

    // Wait for debounced suggestions
    await waitFor(() => {
      expect(screen.getByText('Coffee shops near you')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('should handle keyboard navigation', () => {
    render(<SearchBox suggestions={mockSuggestions} />);

    const input = screen.getByRole('textbox');

    // Arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // First suggestion should be highlighted
    expect(screen.getByTestId('suggestion-0')).toHaveClass('highlighted');

    // Arrow down again
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Second suggestion highlighted
    expect(screen.getByTestId('suggestion-1')).toHaveClass('highlighted');

    // Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call onSelect
    expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[1]);
  });
});

/**
 * Hook tests
 */
describe('useMapStore', () => {
  it('should update viewport when panning', () => {
    const { result } = renderHook(() => useMapStore());

    const newCenter = { lat: 37.7749, lng: -122.4194 };

    act(() => {
      result.current.panTo(newCenter);
    });

    expect(result.current.viewport.center).toEqual(newCenter);
  });

  it('should toggle layer visibility', () => {
    const { result } = renderHook(() => useMapStore());

    act(() => {
      result.current.toggleLayer('traffic');
    });

    expect(result.current.activeLayers).toContain('traffic');

    act(() => {
      result.current.toggleLayer('traffic');
    });

    expect(result.current.activeLayers).not.toContain('traffic');
  });
});

/**
 * Service tests with mocks
 */
describe('TileService', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
  });

  it('should fetch tile from network', async () => {
    const mockBlob = new Blob(['tile data']);
    (global.fetch as jest.Mock).mockResolvedValue({
      blob: () => Promise.resolve(mockBlob)
    });

    const tile = await TileService.getTile(0, 0, 0);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('x=0&y=0&z=0'),
      expect.any(Object)
    );
    expect(tile).toBe(mockBlob);
  });

  it('should return cached tile', async () => {
    const mockBlob = new Blob(['cached tile']);
    jest.spyOn(tileCacheDB, 'get').mockResolvedValue(mockBlob);

    const tile = await TileService.getTile(0, 0, 0);

    expect(tileCacheDB.get).toHaveBeenCalledWith('0/0/0');
    expect(tile).toBe(mockBlob);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

8.2 Integration Testing
/**
 * Integration test for search flow
 */
describe('Search Flow Integration', () => {
  it('should complete full search flow', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 1. Type search query
    const searchInput = screen.getByPlaceholderText('Search Google Maps');
    await user.type(searchInput, 'coffee shops');

    // 2. Wait for autocomplete
    await waitFor(() => {
      expect(screen.getByText('Coffee shops near you')).toBeInTheDocument();
    });

    // 3. Select suggestion
    await user.click(screen.getByText('Coffee shops near you'));

    // 4. Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
    });

    // 5. Click on result
    await user.click(screen.getByText('Blue Bottle Coffee'));

    // 6. Verify place details shown
    expect(screen.getByRole('heading', { name: 'Blue Bottle Coffee' }))
      .toBeInTheDocument();

    // 7. Verify map updated
    const mapStore = useMapStore.getState();
    expect(mapStore.selectedFeature?.type).toBe('place');
  });
});

/**
 * Integration test for navigation flow
 */
describe('Navigation Flow Integration', () => {
  it('should calculate and display route', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 1. Click directions button
    await user.click(screen.getByLabelText('Directions'));

    // 2. Enter origin
    const originInput = screen.getByPlaceholderText('Choose starting point');
    await user.type(originInput, 'San Francisco, CA');

    // 3. Enter destination
    const destInput = screen.getByPlaceholderText('Choose destination');
    await user.type(destInput, 'Oakland, CA');

    // 4. Submit
    await user.click(screen.getByText('Get Directions'));

    // 5. Wait for routes
    await waitFor(() => {
      expect(screen.getByText('via I-80 E')).toBeInTheDocument();
    });

    // 6. Verify route displayed on map
    const navStore = useNavStore.getState();
    expect(navStore.routes.length).toBeGreaterThan(0);

    // 7. Start navigation
    await user.click(screen.getByText('Start'));

    // 8. Verify navigation started
    expect(navStore.activeNavigation?.isNavigating).toBe(true);
  });
});

8.3 E2E Testing
/**
 * Playwright E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('Google Maps E2E', () => {
  test('should load map and allow interaction', async ({ page }) => {
    await page.goto('https://maps.google.com');

    // Wait for map to load
    await page.waitForSelector('canvas', { state: 'visible' });

    // Verify map is interactive
    const canvas = page.locator('canvas');
    const bbox = await canvas.boundingBox();

    // Pan map
    await page.mouse.move(bbox!.x + 100, bbox!.y + 100);
    await page.mouse.down();
    await page.mouse.move(bbox!.x + 200, bbox!.y + 200);
    await page.mouse.up();

    // Wait for tiles to load
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'map-panned.png' });
  });

  test('should search and show results', async ({ page }) => {
    await page.goto('https://maps.google.com');

    // Search
    await page.fill('[placeholder="Search Google Maps"]', 'pizza near me');
    await page.press('[placeholder="Search Google Maps"]', 'Enter');

    // Wait for results
    await page.waitForSelector('.place-result');

    // Verify at least 3 results
    const results = await page.locator('.place-result').count();
    expect(results).toBeGreaterThanOrEqual(3);

    // Click first result
    await page.click('.place-result:first-child');

    // Verify details panel
    await expect(page.locator('.place-details')).toBeVisible();
  });

  test('should work offline', async ({ page, context }) => {
    // Enable offline mode
    await context.setOffline(true);

    await page.goto('https://maps.google.com');

    // Should show offline indicator
    await expect(page.locator('.offline-indicator')).toBeVisible();

    // Should still show cached tiles
    await expect(page.locator('canvas')).toBeVisible();
  });
});

/**
 * Performance E2E tests
 */
test.describe('Performance', () => {
  test('should meet Core Web Vitals targets', async ({ page }) => {
    await page.goto('https://maps.google.com');

    // Measure LCP
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    expect(lcp).toBeLessThan(2500); // LCP < 2.5s

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(clsValue), 5000);
      });
    });

    expect(cls).toBeLessThan(0.1); // CLS < 0.1
  });
});

8.4 Visual Regression Testing
/**
 * Chromatic / Percy visual tests
 */
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression', () => {
  test('map view snapshots', async ({ page }) => {
    await page.goto('https://maps.google.com');
    await page.waitForSelector('canvas');

    // Capture baseline
    await percySnapshot(page, 'Map View - Default');

    // With traffic layer
    await page.click('[aria-label="Layers"]');
    await page.click('text=Traffic');
    await percySnapshot(page, 'Map View - Traffic Layer');

    // Satellite view
    await page.click('text=Satellite');
    await percySnapshot(page, 'Map View - Satellite');
  });

  test('search results snapshots', async ({ page }) => {
    await page.goto('https://maps.google.com');

    await page.fill('[placeholder="Search Google Maps"]', 'restaurants');
    await page.press('[placeholder="Search Google Maps"]', 'Enter');

    await page.waitForSelector('.search-results');

    await percySnapshot(page, 'Search Results - Restaurants');
  });
});

8.5 Accessibility Testing
/**
 * Axe accessibility tests
 */
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('https://maps.google.com');

    await injectAxe(page);

    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('https://maps.google.com');

    // Tab to search box
    await page.keyboard.press('Tab');
    await expect(page.locator('[placeholder="Search Google Maps"]'))
      .toBeFocused();

    // Type and navigate suggestions
    await page.keyboard.type('coffee');
    await page.waitForSelector('[role="option"]');

    // Arrow down through suggestions
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[role="option"]:first-child'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('https://maps.google.com');

    // Search box
    await expect(page.locator('[placeholder="Search Google Maps"]'))
      .toHaveAttribute('aria-label', 'Search');

    // Zoom controls
    await expect(page.locator('[aria-label="Zoom in"]')).toBeVisible();
    await expect(page.locator('[aria-label="Zoom out"]')).toBeVisible();

    // My location button
    await expect(page.locator('[aria-label="Show your location"]'))
      .toBeVisible();
  });
});


9. Security Considerations
9.1 XSS Prevention
/**
 * Input sanitization
 */
import DOMPurify from 'dompurify';

const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};

/**
 * Safe rendering of user content
 */
const PlaceDescription: React.FC<{ description: string }> = ({ description }) => {
  const sanitized = sanitizeHTML(description);

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitized }} />
  );
};

/**
 * Escape user input in URLs
 */
const createSearchURL = (query: string) => {
  const encoded = encodeURIComponent(query);
  return `/search?q=${encoded}`;
};

/**
 * Content Security Policy
 */
// In HTML <head>
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.googleapis.com;
  connect-src 'self' https://maps.googleapis.com wss://maps.googleapis.com;
  font-src 'self';
  frame-src 'none';
  object-src 'none';
" />

9.2 CSRF Protection
/**
 * CSRF token management
 */
const getCSRFToken = (): string => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || '';
};

/**
 * Include CSRF token in API requests
 */
axios.interceptors.request.use((config) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
    config.headers['X-CSRF-Token'] = getCSRFToken();
  }
  return config;
});

/**
 * Double-submit cookie pattern
 */
const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; secure; samesite=strict`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

9.3 Secure Storage
/**
 * Secure token storage
 */
class SecureStorage {
  private static readonly TOKEN_KEY = 'auth_token';

  /**
   * Store token securely
   * Prefer httpOnly cookies for highest security
   * Use sessionStorage for sensitive data (cleared on tab close)
   */
  static setToken(token: string, rememberMe: boolean = false) {
    if (rememberMe) {
      // Use localStorage for persistent login
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      // Use sessionStorage for temporary login
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    return (
      sessionStorage.getItem(this.TOKEN_KEY) ||
      localStorage.getItem(this.TOKEN_KEY)
    );
  }

  static removeToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Encrypt sensitive data before storing
   */
  static async encryptData(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    return btoa(
      String.fromCharCode(...iv) +
      String.fromCharCode(...new Uint8Array(encryptedBuffer))
    );
  }
}

/**
 * Avoid storing sensitive data in localStorage
 * Use in-memory storage for highly sensitive data
 */
class InMemoryStorage {
  private static store: Map<string, any> = new Map();

  static set(key: string, value: any) {
    this.store.set(key, value);
  }

  static get(key: string) {
    return this.store.get(key);
  }

  static clear() {
    this.store.clear();
  }
}

9.4 Input Validation
/**
 * Validate user inputs
 */
const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    isFinite(lat) &&
    isFinite(lng)
  );
};

const validateZoom = (zoom: number): boolean => {
  return (
    typeof zoom === 'number' &&
    zoom >= 0 &&
    zoom <= 21 &&
    Number.isInteger(zoom)
  );
};

/**
 * Sanitize file uploads
 */
const validateImageUpload = (file: File): ValidationResult => {
  const errors: string[] = [];

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size exceeds 5MB limit.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting on client side
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();

    // Remove old requests outside time window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }
}

// Usage
const searchRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

const handleSearch = (query: string) => {
  if (!searchRateLimiter.canMakeRequest()) {
    toast.error('Too many requests. Please try again later.');
    return;
  }

  PlacesService.search(query);
};


10. Interview Cross-Questions
System Design Questions
Q1: Why did you choose tile-based rendering over vector-based rendering for the map?
Answer: Tile-based rendering (raster tiles) offers several advantages for a global mapping application:
Performance: Pre-rendered 256x256 tiles are static images that can be cached aggressively and rendered quickly via GPU. No need to re-render roads, buildings, labels on every zoom/pan.


Scalability: Server can pre-compute and cache tiles at various zoom levels. Distributing cached images via CDN is cheaper than real-time vector rendering.


Bandwidth: At lower zoom levels (city/country view), vector data would be massive (millions of road segments). Tiles are fixed size (~50KB each).


Rendering Consistency: Same tile looks identical on all devices. Vector rendering quality varies by device GPU.


Trade-offs:
Less flexibility for custom styling (would need to re-generate all tiles)
Higher storage cost on server (pre-computed tiles for 21 zoom levels globally)
For specialized use cases (indoor maps, custom overlays), we supplement with vector layers on top of tiles
When I'd use vector rendering instead:
Navigation turn-by-turn (need to rotate/tilt map)
3D building rendering
Dynamic styling based on user preferences
Indoor maps where tiles don't exist

Q2: How do you handle viewport synchronization between state management and the WebGL rendering engine?
Answer: This is a critical challenge because React's declarative model doesn't fit well with WebGL's imperative rendering.
Approach:
// State store (source of truth for viewport)
const useMapStore = create((set) => ({
  viewport: { center, zoom, bearing, pitch },
  setViewport: (vp) => set({ viewport: vp })
}));

// Rendering engine (imperative)
class MapEngine {
  updateViewport(viewport) {
    this.camera.setViewport(viewport);
    this.requestRender();
  }
}

// React bridge component
const MapCanvas = () => {
  const viewport = useMapStore(state => state.viewport);
  const engineRef = useRef(new MapEngine());

  // Sync state → engine
  useEffect(() => {
    engineRef.current.updateViewport(viewport);
  }, [viewport]);

  // Sync engine → state (user interactions)
  useEffect(() => {
    const handleViewportChange = (newViewport) => {
      useMapStore.getState().setViewport(newViewport);
    };

    engineRef.current.on('viewportchange', handleViewportChange);
    return () => {
      engineRef.current.off('viewportchange', handleViewportChange);
    };
  }, []);
};

Key points:
State is single source of truth
Engine listens to state changes
User interactions (pan/zoom) flow through engine back to state
Throttle viewport updates to 60 FPS max
Use requestAnimationFrame to batch updates

Q3: Explain your caching strategy and cache invalidation approach.
Answer: Multi-tier caching with different TTLs and eviction strategies:
Memory (React Query)
├─ Tiles: Infinite staleTime, 30min GC
├─ Places: 10min staleTime, 30min GC
└─ Routes: 5min staleTime, 15min GC

IndexedDB (Persistent)
├─ Tiles: LRU eviction, 100MB cap
├─ Place Details: Time-based expiration (7 days)
└─ Offline Queue: Manual clearing

Service Worker Cache
├─ Static Assets: Version-based invalidation
└─ Critical Tiles: Manual cache names

Cache Invalidation:
Time-based: Stale-while-revalidate pattern

 useQuery({
  queryKey: ['place', placeId],
  staleTime: 10 * 60 * 1000, // Serve stale for 10min
  gcTime: 30 * 60 * 1000,    // Keep in cache for 30min
  refetchOnMount: 'always',  // Background refresh
});


Mutation-based: Invalidate related queries

 useMutation({
  mutationFn: savePlace,
  onSuccess: () => {
    queryClient.invalidateQueries(['saved-places']);
    queryClient.invalidateQueries(['place', placeId]);
  }
});


Size-based: LRU eviction when IndexedDB > 100MB


Version-based: Service worker cache names include version

 const CACHE_NAME = 'maps-v2'; // Increment on deploy



Q4: How do you prevent memory leaks in a long-running mapping application?
Answer: Several critical areas require attention:
1. WebGL Resources
class MapEngine {
  destroy() {
    // Delete all textures
    this.textures.forEach(tex => this.gl.deleteTexture(tex));

    // Delete all buffers
    this.buffers.forEach(buf => this.gl.deleteBuffer(buf));

    // Delete all shaders/programs
    this.programs.forEach(prog => this.gl.deleteProgram(prog));

    // Force context loss
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

2. Event Listeners
useEffect(() => {
  const handler = () => resizeCanvas();
  window.addEventListener('resize', handler);

  return () => window.removeEventListener('resize', handler);
}, []);

3. Timers and Intervals
useEffect(() => {
  const id = setInterval(updateLocation, 5000);
  return () => clearInterval(id);
}, []);

4. Tile Cache Eviction
// Only keep tiles in viewport + 1-tile buffer
class TileManager {
  evictOffscreenTiles(viewport) {
    const visibleKeys = getVisibleTileKeys(viewport);

    for (const [key, tile] of this.tiles) {
      if (!visibleKeys.has(key)) {
        this.removeTile(key); // Cleanup texture, cancel request
      }
    }
  }
}

5. DOM Node Limits
// Cluster markers when > 1000 visible
const MarkerLayer = ({ markers }) => {
  const clusters = useMemo(() => {
    if (markers.length > 1000) {
      return clusterMarkers(markers);
    }
    return markers;
  }, [markers]);

  return clusters.map(c => <Marker data={c} />);
};

6. WeakMap for Component Caches
// Components garbage collected when not in DOM
const componentCache = new WeakMap();


Q5: How would you implement real-time traffic updates for 1 million concurrent users?
Answer:
Architecture:
Client ─WebSocket→ Load Balancer ─→ WebSocket Servers (Regional)
                                     ↓
                                   PubSub (Redis)
                                     ↓
                                 Traffic Service
                                     ↓
                              Real-time Data Pipeline

Client-side optimizations:
Viewport-based subscriptions: Only subscribe to tiles in viewport

 wsManager.send('subscribe', {
  bounds: viewport.bounds,
  zoom: viewport.zoom
});


Aggregated updates: Server sends bulk updates every 30s instead of per-segment


Differential updates: Only send changed segments

 {
  "type": "traffic_delta",
  "changes": [
    { "segmentId": "123", "level": "heavy", "speed": 15 }
  ]
}


Client-side interpolation: Smoothly animate between updates

 const interpolateTraffic = (old, new, progress) => {
  return {
    speed: lerp(old.speed, new.speed, progress),
    level: progress > 0.5 ? new.level : old.level
  };
};


Graceful degradation: Fall back to less frequent updates under load


Compression: Use binary protocol (Protocol Buffers) instead of JSON


Estimated bandwidth:
Per client: ~1KB every 30s = 2KB/min = 120KB/hour
1M users: 120GB/hour across all servers
Regional distribution reduces per-server load

Performance Questions
Q6: Your initial bundle size is 300KB gzipped. How did you achieve this?
Answer: Several optimization techniques:
1. Code Splitting
// Route-based splitting
const StreetView = lazy(() => import('./views/StreetView'));

// Feature-based splitting
const loadClustering = () => import('@googlemaps/markerclusterer');

2. Tree Shaking
// Import only what you need
import { debounce } from 'lodash-es'; // Not entire lodash

// Webpack config
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};

3. Dynamic Imports for Heavy Libraries
// Load Three.js only when entering 3D view
const load3DRenderer = async () => {
  const THREE = await import('three');
  return new THREE.WebGLRenderer();
};

4. Vendor Bundle Optimization
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10
      }
    }
  }
}

5. Removed Unused Dependencies
# Analyze bundle
npm run build -- --analyze

# Remove unused packages
npm uninstall moment # Use date-fns instead (10x smaller)

6. CSS Optimization
// PurgeCSS to remove unused Tailwind classes
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {},
  plugins: [],
}

Breakdown of 300KB:
React + React DOM: ~130KB
Zustand (state): ~3KB
React Query: ~12KB
Map Engine Core: ~100KB
UI Components: ~30KB
Utilities: ~25KB

Q7: How do you achieve 60 FPS during map panning with thousands of markers?
Answer:
1. Virtual Rendering: Only render markers in viewport
const getVisibleMarkers = (markers, viewport) => {
  return markers.filter(m =>
    isInBounds(m.position, viewport.bounds)
  );
};

2. Clustering: Reduce marker count
const clusters = useMemo(() => {
  if (markers.length > 500) {
    return kMeansClustering(markers, zoom);
  }
  return markers;
}, [markers, zoom]);

3. Throttle Pan Events: Max 60 updates/sec
const handlePan = useThrottle((delta) => {
  updateViewport(delta);
}, 16); // 16.67ms = 60 FPS

4. RAF for Rendering: Batch DOM updates
const updateMarkers = (markers) => {
  requestAnimationFrame(() => {
    markers.forEach(m => m.update());
  });
};

5. CSS Transform for Pan: No layout recalculation
// Instead of changing `left` and `top`
markerElement.style.transform = `translate(${x}px, ${y}px)`;

6. Web Worker for Clustering: Keep main thread free
clusterWorker.postMessage({ markers, zoom });
clusterWorker.onmessage = (e) => {
  setClusters(e.data);
};

7. GPU-accelerated Marker Layer: Use WebGL for > 1000 markers
// Draw markers as textured quads in WebGL
const renderMarkers = (markers) => {
  gl.drawArraysInstanced(
    gl.TRIANGLE_STRIP,
    0,
    4,
    markers.length
  );
};

8. Memoization: Prevent recalculation
const visibleMarkers = useMemo(() =>
  filterVisible(markers, viewport),
  [markers, viewport.bounds] // Not zoom/bearing
);


Q8: Explain your tile prefetching strategy. How do you determine which tiles to prefetch?
Answer:
Strategy: Predictive prefetching based on user behavior
1. Direction-based Prefetching
class TilePrefetcher {
  private history: Viewport[] = [];

  prefetch(currentViewport: Viewport) {
    // Detect pan direction from last 3 viewports
    const direction = this.detectPanDirection();

    if (!direction) return;

    // Calculate prefetch bounds in movement direction
    const prefetchBounds = this.extendBounds(
      currentViewport.bounds,
      direction,
      0.5 // 50% extension
    );

    // Prefetch tiles at current and next zoom level
    this.prefetchTiles(prefetchBounds, currentViewport.zoom);
    this.prefetchTiles(prefetchBounds, currentViewport.zoom + 1);
  }

  private detectPanDirection(): Vector2D | null {
    if (this.history.length < 3) return null;

    const recent = this.history.slice(-3);
    const dx = recent[2].center.lng - recent[0].center.lng;
    const dy = recent[2].center.lat - recent[0].center.lat;

    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude < THRESHOLD) return null;

    return { x: dx / magnitude, y: dy / magnitude };
  }
}

2. Priority Queue: Prefetch closest tiles first
const tilePriority = (tile, viewport) => {
  const distanceFromCenter = calculateDistance(
    tile.center,
    viewport.center
  );

  return 1 / (distanceFromCenter + 1);
};

tiles.sort((a, b) =>
  tilePriority(b, viewport) - tilePriority(a, viewport)
);

3. Network-aware Prefetching
const connection = navigator.connection;

if (connection?.effectiveType === '4g') {
  prefetchRadius = 2; // 2 tiles in each direction
} else if (connection?.effectiveType === '3g') {
  prefetchRadius = 1;
} else {
  prefetchRadius = 0; // No prefetch on slow networks
}

4. Idle Prefetching: Use requestIdleCallback
requestIdleCallback(() => {
  prefetchAdjacentZoomLevels();
}, { timeout: 2000 });

5. Cancel Stale Prefetch Requests
const abortControllers = new Map();

const prefetchTile = (tileKey) => {
  // Cancel existing request for this tile
  abortControllers.get(tileKey)?.abort();

  const controller = new AbortController();
  abortControllers.set(tileKey, controller);

  fetch(tileURL, { signal: controller.signal });
};


Q9: How would you optimize the initial load time (FCP, TTI) of the map application?
Answer:
Target: FCP < 1.5s, TTI < 3s
Optimizations:
1. Critical CSS Inlining
<head>
  <style>
    /* Inline critical CSS for above-fold content */
    .map-container { width: 100vw; height: 100vh; }
    .loading-spinner { /* ... */ }
  </style>

  <!-- Defer non-critical CSS -->
  <link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
</head>

2. Resource Hints
<!-- Establish early connection to tile servers -->
<link rel="preconnect" href="https://mt0.googleapis.com">
<link rel="dns-prefetch" href="https://mt1.googleapis.com">

<!-- Preload critical scripts -->
<link rel="modulepreload" href="/map-engine.js">

3. Progressive Rendering
const MapApp = () => {
  return (
    <>
      {/* Render placeholder immediately */}
      <MapPlaceholder />

      {/* Lazy load heavy components */}
      <Suspense fallback={null}>
        <MapCanvas />
      </Suspense>
    </>
  );
};

4. Optimize Bundle Loading
// Webpack config
output: {
  filename: '[name].[contenthash:8].js',
  chunkFilename: '[name].[contenthash:8].chunk.js',
},

optimization: {
  runtimeChunk: 'single', // Extract webpack runtime
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: 10, // Allow more initial chunks
  }
}

5. Service Worker for Instant Loads
// Precache critical resources
workbox.precaching.precacheAndRoute([
  { url: '/', revision: 'abc123' },
  { url: '/main.js', revision: 'def456' },
  { url: '/map-engine.js', revision: 'ghi789' },
]);

6. SSR for Initial HTML
// Server renders initial HTML with map placeholder
const html = renderToString(
  <App viewport={defaultViewport} />
);

7. Defer Non-Essential Scripts
<script src="/analytics.js" defer></script>
<script src="/chat-widget.js" defer></script>

8. Optimize Images
// Use WebP with fallback
<picture>
  <source srcset="/logo.webp" type="image/webp">
  <img src="/logo.png" alt="Logo">
</picture>

Results:
FCP: 1.2s (lighthouse)
LCP: 2.1s
TTI: 2.8s
Total Bundle: 300KB (gzipped)

Q10: You mentioned React Query for server state. Why not just use Zustand for everything?
Answer:
Separation of Concerns: Server state ≠ Client state
Server State Characteristics:
Asynchronous (network requests)
Potentially stale (needs refetching)
Shared across users (multiple clients might modify)
Needs caching, deduplication, background updates
Client State Characteristics:
Synchronous
Always fresh (UI-driven)
Private to user
No caching needed
Why React Query for Server State:
Automatic Caching & Deduplication

 // Multiple components can call this - only 1 network request
const { data } = useQuery({
  queryKey: ['place', placeId],
  queryFn: () => PlacesService.getDetails(placeId)
});


Background Refetching

 useQuery({
  queryKey: ['traffic'],
  queryFn: getTraffic,
  refetchInterval: 30000, // Auto-refresh every 30s
});


Stale-While-Revalidate

 // Show cached data immediately, fetch fresh in background
staleTime: 5 * 60 * 1000,


Optimistic Updates

 useMutation({
  mutationFn: savePlace,
  onMutate: async (newPlace) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['places']);

    // Snapshot previous
    const previous = queryClient.getQueryData(['places']);

    // Optimistically update
    queryClient.setQueryData(['places'], old => [...old, newPlace]);

    return { previous };
  },
  onError: (err, newPlace, context) => {
    queryClient.setQueryData(['places'], context.previous);
  }
});


Request Deduplication: Multiple components requesting same data → 1 request


Garbage Collection: Auto-remove unused data from cache


Why Zustand for Client State:
UI state (modals open/closed, selected tab)
Viewport (center, zoom) - derived from user interaction
Preferences (units, language)
Example Architecture:
// Server state - React Query
const { data: places } = useQuery(['places', query]);
const { data: routes } = useQuery(['routes', origin, dest]);

// Client state - Zustand
const { viewport, setViewport } = useMapStore();
const { modalOpen, openModal } = useUIStore();


State Management Questions
Q11: How do you handle race conditions in search autocomplete?
Answer:
Problem: User types "coffee shop" quickly
Types "c"     → Request 1 sent
Types "co"    → Request 2 sent
Types "cof"   → Request 3 sent
Request 3 returns first
Request 1 returns second (stale!)

Solutions:
1. Request Cancellation (AbortController)
const useAutocomplete = (query: string) => {
  const abortControllerRef = useRef<AbortController>();

  const { data } = useQuery({
    queryKey: ['autocomplete', query],
    queryFn: async ({ signal }) => {
      // Abort previous request
      abortControllerRef.current?.abort();

      // New abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      return PlacesService.autocomplete(query, {
        signal: controller.signal
      });
    },
    enabled: query.length >= 3
  });

  return data;
};

2. Request ID Tracking
const useAutocomplete = (query: string) => {
  const requestIdRef = useRef(0);

  const { data } = useQuery({
    queryKey: ['autocomplete', query],
    queryFn: async () => {
      const requestId = ++requestIdRef.current;

      const result = await PlacesService.autocomplete(query);

      // Discard if not latest request
      if (requestId !== requestIdRef.current) {
        throw new Error('Stale request');
      }

      return result;
    }
  });

  return data;
};

3. React Query Built-in Solution
// React Query automatically cancels previous queries
const { data } = useQuery({
  queryKey: ['autocomplete', query],
  queryFn: ({ signal }) =>
    PlacesService.autocomplete(query, { signal }),
  enabled: query.length >= 3
});

// PlacesService implementation
async autocomplete(query: string, { signal }: { signal?: AbortSignal }) {
  const response = await fetch(`/api/autocomplete?q=${query}`, {
    signal // Pass abort signal to fetch
  });
  return response.json();
}

4. Debouncing (Prevent Requests)
const debouncedQuery = useDebounce(query, 300);

const { data } = useQuery({
  queryKey: ['autocomplete', debouncedQuery],
  queryFn: () => PlacesService.autocomplete(debouncedQuery),
});

Best Practice: Combine debouncing + cancellation
const debouncedQuery = useDebounce(query, 300); // Reduce requests
const { data } = useQuery({
  queryKey: ['autocomplete', debouncedQuery],
  queryFn: ({ signal }) =>
    PlacesService.autocomplete(debouncedQuery, { signal }), // Cancel stale
});


Q12: When would you choose Context API over Zustand, or vice versa?
Answer:
Use Context API when:
Data is local to component subtree

 <ThemeProvider theme={darkTheme}>
  <App />
</ThemeProvider>


Infrequent updates

 const AuthContext = createContext();
// User logs in once, rarely changes


Dependency injection pattern

 <MapEngineProvider engine={webglEngine}>
  <MapControls />
</MapEngineProvider>


Context API Limitations:
Re-render performance: All consumers re-render on any context change
 const AppContext = createContext();const value = {  user, // Changes frequently  settings // Rarely changes};// Both UserProfile and Settings re-render when user changes!<AppContext.Provider value={value}>  <UserProfile />  <Settings /></AppContext.Provider>


Use Zustand when:
Global state with frequent updates

 // Viewport updates 60 times per second
const useMapStore = create((set) => ({
  viewport: { center, zoom },
  setViewport: (vp) => set({ viewport: vp })
}));


Selective subscriptions (optimization)

 // Only re-render when center changes, not zoom
const center = useMapStore(state => state.viewport.center);


Need middleware (persist, devtools, immer)

 const useStore = create(
  persist(
    immer((set) => ({ /* ... */ })),
    { name: 'storage' }
  )
);


State used across many unrelated components

 // Map, search, navigation all need viewport
const useMapStore = create(/* ... */);


Comparison Example:
// ❌ Context API - Poor performance
const MapContext = createContext();

const MapProvider = ({ children }) => {
  const [viewport, setViewport] = useState(initialViewport);

  // Every pan re-renders ALL consumers!
  return (
    <MapContext.Provider value={{ viewport, setViewport }}>
      {children}
    </MapContext.Provider>
  );
};

// ✅ Zustand - Selective subscriptions
const useMapStore = create((set) => ({
  viewport: initialViewport,
  setViewport: (vp) => set({ viewport: vp })
}));

// Only re-renders when center changes
const MapControls = () => {
  const center = useMapStore(state => state.viewport.center);
  return <div>{center.lat}, {center.lng}</div>;
};

Hybrid Approach:
// Use Context for DI, Zustand for state
const MapEngineContext = createContext();

const MapProvider = ({ children }) => {
  const engine = useMemo(() => new MapEngine(), []);

  return (
    <MapEngineContext.Provider value={engine}>
      {children}
    </MapEngineContext.Provider>
  );
};

// Zustand for viewport state
const useMapStore = create((set) => ({ /* ... */ }));


Security Questions
Q13: How do you prevent XSS attacks when displaying user-generated place reviews?
Answer:
1. Server-side Sanitization (Primary Defense)
# Backend
import bleach

allowed_tags = ['b', 'i', 'em', 'strong', 'a']
allowed_attrs = {'a': ['href', 'title']}

sanitized = bleach.clean(
    user_review,
    tags=allowed_tags,
    attributes=allowed_attrs,
    strip=True
)

2. Client-side Sanitization (Defense in Depth)
import DOMPurify from 'dompurify';

const ReviewText: React.FC<{ html: string }> = ({ html }) => {
  const sanitized = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }, [html]);

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

3. Content Security Policy (CSP)
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://maps.googleapis.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">

4. Escape User Input in URLs
// ❌ Vulnerable
<a href={`/place/${userInput}`}>

// ✅ Safe
<a href={`/place/${encodeURIComponent(userInput)}`}>

5. Use React's Built-in Escaping
// ✅ React automatically escapes
<div>{review.text}</div>

// ❌ Bypassing escaping - dangerous!
<div dangerouslySetInnerHTML={{ __html: review.text }} />

6. Validate on Input
const handleReviewSubmit = (text: string) => {
  // Validate before sending to server
  if (text.includes('<script>') || text.includes('javascript:')) {
    throw new Error('Invalid content detected');
  }

  submitReview(text);
};

7. Use textContent for Plain Text
// If review is plain text (no formatting)
const reviewRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (reviewRef.current) {
    reviewRef.current.textContent = review.text; // Safe
  }
}, [review.text]);

Attack Examples Prevented:
<!-- Attempt 1: Script injection -->
<script>alert('XSS')</script>
→ Sanitized to: &lt;script&gt;alert('XSS')&lt;/script&gt;

<!-- Attempt 2: Event handler -->
<img src="x" onerror="alert('XSS')">
→ Sanitized to: <img src="x">

<!-- Attempt 3: JavaScript URL -->
<a href="javascript:alert('XSS')">Click</a>
→ Sanitized to: <a>Click</a>


Q14: How do you secure API tokens and prevent them from being exposed in the client?
Answer:
Problem: API tokens in client code can be extracted from bundles
Solutions:
1. Backend Proxy (Recommended)
// ❌ Don't do this - token exposed in client
const API_KEY = 'AIzaSyC4E3m5nJ6...';
fetch(`https://maps.googleapis.com/api/place?key=${API_KEY}`);

// ✅ Proxy through backend
// Frontend
fetch('/api/places/search?q=coffee');

// Backend (Node.js)
app.get('/api/places/search', async (req, res) => {
  const response = await fetch(
    `https://maps.googleapis.com/api/place?key=${process.env.MAPS_API_KEY}&q=${req.query.q}`
  );
  res.json(await response.json());
});

2. Short-lived Tokens
// Backend generates short-lived token (15 min)
app.post('/api/auth/token', authenticate, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ token });
});

// Frontend refreshes token before expiry
const useAccessToken = () => {
  const [token, setToken] = useState('');

  useEffect(() => {
    const refreshToken = async () => {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        credentials: 'include' // Send httpOnly cookie
      });

      const data = await response.json();
      setToken(data.token);
    };

    refreshToken();
    const interval = setInterval(refreshToken, 14 * 60 * 1000); // Every 14 min

    return () => clearInterval(interval);
  }, []);

  return token;
};

3. Domain Restrictions (API Key)
// Configure API key in Google Cloud Console
Allowed domains: ['maps.example.com', 'localhost:3000']
Allowed IPs: (none for client-side keys)

4. Rate Limiting per User
// Backend tracks usage per user
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per window
  keyGenerator: (req) => req.user.id
});

app.use('/api', rateLimiter);

5. Secure Storage (Tokens)
// ❌ Don't store in localStorage (XSS risk)
localStorage.setItem('token', accessToken);

// ✅ Use httpOnly cookies (set by backend)
// Cannot be accessed by JavaScript
Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict

// Frontend
fetch('/api/places', {
  credentials: 'include' // Sends cookie automatically
});

6. Environment Variables (Build Time)
// .env.local (not committed to git)
REACT_APP_API_BASE_URL=https://api.example.com

// Frontend code
const API_BASE = process.env.REACT_APP_API_BASE_URL;

// Webpack replaces at build time

7. Server-side Rendering (SSR)
// Next.js API routes - runs on server only
export default async function handler(req, res) {
  const data = await fetch('https://maps.googleapis.com/api/...', {
    headers: {
      'Authorization': `Bearer ${process.env.MAPS_API_KEY}` // Never exposed to client
    }
  });

  res.json(data);
}


Trade-offs & Design Decisions
Q15: Why use WebGL instead of SVG for rendering the map?
Answer:
WebGL Advantages:
Performance at Scale


WebGL: GPU-accelerated, can render millions of triangles at 60 FPS
SVG: DOM-based, slows down significantly with > 1000 elements
Efficient Tile Rendering


WebGL: Render 256x256 textures directly to GPU
SVG: Would need to convert raster tiles to vector (not practical)
Advanced Effects


WebGL: Shaders enable terrain shading, lighting, 3D buildings
SVG: Limited to 2D, no shader support
Memory Efficiency


WebGL: Textures stored in GPU memory, no DOM overhead
SVG: Each element is a DOM node (expensive)
SVG Advantages:
Vector Precision


SVG: Infinite zoom without pixelation
WebGL: Limited by texture resolution
Accessibility


SVG: Screen readers can parse SVG elements
WebGL: Canvas is opaque to assistive tech
Interactivity


SVG: Native event handling on elements
WebGL: Must implement hit detection manually
Simplicity


SVG: Declarative, easier to debug
WebGL: Requires shader programming, matrix math
When I'd use SVG:
Vector overlays (routes, polygons) on top of WebGL map

 <MapCanvas /> {/* WebGL for tiles */}
<svg className="overlay">
  <path d={routePath} /> {/* SVG for route */}
</svg>


Small-scale maps (< 100 elements)


Static maps (no panning/zooming)


Print-quality maps (vector export)


Hybrid Approach (Google Maps):
class MapRenderer {
  // WebGL for raster tiles (satellite, terrain)
  renderTileLayer();

  // WebGL for dense features (roads, buildings at city scale)
  renderVectorLayer();

  // SVG for sparse overlays (route polylines, markers)
  renderOverlayLayer();
}


Q16: Explain your decision to use Zustand over Redux or MobX.
Answer:
Zustand Advantages:
Minimal Boilerplate

 // Zustand - 10 lines
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));

// Redux - 50+ lines
// Action types, action creators, reducer, combine reducers, create store...


No Provider Needed

 // Zustand - use anywhere
const count = useStore(state => state.count);

// Redux - requires Provider wrapper
<Provider store={store}>
  <App />
</Provider>


Built-in Selector Optimization

 // Zustand - automatic shallow comparison
const center = useMapStore(state => state.viewport.center);
// Only re-renders when center changes

// Redux - need useSelector + shallowEqual
const center = useSelector(
  state => state.viewport.center,
  shallowEqual
);


Simpler Async Actions

 // Zustand
const useStore = create((set) => ({
  fetchUser: async (id) => {
    const user = await api.getUser(id);
    set({ user });
  }
}));

// Redux - need redux-thunk or redux-saga


Small Bundle Size


Zustand: 1.2KB
Redux: 8.5KB + React-Redux 6KB = 14.5KB
MobX: 17KB
Redux Advantages:
Ecosystem (middleware, devtools extensions)
Time-travel debugging
Predictability (strict unidirectional flow)
Large team standardization
MobX Advantages:
Reactivity (automatic dependency tracking)
Less boilerplate than Redux
Class-based stores (OOP developers)
When I'd choose Redux:
Large enterprise app with complex state logic
Need strict architectural constraints
Team already familiar with Redux patterns
Heavy use of Redux middleware (sagas, observables)
When I'd choose MobX:
Team prefers OOP over FP
Need computed values with automatic dependency tracking
Don't need strict immutability
For Google Maps:
Zustand: Perfect for viewport state, UI state, navigation
React Query: Server state (tiles, places, routes)
Context: Dependency injection (map engine instance)
This combination gives us:
Minimal boilerplate
Optimal performance
Clear separation of server vs client state

Q17: How would you implement undo/redo functionality for map annotations?
Answer:
Approach: Command pattern with history stack
Implementation:
/**
 * Command interface
 */
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

/**
 * Add marker command
 */
class AddMarkerCommand implements Command {
  private marker: Marker;
  private mapStore: MapStore;

  constructor(marker: Marker, mapStore: MapStore) {
    this.marker = marker;
    this.mapStore = mapStore;
  }

  execute() {
    this.mapStore.addMarker(this.marker);
  }

  undo() {
    this.mapStore.removeMarker(this.marker.id);
  }

  redo() {
    this.execute();
  }
}

/**
 * Move marker command
 */
class MoveMarkerCommand implements Command {
  private markerId: string;
  private oldPosition: LatLng;
  private newPosition: LatLng;
  private mapStore: MapStore;

  constructor(
    markerId: string,
    oldPosition: LatLng,
    newPosition: LatLng,
    mapStore: MapStore
  ) {
    this.markerId = markerId;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
    this.mapStore = mapStore;
  }

  execute() {
    this.mapStore.updateMarkerPosition(this.markerId, this.newPosition);
  }

  undo() {
    this.mapStore.updateMarkerPosition(this.markerId, this.oldPosition);
  }

  redo() {
    this.execute();
  }
}

/**
 * History manager
 */
class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory = 50;

  execute(command: Command) {
    command.execute();

    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new action

    // Limit history size
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  undo() {
    const command = this.undoStack.pop();

    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();

    if (command) {
      command.redo();
      this.undoStack.push(command);
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

/**
 * Zustand store with history
 */
const useAnnotationStore = create<AnnotationState>((set, get) => ({
  markers: [],
  history: new HistoryManager(),

  addMarker: (marker: Marker) => {
    const command = new AddMarkerCommand(marker, get());
    get().history.execute(command);
  },

  moveMarker: (markerId: string, newPosition: LatLng) => {
    const oldPosition = get().markers.find(m => m.id === markerId)?.position;

    if (oldPosition) {
      const command = new MoveMarkerCommand(
        markerId,
        oldPosition,
        newPosition,
        get()
      );
      get().history.execute(command);
    }
  },

  undo: () => {
    get().history.undo();
  },

  redo: () => {
    get().history.redo();
  },

  // Internal methods (called by commands)
  _addMarker: (marker: Marker) => {
    set((state) => ({
      markers: [...state.markers, marker]
    }));
  },

  _removeMarker: (markerId: string) => {
    set((state) => ({
      markers: state.markers.filter(m => m.id !== markerId)
    }));
  },

  _updateMarkerPosition: (markerId: string, position: LatLng) => {
    set((state) => ({
      markers: state.markers.map(m =>
        m.id === markerId ? { ...m, position } : m
      )
    }));
  }
}));

/**
 * React hook for keyboard shortcuts
 */
const useUndoRedo = () => {
  const { undo, redo } = useAnnotationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();

        if (e.shiftKey) {
          redo(); // Ctrl+Shift+Z or Cmd+Shift+Z
        } else {
          undo(); // Ctrl+Z or Cmd+Z
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo(); // Ctrl+Y or Cmd+Y
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
};

/**
 * UI component
 */
const AnnotationToolbar: React.FC = () => {
  const { undo, redo, history } = useAnnotationStore();

  useUndoRedo(); // Enable keyboard shortcuts

  return (
    <div className="toolbar">
      <button
        onClick={undo}
        disabled={!history.canUndo()}
        aria-label="Undo"
      >
        ↶ Undo
      </button>

      <button
        onClick={redo}
        disabled={!history.canRedo()}
        aria-label="Redo"
      >
        ↷ Redo
      </button>
    </div>
  );
};

Advanced Features:
1. Batch Operations
class BatchCommand implements Command {
  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  execute() {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo() {
    // Undo in reverse order
    this.commands.slice().reverse().forEach(cmd => cmd.undo());
  }

  redo() {
    this.execute();
  }
}

2. State Snapshots (Alternative approach)
interface Snapshot {
  markers: Marker[];
  timestamp: number;
}

class SnapshotHistory {
  private snapshots: Snapshot[] = [];
  private currentIndex = -1;

  takeSnapshot(state: any) {
    // Remove future snapshots
    this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);

    // Add new snapshot
    this.snapshots.push({
      ...state,
      timestamp: Date.now()
    });

    this.currentIndex++;
  }

  undo(): Snapshot | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.snapshots[this.currentIndex];
    }
    return null;
  }

  redo(): Snapshot | null {
    if (this.currentIndex < this.snapshots.length - 1) {
      this.currentIndex++;
      return this.snapshots[this.currentIndex];
    }
    return null;
  }
}


Q18: How would you scale this to support multiple maps on the same page?
Answer:
Challenge: Multiple map instances with independent state
Solution 1: Instance-based State
/**
 * Map instance manager
 */
class MapInstance {
  private id: string;
  private engine: MapEngine;
  private store: MapStore;

  constructor(id: string, container: HTMLElement) {
    this.id = id;
    this.engine = new MapEngine(container);
    this.store = createMapStore(id); // Separate store per instance
  }

  getStore() {
    return this.store;
  }

  destroy() {
    this.engine.destroy();
  }
}

/**
 * Create isolated store per map instance
 */
const createMapStore = (mapId: string) => {
  return create<MapState>((set) => ({
    id: mapId,
    viewport: initialViewport,
    markers: [],
    setViewport: (vp) => set({ viewport: vp }),
    // ... other actions
  }));
};

/**
 * React component for map instance
 */
const MapView: React.FC<{ mapId: string }> = ({ mapId }) => {
  const [mapInstance] = useState(() =>
    new MapInstance(mapId, containerRef.current!)
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      mapInstance.destroy();
    };
  }, []);

  return (
    <MapInstanceProvider value={mapInstance}>
      <div ref={containerRef} className="map-container" />
      <MapControls />
    </MapInstanceProvider>
  );
};

/**
 * Usage - multiple maps on page
 */
const ComparisonView: React.FC = () => {
  return (
    <div className="split-view">
      <MapView mapId="map-left" />
      <MapView mapId="map-right" />
    </div>
  );
};

Solution 2: Context-based Isolation
/**
 * Context for map instance
 */
const MapInstanceContext = createContext<MapInstance | null>(null);

const useMapInstance = () => {
  const instance = useContext(MapInstanceContext);
  if (!instance) {
    throw new Error('useMapInstance must be used within MapProvider');
  }
  return instance;
};

/**
 * Map provider component
 */
const MapProvider: React.FC<{
  mapId: string;
  children: ReactNode;
}> = ({ mapId, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<MapInstance | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const newInstance = new MapInstance(mapId, containerRef.current);
      setInstance(newInstance);

      return () => {
        newInstance.destroy();
      };
    }
  }, [mapId]);

  if (!instance) return null;

  return (
    <MapInstanceContext.Provider value={instance}>
      <div ref={containerRef} className="map-container" />
      {children}
    </MapInstanceContext.Provider>
  );
};

/**
 * Map controls using context
 */
const ZoomControls: React.FC = () => {
  const { getStore } = useMapInstance

(); const store = getStore();
const zoom = store(state => state.viewport.zoom); const { zoomIn, zoomOut } = store();
return ( <div> <button onClick={zoomIn}>+</button> <span>{zoom}</span> <button onClick={zoomOut}>-</button> </div> ); };

**Solution 3: Map Registry (Global Coordination)**

```typescript
/**
 * Global registry for all map instances
 */
class MapRegistry {
  private static instances = new Map<string, MapInstance>();

  static register(id: string, instance: MapInstance) {
    this.instances.set(id, instance);
  }

  static unregister(id: string) {
    const instance = this.instances.get(id);
    instance?.destroy();
    this.instances.delete(id);
  }

  static getInstance(id: string): MapInstance | undefined {
    return this.instances.get(id);
  }

  static getAllInstances(): MapInstance[] {
    return Array.from(this.instances.values());
  }

  // Useful for synchronized actions
  static syncZoom(targetZoom: number) {
    this.instances.forEach(instance => {
      instance.getStore().getState().zoomTo(targetZoom);
    });
  }

  static syncCenter(targetCenter: LatLng) {
    this.instances.forEach(instance => {
      instance.getStore().getState().panTo(targetCenter);
    });
  }
}

Performance Considerations:
Shared Resources

 // Singleton tile cache shared across instances
const sharedTileCache = new TileCache();

class MapInstance {
  constructor(id, container) {
    this.engine = new MapEngine(container, {
      tileCache: sharedTileCache // Shared cache
    });
  }
}


Lazy Initialization

 // Only create map when visible
const MapView = ({ mapId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const intersectionRef = useIntersectionObserver({
    onIntersect: () => setIsVisible(true)
  });

  return (
    <div ref={intersectionRef}>
      {isVisible && <MapCanvas mapId={mapId} />}
    </div>
  );
};


Resource Limits

 // Limit active WebGL contexts (max 8-16 per browser)
if (MapRegistry.getAllInstances().length >= 8) {
  console.warn('Max map instances reached');
  // Destroy least recently used instance
  const lruInstance = findLRUInstance();
  MapRegistry.unregister(lruInstance.id);
}



Q19: What's your strategy for handling slow network conditions (2G/3G)?
Answer:
Multi-pronged approach:
1. Network Detection
const useNetworkStatus = () => {
  const [effectiveType, setEffectiveType] = useState('4g');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      setEffectiveType(connection.effectiveType);

      const handleChange = () => {
        setEffectiveType(connection.effectiveType);
      };

      connection.addEventListener('change', handleChange);

      return () => {
        connection.removeEventListener('change', handleChange);
      };
    }
  }, []);

  return effectiveType;
};

2. Adaptive Quality
const TileManager = () => {
  const networkType = useNetworkStatus();

  const tileQuality = useMemo(() => {
    switch (networkType) {
      case '4g':
        return 'high'; // 512x512 tiles, WebP format
      case '3g':
        return 'medium'; // 256x256 tiles, JPEG quality 80
      case '2g':
      case 'slow-2g':
        return 'low'; // 256x256 tiles, JPEG quality 60
      default:
        return 'medium';
    }
  }, [networkType]);

  return <TileRenderer quality={tileQuality} />;
};

3. Progressive Loading
class TileLoader {
  async loadTile(x: number, y: number, zoom: number) {
    // Load low-res tile first (lower zoom level)
    const lowResTile = await this.loadLowRes(x, y, zoom);
    this.renderTile(lowResTile);

    // Then load high-res tile
    const highResTile = await this.loadHighRes(x, y, zoom);
    this.renderTile(highResTile);
  }

  private async loadLowRes(x, y, zoom) {
    // Load tile from zoom - 2 (4x larger area, faster)
    const parentZoom = Math.max(0, zoom - 2);
    const parentX = Math.floor(x / 4);
    const parentY = Math.floor(y / 4);

    return this.fetchTile(parentX, parentY, parentZoom);
  }
}

4. Prefetch Reduction
const usePrefetchStrategy = () => {
  const networkType = useNetworkStatus();

  return useMemo(() => {
    switch (networkType) {
      case '4g':
        return {
          enabled: true,
          radius: 2, // 2 tiles in each direction
          concurrency: 6
        };
      case '3g':
        return {
          enabled: true,
          radius: 1,
          concurrency: 3
        };
      case '2g':
      case 'slow-2g':
        return {
          enabled: false, // No prefetch
          radius: 0,
          concurrency: 1
        };
      default:
        return {
          enabled: true,
          radius: 1,
          concurrency: 3
        };
    }
  }, [networkType]);
};

5. Request Prioritization
class RequestQueue {
  private highPriority: Request[] = [];
  private lowPriority: Request[] = [];
  private inFlight = 0;
  private maxConcurrent = 6;

  async enqueue(request: Request, priority: 'high' | 'low') {
    if (priority === 'high') {
      this.highPriority.push(request);
    } else {
      this.lowPriority.push(request);
    }

    this.processQueue();
  }

  private async processQueue() {
    while (this.inFlight < this.maxConcurrent) {
      const request = this.highPriority.shift() || this.lowPriority.shift();

      if (!request) break;

      this.inFlight++;

      try {
        await request.execute();
      } finally {
        this.inFlight--;
        this.processQueue();
      }
    }
  }
}

6. Compression
// Use WebP instead of PNG/JPEG (30% smaller)
const getTileURL = (x, y, zoom, quality) => {
  const format = supportsWebP() ? 'webp' : 'jpeg';
  const compression = quality === 'low' ? 60 : 80;

  return `/tiles/${zoom}/${x}/${y}.${format}?q=${compression}`;
};

7. Offline Fallback
const useTileWithFallback = (tileKey: string) => {
  const [tile, setTile] = useState<Blob | null>(null);

  useEffect(() => {
    const loadTile = async () => {
      try {
        // Try network first
        const networkTile = await fetchTile(tileKey);
        setTile(networkTile);
      } catch (error) {
        // Fall back to cache
        const cachedTile = await tileCacheDB.get(tileKey);

        if (cachedTile) {
          setTile(cachedTile);
        } else {
          // Show placeholder
          setTile(null);
        }
      }
    };

    loadTile();
  }, [tileKey]);

  return tile;
};

8. User Notification
const SlowConnectionBanner: React.FC = () => {
  const networkType = useNetworkStatus();

  if (['2g', 'slow-2g'].includes(networkType)) {
    return (
      <div className="banner banner-warning">
        <WifiLowIcon />
        <span>Slow connection detected. Map quality reduced to improve loading.</span>
      </div>
    );
  }

  return null;
};


Q20: How do you ensure accessibility (a11y) in a map-based application?
Answer:
Challenges: Maps are inherently visual, making them difficult for screen readers
Solutions:
1. Keyboard Navigation
const MapCanvas: React.FC = () => {
  const { viewport, panBy, zoomIn, zoomOut } = useMapStore();

  const handleKeyDown = (e: KeyboardEvent) => {
    const PAN_AMOUNT = 100; // pixels

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        panBy({ x: 0, y: -PAN_AMOUNT });
        break;
      case 'ArrowDown':
        e.preventDefault();
        panBy({ x: 0, y: PAN_AMOUNT });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        panBy({ x: -PAN_AMOUNT, y: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        panBy({ x: PAN_AMOUNT, y: 0 });
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        zoomOut();
        break;
    }
  };

  return (
    <div
      tabIndex={0}
      role="application"
      aria-label="Interactive map"
      onKeyDown={handleKeyDown}
    >
      {/* Map content */}
    </div>
  );
};

2. ARIA Labels and Roles
const SearchBox: React.FC = () => {
  return (
    <div role="search">
      <input
        type="text"
        aria-label="Search for places"
        aria-autocomplete="list"
        aria-controls="search-results"
        aria-expanded={isOpen}
      />

      <ul
        id="search-results"
        role="listbox"
        aria-label="Search suggestions"
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id}
            role="option"
            aria-selected={index === selectedIndex}
          >
            {suggestion.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

3. Focus Management
const Modal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
  children
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocus.current = document.activeElement as HTMLElement;

      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      // Restore focus
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  // Trap focus within modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

4. Screen Reader Announcements
const LiveRegion: React.FC = () => {
  const viewport = useMapStore(state => state.viewport);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Announce zoom changes
    setAnnouncement(`Zoom level ${viewport.zoom}`);
  }, [viewport.zoom]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

5. Text Alternatives for Visual Content
const PlaceCard: React.FC<{ place: Place }> = ({ place }) => {
  return (
    <div
      role="article"
      aria-labelledby={`place-${place.id}-name`}
    >
      <img
        src={place.photo}
        alt={`Photo of ${place.name}`}
        aria-describedby={`place-${place.id}-description`}
      />

      <h3 id={`place-${place.id}-name`}>
        {place.name}
      </h3>

      <p id={`place-${place.id}-description`}>
        {place.description}
      </p>

      <div aria-label={`Rating: ${place.rating} out of 5 stars`}>
        <Rating value={place.rating} />
      </div>
    </div>
  );
};

6. Skip Links
const App: React.FC = () => {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <a href="#map" className="skip-link">
        Skip to map
      </a>

      <Header />

      <main id="main-content">
        <div id="map" tabIndex={-1}>
          <MapCanvas />
        </div>
      </main>
    </>
  );
};

7. High Contrast Mode
const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
};

// Apply high contrast styles
const MapControls: React.FC = () => {
  const isHighContrast = useHighContrastMode();

  return (
    <div className={isHighContrast ? 'high-contrast' : ''}>
      {/* Controls */}
    </div>
  );
};

8. Alternative Text-Based View
const AlternativeListView: React.FC<{ places: Place[] }> = ({ places }) => {
  return (
    <div role="region" aria-label="Places list view">
      <h2>Places near you</h2>

      <ul>
        {places.map(place => (
          <li key={place.id}>
            <a href={`/place/${place.id}`}>
              {place.name} - {place.vicinity}
              <span className="sr-only">
                , rated {place.rating} stars, {place.distance} away
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Toggle between map and list view
const ViewToggle: React.FC = () => {
  const [view, setView] = useState<'map' | 'list'>('map');

  return (
    <>
      <div role="group" aria-label="View options">
        <button
          onClick={() => setView('map')}
          aria-pressed={view === 'map'}
        >
          Map View
        </button>

        <button
          onClick={() => setView('list')}
          aria-pressed={view === 'list'}
        >
          List View
        </button>
      </div>

      {view === 'map' ? <MapView /> : <AlternativeListView />}
    </>
  );
};


11. Summary & Architecture Rationale
Key Architectural Decisions
1. Separation of Rendering from React
Decision: WebGL/Canvas rendering engine separate from React component tree
Rationale: Prevents React re-renders from affecting 60 FPS map rendering. Imperative rendering API for performance-critical operations.
Trade-off: More complexity but necessary for smooth experience at scale.
2. Multi-Tier State Management
Decision: React Query (server state) + Zustand (client state) + Component State (local UI)
Rationale: Clear separation of concerns, optimal caching strategies for each type, minimal boilerplate.
Alternative Considered: Redux for everything - rejected due to boilerplate and performance (context re-renders).
3. Tile-Based Architecture
Decision: Pre-rendered 256x256 raster tiles with WebGL rendering
Rationale: Proven scalability (Google Maps scale), efficient caching, GPU-accelerated.
Trade-off: Less flexible than vector rendering but handles global scale better.
4. Multi-Tier Caching
Decision: Memory (React Query) → IndexedDB → Service Worker
Rationale: Progressive enhancement, offline support, optimized TTLs per data type.
Key Metric: 90%+ cache hit rate for repeated visits.
5. Web Workers for Computation
Decision: Offload clustering, route calculation to worker threads
Rationale: Keep main thread free for 60 FPS rendering, prevent jank.
Impact: Reduced frame drops by 80% during heavy computation.
Scaling Considerations
Current Architecture Supports:
100M+ DAU
10M+ concurrent users
1M+ markers with clustering
Sub-100ms tile load times
60 FPS pan/zoom on mid-range devices
To Scale Further (1B+ users):
Edge Computing: Deploy tile cache to 100+ edge locations
HTTP/3: Reduce latency with QUIC protocol
WebAssembly: Rewrite critical rendering paths in Rust/C++
Server-Sent Events: Replace WebSocket for one-way real-time updates (lower overhead)
Micro-frontends: Split into independent apps (Search, Navigation, Street View) for faster deploys
Future Improvements
Performance:
Implement Concurrent React rendering for smoother transitions
Use OffscreenCanvas in Web Worker for rendering
Adopt WebGPU when browser support matures (10x faster than WebGL)
Features:
AR navigation using WebXR APIs
Machine learning-powered route optimization (TensorFlow.js)
Real-time collaborative map editing (CRDT-based)
Developer Experience:
Upgrade to React Server Components for better SSR
Adopt Suspense for data fetching throughout
Implement micro-frontend architecture for team autonomy

Final Thoughts:
This architecture represents production-grade patterns battle-tested at Google Maps scale. The key insight is separation of concerns: rendering, state, data fetching, and caching each have specialized solutions optimized for their requirements. The result is a system that delivers smooth 60 FPS performance while serving 100M+ users, with room to scale to 1B+.







````
