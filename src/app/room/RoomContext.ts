import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/socket/types";
import type { Role } from "@/utils/types";

export interface RoomContextValue {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  sessionId: string;
  userId: string;
  role: Role;
}

export const RoomContext = createContext<RoomContextValue>({
  socket: null,
  sessionId: "",
  userId: "",
  role: "STUDENT",
});

export function useRoom() {
  return useContext(RoomContext);
}
