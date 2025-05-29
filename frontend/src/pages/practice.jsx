// Relevant snippet from AllStudies.jsx (simplified to show the integration clearly)

import React, { useEffect, useState } from 'react';
import {
  Table,
  CollectionPreferences,
  Header,
  Pagination,
  PropertyFilter,
  Box,
  SpaceBetween,
  Button
} from '@cloudscape-design/components';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

function AllStudies() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ tokens: [], filteringText: '' });
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

  const defaultContentDisplay = [
    { id: 'actions', label: 'Actions', alwaysVisible: true },
    { id: 'insightTag', label: 'Insight' },
    { id: 'studyId', label: 'Study ID' },
    { id: 'title', label: 'Title' },
    { id: 'phase', label: 'Phase' },
    { id: 'status', label: 'Status' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'plannedEndDate', label: 'Planned End Date' },
    { id: 'progressBar', label: 'Progress' }
  ];

  const [preferences, setPreferences] = useState({
    pageSize: 10,
    wrapLines: false,
    contentDisplay: defaultContentDisplay
  });

  useEffect(() => {
    // Fetch data from API (replace with your actual API call)
    async function fetchData() {
      const response = await fetch('http://localhost:8000/studies');
      const data = await response.json();
      setStudies(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const columnDefinitions = [
    {
      id: 'studyId',
      header: 'Study ID',
      cell: item => item.studyId,
      sortingField: 'studyId'
    },
    {
      id: 'title',
      header: 'Title',
      cell: item => item.title,
      sortingField: 'title'
    },
    {
      id: 'phase',
      header: 'Phase',
      cell: item => item.phase,
      sortingField: 'phase'
    },
    {
      id: 'status',
      header: 'Status',
      cell: item => item.status,
      sortingField: 'status'
    },
    {
      id: 'startDate',
      header: 'Start Date',
      cell: item => item.startDate,
      sortingField: 'startDate'
    },
    {
      id: 'plannedEndDate',
      header: 'Planned End Date',
      cell: item => item.plannedEndDate,
      sortingField: 'plannedEndDate'
    }
    // Add more as needed...
  ];

  const columnDisplayConfig = preferences.contentDisplay.map(({ id, visible }) => ({
    id,
    visible: visible !== false
  }));

  const handleExport = () => {
    const visibleColumnIds = preferences.contentDisplay
      .filter(col => col.visible !== false)
      .map(col => col.id);

    const trimmedData = studies.map(study =>
      Object.fromEntries(
        Object.entries(study).filter(([key]) => visibleColumnIds.includes(key))
      )
    );

    const worksheet = XLSX.utils.json_to_sheet(trimmedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredStudies');
    XLSX.writeFile(workbook, 'filtered_studies.xlsx');
  };

  return (
    <Table
      items={studies}
      loading={loading}
      columnDefinitions={columnDefinitions}
      columnDisplay={columnDisplayConfig}
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Apply"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail)}
          pageSizePreference={{
            title: 'Page size',
            options: [
              { value: 10, label: '10 rows' },
              { value: 20, label: '20 rows' },
              { value: 50, label: '50 rows' }
            ]
          }}
          wrapLinesPreference={{ label: 'Wrap lines', description: 'Wrap text in table cells.' }}
          contentDisplayPreference={{
            title: 'Visible columns',
            options: defaultContentDisplay
          }}
        />
      }
      header={
        <Header
          variant="h1"
          actions={
            <Button onClick={handleExport} icon={<Download size={16} />}>
              Export
            </Button>
          }
        >
          Study Management
        </Header>
      }
      pagination={
        <Pagination
          currentPageIndex={currentPageIndex}
          onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
          pagesCount={Math.ceil(studies.length / preferences.pageSize)}
        />
      }
      stickyHeader
    />
  );
}

export default AllStudies;
