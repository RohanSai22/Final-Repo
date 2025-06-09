import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SquarePen, Brain, Send, StopCircle, Zap, Cpu, Upload, XCircle, FileText, GitFork, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Node, Edge } from 'reactflow';
import { extractContentFromFiles, generateMindMapWithGemini, applyDagreLayout } from "@/lib/mindmapUtils";
import type { Message } from "@langchain/langgraph-sdk";
import { motion } from 'framer-motion'; // Import motion
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Updated InputFormProps
interface InputFormProps {
  onSubmit: (inputValue: string, effort: string, model: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  hasHistory: boolean;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  // Mind Map props
  setIsMindMapOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMindMapNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setMindMapEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  // Context for Mind Map
  chatHistory: Message[];
  currentAiResponse: string;
  currentUserQuestion: string;
  // Error handling for mind map
  mindMapError: string | null; // Prop to receive error state
  setMindMapError: React.Dispatch<React.SetStateAction<string | null>>; // Prop to set error state
}

export const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  onCancel,
  isLoading, // This is for the main chat submission, not mind map generation
  hasHistory,
  uploadedFiles,
  setUploadedFiles,
  // Mind Map props
  setIsMindMapOpen,
  setMindMapNodes,
  setMindMapEdges,
  // Context for Mind Map
  chatHistory,
  currentAiResponse,
  currentUserQuestion,
  // Error handling
  // mindMapError, // Not read here, but setMindMapError is used
  setMindMapError,
}) => {
  const [internalInputValue, setInternalInputValue] = useState("");
  const [effort, setEffort] = useState("medium");
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [model, setModel] = useState("gemini-2.5-flash-preview-04-17");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInternalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Allow submission even if only files are present and input is empty, if desired.
    // For now, requires text input.
    if (!internalInputValue.trim() && uploadedFiles.length === 0) return;
    onSubmit(internalInputValue, effort, model);
    setInternalInputValue("");
    // Clearing files here is optional, as App.tsx clears them on general submit.
    // If files were to be sticky per message, this would change.
  };

  const handleInternalKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const isSubmitDisabled = (!internalInputValue.trim() && uploadedFiles.length === 0) || isLoading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadedFiles(Array.from(event.target.files));
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
  };

  return (
    <form
      onSubmit={handleInternalSubmit}
      className={`flex flex-col gap-3 p-3`} // Increased gap a bit
    >
      {/* Main input text area and submit button */}
      <div
        className={`flex flex-row items-start text-white rounded-3xl ${ // items-start for multiline
          hasHistory ? "rounded-br-sm" : ""
        } bg-neutral-700 px-4 py-3`} // py-3 for consistent padding
      >
        <Textarea
          value={internalInputValue}
          onChange={(e) => setInternalInputValue(e.target.value)}
          onKeyDown={handleInternalKeyDown}
          placeholder="Ask a question or type '/mindmap' for a mind map from files..."
          className={`w-full text-neutral-100 placeholder-neutral-500 resize-none border-0 focus:outline-none focus:ring-0 outline-none focus-visible:ring-0 shadow-none 
                        md:text-base min-h-[24px] max-h-[200px] pt-1`} // Adjusted padding for alignment
          rows={1}
        />
        <div className="ml-2 flex-shrink-0"> {/* Submit/Cancel buttons container */}
          {isLoading ? (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 cursor-pointer rounded-full transition-all duration-200"
                onClick={onCancel}
                aria-label="Cancel"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className={`${
                  isSubmitDisabled
                    ? "text-neutral-500 cursor-not-allowed"
                    : "text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                } p-2 cursor-pointer rounded-full transition-all duration-200`}
                disabled={isSubmitDisabled}
                aria-label="Send"
              >
                <Send className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* File Upload Section */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.txt,.doc,.docx"
          />
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-neutral-600 hover:bg-neutral-500 border-neutral-500 text-neutral-300 hover:text-neutral-200 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Attach Files
            </Button>
          </motion.div>
          {uploadedFiles.length > 0 && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
             <Button
             type="button"
             variant="ghost"
             size="sm"
             className="text-red-500 hover:text-red-400 text-xs"
             onClick={() => setUploadedFiles([])} // Clear all files
           >
             <XCircle className="h-4 w-4 mr-1" /> Clear All
           </Button>
          )}
        </div>

        {uploadedFiles.length > 0 ? (
          <div className="mt-1 space-y-1">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-700/50 p-1.5 rounded"
              >
                <div className="flex items-center overflow-hidden">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-neutral-500" />
                  <span className="truncate" title={file.name}>{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-neutral-500 hover:text-red-400"
                  onClick={() => removeFile(file.name)}
                  aria-label="Remove file"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 px-1">No files selected. Accepted: .pdf, .txt, .doc, .docx</p>
        )}
      </div>


      {/* Effort, Model Selectors, and Mind Map Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto"> {/* Changed to flex-wrap for smaller screens */}
          {/* Effort Select */}
          <div className="flex flex-row items-center gap-1 bg-neutral-700 border-neutral-600 text-neutral-300 focus:ring-neutral-500 rounded-xl pl-3 pr-1 py-1 text-sm">
            <Brain className="h-4 w-4 flex-shrink-0" />
            <span className="flex-shrink-0">Effort</span>
              <Brain className="h-4 w-4 mr-2" />
            <Select value={effort} onValueChange={setEffort}>
              <SelectTrigger className="w-auto sm:w-[100px] bg-transparent border-none cursor-pointer focus:ring-0 text-xs sm:text-sm">
                <SelectValue placeholder="Effort" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-300 cursor-pointer">
                <SelectItem value="low" className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer text-xs sm:text-sm">Low</SelectItem>
                <SelectItem value="medium" className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer text-xs sm:text-sm">Medium</SelectItem>
                <SelectItem value="high" className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer text-xs sm:text-sm">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Model Select */}
          <div className="flex flex-row items-center gap-1 bg-neutral-700 border-neutral-600 text-neutral-300 focus:ring-neutral-500 rounded-xl pl-3 pr-1 py-1 text-sm">
            <Cpu className="h-4 w-4 flex-shrink-0" />
            <span className="flex-shrink-0">Model</span>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-auto sm:w-[150px] bg-transparent border-none cursor-pointer focus:ring-0 text-xs sm:text-sm">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-300 cursor-pointer">
                <SelectItem value="gemini-2.0-flash" className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer text-xs sm:text-sm">
                  <div className="flex items-center"><Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-400" />2.0 Flash</div>
                </SelectItem>
                <SelectItem value="gemini-2.5-flash-preview-04-17" className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer text-xs sm:text-sm">
                  <div className="flex items-center"><Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-orange-400" />2.5 Flash</div>
                </SelectItem>
                <SelectItem value="gemini-2.5-pro-preview-05-06" className="hover:bg-neutral-700 focus:bg-neutral-700 cursor-pointer text-xs sm:text-sm">
                  <div className="flex items-center"><Cpu className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-purple-400" />2.5 Pro</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Mind Map Button - only show if files are uploaded */}
          {uploadedFiles.length > 0 && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="button"
                variant="outline"
                className="bg-purple-600/30 hover:bg-purple-500/40 border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-xl px-3 py-1 text-sm h-auto flex items-center"
                onClick={handleGenerateMindMap}
                disabled={isGeneratingMap || uploadedFiles.length === 0}
              >
                {isGeneratingMap ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <GitFork size={16} className="mr-2" />
                )}
                {isGeneratingMap ? "Generating..." : "Mind Map"}
              </Button>
            </motion.div>
          )}
        </div>
        {/* New Search Button */}
        {hasHistory && (
           <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              className="bg-neutral-700 hover:bg-neutral-600 border-neutral-600 text-neutral-300 cursor-pointer rounded-xl px-3 py-1 text-sm h-auto mt-2 sm:mt-0"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <SquarePen size={16} className="mr-2" />
              New Search
            </Button>
          </motion.div>
        )}
      </div>
    </form>
  );

  async function handleGenerateMindMap() {
    if (uploadedFiles.length === 0) {
      setMindMapError("Please upload at least one file to generate a Mind Map.");
      // setIsMindMapOpen(true); // Optionally open modal to show this initial error
      return;
    }
    setMindMapError(null); // Clear previous errors
    setIsGeneratingMap(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("VITE_GEMINI_API_KEY is not set.");
      setMindMapError("Gemini API key is not configured. Cannot generate Mind Map.");
      setIsMindMapOpen(true); // Open modal to show configuration error
      setIsGeneratingMap(false);
      return;
    }

    try {
      // Initialize with empty state for the modal to show "Generating..."
      setMindMapNodes([]);
      setMindMapEdges([]);
      setIsMindMapOpen(true); // Open modal before starting generation

      const fileContents = await extractContentFromFiles(uploadedFiles, 5000);

      const formattedFileExcerpts = fileContents
        .map(fc => `File: ${fc.name}\nContent:\n${fc.text}\n---`)
        .join('\n\n');

      const formattedChatHistory = chatHistory
        .map(msg => `${msg.type === 'human' ? 'User' : 'AI'}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`)
        .join('\n');

      const geminiPrompt = `
        Based on the following information, generate a mind map. The mind map should represent the key concepts, relationships, and hierarchies from the provided text.

        **Rules for Mind Map Generation:**
        1.  Identify a central topic or main idea. This will be the root node.
        2.  Branch out from the central topic with main sub-topics or themes.
        3.  Further branch out from sub-topics with supporting details, examples, or related concepts.
        4.  Nodes should have clear, concise labels.
        5.  Ensure all nodes eventually connect back to the central topic or one of its main branches.
        6.  The 'parent' field for a node should be the ID of its direct parent. Root nodes have 'parent: null'.
        7.  Edges define the connections FROM a parent (source) TO a child (target).

        **Original User Question (if available):**
        ${currentUserQuestion || "Not specified."}

        **Chat History (if available):**
        ${formattedChatHistory || "No chat history provided."}

        **Final AI Answer (if available, this is the primary subject for the mind map):**
        ${currentAiResponse || "No specific AI answer provided. Focus on file content."}

        **Excerpts from Uploaded Files:**
        ${formattedFileExcerpts}

        Generate the mind map structure according to the JSON schema provided previously.
        Focus on creating a meaningful and hierarchical representation of the information.
        If the AI answer is present, it should be the primary source for the mind map, with file excerpts providing supplementary details or context. If no AI answer, use the user question and file excerpts.
      `;

      const geminiResponse = await generateMindMapWithGemini(apiKey, geminiPrompt);

      if (geminiResponse && geminiResponse.nodes && geminiResponse.edges) {
        const reactFlowNodes: Node[] = geminiResponse.nodes.map(node => ({
          id: node.id,
          data: { label: node.label },
          position: { x: 0, y: 0 }, // Dagre will set this
          // type: node.parent === null ? 'input' : 'default', // Optional: style root nodes differently
        }));

        const reactFlowEdges: Edge[] = geminiResponse.edges.map((edge, index) => ({
          id: `e${index + 1}-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          animated: true, // Optional: make edges animated
          type: 'smoothstep', // Optional: use smoothstep edges
        }));

        const { layoutedNodes, layoutedEdges } = applyDagreLayout(reactFlowNodes, reactFlowEdges);

        setMindMapNodes(layoutedNodes);
        setMindMapNodes(layoutedNodes);
        setMindMapEdges(layoutedEdges);
        // setIsMindMapOpen(true); // Already open
      } else {
        console.error("Failed to generate mind map from Gemini response.");
        setMindMapError("Could not generate the mind map. The AI's response was not in the expected format or was empty.");
        // Keep modal open to show error by not calling setIsMindMapOpen(false)
      }
    } catch (error) {
      console.error("Error in mind map generation process:", error);
      setMindMapError("An error occurred while generating the mind map. Please check the console for details.");
      // Keep modal open
    } finally {
      setIsGeneratingMap(false);
    }
  }
};
