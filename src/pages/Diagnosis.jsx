import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, X, ArrowLeft, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'

export default function Diagnosis() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientId = searchParams.get('patient')
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(patientId || '')
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ diagnosis: '', since: '', comment: '', notes: '' })

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
        const { data } = await supabase.from('diagnoses').select('*').eq('patient_id', selectedPatient).order('created_at', { ascending: false })
        setRecords(data || [])
        setLoading(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('diagnoses').insert({
            patient_id: selectedPatient, ...form
        })
        if (error) toast.error(error.message)
        else {
            toast.success('Diagnosis added!')
            setShowModal(false)
            setForm({ diagnosis: '', since: '', comment: '', notes: '' })
            fetchRecords()
        }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete?')) return
        await supabase.from('diagnoses').delete().eq('id', id)
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
                            <Plus size={16} /> Add Diagnosis
                        </button>
                    )}
                </div>
            </div>

            {selectedPatient && (
                <div className="card">
                    <div className="card-header"><h3>8) Diagnosis</h3></div>
                    {loading ? <div style={{ padding: 20 }}><SkeletonTable rows={3} cols={4} /></div> : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>#</th><th>Diagnosis</th><th>Since</th><th>Comment</th><th>Notes</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {records.map((r, idx) => (
                                        <tr key={r.id}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontWeight: 500 }}>{r.diagnosis}</td>
                                            <td>{r.since || '—'}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{r.comment || '—'}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{r.notes || '—'}</td>
                                            <td><button className="action-btn danger" onClick={() => handleDelete(r.id)}><X size={14} /></button></td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr><td colSpan={6}><div className="empty-state"><Stethoscope /><h3>No diagnosis records</h3></div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!selectedPatient && (
                <div className="card"><div className="card-body"><div className="empty-state"><h3>Select a Patient</h3><p>Choose a patient to view diagnoses</p></div></div></div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Diagnosis</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field full">
                                        <label>Diagnosis *</label>
                                        <input required value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Enter diagnosis" />
                                    </div>
                                    <div className="field">
                                        <label>Since</label>
                                        <input value={form.since} onChange={e => setForm({ ...form, since: e.target.value })} placeholder="e.g., 2 months, 1 year" />
                                    </div>
                                    <div className="field">
                                        <label>Comment</label>
                                        <input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Comment" />
                                    </div>
                                    <div className="field full">
                                        <label>Notes</label>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Detailed notes..." />
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
