import { useEffect, useState } from "react";
import SearchForm from "./components/SearchForm";
import InfluencerTable from "./components/InfluencerTable";
import QueuePanel from "./components/QueuePanel";
import {
  createQueueItems,
  fetchConfig,
  fetchInfluencers,
  fetchQueue,
  importInfluencersCsv,
  searchInfluencers,
  updateQueueItemStatus,
} from "./lib/api";

function buildLatestTaskByUsername(tasks) {
  return tasks.reduce((summary, task) => {
    const existingTask = summary[task.influencer_username];
    const currentTimestamp = Date.parse(task.created_at);
    const existingTimestamp = existingTask
      ? Date.parse(existingTask.created_at)
      : 0;

    if (!existingTask || currentTimestamp >= existingTimestamp) {
      summary[task.influencer_username] = task;
    }

    return summary;
  }, {});
}

export default function App() {
  const [config, setConfig] = useState(null);
  const [niche, setNiche] = useState("fitness");
  const [influencers, setInfluencers] = useState([]);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [queueAction, setQueueAction] = useState("review_profile");
  const [queueNotes, setQueueNotes] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const latestTaskByUsername = buildLatestTaskByUsername(tasks);

  async function loadInitialData() {
    try {
      const [configData, influencersData, queueData] = await Promise.all([
        fetchConfig(),
        fetchInfluencers(),
        fetchQueue(),
      ]);
      setConfig(configData);
      setInfluencers(influencersData.items);
      setTasks(queueData.items);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setIsSearching(true);
    setError("");
    setNotice("");

    try {
      const response = await searchInfluencers(niche.trim());
      setInfluencers(response.items);
      setSelectedUsernames([]);
      setNotice(`Loaded ${response.count} creator profiles for ${niche.trim()}.`);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleImport(file) {
    setIsImporting(true);
    setError("");
    setNotice("");

    try {
      const response = await importInfluencersCsv(file);
      setInfluencers(response.items);
      setSelectedUsernames([]);
      setNotice(`Imported ${response.count} influencers from ${file.name}.`);
      return true;
    } catch (importError) {
      setError(importError.message);
      return false;
    } finally {
      setIsImporting(false);
    }
  }

  function toggleUser(username) {
    setSelectedUsernames((current) =>
      current.includes(username)
        ? current.filter((item) => item !== username)
        : [...current, username],
    );
  }

  async function handleQueueSelected() {
    if (selectedUsernames.length === 0) {
      return;
    }

    setIsQueueing(true);
    setError("");
    setNotice("");

    try {
      await createQueueItems(selectedUsernames, queueAction, queueNotes.trim() || null);
      const queueData = await fetchQueue();
      setTasks(queueData.items);
      setSelectedUsernames([]);
      setQueueNotes("");
      setNotice(
        `Added ${selectedUsernames.length} creator${
          selectedUsernames.length === 1 ? "" : "s"
        } to ${queueAction.replaceAll("_", " ")}. Queue now holds ${
          queueData.count
        } task${queueData.count === 1 ? "" : "s"}.`,
      );
    } catch (queueError) {
      setError(queueError.message);
    } finally {
      setIsQueueing(false);
    }
  }

  async function handleTaskStatusChange(taskId, status) {
    setActiveTaskId(taskId);
    setError("");
    setNotice("");

    try {
      await updateQueueItemStatus(taskId, status);
      const queueData = await fetchQueue();
      setTasks(queueData.items);
      setNotice(`Task moved to ${status.replaceAll("_", " ")}.`);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setActiveTaskId(null);
    }
  }

  return (
    <main className="app-shell">
      <div className="backdrop backdrop-one" />
      <div className="backdrop backdrop-two" />

      <section className="layout">
        <SearchForm
          niche={niche}
          onNicheChange={setNiche}
          onSubmit={handleSearch}
          onImport={handleImport}
          isSearching={isSearching}
          isImporting={isImporting}
        />

        {config ? (
          <section className="panel stats-panel">
            <div className="eyebrow">Config</div>
            <div className="stats-grid">
              <div>
                <span>Searches / hour</span>
                <strong>{config.limits.searches_per_hour}</strong>
              </div>
              <div>
                <span>Manual sessions / hour</span>
                <strong>{config.limits.manual_review_sessions_per_hour}</strong>
              </div>
              <div>
                <span>Queue delay window</span>
                <strong>
                  {config.queue.min_delay_seconds}s - {config.queue.max_delay_seconds}s
                </strong>
              </div>
              <div>
                <span>Max queued tasks / hour</span>
                <strong>{config.queue.max_tasks_per_hour}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {error ? <section className="error-banner">{error}</section> : null}
        {notice ? <section className="success-banner">{notice}</section> : null}

        <InfluencerTable
          influencers={influencers}
          selectedUsernames={selectedUsernames}
          onSelectionChange={setSelectedUsernames}
          onToggleUser={toggleUser}
          latestTaskByUsername={latestTaskByUsername}
          queueAction={queueAction}
          onQueueActionChange={setQueueAction}
          queueNotes={queueNotes}
          onQueueNotesChange={setQueueNotes}
          onQueueSelected={handleQueueSelected}
          isQueueing={isQueueing}
        />

        <QueuePanel
          tasks={tasks}
          onStatusChange={handleTaskStatusChange}
          activeTaskId={activeTaskId}
        />
      </section>
    </main>
  );
}
