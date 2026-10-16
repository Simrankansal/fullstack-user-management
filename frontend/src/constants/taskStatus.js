export const TASK_COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "completed", label: "Completed" },
];

export const formatStatus = (status) => {
  const column = TASK_COLUMNS.find((item) => item.key === status);
  return column ? column.label : status;
};
