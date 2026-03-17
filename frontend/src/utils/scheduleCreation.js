export const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const fallbackTimeSlots = [
  "08h:00-09h:30",
  "09h:50-11h:30",
  "12h:10-13h:40",
  "13h:50-15h:20",
  "15h:30-17h:00",
];

const SESSION_TO_TIMESLOT = {
  S1: "08h:00-09h:30",
  S2: "09h:50-11h:30",
  S3: "12h:10-13h:40",
  S4: "13h:50-15h:20",
  S5: "15h:30-17h:00",
};

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getSpecializationName(classObj) {
  return (
    classObj?.Specialization?.name ||
    classObj?.specialization?.name ||
    classObj?.specialization_name ||
    classObj?.specializationName ||
    ""
  );
}

function parseAvailabilityToSlots(availability) {
  const raw = String(availability || "").trim();
  if (!raw) return [];

  return raw
    .split(";")
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      const [dayPart, sessionsPart] = block
        .split(":")
        .map((part) => String(part || "").trim());
      if (!dayPart || !sessionsPart) return [];

      const day = weekDays.find((value) => value.toLowerCase() === dayPart.toLowerCase());
      if (!day) return [];

      return sessionsPart
        .split(",")
        .map((value) => String(value || "").trim().toUpperCase())
        .filter(Boolean)
        .map((code) => ({ day, slot: SESSION_TO_TIMESLOT[code] }))
        .filter((item) => item.slot);
    });
}

function formatDisplayDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "N/A";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getPreviewDateText(startTerm, endTerm) {
  return `Start term: ${formatDisplayDate(startTerm)} | End term: ${formatDisplayDate(endTerm)}`;
}

export function buildPreviewGridFromMappings(mappings) {
  const grid = {};

  safeArray(mappings).forEach((mapping) => {
    const course = mapping?.course?.name || "Unknown Course";
    const teacher = mapping?.lecturer?.name || "TBA";
    const theoryRoom = mapping?.theory_room_number || null;
    const labRoom = mapping?.lab_room_number || null;
    const fallbackRoom = mapping?.room_number || null;

    let assignments = [];
    try {
      const raw = mapping?.availability_assignments;
      assignments = safeArray(typeof raw === "string" ? JSON.parse(raw) : raw);
    } catch {
      assignments = [];
    }

    if (assignments.length > 0) {
      assignments.forEach((assignment) => {
        const room = String(assignment?.groupType || "").toUpperCase() === "LAB"
          ? labRoom || fallbackRoom || "TBA"
          : theoryRoom || fallbackRoom || labRoom || "TBA";

        safeArray(assignment?.assignedSessions).forEach((assignedSession) => {
          const day = weekDays.find(
            (weekday) =>
              weekday.toLowerCase() === String(assignedSession?.day || "").trim().toLowerCase(),
          );
          const slot = SESSION_TO_TIMESLOT[
            String(assignedSession?.session || "").trim().toUpperCase()
          ];
          if (!day || !slot) return;

          if (!grid[slot]) grid[slot] = {};
          if (!grid[slot][day]) grid[slot][day] = [];
          grid[slot][day].push({ course, teacher, room });
        });
      });
      return;
    }

    parseAvailabilityToSlots(mapping?.availability).forEach(({ day, slot }) => {
      const room = theoryRoom || labRoom || fallbackRoom || "TBA";
      if (!grid[slot]) grid[slot] = {};
      if (!grid[slot][day]) grid[slot][day] = [];
      grid[slot][day].push({ course, teacher, room });
    });
  });

  return grid;
}

export function collectEmptySessions({ grid, group }) {
  return fallbackTimeSlots.flatMap((slot) =>
    weekDays.flatMap((day) => {
      const hasData = Array.isArray(grid?.[slot]?.[day]) && grid[slot][day].length > 0;
      if (hasData) return [];

      return [{ key: `${group?.id}::${slot}::${day}`, groupId: group?.id, groupName: group?.name || "Group", slot, day }];
    }),
  );
}

export function buildCustomCellsByGroupFromSelection({ sessions, selectedKeys, text }) {
  const trimmedText = String(text || "").trim();
  if (!trimmedText) return undefined;

  return sessions.reduce((acc, session) => {
    if (!selectedKeys.includes(session.key)) return acc;
    if (!acc[session.groupId]) acc[session.groupId] = {};
    if (!acc[session.groupId][session.slot]) acc[session.groupId][session.slot] = {};
    acc[session.groupId][session.slot][session.day] = trimmedText;
    return acc;
  }, {});
}