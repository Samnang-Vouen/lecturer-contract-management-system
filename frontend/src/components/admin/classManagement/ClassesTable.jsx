import React from "react";
import { School, GraduationCap, Users, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/Table";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";

export default function ClassesTable({
  classes,
  onEdit,
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
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide">Term</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide">Year Level</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide">Academic Year</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide">Total Groups</TableHead>
              <TableHead className="text-gray-800 text-sm font-semibold tracking-wide">Assigned Courses</TableHead>
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
                <TableCell className="text-gray-700 text-sm">{classItem.term}</TableCell>
                <TableCell className="text-gray-700 text-sm">{classItem.year_level}</TableCell>
                <TableCell className="text-gray-700 text-sm">{classItem.academic_year}</TableCell>
                <TableCell className="text-gray-700 text-sm">{classItem.total_class}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
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
                  <div className="flex items-center gap-2 justify-end">
                    {onAssignCourses && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => onAssignCourses(classItem)}
                        title="Assign Courses"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:bg-gray-100"
                        onClick={() => onEdit(classItem)}
                        title="Edit Class"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => onDelete(classItem.id)}
                        title="Delete Class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}