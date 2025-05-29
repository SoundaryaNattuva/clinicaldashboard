import * as React from "react";
import { useState } from "react";
import { Container, Header, Box, Button, PieChart } from "@cloudscape-design/components";

function StudyStatus({ allStudies }) {
  const [selectedPhase, setSelectedPhase] = useState(null);

  const statusCountsByPhase = {};

  allStudies.forEach((study) => {
    const phase = study.phase;
    const status = study.status;

    if (!statusCountsByPhase[phase]) {
      statusCountsByPhase[phase] = { Completed: 0, Recruiting: 0, "Not yet recruiting": 0 };
    }

    if (statusCountsByPhase[phase][status] !== undefined) {
      statusCountsByPhase[phase][status]++;
    }
  });

  //Phase Order
  const phaseOrder = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

  // Pie chart data: slice per phase
  const chartData = phaseOrder
    .filter(phase => statusCountsByPhase[phase]) // only include existing phases
    .map(phase => {
      const total = Object.values(statusCountsByPhase[phase]).reduce((sum, val) => sum + val, 0);
      return {
        title: phase,
        value: total
      };
  });

  // Filter studies by selected phase
  const filteredStudies = selectedPhase
    ? allStudies.filter(study => study.phase === selectedPhase)
    : allStudies;

  return (
    <>
      {chartData.length > 0 && (
        <PieChart
          height={200}
          data={chartData}
          onDatumClick={({ detail }) => {
            setSelectedPhase(detail.datum.title);
          }}
          hideLegend={false}
          detailPopoverContent={(datum, sum) => {
            const phase = datum.title;
            const statusCounts = statusCountsByPhase[phase] || {};

            return [
              { key: "Study count:", value: datum.value },
              { key: "Percentage:", value: `${((datum.value / sum) * 100).toFixed(0)}%` },
              { key: "Completed", value: statusCounts["Completed"] || 0 },
              { key: "Recruiting", value: statusCounts["Recruiting"] || 0 },
              { key: "Not yet recruiting", value: statusCounts["Not yet recruiting"] || 0 }
            ];
          }}
          segmentDescription={(datum, sum) =>
            `${datum.value} studies, ${((datum.value / sum) * 100).toFixed(0)}%`
          }
          ariaDescription="Pie chart showing number of studies by phase"
          ariaLabel="Study phase pie chart"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data available</b>
              <Box variant="p">There is no data available</Box>
            </Box>
          }
          noMatch={
            <Box textAlign="center" color="inherit">
              <b>No matching data</b>
              <Box variant="p">There is no matching data to display</Box>
              {selectedPhase && (
                <Button onClick={() => setSelectedPhase(null)} variant="link">
                  Reset filter
                </Button>
              )}
            </Box>
          }
        />
      )}

      {selectedPhase && (
        <Container header={<Header variant="h3">{selectedPhase} Studies</Header>}>
          {filteredStudies.length > 0 ? (
            <ul>
              {filteredStudies.map((study) => (
                <li key={study.studyId}>
                  {study.title} — {study.status}
                </li>
              ))}
            </ul>
          ) : (
            <Box>No studies found for this phase.</Box>
          )}
          <Button onClick={() => setSelectedPhase(null)} variant="link">
            Clear selection
          </Button>
        </Container>
      )}
    </>
  );
}

export default StudyStatus;
