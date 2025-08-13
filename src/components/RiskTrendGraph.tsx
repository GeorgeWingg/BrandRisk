'use client';

import { useState } from 'react';
import { RiskEvent } from '@/lib/riskCategories';

interface RiskTrendGraphProps {
  events: RiskEvent[];
  duration: number;
  onTimeJump?: (time: number) => void;
}

interface DataPoint {
  time: number;
  cumulativeScore: number;
  instantScore: number;
  eventCount: number;
  activeEvents: RiskEvent[];
}

export default function RiskTrendGraph({ events, duration, onTimeJump }: RiskTrendGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const sampleCount = 100;
  const timeStep = duration / sampleCount;

  const severityScores = {
    'Floor': 100,
    'High': 80,
    'Medium': 50,
    'Low': 20,
  };

  const dataPoints: DataPoint[] = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const time = index * timeStep;
    
    const activeEvents = events.filter(event => 
      event.startTime <= time && event.endTime > time
    );
    
    const eventsUpToTime = events.filter(event => event.startTime <= time);
    
    const instantScore = activeEvents.length > 0 
      ? activeEvents.reduce((sum, event) => {
          const baseScore = severityScores[event.severity];
          return sum + (baseScore * event.confidence);
        }, 0) / activeEvents.length
      : 0;

    const cumulativeScore = eventsUpToTime.length > 0
      ? eventsUpToTime.reduce((sum, event) => {
          const baseScore = severityScores[event.severity];
          return sum + (baseScore * event.confidence);
        }, 0) / eventsUpToTime.length
      : 0;

    return {
      time,
      cumulativeScore,
      instantScore,
      eventCount: eventsUpToTime.length,
      activeEvents,
    };
  });

  const maxScore = Math.max(...dataPoints.map(p => Math.max(p.cumulativeScore, p.instantScore)), 100);
  const graphWidth = 600;
  const graphHeight = 200;

  const getPathData = (points: DataPoint[], scoreKey: 'cumulativeScore' | 'instantScore'): string => {
    if (points.length === 0) return '';
    
    const pathCommands = points.map((point, index) => {
      const x = (point.time / duration) * graphWidth;
      const y = graphHeight - (point[scoreKey] / maxScore) * graphHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });
    
    return pathCommands.join(' ');
  };

  const cumulativePath = getPathData(dataPoints, 'cumulativeScore');
  const instantPath = getPathData(dataPoints, 'instantScore');

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (x / graphWidth) * duration;
    
    const closestPoint = dataPoints.reduce((closest, point) => {
      return Math.abs(point.time - time) < Math.abs(closest.time - time) ? point : closest;
    });
    
    setHoveredPoint(closestPoint);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleClick = () => {
    if (hoveredPoint && onTimeJump) {
      onTimeJump(hoveredPoint.time);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Risk Trend Analysis</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Cumulative Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-gray-600">Instant Risk</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          width={graphWidth}
          height={graphHeight + 40}
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="cumulativeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="instantGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <rect width={graphWidth} height={graphHeight} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

          {[0, 25, 50, 75, 100].map(score => {
            const y = graphHeight - (score / maxScore) * graphHeight;
            return (
              <g key={score}>
                <line
                  x1="0"
                  y1={y}
                  x2={graphWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="2,2"
                />
                <text
                  x="-10"
                  y={y + 4}
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="end"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const x = ratio * graphWidth;
            const time = ratio * duration;
            return (
              <g key={ratio}>
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={graphHeight}
                  stroke="#e2e8f0"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={graphHeight + 20}
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {formatTime(time)}
                </text>
              </g>
            );
          })}

          <path
            d={`${cumulativePath} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z`}
            fill="url(#cumulativeGradient)"
          />
          
          <path
            d={cumulativePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={`${instantPath} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z`}
            fill="url(#instantGradient)"
          />
          
          <path
            d={instantPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {events.map((_, index) => {
            const event = events[index];
            const x = (event.startTime / duration) * graphWidth;
            const y = graphHeight - (severityScores[event.severity] * event.confidence / maxScore) * graphHeight;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={event.category.color.includes('red') ? '#ef4444' : 
                      event.category.color.includes('yellow') ? '#eab308' :
                      event.category.color.includes('orange') ? '#f97316' : '#3b82f6'}
                stroke="white"
                strokeWidth="2"
                className="opacity-70 hover:opacity-100"
              />
            );
          })}

          {hoveredPoint && (
            <g>
              <line
                x1={(hoveredPoint.time / duration) * graphWidth}
                y1="0"
                x2={(hoveredPoint.time / duration) * graphWidth}
                y2={graphHeight}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <circle
                cx={(hoveredPoint.time / duration) * graphWidth}
                cy={graphHeight - (hoveredPoint.cumulativeScore / maxScore) * graphHeight}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={(hoveredPoint.time / duration) * graphWidth}
                cy={graphHeight - (hoveredPoint.instantScore / maxScore) * graphHeight}
                r="4"
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {hoveredPoint && (
          <div
            className="fixed z-50 bg-black text-white p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="font-semibold mb-2">{formatTime(hoveredPoint.time)}</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-300">Cumulative:</span>
                <span>{hoveredPoint.cumulativeScore.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-300">Instant:</span>
                <span>{hoveredPoint.instantScore.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Events:</span>
                <span>{hoveredPoint.eventCount}</span>
              </div>
              {hoveredPoint.activeEvents.length > 0 && (
                <div className="pt-2 border-t border-gray-600">
                  <div className="text-xs text-gray-300 mb-1">Active:</div>
                  {hoveredPoint.activeEvents.slice(0, 2).map((event, idx) => (
                    <div key={idx} className="text-xs flex items-center gap-1">
                      <span>{event.category.icon}</span>
                      <span>{event.category.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {Math.max(...dataPoints.map(p => p.cumulativeScore)).toFixed(1)}
          </div>
          <div className="text-gray-600">Peak Cumulative</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {Math.max(...dataPoints.map(p => p.instantScore)).toFixed(1)}
          </div>
          <div className="text-gray-600">Peak Instant</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {(dataPoints[dataPoints.length - 1]?.cumulativeScore || 0).toFixed(1)}
          </div>
          <div className="text-gray-600">Final Score</div>
        </div>
      </div>
    </div>
  );
}