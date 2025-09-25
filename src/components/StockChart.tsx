import React from 'react';

const StockChart = () => {
  // Mock data for demonstration
  const data = [
    { month: 'Jan', entries: 450, exits: 380 },
    { month: 'Feb', entries: 520, exits: 420 },
    { month: 'Mar', entries: 380, exits: 450 },
    { month: 'Apr', entries: 680, exits: 520 },
    { month: 'May', entries: 590, exits: 480 },
    { month: 'Jun', entries: 420, exits: 350 },
  ];

  const maxValue = Math.max(...data.flatMap(d => [d.entries, d.exits]));

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Stock Entries</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Stock Exits</span>
        </div>
      </div>

      <div className="h-64 flex items-end space-x-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center space-y-2">
            <div className="w-full flex justify-center space-x-1 relative" style={{ height: '200px' }}>
              <div className="relative">
                <div
                  className="w-6 bg-green-500 rounded-t"
                  style={{ height: `${(item.entries / maxValue) * 200}px` }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                  {item.entries}
                </div>
              </div>
              <div className="relative">
                <div
                  className="w-6 bg-red-500 rounded-t"
                  style={{ height: `${(item.exits / maxValue) * 200}px` }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                  {item.exits}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-600">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockChart;