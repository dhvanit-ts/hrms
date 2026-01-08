import type { Socket, Server as SocketServer } from "socket.io";

export type SocketEventModule = (socket: Socket, io: SocketServer) => void;
