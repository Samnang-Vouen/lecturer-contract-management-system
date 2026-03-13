import { Server } from "socket.io";

import NotificationSocketService from "./notification.socket.js";

let io;
let notificationSocket;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5173'],
            credentials: true
        }
    })

    notificationSocket = new NotificationSocketService(io);
    notificationSocket.register();
}


const getNotificationSocket = () => notificationSocket;

export { initSocket, getNotificationSocket };