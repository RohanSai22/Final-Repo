import React from "react";

export interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`bg-gradient-to-br from-neutral-800 to-neutral-900 ${className}`}
    >
      {children}
    </div>
  );
};
