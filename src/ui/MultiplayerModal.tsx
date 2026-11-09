import React, { useState } from 'react';
import { X, Copy, Check, Users, Wifi, Key, MessageSquare, Play } from 'lucide-react';
import { multiplayerService, RoomData } from '../multiplayer/multiplayerService';

interface MultiplayerModalProps {
  onClose: () => void;
  onStartMultiplayerMatch: (roomId: string) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  onClose,
  onStartMultiplayerMatch
}) => {
  const [playerName, setPlayerName] = useState('Naija Baller');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'lobby' | 'firebase'>('lobby');
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [copied, setCopied] = useState(false);
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseDbUrl, setFirebaseDbUrl] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  const handleCreateRoom = async () => {
    const code = await multiplayerService.createRoom(playerName);
    const room: RoomData = {
      id: code,
      hostName: playerName,
      state: 'waiting',
      score: { home: 0, away: 0 },
      timer: 300
    };
    setCurrentRoom(room);
  };

  const handleJoinRoom = async () => {
    if (!joinCode) return;
    const success = await multiplayerService.joinRoom(joinCode, playerName);
    if (success) {
      const room: RoomData = {
        id: joinCode.toUpperCase(),
        hostName: 'Host Baller',
        guestName: playerName,
        state: 'ready',
        score: { home: 0, away: 0 },
        timer: 300
      };
      setCurrentRoom(room);
    }
  };

  const handleCopyCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveFirebaseConfig = () => {
    if (firebaseApiKey && firebaseDbUrl) {
      multiplayerService.initializeFirebase({
        apiKey: firebaseApiKey,
        databaseURL: firebaseDbUrl,
        projectId: firebaseProjectId
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl flex flex-col relative my-auto max-h-[94vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl text-white">ONLINE STREET MULTIPLAYER</h2>
            <p className="text-zinc-400 text-xs">Play 1v1 Street Rooms with live state sync</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-5 border border-white/5">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'lobby' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ROOM LOBBY
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'firebase' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>FIREBASE CONFIG</span>
          </button>
        </div>

        {activeTab === 'lobby' ? (
          <div className="space-y-4">
            {/* Player Name */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Your Street Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Area Commander"
              />
            </div>

            {!currentRoom ? (
              <div className="space-y-3 pt-2">
                {/* Create Room */}
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>CREATE NEW STREET ROOM</span>
                </button>

                <div className="flex items-center my-3">
                  <div className="flex-1 border-t border-zinc-800" />
                  <span className="px-3 text-[10px] font-bold text-zinc-500 uppercase">OR JOIN ROOM</span>
                  <div className="flex-1 border-t border-zinc-800" />
                </div>

                {/* Join Room */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ENTER 4-DIGIT CODE"
                    maxLength={8}
                    className="flex-1 px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-mono font-bold text-sm text-center uppercase tracking-widest focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs active:scale-95 transition-all"
                  >
                    JOIN
                  </button>
                </div>
              </div>
            ) : (
              /* Inside Room */
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  ROOM CODE (SHARE WITH OPPONENT)
                </span>
                <div className="flex items-center space-x-3 my-2">
                  <span className="font-mono text-3xl font-black text-amber-400 tracking-wider">
                    {currentRoom.id}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 my-3 text-xs font-bold text-zinc-300">
                  <div className="p-2 bg-zinc-900 rounded-lg text-center border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">HOST:</span>
                    <span className="text-emerald-400">{currentRoom.hostName}</span>
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-lg text-center border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">GUEST:</span>
                    <span className={currentRoom.guestName ? "text-cyan-400" : "text-zinc-600 italic"}>
                      {currentRoom.guestName || 'Waiting...'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onStartMultiplayerMatch(currentRoom.id)}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-xl active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START MATCH NOW</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Firebase configuration tab */
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Optional: Connect your own Firebase Realtime Database. If left blank, the game uses local peer broadcast networking!
            </p>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Firebase API Key
              </label>
              <input
                type="text"
                value={firebaseApiKey}
                onChange={(e) => setFirebaseApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Database URL
              </label>
              <input
                type="text"
                value={firebaseDbUrl}
                onChange={(e) => setFirebaseDbUrl(e.target.value)}
                placeholder="https://your-project.firebaseio.com"
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={firebaseProjectId}
                onChange={(e) => setFirebaseProjectId(e.target.value)}
                placeholder="my-monkey-post-app"
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleSaveFirebaseConfig}
              className="w-full py-2.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs active:scale-95 transition-all"
            >
              {configSaved ? 'SAVED SUCCESSFULLY!' : 'SAVE FIREBASE CREDENTIALS'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

