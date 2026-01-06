import { handleSocketError } from "../errors/handle-socket-error";
import type { SocketEventModule } from "../types/socket-events";

const registerConnectionEvents: SocketEventModule = (socket) => {
	console.log(`Socket connected: ${socket.id}`);

	socket.on("disconnect", () => {
		try {
			console.log(`Socket disconnected: ${socket.id}`);
		} catch (error) {
			handleSocketError(socket, error);
		}
	});

	socket.on("error", (error) => {
		handleSocketError(socket, error);
	});
};

export default registerConnectionEvents;
