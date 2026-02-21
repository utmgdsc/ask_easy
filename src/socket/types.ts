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

export interface AnswerCreatePayload {
  questionId: string;
  content: string;
  isAnonymous?: boolean;
}

export interface AnswerCreatedPayload {
  id: string;
  questionId: string;
  content: string;
  isAnonymous: boolean;
  authorId?: string;
  authorName?: string;
  authorRole: "STUDENT" | "TA" | "PROFESSOR";
  isAccepted: boolean;
  createdAt: Date;
}

export interface QuestionUpvotePayload {
  questionId: string;
}

export interface QuestionResolvePayload {
  questionId: string;
}

export interface QuestionUpdatedPayload {
  id: string;
  upvoteCount: number;
}

export interface QuestionResolvedPayload {
  id: string;
  status: "RESOLVED";
}

// ---------------------------------------------------------------------------
// Event maps
// ---------------------------------------------------------------------------

/** Events the **client** can send to the **server**. */
export interface ClientToServerEvents {
  "question:create": (payload: QuestionCreatePayload) => void;
  "answer:create": (payload: AnswerCreatePayload) => void;
  "session:join": (payload: SessionJoinPayload) => void;
  "session:leave": (payload: SessionLeavePayload) => void;
  "question:upvote": (payload: QuestionUpvotePayload) => void;
  "question:resolve": (payload: QuestionResolvePayload) => void;
}

/** Events the **server** can send to the **client**. */
export interface ServerToClientEvents {
  "question:created": (payload: QuestionCreatedPayload) => void;
  "question:error": (payload: { message: string }) => void;
  "answer:created": (payload: AnswerCreatedPayload) => void;
  "answer:error": (payload: { message: string }) => void;
  "question:updated": (payload: QuestionUpdatedPayload) => void;
  "question:resolved": (payload: QuestionResolvedPayload) => void;
}

/** Events exchanged between Socket.IO server instances (via Redis adapter). */
export interface InterServerEvents {
  ping: () => void;
}
