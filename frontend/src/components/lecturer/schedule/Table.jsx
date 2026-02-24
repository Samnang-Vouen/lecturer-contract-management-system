const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = [
  "08:00 - 09:30",
  "09:50 - 11:20",
  "12:10 - 13:40",
  "13:50 - 15:20",
  "15:30 - 17:00",
];

const SCHEDULE_DATA = {
  "08:00 - 09:30": {
    Tuesday: [{ course: "Programming Fundamentals", group: "Group 1", room: "Lab-AI02" }],
    Thursday: [{ course: "Programming Fundamentals", group: "Group 2", room: "Lab-A001" }],
  },
  "09:50 - 11:20": {
    Tuesday: [{ course: "Programming Fundamentals", group: "Group 1", room: "Lab-AI02" }],
    Thursday: [{ course: "Programming Fundamentals", group: "Group 2", room: "Lab-A001" }],
    Friday: [{ course: "Programming Fundamentals", group: "Group 3", room: "Lab-AI02" }],
  },
  "12:10 - 13:40": {
    Tuesday: [{ course: "Introduction to Computer Science", group: "Group 2", room: "Room-A205" }],
    Friday: [{ course: "Programming Fundamentals", group: "Group 3", room: "Lab-AI02" }],
  },
  "13:50 - 15:20": {},
  "15:30 - 17:00": {
    Monday: [{ course: "Introduction to Computer Science", group: "Group 1", room: "Lab-AI01" }],
    Wednesday: [{ course: "Introduction to Computer Science", group: "Group 3", room: "Room-A201" }],
  },
};

export default function ScheduleTable() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Preview</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 text-center w-[120px]">
                Time
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 text-center"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="border border-gray-200 px-4 py-6 text-sm font-medium text-gray-700 text-center align-middle whitespace-nowrap">
                  {slot}
                </td>
                {DAYS.map((day) => {
                  const entries = SCHEDULE_DATA[slot]?.[day] || [];
                  return (
                    <td
                      key={day}
                      className="border border-gray-200 px-3 py-4 align-middle min-w-[140px]"
                    >
                      {entries.map((entry, i) => (
                        <div key={i} className="text-center space-y-0.5">
                          <div className="text-sm font-semibold text-gray-900 leading-snug">
                            {entry.course}
                          </div>
                          <div className="text-xs text-gray-500">{entry.group}</div>
                          <div className="text-xs text-gray-400 mt-1">{entry.room}</div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
