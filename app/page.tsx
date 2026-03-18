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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Phylix Tech
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              StayCalc Compare
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Compare two short-term rental scenarios side by side
            </p>
            <p className="mt-1 text-sm text-slate-400">
              For estimation only. Real results depend on market conditions,
              regulations, building rules, lease restrictions, and actual setup
              costs.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Your scenarios now save automatically in this browser.
            </p>
          </div>

          <button
            onClick={resetScenarios}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Reset both options
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <ScenarioPanel
            title="Option A"
            data={scenarioA}
            setData={setScenarioA}
            results={resultsA}
            currency={currency}
            percent={percent}
          />

          <ScenarioPanel
            title="Option B"
            data={scenarioB}
            setData={setScenarioB}
            results={resultsB}
            currency={currency}
            percent={percent}
          />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Comparison Summary
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <ResultRow
              label="Higher Adjusted Profit"
              value={comparisonSummary.profitWinner}
            />
            <ResultRow
              label="Lower Adjusted Break-even"
              value={comparisonSummary.breakEvenWinner}
            />
            <ResultRow
              label="Safer Overall Option"
              value={comparisonSummary.saferOption}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Interpretation</p>
            <p className="mt-2 text-base text-slate-700">
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
}: {
  title: string;
  data: Scenario;
  setData: React.Dispatch<React.SetStateAction<Scenario>>;
  results: ReturnType<typeof calculateScenario>;
  currency: (value: number) => string;
  percent: (value: number) => string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Scenario
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Inputs</h3>

          <div className="mt-4 space-y-4">
            <Input
              label="Monthly Rent"
              value={data.rent}
              setValue={(value) =>
                setData((prev) => ({ ...prev, rent: value }))
              }
            />
            <Input
              label="Nightly Rate"
              value={data.nightlyRate}
              setValue={(value) =>
                setData((prev) => ({ ...prev, nightlyRate: value }))
              }
            />
            <Input
              label="Occupancy Rate (%)"
              value={data.occupancyRate}
              setValue={(value) =>
                setData((prev) => ({ ...prev, occupancyRate: value }))
              }
            />
            <Input
              label="Cleaning Cost"
              value={data.cleaningCost}
              setValue={(value) =>
                setData((prev) => ({ ...prev, cleaningCost: value }))
              }
            />
            <Input
              label="Utilities"
              value={data.utilities}
              setValue={(value) =>
                setData((prev) => ({ ...prev, utilities: value }))
              }
            />
            <Input
              label="Platform Fee (%)"
              value={data.platformFee}
              setValue={(value) =>
                setData((prev) => ({ ...prev, platformFee: value }))
              }
            />
            <Input
              label="Startup Cost"
              value={data.startupCost}
              setValue={(value) =>
                setData((prev) => ({ ...prev, startupCost: value }))
              }
            />
            <Input
              label="Amortization Months"
              value={data.amortizationMonths}
              setValue={(value) =>
                setData((prev) => ({ ...prev, amortizationMonths: value }))
              }
            />
            <Input
              label="Maintenance Reserve"
              value={data.maintenanceReserve}
              setValue={(value) =>
                setData((prev) => ({ ...prev, maintenanceReserve: value }))
              }
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900">Results</h3>

          <div className="mt-4 space-y-3">
            <ResultRow
              label="Booked Nights / Month"
              value={results.bookedNights.toFixed(1)}
            />
            <ResultRow
              label="Gross Revenue"
              value={currency(results.grossRevenue)}
            />
            <ResultRow
              label="Platform Fees"
              value={currency(results.feeCost)}
            />
            <ResultRow
              label="Startup Cost / Month"
              value={currency(results.adjustedStartupCost)}
            />
            <ResultRow
              label="Base Expenses"
              value={currency(results.totalExpenses)}
            />
            <ResultRow
              label="Adjusted Expenses"
              value={currency(results.adjustedTotalExpenses)}
            />
            <ResultRow
              label="Base Net Profit"
              value={currency(results.netProfit)}
              highlight={
                results.netProfit < 0
                  ? "red"
                  : results.netProfit < 300
                    ? "yellow"
                    : "green"
              }
            />
            <ResultRow
              label="Adjusted Net Profit"
              value={currency(results.adjustedNetProfit)}
              highlight={
                results.adjustedNetProfit < 0
                  ? "red"
                  : results.adjustedNetProfit < 300
                    ? "yellow"
                    : "green"
              }
            />
            <ResultRow
              label="Base Break-even"
              value={percent(results.breakEvenOccupancy)}
            />
            <ResultRow
              label="Adjusted Break-even"
              value={percent(results.adjustedBreakEvenOccupancy)}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Verdict</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {results.verdict}
            </p>
            <p className="mt-2 text-sm text-slate-600">{results.riskNote}</p>
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
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(e.target.value === "" ? 0 : Number(e.target.value))
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
      />
    </label>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: Highlight;
}) {
  let color = "text-slate-900";

  if (highlight === "green") color = "text-green-600";
  if (highlight === "yellow") color = "text-yellow-600";
  if (highlight === "red") color = "text-red-600";

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-base font-semibold ${color}`}>{value}</span>
    </div>
  );
}