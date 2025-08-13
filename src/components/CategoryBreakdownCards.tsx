'use client';

import { RiskEvent, RISK_CATEGORIES } from '@/lib/riskCategories';

interface CategoryBreakdownCardsProps {
  events: RiskEvent[];
  duration: number;
}

interface CategoryStats {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  events: RiskEvent[];
  count: number;
  averageConfidence: number;
  totalDuration: number;
  percentageOfVideo: number;
  severityBreakdown: Record<string, number>;
  occurrencePattern: number[];
}

export default function CategoryBreakdownCards({ events, duration }: CategoryBreakdownCardsProps) {
  const categoryStats: CategoryStats[] = RISK_CATEGORIES.map(category => {
    const categoryEvents = events.filter(event => event.category.id === category.id);
    const totalDuration = categoryEvents.reduce((sum, event) => 
      sum + (event.endTime - event.startTime), 0
    );
    const averageConfidence = categoryEvents.length > 0 
      ? categoryEvents.reduce((sum, event) => sum + event.confidence, 0) / categoryEvents.length
      : 0;

    const severityBreakdown = categoryEvents.reduce((breakdown, event) => {
      breakdown[event.severity] = (breakdown[event.severity] || 0) + 1;
      return breakdown;
    }, {} as Record<string, number>);

    const occurrencePattern = Array(10).fill(0);
    categoryEvents.forEach(event => {
      const segment = Math.floor((event.startTime / duration) * 10);
      const segmentIndex = Math.min(segment, 9);
      occurrencePattern[segmentIndex]++;
    });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      description: category.description,
      events: categoryEvents,
      count: categoryEvents.length,
      averageConfidence,
      totalDuration,
      percentageOfVideo: duration > 0 ? (totalDuration / duration) * 100 : 0,
      severityBreakdown,
      occurrencePattern,
    };
  }).filter(stat => stat.count > 0);

  const colorMap: Record<string, string> = {
    'bg-red-500': '#ef4444',
    'bg-pink-500': '#ec4899',
    'bg-yellow-500': '#eab308',
    'bg-red-600': '#dc2626',
    'bg-orange-500': '#f97316',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Floor': return 'bg-red-600';
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (categoryStats.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/50 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🎉</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Clean Content</h3>
        <p className="text-gray-600">No brand safety issues detected across all categories</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats
          .sort((a, b) => b.count - a.count)
          .map((stat) => (
            <div
              key={stat.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div
                className="h-2"
                style={{ backgroundColor: colorMap[stat.color] || '#6b7280' }}
              />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{stat.name}</h4>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{stat.count}</div>
                    <div className="text-xs text-gray-500">events</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Video Coverage</span>
                    <span className="text-sm font-medium">{stat.percentageOfVideo.toFixed(1)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(stat.percentageOfVideo, 100)}%`,
                        backgroundColor: colorMap[stat.color] || '#6b7280',
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Confidence</span>
                    <span className="text-sm font-medium">{(stat.averageConfidence * 100).toFixed(0)}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-medium">
                      {Math.floor(stat.totalDuration / 60)}:{Math.floor(stat.totalDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {Object.keys(stat.severityBreakdown).length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-600 block mb-2">Severity Breakdown</span>
                      <div className="flex gap-1">
                        {Object.entries(stat.severityBreakdown).map(([severity, count]) => (
                          <div
                            key={severity}
                            className={`px-2 py-1 rounded text-xs text-white font-medium ${getSeverityColor(severity)}`}
                            title={`${severity}: ${count} events`}
                          >
                            {count}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 block mb-2">Distribution Pattern</span>
                    <div className="flex gap-1 h-4">
                      {stat.occurrencePattern.map((count, index) => {
                        const maxCount = Math.max(...stat.occurrencePattern);
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        
                        return (
                          <div
                            key={index}
                            className="flex-1 bg-gray-200 rounded-sm overflow-hidden"
                            title={`Segment ${index + 1}: ${count} events`}
                          >
                            <div
                              className="w-full transition-all duration-300"
                              style={{
                                height: `${height}%`,
                                backgroundColor: colorMap[stat.color] || '#6b7280',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}