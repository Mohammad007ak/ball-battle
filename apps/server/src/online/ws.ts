import type { Server } from 'node:http';
import { ClientMsgSchema } from '@chakachak/protocol';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Ctx } from '../app';
import { authenticate } from '../auth';
import { Lobby } from './lobby';

/** WebSocket endpoint for online matches: /v1/ws. First message must be `hello` with the token. */
export function attachOnline(c: Ctx, server: Server) {
  const lobby = new Lobby(c);
  const wss = new WebSocketServer({
    server,
    path: '/v1/ws',
    perMessageDeflate: true,
    maxPayload: 4096,
  });
  const loop = setInterval(() => lobby.pump(performance.now()), 8);
  const mm = setInterval(() => lobby.matchmake(), 500);
  wss.on('close', () => {
    clearInterval(loop);
    clearInterval(mm);
  });

  wss.on('connection', (ws: WebSocket) => {
    let playerId: string | null = null,
      msgs = 0,
      window = c.now();
    const send = (m: object) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(m));
    const helloTimer = setTimeout(() => ws.close(4001, 'hello'), 5000);
    ws.on('message', (raw) => {
      if (c.now() - window > 1000) {
        window = c.now();
        msgs = 0;
      }
      if (++msgs > 40) return ws.close(4008, 'rate');
      let parsed;
      try {
        parsed = ClientMsgSchema.safeParse(JSON.parse(String(raw)));
      } catch {
        return;
      }
      if (!parsed.success) return;
      const m = parsed.data;
      if (m.t === 'hello') {
        try {
          playerId = authenticate(c, 'Bearer ' + m.token);
        } catch {
          return ws.close(4003, 'auth');
        }
        clearTimeout(helloTimer);
        send({ t: 'welcome', inMatch: lobby.playerRoom.has(playerId) });
        return;
      }
      if (!playerId) return;
      if (m.t === 'queue') return lobby.join(playerId, send);
      if (m.t === 'cancel') return lobby.cancel(playerId);
      if (m.t === 'rejoin') return lobby.rejoin(playerId, send);
      const seat = lobby.seatOf(playerId);
      if (!seat) return;
      const [room, i] = seat;
      if (m.t === 'pick') room.onPick(i, m.i);
      else if (m.t === 'in') room.onInput(i, m.i);
      else if (m.t === 'emo') room.onEmote(i, m.k);
      else if (m.t === 'fin') room.onFinisher(i);
      else if (m.t === 'surrender') room.onSurrender(i);
    });
    ws.on('close', () => {
      clearTimeout(helloTimer);
      if (playerId) lobby.disconnect(playerId);
    });
  });
  return { lobby, wss };
}
