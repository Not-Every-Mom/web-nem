import React from 'react';

interface NancyIconProps {
  className?: string;
}

const NancyIcon: React.FC<NancyIconProps> = ({ className = "w-8 h-8" }) => {
  return (
    <img 
      src="/imgs/6b6719cc-915b-488c-b428-dfc54e521a74.png"
      alt="Nurturing hand holding heart"
      className={`${className} object-contain`}
    />
  );
};

export default NancyIcon;