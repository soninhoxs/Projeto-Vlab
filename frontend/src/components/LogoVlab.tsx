import React from 'react';

interface LogoVlabProps {
  className?: string;
}

export const LogoVlab: React.FC<LogoVlabProps> = ({ className }) => (
  <img
    src="/logo-vlab.png"
    alt="V-Lab"
    className={className}
  />
);
