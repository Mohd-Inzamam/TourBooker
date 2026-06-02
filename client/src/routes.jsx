import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
// Import layouts from the layout index
import { MainLayout, DashboardLayout, AuthLayout } from './layout';
import HomePage from './pages/Home/HomePage';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import CartPage from './pages/CartPage/CartPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import MessagesPage from './pages/MessagesPage/MessagesPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage/BookingConfirmationPage';

// Operator Pages
import OperatorDashboardHome from './pages/operator/OperatorDashboardHome';
import OperatorToursPage from './pages/operator/OperatorToursPage';
import CreateTourPage from './pages/operator/CreateTourPage';
import EditTourPage from './pages/operator/EditTourPage';
import AvailabilityPage from './pages/operator/AvailabilityPage';
import OperatorBookingsPage from './pages/operator/OperatorBookingsPage';
import PricingRulesPage from './pages/operator/PricingRulesPage/PricingRulesPage';
import OperatorUserDetailPage from './pages/operator/OperatorUserDetailPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import GuestRoute from './routes/GuestRoute';
// Admin Pages
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import AdminOperatorsPage from './pages/admin/AdminOperatorsPage';
import AdminOperatorDetailPage from './pages/admin/AdminOperatorDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminToursPage from './pages/admin/AdminToursPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage/AdminPromotionsPage';
// ==========================================
// Placeholder Page Components
// ==========================================
const Placeholder = ({ title }) => (
  <div style={{
    padding: '48px 24px',
    textAlign: 'center',
    background: 'var(--ag-surface, #ffffff)',
    borderRadius: '16px',
    boxShadow: 'var(--ag-shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--ag-text-main, #0f172a)' }}>
      {title} View
    </h1>
    <p style={{ color: 'var(--ag-text-muted, #64748b)', fontSize: '1.1rem' }}>
      This is a temporary placeholder component mapped for the '{title}' route.
    </p>
  </div>
);

// Mapped instances


const UserDashboard = () => <Placeholder title="User Profile / Dashboard" />;


// ==========================================
// Router Configuration 
// ==========================================
const router = createBrowserRouter([
  // ------------- 1. Public Group -------------
  // Uses MainLayout
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tours', element: <ToursPage /> },
      { path: 'tours/:tourId', element: <TourDetailPage /> },

      // ------------- 3. User Group -------------
      // Uses MainLayout as well
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'messages', element: <ProtectedRoute><MessagesPage /></ProtectedRoute> },
      { path: 'booking', element: <ProtectedRoute role="user"><BookingPage /></ProtectedRoute> },
      { path: 'my-bookings', element: <ProtectedRoute role="user"><MyBookingsPage /></ProtectedRoute> },
      { path: 'cart', element: <ProtectedRoute role="user"><CartPage /></ProtectedRoute> },
      { path: 'checkout', element: <ProtectedRoute role="user"><CheckoutPage /></ProtectedRoute> },
      { path: 'booking-confirmation', element: <ProtectedRoute role="user"><BookingConfirmationPage /></ProtectedRoute> },
    ],
  },

  // ------------- 2. Auth Group -------------
  // Uses AuthLayout & GuestRoute
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <GuestRoute><LoginPage /></GuestRoute> },
      { path: 'register', element: <GuestRoute><RegisterPage /></GuestRoute> },
      { path: 'forgot-password', element: <GuestRoute><ForgotPasswordPage /></GuestRoute> },
      { path: 'reset-password', element: <GuestRoute><ResetPasswordPage /></GuestRoute> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
      { path: '*', element: <NotFoundPage /> }
    ],
  },

  // ------------- 4. Operator Group -------------
  // Uses DashboardLayout
  {
    path: '/operator',
    element: <ProtectedRoute role="operator"><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <OperatorDashboardHome /> },
      { path: 'tours', element: <OperatorToursPage /> },
      { path: 'tours/create', element: <CreateTourPage /> },
      { path: 'tours/:tourId/edit', element: <EditTourPage /> },
      { path: 'tours/:tourId/availability', element: <AvailabilityPage /> },
      { path: 'bookings', element: <OperatorBookingsPage /> },
      { path: 'pricing', element: <PricingRulesPage /> },
      { path: 'users/:id', element: <OperatorUserDetailPage /> },
    ],
  },

  // ------------- 5. Admin Group -------------
  // Uses DashboardLayout
  {
    path: '/admin',
    element: <ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <AdminDashboardHome /> },
      { path: 'operators', element: <AdminOperatorsPage /> },
      { path: 'operators/:id', element: <AdminOperatorDetailPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'users/:id', element: <AdminUserDetailPage /> },
      { path: 'tours', element: <AdminToursPage /> },
      { path: 'promotions', element: <AdminPromotionsPage /> },
    ],
  }
]);

export default router;
