/** Task priority labels and badge styling. */
export const formatPriority = (priority) => {
  if (!priority) {
    return "Medium";
  }
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export const priorityBadgeClass = (priority) => {
  switch (priority) {
    case "critical":
      return "text-bg-danger";
    case "high":
      return "text-bg-warning";
    case "low":
      return "text-bg-secondary";
    default:
      return "text-bg-light border";
  }
};

export const priorityPillClass = (priority) => {
  switch (priority) {
    case "critical":
      return "priority-pill priority-critical";
    case "high":
      return "priority-pill priority-high";
    case "low":
      return "priority-pill priority-low";
    default:
      return "priority-pill priority-medium";
  }
};
