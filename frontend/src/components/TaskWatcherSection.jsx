/** Watchers list + multi-add picker for task detail. */
import { useMemo, useState } from "react";

function userInitials(name) {
  if (!name || typeof name !== "string") {
    return "?";
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function TaskWatcherSection({
  watchers,
  members,
  canManage,
  currentUserId,
  adding,
  onAdd,
  onRemove,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const watchingIds = useMemo(
    () =>
      new Set(
        watchers.map((w) => String(w.user?._id || w.user))
      ),
    [watchers]
  );

  const candidates = useMemo(
    () =>
      members.filter(
        (member) => !watchingIds.has(String(member.user._id))
      ),
    [members, watchingIds]
  );

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return candidates;
    }
    return candidates.filter((member) => {
      const name = (member.user?.name || "").toLowerCase();
      const email = (member.user?.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [candidates, search]);

  const toggleCandidate = (userId) => {
    const id = String(userId);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredCandidates.map((m) => String(m.user._id));
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedIds.length || adding) {
      return;
    }
    await onAdd(selectedIds);
    setSelectedIds([]);
    setSearch("");
  };

  const canRemoveWatcher = (watcherUserId) =>
    canManage || watcherUserId === String(currentUserId);

  return (
    <div className="task-watcher-section">
      <div className="task-watcher-current">
        <p className="task-watcher-label">Watching this task</p>
        {watchers.length === 0 ? (
          <p className="text-muted small mb-0">No one is watching yet.</p>
        ) : (
          <ul className="task-watcher-chip-list" aria-label="Current watchers">
            {watchers.map((w) => {
              const watcherUserId = String(w.user?._id || w.user);
              const name = w.user?.name || "User";
              const removable = canRemoveWatcher(watcherUserId);
              return (
                <li key={w._id}>
                  <span className="task-watcher-chip">
                    <span className="task-watcher-chip-avatar" aria-hidden="true">
                      {userInitials(name)}
                    </span>
                    <span className="task-watcher-chip-name">{name}</span>
                    {removable && (
                      <button
                        type="button"
                        className="task-watcher-chip-remove"
                        aria-label={`Remove ${name} from watchers`}
                        onClick={() => onRemove(watcherUserId)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canManage && (
        <form className="task-watcher-add" onSubmit={handleSubmit}>
          <p className="task-watcher-label">Add watchers</p>
          {candidates.length === 0 ? (
            <p className="text-muted small mb-0">
              Every project member is already watching.
            </p>
          ) : (
            <>
              <input
                type="search"
                className="form-control form-control-sm task-watcher-search"
                placeholder="Search by name or email…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={adding}
                aria-label="Search members to add as watchers"
              />
              <div className="task-watcher-picker-toolbar">
                <button
                  type="button"
                  className="btn btn-link btn-sm task-watcher-link-btn"
                  onClick={selectAllFiltered}
                  disabled={adding || filteredCandidates.length === 0}
                >
                  Select all shown
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm task-watcher-link-btn"
                  onClick={clearSelection}
                  disabled={adding || selectedIds.length === 0}
                >
                  Clear
                </button>
              </div>
              <div className="member-picker task-watcher-picker border rounded">
                {filteredCandidates.length === 0 ? (
                  <p className="text-muted small mb-0 p-2">No members match.</p>
                ) : (
                  filteredCandidates.map((member) => {
                    const id = String(member.user._id);
                    return (
                      <label
                        key={id}
                        className={`task-watcher-picker-row ${
                          selectedIds.includes(id)
                            ? "task-watcher-picker-row--selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleCandidate(id)}
                          disabled={adding}
                        />
                        <span className="task-watcher-picker-avatar" aria-hidden="true">
                          {userInitials(member.user.name)}
                        </span>
                        <span className="task-watcher-picker-text">
                          <span className="task-watcher-picker-name">
                            {member.user.name}
                          </span>
                          {member.user.email && (
                            <span className="task-watcher-picker-email">
                              {member.user.email}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="task-watcher-add-actions">
                <button
                  type="submit"
                  className="btn btn-brand btn-sm"
                  disabled={!selectedIds.length || adding}
                >
                  {adding
                    ? "Adding…"
                    : selectedIds.length === 1
                      ? "Add 1 watcher"
                      : `Add ${selectedIds.length} watchers`}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default TaskWatcherSection;
