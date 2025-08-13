const MEMORIES_API_BASE = 'https://api.memories.ai';

export interface VideoUploadResponse {
  data: {
    videoNo: string;
    uploadTime: string;
  };
}

export interface VideoSearchResponse {
  data: {
    videoData: Array<{
      videoNo: string;
      videoStatus: 'PARSE' | 'UNPARSE' | 'FAIL';
      duration: number;
      uploadTime: string;
    }>;
  };
}

export interface TranscriptionResponse {
  data: {
    taskNo: string;
  };
}

export interface TranscriptionResult {
  data: {
    transcriptions: Array<{
      startTime: number;
      endTime: number;
      content: string;
    }>;
    status: 'PROCESSING' | 'FINISH';
  };
}

export interface VideoFragmentResponse {
  data: {
    videos: Array<{
      videoNo: string;
      fragmentStartTime: number;
      fragmentEndTime: number;
      similarity: number;
    }>;
  };
}

export class MemoriesClient {
  private apiKey: string;
  private uniqueId: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.uniqueId = 'brand-safety-app'; // Use consistent unique_id
  }

  private getHeaders(includeContentType = true) {
    const headers: Record<string, string> = {
      'Authorization': this.apiKey,
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async uploadVideo(file: File): Promise<VideoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('unique_id', this.uniqueId); // Required for v1.2

    const response = await fetch(`${MEMORIES_API_BASE}/serve/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle v1.2 response structure
    if (result.code === '0000' && result.data) {
      return { data: result.data };
    }
    
    throw new Error(`Upload failed: ${result.msg || 'Unknown error'}`);
  }

  async getVideoStatus(videoNo?: string): Promise<VideoSearchResponse> {
    const body: {
      page: number;
      size: number;
      unique: string;
      video_no?: string;
    } = {
      page: 1,
      size: 50,
      unique: this.uniqueId,
    };
    
    if (videoNo) {
      body.video_no = videoNo;
    }

    const response = await fetch(`${MEMORIES_API_BASE}/serve/api/v1/list_videos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert v1.2 list_videos response to our expected format
    if (result.data?.videos) {
      const videoData = result.data.videos.map((v: {
        video_no: string;
        status: 'PARSE' | 'UNPARSE' | 'FAIL';
        duration?: number;
        create_time: string;
      }) => ({
        videoNo: v.video_no,
        videoStatus: v.status,
        duration: v.duration || 0,
        uploadTime: v.create_time,
      }));
      
      return { data: { videoData } };
    }
    
    return { data: { videoData: [] } };
  }

  async startTranscription(videoNo: string): Promise<TranscriptionResponse> {
    // For v1.2, we directly get transcription without starting a task
    return { data: { taskNo: videoNo } }; // Use videoNo as taskNo for simplicity
  }

  async getTranscription(taskNo: string): Promise<TranscriptionResult> {
    const endpoint = taskNo.includes('AUDIO') ? 'get_audio_transcription' : 'get_audio_transcription';
    const url = new URL(`${MEMORIES_API_BASE}/serve/api/v1/${endpoint}`);
    url.searchParams.set('video_no', taskNo);
    url.searchParams.set('unique_id', this.uniqueId);

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(false), // No content-type for GET
    });

    if (!response.ok) {
      throw new Error(`Transcription fetch failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert v1.2 response to our expected format
    if (result.data?.transcriptions) {
      return {
        data: {
          transcriptions: result.data.transcriptions,
          status: 'FINISH',
        }
      };
    }
    
    return {
      data: {
        transcriptions: [],
        status: 'PROCESSING',
      }
    };
  }

  async searchVideoFragments(videoNos: string[], searchValue: string): Promise<VideoFragmentResponse> {
    const response = await fetch(`${MEMORIES_API_BASE}/serve/api/v1/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        search_param: searchValue,
        unique_id: this.uniqueId,
        search_type: 'BY_CLIP',
      }),
    });

    if (!response.ok) {
      throw new Error(`Fragment search failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert v1.2 search response to our expected format
    if (result.code === 'SUCCESS' && result.data?.videos) {
      const videos = result.data.videos.map((v: {
        videoNo?: string;
        video_no?: string;
        fragmentStartTime?: number;
        fragmentEndTime?: number;
        similarity?: number;
      }) => ({
        videoNo: v.videoNo || v.video_no,
        fragmentStartTime: v.fragmentStartTime || 0,
        fragmentEndTime: v.fragmentEndTime || 10,
        similarity: v.similarity || 0.7,
      }));
      
      return { data: { videos } };
    }
    
    return { data: { videos: [] } };
  }

  async chatWithVideo(videoNos: string[], message: string): Promise<unknown> {
    const response = await fetch(`${MEMORIES_API_BASE}/serve/api/v1/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ 
        video_nos: videoNos, // v1.2 uses snake_case
        prompt: message,
        session_id: this.uniqueId,
        unique_id: this.uniqueId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return response.json();
  }
}