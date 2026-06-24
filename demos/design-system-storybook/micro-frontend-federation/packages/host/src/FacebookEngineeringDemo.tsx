/**
 * FacebookEngineeringDemo.tsx
 *
 * Facebook (Meta) engineering work — three distinct contributions:
 *
 * 1. DEPLOY INTERFACE
 *    New UI to deploy Facebook backend services.
 *    Focus: usability, deployment frequency, code quality.
 *
 * 2. TYPE GENERATOR
 *    Tool to generate FlowJS types from Hack (PHP) types.
 *    Eliminates manual type sync across the Hack→JS API boundary.
 *
 * 3. PROFILE PICTURE EDITOR
 *    Rewrote the profile picture changing flow.
 *    Added editing: crop, zoom, pan, real-time preview.
 *
 * TABS
 *   🚀 Deploy Interface   — internal service deployment UI
 *   🔄 Type Generator     — Hack → Flow type code-gen tool
 *   🖼 Profile Picture    — image editor (crop / zoom / pan)
 *   🔗 Engineering Story  — how these fit together, interview context
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Deploy interface data
// ─────────────────────────────────────────────────────────────────

type ServiceStatus = "healthy" | "degraded" | "deploying" | "error";
type DeployStage = "idle" | "build" | "test" | "canary" | "production" | "done";

interface Service {
  id: string; name: string; team: string;
  version: string; status: ServiceStatus;
  lastDeploy: string; deployFreq: string;
  language: string; instances: number;
}

const SERVICES: Service[] = [
  { id: "user-svc",   name: "UserService",         team: "Identity",   version: "v4.2.1", status: "healthy",  lastDeploy: "2h ago",  deployFreq: "8×/day",  language: "Hack", instances: 240 },
  { id: "auth-svc",   name: "AuthService",          team: "Security",   version: "v7.0.3", status: "healthy",  lastDeploy: "6h ago",  deployFreq: "4×/day",  language: "Hack", instances: 180 },
  { id: "notif-svc",  name: "NotificationService",  team: "Growth",     version: "v2.9.0", status: "degraded", lastDeploy: "14h ago", deployFreq: "2×/day",  language: "Hack", instances: 96  },
  { id: "feed-svc",   name: "FeedService",          team: "News Feed",  version: "v11.3.7",status: "healthy",  lastDeploy: "45m ago", deployFreq: "12×/day", language: "Hack", instances: 640 },
  { id: "media-svc",  name: "MediaService",         team: "Media",      version: "v3.1.4", status: "healthy",  lastDeploy: "3h ago",  deployFreq: "6×/day",  language: "C++",  instances: 320 },
  { id: "graph-svc",  name: "GraphAPIService",      team: "Platform",   version: "v5.8.2", status: "error",    lastDeploy: "1d ago",  deployFreq: "3×/day",  language: "Hack", instances: 420 },
];

const DEPLOY_STAGES: { id: DeployStage; label: string; duration: number; detail: string }[] = [
  { id: "build",      label: "Build",            duration: 1800, detail: "Compiling Hack → HHVM bytecode, running type checker…" },
  { id: "test",       label: "Unit + Lint",       duration: 1600, detail: "Running Jest unit tests, Flow type checks, ESLint…" },
  { id: "canary",     label: "Canary (1%)",       duration: 2200, detail: "Deploying to 1% of traffic. Monitoring error rate & latency…" },
  { id: "production", label: "Production (100%)", duration: 2000, detail: "Ramping up to 100%. Watching p99 latency and error budget…" },
  { id: "done",       label: "Done",              duration: 0,    detail: "Deployment complete. All health checks passing." },
];

const STATUS_COLOR: Record<ServiceStatus, string> = {
  healthy: "#4ade80", degraded: "#fbbf24", deploying: "#60a5fa", error: "#ef4444",
};

// ─────────────────────────────────────────────────────────────────
// Type generator data
// ─────────────────────────────────────────────────────────────────

interface HackExample {
  label: string;
  hack: string;
  flow: string;
  note: string;
}

const HACK_EXAMPLES: HackExample[] = [
  {
    label: "User Profile shape",
    note: "shape() → object type, Hack scalar types → Flow equivalents",
    hack: `<?hh // strict

type UserProfile = shape(
  'user_id'       => int,
  'name'          => string,
  'email'         => ?string,
  'avatar_url'    => ?string,
  'friends_count' => int,
  'is_verified'   => bool,
  'created_at'    => float,
);`,
    flow: `// @flow

type UserProfile = {
  user_id:       number,
  name:          string,
  email:         ?string,
  avatar_url:    ?string,
  friends_count: number,
  is_verified:   boolean,
  created_at:    number,
};`,
  },
  {
    label: "Generic response type",
    note: "Generics, function signatures, $param → param",
    hack: `<?hh // strict

type ServiceResponse<T> = shape(
  'data'        => T,
  'error'       => ?string,
  'status_code' => int,
  'request_id'  => string,
);

function fetchUser(
  int $user_id,
): ServiceResponse<UserProfile>;

function updateProfile(
  int $user_id,
  UserProfile $profile,
): ServiceResponse<bool>;`,
    flow: `// @flow

type ServiceResponse<T> = {
  data:        T,
  error:       ?string,
  status_code: number,
  request_id:  string,
};

declare function fetchUser(
  user_id: number,
): ServiceResponse<UserProfile>;

declare function updateProfile(
  user_id: number,
  profile: UserProfile,
): ServiceResponse<boolean>;`,
  },
  {
    label: "Feed types with collections",
    note: "Vector<T> → Array<T>, nested shapes, ImmVector → $ReadOnlyArray",
    hack: `<?hh // strict

type FeedItem = shape(
  'id'           => string,
  'author'       => UserProfile,
  'content'      => string,
  'likes'        => Vector<int>,
  'tags'         => ImmVector<string>,
  'created_at'   => int,
  'is_sponsored' => bool,
);

type FeedResponse = shape(
  'items'    => Vector<FeedItem>,
  'has_more' => bool,
  'cursor'   => ?string,
  'count'    => int,
);`,
    flow: `// @flow

type FeedItem = {
  id:           string,
  author:       UserProfile,
  content:      string,
  likes:        Array<number>,
  tags:         $ReadOnlyArray<string>,
  created_at:   number,
  is_sponsored: boolean,
};

type FeedResponse = {
  items:    Array<FeedItem>,
  has_more: boolean,
  cursor:   ?string,
  count:    number,
};`,
  },
];

// Simple live transformer for the textarea
function hackToFlow(input: string): string {
  if (!input.trim()) return "";
  let out = input;
  // Header
  out = out.replace(/^<\?hh\s*(\/\/\s*strict)?/m, "// @flow");
  // shape() → object literal
  out = out.replace(/shape\(/g, "{");
  out = out.replace(/\)\s*;/g, "};");
  // key quotes: 'key' => → key:
  out = out.replace(/'(\w+)'\s*=>/g, "$1:");
  // Collections
  out = out.replace(/\bImmVector</g, "$ReadOnlyArray<");
  out = out.replace(/\bImmMap</g, "$ReadOnlyMap<");
  out = out.replace(/\bVector</g, "Array<");
  // Scalars
  out = out.replace(/\bint\b/g, "number");
  out = out.replace(/\bfloat\b/g, "number");
  out = out.replace(/\bbool\b/g, "boolean");
  out = out.replace(/\bmixed\b/g, "mixed");
  // Function signatures: remove $ from params, add declare
  out = out.replace(/^(\s*)function\s+/gm, "$1declare function ");
  out = out.replace(/\$(\w+)/g, "$1");
  // Remove Hack-specific return type annotation style
  out = out.replace(/:\s*void\s*;/g, ": void;");
  return out;
}

// ─────────────────────────────────────────────────────────────────
// Profile picture editor
// ─────────────────────────────────────────────────────────────────

const DEMO_AVATARS = [
  { label: "Blue gradient", colors: ["#6366f1", "#0ea5e9"] },
  { label: "Green gradient", colors: ["#10b981", "#0ea5e9"] },
  { label: "Pink gradient",  colors: ["#ec4899", "#f59e0b"] },
  { label: "Purple gradient",colors: ["#8b5cf6", "#ec4899"] },
];

function AvatarCanvas({ colors, zoom, offsetX, offsetY, size = 200 }: {
  colors: [string, string]; zoom: number;
  offsetX: number; offsetY: number; size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    const s = size * zoom;
    const x = (size - s) / 2 + offsetX;
    const y = (size - s) / 2 + offsetY;
    const grad = ctx.createLinearGradient(x, y, x + s, y + s);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, s, s);
    // Decorative circles
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.35, s * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.72, y + s * 0.65, s * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(x + s * 0.55, y + s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();
  }, [colors, zoom, offsetX, offsetY, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
}

// ─────────────────────────────────────────────────────────────────
// Deploy simulation hook
// ─────────────────────────────────────────────────────────────────

function useDeploySimulation() {
  const [stage, setStage] = useState<DeployStage>("idle");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const deploy = useCallback((svc: Service) => {
    clear();
    setLog([]);
    setProgress(0);

    const stageQueue = [...DEPLOY_STAGES];
    let elapsed = 0;
    const addLog = (msg: string) => setLog(p => [...p, msg]);

    const runNext = (idx: number) => {
      if (idx >= stageQueue.length) return;
      const s = stageQueue[idx];
      setStage(s.id);
      addLog(`[${new Date().toLocaleTimeString()}] ${s.label}: ${s.detail}`);
      if (s.id === "done") { setProgress(100); return; }

      let tick = 0;
      const totalTicks = 20;
      const interval = s.duration / totalTicks;
      const prevProgress = (idx / (stageQueue.length - 1)) * 100;
      const nextProgress = ((idx + 1) / (stageQueue.length - 1)) * 100;

      const tickFn = () => {
        tick++;
        setProgress(Math.round(prevProgress + (nextProgress - prevProgress) * (tick / totalTicks)));
        if (tick < totalTicks) {
          timerRef.current = setTimeout(tickFn, interval);
        } else {
          timerRef.current = setTimeout(() => runNext(idx + 1), 100);
        }
      };
      timerRef.current = setTimeout(tickFn, 0);
    };

    addLog(`[${new Date().toLocaleTimeString()}] Starting deployment of ${svc.name} (${svc.version} → next)…`);
    runNext(0);
  }, []);

  const reset = useCallback(() => { clear(); setStage("idle"); setProgress(0); setLog([]); }, []);
  useEffect(() => () => clear(), []);
  return { stage, progress, log, deploy, reset };
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function FacebookEngineeringDemo() {
  const [activeTab, setActiveTab] = useState<"deploy" | "types" | "photo" | "webrtc" | "story">("deploy");

  // Deploy
  const [selectedSvc, setSelectedSvc] = useState<Service>(SERVICES[0]);
  const { stage, progress, log, deploy, reset } = useDeploySimulation();

  // Type gen
  const [exampleIdx, setExampleIdx] = useState(0);
  const [liveHack, setLiveHack] = useState("");
  const [mode, setMode] = useState<"examples" | "live">("examples");
  const liveFlow = useMemo(() => hackToFlow(liveHack), [liveHack]);

  // Photo editor
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [saved, setSaved] = useState(false);

  // WebRTC Screen Sharing States
  const [callType, setCallType] = useState<"one-to-one" | "group" | "room">("group");
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [senderPlatform, setSenderPlatform] = useState<"chrome" | "firefox" | "safari" | "mobile">("chrome");
  const [receiverPlatform, setReceiverPlatform] = useState<"chrome" | "firefox" | "safari" | "mobile">("mobile");
  const [webrtcLogs, setWebrtcLogs] = useState<string[]>([
    "[WebRTC] Signaling channel initialized. Media streams ready."
  ]);
  const [webrtcStats, setWebrtcStats] = useState({ fps: 30, bitrate: 2.1, packetLoss: 0.05 });

  // WebRTC Employee & Hardware platform States
  const [webrtcSubTab, setWebrtcSubTab] = useState<"public" | "internal" | "hardware">("public");
  const [companionSharing, setCompanionSharing] = useState(false);
  const [companionPrimaryDevice, setCompanionPrimaryDevice] = useState<"mobile" | "portal">("portal");
  const [whiteboardLines, setWhiteboardLines] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const toggleCompanionShare = () => {
    const nextSharing = !companionSharing;
    setCompanionSharing(nextSharing);
    const timestamp = new Date().toLocaleTimeString();
    if (nextSharing) {
      setWebrtcLogs(prev => [
        `[${timestamp}] [Acoustic] Feedback loop suppressed: Laptop mic muted, audio routed to primary ${companionPrimaryDevice}.`,
        `[${timestamp}] [Signaling] Companion Laptop paired successfully. Code: META-8109 verified.`,
        `[${timestamp}] [WebRTC] Bonding laptop screen track to active ${companionPrimaryDevice} session...`,
        ...prev
      ]);
    } else {
      setWebrtcLogs(prev => [
        `[${timestamp}] [WebRTC] Companion screen track unbonded.`,
        ...prev
      ]);
    }
  };

  const handleWhiteboardDraw = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setWhiteboardLines(prev => [...prev, { x, y }]);
  };

  const clearWhiteboard = () => {
    setWhiteboardLines([]);
    const timestamp = new Date().toLocaleTimeString();
    setWebrtcLogs(prev => [
      `[${timestamp}] [Redux] Whiteboard canvas state cleared.`,
      ...prev
    ]);
  };

  const triggerWebRtcRenegotiation = useCallback((sharing: boolean, sender: string, receiver: string, type: string) => {
    const timestamp = new Date().toLocaleTimeString();
    if (!sharing) {
      setWebrtcLogs(prev => [
        `[${timestamp}] Screen share session stopped. Renegotiating tracks back to video-only.`,
        ...prev
      ]);
      return;
    }

    setWebrtcLogs(prev => [
      `[${timestamp}] [ICE] candidate gathering completed successfully. DTLS bound.`,
      `[${timestamp}] [Signaling] SDP Answer parsed. Negotiated screen-share codec: VP9`,
      `[${timestamp}] [Signaling] Remote description updated successfully.`,
      `[${timestamp}] [Signaling] Sent SDP Offer (calling type: ${type.toUpperCase()}) from ${sender.toUpperCase()} to ${receiver.toUpperCase()}`,
      `[${timestamp}] WebRTC PeerConnection renegotiation triggered for screen sharing track...`,
      ...prev
    ]);

    // Simulate metrics fluctuations
    setWebrtcStats({
      fps: sender === "mobile" ? 24 : 30,
      bitrate: receiver === "mobile" ? 1.4 : 3.2,
      packetLoss: receiver === "mobile" ? 0.8 : 0.02
    });
  }, []);

  const toggleScreenShare = () => {
    const nextSharing = !isSharingScreen;
    setIsSharingScreen(nextSharing);
    triggerWebRtcRenegotiation(nextSharing, senderPlatform, receiverPlatform, callType);
  };

  useEffect(() => {
    if (isSharingScreen) {
      triggerWebRtcRenegotiation(isSharingScreen, senderPlatform, receiverPlatform, callType);
    }
  }, [senderPlatform, receiverPlatform, callType, isSharingScreen, triggerWebRtcRenegotiation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY });
    setSaved(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const maxOffset = 60;
    const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStart.ox + (e.clientX - dragStart.x)));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStart.oy + (e.clientY - dragStart.y)));
    setOffsetX(newX); setOffsetY(newY);
  };
  const handleMouseUp = () => setDragging(false);

  const curExample = HACK_EXAMPLES[exampleIdx];

  const TABS = [
    { id: "deploy" as const, label: "🚀 Deploy Interface" },
    { id: "types"  as const, label: "🔄 Type Generator" },
    { id: "photo"  as const, label: "🖼 Profile Picture" },
    { id: "webrtc" as const, label: "📞 Video & Screen Share" },
    { id: "story"  as const, label: "🔗 Engineering Story" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>👤</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Facebook Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Deploy Interface · Hack→Flow Type Generator · Profile Picture Editor
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Internal Tooling", "Developer Experience", "FlowJS", "Hack (PHP)", "Code Generation", "Canvas API", "React", "Internal Infrastructure"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DEPLOY INTERFACE ── */}
      {activeTab === "deploy" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>Context: Internal Facebook service deployment UI</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Facebook's backend runs thousands of Hack (PHP) services. The deploy interface is an internal tool used by engineers
              to deploy service updates safely — with canary analysis, health monitoring, and rollback. The focus was on
              <strong style={{ color: "#f1f5f9" }}> usability</strong> (clear status, actionable errors),
              <strong style={{ color: "#f1f5f9" }}> deployment frequency</strong> (frictionless enough to deploy many times a day), and
              <strong style={{ color: "#f1f5f9" }}> code quality</strong> (automated gates before each stage).
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
            {/* Service list */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>SERVICES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SERVICES.map(svc => (
                  <button key={svc.id} onClick={() => { setSelectedSvc(svc); reset(); }} style={{
                    background: selectedSvc.id === svc.id ? "#1e293b" : "#0f172a",
                    border: `1px solid ${selectedSvc.id === svc.id ? "#6366f1" : "#334155"}`,
                    borderRadius: 8, padding: "10px 12px", textAlign: "left", cursor: "pointer",
                    borderLeft: `3px solid ${STATUS_COLOR[svc.status]}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{svc.name}</span>
                      <span style={{ fontSize: 9, color: STATUS_COLOR[svc.status], fontWeight: 700 }}>● {svc.status}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{svc.team} · {svc.version} · {svc.deployFreq}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Deploy panel */}
            <div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedSvc.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{selectedSvc.team} · {selectedSvc.language} · {selectedSvc.instances} instances</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 10, textAlign: "center" }}>
                      <div style={{ color: "#64748b" }}>Version</div>
                      <div style={{ color: "#a5b4fc", fontWeight: 700 }}>{selectedSvc.version}</div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 10, textAlign: "center" }}>
                      <div style={{ color: "#64748b" }}>Last deploy</div>
                      <div style={{ color: "#f1f5f9", fontWeight: 700 }}>{selectedSvc.lastDeploy}</div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 10, textAlign: "center" }}>
                      <div style={{ color: "#64748b" }}>Freq</div>
                      <div style={{ color: "#4ade80", fontWeight: 700 }}>{selectedSvc.deployFreq}</div>
                    </div>
                  </div>
                </div>

                {/* Deploy stages progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {DEPLOY_STAGES.filter(s => s.id !== "idle").map((s, i) => {
                      const stageIds = DEPLOY_STAGES.filter(s => s.id !== "idle").map(s => s.id);
                      const curIdx = stageIds.indexOf(stage);
                      const thisIdx = i;
                      const done = stage === "done" || thisIdx < curIdx;
                      const active = stageIds[curIdx] === s.id && stage !== "idle";
                      return (
                        <div key={s.id} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{
                            height: 6, borderRadius: 3, marginBottom: 4,
                            background: done ? "#4ade80" : active ? "#60a5fa" : "#1e293b",
                            transition: "background 0.3s",
                          }} />
                          <div style={{ fontSize: 9, color: done ? "#4ade80" : active ? "#60a5fa" : "#334155", fontWeight: active ? 700 : 400 }}>
                            {s.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {stage !== "idle" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ flex: 1, height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: stage === "done" ? "#4ade80" : "#60a5fa", borderRadius: 3, transition: "width 0.1s" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#64748b", width: 32, textAlign: "right" }}>{progress}%</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => deploy(selectedSvc)}
                    disabled={stage !== "idle" && stage !== "done"}
                    style={{ background: "#4f46e5", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: (stage !== "idle" && stage !== "done") ? 0.5 : 1 }}
                  >
                    {stage === "idle" ? "🚀 Deploy" : stage === "done" ? "🚀 Deploy again" : "Deploying…"}
                  </button>
                  {stage !== "idle" && (
                    <button onClick={reset} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 16px", color: "#64748b", cursor: "pointer", fontSize: 12 }}>
                      ↺ Reset
                    </button>
                  )}
                  <button style={{ marginLeft: "auto", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: "10px 16px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                    ⎌ Rollback
                  </button>
                </div>
              </div>

              {/* Deploy log */}
              <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: 14, minHeight: 140 }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>DEPLOY LOG</div>
                {log.length === 0 && <div style={{ fontSize: 11, color: "#334155" }}>No deployment started — select a service and click Deploy</div>}
                {log.map((line, i) => (
                  <div key={i} style={{ fontSize: 10, color: i === log.length - 1 ? "#f1f5f9" : "#64748b", marginBottom: 3, fontFamily: "monospace", lineHeight: 1.5 }}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TYPE GENERATOR ── */}
      {activeTab === "types" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #0ea5e930", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7dd3fc", marginBottom: 4 }}>Context: Hack → FlowJS type code generation</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Facebook's backend is written in <strong style={{ color: "#f1f5f9" }}>Hack</strong> (a typed PHP dialect).
              Frontend is typed with <strong style={{ color: "#f1f5f9" }}>FlowJS</strong>.
              Without this tool, engineers manually re-typed every API response type in both languages — error-prone and always out of sync.
              The generator reads Hack type definitions and outputs equivalent Flow types automatically,
              ensuring the API boundary is type-safe on both sides.
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <button onClick={() => setMode("examples")} style={{ background: mode === "examples" ? "#6366f120" : "#1e293b", border: `1px solid ${mode === "examples" ? "#6366f1" : "#334155"}`, borderRadius: 8, padding: "7px 16px", color: mode === "examples" ? "#a5b4fc" : "#64748b", cursor: "pointer", fontSize: 12 }}>📚 Examples</button>
            <button onClick={() => setMode("live")} style={{ background: mode === "live" ? "#10b98120" : "#1e293b", border: `1px solid ${mode === "live" ? "#10b981" : "#334155"}`, borderRadius: 8, padding: "7px 16px", color: mode === "live" ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 12 }}>⚡ Live editor</button>
          </div>

          {mode === "examples" ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {HACK_EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setExampleIdx(i)} style={{ background: exampleIdx === i ? "#0ea5e920" : "#1e293b", border: `1px solid ${exampleIdx === i ? "#0ea5e9" : "#334155"}`, borderRadius: 8, padding: "7px 14px", color: exampleIdx === i ? "#7dd3fc" : "#64748b", cursor: "pointer", fontSize: 11 }}>{ex.label}</button>
                ))}
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: "#64748b" }}>
                💡 {curExample.note}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#f97316", fontWeight: 700 }}>HACK (PHP)</span>
                    <span style={{ fontSize: 9, color: "#64748b", marginLeft: "auto" }}>Backend type definition</span>
                  </div>
                  <pre style={{ margin: 0, padding: 14, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 400 }}>{curExample.hack}</pre>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 700 }}>FLOW (JavaScript)</span>
                    <span style={{ fontSize: 9, color: "#64748b", marginLeft: "auto" }}>Auto-generated</span>
                  </div>
                  <pre style={{ margin: 0, padding: 14, fontSize: 11, fontFamily: "monospace", color: "#4ade80", lineHeight: 1.7, overflow: "auto", maxHeight: 400 }}>{curExample.flow}</pre>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Type Hack code — Flow types appear instantly on the right</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#f97316", fontWeight: 700 }}>HACK (input)</div>
                  <textarea
                    value={liveHack}
                    onChange={e => setLiveHack(e.target.value)}
                    placeholder={"<?hh // strict\n\ntype MyType = shape(\n  'id' => int,\n  'name' => string,\n);"}
                    style={{ width: "100%", minHeight: 320, background: "#1e293b", border: "none", padding: 14, color: "#94a3b8", fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#4ade80", fontWeight: 700 }}>FLOW (generated)</div>
                  <pre style={{ margin: 0, padding: 14, fontSize: 11, fontFamily: "monospace", color: "#4ade80", lineHeight: 1.7, minHeight: 320 }}>
                    {liveFlow || <span style={{ color: "#334155" }}>// Flow types will appear here…</span>}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Type mapping table */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Type mapping rules</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                ["int", "number"], ["float", "number"], ["bool", "boolean"], ["string", "string"],
                ["void", "void"], ["null", "null"], ["mixed", "mixed"], ["?T", "?T"],
                ["Vector<T>", "Array<T>"], ["ImmVector<T>", "$ReadOnlyArray<T>"], ["Map<K,V>", "{[K]: V}"], ["shape()", "{ }"],
              ].map(([hack, flow]) => (
                <div key={hack} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", display: "flex", gap: 6, alignItems: "center", fontSize: 10, fontFamily: "monospace" }}>
                  <span style={{ color: "#f97316" }}>{hack}</span>
                  <span style={{ color: "#334155" }}>→</span>
                  <span style={{ color: "#4ade80" }}>{flow}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE PICTURE EDITOR ── */}
      {activeTab === "photo" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #ec4899" + "30", borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f9a8d4", marginBottom: 4 }}>Context: Profile picture change flow rewrite</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              The original flow allowed users to upload a photo but not edit it — no crop, no zoom, no reposition.
              The rewrite added a full editing experience: pan by dragging, zoom with a slider, and a real-time circular preview
              before saving. The challenge was building a responsive canvas-based editor that worked across mobile and desktop,
              with pixel-accurate crop mapping to the server-side processing parameters.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Editor */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>Choose image</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {DEMO_AVATARS.map((a, i) => (
                  <button key={i} onClick={() => { setAvatarIdx(i); setZoom(1.2); setOffsetX(0); setOffsetY(0); setSaved(false); }}
                    style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${a.colors[0]}, ${a.colors[1]})`, border: `2px solid ${avatarIdx === i ? "#fff" : "transparent"}`, cursor: "pointer" }} />
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>Edit</div>
              <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 16px", cursor: dragging ? "grabbing" : "grab" }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                {/* Clip to circle */}
                <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", border: "3px solid #6366f1" }}>
                  <AvatarCanvas
                    colors={DEMO_AVATARS[avatarIdx].colors as [string, string]}
                    zoom={zoom} offsetX={offsetX} offsetY={offsetY} size={200}
                  />
                </div>
                <div style={{ position: "absolute", bottom: 4, right: 4, background: "#0f172a90", borderRadius: 4, padding: "2px 6px", fontSize: 9, color: "#94a3b8" }}>
                  Drag to reposition
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 6 }}>
                  <span>Zoom</span><span>{Math.round((zoom - 1) * 100)}% in</span>
                </div>
                <input type="range" min="1" max="2.5" step="0.05" value={zoom}
                  onChange={e => { setZoom(parseFloat(e.target.value)); setSaved(false); }}
                  style={{ width: "100%", accentColor: "#6366f1" }} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSaved(true)} style={{ flex: 1, background: "#6366f1", border: "none", borderRadius: 8, padding: "10px 0", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {saved ? "✅ Saved!" : "Save profile photo"}
                </button>
                <button onClick={() => { setZoom(1.2); setOffsetX(0); setOffsetY(0); setSaved(false); }}
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#64748b", cursor: "pointer", fontSize: 12 }}>
                  Reset
                </button>
              </div>
            </div>

            {/* Before / After + technical notes */}
            <div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ padding: 12, borderRight: "1px solid #334155" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>BEFORE (original flow)</div>
                    {["Upload photo → save immediately", "No crop, no zoom", "Photo might be off-center", "No preview before saving", "Cannot reposition after upload"].map(p => (
                      <div key={p} style={{ fontSize: 10, color: "#64748b", marginBottom: 5, display: "flex", gap: 4 }}><span style={{ color: "#ef4444" }}>✗</span>{p}</div>
                    ))}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>AFTER (rewrite)</div>
                    {["Upload → full editing step", "Zoom slider (1x–2.5x)", "Drag to reposition", "Real-time circular preview", "Client crop params sent to server"].map(p => (
                      <div key={p} style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, display: "flex", gap: 4 }}><span style={{ color: "#4ade80" }}>✓</span>{p}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b" }}>
                  Key technical implementation
                </div>
                <pre style={{ margin: 0, padding: 14, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto" }}>{
`// Editor tracks: zoom, offsetX, offsetY in state
// Canvas redraws on every change — 60fps responsive

// On save: compute server-side crop parameters
function getCropParams(
  canvasSize: number,    // 200px (the circle diameter)
  imageNaturalSize: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  // The image is rendered as a zoomed/offset rect.
  // We need the crop rect in the image's natural coords.
  const rendered = imageNaturalSize * zoom;
  const left   = (rendered - canvasSize) / 2 - offsetX;
  const top    = (rendered - canvasSize) / 2 - offsetY;
  const cropSz = canvasSize / zoom;

  return {
    x:      Math.round(left / zoom),
    y:      Math.round(top  / zoom),
    width:  Math.round(cropSz),
    height: Math.round(cropSz),
  };
  // Sent to GraphQL mutation:
  // profilePicUpdate({ crop: cropParams, ... })
}`
                }</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MESSENGER VIDEO CALLS & WEBRTC SCREEN SHARING ── */}
      {activeTab === "webrtc" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #10b98130", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a7f3d0", marginBottom: 4 }}>Context: Messenger Video Calling Stack, Employee Video Calling & Kiosk Touch Devices</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Facebook's employee video client was a React, Flux, and ImmutableJS SPA. Because the core calling stack is shared with public Messenger calling, improvements deployed for employees dynamically shipped in Messenger.
              Key accomplishments include building a **WebRTC Laptop Companion Screen Sharing tool** used by all employees to share screens from laptops during calls on mobile/Portal, and several **Redux collaboration tools** for touch-screen Chromium devices.
            </div>
          </div>

          {/* Sub tab navigation */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#0f172a", padding: 4, borderRadius: 8, border: "1px solid #334155" }}>
            {[
              { id: "public" as const, label: "📞 Public Messenger Calling" },
              { id: "internal" as const, label: "🖥️ Employee Laptop Companion" },
              { id: "hardware" as const, label: "🎛️ Touch Screen Kiosk Platform" },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setWebrtcSubTab(sub.id)}
                style={{
                  flex: 1,
                  background: webrtcSubTab === sub.id ? "#10b98120" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  color: webrtcSubTab === sub.id ? "#10b981" : "#64748b",
                  padding: "6px 0",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SUB-TAB 1: PUBLIC MESSENGER CALLING */}
          {webrtcSubTab === "public" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 800 }}>📞 Call Setup: {callType.toUpperCase()} ({callType === "one-to-one" ? "2" : callType === "group" ? "5" : "18"} participants)</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["one-to-one", "group", "room"].map(type => (
                      <span
                        key={type}
                        onClick={() => setCallType(type as any)}
                        style={{
                          fontSize: 8,
                          padding: "3px 6px",
                          borderRadius: 4,
                          cursor: "pointer",
                          background: callType === type ? "#10b981" : "#1e293b",
                          color: callType === type ? "#000" : "#94a3b8",
                          fontWeight: 700
                        }}
                      >
                        {type.replace("-", " ").toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: 10, padding: 14, height: 260, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  {isSharingScreen ? (
                    <div style={{ flex: 1, background: "#1e1e2e", border: "2px solid #10b981", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🖥️</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>Active Screen Sharing Stream</span>
                      <span style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>Sharing from {senderPlatform.toUpperCase()} to call participants...</span>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: callType === "one-to-one" ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#1e293b", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4ade80", marginBottom: 6 }} />
                        <span style={{ fontSize: 9.5 }}>User (You)</span>
                      </div>
                      <div style={{ background: "#1e293b", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#60a5fa", marginBottom: 6 }} />
                        <span style={{ fontSize: 9.5 }}>Sarah K.</span>
                      </div>
                      {callType !== "one-to-one" && (
                        <div style={{ background: "#1e293b", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ec4899", marginBottom: 6 }} />
                          <span style={{ fontSize: 9.5 }}>David M.</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", gap: 10, borderTop: "1px solid #1e293b", paddingTop: 10, marginTop: 8 }}>
                    <button onClick={toggleScreenShare} style={{
                      background: isSharingScreen ? "#ef4444" : "#10b981",
                      border: "none",
                      borderRadius: 20,
                      padding: "6px 16px",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}>
                      {isSharingScreen ? "Stop Sharing" : "Share Screen"}
                    </button>
                  </div>
                </div>

                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 8 }}>WEBRTC DYNAMIC STREAM METRICS</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                    <div style={{ background: "#0f172a", padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 8, color: "#64748b" }}>Framerate</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#10b981", marginTop: 2 }}>{isSharingScreen ? `${webrtcStats.fps} fps` : "0 fps"}</div>
                    </div>
                    <div style={{ background: "#0f172a", padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 8, color: "#64748b" }}>Bandwidth</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#10b981", marginTop: 2 }}>{isSharingScreen ? `${webrtcStats.bitrate} Mbps` : "0.0 Mbps"}</div>
                    </div>
                    <div style={{ background: "#0f172a", padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 8, color: "#64748b" }}>Packet Loss</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#10b981", marginTop: 2 }}>{isSharingScreen ? `${webrtcStats.packetLoss}%` : "0.0%"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>RENEGOTIATION CONSOLE & SETTINGS</div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, height: 410, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 8, color: "#64748b", display: "block", marginBottom: 3 }}>Sender Platform</label>
                      <select value={senderPlatform} onChange={e => setSenderPlatform(e.target.value as any)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", fontSize: 9, padding: 4, borderRadius: 4 }}>
                        <option value="chrome">Chrome (Desktop)</option>
                        <option value="firefox">Firefox (Desktop)</option>
                        <option value="safari">Safari (Mac)</option>
                        <option value="mobile">Messenger App (Mobile)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 8, color: "#64748b", display: "block", marginBottom: 3 }}>Receiver Platform</label>
                      <select value={receiverPlatform} onChange={e => setReceiverPlatform(e.target.value as any)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", fontSize: 9, padding: 4, borderRadius: 4 }}>
                        <option value="chrome">Chrome (Desktop)</option>
                        <option value="firefox">Firefox (Desktop)</option>
                        <option value="safari">Safari (Mac)</option>
                        <option value="mobile">Messenger App (Mobile)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: 8, overflowY: "auto", margin: "10px 0", fontFamily: AM.mono, fontSize: 8 }}>
                    {webrtcLogs.map((log, i) => (
                      <div key={i} style={{ color: log.includes("ICE") || log.includes("VP9") ? "#4ade80" : "#94a3b8", padding: "2px 0", borderBottom: "1px solid #1e293b" }}>{log}</div>
                    ))}
                  </div>
                  <div style={{ background: "#0f172a", padding: 8, borderRadius: 6, fontSize: 8 }}>
                    <strong>Codebase Sync:</strong> Core calling stack is identical for employees and public Messenger. Optimizations ship to both.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: EMPLOYEE LAPTOP COMPANION TOOL */}
          {webrtcSubTab === "internal" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 800 }}>🖥️ Laptop Companion Screen Share Simulator</span>
                  <div>
                    <label style={{ fontSize: 8, color: "#64748b", marginRight: 6 }}>Active Call Device:</label>
                    <select value={companionPrimaryDevice} onChange={e => setCompanionPrimaryDevice(e.target.value as any)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9", fontSize: 8, padding: 2, borderRadius: 4 }}>
                      <option value="mobile">Messenger Mobile</option>
                      <option value="portal">Facebook Portal Device</option>
                    </select>
                  </div>
                </div>

                {/* Companion graphic display */}
                <div style={{ display: "flex", gap: 12, background: "#090d16", border: "1px solid #1e293b", borderRadius: 10, padding: 14, height: 260, alignItems: "center", justifyContent: "center" }}>
                  {/* Primary calling device */}
                  <div style={{ width: 100, height: 180, border: "2px solid #334155", borderRadius: 12, background: "#121624", padding: 6, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ fontSize: 8, color: "#64748b", textAlign: "center" }}>{companionPrimaryDevice === "mobile" ? "📱 Mobile Call" : "🥽 Portal Call"}</div>
                    
                    {companionSharing ? (
                      <div style={{ flex: 1, border: "1px solid #10b981", borderRadius: 6, background: "#1e1e2e", marginTop: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 6, color: "#10b981", fontWeight: 700 }}>Companion Screen</span>
                        <div style={{ width: 40, height: 24, background: "#10b98130", borderRadius: 2, marginTop: 2 }} />
                      </div>
                    ) : (
                      <div style={{ flex: 1, border: "1px solid #334155", borderRadius: 6, background: "#0f172a", marginTop: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16 }}>👤</span>
                        <span style={{ fontSize: 7, color: "#64748b" }}>Sarah (Video)</span>
                      </div>
                    )}

                    <div style={{ fontSize: 7, color: "#4ade80", textAlign: "center", marginTop: 4 }}>🎤 Mic Active</div>
                  </div>

                  {/* Transfer / link indicator */}
                  <div style={{ fontSize: 18, color: companionSharing ? "#10b981" : "#334155" }}>
                    {companionSharing ? "◀─── 📡 ───" : "─── 🚫 ───"}
                  </div>

                  {/* Laptop secondary device */}
                  <div style={{ width: 180, height: 140, border: "2px solid #334155", borderRadius: 8, background: "#1c2135", padding: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 8, color: "#a5b4fc", fontWeight: 700 }}>💻 Employee Laptop Browser</div>
                    
                    <div style={{ flex: 1, background: "#0f172a", borderRadius: 5, marginTop: 4, padding: 6, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 7, color: "#64748b" }}>Presenter Workspace Slides</span>
                      <button onClick={toggleCompanionShare} style={{
                        background: companionSharing ? "#ef4444" : "#4f46e5",
                        border: "none",
                        borderRadius: 4,
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "4px 10px",
                        cursor: "pointer"
                      }}>
                        {companionSharing ? "Disconnect Present" : "Present Screen"}
                      </button>
                    </div>

                    <div style={{ fontSize: 6.5, color: "#ef4444", textAlign: "center", marginTop: 4 }}>🔇 Speaker/Mic Muted (No Feedback)</div>
                  </div>
                </div>

                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, fontSize: 8.5 }}>
                  <strong>Acoustic Loop Feedback Loop Prevention:</strong><br />
                  Screen sharing from a companion laptop in the same physical room as a calling Mobile/Portal creates high-frequency audio squeals. The companion tool automatically suppresses local audio tracks and utilizes WebRTC data markers to balance speaker outputs.
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>COMPANION STATE CONSOLE</div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, height: 410, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: 8, overflowY: "auto", fontFamily: AM.mono, fontSize: 8 }}>
                    {webrtcLogs.map((log, i) => (
                      <div key={i} style={{ color: log.includes("Companion") || log.includes("Feedback") ? "#60a5fa" : "#94a3b8", padding: "2px 0", borderBottom: "1px solid #1e293b" }}>{log}</div>
                    ))}
                  </div>
                  <div style={{ background: "#0f172a", padding: 8, borderRadius: 6, fontSize: 8 }}>
                    <strong>Scale Metric:</strong> Deployed internally to **all Facebook employees** for seamless meeting room laptop companion presentations.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: STANDALONE TOUCH SCREEN HARDWARE PLATFORM */}
          {webrtcSubTab === "hardware" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 800 }}>🎛️ Standalone touch screen device: Chromium meeting controller</span>
                  <button onClick={clearWhiteboard} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: 8, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}>Clear Board</button>
                </div>

                {/* Touch screen device frame mockup */}
                <div style={{ background: "#1e293b", border: "4px solid #334155", borderRadius: 12, padding: 10, height: 260, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 8, color: "#64748b", margin: "0 0 4px 0" }}>Kiosk Mode Chromium Standalone Device Screen</div>
                  
                  {/* Drawing Whiteboard Canvas */}
                  <div style={{ flex: 1, background: "#090d16", borderRadius: 8, position: "relative", overflow: "hidden", cursor: "crosshair" }}>
                    <svg
                      width="100%"
                      height="100%"
                      onMouseDown={() => setIsDrawing(true)}
                      onMouseMove={handleWhiteboardDraw}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      style={{ display: "block" }}
                    >
                      {/* Grid background */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff03" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* User drawn lines */}
                      {whiteboardLines.map((pt, idx) => (
                        <circle key={idx} cx={pt.x} cy={pt.y} r="2.5" fill={AM.amazonOrange} />
                      ))}

                      {whiteboardLines.length === 0 && (
                        <text x="50%" y="50%" textAnchor="middle" fill="#334155" fontSize="10">
                          Click & Drag inside to draw Whiteboard notes...
                        </text>
                      )}
                    </svg>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontSize: 7.5, color: AM.textMuted }}>
                    <span>React + Redux drawing coordinates</span>
                    <span>Touch events mapping: ACTIVE</span>
                  </div>
                </div>

                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, fontSize: 8.5, marginTop: 8 }}>
                  <strong>Standalone device constraints:</strong><br />
                  Touch devices running standalone Chromium kiosks require strict touch-to-mouse mapping wrappers to prevent double-tap latency delays (300ms click delay). Whiteboard structures are stored in central Redux states to support instant sync across remote attendees.
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>TOUCH INTERACTION TELEMETRY</div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, height: 410, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: 8, overflowY: "auto", fontFamily: AM.mono, fontSize: 8 }}>
                    <div>[Touch] Listener mounted on canvas element.</div>
                    {whiteboardLines.slice(-6).map((pt, i) => (
                      <div key={i} style={{ color: AM.amazonGold }}>{`[Redux] State dispatch: addPoint({ x: ${pt.x}, y: ${pt.y} })`}</div>
                    ))}
                  </div>
                  <div style={{ background: "#0f172a", padding: 8, borderRadius: 6, fontSize: 8 }}>
                    <strong>Hardware Architecture:</strong> Custom meeting room displays run kiosk Chromium. Redux maps whiteboard coordinates across WebRTC data channels.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WebRTC Renegotiation Code */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginTop: 14 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "#f1f5f9", display: "block", marginBottom: 8 }}>WebRTC Media Negotiation & Track Management</span>
            <pre style={{ margin: 0, padding: 12, background: "#0f172a", color: "#94a3b8", borderRadius: 6, fontFamily: AM.mono, fontSize: 9.5, overflowX: "auto" }}>{
`// Client SDP Offer renegotiation block for adding Screen Share track
// Works across Chrome, Firefox, Safari and Mobile React Native clients

async function startScreenShareNegotiation(
  peerConnection: RTCPeerConnection,
  screenStream: MediaStream
) {
  const screenTrack = screenStream.getVideoTracks()[0];
  
  // 1. Add track to active WebRTC connection
  const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
  if (sender) {
    // Replace existing camera video track with screen track dynamically
    await sender.replaceTrack(screenTrack);
  } else {
    peerConnection.addTrack(screenTrack, screenStream);
  }

  // 2. Trigger negotiationneeded event (SDP Renegotiation)
  // Handles track modifications inside Group Calls and Rooms automatically
  const offer = await peerConnection.createOffer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: true
  });
  
  await peerConnection.setLocalDescription(offer);
  
  // Send local SDP session description details through GraphQL signaling subscription
  sendSignalingMessage({
    type: 'SDP_OFFER',
    sdp: offer.sdp
  });
}`
            }</pre>
          </div>
        </div>
      )}

      {/* ── ENGINEERING STORY ── */}
      {activeTab === "story" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Why these three projects matter together</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
              At first glance, these three projects look unrelated. But they reflect three distinct types of engineering contribution
              that together make you a complete senior engineer:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
              {[
                { title: "🚀 Deploy Interface", type: "Internal Tooling", value: "Developer multiplier. You built something that made every engineer who ships backend code faster and safer. The impact compounds across hundreds of engineers.", color: "#6366f1" },
                { title: "🔄 Type Generator",   type: "Developer Infrastructure", value: "Platform work. You solved a class of bugs (type mismatches between backend and frontend) permanently, at the source. No more manual sync, no more drift.", color: "#10b981" },
                { title: "🖼 Profile Picture", type: "User-facing Product", value: "Product impact. You shipped a feature that hundreds of millions of users interact with. You understand the product side, not just the platform side.", color: "#ec4899" },
              ].map(item => (
                <div key={item.title} style={{ background: "#0f172a", borderRadius: 8, padding: 14, borderTop: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>{item.type}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Facebook-specific engineering culture context</div>
              {[
                { icon: "🏗", label: "Hack + Flow",    detail: "Facebook's proprietary typed PHP (Hack) compiles to run on HHVM. FlowJS types the React frontend. The type generator bridges the two." },
                { icon: "📦", label: "Scale",          detail: "Everything at Facebook runs at a scale that breaks assumptions. The deploy interface handles services with hundreds of instances." },
                { icon: "🔄", label: "Move fast",      detail: "High deployment frequency is a culture value. Tools that make deploys frictionless directly enable this." },
                { icon: "🤝", label: "Eng quality",    detail: "Code quality gates at deploy time (type check, lint, canary analysis) prevent errors before they reach production." },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>How to talk about this in interview</div>
              {[
                "These three projects show breadth: I contributed to internal tooling, developer infrastructure, AND user-facing product — not just one area.",
                "The type generator is the most technically impressive — it is a form of compiler work (AST transformation, cross-language type mapping).",
                "The deploy interface shows I understood the engineering process end-to-end, not just the UI.",
                "The profile picture rewrite shows I can ship product that users interact with — and think about UX, performance, and the API boundary.",
              ].map((point, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                  <span style={{ color: "#6366f1", flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>{point}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacebookEngineeringDemo;
