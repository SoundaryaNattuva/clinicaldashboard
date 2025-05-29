import { useState } from "react";
import { FileInput, SpaceBetween, Table, Button, Alert, Header, Box, Modal} from "@cloudscape-design/components";

function FileDrop ({ setUploadedData }) {
  const [file, setFile] = useState([]);
  const [error, setError] = useState(null); 
  const [duplicateStudies, setDuplicateStudies] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) {
      setError("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file[0]); // key must match FastAPI param
  
    try {
      const response = await fetch("https://9fvzur3xx3.execute-api.us-east-1.amazonaws.com/Stage/upload-excel/", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.detail || "Upload failed.");
      }

      const result = await response.json();
      const addedStudies = result.added || [];
      
      setUploadedData(prev => {
        const existingIds = new Set(prev.map(s => s.studyId));
        const newStudies = addedStudies.filter(s => !existingIds.has(s.studyId));
        return [...prev, ...newStudies];
      });

      console.log("Duplicates returned: ", JSON.stringify(result.duplicates))

      if (result.duplicates?.length) {
        setDuplicateStudies(result.duplicates);
        setShowDuplicateModal(true);
      } else {
        // ✅ Show message if all were unique
        if (addedStudies.length > 0) {
          setSuccessMessage("Studies successfully added.");
        } else {
          setSuccessMessage("No new studies added.");
        }
      }
      console.log(result);
      setError(null);
    } catch (err) {
      let errorMessage = "Something went wrong during upload.";
      if (err instanceof Error && err.message) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err.detail) {
        errorMessage = err.detail;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      setError(errorMessage);
    }
  };

  const handleSkipDuplicates = () => {
    setShowDuplicateModal(false);
    setDuplicateStudies([]);
    setUploadedData(prev => {
      if (prev.length > 0) {
        setSuccessMessage("Studies successfully added.");
      } else {
        setSuccessMessage("No new studies added. All entries were duplicates.");
      }
      return prev;
    });
  };
  
  const handleOverrideDuplicates = async () => {
    console.log("Sending to backend:", JSON.stringify(duplicateStudies, null, 2));
    try {
      const response = await fetch("https://9fvzur3xx3.execute-api.us-east-1.amazonaws.com/Stage/override-duplicates/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateStudies),
      });

      const result = await response.json();
      
      const updated = result.updated || [];

      if (Array.isArray(updated)) {
        setUploadedData(prev => {
          const existingIds = new Set(prev.map(s => s.studyId));
          const newMerged = result.updated.filter(s => !existingIds.has(s.studyId));
          const finalData = [...prev, ...newMerged];

        setTimeout(() => {
          if (finalData.length > 0) {
            setSuccessMessage("Studies successfully added.");
          } else {
            setSuccessMessage("No new studies added.");
          }
        }, 0);
          return finalData;
        });
        
      } else {
        console.error("Expected an array for result.updated:", result.updated);
      }

      setShowDuplicateModal(false);
      setDuplicateStudies([]);
    } catch (err) {
      console.error("Failed to override duplicates", err);
      setError("Failed to override duplicates.");
    }
  };
  
  return (
    <SpaceBetween size="s">
      <Header variant="h1">Upload File</Header>
      <SpaceBetween size="xxs" direction="vertical">
      <FileInput
        onChange={({ detail }) => setFile(detail.value)}
        value={file}
      >
        Choose file
      </FileInput>
      <Box variant="p" color="text-body-secondary" fontSize="body-s">
        Accepted format: .xlsx | Max size: 5MB
      </Box>
    </SpaceBetween>
      <Table
        items={file}
        columnDefinitions={[
          {
            id: "name",
            header: "File name",
            cell: file => file.name
          },
          {
            id: "size",
            header: "File size",
            cell: file => file.size / 1000 + "KB"
          }
        ]}
        empty="No files"
      />
    <Button variant="primary" onClick={() => handleFileUpload(file)}>
      Upload File
    </Button>
    {error && (
    <Alert type="error">
      {error}
    </Alert>
    )}
    {successMessage && (
    <Alert type="success" dismissible onDismiss={() => setSuccessMessage(null)}>
      {successMessage}
    </Alert>
)}
    <Modal
      visible={showDuplicateModal}
      onDismiss={() => setShowDuplicateModal(false)}
      header="Duplicate Studies Found"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setShowDuplicateModal(false)}>Cancel</Button>
            <Button onClick={handleSkipDuplicates}>Skip Duplicates</Button>
            <Button variant="primary" onClick={handleOverrideDuplicates}>
              Override Duplicates
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Box margin={{ bottom: "m" }}>
        <p>The following study IDs already exist. What would you like to do?</p>
      </Box>
      <ul>
        {duplicateStudies.map((study) => (
          <li key={study.studyId}>
            <strong>{study.studyId}</strong> — {study.title}
          </li>
        ))}
      </ul>
    </Modal>
    </SpaceBetween>
  );
}

export default FileDrop;