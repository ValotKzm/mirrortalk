"use client";
import { useEffect, useRef } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

interface DeepgramTranscriptionProps {
  audioStream: MediaStream | null;
  isEnabled: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onStatusChange?: (status: string) => void;
}

export default function DeepgramTranscription({
  audioStream,
  isEnabled,
  onTranscript,
  onStatusChange,
}: DeepgramTranscriptionProps) {
  const connectionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    if (!isEnabled || !audioStream) {
      stop();
      return;
    }

    if (!connectionRef.current) {
      start(audioStream);
    }

    return () => stop();
  }, [isEnabled]);

  const start = async (stream: MediaStream) => {
    try {
      onStatusChange?.("Connexion à Deepgram...");

      // 🔑 Token
      const res = await fetch("/api/deepgram-token");
      const { apiKey } = await res.json();
      if (!apiKey) throw new Error("Clé Deepgram manquante");

      // 🎧 SDK client
      const deepgram = createClient(apiKey);

      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "fr",
        smart_format: true,
        encoding: "linear16",
        sample_rate: 16000,
      });

      connectionRef.current = connection;

      // 📡 Events
      connection.on(LiveTranscriptionEvents.Open, () => {
        onStatusChange?.("✅ Deepgram actif");
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alt = data?.channel?.alternatives?.[0];
        if (alt?.transcript) {
          onTranscript?.(alt.transcript, data.is_final);
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram error", err);
        stop();
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        stop();
      });

      // 🎚️ AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      await audioContext.resume();

      // 🧠 Load worklet
      await audioContext.audioWorklet.addModule("/audio-processor.js");

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "pcm-processor");

      worklet.port.onmessage = (event) => {
        if (connection.getReadyState() === 1) {
          connection.send(event.data.buffer);
        }
      };

      source.connect(worklet); // ⚠️ pas de destination
      workletRef.current = worklet;

      onStatusChange?.("🎤 Capture audio démarrée");
    } catch (err) {
      console.error(err);
      stop();
    }
  };

  const stop = () => {
    workletRef.current?.disconnect();
    workletRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    connectionRef.current?.finish();
    connectionRef.current = null;

    onStatusChange?.("");
  };

  return null;
}
