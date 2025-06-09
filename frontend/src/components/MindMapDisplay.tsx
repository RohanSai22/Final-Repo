import React from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
} from "reactflow";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MindMapDisplayProps {
  // isOpen prop is no longer needed here if AnimatePresence handles conditional rendering in App.tsx
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  mindMapError?: string | null; // New prop for displaying errors
  isGenerating?: boolean;
}

// Basic CSS for React Flow nodes and edges
const reactFlowStyles = `
  .react-flow__node {
    background: #3f3f46;
    color: #d4d4d8; /* neutral-300 */
    border: 1px solid #8b5cf6; /* purple-500 */
    border-radius: 0.375rem; /* rounded-md */
    padding: 8px 12px;
    font-size: 12px;
    min-width: 120px;
    text-align: center;
  }
  .react-flow__node.react-flow__node-input { /* Example for input node type if used */
    background: #5b21b6; /* purple-700 */
    color: #e9d5ff; /* purple-200 */
    border-color: #a78bfa; /* purple-400 */
  }
  .react-flow__edge-path {
    stroke: #8b5cf6; /* purple-500 */
    stroke-width: 1.5;
  }
  .react-flow__edge.animated path {
    animation-duration: 1s;
  }
`;

const MindMapDisplay: React.FC<MindMapDisplayProps> = ({
  onClose,
  nodes,
  edges,
  mindMapError,
  isGenerating,
}) => {
  // Removed if (!isOpen) check, AnimatePresence in App.tsx will handle this.

  const handleInternalClose = () => {
    onClose();
  };

  let content;

  if (mindMapError) {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-200 mb-2">
          Mind Map Generation Failed
        </h3>
        <p className="text-sm text-neutral-400 whitespace-pre-wrap">
          {mindMapError}
        </p>
        <Button
          onClick={handleInternalClose}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white"
        >
          Close
        </Button>
      </div>
    );
  } else if (isGenerating || (nodes.length === 0 && !mindMapError)) {
    // Show loading if isGenerating is true, or if nodes are empty and no error (initial state before nodes arrive)
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
        <p className="text-sm text-neutral-400">
          {isGenerating ? "Generating Mind Map..." : "Loading Mind Map..."}
        </p>
      </div>
    );
  } else if (nodes.length > 0) {
    content = (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-transparent" // Background pattern handled by Background component
      >
        <Controls
          className="[&>button]:bg-neutral-700 [&>button]:border-neutral-600 [&>button_svg]:fill-neutral-300 hover:[&>button]:bg-neutral-600"
          position="bottom-right"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={0.7}
          color="#52525b"
        />{" "}
        {/* neutral-600 */}
      </ReactFlow>
    );
  } else {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-sm text-neutral-500">No mind map data available.</p>
        <Button onClick={handleInternalClose} className="mt-6">
          Close
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{reactFlowStyles}</style>
      {/* This outer div is now the framer-motion component */}
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* The content div for scaling animation */}
        <motion.div
          className="bg-neutral-800 rounded-xl shadow-2xl w-11/12 max-w-5xl h-[85vh] flex flex-col p-1 border border-neutral-700/70"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between p-3.5 border-b border-neutral-700/70">
            <h2 className="text-md font-semibold text-neutral-100">Mind Map</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInternalClose}
              className="text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-grow bg-neutral-850 rounded-b-lg overflow-hidden relative">
            {content}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default MindMapDisplay;

// Add keyframes to your global CSS or a style tag in App.tsx/main.tsx if not already present
/* Custom CSS keyframe animation (.animate-modal-scale-in) is no longer needed here,
   as framer-motion handles the entry/exit animations.
   It should be removed from global.css in a later step.
*/
