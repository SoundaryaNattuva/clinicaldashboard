import {
  Container, Header, Button, Multiselect, DateRangePicker, SpaceBetween
} from "@cloudscape-design/components";
import { useState } from "react";

const phases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];
const statuses = ["Recruiting", "Completed", "Not yet recruiting"];
const columns = [
  { label: "Title", value: "title" },
  { label: "Phase", value: "phase" },
  { label: "Status", value: "status" },
  { label: "Enrollment Target", value: "enrollmentTarget" },
  { label: "Current Enrollment", value: "currentEnrollment" },
  { label: "Start Date", value: "startDate" },
  { label: "Planned End Date", value: "plannedEndDate" }
];

function ExportPage() {
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [startDateRange, setStartDateRange] = useState({});
  const [endDateRange, setEndDateRange] = useState({});

  const handleExport = async () => {
    const params = new URLSearchParams();
  
    if (selectedPhases.length > 0) {
      selectedPhases.forEach(p => params.append("phases", p.value));
    }
  
    if (selectedStatuses.length > 0) {
      selectedStatuses.forEach(s => params.append("statuses", s.value));
    }
  
    if (selectedColumns.length > 0) {
      params.append(
        "columns",
        selectedColumns.map(col => col.value).join(",")
      );
    }
  
    // Trim "T00:00:00" from ISO date strings
    const getDateOnly = (datetimeStr) => datetimeStr?.split("T")[0];
  
    if (startDateRange.startDate) {
      params.append("start_from", getDateOnly(startDateRange.startDate));
    }
    if (startDateRange.endDate) {
      params.append("start_to", getDateOnly(startDateRange.endDate));
    }
    if (endDateRange.startDate) {
      params.append("end_from", getDateOnly(endDateRange.startDate));
    }
    if (endDateRange.endDate) {
      params.append("end_to", getDateOnly(endDateRange.endDate));
    }
  
    try {
      const response = await fetch(`http://localhost:8000/export-excel/?${params}`);
      if (!response.ok) {
        const error = await response.json();
        alert(error.detail);
        return;
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "custom_studies.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export: " + err.message);
    }
  };
  

  return (
    <Container header={<Header variant="h2">Custom Export</Header>}>
      <SpaceBetween size="m" direction="vertical">
        <Multiselect
          selectedOptions={selectedPhases}
          onChange={({ detail }) => setSelectedPhases(detail.selectedOptions)}
          options={phases.map(p => ({ label: p, value: p }))}
          placeholder="Select Phases"
        />
        <Multiselect
          selectedOptions={selectedStatuses}
          onChange={({ detail }) => setSelectedStatuses(detail.selectedOptions)}
          options={statuses.map(s => ({ label: s, value: s }))}
          placeholder="Select Statuses"
        />
        <DateRangePicker
          onChange={({ detail }) => setStartDateRange(detail.value)}
          value={startDateRange}
          placeholder="Select Start Date Range"
          i18nStrings={{ todayAriaLabel: 'Today', nextMonthAriaLabel: 'Next Month', previousMonthAriaLabel: 'Previous Month' }}
        />
        <DateRangePicker
          onChange={({ detail }) => setEndDateRange(detail.value)}
          value={endDateRange}
          placeholder="Select Planned End Date Range"
          i18nStrings={{ todayAriaLabel: 'Today', nextMonthAriaLabel: 'Next Month', previousMonthAriaLabel: 'Previous Month' }}
        />
        <Multiselect
          selectedOptions={selectedColumns}
          onChange={({ detail }) => setSelectedColumns(detail.selectedOptions)}
          options={columns}
          placeholder="Select Columns to Include"
        />
        <Button onClick={handleExport}>Download Excel</Button>
      </SpaceBetween>
    </Container>
  );
}

export default ExportPage;
