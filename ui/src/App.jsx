import { useEffect, useState } from "react";
import SearchForm from "./components/SearchForm";
import InfluencerTable from "./components/InfluencerTable";
import QueuePanel from "./components/QueuePanel";
import {
  completeQueueItem,
  createQueueItems,
  fetchConfig,
  fetchInfluencers,
  fetchQueue,
  importInfluencersCsv,
  searchInfluencers,
} from "./lib/api";

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
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

    try {
      const response = await searchInfluencers(niche.trim());
      setInfluencers(response.items);
      setSelectedUsernames([]);
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
    setIsQueueing(true);
    setError("");

    try {
      await createQueueItems(selectedUsernames, queueAction, queueNotes.trim() || null);
      const queueData = await fetchQueue();
      setTasks(queueData.items);
      setSelectedUsernames([]);
      setQueueNotes("");
    } catch (queueError) {
      setError(queueError.message);
    } finally {
      setIsQueueing(false);
    }
  }

  async function handleComplete(taskId) {
    setIsCompleting(true);
    setError("");

    try {
      await completeQueueItem(taskId);
      const queueData = await fetchQueue();
      setTasks(queueData.items);
    } catch (completeError) {
      setError(completeError.message);
    } finally {
      setIsCompleting(false);
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
          onToggleUser={toggleUser}
          queueAction={queueAction}
          onQueueActionChange={setQueueAction}
          queueNotes={queueNotes}
          onQueueNotesChange={setQueueNotes}
          onQueueSelected={handleQueueSelected}
          isQueueing={isQueueing}
        />

        <QueuePanel
          tasks={tasks}
          onComplete={handleComplete}
          isCompleting={isCompleting}
        />
      </section>
    </main>
  );
}
