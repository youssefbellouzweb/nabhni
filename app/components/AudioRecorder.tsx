"use client";
import { useState, useRef } from "react";

export default function AudioRecorder({ onAudioRecorded }: { onAudioRecorded: (audio: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioURL(url);

          const reader = new FileReader();
          reader.onloadend = () => {
            onAudioRecorded(reader.result as string);
            setIsProcessing(false);
          };
          reader.onerror = () => {
            setError("حدث خطأ أثناء معالجة التسجيل");
            setIsProcessing(false);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Error processing audio:", err);
          setError("حدث خطأ أثناء معالجة التسجيل");
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    onAudioRecorded("");
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
          <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`flex items-center justify-center h-12 w-12 rounded-full ${recording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-600 hover:bg-blue-700'} 
            text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          aria-label={recording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
        >
          {recording ? (
            <div className="h-5 w-5 bg-white rounded-sm"></div>
          ) : isProcessing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          {recording ? (
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-ping mr-2"></div>
              <span className="text-sm font-medium text-gray-700">جاري التسجيل...</span>
            </div>
          ) : audioURL ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>تم التسجيل بنجاح</span>
              </div>
              <button
                type="button"
                onClick={deleteRecording}
                className="text-red-500 hover:text-red-700 text-sm flex items-center"
              >
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>حذف</span>
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              اضغط على الزر لتسجيل رسالة صوتية (اختياري)
            </div>
          )}
        </div>
      </div>

      {audioURL && (
        <div className="mt-3">
          <audio 
            controls 
            src={audioURL} 
            className="w-full h-10"
            controlsList="nodownload"
          />
        </div>
      )}
    </div>
  );
}
