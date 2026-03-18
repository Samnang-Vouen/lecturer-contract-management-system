import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import SectionHeader from './SectionHeader';
import { BookOpen } from 'lucide-react';

export default function CoursesSection({ profile }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SectionHeader title="Courses Taught" icon={<BookOpen className="h-4 w-4" />} accent="amber" />
      <CardContent className="p-6 sm:p-8 text-sm">
        <p className="text-[11px] text-slate-500 mb-5 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Captured during onboarding
        </p>
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
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
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-700"
                    >
                      {name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400 italic">No departments recorded</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
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
                      className="px-3 py-1.5 rounded-xl text-[11px] bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5"
                    >
                      {code && (
                        <span className="text-[10px] text-indigo-600 font-semibold">{code}</span>
                      )}
                      {name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400 italic">No courses recorded</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
