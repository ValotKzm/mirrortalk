"use client";
import { useRef, useEffect } from 'react';
import { AudioLines, Download } from 'lucide-react';

interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
  isFinal: boolean;
}

interface TranscriptionPanelProps {
  transcripts: TranscriptEntry[];
  currentUserName: string;
  onExport: () => void;
  isTranscribing: boolean;
}

export default function TranscriptionPanel({
  transcripts,
  currentUserName,
  onExport,
  isTranscribing,
}: TranscriptionPanelProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  const finalTranscriptCount = transcripts.filter((entry) => entry.isFinal).length;

  return (
    <section className="transcription-panel" aria-labelledby="transcription-title">
      <div className="transcription-heading">
        <div className="transcription-title-group">
          <h2 id="transcription-title">Transcription</h2>
          <p>Les échanges apparaissent en direct.</p>
        </div>
        <div className="transcription-tools">
          <span className="phrase-count" aria-live="polite">
            {finalTranscriptCount} {finalTranscriptCount > 1 ? "phrases" : "phrase"}
          </span>
          {finalTranscriptCount > 0 && (
            <button
              onClick={onExport}
              className="icon-action"
              title="Télécharger la transcription"
              aria-label="Télécharger la transcription"
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="transcription-scroll">
        {transcripts.length === 0 ? (
          <div className="empty-transcript" role="status">
            <AudioLines size={25} />
            <p>{isTranscribing ? "En attente de parole" : "La transcription s'affichera ici"}</p>
            <span>{isTranscribing ? "Parlez naturellement pour commencer." : "Lancez la transcription quand la session est prête."}</span>
          </div>
        ) : (
          <div className="transcript-list">
            {transcripts.map((entry, index) => (
              <div
                key={index}
                className={`transcript-line ${entry.speaker === currentUserName ? "is-local" : "is-remote"} ${!entry.isFinal ? "is-interim" : ""}`}
              >
                <div className="transcript-meta">
                  <span className="transcript-speaker">{entry.speaker}</span>
                  <time className="transcript-time">{entry.timestamp}</time>
                </div>
                <p className="transcript-text">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>
    </section>
  );
}