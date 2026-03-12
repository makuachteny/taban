"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, User, Map, BarChart3, Settings, ChevronLeft,
  Search, Plus,
  Calendar, RefreshCw, Wifi, X, Check,
  Download, Clock, Baby,
  Syringe, Activity, Heart, FileText, MapPin,
  Droplets, Shield, Thermometer,
  HomeIcon, Skull, ToggleLeft, ToggleRight,
  Mic, MicOff, Brain, AlertTriangle, ArrowRight, Send,
  MessageCircle, Phone, Stethoscope, AlertCircle, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from "recharts";

// ─── Theme & Constants (Blue / White / Black only) ───────────────
const COLORS = {
  primary: "#1565C0",
  primaryDark: "#0D47A1",
  primaryLight: "#E3F2FD",
  accent: "#1E88E5",
  success: "#1976D2",
  warning: "#90CAF9",
  danger: "#0D47A1",
  pink: "#2196F3",
  purple: "#42A5F5",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  text: "#0A0A0A",
  textSecondary: "#5A6A7A",
  border: "#D6E3F0",
  shadow: "0 2px 12px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.12)",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BLUE_SHADES = [
  "#0D47A1", "#1565C0", "#1976D2", "#1E88E5",
  "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9",
];

interface PatientRecord {
  id: number;
  name: string;
  age: number;
  gender: string;
  household: string;
  status: string;
  conditions: string[];
  lastSeen: string;
}

interface VoiceNote {
  id: string;
  transcript: string;
  timestamp: string;
  duration: number;
}

interface InlineDiagnosisSuggestion {
  icd10Code: string;
  name: string;
  confidence: number;
  reasoning: string;
  severity: "mild" | "moderate" | "severe";
  suggestedTreatment: string;
  tests: string[];
}

interface AIAssessmentRecord {
  suggestedDiagnoses: InlineDiagnosisSuggestion[];
  vitalSignAlerts: string[];
  recommendedTests: string[];
  severityAssessment: string;
  recommendation: "community" | "monitor" | "refer";
  evaluatedAt: string;
}

interface ReferralRecord {
  id: string;
  patientId: number;
  patientName: string;
  facility: string;
  facilityType: string;
  urgency: "routine" | "urgent" | "emergency";
  reason: string;
  notes: string;
  status: "draft" | "sent" | "received" | "seen" | "completed" | "cancelled";
  createdAt: string;
  aiDiagnosis?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  topic?: string;
  timestamp: string;
}

// ─── Data Structures ─────────────────────────────────────────────

const WORKER_PROFILE = {
  name: "Akol Deng Mayen",
  role: "Community Health Worker",
  boma: "Lologo East",
  payam: "Kator",
  county: "Juba",
  state: "Central Equatoria",
  phone: "+211 912 345 678",
  id: "CHW-CE-JUB-0142",
  households: 45,
  catchment: "~1,200 people",
};

const QUICK_ACTIONS = [
  { id: "birth", label: "Birth Registration", icon: Baby, color: "#1565C0" },
  { id: "death", label: "Death Registration", icon: Skull, color: "#0D47A1" },
  { id: "malaria", label: "Malaria Case", icon: Thermometer, color: "#1976D2" },
  { id: "anc", label: "ANC Visit", icon: Heart, color: "#1E88E5" },
  { id: "immunization", label: "Immunization", icon: Syringe, color: "#2196F3" },
  { id: "household", label: "Household Visit", icon: HomeIcon, color: "#42A5F5" },
  { id: "wash", label: "WASH Survey", icon: Droplets, color: "#64B5F6" },
];

const HOUSEHOLDS = [
  { id: "HH-001", head: "Deng Ajak Kuol", members: 7, lat: 4.855, lng: 31.605, waterSource: "Borehole", latrine: "Pit latrine", lastVisit: "2026-02-20", visitStatus: "visited" },
  { id: "HH-002", head: "Nyabol Garang Dut", members: 5, lat: 4.852, lng: 31.608, waterSource: "River", latrine: "None", lastVisit: "2026-02-18", visitStatus: "visited" },
  { id: "HH-003", head: "Ayen Makuei Bior", members: 9, lat: 4.858, lng: 31.602, waterSource: "Borehole", latrine: "VIP latrine", lastVisit: "2026-02-15", visitStatus: "overdue" },
  { id: "HH-004", head: "Majok Bol Deng", members: 4, lat: 4.850, lng: 31.610, waterSource: "Protected well", latrine: "Pit latrine", lastVisit: "2026-02-21", visitStatus: "visited" },
  { id: "HH-005", head: "Achol Wol Atem", members: 6, lat: 4.856, lng: 31.612, waterSource: "Unprotected well", latrine: "None", lastVisit: "2026-02-10", visitStatus: "overdue" },
  { id: "HH-006", head: "Kuol Manyang Juuk", members: 8, lat: 4.854, lng: 31.600, waterSource: "Borehole", latrine: "Pit latrine", lastVisit: "2026-02-19", visitStatus: "visited" },
];

const PATIENTS = [
  { id: 1, name: "Ayen Makuei Bior", age: 28, gender: "Female", household: "HH-003", status: "active", conditions: ["Pregnant - 7 months", "ANC enrolled"], lastSeen: "2026-02-15" },
  { id: 2, name: "Deng Ajak Kuol", age: 45, gender: "Male", household: "HH-001", status: "stable", conditions: ["Hypertension"], lastSeen: "2026-02-20" },
  { id: 3, name: "Nyabol Garang Dut", age: 32, gender: "Female", household: "HH-002", status: "active", conditions: ["Malaria - under treatment"], lastSeen: "2026-02-18" },
  { id: 4, name: "Akech Deng Ajak", age: 3, gender: "Female", household: "HH-001", status: "attention", conditions: ["Malnutrition - moderate", "Incomplete immunization"], lastSeen: "2026-02-20" },
  { id: 5, name: "Majok Bol Deng", age: 50, gender: "Male", household: "HH-004", status: "stable", conditions: ["Diabetes"], lastSeen: "2026-02-21" },
  { id: 6, name: "Achol Wol Atem", age: 24, gender: "Female", household: "HH-005", status: "active", conditions: ["Pregnant - 5 months"], lastSeen: "2026-02-10" },
  { id: 7, name: "Garang Kuol Manyang", age: 1, gender: "Male", household: "HH-006", status: "stable", conditions: ["Fully immunized"], lastSeen: "2026-02-19" },
  { id: 8, name: "Nyandit Majok Bol", age: 8, gender: "Female", household: "HH-004", status: "stable", conditions: [], lastSeen: "2026-02-21" },
];

const EVENTS = [
  { id: 1, type: "birth", date: "2026-02-20", description: "Baby boy born to Ayen Makuei — facility delivery at Juba Teaching Hospital", patient: "Ayen Makuei Bior", patientId: 1 },
  { id: 2, type: "malaria", date: "2026-02-18", description: "RDT positive (Pf) — ACT treatment started for Nyabol Garang", patient: "Nyabol Garang Dut", patientId: 3 },
  { id: 3, type: "anc", date: "2026-02-15", description: "ANC visit #3 — BP normal, fetal heartbeat good, iron supplements given", patient: "Ayen Makuei Bior", patientId: 1 },
  { id: 4, type: "immunization", date: "2026-02-19", description: "Penta 3 + OPV 3 administered to Garang Kuol (1yr)", patient: "Garang Kuol Manyang", patientId: 7 },
  { id: 5, type: "death", date: "2026-02-12", description: "Elderly male (78yrs) — cause: pneumonia, died at home", patient: "Bol Kuol Deng", patientId: null },
  { id: 6, type: "household", date: "2026-02-21", description: "Routine visit to HH-004 — all members healthy, latrine in good condition", patient: null, patientId: null },
  { id: 7, type: "malaria", date: "2026-02-17", description: "RDT negative — symptoms resolved, follow-up in 3 days", patient: "Nyandit Majok Bol", patientId: 8 },
  { id: 8, type: "wash", date: "2026-02-16", description: "WASH assessment for HH-005 — no latrine, unprotected water source, referral for hygiene kit", patient: null, patientId: null },
];

const MONTHLY_RECORDS = [
  { month: "Sep", births: 3, deaths: 1, malaria: 8, anc: 5, immunization: 12, household: 30 },
  { month: "Oct", births: 2, deaths: 0, malaria: 12, anc: 6, immunization: 10, household: 35 },
  { month: "Nov", births: 4, deaths: 1, malaria: 15, anc: 7, immunization: 14, household: 38 },
  { month: "Dec", births: 2, deaths: 2, malaria: 10, anc: 4, immunization: 8, household: 28 },
  { month: "Jan", births: 3, deaths: 1, malaria: 6, anc: 8, immunization: 15, household: 40 },
  { month: "Feb", births: 1, deaths: 1, malaria: 5, anc: 6, immunization: 11, household: 20 },
];

const DISEASE_TRENDS = [
  { month: "Sep", malaria: 8, diarrhea: 5, pneumonia: 3, malnutrition: 2 },
  { month: "Oct", malaria: 12, diarrhea: 4, pneumonia: 4, malnutrition: 3 },
  { month: "Nov", malaria: 15, diarrhea: 6, pneumonia: 2, malnutrition: 2 },
  { month: "Dec", malaria: 10, diarrhea: 3, pneumonia: 5, malnutrition: 4 },
  { month: "Jan", malaria: 6, diarrhea: 4, pneumonia: 6, malnutrition: 3 },
  { month: "Feb", malaria: 5, diarrhea: 3, pneumonia: 4, malnutrition: 2 },
];

const COVERAGE_DATA = [
  { label: "Immunization (under 5)", value: 72, target: 90 },
  { label: "ANC (4+ visits)", value: 58, target: 80 },
  { label: "Household visits (monthly)", value: 44, target: 100 },
  { label: "ITN coverage", value: 65, target: 85 },
];

// Form option constants
const DELIVERY_TYPES = ["Normal vaginal", "Assisted vaginal", "Caesarean section"];
const DELIVERY_LOCATIONS = ["Health facility", "Home - skilled attendant", "Home - TBA", "Home - no attendant", "On the way"];
const DELIVERY_ATTENDANTS = ["Doctor", "Nurse/Midwife", "TBA", "Relative", "None"];
const VACCINE_TYPES = ["BCG", "OPV 0", "OPV 1", "OPV 2", "OPV 3", "Penta 1", "Penta 2", "Penta 3", "Measles 1", "Measles 2", "PCV 1", "PCV 2", "PCV 3", "Vitamin A"];
const WATER_SOURCES = ["Borehole", "Protected well", "Unprotected well", "River/stream", "Rainwater", "Piped water"];
const WATER_TREATMENTS = ["Boiling", "Chlorination", "Solar disinfection", "Filtration", "None"];
const LATRINE_TYPES = ["VIP latrine", "Pit latrine", "Pour-flush", "None/Open defecation"];
const CAUSES_OF_DEATH = ["Malaria", "Pneumonia", "Diarrhea", "Maternal complications", "Neonatal causes", "Malnutrition", "Injury/Accident", "Other/Unknown"];
const MALARIA_SYMPTOMS = ["Fever", "Headache", "Chills", "Vomiting", "Body aches", "Fatigue", "Diarrhea", "Loss of appetite"];
const ANC_RISK_FACTORS = ["Hypertension", "Anemia", "Previous C-section", "Multiple pregnancy", "HIV positive", "Malaria in pregnancy", "Diabetes", "Age >35"];

const FACILITIES = [
  { id: "jth", name: "Juba Teaching Hospital", type: "National Hospital", distance: "4.2 km" },
  { id: "kator", name: "Kator PHCC", type: "Primary Health Care Centre", distance: "1.8 km" },
  { id: "munuki", name: "Munuki PHCC", type: "Primary Health Care Centre", distance: "2.5 km" },
  { id: "gurei", name: "Gurei Health Centre", type: "Health Centre", distance: "3.1 km" },
  { id: "malakia", name: "Malakia PHCU", type: "Primary Health Care Unit", distance: "1.2 km" },
  { id: "lologo", name: "Lologo Health Post", type: "Health Post", distance: "0.6 km" },
];

const INITIAL_REFERRALS: ReferralRecord[] = [
  {
    id: "ref-001", patientId: 4, patientName: "Akech Deng Ajak",
    facility: "Kator PHCC", facilityType: "Primary Health Care Centre",
    urgency: "urgent", reason: "Moderate malnutrition — MUAC 12.0 cm, incomplete immunization",
    notes: "Child needs nutritional assessment and catch-up immunization",
    status: "sent", createdAt: "2026-02-20T10:30:00Z", aiDiagnosis: "Malnutrition",
  },
];

// ─── Inline Diagnosis Engine (ported from diagnosis-engine.ts) ───

interface DiseaseRule {
  icd10Code: string;
  name: string;
  keywords: string[];
  vitalChecks: ((v: { temperature: number; systolic: number; diastolic: number; pulse: number; respiratoryRate: number; oxygenSaturation: number; weight: number; height: number; muac?: number }) => number)[];
  examKeywords: string[];
  ageGenderWeight: (age: number, gender: string) => number;
  chronicBoost: (conditions: string[]) => number;
  severity: (score: number, v: { temperature: number; systolic: number; diastolic: number; pulse: number; respiratoryRate: number; oxygenSaturation: number; muac?: number }) => "mild" | "moderate" | "severe";
  treatment: string;
  tests: string[];
}

function kwMatch(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) { if (lower.includes(k)) hits++; }
  return hits;
}

const DISEASE_RULES: DiseaseRule[] = [
  {
    icd10Code: "B50", name: "Plasmodium falciparum malaria",
    keywords: ["fever", "headache", "chills", "rigors", "sweating", "malaria", "body ache", "joint pain", "vomiting", "nausea"],
    vitalChecks: [v => v.temperature >= 38.0 ? 20 : v.temperature >= 37.5 ? 10 : 0, v => v.pulse >= 100 ? 5 : 0],
    examKeywords: ["splenomegaly", "jaundice", "pallor", "hepatomegaly", "pale"],
    ageGenderWeight: () => 5,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("sickle")) ? 10 : 0,
    severity: (score, v) => v.temperature >= 39.5 || score >= 60 ? "severe" : v.temperature >= 38.5 ? "moderate" : "mild",
    treatment: "Artemether-Lumefantrine (Coartem) 80/480mg BD x 3 days. If severe: IV Artesunate 2.4mg/kg at 0, 12, 24h then daily. Paracetamol for fever.",
    tests: ["Malaria RDT", "Full Blood Count"],
  },
  {
    icd10Code: "J18", name: "Community-acquired pneumonia",
    keywords: ["cough", "fever", "chest pain", "difficulty breathing", "shortness of breath", "sputum", "phlegm", "pneumonia", "breathing"],
    vitalChecks: [v => v.temperature >= 38.0 ? 15 : 0, v => v.respiratoryRate >= 25 ? 15 : v.respiratoryRate >= 20 ? 8 : 0, v => v.oxygenSaturation > 0 && v.oxygenSaturation < 92 ? 20 : v.oxygenSaturation > 0 && v.oxygenSaturation < 95 ? 10 : 0, v => v.pulse >= 100 ? 5 : 0],
    examKeywords: ["crackles", "crepitations", "bronchial", "dullness", "consolidation"],
    ageGenderWeight: age => age > 65 || age < 5 ? 10 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hiv") || x.toLowerCase().includes("asthma")) ? 10 : 0,
    severity: (score, v) => v.oxygenSaturation > 0 && v.oxygenSaturation < 92 || score >= 65 ? "severe" : v.oxygenSaturation > 0 && v.oxygenSaturation < 95 ? "moderate" : "mild",
    treatment: "Amoxicillin 500mg-1g TDS x 5-7 days. If severe: Ceftriaxone 1-2g IV daily + Azithromycin 500mg OD. Oxygen if SpO2 <92%.",
    tests: ["Full Blood Count", "Blood Glucose"],
  },
  {
    icd10Code: "A00", name: "Cholera / Acute diarrheal disease",
    keywords: ["diarrhea", "diarrhoea", "watery stool", "vomiting", "dehydration", "cholera", "loose stool", "rice water"],
    vitalChecks: [v => v.pulse >= 110 ? 15 : v.pulse >= 100 ? 8 : 0, v => v.systolic > 0 && v.systolic < 90 ? 15 : v.systolic > 0 && v.systolic < 100 ? 8 : 0],
    examKeywords: ["dehydrated", "dry mucosa", "sunken eyes", "poor skin turgor"],
    ageGenderWeight: age => age < 5 || age > 65 ? 10 : 0,
    chronicBoost: () => 0,
    severity: (score, v) => v.systolic > 0 && v.systolic < 90 || score >= 60 ? "severe" : v.pulse >= 100 ? "moderate" : "mild",
    treatment: "ORS after each loose stool. If severe: IV Ringer's Lactate 100ml/kg over 3h. Zinc 20mg OD x 10-14 days (children). Doxycycline 300mg single dose if cholera suspected.",
    tests: ["Full Blood Count", "Renal Function"],
  },
  {
    icd10Code: "A01", name: "Typhoid fever",
    keywords: ["fever", "headache", "abdominal pain", "constipation", "diarrhea", "typhoid", "stepladder fever", "malaise"],
    vitalChecks: [v => v.temperature >= 38.5 ? 15 : v.temperature >= 38.0 ? 8 : 0, v => v.pulse < 90 && v.temperature >= 38.5 ? 10 : 0],
    examKeywords: ["rose spots", "hepatomegaly", "splenomegaly", "tender abdomen", "coated tongue"],
    ageGenderWeight: () => 3,
    chronicBoost: () => 0,
    severity: (score, v) => v.temperature >= 40 || score >= 55 ? "severe" : v.temperature >= 39 ? "moderate" : "mild",
    treatment: "Ciprofloxacin 500mg BD x 7-14 days or Azithromycin 500mg OD x 7 days. If severe: Ceftriaxone 2g IV OD x 14 days.",
    tests: ["Full Blood Count", "Blood Glucose", "Liver Function"],
  },
  {
    icd10Code: "A15", name: "Pulmonary tuberculosis",
    keywords: ["cough", "weight loss", "night sweats", "hemoptysis", "blood in sputum", "tuberculosis", "tb", "chronic cough", "fever"],
    vitalChecks: [v => v.temperature >= 37.5 && v.temperature < 39 ? 10 : 0],
    examKeywords: ["cachexia", "wasting", "lymphadenopathy", "crackles"],
    ageGenderWeight: () => 5,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hiv")) ? 20 : 0,
    severity: score => score >= 55 ? "severe" : score >= 35 ? "moderate" : "mild",
    treatment: "RHZE fixed-dose daily x 2 months, then RH x 4 months. Refer for sputum microscopy/GeneXpert.",
    tests: ["Full Blood Count", "HIV Rapid Test"],
  },
  {
    icd10Code: "B20", name: "HIV disease",
    keywords: ["weight loss", "chronic diarrhea", "persistent fever", "oral thrush", "skin rash", "hiv", "aids", "opportunistic"],
    vitalChecks: [v => v.temperature >= 37.5 ? 5 : 0],
    examKeywords: ["oral thrush", "candidiasis", "lymphadenopathy", "wasting", "kaposi"],
    ageGenderWeight: () => 3,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hiv")) ? 30 : 0,
    severity: score => score >= 55 ? "severe" : score >= 35 ? "moderate" : "mild",
    treatment: "Initiate ART: TDF/3TC/DTG (300/300/50mg) OD. Cotrimoxazole prophylaxis 960mg OD.",
    tests: ["HIV Rapid Test", "CD4 Count", "Full Blood Count"],
  },
  {
    icd10Code: "G03", name: "Bacterial meningitis",
    keywords: ["headache", "fever", "stiff neck", "neck stiffness", "photophobia", "confusion", "vomiting", "meningitis", "seizure"],
    vitalChecks: [v => v.temperature >= 38.5 ? 15 : 0, v => v.pulse >= 100 ? 5 : 0],
    examKeywords: ["neck stiffness", "kernig", "brudzinski", "photophobia", "altered consciousness", "petechiae"],
    ageGenderWeight: age => age < 5 ? 10 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hiv")) ? 10 : 0,
    severity: score => score >= 50 ? "severe" : "moderate",
    treatment: "EMERGENCY: Ceftriaxone 2g IV BD immediately. Dexamethasone 0.15mg/kg IV. Urgent referral.",
    tests: ["Full Blood Count", "Blood Glucose"],
  },
  {
    icd10Code: "D64", name: "Anemia",
    keywords: ["fatigue", "tiredness", "pale", "pallor", "weakness", "dizzy", "dizziness", "shortness of breath", "palpitations", "anemia"],
    vitalChecks: [v => v.pulse >= 100 ? 10 : 0, v => v.oxygenSaturation > 0 && v.oxygenSaturation < 95 ? 5 : 0],
    examKeywords: ["pallor", "pale", "conjunctival pallor", "koilonychia", "glossitis"],
    ageGenderWeight: (age, gender) => (gender === "Female" ? 5 : 0) + (age < 5 ? 5 : 0),
    chronicBoost: c => c.some(x => x.toLowerCase().includes("sickle") || x.toLowerCase().includes("hiv")) ? 10 : 0,
    severity: (score, v) => v.pulse >= 120 || score >= 55 ? "severe" : score >= 35 ? "moderate" : "mild",
    treatment: "Ferrous Sulfate 200mg TDS + Folic Acid 5mg OD x 3 months. If severe: consider blood transfusion. Mebendazole 500mg stat.",
    tests: ["Full Blood Count"],
  },
  {
    icd10Code: "I10", name: "Hypertensive crisis",
    keywords: ["headache", "dizziness", "chest pain", "blurred vision", "high blood pressure", "hypertension", "nosebleed"],
    vitalChecks: [v => v.systolic >= 180 ? 25 : v.systolic >= 160 ? 15 : v.systolic >= 140 ? 8 : 0, v => v.diastolic >= 120 ? 20 : v.diastolic >= 100 ? 10 : v.diastolic >= 90 ? 5 : 0],
    examKeywords: ["papilledema", "retinal hemorrhage", "pedal edema"],
    ageGenderWeight: age => age > 40 ? 5 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hypertension") || x.toLowerCase().includes("diabetes")) ? 15 : 0,
    severity: (_score, v) => v.systolic >= 180 || v.diastolic >= 120 ? "severe" : v.systolic >= 160 || v.diastolic >= 100 ? "moderate" : "mild",
    treatment: "If severe: Nifedipine 10mg sublingual. Maintenance: Amlodipine 5-10mg OD + Enalapril 5-20mg OD.",
    tests: ["Renal Function", "Blood Glucose", "Urinalysis"],
  },
  {
    icd10Code: "E11", name: "Diabetic emergency",
    keywords: ["thirst", "polyuria", "frequent urination", "weight loss", "blurred vision", "diabetes", "sugar", "glucose", "diabetic", "fruity breath"],
    vitalChecks: [v => v.respiratoryRate >= 25 ? 10 : 0, v => v.pulse >= 100 ? 5 : 0, v => v.systolic > 0 && v.systolic < 100 ? 10 : 0],
    examKeywords: ["kussmaul", "fruity breath", "acetone", "dehydrated"],
    ageGenderWeight: age => age > 40 ? 5 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("diabetes")) ? 25 : 0,
    severity: (score, v) => score >= 55 || (v.systolic > 0 && v.systolic < 90) ? "severe" : score >= 35 ? "moderate" : "mild",
    treatment: "Check blood glucose urgently. If DKA: IV Normal Saline 1L/hr, Insulin regular 0.1 units/kg/hr IV. If mild: Metformin 500-1000mg BD.",
    tests: ["Blood Glucose", "Renal Function", "Urinalysis"],
  },
  {
    icd10Code: "B05", name: "Measles",
    keywords: ["rash", "fever", "cough", "red eyes", "conjunctivitis", "measles", "koplik spots", "runny nose"],
    vitalChecks: [v => v.temperature >= 38.5 ? 15 : v.temperature >= 38.0 ? 8 : 0],
    examKeywords: ["maculopapular rash", "koplik spots", "conjunctivitis", "red eyes", "coryza"],
    ageGenderWeight: age => age < 5 ? 15 : age < 15 ? 10 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hiv") || x.toLowerCase().includes("malnutrition")) ? 10 : 0,
    severity: score => score >= 55 ? "severe" : "moderate",
    treatment: "Vitamin A: 200,000 IU (>12mo), 100,000 IU (6-12mo). Paracetamol for fever. Isolate patient.",
    tests: ["Full Blood Count"],
  },
  {
    icd10Code: "J06", name: "Upper respiratory tract infection",
    keywords: ["sore throat", "runny nose", "nasal congestion", "sneezing", "cough", "cold", "throat pain", "mild fever"],
    vitalChecks: [v => v.temperature >= 37.5 && v.temperature < 38.5 ? 8 : 0],
    examKeywords: ["pharyngeal erythema", "tonsillar", "rhinorrhea"],
    ageGenderWeight: () => 3,
    chronicBoost: () => 0,
    severity: () => "mild",
    treatment: "Symptomatic: Paracetamol 1g QDS PRN, warm fluids, rest. Antibiotics NOT indicated unless bacterial pharyngitis.",
    tests: [],
  },
  {
    icd10Code: "N39", name: "Urinary tract infection",
    keywords: ["dysuria", "burning urination", "frequency", "urgency", "suprapubic pain", "uti", "cloudy urine", "hematuria", "flank pain"],
    vitalChecks: [v => v.temperature >= 38.5 ? 10 : 0, v => v.pulse >= 100 ? 5 : 0],
    examKeywords: ["suprapubic tenderness", "costovertebral angle tenderness", "flank tenderness"],
    ageGenderWeight: (_age, gender) => gender === "Female" ? 10 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("diabetes")) ? 5 : 0,
    severity: (score, v) => v.temperature >= 38.5 || score >= 50 ? "moderate" : "mild",
    treatment: "Ciprofloxacin 500mg BD x 3 days (uncomplicated). If pregnant: Amoxicillin 500mg TDS x 7 days. Increase fluid intake.",
    tests: ["Urinalysis", "Full Blood Count"],
  },
  {
    icd10Code: "E43", name: "Severe acute malnutrition",
    keywords: ["weight loss", "malnutrition", "wasting", "edema", "swelling", "failure to thrive", "not eating", "poor appetite", "kwashiorkor"],
    vitalChecks: [
      v => { if (!v.weight || !v.height) return 0; const bmi = v.weight / ((v.height / 100) ** 2); return bmi < 16 ? 20 : bmi < 18.5 ? 10 : 0; },
      v => (v.muac && v.muac < 11.5) ? 25 : (v.muac && v.muac < 12.5) ? 15 : 0,
    ],
    examKeywords: ["wasting", "muscle wasting", "edema", "pitting edema", "kwashiorkor", "marasmus", "visible ribs"],
    ageGenderWeight: age => age < 5 ? 15 : 0,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hiv") || x.toLowerCase().includes("tb")) ? 10 : 0,
    severity: (score, v) => (v.muac && v.muac < 11.5) || score >= 55 ? "severe" : score >= 35 ? "moderate" : "mild",
    treatment: "Severe: F-75 therapeutic milk, then F-100. RUTF when appetite returns. Vitamin A, Folic acid, Zinc.",
    tests: ["Full Blood Count", "Blood Glucose", "HIV Rapid Test"],
  },
  {
    icd10Code: "O14", name: "Pre-eclampsia",
    keywords: ["pregnant", "pregnancy", "headache", "swelling", "edema", "blurred vision", "epigastric pain", "pre-eclampsia", "eclampsia"],
    vitalChecks: [v => v.systolic >= 160 ? 25 : v.systolic >= 140 ? 15 : 0, v => v.diastolic >= 110 ? 20 : v.diastolic >= 90 ? 10 : 0],
    examKeywords: ["edema", "pedal edema", "facial edema", "brisk reflexes", "hyperreflexia"],
    ageGenderWeight: (_age, gender) => gender === "Female" ? 5 : -100,
    chronicBoost: c => c.some(x => x.toLowerCase().includes("hypertension")) ? 10 : 0,
    severity: (_score, v) => v.systolic >= 160 || v.diastolic >= 110 ? "severe" : "moderate",
    treatment: "URGENT: Magnesium Sulfate 4g IV loading + 1g/hr maintenance. Hydralazine 5-10mg IV for BP. Urgent referral to obstetric unit.",
    tests: ["Urinalysis", "Full Blood Count", "Renal Function", "Liver Function"],
  },
];

function inlineEvaluatePatient(input: {
  chiefComplaint: string; symptoms: string[]; age: number; gender: string;
  conditions: string[];
  vitals: { temperature: number; systolic: number; diastolic: number; pulse: number; respiratoryRate: number; oxygenSaturation: number; weight: number; height: number; muac?: number };
}): AIAssessmentRecord {
  const complaint = `${input.chiefComplaint} ${input.symptoms.join(" ")}`;
  const scored: { rule: DiseaseRule; score: number }[] = [];

  for (const rule of DISEASE_RULES) {
    let score = 0;
    score += kwMatch(complaint, rule.keywords) * 8;
    for (const check of rule.vitalChecks) score += check(input.vitals);
    score += kwMatch(input.conditions.join(" "), rule.examKeywords) * 8;
    score += rule.ageGenderWeight(input.age, input.gender);
    score += rule.chronicBoost(input.conditions);
    if (score > 10) scored.push({ rule, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const suggestedDiagnoses: InlineDiagnosisSuggestion[] = scored.slice(0, 5).map(({ rule, score }) => ({
    icd10Code: rule.icd10Code,
    name: rule.name,
    confidence: Math.min(95, Math.round(score * 1.1)),
    reasoning: `Matched keywords in complaint/symptoms. Score: ${score}`,
    severity: rule.severity(score, input.vitals),
    suggestedTreatment: rule.treatment,
    tests: rule.tests,
  }));

  const vitalSignAlerts: string[] = [];
  const v = input.vitals;
  if (v.temperature >= 39.0) vitalSignAlerts.push(`High fever (${v.temperature}°C) — suggests significant infection.`);
  else if (v.temperature >= 38.0) vitalSignAlerts.push(`Fever (${v.temperature}°C) — active infection likely.`);
  if (v.systolic >= 180 || v.diastolic >= 120) vitalSignAlerts.push(`Hypertensive emergency (${v.systolic}/${v.diastolic} mmHg).`);
  else if (v.systolic >= 140 || v.diastolic >= 90) vitalSignAlerts.push(`Elevated BP (${v.systolic}/${v.diastolic} mmHg).`);
  else if (v.systolic > 0 && v.systolic < 90) vitalSignAlerts.push(`Hypotension (${v.systolic}/${v.diastolic} mmHg) — assess for shock.`);
  if (v.pulse >= 120) vitalSignAlerts.push(`Significant tachycardia (${v.pulse} bpm).`);
  else if (v.pulse >= 100) vitalSignAlerts.push(`Tachycardia (${v.pulse} bpm).`);
  if (v.respiratoryRate >= 30) vitalSignAlerts.push(`Severe tachypnea (${v.respiratoryRate}/min) — respiratory distress.`);
  else if (v.respiratoryRate >= 24) vitalSignAlerts.push(`Tachypnea (${v.respiratoryRate}/min).`);
  if (v.oxygenSaturation > 0 && v.oxygenSaturation < 90) vitalSignAlerts.push(`Critical hypoxia (SpO₂ ${v.oxygenSaturation}%).`);
  else if (v.oxygenSaturation > 0 && v.oxygenSaturation < 95) vitalSignAlerts.push(`Low SpO₂ (${v.oxygenSaturation}%).`);
  if (v.muac && v.muac < 11.5) vitalSignAlerts.push(`MUAC ${v.muac} cm — severe acute malnutrition.`);
  else if (v.muac && v.muac < 12.5) vitalSignAlerts.push(`MUAC ${v.muac} cm — moderate acute malnutrition.`);

  const testSet = new Set<string>();
  for (const { rule } of scored.slice(0, 4)) for (const t of rule.tests) testSet.add(t);

  const hasSevere = suggestedDiagnoses.some(d => d.severity === "severe" && d.confidence >= 40);
  const hasModerate = suggestedDiagnoses.some(d => d.severity === "moderate" && d.confidence >= 40);
  const critAlerts = vitalSignAlerts.filter(a => a.includes("emergency") || a.includes("Critical") || a.includes("Severe") || a.includes("Hypotension")).length;

  let severityAssessment: string;
  let recommendation: "community" | "monitor" | "refer";
  if (hasSevere || critAlerts >= 2) {
    severityAssessment = "HIGH ACUITY — Urgent evaluation and treatment needed.";
    recommendation = "refer";
  } else if (hasModerate || critAlerts >= 1) {
    severityAssessment = "MODERATE ACUITY — Prompt attention required. Monitor closely.";
    recommendation = "monitor";
  } else {
    severityAssessment = "LOW ACUITY — Stable presentation. Standard outpatient management.";
    recommendation = "community";
  }

  return {
    suggestedDiagnoses, vitalSignAlerts, recommendedTests: Array.from(testSet),
    severityAssessment, recommendation, evaluatedAt: new Date().toISOString(),
  };
}

// ─── Inline Medical Assistant (ported from medical-assistant.ts) ──

interface KnowledgeEntry { keywords: string[]; topic: string; response: string; }

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  { keywords: ["malaria", "treat malaria", "malaria treatment", "coartem", "artemether", "antimalarial", "falciparum"],
    topic: "Malaria Treatment",
    response: `**Malaria Treatment (WHO Guidelines)**\n\n**Uncomplicated P. falciparum:**\n- **First-line:** Artemether-Lumefantrine (Coartem) 80/480mg BD x 3 days\n- Take with fatty food\n- Pediatric dosing by weight: 5-14kg: 20/120mg; 15-24kg: 40/240mg; 25-34kg: 60/360mg\n\n**Severe Malaria:**\n- IV Artesunate 2.4 mg/kg at 0, 12, 24h, then daily\n- Monitor blood glucose\n- Transfuse if Hb <5 g/dL\n\n**In pregnancy:**\n- 1st trimester: Quinine + Clindamycin x 7 days\n- 2nd/3rd trimester: ACT`,
  },
  { keywords: ["pneumonia", "chest infection", "pneumonia treatment", "cap"],
    topic: "Pneumonia Management",
    response: `**Community-Acquired Pneumonia**\n\n**Outpatient (mild):**\n- Amoxicillin 500mg-1g TDS x 5 days\n\n**Inpatient (moderate):**\n- Ceftriaxone 1-2g IV OD + Azithromycin 500mg OD\n\n**Pediatric (IMCI):**\n- Fast breathing only: Amoxicillin 40mg/kg/day BD x 5 days\n- Chest indrawing: Amoxicillin 80mg/kg/day BD\n- Danger signs: Refer urgently\n\n**Oxygen:** Target SpO₂ ≥92%`,
  },
  { keywords: ["cholera", "diarrhea", "diarrhoea", "dehydration", "ors", "oral rehydration"],
    topic: "Cholera & Acute Diarrhea",
    response: `**Cholera / Acute Diarrhea**\n\n**WHO Dehydration Plans:**\n- **Plan A:** ORS after each stool, continue feeding\n- **Plan B:** ORS 75 mL/kg over 4 hours\n- **Plan C:** IV Ringer's Lactate 100 mL/kg over 3h\n\n**Antibiotics (cholera):**\n- Adults: Doxycycline 300mg single dose\n- Children: Azithromycin 20mg/kg single dose\n\n**Zinc:** <6mo: 10mg OD; ≥6mo: 20mg OD x 10-14 days`,
  },
  { keywords: ["tb", "tuberculosis", "tb treatment", "rhze", "genexpert", "dots"],
    topic: "Tuberculosis",
    response: `**TB Management (WHO)**\n\n**Diagnosis:** GeneXpert MTB/RIF (preferred), sputum smear, CXR\n\n**New TB (drug-susceptible):**\n- Intensive (2 months): RHZE daily\n- Continuation (4 months): RH daily\n\n**TB/HIV:** Start TB treatment first, ART within 2-8 weeks. Cotrimoxazole prophylaxis.`,
  },
  { keywords: ["hiv", "art", "arv", "antiretroviral", "cd4", "viral load"],
    topic: "HIV / ART Management",
    response: `**HIV Management**\n\n**First-line ART:** TDF/3TC/DTG — 1 tablet OD\n\n**When to start:** All HIV+ individuals ("Test and Treat")\n\n**Monitoring:** Viral load at 6mo, 12mo, then annually\n\n**Prophylaxis:** Cotrimoxazole 960mg OD; IPT (Isoniazid 300mg OD x 6mo)\n\n**PEP:** Start within 72h: TDF/3TC + DTG x 28 days`,
  },
  { keywords: ["pre-eclampsia", "preeclampsia", "eclampsia", "magnesium sulfate", "mgso4"],
    topic: "Pre-eclampsia / Eclampsia",
    response: `**Pre-eclampsia Management**\n\n**MgSO4 (Pritchard):**\n- Loading: 4g IV + 5g IM each buttock\n- Maintenance: 5g IM q4h x 24h\n- Monitor: RR >16, urine output, reflexes\n\n**BP Control:** Hydralazine 5mg IV q20min or Nifedipine 10mg oral\n\n**Delivery:** Severe ≥37wk: deliver. Eclampsia: stabilize → deliver.`,
  },
  { keywords: ["malnutrition", "sam", "mam", "muac", "rutf", "f75", "f100", "wasting"],
    topic: "Malnutrition Management",
    response: `**SAM (WHO Protocol)**\n\n**Diagnosis:** MUAC <11.5cm, W/H <-3 Z, bilateral edema\n\n**Inpatient:**\n1. F-75 milk (130mL/kg/day, 8 feeds)\n2. Transition to F-100\n3. RUTF when appetite returns\n\n**Routine:** Amoxicillin, Vitamin A, Folic acid, Zinc\n\n**Outpatient SAM:** RUTF ~200 kcal/kg/day, weekly follow-up`,
  },
  { keywords: ["emergency", "triage", "resuscitation", "abcde", "shock", "cpr"],
    topic: "Emergency & Triage",
    response: `**ABCDE Assessment**\n\n**A-Airway:** Head tilt, chin lift, suction\n**B-Breathing:** Rate, SpO₂, oxygen therapy\n**C-Circulation:** Pulse, BP, IV access, fluid bolus 20mL/kg\n**D-Disability:** AVPU, blood glucose, pupils\n**E-Exposure:** Full exam, prevent hypothermia\n\n**WHO Triage:**\n- Red: Emergency\n- Yellow: Priority\n- Green: Non-urgent`,
  },
  { keywords: ["child", "pediatric", "imci", "infant", "neonatal", "vaccination", "immunization"],
    topic: "Pediatrics / IMCI",
    response: `**IMCI Quick Reference**\n\n**Danger signs (refer urgently):** Unable to drink, vomits everything, convulsions, lethargic\n\n**Fast breathing cutoffs:**\n- <2mo: ≥60/min\n- 2-12mo: ≥50/min\n- 1-5yr: ≥40/min\n\n**EPI Schedule (South Sudan):**\n- Birth: BCG, OPV-0\n- 6wk: Penta1, OPV1, PCV1\n- 9mo: Measles 1\n- 15mo: Measles 2`,
  },
  { keywords: ["hypertension", "blood pressure", "high bp", "amlodipine", "enalapril"],
    topic: "Hypertension Management",
    response: `**Hypertension**\n\n**First-line:**\n1. Amlodipine 5-10mg OD\n2. Hydrochlorothiazide 12.5-25mg OD\n3. Enalapril 5-20mg OD (if diabetes/CKD)\n\n**Emergency (>180/120):** Nifedipine 10mg sublingual. Reduce BP 25% in first hour.\n\n**Lifestyle:** <5g salt/day, exercise, limit alcohol`,
  },
  { keywords: ["diabetes", "blood sugar", "glucose", "metformin", "insulin", "dka"],
    topic: "Diabetes Management",
    response: `**Diabetes**\n\n**Type 2 Stepwise:**\n1. Metformin 500mg OD → 1000mg BD\n2. Add Glibenclamide 2.5-5mg OD\n3. Add Insulin (NPH 10u at bedtime)\n\n**DKA Protocol:**\n1. IV NS 1L/hr\n2. Insulin 0.1 u/kg/hr IV\n3. K+ replacement\n4. Monitor glucose hourly`,
  },
  { keywords: ["wound", "suture", "abscess", "burn", "snake bite", "tetanus"],
    topic: "Wound & Surgical Emergencies",
    response: `**Wound Management**\n\n**Clean wound:** Irrigate, primary closure within 6-8h, tetanus prophylaxis\n\n**Abscess:** I&D, pack loosely, daily dressings\n\n**Burns:** Parkland formula: 4mL × %BSA × kg. Silver sulfadiazine cream.\n\n**Snake Bite:** Immobilize, antivenom IV over 1h, monitor for anaphylaxis`,
  },
  { keywords: ["mental health", "depression", "anxiety", "ptsd", "psychosis", "suicide"],
    topic: "Mental Health",
    response: `**Mental Health (South Sudan)**\n\n**Depression:** Counseling first. Severe: Fluoxetine 20mg OD.\n\n**PTSD:** Narrative Exposure Therapy. Avoid benzodiazepines.\n\n**Acute psychosis:** Haloperidol 2-5mg IM. Rule out cerebral malaria, meningitis.\n\n**Suicide risk:** Ask directly. High risk: constant supervision, remove means, urgent referral.`,
  },
  { keywords: ["pregnancy", "antenatal", "anc", "obstetric", "delivery", "postpartum", "pph"],
    topic: "Obstetric Care",
    response: `**Obstetric Quick Reference**\n\n**ANC Medications:**\n- Iron + Folic acid daily\n- IPTp-SP from 13 weeks\n- TT vaccines\n- Deworming after 1st trimester\n\n**PPH (>500mL):**\n1. Rub uterus, Oxytocin 10 IU IM/IV\n2. Misoprostol 800mcg sublingual\n3. IV fluids wide open\n4. Bimanual compression if atonic`,
  },
];

function inlineGetAssistantResponse(question: string): { content: string; topic?: string } {
  const lower = question.toLowerCase();
  const tokens = lower.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
  const scored: { entry: KnowledgeEntry; score: number }[] = [];

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) score += keyword.split(" ").length * 10;
    }
    for (const token of tokens) {
      for (const keyword of entry.keywords) {
        if (keyword.includes(token)) score += 3;
      }
    }
    if (lower.includes(entry.topic.toLowerCase())) score += 20;
    if (score > 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 8) {
    let content = scored[0].entry.response;
    if (scored.length > 1 && scored[1].score >= 15 && scored[1].entry.topic !== scored[0].entry.topic) {
      content += `\n\n---\n*Also relevant: **${scored[1].entry.topic}***`;
    }
    return { content, topic: scored[0].entry.topic };
  }

  if (/^(hi|hello|hey|good morning|good afternoon)/i.test(question.trim())) {
    return {
      content: `Hello! I'm your clinical assistant. I can help with treatment protocols, drug dosing, and emergency management based on WHO/IMCI guidelines.\n\n**Try asking about:**\n- "How to treat severe malaria?"\n- "Pneumonia management in children"\n- "Pre-eclampsia magnesium sulfate dose"\n- "TB/HIV co-infection"`,
      topic: "Welcome",
    };
  }

  return { content: `I don't have a specific protocol for that. Try asking about: **Malaria, Pneumonia, Cholera, TB, HIV, Hypertension, Diabetes, Measles, UTI, Malnutrition, Pre-eclampsia, Emergency triage, Pediatrics/IMCI, Obstetrics, Wound care, or Mental health.**` };
}

// ─── Utility Components ──────────────────────────────────────────

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#C62828", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const style: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`, fontSize: 15,
    color: COLORS.text, background: COLORS.card, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
  };
  if (multiline) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...style, resize: "vertical" }} />;
  }
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />;
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      width: "100%", padding: "10px 14px", borderRadius: 10,
      border: `1.5px solid ${COLORS.border}`, fontSize: 15,
      color: value ? COLORS.text : COLORS.textSecondary,
      background: COLORS.card, outline: "none",
      fontFamily: "'DM Sans', sans-serif",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A6A7A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
    }}>
      <option value="">{placeholder || "Select..."}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
          border: value === o ? `2px solid ${COLORS.primary}` : `1.5px solid ${COLORS.border}`,
          background: value === o ? COLORS.primaryLight : COLORS.card,
          color: value === o ? COLORS.primary : COLORS.text,
          cursor: "pointer", transition: "all 0.2s",
        }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, min, max }: { value: string; onChange: (v: string) => void; placeholder?: string; min?: number; max?: number }) {
  return (
    <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      min={min} max={max}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: `1.5px solid ${COLORS.border}`, fontSize: 15,
        color: COLORS.text, background: COLORS.card, outline: "none",
        fontFamily: "'DM Sans', sans-serif",
      }}
    />
  );
}

function CheckboxGroup({ selected, onChange, options }: { selected: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const toggle = (o: string) => {
    if (selected.includes(o)) {
      onChange(selected.filter((s) => s !== o));
    } else {
      onChange([...selected, o]);
    }
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button key={o} onClick={() => toggle(o)} style={{
            padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
            border: active ? `2px solid ${COLORS.primary}` : `1.5px solid ${COLORS.border}`,
            background: active ? COLORS.primaryLight : COLORS.card,
            color: active ? COLORS.primary : COLORS.text,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {active && <Check size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function HealthStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "#E3F2FD", color: "#1565C0", label: "Active Care" },
    stable: { bg: "#E8F5E9", color: "#2E7D32", label: "Stable" },
    attention: { bg: "#FFF3E0", color: "#E65100", label: "Needs Attention" },
  };
  const c = cfg[status] || cfg.stable;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px",
      borderRadius: 16, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: c.color }} />
      {c.label}
    </span>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: Record<string, { icon: any; color: string; label: string }> = {
    birth: { icon: Baby, color: "#1565C0", label: "Birth" },
    death: { icon: Skull, color: "#0D47A1", label: "Death" },
    malaria: { icon: Thermometer, color: "#1976D2", label: "Malaria" },
    anc: { icon: Heart, color: "#1E88E5", label: "ANC" },
    immunization: { icon: Syringe, color: "#2196F3", label: "Immunization" },
    household: { icon: HomeIcon, color: "#42A5F5", label: "Household" },
    wash: { icon: Droplets, color: "#64B5F6", label: "WASH" },
  };
  const c = cfg[type] || { icon: FileText, color: COLORS.textSecondary, label: type };
  const Icon = c.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
      borderRadius: 16, fontSize: 12, fontWeight: 600, background: `${c.color}15`, color: c.color,
    }}>
      <Icon size={13} />
      {c.label}
    </span>
  );
}

function BottomNav({ active, onNavigate }: { active: string; onNavigate: (s: string) => void }) {
  const items = [
    { id: "home", icon: Home, label: "Home" },
    { id: "records", icon: FileText, label: "Registry" },
    { id: "map", icon: Map, label: "Map" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: COLORS.card, borderTop: `1px solid ${COLORS.border}`,
      display: "flex", justifyContent: "space-around", padding: "6px 0 8px",
      zIndex: 100, boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}>
      {items.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => onNavigate(id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          background: "none", border: "none", cursor: "pointer", padding: "6px 12px",
          color: active === id ? COLORS.primary : COLORS.textSecondary,
          transition: "color 0.2s",
        }}>
          <Icon size={22} strokeWidth={active === id ? 2.2 : 1.6} />
          <span style={{ fontSize: 11, fontWeight: active === id ? 600 : 400 }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function TopBar({ title, onBack, actions }: { title: string; onBack?: () => void; actions?: React.ReactNode }) {
  return (
    <header style={{
      background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)",
      color: "#fff",
      padding: "12px 16px", display: "flex", alignItems: "center",
      gap: 12, position: "sticky", top: 0, zIndex: 50,
      minHeight: 52,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#fff", padding: 4,
        }}>
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 style={{ flex: 1, fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: -0.3 }}>
        {title}
      </h1>
      {actions}
    </header>
  );
}

function SearchBar({ value, onChange, placeholder = "Search..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: COLORS.card, border: `1.5px solid ${COLORS.border}`,
      borderRadius: 28, padding: "10px 16px", margin: "12px 16px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <Search size={18} color={COLORS.textSecondary} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: "none", outline: "none", fontSize: 15,
          color: COLORS.text, background: "transparent",
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <X size={16} color={COLORS.textSecondary} />
        </button>
      )}
    </div>
  );
}

// ─── Speech Recognition Hook ─────────────────────────────────────

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setIsSupported(true);
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = Array.from(event.results).map((r: any) => r[0].transcript).join("");
        setTranscript(result);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, isSupported };
}

// ─── New UI Components ───────────────────────────────────────────

function VoiceRecordButton({ isListening, onToggle, isSupported }: { isListening: boolean; onToggle: () => void; isSupported: boolean }) {
  if (!isSupported) return null;
  return (
    <button onClick={onToggle} style={{
      width: 36, height: 36, borderRadius: 18, border: "none", cursor: "pointer",
      background: isListening ? "#C62828" : COLORS.primaryLight,
      color: isListening ? "#fff" : COLORS.primary,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", transition: "all 0.2s", flexShrink: 0,
    }}>
      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      {isListening && (
        <span style={{
          position: "absolute", inset: -3, borderRadius: "50%",
          border: "2px solid #C62828", animation: "pulse 1.5s infinite",
        }} />
      )}
    </button>
  );
}

function SeverityBadge({ severity }: { severity: "mild" | "moderate" | "severe" }) {
  const cfg = {
    mild: { bg: "#E3F2FD", color: "#1976D2", label: "Mild" },
    moderate: { bg: "#BBDEFB", color: "#0D47A1", label: "Moderate" },
    severe: { bg: "#0D47A1", color: "#FFFFFF", label: "Severe" },
  };
  const c = cfg[severity];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
      background: c.bg, color: c.color,
    }}>{c.label}</span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 8, background: "#E3F2FD", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%", borderRadius: 4,
          background: value >= 70 ? "#0D47A1" : value >= 40 ? "#1976D2" : "#64B5F6",
          transition: "width 0.5s ease",
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, minWidth: 32 }}>{value}%</span>
    </div>
  );
}

function ReferralStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    draft: { bg: "#F0F4F8", color: "#5A6A7A" },
    sent: { bg: "#E3F2FD", color: "#1565C0" },
    received: { bg: "#BBDEFB", color: "#0D47A1" },
    seen: { bg: "#C8E6C9", color: "#2E7D32" },
    completed: { bg: "#E8F5E9", color: "#1B5E20" },
    cancelled: { bg: "#FFEBEE", color: "#C62828" },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
      background: c.bg, color: c.color, textTransform: "capitalize",
    }}>{status}</span>
  );
}

function RecommendationCard({ recommendation, topDiagnosis, onRefer, onShowProtocol }: {
  recommendation: "community" | "monitor" | "refer";
  topDiagnosis?: InlineDiagnosisSuggestion;
  onRefer: () => void;
  onShowProtocol: () => void;
}) {
  const cfg = {
    community: { bg: "#E3F2FD", border: "#90CAF9", color: "#1565C0", title: "Treat at Community Level", icon: Stethoscope, desc: "Condition can be managed at boma level with standard protocols." },
    monitor: { bg: "#BBDEFB", border: "#64B5F6", color: "#0D47A1", title: "Schedule Follow-Up", icon: Clock, desc: "Monitor patient closely. Schedule follow-up visit within 48-72 hours." },
    refer: { bg: "#0D47A1", border: "#0D47A1", color: "#FFFFFF", title: "Refer to Facility", icon: ArrowRight, desc: "Patient needs higher-level care. Initiate referral immediately." },
  };
  const c = cfg[recommendation];
  const Icon = c.icon;

  return (
    <div style={{
      background: c.bg, border: `2px solid ${c.border}`, borderRadius: 14,
      padding: 16, marginTop: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: recommendation === "refer" ? "rgba(255,255,255,0.2)" : `${c.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={c.color} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.color }}>{c.title}</div>
          <div style={{ fontSize: 12, color: recommendation === "refer" ? "rgba(255,255,255,0.8)" : COLORS.textSecondary }}>{c.desc}</div>
        </div>
      </div>
      {recommendation === "community" && topDiagnosis && (
        <button onClick={onShowProtocol} style={{
          width: "100%", padding: "10px", borderRadius: 10,
          background: c.color, color: "#fff", border: "none", fontSize: 14,
          fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
        }}>
          <Stethoscope size={16} /> View Treatment Protocol
        </button>
      )}
      {recommendation === "monitor" && (
        <button onClick={onShowProtocol} style={{
          width: "100%", padding: "10px", borderRadius: 10,
          background: c.color, color: "#fff", border: "none", fontSize: 14,
          fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
        }}>
          <Calendar size={16} /> Schedule Follow-Up
        </button>
      )}
      {recommendation === "refer" && (
        <button onClick={onRefer} style={{
          width: "100%", padding: "10px", borderRadius: 10,
          background: "#FFFFFF", color: "#0D47A1", border: "none", fontSize: 14,
          fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
        }}>
          <Phone size={16} /> Refer Patient Now
        </button>
      )}
    </div>
  );
}

// ─── AI Assessment Panel ─────────────────────────────────────────

function AIAssessmentPanel({ patient, vitals, symptoms, chiefComplaint, onRefer }: {
  patient: PatientRecord;
  vitals: { temp: string; bp: string; weight: string; pulse: string; respRate: string; spo2: string; height: string; muac: string };
  symptoms: string[];
  chiefComplaint: string;
  onRefer: (diagnosis: string) => void;
}) {
  const [assessment, setAssessment] = useState<AIAssessmentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);

  const runAssessment = () => {
    setLoading(true);
    setTimeout(() => {
      const bpParts = vitals.bp.split("/");
      const result = inlineEvaluatePatient({
        chiefComplaint: chiefComplaint || symptoms.join(", "),
        symptoms,
        age: patient.age,
        gender: patient.gender,
        conditions: patient.conditions,
        vitals: {
          temperature: parseFloat(vitals.temp) || 0,
          systolic: parseInt(bpParts[0]) || 0,
          diastolic: parseInt(bpParts[1]) || 0,
          pulse: parseInt(vitals.pulse) || 0,
          respiratoryRate: parseInt(vitals.respRate) || 0,
          oxygenSaturation: parseInt(vitals.spo2) || 0,
          weight: parseFloat(vitals.weight) || 0,
          height: parseFloat(vitals.height) || 0,
          muac: parseFloat(vitals.muac) || undefined,
        },
      });
      setAssessment(result);
      setLoading(false);
    }, 800);
  };

  if (!assessment && !loading) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36, background: COLORS.primaryLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "24px auto 16px",
        }}>
          <Brain size={36} color={COLORS.primary} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>AI Clinical Assessment</h3>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>
          Enter vitals and symptoms in the Data Entry tab, then run the AI assessment for diagnosis suggestions.
        </p>
        <button onClick={runAssessment} style={{
          padding: "12px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #0D47A1, #1565C0)",
          color: "#fff", border: "none", fontSize: 15, fontWeight: 600,
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(13,71,161,0.3)",
        }}>
          <Brain size={18} /> Run AI Assessment
        </button>
        <p style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 16, fontStyle: "italic" }}>
          AI-Assisted — Clinical judgment always takes precedence
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Loader2 size={40} color={COLORS.primary} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 12 }}>Analyzing patient data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Severity Banner */}
      <div style={{
        background: assessment!.recommendation === "refer" ? "#0D47A1" : assessment!.recommendation === "monitor" ? "#BBDEFB" : "#E3F2FD",
        color: assessment!.recommendation === "refer" ? "#fff" : COLORS.text,
        borderRadius: 12, padding: "12px 14px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <AlertTriangle size={20} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{assessment!.severityAssessment}</span>
      </div>

      {/* Vital Alerts */}
      {assessment!.vitalSignAlerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={16} color="#C62828" /> Vital Sign Alerts
          </h4>
          {assessment!.vitalSignAlerts.map((alert, i) => (
            <div key={i} style={{
              fontSize: 13, color: "#C62828", background: "#FFEBEE", borderRadius: 8,
              padding: "8px 12px", marginBottom: 6,
            }}>{alert}</div>
          ))}
        </div>
      )}

      {/* Diagnoses */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Suggested Diagnoses</h4>
        {assessment!.suggestedDiagnoses.map((d, i) => (
          <div key={i} style={{
            background: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: i === 0 ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{d.name}</span>
              <SeverityBadge severity={d.severity} />
            </div>
            <ConfidenceBar value={d.confidence} />
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>{d.reasoning}</div>
            {showProtocol && i === 0 && (
              <div style={{
                marginTop: 10, padding: 10, background: "#F5F7FA", borderRadius: 8,
                fontSize: 12, color: COLORS.text, lineHeight: 1.5, whiteSpace: "pre-wrap",
              }}>
                <strong>Treatment Protocol:</strong> {d.suggestedTreatment}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recommended Tests */}
      {assessment!.recommendedTests.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Recommended Tests</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {assessment!.recommendedTests.map(t => (
              <span key={t} style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 16,
                background: COLORS.primaryLight, color: COLORS.primary, fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Card */}
      <RecommendationCard
        recommendation={assessment!.recommendation}
        topDiagnosis={assessment!.suggestedDiagnoses[0]}
        onRefer={() => onRefer(assessment!.suggestedDiagnoses[0]?.name || "")}
        onShowProtocol={() => setShowProtocol(!showProtocol)}
      />

      <button onClick={runAssessment} style={{
        width: "100%", padding: "10px", borderRadius: 10, marginTop: 12,
        background: "transparent", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`,
        fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <RefreshCw size={14} /> Re-run Assessment
      </button>
    </div>
  );
}

// ─── Referral Form Modal ─────────────────────────────────────────

function ReferralFormModal({ patient, prefillDiagnosis, onClose, onSubmit }: {
  patient: PatientRecord;
  prefillDiagnosis: string;
  onClose: () => void;
  onSubmit: (referral: ReferralRecord) => void;
}) {
  const [facility, setFacility] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "emergency">("urgent");
  const [reason, setReason] = useState(prefillDiagnosis);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const sel = FACILITIES.find(f => f.name === facility);
    const referral: ReferralRecord = {
      id: `ref-${Date.now()}`, patientId: patient.id, patientName: patient.name,
      facility: facility || FACILITIES[0].name,
      facilityType: sel?.type || "Health Centre",
      urgency, reason, notes, status: "sent",
      createdAt: new Date().toISOString(), aiDiagnosis: prefillDiagnosis,
    };
    onSubmit(referral);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: COLORS.bg, zIndex: 200,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36, background: "#E8F5E9",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <Check size={36} color="#2E7D32" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Referral Sent</h2>
        <p style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24 }}>
          {patient.name} has been referred to {facility || FACILITIES[0].name}
        </p>
        <button onClick={onClose} style={{
          padding: "12px 32px", borderRadius: 12, background: COLORS.primary,
          color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}>Done</button>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: COLORS.bg, zIndex: 200,
      overflow: "auto",
    }}>
      <TopBar title="Refer Patient" onBack={onClose} />
      <div style={{ padding: 16 }}>
        {/* Patient card */}
        <div style={{
          background: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12, boxShadow: COLORS.shadow,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22, background: COLORS.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: COLORS.primary,
          }}>{patient.name[0]}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{patient.name}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{patient.age}y, {patient.gender}</div>
          </div>
        </div>

        <FormField label="Referring Facility" required>
          <SelectInput value={facility} onChange={setFacility} options={FACILITIES.map(f => f.name)} placeholder="Select facility" />
        </FormField>

        {facility && (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, marginTop: -8 }}>
            {FACILITIES.find(f => f.name === facility)?.type} — {FACILITIES.find(f => f.name === facility)?.distance}
          </div>
        )}

        <FormField label="Urgency" required>
          <RadioGroup value={urgency} onChange={v => setUrgency(v as "routine" | "urgent" | "emergency")} options={["routine", "urgent", "emergency"]} />
        </FormField>

        <FormField label="Reason for Referral" required>
          <TextInput value={reason} onChange={setReason} placeholder="Primary diagnosis or concern" multiline />
        </FormField>

        <FormField label="Additional Notes">
          <TextInput value={notes} onChange={setNotes} placeholder="Clinical notes, medications given, etc." multiline />
        </FormField>

        <button onClick={handleSubmit} style={{
          width: "100%", padding: "14px", borderRadius: 12,
          background: "linear-gradient(135deg, #0D47A1, #1565C0)",
          color: "#fff", border: "none", fontSize: 16, fontWeight: 600,
          cursor: "pointer", marginTop: 8, boxShadow: "0 4px 12px rgba(13,71,161,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Send size={18} /> Send Referral
        </button>
      </div>
    </div>
  );
}

// ─── Medical Assistant Chat ──────────────────────────────────────

function MedicalAssistantChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm your clinical assistant. Ask me about treatment protocols, drug dosing, or emergency management — all based on WHO/IMCI guidelines for South Sudan.", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const speech = useSpeechRecognition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevTranscriptRef = useRef("");

  useEffect(() => {
    if (speech.transcript && speech.transcript !== prevTranscriptRef.current) {
      setInput(speech.transcript);
      prevTranscriptRef.current = speech.transcript;
    }
  }, [speech.transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const response = inlineGetAssistantResponse(input.trim());
    const assistantMsg: ChatMessage = { role: "assistant", content: response.content, topic: response.topic, timestamp: new Date().toISOString() };
    setTimeout(() => setMessages(prev => [...prev, assistantMsg]), 300);
    setInput("");
    prevTranscriptRef.current = "";
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "70vh",
      background: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      boxShadow: "0 -8px 32px rgba(0,0,0,0.15)", zIndex: 150,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18, background: COLORS.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={18} color={COLORS.primary} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Medical Assistant</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>WHO/IMCI Guidelines</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <X size={22} color={COLORS.textSecondary} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 12,
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: 14,
              background: msg.role === "user" ? COLORS.primary : "#F0F4F8",
              color: msg.role === "user" ? "#fff" : COLORS.text,
              fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap",
              borderBottomRightRadius: msg.role === "user" ? 4 : 14,
              borderBottomLeftRadius: msg.role === "user" ? 14 : 4,
            }}>
              {msg.topic && msg.role === "assistant" && (
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, marginBottom: 4 }}>{msg.topic}</div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 16px 16px", borderTop: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <VoiceRecordButton
          isListening={speech.isListening}
          onToggle={() => speech.isListening ? speech.stopListening() : speech.startListening()}
          isSupported={speech.isSupported}
        />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask a medical question..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 24,
            border: `1.5px solid ${COLORS.border}`, fontSize: 14,
            outline: "none", fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button onClick={sendMessage} style={{
          width: 40, height: 40, borderRadius: 20, background: COLORS.primary,
          color: "#fff", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Transfer Queue, Form Selector, Export, Sync Components ──────

function TransferQueueSection({ referrals }: { referrals: ReferralRecord[] }) {
  if (referrals.length === 0) return null;
  return (
    <div style={{ padding: "8px 16px 16px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <ArrowRight size={18} color={COLORS.primary} /> Transfer Queue
      </h2>
      <div style={{ background: COLORS.card, borderRadius: 14, boxShadow: COLORS.shadow, overflow: "hidden" }}>
        {referrals.map((ref, i) => (
          <div key={ref.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            borderBottom: i < referrals.length - 1 ? `1px solid ${COLORS.border}` : "none",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: ref.urgency === "emergency" ? "#FFEBEE" : COLORS.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowRight size={16} color={ref.urgency === "emergency" ? "#C62828" : COLORS.primary} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{ref.patientName}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>→ {ref.facility}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{ref.reason.slice(0, 50)}...</div>
            </div>
            <ReferralStatusBadge status={ref.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormTypeSelectorModal({ onSelect, onClose }: { onSelect: (type: string) => void; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 430, background: COLORS.card,
        borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>New Record</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => { onSelect(id); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "14px 12px",
              borderRadius: 12, border: `1.5px solid ${COLORS.border}`, background: COLORS.card,
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `${color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: "100%", padding: "12px", borderRadius: 10, marginTop: 16,
          background: "#F0F4F8", color: COLORS.textSecondary, border: "none",
          fontSize: 14, fontWeight: 500, cursor: "pointer",
        }}>Cancel</button>
      </div>
    </div>
  );
}

function ExportDialog({ type, onClose }: { type: "csv" | "dhis2"; onClose: () => void }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setDone(true); return 100; }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: COLORS.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 340,
        textAlign: "center",
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>
          {done ? "Export Complete" : `Exporting ${type === "csv" ? "CSV" : "to DHIS2"}...`}
        </h3>
        <div style={{ width: "100%", height: 8, background: "#E3F2FD", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`, height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, #1565C0, #1976D2)",
            transition: "width 0.2s",
          }} />
        </div>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
          {done ? `${type === "csv" ? "CSV file ready for download" : "Data pushed to DHIS2 successfully"}` : `${Math.min(Math.round(progress), 100)}% complete`}
        </p>
        {done && (
          <button onClick={onClose} style={{
            padding: "10px 24px", borderRadius: 10, background: COLORS.primary,
            color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Done</button>
        )}
      </div>
    </div>
  );
}

function SyncAnimation({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: COLORS.card, borderRadius: 16, padding: 32, textAlign: "center",
      }}>
        <RefreshCw size={40} color={COLORS.primary} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginTop: 16 }}>Syncing data...</p>
        <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>Connecting to server</p>
      </div>
    </div>
  );
}

// ─── Screen: Home (Task Dashboard) ───────────────────────────────

function HomeScreen({ onQuickAction, onNavigate, referrals }: { onQuickAction: (type: string) => void; onNavigate: (s: string) => void; referrals: ReferralRecord[] }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentEvents = [...EVENTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)",
        padding: "16px 16px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{greeting},</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{WORKER_PROFILE.name}</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={22} color="#fff" />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          <MapPin size={14} />
          <span>{WORKER_PROFILE.boma}, {WORKER_PROFILE.payam}</span>
          <span style={{ margin: "0 6px" }}>•</span>
          <Calendar size={14} />
          <span>{dateStr}</span>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: 10, padding: "16px 16px 8px", overflowX: "auto" }}>
        {[
          { label: "Households Visited", value: "20/45", sub: "this month", color: COLORS.primary, nav: "map" },
          { label: "Patients Seen Today", value: "6", sub: "consultations", color: "#1976D2", nav: "records" },
          { label: "Pending Tasks", value: "3", sub: "follow-ups", color: "#1E88E5", nav: "analytics" },
        ].map(({ label, value, sub, color, nav }) => (
          <div key={label} onClick={() => onNavigate(nav)} style={{
            flex: "0 0 auto", minWidth: 140, background: COLORS.card, borderRadius: 14,
            padding: "14px 16px", boxShadow: COLORS.shadow, borderLeft: `4px solid ${color}`,
            cursor: "pointer", transition: "transform 0.15s",
          }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "12px 16px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => onQuickAction(id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 12px",
              borderRadius: 12, border: `1.5px solid ${COLORS.border}`, background: COLORS.card,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: `${color}15`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, lineHeight: 1.3 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ padding: "8px 16px 16px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Recent Activity</h2>
        <div style={{ background: COLORS.card, borderRadius: 14, boxShadow: COLORS.shadow, overflow: "hidden" }}>
          {recentEvents.map((ev, i) => (
            <div key={ev.id} style={{
              display: "flex", gap: 12, padding: "12px 14px", alignItems: "flex-start",
              borderBottom: i < recentEvents.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div style={{ paddingTop: 2 }}><EventTypeBadge type={ev.type} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.4 }}>{ev.description}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: COLORS.textSecondary }}>
                  <Clock size={11} />
                  {ev.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Queue */}
      <TransferQueueSection referrals={referrals} />

      {/* Sync Status */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, background: COLORS.primaryLight,
          borderRadius: 12, padding: "10px 14px",
        }}>
          <Check size={16} color={COLORS.primary} />
          <span style={{ fontSize: 13, color: COLORS.primary, fontWeight: 500 }}>All data synced</span>
          <span style={{ fontSize: 12, color: COLORS.textSecondary, marginLeft: "auto" }}>Last: 10 min ago</span>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Records (Registry with 3 Tabs) ─────────────────────

function RecordsScreen({ onSelectPatient, onQuickAction }: { onSelectPatient: (p: PatientRecord) => void; onQuickAction: (type: string) => void }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("households");
  const [showFormSelector, setShowFormSelector] = useState(false);

  const filteredHouseholds = HOUSEHOLDS.filter((h) =>
    h.head.toLowerCase().includes(search.toLowerCase()) || h.id.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPatients = PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredEvents = EVENTS.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) || e.type.includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="Registry" />

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${COLORS.border}` }}>
        {[
          { id: "households", label: "Households" },
          { id: "patients", label: "Patients" },
          { id: "events", label: "Events" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: "12px", background: "none", border: "none",
            borderBottom: activeTab === id ? `3px solid ${COLORS.primary}` : "3px solid transparent",
            color: activeTab === id ? COLORS.primary : COLORS.textSecondary,
            fontWeight: activeTab === id ? 600 : 400, fontSize: 14, cursor: "pointer",
          }}>
            {label}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder={
        activeTab === "households" ? "Search households..." :
        activeTab === "patients" ? "Search patients..." : "Search events..."
      } />

      {/* Households Tab */}
      {activeTab === "households" && (
        <div style={{ padding: "0 16px" }}>
          {filteredHouseholds.map((hh, i) => (
            <div key={hh.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
              borderBottom: i < filteredHouseholds.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: COLORS.primaryLight,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <HomeIcon size={20} color={COLORS.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: COLORS.text }}>{hh.head}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10,
                    background: hh.visitStatus === "visited" ? "#E3F2FD" : "#FFF3E0",
                    color: hh.visitStatus === "visited" ? "#1565C0" : "#E65100",
                  }}>
                    {hh.visitStatus === "visited" ? "Visited" : "Overdue"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                  {hh.id} • {hh.members} members
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  Last visit: {hh.lastVisit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === "patients" && (
        <div style={{ padding: "0 16px" }}>
          {filteredPatients.map((patient, i) => (
            <div key={patient.id} onClick={() => onSelectPatient(patient)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
              borderBottom: i < filteredPatients.length - 1 ? `1px solid ${COLORS.border}` : "none",
              cursor: "pointer",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20, background: COLORS.primaryLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 600, color: COLORS.primary,
              }}>
                {patient.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: COLORS.primary }}>{patient.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{patient.age}y, {patient.gender}</span>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>• {patient.household}</span>
                </div>
                {patient.conditions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {patient.conditions.slice(0, 2).map((c: string) => (
                      <span key={c} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 8,
                        background: COLORS.primaryLight, color: COLORS.primary,
                      }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <HealthStatusBadge status={patient.status} />
            </div>
          ))}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div style={{ padding: "0 16px" }}>
          {filteredEvents.map((ev, i) => (
            <div key={ev.id} style={{
              display: "flex", gap: 12, padding: "14px 0", alignItems: "flex-start",
              borderBottom: i < filteredEvents.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <EventTypeBadge type={ev.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.4 }}>{ev.description}</div>
                {ev.patient && (
                  <div style={{ fontSize: 12, color: COLORS.primary, marginTop: 2 }}>{ev.patient}</div>
                )}
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{ev.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowFormSelector(true)} style={{
        position: "fixed", bottom: 76, right: 16, width: 52, height: 52,
        borderRadius: 26, background: COLORS.primary, color: "#fff",
        border: "none", cursor: "pointer", boxShadow: COLORS.shadowLg,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10,
      }}>
        <Plus size={24} />
      </button>

      {showFormSelector && (
        <FormTypeSelectorModal onSelect={onQuickAction} onClose={() => setShowFormSelector(false)} />
      )}
    </div>
  );
}

// ─── Screen: Data Entry Forms ────────────────────────────────────

function DataEntryForm({ formType, onClose }: { formType: string; onClose: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, val: any) => setFormData((prev: Record<string, unknown>) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  const titleMap: Record<string, string> = {
    birth: "Birth Registration",
    death: "Death Registration",
    malaria: "Malaria Case",
    anc: "ANC Visit",
    immunization: "Immunization",
    household: "Household Visit",
    wash: "WASH Survey",
  };

  if (saved) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: COLORS.bg, padding: 24,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32, background: COLORS.primaryLight,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <Check size={32} color={COLORS.primary} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 8px" }}>Record Saved</h2>
        <p style={{ fontSize: 14, color: COLORS.textSecondary }}>Returning to home...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <TopBar title={titleMap[formType] || "Data Entry"} onBack={onClose} />

      <div style={{ padding: 16 }}>
        {/* Birth Registration */}
        {formType === "birth" && (
          <>
            <FormField label="Mother's Name" required>
              <TextInput value={formData.motherName || ""} onChange={(v) => set("motherName", v)} placeholder="Full name" />
            </FormField>
            <FormField label="Mother's Age" required>
              <NumberInput value={formData.motherAge || ""} onChange={(v) => set("motherAge", v)} placeholder="Age" min={12} max={55} />
            </FormField>
            <FormField label="Baby's Gender" required>
              <RadioGroup value={formData.babyGender || ""} onChange={(v) => set("babyGender", v)} options={["Male", "Female"]} />
            </FormField>
            <FormField label="Baby's Weight (kg)">
              <NumberInput value={formData.babyWeight || ""} onChange={(v) => set("babyWeight", v)} placeholder="e.g. 3.2" />
            </FormField>
            <FormField label="Date of Birth" required>
              <TextInput value={formData.dob || ""} onChange={(v) => set("dob", v)} placeholder="YYYY-MM-DD" />
            </FormField>
            <FormField label="Delivery Type" required>
              <RadioGroup value={formData.deliveryType || ""} onChange={(v) => set("deliveryType", v)} options={DELIVERY_TYPES} />
            </FormField>
            <FormField label="Delivery Location" required>
              <SelectInput value={formData.deliveryLocation || ""} onChange={(v) => set("deliveryLocation", v)} options={DELIVERY_LOCATIONS} placeholder="Select location" />
            </FormField>
            <FormField label="Delivery Attendant">
              <SelectInput value={formData.attendant || ""} onChange={(v) => set("attendant", v)} options={DELIVERY_ATTENDANTS} placeholder="Select attendant" />
            </FormField>
            <FormField label="Complications">
              <TextInput value={formData.complications || ""} onChange={(v) => set("complications", v)} placeholder="Any complications (optional)" multiline />
            </FormField>
          </>
        )}

        {/* Death Registration */}
        {formType === "death" && (
          <>
            <FormField label="Deceased Name" required>
              <TextInput value={formData.deceasedName || ""} onChange={(v) => set("deceasedName", v)} placeholder="Full name" />
            </FormField>
            <FormField label="Age at Death" required>
              <NumberInput value={formData.deceasedAge || ""} onChange={(v) => set("deceasedAge", v)} placeholder="Age" />
            </FormField>
            <FormField label="Gender" required>
              <RadioGroup value={formData.deceasedGender || ""} onChange={(v) => set("deceasedGender", v)} options={["Male", "Female"]} />
            </FormField>
            <FormField label="Date of Death" required>
              <TextInput value={formData.dateOfDeath || ""} onChange={(v) => set("dateOfDeath", v)} placeholder="YYYY-MM-DD" />
            </FormField>
            <FormField label="Cause of Death" required>
              <SelectInput value={formData.causeOfDeath || ""} onChange={(v) => set("causeOfDeath", v)} options={CAUSES_OF_DEATH} placeholder="Select cause" />
            </FormField>
            <FormField label="Place of Death" required>
              <RadioGroup value={formData.placeOfDeath || ""} onChange={(v) => set("placeOfDeath", v)} options={["Home", "Health facility", "On the way", "Other"]} />
            </FormField>
            <FormField label="Maternal Death?">
              <RadioGroup value={formData.maternalDeath || ""} onChange={(v) => set("maternalDeath", v)} options={["Yes", "No", "N/A"]} />
            </FormField>
            <FormField label="Notes">
              <TextInput value={formData.deathNotes || ""} onChange={(v) => set("deathNotes", v)} placeholder="Additional details" multiline />
            </FormField>
          </>
        )}

        {/* Malaria Case */}
        {formType === "malaria" && (
          <>
            <FormField label="Patient Name" required>
              <TextInput value={formData.patientName || ""} onChange={(v) => set("patientName", v)} placeholder="Full name" />
            </FormField>
            <FormField label="Patient Age" required>
              <NumberInput value={formData.patientAge || ""} onChange={(v) => set("patientAge", v)} placeholder="Age" />
            </FormField>
            <FormField label="Gender" required>
              <RadioGroup value={formData.patientGender || ""} onChange={(v) => set("patientGender", v)} options={["Male", "Female"]} />
            </FormField>
            <FormField label="Symptoms" required>
              <CheckboxGroup selected={formData.symptoms || []} onChange={(v) => set("symptoms", v)} options={MALARIA_SYMPTOMS} />
            </FormField>
            <FormField label="RDT Result" required>
              <RadioGroup value={formData.rdtResult || ""} onChange={(v) => set("rdtResult", v)} options={["Positive (Pf)", "Positive (Pv)", "Positive (Mixed)", "Negative"]} />
            </FormField>
            <FormField label="Treatment Given">
              <RadioGroup value={formData.treatment || ""} onChange={(v) => set("treatment", v)} options={["ACT", "Quinine", "Artesunate", "None - referred"]} />
            </FormField>
            <FormField label="Referred to Facility?">
              <RadioGroup value={formData.referred || ""} onChange={(v) => set("referred", v)} options={["Yes", "No"]} />
            </FormField>
            <FormField label="Notes">
              <TextInput value={formData.malariaNotes || ""} onChange={(v) => set("malariaNotes", v)} placeholder="Additional notes" multiline />
            </FormField>
          </>
        )}

        {/* ANC Visit */}
        {formType === "anc" && (
          <>
            <FormField label="Mother's Name" required>
              <TextInput value={formData.motherName || ""} onChange={(v) => set("motherName", v)} placeholder="Full name" />
            </FormField>
            <FormField label="Visit Number" required>
              <RadioGroup value={formData.visitNumber || ""} onChange={(v) => set("visitNumber", v)} options={["1st", "2nd", "3rd", "4th+"]} />
            </FormField>
            <FormField label="Gestational Age (weeks)" required>
              <NumberInput value={formData.gestationalAge || ""} onChange={(v) => set("gestationalAge", v)} placeholder="Weeks" min={4} max={42} />
            </FormField>
            <FormField label="Blood Pressure (systolic)">
              <NumberInput value={formData.bpSystolic || ""} onChange={(v) => set("bpSystolic", v)} placeholder="mmHg" />
            </FormField>
            <FormField label="Blood Pressure (diastolic)">
              <NumberInput value={formData.bpDiastolic || ""} onChange={(v) => set("bpDiastolic", v)} placeholder="mmHg" />
            </FormField>
            <FormField label="Weight (kg)">
              <NumberInput value={formData.weight || ""} onChange={(v) => set("weight", v)} placeholder="kg" />
            </FormField>
            <FormField label="Risk Factors">
              <CheckboxGroup selected={formData.riskFactors || []} onChange={(v) => set("riskFactors", v)} options={ANC_RISK_FACTORS} />
            </FormField>
            <FormField label="Supplements Given">
              <CheckboxGroup selected={formData.supplements || []} onChange={(v) => set("supplements", v)} options={["Iron/Folic acid", "Calcium", "Deworming tablet", "IPTp (SP)", "ITN provided"]} />
            </FormField>
            <FormField label="Notes">
              <TextInput value={formData.ancNotes || ""} onChange={(v) => set("ancNotes", v)} placeholder="Observations" multiline />
            </FormField>
          </>
        )}

        {/* Immunization */}
        {formType === "immunization" && (
          <>
            <FormField label="Child's Name" required>
              <TextInput value={formData.childName || ""} onChange={(v) => set("childName", v)} placeholder="Full name" />
            </FormField>
            <FormField label="Child's Age (months)" required>
              <NumberInput value={formData.childAge || ""} onChange={(v) => set("childAge", v)} placeholder="Months" />
            </FormField>
            <FormField label="Gender" required>
              <RadioGroup value={formData.childGender || ""} onChange={(v) => set("childGender", v)} options={["Male", "Female"]} />
            </FormField>
            <FormField label="Vaccine Type" required>
              <SelectInput value={formData.vaccineType || ""} onChange={(v) => set("vaccineType", v)} options={VACCINE_TYPES} placeholder="Select vaccine" />
            </FormField>
            <FormField label="Dose Number" required>
              <RadioGroup value={formData.doseNumber || ""} onChange={(v) => set("doseNumber", v)} options={["1st", "2nd", "3rd", "Booster"]} />
            </FormField>
            <FormField label="Batch Number">
              <TextInput value={formData.batchNumber || ""} onChange={(v) => set("batchNumber", v)} placeholder="Vaccine batch #" />
            </FormField>
            <FormField label="Adverse Reaction?">
              <RadioGroup value={formData.adverseReaction || ""} onChange={(v) => set("adverseReaction", v)} options={["None", "Mild", "Moderate", "Severe"]} />
            </FormField>
            {formData.adverseReaction && formData.adverseReaction !== "None" && (
              <FormField label="Reaction Details">
                <TextInput value={formData.reactionDetails || ""} onChange={(v) => set("reactionDetails", v)} placeholder="Describe reaction" multiline />
              </FormField>
            )}
          </>
        )}

        {/* Household Visit */}
        {formType === "household" && (
          <>
            <FormField label="Household" required>
              <SelectInput value={formData.householdId || ""} onChange={(v) => set("householdId", v)} options={HOUSEHOLDS.map((h) => `${h.id} - ${h.head}`)} placeholder="Select household" />
            </FormField>
            <FormField label="Members Present" required>
              <NumberInput value={formData.membersPresent || ""} onChange={(v) => set("membersPresent", v)} placeholder="Number present" />
            </FormField>
            <FormField label="Water Source">
              <SelectInput value={formData.waterSource || ""} onChange={(v) => set("waterSource", v)} options={WATER_SOURCES} placeholder="Current water source" />
            </FormField>
            <FormField label="Water Treatment">
              <SelectInput value={formData.waterTreatment || ""} onChange={(v) => set("waterTreatment", v)} options={WATER_TREATMENTS} placeholder="Treatment method" />
            </FormField>
            <FormField label="Latrine Condition">
              <RadioGroup value={formData.latrineCondition || ""} onChange={(v) => set("latrineCondition", v)} options={["Good", "Needs repair", "Not functional", "No latrine"]} />
            </FormField>
            <FormField label="Health Concerns Identified">
              <CheckboxGroup selected={formData.healthConcerns || []} onChange={(v) => set("healthConcerns", v)} options={["Sick child", "Pregnant woman needs ANC", "Missed immunization", "Malnutrition signs", "Malaria symptoms", "Diarrhea case", "None"]} />
            </FormField>
            <FormField label="Notes">
              <TextInput value={formData.householdNotes || ""} onChange={(v) => set("householdNotes", v)} placeholder="Observations from visit" multiline />
            </FormField>
          </>
        )}

        {/* WASH Survey */}
        {formType === "wash" && (
          <>
            <FormField label="Household" required>
              <SelectInput value={formData.washHousehold || ""} onChange={(v) => set("washHousehold", v)} options={HOUSEHOLDS.map((h) => `${h.id} - ${h.head}`)} placeholder="Select household" />
            </FormField>
            <FormField label="Primary Water Source" required>
              <SelectInput value={formData.primaryWater || ""} onChange={(v) => set("primaryWater", v)} options={WATER_SOURCES} placeholder="Select source" />
            </FormField>
            <FormField label="Water Treatment Method">
              <SelectInput value={formData.washTreatment || ""} onChange={(v) => set("washTreatment", v)} options={WATER_TREATMENTS} placeholder="Select method" />
            </FormField>
            <FormField label="Distance to Water (minutes walk)">
              <RadioGroup value={formData.waterDistance || ""} onChange={(v) => set("waterDistance", v)} options={["<15 min", "15-30 min", "30-60 min", ">60 min"]} />
            </FormField>
            <FormField label="Latrine Type" required>
              <SelectInput value={formData.latrineType || ""} onChange={(v) => set("latrineType", v)} options={LATRINE_TYPES} placeholder="Select type" />
            </FormField>
            <FormField label="Handwashing Station">
              <RadioGroup value={formData.handwashing || ""} onChange={(v) => set("handwashing", v)} options={["Yes, with soap", "Yes, water only", "No station"]} />
            </FormField>
            <FormField label="Waste Disposal">
              <RadioGroup value={formData.wasteDisposal || ""} onChange={(v) => set("wasteDisposal", v)} options={["Burning", "Burying", "Collection service", "Open dumping"]} />
            </FormField>
            <FormField label="Notes">
              <TextInput value={formData.washNotes || ""} onChange={(v) => set("washNotes", v)} placeholder="Additional observations" multiline />
            </FormField>
          </>
        )}

        {/* Save Button */}
        <button onClick={handleSave} style={{
          width: "100%", padding: "14px", borderRadius: 12,
          background: "linear-gradient(135deg, #0D47A1, #1565C0)",
          color: "#fff", border: "none", fontSize: 16, fontWeight: 600,
          cursor: "pointer", marginTop: 8, marginBottom: 24,
          boxShadow: "0 4px 12px rgba(13,71,161,0.3)",
        }}>
          Save Record
        </button>
      </div>
    </div>
  );
}

// ─── Screen: Patient Detail (Enhanced) ──────────────────────────

function PatientDetailScreen({ patient, onBack, onAddReferral }: { patient: PatientRecord; onBack: () => void; onAddReferral: (r: ReferralRecord) => void }) {
  const [activeTab, setActiveTab] = useState("info");
  const [vitals, setVitals] = useState({ temp: "", bp: "", weight: "", pulse: "", respRate: "", spo2: "", height: "", muac: "" });
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [entrySaved, setEntrySaved] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralDiagnosis, setReferralDiagnosis] = useState("");
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const speech = useSpeechRecognition();
  const [voiceTarget, setVoiceTarget] = useState<string | null>(null);
  const prevTranscriptRef = useRef("");

  const patientEvents = EVENTS.filter((e) => e.patientId === patient.id);

  useEffect(() => {
    if (speech.transcript && speech.transcript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = speech.transcript;
      if (voiceTarget === "complaint") setChiefComplaint(speech.transcript);
      else if (voiceTarget === "diagnosis") setDiagnosis(speech.transcript);
      else if (voiceTarget === "treatment") setTreatment(speech.transcript);
      else if (voiceTarget === "voicenote") {
        // will be captured on stop
      }
    }
  }, [speech.transcript, voiceTarget]);

  const handleVoiceToggle = (target: string) => {
    if (speech.isListening) {
      speech.stopListening();
      if (voiceTarget === "voicenote" && speech.transcript) {
        setVoiceNotes(prev => [...prev, {
          id: `vn-${Date.now()}`, transcript: speech.transcript,
          timestamp: new Date().toISOString(), duration: 0,
        }]);
      }
      setVoiceTarget(null);
    } else {
      setVoiceTarget(target);
      speech.startListening();
    }
  };

  const handleSaveEntry = () => {
    setEntrySaved(true);
    setTimeout(() => setEntrySaved(false), 2000);
  };

  const handleRefer = (diag: string) => {
    setReferralDiagnosis(diag);
    setShowReferralForm(true);
  };

  if (showReferralForm) {
    return (
      <ReferralFormModal
        patient={patient}
        prefillDiagnosis={referralDiagnosis}
        onClose={() => setShowReferralForm(false)}
        onSubmit={(r) => { onAddReferral(r); setShowReferralForm(false); }}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="Patient Detail" onBack={onBack} />

      {/* Demographics Card */}
      <div style={{ padding: 16 }}>
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: 16,
          boxShadow: COLORS.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 26, background: COLORS.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: COLORS.primary,
            }}>
              {patient.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{patient.name}</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                {patient.age} years, {patient.gender} • {patient.household}
              </div>
            </div>
            <HealthStatusBadge status={patient.status} />
          </div>
          {patient.conditions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {patient.conditions.map((c: string) => (
                <span key={c} style={{
                  fontSize: 12, padding: "4px 10px", borderRadius: 10,
                  background: COLORS.primaryLight, color: COLORS.primary, fontWeight: 500,
                }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${COLORS.border}`, overflowX: "auto" }}>
        {[
          { id: "info", label: "Timeline" },
          { id: "entry", label: "Data Entry" },
          { id: "ai", label: "AI Assess" },
          { id: "voice", label: "Voice Notes" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: "12px 8px", background: "none", border: "none", whiteSpace: "nowrap",
            borderBottom: activeTab === id ? `3px solid ${COLORS.primary}` : "3px solid transparent",
            color: activeTab === id ? COLORS.primary : COLORS.textSecondary,
            fontWeight: activeTab === id ? 600 : 400, fontSize: 13, cursor: "pointer",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Timeline Tab */}
      {activeTab === "info" && (
        <div style={{ padding: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Health Events</h3>
          {patientEvents.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: COLORS.textSecondary }}>
              <FileText size={32} color={COLORS.border} />
              <p style={{ marginTop: 8 }}>No events recorded yet</p>
            </div>
          )}
          {patientEvents.map((ev, i) => (
            <div key={ev.id} style={{
              display: "flex", gap: 12, marginBottom: 12, position: "relative",
              paddingLeft: 20,
            }}>
              {i < patientEvents.length - 1 && (
                <div style={{
                  position: "absolute", left: 6, top: 24, bottom: -12,
                  width: 2, background: COLORS.border,
                }} />
              )}
              <div style={{
                position: "absolute", left: 0, top: 6, width: 14, height: 14,
                borderRadius: 7, background: COLORS.primaryLight, border: `2px solid ${COLORS.primary}`,
              }} />
              <div style={{
                flex: 1, background: COLORS.card, borderRadius: 10, padding: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <EventTypeBadge type={ev.type} />
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{ev.date}</span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.4 }}>{ev.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Entry Tab (enhanced) */}
      {activeTab === "entry" && (
        <div style={{ padding: 16 }}>
          {entrySaved && (
            <div style={{
              background: COLORS.primaryLight, borderRadius: 10, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
            }}>
              <Check size={16} color={COLORS.primary} />
              <span style={{ fontSize: 14, color: COLORS.primary, fontWeight: 500 }}>Data saved successfully</span>
            </div>
          )}

          {/* Chief Complaint */}
          <div style={{
            background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Chief Complaint</h4>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput value={chiefComplaint} onChange={setChiefComplaint} placeholder="What brings the patient in today?" multiline />
              </div>
              <VoiceRecordButton
                isListening={speech.isListening && voiceTarget === "complaint"}
                onToggle={() => handleVoiceToggle("complaint")}
                isSupported={speech.isSupported}
              />
            </div>
          </div>

          {/* Vitals (enhanced) */}
          <div style={{
            background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Vitals</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FormField label="Temperature (°C)">
                <NumberInput value={vitals.temp} onChange={(v) => setVitals({ ...vitals, temp: v })} placeholder="e.g. 37.2" />
              </FormField>
              <FormField label="Blood Pressure">
                <TextInput value={vitals.bp} onChange={(v) => setVitals({ ...vitals, bp: v })} placeholder="120/80" />
              </FormField>
              <FormField label="Weight (kg)">
                <NumberInput value={vitals.weight} onChange={(v) => setVitals({ ...vitals, weight: v })} placeholder="kg" />
              </FormField>
              <FormField label="Pulse (bpm)">
                <NumberInput value={vitals.pulse} onChange={(v) => setVitals({ ...vitals, pulse: v })} placeholder="bpm" />
              </FormField>
              <FormField label="Resp. Rate (/min)">
                <NumberInput value={vitals.respRate} onChange={(v) => setVitals({ ...vitals, respRate: v })} placeholder="/min" />
              </FormField>
              <FormField label="SpO₂ (%)">
                <NumberInput value={vitals.spo2} onChange={(v) => setVitals({ ...vitals, spo2: v })} placeholder="%" />
              </FormField>
              <FormField label="Height (cm)">
                <NumberInput value={vitals.height} onChange={(v) => setVitals({ ...vitals, height: v })} placeholder="cm" />
              </FormField>
              <FormField label="MUAC (cm)">
                <NumberInput value={vitals.muac} onChange={(v) => setVitals({ ...vitals, muac: v })} placeholder="cm" />
              </FormField>
            </div>
          </div>

          {/* Symptoms */}
          <div style={{
            background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Symptoms</h4>
            <CheckboxGroup selected={symptoms} onChange={setSymptoms} options={["Fever", "Cough", "Headache", "Diarrhea", "Vomiting", "Body pain", "Difficulty breathing", "Skin rash"]} />
          </div>

          {/* Diagnosis */}
          <div style={{
            background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Diagnosis</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput value={diagnosis} onChange={setDiagnosis} placeholder="Enter diagnosis" />
              </div>
              <VoiceRecordButton
                isListening={speech.isListening && voiceTarget === "diagnosis"}
                onToggle={() => handleVoiceToggle("diagnosis")}
                isSupported={speech.isSupported}
              />
            </div>
          </div>

          {/* Treatment */}
          <div style={{
            background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Treatment</h4>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput value={treatment} onChange={setTreatment} placeholder="Treatment given" multiline />
              </div>
              <VoiceRecordButton
                isListening={speech.isListening && voiceTarget === "treatment"}
                onToggle={() => handleVoiceToggle("treatment")}
                isSupported={speech.isSupported}
              />
            </div>
          </div>

          <button onClick={handleSaveEntry} style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: "linear-gradient(135deg, #0D47A1, #1565C0)",
            color: "#fff", border: "none", fontSize: 16, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(13,71,161,0.3)",
          }}>
            Save Entry
          </button>
        </div>
      )}

      {/* AI Assess Tab */}
      {activeTab === "ai" && (
        <AIAssessmentPanel
          patient={patient}
          vitals={vitals}
          symptoms={symptoms}
          chiefComplaint={chiefComplaint}
          onRefer={handleRefer}
        />
      )}

      {/* Voice Notes Tab */}
      {activeTab === "voice" && (
        <div style={{ padding: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <button onClick={() => handleVoiceToggle("voicenote")} style={{
              width: 72, height: 72, borderRadius: 36, border: "none", cursor: "pointer",
              background: speech.isListening && voiceTarget === "voicenote" ? "#C62828" : COLORS.primary,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto", position: "relative", boxShadow: COLORS.shadowLg,
            }}>
              {speech.isListening && voiceTarget === "voicenote" ? <MicOff size={28} /> : <Mic size={28} />}
              {speech.isListening && voiceTarget === "voicenote" && (
                <span style={{
                  position: "absolute", inset: -6, borderRadius: "50%",
                  border: "3px solid #C62828", animation: "pulse 1.5s infinite",
                }} />
              )}
            </button>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 10 }}>
              {speech.isListening && voiceTarget === "voicenote"
                ? "Recording... Tap to stop"
                : speech.isSupported ? "Tap to record a voice note" : "Voice recording not supported in this browser"}
            </p>
            {speech.isListening && voiceTarget === "voicenote" && speech.transcript && (
              <div style={{
                marginTop: 10, padding: 12, background: "#F0F4F8", borderRadius: 10,
                fontSize: 13, color: COLORS.text, fontStyle: "italic",
              }}>
                {speech.transcript}
              </div>
            )}
          </div>

          <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Recorded Notes</h4>
          {voiceNotes.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: COLORS.textSecondary }}>
              <Mic size={32} color={COLORS.border} />
              <p style={{ marginTop: 8 }}>No voice notes yet</p>
            </div>
          )}
          {voiceNotes.map(vn => (
            <div key={vn.id} style={{
              background: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 8,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{vn.transcript}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 6 }}>
                {new Date(vn.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Screen: Map ─────────────────────────────────────────────────

function MapScreen() {
  const [selectedHH, setSelectedHH] = useState(0);
  const hh = HOUSEHOLDS[selectedHH];

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="Map View" />
      <div style={{
        height: "calc(100vh - 132px)", background: "#E8F0F5",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #90CAF9 50%, #E3F2FD 70%, #F5F5F5 100%)",
        }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`h${i}`} style={{
              position: "absolute", left: 0, right: 0,
              top: `${(i + 1) * 12}%`, height: 1,
              background: "rgba(0,0,0,0.05)",
            }} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`v${i}`} style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${(i + 1) * 16}%`, width: 1,
              background: "rgba(0,0,0,0.05)",
            }} />
          ))}

          {[
            { name: "Gudele", x: "25%", y: "18%" },
            { name: "Kator", x: "55%", y: "25%" },
            { name: "Juba", x: "50%", y: "50%", bold: true },
            { name: "Lologo East", x: "60%", y: "65%", bold: true },
            { name: "Munuki", x: "30%", y: "42%" },
            { name: "Hai Jebel", x: "70%", y: "38%" },
          ].map(({ name, x, y, bold }) => (
            <span key={name} style={{
              position: "absolute", left: x, top: y,
              fontSize: bold ? 14 : 11, fontWeight: bold ? 700 : 400,
              color: bold ? COLORS.primaryDark : "#555", transform: "translate(-50%,-50%)",
            }}>
              {name}
            </span>
          ))}

          {HOUSEHOLDS.map((hhItem, i) => {
            const positions = [
              { x: "45%", y: "55%" }, { x: "55%", y: "60%" }, { x: "60%", y: "48%" },
              { x: "38%", y: "65%" }, { x: "52%", y: "72%" }, { x: "48%", y: "42%" },
            ];
            const pos = positions[i] || { x: "50%", y: "50%" };
            const isSelected = selectedHH === i;
            return (
              <div key={hhItem.id} onClick={() => setSelectedHH(i)} style={{
                position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%,-50%)",
                cursor: "pointer", zIndex: isSelected ? 10 : 1,
              }}>
                <div style={{
                  width: isSelected ? 44 : 36, height: isSelected ? 44 : 36,
                  borderRadius: isSelected ? 22 : 18,
                  background: COLORS.card, boxShadow: isSelected ? COLORS.shadowLg : COLORS.shadow,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `${isSelected ? 3 : 2}px solid ${hhItem.visitStatus === "visited" ? COLORS.primary : "#E65100"}`,
                  transition: "all 0.2s",
                }}>
                  <HomeIcon size={isSelected ? 20 : 16} color={hhItem.visitStatus === "visited" ? COLORS.primary : "#E65100"} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          position: "absolute", right: 12, top: 12, display: "flex",
          flexDirection: "column", gap: 8,
        }}>
          <button style={{
            width: 40, height: 40, borderRadius: 8, background: COLORS.card,
            border: "none", boxShadow: COLORS.shadow, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plus size={18} color={COLORS.text} />
          </button>
          <button style={{
            width: 40, height: 40, borderRadius: 8, background: COLORS.card,
            border: "none", boxShadow: COLORS.shadow, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: COLORS.text, fontWeight: 300,
          }}>
            −
          </button>
        </div>

        <button style={{
          position: "absolute", bottom: 16, right: 16,
          width: 52, height: 52, borderRadius: 26,
          background: COLORS.primary, color: "#fff", border: "none",
          boxShadow: COLORS.shadowLg, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MapPin size={22} />
        </button>

        {/* Bottom household card (dynamic) */}
        <div style={{
          position: "absolute", bottom: 16, left: 16, right: 80,
          background: COLORS.card, borderRadius: 12, padding: "12px 14px",
          boxShadow: COLORS.shadow, display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: COLORS.primaryLight, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <HomeIcon size={20} color={COLORS.primary} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.primary }}>
              {hh.head}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              {hh.id} • {hh.members} members
            </div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
              Last visit: {hh.lastVisit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Analytics ───────────────────────────────────────────

function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState("monthly");
  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="Analytics" />

      <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto" }}>
        {[
          { id: "monthly", label: "Monthly Summary" },
          { id: "disease", label: "Disease Trends" },
          { id: "coverage", label: "Coverage" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 20,
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: activeTab === id ? COLORS.primaryLight : "#F0F4F8",
            color: activeTab === id ? COLORS.primary : COLORS.textSecondary,
            transition: "all 0.2s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Monthly Summary */}
      {activeTab === "monthly" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: 16,
            boxShadow: COLORS.shadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <BarChart3 size={18} color={COLORS.primary} />
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                Records by Type (Last 6 Months)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MONTHLY_RECORDS}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="month" fontSize={11} tick={{ fill: COLORS.textSecondary }} />
                <YAxis fontSize={11} tick={{ fill: COLORS.textSecondary }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="births" stackId="a" fill="#0D47A1" name="Births" />
                <Bar dataKey="deaths" stackId="a" fill="#1565C0" name="Deaths" />
                <Bar dataKey="malaria" stackId="a" fill="#1976D2" name="Malaria" />
                <Bar dataKey="anc" stackId="a" fill="#1E88E5" name="ANC" />
                <Bar dataKey="immunization" stackId="a" fill="#2196F3" name="Immunization" />
                <Bar dataKey="household" stackId="a" fill="#64B5F6" name="Household" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: 16,
            boxShadow: COLORS.shadow, marginTop: 16, overflowX: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <FileText size={18} color={COLORS.primary} />
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>This Month</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Births", value: MONTHLY_RECORDS[5].births, color: "#0D47A1" },
                { label: "Deaths", value: MONTHLY_RECORDS[5].deaths, color: "#1565C0" },
                { label: "Malaria Cases", value: MONTHLY_RECORDS[5].malaria, color: "#1976D2" },
                { label: "ANC Visits", value: MONTHLY_RECORDS[5].anc, color: "#1E88E5" },
                { label: "Immunizations", value: MONTHLY_RECORDS[5].immunization, color: "#2196F3" },
                { label: "Household Visits", value: MONTHLY_RECORDS[5].household, color: "#64B5F6" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, background: `${color}08`, border: `1px solid ${color}20`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, background: color,
                  }} />
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disease Trends */}
      {activeTab === "disease" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: 16,
            boxShadow: COLORS.shadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Activity size={18} color={COLORS.primary} />
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                Disease Trends (Last 6 Months)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={DISEASE_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="month" fontSize={11} tick={{ fill: COLORS.textSecondary }} />
                <YAxis fontSize={11} tick={{ fill: COLORS.textSecondary }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="malaria" stroke="#0D47A1" strokeWidth={2} name="Malaria" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diarrhea" stroke="#1976D2" strokeWidth={2} name="Diarrhea" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pneumonia" stroke="#2196F3" strokeWidth={2} name="Pneumonia" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="malnutrition" stroke="#64B5F6" strokeWidth={2} name="Malnutrition" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Coverage */}
      {activeTab === "coverage" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: 16,
            boxShadow: COLORS.shadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Shield size={18} color={COLORS.primary} />
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                Coverage vs Targets
              </span>
            </div>
            {COVERAGE_DATA.map(({ label, value, target }) => {
              const pct = Math.round((value / target) * 100);
              return (
                <div key={label} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>{label}</span>
                    <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      {value}% <span style={{ fontSize: 11 }}>/ {target}% target</span>
                    </span>
                  </div>
                  <div style={{
                    width: "100%", height: 10, background: "#F0F4F8",
                    borderRadius: 5, overflow: "hidden", position: "relative",
                  }}>
                    {/* Target marker */}
                    <div style={{
                      position: "absolute", left: `${target}%`, top: 0, bottom: 0,
                      width: 2, background: "#0D47A1", zIndex: 2, opacity: 0.4,
                    }} />
                    <div style={{
                      width: `${value}%`, height: "100%", borderRadius: 5,
                      background: value >= target
                        ? "linear-gradient(90deg, #1565C0, #1976D2)"
                        : value >= target * 0.7
                          ? "linear-gradient(90deg, #1E88E5, #42A5F5)"
                          : "linear-gradient(90deg, #64B5F6, #90CAF9)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
                    {pct >= 100 ? "Target met" : `${100 - pct}% to target`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Settings ────────────────────────────────────────────

function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState("30 min");
  const [showSync, setShowSync] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "dhis2" | null>(null);

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="Settings" />

      <div style={{ padding: 16 }}>
        {/* Worker Profile Card */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: 16,
          boxShadow: COLORS.shadow, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: COLORS.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: COLORS.primary,
            }}>
              {WORKER_PROFILE.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{WORKER_PROFILE.name}</div>
              <div style={{ fontSize: 13, color: COLORS.primary, fontWeight: 500 }}>{WORKER_PROFILE.role}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{WORKER_PROFILE.id}</div>
            </div>
          </div>
          {[
            { label: "Phone", value: WORKER_PROFILE.phone },
            { label: "Boma", value: WORKER_PROFILE.boma },
            { label: "Payam", value: WORKER_PROFILE.payam },
            { label: "County", value: WORKER_PROFILE.county },
            { label: "State", value: WORKER_PROFILE.state },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", padding: "8px 0",
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Assigned Area */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: 16,
          boxShadow: COLORS.shadow, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Assigned Area</h3>
          {[
            { label: "Total Households", value: WORKER_PROFILE.households.toString() },
            { label: "Catchment Population", value: WORKER_PROFILE.catchment },
            { label: "Registered Patients", value: PATIENTS.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", padding: "8px 0",
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Sync Settings */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: 16,
          boxShadow: COLORS.shadow, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Sync Settings</h3>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Last Sync</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>10 min ago</span>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Auto-Sync</span>
            <button onClick={() => setAutoSync(!autoSync)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              {autoSync
                ? <ToggleRight size={28} color={COLORS.primary} />
                : <ToggleLeft size={28} color={COLORS.textSecondary} />
              }
            </button>
          </div>

          {autoSync && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Sync Frequency</span>
              <div style={{ display: "flex", gap: 6 }}>
                {["15 min", "30 min", "1 hr"].map((f) => (
                  <button key={f} onClick={() => setSyncFrequency(f)} style={{
                    padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500,
                    border: syncFrequency === f ? `1.5px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    background: syncFrequency === f ? COLORS.primaryLight : COLORS.card,
                    color: syncFrequency === f ? COLORS.primary : COLORS.textSecondary,
                    cursor: "pointer",
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setShowSync(true)} style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: COLORS.primary, color: "#fff", border: "none",
            fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <RefreshCw size={16} />
            Sync Now
          </button>
        </div>

        {/* Data Export */}
        <div style={{
          background: COLORS.card, borderRadius: 14, padding: 16,
          boxShadow: COLORS.shadow,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Data Export</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setExportType("csv")} style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: `1.5px solid ${COLORS.border}`, background: COLORS.card,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}>
              <Download size={20} color={COLORS.primary} />
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>Export CSV</span>
            </button>
            <button onClick={() => setExportType("dhis2")} style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: `1.5px solid ${COLORS.border}`, background: COLORS.card,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}>
              <RefreshCw size={20} color={COLORS.primary} />
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>Push to DHIS2</span>
            </button>
          </div>
        </div>
      </div>

      {showSync && <SyncAnimation onClose={() => setShowSync(false)} />}
      {exportType && <ExportDialog type={exportType} onClose={() => setExportType(null)} />}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────

export default function BomaHealthApp() {
  const [screen, setScreen] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [activeFormType, setActiveFormType] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>(INITIAL_REFERRALS);
  const [chatOpen, setChatOpen] = useState(false);

  const navigate = (s: string) => {
    setScreen(s);
    setSelectedPatient(null);
    setActiveFormType(null);
  };

  const handleQuickAction = (type: string) => {
    setActiveFormType(type);
  };

  const handleFormClose = () => {
    setActiveFormType(null);
  };

  const handleAddReferral = (r: ReferralRecord) => {
    setReferrals(prev => [r, ...prev]);
  };

  const cssAnimations = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #E0E8EF; margin: 0; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes progressBar { from { width: 0; } to { width: 100%; } }
    ::-webkit-scrollbar { width: 0; }
    input::placeholder, textarea::placeholder { color: #90A4AE; }
    select { cursor: pointer; }
  `;

  // If a form is active, show full-screen form (no bottom nav)
  if (activeFormType) {
    return (
      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: COLORS.bg, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        position: "relative", overflow: "hidden",
        boxShadow: "0 0 60px rgba(0,0,0,0.1)",
      }}>
        <style>{cssAnimations}</style>
        <DataEntryForm formType={activeFormType} onClose={handleFormClose} />
      </div>
    );
  }

  const currentScreen = selectedPatient ? "detail" : screen;

  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: COLORS.bg, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      position: "relative", overflow: "hidden",
      boxShadow: "0 0 60px rgba(0,0,0,0.1)",
    }}>
      <style>{cssAnimations}</style>

      {/* Status bar sim */}
      <div style={{
        background: "linear-gradient(135deg, #0A3D8F 0%, #0D47A1 100%)",
        padding: "4px 16px", display: "flex", justifyContent: "flex-end",
        alignItems: "center", gap: 6, fontSize: 12, color: "#fff",
      }}>
        <Wifi size={12} />
        <span style={{ fontWeight: 500 }}>12:30</span>
      </div>

      {currentScreen === "home" && (
        <HomeScreen onQuickAction={handleQuickAction} onNavigate={navigate} referrals={referrals} />
      )}
      {currentScreen === "records" && (
        <RecordsScreen onSelectPatient={(p) => setSelectedPatient(p)} onQuickAction={handleQuickAction} />
      )}
      {currentScreen === "detail" && selectedPatient && (
        <PatientDetailScreen
          patient={selectedPatient}
          onBack={() => setSelectedPatient(null)}
          onAddReferral={handleAddReferral}
        />
      )}
      {currentScreen === "map" && <MapScreen />}
      {currentScreen === "analytics" && <AnalyticsScreen />}
      {currentScreen === "settings" && <SettingsScreen />}

      {/* Floating Chat Button */}
      {!chatOpen && currentScreen !== "detail" && (
        <button onClick={() => setChatOpen(true)} style={{
          position: "fixed", bottom: 76, right: 16, width: 52, height: 52,
          borderRadius: 26, background: COLORS.primary, color: "#fff",
          border: "none", cursor: "pointer", boxShadow: COLORS.shadowLg,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 90,
        }}>
          <MessageCircle size={24} />
        </button>
      )}

      {/* Medical Assistant Chat */}
      <MedicalAssistantChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <BottomNav active={screen} onNavigate={navigate} />
    </div>
  );
}
