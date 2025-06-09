export interface CognitiveBlockData {
  id: string; // Unique ID for the block
  type: 'hypothesis' | 'action' | 'analysis' | 'strategy' | 'search_queries' | 'web_research' | 'reflection' | 'code_execution' | 'finalizing_answer'; // Extended types
  icon?: string; // Lucide icon name (optional, can be derived from type)
  content: {
    title?: string; // e.g., "Searched the web"
    text: string;    // The main text content of the thought.
    details?: string[] | Record<string, any>; // e.g., Search query pills, or structured data
  };
  timestamp?: string; // Optional: ISO string for when the event occurred
}
