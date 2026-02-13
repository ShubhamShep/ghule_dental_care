import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, CalendarDays, Receipt,
    ClipboardList, Stethoscope, FileText, BarChart3,
    Settings as SettingsIcon, LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const mainNav = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/appointments', icon: CalendarDays, label: 'Appointments' },
    { path: '/billing', icon: Receipt, label: 'Billing' },
]

const dentalNav = [
    { path: '/dental-chart', icon: Stethoscope, label: 'Dental Chart' },
    { path: '/procedures', icon: ClipboardList, label: 'Procedures' },
    { path: '/treatment-plans', icon: FileText, label: 'Treatment Plans' },
]

const systemNav = [
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
    const { user, signOut } = useAuth()
    const location = useLocation()

    const userInitial = user?.email?.[0]?.toUpperCase() || 'U'

    const renderNavItems = (items) => items.map((item) => (
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
                        🦷
                    </div>
                    <div>
                        <h2>Ghule Dental</h2>
                        <p>Dental Care Clinic</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <span className="sidebar-section-title">Main Menu</span>
                    {renderNavItems(mainNav)}

                    <span className="sidebar-section-title" style={{ marginTop: 16 }}>Dental</span>
                    {renderNavItems(dentalNav)}

                    <span className="sidebar-section-title" style={{ marginTop: 16 }}>System</span>
                    {renderNavItems(systemNav)}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={signOut}>
                        <div className="sidebar-user-avatar">{userInitial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.email || 'User'}</div>
                            <div className="sidebar-user-email">Click to sign out</div>
                        </div>
                        <LogOut size={16} style={{ color: 'var(--slate-500)' }} />
                    </div>
                </div>
            </aside>
        </>
    )
}
