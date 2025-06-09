import React from "react";
import { CognitiveBlockData } from "@/types/cognitive";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Brain,
  Zap,
  ClipboardCheck,
  ListChecks,
  Search,
  Globe,
  Terminal,
  PenTool,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTypewriter } from "@/hooks/useTypewriter"; // New import

interface CognitiveBlockProps {
  block: CognitiveBlockData;
  isLast: boolean;
  isFirst: boolean;
}

// Define a specific type for valid icon keys if not all CognitiveBlockData types are used
type MappedIconType =
  | "hypothesis"
  | "action"
  | "analysis"
  | "strategy"
  | "search_queries"
  | "web_research"
  | "reflection"
  | "code_execution"
  | "finalizing_answer";

const iconMap: Record<MappedIconType, React.ElementType> & {
  default: React.ElementType;
} = {
  hypothesis: Lightbulb,
  action: Zap,
  analysis: ClipboardCheck, // Or BarChart2
  strategy: ListChecks, // Or MapIcon
  search_queries: Search,
  web_research: Globe, // Or Network
  reflection: Brain,
  code_execution: Terminal, // Or Code2
  finalizing_answer: PenTool,
  default: Activity,
};

export const CognitiveBlock: React.FC<CognitiveBlockProps> = ({
  block,
  isLast,
  isFirst,
}) => {
  const IconComponent =
    iconMap[block.type as MappedIconType] || iconMap.default;
  const animatedText = useTypewriter(block.content.text, 30); // Use typewriter for main text

  const renderDetails = (blockData: CognitiveBlockData) => {
    const { details } = blockData.content;
    if (!details) return null;

    if (
      blockData.type === "code_execution" &&
      typeof details === "object" &&
      details !== null &&
      ("code" in details || "output" in details)
    ) {
      const code = "code" in details ? String(details.code) : null;
      const output = "output" in details ? String(details.output) : null;
      // Could also have 'error' in details

      return (
        <div className="mt-1.5 space-y-1.5">
          {code && (
            <div>
              <p className="text-xs font-medium text-neutral-400 mb-0.5">
                Executed Code:
              </p>
              <pre className="p-2 bg-neutral-900/70 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850">
                <code>{code}</code>
              </pre>
            </div>
          )}
          {output && (
            <div>
              <p className="text-xs font-medium text-neutral-400 mb-0.5">
                Output:
              </p>
              <pre className="p-2 bg-neutral-900/70 rounded text-xs text-neutral-400 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850 max-h-40">
                <code>{output}</code>
              </pre>
            </div>
          )}
          {/* Consider adding an error field display if your E2B events might include it */}
        </div>
      );
    }

    if (Array.isArray(details)) {
      if (details.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {details.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs bg-neutral-700 text-neutral-300 border-neutral-600 px-1.5 py-0.5 font-normal"
            >
              {item}
            </Badge>
          ))}
        </div>
      );
    }
    if (typeof details === "object" && Object.keys(details).length > 0) {
      return (
        <pre className="mt-1.5 p-1.5 bg-neutral-900/70 rounded text-xs text-neutral-400 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850">
          {JSON.stringify(details, null, 2)}
        </pre>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }} // Subtler entry
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative pl-8 pr-1 pb-5"
    >
      {/* Timeline Line: Conditional rendering for first/last */}
      {!isFirst && (
        <div className="absolute left-[13px] top-0 h-4 w-0.5 bg-neutral-700" /> // Connector from previous block's icon to current icon top
      )}
      {!isLast && (
        <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-neutral-700" /> // Connector from current icon bottom
      )}

      {/* Icon Container on Timeline */}
      <div className="absolute left-0 top-4 transform -translate-x-0 flex items-center justify-center">
        {" "}
        {/* Adjusted left to align with new pl */}
        <div className="h-7 w-7 rounded-full bg-neutral-850 border-2 border-neutral-700 flex items-center justify-center shadow-md">
          <IconComponent className="h-3.5 w-3.5 text-purple-400" />
        </div>
      </div>

      {/* Content Area */}
      <div className="ml-6 p-3 rounded-lg bg-neutral-800 border border-neutral-700/60 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out">
        {" "}
        {/* Increased padding, rounded-lg, hover:shadow-lg */}
        {block.content.title && (
          <h4 className="text-xs font-semibold text-neutral-200 mb-0.5 flex items-center">
            {block.content.title}
          </h4>
        )}
        <p className="text-xs text-neutral-300 leading-relaxed min-h-[1.5em]">
          {animatedText}
        </p>
        {renderDetails(block)}
        {block.timestamp && (
          <p className="text-[10px] text-neutral-500/80 mt-1.5 pt-1 border-t border-neutral-700/50 text-right">
            {" "}
            {/* Lighter timestamp */}
            {new Date(block.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
};
