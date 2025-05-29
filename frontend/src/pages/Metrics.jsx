import * as React from "react";
import { useState, useEffect } from "react";
import { Container, Header, Grid } from "@cloudscape-design/components";

//components
import StudyStatus from "../components/PieChart/PieChart";
import EnrollmentRisk from "../components/BarChart/BarChart";
import TrialInit from "../components/LineChart/LineChart"


function Metrics () {
  const [studyData, setStudyData] = useState([]);
  
  useEffect(() => {
    async function fetchData() {
      const response = await fetch("http://localhost:8000/studies");
      const result = await response.json();
      setStudyData(result); // adjust based on your API response
    }
    fetchData();
  }, []);
  
  return (
    <>
      <Header variant="h1">Metrics</Header> {/* ✅ Dashboard Title */}
      <Grid
        gridDefinition={[
          { colspan: 12 }, // First row - left half
          { colspan: 6 }, // First row - right half
          { colspan: 6 }, // Second row - full width
          { colspan: 6 } // Second row - full width
        ]}
        disableGutters={false}
      >
        <Container header={<Header variant="h2">Trial Initiation Trends Over Time</Header>}>
          <TrialInit allStudies={studyData} />
        </Container>

        <Container header={<Header variant="h2">Study Status</Header>}>
          <StudyStatus allStudies={studyData} />
        </Container>

        <Container header={<Header variant="h2">Trial Distribution</Header>}>
          <EnrollmentRisk allStudies={studyData} />
        </Container>

        <Container header={<Header variant="h2">All Studies</Header>}>
          <p>This takes the full row</p>
        </Container>

      </Grid>
    </>
  );
}

export default Metrics
