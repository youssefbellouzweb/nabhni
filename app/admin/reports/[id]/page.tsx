'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Report {
  id: string;
  image: string | null;
  audio: string | null;
  type: string;
  location: { lat: number; lng: number } | null;
  created_at: string;
  status?: 'new' | 'in_progress' | 'resolved';
}

export default function ReportDetails() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
      return;
    }

    const loadReport = () => {
      try {
        const storedReports = localStorage.getItem('reports');
        if (storedReports) {
          const reports = JSON.parse(storedReports);
          const foundReport = reports.find((r: Report) => r.id === params.id);
          
          if (foundReport) {
            setReport(foundReport);
          } else {
            setError('البلاغ غير موجود');
          }
        } else {
          setError('لا توجد بلاغات مسجلة');
        }
      } catch (error) {
        console.error('Error loading report:', error);
        setError('حدث خطأ أثناء تحميل البلاغ');
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [params.id, router, user]);

  const updateStatus = (newStatus: 'new' | 'in_progress' | 'resolved') => {
    if (!report) return;
    
    try {
      const storedReports = localStorage.getItem('reports');
      if (storedReports) {
        const reports = JSON.parse(storedReports);
        const updatedReports = reports.map((r: Report) => 
          r.id === report.id ? { ...r, status: newStatus } : r
        );
        
        localStorage.setItem('reports', JSON.stringify(updatedReports));
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      setError('حدث خطأ أثناء تحديث حالة البلاغ');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
    };
    
    const statusText = {
      new: 'جديد',
      in_progress: 'قيد المعالجة',
      resolved: 'تم الحل'
    };

    return (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ</h1>
          <p className="text-gray-700 mb-6">{error || 'حدث خطأ غير متوقع'}</p>
          <Link 
            href="/admin/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">تفاصيل البلاغ #{report.id}</h1>
          <Link 
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            العودة
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {report.image && (
            <div className="bg-gray-100 p-4 flex justify-center">
              <img 
                src={report.image} 
                alt="صورة البلاغ" 
                className="max-h-96 object-contain rounded"
              />
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">معلومات البلاغ</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">رقم البلاغ:</dt>
                    <dd className="font-medium">{report.id}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">نوع المشكلة:</dt>
                    <dd className="font-medium">{report.type}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">تاريخ الإنشاء:</dt>
                    <dd className="font-medium">
                      {new Date(report.created_at).toLocaleString('ar-EG')}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <dt className="text-gray-500">الحالة:</dt>
                    <dd>{getStatusBadge(report.status || 'new')}</dd>
                  </div>
                </dl>
              </div>

              {report.location && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">الموقع</h2>
                  <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${report.location.lat},${report.location.lng}&z=15&output=embed`}
                      className="border-0"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    خط الطول: {report.location.lng.toFixed(6)}, خط العرض: {report.location.lat.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {report.audio && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">التسجيل الصوتي</h2>
                <audio controls className="w-full mt-2">
                  <source src={report.audio} type="audio/mpeg" />
                  متصفحك لا يدعم تشغيل الملفات الصوتية.
                </audio>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">تحديث حالة البلاغ</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateStatus('new')}
                  className={`px-4 py-2 rounded ${
                    report.status === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  وضع كجديد
                </button>
                <button
                  onClick={() => updateStatus('in_progress')}
                  className={`px-4 py-2 rounded ${
                    report.status === 'in_progress'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  قيد المعالجة
                </button>
                <button
                  onClick={() => updateStatus('resolved')}
                  className={`px-4 py-2 rounded ${
                    report.status === 'resolved'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  تم الحل
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
