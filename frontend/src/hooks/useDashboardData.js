import { useState, useEffect } from 'react';

export const useDashboardData = () => {
  const [trendData, setTrendData] = useState({
    activeLecturers: [],
    pendingContracts: [],
  activeContracts: [],
    recruitmentInProgress: [],
    totalUsers: []
  });

  const generateTrendData = (baseValue, volatility = 5, length = 10) => {
    const data = [];
    for (let i = 0; i < length; i++) {
      const variation = Math.random() * volatility * 2 - volatility;
      const value = Math.max(1, baseValue + variation + (Math.random() * 10 - 5));
      data.push(Math.round(value));
    }
    return data;
  };

  useEffect(() => {
    // Generate sample trend data
    setTrendData({
      activeLecturers: generateTrendData(45, 8),
      pendingContracts: generateTrendData(12, 3),
  activeContracts: generateTrendData(30, 5),
      recruitmentInProgress: generateTrendData(15, 4),
      totalUsers: generateTrendData(120, 15)
    });
  }, []);

  return { trendData };
};
