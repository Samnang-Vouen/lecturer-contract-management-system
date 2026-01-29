import React from 'react';
import { BookOpen, Clock, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/Dialog.jsx';
import Button from '../../ui/Button.jsx';

export default function ViewCourseDialog({ course, isOpen, onClose, onEdit }) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Course Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-1">
              {course.course_code}
            </h3>
            <p className="text-blue-700 font-medium">{course.course_name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Duration</span>
              </div>
              <p className="text-lg font-bold text-amber-800">
                {course.hours || '-'} hours
              </p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">Credits</span>
              </div>
              <p className="text-lg font-bold text-indigo-800">
                {course.credits || '-'} credits
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 leading-relaxed">
              {course.description || 'No description available for this course.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                onEdit(course);
              }}
              className="w-full sm:w-auto"
            >
              <Award className="h-4 w-4 mr-2" />
              Edit Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
