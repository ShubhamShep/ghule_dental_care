import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Droplets, Calendar, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PatientDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [patient, setPatient] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [invoices, setInvoices] = useState([])
    const [tab, setTab] = useState('info')
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchData() }, [id])

    const fetchData = async () => {
        const [patRes, apptRes, invRes] = await Promise.all([
            supabase.from('patients').select('*').eq('id', id).single(),
            supabase.from('appointments').select('*, doctors(full_name)').eq('patient_id', id).order('appointment_date', { ascending: false }),
            supabase.from('invoices').select('*').eq('patient_id', id).order('issued_date', { ascending: false }),
        ])
        setPatient(patRes.data)
        setAppointments(apptRes.data || [])
        setInvoices(invRes.data || [])
        setLoading(false)
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>
    if (!patient) return <div className="empty-state"><h3>Patient not found</h3></div>

    const age = patient.date_of_birth
        ? Math.floor((Date.now() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null
    const initials = patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase()

    return (
        <div>
            <button className="back-btn" onClick={() => navigate('/patients')}>
                <ArrowLeft /> Back to Patients
            </button>

            <div className="patient-header">
                <div className="patient-avatar">{initials}</div>
                <div className="patient-meta">
                    <h2>{patient.full_name}</h2>
                    <div className="patient-meta-tags">
                        <span className="patient-meta-tag"><FileText /> {patient.patient_id}</span>
                        {age !== null && <span className="patient-meta-tag"><Calendar /> {age} years old</span>}
                        <span className={`badge ${patient.gender}`}>{patient.gender}</span>
                        {patient.blood_group && <span className="patient-meta-tag"><Droplets /> {patient.blood_group}</span>}
                    </div>
                </div>
            </div>

            <div className="patient-tabs">
                {['info', 'appointments', 'billing'].map(t => (
                    <button key={t} className={`patient-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                        {t === 'info' ? 'Information' : t === 'appointments' ? 'Appointments' : 'Billing'}
                    </button>
                ))}
            </div>

            {tab === 'info' && (
                <div className="card">
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Phone</label>
                                <p>{patient.phone || '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Email</label>
                                <p>{patient.email || '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Date of Birth</label>
                                <p>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Blood Group</label>
                                <p>{patient.blood_group || '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Address</label>
                                <p>{patient.address || '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Emergency Contact</label>
                                <p>{patient.emergency_contact || '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Allergies</label>
                                <p>{patient.allergies || 'None reported'}</p>
                            </div>
                            <div className="info-item">
                                <label>Medical History</label>
                                <p>{patient.medical_history || 'No history recorded'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'appointments' && (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a.id}>
                                        <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                                        <td>{a.appointment_time?.slice(0, 5)}</td>
                                        <td>{a.doctors?.full_name}</td>
                                        <td>{a.reason || '—'}</td>
                                        <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--slate-400)' }}>No appointments</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'billing' && (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Paid</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/billing/${inv.id}`)}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{inv.invoice_number}</td>
                                        <td>{new Date(inv.issued_date).toLocaleDateString()}</td>
                                        <td>₹{Number(inv.total_amount).toLocaleString()}</td>
                                        <td>₹{Number(inv.paid_amount).toLocaleString()}</td>
                                        <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--slate-400)' }}>No invoices</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
