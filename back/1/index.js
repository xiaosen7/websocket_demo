let express = require('express');
let app = express();
app.use(express.static(__dirname));
app.listen(8080);

//websocket服务器分为服务端和客户端
const Server = require('ws').Server;
//创建一个websocket服务器实例 监听8080 websocket没有跨域问题
const server = new Server({ port: 8000 });
//监听客户端连接和发过来的消息 socket代表客户端的连接
//A拨打B的电话号 ，如果B接通了，则相当于在他们之间建立了连接，connection
server.on('connection', (socket) => {
    console.log("连接已建立")
    //监听客户端发过来的消息 
    socket.on('message', (msg) => {
        console.log("客户端对你说", msg);
        //向指定的客户端发送消息
        socket.send(`服务器对你说 ${msg}`);
    })
})