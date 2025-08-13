# Brand Safety Timeline

AI-powered video content analysis for brand safety compliance. Built with Next.js and powered by Memories.ai.

## 🎯 Features

- **Instant Video Analysis**: Upload videos and get brand safety analysis in seconds
- **Interactive Timeline**: Visual timeline with clickable risk markers  
- **GARM Categories**: Detects profanity, violence, sexual content, drugs/alcohol, hate speech, sensitive issues, and sponsorship
- **Multiple Export Formats**: Export reports as JSON, CSV, or SRT subtitle files
- **Real-time Processing**: Live progress indicators and instant results

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Memories.ai API

1. Get your API key from [Memories.ai](https://mavi-backend.memories.ai)
2. Create account → API section → Create new API key
3. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Add your API key to `.env.local`:

```env
MEMORIES_API_KEY=your_memories_ai_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📝 Usage

1. **Upload Video**: Drag and drop a video file (MP4, AVI, MOV, etc.) up to 100MB
2. **Wait for Analysis**: The system will upload and analyze your video using AI
3. **Review Timeline**: Click on risk markers to jump to specific moments
4. **Export Results**: Download analysis reports in JSON, CSV, or SRT format

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Analysis**: Memories.ai (video indexing, search, transcription)
- **File Handling**: react-dropzone
- **Deployment**: Vercel-ready

## 📊 Risk Categories (GARM Standards)

- 🤬 **Profanity**: Explicit language and swearing
- 💋 **Sexual Content**: Adult material and suggestive content  
- 🍺 **Drugs & Alcohol**: Substance use and consumption
- 🔫 **Violence**: Weapons, fighting, and aggressive behavior
- ⚠️ **Hate Speech**: Discriminatory language
- 🗞️ **Sensitive Issues**: Political content and controversial topics
- 📣 **Sponsorship**: Undisclosed advertising content

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/memories/          # API routes for Memories.ai integration
│   │   ├── upload/           # Video upload endpoint
│   │   ├── status/           # Processing status check
│   │   ├── analyze/          # Brand safety analysis
│   │   └── export/           # Report export (JSON/CSV/SRT)
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main application page
├── components/
│   ├── VideoPlayer.tsx       # Video player with timeline
│   └── UploadZone.tsx        # File upload component
└── lib/
    ├── memoriesClient.ts     # Memories.ai API wrapper
    └── riskCategories.ts     # GARM category definitions
```

## 🚀 Deploy on Vercel

1. Connect your repository to Vercel
2. Add environment variable: `MEMORIES_API_KEY`
3. Deploy automatically

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/brand-safety-timeline)

## 🎪 Hackathon Demo Script

1. **Problem**: "Manual brand safety review takes 3+ hours per video"
2. **Upload**: Drop in sample ad video → processing spinner  
3. **Magic Moment**: Timeline populates with risk markers instantly
4. **Interaction**: Click marker → jump to exact timestamp → show evidence
5. **Value**: "Export report → hand to editor → save 3 hours"

## 📄 License

Built for AI Engine Hackathon. Open source MIT license.
