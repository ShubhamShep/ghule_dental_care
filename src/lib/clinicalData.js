// Pre-populated medicine database from clinic PDF spec
export const MEDICINE_DATABASE = [
    // Antibiotics
    { name: 'Tab. Velclav 625', composition: 'Amoxycillin 500mg + Potassium Clavulanate 125mg', category: 'Antibiotic' },
    { name: 'Tab. Clavam 625', composition: 'Amoxycillin 500mg + Potassium Clavulanate 125mg', category: 'Antibiotic' },
    { name: 'Tab. Clavam Forte DT', composition: 'Amoxycillin 400mg + Clavulanic Acid 57mg', category: 'Antibiotic' },
    { name: 'Tab. Clavam 375', composition: 'Amoxycillin 250mg + Potassium Clavulanate 125mg', category: 'Antibiotic' },
    { name: 'Tab. Clavam XR', composition: 'Amoxycillin 1000mg + Clavulanic Acid 62.5mg', category: 'Antibiotic' },
    { name: 'Tab. Amoxcla KT-DT', composition: 'Amoxycillin + Clavulanic Acid', category: 'Antibiotic' },
    { name: 'Tab. Flagyl 400', composition: 'Metronidazole 400mg', category: 'Antibiotic' },
    { name: 'Tab. Flagyl 200', composition: 'Metronidazole 200mg', category: 'Antibiotic' },
    { name: 'Tab. Cefixime 200', composition: 'Cefixime 200mg', category: 'Antibiotic' },
    { name: 'Tab. Cefig 200 CV', composition: 'Cefixime 200mg + Clavulanic Acid 125mg', category: 'Antibiotic' },
    { name: 'Syr. Clavam BID Dry Syrup', composition: 'Amoxycillin 200mg/5ml + Clavulanic Acid 28.5mg/5ml', category: 'Antibiotic' },
    { name: 'Syr. Clavam Forte', composition: 'Amoxycillin 400mg/5ml + Clavulanic Acid 57mg/5ml', category: 'Antibiotic' },
    { name: 'Syr. Flagyl 200 Suspension', composition: 'Metronidazole 200mg/5ml', category: 'Antibiotic' },

    // Analgesics / Anti-inflammatory
    { name: 'Tab. Ketorol', composition: 'Ketorolac 10mg', category: 'Analgesic' },
    { name: 'Tab. Ketorol-DT', composition: 'Ketorolac 10mg', category: 'Analgesic' },
    { name: 'Tab. Ketlok-DT', composition: 'Ketorolac 10mg', category: 'Analgesic' },
    { name: 'Tab. Anak-SP', composition: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg', category: 'Analgesic' },
    { name: 'Tab. Anak-P', composition: 'Aceclofenac + Paracetamol', category: 'Analgesic' },
    { name: 'Tab. Zerodol', composition: 'Aceclofenac 100mg', category: 'Analgesic' },
    { name: 'Tab. Zerodol-P', composition: 'Aceclofenac 100mg + Paracetamol 325mg', category: 'Analgesic' },
    { name: 'Tab. Zerodol-S', composition: 'Aceclofenac 100mg + Serratiopeptidase 15mg', category: 'Analgesic' },
    { name: 'Tab. Zerodol-SP', composition: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg', category: 'Analgesic' },
    { name: 'Tab. Zerodol-MR', composition: 'Aceclofenac 100mg + Tizanidine 2mg', category: 'Analgesic' },
    { name: 'Tab. Zerodol-TH4', composition: 'Aceclofenac 100mg + Thiocolchicoside 4mg', category: 'Analgesic' },
    { name: 'Tab. Zerodol TC', composition: 'Aceclofenac 100mg + Paracetamol 325mg + Trypsin Chymotrypsin 150000AU', category: 'Analgesic' },
    { name: 'Tab. Zerodol-PG 200/75 SR', composition: 'Aceclofenac 200mg + Pregabalin 75mg', category: 'Analgesic' },
    { name: 'Tab. Brufen 600', composition: 'Ibuprofen 600mg', category: 'Analgesic' },
    { name: 'Tab. Brufen 400', composition: 'Ibuprofen 400mg', category: 'Analgesic' },
    { name: 'Tab. Paracetamol 500', composition: 'Paracetamol 500mg', category: 'Analgesic' },
    { name: 'Tab. Paracetamol 650', composition: 'Paracetamol 650mg', category: 'Analgesic' },
    { name: 'Tab. Combiflam', composition: 'Ibuprofen 400mg + Paracetamol 325mg', category: 'Analgesic' },
    { name: 'Tab. Dolonex-DT 20mg', composition: 'Piroxicam 20mg', category: 'Analgesic' },
    { name: 'Syr. Meftagesic DS Suspension', composition: 'Mefenamic Acid 100mg/5ml + Paracetamol 250mg/5ml', category: 'Analgesic' },
    { name: 'Syr. Meftagesic-P Suspension', composition: 'Mefenamic Acid 50mg/5ml + Paracetamol 125mg/5ml', category: 'Analgesic' },

    // Enzymes
    { name: 'Tab. Chymorol Forte', composition: 'Trypsin Chymotrypsin 100000AU', category: 'Enzyme' },
    { name: 'Tab. Chymoral Plus', composition: 'Diclofenac 50mg + Trypsin Chymotrypsin 50000IU', category: 'Enzyme' },
    { name: 'Tab. Chymoral-AP', composition: 'Aceclofenac 100mg + Paracetamol 325mg + Trypsin Chymotrypsin 50000AU', category: 'Enzyme' },
    { name: 'Tab. Tolyb', composition: 'Rutin, Papine & Trypsin', category: 'Enzyme' },

    // Gastric
    { name: 'Tab. Grab 20', composition: 'Rabeprazole 20mg', category: 'Gastric' },
    { name: 'Cap. Grazole DSR', composition: 'Rabeprazole 20mg + Domperidone 30mg', category: 'Gastric' },
    { name: 'Tab. Pan 20', composition: 'Pantoprazole 20mg', category: 'Gastric' },
    { name: 'Tab. Pan 40', composition: 'Pantoprazole 40mg', category: 'Gastric' },
    { name: 'Cap. Pan-D', composition: 'Pantoprazole 40mg + Domperidone 30mg', category: 'Gastric' },

    // Supplements
    { name: 'Tab. Levocet-M', composition: 'Levocetirizine + Montelukast', category: 'Supplement' },
    { name: 'Tab. A2Z', composition: 'Zinc & Vitamin C, B-Complex & Essential Nutrients', category: 'Supplement' },
    { name: 'Tab. Neurobion Forte', composition: 'Vit. B Complex + Vit. B12', category: 'Supplement' },
    { name: 'Tab. Den-Tonic (Homeo)', composition: 'Cal. Carb 30 + Chammomilia 30', category: 'Supplement' },
    { name: 'Cap. Lycopene Plus', composition: 'Antioxidants, Lycopene, Vitamins & Multi-Mineral', category: 'Supplement' },

    // Topical / Mouth Care
    { name: 'Gum-P (Astringent)', composition: 'Tannic Acid + Zinc Chloride + Cetrimide Gel', category: 'Topical' },
    { name: 'Perishield Mouthwash', composition: 'Chlorhexidine 0.2%', category: 'Topical' },
    { name: 'Stolin Gumpaint', composition: 'Tannic Acid + Zinc Chloride + Cetrimide Gel', category: 'Topical' },
    { name: 'Betadine Gargle', composition: 'Povidone Iodine 2% w/v', category: 'Topical' },
    { name: 'Betadine 10% Solution', composition: 'Povidone Iodine 10% w/v', category: 'Topical' },
    { name: 'Rexidine M-Forte Gel', composition: 'Lidocaine 2% + Chlorhexidine 1% + Metronidazole 1%', category: 'Topical' },
    { name: 'Dologel-CT Gel', composition: 'Choline Salicylate 8.7% + Lidocaine 2%', category: 'Topical' },
    { name: 'Dologel', composition: 'Choline Salicylate 8.7% + Lidocaine 2%', category: 'Topical' },
    { name: 'CureNext Oral Gel', composition: 'Curcuma longa Extract 10.00mg', category: 'Topical' },

    // Dental Accessories
    { name: 'Proxa-Brush Blue (Narrow)', composition: 'Inter-Dental Brush', category: 'Accessory' },
    { name: 'Proxa-Brush Yellow (Wide)', composition: 'Inter-Dental Brush', category: 'Accessory' },
    { name: 'Clinsodent Cleaning Powder', composition: 'Denture Cleaning Powder', category: 'Accessory' },
    { name: 'Clinsodent Cleaning Tablet', composition: 'Denture Cleaning Tablet', category: 'Accessory' },
    { name: 'Fixon Denture Adhesive Powder', composition: 'Denture Adhesive', category: 'Accessory' },
    { name: 'Colgate Dental Floss', composition: 'Dental Floss', category: 'Accessory' },

    // Toothpastes
    { name: 'Toothpaste Cheerio', composition: 'Toothpaste', category: 'Toothpaste' },
    { name: 'Toothpaste Kidodent', composition: 'Fluoride 500ppm', category: 'Toothpaste' },
    { name: 'GC Tooth Mousse', composition: 'Recovery Toothpaste', category: 'Toothpaste' },
    { name: 'Toothpaste Vantej', composition: 'Toothpaste', category: 'Toothpaste' },
    { name: 'Toothpaste Shy NM', composition: 'Calcium Sodium Phosphosilicate (CSPS)', category: 'Toothpaste' },
    { name: 'Toothpaste Senquel-F', composition: 'Potassium Nitrate + Sodium Monofluorophosphate + Triclosan', category: 'Toothpaste' },
]

export const DOSE_OPTIONS = ['1 tab', '2ml', '2.5ml', '3ml', '5ml']

export const FREQUENCY_OPTIONS = [
    '0-0-1', '1-0-1', '1-1-1', '2 Stat', 'S-O-S', '½-½-½', '½-0-½', '1-1-1-1'
]

export const INSTRUCTION_OPTIONS = [
    'After food', 'Before food', 'If pain is severe', 'With warm water', 'At bedtime',
    'Empty stomach', 'जेवणाआधी', 'जेवणापूवी', 'जास्त दुखत असल्यास'
]

// Medical history conditions from clinical spec
export const MEDICAL_CONDITIONS_LIST = [
    'Allergy', 'Angiography', 'Angioplasty', 'Antiplatelet Therapy',
    'Arthritis', 'Asthma', 'Autism', 'Carcinoma', 'CABG',
    'Diabetes Mellitus', "Down's Syndrome", 'Epilepsy', 'Hepatitis',
    'Hypertension', 'Hyperthyroidism', 'Hypotension', 'Hypothyroidism',
    'Lactating Mother', 'Liver Cirrhosis', 'Lung Ailment', 'Pregnancy',
    'Renal Ailment', 'Other'
]

// Investigation types
export const DENTAL_INVESTIGATIONS = [
    'IOPAR', 'OPG', 'CBCT Single Tooth', 'CBCT Quadrant',
    'CBCT Maxilla', 'CBCT Mandible', 'CBCT Full Mouth', 'CBCT TMJ Open/Close'
]

export const BLOOD_INVESTIGATIONS = [
    'CBC', 'BSL (R)', 'BSL (F)', 'BSL (PP)', 'HbA1C', 'PT', 'INR'
]

// Treatment procedures from PDF
export const TREATMENT_PROCEDURES = [
    'Alveoloplasty', 'Biopsy', 'Bone Augmentation Surgery',
    'Bridge Maryland', 'Bridge Metal', 'Bridge PFM', 'Bridge Zirconia',
    'Cast Partial Denture', 'Ceramic Veneer',
    'Complete Denture Basic', 'Complete Denture BPS', 'Complete Denture High Impact', 'Complete Denture Lucitone',
    'Composite Veneer', 'Crown Re-cementation', 'Cyst Removal Surgery',
    'Deep Curettage', 'Digital Mock up',
    'Direct Sinus Lift Surgery with Bone Grafting',
    'Enameloplasty', 'Extraction', 'Extraction Deciduous tooth',
    'Extraction F/b Metal Bridge', 'Extraction F/b PFM Bridge', 'Extraction F/b Zirconia Bridge',
    'Extraction Over-retained tooth', 'Extraction Surgical',
    'Fluoride Application', 'Follow-Up',
    'Implant Supported Denture', 'Implant Supported Metal Bridge', 'Implant Supported Metal Crown',
    'Implant Supported Over-Denture', 'Implant Supported PFM Bridge', 'Implant Supported PFM Crown',
    'Implant Supported Zirconia Bridge', 'Implant Supported Zirconia Crown',
    'Indirect Sinus Lift Surgery with Bone Grafting',
    'Orthodontic Treatment', 'Orthodontic Treatment with Ceramic Braces',
    'Orthodontic Treatment with Clear Aligners', 'Orthodontic Treatment with Metal Braces',
    'Orthodontic Treatment with Self-Ligating Ceramic Braces',
    'Orthodontic Treatment with Self-Ligating Metal Braces',
    'Periodontal Surgery', 'Pit & Fissure Sealant',
    'Pulpectomy F/b SS Crown', 'Pulpectomy Only',
    'RCT (Apexification)', 'RCT F/b Composite Restoration only',
    'RCT F/b Emax Crown', 'RCT F/b Emax Onlay', 'RCT F/b Metal Crown',
    'RCT F/b PFM Crown', 'RCT F/b Tooth Whitening', 'RCT F/b Zirconia Crown', 'RCT Only',
    'Re-Do-Crown', 'Re-Do-POR', 'Re-Do-Restoration',
    'Removable Partial Denture – Basic', 'Removable Partial Denture – Flexible',
    'Repair Complete Denture', 'Repair RPD',
    'RE-RCT F/b Emax Onlay', 'RE-RCT F/b Metal Crown', 'RE-RCT F/b PFM Crown',
    'RE-RCT F/b Zirconia Crown', 'RE-RCT Only',
    'Restoration Amalgam', 'Restoration Composite',
    'Restoration Composite-Direct Pulp Capping', 'Restoration Composite-Indirect Pulp Capping',
    'Restoration GIC', 'Restoration ZOE',
    'Scaling', 'SDF Application', 'Segment Re-attachment', 'Segment Re-attachment with RCT',
    'Surgical Endodontics', 'Tooth Splinting', 'Tooth Supported Over-Denture', 'Tooth Whitening',
]

// Fee categories from payment section
export const FEE_CATEGORIES = ['Consultation', 'X-ray', 'Treatment']

// Time slot options for appointments
export const TIME_SLOTS = [30, 45, 60, 90, 120]
