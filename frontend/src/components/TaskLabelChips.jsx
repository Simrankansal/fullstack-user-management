/** Renders project task label badges. */
function TaskLabelChips({ labels, className = "" }) {
  if (!labels?.length) {
    return null;
  }

  return (
    <div className={`d-flex flex-wrap gap-1 ${className}`}>
      {labels.map((label) => {
        const id = label._id || label;
        const name = label.name || "Label";
        const color = label.color || "#6c757d";
        return (
          <span
            key={String(id)}
            className="task-label-chip"
            style={{ backgroundColor: color }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}

export default TaskLabelChips;
