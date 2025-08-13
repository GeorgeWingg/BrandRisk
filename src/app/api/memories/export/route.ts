import { NextRequest, NextResponse } from 'next/server';
import { RiskEvent, getRiskLevel } from '@/lib/riskCategories';

export async function POST(request: NextRequest) {
  try {
    const { events, format, videoNo, riskScore } = await request.json();
    
    if (!events || !format) {
      return NextResponse.json(
        { error: 'Events and format required' },
        { status: 400 }
      );
    }

    const riskLevel = getRiskLevel(riskScore);

    switch (format.toLowerCase()) {
      case 'json':
        return NextResponse.json({
          success: true,
          data: {
            videoNo,
            generatedAt: new Date().toISOString(),
            riskScore,
            riskLevel: riskLevel.level,
            totalEvents: events.length,
            events: events.map((event: RiskEvent) => ({
              category: event.category.name,
              startTime: event.startTime,
              endTime: event.endTime,
              duration: event.endTime - event.startTime,
              severity: event.severity,
              confidence: Math.round(event.confidence * 100),
              evidence: event.evidence,
              source: event.source,
            })),
            summary: {
              categoriesDetected: [...new Set(events.map((e: RiskEvent) => e.category.name))],
              highRiskEvents: events.filter((e: RiskEvent) => e.severity === 'Floor' || e.severity === 'High').length,
              averageConfidence: Math.round(events.reduce((sum: number, e: RiskEvent) => sum + e.confidence, 0) / events.length * 100) || 0,
            }
          }
        });

      case 'csv':
        const csvHeaders = 'Category,Start Time (s),End Time (s),Duration (s),Severity,Confidence (%),Evidence,Source';
        const csvRows = events.map((event: RiskEvent) => {
          return [
            event.category.name,
            event.startTime.toFixed(2),
            event.endTime.toFixed(2),
            (event.endTime - event.startTime).toFixed(2),
            event.severity,
            Math.round(event.confidence * 100),
            `"${event.evidence.replace(/"/g, '""')}"`, // Escape quotes in CSV
            event.source,
          ].join(',');
        });
        
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="brand-safety-report-${videoNo}.csv"`,
          },
        });

      case 'srt':
        // Generate SRT subtitle file with risk markers
        let srtContent = '';
        events.forEach((event: RiskEvent, index: number) => {
          const startTimeStr = formatSRTTime(event.startTime);
          const endTimeStr = formatSRTTime(event.endTime);
          
          srtContent += `${index + 1}\n`;
          srtContent += `${startTimeStr} --> ${endTimeStr}\n`;
          srtContent += `[${event.category.icon} ${event.category.name}] ${event.evidence}\n\n`;
        });
        
        return new NextResponse(srtContent, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="brand-safety-markers-${videoNo}.srt"`,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: json, csv, or srt' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}