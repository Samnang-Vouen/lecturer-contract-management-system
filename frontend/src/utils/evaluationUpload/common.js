export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

export function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Upload failed"
  );
}

export function makeSummaryKey(lecturerId, academicYear, term, courseName) {
  return [
    String(lecturerId || ""),
    String(academicYear || "").trim(),
    String(term || "").trim(),
    String(courseName || "")
      .trim()
      .toLowerCase(),
  ].join("|");
}

export function formatScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return "-";

  const rounded = Math.round((numeric + Number.EPSILON) * 10) / 10;
  const scoreLabel = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return `${scoreLabel}/5`;
}

export const DEFAULT_QUESTION_TEXT_BY_ID = {
  1: "How would you rate the clarity and organization of the course content and materials?",
  2: "Do you feel the instructor effectively engages students through various teaching techniques?",
  3: "Do you feel comfortable asking questions or seeking clarification from the instructor?",
  4: "Do you receive timely and constructive feedback on your assignments and assessments?",
  5: "Are the lecturer's teaching methods effective?",
};