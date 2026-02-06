export interface SocketData {
  userId: string;
  connectedAt: Date;
}

export interface QuestionCreatePayload {
  content: string;
  sessionId: string;
  visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
  isAnonymous?: boolean;
  slideId?: string;
}

export interface QuestionCreatedPayload {
  id: string;
  content: string;
  visibility: string;
  isAnonymous: boolean;
  slideId: string | null;
  createdAt: Date;
  authorId?: string | null;
}

export interface SessionJoinPayload {
  sessionId: string;
}

export interface SessionLeavePayload {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Event maps
// ---------------------------------------------------------------------------

/** Events the **client** can send to the **server**. */
export interface ClientToServerEvents {
  "question:create": (payload: QuestionCreatePayload) => void;
  "session:join": (payload: SessionJoinPayload) => void;
  "session:leave": (payload: SessionLeavePayload) => void;
}

/** Events the **server** can send to the **client**. */
export interface ServerToClientEvents {
  "question:created": (payload: QuestionCreatedPayload) => void;
  "question:error": (payload: { message: string }) => void;
}

/** Events exchanged between Socket.IO server instances (via Redis adapter). */
export interface InterServerEvents {
  ping: () => void;
}
