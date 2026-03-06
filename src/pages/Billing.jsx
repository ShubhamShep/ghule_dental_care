import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X, Eye, Receipt } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'

export default function Billing() {
    const [invoices, setInvoices] = useState([])
    const [patients, setPatients] = useState([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ patient_id: '', payment_method: 'Cash', items: [{ description: '', fee_category: 'Treatment', quantity: 1, unit_price: '' }] })
    const navigate = useNavigate()

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [invRes, patRes] = await Promise.all([
            supabase.from('invoices').select('*, patients(full_name, patient_id)').order('created_at', { ascending: false }),
            supabase.from('patients').select('id, full_name, patient_id').order('full_name'),
        ])
        setInvoices(invRes.data || [])
        setPatients(patRes.data || [])
        setLoading(false)
    }

    const filtered = invoices
        .filter(inv => filter === 'all' || inv.status === filter)
        .filter(inv =>
            (inv.patients?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (inv.invoice_number || '').toLowerCase().includes(search.toLowerCase())
        )

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { description: '', fee_category: 'Treatment', quantity: 1, unit_price: '' }] })
    }

    const removeItem = (idx) => {
        if (form.items.length <= 1) return
        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
    }

    const updateItem = (idx, key, value) => {
        const items = [...form.items]
        items[idx][key] = value
        setForm({ ...form, items })
    }

    const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price || 0)), 0)

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Create invoice
            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert([{
                    invoice_number: '',
                    patient_id: form.patient_id,
                    total_amount: totalAmount,
                    paid_amount: 0,
                    status: 'pending',
                    payment_method: form.payment_method,
                }])
                .select()
                .single()
            if (invError) throw invError

            // Create invoice items
            const items = form.items
                .filter(item => item.description && item.unit_price)
                .map(item => ({
                    invoice_id: invoice.id,
                    description: item.description,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                }))
            if (items.length > 0) {
                const { error: itemsError } = await supabase.from('invoice_items').insert(items)
                if (itemsError) throw itemsError
            }

            toast.success('Invoice created!')
            setShowModal(false)
            setForm({ patient_id: '', payment_method: 'Cash', items: [{ description: '', fee_category: 'Treatment', quantity: 1, unit_price: '' }] })
            fetchData()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="page-fade-in"><SkeletonTable rows={6} cols={6} /></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div className="page-toolbar-left">
                    <div className="search-box">
                        <Search />
                        <input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-tabs">
                        {['all', 'pending', 'paid', 'partial'].map(f => (
                            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Create Invoice
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(inv => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{inv.invoice_number}</td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{inv.patients?.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{inv.patients?.patient_id}</div>
                                        </div>
                                    </td>
                                    <td>{new Date(inv.issued_date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(inv.total_amount).toLocaleString()}</td>
                                    <td>₹{Number(inv.paid_amount).toLocaleString()}</td>
                                    <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn" title="View" onClick={() => navigate(`/billing/${inv.id}`)}>
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <Receipt />
                                            <h3>No invoices found</h3>
                                            <p>Create a new invoice to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Invoice</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid" style={{ marginBottom: 20 }}>
                                    <div className="field">
                                        <label>Patient *</label>
                                        <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                                            <option value="">Select Patient</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Mode</label>
                                        <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 12, color: 'var(--slate-700)' }}>Line Items</h4>
                                {form.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
                                        <div className="field" style={{ flex: 1.2 }}>
                                            {idx === 0 && <label>Fee Category</label>}
                                            <select value={item.fee_category || 'Treatment'} onChange={(e) => updateItem(idx, 'fee_category', e.target.value)}>
                                                <option value="Consultation">Consultation</option>
                                                <option value="X ray">X ray</option>
                                                <option value="Treatment">Treatment</option>
                                            </select>
                                        </div>
                                        <div className="field" style={{ flex: 3 }}>
                                            {idx === 0 && <label>Description</label>}
                                            <input required placeholder="Service description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                                        </div>
                                        <div className="field" style={{ flex: 1 }}>
                                            {idx === 0 && <label>Qty</label>}
                                            <input type="number" min="1" required value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                                        </div>
                                        <div className="field" style={{ flex: 1.5 }}>
                                            {idx === 0 && <label>Unit Price (₹)</label>}
                                            <input type="number" min="0" step="0.01" required placeholder="0.00" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                                        </div>
                                        <button type="button" className="btn-ghost" style={{ marginBottom: 2 }} onClick={() => removeItem(idx)}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 4 }}>
                                    <Plus size={14} /> Add Item
                                </button>

                                <div style={{ marginTop: 20, textAlign: 'right', fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                                    Total: ₹{totalAmount.toLocaleString()}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
