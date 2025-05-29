import React from "react";
import { Grid, Container, Header } from "@cloudscape-design/components";
import { useState, useEffect, useRef} from "react";
import html2canvas from 'html2canvas'
import { Download } from 'lucide-react';

//components
import Alerts from "../components/Alerts/Alerts";
import StudyStatus from "../components/PieChart/PieChart";
import EnrollmentRisk from "../components/BarChart/BarChart";
import TrialInit from "../components/LineChart/LineChart";
import PieChartPhase from "../components/PieChartPhases/PieChartPhases";

function Dashboard() {
    const [studyData, setStudyData] = useState([]);
    const trialInitRef = useRef(null);
    const enrollmentRef = useRef(null);
    //const piePhaseRef= useRef(null);
    const studyStatRef= useRef(null);
    
    const downloadChart = async (ref, filename) => {
      if (!ref.current) return;
    
      try {
        const canvas = await html2canvas(ref.current);
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
      } catch (err) {
        console.error("Download failed:", err);
      }
    };
    
    useEffect(() => {
      async function fetchData() {
        const response = await fetch("http://localhost:8000/studies");
        const result = await response.json();
        setStudyData(result);
      }
      fetchData();
    }, []);
  return (
    <Grid
      gridDefinition={[
        { colspan: { l: 12, m: 12, default: 12 } },
        { colspan: { l: 12, m: 12, default: 12 } },
        { colspan: { l: 12, m: 12, default: 12 } },
        { colspan: { l: 6, m: 6, default: 6 } },
        { colspan: { l: 6, m: 6, default: 6 } },
        { colspan: { l: 6, m: 6, default: 6 } },
      ]}
    >
      <Header variant="h1">Clinical Dashboard</Header>
      <Container>
        <Alerts studyData={studyData}/>
      </Container>

      <div ref={trialInitRef} >
        <Container header={<Header variant="h3" description="Number of trials initiated each month over time">Trial Initiation Over Time
          <span style={{ marginLeft: "8px" }}>
          <Download size={16} className="clickable-icon" onClick={() => downloadChart(trialInitRef, "trial-initiation.png")}/> 
          </span>
        </Header>}>
          <TrialInit allStudies={studyData} />
        </Container>
      </div>

      <div ref={enrollmentRef}>
        <Container header={<Header variant="h3" description="Shows the number of studies grouped by trial phase and recruitment status">Recruitment Status Across Trial Phases
          <span style={{ marginLeft: "8px" }}>
          <Download size={16} onClick={() => downloadChart(enrollmentRef, "recruitment-status-bar-chart.png")}/> 
            </span>
        </Header>}>
          <EnrollmentRisk allStudies={studyData} />
        </Container>
      </div>

      {/* <div ref={piePhaseRef}>
        <Container header={<Header variant="h3" description="Shows the number of studies grouped by trial phase and recruitment status">
          Recruitment Status Across Trial Phases 
          <span style={{ marginLeft: "8px" }}>
          <Download size={16} onClick={() => downloadChart(piePhaseRef, "recruitment-status-pie-chart.png")}/> 
          </span>
          </Header>}>
          <PieChartPhase allStudies={studyData} />
        </Container>
      </div> */}

      <div ref={studyStatRef}>
        <Container header={<Header variant="h3" description="Distribution of studies across different statuses">Study Status
          <span style={{ marginLeft: "8px" }}>
          <Download size={16} onClick={() => downloadChart(studyStatRef, "study-status-pie-chart.png")}/>
          </span>
          </Header>}>
          <StudyStatus allStudies={studyData} />
        </Container>
      </div>
    </Grid>
  );
}

export default Dashboard;
