import { useState, useEffect } from 'react'
import { Plus, X, Search, Calculator, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonTable } from '../components/SkeletonLoader'
import { ACCOUNTING_CATEGORIES } from '../lib/clinicalData'

export default function Accounting() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
    const [form, setForm] = useState({ category: 'Staff Salary', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], remark: '' })

    useEffect(() => { fetchRecords() }, [])

    const fetchRecords = async () => {
        const { data } = await supabase.from('accounting').select('*').order('expense_date', { ascending: false })
        setRecords(data || [])
        setLoading(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('accounting').insert({ ...form, amount: Number(form.amount) })
        if (error) toast.error(error.message)
        else {
            toast.success('Expense added!')
            setShowModal(false)
            setForm({ category: 'Staff Salary', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], remark: '' })
            fetchRecords()
        }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this expense?')) return
        await supabase.from('accounting').delete().eq('id', id)
        toast.success('Deleted')
        fetchRecords()
    }

    const filtered = records.filter(r => {
        const matchSearch = !search || r.description?.toLowerCase().includes(search.toLowerCase()) || r.category?.toLowerCase().includes(search.toLowerCase())
        const matchCategory = filterCategory === 'all' || r.category === filterCategory
        const matchMonth = !filterMonth || r.expense_date?.startsWith(filterMonth)
        return matchSearch && matchCategory && matchMonth
    })

    const totalExpense = filtered.reduce((s, r) => s + Number(r.amount || 0), 0)

    // Category-wise breakdown
    const categoryTotals = {}
    filtered.forEach(r => {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + Number(r.amount || 0)
    })

    const exportCSV = () => {
        if (!filtered.length) return
        const headers = ['Date', 'Category', 'Description', 'Amount', 'Remark']
        const rows = filtered.map(r => [r.expense_date, r.category, r.description || '', r.amount, r.remark || ''])
        const csv = [headers.join(','), ...rows.map(row => row.map(c => `"${c}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `accounting_${filterMonth}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) return <div className="page-fade-in"><SkeletonTable rows={6} cols={5} /></div>

    return (
        <div className="page-fade-in">
            <div className="page-toolbar">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-box">
                        <Search size={16} />
                        <input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <option value="all">All Categories</option>
                        {ACCOUNTING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> Export</button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Expense</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                <div className="stat-card rose">
                    <div className="stat-info">
                        <h4>Total Expense</h4>
                        <div className="stat-value">₹{totalExpense.toLocaleString()}</div>
                    </div>
                </div>
                {Object.entries(categoryTotals).map(([cat, total]) => (
                    <div key={cat} className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="stat-info">
                            <h4 style={{ fontSize: '0.7rem' }}>{cat}</h4>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>₹{total.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header"><h3>15) Accounting — {filterMonth || 'All Time'}</h3></div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount (₹)</th><th>Remark</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id}>
                                    <td>{r.expense_date ? new Date(r.expense_date).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <span className="badge" style={{
                                            background: r.category === 'Staff Salary' ? '#3b82f615' : r.category === 'Lab Bill' ? '#f59e0b15' : '#8b5cf615',
                                            color: r.category === 'Staff Salary' ? '#3b82f6' : r.category === 'Lab Bill' ? '#f59e0b' : '#8b5cf6',
                                        }}>{r.category}</span>
                                    </td>
                                    <td>{r.description || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(r.amount).toLocaleString()}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{r.remark || '—'}</td>
                                    <td><button className="action-btn danger" onClick={() => handleDelete(r.id)}><X size={14} /></button></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6}><div className="empty-state"><Calculator /><h3>No expense records</h3></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Expense</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="field">
                                        <label>Category *</label>
                                        <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            {ACCOUNTING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Amount (₹) *</label>
                                        <input type="number" required min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                                    </div>
                                    <div className="field">
                                        <label>Date</label>
                                        <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                                    </div>
                                    <div className="field full">
                                        <label>Description</label>
                                        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                                    </div>
                                    <div className="field full">
                                        <label>Remark</label>
                                        <textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} rows={2} placeholder="Any remarks..." />
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
