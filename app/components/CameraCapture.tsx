"use client";
import { useRef, useState, useEffect } from "react";

export default function CameraCapture({
  onCapture,
}: {
  onCapture: (imageData: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  // تشغيل الكاميرا عند التحميل
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // الكاميرا الخلفية
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreaming(true);
        }
      } catch (err) {
        alert("تعذر تشغيل الكاميرا: " + err);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // التقاط الصورة
  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/png");
    setPhoto(data);
    onCapture(data);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {!photo && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg border"
          ></video>
          <button
            onClick={takePhoto}
            disabled={!streaming}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            📸 التقط صورة
          </button>
        </>
      )}
      {photo && (
        <>
          <img src={photo} alt="Captured" className="rounded-lg" />
          <button
            onClick={() => setPhoto(null)}
            className="bg-gray-300 px-3 py-1 rounded"
          >
            🔄 إعادة الالتقاط
          </button>
        </>
      )}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
