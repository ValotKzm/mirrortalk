"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff, Wifi } from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';

// Types
interface Participant {
  name: string;
  identity: string;
}

export default function InterviewApp() {
  const [roomName, setRoomName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isLivekitConnected, setIsLivekitConnected] = useState<boolean>(false);
  const [remoteParticipant, setRemoteParticipant] = useState<Participant | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef<any>(null);

  // Démarrer la caméra et le micro
  const startLocalMedia = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Impossible d\'accéder à la caméra/micro: ' + errorMessage);
    }
  };

  const stopLocalMedia = (): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Connexion à LiveKit - PRODUCTION avec Next.js API
  const connectToLivekit = async (): Promise<void> => {
    try {
      setError('');
      setIsConnecting(true);

      // Étape 1: Obtenir le token depuis notre API Next.js
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomName,
          participantName: userName,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du token');
      }

      const { token, url } = await response.json();

      // Étape 2: Connexion à LiveKit
      // IMPORTANT: Installez d'abord: npm install livekit-client
      // Puis décommentez le code ci-dessous:

      // /*
      
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      
      roomRef.current = room;

      // Écouter les événements de participants
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('✅ Participant connecté:', participant.identity);
        setRemoteParticipant({
          name: participant.identity,
          identity: participant.identity
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('❌ Participant déconnecté:', participant.identity);
        setRemoteParticipant(null);
      });

      // Écouter les nouvelles pistes vidéo/audio
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('📹 Nouvelle piste:', track.kind, 'de', participant.identity);
        
        if (track.kind === Track.Kind.Video) {
          const videoElement = remoteVideoRef.current;
          if (videoElement) {
            track.attach(videoElement);
          }
        }
        
        if (track.kind === Track.Kind.Audio) {
          track.attach();
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      // Connexion
      await room.connect(url, token);
      console.log('🎉 Connecté à la room:', roomName);
      
      // Publier notre audio/vidéo
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        
        await room.localParticipant.publishTrack(audioTrack);
        await room.localParticipant.publishTrack(videoTrack);
        console.log('📤 Audio/Vidéo publiés');
      }
      
      setIsLivekitConnected(true);
      

      // ⚠️ CODE TEMPORAIRE - À SUPPRIMER
      console.log('Token reçu:', token);
      console.log('URL:', url);
      setError('✅ Token obtenu ! Installez livekit-client et décommentez le code (voir console)');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur: ' + errorMessage);
      setIsLivekitConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromLivekit = (): void => {
    if (roomRef.current) {
      // roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    setIsLivekitConnected(false);
    setRemoteParticipant(null);
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isConnected) {
      startLocalMedia();
    }
    return () => {
      stopLocalMedia();
      disconnectFromLivekit();
    };
  }, [isConnected]);

  const toggleAudio = (): void => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = (): void => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleJoin = (): void => {
    if (roomName.trim() && userName.trim()) {
      setIsConnected(true);
    }
  };

  const handleLeave = (): void => {
    stopLocalMedia();
    disconnectFromLivekit();
    setIsConnected(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Simulateur d'Entretien
            </h1>
            <p className="text-gray-600 mt-2">Next.js + LiveKit</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la salle
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ex: entretien-dev"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="ex: Marie Dupont"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!roomName.trim() || !userName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              Rejoindre l'entretien
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              📋 Setup Next.js:
            </p>
            <ol className="text-xs text-blue-700 space-y-1">
              <li>1. Créez `.env.local` avec vos clés LiveKit</li>
              <li>2. Créez `app/api/livekit-token/route.ts`</li>
              <li>3. Installez: `npm install livekit-client livekit-server-sdk`</li>
              <li>4. Décommentez le code LiveKit</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {userName}
              </h2>
              <p className="text-sm text-gray-600">
                Salle : <span className="font-mono text-blue-600">{roomName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isLivekitConnected && (
                <button
                  onClick={connectToLivekit}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <Wifi size={16} />
                  {isConnecting ? 'Connexion...' : 'Connecter LiveKit'}
                </button>
              )}
              
              {isLivekitConnected && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Wifi size={16} />
                  <span>Connecté</span>
                </div>
              )}
              
              <button
                onClick={handleLeave}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              Vous ({userName})
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <VideoOff size={48} className="mx-auto mb-2" />
                  <p className="text-sm">Caméra désactivée</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
            {remoteParticipant ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                  {remoteParticipant.name}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="animate-pulse">
                    <Video size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {isLivekitConnected 
                        ? 'En attente de l\'autre participant...' 
                        : 'Cliquez sur "Connecter LiveKit"'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleAudio}
              className={'p-4 rounded-full transition ' + (isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}
            >
              {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
              onClick={toggleVideo}
              className={'p-4 rounded-full transition ' + (isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {isAudioEnabled ? '🎤 Micro activé' : '🔇 Micro coupé'} • 
            {isVideoEnabled ? ' 📹 Caméra activée' : ' 📷 Caméra désactivée'}
          </div>
        </div>
      </div>
    </div>
  );
}