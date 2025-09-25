import React from 'react';

const PrescriptionChart = () => {
  // Mock data for demonstration
  const data = [
    { month: 'Jan', approved: 120, rejected: 15, pending: 8 },
    { month: 'Feb', approved: 145, rejected: 12, pending: 6 },
    { month: 'Mar', approved: 98, rejected: 18, pending: 10 },
    { month: 'Apr', approved: 156, rejected: 9, pending: 12 },
    { month: 'May', approved: 134, rejected: 14, pending: 7 },
    { month: 'Jun', approved: 89, rejected: 8, pending: 5 },
  ];

  const maxValue = Math.max(...data.map(d => d.approved + d.rejected + d.pending));

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Approved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Rejected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
      </div>

      <div className="h-64 flex items-end space-x-6">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center space-y-2">
            <div className="w-full flex justify-center relative" style={{ height: '200px' }}>
              <div className="w-8 relative">
                <div
                  className="w-full bg-green-500 absolute bottom-0"
                  style={{ height: `${(item.approved / maxValue) * 200}px` }}
                ></div>
                <div
                  className="w-full bg-red-500 absolute"
                  style={{ 
                    height: `${(item.rejected / maxValue) * 200}px`,
                    bottom: `${(item.approved / maxValue) * 200}px`
                  }}
                ></div>
                <div
                  className="w-full bg-yellow-500 rounded-t absolute"
                  style={{ 
                    height: `${(item.pending / maxValue) * 200}px`,
                    bottom: `${((item.approved + item.rejected) / maxValue) * 200}px`
                  }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                  {item.approved + item.rejected + item.pending}
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

export default PrescriptionChart;