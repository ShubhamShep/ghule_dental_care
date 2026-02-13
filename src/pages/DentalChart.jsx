import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const TEETH = {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
}

const CONDITIONS = [
    { value: 'healthy', label: 'Healthy', color: '#22c55e' },
    { value: 'decayed', label: 'Decayed', color: '#ef4444' },
    { value: 'filled', label: 'Filled', color: '#3b82f6' },
    { value: 'crowned', label: 'Crowned', color: '#8b5cf6' },
    { value: 'root_canal', label: 'Root Canal', color: '#f59e0b' },
    { value: 'extracted', label: 'Extracted', color: '#64748b' },
    { value: 'missing', label: 'Missing', color: '#94a3b8' },
    { value: 'implant', label: 'Implant', color: '#06b6d4' },
]

export default function DentalChart() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientId = searchParams.get('patient')
    const [patient, setPatient] = useState(null)
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(patientId || '')
    const [chartData, setChartData] = useState({})
    const [selectedTooth, setSelectedTooth] = useState(null)
    const [toothCondition, setToothCondition] = useState('healthy')
    const [toothNotes, setToothNotes] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchPatients()
    }, [])

    useEffect(() => {
        if (selectedPatient) fetchChart(selectedPatient)
        else { setChartData({}); setLoading(false) }
    }, [selectedPatient])

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('id, full_name, patient_id').order('full_name')
        setPatients(data || [])
        if (patientId) {
            const p = (data || []).find(x => x.id === patientId)
            setPatient(p)
        }
        setLoading(false)
    }

    const fetchChart = async (pid) => {
        const { data } = await supabase.from('dental_chart').select('*').eq('patient_id', pid)
        const map = {}
            ; (data || []).forEach(d => { map[d.tooth_number] = d })
        setChartData(map)
        const p = patients.find(x => x.id === pid)
        setPatient(p)
    }

    const selectTooth = (num) => {
        setSelectedTooth(num)
        const existing = chartData[num]
        setToothCondition(existing?.condition || 'healthy')
        setToothNotes(existing?.notes || '')
    }

    const saveTooth = async () => {
        if (!selectedPatient || !selectedTooth) return
        setSaving(true)
        try {
            const existing = chartData[selectedTooth]
            if (existing) {
                await supabase.from('dental_chart').update({ condition: toothCondition, notes: toothNotes, updated_at: new Date().toISOString() }).eq('id', existing.id)
            } else {
                await supabase.from('dental_chart').insert([{ patient_id: selectedPatient, tooth_number: selectedTooth, condition: toothCondition, notes: toothNotes }])
            }
            toast.success(`Tooth #${selectedTooth} updated`)
            fetchChart(selectedPatient)
            setSelectedTooth(null)
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const getToothColor = (num) => {
        const record = chartData[num]
        if (!record) return '#22c55e'
        return CONDITIONS.find(c => c.value === record.condition)?.color || '#22c55e'
    }

    const getToothLabel = (num) => {
        const record = chartData[num]
        if (!record) return 'Healthy'
        return CONDITIONS.find(c => c.value === record.condition)?.label || 'Healthy'
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            {patientId && (
                <button className="back-btn" onClick={() => navigate(`/patients/${patientId}`)}>
                    <ArrowLeft /> Back to Patient
                </button>
            )}

            {/* Patient selector */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div className="field" style={{ flex: 1, minWidth: 250 }}>
                        <label>Select Patient</label>
                        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">-- Choose a patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                        </select>
                    </div>
                    {patient && <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>Viewing chart for <strong style={{ color: 'var(--text-primary)' }}>{patient.full_name}</strong></div>}
                </div>
            </div>

            {selectedPatient && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                    {/* Tooth Chart */}
                    <div className="card">
                        <div className="card-header"><h3>🦷 Dental Chart</h3></div>
                        <div className="card-body">
                            {/* Upper teeth */}
                            <div style={{ textAlign: 'center', marginBottom: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Upper Jaw</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
                                {TEETH.upper.map((num, i) => (
                                    <div key={num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: '0.625rem', color: 'var(--slate-400)' }}>{num}</span>
                                        <button
                                            onClick={() => selectTooth(num)}
                                            style={{
                                                width: 36, height: 40, borderRadius: '6px 6px 10px 10px',
                                                background: getToothColor(num),
                                                border: selectedTooth === num ? '3px solid var(--slate-900)' : '2px solid rgba(0,0,0,0.1)',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                                opacity: chartData[num]?.condition === 'extracted' || chartData[num]?.condition === 'missing' ? 0.3 : 1,
                                                transform: selectedTooth === num ? 'scale(1.15)' : 'scale(1)',
                                            }}
                                            title={`#${num} - ${getToothLabel(num)}`}
                                        />
                                        {i === 7 && <div style={{ width: 0 }} />}
                                    </div>
                                ))}
                            </div>

                            {/* Center divider */}
                            <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '0.625rem', color: 'var(--slate-300)', letterSpacing: 4 }}>
                                ─── ─── ─── R ─── ─── ─── ─── ─── ─── L ─── ─── ───
                            </div>

                            {/* Lower teeth */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 24 }}>
                                {TEETH.lower.map((num) => (
                                    <div key={num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <button
                                            onClick={() => selectTooth(num)}
                                            style={{
                                                width: 36, height: 40, borderRadius: '10px 10px 6px 6px',
                                                background: getToothColor(num),
                                                border: selectedTooth === num ? '3px solid var(--slate-900)' : '2px solid rgba(0,0,0,0.1)',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                                opacity: chartData[num]?.condition === 'extracted' || chartData[num]?.condition === 'missing' ? 0.3 : 1,
                                                transform: selectedTooth === num ? 'scale(1.15)' : 'scale(1)',
                                            }}
                                            title={`#${num} - ${getToothLabel(num)}`}
                                        />
                                        <span style={{ fontSize: '0.625rem', color: 'var(--slate-400)' }}>{num}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Lower Jaw</div>

                            {/* Legend */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                                {CONDITIONS.map(c => (
                                    <div key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color }} />
                                        {c.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="card" style={{ alignSelf: 'flex-start' }}>
                        <div className="card-header">
                            <h3>{selectedTooth ? `Tooth #${selectedTooth}` : 'Select a Tooth'}</h3>
                        </div>
                        <div className="card-body">
                            {selectedTooth ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="field">
                                        <label>Condition</label>
                                        <select value={toothCondition} onChange={e => setToothCondition(e.target.value)}>
                                            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Notes</label>
                                        <textarea value={toothNotes} onChange={e => setToothNotes(e.target.value)} rows={3} placeholder="Treatment notes..." />
                                    </div>
                                    <button className="btn btn-primary" onClick={saveTooth} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Tooth Record'}
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setSelectedTooth(null)}>Cancel</button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                                    Click on any tooth in the chart to view or update its condition
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!selectedPatient && (
                <div className="card">
                    <div className="card-body">
                        <div className="empty-state">
                            <h3>Select a Patient</h3>
                            <p>Choose a patient to view or edit their dental chart</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
