import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, MoreHorizontal } from 'lucide-react';

export default function LecturerTableRow({ lecturer, onOpenMenu, onOpenCoursesPopover }) {
  const [courseTooltip, setCourseTooltip] = useState(null);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    onOpenMenu(lecturer.id, e);
  };

  const handleCoursesClick = (e) => {
    e.stopPropagation();
    onOpenCoursesPopover(lecturer, e);
  };

  const statusColor = lecturer.status === 'active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';

  const courses = Array.isArray(lecturer.courses) ? lecturer.courses : [];
  const visibleCourses = courses.slice(0, 3);
  const remainingCourses = Math.max(courses.length - visibleCourses.length, 0);

  const getCourseLabel = (course) => {
    if (!course) return '';
    if (typeof course === 'string') return course;
    return (
      course.course_code ||
      course.courseCode ||
      course.code ||
      course.Course?.course_code ||
      course.Course?.courseCode ||
      course.Course?.code ||
      course.course_name ||
      course.courseName ||
      course.name ||
      course.Course?.course_name ||
      course.Course?.courseName ||
      course.Course?.name ||
      ''
    );
  };

  const getCourseTitle = (course) => {
    if (!course) return '';
    if (typeof course === 'string') return course;
    const code =
      course.course_code ||
      course.courseCode ||
      course.code ||
      course.Course?.course_code ||
      course.Course?.courseCode ||
      course.Course?.code ||
      '';
    const name =
      course.course_name ||
      course.courseName ||
      course.name ||
      course.Course?.course_name ||
      course.Course?.courseName ||
      course.Course?.name ||
      '';

    // Requirement: hovering the course id should show the course name.
    if (name && code) return `${name} (${code})`;
    return name || code || '';
  };

  const getCourseNameOnly = (course) => {
    if (!course) return '';
    if (typeof course === 'string') return '';
    return (
      course.course_name ||
      course.courseName ||
      course.name ||
      course.Course?.course_name ||
      course.Course?.courseName ||
      course.Course?.name ||
      ''
    );
  };

  const openCourseTooltip = (e, text) => {
    if (!text) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom + 8;
    setCourseTooltip({ text, x, y });
  };

  const closeCourseTooltip = () => setCourseTooltip(null);

  return (
    <tr className='border-b border-gray-100 hover:bg-gray-50'>
      <td className='px-6 py-4'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm'>
            {lecturer.name?.charAt(0)?.toUpperCase() || 'L'}
          </div>
          <div>
            <div className='font-medium text-gray-900'>{lecturer.name || 'Unknown'}</div>
            <div className='text-sm text-gray-500'>{lecturer.email || ''}</div>
          </div>
        </div>
      </td>
      <td className='px-6 py-4 text-sm text-gray-700'>
        {lecturer.department || '—'}
      </td>
      <td className='px-6 py-4 text-sm text-gray-700'>
        {lecturer.position || 'Lecturer'}
      </td>
      <td className='px-6 py-4'>
        <div className='flex flex-wrap gap-1'>
          {lecturer.researchFields?.length > 0 ? (
            lecturer.researchFields.slice(0, 2).map((field, idx) => (
              <span 
                key={idx}
                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800'
              >
                {field}
              </span>
            ))
          ) : (
            <span className='text-sm text-gray-400'>—</span>
          )}
          {lecturer.researchFields?.length > 2 && (
            <span className='text-xs text-gray-500'>+{lecturer.researchFields.length - 2}</span>
          )}
        </div>
      </td>
      <td className='px-6 py-4'>
        {courses.length > 0 ? (
          <div className='flex flex-wrap items-center gap-1.5'>
            {visibleCourses.map((course, idx) => {
              const label = getCourseLabel(course);
              if (!label) return null;
              const title = getCourseTitle(course);
              const nameOnly = getCourseNameOnly(course);
              return (
                <span
                  key={`${label}-${idx}`}
                  role='button'
                  tabIndex={0}
                  onMouseEnter={(e) => openCourseTooltip(e, nameOnly)}
                  onMouseLeave={closeCourseTooltip}
                  onFocus={(e) => openCourseTooltip(e, nameOnly)}
                  onBlur={closeCourseTooltip}
                  aria-label={title}
                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 max-w-[11rem] truncate cursor-pointer'
                >
                  {label}
                </span>
              );
            })}

            {remainingCourses > 0 && (
              <button
                type='button'
                onClick={handleCoursesClick}
                className='courses-plus-chip inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                aria-label={`View ${remainingCourses} more course${remainingCourses === 1 ? '' : 's'}`}
                title={`View ${remainingCourses} more`}
              >
                <MoreHorizontal className='w-3.5 h-3.5' />
                +{remainingCourses}
              </button>
            )}
          </div>
        ) : (
          <span className='text-sm text-gray-400'>—</span>
        )}
      </td>

      {courseTooltip && createPortal(
        <div
          className='fixed z-[60] pointer-events-none -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[11px] text-white shadow'
          style={{ left: `${courseTooltip.x}px`, top: `${courseTooltip.y}px` }}
        >
          {courseTooltip.text}
        </div>,
        document.body
      )}
      <td className='px-6 py-4'>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {lecturer.status || 'inactive'}
        </span>
      </td>
      <td className='px-6 py-4 text-right'>
        <button
          onClick={handleMenuClick}
          className='lecturer-action-trigger inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors'
          aria-label='Open menu'
        >
          <MoreVertical className='w-4 h-4' />
        </button>
      </td>
    </tr>
  );
}
