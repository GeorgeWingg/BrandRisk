import { NextRequest, NextResponse } from 'next/server';
import { MemoriesClient } from '@/lib/memoriesClient';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.MEMORIES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoNo = searchParams.get('videoNo');

    const client = new MemoriesClient(apiKey);
    const result = await client.getVideoStatus(videoNo || undefined);

    console.log('Status check response:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        error: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}