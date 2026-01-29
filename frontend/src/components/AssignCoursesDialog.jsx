import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog";
import { Checkbox } from "./ui/Checkbox";
import Label from "./ui/Label";
import Button from "./ui/Button";
import Input from "./ui/Input";

// Assign courses from server-side course objects. selectedCourses stores course_code values.
export default function AssignCoursesDialog({ open, onOpenChange, availableCourses = [], selectedCourses = [], onToggleCourse, onSave, onCancel, className }) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!query.trim()) return availableCourses;
    const q = query.toLowerCase();
    return availableCourses.filter(c =>
      c.course_code?.toLowerCase().includes(q) ||
      c.course_name?.toLowerCase().includes(q)
    );
  }, [availableCourses, query]);

  const handleSelectAll = () => {
    const allCodes = filtered.map(course => course.course_code);
    const allSelected = allCodes.every(code => selectedCourses.includes(code));
    
    if (allSelected) {
      allCodes.forEach(code => {
        if (selectedCourses.includes(code)) {
          onToggleCourse(code);
        }
      });
    } else {
      allCodes.forEach(code => {
        if (!selectedCourses.includes(code)) {
          onToggleCourse(code);
        }
      });
    }
  };

  const filteredSelectedCount = filtered.filter(course => 
    selectedCourses.includes(course.course_code)
  ).length;

  const allFilteredSelected = filtered.length > 0 && filteredSelectedCount === filtered.length;
  const someFilteredSelected = filteredSelectedCount > 0 && !allFilteredSelected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Assign Courses</DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Select courses to assign to <span className="font-semibold text-blue-600">{className}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input 
              placeholder="Search courses by name or code..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              className="pl-10 pr-10 h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Course Dropdown */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            {/* Dropdown Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <svg 
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-90' : ''
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <h3 className="font-semibold text-gray-800">Available Courses</h3>
                </div>
                {filtered.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {filtered.length}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {filtered.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-header"
                      checked={allFilteredSelected}
                      ref={checkbox => {
                        if (checkbox) checkbox.indeterminate = someFilteredSelected;
                      }}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label 
                      htmlFor="select-all-header" 
                      className="text-sm font-medium text-gray-600 cursor-pointer select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Select All
                    </Label>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  {filteredSelectedCount} selected
                </span>
              </div>
            </div>

            {/* Dropdown Content */}
            {isDropdownOpen && (
              <div className="border-t border-gray-100">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <svg className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-400">No courses found</p>
                    {query && (
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {filtered.map((course, index) => {
                      const code = course.course_code;
                      if (!code) return null; // skip invalid entries without a course code
                      const rowId = `course-${course.id ?? code}`;
                      const checked = selectedCourses.includes(code);
                      
                      return (
                        <div
                          key={course.id ?? code}
                          className={`flex items-center p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors
                            ${checked ? 'bg-blue-50/50' : ''}`}
                          onClick={() => onToggleCourse(code)}
                        >
                          <div className="flex items-start space-x-3 w-full">
                            <Checkbox 
                              id={rowId} 
                              checked={checked} 
                              onCheckedChange={() => onToggleCourse(code)}
                              className="h-4 w-4 mt-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-semibold leading-snug
                                    ${checked ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {course.course_name}
                                  </h4>
                                </div>
                                <div className="flex items-center space-x-4 ml-4 text-xs text-gray-500">
                                  <div className="text-right">
                                    <div className="font-medium">{course.hours ?? '—'}h</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{course.credits ?? '—'} credits</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedCourses.length}
                </span>
                <span className="text-sm text-gray-600">
                  course{selectedCourses.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="px-5 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={onSave}
                disabled={selectedCourses.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold shadow-sm transition-colors"
              >
                Assign {selectedCourses.length > 0 && `(${selectedCourses.length})`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}