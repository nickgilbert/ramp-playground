import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, CartesianGrid, Area, AreaChart, ReferenceLine } from "recharts";

const C = {
  bg: "#0f1117", card: "#1a1d27", border: "#2a2e3d",
  accent: "#6366f1", accentLight: "#818cf8",
  green: "#22c55e", red: "#ef4444", orange: "#f59e0b",
  cyan: "#06b6d4", pink: "#ec4899", purple: "#a855f7",
  text: "#e2e8f0", muted: "#94a3b8", dim: "#64748b",
  trad: "#f59e0b", cetes: "#22c55e",
};

// ── Primitives ──────────────────────────────────────────────
function Slider({ label, value, onChange, min, max, step, unit, tip, color = C.accent }) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = unit === "$"
    ? `$${value.toLocaleString(undefined, { minimumFractionDigits: step < 1 ? 2 : 0, maximumFractionDigits: step < 0.01 ? 4 : step < 1 ? 2 : 0 })}`
    : unit === "%" ? `${value}%` : unit === "bps" ? `${value} bps` : unit === "hrs" ? `${value} hrs` : `${value}${unit || ""}`;
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
        <span>{unit === "$" ? `$${min}` : `${min}${unit === "bps" ? " bps" : unit === "%" ? "%" : ""}`}</span>
        <span>{unit === "$" ? `$${max.toLocaleString()}` : `${max}${unit === "bps" ? " bps" : unit === "%" ? "%" : ""}`}</span>
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

function PathLabel({ color, children }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      background: `${color}22`, color, textTransform: "uppercase", letterSpacing: 0.8, display: "inline-block" }}>{children}</span>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 16px", fontSize: 12.5, fontWeight: active ? 700 : 500,
      color: active ? C.text : C.muted, background: active ? C.accent : "transparent",
      border: `1px solid ${active ? C.accent : C.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>{children}</button>
  );
}

const fmt = v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtD = v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : fmt(v);
const ttStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11.5 };

// ── Main Component ──────────────────────────────────────────
export default function RampPlayground() {
  const [tab, setTab] = useState("compare");

  // Shared inputs
  const [txVolume, setTxVolume] = useState(100000);
  const [avgTxSize, setAvgTxSize] = useState(200);
  const [userFee, setUserFee] = useState(150);
  const [demandImbalance, setDemandImbalance] = useState(70);

  // Direct costs (shared)
  const [kycCost, setKycCost] = useState(3);
  const [opCostPerTx, setOpCostPerTx] = useState(0.50);

  // Traditional path specifics
  const [bankWireFee, setBankWireFee] = useState(15);
  const [intlWireFee, setIntlWireFee] = useState(35);
  const [fxSpread, setFxSpread] = useState(30); // bps
  const [exchangeFee, setExchangeFee] = useState(10); // bps
  const [rebalanceHrs, setRebalanceHrs] = useState(48);
  const [fxVol, setFxVol] = useState(10);
  const [tradDepositRate, setTradDepositRate] = useState(0.5);

  // CETES path specifics
  const [cetesYield, setCetesYield] = useState(10.5); // Mexican CETES ~10-11%
  const [dexFee, setDexFee] = useState(5); // bps — Stellar DEX
  const [stellarFee, setStellarFee] = useState(0.01);
  const [cetesRebalanceHrs, setCetesRebalanceHrs] = useState(1); // near-instant on DEX
  const [cetesInventoryPct, setCetesInventoryPct] = useState(80);

  // Inventory
  const [inventorySize, setInventorySize] = useState(50000);
  const [riskFreeRate, setRiskFreeRate] = useState(4.5);

  const calc = useMemo(() => {
    const txCount = Math.floor(txVolume / avgTxSize);
    const imbal = Math.abs(demandImbalance / 100 - 0.5) * 2;
    const rebalVol = txVolume * imbal;
    const newUserRate = 0.15;
    const revenue = txVolume * (userFee / 10000);

    // ═══ TRADITIONAL PATH: MXN → USDC ═══
    const t_kyc = kycCost * txCount * newUserRate;
    const t_ops = opCostPerTx * txCount;
    const t_wires = bankWireFee * Math.ceil(rebalVol / 10000);
    const t_intlWires = intlWireFee * Math.ceil(rebalVol / 10000);
    const t_fxSpread = (fxSpread / 10000) * rebalVol;
    const t_exchangeFee = (exchangeFee / 10000) * rebalVol;
    const t_networkFees = 0.50 * txCount; // bank network costs ~$0.50/tx
    // FX risk: volatility * sqrt(time) * volume exposed
    const t_fxRisk = rebalVol * (fxVol / 100) * Math.sqrt(rebalanceHrs / 8760) * 1.5;
    // Cost of capital: inventory earns deposit rate, could earn risk-free
    const t_costOfCapital = inventorySize * ((riskFreeRate - tradDepositRate) / 100) / 12; // monthly

    const t_directCosts = t_kyc + t_ops + t_wires + t_intlWires + t_fxSpread + t_exchangeFee + t_networkFees;
    const t_riskCosts = t_fxRisk + t_costOfCapital;
    const t_totalCosts = t_directCosts + t_riskCosts;
    const t_profit = revenue - t_totalCosts;
    const t_margin = revenue > 0 ? (t_profit / revenue) * 100 : 0;
    const t_costBps = txVolume > 0 ? (t_totalCosts / txVolume) * 10000 : 0;

    // ═══ CETES PATH: MXN → CETES → USDC ═══
    const c_kyc = kycCost * 0.2 * txCount * newUserRate; // reusable KYC
    const c_ops = opCostPerTx * txCount;
    const c_stellarFees = stellarFee * txCount;
    const c_dexFees = (dexFee / 10000) * rebalVol;
    // No international wires, no FX spread (on-chain swap)
    // FX risk: near-zero because DEX settles in seconds
    const c_fxRisk = rebalVol * (fxVol / 100) * Math.sqrt(cetesRebalanceHrs / 8760) * 1.5;
    // Cost of capital: CETES inventory EARNS yield
    const cetesInv = inventorySize * (cetesInventoryPct / 100);
    const cashInv = inventorySize - cetesInv;
    const c_yieldEarned = (cetesInv * (cetesYield / 100) + cashInv * (tradDepositRate / 100)) / 12;
    const c_costOfCapital = (inventorySize * (riskFreeRate / 100) / 12) - c_yieldEarned;
    // If yield exceeds risk-free rate (CETES often do), cost of capital goes negative (it's income)

    const c_directCosts = c_kyc + c_ops + c_stellarFees + c_dexFees;
    const c_riskCosts = Math.max(0, c_fxRisk) + Math.max(0, c_costOfCapital);
    const c_yieldIncome = Math.max(0, -c_costOfCapital); // income from CETES exceeding risk-free
    const c_totalCosts = c_directCosts + c_riskCosts - c_yieldIncome;
    const c_profit = revenue - c_totalCosts;
    const c_margin = revenue > 0 ? (c_profit / revenue) * 100 : 0;
    const c_costBps = txVolume > 0 ? (Math.max(0, c_totalCosts) / txVolume) * 10000 : 0;

    // ═══ DELTAS ═══
    const savings = t_totalCosts - c_totalCosts;
    const marginLift = c_margin - t_margin;
    const bpsSaved = t_costBps - c_costBps;

    // ═══ Breakdown data ═══
    const tradBreakdown = [
      { name: "KYC/Compliance", value: t_kyc },
      { name: "Operations", value: t_ops },
      { name: "Bank Wires", value: t_wires },
      { name: "Int'l Wires", value: t_intlWires },
      { name: "FX Spread", value: t_fxSpread },
      { name: "Exchange Fees", value: t_exchangeFee },
      { name: "Network Fees", value: t_networkFees },
      { name: "FX Risk Buffer", value: t_fxRisk },
      { name: "Cost of Capital", value: t_costOfCapital },
    ].filter(d => d.value > 0.01);

    const cetesBreakdown = [
      { name: "KYC (Reusable)", value: c_kyc },
      { name: "Operations", value: c_ops },
      { name: "Stellar Fees", value: c_stellarFees },
      { name: "DEX Swap Fees", value: c_dexFees },
      { name: "FX Risk (residual)", value: Math.max(0, c_fxRisk) },
      { name: "Cost of Capital", value: Math.max(0, c_costOfCapital) },
    ].filter(d => d.value > 0.01);

    // Fee sensitivity: both paths
    const feeSensitivity = [];
    for (let f = 25; f <= 400; f += 25) {
      const r = txVolume * (f / 10000);
      feeSensitivity.push({ fee: f, traditional: r - t_totalCosts, cetes: r - c_totalCosts });
    }

    // Rebalance time sensitivity
    const rebalSensitivity = [];
    for (let h = 1; h <= 168; h += 1) {
      const risk = rebalVol * (fxVol / 100) * Math.sqrt(h / 8760) * 1.5;
      rebalSensitivity.push({ hours: h, fxRisk: risk });
    }

    // CETES yield sensitivity
    const yieldSensitivity = [];
    for (let y = 0; y <= 15; y += 0.5) {
      const ci = inventorySize * (cetesInventoryPct / 100);
      const ca = inventorySize - ci;
      const earned = (ci * (y / 100) + ca * (tradDepositRate / 100)) / 12;
      const coc = (inventorySize * (riskFreeRate / 100) / 12) - earned;
      yieldSensitivity.push({ yield: y, costOfCapital: coc, income: Math.max(0, -coc) });
    }

    // Volume comparison
    const volComparison = [];
    for (let v = 10000; v <= 500000; v += 10000) {
      const costRatio = txVolume > 0 ? v / txVolume : 0;
      const r = v * (userFee / 10000);
      volComparison.push({
        volume: v / 1000,
        tradProfit: r - (t_totalCosts * costRatio),
        cetesProfit: r - (c_totalCosts * costRatio),
      });
    }

    return {
      txCount, revenue,
      trad: { costs: t_totalCosts, profit: t_profit, margin: t_margin, costBps: t_costBps,
        kyc: t_kyc, ops: t_ops, wires: t_wires, intlWires: t_intlWires,
        fxSpreadCost: t_fxSpread, exchangeFeeCost: t_exchangeFee, networkFees: t_networkFees,
        fxRisk: t_fxRisk, costOfCapital: t_costOfCapital, directCosts: t_directCosts, riskCosts: t_riskCosts,
        breakdown: tradBreakdown },
      cetes: { costs: c_totalCosts, profit: c_profit, margin: c_margin, costBps: c_costBps,
        kyc: c_kyc, ops: c_ops, stellarFees: c_stellarFees, dexFees: c_dexFees,
        fxRisk: Math.max(0, c_fxRisk), costOfCapital: c_costOfCapital, yieldIncome: c_yieldIncome,
        directCosts: c_directCosts, riskCosts: c_riskCosts,
        breakdown: cetesBreakdown },
      savings, marginLift, bpsSaved,
      feeSensitivity, rebalSensitivity, yieldSensitivity, volComparison,
    };
  }, [txVolume, avgTxSize, userFee, demandImbalance, kycCost, opCostPerTx, bankWireFee, intlWireFee,
    fxSpread, exchangeFee, rebalanceHrs, fxVol, tradDepositRate, cetesYield, dexFee, stellarFee,
    cetesRebalanceHrs, cetesInventoryPct, inventorySize, riskFreeRate]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding: "24px 20px" }}>
      <style>{`
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
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            On/Off-Ramp Economics: <span style={{ color: C.trad }}>MXN→USDC</span>
            {" "}vs{" "}
            <span style={{ color: C.cetes }}>MXN→CETES→USDC</span>
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: C.dim, maxWidth: 800, lineHeight: 1.5 }}>
            Compare the traditional off-chain rebalancing path against the Stellar-optimized path where
            inventory is held in on-chain yield-bearing CETES and FX risk is eliminated via instant DEX settlement.
          </p>
        </div>

        {/* ── Hero KPI comparison ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0, marginBottom: 20 }}>
          {/* Traditional */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px 0 0 12px", padding: 16,
            borderTop: `3px solid ${C.trad}` }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <PathLabel color={C.trad}>Traditional</PathLabel>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>MXN → Bank → Wire → Exchange → USDC</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              <Metric label="Total Costs" value={fmt(calc.trad.costs)} color={C.trad} />
              <Metric label="Profit" value={fmt(calc.trad.profit)} color={calc.trad.profit >= 0 ? C.green : C.red} large />
              <Metric label="Cost Basis" value={`${calc.trad.costBps.toFixed(0)} bps`} color={C.muted} />
            </div>
          </div>

          {/* Delta column */}
          <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
            padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8, minWidth: 140 }}>
            <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>CETES Advantage</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: calc.savings > 0 ? C.green : C.red, fontFamily: "monospace" }}>
              {calc.savings >= 0 ? "+" : ""}{fmt(calc.savings)}
            </div>
            <div style={{ fontSize: 10, color: C.dim }}>saved / period</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>+{calc.marginLift.toFixed(1)}pp</div>
                <div style={{ fontSize: 9, color: C.dim }}>margin lift</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>-{calc.bpsSaved.toFixed(0)} bps</div>
                <div style={{ fontSize: 9, color: C.dim }}>cost reduction</div>
              </div>
            </div>
          </div>

          {/* CETES */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "0 12px 12px 0", padding: 16,
            borderTop: `3px solid ${C.cetes}` }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <PathLabel color={C.cetes}>CETES Path</PathLabel>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>MXN → CETES:Stellar → DEX → USDC:Stellar</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              <Metric label="Total Costs" value={fmt(Math.max(0, calc.cetes.costs))} color={C.cetes} />
              <Metric label="Profit" value={fmt(calc.cetes.profit)} color={calc.cetes.profit >= 0 ? C.green : C.red} large />
              <Metric label="Cost Basis" value={`${Math.max(0, calc.cetes.costBps).toFixed(0)} bps`} color={C.muted} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 5, marginBottom: 18, flexWrap: "wrap" }}>
          {[["compare", "Side-by-Side"], ["costs", "Cost Anatomy"], ["fxrisk", "FX Risk Elimination"],
            ["yield", "Yield-Bearing Inventory"], ["sensitivity", "Sensitivity"]].map(([k, l]) => (
            <TabBtn key={k} active={tab === k} onClick={() => setTab(k)}>{l}</TabBtn>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}>
          {/* ── LEFT: Controls ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card title="Transaction Parameters" accent={C.accent}>
              <Slider label="Monthly Volume" value={txVolume} onChange={setTxVolume} min={10000} max={2000000} step={10000} unit="$" color={C.accent} />
              <Slider label="Avg Transaction Size" value={avgTxSize} onChange={setAvgTxSize} min={10} max={2000} step={10} unit="$" color={C.accent} />
              <Slider label="User Fee (Spread)" value={userFee} onChange={setUserFee} min={10} max={500} step={5} unit="bps" color={C.accent}
                tip="What the ramp charges users. 100 bps = 1%." />
              <Slider label="Demand Imbalance" value={demandImbalance} onChange={setDemandImbalance} min={50} max={100} step={1} unit="%" color={C.orange}
                tip="% buy-side. 50% = balanced. Higher = more rebalancing needed." />
            </Card>

            {(tab === "compare" || tab === "costs") && (
              <>
                <Card title="Traditional Path Costs" accent={C.trad} tag="MXN→USDC" tagColor={C.trad}>
                  <Slider label="Bank Wire Fee (domestic)" value={bankWireFee} onChange={setBankWireFee} min={0} max={50} step={1} unit="$" color={C.trad} />
                  <Slider label="Int'l Wire Fee" value={intlWireFee} onChange={setIntlWireFee} min={0} max={75} step={1} unit="$" color={C.trad}
                    tip="Per rebalancing cycle — wiring MXN to USD exchange." />
                  <Slider label="FX Spread" value={fxSpread} onChange={setFxSpread} min={5} max={100} step={1} unit="bps" color={C.trad}
                    tip="Bid-ask spread on MXN/USD conversion." />
                  <Slider label="Exchange Fee" value={exchangeFee} onChange={setExchangeFee} min={0} max={50} step={1} unit="bps" color={C.trad} />
                  <Slider label="Rebalance Cycle" value={rebalanceHrs} onChange={setRebalanceHrs} min={4} max={168} step={1} unit="hrs" color={C.trad}
                    tip="Time to wire MXN → exchange → buy USDC → send to wallet." />
                  <Slider label="Bank Deposit Rate" value={tradDepositRate} onChange={setTradDepositRate} min={0} max={5} step={0.1} unit="%" color={C.trad}
                    tip="What idle MXN deposits earn at the bank." />
                </Card>
                <Card title="CETES Path Costs" accent={C.cetes} tag="MXN→CETES→USDC" tagColor={C.cetes}>
                  <Slider label="CETES Yield" value={cetesYield} onChange={setCetesYield} min={0} max={15} step={0.1} unit="%" color={C.cetes}
                    tip="Annualized yield on tokenized CETES held on-chain." />
                  <Slider label="DEX Swap Fee" value={dexFee} onChange={setDexFee} min={0} max={30} step={1} unit="bps" color={C.cetes}
                    tip="Fee for CETES→USDC swap on Stellar DEX." />
                  <Slider label="Stellar Network Fee" value={stellarFee} onChange={setStellarFee} min={0} max={0.5} step={0.01} unit="$" color={C.cetes} />
                  <Slider label="DEX Rebalance Time" value={cetesRebalanceHrs} onChange={setCetesRebalanceHrs} min={0.01} max={24} step={0.5} unit="hrs" color={C.cetes}
                    tip="Near-instant on Stellar. ~5s finality." />
                  <Slider label="% Inventory in CETES" value={cetesInventoryPct} onChange={setCetesInventoryPct} min={0} max={100} step={5} unit="%" color={C.cetes} />
                </Card>
              </>
            )}

            {tab === "fxrisk" && (
              <Card title="FX Risk Parameters" accent={C.red}>
                <Slider label="MXN/USD Volatility (ann.)" value={fxVol} onChange={setFxVol} min={1} max={30} step={0.5} unit="%" color={C.red}
                  tip="Annualized volatility of MXN/USD pair." />
                <Slider label="Trad. Rebalance Cycle" value={rebalanceHrs} onChange={setRebalanceHrs} min={4} max={168} step={1} unit="hrs" color={C.trad} />
                <Slider label="DEX Rebalance Time" value={cetesRebalanceHrs} onChange={setCetesRebalanceHrs} min={0.01} max={24} step={0.5} unit="hrs" color={C.cetes} />
                <Slider label="Demand Imbalance" value={demandImbalance} onChange={setDemandImbalance} min={50} max={100} step={1} unit="%" color={C.orange} />
              </Card>
            )}

            {tab === "yield" && (
              <Card title="Inventory & Yield" accent={C.green}>
                <Slider label="Total Inventory" value={inventorySize} onChange={setInventorySize} min={5000} max={500000} step={5000} unit="$" color={C.accent} />
                <Slider label="CETES Yield" value={cetesYield} onChange={setCetesYield} min={0} max={15} step={0.1} unit="%" color={C.cetes}
                  tip="Mexican government CETES rate (currently ~10-11%)." />
                <Slider label="Bank Deposit Rate" value={tradDepositRate} onChange={setTradDepositRate} min={0} max={5} step={0.1} unit="%" color={C.trad}
                  tip="What idle bank deposits earn (traditional path)." />
                <Slider label="Reference Rate" value={riskFreeRate} onChange={setRiskFreeRate} min={0} max={10} step={0.1} unit="%" color={C.dim}
                  tip="Benchmark opportunity cost (e.g., US T-bills)." />
                <Slider label="% Inventory in CETES" value={cetesInventoryPct} onChange={setCetesInventoryPct} min={0} max={100} step={5} unit="%" color={C.cetes} />
              </Card>
            )}

            {tab === "sensitivity" && (
              <Card title="Sensitivity Controls" accent={C.purple}>
                <Slider label="User Fee" value={userFee} onChange={setUserFee} min={10} max={500} step={5} unit="bps" color={C.purple} />
                <Slider label="Monthly Volume" value={txVolume} onChange={setTxVolume} min={10000} max={2000000} step={10000} unit="$" color={C.purple} />
                <Slider label="FX Volatility" value={fxVol} onChange={setFxVol} min={1} max={30} step={0.5} unit="%" color={C.red} />
                <Slider label="CETES Yield" value={cetesYield} onChange={setCetesYield} min={0} max={15} step={0.1} unit="%" color={C.cetes} />
              </Card>
            )}

            {/* Shared costs - always visible */}
            {(tab === "compare" || tab === "costs") && (
              <Card title="Shared Costs" accent={C.dim}>
                <Slider label="KYC Cost / New User" value={kycCost} onChange={setKycCost} min={0} max={20} step={0.5} unit="$" color={C.dim} />
                <Slider label="Operational Cost / Tx" value={opCostPerTx} onChange={setOpCostPerTx} min={0} max={5} step={0.1} unit="$" color={C.dim} />
                <Slider label="Inventory Size" value={inventorySize} onChange={setInventorySize} min={5000} max={500000} step={5000} unit="$" color={C.dim} />
                <Slider label="Reference Rate" value={riskFreeRate} onChange={setRiskFreeRate} min={0} max={10} step={0.1} unit="%" color={C.dim} />
              </Card>
            )}
          </div>

          {/* ── RIGHT: Charts ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ═══ COMPARE TAB ═══ */}
            {tab === "compare" && (
              <>
                <Card title="Cost Comparison: Where Does the Money Go?">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={[
                      { name: "KYC", trad: calc.trad.kyc, cetes: calc.cetes.kyc },
                      { name: "Operations", trad: calc.trad.ops, cetes: calc.cetes.ops },
                      { name: "Wires", trad: calc.trad.wires + calc.trad.intlWires, cetes: 0 },
                      { name: "FX Spread", trad: calc.trad.fxSpreadCost, cetes: 0 },
                      { name: "Exchange/DEX", trad: calc.trad.exchangeFeeCost, cetes: calc.cetes.dexFees },
                      { name: "Network", trad: calc.trad.networkFees, cetes: calc.cetes.stellarFees },
                      { name: "FX Risk", trad: calc.trad.fxRisk, cetes: calc.cetes.fxRisk },
                      { name: "Capital Cost", trad: Math.max(0, calc.trad.costOfCapital), cetes: Math.max(0, calc.cetes.costOfCapital) },
                    ]} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => `$${v.toFixed(0)}`} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmtD(v)} contentStyle={ttStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="trad" name="Traditional" fill={C.trad} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="cetes" name="CETES Path" fill={C.cetes} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Flow diagrams */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card accent={C.trad}>
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <PathLabel color={C.trad}>Traditional Path</PathLabel>
                    </div>
                    {[
                      { step: "1", label: "User sends MXN", detail: "Bank deposit" },
                      { step: "2", label: "Ramp sends USDC", detail: "From inventory" },
                      { step: "3", label: "Inventory depletes", detail: "Imbalanced shelves", warn: true },
                      { step: "4", label: "Wire MXN abroad", detail: `${rebalanceHrs}hr+ delay, $${intlWireFee}/wire`, warn: true },
                      { step: "5", label: "Convert FX", detail: `${fxSpread}bps spread + volatility risk`, warn: true },
                      { step: "6", label: "Buy USDC on exchange", detail: `${exchangeFee}bps fee` },
                      { step: "7", label: "Send USDC to wallet", detail: "Transfer + confirmation" },
                    ].map(s => (
                      <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <div style={{ minWidth: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: s.warn ? `${C.red}33` : `${C.trad}33`, color: s.warn ? C.red : C.trad, fontSize: 10, fontWeight: 700 }}>{s.step}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: s.warn ? C.red : C.dim }}>{s.detail}</div>
                        </div>
                      </div>
                    ))}
                  </Card>

                  <Card accent={C.cetes}>
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <PathLabel color={C.cetes}>CETES Path</PathLabel>
                    </div>
                    {[
                      { step: "1", label: "User sends MXN", detail: "Bank deposit" },
                      { step: "2", label: "Ramp sends USDC", detail: "From inventory" },
                      { step: "3", label: "Swap CETES→USDC on DEX", detail: "~5 second finality", good: true },
                      { step: "4", label: "Inventory rebalanced", detail: "No wires, no FX delay", good: true },
                      { step: "5", label: "Replenish CETES", detail: "MXN → tokenized CETES on Stellar" },
                      { step: "✓", label: "Inventory earns yield", detail: `${cetesYield}% APY while idle`, good: true },
                    ].map(s => (
                      <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <div style={{ minWidth: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: s.good ? `${C.green}33` : `${C.cetes}33`, color: s.good ? C.green : C.cetes, fontSize: 10, fontWeight: 700 }}>{s.step}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: s.good ? C.green : C.dim }}>{s.detail}</div>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              </>
            )}

            {/* ═══ COSTS TAB ═══ */}
            {tab === "costs" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="Traditional Breakdown" accent={C.trad}>
                    {calc.trad.breakdown.map(item => (
                      <div key={item.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                        borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11.5, color: C.muted }}>{item.name}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "monospace", color: C.text }}>{fmtD(item.value)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Total</span>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: C.trad }}>{fmt(calc.trad.costs)}</span>
                    </div>
                  </Card>

                  <Card title="CETES Path Breakdown" accent={C.cetes}>
                    {calc.cetes.breakdown.map(item => (
                      <div key={item.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                        borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11.5, color: C.muted }}>{item.name}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "monospace", color: C.text }}>{fmtD(item.value)}</span>
                      </div>
                    ))}
                    {calc.cetes.yieldIncome > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                        borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11.5, color: C.green }}>CETES Yield Income</span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "monospace", color: C.green }}>-{fmtD(calc.cetes.yieldIncome)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Total</span>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: C.cetes }}>{fmt(Math.max(0, calc.cetes.costs))}</span>
                    </div>
                  </Card>
                </div>

                <Card title="What the CETES Path Eliminates">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={[
                      { name: "Int'l Wires", saved: calc.trad.intlWires, label: "Eliminated" },
                      { name: "FX Spread", saved: calc.trad.fxSpreadCost, label: "Eliminated" },
                      { name: "FX Risk Buffer", saved: calc.trad.fxRisk - calc.cetes.fxRisk, label: "~Eliminated" },
                      { name: "Capital Cost", saved: Math.max(0, calc.trad.costOfCapital) - Math.max(0, calc.cetes.costOfCapital), label: "Reduced/Reversed" },
                      { name: "KYC (80% saved)", saved: calc.trad.kyc - calc.cetes.kyc, label: "Reusable KYC" },
                    ].filter(d => d.saved > 0)} margin={{ left: 10, right: 20, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="name" style={{ fontSize: 10 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => `$${v.toFixed(0)}`} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmtD(v)} contentStyle={ttStyle} />
                      <Bar dataKey="saved" name="Cost Eliminated" fill={C.green} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}

            {/* ═══ FX RISK TAB ═══ */}
            {tab === "fxrisk" && (
              <>
                <Card title="FX Risk Exposure Over Time">
                  <p style={{ fontSize: 11.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                    The traditional path holds MXN for <strong style={{ color: C.trad }}>{rebalanceHrs} hours</strong> before converting — exposed to currency swings the entire time.
                    The CETES path settles on the DEX in <strong style={{ color: C.cetes }}>~{cetesRebalanceHrs < 1 ? "seconds" : `${cetesRebalanceHrs} hrs`}</strong>, compressing the risk window to nearly zero.
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={calc.rebalSensitivity} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="hours" label={{ value: "Hours Until Rebalanced", position: "insideBottom", offset: -5, style: { fontSize: 10, fill: C.dim } }} style={{ fontSize: 10 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => `$${v.toFixed(0)}`} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmtD(v)} contentStyle={ttStyle} />
                      <Area type="monotone" dataKey="fxRisk" stroke={C.red} fill="rgba(239,68,68,0.12)" strokeWidth={2} name="FX Risk ($)" />
                      <ReferenceLine x={rebalanceHrs} stroke={C.trad} strokeDasharray="5 5" strokeWidth={2}
                        label={{ value: `Traditional: ${rebalanceHrs}hrs`, position: "top", style: { fontSize: 10, fill: C.trad } }} />
                      <ReferenceLine x={Math.max(1, cetesRebalanceHrs)} stroke={C.cetes} strokeDasharray="5 5" strokeWidth={2}
                        label={{ value: `CETES: ${cetesRebalanceHrs}hrs`, position: "insideTopRight", style: { fontSize: 10, fill: C.cetes } }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ padding: 20, background: `${C.trad}11`, borderRadius: 12, border: `1px solid ${C.trad}33` }}>
                    <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Traditional FX Risk</div>
                    <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "monospace", color: C.trad }}>{fmt(calc.trad.fxRisk)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
                      Ramp holds MXN for {rebalanceHrs}hrs while wiring internationally, converting FX, and purchasing USDC. The peso could move {(fxVol * Math.sqrt(rebalanceHrs / 8760) * 100).toFixed(2)}% in that window.
                    </div>
                  </div>
                  <div style={{ padding: 20, background: `${C.cetes}11`, borderRadius: 12, border: `1px solid ${C.cetes}33` }}>
                    <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>CETES Path FX Risk</div>
                    <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "monospace", color: C.cetes }}>{fmt(calc.cetes.fxRisk)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
                      CETES→USDC swap settles on-chain in ~5 seconds. FX exposure window is {cetesRebalanceHrs < 1 ? "seconds" : `${cetesRebalanceHrs}hrs`} — theoretical risk collapses to a known cost.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══ YIELD TAB ═══ */}
            {tab === "yield" && (
              <>
                <Card title="Idle Inventory: Liability vs Asset">
                  <p style={{ fontSize: 11.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                    Traditionally, ramp inventory sits in a bank earning <strong style={{ color: C.trad }}>{tradDepositRate}%</strong> — well below the risk-free rate.
                    On-chain CETES turn that inventory into a yield-bearing asset at <strong style={{ color: C.cetes }}>{cetesYield}%</strong>, flipping cost of capital from a drag into income.
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={calc.yieldSensitivity} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="yield" label={{ value: "CETES Yield (%)", position: "insideBottom", offset: -5, style: { fontSize: 10, fill: C.dim } }} style={{ fontSize: 10 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => `$${v.toFixed(0)}`} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmtD(v)} contentStyle={ttStyle} />
                      <Line type="monotone" dataKey="costOfCapital" stroke={C.red} strokeWidth={2} dot={false} name="Cost of Capital" />
                      <Line type="monotone" dataKey="income" stroke={C.green} strokeWidth={2} dot={false} name="Net Yield Income" />
                      <ReferenceLine x={tradDepositRate} stroke={C.trad} strokeDasharray="5 5"
                        label={{ value: `Bank: ${tradDepositRate}%`, position: "top", style: { fontSize: 10, fill: C.trad } }} />
                      <ReferenceLine x={riskFreeRate} stroke={C.dim} strokeDasharray="3 3"
                        label={{ value: `Ref: ${riskFreeRate}%`, position: "top", style: { fontSize: 10, fill: C.dim } }} />
                      <ReferenceLine x={cetesYield} stroke={C.cetes} strokeDasharray="5 5"
                        label={{ value: `CETES: ${cetesYield}%`, position: "top", style: { fontSize: 10, fill: C.cetes } }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div style={{ padding: 16, background: `${C.trad}11`, borderRadius: 12, border: `1px solid ${C.trad}33`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Bank Deposit Earns</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: C.trad }}>
                      {fmtD(inventorySize * (tradDepositRate / 100) / 12)}
                    </div>
                    <div style={{ fontSize: 10, color: C.dim }}>/month on {fmt(inventorySize)}</div>
                  </div>
                  <div style={{ padding: 16, background: `${C.cetes}11`, borderRadius: 12, border: `1px solid ${C.cetes}33`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>CETES Earns</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: C.cetes }}>
                      {fmtD(inventorySize * (cetesInventoryPct / 100) * (cetesYield / 100) / 12)}
                    </div>
                    <div style={{ fontSize: 10, color: C.dim }}>/month on {fmt(inventorySize * cetesInventoryPct / 100)}</div>
                  </div>
                  <div style={{ padding: 16, background: `${C.green}11`, borderRadius: 12, border: `1px solid ${C.green}33`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Monthly Yield Advantage</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: C.green }}>
                      +{fmtD(
                        (inventorySize * (cetesInventoryPct / 100) * (cetesYield / 100) / 12)
                        - (inventorySize * (tradDepositRate / 100) / 12)
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: C.dim }}>additional income</div>
                  </div>
                </div>

                <Card title="Annual Impact on a {fmt(inventorySize)} Inventory">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[
                      {
                        name: "Traditional",
                        earned: inventorySize * (tradDepositRate / 100),
                        opportunityCost: inventorySize * ((riskFreeRate - tradDepositRate) / 100),
                      },
                      {
                        name: "CETES Path",
                        earned: inventorySize * (cetesInventoryPct / 100) * (cetesYield / 100) + inventorySize * ((100 - cetesInventoryPct) / 100) * (tradDepositRate / 100),
                        opportunityCost: Math.max(0, inventorySize * (riskFreeRate / 100) - (inventorySize * (cetesInventoryPct / 100) * (cetesYield / 100) + inventorySize * ((100 - cetesInventoryPct) / 100) * (tradDepositRate / 100))),
                      },
                    ]} margin={{ left: 10, right: 20, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="name" style={{ fontSize: 11 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => fmt(v)} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="earned" name="Yield Earned" fill={C.green} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="opportunityCost" name="Opportunity Cost" fill={C.red} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}

            {/* ═══ SENSITIVITY TAB ═══ */}
            {tab === "sensitivity" && (
              <>
                <Card title="Profit at Different Fee Levels — Both Paths">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={calc.feeSensitivity} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="fee" label={{ value: "User Fee (bps)", position: "insideBottom", offset: -5, style: { fontSize: 10, fill: C.dim } }} style={{ fontSize: 10 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => fmtK(v)} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <ReferenceLine y={0} stroke={C.dim} />
                      <Bar dataKey="traditional" name="Traditional" fill={C.trad} radius={[3, 3, 0, 0]} fillOpacity={0.7} />
                      <Bar dataKey="cetes" name="CETES Path" fill={C.cetes} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 11.5, color: C.muted, marginTop: 8 }}>
                    <span>Traditional break-even: <strong style={{ color: C.trad, fontFamily: "monospace" }}>{calc.trad.costBps.toFixed(0)} bps</strong></span>
                    <span>CETES break-even: <strong style={{ color: C.cetes, fontFamily: "monospace" }}>{Math.max(0, calc.cetes.costBps).toFixed(0)} bps</strong></span>
                  </div>
                </Card>

                <Card title="Profit vs Monthly Volume">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calc.volComparison} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="volume" label={{ value: "Monthly Volume ($k)", position: "insideBottom", offset: -5, style: { fontSize: 10, fill: C.dim } }} style={{ fontSize: 10 }} stroke={C.dim} />
                      <YAxis tickFormatter={v => fmtK(v)} style={{ fontSize: 10 }} stroke={C.dim} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <ReferenceLine y={0} stroke={C.dim} />
                      <Line type="monotone" dataKey="tradProfit" name="Traditional" stroke={C.trad} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cetesProfit" name="CETES Path" stroke={C.cetes} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Competitive Pricing Advantage">
                  <p style={{ fontSize: 11.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                    The CETES path's lower cost basis means a ramp can undercut competitors on price while maintaining the same profit margin — or keep the same price and pocket the difference.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ padding: 16, background: `${C.trad}11`, borderRadius: 10, border: `1px solid ${C.trad}33`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Min Viable Fee (Traditional)</div>
                      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: C.trad }}>{calc.trad.costBps.toFixed(0)} bps</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{(calc.trad.costBps / 100).toFixed(2)}% per transaction</div>
                    </div>
                    <div style={{ padding: 16, background: `${C.cetes}11`, borderRadius: 10, border: `1px solid ${C.cetes}33`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Min Viable Fee (CETES)</div>
                      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: C.cetes }}>{Math.max(0, calc.cetes.costBps).toFixed(0)} bps</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{(Math.max(0, calc.cetes.costBps) / 100).toFixed(2)}% per transaction</div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 28, padding: "14px 0", borderTop: `1px solid ${C.border}`, fontSize: 10.5, color: C.dim }}>
          All figures are illustrative. Adjust inputs to match your corridor. CETES yield reflects Mexican government short-term rates. Stellar DEX settlement is ~5 seconds.
        </div>
      </div>
    </div>
  );
}
