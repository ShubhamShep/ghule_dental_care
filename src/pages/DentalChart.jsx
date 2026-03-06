import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonCard } from '../components/SkeletonLoader'
import { DENTAL_CONDITIONS, ORTHODONTIC_FINDINGS } from '../lib/clinicalData'

const TEETH = {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    pedo_upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    pedo_lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
}

// Condition colors for visual chart (PDF doesn't specify colors, using clinical conventions)
const CONDITION_COLORS = {
    'Healthy': '#22c55e',
    'Caries': '#ef4444', 'Caries Arrested': '#f97316', 'Grossly Decayed': '#dc2626',
    'Restoration Composite': '#3b82f6', 'Restoration Amalgam': '#6366f1', 'Restoration GIC': '#8b5cf6', 'Restoration Miracle Mix': '#a78bfa',
    'Crown Metal': '#78716c', 'Crown PFM': '#a8a29e', 'Crown SS': '#d6d3d1', 'Crown Zirconia': '#e7e5e4',
    'Bridge Metal': '#92400e', 'Bridge PFM': '#b45309', 'Bridge Zirconia': '#d97706',
    'Missing': '#94a3b8', 'Avulsed': '#475569', 'Root Piece': '#334155',
    'Incomplete RCT': '#f59e0b', 'Pulp Exposure': '#ea580c',
    'Gingivitis': '#e11d48', 'Periodontitis': '#be123c', 'Calculus': '#7e22ce', 'Plaque': '#6d28d9',
    'Mobility': '#ef4444', 'Swelling': '#ec4899',
}

const getColor = (condition) => CONDITION_COLORS[condition] || '#64748b'

export default function DentalChart() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientId = searchParams.get('patient')
    const [patient, setPatient] = useState(null)
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(patientId || '')
    const [chartData, setChartData] = useState({})
    const [selectedTooth, setSelectedTooth] = useState(null)
    const [toothCondition, setToothCondition] = useState('Healthy')
    const [toothNotes, setToothNotes] = useState('')
    const [dentitionType, setDentitionType] = useState('Adult Dentition')
    const [conditionSearch, setConditionSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Examination fields (Section 4 of PDF)
    const [extraOral, setExtraOral] = useState('')
    const [intraOral, setIntraOral] = useState('')
    const [orthodontic, setOrthodontic] = useState('')

    useEffect(() => { fetchPatients() }, [])
    useEffect(() => {
        if (selectedPatient) fetchChart(selectedPatient)
        else { setChartData({}); setLoading(false) }
    }, [selectedPatient])

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('id, full_name, patient_id').order('full_name')
        setPatients(data || [])
        if (patientId) setPatient((data || []).find(x => x.id === patientId))
        setLoading(false)
    }

    const fetchChart = async (pid) => {
        const { data } = await supabase.from('dental_chart').select('*').eq('patient_id', pid)
        const map = {}
        ;(data || []).forEach(d => { map[d.tooth_number] = d })
        setChartData(map)
        setPatient(patients.find(x => x.id === pid))
    }

    const selectTooth = (num) => {
        setSelectedTooth(num)
        const existing = chartData[num]
        setToothCondition(existing?.condition || 'Healthy')
        setToothNotes(existing?.notes || '')
        setConditionSearch('')
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

    const getToothColor = (num) => getColor(chartData[num]?.condition || 'Healthy')
    const getToothLabel = (num) => chartData[num]?.condition || 'Healthy'

    // Filter conditions based on search
    const filteredConditions = conditionSearch
        ? DENTAL_CONDITIONS.filter(c => c.toLowerCase().includes(conditionSearch.toLowerCase()))
        : DENTAL_CONDITIONS

    const showUpper = !dentitionType.includes('Edentulous Maxilla') && dentitionType !== 'Edentulous Maxilla & Mandible'
    const showLower = !dentitionType.includes('Edentulous Mandible') && dentitionType !== 'Edentulous Maxilla & Mandible'
    const showPedo = dentitionType === 'Pedo Dentition' || dentitionType === 'Mixed Dentition'
    const showAdult = dentitionType === 'Adult Dentition' || dentitionType === 'Mixed Dentition'

    const renderTeethRow = (teeth, isUpper) => (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            {teeth.map((num, i) => (
                <div key={num} style={{ display: 'flex', flexDirection: isUpper ? 'column' : 'column-reverse', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-400)' }}>{num}</span>
                    <button
                        onClick={() => selectTooth(num)}
                        style={{
                            width: 32, height: 36,
                            borderRadius: isUpper ? '5px 5px 8px 8px' : '8px 8px 5px 5px',
                            background: getToothColor(num),
                            border: selectedTooth === num ? '3px solid var(--slate-900)' : '2px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                            opacity: ['Missing', 'Avulsed', 'Root Piece'].includes(chartData[num]?.condition) ? 0.3 : 1,
                            transform: selectedTooth === num ? 'scale(1.15)' : 'scale(1)',
                        }}
                        title={`#${num} - ${getToothLabel(num)}`}
                    />
                    {i === Math.floor(teeth.length / 2) - 1 && <div style={{ width: 8 }} />}
                </div>
            ))}
        </div>
    )

    if (loading) return <div className="page-fade-in"><SkeletonCard /><div style={{ marginTop: 16 }}><SkeletonCard /></div></div>

    return (
        <div className="page-fade-in">
            {patientId && (
                <button className="back-btn" onClick={() => navigate(`/patients/${patientId}`)}>
                    <ArrowLeft /> Back to Patient
                </button>
            )}

            {/* Section: Patient + Dentition Type selector */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div className="field" style={{ flex: 1, minWidth: 250 }}>
                        <label>Select Patient (By Name, Mobile Number)</label>
                        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">-- Choose a patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ minWidth: 220 }}>
                        <label>Dentition Type</label>
                        <select value={dentitionType} onChange={e => setDentitionType(e.target.value)}>
                            <optgroup label="Dentulous">
                                <option>Adult Dentition</option>
                                <option>Pedo Dentition</option>
                                <option>Mixed Dentition</option>
                            </optgroup>
                            <optgroup label="Edentulous">
                                <option>Edentulous Maxilla</option>
                                <option>Edentulous Mandible</option>
                                <option>Edentulous Maxilla & Mandible</option>
                            </optgroup>
                        </select>
                    </div>
                    {patient && <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                        Viewing chart for <strong style={{ color: 'var(--text-primary)' }}>{patient.full_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginLeft: 8 }}>No Access To Receptionist</span>
                    </div>}
                </div>
            </div>

            {selectedPatient && (
                <>
                    {/* Section 4: Examination */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header"><h3>4) Examination</h3></div>
                        <div className="card-body">
                            <div className="form-grid">
                                <div className="field full">
                                    <label>a) Extra Oral Findings</label>
                                    <textarea value={extraOral} onChange={e => setExtraOral(e.target.value)} rows={2} placeholder="Extra oral findings..." />
                                </div>
                                <div className="field full">
                                    <label>b) Intra Oral Findings</label>
                                    <textarea value={intraOral} onChange={e => setIntraOral(e.target.value)} rows={2} placeholder="Intra oral findings..." />
                                </div>
                                <div className="field full">
                                    <label>c) Orthodontic Findings</label>
                                    <select value={orthodontic} onChange={e => setOrthodontic(e.target.value)}>
                                        <option value="">Select if applicable</option>
                                        {ORTHODONTIC_FINDINGS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                        {/* Dental Chart */}
                        <div className="card">
                            <div className="card-header"><h3>🦷 i) Dental Chart — {dentitionType}</h3></div>
                            <div className="card-body">
                                {showUpper && showAdult && (
                                    <>
                                        <div style={{ textAlign: 'center', marginBottom: 6, fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Upper Jaw (Permanent)</div>
                                        {renderTeethRow(TEETH.upper, true)}
                                    </>
                                )}
                                {showUpper && showPedo && (
                                    <>
                                        <div style={{ textAlign: 'center', margin: '12px 0 6px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-500)', textTransform: 'uppercase' }}>Upper Jaw (Primary)</div>
                                        {renderTeethRow(TEETH.pedo_upper, true)}
                                    </>
                                )}

                                <div style={{ textAlign: 'center', margin: '12px 0', fontSize: '0.6rem', color: 'var(--slate-300)', letterSpacing: 3 }}>
                                    ─── R ──── ──── L ───
                                </div>

                                {showLower && showPedo && (
                                    <>
                                        {renderTeethRow(TEETH.pedo_lower, false)}
                                        <div style={{ textAlign: 'center', margin: '6px 0 12px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-500)', textTransform: 'uppercase' }}>Lower Jaw (Primary)</div>
                                    </>
                                )}
                                {showLower && showAdult && (
                                    <>
                                        {renderTeethRow(TEETH.lower, false)}
                                        <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Lower Jaw (Permanent)</div>
                                    </>
                                )}

                                {dentitionType.includes('Edentulous') && (
                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                                        <h3>{dentitionType}</h3>
                                        <p style={{ fontSize: '0.8125rem', marginTop: 8 }}>No teeth to chart</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Side Panel — Tooth condition picker */}
                        <div className="card" style={{ alignSelf: 'flex-start' }}>
                            <div className="card-header">
                                <h3>{selectedTooth ? `# Tooth No. ${selectedTooth}` : 'Select a Tooth'}</h3>
                            </div>
                            <div className="card-body">
                                {selectedTooth ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {/* Search conditions */}
                                        <div className="field">
                                            <label>Search Condition</label>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--slate-400)' }} />
                                                <input
                                                    placeholder="Type to filter..."
                                                    value={conditionSearch}
                                                    onChange={e => setConditionSearch(e.target.value)}
                                                    style={{ fontSize: '0.8rem', paddingLeft: 28 }}
                                                />
                                            </div>
                                        </div>

                                        {/* Condition list — exact PDF order */}
                                        <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 6 }}>
                                            {/* Healthy (default, not in PDF list) */}
                                            {(!conditionSearch || 'healthy'.includes(conditionSearch.toLowerCase())) && (
                                                <label style={{
                                                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', cursor: 'pointer', borderRadius: 4,
                                                    background: toothCondition === 'Healthy' ? '#22c55e15' : 'transparent', fontSize: '0.8rem',
                                                }}>
                                                    <input type="radio" name="cond" checked={toothCondition === 'Healthy'} onChange={() => setToothCondition('Healthy')} />
                                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', flexShrink: 0 }} />
                                                    Healthy
                                                </label>
                                            )}
                                            {filteredConditions.map(c => (
                                                <label key={c} style={{
                                                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', cursor: 'pointer', borderRadius: 4,
                                                    background: toothCondition === c ? `${getColor(c)}15` : 'transparent', fontSize: '0.8rem',
                                                }}>
                                                    <input type="radio" name="cond" checked={toothCondition === c} onChange={() => setToothCondition(c)} />
                                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(c), flexShrink: 0 }} />
                                                    {c}
                                                </label>
                                            ))}
                                        </div>

                                        {/* Y/N + Comment (from PDF) */}
                                        <div className="field">
                                            <label>Comment</label>
                                            <textarea value={toothNotes} onChange={e => setToothNotes(e.target.value)} rows={2} placeholder="Comment..." />
                                        </div>
                                        <button className="btn btn-primary" onClick={saveTooth} disabled={saving}>
                                            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setSelectedTooth(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                                        Click a tooth to view/update condition
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!selectedPatient && (
                <div className="card"><div className="card-body"><div className="empty-state"><h3>Select a Patient</h3><p>Choose a patient to view dental chart</p></div></div></div>
            )}
        </div>
    )
}
