import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function InvoiceDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchInvoice() }, [id])

    const fetchInvoice = async () => {
        const [invRes, itemsRes] = await Promise.all([
            supabase.from('invoices').select('*, patients(full_name, patient_id, phone, email, address)').eq('id', id).single(),
            supabase.from('invoice_items').select('*').eq('invoice_id', id),
        ])
        setInvoice(invRes.data)
        setItems(itemsRes.data || [])
        setLoading(false)
    }

    const markAsPaid = async () => {
        const { error } = await supabase
            .from('invoices')
            .update({ status: 'paid', paid_amount: invoice.total_amount })
            .eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success('Invoice marked as paid'); fetchInvoice() }
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>
    if (!invoice) return <div className="empty-state"><h3>Invoice not found</h3></div>

    const balance = Number(invoice.total_amount) - Number(invoice.paid_amount)

    return (
        <div className="invoice-page">
            <button className="back-btn" onClick={() => navigate('/billing')}>
                <ArrowLeft /> Back to Billing
            </button>

            <div className="invoice-card">
                <div className="invoice-header-bar">
                    <div>
                        <h2>Invoice</h2>
                        <div className="inv-number">{invoice.invoice_number}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${invoice.status}`} style={{ fontSize: '0.875rem', padding: '6px 14px' }}>
                            {invoice.status.toUpperCase()}
                        </span>
                        <div style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--slate-400)' }}>
                            Issued: {new Date(invoice.issued_date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="invoice-details">
                    <div className="invoice-parties">
                        <div className="invoice-party">
                            <h4>From</h4>
                            <p><strong>MediCare Pro Clinic</strong><br />123 Medical Street<br />Healthcare City, India<br />Phone: +91-1234567890</p>
                        </div>
                        <div className="invoice-party">
                            <h4>Bill To</h4>
                            <p>
                                <strong>{invoice.patients?.full_name}</strong><br />
                                {invoice.patients?.patient_id}<br />
                                {invoice.patients?.address || 'N/A'}<br />
                                {invoice.patients?.phone || ''}
                            </p>
                        </div>
                    </div>

                    <div className="invoice-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td>{idx + 1}</td>
                                        <td>{item.description}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{Number(item.unit_price).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(item.total).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: 24 }}>
                                            No line items
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="invoice-totals">
                        <div className="invoice-totals-table">
                            <div className="invoice-totals-row">
                                <span>Subtotal</span>
                                <span>₹{Number(invoice.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="invoice-totals-row">
                                <span>Paid</span>
                                <span style={{ color: 'var(--success)' }}>₹{Number(invoice.paid_amount).toLocaleString()}</span>
                            </div>
                            <div className="invoice-totals-row total">
                                <span>Balance Due</span>
                                <span style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                    ₹{balance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {invoice.payment_method && (
                        <div style={{ marginTop: 16, fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                            Payment Method: <strong style={{ color: 'var(--slate-700)' }}>{invoice.payment_method}</strong>
                        </div>
                    )}
                </div>

                <div className="invoice-actions">
                    {invoice.status !== 'paid' && (
                        <button className="btn btn-primary" onClick={markAsPaid}>
                            <CheckCircle size={16} /> Mark as Paid
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>
        </div>
    )
}
