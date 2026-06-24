/**
 * CoinbaseWalletDemo.tsx
 *
 * Senior Frontend Engineer — Coinbase Wallet & Smart Wallet
 * Focus: React Native Rewrite, Multi-Wallet Mnemonics, EIP-1193 Ethereum Provider Refactor, SDK & ERC-4337
 *
 * Achievements covered:
 *   1. Major UX flows during Wallet mobile React Native rewrite
 *   2. Multi-wallet & mnemonic support (BIP-39/BIP-44 key derivation) + performance telemetry
 *   3. Coinbase Smart Wallet & Ethereum provider refactor (EIP-1193 spec alignment)
 *   4. Partner SDK enablement & ERC-4337 Account Abstraction observability
 *
 * TABS:
 *   📱 RN Rewrite & UX   — Simulated React Native mnemonic backup screen, seed phrase checker, and native feedback
 *   🪙 Multi-Account      — BIP-44 key derivation path explorer and performance monitoring for multi-accounts
 *   🔑 Smart Wallet Spec — Ethereum Provider refactor code diff (custom SDK -> EIP-1193), signature validation
 *   📊 SDK & Telemetry   — Real-time $4B+ asset observability: provider init latency, txn success rates, ERC-4337 gas stats
 */

import React, { useState, useEffect, useRef } from "react";

// Style tokens (Coinbase Slate & Blue)
const CB = {
  bg: "#0A0C10",
  surface: "#111625",
  surface2: "#1B2236",
  border: "#263152",
  text: "#9EB6FF",
  textBright: "#FFFFFF",
  textMuted: "#53648E",
  coinbaseBlue: "#0052FF",
  cryptoGreen: "#05D386",
  cryptoYellow: "#FFB800",
  cryptoRed: "#FF3355",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface WalletAccount {
  index: number;
  address: string;
  balance: string;
  path: string;
  latencyMs: number;
}

const MNEMONIC_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", 
  "absorb", "abstract", "absurd", "abuse", "access", "accident"
];

const MOCK_ACCOUNTS: WalletAccount[] = [
  { index: 0, address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", balance: "1.452 ETH", path: "m/44'/60'/0'/0/0", latencyMs: 12 },
  { index: 1, address: "0x981C0deB8e0400b8440Ac454E18d42398D1dD01a", balance: "0.224 ETH", path: "m/44'/60'/0'/0/1", latencyMs: 14 },
  { index: 2, address: "0x1A25bcF624C03a3D2925b44c454e56fe43818eB9", balance: "8.010 ETH", path: "m/44'/60'/0'/0/2", latencyMs: 18 },
  { index: 3, address: "0x8E184d0D3B0f17b8c2d2B3D01264A312eB956fe4", balance: "0.000 ETH", path: "m/44'/60'/0'/0/3", latencyMs: 25 },
];

export function CoinbaseWalletDemo() {
  const [tab, setTab] = useState<"rewrite" | "multi" | "smart" | "telemetry">("rewrite");

  // ── RN Rewrite & UX States ──
  const [seedVisible, setSeedVisible] = useState(false);
  const [enteredMnemonic, setEnteredMnemonic] = useState<string[]>(Array(12).fill(""));
  const [verifySuccess, setVerifySuccess] = useState<boolean | null>(null);

  const fillMnemonicMock = () => {
    setEnteredMnemonic([...MNEMONIC_WORDS]);
  };

  const checkMnemonic = () => {
    const isCorrect = enteredMnemonic.every((w, i) => w.trim().toLowerCase() === MNEMONIC_WORDS[i]);
    setVerifySuccess(isCorrect);
  };

  const clearMnemonic = () => {
    setEnteredMnemonic(Array(12).fill(""));
    setVerifySuccess(null);
  };

  // ── Multi-Account States ──
  const [accounts, setAccounts] = useState<WalletAccount[]>(MOCK_ACCOUNTS);
  const [deriving, setDeriving] = useState(false);

  const deriveNextAccount = () => {
    if (deriving) return;
    setDeriving(true);
    setTimeout(() => {
      const newIndex = accounts.length;
      const randomAddr = "0x" + Array.from({length: 40}, () => "0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
      const newAcc: WalletAccount = {
        index: newIndex,
        address: randomAddr,
        balance: (Math.random() * 2).toFixed(3) + " ETH",
        path: `m/44'/60'/0'/0/${newIndex}`,
        latencyMs: Math.floor(Math.random() * 20) + 10,
      };
      setAccounts([...accounts, newAcc]);
      setDeriving(false);
    }, 800);
  };

  // ── Smart Wallet States ──
  const [customSpec, setCustomSpec] = useState<"legacy" | "eip1193">("eip1193");

  // ── Telemetry States ──
  const [observabilityPeriod, setObservabilityPeriod] = useState<"live" | "stress">("live");

  return (
    <div style={{ background: CB.bg, color: CB.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${CB.coinbaseBlue}, ${CB.surface2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: CB.textBright, letterSpacing: "-0.02em" }}>Coinbase Wallet — Senior Frontend Engineer</h1>
            <p style={{ margin: 0, fontSize: 11, color: CB.textMuted }}>$4B+ Assets Under Custody · React Native Rewrite · BIP-44 Mnemonics · Smart Wallet (EIP-1193 & ERC-4337)</p>
          </div>
        </div>

        {/* Global Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "$4B+ Assets", l: "Under Custody", c: CB.coinbaseBlue, sub: "Rigorous security parameters" },
            { v: "< 15ms", l: "Multi-Account Derivation", c: CB.cryptoGreen, sub: "BIP-44 optimized thread loops" },
            { v: "EIP-1193 Standard", l: "Ethereum Provider Refactor", c: CB.cryptoYellow, sub: "100% spec-aligned SDK wrapper" },
            { v: "ERC-4337 Ready", l: "Coinbase Smart Wallet", c: CB.textBright, sub: "Zero-gas bundler hooks" },
          ].map(m => (
            <div key={m.l} style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: CB.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: CB.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${CB.border}`, paddingBottom: 4 }}>
        {[
          { id: "rewrite" as const, label: "📱 RN Rewrite & UX" },
          { id: "multi" as const, label: "🪙 Multi-Wallet Derivation" },
          { id: "smart" as const, label: "🔑 Smart Wallet Spec" },
          { id: "telemetry" as const, label: "📊 SDK Observability" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? CB.surface2 : "transparent", color: tab === tb.id ? CB.textBright : CB.textMuted, border: tab === tb.id ? `1px solid ${CB.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── RN REWRITE & UX ── */}
      {tab === "rewrite" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Seed phrase validation module */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>MNEMONIC VERIFICATION FLOW (React Native Sim)</div>
            
            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: CB.textBright }}>Security Setup: 12-Word Recovery Phrase</span>
                <button onClick={() => setSeedVisible(!seedVisible)} style={{ background: `${CB.coinbaseBlue}20`, border: `1px solid ${CB.coinbaseBlue}`, color: CB.textBright, fontSize: 8.5, borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}>
                  {seedVisible ? "Hide Phrase" : "Show Mock Seed"}
                </button>
              </div>

              {/* Mock Seed Display */}
              {seedVisible && (
                <div style={{ background: "#07090F", border: `1px solid ${CB.border}`, borderRadius: 8, padding: 10, marginBottom: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                  {MNEMONIC_WORDS.map((word, idx) => (
                    <div key={idx} style={{ background: CB.surface2, padding: "4px 6px", borderRadius: 4, fontSize: 9.5, display: "flex", gap: 4 }}>
                      <span style={{ color: CB.textMuted }}>{idx + 1}.</span>
                      <span style={{ color: CB.textBright, fontFamily: CB.mono }}>{word}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Verify Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
                {enteredMnemonic.map((val, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 8, color: CB.textMuted }}>Word #{idx + 1}</span>
                    <input value={val} onChange={e => {
                      const next = [...enteredMnemonic];
                      next[idx] = e.target.value;
                      setEnteredMnemonic(next);
                    }} placeholder="..." style={{ background: "#07090F", border: `1px solid ${CB.border}`, borderRadius: 5, padding: "5px 8px", fontSize: 9, color: CB.textBright, outline: "none", fontFamily: CB.mono }} />
                  </div>
                ))}
              </div>

              {/* Verify Actions */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button onClick={checkMnemonic} style={{ flex: 2, background: CB.coinbaseBlue, color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}>Verify Seed Phrase</button>
                <button onClick={fillMnemonicMock} style={{ flex: 1.2, background: CB.surface2, color: CB.text, border: `1px solid ${CB.border}`, borderRadius: 6, padding: "8px 0", fontSize: 9, cursor: "pointer" }}>Autofill Correct</button>
                <button onClick={clearMnemonic} style={{ flex: 0.8, background: "transparent", color: CB.cryptoRed, border: `1px solid ${CB.cryptoRed}40`, borderRadius: 6, padding: "8px 0", fontSize: 9, cursor: "pointer" }}>Clear</button>
              </div>

              {/* Feedback box */}
              {verifySuccess !== null && (
                <div style={{ background: verifySuccess ? `${CB.cryptoGreen}15` : `${CB.cryptoRed}15`, border: `1px solid ${verifySuccess ? CB.cryptoGreen : CB.cryptoRed}`, borderRadius: 8, padding: "8px 12px", fontSize: 9.5, color: verifySuccess ? CB.cryptoGreen : CB.cryptoRed, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{verifySuccess ? "✔ Seed phrase verified successfully! Device key store written." : "❌ Seed phrase mismatch. Please double check inputs."}</span>
                </div>
              )}
            </div>

            {/* Architectural note */}
            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: CB.textMuted, marginBottom: 6, textTransform: "uppercase" }}>React Native Mobile Rewrite Highlights</div>
              {[
                { topic: "Secure Storage Architecture", desc: "Leveraged Android KeyStore and iOS Keychain services using native bridges, keeping private keys encrypted at rest under hardware-backed security." },
                { topic: "Fluid Frame Transitions", desc: "Optimized RN bundle loads to keep JS thread execution under 8ms during screen mounts, avoiding UI skips during backup steps." },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: "6px 8px", borderRadius: 6, background: CB.surface2, marginBottom: 4, fontSize: 8.5 }}>
                  <strong style={{ color: CB.coinbaseBlue }}>{item.topic}: </strong>
                  <span style={{ color: CB.text }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={CB.coinbaseBlue} label="Mnemonic generation & secure keychain store bridge" code={
`// React Native Keychain Bridge for seed phrase storage (BIP-39 mnemonic)
// Secure hardware-backed storage for iOS and Android

import * as Keychain from 'react-native-keychain';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';

interface KeychainOptions {
  service: string;
  accessControl: Keychain.ACCESS_CONTROL;
  accessible: Keychain.ACCESSIBLE;
}

export async function createAndStoreWallet(walletIndex: number): Promise<string> {
  // 1. Generate secure 12-word mnemonic (BIP-39)
  const mnemonic = generateMnemonic(128); // 12 words

  // 2. Derive base seed synchronously
  const seed = mnemonicToSeedSync(mnemonic);

  // 3. Define hardware-backed security options
  const options: KeychainOptions = {
    service: \`com.coinbase.wallet.seed.index_\${walletIndex}\`,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // Do not sync to iCloud backup
  };

  try {
    // 4. Save to keychain via native bridges
    await Keychain.setGenericPassword(
      'coinbase_wallet_owner',
      mnemonic,
      options
    );
    console.log(\`[Success] Mnemonic safely stored in Hardware Secure Enclave for wallet index \${walletIndex}.\`);
    return mnemonic;
  } catch (error) {
    console.error("Secure keychain storage failed:", error);
    throw new Error("Failed to write to system keychain.");
  }
}

// Observability metrics:
// - Bridge invocation delay: 11ms
// - Key derivation: 4ms
// - Hardware write check: 100% success rate on clean boots`} />
          </div>
        </div>
      )}

      {/* ── MULTI-WALLET DERIVATION ── */}
      {tab === "multi" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* BIP-44 Derivation Path Simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>BIP-44 KEY DERIVATION SIMULATOR</div>

            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: CB.textBright, display: "block" }}>Derive Multiple Accounts</span>
                  <span style={{ fontSize: 7, color: CB.textMuted, display: "block", marginTop: 2 }}>Derivation Path standard: <code>m/44'/60'/0'/0/x</code> (Ethereum)</span>
                </div>
                <button onClick={deriveNextAccount} disabled={deriving} style={{ background: deriving ? "transparent" : CB.cryptoGreen, color: deriving ? CB.textMuted : "#000", border: deriving ? `1px solid ${CB.border}` : "none", borderRadius: 6, padding: "6px 12px", cursor: deriving ? "not-allowed" : "pointer", fontSize: 9, fontWeight: 700 }}>
                  {deriving ? "Deriving Key..." : "+ Derive Next Account"}
                </button>
              </div>

              {/* Accounts list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto", marginBottom: 12, paddingRight: 4 }}>
                {accounts.map(acc => (
                  <div key={acc.index} style={{ background: CB.surface2, border: `1px solid ${CB.border}`, padding: "6px 10px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, background: `${CB.coinbaseBlue}30`, color: CB.textBright, padding: "1px 4px", borderRadius: 3 }}>Acc #{acc.index}</span>
                        <span style={{ fontSize: 8, fontFamily: CB.mono, color: CB.text }}>{acc.address.slice(0, 10)}...{acc.address.slice(-8)}</span>
                      </div>
                      <div style={{ fontSize: 7.5, color: CB.textMuted, fontFamily: CB.mono, marginTop: 3 }}>Path: {acc.path}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: CB.cryptoGreen }}>{acc.balance}</div>
                      <div style={{ fontSize: 7, color: CB.textMuted, fontFamily: CB.mono, marginTop: 2 }}>Derivation latency: {acc.latencyMs}ms</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance graph */}
              <div style={{ background: "#07090F", borderRadius: 8, padding: 8, border: `1px solid ${CB.border}` }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: CB.textMuted, marginBottom: 4 }}>DERIVATION LATENCY VS ACCOUNT COUNT</div>
                <div style={{ height: 60, display: "flex", alignItems: "flex-end", gap: 6, padding: "4px 0" }}>
                  {accounts.map((acc, i) => {
                    const heightPercent = Math.min(100, (acc.latencyMs / 40) * 100);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: 6.5, color: CB.cryptoGreen, marginBottom: 2 }}>{acc.latencyMs}ms</span>
                        <div style={{ width: "100%", height: `${heightPercent}%`, background: CB.coinbaseBlue, borderRadius: "2px 2px 0 0" }} />
                        <span style={{ fontSize: 6.5, color: CB.textMuted, marginTop: 2 }}>a{i}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance optimization logic */}
            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: CB.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Derivation performance benchmarks</div>
              <ul style={{ margin: 0, paddingLeft: 12, fontSize: 8.5, color: CB.text, lineHeight: 1.5 }}>
                <li>Offloaded PBKDF2 hash loops (seed derivation) from the Main UI thread using a React Native background Worker thread.</li>
                <li>Pre-warmed the first 3 account keys on initial keychain unlock, reducing account switch delay to <strong style={{ color: CB.cryptoGreen }}>0ms</strong>.</li>
                <li>Implemented cached account balances to avoid redundant RPC lookups when toggling wallets.</li>
              </ul>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={CB.cryptoGreen} label="BIP-44 Multi-Account Derivation loop script" code={
`// Optimised key derivation path runner using ether/hdnode
// Offloaded to background loops to prevent UI frame drops

import { HDNode } from '@ethersproject/hdnode';

interface DerivedAccount {
  index: number;
  privateKey: string;
  publicKey: string;
  address: string;
}

export function deriveAccountsFromSeed(
  seedHex: string,
  startIndex: number,
  count: number
): DerivedAccount[] {
  const t0 = performance.now();
  
  // 1. Initialise master node from seed
  const masterNode = HDNode.fromSeed(Buffer.from(seedHex, 'hex'));
  const results: DerivedAccount[] = [];

  for (let i = 0; i < count; i++) {
    const accountIndex = startIndex + i;
    // Standard BIP-44 path: m/44'/60'/0'/0/x
    const derivationPath = \`m/44'/60'/0'/0/\${accountIndex}\`;
    
    // 2. Derive child node
    const childNode = masterNode.derivePath(derivationPath);

    results.push({
      index: accountIndex,
      privateKey: childNode.privateKey,
      publicKey: childNode.publicKey,
      address: childNode.address,
    });
  }

  const duration = performance.now() - t0;
  console.log(\`[Telemetry] Derived \${count} accounts in \${duration.toFixed(2)}ms\`);
  
  // Track latency per account index
  // Average: ~4.2ms per derivation node
  return results;
}`} />
          </div>
        </div>
      )}

      {/* ── SMART WALLET SPEC ── */}
      {tab === "smart" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* EIP spec alignment highlights */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ETHEREUM PROVIDER ALIGNMENT</div>

            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: CB.textBright }}>Provider Spec Alignment: Custom SDK vs EIP-1193</span>
                <div style={{ display: "flex", gap: 4, background: "#07090F", padding: 2, borderRadius: 6, border: `1px solid ${CB.border}` }}>
                  <button onClick={() => setCustomSpec("legacy")} style={{ background: customSpec === "legacy" ? CB.surface : "transparent", border: "none", cursor: "pointer", color: customSpec === "legacy" ? CB.textBright : CB.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Custom legacy</button>
                  <button onClick={() => setCustomSpec("eip1193")} style={{ background: customSpec === "eip1193" ? CB.surface : "transparent", border: "none", cursor: "pointer", color: customSpec === "eip1193" ? CB.coinbaseBlue : CB.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>EIP-1193 Spec</button>
                </div>
              </div>

              {customSpec === "legacy" ? (
                <div style={{ background: "#07090F", border: `1px solid ${CB.border}`, borderRadius: 8, padding: 10, fontSize: 8.5 }}>
                  <div style={{ color: CB.cryptoRed, fontWeight: 700, marginBottom: 4 }}>Legacy Provider Wrapper Problems:</div>
                  <ul style={{ margin: 0, paddingLeft: 12, color: CB.textMuted, lineHeight: 1.5 }}>
                    <li>Method calls were custom: <code>{`coinbaseProvider.sendRequest(action, params)`}</code> instead of <code>{`request({ method, params })`}</code>.</li>
                    <li>Forced integration code drift for popular libraries like Ethers.js and viem.</li>
                    <li>Event handling was non-standard: <code>{`on('accountsChanged')`}</code> did not align with spec signatures.</li>
                  </ul>
                </div>
              ) : (
                <div style={{ background: "#07090F", border: `1px solid ${CB.border}`, borderRadius: 8, padding: 10, fontSize: 8.5 }}>
                  <div style={{ color: CB.coinbaseBlue, fontWeight: 700, marginBottom: 4 }}>EIP-1193 Specification Alignment:</div>
                  <ul style={{ margin: 0, paddingLeft: 12, color: CB.text, lineHeight: 1.5 }}>
                    <li>Uses standard: <code>{`provider.request({ method: 'eth_requestAccounts' })`}</code> natively.</li>
                    <li>Seamless compatibility with viem, ethers, wagmi, web3.js out-of-the-box.</li>
                    <li>Clean event emitter mapping: <code>accountsChanged</code>, <code>chainChanged</code>, <code>connect</code>, <code>disconnect</code>.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Smart Wallet & ERC-4337 Highlights */}
            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: CB.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Smart Wallet & Account Abstraction highlights</div>
              {[
                { title: "ERC-4337 UserOperation validation", desc: "Designed provider wrapper to send UserOperations to ERC-4337 bundlers, abstracting away gas fee payments for Dapp end-users." },
                { title: "EIP-1271 Smart Contract Signatures", desc: "Created validation scripts validating signature outputs against smart contract wallets via EIP-1271 standards." },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: "6px 8px", borderRadius: 6, background: CB.surface2, marginBottom: 4, fontSize: 8.5 }}>
                  <strong style={{ color: CB.cryptoYellow }}>{item.title}: </strong>
                  <span style={{ color: CB.text }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={CB.cryptoYellow} label="EIP-1193 spec Ethereum Provider compliance bridge" code={
`// EIP-1193 compliant Ethereum Provider class
// Bridges Smart Wallet Web SDK with standard library specifications

interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

export class CoinbaseEthereumProvider {
  private eventsMap = new Map<string, Function[]>();

  // EIP-1193 core request interface
  public async request(args: RequestArguments): Promise<unknown> {
    const { method, params } = args;

    switch (method) {
      case 'eth_requestAccounts':
        return this.handleRequestAccounts();
      case 'eth_accounts':
        return this.getActiveAccounts();
      case 'eth_chainId':
        return this.getActiveChainId();
      case 'eth_sendTransaction':
        return this.handleSendTransaction(params);
      default:
        // Pass unhandled methods directly to the RPC endpoint
        return this.sendJsonRpc(method, params);
    }
  }

  // Event emitters compliance
  public on(event: 'accountsChanged' | 'chainChanged', listener: Function) {
    const listeners = this.eventsMap.get(event) || [];
    this.eventsMap.set(event, [...listeners, listener]);
  }

  private emit(event: string, data: unknown) {
    const listeners = this.eventsMap.get(event) || [];
    listeners.forEach(fn => fn(data));
  }

  private async handleRequestAccounts() {
    // Interactive wallet connection flow...
  }
}`} />
          </div>
        </div>
      )}

      {/* ── TELEMETRY & OBSERVABILITY ── */}
      {tab === "telemetry" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Live stats and graphs */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>$4B+ ASSETS OBSERVABILITY MONITOR</div>

            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: CB.textBright }}>SDK Observability Metrics</span>
                <div style={{ display: "flex", gap: 4, background: "#07090F", padding: 2, borderRadius: 6, border: `1px solid ${CB.border}` }}>
                  <button onClick={() => setObservabilityPeriod("live")} style={{ background: observabilityPeriod === "live" ? CB.surface : "transparent", border: "none", cursor: "pointer", color: observabilityPeriod === "live" ? CB.textBright : CB.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Standard Run</button>
                  <button onClick={() => setObservabilityPeriod("stress")} style={{ background: observabilityPeriod === "stress" ? CB.surface : "transparent", border: "none", cursor: "pointer", color: observabilityPeriod === "stress" ? CB.cryptoYellow : CB.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Network Stress</button>
                </div>
              </div>

              {/* Visual sliders/metrics */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Provider Initialisation Latency", val: "4.8ms", ratio: 0.12, c: CB.coinbaseBlue },
                  { label: "Sign Transaction Success Rate", val: "99.98%", ratio: 0.99, c: CB.cryptoGreen },
                  { label: "ERC-4337 Bundler gas savings", val: "-48.2%", ratio: 0.48, c: CB.cryptoYellow },
                  { label: "RPC Error Rate (Timeout limit)", val: observabilityPeriod === "stress" ? "0.82%" : "0.01%", ratio: observabilityPeriod === "stress" ? 0.82 : 0.01, c: CB.cryptoRed },
                ].map(item => (
                  <div key={item.label} style={{ background: CB.surface2, padding: "8px 12px", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
                      <span style={{ color: CB.textBright, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: item.c, fontWeight: 800 }}>{item.val}</span>
                    </div>
                    {/* Visual Bar */}
                    <div style={{ height: 6, background: "#07090F", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${item.ratio * 100}%`,
                        height: "100%",
                        background: item.c,
                        transition: "width 0.4s ease-in-out"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Third party partner upgrade tracker */}
            <div style={{ background: CB.surface, border: `1px solid ${CB.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: CB.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Third-party SDK migration status (100% target)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 6 }}>
                {[
                  { name: "Uniswap UI", status: "GA Migrated", color: CB.cryptoGreen },
                  { name: "Opensea Market", status: "GA Migrated", color: CB.cryptoGreen },
                  { name: "Aave Lending", status: "GA Migrated", color: CB.cryptoGreen },
                  { name: "Matcha DEX", status: "GA Migrated", color: CB.cryptoGreen },
                  { name: "MakerDAO", status: "Beta Test Phase", color: CB.cryptoYellow },
                  { name: "Compound", status: "GA Migrated", color: CB.cryptoGreen },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: CB.surface2, padding: 6, borderRadius: 5, fontSize: 8.5 }}>
                    <div style={{ fontWeight: 700, color: CB.textBright }}>{item.name}</div>
                    <div style={{ color: item.color, fontSize: 7, marginTop: 2 }}>● {item.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CB.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={CB.textBright} label="ERC-4337 UserOperation Gas & Bundler Observability Pipeline" code={
`// observability/user-operation-logger.ts
// Handles telemetry and monitoring for smart wallet user operations

import { sendStatsDMetric } from './telemetry-helper';

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export function logUserOperationLifecycle(
  userOp: UserOperation,
  bundlerUrl: string
) {
  const t0 = performance.now();

  return {
    trackSuccess: (txHash: string) => {
      const latency = performance.now() - t0;
      
      // 1. Report execution times
      sendStatsDMetric('smart_wallet.user_op.latency', latency);
      
      // 2. Report execution status
      sendStatsDMetric('smart_wallet.user_op.success', 1);

      // 3. Track gas ratios to measure optimization metrics
      const preVerGas = parseInt(userOp.preVerificationGas, 16);
      const callGas = parseInt(userOp.callGasLimit, 16);
      sendStatsDMetric('smart_wallet.gas.pre_verification', preVerGas);
      sendStatsDMetric('smart_wallet.gas.call_limit', callGas);

      console.log(\`[UserOp Success] Tx: \${txHash} executed in \${latency.toFixed(1)}ms\`);
    },
    
    trackError: (error: any) => {
      sendStatsDMetric('smart_wallet.user_op.failure', 1);
      sendStatsDMetric(\`smart_wallet.error.type.\${error.code || 'unknown'}\`, 1);
      
      console.error(\`[UserOp Failure] Reason: \${error.message || error}\`);
    }
  };
}`} />
          </div>
        </div>
      )}
    </div>
  );
}
