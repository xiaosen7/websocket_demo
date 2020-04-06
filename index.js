const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
app.use(express.static(__dirname));

const server = http.createServer(app);

//websocket协议是依赖于http协议实现握手
const io = require('socket.io')(server);

const reg = /^@([^ ]+) (.+)/;

// key:username value:socket
const userSocketMap = {};

const messages = [];

io.on("connection", socket => {
    let username, rooms = [];
    //服务器监听客户端发送过来的消息
    socket.on("message", msg => {
        if (username) {

            const result = msg.match(reg);

            if (result) {
                // 私聊
                const [_, toUser, content] = result;
                const toSocket = userSocketMap[toUser];

                if (toSocket) {
                    toSocket.send({
                        user: username,
                        content,
                        createAt: new Date
                    })
                } else {
                    socket.send({
                        user: '系统',
                        content: toUser + "不在线",
                        createAt: new Date
                    })
                }
            } else {
                // 广播 
                //如果客户端不在任何房间内 则认为是公共广播 ， 大厅和所有的房间的人都听得到
                //如果在 某个房间内，则认为是向房间内广播则只有他所在的房间内的人才能看到
                const msgObj = {
                    user: username,
                    content: msg,
                    createAt: new Date
                };
                messages.push(msgObj);

                if (rooms.length > 0) {
                    //向房间内广播
                    rooms.forEach(roomName => {
                        io.in(roomName).emit("message", msgObj)
                    })

                } else {
                    io.emit("message", msgObj)
                }

            }

        } else {
            //把用户第一次发言当做用户名
            username = msg;
            userSocketMap[username] = socket;
            //表示向除了自己以外的人广播
            socket.broadcast.emit("message", {
                user: '系统',
                content: `${username}加入聊天室`,
                createAt: new Date()
            })
        }
        /*
        socket.send 向某个人说话
        io.emit 向所有人说话 
         */

    })
    socket.on("join", roomName => {
        if (rooms.includes(roomName)) {
            socket.send({
                user: "系统",
                content: `你已经在 ${roomName} 房间中`,
                createAt: new Date
            })

        } else {
            //socket.join表示进入某个房间
            socket.join(roomName);
            rooms.push(roomName);
            socket.send({
                user: "系统",
                content: `成功进入 ${roomName} 房间`,
                createAt: new Date
            })
            socket.emit("joined", roomName);
        }

    });
    socket.on("leave", roomName => {
        //socket.join表示进入某个房间
        let index = -1;
        if ((index = rooms.indexOf(roomName)) != -1) {
            socket.leave(roomName);
            rooms.splice(index, 1);
            socket.send({
                user: "系统",
                content: `成功离开 ${roomName} 房间`,
                createAt: new Date
            })
            socket.emit("leaved", roomName);
        }

    })
    socket.on("getAllMessages", () => {
        socket.emit("allMessages", messages.slice(-20))
    })
})

//服务器监听客户端的连接 of创建命名空间
/* io.of('/1').on("connection", (socket) => {
    console.log("客户端/1已连接");
    //服务器监听客户端发送过来的消息
    socket.on("message", msg => {
        console.log("msg", msg);
         //服务器向客户端发送消息
        socket.send(`服务器说：${msg}`)
    })
}) */



server.listen(3000);