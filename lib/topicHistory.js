import fs from "fs";
import path from "path";

const HISTORY_FILE =
  process.env.VERCEL || process.env.NODE_ENV === "production"
    ? path.join("/tmp", "topic-history.json")
    : path.join(process.cwd(), ".topic-history.json");

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function loadHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
    const data = JSON.parse(raw);
    const now = Date.now();
    return data.filter((entry) => now - entry.timestamp < SEVEN_DAYS_MS);
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error("Failed to save topic history:", e);
  }
}

export function getRecentTopics() {
  return loadHistory().map((entry) => entry.topic);
}

export function addTopicToHistory(topic) {
  const history = loadHistory();
  history.push({ topic, timestamp: Date.now() });
  saveHistory(history);
}

export function isTooSimilar(newTopic, recentTopics) {
  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  const normalizedNew = normalize(newTopic);

  return recentTopics.some((t) => {
    const normalizedOld = normalize(t);
    if (normalizedNew === normalizedOld) return true;
    const wordsNew = new Set(normalizedNew.split(/\s+/).filter((w) => w.length > 3));
    const wordsOld = new Set(normalizedOld.split(/\s+/).filter((w) => w.length > 3));
    if (wordsNew.size === 0 || wordsOld.size === 0) return false;
    const intersection = [...wordsNew].filter((w) => wordsOld.has(w));
    const overlapRatio = intersection.length / Math.min(wordsNew.size, wordsOld.size);
    return overlapRatio > 0.7;
  });
}