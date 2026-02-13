import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Settings() {
    const [form, setForm] = useState({
        clinic_name: '', address: '', phone: '', email: '', website: '',
        gst_number: '', working_hours: '', working_days: '', logo_url: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchSettings() }, [])

    const fetchSettings = async () => {
        const { data } = await supabase.from('clinic_settings').select('*').limit(1).single()
        if (data) {
            setForm({
                clinic_name: data.clinic_name || '',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
                website: data.website || '',
                gst_number: data.gst_number || '',
                working_hours: data.working_hours || '',
                working_days: data.working_days || '',
                logo_url: data.logo_url || '',
            })
        }
        setLoading(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data: existing } = await supabase.from('clinic_settings').select('id').limit(1).single()
            if (existing) {
                const { error } = await supabase.from('clinic_settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', existing.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('clinic_settings').insert([form])
                if (error) throw error
            }
            toast.success('Settings saved!')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div style={{ maxWidth: 700 }}>
            <div className="card">
                <div className="card-header">
                    <h3>🏥 Clinic Information</h3>
                </div>
                <form onSubmit={handleSave}>
                    <div className="card-body">
                        <div className="form-grid">
                            <div className="field full">
                                <label>Clinic Name</label>
                                <input value={form.clinic_name} onChange={e => setForm({ ...form, clinic_name: e.target.value })} placeholder="Ghule Dental Care" />
                            </div>
                            <div className="field full">
                                <label>Address</label>
                                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Full clinic address" />
                            </div>
                            <div className="field">
                                <label>Phone</label>
                                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91-XXXXXXXXXX" />
                            </div>
                            <div className="field">
                                <label>Email</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@clinic.com" />
                            </div>
                            <div className="field">
                                <label>Website</label>
                                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="www.clinic.com" />
                            </div>
                            <div className="field">
                                <label>GST Number</label>
                                <input value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} placeholder="GSTIN" />
                            </div>
                            <div className="field">
                                <label>Working Hours</label>
                                <input value={form.working_hours} onChange={e => setForm({ ...form, working_hours: e.target.value })} placeholder="9:00 AM - 7:00 PM" />
                            </div>
                            <div className="field">
                                <label>Working Days</label>
                                <input value={form.working_days} onChange={e => setForm({ ...form, working_days: e.target.value })} placeholder="Mon-Sat" />
                            </div>
                            <div className="field full">
                                <label>Logo URL</label>
                                <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://example.com/logo.png" />
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
