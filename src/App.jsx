import { useState, useRef, useCallback, useEffect } from "react";

// ─── MOBILE HOOK ──────────────────────────────────────────────────────────────── v10
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const buildSystemPrompt = (ctx={}) => {
  const {accountType="RESIDENTIAL", householdSize="", facilitySize=""} = ctx;
  const isResidential = accountType === "RESIDENTIAL";
  const isIndustrial = accountType === "INDUSTRIAL";
  const isCommercial = accountType === "COMMERCIAL" || accountType === "SMALL_BUSINESS";
  const waterBench = householdSize === "1" ? "2,500-3,500" : householdSize === "2" ? "5,000-6,500" : householdSize === "3" ? "7,500-9,000" : householdSize === "4" ? "9,000-12,000" : "12,000-15,000";
  const waterHigh = householdSize === "1" ? "5,000" : householdSize === "2" ? "9,000" : householdSize === "3" ? "13,000" : householdSize === "4" ? "18,000" : "22,000";
  const waterVeryHigh = householdSize === "1" ? "7,000" : householdSize === "2" ? "12,000" : householdSize === "3" ? "18,000" : householdSize === "4" ? "24,000" : "30,000";
  const sizeNote = isResidential && householdSize ? `\nCUSTOMER CONTEXT — CRITICAL: This is a ${householdSize}-person household. You MUST use these EXACT benchmarks for usage ratings — do NOT override with general population averages:\n- Water AVERAGE for ${householdSize} people: ${waterBench} gal/month. Rate as AVERAGE if within this range. Rate HIGH only above ${waterHigh} gal/month. Rate VERY_HIGH only above ${waterVeryHigh} gal/month. If usage is near the AVERAGE range, say so explicitly — do not rate it HIGH or VERY_HIGH because of leak adjustments or billing history.\n- Electric: ${householdSize === "1" ? "~500-700" : householdSize === "2" ? "~700-900" : householdSize === "3" ? "~900-1,100" : householdSize === "4" ? "~1,000-1,300" : "~1,200-1,600"} kWh/month typical\n- Gas: ~${householdSize === "1" ? "40-80" : householdSize === "2" ? "60-100" : householdSize === "3" ? "80-120" : householdSize === "4" ? "90-140" : "100-160"} therms/month typical IN WINTER; summer is 5-20 therms` : "";
  const commercialNote = (isCommercial || isIndustrial) ? `\nCUSTOMER CONTEXT: ${accountType.replace("_"," ")} account${facilitySize ? ` — monthly bill range: ${facilitySize}` : ""}. Apply commercial/industrial analysis:\n- Focus on demand charges, power factor penalties, ratchet clauses, rate schedule optimization\n- Water: flag cooling tower efficiency, process water recycling, irrigation meter separation\n- Gas: evaluate interruptible service rates, transportation-only rates, CHP opportunities\n- Do NOT apply residential benchmarks — use commercial EUI and facility-type benchmarks\n- Recommendations should target operational efficiency, not behavioral residential tips` : "";
  return `You are a world-class utility bill analyst, consumer advocate, and efficiency consultant. You analyze electricity, natural gas, and water/sewer bills for residential, commercial, and industrial customers. First detect the bill type, then apply the appropriate analysis.

STEP 1 — DETECT BILL TYPE
Identify: ELECTRIC, GAS, WATER, or COMBINED. Use appropriate units and benchmarks.

STEP 2 — BILL VERIFICATION
ELECTRIC: Flag incorrect tax rates, wrong baseline/climate zones, kWh spikes, double-billed fees, demand charges incorrectly applied, estimated reads, fuel adjustment anomalies.
GAS: Flag incorrect therm/CCF rates, distribution charge errors, pipeline surcharges, gas cost adjustments, wrong rate class (residential vs commercial).
WATER: Flag incorrect tier/block rate assignments, sewer multiplier errors (irrigation doesn't enter sewer — credit should apply), meter read anomalies, fire suppression charge misapplication, wrong irrigation vs indoor rate split.

STEP 3 — USAGE ANALYSIS
ELECTRIC: US residential average is ~899 kWh/month nationally, but the realistic range is 600-1,000 kWh/month depending on home size, climate, and household size. A 1-person household typically uses 500-700 kWh/month. Do NOT rate usage as LOW unless it is genuinely anomalously low (below 300 kWh/month for a typical home). Rate as AVERAGE if within the normal range for the household size provided. Rate as HIGH only above 1,200 kWh/month for a 1-2 person household. Commercial/industrial benchmarks vary by facility type and must not use residential benchmarks.
GAS: US residential gas usage varies SIGNIFICANTLY by season. Annual average is ~50 therms/month but this is misleading — winter heating months (Nov-Mar) typically run 60-150 therms/month depending on climate zone and home size, while summer months may be only 5-20 therms. NC/Southeast average winter month is 60-90 therms for a typical home. A single-person household in winter using 60-90 therms is AVERAGE, not high. Do NOT flag winter gas usage as HIGH unless it exceeds 150 therms/month for a typical residential home. Always consider the billing month when rating usage — compare to seasonal norms, not annual averages. Rate as HIGH only if usage is 50%+ above typical seasonal norms for the region and household size.
WATER: ALWAYS use the household size provided in CUSTOMER CONTEXT to determine the usage rating. Never compare a 2-person household to a 4-person benchmark. Benchmarks per household size: 1p=2,500-3,500 gal/mo, 2p=5,000-6,500 gal/mo, 3p=7,500-9,000 gal/mo, 4p=9,000-12,000 gal/mo, 5p+=12,000-15,000 gal/mo. If usage is within 25% of the household benchmark, rate it AVERAGE. Rate HIGH only if 50%+ above the household benchmark. Rate VERY_HIGH only if 2x+ above the household benchmark. CRITICAL: Leak adjustments on the bill mean the utility already credited the excess — do NOT penalize the usage rating for a leak that has been resolved and credited. If the bill shows leak adjustment credits, acknowledge them positively and rate the current net usage against the household benchmark. Flag irrigation spikes (summer 2-3x winter with irrigation meter = normal). Flag new unexplained spikes with no credit or seasonal explanation.

STEP 4 — REGIONAL COMPARISON
Compare total bill to regional averages for similar facility type and climate zone.

STEP 5 — RECOMMENDATIONS (specific, not generic)

ELECTRIC BILLS:
NEGOTIATION: wrong tax rates, billing audit, LIHEAP/CARE/FERA (20-35% off), challenge estimated reads
RATE PLANS: TOU (shift to off-peak 9PM-6AM), EV rate plans, net metering, Real-Time Pricing, demand charge management
PROVIDERS: Community Choice Aggregators, retail providers in deregulated states, community solar
EQUIPMENT: smart thermostat, heat pump HVAC, heat pump water heater, LED lighting, rooftop solar (30% ITC)
BEHAVIORAL: load shifting, vampire load audit (3AM meter check), cold water laundry
INCENTIVES: Federal ITC (30%), utility rebates, HOMES program, IRA credits

GAS BILLS:
NEGOTIATION: challenge rate class, request leak audit if spike detected, dispute estimated reads, budget billing
RATE PLANS: budget billing to smooth seasonal swings, interruptible service (saves 15-30% for large commercial), transportation-only rates
PROVIDERS: deregulated states (GA, OH, FL, TX, PA) — compare retail gas suppliers, savings 10-25% possible
EQUIPMENT: condensing furnace 95%+ AFUE, tankless water heater, smart thermostat, boiler tune-up ($150-300/yr)
BEHAVIORAL: setback 7-10°F when away/asleep (saves 10%), seal drafts, insulate hot water pipes, reduce water heater to 120°F
INCENTIVES: Federal 25C tax credit (30% up to $600), utility rebates ($100-500), weatherization assistance programs

WATER BILLS:
NEGOTIATION: challenge sewer multiplier for irrigation, dispute tier misassignment, request leak adjustment credit
RATE PLANS: irrigation meters (lower sewer costs), reclaimed water programs for irrigation (50-70% cheaper), budget billing
CONSERVATION: WaterSense fixtures (20% reduction), low-flow toilets (saves 13,000 gal/yr), drip irrigation, smart irrigation controllers (saves 15-50 gal/day), rainwater harvesting where legal
LEAK DETECTION: check meter at 2AM — any movement = active leak; toilet dye test; inspect irrigation quarterly; pipe insulation
INDUSTRIAL: cooling tower optimization, process water recycling, condensate recovery, RO reject water reuse
INCENTIVES: utility rebates for WaterSense fixtures ($50-200), irrigation efficiency rebates, industrial water efficiency grants

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "billType":"ELECTRIC|GAS|WATER|COMBINED",
  "provider":"utility company name or Unknown","accountNumber":"account number or N/A",
  "billingPeriod":"billing period dates or N/A","totalCharged":"$XXX.XX",
  "totalUsage":"XXX kWh or XXX therms or XXX gallons — use correct unit",
  "ratePerUnit":"$X.XXX per kWh / therm / CCF / gallon — use correct unit",
  "billStatus":"SUSPICIOUS|LIKELY_CORRECT|NEEDS_REVIEW","billStatusReason":"brief explanation",
  "suspiciousCharges":["array or empty"],"potentialErrors":["array or empty"],
  "usageRating":"LOW|AVERAGE|HIGH|VERY_HIGH","usageRatingExplanation":"explanation with appropriate benchmark",
  "regionalComparison":{"yourBill":"$XXX","regionalAverage":"$XXX","percentageDifference":"+/-XX% above/below average","comparisonNote":"context"},
  "recommendations":{
    "negotiation":[{"title":"","description":"","estimatedSavings":"$XX/month","difficulty":"Easy|Medium|Hard"}],
    "ratePlans":[{"title":"","description":"","estimatedSavings":"$XX/month","difficulty":"Easy|Medium|Hard"}],
    "providers":[{"title":"","description":"","estimatedSavings":"$XX/month","difficulty":"Easy|Medium|Hard"}],
    "equipment":[{"title":"","description":"","estimatedSavings":"$XX/month","difficulty":"Easy|Medium|Hard","upfrontCost":"$XXX"}],
    "behavioral":[{"title":"","description":"","estimatedSavings":"$XX/month","difficulty":"Easy|Medium|Hard"}],
    "incentives":[{"title":"","description":"","estimatedSavings":"one-time $XXX or $XX/month","difficulty":"Easy|Medium|Hard"}]
  },
  "totalPotentialMonthlySavings":"$XX-$XX/month","totalPotentialAnnualSavings":"$XXX-$XXXX/year",
  "priorityAction":"single most impactful action","analysisConfidence":"HIGH|MEDIUM|LOW","confidenceNote":"reason"
}` + sizeNote + commercialNote;
};
const SYSTEM_PROMPT = buildSystemPrompt(); // default — overridden per-analysis

// ─── CHAT PROMPT ───────────────────────────────────────────────────────────────
const buildChatPrompt = (r) => `You are an expert utility bill analyst specializing in electricity, gas, and water bills. A customer has questions about their specific analyzed bill. Full analysis:
${JSON.stringify(r, null, 2)}
Answer directly using this bill's exact data. Provide exact scripts for calling the utility. Keep responses to 2-5 sentences unless steps are needed. Never invent numbers.`;

// ─── DEMO DATA ─────────────────────────────────────────────────────────────────
const mkDate = (n) => new Date(Date.now() - n * 30 * 24 * 3600 * 1000).toISOString();
const DEMO_BILLS = [
  { id:"d1", analyzedAt:mkDate(5), result:{ billType:"ELECTRIC", provider:"Pacific Gas & Electric", billingPeriod:"Oct 15 – Nov 14, 2024", totalCharged:"$198.20", totalKwh:"612 kWh", ratePerKwh:"$0.324", billStatus:"LIKELY_CORRECT", billStatusReason:"Charges align with published tier rates.", suspiciousCharges:[], potentialErrors:[], usageRating:"AVERAGE", usageRatingExplanation:"612 kWh is close to the California average for a similar home in October.", regionalComparison:{yourBill:"$198.20",regionalAverage:"$189.00",percentageDifference:"+5% above average",comparisonNote:"Slightly above average, likely due to mild heating."}, recommendations:{ negotiation:[{title:"Apply for CARE Program",description:"If income-eligible, saves 20–35% on your entire bill. Apply at pge.com/CARE in 10 minutes.",estimatedSavings:"$40–$69/month",difficulty:"Easy"}], ratePlans:[{title:"Switch to TOU-C Plan",description:"Run dishwasher and laundry after 9 PM for significantly cheaper off-peak rates.",estimatedSavings:"$18–$30/month",difficulty:"Easy"}], providers:[], equipment:[{title:"Smart Thermostat (Nest/Ecobee)",description:"AI-driven scheduling cuts 10–15% off HVAC automatically.",estimatedSavings:"$15–$25/month",difficulty:"Easy",upfrontCost:"$150–$250"}], behavioral:[{title:"Shift Laundry to Off-Peak",description:"Run washer/dryer after 9 PM every day.",estimatedSavings:"$8–$12/month",difficulty:"Easy"}], incentives:[{title:"PG&E Thermostat Rebate",description:"Up to $100 rebate on qualifying smart thermostat.",estimatedSavings:"One-time $75–$100",difficulty:"Easy"}] }, totalPotentialMonthlySavings:"$40–$80/month", totalPotentialAnnualSavings:"$480–$960/year", priorityAction:"Apply for CARE program — 10 minutes online for a guaranteed 20–35% discount on every bill.", analysisConfidence:"HIGH", confidenceNote:"Clear bill with all line items visible." }},
  { id:"d2", analyzedAt:mkDate(4), result:{ billType:"ELECTRIC", provider:"Pacific Gas & Electric", billingPeriod:"Nov 15 – Dec 14, 2024", totalCharged:"$231.50", totalKwh:"724 kWh", ratePerKwh:"$0.320", billStatus:"NEEDS_REVIEW", billStatusReason:"Usage jumped 18% vs prior month. Possible estimated meter read.", suspiciousCharges:["Possible estimated meter read — no technician visit logged"], potentialErrors:["Baseline allowance not increased for winter heating season"], usageRating:"HIGH", usageRatingExplanation:"724 kWh is 15% above average for a similar home in December.", regionalComparison:{yourBill:"$231.50",regionalAverage:"$201.00",percentageDifference:"+15% above average",comparisonNote:"Above average for December — investigate heating system efficiency."}, recommendations:{ negotiation:[{title:"Request Actual Meter Read",description:"Call PG&E and challenge the estimated read. Demand an actual technician read or smart meter verification.",estimatedSavings:"$20–$35/month",difficulty:"Easy"}], ratePlans:[{title:"Switch to TOU-C",description:"Shift evening usage to after 9 PM.",estimatedSavings:"$22–$38/month",difficulty:"Easy"}], providers:[{title:"Peninsula Clean Energy (PCE)",description:"CCA at ~3 cents/kWh cheaper than PG&E. Same grid, lower rates.",estimatedSavings:"$18–$30/month",difficulty:"Easy"}], equipment:[{title:"Heat Pump Upgrade",description:"Replace gas furnace with air-source heat pump — 3–4x more efficient.",estimatedSavings:"$45–$70/month",difficulty:"Hard",upfrontCost:"$8,000–$14,000"}], behavioral:[{title:"Thermostat Setback",description:"Drop to 62°F at night. Each degree saves ~2% on heating.",estimatedSavings:"$18–$28/month",difficulty:"Easy"}], incentives:[{title:"Federal Heat Pump Tax Credit",description:"30% ITC on qualifying heat pump, up to $2,000/year.",estimatedSavings:"One-time $2,000–$4,200",difficulty:"Medium"}] }, totalPotentialMonthlySavings:"$60–$110/month", totalPotentialAnnualSavings:"$720–$1,320/year", priorityAction:"Call PG&E to dispute the estimated meter read — this spike may reverse completely.", analysisConfidence:"MEDIUM", confidenceNote:"Possible read error makes comparison less reliable." }},
  { id:"d3", analyzedAt:mkDate(3), result:{ billType:"ELECTRIC", provider:"Pacific Gas & Electric", billingPeriod:"Dec 15 – Jan 14, 2025", totalCharged:"$274.10", totalKwh:"856 kWh", ratePerKwh:"$0.320", billStatus:"SUSPICIOUS", billStatusReason:"Utility Users Tax at 9.5% exceeds city maximum of 7.5%. Nuclear decommissioning fee doubled.", suspiciousCharges:["Utility Users Tax at 9.5% — city legal maximum is 7.5%","Nuclear Decommissioning fee doubled vs. prior month"], potentialErrors:["Baseline zone may be misassigned — check climate zone on account"], usageRating:"VERY_HIGH", usageRatingExplanation:"856 kWh is 36% above the California average of 629 kWh/month for January.", regionalComparison:{yourBill:"$274.10",regionalAverage:"$189.00",percentageDifference:"+45% above average",comparisonNote:"Significantly above average — billing errors compound with high usage."}, recommendations:{ negotiation:[{title:"Dispute Tax Rate Immediately",description:"Call PG&E at 1-800-743-5000. Say: 'The Utility Users Tax on my bill is 9.5%, which exceeds my city's legal maximum of 7.5%. I'm requesting correction and retroactive refund.'",estimatedSavings:"$25–$45/month",difficulty:"Easy"},{title:"Request Full Billing Audit",description:"Ask for a 12-month billing review to find all systematic overcharges.",estimatedSavings:"$20–$60 refund",difficulty:"Easy"}], ratePlans:[{title:"TOU-C Rate Plan",description:"Shift heavy loads to after 9 PM.",estimatedSavings:"$28–$45/month",difficulty:"Easy"}], providers:[{title:"Peninsula Clean Energy",description:"Switch to this CCA for lower base rates.",estimatedSavings:"$22–$38/month",difficulty:"Easy"}], equipment:[{title:"Rooftop Solar (6kW System)",description:"At this usage, a 6kW system offsets 85–100% of consumption. 30% federal ITC applies.",estimatedSavings:"$180–$230/month",difficulty:"Hard",upfrontCost:"$18,000 (after ITC: ~$12,600)"}], behavioral:[{title:"3 AM Vampire Load Check",description:"Check smart meter at 3 AM — above 0.5 kWh/hr means significant standby waste.",estimatedSavings:"$15–$30/month",difficulty:"Easy"}], incentives:[{title:"Federal Solar ITC (30%)",description:"30% investment tax credit on rooftop solar. On $18K that's $5,400 back.",estimatedSavings:"One-time $3,780–$5,400",difficulty:"Medium"}] }, totalPotentialMonthlySavings:"$95–$180/month", totalPotentialAnnualSavings:"$1,140–$2,160/year", priorityAction:"Call PG&E immediately to dispute the Utility Users Tax overcharge — retroactive refund likely plus $25–$45/month going forward.", analysisConfidence:"HIGH", confidenceNote:"Billing errors clearly visible in line items." }},
  { id:"d4", analyzedAt:mkDate(2), result:{ billType:"ELECTRIC", provider:"Pacific Gas & Electric", billingPeriod:"Jan 15 – Feb 14, 2025", totalCharged:"$252.80", totalKwh:"789 kWh", ratePerKwh:"$0.320", billStatus:"NEEDS_REVIEW", billStatusReason:"Usage still elevated but dropped from January after dispute filed.", suspiciousCharges:[], potentialErrors:["Tax rate correction may not yet be reflected — check Utility Users Tax line item"], usageRating:"HIGH", usageRatingExplanation:"789 kWh is 25% above average. Heating loads still elevated.", regionalComparison:{yourBill:"$252.80",regionalAverage:"$189.00",percentageDifference:"+34% above average",comparisonNote:"Improving — bill dropped $21 from last month."}, recommendations:{ negotiation:[{title:"Confirm Tax Rate Correction Applied",description:"Verify Utility Users Tax was corrected to 7.5%. If not, escalate to the PUC.",estimatedSavings:"$25–$45/month",difficulty:"Easy"}], ratePlans:[{title:"TOU-C Plan — Switch Now",description:"Spring/summer savings will be significant on off-peak rates.",estimatedSavings:"$25–$40/month",difficulty:"Easy"}], providers:[], equipment:[{title:"Heat Pump Water Heater",description:"Water heating is ~18-22% of this bill. A HPWH uses 60% less energy.",estimatedSavings:"$30–$48/month",difficulty:"Medium",upfrontCost:"$1,200–$1,800"}], behavioral:[{title:"Cold Water Laundry",description:"90% of washer energy goes to heating water. Cold wash saves immediately.",estimatedSavings:"$8–$15/month",difficulty:"Easy"}], incentives:[{title:"PG&E HPWH Rebate",description:"Up to $300 rebate on qualifying heat pump water heater installation.",estimatedSavings:"One-time $200–$300",difficulty:"Easy"}] }, totalPotentialMonthlySavings:"$70–$120/month", totalPotentialAnnualSavings:"$840–$1,440/year", priorityAction:"Verify the tax correction landed. Then switch to TOU-C — it's free and saves immediately.", analysisConfidence:"MEDIUM", confidenceNote:"Dispute outcome pending verification." }},
  { id:"d5", analyzedAt:mkDate(1), result:{ billType:"ELECTRIC", provider:"Pacific Gas & Electric", billingPeriod:"Feb 15 – Mar 14, 2025", totalCharged:"$218.40", totalKwh:"681 kWh", ratePerKwh:"$0.321", billStatus:"LIKELY_CORRECT", billStatusReason:"Tax rate corrected to 7.5%. Usage trending down toward seasonal average.", suspiciousCharges:[], potentialErrors:[], usageRating:"AVERAGE", usageRatingExplanation:"681 kWh is 8% above the spring average — normal for late winter.", regionalComparison:{yourBill:"$218.40",regionalAverage:"$195.00",percentageDifference:"+12% above average",comparisonNote:"Approaching average. Bill dropped $55 since January peak."}, recommendations:{ negotiation:[], ratePlans:[{title:"TOU-C Plan — Switch Before Summer",description:"Switching now yields strong savings before peak season.",estimatedSavings:"$20–$35/month",difficulty:"Easy"}], providers:[{title:"Community Solar Subscription",description:"Subscribe to a local solar farm share for 8–12% bill credits. No rooftop needed.",estimatedSavings:"$17–$26/month",difficulty:"Easy"}], equipment:[{title:"Smart Thermostat + CARE Program",description:"Combine CARE discount with smart thermostat automation for compounding savings.",estimatedSavings:"$50–$80/month",difficulty:"Easy",upfrontCost:"$150–$250"}], behavioral:[{title:"Load Shifting (Pre-TOU)",description:"Keep running appliances after 9 PM — pays off significantly once on TOU-C.",estimatedSavings:"$12–$20/month",difficulty:"Easy"}], incentives:[{title:"IRA HOMES Program Rebates",description:"Up to $8,000 for whole-home efficiency improvements depending on income.",estimatedSavings:"One-time $2,000–$8,000",difficulty:"Medium"}] }, totalPotentialMonthlySavings:"$50–$90/month", totalPotentialAnnualSavings:"$600–$1,080/year", priorityAction:"Switch to TOU-C rate plan immediately — spring is the ideal time before summer peak pricing kicks in.", analysisConfidence:"HIGH", confidenceNote:"Clean bill with all corrections applied." }},
];

// ─── THEME ─────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#07070f", bgCard:"rgba(255,255,255,0.03)", bgCard2:"rgba(255,255,255,0.05)",
  bgCard3:"rgba(255,255,255,0.02)", border:"rgba(255,255,255,0.07)", borderAccent:"rgba(56,189,248,0.18)",
  topbar:"rgba(7,7,15,0.95)", topbarBorder:"rgba(255,255,255,0.06)",
  text:"#E8EAF0", textSub:"#6B7A9A", textDim:"#3D4559", textFaint:"#1e2230",
  navBtn:"#4A5568", uploadBorder:"rgba(255,255,255,0.1)", uploadBg:"rgba(255,255,255,0.018)",
  chartTip:"#0d0d1e", chartTipBorder:"rgba(56,189,248,0.25)",
  chartGrid:"rgba(255,255,255,0.045)", chartTick:"#4A5568", refLine:"rgba(255,255,255,0.15)",
  chatBg:"rgba(255,255,255,0.02)", chatInputBg:"rgba(255,255,255,0.06)",
  chatInputBorder:"rgba(255,255,255,0.12)", chatUserBubble:"rgba(56,189,248,0.18)",
  chatBotBubble:"rgba(255,255,255,0.05)", chatBotBorder:"rgba(255,255,255,0.09)",
  statusBarBg:"rgba(255,255,255,0.05)",
  errorBg:"rgba(255,59,48,0.1)", errorBorder:"rgba(255,59,48,0.28)",
  suspBg:"rgba(255,59,48,0.08)", suspBorder:"rgba(255,59,48,0.2)",
  warnBg:"rgba(255,149,0,0.08)", warnBorder:"rgba(255,149,0,0.2)",
  prioBg:"rgba(56,189,248,0.06)", prioBorder:"rgba(56,189,248,0.18)",
  savingsBg:"rgba(56,189,248,0.05)", savingsBorder:"rgba(56,189,248,0.12)",
  recBg:"rgba(255,255,255,0.028)", recBorder:"rgba(56,189,248,0.09)",
  recDoneBg:"rgba(52,199,89,0.06)", recDoneBorder:"rgba(52,199,89,0.15)",
  tabActive:"rgba(56,189,248,0.16)",
  billRowBg:"rgba(255,255,255,0.022)", billRowBorder:"rgba(255,255,255,0.055)",
  trackerHeroBg:"linear-gradient(135deg,rgba(52,199,89,0.08),rgba(56,189,248,0.05))",
  trackerHeroBorder:"rgba(52,199,89,0.18)",
  scrollTrack:"#090912", scrollThumb:"#1a1a2e",
  isDark:true,
};
const LIGHT = {
  bg:"#F2F4F8", bgCard:"#FFFFFF", bgCard2:"#F8FAFC", bgCard3:"#F4F6FA",
  border:"rgba(0,0,0,0.08)", borderAccent:"rgba(14,165,233,0.22)",
  topbar:"rgba(255,255,255,0.96)", topbarBorder:"rgba(0,0,0,0.07)",
  text:"#1A1A2E", textSub:"#4A5568", textDim:"#9CA3AF", textFaint:"#D1D5DB",
  navBtn:"#6B7280", uploadBorder:"rgba(0,0,0,0.1)", uploadBg:"rgba(0,0,0,0.015)",
  chartTip:"#FFFFFF", chartTipBorder:"rgba(14,165,233,0.22)",
  chartGrid:"rgba(0,0,0,0.05)", chartTick:"#9CA3AF", refLine:"rgba(0,0,0,0.12)",
  chatBg:"#F8FAFC", chatInputBg:"#FFFFFF", chatInputBorder:"rgba(0,0,0,0.12)",
  chatUserBubble:"rgba(14,165,233,0.1)", chatBotBubble:"#FFFFFF",
  chatBotBorder:"rgba(0,0,0,0.08)",
  statusBarBg:"rgba(0,0,0,0.04)",
  errorBg:"rgba(255,59,48,0.06)", errorBorder:"rgba(255,59,48,0.2)",
  suspBg:"rgba(255,59,48,0.06)", suspBorder:"rgba(255,59,48,0.15)",
  warnBg:"rgba(255,149,0,0.06)", warnBorder:"rgba(255,149,0,0.15)",
  prioBg:"rgba(14,165,233,0.06)", prioBorder:"rgba(14,165,233,0.2)",
  savingsBg:"rgba(14,165,233,0.05)", savingsBorder:"rgba(14,165,233,0.15)",
  recBg:"#F8FAFC", recBorder:"rgba(14,165,233,0.1)",
  recDoneBg:"rgba(52,199,89,0.06)", recDoneBorder:"rgba(52,199,89,0.18)",
  tabActive:"rgba(14,165,233,0.1)",
  billRowBg:"#F8FAFC", billRowBorder:"rgba(0,0,0,0.06)",
  trackerHeroBg:"linear-gradient(135deg,rgba(52,199,89,0.07),rgba(14,165,233,0.04))",
  trackerHeroBorder:"rgba(52,199,89,0.2)",
  scrollTrack:"#EEF2F7", scrollThumb:"#CBD5E1",
  isDark:false,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const parseNum = (s) => { if(!s) return 0; const clean=String(s).replace(/,/g,""); const m=clean.match(/[\d]+\.?[\d]*/); return m?parseFloat(m[0]):0; };
const SC = {SUSPICIOUS:"#FF3B30",NEEDS_REVIEW:"#FF9500",LIKELY_CORRECT:"#34C759"};
const SL = {SUSPICIOUS:"⚠ SUSPICIOUS",NEEDS_REVIEW:"◉ NEEDS REVIEW",LIKELY_CORRECT:"✓ CORRECT"};
const UC = {LOW:"#34C759",AVERAGE:"#38BDF8",HIGH:"#FF9500",VERY_HIGH:"#FF3B30"};
const CAT_LABELS = {negotiation:"Negotiation",ratePlans:"Rate Plans",providers:"Providers",equipment:"Equipment",behavioral:"Habits",incentives:"Rebates"};
const CAT_ICONS = {negotiation:"💬",ratePlans:"📊",providers:"🔄",equipment:"⚙️",behavioral:"🧠",incentives:"💰"};

const BILL_TYPE_ICON = {"ELECTRIC":"⚡","GAS":"🔥","WATER":"💧","COMBINED":"🏭"};
const BILL_TYPE_COLOR = {"ELECTRIC":"#38BDF8","GAS":"#FF9500","WATER":"#34C759","COMBINED":"#A78BFA"};

const shortPeriod = (p) => {
  if(!p||p==="N/A") return "Unknown";
  // Named months: "Nov 23 – Dec 23, 2025"
  const m = p.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[^–—-]*[–—-][^–—-]*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*(\d{4})/i);
  if(m) return `${m[1]}–${m[2]} '${m[3].slice(2)}`;
  // Numeric: "07/22/2025 - 08/21/2025" → "07/22–08/21 '25"
  const n = p.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})[^\d]*(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if(n) return `${n[1]}/${n[2]}–${n[4]}/${n[5]} '${String(n[6]).slice(-2)}`;
  return p.slice(0,18);
};

// Extract low-end monthly savings estimate from strings like "$18–$30/month" or "One-time $100"
const parseMonthlySavings = (s) => {
  if(!s) return 0;
  if(/one.time|refund/i.test(s)) return 0; // one-time, not monthly
  const m = s.match(/[\d,]+\.?[\d]*/); if(!m) return 0;
  const val = parseFloat(m[0].replace(/,/g,""))||0;
  return Math.min(val, 500); // hard cap: no single rec saves more than $500/mo
};

const actionId = (billId, cat, title) => `${billId}::${cat}::${title}`;

// Collect all recs from a bill as flat array
const allRecs = (bill) => {
  if(!bill?.result?.recommendations) return [];
  const cats = ["negotiation","ratePlans","providers","equipment","behavioral","incentives"];
  return cats.flatMap(cat =>
    (bill.result.recommendations[cat]||[]).map(r => ({...r, cat, billId:bill.id, billPeriod:bill.result.billingPeriod, provider:bill.result.provider}))
  );
};

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────
const StatusBadge = ({status, small}) => (
  <span style={{background:SC[status]||"#6B7280",color:"#fff",padding:small?"2px 8px":"4px 12px",borderRadius:"4px",fontSize:small?"9px":"11px",fontWeight:"700",letterSpacing:"0.05em",fontFamily:"monospace",whiteSpace:"nowrap"}}>
    {SL[status]}
  </span>
);

const DiffPill = ({d}) => {
  const c={Easy:"#34C759",Medium:"#FF9500",Hard:"#FF3B30"}[d]||"#777";
  return <span style={{background:c+"1a",color:c,border:`1px solid ${c}33`,padding:"2px 8px",borderRadius:"3px",fontSize:"10px",fontWeight:"700",flexShrink:0}}>{d}</span>;
};

const SecHeader = ({icon,title,T,right}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.borderAccent}`,paddingBottom:"10px",marginBottom:"14px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
      <span style={{fontSize:"13px"}}>{icon}</span>
      <span style={{fontSize:"10px",fontWeight:"700",letterSpacing:"0.14em",color:"#38BDF8",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{title}</span>
    </div>
    {right}
  </div>
);

// Recommendation card with completion checkbox
const RecCard = ({item, T, completed, onToggle, actionKey}) => (
  <div style={{background:completed?T.recDoneBg:T.recBg, border:`1px solid ${completed?T.recDoneBorder:T.recBorder}`, borderRadius:"9px", padding:"13px 14px", marginBottom:"8px", transition:"all .2s", opacity:completed?0.75:1}}>
    <div style={{display:"flex",gap:"10px",alignItems:"flex-start"}}>
      {/* Checkbox */}
      <button onClick={()=>onToggle&&onToggle(actionKey,item)} style={{flexShrink:0,marginTop:"1px",width:"20px",height:"20px",borderRadius:"5px",border:`2px solid ${completed?"#34C759":"rgba(52,199,89,0.35)"}`,background:completed?"#34C759":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s",color:"#fff",fontSize:"11px",fontWeight:"700"}}>
        {completed?"✓":""}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px",marginBottom:"4px"}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:"600",color:completed?"#34C759":"#38BDF8",textDecoration:completed?"line-through":"none"}}>{item.title}</span>
          <DiffPill d={item.difficulty}/>
        </div>
        <div style={{fontSize:"12px",color:T.textSub,lineHeight:"1.6",marginBottom:"6px"}}>{item.description}</div>
        <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
          <span style={{fontSize:"11px"}}><span style={{color:T.textDim}}>Saves: </span><span style={{color:completed?"#34C759":"#34C759",fontWeight:"700",fontFamily:"monospace"}}>{item.estimatedSavings}</span></span>
          {item.upfrontCost&&<span style={{fontSize:"11px"}}><span style={{color:T.textDim}}>Cost: </span><span style={{color:"#FF9500",fontFamily:"monospace"}}>{item.upfrontCost}</span></span>}
        </div>
      </div>
    </div>
  </div>
);

const ChartTip = ({active,payload,label,T}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:T.chartTip,border:`1px solid ${T.chartTipBorder}`,borderRadius:"8px",padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:T.text,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
      <div style={{color:T.textDim,marginBottom:"5px",fontSize:"10px"}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color,fontWeight:"600"}}>
          {p.name}: {p.name==="Cost"?`$${p.value.toFixed(2)}`:p.name==="Rate"?`$${p.value.toFixed(3)}`:`${p.value}`}
        </div>
      ))}
    </div>
  );
};

// ─── REPORT HTML ───────────────────────────────────────────────────────────────
function buildReport(d, completedActions) {
  const now=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const sc=SC[d.billStatus]||"#FF9500";
  const cats=["negotiation","ratePlans","providers","equipment","behavioral","incentives"];
  const recs=cats.flatMap(cat=>(d.recommendations[cat]||[]).map(i=>({...i,cat:CAT_LABELS[cat]})));
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Energy Audit</title><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;600&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#f9fafb;color:#1a1a2e;-webkit-print-color-adjust:exact}
  .page{max-width:960px;margin:0 auto;background:#fff}.hdr{background:#0d0d1a;color:#fff;padding:44px 52px 36px}.lbl{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.2em;color:#38BDF8;margin-bottom:10px;text-transform:uppercase}.ttl{font-family:'DM Serif Display',serif;font-size:36px;margin-bottom:6px}.sub{font-size:13px;color:#8892a4;margin-bottom:28px}.meta{display:flex;gap:44px;flex-wrap:wrap}.ml label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:3px}.ml span{font-family:'DM Mono',monospace;font-size:13px;color:#fff}.bdg{display:inline-block;padding:3px 12px;border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:#fff;margin-top:3px}.body{padding:44px 52px}.sec{margin-bottom:36px}.st{font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #f3f4f6;padding-bottom:8px;margin-bottom:18px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:18px}.stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:18px}.sl{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px}.sv{font-family:'DM Mono',monospace;font-size:20px;font-weight:600}.pri{background:linear-gradient(135deg,#0d0d1a,#1a1a3e);color:#fff;border-radius:10px;padding:20px 24px;margin-bottom:28px;border-left:4px solid #38BDF8}.pl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.15em;color:#38BDF8;margin-bottom:6px}.pt{font-size:14px;line-height:1.6;color:#e5e7eb}table{width:100%;border-collapse:collapse}th{background:#f9fafb;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;text-align:left;padding:9px 11px;border-bottom:2px solid #e5e7eb}td{padding:9px 11px;border-bottom:1px solid #e5e7eb;font-size:12px}.done td{background:#f0fdf4}.sv2{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:10px;padding:20px 24px;margin-top:28px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px}.sv2l{font-size:12px;color:#065f46;margin-bottom:3px}.sv2v{font-family:'DM Mono',monospace;font-size:26px;font-weight:700;color:#047857}.ftr{background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 52px;display:flex;justify-content:space-between;align-items:center}.fb{font-family:'DM Mono',monospace;font-size:12px;color:#6b7280}.fd{font-size:10px;color:#9ca3af;max-width:480px;line-height:1.5}.meth{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:28px 32px;margin-bottom:36px}.meth-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}.src-cat{margin-bottom:4px;font-family:'DM Mono',monospace;font-size:10px;font-weight:700;color:#38BDF8;letter-spacing:.1em;text-transform:uppercase}.src-item{margin-bottom:10px}.src-name{font-size:12px;font-weight:600;color:#1a1a2e;margin-bottom:2px}.src-desc{font-size:11px;color:#6b7280;line-height:1.5}.src-url{font-size:10px;color:#0ea5e9;font-family:'DM Mono',monospace}.disc{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin-top:28px;font-size:11px;color:#92400e;line-height:1.6}
  @media (prefers-color-scheme:dark){
    body{background:#07080f!important;color:#E8EAF0!important}
    .page{background:#0d0d1a!important}
    .body{background:#0d0d1a}
    .hdr{background:#040810!important;border-bottom:1px solid rgba(56,189,248,0.15)}
    .stat{background:rgba(255,255,255,0.04)!important;border-color:rgba(255,255,255,0.08)!important}
    .sl{color:#4A5568!important}
    .sv{color:#E8EAF0!important}
    .st{color:#4A5568!important;border-bottom-color:rgba(255,255,255,0.06)!important}
    .sec{color:#E8EAF0}
    table th{background:rgba(255,255,255,0.04)!important;color:#4A5568!important;border-bottom-color:rgba(255,255,255,0.08)!important}
    table td{border-bottom-color:rgba(255,255,255,0.05)!important;color:#E8EAF0!important}
    table tr:nth-child(even) td{background:rgba(255,255,255,0.025)!important}
    .done td{background:rgba(52,199,89,0.08)!important}
    .sv2{background:linear-gradient(135deg,rgba(52,199,89,0.1),rgba(56,189,248,0.06))!important;border-color:rgba(52,199,89,0.2)!important}
    .sv2l{color:#34C759!important}
    .sv2v{color:#34C759!important}
    .ftr{background:rgba(255,255,255,0.03)!important;border-top-color:rgba(255,255,255,0.06)!important}
    .fb{color:#4A5568!important}
    .fd{color:#3D4559!important}
    .meth{background:rgba(255,255,255,0.03)!important;border-color:rgba(255,255,255,0.06)!important}
    .src-name{color:#E8EAF0!important}
    .src-desc{color:#4A5568!important}
    .disc{background:rgba(255,149,0,0.08)!important;border-color:rgba(255,149,0,0.2)!important;color:#FF9500!important}
    .ml label{color:#4A5568!important}
    .sub{color:#4A5568!important}
    .rec-item{background:rgba(255,255,255,0.04)!important;border-color:rgba(255,255,255,0.08)!important;color:#E8EAF0!important}
    .rec-title{color:#E8EAF0!important}
    .shared-item{background:rgba(255,149,0,0.08)!important;border-color:rgba(255,149,0,0.2)!important;color:#FF9500!important}
    .bill-card-a{background:rgba(56,189,248,0.08)!important;border-color:rgba(56,189,248,0.2)!important}
    .bill-card-b{background:rgba(52,199,89,0.08)!important;border-color:rgba(52,199,89,0.2)!important}
    .bill-provider{color:#E8EAF0!important}
    .bill-period{color:#4A5568!important}
    .metric-label{color:#4A5568!important}
    .metrics-table tr{border-bottom-color:rgba(255,255,255,0.05)!important}
    .metrics-table tr:nth-child(even){background:rgba(255,255,255,0.025)!important}
    .metrics-table thead tr{background:rgba(255,255,255,0.04)!important}
    .vs-divider{color:#4A5568!important}
    .rec-col-title{opacity:0.9}
  }
  @media print{
    body{background:#fff!important;color:#1a1a2e!important}
    .page{background:#fff!important}
    .stat{background:#f9fafb!important;border-color:#e5e7eb!important}
    .sv{color:#1a1a2e!important}
    .ftr{background:#f9fafb!important}
  }
  </style></head><body><div class="page">
  <div class="hdr">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="52" height="52" style="border-radius:10px;box-shadow:0 0 16px rgba(56,189,248,0.5),0 2px 8px rgba(0,0,0,0.4);border:1px solid rgba(56,189,248,0.3);flex-shrink:0"><defs><radialGradient id="bgGlow" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1a3a5c" stop-opacity="0.8"/><stop offset="100%" stop-color="#07080f" stop-opacity="0"/></radialGradient><filter id="gs" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="gst" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="fg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="60%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#67e8f9"/></linearGradient><linearGradient id="dg" x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#38BDF8"/></linearGradient><linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#67e8f9"/><stop offset="100%" stop-color="#00d4ff"/></linearGradient></defs><rect width="120" height="120" fill="#0c1020" rx="20"/><rect width="120" height="120" fill="url(#bgGlow)" rx="20" opacity="0.4"/><path d="M6,18 L6,6 L18,6" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.7"/><path d="M102,6 L114,6 L114,18" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.7"/><path d="M6,102 L6,114 L18,114" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.7"/><path d="M102,114 L114,114 L114,102" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.7"/><path d="M60,17 L97.2,38.5 L97.2,81.5 L60,103 L22.8,81.5 L22.8,38.5" fill="none" stroke="#38BDF8" stroke-width="10" opacity="0.15"/><polygon points="60,17 97.2,38.5 97.2,81.5 60,103 22.8,81.5 22.8,38.5" fill="none" stroke="#38BDF8" stroke-width="2.2" filter="url(#gs)" opacity="1"/><polygon points="60,17 97.2,38.5 97.2,81.5 60,103 22.8,81.5 22.8,38.5" fill="none" stroke="#67e8f9" stroke-width="0.8" opacity="0.7"/><line x1="60" y1="60" x2="60" y2="17" stroke="#22d3ee" stroke-width="1.1" opacity="0.6" stroke-dasharray="4,3"/><line x1="60" y1="60" x2="97.2" y2="81.5" stroke="#22d3ee" stroke-width="1.1" opacity="0.6" stroke-dasharray="4,3"/><line x1="60" y1="60" x2="22.8" y2="81.5" stroke="#22d3ee" stroke-width="1.1" opacity="0.6" stroke-dasharray="4,3"/><circle cx="60" cy="17" r="4" fill="#00d4ff" filter="url(#gst)" opacity="0.95"/><circle cx="97.2" cy="81.5" r="4" fill="#00d4ff" filter="url(#gst)" opacity="0.95"/><circle cx="22.8" cy="81.5" r="4" fill="#00d4ff" filter="url(#gst)" opacity="0.95"/><circle cx="97.2" cy="38.5" r="2.2" fill="#38BDF8" opacity="0.65" filter="url(#gs)"/><circle cx="22.8" cy="38.5" r="2.2" fill="#38BDF8" opacity="0.65" filter="url(#gs)"/><circle cx="60" cy="103" r="2.2" fill="#38BDF8" opacity="0.65" filter="url(#gs)"/><circle cx="60" cy="60" r="2.8" fill="#67e8f9" filter="url(#gst)" opacity="0.9"/><path d="M83.5,37 L73,51.5 L79.5,51.5 L74.5,63 L86,47 L79,47 Z" fill="url(#bg)" filter="url(#gs)" opacity="0.97"/><path d="M60,71.5 C60,71.5 50.5,80 50.5,86.5 C50.5,92.5 54.7,97.5 60,97.5 C65.3,97.5 69.5,92.5 69.5,86.5 C69.5,80 60,71.5 60,71.5 Z" fill="url(#dg)" filter="url(#gs)" opacity="0.93"/><ellipse cx="56.5" cy="83.5" rx="3" ry="4" fill="rgba(255,255,255,0.3)" opacity="0.8"/><path d="M41,36.5 C39.5,40 35.5,45.5 35.5,52 C35.5,58.5 38,63 41,64.5 C44,63 46.5,58.5 46.5,52 C46.5,48 44.5,44 43.5,40.5 C43.5,40.5 45.5,45 45.5,50 C45.5,54 43.5,57.5 41,59 C38.5,57.5 36.5,54 36.5,50 C36.5,44.5 41,36.5 41,36.5 Z" fill="url(#fg)" filter="url(#gs)" opacity="0.95"/><path d="M41,47 C40,49.5 38.5,52 38.5,54.5 C38.5,57.5 39.5,59.5 41,60.5 C42.5,59.5 43.5,57.5 43.5,54.5 C43.5,52 42,49.5 41,47 Z" fill="rgba(255,255,255,0.22)"/></svg>
    <div>
      <div class="lbl" style="margin-bottom:4px">EnergyAudit AI</div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:#6b87a4;letter-spacing:0.08em">${({"ELECTRIC":"⚡ Electric Bill","GAS":"🔥 Gas Bill","WATER":"💧 Water Bill","COMBINED":"🏭 Combined Utility Bill"})[d.billType]||"⚡ Utility Bill"} Analysis</div>
    </div>
  </div><div class="ttl">Energy Bill Analysis</div><div class="sub">AI-Powered Billing Verification &amp; Cost Reduction Report</div><div class="meta"><div class="ml"><label>Provider</label><span>${d.provider}</span></div><div class="ml"><label>Period</label><span>${d.billingPeriod}</span></div><div class="ml"><label>Generated</label><span>${now}</span></div><div class="ml"><label>Status</label><br><span class="bdg" style="background:${sc}">${d.billStatus.replace("_"," ")}</span></div></div></div>
  <div class="body">
  <div class="pri"><div class="pl">★ Priority Action</div><div class="pt">${d.priorityAction}</div></div>
  <div class="sec"><div class="st">Bill Summary</div><div class="g3"><div class="stat"><div class="sl">Total Charged</div><div class="sv">${d.totalCharged}</div></div><div class="stat"><div class="sl">Usage</div><div class="sv">${d.totalUsage||d.totalKwh}</div></div><div class="stat"><div class="sl">Rate/Unit</div><div class="sv">${d.ratePerUnit||d.ratePerKwh}</div></div></div></div>
  <div class="sec"><div class="st">Regional Comparison</div><div class="g3"><div class="stat"><div class="sl">Your Bill</div><div class="sv">${d.regionalComparison?.yourBill||'N/A'}</div></div><div class="stat"><div class="sl">Regional Avg</div><div class="sv" style="color:#059669">${d.regionalComparison?.regionalAverage||'N/A'}</div></div><div class="stat"><div class="sl">Difference</div><div class="sv" style="color:${(d.regionalComparison?.percentageDifference||'+0%').startsWith('+')?'#dc2626':'#059669'}">${d.regionalComparison?.percentageDifference||'N/A'}</div></div></div></div>
  <div class="sec">
  <div class="sv2" style="margin-bottom:18px">
    <div><div class="sv2l">Monthly Savings Potential</div><div class="sv2v">${d.totalPotentialMonthlySavings}</div></div>
    <div><div class="sv2l">Annual Savings Potential</div><div class="sv2v">${d.totalPotentialAnnualSavings}</div></div>
    <div><div class="sv2l">Usage Rating</div><div class="sv2v" style="font-size:18px;color:${{"LOW":"#059669","AVERAGE":"#0ea5e9","HIGH":"#d97706","VERY_HIGH":"#dc2626"}[d.usageRating]||"#047857"}">${d.usageRating.replace("_"," ")}<span style="font-family:'DM Sans',sans-serif;font-size:11px;color:#6b7280;font-weight:400;margin-left:8px">${d.usageRatingExplanation}</span></div></div>
  </div>
  <div class="st">Recommendations</div><table><thead><tr><th style="text-align:center;width:44px">Done</th><th>Category</th><th>Action</th><th>Est. Savings</th><th>Difficulty</th></tr></thead><tbody>${recs.map(r=>{const done=completedActions&&[...completedActions].some(k=>k.endsWith("::"+r.title));return`<tr class="${done?'done':''}" style="text-align:center"><td style="text-align:center">${done?'<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;background:#059669;color:#fff;font-size:11px;font-weight:700">&#10003;</span>':'<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;border:2px solid #d1d5db;background:#fff"></span>'}</td><td>${{negotiation:"Negotiation",ratePlans:"Rate Plans",providers:"Providers",equipment:"Equipment",behavioral:"Habits",incentives:"Rebates"}[r.cat]||r.cat}</td><td style="font-weight:600">${r.title}</td><td style="color:#059669;font-weight:700;font-family:monospace">${r.estimatedSavings}</td><td><span style="background:${r.difficulty==='Easy'?'#d1fae5':r.difficulty==='Medium'?'#fef3c7':'#fee2e2'};color:${r.difficulty==='Easy'?'#065f46':r.difficulty==='Medium'?'#92400e':'#991b1b'};padding:2px 8px;border-radius:4px;font-weight:600;font-size:10px">${r.difficulty}</span></td></tr>`;}).join("")}</tbody></table>
<div class="sec meth">
  <div class="st">Sources &amp; Methodology</div>
  <p style="font-size:12px;color:#4b5563;line-height:1.7;margin-bottom:4px">This analysis cross-references your bill against publicly available utility tariff schedules, federal energy databases, and industry benchmarks. All findings are verifiable through the primary sources listed below.</p>
  <div class="meth-grid">
    <div>
      <div class="src-cat">Usage Benchmarks</div>
      <div class="src-item"><div class="src-name">U.S. Energy Information Administration (EIA)</div><div class="src-desc">Residential, commercial &amp; industrial electricity, gas, and water usage averages by state and climate zone.</div><div class="src-url">eia.gov/consumption</div></div>
      <div class="src-item"><div class="src-name">EPA WaterSense Program</div><div class="src-desc">Residential water use benchmarks (~9,000-10,000 gal/month per household; ~80-100 GPD per person), efficiency standards, and fixture certification data.</div><div class="src-url">epa.gov/watersense</div></div>
      <div class="src-item"><div class="src-name">ASHRAE Building Energy Standards</div><div class="src-desc">Commercial and industrial energy use intensity (EUI) benchmarks by facility type and climate zone.</div><div class="src-url">ashrae.org/standards</div></div>
    </div>
    <div>
      <div class="src-cat">Rate Structures &amp; Tariffs</div>
      <div class="src-item"><div class="src-name">NC Utilities Commission (NCUC)</div><div class="src-desc">Published tariff schedules for Duke Energy, Dominion, and all NC-regulated utilities. Rate classes, demand charges, baseline zones, and approved fee structures.</div><div class="src-url">ncuc.commerce.unc.gov</div></div>
      <div class="src-item"><div class="src-name">Duke Energy Carolinas Tariff Schedule</div><div class="src-desc">Residential and commercial rate schedules including TOU-C, RTP, GS-2, GS-3, TOU-GS, and demand ratchet clauses.</div><div class="src-url">duke-energy.com/rates</div></div>
      <div class="src-item"><div class="src-name">Municipal Water Rate Ordinances</div><div class="src-desc">Local tier/block rate structures, sewer multiplier policies, and irrigation meter credit rules. Publicly available through each municipality's utilities department.</div></div>
    </div>
    <div>
      <div class="src-cat">Billing Error &amp; Tax Standards</div>
      <div class="src-item"><div class="src-name">NC Department of Revenue</div><div class="src-desc">Utility Users Tax caps by municipality. State law sets maximum rates; bills exceeding these are disputable.</div><div class="src-url">ncdor.gov</div></div>
      <div class="src-item"><div class="src-name">NC Attorney General — Utilities Division</div><div class="src-desc">Consumer rights for billing disputes, estimated meter read challenges, and complaint procedures.</div><div class="src-url">ncdoj.gov/consumer</div></div>
      <div class="src-item"><div class="src-name">AWWA (American Water Works Association)</div><div class="src-desc">Industry standards for meter accuracy, sewer charge calculation methodology, and leak detection protocols.</div><div class="src-url">awwa.org</div></div>
    </div>
    <div>
      <div class="src-cat">Incentives &amp; Federal Programs</div>
      <div class="src-item"><div class="src-name">IRS — Inflation Reduction Act Credits</div><div class="src-desc">Energy Efficient Home Improvement Credit (25C): 30% up to $3,200/yr. Residential Clean Energy Credit (25D): 30% for solar/storage. Verified rates and eligibility.</div><div class="src-url">irs.gov/credits-deductions</div></div>
      <div class="src-item"><div class="src-name">ENERGY STAR — Federal Rebate Finder</div><div class="src-desc">Utility and state rebate programs for qualifying equipment including heat pumps, water heaters, and smart thermostats.</div><div class="src-url">energystar.gov/rebate-finder</div></div>
      <div class="src-item"><div class="src-name">DSIRE — Database of State Incentives</div><div class="src-desc">Comprehensive database of renewable energy and efficiency incentives by state, utility, and technology type.</div><div class="src-url">dsireusa.org</div></div>
    </div>
  </div>
  <div class="disc">
    <strong>Important Disclaimer:</strong> This report is generated using AI analysis of your submitted utility bill and cross-referenced against publicly available rate schedules and benchmarks. Rate schedules are subject to change; all identified errors and recommendations should be verified against your utility's current published tariff schedule before taking action. EnergyAudit AI recommends requesting a formal billing audit directly from your utility provider for any disputed charges. This report does not constitute legal or financial advice.
  </div>
</div>
</div></div></div>
  </div><div class="ftr"><div class="fb">⚡ EnergyAudit AI · ${now}</div><div class="fd">AI-generated report. Verify all recommendations with your utility provider and a licensed energy auditor before major decisions.</div></div></div></body></html>`;
}

// ─── COMPARE REPORT HTML ──────────────────────────────────────────────────────
function buildCompareReport(left, right, completedActions) {
  const now = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const rl = left.result, rr = right.result;
  const parseN = (s) => { if(!s) return 0; const clean=String(s).replace(/,/g,""); const m=clean.match(/[\d]+\.?[\d]*/); return m?parseFloat(m[0]):0; };
  const charged_l = parseN(rl.totalCharged), charged_r = parseN(rr.totalCharged);
  const kwh_l = parseN(rl.totalUsage||rl.totalKwh), kwh_r = parseN(rr.totalUsage||rr.totalKwh);
  const rate_l = parseN(rl.ratePerUnit||rl.ratePerKwh), rate_r = parseN(rr.ratePerUnit||rr.ratePerKwh);
  // Cap savings at bill total — AI sometimes hallucinates savings > bill amount
  const sav_l = Math.min(parseN(rl.totalPotentialMonthlySavings?.split("–")[0]), parseN(rl.totalCharged));
  const sav_r = Math.min(parseN(rr.totalPotentialMonthlySavings?.split("–")[0]), parseN(rr.totalCharged));
  const sc = {SUSPICIOUS:"#FF3B30",NEEDS_REVIEW:"#FF9500",LIKELY_CORRECT:"#34C759"};
  const deltaLabel = (vA, vB, prefix="$", invert=false) => {
    const diff = vB - vA;
    if(diff === 0) return {label:"—", color:"#6b7280"};
    const pct = vA !== 0 ? ((diff/vA)*100).toFixed(1) : 0;
    const better = invert ? diff < 0 : diff > 0;
    const color = better ? "#059669" : "#dc2626";
    const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
    return {label:`${sign}${prefix}${Math.abs(diff)<0.01&&prefix==="$"?Math.abs(diff).toFixed(3):Math.abs(diff).toFixed(prefix==="$"?2:0)} (${pct}%)`, color};
  };
  const metrics = [
    {label:"Total Charged", vl:`$${charged_l.toFixed(2)}`, vr:`$${charged_r.toFixed(2)}`, d:deltaLabel(charged_l,charged_r,"$",true)},
    {label:"Usage", vl:rl.totalUsage||`${kwh_l} kWh`, vr:rr.totalUsage||`${kwh_r} kWh`, d:deltaLabel(kwh_l,kwh_r,"",true)},
    {label:"Rate/Unit", vl:(rl.ratePerUnit||`$${rate_l.toFixed(3)}`).replace(/\s*\(.*\)/,"").trim(), vr:(rr.ratePerUnit||`$${rate_r.toFixed(3)}`).replace(/\s*\(.*\)/,"").trim(), d:deltaLabel(rate_l,rate_r,"$",true)},
    {label:"Savings Potential", vl:`$${sav_l}/mo`, vr:`$${sav_r}/mo`, d:deltaLabel(sav_l,sav_r,"$",false)},
  ];
  const cats = ["negotiation","ratePlans","providers","equipment","behavioral","incentives"];
  const catLabels = {negotiation:"Negotiation",ratePlans:"Rate Plans",providers:"Providers",equipment:"Equipment",behavioral:"Habits",incentives:"Rebates"};
  const recsL = cats.flatMap(cat=>(rl.recommendations[cat]||[]).map(r=>({...r,cat:catLabels[cat]})));
  const recsR = cats.flatMap(cat=>(rr.recommendations[cat]||[]).map(r=>({...r,cat:catLabels[cat]})));
  const titlesL = new Set(recsL.map(r=>r.title));
  const titlesR = new Set(recsR.map(r=>r.title));
  const shared = recsL.filter(r=>titlesR.has(r.title));
  const onlyL = recsL.filter(r=>!titlesR.has(r.title));
  const onlyR = recsR.filter(r=>!titlesL.has(r.title));
  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="48" height="48" style="border-radius:9px;box-shadow:0 0 14px rgba(56,189,248,0.5);border:1px solid rgba(56,189,248,0.3);flex-shrink:0"><defs><radialGradient id="bgGlow2" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1a3a5c" stop-opacity="0.8"/><stop offset="100%" stop-color="#07080f" stop-opacity="0"/></radialGradient><filter id="gs2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="gst2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="fg2" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#67e8f9"/></linearGradient><linearGradient id="dg2" x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#38BDF8"/></linearGradient><linearGradient id="bg22" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#67e8f9"/><stop offset="100%" stop-color="#00d4ff"/></linearGradient></defs><rect width="120" height="120" fill="#0c1020" rx="20"/><rect width="120" height="120" fill="url(#bgGlow2)" rx="20" opacity="0.4"/><polygon points="60,17 97.2,38.5 97.2,81.5 60,103 22.8,81.5 22.8,38.5" fill="none" stroke="#38BDF8" stroke-width="2.2" filter="url(#gs2)" opacity="1"/><line x1="60" y1="60" x2="60" y2="17" stroke="#22d3ee" stroke-width="1.1" opacity="0.6" stroke-dasharray="4,3"/><line x1="60" y1="60" x2="97.2" y2="81.5" stroke="#22d3ee" stroke-width="1.1" opacity="0.6" stroke-dasharray="4,3"/><line x1="60" y1="60" x2="22.8" y2="81.5" stroke="#22d3ee" stroke-width="1.1" opacity="0.6" stroke-dasharray="4,3"/><circle cx="60" cy="17" r="4" fill="#00d4ff" filter="url(#gst2)" opacity="0.95"/><circle cx="97.2" cy="81.5" r="4" fill="#00d4ff" filter="url(#gst2)" opacity="0.95"/><circle cx="22.8" cy="81.5" r="4" fill="#00d4ff" filter="url(#gst2)" opacity="0.95"/><circle cx="60" cy="60" r="2.8" fill="#67e8f9" filter="url(#gst2)" opacity="0.9"/><path d="M83.5,37 L73,51.5 L79.5,51.5 L74.5,63 L86,47 L79,47 Z" fill="url(#bg22)" filter="url(#gs2)" opacity="0.97"/><path d="M60,71.5 C60,71.5 50.5,80 50.5,86.5 C50.5,92.5 54.7,97.5 60,97.5 C65.3,97.5 69.5,92.5 69.5,86.5 C69.5,80 60,71.5 60,71.5 Z" fill="url(#dg2)" filter="url(#gs2)" opacity="0.93"/><path d="M41,36.5 C39.5,40 35.5,45.5 35.5,52 C35.5,58.5 38,63 41,64.5 C44,63 46.5,58.5 46.5,52 C46.5,48 44.5,44 43.5,40.5 C43.5,40.5 45.5,45 45.5,50 C45.5,54 43.5,57.5 41,59 C38.5,57.5 36.5,54 36.5,50 C36.5,44.5 41,36.5 41,36.5 Z" fill="url(#fg2)" filter="url(#gs2)" opacity="0.95"/></svg>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill Comparison Report</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;600&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#f9fafb;color:#1a1a2e;-webkit-print-color-adjust:exact}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{box-shadow:none!important}}
    @page{margin:0;size:A4}
    .page{max-width:960px;margin:0 auto;background:#fff}
    .hdr{background:#0d0d1a;color:#fff;padding:36px 48px 32px}
    .lbl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.18em;color:#38BDF8;text-transform:uppercase;margin-bottom:3px}
    .ttl{font-family:'DM Serif Display',serif;font-size:30px;margin-bottom:6px}
    .sub{font-size:12px;color:#8892a4;margin-bottom:24px}
    .meta{display:flex;gap:36px;flex-wrap:wrap}
    .ml label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:3px}
    .ml span{font-family:'DM Mono',monospace;font-size:12px;color:#fff}
    .body{padding:36px 48px}
    .sec{margin-bottom:32px}
    .st{font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #f3f4f6;padding-bottom:7px;margin-bottom:16px}
    .bills-grid{display:grid;grid-template-columns:1fr 60px 1fr;gap:0;margin-bottom:20px;align-items:center}
    .bill-card-a{background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.25);border-radius:9px;padding:14px 18px}
    .bill-card-b{background:rgba(5,150,105,0.06);border:1px solid rgba(5,150,105,0.25);border-radius:9px;padding:14px 18px}
    .bill-label{font-family:'DM Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px}
    .bill-provider{font-size:13px;font-weight:700;margin-bottom:2px}
    .bill-period{font-size:11px;color:#6b7280}
    .vs-divider{text-align:center;font-family:'DM Mono',monospace;font-weight:700;color:#9ca3af;font-size:13px}
    .metrics-table{width:100%;border-collapse:collapse}
    .metrics-table tr{border-bottom:1px solid #f3f4f6}
    .metrics-table td{padding:11px 14px;font-size:13px}
    .metrics-table tr:nth-child(even){background:#f9fafb}
    .metric-label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;text-align:center;vertical-align:middle}
    .metric-val-a{font-family:'DM Mono',monospace;font-weight:700;color:#0ea5e9}
    .metric-val-b{font-family:'DM Mono',monospace;font-weight:700;color:#059669;text-align:right}
    .delta{font-family:'DM Mono',monospace;font-size:11px;font-weight:700;text-align:center}
    .recs-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
    .rec-col-title{font-family:'DM Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}
    .rec-item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:6px;font-size:11px}
    .rec-title{font-weight:600;margin-bottom:2px}
    .rec-savings{color:#059669;font-family:'DM Mono',monospace;font-size:10px;font-weight:700}
    .shared-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .shared-item{background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:7px 10px;font-size:11px}
    .ftr{background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 48px;display:flex;justify-content:space-between;align-items:center}
    .fb{font-family:'DM Mono',monospace;font-size:11px;color:#6b7280}
    .fd{font-size:10px;color:#9ca3af;max-width:450px;line-height:1.5}
    .bdg{display:inline-block;padding:2px 8px;border-radius:4px;font-family:'DM Mono',monospace;font-size:9px;font-weight:700;color:#fff;margin-top:4px}
    @media (prefers-color-scheme:dark){
      body{background:#07080f!important;color:#E8EAF0!important}
      .page{background:#0d0d1a!important}
      .hdr{background:#040810!important}
      .stat,.rec-item{background:rgba(255,255,255,0.04)!important;border-color:rgba(255,255,255,0.08)!important}
      .sl,.bill-period,.vs-divider,.fd,.fb,.metric-label{color:#4A5568!important}
      .sv,.bill-provider,.rec-title{color:#E8EAF0!important}
      .st{color:#4A5568!important;border-bottom-color:rgba(255,255,255,0.06)!important}
      table th{background:rgba(255,255,255,0.04)!important;color:#4A5568!important;border-bottom-color:rgba(255,255,255,0.08)!important}
      table td{border-bottom-color:rgba(255,255,255,0.05)!important;color:#E8EAF0!important}
      .metrics-table tr:nth-child(even){background:rgba(255,255,255,0.025)!important}
      .bill-card-a{background:rgba(56,189,248,0.08)!important;border-color:rgba(56,189,248,0.2)!important}
      .bill-card-b{background:rgba(52,199,89,0.08)!important;border-color:rgba(52,199,89,0.2)!important}
      .shared-item{background:rgba(255,149,0,0.08)!important;border-color:rgba(255,149,0,0.2)!important;color:#FF9500!important}
      .ftr{background:rgba(255,255,255,0.03)!important;border-top-color:rgba(255,255,255,0.06)!important}
    }
    @media print{
      body{background:#fff!important;color:#1a1a2e!important}
      .page{background:#fff!important}
      .ftr{background:#f9fafb!important}
    }
  </style></head><body><div class="page">
  <div class="hdr">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      ${LOGO_SVG}
      <div><div class="lbl">EnergyAudit AI</div><div style="font-family:'DM Mono',monospace;font-size:11px;color:#6b87a4;letter-spacing:0.08em">⚖ Bill Comparison Report</div></div>
    </div>
    <div class="ttl">Bill Comparison</div>
    <div class="sub">${rl.billingPeriod} vs ${rr.billingPeriod}</div>
    <div class="meta">
      <div class="ml"><label>Generated</label><span>${now}</span></div>
      <div class="ml"><label>Provider A</label><span>${rl.provider}</span></div>
      <div class="ml"><label>Provider B</label><span>${rr.provider}</span></div>
    </div>
  </div>
  <div class="body">
    <div class="sec">
      <div class="st">Bills Being Compared</div>
      <div class="bills-grid">
        <div class="bill-card-a">
          <div class="bill-label" style="color:#0ea5e9">Bill A · Earlier</div>
          <div class="bill-provider">${rl.provider}</div>
          <div class="bill-period">${rl.billingPeriod}</div>
          <span class="bdg" style="background:${sc[rl.billStatus]||'#FF9500'}">${rl.billStatus.replace("_"," ")}</span>
        </div>
        <div class="vs-divider">vs</div>
        <div class="bill-card-b">
          <div class="bill-label" style="color:#059669">Bill B · Later</div>
          <div class="bill-provider">${rr.provider}</div>
          <div class="bill-period">${rr.billingPeriod}</div>
          <span class="bdg" style="background:${sc[rr.billStatus]||'#FF9500'}">${rr.billStatus.replace("_"," ")}</span>
        </div>
      </div>
    </div>
    <div class="sec">
      <div class="st">Metric Comparison</div>
      <table class="metrics-table">
        <thead><tr style="background:#f9fafb">
          <th style="padding:9px 14px;font-size:10px;color:#0ea5e9;font-family:'DM Mono',monospace;text-align:left;border-bottom:2px solid #e5e7eb">Bill A</th>
          <th style="padding:9px 14px;font-size:10px;color:#6b7280;text-align:center;border-bottom:2px solid #e5e7eb;letter-spacing:.08em;text-transform:uppercase">Metric</th>
          <th style="padding:9px 14px;font-size:10px;color:#6b7280;text-align:center;border-bottom:2px solid #e5e7eb;letter-spacing:.08em;text-transform:uppercase">Change</th>
          <th style="padding:9px 14px;font-size:10px;color:#059669;font-family:'DM Mono',monospace;text-align:right;border-bottom:2px solid #e5e7eb">Bill B</th>
        </tr></thead>
        <tbody>${metrics.map(m=>`<tr>
          <td class="metric-val-a">${m.vl}</td>
          <td class="metric-label">${m.label}</td>
          <td class="delta" style="color:${m.d.color}">${m.d.label}</td>
          <td class="metric-val-b">${m.vr}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="sec">
      <div class="st">Recommendations Analysis</div>
      <div class="recs-grid">
        <div>
          <div class="rec-col-title" style="color:#0ea5e9">Only in Bill A (${onlyL.length})</div>
          ${onlyL.length>0?onlyL.map(r=>`<div class="rec-item"><div class="rec-title">${r.title}</div><div class="rec-savings">${r.estimatedSavings}</div></div>`).join(""):`<div style="font-size:11px;color:#9ca3af;padding:8px 0">All recommendations also appear in Bill B</div>`}
        </div>
        <div>
          <div class="rec-col-title" style="color:#059669">Only in Bill B (${onlyR.length})</div>
          ${onlyR.length>0?onlyR.map(r=>`<div class="rec-item"><div class="rec-title">${r.title}</div><div class="rec-savings">${r.estimatedSavings}</div></div>`).join(""):`<div style="font-size:11px;color:#9ca3af;padding:8px 0">All recommendations also appear in Bill A</div>`}
        </div>
      </div>
      ${shared.length>0?`<div style="margin-top:12px"><div class="rec-col-title" style="color:#d97706;margin-bottom:8px">Persistent Issues — In Both Bills (${shared.length})</div><div class="shared-grid">${shared.map(r=>`<div class="shared-item"><div class="rec-title">${r.title}</div><div class="rec-savings">${r.estimatedSavings}</div></div>`).join("")}</div></div>`:""}
    </div>
  </div>
  <div class="ftr"><div class="fb">⚡ EnergyAudit AI · ${now}</div><div class="fd">AI-generated comparison report. Verify all findings against current published utility tariff schedules before taking action.</div></div>
</div></body></html>`;
}

// ─── TREND KPIs ───────────────────────────────────────────────────────────────
const TrendKPIs = ({bills, completedActions, T}) => {
  if(!bills.length) return null;
  const s=[...bills].sort((a,b)=>new Date(a.analyzedAt)-new Date(b.analyzedAt));
  const avg=bills.reduce((x,b)=>x+parseNum(b.result.totalCharged),0)/bills.length;
  const cd=bills.length>1?parseNum(s[s.length-1].result.totalCharged)-parseNum(s[0].result.totalCharged):0;
  const kd=bills.length>1?parseNum(s[s.length-1].result.totalUsage||s[s.length-1].result.totalKwh)-parseNum(s[0].result.totalUsage||s[0].result.totalKwh):0;
  const billTypes=new Set(bills.map(b=>b.result.billType).filter(Boolean));
  const usageUnit=billTypes.size===1?({ELECTRIC:"kWh",GAS:"therms",WATER:"gallons",COMBINED:"units"}[[...billTypes][0]]||"units"):"units";
  const susp=bills.filter(b=>b.result.billStatus==="SUSPICIOUS").length;
  const savLow=bills.reduce((x,b)=>x+Math.min(parseNum(b.result.totalPotentialMonthlySavings?.split("–")[0]),parseNum(b.result.totalCharged)),0);
  const completed=completedActions.size;
  const totalRecs=bills.reduce((x,b)=>x+allRecs(b).length,0);
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:"10px",marginBottom:"22px"}}>
      {[
        {label:"Avg Monthly Bill",v:`$${avg.toFixed(2)}`,c:T.text,note:`${bills.length} bill${bills.length>1?"s":""} tracked`},
        {label:"Cost Trend",v:bills.length>1?(cd>=0?`+$${cd.toFixed(2)}`:`-$${Math.abs(cd).toFixed(2)}`):"—",c:cd>10?"#FF3B30":cd<-10?"#34C759":"#FF9500",note:"first → latest"},
        {label:"Usage Trend",v:bills.length>1?(kd>=0?`+${kd.toFixed(0)}`:`-${Math.abs(kd).toFixed(0)}`)+` ${usageUnit}`:"—",c:(()=>{const thresh=usageUnit==="gallons"?500:usageUnit==="therms"?10:50;return kd>thresh?"#FF9500":kd<-thresh?"#34C759":T.textSub;})(),note:"first → latest"},
        {label:"Flagged Bills",v:`${susp}/${bills.length}`,c:susp>0?"#FF3B30":"#34C759",note:susp>0?"need attention":"all clear"},

      ].map(x=>(
        <div key={x.label} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"16px 18px"}}>
          <div style={{fontSize:"9px",color:T.textDim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:"6px"}}>{x.label}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"20px",fontWeight:"700",color:x.c}}>{x.v}</div>
          <div style={{fontSize:"9px",color:T.textFaint,marginTop:"4px"}}>{x.note}</div>
        </div>
      ))}
    </div>
  );
};

// ─── BILL CHAT ────────────────────────────────────────────────────────────────
const QUICK_QS = ["Why is my bill so high?","How do I dispute a charge?","Which recommendation saves the most?","Walk me through the priority action","What's causing my usage rating?","How do I switch rate plans?"];

const BillChat = ({billResult, T}) => {
  const [messages, setMessages] = useState([{role:"assistant",content:`Hi! I've analyzed your ${billResult.provider} bill for ${billResult.billingPeriod} — ${billResult.totalCharged} for ${billResult.totalUsage||billResult.totalKwh}. Ask me anything about the charges, how to act on a recommendation, or what's driving your costs.`}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  const send = async(text) => {
    const q=(text||input).trim(); if(!q||loading) return;
    setInput("");
    const history=messages.slice(-10);
    const newMsgs=[...history,{role:"user",content:q}];
    setMessages(p=>[...p,{role:"user",content:q}]); setLoading(true);
    try {
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:buildChatPrompt(billResult),messages:newMsgs.map(m=>({role:m.role,content:m.content}))})});
      if(!res.ok) throw new Error(`Server error ${res.status}`);
      const data=await res.json();
      if(data.error) throw new Error(data.error.message);
      const reply=data.content?.find(b=>b.type==="text")?.text||"Sorry, no response.";
      setMessages(p=>[...p,{role:"assistant",content:reply}]);
    } catch(e) { setMessages(p=>[...p,{role:"assistant",content:"⚠ Error: "+(e.message||"Try again.")}]); }
    finally { setLoading(false); }
  };
  return (
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden",marginTop:"14px"}}>
      <div style={{padding:"11px 15px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"8px",background:T.bgCard2}}>
        <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#34C759",boxShadow:"0 0 5px #34C759"}}/>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",fontWeight:"700",letterSpacing:"0.12em",color:"#38BDF8",textTransform:"uppercase"}}>Bill Chat</span>
        <span style={{fontSize:"11px",color:T.textDim}}>· Ask anything about this bill</span>
      </div>
      <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:"5px",flexWrap:"wrap",background:T.chatBg}}>
        {QUICK_QS.map(q=>(<button key={q} onClick={()=>send(q)} disabled={loading} style={{background:T.bgCard,border:`1px solid ${T.border}`,color:T.textSub,padding:"3px 9px",borderRadius:"20px",fontSize:"11px",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.5:1}}>{q}</button>))}
      </div>
      <div style={{height:"280px",overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:"9px",background:T.chatBg}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:"8px",alignItems:"flex-start"}}>
            {m.role==="assistant"&&<div style={{width:"22px",height:"22px",borderRadius:"50%",background:"linear-gradient(135deg,#38BDF8,#0EA5E9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",flexShrink:0,marginTop:"2px"}}>⚡</div>}
            <div style={{maxWidth:"78%",background:m.role==="user"?T.chatUserBubble:T.chatBotBubble,border:m.role==="user"?"1px solid rgba(56,189,248,0.2)":`1px solid ${T.chatBotBorder}`,borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"8px 12px",fontSize:"13px",lineHeight:"1.6",color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.content}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"22px",height:"22px",borderRadius:"50%",background:"linear-gradient(135deg,#38BDF8,#0EA5E9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px"}}>⚡</div><div style={{background:T.chatBotBubble,border:`1px solid ${T.chatBotBorder}`,borderRadius:"12px 12px 12px 3px",padding:"8px 13px",fontSize:"13px",color:T.textDim}}>●●●</div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"9px 10px",borderTop:`1px solid ${T.border}`,display:"flex",gap:"7px",background:T.chatBg}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask about this bill..." disabled={loading} style={{flex:1,background:T.chatInputBg,border:`1px solid ${T.chatInputBorder}`,borderRadius:"7px",padding:"8px 12px",color:T.text,fontSize:"13px",fontFamily:"inherit",outline:"none"}}/>
        <button onClick={()=>send()} disabled={!input.trim()||loading} style={{background:input.trim()&&!loading?"linear-gradient(135deg,#38BDF8,#0EA5E9)":"rgba(56,189,248,0.1)",border:"none",borderRadius:"7px",padding:"8px 14px",cursor:input.trim()&&!loading?"pointer":"not-allowed",color:input.trim()&&!loading?"#050c14":"#38BDF8",fontSize:"14px",flexShrink:0}}>↑</button>
      </div>
    </div>
  );
};

// ─── COMPARE VIEW ─────────────────────────────────────────────────────────────
const CompareView = ({bills, compareIds, onClose, T, isMobile=false, onExport}) => {
  const [a, b] = [...compareIds].map(id => bills.find(x=>x.id===id)).filter(Boolean);
  if (!a || !b) return null;

  // Sort by billing period start date, not upload time
  // Extracts first date found in billingPeriod string for comparison
  const extractBillDate = (bill) => {
    const p = bill.result.billingPeriod || "";
    const m = p.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/) || p.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s*(\d{4})/i);
    if(m) return new Date(p.slice(0, 20));
    return new Date(bill.analyzedAt);
  };
  const [left, right] = extractBillDate(a) <= extractBillDate(b) ? [a,b] : [b,a];
  const rl = left.result, rr = right.result;

  const delta = (vA, vB, prefix="$", invert=false) => {
    const diff = vB - vA;
    const pct = vA !== 0 ? ((diff / vA) * 100).toFixed(1) : 0;
    const better = invert ? diff < 0 : diff > 0;
    const color = diff === 0 ? "#6B7A9A" : better ? "#34C759" : "#FF3B30";
    const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
    return { diff, pct, color, label: diff === 0 ? "—" : `${sign}${prefix}${Math.abs(diff)<0.01&&prefix==="$"?Math.abs(diff).toFixed(3):Math.abs(diff).toFixed(prefix==="$"?2:0)} (${pct}%)` };
  };

  const charged_l = parseNum(rl.totalCharged), charged_r = parseNum(rr.totalCharged);
  const kwh_l = parseNum(rl.totalUsage||rl.totalKwh), kwh_r = parseNum(rr.totalUsage||rr.totalKwh);
  const rate_l = parseNum(rl.ratePerUnit||rl.ratePerKwh), rate_r = parseNum(rr.ratePerUnit||rr.ratePerKwh);
  // Cap savings potential at bill total — AI sometimes hallucinates savings > bill amount
  const sav_l = Math.min(parseNum(rl.totalPotentialMonthlySavings?.split("–")[0]), parseNum(rl.totalCharged));
  const sav_r = Math.min(parseNum(rr.totalPotentialMonthlySavings?.split("–")[0]), parseNum(rr.totalCharged));

  const metrics = [
    { label:"Total Charged", vl:`$${charged_l.toFixed(2)}`, vr:`$${charged_r.toFixed(2)}`, d:delta(charged_l,charged_r,"$",true), cl:SC[rl.billStatus], cr:SC[rr.billStatus] },
    { label:"Usage", vl:rl.totalUsage||`${kwh_l} kWh`, vr:rr.totalUsage||`${kwh_r} kWh`, d:delta(kwh_l,kwh_r,"",true) },
    { label:"Rate/Unit", vl:(rl.ratePerUnit||`$${rate_l.toFixed(3)}`).replace(/\s*\(.*\)/,"").trim(), vr:(rr.ratePerUnit||`$${rate_r.toFixed(3)}`).replace(/\s*\(.*\)/,"").trim(), d:delta(rate_l,rate_r,"$",true) },
    { label:"Savings Potential", vl:`$${sav_l}/mo`, vr:`$${sav_r}/mo`, d:delta(sav_l,sav_r,"$",false) },
  ];

  // Bar chart data
  const barData = [
    { metric:"Cost ($)", left:charged_l, right:charged_r },
    { metric:"Usage (÷10)", left:+(kwh_l/10).toFixed(1), right:+(kwh_r/10).toFixed(1) },
    { metric:"Rate (cents)", left:+(rate_l*100).toFixed(1), right:+(rate_r*100).toFixed(1) },
    { metric:"Savings Pot ($)", left:sav_l, right:sav_r },
  ];

  // Rec diff
  const cats = ["negotiation","ratePlans","providers","equipment","behavioral","incentives"];
  const recsL = cats.flatMap(cat=>(rl.recommendations[cat]||[]).map(r=>({...r,cat})));
  const recsR = cats.flatMap(cat=>(rr.recommendations[cat]||[]).map(r=>({...r,cat})));
  const titlesL = new Set(recsL.map(r=>r.title));
  const titlesR = new Set(recsR.map(r=>r.title));
  const shared  = recsL.filter(r=>titlesR.has(r.title));
  const onlyL   = recsL.filter(r=>!titlesR.has(r.title));
  const onlyR   = recsR.filter(r=>!titlesL.has(r.title));

  const CARD = {background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"18px"};
  const periodL = shortPeriod(rl.billingPeriod), periodR = shortPeriod(rr.billingPeriod);

  const DeltaTag = ({d}) => (
    <span style={{fontFamily:"monospace",fontSize:"11px",fontWeight:"700",color:d.color,
      background:d.color+"18",border:`1px solid ${d.color}33`,padding:"2px 8px",borderRadius:"4px",whiteSpace:"nowrap"}}>
      {d.label}
    </span>
  );

  const SmallRec = ({r,side}) => (
    <div style={{padding:"8px 10px",marginBottom:"5px",borderRadius:"7px",
      background:side==="left"?"rgba(56,189,248,0.06)":side==="right"?"rgba(52,199,89,0.06)":"rgba(255,255,255,0.03)",
      border:`1px solid ${side==="left"?"rgba(56,189,248,0.15)":side==="right"?"rgba(52,199,89,0.15)":"rgba(255,255,255,0.07)"}`}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:"8px",alignItems:"center"}}>
        <span style={{fontSize:"11px",fontWeight:"600",color:side==="left"?"#38BDF8":side==="right"?"#34C759":T.textSub}}>{r.title}</span>
        <span style={{fontSize:"10px",color:"#34C759",fontFamily:"monospace",flexShrink:0}}>{r.estimatedSavings}</span>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"22px",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"26px",marginBottom:"4px"}}>Bill Comparison</div>
          <div style={{fontSize:"12px",color:T.textDim,display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{color:"#38BDF8",fontFamily:"monospace",fontWeight:"600"}}>{periodL}</span>
            <span style={{color:T.textFaint}}>vs</span>
            <span style={{color:"#34C759",fontFamily:"monospace",fontWeight:"600"}}>{periodR}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          {onExport&&<button onClick={()=>onExport(left,right)} style={{background:"linear-gradient(135deg,#38BDF8,#0EA5E9)",border:"none",color:"#040d18",padding:"7px 14px",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",boxShadow:"0 2px 8px rgba(56,189,248,.2)"}}>↓ PDF Report</button>}
          <button onClick={onClose} style={{background:T.bgCard,border:`1px solid ${T.border}`,color:T.textDim,padding:"7px 14px",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontFamily:"monospace"}}>← Back to History</button>
        </div>
      </div>

      {/* Side-by-side column headers */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 44px 1fr",gap:isMobile?"10px":"0",marginBottom:"12px",alignItems:"center"}}>
        <div style={{background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:"9px",padding:"12px 16px"}}>
          <div style={{fontFamily:"monospace",fontSize:"10px",color:"#38BDF8",letterSpacing:"0.1em",marginBottom:"3px"}}>BILL A · EARLIER</div>
          <div style={{fontSize:"13px",fontWeight:"600",color:T.text}}>{rl.provider}</div>
          <div style={{fontSize:"11px",color:T.textDim,marginTop:"2px"}}>{rl.billingPeriod}</div>
          <div style={{marginTop:"8px",display:"flex",gap:"8px",alignItems:"center"}}>
            <StatusBadge status={rl.billStatus} small/>
          </div>
        </div>
        {!isMobile&&<div style={{textAlign:"center",fontFamily:"monospace",fontSize:"13px",color:T.textDim,fontWeight:"700"}}>vs</div>}
        <div style={{background:"rgba(52,199,89,0.07)",border:"1px solid rgba(52,199,89,0.2)",borderRadius:"9px",padding:"12px 16px"}}>
          <div style={{fontFamily:"monospace",fontSize:"10px",color:"#34C759",letterSpacing:"0.1em",marginBottom:"3px"}}>BILL B · LATER</div>
          <div style={{fontSize:"13px",fontWeight:"600",color:T.text}}>{rr.provider}</div>
          <div style={{fontSize:"11px",color:T.textDim,marginTop:"2px"}}>{rr.billingPeriod}</div>
          <div style={{marginTop:"8px",display:"flex",gap:"8px",alignItems:"center"}}>
            <StatusBadge status={rr.billStatus} small/>
          </div>
        </div>
      </div>

      {/* Metric rows */}
      <div style={{...CARD,marginBottom:"14px",padding:"0",overflow:"hidden"}}>
        {metrics.map((m,i)=>(
          <div key={m.label} style={{display:"flex",alignItems:"center",
            padding:"13px 16px",borderBottom:i<metrics.length-1?`1px solid ${T.border}`:"none",
            background:i%2===0?"transparent":T.bgCard2,gap:"8px"}}>
            <div style={{fontFamily:"monospace",fontSize:"14px",fontWeight:"700",color:m.cl||T.text,flex:"1",display:"flex",alignItems:"center"}}>{m.vl}</div>
            <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,minWidth:"130px"}}>
              <div style={{fontSize:"9px",color:T.textDim,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.08em"}}>{m.label}</div>
              <DeltaTag d={m.d}/>
            </div>
            <div style={{fontFamily:"monospace",fontSize:"14px",fontWeight:"700",color:m.cr||T.text,textAlign:"right",flex:"1",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>{m.vr}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{...CARD,marginBottom:"14px"}}>
        <div style={{fontSize:"9px",color:T.textDim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:"14px",fontFamily:"monospace"}}>
          Key Metrics — Bill A <span style={{color:"#38BDF8"}}>■</span> vs Bill B <span style={{color:"#34C759"}}>■</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} margin={{top:5,right:8,left:-10,bottom:5}} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid}/>
            <XAxis dataKey="metric" tick={{fontSize:9,fill:T.chartTick}}/>
            <YAxis tick={{fontSize:9,fill:T.chartTick}}/>
            <Tooltip content={({active,payload,label})=>{
              if(!active||!payload?.length) return null;
              return <div style={{background:T.chartTip,border:`1px solid ${T.chartTipBorder}`,borderRadius:"7px",padding:"9px 13px",fontFamily:"monospace",fontSize:"11px",color:T.text}}>
                <div style={{color:T.textDim,fontSize:"10px",marginBottom:"4px"}}>{label}</div>
                <div style={{color:"#38BDF8"}}>Bill A: <strong>{payload[0]?.value}</strong></div>
                <div style={{color:"#34C759"}}>Bill B: <strong>{payload[1]?.value}</strong></div>
              </div>;
            }}/>
            <Bar dataKey="left" fill="#38BDF8" opacity={0.8} radius={[3,3,0,0]} name="Bill A"/>
            <Bar dataKey="right" fill="#34C759" opacity={0.8} radius={[3,3,0,0]} name="Bill B"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations diff */}
      <div style={{...CARD}}>
        <SecHeader icon="💡" title="Recommendations Diff" T={T}/>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"14px"}}>
          <div>
            <div style={{fontSize:"10px",color:"#38BDF8",fontFamily:"monospace",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"10px"}}>ONLY IN BILL A ({onlyL.length})</div>
            {onlyL.length>0 ? onlyL.map((r,i)=><SmallRec key={i} r={r} side="left"/>) : <div style={{fontSize:"11px",color:T.textDim,padding:"8px 0"}}>All recs also appear in Bill B</div>}
          </div>
          <div>
            <div style={{fontSize:"10px",color:"#34C759",fontFamily:"monospace",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"10px"}}>ONLY IN BILL B ({onlyR.length})</div>
            {onlyR.length>0 ? onlyR.map((r,i)=><SmallRec key={i} r={r} side="right"/>) : <div style={{fontSize:"11px",color:T.textDim,padding:"8px 0"}}>All recs also appear in Bill A</div>}
          </div>
        </div>
        {shared.length>0&&(
          <div style={{marginTop:"14px",borderTop:`1px solid ${T.border}`,paddingTop:"14px"}}>
            <div style={{fontSize:"10px",color:T.textDim,fontFamily:"monospace",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"10px"}}>IN BOTH BILLS — PERSISTENT ISSUES ({shared.length})</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"6px"}}>
              {shared.map((r,i)=><SmallRec key={i} r={r} side="shared"/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [darkMode, setDarkMode] = useState(true);
  const T = darkMode ? DARK : LIGHT;
  const [view, setView] = useState("analyze"); // analyze | history | tracker | detail | compare
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [completedActions, setCompletedActions] = useState(new Set());
  const [file, setFile] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [accountType, setAccountType] = useState("RESIDENTIAL");
  const [householdSize, setHouseholdSize] = useState("2");
  const [facilitySize, setFacilitySize] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkProgress, setBulkProgress] = useState([]); // {name, status, result}
  const [bulkRunning, setBulkRunning] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("negotiation");
  const [isDragging, setIsDragging] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [compareIds, setCompareIds] = useState(new Set());
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteIds, setDeleteIds] = useState(new Set());
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);
  const fileInputRef = useRef();
  const bulkInputRef = useRef();
  const CARD = {background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"18px"};

  // Load from storage
  useEffect(()=>{
    (async()=>{
      try{const r=await Promise.resolve({value: localStorage.getItem("ea-bills")});if(r?.value)setBills(JSON.parse(r.value));}catch(_){}
      try{const r=await Promise.resolve({value: localStorage.getItem("ea-dark")});if(r?.value!==undefined)setDarkMode(JSON.parse(r.value));}catch(_){}
      try{const r=await Promise.resolve({value: localStorage.getItem("ea-completed")});if(r?.value)setCompletedActions(new Set(JSON.parse(r.value)));}catch(_){}
      setStorageReady(true);
    })();
  },[]);

  useEffect(()=>{ if(!storageReady)return; (async()=>{try{localStorage.setItem("ea-bills",JSON.stringify(bills));}catch(_){}})(); },[bills,storageReady]);
  useEffect(()=>{ if(!storageReady)return; (async()=>{try{localStorage.setItem("ea-dark",JSON.stringify(darkMode));}catch(_){}})(); },[darkMode,storageReady]);
  useEffect(()=>{ if(!storageReady)return; (async()=>{try{localStorage.setItem("ea-completed",JSON.stringify([...completedActions]));}catch(_){}})(); },[completedActions,storageReady]);

  // Analyze a single File object — returns parsed result or throws
  const analyzeSingleFile = async (file) => {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });
    const isImg = dataUrl.startsWith("data:image");
    const b64 = dataUrl.split(",")[1];
    const mt = dataUrl.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const blocks = isImg
      ? [{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:"Analyze this energy bill and return the JSON report."}]
      : [{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"Analyze this energy bill PDF and return the JSON report."}];
    const res = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:8000,system:buildSystemPrompt({accountType,householdSize,facilitySize}),messages:[{role:"user",content:blocks}]})
    });
    if(!res.ok) throw new Error(`API error ${res.status} — please try again`);
    const data = await res.json();
    if(data.error) throw new Error(data.error.message);
    const text = data.content?.find(b=>b.type==="text")?.text||"";
    if(!text) throw new Error("Empty response");
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  };

  // Bulk analyze up to 12 files sequentially
  const bulkAnalyze = async () => {
    if(!bulkFiles.length || bulkRunning) return;
    setBulkRunning(true);
    const progress = bulkFiles.map(f=>({name:f.name,status:"queued",result:null,error:null}));
    setBulkProgress([...progress]);
    const newBills = [];
    for(let i=0; i<bulkFiles.length; i++) {
      progress[i] = {...progress[i], status:"analyzing"};
      setBulkProgress([...progress]);
      try {
        const parsed = await analyzeSingleFile(bulkFiles[i]);
        const nb = {id:`bill-${Date.now()}-${i}`, analyzedAt:new Date().toISOString(), result:parsed, context:{accountType,householdSize,facilitySize}};
        newBills.push(nb);
        progress[i] = {...progress[i], status:"done", result:parsed};
      } catch(e) {
        progress[i] = {...progress[i], status:"error", error:e.message||"Failed"};
      }
      setBulkProgress([...progress]);
      // Small delay between calls to avoid rate limits
      if(i < bulkFiles.length-1) await new Promise(r=>setTimeout(r,800));
    }
    setBills(p=>[...p,...newBills]);
    setBulkRunning(false);
    // Navigate to history when done
    if(newBills.length>0) {
      setTimeout(()=>{ setBulkMode(false); setBulkFiles([]); setBulkProgress([]); setView("history"); }, 1800);
    }
  };

  const handleFile = useCallback((f)=>{
    if(!f) return; setFile(f); setError(null);
    const r=new FileReader(); r.onload=e=>setImageDataUrl(e.target.result); r.readAsDataURL(f);
  },[]);

  const analyze = async()=>{
    if(!imageDataUrl) return; setAnalyzing(true); setError(null);
    try {
      const parsed = await analyzeSingleFile(file);
      const nb={id:`bill-${Date.now()}`,analyzedAt:new Date().toISOString(),result:parsed,context:{accountType,householdSize,facilitySize}};
      setBills(p=>[...p,nb]); setSelectedBill(nb); setActiveTab("negotiation");
      setShowChat(false); setView("detail"); setFile(null); setImageDataUrl(null);
    } catch(e) { setError("Analysis failed — "+(e.message||"Please try again.")); }
    finally { setAnalyzing(false); }
  };

  const toggleAction = (aid, rec) => {
    setCompletedActions(prev=>{
      const next=new Set(prev);
      if(next.has(aid)) { next.delete(aid); return next; }
      next.add(aid);
      // Flash celebration on first completion
      setCelebrate(true);
      setTimeout(()=>setCelebrate(false),2000);
      return next;
    });
  };

  const openReport = (html, filename) => {
    const printHtml = html.replace("</head>",`<style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{box-shadow:none!important}.ftr{page-break-inside:avoid}.sec{page-break-inside:avoid}}@page{margin:0;size:A4}</style></head>`);
    const blob = new Blob([printHtml], {type:"text/html"});
    const url = URL.createObjectURL(blob);
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints>1 && window.innerWidth<768);
    if(isMobileDevice) {
      // On mobile — open in new tab so user can read/share/print from browser
      const win = window.open(url, "_blank");
      if(!win) {
        // Pop-up blocked — fall back to download
        const a = document.createElement("a"); a.href=url; a.download=filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      setTimeout(()=>URL.revokeObjectURL(url), 5000);
    } else {
      // On desktop — download file, user opens and prints
      const a = document.createElement("a"); a.href=url; a.download=filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    }
  };

  const dlCompareReport = (left, right) => {
    const html = buildCompareReport(left, right, completedActions);
    openReport(html, "comparison-" + left.result.provider.replace(/[^a-z0-9]/gi,"-").toLowerCase() + ".html");
    setPdfToast(true);
    setTimeout(()=>setPdfToast(false), 7000);
  };

  const loadDemo = ()=>{ setBills(DEMO_BILLS); setView("history"); };
  const deleteBill = (id)=>setBills(p=>p.filter(b=>b.id!==id));
  const deleteSelected = ()=>{ if(!window.confirm(`Delete ${deleteIds.size} selected bill${deleteIds.size>1?'s':''}? This cannot be undone.`)) return; setBills(p=>p.filter(b=>!deleteIds.has(b.id))); setDeleteIds(new Set()); setDeleteMode(false); };
  const deleteAll = ()=>{ if(window.confirm("Delete all bills? This cannot be undone.")){setBills([]); setDeleteIds(new Set()); setDeleteMode(false); setCompareIds(new Set());} };
  const toggleDeleteMode = ()=>{ setDeleteMode(m=>!m); setDeleteIds(new Set()); };
  const openBill = (bill)=>{ setSelectedBill(bill); setActiveTab("negotiation"); setShowChat(false); setView("detail"); };
  // HTML fallback (used if PDF fails)
  const dl = (r)=>{ const html=buildReport(r,completedActions); const blob=new Blob([html],{type:"text/html"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`energy-audit-${Date.now()}.html`; a.click(); URL.revokeObjectURL(url); };

  const dlPDF = (reportData) => {
    setPdfGenerating(true);
    const html = buildReport(reportData, completedActions);
    openReport(html, "energy-audit-" + reportData.provider.replace(/[^a-z0-9]/gi,"-").toLowerCase() + ".html");
    setPdfGenerating(false);
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 7000);
  };

  const chartData=[...bills].sort((a,b)=>new Date(a.analyzedAt)-new Date(b.analyzedAt)).map(b=>({
    name:shortPeriod(b.result.billingPeriod),
    Cost:parseNum(b.result.totalCharged),
    kWh:parseNum(b.result.totalUsage||b.result.totalKwh),
    Rate:parseNum(b.result.ratePerUnit||b.result.ratePerKwh),
    status:b.result.billStatus,
  }));

  const TABS=[
    {key:"negotiation",label:"Negotiate",icon:"💬"},
    {key:"ratePlans",label:"Rate Plans",icon:"📊"},
    {key:"providers",label:"Providers",icon:"🔄"},
    {key:"equipment",label:"Equipment",icon:"⚙️"},
    {key:"behavioral",label:"Habits",icon:"🧠"},
    {key:"incentives",label:"Rebates",icon:"💰"},
  ];
  const r = selectedBill?.result;

  // Savings banner for detail view
  const billRecs = selectedBill ? allRecs(selectedBill) : [];
  const billCompleted = billRecs.filter(rec=>completedActions.has(actionId(rec.billId,rec.cat,rec.title)));
  const billSaved = Math.min(billCompleted.reduce((s,rec)=>s+parseMonthlySavings(rec.estimatedSavings),0), parseNum(selectedBill?.result?.totalCharged));


  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',system-ui,sans-serif",color:T.text,transition:"background .3s,color .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{transition:background-color .2s,border-color .2s,color .15s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${T.scrollTrack}}::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:3px}
        .nb{background:none;border:none;cursor:pointer;padding:8px 16px;border-radius:8px;font-family:'DM Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.05em;transition:all .15s;color:${T.navBtn}}
        .nb:hover{color:${T.isDark?"#aaa":"#374151"};background:${T.isDark?"rgba(255,255,255,.04)":"rgba(0,0,0,0.04)"}}
        .na{color:#38BDF8!important;background:rgba(56,189,248,.1)!important}
        .tb{background:none;border:none;cursor:pointer;padding:7px 12px;border-radius:6px;font-family:'DM Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.05em;transition:all .15s;color:${T.navBtn}}
        .tb:hover{background:rgba(56,189,248,.07);color:${T.isDark?"#aaa":"#374151"}}
        .ta{background:${T.tabActive}!important;color:#38BDF8!important}
        .pulse{animation:p 1.8s infinite}@keyframes p{0%,100%{opacity:1}50%{opacity:.35}}
        .br{background:${T.billRowBg};border:1px solid ${T.billRowBorder};border-radius:8px;padding:12px 15px;margin-bottom:7px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .15s}
        .br:hover{background:rgba(56,189,248,.04);border-color:rgba(56,189,248,.2);transform:translateY(-1px)}
        .uz{transition:all .2s;cursor:pointer}
        .uz:hover{border-color:rgba(56,189,248,.55)!important;background:rgba(56,189,248,.04)!important}
        .db{background:none;border:1px solid rgba(255,59,48,.2);color:#FF6B6B;padding:3px 8px;border-radius:4px;font-size:10px;cursor:pointer;font-family:monospace;transition:all .15s;flex-shrink:0}
        .db:hover{background:rgba(255,59,48,.12);border-color:rgba(255,59,48,.4)}
        input:focus{outline:none;border-color:#38BDF8!important;box-shadow:0 0 0 2px rgba(56,189,248,.12)!important}
        .celebrate{animation:ce .4s ease}@keyframes ce{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:${T.chartGrid}}
        button:not(.tb):not(.nb):not(.db) {transition:all .18s}
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{borderBottom:`1px solid ${T.topbarBorder}`,padding:isMobile?"10px 14px":"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:T.topbar,zIndex:100,backdropFilter:"blur(10px)",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <img src="/logo.svg" alt="EnergyAudit AI" style={{width:"44px",height:"44px",borderRadius:"10px",boxShadow:"0 0 12px rgba(56,189,248,.5), 0 0 24px rgba(56,189,248,.2), 0 2px 8px rgba(0,0,0,.4)",flexShrink:0,border:"1px solid rgba(56,189,248,.3)"}}/>
          <div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"13px",fontWeight:"600",letterSpacing:"0.02em"}}>EnergyAudit<span style={{color:"#38BDF8"}}>AI</span></div>
            <div style={{fontSize:"8px",color:T.textDim,letterSpacing:"0.16em",textTransform:"uppercase"}}>Bill Intelligence</div>
          </div>
        </div>

        <nav style={{display:"flex",gap:"2px"}}>
          <button className={`nb ${view==="analyze"?"na":""}`} onClick={()=>setView("analyze")}>⚡ Analyze</button>
          <button className={`nb ${view==="history"||view==="detail"?"na":""}`} onClick={()=>setView("history")} style={{position:"relative"}}>
            📊 History
            {bills.length>0&&<span style={{position:"absolute",top:"4px",right:"4px",background:"#38BDF8",color:"#030714",borderRadius:"50%",width:"14px",height:"14px",fontSize:"8px",fontWeight:"700",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{bills.length}</span>}
          </button>
          {compareIds.size===2&&(
            <button className={`nb ${view==="compare"?"na":""}`} onClick={()=>setView("compare")} style={{position:"relative",color:"#FF9500",borderColor:"rgba(255,149,0,0.3)"}}>
              ⚖ Compare
              <span style={{position:"absolute",top:"4px",right:"4px",background:"#FF9500",color:"#030714",borderRadius:"50%",width:"14px",height:"14px",fontSize:"8px",fontWeight:"700",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>2</span>
            </button>
          )}

        </nav>

        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>

          <button onClick={()=>setDarkMode(d=>!d)} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"18px",padding:"5px 11px",cursor:"pointer",fontSize:"12px",display:"flex",alignItems:"center",gap:"5px",color:T.textSub}}>
            {darkMode?"☀ Light":"🌙 Dark"}
          </button>
          {!isMobile&&<button onClick={loadDemo} style={{background:T.bgCard,border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 11px",borderRadius:"6px",cursor:"pointer",fontSize:"10px",fontFamily:"monospace",letterSpacing:"0.04em"}}>
            Demo
          </button>}
        </div>
      </div>

      {/* ── CELEBRATION TOAST ── */}
      {celebrate&&(
        <div style={{position:"fixed",top:"72px",left:"50%",transform:"translateX(-50%)",background:"#34C759",color:"#fff",padding:"10px 20px",borderRadius:"20px",fontSize:"13px",fontWeight:"700",zIndex:999,boxShadow:"0 4px 20px rgba(52,199,89,0.4)",animation:"ce .4s ease",fontFamily:"'DM Mono',monospace",letterSpacing:"0.05em"}}>
          ✓ Action complete! Savings unlocked →
        </div>
      )}

      {/* PDF instruction toast */}
      {pdfToast&&(
        <div style={{position:"fixed",top:"72px",left:"50%",transform:"translateX(-50%)",background:T.isDark?"#1a1a2e":"#1A1A2E",color:"#E8EAF0",padding:"12px 20px",borderRadius:"12px",fontSize:"12px",zIndex:999,boxShadow:"0 4px 24px rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.5",maxWidth:"340px",textAlign:"center",border:"1px solid rgba(56,189,248,0.3)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#38BDF8",marginBottom:"5px",fontWeight:"700",letterSpacing:"0.08em"}}>📄 REPORT READY</div>
          {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
            ? <div>Report opened in a new tab. Tap the <strong>Share</strong> icon → <strong style={{color:"#38BDF8"}}>Print</strong> → Save as PDF</div>
            : <div>Open the <strong>.html file</strong> in your browser, then press <strong style={{color:"#38BDF8"}}>⌘P</strong> (Mac) or <strong style={{color:"#38BDF8"}}>Ctrl+P</strong> (Windows) → <strong>Save as PDF</strong></div>
          }
          <div style={{fontSize:"10px",color:"#6B7A9A",marginTop:"5px"}}>Tap Share → Print for best quality</div>
        </div>
      )}

      <div style={{maxWidth:"1080px",margin:"0 auto",padding:isMobile?"16px 12px":"28px 20px"}}>

        {/* ══ ANALYZE ══ */}
        {view==="analyze"&&(
          <div style={{maxWidth:"560px",margin:"0 auto",width:"100%"}}>

            <div style={{textAlign:"center",marginBottom:"28px"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:isMobile?"26px":"36px",lineHeight:"1.15",marginBottom:"12px"}}>
                Is your energy bill<br/><span style={{color:"#38BDF8",fontStyle:"italic"}}>actually correct?</span>
              </div>
              <div style={{fontSize:"14px",color:T.textSub,lineHeight:"1.7",maxWidth:"420px",margin:"0 auto"}}>Upload a bill — or an entire year at once. AI verifies every charge, benchmarks costs regionally, and surfaces every dollar you can save.</div>
              <div style={{display:"flex",gap:"14px",justifyContent:"center",marginTop:"14px",flexWrap:"wrap"}}>
                {bills.length>0&&<span style={{display:"inline-flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"11px",color:"#38BDF8",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setView("history")}>📊 {bills.length} bill{bills.length>1?"s":""} in history →</span><span onClick={deleteAll} style={{fontSize:"10px",color:"#FF6B6B",cursor:"pointer",background:"rgba(255,59,48,0.1)",border:"1px solid rgba(255,59,48,0.25)",padding:"2px 8px",borderRadius:"4px",fontFamily:"monospace",fontWeight:"700",whiteSpace:"nowrap"}}>🗑 Clear All</span></span>}
              </div>
            </div>

            {/* ── Context Panel ── */}
            <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"12px",padding:"16px",marginBottom:"16px"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#38BDF8",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px",fontWeight:"700"}}>Account Context</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px"}}>
                <div>
                  <div style={{fontSize:"10px",color:T.textDim,marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Account Type</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
                    {[{v:"RESIDENTIAL",l:"🏠 Residential"},{v:"SMALL_BUSINESS",l:"🏪 Small Business"},{v:"COMMERCIAL",l:"🏢 Commercial"},{v:"INDUSTRIAL",l:"🏭 Industrial"}].map(opt=>(
                      <button key={opt.v} onClick={()=>{setAccountType(opt.v);if(opt.v==="RESIDENTIAL")setFacilitySize("");else setHouseholdSize("2");}} style={{padding:"7px 6px",borderRadius:"7px",border:`1px solid ${accountType===opt.v?"#38BDF8":T.border}`,background:accountType===opt.v?"rgba(56,189,248,0.12)":T.bgCard2,color:accountType===opt.v?"#38BDF8":T.textSub,cursor:"pointer",fontSize:"10px",fontWeight:accountType===opt.v?"700":"400",transition:"all .15s",textAlign:"center"}}>{opt.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  {accountType==="RESIDENTIAL"?(
                    <>
                      <div style={{fontSize:"10px",color:T.textDim,marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Household Size</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"5px"}}>
                        {["1","2","3","4","5+"].map(n=>(
                          <button key={n} onClick={()=>setHouseholdSize(n==="5+"?"5":n)} style={{padding:"8px 4px",borderRadius:"7px",border:`1px solid ${householdSize===(n==="5+"?"5":n)?"#38BDF8":T.border}`,background:householdSize===(n==="5+"?"5":n)?"rgba(56,189,248,0.12)":T.bgCard2,color:householdSize===(n==="5+"?"5":n)?"#38BDF8":T.textSub,cursor:"pointer",fontSize:"12px",fontWeight:"700",transition:"all .15s"}}>{n}</button>
                        ))}
                      </div>
                      <div style={{fontSize:"9px",color:T.textDim,marginTop:"5px"}}>People in household — calibrates benchmarks</div>
                    </>
                  ):(
                    <>
                      <div style={{fontSize:"10px",color:T.textDim,marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Monthly Bill Range</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
                        {[{v:"under $500",l:"Under $500"},{v:"$500–$2,000",l:"$500–$2K"},{v:"$2,000–$10,000",l:"$2K–$10K"},{v:"$10,000+",l:"$10K+"}].map(opt=>(
                          <button key={opt.v} onClick={()=>setFacilitySize(opt.v)} style={{padding:"7px 6px",borderRadius:"7px",border:`1px solid ${facilitySize===opt.v?"#38BDF8":T.border}`,background:facilitySize===opt.v?"rgba(56,189,248,0.12)":T.bgCard2,color:facilitySize===opt.v?"#38BDF8":T.textSub,cursor:"pointer",fontSize:"10px",fontWeight:facilitySize===opt.v?"700":"400",transition:"all .15s",textAlign:"center"}}>{opt.l}</button>
                        ))}
                      </div>
                      <div style={{fontSize:"9px",color:T.textDim,marginTop:"5px"}}>Calibrates commercial benchmarks</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Mode toggle */}
            <div style={{display:"flex",gap:"8px",marginBottom:"16px",background:T.bgCard2,padding:"4px",borderRadius:"10px",border:`1px solid ${T.border}`}}>
              <button onClick={()=>{setBulkMode(false);setBulkFiles([]);setBulkProgress([]);}} style={{flex:1,padding:"9px",borderRadius:"7px",border:"none",background:!bulkMode?"linear-gradient(135deg,#38BDF8,#0EA5E9)":T.bgCard,color:!bulkMode?"#040d18":T.textSub,cursor:"pointer",fontSize:"12px",fontWeight:"700",fontFamily:"monospace",transition:"all .2s"}}>
                ⚡ Single Bill
              </button>
              <button onClick={()=>{setBulkMode(true);setFile(null);setImageDataUrl(null);}} style={{flex:1,padding:"9px",borderRadius:"7px",border:"none",background:bulkMode?"linear-gradient(135deg,#38BDF8,#0EA5E9)":T.bgCard,color:bulkMode?"#040d18":T.textSub,cursor:"pointer",fontSize:"12px",fontWeight:"700",fontFamily:"monospace",transition:"all .2s"}}>
                📂 Bulk Upload (up to 12)
              </button>
            </div>

            {!bulkMode?(
              <>
                {/* Single bill upload */}
                <div className="uz" onDrop={e=>{e.preventDefault();setIsDragging(false);handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setIsDragging(true);}} onDragLeave={()=>setIsDragging(false)} onClick={()=>fileInputRef.current?.click()} style={{border:`2px dashed ${isDragging?"rgba(56,189,248,.65)":T.uploadBorder}`,borderRadius:"14px",padding:"44px 28px",textAlign:"center",background:isDragging?"rgba(56,189,248,.05)":T.uploadBg,marginBottom:"14px"}}>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
                  {file?(
                    <div><div style={{fontSize:"36px",marginBottom:"8px"}}>📄</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#38BDF8",marginBottom:"3px"}}>{file.name}</div><div style={{fontSize:"11px",color:T.textDim}}>{(file.size/1024).toFixed(0)} KB · click to change</div></div>
                  ):(
                    <div><div style={{fontSize:"36px",marginBottom:"12px",opacity:0.15}}>⚡</div><div style={{fontSize:"14px",fontWeight:"600",marginBottom:"5px"}}>Drop your utility bill here</div><div style={{fontSize:"12px",color:T.textDim}}>Electric, gas, or water bill · PDF, PNG, JPG</div></div>
                  )}
                </div>
                {imageDataUrl?.startsWith("data:image")&&(
                  <div style={{marginBottom:"12px",borderRadius:"9px",overflow:"hidden",border:`1px solid ${T.border}`,maxHeight:"140px",display:"flex",justifyContent:"center",background:T.bgCard2}}>
                    <img src={imageDataUrl} alt="preview" style={{maxHeight:"140px",objectFit:"contain"}}/>
                  </div>
                )}
                {error&&<div style={{background:T.errorBg,border:`1px solid ${T.errorBorder}`,borderRadius:"7px",padding:"10px 13px",color:"#FF6B6B",fontSize:"12px",marginBottom:"12px"}}>{error}</div>}
                <button onClick={analyze} disabled={!file||analyzing} style={{width:"100%",padding:"14px",borderRadius:"9px",background:file&&!analyzing?"linear-gradient(135deg,#38BDF8,#0EA5E9)":T.bgCard2,border:`1px solid ${file&&!analyzing?"transparent":T.border}`,color:file&&!analyzing?"#040d18":T.textDim,fontSize:"14px",fontWeight:"700",cursor:file&&!analyzing?"pointer":"not-allowed",fontFamily:"'DM Mono',monospace",letterSpacing:".05em",boxShadow:file&&!analyzing?"0 4px 16px rgba(56,189,248,.25)":"none"}}>
                  {analyzing?<span className="pulse">⚡ Analyzing your bill...</span>:"⚡ Analyze My Bill"}
                </button>
                <div style={{textAlign:"center",marginTop:"9px",fontSize:"10px",color:T.textFaint}}>Processed by AI · Never stored externally · ~15 seconds</div>
              </>
            ):(
              <>
                {/* Bulk upload */}
                {bulkProgress.length===0?(
                  <>
                    <div className="uz" onClick={()=>bulkInputRef.current?.click()}
                      onDrop={e=>{e.preventDefault();const files=[...e.dataTransfer.files].slice(0,12);setBulkFiles(files);}}
                      onDragOver={e=>e.preventDefault()}
                      style={{border:`2px dashed ${T.uploadBorder}`,borderRadius:"14px",padding:"36px 28px",textAlign:"center",background:T.uploadBg,marginBottom:"14px",cursor:"pointer"}}>
                      <input ref={bulkInputRef} type="file" accept="image/*,.pdf" multiple style={{display:"none"}} onChange={e=>{const files=[...e.target.files].slice(0,12);setBulkFiles(files);}}/>
                      {bulkFiles.length>0?(
                        <div>
                          <div style={{fontSize:"28px",marginBottom:"10px"}}>📂</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#38BDF8",marginBottom:"8px"}}>{bulkFiles.length} file{bulkFiles.length>1?"s":""} selected</div>
                          <div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"160px",overflowY:"auto"}}>
                            {bulkFiles.map((f,i)=>(
                              <div key={i} style={{fontSize:"11px",color:T.textDim,fontFamily:"monospace",background:T.bgCard2,padding:"4px 8px",borderRadius:"4px",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                📄 {f.name}
                              </div>
                            ))}
                          </div>
                          <div style={{fontSize:"10px",color:T.textDim,marginTop:"8px"}}>Click to change selection</div>
                        </div>
                      ):(
                        <div>
                          <div style={{fontSize:"36px",marginBottom:"12px",opacity:0.15}}>📂</div>
                          <div style={{fontSize:"14px",fontWeight:"600",marginBottom:"5px"}}>Drop up to 12 bills here</div>
                          <div style={{fontSize:"12px",color:T.textDim,marginBottom:"4px"}}>Select multiple files at once — one per month</div>
                          <div style={{fontSize:"11px",color:T.textDim}}>PDF, PNG, JPG · Electric, gas, or water bills</div>
                        </div>
                      )}
                    </div>
                    {bulkFiles.length>0&&(
                      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"9px",padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.textSub}}>
                        <span style={{color:"#38BDF8",fontWeight:"700"}}>{bulkFiles.length}</span> bill{bulkFiles.length>1?"s":""} queued · ~{bulkFiles.length*15} seconds to analyze all
                      </div>
                    )}
                    <button onClick={bulkAnalyze} disabled={!bulkFiles.length||bulkRunning} style={{width:"100%",padding:"14px",borderRadius:"9px",background:bulkFiles.length&&!bulkRunning?"linear-gradient(135deg,#38BDF8,#0EA5E9)":T.bgCard2,border:`1px solid ${bulkFiles.length&&!bulkRunning?"transparent":T.border}`,color:bulkFiles.length&&!bulkRunning?"#040d18":T.textDim,fontSize:"14px",fontWeight:"700",cursor:bulkFiles.length&&!bulkRunning?"pointer":"not-allowed",fontFamily:"'DM Mono',monospace",letterSpacing:".05em"}}>
                      {bulkRunning?<span className="pulse">⚡ Analyzing...</span>:`⚡ Analyze All ${bulkFiles.length||""} Bills`}
                    </button>
                  </>
                ):(
                  /* Progress view */
                  <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden"}}>
                    <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,background:T.bgCard2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontFamily:"monospace",fontSize:"11px",fontWeight:"700",color:"#38BDF8",letterSpacing:"0.1em"}}>BULK ANALYSIS PROGRESS</span>
                      <span style={{fontSize:"11px",color:T.textDim}}>{bulkProgress.filter(x=>x.status==="done").length}/{bulkProgress.length} complete</span>
                    </div>
                    <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:"6px",maxHeight:"340px",overflowY:"auto"}}>
                      {bulkProgress.map((item,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"7px",background:item.status==="done"?"rgba(52,199,89,0.06)":item.status==="error"?"rgba(255,59,48,0.06)":item.status==="analyzing"?"rgba(56,189,248,0.06)":T.bgCard2,border:`1px solid ${item.status==="done"?"rgba(52,199,89,0.2)":item.status==="error"?"rgba(255,59,48,0.2)":item.status==="analyzing"?"rgba(56,189,248,0.2)":T.border}`}}>
                          <span style={{fontSize:"16px",flexShrink:0}}>
                            {item.status==="done"?"✅":item.status==="error"?"❌":item.status==="analyzing"?"⚡":"⏳"}
                          </span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"11px",fontWeight:"600",color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                            {item.status==="done"&&item.result&&(
                              <div style={{fontSize:"10px",color:"#34C759",marginTop:"2px"}}>{item.result.provider} · {item.result.totalCharged} · {item.result.billStatus}</div>
                            )}
                            {item.status==="error"&&<div style={{fontSize:"10px",color:"#FF6B6B",marginTop:"2px"}}>{item.error}</div>}
                            {item.status==="analyzing"&&<div style={{fontSize:"10px",color:"#38BDF8",marginTop:"2px"}} className="pulse">Analyzing...</div>}
                            {item.status==="queued"&&<div style={{fontSize:"10px",color:T.textDim,marginTop:"2px"}}>Waiting...</div>}
                          </div>
                          {item.status==="done"&&<span style={{fontSize:"11px",fontFamily:"monospace",color:"#34C759",flexShrink:0,fontWeight:"700"}}>{item.result?.totalPotentialMonthlySavings?.split("–")[0]}/mo</span>}
                        </div>
                      ))}
                    </div>
                    {!bulkRunning&&bulkProgress.every(x=>x.status==="done"||x.status==="error")&&(
                      <div style={{padding:"12px 14px",borderTop:`1px solid ${T.border}`,background:"rgba(52,199,89,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                        <span style={{fontSize:"12px",color:"#34C759",fontWeight:"700"}}>✅ {bulkProgress.filter(x=>x.status==="done").length} bills analyzed successfully</span>
                        <div style={{display:"flex",gap:"8px"}}>
                          <button onClick={()=>{
                            const doneBills=bills.filter(b=>bulkProgress.some(p=>p.status==="done"&&p.name&&b.result));
                            if(doneBills.length>0){dlPDF(doneBills[0].result);}
                          }} style={{background:T.bgCard,border:`1px solid ${T.border}`,color:T.textSub,padding:"7px 12px",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}}>
                            ↓ PDF (Latest)
                          </button>
                          <button onClick={()=>{setBulkFiles([]);setBulkProgress([]);setView("history");}} style={{background:"linear-gradient(135deg,#38BDF8,#0EA5E9)",border:"none",color:"#040d18",padding:"7px 14px",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}}>
                            View in History →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{textAlign:"center",marginTop:"9px",fontSize:"10px",color:T.textFaint}}>Bills analyzed sequentially · ~15 seconds each · up to 12 bills</div>
              </>
            )}
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {view==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
              <div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"26px",marginBottom:"3px"}}>Bill History</div>
                <div style={{fontSize:"12px",color:T.textDim}}>{bills.length} bill{bills.length!==1?"s":""} analyzed · billing trends over time</div>
              </div>
              <button onClick={()=>setView("analyze")} style={{background:"linear-gradient(135deg,#38BDF8,#0EA5E9)",border:"none",color:"#040d18",padding:"9px 18px",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:"700",fontFamily:"monospace",boxShadow:"0 2px 10px rgba(56,189,248,.2)"}}>+ Analyze New Bill</button>
            </div>

            {bills.length===0?(
              <div style={{textAlign:"center",padding:"70px 24px"}}>
                <div style={{fontSize:"44px",marginBottom:"14px",opacity:0.12}}>📊</div>
                <div style={{fontSize:"15px",color:T.textDim,marginBottom:"6px"}}>No bills yet</div>
                <div style={{fontSize:"12px",color:T.textFaint}}>Upload your first bill to start tracking trends</div>
              </div>
            ):(
              <>
                <TrendKPIs bills={bills} completedActions={completedActions} T={T}/>
                {bills.length>=2&&(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"14px",marginBottom:"18px"}}>
                    {[
                      {title:"Monthly Cost ($)",height:165,el:<LineChart data={chartData} margin={{top:5,right:8,left:-22,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:9,fill:T.chartTick}}/><YAxis tick={{fontSize:9,fill:T.chartTick}} tickFormatter={v=>`$${v}`} domain={[dataMin=>dataMin===0?0:Math.floor(dataMin*0.9), dataMax=>dataMax===0?10:Math.ceil(dataMax*1.05)]}/><Tooltip content={<ChartTip T={T}/>}/><Line type="monotone" dataKey="Cost" stroke="#38BDF8" strokeWidth={2} dot={{fill:"#38BDF8",r:4,strokeWidth:0}} activeDot={{r:6}} name="Cost"/></LineChart>},
                      {title:`Monthly Usage (${usageUnit})`,height:165,el:<BarChart data={chartData} margin={{top:5,right:8,left:-22,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:9,fill:T.chartTick}}/><YAxis tick={{fontSize:9,fill:T.chartTick}}/><Tooltip content={<ChartTip T={T}/>}/>{usageUnit==="kWh"&&<ReferenceLine y={899} stroke={T.refLine} strokeDasharray="4 4"/>}<Bar dataKey="kWh" fill="#38BDF8" opacity={0.75} radius={[3,3,0,0]} name={usageUnit}/></BarChart>},
                      {title:`Rate per ${usageUnit} ($)`,height:150,el:<LineChart data={chartData} margin={{top:5,right:8,left:-12,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:9,fill:T.chartTick}}/><YAxis tick={{fontSize:9,fill:T.chartTick}} tickFormatter={v=>v<0.01?`$${v.toFixed(4)}`:v<0.1?`$${v.toFixed(3)}`:`$${v.toFixed(2)}`} domain={[dataMin=>dataMin===0?0:Math.floor(dataMin*0.9*10000)/10000, dataMax=>dataMax===0?1:Math.ceil(dataMax*1.05*10000)/10000]}/><Tooltip content={<ChartTip T={T}/>}/><Line type="monotone" dataKey="Rate" stroke="#FF9500" strokeWidth={2} dot={{fill:"#FF9500",r:4,strokeWidth:0}} name="Rate"/></LineChart>},
                    ].map(({title,height,el})=>(
                      <div key={title} style={{...CARD}}>
                        <div style={{fontSize:"9px",color:T.textDim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:"12px",fontFamily:"monospace"}}>{title}</div>
                        <ResponsiveContainer width="100%" height={height}>{el}</ResponsiveContainer>
                      </div>
                    ))}
                    <div style={{...CARD}}>
                      <div style={{fontSize:"9px",color:T.textDim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:"14px",fontFamily:"monospace"}}>Bill Status Timeline</div>
                      <div style={{display:"flex",flexDirection:"column",gap:"9px",paddingTop:"2px"}}>
                        {chartData.map((d,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                            <div style={{fontSize:"9px",color:T.textDim,fontFamily:"monospace",width:"86px",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                            <div style={{flex:1,height:"6px",background:T.statusBarBg,borderRadius:"3px",overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${(d.Cost/Math.max(...chartData.map(x=>x.Cost)))*100}%`,background:SC[d.status],borderRadius:"3px",opacity:0.7,transition:"width .4s"}}/>
                            </div>
                            <StatusBadge status={d.status} small/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{...CARD}}>
                  <SecHeader icon="🗂" title={`All Bills (${bills.length})`} T={T} right={
                    bills.length>0&&<div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {/* Compare hint */}
                      {bills.length>=2&&<div style={{fontSize:"10px",color:T.textDim,fontFamily:"monospace"}}>
                        {compareIds.size===0?"Select 2 to compare":compareIds.size===1?"Select 1 more":
                          <span style={{color:"#FF9500",cursor:"pointer"}} onClick={()=>setView("compare")}>⚖ Compare ready →</span>}
                      </div>}
                      {/* Delete controls */}
                      {deleteMode&&deleteIds.size>0&&(
                        <button onClick={deleteSelected} style={{background:"#FF3B30",border:"none",color:"#fff",padding:"3px 10px",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}}>
                          🗑 Delete ({deleteIds.size})
                        </button>
                      )}
                      <button onClick={toggleDeleteMode} style={{background:deleteMode?"rgba(255,59,48,0.15)":"rgba(255,59,48,0.08)",border:`1px solid ${deleteMode?"rgba(255,59,48,0.4)":"rgba(255,59,48,0.2)"}`,color:"#FF6B6B",padding:"3px 10px",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}}>
                        {deleteMode?"✕ Cancel":"☑ Select"}
                      </button>
                      {!deleteMode&&(
                        <button onClick={deleteAll} style={{background:"rgba(255,59,48,0.08)",border:"1px solid rgba(255,59,48,0.2)",color:"#FF6B6B",padding:"3px 10px",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}}>
                          🗑 All
                        </button>
                      )}
                    </div>
                  }/>
                  {[...bills].sort((a,b)=>new Date(b.analyzedAt)-new Date(a.analyzedAt)).map(bill=>{
                    const bRecs=allRecs(bill);
                    const bDone=bRecs.filter(rec=>completedActions.has(actionId(rec.billId,rec.cat,rec.title))).length;
                    const isCompareSelected = compareIds.has(bill.id);
                    const isCompareDisabled = compareIds.size===2 && !isCompareSelected;
                    const isDeleteSelected = deleteIds.has(bill.id);
                    return (
                      <div key={bill.id} className="br"
                        onClick={()=>deleteMode?setDeleteIds(prev=>{const n=new Set(prev);isDeleteSelected?n.delete(bill.id):n.add(bill.id);return n;}):openBill(bill)}
                        style={{
                          opacity:(!deleteMode&&isCompareDisabled)?0.45:1,
                          outline:deleteMode&&isDeleteSelected?"2px solid rgba(255,59,48,0.6)":!deleteMode&&isCompareSelected?"2px solid rgba(255,149,0,0.5)":"none",
                          background:deleteMode&&isDeleteSelected?"rgba(255,59,48,0.06)":"",
                        }}>
                        {/* Delete mode checkbox */}
                        {deleteMode?(
                          <div style={{flexShrink:0,width:"18px",height:"18px",borderRadius:"4px",
                            border:`2px solid ${isDeleteSelected?"#FF3B30":"rgba(255,59,48,0.3)"}`,
                            background:isDeleteSelected?"#FF3B30":"transparent",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            color:"#fff",fontSize:"10px",fontWeight:"700",transition:"all .15s"}}>
                            {isDeleteSelected?"✓":""}
                          </div>
                        ):(
                          /* Compare checkbox */
                          <button onClick={e=>{e.stopPropagation(); setCompareIds(prev=>{const n=new Set(prev); isCompareSelected?n.delete(bill.id):(prev.size<2&&n.add(bill.id)); return n;});}}
                            style={{flexShrink:0,width:"18px",height:"18px",borderRadius:"4px",
                              border:`2px solid ${isCompareSelected?"#FF9500":"rgba(255,149,0,0.25)"}`,
                              background:isCompareSelected?"#FF9500":"transparent",
                              cursor:isCompareDisabled?"not-allowed":"pointer",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              color:"#fff",fontSize:"10px",fontWeight:"700",transition:"all .15s"}}>
                            {isCompareSelected?"✓":""}
                          </button>
                        )}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:"600",color:deleteMode&&isDeleteSelected?"#FF6B6B":T.text,marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{BILL_TYPE_ICON[bill.result.billType]||"⚡"} {bill.result.provider}</div>
                          <div style={{fontSize:"10px",color:T.textDim}}>{bill.result.billingPeriod}</div>
                        </div>
                        {bDone>0&&<div style={{fontSize:"10px",color:"#34C759",fontFamily:"monospace",flexShrink:0}}>✓ {bDone}/{bRecs.length}</div>}
                        <div style={{textAlign:"right",fontFamily:"'DM Mono',monospace",flexShrink:0}}>
                          <div style={{fontSize:"15px",fontWeight:"700",color:T.text}}>{bill.result.totalCharged}</div>
                          <div style={{fontSize:"10px",color:T.textDim}}>{bill.result.totalUsage||bill.result.totalKwh}</div>
                        </div>
                        <StatusBadge status={bill.result.billStatus} small/>
                        {!deleteMode&&<button className="db" onClick={e=>{e.stopPropagation();deleteBill(bill.id);}}>✕</button>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}



        {/* ══ COMPARE ══ */}
        {view==="compare"&&compareIds.size===2&&(
          <CompareView bills={bills} compareIds={compareIds} onClose={()=>setView("history")} T={T} isMobile={isMobile} onExport={dlCompareReport}/>
        )}

        {/* ══ BILL DETAIL ══ */}
        {view==="detail"&&r&&(
          <div>
            {/* Top bar */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"3px"}}>
                  <button onClick={()=>setView("history")} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:"11px",padding:0,fontFamily:"monospace"}}>← History</button>
                  <span style={{color:T.textFaint}}>·</span>
                  <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"19px",color:T.text}}>{r.billingPeriod}</span>
                </div>
                <div style={{fontSize:"11px",color:T.textDim,display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}><span>{r.provider} · {new Date(selectedBill.analyzedAt).toLocaleDateString()}</span>{r.billType&&<span style={{background:(BILL_TYPE_COLOR[r.billType]||"#38BDF8")+"22",color:BILL_TYPE_COLOR[r.billType]||"#38BDF8",border:`1px solid ${(BILL_TYPE_COLOR[r.billType]||"#38BDF8")}44`,padding:"1px 8px",borderRadius:"4px",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}}>{BILL_TYPE_ICON[r.billType]} {r.billType}</span>}{selectedBill.context?.accountType&&<span style={{background:"rgba(56,189,248,0.08)",color:"#38BDF8",border:"1px solid rgba(56,189,248,0.2)",padding:"1px 8px",borderRadius:"4px",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}}>{selectedBill.context.accountType.replace("_"," ")}{selectedBill.context.accountType==="RESIDENTIAL"&&selectedBill.context.householdSize?` · ${selectedBill.context.householdSize}p`:""}{selectedBill.context.accountType!=="RESIDENTIAL"&&selectedBill.context.facilitySize?` · ${selectedBill.context.facilitySize}`:""}</span>}</div>
              </div>
              <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                {billCompleted.length>0&&(
                  <div className={celebrate?"celebrate":""} style={{fontSize:"11px",color:"#34C759",background:"rgba(52,199,89,0.1)",border:"1px solid rgba(52,199,89,0.2)",padding:"6px 12px",borderRadius:"18px",fontFamily:"monospace"}}>
                    ✓ ${billSaved.toFixed(0)}/mo saved · {billCompleted.length}/{billRecs.length} done
                  </div>
                )}
                <button onClick={()=>setShowChat(s=>!s)} style={{background:showChat?"linear-gradient(135deg,#38BDF8,#0EA5E9)":T.bgCard,border:`1px solid ${showChat?"transparent":T.border}`,color:showChat?"#040d18":T.textSub,padding:"7px 14px",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:"600",fontFamily:"monospace"}}>
                  💬 {showChat?"Close Chat":"Ask AI"}
                </button>
                <button onClick={()=>dlPDF(r)} disabled={pdfGenerating} style={{background:pdfGenerating?"rgba(56,189,248,0.15)":"linear-gradient(135deg,#38BDF8,#0EA5E9)",border:`1px solid ${pdfGenerating?"rgba(56,189,248,0.3)":"transparent"}`,color:pdfGenerating?"#38BDF8":"#040d18",padding:"7px 14px",borderRadius:"7px",cursor:pdfGenerating?"not-allowed":"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",boxShadow:pdfGenerating?"none":"0 2px 8px rgba(56,189,248,.2)",minWidth:"100px",transition:"all .2s"}}>
                  {pdfGenerating ? <span className="pulse">⚡ Building…</span> : "↓ PDF Report"}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"9px",marginBottom:"12px"}}>
              {[{label:"Total Charged",v:r.totalCharged,c:T.text},{label:"Usage",v:r.totalUsage||r.totalKwh,c:BILL_TYPE_COLOR[r.billType]||"#38BDF8"},{label:"Rate/Unit",v:r.ratePerUnit||r.ratePerKwh,c:"#FF9500"},{label:"vs. Regional Avg",v:r.regionalComparison.percentageDifference,c:r.regionalComparison.percentageDifference?.startsWith("+")?"#FF3B30":"#34C759"}].map(s=>(
                <div key={s.label} style={{...CARD}}>
                  <div style={{fontSize:"9px",color:T.textDim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"5px"}}>{s.label}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"18px",fontWeight:"700",color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Verification + Usage */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"11px",marginBottom:"11px"}}>
              <div style={{...CARD}}>
                <SecHeader icon="🔍" title="Bill Verification" T={T}/>
                <div style={{marginBottom:"9px"}}><StatusBadge status={r.billStatus}/></div>
                <div style={{fontSize:"12px",color:T.textSub,lineHeight:"1.6",marginBottom:"10px"}}>{r.billStatusReason}</div>
                {r.suspiciousCharges.map((c,i)=><div key={i} style={{background:T.suspBg,border:`1px solid ${T.suspBorder}`,borderRadius:"5px",padding:"7px 10px",marginBottom:"5px",fontSize:"11px",color:"#FF6B6B"}}>🚨 {c}</div>)}
                {r.potentialErrors.map((e,i)=><div key={i} style={{background:T.warnBg,border:`1px solid ${T.warnBorder}`,borderRadius:"5px",padding:"7px 10px",marginBottom:"5px",fontSize:"11px",color:"#FF9500"}}>⚠ {e}</div>)}
              </div>
              <div style={{...CARD}}>
                <SecHeader icon="📈" title="Usage Analysis" T={T}/>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:"16px",fontWeight:"700",color:UC[r.usageRating]||T.text}}>{r.usageRating}</span>
                  <span style={{fontSize:"10px",color:T.textDim}}>Usage Rating</span>
                </div>
                <div style={{fontSize:"12px",color:T.textSub,lineHeight:"1.6"}}>{r.usageRatingExplanation}</div>
                <div style={{marginTop:"11px",padding:"10px 12px",background:T.savingsBg,borderRadius:"7px",border:`1px solid ${T.savingsBorder}`}}>
                  <div style={{fontSize:"9px",color:"#38BDF8",marginBottom:"3px",letterSpacing:"0.1em",fontFamily:"monospace"}}>POTENTIAL SAVINGS</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"17px",fontWeight:"700",color:"#34C759"}}>{r.totalPotentialMonthlySavings}</div>
                  <div style={{fontSize:"10px",color:T.textDim,marginTop:"2px"}}>{r.totalPotentialAnnualSavings?.replace(/\/yr$|\/year$/,"")}/yr</div>
                  {parseNum(r.totalPotentialMonthlySavings?.split("–")[0])>parseNum(r.totalCharged)&&<div style={{fontSize:"9px",color:"#FF9500",marginTop:"4px"}}>⚠ Verify with utility — includes long-term investments</div>}
                </div>
              </div>
            </div>

            {/* Priority */}
            <div style={{background:T.prioBg,border:`1px solid ${T.prioBorder}`,borderRadius:"9px",padding:"14px 16px",marginBottom:"12px",display:"flex",gap:"11px",alignItems:"flex-start"}}>
              <span style={{fontSize:"16px"}}>★</span>
              <div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"#38BDF8",letterSpacing:"0.12em",marginBottom:"4px"}}>PRIORITY ACTION — DO THIS FIRST</div>
                <div style={{fontSize:"13px",color:T.text,lineHeight:"1.6"}}>{r.priorityAction}</div>
              </div>
            </div>

            {/* Tabs + recs */}
            <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"10px",overflow:"hidden",marginBottom:"4px"}}>
              <div style={{padding:"10px 13px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:"3px",flexWrap:isMobile?"nowrap":"wrap",background:T.bgCard2,overflowX:isMobile?"auto":"visible",WebkitOverflowScrolling:"touch"}}>
                {TABS.map(t=><button key={t.key} className={`tb ${activeTab===t.key?"ta":""}`} onClick={()=>setActiveTab(t.key)}>{t.icon} {t.label}</button>)}
              </div>
              <div style={{padding:"14px"}}>
                {r.recommendations[activeTab]?.length>0
                  ?r.recommendations[activeTab].map((item,i)=>{
                    const aid=actionId(selectedBill.id,activeTab,item.title);
                    return <RecCard key={i} item={item} T={T} completed={completedActions.has(aid)} onToggle={toggleAction} actionKey={aid}/>;
                  })
                  :<div style={{color:T.textDim,fontSize:"12px",padding:"12px 0"}}>No recommendations in this category for your bill.</div>}
              </div>
            </div>

            <div style={{fontSize:"10px",color:T.textFaint,textAlign:"center",marginBottom:"6px"}}>
              Confidence: <strong style={{color:T.textDim}}>{r.analysisConfidence}</strong> · {r.confidenceNote}
            </div>

            {showChat&&<BillChat billResult={r} T={T}/>}
          </div>
        )}
      </div>
    </div>
  );
}
