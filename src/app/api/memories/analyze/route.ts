import { NextRequest, NextResponse } from 'next/server';
import { MemoriesClient } from '@/lib/memoriesClient';
import { RISK_CATEGORIES, RiskEvent, calculateRiskScore } from '@/lib/riskCategories';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.MEMORIES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { videoNo } = await request.json();
    if (!videoNo) {
      return NextResponse.json(
        { error: 'Video number required' },
        { status: 400 }
      );
    }

    const client = new MemoriesClient(apiKey);
    
    // Start transcription
    console.log('Starting transcription...');
    const transcriptionJob = await client.startTranscription(videoNo, 'AUDIO');
    
    // Poll for transcription completion (simplified for hackathon)
    let transcriptionResult;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      transcriptionResult = await client.getTranscription(transcriptionJob.data.taskNo);
      
      if (transcriptionResult.data.status === 'FINISH') {
        break;
      }
      attempts++;
    }
    
    if (!transcriptionResult || transcriptionResult.data.status !== 'FINISH') {
      console.warn('Transcription incomplete, proceeding with visual analysis only');
    }

    // Analyze transcript for text-based risks (profanity, hate speech)
    const transcriptEvents: RiskEvent[] = [];
    if (transcriptionResult?.data.transcriptions) {
      const profanityWords = ['fuck', 'shit', 'damn', 'hell', 'bitch', 'ass'];
      
      transcriptionResult.data.transcriptions.forEach(segment => {
        const text = segment.content.toLowerCase();
        
        // Check for profanity
        const foundProfanity = profanityWords.some(word => text.includes(word));
        if (foundProfanity) {
          transcriptEvents.push({
            id: `transcript-${segment.startTime}`,
            videoNo,
            category: RISK_CATEGORIES.find(c => c.id === 'profanity')!,
            startTime: segment.startTime,
            endTime: segment.endTime,
            confidence: 0.85,
            evidence: `Transcript: "${segment.content.substring(0, 50)}..."`,
            severity: 'Medium',
            source: 'transcript',
          });
        }
      });
    }

    // Run visual searches for each category
    console.log('Running visual analysis...');
    const visualEvents: RiskEvent[] = [];
    
    for (const category of RISK_CATEGORIES) {
      // Skip profanity for visual search as we handle it via transcript
      if (category.id === 'profanity') continue;
      
      try {
        for (const query of category.searchQueries) {
          const fragments = await client.searchVideoFragments([videoNo], query);
          
          fragments.data.videos.forEach(fragment => {
            // Only include high-confidence matches
            if (fragment.similarity > 0.6) {
              visualEvents.push({
                id: `visual-${category.id}-${fragment.fragmentStartTime}`,
                videoNo,
                category,
                startTime: fragment.fragmentStartTime,
                endTime: fragment.fragmentEndTime,
                confidence: fragment.similarity,
                evidence: `Visual match: "${query}"`,
                severity: category.severity,
                source: 'visual',
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to search for ${category.name}:`, error);
      }
    }

    // Combine and deduplicate events
    const allEvents = [...transcriptEvents, ...visualEvents];
    
    // Simple deduplication based on time overlap
    const deduplicatedEvents = allEvents.filter((event, index, array) => {
      return !array.slice(0, index).some(existing => 
        existing.category.id === event.category.id &&
        Math.abs(existing.startTime - event.startTime) < 5 // Within 5 seconds
      );
    });

    // Sort by start time
    deduplicatedEvents.sort((a, b) => a.startTime - b.startTime);

    // Calculate overall risk score
    const riskScore = calculateRiskScore(deduplicatedEvents);

    return NextResponse.json({
      success: true,
      data: {
        videoNo,
        events: deduplicatedEvents,
        riskScore,
        transcriptAvailable: !!transcriptionResult?.data.transcriptions,
        summary: {
          totalEvents: deduplicatedEvents.length,
          highRiskEvents: deduplicatedEvents.filter(e => e.severity === 'Floor' || e.severity === 'High').length,
          categoriesDetected: [...new Set(deduplicatedEvents.map(e => e.category.name))],
        }
      },
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}