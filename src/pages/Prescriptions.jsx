import { useState, useEffect } from 'react'
import { Plus, Search, Printer, X, Pill } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'

export default function Prescriptions() {
    const [prescriptions, setPrescriptions] = useState([])
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showPreview, setShowPreview] = useState(null)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({ patient_id: '', doctor_name: '', diagnosis: '', advice: '' })
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }])
    const [clinicInfo, setClinicInfo] = useState(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [rxRes, patsRes, settingsRes] = await Promise.all([
            supabase.from('prescriptions').select('*, patients(full_name, patient_id, phone, gender, age)').order('created_at', { ascending: false }),
            supabase.from('patients').select('id, full_name, patient_id'),
            supabase.from('clinic_settings').select('*').limit(1).single(),
        ])
        setPrescriptions(rxRes.data || [])
        setPatients(patsRes.data || [])
        setClinicInfo(settingsRes.data)
        setLoading(false)
    }

    const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', notes: '' }])
    const removeMedicine = (idx) => setMedicines(medicines.filter((_, i) => i !== idx))
    const updateMedicine = (idx, key, val) => {
        const copy = [...medicines]; copy[idx][key] = val; setMedicines(copy)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.patient_id) { toast.error('Select a patient'); return }
        if (!medicines[0]?.name) { toast.error('Add at least one medicine'); return }

        const { error } = await supabase.from('prescriptions').insert({
            patient_id: form.patient_id,
            doctor_name: form.doctor_name,
            diagnosis: form.diagnosis,
            advice: form.advice,
            medicines: medicines.filter(m => m.name),
        })

        if (error) toast.error(error.message)
        else {
            toast.success('Prescription created!')
            setShowModal(false)
            setForm({ patient_id: '', doctor_name: '', diagnosis: '', advice: '' })
            setMedicines([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }])
            fetchData()
        }
    }

    const filteredRx = prescriptions.filter(rx =>
        rx.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        rx.diagnosis?.toLowerCase().includes(search.toLowerCase())
    )

    const printPrescription = (rx) => {
        setShowPreview(rx)
        setTimeout(() => window.print(), 500)
    }

    if (loading) return <div className="page-fade-in"><SkeletonTable rows={6} cols={5} /></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        placeholder="Search prescriptions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> New Prescription
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Diagnosis</th>
                                <th>Medicines</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRx.map(rx => (
                                <tr key={rx.id}>
                                    <td style={{ fontSize: '0.8rem' }}>{new Date(rx.created_at).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 500 }}>{rx.patients?.full_name}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{rx.doctor_name || '—'}</td>
                                    <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rx.diagnosis || '—'}</td>
                                    <td>
                                        <span className="badge scheduled">{(rx.medicines || []).length} items</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(rx)}>View</button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => printPrescription(rx)}>
                                                <Printer size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRx.length === 0 && (
                                <tr><td colSpan={6} className="empty-state"><Pill /><h3>No prescriptions yet</h3><p>Create your first prescription</p></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Prescription Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Pill size={20} /> New Prescription</h2>
                            <button className="btn-ghost" onClick={() => setShowModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group-app">
                                        <label>Patient *</label>
                                        <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
                                            <option value="">Select patient</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group-app">
                                        <label>Doctor Name</label>
                                        <input value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} placeholder="Dr. Ghule" />
                                    </div>
                                </div>

                                <div className="form-group-app" style={{ marginTop: 16 }}>
                                    <label>Diagnosis</label>
                                    <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Patient diagnosis..." rows={2} />
                                </div>

                                <h4 style={{ marginTop: 20, marginBottom: 12, fontSize: '0.875rem', fontWeight: 600 }}>Medicines</h4>
                                {medicines.map((med, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                                        <input placeholder="Medicine name *" value={med.name} onChange={e => updateMedicine(idx, 'name', e.target.value)} />
                                        <input placeholder="Dosage" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} />
                                        <input placeholder="Frequency" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} />
                                        <input placeholder="Duration" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} />
                                        {medicines.length > 1 && (
                                            <button type="button" className="btn-ghost" onClick={() => removeMedicine(idx)}><X size={16} /></button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addMedicine} style={{ marginTop: 4 }}>
                                    <Plus size={14} /> Add Medicine
                                </button>

                                <div className="form-group-app" style={{ marginTop: 16 }}>
                                    <label>Advice</label>
                                    <textarea value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} placeholder="General advice..." rows={2} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Prescription</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Prescription Preview / Print Modal */}
            {showPreview && (
                <div className="modal-overlay" onClick={() => setShowPreview(null)}>
                    <div className="modal modal-lg prescription-print" onClick={e => e.stopPropagation()}>
                        <div className="prescription-letterhead">
                            <div className="prescription-clinic">
                                <img src="/ghule_dental_care/logo.svg" alt="" width="48" height="48" style={{ borderRadius: 10 }} />
                                <div>
                                    <h2>{clinicInfo?.clinic_name || 'Ghule Dental Care'}</h2>
                                    <p>{clinicInfo?.address || 'Dental Clinic'}</p>
                                    <p>{clinicInfo?.phone ? `Ph: ${clinicInfo.phone}` : ''} {clinicInfo?.gst_number ? `| GST: ${clinicInfo.gst_number}` : ''}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                                <div>Date: {new Date(showPreview.created_at).toLocaleDateString()}</div>
                                <div>Rx #{showPreview.id?.slice(0, 8)}</div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '2px solid var(--primary-500)', margin: '16px 0' }} />

                        <div className="prescription-patient-info">
                            <div><strong>Patient:</strong> {showPreview.patients?.full_name}</div>
                            <div><strong>ID:</strong> {showPreview.patients?.patient_id}</div>
                            <div><strong>Age/Gender:</strong> {showPreview.patients?.age || '—'} / {showPreview.patients?.gender || '—'}</div>
                        </div>

                        {showPreview.doctor_name && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: 12 }}>
                                <strong>Doctor:</strong> {showPreview.doctor_name}
                            </div>
                        )}

                        {showPreview.diagnosis && (
                            <div style={{ marginBottom: 16 }}>
                                <strong style={{ fontSize: '0.8rem' }}>Diagnosis:</strong>
                                <p style={{ fontSize: '0.875rem', marginTop: 4 }}>{showPreview.diagnosis}</p>
                            </div>
                        )}

                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)', marginBottom: 12 }}>℞</div>

                        <table className="prescription-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(showPreview.medicines || []).map((med, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td style={{ fontWeight: 500 }}>{med.name}</td>
                                        <td>{med.dosage || '—'}</td>
                                        <td>{med.frequency || '—'}</td>
                                        <td>{med.duration || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {showPreview.advice && (
                            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--slate-50)', borderRadius: 8, fontSize: '0.8125rem' }}>
                                <strong>Advice:</strong> {showPreview.advice}
                            </div>
                        )}

                        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                                This is a computer-generated prescription.
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid var(--slate-300)', width: 200, marginBottom: 4 }}></div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{showPreview.doctor_name || 'Doctor'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Signature</div>
                            </div>
                        </div>

                        <div className="invoice-actions" style={{ marginTop: 20 }}>
                            <button className="btn btn-primary" onClick={() => window.print()}>
                                <Printer size={16} /> Print Prescription
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowPreview(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
