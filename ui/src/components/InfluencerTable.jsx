import { useState } from "react";

const MIN_FOLLOWER_OPTIONS = [
  { value: "all", label: "Any size" },
  { value: "10000", label: "10K+" },
  { value: "50000", label: "50K+" },
  { value: "100000", label: "100K+" },
  { value: "250000", label: "250K+" },
];

const WORKFLOW_OPTIONS = [
  { value: "all", label: "Any workflow state" },
  { value: "not_queued", label: "Not queued" },
  { value: "queued", label: "Queued" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Sort by score" },
  { value: "followers", label: "Sort by followers" },
  { value: "engagement", label: "Sort by engagement" },
  { value: "username", label: "Sort by username" },
];

function formatFollowers(value) {
  return new Intl.NumberFormat().format(value);
}

function formatScore(value) {
  return (value ?? 0).toFixed(1).replace(/\.0$/, "");
}

function formatEngagement(value) {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatLabel(value) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getWorkflowStatus(username, latestTaskByUsername) {
  return latestTaskByUsername[username]?.status ?? "not_queued";
}

function matchesSearch(influencer, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    influencer.username,
    influencer.niche,
    influencer.email ?? "",
    influencer.source ?? "",
    ...(influencer.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function compareInfluencers(left, right, sortBy) {
  if (sortBy === "followers") {
    return (
      right.followers_count - left.followers_count ||
      (right.score ?? 0) - (left.score ?? 0) ||
      left.username.localeCompare(right.username)
    );
  }

  if (sortBy === "engagement") {
    return (
      (right.engagement_rate ?? -1) - (left.engagement_rate ?? -1) ||
      (right.score ?? 0) - (left.score ?? 0) ||
      right.followers_count - left.followers_count ||
      left.username.localeCompare(right.username)
    );
  }

  if (sortBy === "username") {
    return (
      left.username.localeCompare(right.username) ||
      (right.score ?? 0) - (left.score ?? 0)
    );
  }

  return (
    (right.score ?? 0) - (left.score ?? 0) ||
    (right.engagement_rate ?? -1) - (left.engagement_rate ?? -1) ||
    right.followers_count - left.followers_count ||
    left.username.localeCompare(right.username)
  );
}

export default function InfluencerTable({
  influencers,
  selectedUsernames,
  onSelectionChange,
  onToggleUser,
  latestTaskByUsername,
  queueAction,
  onQueueActionChange,
  queueNotes,
  onQueueNotesChange,
  onQueueSelected,
  isQueueing,
}) {
  const [query, setQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [followerFloor, setFollowerFloor] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  const nicheOptions = Array.from(
    new Set(influencers.map((influencer) => influencer.niche)),
  ).sort((left, right) => left.localeCompare(right));

  const filteredInfluencers = influencers.filter((influencer) => {
    const workflowStatus = getWorkflowStatus(
      influencer.username,
      latestTaskByUsername,
    );
    const normalizedQuery = query.trim().toLowerCase();

    if (!matchesSearch(influencer, normalizedQuery)) {
      return false;
    }

    if (nicheFilter !== "all" && influencer.niche !== nicheFilter) {
      return false;
    }

    if (workflowFilter !== "all" && workflowStatus !== workflowFilter) {
      return false;
    }

    if (
      followerFloor !== "all" &&
      influencer.followers_count < Number(followerFloor)
    ) {
      return false;
    }

    if (contactFilter === "with_email" && !influencer.email) {
      return false;
    }

    if (contactFilter === "without_email" && influencer.email) {
      return false;
    }

    return true;
  });

  const sortedInfluencers = [...filteredInfluencers].sort((left, right) =>
    compareInfluencers(left, right, sortBy),
  );
  const filteredUsernames = sortedInfluencers.map(
    (influencer) => influencer.username,
  );
  const selectedVisibleCount = filteredUsernames.filter((username) =>
    selectedUsernames.includes(username),
  ).length;
  const allVisibleSelected =
    filteredUsernames.length > 0 &&
    selectedVisibleCount === filteredUsernames.length;
  const emptyMessage =
    influencers.length === 0
      ? "Run a niche search to populate the workspace."
      : "No influencers match the current filters.";

  function clearFilters() {
    setQuery("");
    setNicheFilter("all");
    setWorkflowFilter("all");
    setFollowerFloor("all");
    setContactFilter("all");
    setSortBy("score");
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <div className="eyebrow">Results</div>
          <h2>Influencers</h2>
        </div>
        <div className="header-pills">
          <span className="pill">{sortedInfluencers.length} shown</span>
          <span className="pill pill-neutral">{selectedUsernames.length} selected</span>
        </div>
      </div>

      <p className="section-subcopy">
        Search the current workspace, filter by audience fit and workflow stage,
        then rank the visible subset before queueing tasks.
      </p>

      <div className="filter-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search username, niche, tags, source, email"
        />
        <select
          value={nicheFilter}
          onChange={(event) => setNicheFilter(event.target.value)}
        >
          <option value="all">All niches</option>
          {nicheOptions.map((niche) => (
            <option key={niche} value={niche}>
              {niche}
            </option>
          ))}
        </select>
        <select
          value={workflowFilter}
          onChange={(event) => setWorkflowFilter(event.target.value)}
        >
          {WORKFLOW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={followerFloor}
          onChange={(event) => setFollowerFloor(event.target.value)}
        >
          {MIN_FOLLOWER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Audience {option.label}
            </option>
          ))}
        </select>
        <select
          value={contactFilter}
          onChange={(event) => setContactFilter(event.target.value)}
        >
          <option value="all">Any contact status</option>
          <option value="with_email">With email</option>
          <option value="without_email">No email</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-button" onClick={clearFilters}>
          Reset filters
        </button>
      </div>

      <div className="queue-helper-row">
        <div className="helper-pills">
          <span className="pill pill-neutral">
            {selectedVisibleCount} of {filteredUsernames.length} visible selected
          </span>
        </div>
        <div className="helper-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onSelectionChange(filteredUsernames)}
            disabled={filteredUsernames.length === 0 || allVisibleSelected}
          >
            Select visible
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onSelectionChange([])}
            disabled={selectedUsernames.length === 0}
          >
            Clear selection
          </button>
        </div>
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
          disabled={selectedUsernames.length === 0 || isQueueing}
        >
          {isQueueing ? "Queueing..." : `Queue ${selectedUsernames.length} selected`}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Score</th>
              <th>Username</th>
              <th>Followers</th>
              <th>Engagement</th>
              <th>Niche</th>
              <th>Workflow</th>
              <th>Contact</th>
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {sortedInfluencers.map((influencer) => {
              const checked = selectedUsernames.includes(influencer.username);
              const latestTask = latestTaskByUsername[influencer.username];
              const workflowStatus = getWorkflowStatus(
                influencer.username,
                latestTaskByUsername,
              );

              return (
                <tr key={influencer.username}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleUser(influencer.username)}
                    />
                  </td>
                  <td className="numeric-cell">
                    <span className="score-badge">
                      {formatScore(influencer.score)}
                    </span>
                  </td>
                  <td>
                    <strong>@{influencer.username}</strong>
                    {influencer.tags?.length ? (
                      <div className="table-meta">
                        {influencer.tags.slice(0, 3).join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="numeric-cell">
                    {formatFollowers(influencer.followers_count)}
                  </td>
                  <td className="numeric-cell">
                    {formatEngagement(influencer.engagement_rate)}
                  </td>
                  <td>{influencer.niche}</td>
                  <td>
                    <div className="workflow-cell">
                      <span className={`status status-${workflowStatus}`}>
                        {formatLabel(workflowStatus)}
                      </span>
                      <span className="table-meta">
                        {latestTask ? formatLabel(latestTask.action) : "No task yet"}
                      </span>
                    </div>
                  </td>
                  <td>
                    {influencer.email ? (
                      <a href={`mailto:${influencer.email}`}>{influencer.email}</a>
                    ) : (
                      <span className="table-meta">No email</span>
                    )}
                  </td>
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
            {sortedInfluencers.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
