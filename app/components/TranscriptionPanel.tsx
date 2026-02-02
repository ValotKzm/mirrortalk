"use client";
import { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

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

  const getSpeakerColor = (speaker: string) => {
    return speaker === currentUserName
      ? { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" }
      : { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📝 Transcription
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {transcripts.filter((t) => t.isFinal).length} phrases
          </span>
          {transcripts.filter((t) => t.isFinal).length > 0 && (
            <button
              onClick={onExport}
              className="text-indigo-600 hover:text-indigo-700 transition"
              title="Exporter"
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-96 space-y-3">
        {transcripts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {isTranscribing
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
                  <span className={`text-sm font-semibold ${colors.text}`}>
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
  );
}