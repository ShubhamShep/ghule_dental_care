import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Appointments from './pages/Appointments'
import Billing from './pages/Billing'
import InvoiceDetail from './pages/InvoiceDetail'
import DentalChart from './pages/DentalChart'
import Procedures from './pages/Procedures'
import TreatmentPlans from './pages/TreatmentPlans'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Prescriptions from './pages/Prescriptions'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/:id" element={<InvoiceDetail />} />
        <Route path="/dental-chart" element={<DentalChart />} />
        <Route path="/procedures" element={<Procedures />} />
        <Route path="/treatment-plans" element={<TreatmentPlans />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/ghule_dental_care">
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              borderRadius: '10px',
              padding: '12px 16px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
