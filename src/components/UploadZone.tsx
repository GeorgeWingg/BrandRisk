'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onUploadComplete: (videoNo: string, videoUrl: string) => void;
  onUploadStart: () => void;
  onError: (error: string) => void;
}

export default function UploadZone({ onUploadComplete, onUploadStart, onError }: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      onError('Please upload a video file');
      return;
    }

    // Validate file size (limit to 100MB for hackathon)
    if (file.size > 100 * 1024 * 1024) {
      onError('File size must be less than 100MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    onUploadStart();

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to our API
      const response = await fetch('/api/memories/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload response:', result);
      
      // Robust videoNo extraction for v1.2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function extractVideoNo(result: any): string | null {
        const d = result?.data ?? result;
        return (
          d?.videoNo ??
          d?.video_no ??
          d?.videos?.[0]?.videoNo ??
          d?.videos?.[0]?.video_no ??
          null
        );
      }
      
      const videoNo = extractVideoNo(result);
      
      if (!videoNo) {
        throw new Error('No videoNo received from upload');
      }

      // Create object URL for video playback
      const videoUrl = URL.createObjectURL(file);

      // Wait for video processing
      setUploadProgress(50);
      await waitForProcessing(videoNo);
      
      setUploadProgress(100);
      onUploadComplete(videoNo, videoUrl);

    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadComplete, onUploadStart, onError]);

  const waitForProcessing = async (videoNo: string): Promise<void> => {
    const maxAttempts = 30; // 1 minute max (reduced for demo)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const response = await fetch(`/api/memories/status?videoNo=${videoNo}`);
        if (!response.ok) {
          throw new Error('Status check failed');
        }

        const result = await response.json();
        console.log(`Status check attempt ${attempts + 1}:`, result);
        
        const video = result.data.videoData?.find((v: { videoNo: string; videoStatus: string }) => v.videoNo === videoNo);
        
        if (video) {
          console.log(`Video ${videoNo} status: ${video.videoStatus}`);
          
          if (video.videoStatus === 'PARSE') {
            return; // Processing complete
          }
          
          if (video.videoStatus === 'FAIL') {
            throw new Error('Video processing failed');
          }
        } else {
          console.log(`Video ${videoNo} not found in response`);
        }

        attempts++;
        setUploadProgress(50 + (attempts / maxAttempts) * 40); // Progress from 50% to 90%
        
      } catch (error) {
        console.warn('Status check attempt failed:', error);
        attempts++;
      }
    }

    // For demo purposes, proceed anyway after timeout
    console.warn('Video processing timeout, proceeding with demo data');
    return;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="text-6xl">⏳</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Processing Video...</h3>
              <p className="text-sm text-gray-500 mt-1">
                Uploading and analyzing your video with Memories.ai
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{uploadProgress}% complete</p>
          </div>
        ) : isDragActive ? (
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-600">Drop your video here</h3>
              <p className="text-sm text-gray-500">Release to upload</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">🎥</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Upload Video for Brand Safety Analysis</h3>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop a video file here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV (max 100MB)
              </p>
            </div>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* Quick demo videos section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-3">🚀 Quick Demo</h4>
        <p className="text-sm text-gray-600 mb-3">
          For the hackathon demo, you can use these sample scenarios:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span>🍺</span>
            <span>Alcohol/Beverage ads</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span>🎮</span>
            <span>Gaming content</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span>📺</span>
            <span>TV commercials</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span>👥</span>
            <span>Social media content</span>
          </div>
        </div>
      </div>
    </div>
  );
}