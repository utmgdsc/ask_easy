"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import ClassChat from "./classChat";
import SlideViewer from "./slideViewer";
import type { ClientToServerEvents, ServerToClientEvents } from "@/socket/types";
import type { Role } from "@/utils/types";
import { RoomContext } from "./RoomContext";
import { SlideUpdateContext } from "./SlideUpdateContext";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RoomProps {
  sessionId?: string;
  userId?: string;
  role?: Role;
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function chatPanel(isMdSize: boolean) {
  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isMdSize ? "horizontal" : "vertical"}>
        <ResizablePanel minSize={30}>
          <ClassChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function chatAndSlidePanel(
  isMdSize: boolean,
  resizableWidth: number,
  setResizableWidth: (width: number) => void,
  isProfessor: boolean
) {
  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isMdSize ? "horizontal" : "vertical"}>
        <ResizablePanel
          defaultSize={100 - resizableWidth}
          minSize={0}
          onResize={(panelWidth) => {
            setResizableWidth(panelWidth);
          }}
        >
          <SlideViewer isProfessor={isProfessor} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={resizableWidth} minSize={30}>
          <ClassChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------

export default function Room({
  sessionId = "placeholder-session",
  userId: userIdProp,
  role: roleProp,
}: RoomProps) {
  const isMdSize = useMediaQuery("(min-width: 1024px)");
  const [isSlidesVisible, setIsSlidesVisible] = useState(true);
  const [resizableWidth, setResizableWidth] = useState(30);

  // Resolved from /api/auth/me (falls back to props for legacy usage)
  const [userId, setUserId] = useState(userIdProp ?? "");
  const [role, setRole] = useState<Role>(roleProp ?? "STUDENT");
  const [authReady, setAuthReady] = useState(!!userIdProp);

  // Shared socket — initialised once, shared via RoomContext
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
    null
  );
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Fetch the authenticated user if not already provided via props
  useEffect(() => {
    if (userIdProp) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.userId) {
          setUserId(data.userId);
          setRole((data.role as Role) ?? "STUDENT");
        }
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));
  }, [userIdProp]);

  // Connect to Socket.IO once auth is ready and userId is known.
  // withCredentials: true sends the iron-session cookie so the server-side
  // auth middleware can verify the session without needing a separate token.
  useEffect(() => {
    if (!authReady || !userId) return;

    const s: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      withCredentials: true,
    });

    s.on("connect", () => {
      s.emit("session:join", { sessionId: sessionIdRef.current });
      setSocket(s);
    });

    return () => {
      s.emit("session:leave", { sessionId: sessionIdRef.current });
      s.disconnect();
      setSocket(null);
    };
  }, [authReady, userId]);

  if (!authReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <span className="text-stone-400 text-sm">Authenticating…</span>
      </div>
    );
  }

  function rerender() {
    setIsSlidesVisible((prev) => !prev);
  }

  const isProfessor = role === "PROFESSOR";

  return (
    <RoomContext.Provider value={{ socket, sessionId, userId, role }}>
      <div className="h-screen w-full bg-background font-sans">
        <SlideUpdateContext.Provider value={{ isSlidesVisible, rerender }}>
          {isSlidesVisible
            ? chatAndSlidePanel(isMdSize, resizableWidth, setResizableWidth, isProfessor)
            : chatPanel(isMdSize)}
        </SlideUpdateContext.Provider>
      </div>
    </RoomContext.Provider>
  );
}
