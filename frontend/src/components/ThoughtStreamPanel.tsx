import React, { useState, useEffect, useRef } from "react";
import { CognitiveBlockData } from "@/types/cognitive";
import { CognitiveBlock } from "./CognitiveBlock";
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { BackgroundGradient } from "@/components/ui/background-gradient";

interface ThoughtStreamPanelProps {
  stream: CognitiveBlockData[];
  isThinking: boolean;
  panelTitle?: string;
  className?: string; // Allow passing additional class names
}

export const ThoughtStreamPanel: React.FC<ThoughtStreamPanelProps> = ({
  stream,
  isThinking,
  panelTitle = "AI's Thought Process",
  className = "",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream, isThinking, isCollapsed]);

  return (
    <BackgroundGradient
      className={`w-full max-w-sm mx-auto rounded-xl p-0.5 ${className}`}
    >
      <div className="bg-neutral-900 backdrop-blur-sm rounded-[10px] text-neutral-200 w-full">
        {" "}
        {/* Solid bg, less opacity for inner if needed */}
        <button
          className="flex items-center justify-between w-full p-3 cursor-pointer hover:bg-neutral-800/60 rounded-t-[10px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="thought-stream-content"
        >
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-purple-400/80" />
            <h3 className="text-xs font-medium tracking-wide uppercase">
              {panelTitle}
            </h3>
          </div>
          <div className="text-neutral-400 hover:text-neutral-100 p-1 h-auto">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </div>
        </button>
        {!isCollapsed && (
          <div
            id="thought-stream-content"
            ref={scrollRef}
            className="px-2 pt-2 pb-3 border-t border-neutral-800 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850 scrollbar-thumb-rounded-full" // Slightly darker border for inner content
          >
            {stream.length === 0 && !isThinking && (
              <p className="text-xs text-neutral-500 italic text-center py-6">
                No thoughts to display.
              </p>
            )}

            <AnimatePresence initial={false}>
              {" "}
              {/* initial={false} to prevent all items animating on first load if already present */}
              {stream.map((block, index) => (
                <CognitiveBlock
                  key={block.id}
                  block={block}
                  isFirst={index === 0}
                  isLast={index === stream.length - 1}
                />
              ))}
            </AnimatePresence>

            {isThinking && (
              <div className="flex items-center justify-center p-3 text-xs text-purple-300/70 opacity-80 mt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </BackgroundGradient>
  );
};
