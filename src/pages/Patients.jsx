import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Edit, Trash2, X, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { MEDICAL_CONDITIONS_LIST } from '../lib/clinicalData'

const initialForm = {
    full_name: '', date_of_birth: '', gender: 'male', phone: '', email: '',
    address: '', blood_group: '', emergency_contact: '', emergency_phone: '',
    allergies: '', medical_conditions: '', current_medications: '',
}

export default function Patients() {
    const [patients, setPatients] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()

    useEffect(() => { fetchPatients() }, [])

    const fetchPatients = async () => {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false })
        if (!error) setPatients(data || [])
        setLoading(false)
    }

    const filtered = patients.filter(p =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search))
    )

    const openAdd = () => {
        setEditingId(null)
        setForm(initialForm)
        setShowModal(true)
    }

    const openEdit = (patient) => {
        setEditingId(patient.id)
        setForm({
            full_name: patient.full_name || '',
            date_of_birth: patient.date_of_birth || '',
            gender: patient.gender || 'male',
            phone: patient.phone || '',
            email: patient.email || '',
            address: patient.address || '',
            blood_group: patient.blood_group || '',
            emergency_contact: patient.emergency_contact || '',
            emergency_phone: patient.emergency_phone || '',
            allergies: patient.allergies || '',
            medical_conditions: patient.medical_conditions || '',
            current_medications: patient.current_medications || '',
        })
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (editingId) {
                const { error } = await supabase.from('patients').update(form).eq('id', editingId)
                if (error) throw error
                toast.success('Patient updated!')
            } else {
                const { error } = await supabase.from('patients').insert([{ ...form, patient_id: '' }])
                if (error) throw error
                toast.success('Patient added!')
            }
            setShowModal(false)
            fetchPatients()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this patient? This cannot be undone.')) return
        const { error } = await supabase.from('patients').delete().eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success('Patient deleted'); fetchPatients() }
    }

    if (loading) return <div className="page-fade-in"><SkeletonTable rows={6} cols={6} /></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-box">
                        <Search />
                        <input
                            placeholder="Search patients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Add Patient
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Gender</th>
                                <th>Phone</th>
                                <th>Blood Group</th>
                                <th>Allergies</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const age = p.date_of_birth
                                    ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                                    : '—'
                                return (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{p.patient_id}</td>
                                        <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                                        <td>{age}</td>
                                        <td><span className={`badge ${p.gender}`}>{p.gender}</span></td>
                                        <td>{p.phone || '—'}</td>
                                        <td><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{p.blood_group || '—'}</span></td>
                                        <td>
                                            {p.allergies ? (
                                                <span className="badge cancelled" style={{ fontSize: '0.65rem' }}>⚠ {p.allergies.slice(0, 20)}{p.allergies.length > 20 ? '...' : ''}</span>
                                            ) : <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>None</span>}
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="action-btn" title="View" onClick={() => navigate(`/patients/${p.id}`)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn" title="Edit" onClick={() => openEdit(p)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="action-btn danger" title="Delete" onClick={() => handleDelete(p.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="empty-state">
                                            <Users />
                                            <h3>No patients found</h3>
                                            <p>Add a new patient to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Patient' : 'Add New Patient'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: 12 }}>Personal Information</h4>
                                <div className="form-grid">
                                    <div className="field full">
                                        <label>Full Name *</label>
                                        <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Date of Birth</label>
                                        <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Gender</label>
                                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Phone</label>
                                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Email</label>
                                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                    <div className="field full">
                                        <label>Address</label>
                                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--slate-400)', margin: '20px 0 12px' }}>Medical Information</h4>
                                <div className="form-grid">
                                    <div className="field">
                                        <label>Blood Group</label>
                                        <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
                                            <option value="">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Emergency Contact Name</label>
                                        <input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="Contact name" />
                                    </div>
                                    <div className="field">
                                        <label>Emergency Phone</label>
                                        <input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} placeholder="Emergency phone" />
                                    </div>
                                    <div className="field full">
                                        <label>Allergies ⚠️</label>
                                        <textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} rows={2} placeholder="e.g., Penicillin, Latex, Lidocaine" />
                                    </div>
                                    <div className="field full">
                                        <label>Medical Conditions</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 12px', padding: '8px 0' }}>
                                            {MEDICAL_CONDITIONS_LIST.map(cond => {
                                                const selected = (form.medical_conditions || '').split(',').map(s => s.trim()).filter(Boolean)
                                                const isChecked = selected.includes(cond)
                                                return (
                                                    <label key={cond} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={isChecked} onChange={() => {
                                                            const updated = isChecked
                                                                ? selected.filter(s => s !== cond)
                                                                : [...selected, cond]
                                                            setForm({ ...form, medical_conditions: updated.join(', ') })
                                                        }} />
                                                        {cond}
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="field full">
                                        <label>Current Medications</label>
                                        <textarea value={form.current_medications} onChange={(e) => setForm({ ...form, current_medications: e.target.value })} rows={2} placeholder="e.g., Metformin 500mg, Amlodipine 5mg" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingId ? 'Update Patient' : 'Add Patient')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
