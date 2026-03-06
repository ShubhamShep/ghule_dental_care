import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, X, ArrowLeft, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { TREATMENT_PROCEDURES } from '../lib/clinicalData'

export default function PastDentalTreatment() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientId = searchParams.get('patient')
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(patientId || '')
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ treatment: '', tooth_number: '', treated_by: '', treated_date: '', notes: '' })

    useEffect(() => { fetchPatients() }, [])
    useEffect(() => {
        if (selectedPatient) fetchRecords()
        else { setRecords([]); setLoading(false) }
    }, [selectedPatient])

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('id, full_name, patient_id').order('full_name')
        setPatients(data || [])
        setLoading(false)
    }

    const fetchRecords = async () => {
        setLoading(true)
        const { data } = await supabase.from('past_dental_treatments').select('*').eq('patient_id', selectedPatient).order('treated_date', { ascending: false })
        setRecords(data || [])
        setLoading(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('past_dental_treatments').insert({
            patient_id: selectedPatient,
            treatment: form.treatment,
            tooth_number: form.tooth_number ? Number(form.tooth_number) : null,
            treated_by: form.treated_by,
            treated_date: form.treated_date || null,
            notes: form.notes,
        })
        if (error) toast.error(error.message)
        else {
            toast.success('Record added!')
            setShowModal(false)
            setForm({ treatment: '', tooth_number: '', treated_by: '', treated_date: '', notes: '' })
            fetchRecords()
        }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this record?')) return
        await supabase.from('past_dental_treatments').delete().eq('id', id)
        toast.success('Deleted')
        fetchRecords()
    }

    return (
        <div className="page-fade-in">
            {patientId && (
                <button className="back-btn" onClick={() => navigate(`/patients/${patientId}`)}>
                    <ArrowLeft /> Back to Patient
                </button>
            )}

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div className="field" style={{ flex: 1, minWidth: 250 }}>
                        <label>Select Patient</label>
                        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">-- Choose a patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                        </select>
                    </div>
                    {selectedPatient && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> Add Past Treatment
                        </button>
                    )}
                </div>
            </div>

            {selectedPatient && (
                <div className="card">
                    <div className="card-header"><h3>5) Past Dental Treatment</h3></div>
                    {loading ? <div style={{ padding: 20 }}><SkeletonTable rows={3} cols={5} /></div> : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr><th>Treatment</th><th>Tooth #</th><th>Treated By</th><th>Date</th><th>Notes</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 500 }}>{r.treatment}</td>
                                            <td>{r.tooth_number || '—'}</td>
                                            <td>{r.treated_by || '—'}</td>
                                            <td>{r.treated_date ? new Date(r.treated_date).toLocaleDateString() : '—'}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.notes || '—'}</td>
                                            <td>
                                                <button className="action-btn danger" onClick={() => handleDelete(r.id)}>
                                                    <X size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr><td colSpan={6}><div className="empty-state"><ClipboardList /><h3>No past dental treatment records</h3></div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!selectedPatient && (
                <div className="card"><div className="card-body"><div className="empty-state"><h3>Select a Patient</h3><p>Choose a patient to view past dental treatments</p></div></div></div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Past Dental Treatment</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field full">
                                        <label>Treatment *</label>
                                        <select required value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })}>
                                            <option value="">Select treatment</option>
                                            {TREATMENT_PROCEDURES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Tooth Number</label>
                                        <input type="number" min="1" max="85" value={form.tooth_number} onChange={e => setForm({ ...form, tooth_number: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Treated By</label>
                                        <input value={form.treated_by} onChange={e => setForm({ ...form, treated_by: e.target.value })} placeholder="Doctor name" />
                                    </div>
                                    <div className="field">
                                        <label>Date</label>
                                        <input type="date" value={form.treated_date} onChange={e => setForm({ ...form, treated_date: e.target.value })} />
                                    </div>
                                    <div className="field full">
                                        <label>Notes</label>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
