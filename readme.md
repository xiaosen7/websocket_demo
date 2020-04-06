
## 原始双向通信

- 轮询 轮询是客户端和服务器之间会一直进行连接，每隔一段时间就询问一次 很耗流量，也会消耗CPU的利用率

- 长轮询 长轮询是对轮询的改进版，客户端发送HTTP给服务器之后，看有没有新消息，如果没有新消息，就一直等待

- iframe流 通过在HTML页面里嵌入一个隐藏的iframe,然后将这个iframe的src属性设为对一个长连接的请求,服务器端就能源源不断地往客户推送数据。

## websocket

>websocket 属于应用层协议，它基于TCP传输协议，并复用HTTP的握手通道。

- WebSocket复用了HTTP的握手通道。具体指的是，客户端通过HTTP请求与WebSocket服务端协商升级协议。协议升级完成后，后续的数据交换则遵照WebSocket的协议。



首先，客户端发起协议升级请求。可以看到，采用的是标准的HTTP报文格式，且只支持GET方法。

websocket第一次请求头（已过滤其他不重要的请求头）如下：

>GET 

- Connection: Upgrade 升级协议
- Upgrade: websocket 要升级的协议 websocket
- Sec-WebSocket-Version websocket协议版本
- Sec-WebSocket-Key 用于校验

```request headers
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: c8ekovsZGG935N5inGlnRQ==
```

服务端：响应协议升级

- Status Code: 101 Switching Protocols  切换协议 
- Upgrade: websocket  同意升级
- Sec-WebSocket-Accept 用于校验（根据Sec-WebSocket-Key算出来）

```response headers
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: m6Fknh1tVIJJYMFswOi6cn3yV+A=
```
>Sec-WebSocket-Accept ：将Sec-WebSocket-Key跟258EAFA5-E914-47DA-95CA-C5AB0DC85B11拼接。通过SHA1计算出摘要，并转成base64字符串。Sec-WebSocket-Key主要目的并不是确保数据的安全性，因为Sec-WebSocket-Key、Sec-WebSocket-Accept的转换计算公式是公开的，而且非常简单，最主要的作用是预防一些常见的意外情况（非故意的）


其他：[socket.io](https://github.com/socketio/socket.io)