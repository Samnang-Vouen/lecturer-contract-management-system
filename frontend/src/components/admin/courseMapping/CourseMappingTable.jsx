import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

/**
 * CourseMappingTable - Displays course mappings in a table with edit/delete actions
 */
export default function CourseMappingTable({ entries, courseMap, onEdit, onDelete }) {
  const normalizeGroupName = (m) =>
    (m?.group?.name || (m?.group_id ? `Group ${m.group_id}` : '') || '').trim();

  const sortGroupLabels = (labels) => {
    const toKey = (s) => {
      const str = String(s || '');
      const num = parseInt((str.match(/(\d+)/)?.[1] || ''), 10);
      return { str, num: Number.isFinite(num) ? num : null };
    };
    return [...(Array.isArray(labels) ? labels : [])].sort((a, b) => {
      const ak = toKey(a);
      const bk = toKey(b);
      if (ak.num != null && bk.num != null && ak.num !== bk.num) return ak.num - bk.num;
      return ak.str.localeCompare(bk.str, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  const GroupChips = ({ labels, tone }) => {
    const items = sortGroupLabels(labels);
    if (!items.length) return <span className="italic text-gray-400">—</span>;

    const base =
      tone === 'theory'
        ? 'bg-blue-50 text-blue-700 ring-blue-200'
        : tone === 'lab'
        ? 'bg-purple-50 text-purple-700 ring-purple-200'
        : 'bg-gray-100 text-gray-700 ring-gray-200';

    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((g) => (
          <span
            key={g}
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${base}`}
          >
            {g}
          </span>
        ))}
      </div>
    );
  };

  const isTheoryEntry = (m) => {
    if (Number.isFinite(m?.theory_groups)) return m.theory_groups > 0;
    return /theory|15h/i.test(String(m?.type_hours || '')) && (m?.group_count || 0) > 0;
  };

  const isLabEntry = (m) => {
    if (Number.isFinite(m?.lab_groups)) return m.lab_groups > 0;
    return /lab|30h/i.test(String(m?.type_hours || '')) && (m?.group_count || 0) > 0;
  };

  const getTheoryHour = (m) => {
    const th = String(m?.theory_hours || '').toLowerCase();
    if (th === '15h' || th === '30h') return th;
    return String(m?.type_hours || '').includes('15h') ? '15h' : '30h';
  };

  // Collapse multiple group-rows into a single row per course to avoid duplicate-looking rows.
  const rows = (() => {
    const byCourse = new Map();
    (Array.isArray(entries) ? entries : []).forEach((m) => {
      const cid = m?.course_id ?? m?.course?.id;
      const key = String(cid ?? 'unknown');
      if (!byCourse.has(key)) byCourse.set(key, []);
      byCourse.get(key).push(m);
    });

    const out = [];
    for (const [courseKey, list] of byCourse.entries()) {
      const ids = list
        .map((x) => parseInt(String(x?.id), 10))
        .filter((n) => Number.isInteger(n) && n > 0);

      const first = list[0] || {};

      const lecturerNames = new Set(
        list
          .map((x) => x?.lecturer?.name)
          .filter((v) => typeof v === 'string' && v.trim())
          .map((v) => v.trim())
      );

      const statuses = new Set(
        list
          .map((x) => x?.status)
          .filter((v) => typeof v === 'string' && v.trim())
          .map((v) => v.trim())
      );

      const theoryGroups = new Map();
      const labGroups = new Map();
      let anyLegacyNoGroup = false;

      const rowsForEdit = [];

      for (const m of list) {
        const gid = m?.group_id;
        if (!gid) {
          anyLegacyNoGroup = true;
          continue;
        }

        rowsForEdit.push({
          id: m?.id,
          group_id: m?.group_id,
          group: m?.group,
          availability_assignments: m?.availability_assignments,
          theory_groups: m?.theory_groups,
          lab_groups: m?.lab_groups,
          theory_room_number: m?.theory_room_number,
          lab_room_number: m?.lab_room_number,
          room_number: m?.room_number,
          roomNumber: m?.roomNumber,
        });

        const gname = normalizeGroupName(m) || `Group ${gid}`;
        const theoryRoom = String(m?.theory_room_number || m?.room_number || '').trim();
        const labRoom = String(m?.lab_room_number || m?.room_number || '').trim();
        const theoryLabel = theoryRoom ? `${gname} · ${theoryRoom}` : gname;
        const labLabel = labRoom ? `${gname} · ${labRoom}` : gname;
        if (isTheoryEntry(m)) theoryGroups.set(String(gid), theoryLabel);
        if (isLabEntry(m)) labGroups.set(String(gid), labLabel);
      }

      const theoryCount = theoryGroups.size;
      const labCount = labGroups.size;
      const theoryHour = list.find((x) => isTheoryEntry(x)) ? getTheoryHour(list.find((x) => isTheoryEntry(x))) : '';

      out.push({
        ...first,
        ids,
        courseKey,
        lecturer: lecturerNames.size === 1 ? { name: Array.from(lecturerNames)[0] } : first?.lecturer,
        status: statuses.size === 1 ? Array.from(statuses)[0] : 'Mixed',
        _rowsForEdit: rowsForEdit,
        _theoryGroups: Array.from(theoryGroups.values()),
        _labGroups: Array.from(labGroups.values()),
        _theoryCount: theoryCount,
        _labCount: labCount,
        _theoryHour: theoryHour,
        _hasLegacyNoGroup: anyLegacyNoGroup,
      });
    }
    return out;
  })();

  return (
    <div className="border-t border-gray-200 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50">
            <th className="py-3 pl-6 pr-3 font-medium">Course</th>
            <th className="px-3 py-3 font-medium">Lecturer</th>
            <th className="px-3 py-3 font-medium">Theory Groups</th>
            <th className="px-3 py-3 font-medium">Lab Groups</th>
            <th className="px-3 py-3 font-medium">Hours</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((m) => {
            const statusColor =
              m.status === 'Accepted'
                ? 'bg-green-100 text-green-700'
                : m.status === 'Contacting'
                ? 'bg-blue-100 text-blue-700'
                : m.status === 'Rejected'
                ? 'bg-red-100 text-red-700'
                : m.status === 'Mixed'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-yellow-100 text-yellow-700';

            const rowKey = String(m.courseKey ?? m.id ?? `${m.class_id}-${m.course_id}-${m.term}-${m.academic_year}`);
            const theoryCount = Number.isFinite(m?._theoryCount) ? m._theoryCount : 0;
            const labCount = Number.isFinite(m?._labCount) ? m._labCount : 0;
            const theoryHour = m?._theoryHour || '';

            return (
              <tr key={rowKey} className="hover:bg-gray-50">
                <td className="py-3 pl-6 pr-3 text-gray-900 font-medium whitespace-nowrap">
                  {m.course?.course_name ||
                    courseMap[m.course_id]?.course_name ||
                    m.course?.course_code ||
                    courseMap[m.course_id]?.course_code ||
                    m.course_id}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {m.lecturer?.name || <span className="italic text-gray-400">Not assigned</span>}
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <GroupChips labels={theoryCount > 0 ? m._theoryGroups : []} tone="theory" />
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <GroupChips labels={labCount > 0 ? m._labGroups : []} tone="lab" />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {theoryCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Theory {theoryHour || '15h'} × {theoryCount}
                      </span>
                    )}
                    {labCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Lab 30h × {labCount}
                      </span>
                    )}
                    {theoryCount === 0 && labCount === 0 && (
                      <>
                        {m.type_hours ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {m.type_hours}
                          </span>
                        ) : (
                          <span className="italic text-gray-400">not yet</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(m)}
                      title="Edit"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(m)}
                      title="Delete"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
