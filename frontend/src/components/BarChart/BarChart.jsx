import * as React from "react";
import { BarChart, Box }from "@cloudscape-design/components";

function EnrollmentRisk({ allStudies }) {
  const statuses = ["Completed", "Recruiting", "Not yet recruiting"];
  const phases = ["Phase 1", "Phase 2", "Phase 3"];

  // Build series array: one per status
  const series = statuses.map((status) => ({
    title: status,
    type: "bar",
    data: phases.map((phase) => {
      const count = allStudies.filter(
        (study) => study.status?.toLowerCase() === status.toLowerCase() &&
        study.phase?.toLowerCase() === phase.toLowerCase()
        
      ).length;
      return { x: phase, y: count };
    }),
  }));

  return (
    <Box>
        <BarChart
          fitHeight={true}
          height={255}
          series={series}
          xDomain={phases}
          yDomain={[0, Math.max(...series.flatMap(s => s.data.map(d => d.y))) + 1]}
          xTitle="Study Phase"
          yTitle="Number of Studies"
          i18nStrings={{
            xTickFormatter: (e) => e,
            yTickFormatter: (e) => `${e}`
          }}
          detailPopoverSeriesContent={({ series, x, y }) => ({
            key: `${series.title}`,
            value: `${y} studies`,
          })}
          ariaLabel="Study Phase by Status Bar Chart"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data available</b>
              <Box variant="p" color="inherit">
                There is no data available
              </Box>
            </Box>
          }
          noMatch={
            <Box textAlign="center" color="inherit">
              <b>No matching data</b>
              <Box variant="p" color="inherit">
                There is no matching data to display
              </Box>
            </Box>
          }
        />
    </Box>
  );
}

export default EnrollmentRisk;