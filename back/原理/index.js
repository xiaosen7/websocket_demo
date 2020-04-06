const net = require('net');
const crypto = require('crypto');

const CODE = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const server = net.createServer(socket => {
    //监听客户端发来的数据 第一次升级协议 on connection
    socket.once('data', data => {
        data = data.toString();
        // 1. 拿到 请求行 请求头 
        const [requestLine, ...requestHeadersAry] = data.split('\r\n').slice(0, -2);
        const headers = requestHeadersAry.reduce((headers, line) => {
            const [key, value] = line.split(': ');
            headers[key] = value;
            return headers;
        }, {});
        // console.log(headers);

        // 2. 如果请求头Upgrade是websocket 则需要升级协议
        if (headers['Upgrade'] === 'websocket') {

            // 拿到Sec-WebSocket-Key
            const KEY = headers['Sec-WebSocket-Key'];

            // 算出Sec-WebSocket-Key
            const accept = crypto.createHash('sha1').update(KEY + CODE).digest('base64');
            const response = [
                `HTTP/1.1 101 Switching Protocols`,
                `Upgrade: websocket`,
                `Connection: Upgrade`,
                `Sec-WebSocket-Accept: ${accept}`,
                `\r\n`
            ].join('\r\n');
            // console.log(response);

            // 第一次响应升级协议
            socket.write(response);

            //下面监听客户端发送过来的消息

            socket.on('data', function (buffers) {

                /* 
                0                   1                   2                   3
                0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
                +-+-+-+-+-------+-+-------------+-------------------------------+
                |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
                |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
                |N|V|V|V|       |S|             |   (if payload len==126/127)   |
                | |1|2|3|       |K|             |                               |
                +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
                |     Extended payload length continued, if payload len == 127  |
                + - - - - - - - - - - - - - - - +-------------------------------+
                |                               |Masking-key, if MASK set to 1  |
                +-------------------------------+-------------------------------+
                | Masking-key (continued)       |          Payload Data         |
                +-------------------------------- - - - - - - - - - - - - - - - +
                :                     Payload Data continued ...                :
                + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
                |                     Payload Data continued ...                |
                +---------------------------------------------------------------+
                */
                //判断是否是结束位,第一个bit是不是1
                const fin = (buffers[0] & 0b10000000) === 0b10000000;

                //取一个字节的后四位,得到的一个是十进制数
                const opcode = buffers[0] & 0b00001111;

                //第一位是否是1
                const masked = buffers[1] & 0b100000000 === 0b100000000;

                //取得负载数据的长度
                let payloadLength = buffers[1] & 0b01111111;
                let maskOffset = 2;
                if (payloadLength == 126) {
                    payloadLength = buffers.slice(2, 4);
                    maskOffset = 4;
                } else if (payloadLength == 127) {
                    payloadLength = buffers.slice(2, 10);
                    maskOffset = 10;
                }

                //掩码
                const mask = buffers.slice(maskOffset, maskOffset + 4);

                //负载数据
                const payload = buffers.slice(6);

                //对数据进行解码处理
                unmask(payload, mask);

                //向客户端响应数据
                const ret = Buffer.from("世界");
                const response = Buffer.alloc(2 + ret.length);
                response[0] = opcode | 0b10000000;//1表示发送结束
                response[1] = ret.length;//负载的长度
                ret.copy(response, 2);

                // console.log(payload.toString());

                socket.write(response);
            });
            socket.on('end', function () {
                console.log('end');
            });
            socket.on('close', function () {
                console.log('close');
            });
            socket.on('error', function (error) {
                console.log(error);
            });
        }

    });


});
function unmask(buffer, mask) {
    const length = buffer.length;
    for (let i = 0; i < length; i++) {
        buffer[i] ^= mask[i & 3];
    }
}


server.listen(3000);

