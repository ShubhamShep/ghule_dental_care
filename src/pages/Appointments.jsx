import { useState, useEffect } from 'react'
import { Search, Plus, X, CheckCircle, XCircle, CalendarDays, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'

const initialForm = {
    patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '', notes: ''
}

export default function Appointments() {
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])
    const [doctors, setDoctors] = useState([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [apptRes, patRes, docRes] = await Promise.all([
            supabase.from('appointments')
                .select('*, patients(full_name, patient_id, phone), doctors(full_name)')
                .order('appointment_date', { ascending: false })
                .order('appointment_time', { ascending: false }),
            supabase.from('patients').select('id, full_name, patient_id, phone').order('full_name'),
            supabase.from('doctors').select('id, full_name, specialization').eq('is_active', true).order('full_name'),
        ])
        setAppointments(apptRes.data || [])
        setPatients(patRes.data || [])
        setDoctors(docRes.data || [])
        setLoading(false)
    }

    const filtered = appointments
        .filter(a => filter === 'all' || a.status === filter)
        .filter(a =>
            (a.patients?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.doctors?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.reason || '').toLowerCase().includes(search.toLowerCase())
        )

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { error } = await supabase.from('appointments').insert([form])
            if (error) throw error
            toast.success('Appointment booked!')
            setShowModal(false)
            setForm(initialForm)
            fetchData()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const updateStatus = async (id, status) => {
        const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success(`Appointment ${status}`); fetchData() }
    }

    const sendWhatsAppReminder = (appt) => {
        const phone = appt.patients?.phone?.replace(/[^0-9]/g, '')
        if (!phone) {
            toast.error('Patient has no phone number')
            return
        }
        const phoneNum = phone.startsWith('91') ? phone : `91${phone}`
        const date = new Date(appt.appointment_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const time = appt.appointment_time?.slice(0, 5) || ''
        const doctor = appt.doctors?.full_name || 'your dentist'
        const message = `🦷 *Ghule Dental Care - Appointment Reminder*\n\nDear ${appt.patients?.full_name},\n\nThis is a friendly reminder for your dental appointment:\n\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n👨‍⚕️ *Doctor:* ${doctor}\n${appt.reason ? `📋 *Reason:* ${appt.reason}` : ''}\n\nPlease arrive 10 minutes early. If you need to reschedule, please call us.\n\n_Ghule Dental Care_`

        const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
        toast.success('WhatsApp opened with reminder!')
    }

    if (loading) return <div className="page-fade-in"><SkeletonTable rows={6} cols={6} /></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-box">
                        <Search />
                        <input placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-tabs">
                        {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
                            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Book Appointment
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{a.patients?.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{a.patients?.patient_id}</div>
                                        </div>
                                    </td>
                                    <td>{a.doctors?.full_name}</td>
                                    <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                                    <td>{a.appointment_time?.slice(0, 5)}</td>
                                    <td>{a.reason || '—'}</td>
                                    <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                                    <td>
                                        <div className="action-btns">
                                            {a.status === 'scheduled' && (
                                                <>
                                                    <button className="action-btn" title="Send WhatsApp Reminder" onClick={() => sendWhatsAppReminder(a)}
                                                        style={{ color: '#25D366' }}>
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button className="action-btn" title="Complete" onClick={() => updateStatus(a.id, 'completed')}>
                                                        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                                    </button>
                                                    <button className="action-btn danger" title="Cancel" onClick={() => updateStatus(a.id, 'cancelled')}>
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <CalendarDays />
                                            <h3>No appointments found</h3>
                                            <p>Book a new appointment to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Book Appointment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Book Appointment</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field">
                                        <label>Patient *</label>
                                        <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                                            <option value="">Select Patient</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Doctor *</label>
                                        <select required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
                                            <option value="">Select Doctor</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} - {d.specialization}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Date *</label>
                                        <input type="date" required value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Time *</label>
                                        <input type="time" required value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
                                    </div>
                                    <div className="field full">
                                        <label>Reason</label>
                                        <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                                    </div>
                                    <div className="field full">
                                        <label>Notes</label>
                                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Booking...' : 'Book Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
