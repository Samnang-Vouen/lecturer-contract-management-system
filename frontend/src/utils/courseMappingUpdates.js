const COURSE_MAPPING_UPDATE_TYPE = "course_mapping_updated";
const COURSE_MAPPING_UPDATES_CHANNEL = "course-mapping-updates";
const COURSE_MAPPING_UPDATE_STORAGE_KEY = "course-mapping-update";
const COURSE_MAPPING_UPDATE_EVENT = "course-mapping:update";

function normalizePayload(payload = {}) {
  return {
    ...payload,
    type: COURSE_MAPPING_UPDATE_TYPE,
    timestamp: payload.timestamp || Date.now(),
  };
}

export function notifyCourseMappingUpdated(payload = {}) {
  if (typeof window === "undefined") return null;

  const message = normalizePayload(payload);
  const serializedMessage = JSON.stringify(message);

  window.dispatchEvent(new CustomEvent(COURSE_MAPPING_UPDATE_EVENT, { detail: message }));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(COURSE_MAPPING_UPDATES_CHANNEL);
    channel.postMessage(message);
    channel.close();
  }

  try {
    localStorage.setItem(COURSE_MAPPING_UPDATE_STORAGE_KEY, serializedMessage);
    window.setTimeout(() => {
      try {
        if (localStorage.getItem(COURSE_MAPPING_UPDATE_STORAGE_KEY) === serializedMessage) {
          localStorage.removeItem(COURSE_MAPPING_UPDATE_STORAGE_KEY);
        }
      } catch {}
    }, 300);
  } catch {}

  return message;
}

export function subscribeCourseMappingUpdates(onUpdate) {
  if (typeof window === "undefined" || typeof onUpdate !== "function") {
    return () => {};
  }

  let lastTimestamp = null;

  const handlePayload = (rawPayload) => {
    const payload = rawPayload?.detail || rawPayload?.data || rawPayload;
    if (!payload || payload.type !== COURSE_MAPPING_UPDATE_TYPE) return;

    if (payload.timestamp && payload.timestamp === lastTimestamp) return;
    lastTimestamp = payload.timestamp || Date.now();
    onUpdate(payload);
  };

  let channel = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(COURSE_MAPPING_UPDATES_CHANNEL);
    channel.onmessage = handlePayload;
  }

  const onStorage = (event) => {
    if (event.key !== COURSE_MAPPING_UPDATE_STORAGE_KEY || !event.newValue) return;
    try {
      handlePayload(JSON.parse(event.newValue));
    } catch {}
  };

  const onFocus = () => {
    try {
      const raw = localStorage.getItem(COURSE_MAPPING_UPDATE_STORAGE_KEY);
      if (!raw) return;
      handlePayload(JSON.parse(raw));
      localStorage.removeItem(COURSE_MAPPING_UPDATE_STORAGE_KEY);
    } catch {}
  };

  const onWindowEvent = (event) => {
    handlePayload(event);
  };

  window.addEventListener(COURSE_MAPPING_UPDATE_EVENT, onWindowEvent);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);

  return () => {
    window.removeEventListener(COURSE_MAPPING_UPDATE_EVENT, onWindowEvent);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
  };
}