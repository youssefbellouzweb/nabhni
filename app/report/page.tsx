"use client";
import ReportForm from "../components/ReportForm";

export default function ReportPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-center mb-4 text-blue-700">إرسال بلاغ جديد</h2>
        <ReportForm />
      </div>
    </main>
  );
}
