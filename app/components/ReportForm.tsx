"use client";
import { useState } from "react";
import CameraCapture from "./CameraCapture";
import AudioRecorder from "./AudioRecorder";

export default function ReportForm() {
    const [image, setImage] = useState<string | null>(null);
    const [audio, setAudio] = useState<string | null>(null);
    const [type, setType] = useState<string>("");
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => alert("تعذر الحصول على الموقع، يرجى السماح بالوصول.")
        );
    };

    const handleSubmit = () => {
        if (!image) return alert("يرجى اختيار صورة على الأقل");
        getLocation();

        const report = {
            id: Date.now().toString(),
            image,
            audio,
            type,
            location,
            created_at: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem("reports") || "[]");
        existing.push(report);
        localStorage.setItem("reports", JSON.stringify(existing));

        alert("✅ تم إرسال البلاغ بنجاح!");
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            className="flex flex-col gap-4"
        >
            {/* <CameraCapture onCapture={setImage} /> */}
            <CameraCapture onCapture={setImage} />
            <AudioRecorder onAudioRecorded={setAudio} />
            <select
                className="border rounded-lg p-2"
                value={type}
                onChange={(e) => setType(e.target.value)}
            >
                <option value="">نوع المشكلة (اختياري)</option>
                <option value="نظافة">نظافة</option>
                <option value="إنارة">إنارة</option>
                <option value="طرق">طرق</option>
                <option value="ماء">ماء</option>
                <option value="أخرى">أخرى</option>
            </select>
            <button
                type="submit"
                className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
                إرسال البلاغ
            </button>
        </form>
    );
}
