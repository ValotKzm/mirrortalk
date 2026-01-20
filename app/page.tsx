"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff } from 'lucide-react';

export default function InterviewApp() {
  const [roomName, setRoomName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream>(null);

  // Démarrer la caméra et le micro
  const startLocalMedia = async () => {
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
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError('Impossible d\'accéder à la caméra/micro: ' + errorMessage);
    }
  };

  // Arrêter la caméra et le micro
  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Démarrer le média quand on se connecte
  useEffect(() => {
    if (isConnected) {
      startLocalMedia();
    }
    return () => {
      stopLocalMedia();
    };
  }, [isConnected]);

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle vidéo
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleJoin = () => {
    if (roomName.trim() && userName.trim()) {
      setIsConnected(true);
    }
  };

  const handleLeave = () => {
    stopLocalMedia();
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
            <p className="text-gray-600 mt-2">Étape 2 : Caméra et micro</p>
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Étape 2/5 :</strong> Caméra et micro ✓
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Prochaine étape : Connexion LiveKit (2 participants)
            </p>
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
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
            >
              Quitter
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Zone vidéo - 2 participants côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Vidéo locale (vous) */}
          <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              Vous
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

          {/* Vidéo distante (autre participant) */}
          <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Video size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">En attente de l'autre participant...</p>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              Participant distant
            </div>
          </div>
        </div>

        {/* Contrôles audio/vidéo */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isAudioEnabled ? 'Couper le micro' : 'Activer le micro'}
            >
              {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isVideoEnabled ? 'Désactiver la caméra' : 'Activer la caméra'}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {isAudioEnabled ? '🎤 Micro activé' : '🔇 Micro coupé'} • 
            {isVideoEnabled ? ' 📹 Caméra activée' : ' 📷 Caméra désactivée'}
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ <strong>Étape 2 complétée :</strong> Votre caméra et micro fonctionnent !
          </p>
          <p className="text-xs text-green-600 mt-1">
            Prochaine étape : Connexion LiveKit pour connecter 2 participants
          </p>
        </div>
      </div>
    </div>
  );
}