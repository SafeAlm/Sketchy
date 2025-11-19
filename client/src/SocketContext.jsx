//this page was entirely built with help with online tutorials and its implementation into the remaining pages such as App.jsx and WaitingLobby.jsx
//this page was necessary because sockets would attempt to connect and close at inconvenient times with navigating
//this lead to certain sockets NOT connecting at all, therefore, a universal socket was created to avoid this issue

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!socketRef.current) {
            console.log("Creating persistent socket connection");
            socketRef.current = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:3000");

            socketRef.current.on("connect", () => {
                console.log("Socket connected:", socketRef.current.id);
            });

            socketRef.current.on("connect_error", (err) => {
                console.error("Socket connection error:", err.message);
            });

            socketRef.current.on("error", (data) => {
                console.error("Socket error event:", data);
            });

            setSocket(socketRef.current);
        }

        //this part is if its ever nexessary to diconnect the socket
        //the way it seems, i feel it should persist the entire time
        return () => {
        // socketRef.current?.disconnect();
        };
  }, []);

    return (
        <SocketContext.Provider value={socket}>
        {children}
        </SocketContext.Provider>
    );
}
