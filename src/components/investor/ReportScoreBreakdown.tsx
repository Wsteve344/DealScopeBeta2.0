import React from 'react';
import { DollarSign, TrendingUp, MapPin, Users, Wrench, Landmark, ArrowUpRight } from 'lucide-react';
import type { DealScore } from '../../lib/types';

interface ReportScoreBreakdownProps {
  score: DealScore;
}

const ReportScoreBreakdown: React.FC<ReportScoreBreakdownProps> = ({ score }) => {
  const getScoreColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scoreCategories = [
    { name: 'Cash Flow', value: score.cashFlow, max: 15, icon: DollarSign },
    { name: 'Appreciation', value: score.appreciation, max: 10, icon: TrendingUp },
    { name: 'ARV vs Purchase', value: score.arvVsPurchase, max: 10, icon: ArrowUpRight },
    { name: 'Location Quality', value: score.locationQuality, max: 10, icon: MapPin },
    { name: 'Rent Demand', value: score.rentDemand, max: 10, icon: Users },
    { name: 'Rehab Complexity', value: score.rehabComplexity, max: 10, icon: Wrench },
    { name: 'Financing Readiness', value: score.financingReadiness, max: 10, icon: Landmark },
    { name: 'Exit Strategies', value: score.exitStrategies, max: 10, icon: ArrowUpRight },
    { name: 'Tenant Profile', value: score.tenantProfile, max: 5, icon: Users },
    { name: 'Property Type', value: score.propertyType, max: 5, icon: Building2 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Deal Score Breakdown</h2>
        <div className={`text-2xl font-bold ${getScoreColor(score.total, 100)}`}>
          {score.total}/100
        </div>
      </div>

      <div className="space-y-4">
        {scoreCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.name} className="flex items-center">
              <Icon className="h-5 w-5 text-gray-400 mr-3" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className={`text-sm font-medium ${getScoreColor(category.value, category.max)}`}>
                    {category.value}/{category.max}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      getScoreColor(category.value, category.max).replace('text-', 'bg-')
                    }`}
                    style={{ width: `${(category.value / category.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportScoreBreakdown;