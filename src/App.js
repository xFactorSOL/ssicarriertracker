import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Truck, DollarSign, Plus, CheckCircle, Users, Shield, Search,
  Download, Upload, MapPin, Phone, Settings, LogOut,
  ChevronDown, ChevronRight, X, Edit, Trash2, Eye,
  Building, User, Package, BarChart3, Home, Layers, ArrowUpRight,
  ArrowDownRight, RefreshCw, AlertTriangle, Bell,
  MessageSquare, History, Target, Award, Activity,
  ArrowRight, Filter,
  CreditCard, Receipt,
  FileUp, File, ClipboardCheck, Calendar, FileText,
  Clock, Play, FileText as RFQIcon
} from 'lucide-react';

// Supabase client - Uses environment variables with fallbacks for local development
// In production (Vercel), these should be set in environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://qwoabopuoihbawlwmgbf.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2Fib3B1b2loYmF3bHdtZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTg3OTYsImV4cCI6MjA4NDM3NDc5Nn0.5Xwxjoykox37Aha9-jmol1UN8vVc3epeX-0jwElTUzE';

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// SECURITY: Input Validation & Sanitization
// ============================================

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
      return entities[char];
    });
};

const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  const re = /^[\d\s()+. ]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

const validateNumber = (value, fieldName, min = 0) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  return null;
};

// Password strength validation
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push('at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('one special character');
  }
  return errors;
};

// Sanitize form data object
const sanitizeFormData = (data) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return sanitized;
};

// Toast notification system - Corporate Style
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-white border-l-4 border-l-green-500 border-gray-200',
    error: 'bg-white border-l-4 border-l-red-500 border-gray-200',
    warning: 'bg-white border-l-4 border-l-amber-500 border-gray-200',
    info: 'bg-white border-l-4 border-l-[#003366] border-gray-200'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-[#003366]'
  };

  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} px-5 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 border`}>
      {type === 'success' && <CheckCircle className={`w-5 h-5 ${iconColors[type]}`} />}
      {type === 'error' && <AlertTriangle className={`w-5 h-5 ${iconColors[type]}`} />}
      {type === 'warning' && <AlertTriangle className={`w-5 h-5 ${iconColors[type]}`} />}
      {type === 'info' && <Bell className={`w-5 h-5 ${iconColors[type]}`} />}
      <span className="font-medium text-gray-700">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Status badge component - Corporate Style
const StatusBadge = ({ status }) => {
  const styles = {
    dispatched: 'bg-gray-100 text-gray-700',
    in_transit: 'bg-blue-50 text-[#003366]',
    delivered: 'bg-green-50 text-green-700',
    late: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500'
  };

  const labels = {
    dispatched: 'Dispatched',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    late: 'Late',
    cancelled: 'Cancelled'
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${styles[status] || styles.dispatched}`}>
      {labels[status] || status}
    </span>
  );
};

// Metric card with trend - Corporate Style
const MetricCard = ({ icon: Icon, title, value, trend, trendValue, color, subtitle }) => {
  const iconColors = {
    emerald: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-[#003366]',
    violet: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-red-50 text-red-600',
    slate: 'bg-gray-100 text-gray-600',
    cyan: 'bg-blue-50 text-[#003366]'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="font-medium">{trendValue}</span>
              <span className="text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function CarrierTracker() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loads, setLoads] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isSuperAdmin = profile?.is_super_admin === true;
  const isManager = profile?.role === 'manager' || isSuperAdmin;
  const isActive = profile?.status === 'active';

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Notifications disabled to reduce API load
  // const fetchNotifications = useCallback(async () => {
  //   if (!user) return;
  //   const { data, error } = await supabase
  //     .from('notifications')
  //     .select('*')
  //     .eq('user_id', user.id)
  //     .order('created_at', { ascending: false })
  //     .limit(20);
  //   
  //   if (!error && data) {
  //     setNotifications(data);
  //   }
  // }, [user]);

  const markNotificationRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Notifications disabled to reduce API calls
        // fetchNotifications();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Notifications disabled to reduce API calls
        // fetchNotifications();
      } else {
        setProfile(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile && isActive) {
      // Stagger API calls with longer delays to prevent ERR_INSUFFICIENT_RESOURCES
      const t1 = setTimeout(() => fetchLoads(), 100);
      const t2 = setTimeout(() => fetchCarriers(), 1000);
      const t3 = setTimeout(() => fetchCustomers(), 2000);
      const t4 = setTimeout(() => fetchFacilities(), 3000);
      const t5 = setTimeout(() => fetchRFQs(), 4000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }
  }, [user, profile, isActive]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only if user is logged in and not typing in an input
      if (!user || !profile) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      
      // Navigation shortcuts (with modifier key)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('dashboard');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('loads');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('carriers');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('customers');
            break;
          case 'k':
            e.preventDefault();
            // Global search - focus search input
            const searchInput = document.querySelector('input[type="text"]');
            if (searchInput) searchInput.focus();
            break;
          default:
            break;
        }
      }
      
      // Quick actions (without modifier - single keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key) {
          case '?':
            e.preventDefault();
            showToast('Shortcuts: ⌘1-4 Navigate • ⌘K Search • R Refresh', 'info');
            break;
          case 'r':
            e.preventDefault();
            fetchLoads();
            showToast('Data refreshed', 'info');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, profile, setActiveTab, showToast]);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    } else if (error?.code === 'PGRST116') {
      // Profile doesn't exist - sign out the stale auth session
      console.warn('Profile not found for user, signing out');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const fetchLoads = async () => {
    const { data } = await supabase
      .from('loads')
      .select('*, profiles:created_by(full_name, email)')
      .order('created_at', { ascending: false });
    if (data) setLoads(data);
  };

  const fetchCarriers = async () => {
    const { data } = await supabase
      .from('carriers')
      .select('*')
      .order('name');
    if (data) setCarriers(data);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    if (data) setCustomers(data);
  };

  const fetchFacilities = async () => {
    const { data } = await supabase
      .from('facilities')
      .select('*')
      .order('facility_name');
    if (data) setFacilities(data);
  };

  const fetchRFQs = async () => {
    const { data } = await supabase
      .from('vw_rfq_overview')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRfqs(data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
      const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showToast(error.message, 'error');
      setLoading(false);
    } else {
      showToast('Welcome back!', 'success');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    showToast('Signed out successfully', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="bg-[#003366] p-4 rounded-lg inline-block">
              <Layers className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#003366] to-[#0066cc] bg-clip-text text-transparent">TMS</span>
              <span className="text-gray-700"> Portal</span>
              <span className="text-xs font-medium text-gray-400 ml-2">V1.0</span>
            </h1>
          </div>
          <p className="mt-2 text-gray-500 font-medium text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleAuth={handleAuth}
          loading={loading}
        />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <ProfileSetup user={user} onComplete={fetchProfile} isSuperAdmin={isSuperAdmin} showToast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (!isActive && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-amber-100 p-4 rounded-full">
              <Clock className="w-8 h-8 text-amber-600" />
          </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Review</h2>
          <p className="text-gray-600 mb-6">
            Thank you for requesting access to TMS Portal. Your account is currently pending review by an administrator.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              We will notify you via email once your access has been approved.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isManager={isManager}
        isSuperAdmin={isSuperAdmin}
        profile={profile}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 mr-2">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">?</kbd>
                <span>shortcuts</span>
          </div>
              <div className="relative">
          <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.is_read) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-xs text-[#003366] hover:underline"
                      >
                        Mark all as read
          </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationRead(n.id)}
                            className={`p-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fetchLoads()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data (R)"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
        </div>
      </header>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <Dashboard loads={loads} carriers={carriers} customers={customers} isManager={isManager} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'loads' && (
            <LoadsPage 
              loads={loads} 
              carriers={carriers}
              customers={customers}
              facilities={facilities}
              fetchFacilities={fetchFacilities}
              onRefresh={fetchLoads} 
              showToast={showToast}
              isManager={isManager}
              currentUser={user}
            />
          )}
          {activeTab === 'carriers' && (
            <CarriersPage carriers={carriers} loads={loads} onRefresh={fetchCarriers} showToast={showToast} />
          )}
          {activeTab === 'customers' && (
            <CustomersPage customers={customers} loads={loads} onRefresh={fetchCustomers} showToast={showToast} />
          )}
          {activeTab === 'facilities' && (
            <FacilitiesPage facilities={facilities} loads={loads} onRefresh={fetchFacilities} showToast={showToast} />
          )}
          {activeTab === 'rfqs' && (
            <RFQPage rfqs={rfqs} carriers={carriers} customers={customers} facilities={facilities} onRefresh={fetchRFQs} showToast={showToast} currentUser={profile} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsPage loads={loads} carriers={carriers} customers={customers} />
          )}
          {activeTab === 'users' && isSuperAdmin && (
            <UsersPage showToast={showToast} />
          )}
          {activeTab === 'settings' && (
            <SettingsPage profile={profile} showToast={showToast} />
          )}
        </div>
      </main>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}

// Login Page - TMS Portal
function LoginPage({ email, setEmail, password, setPassword, handleAuth, loading }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#003366] to-[#001a33] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-white/10 rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur p-3 rounded-lg">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                TMS <span className="font-light">Portal</span>
                <span className="text-sm font-medium text-blue-300/60 ml-2">V1.0</span>
              </h1>
              <p className="text-blue-200/60 text-xs tracking-widest uppercase mt-1">Transportation Management</p>
            </div>
          </div>
          <h2 className="text-4xl font-light text-white leading-tight mb-6">
            Streamline Your<br />
            <span className="font-semibold">Freight Operations</span>
          </h2>
          <p className="text-blue-100/70 text-lg max-w-md">
            Your all-in-one platform for loads, carriers, and logistics management.
          </p>
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-blue-200/60 text-sm">Active Clients</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-blue-200/60 text-sm">On-Time Delivery</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-blue-200/60 text-sm">Support</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="bg-[#003366] p-2.5 rounded-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#003366]">
                TMS <span className="font-light">Portal</span>
                <span className="text-xs font-medium text-gray-400 ml-1">V1.0</span>
              </h1>
            </div>
          </div>
          
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
                placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                required
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
                placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                required
            />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Need access? Contact your administrator.
          </p>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              © 2024 TMS Portal V1.0 — All rights reserved.
            </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

// Profile Setup - TMS Portal
function ProfileSetup({ user, onComplete, isSuperAdmin, showToast }) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const role = isSuperAdmin ? 'manager' : 'user';
      const status = isSuperAdmin ? 'active' : 'pending'; // Super admins auto-active, others pending
      
      // Try to update existing profile first
      const { error: updateError } = await supabase
      .from('profiles')
        .update({ 
          full_name: fullName, 
          role: role,
          status: status,
          is_super_admin: isSuperAdmin || false
        })
        .eq('id', user.id);
      
      // If profile doesn't exist, insert it
      if (updateError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            email: user.email, 
            full_name: fullName, 
            role: role,
            status: status,
            is_super_admin: isSuperAdmin || false
          }]);
        
        if (insertError) {
          throw insertError;
        }
      }
      
      showToast('Profile created successfully!', 'success');
      onComplete(user.id);
    } catch (error) {
      console.error('Profile setup error:', error);
      showToast(`Error: ${error.message}`, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#003366] p-3 rounded-lg">
            <User className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-center text-gray-900">Complete Your Profile</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Welcome to TMS Portal</p>
        {isSuperAdmin && (
          <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-2 px-4 mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Administrator Account</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
              placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              required
            />
            </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Role:</span> {isSuperAdmin ? 'Manager (Admin)' : 'Team Member'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium text-gray-700">Email:</span> {user.email}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Sign out and return to login
          </button>
        </div>
      </div>
    </div>
  );
}

// Sidebar Navigation - TMS Portal
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, isManager, isSuperAdmin, profile, onSignOut }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'loads', icon: Package, label: 'Shipments' },
    { id: 'carriers', icon: Truck, label: 'Carriers' },
    { id: 'customers', icon: Building, label: 'Clients' },
    { id: 'facilities', icon: MapPin, label: 'Facilities' },
    { id: 'rfqs', icon: RFQIcon, label: 'RFQs', managerOnly: true },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', managerOnly: true },
    { id: 'users', icon: Users, label: 'Team', superAdminOnly: true },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 z-40 flex flex-col`}>
      {/* Logo */}
      <div className="p-4 flex items-center justify-center border-b border-gray-100">
        {collapsed ? (
          <div className="bg-[#003366] p-2.5 rounded-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
        ) : (
          <h1 className="text-xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-[#003366] to-[#0066cc] bg-clip-text text-transparent">TMS</span>
            <span className="text-gray-700 font-light"> Portal</span>
            <span className="text-xs font-medium text-gray-400 ml-1">V1.0</span>
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return null;
          if (item.managerOnly && !isManager) return null;
          
          const isActive = activeTab === item.id;
  return (
          <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive 
                  ? 'bg-[#003366] text-white' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-200' : ''}`} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center text-sm font-semibold text-white">
              {profile?.full_name?.charAt(0) || 'U'}
        </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate text-gray-900">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
      </div>
    </div>
        )}
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-1.5 shadow-sm transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 rotate-90 text-gray-500" />}
      </button>
    </aside>
  );
}

// Dashboard
function Dashboard({ loads, carriers, customers, isManager, setActiveTab }) {
  const metrics = useMemo(() => calculateMetrics(loads), [loads]);
  const carrierPerformance = useMemo(() => calculateCarrierPerformance(loads), [loads]);
  
  const recentLoads = loads.slice(0, 5);
  
  const statusCounts = useMemo(() => {
    return loads.reduce((acc, load) => {
      acc[load.status] = (acc[load.status] || 0) + 1;
      return acc;
    }, {});
  }, [loads]);

  // Financial metrics
  const financialMetrics = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthLoads = loads.filter(l => {
      const d = new Date(l.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    
    const monthRevenue = monthLoads.reduce((sum, l) => sum + (parseFloat(l.rate_billed_to_customer) || 0), 0);
    const monthCost = monthLoads.reduce((sum, l) => sum + (parseFloat(l.rate_paid_to_carrier) || 0), 0);
    const monthMargin = monthRevenue - monthCost;
    const marginPercent = monthRevenue > 0 ? ((monthMargin / monthRevenue) * 100).toFixed(1) : 0;
    const avgLoadValue = monthLoads.length > 0 ? (monthRevenue / monthLoads.length).toFixed(0) : 0;
    
    return { monthRevenue, monthCost, monthMargin, marginPercent, avgLoadValue, monthLoads: monthLoads.length };
  }, [loads]);

  // Top performers
  const topCarriers = useMemo(() => {
    return carrierPerformance
      .filter(c => c.loads >= 3)
      .sort((a, b) => b.otd - a.otd)
      .slice(0, 3);
  }, [carrierPerformance]);

  const pieData = [
    { name: 'Dispatched', value: statusCounts.dispatched || 0, color: '#64748b' },
    { name: 'In Transit', value: statusCounts.in_transit || 0, color: '#003366' },
    { name: 'Delivered', value: statusCounts.delivered || 0, color: '#10b981' },
    { name: 'Late', value: statusCounts.late || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Quick action handlers
  const quickActions = [
    { label: 'New Load', icon: Plus, action: () => setActiveTab && setActiveTab('loads'), color: 'bg-[#003366]' },
    { label: 'Add Carrier', icon: Truck, action: () => setActiveTab && setActiveTab('carriers'), color: 'bg-emerald-600' },
    { label: 'View Reports', icon: BarChart3, action: () => setActiveTab && setActiveTab('analytics'), color: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Welcome back!</h2>
          <p className="text-sm text-gray-500">Here's what's happening with your shipments today.</p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className={`${action.color} text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Status Ticker */}
      {statusCounts.in_transit > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-blue-800">Live Tracking</span>
          </div>
          <span className="text-sm text-blue-600">
            {statusCounts.in_transit} load{statusCounts.in_transit !== 1 ? 's' : ''} currently in transit
          </span>
          {statusCounts.late > 0 && (
            <span className="ml-auto text-sm text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {statusCounts.late} running late
            </span>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CheckCircle}
          title="On-Time Delivery"
          value={`${metrics.otdPercentage}%`}
          trend={metrics.otdPercentage >= 90 ? 'up' : 'down'}
          trendValue={metrics.otdPercentage >= 90 ? 'Excellent' : 'Needs attention'}
          color="emerald"
          subtitle={`${metrics.deliveredOnTime} of ${metrics.totalDelivered} loads`}
        />
        <MetricCard
          icon={DollarSign}
          title="This Month Revenue"
          value={`$${financialMetrics.monthRevenue.toLocaleString()}`}
          trend="up"
          trendValue={`${financialMetrics.marginPercent}% margin`}
          color="blue"
          subtitle={`${financialMetrics.monthLoads} loads this month`}
        />
        <MetricCard
          icon={Target}
          title="Avg Load Value"
          value={`$${financialMetrics.avgLoadValue}`}
          color="violet"
          subtitle="Revenue per shipment"
        />
        <MetricCard
          icon={Activity}
          title="Active Loads"
          value={metrics.activeLoads}
          color="amber"
          subtitle={`${loads.length} total • ${carriers.length} carriers`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold mb-6 text-gray-900">Shipment Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No shipment data yet
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Carrier Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h3 className="text-base font-semibold mb-6 text-gray-900">Carrier Performance</h3>
          {carrierPerformance.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carrierPerformance.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="carrier" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip />
            <Legend />
                <Bar dataKey="otd" name="On-Time %" fill="#003366" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loads" name="Total Loads" fill="#0066a1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No carrier performance data yet
            </div>
          )}
        </div>
      </div>

      {/* Financial Insights & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Financial Summary</h3>
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="font-semibold text-gray-900">${financialMetrics.monthRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Carrier Costs</span>
              <span className="font-semibold text-gray-900">${financialMetrics.monthCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Gross Margin</span>
              <span className={`font-semibold ${financialMetrics.monthMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${financialMetrics.monthMargin.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Margin %</span>
              <span className={`font-bold text-lg ${parseFloat(financialMetrics.marginPercent) >= 15 ? 'text-green-600' : 'text-amber-600'}`}>
                {financialMetrics.marginPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Top Carriers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Top Carriers</h3>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          {topCarriers.length > 0 ? (
            <div className="space-y-3">
              {topCarriers.map((carrier, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{carrier.carrier}</p>
                    <p className="text-xs text-gray-500">{carrier.loads} loads</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${carrier.otd >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                      {carrier.otd}%
                    </p>
                    <p className="text-xs text-gray-500">OTD</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Complete more loads to see top carriers</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#003366]">{carriers.length}</p>
              <p className="text-xs text-gray-600">Active Carriers</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{customers.length}</p>
              <p className="text-xs text-gray-600">Customers</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{statusCounts.dispatched || 0}</p>
              <p className="text-xs text-gray-600">Dispatched</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{statusCounts.delivered || 0}</p>
              <p className="text-xs text-gray-600">Delivered</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Avg. Margin per Load</span>
              <span className="font-semibold text-gray-900">
                ${loads.length > 0 ? (metrics.totalMargin / loads.length).toFixed(0) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loads */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900">Recent Shipments</h3>
          <button 
            onClick={() => setActiveTab && setActiveTab('loads')}
            className="text-sm text-[#003366] hover:text-[#002244] font-medium"
          >
            View All →
          </button>
        </div>
        {recentLoads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment #</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLoads.map((load) => {
                  const margin = (parseFloat(load.rate_billed_to_customer) || 0) - (parseFloat(load.rate_paid_to_carrier) || 0);
                  return (
                    <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">{load.load_number}</td>
                      <td className="py-4 px-4 text-gray-600">{load.customer_name}</td>
                      <td className="py-4 px-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {load.origin_city && load.origin_state 
                            ? `${load.origin_city}, ${load.origin_state}` 
                            : load.origin || 'N/A'} → {load.destination_city && load.destination_state 
                            ? `${load.destination_city}, ${load.destination_state}` 
                            : load.destination || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4"><StatusBadge status={load.status} /></td>
                      <td className="py-4 px-4">
                        <span className={`font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${margin.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
            <p>No shipments yet. Create your first shipment to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Loads Page
function LoadsPage({ loads, carriers, customers, facilities, fetchFacilities, onRefresh, showToast, isManager, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [editingLoad, setEditingLoad] = useState(null);
  const [viewingLoad, setViewingLoad] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [sortBy] = useState('created_at');
  const [sortDir] = useState('desc');

  const filteredLoads = useMemo(() => {
    let result = [...loads];
    
    // Debug logging removed for production
    /*
    console.log('LoadsPage Debug:', { 
      totalLoads: loads.length, 
      isManager, 
      currentUser: currentUser?.id,
      loads: loads.map(l => ({ id: l.id, load_number: l.load_number, created_by: l.created_by }))
    });
    */
    
    // Filter by user if not manager (temporarily disabled for debugging)
    // if (!isManager) {
    //   result = result.filter(l => l.created_by === currentUser?.id);
    // }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(l => 
        l.load_number?.toLowerCase().includes(searchLower) ||
        l.customer_name?.toLowerCase().includes(searchLower) ||
        l.carrier_name?.toLowerCase().includes(searchLower) ||
        l.origin?.toLowerCase().includes(searchLower) ||
        l.destination?.toLowerCase().includes(searchLower)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          result = result.filter(l => new Date(l.created_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          result = result.filter(l => new Date(l.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          result = result.filter(l => new Date(l.created_at) >= filterDate);
          break;
        default:
          break;
      }
    }

    // Carrier filter
    if (carrierFilter !== 'all') {
      result = result.filter(l => l.carrier_name === carrierFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'created_at') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    
    return result;
  }, [loads, search, statusFilter, dateFilter, carrierFilter, sortBy, sortDir]);

  const updateStatus = async (loadId, status) => {
    const updateData = { status };
    if (status === 'delivered') {
      updateData.actual_delivery_date = new Date().toISOString();
    }
    
    const { error } = await supabase.from('loads').update(updateData).eq('id', loadId);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Status updated', 'success');
      onRefresh();
    }
  };

  const deleteLoad = async (loadId) => {
    if (!window.confirm('Are you sure you want to delete this load?')) return;
    
    const { error } = await supabase.from('loads').delete().eq('id', loadId);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Load deleted', 'success');
      onRefresh();
    }
  };

  const exportCSV = () => {
    const headers = ['Load #', 'Customer', 'Carrier', 'Origin', 'Destination', 'Status', 'Rate Billed', 'Rate Paid', 'Margin'];
    const rows = filteredLoads.map(l => [
      l.load_number,
      l.customer_name,
      l.carrier_name,
      l.origin,
      l.destination,
      l.status,
      l.rate_billed_to_customer,
      l.rate_paid_to_carrier,
      ((parseFloat(l.rate_billed_to_customer) || 0) - (parseFloat(l.rate_paid_to_carrier) || 0)).toFixed(2)
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Exported successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search loads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg w-64 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] text-sm"
          >
            <option value="all">All Status</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="late">Late</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] text-sm"
          >
            <option value="all">All Carriers</option>
            {[...new Set(loads.map(l => l.carrier_name).filter(Boolean))].map(carrier => (
              <option key={carrier} value={carrier}>{carrier}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
        <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => { setEditingLoad(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg transition-colors text-sm"
        >
          <Plus className="w-5 h-5" />
            New Load
        </button>
        </div>
      </div>

      {/* Loads Table - Clean Modern Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Customer <Filter className="w-3 h-3 opacity-40" /></div>
                </th>
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Carrier <Filter className="w-3 h-3 opacity-40" /></div>
                </th>
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Status <Filter className="w-3 h-3 opacity-40" /></div>
                </th>
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Lane <Filter className="w-3 h-3 opacity-40" /></div>
                </th>
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Pick Date <Filter className="w-3 h-3 opacity-40" /></div>
                </th>
                <th className="text-left py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Drop Date <Filter className="w-3 h-3 opacity-40" /></div>
                </th>
                <th className="text-right py-4 px-5 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLoads.map((load) => {
                // Calculate status color and timing
                const now = new Date();
                const scheduledDelivery = load.scheduled_delivery_date ? new Date(load.scheduled_delivery_date) : null;
                const isLate = scheduledDelivery && now > scheduledDelivery && load.status !== 'delivered';
                const isOnTime = load.status === 'delivered' || (scheduledDelivery && now <= scheduledDelivery);
                
                // Status styling
                const statusConfig = {
                  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
                  in_transit: isLate 
                    ? { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-500' }
                    : { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
                  dispatched: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
                  late: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-500' },
                  quoted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500' }
                };
                const currentStatus = statusConfig[load.status] || statusConfig.dispatched;

                // Customer avatar colors based on first letter
                const avatarColors = {
                  A: 'bg-red-500', B: 'bg-orange-500', C: 'bg-amber-500', D: 'bg-yellow-500',
                  E: 'bg-lime-500', F: 'bg-green-500', G: 'bg-emerald-500', H: 'bg-teal-500',
                  I: 'bg-cyan-500', J: 'bg-sky-500', K: 'bg-blue-500', L: 'bg-indigo-500',
                  M: 'bg-violet-500', N: 'bg-purple-500', O: 'bg-fuchsia-500', P: 'bg-pink-500',
                  Q: 'bg-rose-500', R: 'bg-red-600', S: 'bg-orange-600', T: 'bg-amber-600',
                  U: 'bg-yellow-600', V: 'bg-lime-600', W: 'bg-green-600', X: 'bg-emerald-600',
                  Y: 'bg-teal-600', Z: 'bg-cyan-600'
                };
                const customerInitial = (load.customer_name || 'U')[0].toUpperCase();
                const avatarColor = avatarColors[customerInitial] || 'bg-gray-500';

                const formatDate = (date) => {
                  if (!date) return '—';
                  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                };

                return (
                  <tr 
                    key={load.id} 
                    className="hover:bg-blue-50/30 transition-all duration-150 cursor-pointer group"
                    onClick={() => setViewingLoad(load)}
                  >
                    {/* Customer with Avatar */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${avatarColor} rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                          {customerInitial}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{load.customer_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">#{load.load_number}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Carrier */}
                    <td className="py-4 px-5">
                      <p className="text-sm text-gray-700">{load.carrier_name || '—'}</p>
                    </td>
                    
                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                        {load.status === 'in_transit' ? 'In Transit' : 
                         load.status === 'delivered' ? 'Delivered' :
                         load.status === 'dispatched' ? 'Dispatched' :
                         load.status === 'late' ? 'Late' : 
                         load.status?.charAt(0).toUpperCase() + load.status?.slice(1)}
                      </span>
                    </td>
                    
                    {/* Progress Bar */}
                    <td className="py-4 px-5">
                      <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${currentStatus.bar}`}
                          style={{ 
                            width: load.status === 'delivered' ? '100%' : 
                                   load.status === 'in_transit' ? '60%' : 
                                   load.status === 'dispatched' ? '25%' : '100%' 
                          }}
                        />
                      </div>
                    </td>
                    
                    {/* Lane (Route) */}
                    <td className="py-4 px-5">
                      <p className="text-sm text-gray-700">
                        {load.origin_city && load.origin_state 
                          ? `${load.origin_city}, ${load.origin_state}` 
                          : load.origin || '—'}
                        <span className="text-gray-400 mx-1">→</span>
                        {load.destination_city && load.destination_state 
                          ? `${load.destination_city}, ${load.destination_state}` 
                          : load.destination || '—'}
                      </p>
                    </td>
                    
                    {/* Pick Date */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-6 rounded-full ${load.pickup_date ? (isOnTime ? 'bg-amber-400' : 'bg-amber-400') : 'bg-gray-200'}`} />
                        <span className="text-sm text-gray-700">{formatDate(load.pickup_date)}</span>
                      </div>
                    </td>
                    
                    {/* Drop Date */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-6 rounded-full ${
                          load.status === 'delivered' ? 'bg-emerald-500' :
                          isLate ? 'bg-rose-500' :
                          scheduledDelivery ? 'bg-amber-400' : 'bg-gray-200'
                        }`} />
                        <span className="text-sm text-gray-700">{formatDate(load.scheduled_delivery_date)}</span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={load.status}
                          onChange={(e) => { e.stopPropagation(); updateStatus(load.id, e.target.value); }}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#003366] bg-white"
                        >
                          <option value="dispatched">Dispatched</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="late">Late</option>
                        </select>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingLoad(load); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLoad(load.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLoads.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No loads found</p>
              <p className="text-sm">Try adjusting your filters or create a new load</p>
            </div>
          )}
        </div>
      </div>

      {/* Load Form Modal */}
      {showForm && (
        <LoadFormModal
          load={editingLoad}
          carriers={carriers}
          customers={customers}
          facilities={facilities}
          onClose={() => { setShowForm(false); setEditingLoad(null); }}
          onSuccess={() => { onRefresh(); fetchFacilities(); setShowForm(false); setEditingLoad(null); }}
          showToast={showToast}
        />
      )}

      {/* Load Detail Modal */}
      {viewingLoad && (
        <LoadDetailModal
          load={viewingLoad}
          onClose={() => setViewingLoad(null)}
          onEdit={() => { setEditingLoad(viewingLoad); setShowForm(true); setViewingLoad(null); }}
          onRefresh={onRefresh}
          showToast={showToast}
          currentUser={currentUser}
        />
      )}

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { onRefresh(); setShowImport(false); }}
          showToast={showToast}
        />
      )}
      </div>
  );
}

// CSV Import Modal
function CSVImportModal({ onClose, onSuccess, showToast }) {
  const [csvData, setCsvData] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1);

  const sampleCSV = `load_number,customer_name,carrier_name,origin,destination,rate_billed_to_customer,rate_paid_to_carrier,status
LD-001,ABC Company,Fast Freight LLC,Chicago IL,Los Angeles CA,2500,2000,dispatched
LD-002,XYZ Corp,Quick Transport,Miami FL,New York NY,1800,1500,in_transit`;

  const parseCSV = () => {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        showToast('CSV must have a header row and at least one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        data.push(row);
      }

      if (data.length === 0) {
        showToast('No valid data rows found', 'error');
        return;
      }

      setParsedData(data);
      setStep(2);
    } catch (error) {
      showToast('Failed to parse CSV', 'error');
    }
  };

  const importData = async () => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of parsedData) {
      const loadData = {
        load_number: row.load_number || `LD-${Date.now()}`,
        customer_name: row.customer_name || '',
        carrier_name: row.carrier_name || '',
        origin: row.origin || '',
        destination: row.destination || '',
        rate_billed_to_customer: parseFloat(row.rate_billed_to_customer) || 0,
        rate_paid_to_carrier: parseFloat(row.rate_paid_to_carrier) || 0,
        status: row.status || 'dispatched',
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase.from('loads').insert([loadData]);
      if (error) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    setImporting(false);
    
    if (errorCount === 0) {
      showToast(`Successfully imported ${successCount} loads`, 'success');
      onSuccess();
    } else {
      showToast(`Imported ${successCount} loads, ${errorCount} failed`, 'warning');
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Import Loads from CSV</h3>
            <p className="text-sm text-gray-500 mt-1">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste your CSV data
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste CSV data here..."
                  className="w-full h-48 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] font-mono text-sm"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Sample CSV Format:</p>
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {sampleCSV}
                </pre>
                <button
                  onClick={() => setCsvData(sampleCSV)}
                  className="mt-2 text-sm text-[#003366] hover:underline"
                >
                  Use sample data
                </button>
              </div>

              <button
                onClick={parseCSV}
                disabled={!csvData.trim()}
                className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                Parse CSV →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Found {parsedData.length} load{parsedData.length !== 1 ? 's' : ''} to import
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-600">Load #</th>
                      <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                      <th className="text-left p-3 font-medium text-gray-600">Route</th>
                      <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.map((row, i) => (
                      <tr key={i}>
                        <td className="p-3 font-medium">{row.load_number}</td>
                        <td className="p-3 text-gray-600">{row.customer_name}</td>
                        <td className="p-3 text-gray-600">{row.origin} → {row.destination}</td>
                        <td className="p-3"><StatusBadge status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={importData}
                  disabled={importing}
                  className="flex-1 bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${parsedData.length} Loads`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Load Detail Modal with Notes & Timeline
function LoadDetailModal({ load, onClose, onEdit, showToast, onRefresh, currentUser }) {
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [uploading, setUploading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Fetch notes, documents, and audit logs for this load
  const fetchAuditLogs = useCallback(async () => {
    if (!load?.id) {
      setAuditLogs([]);
      setLoadingAudit(false);
      return;
    }
    
    setLoadingAudit(true);
    try {
      const { data, error } = await supabase
        .from('load_audit_logs')
        .select('*, profiles(full_name, email)')
        .eq('load_id', load.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Audit log fetch error:', error);
        setAuditLogs([]);
      } else {
        setAuditLogs(data || []);
      }
    } catch (err) {
      console.error('Audit log exception:', err);
      setAuditLogs([]);
    }
    setLoadingAudit(false);
  }, [load?.id]);

  const fetchNotes = useCallback(async () => {
    if (!load?.id) {
      setNotes([]);
      setLoadingNotes(false);
      return;
    }
    
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from('load_notes')
        .select('*')
        .eq('load_id', load.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Notes fetch error:', error);
        setNotes([]);
      } else {
        setNotes(data || []);
      }
    } catch (err) {
      console.error('Notes fetch exception:', err);
      setNotes([]);
    }
    setLoadingNotes(false);
  }, [load?.id]);

  const fetchDocuments = useCallback(async () => {
    if (!load?.id) {
      setDocuments([]);
      setLoadingDocs(false);
      return;
    }
    
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('load_documents')
        .select('*')
        .eq('load_id', load.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Document fetch error:', error);
        // Don't show toast for empty results
        if (error.code !== 'PGRST116') {
          showToast(`Error loading documents: ${error.message}`, 'error');
        }
        setDocuments([]);
      } else {
        setDocuments(data || []);
      }
    } catch (err) {
      console.error('Document fetch exception:', err);
      setDocuments([]);
    }
    setLoadingDocs(false);
  }, [load?.id, showToast]);

  useEffect(() => {
    fetchNotes();
    fetchDocuments();
    fetchAuditLogs();
  }, [fetchNotes, fetchDocuments, fetchAuditLogs]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      if (!currentUser) {
        showToast('You must be logged in to add notes', 'error');
        return;
      }

      const { error } = await supabase.from('load_notes').insert({
        load_id: load.id,
        content: sanitizeInput(newNote),
        user_id: currentUser.id
      });

      if (error) {
        console.error('Note insert error:', error);
        showToast(`Failed to add note: ${error.message}`, 'error');
      } else {
        setNewNote('');
        showToast('Note added', 'success');
        await fetchNotes();
      }
    } catch (err) {
      console.error('Note insert exception:', err);
      showToast(`Failed to add note: ${err.message}`, 'error');
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('load_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) {
        showToast(`Failed to delete note: ${error.message}`, 'error');
      } else {
        showToast('Note deleted', 'success');
        await fetchNotes();
      }
    } catch (err) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Max size is 10MB', 'error');
      return;
    }

    setUploading(true);

    try {
      if (!currentUser) {
        showToast('You must be logged in to upload documents', 'error');
        setUploading(false);
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${load.id}/${docType}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('load-documents')
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('bucket')) {
          showToast('Please create "load-documents" bucket in Supabase Storage', 'error');
        } else {
          showToast(`Upload failed: ${uploadError.message}`, 'error');
        }
        setUploading(false);
        return;
      }

      // Save document record
      const { error: dbError } = await supabase.from('load_documents').insert([{
        load_id: load.id,
        user_id: currentUser.id,
        document_type: docType,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type
      }]).select();

      if (dbError) {
        showToast(`Failed to save document record: ${dbError.message}`, 'error');
      } else {
        showToast(`${docType.toUpperCase()} uploaded successfully`, 'success');
        fetchDocuments();
      }
    } catch (err) {
      showToast('Upload failed', 'error');
    }

    setUploading(false);
    e.target.value = ''; // Reset file input
  };

  const downloadDocument = async (doc) => {
    const { data, error } = await supabase.storage
      .from('load-documents')
      .download(doc.file_path);

    if (error) {
      showToast('Failed to download', 'error');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteDocument = async (docId, filePath) => {
    if (!window.confirm('Delete this document?')) return;

    // Delete from storage
    await supabase.storage.from('load-documents').remove([filePath]);

    // Delete record
    const { error } = await supabase.from('load_documents').delete().eq('id', docId);
    
    if (error) {
      showToast('Failed to delete', 'error');
    } else {
      showToast('Document deleted', 'success');
      fetchDocuments();
    }
  };

  const margin = (parseFloat(load.rate_billed_to_customer) || 0) - (parseFloat(load.rate_paid_to_carrier) || 0);
  const marginPercent = load.rate_billed_to_customer > 0 
    ? ((margin / parseFloat(load.rate_billed_to_customer)) * 100).toFixed(1) 
    : 0;

  // Timeline events
  const timeline = [
    { event: 'Load Created', date: load.created_at, icon: Plus, color: 'bg-gray-400' },
    load.pickup_date && { event: 'Scheduled Pickup', date: load.pickup_date, icon: Calendar, color: 'bg-blue-500' },
    load.status === 'in_transit' && { event: 'In Transit', date: new Date().toISOString(), icon: Truck, color: 'bg-blue-600' },
    load.delivery_confirmed && { event: 'Delivery Confirmed', date: load.delivery_confirmed_at || load.actual_delivery_date, icon: ClipboardCheck, color: 'bg-green-600' },
    load.status === 'delivered' && { event: 'Delivered', date: load.actual_delivery_date || new Date().toISOString(), icon: CheckCircle, color: 'bg-green-500' },
    load.status === 'late' && { event: 'Marked Late', date: new Date().toISOString(), icon: AlertTriangle, color: 'bg-red-500' },
  ].filter(Boolean);

  const docTypes = [
    { id: 'bol', label: 'Bill of Lading (BOL)', icon: FileText },
    { id: 'pod', label: 'Proof of Delivery (POD)', icon: ClipboardCheck },
    { id: 'rate_con', label: 'Rate Confirmation', icon: Receipt },
    { id: 'invoice', label: 'Invoice', icon: CreditCard },
    { id: 'other', label: 'Other Document', icon: File },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{load.load_number}</h3>
              <StatusBadge status={load.status} />
              {load.delivery_confirmed && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Confirmed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{load.customer_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {load.status !== 'delivered' && (
              <button
                onClick={() => setShowDeliveryConfirm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                <ClipboardCheck className="w-4 h-4" />
                Mark Delivered
              </button>
            )}
            <button
              onClick={onEdit}
              className="px-4 py-2 text-[#003366] border border-[#003366] rounded-lg hover:bg-blue-50 flex items-center gap-2 text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'details', label: 'Details', icon: Eye },
            { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
            { id: 'notes', label: `Notes (${notes.length})`, icon: MessageSquare },
            { id: 'history', label: `Change Log (${auditLogs.length})`, icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-[#003366] text-[#003366]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Details */}
              <div className="space-y-6">
                {/* Created By Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[#003366] mb-2">Record Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {load.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created By</p>
                      <p className="text-sm font-medium text-gray-900">
                        {load.profiles?.full_name || 'System / Unknown'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(load.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Route</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Origin</p>
                      <p className="font-medium text-gray-900">
                        {load.origin_city && load.origin_state 
                          ? `${load.origin_city}, ${load.origin_state}` 
                          : load.origin || 'N/A'}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Destination</p>
                      <p className="font-medium text-gray-900">
                        {load.destination_city && load.destination_state 
                          ? `${load.destination_city}, ${load.destination_state}` 
                          : load.destination || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipper Info */}
                {load.shipper_name && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#003366]" />
                      Shipper (Pickup Location)
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Facility Name</p>
                        <p className="font-medium text-gray-900">{load.shipper_name}</p>
                      </div>
                      {(load.shipper_address || load.shipper_address_line2) && (
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          {load.shipper_address && (
                            <p className="text-sm text-gray-700">{load.shipper_address}</p>
                          )}
                          {load.shipper_address_line2 && (
                            <p className="text-sm text-gray-700">{load.shipper_address_line2}</p>
                          )}
                        </div>
                      )}
                      {load.shipper_contact_name && (
                        <div>
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="text-sm text-gray-700">{load.shipper_contact_name}</p>
                          {load.shipper_contact_phone && (
                            <p className="text-sm text-gray-600">{load.shipper_contact_phone}</p>
                          )}
                        </div>
                      )}
                      {load.shipper_appointment_time && (
                        <div>
                          <p className="text-xs text-gray-500">Appointment Time</p>
                          <p className="text-sm text-gray-700">{load.shipper_appointment_time}</p>
                        </div>
                      )}
                      {load.shipper_instructions && (
                        <div>
                          <p className="text-xs text-gray-500">Special Instructions</p>
                          <p className="text-sm text-gray-700 bg-white p-2 rounded">{load.shipper_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Receiver Info */}
                {load.receiver_name && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#003366]" />
                      Receiver (Delivery Location)
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Facility Name</p>
                        <p className="font-medium text-gray-900">{load.receiver_name}</p>
                      </div>
                      {(load.receiver_address || load.receiver_address_line2) && (
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          {load.receiver_address && (
                            <p className="text-sm text-gray-700">{load.receiver_address}</p>
                          )}
                          {load.receiver_address_line2 && (
                            <p className="text-sm text-gray-700">{load.receiver_address_line2}</p>
                          )}
                        </div>
                      )}
                      {load.receiver_contact_name && (
                        <div>
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="text-sm text-gray-700">{load.receiver_contact_name}</p>
                          {load.receiver_contact_phone && (
                            <p className="text-sm text-gray-600">{load.receiver_contact_phone}</p>
                          )}
                        </div>
                      )}
                      {load.receiver_appointment_time && (
                        <div>
                          <p className="text-xs text-gray-500">Appointment Time</p>
                          <p className="text-sm text-gray-700">{load.receiver_appointment_time}</p>
                        </div>
                      )}
                      {load.receiver_instructions && (
                        <div>
                          <p className="text-xs text-gray-500">Special Instructions</p>
                          <p className="text-sm text-gray-700 bg-white p-2 rounded">{load.receiver_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Carrier Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Carrier</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{load.carrier_name || 'Not assigned'}</p>
                    <p className="text-sm text-gray-500">{load.driver_name || 'No driver assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Financials</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Customer Rate</span>
                    <span className="font-medium">${parseFloat(load.rate_billed_to_customer || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Carrier Rate</span>
                    <span className="font-medium">${parseFloat(load.rate_paid_to_carrier || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Margin</span>
                    <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${margin.toFixed(2)} ({marginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Pickup Date</p>
                    <p className="font-medium text-gray-900">
                      {load.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Date</p>
                    <p className="font-medium text-gray-900">
                      {load.scheduled_delivery_date ? new Date(load.scheduled_delivery_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Timeline & Notes */}
            <div className="space-y-6">
              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Activity Timeline
                </h4>
                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.event}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-[#003366]" />
                  Upload Documents
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {docTypes.map((docType) => (
                    <label
                      key={docType.id}
                      className="relative flex flex-col items-center gap-2 p-4 bg-white border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#003366] hover:bg-blue-50 transition-colors"
                    >
                      <docType.icon className="w-6 h-6 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600 text-center">{docType.label}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, docType.id)}
                        disabled={uploading}
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                          <RefreshCw className="w-5 h-5 animate-spin text-[#003366]" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">Supported: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
              </div>

              {/* Documents List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900">Uploaded Documents</h4>
                  <button 
                    onClick={fetchDocuments}
                    className="text-xs text-[#003366] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDocs ? 'animate-spin' : ''}`} />
                    Refresh List
                  </button>
                </div>
                {loadingDocs ? (
                  <p className="text-sm text-gray-400 text-center py-8">Loading documents...</p>
                ) : documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const docTypeInfo = docTypes.find(t => t.id === doc.document_type) || docTypes[4];
                      return (
                        <div key={doc.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.document_type === 'bol' ? 'bg-blue-100 text-blue-600' :
                            doc.document_type === 'pod' ? 'bg-green-100 text-green-600' :
                            doc.document_type === 'rate_con' ? 'bg-amber-100 text-amber-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <docTypeInfo.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {docTypeInfo.label} • {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadDocument(doc)}
                              className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDocument(doc.id, doc.file_path)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-400">No documents uploaded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload BOL, POD, or Rate Confirmation above</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note about this load..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {loadingNotes ? (
                  <p className="text-sm text-gray-400 text-center py-8">Loading notes...</p>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 group relative">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-gray-700 flex-1 pr-8">{note.content}</p>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {note.profiles?.full_name || 'Unknown'} • {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-400">No notes yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add notes to track important information</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#003366]" />
                  Change Log
                </h4>
                <button 
                  onClick={fetchAuditLogs}
                  className="text-xs text-[#003366] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAudit ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {loadingAudit ? (
                  <p className="text-center py-8 text-gray-400">Loading history...</p>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log) => {
                    // Parse changes from JSONB
                    const changes = log.changes || {};
                    const oldData = changes.old || {};
                    const newData = changes.new || {};
                    
                    // Fields to display in audit log
                    const importantFields = [
                      'status', 'carrier_name', 'driver_name', 'origin_city', 'origin_state',
                      'destination_city', 'destination_state', 'pickup_date', 'scheduled_delivery_date',
                      'rate_paid_to_carrier', 'rate_billed_to_customer', 'customer_name',
                      'shipper_name', 'receiver_name', 'miles', 'notes'
                    ];
                    
                    // Find changed fields
                    const changedFields = importantFields.filter(field => {
                      return oldData[field] !== undefined && 
                             newData[field] !== undefined && 
                             oldData[field] !== newData[field];
                    });
                    
                    return (
                      <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-gray-100 last:border-0">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          log.action === 'INSERT' ? 'bg-green-100 text-green-600' : 
                          log.action === 'DELETE' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {log.action === 'INSERT' ? <Plus className="w-2 h-2" /> : 
                           log.action === 'DELETE' ? <X className="w-2 h-2" /> :
                           <Edit className="w-2 h-2" />}
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-900">
                              {log.action === 'INSERT' ? 'Load Created' : 
                               log.action === 'DELETE' ? 'Load Deleted' :
                               'Load Updated'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Show changes for UPDATE actions */}
                          {log.action === 'UPDATE' && changedFields.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {changedFields.map((field) => (
                                <div key={field} className="text-[11px] flex items-start gap-2">
                                  <span className="text-gray-500 font-medium capitalize min-w-[120px]">
                                    {field.replace(/_/g, ' ')}:
                                  </span>
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="text-red-400 line-through max-w-[150px] truncate">
                                      {oldData[field] || 'N/A'}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                    <span className="text-green-600 font-medium max-w-[150px] truncate">
                                      {newData[field] || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Show summary for INSERT actions */}
                          {log.action === 'INSERT' && newData.load_number && (
                            <div className="mt-2 text-[11px] text-gray-600">
                              <p>Load #{newData.load_number} created</p>
                              {newData.customer_name && <p>Customer: {newData.customer_name}</p>}
                              {newData.carrier_name && <p>Carrier: {newData.carrier_name}</p>}
                            </div>
                          )}
                          
                          {/* Show message if no field changes detected */}
                          {log.action === 'UPDATE' && changedFields.length === 0 && (
                            <p className="text-[11px] text-gray-400 mt-1 italic">
                              Minor update (timestamps or system fields)
                            </p>
                          )}
                          
                          <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium text-gray-700">
                              {log.profiles?.full_name || 'System'}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-gray-400 italic">No history recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Confirmation Modal */}
      {showDeliveryConfirm && (
        <DeliveryConfirmModal
          load={load}
          onClose={() => setShowDeliveryConfirm(false)}
          onSuccess={() => {
            setShowDeliveryConfirm(false);
            showToast('Delivery confirmed!', 'success');
            if (onRefresh) onRefresh();
            onClose();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// Delivery Confirmation Modal
function DeliveryConfirmModal({ load, onClose, onSuccess, showToast }) {
  const [formData, setFormData] = useState({
    receiver_name: '',
    delivery_notes: '',
    actual_delivery_date: new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
    
    const { error } = await supabase
      .from('loads')
        .update({
          status: 'delivered',
          delivery_confirmed: true,
          delivery_confirmed_at: new Date().toISOString(),
          delivery_confirmed_by: user?.id,
          receiver_name: sanitizeInput(formData.receiver_name),
          delivery_notes: sanitizeInput(formData.delivery_notes),
          actual_delivery_date: formData.actual_delivery_date
        })
        .eq('id', load.id);

      if (error) throw error;

      // Add a note about the delivery (sanitized)
      const deliveryNoteContent = sanitizeInput(
        `Delivery confirmed. Received by: ${formData.receiver_name || 'N/A'}. ${formData.delivery_notes ? `Notes: ${formData.delivery_notes}` : ''}`
      );
      await supabase.from('load_notes').insert([{
        load_id: load.id,
        user_id: user?.id,
        content: deliveryNoteContent
      }]);

      onSuccess();
    } catch (error) {
      showToast('Failed to confirm delivery', 'error');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Delivery</h3>
              <p className="text-sm text-gray-500">{load.load_number}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date & Time</label>
            <input
              type="datetime-local"
              value={formData.actual_delivery_date}
              onChange={(e) => setFormData({ ...formData, actual_delivery_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received By (Name)</label>
            <input
              type="text"
              placeholder="Name of person who received the shipment"
              value={formData.receiver_name}
              onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes</label>
            <textarea
              placeholder="Any notes about the delivery..."
              value={formData.delivery_notes}
              onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 h-24 resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Remember to upload the Proof of Delivery (POD) document after confirming.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirm Delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Load Form Modal
function LoadFormModal({ load, carriers, customers, facilities, onClose, onSuccess, showToast }) {
  const [formData, setFormData] = useState({
    load_number: load?.load_number || '',
    customer_name: load?.customer_name || '',
    origin_city: load?.origin_city || '',
    origin_state: load?.origin_state || '',
    origin_zip: load?.origin_zip || '',
    destination_city: load?.destination_city || '',
    destination_state: load?.destination_state || '',
    destination_zip: load?.destination_zip || '',
    pickup_date: load?.pickup_date?.slice(0, 16) || '',
    scheduled_delivery_date: load?.scheduled_delivery_date?.slice(0, 16) || '',
    carrier_name: load?.carrier_name || '',
    driver_name: load?.driver_name || '',
    driver_phone: load?.driver_phone || '',
    rate_paid_to_carrier: load?.rate_paid_to_carrier || '',
    rate_billed_to_customer: load?.rate_billed_to_customer || '',
    miles: load?.miles || '',
    notes: load?.notes || '',
    // Shipper fields
    shipper_id: load?.shipper_id || null,
    shipper_name: load?.shipper_name || '',
    shipper_address: load?.shipper_address || '',
    shipper_address_line2: load?.shipper_address_line2 || '',
    shipper_contact_name: load?.shipper_contact_name || '',
    shipper_contact_phone: load?.shipper_contact_phone || '',
    shipper_instructions: load?.shipper_instructions || '',
    shipper_appointment_time: load?.shipper_appointment_time || '',
    // Receiver fields
    receiver_id: load?.receiver_id || null,
    receiver_name: load?.receiver_name || '',
    receiver_address: load?.receiver_address || '',
    receiver_address_line2: load?.receiver_address_line2 || '',
    receiver_contact_name: load?.receiver_contact_name || '',
    receiver_contact_phone: load?.receiver_contact_phone || '',
    receiver_instructions: load?.receiver_instructions || '',
    receiver_appointment_time: load?.receiver_appointment_time || ''
  });
  const [loading, setLoading] = useState(false);
  const [zipLookupLoading, setZipLookupLoading] = useState(false);

  // Geocode from ZIP code using Nominatim (OpenStreetMap)
  const lookupZipCode = async (zip, type) => {
    if (!zip || zip.length < 5) return;
    
    setZipLookupLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'TMSPortal/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const address = data[0].address;
        
        // Try to get the most specific locality (city/town/village), NOT county
        // Priority: city > town > village > municipality > suburb
        const city = address.city || 
                    address.town || 
                    address.village || 
                    address.municipality || 
                    address.suburb ||
                    address.hamlet ||
                    address.neighbourhood ||
                    '';
        
        // Get state abbreviation
        const stateAbbr = address['ISO3166-2-lvl4'] ? 
                         address['ISO3166-2-lvl4'].split('-')[1] : 
                         address.state || '';
        
        if (!city) {
          showToast('Could not find city for this ZIP code', 'error');
          setZipLookupLoading(false);
          return;
        }
        
        if (type === 'origin') {
          setFormData(prev => ({
            ...prev,
            origin_city: city,
            origin_state: stateAbbr
          }));
          showToast(`Found: ${city}, ${stateAbbr}`, 'success');
    } else {
          setFormData(prev => ({
            ...prev,
            destination_city: city,
            destination_state: stateAbbr
          }));
          showToast(`Found: ${city}, ${stateAbbr}`, 'success');
        }
      } else {
        showToast('ZIP code not found', 'error');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showToast('Could not lookup ZIP code', 'error');
    }
    setZipLookupLoading(false);
  };

  // Calculate miles using OSRM (free routing service)
  const calculateMiles = async () => {
    // Need both origin and destination - check city fields
    const hasOrigin = formData.origin_city && formData.origin_state;
    const hasDestination = formData.destination_city && formData.destination_state;
    
    if (!hasOrigin && !hasDestination) {
      showToast('Please lookup both origin and destination ZIP codes first', 'error');
      return;
    }
    if (!hasOrigin) {
      showToast('Please lookup origin ZIP code first', 'error');
      return;
    }
    if (!hasDestination) {
      showToast('Please lookup destination ZIP code first', 'error');
      return;
    }

    setZipLookupLoading(true);
    
    try {
      // Get coordinates for origin using city, state
      const originResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(formData.origin_city)}&state=${encodeURIComponent(formData.origin_state)}&country=USA&format=json&limit=1`,
        { headers: { 'User-Agent': 'TMSPortal/1.0' } }
      );
      const originData = await originResponse.json();
      
      if (!originData || originData.length === 0) {
        showToast('Could not find origin location on map', 'error');
        setZipLookupLoading(false);
        return;
      }
      
      // Get coordinates for destination using city, state
      const destResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(formData.destination_city)}&state=${encodeURIComponent(formData.destination_state)}&country=USA&format=json&limit=1`,
        { headers: { 'User-Agent': 'TMSPortal/1.0' } }
      );
      const destData = await destResponse.json();
      
      if (!destData || destData.length === 0) {
        showToast('Could not find destination location on map', 'error');
        setZipLookupLoading(false);
        return;
      }
      
      const originLon = parseFloat(originData[0].lon);
      const originLat = parseFloat(originData[0].lat);
      const destLon = parseFloat(destData[0].lon);
      const destLat = parseFloat(destData[0].lat);
      
      // Haversine formula to calculate straight-line distance
      const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      let distanceMiles;
      let isEstimate = false;
      
      // Try OSRM for actual driving distance
      try {
        const routeResponse = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`
        );
        const routeData = await routeResponse.json();
        
        if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
          const distanceMeters = routeData.routes[0].distance;
          distanceMiles = Math.round(distanceMeters / 1609.34);
        } else {
          throw new Error('OSRM failed');
        }
      } catch (routeError) {
        // Fallback: use straight-line distance * 1.3 (typical road factor)
        console.log('OSRM failed, using Haversine estimate:', routeError);
        const straightLine = haversineDistance(originLat, originLon, destLat, destLon);
        distanceMiles = Math.round(straightLine * 1.3);
        isEstimate = true;
      }
      
      setFormData(prev => ({
        ...prev,
        miles: distanceMiles.toString()
      }));
      
      showToast(
        isEstimate 
          ? `Estimated: ~${distanceMiles.toLocaleString()} miles (road distance may vary)` 
          : `Distance: ${distanceMiles.toLocaleString()} miles`,
        'success'
      );
    } catch (error) {
      console.error('Distance calculation error:', error);
      showToast('Error: Enter both origin and destination first', 'error');
    }
    
    setZipLookupLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = [];
    if (validateRequired(formData.load_number, 'Load Number')) errors.push(validateRequired(formData.load_number, 'Load Number'));
    if (validateRequired(formData.customer_name, 'Customer')) errors.push(validateRequired(formData.customer_name, 'Customer'));
    if (validateRequired(formData.origin_city, 'Origin City')) errors.push(validateRequired(formData.origin_city, 'Origin City'));
    if (validateRequired(formData.origin_state, 'Origin State')) errors.push(validateRequired(formData.origin_state, 'Origin State'));
    if (validateRequired(formData.destination_city, 'Destination City')) errors.push(validateRequired(formData.destination_city, 'Destination City'));
    if (validateRequired(formData.destination_state, 'Destination State')) errors.push(validateRequired(formData.destination_state, 'Destination State'));
    if (validateRequired(formData.carrier_name, 'Carrier')) errors.push(validateRequired(formData.carrier_name, 'Carrier'));
    
    // Validate phone if provided
    if (formData.driver_phone && !validatePhone(formData.driver_phone)) {
      errors.push('Invalid phone number format');
    }
    
    // Validate rates
    if (formData.rate_paid_to_carrier && validateNumber(formData.rate_paid_to_carrier, 'Rate Paid')) {
      errors.push(validateNumber(formData.rate_paid_to_carrier, 'Rate Paid'));
    }
    if (formData.rate_billed_to_customer && validateNumber(formData.rate_billed_to_customer, 'Rate Billed')) {
      errors.push(validateNumber(formData.rate_billed_to_customer, 'Rate Billed'));
    }
    
    const validErrors = errors.filter(e => e);
    if (validErrors.length > 0) {
      showToast(validErrors[0], 'error');
      return;
    }
    
    setLoading(true);
    
    // Sanitize all input
    const sanitizedData = sanitizeFormData(formData);
    
    // Convert empty strings to null for numeric fields
    if (sanitizedData.miles === '' || sanitizedData.miles === '0') {
      sanitizedData.miles = null;
    } else if (sanitizedData.miles) {
      sanitizedData.miles = parseInt(sanitizedData.miles, 10) || null;
    }
    
    if (sanitizedData.rate_paid_to_carrier === '') {
      sanitizedData.rate_paid_to_carrier = null;
    }
    
    if (sanitizedData.rate_billed_to_customer === '') {
      sanitizedData.rate_billed_to_customer = null;
    }
    
    // Convert empty strings to null for time fields
    if (sanitizedData.shipper_appointment_time === '') {
      sanitizedData.shipper_appointment_time = null;
    }
    
    if (sanitizedData.receiver_appointment_time === '') {
      sanitizedData.receiver_appointment_time = null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create shipper facility if needed
      if (!sanitizedData.shipper_id && sanitizedData.shipper_name) {
        const { data: newShipper, error: shipperError } = await supabase
          .from('facilities')
          .insert([{
            facility_name: sanitizedData.shipper_name,
            address_line1: sanitizedData.shipper_address || sanitizedData.origin_city,
            address_line2: sanitizedData.shipper_address_line2 || null,
            city: sanitizedData.origin_city,
            state: sanitizedData.origin_state,
            zip: sanitizedData.origin_zip,
            contact_name: sanitizedData.shipper_contact_name,
            contact_phone: sanitizedData.shipper_contact_phone,
            special_instructions: sanitizedData.shipper_instructions,
            facility_type: 'warehouse',
            created_by: user.id
          }])
          .select()
          .single();
        
        if (!shipperError && newShipper) {
          sanitizedData.shipper_id = newShipper.id;
        }
      }
      
      // Create receiver facility if needed
      if (!sanitizedData.receiver_id && sanitizedData.receiver_name) {
        const { data: newReceiver, error: receiverError } = await supabase
          .from('facilities')
          .insert([{
            facility_name: sanitizedData.receiver_name,
            address_line1: sanitizedData.receiver_address || sanitizedData.destination_city,
            address_line2: sanitizedData.receiver_address_line2 || null,
            city: sanitizedData.destination_city,
            state: sanitizedData.destination_state,
            zip: sanitizedData.destination_zip,
            contact_name: sanitizedData.receiver_contact_name,
            contact_phone: sanitizedData.receiver_contact_phone,
            special_instructions: sanitizedData.receiver_instructions,
            facility_type: 'warehouse',
            created_by: user.id
          }])
          .select()
          .single();
        
        if (!receiverError && newReceiver) {
          sanitizedData.receiver_id = newReceiver.id;
        }
      }
      
      // Save load
      if (load) {
        const { error } = await supabase.from('loads').update(sanitizedData).eq('id', load.id);
        if (error) throw error;
        showToast('Load updated successfully', 'success');
      } else {
        const { error } = await supabase.from('loads').insert([{ 
          ...sanitizedData, 
          created_by: user.id, 
          status: 'dispatched' 
        }]);
        if (error) throw error;
        showToast('Load created successfully', 'success');
      }
      onSuccess();
    } catch (error) {
      showToast(error.message, 'error');
    }
    setLoading(false);
  };

  const margin = (parseFloat(formData.rate_billed_to_customer) || 0) - (parseFloat(formData.rate_paid_to_carrier) || 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">{load ? 'Edit Load' : 'Create New Load'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Load Number *</label>
            <input
              type="text"
                required
              value={formData.load_number}
              onChange={(e) => setFormData({...formData, load_number: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="LOAD-001"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <input
              type="text"
                required
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Customer name"
                list="customers-list"
              />
              <datalist id="customers-list">
                {customers.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            
            {/* Shipper (Pickup) Section */}
            <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#003366]" />
                Shipper (Pickup Location)
              </h4>
              
              {/* Shipper Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Existing Facility (Optional)</label>
                <select
                  value={formData.shipper_id || ''}
                  onChange={(e) => {
                    const facilityId = e.target.value;
                    if (facilityId === 'new') {
                      setFormData({
                        ...formData,
                        shipper_id: null,
                        shipper_name: '',
                        shipper_address: '',
                        shipper_address_line2: '',
                        shipper_contact_name: '',
                        shipper_contact_phone: '',
                        shipper_instructions: ''
                      });
                    } else if (facilityId) {
                      const facility = facilities.find(f => f.id === facilityId);
                      if (facility) {
                        setFormData({
                          ...formData,
                          shipper_id: facility.id,
                          shipper_name: facility.facility_name,
                          shipper_address: facility.address_line1 || '',
                          shipper_address_line2: facility.address_line2 || '',
                          shipper_contact_name: facility.contact_name || '',
                          shipper_contact_phone: facility.contact_phone || '',
                          shipper_instructions: facility.special_instructions || '',
                          origin_city: facility.city,
                          origin_state: facility.state,
                          origin_zip: facility.zip
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                >
                  <option value="">-- Select or Enter New --</option>
                  <option value="new">+ Create New Facility</option>
                  {facilities.length > 0 && (
                    <optgroup label="All Facilities">
                      {facilities.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.facility_name} - {f.city}, {f.state}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              {/* Shipper Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Facility Name</label>
            <input
              type="text"
                    value={formData.shipper_name}
                    onChange={(e) => setFormData({...formData, shipper_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="e.g., Amazon Fulfillment DC-12"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
            <input
              type="text"
                    value={formData.shipper_address}
                    onChange={(e) => setFormData({...formData, shipper_address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="e.g., 123 Warehouse Blvd"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.shipper_address_line2}
                    onChange={(e) => setFormData({...formData, shipper_address_line2: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="Suite, Unit, Building, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
            <input
              type="text"
                    value={formData.shipper_contact_name}
                    onChange={(e) => setFormData({...formData, shipper_contact_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.shipper_contact_phone}
                    onChange={(e) => setFormData({...formData, shipper_contact_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.shipper_appointment_time}
                    onChange={(e) => setFormData({...formData, shipper_appointment_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Special Instructions</label>
                  <textarea
                    value={formData.shipper_instructions}
                    onChange={(e) => setFormData({...formData, shipper_instructions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="e.g., Gate code: 1234, Enter through dock door 5"
                    rows="2"
                  />
                </div>
              </div>
            </div>
            
            {/* Origin Address */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#003366]" />
                Origin Address
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
            <input
              type="text"
                    required
                    value={formData.origin_city}
                    onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="Houston"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
            <input
              type="text"
                    required
                    maxLength="2"
                    value={formData.origin_state}
                    onChange={(e) => setFormData({...formData, origin_state: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] uppercase"
                    placeholder="TX"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ZIP Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength="5"
                      value={formData.origin_zip}
                      onChange={(e) => setFormData({...formData, origin_zip: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                      placeholder="77001"
                    />
                    <button
                      type="button"
                      onClick={() => lookupZipCode(formData.origin_zip, 'origin')}
                      disabled={!formData.origin_zip || zipLookupLoading}
                      className="px-3 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      Lookup
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter ZIP and click Lookup to auto-fill city/state</p>
                </div>
              </div>
            </div>
            
            {/* Receiver (Delivery) Section */}
            <div className="col-span-2 bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#003366]" />
                Receiver (Delivery Location)
              </h4>
              
              {/* Receiver Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Existing Facility (Optional)</label>
                <select
                  value={formData.receiver_id || ''}
                  onChange={(e) => {
                    const facilityId = e.target.value;
                    if (facilityId === 'new') {
                      setFormData({
                        ...formData,
                        receiver_id: null,
                        receiver_name: '',
                        receiver_address: '',
                        receiver_address_line2: '',
                        receiver_contact_name: '',
                        receiver_contact_phone: '',
                        receiver_instructions: ''
                      });
                    } else if (facilityId) {
                      const facility = facilities.find(f => f.id === facilityId);
                      if (facility) {
                        setFormData({
                          ...formData,
                          receiver_id: facility.id,
                          receiver_name: facility.facility_name,
                          receiver_address: facility.address_line1 || '',
                          receiver_address_line2: facility.address_line2 || '',
                          receiver_contact_name: facility.contact_name || '',
                          receiver_contact_phone: facility.contact_phone || '',
                          receiver_instructions: facility.special_instructions || '',
                          destination_city: facility.city,
                          destination_state: facility.state,
                          destination_zip: facility.zip
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                >
                  <option value="">-- Select or Enter New --</option>
                  <option value="new">+ Create New Facility</option>
                  {facilities.length > 0 && (
                    <optgroup label="All Facilities">
                      {facilities.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.facility_name} - {f.city}, {f.state}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              {/* Receiver Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={formData.receiver_name}
                    onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="e.g., Walmart Distribution Center"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.receiver_address}
                    onChange={(e) => setFormData({...formData, receiver_address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="e.g., 456 Distribution Way"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.receiver_address_line2}
                    onChange={(e) => setFormData({...formData, receiver_address_line2: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="Suite, Unit, Building, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.receiver_contact_name}
                    onChange={(e) => setFormData({...formData, receiver_contact_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="Jane Smith"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.receiver_contact_phone}
                    onChange={(e) => setFormData({...formData, receiver_contact_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="(555) 987-6543"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.receiver_appointment_time}
                    onChange={(e) => setFormData({...formData, receiver_appointment_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Special Instructions</label>
                  <textarea
                    value={formData.receiver_instructions}
                    onChange={(e) => setFormData({...formData, receiver_instructions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="e.g., Call 30 min before arrival, unload at dock 8"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#003366]" />
                Destination Address
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination_city}
                    onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                    placeholder="Miami"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    maxLength="2"
                    value={formData.destination_state}
                    onChange={(e) => setFormData({...formData, destination_state: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] uppercase"
                    placeholder="FL"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ZIP Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength="5"
                      value={formData.destination_zip}
                      onChange={(e) => setFormData({...formData, destination_zip: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]"
                      placeholder="33101"
                    />
                    <button
                      type="button"
                      onClick={() => lookupZipCode(formData.destination_zip, 'destination')}
                      disabled={!formData.destination_zip || zipLookupLoading}
                      className="px-3 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      Lookup
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter ZIP and click Lookup to auto-fill city/state</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
            <input
              type="datetime-local"
              value={formData.pickup_date}
              onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Delivery</label>
            <input
              type="datetime-local"
              value={formData.scheduled_delivery_date}
              onChange={(e) => setFormData({...formData, scheduled_delivery_date: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrier *</label>
            <input
              type="text"
                required
              value={formData.carrier_name}
              onChange={(e) => setFormData({...formData, carrier_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Carrier name"
                list="carriers-list"
              />
              <datalist id="carriers-list">
                {carriers.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
            <input
              type="text"
              value={formData.driver_name}
              onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Driver name"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label>
            <input
              type="tel"
              value={formData.driver_phone}
              onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="555-123-4567"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miles</label>
              <div className="flex gap-2">
            <input
              type="number"
                  value={formData.miles}
                  onChange={(e) => setFormData({...formData, miles: e.target.value})}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={calculateMiles}
                  disabled={zipLookupLoading}
                  className="px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                  title="Calculate driving distance using OSRM"
                >
                  {zipLookupLoading ? '...' : 'Calc'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-calculate from addresses</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Billed to Customer</label>
            <input
              type="number"
              step="0.01"
              value={formData.rate_billed_to_customer}
              onChange={(e) => setFormData({...formData, rate_billed_to_customer: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="0.00"
            />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Paid to Carrier</label>
            <input
              type="number"
              step="0.01"
                value={formData.rate_paid_to_carrier}
                onChange={(e) => setFormData({...formData, rate_paid_to_carrier: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="0.00"
            />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margin</label>
              <div className={`px-4 py-2.5 rounded-lg font-semibold ${margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                ${margin.toFixed(2)}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : (load ? 'Update Load' : 'Create Load')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
  );
}

// Facilities Page (Shippers/Receivers)
function FacilitiesPage({ facilities, loads, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [search, setSearch] = useState('');

  const facilityStats = useMemo(() => {
    return facilities.map(facility => {
      const pickups = loads.filter(l => l.shipper_id === facility.id);
      const deliveries = loads.filter(l => l.receiver_id === facility.id);
      
      return {
        ...facility,
        totalPickups: pickups.length,
        totalDeliveries: deliveries.length,
        totalActivity: pickups.length + deliveries.length
      };
    });
  }, [facilities, loads]);

  const filteredFacilities = facilityStats.filter(f => 
    f.facility_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.city?.toLowerCase().includes(search.toLowerCase()) ||
    f.state?.toLowerCase().includes(search.toLowerCase())
  );

  const saveFacility = async (data) => {
    const sanitizedData = sanitizeFormData(data);
    
    if (editingFacility) {
      const { error } = await supabase.from('facilities').update(sanitizedData).eq('id', editingFacility.id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Facility updated', 'success');
        onRefresh();
        setShowForm(false);
        setEditingFacility(null);
      }
    } else {
      const { error } = await supabase.from('facilities').insert([sanitizedData]);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Facility added', 'success');
        onRefresh();
        setShowForm(false);
      }
    }
  };

  const deleteFacility = async (facilityId) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    const { error } = await supabase.from('facilities').delete().eq('id', facilityId);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Facility deleted', 'success');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facilities</h2>
          <p className="text-sm text-gray-500 mt-1">Manage shippers, receivers, and warehouses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Facility
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg w-64"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredFacilities.length} facilities
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center group-hover:bg-[#004080] transition-colors">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#003366] transition-colors">
                      {facility.facility_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {facility.city}, {facility.state} {facility.zip}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingFacility(facility); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFacility(facility.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {facility.address_line1 && (
                  <div className="text-sm text-gray-600">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {facility.address_line1}
                    {facility.address_line2 && `, ${facility.address_line2}`}
                  </div>
                )}
                {facility.contact_name && (
                  <div className="text-sm text-gray-600">
                    <User className="w-3 h-3 inline mr-1" />
                    {facility.contact_name}
                    {facility.contact_phone && ` • ${facility.contact_phone}`}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 group-hover:bg-blue-100 transition-colors">
                  <p className="text-xs text-gray-500 mb-1">Pickups</p>
                  <p className="text-xl font-bold text-[#003366]">{facility.totalPickups}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 group-hover:bg-green-100 transition-colors">
                  <p className="text-xs text-gray-500 mb-1">Deliveries</p>
                  <p className="text-xl font-bold text-green-600">{facility.totalDeliveries}</p>
                </div>
              </div>

              {facility.special_instructions && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{facility.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No facilities found. Add your first facility to get started.</p>
        </div>
      )}

      {showForm && (
        <FacilityFormModal
          facility={editingFacility}
          onClose={() => { setShowForm(false); setEditingFacility(null); }}
          onSave={saveFacility}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// Facility Form Modal
function FacilityFormModal({ facility, onClose, onSave, showToast }) {
  const [formData, setFormData] = useState({
    facility_name: facility?.facility_name || '',
    facility_type: facility?.facility_type || 'warehouse',
    address_line1: facility?.address_line1 || '',
    address_line2: facility?.address_line2 || '',
    city: facility?.city || '',
    state: facility?.state || '',
    zip: facility?.zip || '',
    country: facility?.country || 'USA',
    contact_name: facility?.contact_name || '',
    contact_phone: facility?.contact_phone || '',
    contact_email: facility?.contact_email || '',
    special_instructions: facility?.special_instructions || '',
    gate_code: facility?.gate_code || '',
    hours_of_operation: facility?.hours_of_operation || '',
    appointment_required: facility?.appointment_required || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.facility_name || !formData.city || !formData.state) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">{facility ? 'Edit Facility' : 'Add New Facility'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name *</label>
              <input
                type="text"
                required
                value={formData.facility_name}
                onChange={(e) => setFormData({...formData, facility_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="e.g., Amazon Fulfillment Center DC-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type</label>
              <select
                value={formData.facility_type}
                onChange={(e) => setFormData({...formData, facility_type: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              >
                <option value="warehouse">Warehouse</option>
                <option value="distribution_center">Distribution Center</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Required?</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.appointment_required}
                  onChange={(e) => setFormData({...formData, appointment_required: e.target.checked})}
                  className="w-5 h-5 text-[#003366] rounded focus:ring-2 focus:ring-[#003366]"
                />
                <span className="text-sm text-gray-600">Yes, appointments required</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={formData.address_line1}
                onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="123 Warehouse Boulevard"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Suite, Building, Floor, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Houston"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input
                type="text"
                required
                maxLength="2"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] uppercase"
                placeholder="TX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                maxLength="10"
                value={formData.zip}
                onChange={(e) => setFormData({...formData, zip: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="77001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                maxLength="3"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] uppercase"
                placeholder="USA"
              />
            </div>

            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="shipping@facility.com"
              />
            </div>

            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Details</h4>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours of Operation</label>
              <input
                type="text"
                value={formData.hours_of_operation}
                onChange={(e) => setFormData({...formData, hours_of_operation: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Mon-Fri 8AM-5PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gate Code</label>
              <input
                type="text"
                value={formData.gate_code}
                onChange={(e) => setFormData({...formData, gate_code: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="#1234"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="Enter through dock door 5, call 30 min before arrival, etc."
                rows="3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg"
            >
              {facility ? 'Update Facility' : 'Add Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Carriers Page
function CarriersPage({ carriers, loads, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [search, setSearch] = useState('');

  const carrierStats = useMemo(() => {
    return carriers.map(carrier => {
      const carrierLoads = loads.filter(l => l.carrier_name === carrier.name);
      const deliveredLoads = carrierLoads.filter(l => l.status === 'delivered' && l.actual_delivery_date);
      const onTimeLoads = deliveredLoads.filter(l => 
        new Date(l.actual_delivery_date) <= new Date(l.scheduled_delivery_date)
      );
      const otd = deliveredLoads.length > 0 ? Math.round((onTimeLoads.length / deliveredLoads.length) * 100) : 0;
      
      return {
        ...carrier,
        totalLoads: carrierLoads.length,
        otd
      };
    });
  }, [carriers, loads]);

  const filteredCarriers = carrierStats.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mc_number?.toLowerCase().includes(search.toLowerCase())
  );

  const saveCarrier = async (data) => {
    // Sanitize all input data
    const sanitizedData = sanitizeFormData(data);
    
    if (editingCarrier) {
      const { error } = await supabase.from('carriers').update(sanitizedData).eq('id', editingCarrier.id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Carrier updated', 'success');
        onRefresh();
        setShowForm(false);
        setEditingCarrier(null);
      }
    } else {
      const { error } = await supabase.from('carriers').insert([sanitizedData]);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Carrier added', 'success');
        onRefresh();
        setShowForm(false);
      }
    }
  };

  const deleteCarrier = async (carrierId) => {
    if (!window.confirm('Are you sure you want to delete this carrier?')) return;
    const { error } = await supabase.from('carriers').delete().eq('id', carrierId);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Carrier deleted', 'success');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search carriers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg w-64"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg hover:opacity-90 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Carrier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCarriers.map((carrier) => (
          <div key={carrier.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => setSelectedCarrier(carrier)}
                >
                  <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center group-hover:bg-[#004080] transition-colors">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#003366] transition-colors">{carrier.name}</h3>
                    <p className="text-sm text-gray-500">MC# {carrier.mc_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCarrier(carrier); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCarrier(carrier.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div 
                className="grid grid-cols-2 gap-4 cursor-pointer"
                onClick={() => setSelectedCarrier(carrier)}
              >
                <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-blue-50 transition-colors">
                  <p className="text-xs text-gray-500 mb-1">Total Loads</p>
                  <p className="text-xl font-bold text-gray-900">{carrier.totalLoads}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-blue-50 transition-colors">
                  <p className="text-xs text-gray-500 mb-1">On-Time %</p>
                  <p className={`text-xl font-bold ${carrier.otd >= 90 ? 'text-emerald-600' : carrier.otd >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                    {carrier.otd}%
                  </p>
                </div>
              </div>
              <div 
                className="mt-4 space-y-2 cursor-pointer"
                onClick={() => setSelectedCarrier(carrier)}
              >
                {carrier.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    {carrier.contact_phone}
                  </div>
                )}
                {carrier.safety_rating && carrier.safety_rating !== 'None' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className={`w-4 h-4 ${
                      carrier.safety_rating === 'Satisfactory' ? 'text-green-500' :
                      carrier.safety_rating === 'Conditional' ? 'text-amber-500' :
                      'text-red-500'
                    }`} />
                    <span className={`${
                      carrier.safety_rating === 'Satisfactory' ? 'text-green-600' :
                      carrier.safety_rating === 'Conditional' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {carrier.safety_rating}
                    </span>
                  </div>
                )}
                {carrier.city && carrier.state && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {carrier.city}, {carrier.state}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCarriers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400">No carriers found</p>
        </div>
      )}

      {showForm && (
        <CarrierFormModal 
          carrier={editingCarrier}
          onClose={() => { setShowForm(false); setEditingCarrier(null); }} 
          onSubmit={saveCarrier} 
        />
      )}

      {selectedCarrier && (
        <CarrierDetailModal
          carrier={selectedCarrier}
          loads={loads}
          onClose={() => setSelectedCarrier(null)}
        />
      )}
    </div>
  );
}

// Carrier Form Modal with FMCSA Lookup
function CarrierFormModal({ carrier, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: carrier?.name || '',
    mc_number: carrier?.mc_number || '',
    dot_number: carrier?.dot_number || '',
    contact_name: carrier?.contact_name || '',
    contact_phone: carrier?.contact_phone || '',
    contact_email: carrier?.contact_email || '',
    address: carrier?.address || '',
    city: carrier?.city || '',
    state: carrier?.state || '',
    zip: carrier?.zip || '',
    safety_rating: carrier?.safety_rating || '',
    operating_status: carrier?.operating_status || '',
    power_units: carrier?.power_units || '',
    drivers: carrier?.drivers || ''
  });
  
  const [lookupMC, setLookupMC] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState(false);

  // FMCSA Lookup function
  const handleFMCSALookup = async () => {
    if (!lookupMC.trim()) {
      setLookupError('Please enter an MC number');
      return;
    }

    setLookupLoading(true);
    setLookupError('');
    setLookupSuccess(false);

    try {
      // Call our Supabase Edge Function (use the constants defined at the top with fallbacks)
      const response = await fetch(
        `${supabaseUrl}/functions/v1/scrape-fmcsa`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ mcNumber: lookupMC }),
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        // Auto-fill the form with FMCSA data
        setFormData({
          ...formData,
          name: result.data.legalName || result.data.dbaName || formData.name,
          mc_number: result.data.mcNumber || lookupMC,
          dot_number: result.data.usdotNumber || formData.dot_number,
          contact_phone: result.data.phone || formData.contact_phone,
          address: result.data.address || formData.address,
          city: result.data.city || formData.city,
          state: result.data.state || formData.state,
          zip: result.data.zip || formData.zip,
          safety_rating: result.data.safetyRating || formData.safety_rating,
          operating_status: result.data.operatingStatus || formData.operating_status,
          power_units: result.data.powerUnits || formData.power_units,
          drivers: result.data.drivers || formData.drivers
        });
        setLookupSuccess(true);
        setLookupError('');
      } else {
        setLookupError(result.error || 'Carrier not found. Please verify the MC number.');
      }
    } catch (error) {
      console.error('FMCSA Lookup error:', error);
      setLookupError('Failed to lookup carrier. Please try again or enter details manually.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">{carrier ? 'Edit Carrier' : 'Add Carrier'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* FMCSA Lookup Section - only show when adding new carrier */}
        {!carrier && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <label className="block text-sm font-medium text-[#003366] mb-2">
              🔍 Auto-fill from FMCSA (SAFER)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter MC Number (e.g., 123456)"
                value={lookupMC}
                onChange={(e) => {
                  setLookupMC(e.target.value);
                  setLookupError('');
                  setLookupSuccess(false);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleFMCSALookup}
                disabled={lookupLoading}
                className="px-4 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {lookupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lookup
                  </>
                )}
              </button>
            </div>
            {lookupError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {lookupError}
              </p>
            )}
            {lookupSuccess && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Carrier data loaded from FMCSA!
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Data sourced from <a href="https://safer.fmcsa.dot.gov" target="_blank" rel="noopener noreferrer" className="text-[#003366] underline">FMCSA SAFER</a>
            </p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Name *</label>
            <input
              type="text"
              required
              placeholder="Legal business name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label>
              <input
                type="text"
                placeholder="MC-123456"
                value={formData.mc_number}
                onChange={(e) => setFormData({...formData, mc_number: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label>
              <input
                type="text"
                placeholder="1234567"
                value={formData.dot_number}
                onChange={(e) => setFormData({...formData, dot_number: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="Street address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                placeholder="ST"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input
                type="text"
                placeholder="12345"
                value={formData.zip}
                onChange={(e) => setFormData({...formData, zip: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-3">Contact Information</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Contact Name"
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                />
              </div>
            </div>
          </div>

          {/* FMCSA Details (if available) */}
          {(formData.safety_rating || formData.operating_status || formData.power_units) && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-3">FMCSA Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Safety Rating</label>
                  <input
                    type="text"
                    value={formData.safety_rating}
                    onChange={(e) => setFormData({...formData, safety_rating: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Operating Status</label>
                  <input
                    type="text"
                    value={formData.operating_status}
                    onChange={(e) => setFormData({...formData, operating_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Power Units</label>
                  <input
                    type="text"
                    value={formData.power_units}
                    onChange={(e) => setFormData({...formData, power_units: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Drivers</label>
                  <input
                    type="text"
                    value={formData.drivers}
                    onChange={(e) => setFormData({...formData, drivers: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold mt-4"
          >
            {carrier ? 'Update Carrier' : 'Add Carrier'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Carrier Detail Analytics Modal
function CarrierDetailModal({ carrier, loads, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchLoad, setSearchLoad] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  // eslint-disable-next-line no-unused-vars
  const [dateRange, _setDateRange] = useState({ start: '', end: '' });

  // Get all loads for this carrier
  const carrierLoads = useMemo(() => {
    return loads.filter(l => l.carrier_name === carrier.name);
  }, [loads, carrier.name]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalLoads = carrierLoads.length;
    const totalRevenue = carrierLoads.reduce((sum, l) => sum + (parseFloat(l.rate_paid_to_carrier) || 0), 0);
    const deliveredLoads = carrierLoads.filter(l => l.status === 'delivered' && l.actual_delivery_date);
    const onTimeLoads = deliveredLoads.filter(l => 
      new Date(l.actual_delivery_date) <= new Date(l.scheduled_delivery_date)
    );
    const otd = deliveredLoads.length > 0 ? ((onTimeLoads.length / deliveredLoads.length) * 100).toFixed(1) : 0;
    
    const avgRate = totalLoads > 0 ? (totalRevenue / totalLoads).toFixed(2) : 0;
    
    // Calculate total miles (if available)
    const totalMiles = carrierLoads.reduce((sum, l) => sum + (parseFloat(l.miles) || 0), 0);
    const avgRatePerMile = totalMiles > 0 ? (totalRevenue / totalMiles).toFixed(2) : 0;

    // Date range
    const dates = carrierLoads.map(l => new Date(l.created_at)).filter(d => !isNaN(d));
    const firstLoad = dates.length > 0 ? new Date(Math.min(...dates)) : null;
    const lastLoad = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    return {
      totalLoads,
      totalRevenue,
      avgRate,
      avgRatePerMile,
      totalMiles,
      otd,
      deliveredLoads: deliveredLoads.length,
      inTransit: carrierLoads.filter(l => l.status === 'in_transit').length,
      dispatched: carrierLoads.filter(l => l.status === 'dispatched').length,
      firstLoad,
      lastLoad
    };
  }, [carrierLoads]);

  // Lane Analysis - group by origin → destination
  const laneAnalysis = useMemo(() => {
    const lanes = {};
    carrierLoads.forEach(load => {
      const laneKey = `${load.origin_city}, ${load.origin_state} → ${load.destination_city}, ${load.destination_state}`;
      if (!lanes[laneKey]) {
        lanes[laneKey] = {
          lane: laneKey,
          count: 0,
          totalRevenue: 0,
          avgRate: 0,
          loads: []
        };
      }
      lanes[laneKey].count += 1;
      lanes[laneKey].totalRevenue += parseFloat(load.rate_paid_to_carrier) || 0;
      lanes[laneKey].loads.push(load);
    });

    // Calculate averages and sort by frequency
    return Object.values(lanes)
      .map(lane => ({
        ...lane,
        avgRate: (lane.totalRevenue / lane.count).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count);
  }, [carrierLoads]);

  // Monthly load trend
  const monthlyTrend = useMemo(() => {
    const months = {};
    carrierLoads.forEach(load => {
      const month = new Date(load.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!months[month]) {
        months[month] = { month, loads: 0, revenue: 0 };
      }
      months[month].loads += 1;
      months[month].revenue += parseFloat(load.rate_paid_to_carrier) || 0;
    });
    return Object.values(months).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [carrierLoads]);

  // Filtered and sorted loads
  const filteredLoads = useMemo(() => {
    let filtered = [...carrierLoads];

    // Search filter
    if (searchLoad) {
      filtered = filtered.filter(l => 
        l.load_number?.toLowerCase().includes(searchLoad.toLowerCase()) ||
        l.origin_city?.toLowerCase().includes(searchLoad.toLowerCase()) ||
        l.destination_city?.toLowerCase().includes(searchLoad.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(l => new Date(l.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(l => new Date(l.created_at) <= new Date(dateRange.end));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'rate_paid_to_carrier') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortField === 'created_at' || sortField === 'scheduled_delivery_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [carrierLoads, searchLoad, statusFilter, dateRange, sortField, sortDirection]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Load #', 'Date', 'Origin', 'Destination', 'Status', 'Rate', 'Miles', 'RPM'];
    const rows = filteredLoads.map(l => [
      l.load_number,
      new Date(l.created_at).toLocaleDateString(),
      `${l.origin_city}, ${l.origin_state}`,
      `${l.destination_city}, ${l.destination_state}`,
      l.status,
      `$${parseFloat(l.rate_paid_to_carrier || 0).toFixed(2)}`,
      l.miles || '',
      l.miles ? `$${(parseFloat(l.rate_paid_to_carrier || 0) / parseFloat(l.miles)).toFixed(2)}` : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${carrier.name.replace(/\s+/g, '_')}_loads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#003366] rounded-lg flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{carrier.name}</h2>
              <p className="text-sm text-gray-500">MC# {carrier.mc_number || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'loads', label: `Loads (${metrics.totalLoads})`, icon: Package },
            { id: 'lanes', label: `Lanes (${laneAnalysis.length})`, icon: MapPin },
            { id: 'analytics', label: 'Analytics', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-[#003366] text-[#003366]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalLoads}</p>
                  <p className="text-xs text-gray-600">Loads</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Total Paid</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">Average</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${metrics.avgRate}</p>
                  <p className="text-xs text-gray-600">Per Load</p>
                </div>

                <div className={`bg-gradient-to-br ${
                  metrics.otd >= 90 ? 'from-emerald-50 to-emerald-100 border-emerald-200' :
                  metrics.otd >= 70 ? 'from-amber-50 to-amber-100 border-amber-200' :
                  'from-red-50 to-red-100 border-red-200'
                } rounded-lg p-4 border`}>
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className={`w-5 h-5 ${
                      metrics.otd >= 90 ? 'text-emerald-600' :
                      metrics.otd >= 70 ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                    <span className={`text-xs font-medium ${
                      metrics.otd >= 90 ? 'text-emerald-600' :
                      metrics.otd >= 70 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>On-Time</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    metrics.otd >= 90 ? 'text-emerald-600' :
                    metrics.otd >= 70 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{metrics.otd}%</p>
                  <p className="text-xs text-gray-600">Delivery</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Avg Rate/Mile</p>
                  <p className="text-xl font-bold text-gray-900">${metrics.avgRatePerMile}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Total Miles</p>
                  <p className="text-xl font-bold text-gray-900">{metrics.totalMiles.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">In Transit</p>
                  <p className="text-xl font-bold text-gray-900">{metrics.inTransit}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#003366]" />
                  Relationship Timeline
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-500">First Load</p>
                    <p className="font-medium text-gray-900">
                      {metrics.firstLoad ? metrics.firstLoad.toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                  <div>
                    <p className="text-gray-500">Most Recent</p>
                    <p className="font-medium text-gray-900">
                      {metrics.lastLoad ? metrics.lastLoad.toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Days Active</p>
                    <p className="font-medium text-gray-900">
                      {metrics.firstLoad && metrics.lastLoad 
                        ? Math.ceil((metrics.lastLoad - metrics.firstLoad) / (1000 * 60 * 60 * 24))
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {(carrier.contact_phone || carrier.contact_email || (carrier.city && carrier.state)) && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {carrier.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{carrier.contact_phone}</span>
                      </div>
                    )}
                    {carrier.city && carrier.state && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{carrier.city}, {carrier.state}</span>
                      </div>
                    )}
                    {carrier.safety_rating && carrier.safety_rating !== 'None' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className={`w-4 h-4 ${
                          carrier.safety_rating === 'Satisfactory' ? 'text-green-500' :
                          carrier.safety_rating === 'Conditional' ? 'text-amber-500' :
                          'text-red-500'
                        }`} />
                        <span className={`${
                          carrier.safety_rating === 'Satisfactory' ? 'text-green-600' :
                          carrier.safety_rating === 'Conditional' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          Safety Rating: {carrier.safety_rating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'loads' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search loads..."
                      value={searchLoad}
                      onChange={(e) => setSearchLoad(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              {/* Loads Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSortField('load_number');
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            }}>
                          Load # {sortField === 'load_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSortField('created_at');
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            }}>
                          Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Route
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSortField('rate_paid_to_carrier');
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            }}>
                          Rate {sortField === 'rate_paid_to_carrier' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
                      {filteredLoads.map((load) => (
                <tr key={load.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {load.load_number}
                  </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(load.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center gap-1">
                              <span>{load.origin_city}, {load.origin_state}</span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span>{load.destination_city}, {load.destination_state}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              load.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              load.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {load.status.replace('_', ' ')}
                    </span>
                  </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ${parseFloat(load.rate_paid_to_carrier || 0).toLocaleString()}
                  </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredLoads.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-400">No loads found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lanes' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Lane Analysis:</strong> Shows the most frequently traveled routes for this carrier with average rates.
                </p>
              </div>

              <div className="grid gap-4">
                {laneAnalysis.map((lane, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{lane.lane}</p>
                          <p className="text-xs text-gray-500">{lane.count} {lane.count === 1 ? 'load' : 'loads'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#003366]">${parseFloat(lane.avgRate).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Avg Rate</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">Total: <strong>${lane.totalRevenue.toLocaleString()}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Frequency: <strong>{((lane.count / metrics.totalLoads) * 100).toFixed(1)}%</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {laneAnalysis.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-400">No lane data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#003366]" />
                  Load Volume Over Time
                </h4>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="loads" stroke="#003366" fill="#003366" fillOpacity={0.6} name="Loads" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-12">No trend data available</p>
                )}
              </div>

              {/* Revenue Trend Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Revenue Over Time
                </h4>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-12">No revenue data available</p>
                )}
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Load Status Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-3xl font-bold text-amber-600">{metrics.dispatched}</p>
                    <p className="text-sm text-gray-600 mt-1">Dispatched</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-3xl font-bold text-blue-600">{metrics.inTransit}</p>
                    <p className="text-sm text-gray-600 mt-1">In Transit</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-3xl font-bold text-green-600">{metrics.deliveredLoads}</p>
                    <p className="text-sm text-gray-600 mt-1">Delivered</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Customers Page
function CustomersPage({ customers, loads, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState('');

  const customerStats = useMemo(() => {
    return customers.map(customer => {
      const customerLoads = loads.filter(l => l.customer_name === customer.name);
      const totalRevenue = customerLoads.reduce((sum, l) => sum + (parseFloat(l.rate_billed_to_customer) || 0), 0);
      
      return {
        ...customer,
        totalLoads: customerLoads.length,
        totalRevenue
      };
    });
  }, [customers, loads]);

  const filteredCustomers = customerStats.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const saveCustomer = async (data) => {
    // Sanitize all input data
    const sanitizedData = sanitizeFormData(data);
    
    if (editingCustomer) {
      const { error } = await supabase.from('customers').update(sanitizedData).eq('id', editingCustomer.id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Customer updated', 'success');
        onRefresh();
        setShowForm(false);
        setEditingCustomer(null);
      }
    } else {
      const { error } = await supabase.from('customers').insert([sanitizedData]);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Customer added', 'success');
        onRefresh();
        setShowForm(false);
      }
    }
  };

  const deleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Customer deleted', 'success');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg w-64"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg hover:opacity-90 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.contact_name || 'No contact'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingCustomer(customer); setShowForm(true); }}
                  className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCustomer(customer.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Total Loads</p>
                <p className="text-xl font-bold text-gray-900">{customer.totalLoads}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Revenue</p>
                <p className="text-xl font-bold text-emerald-600">${customer.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400">No customers found</p>
        </div>
      )}

      {showForm && (
        <CustomerFormModal 
          customer={editingCustomer}
          onClose={() => { setShowForm(false); setEditingCustomer(null); }} 
          onSubmit={saveCustomer} 
        />
      )}
    </div>
  );
}

// Customer Form Modal
function CustomerFormModal({ customer, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    contact_name: customer?.contact_name || '',
    contact_phone: customer?.contact_phone || '',
    contact_email: customer?.contact_email || '',
    address: customer?.address || ''
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">{customer ? 'Edit Customer' : 'Add Customer'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-4">
          <input
            type="text"
            required
            placeholder="Customer Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
          />
          <input
            type="text"
            placeholder="Contact Name"
            value={formData.contact_name}
            onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
          />
          <input
            type="tel"
            placeholder="Contact Phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
          />
          <input
            type="email"
            placeholder="Contact Email"
            value={formData.contact_email}
            onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
          />
          <textarea
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
            rows={2}
          />
          <button
            type="submit"
            className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg font-semibold"
          >
            {customer ? 'Update Customer' : 'Add Customer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Analytics Page
function AnalyticsPage({ loads, carriers, customers }) {
  const monthlyData = useMemo(() => {
    const months = {};
    loads.forEach(load => {
      const date = new Date(load.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { month: key, loads: 0, revenue: 0, margin: 0 };
      }
      months[key].loads++;
      months[key].revenue += parseFloat(load.rate_billed_to_customer) || 0;
      months[key].margin += (parseFloat(load.rate_billed_to_customer) || 0) - (parseFloat(load.rate_paid_to_carrier) || 0);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [loads]);

  const topCarriers = useMemo(() => {
    return calculateCarrierPerformance(loads).sort((a, b) => b.loads - a.loads).slice(0, 5);
  }, [loads]);

  const topCustomers = useMemo(() => {
    const customerMap = {};
    loads.forEach(load => {
      if (!customerMap[load.customer_name]) {
        customerMap[load.customer_name] = { name: load.customer_name, loads: 0, revenue: 0 };
      }
      customerMap[load.customer_name].loads++;
      customerMap[load.customer_name].revenue += parseFloat(load.rate_billed_to_customer) || 0;
    });
    return Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [loads]);

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-6">Revenue & Margin Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            <Area type="monotone" dataKey="margin" name="Margin" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Carriers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-6">Top Carriers by Volume</h3>
          <div className="space-y-4">
            {topCarriers.map((carrier, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{carrier.carrier}</span>
                    <span className="text-sm text-gray-500">{carrier.loads} loads</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#003366] rounded-full"
                      style={{ width: `${(carrier.loads / (topCarriers[0]?.loads || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {topCarriers.length === 0 && <p className="text-gray-400 text-center py-8">No data yet</p>}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-6">Top Customers by Revenue</h3>
          <div className="space-y-4">
            {topCustomers.map((customer, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-sm text-emerald-600 font-medium">${customer.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${(customer.revenue / (topCustomers[0]?.revenue || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-gray-400 text-center py-8">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Page (Super Admin Only)
function UsersPage({ isSuperAdmin, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Fetch users error:', error);
      } else {
        console.log('Fetched users:', data?.length, data);
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Fetch users exception:', err);
    }
    setLoading(false);
  };

  const updateUserStatus = async (userId, status) => {
    try {
    const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);
      
      if (error) {
        console.error('Update error:', error);
        showToast(`Failed to update user: ${error.message}`, 'error');
      } else {
        showToast(`User ${status}`, 'success');
        await fetchUsers(); // Re-fetch to update UI
      }
    } catch (err) {
      console.error('Catch error:', err);
      showToast('An unexpected error occurred', 'error');
    }
  };

  const updateRole = async (userId, role) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) {
        console.error('Role update error:', error);
        showToast(error.message, 'error');
      } else {
        showToast('Role updated', 'success');
        await fetchUsers(); // Re-fetch to update UI
      }
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user? They will lose all access immediately.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId);
      
      if (error) {
        console.error('Suspend error:', error);
        showToast(`Failed to suspend user: ${error.message}`, 'error');
      } else {
        showToast('User suspended', 'success');
        await fetchUsers(); // Re-fetch to update UI
      }
    } catch (err) {
      showToast('Failed to suspend user', 'error');
    }
  };

  const hardDeleteUser = async (userId) => {
    if (!window.confirm('CRITICAL: Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Hard delete error:', error);
        showToast(`Failed to delete user: ${error.message}`, 'error');
      } else {
        showToast('User permanently deleted', 'success');
        await fetchUsers(); // Re-fetch to update UI
      }
    } catch (err) {
      showToast('Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-500">Manage user access and permissions ({users.length} users)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#003366] font-bold">
                      {u.full_name?.charAt(0) || u.email?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name || 'New User'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  </td>
                <td className="py-4 px-6">
                  {!u.is_super_admin ? (
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                    </select>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-700">
                      Super Admin
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                    u.status === 'active' ? 'bg-green-100 text-green-700' : 
                    u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.status}
                    </span>
                  </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {u.status === 'pending' && (
                      <button
                        onClick={() => updateUserStatus(u.id, 'active')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {u.status === 'active' && !u.is_super_admin && (
                      <button
                        onClick={() => updateUserStatus(u.id, 'suspended')}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Suspend"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {u.status === 'suspended' && (
                      <button
                        onClick={() => updateUserStatus(u.id, 'active')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {!u.is_super_admin && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {!u.is_super_admin && u.status === 'suspended' && (
                      <button
                        onClick={() => hardDeleteUser(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Permanent Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-8 text-center text-gray-500">Loading users...</div>}
      </div>

      {showInviteModal && (
        <InviteUserModal 
          onClose={() => setShowInviteModal(false)} 
          onSuccess={() => { fetchUsers(); setShowInviteModal(false); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function InviteUserModal({ onClose, onSuccess, showToast }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Calling Edge Function with:', { email, fullName, role });
      
      // Call Edge Function to create user with admin API
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: sanitizeInput(email.toLowerCase()),
          fullName: sanitizeInput(fullName),
          password: password,
          role: role
        }
      });

      console.log('Edge Function full response:', { data, error });

      if (error) {
        console.error('Edge Function error details:', {
          message: error.message,
          context: error.context,
          status: error.status,
          full: error
        });
        // Show the actual error message from the function
        const errorMsg = error.context?.body?.error || error.message || 'Unknown error';
        throw new Error(errorMsg);
      }

      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Success! User created:', data);
      showToast(data.message || `User created! Email: ${email}, Password: ${password}`, 'success');
      onSuccess();
    } catch (error) {
      console.error('User creation error:', error);
      showToast(error.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Create New User</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            />
            <p className="text-xs text-gray-500 mt-1">User can change this password later in Settings</p>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-3 rounded-lg font-semibold hover:bg-[#002244] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Settings Page
function SettingsPage({ profile, showToast }) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const updateProfile = async () => {
    setLoading(true);
    // Sanitize the name input
    const sanitizedName = sanitizeInput(fullName);
    const { error } = await supabase.from('profiles').update({ full_name: sanitizedName }).eq('id', profile.id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Profile updated', 'success');
    }
    setLoading(false);
  };

  const changePassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    
    // Check password strength using centralized validation
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      showToast(`Password must include: ${passwordErrors.join(', ')}`, 'error');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Password changed successfully!', 'success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      showToast('Failed to change password', 'error');
    }
    
    setPasswordLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-6">Profile Settings</h3>
        <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={profile?.role || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 capitalize"
            />
          </div>
          <button
            onClick={updateProfile}
            disabled={loading}
            className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-2">Change Password</h3>
        <p className="text-sm text-gray-500 mb-6">
          Password must be at least 8 characters with uppercase, lowercase, and a number.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>
          
          {/* Password strength indicator */}
          {newPassword && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Password Strength:</p>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${newPassword.length >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  8+ chars
                </span>
                <span className={`text-xs px-2 py-1 rounded ${/[A-Z]/.test(newPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  Uppercase
                </span>
                <span className={`text-xs px-2 py-1 rounded ${/[a-z]/.test(newPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  Lowercase
                </span>
                <span className={`text-xs px-2 py-1 rounded ${/[0-9]/.test(newPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  Number
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPasswords"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
            />
            <label htmlFor="showPasswords" className="text-sm text-gray-600">Show passwords</label>
          </div>
          
          <button
            onClick={changePassword}
            disabled={passwordLoading || !newPassword || !confirmPassword}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-700">Security Tips</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>Use a unique password that you don't use on other sites</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>Consider using a password manager</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>Change your password periodically</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>Never share your password with anyone</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// RFQ Management Page
function RFQPage({ rfqs, carriers, customers, facilities, onRefresh, showToast, currentUser }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingRFQ, setViewingRFQ] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.rfq_name.toLowerCase().includes(search.toLowerCase()) ||
                         rfq.rfq_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (viewingRFQ) {
    return (
      <RFQDetailsView 
        rfq={viewingRFQ} 
        carriers={carriers}
        facilities={facilities}
        onBack={() => setViewingRFQ(null)} 
        onRefresh={onRefresh}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage Request for Quotes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              downloadWalmartTemplate();
              showToast('Walmart template downloaded!', 'success');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Walmart Template
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New RFQ
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total RFQs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{rfqs.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {rfqs.filter(r => r.status === 'sent' || r.status === 'in_review').length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Bids</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {rfqs.reduce((sum, r) => sum + (r.total_responses || 0), 0)}
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Awarded</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {rfqs.filter(r => r.status === 'awarded').length}
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search RFQs by name or number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="in_review">In Review</option>
            <option value="awarded">Awarded</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* RFQ List */}
      <div className="space-y-4">
        {filteredRFQs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No RFQs found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first RFQ</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create RFQ
            </button>
          </div>
        ) : (
          filteredRFQs.map((rfq) => (
            <RFQCard 
              key={rfq.id} 
              rfq={rfq} 
              onClick={() => setViewingRFQ(rfq)}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* Create RFQ Modal */}
      {showCreateForm && (
        <CreateRFQModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            onRefresh();
            showToast('RFQ created successfully!', 'success');
          }}
          customers={customers}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// RFQ Card Component
function RFQCard({ rfq, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-50 text-blue-700',
      in_review: 'bg-amber-50 text-amber-700',
      awarded: 'bg-green-50 text-green-700',
      closed: 'bg-gray-100 text-gray-500',
      cancelled: 'bg-red-50 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const daysUntilDeadline = Math.ceil((rfq.days_until_deadline || 0) / 24);
  const isUrgent = daysUntilDeadline > 0 && daysUntilDeadline <= 3;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#003366] hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{rfq.rfq_name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
              {rfq.status.replace('_', ' ').toUpperCase()}
            </span>
            {isUrgent && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Due Soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">RFQ #{rfq.rfq_number}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Lanes</p>
              <p className="font-semibold text-gray-900">{rfq.total_lanes || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Responses</p>
              <p className="font-semibold text-gray-900">{rfq.total_responses || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Awarded</p>
              <p className="font-semibold text-gray-900">{rfq.total_awarded || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Deadline</p>
              <p className="font-semibold text-gray-900">
                {rfq.response_deadline ? new Date(rfq.response_deadline).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
      </div>
    </div>
  );
}

// Create RFQ Modal
function CreateRFQModal({ onClose, onSuccess, customers, currentUser, showToast }) {
  const [formData, setFormData] = useState({
    rfq_name: '',
    customer_id: '',
    valid_from: '',
    valid_until: '',
    response_deadline: '',
    description: '',
    special_requirements: '',
    insurance_required: 100000
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('rfq_requests')
        .insert([{
          ...formData,
          status: 'draft',
          created_by: currentUser?.id
        }])
        .select()
        .single();

      if (error) throw error;

      showToast('RFQ created successfully!', 'success');
      onSuccess(data);
    } catch (error) {
      console.error('Error creating RFQ:', error);
      showToast('Failed to create RFQ: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New RFQ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* RFQ Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFQ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.rfq_name}
              onChange={(e) => setFormData({...formData, rfq_name: e.target.value})}
              placeholder="e.g., Walmart Q1 2026 Lanes"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
              required
            />
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer (Optional)
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                required
              />
            </div>
          </div>

          {/* Response Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.response_deadline}
              onChange={(e) => setFormData({...formData, response_deadline: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
              required
            />
          </div>

          {/* Insurance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo Insurance Required ($)
            </label>
            <input
              type="number"
              value={formData.insurance_required}
              onChange={(e) => setFormData({...formData, insurance_required: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="Brief description of this RFQ..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requirements
            </label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
              rows={4}
              placeholder="e.g., Food grade equipment, fumigated, temperature controlled..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// RFQ Details View Component
function RFQDetailsView({ rfq, carriers, facilities, onBack, onRefresh, showToast }) {
  const [lanes, setLanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [activeTab, setActiveTab] = useState('lanes');
  const [showAddBid, setShowAddBid] = useState(null); // lane to add bid for
  const [showImportBids, setShowImportBids] = useState(false);
  const [bids, setBids] = useState([]);

  const fetchLanes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vw_rfq_lanes_with_stats')
      .select('*')
      .eq('rfq_id', rfq.id)
      .order('lane_number');
    
    if (data) setLanes(data);
    setLoading(false);
  }, [rfq.id]);

  const fetchBids = useCallback(async () => {
    const { data } = await supabase
      .from('vw_bid_comparison')
      .select('*')
      .eq('rfq_id', rfq.id)
      .order('lane_number', { ascending: true })
      .order('rank', { ascending: true });
    
    if (data) setBids(data);
  }, [rfq.id]);

  useEffect(() => {
    fetchLanes();
    fetchBids();
  }, [fetchLanes, fetchBids]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 transform rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{rfq.rfq_name}</h1>
          <p className="text-sm text-gray-500">RFQ #{rfq.rfq_number}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportLanesToExcel(lanes, rfq.rfq_name)}
            disabled={lanes.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            onClick={() => setShowImportCSV(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import from Excel/CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Lanes</p>
          <p className="text-2xl font-bold text-gray-900">{lanes.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Bids</p>
          <p className="text-2xl font-bold text-gray-900">{bids.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Awarded</p>
          <p className="text-2xl font-bold text-gray-900">{rfq.total_awarded || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Deadline</p>
          <p className="text-sm font-bold text-gray-900">
            {rfq.response_deadline ? new Date(rfq.response_deadline).toLocaleDateString() : 'Not set'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('lanes')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'lanes'
                  ? 'border-[#003366] text-[#003366]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lanes ({lanes.length})
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'bids'
                  ? 'border-[#003366] text-[#003366]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bid Comparison ({bids.length} bids)
            </button>
            <button
              onClick={() => setActiveTab('awarded')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'awarded'
                  ? 'border-[#003366] text-[#003366]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Awarded ({lanes.filter(l => l.status === 'awarded').length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'lanes' && (
            <LanesTabContent 
              lanes={lanes}
              loading={loading}
              onAddBid={(lane) => setShowAddBid(lane)}
              onImport={() => setShowImportCSV(true)}
              onImportBids={() => setShowImportBids(true)}
              rfqName={rfq.rfq_name}
            />
          )}
          
          {activeTab === 'bids' && (
            <BidComparisonTab
              lanes={lanes}
              bids={bids}
              onAddBid={(lane) => setShowAddBid(lane)}
              onImportBids={() => setShowImportBids(true)}
              rfqName={rfq.rfq_name}
              onAwardLane={async (laneId, bidId) => {
                // Award lane logic
                const { error } = await supabase
                  .from('rfq_lanes')
                  .update({
                    status: 'awarded',
                    awarded_bid_id: bidId,
                    awarded_at: new Date().toISOString()
                  })
                  .eq('id', laneId);

                if (!error) {
                  showToast('Lane awarded successfully!', 'success');
                  fetchLanes();
                  fetchBids();
                  onRefresh();
                } else {
                  showToast('Failed to award lane: ' + error.message, 'error');
                }
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'awarded' && (
            <AwardedLanesTab
              lanes={lanes.filter(l => l.status === 'awarded')}
              bids={bids}
            />
          )}
        </div>
      </div>


      {/* Import CSV Modal */}
      {showImportCSV && (
        <ImportLanesCSVModal
          rfqId={rfq.id}
          onClose={() => setShowImportCSV(false)}
          onSuccess={() => {
            setShowImportCSV(false);
            fetchLanes();
            fetchBids();
            onRefresh();
            showToast('Lanes imported successfully!', 'success');
          }}
          showToast={showToast}
        />
      )}

      {/* Add Bid Modal */}
      {showAddBid && (
        <AddBidModal
          lane={showAddBid}
          rfqId={rfq.id}
          carriers={carriers}
          onClose={() => setShowAddBid(null)}
          onSuccess={() => {
            setShowAddBid(null);
            fetchBids();
            onRefresh();
            showToast('Bid added successfully!', 'success');
          }}
          showToast={showToast}
        />
      )}

      {/* Import Bids Modal */}
      {showImportBids && (
        <ImportBidsModal
          rfqId={rfq.id}
          lanes={lanes}
          carriers={carriers}
          rfqName={rfq.rfq_name}
          onClose={() => setShowImportBids(false)}
          onSuccess={() => {
            setShowImportBids(false);
            fetchBids();
            onRefresh();
            showToast('Bids imported successfully!', 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// Lanes Tab Content
function LanesTabContent({ lanes, loading, onAddBid, onImport, onImportBids, rfqName }) {
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading lanes...</div>;
  }

  if (lanes.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No lanes yet</h3>
        <p className="text-gray-500 mb-6">Import lanes from Excel to get started</p>
        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Lanes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Import Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{lanes.length} lanes • {lanes.reduce((sum, l) => sum + (l.bids_received || 0), 0)} total bids</p>
        <button
          onClick={onImportBids}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Carrier Bids from Excel
        </button>
      </div>

      <div className="space-y-2">
        {lanes.map((lane) => (
          <div key={lane.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#003366] transition-colors">
            <div className="bg-gray-100 px-3 py-1 rounded-lg">
              <span className="text-sm font-bold text-gray-900">#{lane.lane_number}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{lane.origin} → {lane.destination}</p>
              <p className="text-sm text-gray-500">{lane.equipment_type} • {lane.commodity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Volume</p>
              <p className="font-semibold text-gray-900">{lane.annual_volume}/yr</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Miles</p>
              <p className="font-semibold text-gray-900">{lane.estimated_miles}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Bids</p>
              <p className="font-semibold text-gray-900">{lane.bids_received || 0}</p>
            </div>
            <button
              onClick={() => onAddBid(lane)}
              className="px-3 py-1.5 text-sm bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              + Add Bid
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bid Comparison Tab
function BidComparisonTab({ lanes, bids, onAddBid, onImportBids, rfqName, onAwardLane, showToast }) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bids yet</h3>
        <p className="text-gray-500 mb-6">Add carrier bids to compare pricing</p>
        <div className="flex gap-3 justify-center">
          {lanes.length > 0 && (
            <button
              onClick={() => onAddBid(lanes[0])}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Bid
            </button>
          )}
          <button
            onClick={onImportBids}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import from Excel
          </button>
        </div>
      </div>
    );
  }

  // Group bids by lane
  const bidsByLane = {};
  bids.forEach(bid => {
    if (!bidsByLane[bid.lane_number]) {
      bidsByLane[bid.lane_number] = [];
    }
    bidsByLane[bid.lane_number].push(bid);
  });

  return (
    <div className="space-y-6">
      {Object.entries(bidsByLane).map(([laneNumber, laneBids]) => {
        const lane = lanes.find(l => l.lane_number === parseInt(laneNumber));
        if (!lane) return null;

        return (
          <div key={laneNumber} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Lane Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Lane #{laneNumber}: {lane.origin} → {lane.destination}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {lane.equipment_type} • {lane.commodity} • {lane.estimated_miles} miles • {lane.annual_volume} loads/yr
                  </p>
                </div>
                <button
                  onClick={() => onAddBid(lane)}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  + Add Bid
                </button>
              </div>
            </div>

            {/* Bids Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">$/Mile</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transit (Days)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">vs Avg</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {laneBids.map((bid) => (
                    <tr key={bid.id} className={bid.is_awarded ? 'bg-green-50' : bid.rank === 1 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            bid.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            bid.rank === 2 ? 'bg-gray-100 text-gray-700' :
                            'bg-white text-gray-600'
                          }`}>
                            #{bid.rank}
                          </span>
                          {bid.is_lowest_bid && <Award className="w-4 h-4 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{bid.carrier_name}</div>
                        <div className="text-xs text-gray-500">MC: {bid.mc_number}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">
                          ${bid.rate_per_load?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-900">${bid.rate_per_mile?.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-700">
                          {bid.transit_time_hours ? (bid.transit_time_hours / 24).toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${
                          bid.vs_average_pct < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {bid.vs_average_pct > 0 ? '+' : ''}{bid.vs_average_pct?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {bid.is_awarded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Awarded
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!bid.is_awarded && (
                          <button
                            onClick={() => onAwardLane(lane.id, bid.id)}
                            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                          >
                            Award
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Lowest Bid:</span>
                <span className="ml-2 font-semibold text-green-600">
                  ${laneBids[0]?.rate_per_load?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Highest Bid:</span>
                <span className="ml-2 font-semibold text-red-600">
                  ${laneBids[laneBids.length - 1]?.rate_per_load?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Average:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  ${(laneBids.reduce((sum, b) => sum + b.rate_per_load, 0) / laneBids.length).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Savings:</span>
                <span className="ml-2 font-semibold text-green-600">
                  ${((laneBids[laneBids.length - 1]?.rate_per_load || 0) - (laneBids[0]?.rate_per_load || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Awarded Lanes Tab
function AwardedLanesTab({ lanes, bids }) {
  if (lanes.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No awarded lanes yet</h3>
        <p className="text-gray-500">Award lanes from the Bid Comparison tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lanes.map((lane) => {
        const awardedBid = bids.find(b => b.id === lane.awarded_bid_id);
        
        return (
          <div key={lane.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    Lane #{lane.lane_number}: {lane.origin} → {lane.destination}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {lane.equipment_type} • {lane.commodity} • {lane.estimated_miles} miles
                </p>
                {awardedBid && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Awarded To</p>
                        <p className="font-semibold text-gray-900">{awardedBid.carrier_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Rate</p>
                        <p className="font-semibold text-gray-900">${awardedBid.rate_per_load?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">$/Mile</p>
                        <p className="font-semibold text-gray-900">${awardedBid.rate_per_mile?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Annual Value</p>
                        <p className="font-semibold text-green-600">
                          ${((awardedBid.rate_per_load || 0) * (lane.annual_volume || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Award Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Lanes Awarded</p>
            <p className="text-2xl font-bold text-gray-900">{lanes.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Annual Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${lanes.reduce((sum, lane) => {
                const bid = bids.find(b => b.id === lane.awarded_bid_id);
                return sum + ((bid?.rate_per_load || 0) * (lane.annual_volume || 0));
              }, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Rate/Mile</p>
            <p className="text-2xl font-bold text-gray-900">
              ${(lanes.reduce((sum, lane) => {
                const bid = bids.find(b => b.id === lane.awarded_bid_id);
                return sum + (bid?.rate_per_mile || 0);
              }, 0) / lanes.length).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import Bids Modal (Bulk Import from Excel)
function ImportBidsModal({ rfqId, lanes, carriers, rfqName, onClose, onSuccess, showToast }) {
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [parsedBids, setParsedBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importProgress, setImportProgress] = useState(0);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find the bid sheet (either 'Bid Sheet' or the first sheet)
        const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('bid')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        parseBidsFromExcel(jsonData);
      } catch (error) {
        showToast('Error reading Excel file: ' + error.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseBidsFromExcel = (jsonData) => {
    const bids = jsonData
      .map(row => {
        const laneNumber = row['Lane #'] || row['Lane'] || row['Lane Number'];
        const rate = parseFloat(row['Rate (Your Quote)'] || row['Rate'] || row['Your Rate'] || 0);
        const transitDays = parseFloat(row['Transit Time (days)'] || row['Transit Time'] || row['Transit'] || 0);
        const transitHours = transitDays > 0 ? Math.round(transitDays * 24) : null;
        const maxWeight = parseInt(row['Max Weight (lbs)'] || row['Max Weight'] || row['Weight'] || 45000);
        const notes = row['Notes'] || row['Carrier Notes'] || '';

        // Find matching lane
        const lane = lanes.find(l => l.lane_number === laneNumber);
        if (!lane || !rate || rate <= 0) return null;

        const ratePerMile = lane.estimated_miles > 0 ? rate / lane.estimated_miles : 0;

        return {
          lane_number: laneNumber,
          lane_id: lane.id,
          rate_per_load: rate,
          rate_per_mile: ratePerMile,
          transit_time_hours: transitHours,
          transit_time_days: transitDays,
          max_weight: maxWeight,
          carrier_notes: notes,
          // Display info
          origin: lane.origin,
          destination: lane.destination,
          miles: lane.estimated_miles
        };
      })
      .filter(bid => bid !== null);

    setParsedBids(bids);
    if (bids.length > 0) {
      showToast(`Parsed ${bids.length} bids from Excel`, 'success');
    } else {
      showToast('No valid bids found in Excel. Make sure "Rate (Your Quote)" column is filled.', 'warning');
    }
  };

  const handleImport = async () => {
    if (!selectedCarrier) {
      showToast('Please select a carrier', 'warning');
      return;
    }

    if (parsedBids.length === 0) {
      showToast('No bids to import', 'warning');
      return;
    }

    setLoading(true);
    setImportProgress(10);
    
    try {
      const bidsForImport = parsedBids.map(bid => ({
        lane_number: bid.lane_number,
        rate_per_load: bid.rate_per_load,
        rate_per_mile: bid.rate_per_mile,
        transit_time_hours: bid.transit_time_hours,
        max_weight: bid.max_weight || 0,
        carrier_notes: bid.carrier_notes || ''
      }));

      setImportProgress(20);

      // Try the simple bulk import RPC first
      let result = await supabase.rpc('simple_bulk_import_bids', {
        p_rfq_id: rfqId,
        p_carrier_id: selectedCarrier,
        p_bids: bidsForImport
      });

      setImportProgress(60);

      // Check if RPC worked
      if (result.error) {
        console.warn('RPC import failed, trying fallback method:', result.error);
        
        // Fallback: Insert one at a time with delays
        let imported = 0;
        for (const bid of parsedBids) {
          const { error: insertError } = await supabase
            .from('rfq_bids')
            .insert({
              rfq_id: rfqId,
              rfq_lane_id: bid.lane_id,
              carrier_id: selectedCarrier,
              rate_per_load: bid.rate_per_load,
              rate_per_mile: bid.rate_per_mile,
              transit_time_hours: bid.transit_time_hours,
              max_weight: bid.max_weight || 0,
              carrier_notes: bid.carrier_notes || '',
              status: 'submitted'
            });

          if (insertError) {
            console.error('Failed to insert bid:', insertError);
            continue;
          }

          imported++;
          setImportProgress(60 + (imported / parsedBids.length) * 30);
          
          // Small delay to avoid trigger issues
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        setImportProgress(90);

        // Manually update stats after fallback import
        await supabase.rpc('update_rfq_stats_manual', { p_rfq_id: rfqId });

        showToast(`Imported ${imported} of ${parsedBids.length} bids`, imported === parsedBids.length ? 'success' : 'warning');
      } else {
        // RPC worked!
        const responseData = result.data;
        setImportProgress(90);

        // Update stats manually
        await supabase.rpc('update_rfq_stats_manual', { p_rfq_id: rfqId });

        setImportProgress(100);

        if (responseData && responseData.success) {
          showToast(responseData.message || 'Bids imported successfully!', 'success');
        } else {
          showToast(responseData.message || 'Import completed with warnings', 'warning');
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error importing bids:', error);
      showToast('Failed to import bids: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setImportProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Import Carrier Bids from Excel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Send template to carriers</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download a bid template for carriers to fill out with their rates
                </p>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const carrier = carriers.find(c => c.id === e.target.value);
                        generateBidTemplate(lanes, rfqName, carrier.name);
                        showToast(`Template for ${carrier.name} downloaded!`, 'success');
                        e.target.value = '';
                      }
                    }}
                    className="text-sm px-3 py-1.5 border border-blue-300 rounded-lg bg-white"
                  >
                    <option value="">Select Carrier to Generate Template...</option>
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Select Carrier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which carrier is submitting these bids? <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option value="">Select carrier...</option>
              {carriers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mc_number ? `(MC: ${c.mc_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Upload File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Completed Bid Template
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
            {fileName && (
              <p className="text-xs text-green-600 mt-1">✓ {fileName} loaded</p>
            )}
          </div>

          {/* Parsed Bids Preview */}
          {parsedBids.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Parsed Bids ({parsedBids.length})
              </h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">Lane</th>
                      <th className="px-2 py-2 text-left">Route</th>
                      <th className="px-2 py-2 text-right">Rate</th>
                      <th className="px-2 py-2 text-right">$/Mile</th>
                      <th className="px-2 py-2 text-right">Transit (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedBids.map((bid, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-2 py-2">#{bid.lane_number}</td>
                        <td className="px-2 py-2">{bid.origin} → {bid.destination}</td>
                        <td className="px-2 py-2 text-right font-semibold">${bid.rate_per_load.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right">${bid.rate_per_mile.toFixed(2)}</td>
                        <td className="px-2 py-2 text-right">{bid.transit_time_days || '-'} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {loading && importProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Importing bids...</span>
                <span className="font-medium text-[#003366]">{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#003366] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || parsedBids.length === 0 || !selectedCarrier}
              className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50"
            >
              {loading ? `Importing... ${importProgress}%` : `Import ${parsedBids.length} Bids`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Bid Modal
function AddBidModal({ lane, rfqId, carriers, onClose, onSuccess, showToast }) {
  const [formData, setFormData] = useState({
    carrier_id: '',
    rate_per_load: '',
    transit_time_hours: '',
    max_weight: 45000,
    carrier_notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ratePerLoad = parseFloat(formData.rate_per_load);
      const ratePerMile = lane.estimated_miles > 0 ? ratePerLoad / lane.estimated_miles : 0;

      const { error } = await supabase
        .from('rfq_bids')
        .insert([{
          rfq_id: rfqId,
          rfq_lane_id: lane.id,
          carrier_id: formData.carrier_id,
          rate_per_load: ratePerLoad,
          rate_per_mile: ratePerMile,
          transit_time_hours: parseInt(formData.transit_time_hours),
          max_weight: parseInt(formData.max_weight),
          carrier_notes: formData.carrier_notes,
          status: 'submitted'
        }]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error adding bid:', error);
      showToast('Failed to add bid: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Bid for Lane #{lane.lane_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lane Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">{lane.origin} → {lane.destination}</p>
            <p className="text-sm text-gray-500 mt-1">
              {lane.equipment_type} • {lane.commodity} • {lane.estimated_miles} miles
            </p>
          </div>

          {/* Carrier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carrier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.carrier_id}
              onChange={(e) => setFormData({...formData, carrier_id: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
              required
            >
              <option value="">Select carrier...</option>
              {carriers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mc_number ? `(MC: ${c.mc_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate per Load <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate_per_load}
                  onChange={(e) => setFormData({...formData, rate_per_load: e.target.value})}
                  placeholder="2400.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  required
                />
              </div>
              {formData.rate_per_load && lane.estimated_miles > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  = ${(parseFloat(formData.rate_per_load) / lane.estimated_miles).toFixed(2)}/mile
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transit Time (days)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.transit_time_hours ? formData.transit_time_hours / 24 : ''}
                onChange={(e) => setFormData({...formData, transit_time_hours: parseFloat(e.target.value) * 24})}
                placeholder="1.5"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
              <p className="text-xs text-gray-500 mt-1">Enter transit time in days (e.g., 1.5 days = 36 hours)</p>
            </div>
          </div>

          {/* Max Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Weight (lbs)
            </label>
            <input
              type="number"
              value={formData.max_weight}
              onChange={(e) => setFormData({...formData, max_weight: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carrier Notes
            </label>
            <textarea
              value={formData.carrier_notes}
              onChange={(e) => setFormData({...formData, carrier_notes: e.target.value})}
              rows={3}
              placeholder="Any special conditions or notes from carrier..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Generate Bid Template for Carriers
const generateBidTemplate = (lanes, rfqName, carrierName = 'CARRIER_NAME') => {
  if (!lanes || lanes.length === 0) return;

  const templateData = lanes.map(lane => ({
    'Lane #': lane.lane_number,
    'Origin': lane.origin_city ? `${lane.origin_city}, ${lane.origin_state}` : lane.origin,
    'Destination': lane.destination_city ? `${lane.destination_city}, ${lane.destination_state}` : lane.destination,
    'Equipment': lane.equipment_type,
    'Commodity': lane.commodity,
    'Miles': lane.estimated_miles,
    'Annual Volume': lane.annual_volume,
    // Carrier fills these columns:
    'Rate (Your Quote)': '',
    'Transit Time (days)': '',
    'Max Weight (lbs)': 45000,
    'Notes': ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Lane #
    { wch: 20 }, // Origin
    { wch: 20 }, // Destination
    { wch: 20 }, // Equipment
    { wch: 20 }, // Commodity
    { wch: 10 }, // Miles
    { wch: 12 }, // Volume
    { wch: 15 }, // Rate (editable)
    { wch: 15 }, // Transit (editable)
    { wch: 15 }, // Weight (editable)
    { wch: 30 }  // Notes (editable)
  ];

  // Add instructions sheet
  const instructions = [
    ['RFQ Bid Template - Instructions'],
    [''],
    ['How to complete this template:'],
    ['1. Fill in the "Rate (Your Quote)" column with your rate per load for each lane'],
    ['2. Fill in "Transit Time (days)" - estimated transit time in days (e.g., 1.5 days)'],
    ['3. Update "Max Weight (lbs)" if different from 45,000 lbs'],
    ['4. Add any special notes or conditions in the "Notes" column'],
    ['5. Save this file and send back'],
    [''],
    ['DO NOT modify the Lane #, Origin, Destination, Equipment, Commodity, Miles, or Volume columns'],
    [''],
    [`Carrier: ${carrierName}`],
    [`RFQ: ${rfqName}`],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 100 }];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
  XLSX.utils.book_append_sheet(wb, ws, 'Bid Sheet');

  const filename = `${rfqName.replace(/[^a-z0-9]/gi, '_')}_Bid_Template_${carrierName.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// Export lanes to Excel
const exportLanesToExcel = (lanes, rfqName) => {
  if (!lanes || lanes.length === 0) return;

  // Prepare data for Excel
  const excelData = lanes.map(lane => ({
    'Lane #': lane.lane_number,
    'Origin City': lane.origin_city || lane.origin?.split(',')[0] || '',
    'Origin State': lane.origin_state || lane.origin?.split(',')[1]?.trim() || '',
    'Destination City': lane.destination_city || lane.destination?.split(',')[0] || '',
    'Destination State': lane.destination_state || lane.destination?.split(',')[1]?.trim() || '',
    'Equipment Type': lane.equipment_type,
    'Commodity': lane.commodity,
    'Annual Volume': lane.annual_volume,
    'Service Type': lane.service_type || 'Full Truckload',
    'Estimated Miles': lane.estimated_miles || '',
    'Temperature Min (F)': lane.temperature_min || '',
    'Temperature Max (F)': lane.temperature_max || '',
    'Special Instructions': lane.special_instructions || ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Lane #
    { wch: 15 }, // Origin City
    { wch: 12 }, // Origin State
    { wch: 15 }, // Destination City
    { wch: 15 }, // Destination State
    { wch: 20 }, // Equipment Type
    { wch: 20 }, // Commodity
    { wch: 12 }, // Annual Volume
    { wch: 20 }, // Service Type
    { wch: 12 }, // Miles
    { wch: 12 }, // Temp Min
    { wch: 12 }, // Temp Max
    { wch: 30 }  // Instructions
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'RFQ Lanes');

  // Generate filename
  const filename = `${rfqName.replace(/[^a-z0-9]/gi, '_')}_Lanes_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

// Generate Excel template with Walmart data
const downloadWalmartTemplate = () => {
  const walmartLanes = [
    { lane: 1, originCity: 'Wheeling', originState: 'IL', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Reefer", commodity: 'Frozen Pizza', volume: 2, miles: 1380, tempMin: -10, tempMax: 32 },
    { lane: 2, originCity: 'Perryville', originState: 'MO', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Cereal', volume: 2, miles: 1150 },
    { lane: 3, originCity: 'Perryville', originState: 'MO', destCity: 'Houston', destState: 'TX', equipment: "53' Trailer Dry", commodity: 'Cereal', volume: 2, miles: 900 },
    { lane: 4, originCity: 'Visalia', originState: 'CA', destCity: 'Houston', destState: 'TX', equipment: "53' Trailer Dry", commodity: 'Pet Food', volume: 2, miles: 1600 },
    { lane: 5, originCity: 'Visalia', originState: 'CA', destCity: 'Los Angeles', destState: 'CA', equipment: "53' Trailer Dry", commodity: 'Pet Food', volume: 2, miles: 200 },
    { lane: 6, originCity: 'Newnan', originState: 'GA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Snacks', volume: 8, miles: 650 },
    { lane: 7, originCity: 'Pleasant Prairie', originState: 'WI', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Dressing', volume: 6, miles: 1420 },
    { lane: 8, originCity: 'Cambria', originState: 'WI', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Canned Foods', volume: 60, miles: 1450 },
    { lane: 9, originCity: 'Atlanta', originState: 'GA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Canned Foods', volume: 12, miles: 660 },
    { lane: 10, originCity: 'Opelousas', originState: 'LA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Coco Oil', volume: 10, miles: 1100 },
    { lane: 11, originCity: 'Burlington', originState: 'IA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Cookies', volume: 6, miles: 1300 },
    { lane: 12, originCity: 'Charleston', originState: 'SC', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Clothes', volume: 4, miles: 550 },
    { lane: 13, originCity: 'St Ansgar', originState: 'IA', destCity: 'New Jersey', destState: 'NJ', equipment: "53' Trailer Dry", commodity: 'Oatmeal', volume: 10, miles: 1100 },
    { lane: 14, originCity: 'St Ansgar', originState: 'IA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Oatmeal', volume: 4, miles: 1400 },
    { lane: 15, originCity: 'La Grange', originState: 'GA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Aluminum Foil', volume: 12, miles: 600 },
    { lane: 16, originCity: 'Los Angeles', originState: 'CA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Clothes', volume: 4, miles: 2750 },
    { lane: 17, originCity: 'Elk Grove Village', originState: 'IL', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Reefer", commodity: 'Marshmallows', volume: 12, miles: 1380, tempMin: -10, tempMax: 32 },
    { lane: 18, originCity: 'Westerville', originState: 'OH', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Dry/Empty Cylinder', volume: 4, miles: 1150 },
    { lane: 19, originCity: 'Victorville', originState: 'CA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Childrens Products', volume: 2, miles: 2700 },
    { lane: 20, originCity: 'Carthage', originState: 'MO', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Reefer", commodity: 'Mozzarella Cheese/Chilled', volume: 80, miles: 1200, tempMin: -10, tempMax: 32 },
    { lane: 21, originCity: 'Bristol', originState: 'VA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Dry/Cookie-Snacks', volume: 20, miles: 900 },
    { lane: 22, originCity: 'Fowler', originState: 'CA', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Raisins', volume: 12, miles: 2800 },
    { lane: 23, originCity: 'New Jersey', originState: 'NJ', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'GDSM/Clothing', volume: 4, miles: 1280 },
    { lane: 24, originCity: 'Chesterfield', originState: 'MO', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Cards', volume: 4, miles: 1200 },
    { lane: 25, originCity: 'Victorville', originState: 'CA', destCity: 'Los Angeles', destState: 'CA', equipment: "53' Trailer Dry", commodity: 'Childrens Products', volume: 4, miles: 85 },
    { lane: 26, originCity: 'Greer', originState: 'SC', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Juice', volume: 8, miles: 620 },
    { lane: 27, originCity: 'El Paso', originState: 'TX', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Communication Equipment', volume: 4, miles: 1950 },
    { lane: 28, originCity: 'Spanish Fork', originState: 'UT', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Scented Oils & Diffusers', volume: 2, miles: 2200 },
    { lane: 29, originCity: 'Delaware', originState: 'OH', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Diapers', volume: 12, miles: 1150 },
    { lane: 30, originCity: 'Bedford Park', originState: 'IL', destCity: 'Miami', destState: 'FL', equipment: "53' Trailer Dry", commodity: 'Dry Cookies', volume: 8, miles: 1380 }
  ];

  const excelData = walmartLanes.map(lane => ({
    'Lane #': lane.lane,
    'Origin City': lane.originCity,
    'Origin State': lane.originState,
    'Destination City': lane.destCity,
    'Destination State': lane.destState,
    'Equipment Type': lane.equipment,
    'Commodity': lane.commodity,
    'Annual Volume': lane.volume,
    'Service Type': 'Single -Interstate Trucking',
    'Estimated Miles': lane.miles,
    'Temperature Min (F)': lane.tempMin || '',
    'Temperature Max (F)': lane.tempMax || '',
    'Special Instructions': ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  ws['!cols'] = [
    { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
    { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Walmart RFQ Lanes');
  XLSX.writeFile(wb, 'Walmart_Q1_2026_RFQ_Template.xlsx');
};

// Import Lanes from Excel/CSV Modal
function ImportLanesCSVModal({ rfqId, onClose, onSuccess, showToast }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedLanes, setParsedLanes] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // Convert Excel data to CSV text for preview
          const csvFromExcel = XLSX.utils.sheet_to_csv(firstSheet);
          setCsvText(csvFromExcel);
          
          // Auto-parse Excel data
          parseExcelData(jsonData);
        } catch (error) {
          showToast('Error reading Excel file: ' + error.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const parseExcelData = (jsonData) => {
    const lanes = jsonData.map((row, index) => ({
      lane_number: row['Lane #'] || index + 1,
      origin_city: row['Origin City'] || '',
      origin_state: row['Origin State'] || '',
      destination_city: row['Destination City'] || '',
      destination_state: row['Destination State'] || '',
      equipment_type: row['Equipment Type'] || '',
      commodity: row['Commodity'] || '',
      annual_volume: parseInt(row['Annual Volume']) || 0,
      service_type: row['Service Type'] || 'Full Truckload',
      estimated_miles: parseInt(row['Estimated Miles']) || 1000,
      temperature_min: row['Temperature Min (F)'] || null,
      temperature_max: row['Temperature Max (F)'] || null,
      special_instructions: row['Special Instructions'] || ''
    })).filter(lane => lane.origin_city && lane.destination_city);

    setParsedLanes(lanes);
    if (lanes.length > 0) {
      showToast(`Parsed ${lanes.length} lanes from Excel`, 'success');
    }
  };

  const parseCSV = () => {
    const lines = csvText.split('\n');
    const lanes = [];
    
    // Skip header rows (adjust based on your CSV format)
    for (let i = 4; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      if (columns.length < 7) continue;
      
      lanes.push({
        lane_number: i - 3,
        origin_city: columns[0],
        origin_state: columns[1],
        destination_city: columns[2],
        destination_state: columns[3],
        equipment_type: columns[4],
        commodity: columns[5],
        annual_volume: parseInt(columns[6]) || 0,
        service_type: columns[7] || 'Full Truckload',
        estimated_miles: 1000 // Default, will calculate later
      });
    }
    
    setParsedLanes(lanes);
    if (lanes.length > 0) {
      showToast(`Parsed ${lanes.length} lanes from CSV`, 'success');
    } else {
      showToast('No valid lanes found in CSV', 'warning');
    }
  };

  const handleImport = async () => {
    if (parsedLanes.length === 0) {
      showToast('Please parse CSV first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const lanesToInsert = parsedLanes.map(lane => ({
        ...lane,
        rfq_id: rfqId
      }));

      const { error } = await supabase
        .from('rfq_lanes')
        .insert(lanesToInsert);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error importing lanes:', error);
      showToast('Failed to import lanes: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Import Lanes from Excel/CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download pre-filled Excel template with all 30 Walmart lanes
                </p>
                <button
                  onClick={() => {
                    downloadWalmartTemplate();
                    showToast('Walmart template downloaded!', 'success');
                  }}
                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Walmart Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel (.xlsx) or CSV File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
            {fileName && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {fileName} loaded
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Supports: Excel (.xlsx, .xls) and CSV (.csv) files
            </p>
          </div>

          {/* Data Preview - Only show for CSV or if user wants to see it */}
          {csvText && parsedLanes.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV Preview
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] font-mono text-xs"
              />
              <button
                onClick={parseCSV}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Parse CSV
              </button>
            </div>
          )}

          {/* Parsed Lanes Preview */}
          {parsedLanes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Parsed Lanes ({parsedLanes.length})
              </h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Origin</th>
                      <th className="px-2 py-2 text-left">Destination</th>
                      <th className="px-2 py-2 text-left">Equipment</th>
                      <th className="px-2 py-2 text-left">Commodity</th>
                      <th className="px-2 py-2 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedLanes.map((lane, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-2 py-2">{lane.lane_number}</td>
                        <td className="px-2 py-2">{lane.origin_city}, {lane.origin_state}</td>
                        <td className="px-2 py-2">{lane.destination_city}, {lane.destination_state}</td>
                        <td className="px-2 py-2">{lane.equipment_type}</td>
                        <td className="px-2 py-2">{lane.commodity}</td>
                        <td className="px-2 py-2 text-right">{lane.annual_volume}/yr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || parsedLanes.length === 0}
              className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50"
            >
              {loading ? 'Importing...' : `Import ${parsedLanes.length} Lanes`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Functions
function calculateMetrics(loads) {
  if (loads.length === 0) {
    return { 
      otdPercentage: 0, 
      avgTransitTime: 0, 
      totalMargin: 0, 
      totalRevenue: 0,
      activeLoads: 0,
      deliveredOnTime: 0,
      totalDelivered: 0
    };
  }

  const deliveredLoads = loads.filter(l => l.status === 'delivered' && l.actual_delivery_date);
  const onTimeLoads = deliveredLoads.filter(l => 
    new Date(l.actual_delivery_date) <= new Date(l.scheduled_delivery_date)
  );
  const activeLoads = loads.filter(l => l.status === 'dispatched' || l.status === 'in_transit').length;

  const otdPercentage = deliveredLoads.length > 0 
    ? Math.round((onTimeLoads.length / deliveredLoads.length) * 100) 
    : 0;

  const transitTimes = deliveredLoads.map(l => {
    const pickup = new Date(l.pickup_date);
    const delivery = new Date(l.actual_delivery_date);
    return (delivery - pickup) / (1000 * 60 * 60);
  }).filter(t => t > 0 && t < 1000);

  const avgTransitTime = transitTimes.length > 0
    ? Math.round(transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length)
    : 0;

  const totalRevenue = loads.reduce((sum, l) => sum + (parseFloat(l.rate_billed_to_customer) || 0), 0);
  const totalMargin = loads.reduce((sum, l) => 
    sum + ((parseFloat(l.rate_billed_to_customer) || 0) - (parseFloat(l.rate_paid_to_carrier) || 0)), 0
  );

  return { 
    otdPercentage, 
    avgTransitTime, 
    totalMargin, 
    totalRevenue, 
    activeLoads,
    deliveredOnTime: onTimeLoads.length,
    totalDelivered: deliveredLoads.length
  };
}

function calculateCarrierPerformance(loads) {
  const carrierMap = {};

  loads.forEach(load => {
    if (!load.carrier_name) return;
    if (!carrierMap[load.carrier_name]) {
      carrierMap[load.carrier_name] = { total: 0, onTime: 0 };
    }
    carrierMap[load.carrier_name].total++;
    
    if (load.status === 'delivered' && load.actual_delivery_date && load.scheduled_delivery_date) {
      if (new Date(load.actual_delivery_date) <= new Date(load.scheduled_delivery_date)) {
        carrierMap[load.carrier_name].onTime++;
      }
    }
  });

  return Object.entries(carrierMap).map(([carrier, stats]) => ({
    carrier,
    loads: stats.total,
    otd: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0
  }));
}
