import React from 'react';

export default function RoomByGroupEditor({
  assignedGroups,
  form,
  setTheoryRoomForGroup,
  setLabRoomForGroup,
}) {
  if (!Array.isArray(assignedGroups) || assignedGroups.length === 0) return null;

  return (
    <div className="col-span-1 sm:col-span-2 flex flex-col min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">Room by Group</label>
      <div className="w-full border border-gray-300 rounded-lg bg-white">
        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
          {assignedGroups.map((g) => {
            const gid = String(g.id);
            const theoryEnabled = Array.isArray(form.theory_group_ids)
              ? form.theory_group_ids.map(String).includes(gid)
              : false;
            const labEnabled = Array.isArray(form.lab_group_ids)
              ? form.lab_group_ids.map(String).includes(gid)
              : false;
            return (
              <div key={gid} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-sm text-gray-800 truncate">{g.name || `Group #${gid}`}</span>
                  {Number.isFinite(+g.num_of_student) && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">({+g.num_of_student} students)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">T Room</span>
                  <input
                    value={
                      (form.theory_room_by_group && typeof form.theory_room_by_group === 'object'
                        ? form.theory_room_by_group[gid]
                        : '') || ''
                    }
                    onChange={(e) => setTheoryRoomForGroup(gid, e.target.value)}
                    disabled={!theoryEnabled}
                    className="h-8 w-24 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A201"
                  />
                  <span className="text-[11px] text-gray-500">L Room</span>
                  <input
                    value={
                      (form.lab_room_by_group && typeof form.lab_room_by_group === 'object'
                        ? form.lab_room_by_group[gid]
                        : '') || ''
                    }
                    onChange={(e) => setLabRoomForGroup(gid, e.target.value)}
                    disabled={!labEnabled}
                    className="h-8 w-24 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="B105"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">Edits rooms for each assigned group; leave blank to clear.</p>
    </div>
  );
}
