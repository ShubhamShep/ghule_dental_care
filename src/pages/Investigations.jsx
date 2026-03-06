import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, X, ArrowLeft, FlaskConical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { DENTAL_INVESTIGATIONS, BLOOD_INVESTIGATIONS } from '../lib/clinicalData'

export default function Investigations() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientId = searchParams.get('patient')
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(patientId || '')
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [tab, setTab] = useState('dental')
    const [form, setForm] = useState({ investigation_type: 'dental', investigation_name: '', result: '', notes: '', investigation_date: new Date().toISOString().split('T')[0] })

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
        const { data } = await supabase.from('investigations').select('*').eq('patient_id', selectedPatient).order('investigation_date', { ascending: false })
        setRecords(data || [])
        setLoading(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('investigations').insert({
            patient_id: selectedPatient, ...form
        })
        if (error) toast.error(error.message)
        else {
            toast.success('Investigation added!')
            setShowModal(false)
            setForm({ investigation_type: 'dental', investigation_name: '', result: '', notes: '', investigation_date: new Date().toISOString().split('T')[0] })
            fetchRecords()
        }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete?')) return
        await supabase.from('investigations').delete().eq('id', id)
        toast.success('Deleted')
        fetchRecords()
    }

    const dentalRecords = records.filter(r => r.investigation_type === 'dental')
    const bloodRecords = records.filter(r => r.investigation_type === 'blood')
    const filtered = tab === 'dental' ? dentalRecords : bloodRecords

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
                            <Plus size={16} /> Add Investigation
                        </button>
                    )}
                </div>
            </div>

            {selectedPatient && (
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>7) Investigations</h3>
                        <div className="filter-tabs" style={{ marginBottom: 0 }}>
                            <button className={`filter-tab ${tab === 'dental' ? 'active' : ''}`} onClick={() => setTab('dental')}>Dental</button>
                            <button className={`filter-tab ${tab === 'blood' ? 'active' : ''}`} onClick={() => setTab('blood')}>Blood</button>
                        </div>
                    </div>

                    {/* Quick-add dental/blood checkboxes */}
                    <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 20px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 8 }}>
                            {tab === 'dental' ? 'Dental Investigations' : 'Blood Investigations'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {(tab === 'dental' ? DENTAL_INVESTIGATIONS : BLOOD_INVESTIGATIONS).map(inv => {
                                const exists = filtered.some(r => r.investigation_name === inv)
                                return (
                                    <span key={inv} style={{
                                        padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
                                        background: exists ? 'var(--primary-500)' : 'var(--bg-secondary)',
                                        color: exists ? '#fff' : 'var(--text-secondary)',
                                        border: `1px solid ${exists ? 'var(--primary-500)' : 'var(--border-color)'}`,
                                    }}>
                                        {inv} {exists && '✓'}
                                    </span>
                                )
                            })}
                        </div>
                    </div>

                    {loading ? <div style={{ padding: 20 }}><SkeletonTable rows={3} cols={5} /></div> : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Investigation</th><th>Type</th><th>Result</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {filtered.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 500 }}>{r.investigation_name}</td>
                                            <td><span className={`badge ${r.investigation_type === 'dental' ? 'scheduled' : 'completed'}`}>{r.investigation_type}</span></td>
                                            <td>{r.result || '—'}</td>
                                            <td>{r.investigation_date ? new Date(r.investigation_date).toLocaleDateString() : '—'}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{r.notes || '—'}</td>
                                            <td><button className="action-btn danger" onClick={() => handleDelete(r.id)}><X size={14} /></button></td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={6}><div className="empty-state"><FlaskConical /><h3>No {tab} investigations</h3></div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!selectedPatient && (
                <div className="card"><div className="card-body"><div className="empty-state"><h3>Select a Patient</h3><p>Choose a patient to view investigations</p></div></div></div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Investigation</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field">
                                        <label>Type *</label>
                                        <select value={form.investigation_type} onChange={e => setForm({ ...form, investigation_type: e.target.value, investigation_name: '' })}>
                                            <option value="dental">Dental</option>
                                            <option value="blood">Blood</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Investigation *</label>
                                        <select required value={form.investigation_name} onChange={e => setForm({ ...form, investigation_name: e.target.value })}>
                                            <option value="">Select</option>
                                            {(form.investigation_type === 'dental' ? DENTAL_INVESTIGATIONS : BLOOD_INVESTIGATIONS).map(i => (
                                                <option key={i} value={i}>{i}</option>
                                            ))}
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Result</label>
                                        <input value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} placeholder="Result value" />
                                    </div>
                                    <div className="field">
                                        <label>Date</label>
                                        <input type="date" value={form.investigation_date} onChange={e => setForm({ ...form, investigation_date: e.target.value })} />
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
