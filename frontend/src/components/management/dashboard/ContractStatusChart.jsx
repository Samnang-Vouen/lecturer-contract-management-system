import React from 'react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { chartColors } from '../../../utils/chartHelpers';

export default function ContractStatusChart({ totals }) {
  const contractStatusData = [
    { status: 'Waiting Lecturer', count: totals.mgmtSigned, color: chartColors.primary },
    { status: 'Waiting Management', count: totals.lecturerSigned, color: chartColors.warning },
    { status: 'Completed', count: totals.completed, color: chartColors.success }
  ];

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
      <div className='px-6 py-4 border-b border-slate-100'>
        <h2 className='text-xl font-semibold text-slate-900'>Contract Status</h2>
        <p className='text-sm text-slate-600'>Distribution of contracts by status</p>
      </div>
      <div className='p-6 h-64 sm:h-72 lg:h-80' style={{minHeight: '256px'}}>
        <ResponsiveContainer width='100%' height={320}>
          <RechartsPieChart>
            <Pie 
              data={contractStatusData} 
              dataKey='count' 
              nameKey='status' 
              cx='50%' 
              cy='50%' 
              innerRadius={60} 
              outerRadius={90} 
              label
            >
              {contractStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <text 
              x='50%' 
              y='50%' 
              textAnchor='middle' 
              dominantBaseline='middle' 
              className='fill-slate-700 text-sm font-semibold'
            >
              {totals?.all ?? 0} total
            </text>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
