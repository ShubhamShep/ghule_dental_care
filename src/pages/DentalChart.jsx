import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SkeletonCard } from '../components/SkeletonLoader'

const TEETH = {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    pedo_upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    pedo_lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
}

const DENTITION_TYPES = [
    { value: 'adult', label: 'Adult Dentition' },
    { value: 'pedo', label: 'Pedo Dentition' },
    { value: 'mixed', label: 'Mixed Dentition' },
    { value: 'edentulous_maxilla', label: 'Edentulous Maxilla' },
    { value: 'edentulous_mandible', label: 'Edentulous Mandible' },
    { value: 'edentulous_both', label: 'Edentulous Maxilla & Mandible' },
]

// Comprehensive dental conditions from PDF spec
const CONDITION_GROUPS = {
    'Caries & Decay': [
        { value: 'caries', label: 'Caries', color: '#ef4444' },
        { value: 'caries_arrested', label: 'Caries Arrested', color: '#f97316' },
        { value: 'grossly_decayed', label: 'Grossly Decayed', color: '#dc2626' },
    ],
    'Restorations': [
        { value: 'restoration_composite', label: 'Restoration Composite', color: '#3b82f6' },
        { value: 'restoration_amalgam', label: 'Restoration Amalgam', color: '#6366f1' },
        { value: 'restoration_gic', label: 'Restoration GIC', color: '#8b5cf6' },
        { value: 'restoration_miracle_mix', label: 'Restoration Miracle Mix', color: '#a78bfa' },
        { value: 'dislodged_restoration', label: 'Dislodged Restoration', color: '#c084fc' },
    ],
    'Crowns & Bridges': [
        { value: 'crown_metal', label: 'Crown Metal', color: '#78716c' },
        { value: 'crown_pfm', label: 'Crown PFM', color: '#a8a29e' },
        { value: 'crown_zirconia', label: 'Crown Zirconia', color: '#e7e5e4' },
        { value: 'crown_ss', label: 'Crown SS', color: '#d6d3d1' },
        { value: 'dislodged_crown', label: 'Dislodged Crown', color: '#fbbf24' },
        { value: 'bridge_metal', label: 'Bridge Metal', color: '#92400e' },
        { value: 'bridge_pfm', label: 'Bridge PFM', color: '#b45309' },
        { value: 'bridge_zirconia', label: 'Bridge Zirconia', color: '#d97706' },
    ],
    'Endodontic': [
        { value: 'incomplete_rct', label: 'Incomplete RCT', color: '#f59e0b' },
        { value: 'pulp_exposure', label: 'Pulp Exposure', color: '#ea580c' },
        { value: 'periapical_abscess', label: 'Periapical Abscess', color: '#b91c1c' },
        { value: 'pink_tooth', label: 'Pink Tooth', color: '#f472b6' },
    ],
    'Periodontal': [
        { value: 'gingivitis', label: 'Gingivitis', color: '#e11d48' },
        { value: 'periodontitis', label: 'Periodontitis', color: '#be123c' },
        { value: 'periodontal_pocket', label: 'Periodontal Pocket', color: '#9f1239' },
        { value: 'gingival_abscess', label: 'Gingival Abscess', color: '#881337' },
        { value: 'pericoronitis', label: 'Pericoronitis', color: '#a21caf' },
        { value: 'recession', label: 'Recession', color: '#c026d3' },
        { value: 'calculus', label: 'Calculus', color: '#7e22ce' },
        { value: 'plaque', label: 'Plaque', color: '#6d28d9' },
    ],
    'Missing & Extracted': [
        { value: 'missing', label: 'Missing', color: '#94a3b8' },
        { value: 'extracted', label: 'Extracted', color: '#64748b' },
        { value: 'avulsed', label: 'Avulsed', color: '#475569' },
        { value: 'root_piece', label: 'Root Piece', color: '#334155' },
    ],
    'Impacted': [
        { value: 'impacted_mesioangular', label: 'Impacted Mesioangular', color: '#0891b2' },
        { value: 'impacted_distoangular', label: 'Impacted Distoangular', color: '#0e7490' },
        { value: 'impacted_horizontal', label: 'Impacted Horizontally', color: '#155e75' },
        { value: 'impacted_vertical', label: 'Impacted Vertically', color: '#164e63' },
    ],
    'Fractures': [
        { value: 'fracture_supragingival', label: 'Fracture Supragingival', color: '#dc2626' },
        { value: 'fracture_subgingival', label: 'Fracture Subgingival', color: '#b91c1c' },
        { value: 'fracture_vertical', label: 'Fracture Vertical', color: '#991b1b' },
        { value: 'fractured_cusp', label: 'Fractured Cusp', color: '#7f1d1d' },
        { value: 'fractured_cusp_pulp', label: 'Fractured Cusp with Pulp Exposure', color: '#450a0a' },
    ],
    'Bite & Alignment': [
        { value: 'cross_bite', label: 'Cross Bite', color: '#0284c7' },
        { value: 'deep_bite', label: 'Deep Bite', color: '#0369a1' },
        { value: 'open_bite', label: 'Open Bite', color: '#075985' },
        { value: 'diastema', label: 'Diastema', color: '#0c4a6e' },
        { value: 'supra_erupted', label: 'Supra-erupted', color: '#082f49' },
        { value: 'over_retained', label: 'Over-Retained Deciduous', color: '#1e3a5f' },
        { value: 'supernumerary_mesiodens', label: 'Supernumerary Mesiodens', color: '#1e40af' },
        { value: 'supernumerary_paramolar', label: 'Supernumerary Paramolar', color: '#1d4ed8' },
        { value: 'supernumerary_distomolar', label: 'Supernumerary Distomolar', color: '#2563eb' },
        { value: 'malformed', label: 'Malformed', color: '#3b82f6' },
    ],
    'Wear & Sensitivity': [
        { value: 'abrasion', label: 'Abrasion', color: '#ca8a04' },
        { value: 'attrition', label: 'Attrition', color: '#a16207' },
        { value: 'erosion', label: 'Erosion', color: '#854d0e' },
        { value: 'abfraction', label: 'Abfraction', color: '#713f12' },
        { value: 'sensitivity_cold', label: 'Sensitivity to Cold', color: '#06b6d4' },
        { value: 'discolored', label: 'Discolored', color: '#475569' },
        { value: 'fluorosis', label: 'Fluorosis', color: '#65a30d' },
    ],
    'Soft Tissue': [
        { value: 'leukoplakia', label: 'Leukoplakia', color: '#d4d4d8' },
        { value: 'erythroplakia', label: 'Erythroplakia', color: '#fb7185' },
        { value: 'lichen_planus', label: 'Lichen Planus', color: '#c084fc' },
        { value: 'osmf', label: 'OSMF', color: '#f43f5e' },
        { value: 'ulcer_traumatic', label: 'Ulcer Traumatic', color: '#e11d48' },
        { value: 'ulcer_non_healing', label: 'Ulcer Non-Healing', color: '#be123c' },
        { value: 'swelling', label: 'Swelling', color: '#ec4899' },
        { value: 'sinus', label: 'Sinus', color: '#db2777' },
    ],
    'Prosthetic': [
        { value: 'implant', label: 'Implant Supported Prosthesis', color: '#06b6d4' },
        { value: 'loose_denture', label: 'Loose Denture', color: '#0891b2' },
        { value: 'quack_rpd', label: 'Quack RPD', color: '#0e7490' },
        { value: 'tfo', label: 'TFO', color: '#155e75' },
    ],
    'General': [
        { value: 'healthy', label: 'Healthy', color: '#22c55e' },
        { value: 'food_impaction', label: 'Food Impaction', color: '#f59e0b' },
        { value: 'mobility', label: 'Mobility', color: '#ef4444' },
        { value: 'tenderness', label: 'Tenderness', color: '#f87171' },
    ],
}

const ALL_CONDITIONS = Object.values(CONDITION_GROUPS).flat()

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
    const [tenderness, setTenderness] = useState(false)
    const [dentitionType, setDentitionType] = useState('adult')
    const [conditionSearch, setConditionSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
        if (patientId) {
            const p = (data || []).find(x => x.id === patientId)
            setPatient(p)
        }
        setLoading(false)
    }

    const fetchChart = async (pid) => {
        const { data } = await supabase.from('dental_chart').select('*').eq('patient_id', pid)
        const map = {}
        ;(data || []).forEach(d => { map[d.tooth_number] = d })
        setChartData(map)
        const p = patients.find(x => x.id === pid)
        setPatient(p)
    }

    const selectTooth = (num) => {
        setSelectedTooth(num)
        const existing = chartData[num]
        setToothCondition(existing?.condition || 'healthy')
        setToothNotes(existing?.notes || '')
        setConditionSearch('')
    }

    const saveTooth = async () => {
        if (!selectedPatient || !selectedTooth) return
        setSaving(true)
        try {
            const existing = chartData[selectedTooth]
            if (existing) {
                await supabase.from('dental_chart').update({
                    condition: toothCondition, notes: toothNotes,
                    updated_at: new Date().toISOString()
                }).eq('id', existing.id)
            } else {
                await supabase.from('dental_chart').insert([{
                    patient_id: selectedPatient, tooth_number: selectedTooth,
                    condition: toothCondition, notes: toothNotes
                }])
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
        return ALL_CONDITIONS.find(c => c.value === record.condition)?.color || '#22c55e'
    }

    const getToothLabel = (num) => {
        const record = chartData[num]
        if (!record) return 'Healthy'
        return ALL_CONDITIONS.find(c => c.value === record.condition)?.label || 'Healthy'
    }

    const filteredConditions = conditionSearch
        ? Object.entries(CONDITION_GROUPS).reduce((acc, [group, items]) => {
            const matched = items.filter(c => c.label.toLowerCase().includes(conditionSearch.toLowerCase()))
            if (matched.length > 0) acc[group] = matched
            return acc
        }, {})
        : CONDITION_GROUPS

    const showUpper = !dentitionType.includes('edentulous_maxilla') && dentitionType !== 'edentulous_both'
    const showLower = !dentitionType.includes('edentulous_mandible') && dentitionType !== 'edentulous_both'
    const showPedo = dentitionType === 'pedo' || dentitionType === 'mixed'
    const showAdult = dentitionType === 'adult' || dentitionType === 'mixed'

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
                            opacity: ['extracted', 'missing', 'avulsed'].includes(chartData[num]?.condition) ? 0.3 : 1,
                            transform: selectedTooth === num ? 'scale(1.15)' : 'scale(1)',
                            fontSize: '0.5rem', color: '#fff', fontWeight: 700,
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

            {/* Patient selector + Dentition type */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div className="field" style={{ flex: 1, minWidth: 250 }}>
                        <label>Select Patient</label>
                        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">-- Choose a patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ minWidth: 200 }}>
                        <label>Dentition Type</label>
                        <select value={dentitionType} onChange={e => setDentitionType(e.target.value)}>
                            {DENTITION_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                    {patient && <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>Viewing chart for <strong style={{ color: 'var(--text-primary)' }}>{patient.full_name}</strong></div>}
                </div>
            </div>

            {selectedPatient && (
                <>
                    {/* Examination Findings */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header"><h3>🔍 Examination Findings</h3></div>
                        <div className="card-body">
                            <div className="form-grid">
                                <div className="field full">
                                    <label>Extra Oral Findings</label>
                                    <textarea value={extraOral} onChange={e => setExtraOral(e.target.value)} rows={2} placeholder="Note any extra-oral findings..." />
                                </div>
                                <div className="field full">
                                    <label>Intra Oral Findings</label>
                                    <textarea value={intraOral} onChange={e => setIntraOral(e.target.value)} rows={2} placeholder="Document intra-oral observations..." />
                                </div>
                                <div className="field full">
                                    <label>Orthodontic Findings</label>
                                    <select value={orthodontic} onChange={e => setOrthodontic(e.target.value)}>
                                        <option value="">Select if applicable</option>
                                        <option>Crowding in Maxillary teeth</option>
                                        <option>Crowding In Mandibular Teeth</option>
                                        <option>Crowding in Maxillary & Mandibular Teeth</option>
                                        <option>Spacing in Maxillary teeth</option>
                                        <option>Spacing in Mandibular Teeth</option>
                                        <option>Proclined Maxillary teeth</option>
                                        <option>Proclined Maxillary & Mandibular Teeth</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                        {/* Tooth Chart */}
                        <div className="card">
                            <div className="card-header"><h3>🦷 Dental Chart — {DENTITION_TYPES.find(d => d.value === dentitionType)?.label}</h3></div>
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

                                {dentitionType.includes('edentulous') && (
                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                                        <h3>{DENTITION_TYPES.find(d => d.value === dentitionType)?.label}</h3>
                                        <p style={{ fontSize: '0.8125rem', marginTop: 8 }}>No teeth to chart for this dentition type</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Side Panel */}
                        <div className="card" style={{ alignSelf: 'flex-start' }}>
                            <div className="card-header">
                                <h3>{selectedTooth ? `Tooth #${selectedTooth}` : 'Select a Tooth'}</h3>
                            </div>
                            <div className="card-body">
                                {selectedTooth ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {/* Condition search */}
                                        <div className="field">
                                            <label>Search Condition</label>
                                            <input
                                                placeholder="Type to filter..."
                                                value={conditionSearch}
                                                onChange={e => setConditionSearch(e.target.value)}
                                                style={{ fontSize: '0.8125rem' }}
                                            />
                                        </div>

                                        {/* Grouped condition list */}
                                        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}>
                                            {Object.entries(filteredConditions).map(([group, items]) => (
                                                <div key={group} style={{ marginBottom: 8 }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-400)', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>{group}</div>
                                                    {items.map(c => (
                                                        <label key={c.value} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', borderRadius: 4,
                                                            background: toothCondition === c.value ? `${c.color}15` : 'transparent',
                                                            fontSize: '0.8rem',
                                                        }}>
                                                            <input
                                                                type="radio" name="condition"
                                                                checked={toothCondition === c.value}
                                                                onChange={() => setToothCondition(c.value)}
                                                            />
                                                            <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                                                            {c.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="field">
                                            <label>Notes</label>
                                            <textarea value={toothNotes} onChange={e => setToothNotes(e.target.value)} rows={2} placeholder="Treatment notes..." />
                                        </div>
                                        <button className="btn btn-primary" onClick={saveTooth} disabled={saving}>
                                            <Save size={14} /> {saving ? 'Saving...' : 'Save Tooth Record'}
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setSelectedTooth(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                                        Click on any tooth to view or update its condition
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
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
