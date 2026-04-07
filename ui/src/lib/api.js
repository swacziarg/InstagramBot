const API_BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Request failed.");
  }

  return response.json();
}

export function fetchConfig() {
  return request("/config");
}

export function searchInfluencers(niche) {
  return request("/search", {
    method: "POST",
    body: JSON.stringify({ niche }),
  });
}

export function fetchInfluencers() {
  return request("/influencers");
}

export function importInfluencersCsv(file) {
  const body = new FormData();
  body.append("file", file);

  return request("/influencers/import", {
    method: "POST",
    body,
  });
}

export function fetchQueue() {
  return request("/queue");
}

export function createQueueItems(usernames, action, notes) {
  return request("/queue", {
    method: "POST",
    body: JSON.stringify({ usernames, action, notes }),
  });
}

export function completeQueueItem(taskId) {
  return request(`/queue/${taskId}/complete`, {
    method: "POST",
  });
}

export function updateQueueItemStatus(taskId, status) {
  return request(`/queue/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
