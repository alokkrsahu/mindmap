export interface ApiNode {
  id: string;
  label: string;
  description?: string;
  color: string;
  textColor: string;
  type: 'root' | 'branch' | 'leaf';
  isExpandable: boolean;
  depth: number;
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface GraphResponse {
  nodes: ApiNode[];
  edges: ApiEdge[];
  summary: string;
  expansionContext?: string;
}

export interface SessionResponse {
  sessionId: string;
  createdAt: string;
}

export interface SessionListItem {
  id: string;
  createdAt: string;
  messageCount: number;
  graphCount: number;
  firstMessage: string | null;
  lastSummary: string | null;
}

export interface SessionListResponse {
  sessions: SessionListItem[];
}

export interface HistoryResponse {
  sessionId: string;
  createdAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
  graphs: Array<{
    id: string;
    nodes: ApiNode[];
    edges: ApiEdge[];
    summary: string;
    parentNodeId: string | null;
    createdAt: string;
  }>;
}
