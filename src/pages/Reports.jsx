import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, AlertCircle, PieChart as PieIcon } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabase'
import { SkeletonCard } from '../components/SkeletonLoader'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

export default function Reports() {
    const [tab, setTab] = useState('monthly')
    const [invoices, setInvoices] = useState([])
    const [patients, setPatients] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [invRes, patRes, apptRes] = await Promise.all([
            supabase.from('invoices').select('*, patients(full_name, patient_id), invoice_items(description, quantity, unit_price)').order('issued_date', { ascending: false }),
            supabase.from('patients').select('*').order('created_at', { ascending: false }),
            supabase.from('appointments').select('*, patients(full_name), doctors(full_name)').order('appointment_date', { ascending: false }),
        ])
        setInvoices(invRes.data || [])
        setPatients(patRes.data || [])
        setAppointments(apptRes.data || [])
        setLoading(false)
    }

    // --- a) Monthly Revenue ---
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
    const monthlyChart = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)

    // --- b) Annual Revenue ---
    const yearlyData = {}
    invoices.forEach(inv => {
        const year = inv.issued_date?.slice(0, 4)
        if (year) {
            if (!yearlyData[year]) yearlyData[year] = { year, revenue: 0, collected: 0, count: 0 }
            yearlyData[year].revenue += Number(inv.total_amount || 0)
            yearlyData[year].collected += Number(inv.paid_amount || 0)
            yearlyData[year].count++
        }
    })
    const yearlyChart = Object.values(yearlyData).sort((a, b) => a.year.localeCompare(b.year))

    // --- c) Treatment-wise Revenue ---
    const treatmentData = {}
    invoices.forEach(inv => {
        (inv.invoice_items || []).forEach(item => {
            const desc = item.description || 'Other'
            if (!treatmentData[desc]) treatmentData[desc] = { name: desc, value: 0, count: 0 }
            treatmentData[desc].value += Number(item.unit_price || 0) * Number(item.quantity || 1)
            treatmentData[desc].count++
        })
    })
    const treatmentChart = Object.values(treatmentData).sort((a, b) => b.value - a.value).slice(0, 10)

    // --- d) Conversion Rate ---
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(a => a.status === 'completed').length
    const totalPatients = patients.length
    const patientsWithInvoices = new Set(invoices.map(i => i.patient_id)).size
    const appointmentConversion = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
    const patientConversion = totalPatients > 0 ? Math.round((patientsWithInvoices / totalPatients) * 100) : 0

    const exportCSV = (data, filename) => {
        if (!data.length) return
        const headers = Object.keys(data[0])
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${filename}_${today}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    const exportInvoices = () => {
        const data = invoices.map(i => ({
            Invoice: i.invoice_number, Patient: i.patients?.full_name, Date: i.issued_date,
            Total: i.total_amount, Paid: i.paid_amount, Status: i.status, Method: i.payment_method || ''
        }))
        exportCSV(data, 'invoices_report')
    }

    if (loading) return <div className="page-fade-in"><SkeletonCard /><div style={{ marginTop: 16 }}><SkeletonCard /></div></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div className="filter-tabs">
                    {[
                        { key: 'monthly', label: 'a) Monthly Revenue' },
                        { key: 'annual', label: 'b) Annual Revenue' },
                        { key: 'treatment', label: 'c) Treatment Revenue' },
                        { key: 'conversion', label: 'd) Conversion Rate' },
                    ].map(t => (
                        <button key={t.key} className={`filter-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={exportInvoices}><Download size={14} /> Export</button>
            </div>

            {/* a) Monthly Revenue */}
            {tab === 'monthly' && (
                <div className="dashboard-grid">
                    <div className="card full-width">
                        <div className="card-header"><h3>16a) Monthly Revenue</h3></div>
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

            {/* b) Annual Revenue */}
            {tab === 'annual' && (
                <div className="dashboard-grid">
                    <div className="card full-width">
                        <div className="card-header"><h3>16b) Annual Revenue</h3></div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={yearlyChart}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                    <Legend />
                                    <Bar name="Total Revenue" dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    <Bar name="Collected" dataKey="collected" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="card full-width">
                        <div className="card-header"><h3>Yearly Breakdown</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Year</th><th>Invoices</th><th>Revenue</th><th>Collected</th><th>Collection %</th></tr></thead>
                                <tbody>
                                    {yearlyChart.map(y => (
                                        <tr key={y.year}>
                                            <td style={{ fontWeight: 600 }}>{y.year}</td>
                                            <td>{y.count}</td>
                                            <td>₹{y.revenue.toLocaleString()}</td>
                                            <td>₹{y.collected.toLocaleString()}</td>
                                            <td style={{ fontWeight: 600, color: y.revenue > 0 ? (y.collected / y.revenue >= 0.8 ? 'var(--success)' : 'var(--warning)') : 'var(--slate-400)' }}>
                                                {y.revenue > 0 ? Math.round((y.collected / y.revenue) * 100) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                    {yearlyChart.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--slate-400)' }}>No data</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* c) Treatment-wise Revenue */}
            {tab === 'treatment' && (
                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header"><h3>16c) Treatment-wise Revenue</h3></div>
                        <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                            {treatmentChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={treatmentChart} cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => `${name.slice(0, 15)}… ₹${value.toLocaleString()}`} dataKey="value">
                                            {treatmentChart.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p style={{ color: 'var(--slate-400)', padding: 40 }}>No treatment data</p>}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3>Top Treatments by Revenue</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>#</th><th>Treatment</th><th>Count</th><th>Revenue</th></tr></thead>
                                <tbody>
                                    {treatmentChart.map((t, idx) => (
                                        <tr key={t.name}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontWeight: 500 }}>{t.name}</td>
                                            <td>{t.count}</td>
                                            <td style={{ fontWeight: 600 }}>₹{t.value.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {treatmentChart.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--slate-400)' }}>No data</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* d) Conversion Rate */}
            {tab === 'conversion' && (
                <div>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        <div className="stat-card emerald">
                            <div className="stat-info">
                                <h4>Total Patients</h4>
                                <div className="stat-value">{totalPatients}</div>
                            </div>
                        </div>
                        <div className="stat-card blue">
                            <div className="stat-info">
                                <h4>Patients with Billing</h4>
                                <div className="stat-value">{patientsWithInvoices}</div>
                            </div>
                        </div>
                        <div className="stat-card amber">
                            <div className="stat-info">
                                <h4>Patient→Treatment Rate</h4>
                                <div className="stat-value">{patientConversion}%</div>
                            </div>
                        </div>
                        <div className="stat-card rose">
                            <div className="stat-info">
                                <h4>Total Appointments</h4>
                                <div className="stat-value">{totalAppointments}</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <div className="stat-info">
                                <h4>Completed Appointments</h4>
                                <div className="stat-value">{completedAppointments}</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <div className="stat-info">
                                <h4>Appointment Completion Rate</h4>
                                <div className="stat-value">{appointmentConversion}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 20 }}>
                        <div className="card-header"><h3>16d) Conversion Rate Analysis</h3></div>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                {/* Patient Conversion */}
                                <div style={{ flex: 1, minWidth: 200, textAlign: 'center', padding: 20 }}>
                                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
                                        <svg viewBox="0 0 36 36">
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${patientConversion}, 100`} />
                                            <text x="18" y="20.35" textAnchor="middle" fontSize="8" fill="var(--text-primary)" fontWeight="700">{patientConversion}%</text>
                                        </svg>
                                    </div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Patient to Treatment</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{patientsWithInvoices} of {totalPatients} patients</p>
                                </div>
                                {/* Appointment Conversion */}
                                <div style={{ flex: 1, minWidth: 200, textAlign: 'center', padding: 20 }}>
                                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
                                        <svg viewBox="0 0 36 36">
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${appointmentConversion}, 100`} />
                                            <text x="18" y="20.35" textAnchor="middle" fontSize="8" fill="var(--text-primary)" fontWeight="700">{appointmentConversion}%</text>
                                        </svg>
                                    </div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Appointment Completion</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{completedAppointments} of {totalAppointments} appointments</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
