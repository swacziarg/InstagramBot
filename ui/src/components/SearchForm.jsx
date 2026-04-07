import { useState } from "react";

export default function SearchForm({
  niche,
  onNicheChange,
  onSubmit,
  onImport,
  isSearching,
  isImporting,
}) {
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleImport(event) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }

    const didImportSucceed = await onImport(selectedFile);
    if (didImportSucceed) {
      setSelectedFile(null);
      event.currentTarget.reset();
    }
  }

  return (
    <section className="panel panel-hero">
      <div className="eyebrow">Research workspace</div>
      <h1>Find creators by niche and stage manual outreach safely.</h1>
      <p>
        This dashboard stores search results, paces follow-up tasks, and keeps
        discovery separate from any platform automation.
      </p>

      <div className="search-form">
        <form className="form-block" onSubmit={onSubmit}>
          <label htmlFor="niche">Niche</label>
          <div className="search-row">
            <input
              id="niche"
              value={niche}
              onChange={(event) => onNicheChange(event.target.value)}
              placeholder="fitness, crypto, productivity"
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <form className="form-block" onSubmit={handleImport}>
          <label htmlFor="catalog-upload">Catalog CSV</label>
          <div className="search-row">
            <input
              id="catalog-upload"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
            />
            <button type="submit" disabled={!selectedFile || isImporting}>
              {isImporting ? "Importing..." : "Import CSV"}
            </button>
          </div>
          <p className="supporting-text">
            Expected columns: username, followers, niche, engagement, email.
            Importing replaces the stored catalog and refreshes the workspace.
          </p>
        </form>
      </div>
    </section>
  );
}
