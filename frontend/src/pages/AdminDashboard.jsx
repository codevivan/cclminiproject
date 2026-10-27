import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi, menuApi, adminApi, notificationApi, authApi } from '../services/api';
import {
  ChefHat,
  TrendingUp,
  ShoppingBag,
  Ticket,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  LayoutDashboard,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
  CreditCard,
  FileText,
  QrCode,
  Banknote,
  PauseCircle,
  Store,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Star,
  Check,
  ChevronRight,
  Flame,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  KeyRound,
  CheckCheck
} from 'lucide-react';
import AlertMessage from '../components/AlertMessage';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 10 Core Role Sections: 'overview', 'tracker', 'menu', 'canteen_status', 'payments', 'users', 'receipts', 'reports', 'notifications', 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    todayPendingRevenue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    activeQueue: 0,
    readyForPickup: 0,
    totalMenuItems: 0,
    availableMenuItems: 0,
    pendingUpiVerifications: 0,
    pendingCounterPayments: 0,
    totalPaidOrders: 0
  });

  // Receipts state
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('all');

  // Notifications state
  const [ownerNotifications, setOwnerNotifications] = useState([]);
  const [ownerUnreadCount, setOwnerUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Settings & Security state
  const [paymentConfig, setPaymentConfig] = useState({
    canteen_name: 'Campus Canteen',
    upi_id: 'canteen@okhdfcbank',
    upi_name: 'Campus Canteen Billing'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState(null);

  // Orders / Live Tracker state
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Menu items state
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('All');
  const [menuAvailabilityFilter, setMenuAvailabilityFilter] = useState('All');
  const [menuSpecialFilter, setMenuSpecialFilter] = useState('All');

  // Today's Canteen Status state
  const [canteenStatus, setCanteenStatus] = useState({
    status: 'open',
    notice: 'Welcome! Online food pre-orders are open today.',
    opening_time: '08:00',
    closing_time: '20:00'
  });
  const [canteenForm, setCanteenForm] = useState({
    status: 'open',
    notice: 'Welcome! Online food pre-orders are open today.',
    opening_time: '08:00',
    closing_time: '20:00'
  });
  const [canteenSaving, setCanteenSaving] = useState(false);

  // Payment Management state
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);

  // Student/User accounts state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Sales and Reports state
  const [reports, setReports] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Add/Edit menu item modal
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Meals',
    image_url: '',
    prep_time_minutes: '10',
    is_available: true,
    is_featured: false
  });
  const [menuFormSubmitting, setMenuFormSubmitting] = useState(false);
  const [menuFormError, setMenuFormError] = useState('');

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState(null);
  const [deletingSubmitting, setDeletingSubmitting] = useState(false);

  // General alert
  const [bannerMessage, setBannerMessage] = useState(null);

  // -------------------------------------------------------------
  // Data Fetching Functions
  // -------------------------------------------------------------
  const fetchStats = async () => {
    try {
      const res = await orderApi.getDashboardStats();
      if (res?.stats) setStats(res.stats);
    } catch (e) {
      console.warn('Could not load stats:', e.message);
    }
  };

  const fetchOrders = async (showLoader = false) => {
    if (showLoader && orders.length === 0) setLoadingOrders(true);
    try {
      const res = await orderApi.getAllOrders({
        limit: 100
      });
      setOrders(res.orders || []);
    } catch (e) {
      console.warn('Could not load admin orders:', e.message);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  };

  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await menuApi.getAll({
        search: menuSearch.trim() || undefined,
        category: menuCategoryFilter !== 'All' ? menuCategoryFilter : undefined
      });
      setMenuItems(res.data || []);
    } catch (e) {
      console.warn('Could not load menu items:', e.message);
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchCanteenStatus = async () => {
    try {
      const res = await adminApi.getCanteenStatus();
      if (res?.status) {
        setCanteenStatus(res.status);
        setCanteenForm({
          status: res.status.status || 'open',
          notice: res.status.notice || '',
          opening_time: res.status.opening_time || '08:00',
          closing_time: res.status.closing_time || '20:00'
        });
      }
    } catch (e) {
      console.warn('Could not load canteen status:', e.message);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = {};
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      if (userSearch) params.search = userSearch;
      const res = await adminApi.getUsers(params);
      setUsers(res.users || []);
    } catch (e) {
      console.warn('Could not load student accounts:', e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPayments = async (showLoader = false) => {
    if (showLoader && paymentOrders.length === 0) setLoadingPayments(true);
    try {
      const params = {};
      if (paymentStatusFilter !== 'all') params.payment_status = paymentStatusFilter;
      if (paymentMethodFilter !== 'all') params.payment_method = paymentMethodFilter;
      const res = await orderApi.getPaymentOrders(params);
      setPaymentOrders(res.orders || []);
    } catch (err) {
      console.warn('Could not load payment records:', err.message);
    } finally {
      if (showLoader) setLoadingPayments(false);
    }
  };

  const fetchReports = async (showLoader = false) => {
    if (showLoader && !reports) setLoadingReports(true);
    try {
      const res = await adminApi.getReports();
      if (res?.reports) setReports(res.reports);
    } catch (err) {
      console.warn('Could not load sales reports:', err.message);
    } finally {
      if (showLoader) setLoadingReports(false);
    }
  };

  const fetchOwnerNotifications = async (showLoader = false) => {
    if (showLoader && ownerNotifications.length === 0) setLoadingNotifications(true);
    try {
      const res = await notificationApi.getAll();
      setOwnerNotifications(res.notifications || []);
      setOwnerUnreadCount(res.unreadCount || 0);
    } catch (e) {
      console.warn('Could not load owner notifications:', e.message);
    } finally {
      if (showLoader) setLoadingNotifications(false);
    }
  };

  const handleMarkNotifRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      setOwnerNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setOwnerUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Could not mark notification read:', err.message);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setOwnerNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setOwnerUnreadCount(0);
      setBannerMessage({ type: 'success', text: 'All notifications marked as read.' });
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (err) {
      console.warn('Could not mark all notifications as read:', err.message);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const res = await orderApi.getPaymentConfig();
      if (res?.config) setPaymentConfig(res.config);
    } catch (e) {
      console.warn('Could not load payment configuration:', e.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordAlert({ type: 'error', text: 'Please fill in both current and new passwords.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordAlert({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordAlert({ type: 'error', text: 'New passwords do not match. Please verify.' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await authApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordAlert({ type: 'success', text: res.message || 'Owner password successfully updated!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordAlert({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Initial and periodic polling
  useEffect(() => {
    fetchStats();
    fetchOrders(true);
    fetchMenu();
    fetchCanteenStatus();
    fetchUsers();
    fetchPayments(true);
    fetchReports(true);
    fetchOwnerNotifications(true);
    fetchPaymentConfig();

    // Auto-refresh orders, notifications, and stats silently every 4 seconds for live operations
    const interval = setInterval(() => {
      fetchOrders(false);
      fetchStats();
      fetchOwnerNotifications(false);
      if (activeTabRef.current === 'payments') fetchPayments(false);
      if (activeTabRef.current === 'reports') fetchReports(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [menuCategoryFilter]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments(true);
    }
  }, [paymentStatusFilter, paymentMethodFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      const delaySearch = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delaySearch);
    }
  }, [userRoleFilter, userSearch, activeTab]);

  // -------------------------------------------------------------
  // Order Status Management (All 6 Statuses)
  // -------------------------------------------------------------
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      // Immediately reflect across UI
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
      );
      fetchStats();
      const statusLabels = {
        pending: 'Order Placed',
        confirmed: 'Confirmed',
        preparing: 'In Kitchen (Preparing)',
        ready: 'Ready for Pickup',
        completed: 'Completed',
        cancelled: 'Cancelled'
      };
      setBannerMessage({ type: 'success', text: `Order status set to "${statusLabels[newStatus] || newStatus}".` });
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (err) {
      // Revert optimistic update by refetching actual MySQL state - never show false success!
      fetchOrders(false);
      fetchStats();
      setBannerMessage({ type: 'error', text: err.message || 'Failed to update order status in MySQL database.' });
      setTimeout(() => setBannerMessage(null), 4000);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // -------------------------------------------------------------
  // Today's Canteen Status Management
  // -------------------------------------------------------------
  const handleSaveCanteenStatus = async (e) => {
    if (e) e.preventDefault();
    setCanteenSaving(true);
    try {
      const res = await adminApi.updateCanteenStatus(canteenForm);
      if (res?.status) {
        setCanteenStatus(res.status);
      }
      setBannerMessage({
        type: 'success',
        text: res.message || `Today's canteen status successfully updated to "${canteenForm.status.replace('_', ' ').toUpperCase()}".`
      });
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to update canteen status.' });
      setTimeout(() => setBannerMessage(null), 3500);
    } finally {
      setCanteenSaving(false);
    }
  };

  const applyStatusPreset = (presetStatus, presetNotice) => {
    setCanteenForm((prev) => ({
      ...prev,
      status: presetStatus,
      notice: presetNotice
    }));
  };

  // -------------------------------------------------------------
  // Menu Item Management (Add, Edit, Delete, Special, Availability)
  // -------------------------------------------------------------
  const openMenuModal = (item = null) => {
    setMenuFormError('');
    if (item) {
      setEditingItem(item);
      setMenuForm({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        image_url: item.image_url || '',
        prep_time_minutes: String(item.prep_time_minutes || 10),
        is_available: Boolean(item.is_available),
        is_featured: Boolean(item.is_featured)
      });
    } else {
      setEditingItem(null);
      setMenuForm({
        name: '',
        description: '',
        price: '',
        category: 'Meals',
        image_url: '',
        prep_time_minutes: '10',
        is_available: true,
        is_featured: false
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleMenuFormSubmit = async (e) => {
    e.preventDefault();
    setMenuFormError('');

    const parsedPrice = parseFloat(menuForm.price);
    if (!menuForm.name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      setMenuFormError('Please enter a valid dish name and positive price (min ₹1).');
      return;
    }

    setMenuFormSubmitting(true);
    try {
      if (editingItem) {
        await menuApi.update(editingItem.id, menuForm);
        setBannerMessage({ type: 'success', text: `Updated "${menuForm.name}" successfully.` });
      } else {
        await menuApi.create(menuForm);
        setBannerMessage({ type: 'success', text: `Added "${menuForm.name}" to menu.` });
      }
      setIsMenuModalOpen(false);
      fetchMenu();
      fetchStats();
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (err) {
      setMenuFormError(err.message || 'Failed to save menu item.');
    } finally {
      setMenuFormSubmitting(false);
    }
  };

  const handleToggleItemAvailability = async (item, targetAvailability) => {
    try {
      const newAvail = targetAvailability !== undefined ? targetAvailability : !item.is_available;
      await menuApi.update(item.id, { is_available: newAvail });
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: newAvail } : i))
      );
      fetchStats();
      setBannerMessage({
        type: 'success',
        text: `"${item.name}" marked as ${newAvail ? 'Available' : 'Sold Out'}.`
      });
      setTimeout(() => setBannerMessage(null), 2500);
    } catch (err) {
      setBannerMessage({ type: 'error', text: 'Failed to update availability: ' + err.message });
      setTimeout(() => setBannerMessage(null), 3500);
    }
  };

  const handleToggleItemSpecial = async (item) => {
    try {
      const newFeatured = !item.is_featured;
      await menuApi.update(item.id, { is_featured: newFeatured });
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_featured: newFeatured } : i))
      );
      setBannerMessage({
        type: 'success',
        text: `"${item.name}" ${newFeatured ? 'marked as Today\'s Special ⭐' : 'removed from specials'}.`
      });
      setTimeout(() => setBannerMessage(null), 2500);
    } catch (err) {
      setBannerMessage({ type: 'error', text: 'Failed to update special status: ' + err.message });
      setTimeout(() => setBannerMessage(null), 3500);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    setDeletingSubmitting(true);
    try {
      await menuApi.delete(deletingItem.id);
      setMenuItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setDeletingItem(null);
      fetchStats();
      setBannerMessage({
        type: 'success',
        text: `"${deletingItem.name}" deleted. Historical order records and student receipts remain fully preserved.`
      });
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err) {
      setBannerMessage({ type: 'error', text: 'Failed to delete item: ' + err.message });
      setTimeout(() => setBannerMessage(null), 3500);
    } finally {
      setDeletingSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Payment Confirmation
  // -------------------------------------------------------------
  const handleConfirmPayment = async (orderId, tokenNumber, method) => {
    if (
      !window.confirm(
        `Confirm payment receipt for Token #${tokenNumber} (${method})?\n\nThis marks the order as PAID in MySQL and generates an official paid receipt for the student.`
      )
    ) {
      return;
    }

    setConfirmingPaymentId(orderId);
    try {
      const res = await orderApi.confirmPayment(orderId);
      setPaymentOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, payment_status: 'PAID', verified_at: res.verified_at, verified_by_name: user?.name }
            : o
        )
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'PAID' } : o))
      );
      fetchStats();
      setBannerMessage({ type: 'success', text: res.message || `Payment for Token #${tokenNumber} confirmed successfully.` });
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to confirm payment.' });
      setTimeout(() => setBannerMessage(null), 3500);
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  // -------------------------------------------------------------
  // Student Account Toggle
  // -------------------------------------------------------------
  const handleToggleUserStatus = async (targetUser) => {
    if (targetUser.id === user?.id) {
      alert('Administrators cannot deactivate their own account.');
      return;
    }
    const action = targetUser.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} the account for "${targetUser.name}" (${targetUser.email})?`)) {
      return;
    }
    setTogglingUserId(targetUser.id);
    try {
      const res = await adminApi.toggleUserStatus(targetUser.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: res.isActive } : u))
      );
      setBannerMessage({ type: 'success', text: res.message || 'Account status updated.' });
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to update user account status.' });
      setTimeout(() => setBannerMessage(null), 3500);
    } finally {
      setTogglingUserId(null);
    }
  };

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchSearch =
      !menuSearch.trim() ||
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));

    const matchCategory = menuCategoryFilter === 'All' || item.category === menuCategoryFilter;

    const matchAvailability =
      menuAvailabilityFilter === 'All' ||
      (menuAvailabilityFilter === 'Available' && item.is_available) ||
      (menuAvailabilityFilter === 'SoldOut' && !item.is_available);

    const matchSpecial = menuSpecialFilter === 'All' || (menuSpecialFilter === 'Special' && item.is_featured);

    return matchSearch && matchCategory && matchAvailability && matchSpecial;
  });

  // Filtered orders in Live Tracker
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter = orderFilter === 'all' || o.status === orderFilter;
      const matchSearch =
        !orderSearch.trim() ||
        (o.token_number && o.token_number.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.student_name && o.student_name.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.student_email && o.student_email.toLowerCase().includes(orderSearch.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation (7 Dedicated Sections) */}
      {/* Dedicated Owner Sidebar Navigation (11 Complete Sections) */}
      <aside className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 0.5rem 1.25rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--warm-orange)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Campus Canteen
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--forest-green)', marginTop: '0.2rem' }}>
            Owner Dashboard
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.4rem', fontSize: '0.72rem', background: 'rgba(23, 76, 60, 0.12)', color: 'var(--forest-green)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
            <ShieldCheck size={13} />
            <span>Master Owner (Single Account)</span>
          </div>
        </div>

        {/* 1. Overview */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          id="owner-nav-overview"
        >
          <LayoutDashboard size={18} />
          <span>1. Overview</span>
        </button>

        {/* 2. Live Orders & Tokens */}
        <button
          onClick={() => {
            setActiveTab('tracker');
            fetchOrders();
          }}
          className={`admin-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
          id="owner-nav-live-orders"
          style={{
            background: activeTab === 'tracker' ? 'var(--forest-green)' : undefined,
            color: activeTab === 'tracker' ? '#FFFFFF' : undefined
          }}
        >
          <Ticket size={18} />
          <span>2. Live Orders & Tokens</span>
          {stats.activeQueue > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: 'var(--warm-orange)',
                color: 'var(--forest-green-dark)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {stats.activeQueue}
            </span>
          )}
        </button>

        {/* 3. Menu Management */}
        <button
          onClick={() => {
            setActiveTab('menu');
            fetchMenu();
          }}
          className={`admin-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
          id="owner-nav-menu"
        >
          <UtensilsCrossed size={18} />
          <span>3. Menu Management</span>
          {stats.totalMenuItems > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: 'var(--bg-cream)',
                color: 'var(--forest-green)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {stats.totalMenuItems}
            </span>
          )}
        </button>

        {/* 4. Today's Canteen Status */}
        <button
          onClick={() => {
            setActiveTab('canteen_status');
            fetchCanteenStatus();
          }}
          className={`admin-nav-item ${activeTab === 'canteen_status' ? 'active' : ''}`}
          id="owner-nav-canteen-status"
        >
          <Store size={18} />
          <span>4. Today's Canteen Status</span>
          <span
            style={{
              marginLeft: 'auto',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background:
                canteenStatus.status === 'open'
                  ? '#16a34a'
                  : canteenStatus.status === 'closing_soon'
                  ? '#f97316'
                  : '#dc2626'
            }}
          />
        </button>

        {/* 5. Payment Management */}
        <button
          onClick={() => {
            setActiveTab('payments');
            fetchPayments();
          }}
          className={`admin-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
          id="owner-nav-payments"
        >
          <CreditCard size={18} />
          <span>5. Payment Management</span>
          {stats.pendingUpiVerifications > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: '#f59e0b',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)'
              }}
              title="Awaiting UPI reference verification"
            >
              {stats.pendingUpiVerifications}
            </span>
          )}
        </button>

        {/* 6. Students */}
        <button
          onClick={() => {
            setActiveTab('users');
            fetchUsers();
          }}
          className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          id="owner-nav-students"
        >
          <Users size={18} />
          <span>6. Students</span>
          {users.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: 'rgba(38, 118, 83, 0.12)',
                color: 'var(--fresh-green)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {users.filter((u) => String(u.role).toUpperCase() === 'STUDENT').length}
            </span>
          )}
        </button>

        {/* 7. Receipts */}
        <button
          onClick={() => {
            setActiveTab('receipts');
            fetchOrders();
          }}
          className={`admin-nav-item ${activeTab === 'receipts' ? 'active' : ''}`}
          id="owner-nav-receipts"
        >
          <FileText size={18} />
          <span>7. Receipts</span>
          {orders.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: 'var(--bg-cream)',
                color: 'var(--forest-green)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {orders.length}
            </span>
          )}
        </button>

        {/* 8. Sales & Reports */}
        <button
          onClick={() => {
            setActiveTab('reports');
            fetchReports();
          }}
          className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          id="owner-nav-reports"
        >
          <BarChart3 size={18} />
          <span>8. Sales & Reports</span>
        </button>

        {/* 9. Notifications */}
        <button
          onClick={() => {
            setActiveTab('notifications');
            fetchOwnerNotifications();
          }}
          className={`admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
          id="owner-nav-notifications"
        >
          <Bell size={18} />
          <span>9. Notifications</span>
          {ownerUnreadCount > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: '#dc2626',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {ownerUnreadCount}
            </span>
          )}
        </button>

        {/* 10. Settings */}
        <button
          onClick={() => {
            setActiveTab('settings');
            fetchPaymentConfig();
          }}
          className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          id="owner-nav-settings"
        >
          <Settings size={18} />
          <span>10. Settings</span>
        </button>

        {/* 11. Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <button
            onClick={handleLogout}
            className="admin-nav-item"
            id="owner-nav-logout"
            style={{ color: '#dc2626', width: '100%', justifyContent: 'flex-start' }}
            title="Securely sign out of Owner account"
          >
            <LogOut size={18} />
            <span>11. Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Prominent Quick-Action Header with "⚡ Live Order Tracker" Button */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background:
                  canteenStatus.status === 'open'
                    ? '#16a34a'
                    : canteenStatus.status === 'closing_soon'
                    ? '#f97316'
                    : '#dc2626'
              }}
            />
            <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontWeight: 600 }}>
              Canteen Status:{' '}
              <span
                style={{
                  fontWeight: 800,
                  color:
                    canteenStatus.status === 'open'
                      ? 'var(--fresh-green)'
                      : canteenStatus.status === 'closing_soon'
                      ? '#ea580c'
                      : '#dc2626',
                  textTransform: 'uppercase'
                }}
              >
                {canteenStatus.status.replace('_', ' ')}
              </span>{' '}
              ({canteenStatus.opening_time || '08:00'} - {canteenStatus.closing_time || '20:00'})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Prominent Live Order Tracker Button */}
            <button
              onClick={() => {
                setActiveTab('tracker');
                fetchOrders();
              }}
              className="btn btn-orange"
              id="btn-prominent-live-tracker"
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                padding: '0.55rem 1.15rem',
                boxShadow: '0 2px 8px rgba(244, 163, 64, 0.35)'
              }}
            >
              <Ticket size={17} />
              <span>⚡ Live Order Tracker</span>
              {stats.activeQueue > 0 && (
                <span
                  style={{
                    background: 'var(--forest-green)',
                    color: '#FFFFFF',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    marginLeft: '4px'
                  }}
                >
                  {stats.activeQueue}
                </span>
              )}
            </button>

            <button
              onClick={() => openMenuModal()}
              className="btn btn-primary"
              style={{ fontSize: '0.88rem', padding: '0.55rem 1rem' }}
            >
              <Plus size={16} />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {bannerMessage && (
          <AlertMessage type={bannerMessage.type} message={bannerMessage.text} />
        )}

        {/* ============================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ============================================================= */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Kitchen & Token Overview
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Live operational metrics fetched directly from MySQL database records.
                </p>
              </div>

              <button
                onClick={() => {
                  fetchStats();
                  fetchOrders();
                  fetchCanteenStatus();
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem' }}
              >
                <RefreshCw size={15} />
                <span>Refresh Metrics</span>
              </button>
            </div>

            {/* Metric Cards Grid (7 Real Statistics from MySQL) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {/* 1. Total Orders Today */}
              <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--fresh-green-light)', color: 'var(--fresh-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL ORDERS TODAY</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--forest-green)' }}>{stats.todayOrders}</div>
                </div>
              </div>

              {/* 2. Pending Orders */}
              <div
                className="surface-card"
                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                onClick={() => {
                  setOrderFilter('pending');
                  setActiveTab('tracker');
                }}
                title="Filter pending orders"
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING ORDERS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309' }}>
                    {stats.pendingOrders ?? 0}
                  </div>
                </div>
              </div>

              {/* 3. Orders Being Prepared */}
              <div
                className="surface-card"
                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warm-orange)', cursor: 'pointer' }}
                onClick={() => {
                  setOrderFilter('preparing');
                  setActiveTab('tracker');
                }}
                title="Filter orders being prepared"
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 163, 64, 0.2)', color: 'var(--warm-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChefHat size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>BEING PREPARED</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warm-orange)' }}>
                    {stats.preparingOrders ?? 0}
                  </div>
                </div>
              </div>

              {/* 4. Orders Ready for Pickup */}
              <div
                className="surface-card"
                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
                onClick={() => {
                  setOrderFilter('ready');
                  setActiveTab('tracker');
                }}
                title="Filter orders ready for pickup"
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>READY FOR PICKUP</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
                    {stats.readyOrders ?? 0}
                  </div>
                </div>
              </div>

              {/* 5. Completed Orders */}
              <div
                className="surface-card"
                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                onClick={() => {
                  setOrderFilter('completed');
                  setActiveTab('tracker');
                }}
                title="Filter completed orders"
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMPLETED ORDERS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#475569' }}>
                    {stats.completedOrders ?? 0}
                  </div>
                </div>
              </div>

              {/* 6. Today's Confirmed Revenue */}
              <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '1.5px solid #bbf7d0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 800 }}>CONFIRMED REVENUE</span>
                    <span style={{ fontSize: '0.65rem', background: '#15803d', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>PAID ONLY</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>
                    ₹{stats.todayRevenue.toFixed(2)}
                  </div>
                  {stats.todayPendingRevenue > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                      +₹{stats.todayPendingRevenue.toFixed(2)} pending verification
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Available Menu Items */}
              <div
                className="surface-card"
                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                onClick={() => setActiveTab('menu')}
                title="Manage menu items"
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-cream)', color: 'var(--forest-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UtensilsCrossed size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVAILABLE MENU ITEMS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--forest-green)' }}>
                    {stats.availableMenuItems} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {stats.totalMenuItems}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Queue Quick View */}
            <div className="surface-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--forest-green)', margin: 0 }}>
                    Live Queue Quick Display
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Active orders awaiting preparation or pickup. Open the full tracker for complete controls.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <span>Open Full Tracker</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <Ticket size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No active orders in the kitchen queue right now.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {orders
                    .filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
                    .slice(0, 6)
                    .map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          background: 'var(--bg-cream)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-light)',
                          padding: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-green)' }}>
                            #{ord.token_number}
                          </span>
                          <span className={`badge badge-status-${ord.status}`}>{ord.status}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ord.student_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>
                          {(ord.items || []).map((it) => `${it.quantity}x ${it.item_name}`).join(', ')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
                          <span style={{ fontWeight: 800 }}>₹{parseFloat(ord.total_amount).toFixed(2)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* 2. MENU MANAGEMENT TAB */}
        {/* ============================================================= */}
        {activeTab === 'menu' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Menu Management
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Add dishes, update prices, manage daily availability (Available / Sold Out), and set Today's Specials.
                </p>
              </div>

              <button
                onClick={() => openMenuModal()}
                className="btn btn-primary"
                id="btn-add-new-dish"
                style={{ fontSize: '0.9rem' }}
              >
                <Plus size={16} />
                <span>Add New Food Item</span>
              </button>
            </div>

            {/* Menu Search and Filters */}
            <div className="surface-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search food item by name or description..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
                <select
                  value={menuCategoryFilter}
                  onChange={(e) => setMenuCategoryFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '140px', height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Meals">Meals</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={menuAvailabilityFilter}
                  onChange={(e) => setMenuAvailabilityFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '140px', height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="All">All Status</option>
                  <option value="Available">Available Only</option>
                  <option value="SoldOut">Sold Out Only</option>
                </select>
              </div>

              {/* Specials Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Specials:</span>
                <select
                  value={menuSpecialFilter}
                  onChange={(e) => setMenuSpecialFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '150px', height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="All">All Items</option>
                  <option value="Special">Today's Specials</option>
                </select>
              </div>
            </div>

            {loadingMenu ? (
              <div className="surface-card skeleton" style={{ height: '300px' }}></div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <UtensilsCrossed size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, margin: 0 }}>No matching food items found.</p>
                <p style={{ fontSize: '0.85rem' }}>Try clearing filters or adding a new dish.</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DISH NAME & PHOTO</th>
                      <th>CATEGORY</th>
                      <th>PRICE</th>
                      <th>TODAY'S SPECIAL</th>
                      <th>AVAILABILITY</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenuItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                              alt={item.name}
                              style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--forest-green)' }}>{item.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description || 'No description provided'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-student">{item.category}</span>
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--forest-green)' }}>
                          ₹{parseFloat(item.price).toFixed(2)}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleItemSpecial(item)}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.78rem',
                              background: item.is_featured ? 'rgba(244, 163, 64, 0.15)' : undefined,
                              border: item.is_featured ? '1.5px solid var(--warm-orange)' : undefined,
                              color: item.is_featured ? '#b45309' : 'var(--text-muted)'
                            }}
                            title="Click to toggle Today's Special"
                          >
                            <Star size={13} fill={item.is_featured ? 'var(--warm-orange)' : 'none'} color={item.is_featured ? 'var(--warm-orange)' : 'currentColor'} />
                            <span>{item.is_featured ? "Today's Special" : 'Regular Item'}</span>
                          </button>
                        </td>
                        <td>
                          <select
                            value={item.is_available ? 'available' : 'sold_out'}
                            onChange={(e) => handleToggleItemAvailability(item, e.target.value === 'available')}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1.5px solid var(--border-light)',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              background: item.is_available ? '#dcfce7' : '#fee2e2',
                              color: item.is_available ? '#15803d' : '#b91c1c',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="available">🟢 Available</option>
                            <option value="sold_out">🔴 Sold Out / Unavailable</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => openMenuModal(item)}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                              title="Edit dish name, price, description or image"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="btn btn-outline-danger"
                              style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                              title="Delete food item (preserves historical receipts)"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 3. LIVE ORDER TRACKER TAB (Prominent Dedicated Page) */}
        {/* ============================================================= */}
        {activeTab === 'tracker' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                    Live Order Tracker
                  </h1>
                  <span
                    style={{
                      background: 'var(--warm-orange)',
                      color: 'var(--forest-green-dark)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    Auto-Refreshed
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Real-time kitchen order queue. Change order statuses: Placed → Confirmed → Preparing → Ready for Pickup → Completed.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={fetchOrders}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.88rem' }}
                  disabled={loadingOrders}
                >
                  <RefreshCw size={15} className={loadingOrders ? 'spin' : ''} />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="surface-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by token number (#T-001) or student name..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>

              {/* Status Tabs / Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status Filter:</span>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '180px', height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Order Placed (Pending)</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">In Kitchen (Preparing)</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Live Orders Table */}
            {loadingOrders && orders.length === 0 ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Loading live canteen orders from database...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="surface-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Ticket size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', margin: 0 }}>No orders in this view</h3>
                <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  Orders placed by students will appear here automatically in real time.
                </p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TOKEN</th>
                      <th>PLACED AT</th>
                      <th>STUDENT CUSTOMER</th>
                      <th>ORDERED DISHES & QTY</th>
                      <th>TOTAL</th>
                      <th>PAYMENT</th>
                      <th>STATUS & ADVANCE</th>
                      <th style={{ textAlign: 'right' }}>STAFF ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const isUpdating = updatingOrderId === ord.id;
                      return (
                        <tr
                          key={ord.id}
                          style={{
                            background:
                              ord.status === 'ready'
                                ? 'rgba(38, 118, 83, 0.05)'
                                : ord.status === 'preparing'
                                ? 'rgba(244, 163, 64, 0.05)'
                                : undefined
                          }}
                        >
                          <td style={{ fontWeight: 800, color: 'var(--forest-green)', fontSize: '1.15rem' }}>
                            #{ord.token_number}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <div>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            {ord.updated_at && ord.updated_at !== ord.created_at && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                                Upd: {new Date(ord.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{ord.student_name}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{ord.student_email}</div>
                          </td>
                          <td style={{ fontSize: '0.88rem' }}>
                            {(ord.items || []).map((it, idx) => (
                              <div key={idx} style={{ lineHeight: '1.3' }}>
                                <strong style={{ color: 'var(--forest-green)' }}>{it.quantity}x</strong> {it.item_name}
                              </div>
                            ))}
                            {ord.notes && (
                              <div style={{ fontSize: '0.76rem', color: '#b45309', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                Note: {ord.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--forest-green)' }}>
                            ₹{parseFloat(ord.total_amount).toFixed(2)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{ord.payment_method}</span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  width: 'fit-content',
                                  background:
                                    ord.payment_status === 'PAID'
                                      ? '#dcfce7'
                                      : ord.payment_status === 'PENDING_VERIFICATION'
                                      ? '#fef3c7'
                                      : '#fee2e2',
                                  color:
                                    ord.payment_status === 'PAID'
                                      ? '#15803d'
                                      : ord.payment_status === 'PENDING_VERIFICATION'
                                      ? '#b45309'
                                      : '#b91c1c'
                                }}
                              >
                                {ord.payment_status === 'PAID'
                                  ? 'PAID'
                                  : ord.payment_status === 'PENDING_VERIFICATION'
                                  ? 'UPI REVIEW'
                                  : 'COUNTER DUE'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <select
                                value={ord.status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                disabled={isUpdating}
                                style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1.5px solid var(--border-light)',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  background: 'var(--bg-surface)',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="pending">1. Order Placed</option>
                                <option value="confirmed">2. Confirmed</option>
                                <option value="preparing">3. Preparing (In Kitchen)</option>
                                <option value="ready">4. Ready for Pickup</option>
                                <option value="completed">5. Completed</option>
                                <option value="cancelled">6. Cancelled</option>
                              </select>

                              {/* Quick One-Click Status Advance Helper Button */}
                              {ord.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(ord.id, 'confirmed')}
                                  disabled={isUpdating}
                                  className="btn btn-primary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <span>Confirm Order</span>
                                  <ChevronRight size={12} />
                                </button>
                              )}
                              {ord.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(ord.id, 'preparing')}
                                  disabled={isUpdating}
                                  className="btn btn-orange"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <span>Start Preparing</span>
                                  <ChevronRight size={12} />
                                </button>
                              )}
                              {ord.status === 'preparing' && (
                                <button
                                  onClick={() => handleStatusChange(ord.id, 'ready')}
                                  disabled={isUpdating}
                                  className="btn btn-primary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#16a34a', borderColor: '#16a34a' }}
                                >
                                  <span>Mark Ready</span>
                                  <ChevronRight size={12} />
                                </button>
                              )}
                              {ord.status === 'ready' && (
                                <button
                                  onClick={() => handleStatusChange(ord.id, 'completed')}
                                  disabled={isUpdating}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <Check size={12} />
                                  <span>Mark Collected</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              {ord.payment_status !== 'PAID' && (
                                <button
                                  onClick={() => handleConfirmPayment(ord.id, ord.token_number, ord.payment_method)}
                                  className={ord.payment_status === 'PENDING_VERIFICATION' ? 'btn btn-primary' : 'btn btn-orange'}
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                  title="Confirm payment at counter"
                                >
                                  {ord.payment_method === 'UPI' ? 'Verify UPI' : 'Confirm Pay'}
                                </button>
                              )}

                              <button
                                onClick={() => window.open(orderApi.getReceiptDownloadUrl(ord.id), '_blank')}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                                title="Download PDF Receipt"
                              >
                                <FileText size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 4. TODAY'S CANTEEN STATUS TAB */}
        {/* ============================================================= */}
        {activeTab === 'canteen_status' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Today's Canteen Status
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Update today's operational status (Open, Paused, Closing Soon, Closed), hours, and broadcast notices to all students.
                </p>
              </div>

              <button
                onClick={fetchCanteenStatus}
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem' }}
              >
                <RefreshCw size={15} />
                <span>Reload Status</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Left Column: Controls Form */}
              <div className="surface-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', margin: '0 0 1.25rem' }}>
                  Operating Status Controls
                </h3>

                <form onSubmit={handleSaveCanteenStatus}>
                  {/* Status Options Grid */}
                  <label className="form-label" style={{ marginBottom: '0.75rem' }}>
                    Select Operating Mode *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {/* Open */}
                    <div
                      onClick={() => setCanteenForm({ ...canteenForm, status: 'open' })}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${canteenForm.status === 'open' ? 'var(--fresh-green)' : 'var(--border-light)'}`,
                        background: canteenForm.status === 'open' ? 'rgba(38, 118, 83, 0.08)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--fresh-green)', fontSize: '0.9rem' }}>
                        <Store size={18} />
                        <span>Open for Orders</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Students can browse and place pre-orders normally.
                      </div>
                    </div>

                    {/* Temporarily Paused */}
                    <div
                      onClick={() => setCanteenForm({ ...canteenForm, status: 'paused' })}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${canteenForm.status === 'paused' ? '#f59e0b' : 'var(--border-light)'}`,
                        background: canteenForm.status === 'paused' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#b45309', fontSize: '0.9rem' }}>
                        <PauseCircle size={18} />
                        <span>Temporarily Paused</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Stops new orders. Existing orders remain visible.
                      </div>
                    </div>

                    {/* Closing Soon */}
                    <div
                      onClick={() => setCanteenForm({ ...canteenForm, status: 'closing_soon' })}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${canteenForm.status === 'closing_soon' ? '#ea580c' : 'var(--border-light)'}`,
                        background: canteenForm.status === 'closing_soon' ? 'rgba(234, 88, 12, 0.08)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#c2410c', fontSize: '0.9rem' }}>
                        <Clock size={18} />
                        <span>Closing Soon</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Shows countdown notice and closing cutoff time.
                      </div>
                    </div>

                    {/* Closed for Today */}
                    <div
                      onClick={() => setCanteenForm({ ...canteenForm, status: 'closed' })}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${canteenForm.status === 'closed' ? '#dc2626' : 'var(--border-light)'}`,
                        background: canteenForm.status === 'closed' ? 'rgba(220, 38, 38, 0.08)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#b91c1c', fontSize: '0.9rem' }}>
                        <X size={18} />
                        <span>Closed for Today</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Blocks all new orders and displays reason to students.
                      </div>
                    </div>
                  </div>

                  {/* Operating Times */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Today's Opening Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={canteenForm.opening_time}
                        onChange={(e) => setCanteenForm({ ...canteenForm, opening_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Today's Closing Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={canteenForm.closing_time}
                        onChange={(e) => setCanteenForm({ ...canteenForm, closing_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Broadcast Notice Input */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Campus Broadcast Notice (Displayed to all students)</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder="e.g. Lunch orders are open until 2:00 PM. High demand on hot snacks today!"
                      value={canteenForm.notice}
                      onChange={(e) => setCanteenForm({ ...canteenForm, notice: e.target.value })}
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Quick Notice Presets (Click to apply):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => applyStatusPreset('open', 'Welcome! Lunch orders are open until 2:00 PM.')}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                      >
                        Lunch Open (until 2 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatusPreset('paused', 'Heavy rush in kitchen! Orders paused for 15 minutes to clear queue.')}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                      >
                        High Demand / 15m Delay
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatusPreset('closing_soon', 'Kitchen closing at 2:00 PM. Please place final orders now!')}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                      >
                        Closing Soon Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatusPreset('closed', 'Canteen is closed for today. Thank you for dining with us!')}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                      >
                        Closed for Today
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={canteenSaving}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem' }}
                  >
                    {canteenSaving ? 'Saving to Database...' : "Save & Broadcast Today's Status"}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Student Dashboard Preview */}
              <div className="surface-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', margin: '0 0 0.5rem' }}>
                  Live Student View Preview
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>
                  Here is how the status banner looks on the Student Dashboard:
                </p>

                {/* Banner Preview */}
                <div style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', background: 'var(--bg-cream)' }}>
                  {canteenForm.status === 'paused' ? (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <PauseCircle size={24} color="#d97706" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem' }}>
                          ⚠️ Online Ordering is Temporarily Paused
                        </div>
                        <div style={{ color: '#b45309', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                          {canteenForm.notice || 'The kitchen is handling high demand. Ordering will resume shortly.'}
                        </div>
                      </div>
                    </div>
                  ) : canteenForm.status === 'closed' ? (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <Store size={24} color="#dc2626" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.95rem' }}>
                          ⛔ Canteen is Closed for Today
                        </div>
                        <div style={{ color: '#b91c1c', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                          {canteenForm.notice || `Daily operating hours: ${canteenForm.opening_time || '08:00'} to ${canteenForm.closing_time || '20:00'}.`}
                        </div>
                      </div>
                    </div>
                  ) : canteenForm.status === 'closing_soon' ? (
                    <div
                      style={{
                        background: '#fff7ed',
                        border: '1.5px solid #fed7aa',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <Clock size={24} color="#ea580c" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '0.95rem' }}>
                          ⏰ Closing Soon · Order Cutoff at {canteenForm.closing_time || '20:00'}
                        </div>
                        <div style={{ color: '#c2410c', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                          {canteenForm.notice || 'Please place orders promptly before cutoff.'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(38, 118, 83, 0.08)',
                        border: '1.5px solid rgba(38, 118, 83, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <Store size={20} color="var(--fresh-green)" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '0.85rem', color: 'var(--forest-green)', fontWeight: 600 }}>
                        <span style={{ fontWeight: 800 }}>Canteen Open ({canteenForm.opening_time} - {canteenForm.closing_time}):</span>{' '}
                        {canteenForm.notice || 'Online pre-orders are open!'}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Backend Policy Enforced:
                    </div>
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                      {canteenForm.status === 'open' && (
                        <li>Students can browse menu and submit new pre-orders normally.</li>
                      )}
                      {canteenForm.status === 'paused' && (
                        <li>Backend API strictly rejects new order creation (HTTP 403 with notice).</li>
                      )}
                      {canteenForm.status === 'closing_soon' && (
                        <li>Warning displayed to students with closing cutoff time.</li>
                      )}
                      {canteenForm.status === 'closed' && (
                        <li>Backend rejects all new checkout requests. Existing tokens remain active.</li>
                      )}
                      <li>Status persists across application restarts in MySQL table <code>canteen_status</code>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* 5. PAYMENT MANAGEMENT TAB */}
        {/* ============================================================= */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Payment Management & Audit
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Verify incoming student UPI transfers using UTR reference numbers and confirm Cash / Card receipts at the counter.
                </p>
              </div>

              <button
                onClick={fetchPayments}
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem' }}
                disabled={loadingPayments}
              >
                <RefreshCw size={15} className={loadingPayments ? 'spin' : ''} />
                <span>Refresh Payments</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="surface-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '220px', height: '38px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="PENDING_VERIFICATION">Awaiting UPI Check (Review)</option>
                  <option value="PENDING">Counter Payment Due (Cash/Card)</option>
                  <option value="PAID">Confirmed / Paid</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Method:</span>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '180px', height: '38px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Methods</option>
                  <option value="UPI">UPI Only</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>
            </div>

            {/* Payments Table */}
            {loadingPayments ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Loading payment records from MySQL...
              </div>
            ) : paymentOrders.length === 0 ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CreditCard size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, margin: 0 }}>No matching payment records found.</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TOKEN & ORDER</th>
                      <th>STUDENT CUSTOMER</th>
                      <th>AMOUNT</th>
                      <th>METHOD</th>
                      <th>TRANSACTION REF / UTR</th>
                      <th>PAYMENT STATUS</th>
                      <th>VERIFICATION DETAILS</th>
                      <th style={{ textAlign: 'right' }}>STAFF ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentOrders.map((ord) => {
                      const isConfirming = confirmingPaymentId === ord.id;
                      const isPaid = ord.payment_status === 'PAID';
                      const isUpiReview = ord.payment_status === 'PENDING_VERIFICATION';

                      return (
                        <tr key={ord.id} style={{ background: isUpiReview ? 'rgba(245, 158, 11, 0.04)' : undefined }}>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--forest-green)', fontSize: '1.05rem' }}>
                              #{ord.token_number}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Order #{ord.id}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{ord.student_name}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{ord.student_email}</div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--forest-green)' }}>
                              ₹{parseFloat(ord.total_amount).toFixed(2)}
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: ord.payment_method === 'UPI' ? '#0369a1' : 'var(--text-dark)'
                              }}
                            >
                              {ord.payment_method === 'UPI' ? (
                                <QrCode size={14} color="#0284c7" />
                              ) : ord.payment_method === 'Cash' ? (
                                <Banknote size={14} color="var(--fresh-green)" />
                              ) : (
                                <CreditCard size={14} color="#b45309" />
                              )}
                              <span>{ord.payment_method}</span>
                            </span>
                          </td>

                          <td>
                            {ord.transaction_ref ? (
                              <div
                                style={{
                                  background: 'var(--bg-cream)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: 'var(--forest-green)'
                                }}
                              >
                                {ord.transaction_ref}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Not provided (Counter)
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: isPaid ? '#dcfce7' : isUpiReview ? '#fef3c7' : '#fee2e2',
                                color: isPaid ? '#15803d' : isUpiReview ? '#b45309' : '#b91c1c'
                              }}
                            >
                              {isPaid ? 'PAID' : isUpiReview ? 'REVIEW PENDING' : 'COUNTER DUE'}
                            </span>
                          </td>

                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {isPaid ? (
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                                  Verified by {ord.verified_by_name || 'Admin'}
                                </div>
                                <div style={{ fontSize: '0.72rem' }}>
                                  {ord.verified_at ? new Date(ord.verified_at).toLocaleString('en-IN') : '—'}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Awaiting Confirmation</span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              {!isPaid && (
                                <button
                                  onClick={() => handleConfirmPayment(ord.id, ord.token_number, ord.payment_method)}
                                  disabled={isConfirming}
                                  className={isUpiReview ? 'btn btn-primary' : 'btn btn-orange'}
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }}
                                >
                                  {isConfirming ? (
                                    <RefreshCw size={12} className="spin" />
                                  ) : isUpiReview ? (
                                    'Verify UPI'
                                  ) : (
                                    'Confirm Cash/Card'
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => window.open(orderApi.getReceiptDownloadUrl(ord.id), '_blank')}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                                title="Download PDF receipt"
                              >
                                <FileText size={13} />
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 6. STUDENTS TAB (User Accounts) */}
        {/* ============================================================= */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Students & User Accounts
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Manage registered student accounts and access status. Passwords and credentials are strictly protected.
                </p>
              </div>

              <button
                onClick={fetchUsers}
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem' }}
                disabled={loadingUsers}
              >
                <RefreshCw size={15} className={loadingUsers ? 'spin' : ''} />
                <span>Refresh Accounts</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="surface-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={15} color="var(--text-muted)" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '160px', height: '40px' }}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            {/* Accounts Table */}
            {loadingUsers ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Loading accounts from database...
              </div>
            ) : users.length === 0 ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, margin: 0 }}>No matching accounts found.</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>USER PROFILE</th>
                      <th>EMAIL ADDRESS</th>
                      <th>ROLE</th>
                      <th>AUTH PROVIDER</th>
                      <th>STATUS</th>
                      <th>JOINED DATE</th>
                      <th style={{ textAlign: 'right' }}>ACCESS ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isCurrentUser = u.id === user?.id;
                      const isToggling = togglingUserId === u.id;

                      return (
                        <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.65 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: u.role === 'admin' ? 'var(--forest-green)' : 'var(--fresh-green)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                                  {u.name}
                                  {isCurrentUser && (
                                    <span style={{ fontSize: '0.72rem', background: 'var(--warm-orange-light)', color: '#b46b14', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>
                                      You
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-dark)', fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Mail size={13} color="var(--text-muted)" />
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: u.role === 'admin' ? 'rgba(23, 76, 60, 0.12)' : 'rgba(38, 118, 83, 0.12)',
                                color: u.role === 'admin' ? 'var(--forest-green)' : 'var(--fresh-green)'
                              }}
                            >
                              {u.role === 'admin' && <ShieldCheck size={12} />}
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: u.auth_provider === 'google' ? '#2563eb' : 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>
                              {u.auth_provider === 'google' ? 'Google OAuth' : 'Local Account'}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: u.is_active ? '#dcfce7' : '#fee2e2',
                                color: u.is_active ? '#15803d' : '#b91c1c'
                              }}
                            >
                              {u.is_active ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isCurrentUser ? (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Master Admin
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={isToggling}
                                className={u.is_active ? 'btn btn-outline-danger' : 'btn btn-secondary'}
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                              >
                                {isToggling ? (
                                  <RefreshCw size={12} className="spin" />
                                ) : u.is_active ? (
                                  'Deactivate'
                                ) : (
                                  'Reactivate'
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 7. SALES AND REPORTS TAB */}
        {/* ============================================================= */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Sales & Operational Reports
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Real-time aggregated sales figures, revenue, top-selling items, and payment method statistics from MySQL.
                </p>
              </div>

              <button
                onClick={fetchReports}
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem' }}
                disabled={loadingReports}
              >
                <RefreshCw size={15} className={loadingReports ? 'spin' : ''} />
                <span>Refresh Analytics</span>
              </button>
            </div>

            {loadingReports || !reports ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Aggregating real sales data from MySQL...
              </div>
            ) : (
              <div>
                {/* Time-Based Revenue Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="surface-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--fresh-green)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY'S SALES</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--forest-green)', margin: '0.2rem 0' }}>
                      ₹{reports.summary.todayRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {reports.summary.todayOrders} orders placed today
                    </div>
                  </div>

                  <div className="surface-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warm-orange)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>THIS WEEK'S SALES</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', margin: '0.2rem 0' }}>
                      ₹{reports.summary.weekRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {reports.summary.weekOrders} orders this week
                    </div>
                  </div>

                  <div className="surface-card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>THIS MONTH'S SALES</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0369a1', margin: '0.2rem 0' }}>
                      ₹{reports.summary.monthRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {reports.summary.monthOrders} orders this month
                    </div>
                  </div>

                  <div className="surface-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--forest-green)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALL-TIME REVENUE</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--forest-green)', margin: '0.2rem 0' }}>
                      ₹{reports.summary.allTimeRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {reports.summary.allTimeOrders} total orders processed
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Top 5 Selling Dishes */}
                  <div className="surface-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <Flame size={20} color="var(--warm-orange)" />
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', margin: 0 }}>
                        Top 5 Best-Selling Dishes
                      </h3>
                    </div>

                    {reports.topItems.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No dish sales recorded yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {reports.topItems.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingBottom: '0.75rem',
                              borderBottom: '1px dashed var(--border-light)'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--forest-green)', fontSize: '0.92rem' }}>
                                #{idx + 1} {item.item_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {item.total_sold} units served
                              </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--fresh-green)' }}>
                              ₹{parseFloat(item.total_revenue || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Method Distribution */}
                  <div className="surface-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <CreditCard size={20} color="var(--fresh-green)" />
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', margin: 0 }}>
                        Payment Method Breakdown
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {reports.paymentMethods.map((pm, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-cream)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pm.payment_method}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pm.count} orders</div>
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--forest-green)', fontSize: '1rem' }}>
                            ₹{parseFloat(pm.revenue || 0).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="surface-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', margin: '0 0 1rem' }}>
                    Order Status Breakdown
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {reports.statusCounts.map((sc) => (
                      <div
                        key={sc.status}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-cream)',
                          borderRadius: 'var(--radius-sm)',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {sc.status}
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--forest-green)', marginTop: '0.2rem' }}>
                          {sc.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 7. RECEIPTS TAB */}
        {/* ============================================================= */}
        {activeTab === 'receipts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Order & Payment Receipts
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Search, review, and print or download official receipts for all student canteen orders.
                </p>
              </div>

              <button
                onClick={fetchOrders}
                className="btn btn-secondary"
                style={{ fontSize: '0.88rem' }}
                disabled={loadingOrders}
              >
                <RefreshCw size={15} className={loadingOrders ? 'spin' : ''} />
                <span>Refresh Receipts</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="surface-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search by Token (e.g. T001), Receipt #, or Student Name..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  className="form-input"
                  style={{ height: '40px', fontSize: '0.88rem' }}
                />
                {receiptSearch && (
                  <button
                    onClick={() => setReceiptSearch('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Payment Filter:</span>
                <select
                  value={receiptStatusFilter}
                  onChange={(e) => setReceiptStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '180px', height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Receipts</option>
                  <option value="PAID">Paid & Confirmed</option>
                  <option value="PENDING">Counter Payment Due</option>
                  <option value="PENDING_VERIFICATION">UPI Under Review</option>
                </select>
              </div>
            </div>

            {/* Receipts Data Table */}
            {loadingOrders && orders.length === 0 ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Loading receipts from database...
              </div>
            ) : (() => {
              const filteredReceipts = orders.filter((ord) => {
                const matchSearch =
                  !receiptSearch.trim() ||
                  (ord.token_number && ord.token_number.toLowerCase().includes(receiptSearch.toLowerCase())) ||
                  (ord.receipt_number && ord.receipt_number.toLowerCase().includes(receiptSearch.toLowerCase())) ||
                  (ord.student_name && ord.student_name.toLowerCase().includes(receiptSearch.toLowerCase())) ||
                  (ord.student_email && ord.student_email.toLowerCase().includes(receiptSearch.toLowerCase()));

                const matchStatus =
                  receiptStatusFilter === 'all' || ord.payment_status === receiptStatusFilter;

                return matchSearch && matchStatus;
              });

              return filteredReceipts.length === 0 ? (
                <div className="surface-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', margin: 0 }}>No receipts found</h3>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                    {receiptSearch ? 'No orders match your receipt search terms.' : 'All generated receipts will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>RECEIPT #</th>
                        <th>TOKEN</th>
                        <th>ORDER DATE & TIME</th>
                        <th>STUDENT DETAILS</th>
                        <th>ITEMS & QUANTITY</th>
                        <th>TOTAL AMOUNT</th>
                        <th>PAYMENT METHOD</th>
                        <th>PAYMENT STATUS</th>
                        <th style={{ textAlign: 'right' }}>OFFICIAL RECEIPT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceipts.map((ord) => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-dark)', fontSize: '0.88rem' }}>
                            {ord.receipt_number || `REC-${ord.id}`}
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--forest-green)', fontSize: '1.05rem' }}>
                            #{ord.token_number}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <div>{new Date(ord.created_at).toLocaleDateString('en-IN')}</div>
                            <div>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{ord.student_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ord.student_email}</div>
                          </td>
                          <td style={{ fontSize: '0.84rem' }}>
                            {(ord.items || []).map((it, idx) => (
                              <div key={idx}>
                                <strong>{it.quantity}x</strong> {it.item_name}
                              </div>
                            ))}
                          </td>
                          <td style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--forest-green)' }}>
                            ₹{parseFloat(ord.total_amount).toFixed(2)}
                          </td>
                          <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {ord.payment_method}
                            {ord.transaction_ref && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ref: {ord.transaction_ref}</div>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background:
                                  ord.payment_status === 'PAID'
                                    ? '#dcfce7'
                                    : ord.payment_status === 'PENDING_VERIFICATION'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                color:
                                  ord.payment_status === 'PAID'
                                    ? '#15803d'
                                    : ord.payment_status === 'PENDING_VERIFICATION'
                                    ? '#b45309'
                                    : '#b91c1c'
                              }}
                            >
                              {ord.payment_status === 'PAID'
                                ? 'PAID · CONFIRMED'
                                : ord.payment_status === 'PENDING_VERIFICATION'
                                ? 'UNDER REVIEW'
                                : 'PAYMENT PENDING'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => window.open(orderApi.getReceiptDownloadUrl(ord.id), '_blank')}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', gap: '6px' }}
                              title="Stream / Download Official PDF Receipt"
                            >
                              <FileText size={15} color="var(--forest-green)" />
                              <span>View PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* ============================================================= */}
        {/* 9. NOTIFICATIONS TAB */}
        {/* ============================================================= */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                  Owner Operational Alerts
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Real-time database-backed notifications for student orders, payments needing verification, and queue alerts.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={fetchOwnerNotifications}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.88rem' }}
                  disabled={loadingNotifications}
                >
                  <RefreshCw size={15} className={loadingNotifications ? 'spin' : ''} />
                  <span>Refresh Alerts</span>
                </button>
                {ownerUnreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotifsRead}
                    className="btn btn-primary"
                    style={{ fontSize: '0.88rem' }}
                  >
                    <CheckCheck size={16} />
                    <span>Mark All Read</span>
                  </button>
                )}
              </div>
            </div>

            {loadingNotifications ? (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Loading notifications...
              </div>
            ) : ownerNotifications.length === 0 ? (
              <div className="surface-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', margin: 0 }}>No operational alerts</h3>
                <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  When students place new orders or submit payment references, notifications will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {ownerNotifications.map((notif) => {
                  const isRead = notif.is_read;
                  return (
                    <div
                      key={notif.id}
                      className="surface-card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        borderLeft: isRead ? '4px solid #cbd5e1' : '4px solid var(--warm-orange)',
                        background: isRead ? 'var(--bg-surface)' : 'rgba(244, 163, 64, 0.04)'
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background:
                            notif.type === 'payment_review'
                              ? '#fef3c7'
                              : notif.type === 'order_created'
                              ? 'var(--fresh-green-light)'
                              : 'var(--bg-cream)',
                          color:
                            notif.type === 'payment_review'
                              ? '#b45309'
                              : notif.type === 'order_created'
                              ? 'var(--fresh-green)'
                              : 'var(--forest-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {notif.type === 'payment_review' ? (
                          <CreditCard size={20} />
                        ) : notif.type === 'order_created' ? (
                          <ShoppingBag size={20} />
                        ) : (
                          <Bell size={20} />
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', color: isRead ? 'var(--text-dark)' : 'var(--forest-green)', fontWeight: 800 }}>
                            {notif.title}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: 1.45 }}>
                          {notif.message}
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          {notif.token_number && (
                            <button
                              onClick={() => {
                                handleMarkNotifRead(notif.id, isRead);
                                setOrderSearch(notif.token_number);
                                setActiveTab('tracker');
                                fetchOrders();
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.76rem', gap: '4px' }}
                            >
                              <Ticket size={13} />
                              <span>View Token #{notif.token_number}</span>
                            </button>
                          )}

                          {!isRead && (
                            <button
                              onClick={() => handleMarkNotifRead(notif.id, isRead)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--forest-green)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* 10. SETTINGS TAB */}
        {/* ============================================================= */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
                Canteen & Account Settings
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Operational configurations, UPI payment recipient details, pickup counter stations, and Owner security settings.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Card 1: Canteen Profile & UPI Details */}
              <div className="surface-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                  <Store size={22} color="var(--forest-green)" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--forest-green)', margin: 0 }}>Canteen & UPI Configuration</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CANTEEN DISPLAY NAME</label>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--forest-green)' }}>
                      {paymentConfig.canteen_name || 'Campus Canteen'}
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CONFIGURED UPI ID (REAL RECEIVER)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-cream)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <QrCode size={18} color="var(--forest-green)" />
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>{paymentConfig.upi_id}</span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>UPI DISPLAY / ACCOUNT HOLDER</label>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{paymentConfig.upi_name}</div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PICKUP COUNTER STATIONS</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                      <div>• <strong>Bay #1:</strong> Hot Meals & Lunch Trays</div>
                      <div>• <strong>Bay #2:</strong> Snacks, Quick Bites & Bakery</div>
                      <div>• <strong>Counter 3:</strong> Beverages Bar & Cold Drinks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Single Master Owner Profile */}
              <div className="surface-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                  <ShieldCheck size={22} color="var(--forest-green)" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--forest-green)', margin: 0 }}>Master Owner Profile</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AUTHORIZED OWNER NAME</label>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--forest-green)' }}>{user?.name}</div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>OFFICIAL OWNER LOGIN EMAIL</label>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.email}</div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ROLE DESIGNATION</label>
                    <span className="badge badge-admin" style={{ fontSize: '0.8rem', padding: '3px 10px' }}>
                      OWNER (Full Administrative Access)
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <strong>Security Policy:</strong> Exactly one master OWNER account exists for this application. Student accounts cannot promote themselves.
                  </div>
                </div>
              </div>

              {/* Card 3: Change Owner Password */}
              <div className="surface-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                  <KeyRound size={22} color="var(--forest-green)" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--forest-green)', margin: 0 }}>Update Owner Password</h3>
                </div>

                {passwordAlert && (
                  <AlertMessage type={passwordAlert.type} message={passwordAlert.text} />
                )}

                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label className="form-label">Current Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (Min 6 Characters) *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {passwordSubmitting ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODAL: ADD / EDIT MENU ITEM */}
        {/* ============================================================= */}
        {isMenuModalOpen && (
          <div className="modal-overlay" onClick={() => setIsMenuModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', margin: 0 }}>
                  {editingItem ? 'Edit Food Item Details' : 'Add New Food Item to Menu'}
                </h3>
                <button
                  onClick={() => setIsMenuModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleMenuFormSubmit}>
                <div className="modal-body">
                  <AlertMessage type="error" message={menuFormError} />

                  <div className="form-group">
                    <label className="form-label">Food Item Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Masala Dosa, Paneer Butter Masala, Cold Coffee"
                      value={menuForm.name}
                      onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Price (INR ₹) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        className="form-input"
                        placeholder="e.g. 75"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-input"
                        value={menuForm.category}
                        onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                      >
                        <option value="Meals">Meals</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Ingredients, preparation style, allergen notes..."
                      value={menuForm.description}
                      onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Prep Time (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={menuForm.prep_time_minutes}
                        onChange={(e) => setMenuForm({ ...menuForm, prep_time_minutes: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Availability Status</label>
                      <select
                        className="form-input"
                        value={menuForm.is_available ? 'true' : 'false'}
                        onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.value === 'true' })}
                      >
                        <option value="true">🟢 Available</option>
                        <option value="false">🔴 Sold Out / Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                      <input
                        type="checkbox"
                        checked={menuForm.is_featured}
                        onChange={(e) => setMenuForm({ ...menuForm, is_featured: e.target.checked })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--forest-green)' }}>
                        ⭐ Mark as Today's Special Dish (Highlighted on Student Dashboard)
                      </span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Photo Image URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://images.unsplash.com/..."
                      value={menuForm.image_url}
                      onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={menuFormSubmitting}
                    className="btn btn-primary"
                  >
                    {menuFormSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODAL: DELETE CONFIRMATION */}
        {/* ============================================================= */}
        {deletingItem && (
          <div className="modal-overlay" onClick={() => setDeletingItem(null)}>
            <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={20} color="#dc2626" />
                  <span>Confirm Menu Item Deletion</span>
                </h3>
                <button
                  onClick={() => setDeletingItem(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', margin: 0 }}>
                  Are you sure you want to permanently delete <strong>"{deletingItem.name}"</strong> from the active canteen menu?
                </p>
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginTop: '1rem',
                    fontSize: '0.82rem',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ShieldCheck size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Order Safety Guarantee:</strong> Existing order receipts, token history, and sales reports will not be broken or deleted.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteItem}
                  disabled={deletingSubmitting}
                  className="btn btn-outline-danger"
                  style={{ background: '#fef2f2' }}
                >
                  {deletingSubmitting ? 'Deleting...' : 'Yes, Delete Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
