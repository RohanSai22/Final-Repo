import type React from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { Loader2, Copy, CopyCheck } from "lucide-react";
import { InputForm } from "@/components/InputForm";
import { Button } from "@/components/ui/button";
import { useState, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
// ActivityTimeline and ProcessedEvent removed
import { ThoughtStreamPanel } from './ThoughtStreamPanel'; // New import
import { CognitiveBlockData } from '@/types/cognitive'; // New import

// Markdown component props type from former ReportView
type MdComponentProps = {
  className?: string;
  children?: ReactNode;
  [key: string]: any;
};

// Default/Global Markdown components (can be used by HumanMessageBubble or as fallback)
// Note: The 'a' renderer here will be overridden in AiMessageBubble for citation logic.
const globalMdComponents = {
  h1: ({ className, children, ...props }: MdComponentProps) => (
    <h1 className={cn("text-2xl font-bold mt-4 mb-2", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }: MdComponentProps) => (
    <h2 className={cn("text-xl font-bold mt-3 mb-2", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: MdComponentProps) => (
    <h3 className={cn("text-lg font-bold mt-3 mb-1", className)} {...props}>
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }: MdComponentProps) => (
    <p className={cn("mb-3 leading-7", className)} {...props}>
      {children}
    </p>
  ),
  // Default 'a' renderer, without citation logic
  a: ({ className, children, href, ...props }: MdComponentProps) => (
    <a
      className={cn("text-blue-400 hover:text-blue-300", className)} // Removed Badge
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ className, children, ...props }: MdComponentProps) => (
    <ul className={cn("list-disc pl-6 mb-3", className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: MdComponentProps) => (
    <ol className={cn("list-decimal pl-6 mb-3", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }: MdComponentProps) => (
    <li className={cn("mb-1", className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ className, children, ...props }: MdComponentProps) => (
    <blockquote
      className={cn(
        "border-l-4 border-neutral-600 pl-4 italic my-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }: MdComponentProps) => (
    <code
      className={cn(
        "bg-neutral-900 rounded px-1 py-0.5 font-mono text-xs",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ className, children, ...props }: MdComponentProps) => (
    <pre
      className={cn(
        "bg-neutral-900 p-3 rounded-lg overflow-x-auto font-mono text-xs my-3",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  hr: ({ className, ...props }: MdComponentProps) => (
    <hr className={cn("border-neutral-600 my-4", className)} {...props} />
  ),
  table: ({ className, children, ...props }: MdComponentProps) => (
    <div className="my-3 overflow-x-auto">
      <table className={cn("border-collapse w-full", className)} {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ className, children, ...props }: MdComponentProps) => (
    <th
      className={cn(
        "border border-neutral-600 px-3 py-2 text-left font-bold",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }: MdComponentProps) => (
    <td
      className={cn("border border-neutral-600 px-3 py-2", className)}
      {...props}
    >
      {children}
    </td>
  ),
};

// Props for HumanMessageBubble
interface HumanMessageBubbleProps {
  message: Message;
  // mdComponents prop can be removed if it always uses globalMdComponents
}

// HumanMessageBubble Component
const HumanMessageBubble: React.FC<HumanMessageBubbleProps> = ({
  message,
}) => {
  return (
    <div
      className={`text-white rounded-3xl break-words min-h-7 bg-neutral-700 max-w-[100%] sm:max-w-[90%] px-4 pt-3 rounded-br-lg`}
    >
      <ReactMarkdown components={globalMdComponents}> {/* Uses global/default components */}
        {typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content)}
      </ReactMarkdown>
    </div>
  );
};

// Props for AiMessageBubble
interface AiMessageBubbleProps {
  message: Message;
  isLastMessage: boolean;
  isOverallLoading: boolean;
  handleCopy: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
  cognitiveStream?: CognitiveBlockData[];
  isAiThinkingStep?: boolean;
  // mdComponents prop removed, will be defined internally
}

// AiMessageBubble Component
const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  message,
  isLastMessage,
  isOverallLoading,
  handleCopy,
  copiedMessageId,
  cognitiveStream,
  isAiThinkingStep,
}) => {
  // Citation logic for this specific message
  const messageCitationMap = new Map<string, number>();
  const messageCitationLinks: string[] = [];

  const getCitationNumberForUrl = (url: string): number => {
    if (messageCitationMap.has(url)) {
      return messageCitationMap.get(url)!;
    }
    const number = messageCitationLinks.length + 1;
    messageCitationMap.set(url, number);
    messageCitationLinks.push(url);
    return number;
  };

  // Define mdComponents specific to this AiMessageBubble to use its citation logic
  const bubbleMdComponents = {
    ...globalMdComponents, // Spread global components for h1, p, etc.
    a: ({ className, children, href, ...props }: MdComponentProps) => {
      if (!href) return <>{children}</>;

      const number = getCitationNumberForUrl(href);
      const originalLinkText = children ? (Array.isArray(children) ? children.join('') : String(children)) : href;


      return (
        <a
          className={cn("text-blue-400 hover:text-blue-300 font-medium text-xs align-super", className)}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
          title={`Source: ${originalLinkText} (${href})`}
        >
          <sup>[{number}]</sup>
        </a>
      );
    },
    img: ({ node, className, children, ...props }: MdComponentProps & { src?: string; alt?: string }) => {
      // Apply styling for responsive images that fit well within the chat bubble
      return (
        <img
          {...props}
          src={props.src}
          alt={props.alt || "image from AI"} // Provide a default alt text
          className={cn("max-w-full h-auto rounded-lg my-2 shadow-md", className)}
        />
      );
    },
  };

  return (
    <div className={`relative break-words flex flex-col w-full`}>
      <ReactMarkdown components={bubbleMdComponents}>
        {typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content)}
      </ReactMarkdown>

      {messageCitationLinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-700/80">
          <h4 className="text-xs font-semibold mb-1.5 text-neutral-400">Sources:</h4>
          <ol className="list-decimal list-inside text-xs space-y-1">
            {messageCitationLinks.map((link, index) => (
              <li key={index} className="text-neutral-400 truncate leading-relaxed">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-300 hover:underline"
                  title={link}
                >
                  {link}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {isLastMessage && isOverallLoading && (
        <div className="mt-3 w-full">
          <ThoughtStreamPanel
            stream={cognitiveStream || []}
            isThinking={isAiThinkingStep || false}
            panelTitle="Current Thought Process"
          />
        </div>
      )}
      <Button
        variant="outline" // Changed variant for better contrast with dark bubbles
        className="cursor-pointer bg-neutral-700 hover:bg-neutral-600 border-neutral-600 text-neutral-300 self-end mt-3 px-2.5 py-1 h-auto text-xs"
        onClick={() =>
          handleCopy(
            typeof message.content === "string"
              ? message.content
              : JSON.stringify(message.content),
            message.id!
          )
        }
      >
        {copiedMessageId === message.id ? "Copied" : "Copy"}
        {copiedMessageId === message.id ? <CopyCheck /> : <Copy />}
      </Button>
    </div>
  );
};

interface ChatMessagesViewProps {
  messages: Message[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (inputValue: string, effort: string, model: string) => void;
  onCancel: () => void;
  // liveActivityEvents and historicalActivities removed
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  cognitiveStream?: CognitiveBlockData[];
  isAiThinkingStep?: boolean;
  // Mind Map props
  setIsMindMapOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMindMapNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setMindMapEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  // Context for Mind Map
  chatHistory: Message[];
  currentAiResponse: string;
  currentUserQuestion: string;
  // Mind Map Error handling
  mindMapError: string | null;
  setMindMapError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ChatMessagesView({
  messages,
  isLoading,
  scrollAreaRef,
  onSubmit,
  onCancel,
  uploadedFiles,
  setUploadedFiles,
  cognitiveStream,
  isAiThinkingStep,
  // Mind Map props
  setIsMindMapOpen,
  setMindMapNodes,
  setMindMapEdges,
  // Context for Mind Map
  chatHistory,
  currentAiResponse,
  currentUserQuestion,
  // Mind Map Error handling
  mindMapError,
  setMindMapError,
}: ChatMessagesViewProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-2 max-w-4xl mx-auto pt-16">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            return (
              <div key={message.id || `msg-${index}`} className="space-y-3">
                <div
                  className={`flex items-start gap-3 ${
                    message.type === "human" ? "justify-end" : ""
                  }`}
                >
                  {message.type === "human" ? (
                    <HumanMessageBubble
                      message={message}
                      // mdComponents prop removed from HumanMessageBubble call
                    />
                  ) : (
                    <AiMessageBubble
                      message={message}
                      isLastMessage={isLast}
                      isOverallLoading={isLoading}
                      // mdComponents prop removed from AiMessageBubble call
                      handleCopy={handleCopy}
                      copiedMessageId={copiedMessageId}
                      cognitiveStream={cognitiveStream}
                      isAiThinkingStep={isAiThinkingStep}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {/* General loading indicator for when AI is processing but no message bubble is ready for ThoughtStreamPanel yet */}
          {isLoading && messages.length > 0 && messages[messages.length -1].type === 'human' && !cognitiveStream?.length && (
             <div className="flex items-start gap-3 mt-3">
                <div className="relative group max-w-[85%] md:max-w-[80%] rounded-xl p-3 shadow-sm break-words bg-neutral-800 text-neutral-100 rounded-bl-none w-full min-h-[56px]">
                    <div className="flex items-center justify-start h-full">
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-400 mr-2" />
                        <span>Processing...</span>
                    </div>
                </div>
            </div>
          )}
           {/* Fallback for empty chat, if needed, though WelcomeScreen handles initial empty state */}
           {isLoading && messages.length === 0 && (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
             </div>
           )}
        </div>
      </div>
      <div className="bg-neutral-800 border-t border-neutral-700">
        <InputForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
          hasHistory={messages.length > 0}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          // Mind Map props
          setIsMindMapOpen={setIsMindMapOpen}
          setMindMapNodes={setMindMapNodes}
          setMindMapEdges={setMindMapEdges}
          // Context for Mind Map
          chatHistory={chatHistory}
          currentAiResponse={currentAiResponse}
          currentUserQuestion={currentUserQuestion}
          // Mind Map Error handling
          mindMapError={mindMapError}
          setMindMapError={setMindMapError}
        />
      </div>
    </div>
  );
}
