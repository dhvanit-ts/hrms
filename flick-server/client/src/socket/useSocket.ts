import { useContext } from "react";
import { SocketContext } from "./SocketContext"; // Import the SocketContext

const useSocket = () => {
  return useContext(SocketContext) ?? null;
};

export default useSocket;
