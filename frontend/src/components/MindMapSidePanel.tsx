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

interface MindMapSidePanelProps {
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  mindMapError?: string | null;
  isGenerating?: boolean;
}

// CSS for React Flow nodes and edges in side panel
const reactFlowStyles = `
  .react-flow__node {
    background: #3f3f46;
    color: #d4d4d8;
    border: 1px solid #8b5cf6;
    border-radius: 0.375rem;
    padding: 6px 8px;
    font-size: 10px;
    min-width: 80px;
    text-align: center;
  }
  .react-flow__node.react-flow__node-input {
    background: #5b21b6;
    color: #e9d5ff;
    border-color: #a78bfa;
  }
  .react-flow__edge-path {
    stroke: #8b5cf6;
    stroke-width: 1.5;
  }
  .react-flow__edge.animated path {
    animation-duration: 1s;
  }
`;

const MindMapSidePanel: React.FC<MindMapSidePanelProps> = ({
  onClose,
  nodes,
  edges,
  mindMapError,
  isGenerating,
}) => {
  let content;

  if (mindMapError) {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-sm font-semibold text-neutral-200 mb-1">
          Mind Map Generation Failed
        </h3>
        <p className="text-xs text-neutral-400 whitespace-pre-wrap">
          {mindMapError}
        </p>
        <Button
          onClick={onClose}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
          size="sm"
        >
          Close
        </Button>
      </div>
    );
  } else if (isGenerating || (nodes.length === 0 && !mindMapError)) {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-2" />
        <p className="text-xs text-neutral-400">
          {isGenerating ? "Generating Mind Map..." : "Loading Mind Map..."}
        </p>
      </div>
    );
  } else if (nodes.length > 0) {
    content = (
      <ReactFlow nodes={nodes} edges={edges} fitView className="bg-transparent">
        <Controls
          className="[&>button]:bg-neutral-700 [&>button]:border-neutral-600 [&>button_svg]:fill-neutral-300 hover:[&>button]:bg-neutral-600"
          position="bottom-right"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={0.7}
          color="#52525b"
        />
      </ReactFlow>
    );
  } else {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-xs text-neutral-500">No mind map data available.</p>
        <Button onClick={onClose} className="mt-4 text-xs" size="sm">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <style>{reactFlowStyles}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-700/70">
        <h3 className="text-sm font-semibold text-neutral-100">Mind Map</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 text-neutral-500 hover:text-neutral-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{content}</div>
    </div>
  );
};

export default MindMapSidePanel;
