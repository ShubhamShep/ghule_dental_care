import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, CheckCircle, Eye, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { TREATMENT_PROCEDURES } from '../lib/clinicalData'

export default function TreatmentPlans() {
    const [plans, setPlans] = useState([])
    const [patients, setPatients] = useState([])
    const [doctors, setDoctors] = useState([])
    const [procedures, setProcedures] = useState([])
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDetail, setShowDetail] = useState(null)
    const [detailItems, setDetailItems] = useState([])
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()
    const [form, setForm] = useState({
        patient_id: '', doctor_id: '', title: '', notes: '',
        items: [{ procedure_id: '', tooth_number: '', description: '', estimated_cost: '', notes: '', duration_value: '', duration_unit: 'Days', appointments: '' }]
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [plansRes, patsRes, docsRes, procsRes] = await Promise.all([
            supabase.from('treatment_plans').select('*, patients(full_name, patient_id), doctors(full_name)').order('created_at', { ascending: false }),
            supabase.from('patients').select('id, full_name, patient_id').order('full_name'),
            supabase.from('doctors').select('id, full_name').eq('is_active', true),
            supabase.from('procedures').select('id, name, standard_price').eq('is_active', true).order('name'),
        ])
        setPlans(plansRes.data || [])
        setPatients(patsRes.data || [])
        setDoctors(docsRes.data || [])
        setProcedures(procsRes.data || [])
        setLoading(false)
    }

    const filtered = plans.filter(p => filter === 'all' || p.status === filter)

    const addItem = () => setForm({ ...form, items: [...form.items, { procedure_id: '', tooth_number: '', description: '', estimated_cost: '', notes: '', duration_value: '', duration_unit: 'Days', appointments: '' }] })
    const removeItem = (idx) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, i) => i !== idx) }) }

    const updateItem = (idx, key, value) => {
        const items = [...form.items]
        items[idx][key] = value
        if (key === 'procedure_id' && value) {
            const proc = procedures.find(p => p.id === value)
            if (proc) { items[idx].description = proc.name; items[idx].estimated_cost = proc.standard_price }
        }
        setForm({ ...form, items })
    }

    const totalCost = form.items.reduce((s, i) => s + Number(i.estimated_cost || 0), 0)

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data: plan, error } = await supabase.from('treatment_plans').insert([{
                patient_id: form.patient_id, doctor_id: form.doctor_id || null,
                title: form.title, notes: form.notes, total_estimated_cost: totalCost,
            }]).select().single()
            if (error) throw error

            const items = form.items.filter(i => i.description).map((item, idx) => ({
                treatment_plan_id: plan.id,
                procedure_id: item.procedure_id || null,
                tooth_number: item.tooth_number ? Number(item.tooth_number) : null,
                description: item.description,
                estimated_cost: Number(item.estimated_cost || 0),
                sort_order: idx,
                notes: item.notes,
            }))
            if (items.length) await supabase.from('treatment_plan_items').insert(items)

            toast.success('Treatment plan created!')
            setShowModal(false)
            setForm({ patient_id: '', doctor_id: '', title: '', notes: '', items: [{ procedure_id: '', tooth_number: '', description: '', estimated_cost: '', notes: '', duration_value: '', duration_unit: 'Days', appointments: '' }] })
            fetchData()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const viewDetail = async (plan) => {
        const { data } = await supabase.from('treatment_plan_items').select('*, procedures(name)').eq('treatment_plan_id', plan.id).order('sort_order')
        setDetailItems(data || [])
        setShowDetail(plan)
    }

    const updatePlanStatus = async (id, status) => {
        await supabase.from('treatment_plans').update({ status }).eq('id', id)
        toast.success(`Plan marked as ${status}`)
        fetchData()
        if (showDetail) setShowDetail({ ...showDetail, status })
    }

    const updateItemStatus = async (itemId, status) => {
        await supabase.from('treatment_plan_items').update({ status, completed_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null }).eq('id', itemId)
        toast.success('Item updated')
        if (showDetail) viewDetail(showDetail)
    }

    const statusColors = { planned: '#3b82f6', in_progress: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' }

    if (loading) return <div className="page-fade-in"><SkeletonTable rows={5} cols={6} /></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div className="filter-tabs">
                    {['all', 'planned', 'in_progress', 'completed', 'cancelled'].map(f => (
                        <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> New Treatment Plan</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Title</th><th>Patient</th><th>Doctor</th><th>Est. Cost</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                                    <td>{p.patients?.full_name}<br /><span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>{p.patients?.patient_id}</span></td>
                                    <td>{p.doctors?.full_name || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(p.total_estimated_cost).toLocaleString()}</td>
                                    <td><span className="badge" style={{ background: `${statusColors[p.status]}15`, color: statusColors[p.status] }}>{p.status.replace('_', ' ')}</span></td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn" title="View Details" onClick={() => viewDetail(p)}><Eye size={16} /></button>
                                            {p.status === 'planned' && <button className="action-btn" title="Start" onClick={() => updatePlanStatus(p.id, 'in_progress')} style={{ color: '#f59e0b' }}>▶</button>}
                                            {p.status === 'in_progress' && <button className="action-btn" title="Complete" onClick={() => updatePlanStatus(p.id, 'completed')}><CheckCircle size={16} style={{ color: 'var(--success)' }} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6}><div className="empty-state"><ClipboardList /><h3>No treatment plans</h3></div></td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Treatment Plan</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid" style={{ marginBottom: 20 }}>
                                    <div className="field full">
                                        <label>Plan Title *</label>
                                        <input required placeholder="e.g., Root Canal + Crown - Tooth #36" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Patient *</label>
                                        <select required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                                            <option value="">Select Patient</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Doctor</label>
                                        <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
                                            <option value="">Select Doctor</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="field full">
                                        <label>Notes</label>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 12 }}>Treatment Steps</h4>
                                {form.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="field" style={{ flex: 2, minWidth: 180 }}>
                                            {idx === 0 && <label>Treatment</label>}
                                            <select value={item.procedure_id || item.description} onChange={e => {
                                                const proc = procedures.find(p => p.id === e.target.value)
                                                if (proc) updateItem(idx, 'procedure_id', e.target.value)
                                                else updateItem(idx, 'description', e.target.value)
                                            }}>
                                                <option value="">Select Treatment</option>
                                                <optgroup label="From Procedures Catalog">
                                                    {procedures.map(p => <option key={p.id} value={p.id}>{p.name} (₹{Number(p.standard_price).toLocaleString()})</option>)}
                                                </optgroup>
                                                <optgroup label="Standard Treatments">
                                                    {TREATMENT_PROCEDURES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div className="field" style={{ flex: 0.5, minWidth: 60 }}>
                                            {idx === 0 && <label>Tooth #</label>}
                                            <input type="number" min="1" max="85" placeholder="—" value={item.tooth_number} onChange={e => updateItem(idx, 'tooth_number', e.target.value)} />
                                        </div>
                                        <div className="field" style={{ flex: 0.5, minWidth: 60 }}>
                                            {idx === 0 && <label>Appts</label>}
                                            <input type="number" min="1" placeholder="1" value={item.appointments} onChange={e => updateItem(idx, 'appointments', e.target.value)} />
                                        </div>
                                        <div className="field" style={{ flex: 0.8, minWidth: 100 }}>
                                            {idx === 0 && <label>Duration</label>}
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <input type="number" min="1" placeholder="—" value={item.duration_value} onChange={e => updateItem(idx, 'duration_value', e.target.value)} style={{ width: 50 }} />
                                                <select value={item.duration_unit || 'Days'} onChange={e => updateItem(idx, 'duration_unit', e.target.value)} style={{ fontSize: '0.8rem' }}>
                                                    <option value="Days">Days</option>
                                                    <option value="Weeks">Weeks</option>
                                                    <option value="Months">Months</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="field" style={{ flex: 0.8, minWidth: 80 }}>
                                            {idx === 0 && <label>Cost (₹)</label>}
                                            <input type="number" min="0" placeholder="0" value={item.estimated_cost} onChange={e => updateItem(idx, 'estimated_cost', e.target.value)} />
                                        </div>
                                        <button type="button" style={{ marginBottom: 2 }} className="btn-ghost" onClick={() => removeItem(idx)}><X size={16} /></button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Step</button>
                                <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 700, fontSize: '1.125rem' }}>Total: ₹{totalCost.toLocaleString()}</div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{showDetail.title}</h2>
                            <button className="modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                                <span>Patient: <strong>{showDetail.patients?.full_name}</strong></span>
                                <span>Doctor: <strong>{showDetail.doctors?.full_name || '—'}</strong></span>
                                <span className="badge" style={{ background: `${statusColors[showDetail.status]}15`, color: statusColors[showDetail.status] }}>{showDetail.status.replace('_', ' ')}</span>
                            </div>
                            <table>
                                <thead>
                                    <tr><th>#</th><th>Procedure</th><th>Tooth</th><th>Cost</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, idx) => (
                                        <tr key={item.id}>
                                            <td>{idx + 1}</td>
                                            <td>{item.description || item.procedures?.name}</td>
                                            <td>{item.tooth_number || '—'}</td>
                                            <td>₹{Number(item.estimated_cost).toLocaleString()}</td>
                                            <td>
                                                <select
                                                    value={item.status}
                                                    onChange={e => updateItemStatus(item.id, e.target.value)}
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--border-color)' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 700 }}>
                                Total: ₹{Number(showDetail.total_estimated_cost).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
