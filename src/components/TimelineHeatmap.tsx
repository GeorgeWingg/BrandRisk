'use client';

import { useState } from 'react';
import { RiskEvent } from '@/lib/riskCategories';

interface TimelineHeatmapProps {
  events: RiskEvent[];
  duration: number;
  onTimeJump?: (time: number) => void;
}

interface HeatmapSegment {
  startTime: number;
  endTime: number;
  events: RiskEvent[];
  intensity: number;
  riskScore: number;
  dominantCategory: string | null;
}

export default function TimelineHeatmap({ events, duration, onTimeJump }: TimelineHeatmapProps) {
  const [hoveredSegment, setHoveredSegment] = useState<HeatmapSegment | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const segmentCount = 50;
  const segmentDuration = duration / segmentCount;

  const segments: HeatmapSegment[] = Array.from({ length: segmentCount }, (_, index) => {
    const startTime = index * segmentDuration;
    const endTime = (index + 1) * segmentDuration;
    
    const segmentEvents = events.filter(event => 
      (event.startTime >= startTime && event.startTime < endTime) ||
      (event.endTime > startTime && event.endTime <= endTime) ||
      (event.startTime < startTime && event.endTime > endTime)
    );

    const severityScores = {
      'Floor': 100,
      'High': 80,
      'Medium': 50,
      'Low': 20,
    };

    const riskScore = segmentEvents.length > 0 
      ? segmentEvents.reduce((sum, event) => {
          const baseScore = severityScores[event.severity];
          return sum + (baseScore * event.confidence);
        }, 0) / segmentEvents.length
      : 0;

    const categoryCount: Record<string, number> = {};
    segmentEvents.forEach(event => {
      categoryCount[event.category.id] = (categoryCount[event.category.id] || 0) + 1;
    });

    const dominantCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      startTime,
      endTime,
      events: segmentEvents,
      intensity: Math.min(segmentEvents.length / 3, 1),
      riskScore,
      dominantCategory,
    };
  });

  const maxIntensity = Math.max(...segments.map(s => s.intensity), 0.1);
  const maxRiskScore = Math.max(...segments.map(s => s.riskScore), 1);

  const getHeatmapColor = (intensity: number, riskScore: number): string => {
    if (intensity === 0) return '#f1f5f9';
    
    const normalizedIntensity = intensity / maxIntensity;
    const normalizedRisk = riskScore / maxRiskScore;
    
    const hue = Math.max(0, 120 - (normalizedRisk * 120));
    const saturation = 70 + (normalizedIntensity * 30);
    const lightness = Math.max(30, 70 - (normalizedIntensity * 40));
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Risk Density Timeline</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-400"></div>
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span>High Risk</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-50 gap-0.5 h-20 mb-4">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="cursor-pointer transition-all duration-200 rounded-sm hover:scale-105"
              style={{
                backgroundColor: getHeatmapColor(segment.intensity, segment.riskScore),
                opacity: hoveredSegment === segment ? 1 : 0.8,
              }}
              onClick={() => onTimeJump?.(segment.startTime)}
              onMouseEnter={() => setHoveredSegment(segment)}
              onMouseLeave={() => setHoveredSegment(null)}
              onMouseMove={handleMouseMove}
              title={`${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}: ${segment.events.length} events`}
            />
          ))}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0:00</span>
          <span>{formatTime(duration / 4)}</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime((duration * 3) / 4)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {hoveredSegment && (
          <div
            className="fixed z-50 bg-black text-white p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">
                {formatTime(hoveredSegment.startTime)} - {formatTime(hoveredSegment.endTime)}
              </span>
              {hoveredSegment.events.length > 0 && (
                <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
                  {hoveredSegment.events.length} events
                </span>
              )}
            </div>
            
            {hoveredSegment.events.length > 0 ? (
              <>
                <div className="text-sm text-gray-300 mb-2">
                  Risk Score: {hoveredSegment.riskScore.toFixed(0)}/100
                </div>
                <div className="space-y-1">
                  {hoveredSegment.events.slice(0, 3).map((event, idx) => (
                    <div key={idx} className="text-xs flex items-center gap-2">
                      <span>{event.category.icon}</span>
                      <span className="truncate">{event.category.name}</span>
                    </div>
                  ))}
                  {hoveredSegment.events.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{hoveredSegment.events.length - 3} more
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-300">Clean segment</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Timeline Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">{segments.filter(s => s.events.length === 0).length}</div>
            <div className="text-gray-600">Clean Segments</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{segments.filter(s => s.events.length > 0).length}</div>
            <div className="text-gray-600">Risk Segments</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{Math.max(...segments.map(s => s.events.length))}</div>
            <div className="text-gray-600">Peak Density</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{(segments.reduce((sum, s) => sum + s.riskScore, 0) / segments.length).toFixed(0)}</div>
            <div className="text-gray-600">Avg. Risk</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .grid-cols-50 {
          grid-template-columns: repeat(50, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
}