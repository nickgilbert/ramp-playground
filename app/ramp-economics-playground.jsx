"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, CartesianGrid, ReferenceLine,
} from "recharts";

// ── Color System ─────────────────────────────────────────────
const C = {
  bg: "#0f1117", card: "#1a1d27", border: "#2a2e3d",
  accent: "#6366f1", accentLight: "#818cf8",
  green: "#22c55e", red: "#ef4444", orange: "#f59e0b",
  cyan: "#06b6d4", pink: "#ec4899", purple: "#a855f7",
  text: "#e2e8f0", muted: "#94a3b8", dim: "#64748b",
  trad: "#f59e0b", stellar: "#22c55e",
};

// ── Hard-Coded Constants ─────────────────────────────────────
const STELLAR_TX_FEE = 0.00001;
const STELLAR_SETTLE_SEC = 5;
const BANK_DEPOSIT_RATE = 0;
const CONFIDENCE_Z = 1.645;

// ── Defaults & Presets ───────────────────────────────────────
const DEFAULTS = {
  avgTicket: 25, monthlyVolume: 10000000, rebalFreq: 4,
  mxnVol: 12, rebalDuration: 48, cetesYield: 7,
  bankWireFee: 35, localWireFee: 0.25, dexSpread: 8,
};

const PRESETS = {
  volatile: {
    label: "Volatile Market",
    description: "Stress test: high MXN/USD volatility (25%) and extended rebalancing (72 hrs).",
    values: { mxnVol: 25, rebalDuration: 72 },
  },
  slowBanks: {
    label: "Slow Banks",
    description: "Extended wire processing (96 hrs) and higher wire fees ($50).",
    values: { rebalDuration: 96, bankWireFee: 50 },
  },
};

// ── Primitives ───────────────────────────────────────────────
function Slider({ label, value, onChange, min, max, step, unit, tip, color = C.accent }) {
  const pct = ((value - min) / (max - min)) * 100;
  const display =
    unit === "$" ? `$${value.toLocaleString(undefined, { minimumFractionDigits: step < 1 ? 2 : 0, maximumFractionDigits: step < 1 ? 2 : 0 })}` :
    unit === "%" ? `${value}%` :
    unit === "bps" ? `${value} bps` :
    unit === "hrs" ? `${value} hrs` :
    unit === "/mo" ? `${value}/mo` :
    `${value}${unit || ""}`;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <label style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", height: 5, appearance: "none", borderRadius: 3, outline: "none", cursor: "pointer",
          background: `linear-gradient(to right,${color} 0%,${color} ${pct}%,${C.border} ${pct}%,${C.border} 100%)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: C.dim, marginTop: 1 }}>
        <span>{unit === "$" ? `$${min.toLocaleString()}` : `${min}${unit === "bps" ? " bps" : unit === "%" ? "%" : unit === "/mo" ? "/mo" : unit === "hrs" ? " hrs" : ""}`}</span>
        <span>{unit === "$" ? `$${max.toLocaleString()}` : `${max}${unit === "bps" ? " bps" : unit === "%" ? "%" : unit === "/mo" ? "/mo" : unit === "hrs" ? " hrs" : ""}`}</span>
      </div>
      {tip && <div style={{ fontSize: 10.5, color: C.dim, marginTop: 2, lineHeight: 1.3 }}>{tip}</div>}
    </div>
  );
}

function Card({ title, children, accent, tag, tagColor }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18,
      borderTop: accent ? `3px solid ${accent}` : undefined }}>
      {(title || tag) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          {title && <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: C.text, letterSpacing: 0.2 }}>{title}</h3>}
          {tag && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: `${tagColor || C.accent}22`, color: tagColor || C.accent, textTransform: "uppercase", letterSpacing: 0.8 }}>{tag}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function Metric({ label, value, sub, color = C.text, large }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 0" }}>
      <div style={{ fontSize: large ? 26 : 20, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 9.5, color: C.dim, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function PresetBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 16px", fontSize: 12, fontWeight: active ? 700 : 500,
      color: active ? C.text : C.muted, background: active ? C.purple : "transparent",
      border: `1px solid ${active ? C.purple : C.border}`, borderRadius: 8, cursor: "pointer",
      transition: "all 0.15s", flex: 1 }}>{children}</button>
  );
}

// ── Gauge Component ──────────────────────────────────────────
function Gauge({ value, min, max, label, sub }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const gaugeColor = value >= 0 ? C.green : C.red;

  // Build gauge with CSS conic-gradient for reliable rendering
  const size = 240;
  const thickness = 22;
  const needleAngle = 180 + pct * 180; // 180° = left (min), 360° = right (max)

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size / 2 + 10, overflow: "hidden" }}>
        {/* Gauge arc background */}
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: `conic-gradient(from 180deg, ${C.red} 0deg, ${C.orange} 60deg, ${C.green} 180deg, ${C.border} 180deg, ${C.border} 360deg)`,
          mask: `radial-gradient(circle at center, transparent ${size / 2 - thickness - 2}px, black ${size / 2 - thickness}px, black ${size / 2 - 2}px, transparent ${size / 2}px)`,
          WebkitMask: `radial-gradient(circle at center, transparent ${size / 2 - thickness - 2}px, black ${size / 2 - thickness}px, black ${size / 2 - 2}px, transparent ${size / 2}px)`,
        }} />
        {/* Needle */}
        <div style={{
          position: "absolute", bottom: 10, left: size / 2, width: 3, height: size / 2 - thickness - 12,
          background: C.text, borderRadius: 2, transformOrigin: "bottom center",
          transform: `rotate(${needleAngle - 270}deg)`,
          boxShadow: "0 0 6px rgba(0,0,0,0.5)",
        }} />
        {/* Needle center dot */}
        <div style={{
          position: "absolute", bottom: 4, left: size / 2 - 6, width: 12, height: 12,
          borderRadius: "50%", background: C.text,
        }} />
        {/* Min label */}
        <div style={{ position: "absolute", bottom: 0, left: -4, fontSize: 10, color: C.dim, fontFamily: "monospace" }}>
          ${min}
        </div>
        {/* Max label */}
        <div style={{ position: "absolute", bottom: 0, right: -4, fontSize: 10, color: C.dim, fontFamily: "monospace" }}>
          ${max}
        </div>
      </div>
      {/* Value */}
      <div style={{ fontSize: 32, fontWeight: 800, color: gaugeColor, fontFamily: "monospace", marginTop: -2 }}>
        {value >= 0 ? "" : "-"}${Math.abs(value).toFixed(2)}
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.dim }}>{sub}</div>}
    </div>
  );
}

// ── Formatters ───────────────────────────────────────────────
const fmt = v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtD = v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = v => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : fmt(v);
const fmtPer100 = v => `$${v.toFixed(4)}`;
const ttStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11.5 };

// ── Main Component ───────────────────────────────────────────
export default function RampPlayground() {
  // Business Scale
  const [avgTicket, setAvgTicket] = useState(DEFAULTS.avgTicket);
  const [monthlyVolume, setMonthlyVolume] = useState(DEFAULTS.monthlyVolume);
  const [rebalFreq, setRebalFreq] = useState(DEFAULTS.rebalFreq);

  // Market Conditions
  const [mxnVol, setMxnVol] = useState(DEFAULTS.mxnVol);
  const [rebalDuration, setRebalDuration] = useState(DEFAULTS.rebalDuration);
  const [cetesYield, setCetesYield] = useState(DEFAULTS.cetesYield);

  // Fee Assumptions
  const [bankWireFee, setBankWireFee] = useState(DEFAULTS.bankWireFee);
  const [localWireFee, setLocalWireFee] = useState(DEFAULTS.localWireFee);
  const [dexSpread, setDexSpread] = useState(DEFAULTS.dexSpread);

  // Preset state
  const [activePreset, setActivePreset] = useState(null);

  // ── Preset logic ─────────────────────────────────────────
  const applyPreset = (key) => {
    if (activePreset === key) {
      setAvgTicket(DEFAULTS.avgTicket);
      setMonthlyVolume(DEFAULTS.monthlyVolume);
      setRebalFreq(DEFAULTS.rebalFreq);
      setMxnVol(DEFAULTS.mxnVol);
      setRebalDuration(DEFAULTS.rebalDuration);
      setCetesYield(DEFAULTS.cetesYield);
      setBankWireFee(DEFAULTS.bankWireFee);
      setLocalWireFee(DEFAULTS.localWireFee);
      setDexSpread(DEFAULTS.dexSpread);
      setActivePreset(null);
    } else {
      const preset = PRESETS[key];
      if (preset.values.mxnVol !== undefined) setMxnVol(preset.values.mxnVol);
      if (preset.values.rebalDuration !== undefined) setRebalDuration(preset.values.rebalDuration);
      if (preset.values.bankWireFee !== undefined) setBankWireFee(preset.values.bankWireFee);
      setActivePreset(key);
    }
  };

  // ── Calculation Engine ───────────────────────────────────
  const calc = useMemo(() => {
    const inventoryAmount = monthlyVolume / rebalFreq;
    const txCount = monthlyVolume / avgTicket;

    // ═══ TRADITIONAL PATH ═══
    const trad_directCosts = bankWireFee * rebalFreq;
    const trad_capitalCost = inventoryAmount * (cetesYield / 100) / 12;
    const durationYearFrac = rebalDuration / 8760;
    const trad_volRisk = inventoryAmount * (mxnVol / 100) * Math.sqrt(durationYearFrac) * CONFIDENCE_Z;
    const trad_total = trad_directCosts + trad_capitalCost + trad_volRisk;

    // ═══ STELLAR OPTIMIZED PATH ═══
    const stellar_directCosts = (dexSpread / 10000) * monthlyVolume + localWireFee * rebalFreq;
    const stellar_capitalGain = inventoryAmount * (cetesYield / 100) / 12;
    const stellar_capitalCost = -stellar_capitalGain;
    const stellar_volRisk = 0;
    const stellar_total = stellar_directCosts + stellar_capitalCost + stellar_volRisk;

    // ═══ NORMALIZE TO PER $100 ═══
    const norm = 100 / monthlyVolume;
    const trad_per100 = {
      opFees: trad_directCosts * norm,
      capitalCost: trad_capitalCost * norm,
      riskBuffer: trad_volRisk * norm,
      total: trad_total * norm,
    };
    const stellar_per100 = {
      opFees: stellar_directCosts * norm,
      capitalCost: stellar_capitalCost * norm,
      riskBuffer: stellar_volRisk * norm,
      total: stellar_total * norm,
    };

    // ═══ KPIs ═══
    const netSavings = trad_total - stellar_total;
    const netMarginPerTx = netSavings / txCount;
    const netMarginPct = (netMarginPerTx / avgTicket) * 100;
    const riskReductionPct = trad_volRisk > 0
      ? ((trad_volRisk - stellar_volRisk) / trad_volRisk) * 100
      : 100;

    // ═══ CHART DATA: Cost per $100 ═══
    const costPer100Data = [
      { category: "Operational Fees", traditional: trad_per100.opFees, stellar: stellar_per100.opFees },
      { category: "Capital Costs", traditional: trad_per100.capitalCost, stellar: stellar_per100.capitalCost },
      { category: "Risk Buffer", traditional: trad_per100.riskBuffer, stellar: stellar_per100.riskBuffer },
    ];

    // ═══ CHART DATA: Sensitivity (Duration → Required Fee %) ═══
    const sensitivityData = [];
    for (let dur = 1; dur <= 168; dur += 1) {
      const vTrad_direct = bankWireFee * rebalFreq;
      const vTrad_capital = inventoryAmount * (cetesYield / 100) / 12;
      const vTrad_risk = inventoryAmount * (mxnVol / 100) * Math.sqrt(dur / 8760) * CONFIDENCE_Z;
      const vTrad_total = vTrad_direct + vTrad_capital + vTrad_risk;
      const tradFee = (vTrad_total / monthlyVolume) * 100;

      const vStellar_total = stellar_directCosts + stellar_capitalCost;
      const stellarFee = (vStellar_total / monthlyVolume) * 100;

      sensitivityData.push({ duration: dur, traditional: tradFee, stellar: stellarFee });
    }

    return {
      inventoryAmount, txCount,
      trad: { directCosts: trad_directCosts, capitalCost: trad_capitalCost, volRisk: trad_volRisk, total: trad_total },
      stellar: { directCosts: stellar_directCosts, capitalCost: stellar_capitalCost, capitalGain: stellar_capitalGain, volRisk: stellar_volRisk, total: stellar_total },
      per100: { trad: trad_per100, stellar: stellar_per100 },
      netSavings, netMarginPerTx, netMarginPct, riskReductionPct,
      costPer100Data, sensitivityData,
    };
  }, [avgTicket, monthlyVolume, rebalFreq, mxnVol, rebalDuration, cetesYield, bankWireFee, localWireFee, dexSpread]);

  const gaugeMax = Math.max(10, Math.ceil(calc.netMarginPerTx * 1.5));
  const gaugeMin = Math.min(-5, Math.floor(calc.netMarginPerTx * 0.5));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding: "24px 20px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
          background:#fff;border:2px solid ${C.accent};cursor:pointer;margin-top:-5px;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width:14px;height:14px;border-radius:50%;
          background:#fff;border:2px solid ${C.accent};cursor:pointer;
        }
        *{box-sizing:border-box;}
      `}} />

      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            Stellar Ramp Economics Calculator
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: C.dim, maxWidth: 800, lineHeight: 1.5 }}>
            Compare the unit economics of <span style={{ color: C.trad, fontWeight: 600 }}>Traditional</span> cross-currency
            rebalancing (MXN → Bank → Wire → USDC) vs the <span style={{ color: C.stellar, fontWeight: 600 }}>Stellar-optimized</span> path
            with same-denomination rebalancing and atomic swaps (MXN → CETES:Stellar → DEX → USDC).
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20,
            borderTop: `3px solid ${C.green}`, textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Net Margin via Stellar</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", lineHeight: 1.2,
              color: calc.netSavings > 0 ? C.green : C.red }}>
              {calc.netSavings >= 0 ? "+" : ""}{fmtD(calc.netSavings)}
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>per month vs traditional model</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20,
            borderTop: `3px solid ${C.cyan}`, textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Risk Exposure Reduction</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", lineHeight: 1.2, color: C.cyan }}>
              {calc.riskReductionPct.toFixed(0)}%
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>VaR eliminated by atomic settlement</div>
          </div>
        </div>

        {/* ── Main Grid: Sidebar + Content ── */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18, alignItems: "start" }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Scenario Presets */}
            <Card title="Scenario Presets" accent={C.purple}>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <PresetBtn key={key} active={activePreset === key} onClick={() => applyPreset(key)}>
                    {preset.label}
                  </PresetBtn>
                ))}
              </div>
              {activePreset && (
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 8, lineHeight: 1.4 }}>
                  {PRESETS[activePreset].description}
                  <span style={{ color: C.purple, cursor: "pointer", marginLeft: 6, fontWeight: 600 }}
                    onClick={() => applyPreset(activePreset)}> Reset</span>
                </div>
              )}
            </Card>

            {/* Business Scale */}
            <Card title="Business Scale" accent={C.accent}>
              <Slider label="Avg Ticket Size" value={avgTicket} onChange={setAvgTicket}
                min={1} max={5000} step={1} unit="$" color={C.accent} />
              <Slider label="Monthly Volume" value={monthlyVolume} onChange={setMonthlyVolume}
                min={10000000} max={500000000} step={1000000} unit="$" color={C.accent} />
              <Slider label="Rebalancing Frequency" value={rebalFreq} onChange={setRebalFreq}
                min={1} max={30} step={1} unit="/mo" color={C.accent}
                tip="How often the ramp restocks inventory." />
              <div style={{ background: `${C.accent}11`, borderRadius: 8, padding: "8px 12px", marginTop: 4,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted }}>Derived Inventory</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: C.accentLight }}>
                  {fmtK(calc.inventoryAmount)}
                </span>
              </div>
            </Card>

            {/* Market Conditions */}
            <Card title="Market Conditions" accent={C.red}>
              <Slider label="MXN/USD Volatility (ann.)" value={mxnVol} onChange={setMxnVol}
                min={1} max={40} step={1} unit="%" color={C.red}
                tip="Annualized volatility of the MXN/USD pair." />
              <Slider label="Rebalancing Duration" value={rebalDuration} onChange={setRebalDuration}
                min={4} max={168} step={4} unit="hrs" color={C.red}
                tip="Time from wire initiation to funds received (Traditional)." />
              <Slider label="Local Yield (CETES)" value={cetesYield} onChange={setCetesYield}
                min={0} max={20} step={0.5} unit="%" color={C.stellar}
                tip="Annual interest on the MXN-CETES asset on Stellar." />
            </Card>

            {/* Fee Assumptions */}
            <Card title="Fee Assumptions" accent={C.dim}>
              <Slider label="Bank Wire Fee (int'l)" value={bankWireFee} onChange={setBankWireFee}
                min={5} max={100} step={5} unit="$" color={C.trad}
                tip="Cost per international wire for traditional rebalancing." />
              <Slider label="Local Wire Fee" value={localWireFee} onChange={setLocalWireFee}
                min={0.1} max={10} step={0.05} unit="$" color={C.stellar}
                tip="Cost per domestic wire for Stellar-optimized rebalancing." />
              <Slider label="DEX Swap Spread" value={dexSpread} onChange={setDexSpread}
                min={1} max={50} step={1} unit="bps" color={C.stellar}
                tip="Cost of swapping MXN-CETES for USDC on Stellar DEX." />
            </Card>

            {/* Constants Reference */}
            <Card title="Stellar Benchmarks">
              {[
                ["Stellar TX Fee", `$${STELLAR_TX_FEE}`],
                ["Settlement Time", `${STELLAR_SETTLE_SEC} seconds`],
                ["Bank Deposit Rate", `${BANK_DEPOSIT_RATE}%`],
                ["VaR Confidence", "95%"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0",
                  borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 11, color: C.dim }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "monospace", color: C.muted }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── RIGHT: Charts ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ═══ Chart 1: Total Cost per $100 ═══ */}
            <Card title="Total Cost per $100 Processed" accent={C.accent}
              tag="Grouped Comparison" tagColor={C.accent}>
              <p style={{ fontSize: 11.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                Breakdown of costs normalized to every $100 of transaction volume.
                Negative capital costs for Stellar represent <strong style={{ color: C.stellar }}>yield income</strong> from CETES inventory.
              </p>

              {/* Summary row above chart */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ background: `${C.trad}11`, borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${C.trad}22` }}>
                  <div style={{ fontSize: 9.5, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Traditional Total</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: C.trad }}>
                    {fmtPer100(calc.per100.trad.total)}
                  </div>
                  <div style={{ fontSize: 10, color: C.dim }}>per $100 processed</div>
                </div>
                <div style={{ background: `${C.stellar}11`, borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${C.stellar}22` }}>
                  <div style={{ fontSize: 9.5, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Stellar Total</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace",
                    color: calc.per100.stellar.total <= 0 ? C.green : C.stellar }}>
                    {calc.per100.stellar.total <= 0 ? "-" : ""}{fmtPer100(Math.abs(calc.per100.stellar.total))}
                  </div>
                  <div style={{ fontSize: 10, color: calc.per100.stellar.total <= 0 ? C.green : C.dim }}>
                    {calc.per100.stellar.total <= 0 ? "net profit per $100" : "per $100 processed"}
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={calc.costPer100Data} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="category" style={{ fontSize: 10.5 }} stroke={C.dim} />
                  <YAxis tickFormatter={v => `$${v.toFixed(3)}`} style={{ fontSize: 10 }} stroke={C.dim} domain={["auto", "auto"]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={C.dim} strokeWidth={1.5} />
                  <Bar dataKey="traditional" name="Traditional" fill={C.trad} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="stellar" name="Stellar" fill={C.stellar} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Breakdown Table */}
              <div style={{ marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 11 }}>Cost Category</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", color: C.trad, fontWeight: 700, fontSize: 11 }}>Traditional</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", color: C.stellar, fontWeight: 700, fontSize: 11 }}>Stellar</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 11 }}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Operational Fees", trad: calc.per100.trad.opFees, stellar: calc.per100.stellar.opFees,
                        tradDetail: `$${bankWireFee} wire x ${rebalFreq}/mo`, stellarDetail: `${dexSpread}bps spread + $${localWireFee} wire x ${rebalFreq}/mo` },
                      { label: "Capital Costs", trad: calc.per100.trad.capitalCost, stellar: calc.per100.stellar.capitalCost,
                        tradDetail: `${fmtK(calc.inventoryAmount)} idle @ 0% deposit`, stellarDetail: `${fmtK(calc.inventoryAmount)} earning ${cetesYield}% CETES` },
                      { label: "Risk Buffer (VaR)", trad: calc.per100.trad.riskBuffer, stellar: calc.per100.stellar.riskBuffer,
                        tradDetail: `${mxnVol}% vol x ${rebalDuration}hr duration`, stellarDetail: "Atomic swap — zero duration" },
                    ].map(row => {
                      const delta = row.stellar - row.trad;
                      return (
                        <tr key={row.label} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 10px" }}>
                            <div style={{ color: C.text, fontWeight: 500 }}>{row.label}</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "10px 10px", verticalAlign: "top" }}>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, color: C.trad }}>{fmtPer100(row.trad)}</div>
                            <div style={{ fontSize: 9.5, color: C.dim, marginTop: 2 }}>{row.tradDetail}</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "10px 10px", verticalAlign: "top" }}>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, color: row.stellar < 0 ? C.green : C.stellar }}>
                              {row.stellar < 0 ? "-" : ""}{fmtPer100(Math.abs(row.stellar))}
                            </div>
                            <div style={{ fontSize: 9.5, color: C.dim, marginTop: 2 }}>{row.stellarDetail}</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "10px 10px", verticalAlign: "top" }}>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, color: delta < 0 ? C.green : C.red }}>
                              {delta < 0 ? "" : "+"}{fmtPer100(delta)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr style={{ borderTop: `2px solid ${C.border}` }}>
                      <td style={{ padding: "10px 10px", fontWeight: 700, color: C.text }}>Total per $100</td>
                      <td style={{ textAlign: "right", padding: "10px 10px" }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: C.trad }}>{fmtPer100(calc.per100.trad.total)}</div>
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 10px" }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: calc.per100.stellar.total <= 0 ? C.green : C.stellar }}>
                          {calc.per100.stellar.total < 0 ? "-" : ""}{fmtPer100(Math.abs(calc.per100.stellar.total))}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 10px" }}>
                        {(() => { const d = calc.per100.stellar.total - calc.per100.trad.total; return (
                          <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: d < 0 ? C.green : C.red }}>
                            {d < 0 ? "" : "+"}{fmtPer100(d)}
                          </div>
                        ); })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ═══ Chart 2: Sensitivity Analysis ═══ */}
            <Card title="Sensitivity: Rebalancing Duration vs Required Fee" accent={C.red}
              tag="The Duration Fix" tagColor={C.cyan}>
              <p style={{ fontSize: 11.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                As traditional rebalancing takes longer, the FX risk buffer — and the minimum fee the ramp must charge — grows steeply.
                The <strong style={{ color: C.stellar }}>Stellar line stays flat</strong>: atomic settlement means duration is irrelevant to pricing.
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={calc.sensitivityData} margin={{ left: 10, right: 20, top: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="duration" tick={{ fontSize: 10 }} stroke={C.dim}
                    ticks={[1, 12, 24, 48, 72, 96, 120, 144, 168]} />
                  <YAxis tickFormatter={v => `${v.toFixed(2)}%`}
                    style={{ fontSize: 10 }} stroke={C.dim} domain={["auto", "auto"]} />
                  <Tooltip formatter={v => `${v.toFixed(4)}%`} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <ReferenceLine x={rebalDuration} stroke={C.trad} strokeDasharray="5 5" strokeWidth={2}
                    label={{ value: `Current: ${rebalDuration}hrs`, position: "top",
                      style: { fontSize: 10, fill: C.trad } }} />
                  <Line type="monotone" dataKey="traditional" name="Traditional" stroke={C.trad}
                    strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="stellar" name="Stellar" stroke={C.stellar}
                    strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center", fontSize: 10.5, color: C.dim, marginTop: 4 }}>
                Rebalancing Duration (hours)
              </div>
            </Card>

            {/* ═══ Chart 3: Profitability Threshold ═══ */}
            <Card title="Profitability Threshold" accent={C.green}
              tag="Net Margin" tagColor={C.green}>
              <p style={{ fontSize: 11.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                Even charging a <strong style={{ color: C.text }}>lower fee</strong> to the customer, a Stellar-optimized ramp is more profitable
                because it eliminates the risk buffer and earns yield on inventory.
              </p>
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
                <Gauge
                  value={calc.netMarginPerTx}
                  min={gaugeMin}
                  max={gaugeMax}
                  label="Net Margin per Transaction"
                  sub={`${calc.netMarginPct.toFixed(2)}% of avg ticket ($${avgTicket})`}
                />
              </div>
              {/* Breakdown below gauge */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                <div style={{ textAlign: "center", padding: 10, background: `${C.trad}11`, borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Trad. Cost/Mo</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", color: C.trad }}>{fmt(calc.trad.total)}</div>
                </div>
                <div style={{ textAlign: "center", padding: 10, background: `${C.stellar}11`, borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Stellar Cost/Mo</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace",
                    color: calc.stellar.total <= 0 ? C.green : C.stellar }}>
                    {calc.stellar.total <= 0 ? "-" : ""}{fmt(Math.abs(calc.stellar.total))}
                  </div>
                </div>
                <div style={{ textAlign: "center", padding: 10, background: `${C.green}11`, borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Monthly Savings</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", color: C.green }}>+{fmt(calc.netSavings)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", marginTop: 28, padding: "14px 0", borderTop: `1px solid ${C.border}`, fontSize: 10.5, color: C.dim }}>
          All figures are illustrative estimates. Adjust inputs to model your specific corridor.
          Traditional VaR uses 95% confidence (z = 1.645). Stellar settlement assumes ~5 second finality.
          CETES yield reflects Mexican government short-term rates.
        </div>
      </div>
    </div>
  );
}
