import React from "react";
import { createPortal } from "react-dom";
import { School, GraduationCap, Users, BookOpen, Edit, Trash2, MoreHorizontal, ArrowUpCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/Table";
import Badge from "../../ui/Badge";
import Checkbox from "../../ui/Checkbox";

export default function ClassesTable({
  classes,
  onEdit,
  onUpgrade,
  onDelete,
  onAssignCourses,
  loading,
  courseCatalog = [],
  title,
  description,
  selectable = false,
  selectedIds = [],
  onToggleOne = () => {},
  onToggleAll = () => {},
}) {
  const [openMenuId, setOpenMenuId] = React.useState(null);
  const [menuCoords, setMenuCoords] = React.useState({ x: 0, y: 0 });

  const closeMenu = () => setOpenMenuId(null);

  const openMenu = (classId, event) => {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const menuWidth = 192; // w-48

    const actionCount = [onEdit, onUpgrade, onAssignCourses, onDelete].filter(Boolean).length;
    // Approx height: (actions * 48px) + padding
    const menuHeight = Math.max(64, actionCount * 48 + 16);
    const spacing = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Horizontal positioning: prioritize left side placement
    let x = rect.left - menuWidth - spacing;

    // If menu goes off-screen on the left, show on right side instead
    if (x < spacing) {
      x = rect.right + spacing;

      // If it also goes off-screen on the right, align to right edge
      if (x + menuWidth > viewportWidth - spacing) {
        x = viewportWidth - menuWidth - spacing;
      }
    }

    // Vertical positioning: align with button, but keep within viewport
    let y = rect.top;

    // If menu goes below viewport, shift it up
    if (y + menuHeight > viewportHeight - spacing) {
      y = Math.max(spacing, viewportHeight - menuHeight - spacing);
    }

    // Ensure minimum top spacing
    y = Math.max(spacing, y);

    setMenuCoords({ x, y });
    setOpenMenuId(classId);
  };

  // Close menu on outside click or scroll/resize
  React.useEffect(() => {
    function onDocClick(e) {
      if (!e.target.closest('.user-action-menu') && !e.target.closest('.user-action-trigger')) {
        closeMenu();
      }
    }
    if (openMenuId) {
      document.addEventListener('click', onDocClick);
    }
    const onScrollOrResize = () => closeMenu();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [openMenuId]);

  const { codeToName, idToName } = React.useMemo(() => {
    const codeMap = new Map();
    const idMap = new Map();
    // Support both legacy array and new paginated shape { data, ... }
    const list = Array.isArray(courseCatalog)
      ? courseCatalog
      : Array.isArray(courseCatalog.data)
        ? courseCatalog.data
        : [];

    const getName = (c) => (
      c?.course_name || c?.name_en || c?.name || c?.title || c?.Course?.name_en || c?.Course?.name || ''
    );
    const getCode = (c) => (
      c?.course_code || c?.code || c?.Course?.code || ''
    );
    const getId = (c) => (
      c?.id ?? c?.course_id ?? c?.Course?.id
    );

    list.forEach((c) => {
      const name = String(getName(c) || '').trim();
      const code = String(getCode(c) || '').trim();
      const id = getId(c);
      if (code) {
        codeMap.set(code, name || code);
        // case-insensitive support
        codeMap.set(code.toUpperCase(), name || code);
        codeMap.set(code.toLowerCase(), name || code);
      }
      if (id != null) {
        idMap.set(String(id), name || '');
      }
    });

    return { codeToName: codeMap, idToName: idMap };
  }, [courseCatalog]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading classes...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait while we fetch your data</p>
      </div>
    );
  }

  if (!classes.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-6">
          <GraduationCap className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Available</h3>
        <p className="text-gray-500 mb-4 max-w-md mx-auto">
          Get started by creating your first class to begin managing course assignments and academic schedules.
        </p>
        <div className="inline-flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
          <BookOpen className="h-3 w-3 mr-1" />
          Use the "Add Class" button to create your first class
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {(title || description) && (
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-gray-600 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50/80 *:whitespace-nowrap">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    id="select-all"
                    checked={classes.length > 0 && selectedIds.length === classes.length}
                    onCheckedChange={(val) => onToggleAll(!!val)}
                  />
                </TableHead>
              )}
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide">Class Name</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-center">Specialization</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-center">Term</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-center">Year Level</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-center">Academic Year</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-center">Groups</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-center">Assigned Courses</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((classItem, index) => (
              <TableRow key={classItem.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                {selectable && (
                  <TableCell className="w-10">
                    <Checkbox
                      id={`row-${classItem.id}`}
                      checked={selectedIds.includes(classItem.id)}
                      onCheckedChange={() => onToggleOne(classItem.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium text-gray-800">{classItem.name}</TableCell>
                <TableCell className="text-gray-700 text-sm text-center">
                  {classItem?.Specialization?.name
                    || classItem?.specialization?.name
                    || classItem?.specialization_name
                    || classItem?.specializationName
                    || (
                      (classItem?.specialization_id ?? classItem?.specializationId) != null
                        ? `#${classItem?.specialization_id ?? classItem?.specializationId}`
                        : <span className="text-gray-400 italic">—</span>
                    )}
                </TableCell>
                <TableCell className="text-gray-700 text-sm text-center whitespace-nowrap">{classItem.term}</TableCell>
                <TableCell className="text-gray-700 text-sm text-center whitespace-nowrap">{classItem.year_level}</TableCell>
                <TableCell className="text-gray-700 text-sm text-center whitespace-nowrap">{classItem.academic_year}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-wrap gap-1 max-w-sm justify-center">
                    {(() => {
                      const groups = Array.isArray(classItem?.Groups)
                        ? classItem.Groups
                        : Array.isArray(classItem?.groups)
                          ? classItem.groups
                          : [];
                      if (!groups.length) {
                        return (
                          <span className="text-gray-400 text-xs italic flex items-center gap-1">
                            —
                          </span>
                        );
                      }
                      return groups.map((g) => (
                        <Badge key={g.id || g.name} variant="course" className="text-[10px] px-2 py-0.5">
                          {String(g?.name ?? '').trim()}{Number.isFinite(+g?.num_of_student) ? `: ${+g.num_of_student} Students` : ''}
                        </Badge>
                      ));
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-wrap gap-1 max-w-xs justify-center">
                    {(classItem.courses || []).map((entry, idx) => {
                      // entry may be a code, id, name string, or an object
                      let label = '';
                      if (entry && typeof entry === 'object') {
                        const name = entry.course_name || entry.name_en || entry.name || entry.title;
                        const code = entry.course_code || entry.code;
                        const id = entry.id || entry.course_id;
                        label = (name && String(name).trim())
                          || (code && codeToName.get(String(code)))
                          || (id != null && idToName.get(String(id)))
                          || '';
                      } else {
                        const val = String(entry ?? '').trim();
                        // Try code match (case-insensitive), then id, then treat as plain name ONLY if it looks like a name
                        label = codeToName.get(val) || codeToName.get(val.toUpperCase()) || codeToName.get(val.toLowerCase())
                          || (Number.isFinite(Number(val)) ? idToName.get(val) : '')
                          || (/\s/.test(val) ? val : '');
                      }

                      if (!label) return null; // skip showing raw codes; only show names
                      return (
                        <Badge key={idx} variant="course" className="text-[10px] px-2 py-0.5">
                          {label}
                        </Badge>
                      );
                    })}
                    {!classItem.courses?.length && (
                      <span className="text-gray-400 text-xs italic flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> No courses assigned
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="user-action-trigger p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={(e) => openMenu(classItem.id, e)}
                      title="Actions"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === classItem.id}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {openMenuId && createPortal(
        (() => {
          const classItem = classes.find((c) => c.id === openMenuId);
          if (!classItem) return null;
          return (
            <div
              className="fixed z-[9999] user-action-menu animate-in fade-in zoom-in-95 duration-100"
              style={{ top: `${menuCoords.y}px`, left: `${menuCoords.x}px` }}
              role="menu"
            >
              <div className="w-48 bg-white border-2 border-gray-300 rounded-xl shadow-2xl py-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(classItem);
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                    role="menuitem"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Edit Class</span>
                  </button>
                )}

                {onUpgrade && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpgrade(classItem);
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                    role="menuitem"
                  >
                    <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Upgrade Class</span>
                  </button>
                )}

                {onAssignCourses && (
                  <button
                    type="button"
                    onClick={() => {
                      onAssignCourses(classItem);
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                    role="menuitem"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Assign Courses</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(classItem.id);
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left transition-colors"
                    role="menuitem"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Delete Class</span>
                  </button>
                )}
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}