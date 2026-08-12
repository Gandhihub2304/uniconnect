'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Phone, Mic, MicOff, Video, VideoOff, Monitor, Captions, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { onSocket, offSocket, getSocket } from '@/lib/socket';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export const WebRTCCallModal: React.FC = () => {
  const {
    isCallModalOpen, activeCallUser, activeCallUserId, callType, callRole, endCall,
    incomingCall, setIncomingCall, acceptIncomingCall, user,
  } = useAppStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const describeMediaError = (err: any): string => {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Camera/microphone permission was denied. Allow access in your device Settings to make calls.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'No camera or microphone was found on this device.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'Camera or microphone is already in use by another app.';
    }
    return 'Could not access camera/microphone. Please check your permissions and try again.';
  };

  const cleanupCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    setIsRemoteConnected(false);
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const createPeerConnection = (targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        getSocket()?.emit('ice_candidate', { to: targetUserId, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setIsRemoteConnected(true);
    };
    pcRef.current = pc;
    return pc;
  };

  // Global listeners for incoming call signaling — always active once socket connects
  useEffect(() => {
    const onIncoming = (data: { signal: any; from: string; name: string; callType?: 'voice' | 'video' }) => {
      const busy = useAppStore.getState().isCallModalOpen;
      if (busy) {
        getSocket()?.emit('end_call', { to: data.from });
        return;
      }
      setIncomingCall({ fromId: data.from, fromName: data.name, offer: data.signal, callType: data.callType || 'video' });
    };

    const onAccepted = async (answer: any) => {
      if (pcRef.current && answer) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Failed to set remote description:', err);
        }
      }
    };

    const onIce = async (data: { candidate: any }) => {
      if (pcRef.current && data.candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      }
    };

    const onCallEnded = () => {
      cleanupCall();
      endCall();
    };

    onSocket('call_incoming', onIncoming);
    onSocket('call_accepted', onAccepted);
    onSocket('ice_candidate', onIce);
    onSocket('call_ended', onCallEnded);

    return () => {
      offSocket('call_incoming', onIncoming);
      offSocket('call_accepted', onAccepted);
      offSocket('ice_candidate', onIce);
      offSocket('call_ended', onCallEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Caller flow: place the outgoing call once the modal opens
  useEffect(() => {
    if (!isCallModalOpen || callRole !== 'caller' || !activeCallUserId || !user) return;

    let cancelled = false;
    setMediaError(null);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
        if (cancelled) return;
        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection(activeCallUserId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        getSocket()?.emit('call_user', {
          userToCall: activeCallUserId,
          signalData: offer,
          from: user._id,
          name: user.name,
          callType,
        });
      } catch (err) {
        console.warn('Could not start call (camera/mic unavailable):', err);
        if (!cancelled) setMediaError(describeMediaError(err));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCallModalOpen, callRole]);

  // Call duration timer
  useEffect(() => {
    let interval: any;
    if (isCallModalOpen) {
      setCallDuration(0);
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isCallModalOpen]);

  const handleAcceptIncoming = async () => {
    if (!incomingCall || !user) return;
    const { fromId, offer } = incomingCall;

    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.callType === 'video', audio: true });
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;

      const pc = createPeerConnection(fromId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      acceptIncomingCall();
      getSocket()?.emit('answer_call', { to: fromId, signal: answer });

      setTimeout(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }, 0);
    } catch (err) {
      console.warn('Could not accept call (camera/mic unavailable):', err);
      setMediaError(describeMediaError(err));
      setIncomingCall(null);
    }
  };

  const handleDeclineIncoming = () => {
    if (incomingCall) getSocket()?.emit('end_call', { to: incomingCall.fromId });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (activeCallUserId) getSocket()?.emit('end_call', { to: activeCallUserId });
    cleanupCall();
    endCall();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = isMuted; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = isVideoOff; });
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc?.getSenders().find((s) => s.track?.kind === 'video');
        await sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        screenTrack.onended = async () => {
          if (cameraTrackRef.current) await sender?.replaceTrack(cameraTrackRef.current);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn('Screen share cancelled', err);
      }
    } else {
      const sender = pc?.getSenders().find((s) => s.track?.kind === 'video');
      if (cameraTrackRef.current) await sender?.replaceTrack(cameraTrackRef.current);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Standalone permission-error banner (call never got far enough to open the full modal)
  if (!isCallModalOpen && !incomingCall && mediaError) {
    return (
      <div className="fixed top-6 right-6 z-50 w-80 bg-slate-900 border border-rose-800/60 rounded-2xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-top-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-600/20 flex items-center justify-center text-rose-400 shrink-0">
            <VideoOff className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-300">{mediaError}</p>
        </div>
        <button onClick={() => setMediaError(null)} className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">
          Dismiss
        </button>
      </div>
    );
  }

  // Incoming call ringing banner (shown even if the full call UI isn't open yet)
  if (!isCallModalOpen && incomingCall) {
    return (
      <div className="fixed top-6 right-6 z-50 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-top-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 animate-pulse">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{incomingCall.fromName}</h4>
            <p className="text-xs text-slate-400">Incoming {incomingCall.callType} call...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDeclineIncoming} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
            Decline
          </button>
          <button onClick={handleAcceptIncoming} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
            Accept
          </button>
        </div>
      </div>
    );
  }

  if (!isCallModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[620px] relative">
        {/* Video Canvas Container */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote Peer Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isRemoteConnected ? 'block' : 'hidden'}`}
          />

          {!isRemoteConnected && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in">
              <div className="w-28 h-28 rounded-full border-4 border-blue-500 shadow-xl bg-slate-800 flex items-center justify-center text-3xl font-black text-white animate-pulse">
                {(activeCallUser || '?').charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-white">{activeCallUser || 'Calling...'}</h3>
              <p className="text-sm font-semibold text-blue-400">
                {callRole === 'caller' ? 'Ringing...' : 'Connecting...'}
              </p>
            </div>
          )}

          {/* Local Self Video Picture-in-Picture */}
          <div className="absolute top-4 right-4 w-40 h-28 bg-slate-900 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-xl z-20">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-md">You (Local)</span>
          </div>

          {/* Call Header Status Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 z-20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <h4 className="text-xs font-bold text-white">{activeCallUser || 'Unknown'}</h4>
              <p className="text-[10px] text-slate-400 font-mono">{formatTime(callDuration)} • WebRTC {isRemoteConnected ? 'Connected' : 'Connecting'}</p>
            </div>
          </div>

          {showCaptions && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2 rounded-2xl text-center z-20">
              <p className="text-xs text-white font-medium">Live captions are a visual preview feature in this build.</p>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 flex-wrap z-20">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition-all ${isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition-all ${isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title="Screen Share Desktop"
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-3.5 rounded-2xl transition-all ${showCaptions ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title="Live Captions"
          >
            <Captions className="w-5 h-5" />
          </button>

          <button
            onClick={handleEndCall}
            className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
