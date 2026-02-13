import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const categories = ['All', 'Preventive', 'Restorative', 'Endodontic', 'Prosthodontic', 'Surgical', 'Cosmetic', 'Orthodontic', 'Diagnostic']

const initialForm = { name: '', category: 'Preventive', description: '', standard_price: '', duration_minutes: 30 }

export default function Procedures() {
    const [procedures, setProcedures] = useState([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchProcedures() }, [])

    const fetchProcedures = async () => {
        const { data } = await supabase.from('procedures').select('*').eq('is_active', true).order('category').order('name')
        setProcedures(data || [])
        setLoading(false)
    }

    const filtered = procedures
        .filter(p => category === 'All' || p.category === category)
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

    const openAdd = () => { setEditingId(null); setForm(initialForm); setShowModal(true) }

    const openEdit = (proc) => {
        setEditingId(proc.id)
        setForm({ name: proc.name, category: proc.category, description: proc.description || '', standard_price: proc.standard_price, duration_minutes: proc.duration_minutes })
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = { ...form, standard_price: Number(form.standard_price) }
            if (editingId) {
                const { error } = await supabase.from('procedures').update(payload).eq('id', editingId)
                if (error) throw error
                toast.success('Procedure updated!')
            } else {
                const { error } = await supabase.from('procedures').insert([payload])
                if (error) throw error
                toast.success('Procedure added!')
            }
            setShowModal(false)
            fetchProcedures()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this procedure?')) return
        await supabase.from('procedures').update({ is_active: false }).eq('id', id)
        toast.success('Procedure removed')
        fetchProcedures()
    }

    const categoryColors = {
        Preventive: '#10b981', Restorative: '#3b82f6', Endodontic: '#f59e0b',
        Prosthodontic: '#8b5cf6', Surgical: '#ef4444', Cosmetic: '#ec4899',
        Orthodontic: '#06b6d4', Diagnostic: '#64748b'
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-box">
                        <Search />
                        <input placeholder="Search procedures..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Procedure</button>
            </div>

            <div className="filter-tabs" style={{ marginBottom: 20 }}>
                {categories.map(c => (
                    <button key={c} className={`filter-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
                ))}
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Procedure</th>
                                <th>Category</th>
                                <th>Duration</th>
                                <th>Price (₹)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                                        {p.description && <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: 2 }}>{p.description}</div>}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: `${categoryColors[p.category]}15`, color: categoryColors[p.category] }}>
                                            {p.category}
                                        </span>
                                    </td>
                                    <td>{p.duration_minutes} min</td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(p.standard_price).toLocaleString()}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn" onClick={() => openEdit(p)}><Edit size={16} /></button>
                                            <button className="action-btn danger" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={5}><div className="empty-state"><h3>No procedures found</h3></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Procedure' : 'Add Procedure'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field full">
                                        <label>Procedure Name *</label>
                                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Category *</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Duration (minutes)</label>
                                        <input type="number" min="5" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
                                    </div>
                                    <div className="field">
                                        <label>Standard Price (₹) *</label>
                                        <input type="number" min="0" required value={form.standard_price} onChange={e => setForm({ ...form, standard_price: e.target.value })} />
                                    </div>
                                    <div className="field full">
                                        <label>Description</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Procedure'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
