import { Server } from 'socket.io';

export let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173"],
            credentials : true
        }
    })

    io.on('connection', (socket) => {
        socket.on("join", (userData) => {
            const { role } = userData;
            if (role === 'admin' || role == "management" || role == "lecturer") {
                socket.join('room');
            }
        });
        socket.on("disconnect", () => {
            console.log("socket disconnected : ", socket.id);
        })
    })

    return io;
}