"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  AudioLines,
  Captions,
  DoorOpen,
  Mic,
  MicOff,
  Users,
  Video,
  VideoOff,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { Room, RoomEvent, Track } from "livekit-client";
import DeepgramTranscription from "./components/DeepgramTranscription";
import DeepgramRemoteTranscription from "./components/DeepgramRemoteTranscription";
import TranscriptionPanel from "./components/TranscriptionPanel";
import { useSessionUserName } from "./components/AuthSessionProvider";

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
  const accountName = useSessionUserName();
  const [roomName, setRoomName] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const userName = accountName ?? guestName;
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
      window.scrollTo(0, 0);
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
      <main className="studio-page entry-page">
        <div className="page-frame">
          <header className="brand-header">
            <Link className="brand-lockup" href="/" aria-label="MirrorTalk, accueil">
              <span className="brand-symbol"><Video size={20} strokeWidth={2.2} /></span>
              <span className="brand-name">MirrorTalk</span>
            </Link>
          </header>

          <section className="entry-layout" aria-labelledby="entry-title">
            <div className="entry-copy">
              <h1 id="entry-title">Préparez votre prochain entretien.</h1>
              <p>
                Entraînez-vous à deux en direct, puis retrouvez votre échange dans une
                transcription.
              </p>
              <div className="entry-features" aria-label="Fonctionnalités de la session">
                <span><Video size={17} /> Vidéo en direct</span>
                <span><Users size={17} /> Jusqu&apos;à deux participants</span>
                <span><Captions size={17} /> Transcription</span>
              </div>
            </div>

            <form
              className="join-panel"
              onSubmit={(event) => {
                event.preventDefault();
                handleJoin();
              }}
            >
              <div className="join-panel-heading">
                <div>
                  <h2>Rejoindre une session</h2>
                  <p>
                    {accountName
                      ? "Votre nom de compte sera affiché dans la salle."
                      : "Choisissez un nom temporaire pour rejoindre sans compte."}
                  </p>
                </div>
              </div>

              {error && <div className="notice notice-error" role="alert">{error}</div>}

              <div className="join-fields">
                <div className="field-group">
                  <label htmlFor="room-name">Nom de la salle</label>
                  <div className="input-wrap">
                    <DoorOpen size={18} aria-hidden="true" />
                    <input
                      id="room-name"
                      type="text"
                      value={roomName}
                      onChange={(event) => setRoomName(event.target.value)}
                      placeholder="ex. entretien-dev"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="participant-name">
                    {accountName ? "Nom de votre compte" : "Nom temporaire"}
                  </label>
                  <div className="input-wrap">
                    <Users size={18} aria-hidden="true" />
                    <input
                      id="participant-name"
                      type="text"
                      value={userName}
                      onChange={(event) => setGuestName(event.target.value)}
                      placeholder={accountName ? undefined : "ex. Marie Dupont"}
                      autoComplete={accountName ? "name" : "nickname"}
                      readOnly={Boolean(accountName)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!roomName.trim() || !userName.trim()}
                className="primary-action"
              >
                <span>Entrer dans la salle</span>
                <ArrowRight size={19} />
              </button>

              <div className="join-note">
                <Users size={17} aria-hidden="true" />
                <p>
                  {accountName
                    ? "Votre nom de compte apparaîtra dans la salle. Partagez le nom de la salle avec votre accompagnant."
                    : "Ce nom temporaire ne crée pas de compte. Partagez le nom de la salle avec votre accompagnant."}
                </p>
              </div>
            </form>
          </section>

          <footer className="entry-footer">
            <span>Une salle commune, un échange en direct.</span>
            <span>MirrorTalk</span>
          </footer>
        </div>
      </main>
    );
  }

  return (
    <div className="studio-page session-page">
      {/* Transcription LOCAL */}
      <DeepgramTranscription
        audioStream={localStreamRef.current}
        isEnabled={isTranscriptionEnabled && isAudioEnabled}
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

      <div className="page-frame">
        <header className="session-header">
          <div className="session-identity">
            <Link className="brand-lockup" href="/" aria-label="MirrorTalk, accueil">
              <span className="brand-symbol"><Video size={20} strokeWidth={2.2} /></span>
              <span className="brand-name">MirrorTalk</span>
            </Link>
            <div className="session-room">
              <span>Salle</span>
              <strong>{roomName}</strong>
              <span className="room-divider" aria-hidden="true" />
              <span>{userName}</span>
            </div>
          </div>

          <div className="session-actions">
            {!isLivekitConnected && (
              <button
                onClick={connectToLivekit}
                disabled={isConnecting}
                className="session-action session-action-primary"
              >
                <Wifi size={17} />
                {isConnecting ? "Connexion…" : "Démarrer la vidéo"}
              </button>
            )}

            {isLivekitConnected && !isTranscriptionEnabled && (
              <button
                onClick={() => setIsTranscriptionEnabled(true)}
                className="session-action session-action-primary"
              >
                <AudioLines size={17} />
                Démarrer la transcription
              </button>
            )}

            {isLivekitConnected && isTranscriptionEnabled && (
              <button
                onClick={() => setIsTranscriptionEnabled(false)}
                className="session-action session-action-secondary"
              >
                <Captions size={17} />
                Arrêter la transcription
              </button>
            )}

            <button onClick={handleLeave} className="session-action session-action-leave">
              Quitter la salle
            </button>
          </div>
        </header>

        <div className="session-status" aria-live="polite">
          <span className={`status-indicator ${isLivekitConnected ? "is-connected" : ""}`}>
            <span className="status-dot" aria-hidden="true" />
            {isLivekitConnected ? "Connecté" : "Hors connexion"}
          </span>
          {isTranscriptionEnabled && (
            <span className="status-indicator status-transcribing">
              <AudioLines size={15} /> Transcription en cours
            </span>
          )}
          {localDeepgramStatus && <span className="service-status">Micro : {localDeepgramStatus}</span>}
          {remoteDeepgramStatus && <span className="service-status">Binôme : {remoteDeepgramStatus}</span>}
        </div>

        {error && <div className="notice notice-error session-notice" role="alert">{error}</div>}

        <main className="workspace">
          <section className="video-section" aria-labelledby="session-title">
            <div className="section-heading">
              <div>
                <h1 id="session-title">Session en direct</h1>
                <p>Votre échange vidéo avec votre binôme.</p>
              </div>
              <span className="participant-count"><Users size={16} /> Deux places</span>
            </div>

            <div className="video-grid">
              <figure className="participant-tile participant-self">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  aria-label={`Votre vidéo, ${userName}`}
                  className="participant-video"
                />
                <figcaption className="participant-caption">
                  <span>{userName}</span><span className="participant-role">Vous</span>
                </figcaption>
                {!isVideoEnabled && (
                  <div className="video-placeholder video-disabled">
                    <VideoOff size={28} />
                    <p>Caméra désactivée</p>
                  </div>
                )}
                {!localStreamRef.current && isVideoEnabled && (
                  <div className="video-placeholder video-unavailable">
                    <span className="placeholder-icon"><Video size={22} /></span>
                    <p>Votre image apparaîtra ici</p>
                    <span>Autorisez la caméra dans le navigateur pour démarrer la vidéo.</span>
                  </div>
                )}
              </figure>

              <figure className="participant-tile participant-remote">
                {remoteParticipant ? (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      aria-label={`Vidéo de ${remoteParticipant.name}`}
                      className="participant-video"
                    />
                    <figcaption className="participant-caption">
                      <span>{remoteParticipant.name}</span><span className="participant-role">Binôme</span>
                    </figcaption>
                    {remoteAudioTrack && isTranscriptionEnabled && (
                      <span className="participant-live"><AudioLines size={14} /> Audio reçu</span>
                    )}
                  </>
                ) : (
                  <div className="video-placeholder" aria-live="polite">
                    <span className="placeholder-icon"><Users size={24} /></span>
                    <p>{isLivekitConnected ? "En attente de votre binôme" : "Connectez-vous pour lancer la session"}</p>
                    <span>Le flux vidéo apparaîtra ici</span>
                  </div>
                )}
              </figure>
            </div>

            <div className="media-controls" role="group" aria-label="Contrôles audio et vidéo">
              <button
                onClick={toggleAudio}
                disabled={!isLivekitConnected}
                aria-label={isAudioEnabled ? "Couper le microphone" : "Activer le microphone"}
                title={isLivekitConnected ? (isAudioEnabled ? "Couper le microphone" : "Activer le microphone") : "Connectez-vous pour contrôler le microphone"}
                className={`media-control ${isAudioEnabled ? "" : "is-disabled"}`}
              >
                <span className="control-icon">{isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}</span>
                <span className="control-copy"><span>Microphone</span><strong>{isLivekitConnected ? (isAudioEnabled ? "Activé" : "Coupé") : "En attente"}</strong></span>
              </button>
              <button
                onClick={toggleVideo}
                disabled={!isLivekitConnected}
                aria-label={isVideoEnabled ? "Désactiver la caméra" : "Activer la caméra"}
                title={isLivekitConnected ? (isVideoEnabled ? "Désactiver la caméra" : "Activer la caméra") : "Connectez-vous pour contrôler la caméra"}
                className={`media-control ${isVideoEnabled ? "" : "is-disabled"}`}
              >
                <span className="control-icon">{isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}</span>
                <span className="control-copy"><span>Caméra</span><strong>{isLivekitConnected ? (isVideoEnabled ? "Activée" : "Coupée") : "En attente"}</strong></span>
              </button>
            </div>
          </section>

          <TranscriptionPanel
            transcripts={transcripts}
            currentUserName={userName}
            onExport={exportTranscript}
            isTranscribing={isTranscriptionEnabled}
          />
        </main>

        {isTranscriptionEnabled && !remoteAudioTrack && remoteParticipant && (
          <div className="notice notice-pending" role="status">
            <AudioLines size={18} />
            <div>
              <strong>En attente de l&apos;audio du participant distant</strong>
              <p>Son microphone doit être activé pour transcrire sa voix.</p>
            </div>
          </div>
        )}

        {isTranscriptionEnabled && remoteAudioTrack && (
          <div className="notice notice-success" role="status">
            <AudioLines size={18} />
            <div>
              <strong>Transcription des deux participants active</strong>
              <p>Votre voix et celle de votre binôme sont transcrites en direct.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}