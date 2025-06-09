import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { CognitiveBlockData } from "@/types/cognitive";
import MindMapDisplay from "@/components/MindMapDisplay";
import { Node, Edge } from 'reactflow';
import { AnimatePresence } from 'framer-motion'; // New import for AnimatePresence

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [cognitiveStream, setCognitiveStream] = useState<CognitiveBlockData[]>([]);
  const [isAiThinkingStep, setIsAiThinkingStep] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasFinalizeEventOccurredRef = useRef(false);

  // Mind Map State
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [mindMapNodes, setMindMapNodes] = useState<Node[]>([]);
  const [mindMapEdges, setMindMapEdges] = useState<Edge[]>([]);
  const [mindMapError, setMindMapError] = useState<string | null>(null); // New state for mind map error

  // Derive chat history and current messages for Mind Map context
  const chatHistory = thread.messages || [];
  let currentAiResponse = "";
  let currentUserQuestion = "";

  if (chatHistory.length > 0) {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage.type === 'ai') {
      currentAiResponse = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
      if (chatHistory.length > 1) {
        const secondLastMessage = chatHistory[chatHistory.length - 2];
        if (secondLastMessage.type === 'human') {
          currentUserQuestion = typeof secondLastMessage.content === 'string' ? secondLastMessage.content : JSON.stringify(secondLastMessage.content);
        }
      }
    } else if (lastMessage.type === 'human') {
      currentUserQuestion = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
      // No current AI response yet in this case, or it's from a much earlier turn.
      // For mind map, we might only care if there *is* an AI response to map.
    }
  }

  const thread = useStream<{
    messages: Message[];
    initial_search_query_count: number;
    max_research_loops: number;
    reasoning_model: string;
  }>({
    apiUrl: import.meta.env.DEV
      ? "http://localhost:2024"
      : "http://localhost:8123",
    assistantId: "agent",
    messagesKey: "messages",
    onFinish: (/* event: any */) => { // event can be used if needed
      // console.log("Stream finished:", event);
      setIsAiThinkingStep(false);
      hasFinalizeEventOccurredRef.current = false; // Reset for next interaction if still used
    },
    onUpdateEvent: (event: any) => {
      setIsAiThinkingStep(true);
      let newBlock: CognitiveBlockData | null = null;
      const blockId = Date.now().toString() + Math.random().toString(36).substring(2,9);

      if (event.generate_query) {
        newBlock = {
          id: blockId,
          type: 'search_queries',
          content: {
            title: 'Generating Search Queries',
            text: `Formulating ${event.generate_query.query_list.length} search query/queries.`,
            details: event.generate_query.query_list,
          },
          timestamp: new Date().toISOString(),
        };
      } else if (event.web_research) {
        const sources = event.web_research.sources_gathered || [];
        const numSources = sources.length;
        const uniqueLabels = [...new Set(sources.map((s: any) => s.label).filter(Boolean))];
        const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
        newBlock = {
          id: blockId,
          type: 'web_research',
          content: {
            title: 'Web Research',
            text: `Gathered ${numSources} sources. Related to: ${exampleLabels || 'N/A'}.`,
            details: sources.map((s:any) => ({url: s.url, title: s.title})), // Example detail structure
          },
          timestamp: new Date().toISOString(),
        };
      } else if (event.reflection) {
        newBlock = {
          id: blockId,
          type: 'reflection',
          content: {
            title: 'Reflection',
            text: event.reflection.is_sufficient
              ? "Information gathered seems sufficient."
              : `Further information required. Next step: ${event.reflection.follow_up_queries.join(", ")}`,
            details: event.reflection,
          },
          timestamp: new Date().toISOString(),
        };
      } else if (event.finalize_answer) {
        newBlock = {
          id: blockId,
          type: 'finalizing_answer',
          content: {
            title: 'Finalizing Answer',
            text: 'Synthesizing information and composing the final answer.',
          },
          timestamp: new Date().toISOString(),
        };
        // hasFinalizeEventOccurredRef.current = true; // This ref might be less relevant now
      }
      // Add other event types like 'action', 'hypothesis', 'code_execution' as they become available from backend

      if (newBlock) {
        setCognitiveStream((prevStream) => [...prevStream, newBlock!]);
      }
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [thread.messages, cognitiveStream]); // Scroll on cognitive stream updates too

  // useEffect for hasFinalizeEventOccurredRef removed as historicalActivities are removed.
  // If hasFinalizeEventOccurredRef is used for other purposes, its logic might need review.

  const handleSubmit = useCallback(
    (submittedInputValue: string, effort: string, model: string) => {
      if (!submittedInputValue.trim() && uploadedFiles.length === 0) return; // Check uploadedFiles too
      setCognitiveStream([]); // Clear cognitive stream for new query
      setUploadedFiles([]);
      setIsAiThinkingStep(true); // Start thinking on submission
      // hasFinalizeEventOccurredRef.current = false; // Reset if still used elsewhere

      // convert effort to, initial_search_query_count and max_research_loops
      // low means max 1 loop and 1 query
      // medium means max 3 loops and 3 queries
      // high means max 10 loops and 5 queries
      let initial_search_query_count = 0;
      let max_research_loops = 0;
      switch (effort) {
        case "low":
          initial_search_query_count = 1;
          max_research_loops = 1;
          break;
        case "medium":
          initial_search_query_count = 3;
          max_research_loops = 3;
          break;
        case "high":
          initial_search_query_count = 5;
          max_research_loops = 10;
          break;
      }

      const newMessages: Message[] = [
        ...(thread.messages || []),
        {
          type: "human",
          content: submittedInputValue,
          id: Date.now().toString(),
        },
      ];
      thread.submit({
        messages: newMessages,
        initial_search_query_count: initial_search_query_count,
        max_research_loops: max_research_loops,
        reasoning_model: model,
      });
    },
    [thread]
  );

  const handleCancel = useCallback(() => {
    thread.stop();
    window.location.reload();
  }, [thread]);

  return (
    <div className="flex h-screen bg-neutral-800 text-neutral-100 font-sans antialiased">
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        <div
          className={`flex-1 overflow-y-auto ${
            thread.messages.length === 0 ? "flex" : ""
          }`}
        >
          {thread.messages.length === 0 ? (
            <WelcomeScreen
              handleSubmit={handleSubmit}
              isLoading={thread.isLoading}
              onCancel={handleCancel}
            />
          ) : (
            <ChatMessagesView
              messages={thread.messages}
              isLoading={thread.isLoading}
              scrollAreaRef={scrollAreaRef}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              cognitiveStream={cognitiveStream}
              isAiThinkingStep={isAiThinkingStep}
              // Mind Map props
              setIsMindMapOpen={setIsMindMapOpen}
              setMindMapNodes={setMindMapNodes}
              setMindMapEdges={setMindMapEdges}
              // Context for Mind Map generation
              chatHistory={chatHistory}
              currentAiResponse={currentAiResponse}
              currentUserQuestion={currentUserQuestion}
              // Mind Map Error handling
              mindMapError={mindMapError}
              setMindMapError={setMindMapError}
            />
          )}
        </div>
      </main>
      <AnimatePresence>
        {isMindMapOpen && (
          <MindMapDisplay
            onClose={() => {
              setIsMindMapOpen(false);
              setMindMapError(null); // Clear error when closing modal
            }}
            nodes={mindMapNodes}
            edges={mindMapEdges}
            mindMapError={mindMapError}
            isGenerating={mindMapNodes.length === 0 && !mindMapError && isMindMapOpen} // Infer isGenerating for display
          />
        )}
      </AnimatePresence>
    </div>
  );
}
