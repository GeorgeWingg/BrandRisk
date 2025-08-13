'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import UploadZone from '@/components/UploadZone';
import VideoPlayer from '@/components/VideoPlayer';
import KeyMetricsDashboard from '@/components/KeyMetricsDashboard';
import RiskDistributionChart from '@/components/RiskDistributionChart';
import CategoryBreakdownCards from '@/components/CategoryBreakdownCards';
import TimelineHeatmap from '@/components/TimelineHeatmap';
import RiskTrendGraph from '@/components/RiskTrendGraph';
import EventDetailsPanel from '@/components/EventDetailsPanel';
import { RiskEvent } from '@/lib/riskCategories';

interface AnalysisState {
  videoNo: string;
  videoUrl: string;
  events: RiskEvent[];
  riskScore: number;
  duration: number;
  isAnalyzing: boolean;
}

export default function Home() {
  const [analysisState, setAnalysisState] = useState<AnalysisState | null>(null);
  const [error, setError] = useState<string>('');
  const [, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTimeJump = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setError('');
    setAnalysisState(null);
  };

  const handleUploadComplete = async (videoNo: string, videoUrl: string) => {
    setIsUploading(false);
    
    // Create video element to get duration
    const video = document.createElement('video');
    video.src = videoUrl;
    
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      
      // Set initial state with video info
      setAnalysisState({
        videoNo,
        videoUrl,
        events: [],
        riskScore: 0,
        duration,
        isAnalyzing: true,
      });

      // Start analysis
      try {
        const response = await fetch('/api/memories/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoNo }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Analysis failed');
        }

        const result = await response.json();
        
        setAnalysisState(prev => prev ? {
          ...prev,
          events: result.data.events,
          riskScore: result.data.riskScore,
          isAnalyzing: false,
        } : null);

      } catch (error) {
        console.error('Analysis error:', error);
        setError(error instanceof Error ? error.message : 'Analysis failed');
        setAnalysisState(prev => prev ? { ...prev, isAnalyzing: false } : null);
      }
    };
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsUploading(false);
    setAnalysisState(null);
  };

  const handleExport = async (format: string) => {
    if (!analysisState) return;

    try {
      const response = await fetch('/api/memories/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: analysisState.events,
          format,
          videoNo: analysisState.videoNo,
          riskScore: analysisState.riskScore,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'json') {
        const result = await response.json();
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand-safety-report-${analysisState.videoNo}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For CSV and SRT, response is already a file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'csv' ? 'csv' : 'srt';
        a.download = `brand-safety-report-${analysisState.videoNo}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Export failed');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600/8 via-purple-600/5 to-blue-50/2 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex items-center justify-between animate-fade-in">
            <div className="flex items-center">
              <Image 
                src="/brandrisk_transparent.png" 
                alt="BrandRisk" 
                width={200}
                height={128}
                className="h-32 w-auto transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl text-gray-700 font-medium">Powered by</span>
              <Image 
                src="/memories_ai_transparent.png" 
                alt="Memories.ai" 
                width={120}
                height={64}
                className="h-16 w-auto transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!analysisState && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50">
              <UploadZone
                onUploadStart={handleUploadStart}
                onUploadComplete={handleUploadComplete}
                onError={handleError}
              />
            </div>
          </div>
        )}

        {/* Analysis Dashboard */}
        {analysisState && (
          <div className="space-y-8 animate-fade-in">
            {/* Header with Export Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Brand Safety Dashboard</h2>
                  {analysisState.isAnalyzing ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      Analyzing video content...
                    </div>
                  ) : (
                    <p className="text-gray-600 mt-1">Comprehensive analysis results for your video content</p>
                  )}
                </div>

                {/* Export Controls */}
                {!analysisState.isAnalyzing && analysisState.events.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">Export:</span>
                    <button
                      onClick={() => handleExport('json')}
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      📄 JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      📊 CSV
                    </button>
                    <button
                      onClick={() => handleExport('srt')}
                      className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      🎬 SRT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics Dashboard */}
            <KeyMetricsDashboard
              events={analysisState.events}
              riskScore={analysisState.riskScore}
              duration={analysisState.duration}
              isAnalyzing={analysisState.isAnalyzing}
            />

            {/* Video Player Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/50">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Video Analysis</h3>
              </div>
              <div className="p-6">
                <VideoPlayer
                  ref={videoRef}
                  videoUrl={analysisState.videoUrl}
                  events={analysisState.events}
                  duration={analysisState.duration}
                />
              </div>
            </div>

            {!analysisState.isAnalyzing && (
              <>
                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Risk Distribution Chart */}
                  <RiskDistributionChart events={analysisState.events} />
                  
                  {/* Timeline Heatmap */}
                  <TimelineHeatmap
                    events={analysisState.events}
                    duration={analysisState.duration}
                    onTimeJump={handleTimeJump}
                  />
                </div>

                {/* Risk Trend Graph */}
                <RiskTrendGraph
                  events={analysisState.events}
                  duration={analysisState.duration}
                  onTimeJump={handleTimeJump}
                />

                {/* Category Breakdown */}
                <CategoryBreakdownCards
                  events={analysisState.events}
                  duration={analysisState.duration}
                />

                {/* Event Details Panel */}
                <EventDetailsPanel
                  events={analysisState.events}
                  onTimeJump={handleTimeJump}
                  onExportSelected={(selectedEvents) => {
                    const blob = new Blob([JSON.stringify(selectedEvents, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `selected-events-${analysisState.videoNo}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                />
              </>
            )}

            {/* Start New Analysis */}
            <div className="text-center pt-8">
              <button
                onClick={() => {
                  setAnalysisState(null);
                  setError('');
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🔄 Analyze Another Video
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Built for AI Engine Hackathon • Powered by Memories.ai • Next.js & Tailwind CSS</p>
            <p className="mt-2">Brand Safety Timeline - Instant video content analysis</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
