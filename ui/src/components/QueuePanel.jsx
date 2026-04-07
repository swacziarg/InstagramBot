function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function QueuePanel({ tasks, onComplete, isCompleting }) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <div className="eyebrow">Pacing queue</div>
          <h2>Manual tasks</h2>
        </div>
        <span className="pill">{tasks.length} total</span>
      </div>

      <div className="queue-list">
        {tasks.map((task) => (
          <article key={task.id} className="queue-card">
            <div className="queue-card-header">
              <strong>@{task.influencer_username}</strong>
              <span className={`status status-${task.status}`}>{task.status}</span>
            </div>
            <p>{task.action.replaceAll("_", " ")}</p>
            <p>Scheduled: {formatDate(task.scheduled_for)}</p>
            {task.notes ? <p>Notes: {task.notes}</p> : null}
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              disabled={task.status === "completed" || isCompleting}
            >
              {task.status === "completed" ? "Completed" : "Mark complete"}
            </button>
          </article>
        ))}

        {tasks.length === 0 ? (
          <div className="empty-card">No queued tasks yet.</div>
        ) : null}
      </div>
    </section>
  );
}

