import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonCard } from '../components/SkeletonLoader'

const PAYMENT_ICONS = { cash: '💵', upi: '📱', card: '💳', insurance: '🏥', other: '📋' }

export default function InvoiceDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState(null)
    const [items, setItems] = useState([])
    const [clinicInfo, setClinicInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [payAmount, setPayAmount] = useState('')

    useEffect(() => { fetchInvoice() }, [id])

    const fetchInvoice = async () => {
        const [invRes, itemsRes, settingsRes] = await Promise.all([
            supabase.from('invoices').select('*, patients(full_name, patient_id, phone, email, address)').eq('id', id).single(),
            supabase.from('invoice_items').select('*').eq('invoice_id', id),
            supabase.from('clinic_settings').select('*').limit(1).single(),
        ])
        setInvoice(invRes.data)
        setItems(itemsRes.data || [])
        setClinicInfo(settingsRes.data)
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

    const recordPartialPayment = async () => {
        const amount = Number(payAmount)
        if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
        const newPaid = Number(invoice.paid_amount) + amount
        const newStatus = newPaid >= Number(invoice.total_amount) ? 'paid' : 'partial'
        const { error } = await supabase
            .from('invoices')
            .update({ status: newStatus, paid_amount: Math.min(newPaid, Number(invoice.total_amount)) })
            .eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success(`₹${amount.toLocaleString()} payment recorded`); setPayAmount(''); fetchInvoice() }
    }

    if (loading) return <div className="page-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}><SkeletonCard /><div style={{ marginTop: 16 }}><SkeletonCard /></div></div>

    if (!invoice) return <div className="empty-state"><h3>Invoice not found</h3></div>

    const balance = Number(invoice.total_amount) - Number(invoice.paid_amount)

    return (
        <div className="page-fade-in invoice-page">
            <button className="back-btn" onClick={() => navigate('/billing')}>
                <ArrowLeft /> Back to Billing
            </button>

            <div className="invoice-card">
                {/* Clinic Letterhead */}
                <div className="invoice-header-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/ghule_dental_care/logo.svg" alt="" width="40" height="40" style={{ borderRadius: 8 }} />
                        <div>
                            <h2>{clinicInfo?.clinic_name || 'Ghule Dental Care'}</h2>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                                {clinicInfo?.address || 'Dental Clinic'}
                                {clinicInfo?.phone ? ` · Ph: ${clinicInfo.phone}` : ''}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${invoice.status}`} style={{ fontSize: '0.875rem', padding: '6px 14px' }}>
                            {invoice.status.toUpperCase()}
                        </span>
                        <div style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--slate-400)' }}>
                            {new Date(invoice.issued_date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="invoice-details">
                    <div className="invoice-parties">
                        <div className="invoice-party">
                            <h4>Invoice</h4>
                            <p style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--primary-600)' }}>{invoice.invoice_number}</p>
                            {invoice.payment_method && (
                                <p style={{ marginTop: 8, fontSize: '0.8125rem' }}>
                                    {PAYMENT_ICONS[invoice.payment_method] || '📋'} {invoice.payment_method.toUpperCase()}
                                </p>
                            )}
                            {clinicInfo?.gst_number && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: 4 }}>GST: {clinicInfo.gst_number}</p>
                            )}
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
                </div>

                <div className="invoice-actions">
                    {invoice.status !== 'paid' && balance > 0 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="number"
                                placeholder="₹ Amount"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                            />
                            <button className="btn btn-secondary" onClick={recordPartialPayment}>
                                <CreditCard size={16} /> Record Payment
                            </button>
                        </div>
                    )}
                    {invoice.status !== 'paid' && (
                        <button className="btn btn-primary" onClick={markAsPaid}>
                            <CheckCircle size={16} /> Mark Fully Paid
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
