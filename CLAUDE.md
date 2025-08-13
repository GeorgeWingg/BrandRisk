# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Required Environment Variables

Create `.env.local` with:
```
MEMORIES_API_KEY=sk-eb7e492b63b2b76db877d0fecc63ff17
```

## Architecture Overview

BrandRisk is a Next.js application that analyzes video content for brand safety compliance using Memories.ai API. The system follows a pipeline architecture:

### Core Pipeline Flow
1. **Upload** → Video files are uploaded to Memories.ai via `/api/memories/upload`
2. **Processing** → Status polling via `/api/memories/status` until video is vectorized
3. **Analysis** → Dual analysis via `/api/memories/analyze`:
   - **Transcript Analysis**: Hardcoded profanity detection on audio transcriptions
   - **Visual Analysis**: AI similarity search across 7 GARM risk categories
4. **Timeline** → Interactive visualization with clickable risk markers
5. **Export** → Generate reports in JSON/CSV/SRT formats via `/api/memories/export`

### Key Integration Patterns

**Memories.ai Client** (`src/lib/memoriesClient.ts`):
- Wraps Memories.ai v1.2 API with consistent `unique_id: 'brand-safety-app'`
- Handles response format conversion between API versions
- Core methods: `uploadVideo()`, `getVideoStatus()`, `searchVideoFragments()`, `getTranscription()`

**Risk Categories** (`src/lib/riskCategories.ts`):
- Defines 7 GARM-compliant categories with search queries and severity levels
- Implements risk scoring algorithm: weighted by severity × confidence
- Categories: Profanity (transcript), Sexual Content, Violence, Drugs/Alcohol, Hate Speech, Sensitive Issues, Sponsorship

**Analysis Logic** (`src/app/api/memories/analyze/route.ts`):
- **Transcript**: Basic profanity word matching (`['fuck', 'shit', 'damn', 'hell', 'bitch', 'ass']`)
- **Visual**: Semantic search using category-specific queries with >60% similarity threshold
- **Deduplication**: Merges events within 5-second windows
- **Scoring**: Floor=100, High=80, Medium=50, Low=20 (weighted by confidence)

### Component Architecture

**VideoPlayer** (`src/components/VideoPlayer.tsx`):
- Renders HTML5 video with interactive timeline overlay
- Timeline markers positioned by `(startTime / duration) * 100%`
- Click handlers jump to specific timestamps

**UploadZone** (`src/components/UploadZone.tsx`):
- react-dropzone integration for drag-and-drop uploads
- Extracts `videoNo` from Memories.ai upload response
- Handles processing status polling with timeout fallbacks

### API Route Patterns

All API routes in `/api/memories/` follow consistent patterns:
- Environment variable validation for `MEMORIES_API_KEY`
- MemoriesClient instantiation with error handling
- Structured JSON responses with `{ success: boolean, data: any, error?: string }`
- TypeScript interfaces for request/response validation

### Known Technical Debt

**TypeScript Issues** (blocking Vercel deployment):
- `memoriesClient.ts:96` - Replace `any` types with proper interfaces
- `UploadZone.tsx:56` - Fix `extractVideoNo(result: any)` typing
- Image optimization warnings - replace `<img>` with Next.js `<Image>`

**Processing Limitations**:
- 1-minute timeout on transcription polling (demo-friendly but incomplete)
- Basic profanity list (hardcoded, no fuzzy matching)
- Visual search limited to English queries

### File Upload Constraints
- Max file size: 100MB (enforced by react-dropzone)
- Supported formats: MP4, AVI, MOV, WebM
- Processing time: ~2 minutes for small videos (800KB, 11 seconds)

### Export Formats
- **JSON**: Complete analysis data with events, scores, metadata
- **CSV**: Tabular format for spreadsheet analysis
- **SRT**: Subtitle format for video editing workflows