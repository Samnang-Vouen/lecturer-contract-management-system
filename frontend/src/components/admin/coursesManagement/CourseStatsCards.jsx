import React from 'react';
import { BookOpen, Award, Clock } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card.jsx';

export default function CourseStatsCards({ courses, filteredCourses }) {
  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Courses</p>
              <p className="text-3xl font-bold text-blue-900">{courses.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Courses</p>
              <p className="text-3xl font-bold text-green-900">{filteredCourses.length}</p>
            </div>
            <Award className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Credits</p>
              <p className="text-3xl font-bold text-purple-900">{totalCredits}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
