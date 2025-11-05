"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CameraCapture from "./CameraCapture";
import AudioRecorder from "./AudioRecorder";

type Location = {
  lat: number;
  lng: number;
} | null;

interface Report {
  id: string;
  image: string | null;
  audio: string | null;
  type: string;
  location: Location;
  created_at: string;
  status?: 'new' | 'in_progress' | 'resolved';
}

export default function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [type, setType] = useState<string>("");
  const [location, setLocation] = useState<Location>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Check for success message from home page
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.replace('/report', { scroll: false });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Load reports from localStorage on component mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedReports = localStorage.getItem("reports");
        if (storedReports) {
          const parsedReports = JSON.parse(storedReports);
          if (Array.isArray(parsedReports)) {
            setReports(parsedReports);
          }
        }
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('حدث خطأ في تحميل البلاغات السابقة');
    }
  }, []);

  const getLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setLocationError('متصفحك لا يدعم خدمة تحديد الموقع');
        reject(new Error(errorMsg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          };
          setLocation(loc);
          setLocationError("");
          resolve(loc);
        },
        (error) => {
          let errorMessage = 'تعذر الحصول على الموقع';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض طلب الوصول إلى الموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'معلومات الموقع غير متوفرة حالياً';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة طلب الموقع';
              break;
            default:
              errorMessage = 'حدث خطأ غير معروف أثناء محاولة تحديد الموقع';
          }
          
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 
        }
      );
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    console.log('Form submission started');
    setError("");
    
    // Validate form - Only image is required now
    if (!image) {
      const errorMsg = "يرجى التقاط صورة للبلاغ";
      console.error(errorMsg);
      setError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    console.log('Form validation passed, getting location...');

    try {
      // Get user location
      console.log('Requesting user location...');
      const userLocation = await getLocation();
      console.log('Got user location:', userLocation);

      const newReport: Report = {
        id: Date.now().toString(),
        image,
        audio,
        type,
        location: userLocation,
        created_at: new Date().toISOString(),
        status: 'new' as const
      };

      console.log('New report created:', newReport);

      // Get existing reports from localStorage
      const storedReports = localStorage.getItem('reports');
      console.log('Stored reports from localStorage:', storedReports);
      
      try {
        const existingReports = storedReports ? JSON.parse(storedReports) : [];
        console.log('Parsed existing reports:', existingReports);
        
        // Add new report to the beginning of the array (most recent first)
        const updatedReports = [newReport, ...existingReports];
        console.log('Updated reports:', updatedReports);
        
        // Save back to localStorage
        localStorage.setItem('reports', JSON.stringify(updatedReports));
        console.log('Successfully saved to localStorage');
        
        // Update state
        setReports(updatedReports);
        
        // Show success message
        setShowSuccess(true);
        console.log('Success message shown, preparing to redirect...');
        
        // Reset form
        setImage(null);
        setAudio(null);
        setType("");
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          console.log('Redirecting to home page...');
          router.push('/?report_success=true');
        }, 1000);
        
      } catch (parseError) {
        console.error('Error parsing existing reports:', parseError);
        // If there's an error parsing, try to recover by starting fresh
        localStorage.setItem('reports', JSON.stringify([newReport]));
        setReports([newReport]);
        setShowSuccess(true);
        
        setTimeout(() => {
          router.push('/?report_success=true');
        }, 1000);
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال البلاغ';
      console.error('Error in form submission:', errorMsg, err);
      setError(errorMsg);
      
      // If location access was denied, show a more specific error
      if (err instanceof Error && err.message.includes('denied')) {
        setError('يجب السماح بالوصول إلى الموقع لتتمكن من إرسال البلاغ');
      }
    } finally {
      setIsSubmitting(false);
      console.log('Form submission finished');
    }
    };

    return (
        <div className="space-y-6">
            {/* Error and Success Messages */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
                    <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}
            
            {showSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center">
                    <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    تم إرسال البلاغ بنجاح!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Capture Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        صورة البلاغ
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex justify-center">
                        <CameraCapture 
                          key={image || 'camera'} // Force re-render when image is reset
                          onCapture={setImage} 
                        />
                    </div>
                    {image && (
                        <div className="mt-2 text-sm text-green-600 flex items-center">
                            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            تم تحميل الصورة بنجاح
                        </div>
                    )}
                </div>

                {/* Audio Recording Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        تسجيل صوتي (اختياري)
                    </label>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <AudioRecorder onAudioRecorded={setAudio} />
                    </div>
                </div>

                {/* Report Type - Optional */}
                <div className="space-y-2">
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                        نوع المشكلة (اختياري)
                    </label>
                    <select
                        id="reportType"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">-- اختياري --</option>
                        <option value="نظافة">نظافة</option>
                        <option value="إنارة">إنارة</option>
                        <option value="طرق">طرق</option>
                        <option value="ماء">ماء</option>
                        <option value="أخرى">أخرى</option>
                    </select>
                </div>

                {/* Location Information */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="block text-sm font-medium text-gray-700">
                            الموقع
                        </span>
                        {location ? (
                            <span className="text-xs text-green-600 flex items-center">
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                تم تحديد الموقع
                            </span>
                        ) : (
                            <span className="text-xs text-gray-500">سيتم تحديد موقعك الحالي تلقائيًا</span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        سيتم تحديد موقعك الحالي تلقائيًا عند إرسال البلاغ. يرجى التأكد من تفعيل خدمة تحديد الموقع.
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || !image}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isSubmitting || !image ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                جاري الإرسال...
                            </>
                        ) : (
                            'إرسال البلاغ'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
