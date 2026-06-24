/**
 * CoreProductDemo.tsx
 *
 * Core product features built for a B2B field-service / compliance platform.
 *
 * FEATURES DEMONSTRATED
 *   🗺 Mapbox Location Mapping — simulated with SVG; real impl uses react-map-gl
 *   📄 Document Upload & Verification — drag-and-drop, status workflow, rejection
 *   📋 Audit Trail — immutable log, categorised, filterable, exportable
 *   🧪 Testing & CI/CD Pipeline — Jest/RTL, Playwright, Storybook, GitHub Actions
 *
 * TECH STACK (real project)
 *   React 18 · React Query v5 · Tailwind CSS · Auth0 · API middleware
 *   Storybook 8 · Jest + React Testing Library · Playwright · GitHub Actions
 *
 * ARCHITECTURE PATTERNS
 *   - React Query + API middleware: axios interceptor attaches Auth0 JWT automatically
 *   - Document verification: optimistic status + presigned S3 upload URLs
 *   - Audit trail: append-only events, never edited, server-signed timestamps
 *   - Location mapping: react-map-gl layer with GeoJSON FeatureCollection
 *   - Testing: custom renderWithProviders wrapper, MSW for API mocking
 *   - CI/CD: parallel jobs (unit, e2e, Storybook) → staged deployments
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type DocStatus = "pending" | "in-review" | "verified" | "rejected";
type DocType = "identity" | "proof-of-address" | "tax" | "contract" | "report" | "photo";
type AuditCategory = "auth" | "document" | "location" | "data" | "system";

interface Location {
  id: string;
  name: string;
  address: string;
  type: "property" | "inspection" | "office";
  status: "active" | "pending" | "flagged";
  lat: number; lng: number;       // real coords stored in GeoJSON
  svgX: number; svgY: number;    // mapped to demo SVG canvas
  documents: number;
  lastVisit: string;
}

interface Document {
  id: string;
  name: string;
  type: DocType;
  status: DocStatus;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  rejectionReason?: string;
  locationId?: string;
}

interface AuditEntry {
  id: string;
  category: AuditCategory;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  meta?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const LOCATIONS: Location[] = [
  { id:"l1", name:"Central Branch",        address:"123 Main St, San Francisco, CA", type:"office",     status:"active",  lat:37.77, lng:-122.41, svgX:320, svgY:200, documents:14, lastVisit:"2024-11-10" },
  { id:"l2", name:"Harbor View Property",  address:"45 Pier Blvd, SF, CA",           type:"property",   status:"active",  lat:37.80, lng:-122.39, svgX:430, svgY:140, documents:6,  lastVisit:"2024-11-08" },
  { id:"l3", name:"Mission District Site", address:"888 Valencia St, SF, CA",        type:"inspection", status:"pending", lat:37.76, lng:-122.42, svgX:260, svgY:240, documents:2,  lastVisit:"2024-11-05" },
  { id:"l4", name:"SOMA Complex",          address:"512 Howard St, SF, CA",          type:"property",   status:"active",  lat:37.78, lng:-122.40, svgX:380, svgY:210, documents:9,  lastVisit:"2024-11-11" },
  { id:"l5", name:"Potrero Hill Unit",     address:"1200 17th St, SF, CA",           type:"property",   status:"flagged", lat:37.76, lng:-122.40, svgX:370, svgY:260, documents:4,  lastVisit:"2024-10-28" },
  { id:"l6", name:"Castro Inspection",     address:"400 Castro St, SF, CA",          type:"inspection", status:"pending", lat:37.76, lng:-122.43, svgX:220, svgY:255, documents:1,  lastVisit:"2024-11-03" },
  { id:"l7", name:"North Beach Property",  address:"700 Columbus Ave, SF, CA",       type:"property",   status:"active",  lat:37.80, lng:-122.41, svgX:340, svgY:130, documents:11, lastVisit:"2024-11-09" },
];

const LOC_STATUS_CFG = {
  active:  { color: "#4ade80", bg: "#052e16" },
  pending: { color: "#fbbf24", bg: "#451a03" },
  flagged: { color: "#ef4444", bg: "#450a0a" },
};

const TYPE_ICON: Record<Location["type"], string>     = { property: "🏠", inspection: "🔍", office: "🏢" };
const DOC_TYPE_ICON: Record<DocType, string>          = { identity: "🪪", "proof-of-address": "🏠", tax: "📑", contract: "📜", report: "📋", photo: "🖼" };
const DOC_STATUS_CFG: Record<DocStatus, { color: string; bg: string; label: string }> = {
  pending:   { color: "#94a3b8", bg: "#1e293b",  label: "Pending" },
  "in-review": { color: "#fbbf24", bg: "#451a03", label: "In Review" },
  verified:  { color: "#4ade80", bg: "#052e16",  label: "Verified" },
  rejected:  { color: "#ef4444", bg: "#450a0a",  label: "Rejected" },
};
const AUDIT_CFG: Record<AuditCategory, { color: string; icon: string }> = {
  auth:     { color: "#818cf8", icon: "🔐" },
  document: { color: "#22d3ee", icon: "📄" },
  location: { color: "#34d399", icon: "📍" },
  data:     { color: "#fbbf24", icon: "✏️" },
  system:   { color: "#94a3b8", icon: "⚙" },
};

const DOCUMENTS: Document[] = [
  { id:"d1",  name:"passport_scan_nguyen.pdf",       type:"identity",          status:"verified",   uploadedBy:"Nguyen T. Anh",  uploadedAt:"2024-11-01", size:"1.2 MB", locationId:"l1" },
  { id:"d2",  name:"utility_bill_oct2024.pdf",       type:"proof-of-address",  status:"verified",   uploadedBy:"Le Minh Duc",    uploadedAt:"2024-11-02", size:"340 KB", locationId:"l1" },
  { id:"d3",  name:"inspection_report_harbor.pdf",   type:"report",            status:"in-review",  uploadedBy:"Tran Thi Bich",  uploadedAt:"2024-11-08", size:"4.1 MB", locationId:"l2" },
  { id:"d4",  name:"lease_agreement_soma.pdf",       type:"contract",          status:"verified",   uploadedBy:"Pham Quoc Hung", uploadedAt:"2024-10-30", size:"880 KB", locationId:"l4" },
  { id:"d5",  name:"tax_certificate_2024.pdf",       type:"tax",               status:"rejected",   uploadedBy:"Nguyen T. Anh",  uploadedAt:"2024-10-25", size:"220 KB", rejectionReason:"Document expired — tax year mismatch. Please upload 2024 certificate." },
  { id:"d6",  name:"site_photos_potrero.zip",        type:"photo",             status:"pending",    uploadedBy:"Le Minh Duc",    uploadedAt:"2024-11-10", size:"18.4 MB", locationId:"l5" },
  { id:"d7",  name:"identity_verification_le.pdf",   type:"identity",          status:"pending",    uploadedBy:"Le Minh Duc",    uploadedAt:"2024-11-11", size:"956 KB" },
  { id:"d8",  name:"contract_mission_renewal.pdf",   type:"contract",          status:"in-review",  uploadedBy:"Tran Thi Bich",  uploadedAt:"2024-11-07", size:"1.6 MB", locationId:"l3" },
];

const AUDIT_ENTRIES: AuditEntry[] = [
  { id:"a1",  category:"auth",     action:"User signed in",               actor:"nguyen.anh@corp.com",  target:"Session",           timestamp:"2024-11-11 09:02:14", meta:{ method:"Auth0 Universal Login", ip:"10.0.1.42" } },
  { id:"a2",  category:"location", action:"Location record created",      actor:"nguyen.anh@corp.com",  target:"Harbor View Property", timestamp:"2024-11-11 09:08:33" },
  { id:"a3",  category:"document", action:"Document uploaded",            actor:"nguyen.anh@corp.com",  target:"passport_scan_nguyen.pdf", timestamp:"2024-11-11 09:15:01", meta:{ size:"1.2 MB", type:"identity" } },
  { id:"a4",  category:"document", action:"Document status → Verified",   actor:"system (auto-verify)", target:"passport_scan_nguyen.pdf", timestamp:"2024-11-11 09:15:44" },
  { id:"a5",  category:"data",     action:"Location address updated",     actor:"le.duc@corp.com",      target:"SOMA Complex",      timestamp:"2024-11-11 10:30:22", meta:{ field:"address", old:"512 Howard", new:"512 Howard St, SF, CA" } },
  { id:"a6",  category:"document", action:"Document uploaded",            actor:"tran.bich@corp.com",   target:"inspection_report_harbor.pdf", timestamp:"2024-11-11 11:02:15", meta:{ size:"4.1 MB" } },
  { id:"a7",  category:"auth",     action:"Token refreshed",              actor:"le.duc@corp.com",      target:"Session",           timestamp:"2024-11-11 11:15:00", meta:{ method:"Silent renew" } },
  { id:"a8",  category:"document", action:"Document status → Rejected",   actor:"pham.hung@corp.com",   target:"tax_certificate_2024.pdf", timestamp:"2024-11-11 13:20:05", meta:{ reason:"Expired" } },
  { id:"a9",  category:"location", action:"Location status → Flagged",    actor:"pham.hung@corp.com",   target:"Potrero Hill Unit", timestamp:"2024-11-11 13:45:00", meta:{ reason:"Missing inspection docs" } },
  { id:"a10", category:"system",   action:"Scheduled report generated",   actor:"system",               target:"Monthly audit export", timestamp:"2024-11-11 14:00:00", meta:{ records:"142", format:"CSV" } },
  { id:"a11", category:"document", action:"Document uploaded",            actor:"le.duc@corp.com",      target:"site_photos_potrero.zip", timestamp:"2024-11-11 14:30:18", meta:{ size:"18.4 MB" } },
  { id:"a12", category:"auth",     action:"User signed out",              actor:"nguyen.anh@corp.com",  target:"Session",           timestamp:"2024-11-11 15:00:00" },
  { id:"a13", category:"data",     action:"Document notes updated",       actor:"tran.bich@corp.com",   target:"inspection_report_harbor.pdf", timestamp:"2024-11-11 15:45:22" },
  { id:"a14", category:"location", action:"Location coordinates updated", actor:"le.duc@corp.com",      target:"Mission District Site", timestamp:"2024-11-11 16:02:10", meta:{ lat:"37.7603", lng:"-122.4194" } },
  { id:"a15", category:"document", action:"Document uploaded",            actor:"le.duc@corp.com",      target:"identity_verification_le.pdf", timestamp:"2024-11-11 16:30:00" },
];

// ─────────────────────────────────────────────────────────────────
// Code examples
// ─────────────────────────────────────────────────────────────────

const CODE_EXAMPLES = {
  middleware: `// api/middleware.ts — React Query + Auth0 API middleware
// Attaches JWT to every request; handles 401 refresh cycle

import { QueryClient } from "@tanstack/react-query";
import { Auth0Client } from "@auth0/auth0-spa-js";
import axios from "axios";

const auth0 = new Auth0Client({ domain: process.env.AUTH0_DOMAIN!, clientId: process.env.AUTH0_CLIENT_ID! });

// Axios instance — shared across all React Query fetchers
export const apiClient = axios.create({ baseURL: process.env.API_BASE_URL });

// Request interceptor — attach current access token silently
apiClient.interceptors.request.use(async (config) => {
  const token = await auth0.getTokenSilently();
  config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

// Response interceptor — token expiry recovery
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // Auth0 silent refresh — gets new token via hidden iframe
      await auth0.getTokenSilently({ cacheMode: "off" });
      return apiClient(original);
    }
    return Promise.reject(error);
  }
);

// React Query client — shared defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,         // 1 min
      retry: (count, error) =>
        count < 3 && (error as AxiosError).response?.status !== 401,
    },
  },
});

// React Query hooks — all go through the middleware:
export const useDocuments = (locationId?: string) =>
  useQuery({
    queryKey: ["documents", { locationId }],
    queryFn: () => apiClient.get("/documents", { params: { locationId } }).then(r => r.data),
  });

export const useUploadDocument = () =>
  useMutation({
    mutationFn: async ({ file, type, locationId }: UploadArgs) => {
      // 1. Get pre-signed S3 URL from backend
      const { uploadUrl, documentId } = await apiClient
        .post("/documents/presign", { name: file.name, type, locationId })
        .then(r => r.data);

      // 2. Upload directly to S3 (no backend bandwidth cost)
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });

      // 3. Confirm upload — backend triggers verification pipeline
      return apiClient.post(\`/documents/\${documentId}/confirm\`).then(r => r.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });`,

  mapbox: `// components/LocationMap/LocationMap.tsx — react-map-gl + Mapbox
import Map, { Marker, Popup, Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export function LocationMap({ locations }: { locations: Location[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({
    latitude:  37.77,
    longitude: -122.41,
    zoom:      12,
  });

  // GeoJSON FeatureCollection — drives both markers and cluster layer
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: locations.map(loc => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
      properties: { id: loc.id, status: loc.status, type: loc.type },
    })),
  };

  // Cluster layer — auto-groups pins at low zoom
  const clusterLayer: LayerProps = {
    id:     "clusters",
    type:   "circle",
    source: "locations",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get","point_count"], "#818cf8", 10, "#6366f1", 30, "#4f46e5"],
      "circle-radius": ["step", ["get","point_count"], 18, 10, 24, 30, 30],
    },
  };

  return (
    <Map
      {...viewport}
      onMove={evt => setViewport(evt.viewState)}
      mapboxAccessToken={process.env.MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: "100%", height: "500px", borderRadius: "12px" }}
    >
      <Source id="locations" type="geojson" data={geojson} cluster clusterMaxZoom={14}>
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
      </Source>

      {locations.map(loc => (
        <Marker key={loc.id} latitude={loc.lat} longitude={loc.lng}
          onClick={e => { e.originalEvent.stopPropagation(); setSelectedId(loc.id); }}>
          <LocationPin status={loc.status} type={loc.type} />
        </Marker>
      ))}

      {selectedId && (
        <Popup latitude={selectedLoc.lat} longitude={selectedLoc.lng}
          onClose={() => setSelectedId(null)} anchor="bottom">
          <LocationPopup location={selectedLoc} />
        </Popup>
      )}
    </Map>
  );
}`,

  jestRTL: `// tests/DocumentUpload.test.tsx — Jest + React Testing Library
import { render, screen, waitFor, userEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";   // custom wrapper
import { DocumentUpload } from "@/components/DocumentUpload";

// MSW handler — mock the presign + confirm endpoints
server.use(
  http.post("/api/documents/presign", () =>
    HttpResponse.json({ uploadUrl: "https://s3.aws/presign-url", documentId: "doc-999" })
  ),
  http.put("https://s3.aws/presign-url", () => new HttpResponse(null, { status: 200 })),
  http.post("/api/documents/doc-999/confirm", () =>
    HttpResponse.json({ id: "doc-999", status: "pending" })
  )
);

describe("DocumentUpload", () => {
  it("uploads a file and shows pending status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentUpload locationId="loc-1" />);

    // Drop a file onto the upload zone
    const input = screen.getByLabelText(/upload document/i);
    const file  = new File(["content"], "contract.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    // Should show progress bar during upload
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // After success — shows pending badge
    await waitFor(() =>
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
    );
  });

  it("shows rejection reason for rejected documents", () => {
    const doc = { ...mockDocument, status: "rejected", rejectionReason: "Document expired" };
    renderWithProviders(<DocumentCard document={doc} />);
    expect(screen.getByText("Document expired")).toBeVisible();
  });

  it("is accessible — passes axe-core", async () => {
    const { container } = renderWithProviders(<DocumentUpload />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Shared test utilities — renderWithProviders
export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState, ...options } = {}
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <Auth0Provider domain="test" clientId="test">
        <MemoryRouter>{ui}</MemoryRouter>
      </Auth0Provider>
    </QueryClientProvider>,
    options
  );
}`,

  playwright: `// tests/e2e/document-verification.spec.ts — Playwright
import { test, expect, Page } from "@playwright/test";
import { mockAuth0Token } from "@/test-utils/auth";

test.beforeEach(async ({ page }) => {
  // Inject Auth0 token into localStorage — bypass login for E2E
  await mockAuth0Token(page, { role: "investigator", userId: "user-1" });
  await page.goto("/documents");
});

test("upload and verify document — happy path", async ({ page }) => {
  // Upload file via drag-and-drop zone
  const dropzone = page.getByTestId("document-dropzone");
  await dropzone.setInputFiles("fixtures/contract.pdf");

  // Progress indicator appears
  await expect(page.getByRole("progressbar")).toBeVisible();

  // After upload — card appears in list with pending status
  const card = page.getByTestId("doc-card-contract.pdf");
  await expect(card).toBeVisible();
  await expect(card.getByText("Pending")).toBeVisible();

  // Supervisor verifies the document
  await card.getByRole("button", { name: /verify/i }).click();
  await expect(card.getByText("Verified")).toBeVisible({ timeout: 5000 });

  // Audit trail entry appears
  await page.getByRole("tab", { name: /audit/i }).click();
  await expect(page.getByText("Document status → Verified")).toBeVisible();
});

test("reject document with reason", async ({ page }) => {
  const card = page.getByTestId("doc-card-tax_certificate_2024.pdf");
  await card.getByRole("button", { name: /reject/i }).click();

  // Rejection reason dialog
  const dialog = page.getByRole("dialog", { name: /reject document/i });
  await dialog.getByRole("textbox").fill("Document expired — please upload 2024 certificate");
  await dialog.getByRole("button", { name: /confirm/i }).click();

  await expect(card.getByText("Rejected")).toBeVisible();
  await expect(card.getByText("Document expired")).toBeVisible();
});

// Visual regression — Storybook + Playwright
test("document card visual regression", async ({ page }) => {
  await page.goto("/iframe.html?id=documents-documentcard--verified");
  await expect(page).toHaveScreenshot("document-card-verified.png");
});`,

  githubActions: `# .github/workflows/ci.yml — parallel test matrix
name: CI

on: [push, pull_request]

jobs:
  # ── Unit + component tests ──────────────────────────────
  unit:
    name: Jest + RTL
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage --ci
      - uses: codecov/codecov-action@v4   # coverage gates (≥80%)

  # ── E2E tests ────────────────────────────────────────────
  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build:test && pnpm e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }

  # ── Storybook build + visual regression ──────────────────
  storybook:
    name: Storybook
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm storybook:build
      - run: pnpm storybook:test    # @storybook/test-runner (play() tests)
      - run: pnpm chromatic --project-token=\${{ secrets.CHROMATIC_TOKEN }}

  # ── Deploy (only on main) ─────────────────────────────────
  deploy:
    name: Deploy
    needs: [unit, e2e, storybook]    # all three must pass
    if: github.ref == 'refs/heads/main'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
      - run: pnpm deploy:prod
        env:
          AUTH0_DOMAIN:    \${{ secrets.AUTH0_DOMAIN }}
          MAPBOX_TOKEN:    \${{ secrets.MAPBOX_TOKEN }}
          API_BASE_URL:    \${{ secrets.API_BASE_URL }}`,
};

// ─────────────────────────────────────────────────────────────────
// Map SVG — simulates Mapbox dark-v11 style
// ─────────────────────────────────────────────────────────────────

const STATUS_PIN_COLOR = { active: "#4ade80", pending: "#fbbf24", flagged: "#ef4444" };

function MapPin({ x, y, status, type, selected, onClick }: {
  x: number; y: number; status: Location["status"]; type: Location["type"];
  selected: boolean; onClick: () => void;
}) {
  const color = STATUS_PIN_COLOR[status];
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
      tabIndex={0}
      role="button"
      aria-label={`${type} location`}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      {selected && <circle r={22} fill={color} opacity={0.2} />}
      <circle r={14} fill={color + "20"} stroke={color} strokeWidth={2} />
      <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill={color}>
        {type === "property" ? "🏠" : type === "inspection" ? "🔍" : "🏢"}
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

export function CoreProductDemo() {
  const [activeTab, setActiveTab]   = useState<"map" | "docs" | "audit" | "pipeline">("map");
  const [selectedLocId, setSelectedLocId] = useState<string | null>("l1");
  const [documents, setDocuments]   = useState<Document[]>(DOCUMENTS);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(AUDIT_ENTRIES);
  const [auditCatFilter, setAuditCatFilter] = useState<AuditCategory | "all">("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [codeKey, setCodeKey] = useState<keyof typeof CODE_EXAMPLES>("middleware");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLoc = LOCATIONS.find(l => l.id === selectedLocId);
  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const filteredAudit = useMemo(() => auditEntries.filter(e => {
    if (auditCatFilter !== "all" && e.category !== auditCatFilter) return false;
    if (auditSearch && !e.action.toLowerCase().includes(auditSearch.toLowerCase()) && !e.actor.includes(auditSearch)) return false;
    return true;
  }), [auditEntries, auditCatFilter, auditSearch]);

  const locDocs = useMemo(() =>
    selectedLocId ? documents.filter(d => d.locationId === selectedLocId) : documents,
    [documents, selectedLocId]
  );

  // Simulate file upload
  const simulateUpload = useCallback((name: string) => {
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(null);
        const newDoc: Document = {
          id: `d${Date.now()}`,
          name,
          type: "report",
          status: "pending",
          uploadedBy: "you@corp.com",
          uploadedAt: new Date().toLocaleDateString("en-CA"),
          size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
        };
        setDocuments(prev => [newDoc, ...prev]);
        setAuditEntries(prev => [{
          id: `a${Date.now()}`,
          category: "document",
          action: "Document uploaded",
          actor: "you@corp.com",
          target: name,
          timestamp: new Date().toLocaleString("en", { dateStyle: "short", timeStyle: "medium" }),
          meta: { size: newDoc.size },
        }, ...prev]);
      } else {
        setUploadProgress(Math.min(99, Math.round(progress)));
      }
    }, 200);
  }, []);

  const verifyDoc = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: "verified" } : d));
    const doc = documents.find(d => d.id === id);
    if (doc) setAuditEntries(prev => [{
      id: `a${Date.now()}`, category: "document", action: "Document status → Verified",
      actor: "you@corp.com", target: doc.name,
      timestamp: new Date().toLocaleString("en", { dateStyle: "short", timeStyle: "medium" }),
    }, ...prev]);
  };

  const rejectDoc = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id
      ? { ...d, status: "rejected", rejectionReason: "Rejected in demo — please resubmit." }
      : d));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) simulateUpload(file.name);
  };

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏗</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Core Product Features</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Audit trail · Document upload & verification · Mapbox mapping · Testing & CI/CD pipeline
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["React Query", "Auth0", "Mapbox / react-map-gl", "Tailwind CSS", "Jest + RTL", "Playwright E2E", "Storybook 8", "GitHub Actions"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "map"      as const, label: "🗺 Map" },
          { id: "docs"     as const, label: "📄 Documents" },
          { id: "audit"    as const, label: "📋 Audit Trail" },
          { id: "pipeline" as const, label: "🧪 Testing & CI/CD" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Map ── */}
      {activeTab === "map" && (
        <div style={{ display: "flex", gap: 16 }}>
          {/* Sidebar */}
          <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>LOCATIONS ({LOCATIONS.length})</div>
            {LOCATIONS.map(loc => {
              const sc = LOC_STATUS_CFG[loc.status];
              return (
                <button key={loc.id} onClick={() => setSelectedLocId(l => l === loc.id ? null : loc.id)} style={{
                  background: selectedLocId === loc.id ? "#1e3a5f" : "#1e293b",
                  border: `1px solid ${selectedLocId === loc.id ? "#60a5fa" : "#334155"}`,
                  borderRadius: 8, padding: "8px 10px", textAlign: "left", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 13 }}>{TYPE_ICON[loc.type]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, color: sc.color, background: sc.bg, padding: "1px 6px", borderRadius: 4 }}>{loc.status}</span>
                    <span style={{ fontSize: 9, color: "#64748b" }}>📄 {loc.documents}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map canvas */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#1a2035", border: "1px solid #334155", borderRadius: 12, overflow: "hidden", position: "relative" }}>
              {/* Map SVG */}
              <svg viewBox="0 0 640 420" style={{ width: "100%", display: "block" }} aria-label="Location map — San Francisco">
                {/* Background */}
                <rect width={640} height={420} fill="#1a2035" />
                {/* Water — SF Bay */}
                <rect x={480} y={0} width={160} height={420} fill="#162032" opacity={0.7} />
                <path d="M480,0 Q520,80 510,200 Q500,320 480,420 L640,420 L640,0 Z" fill="#0d1929" opacity={0.5} />
                {/* Grid streets */}
                {[60,120,180,240,300,360,420,480].map(x => (
                  <line key={x} x1={x} y1={0} x2={x} y2={420} stroke="#263248" strokeWidth={1} />
                ))}
                {[60,120,180,240,300,360].map(y => (
                  <line key={y} x1={0} y1={y} x2={480} y2={y} stroke="#263248" strokeWidth={1} />
                ))}
                {/* Major roads */}
                {[100,200,320].map(x => (
                  <line key={x} x1={x} y1={0} x2={x} y2={420} stroke="#2d3f58" strokeWidth={2.5} />
                ))}
                {[150,280].map(y => (
                  <line key={y} x1={0} y1={y} x2={480} y2={y} stroke="#2d3f58" strokeWidth={2.5} />
                ))}
                {/* District labels */}
                {[
                  { x:280, y:80, label:"North Beach" },
                  { x:200, y:180, label:"Pacific Heights" },
                  { x:360, y:220, label:"SOMA" },
                  { x:200, y:270, label:"Mission" },
                  { x:130, y:280, label:"Castro" },
                  { x:350, y:300, label:"Potrero" },
                ].map(d => (
                  <text key={d.label} x={d.x} y={d.y} fontSize={9} fill="#334155" textAnchor="middle" fontFamily="sans-serif">{d.label}</text>
                ))}
                {/* Bay label */}
                <text x={560} y={200} fontSize={11} fill="#1e3a5f" textAnchor="middle" fontFamily="sans-serif" transform="rotate(-90,560,200)">SF Bay</text>

                {/* Location pins */}
                {LOCATIONS.map(loc => (
                  <MapPin
                    key={loc.id}
                    x={loc.svgX} y={loc.svgY}
                    status={loc.status} type={loc.type}
                    selected={selectedLocId === loc.id}
                    onClick={() => setSelectedLocId(l => l === loc.id ? null : loc.id)}
                  />
                ))}
              </svg>

              {/* Popup for selected */}
              {selectedLoc && (
                <div style={{
                  position: "absolute", bottom: 16, right: 16,
                  background: "#0f172a", border: `1px solid ${LOC_STATUS_CFG[selectedLoc.status].color}40`,
                  borderLeft: `3px solid ${LOC_STATUS_CFG[selectedLoc.status].color}`,
                  borderRadius: 10, padding: 14, width: 240,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{TYPE_ICON[selectedLoc.type]}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#f1f5f9" }}>{selectedLoc.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{selectedLoc.address}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: LOC_STATUS_CFG[selectedLoc.status].color }}>● {selectedLoc.status}</span>
                    <span style={{ color: "#64748b" }}>📄 {selectedLoc.documents} docs</span>
                    <span style={{ color: "#64748b" }}>{selectedLoc.lastVisit}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("docs")}
                    style={{ marginTop: 8, width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", cursor: "pointer", padding: "5px", fontSize: 11 }}
                  >View documents →</button>
                </div>
              )}

              {/* Legend */}
              <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 10 }}>
                {Object.entries(STATUS_PIN_COLOR).map(([status, color]) => (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    {status}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "#334155", textAlign: "right" }}>
              Simulated SVG map — real implementation uses react-map-gl + Mapbox dark-v11
            </div>
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {activeTab === "docs" && (
        <div style={{ display: "flex", gap: 16 }}>
          {/* Left: upload + list */}
          <div style={{ flex: 1 }}>
            {/* Location filter pills */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              <button onClick={() => setSelectedLocId(null)} style={{ background: selectedLocId === null ? "#6366f1" : "#1e293b", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", color: selectedLocId === null ? "#fff" : "#64748b", cursor: "pointer", fontSize: 11 }}>All locations</button>
              {LOCATIONS.map(l => (
                <button key={l.id} onClick={() => setSelectedLocId(l.id)} style={{ background: selectedLocId === l.id ? "#6366f120" : "#1e293b", border: `1px solid ${selectedLocId === l.id ? "#6366f1" : "#334155"}`, borderRadius: 20, padding: "3px 10px", color: selectedLocId === l.id ? "#a5b4fc" : "#64748b", cursor: "pointer", fontSize: 11 }}>
                  {TYPE_ICON[l.type]} {l.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Upload dropzone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload document — click or drag and drop"
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#6366f1" : "#334155"}`,
                borderRadius: 12, padding: "20px", textAlign: "center",
                cursor: "pointer", marginBottom: 14, transition: "all 0.2s",
                background: isDragging ? "#6366f110" : "transparent",
              }}
            >
              <input
                ref={fileInputRef} type="file" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) simulateUpload(f.name); }}
                aria-label="Upload document"
              />
              <div style={{ fontSize: 28, marginBottom: 6 }}>☁</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                {uploadProgress !== null
                  ? <div>
                      <div style={{ color: "#6366f1", marginBottom: 6 }}>Uploading… {uploadProgress}%</div>
                      <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "#6366f1", width: `${uploadProgress}%`, transition: "width 0.2s", borderRadius: 4 }} />
                      </div>
                    </div>
                  : "Drop files here or click to upload"
                }
              </div>
            </div>

            {/* Document list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {locDocs.map(doc => {
                const sc = DOC_STATUS_CFG[doc.status];
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(id => id === doc.id ? null : doc.id)}
                    style={{
                      background: isSelected ? "#1e293b" : "#1e293b80",
                      border: `1px solid ${isSelected ? "#6366f1" : "#334155"}`,
                      borderRadius: 10, padding: 12, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{DOC_TYPE_ICON[doc.type]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{doc.uploadedBy} · {doc.uploadedAt} · {doc.size}</div>
                      </div>
                      <span style={{ background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>{sc.label}</span>
                    </div>
                    {doc.status === "rejected" && doc.rejectionReason && (
                      <div style={{ marginTop: 6, background: "#450a0a30", border: "1px solid #ef444440", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#f87171" }}>
                        ⚠ {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: detail panel */}
          {selectedDoc && (
            <div style={{ width: 260, flexShrink: 0, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16, height: "fit-content" }}>
              <div style={{ fontSize: 24, textAlign: "center", marginBottom: 10 }}>{DOC_TYPE_ICON[selectedDoc.type]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", textAlign: "center", marginBottom: 4 }}>{selectedDoc.name}</div>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span style={{ ...DOC_STATUS_CFG[selectedDoc.status], background: DOC_STATUS_CFG[selectedDoc.status].bg, padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  {DOC_STATUS_CFG[selectedDoc.status].label}
                </span>
              </div>
              {[
                ["Type", selectedDoc.type],
                ["Uploaded by", selectedDoc.uploadedBy],
                ["Uploaded at", selectedDoc.uploadedAt],
                ["Size", selectedDoc.size],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 11 }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ color: "#f1f5f9" }}>{v}</span>
                </div>
              ))}
              {selectedDoc.rejectionReason && (
                <div style={{ background: "#450a0a30", border: "1px solid #ef444440", borderRadius: 6, padding: 8, fontSize: 11, color: "#f87171", marginTop: 8 }}>
                  {selectedDoc.rejectionReason}
                </div>
              )}
              {(selectedDoc.status === "pending" || selectedDoc.status === "in-review") && (
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <button onClick={() => verifyDoc(selectedDoc.id)} style={{ flex: 1, background: "#4ade8020", border: "1px solid #4ade80", borderRadius: 6, color: "#4ade80", cursor: "pointer", padding: "6px", fontSize: 11, fontWeight: 600 }}>✓ Verify</button>
                  <button onClick={() => rejectDoc(selectedDoc.id)} style={{ flex: 1, background: "#ef444420", border: "1px solid #ef4444", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "6px", fontSize: 11, fontWeight: 600 }}>✕ Reject</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Audit Trail ── */}
      {activeTab === "audit" && (
        <div>
          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="search" placeholder="Search actions, actors..."
              value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
              aria-label="Search audit trail"
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "6px 12px", color: "#f1f5f9", fontSize: 12, width: 220, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "auth", "document", "location", "data", "system"] as const).map(cat => {
                const cfg = cat === "all" ? { color: "#64748b", icon: "All" } : AUDIT_CFG[cat];
                return (
                  <button key={cat} onClick={() => setAuditCatFilter(cat)} style={{
                    background: auditCatFilter === cat ? "#1e3a5f" : "#1e293b",
                    border: `1px solid ${auditCatFilter === cat ? "#6366f1" : "#334155"}`,
                    borderRadius: 6, padding: "4px 10px",
                    color: auditCatFilter === cat ? "#f1f5f9" : "#64748b",
                    cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {cat !== "all" && AUDIT_CFG[cat as AuditCategory].icon} {cat}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>{filteredAudit.length} entries</span>
            <button style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "4px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>↓ Export CSV</button>
          </div>

          {/* Timeline */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  {["Timestamp", "Category", "Action", "Actor", "Target"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, borderBottom: "2px solid #334155", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map(entry => {
                  const cfg = AUDIT_CFG[entry.category];
                  return (
                    <tr key={entry.id} style={{ borderBottom: "1px solid #1e293b" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{entry.timestamp}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: cfg.color + "20", color: cfg.color, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {cfg.icon} {entry.category}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", color: "#f1f5f9", fontWeight: 500 }}>
                        {entry.action}
                        {entry.meta && (
                          <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                            {Object.entries(entry.meta).map(([k, v]) => (
                              <span key={k} style={{ fontSize: 9, color: "#475569", background: "#0f172a", padding: "1px 5px", borderRadius: 3 }}>{k}: {v}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "#64748b", fontStyle: entry.actor.startsWith("system") ? "italic" : "normal" }}>{entry.actor}</td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.target}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#334155" }}>
            Audit trail is append-only and server-signed — no record can be edited or deleted (regulatory requirement)
          </div>
        </div>
      )}

      {/* ── Testing & CI/CD ── */}
      {activeTab === "pipeline" && (
        <div>
          {/* Pipeline visualization */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>CI/CD Pipeline — GitHub Actions</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
              {[
                { stage: "Push", icon: "⬆", status: "success", detail: "main branch" },
                { stage: "Lint", icon: "🔍", status: "success", detail: "ESLint + TS check" },
                { stage: "Unit", icon: "🧪", status: "success", detail: "Jest + RTL\n204 tests · 94% cov" },
                { stage: "E2E", icon: "🎭", status: "success", detail: "Playwright\n38 scenarios" },
                { stage: "Storybook", icon: "📚", status: "success", detail: "Build + Chromatic\n0 visual changes" },
                { stage: "Deploy", icon: "🚀", status: "success", detail: "Production\n1m 12s total" },
              ].map((s, i, arr) => (
                <React.Fragment key={s.stage}>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4ade8020", border: "2px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 4px" }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>{s.stage}</div>
                    <div style={{ fontSize: 9, color: "#64748b", whiteSpace: "pre-line", maxWidth: 80 }}>{s.detail}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: "#4ade8050", minWidth: 20, flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Test metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Unit tests",    value: "204", detail: "204 pass · 0 fail", color: "#4ade80" },
              { label: "Coverage",      value: "94%", detail: "≥80% gate → pass",  color: "#22d3ee" },
              { label: "E2E scenarios", value: "38",  detail: "38 pass · 0 fail",  color: "#818cf8" },
              { label: "Storybook stories", value: "67", detail: "67 stories · 0 regressions", color: "#fbbf24" },
            ].map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{m.detail}</div>
              </div>
            ))}
          </div>

          {/* Code examples */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {(Object.keys(CODE_EXAMPLES) as (keyof typeof CODE_EXAMPLES)[]).map(k => {
              const labels: Record<keyof typeof CODE_EXAMPLES, string> = {
                middleware: "API Middleware",
                mapbox:     "react-map-gl",
                jestRTL:    "Jest + RTL",
                playwright: "Playwright",
                githubActions: "GitHub Actions",
              };
              return (
                <button key={k} onClick={() => setCodeKey(k)} style={{
                  background: codeKey === k ? "#6366f1" : "#1e293b",
                  border: `1px solid ${codeKey === k ? "#6366f1" : "#334155"}`,
                  borderRadius: 6, padding: "5px 12px",
                  color: codeKey === k ? "#fff" : "#64748b",
                  cursor: "pointer", fontSize: 12,
                }}>{labels[k]}</button>
              );
            })}
          </div>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 11, color: "#64748b", background: "#0f172a" }}>
              {{
                middleware:    "React Query + Auth0 API middleware — axios interceptor with silent token refresh",
                mapbox:        "react-map-gl + Mapbox — GeoJSON FeatureCollection with cluster layer",
                jestRTL:       "Jest + React Testing Library — document upload, status, accessibility",
                playwright:    "Playwright E2E — upload flow, verification workflow, visual regression",
                githubActions: "GitHub Actions — parallel unit/e2e/storybook jobs → staged deployment",
              }[codeKey]}
            </div>
            <pre style={{ margin: 0, padding: 16, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 480 }}>
              <code>{CODE_EXAMPLES[codeKey]}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoreProductDemo;
