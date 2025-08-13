'use client';

import { useState } from 'react';
import { RiskEvent } from '@/lib/riskCategories';

interface RiskDistributionChartProps {
  events: RiskEvent[];
}

interface CategoryData {
  id: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

export default function RiskDistributionChart({ events }: RiskDistributionChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categoryData: CategoryData[] = Object.values(
    events.reduce((acc, event) => {
      const category = event.category;
      if (!acc[category.id]) {
        acc[category.id] = {
          id: category.id,
          name: category.name,
          count: 0,
          percentage: 0,
          color: category.color,
          icon: category.icon,
        };
      }
      acc[category.id].count++;
      return acc;
    }, {} as Record<string, CategoryData>)
  );

  const totalEvents = events.length;
  categoryData.forEach(cat => {
    cat.percentage = (cat.count / totalEvents) * 100;
  });

  const colorMap: Record<string, string> = {
    'bg-red-500': '#ef4444',
    'bg-pink-500': '#ec4899', 
    'bg-yellow-500': '#eab308',
    'bg-red-600': '#dc2626',
    'bg-orange-500': '#f97316',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
  };

  let currentAngle = 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Distribution</h3>
      
      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="w-32 h-32 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <p>No risk events detected</p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="20"
              />
              {categoryData.map((cat) => {
                const circumference = 2 * Math.PI * 80;
                const strokeDasharray = (cat.percentage / 100) * circumference;
                const strokeDashoffset = -currentAngle * (circumference / 100);
                const angle = currentAngle;
                currentAngle += cat.percentage;

                return (
                  <circle
                    key={cat.id}
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={colorMap[cat.color] || '#6b7280'}
                    strokeWidth="20"
                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: hoveredCategory === cat.id ? 1 : hoveredCategory ? 0.3 : 0.8,
                      strokeWidth: hoveredCategory === cat.id ? 24 : 20,
                    }}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              })}
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalEvents}</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
            </div>
          </div>

          <div className="flex-1 ml-8">
            <div className="space-y-3">
              {categoryData
                .sort((a, b) => b.count - a.count)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: hoveredCategory === cat.id ? '#f8fafc' : 'transparent',
                      borderLeft: `4px solid ${colorMap[cat.color] || '#6b7280'}`,
                    }}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{cat.name}</div>
                        <div className="text-sm text-gray-500">{cat.count} events</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{cat.percentage.toFixed(1)}%</div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: colorMap[cat.color] || '#6b7280',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}