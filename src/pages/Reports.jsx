import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabase'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

export default function Reports() {
    const [tab, setTab] = useState('daily')
    const [invoices, setInvoices] = useState([])
    const [patients, setPatients] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [invRes, patRes, apptRes] = await Promise.all([
            supabase.from('invoices').select('*, patients(full_name, patient_id)').order('issued_date', { ascending: false }),
            supabase.from('patients').select('*').order('created_at', { ascending: false }),
            supabase.from('appointments').select('*, patients(full_name), doctors(full_name)').order('appointment_date', { ascending: false }),
        ])
        setInvoices(invRes.data || [])
        setPatients(patRes.data || [])
        setAppointments(apptRes.data || [])
        setLoading(false)
    }

    // Daily collection
    const todayInvoices = invoices.filter(i => i.issued_date === today)
    const todayCollection = todayInvoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
    const todayTotal = todayInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)

    // Monthly revenue
    const monthlyData = {}
    invoices.forEach(inv => {
        const month = inv.issued_date?.slice(0, 7)
        if (month) {
            if (!monthlyData[month]) monthlyData[month] = { month, revenue: 0, collected: 0, count: 0 }
            monthlyData[month].revenue += Number(inv.total_amount || 0)
            monthlyData[month].collected += Number(inv.paid_amount || 0)
            monthlyData[month].count++
        }
    })
    const monthlyChart = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

    // Outstanding
    const outstanding = invoices.filter(i => i.status !== 'paid')
    const totalOutstanding = outstanding.reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount)), 0)

    // Gender distribution
    const genderData = []
    const genders = {}
    patients.forEach(p => { genders[p.gender || 'unknown'] = (genders[p.gender || 'unknown'] || 0) + 1 })
    Object.entries(genders).forEach(([name, value]) => genderData.push({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

    // Age distribution
    const ageGroups = { '0-18': 0, '19-35': 0, '36-55': 0, '56+': 0 }
    patients.forEach(p => {
        if (!p.date_of_birth) return
        const age = Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        if (age <= 18) ageGroups['0-18']++
        else if (age <= 35) ageGroups['19-35']++
        else if (age <= 55) ageGroups['36-55']++
        else ageGroups['56+']++
    })
    const ageChart = Object.entries(ageGroups).map(([name, value]) => ({ name, value }))

    const exportCSV = (data, filename) => {
        if (!data.length) return
        const headers = Object.keys(data[0])
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}_${today}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const exportInvoices = () => {
        const data = invoices.map(i => ({
            Invoice: i.invoice_number, Patient: i.patients?.full_name, Date: i.issued_date,
            Total: i.total_amount, Paid: i.paid_amount, Status: i.status, Method: i.payment_method || ''
        }))
        exportCSV(data, 'invoices_report')
    }

    const exportPatients = () => {
        const data = patients.map(p => ({
            ID: p.patient_id, Name: p.full_name, DOB: p.date_of_birth || '', Gender: p.gender,
            Phone: p.phone || '', Email: p.email || '', BloodGroup: p.blood_group || ''
        }))
        exportCSV(data, 'patients_report')
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-toolbar">
                <div className="filter-tabs">
                    {[
                        { key: 'daily', label: 'Daily Collection', icon: Calendar },
                        { key: 'monthly', label: 'Monthly Revenue', icon: TrendingUp },
                        { key: 'outstanding', label: 'Outstanding Dues', icon: AlertCircle },
                        { key: 'demographics', label: 'Demographics', icon: Calendar },
                    ].map(t => (
                        <button key={t.key} className={`filter-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={exportInvoices}><Download size={14} /> Export Invoices</button>
                    <button className="btn btn-secondary btn-sm" onClick={exportPatients}><Download size={14} /> Export Patients</button>
                </div>
            </div>

            {tab === 'daily' && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card emerald">
                            <div className="stat-info">
                                <h4>Today's Collection</h4>
                                <div className="stat-value">₹{todayCollection.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card blue">
                            <div className="stat-info">
                                <h4>Today's Billed</h4>
                                <div className="stat-value">₹{todayTotal.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card amber">
                            <div className="stat-info">
                                <h4>Today's Invoices</h4>
                                <div className="stat-value">{todayInvoices.length}</div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3>Today's Invoices — {new Date().toLocaleDateString()}</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Paid</th><th>Status</th><th>Method</th></tr></thead>
                                <tbody>
                                    {todayInvoices.map(i => (
                                        <tr key={i.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{i.invoice_number}</td>
                                            <td>{i.patients?.full_name}</td>
                                            <td>₹{Number(i.total_amount).toLocaleString()}</td>
                                            <td>₹{Number(i.paid_amount).toLocaleString()}</td>
                                            <td><span className={`badge ${i.status}`}>{i.status}</span></td>
                                            <td>{i.payment_method || '—'}</td>
                                        </tr>
                                    ))}
                                    {todayInvoices.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--slate-400)' }}>No invoices today</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {tab === 'monthly' && (
                <div className="dashboard-grid">
                    <div className="card full-width">
                        <div className="card-header"><h3>Monthly Revenue Overview</h3></div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyChart}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                    <Legend />
                                    <Bar name="Billed" dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    <Bar name="Collected" dataKey="collected" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="card full-width">
                        <div className="card-header"><h3>Monthly Breakdown</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Month</th><th>Invoices</th><th>Billed</th><th>Collected</th><th>Collection %</th></tr></thead>
                                <tbody>
                                    {monthlyChart.map(m => (
                                        <tr key={m.month}>
                                            <td style={{ fontWeight: 600 }}>{m.month}</td>
                                            <td>{m.count}</td>
                                            <td>₹{m.revenue.toLocaleString()}</td>
                                            <td>₹{m.collected.toLocaleString()}</td>
                                            <td style={{ fontWeight: 600, color: m.revenue > 0 ? (m.collected / m.revenue >= 0.8 ? 'var(--success)' : 'var(--warning)') : 'var(--slate-400)' }}>
                                                {m.revenue > 0 ? Math.round((m.collected / m.revenue) * 100) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'outstanding' && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card rose">
                            <div className="stat-info">
                                <h4>Total Outstanding</h4>
                                <div className="stat-value">₹{totalOutstanding.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card amber">
                            <div className="stat-info">
                                <h4>Pending Invoices</h4>
                                <div className="stat-value">{outstanding.length}</div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3>Outstanding Dues</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Invoice</th><th>Patient</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                                <tbody>
                                    {outstanding.map(i => (
                                        <tr key={i.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{i.invoice_number}</td>
                                            <td>{i.patients?.full_name}</td>
                                            <td>{new Date(i.issued_date).toLocaleDateString()}</td>
                                            <td>₹{Number(i.total_amount).toLocaleString()}</td>
                                            <td>₹{Number(i.paid_amount).toLocaleString()}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{(Number(i.total_amount) - Number(i.paid_amount)).toLocaleString()}</td>
                                            <td><span className={`badge ${i.status}`}>{i.status}</span></td>
                                        </tr>
                                    ))}
                                    {outstanding.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--slate-400)' }}>No outstanding dues! 🎉</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {tab === 'demographics' && (
                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header"><h3>Gender Distribution</h3></div>
                        <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={genderData} cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} (${value})`} dataKey="value">
                                        {genderData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3>Age Distribution</h3></div>
                        <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={ageChart} cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} (${value})`} dataKey="value">
                                        {ageChart.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
