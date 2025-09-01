import React from 'react';

const RiskHeatMap: React.FC = () => {
  // Mock data for heat map - 5x5 grid (likelihood x impact)
  const heatMapData = [
    [1, 2, 3, 4, 5], // Very Low likelihood
    [2, 4, 6, 8, 10], // Low likelihood
    [3, 6, 9, 12, 15], // Medium likelihood
    [4, 8, 12, 16, 20], // High likelihood
    [5, 10, 15, 20, 25], // Very High likelihood
  ];

  const likelihoodLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const impactLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

  const getRiskColor = (score: number) => {
    if (score <= 5) return 'bg-green-200 text-green-800';
    if (score <= 10) return 'bg-yellow-200 text-yellow-800';
    if (score <= 15) return 'bg-orange-200 text-orange-800';
    return 'bg-red-200 text-red-800';
  };

  const getRiskLevel = (score: number) => {
    if (score <= 5) return 'Low';
    if (score <= 10) return 'Medium';
    if (score <= 15) return 'High';
    return 'Critical';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-1 text-xs">
        {/* Header row */}
        <div></div>
        {impactLabels.map((label, index) => (
          <div key={index} className="text-center font-medium text-gray-700 p-2">
            {label}
          </div>
        ))}
        
        {/* Heat map rows */}
        {heatMapData.map((row, likelihoodIndex) => (
          <React.Fragment key={likelihoodIndex}>
            {/* Likelihood label */}
            <div className="flex items-center justify-end pr-2 font-medium text-gray-700">
              {likelihoodLabels[likelihoodIndex]}
            </div>
            
            {/* Risk cells */}
            {row.map((score, impactIndex) => (
              <div
                key={`${likelihoodIndex}-${impactIndex}`}
                className={`
                  h-12 flex items-center justify-center rounded border cursor-pointer
                  transition-all duration-200 hover:scale-105 hover:shadow-md
                  ${getRiskColor(score)}
                `}
                title={`Likelihood: ${likelihoodLabels[likelihoodIndex]}, Impact: ${impactLabels[impactIndex]}, Score: ${score}, Level: ${getRiskLevel(score)}`}
              >
                <span className="font-medium">{score}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-200 rounded mr-1"></div>
          <span>Low (1-5)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-200 rounded mr-1"></div>
          <span>Medium (6-10)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-200 rounded mr-1"></div>
          <span>High (11-15)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-200 rounded mr-1"></div>
          <span>Critical (16-25)</span>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500">
        <p><strong>Impact →</strong></p>
        <p><strong>↑ Likelihood</strong></p>
      </div>
    </div>
  );
};

export default RiskHeatMap;
