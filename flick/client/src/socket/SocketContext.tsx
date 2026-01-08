import { createContext, useEffect, useState, ReactNode } from "react";
import io, { Socket } from "socket.io-client";
import { env } from "@/conf/env";
import useProfileStore from "@/store/profileStore";

// Define a type for your socket context
type SocketContextType = Socket | null;
const SocketContext = createContext<SocketContextType>(null);

interface SocketProviderProps {
  children: ReactNode;
}

const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const profile = useProfileStore((state) => state.profile);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!profile._id) return;

    const newSocket = io(env.serverUri, {
      transports: ["websocket"],
      auth: {
        userId: profile._id,
      },
    });

    setSocket(newSocket);

    // Cleanup on unmount or profile change
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [profile._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, SocketContext };