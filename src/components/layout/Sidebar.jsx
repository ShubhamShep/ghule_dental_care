import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, CalendarDays, Receipt,
    ClipboardList, Stethoscope, FileText, BarChart3,
    Settings as SettingsIcon, LogOut, Pill, History,
    FlaskConical, Search, FileCheck, Calculator, TrendingUp
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const mainNav = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/appointments', icon: CalendarDays, label: 'Appointments' },
    { path: '/billing', icon: Receipt, label: 'Payment' },
]

const dentalNav = [
    { path: '/dental-chart', icon: Stethoscope, label: 'Examination' },
    { path: '/past-dental-treatment', icon: History, label: 'Past Treatment' },
    { path: '/investigations', icon: FlaskConical, label: 'Investigations' },
    { path: '/diagnosis', icon: Search, label: 'Diagnosis' },
    { path: '/treatment-plans', icon: FileText, label: 'Treatment Plan' },
    { path: '/prescriptions', icon: Pill, label: 'Prescription' },
    { path: '/consent-forms', icon: FileCheck, label: 'Consent Form' },
    { path: '/procedures', icon: ClipboardList, label: 'Procedures' },
]

const systemNav = [
    { path: '/accounting', icon: Calculator, label: 'Accounting' },
    { path: '/reports', icon: TrendingUp, label: 'Analysis' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', adminOnly: true },
]

export default function Sidebar({ isOpen, onClose }) {
    const { user, role, signOut, isAdmin } = useAuth()
    const userInitial = user?.email?.[0]?.toUpperCase() || 'U'

    const renderNavItems = (items) => items
        .filter(item => !item.adminOnly || isAdmin)
        .map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
            >
                <item.icon />
                {item.label}
            </NavLink>
        ))

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <img src="/ghule_dental_care/logo.svg" alt="Ghule Dental" width="36" height="36" style={{ borderRadius: 8 }} />
                    </div>
                    <div>
                        <h2>Ghule Dental</h2>
                        <p>Dental Care Clinic</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <span className="sidebar-section-title">Main Menu</span>
                    {renderNavItems(mainNav)}

                    <span className="sidebar-section-title" style={{ marginTop: 16 }}>Clinical</span>
                    {renderNavItems(dentalNav)}

                    <span className="sidebar-section-title" style={{ marginTop: 16 }}>Management</span>
                    {renderNavItems(systemNav)}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={signOut}>
                        <div className="sidebar-user-avatar">{userInitial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.email || 'User'}</div>
                            <div className="sidebar-user-email">{role || 'user'} · Click to sign out</div>
                        </div>
                        <LogOut size={16} style={{ color: 'var(--slate-500)' }} />
                    </div>
                </div>
            </aside>
        </>
    )
}
