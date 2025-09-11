// LoadingView.tsx — small presentational component for the chat loading state

import React from 'react';

export const LoadingView: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-powder-blue" />
    </div>
  );
};

export default LoadingView;
