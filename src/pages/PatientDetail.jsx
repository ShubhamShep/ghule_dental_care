import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Droplets, Calendar, FileText, AlertTriangle, Pill, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SkeletonCard } from '../components/SkeletonLoader'

export default function PatientDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [patient, setPatient] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [invoices, setInvoices] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('overview')

    useEffect(() => { fetchData() }, [id])

    const fetchData = async () => {
        const [patRes, apptsRes, invRes, rxRes] = await Promise.all([
            supabase.from('patients').select('*').eq('id', id).single(),
            supabase.from('appointments').select('*, doctors(full_name)').eq('patient_id', id).order('appointment_date', { ascending: false }),
            supabase.from('invoices').select('*').eq('patient_id', id).order('issued_date', { ascending: false }),
            supabase.from('prescriptions').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        ])
        setPatient(patRes.data)
        setAppointments(apptsRes.data || [])
        setInvoices(invRes.data || [])
        setPrescriptions(rxRes.data || [])
        setLoading(false)
    }

    if (loading) return <div className="page-fade-in" style={{ display: 'grid', gap: 16 }}><SkeletonCard /><SkeletonCard /></div>

    if (!patient) return <div className="empty-state"><h3>Patient not found</h3></div>

    const age = patient.date_of_birth
        ? Math.floor((Date.now() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'medical', label: 'Medical History', icon: Heart },
        { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    ]

    return (
        <div className="page-fade-in">
            <button className="back-btn" onClick={() => navigate('/patients')}>
                <ArrowLeft /> Back to Patients
            </button>

            {/* Patient Header Card */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '1.5rem', fontWeight: 700
                    }}>
                        {patient.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ marginBottom: 4 }}>{patient.full_name}</h2>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{patient.patient_id}</span>
                            {age !== null && <span>🎂 {age} yrs</span>}
                            <span className={`badge ${patient.gender}`}>{patient.gender}</span>
                            {patient.blood_group && <span><Droplets size={12} /> {patient.blood_group}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: '0.8125rem', color: 'var(--slate-500)', flexWrap: 'wrap' }}>
                            {patient.phone && <span><Phone size={12} /> {patient.phone}</span>}
                            {patient.email && <span><Mail size={12} /> {patient.email}</span>}
                            {patient.address && <span><MapPin size={12} /> {patient.address}</span>}
                        </div>
                    </div>
                    {patient.allergies && (
                        <div style={{
                            padding: '10px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8,
                            display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: '#dc2626'
                        }}>
                            <AlertTriangle size={16} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>ALLERGIES</div>
                                {patient.allergies}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{
                            flex: 1, padding: '10px 16px', background: tab === t.id ? 'var(--primary-500)' : 'transparent',
                            color: tab === t.id ? '#fff' : 'var(--slate-500)', border: 'none', borderRadius: 8,
                            cursor: 'pointer', fontWeight: 500, fontSize: '0.8125rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s'
                        }}>
                        <t.icon size={14} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && (
                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header"><h3><Calendar size={16} /> Appointments ({appointments.length})</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
                                <tbody>
                                    {appointments.slice(0, 10).map(a => (
                                        <tr key={a.id}>
                                            <td style={{ fontSize: '0.8rem' }}>{new Date(a.appointment_date).toLocaleDateString()}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{a.appointment_time?.slice(0, 5)}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{a.doctors?.full_name || '—'}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{a.reason || '—'}</td>
                                            <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                                        </tr>
                                    ))}
                                    {appointments.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)' }}>No appointments</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><h3><FileText size={16} /> Invoices ({invoices.length})</h3></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {invoices.slice(0, 10).map(inv => (
                                        <tr key={inv.id} onClick={() => navigate(`/billing/${inv.id}`)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 600, color: 'var(--primary-600)', fontSize: '0.8rem' }}>{inv.invoice_number}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{new Date(inv.issued_date).toLocaleDateString()}</td>
                                            <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>₹{Number(inv.total_amount).toLocaleString()}</td>
                                            <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                                        </tr>
                                    ))}
                                    {invoices.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)' }}>No invoices</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Medical History Tab */}
            {tab === 'medical' && (
                <div className="card">
                    <div style={{ padding: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                            <div className="medical-info-card">
                                <h4><Droplets size={14} /> Blood Group</h4>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{patient.blood_group || '—'}</p>
                            </div>
                            <div className="medical-info-card">
                                <h4><Phone size={14} /> Emergency Contact</h4>
                                <p style={{ fontWeight: 500 }}>{patient.emergency_contact || '—'}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{patient.emergency_phone || 'No phone'}</p>
                            </div>
                            <div className="medical-info-card" style={{ background: patient.allergies ? '#fef2f2' : undefined, borderColor: patient.allergies ? '#fee2e2' : undefined }}>
                                <h4><AlertTriangle size={14} style={{ color: patient.allergies ? '#dc2626' : undefined }} /> Allergies</h4>
                                <p style={{ color: patient.allergies ? '#dc2626' : 'var(--slate-400)' }}>{patient.allergies || 'No known allergies'}</p>
                            </div>
                            <div className="medical-info-card">
                                <h4><Heart size={14} /> Medical Conditions</h4>
                                <p>{patient.medical_conditions || 'None reported'}</p>
                            </div>
                            <div className="medical-info-card full-width-card">
                                <h4><Pill size={14} /> Current Medications</h4>
                                <p>{patient.current_medications || 'None'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescriptions Tab */}
            {tab === 'prescriptions' && (
                <div className="card">
                    <div className="card-header">
                        <h3><Pill size={16} /> Prescriptions ({prescriptions.length})</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/prescriptions')}>New Prescription</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Date</th><th>Doctor</th><th>Diagnosis</th><th>Medicines</th></tr></thead>
                            <tbody>
                                {prescriptions.map(rx => (
                                    <tr key={rx.id}>
                                        <td style={{ fontSize: '0.8rem' }}>{new Date(rx.created_at).toLocaleDateString()}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{rx.doctor_name || '—'}</td>
                                        <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rx.diagnosis || '—'}</td>
                                        <td><span className="badge scheduled">{(rx.medicines || []).length} items</span></td>
                                    </tr>
                                ))}
                                {prescriptions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)' }}>No prescriptions yet</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
