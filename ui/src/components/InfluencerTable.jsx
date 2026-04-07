function formatFollowers(value) {
  return new Intl.NumberFormat().format(value);
}

export default function InfluencerTable({
  influencers,
  selectedUsernames,
  onToggleUser,
  queueAction,
  onQueueActionChange,
  queueNotes,
  onQueueNotesChange,
  onQueueSelected,
  isQueueing,
}) {
  const selectedCount = selectedUsernames.length;

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <div className="eyebrow">Results</div>
          <h2>Influencers</h2>
        </div>
        <span className="pill">{influencers.length} loaded</span>
      </div>

      <div className="queue-controls">
        <select
          value={queueAction}
          onChange={(event) => onQueueActionChange(event.target.value)}
        >
          <option value="review_profile">Queue profile review</option>
          <option value="draft_outreach">Queue outreach draft</option>
          <option value="manual_follow_up">Queue manual follow-up</option>
        </select>
        <input
          value={queueNotes}
          onChange={(event) => onQueueNotesChange(event.target.value)}
          placeholder="Optional notes for the operator"
        />
        <button
          type="button"
          onClick={onQueueSelected}
          disabled={selectedCount === 0 || isQueueing}
        >
          {isQueueing ? "Queueing..." : `Queue ${selectedCount} selected`}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Username</th>
              <th>Followers</th>
              <th>Niche</th>
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {influencers.map((influencer) => {
              const checked = selectedUsernames.includes(influencer.username);
              return (
                <tr key={influencer.username}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleUser(influencer.username)}
                    />
                  </td>
                  <td>@{influencer.username}</td>
                  <td>{formatFollowers(influencer.followers_count)}</td>
                  <td>{influencer.niche}</td>
                  <td>
                    <a
                      href={influencer.profile_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open profile
                    </a>
                  </td>
                </tr>
              );
            })}
            {influencers.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Run a niche search to populate the workspace.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

