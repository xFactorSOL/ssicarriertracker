import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  ArrowRight,
  CreditCard, Receipt,
  FileUp, File, ClipboardCheck, Calendar, FileText,
  Clock, Play
} from 'lucide-react';

// Supabase client - Uses environment variables with fallbacks for local development
// In production (Vercel), these should be set in environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://qwoabopuoihbawlwmgbf.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2Fib3B1b2loYmF3bHdtZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTg3OTYsImV4cCI6MjA4NDM3NDc5Nn0.5Xwxjoykox37Aha9-jmol1UN8vVc3epeX-0jwElTUzE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Super admin determined by database is_super_admin column
const SUPER_ADMIN_EMAIL = process.env.REACT_APP_SUPER_ADMIN_EMAIL;

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isManager = profile?.role === 'manager' || isSuperAdmin;
  const isActive = profile?.status === 'active';

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setNotifications(data);
    }
  }, [user]);

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
        fetchNotifications();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchNotifications();
      } else {
        setProfile(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchNotifications]);

  useEffect(() => {
    if (user && profile && isActive) {
      fetchLoads();
      fetchCarriers();
      fetchCustomers();
      
      const channel = supabase
        .channel('all_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchLoads)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'carriers' }, fetchCarriers)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCustomers)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 20));
          showToast(`New Notification: ${payload.new.title}`, 'info');
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user, profile, isActive, fetchNotifications, showToast]);

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

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showToast(error.message, 'error');
        setLoading(false);
      } else {
        showToast('Welcome back!', 'success');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Check your email for confirmation link!', 'success');
      }
      setLoading(false);
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
          <h2 className="mt-6 text-xl font-bold text-gray-900">
            SEABOARD SOLUTIONS
          </h2>
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
          isLogin={isLogin}
          setIsLogin={setIsLogin}
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
            Thank you for requesting access to Seaboard Solutions. Your account is currently pending review by an administrator.
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

// Login Page - Seaboard Solutions Corporate
function LoginPage({ email, setEmail, password, setPassword, isLogin, setIsLogin, handleAuth, loading }) {
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
              <h1 className="text-2xl font-bold text-white tracking-tight">SEABOARD SOLUTIONS</h1>
              <p className="text-blue-200/60 text-xs tracking-widest uppercase">Supply Chain Intelligence</p>
            </div>
          </div>
          <h2 className="text-4xl font-light text-white leading-tight mb-6">
            Bringing Solutions<br />
            <span className="font-semibold">To Your Supply Chain</span>
          </h2>
          <p className="text-blue-100/70 text-lg max-w-md">
            Your trusted partner for logistics, freight forwarding, and supply chain management.
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
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">SEABOARD SOLUTIONS</h1>
            </div>
          </div>
          
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-500">
              {isLogin ? 'Enter your credentials to access your account' : 'Fill in your details to get started'}
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
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
              className="text-[#003366] hover:text-[#002244] font-medium"
          >
              {isLogin ? 'Sign up' : 'Sign in'}
          </button>
          </p>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              © 2024 Seaboard Solutions, Inc. All rights reserved.
            </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

// Profile Setup - Seaboard Solutions Branding
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
        <p className="text-center text-gray-500 text-sm mb-6">Welcome to Seaboard Solutions</p>
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

// Sidebar Navigation - Seaboard Solutions Corporate
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, isManager, isSuperAdmin, profile, onSignOut }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'loads', icon: Package, label: 'Shipments' },
    { id: 'carriers', icon: Truck, label: 'Carriers' },
    { id: 'customers', icon: Building, label: 'Clients' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', managerOnly: true },
    { id: 'users', icon: Users, label: 'Team', superAdminOnly: true },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 z-40 flex flex-col`}>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-gray-100">
        <div className="bg-[#003366] p-2.5 rounded-lg flex-shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm leading-tight tracking-tight text-gray-900">
              SEABOARD
            </h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">SOLUTIONS</p>
          </div>
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
                          {load.origin} → {load.destination}
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
function LoadsPage({ loads, carriers, customers, onRefresh, showToast, isManager, currentUser }) {
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

      {/* Loads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Load #</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Carrier</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLoads.map((load) => {
                const margin = (parseFloat(load.rate_billed_to_customer) || 0) - (parseFloat(load.rate_paid_to_carrier) || 0);
                return (
                  <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">{load.load_number}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{load.customer_name}</td>
                    <td className="py-4 px-6 text-gray-600">{load.carrier_name}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="truncate max-w-[100px]">{load.origin}</span>
                        <span className="text-gray-400">→</span>
                        <span className="truncate max-w-[100px]">{load.destination}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={load.status}
                        onChange={(e) => updateStatus(load.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#003366]"
                      >
                        <option value="dispatched">Dispatched</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="late">Late</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ${margin.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingLoad(load)}
                          className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingLoad(load); setShowForm(true); }}
                          className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLoad(load.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No loads found</p>
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
          onClose={() => { setShowForm(false); setEditingLoad(null); }}
          onSuccess={() => { onRefresh(); setShowForm(false); setEditingLoad(null); }}
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
        .select('*')
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
                      <p className="font-medium text-gray-900">{load.origin || 'N/A'}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Destination</p>
                      <p className="font-medium text-gray-900">{load.destination || 'N/A'}</p>
                    </div>
                  </div>
                </div>

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
                  auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-gray-100 last:border-0">
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        log.action === 'INSERT' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {log.action === 'INSERT' ? <Plus className="w-2 h-2" /> : <Edit className="w-2 h-2" />}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-gray-900">
                            {log.action === 'INSERT' ? 'Load Created' : 'Load Updated'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.action === 'UPDATE' && log.changed_fields && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(log.changed_fields).map(([field, values]) => (
                              <div key={field} className="text-[11px] flex items-center gap-2">
                                <span className="text-gray-500 font-medium capitalize">{field.replace(/_/g, ' ')}:</span>
                                <span className="text-red-400 line-through">{String(values.old)}</span>
                                <ArrowRight className="w-3 h-3 text-gray-300" />
                                <span className="text-green-600 font-medium">{String(values.new)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2">
                          By: <span className="font-medium text-gray-700">{log.profiles?.full_name || 'System'}</span>
                        </p>
                      </div>
                    </div>
                  ))
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
function LoadFormModal({ load, carriers, customers, onClose, onSuccess, showToast }) {
  const [formData, setFormData] = useState({
    load_number: load?.load_number || '',
    customer_name: load?.customer_name || '',
    origin: load?.origin || '',
    destination: load?.destination || '',
    pickup_date: load?.pickup_date?.slice(0, 16) || '',
    scheduled_delivery_date: load?.scheduled_delivery_date?.slice(0, 16) || '',
    carrier_name: load?.carrier_name || '',
    driver_name: load?.driver_name || '',
    driver_phone: load?.driver_phone || '',
    rate_paid_to_carrier: load?.rate_paid_to_carrier || '',
    rate_billed_to_customer: load?.rate_billed_to_customer || '',
    notes: load?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = [];
    if (validateRequired(formData.load_number, 'Load Number')) errors.push(validateRequired(formData.load_number, 'Load Number'));
    if (validateRequired(formData.customer_name, 'Customer')) errors.push(validateRequired(formData.customer_name, 'Customer'));
    if (validateRequired(formData.origin, 'Origin')) errors.push(validateRequired(formData.origin, 'Origin'));
    if (validateRequired(formData.destination, 'Destination')) errors.push(validateRequired(formData.destination, 'Destination'));
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

    try {
      if (load) {
        const { error } = await supabase.from('loads').update(sanitizedData).eq('id', load.id);
        if (error) throw error;
        showToast('Load updated successfully', 'success');
    } else {
        const { data: { user } } = await supabase.auth.getUser();
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
            <input
              type="text"
                required
              value={formData.origin}
              onChange={(e) => setFormData({...formData, origin: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="City, State"
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
            <input
              type="text"
                required
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366]"
                placeholder="City, State"
            />
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

// Carriers Page
function CarriersPage({ carriers, loads, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState(null);
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
          <div key={carrier.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{carrier.name}</h3>
                  <p className="text-sm text-gray-500">MC# {carrier.mc_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingCarrier(carrier); setShowForm(true); }}
                  className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCarrier(carrier.id)}
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
                <p className="text-xl font-bold text-gray-900">{carrier.totalLoads}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">On-Time %</p>
                <p className={`text-xl font-bold ${carrier.otd >= 90 ? 'text-emerald-600' : carrier.otd >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                  {carrier.otd}%
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setUsers(data);
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
          <p className="text-sm text-gray-500">Manage user access and permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
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
                  {u.email !== SUPER_ADMIN_EMAIL ? (
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
                    {u.status === 'active' && u.email !== SUPER_ADMIN_EMAIL && (
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
                    {u.email !== SUPER_ADMIN_EMAIL && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Suspend"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {u.email !== SUPER_ADMIN_EMAIL && u.status === 'suspended' && (
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
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Direct creation logic: 
      // 1. We create the profile record with status 'pending'
      // 2. We instruct the user to sign up with this email
      // This is the most secure way without a backend service role
      
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        showToast('A user with this email already exists', 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .insert([{
          email: sanitizeInput(email.toLowerCase()),
          full_name: sanitizeInput(fullName),
          role: role,
          status: 'pending' // They still need to sign up to create the auth user
        }]);

      if (error) throw error;

      showToast(`User record created. Please ask ${fullName} to sign up with ${email}.`, 'success');
      onSuccess();
    } catch (error) {
      showToast(error.message, 'error');
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
          <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Note: For security, new users should sign up with their email. You can then approve them in the Team list.
          </p>
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
            Send Instructions
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
