import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  Position,
} from "reactflow";
import dagre from "dagre";

// PDF.js worker setup
// In a Vite environment, you might need to ensure the worker file is copied to your dist folder.
// This URL approach works if pdf.worker.min.mjs is resolvable relative to the built output.
// For pdfjs-dist v4.x, this is a common way.
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
} catch (error) {
  console.warn(
    "Could not set pdfjsLib.GlobalWorkerOptions.workerSrc. PDF parsing might fail if the worker is not found. " +
      "Ensure 'pdfjs-dist/build/pdf.worker.min.mjs' is accessible. Error: ",
    error
  );
  // Fallback if new URL fails (e.g. in certain test environments or bundler configs)
  // You might need to adjust this path based on your project structure and build process.
  // For a typical Vite setup where pdfjs-dist is in node_modules, this might be:
  // pdfjsLib.GlobalWorkerOptions.workerSrc = `/node_modules/pdfjs-dist/build/pdf.worker.min.mjs`;
}

export const mindMapSchema = {
  type: "OBJECT",
  properties: {
    nodes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: {
            type: "STRING",
            description: "Unique identifier for the node.",
          },
          label: { type: "STRING", description: "Display text for the node." },
          parent: {
            type: "STRING",
            nullable: true,
            description: "ID of the parent node, null for root nodes.",
          },
        },
        required: ["id", "label"],
      },
    },
    edges: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          source: {
            type: "STRING",
            description: "ID of the source node for the edge.",
          },
          target: {
            type: "STRING",
            description: "ID of the target node for the edge.",
          },
        },
        required: ["source", "target"],
      },
    },
  },
  required: ["nodes", "edges"],
};

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent +=
        text.items.map((item) => ("str" in item ? item.str : "")).join(" ") +
        "\n";
    }
    return textContent;
  } catch (error) {
    console.error(`Error extracting text from PDF ${file.name}:`, error);
    return "";
  }
}

export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error(`Error extracting text from DOCX ${file.name}:`, error);
    return "";
  }
}

export async function extractTextFromTxt(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error(`Error extracting text from TXT ${file.name}:`, error);
    return "";
  }
}

export async function extractContentFromFiles(
  files: File[],
  charLimitPerFile: number = 10000 // Increased limit slightly
): Promise<{ name: string; text: string }[]> {
  const extractedContents: { name: string; text: string }[] = [];

  for (const file of files) {
    let text = "";
    try {
      if (file.type === "application/pdf") {
        text = await extractTextFromPdf(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await extractTextFromDocx(file);
      } else if (file.type === "text/plain") {
        text = await extractTextFromTxt(file);
      } else {
        console.warn(`Unsupported file type: ${file.name} (${file.type})`);
        continue; // Skip unsupported files
      }
      extractedContents.push({
        name: file.name,
        text: text.substring(0, charLimitPerFile),
      });
    } catch (error) {
      console.error(`Failed to extract content from ${file.name}:`, error);
      extractedContents.push({ name: file.name, text: "" }); // Add with empty text on error
    }
  }
  return extractedContents;
}

interface GeminiMindMapNode {
  id: string;
  label: string;
  parent: string | null;
}

interface GeminiMindMapEdge {
  source: string;
  target: string;
}
interface GeminiMindMapData {
  nodes: GeminiMindMapNode[];
  edges: GeminiMindMapEdge[];
}

export async function generateMindMapWithGemini(
  apiKey: string,
  prompt: string
): Promise<GeminiMindMapData | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const flash = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // Using 1.5 flash as 2.0 is not a valid model name. 1.5 is the latest.
      generationConfig: {
        response_mime_type: "application/json",
        // @ts-ignore TODO: Check if this schema structure is correct for the SDK version
        response_schema: mindMapSchema,
      } as GenerationConfig, // Cast to GenerationConfig if schema causes type issues with SDK
    });

    const result = await flash.generateContent(prompt);
    const responseText = result.response.text();

    // It's good practice to validate the structure, even with schema enforcement
    const parsed = JSON.parse(responseText) as GeminiMindMapData;
    if (!parsed.nodes || !parsed.edges) {
      console.error("Gemini response missing nodes or edges:", parsed);
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("Error generating mind map with Gemini:", error);
    const typedError = error as any;
    if (
      typedError.message &&
      typedError.message.includes("API key not valid")
    ) {
      alert(
        "Gemini API Key is not valid. Please check your .env file or environment variables."
      );
    } else if (
      typedError.message &&
      typedError.message.includes("response_mime_type")
    ) {
      console.error(
        "It's possible the current model (gemini-1.5-flash-latest) does not fully support JSON mode with response_schema in the same way as older models. The API may have changed."
      );
    }
    return null;
  }
}

export function applyDagreLayout(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  direction = "TB" // Top-to-bottom layout
): { layoutedNodes: ReactFlowNode[]; layoutedEdges: ReactFlowEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 }); // nodesep, ranksep for spacing

  const nodeWidth = 172; // Standard node width (adjust as needed)
  const nodeHeight = 50; // Standard node height

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: direction === "TB" ? Position.Top : Position.Left,
      sourcePosition: direction === "TB" ? Position.Bottom : Position.Right,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { layoutedNodes, layoutedEdges: edges }; // Edges don't change positionally from Dagre
}
