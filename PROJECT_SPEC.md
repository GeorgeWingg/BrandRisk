# Brand Safety Timeline - Hackathon Project

## 🎯 Core Value Proposition
**"Instant brand safety review for any video - get timestamped risk markers in seconds, not hours"**

## 🏗️ Technical Architecture

### Stack Decision (Speed-optimized)
- **Frontend**: Next.js + Tailwind (single page app)
- **Backend**: Next.js API routes → Memories.ai API
- **Database**: **NONE NEEDED** - Memories.ai handles all storage
- **Deployment**: Vercel (2-minute deploy)

### Why No Database?
- Memories.ai stores videos and indexes them
- We get timestamps/clips directly from their API
- For hackathon: localStorage for session data
- Saves 30+ minutes of setup time

## 🎨 UI Flow (Based on Your Sketch)

```
┌─────────────────────────────────────────┐
│           VIDEO PLAYER                  │
│        (HTML5 <video>)                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  TIMELINE ═══🔴═══════🔴═══════════════  │
│  [0:00]     [0:23]    [1:45]    [2:30]  │
└─────────────────────────────────────────┘
```

### Risk Markers (7 GARM Categories)
- 🤬 **Profanity** (from audio transcript)  
- 💋 **Sexual Content** (visual + audio)
- 🍺 **Drugs/Alcohol** (visual search)
- 🔫 **Violence** (visual search) 
- ⚠️ **Hate Speech** (audio transcript)
- 🗞️ **Sensitive Issues** (visual + audio)
- 📣 **Sponsorship** (visual + transcript)

## 🔌 Memories.ai Integration Plan

### Core API Endpoints We'll Use:
1. **Upload**: `POST /api/serve/video/upload` → get videoNo
2. **Status Check**: `GET /api/serve/video/searchDB` → wait for PARSE status  
3. **Audio Transcript**: `POST /api/serve/video/subTranscription` → get text with timestamps
4. **Visual Search**: `POST /api/serve/video/searchVideoFragment` → find risky clips
5. **Video Chat**: `POST /api/serve/video/chat` → consolidate findings

### Detection Strategy:
```javascript
// For each category, run parallel searches:
const searches = [
  { category: "Profanity", query: "swearing or profanity or explicit language" },
  { category: "Violence", query: "fighting, weapons, blood, or violent content" },
  { category: "Sexual", query: "sexual content, nudity, or adult material" },
  { category: "Drugs", query: "smoking, drinking, drugs, or substance use" },
  // ... etc
];

// Combine with audio transcript analysis for precision
```

## 🚀 MVP Features (1.5 Hour Build)

### Hour 1: Core Functionality
- [ ] Next.js setup with Tailwind
- [ ] Upload component → Memories.ai API  
- [ ] Video player with basic timeline
- [ ] API routes for Memories.ai integration

### Hour 0.5: Polish & Demo Prep
- [ ] Timeline markers with click-to-jump
- [ ] Risk category icons and tooltips  
- [ ] Export functionality (JSON/CSV)
- [ ] Demo script and sample video

## 📊 Demo Flow (90 seconds)
1. **Problem**: "Manual brand safety review takes 3+ hours per video"
2. **Upload**: Drop in sample ad video → processing spinner  
3. **Magic Moment**: Timeline populates with risk markers instantly
4. **Interaction**: Click marker → jump to exact timestamp → show evidence
5. **Value**: "Export report → hand to editor → save 3 hours"

## 🎪 Hackathon Win Factors
- ✅ **Judge-friendly**: Brand safety is universally understood
- ✅ **Polished UI**: Video player + interactive timeline looks professional  
- ✅ **Memories.ai showcase**: Multi-modal search across video+audio content
- ✅ **Magic moment**: Instant timeline markers feel impossible without AI
- ✅ **Business value**: Clear ROI story (time saved, risk reduction)

## 🔧 File Structure
```
/pages
  /api
    /memories
      upload.js       // Proxy to Memories.ai upload
      status.js       // Check video processing status
      analyze.js      // Run brand safety analysis
      export.js       // Generate CSV/JSON reports
  index.js           // Main timeline interface

/components  
  VideoPlayer.js     // HTML5 video with timeline
  TimelineMarker.js  // Risk indicator components  
  UploadZone.js      // Drag-drop video upload
  
/lib
  memoriesClient.js  // Memories.ai API wrapper
  riskCategories.js  // GARM category definitions
```

## 🎯 Success Metrics
- Video upload + analysis < 30 seconds
- Timeline markers clickable and accurate
- Export generates valid reports
- Judges understand value in 10 seconds
- Demo runs smoothly without crashes

---
**Time Budget**: 90 minutes coding + prep time  
**Deploy Target**: https://your-app.vercel.app  
**Backup Plan**: Pre-recorded demo if live upload fails