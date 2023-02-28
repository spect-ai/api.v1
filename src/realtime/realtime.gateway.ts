import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('Realtime Gateway Initialized');
    this.server = server;
    server.on('connection', (socket) => {
      console.log(`Connected ${socket.id}`);

      socket.on('join', (room) => {
        console.log(`Joined ${room}`);
        socket.join(room);
      });

      socket.on('leave', (room) => {
        console.log(`Left ${room}`);
        socket.leave(room);
      });

      socket.on('disconnect', () => {
        console.log(`Disconnected ${socket.id}`);
      });
    });
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
