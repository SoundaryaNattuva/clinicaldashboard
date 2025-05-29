import React, { useEffect, useState, useMemo } from 'react';
import {Table, Header, PropertyFilter, Pagination, ProgressBar, Box, SpaceBetween, Button, Modal, FormField, Input, Select, DatePicker, CollectionPreferences} from '@cloudscape-design/components';
import { SquarePen, BookX, CircleCheck, Loader, ShieldAlert, Rocket, BellElectric, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

function AllStudies() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('studyId');
  const [isDescending, setIsDescending] = useState(false);
  const [query, setQuery] = useState({ tokens: [], filteringText: '' });
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [editingStudy, setEditingStudy] = useState(null);
  const [formValues, setFormValues] = useState({});
  const defaultContentDisplay = [
    { id: "actions", label: "Actions", alwaysVisible: true },
    { id: "insightTag", label: "Insight", visible: true },
    { id: "studyId", label: "Study ID", visible: true },
    { id: "title", label: "Title", visible: true },
    { id: "phase", label: "Phase", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "startDate", label: "Start Date", visible: true },
    { id: "plannedEndDate", label: "Planned End Date", visible: true },
    { id: "progressBar", label: "Progress", visible: true }
  ];
  const [preferences, setPreferences] = useState({
    pageSize: 10,
    wrapLines: false,
    contentDisplay: defaultContentDisplay,
  });

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const response = await fetch('http://localhost:8000/studies');
        const data = await response.json();
        const cleanedData = data.map(study => {
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
            progressBar: `${current}/${target}`,
            currentEnrollment: current,
            enrollmentTarget: target,
            insightTag,
            startDate: study.startDate
              ? new Date(study.startDate).toISOString().slice(0, 10)
              : '',
          };
        });
        setStudies(cleanedData);
      } catch (error) {
        console.error('Failed to fetch studies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudies();
  }, []);
  
  const generateFilteringOptions = (data, fields) => {
    const options = [];
    const phaseOrder = {
      "Phase 1": 1,
      "Phase 2": 2,
      "Phase 3": 3,
      "Phase 4": 4,
    };

  fields.forEach(field => {
    let values = Array.from(new Set(data.map(item => item[field]).filter(Boolean)));
    if (field === "phase") {
      values.sort((a, b) => (phaseOrder[a] || 99) - (phaseOrder[b] || 99));
    } else {
      values.sort(); // alphabetical for other fields
    }
    for (const value of values) {
      options.push({
        propertyKey: field,
        value: value,
        label: String(value),
      });
    }
  });
  
    return options;
  };

  const filteringOptions = useMemo(() => {
    return generateFilteringOptions(studies, ['phase', 'status', 'insightTag']);
  }, [studies]);

  const filteringProperties = [
    {
      key: 'insightTag',
      propertyLabel: 'Insight',
      operators: ['=', ':'],
      groupValuesLabel: 'All Insights'
    },
    {
      key: 'studyId',
      propertyLabel: 'Study ID',
      operators: ['=', ':'],
    },
    {
      key: 'title',
      propertyLabel: 'Title',
      operators: [':']
    },
    {
      key: 'phase',
      propertyLabel: 'Phase',
      operators: ['=', '!='],
      groupValuesLabel: 'All Phases'
    },
    {
      key: 'status',
      propertyLabel: 'Status',
      operators: ['=', '!='],
      groupValuesLabel: 'All Statuses'
    },
    {
      key: 'startDate',
      propertyLabel: 'Start Date',
      operators: ['=', '!=', '<', '<=', '>', '>='],
      groupValuesLabel: 'Start Date'
    },
    {
      key: 'plannedEndDate',
      propertyLabel: 'Planned End Date',
      operators: ['=', '!=', '<', '<=', '>', '>='],
      groupValuesLabel: 'Planned End Date'
    },
    {
      key: 'progress',
      propertyLabel: 'Progress',
      operators: ['=', '!=', '<', '<=', '>', '>='],
      groupValuesLabel: 'All Progress'
    },

  ];

  // Filter using PropertyFilter
  const applyPropertyFilter = (items, query) => {
    const groupedTokens = query.tokens.reduce((acc, token) => {
      const { propertyKey } = token;
      if (!acc[propertyKey]) acc[propertyKey] = [];
      acc[propertyKey].push(token);
      return acc;
    }, {});
  
    const matchesTokenGroup = (item, tokens) => {
      return tokens.some(token => {
        const { propertyKey, value: tokenValue, operator } = token;
        const itemValueRaw = item[propertyKey];
        const tokenValueLower = String(tokenValue).toLowerCase();
  
        const isDate = ["startDate", "plannedEndDate"].includes(propertyKey);
        const itemValue = String(itemValueRaw || '').toLowerCase();
  
        switch (operator) {
          case '=':
            return isDate
              ? new Date(itemValueRaw).toISOString().slice(0, 10) === tokenValueLower
              : itemValue === tokenValueLower;
          case '!=':
            return isDate
              ? new Date(itemValueRaw).toISOString().slice(0, 10) !== tokenValueLower
              : itemValue !== tokenValueLower;
          case '>':
            return isDate
              ? new Date(itemValueRaw) > new Date(tokenValueLower)
              : itemValue > tokenValueLower;
          case '>=':
            return isDate
              ? new Date(itemValueRaw) >= new Date(tokenValueLower)
              : itemValue >= tokenValueLower;
          case '<':
            return isDate
              ? new Date(itemValueRaw) < new Date(tokenValueLower)
              : itemValue < tokenValueLower;
          case '<=':
            return isDate
              ? new Date(itemValueRaw) <= new Date(tokenValueLower)
              : itemValue <= tokenValueLower;
          case ':':
            return itemValue.includes(tokenValueLower);
          default:
            return true;
        }
      });
    };
  
    return items.filter(item => {
      // Every field group must match (AND logic between different fields)
      const allFieldGroupsMatch = Object.values(groupedTokens).every(tokens =>
        matchesTokenGroup(item, tokens)
      );
  
      // Optional: free text filtering
      const matchesFreeText = query.filteringText
        ? Object.values(item).some(val =>
            String(val).toLowerCase().includes(query.filteringText.toLowerCase())
          )
        : true;
  
      return allFieldGroupsMatch && matchesFreeText;
    });
  };
  
  
  
  
  const filteredStudies = applyPropertyFilter(studies, query);

  const columnDefinitions = [
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
      id: 'insightTag',
      header: 'Insight',
      sortingField: 'insightTag',
      width: 160,         // Set a fixed width (in pixels)
      minWidth: 140,      // Prevent it from shrinking below this width
      cell: item => {
        const iconMap = {
          "Completed": <CircleCheck size={18} color="#59c133" />,
          "Exceeded": <Rocket size={18} color="#59c133" strokeWidth={0.85} absoluteStrokeWidth />,
          "Under Target": <ShieldAlert size={18} color="#e18c20" absoluteStrokeWidth />,
          "At Risk": <BellElectric size={20} color="#e12020" strokeWidth={1} absoluteStrokeWidth />,
          "On Track": <Loader size={18} color="#5856e4" absoluteStrokeWidth />
        };
    
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {iconMap[item.insightTag]}
            {item.insightTag}
          </span>
        );
      }
    },
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
      cell: item => {
        return new Date(item.startDate).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
      },
      sortingField: 'startDate'
    },
    {
      id: 'plannedEndDate',
      header: 'Planned End Date',
      cell: item => { 
        return new Date(item.plannedEndDate).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    },
      sortingField: 'plannedEndDate'
    },
    {
      id: 'progressBar',
      header: 'Progress',
      sortingField: 'progress',
      minWidth: 150,
      cell: item => {
        const percent = item.progress;
        const current = item.currentEnrollment;
        const target = item.enrollmentTarget;
        return (
          <ProgressBar
            value={percent}
            label={`${current}/${target}`}
            status={
              item.status === "Completed" ? "success"
              : percent === 100 ? "success"
              : percent < 100 && percent > 0 ? "in-progress"
              : percent > 100 ? "success"
              : "error"
            }
          />
        );
      },
    },
  ]

  const columnDisplayConfig = preferences.contentDisplay.map(({ id, visible }) => ({
    id,
    visible: visible !== false  // default to true if not explicitly false
  }));
  
  
  // Sort the filtered results
  const sortedStudies = [...filteredStudies].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle null or undefined gracefully
    if (aValue == null) return isDescending ? 1 : -1;
    if (bValue == null) return isDescending ? -1 : 1;

    // Compare
    if (aValue < bValue) return isDescending ? 1 : -1;
    if (aValue > bValue) return isDescending ? -1 : 1;
    return 0;
  });

  const paginatedItems = sortedStudies.slice(
    (currentPageIndex - 1) * preferences.pageSize,
    currentPageIndex * preferences.pageSize
  );

  const handleClientSideExport = () => {
    const visibleColumnIdsInOrder = preferences.contentDisplay
    .filter(col => col.visible !== false)
    .map(col => col.id);
  
  // Reorder each row to match the column order
  const trimmedData = filteredStudies.map(study =>
    Object.fromEntries(
      visibleColumnIdsInOrder.map(id => [id, study[id]])
    )
  );
  
    const worksheet = XLSX.utils.json_to_sheet(trimmedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredStudies');
    XLSX.writeFile(workbook, 'filtered_studies.xlsx');
  };
  
  const handleEdit = (study) => {
    setEditingStudy(study);
    setFormValues({ ...study });
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
      setStudies((prev) =>
        prev.map((s) => (s.studyId === updatedWithFields.studyId ? updatedWithFields : s))
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
      progressBar: `${current}/${target}`,
      currentEnrollment: current,
      enrollmentTarget: target,
      insightTag,
      startDate: study.startDate
        ? new Date(study.startDate).toISOString().slice(0, 10)
        : '',
    };
  }
  
  const handleDelete = async (studyId) => {
    if (!window.confirm(`Are you sure you want to delete study ID: ${studyId}?`)) return;
  
    try {
      const res = await fetch(`http://localhost:8000/studies/${studyId}`, {
        method: "DELETE"
      });
  
      if (!res.ok) throw new Error("Failed to delete study");
  
      // Refresh the list (re-fetch or remove from state)
      setStudies(prev => prev.filter(s => s.studyId !== studyId));
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

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
  
  
  return (
  <>
    <Table
      trackBy="studyId"
      items={paginatedItems}
      loading={loading}
      loadingText="Loading studies..."
      resizableColumns
      empty="No studies found"
      columnDefinitions={columnDefinitions}
      columnDisplay={columnDisplayConfig}
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail)}
          pageSizePreference={{
            title: "Page size",
            options: [
              { value: 10, label: "10 resources" },
              { value: 20, label: "20 resources" },
              { value: 50, label: "50 resources" }
            ]
          }}
          contentDisplayPreference={{
            title: "Select visible columns",
            options: defaultContentDisplay
          }}
        />
      }      
      header={
        <SpaceBetween size="xs">
          <Header variant="h1"
              actions={
                <Button onClick={handleClientSideExport}>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Download size={16} />
                    Export Data
                  </SpaceBetween>
                </Button>
              }
          >Study Management</Header>
          <Box variant="p" color="text-body-secondary">
            View and manage all studies, including enrollment progress and key study metadata.
          </Box>
        </SpaceBetween>
      }      
      pagination={
        <Pagination
          currentPageIndex={currentPageIndex}
          onChange={({ detail }) =>
            setCurrentPageIndex(detail.currentPageIndex)
          }
          pagesCount={Math.ceil(sortedStudies.length / preferences.pageSize)}
        />}
      sortingColumn={{ sortingField: sortField }}
      sortingDescending={isDescending}
      onSortingChange={({ detail }) => {
        setSortField(detail.sortingColumn.sortingField);
        setIsDescending(detail.isDescending);
      }}
      filter={
        <PropertyFilter
          query={query}
          onChange={({ detail }) => setQuery(detail)}
          filteringPlaceholder="Find by any field"
          filteringProperties={filteringProperties}
          filteringOptions={filteringOptions}
        />
      }
      stickyHeader
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

export default AllStudies;
