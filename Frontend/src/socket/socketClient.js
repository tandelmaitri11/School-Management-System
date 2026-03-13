import { io } from "socket.io-client";

let socketInstance = null;

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!socketInstance) {
    socketInstance = io("http://localhost:3000", {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: {
        token,
      },
    });
  } else if (!socketInstance.connected) {
    socketInstance.auth = { token };
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
