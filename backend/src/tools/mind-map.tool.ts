import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const CREATE_MIND_MAP_TOOL: ChatCompletionTool = {
  type: "function",
  function: {
    name: "create_mind_map",
    description:
      "Creates or expands a knowledge graph / mind map. Call this whenever the user asks to explore a topic, expand a node, or analyze a document. Choose node colors based on psychological/neurological impact: red for urgency/action, blue for trust/logic, green for growth/nature, yellow for creativity/optimism, purple for mystery/depth, orange for energy/enthusiasm. The root node should always be neutral (white or light grey).",
    parameters: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          description: "Array of nodes in the knowledge graph",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique node ID" },
              label: {
                type: "string",
                description: "Short display label (2-5 words max)",
              },
              description: {
                type: "string",
                description:
                  "Longer explanation shown on hover or in sidebar",
              },
              color: {
                type: "string",
                description:
                  "Hex color. Choose based on the psychological meaning of the node's content. Use: #E74C3C (red=action/urgency), #3498DB (blue=logic/trust), #2ECC71 (green=growth), #F1C40F (yellow=creativity), #9B59B6 (purple=depth/abstract), #E67E22 (orange=energy), #1ABC9C (teal=calm/balance), #ECF0F1 (light grey=neutral/root)",
              },
              textColor: {
                type: "string",
                description:
                  "Contrasting text color for readability, e.g. #FFFFFF or #2C3E50",
              },
              type: {
                type: "string",
                enum: ["root", "branch", "leaf"],
                description:
                  "root=central topic, branch=major subtopic, leaf=specific detail/fact",
              },
              isExpandable: {
                type: "boolean",
                description:
                  "True if this node has deeper concepts worth exploring",
              },
              depth: {
                type: "integer",
                description:
                  "Depth level in the graph (0=root, 1=first level, etc.)",
              },
            },
            required: [
              "id",
              "label",
              "color",
              "textColor",
              "type",
              "isExpandable",
              "depth",
            ],
          },
        },
        edges: {
          type: "array",
          description: "Connections between nodes",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              source: { type: "string", description: "Source node ID" },
              target: { type: "string", description: "Target node ID" },
              label: {
                type: "string",
                description:
                  "Relationship label, e.g. 'causes', 'leads to', 'requires', 'contrasts with'",
              },
              style: {
                type: "string",
                enum: ["solid", "dashed", "dotted"],
                description:
                  "solid=strong relation, dashed=weak/possible relation, dotted=abstract/hypothetical",
              },
            },
            required: ["id", "source", "target"],
          },
        },
        summary: {
          type: "string",
          description:
            "A 1-2 sentence summary of what this graph represents, shown in the UI sidebar.",
        },
        expansionContext: {
          type: "string",
          description:
            "Only present when expanding a node. Describes the parent node being expanded and why these new nodes were chosen.",
        },
      },
      required: ["nodes", "edges", "summary"],
    },
  },
};
