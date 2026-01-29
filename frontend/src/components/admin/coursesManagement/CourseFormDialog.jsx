import React from 'react';
import { Plus, Edit, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/Dialog.jsx';
import Button from '../../ui/Button.jsx';
import Input from '../../ui/Input.jsx';
import Textarea from '../../ui/Textarea.jsx';

export default function CourseFormDialog({
  mode = 'add', // 'add' or 'edit'
  isOpen,
  onClose,
  form,
  setForm,
  formErrors,
  setFormErrors,
  onSubmit,
  isSubmitting,
  creditsFromHours,
}) {
  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Edit Course' : 'Add New Course';
  const submitLabel = isEditMode ? 'Save' : 'Add';
  const Icon = isEditMode ? Edit : Plus;

  const handleHoursClick = (hours) => {
    const credits = creditsFromHours(hours);
    setForm(f => ({ ...f, hours: String(hours), credits: credits ?? '' }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <Input
                value={form.course_code}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  const sanitized = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  setForm(f => ({ ...f, course_code: sanitized }));
                  setFormErrors(err => ({ ...err, course_code: '' }));
                }}
                placeholder="e.g., CS101"
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {formErrors.course_code && (
                <p className="mt-1 text-xs text-red-600">{formErrors.course_code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <Input
                value={form.course_name}
                onChange={(e) => {
                  setForm(f => ({ ...f, course_name: e.target.value }));
                  setFormErrors(err => ({ ...err, course_name: '' }));
                }}
                placeholder="e.g., Programming Fundamentals"
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {formErrors.course_name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.course_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Provide a brief description of the course content and objectives..."
              rows={4}
              maxLength={300}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {(form.description || '').length}/300
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[15, 30, 45, 90].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleHoursClick(v)}
                    className={`px-2 py-1 rounded-full border text-xs transition-colors ${
                      String(form.hours) === String(v)
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {v}h
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  value={form.credits}
                  readOnly
                  className="h-10 bg-gray-50 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Credits are derived from hours (every 15h = 1 credit).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
