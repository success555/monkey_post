import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, Database } from 'firebase/database';
import { PlayerState, BallState } from '../types/game';

export interface RoomData {
  id: string;
  hostName: string;
  guestName?: string;
  state: 'waiting' | 'ready' | 'playing' | 'ended';
  score: { home: number; away: number };
  timer: number;
  players?: Record<string, Partial<PlayerState>>;
  ball?: Partial<BallState>;
  lastCommentary?: string;
}

class MultiplayerService {
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private currentRoomId: string | null = null;
  private isHost: boolean = false;
  private localPlayerName: string = 'Street Baller';
  private broadcastChannel: BroadcastChannel | null = null;

  // Listeners
  public onRoomUpdate?: (room: RoomData) => void;
  public onStateSync?: (players: Partial<PlayerState>[], ball: Partial<BallState>) => void;
  public onChatMessage?: (sender: string, text: string) => void;

  constructor() {
    // Setup local BroadcastChannel for tab-to-tab peer testing on same browser
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('monkey_post_network');
      this.broadcastChannel.onmessage = (event) => {
        this.handlePeerMessage(event.data);
      };
    }
  }

  // Initialize Firebase with custom credentials (optional)
  public initializeFirebase(config: Record<string, string>): boolean {
    try {
      if (!getApps().length) {
        this.app = initializeApp(config);
      } else {
        this.app = getApps()[0];
      }
      this.db = getDatabase(this.app);
      return true;
    } catch (e) {
      console.warn('Firebase init error (using offline/local peer fallback):', e);
      return false;
    }
  }

  // Generate random 4-letter Nigerian street room codes (e.g. LAGO, IKOY, YABA, SURU)
  private generateRoomCode(): string {
    const codes = ['LAGO', 'IKOY', 'YABA', 'SURU', 'VICT', 'AJEC', 'FEST', 'MARY', 'NAIJ'];
    const prefix = codes[Math.floor(Math.random() * codes.length)];
    const num = Math.floor(10 + Math.random() * 89);
    return `${prefix}${num}`;
  }

  // Create Room
  public async createRoom(playerName: string): Promise<string> {
    this.localPlayerName = playerName;
    this.isHost = true;
    const roomId = this.generateRoomCode();
    this.currentRoomId = roomId;

    const initialRoom: RoomData = {
      id: roomId,
      hostName: playerName,
      state: 'waiting',
      score: { home: 0, away: 0 },
      timer: 300
    };

    if (this.db) {
      const roomRef = ref(this.db, `rooms/${roomId}`);
      await set(roomRef, initialRoom);
      this.listenToFirebaseRoom(roomId);
    } else {
      // Local broadcast fallback
      this.broadcastChannel?.postMessage({
        type: 'room_created',
        room: initialRoom
      });
    }

    return roomId;
  }

  // Join Room
  public async joinRoom(roomId: string, playerName: string): Promise<boolean> {
    this.localPlayerName = playerName;
    this.isHost = false;
    this.currentRoomId = roomId.toUpperCase();

    if (this.db) {
      const roomRef = ref(this.db, `rooms/${this.currentRoomId}`);
      // Register guest
      await set(ref(this.db, `rooms/${this.currentRoomId}/guestName`), playerName);
      await set(ref(this.db, `rooms/${this.currentRoomId}/state`), 'ready');
      this.listenToFirebaseRoom(this.currentRoomId);
      return true;
    } else {
      // Local broadcast peer join
      this.broadcastChannel?.postMessage({
        type: 'join_room',
        roomId: this.currentRoomId,
        guestName: playerName
      });
      return true;
    }
  }

  private listenToFirebaseRoom(roomId: string) {
    if (!this.db) return;
    const roomRef = ref(this.db, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
      const val = snapshot.val();
      if (val && this.onRoomUpdate) {
        this.onRoomUpdate(val);
      }
    });

    // Listen to real-time sync channel
    const syncRef = ref(this.db, `rooms/${roomId}/sync`);
    onValue(syncRef, (snapshot) => {
      const data = snapshot.val();
      if (data && this.onStateSync) {
        this.onStateSync(data.players || [], data.ball || {});
      }
    });
  }

  // Send real-time match sync frame
  public broadcastGameState(players: PlayerState[], ball: BallState, score: { home: number; away: number }) {
    if (!this.currentRoomId) return;

    // Compact sync payload
    const syncPayload = {
      players: players.map(p => ({
        id: p.id,
        position: { x: Math.round(p.position.x * 10) / 10, y: Math.round(p.position.y * 10) / 10, z: Math.round(p.position.z * 10) / 10 },
        velocity: { x: Math.round(p.velocity.x * 10) / 10, y: Math.round(p.velocity.y * 10) / 10, z: Math.round(p.velocity.z * 10) / 10 },
        rotation: Math.round(p.rotation * 100) / 100,
        hasBall: p.hasBall
      })),
      ball: {
        position: { x: Math.round(ball.position.x * 10) / 10, y: Math.round(ball.position.y * 10) / 10, z: Math.round(ball.position.z * 10) / 10 },
        velocity: { x: Math.round(ball.velocity.x * 10) / 10, y: Math.round(ball.velocity.y * 10) / 10, z: Math.round(ball.velocity.z * 10) / 10 },
        ownerId: ball.ownerId
      },
      score
    };

    if (this.db) {
      const syncRef = ref(this.db, `rooms/${this.currentRoomId}/sync`);
      set(syncRef, syncPayload);
    } else {
      this.broadcastChannel?.postMessage({
        type: 'game_sync',
        roomId: this.currentRoomId,
        payload: syncPayload
      });
    }
  }

  // Send quick banter chat message
  public sendChatMessage(text: string) {
    if (!this.currentRoomId) return;
    if (this.db) {
      const chatRef = ref(this.db, `rooms/${this.currentRoomId}/chat`);
      push(chatRef, {
        sender: this.localPlayerName,
        text,
        timestamp: Date.now()
      });
    } else {
      this.broadcastChannel?.postMessage({
        type: 'chat',
        roomId: this.currentRoomId,
        sender: this.localPlayerName,
        text
      });
      if (this.onChatMessage) {
        this.onChatMessage(this.localPlayerName, text);
      }
    }
  }

  private handlePeerMessage(data: any) {
    if (!data || !this.currentRoomId || data.roomId !== this.currentRoomId) return;

    if (data.type === 'join_room' && this.isHost) {
      const roomUpdate: RoomData = {
        id: this.currentRoomId,
        hostName: this.localPlayerName,
        guestName: data.guestName,
        state: 'ready',
        score: { home: 0, away: 0 },
        timer: 300
      };
      this.broadcastChannel?.postMessage({
        type: 'room_ready',
        room: roomUpdate
      });
      if (this.onRoomUpdate) this.onRoomUpdate(roomUpdate);
    } else if (data.type === 'room_ready') {
      if (this.onRoomUpdate) this.onRoomUpdate(data.room);
    } else if (data.type === 'game_sync') {
      if (this.onStateSync) {
        this.onStateSync(data.payload.players, data.payload.ball);
      }
    } else if (data.type === 'chat') {
      if (this.onChatMessage) {
        this.onChatMessage(data.sender, data.text);
      }
    }
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}

export const multiplayerService = new MultiplayerService();

