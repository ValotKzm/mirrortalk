"use client";
import { useEffect, useRef, useState } from 'react';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { Track } from "livekit-client";

interface DeepgramRemoteTranscriptionProps {
  remoteAudioTrack: Track | null;
  remoteSpeakerName: string;
  isEnabled: boolean;
  onTranscript?: (transcript: string, isFinal: boolean, speaker: string) => void;
  onStatusChange?: (status: string) => void;
}

export default function DeepgramRemoteTranscription({
  remoteAudioTrack,
  remoteSpeakerName,
  isEnabled,
  onTranscript,
  onStatusChange,
}: DeepgramRemoteTranscriptionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (isEnabled && remoteAudioTrack) {
      startTranscription();
    } else {
      stopTranscription();
    }

    return () => {
      stopTranscription();
    };
  }, [isEnabled, remoteAudioTrack]);

  const startTranscription = async () => {
    try {
      if (!remoteAudioTrack) {
        console.log('❌ Pas de track audio distant');
        return;
      }

      onStatusChange?.('Connexion Deepgram distant...');

      const response = await fetch('/api/deepgram-token');
      const { apiKey } = await response.json();

      if (!apiKey) {
        throw new Error('Clé API Deepgram non disponible');
      }

      const deepgram = createClient(apiKey);

      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "fr",
        smart_format: true,
        encoding: "linear16",
        sample_rate: 16000,
      });

      connectionRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('✅ Deepgram distant connecté');
        setIsConnected(true);
        onStatusChange?.('✅ Deepgram distant actif');
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        const isFinal = data.is_final;

        if (transcript && transcript.trim() !== '') {
          console.log('📝 Transcription distante:', transcript);
          onTranscript?.(transcript, isFinal, remoteSpeakerName);
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('❌ Erreur Deepgram distant:', error);
        onStatusChange?.('❌ Erreur distant');
        setIsConnected(false);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram distant déconnecté');
        setIsConnected(false);
        onStatusChange?.('');
      });

      // Capturer l'audio du track distant avec AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Créer un MediaStream depuis le track LiveKit
      const mediaStream = new MediaStream([remoteAudioTrack.mediaStreamTrack]);
      const source = audioContext.createMediaStreamSource(mediaStream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (connection.getReadyState() === 1) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          connection.send(int16Data.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('🎤 Capture audio distant démarrée');

    } catch (error) {
      console.error('Erreur démarrage transcription distante:', error);
      onStatusChange?.('Erreur: ' + (error instanceof Error ? error.message : 'Inconnue'));
      setIsConnected(false);
    }
  };

  const stopTranscription = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }

    setIsConnected(false);
    onStatusChange?.('');
  };

  return null;
}