"use client";
import ReportForm from "@/components/ReportForm";

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">نظام البلاغات</h1>
            <p className="text-blue-100 mt-1">نشكرك على مساهمتك في تحسين الخدمات</p>
          </div>
          
          {/* Form Section */}
          <div className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-gray-800">إرسال بلاغ جديد</h2>
              <p className="text-gray-600 mt-1">الرجاء ملء النموذج التالي لإرسال بلاغك</p>
            </div>
            <ReportForm />
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {new Date().getFullYear()} نظام البلاغات. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
