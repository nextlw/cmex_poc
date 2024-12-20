import React from "react";

const WireframeLoading: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-700/50 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
      </div>
      <div className="bg-gray-700/50 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
      </div>
      <div className="bg-gray-700/50 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-2/3"></div>
      </div>
    </div>
  );
};

export default WireframeLoading;
