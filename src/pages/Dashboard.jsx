import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CalendarDays, IndianRupee, AlertCircle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { SkeletonStats, SkeletonChart } from '../components/SkeletonLoader'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

export default function Dashboard() {
    const [stats, setStats] = useState({ patients: 0, todayAppts: 0, revenue: 0, pendingInvoices: 0, newPatients: 0, outstanding: 0 })
    const [recentPatients, setRecentPatients] = useState([])
    const [upcomingAppts, setUpcomingAppts] = useState([])
    const [patientTrend, setPatientTrend] = useState([])
    const [revenueTrend, setRevenueTrend] = useState([])
    const [procedureRevenue, setProcedureRevenue] = useState([])
    const [todaySchedule, setTodaySchedule] = useState([])
    const [followUps, setFollowUps] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => { fetchDashboard() }, [])

    const fetchDashboard = async () => {
        const [patsRes, apptsRes, invoicesRes, todayRes, invoiceItemsRes] = await Promise.all([
            supabase.from('patients').select('id, full_name, patient_id, gender, phone, created_at').order('created_at', { ascending: false }),
            supabase.from('appointments').select('*, patients(full_name), doctors(full_name)').gte('appointment_date', today).order('appointment_date').order('appointment_time'),
            supabase.from('invoices').select('*, patients(full_name)').order('issued_date', { ascending: false }),
            supabase.from('appointments').select('*, patients(full_name, phone), doctors(full_name)').eq('appointment_date', today).order('appointment_time'),
            supabase.from('invoice_items').select('description, total'),
        ])

        const patients = patsRes.data || []
        const upcoming = (apptsRes.data || []).filter(a => a.status === 'scheduled')
        const invoices = invoicesRes.data || []
        const todayAppts = todayRes.data || []

        const totalRevenue = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
        const pendingInvs = invoices.filter(i => i.status !== 'paid')
        const totalOutstanding = pendingInvs.reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount)), 0)
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const newPats = patients.filter(p => new Date(p.created_at) >= thirtyDaysAgo)

        setStats({
            patients: patients.length,
            todayAppts: todayAppts.filter(a => a.status === 'scheduled').length,
            revenue: totalRevenue,
            pendingInvoices: pendingInvs.length,
            newPatients: newPats.length,
            outstanding: totalOutstanding,
        })

        setRecentPatients(patients.slice(0, 5))
        setUpcomingAppts(upcoming.slice(0, 5))
        setTodaySchedule(todayAppts)

        // Follow-ups: completed appointments in last 30 days
        const completedRecent = (apptsRes.data || []).filter(a =>
            a.status === 'completed' && new Date(a.appointment_date) >= thirtyDaysAgo
        ).slice(0, 5)
        setFollowUps(completedRecent)

        // Patient trend
        const monthCounts = {}
        patients.forEach(p => {
            const m = p.created_at?.slice(0, 7)
            if (m) monthCounts[m] = (monthCounts[m] || 0) + 1
        })
        setPatientTrend(Object.keys(monthCounts).sort().slice(-6).map(m => ({ month: m, count: monthCounts[m] })))

        // Revenue trend
        const revMonths = {}
        invoices.forEach(inv => {
            const m = inv.issued_date?.slice(0, 7)
            if (m) revMonths[m] = (revMonths[m] || 0) + Number(inv.paid_amount || 0)
        })
        setRevenueTrend(Object.keys(revMonths).sort().slice(-6).map(m => ({ month: m, revenue: revMonths[m] })))

        // Procedure revenue
        const procRevMap = {}
            ; (invoiceItemsRes.data || []).forEach(item => {
                const desc = item.description || 'Other'
                procRevMap[desc] = (procRevMap[desc] || 0) + Number(item.total || 0)
            })
        setProcedureRevenue(Object.entries(procRevMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })))

        setLoading(false)
    }

    if (loading) return (
        <div className="page-fade-in">
            <SkeletonStats />
            <div className="dashboard-grid" style={{ marginTop: 20 }}>
                <SkeletonChart />
                <SkeletonChart />
            </div>
        </div>
    )

    return (
        <div className="page-fade-in">
            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card emerald" onClick={() => navigate('/patients')} style={{ cursor: 'pointer' }}>
                    <div className="stat-info">
                        <h4>Total Patients</h4>
                        <div className="stat-value">{stats.patients}</div>
                        <span className="stat-change positive">+{stats.newPatients} this month</span>
                    </div>
                    <div className="stat-icon"><Users /></div>
                </div>
                <div className="stat-card blue" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
                    <div className="stat-info">
                        <h4>Today's Appointments</h4>
                        <div className="stat-value">{stats.todayAppts}</div>
                        <span className="stat-change">scheduled today</span>
                    </div>
                    <div className="stat-icon"><CalendarDays /></div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-info">
                        <h4>Total Revenue</h4>
                        <div className="stat-value">₹{stats.revenue.toLocaleString()}</div>
                        <span className="stat-change">collected to date</span>
                    </div>
                    <div className="stat-icon"><IndianRupee /></div>
                </div>
                <div className="stat-card rose" onClick={() => navigate('/billing')} style={{ cursor: 'pointer' }}>
                    <div className="stat-info">
                        <h4>Outstanding Dues</h4>
                        <div className="stat-value">₹{stats.outstanding.toLocaleString()}</div>
                        <span className="stat-change">{stats.pendingInvoices} pending invoices</span>
                    </div>
                    <div className="stat-icon"><AlertCircle /></div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Patient Registrations</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={patientTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" name="Patients" stroke="#10b981" strokeWidth={2} dot fill="#10b981" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Revenue Trend</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Procedure Pie + Today Schedule */}
            <div className="dashboard-grid" style={{ marginTop: 20 }}>
                <div className="card">
                    <div className="card-header"><h3>Revenue by Procedure</h3></div>
                    <div className="card-body">
                        {procedureRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={procedureRevenue} cx="50%" cy="50%" outerRadius={85} label={({ name }) => name.length > 15 ? name.slice(0, 15) + '...' : name} dataKey="value">
                                        {procedureRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No billing data yet</div>
                        )}
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3>Today's Schedule</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {todaySchedule.length > 0 ? todaySchedule.map(appt => (
                            <div key={appt.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: appt.status === 'completed' ? '#dcfce7' : appt.status === 'cancelled' ? '#fee2e2' : '#dbeafe',
                                    color: appt.status === 'completed' ? '#16a34a' : appt.status === 'cancelled' ? '#dc2626' : '#2563eb',
                                    fontWeight: 700, fontSize: '0.75rem'
                                }}>
                                    {appt.appointment_time?.slice(0, 5)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{appt.patients?.full_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{appt.doctors?.full_name} · {appt.reason || 'General'}</div>
                                </div>
                                <span className={`badge ${appt.status}`} style={{ fontSize: '0.625rem' }}>{appt.status}</span>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)', fontSize: '0.875rem' }}>No appointments today</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Patients + Follow-ups */}
            <div className="dashboard-grid" style={{ marginTop: 20 }}>
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Patients</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patients')}>View All</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>ID</th><th>Name</th><th>Phone</th></tr></thead>
                            <tbody>
                                {recentPatients.map(p => (
                                    <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                                        <td><span style={{ fontWeight: 600, color: 'var(--primary-600)', fontSize: '0.75rem' }}>{p.patient_id}</span></td>
                                        <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{p.phone || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3>Upcoming Appointments</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>View All</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Doctor</th></tr></thead>
                            <tbody>
                                {upcomingAppts.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 500 }}>{a.patients?.full_name}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{new Date(a.appointment_date).toLocaleDateString()}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{a.appointment_time?.slice(0, 5)}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{a.doctors?.full_name}</td>
                                    </tr>
                                ))}
                                {upcomingAppts.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)' }}>No upcoming appointments</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
