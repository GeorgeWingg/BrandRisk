'use client';

import { useState, useEffect } from 'react';
import { RiskEvent, getRiskLevel } from '@/lib/riskCategories';

interface KeyMetricsDashboardProps {
  events: RiskEvent[];
  riskScore: number;
  duration: number;
  isAnalyzing: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  animate?: boolean;
}

function MetricCard({ title, value, subtitle, icon, color, animate = false }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (animate && typeof value === 'number') {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, animate]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {animate && typeof value === 'number' ? displayValue : value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

export default function KeyMetricsDashboard({ events, riskScore, duration, isAnalyzing }: KeyMetricsDashboardProps) {
  const riskLevel = getRiskLevel(riskScore);
  
  const affectedDuration = events.reduce((total, event) => {
    return total + (event.endTime - event.startTime);
  }, 0);
  
  const affectedPercentage = duration > 0 ? (affectedDuration / duration) * 100 : 0;
  
  const peakRiskMoment = events.reduce((peak, event) => {
    const eventScore = event.severity === 'Floor' ? 100 : 
                     event.severity === 'High' ? 80 :
                     event.severity === 'Medium' ? 50 : 20;
    const weightedScore = eventScore * event.confidence;
    
    if (weightedScore > peak.score) {
      return { time: event.startTime, score: weightedScore };
    }
    return peak;
  }, { time: 0, score: 0 });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSuitabilityGrade = (score: number): string => {
    if (score >= 80) return 'D';
    if (score >= 60) return 'C';
    if (score >= 30) return 'B';
    return 'A';
  };

  const getSuitabilityColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'border-green-500';
      case 'B': return 'border-yellow-500';
      case 'C': return 'border-orange-500';
      case 'D': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Risk Score"
        value={riskScore}
        subtitle={`${riskLevel.level} - ${events.length} events detected`}
        icon="⚠️"
        color="border-red-500"
        animate={true}
      />
      
      <MetricCard
        title="Content Affected"
        value={`${affectedPercentage.toFixed(1)}%`}
        subtitle={`${formatTime(affectedDuration)} of ${formatTime(duration)}`}
        icon="📊"
        color="border-blue-500"
      />
      
      <MetricCard
        title="Peak Risk Moment"
        value={formatTime(peakRiskMoment.time)}
        subtitle={`Highest concentration detected`}
        icon="📈"
        color="border-orange-500"
      />
      
      <MetricCard
        title="Advertiser Rating"
        value={getSuitabilityGrade(riskScore)}
        subtitle="Brand safety suitability grade"
        icon="🎯"
        color={getSuitabilityColor(getSuitabilityGrade(riskScore))}
      />
    </div>
  );
}