import {useState, useEffect} from "react"
import { Table, Box, SpaceBetween, Button, TextFilter, Header, Pagination, CollectionPreferences, Modal, FormField, Input, Select, DatePicker } from "@cloudscape-design/components";
import { SquarePen, BookX } from 'lucide-react';

function DashTable({ selectedStudies, alertLabel, currentPage, setCurrentPage}) {
  const pageSize = 5;
  const [editingStudy, setEditingStudy] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [studies, setStudies] = useState([]);
  const [filteringText, setFilteringText] = useState("");
  
  const filteredStudies = studies.filter(study =>
    study.studyId.toLowerCase().includes(filteringText.toLowerCase()) ||
    study.title.toLowerCase().includes(filteringText.toLowerCase()) ||
    study.status.toLowerCase().includes(filteringText.toLowerCase()) ||
    study.phase.toLowerCase().includes(filteringText.toLowerCase())
  );
  
  const paginatedItems = filteredStudies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const statusOptions = [
    { label: "Recruiting", value: "Recruiting" },
    { label: "Not yet recruiting", value: "Not yet recruiting" },
    { label: "Completed", value: "Completed" },
  ];  

  const phaseOptions = [
    { label: "Phase 1", value: "Phase 1" },
    { label: "Phase 2", value: "Phase 2" },
    { label: "Phase 3", value: "Phase 3" },
  ];

  const handleFormSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:8000/studies/${editingStudy.studyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) throw new Error("Failed to update study");
      const updated = await res.json();
      setStudies((prev) =>
        prev.map((s) => (s.studyId === updated.studyId ? updated : s))
      );
      setEditingStudy(null);
    } catch (err) {
      console.error("Update failed:", err.message);
    }
  };

  const handleEdit = (study) => {
    setEditingStudy(study);
    setFormValues({ ...study });
  };

  const handleDelete = async (studyId) => {
    if (!window.confirm(`Are you sure you want to delete study ID: ${studyId}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/studies/${studyId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete study");
      setStudies(prev => prev.filter(s => s.studyId !== studyId));
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  useEffect(() => {
    setStudies(selectedStudies);
  }, [selectedStudies]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteringText]);
  
  useEffect(() => {
    console.log("Updated current page:", currentPage);
  }, [currentPage]);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US"); // gives MM/DD/YYYY format
  }
  
  return (
    <>
    <Table
      resizableColumns
      items={paginatedItems}
      columnDefinitions={[
        {
          id: 'actions',
          header: 'Actions',
          width: 80,  
          minWidth: 80,
          cell: item => (
            <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="inline-link"
              onClick={() => handleEdit(item)}
            >
              <SquarePen color="#bc2cbc" size={18}/>
            </Button>
            <Button
              variant="inline-link"
              onClick={() => handleDelete(item.studyId)}
            >
              <BookX color="#bc2cbc"  size={18}/>
            </Button>
          </SpaceBetween>
          )
        },
        {
          id: "studyId",
          header: "Study ID",
          cell: item => item.studyId,
          isRowHeader: true,
        },
        {
          id: "title",
          header: "Title",
          cell: item => item.title,
        },
        {
          id: "phase",
          header: "Phase",
          cell: item => item.phase,
        },
        {
          id: "status",
          header: "Status",
          cell: item => item.status,
        },
        {
          id: "enrollment",
          header: "Enrollment",
          cell: item =>
            `${item.currentEnrollment} / ${item.enrollmentTarget}`,
        },
        {
          id: "startDate",
          header: "Start Date",
          cell: item => formatDate(item.startDate),
        },
        {
          id: "plannedEndDate",
          header: "Planned End Date",
          cell: item => formatDate(item.startDate),
        },
      ]}
      loadingText="Loading resources"
      trackBy="studyId"
      filter={
        <TextFilter
          filteringText={filteringText}
          onChange={({ detail }) => setFilteringText(detail.filteringText)}
          filteringPlaceholder="Search by ID, title, status, or phase"
          countText={`${filteredStudies.length} matches`}
        />
      }
      header={
        <Header>
          {alertLabel
            ? `${alertLabel} (${selectedStudies.length})`
            : `No Group Selected`}
        </Header>
      }
      pagination={
        <Pagination
          currentPageIndex={currentPage}
          onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
          pagesCount={Math.ceil(filteredStudies.length / pageSize)}
        />
      }
      empty={
        <Box textAlign="center" color="inherit">
          <SpaceBetween size="m">
            <b>No studies selected</b>
            <div>Select a group from the alerts above</div>
          </SpaceBetween>
        </Box>
      }
      // preferences={
      //   <CollectionPreferences
      //     title="Preferences"
      //     confirmLabel="Confirm"
      //     cancelLabel="Cancel"
      //     preferences={{
      //       pageSize: 10,
      //       contentDisplay: [
      //         { id: "variable", visible: true },
      //         { id: "value", visible: true },
      //         { id: "type", visible: true },
      //         { id: "description", visible: true }
      //       ]
      //     }}
      //     onConfirm={({ detail }) => {
      //       console.log("User preferences:", detail); // or update state
      //     }}
      //     stickyColumnsPreference={{
      //       firstColumns: {
      //         title: "Stick first column(s)",
      //         description:
      //           "Keep the first column(s) visible while horizontally scrolling the table content.",
      //         options: [
      //           { label: "None", value: 0 },
      //           { label: "First column", value: 1 },
      //           { label: "First two columns", value: 2 }
      //         ]
      //       },
      //       lastColumns: {
      //         title: "Stick last column",
      //         description:
      //           "Keep the last column visible while horizontally scrolling the table content.",
      //         options: [
      //           { label: "None", value: 0 },
      //           { label: "Last column", value: 1 }
      //         ]
      //       }
      //     }}
      //   />
      // }
    />
    <Modal
      visible={!!editingStudy}
      onDismiss={() => setEditingStudy(null)}
      header="Edit Study"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setEditingStudy(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleFormSubmit}>
              Save changes
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <FormField label="Title">
          <Input
            value={formValues.title || ""}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, title: detail.value })
            }
          />
        </FormField>
        <FormField label="Phase">
          <Select
            value={formValues.phase || ""}
            selectedOption={phaseOptions.find(opt => opt.value === formValues.phase)}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, phase: detail.selectedOption.value })
            }
            options={phaseOptions}
            placeholder="Select phase"
          />
        </FormField>
        <FormField label="Status">
          <Select
            selectedOption={statusOptions.find(opt => opt.value === formValues.status)}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, status: detail.selectedOption.value })
            }
            options={statusOptions}
            placeholder="Select status"
          />
        </FormField>
        <FormField label="Start Date">
          <DatePicker
            value={formValues.startDate || ""}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, startDate: detail.value })
            }
            placeholder="MM-DD-YYYY"
          />
        </FormField>
        <FormField label="End Date">
          <DatePicker
            value={formValues.plannedEndDate || ""}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, plannedEndDate: detail.value })
            }
            placeholder="MM-DD-YYYY"
          />
        </FormField>
        <FormField label="Current Enrollment">
          <Input
            value={formValues.currentEnrollment || ""}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, currentEnrollment: detail.value })
            }
          />
        </FormField>
        <FormField label="Target Enrollment">
          <Input
            value={formValues.enrollmentTarget || ""}
            onChange={({ detail }) =>
              setFormValues({ ...formValues, enrollmentTarget: detail.value })
            }
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  </>
  );
}

export default DashTable;

