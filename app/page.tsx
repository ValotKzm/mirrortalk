"use client";
import React, { useState, useRef, useEffect } from "react";
import { Video, Mic, MicOff, VideoOff, Wifi } from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";
import DeepgramTranscription from "./components/DeepgramTranscription";
import DeepgramRemoteTranscription from "./components/DeepgramRemoteTranscription";
import TranscriptionPanel from "./components/TranscriptionPanel";

// Types
interface Participant {
  name: string;
  identity: string;
}

interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
  isFinal: boolean;
}

export default function InterviewApp() {
  const [roomName, setRoomName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isLivekitConnected, setIsLivekitConnected] = useState<boolean>(false);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState<boolean>(false);
  const [remoteParticipant, setRemoteParticipant] = useState<Participant | null>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Track[]>([]);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<Track | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [localDeepgramStatus, setLocalDeepgramStatus] = useState<string>("");
  const [remoteDeepgramStatus, setRemoteDeepgramStatus] = useState<string>("");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef<Room | null>(null);

  // Callback pour recevoir les transcriptions LOCALES
  const handleLocalTranscript = (transcript: string, isFinal: boolean) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("fr-FR");

    const newEntry: TranscriptEntry = {
      timestamp,
      speaker: userName,
      text: transcript,
      isFinal,
    };

    setTranscripts((prev) => {
      if (!isFinal) {
        const lastIndex = prev.length - 1;
        if (
          lastIndex >= 0 &&
          !prev[lastIndex].isFinal &&
          prev[lastIndex].speaker === userName
        ) {
          const updated = [...prev];
          updated[lastIndex] = newEntry;
          return updated;
        }
      }
      return [...prev, newEntry];
    });
  };

  // Callback pour recevoir les transcriptions DISTANTES
  const handleRemoteTranscript = (transcript: string, isFinal: boolean, speaker: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("fr-FR");

    const newEntry: TranscriptEntry = {
      timestamp,
      speaker,
      text: transcript,
      isFinal,
    };

    setTranscripts((prev) => {
      if (!isFinal) {
        const lastIndex = prev.length - 1;
        if (
          lastIndex >= 0 &&
          !prev[lastIndex].isFinal &&
          prev[lastIndex].speaker === speaker
        ) {
          const updated = [...prev];
          updated[lastIndex] = newEntry;
          return updated;
        }
      }
      return [...prev, newEntry];
    });
  };

  // Fonction pour exporter la transcription
  const exportTranscript = () => {
    const finalTranscripts = transcripts.filter((t) => t.isFinal);
    const text = finalTranscripts
      .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entretien-${roomName}-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Attacher les tracks vidéo
  useEffect(() => {
    if (remoteVideoRef.current && remoteVideoTracks.length > 0) {
      remoteVideoTracks.forEach((track) => {
        if (
          track.kind === Track.Kind.Video &&
          !(track as any).attachedElements?.includes(remoteVideoRef.current)
        ) {
          track.attach(remoteVideoRef.current as HTMLVideoElement);
          remoteVideoRef.current
            ?.play()
            .catch((err) => console.error("Play failed", err));
        }
      });
    }
  }, [remoteVideoTracks]);

  const startLocalMedia = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError("Impossible d'accéder à la caméra/micro: " + errorMessage);
    }
  };

  const stopLocalMedia = (): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const connectToLivekit = async (): Promise<void> => {
    try {
      setError("");
      setIsConnecting(true);

      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: roomName,
          participantName: userName,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du token");
      }

      const { token, url } = await response.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant connecté:', participant.identity);
        setRemoteParticipant({
          name: participant.identity,
          identity: participant.identity,
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('👤 Participant déconnecté:', participant.identity);
        setRemoteParticipant(null);
        setRemoteAudioTrack(null);
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('📡 Track souscrit:', track.kind, 'de', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          console.log('🎤 Track audio distant reçu !');
          setRemoteAudioTrack(track);
          track.attach(); // Jouer l'audio pour l'entendre
        } else if (track.kind === Track.Kind.Video) {
          setRemoteVideoTracks((prev) => [...prev, track]);
        }
      });

      room.on(RoomEvent.TrackPublished, async (publication, participant) => {
        try {
          if (!publication.isSubscribed) {
            await publication.setSubscribed(true);
          }
          if (
            publication.track &&
            publication.track.kind === Track.Kind.Video
          ) {
            setRemoteVideoTracks((prev) => [
              ...prev,
              publication.track as Track,
            ]);
          }
          if (
            publication.track &&
            publication.track.kind === Track.Kind.Audio
          ) {
            console.log('🎤 Track audio distant via TrackPublished');
            setRemoteAudioTrack(publication.track);
          }
        } catch (e) {
          console.error("Error subscribing to publication", e);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
        if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(null);
        }
      });

      await room.connect(url, token);

      if (room.remoteParticipants.size > 0) {
        const first = room.remoteParticipants.values().next().value;
        if (first) {
          setRemoteParticipant({
            name: first.identity,
            identity: first.identity,
          });
        }
      }

      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach(async (publication: any) => {
          try {
            if (!publication.isSubscribed) {
              await publication.setSubscribed(true);
            }
            if (
              publication.track &&
              publication.track.kind === Track.Kind.Video
            ) {
              setRemoteVideoTracks((prev) => [
                ...prev,
                publication.track as Track,
              ]);
            }
            if (
              publication.track &&
              publication.track.kind === Track.Kind.Audio
            ) {
              console.log('🎤 Track audio existant trouvé');
              setRemoteAudioTrack(publication.track);
              publication.track.attach();
            }
          } catch (e) {
            console.error("Error processing existing publication", e);
          }
        });
      });

      if (localStreamRef.current) {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
      }

      setIsLivekitConnected(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError("Erreur: " + errorMessage);
      setIsLivekitConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromLivekit = (): void => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    setIsLivekitConnected(false);
    setIsTranscriptionEnabled(false);
    setRemoteParticipant(null);
    setRemoteVideoTracks([]);
    setRemoteAudioTrack(null);

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

  const toggleAudio = async () => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;

    const enabled = !isAudioEnabled;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    setIsAudioEnabled(enabled);
  };

  const toggleVideo = async () => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;

    const enabled = !isVideoEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    setIsVideoEnabled(enabled);
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
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Simulateur d'Entretien
            </h1>
            <p className="text-gray-600 mt-2">Transcription 2 participants</p>
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
              📋 Connectez vous et échangez.
            </p>
            <ol className="text-xs text-blue-700 space-y-1">
              <li>1. Partager le nom de room avec votre binôme</li>
              <li>2. Rejoignez la room</li>
              <li>
                3. Connectez vous à grâce au bouton "se connecter à Livekit"
              </li>
              <li>4. Bon entrainement !</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-6">
      {/* Transcription LOCAL */}
      <DeepgramTranscription
        audioStream={localStreamRef.current}
        isEnabled={isTranscriptionEnabled}
        onTranscript={handleLocalTranscript}
        onStatusChange={setLocalDeepgramStatus}
      />

      {/* Transcription DISTANT */}
      <DeepgramRemoteTranscription
        remoteAudioTrack={remoteAudioTrack}
        remoteSpeakerName={remoteParticipant?.name || "Participant distant"}
        isEnabled={isTranscriptionEnabled && !!remoteAudioTrack}
        onTranscript={handleRemoteTranscript}
        onStatusChange={setRemoteDeepgramStatus}
      />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {userName}
              </h2>
              <p className="text-sm text-gray-600">
                Salle : <span className="font-mono text-blue-600">{roomName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {!isLivekitConnected && (
                <button
                  onClick={connectToLivekit}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <Wifi size={16} />
                  {isConnecting ? "Connexion..." : "Connecter"}
                </button>
              )}

              {isLivekitConnected && !isTranscriptionEnabled && (
                <button
                  onClick={() => setIsTranscriptionEnabled(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium"
                >
                  🎤 Démarrer transcription
                </button>
              )}

              {isLivekitConnected && isTranscriptionEnabled && (
                <button
                  onClick={() => setIsTranscriptionEnabled(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium"
                >
                  ⏸️ Arrêter
                </button>
              )}

              {isLivekitConnected && (
                <div className="text-green-600 text-sm font-medium flex items-center gap-2">
                  <Wifi size={16} />
                  LiveKit ✓
                </div>
              )}

              {localDeepgramStatus && (
                <div className="text-blue-600 text-xs">
                  Local: {localDeepgramStatus}
                </div>
              )}

              {remoteDeepgramStatus && (
                <div className="text-green-600 text-xs">
                  Distant: {remoteDeepgramStatus}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                    {remoteAudioTrack && isTranscriptionEnabled && (
                      <div className="absolute top-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                        🎤 Transcription active
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="animate-pulse">
                        <Video size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {isLivekitConnected
                            ? "En attente..."
                            : "Connectez LiveKit"}
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
                  className={
                    "p-4 rounded-full transition " +
                    (isAudioEnabled
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white")
                  }
                >
                  {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={
                    "p-4 rounded-full transition " +
                    (isVideoEnabled
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white")
                  }
                >
                  {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                {isAudioEnabled ? "🎤 Micro activé" : "🔇 Micro coupé"} •
                {isVideoEnabled ? " 📹 Caméra activée" : " 📷 Caméra désactivée"}
              </div>
            </div>
          </div>

          <TranscriptionPanel
            transcripts={transcripts}
            currentUserName={userName}
            onExport={exportTranscript}
            isTranscribing={isTranscriptionEnabled}
          />
        </div>

        {isTranscriptionEnabled && !remoteAudioTrack && remoteParticipant && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ En attente de l'audio du participant distant...
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Le participant distant doit activer son microphone pour que sa transcription fonctionne.
            </p>
          </div>
        )}

        {isTranscriptionEnabled && remoteAudioTrack && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✅ Transcription des 2 participants active !
            </p>
            <p className="text-xs text-green-700 mt-1">
              Votre audio (bleu) + Audio distant (vert) sont transcrits en temps réel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}