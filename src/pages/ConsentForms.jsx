import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, X, ArrowLeft, FileCheck, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { TREATMENT_PROCEDURES } from '../lib/clinicalData'

const CONSENT_TEMPLATE = (patientName, treatment) => `
I, ${patientName || '_______________'}, hereby give my informed consent for the following dental treatment:

Treatment: ${treatment || '_______________'}

I understand that:
1. The nature, purpose, and alternatives of the proposed treatment have been explained to me.
2. The risks and possible complications have been discussed with me.
3. I have had an opportunity to ask questions and all my questions have been answered satisfactorily.
4. No guarantee has been made regarding the outcome of the treatment.
5. I consent to the administration of local anesthesia or any other form of anesthesia deemed necessary.
6. I authorize the dentist and their team to perform the treatment.

I have read and understood the above information and voluntarily consent to the proposed treatment.
`.trim()

export default function ConsentForms() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientId = searchParams.get('patient')
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(patientId || '')
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showPreview, setShowPreview] = useState(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ treatment: '', consent_text: '', patient_signature: false })
    const [clinicInfo, setClinicInfo] = useState(null)

    useEffect(() => { fetchPatients() }, [])
    useEffect(() => {
        if (selectedPatient) fetchRecords()
        else { setRecords([]); setLoading(false) }
    }, [selectedPatient])

    const fetchPatients = async () => {
        const [pRes, sRes] = await Promise.all([
            supabase.from('patients').select('id, full_name, patient_id').order('full_name'),
            supabase.from('clinic_settings').select('*').limit(1).single(),
        ])
        setPatients(pRes.data || [])
        setClinicInfo(sRes.data)
        setLoading(false)
    }

    const fetchRecords = async () => {
        setLoading(true)
        const { data } = await supabase.from('consent_forms').select('*').eq('patient_id', selectedPatient).order('created_at', { ascending: false })
        setRecords(data || [])
        setLoading(false)
    }

    const openCreateModal = () => {
        const pat = patients.find(p => p.id === selectedPatient)
        setForm({ treatment: '', consent_text: CONSENT_TEMPLATE(pat?.full_name, ''), patient_signature: false })
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('consent_forms').insert({
            patient_id: selectedPatient,
            treatment: form.treatment,
            consent_text: form.consent_text,
            patient_signature: form.patient_signature,
            signed_date: form.patient_signature ? new Date().toISOString() : null,
        })
        if (error) toast.error(error.message)
        else {
            toast.success('Consent form created!')
            setShowModal(false)
            fetchRecords()
        }
        setSaving(false)
    }

    const markSigned = async (id) => {
        await supabase.from('consent_forms').update({ patient_signature: true, signed_date: new Date().toISOString() }).eq('id', id)
        toast.success('Marked as signed!')
        fetchRecords()
    }

    const selectedPatientName = patients.find(p => p.id === selectedPatient)?.full_name

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
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <Plus size={16} /> Create Consent Form
                        </button>
                    )}
                </div>
            </div>

            {selectedPatient && (
                <div className="card">
                    <div className="card-header"><h3>11) Consent Form</h3></div>
                    {loading ? <div style={{ padding: 20 }}><SkeletonTable rows={3} cols={4} /></div> : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Treatment</th><th>Created</th><th>Status</th><th>Signed Date</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 500 }}>{r.treatment}</td>
                                            <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {r.patient_signature
                                                    ? <span className="badge completed">✅ Signed</span>
                                                    : <span className="badge pending">⏳ Pending</span>
                                                }
                                            </td>
                                            <td>{r.signed_date ? new Date(r.signed_date).toLocaleDateString() : '—'}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn" title="View" onClick={() => setShowPreview(r)}>👁</button>
                                                    {!r.patient_signature && (
                                                        <button className="action-btn" title="Mark Signed" onClick={() => markSigned(r.id)}>✍️</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr><td colSpan={5}><div className="empty-state"><FileCheck /><h3>No consent forms</h3></div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!selectedPatient && (
                <div className="card"><div className="card-body"><div className="empty-state"><h3>Select a Patient</h3><p>Choose a patient to manage consent forms</p></div></div></div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Consent Form</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field full">
                                        <label>Treatment *</label>
                                        <select required value={form.treatment} onChange={e => {
                                            const t = e.target.value
                                            setForm({ ...form, treatment: t, consent_text: CONSENT_TEMPLATE(selectedPatientName, t) })
                                        }}>
                                            <option value="">Select treatment</option>
                                            {TREATMENT_PROCEDURES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="field full">
                                        <label>Consent Text</label>
                                        <textarea value={form.consent_text} onChange={e => setForm({ ...form, consent_text: e.target.value })} rows={12} style={{ fontSize: '0.85rem', lineHeight: 1.6 }} />
                                    </div>
                                    <div className="field full">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.patient_signature} onChange={e => setForm({ ...form, patient_signature: e.target.checked })} />
                                            Patient has signed the consent form
                                        </label>
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

            {/* Preview Modal */}
            {showPreview && (
                <div className="modal-overlay" onClick={() => setShowPreview(null)}>
                    <div className="modal prescription-print" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <div className="prescription-letterhead">
                            <div className="prescription-clinic">
                                <img src="/ghule_dental_care/logo.svg" alt="" width="48" height="48" style={{ borderRadius: 10 }} />
                                <div>
                                    <h2>{clinicInfo?.clinic_name || 'Ghule Dental Care'}</h2>
                                    <p>{clinicInfo?.address || 'Dental Clinic'}</p>
                                </div>
                            </div>
                        </div>
                        <hr style={{ border: 'none', borderTop: '2px solid var(--primary-500)', margin: '16px 0' }} />
                        <h3 style={{ textAlign: 'center', marginBottom: 20 }}>INFORMED CONSENT FORM</h3>
                        <div style={{ marginBottom: 12, fontSize: '0.875rem' }}>
                            <strong>Patient:</strong> {selectedPatientName}<br />
                            <strong>Treatment:</strong> {showPreview.treatment}<br />
                            <strong>Date:</strong> {new Date(showPreview.created_at).toLocaleDateString()}
                        </div>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.7, fontFamily: 'inherit', marginBottom: 30 }}>
                            {showPreview.consent_text}
                        </pre>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid var(--slate-300)', width: 200, marginBottom: 4 }} />
                                <div style={{ fontSize: '0.8125rem' }}>Patient Signature</div>
                                {showPreview.patient_signature && <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.75rem' }}>✅ Signed on {new Date(showPreview.signed_date).toLocaleDateString()}</div>}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid var(--slate-300)', width: 200, marginBottom: 4 }} />
                                <div style={{ fontSize: '0.8125rem' }}>Doctor Signature</div>
                            </div>
                        </div>
                        <div className="invoice-actions" style={{ marginTop: 20 }}>
                            <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
                            <button className="btn btn-secondary" onClick={() => setShowPreview(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
