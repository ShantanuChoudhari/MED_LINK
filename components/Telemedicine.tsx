
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare,
  Send, Copy, CheckCheck, Users, ShieldCheck, Wifi, WifiOff, Hash,
} from 'lucide-react';
import { User } from '../types';

interface Props { user: User; }

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : 'http://localhost:5000';
const ICE_SERVERS  = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302'  },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface Message { sender: string; role: string; text: string; time: string; own: boolean; }
interface RemotePeer { socketId: string; name: string; role: string; }

type CallState = 'idle' | 'joining' | 'waiting' | 'ringing' | 'connected';

// Generate a short room ID
const genRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const Telemedicine: React.FC<Props> = ({ user }) => {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef     = useRef<Socket | null>(null);
  const pcRef         = useRef<RTCPeerConnection | null>(null);
  const localStreamRef= useRef<MediaStream | null>(null);
  const localVidRef   = useRef<HTMLVideoElement>(null);
  const remoteVidRef  = useRef<HTMLVideoElement>(null);
  const messagesEndRef= useRef<HTMLDivElement>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [roomInput,   setRoomInput]   = useState('');
  const [roomId,      setRoomId]      = useState('');
  const [callState,   setCallState]   = useState<CallState>('idle');
  const [remotePeer,  setRemotePeer]  = useState<RemotePeer | null>(null);
  const [isMuted,     setIsMuted]     = useState(false);
  const [isVidOff,    setIsVidOff]    = useState(false);
  const [peerMuted,   setPeerMuted]   = useState(false);
  const [peerVidOff,  setPeerVidOff]  = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([
    { sender: 'System', role: 'system', text: '🔒 Secure encryption enabled. Share your Room ID to connect with the other party.', time: '', own: false },
  ]);
  const [inputText,   setInputText]   = useState('');
  const [copied,      setCopied]      = useState(false);
  const [callDuration,setCallDuration]= useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    socketRef.current?.emit('leave-room', { roomId });
    socketRef.current?.disconnect();
    localStreamRef.current = null;
    pcRef.current          = null;
    socketRef.current      = null;
    if (localVidRef.current)  localVidRef.current.srcObject  = null;
    if (remoteVidRef.current) remoteVidRef.current.srcObject = null;
    setCallState('idle');
    setRemotePeer(null);
    setIsMuted(false); setIsVidOff(false);
    setPeerMuted(false); setPeerVidOff(false);
    pendingCandidates.current = [];
  }, [roomId]);

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPeerConnection = useCallback((stream: MediaStream, targetSocketId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Remote stream → remote video element
    pc.ontrack = (e) => {
      if (remoteVidRef.current && e.streams[0]) {
        remoteVidRef.current.srcObject = e.streams[0];
        setCallState('connected');
        addSystemMsg('✅ Video call connected!');
      }
    };

    // ICE candidate → send to peer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('ice-candidate', { to: targetSocketId, candidate: e.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        addSystemMsg('⚠️ Connection unstable. Check your network.');
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // ── Join room ─────────────────────────────────────────────────────────────
  const joinRoom = async (id: string) => {
    if (!id.trim()) return;
    setCallState('joining');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      alert('🎥 Camera/microphone access denied. Please allow access in your browser settings.');
      setCallState('idle'); return;
    }

    localStreamRef.current = stream;
    if (localVidRef.current) { localVidRef.current.srcObject = stream; }

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId: id, userName: user.name, role: user.role });
      setRoomId(id);
      setCallState('waiting');
      addSystemMsg(`📞 Joined room [${id}]. Waiting for the other party...`);
    });

    socket.on('connect_error', () => {
      addSystemMsg('❌ Cannot connect to signaling server. Is the backend running?');
      setCallState('idle');
    });

    // ── Someone already in room (WE become the initiator) ──────────────────
    socket.on('room-members', async (members: RemotePeer[]) => {
      if (members.length === 0) return; // we're alone, wait
      const peer = members[0];
      setRemotePeer(peer);
      setCallState('ringing');
      addSystemMsg(`🔔 ${peer.name} is in the room. Initiating call...`);

      const pc = createPeerConnection(stream, peer.socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { to: peer.socketId, offer: pc.localDescription });
    });

    // ── New user joined (THEY will send us an offer) ────────────────────────
    socket.on('user-joined', (peer: RemotePeer) => {
      setRemotePeer(peer);
      setCallState('ringing');
      addSystemMsg(`👋 ${peer.name} (${peer.role}) joined the room`);
    });

    // ── Receive offer → create answer ───────────────────────────────────────
    socket.on('webrtc-offer', async ({ offer, from, fromName, fromRole }) => {
      setRemotePeer({ socketId: from, name: fromName, role: fromRole });
      addSystemMsg(`📹 Incoming call from ${fromName}...`);

      const pc = createPeerConnection(stream, from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Apply any buffered ICE candidates
      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { to: from, answer: pc.localDescription });
    });

    // ── Receive answer ──────────────────────────────────────────────────────
    socket.on('webrtc-answer', async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ── ICE candidate ───────────────────────────────────────────────────────
    socket.on('ice-candidate', async ({ candidate }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    // ── Chat message ────────────────────────────────────────────────────────
    socket.on('receive-message', ({ message, sender, role, time }) => {
      setMessages(prev => [...prev, { sender, role, text: message, time, own: false }]);
    });

    // ── Peer media toggle ───────────────────────────────────────────────────
    socket.on('peer-media-toggle', ({ name, type, enabled }) => {
      if (type === 'audio') { setPeerMuted(!enabled); addSystemMsg(`🔇 ${name} ${enabled ? 'unmuted' : 'muted'} their microphone`); }
      if (type === 'video') { setPeerVidOff(!enabled); addSystemMsg(`📵 ${name} ${enabled ? 'turned on' : 'turned off'} their camera`); }
    });

    // ── Peer left ───────────────────────────────────────────────────────────
    socket.on('user-left', ({ name }) => {
      addSystemMsg(`👋 ${name} left the call`);
      setCallState('waiting');
      setRemotePeer(null);
      if (remoteVidRef.current) remoteVidRef.current.srcObject = null;
      pcRef.current?.close();
      pcRef.current = null;
    });
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    socketRef.current?.emit('media-toggle', { roomId, type: 'audio', enabled: isMuted });
    setIsMuted(m => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = isVidOff; });
    socketRef.current?.emit('media-toggle', { roomId, type: 'video', enabled: isVidOff });
    setIsVidOff(v => !v);
  };

  const endCall = () => { cleanup(); };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: Message = { sender: user.name, role: user.role, text: inputText.trim(), time, own: true };
    setMessages(prev => [...prev, msg]);
    socketRef.current.emit('send-message', { roomId, message: msg.text, sender: msg.sender, role: msg.role, time });
    setInputText('');
  };

  const addSystemMsg = (text: string) => {
    setMessages(prev => [...prev, {
      sender: 'System', role: 'system', text, own: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ── IDLE SCREEN ─────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (callState === 'idle') {
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)]">
        {/* Left: Join Screen */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-10 text-white">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-400/30">
            <Video className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-black mb-2">Video Consultation</h2>
          <p className="text-slate-400 text-sm text-center max-w-sm mb-8">
            Start or join a secure HD video call. Share the Room ID with the other party.
          </p>

          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Room ID</label>
              <div className="flex gap-2">
                <input
                  value={roomInput}
                  onChange={e => setRoomInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinRoom(roomInput)}
                  placeholder="e.g. MEDLINK"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
                />
                <button onClick={() => setRoomInput(genRoomId())}
                  className="px-3 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-slate-400" title="Generate ID">
                  <Hash className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button onClick={() => joinRoom(roomInput)} disabled={!roomInput.trim()}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-blue-500/30">
              <Video className="w-5 h-5" /> Join Consultation Room
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { icon: ShieldCheck, label: 'E2E Encrypted' },
              { icon: Wifi,        label: 'HD Quality'    },
              { icon: MessageSquare, label: 'Live Chat'   },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white/10 rounded-xl"><f.icon className="w-5 h-5 text-blue-400" /></div>
                <span className="text-xs text-slate-400 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat (available before call) */}
        <ChatPanel
          messages={messages} inputText={inputText} setInputText={setInputText}
          onSend={sendMessage} user={user} disabled={true}
          hint="Chat becomes available once you join a room."
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── ACTIVE CALL SCREEN ───────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-160px)]">
      {/* Left: Video Area */}
      <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl min-h-[400px]">

        {/* Remote Video */}
        <video ref={remoteVidRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover" />

        {/* Placeholder when no remote video */}
        {(callState !== 'connected' || peerVidOff) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
            {callState === 'waiting' && (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-blue-400 font-medium">Waiting for other party...</p>
                <p className="text-slate-500 text-sm mt-1">Share Room ID: <span className="text-white font-mono font-bold">{roomId}</span></p>
              </div>
            )}
            {callState === 'ringing' && (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-green-400 font-medium">Connecting to {remotePeer?.name}...</p>
              </div>
            )}
            {callState === 'connected' && peerVidOff && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-3xl font-bold mb-3">
                  {remotePeer?.name?.[0] || '?'}
                </div>
                <p className="text-slate-300 font-semibold">{remotePeer?.name}</p>
                <p className="text-slate-500 text-sm">Camera is off</p>
              </div>
            )}
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-40 h-28 bg-slate-800 rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 group z-10">
          <video ref={localVidRef} autoPlay muted playsInline
            className={`w-full h-full object-cover ${isVidOff ? 'hidden' : 'block'}`} />
          {isVidOff && (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
              <VideoOff className="w-7 h-7" />
            </div>
          )}
          <span className="absolute bottom-1 left-2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition">You</span>
        </div>

        {/* Room ID badge + peer status */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <button onClick={copyRoomId}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white text-xs font-mono hover:bg-black/60 transition">
            {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {roomId}
          </button>
          {callState === 'connected' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-mono">{formatTime(callDuration)}</span>
            </div>
          )}
          {remotePeer && peerMuted && (
            <div className="px-2 py-1 bg-black/40 rounded-full">
              <MicOff className="w-3 h-3 text-red-400" />
            </div>
          )}
        </div>

        {/* Remote user name tag */}
        {remotePeer && callState === 'connected' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-medium">
            <Users className="inline w-3 h-3 mr-1" />{remotePeer.name}
          </div>
        )}

        {/* Controls bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 z-10">
          <ControlBtn onClick={toggleMute} active={isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </ControlBtn>
          <ControlBtn onClick={toggleVideo} active={isVidOff} title={isVidOff ? 'Start Video' : 'Stop Video'}>
            {isVidOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </ControlBtn>
          <button onClick={endCall}
            className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-900/30">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right: Chat Panel */}
      <ChatPanel
        messages={messages} inputText={inputText} setInputText={setInputText}
        onSend={sendMessage} user={user} disabled={false}
        messagesEndRef={messagesEndRef}
        remotePeer={remotePeer}
        callState={callState}
      />
    </div>
  );
};

// ── Reusable Control Button ────────────────────────────────────────────────────
const ControlBtn: React.FC<{ onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }> = ({
  onClick, active, title, children,
}) => (
  <button onClick={onClick} title={title}
    className={`p-4 rounded-2xl transition-all ${active ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
    {children}
  </button>
);

// ── Chat Panel Component ───────────────────────────────────────────────────────
const ChatPanel: React.FC<{
  messages:       Message[];
  inputText:      string;
  setInputText:   (s: string) => void;
  onSend:         (e: React.FormEvent) => void;
  user:           User;
  disabled:       boolean;
  hint?:          string;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  remotePeer?:    RemotePeer | null;
  callState?:     CallState;
}> = ({ messages, inputText, setInputText, onSend, user, disabled, hint, messagesEndRef, remotePeer, callState }) => (
  <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
    {/* Header */}
    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-xl"><MessageSquare className="w-4 h-4 text-blue-600" /></div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 text-sm">Consultation Chat</h3>
        {remotePeer && callState === 'connected' ? (
          <p className="text-[10px] text-green-500 font-semibold">● Connected with {remotePeer.name}</p>
        ) : (
          <p className="text-[10px] text-slate-400">{callState === 'waiting' ? 'Waiting...' : 'Not in a call'}</p>
        )}
      </div>
      <ShieldCheck className="w-4 h-4 text-slate-300" title="Encrypted" />
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
      {messages.map((m, i) => {
        if (m.role === 'system') {
          return (
            <div key={i} className="text-center text-[10px] text-slate-400 py-1">
              {m.text}
            </div>
          );
        }
        return (
          <div key={i} className={`flex flex-col ${m.own ? 'items-end' : 'items-start'}`}>
            {!m.own && <p className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">{m.sender}</p>}
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.own ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
            }`}>
              {m.text}
            </div>
            {m.time && <span className="text-[9px] text-slate-300 mt-1 px-1">{m.time}</span>}
          </div>
        );
      })}
      {messagesEndRef && <div ref={messagesEndRef} />}
    </div>

    {/* Input */}
    <div className="p-3 border-t border-slate-100 bg-white">
      {disabled ? (
        <p className="text-[11px] text-slate-400 text-center py-2">{hint}</p>
      ) : (
        <form onSubmit={onSend} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-1.5 text-sm bg-transparent outline-none"
          />
          <button type="submit" disabled={!inputText.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  </div>
);

export default Telemedicine;
