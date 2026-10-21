/** Add/remove free-text labels on a task (not pre-defined at project level). */
import { useState } from "react";

function TaskLabelEditor({ labels, onChange, disabled = false, id = "taskLabelInput" }) {
  const [draft, setDraft] = useState("");

  const addLabel = () => {
    const name = draft.trim();
    if (!name || disabled) {
      return;
    }
    const exists = labels.some(
      (item) => item.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...labels, name]);
    setDraft("");
  };

  const removeLabel = (name) => {
    if (disabled) {
      return;
    }
    onChange(labels.filter((item) => item !== name));
  };

  return (
    <div className="task-label-editor">
      <div className="task-label-chips-area">
        {labels.length === 0 ? (
          <span className="small text-muted">
            No labels yet — type a name and click Add.
          </span>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {labels.map((name) => (
              <span
                key={name}
                className="task-label-chip task-label-chip-removable"
              >
                {name}
                {!disabled && (
                  <button
                    type="button"
                    className="task-label-remove"
                    aria-label={`Remove label ${name}`}
                    onClick={() => removeLabel(name)}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
      {!disabled && (
        <div className="task-label-add-row d-flex flex-wrap gap-2 align-items-stretch">
          <input
            id={id}
            type="text"
            className="form-control"
            placeholder="e.g. Bug, Urgent, Design"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLabel();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-brand btn-sm px-3"
            onClick={addLabel}
            disabled={!draft.trim()}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskLabelEditor;
