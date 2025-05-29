import * as React from "react";
import { useState } from "react";
import { Form, SpaceBetween, Button, Container, Header, FormField, Input, Select, DatePicker, Flashbar, Box } from "@cloudscape-design/components";


function AddStudy(){
  const [formValues,setFormValues] = useState({});
  const [alert, setAlert] = useState(null);

  const handleSubmit = async () => {
    const requiredFields = ["studyId", "title", "phase", "status", "enrollmentTarget", "currentEnrollment", "startDate", "plannedEndDate"];
    const fieldLabels = {
      studyId: "Study ID",
      title: "Title",
      phase: "Phase",
      status: "Status",
      enrollmentTarget: "Enrollment Target",
      currentEnrollment: "Current Enrollment",
      startDate: "Start Date",
      plannedEndDate: "Planned End Date"
    };

    const missingFields = requiredFields.filter(field => !formValues[field]);

    if (missingFields.length > 0) {
      const friendlyNames = missingFields.map(field => fieldLabels[field]);
      setAlert({
        type: "error",
        content: `Please fill out the following required field(s): ${friendlyNames.join(", ")}`,
        dismissible: true,
        id: "missing-fields-alert"
      });
      return;
    }
    
    if (new Date(formValues.startDate) > new Date(formValues.plannedEndDate)) {
      alert("Start date must be before the planned end date.");
      return;
    }

    try {
      console.log("form values before submission", formValues)
      const payload = {
        ...formValues,
        enrollmentTarget: Number(formValues.enrollmentTarget),
        currentEnrollment: Number(formValues.currentEnrollment),
      };

      const response = await fetch("https://9fvzur3xx3.execute-api.us-east-1.amazonaws.com/Stage/studies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit study.");
      }
  
      const result = await response.json();
      console.log("Study added:", result);

      setAlert({
        type: "success",
        content: "Study successfully added!",
        dismissible: true,
        id: "success-alert"
      });
  
    } catch (error) {
      console.error("Error submitting form:", error.message);
      setAlert({
        type: "error",
        content: `Error: ${error.message}`,
        dismissible: true,
        id: "error-alert"
      });
    }
  };

  return(
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <form onSubmit={e => {
        e.preventDefault();
        handleSubmit();
      }}>

      {alert && (
        <Flashbar
          items={[{ ...alert, onDismiss: () => setAlert(null), icon: null}]}
        />
      )}

        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" variant="link">
                Cancel
              </Button>
              <Button variant="primary" type="submit" >Submit</Button>
            </SpaceBetween>
          }
          header={
            <Header variant="h1">
              Create a New Study Record
              <Box variant="p" color="text-body-secondary">
                Use this form to add a new study to the system. Accurate entry of enrollment and timeline data will ensure your dashboards stay up to date.
              </Box>
            </Header>
          }          
        >
          <Container
            header={
              <Header variant="h2">
                Study Information
              </Header>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              <FormField label="Study ID">
                <Input 
                  value={formValues.studyId || ""}
                  onChange={({ detail }) =>
                    setFormValues({ ...formValues, studyId: detail.value })
                  }
                />
              </FormField>
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
                  selectedOption={formValues.phase ? { label: formValues.phase, value: formValues.phase } : null}
                  onChange={({ detail }) =>
                    setFormValues({ ...formValues, phase: detail.selectedOption.value })
                  }
                  options={[
                    { label: "Phase 1", value: "Phase 1" },
                    { label: "Phase 2", value: "Phase 2" },
                    { label: "Phase 3", value: "Phase 3" },
                    { label: "Phase 4", value: "Phase 4" }
                  ]}
                  placeholder="Select a phase"
                />
              </FormField>
              <FormField label="Status">
                <Select
                  selectedOption={formValues.status ? { label: formValues.status, value: formValues.status } : null}
                  onChange={({ detail }) =>
                    setFormValues({ ...formValues, status: detail.selectedOption.value })
                  }
                  options={[
                    { label: "Completed", value: "Completed" },
                    { label: "Not Yet Recruiting", value: "Not Yet Recruiting" },
                    { label: "Recruiting", value: "Recruiting" }
                  ]}
                  placeholder="Select a Status"
                />
              </FormField>
              <FormField label="Current Enrollment">
              <Input
                type="number"
                value={formValues.currentEnrollment || ""}
                inputMode="numeric"
                min={0}
                step={1}
                onChange={({ detail }) => {
                  const value = detail.value;
                  if (/^\d*$/.test(value)) {
                    setFormValues({ ...formValues, currentEnrollment: value });
                  }
                }}
              />
              </FormField>
              <FormField label="Enrollment Target">
              <Input
                type="number"
                value={formValues.enrollmentTarget || ""}
                inputMode="numeric"
                min={0}
                step={1}
                onChange={({ detail }) => {
                  const value = detail.value;
                  if (/^\d*$/.test(value)) {
                    setFormValues({ ...formValues, enrollmentTarget: value });
                  }
                }}
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
              <FormField label="Planned End Date">
                <DatePicker
                  value={formValues.plannedEndDate || ""}
                  onChange={({ detail }) =>
                    setFormValues({ ...formValues, plannedEndDate: detail.value })
                  }
                  placeholder="MM-DD-YYYY"
                />
              </FormField>
            </SpaceBetween>
          </Container>
        </Form>
      </form>
    </div>
  );
}

export default AddStudy