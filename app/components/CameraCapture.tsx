"use client";
import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (image: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) return;
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("خطأ في تشغيل الكاميرا:", err);
        alert("يرجى السماح بالوصول إلى الكاميرا.");
      }
    };

    startCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // ✅ تشغيل الكاميرا مرة واحدة فقط

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");
    setPhoto(imageData);
    onCapture(imageData);
  };

  const retake = () => {
    setPhoto(null);
  };

  return (
    <div className="flex flex-col items-center gap-3 relative">
      {/* ✅ الفيديو يبقى شغال دائمًا */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`rounded-lg w-full max-w-sm border transition-all duration-300 ${
          photo ? "opacity-30" : "opacity-100"
        }`}
      />

      {/* ✅ الصورة تظهر فوق الفيديو */}
      {photo && (
        <img
          src={photo}
          alt="الصورة الملتقطة"
          className="absolute top-0 left-0 w-full max-w-sm rounded-lg border"
        />
      )}

      <div className="z-10 flex gap-3 mt-3">
        {!photo ? (
          <button
            type="button"
            onClick={takePhoto}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            📸 التقط صورة
          </button>
        ) : (
          <button
            type="button"
            onClick={retake}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow"
          >
            🔁 إعادة الالتقاط
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
