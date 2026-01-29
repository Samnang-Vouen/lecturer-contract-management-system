import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import SectionHeader from './SectionHeader';
import { BookOpen } from 'lucide-react';

export default function CoursesSection({ profile }) {
  return (
    <Card className="shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-2xl border border-gray-100/70">
      <SectionHeader title="Courses Taught" icon={<BookOpen className="h-4 w-4" />} accent="amber" />
      <CardContent className="pt-5 text-sm">
        <p className="text-[11px] text-gray-500 mb-4 flex items-center gap-2">
          <span className="inline-block h-1 w-1 rounded-full bg-amber-400" />
          Captured during onboarding
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Departments
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.departments?.length ? (
                profile.departments.map(d => {
                  const id = d.id || d.name || d;
                  const name = d.name || d;
                  return (
                    <span 
                      key={id} 
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 text-amber-700 shadow-sm"
                    >
                      {name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400 italic">No departments recorded</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Courses
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.courses?.length ? (
                profile.courses.map(c => {
                  const id = c.id || c.name || c;
                  const name = c.name || c;
                  const code = c.code || '';
                  return (
                    <span 
                      key={id} 
                      title={code} 
                      className="px-2.5 py-1 rounded-md text-[11px] bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/70 shadow-sm text-gray-700 flex items-center gap-1"
                    >
                      {code && (
                        <span className="text-[10px] text-indigo-600 font-semibold">{code}</span>
                      )}
                      {name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400 italic">No courses recorded</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
