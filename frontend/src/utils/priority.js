export const formatPriority = (priority) => {
  if (!priority) {
    return "Medium";
  }
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};
