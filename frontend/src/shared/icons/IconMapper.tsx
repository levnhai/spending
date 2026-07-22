import React from 'react';
import * as Icons from 'lucide-react';

interface IconMapperProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconMapper: React.FC<IconMapperProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = (Icons as any)[name] || Icons.Tag;
  return <IconComponent className={className} size={size} />;
};
