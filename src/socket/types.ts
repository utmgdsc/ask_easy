export interface SocketData {
  userId: string;
  role: string;
  connectedAt: Date;
  currentSessionId?: string;
}

export interface QuestionCreatePayload {
  content: string;
  sessionId: string;
  visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
  isAnonymous?: boolean;
}

export interface QuestionCreatedPayload {
  id: string;
  content: string;
  visibility: string;
  isAnonymous: boolean;
  createdAt: Date;
  authorId?: string | null;
  authorName?: string | null;
  authorUtorid?: string | null;
}

export interface AnswerModeChangePayload {
  sessionId: string;
  mode: "all" | "instructors_only";
}

export interface AnswerModeChangedPayload {
  mode: "all" | "instructors_only";
}

export interface AnswerModeSyncPayload {
  sessionId: string;
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
  authorUtorid?: string;
  authorRole: "STUDENT" | "TA" | "PROFESSOR";
  isAccepted: boolean;
  createdAt: Date;
}

export interface QuestionUpvotePayload {
  questionId: string;
}

export interface AnswerUpvotePayload {
  answerId: string;
}

export interface AnswerUpdatedPayload {
  id: string;
  questionId: string;
  upvoteCount: number;
}

export interface QuestionResolvePayload {
  questionId: string;
}

export interface QuestionDeletePayload {
  questionId: string;
  sessionId: string;
}

export interface QuestionDeletedPayload {
  questionId: string;
}

export interface AnswerDeletePayload {
  answerId: string;
  sessionId: string;
}

export interface AnswerDeletedPayload {
  answerId: string;
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

export interface QuestionUnresolvePayload {
  questionId: string;
}

export interface QuestionUnresolvedPayload {
  id: string;
  status: "OPEN";
}

export interface QuestionAuthorRevealedPayload {
  id: string;
  authorId: string;
  authorName: string | null;
  authorUtorid: string | null;
  authorRole: "STUDENT" | "TA" | "PROFESSOR";
}

export interface AnswerAuthorRevealedPayload {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string | null;
  authorUtorid: string | null;
  authorRole: "STUDENT" | "TA" | "PROFESSOR";
}

export interface SlideChangePayload {
  sessionId: string;
  pageIndex: number;
}

export interface SlideChangedPayload {
  pageIndex: number;
}

export interface SlideSyncPayload {
  sessionId: string;
}

export interface SlideSyncResponsePayload {
  pageIndex: number;
}

export interface SlidesUploadedPayload {
  sessionId: string;
  slideSetId: string;
}

export interface SlidesAvailablePayload {
  slideSetId: string;
}

export interface ViewerSyncPayload {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Event maps
// ---------------------------------------------------------------------------

/** Events the **client** can send to the **server**. */
export interface ClientToServerEvents {
  "question:create": (payload: QuestionCreatePayload) => void;
  "answer:create": (payload: AnswerCreatePayload) => void;
  "session:join": (payload: SessionJoinPayload, ack?: (error?: string) => void) => void;
  "session:leave": (payload: SessionLeavePayload) => void;
  "question:upvote": (payload: QuestionUpvotePayload) => void;
  "answer:upvote": (payload: AnswerUpvotePayload) => void;
  "question:resolve": (payload: QuestionResolvePayload) => void;
  "question:unresolve": (payload: QuestionUnresolvePayload) => void;
  "question:delete": (payload: QuestionDeletePayload) => void;
  "answer:delete": (payload: AnswerDeletePayload) => void;
  "slide:change": (payload: SlideChangePayload) => void;
  "slide:sync": (payload: SlideSyncPayload) => void;
  "slides:uploaded": (payload: SlidesUploadedPayload) => void;
  "answer-mode:change": (payload: AnswerModeChangePayload) => void;
  "answer-mode:sync": (payload: AnswerModeSyncPayload) => void;
  "viewer:sync": (payload: ViewerSyncPayload) => void;
}

export interface ViewerCountPayload {
  count: number;
}

/** Events the **server** can send to the **client**. */
export interface ServerToClientEvents {
  "question:created": (payload: QuestionCreatedPayload) => void;
  "question:error": (payload: { message: string }) => void;
  "answer:created": (payload: AnswerCreatedPayload) => void;
  "answer:error": (payload: { message: string }) => void;
  "question:updated": (payload: QuestionUpdatedPayload) => void;
  "answer:updated": (payload: AnswerUpdatedPayload) => void;
  "question:resolved": (payload: QuestionResolvedPayload) => void;
  "question:unresolved": (payload: QuestionUnresolvedPayload) => void;
  "question:deleted": (payload: QuestionDeletedPayload) => void;
  "answer:deleted": (payload: AnswerDeletedPayload) => void;
  "slide:changed": (payload: SlideChangedPayload) => void;
  "slide:sync": (payload: SlideSyncResponsePayload) => void;
  "slide:error": (payload: { message: string }) => void;
  "slides:available": (payload: SlidesAvailablePayload) => void;
  "answer-mode:changed": (payload: AnswerModeChangedPayload) => void;
  "viewer:count": (payload: ViewerCountPayload) => void;
  "session:ended": (payload: Record<string, never>) => void;
  "question:author:revealed": (payload: QuestionAuthorRevealedPayload) => void;
  "answer:author:revealed": (payload: AnswerAuthorRevealedPayload) => void;
}

/** Events exchanged between Socket.IO server instances (via Redis adapter). */
export interface InterServerEvents {
  ping: () => void;
}
