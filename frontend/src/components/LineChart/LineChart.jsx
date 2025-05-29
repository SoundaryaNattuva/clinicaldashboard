import { useMemo, } from "react";
import { LineChart, Box } from "@cloudscape-design/components";

// Format "2023-03" style keys into real JS Dates (first of month)
const parseMonthKey = (key) => {
  const [year, month] = key.split("-");
  return new Date(year, month - 1); // months are 0-based
};

const getLineChartSeries = (allStudies) => {
  const phases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];
  const monthlyCounts = {};

  allStudies.forEach((study) => {
    if (!study.startDate || !study.phase) return;

    const date = new Date(study.startDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyCounts[monthKey]) {
      monthlyCounts[monthKey] = {
        "Phase 1": 0,
        "Phase 2": 0,
        "Phase 3": 0,
        "Phase 4": 0,
        "All Phases": 0,
      };
    }

    if (phases.includes(study.phase)) {
      monthlyCounts[monthKey][study.phase]++;
      monthlyCounts[monthKey]["All Phases"]++;
    }
  });

  const sortedMonths = Object.keys(monthlyCounts).sort();

  return ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "All Phases"].map((phase) => ({
    title: phase,
    type: "line",
    data: sortedMonths.map((monthKey) => ({
      x: parseMonthKey(monthKey),
      y: monthlyCounts[monthKey][phase] || 0,
    })),
  }));
};

function TrialInit({ allStudies }) {
  const chartSeries = useMemo(() => getLineChartSeries(allStudies), [allStudies]);

  return (
    <LineChart
      fitHeight={true}
      height={200}
      series={chartSeries}
      xScaleType="time"
      xTitle="Month of Trial Initiation"
      yTitle="Number of Studies"
      ariaLabel="Trial Initiation Trends"
      i18nStrings={{
        xTickFormatter: (date) =>
          date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      }}
      empty={
        <Box textAlign="center" color="inherit">
          <b>No data available</b>
          <Box variant="p" color="inherit">
            There is no data to display for study start trends.
          </Box>
        </Box>
      }
    />
  );
}

export default TrialInit;
