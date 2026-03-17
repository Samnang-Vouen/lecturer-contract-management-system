export default function ScheduleTable({
  days = [],
  timeSlots = [],
  grid = {},
  specialSlots = {},
  groupName = '-',
  generatedCount = 0,
  loading = false,
  error = '',
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Schedule Preview</h2>
          <p className="text-sm text-gray-500">Group: {groupName}</p>
        </div>
        <p className="text-sm text-gray-500">Generated: {generatedCount}</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {loading ? <div className="py-8 text-center text-sm text-gray-500">Loading schedule...</div> : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-[120px] border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                <td className="whitespace-nowrap border border-gray-200 px-4 py-6 text-center align-middle text-sm font-medium text-gray-700">
                  {slot}
                </td>

                {specialSlots[slot] ? (
                  <td
                    colSpan={days.length}
                    className="border border-gray-200 px-3 py-4 text-center align-middle text-sm text-gray-600"
                  >
                    {specialSlots[slot]}
                  </td>
                ) : (
                  days.map((day) => {
                    const entries = grid?.[day]?.[slot] || [];
                    return (
                      <td key={day} className="min-w-[140px] border border-gray-200 px-3 py-4 align-middle">
                        {entries.map((entry, index) => (
                          <div key={entry.id || `${slot}-${day}-${index}`} className="space-y-1 text-center">
                            <div className="leading-snug text-sm font-semibold text-gray-900">
                              {entry.course}
                            </div>
                            <div className="text-xs text-gray-500">{entry.lecturer}</div>
                            <div className="text-xs text-gray-400">Room: {entry.room}</div>
                            <div className="text-xs text-gray-400">Session: {entry.sessionType}</div>
                          </div>
                        ))}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
