import React, { useState } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import CourseMappingFilters from '../../components/admin/courseMapping/CourseMappingFilters.jsx';
import ClassGroupCard from '../../components/admin/courseMapping/ClassGroupCard.jsx';
import MappingFormDialog from '../../components/admin/courseMapping/MappingFormDialog.jsx';
import DeleteConfirmDialog from '../../components/admin/courseMapping/DeleteConfirmDialog.jsx';
import { useCourseMappingData } from '../../hooks/admin/courseMapping/useCourseMappingData.js';
import { useTeachingType } from '../../hooks/admin/courseMapping/useTeachingType.js';

export default function CourseMappingPage() {
  const {
    classes,
    lecturers,
    courses,
    grouped,
    classMap,
    courseMap,
    academicYearFilter,
    setAcademicYearFilter,
    termFilter,
    setTermFilter,
    statusFilter,
    setStatusFilter,
    academicYearOptions,
    termOptions,
    statusOptions,
    loading,
    error,
    hasMore,
    sentinelRef,
    reloadForAcademicYear,
    createMapping,
    updateMapping,
    deleteMapping,
  } = useCourseMappingData();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');

  const teachingTypeAdd = useTeachingType();
  const teachingTypeEdit = useTeachingType();

  const [form, setForm] = useState({
    class_id: '',
    group_ids: [],
    theory_group_ids: [],
    lab_group_ids: [],
    theory_room_by_group: {},
    lab_room_by_group: {},
    course_id: '',
    lecturer_profile_id: '',
    academic_year: '',
    term: '',
    year_level: '',
    group_count: 1,
    type_hours: '',
    availability: '',
    status: 'Pending',
    contacted_by: '',
    contactedBy: '',
    room_number: '',
    theory_room_number: '',
    lab_room_number: '',
    comment: '',
  });

  const startAdd = () => {
    setForm({
      class_id: '',
      group_ids: [],
      theory_group_ids: [],
      lab_group_ids: [],
      theory_room_by_group: {},
      lab_room_by_group: {},
      course_id: '',
      lecturer_profile_id: '',
      academic_year: '',
      term: '',
      year_level: '',
      group_count: 1,
      type_hours: '',
      availability: '',
      status: 'Pending',
      contacted_by: '',
      contactedBy: '',
      room_number: '',
      theory_room_number: '',
      lab_room_number: '',
      comment: '',
    });
    teachingTypeAdd.reset();
    setAddError('');
    setAddOpen(true);
  };

  const submitAdd = async (teachingPayload) => {
    try {
      console.log('[submitAdd] Starting with teachingPayload:', teachingPayload);
      console.log('[submitAdd] Current form:', form);
      
      const requiredErrors = [];
      if (!form.academic_year) requiredErrors.push('Academic Year');
      if (!form.year_level) requiredErrors.push('Year Level');
      if (!form.term) requiredErrors.push('Term');
      if (!form.class_id) requiredErrors.push('Class');
      const selectedClass =
        (classMap && form.class_id && classMap[form.class_id]) ||
        classes.find((c) => String(c.id) === String(form.class_id));
      const classGroups = Array.isArray(selectedClass?.Groups)
        ? selectedClass.Groups
        : Array.isArray(selectedClass?.groups)
        ? selectedClass.groups
        : [];
      const theoryGroupIds = Array.isArray(form.theory_group_ids) ? form.theory_group_ids : [];
      const labGroupIds = Array.isArray(form.lab_group_ids) ? form.lab_group_ids : [];
      const theoryRoomByGroupRaw =
        form.theory_room_by_group && typeof form.theory_room_by_group === 'object'
          ? form.theory_room_by_group
          : {};
      const labRoomByGroupRaw =
        form.lab_room_by_group && typeof form.lab_room_by_group === 'object' ? form.lab_room_by_group : {};
      if (!form.course_id) requiredErrors.push('Course');
      if (!form.lecturer_profile_id) requiredErrors.push('Lecturer');
      if (!form.availability) requiredErrors.push('Availability');
      if (requiredErrors.length) {
        console.error('[submitAdd] Required fields missing:', requiredErrors);
        setAddError(`Please fill in/select: ${requiredErrors.join(', ')}.`);
        return;
      }

      if (!teachingPayload.isValid) {
        console.error('[submitAdd] Invalid teaching payload');
        setAddError('Teaching Type is required: select Theory and/or Lab with valid groups.');
        return;
      }

      // If the selected class has groups, require selecting the specific groups per teaching type.
      if (form.class_id && classGroups.length) {
        const thCount = parseInt(String(teachingPayload.theory_groups ?? 0), 10) || 0;
        const lbCount = parseInt(String(teachingPayload.lab_groups ?? 0), 10) || 0;
        const thSelected = thCount > 0;
        const lbSelected = lbCount > 0;

        if (thSelected && theoryGroupIds.length !== thCount) {
          setAddError(`Please select exactly ${thCount} Theory group(s).`);
          return;
        }
        if (lbSelected && labGroupIds.length !== lbCount) {
          setAddError(`Please select exactly ${lbCount} Lab group(s).`);
          return;
        }
        if ((thSelected || lbSelected) && theoryGroupIds.length + labGroupIds.length === 0) {
          setAddError('Please select Group(s) for Theory and/or Lab.');
          return;
        }
      }

      const payload = {
        ...form,
        ...teachingPayload,
        theory_group_ids: (Array.isArray(form.theory_group_ids) ? form.theory_group_ids : [])
          .map((x) => parseInt(String(x), 10))
          .filter((n) => Number.isInteger(n) && n > 0),
        lab_group_ids: (Array.isArray(form.lab_group_ids) ? form.lab_group_ids : [])
          .map((x) => parseInt(String(x), 10))
          .filter((n) => Number.isInteger(n) && n > 0),
        // keep legacy group_ids for backward compatibility (union)
        group_ids: Array.from(
          new Set(
            [...(Array.isArray(form.theory_group_ids) ? form.theory_group_ids : []), ...(Array.isArray(form.lab_group_ids) ? form.lab_group_ids : [])]
              .map((x) => parseInt(String(x), 10))
              .filter((n) => Number.isInteger(n) && n > 0)
          )
        ),
        // per-group room mappings: { [group_id]: 'A201' }
        theory_room_by_group: (() => {
          const selected = new Set(
            theoryGroupIds
              .map((x) => parseInt(String(x), 10))
              .filter((n) => Number.isInteger(n) && n > 0)
              .map(String)
          );
          const out = {};
          for (const gid of selected) {
            const v = theoryRoomByGroupRaw[gid];
            const san = String(v || '').trim().slice(0, 50).toUpperCase();
            if (san) out[gid] = san;
          }
          return out;
        })(),
        lab_room_by_group: (() => {
          const selected = new Set(
            labGroupIds
              .map((x) => parseInt(String(x), 10))
              .filter((n) => Number.isInteger(n) && n > 0)
              .map(String)
          );
          const out = {};
          for (const gid of selected) {
            const v = labRoomByGroupRaw[gid];
            const san = String(v || '').trim().slice(0, 50).toUpperCase();
            if (san) out[gid] = san;
          }
          return out;
        })(),
        course_id: form.course_id ? parseInt(form.course_id, 10) : '',
        comment: (form.comment || '').slice(0, 160),
        contacted_by: form.contactedBy || form.contacted_by || '',
        room_number: (form.room_number || '').toUpperCase(),
        theory_room_number: (form.theory_room_number || '').toUpperCase(),
        lab_room_number: (form.lab_room_number || '').toUpperCase(),
      };
      delete payload.contactedBy;

      console.log('[submitAdd] Final payload:', payload);
      await createMapping(payload);
      console.log('[submitAdd] Successfully created mapping');
      setAddOpen(false);
    } catch (e) {
      console.error('[submitAdd] Error:', e);
      console.error('[submitAdd] Error response:', e.response?.data);
      setAddError(e.response?.data?.message || e.message);
    }
  };

  const startEdit = (m) => {
    setEditing(m);

    const rowsForEdit = Array.isArray(m?._rowsForEdit) ? m._rowsForEdit : [];
    const hasGroupRows = rowsForEdit.some((r) => r?.group_id);
    const theoryGroupIds = [];
    const labGroupIds = [];
    const theoryRoomByGroup = {};
    const labRoomByGroup = {};

    if (hasGroupRows) {
      for (const r of rowsForEdit) {
        const gid = r?.group_id ? String(r.group_id) : null;
        if (!gid) continue;
        const th = parseInt(String(r?.theory_groups ?? 0), 10) || 0;
        const lb = parseInt(String(r?.lab_groups ?? 0), 10) || 0;

        if (th > 0) {
          theoryGroupIds.push(gid);
          theoryRoomByGroup[gid] = String(r?.theory_room_number || r?.room_number || r?.roomNumber || '').toUpperCase();
        }
        if (lb > 0) {
          labGroupIds.push(gid);
          labRoomByGroup[gid] = String(r?.lab_room_number || r?.room_number || r?.roomNumber || '').toUpperCase();
        }
      }
    }

    const uniq = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).map(String)));
    const thUniq = uniq(theoryGroupIds);
    const lbUniq = uniq(labGroupIds);

    setForm({
      class_id: m.class_id,
      group_ids: hasGroupRows
        ? Array.from(new Set([...thUniq, ...lbUniq]))
        : m.group_id
        ? [String(m.group_id)]
        : [],
      theory_group_ids: hasGroupRows ? thUniq : m.theory_groups > 0 && m.group_id ? [String(m.group_id)] : [],
      lab_group_ids: hasGroupRows ? lbUniq : m.lab_groups > 0 && m.group_id ? [String(m.group_id)] : [],
      theory_room_by_group: hasGroupRows
        ? theoryRoomByGroup
        : m.group_id
        ? { [String(m.group_id)]: String(m.theory_room_number || m.room_number || m.roomNumber || '').toUpperCase() }
        : {},
      lab_room_by_group: hasGroupRows
        ? labRoomByGroup
        : m.group_id
        ? { [String(m.group_id)]: String(m.lab_room_number || m.room_number || m.roomNumber || '').toUpperCase() }
        : {},
      course_id: m.course_id,
      lecturer_profile_id: m.lecturer_profile_id || '',
      academic_year: m.academic_year,
      term: m.term,
      year_level: m.year_level || '',
      group_count: m.group_count || 1,
      type_hours: m.type_hours,
      theory_hours: m.theory_hours || '',
      theory_groups: m.theory_groups ?? '',
      lab_hours: m.lab_hours || '',
      lab_groups: m.lab_groups ?? '',
      availability: m.availability || '',
      status: m.status,
      contacted_by: m.contacted_by || '',
      room_number: m.room_number || m.roomNumber || '',
      theory_room_number: m.theory_room_number || '',
      lab_room_number: m.lab_room_number || '',
      comment: m.comment || '',
    });
    // If this is an aggregated row, prefer the collapsed counts
    teachingTypeEdit.initializeFromMapping({
      ...m,
      theory_groups: Number.isFinite(m?._theoryCount) ? m._theoryCount : m.theory_groups,
      lab_groups: Number.isFinite(m?._labCount) ? m._labCount : m.lab_groups,
      theory_hours: m?._theoryHour || m.theory_hours,
    });
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (teachingPayload) => {
    if (!editing) return;
    try {
      if (!teachingPayload.isValid) {
        setEditError('Select Theories and/or Labs.');
        return;
      }

      const payload = {
        lecturer_profile_id: form.lecturer_profile_id,
        availability: form.availability,
        status: form.status,
        contacted_by: form.contacted_by,
        room_number: (form.room_number || '').toUpperCase(),
        theory_room_number: (form.theory_room_number || '').toUpperCase(),
        lab_room_number: (form.lab_room_number || '').toUpperCase(),
        comment: (form.comment || '').slice(0, 160),
        ...teachingPayload,
      };

      if (Array.isArray(editing?.ids) && editing.ids.length) {
        await updateMapping(editing.ids, payload);
      } else {
        await updateMapping(editing.id, payload);
      }
      setEditOpen(false);
      setEditing(null);
    } catch (e) {
      setEditError(e.response?.data?.message || e.message);
    }
  };

  const remove = async (m) => {
    try {
      if (Array.isArray(m?.ids) && m.ids.length) {
        await deleteMapping(m.ids);
      } else {
        await deleteMapping(m.id);
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3 mb-2 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl leading-tight font-bold text-gray-900">Course Mapping</h1>
                <p className="text-gray-600 mt-1">Class-based view of lecturer assignments and workload</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={startAdd}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Course Assignment
              </Button>
            </div>
          </div>

          <CourseMappingFilters
            academicYearFilter={academicYearFilter}
            onAcademicYearFilterChange={setAcademicYearFilter}
            termFilter={termFilter}
            onTermFilterChange={setTermFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            academicYearOptions={academicYearOptions}
            termOptions={termOptions}
            statusOptions={statusOptions}
            resultCount={grouped.length}
            loading={loading}
            error={error}
          />
        </div>

        {/* NOTE: Client-side filters applied: Academic Year, Term, Status */}
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold">Error loading data:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {grouped.map((g) => (
            <ClassGroupCard
              key={g.key}
              group={g}
              courseMap={courseMap}
              onEdit={startEdit}
              onDelete={(m) => {
                setToDelete(m);
                setConfirmOpen(true);
              }}
            />
          ))}
          {grouped.length === 0 && !loading && !error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <GraduationCap className="h-16 w-16 mx-auto" />
              </div>
              <p className="text-gray-700 font-semibold mb-2">No course mappings found</p>
              <p className="text-sm text-gray-500 mb-4">
                {academicYearFilter !== 'ALL' || termFilter !== 'ALL' || statusFilter !== 'ALL' 
                  ? 'Try adjusting your filters or add a new course assignment.'
                  : 'Get started by adding your first course assignment.'}
              </p>
            </div>
          )}
          {grouped.length > 0 && (
            <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-400">
              {loading
                ? 'Loading more...'
                : hasMore
                ? 'Scroll to load more'
                : 'All data loaded'}
            </div>
          )}
        </div>

        {/* Dialogs */}
        <DeleteConfirmDialog
          isOpen={confirmOpen}
          onClose={(open) => {
            setConfirmOpen(open !== false);
            if (!open) setToDelete(null);
          }}
          mapping={toDelete}
          courseMap={courseMap}
          onConfirm={async () => {
            if (!toDelete) return;
            try {
              setDeleting(true);
              await remove(toDelete);
              setConfirmOpen(false);
              setToDelete(null);
            } finally {
              setDeleting(false);
            }
          }}
          isDeleting={deleting}
        />
        <MappingFormDialog
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          mode="add"
          form={form}
          setForm={setForm}
          onSubmit={submitAdd}
          error={addError}
          classes={classes}
          courses={courses}
          lecturers={lecturers}
          classMap={classMap}
          courseMap={courseMap}
          academicYearOptions={academicYearOptions}
          reloadForAcademicYear={reloadForAcademicYear}
          teachingType={teachingTypeAdd}
        />

        {/* Edit Mapping Dialog */}
        <MappingFormDialog
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditing(null);
          }}
          mode="edit"
          form={form}
          setForm={setForm}
          onSubmit={submitEdit}
          error={editError}
          classes={classes}
          courses={courses}
          lecturers={lecturers}
          classMap={classMap}
          courseMap={courseMap}
          academicYearOptions={academicYearOptions}
          reloadForAcademicYear={reloadForAcademicYear}
          teachingType={teachingTypeEdit}
        />
      </div>
    </>
  );
}
