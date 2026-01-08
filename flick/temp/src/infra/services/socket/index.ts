import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { env } from "@/config/env";
import modules from "./events/index";
import type { SocketEventModule } from "./types/socket-events";

class SocketService {
	private io: SocketServer | null = null;

	init(server: HttpServer) {
		if (this.io) return this.io;

		this.io = new SocketServer(server, {
			cors: {
				origin: env.ACCESS_CONTROL_ORIGIN,
				methods: ["GET", "POST"],
			},
			transports: ["websocket"],
		});

		this.attachModules(Object.values(modules));

		return this.io;
	}

	private attachModules(modules: SocketEventModule[]) {
		if (!this.io) throw new Error("Socket server not initialized");

		modules.forEach((module) => {
			this.io.on("connection", (socket) => module(socket, this.io));
		});
	}

	get() {
		if (!this.io) throw new Error("Socket server not initialized");
		return this.io;
	}

	async close() {
		if (!this.io) return;

		await new Promise((resolve) => this.io.close(resolve));
		this.io = null;
	}
}

export default new SocketService();
