'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
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

const getReportTypeInArabic = (type: string) => {
  const types: { [key: string]: string } = {
    'نظافة': 'نظافة',
    'إنارة': 'إنارة',
    'طرق': 'طرق',
    'ماء': 'ماء',
    'أخرى': 'أخرى'
  };
  return types[type] || type;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
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
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
      {statusText[status as keyof typeof statusText] || status}
    </span>
  );
};

function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const { logout, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadReports = () => {
      try {
        const storedReports = localStorage.getItem('reports');
        if (storedReports) {
          const parsedReports = JSON.parse(storedReports).map((report: Report) => ({
            ...report,
            // Ensure all required fields have default values
            id: report.id || Date.now().toString(),
            type: report.type || 'أخرى',
            created_at: report.created_at || new Date().toISOString(),
            status: report.status || 'new',
            location: report.location && report.location.lat && report.location.lng 
              ? { lat: report.location.lat, lng: report.location.lng } 
              : null,
            image: report.image || null,
            audio: report.audio || null
          }));
          
          const sortedReports = [...parsedReports].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          setReports(sortedReports);
        } else {
          localStorage.setItem('reports', JSON.stringify([]));
          setReports([]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        localStorage.setItem('reports', JSON.stringify([]));
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
    
    const intervalId = setInterval(loadReports, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const updateReportStatus = (id: string, status: 'new' | 'in_progress' | 'resolved') => {
    const updatedReports = reports.map(report => 
      report.id === id ? { ...report, status } : report
    );
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
      const updatedReports = reports.filter(report => report.id !== id);
      setReports(updatedReports);
      localStorage.setItem('reports', JSON.stringify(updatedReports));
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // Filter reports based on active tab
  const filteredReports = activeTab === 'all' 
    ? reports 
    : reports.filter(report => report.status === activeTab);

  // Calculate statistics
  const stats = {
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    types: reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="text-sm text-gray-600">
                <p className="font-medium">{user?.username || 'المشرف'}</p>
                <p className="text-xs text-gray-500">مسؤول النظام</p>
              </div>
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Problem Types Section */}
          <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">توزيع البلاغات حسب النوع</h3>
              <p className="mt-1 text-sm text-gray-500">نظرة عامة على أنواع المشاكل المبلغة</p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(stats.types).map(([type, count]) => (
                  <div key={type} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {getReportTypeInArabic(type) || 'غير محدد'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {count} {count === 1 ? 'بلاغ' : 'بلاغ'}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / reports.length) * 100}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 text-left">
                      {reports.length > 0 ? Math.round((count / reports.length) * 100) : 0}% من إجمالي البلاغات
                    </div>
                  </div>
                ))}
                {Object.keys(stats.types).length === 0 && (
                  <div className="col-span-full py-4 text-center text-gray-500">
                    لا توجد بيانات متاحة
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Reports */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="mr-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">إجمالي البلاغات</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* New Reports */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mr-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">بلاغات جديدة</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.new}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="mr-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">قيد المعالجة</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.in_progress}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mr-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">تم حلها</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.resolved}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h2 className="text-xl font-semibold text-gray-900">إدارة البلاغات</h2>
                <p className="mt-2 text-sm text-gray-700">
                  قم بإدارة البلاغات المقدمة من المستخدمين وتحديث حالاتها
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:mr-16">
                <div className="flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('new')}
                    className={`px-4 py-2 text-sm font-medium border-t border-b border-gray-300 ${activeTab === 'new' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    جديد
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('in_progress')}
                    className={`px-4 py-2 text-sm font-medium border-t border-b border-gray-300 ${activeTab === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    قيد المعالجة
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('resolved')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${activeTab === 'resolved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}
                  >
                    تم الحل
                  </button>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="mt-8 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    {filteredReports.length === 0 ? (
                      <div className="bg-white px-4 py-12 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بلاغات</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {activeTab === 'all' 
                            ? 'لم يتم تقديم أي بلاغات حتى الآن.'
                            : `لا توجد بلاغات ${getStatusText(activeTab)} في الوقت الحالي.`}
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pr-3 pl-4 text-right text-sm font-semibold text-gray-900 sm:pl-6">
                              رقم البلاغ
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              النوع
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              التاريخ
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              الحالة
                            </th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">إجراءات</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredReports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap py-4 pr-3 pl-4 text-sm font-medium text-gray-900 sm:pl-6">
                                #{report.id.slice(-6)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {getReportTypeInArabic(report.type)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatDate(report.created_at)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <StatusBadge status={report.status || 'new'} />
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                                  <button
                                    onClick={() => {
                                      // View report details
                                      router.push(`/admin/reports/${report.id}`);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  
                                  {report.status !== 'resolved' && (
                                    <button
                                      onClick={() => updateReportStatus(report.id, 'resolved')}
                                      className="text-green-600 hover:text-green-900"
                                      title="تم الحل"
                                    >
                                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                  )}
                                  
                                  {report.status !== 'in_progress' && report.status !== 'resolved' && (
                                    <button
                                      onClick={() => updateReportStatus(report.id, 'in_progress')}
                                      className="text-yellow-600 hover:text-yellow-900"
                                      title="قيد المعالجة"
                                    >
                                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDelete(report.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="حذف"
                                  >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Helper function to get status text in Arabic
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'all': 'متاحة',
    'new': 'جديدة',
    'in_progress': 'قيد المعالجة',
    'resolved': 'تم حلها'
  };
  return statusMap[status] || status;
};

export default AdminDashboard;
