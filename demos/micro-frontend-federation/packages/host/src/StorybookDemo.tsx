/**
 * StorybookDemo.tsx
 *
 * Demonstrates modern Storybook patterns for unit and visual testing:
 *
 * CSF3 (Component Story Format 3.0)
 *   - Story objects satisfying `Meta<typeof Component>` for full type-safety
 *   - `args` replace default props — controls panel updates live
 *   - `play` functions replace traditional test files for interaction tests
 *   - `render` overrides compose complex layouts with decorators
 *
 * DATA MOCKING STRATEGIES
 *   1. Static fixtures    — shared JSON imported across stories and unit tests
 *   2. Factory functions  — faker.js builders that generate realistic data at scale
 *   3. MSW (Mock Service Worker) — intercepts fetch/axios at network level
 *      → Same handler file reused: Storybook + Vitest/Jest + Playwright
 *   4. Context decorators — wrap story with Redux/Router/Theme providers
 *
 * PLAY FUNCTIONS — interaction testing inside Storybook
 *   - @storybook/test (userEvent + expect + within) — zero extra test files
 *   - Tests run in the actual browser (not jsdom) → catches real CSS/layout bugs
 *   - Storybook Test Runner converts play fns → Playwright/Vitest specs automatically
 *
 * ADDONS SHOWN
 *   @storybook/addon-a11y      → axe-core violations in the A11y panel
 *   @storybook/addon-interactions → step-by-step play function debugger
 *   @storybook/addon-viewport  → responsive breakpoint switcher
 *   @storybook/addon-docs      → MDX autodocs from JSDoc + argTypes
 *   chromatic                  → cloud visual regression diffing
 *   msw-storybook-addon        → MSW integration for API mocking
 */

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface StoryMeta {
  id: string;
  component: string;
  title: string;
  stories: Story[];
}

interface Story {
  id: string;
  name: string;
  variant: "default" | "loading" | "error" | "empty" | "interactive" | "a11y";
  args?: Record<string, unknown>;
  description: string;
}

interface A11yViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  nodes: number;
}

// ─────────────────────────────────────────────────────────────────
// Simulated story registry — mirrors a real .stories.tsx file tree
// ─────────────────────────────────────────────────────────────────

const STORY_TREE: StoryMeta[] = [
  {
    id: "employee-card",
    component: "EmployeeCard",
    title: "HCM / EmployeeCard",
    stories: [
      { id: "default",     name: "Default",        variant: "default",     description: "Basic employee card with all fields" },
      { id: "manager",     name: "Manager",         variant: "default",     description: "Manager with direct reports count" },
      { id: "on-leave",    name: "On Leave",        variant: "default",     description: "Employee with on-leave status badge" },
      { id: "loading",     name: "Loading",         variant: "loading",     description: "Skeleton state while data fetches" },
      { id: "error",       name: "Error",           variant: "error",       description: "API error state with retry button" },
      { id: "keyboard",    name: "Keyboard Nav",    variant: "interactive", description: "play() tests Tab + Enter focus flow" },
      { id: "a11y",        name: "A11y Audit",      variant: "a11y",        description: "axe-core violation scan" },
    ],
  },
  {
    id: "data-table",
    component: "DataTable",
    title: "HCM / DataTable",
    stories: [
      { id: "default",     name: "Default",        variant: "default",     description: "Table with 6 columns, 10 rows" },
      { id: "empty",       name: "Empty",          variant: "empty",       description: "Zero rows — empty state illustration" },
      { id: "frozen",      name: "Frozen Columns", variant: "default",     description: "2 columns sticky-left" },
      { id: "sort",        name: "Sort Interaction",variant: "interactive", description: "play() clicks header → verifies aria-sort" },
      { id: "responsive",  name: "Mobile 375px",   variant: "default",     description: "Viewport: iPhone 13 mini" },
    ],
  },
  {
    id: "skip-link",
    component: "SkipLink",
    title: "A11y / SkipLink",
    stories: [
      { id: "default",     name: "Default",        variant: "default",     description: "Hidden until Tab is pressed" },
      { id: "focused",     name: "Focused",        variant: "default",     description: "args: initiallyFocused=true (for visual review)" },
      { id: "play",        name: "Interaction Test",variant: "interactive", description: "play() tabs to link → verifies it appears → activates it → verifies focus moved" },
    ],
  },
  {
    id: "col-config",
    component: "ColumnConfigPanel",
    title: "HCM / ColumnConfigPanel",
    stories: [
      { id: "default",     name: "All Visible",    variant: "default",     description: "8 columns, 2 frozen, panel open" },
      { id: "msw",         name: "With MSW",       variant: "interactive", description: "MSW intercepts PATCH /columns, returns 200" },
      { id: "msw-error",   name: "MSW Error 500",  variant: "error",       description: "MSW returns 500 — shows error toast" },
    ],
  },
];

const IMPACT_COLORS: Record<A11yViolation["impact"], string> = {
  critical: "#ef4444",
  serious:  "#f97316",
  moderate: "#fbbf24",
  minor:    "#94a3b8",
};

// ─────────────────────────────────────────────────────────────────
// Simulated component previews — the "canvas" renders
// ─────────────────────────────────────────────────────────────────

function EmployeeCardDefault({ onLeave = false, isManager = false }: { onLeave?: boolean; isManager?: boolean }) {
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155", borderRadius: 12,
      padding: 16, width: 240, fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>👨‍💻</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Nguyễn Văn A</div>
          <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>Senior Frontend Engineer</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <span style={{
              background: onLeave ? "#fbbf2420" : "#4ade8020",
              color: onLeave ? "#fbbf24" : "#4ade80",
              border: `1px solid ${onLeave ? "#fbbf2440" : "#4ade8040"}`,
              borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 600,
            }}>{onLeave ? "On Leave" : "Active"}</span>
            {isManager && (
              <span style={{ background: "#6366f120", color: "#a5b4fc", border: "1px solid #6366f140", borderRadius: 10, padding: "2px 8px", fontSize: 10 }}>
                3 reports
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
        <span>📍 HCM City</span>
        <span>💼 Engineering</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155", borderRadius: 12,
      padding: 16, width: 240,
    }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#334155", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 14, background: "#334155", borderRadius: 4, width: "80%" }} />
          <div style={{ height: 12, background: "#334155", borderRadius: 4, width: "60%" }} />
          <div style={{ height: 20, background: "#334155", borderRadius: 10, width: 60 }} />
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e293b", display: "flex", gap: 8 }}>
        <div style={{ height: 11, background: "#334155", borderRadius: 4, flex: 1 }} />
        <div style={{ height: 11, background: "#334155", borderRadius: 4, flex: 1 }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

function ErrorCard() {
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #ef444440", borderRadius: 12,
      padding: 20, width: 240, textAlign: "center",
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 13, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>Failed to load employee</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>GET /api/employees/EMP-001 returned 500</div>
      <button style={{
        background: "#ef4444", color: "#fff", border: "none", borderRadius: 6,
        padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
      }}>Retry</button>
    </div>
  );
}

function EmptyTable() {
  return (
    <div style={{
      background: "#0f172a", border: "1px solid #334155", borderRadius: 10,
      padding: "48px 20px", textAlign: "center", width: 480,
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>No employees found</div>
      <div style={{ fontSize: 12, color: "#475569" }}>Try adjusting your search or filters</div>
    </div>
  );
}

function MiniTable() {
  const rows = [
    { id: "EMP-001", name: "Nguyễn Văn A", dept: "Engineering", status: "Active" },
    { id: "EMP-002", name: "Trần Thị B",   dept: "Product",     status: "On Leave" },
    { id: "EMP-003", name: "Lê Minh C",    dept: "Design",      status: "Active" },
  ];
  return (
    <div style={{ overflowX: "auto", background: "#0f172a", borderRadius: 10, border: "1px solid #334155", width: 480 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#1e293b" }}>
            {["ID", "Name", "Department", "Status"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, borderBottom: "2px solid #334155" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={{ padding: "8px 12px", color: "#7dd3fc", fontFamily: "monospace" }}>{row.id}</td>
              <td style={{ padding: "8px 12px", color: "#f1f5f9" }}>{row.name}</td>
              <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{row.dept}</td>
              <td style={{ padding: "8px 12px" }}>
                <span style={{
                  background: row.status === "Active" ? "#4ade8020" : "#fbbf2420",
                  color: row.status === "Active" ? "#4ade80" : "#fbbf24",
                  padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                }}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkipLinkPreview({ focused = false }: { focused?: boolean }) {
  return (
    <div style={{
      background: "#f8fafc", borderRadius: 8, padding: 32,
      fontFamily: "Inter, sans-serif", position: "relative", minHeight: 120,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: focused ? "relative" : "absolute",
        ...(focused ? {} : { width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }),
        background: "#1e1b4b", color: "#fff", fontWeight: 700, fontSize: 14,
        padding: "10px 18px", borderRadius: 8,
        outline: "3px solid #fbbf24",
        outlineOffset: 2,
      }}>
        ⤵ Skip to main content
      </div>
      {!focused && (
        <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
          Link is visually hidden (1×1px)<br />
          <span style={{ fontSize: 11 }}>Press Tab to reveal in real browser</span>
        </div>
      )}
    </div>
  );
}

function A11yPanel({ violations }: { violations: A11yViolation[] }) {
  const hasViolations = violations.length > 0;
  return (
    <div style={{ padding: "10px 14px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        color: hasViolations ? "#ef4444" : "#4ade80",
        fontSize: 12, fontWeight: 700,
      }}>
        <span>{hasViolations ? "⚠" : "✓"}</span>
        {hasViolations
          ? `${violations.length} violation${violations.length !== 1 ? "s" : ""} found`
          : "No accessibility violations"}
      </div>
      {violations.map(v => (
        <div key={v.id} style={{
          background: "#0f172a", border: `1px solid ${IMPACT_COLORS[v.impact]}40`,
          borderLeft: `3px solid ${IMPACT_COLORS[v.impact]}`,
          borderRadius: 6, padding: "8px 10px", marginBottom: 6,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <code style={{ fontSize: 11, color: "#7dd3fc" }}>{v.id}</code>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase",
              color: IMPACT_COLORS[v.impact],
              background: IMPACT_COLORS[v.impact] + "20",
              padding: "1px 5px", borderRadius: 4,
            }}>{v.impact}</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{v.description}</div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{v.nodes} node{v.nodes !== 1 ? "s" : ""} affected</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Code blocks — patterns reference
// ─────────────────────────────────────────────────────────────────

const CODE_BLOCKS = {
  csf3: `// EmployeeCard.stories.tsx — CSF3 format (Storybook 7+)
import type { Meta, StoryObj } from "@storybook/react";
import { EmployeeCard } from "./EmployeeCard";
import { createEmployee } from "../test/factories";

// 1. Meta — configures the component for the Storybook catalogue
const meta = {
  title: "HCM/EmployeeCard",
  component: EmployeeCard,

  // argTypes generate the Controls panel knobs automatically
  argTypes: {
    status: {
      control: "select",
      options: ["Active", "On Leave", "Terminated"],
    },
    department: { control: "text" },
    isManager:  { control: "boolean" },
  },

  // Default args shared by ALL stories in this file
  args: {
    employee: createEmployee(),  // factory — fresh data each time
  },

  // Global decorator: wraps every story with Redux Provider
  decorators: [
    (Story) => (
      <Provider store={createTestStore()}>
        <Story />
      </Provider>
    ),
  ],
} satisfies Meta<typeof EmployeeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 2. Stories — each is an object, not a function (CSF3)
export const Default: Story = {};

export const OnLeave: Story = {
  args: { employee: createEmployee({ status: "On Leave" }) },
};

export const Manager: Story = {
  args: {
    employee: createEmployee({ title: "VP Engineering" }),
    showDirectReports: true,
    directReports: createEmployee.buildList(3),  // factory list
  },
};

export const Loading: Story = {
  render: () => <EmployeeCard isLoading />,
};

export const ErrorState: Story = {
  render: () => <EmployeeCard error="Failed to fetch employee data" />,
};`,

  factories: `// test/factories/employee.factory.ts
// Factory with faker.js — generates realistic, varied data every run

import { faker } from "@faker-js/faker/locale/vi";
import type { Employee } from "../../types";

const DEPARTMENTS = ["Engineering", "Product", "Finance", "HR", "Design", "Marketing"];
const STATUSES    = ["Active", "On Leave", "Terminated"] as const;
const LOCATIONS   = ["HCM", "HN", "DA", "Remote"];

export function createEmployee(overrides?: Partial<Employee>): Employee {
  const department = faker.helpers.arrayElement(DEPARTMENTS);
  return {
    id:         \`EMP-\${faker.string.numeric(3)}\`,
    name:       faker.person.fullName(),
    email:      faker.internet.email(),
    title:      faker.person.jobTitle(),
    department,
    status:     faker.helpers.arrayElement(STATUSES),
    location:   faker.helpers.arrayElement(LOCATIONS),
    hireDate:   faker.date.past({ years: 10 }).toISOString().slice(0, 10),
    salary:     faker.number.int({ min: 60_000, max: 150_000 }),
    managerId:  faker.string.uuid(),
    ...overrides,  // caller wins — override any field
  };
}

// Build a list — useful for table stories
createEmployee.buildList = (n: number, overrides?: Partial<Employee>): Employee[] =>
  Array.from({ length: n }, () => createEmployee(overrides));

// Trait shortcuts
createEmployee.manager = (overrides?: Partial<Employee>) =>
  createEmployee({ title: faker.person.jobTitle().replace(/^/, "VP "), ...overrides });

createEmployee.onLeave = (overrides?: Partial<Employee>) =>
  createEmployee({ status: "On Leave", ...overrides });

// Usage in stories / tests / Jest:
const emp  = createEmployee({ name: "Alice" });   // specific name, rest random
const team = createEmployee.buildList(10);          // 10 unique employees`,

  msw: `// test/mocks/handlers.ts — MSW handler file
// ONE file → reused in Storybook, Vitest, Playwright

import { http, HttpResponse, delay } from "msw";

export const handlers = [
  // GET /api/employees — returns paginated list
  http.get("/api/employees", async ({ request }) => {
    const url    = new URL(request.url);
    const page   = Number(url.searchParams.get("page")) || 1;
    const limit  = Number(url.searchParams.get("limit")) || 20;
    await delay(300);  // realistic latency simulation
    return HttpResponse.json({
      data:  createEmployee.buildList(limit),
      total: 247,
      page,
    });
  }),

  // GET /api/employees/:id
  http.get("/api/employees/:id", async ({ params }) => {
    await delay(150);
    return HttpResponse.json(createEmployee({ id: params.id as string }));
  }),

  // PATCH /api/employees/:id/parent — org reorg
  http.patch("/api/employees/:id/parent", async ({ request, params }) => {
    const body = await request.json() as { parentId: string };
    await delay(200);
    return HttpResponse.json({ success: true, nodeId: params.id, ...body });
  }),
];

// Error scenario handler (used in specific stories):
export const errorHandlers = [
  http.get("/api/employees/:id", () => {
    return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }),
];

// ─── Storybook integration ─────────────────────────
// .storybook/preview.ts:
import { initialize, mswLoader } from "msw-storybook-addon";
initialize({ onUnhandledRequest: "bypass" });

// Story with MSW override:
export const WithMSWError: Story = {
  parameters: {
    msw: { handlers: errorHandlers },  // override just for this story
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(canvas.getByText(/500/)).toBeInTheDocument();
  },
};`,

  playFunctions: `// EmployeeCard.stories.tsx — play functions (interaction tests)
import { expect, userEvent, within, waitFor } from "@storybook/test";

// Play function = runs after story renders in the actual browser DOM
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // step() groups actions for the Interactions debugger panel
    await step("Tab into the card", async () => {
      await user.tab();
      const card = canvas.getByRole("article");
      await expect(card).toHaveFocus();
    });

    await step("Open action menu with Enter", async () => {
      await user.keyboard("{Enter}");
      await waitFor(() =>
        expect(canvas.getByRole("menu")).toBeVisible()
      );
    });

    await step("Arrow key to 'Edit' item", async () => {
      await user.keyboard("{ArrowDown}");
      const editItem = canvas.getByRole("menuitem", { name: /edit/i });
      await expect(editItem).toHaveFocus();
    });

    await step("Escape closes menu, focus returns to card", async () => {
      await user.keyboard("{Escape}");
      const card = canvas.getByRole("article");
      await expect(card).toHaveFocus();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
  },
};

// Sorting interaction test
export const SortByName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameHeader = canvas.getByRole("columnheader", { name: /name/i });

    // Initial state: unsorted
    await expect(nameHeader).toHaveAttribute("aria-sort", "none");

    // Click once → ascending
    await userEvent.click(nameHeader);
    await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

    // Click again → descending
    await userEvent.click(nameHeader);
    await expect(nameHeader).toHaveAttribute("aria-sort", "descending");

    // Verify first row changed
    const firstRow = canvas.getAllByRole("row")[1];
    await expect(firstRow).toBeInTheDocument();
  },
};`,

  decorators: `// .storybook/preview.tsx — global decorators & parameters

import type { Preview } from "@storybook/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../src/theme";
import { createTestStore } from "../src/test/utils";
import { mswLoader } from "msw-storybook-addon";

const preview: Preview = {
  // 1. Global decorators — wrap every story
  decorators: [
    (Story, context) => (
      <Provider store={createTestStore(context.parameters.preloadedState)}>
        <MemoryRouter initialEntries={[context.parameters.initialRoute ?? "/"]}>
          <ThemeProvider theme={context.globals.theme ?? "dark"}>
            <Story />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    ),
  ],

  // 2. Global loaders — MSW starts before ANY story renders
  loaders: [mswLoader],

  parameters: {
    // 3. Viewport presets
    viewport: {
      viewports: {
        mobile375:  { name: "iPhone 13 mini", styles: { width: "375px",  height: "812px" } },
        tablet768:  { name: "iPad",           styles: { width: "768px",  height: "1024px" } },
        desktop1440:{ name: "Desktop",        styles: { width: "1440px", height: "900px" } },
      },
    },

    // 4. A11y addon config — axe-core rules
    a11y: {
      config: {
        rules: [
          { id: "color-contrast",   enabled: true },
          { id: "focus-trap",       enabled: true },
          { id: "keyboard",         enabled: true },
          { id: "aria-required-children", enabled: true },
        ],
      },
    },

    // 5. Chromatic visual testing
    chromatic: {
      diffThreshold: 0.2,     // 0.2% pixel difference tolerance
      viewports: [375, 768, 1440],
      pauseAnimationAtEnd: true,  // snapshot after CSS transitions settle
    },
  },

  // 6. Toolbar globals (theme switcher in the toolbar)
  globalTypes: {
    theme: {
      name: "Theme",
      defaultValue: "dark",
      toolbar: {
        icon: "circle",
        items: [{ value: "dark", title: "Dark" }, { value: "light", title: "Light" }],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;`,
};

// ─────────────────────────────────────────────────────────────────
// Canvas — renders the active story preview
// ─────────────────────────────────────────────────────────────────

function StoryCanvas({
  storyMeta,
  story,
}: {
  storyMeta: StoryMeta;
  story: Story;
}) {
  const isManager = story.name === "Manager";
  const isOnLeave = story.name === "On Leave";
  const isFocused = story.name === "Focused";

  const violations: A11yViolation[] = story.variant === "a11y"
    ? [
        { id: "color-contrast", impact: "serious",  description: "Element has insufficient color contrast of 2.4:1 (minimum 4.5:1 required)", nodes: 2 },
        { id: "aria-label",     impact: "critical",  description: "Interactive element does not have an accessible name", nodes: 1 },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Canvas toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
        borderBottom: "1px solid #334155", background: "#0f172a",
        fontSize: 12,
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { icon: "🖥", label: "Desktop" },
            { icon: "📱", label: "Mobile" },
          ].map(v => (
            <button key={v.label} title={v.label} style={{
              background: v.label === "Desktop" ? "#1e293b" : "transparent",
              border: "1px solid #334155", borderRadius: 4,
              padding: "3px 7px", cursor: "pointer", fontSize: 12,
            }}>{v.icon}</button>
          ))}
        </div>
        <div style={{ height: 16, width: 1, background: "#334155" }} />
        <span style={{ color: "#475569" }}>Canvas</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <span style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "2px 7px", color: "#64748b", fontSize: 11 }}>
            {story.variant}
          </span>
          {story.variant === "interactive" && (
            <span style={{ background: "#6366f120", border: "1px solid #6366f1", borderRadius: 4, padding: "2px 7px", color: "#a5b4fc", fontSize: 11 }}>
              ▶ play()
            </span>
          )}
        </div>
      </div>

      {/* Story canvas */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "repeating-linear-gradient(45deg, #0a0f1e 0px, #0a0f1e 10px, #0d1424 10px, #0d1424 20px)",
        minHeight: 220, padding: 24,
      }}>
        {storyMeta.id === "employee-card" && (
          story.variant === "loading" ? <SkeletonCard /> :
          story.variant === "error"   ? <ErrorCard /> :
          <EmployeeCardDefault onLeave={isOnLeave} isManager={isManager} />
        )}
        {storyMeta.id === "data-table" && (
          story.variant === "empty" ? <EmptyTable /> : <MiniTable />
        )}
        {storyMeta.id === "skip-link" && <SkipLinkPreview focused={isFocused} />}
        {storyMeta.id === "col-config" && (
          <div style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
            padding: 16, width: 280,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Configure Columns</div>
            {["Employee ID", "Name", "Department", "Status"].map((col, i) => (
              <div key={col} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #334155" }}>
                <span style={{ color: "#334155", fontSize: 12 }}>⠿</span>
                <input type="checkbox" defaultChecked={i < 3} id={`mock-${i}`} style={{ accentColor: "#6366f1" }} />
                <label htmlFor={`mock-${i}`} style={{ fontSize: 12, color: "#e2e8f0", flex: 1 }}>{col}</label>
                <button aria-label={`Pin ${col}`} style={{ background: i < 2 ? "#6366f1" : "#0f172a", border: "1px solid #334155", borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 10 }}>📌</button>
              </div>
            ))}
            {story.variant === "error" && (
              <div style={{ marginTop: 10, background: "#ef444420", border: "1px solid #ef444440", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#f87171" }}>
                ⚠ Save failed — 500 Internal Server Error
              </div>
            )}
          </div>
        )}
      </div>

      {/* A11y panel (when a11y story) */}
      {story.variant === "a11y" && (
        <div style={{ borderTop: "1px solid #334155", maxHeight: 160, overflowY: "auto" }}>
          <div style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #1e293b" }}>A11y</div>
          <A11yPanel violations={violations} />
        </div>
      )}

      {/* Interactions panel (when interactive) */}
      {story.variant === "interactive" && (
        <div style={{ borderTop: "1px solid #334155", background: "#0f172a", padding: "8px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Interactions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[
              { step: "Tab into card",          status: "pass" },
              { step: "Open action menu",        status: "pass" },
              { step: "Arrow key to Edit item",  status: "pass" },
              { step: "Escape closes, focus returns", status: "pass" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
                <span style={{ color: "#4ade80" }}>✓</span>
                <span style={{ color: "#94a3b8" }}>{s.step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story description */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #334155", fontSize: 11, color: "#475569" }}>
        {story.description}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────

export function StorybookDemo() {
  const [activeStoryMeta, setActiveStoryMeta] = useState<StoryMeta>(STORY_TREE[0]);
  const [activeStory, setActiveStory] = useState<Story>(STORY_TREE[0].stories[0]);
  const [activeTab, setActiveTab] = useState<"preview" | "mocking" | "play" | "decorators">("preview");
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set(["employee-card"]));

  const toggleComponent = (id: string) => {
    setExpandedComponents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectStory = (meta: StoryMeta, story: Story) => {
    setActiveStoryMeta(meta);
    setActiveStory(story);
  };

  const variantBadgeColor = (variant: Story["variant"]) => {
    const map: Record<Story["variant"], string> = {
      default: "#64748b", loading: "#0891b2", error: "#ef4444",
      empty: "#94a3b8", interactive: "#6366f1", a11y: "#10b981",
    };
    return map[variant];
  };

  const activeCodeBlock = useMemo(() => {
    const map: Record<typeof activeTab, string> = {
      preview:    CODE_BLOCKS.csf3,
      mocking:    CODE_BLOCKS.factories,
      play:       CODE_BLOCKS.playFunctions,
      decorators: CODE_BLOCKS.decorators,
    };
    return map[activeTab];
  }, [activeTab]);

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📚</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Storybook — Modern Testing Patterns
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              CSF3 · play() functions · MSW mocking · Factory pattern · a11y addon · Chromatic
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["CSF3", "play()", "MSW handlers", "faker.js factories", "a11y addon", "chromatic", "decorators", "argTypes"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "preview"    as const, label: "📚 Story Browser" },
          { id: "mocking"    as const, label: "🏭 Data Factories" },
          { id: "play"       as const, label: "▶ Play Functions" },
          { id: "decorators" as const, label: "🎨 Decorators" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0",
            padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Story Browser Tab — simulated Storybook UI */}
      {activeTab === "preview" && (
        <div style={{
          display: "grid", gridTemplateColumns: "220px 1fr 320px",
          gap: 0, background: "#1e293b", border: "1px solid #334155",
          borderRadius: 12, overflow: "hidden", minHeight: 540,
        }}>
          {/* Sidebar — story tree */}
          <div style={{ borderRight: "1px solid #334155", overflow: "auto", background: "#0f172a" }}>
            {/* Storybook header */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📚</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>Storybook</span>
              <span style={{ fontSize: 9, color: "#6366f1", background: "#6366f120", padding: "1px 5px", borderRadius: 4, marginLeft: "auto" }}>7.6</span>
            </div>
            <div style={{ padding: "8px 6px" }}>
              {STORY_TREE.map(meta => (
                <div key={meta.id}>
                  <button
                    onClick={() => toggleComponent(meta.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 6,
                      background: "none", border: "none", padding: "5px 8px",
                      color: "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 700,
                      textAlign: "left", borderRadius: 4,
                    }}
                  >
                    <span style={{ fontSize: 8 }}>{expandedComponents.has(meta.id) ? "▼" : "▶"}</span>
                    <span style={{ color: "#64748b", fontSize: 10 }}>{meta.title.split(" / ")[0]} /</span>
                    <span>{meta.title.split(" / ")[1]}</span>
                  </button>
                  {expandedComponents.has(meta.id) && meta.stories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => selectStory(meta, story)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 6,
                        background: activeStory.id === story.id && activeStoryMeta.id === meta.id ? "#1e293b" : "none",
                        border: "none", padding: "4px 8px 4px 20px",
                        color: activeStory.id === story.id && activeStoryMeta.id === meta.id ? "#f1f5f9" : "#64748b",
                        cursor: "pointer", fontSize: 11, textAlign: "left", borderRadius: 4,
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: variantBadgeColor(story.variant),
                        flexShrink: 0,
                      }} />
                      {story.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <StoryCanvas storyMeta={activeStoryMeta} story={activeStory} />

          {/* Controls panel */}
          <div style={{ borderLeft: "1px solid #334155", overflow: "auto", background: "#0f172a" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #334155" }}>
              {["Controls", "Actions", "A11y"].map(p => (
                <div key={p} style={{ padding: "8px 12px", fontSize: 11, color: "#64748b", borderRight: "1px solid #334155", cursor: "pointer" }}>{p}</div>
              ))}
            </div>
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>
                Args for <code style={{ color: "#7dd3fc" }}>{activeStoryMeta.component}</code>
              </div>
              {/* Mock controls */}
              {[
                { name: "status",       type: "select",   value: "Active" },
                { name: "department",   type: "text",     value: "Engineering" },
                { name: "isManager",    type: "boolean",  value: false },
                { name: "showSalary",   type: "boolean",  value: false },
              ].map(ctrl => (
                <div key={ctrl.name} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>{ctrl.name}</div>
                  {ctrl.type === "boolean" ? (
                    <input type="checkbox" defaultChecked={ctrl.value as boolean} style={{ accentColor: "#6366f1" }} />
                  ) : ctrl.type === "select" ? (
                    <select style={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9", borderRadius: 4, padding: "3px 6px", fontSize: 11, width: "100%" }}>
                      <option>Active</option><option>On Leave</option><option>Terminated</option>
                    </select>
                  ) : (
                    <input type="text" defaultValue={ctrl.value as string} style={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9", borderRadius: 4, padding: "3px 8px", fontSize: 11, width: "100%", boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #334155", fontSize: 10, color: "#475569" }}>
                ⌘+P to open story args<br />
                Changes update args → story re-renders live
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code panels for other tabs */}
      {activeTab !== "preview" && (
        <div style={{ maxWidth: 900 }}>
          <div style={{
            background: "#1e293b", border: "1px solid #334155",
            borderLeft: `4px solid ${activeTab === "mocking" ? "#10b981" : activeTab === "play" ? "#6366f1" : "#f59e0b"}`,
            borderRadius: 10, padding: 16,
          }}>
            <h3 style={{
              margin: "0 0 12px",
              color: activeTab === "mocking" ? "#10b981" : activeTab === "play" ? "#6366f1" : "#f59e0b",
              fontSize: 14, fontWeight: 700,
            }}>
              {activeTab === "mocking" && "🏭 Factory pattern with faker.js — test/factories/employee.factory.ts"}
              {activeTab === "play" && "▶ play() — interaction testing inside Storybook"}
              {activeTab === "decorators" && "🎨 Global decorators & parameters — .storybook/preview.tsx"}
            </h3>
            <pre style={{ margin: 0, background: "#0f172a", color: "#94a3b8", padding: 16, borderRadius: 8, fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, overflow: "auto", maxHeight: 560 }}>
              <code>{activeTab === "mocking" ? CODE_BLOCKS.factories : activeTab === "play" ? CODE_BLOCKS.playFunctions : CODE_BLOCKS.decorators}</code>
            </pre>
          </div>

          {activeTab === "mocking" && (
            <div style={{
              marginTop: 16, background: "#1e293b", border: "1px solid #f59e0b30",
              borderLeft: "4px solid #f59e0b", borderRadius: 10, padding: 16,
            }}>
              <h3 style={{ margin: "0 0 12px", color: "#f59e0b", fontSize: 14, fontWeight: 700 }}>🌐 MSW (Mock Service Worker) — test/mocks/handlers.ts</h3>
              <pre style={{ margin: 0, background: "#0f172a", color: "#94a3b8", padding: 16, borderRadius: 8, fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, overflow: "auto" }}>
                <code>{CODE_BLOCKS.msw}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StorybookDemo;
