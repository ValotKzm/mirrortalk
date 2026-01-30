"use client";
import React, { useState, useRef, useEffect } from "react";
import { Video, Mic, MicOff, VideoOff, Wifi, Download } from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";
import DeepgramTranscription from "./components/DeepgramTranscription";

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
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] =
    useState<boolean>(false);
  const [remoteParticipant, setRemoteParticipant] =
    useState<Participant | null>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Track[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [deepgramStatus, setDeepgramStatus] = useState<string>("");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas des transcriptions
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Callback pour recevoir les transcriptions (audio LOCAL)
  const handleTranscript = (transcript: string, isFinal: boolean) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("fr-FR");

    const newEntry: TranscriptEntry = {
      timestamp,
      speaker: userName, // C'est vous qui parlez
      text: transcript,
      isFinal,
    };

    setTranscripts((prev) => {
      // Si c'est une transcription provisoire, remplacer la dernière entrée du même speaker
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
      // Sinon ajouter une nouvelle entrée
      return [...prev, newEntry];
    });
  };

  // Callback pour le statut Deepgram
  const handleDeepgramStatus = (status: string) => {
    setDeepgramStatus(status);
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

  // Attacher les tracks vidéo quand le ref est prêt
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

  // Démarrer la caméra et le micro
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

  // Connexion à LiveKit
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
        setRemoteParticipant({
          name: participant.identity,
          identity: participant.identity,
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteParticipant(null);
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          track.attach();
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
        } catch (e) {
          console.error("Error subscribing to publication", e);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
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

  // Obtenir la couleur selon le speaker
  const getSpeakerColor = (speaker: string) => {
    return speaker === userName
      ? { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" }
      : {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
        };
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
            <p className="text-gray-600 mt-2">Transcription temps réel</p>
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
                className="w-full px-4 py-3 border border-gray-300 placeholder-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 border border-gray-300 placeholder-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      {/* Composant Deepgram invisible */}
      <DeepgramTranscription
        audioStream={localStreamRef.current}
        isEnabled={isTranscriptionEnabled}
        onTranscript={handleTranscript}
        onStatusChange={handleDeepgramStatus}
      />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {userName}
              </h2>
              <p className="text-sm text-gray-600">
                Salle :{" "}
                <span className="font-mono text-blue-600">{roomName}</span>
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
                  {isConnecting ? "Connexion..." : "Connecter LiveKit"}
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
                  ⏸️ Arrêter transcription
                </button>
              )}

              {transcripts.filter((t) => t.isFinal).length > 0 && (
                <button
                  onClick={exportTranscript}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                  title="Exporter la transcription"
                >
                  <Download size={16} />
                  Exporter
                </button>
              )}

              {isLivekitConnected && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Wifi size={16} />
                  <span>LiveKit ✓</span>
                </div>
              )}

              {deepgramStatus && (
                <div className="text-purple-600 text-sm font-medium">
                  {deepgramStatus}
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
          {/* Vidéos */}
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

            {/* Contrôles */}
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
                  {isVideoEnabled ? (
                    <Video size={24} />
                  ) : (
                    <VideoOff size={24} />
                  )}
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                {isAudioEnabled ? "🎤 Micro activé" : "🔇 Micro coupé"} •
                {isVideoEnabled
                  ? " 📹 Caméra activée"
                  : " 📷 Caméra désactivée"}
              </div>
            </div>
          </div>

          {/* Transcription */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📝 Transcription
              </h3>
              <span className="text-xs text-gray-500">
                {transcripts.filter((t) => t.isFinal).length} phrases
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96 space-y-3">
              {transcripts.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {isTranscriptionEnabled
                    ? "En attente de parole..."
                    : "Démarrez la transcription"}
                </div>
              ) : (
                transcripts.map((entry, index) => {
                  const colors = getSpeakerColor(entry.speaker);
                  return (
                    <div
                      key={index}
                      className={`${colors.bg} ${colors.border} border rounded-lg p-3 ${
                        !entry.isFinal ? "opacity-60 italic" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-semibold ${colors.text}`}
                        >
                          {entry.speaker}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.text}</p>
                    </div>
                  );
                })
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
