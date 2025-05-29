import { Table, Box, SpaceBetween, Button, TextFilter, Header, Pagination, Modal, FormField, Input, Select, DatePicker} from "@cloudscape-design/components";
import { SquarePen, BookX } from 'lucide-react';
import { useState, useEffect } from 'react'

function UploadedView({uploadedStudies}) {
  const [localStudies, setLocalStudies] = useState([]);
  const [editingStudy, setEditingStudy] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [filteringText, setFilteringText] = useState("");

  const phaseOptions = [
    { label: "Phase 1", value: "Phase 1" },
    { label: "Phase 2", value: "Phase 2" },
    { label: "Phase 3", value: "Phase 3" },
    { label: "Phase 4", value: "Phase 4" },
  ];

  const statusOptions = [
    { label: "Recruiting", value: "Recruiting" },
    { label: "Not yet recruiting", value: "Not yet recruiting" },
    { label: "Completed", value: "Completed" },
  ];  

  useEffect(() => {
    setLocalStudies(uploadedStudies);
  }, [uploadedStudies]);

  const handleDelete = async (studyId) => {
    if (!window.confirm(`Are you sure you want to delete study ID: ${studyId}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/studies/${studyId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete study");
      setLocalStudies(prev => prev.filter(s => s.studyId !== studyId));
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  const handleEdit = (study) => {
    setEditingStudy(study);
    setFormValues({ ...study });
    console.log("Received studies:", uploadedStudies);
  };

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
      const updatedWithFields = computeStudyFields(updated);
      
      setLocalStudies((prev) =>
        prev.map((s) => (s.studyId === updatedWithFields.studyId ? updatedWithFields : s)),
        setFormValues({})
      );      
      
      setEditingStudy(null);
    } catch (err) {
      console.error("Update failed:", err.message);
    }
  };
  
  function computeStudyFields(study) {
    const current = Number(study.currentEnrollment);
    const target = Number(study.enrollmentTarget);
    const percent = target > 0 ? (current / target) * 100 : 0;
    const plannedEnd = new Date(study.plannedEndDate);
    const today = new Date();
    const monthsToEnd = (plannedEnd.getFullYear() - today.getFullYear()) * 12 + (plannedEnd.getMonth() - today.getMonth());
  
    let insightTag = "On Track";
    if (study.status === "Completed") {
      insightTag = "Completed";
    } else if (percent > 100) {
      insightTag = "Exceeded";
    } else if (percent < 75 && monthsToEnd <= 6) {
      insightTag = "Under Target";
    } else if (percent < 90 && monthsToEnd <= 3) {
      insightTag = "At Risk";
    }
  
    return {
      ...study,
      progress: percent,
      currentEnrollment: current,
      enrollmentTarget: target,
      insightTag,
      startDate: study.startDate
        ? new Date(study.startDate).toISOString().slice(0, 10)
        : '',
    };
  }

  const filteredStudies = localStudies.filter((study) => {
    const text = filteringText.toLowerCase();
    return (
      study.studyId?.toLowerCase().includes(text) ||
      study.title?.toLowerCase().includes(text) ||
      study.phase?.toLowerCase().includes(text) ||
      study.status?.toLowerCase().includes(text)
    );
  });
  
  
  return (
    <>
    <Table
      trackBy="studyId"
      pagination={
        <Pagination currentPageIndex={1} pagesCount={1} />
      }
      renderAriaLive={({
        firstIndex,
        lastIndex,
        totalItemsCount
      }) =>
        `Displaying items ${firstIndex} to ${lastIndex} of ${totalItemsCount}`
      }
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
          sortingField: "studyId"
        },
        {
          id: "title",
          header: "Title",
          cell: item => item.title,
          sortingField: "title"
        },
        {
          id: "phase",
          header: "Phase",
          cell: item => item.phase,
          sortingField: "phase"
        },
        {
          id: "status",
          header: "Status",
          cell: item => item.status,
          sortingField: "status"
        },
        {
          id: "enrollment",
          header: "Enrollment",
          cell: item => `${item.currentEnrollment}/${item.enrollmentTarget}`
        },
        {
          id: "startDate",
          header: "Start Date",
          cell: item => {
            return item.startDate
              ? new Date(item.startDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit"
                })
              : "";
          }
        },
        {
          id: "plannedEndDate",
          header: "Planned End Date",
          cell: item => {
            return item.plannedEndDate
              ? new Date(item.plannedEndDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit"
                })
              : "";
          }
        }
      ]}
      items={filteredStudies}
      loadingText="Loading resources"
      resizableColumns
      selectedItems={[{ name: "Item 2" }]}
      empty={
        <Box
          margin={{ vertical: "xs" }}
          textAlign="center"
          color="inherit"
        >
          <SpaceBetween size="m">
            <b>No studies imported yet</b>
            <Box variant="p">Please upload a file to view imported data.</Box>
          </SpaceBetween>
        </Box>
      }
      filter={
        <TextFilter
          filteringPlaceholder="Find resources"
          filteringText={filteringText}
          onChange={({ detail }) => setFilteringText(detail.filteringText)}
          countText="0 matches"
        />
      }
      header={
        <SpaceBetween size="xs">
          <Header>Imported Study Data</Header>
          <Box variant="p" color="text-body-secondary">
            The table below lists all studies imported from your file. You may edit or delete any entry as needed.
          </Box>
        </SpaceBetween>
      }
    />
    {editingStudy && (
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
    )}
    </>
  );
}

export default UploadedView