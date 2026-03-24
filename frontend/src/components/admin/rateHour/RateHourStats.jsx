import React from 'react';
import { formatValue } from '../../../utils/rateHour';

export default function RateHourStats({ stats }) {
  const cards = [
    { label: 'Lecturers', value: stats.totalLecturers },
    { label: 'Rows With Rate Increase', value: stats.increasedCount },
    { label: 'Total Hours', value: formatValue(stats.totalHours, 0) },
    {
      label: 'Average Feedback',
      value: stats.averageFeedback == null ? '—' : `${formatValue(stats.averageFeedback, 2)}/5`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}