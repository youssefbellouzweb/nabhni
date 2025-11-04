"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-blue-700">بلاغ المواطن</h1>
      <button
        onClick={() => router.push("/report")}
        className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
      >
        إرسال بلاغ جديد
      </button>
    </main>
  );
}
