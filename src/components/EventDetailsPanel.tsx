'use client';

import { useState } from 'react';
import { RiskEvent, RISK_CATEGORIES } from '@/lib/riskCategories';

interface EventDetailsPanelProps {
  events: RiskEvent[];
  onTimeJump?: (time: number) => void;
  onExportSelected?: (selectedEvents: RiskEvent[]) => void;
}

type SortField = 'startTime' | 'category' | 'severity' | 'confidence';
type SortDirection = 'asc' | 'desc';

export default function EventDetailsPanel({ events, onTimeJump, onExportSelected }: EventDetailsPanelProps) {
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredEvents = events
    .filter(event => selectedCategory === 'all' || event.category.id === selectedCategory)
    .filter(event => selectedSeverity === 'all' || event.severity === selectedSeverity);

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
    switch (sortField) {
      case 'startTime':
        aValue = a.startTime;
        bValue = b.startTime;
        break;
      case 'category':
        aValue = a.category.name;
        bValue = b.category.name;
        break;
      case 'severity':
        const severityOrder = { 'Floor': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        aValue = severityOrder[a.severity];
        bValue = severityOrder[b.severity];
        break;
      case 'confidence':
        aValue = a.confidence;
        bValue = b.confidence;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEventSelect = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEvents.size === sortedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(sortedEvents.map(e => e.id)));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-white/50 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'} ({sortedEvents.length})
            </button>
            {selectedEvents.size > 0 && onExportSelected && (
              <button
                onClick={() => onExportSelected(sortedEvents.filter(e => selectedEvents.has(e.id)))}
                className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
              >
                Export Selected ({selectedEvents.size})
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {RISK_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Severity:</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="Floor">Floor</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4 flex items-center gap-4 text-sm font-medium text-gray-700 border-b pb-2">
              <input
                type="checkbox"
                checked={selectedEvents.size === sortedEvents.length && sortedEvents.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <button
                onClick={() => handleSort('startTime')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Time {getSortIcon('startTime')}
              </button>
              <button
                onClick={() => handleSort('category')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Category {getSortIcon('category')}
              </button>
              <button
                onClick={() => handleSort('severity')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Severity {getSortIcon('severity')}
              </button>
              <button
                onClick={() => handleSort('confidence')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Confidence {getSortIcon('confidence')}
              </button>
              <span>Evidence</span>
            </div>

            {sortedEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events match the selected filters
              </div>
            ) : (
              <div className="space-y-2">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                      selectedEvents.has(event.id) ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                    }`}
                    onClick={() => onTimeJump?.(event.startTime)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleEventSelect(event.id);
                      }}
                      className="rounded"
                    />
                    
                    <div className="w-16 text-sm font-medium text-gray-900">
                      {formatTime(event.startTime)}
                    </div>
                    
                    <div className="flex items-center gap-2 w-32">
                      <span className="text-lg">{event.category.icon}</span>
                      <span className="text-sm font-medium truncate">{event.category.name}</span>
                    </div>
                    
                    <div className="w-16">
                      <span className={`px-2 py-1 rounded text-xs text-white font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                    
                    <div className="w-16 text-sm font-medium">
                      {(event.confidence * 100).toFixed(0)}%
                    </div>
                    
                    <div className="flex-1 text-sm text-gray-700 truncate">
                      {event.evidence}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                        {event.source}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTimeJump?.(event.startTime);
                        }}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                        title="Jump to timestamp"
                      >
                        ⏱️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!isExpanded && sortedEvents.length > 0 && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(
              sortedEvents.reduce((acc, event) => {
                acc[event.severity] = (acc[event.severity] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([severity, count]) => (
              <div key={severity} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`}></span>
                <span className="font-medium">{count}</span>
                <span className="text-gray-600">{severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}