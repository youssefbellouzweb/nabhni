"use client";
import { useState, useRef } from "react";

export default function AudioRecorder({ onAudioRecorded }: { onAudioRecorded: (audio: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      const reader = new FileReader();
      reader.onloadend = () => onAudioRecorded(reader.result as string);
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium">🎤 تسجيل صوتي (اختياري)</label>
      <div className="flex gap-2">
        {!recording ? (
          <button onClick={startRecording} className="bg-gray-200 px-3 py-1 rounded">ابدأ</button>
        ) : (
          <button onClick={stopRecording} className="bg-red-500 text-white px-3 py-1 rounded">إيقاف</button>
        )}
      </div>
      {audioURL && <audio controls src={audioURL} className="mt-2" />}
    </div>
  );
}
