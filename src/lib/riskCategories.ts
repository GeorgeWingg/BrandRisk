export interface RiskCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  searchQueries: string[];
  severity: 'Floor' | 'High' | 'Medium' | 'Low';
  description: string;
}

export const RISK_CATEGORIES: RiskCategory[] = [
  {
    id: 'profanity',
    name: 'Profanity',
    icon: '🤬',
    color: 'bg-red-500',
    searchQueries: [
      'profanity or swear words or explicit language',
      'offensive language or cursing',
    ],
    severity: 'Medium',
    description: 'Explicit language, swearing, or offensive speech',
  },
  {
    id: 'sexual',
    name: 'Sexual Content',
    icon: '💋',
    color: 'bg-pink-500',
    searchQueries: [
      'sexual content or nudity or adult material',
      'suggestive content or intimate scenes',
    ],
    severity: 'High',
    description: 'Sexual content, nudity, or adult material',
  },
  {
    id: 'drugs_alcohol',
    name: 'Drugs & Alcohol',
    icon: '🍺',
    color: 'bg-yellow-500',
    searchQueries: [
      'smoking or drinking or alcohol consumption',
      'drugs or substance use or vaping',
      'cigarettes or beer or wine or pills',
    ],
    severity: 'Medium',
    description: 'Drug use, alcohol consumption, or substance abuse',
  },
  {
    id: 'violence',
    name: 'Violence',
    icon: '🔫',
    color: 'bg-red-600',
    searchQueries: [
      'violence or fighting or weapons',
      'blood or assault or aggressive behavior',
      'guns or knives or dangerous weapons',
    ],
    severity: 'Floor',
    description: 'Violence, weapons, or aggressive behavior',
  },
  {
    id: 'hate_speech',
    name: 'Hate Speech',
    icon: '⚠️',
    color: 'bg-orange-500',
    searchQueries: [
      'hate speech or discriminatory language',
      'slurs or derogatory language toward protected groups',
    ],
    severity: 'Floor',
    description: 'Discriminatory language or hate speech',
  },
  {
    id: 'sensitive_issues',
    name: 'Sensitive Issues',
    icon: '🗞️',
    color: 'bg-blue-500',
    searchQueries: [
      'political content or controversial topics',
      'war or terrorism or tragic events',
      'elections or protests or social unrest',
    ],
    severity: 'Medium',
    description: 'Political content, news, or controversial topics',
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship Issues',
    icon: '📣',
    color: 'bg-green-500',
    searchQueries: [
      'sponsored content or paid partnership',
      'advertisement or promotional content',
      'brand mentions or product placement',
    ],
    severity: 'Low',
    description: 'Undisclosed sponsorship or advertising content',
  },
];

export interface RiskEvent {
  id: string;
  videoNo: string;
  category: RiskCategory;
  startTime: number;
  endTime: number;
  confidence: number;
  evidence: string;
  severity: 'Floor' | 'High' | 'Medium' | 'Low';
  source: 'visual' | 'audio' | 'transcript';
}

export function calculateRiskScore(events: RiskEvent[]): number {
  if (events.length === 0) return 0;
  
  const severityScores = {
    'Floor': 100,
    'High': 80,
    'Medium': 50,
    'Low': 20,
  };
  
  // Calculate weighted average based on severity and confidence
  const totalScore = events.reduce((sum, event) => {
    const baseScore = severityScores[event.severity];
    const weightedScore = baseScore * event.confidence;
    return sum + weightedScore;
  }, 0);
  
  return Math.min(100, Math.round(totalScore / events.length));
}

export function getRiskLevel(score: number): { level: string; color: string } {
  if (score >= 80) return { level: 'High Risk', color: 'text-red-600' };
  if (score >= 50) return { level: 'Medium Risk', color: 'text-yellow-600' };
  if (score >= 20) return { level: 'Low Risk', color: 'text-green-600' };
  return { level: 'Safe', color: 'text-green-500' };
}