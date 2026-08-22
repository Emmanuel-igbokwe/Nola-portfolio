import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, ComposedChart, Area,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronRight, Wheat,
  Factory, Globe2, BarChart3, Activity, Gauge, DollarSign, Package, Bell,
  Sparkles, Coffee, Droplets, Sprout, Milk, Snowflake, Beaker, Minus,
  Users, SlidersHorizontal, Boxes, Wallet, ShieldAlert, ClipboardList,
  FileBarChart, GitBranch, Filter, Printer, RotateCcw, Building2, Calculator,
  Layers, Repeat, X, CalendarClock, Target, Megaphone, ArrowRight,
} from "lucide-react";

/* ============================== DESIGN TOKENS ==============================
   Palette: "Grain Exchange" — a Bloomberg-terminal discipline built from the
   materials of the business itself: dark roasted-grain charcoal, wheat gold,
   cocoa brown, and muted harvest green/rust for signal color. Numbers run in
   mono for tabular precision; headers run in a condensed grotesk for a
   ticker-board voice.
============================================================================ */

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap";

const SEGMENTS = [
  { key: "Beverages", icon: Droplets, cogsBase: 0.58, seasonPeakMonth: 6, seasonAmp: 0.14, growth: 0.0032, base: 178 },
  { key: "Snacks", icon: Wheat, cogsBase: 0.55, seasonPeakMonth: 11, seasonAmp: 0.18, growth: 0.0028, base: 142 },
  { key: "Dairy", icon: Milk, cogsBase: 0.68, seasonPeakMonth: 3, seasonAmp: 0.06, growth: 0.0009, base: 96 },
  { key: "Frozen Foods", icon: Snowflake, cogsBase: 0.62, seasonPeakMonth: 1, seasonAmp: 0.10, growth: 0.0018, base: 108 },
  { key: "Nutrition", icon: Beaker, cogsBase: 0.50, seasonPeakMonth: 8, seasonAmp: 0.05, growth: 0.0061, base: 58 },
];

const REGIONS = [
  { key: "North America", weight: 0.38, growth: 0.0014 },
  { key: "Europe", weight: 0.27, growth: -0.0006 },
  { key: "Asia Pacific", weight: 0.20, growth: 0.0038 },
  { key: "Latin America", weight: 0.09, growth: 0.0021 },
  { key: "Africa", weight: 0.06, growth: 0.0044 },
];

const COMMODITIES = [
  { key: "Cocoa", unit: "$/MT", price: 8420, dailyChg: 1.8, monthlyChg: 14.2, vol: 32.5, affects: "Snacks", elasticity: 0.28 },
  { key: "Coffee (Arabica)", unit: "¢/lb", price: 312, dailyChg: -0.6, monthlyChg: 6.1, vol: 24.1, affects: "Beverages", elasticity: 0.16 },
  { key: "Sugar", unit: "¢/lb", price: 19.4, dailyChg: 0.3, monthlyChg: -3.2, vol: 14.8, affects: "Snacks", elasticity: 0.11 },
  { key: "Wheat", unit: "¢/bu", price: 612, dailyChg: -0.9, monthlyChg: 4.4, vol: 17.2, affects: "Snacks", elasticity: 0.14 },
  { key: "Corn", unit: "¢/bu", price: 448, dailyChg: 0.4, monthlyChg: 2.1, vol: 13.6, affects: "Frozen Foods", elasticity: 0.09 },
  { key: "Soybeans", unit: "¢/bu", price: 1084, dailyChg: 1.1, monthlyChg: -1.6, vol: 15.9, affects: "Nutrition", elasticity: 0.12 },
];

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260822);
const fmt$ = (v, d = 1) => `$${v.toFixed(d)}M`;
const fmtPct = (v, d = 1) => `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const N_MONTHS = 60;
function monthLabel(i) {
  // i=0 is 59 months before the "current" month (Aug 2026)
  const monthsBack = N_MONTHS - 1 - i;
  let m = 7 - monthsBack; // Aug = index 7
  let y = 2026;
  while (m < 0) { m += 12; y -= 1; }
  return `${MONTH_NAMES[m]} '${String(y).slice(2)}`;
}
function seasonalFactor(monthIdxInYear, peakMonth, amp) {
  const dist = Math.min(Math.abs(monthIdxInYear - peakMonth), 12 - Math.abs(monthIdxInYear - peakMonth));
  return 1 + amp * Math.cos((dist / 6) * Math.PI);
}

/* ============================== DATA GENERATION ============================== */

const monthlySegmentData = SEGMENTS.map((seg) => {
  const series = [];
  for (let i = 0; i < N_MONTHS; i++) {
    const monthOfYear = (7 - (N_MONTHS - 1 - i) + 1200) % 12;
    const trend = Math.pow(1 + seg.growth, i);
    const season = seasonalFactor(monthOfYear, seg.seasonPeakMonth, seg.seasonAmp);
    const noise = 1 + (rand() - 0.5) * 0.05;
    const revenue = seg.base * trend * season * noise;
    // Commodity cost pressure ramps up over the trailing 12 months
    const pressureRamp = i >= N_MONTHS - 12 ? (i - (N_MONTHS - 12)) / 11 : 0;
    const cogsRatio = clamp(seg.cogsBase + pressureRamp * 0.045 + (rand() - 0.5) * 0.01, 0.3, 0.85);
    series.push({ revenue, cogsRatio });
  }
  return { ...seg, series };
});

const companyMonthly = Array.from({ length: N_MONTHS }, (_, i) => {
  let revenue = 0, cogs = 0;
  monthlySegmentData.forEach((seg) => {
    revenue += seg.series[i].revenue;
    cogs += seg.series[i].revenue * seg.series[i].cogsRatio;
  });
  const grossProfit = revenue - cogs;
  const sgna = revenue * (0.18 + (rand() - 0.5) * 0.01);
  const marketing = revenue * (0.06 + (rand() - 0.5) * 0.008);
  const rnd = revenue * 0.02;
  const da = revenue * 0.03;
  const opInc = grossProfit - sgna - marketing - rnd - da;
  const netIncome = opInc * 0.76;
  return {
    label: monthLabel(i), revenue, cogs, grossProfit, sgna, marketing, rnd, da,
    opInc, netIncome,
    grossMargin: (grossProfit / revenue) * 100,
    opMargin: (opInc / revenue) * 100,
    netMargin: (netIncome / revenue) * 100,
  };
});

const latest = companyMonthly[N_MONTHS - 1];
const prior = companyMonthly[N_MONTHS - 2];
const yearAgo = companyMonthly[N_MONTHS - 13];
const ytdMonths = companyMonthly.slice(N_MONTHS - 8); // Jan'26 - Aug'26 (8 months)
const ytdRevenue = ytdMonths.reduce((a, m) => a + m.revenue, 0);
const priorYtd = companyMonthly.slice(N_MONTHS - 20, N_MONTHS - 12).reduce((a, m) => a + m.revenue, 0);

const revYoY = ((latest.revenue - yearAgo.revenue) / yearAgo.revenue) * 100;
const revMoM = ((latest.revenue - prior.revenue) / prior.revenue) * 100;
const q = companyMonthly.slice(N_MONTHS - 3);
const quarterRevenue = q.reduce((a, m) => a + m.revenue, 0);
const ebitda = latest.opInc + latest.da;

const kpis = [
  { label: "Monthly Revenue", value: fmt$(latest.revenue), change: revMoM, target: "≥ +0.5% MoM", ok: revMoM >= 0.5, icon: DollarSign },
  { label: "YTD Revenue", value: fmt$(ytdRevenue, 0), change: ((ytdRevenue - priorYtd) / priorYtd) * 100, target: "≥ +3.0% YoY", ok: ((ytdRevenue - priorYtd) / priorYtd) * 100 >= 3, icon: TrendingUp },
  { label: "Gross Margin", value: `${latest.grossMargin.toFixed(1)}%`, change: latest.grossMargin - yearAgo.grossMargin, target: "≥ 40.0%", ok: latest.grossMargin >= 40, icon: BarChart3, isPP: true },
  { label: "Operating Margin", value: `${latest.opMargin.toFixed(1)}%`, change: latest.opMargin - yearAgo.opMargin, target: "≥ 14.0%", ok: latest.opMargin >= 14, icon: Activity, isPP: true },
  { label: "EBITDA (Mo.)", value: fmt$(ebitda), change: ((ebitda - (prior.opInc + prior.da)) / (prior.opInc + prior.da)) * 100, target: "≥ +1.0% MoM", ok: true, icon: Gauge },
  { label: "Net Margin", value: `${latest.netMargin.toFixed(1)}%`, change: latest.netMargin - yearAgo.netMargin, target: "≥ 9.5%", ok: latest.netMargin >= 9.5, icon: TrendingUp, isPP: true },
  { label: "Current Ratio", value: "1.62x", change: -0.04, target: "≥ 1.50x", ok: true, icon: CheckCircle2, isX: true },
  { label: "Inventory Turnover", value: "7.4x", change: -0.3, target: "≥ 7.0x", ok: true, icon: Package, isX: true },
];

// Products (100)
const PRODUCT_ADJ = ["Golden","Harvest","Crisp","Northfield","Meadow","Riverstone","Wholesome","Orchard","Prairie","Summit","Coastal","Heritage"];
const PRODUCT_NOUN = { Beverages: ["Cola","Sparkling Water","Iced Tea","Juice Blend","Energy Drink","Sports Drink"], Snacks: ["Tortilla Chips","Granola Bar","Pretzel Bites","Cookie Pack","Cracker Box","Trail Mix"], Dairy: ["Whole Milk","Greek Yogurt","Cheddar Block","Butter","Cottage Cheese","Cream"], "Frozen Foods": ["Pizza","Veggie Medley","Waffles","Entree Bowl","Ice Cream","Dumplings"], Nutrition: ["Protein Bar","Meal Shake","Vitamin Gummies","Protein Powder","Wellness Shot","Fiber Mix"] };
const products = Array.from({ length: 100 }, (_, i) => {
  const seg = SEGMENTS[Math.floor(rand() * SEGMENTS.length)];
  const noun = PRODUCT_NOUN[seg.key][Math.floor(rand() * 6)];
  const adj = PRODUCT_ADJ[Math.floor(rand() * PRODUCT_ADJ.length)];
  const revenue = Math.pow(rand(), 2.2) * 48 + 1.2;
  const marginPct = clamp(seg.cogsBase ? (1 - seg.cogsBase) * 100 + (rand() - 0.5) * 20 : 35, 8, 62);
  const grossProfit = revenue * (marginPct / 100);
  const growth = (rand() - 0.42) * 30;
  return { id: i, name: `${adj} ${noun}`, segment: seg.key, revenue, grossProfit, marginPct, growth };
});
const medianRev = [...products].sort((a, b) => a.revenue - b.revenue)[Math.floor(products.length / 2)].revenue;
const medianProfit = [...products].sort((a, b) => a.grossProfit - b.grossProfit)[Math.floor(products.length / 2)].grossProfit;
function quadrantOf(p) {
  if (p.revenue >= medianRev && p.grossProfit >= medianProfit) return "Star Products";
  if (p.revenue >= medianRev && p.grossProfit < medianProfit) return "Margin Improvement";
  if (p.revenue < medianRev && p.grossProfit >= medianProfit) return "Growth Opportunity";
  return "Review Candidate";
}
const QUADRANT_COLOR = { "Star Products": "#c9a24b", "Margin Improvement": "#c1543f", "Growth Opportunity": "#5b9279", "Review Candidate": "#6b7280" };

const topProductsByProfit = [...products].sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 20);
const top20ProfitShare = (topProductsByProfit.reduce((a, p) => a + p.grossProfit, 0) / products.reduce((a, p) => a + p.grossProfit, 0)) * 100;
const top20RevShare = (topProductsByProfit.reduce((a, p) => a + p.revenue, 0) / products.reduce((a, p) => a + p.revenue, 0)) * 100;

// Regions
const regionData = REGIONS.map((r) => {
  const revenue = latest.revenue * r.weight * (1 + (rand() - 0.5) * 0.06);
  const yoyGrowth = r.growth * 1000 + (rand() - 0.5) * 2.2;
  const margin = 34 + r.growth * 800 + (rand() - 0.5) * 4;
  return { ...r, revenue, yoyGrowth, margin };
});

// Budget vs Actual (trailing 12 months, by category)
const BVA_CATS = ["Revenue","COGS","Labor","Marketing","Logistics","Utilities","Administrative"];
const trailing12 = companyMonthly.slice(N_MONTHS - 12);
const bvaBase = {
  Revenue: trailing12.reduce((a, m) => a + m.revenue, 0),
  COGS: trailing12.reduce((a, m) => a + m.cogs, 0),
  Labor: trailing12.reduce((a, m) => a + m.sgna, 0) * 0.62,
  Marketing: trailing12.reduce((a, m) => a + m.marketing, 0),
  Logistics: trailing12.reduce((a, m) => a + m.revenue, 0) * 0.052,
  Utilities: trailing12.reduce((a, m) => a + m.revenue, 0) * 0.018,
  Administrative: trailing12.reduce((a, m) => a + m.sgna, 0) * 0.38,
};
const bvaOffsets = { Revenue: -0.024, COGS: 0.086, Labor: 0.031, Marketing: -0.012, Logistics: 0.124, Utilities: 0.028, Administrative: 0.009 };
const bva = BVA_CATS.map((cat) => {
  const actual = bvaBase[cat];
  const budget = actual / (1 + bvaOffsets[cat]);
  const variance = actual - budget;
  const variancePct = (variance / budget) * 100;
  const favorable = cat === "Revenue" ? variance >= 0 : variance <= 0;
  return { cat, budget, actual, variance, variancePct, favorable };
});

// Cost driver waterfall (YoY, latest month vs year ago)
const waterfall = (() => {
  const revChange = latest.revenue - yearAgo.revenue;
  const rawMatImpact = -(latest.cogs - yearAgo.cogs) * 0.66;
  const laborImpact = -(latest.sgna - yearAgo.sgna) * 0.55;
  const energyImpact = -(latest.revenue * 0.018 - yearAgo.revenue * 0.015);
  const marketingImpact = -(latest.marketing - yearAgo.marketing);
  const start = yearAgo.opInc;
  const end = start + revChange + rawMatImpact + laborImpact + energyImpact + marketingImpact;
  return [
    { name: "Prior Op. Profit", value: start, isTotal: true },
    { name: "Revenue Change", value: revChange },
    { name: "Raw Materials", value: rawMatImpact },
    { name: "Labor", value: laborImpact },
    { name: "Energy", value: energyImpact },
    { name: "Marketing", value: marketingImpact },
    { name: "Current Op. Profit", value: end, isTotal: true },
  ];
})();

// Forecast (next 6 months, 3 scenarios)
const FORECAST_MONTHS = 6;
const recent12 = companyMonthly.slice(-12).map((m) => m.revenue);
const avgMoMGrowth = recent12.slice(1).reduce((a, v, i) => a + (v - recent12[i]) / recent12[i], 0) / (recent12.length - 1);
function buildForecast(growthMult, costMult) {
  let rev = latest.revenue;
  const rows = [];
  for (let i = 1; i <= FORECAST_MONTHS; i++) {
    const monthOfYear = (7 + i) % 12;
    const season = seasonalFactor(monthOfYear, 6, 0.08);
    rev = rev * (1 + avgMoMGrowth * growthMult) * (season / seasonalFactor((7 + i - 1) % 12, 6, 0.08));
    const cogsRatio = clamp(latest.cogsRatio ?? latest.cogs / latest.revenue, 0.3, 0.85) * costMult;
    const grossProfit = rev * (1 - cogsRatio);
    rows.push({ month: `+${i}mo`, revenue: rev, grossProfit });
  }
  return rows;
}
const forecastBase = buildForecast(1, 1);
const forecastOptimistic = buildForecast(1.7, 0.985);
const forecastPessimistic = buildForecast(0.3, 1.035);
const forecastChart = forecastBase.map((row, i) => ({
  month: row.month,
  base: row.revenue,
  optimistic: forecastOptimistic[i].revenue,
  pessimistic: forecastPessimistic[i].revenue,
  band: [forecastPessimistic[i].revenue, forecastOptimistic[i].revenue],
}));
const historyForForecast = companyMonthly.slice(-12).map((m) => ({ month: m.label, base: m.revenue, optimistic: null, pessimistic: null, band: null }));
const fullForecastSeries = [...historyForForecast, ...forecastChart];

// Alerts (rule-based)
const alerts = [];
if (revYoY < 0) alerts.push({ sev: "critical", title: "Revenue declined year-over-year", impact: fmtPct(revYoY), cause: "Softening demand across mature segments outpaced growth in Nutrition.", action: "Review pricing and promotional cadence in declining segments." });
COMMODITIES.filter((c) => c.monthlyChg >= 8).forEach((c) => alerts.push({ sev: "high", title: `${c.key} price up ${c.monthlyChg.toFixed(1)}% this month`, impact: `Est. ${(c.monthlyChg * c.elasticity).toFixed(1)}pp margin pressure on ${c.affects}`, cause: `Supply tightness pushing ${c.key.toLowerCase()} futures higher.`, action: `Evaluate hedging position and pass-through pricing for ${c.affects}.` }));
bva.filter((b) => !b.favorable && Math.abs(b.variancePct) >= 8 && b.cat !== "Revenue").forEach((b) => alerts.push({ sev: "high", title: `${b.cat} exceeded budget by ${Math.abs(b.variancePct).toFixed(1)}%`, impact: fmt$(Math.abs(b.variance)), cause: `${b.cat} costs outpaced plan, primarily on input cost inflation.`, action: `Initiate cost review with ${b.cat} category owner.` }));
if (latest.grossMargin < 40) alerts.push({ sev: "medium", title: "Gross margin below 40% target", impact: `${(40 - latest.grossMargin).toFixed(1)}pp shortfall`, cause: "Commodity cost pressure has outpaced pricing actions.", action: "Accelerate procurement hedging and evaluate targeted price increases." });
const decliningRegion = regionData.find((r) => r.yoyGrowth < 0);
if (decliningRegion) alerts.push({ sev: "medium", title: `${decliningRegion.key} sales declining YoY`, impact: fmtPct(decliningRegion.yoyGrowth), cause: "Macro softness and share loss to regional competitors.", action: "Deploy targeted trade investment and review regional pricing architecture." });
if (alerts.length === 0) alerts.push({ sev: "low", title: "No critical alerts", impact: "—", cause: "All monitored metrics within tolerance.", action: "Continue standard monitoring cadence." });

// AI Insights
const bestSegment = [...monthlySegmentData].sort((a, b) => (b.series[N_MONTHS - 1].revenue / b.series[N_MONTHS - 13].revenue) - (a.series[N_MONTHS - 1].revenue / a.series[N_MONTHS - 13].revenue))[0];
const bestSegGrowth = ((bestSegment.series[N_MONTHS - 1].revenue / bestSegment.series[N_MONTHS - 13].revenue) - 1) * 100;
const bestRegion = [...regionData].sort((a, b) => b.yoyGrowth - a.yoyGrowth)[0];
const worstRegion = [...regionData].sort((a, b) => a.yoyGrowth - b.yoyGrowth)[0];
const marginDriver = bva.filter((b) => b.cat !== "Revenue").sort((a, b) => b.variancePct - a.variancePct)[0];

const insights = [
  { what: `Revenue moved ${fmtPct(revYoY)} year-over-year to ${fmt$(latest.revenue)} for the month.`, why: `${bestSegment.key} led growth at ${fmtPct(bestSegGrowth)} YoY, the fastest of any segment.`, impact: `Quarter-to-date revenue stands at ${fmt$(quarterRevenue, 0)}.`, action: `Prioritize working capital and production capacity toward ${bestSegment.key}.` },
  { what: `Operating margin is ${latest.opMargin.toFixed(1)}%, ${(latest.opMargin - yearAgo.opMargin >= 0 ? "up" : "down")} ${Math.abs(latest.opMargin - yearAgo.opMargin).toFixed(1)}pp YoY.`, why: `${marginDriver.cat} ran ${fmtPct(marginDriver.variancePct)} versus budget, the largest unfavorable driver.`, impact: `Represents roughly ${fmt$(Math.abs(marginDriver.variance))} of trailing-12-month cost pressure.`, action: `Open a variance review with the ${marginDriver.cat} category owner this cycle.` },
  { what: `The top 20 products (of 100) generate ${top20ProfitShare.toFixed(0)}% of gross profit from ${top20RevShare.toFixed(0)}% of revenue.`, why: `Profit is concentrated in high-margin, high-turn SKUs rather than spread evenly across the portfolio.`, impact: `Portfolio is efficient but concentration risk is elevated if any top SKU is disrupted.`, action: `Protect distribution and shelf space for top-quartile SKUs; review or reformulate bottom-quartile items.` },
  { what: `${bestRegion.key} is the strongest region at ${fmtPct(bestRegion.yoyGrowth)} YoY growth with ${bestRegion.margin.toFixed(1)}% margin.`, why: `Regional growth and margin both exceed the company average, indicating durable demand rather than discounting.`, impact: `${worstRegion.key} is the softest region at ${fmtPct(worstRegion.yoyGrowth)} YoY.`, action: `Shift incremental marketing investment toward ${bestRegion.key} while stabilizing ${worstRegion.key} through targeted trade spend.` },
];

// Health score
function scoreFrom(value, target, tolerance) {
  return clamp(50 + ((value - target) / tolerance) * 50, 0, 100);
}
const healthSub = [
  { label: "Revenue Performance", score: scoreFrom(revYoY, 3, 8) },
  { label: "Profitability", score: scoreFrom(latest.opMargin, 14, 6) },
  { label: "Liquidity", score: scoreFrom(1.62, 1.5, 0.4) },
  { label: "Efficiency", score: scoreFrom(7.4, 7.0, 1.5) },
  { label: "Growth", score: scoreFrom(bestSegGrowth, 8, 15) },
  { label: "Forecast Risk", score: scoreFrom(-Math.abs(forecastPessimistic[5].revenue - forecastOptimistic[5].revenue) / forecastBase[5].revenue * 100, -18, 10) },
];
const healthScore = healthSub.reduce((a, s) => a + s.score, 0) / healthSub.length;
const healthLabel = healthScore >= 92 ? "Excellent" : healthScore >= 75 ? "Healthy" : healthScore >= 60 ? "Watch" : "Critical";
const healthColor = healthScore >= 92 ? "#5b9279" : healthScore >= 75 ? "#7ca17f" : healthScore >= 60 ? "#c9a24b" : "#c1543f";

/* ============================== EXPANSION: CUSTOMER ANALYTICS ============================== */

const CUSTOMER_TYPES = ["Retail", "Wholesale", "Distributor", "Grocery Chain", "Restaurant", "E-commerce"];
const CUST_PREFIX = ["Summit", "Northgate", "Coastal", "Union", "Meridian", "Harborview", "Prairie", "Cedar", "Bluepoint", "Ironwood", "Silverline", "Fairview", "Redwood", "Lakeside", "Trailhead"];
const CUST_SUFFIX = { Retail: "Retail Group", Wholesale: "Wholesale Partners", Distributor: "Distribution Co.", "Grocery Chain": "Grocery Chain", Restaurant: "Restaurant Group", "E-commerce": "Digital Commerce" };
const customers = Array.from({ length: 500 }, (_, i) => {
  const type = CUSTOMER_TYPES[Math.floor(rand() * CUSTOMER_TYPES.length)];
  const revenue = Math.pow(rand(), 3) * 38 + 0.15;
  const marginPct = clamp(30 + (rand() - 0.5) * 24, 6, 55);
  const grossProfit = revenue * (marginPct / 100);
  const growth = (rand() - 0.4) * 26;
  const name = `${CUST_PREFIX[Math.floor(rand() * CUST_PREFIX.length)]} ${CUST_SUFFIX[type]}`;
  return { id: i, name, type, revenue, grossProfit, marginPct, growth };
});
const customersSorted = [...customers].sort((a, b) => b.revenue - a.revenue);
const totalCustomerRevenue = customers.reduce((a, c) => a + c.revenue, 0);
const top10CustomerRevenue = customersSorted.slice(0, 10).reduce((a, c) => a + c.revenue, 0);
const top10CustomerShare = (top10CustomerRevenue / totalCustomerRevenue) * 100;
const customerConcentrationRisk = top10CustomerShare >= 45 ? "High" : top10CustomerShare >= 30 ? "Medium" : "Low";
const paretoData = (() => {
  let cum = 0;
  return customersSorted.slice(0, 60).map((c, i) => {
    cum += c.revenue;
    return { rank: i + 1, cumPct: (cum / totalCustomerRevenue) * 100 };
  });
})();
const medianCustRev = customersSorted[Math.floor(customers.length / 2)].revenue;
const medianCustProfit = [...customers].sort((a, b) => a.grossProfit - b.grossProfit)[Math.floor(customers.length / 2)].grossProfit;
function customerQuadrantOf(c) {
  if (c.revenue >= medianCustRev && c.grossProfit >= medianCustProfit) return "Strategic Customers";
  if (c.revenue >= medianCustRev && c.grossProfit < medianCustProfit) return "Margin Risk";
  if (c.revenue < medianCustRev && c.grossProfit >= medianCustProfit) return "Growth Opportunity";
  return "Review Customer";
}
const CUSTOMER_QUADRANT_COLOR = { "Strategic Customers": "#c9a24b", "Margin Risk": "#c1543f", "Growth Opportunity": "#5b9279", "Review Customer": "#6b7280" };
const customerScatterSample = customers.filter((_, i) => i % 4 === 0);
const topCustomersByRevenue = customersSorted.slice(0, 12);

/* ============================== EXPANSION: ABC ANALYSIS ============================== */

const productsByRevDesc = [...products].sort((a, b) => b.revenue - a.revenue);
const totalProductRevenue = products.reduce((a, p) => a + p.revenue, 0);
const abcGroups = [
  { key: "A", label: "A Products", items: productsByRevDesc.slice(0, 20), strategy: "Protect inventory & service levels" },
  { key: "B", label: "B Products", items: productsByRevDesc.slice(20, 50), strategy: "Optimize cost and promotional support" },
  { key: "C", label: "C Products", items: productsByRevDesc.slice(50), strategy: "Reduce complexity; evaluate rationalization" },
].map((g) => ({ ...g, revenueShare: (g.items.reduce((a, p) => a + p.revenue, 0) / totalProductRevenue) * 100, countShare: (g.items.length / products.length) * 100 }));

/* ============================== EXPANSION: PRODUCT LIFECYCLE ============================== */

function lifecycleOf(p) {
  if (p.growth >= 15) return "Introduction";
  if (p.growth >= 6) return "Growth";
  if (p.growth >= -4) return "Maturity";
  return "Decline";
}
const LIFECYCLE_ACTION = { Introduction: "Invest in distribution and awareness.", Growth: "Increase distribution and production capacity.", Maturity: "Optimize costs and defend margin.", Decline: "Reduce inventory and evaluate discontinuation." };
const LIFECYCLE_COLOR = { Introduction: "#5b9279", Growth: "#c9a24b", Maturity: "#8891A0", Decline: "#c1543f" };
const lifecycleGroups = ["Introduction", "Growth", "Maturity", "Decline"].map((stage) => {
  const items = products.filter((p) => lifecycleOf(p) === stage);
  return { stage, count: items.length, revenue: items.reduce((a, p) => a + p.revenue, 0) };
});

/* ============================== EXPANSION: SALES MIX ============================== */

const segRevTrailing12 = SEGMENTS.map((seg, si) => monthlySegmentData[si].series.slice(-12).reduce((a, m) => a + m.revenue, 0));
const segRevTrailing12Prev = SEGMENTS.map((seg, si) => monthlySegmentData[si].series.slice(-24, -12).reduce((a, m) => a + m.revenue, 0));
const totalTrailing12 = segRevTrailing12.reduce((a, v) => a + v, 0);
const totalTrailing12Prev = segRevTrailing12Prev.reduce((a, v) => a + v, 0);
const salesMixBase = SEGMENTS.map((seg, i) => ({
  segment: seg.key,
  currentShare: (segRevTrailing12[i] / totalTrailing12) * 100,
  previousShare: (segRevTrailing12Prev[i] / totalTrailing12Prev) * 100,
  margin: (1 - seg.cogsBase) * 100,
}));
const sortedByMargin = [...salesMixBase].sort((a, b) => b.margin - a.margin);
const highMarginSeg = sortedByMargin[0].segment;
const lowMarginSeg = sortedByMargin[sortedByMargin.length - 1].segment;
const salesMix = salesMixBase.map((s) => {
  let optimalShare = s.currentShare;
  if (s.segment === highMarginSeg) optimalShare += 5;
  if (s.segment === lowMarginSeg) optimalShare -= 5;
  return { ...s, optimalShare: Math.max(optimalShare, 2) };
});
const avgSegShare = 100 / SEGMENTS.length;
const focusFlag = salesMix.find((s) => s.segment === highMarginSeg).currentShare < avgSegShare;

/* ============================== EXPANSION: WORKING CAPITAL ============================== */

const workingCapitalSeries = trailing12.map((m, i) => {
  const dso = 42 + i * 1.2 + (rand() - 0.5) * 2;
  const dio = 45 + i * 1.05 + (rand() - 0.5) * 2.5;
  const dpo = 36 + (rand() - 0.5) * 2;
  const ar = (m.revenue / 30) * dso;
  const inv = (m.cogs / 30) * dio;
  const ap = (m.cogs / 30) * dpo;
  const cash = 180 + (rand() - 0.5) * 20 - i * 0.4;
  return { label: m.label, dso, dio, dpo, ccc: dso + dio - dpo, ar, inv, ap, cash };
});
const wcFirst = workingCapitalSeries[0];
const wcLast = workingCapitalSeries[workingCapitalSeries.length - 1];
const dioIncreaseCashImpact = ((wcLast.dio - wcFirst.dio) / 30) * latest.cogs;
const currentRatioWC = (wcLast.ar + wcLast.inv + wcLast.cash) / (wcLast.ap + latest.revenue * 0.08);
const quickRatioWC = (wcLast.ar + wcLast.cash) / (wcLast.ap + latest.revenue * 0.08);

/* ============================== EXPANSION: INVENTORY OPTIMIZATION ============================== */

const INV_STATUS = ["Critical", "Low Stock", "Healthy", "Overstock", "Dead Stock"];
const INV_STATUS_COLOR = { Critical: "#c1543f", "Low Stock": "#d97767", Healthy: "#5b9279", Overstock: "#c9a24b", "Dead Stock": "#8b5cf6" };
const inventoryItems = products.map((p) => {
  const daysOfInventory = clamp(20 + rand() * 90, 5, 140);
  let status;
  if (daysOfInventory < 15) status = "Critical";
  else if (daysOfInventory < 30) status = "Low Stock";
  else if (daysOfInventory < 60) status = "Healthy";
  else if (daysOfInventory < 100) status = "Overstock";
  else status = "Dead Stock";
  const turnover = 365 / daysOfInventory;
  const excessPct = status === "Overstock" || status === "Dead Stock" ? ((daysOfInventory - 55) / 55) * 100 : 0;
  const exposure = excessPct > 0 ? p.revenue * (1 - p.marginPct / 100) * (excessPct / 100) * 0.5 : 0;
  return { ...p, daysOfInventory, status, turnover, excessPct, exposure };
});
const inventoryByStatus = INV_STATUS.map((s) => ({ status: s, count: inventoryItems.filter((i) => i.status === s).length, exposure: inventoryItems.filter((i) => i.status === s).reduce((a, i) => a + i.exposure, 0) }));
const worstOverstock = [...inventoryItems].sort((a, b) => b.exposure - a.exposure)[0];

/* ============================== EXPANSION: 13-WEEK CASH FLOW ============================== */

const CASH_MIN_THRESHOLD = 50;
const cashFlow13 = (() => {
  let cash = 92;
  const rows = [];
  for (let w = 1; w <= 13; w++) {
    const collections = (latest.revenue / 4.33) * (1 + (rand() - 0.5) * 0.08);
    const supplierPayments = -(latest.cogs / 4.33) * (1 + (rand() - 0.5) * 0.1);
    const payroll = -(latest.sgna / 4.33) * 0.55;
    const marketing = -(latest.marketing / 4.33);
    const capex = w % 4 === 0 ? -8.5 : -1.2;
    const debt = w === 6 || w === 12 ? -14 : 0;
    const net = collections + supplierPayments + payroll + marketing + capex + debt;
    cash += net;
    rows.push({ week: `W${w}`, collections, supplierPayments, payroll, marketing, capex, debt, net, endingCash: cash, belowThreshold: cash < CASH_MIN_THRESHOLD });
  }
  return rows;
})();
const cashRiskWeek = cashFlow13.find((r) => r.belowThreshold);

/* ============================== EXPANSION: MARKETING ROI ============================== */

const CAMPAIGN_NAMES = ["Summer Refresh Push", "Holiday Snack Bundle", "Back-to-School Nutrition", "New Year Wellness", "Retail Endcap Beverages", "Digital Sampling – Dairy", "Influencer Snacks Series", "Frozen Meal Convenience", "E-commerce Prime Days", "Regional TV – APAC", "Loyalty App Relaunch", "Protein Trial Kits"];
const marketingCampaigns = CAMPAIGN_NAMES.map((name, i) => {
  const spend = 1.2 + rand() * 8.5;
  const roiMultiple = 1.4 + (rand() - 0.35) * 2.4;
  const revenueGenerated = spend * Math.max(roiMultiple, 0.3);
  const incrementalRevenue = revenueGenerated * (0.4 + rand() * 0.3);
  const roi = (incrementalRevenue - spend) / spend;
  const tier = roi >= 1.2 ? "High ROI" : roi >= 0.3 ? "Average ROI" : "Low ROI";
  const recommendation = tier === "High ROI" ? "Increase investment" : tier === "Average ROI" ? "Maintain investment" : "Reduce investment";
  return { id: i, name, spend, revenueGenerated, incrementalRevenue, roi, tier, recommendation };
});
const avgMarketingROI = marketingCampaigns.reduce((a, c) => a + c.roi, 0) / marketingCampaigns.length;

/* ============================== EXPANSION: RISK HEATMAP ============================== */

const riskCategories = [
  { name: "Commodity Risk", probability: 3, impact: 3, exposure: Math.abs(waterfall.find((w) => w.name === "Raw Materials")?.value || 18) * 1.2 },
  { name: "Supply Chain Risk", probability: 2, impact: 3, exposure: 22 },
  { name: "Customer Concentration", probability: 2, impact: 4, exposure: top10CustomerRevenue * 1.5 },
  { name: "Margin Risk", probability: latest.grossMargin < 40 ? 3 : 2, impact: 3, exposure: Math.abs(40 - latest.grossMargin) * latest.revenue * 0.12 },
  { name: "Inventory Risk", probability: 2, impact: 2, exposure: inventoryByStatus.reduce((a, i) => a + i.exposure, 0) },
  { name: "Liquidity Risk", probability: cashRiskWeek ? 3 : 1, impact: 3, exposure: cashRiskWeek ? (CASH_MIN_THRESHOLD - cashRiskWeek.endingCash) * 2 : 6 },
  { name: "Demand Risk", probability: 2, impact: 2, exposure: 15 },
  { name: "Labor Risk", probability: 1, impact: 2, exposure: 9 },
].map((r) => {
  const score = r.probability * r.impact;
  const level = score >= 10 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";
  return { ...r, level, probLabel: ["", "Low", "Medium", "High"][r.probability], impactLabel: ["", "Low", "Medium", "High", "Critical"][r.impact] };
});
const RISK_LEVEL_COLOR = { Critical: "#c1543f", High: "#d97767", Medium: "#c9a24b", Low: "#5b9279" };

/* ============================== EXPANSION: PERFORMANCE SCORECARD ============================== */

const scorecard = [
  { dept: "Finance", metrics: [{ label: "Revenue Growth", score: scoreFrom(revYoY, 3, 8) }, { label: "Operating Margin", score: scoreFrom(latest.opMargin, 14, 6) }, { label: "Cash Flow", score: cashRiskWeek ? 45 : 78 }, { label: "Working Capital", score: scoreFrom(-wcLast.ccc, -55, 10) }] },
  { dept: "Sales", metrics: [{ label: "Customer Growth", score: scoreFrom(customers.reduce((a, c) => a + c.growth, 0) / customers.length, 5, 8) }, { label: "Revenue", score: scoreFrom(revYoY, 3, 8) }, { label: "Volume Growth", score: scoreFrom(bestSegGrowth, 8, 15) }] },
  { dept: "Operations", metrics: [{ label: "Cost Efficiency", score: scoreFrom(-marginDriver.variancePct, -5, 10) }, { label: "Inventory Turnover", score: scoreFrom(7.4, 7.0, 1.5) }, { label: "Production Efficiency", score: 74 }] },
  { dept: "Supply Chain", metrics: [{ label: "Logistics Cost", score: scoreFrom(-bva.find((b) => b.cat === "Logistics").variancePct, -5, 12) }, { label: "Stockout Rate", score: scoreFrom(-inventoryByStatus.find((i) => i.status === "Critical").count, -8, 6) }, { label: "Inventory Risk", score: scoreFrom(-inventoryByStatus.reduce((a, i) => a + i.exposure, 0), -20, 15) }] },
  { dept: "Marketing", metrics: [{ label: "Marketing ROI", score: scoreFrom(avgMarketingROI * 100, 40, 40) }, { label: "Customer Acquisition", score: scoreFrom(customers.reduce((a, c) => a + c.growth, 0) / customers.length, 5, 8) }, { label: "Revenue Growth", score: scoreFrom(revYoY, 3, 8) }] },
].map((d) => ({ ...d, score: d.metrics.reduce((a, m) => a + m.score, 0) / d.metrics.length }));

/* ============================== EXPANSION: PRICING & BREAK-EVEN ============================== */

const pricingProducts = productsByRevDesc.slice(0, 8).map((p) => {
  const price = 2 + rand() * 6;
  const unitCost = price * (1 - p.marginPct / 100);
  const elasticity = 0.8 + rand() * 1.4;
  const qty = (p.revenue * 1e6) / price;
  let best = { pct: 0, profit: -Infinity };
  for (let pct = -15; pct <= 15; pct += 1) {
    const newPrice = price * (1 + pct / 100);
    const newQty = qty * (1 + (-elasticity * pct) / 100);
    const newProfit = ((newPrice - unitCost) * newQty) / 1e6;
    if (newProfit > best.profit) best = { pct, profit: newProfit };
  }
  return { ...p, price, unitCost, elasticity, qty, optimalPct: best.pct, optimalProfit: best.profit };
});
function simulatePriceChange(pp, pct) {
  const newPrice = pp.price * (1 + pct / 100);
  const newQty = pp.qty * (1 + (-pp.elasticity * pct) / 100);
  const newRevenue = (newPrice * newQty) / 1e6;
  const newProfit = ((newPrice - pp.unitCost) * newQty) / 1e6;
  return { newRevenue, newProfit };
}
const breakEvenProducts = productsByRevDesc.slice(0, 8).map((p, i) => {
  const price = pricingProducts[i].price;
  const variableCostPerUnit = price * (1 - p.marginPct / 100);
  const contributionMarginPerUnit = price - variableCostPerUnit;
  const fixedCost = p.revenue * 1e6 * 0.14;
  const breakEvenUnits = fixedCost / contributionMarginPerUnit;
  const currentUnits = (p.revenue * 1e6) / price;
  const safetyMarginPct = ((currentUnits - breakEvenUnits) / currentUnits) * 100;
  return { ...p, price, variableCostPerUnit, contributionMarginPerUnit, fixedCost, breakEvenUnits, currentUnits, safetyMarginPct };
});

/* ============================== EXPANSION: ACTION CENTER ============================== */

function ownerFor(title) {
  const t = title.toLowerCase();
  if (/cocoa|coffee|sugar|wheat|corn|soybean/.test(t)) return "Procurement";
  if (/budget|exceeded|margin/.test(t)) return "Finance";
  if (/region|declin/.test(t)) return "Commercial";
  if (/revenue/.test(t)) return "Commercial";
  return "Operations";
}
const actionCenterItems = [
  ...alerts.filter((a) => a.sev !== "low").map((a, i) => ({ id: `alert-${i}`, priority: a.sev, title: a.title, impact: a.impact, owner: ownerFor(a.title), action: a.action })),
  { id: "risk-customer", priority: "high", title: `Top 10 customers represent ${top10CustomerShare.toFixed(0)}% of revenue`, impact: fmt$(top10CustomerRevenue), owner: "Commercial", action: "Diversify account base and formalize key-account retention plans." },
  { id: "risk-inventory", priority: worstOverstock.exposure > 1 ? "medium" : "low", title: `${worstOverstock.name} inventory projected in overstock`, impact: fmt$(worstOverstock.exposure), owner: "Supply Chain", action: "Reduce replenishment orders and evaluate promotional clearance." },
  ...(cashRiskWeek ? [{ id: "risk-cash", priority: "critical", title: `Projected cash balance falls below $${CASH_MIN_THRESHOLD}M minimum in ${cashRiskWeek.week}`, impact: fmt$(CASH_MIN_THRESHOLD - cashRiskWeek.endingCash), owner: "Treasury", action: "Review short-term financing options and delay discretionary capex." }] : []),
];
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
actionCenterItems.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

/* ============================== EXPANSION: MONTH-END CLOSE ============================== */

const closeStages = [
  { name: "Data Collection", progress: 100 },
  { name: "Reconciliation", progress: 85 },
  { name: "Variance Review", progress: 60 },
  { name: "Management Review", progress: 25 },
  { name: "Final Reporting", progress: 0 },
];
const closeOutstandingTasks = [
  "Reconcile cocoa hedge accrual with treasury ledger",
  `Resolve ${marginDriver.cat} budget variance of ${fmtPct(marginDriver.variancePct)}`,
  "Confirm intercompany eliminations for Europe segment",
  "Obtain CFO sign-off on forecast re-class entries",
];
const closeCriticalVariances = bva.filter((b) => !b.favorable && Math.abs(b.variancePct) >= 5);

/* ============================== EXPANSION: CFO SUMMARY ============================== */

const topRisksByExposure = [...riskCategories].sort((a, b) => b.exposure - a.exposure).slice(0, 3);
const topActionItems = actionCenterItems.slice(0, 3);

/* ============================== EXPANSION: DECISION SIMULATOR ENGINE ============================== */

const ZERO_SLIDERS = { price: 0, volume: 0, rawMaterial: 0, labor: 0, marketing: 0, logistics: 0, currency: 0 };
function computeScenario(s) {
  const priceMult = 1 + s.price / 100;
  const volMult = 1 + s.volume / 100;
  const revenue = latest.revenue * priceMult * volMult * (1 + s.currency / 100);
  const cogs = latest.cogs * volMult * (1 + s.rawMaterial / 100);
  const grossProfit = revenue - cogs;
  const sgna = latest.sgna * (1 + s.labor / 100);
  const marketing = latest.marketing * (1 + s.marketing / 100);
  const logistics = latest.revenue * 0.052 * (1 + s.logistics / 100);
  const opInc = grossProfit - sgna - marketing - logistics - latest.rnd - latest.da;
  const netIncome = opInc * 0.76;
  return { revenue, cogs, grossProfit, grossMargin: (grossProfit / revenue) * 100, sgna, marketing, logistics, opInc, opMargin: (opInc / revenue) * 100, netIncome };
}
const baseScenario = computeScenario(ZERO_SLIDERS);
function buildRecommendation(s, sim) {
  const marginDelta = sim.grossMargin - baseScenario.grossMargin;
  const opDelta = sim.opInc - baseScenario.opInc;
  const parts = [];
  if (s.price !== 0) parts.push(`the ${Math.abs(s.price)}% price ${s.price > 0 ? "increase" : "decrease"}`);
  if (s.rawMaterial !== 0) parts.push(`a ${Math.abs(s.rawMaterial)}% ${s.rawMaterial > 0 ? "increase" : "decrease"} in raw material costs`);
  if (s.volume !== 0) parts.push(`a ${Math.abs(s.volume)}% ${s.volume > 0 ? "increase" : "decrease"} in sales volume`);
  if (s.marketing !== 0) parts.push(`a ${Math.abs(s.marketing)}% change in marketing spend`);
  const driverText = parts.length ? parts.join(", combined with ") : "the current baseline assumptions";
  const direction = opDelta >= 0 ? "improves" : "reduces";
  const marginNote = marginDelta < -1
    ? "Management should consider additional procurement savings or a targeted price adjustment to protect margin."
    : opDelta > 0
    ? "This scenario is accretive to operating income and merits further validation before implementation."
    : "The net effect on profitability is limited; monitor before committing incremental investment.";
  return `Under ${driverText}, operating income ${direction} by ${fmt$(Math.abs(opDelta))} and gross margin moves ${marginDelta >= 0 ? "up" : "down"} ${Math.abs(marginDelta).toFixed(1)}pp to ${sim.grossMargin.toFixed(1)}%. ${marginNote}`;
}

/* ============================== UI PRIMITIVES ============================== */

function TrendChip({ value, isPP, isX, ok }) {
  const Icon = value > 0.05 ? TrendingUp : value < -0.05 ? TrendingDown : Minus;
  const color = ok === false ? "#c1543f" : value >= 0 ? "#5b9279" : "#c1543f";
  const suffix = isPP ? "pp" : isX ? "x" : "%";
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs" style={{ color }}>
      <Icon size={13} strokeWidth={2.5} />
      {value >= 0 ? "+" : ""}{value.toFixed(2)}{suffix}
    </span>
  );
}

function StatusDot({ ok }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: ok ? "#5b9279" : "#c1543f", boxShadow: `0 0 6px ${ok ? "#5b9279" : "#c1543f"}` }} />;
}

function KPICard({ kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="gh-card p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-stone-400">
          <Icon size={14} />
          <span className="text-[11px] uppercase tracking-wider font-medium gh-display">{kpi.label}</span>
        </div>
        <StatusDot ok={kpi.ok} />
      </div>
      <div className="font-mono text-2xl text-stone-50 tabular-nums">{kpi.value}</div>
      <div className="flex items-center justify-between">
        <TrendChip value={kpi.change} isPP={kpi.isPP} isX={kpi.isX} ok={kpi.ok} />
        <span className="text-[10px] text-stone-500 font-mono">{kpi.target}</span>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={16} className="text-amber-400" />}
      <div>
        {eyebrow && <div className="text-[10px] uppercase tracking-widest text-stone-500 gh-display">{eyebrow}</div>}
        <h2 className="text-stone-100 text-base font-semibold gh-display">{title}</h2>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-stone-950 border border-stone-700 rounded px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-stone-400 mb-1">{label}</div>
      {payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {formatter ? formatter(p.value) : p.value}</div>
      ))}
    </div>
  );
};

/* ============================== TICKER TAPE (signature) ============================== */

function TickerTape() {
  const items = [...COMMODITIES, ...COMMODITIES];
  return (
    <div className="w-full overflow-hidden border-b border-stone-800 bg-black/40">
      <div className="gh-marquee flex items-center gap-8 py-2 whitespace-nowrap">
        {items.map((c, i) => (
          <div key={i} className="flex items-center gap-2 px-2">
            <span className="text-[11px] uppercase tracking-wide text-stone-400 gh-display">{c.key}</span>
            <span className="font-mono text-sm text-stone-100">{c.price.toLocaleString()}</span>
            <span className="text-stone-600 text-xs">{c.unit}</span>
            <span className={`font-mono text-xs flex items-center gap-0.5 ${c.dailyChg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {c.dailyChg >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {fmtPct(c.dailyChg)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== TABS ============================== */

function ExecutiveTab({ period = 24 }) {
  const chartData = companyMonthly.slice(-period).map((m) => ({ month: m.label, revenue: m.revenue, opInc: m.opInc }));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => <KPICard key={k.label} kpi={k} />)}
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow={`Trailing ${period} Months`} title="Revenue & Operating Income" icon={BarChart3} />
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#8891A0", fontSize: 10 }} interval={2} axisLine={{ stroke: "#44403c" }} tickLine={false} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8891A0" }} />
            <Bar dataKey="revenue" name="Revenue" fill="#c9a24b" radius={[3, 3, 0, 0]} />
            <Line dataKey="opInc" name="Operating Income" stroke="#5b9279" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="gh-card p-4">
          <SectionTitle eyebrow="AI Insight Engine" title="What's driving the business" icon={Sparkles} />
          <div className="flex flex-col gap-3">
            {insights.slice(0, 2).map((ins, i) => (
              <div key={i} className="border border-stone-800 rounded-md p-3 bg-black/20">
                <p className="text-stone-200 text-sm leading-snug">{ins.what}</p>
                <p className="text-stone-400 text-xs mt-1.5"><span className="text-amber-400/80 font-medium">Why: </span>{ins.why}</p>
                <p className="text-stone-400 text-xs mt-1"><span className="text-amber-400/80 font-medium">Action: </span>{ins.action}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="gh-card p-4">
          <SectionTitle eyebrow="Composite Score" title="Business Health" icon={Gauge} />
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#292524" strokeWidth="9" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={healthColor} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${(healthScore / 100) * 264} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl text-stone-50">{healthScore.toFixed(0)}</span>
                <span className="text-[10px] uppercase tracking-wide" style={{ color: healthColor }}>{healthLabel}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {healthSub.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400 w-32 shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: s.score >= 60 ? "#5b9279" : "#c1543f" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ segment = "All" }) {
  const filteredProducts = segment === "All" ? products : products.filter((p) => p.segment === segment);
  const filteredTop10 = [...filteredProducts].sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 10);
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow={segment === "All" ? "100 SKUs · Segment-Coded" : `${filteredProducts.length} SKUs · ${segment}`} title="Product Profitability Matrix" icon={Package} />
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis type="number" dataKey="revenue" name="Revenue" unit="M" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} label={{ value: "Annual Revenue ($M)", position: "insideBottom", offset: -5, fill: "#8891A0", fontSize: 11 }} />
            <YAxis type="number" dataKey="grossProfit" name="Gross Profit" unit="M" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Gross Profit ($M)", angle: -90, position: "insideLeft", fill: "#8891A0", fontSize: 11 }} />
            <ZAxis type="number" dataKey="marginPct" range={[30, 300]} />
            <ReferenceLine x={medianRev} stroke="#57534e" strokeDasharray="4 4" />
            <ReferenceLine y={medianProfit} stroke="#57534e" strokeDasharray="4 4" />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="bg-stone-950 border border-stone-700 rounded px-3 py-2 text-xs font-mono shadow-xl">
                  <div className="text-stone-100 mb-1">{p.name}</div>
                  <div className="text-stone-400">{p.segment} · {quadrantOf(p)}</div>
                  <div className="text-stone-300 mt-1">Revenue: {fmt$(p.revenue)}</div>
                  <div className="text-stone-300">Gross Profit: {fmt$(p.grossProfit)}</div>
                  <div className="text-stone-300">Margin: {p.marginPct.toFixed(1)}%</div>
                </div>
              );
            }} />
            {["Star Products", "Margin Improvement", "Growth Opportunity", "Review Candidate"].map((quad) => (
              <Scatter key={quad} name={quad} data={filteredProducts.filter((p) => quadrantOf(p) === quad)} fill={QUADRANT_COLOR[quad]} fillOpacity={0.75} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
          {Object.entries(QUADRANT_COLOR).map(([k, c]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-stone-400"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{k}</div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="gh-card p-4">
          <SectionTitle eyebrow="Ranked by Profit" title="Top 10 Products" />
          <div className="flex flex-col gap-1.5">
            {filteredTop10.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-stone-800/60 last:border-0">
                <span className="font-mono text-xs text-stone-600 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-200 truncate">{p.name}</div>
                  <div className="text-[10px] text-stone-500">{p.segment}</div>
                </div>
                <div className="text-right font-mono text-sm text-amber-400">{fmt$(p.grossProfit)}</div>
                <TrendChip value={p.growth} />
              </div>
            ))}
          </div>
        </div>
        <div className="gh-card p-4">
          <SectionTitle eyebrow="Concentration Risk" title="Portfolio Concentration" icon={Sparkles} />
          <div className="flex items-center justify-center py-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={[{ name: "Top 20 SKUs", value: top20ProfitShare }, { name: "Remaining 80 SKUs", value: 100 - top20ProfitShare }]}
                  dataKey="value" innerRadius={55} outerRadius={78} paddingAngle={3}>
                  <Cell fill="#c9a24b" /><Cell fill="#3f3a34" />
                </Pie>
                <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-stone-300 text-center">Top 20 SKUs generate <span className="text-amber-400 font-mono">{top20ProfitShare.toFixed(0)}%</span> of gross profit from <span className="text-amber-400 font-mono">{top20RevShare.toFixed(0)}%</span> of revenue.</p>
        </div>
      </div>
    </div>
  );
}

function GeographyTab({ region = "All" }) {
  const filteredRegions = region === "All" ? regionData : regionData.filter((r) => r.key === region);
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow={region === "All" ? "Global → Region" : `Filtered: ${region}`} title="Regional Performance" icon={Globe2} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={filteredRegions} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
            <YAxis type="category" dataKey="key" tick={{ fill: "#c7c2b8", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <Bar dataKey="revenue" name="Revenue" radius={[0, 3, 3, 0]}>
              {filteredRegions.map((r, i) => <Cell key={i} fill={r.yoyGrowth >= 0 ? "#c9a24b" : "#c1543f"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="gh-card p-0 overflow-hidden">
        <div className="p-4 pb-0"><SectionTitle title="Region Detail" /></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-4 py-2 font-medium">Region</th>
              <th className="px-4 py-2 font-medium text-right">Revenue</th>
              <th className="px-4 py-2 font-medium text-right">YoY Growth</th>
              <th className="px-4 py-2 font-medium text-right">Margin</th>
              <th className="px-4 py-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegions.map((r) => (
              <tr key={r.key} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                <td className="px-4 py-2.5 text-stone-200">{r.key}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-200">{fmt$(r.revenue)}</td>
                <td className="px-4 py-2.5 text-right"><TrendChip value={r.yoyGrowth} /></td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-300">{r.margin.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{
                    background: r.yoyGrowth >= 2 ? "#5b927930" : r.yoyGrowth >= 0 ? "#c9a24b30" : "#c1543f30",
                    color: r.yoyGrowth >= 2 ? "#7ca17f" : r.yoyGrowth >= 0 ? "#d9b968" : "#d97767",
                  }}>{r.yoyGrowth >= 2 ? "High Growth" : r.yoyGrowth >= 0 ? "Stable" : "Declining"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BudgetTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow="Trailing 12 Months" title="Budget vs. Actual" icon={BarChart3} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bva}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="cat" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8891A0" }} />
            <Bar dataKey="budget" name="Budget" fill="#57534e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill="#c9a24b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="gh-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium text-right">Budget</th>
              <th className="px-4 py-2.5 font-medium text-right">Actual</th>
              <th className="px-4 py-2.5 font-medium text-right">Variance</th>
              <th className="px-4 py-2.5 font-medium text-right">Variance %</th>
              <th className="px-4 py-2.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {bva.map((b) => (
              <tr key={b.cat} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                <td className="px-4 py-2.5 text-stone-200">{b.cat}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-400">{fmt$(b.budget, 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-200">{fmt$(b.actual, 0)}</td>
                <td className={`px-4 py-2.5 text-right font-mono ${b.favorable ? "text-emerald-400" : "text-red-400"}`}>{b.variance >= 0 ? "+" : ""}{fmt$(b.variance, 1)}</td>
                <td className={`px-4 py-2.5 text-right font-mono ${b.favorable ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(b.variancePct)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: b.favorable ? "#5b927930" : "#c1543f30", color: b.favorable ? "#7ca17f" : "#d97767" }}>
                    {b.favorable ? "Favorable" : "Unfavorable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="YoY Bridge" title="Operating Profit Waterfall" icon={Activity} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={waterfall.map((w, i) => {
            let base = 0;
            for (let j = 0; j < i; j++) if (!waterfall[j].isTotal) base += waterfall[j].value; else if (j === 0) base = waterfall[j].value;
            return { ...w, base: w.isTotal ? 0 : (w.value >= 0 ? base : base + w.value) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={55} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[3, 3, 3, 3]}>
              {waterfall.map((w, i) => <Cell key={i} fill={w.isTotal ? "#c9a24b" : w.value >= 0 ? "#5b9279" : "#c1543f"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CommodityTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid md:grid-cols-2 gap-4">
        {COMMODITIES.map((c) => {
          const alert = c.monthlyChg >= 8;
          return (
            <div key={c.key} className="gh-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display">{c.affects} Exposure</div>
                  <div className="text-stone-100 font-semibold gh-display">{c.key}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg text-stone-50">{c.price.toLocaleString()}</div>
                  <div className="text-[11px] text-stone-500">{c.unit}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs font-mono">
                <div><span className="text-stone-500">1D </span><span className={c.dailyChg >= 0 ? "text-emerald-400" : "text-red-400"}>{fmtPct(c.dailyChg)}</span></div>
                <div><span className="text-stone-500">1M </span><span className={c.monthlyChg >= 0 ? "text-emerald-400" : "text-red-400"}>{fmtPct(c.monthlyChg)}</span></div>
                <div><span className="text-stone-500">Vol </span><span className="text-stone-300">{c.vol.toFixed(1)}%</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-800 text-xs text-stone-400 leading-relaxed">
                A {Math.abs(c.monthlyChg).toFixed(0)}% {c.monthlyChg >= 0 ? "increase" : "decrease"} in {c.key.toLowerCase()} is estimated to {c.monthlyChg >= 0 ? "reduce" : "improve"} {c.affects} gross margin by approximately <span className="font-mono text-stone-200">{(Math.abs(c.monthlyChg) * c.elasticity).toFixed(1)}pp</span>.
              </div>
              {alert && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400">
                  <AlertTriangle size={12} /> Risk alert: monthly move exceeds 8% threshold
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ForecastTab() {
  const [scenario, setScenario] = useState("all");
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <SectionTitle eyebrow="Next 6 Months" title="Revenue Forecast & Scenarios" icon={TrendingUp} />
          <div className="flex gap-1.5">
            {["all", "base", "optimistic", "pessimistic"].map((s) => (
              <button key={s} onClick={() => setScenario(s)}
                className={`text-[11px] px-2.5 py-1 rounded-full capitalize border transition-colors ${scenario === s ? "border-amber-400 text-amber-400 bg-amber-400/10" : "border-stone-700 text-stone-400 hover:border-stone-600"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={fullForecastSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8891A0" }} />
            {(scenario === "all" || scenario === "optimistic") && <Area dataKey="optimistic" name="Optimistic" stroke="#5b9279" fill="#5b927922" strokeWidth={1.5} dot={false} />}
            {(scenario === "all" || scenario === "pessimistic") && <Area dataKey="pessimistic" name="Pessimistic" stroke="#c1543f" fill="#c1543f18" strokeWidth={1.5} dot={false} />}
            <Line dataKey="base" name="Actual / Base Case" stroke="#c9a24b" strokeWidth={2.5} dot={false} />
            <ReferenceLine x={historyForForecast[historyForForecast.length - 1].month} stroke="#57534e" strokeDasharray="4 4" label={{ value: "Today", fill: "#8891A0", fontSize: 10, position: "top" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[{ label: "Base Case", data: forecastBase, color: "#c9a24b" }, { label: "Optimistic", data: forecastOptimistic, color: "#5b9279" }, { label: "Pessimistic", data: forecastPessimistic, color: "#c1543f" }].map((s) => (
          <div key={s.label} className="gh-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">6-Month Outlook</div>
            <div className="font-semibold mb-2 gh-display" style={{ color: s.color }}>{s.label}</div>
            <div className="font-mono text-xl text-stone-50">{fmt$(s.data[5].revenue)}</div>
            <div className="text-xs text-stone-500 mt-1">Projected revenue, month +6</div>
            <div className="text-xs text-stone-400 mt-2">Gross profit: <span className="font-mono text-stone-200">{fmt$(s.data[5].grossProfit)}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsHealthTab() {
  const sevColor = { critical: "#c1543f", high: "#d97767", medium: "#c9a24b", low: "#5b9279" };
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow={`${alerts.length} Active`} title="Executive Alerts" icon={Bell} />
        <div className="flex flex-col gap-2.5">
          {alerts.map((a, i) => (
            <div key={i} className="border border-stone-800 rounded-md p-3 bg-black/20 flex gap-3">
              <div className="pt-0.5">
                {a.sev === "low" ? <CheckCircle2 size={16} color={sevColor[a.sev]} /> : <AlertTriangle size={16} color={sevColor[a.sev]} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-stone-100 text-sm font-medium">{a.title}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ color: sevColor[a.sev], background: `${sevColor[a.sev]}22` }}>{a.sev}</span>
                </div>
                <div className="text-xs text-stone-400 mt-1">Financial impact: <span className="font-mono text-stone-300">{a.impact}</span></div>
                <div className="text-xs text-stone-500 mt-0.5">Root cause: {a.cause}</div>
                <div className="text-xs text-amber-400/80 mt-0.5">Recommended action: {a.action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="gh-card p-4">
        <SectionTitle eyebrow="Full Detail" title="Business Health Breakdown" icon={Gauge} />
        <div className="grid md:grid-cols-2 gap-4">
          {healthSub.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-sm text-stone-300 w-40 shrink-0">{s.label}</span>
              <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: s.score >= 60 ? "#5b9279" : "#c1543f" }} />
              </div>
              <span className="font-mono text-sm text-stone-200 w-10 text-right">{s.score.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange, unit = "%" }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-400">{label}</span>
        <span className="font-mono text-amber-400">{value > 0 ? "+" : ""}{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400" style={{ accentColor: "#c9a24b" }} />
    </div>
  );
}

function DecisionSimulatorTab() {
  const [s, setS] = useState(ZERO_SLIDERS);
  const sim = useMemo(() => computeScenario(s), [s]);
  const set = (key) => (v) => setS((prev) => ({ ...prev, [key]: v }));
  const reset = () => setS(ZERO_SLIDERS);

  const compareRows = [
    { label: "Revenue", base: baseScenario.revenue, sim: sim.revenue },
    { label: "COGS", base: baseScenario.cogs, sim: sim.cogs },
    { label: "Gross Profit", base: baseScenario.grossProfit, sim: sim.grossProfit },
    { label: "Gross Margin", base: baseScenario.grossMargin, sim: sim.grossMargin, isPct: true },
    { label: "Operating Income", base: baseScenario.opInc, sim: sim.opInc },
    { label: "Operating Margin", base: baseScenario.opMargin, sim: sim.opMargin, isPct: true },
    { label: "Net Income", base: baseScenario.netIncome, sim: sim.netIncome },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="gh-card p-4">
          <SectionTitle eyebrow="Adjust Assumptions" title="Decision Simulator" icon={SlidersHorizontal} />
          <div className="flex flex-col gap-4">
            <SliderRow label="Product Price Change" value={s.price} min={-10} max={20} onChange={set("price")} />
            <SliderRow label="Sales Volume Change" value={s.volume} min={-20} max={20} onChange={set("volume")} />
            <SliderRow label="Raw Material Cost Change" value={s.rawMaterial} min={-20} max={30} onChange={set("rawMaterial")} />
            <SliderRow label="Labor Cost Change" value={s.labor} min={-15} max={20} onChange={set("labor")} />
            <SliderRow label="Marketing Spend Change" value={s.marketing} min={-30} max={30} onChange={set("marketing")} />
            <SliderRow label="Logistics Cost Change" value={s.logistics} min={-20} max={30} onChange={set("logistics")} />
            <SliderRow label="Currency Impact" value={s.currency} min={-10} max={10} onChange={set("currency")} />
            <button onClick={reset} className="mt-1 flex items-center justify-center gap-1.5 text-xs text-stone-400 border border-stone-700 rounded-md py-1.5 hover:border-stone-600">
              <RotateCcw size={12} /> Reset to baseline
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="gh-card p-4">
            <SectionTitle eyebrow="Current vs. Simulated" title="Business State Comparison" />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
                  <th className="py-2 font-medium">Metric</th>
                  <th className="py-2 font-medium text-right">Current</th>
                  <th className="py-2 font-medium text-right">Simulated</th>
                  <th className="py-2 font-medium text-right">Impact</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => {
                  const delta = r.sim - r.base;
                  const good = r.label === "COGS" ? delta <= 0 : delta >= 0;
                  return (
                    <tr key={r.label} className="border-b border-stone-800/60 last:border-0">
                      <td className="py-2 text-stone-300">{r.label}</td>
                      <td className="py-2 text-right font-mono text-stone-400">{r.isPct ? `${r.base.toFixed(1)}%` : fmt$(r.base)}</td>
                      <td className="py-2 text-right font-mono text-stone-100">{r.isPct ? `${r.sim.toFixed(1)}%` : fmt$(r.sim)}</td>
                      <td className={`py-2 text-right font-mono ${good ? "text-emerald-400" : "text-red-400"}`}>{delta >= 0 ? "+" : ""}{r.isPct ? `${delta.toFixed(1)}pp` : fmt$(delta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="gh-card p-4 border-amber-400/30">
            <SectionTitle eyebrow="Executive Recommendation" title="What This Means" icon={Sparkles} />
            <p className="text-sm text-stone-200 leading-relaxed">{buildRecommendation(s, sim)}</p>
          </div>
        </div>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="What changed · Why · What to do" title="Profit Root Cause Analysis (YoY)" icon={Activity} />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={waterfall.map((w, i) => {
            let base = 0;
            for (let j = 0; j < i; j++) if (!waterfall[j].isTotal) base += waterfall[j].value; else if (j === 0) base = waterfall[j].value;
            return { ...w, base: w.isTotal ? 0 : (w.value >= 0 ? base : base + w.value) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={55} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[3, 3, 3, 3]}>
              {waterfall.map((w, i) => <Cell key={i} fill={w.isTotal ? "#c9a24b" : w.value >= 0 ? "#5b9279" : "#c1543f"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="border border-stone-800 rounded-md p-3 bg-black/20"><span className="text-amber-400/80 font-medium block mb-1">What changed?</span><span className="text-stone-400">Operating profit moved from {fmt$(yearAgo.opInc)} to {fmt$(latest.opInc)} year-over-year, a net change of {fmt$(latest.opInc - yearAgo.opInc)}.</span></div>
          <div className="border border-stone-800 rounded-md p-3 bg-black/20"><span className="text-amber-400/80 font-medium block mb-1">Why did it change?</span><span className="text-stone-400">{marginDriver.cat} ran {fmtPct(marginDriver.variancePct)} versus budget, the largest single cost pressure, partly offset by top-line growth in {bestSegment.key}.</span></div>
          <div className="border border-stone-800 rounded-md p-3 bg-black/20"><span className="text-amber-400/80 font-medium block mb-1">What should management do?</span><span className="text-stone-400">Open a variance review with the {marginDriver.cat} category owner and evaluate hedging or pricing action to protect margin.</span></div>
        </div>
      </div>
    </div>
  );
}

function CustomersTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="gh-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Top 10 Customers</div>
          <div className="font-mono text-2xl text-stone-50">{top10CustomerShare.toFixed(0)}% <span className="text-sm text-stone-500">of revenue</span></div>
        </div>
        <div className="gh-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Concentration Risk</div>
          <div className="font-mono text-2xl" style={{ color: customerConcentrationRisk === "High" ? "#c1543f" : customerConcentrationRisk === "Medium" ? "#c9a24b" : "#5b9279" }}>{customerConcentrationRisk}</div>
        </div>
        <div className="gh-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Active Customers</div>
          <div className="font-mono text-2xl text-stone-50">{customers.length}</div>
        </div>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="Top 60 Customers" title="Revenue Concentration (Pareto)" icon={Users} />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="rank" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} label={{ value: "Customer Rank", position: "insideBottom", offset: -5, fill: "#8891A0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
            <ReferenceLine y={80} stroke="#c1543f" strokeDasharray="4 4" label={{ value: "80%", fill: "#c1543f", fontSize: 10 }} />
            <Line dataKey="cumPct" name="Cumulative Revenue %" stroke="#c9a24b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="Bubble = Growth" title="Customer Profitability Matrix" icon={Building2} />
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis type="number" dataKey="revenue" name="Revenue" unit="M" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} label={{ value: "Customer Revenue ($M)", position: "insideBottom", offset: -5, fill: "#8891A0", fontSize: 11 }} />
            <YAxis type="number" dataKey="grossProfit" name="Gross Profit" unit="M" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Gross Profit ($M)", angle: -90, position: "insideLeft", fill: "#8891A0", fontSize: 11 }} />
            <ZAxis type="number" dataKey="growth" range={[25, 260]} />
            <ReferenceLine x={medianCustRev} stroke="#57534e" strokeDasharray="4 4" />
            <ReferenceLine y={medianCustProfit} stroke="#57534e" strokeDasharray="4 4" />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="bg-stone-950 border border-stone-700 rounded px-3 py-2 text-xs font-mono shadow-xl">
                  <div className="text-stone-100 mb-1">{p.name}</div>
                  <div className="text-stone-400">{p.type} · {customerQuadrantOf(p)}</div>
                  <div className="text-stone-300 mt-1">Revenue: {fmt$(p.revenue)}</div>
                  <div className="text-stone-300">Gross Profit: {fmt$(p.grossProfit)}</div>
                </div>
              );
            }} />
            {["Strategic Customers", "Margin Risk", "Growth Opportunity", "Review Customer"].map((quad) => (
              <Scatter key={quad} name={quad} data={customerScatterSample.filter((c) => customerQuadrantOf(c) === quad)} fill={CUSTOMER_QUADRANT_COLOR[quad]} fillOpacity={0.75} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
          {Object.entries(CUSTOMER_QUADRANT_COLOR).map(([k, c]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-stone-400"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{k}</div>
          ))}
        </div>
      </div>

      <div className="gh-card p-0 overflow-hidden">
        <div className="p-4 pb-0"><SectionTitle title="Top 12 Customers by Revenue" /></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium text-right">Revenue</th>
              <th className="px-4 py-2 font-medium text-right">Gross Profit</th>
              <th className="px-4 py-2 font-medium text-right">Growth</th>
            </tr>
          </thead>
          <tbody>
            {topCustomersByRevenue.map((c) => (
              <tr key={c.id} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                <td className="px-4 py-2.5 text-stone-200">{c.name}</td>
                <td className="px-4 py-2.5 text-stone-500">{c.type}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-200">{fmt$(c.revenue)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-amber-400">{fmt$(c.grossProfit)}</td>
                <td className="px-4 py-2.5 text-right"><TrendChip value={c.growth} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductIntelligenceTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow="Inventory Classification" title="ABC Product Analysis" icon={Layers} />
        <div className="grid md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={abcGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#8891A0", fontSize: 11 }} axisLine={{ stroke: "#44403c" }} tickLine={false} />
              <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
              <Bar dataKey="revenueShare" name="Revenue Share" fill="#c9a24b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-sm self-start">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 font-medium text-right">Products</th>
                <th className="py-2 font-medium text-right">Revenue Share</th>
                <th className="py-2 font-medium">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {abcGroups.map((g) => (
                <tr key={g.key} className="border-b border-stone-800/60 last:border-0">
                  <td className="py-2.5 text-stone-100 font-medium">{g.label}</td>
                  <td className="py-2.5 text-right font-mono text-stone-300">{g.items.length} ({g.countShare.toFixed(0)}%)</td>
                  <td className="py-2.5 text-right font-mono text-amber-400">{g.revenueShare.toFixed(1)}%</td>
                  <td className="py-2.5 text-stone-400 text-xs">{g.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="Introduction → Growth → Maturity → Decline" title="Product Lifecycle Analysis" icon={Repeat} />
        <div className="grid md:grid-cols-4 gap-3">
          {lifecycleGroups.map((g) => (
            <div key={g.stage} className="border border-stone-800 rounded-md p-3 bg-black/20">
              <div className="text-xs uppercase tracking-wide gh-display" style={{ color: LIFECYCLE_COLOR[g.stage] }}>{g.stage}</div>
              <div className="font-mono text-xl text-stone-50 mt-1">{g.count} <span className="text-xs text-stone-500">SKUs</span></div>
              <div className="text-xs text-stone-500 mt-0.5">{fmt$(g.revenue, 0)} revenue</div>
              <div className="text-[11px] text-stone-400 mt-2 leading-snug">{LIFECYCLE_ACTION[g.stage]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="Current · Previous · Optimal" title="Sales Mix Analysis" icon={BarChart3} />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={salesMix}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="segment" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8891A0" }} />
            <Bar dataKey="previousShare" name="Previous Mix" fill="#57534e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="currentShare" name="Current Mix" fill="#8891A0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="optimalShare" name="Optimal Mix" fill="#c9a24b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {focusFlag && (
          <p className="text-xs text-stone-400 mt-2">
            <span className="text-amber-400/80 font-medium">Insight: </span>
            {highMarginSeg} carries the highest gross margin ({salesMix.find((s) => s.segment === highMarginSeg).margin.toFixed(0)}%) in the portfolio but only {salesMix.find((s) => s.segment === highMarginSeg).currentShare.toFixed(1)}% of the sales mix — a candidate for increased sales focus, funded by trimming {lowMarginSeg}'s share.
          </p>
        )}
      </div>
    </div>
  );
}

function PricingBreakEvenTab() {
  const [pct, setPct] = useState(0);
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <SectionTitle eyebrow="Top 8 SKUs by Revenue" title="Pricing Intelligence" icon={Calculator} />
          <div className="w-56"><SliderRow label="Test Price Change" value={pct} min={-15} max={15} onChange={setPct} /></div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-2 py-2 font-medium">Product</th>
              <th className="px-2 py-2 font-medium text-right">Price</th>
              <th className="px-2 py-2 font-medium text-right">Unit Cost</th>
              <th className="px-2 py-2 font-medium text-right">Elasticity</th>
              <th className="px-2 py-2 font-medium text-right">Sim. Revenue</th>
              <th className="px-2 py-2 font-medium text-right">Sim. Profit</th>
              <th className="px-2 py-2 font-medium text-right">Optimal Δ</th>
            </tr>
          </thead>
          <tbody>
            {pricingProducts.map((p) => {
              const sim = simulatePriceChange(p, pct);
              return (
                <tr key={p.id} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                  <td className="px-2 py-2.5 text-stone-200">{p.name}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-stone-300">${p.price.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-stone-500">${p.unitCost.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-stone-400">{p.elasticity.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-stone-100">{fmt$(sim.newRevenue)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-amber-400">{fmt$(sim.newProfit)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-emerald-400">{p.optimalPct >= 0 ? "+" : ""}{p.optimalPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11px] text-stone-500 mt-2">Optimal Δ is the profit-maximizing price change found by testing −15% to +15% against each product's estimated demand elasticity.</p>
      </div>

      <div className="gh-card p-0 overflow-hidden">
        <div className="p-4 pb-0"><SectionTitle eyebrow="Fixed Cost Allocated at 14% of Revenue" title="Break-Even Analysis" icon={Target} /></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium text-right">Contribution Margin/Unit</th>
              <th className="px-4 py-2 font-medium text-right">Break-Even Units</th>
              <th className="px-4 py-2 font-medium text-right">Current Units</th>
              <th className="px-4 py-2 font-medium text-right">Safety Margin</th>
            </tr>
          </thead>
          <tbody>
            {breakEvenProducts.map((p) => (
              <tr key={p.id} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                <td className="px-4 py-2.5 text-stone-200">{p.name}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-300">${p.contributionMarginPerUnit.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-400">{(p.breakEvenUnits / 1e6).toFixed(2)}M</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-400">{(p.currentUnits / 1e6).toFixed(2)}M</td>
                <td className={`px-4 py-2.5 text-right font-mono ${p.safetyMarginPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(p.safetyMarginPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkingCapitalTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Current Ratio</div><div className="font-mono text-2xl text-stone-50">{currentRatioWC.toFixed(2)}x</div></div>
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Quick Ratio</div><div className="font-mono text-2xl text-stone-50">{quickRatioWC.toFixed(2)}x</div></div>
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Cash Conversion Cycle</div><div className="font-mono text-2xl text-stone-50">{wcLast.ccc.toFixed(0)}d</div></div>
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Days Inventory</div><div className="font-mono text-2xl text-stone-50">{wcLast.dio.toFixed(0)}d</div></div>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="Trailing 12 Months" title="Working Capital Trend" icon={Wallet} />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={workingCapitalSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}d`} />
            <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)} days`} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8891A0" }} />
            <Line dataKey="dso" name="DSO" stroke="#c9a24b" strokeWidth={2} dot={false} />
            <Line dataKey="dio" name="DIO" stroke="#c1543f" strokeWidth={2} dot={false} />
            <Line dataKey="dpo" name="DPO" stroke="#5b9279" strokeWidth={2} dot={false} />
            <Line dataKey="ccc" name="CCC" stroke="#8891A0" strokeWidth={2} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Inventory days increased from {wcFirst.dio.toFixed(0)} to {wcLast.dio.toFixed(0)} days over the trailing year, tying up an estimated {fmt$(dioIncreaseCashImpact, 0)} in additional working capital.
        </div>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="100 SKUs Classified" title="Inventory Optimization" icon={Boxes} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          {inventoryByStatus.map((s) => (
            <div key={s.status} className="border border-stone-800 rounded-md p-2.5 text-center bg-black/20">
              <div className="text-[10px] uppercase tracking-wide gh-display" style={{ color: INV_STATUS_COLOR[s.status] }}>{s.status}</div>
              <div className="font-mono text-lg text-stone-100 mt-1">{s.count}</div>
              {s.exposure > 0 && <div className="text-[10px] text-stone-500 mt-0.5">{fmt$(s.exposure)} exposure</div>}
            </div>
          ))}
        </div>
        <div className="text-xs text-stone-400 bg-black/20 border border-stone-800 rounded-md p-2.5">
          <span className="text-amber-400/80 font-medium">Recommendation: </span>
          {worstOverstock.name} inventory is classified {worstOverstock.status.toLowerCase()} at {worstOverstock.daysOfInventory.toFixed(0)} days of supply, projected {worstOverstock.excessPct.toFixed(0)}% above target demand and creating a potential working capital exposure of {fmt$(worstOverstock.exposure)}.
        </div>
      </div>

      <div className="gh-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <SectionTitle eyebrow="Weekly Detail" title="13-Week Cash Flow Forecast" icon={CalendarClock} />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={cashFlow13}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} />
            <YAxis tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip formatter={(v) => fmt$(v)} />} />
            <ReferenceLine y={CASH_MIN_THRESHOLD} stroke="#c1543f" strokeDasharray="4 4" label={{ value: `Min $${CASH_MIN_THRESHOLD}M`, fill: "#c1543f", fontSize: 10 }} />
            <Line dataKey="endingCash" name="Ending Cash" stroke="#c9a24b" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
        {cashRiskWeek ? (
          <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Projected cash balance may fall below the ${CASH_MIN_THRESHOLD}M minimum threshold during {cashRiskWeek.week} (projected {fmt$(cashRiskWeek.endingCash)}).
          </div>
        ) : (
          <div className="mt-2 flex items-start gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md p-2.5">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            Projected cash balance remains above the ${CASH_MIN_THRESHOLD}M minimum threshold across the 13-week horizon.
          </div>
        )}
      </div>
    </div>
  );
}

function RiskScorecardTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow="Probability × Impact" title="Business Risk Heatmap" icon={ShieldAlert} />
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis type="number" dataKey="probability" name="Probability" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(v) => ["", "Low", "Medium", "High"][v]} tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={{ stroke: "#44403c" }} tickLine={false} label={{ value: "Probability", position: "insideBottom", offset: -10, fill: "#8891A0", fontSize: 11 }} />
            <YAxis type="number" dataKey="impact" name="Financial Impact" domain={[0.5, 4.5]} ticks={[1, 2, 3, 4]} tickFormatter={(v) => ["", "Low", "Medium", "High", "Critical"][v]} tick={{ fill: "#8891A0", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Financial Impact", angle: -90, position: "insideLeft", fill: "#8891A0", fontSize: 11 }} />
            <ZAxis type="number" dataKey="exposure" range={[80, 500]} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload;
              return (
                <div className="bg-stone-950 border border-stone-700 rounded px-3 py-2 text-xs font-mono shadow-xl">
                  <div className="text-stone-100 mb-1">{r.name}</div>
                  <div style={{ color: RISK_LEVEL_COLOR[r.level] }}>{r.level} risk</div>
                  <div className="text-stone-300 mt-1">Exposure: {fmt$(r.exposure, 0)}</div>
                </div>
              );
            }} />
            <Scatter data={riskCategories} fill="#c9a24b">
              {riskCategories.map((r, i) => <Cell key={i} fill={RISK_LEVEL_COLOR[r.level]} fillOpacity={0.8} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="gh-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-4 py-2.5 font-medium">Risk</th>
              <th className="px-4 py-2.5 font-medium text-right">Probability</th>
              <th className="px-4 py-2.5 font-medium text-right">Financial Impact</th>
              <th className="px-4 py-2.5 font-medium text-right">Exposure</th>
              <th className="px-4 py-2.5 font-medium text-right">Level</th>
            </tr>
          </thead>
          <tbody>
            {[...riskCategories].sort((a, b) => b.exposure - a.exposure).map((r) => (
              <tr key={r.name} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                <td className="px-4 py-2.5 text-stone-200">{r.name}</td>
                <td className="px-4 py-2.5 text-right text-stone-400">{r.probLabel}</td>
                <td className="px-4 py-2.5 text-right text-stone-400">{r.impactLabel}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-200">{fmt$(r.exposure, 0)}</td>
                <td className="px-4 py-2.5 text-right"><span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${RISK_LEVEL_COLOR[r.level]}30`, color: RISK_LEVEL_COLOR[r.level] }}>{r.level}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gh-card p-4">
        <SectionTitle eyebrow="0–100 by Department" title="Performance Scorecard" icon={Gauge} />
        <div className="flex flex-col gap-3">
          {[...scorecard].sort((a, b) => b.score - a.score).map((d, i) => (
            <div key={d.dept} className="border border-stone-800 rounded-md p-3 bg-black/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-stone-600">#{i + 1}</span>
                  <span className="text-stone-100 font-medium text-sm">{d.dept}</span>
                </div>
                <span className="font-mono text-lg" style={{ color: d.score >= 60 ? "#5b9279" : d.score >= 40 ? "#c9a24b" : "#c1543f" }}>{d.score.toFixed(0)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {d.metrics.map((m) => (
                  <div key={m.label} className="text-[11px]">
                    <div className="text-stone-500">{m.label}</div>
                    <div className="font-mono text-stone-300">{m.score.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ROI_TIER_COLOR = { "High ROI": "#5b9279", "Average ROI": "#c9a24b", "Low ROI": "#c1543f" };

function MarketingTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Campaigns Tracked</div><div className="font-mono text-2xl text-stone-50">{marketingCampaigns.length}</div></div>
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Average ROI</div><div className="font-mono text-2xl" style={{ color: avgMarketingROI >= 0 ? "#5b9279" : "#c1543f" }}>{fmtPct(avgMarketingROI * 100)}</div></div>
        <div className="gh-card p-4"><div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-1">Total Spend</div><div className="font-mono text-2xl text-stone-50">{fmt$(marketingCampaigns.reduce((a, c) => a + c.spend, 0), 0)}</div></div>
      </div>
      <div className="gh-card p-0 overflow-hidden">
        <div className="p-4 pb-0"><SectionTitle eyebrow="Ranked by ROI" title="Marketing ROI Analysis" icon={Megaphone} /></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
              <th className="px-4 py-2.5 font-medium">Campaign</th>
              <th className="px-4 py-2.5 font-medium text-right">Spend</th>
              <th className="px-4 py-2.5 font-medium text-right">Incremental Revenue</th>
              <th className="px-4 py-2.5 font-medium text-right">ROI</th>
              <th className="px-4 py-2.5 font-medium text-right">Tier</th>
              <th className="px-4 py-2.5 font-medium text-right">Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {[...marketingCampaigns].sort((a, b) => b.roi - a.roi).map((c) => (
              <tr key={c.id} className="border-b border-stone-800/60 last:border-0 hover:bg-black/20">
                <td className="px-4 py-2.5 text-stone-200">{c.name}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-400">{fmt$(c.spend)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-stone-300">{fmt$(c.incrementalRevenue)}</td>
                <td className="px-4 py-2.5 text-right font-mono" style={{ color: ROI_TIER_COLOR[c.tier] }}>{fmtPct(c.roi * 100)}</td>
                <td className="px-4 py-2.5 text-right"><span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${ROI_TIER_COLOR[c.tier]}30`, color: ROI_TIER_COLOR[c.tier] }}>{c.tier}</span></td>
                <td className="px-4 py-2.5 text-right text-stone-400 text-xs">{c.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PRIORITY_COLOR = { critical: "#c1543f", high: "#d97767", medium: "#c9a24b", low: "#5b9279" };
const STATUS_CYCLE = ["Open", "In Progress", "Completed"];

function ActionCenterTab() {
  const [statuses, setStatuses] = useState(() => Object.fromEntries(actionCenterItems.map((a) => [a.id, "Open"])));
  const cycle = (id) => setStatuses((prev) => ({ ...prev, [id]: STATUS_CYCLE[(STATUS_CYCLE.indexOf(prev[id]) + 1) % STATUS_CYCLE.length] }));
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow={`${actionCenterItems.length} Combined Alerts & Recommendations`} title="Management Action Center" icon={ClipboardList} />
      <div className="flex flex-col gap-2.5">
        {actionCenterItems.map((a) => {
          const status = statuses[a.id];
          return (
            <div key={a.id} className="gh-card p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded" style={{ color: PRIORITY_COLOR[a.priority], background: `${PRIORITY_COLOR[a.priority]}22` }}>{a.priority} priority</span>
                <button onClick={() => cycle(a.id)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${status === "Completed" ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : status === "In Progress" ? "border-amber-400/50 text-amber-400 bg-amber-400/10" : "border-stone-600 text-stone-400"}`}>
                  {status}
                </button>
              </div>
              <div className="text-stone-100 font-medium text-sm mb-1">{a.title}</div>
              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <div><span className="text-stone-500">Financial Impact: </span><span className="font-mono text-stone-300">{a.impact}</span></div>
                <div><span className="text-stone-500">Owner: </span><span className="text-stone-300">{a.owner}</span></div>
                <div className="sm:col-span-1"><span className="text-stone-500">Action: </span><span className="text-amber-400/80">{a.action}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthEndCloseTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="gh-card p-4">
        <SectionTitle eyebrow="Current Cycle" title="Month-End Close Status" icon={CalendarClock} />
        <div className="flex flex-col gap-3">
          {closeStages.map((st) => (
            <div key={st.name} className="flex items-center gap-3">
              <span className="text-sm text-stone-300 w-44 shrink-0">{st.name}</span>
              <div className="flex-1 h-2.5 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${st.progress}%`, background: st.progress === 100 ? "#5b9279" : st.progress > 0 ? "#c9a24b" : "#3f3a34" }} />
              </div>
              <span className="font-mono text-xs text-stone-400 w-10 text-right">{st.progress}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="gh-card p-4">
          <SectionTitle title="Outstanding Tasks" />
          <ul className="flex flex-col gap-2">
            {closeOutstandingTasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="gh-card p-4">
          <SectionTitle title="Critical Variances" />
          <div className="flex flex-col gap-2">
            {closeCriticalVariances.map((b) => (
              <div key={b.cat} className="flex items-center justify-between text-sm border-b border-stone-800/60 pb-1.5 last:border-0">
                <span className="text-stone-300">{b.cat}</span>
                <span className="font-mono text-red-400">{fmtPct(b.variancePct)}</span>
              </div>
            ))}
            {closeCriticalVariances.length === 0 && <span className="text-sm text-stone-500">No critical variances outstanding.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CFOSummaryTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-stone-500 gh-display">Printable Executive Report</div>
          <h2 className="text-stone-100 text-lg font-semibold gh-display">CFO Monthly Business Review</h2>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-stone-700 text-stone-300 hover:border-amber-400 hover:text-amber-400">
          <Printer size={13} /> Print
        </button>
      </div>

      <div className="gh-card p-5 flex flex-col gap-5">
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">1 · Financial Performance</div>
          <p className="text-sm text-stone-300">Monthly revenue of {fmt$(latest.revenue)} ({fmtPct(revMoM)} MoM, {fmtPct(revYoY)} YoY). Operating income of {fmt$(latest.opInc)} at a {latest.opMargin.toFixed(1)}% margin.</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">2 · Revenue Performance</div>
          <p className="text-sm text-stone-300">{bestSegment.key} is the fastest-growing segment at {fmtPct(bestSegGrowth)} YoY. {bestRegion.key} leads regional growth at {fmtPct(bestRegion.yoyGrowth)}, while {worstRegion.key} lags at {fmtPct(worstRegion.yoyGrowth)}.</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">3 · Margin Performance</div>
          <p className="text-sm text-stone-300">Gross margin stands at {latest.grossMargin.toFixed(1)}% versus a 40% target. {marginDriver.cat} is the largest unfavorable cost driver at {fmtPct(marginDriver.variancePct)} versus budget.</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">4 · Budget Variance</div>
          <p className="text-sm text-stone-300">{bva.filter((b) => !b.favorable).length} of {bva.length} tracked categories are running unfavorable to budget on a trailing-12-month basis, led by {marginDriver.cat} ({fmtPct(marginDriver.variancePct)}).</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">5 · Commodity Risk</div>
          <p className="text-sm text-stone-300">{COMMODITIES.filter((c) => c.monthlyChg >= 5).map((c) => c.key).join(", ") || "No commodities"} show elevated monthly price movement, with {COMMODITIES.slice().sort((a, b) => b.monthlyChg - a.monthlyChg)[0].key} up {fmtPct(COMMODITIES.slice().sort((a, b) => b.monthlyChg - a.monthlyChg)[0].monthlyChg)} for the month.</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">6 · Forecast Outlook</div>
          <p className="text-sm text-stone-300">Base-case revenue is projected at {fmt$(forecastBase[5].revenue)} in six months, ranging from {fmt$(forecastPessimistic[5].revenue)} (pessimistic) to {fmt$(forecastOptimistic[5].revenue)} (optimistic).</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">7 · Cash Flow Position</div>
          <p className="text-sm text-stone-300">{cashRiskWeek ? `Projected cash may fall below the $${CASH_MIN_THRESHOLD}M minimum threshold in ${cashRiskWeek.week}.` : `Cash position remains above the $${CASH_MIN_THRESHOLD}M minimum threshold across the 13-week horizon.`} Cash conversion cycle stands at {wcLast.ccc.toFixed(0)} days.</p>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">8 · Major Risks</div>
          <ul className="flex flex-col gap-1">
            {topRisksByExposure.map((r) => (
              <li key={r.name} className="text-sm text-stone-300">• {r.name} — <span style={{ color: RISK_LEVEL_COLOR[r.level] }}>{r.level}</span>, estimated exposure {fmt$(r.exposure, 0)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-amber-400 text-xs uppercase tracking-wide gh-display mb-1">9 · Recommended Management Actions</div>
          <ul className="flex flex-col gap-1">
            {topActionItems.map((a) => (
              <li key={a.id} className="text-sm text-stone-300">• {a.title} — <span className="text-stone-500">{a.owner}:</span> {a.action}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const PORTFOLIO_FLOW = ["Business Problem", "Data Challenge", "Analysis Performed", "Insights Discovered", "Financial Impact", "Recommended Action"];
const ARCHITECTURE_FLOW = ["Synthetic Business Data", "Financial Calculations", "Business Intelligence Engine", "Forecasting Models", "Risk Detection", "Executive Recommendations"];

function PortfolioStoryModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start md:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="gh-card max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="gh-display text-lg font-semibold text-stone-50">Portfolio Story</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200"><X size={18} /></button>
        </div>
        <p className="text-sm text-stone-300 mb-5">This application demonstrates how financial and operational data can be transformed into management decisions — turning raw transactions into a clear answer to what happened, why, what's next, and what to do about it.</p>

        <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-2">Narrative Flow</div>
        <div className="flex flex-col gap-1 mb-6">
          {PORTFOLIO_FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 border border-stone-800 rounded-md px-3 py-2 bg-black/20">
                <span className="font-mono text-xs text-amber-400">{i + 1}</span>
                <span className="text-sm text-stone-200">{step}</span>
              </div>
              {i < PORTFOLIO_FLOW.length - 1 && <ArrowRight size={14} className="text-stone-600 rotate-90" />}
            </div>
          ))}
        </div>

        <div className="text-[11px] uppercase tracking-wide text-stone-500 gh-display mb-2">Technical Architecture</div>
        <div className="flex flex-col gap-1">
          {ARCHITECTURE_FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 border border-stone-800 rounded-md px-3 py-2 bg-black/20">
                <GitBranch size={13} className="text-stone-500" />
                <span className="text-sm text-stone-300 font-mono">{step}</span>
              </div>
              {i < ARCHITECTURE_FLOW.length - 1 && <ArrowRight size={14} className="text-stone-600 rotate-90" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== APP SHELL ============================== */

const TABS = [
  { key: "exec", label: "Executive", icon: Gauge, Comp: ExecutiveTab, group: "Core", filtered: true },
  { key: "products", label: "Products", icon: Package, Comp: ProductsTab, group: "Core", filtered: true },
  { key: "geo", label: "Geography", icon: Globe2, Comp: GeographyTab, group: "Core", filtered: true },
  { key: "budget", label: "Budget vs. Actual", icon: BarChart3, Comp: BudgetTab, group: "Core" },
  { key: "commodity", label: "Commodity Risk", icon: Sprout, Comp: CommodityTab, group: "Core" },
  { key: "forecast", label: "Forecast", icon: TrendingUp, Comp: ForecastTab, group: "Core" },
  { key: "alerts", label: "Alerts & Health", icon: Bell, Comp: AlertsHealthTab, group: "Core" },
  { key: "simulator", label: "Decision Simulator", icon: SlidersHorizontal, Comp: DecisionSimulatorTab, group: "Advanced" },
  { key: "customers", label: "Customers", icon: Users, Comp: CustomersTab, group: "Advanced" },
  { key: "productintel", label: "Product Intelligence", icon: Layers, Comp: ProductIntelligenceTab, group: "Advanced" },
  { key: "pricing", label: "Pricing & Break-Even", icon: Calculator, Comp: PricingBreakEvenTab, group: "Advanced" },
  { key: "workingcapital", label: "Working Capital & Cash", icon: Wallet, Comp: WorkingCapitalTab, group: "Advanced" },
  { key: "risk", label: "Risk & Scorecard", icon: ShieldAlert, Comp: RiskScorecardTab, group: "Advanced" },
  { key: "marketing", label: "Marketing ROI", icon: Megaphone, Comp: MarketingTab, group: "Advanced" },
  { key: "actions", label: "Action Center", icon: ClipboardList, Comp: ActionCenterTab, group: "Advanced" },
  { key: "close", label: "Month-End Close", icon: CalendarClock, Comp: MonthEndCloseTab, group: "Advanced" },
  { key: "cfo", label: "CFO Summary", icon: FileBarChart, Comp: CFOSummaryTab, group: "Advanced" },
];
const TAB_GROUPS = ["Core", "Advanced"];
const SEGMENT_OPTIONS = ["All", ...SEGMENTS.map((s) => s.key)];
const REGION_OPTIONS = ["All", ...REGIONS.map((r) => r.key)];
const PERIOD_OPTIONS = [12, 24, 60];

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-stone-500">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-stone-900 border border-stone-700 rounded px-1.5 py-1 text-stone-200 text-xs focus:outline-none focus:border-amber-400">
        {options.map((o) => <option key={o} value={o}>{o === "All" ? "All" : o}</option>)}
      </select>
    </label>
  );
}

export default function App() {
  const [active, setActive] = useState("exec");
  const [showStory, setShowStory] = useState(false);
  const [filters, setFilters] = useState({ period: "24", segment: "All", region: "All" });
  const activeTab = TABS.find((t) => t.key === active);
  const ActiveComp = activeTab.Comp;
  const tabProps = activeTab.filtered
    ? { period: Number(filters.period), segment: filters.segment, region: filters.region }
    : {};

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('${FONT_IMPORT_URL}');
        .gh-display { font-family: 'Space Grotesk', 'IBM Plex Sans', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .gh-card { background: #12151a; border: 1px solid #262b33; border-radius: 10px; }
        .gh-marquee { animation: gh-scroll 34s linear infinite; width: max-content; }
        .gh-marquee:hover { animation-play-state: paused; }
        @keyframes gh-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .gh-marquee { animation: none; } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: #44403c; border-radius: 4px; }
        @media print { nav, header, .no-print { display: none !important; } main { padding: 0 !important; } }
      `}</style>

      <header className="border-b border-stone-800 bg-stone-950/95 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
              <Wheat size={17} className="text-amber-400" />
            </div>
            <div>
              <div className="gh-display font-bold text-stone-50 text-sm tracking-tight leading-none">FoodPulse</div>
              <div className="text-[10px] text-stone-500 tracking-wide leading-none mt-0.5">GLOBAL HARVEST FOODS · FY26</div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500">
              <Factory size={13} /> 5 Segments · 5 Regions · 100 SKUs · 500 Customers · 60mo history
            </div>
            <button onClick={() => setShowStory(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-stone-700 text-stone-300 hover:border-amber-400 hover:text-amber-400">
              <GitBranch size={13} /> Portfolio Story
            </button>
          </div>
        </div>
        <TickerTape />
        <div className="border-t border-stone-800 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><Filter size={12} /> Global Filters</span>
            <FilterSelect label="Period" value={filters.period} options={PERIOD_OPTIONS.map(String)} onChange={(v) => setFilters((f) => ({ ...f, period: v }))} />
            <FilterSelect label="Segment" value={filters.segment} options={SEGMENT_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, segment: v }))} />
            <FilterSelect label="Region" value={filters.region} options={REGION_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, region: v }))} />
            {!activeTab.filtered && <span className="text-[11px] text-stone-600 italic">Filters apply to Executive, Products &amp; Geography</span>}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        <nav className="w-56 shrink-0 hidden md:flex flex-col gap-3 p-3 border-r border-stone-800 min-h-[calc(100vh-140px)] overflow-y-auto">
          {TAB_GROUPS.map((group) => (
            <div key={group} className="flex flex-col gap-0.5">
              <div className="px-3 pb-1 text-[10px] uppercase tracking-widest text-stone-600 gh-display">{group}</div>
              {TABS.filter((t) => t.group === group).map((t) => {
                const Icon = t.icon;
                const isActive = active === t.key;
                return (
                  <button key={t.key} onClick={() => setActive(t.key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${isActive ? "bg-amber-400/10 text-amber-400" : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"}`}>
                    <Icon size={15} />
                    <span className="flex-1">{t.label}</span>
                    {isActive && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="mt-auto pt-4 px-3 text-[10px] text-stone-600 leading-relaxed">
            Synthetic demo data generated for portfolio purposes. Not real company financials.
            <div className="mt-2 text-stone-500">Built by Emmanuel Igbokwe</div>
          </div>
        </nav>

        <div className="flex md:hidden w-full overflow-x-auto border-b border-stone-800 sticky top-[132px] bg-stone-950 z-10">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActive(t.key)}
              className={`shrink-0 px-3 py-2.5 text-xs whitespace-nowrap ${active === t.key ? "text-amber-400 border-b-2 border-amber-400" : "text-stone-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <ActiveComp {...tabProps} />
        </main>
      </div>

      {showStory && <PortfolioStoryModal onClose={() => setShowStory(false)} />}
    </div>
  );
}
