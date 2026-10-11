const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép Frontend kết nối tới
        methods: ["GET", "POST"]
    }
});

// Quản lý lưu trữ các phòng
const rooms = {};

// Hàm tạo mã phòng 4 số ngẫu nhiên
function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on('connection', (socket) => {
    console.log('Người chơi kết nối:', socket.id);

    // Xử lý khi bấm "Tạo phòng"
    socket.on('createRoom', (userData) => {
        const roomCode = generateRoomCode();
        
        rooms[roomCode] = {
            players: [{ id: socket.id, number: 1, data: userData }]
        };

        socket.join(roomCode);
        
        // Gửi trả mã 4 số về cho Frontend
        socket.emit('roomCreated', {
            roomCode: roomCode,
            playerNumber: 1
        });

        console.log(`Phòng ${roomCode} đã được tạo thành công!`);
    });

    // Xử lý khi bấm "Vào phòng"
    socket.on('joinRoom', ({ roomCode, userData }) => {
        const room = rooms[roomCode];

        if (!room) {
            socket.emit('errorMsg', '房號不存在！ (Mã phòng không tồn tại!)');
            return;
        }

        if (room.players.length >= 2) {
            socket.emit('errorMsg', '房間已滿！ (Phòng đã đầy!)');
            return;
        }

        room.players.push({ id: socket.id, number: 2, data: userData });
        socket.join(roomCode);

        socket.emit('roomJoined', {
            roomCode: roomCode,
            playerNumber: 2
        });

        // Báo cho cả 2 người biết đã đủ người để bắt đầu game
        io.to(roomCode).emit('playerJoined', {
            players: room.players
        });
    });

    socket.on('disconnect', () => {
        console.log('Người chơi ngắt kết nối:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy trên Port ${PORT}`);
});