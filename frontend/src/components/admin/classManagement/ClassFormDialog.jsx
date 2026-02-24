import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/Dialog";
import Input from "../../ui/Input";
import Label from "../../ui/Label";
import Select, { SelectItem } from "../../ui/Select";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import { BookOpen } from "lucide-react";

export default function ClassFormDialog({ open, onOpenChange, onSubmit, classData, setClassData, isEdit, mode, onAssignCourses, selectedCourses = [], courseCatalog = [], specializationOptions = [] }) {
  const effectiveMode = mode || (isEdit ? 'edit' : 'add');
  const isEditMode = effectiveMode === 'edit';
  // Academic years: start from current year, next 4 (total 5), formatted YYYY-YYYY
  const academicYearOptions = React.useMemo(() => {
    const start = new Date().getFullYear();
    const count = 5; // current year + next 4 years
    return Array.from({ length: count }, (_, i) => `${start + i}-${start + i + 1}`);
  }, []);

  const specializationNames = React.useMemo(() => {
    const list = Array.isArray(specializationOptions) ? specializationOptions : [];
    const names = list
      .map((s) => String(s?.name || '').trim())
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [specializationOptions]);

  const currentSpecialization = String(
    classData?.specialization ?? classData?.Specialization?.name ?? ''
  ).trimStart();

  const [isCustomSpec, setIsCustomSpec] = React.useState(false);

  // When dialog opens (or specialization list changes), infer whether this is a custom specialization
  React.useEffect(() => {
    if (!open) return;
    if (!currentSpecialization) {
      setIsCustomSpec(false);
      return;
    }
    setIsCustomSpec(!specializationNames.includes(currentSpecialization));
  }, [open, currentSpecialization, specializationNames]);

  const specializationSelectValue = React.useMemo(() => {
    if (isCustomSpec) return '__custom__';
    if (!currentSpecialization) return '';
    return specializationNames.includes(currentSpecialization) ? currentSpecialization : '';
  }, [currentSpecialization, specializationNames, isCustomSpec]);
  // Build maps to resolve course entries to human names (code/id/object -> name)
  const { codeToName, idToName } = React.useMemo(() => {
    const codeMap = new Map();
    const idMap = new Map();
    const list = Array.isArray(courseCatalog)
      ? courseCatalog
      : (Array.isArray(courseCatalog.data) ? courseCatalog.data : []);
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
        codeMap.set(code, name || '');
        codeMap.set(code.toUpperCase(), name || '');
        codeMap.set(code.toLowerCase(), name || '');
      }
      if (id != null) {
        idMap.set(String(id), name || '');
      }
    });
    return { codeToName: codeMap, idToName: idMap };
  }, [courseCatalog]);

  // Validation: all fields must be filled; total_class must be a positive integer
  const isPositiveInt = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return false;
    if (!/^\d+$/.test(s)) return false;
    return parseInt(s, 10) > 0;
  };

  const getSpecializationAbbrev = React.useCallback((name) => {
    const s = String(name || '').trim();
    if (!s) return '';
    const parts = s
      .split(/[^A-Za-z0-9]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) {
      const one = parts[0];
      // If it's already short/uppercase (e.g., AI), keep as-is
      if (one.length <= 4 && /^[A-Z0-9]+$/.test(one)) return one;
      return one.slice(0, 2).toUpperCase();
    }
    return parts
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }, []);

  const totalGroups = React.useMemo(() => {
    const v = classData?.total_class;
    const parsed = Number.parseInt(String(v ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [classData?.total_class]);

  const specializationName = currentSpecialization;
  const specializationAbbrev = React.useMemo(
    () => getSpecializationAbbrev(specializationName),
    [getSpecializationAbbrev, specializationName]
  );

  // Auto-generate groups (labels) when specialization/total groups change
  React.useEffect(() => {
    setClassData((prev) => {
      const nextTotal = (() => {
        const parsed = Number.parseInt(String(prev?.total_class ?? ''), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      })();

      const spec = String(prev?.specialization ?? prev?.Specialization?.name ?? '').trimStart();
      const abbr = getSpecializationAbbrev(spec);

      const prevGroups = Array.isArray(prev?.groups) ? prev.groups : [];
      const nextGroups = (!nextTotal || !abbr)
        ? (isEdit ? prevGroups : [])
        : Array.from({ length: nextTotal }, (_, i) => {
          const existing = prevGroups[i];
          return {
            ...(existing && typeof existing === 'object' ? existing : {}),
            name: `${abbr}-G${i + 1}`,
            num_of_student: existing?.num_of_student ?? '',
          };
        });

      const same =
        prevGroups.length === nextGroups.length &&
        prevGroups.every((g, i) =>
          g?.name === nextGroups[i]?.name &&
          String(g?.num_of_student ?? '') === String(nextGroups[i]?.num_of_student ?? '')
        );

      return same ? prev : { ...prev, groups: nextGroups };
    });
  }, [isEdit, setClassData, getSpecializationAbbrev, classData?.total_class, classData?.specialization, classData?.Specialization?.name]);

  const groups = React.useMemo(() => (Array.isArray(classData?.groups) ? classData.groups : []), [classData?.groups]);

  const allFilled = React.useMemo(() => {
    const baseOk = (
      String(classData?.name || '').trim() !== '' &&
      // specialization is required for group generation
      String(currentSpecialization || '').trim() !== '' &&
      String(classData?.term || '').trim() !== '' &&
      String(classData?.year_level || '').trim() !== '' &&
      String(classData?.academic_year || '').trim() !== '' &&
      isPositiveInt(classData?.total_class)
    );

    const groupsOk = (totalGroups > 0 && groups.length === totalGroups && groups.every((g) => isPositiveInt(g?.num_of_student)));

    // In Add mode (when onAssignCourses is provided and not editing), require at least one assigned course
    const coursesOk = isEditMode || !onAssignCourses ? true : (Array.isArray(selectedCourses) && selectedCourses.length > 0);
    return baseOk && coursesOk && groupsOk;
  }, [classData, currentSpecialization, isEditMode, onAssignCourses, selectedCourses, totalGroups, groups]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 tracking-tight">
            {effectiveMode === 'upgrade' ? 'Upgrade Class' : (isEditMode ? 'Edit Class' : 'Add New Class')}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {effectiveMode === 'upgrade'
              ? 'Create a new version of this class by updating its information.'
              : (isEditMode ? 'Update class information and settings.' : 'Create a new academic class with term and year information.')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-6"
          onSubmit={e => {
            e.preventDefault();
            if (!allFilled) return; // block submit if not complete
            onSubmit();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Class Name <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Input
                id="name"
                className="focus:ring-blue-500 h-10 sm:h-9 text-sm placeholder:text-sm placeholder:text-gray-500"
                placeholder="GEN10"
                value={classData.name}
                onBeforeInput={(e) => {
                  // Block any non A-Z or 0-9 characters at input time
                  if (e.data && /[^A-Za-z0-9]/.test(e.data)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  // Keep only English letters and numbers, and uppercase letters
                  const sanitized = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  setClassData({ ...classData, name: sanitized });
                }}
                pattern="[A-Za-z0-9]*"
                title="Only English letters (A-Z) and numbers (0-9) are allowed; letters are uppercased automatically"
                autoCapitalize="characters"
                autoComplete="off"
                inputMode="text"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">Specialization <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Select
                id="specialization"
                value={specializationSelectValue}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setIsCustomSpec(true);
                    setClassData({ ...classData, specialization: currentSpecialization || '' });
                    return;
                  }
                  setIsCustomSpec(false);
                  setClassData({ ...classData, specialization: value });
                }}
                placeholder="Select specialization"
                oneLine
                buttonClassName="h-10 sm:h-9 text-sm"
              >
                {specializationNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
                <SelectItem value="__custom__">Other (type)</SelectItem>
              </Select>

              {isCustomSpec && (
                <div className="pt-2">
                  <Input
                    id="specialization_custom"
                    className="focus:ring-blue-500 h-10 sm:h-9 text-sm placeholder:text-sm placeholder:text-gray-500"
                    placeholder="Type specialization"
                    value={currentSpecialization}
                    onChange={(e) => {
                      const value = String(e.target.value ?? '').trimStart();
                      setClassData({ ...classData, specialization: value });
                    }}
                    autoComplete="off"
                    inputMode="text"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="term" className="text-sm font-medium text-gray-700">Term <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Select
                id="term"
                value={classData.term}
                onValueChange={value => setClassData({ ...classData, term: value })}
                placeholder="Select term"
                buttonClassName="h-10 sm:h-9 text-sm"
              >
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="year_level" className="text-sm font-medium text-gray-700">Year Level <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Select
                id="year_level"
                value={classData.year_level}
                onValueChange={value => setClassData({ ...classData, year_level: value })}
                placeholder="Select year level"
                buttonClassName="h-10 sm:h-9 text-sm"
              >
                <SelectItem value="Year 1">Year 1</SelectItem>
                <SelectItem value="Year 2">Year 2</SelectItem>
                <SelectItem value="Year 3">Year 3</SelectItem>
                <SelectItem value="Year 4">Year 4</SelectItem>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">Academic Year <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Select
                id="academic_year"
                value={classData.academic_year}
                onValueChange={(value) => setClassData({ ...classData, academic_year: value })}
                placeholder="Select year"
                buttonClassName="h-10 sm:h-9 text-sm"
              >
                {academicYearOptions.map((ay) => (
                  <SelectItem key={ay} value={ay}>{ay}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="total_class" className="text-sm font-medium text-gray-700">Total Groups <span className="text-red-500" aria-hidden="true">*</span></Label>
              <Input
                id="total_class"
                type="number"
                min="1"
                placeholder="e.g., 3"
                className="flex-1 min-w-0 h-10 sm:h-9 text-sm placeholder:text-sm placeholder:text-gray-500"
                value={classData.total_class === null || classData.total_class === undefined ? "" : classData.total_class}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "") return setClassData({ ...classData, total_class: "" });
                  if (/^\d+$/.test(v)) {
                    setClassData({ ...classData, total_class: v });
                  }
                }}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium text-gray-700">
                  Groups & Students <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                {(!specializationAbbrev || !totalGroups) ? (
                  <div className="text-xs text-gray-500">
                    Select specialization and enter total groups to generate group labels.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groups.map((g, idx) => (
                      <div key={g?.name || idx} className="flex items-center gap-3">
                        <div className="w-24 sm:w-28 text-sm font-medium text-gray-800 whitespace-nowrap">
                          {g?.name || `${specializationAbbrev}-G${idx + 1}`}
                        </div>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Students"
                          className="h-10 sm:h-9 text-sm"
                          value={g?.num_of_student === null || g?.num_of_student === undefined ? '' : g?.num_of_student}
                          onChange={(e) => {
                            const v = e.target.value;
                            setClassData((prev) => {
                              const prevGroups = Array.isArray(prev?.groups) ? prev.groups : [];
                              const nextGroups = prevGroups.map((gg, i) =>
                                i === idx ? { ...gg, num_of_student: v === '' ? '' : ( /^\d+$/.test(v) ? v : gg?.num_of_student ) } : gg
                              );
                              return { ...prev, groups: nextGroups };
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            {onAssignCourses && (
              <div className="space-y-1">
                <Label htmlFor="assign_courses" className="text-sm font-medium text-gray-700">
                  Assign Courses <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Button
                  id="assign_courses"
                  type="button"
                  variant="outline"
                  className="h-10 sm:h-9 py-0 px-3 w-full justify-center border-blue-200 hover:bg-blue-600 hover:text-white text-blue-700 bg-blue-50"
                  onClick={() => onAssignCourses(classData)}
                  title="Assign Courses"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="ml-2 text-sm font-medium">Assign Courses</span>
                </Button>
                {/* Selected courses preview (names only) */}
                <div className="pt-2">
                  {Array.isArray(selectedCourses) && selectedCourses.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedCourses.map((entry, idx) => {
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
                          // Try code match (case-insensitive) then id; do NOT fallback to showing codes
                          label = codeToName.get(val) || codeToName.get(val.toUpperCase()) || codeToName.get(val.toLowerCase())
                            || (Number.isFinite(Number(val)) ? idToName.get(val) : '')
                            || '';
                        }
                        if (!label) return null; // skip rendering raw codes
                        return (
                          <Badge key={`${String(entry)}-${idx}`} variant="course" className="text-[10px] px-2 py-0.5">
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">No courses selected</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => onOpenChange && onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!allFilled}
              title={!allFilled ? 'Fill in all fields before submitting' : undefined}
              className={`w-full sm:flex-1 shadow-sm ${!allFilled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {effectiveMode === 'upgrade' ? 'Upgrade Class' : (isEditMode ? 'Update Class' : 'Add Class')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
