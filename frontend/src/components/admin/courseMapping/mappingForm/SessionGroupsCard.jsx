import React, { useEffect, useMemo, useRef } from 'react';

export default function SessionGroupsCard({
  title,
  groups,
  selectedIds,
  onToggleGroup,
  onToggleAllGroups,
  roomByGroup,
  onRoomChange,
  roomPlaceholder,
}) {
  const selectedSet = useMemo(() => new Set((Array.isArray(selectedIds) ? selectedIds : []).map(String)), [selectedIds]);
  const allGroups = Array.isArray(groups) ? groups : [];
  const totalGroups = allGroups.length;
  const selectedCount = allGroups.reduce((count, group) => {
    return selectedSet.has(String(group.id)) ? count + 1 : count;
  }, 0);
  const allSelected = totalGroups > 0 && selectedCount === totalGroups;
  const partiallySelected = selectedCount > 0 && selectedCount < totalGroups;
  const showRoom = typeof onRoomChange === 'function';
  const roomMap = showRoom && roomByGroup && typeof roomByGroup === 'object' ? roomByGroup : {};
  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 rounded-t-lg bg-gray-50 px-3 py-2">
        <div className="text-sm font-medium text-gray-800">{title}</div>
        {totalGroups > 0 && typeof onToggleAllGroups === 'function' && (
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              ref={selectAllRef}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={allSelected}
              onChange={(e) => onToggleAllGroups(e.target.checked)}
            />
            Select All
          </label>
        )}
      </div>
      <div className="max-h-44 overflow-y-auto divide-y divide-gray-100">
        {allGroups.map((g) => {
          const gid = String(g.id);
          const checked = selectedSet.has(gid);
          return (
            <div key={gid} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-sm text-gray-800 truncate">{g.name || `Group #${gid}`}</span>
                {Number.isFinite(+g.num_of_student) && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">({+g.num_of_student} students)</span>
                )}
              </div>

              <div className="flex items-center gap-3 whitespace-nowrap">
                <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={checked}
                    onChange={() => onToggleGroup(gid)}
                  />
                  Select
                </label>

                {showRoom && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">Room</span>
                    <input
                      value={String(roomMap[gid] || '')}
                      onChange={(e) => onRoomChange(gid, e.target.value)}
                      disabled={!checked}
                      className="h-8 w-24 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={roomPlaceholder}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
