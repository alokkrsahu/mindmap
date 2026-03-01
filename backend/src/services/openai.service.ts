import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openai } from "../lib/openai.js";
import { CREATE_MIND_MAP_TOOL } from "../tools/mind-map.tool.js";
import { getMessageHistory, saveMessage } from "./message.service.js";
import { saveGraph, getAllGraphs } from "./graph.service.js";

function collectAllNodesAndEdges(
  graphs: { nodes: unknown; edges: unknown }[],
): { nodes: unknown[]; edges: unknown[] } {
  const allNodes: unknown[] = [];
  const allEdges: unknown[] = [];
  const seenNodeIds = new Set<string>();
  const seenEdgeIds = new Set<string>();

  for (const g of graphs) {
    const nodes = g.nodes as Array<{ id: string }>;
    const edges = g.edges as Array<{ id: string }>;
    for (const n of nodes) {
      if (!seenNodeIds.has(n.id)) {
        seenNodeIds.add(n.id);
        allNodes.push(n);
      }
    }
    for (const e of edges) {
      if (!seenEdgeIds.has(e.id)) {
        seenEdgeIds.add(e.id);
        allEdges.push(e);
      }
    }
  }

  return { nodes: allNodes, edges: allEdges };
}
import type { MindMapGraph } from "../types/index.js";
import { ApiError } from "../utils/api-error.js";

const SYSTEM_PROMPT = `You are a visual brainstorming companion. Your ONLY output method is calling the create_mind_map tool.
Never respond in plain text when a graph is expected.

When generating a mind map:
- Create 5-12 nodes for a new topic, 3-7 nodes when expanding
- Choose colors based on psychological impact (see tool description)
- Make edge labels descriptive: use verbs like "enables", "contradicts", "requires", "inspires"
- IMPORTANT: ALWAYS set isExpandable=true for EVERY node. Every concept can be explored deeper. There is no depth limit.
- Root node is always depth 0, its direct children are depth 1, etc.
- Use stable node IDs in the format: topic_depth_index (e.g. "ml_0_0", "neural_nets_1_1")

CRITICAL: When the user sends a follow-up message (not the first message), they want to EXPAND the existing mind map, not replace it. Generate new nodes that connect to the existing graph. The new nodes should have edges linking them to relevant existing nodes. Do NOT regenerate nodes that already exist in the conversation history.

Color psychology guide:
| Color | Hex | Use for nodes about... |
| Red | #E74C3C | Urgency, action items, risks, challenges |
| Blue | #3498DB | Logic, facts, trust, technical concepts |
| Green | #2ECC71 | Growth, opportunities, solutions, nature |
| Yellow | #F1C40F | Creativity, ideas, optimism, innovation |
| Purple | #9B59B6 | Abstract thinking, philosophy, depth, mystery |
| Orange | #E67E22 | Energy, enthusiasm, social concepts, communication |
| Teal | #1ABC9C | Balance, calm, strategy, process |
| Light Grey | #ECF0F1 | Root/neutral nodes only |`;

function buildOpenAIMessages(
  history: { role: string; content: string; toolCallId: string | null }[],
): ChatCompletionMessageParam[] {
  return history.map((msg) => {
    if (msg.role === "assistant" && msg.content.startsWith("{")) {
      // Reconstruct tool call message
      const parsed = JSON.parse(msg.content);
      return {
        role: "assistant" as const,
        tool_calls: [
          {
            id: parsed.toolCallId,
            type: "function" as const,
            function: {
              name: "create_mind_map",
              arguments: parsed.arguments,
            },
          },
        ],
      };
    }
    if (msg.role === "tool") {
      return {
        role: "tool" as const,
        tool_call_id: msg.toolCallId!,
        content: msg.content,
      };
    }
    return {
      role: msg.role as "user" | "assistant",
      content: msg.content,
    };
  });
}

export async function generateMindMap(
  sessionId: string,
  userMessage: string,
): Promise<MindMapGraph> {
  const history = await getMessageHistory(sessionId);
  const messages = buildOpenAIMessages(history);

  // If there's existing conversation, include the full accumulated graph as context
  // so the AI knows to expand rather than replace
  let contextualMessage = userMessage;
  if (history.length > 0) {
    const allGraphs = await getAllGraphs(sessionId);
    if (allGraphs.length > 0) {
      const fullGraph = collectAllNodesAndEdges(allGraphs);
      contextualMessage = `The user already has an existing mind map. Here is the current graph:\n${JSON.stringify(fullGraph)}\n\nThe user now says: "${userMessage}"\n\nGenerate ONLY NEW nodes and edges that expand the existing graph based on this request. Connect new nodes to relevant existing nodes via edges. Do NOT regenerate existing nodes.`;
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
      { role: "user", content: contextualMessage },
    ],
    tools: [CREATE_MIND_MAP_TOOL],
    tool_choice: {
      type: "function",
      function: { name: "create_mind_map" },
    },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new ApiError(500, "AI did not return a function tool call");
  }

  const graphData: MindMapGraph = JSON.parse(toolCall.function.arguments);

  // Save user message
  await saveMessage(sessionId, "user", userMessage);

  // Save assistant tool call
  await saveMessage(
    sessionId,
    "assistant",
    JSON.stringify({
      toolCallId: toolCall.id,
      arguments: toolCall.function.arguments,
    }),
  );

  // Save tool response (acknowledge the tool call)
  await saveMessage(
    sessionId,
    "tool",
    JSON.stringify({ status: "rendered", summary: graphData.summary }),
    toolCall.id,
  );

  // Save graph
  await saveGraph(sessionId, graphData);

  return graphData;
}

export async function expandNode(
  sessionId: string,
  nodeId: string,
  nodeLabel: string,
): Promise<MindMapGraph> {
  const allGraphs = await getAllGraphs(sessionId);
  const fullGraph = allGraphs.length > 0
    ? collectAllNodesAndEdges(allGraphs)
    : { nodes: [], edges: [] };

  const expandPrompt = `Expand the node "${nodeLabel}" (ID: "${nodeId}"). Only generate new child nodes for this node. Maintain consistency with the existing graph. Here is the full current graph for context: ${JSON.stringify(fullGraph)}`;

  const history = await getMessageHistory(sessionId);
  const messages = buildOpenAIMessages(history);

  const expandSystemPrompt =
    SYSTEM_PROMPT +
    `\n\nYou are expanding the node with ID "${nodeId}" (label: "${nodeLabel}"). Only generate new child nodes for this node. Maintain consistency with the existing graph.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: expandSystemPrompt },
      ...messages,
      { role: "user", content: expandPrompt },
    ],
    tools: [CREATE_MIND_MAP_TOOL],
    tool_choice: {
      type: "function",
      function: { name: "create_mind_map" },
    },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new ApiError(500, "AI did not return a function tool call for expansion");
  }

  const graphData: MindMapGraph = JSON.parse(toolCall.function.arguments);

  // Save expand request as user message
  await saveMessage(
    sessionId,
    "user",
    `Expand node: ${nodeLabel}`,
  );

  // Save assistant tool call
  await saveMessage(
    sessionId,
    "assistant",
    JSON.stringify({
      toolCallId: toolCall.id,
      arguments: toolCall.function.arguments,
    }),
  );

  // Save tool response
  await saveMessage(
    sessionId,
    "tool",
    JSON.stringify({ status: "rendered", summary: graphData.summary }),
    toolCall.id,
  );

  // Save graph with parent node reference
  await saveGraph(sessionId, graphData, nodeId);

  return graphData;
}
