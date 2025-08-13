'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { RiskEvent } from '@/lib/riskCategories';

interface VideoPlayerProps {
  videoUrl: string;
  events: RiskEvent[];
  duration: number;
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoUrl, events, duration, onTimeUpdate }, ref) => {
    const internalVideoRef = useRef<HTMLVideoElement>(null);
    
    useImperativeHandle(ref, () => internalVideoRef.current!);

    const videoRef = internalVideoRef;
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setIsPlaying] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<RiskEvent | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, videoRef]);

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * duration;

    videoRef.current.currentTime = seekTime;
  };

  const jumpToEvent = (event: RiskEvent) => {
    if (videoRef.current) {
      videoRef.current.currentTime = event.startTime;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[400px] object-contain"
          controls
          src={videoUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Timeline Container */}
      <div className="p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className="relative h-12 bg-gray-200 rounded-lg cursor-pointer mb-4 overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Progress bar */}
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />

          {/* Risk event markers */}
          {events.map((event) => {
            const leftPercent = (event.startTime / duration) * 100;
            const widthPercent = ((event.endTime - event.startTime) / duration) * 100;

            return (
              <div
                key={event.id}
                className={`absolute top-1 h-10 ${event.category.color} opacity-80 hover:opacity-100 cursor-pointer rounded transition-all duration-200`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${Math.max(widthPercent, 0.5)}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToEvent(event);
                }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                title={`${event.category.name}: ${event.evidence}`}
              >
                <div className="flex items-center justify-center h-full">
                  <span className="text-white text-xs font-bold">
                    {event.category.icon}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Current time indicator */}
          <div
            className="absolute top-0 w-1 h-full bg-white shadow-lg"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Event tooltip */}
        {hoveredEvent && (
          <div className="absolute z-10 bg-black text-white p-3 rounded-lg shadow-lg max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{hoveredEvent.category.icon}</span>
              <span className="font-semibold">{hoveredEvent.category.name}</span>
            </div>
            <div className="text-sm text-gray-300 mb-1">
              {formatTime(hoveredEvent.startTime)} - {formatTime(hoveredEvent.endTime)}
            </div>
            <div className="text-sm">{hoveredEvent.evidence}</div>
            <div className="text-xs text-gray-400 mt-1">
              Confidence: {Math.round(hoveredEvent.confidence * 100)}% | Severity: {hoveredEvent.severity}
            </div>
          </div>
        )}

        {/* Event summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {Object.values(
            events.reduce((categoryCount, event) => {
              const category = event.category;
              if (!categoryCount[category.id]) {
                categoryCount[category.id] = { category, count: 0 };
              }
              categoryCount[category.id].count++;
              return categoryCount;
            }, {} as Record<string, { category: RiskEvent['category']; count: number }>)
          ).map(({ category, count }) => (
            <div
              key={category.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
            >
              <span className="text-lg">{category.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{category.name}</div>
                <div className="text-xs text-gray-500">{count} event{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;