import { useState, useEffect } from 'react'
import { Search, Bell, Menu, Moon, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageTitles = {
    '/': { title: 'Dashboard', subtitle: 'Overview of your clinic' },
    '/patients': { title: 'Patients', subtitle: 'Manage patient records' },
    '/appointments': { title: 'Appointments', subtitle: 'Schedule & manage visits' },
    '/billing': { title: 'Billing', subtitle: 'Invoices & payments' },
    '/dental-chart': { title: 'Dental Chart', subtitle: 'Interactive tooth map' },
    '/procedures': { title: 'Procedures', subtitle: 'Dental procedure catalog' },
    '/treatment-plans': { title: 'Treatment Plans', subtitle: 'Multi-visit treatment tracking' },
    '/reports': { title: 'Reports', subtitle: 'Analytics & data export' },
    '/settings': { title: 'Settings', subtitle: 'Clinic configuration' },
}

export default function Header({ onMenuClick }) {
    const location = useLocation()
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
        localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    }, [darkMode])

    const pathBase = '/' + (location.pathname.split('/')[1] || '')
    const pageInfo = pageTitles[pathBase] || pageTitles['/']

    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={onMenuClick}>
                    <Menu size={22} />
                </button>
                <div className="header-title">
                    <h1>{pageInfo.title}</h1>
                    <p>{pageInfo.subtitle}</p>
                </div>
            </div>
            <div className="header-right">
                <div className="header-search">
                    <Search />
                    <input type="text" placeholder="Search..." />
                </div>
                <button className="header-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light mode' : 'Dark mode'}>
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="header-btn">
                    <Bell size={20} />
                    <span className="badge"></span>
                </button>
            </div>
        </header>
    )
}
