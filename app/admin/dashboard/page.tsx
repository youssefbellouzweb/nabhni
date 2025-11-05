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

// Helper function to get report type in Arabic
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
            // Ensure location is properly structured
            location: report.location && report.location.lat && report.location.lng 
              ? { lat: report.location.lat, lng: report.location.lng } 
              : null,
            // Ensure these fields have default values
            image: report.image || null,
            audio: report.audio || null
          }));
          
          // Sort by creation date (newest first)
          const sortedReports = [...parsedReports].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          setReports(sortedReports);
        } else {
          // Initialize with empty array if no reports exist
          localStorage.setItem('reports', JSON.stringify([]));
          setReports([]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        // If there's an error parsing, reset the reports
        localStorage.setItem('reports', JSON.stringify([]));
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Load reports on component mount and set up an interval to check for updates
    loadReports();
    
    // Optional: Refresh reports every 5 seconds to catch updates from other tabs
    const intervalId = setInterval(loadReports, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const updateReportStatus = (id: string, status: string) => {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-10 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-20 bg-gray-200 rounded col-span-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded col-span-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mr-4">نظام البلاغات</h1>
                <nav className="hidden md:flex space-x-4 rtl:space-x-reverse">
                  <a href="/admin/dashboard" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-blue-50">
                    الرئيسية
                  </a>
                  <a href="/admin/reports" className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                    البلاغات
                  </a>
                  <a href="#" className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                    الإحصائيات
                  </a>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                  <span className="sr-only">الإشعارات</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                
                <div className="relative">
                  <button className="flex items-center space-x-2 rtl:space-x-reverse focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {user?.username?.charAt(0).toUpperCase() || 'م'}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                      {user?.username || 'المشرف'}
                    </span>
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden">
                    <div className="py-1">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">الملف الشخصي</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">الإعدادات</a>
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-center md:text-right">
                  <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                    مرحباً بك، {user?.username || 'المشرف'} 👋
                  </h2>
                  <p className="mt-2 text-blue-100 max-w-2xl">
                    هنا يمكنك إدارة البلاغات ومتابعتها وعرض الإحصائيات المهمة.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="inline-flex rounded-md shadow">
                    <a href="/report" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50">
                      إنشاء بلاغ جديد
                      <svg className="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Reports */}
            <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">إجمالي البلاغات</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    عرض الكل
                  </a>
                </div>
              </div>
            </div>

            {/* New Reports */}
            <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">بلاغات جديدة</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.new}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    معالجة
                  </a>
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">قيد المعالجة</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.in_progress}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    متابعة
                  </a>
                </div>
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">تم الحل</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.resolved}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    عرض التفاصيل
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Types Section */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8 border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">توزيع البلاغات حسب النوع</h3>
                  <p className="mt-1 text-sm text-gray-500">نظرة عامة على أنواع المشاكل المبلغة</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <select className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>آخر 7 أيام</option>
                    <option>آخر 30 يومًا</option>
                    <option>هذا الشهر</option>
                    <option>هذا العام</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {Object.entries(stats.types).map(([type, count]) => {
                  const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0;
                  const colors = [
                    { bg: 'bg-blue-50', text: 'text-blue-700', progress: 'bg-blue-600' },
                    { bg: 'bg-green-50', text: 'text-green-700', progress: 'bg-green-500' },
                    { bg: 'bg-yellow-50', text: 'text-yellow-700', progress: 'bg-yellow-500' },
                    { bg: 'bg-purple-50', text: 'text-purple-700', progress: 'bg-purple-500' },
                    { bg: 'bg-pink-50', text: 'text-pink-700', progress: 'bg-pink-500' },
                    { bg: 'bg-indigo-50', text: 'text-indigo-700', progress: 'bg-indigo-500' },
                    { bg: 'bg-red-50', text: 'text-red-700', progress: 'bg-red-500' },
                    { bg: 'bg-cyan-50', text: 'text-cyan-700', progress: 'bg-cyan-500' },
                  ];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  
                  return (
                    <div key={type} className={`${color.bg} p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold ${color.text}`}>
                          {getReportTypeInArabic(type) || 'غير محدد'}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800 shadow-sm">
                          {count} {count === 1 ? 'بلاغ' : 'بلاغ'}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>النسبة المئوية</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${color.progress}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {Math.round(percentage)}% من الإجمالي
                        </span>
                        <button className="text-xs font-medium text-blue-600 hover:text-blue-800">
                          عرض التفاصيل
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(stats.types).length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
                    <p className="mt-1 text-sm text-gray-500">لم يتم تسجيل أي بلاغات بعد.</p>
                    <div className="mt-6">
                      <a
                        href="/report"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        إنشاء بلاغ جديد
                      </a>
                    </div>
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
