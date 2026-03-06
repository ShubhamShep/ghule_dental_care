import { useState, useEffect } from 'react'
import { Plus, Search, Printer, X, Pill } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { MEDICINE_DATABASE, DOSE_OPTIONS, FREQUENCY_OPTIONS, INSTRUCTION_OPTIONS } from '../lib/clinicalData'

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ patient_id: '', doctor_name: '', diagnosis: '', advice: '' })
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', instruction: '', days: '' }])
  const [clinicInfo, setClinicInfo] = useState(null)
  const [medSearch, setMedSearch] = useState({})

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

  const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', frequency: '', instruction: '', days: '' }])
  const removeMedicine = (idx) => setMedicines(medicines.filter((_, i) => i !== idx))
  const updateMedicine = (idx, key, val) => {
    const copy = [...medicines]; copy[idx][key] = val; setMedicines(copy)
  }

  const selectMedicine = (idx, med) => {
    const copy = [...medicines]
    copy[idx].name = med.name
    copy[idx].composition = med.composition
    setMedicines(copy)
    setMedSearch({ ...medSearch, [idx]: '' })
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
      setMedicines([{ name: '', dosage: '', frequency: '', instruction: '', days: '' }])
      fetchData()
    }
  }

  const filteredRx = prescriptions.filter(rx =>
    rx.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.diagnosis?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-fade-in"><SkeletonTable rows={6} cols={5} /></div>

  return (
    <div className="page-fade-in">
      <div className="page-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search prescriptions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Prescription
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Date</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Medicines</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredRx.map(rx => (
                <tr key={rx.id}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(rx.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{rx.patients?.full_name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{rx.doctor_name || '—'}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rx.diagnosis || '—'}</td>
                  <td><span className="badge scheduled">{(rx.medicines || []).length} items</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(rx)}>View</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setShowPreview(rx); setTimeout(() => window.print(), 500) }}>
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
          <div className="modal modal-lg" style={{ maxWidth: 900 }} onClick={e => e.stopPropagation()}>
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

                {/* Medicine table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '40px 2.5fr 1fr 1fr 1.2fr 0.7fr 40px', gap: 6, marginBottom: 6, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--slate-400)', padding: '0 4px' }}>
                  <span>Sr.</span><span>Medicine</span><span>Dose</span><span>Frequency</span><span>Instruction</span><span>Days</span><span></span>
                </div>

                {medicines.map((med, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 2.5fr 1fr 1fr 1.2fr 0.7fr 40px', gap: 6, marginBottom: 8, alignItems: 'start', position: 'relative' }}>
                    <div style={{ padding: '8px 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-400)' }}>{idx + 1}.</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="Search medicine..."
                        value={medSearch[idx] !== undefined ? medSearch[idx] : med.name}
                        onChange={e => {
                          setMedSearch({ ...medSearch, [idx]: e.target.value })
                          updateMedicine(idx, 'name', e.target.value)
                        }}
                        onFocus={() => setMedSearch({ ...medSearch, [idx]: med.name })}
                        onBlur={() => setTimeout(() => setMedSearch({ ...medSearch, [idx]: undefined }), 200)}
                        style={{ fontSize: '0.8rem' }}
                      />
                      {med.composition && <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', marginTop: 2, padding: '0 4px' }}>{med.composition}</div>}
                      {medSearch[idx] !== undefined && medSearch[idx].length > 1 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                          borderRadius: 8, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}>
                          {MEDICINE_DATABASE.filter(m =>
                            m.name.toLowerCase().includes((medSearch[idx] || '').toLowerCase()) ||
                            m.composition.toLowerCase().includes((medSearch[idx] || '').toLowerCase())
                          ).slice(0, 10).map((m, mi) => (
                            <div key={mi} onClick={() => selectMedicine(idx, m)}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                              onMouseEnter={e => e.target.style.background = 'var(--slate-50)'}
                              onMouseLeave={e => e.target.style.background = 'transparent'}>
                              <div style={{ fontWeight: 500 }}>{m.name}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>{m.composition}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <select value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} style={{ fontSize: '0.8rem' }}>
                      <option value="">Dose</option>
                      {DOSE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} style={{ fontSize: '0.8rem' }}>
                      <option value="">Freq.</option>
                      {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={med.instruction} onChange={e => updateMedicine(idx, 'instruction', e.target.value)} style={{ fontSize: '0.8rem' }}>
                      <option value="">Instruction</option>
                      {INSTRUCTION_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <input type="number" min="1" placeholder="Days" value={med.days} onChange={e => updateMedicine(idx, 'days', e.target.value)} style={{ fontSize: '0.8rem' }} />
                    {medicines.length > 1 && (
                      <button type="button" className="btn-ghost" onClick={() => removeMedicine(idx)} style={{ padding: 4 }}><X size={14} /></button>
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
                <tr><th>#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Instruction</th><th>Days</th></tr>
              </thead>
              <tbody>
                {(showPreview.medicines || []).map((med, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{med.name}</div>
                      {med.composition && <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>{med.composition}</div>}
                    </td>
                    <td>{med.dosage || '—'}</td>
                    <td>{med.frequency || '—'}</td>
                    <td>{med.instruction || '—'}</td>
                    <td>{med.days ? `${med.days} days` : '—'}</td>
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
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>This is a computer-generated prescription.</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid var(--slate-300)', width: 200, marginBottom: 4 }}></div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{showPreview.doctor_name || 'Doctor'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Signature</div>
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
