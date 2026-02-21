import { hashPassword } from './auth';
import {
  usersDB, patientsDB, hospitalsDB, referralsDB,
  diseaseAlertsDB, labResultsDB, prescriptionsDB, medicalRecordsDB,
  messagesDB, birthsDB, deathsDB, facilityAssessmentsDB,
  immunizationsDB, ancDB, bomaVisitsDB, followUpsDB,
  organizationsDB,
  isSeeded, markSeeded, resetAllDatabases
} from './db';
import {
  hospitals, patients, referrals, diseaseAlerts,
  generateMedicalRecords
} from '@/data/mock';
import type {
  UserDoc, PatientDoc, HospitalDoc, ReferralDoc,
  DiseaseAlertDoc, LabResultDoc, PrescriptionDoc, MedicalRecordDoc, MessageDoc,
  BirthRegistrationDoc, DeathRegistrationDoc, FacilityAssessmentDoc,
  ImmunizationDoc, ANCVisitDoc, BomaVisitDoc, FollowUpDoc, OrganizationDoc
} from './db-types';

// Default org IDs
const PUBLIC_ORG_ID = 'org-moh-ss';
const PRIVATE_ORG_ID = 'org-mercy-hospital';

const defaultOrganizations: Omit<OrganizationDoc, '_rev'>[] = [
  {
    _id: PUBLIC_ORG_ID,
    type: 'organization',
    name: 'Republic of South Sudan - MoH',
    slug: 'moh-ss',
    primaryColor: '#078930',
    secondaryColor: '#0F47AF',
    accentColor: '#2B6FE0',
    subscriptionStatus: 'active',
    subscriptionPlan: 'enterprise',
    maxUsers: 1000,
    maxHospitals: 200,
    featureFlags: { epidemicIntelligence: true, mchAnalytics: true, dhis2Export: true, aiClinicalSupport: true, communityHealth: true, facilityAssessments: true },
    orgType: 'public',
    contactEmail: 'admin@moh.gov.ss',
    country: 'South Sudan',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    _id: PRIVATE_ORG_ID,
    type: 'organization',
    name: 'Mercy Hospital Group',
    slug: 'mercy-hospital',
    primaryColor: '#7C3AED',
    secondaryColor: '#4F46E5',
    accentColor: '#A78BFA',
    subscriptionStatus: 'active',
    subscriptionPlan: 'professional',
    maxUsers: 50,
    maxHospitals: 5,
    featureFlags: { epidemicIntelligence: false, mchAnalytics: true, dhis2Export: false, aiClinicalSupport: true, communityHealth: false, facilityAssessments: false },
    orgType: 'private',
    contactEmail: 'admin@mercyhospital.org',
    country: 'South Sudan',
    isActive: true,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

const defaultUsers = [
  // Platform super admin (no org)
  { username: 'superadmin', password: 'Super@Taban2026!', name: 'Taban Platform Admin', role: 'super_admin' as const, hospitalId: undefined, hospitalName: undefined, orgId: undefined },
  // Public org users (government MoH)
  { username: 'admin', password: 'TabanGov#2026!Ss', name: 'Ministry of Health', role: 'government' as const, hospitalId: undefined, hospitalName: undefined, orgId: PUBLIC_ORG_ID },
  { username: 'dr.wani', password: 'Dr.Wani@JTH2026', name: 'Dr. James Wani Igga', role: 'doctor' as const, hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'dr.achol', password: 'Dr.Achol@JTH2026', name: 'Dr. Achol Mayen Deng', role: 'doctor' as const, hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'co.deng', password: 'CO.Deng@WTH2026', name: 'CO Deng Mabior Kuol', role: 'clinical_officer' as const, hospitalId: 'hosp-002', hospitalName: 'Wau State Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'nurse.stella', password: 'Nurse.Stella@MTH2026', name: 'Nurse Stella Keji Lemi', role: 'nurse' as const, hospitalId: 'hosp-003', hospitalName: 'Malakal Teaching Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'lab.gatluak', password: 'Lab.Gat@BSH2026', name: 'Lab Tech Gatluak Puok', role: 'lab_tech' as const, hospitalId: 'hosp-004', hospitalName: 'Bentiu State Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'pharma.rose', password: 'Pharma.Rose@JTH2026', name: 'Pharmacist Rose Gbudue', role: 'pharmacist' as const, hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'desk.amira', password: 'Desk.Amira@JTH2026', name: 'Amira Juma Hassan', role: 'front_desk' as const, hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', orgId: PUBLIC_ORG_ID },
  { username: 'bhw.akol', password: 'BHW.Akol@KJ2026', name: 'Akol Deng Mading', role: 'boma_health_worker' as const, hospitalId: 'phcu-001', hospitalName: 'Kajo-keji Boma PHCU', orgId: PUBLIC_ORG_ID },
  { username: 'sup.mary', password: 'Sup.Mary@KJ2026', name: 'Mary Lado Kenyi', role: 'payam_supervisor' as const, hospitalId: 'phcc-001', hospitalName: 'Kajo-keji PHCC', orgId: PUBLIC_ORG_ID },
  // Private org admin (Mercy Hospital Group)
  { username: 'org.admin', password: 'OrgAdmin@Mercy2026', name: 'Mercy Org Administrator', role: 'org_admin' as const, hospitalId: undefined, hospitalName: undefined, orgId: PRIVATE_ORG_ID },
  { username: 'dr.mercy', password: 'Dr.Mercy@2026!', name: 'Dr. Grace Lado', role: 'doctor' as const, hospitalId: 'hosp-mercy-001', hospitalName: 'Mercy General Hospital', orgId: PRIVATE_ORG_ID },
];

const labOrders: Omit<LabResultDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'lab-001', type: 'lab_result', patientId: 'pat-00001', patientName: 'Deng Mabior Garang', hospitalNumber: 'JTH-000001', testName: 'Malaria RDT', specimen: 'Blood', status: 'completed', result: 'Positive (P. falciparum)', unit: '', referenceRange: 'Negative', abnormal: true, critical: false, orderedBy: 'Dr. James Wani Igga', orderedAt: '2026-02-09 08:30', completedAt: '2026-02-09 09:15', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T08:30:00Z', updatedAt: '2026-02-09T09:15:00Z' },
  { _id: 'lab-002', type: 'lab_result', patientId: 'pat-00005', patientName: 'Nyamal Koang Gatdet', hospitalNumber: 'JTH-000005', testName: 'Full Blood Count', specimen: 'Blood (EDTA)', status: 'completed', result: 'Hb 7.2 g/dL, WBC 14.3\u00d710\u00b3/\u03bcL', unit: '', referenceRange: '', abnormal: true, critical: false, orderedBy: 'Dr. Achol Mayen Deng', orderedAt: '2026-02-09 07:45', completedAt: '2026-02-09 10:30', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T07:45:00Z', updatedAt: '2026-02-09T10:30:00Z' },
  { _id: 'lab-003', type: 'lab_result', patientId: 'pat-00012', patientName: 'Gatluak Ruot Nyuon', hospitalNumber: 'JTH-000012', testName: 'CD4 Count', specimen: 'Blood (EDTA)', status: 'in_progress', result: '', unit: '', referenceRange: '500-1500 cells/\u03bcL', abnormal: false, critical: false, orderedBy: 'Dr. Taban Ladu Soro', orderedAt: '2026-02-09 09:00', completedAt: '', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T09:00:00Z', updatedAt: '2026-02-09T09:00:00Z' },
  { _id: 'lab-004', type: 'lab_result', patientId: 'pat-00018', patientName: 'Rose Tombura Gbudue', hospitalNumber: 'JTH-000018', testName: 'Blood Glucose (Fasting)', specimen: 'Blood', status: 'completed', result: '198 mg/dL', unit: 'mg/dL', referenceRange: '70-100', abnormal: true, critical: false, orderedBy: 'CO Deng Mabior Kuol', orderedAt: '2026-02-09 06:30', completedAt: '2026-02-09 07:00', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T06:30:00Z', updatedAt: '2026-02-09T07:00:00Z' },
  { _id: 'lab-005', type: 'lab_result', patientId: 'pat-00022', patientName: 'Kuol Akot Ajith', hospitalNumber: 'JTH-000022', testName: 'Hemoglobin', specimen: 'Blood', status: 'completed', result: '4.2 g/dL', unit: 'g/dL', referenceRange: '12.0-16.0', abnormal: true, critical: true, orderedBy: 'Dr. Nyamal Koang Jal', orderedAt: '2026-02-09 10:00', completedAt: '2026-02-09 10:45', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T10:00:00Z', updatedAt: '2026-02-09T10:45:00Z' },
  { _id: 'lab-006', type: 'lab_result', patientId: 'pat-00030', patientName: 'Achol Mayen Ring', hospitalNumber: 'JTH-000030', testName: 'Liver Function Tests', specimen: 'Blood', status: 'pending', result: '', unit: '', referenceRange: '', abnormal: false, critical: false, orderedBy: 'Dr. James Wani Igga', orderedAt: '2026-02-09 11:00', completedAt: '', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T11:00:00Z', updatedAt: '2026-02-09T11:00:00Z' },
  { _id: 'lab-007', type: 'lab_result', patientId: 'pat-00035', patientName: 'Ladu Tombe Keji', hospitalNumber: 'JTH-000035', testName: 'HIV Rapid Test', specimen: 'Blood', status: 'completed', result: 'Non-reactive', unit: '', referenceRange: 'Non-reactive', abnormal: false, critical: false, orderedBy: 'CO Stella Keji Lemi', orderedAt: '2026-02-09 08:00', completedAt: '2026-02-09 08:30', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T08:00:00Z', updatedAt: '2026-02-09T08:30:00Z' },
  { _id: 'lab-008', type: 'lab_result', patientId: 'pat-00040', patientName: 'Majok Chol Wol', hospitalNumber: 'JTH-000040', testName: 'Urinalysis', specimen: 'Urine', status: 'in_progress', result: '', unit: '', referenceRange: 'Normal', abnormal: false, critical: false, orderedBy: 'Dr. Rose Gbudue', orderedAt: '2026-02-09 09:30', completedAt: '', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T09:30:00Z', updatedAt: '2026-02-09T09:30:00Z' },
  { _id: 'lab-009', type: 'lab_result', patientId: 'pat-00008', patientName: 'Ayen Dut Malual', hospitalNumber: 'JTH-000008', testName: 'Sputum AFB', specimen: 'Sputum', status: 'pending', result: '', unit: '', referenceRange: 'Negative', abnormal: false, critical: false, orderedBy: 'Dr. Gatluak Puok Riek', orderedAt: '2026-02-09 11:30', completedAt: '', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T11:30:00Z', updatedAt: '2026-02-09T11:30:00Z' },
  { _id: 'lab-010', type: 'lab_result', patientId: 'pat-00015', patientName: 'Tut Chuol Both', hospitalNumber: 'JTH-000015', testName: 'Renal Function', specimen: 'Blood', status: 'completed', result: 'Creatinine 1.8 mg/dL, BUN 45 mg/dL', unit: '', referenceRange: 'Cr 0.6-1.2, BUN 7-20', abnormal: true, critical: false, orderedBy: 'Dr. Achol Mayen Deng', orderedAt: '2026-02-08 14:00', completedAt: '2026-02-08 16:30', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-08T14:00:00Z', updatedAt: '2026-02-08T16:30:00Z' },
];

const prescriptionQueue: Omit<PrescriptionDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'rx-001', type: 'prescription', patientId: 'pat-00001', patientName: 'Deng Mabior Garang', medication: 'Artemether-Lumefantrine (Coartem)', dose: '80/480mg BD x 3 days', route: 'Oral', frequency: 'BD', duration: '3 days', prescribedBy: 'Dr. James Wani Igga', status: 'pending', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T09:15:00Z', updatedAt: '2026-02-09T09:15:00Z' },
  { _id: 'rx-002', type: 'prescription', patientId: 'pat-00005', patientName: 'Nyamal Koang Gatdet', medication: 'Ferrous Sulfate + Folic Acid', dose: '200mg OD x 30 days', route: 'Oral', frequency: 'OD', duration: '30 days', prescribedBy: 'Dr. Achol Mayen Deng', status: 'pending', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T09:30:00Z', updatedAt: '2026-02-09T09:30:00Z' },
  { _id: 'rx-003', type: 'prescription', patientId: 'pat-00012', patientName: 'Gatluak Ruot Nyuon', medication: 'TDF/3TC/DTG', dose: '300/300/50mg OD x 90 days', route: 'Oral', frequency: 'OD', duration: '90 days', prescribedBy: 'Dr. Taban Ladu Soro', status: 'dispensed', dispensedAt: '2026-02-09T10:30:00Z', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T10:00:00Z', updatedAt: '2026-02-09T10:30:00Z' },
  { _id: 'rx-004', type: 'prescription', patientId: 'pat-00018', patientName: 'Rose Tombura Gbudue', medication: 'Metformin', dose: '500mg BD x 30 days', route: 'Oral', frequency: 'BD', duration: '30 days', prescribedBy: 'CO Deng Mabior Kuol', status: 'pending', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T10:15:00Z', updatedAt: '2026-02-09T10:15:00Z' },
  { _id: 'rx-005', type: 'prescription', patientId: 'pat-00022', patientName: 'Kuol Akot Ajith', medication: 'Paracetamol', dose: '1g QDS PRN x 5 days', route: 'Oral', frequency: 'QDS PRN', duration: '5 days', prescribedBy: 'Dr. Nyamal Koang Jal', status: 'dispensed', dispensedAt: '2026-02-09T11:00:00Z', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T10:45:00Z', updatedAt: '2026-02-09T11:00:00Z' },
  { _id: 'rx-006', type: 'prescription', patientId: 'pat-00030', patientName: 'Achol Mayen Ring', medication: 'Amoxicillin', dose: '500mg TDS x 7 days', route: 'Oral', frequency: 'TDS', duration: '7 days', prescribedBy: 'Dr. James Wani Igga', status: 'pending', hospitalId: 'hosp-001', hospitalName: 'Juba Teaching Hospital', createdAt: '2026-02-09T11:00:00Z', updatedAt: '2026-02-09T11:00:00Z' },
];

const seedMessages: Omit<MessageDoc, '_rev' | 'createdBy'>[] = [
  {
    _id: 'msg-001', type: 'message', patientId: 'pat-00001', patientName: 'Deng Mabior Garang', patientPhone: '+211-912-345-678',
    fromDoctorId: 'user-dr.wani', fromDoctorName: 'Dr. James Wani Igga', fromHospitalName: 'Juba Teaching Hospital',
    subject: 'Medication Reminder', body: 'Please remember to take your Coartem medication with food. Come back on 16 Feb for follow-up.',
    channel: 'both', status: 'delivered', sentAt: '2026-02-09T10:30:00Z', createdAt: '2026-02-09T10:30:00Z', updatedAt: '2026-02-09T10:30:00Z',
  },
  {
    _id: 'msg-002', type: 'message', patientId: 'pat-00005', patientName: 'Nyamal Koang Gatdet', patientPhone: '+211-912-555-005',
    fromDoctorId: 'user-dr.achol', fromDoctorName: 'Dr. Achol Mayen Deng', fromHospitalName: 'Juba Teaching Hospital',
    subject: 'Lab Results Ready', body: 'Your lab results are ready. Please visit the hospital to discuss them with your doctor.',
    channel: 'app', status: 'sent', sentAt: '2026-02-09T11:00:00Z', createdAt: '2026-02-09T11:00:00Z', updatedAt: '2026-02-09T11:00:00Z',
  },
  {
    _id: 'msg-003', type: 'message', patientId: 'pat-00012', patientName: 'Gatluak Ruot Nyuon', patientPhone: '+211-912-555-012',
    fromDoctorId: 'user-dr.wani', fromDoctorName: 'Dr. James Wani Igga', fromHospitalName: 'Juba Teaching Hospital',
    subject: 'Follow-up Appointment', body: 'Please come for your follow-up appointment on 20 Feb. Bring your medication card.',
    channel: 'sms', status: 'delivered', sentAt: '2026-02-08T14:00:00Z', createdAt: '2026-02-08T14:00:00Z', updatedAt: '2026-02-08T14:00:00Z',
  },
  {
    _id: 'msg-004', type: 'message', patientId: 'pat-00018', patientName: 'Rose Tombura Gbudue', patientPhone: '+211-912-555-018',
    fromDoctorId: 'user-dr.achol', fromDoctorName: 'Dr. Achol Mayen Deng', fromHospitalName: 'Juba Teaching Hospital',
    subject: 'Medicine Ready', body: 'Your medicine is ready at the pharmacy. Please collect it today before 5 PM.',
    channel: 'both', status: 'sent', sentAt: '2026-02-09T09:00:00Z', createdAt: '2026-02-09T09:00:00Z', updatedAt: '2026-02-09T09:00:00Z',
  },
];

const seedBirths: Omit<BirthRegistrationDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'birth-001', type: 'birth', childFirstName: 'Akon', childSurname: 'Deng', childGender: 'Female', dateOfBirth: '2026-02-08', placeOfBirth: 'Juba Teaching Hospital', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', motherName: 'Achol Mayen Garang', motherAge: 24, motherNationality: 'South Sudanese', fatherName: 'Deng Mabior Garang', fatherNationality: 'South Sudanese', birthWeight: 3200, birthType: 'single', deliveryType: 'normal', attendedBy: 'Midwife', registeredBy: 'Dr. James Wani Igga', state: 'Central Equatoria', county: 'Juba', certificateNumber: 'CE-B-2026-0001', childPatientId: 'pat-00051', motherPatientId: 'pat-00057', createdAt: '2026-02-08T06:30:00Z', updatedAt: '2026-02-08T06:30:00Z' },
  { _id: 'birth-002', type: 'birth', childFirstName: 'Kuol', childSurname: 'Majok', childGender: 'Male', dateOfBirth: '2026-02-07', placeOfBirth: 'Juba Teaching Hospital', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', motherName: 'Nyandeng Chol Wol', motherAge: 28, motherNationality: 'South Sudanese', fatherName: 'Majok Chol Wol', fatherNationality: 'South Sudanese', birthWeight: 2900, birthType: 'single', deliveryType: 'caesarean', attendedBy: 'Doctor', registeredBy: 'Dr. Achol Mayen Deng', state: 'Central Equatoria', county: 'Juba', certificateNumber: 'CE-B-2026-0002', childPatientId: 'pat-00052', motherPatientId: 'pat-00062', createdAt: '2026-02-07T14:00:00Z', updatedAt: '2026-02-07T14:00:00Z' },
  { _id: 'birth-003', type: 'birth', childFirstName: 'Nyamal', childSurname: 'Gatluak', childGender: 'Female', dateOfBirth: '2026-02-06', placeOfBirth: 'Bentiu State Hospital', facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', motherName: 'Nyakuoth Koang Jal', motherAge: 20, motherNationality: 'South Sudanese', fatherName: 'Gatluak Ruot Puok', fatherNationality: 'South Sudanese', birthWeight: 2600, birthType: 'single', deliveryType: 'normal', attendedBy: 'Midwife', registeredBy: 'CO Deng Mabior Kuol', state: 'Unity', county: 'Rubkona', certificateNumber: 'UN-B-2026-0001', childPatientId: 'pat-00053', motherPatientId: 'pat-00058', createdAt: '2026-02-06T08:00:00Z', updatedAt: '2026-02-06T08:00:00Z' },
  { _id: 'birth-004', type: 'birth', childFirstName: 'Lual', childSurname: 'Taban', childGender: 'Male', dateOfBirth: '2026-02-05', placeOfBirth: 'Wau State Hospital', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', motherName: 'Abuk Deng Mading', motherAge: 32, motherNationality: 'South Sudanese', fatherName: 'Taban Ladu Soro', fatherNationality: 'South Sudanese', birthWeight: 3500, birthType: 'twin', deliveryType: 'normal', attendedBy: 'Doctor', registeredBy: 'CO Deng Mabior Kuol', state: 'Western Bahr el Ghazal', county: 'Wau', certificateNumber: 'WB-B-2026-0001', childPatientId: 'pat-00054', motherPatientId: 'pat-00059', createdAt: '2026-02-05T10:00:00Z', updatedAt: '2026-02-05T10:00:00Z' },
  { _id: 'birth-005', type: 'birth', childFirstName: 'Achol', childSurname: 'Dut', childGender: 'Female', dateOfBirth: '2026-01-28', placeOfBirth: 'Malakal Teaching Hospital', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', motherName: 'Nyandit Dut Malual', motherAge: 26, motherNationality: 'South Sudanese', fatherName: 'Dut Malual Ring', fatherNationality: 'South Sudanese', birthWeight: 3100, birthType: 'single', deliveryType: 'assisted', attendedBy: 'Midwife', registeredBy: 'Nurse Stella Keji Lemi', state: 'Upper Nile', county: 'Malakal', certificateNumber: 'UN-B-2026-0002', childPatientId: 'pat-00055', motherPatientId: 'pat-00060', createdAt: '2026-01-28T12:00:00Z', updatedAt: '2026-01-28T12:00:00Z' },
  { _id: 'birth-006', type: 'birth', childFirstName: 'Garang', childSurname: 'Makuei', childGender: 'Male', dateOfBirth: '2026-01-20', placeOfBirth: 'Bor State Hospital', facilityId: 'hosp-005', facilityName: 'Bor State Hospital', motherName: 'Awut Makuei Lual', motherAge: 22, motherNationality: 'South Sudanese', fatherName: 'Makuei Lual Garang', fatherNationality: 'South Sudanese', birthWeight: 3000, birthType: 'single', deliveryType: 'normal', attendedBy: 'TBA', registeredBy: 'Dr. James Wani Igga', state: 'Jonglei', county: 'Bor South', certificateNumber: 'JG-B-2026-0001', childPatientId: 'pat-00056', motherPatientId: 'pat-00061', createdAt: '2026-01-20T09:00:00Z', updatedAt: '2026-01-20T09:00:00Z' },
];

const seedDeaths: Omit<DeathRegistrationDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'death-001', type: 'death', deceasedFirstName: 'Akol', deceasedSurname: 'Garang', deceasedGender: 'Male', dateOfBirth: '1958-05-10', dateOfDeath: '2026-02-07', ageAtDeath: 67, placeOfDeath: 'Juba Teaching Hospital', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', immediateCause: 'Cerebrovascular accident (Stroke)', immediateICD11: 'BA01', antecedentCause1: 'Hypertensive heart disease', antecedentICD11_1: 'BA80', antecedentCause2: '', antecedentICD11_2: '', underlyingCause: 'Hypertensive heart disease', underlyingICD11: 'BA80', contributingConditions: 'Diabetes mellitus', contributingICD11: 'DB90', mannerOfDeath: 'natural', maternalDeath: false, pregnancyRelated: false, certifiedBy: 'Dr. James Wani Igga', certifierRole: 'Physician', state: 'Central Equatoria', county: 'Juba', certificateNumber: 'CE-D-2026-0001', deathNotified: true, deathRegistered: true, createdAt: '2026-02-07T18:00:00Z', updatedAt: '2026-02-07T18:00:00Z' },
  { _id: 'death-002', type: 'death', deceasedFirstName: 'Nyakuoth', deceasedSurname: 'Gatdet', deceasedGender: 'Female', dateOfBirth: '1995-08-15', dateOfDeath: '2026-02-06', ageAtDeath: 30, placeOfDeath: 'Bentiu State Hospital', facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', immediateCause: 'Postpartum haemorrhage', immediateICD11: 'JA00', antecedentCause1: 'Obstructed labour', antecedentICD11_1: 'JA06', antecedentCause2: '', antecedentICD11_2: '', underlyingCause: 'Maternal death due to haemorrhage', underlyingICD11: 'JA00', contributingConditions: 'Anaemia', contributingICD11: '5A00', mannerOfDeath: 'natural', maternalDeath: true, pregnancyRelated: true, certifiedBy: 'CO Deng Mabior Kuol', certifierRole: 'Clinical Officer', state: 'Unity', county: 'Rubkona', certificateNumber: 'UN-D-2026-0001', deathNotified: true, deathRegistered: false, createdAt: '2026-02-06T22:00:00Z', updatedAt: '2026-02-06T22:00:00Z' },
  { _id: 'death-003', type: 'death', deceasedFirstName: 'Baby', deceasedSurname: 'Tut', deceasedGender: 'Male', dateOfBirth: '2026-02-04', dateOfDeath: '2026-02-05', ageAtDeath: 0, placeOfDeath: 'Malakal Teaching Hospital', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', immediateCause: 'Neonatal sepsis', immediateICD11: 'KA00', antecedentCause1: 'Neonatal prematurity', antecedentICD11_1: 'KA02', antecedentCause2: 'Low birth weight', antecedentICD11_2: 'KA03', underlyingCause: 'Neonatal prematurity', underlyingICD11: 'KA02', contributingConditions: '', contributingICD11: '', mannerOfDeath: 'natural', maternalDeath: false, pregnancyRelated: false, certifiedBy: 'Nurse Stella Keji Lemi', certifierRole: 'Nurse', state: 'Upper Nile', county: 'Malakal', certificateNumber: 'UN-D-2026-0002', deathNotified: true, deathRegistered: true, createdAt: '2026-02-05T04:00:00Z', updatedAt: '2026-02-05T04:00:00Z' },
  { _id: 'death-004', type: 'death', deceasedFirstName: 'Alier', deceasedSurname: 'Deng', deceasedGender: 'Male', dateOfBirth: '2022-06-20', dateOfDeath: '2026-02-03', ageAtDeath: 3, placeOfDeath: 'Wau State Hospital', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', immediateCause: 'Severe malaria with cerebral involvement', immediateICD11: '1A40', antecedentCause1: 'Malnutrition', antecedentICD11_1: '5B70', antecedentCause2: '', antecedentICD11_2: '', underlyingCause: 'Malaria due to Plasmodium falciparum', underlyingICD11: '1A40', contributingConditions: 'Malnutrition', contributingICD11: '5B70', mannerOfDeath: 'natural', maternalDeath: false, pregnancyRelated: false, certifiedBy: 'CO Deng Mabior Kuol', certifierRole: 'Clinical Officer', state: 'Western Bahr el Ghazal', county: 'Wau', certificateNumber: 'WB-D-2026-0001', deathNotified: true, deathRegistered: true, createdAt: '2026-02-03T16:00:00Z', updatedAt: '2026-02-03T16:00:00Z' },
  { _id: 'death-005', type: 'death', deceasedFirstName: 'Chol', deceasedSurname: 'Mading', deceasedGender: 'Male', dateOfBirth: '1980-01-01', dateOfDeath: '2026-01-25', ageAtDeath: 46, placeOfDeath: 'Bor State Hospital', facilityId: 'hosp-005', facilityName: 'Bor State Hospital', immediateCause: 'Respiratory failure', immediateICD11: 'CA40', antecedentCause1: 'Tuberculosis of lung', antecedentICD11_1: '1B10', antecedentCause2: 'HIV disease', antecedentICD11_2: '1C60', underlyingCause: 'HIV disease resulting in TB', underlyingICD11: '1C60', contributingConditions: '', contributingICD11: '', mannerOfDeath: 'natural', maternalDeath: false, pregnancyRelated: false, certifiedBy: 'Dr. James Wani Igga', certifierRole: 'Physician', state: 'Jonglei', county: 'Bor South', certificateNumber: 'JG-D-2026-0001', deathNotified: false, deathRegistered: false, createdAt: '2026-01-25T20:00:00Z', updatedAt: '2026-01-25T20:00:00Z' },
];

const seedFacilityAssessments: Omit<FacilityAssessmentDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'assess-001', type: 'facility_assessment', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', assessmentDate: '2026-01-15', assessedBy: 'Ministry of Health Team', generalEquipmentScore: 78, diagnosticCapacityScore: 72, essentialMedicinesScore: 65, infectionControlScore: 70, hasCleanWater: true, hasSanitation: true, hasWasteManagement: true, hasEmergencyTransport: true, hasCommunication: true, powerReliabilityScore: 75, staffingScore: 68, hisStaffCount: 4, hisStaffTrained: 3, hasPatientRegisters: true, hasDHIS2Reporting: true, reportingCompleteness: 82, reportingTimeliness: 75, dataQualityScore: 70, overallScore: 72, state: 'Central Equatoria', recommendations: 'Improve essential medicines supply chain. Train additional HIS staff.', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { _id: 'assess-002', type: 'facility_assessment', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', assessmentDate: '2026-01-16', assessedBy: 'Ministry of Health Team', generalEquipmentScore: 55, diagnosticCapacityScore: 48, essentialMedicinesScore: 42, infectionControlScore: 50, hasCleanWater: true, hasSanitation: true, hasWasteManagement: false, hasEmergencyTransport: true, hasCommunication: true, powerReliabilityScore: 45, staffingScore: 52, hisStaffCount: 2, hisStaffTrained: 1, hasPatientRegisters: true, hasDHIS2Reporting: true, reportingCompleteness: 68, reportingTimeliness: 60, dataQualityScore: 55, overallScore: 54, state: 'Western Bahr el Ghazal', recommendations: 'Urgent need for waste management system. Power backup needed. Train HIS staff on DHIS2.', createdAt: '2026-01-16T10:00:00Z', updatedAt: '2026-01-16T10:00:00Z' },
  { _id: 'assess-003', type: 'facility_assessment', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', assessmentDate: '2026-01-17', assessedBy: 'WHO Assessment Team', generalEquipmentScore: 62, diagnosticCapacityScore: 58, essentialMedicinesScore: 50, infectionControlScore: 55, hasCleanWater: false, hasSanitation: true, hasWasteManagement: false, hasEmergencyTransport: false, hasCommunication: true, powerReliabilityScore: 35, staffingScore: 45, hisStaffCount: 1, hisStaffTrained: 1, hasPatientRegisters: true, hasDHIS2Reporting: true, reportingCompleteness: 57, reportingTimeliness: 50, dataQualityScore: 48, overallScore: 50, state: 'Upper Nile', recommendations: 'Critical: need clean water supply. Ambulance needed. Generator maintenance required.', createdAt: '2026-01-17T10:00:00Z', updatedAt: '2026-01-17T10:00:00Z' },
  { _id: 'assess-004', type: 'facility_assessment', facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', assessmentDate: '2026-01-18', assessedBy: 'WHO Assessment Team', generalEquipmentScore: 40, diagnosticCapacityScore: 35, essentialMedicinesScore: 30, infectionControlScore: 38, hasCleanWater: false, hasSanitation: false, hasWasteManagement: false, hasEmergencyTransport: false, hasCommunication: false, powerReliabilityScore: 20, staffingScore: 35, hisStaffCount: 1, hisStaffTrained: 0, hasPatientRegisters: true, hasDHIS2Reporting: false, reportingCompleteness: 35, reportingTimeliness: 28, dataQualityScore: 30, overallScore: 33, state: 'Unity', recommendations: 'Facility requires comprehensive rehabilitation. No DHIS2 access. Multiple infrastructure gaps.', createdAt: '2026-01-18T10:00:00Z', updatedAt: '2026-01-18T10:00:00Z' },
  { _id: 'assess-005', type: 'facility_assessment', facilityId: 'hosp-005', facilityName: 'Bor State Hospital', assessmentDate: '2026-01-19', assessedBy: 'Ministry of Health Team', generalEquipmentScore: 50, diagnosticCapacityScore: 45, essentialMedicinesScore: 40, infectionControlScore: 48, hasCleanWater: true, hasSanitation: true, hasWasteManagement: false, hasEmergencyTransport: true, hasCommunication: true, powerReliabilityScore: 40, staffingScore: 48, hisStaffCount: 2, hisStaffTrained: 1, hasPatientRegisters: true, hasDHIS2Reporting: true, reportingCompleteness: 62, reportingTimeliness: 55, dataQualityScore: 52, overallScore: 49, state: 'Jonglei', recommendations: 'Improve diagnostic capacity. Waste management system needed. Additional medicines procurement.', createdAt: '2026-01-19T10:00:00Z', updatedAt: '2026-01-19T10:00:00Z' },
  { _id: 'assess-006', type: 'facility_assessment', facilityId: 'hosp-006', facilityName: 'Aweil State Hospital', assessmentDate: '2026-01-20', assessedBy: 'WHO Assessment Team', generalEquipmentScore: 38, diagnosticCapacityScore: 30, essentialMedicinesScore: 28, infectionControlScore: 35, hasCleanWater: false, hasSanitation: false, hasWasteManagement: false, hasEmergencyTransport: false, hasCommunication: false, powerReliabilityScore: 15, staffingScore: 30, hisStaffCount: 0, hisStaffTrained: 0, hasPatientRegisters: true, hasDHIS2Reporting: false, reportingCompleteness: 25, reportingTimeliness: 20, dataQualityScore: 22, overallScore: 28, state: 'Northern Bahr el Ghazal', recommendations: 'Critical infrastructure deficits. No HIS staff. No DHIS2. Needs immediate investment.', createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z' },
];

const seedImmunizations: Omit<ImmunizationDoc, '_rev' | 'createdBy'>[] = [
  // Child 1: Akon Deng (birth-001) — good coverage
  { _id: 'imm-001', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'BCG', doseNumber: 1, dateGiven: '2025-06-15', nextDueDate: '2025-08-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'BCG-2025-JTH-044', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2025-06-15T08:00:00Z', updatedAt: '2025-06-15T08:00:00Z' },
  { _id: 'imm-002', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'OPV', doseNumber: 0, dateGiven: '2025-06-15', nextDueDate: '2025-08-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'OPV-2025-JTH-112', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-06-15T08:05:00Z', updatedAt: '2025-06-15T08:05:00Z' },
  { _id: 'imm-003', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'Penta', doseNumber: 1, dateGiven: '2025-08-15', nextDueDate: '2025-09-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Dr. James Wani Igga', batchNumber: 'PEN-2025-JTH-078', site: 'right thigh', adverseReaction: false, status: 'completed', createdAt: '2025-08-15T09:00:00Z', updatedAt: '2025-08-15T09:00:00Z' },
  { _id: 'imm-004', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'PCV', doseNumber: 1, dateGiven: '2025-08-15', nextDueDate: '2025-09-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Dr. James Wani Igga', batchNumber: 'PCV-2025-JTH-033', site: 'left thigh', adverseReaction: false, status: 'completed', createdAt: '2025-08-15T09:05:00Z', updatedAt: '2025-08-15T09:05:00Z' },
  { _id: 'imm-005', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'Rota', doseNumber: 1, dateGiven: '2025-08-15', nextDueDate: '2025-09-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Dr. James Wani Igga', batchNumber: 'ROT-2025-JTH-019', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-08-15T09:10:00Z', updatedAt: '2025-08-15T09:10:00Z' },
  { _id: 'imm-006', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'Penta', doseNumber: 2, dateGiven: '2025-09-15', nextDueDate: '2025-10-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'PEN-2025-JTH-095', site: 'right thigh', adverseReaction: false, status: 'completed', createdAt: '2025-09-15T10:00:00Z', updatedAt: '2025-09-15T10:00:00Z' },
  { _id: 'imm-007', type: 'immunization', patientId: 'pat-00051', patientName: 'Akon Deng', gender: 'Female', dateOfBirth: '2025-06-15', vaccine: 'Measles', doseNumber: 1, dateGiven: '', nextDueDate: '2026-03-15', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: '', batchNumber: '', site: 'left arm', adverseReaction: false, status: 'scheduled', createdAt: '2025-06-15T08:00:00Z', updatedAt: '2025-06-15T08:00:00Z' },

  // Child 2: Kuol Majok (birth-002) — partial coverage, some overdue
  { _id: 'imm-008', type: 'immunization', patientId: 'pat-00052', patientName: 'Kuol Majok', gender: 'Male', dateOfBirth: '2025-05-10', vaccine: 'BCG', doseNumber: 1, dateGiven: '2025-05-10', nextDueDate: '2025-07-10', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Dr. Achol Mayen Deng', batchNumber: 'BCG-2025-JTH-038', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-10T09:00:00Z' },
  { _id: 'imm-009', type: 'immunization', patientId: 'pat-00052', patientName: 'Kuol Majok', gender: 'Male', dateOfBirth: '2025-05-10', vaccine: 'OPV', doseNumber: 0, dateGiven: '2025-05-10', nextDueDate: '2025-07-10', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Dr. Achol Mayen Deng', batchNumber: 'OPV-2025-JTH-098', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-05-10T09:05:00Z', updatedAt: '2025-05-10T09:05:00Z' },
  { _id: 'imm-010', type: 'immunization', patientId: 'pat-00052', patientName: 'Kuol Majok', gender: 'Male', dateOfBirth: '2025-05-10', vaccine: 'Penta', doseNumber: 1, dateGiven: '2025-07-10', nextDueDate: '2025-08-10', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'PEN-2025-JTH-064', site: 'right thigh', adverseReaction: true, adverseReactionDetails: 'Mild fever and swelling at injection site', status: 'completed', createdAt: '2025-07-10T10:00:00Z', updatedAt: '2025-07-10T10:00:00Z' },
  { _id: 'imm-011', type: 'immunization', patientId: 'pat-00052', patientName: 'Kuol Majok', gender: 'Male', dateOfBirth: '2025-05-10', vaccine: 'Penta', doseNumber: 2, dateGiven: '', nextDueDate: '2025-08-10', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: '', batchNumber: '', site: 'right thigh', adverseReaction: false, status: 'overdue', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-10T09:00:00Z' },
  { _id: 'imm-012', type: 'immunization', patientId: 'pat-00052', patientName: 'Kuol Majok', gender: 'Male', dateOfBirth: '2025-05-10', vaccine: 'Measles', doseNumber: 1, dateGiven: '', nextDueDate: '2026-02-10', facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', administeredBy: '', batchNumber: '', site: 'left arm', adverseReaction: false, status: 'overdue', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-10T09:00:00Z' },

  // Child 3: Nyamal Gatluak (birth-003) — Bentiu, low coverage
  { _id: 'imm-013', type: 'immunization', patientId: 'pat-00053', patientName: 'Nyamal Gatluak', gender: 'Female', dateOfBirth: '2025-08-20', vaccine: 'BCG', doseNumber: 1, dateGiven: '2025-08-20', nextDueDate: '2025-10-20', facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', state: 'Unity', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'BCG-2025-BSH-011', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2025-08-20T07:30:00Z', updatedAt: '2025-08-20T07:30:00Z' },
  { _id: 'imm-014', type: 'immunization', patientId: 'pat-00053', patientName: 'Nyamal Gatluak', gender: 'Female', dateOfBirth: '2025-08-20', vaccine: 'OPV', doseNumber: 0, dateGiven: '2025-08-20', nextDueDate: '2025-10-20', facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', state: 'Unity', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'OPV-2025-BSH-022', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-08-20T07:35:00Z', updatedAt: '2025-08-20T07:35:00Z' },
  { _id: 'imm-015', type: 'immunization', patientId: 'pat-00053', patientName: 'Nyamal Gatluak', gender: 'Female', dateOfBirth: '2025-08-20', vaccine: 'Penta', doseNumber: 1, dateGiven: '', nextDueDate: '2025-10-20', facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', state: 'Unity', administeredBy: '', batchNumber: '', site: 'right thigh', adverseReaction: false, status: 'overdue', createdAt: '2025-08-20T07:30:00Z', updatedAt: '2025-08-20T07:30:00Z' },

  // Child 4: Lual Taban (birth-004) — Wau, good coverage
  { _id: 'imm-016', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'BCG', doseNumber: 1, dateGiven: '2025-04-01', nextDueDate: '2025-06-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'BCG-2025-WSH-007', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2025-04-01T08:00:00Z', updatedAt: '2025-04-01T08:00:00Z' },
  { _id: 'imm-017', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'OPV', doseNumber: 0, dateGiven: '2025-04-01', nextDueDate: '2025-06-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'OPV-2025-WSH-014', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-04-01T08:05:00Z', updatedAt: '2025-04-01T08:05:00Z' },
  { _id: 'imm-018', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'Penta', doseNumber: 1, dateGiven: '2025-06-01', nextDueDate: '2025-07-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'PEN-2025-WSH-022', site: 'right thigh', adverseReaction: false, status: 'completed', createdAt: '2025-06-01T09:00:00Z', updatedAt: '2025-06-01T09:00:00Z' },
  { _id: 'imm-019', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'Penta', doseNumber: 2, dateGiven: '2025-07-01', nextDueDate: '2025-08-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'PEN-2025-WSH-035', site: 'right thigh', adverseReaction: false, status: 'completed', createdAt: '2025-07-01T09:00:00Z', updatedAt: '2025-07-01T09:00:00Z' },
  { _id: 'imm-020', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'Penta', doseNumber: 3, dateGiven: '2025-08-01', nextDueDate: '2026-01-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'PEN-2025-WSH-048', site: 'right thigh', adverseReaction: false, status: 'completed', createdAt: '2025-08-01T09:00:00Z', updatedAt: '2025-08-01T09:00:00Z' },
  { _id: 'imm-021', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'Measles', doseNumber: 1, dateGiven: '2026-01-05', nextDueDate: '2026-07-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'MEA-2026-WSH-003', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { _id: 'imm-022', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'Yellow Fever', doseNumber: 1, dateGiven: '2026-01-05', nextDueDate: '', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'YF-2026-WSH-001', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2026-01-05T10:05:00Z', updatedAt: '2026-01-05T10:05:00Z' },

  // Child 5: Achol Dut (birth-005) — Malakal
  { _id: 'imm-023', type: 'immunization', patientId: 'pat-00055', patientName: 'Achol Dut', gender: 'Female', dateOfBirth: '2025-09-10', vaccine: 'BCG', doseNumber: 1, dateGiven: '2025-09-10', nextDueDate: '2025-11-10', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', state: 'Upper Nile', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'BCG-2025-MTH-019', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2025-09-10T11:00:00Z', updatedAt: '2025-09-10T11:00:00Z' },
  { _id: 'imm-024', type: 'immunization', patientId: 'pat-00055', patientName: 'Achol Dut', gender: 'Female', dateOfBirth: '2025-09-10', vaccine: 'OPV', doseNumber: 0, dateGiven: '2025-09-10', nextDueDate: '2025-11-10', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', state: 'Upper Nile', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'OPV-2025-MTH-031', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-09-10T11:05:00Z', updatedAt: '2025-09-10T11:05:00Z' },
  { _id: 'imm-025', type: 'immunization', patientId: 'pat-00055', patientName: 'Achol Dut', gender: 'Female', dateOfBirth: '2025-09-10', vaccine: 'Penta', doseNumber: 1, dateGiven: '2025-11-10', nextDueDate: '2025-12-10', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', state: 'Upper Nile', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'PEN-2025-MTH-041', site: 'right thigh', adverseReaction: false, status: 'completed', createdAt: '2025-11-10T09:00:00Z', updatedAt: '2025-11-10T09:00:00Z' },
  { _id: 'imm-026', type: 'immunization', patientId: 'pat-00055', patientName: 'Achol Dut', gender: 'Female', dateOfBirth: '2025-09-10', vaccine: 'PCV', doseNumber: 1, dateGiven: '2025-11-10', nextDueDate: '2025-12-10', facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', state: 'Upper Nile', administeredBy: 'Nurse Stella Keji Lemi', batchNumber: 'PCV-2025-MTH-015', site: 'left thigh', adverseReaction: false, status: 'completed', createdAt: '2025-11-10T09:05:00Z', updatedAt: '2025-11-10T09:05:00Z' },

  // Child 6: Garang Makuei (birth-006) — Bor, missed doses
  { _id: 'imm-027', type: 'immunization', patientId: 'pat-00056', patientName: 'Garang Makuei', gender: 'Male', dateOfBirth: '2025-07-01', vaccine: 'BCG', doseNumber: 1, dateGiven: '2025-07-03', nextDueDate: '2025-09-01', facilityId: 'hosp-005', facilityName: 'Bor State Hospital', state: 'Jonglei', administeredBy: 'Dr. James Wani Igga', batchNumber: 'BCG-2025-BSH-005', site: 'left arm', adverseReaction: false, status: 'completed', createdAt: '2025-07-03T08:00:00Z', updatedAt: '2025-07-03T08:00:00Z' },
  { _id: 'imm-028', type: 'immunization', patientId: 'pat-00056', patientName: 'Garang Makuei', gender: 'Male', dateOfBirth: '2025-07-01', vaccine: 'OPV', doseNumber: 1, dateGiven: '', nextDueDate: '2025-09-01', facilityId: 'hosp-005', facilityName: 'Bor State Hospital', state: 'Jonglei', administeredBy: '', batchNumber: '', site: 'oral', adverseReaction: false, status: 'missed', createdAt: '2025-07-03T08:00:00Z', updatedAt: '2025-07-03T08:00:00Z' },
  { _id: 'imm-029', type: 'immunization', patientId: 'pat-00056', patientName: 'Garang Makuei', gender: 'Male', dateOfBirth: '2025-07-01', vaccine: 'Penta', doseNumber: 1, dateGiven: '', nextDueDate: '2025-09-01', facilityId: 'hosp-005', facilityName: 'Bor State Hospital', state: 'Jonglei', administeredBy: '', batchNumber: '', site: 'right thigh', adverseReaction: false, status: 'missed', createdAt: '2025-07-03T08:00:00Z', updatedAt: '2025-07-03T08:00:00Z' },

  // Child 7: Vitamin A supplementation
  { _id: 'imm-030', type: 'immunization', patientId: 'pat-00054', patientName: 'Lual Taban', gender: 'Male', dateOfBirth: '2025-04-01', vaccine: 'Vitamin A', doseNumber: 1, dateGiven: '2025-10-01', nextDueDate: '2026-04-01', facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', administeredBy: 'CO Deng Mabior Kuol', batchNumber: 'VA-2025-WSH-010', site: 'oral', adverseReaction: false, status: 'completed', createdAt: '2025-10-01T08:00:00Z', updatedAt: '2025-10-01T08:00:00Z' },
];

const seedANCVisits: Omit<ANCVisitDoc, '_rev' | 'createdBy'>[] = [
  // Mother 1: Achol Mayen Garang — high risk, multiple visits
  { _id: 'anc-001', type: 'anc_visit', motherId: 'pat-00057', motherName: 'Achol Mayen Garang', motherAge: 24, gravida: 2, parity: 1, visitNumber: 1, visitDate: '2025-10-15', gestationalAge: 12, facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', bloodPressure: '110/70', weight: 58, fundalHeight: 12, fetalHeartRate: 150, hemoglobin: 11.2, urineProtein: 'Negative', bloodGroup: 'O', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Negative', ironFolateGiven: true, tetanusVaccine: true, iptpDose: 0, riskFactors: [], riskLevel: 'low', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Family vehicle', bloodDonor: 'Husband' }, nextVisitDate: '2025-11-15', notes: 'First ANC visit. Normal findings.', attendedBy: 'Dr. Achol Mayen Deng', attendedByRole: 'Doctor', createdAt: '2025-10-15T09:00:00Z', updatedAt: '2025-10-15T09:00:00Z' },
  { _id: 'anc-002', type: 'anc_visit', motherId: 'pat-00057', motherName: 'Achol Mayen Garang', motherAge: 24, gravida: 2, parity: 1, visitNumber: 2, visitDate: '2025-11-15', gestationalAge: 16, facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', bloodPressure: '118/72', weight: 60, fundalHeight: 16, fetalHeartRate: 148, hemoglobin: 10.8, urineProtein: 'Negative', bloodGroup: 'O', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 1, riskFactors: [], riskLevel: 'low', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Family vehicle', bloodDonor: 'Husband' }, nextVisitDate: '2025-12-20', notes: 'Normal progress. IPTp-1 given.', attendedBy: 'Dr. Achol Mayen Deng', attendedByRole: 'Doctor', createdAt: '2025-11-15T10:00:00Z', updatedAt: '2025-11-15T10:00:00Z' },
  { _id: 'anc-003', type: 'anc_visit', motherId: 'pat-00057', motherName: 'Achol Mayen Garang', motherAge: 24, gravida: 2, parity: 1, visitNumber: 3, visitDate: '2025-12-20', gestationalAge: 21, facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', bloodPressure: '120/75', weight: 62, fundalHeight: 21, fetalHeartRate: 145, hemoglobin: 10.5, urineProtein: 'Negative', bloodGroup: 'O', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 2, riskFactors: [], riskLevel: 'low', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Family vehicle', bloodDonor: 'Husband' }, nextVisitDate: '2026-01-20', notes: 'Growing well. IPTp-2 given.', attendedBy: 'Nurse Stella Keji Lemi', attendedByRole: 'Nurse', createdAt: '2025-12-20T11:00:00Z', updatedAt: '2025-12-20T11:00:00Z' },
  { _id: 'anc-004', type: 'anc_visit', motherId: 'pat-00057', motherName: 'Achol Mayen Garang', motherAge: 24, gravida: 2, parity: 1, visitNumber: 4, visitDate: '2026-01-20', gestationalAge: 26, facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', bloodPressure: '125/80', weight: 64, fundalHeight: 26, fetalHeartRate: 142, hemoglobin: 10.0, urineProtein: 'Trace', bloodGroup: 'O', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: true, iptpDose: 3, riskFactors: ['anemia'], riskLevel: 'moderate', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Family vehicle', bloodDonor: 'Husband' }, nextVisitDate: '2026-02-15', notes: 'Mild anemia noted. Increased iron supplementation. Monitor BP.', attendedBy: 'Dr. James Wani Igga', attendedByRole: 'Doctor', createdAt: '2026-01-20T09:00:00Z', updatedAt: '2026-01-20T09:00:00Z' },

  // Mother 2: Nyakuoth Koang Jal — high risk (hypertension + previous c-section)
  { _id: 'anc-005', type: 'anc_visit', motherId: 'pat-00058', motherName: 'Nyakuoth Koang Jal', motherAge: 30, gravida: 4, parity: 3, visitNumber: 1, visitDate: '2025-11-01', gestationalAge: 10, facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', state: 'Unity', bloodPressure: '140/90', weight: 72, fundalHeight: 10, fetalHeartRate: 155, hemoglobin: 9.8, urineProtein: '+', bloodGroup: 'A', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Positive', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: true, iptpDose: 0, riskFactors: ['hypertension', 'previous_csection', 'anemia'], riskLevel: 'high', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Ambulance referral', bloodDonor: 'Brother' }, nextVisitDate: '2025-11-15', notes: 'High-risk: hypertensive, previous C-section, anemia. Malaria treated. Referred for closer monitoring.', attendedBy: 'CO Deng Mabior Kuol', attendedByRole: 'Clinical Officer', createdAt: '2025-11-01T08:00:00Z', updatedAt: '2025-11-01T08:00:00Z' },
  { _id: 'anc-006', type: 'anc_visit', motherId: 'pat-00058', motherName: 'Nyakuoth Koang Jal', motherAge: 30, gravida: 4, parity: 3, visitNumber: 2, visitDate: '2025-11-15', gestationalAge: 12, facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', state: 'Unity', bloodPressure: '145/92', weight: 73, fundalHeight: 12, fetalHeartRate: 152, hemoglobin: 9.5, urineProtein: '+', bloodGroup: 'A', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 1, riskFactors: ['hypertension', 'previous_csection', 'anemia'], riskLevel: 'high', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Ambulance referral', bloodDonor: 'Brother' }, nextVisitDate: '2025-12-01', notes: 'BP still elevated. Methyldopa started. Plan delivery at JTH.', attendedBy: 'CO Deng Mabior Kuol', attendedByRole: 'Clinical Officer', createdAt: '2025-11-15T08:30:00Z', updatedAt: '2025-11-15T08:30:00Z' },

  // Mother 3: Abuk Deng Mading — Wau, moderate risk (multiple pregnancy)
  { _id: 'anc-007', type: 'anc_visit', motherId: 'pat-00059', motherName: 'Abuk Deng Mading', motherAge: 32, gravida: 5, parity: 4, visitNumber: 1, visitDate: '2025-09-20', gestationalAge: 8, facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', bloodPressure: '115/75', weight: 65, fundalHeight: 10, fetalHeartRate: 160, hemoglobin: 11.5, urineProtein: 'Negative', bloodGroup: 'B', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: true, iptpDose: 0, riskFactors: ['multiple_pregnancy'], riskLevel: 'moderate', birthPlan: { facility: 'Wau State Hospital', transport: 'Motorcycle ambulance', bloodDonor: 'Sister' }, nextVisitDate: '2025-10-20', notes: 'Twin pregnancy confirmed. Moderate risk. Monthly monitoring.', attendedBy: 'CO Deng Mabior Kuol', attendedByRole: 'Clinical Officer', createdAt: '2025-09-20T09:00:00Z', updatedAt: '2025-09-20T09:00:00Z' },
  { _id: 'anc-008', type: 'anc_visit', motherId: 'pat-00059', motherName: 'Abuk Deng Mading', motherAge: 32, gravida: 5, parity: 4, visitNumber: 2, visitDate: '2025-10-20', gestationalAge: 12, facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', bloodPressure: '118/78', weight: 67, fundalHeight: 14, fetalHeartRate: 158, hemoglobin: 11.0, urineProtein: 'Negative', bloodGroup: 'B', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 1, riskFactors: ['multiple_pregnancy'], riskLevel: 'moderate', birthPlan: { facility: 'Wau State Hospital', transport: 'Motorcycle ambulance', bloodDonor: 'Sister' }, nextVisitDate: '2025-11-20', notes: 'Twins growing normally. Continue monitoring.', attendedBy: 'CO Deng Mabior Kuol', attendedByRole: 'Clinical Officer', createdAt: '2025-10-20T10:00:00Z', updatedAt: '2025-10-20T10:00:00Z' },
  { _id: 'anc-009', type: 'anc_visit', motherId: 'pat-00059', motherName: 'Abuk Deng Mading', motherAge: 32, gravida: 5, parity: 4, visitNumber: 3, visitDate: '2025-11-20', gestationalAge: 16, facilityId: 'hosp-002', facilityName: 'Wau State Hospital', state: 'Western Bahr el Ghazal', bloodPressure: '122/80', weight: 70, fundalHeight: 20, fetalHeartRate: 155, hemoglobin: 10.8, urineProtein: 'Negative', bloodGroup: 'B', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 2, riskFactors: ['multiple_pregnancy'], riskLevel: 'moderate', birthPlan: { facility: 'Wau State Hospital', transport: 'Motorcycle ambulance', bloodDonor: 'Sister' }, nextVisitDate: '2025-12-20', notes: 'Good progress with twins. IPTp-2 given.', attendedBy: 'CO Deng Mabior Kuol', attendedByRole: 'Clinical Officer', createdAt: '2025-11-20T09:30:00Z', updatedAt: '2025-11-20T09:30:00Z' },

  // Mother 4: Nyandit Dut Malual — Malakal, low risk first ANC
  { _id: 'anc-010', type: 'anc_visit', motherId: 'pat-00060', motherName: 'Nyandit Dut Malual', motherAge: 26, gravida: 3, parity: 2, visitNumber: 1, visitDate: '2026-01-05', gestationalAge: 14, facilityId: 'hosp-003', facilityName: 'Malakal Teaching Hospital', state: 'Upper Nile', bloodPressure: '108/68', weight: 55, fundalHeight: 14, fetalHeartRate: 148, hemoglobin: 12.0, urineProtein: 'Negative', bloodGroup: 'O', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: true, iptpDose: 0, riskFactors: [], riskLevel: 'low', birthPlan: { facility: 'Malakal Teaching Hospital', transport: 'Walking', bloodDonor: 'Cousin' }, nextVisitDate: '2026-02-05', notes: 'Late first visit but normal findings. Counselled on regular attendance.', attendedBy: 'Nurse Stella Keji Lemi', attendedByRole: 'Nurse', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-01-05T08:00:00Z' },

  // Mother 5: Awut Makuei Lual — Bor, high risk (HIV positive)
  { _id: 'anc-011', type: 'anc_visit', motherId: 'pat-00061', motherName: 'Awut Makuei Lual', motherAge: 22, gravida: 1, parity: 0, visitNumber: 1, visitDate: '2025-12-10', gestationalAge: 16, facilityId: 'hosp-005', facilityName: 'Bor State Hospital', state: 'Jonglei', bloodPressure: '105/65', weight: 50, fundalHeight: 16, fetalHeartRate: 152, hemoglobin: 10.2, urineProtein: 'Negative', bloodGroup: 'AB', rhFactor: '-', hivStatus: 'Positive', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: true, iptpDose: 0, riskFactors: ['hiv_positive', 'rh_negative', 'primigravida'], riskLevel: 'high', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Referral ambulance', bloodDonor: 'Mother' }, nextVisitDate: '2025-12-24', notes: 'Primigravida. HIV positive — started on ART. Rh negative — Anti-D planned. High risk.', attendedBy: 'Dr. James Wani Igga', attendedByRole: 'Doctor', createdAt: '2025-12-10T10:00:00Z', updatedAt: '2025-12-10T10:00:00Z' },
  { _id: 'anc-012', type: 'anc_visit', motherId: 'pat-00061', motherName: 'Awut Makuei Lual', motherAge: 22, gravida: 1, parity: 0, visitNumber: 2, visitDate: '2025-12-24', gestationalAge: 18, facilityId: 'hosp-005', facilityName: 'Bor State Hospital', state: 'Jonglei', bloodPressure: '108/68', weight: 51, fundalHeight: 18, fetalHeartRate: 150, hemoglobin: 10.5, urineProtein: 'Negative', bloodGroup: 'AB', rhFactor: '-', hivStatus: 'Positive (on ART)', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 1, riskFactors: ['hiv_positive', 'rh_negative', 'primigravida'], riskLevel: 'high', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Referral ambulance', bloodDonor: 'Mother' }, nextVisitDate: '2026-01-14', notes: 'ART adherence good. Viral load sent. Anti-D given.', attendedBy: 'Dr. James Wani Igga', attendedByRole: 'Doctor', createdAt: '2025-12-24T09:00:00Z', updatedAt: '2025-12-24T09:00:00Z' },

  // Mother 6: Recent visit this month
  { _id: 'anc-013', type: 'anc_visit', motherId: 'pat-00062', motherName: 'Nyandeng Chol Wol', motherAge: 28, gravida: 3, parity: 2, visitNumber: 5, visitDate: '2026-02-05', gestationalAge: 32, facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', bloodPressure: '115/72', weight: 68, fundalHeight: 32, fetalHeartRate: 140, hemoglobin: 11.0, urineProtein: 'Negative', bloodGroup: 'A', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 3, riskFactors: [], riskLevel: 'low', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Family vehicle', bloodDonor: 'Husband' }, nextVisitDate: '2026-02-19', notes: 'ANC5 — good progress. Baby in cephalic presentation.', attendedBy: 'Dr. Achol Mayen Deng', attendedByRole: 'Doctor', createdAt: '2026-02-05T10:00:00Z', updatedAt: '2026-02-05T10:00:00Z' },
  { _id: 'anc-014', type: 'anc_visit', motherId: 'pat-00057', motherName: 'Achol Mayen Garang', motherAge: 24, gravida: 2, parity: 1, visitNumber: 5, visitDate: '2026-02-10', gestationalAge: 29, facilityId: 'hosp-001', facilityName: 'Juba Teaching Hospital', state: 'Central Equatoria', bloodPressure: '128/82', weight: 66, fundalHeight: 29, fetalHeartRate: 140, hemoglobin: 10.2, urineProtein: 'Trace', bloodGroup: 'O', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 3, riskFactors: ['anemia'], riskLevel: 'moderate', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Family vehicle', bloodDonor: 'Husband' }, nextVisitDate: '2026-02-24', notes: 'ANC5 — Monitor anemia. BP slightly elevated. Return in 2 weeks.', attendedBy: 'Dr. James Wani Igga', attendedByRole: 'Doctor', createdAt: '2026-02-10T09:00:00Z', updatedAt: '2026-02-10T09:00:00Z' },
  { _id: 'anc-015', type: 'anc_visit', motherId: 'pat-00058', motherName: 'Nyakuoth Koang Jal', motherAge: 30, gravida: 4, parity: 3, visitNumber: 3, visitDate: '2026-02-01', gestationalAge: 23, facilityId: 'hosp-004', facilityName: 'Bentiu State Hospital', state: 'Unity', bloodPressure: '148/95', weight: 75, fundalHeight: 23, fetalHeartRate: 148, hemoglobin: 9.2, urineProtein: '++', bloodGroup: 'A', rhFactor: '+', hivStatus: 'Negative', malariaTest: 'Negative', syphilisTest: 'Non-reactive', ironFolateGiven: true, tetanusVaccine: false, iptpDose: 2, riskFactors: ['hypertension', 'previous_csection', 'anemia', 'proteinuria'], riskLevel: 'high', birthPlan: { facility: 'Juba Teaching Hospital', transport: 'Ambulance referral', bloodDonor: 'Brother' }, nextVisitDate: '2026-02-15', notes: 'Pre-eclampsia developing. Urgent referral to JTH for closer monitoring.', attendedBy: 'CO Deng Mabior Kuol', attendedByRole: 'Clinical Officer', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-01T08:00:00Z' },
];

// Boma Health Worker visit seed data
const seedBomaVisits: Omit<BomaVisitDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'boma-visit-001', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1001', patientName: 'Ayen Dut Malual', patientAge: 34, patientGender: 'Female', visitDate: new Date().toISOString(), chiefComplaint: 'Malaria', suspectedCondition: 'Malaria', icd11Code: '1A42', action: 'treated', treatmentGiven: 'Coartem + Paracetamol', outcome: 'unknown', followUpRequired: true, nextFollowUp: new Date(Date.now() + 3 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'boma-visit-002', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1012', patientName: 'Ladu Tombe Keji', patientAge: 28, patientGender: 'Male', visitDate: new Date().toISOString(), chiefComplaint: 'Injury', suspectedCondition: 'Injury', action: 'referred', referredTo: 'Nearest PHCU', outcome: 'unknown', followUpRequired: true, nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'boma-visit-003', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1007', patientName: 'Rose Gbudue', patientAge: 25, patientGender: 'Female', visitDate: new Date().toISOString(), chiefComplaint: 'Pregnancy Issue', suspectedCondition: 'Pregnancy complication', action: 'referred', referredTo: 'Juba Teaching Hospital', outcome: 'unknown', followUpRequired: true, nextFollowUp: new Date(Date.now() + 1 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'boma-visit-004', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1019', patientName: 'Majok Chol Wol', patientAge: 5, patientGender: 'Male', visitDate: new Date().toISOString(), chiefComplaint: 'Diarrhea', suspectedCondition: 'Diarrhea', icd11Code: 'DA90', action: 'treated', treatmentGiven: 'ORS + Zinc', outcome: 'unknown', followUpRequired: true, nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'boma-visit-005', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1031', patientName: 'Gatluak Puok', patientAge: 42, patientGender: 'Male', visitDate: new Date().toISOString(), chiefComplaint: 'Malaria', suspectedCondition: 'Malaria', icd11Code: '1A42', action: 'treated', treatmentGiven: 'Coartem', outcome: 'unknown', followUpRequired: true, nextFollowUp: new Date(Date.now() + 3 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Older visits (previous days)
  { _id: 'boma-visit-006', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1003', patientName: 'Achol Deng', patientAge: 18, patientGender: 'Female', visitDate: new Date(Date.now() - 3 * 86400000).toISOString(), chiefComplaint: 'Malaria', suspectedCondition: 'Malaria', action: 'treated', treatmentGiven: 'Coartem', outcome: 'unknown', followUpRequired: true, state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { _id: 'boma-visit-007', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1015', patientName: 'Kuol Mabior', patientAge: 3, patientGender: 'Male', visitDate: new Date(Date.now() - 5 * 86400000).toISOString(), chiefComplaint: 'Diarrhea', suspectedCondition: 'Diarrhea', action: 'treated', treatmentGiven: 'ORS', outcome: 'unknown', followUpRequired: true, state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { _id: 'boma-visit-008', type: 'boma_visit', workerId: 'user-bhw.akol', workerName: 'Akol Deng Mading', assignedBoma: 'KJ', geocodeId: 'BOMA-KJ-HH1022', patientName: 'Nyamal Gatdet', patientAge: 2, patientGender: 'Female', visitDate: new Date(Date.now() - 7 * 86400000).toISOString(), chiefComplaint: 'Malnutrition', suspectedCondition: 'Malnutrition', icd11Code: '5B71', action: 'referred', referredTo: 'Nearest PHCU', outcome: 'unknown', followUpRequired: true, state: 'Central Equatoria', county: 'Kajo-keji', payam: 'Kajo-keji', boma: 'Kajo-keji', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
];

// Follow-up seed data (pending follow-ups for BHW)
const seedFollowUps: Omit<FollowUpDoc, '_rev' | 'createdBy'>[] = [
  { _id: 'followup-001', type: 'follow_up', patientId: 'BOMA-KJ-HH1003', patientName: 'Achol Deng', geocodeId: 'BOMA-KJ-HH1003', assignedWorker: 'user-bhw.akol', assignedWorkerName: 'Akol Deng Mading', status: 'active', condition: 'Malaria', facilityLevel: 'boma', scheduledDate: new Date(Date.now() - 1 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', sourceVisitId: 'boma-visit-006', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { _id: 'followup-002', type: 'follow_up', patientId: 'BOMA-KJ-HH1015', patientName: 'Kuol Mabior', geocodeId: 'BOMA-KJ-HH1015', assignedWorker: 'user-bhw.akol', assignedWorkerName: 'Akol Deng Mading', status: 'active', condition: 'Diarrhea', facilityLevel: 'boma', scheduledDate: new Date(Date.now() - 2 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', sourceVisitId: 'boma-visit-007', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { _id: 'followup-003', type: 'follow_up', patientId: 'BOMA-KJ-HH1022', patientName: 'Nyamal Gatdet', geocodeId: 'BOMA-KJ-HH1022', assignedWorker: 'user-bhw.akol', assignedWorkerName: 'Akol Deng Mading', status: 'active', condition: 'Malnutrition', facilityLevel: 'boma', scheduledDate: new Date(Date.now() - 4 * 86400000).toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', sourceVisitId: 'boma-visit-008', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { _id: 'followup-004', type: 'follow_up', patientId: 'BOMA-KJ-HH1008', patientName: 'Deng Deng', geocodeId: 'BOMA-KJ-HH1008', assignedWorker: 'user-bhw.akol', assignedWorkerName: 'Akol Deng Mading', status: 'active', condition: 'Pneumonia', facilityLevel: 'boma', scheduledDate: new Date().toISOString(), state: 'Central Equatoria', county: 'Kajo-keji', sourceVisitId: 'boma-visit-004', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

// Child patients linked to immunization records (fixing orphaned child-001..006 IDs)
const childPatients: (Partial<PatientDoc> & Record<string, unknown>)[] = [
  { _id: 'pat-00051', type: 'patient', firstName: 'Akon', middleName: '', surname: 'Deng', gender: 'Female', dateOfBirth: '2025-06-15', age: 0, phone: '', registrationHospital: 'hosp-001', registrationHospitalName: 'Juba Teaching Hospital', hospitalNumber: 'JTH-000051', state: 'Central Equatoria', county: 'Juba', payam: '', boma: '', geocodeId: '', createdAt: '2025-06-15T08:00:00Z', updatedAt: '2025-06-15T08:00:00Z' },
  { _id: 'pat-00052', type: 'patient', firstName: 'Kuol', middleName: '', surname: 'Majok', gender: 'Male', dateOfBirth: '2025-05-10', age: 0, phone: '', registrationHospital: 'hosp-001', registrationHospitalName: 'Juba Teaching Hospital', hospitalNumber: 'JTH-000052', state: 'Central Equatoria', county: 'Juba', payam: '', boma: '', geocodeId: '', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-10T09:00:00Z' },
  { _id: 'pat-00053', type: 'patient', firstName: 'Nyamal', middleName: '', surname: 'Gatluak', gender: 'Female', dateOfBirth: '2025-08-20', age: 0, phone: '', registrationHospital: 'hosp-004', registrationHospitalName: 'Bentiu State Hospital', hospitalNumber: 'BSH-000001', state: 'Unity', county: 'Rubkona', payam: '', boma: '', geocodeId: '', createdAt: '2025-08-20T07:30:00Z', updatedAt: '2025-08-20T07:30:00Z' },
  { _id: 'pat-00054', type: 'patient', firstName: 'Lual', middleName: '', surname: 'Taban', gender: 'Male', dateOfBirth: '2025-04-01', age: 1, phone: '', registrationHospital: 'hosp-002', registrationHospitalName: 'Wau State Hospital', hospitalNumber: 'WSH-000001', state: 'Western Bahr el Ghazal', county: 'Wau', payam: '', boma: '', geocodeId: '', createdAt: '2025-04-01T08:00:00Z', updatedAt: '2025-04-01T08:00:00Z' },
  { _id: 'pat-00055', type: 'patient', firstName: 'Achol', middleName: '', surname: 'Dut', gender: 'Female', dateOfBirth: '2025-09-10', age: 0, phone: '', registrationHospital: 'hosp-003', registrationHospitalName: 'Malakal Teaching Hospital', hospitalNumber: 'MTH-000001', state: 'Upper Nile', county: 'Malakal', payam: '', boma: '', geocodeId: '', createdAt: '2025-09-10T11:00:00Z', updatedAt: '2025-09-10T11:00:00Z' },
  { _id: 'pat-00056', type: 'patient', firstName: 'Garang', middleName: '', surname: 'Makuei', gender: 'Male', dateOfBirth: '2025-07-01', age: 0, phone: '', registrationHospital: 'hosp-005', registrationHospitalName: 'Bor State Hospital', hospitalNumber: 'BSH-000002', state: 'Jonglei', county: 'Bor South', payam: '', boma: '', geocodeId: '', createdAt: '2025-07-03T08:00:00Z', updatedAt: '2025-07-03T08:00:00Z' },
];

// Mother patients linked to ANC records (fixing orphaned mother-001..006 IDs)
const motherPatients: (Partial<PatientDoc> & Record<string, unknown>)[] = [
  { _id: 'pat-00057', type: 'patient', firstName: 'Achol', middleName: 'Mayen', surname: 'Garang', gender: 'Female', dateOfBirth: '2002-03-15', age: 24, phone: '+211-912-555-057', registrationHospital: 'hosp-001', registrationHospitalName: 'Juba Teaching Hospital', hospitalNumber: 'JTH-000057', state: 'Central Equatoria', county: 'Juba', payam: '', boma: '', geocodeId: '', createdAt: '2025-10-15T09:00:00Z', updatedAt: '2025-10-15T09:00:00Z' },
  { _id: 'pat-00058', type: 'patient', firstName: 'Nyakuoth', middleName: 'Koang', surname: 'Jal', gender: 'Female', dateOfBirth: '1996-01-20', age: 30, phone: '+211-912-555-058', registrationHospital: 'hosp-004', registrationHospitalName: 'Bentiu State Hospital', hospitalNumber: 'BSH-000003', state: 'Unity', county: 'Rubkona', payam: '', boma: '', geocodeId: '', createdAt: '2025-11-01T08:00:00Z', updatedAt: '2025-11-01T08:00:00Z' },
  { _id: 'pat-00059', type: 'patient', firstName: 'Abuk', middleName: 'Deng', surname: 'Mading', gender: 'Female', dateOfBirth: '1994-06-10', age: 32, phone: '+211-912-555-059', registrationHospital: 'hosp-002', registrationHospitalName: 'Wau State Hospital', hospitalNumber: 'WSH-000002', state: 'Western Bahr el Ghazal', county: 'Wau', payam: '', boma: '', geocodeId: '', createdAt: '2025-09-20T09:00:00Z', updatedAt: '2025-09-20T09:00:00Z' },
  { _id: 'pat-00060', type: 'patient', firstName: 'Nyandit', middleName: 'Dut', surname: 'Malual', gender: 'Female', dateOfBirth: '2000-08-05', age: 26, phone: '+211-912-555-060', registrationHospital: 'hosp-003', registrationHospitalName: 'Malakal Teaching Hospital', hospitalNumber: 'MTH-000002', state: 'Upper Nile', county: 'Malakal', payam: '', boma: '', geocodeId: '', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-01-05T08:00:00Z' },
  { _id: 'pat-00061', type: 'patient', firstName: 'Awut', middleName: 'Makuei', surname: 'Lual', gender: 'Female', dateOfBirth: '2004-04-12', age: 22, phone: '+211-912-555-061', registrationHospital: 'hosp-005', registrationHospitalName: 'Bor State Hospital', hospitalNumber: 'BSH-000004', state: 'Jonglei', county: 'Bor South', payam: '', boma: '', geocodeId: '', createdAt: '2025-12-10T10:00:00Z', updatedAt: '2025-12-10T10:00:00Z' },
  { _id: 'pat-00062', type: 'patient', firstName: 'Nyandeng', middleName: 'Chol', surname: 'Wol', gender: 'Female', dateOfBirth: '1998-11-25', age: 28, phone: '+211-912-555-062', registrationHospital: 'hosp-001', registrationHospitalName: 'Juba Teaching Hospital', hospitalNumber: 'JTH-000062', state: 'Central Equatoria', county: 'Juba', payam: '', boma: '', geocodeId: '', createdAt: '2025-08-01T10:00:00Z', updatedAt: '2025-08-01T10:00:00Z' },
];

// Helper: put a doc, silently skip if it already exists (409 conflict)
async function safePut(db: PouchDB.Database, doc: Record<string, unknown>): Promise<void> {
  try {
    await db.put(doc);
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e.status === 409) return; // Document already exists — skip
    throw err;
  }
}

export async function seedDatabase(): Promise<void> {
  if (await isSeeded()) return;

  // Stale or missing seed — wipe all databases and re-seed fresh
  await resetAllDatabases();

  const now = new Date().toISOString();

  // Seed organizations
  const orgDB = organizationsDB();
  for (const org of defaultOrganizations) {
    await safePut(orgDB, org as unknown as Record<string, unknown>);
  }

  // Seed users
  const db = usersDB();
  for (const u of defaultUsers) {
    const hash = await hashPassword(u.password);
    const doc: UserDoc = {
      _id: `user-${u.username}`,
      type: 'user',
      username: u.username,
      passwordHash: hash,
      name: u.name,
      role: u.role,
      hospitalId: u.hospitalId,
      hospitalName: u.hospitalName,
      orgId: u.orgId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await safePut(db, doc as unknown as Record<string, unknown>);
  }

  // Seed hospitals (all public org by default)
  const hDB = hospitalsDB();
  for (const h of hospitals) {
    const doc: HospitalDoc = {
      _id: h.id,
      type: 'hospital',
      facilityType: h.type,
      ...Object.fromEntries(Object.entries(h).filter(([k]) => k !== 'id' && k !== 'type')),
      orgId: PUBLIC_ORG_ID,
      createdAt: now,
      updatedAt: now,
    } as HospitalDoc;
    await safePut(hDB, doc as unknown as Record<string, unknown>);
  }

  // Seed private org hospital
  await safePut(hDB, {
    _id: 'hosp-mercy-001', type: 'hospital', facilityType: 'state_hospital',
    name: 'Mercy General Hospital', state: 'Central Equatoria', location: 'Juba',
    town: 'Juba', beds: 120, totalBeds: 120, icuBeds: 8, maternityBeds: 20,
    staff: 45, doctors: 12, nurses: 20, clinicalOfficers: 5, labTechs: 3, pharmacists: 2,
    specialists: [], services: ['Emergency', 'Outpatient', 'Inpatient', 'Laboratory', 'Pharmacy'],
    equipment: ['X-ray', 'Ultrasound'], ambulances: 1, hasBloodBank: false,
    syncStatus: 'online', lastSync: now, patientCount: 0, todayVisits: 0,
    operatingStatus: 'operational', orgId: PRIVATE_ORG_ID,
    createdAt: now, updatedAt: now,
  } as unknown as Record<string, unknown>);

  // Seed patients (all public org by default)
  const pDB = patientsDB();
  for (const p of patients) {
    const doc: PatientDoc = {
      _id: p.id,
      type: 'patient',
      ...Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'id')),
      orgId: PUBLIC_ORG_ID,
      createdAt: now,
      updatedAt: now,
    } as PatientDoc;
    await safePut(pDB, doc as unknown as Record<string, unknown>);
  }

  // Seed child patients (linked to immunization records)
  for (const child of childPatients) {
    await safePut(pDB, { ...child, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed mother patients (linked to ANC records)
  for (const mother of motherPatients) {
    await safePut(pDB, { ...mother, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed referrals (all public org)
  const rDB = referralsDB();
  for (const r of referrals) {
    const doc: ReferralDoc = {
      _id: r.id,
      type: 'referral',
      ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'id')),
      orgId: PUBLIC_ORG_ID,
      createdAt: now,
      updatedAt: now,
    } as ReferralDoc;
    await safePut(rDB, doc as unknown as Record<string, unknown>);
  }

  // Seed disease alerts (all public org)
  const daDB = diseaseAlertsDB();
  for (const a of diseaseAlerts) {
    const doc: DiseaseAlertDoc = {
      _id: a.id,
      type: 'disease_alert',
      ...Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'id')),
      createdAt: now,
      updatedAt: now,
    } as DiseaseAlertDoc;
    await safePut(daDB, doc as unknown as Record<string, unknown>);
  }

  // Seed lab results (all public org)
  const lDB = labResultsDB();
  for (const l of labOrders) {
    await safePut(lDB, { ...l, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed prescriptions (all public org)
  const rxDB = prescriptionsDB();
  for (const rx of prescriptionQueue) {
    await safePut(rxDB, { ...rx, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed some medical records for patients (all public org)
  const mrDB = medicalRecordsDB();
  for (const p of patients.slice(0, 15)) {
    const records = generateMedicalRecords(p.id, 3);
    for (const r of records) {
      const doc: MedicalRecordDoc = {
        _id: r.id,
        type: 'medical_record',
        ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'id')),
        orgId: PUBLIC_ORG_ID,
        createdAt: now,
        updatedAt: now,
      } as MedicalRecordDoc;
      await safePut(mrDB, doc as unknown as Record<string, unknown>);
    }
  }

  // Seed messages (all public org)
  const msgDB = messagesDB();
  for (const msg of seedMessages) {
    await safePut(msgDB, { ...msg, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed births (all public org)
  const bDB = birthsDB();
  for (const b of seedBirths) {
    await safePut(bDB, { ...b, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed deaths (all public org)
  const dDB = deathsDB();
  for (const d of seedDeaths) {
    await safePut(dDB, { ...d, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed facility assessments (all public org)
  const faDB = facilityAssessmentsDB();
  for (const fa of seedFacilityAssessments) {
    await safePut(faDB, { ...fa, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed immunizations (all public org)
  const immDB = immunizationsDB();
  for (const imm of seedImmunizations) {
    await safePut(immDB, { ...imm, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed ANC visits (all public org)
  const ancDatabase = ancDB();
  for (const anc of seedANCVisits) {
    await safePut(ancDatabase, { ...anc, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed boma visits (all public org)
  const bvDB = bomaVisitsDB();
  for (const bv of seedBomaVisits) {
    await safePut(bvDB, { ...bv, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  // Seed follow-ups (all public org)
  const fuDB = followUpsDB();
  for (const fu of seedFollowUps) {
    await safePut(fuDB, { ...fu, orgId: PUBLIC_ORG_ID } as unknown as Record<string, unknown>);
  }

  await markSeeded();
}
