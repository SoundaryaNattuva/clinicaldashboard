import * as React from "react";
import { useState } from "react";
import { Container, Header, Box, Button, PieChart } from "@cloudscape-design/components";

//Component Declaration
function StudyStatus({ allStudies }) {
  //State Variables
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Count studies in each phase per phase
  const phaseCountsByStatus = {};

  allStudies.forEach((study) => {
    const status = study.status;
    const phase = study.phase;

  if (!phaseCountsByStatus[status]) {
    phaseCountsByStatus[status] = { "Phase 1": 0, "Phase 2": 0, "Phase 3": 0 };
  }

  if (phaseCountsByStatus[status][phase] !== undefined) {
    phaseCountsByStatus[status][phase]++;
  }
});

  //Transform Data for Pie Chart
  const statusCounts = (allStudies || []).reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  // Takes the count and format in a way that Cloudscape accepts it
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    title: status,
    value: count,
  }));

  // Filter studies based on Selected Status
  const filteredStudies = selectedStatus
    ? allStudies.filter(study => study.status === selectedStatus)
    : allStudies;

  return (
    <>
    {chartData.length > 0 && (
      <PieChart
        height={200}
        data={chartData}
        onDatumClick={({ detail }) => {
          console.log("Clicked status:", detail.title);
          setSelectedStatus(detail.datum.title)
        }}
        hideLegend={false}
        
        detailPopoverContent={(datum, sum) => {
          const status = datum.title;
          const phases = phaseCountsByStatus[status] || {};
      
          return [
            { key: "Study count:", value: datum.value },
            { key: "Percentage:", value: `${((datum.value / sum) * 100).toFixed(0)}%` },
            { key: "Phase 1", value: phases["Phase 1"] },
            { key: "Phase 2", value: phases["Phase 2"] },
            { key: "Phase 3", value: phases["Phase 3"] }
          ];
        }
      }

        segmentDescription={(datum, sum) =>
          `${datum.value} studies, ${((datum.value / sum) * 100).toFixed(0)}%`
        }
        ariaDescription="Pie chart showing number of studies by status"
        ariaLabel="Study status pie chart"
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
            {selectedStatus && (
              <Button onClick={() => setSelectedStatus(null)} variant="link">
                Reset filter
              </Button>
            )}
          </Box>
        }
      />
    )}
    {selectedStatus && (
  <Container header={<Header variant="h3">{selectedStatus} Studies</Header>}>
    {filteredStudies.length > 0 ? (
      <ul>
        {filteredStudies.map(study => (
          <li key={study.studyId}>{study.title}</li>
        ))}
      </ul>
    ) : (
      <Box>No studies found for this status.</Box>
    )}
    <Button onClick={() => setSelectedStatus(null)} variant="link">
      Clear selection
    </Button>
  </Container>
)}
    </>
  );
}

export default StudyStatus;
