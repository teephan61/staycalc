"use client";

import { useEffect, useMemo, useState } from "react";

type Scenario = {
  rent: number;
  nightlyRate: number;
  occupancyRate: number;
  cleaningCost: number;
  utilities: number;
  platformFee: number;
  startupCost: number;
  amortizationMonths: number;
  maintenanceReserve: number;
};

type Highlight = "green" | "yellow" | "red";

const defaultScenarioA: Scenario = {
  rent: 2000,
  nightlyRate: 150,
  occupancyRate: 70,
  cleaningCost: 300,
  utilities: 200,
  platformFee: 15,
  startupCost: 6000,
  amortizationMonths: 12,
  maintenanceReserve: 150,
};

const defaultScenarioB: Scenario = {
  rent: 2400,
  nightlyRate: 180,
  occupancyRate: 65,
  cleaningCost: 320,
  utilities: 220,
  platformFee: 15,
  startupCost: 8000,
  amortizationMonths: 12,
  maintenanceReserve: 200,
};

const helpText: Record<string, string> = {
  rent: "Your monthly rent or lease cost for the property.",
  nightlyRate: "The average price you expect to charge per booked night.",
  occupancyRate:
    "The percentage of nights booked in a month. Example: 70 means about 21 nights out of 30.",
  cleaningCost:
    "Estimated monthly cleaning spend. You can include turnovers, laundry, or contractor cleaning.",
  utilities:
    "Monthly utilities such as electricity, water, internet, and similar recurring bills.",
  platformFee:
    "The percentage taken by the booking platform from your revenue.",
  startupCost:
    "One-time setup cost like furniture, decor, kitchenware, locks, and supplies.",
  amortizationMonths:
    "How many months you want to spread your startup cost across for planning.",
  maintenanceReserve:
    "Monthly buffer for repairs, replacements, restocking, and unexpected wear.",
  bookedNights:
    "Estimated booked nights per month based on your occupancy rate.",
  grossRevenue:
    "Revenue before most expenses are removed.",
  platformFees:
    "Estimated amount lost to booking platform fees.",
  startupPerMonth:
    "Your startup cost spread across the amortization period.",
  baseExpenses:
    "Recurring monthly operating costs before startup amortization is included.",
  adjustedExpenses:
    "Recurring monthly costs plus the monthly share of startup cost.",
  baseNetProfit:
    "Profit before startup amortization is included.",
  adjustedNetProfit:
    "More realistic monthly profit after including startup cost amortization.",
  baseBreakEven:
    "Minimum occupancy needed to avoid losing money before startup amortization.",
  adjustedBreakEven:
    "Minimum occupancy needed to avoid losing money after startup amortization.",
  verdict:
    "A simple interpretation based on adjusted profit and adjusted break-even occupancy.",
  comparisonProfit:
    "Which option currently produces higher adjusted monthly profit.",
  comparisonBreakEven:
    "Which option needs a lower adjusted occupancy rate to break even.",
  comparisonSafer:
    "Overall safer option based on adjusted profit and adjusted break-even occupancy.",
};

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function calculateScenario(data: Scenario) {
  const rent = safeNumber(data.rent);
  const nightlyRate = safeNumber(data.nightlyRate);
  const occupancyRate = safeNumber(data.occupancyRate);
  const cleaningCost = safeNumber(data.cleaningCost);
  const utilities = safeNumber(data.utilities);
  const platformFee = safeNumber(data.platformFee);
  const startupCost = safeNumber(data.startupCost);
  const amortizationMonths =
    safeNumber(data.amortizationMonths) > 0
      ? safeNumber(data.amortizationMonths)
      : 1;
  const maintenanceReserve = safeNumber(data.maintenanceReserve);

  const daysPerMonth = 30;
  const bookedNights = (occupancyRate / 100) * daysPerMonth;
  const grossRevenue = bookedNights * nightlyRate;
  const feeCost = grossRevenue * (platformFee / 100);
  const adjustedStartupCost = startupCost / amortizationMonths;

  const totalExpenses =
    rent + cleaningCost + utilities + feeCost + maintenanceReserve;

  const adjustedTotalExpenses = totalExpenses + adjustedStartupCost;

  const netProfit = grossRevenue - totalExpenses;
  const adjustedNetProfit = grossRevenue - adjustedTotalExpenses;

  const denominator = nightlyRate * daysPerMonth * (1 - platformFee / 100);

  const breakEvenOccupancy =
    denominator > 0
      ? ((rent + cleaningCost + utilities + maintenanceReserve) / denominator) *
        100
      : 0;

  const adjustedBreakEvenOccupancy =
    denominator > 0
      ? ((rent +
          cleaningCost +
          utilities +
          maintenanceReserve +
          adjustedStartupCost) /
          denominator) *
        100
      : 0;

  let verdict = "Profitable";
  let riskNote = "Healthy margin based on current assumptions.";

  if (adjustedNetProfit < 0) {
    verdict = "Not worth it";
    riskNote =
      "After including startup and reserve assumptions, this setup is losing money.";
  } else if (adjustedNetProfit < 300) {
    verdict = "Tight margin";
    riskNote =
      "This setup may work, but the adjusted profit margin is still thin.";
  } else if (adjustedBreakEvenOccupancy > 75) {
    verdict = "High risk";
    riskNote =
      "This setup depends on very high occupancy once more realistic costs are included.";
  }

  return {
    bookedNights,
    grossRevenue,
    feeCost,
    adjustedStartupCost,
    totalExpenses,
    adjustedTotalExpenses,
    netProfit,
    adjustedNetProfit,
    breakEvenOccupancy,
    adjustedBreakEvenOccupancy,
    verdict,
    riskNote,
  };
}

export default function Home() {
  const [scenarioA, setScenarioA] = useState<Scenario>(defaultScenarioA);
  const [scenarioB, setScenarioB] = useState<Scenario>(defaultScenarioB);
  const [isLoaded, setIsLoaded] = useState(false);
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedA = localStorage.getItem("staycalc_A");
      const savedB = localStorage.getItem("staycalc_B");

      if (savedA) {
        setScenarioA({ ...defaultScenarioA, ...JSON.parse(savedA) });
      }

      if (savedB) {
        setScenarioB({ ...defaultScenarioB, ...JSON.parse(savedB) });
      }
    } catch (error) {
      console.error("Failed to load saved scenarios:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("staycalc_A", JSON.stringify(scenarioA));
  }, [scenarioA, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("staycalc_B", JSON.stringify(scenarioB));
  }, [scenarioB, isLoaded]);

  const resultsA = useMemo(() => calculateScenario(scenarioA), [scenarioA]);
  const resultsB = useMemo(() => calculateScenario(scenarioB), [scenarioB]);

  const currency = (value: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(safeNumber(value));

  const percent = (value: number) => `${safeNumber(value).toFixed(1)}%`;

  const resetScenarios = () => {
    setScenarioA(defaultScenarioA);
    setScenarioB(defaultScenarioB);
    localStorage.removeItem("staycalc_A");
    localStorage.removeItem("staycalc_B");
  };

  const comparisonSummary = useMemo(() => {
    const profitWinner =
      resultsA.adjustedNetProfit > resultsB.adjustedNetProfit
        ? "Option A"
        : resultsB.adjustedNetProfit > resultsA.adjustedNetProfit
          ? "Option B"
          : "Tie";

    const breakEvenWinner =
      resultsA.adjustedBreakEvenOccupancy < resultsB.adjustedBreakEvenOccupancy
        ? "Option A"
        : resultsB.adjustedBreakEvenOccupancy <
            resultsA.adjustedBreakEvenOccupancy
          ? "Option B"
          : "Tie";

    const saferOption =
      resultsA.adjustedNetProfit >= resultsB.adjustedNetProfit &&
      resultsA.adjustedBreakEvenOccupancy <=
        resultsB.adjustedBreakEvenOccupancy
        ? "Option A"
        : resultsB.adjustedNetProfit >= resultsA.adjustedNetProfit &&
            resultsB.adjustedBreakEvenOccupancy <=
              resultsA.adjustedBreakEvenOccupancy
          ? "Option B"
          : "Mixed";

    let summaryText = "";

    if (saferOption === "Option A") {
      summaryText =
        "Option A currently looks stronger overall after factoring in startup and reserve assumptions.";
    } else if (saferOption === "Option B") {
      summaryText =
        "Option B currently looks stronger overall after factoring in startup and reserve assumptions.";
    } else {
      summaryText =
        "The comparison is mixed. One option may offer better adjusted profit, while the other may be safer on adjusted break-even occupancy.";
    }

    return {
      profitWinner,
      breakEvenWinner,
      saferOption,
      summaryText,
    };
  }, [resultsA, resultsB]);

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#121933] via-[#10172c] to-[#17122a] p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#b8b8ff]">
                Phylix Tech
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                StayCalc Compare
              </h1>
              <p className="mt-3 text-base text-slate-300 md:text-lg">
                Compare short-term rental scenarios with a calmer, more realistic
                view of profit, risk, and break-even pressure.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Your scenarios save automatically in this browser. Tap the
                question marks for explanations.
              </p>
            </div>

            <button
              onClick={resetScenarios}
              className="rounded-2xl border border-[#cbb8ff]/30 bg-[#191f38] px-4 py-3 text-sm font-medium text-[#efeaff] transition hover:bg-[#222948]"
            >
              Reset both options
            </button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <ScenarioPanel
            title="Option A"
            data={scenarioA}
            setData={setScenarioA}
            results={resultsA}
            currency={currency}
            percent={percent}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />

          <ScenarioPanel
            title="Option B"
            data={scenarioB}
            setData={setScenarioB}
            results={resultsB}
            currency={currency}
            percent={percent}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#11172c] p-6 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-white">
              Comparison Summary
            </h2>
            <HelpBadge
              id="comparisonSafer"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <ResultRow
              label="Higher Adjusted Profit"
              value={comparisonSummary.profitWinner}
              helpId="comparisonProfit"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Lower Adjusted Break-even"
              value={comparisonSummary.breakEvenWinner}
              helpId="comparisonBreakEven"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Safer Overall Option"
              value={comparisonSummary.saferOption}
              helpId="comparisonSafer"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1326] p-5">
            <p className="text-sm font-medium text-[#cbb8ff]">Interpretation</p>
            <p className="mt-2 text-base text-slate-300">
              {comparisonSummary.summaryText}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ScenarioPanel({
  title,
  data,
  setData,
  results,
  currency,
  percent,
  openHelp,
  setOpenHelp,
}: {
  title: string;
  data: Scenario;
  setData: React.Dispatch<React.SetStateAction<Scenario>>;
  results: ReturnType<typeof calculateScenario>;
  currency: (value: number) => string;
  percent: (value: number) => string;
  openHelp: string | null;
  setOpenHelp: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#11172c] p-6 shadow-xl shadow-black/20">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#8ca2d8]">
          Scenario
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-white">Inputs</h3>

          <div className="mt-4 space-y-4">
            <Input
              label="Monthly Rent"
              helpId="rent"
              value={data.rent}
              setValue={(value) =>
                setData((prev) => ({ ...prev, rent: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Nightly Rate"
              helpId="nightlyRate"
              value={data.nightlyRate}
              setValue={(value) =>
                setData((prev) => ({ ...prev, nightlyRate: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Occupancy Rate (%)"
              helpId="occupancyRate"
              value={data.occupancyRate}
              setValue={(value) =>
                setData((prev) => ({ ...prev, occupancyRate: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Cleaning Cost"
              helpId="cleaningCost"
              value={data.cleaningCost}
              setValue={(value) =>
                setData((prev) => ({ ...prev, cleaningCost: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Utilities"
              helpId="utilities"
              value={data.utilities}
              setValue={(value) =>
                setData((prev) => ({ ...prev, utilities: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Platform Fee (%)"
              helpId="platformFee"
              value={data.platformFee}
              setValue={(value) =>
                setData((prev) => ({ ...prev, platformFee: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Startup Cost"
              helpId="startupCost"
              value={data.startupCost}
              setValue={(value) =>
                setData((prev) => ({ ...prev, startupCost: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Amortization Months"
              helpId="amortizationMonths"
              value={data.amortizationMonths}
              setValue={(value) =>
                setData((prev) => ({ ...prev, amortizationMonths: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <Input
              label="Maintenance Reserve"
              helpId="maintenanceReserve"
              value={data.maintenanceReserve}
              setValue={(value) =>
                setData((prev) => ({ ...prev, maintenanceReserve: value }))
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Results</h3>

          <div className="mt-4 space-y-3">
            <ResultRow
              label="Booked Nights / Month"
              value={results.bookedNights.toFixed(1)}
              helpId="bookedNights"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Gross Revenue"
              value={currency(results.grossRevenue)}
              helpId="grossRevenue"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Platform Fees"
              value={currency(results.feeCost)}
              helpId="platformFees"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Startup Cost / Month"
              value={currency(results.adjustedStartupCost)}
              helpId="startupPerMonth"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Base Expenses"
              value={currency(results.totalExpenses)}
              helpId="baseExpenses"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Adjusted Expenses"
              value={currency(results.adjustedTotalExpenses)}
              helpId="adjustedExpenses"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Base Net Profit"
              value={currency(results.netProfit)}
              helpId="baseNetProfit"
              highlight={
                results.netProfit < 0
                  ? "red"
                  : results.netProfit < 300
                    ? "yellow"
                    : "green"
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Adjusted Net Profit"
              value={currency(results.adjustedNetProfit)}
              helpId="adjustedNetProfit"
              highlight={
                results.adjustedNetProfit < 0
                  ? "red"
                  : results.adjustedNetProfit < 300
                    ? "yellow"
                    : "green"
              }
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Base Break-even"
              value={percent(results.breakEvenOccupancy)}
              helpId="baseBreakEven"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
            <ResultRow
              label="Adjusted Break-even"
              value={percent(results.adjustedBreakEvenOccupancy)}
              helpId="adjustedBreakEven"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1326] p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#cbb8ff]">Verdict</p>
              <HelpBadge
                id="verdict"
                openHelp={openHelp}
                setOpenHelp={setOpenHelp}
              />
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {results.verdict}
            </p>
            <p className="mt-2 text-sm text-slate-300">{results.riskNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  setValue,
  helpId,
  openHelp,
  setOpenHelp,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  helpId: string;
  openHelp: string | null;
  setOpenHelp: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const isOpen = openHelp === helpId;

  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <HelpBadge
          id={helpId}
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
        />
      </div>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(e.target.value === "" ? 0 : Number(e.target.value))
        }
        className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-slate-100 outline-none transition focus:border-[#cbb8ff]/60"
      />

      {isOpen && (
        <div className="mt-2 rounded-2xl border border-[#cbb8ff]/20 bg-[#171d33] px-4 py-3 text-sm text-slate-300">
          {helpText[helpId]}
        </div>
      )}
    </label>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  helpId,
  openHelp,
  setOpenHelp,
}: {
  label: string;
  value: string;
  highlight?: Highlight;
  helpId: string;
  openHelp: string | null;
  setOpenHelp: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  let color = "text-slate-100";

  if (highlight === "green") color = "text-emerald-300";
  if (highlight === "yellow") color = "text-amber-300";
  if (highlight === "red") color = "text-rose-300";

  const isOpen = openHelp === helpId;

  return (
    <div>
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d1326] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">{label}</span>
          <HelpBadge
            id={helpId}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        </div>
        <span className={`text-base font-semibold ${color}`}>{value}</span>
      </div>

      {isOpen && (
        <div className="mt-2 rounded-2xl border border-[#cbb8ff]/20 bg-[#171d33] px-4 py-3 text-sm text-slate-300">
          {helpText[helpId]}
        </div>
      )}
    </div>
  );
}

function HelpBadge({
  id,
  openHelp,
  setOpenHelp,
}: {
  id: string;
  openHelp: string | null;
  setOpenHelp: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const active = openHelp === id;

  return (
    <button
      type="button"
      onClick={() => setOpenHelp(active ? null : id)}
      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition ${
        active
          ? "bg-[#cbb8ff] text-[#0b1020]"
          : "border border-white/15 bg-white/5 text-[#d9ccff] hover:bg-white/10"
      }`}
      aria-label={`Explain ${id}`}
    >
      ?
    </button>
  );
}