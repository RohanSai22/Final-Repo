import React from "react";

export interface TextGenerateEffectProps {
  words: string;
  className?: string;
}

export const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  words,
  className = "",
}) => {
  return <span className={className}>{words}</span>;
};
