import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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
  }

  handleDisconnect(client: Socket) {
    console.log(`Disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Connected ${client.id}`);
    this.server.emit('test', 'test');
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
