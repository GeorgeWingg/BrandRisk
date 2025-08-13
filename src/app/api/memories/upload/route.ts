import { NextRequest, NextResponse } from 'next/server';
import { MemoriesClient } from '@/lib/memoriesClient';

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment
    const apiKey = process.env.MEMORIES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Initialize Memories client and upload
    const client = new MemoriesClient(apiKey);
    const result = await client.uploadVideo(file);

    console.log('Memories.ai upload response:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      data: result.data || result, // Handle case where result might not have .data wrapper
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}