import { useState } from "react";

const ACTION_OPTIONS = [
  { value: "all", label: "All task types" },
  { value: "review_profile", label: "Profile review" },
  { value: "draft_outreach", label: "Outreach draft" },
  { value: "manual_follow_up", label: "Manual follow-up" },
];

const STATUS_OPTIONS = [
  { value: "queued", label: "Queued" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
];

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function formatLabel(value) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function QueuePanel({ tasks, onStatusChange, activeTaskId }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const filteredTasks = [...tasks]
    .sort(
      (left, right) =>
        Date.parse(left.scheduled_for) - Date.parse(right.scheduled_for),
    )
    .filter((task) => {
      const normalizedQuery = query.trim().toLowerCase();

      if (
        normalizedQuery &&
        !task.influencer_username.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      if (actionFilter !== "all" && task.action !== actionFilter) {
        return false;
      }

      return true;
    });

  const queuedCount = tasks.filter((task) => task.status === "queued").length;
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const emptyMessage =
    tasks.length === 0
      ? "No queued tasks yet."
      : "No tasks match the current filters.";

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setActionFilter("all");
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <div className="eyebrow">Pacing queue</div>
          <h2>Manual tasks</h2>
        </div>
        <div className="header-pills">
          <span className="pill">{filteredTasks.length} shown</span>
          <span className="pill pill-neutral">{readyCount} ready</span>
        </div>
      </div>

      <p className="section-subcopy">
        Filter scheduled work, surface what is ready now, and adjust task status
        inline as manual review moves forward.
      </p>

      <div className="filter-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by username"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Any status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
        >
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-button" onClick={clearFilters}>
          Reset filters
        </button>
      </div>

      <div className="stats-strip">
        <div className="stat-tile">
          <span>Queued</span>
          <strong>{queuedCount}</strong>
        </div>
        <div className="stat-tile">
          <span>Ready</span>
          <strong>{readyCount}</strong>
        </div>
        <div className="stat-tile">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="queue-list">
        {filteredTasks.map((task) => {
          const isUpdating = activeTaskId === task.id;

          return (
            <article key={task.id} className="queue-card">
              <div className="queue-card-header">
                <div>
                  <strong>@{task.influencer_username}</strong>
                  <div className="table-meta">{formatLabel(task.action)}</div>
                </div>
                <span className={`status status-${task.status}`}>
                  {formatLabel(task.status)}
                </span>
              </div>

              <p>Scheduled: {formatDate(task.scheduled_for)}</p>
              <p className="table-meta">Delay: {task.delay_seconds}s</p>
              {task.notes ? <p>Notes: {task.notes}</p> : null}

              <div
                className="status-toggle"
                role="group"
                aria-label={`Status controls for @${task.influencer_username}`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`toggle-chip${
                      option.value === task.status ? " toggle-chip-active" : ""
                    }`}
                    onClick={() => onStatusChange(task.id, option.value)}
                    disabled={isUpdating || option.value === task.status}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {isUpdating ? (
                <div className="table-meta">Updating task status...</div>
              ) : null}
            </article>
          );
        })}

        {filteredTasks.length === 0 ? (
          <div className="empty-card">{emptyMessage}</div>
        ) : null}
      </div>
    </section>
  );
}
