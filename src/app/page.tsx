'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import VideoPlayer from '@/components/VideoPlayer';
import { RiskEvent, getRiskLevel } from '@/lib/riskCategories';

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

  const riskLevel = analysisState ? getRiskLevel(analysisState.riskScore) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/brandrisk_transparent.png" 
              alt="BrandRisk" 
              className="h-32 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg text-gray-600">Powered by</span>
            <img 
              src="/memories_ai_transparent.png" 
              alt="Memories.ai" 
              className="h-12 w-auto"
            />
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
          <div className="max-w-2xl mx-auto">
            <UploadZone
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
          </div>
        )}

        {/* Analysis Section */}
        {analysisState && (
          <div className="space-y-6">
            {/* Risk Score Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Brand Safety Analysis
                  </h2>
                  {analysisState.isAnalyzing ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      Analyzing video content...
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Risk Score:</span>
                        <span className={`text-lg font-bold ${riskLevel?.color}`}>
                          {analysisState.riskScore}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Level:</span>
                        <span className={`text-sm font-semibold ${riskLevel?.color}`}>
                          {riskLevel?.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Events:</span>
                        <span className="text-sm font-semibold">
                          {analysisState.events.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Controls */}
                {!analysisState.isAnalyzing && analysisState.events.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Export:</span>
                    <button
                      onClick={() => handleExport('json')}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('srt')}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                    >
                      SRT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Video Player */}
            <VideoPlayer
              videoUrl={analysisState.videoUrl}
              events={analysisState.events}
              duration={analysisState.duration}
            />

            {/* Start New Analysis */}
            <div className="text-center">
              <button
                onClick={() => {
                  setAnalysisState(null);
                  setError('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Analyze Another Video
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
