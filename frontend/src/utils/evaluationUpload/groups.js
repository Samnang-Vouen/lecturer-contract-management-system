import { toArray } from "./common";

export function normalizeGroupLookupValue(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function getComparableGroupToken(value) {
  const normalized = normalizeGroupLookupValue(value);
  if (!normalized) return "";

  const suffixMatch = normalized.match(/(?:^|[-_/])(G\d+[A-Z0-9-]*)$/);
  if (suffixMatch) {
    return suffixMatch[1];
  }

  return normalized;
}

export function resolveVisibleGroups(availableGroupNames, summaryGroupScores) {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  const sortedAvailable = toArray(availableGroupNames).sort((a, b) =>
    collator.compare(a, b),
  );
  const uploadedGroups = toArray(summaryGroupScores);

  if (!uploadedGroups.length) {
    return {
      groupNames: sortedAvailable,
      groupScoreByName: {},
    };
  }

  const availableByNormalized = new Map(
    sortedAvailable.map((groupName) => [
      normalizeGroupLookupValue(groupName),
      groupName,
    ]),
  );
  const availableByComparable = new Map(
    sortedAvailable.map((groupName) => [getComparableGroupToken(groupName), groupName]),
  );

  const groupNames = [];
  const groupScoreByName = {};

  uploadedGroups.forEach((groupScore) => {
    const rawGroupName = String(groupScore?.group_name || "").trim();
    const score = Number(groupScore?.score);
    if (!rawGroupName || !Number.isFinite(score)) return;

    let resolvedGroupName =
      availableByNormalized.get(normalizeGroupLookupValue(rawGroupName)) ||
      availableByComparable.get(getComparableGroupToken(rawGroupName)) ||
      null;

    if (!resolvedGroupName && /^\d+$/.test(rawGroupName)) {
      const index = Number(rawGroupName) - 1;
      resolvedGroupName = sortedAvailable[index] || null;
    }

    const displayGroupName = resolvedGroupName || rawGroupName;
    if (!groupNames.includes(displayGroupName)) {
      groupNames.push(displayGroupName);
    }

    groupScoreByName[displayGroupName] = score;
  });

  return { groupNames, groupScoreByName };
}