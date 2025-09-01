import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'green' | 'yellow';
  trend?: {
    value: number;
    label: string;
  };
  format?: 'number' | 'decimal' | 'percentage';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  format = 'number'
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
  };

  const formatValue = (val: number) => {
    switch (format) {
      case 'decimal':
        return val.toFixed(1);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toString();
    }
  };

  const trendColor = trend && trend.value > 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend && trend.value > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {formatValue(value)}
              </dd>
            </dl>
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <TrendIcon className={`h-4 w-4 mr-1 ${trendColor}`} />
            <span className={trendColor}>
              {Math.abs(trend.value)}{format === 'percentage' ? 'pp' : ''}
            </span>
            <span className="text-gray-500 ml-1">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
