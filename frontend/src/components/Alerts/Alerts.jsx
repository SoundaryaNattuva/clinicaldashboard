import React, { useState } from 'react'
import { ColumnLayout, SpaceBetween, Header, Box} from "@cloudscape-design/components";
import DashTable from '../DashTable/DashTable';


function Alerts ({ studyData }) {
  const [selectedStudies, setSelectedStudies] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const today = new Date();
  const redAlerts = [];
  const amberAlerts = [];
  const completed = [];
  const inProgress = [];
  const pendingStart = [];
  
  studyData.forEach(study => {
    const { enrollmentTarget, currentEnrollment, plannedEndDate } = study;
    const percent = enrollmentTarget > 0 ? (currentEnrollment / enrollmentTarget) * 100 : 0;
    const end = new Date(plannedEndDate);
    const monthsToEnd = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
  
    if (study.status === "Completed") {
      completed.push(study);
    } else if (percent < 90 && monthsToEnd <= 3) {
      redAlerts.push(study);
    } else if (percent < 75 && monthsToEnd <= 6) {
      amberAlerts.push(study);
    } else if (study.status === "Recruiting"){
      inProgress.push(study);
    } else if (study.status === "Not yet recruiting"){
      pendingStart.push(study)
    }
  });

  const stats = [
    { label: "At Risk", value: redAlerts.length, fontColor: "#e12020", info: "Enrollment below 90% and within 3 months of planned end date.", valueSet: redAlerts },
    { label: "Under Target", value: amberAlerts.length, fontColor: "#e18c20", info: "Enrollment below 75% and within 6 months of planned end date.", valueSet: amberAlerts},
    // { label: "Completed", value: completed.length, fontColor: "#07a90d", info: "Study has reached 100% enrollment or marked as completed."},
    { label: "In Progress", value: inProgress.length, fontColor: "#154c79", valueSet: inProgress },
    { label: "Pending Start", value: pendingStart.length, fontColor: "#5939BB", info: "Upcoming trials pending participant enrollment.", valueSet: pendingStart}
  ];
  
  return (
    <div>
      <Header variant="h3">Enrollment Risk Alerts</Header>
      <Box margin={{ top: "m" }} width="100%">
        <ColumnLayout columns={4} borders="vertical">
          {stats.map((stat, index) => (
          <div
            onClick={() => {
              const filtered = stat.valueSet;
              setSelectedStudies(filtered);
              setSelectedLabel(stat.label);
              setCurrentPage(1);
              console.log("Resetting to page 1 in parent");
            }}
          >
            <SpaceBetween key={index} size="xs">
                <Box textAlign="center" display="flex" alignItems="center" justifyContent="center"gap="xxs">
                  <Box fontWeight="bold">{stat.label}</Box>
                </Box>
                <Box fontSize="display-l" textAlign="center">
                  <div style={{ color: stat.fontColor, cursor: "pointer", textDecoration: "underline", transition: "0.2s",  }}
                    onMouseEnter={(e) => e.target.style.opacity = 0.8}
                    onMouseLeave={(e) => e.target.style.opacity = 1}
                  >
                    {stat.value}
                  </div>
                </Box>
                <Box border={{ color: stat.fontColor, style: "solid", width: 1 }} />
            </SpaceBetween>
          </div>  
          ))}
        </ColumnLayout>
        <DashTable selectedStudies={selectedStudies} alertLabel={selectedLabel} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </Box>
    </div>
  )
}

export default Alerts;