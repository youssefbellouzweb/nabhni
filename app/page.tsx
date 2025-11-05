"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const success = searchParams.get('report_success');
    if (success === 'true') {
      setShowSuccess(true);
      // Remove the success parameter from URL
      const timer = setTimeout(() => {
        router.replace('/', { scroll: false });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      {showSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center">
          <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          تم إرسال البلاغ بنجاح!
        </div>
      )}
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">بلاغ المواطن</h1>
      <button
        onClick={() => router.push("/report")}
        className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
      >
        إرسال بلاغ جديد
      </button>
    </main>
  );
}
