/**
 * E2EEncryptionDemo.tsx
 *
 * Interactive demo of End-to-End Encryption using the Web Crypto API.
 *
 * Cryptographic stack (all native browser APIs, zero dependencies):
 *   - ECDH  (P-256): Key exchange — Alice & Bob derive shared secret
 *   - AES-GCM 256:   Symmetric encryption of messages
 *   - ECDSA (P-256): Digital signatures — prove message authenticity
 *
 * Flow demonstrated:
 *   1. Alice generates ECDH + ECDSA key pairs
 *   2. Bob   generates ECDH + ECDSA key pairs
 *   3. Each derives a shared AES key from the other's public ECDH key
 *   4. Alice signs and encrypts a message → sends to Bob
 *   5. Bob decrypts and verifies Alice's signature
 *   6. Server NEVER sees plaintext or private keys
 *
 * Security properties shown:
 *   - Forward Secrecy  (ephemeral ECDH keys)
 *   - Authentication   (ECDSA signatures)
 *   - Integrity        (AES-GCM auth tag)
 *   - Confidentiality  (AES-GCM encryption)
 */

import React, { useState, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface KeyBundle {
  /** ECDH key pair — for key agreement (derive shared secret) */
  ecdhPair: CryptoKeyPair;
  /** ECDSA key pair — for signing messages (prove identity) */
  ecdsaPair: CryptoKeyPair;
  /** Exported public ECDH key as JSON — safe to share publicly */
  ecdhPublicJwk: JsonWebKey;
  /** Exported public ECDSA key as JSON — safe to share publicly */
  ecdsaPublicJwk: JsonWebKey;
}

interface EncryptedMessage {
  /** IV (Initialization Vector) — random 12 bytes, safe to send publicly */
  iv: string;
  /** AES-GCM encrypted ciphertext (base64) */
  ciphertext: string;
  /** ECDSA signature of the plaintext (base64) — proves sender identity */
  signature: string;
  /** Sender's ECDSA public key (JWK) — used to verify signature */
  senderPublicEcdsaJwk: JsonWebKey;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  sender: "Alice" | "Bob";
  plaintext: string;
  encrypted: EncryptedMessage;
  verified: boolean;
  decryptedBy: "Alice" | "Bob";
  timestamp: Date;
}

type DemoStep =
  | "idle"
  | "generating"
  | "keys-ready"
  | "encrypting"
  | "sending"
  | "decrypting"
  | "complete";

// ─────────────────────────────────────────────────────────────────
// Crypto Utilities — Web Crypto API wrappers
// ─────────────────────────────────────────────────────────────────

/** Convert ArrayBuffer to base64 string for display/transport */
function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/** Convert base64 string back to ArrayBuffer */
function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/** Convert string to ArrayBuffer (for encryption) */
function strToBuf(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

/** Convert ArrayBuffer to string (after decryption) */
function bufToStr(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

/**
 * Generate a complete key bundle for one party.
 * - ECDH key pair: used for key exchange (derive shared secret)
 * - ECDSA key pair: used for signing (prove identity)
 * Both use P-256 curve (NIST approved, widely supported)
 */
async function generateKeyBundle(): Promise<KeyBundle> {
  // ECDH: Elliptic Curve Diffie-Hellman for key agreement
  const ecdhPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,        // exportable (so we can share public key)
    ["deriveKey"] // usage: derive shared AES key
  );

  // ECDSA: Elliptic Curve Digital Signature Algorithm for auth
  const ecdsaPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  // Export public keys as JWK (JSON Web Key) — safe to share!
  // Private keys NEVER exported (stay in browser memory only)
  const ecdhPublicJwk = await crypto.subtle.exportKey("jwk", ecdhPair.publicKey);
  const ecdsaPublicJwk = await crypto.subtle.exportKey("jwk", ecdsaPair.publicKey);

  return { ecdhPair, ecdsaPair, ecdhPublicJwk, ecdsaPublicJwk };
}

/**
 * Derive shared AES-256-GCM key using ECDH.
 * Alice: deriveSharedKey(alicePrivate, bobPublic)
 * Bob:   deriveSharedKey(bobPrivate,   alicePublic)
 * → Both get the SAME AES key without ever transmitting it!
 */
async function deriveSharedKey(
  myPrivateEcdh: CryptoKey,
  theirPublicEcdhJwk: JsonWebKey
): Promise<CryptoKey> {
  // Import their public key from JWK format
  const theirPublicKey = await crypto.subtle.importKey(
    "jwk",
    theirPublicEcdhJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [] // public keys have no usage flags
  );

  // Derive the shared AES-256-GCM key
  // Math: sharedSecret = ECDH(myPrivate, theirPublic)
  // → Same result for both parties (commutative property of ECDH)
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateEcdh,
    { name: "AES-GCM", length: 256 },
    false,         // NOT exportable — stays in memory only
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a message and sign it.
 * Returns: { ciphertext, iv, signature, senderPublicEcdsaJwk }
 *
 * AES-GCM provides:
 *   - Confidentiality (nobody can read without the key)
 *   - Integrity (tampering = decryption failure)
 *   - Authenticity (GCM auth tag proves data wasn't modified)
 *
 * ECDSA signature provides:
 *   - Non-repudiation (proves WHO sent the message)
 */
async function encryptAndSign(
  plaintext: string,
  sharedAesKey: CryptoKey,
  senderEcdsaPrivate: CryptoKey,
  senderEcdsaPublicJwk: JsonWebKey
): Promise<EncryptedMessage> {
  // CRITICAL: Generate a NEW random IV for EVERY message!
  // Reusing IV with same key = catastrophic security failure
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt with AES-GCM 256
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedAesKey,
    strToBuf(plaintext)
  );

  // Sign the plaintext with sender's ECDSA private key
  // → Receiver can verify: only holder of private key could sign this!
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    senderEcdsaPrivate,
    strToBuf(plaintext)
  );

  return {
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
    signature: bufToBase64(signature),
    senderPublicEcdsaJwk: senderEcdsaPublicJwk,   // explicit: param name ≠ field name
    timestamp: Date.now(),
  };
}

/**
 * Decrypt and verify a received message.
 * Returns: { plaintext, verified }
 *
 * Verification steps:
 *   1. Decrypt ciphertext → plaintext (proves we have correct shared key)
 *   2. Verify ECDSA signature → confirms sender identity
 *      (only owner of the private key could have produced this signature)
 */
async function decryptAndVerify(
  encrypted: EncryptedMessage,
  sharedAesKey: CryptoKey
): Promise<{ plaintext: string; verified: boolean }> {
  // Step 1: Decrypt
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(encrypted.iv) },
    sharedAesKey,
    base64ToBuf(encrypted.ciphertext)
  );
  const plaintext = bufToStr(plaintextBuf);

  // Step 2: Import sender's ECDSA public key
  const senderEcdsaPublic = await crypto.subtle.importKey(
    "jwk",
    encrypted.senderPublicEcdsaJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );

  // Step 3: Verify signature against the decrypted plaintext
  const verified = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    senderEcdsaPublic,
    base64ToBuf(encrypted.signature),
    strToBuf(plaintext)
  );

  return { plaintext, verified };
}

// ─────────────────────────────────────────────────────────────────
// UI Helper Components
// ─────────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: "success" | "pending" | "error" | "info";
}) {
  const colors = {
    success: { bg: "#052e16", border: "#166534", text: "#4ade80" },
    pending: { bg: "#1c1917", border: "#44403c", text: "#fbbf24" },
    error:   { bg: "#450a0a", border: "#7f1d1d", text: "#fca5a5" },
    info:    { bg: "#0c1a2e", border: "#1e3a5f", text: "#7dd3fc" },
  }[status];

  return (
    <span
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "monospace",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function KeyDisplay({ label, jwk, color }: { label: string; jwk: JsonWebKey | null; color: string }) {
  const [show, setShow] = useState(false);
  if (!jwk) return null;

  // Show abbreviated key for display
  const keyStr = JSON.stringify(jwk, null, 2);
  const shortKey = jwk.x?.substring(0, 12) + "..." || "";

  return (
    <div
      style={{
        background: "#1e293b",
        border: `1px solid ${color}30`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ color, fontWeight: 700 }}>{label}</span>
        <button
          onClick={() => setShow(!show)}
          style={{
            background: "#334155",
            border: "none",
            color: "#94a3b8",
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: 10,
          }}
        >
          {show ? "Hide" : "Show JWK"}
        </button>
      </div>
      {!show && (
        <code style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>
          x: {shortKey}
        </code>
      )}
      {show && (
        <pre
          style={{
            color: "#94a3b8",
            fontFamily: "monospace",
            fontSize: 10,
            margin: 0,
            overflow: "auto",
            maxHeight: 140,
          }}
        >
          {keyStr}
        </pre>
      )}
    </div>
  );
}

function CiphertextDisplay({ label, data }: { label: string; data: string }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #ef444430",
        borderLeft: "3px solid #ef4444",
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <code
        style={{
          color: "#64748b",
          fontFamily: "monospace",
          fontSize: 10,
          wordBreak: "break-all",
          display: "block",
        }}
      >
        {data.substring(0, 80)}...
      </code>
    </div>
  );
}

function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              background:
                i < currentStep ? "#052e16"
                : i === currentStep ? "#1e3a5f"
                : "#1e293b",
              border: `1px solid ${
                i < currentStep ? "#166534"
                : i === currentStep ? "#1e40af"
                : "#334155"
              }`,
              color:
                i < currentStep ? "#4ade80"
                : i === currentStep ? "#7dd3fc"
                : "#475569",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: i === currentStep ? 700 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {i < currentStep ? "✓ " : ""}{step}
          </div>
          {i < steps.length - 1 && (
            <span style={{ color: "#334155", fontSize: 12 }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────

export function E2EEncryptionDemo() {
  // Key bundles for each party
  const [aliceKeys, setAliceKeys] = useState<KeyBundle | null>(null);
  const [bobKeys, setBobKeys] = useState<KeyBundle | null>(null);
  const [aliceSharedKey, setAliceSharedKey] = useState<CryptoKey | null>(null);
  const [bobSharedKey, setBobSharedKey] = useState<CryptoKey | null>(null);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // In-flight encrypted message (simulates "in transit")
  const [inTransit, setInTransit] = useState<EncryptedMessage | null>(null);

  // UI state
  const [step, setStep] = useState<DemoStep>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [currentSender, setCurrentSender] = useState<"Alice" | "Bob">("Alice");
  const [inputText, setInputText] = useState("Hello Bob! This message is end-to-end encrypted. 🔐");
  const [log, setLog] = useState<Array<{ msg: string; type: "info" | "success" | "warn" | "error" }>>([]);
  const [activeTab, setActiveTab] = useState<"demo" | "theory" | "api">("demo");

  const addLog = useCallback((msg: string, type: "info" | "success" | "warn" | "error" = "info") => {
    setLog(prev => [...prev.slice(-20), { msg, type }]);
  }, []);

  // ── Step 1: Generate keys for both parties ──────────────────────
  const handleGenerateKeys = useCallback(async () => {
    setStep("generating");
    setLog([]);
    addLog("Generating ECDH + ECDSA key pairs for Alice...", "info");

    try {
      const alice = await generateKeyBundle();
      addLog("✓ Alice: ECDH P-256 key pair generated", "success");
      addLog("✓ Alice: ECDSA P-256 key pair generated", "success");
      setAliceKeys(alice);

      addLog("Generating ECDH + ECDSA key pairs for Bob...", "info");
      const bob = await generateKeyBundle();
      addLog("✓ Bob: ECDH P-256 key pair generated", "success");
      addLog("✓ Bob: ECDSA P-256 key pair generated", "success");
      setBobKeys(bob);

      addLog("Exchanging public ECDH keys (safe to send over network)...", "info");

      // Key derivation: both parties derive the SAME shared key
      // Without ever transmitting the key itself (Diffie-Hellman magic!)
      const aliceShared = await deriveSharedKey(
        alice.ecdhPair.privateKey,
        bob.ecdhPublicJwk   // Alice uses Bob's public key
      );
      const bobShared = await deriveSharedKey(
        bob.ecdhPair.privateKey,
        alice.ecdhPublicJwk  // Bob uses Alice's public key
      );

      setAliceSharedKey(aliceShared);
      setBobSharedKey(bobShared);

      addLog("✓ Alice derived shared AES-256-GCM key (from Bob's public ECDH key)", "success");
      addLog("✓ Bob   derived shared AES-256-GCM key (from Alice's public ECDH key)", "success");
      addLog("🔑 Both have the SAME AES key — server never saw it!", "success");

      setStep("keys-ready");
      setStepIndex(1);
    } catch (err) {
      addLog(`❌ Error: ${err}`, "error");
      setStep("idle");
    }
  }, [addLog]);

  // ── Step 2: Encrypt and send a message ──────────────────────────
  const handleEncryptAndSend = useCallback(async () => {
    if (!aliceKeys || !bobKeys || !aliceSharedKey || !bobSharedKey) return;
    if (!inputText.trim()) return;

    const sender = currentSender;
    const senderKeys = sender === "Alice" ? aliceKeys : bobKeys;
    const senderSharedKey = sender === "Alice" ? aliceSharedKey : bobSharedKey;

    setStep("encrypting");
    addLog(`${sender} composing: "${inputText}"`, "info");
    addLog(`${sender} generating random 12-byte IV...`, "info");
    addLog(`${sender} signing message with ECDSA private key...`, "info");

    try {
      const encrypted = await encryptAndSign(
        inputText,
        senderSharedKey,
        senderKeys.ecdsaPair.privateKey,
        senderKeys.ecdsaPublicJwk
      );

      addLog(`✓ Plaintext encrypted with AES-256-GCM`, "success");
      addLog(`✓ Message signed with ECDSA (SHA-256)`, "success");
      addLog(`📡 Sending encrypted message over network...`, "info");
      addLog(`⚠️  Server sees: { iv, ciphertext, signature } — ALL opaque bytes!`, "warn");

      setInTransit(encrypted);
      setStep("sending");
      setStepIndex(2);

      // Simulate network delay
      await new Promise(r => setTimeout(r, 800));

      // ── Step 3: Receiver decrypts ──────────────────────────────
      const receiver = sender === "Alice" ? "Bob" : "Alice";
      const receiverSharedKey = receiver === "Alice" ? aliceSharedKey : bobSharedKey;

      setStep("decrypting");
      addLog(`${receiver} received encrypted message`, "info");
      addLog(`${receiver} decrypting with shared AES key...`, "info");

      const { plaintext, verified } = await decryptAndVerify(encrypted, receiverSharedKey);

      addLog(`✓ Decryption successful`, "success");
      addLog(
        verified
          ? `✓ Signature VERIFIED — message from ${sender} ✅`
          : `❌ Signature INVALID — possible MitM attack!`,
        verified ? "success" : "error"
      );
      addLog(`${receiver} reads: "${plaintext}"`, "success");

      const chatMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        plaintext,
        encrypted,
        verified,
        decryptedBy: receiver,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, chatMsg]);
      setInTransit(null);
      setStep("complete");
      setStepIndex(3);
      setInputText("");

      // Toggle sender for next message
      setCurrentSender(receiver);
    } catch (err) {
      addLog(`❌ Decryption failed (tampered data?): ${err}`, "error");
      setStep("keys-ready");
      setInTransit(null);
    }
  }, [aliceKeys, bobKeys, aliceSharedKey, bobSharedKey, inputText, currentSender, addLog]);

  const handleReset = useCallback(() => {
    setAliceKeys(null);
    setBobKeys(null);
    setAliceSharedKey(null);
    setBobSharedKey(null);
    setMessages([]);
    setInTransit(null);
    setStep("idle");
    setStepIndex(0);
    setLog([]);
    setInputText("Hello Bob! This message is end-to-end encrypted. 🔐");
    setCurrentSender("Alice");
  }, []);

  const FLOW_STEPS = ["Generate Keys", "Exchange Public Keys", "Encrypt & Sign", "Decrypt & Verify"];

  return (
    <div
      style={{
        background: "#0f172a",
        color: "#f1f5f9",
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🔐</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>
              End-to-End Encryption Demo
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              ECDH Key Exchange + AES-GCM Encryption + ECDSA Signatures — Web Crypto API
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ECDH P-256", "AES-GCM 256", "ECDSA", "Forward Secrecy", "Zero Server Knowledge", "Web Crypto API"].map(tag => (
            <span key={tag} style={{
              background: "#1e293b", color: "#94a3b8",
              border: "1px solid #334155", borderRadius: 20,
              padding: "3px 10px", fontSize: 11,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "demo" as const, label: "🔐 Live Demo" },
          { id: "theory" as const, label: "📐 How It Works" },
          { id: "api" as const, label: "💻 Web Crypto API" },
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

      {/* ── TAB: Live Demo ── */}
      {activeTab === "demo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, maxWidth: 1000 }}>

          {/* Left: Main controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Flow steps */}
            <StepIndicator steps={FLOW_STEPS} currentStep={stepIndex} />

            {/* Step 1: Generate Keys */}
            <div style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                    Step 1: Generate Key Pairs
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    Each party generates ECDH + ECDSA key pairs
                  </div>
                </div>
                {aliceKeys && bobKeys ? <StatusBadge status="success" /> : <StatusBadge status="pending" />}
              </div>

              {!aliceKeys || !bobKeys ? (
                <button
                  onClick={handleGenerateKeys}
                  disabled={step === "generating"}
                  style={{
                    background: "#6366f1", color: "#fff", border: "none",
                    borderRadius: 8, padding: "10px 20px", cursor: "pointer",
                    fontSize: 14, fontWeight: 700, width: "100%",
                    opacity: step === "generating" ? 0.6 : 1,
                  }}
                >
                  {step === "generating" ? "⏳ Generating..." : "🔑 Generate Keys for Alice & Bob"}
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <KeyDisplay
                    label="Alice's Public ECDH Key (safe to share)"
                    jwk={aliceKeys.ecdhPublicJwk}
                    color="#a78bfa"
                  />
                  <KeyDisplay
                    label="Bob's Public ECDH Key (safe to share)"
                    jwk={bobKeys.ecdhPublicJwk}
                    color="#34d399"
                  />
                  <div style={{
                    background: "#052e16", border: "1px solid #166534",
                    borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#86efac",
                  }}>
                    🔑 Shared AES-256-GCM key derived via ECDH — server never transmitted it!
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Send Message */}
            {aliceKeys && bobKeys && aliceSharedKey && bobSharedKey && (
              <div style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                      Step 2: Encrypt & Send Message
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      Sender: <span style={{ color: currentSender === "Alice" ? "#a78bfa" : "#34d399", fontWeight: 700 }}>
                        {currentSender}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => setCurrentSender(s => s === "Alice" ? "Bob" : "Alice")}
                      style={{
                        background: "#334155", color: "#94a3b8", border: "none",
                        borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11,
                      }}
                    >
                      Switch Sender
                    </button>
                  </div>
                </div>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message to encrypt..."
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0f172a", color: "#f1f5f9",
                    border: "1px solid #334155", borderRadius: 8,
                    padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                    resize: "none", minHeight: 80, marginBottom: 10,
                  }}
                />
                <button
                  onClick={handleEncryptAndSend}
                  disabled={!inputText.trim() || step === "encrypting" || step === "sending" || step === "decrypting"}
                  style={{
                    background: "#0891b2", color: "#fff", border: "none",
                    borderRadius: 8, padding: "10px 20px", cursor: "pointer",
                    fontSize: 14, fontWeight: 700, width: "100%",
                    opacity: (!inputText.trim() || step === "encrypting" || step === "sending" || step === "decrypting") ? 0.5 : 1,
                  }}
                >
                  {step === "encrypting" ? "🔏 Encrypting + Signing..."
                   : step === "sending" ? "📡 Sending..."
                   : step === "decrypting" ? "🔓 Decrypting..."
                   : `🔐 Encrypt & Send as ${currentSender}`}
                </button>
              </div>
            )}

            {/* In-transit display */}
            {inTransit && (
              <div style={{
                background: "#1c1917", border: "1px solid #fbbf2430",
                borderRadius: 12, padding: 16,
              }}>
                <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  📡 Message in Transit — Server sees this (opaque bytes)
                </div>
                <CiphertextDisplay label="Ciphertext (AES-GCM encrypted)" data={inTransit.ciphertext} />
                <div style={{ marginTop: 8 }}>
                  <CiphertextDisplay label="ECDSA Signature" data={inTransit.signature} />
                </div>
                <div style={{ marginTop: 8, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
                  <span style={{ color: "#94a3b8" }}>IV (not secret, prevents replay attacks): </span>
                  <code style={{ color: "#7dd3fc", fontFamily: "monospace" }}>{inTransit.iv}</code>
                </div>
              </div>
            )}

            {/* Message history */}
            {messages.length > 0 && (
              <div style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 16 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  💬 Decrypted Chat ({messages.length} messages)
                </div>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: "flex", flexDirection: "column",
                    alignItems: msg.sender === "Alice" ? "flex-start" : "flex-end",
                    marginBottom: 12,
                  }}>
                    <div style={{
                      background: msg.sender === "Alice" ? "#312e81" : "#052e16",
                      border: `1px solid ${msg.sender === "Alice" ? "#4c1d95" : "#166534"}`,
                      borderRadius: 10, padding: "8px 14px", maxWidth: "85%",
                    }}>
                      <div style={{
                        color: msg.sender === "Alice" ? "#a78bfa" : "#4ade80",
                        fontSize: 11, fontWeight: 700, marginBottom: 4,
                      }}>
                        {msg.sender} → {msg.decryptedBy}
                      </div>
                      <div style={{ color: "#f1f5f9", fontSize: 14 }}>{msg.plaintext}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#475569" }}>
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                        {msg.verified
                          ? <span style={{ fontSize: 10, color: "#4ade80" }}>✓ Signature verified</span>
                          : <span style={{ fontSize: 10, color: "#ef4444" }}>✗ Signature invalid!</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reset */}
            {(aliceKeys && bobKeys || messages.length > 0) && (
              <button onClick={handleReset} style={{
                background: "transparent", color: "#ef4444",
                border: "1px solid #ef444440", borderRadius: 8,
                padding: "8px 16px", cursor: "pointer", fontSize: 13,
                fontWeight: 600, alignSelf: "flex-start",
              }}>
                ↺ Reset Demo
              </button>
            )}
          </div>

          {/* Right: Activity Log */}
          <div>
            <div style={{
              background: "#0f172a", borderRadius: 12,
              border: "1px solid #1e293b", overflow: "hidden",
              position: "sticky", top: 24,
            }}>
              <div style={{
                padding: "12px 16px", background: "#1e293b",
                color: "#94a3b8", fontSize: 13, fontWeight: 700,
              }}>
                🖥️ Crypto Operations Log
              </div>
              <div style={{
                padding: "12px 16px", minHeight: 200,
                maxHeight: 500, overflow: "auto",
              }}>
                {log.length === 0 && (
                  <div style={{ color: "#334155", fontSize: 12, textAlign: "center", padding: 20 }}>
                    Click "Generate Keys" to start
                  </div>
                )}
                {log.map((entry, i) => (
                  <div key={i} style={{
                    fontSize: 12, fontFamily: "monospace",
                    marginBottom: 4, lineHeight: 1.5,
                    color: entry.type === "success" ? "#4ade80"
                         : entry.type === "error" ? "#fca5a5"
                         : entry.type === "warn" ? "#fbbf24"
                         : "#94a3b8",
                  }}>
                    {entry.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Theory ── */}
      {activeTab === "theory" && (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "Why End-to-End Encryption?",
              color: "#6366f1",
              content: `Traditional encryption: Client → [HTTPS] → Server (decrypts) → Database
E2EE:              Client → [ECDH shared key] → Client (only!)

In traditional: Server CAN read all messages (even with HTTPS)
In E2EE: Server ONLY sees encrypted bytes — mathematically impossible to read!

Real examples: Signal, WhatsApp, iMessage
  → Even if server hacked → attacker only gets gibberish
  → Even if government subpoena → server has nothing to give`,
              icon: "🎯",
            },
            {
              title: "ECDH Key Exchange (Diffie-Hellman Magic)",
              color: "#0891b2",
              content: `Core insight: Two parties can derive the SAME secret WITHOUT transmitting it!

Alice has: private_A, public_A = private_A × G
Bob   has: private_B, public_B = private_B × G
(G = generator point on elliptic curve P-256)

Alice derives: shared = private_A × public_B = private_A × private_B × G
Bob   derives: shared = private_B × public_A = private_B × private_A × G
                         ↑ SAME RESULT! (commutative property of scalar multiplication)

Attacker sees: public_A and public_B (both sent over network)
Attacker needs: private_A × private_B
But to get that: must solve ECDLP (Elliptic Curve Discrete Log Problem)
= Computationally infeasible! (P-256: ~2^128 operations to break)`,
              icon: "🔄",
            },
            {
              title: "AES-GCM: Encryption + Integrity in One",
              color: "#10b981",
              content: `AES-GCM = AES (encryption) + GCM (Galois/Counter Mode authentication)

Encryption: Confidentiality → nobody reads without the key
Auth tag:   Integrity → any tampering = decryption failure!

Why this matters:
  Tampered ciphertext → crypto.subtle.decrypt() throws DOMException
  → Can't silently corrupt messages (unlike AES-CBC without HMAC)

IV (Initialization Vector):
  12 random bytes, new for EVERY message
  Not secret (included in transmitted data)
  Purpose: Ensure same plaintext → different ciphertext each time
  CRITICAL: Never reuse IV with same key!
  IV reuse → GCM auth completely broken → IV nonce collision attack`,
              icon: "🛡️",
            },
            {
              title: "ECDSA: Signatures Prove Identity",
              color: "#f59e0b",
              content: `Problem ECDH doesn't solve: "How do I know I'm talking to Bob, not an attacker?"
→ ECDH is vulnerable to Man-in-the-Middle if public keys aren't authenticated!

ECDSA solution:
  Alice signs plaintext with her ECDSA PRIVATE key
  Bob verifies signature with Alice's ECDSA PUBLIC key
  → Only Alice (holder of private key) could have created this signature!

Without ECDSA (ECDH only):
  Attacker intercepts Alice↔Bob connection
  Gives Alice: fake_Bob_public_key (attacker controls)
  Gives Bob:   fake_Alice_public_key (attacker controls)
  → Attacker decrypts ALL messages in the middle!

With ECDSA:
  Alice signs messages with long-term identity key (out-of-band verified)
  Bob checks: "Is this signature from Alice's known public key?" YES → safe!
  → MitM attack detected!`,
              icon: "✍️",
            },
            {
              title: "Forward Secrecy",
              color: "#ec4899",
              content: `Forward Secrecy: Past messages stay safe even if long-term key is compromised.

WITHOUT forward secrecy (RSA static key):
  Server stores encrypted messages
  Attacker compromises server's private key (later!)
  → Attacker decrypts ALL historical messages!

WITH forward secrecy (ephemeral ECDH):
  New ECDH key pair generated for each SESSION
  Session keys derived → messages encrypted → session over
  Ephemeral private keys DELETED after session
  
  Attacker compromises server later:
  → Gets public keys only (ephemeral private keys are gone!)
  → Cannot decrypt historical messages! 🎉

This demo uses ephemeral keys (new pair each "Generate Keys" click)
Real apps: New key pair per conversation session`,
              icon: "⏩",
            },
          ].map((section) => (
            <div
              key={section.title}
              style={{
                background: "#1e293b",
                border: `1px solid ${section.color}30`,
                borderLeft: `4px solid ${section.color}`,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <h3 style={{ margin: 0, color: section.color, fontSize: 15, fontWeight: 700 }}>
                  {section.title}
                </h3>
              </div>
              <pre style={{
                margin: 0, color: "#94a3b8", fontSize: 12,
                fontFamily: "'Inter', monospace", lineHeight: 1.7,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {section.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Web Crypto API ── */}
      {activeTab === "api" && (
        <div style={{ maxWidth: 780, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "1. Generate ECDH Key Pair",
              code: `// Each party generates their own key pair
const ecdhKeyPair = await crypto.subtle.generateKey(
  {
    name: "ECDH",
    namedCurve: "P-256",  // Also: "P-384", "P-521"
  },
  true,            // extractable: can export public key
  ["deriveKey"]    // usage: derive shared AES key
);
// ecdhKeyPair.publicKey  → safe to share with anyone
// ecdhKeyPair.privateKey → NEVER export, stays in browser`,
              color: "#6366f1",
            },
            {
              title: "2. Derive Shared AES Key (ECDH)",
              code: `// Alice: uses her private key + Bob's public key
// Bob:   uses his private key + Alice's public key
// → Both derive IDENTICAL AES key!

const sharedAesKey = await crypto.subtle.deriveKey(
  {
    name: "ECDH",
    public: otherPartyPublicKey,  // their CryptoKey object
  },
  myKeyPair.privateKey,           // my private CryptoKey
  {
    name: "AES-GCM",
    length: 256,         // 256-bit AES key
  },
  false,                // NOT exportable
  ["encrypt", "decrypt"]
);`,
              color: "#0891b2",
            },
            {
              title: "3. Encrypt with AES-GCM",
              code: `// CRITICAL: New random IV for EVERY message!
const iv = crypto.getRandomValues(new Uint8Array(12));

const ciphertext = await crypto.subtle.encrypt(
  {
    name: "AES-GCM",
    iv,              // 12-byte random nonce
    // tagLength: 128 (default) — auth tag appended to ciphertext
  },
  sharedAesKey,    // derived from ECDH
  new TextEncoder().encode(plaintext)  // ArrayBuffer input
);

// Transport: { iv: base64(iv), ciphertext: base64(ciphertext) }
// IV is NOT secret — include it in the message!`,
              color: "#10b981",
            },
            {
              title: "4. Decrypt with AES-GCM",
              code: `try {
  const plaintextBuf = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(message.iv),  // same IV from sender
    },
    sharedAesKey,
    base64ToArrayBuffer(message.ciphertext)
  );
  
  const plaintext = new TextDecoder().decode(plaintextBuf);
  console.log("Decrypted:", plaintext);

} catch (err) {
  // DOMException: OperationError
  // → Either wrong key OR tampered ciphertext
  // → AES-GCM auth tag mismatch = integrity violation!
  console.error("Decryption failed — possible tampering!", err);
}`,
              color: "#f59e0b",
            },
            {
              title: "5. Sign with ECDSA",
              code: `// Generate signing key pair (separate from ECDH!)
const ecdsaKeyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);

// Sign a message
const signature = await crypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  ecdsaKeyPair.privateKey,         // sign with PRIVATE key
  new TextEncoder().encode(message) // data to sign
);
// signature: ArrayBuffer (64 bytes for P-256)`,
              color: "#ec4899",
            },
            {
              title: "6. Verify ECDSA Signature",
              code: `// Import sender's public key from JWK (received from sender)
const senderPublicKey = await crypto.subtle.importKey(
  "jwk",
  senderPublicKeyJwk,  // JSON Web Key (safe to share)
  { name: "ECDSA", namedCurve: "P-256" },
  false,
  ["verify"]
);

// Verify signature
const isValid = await crypto.subtle.verify(
  { name: "ECDSA", hash: "SHA-256" },
  senderPublicKey,                  // verify with PUBLIC key
  signature,                        // ArrayBuffer from sender
  new TextEncoder().encode(message) // original message
);

if (!isValid) {
  // Signature invalid → possible MitM attack!
  throw new Error("Message authentication failed!");
}`,
              color: "#a78bfa",
            },
          ].map((section) => (
            <div
              key={section.title}
              style={{
                background: "#0f172a",
                border: `1px solid ${section.color}30`,
                borderLeft: `4px solid ${section.color}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div style={{
                padding: "10px 16px",
                background: "#1e293b",
                color: section.color,
                fontWeight: 700,
                fontSize: 13,
              }}>
                {section.title}
              </div>
              <pre style={{
                margin: 0,
                padding: "14px 16px",
                color: "#86efac",
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.7,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}>
                {section.code}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default E2EEncryptionDemo;
