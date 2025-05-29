import { React, useState } from 'react';
import { Header, SpaceBetween } from '@cloudscape-design/components';
// Components
import FileDrop from '../components/FileDrop/FileDrop';
import UploadedView from '../components/UploadedView/UploadedView';

function UploadFile() {
  const [uploadedData, setUploadedData] = useState([]);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <SpaceBetween size="s">
        <FileDrop setUploadedData={setUploadedData}/>
        <UploadedView uploadedStudies={uploadedData}/>
      </SpaceBetween>
    </div>
  );
}

export default UploadFile;
