import type { Hospital, Patient, Referral, DiseaseAlert, VitalSigns, Diagnosis, Prescription, LabResult, MedicalRecord, Attachment, TransferPackage } from '@/data/mock';

export interface BaseDoc {
  _id: string;
  _rev?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export type UserRole = 'super_admin' | 'org_admin' | 'doctor' | 'clinical_officer' | 'nurse' | 'lab_tech' | 'pharmacist' | 'front_desk' | 'government' | 'boma_health_worker' | 'payam_supervisor';

export interface UserDoc extends BaseDoc {
  type: 'user';
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  hospitalId?: string;
  hospitalName?: string;
  orgId?: string;
  isActive: boolean;
}

export interface PatientDoc extends BaseDoc, Omit<Patient, 'id'> {
  type: 'patient';
  orgId?: string;
}

export interface HospitalDoc extends BaseDoc, Omit<Hospital, 'id' | 'type'> {
  type: 'hospital';
  facilityType: Hospital['type'];
  facilityLevel?: FacilityLevel;  // boma | payam | county | state | national
  orgId?: string;
}

export interface MedicalRecordDoc extends BaseDoc, Omit<MedicalRecord, 'id'> {
  type: 'medical_record';
  orgId?: string;
}

export interface ReferralDoc extends BaseDoc, Omit<Referral, 'id'> {
  type: 'referral';
  orgId?: string;
}

export interface LabResultDoc extends BaseDoc {
  type: 'lab_result';
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  testName: string;
  specimen: string;
  status: 'pending' | 'in_progress' | 'completed';
  result: string;
  unit: string;
  referenceRange: string;
  abnormal: boolean;
  critical: boolean;
  orderedBy: string;
  orderedAt: string;
  completedAt: string;
  hospitalId?: string;
  hospitalName?: string;
  orgId?: string;
}

export interface DiseaseAlertDoc extends BaseDoc, Omit<DiseaseAlert, 'id'> {
  type: 'disease_alert';
}

export interface PrescriptionDoc extends BaseDoc {
  type: 'prescription';
  patientId: string;
  patientName: string;
  medication: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  status: 'pending' | 'dispensed';
  dispensedAt?: string;
  hospitalId?: string;
  hospitalName?: string;
  orgId?: string;
}

export interface AuditLogDoc extends BaseDoc {
  type: 'audit_log';
  action: string;
  userId?: string;
  username?: string;
  details: string;
  ip?: string;
  success: boolean;
  orgId?: string;
}

export interface MessageDoc extends BaseDoc {
  type: 'message';
  patientId: string;
  patientName: string;
  patientPhone: string;
  fromDoctorId: string;
  fromDoctorName: string;
  fromHospitalName: string;
  subject: string;
  body: string;
  channel: 'app' | 'sms' | 'both';
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
  orgId?: string;
}

// ===== Birth & Death Registration (CRVS) =====
export interface BirthRegistrationDoc extends BaseDoc {
  type: 'birth';
  childFirstName: string;
  childSurname: string;
  childGender: 'Male' | 'Female';
  dateOfBirth: string;
  placeOfBirth: string;
  facilityId: string;
  facilityName: string;
  motherName: string;
  motherAge: number;
  motherNationality: string;
  fatherName: string;
  fatherNationality: string;
  birthWeight: number; // grams
  birthType: 'single' | 'twin' | 'multiple';
  deliveryType: 'normal' | 'caesarean' | 'assisted';
  attendedBy: string; // doctor/midwife/TBA/none
  registeredBy: string;
  state: string;
  county: string;
  certificateNumber: string;
  childPatientId?: string;
  motherPatientId?: string;
  orgId?: string;
}

export interface DeathRegistrationDoc extends BaseDoc {
  type: 'death';
  deceasedFirstName: string;
  deceasedSurname: string;
  deceasedGender: 'Male' | 'Female';
  dateOfBirth: string;
  dateOfDeath: string;
  ageAtDeath: number;
  placeOfDeath: string;
  facilityId: string;
  facilityName: string;
  // ICD-11 Cause of Death (WHO Medical Certificate format)
  immediateCause: string;         // Line a: immediate cause
  immediateICD11: string;         // ICD-11 code
  antecedentCause1: string;       // Line b: due to
  antecedentICD11_1: string;
  antecedentCause2: string;       // Line c: due to
  antecedentICD11_2: string;
  underlyingCause: string;        // Line d: underlying cause
  underlyingICD11: string;
  contributingConditions: string;
  contributingICD11: string;
  mannerOfDeath: 'natural' | 'accident' | 'intentional_self_harm' | 'assault' | 'pending_investigation' | 'unknown';
  maternalDeath: boolean;
  pregnancyRelated: boolean;
  certifiedBy: string;
  certifierRole: string;
  state: string;
  county: string;
  certificateNumber: string;
  deathNotified: boolean;
  deathRegistered: boolean;
  patientId?: string;
  orgId?: string;
}

// ===== Health Facility Assessment =====
export interface FacilityAssessmentDoc extends BaseDoc {
  type: 'facility_assessment';
  facilityId: string;
  facilityName: string;
  assessmentDate: string;
  assessedBy: string;
  // Service readiness
  generalEquipmentScore: number;     // 0-100
  diagnosticCapacityScore: number;
  essentialMedicinesScore: number;
  infectionControlScore: number;
  // Infrastructure
  hasCleanWater: boolean;
  hasSanitation: boolean;
  hasWasteManagement: boolean;
  hasEmergencyTransport: boolean;
  hasCommunication: boolean;
  powerReliabilityScore: number;     // 0-100
  // Staffing adequacy
  staffingScore: number;             // 0-100
  hisStaffCount: number;
  hisStaffTrained: number;
  // Data management
  hasPatientRegisters: boolean;
  hasDHIS2Reporting: boolean;
  reportingCompleteness: number;     // 0-100
  reportingTimeliness: number;       // 0-100
  dataQualityScore: number;          // 0-100
  // Summary
  overallScore: number;              // 0-100
  state: string;
  recommendations: string;
  orgId?: string;
}

// ===== ICD-11 Common Codes Reference =====
export interface ICD11Code {
  code: string;
  title: string;
  chapter: string;
}

// ===== Immunization Tracker =====
export interface ImmunizationDoc extends BaseDoc {
  type: 'immunization';
  patientId: string;
  patientName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  vaccine: string; // BCG, OPV0-3, Penta1-3, PCV1-3, Rota1-2, Measles1-2, Yellow Fever, Vitamin A
  doseNumber: number;
  dateGiven: string;
  nextDueDate: string;
  facilityId: string;
  facilityName: string;
  state: string;
  administeredBy: string;
  batchNumber: string;
  site: 'left arm' | 'right arm' | 'left thigh' | 'right thigh' | 'oral';
  adverseReaction: boolean;
  adverseReactionDetails?: string;
  status: 'completed' | 'scheduled' | 'overdue' | 'missed';
  orgId?: string;
}

// ===== ANC (Antenatal Care) Module =====
export interface ANCVisitDoc extends BaseDoc {
  type: 'anc_visit';
  motherId: string;
  patientId?: string;
  motherName: string;
  motherAge: number;
  gravida: number;
  parity: number;
  visitNumber: number; // 1-8 (WHO recommends 8 contacts)
  visitDate: string;
  gestationalAge: number; // weeks
  facilityId: string;
  facilityName: string;
  state: string;
  bloodPressure: string;
  weight: number;
  fundalHeight: number;
  fetalHeartRate: number;
  hemoglobin: number;
  urineProtein: string;
  bloodGroup: string;
  rhFactor: string;
  hivStatus: string;
  malariaTest: string;
  syphilisTest: string;
  ironFolateGiven: boolean;
  tetanusVaccine: boolean;
  iptpDose: number;
  riskFactors: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  birthPlan: { facility: string; transport: string; bloodDonor: string };
  nextVisitDate: string;
  notes: string;
  attendedBy: string;
  attendedByRole: string;
  orgId?: string;
}

// ===== Boma Health Worker Visit (Community-Level Data Collection) =====
export interface BomaVisitDoc extends BaseDoc {
  type: 'boma_visit';
  workerId: string;              // BHW-{bomaCode}-{number}
  workerName: string;
  assignedBoma: string;          // Boma code
  // Patient identification
  geocodeId: string;             // BOMA-XY-HH1001
  patientId?: string;            // Optional link to facility patient record
  patientName: string;
  patientPhoto?: string;         // Base64 for photo-based ID in illiterate populations
  patientAge?: number;
  patientGender?: 'Male' | 'Female';
  // Simplified visit data (expert-recommended: "so simple a primary school child can do it")
  visitDate: string;
  chiefComplaint: string;
  suspectedCondition: string;    // Suspected diagnosis at community level
  icd11Code?: string;            // Optional ICD-11 for suspected condition
  // Binary action (expert: "treated OR referred")
  action: 'treated' | 'referred';
  referredTo?: string;           // Facility ID/name if referred
  treatmentGiven?: string;       // Brief description if treated
  // Outcome tracking (expert: "Did the patient get well or die?")
  outcome: 'recovered' | 'died' | 'follow_up' | 'unknown';
  followUpRequired: boolean;
  nextFollowUp?: string;
  // GPS for mapping
  gpsLatitude?: number;
  gpsLongitude?: number;
  // Remote Review (Expert: "The person can also go back remotely and look at those things that have been recorded")
  reviewStatus?: 'pending' | 'reviewed' | 'flagged';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  // Administrative
  state: string;
  county: string;
  payam: string;
  boma: string;
  orgId?: string;
}

// ===== Follow-Up Tracking =====
export interface FollowUpDoc extends BaseDoc {
  type: 'follow_up';
  patientId: string;
  patientName: string;
  geocodeId?: string;
  assignedWorker: string;        // Health worker responsible
  assignedWorkerName: string;
  status: 'active' | 'completed' | 'missed' | 'lost_to_followup';
  outcome?: 'recovered' | 'died' | 'referred' | 'under_treatment';
  condition: string;
  facilityLevel: FacilityLevel;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  state: string;
  county: string;
  sourceVisitId?: string;
  orgId?: string;
}

// ===== Five-Level Facility Hierarchy (South Sudan Health System) =====
export type FacilityLevel = 'boma' | 'payam' | 'county' | 'state' | 'national';

export interface FacilityLevelConfig {
  level: FacilityLevel;
  name: string;
  description: string;
  diagnosisCapability: 'suspected' | 'clinical' | 'definitive' | 'specialist';
  exampleFacility: string;
}

export const FACILITY_LEVELS: FacilityLevelConfig[] = [
  {
    level: 'boma',
    name: 'Boma (Village)',
    description: '40 households per Boma health worker. Most basic care, referrals up.',
    diagnosisCapability: 'suspected',
    exampleFacility: 'Community Health Post',
  },
  {
    level: 'payam',
    name: 'Payam (Sub-county)',
    description: 'Primary Health Care Units (PHCUs). Basic diagnoses and treatments.',
    diagnosisCapability: 'clinical',
    exampleFacility: 'Primary Health Care Unit',
  },
  {
    level: 'county',
    name: 'County',
    description: 'County hospitals with more advanced care, lab, and pharmacy.',
    diagnosisCapability: 'definitive',
    exampleFacility: 'County Hospital',
  },
  {
    level: 'state',
    name: 'State',
    description: 'State general hospitals with specialist services.',
    diagnosisCapability: 'specialist',
    exampleFacility: 'Wau State Hospital',
  },
  {
    level: 'national',
    name: 'National',
    description: 'Teaching hospitals with highest level of care and training.',
    diagnosisCapability: 'specialist',
    exampleFacility: 'Juba Teaching Hospital',
  },
];

// AI Clinical Decision Support types
export interface AIDiagnosisSuggestion {
  icd10Code: string;
  icd11Code?: string;           // ICD-11 code (WHO standard)
  name: string;
  confidence: number;           // 0-100
  reasoning: string;
  severity: 'mild' | 'moderate' | 'severe';
  suggestedTreatment?: string;
  diagnosisLevel?: FacilityLevel;  // Level at which this diagnosis was made
  diagnosisType?: 'suspected' | 'clinical' | 'definitive' | 'confirmed';
  confirmedBy?: string;            // "RDT", "microscopy", "clinical only", etc.
}

export interface AIEvaluation {
  suggestedDiagnoses: AIDiagnosisSuggestion[];
  vitalSignAlerts: string[];
  recommendedTests: string[];
  severityAssessment: string;
  clinicalNotes: string;
  evaluatedAt: string;
}

// ===== Organization (Multi-Tenant) =====
export interface OrganizationDoc extends BaseDoc {
  type: 'organization';
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscriptionPlan: 'basic' | 'professional' | 'enterprise';
  maxUsers: number;
  maxHospitals: number;
  featureFlags: {
    epidemicIntelligence: boolean;
    mchAnalytics: boolean;
    dhis2Export: boolean;
    aiClinicalSupport: boolean;
    communityHealth: boolean;
    facilityAssessments: boolean;
  };
  orgType: 'public' | 'private';
  contactEmail: string;
  country: string;
  isActive: boolean;
}

export interface PlatformConfigDoc extends BaseDoc {
  type: 'platform_config';
  platformName: string;
  maintenanceMode: boolean;
  globalFeatureFlags: {
    signupsEnabled: boolean;
    trialDays: number;
    maxOrganizations: number;
  };
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
}

// ===== Appointment Booking (Payam Level & Above) =====
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'general' | 'follow_up' | 'specialist' | 'anc' | 'immunization' | 'lab' | 'telehealth' | 'surgical' | 'dental' | 'mental_health' | 'walk_in';
export type AppointmentPriority = 'routine' | 'urgent' | 'emergency';

export interface AppointmentDoc extends BaseDoc {
  type: 'appointment';
  patientId: string;
  patientName: string;
  patientPhone?: string;
  providerId: string;         // Doctor/clinical officer assigned
  providerName: string;
  facilityId: string;
  facilityName: string;
  facilityLevel: FacilityLevel;
  // Scheduling
  appointmentDate: string;    // YYYY-MM-DD
  appointmentTime: string;    // HH:MM (24h)
  endTime?: string;           // HH:MM estimated end
  duration: number;           // minutes
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  department: string;
  // Clinical context
  reason: string;             // Chief complaint or reason for visit
  notes?: string;
  referralId?: string;        // If appointment was created from a referral
  previousAppointmentId?: string; // For follow-up chain
  // Status tracking
  status: AppointmentStatus;
  cancelledReason?: string;
  cancelledBy?: string;
  checkedInAt?: string;
  completedAt?: string;
  // Reminders
  reminderSent: boolean;
  reminderChannel?: 'sms' | 'app' | 'both';
  // Recurrence (for regular follow-ups)
  isRecurring: boolean;
  recurrencePattern?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  recurrenceEndDate?: string;
  // Administrative
  bookedBy: string;
  bookedByName: string;
  state: string;
  county?: string;
  orgId?: string;
}

// ===== Telehealth Services (Private Sector) =====
export type TelehealthStatus = 'scheduled' | 'waiting_room' | 'in_session' | 'completed' | 'cancelled' | 'failed' | 'no_show';
export type TelehealthType = 'video' | 'audio' | 'chat';
export type SessionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';

export interface TelehealthSessionDoc extends BaseDoc {
  type: 'telehealth_session';
  // Linked appointment
  appointmentId?: string;
  // Participants
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  providerId: string;
  providerName: string;
  providerRole: string;
  facilityId: string;
  facilityName: string;
  // Session details
  sessionType: TelehealthType;
  scheduledDate: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  duration?: number;          // actual minutes
  status: TelehealthStatus;
  // Connection
  roomId: string;             // Unique room identifier for joining
  joinUrl?: string;           // URL for patient to join
  providerJoinUrl?: string;
  // Clinical
  chiefComplaint: string;
  clinicalNotes?: string;
  diagnosis?: string;
  icd10Code?: string;
  prescriptionsIssued?: string[];
  labOrdersIssued?: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  referralRequired: boolean;
  referralFacility?: string;
  // Quality & compliance (ISO 13131 alignment)
  sessionQuality?: SessionQuality;
  connectionDrops: number;
  patientConsentGiven: boolean;
  consentTimestamp?: string;
  // Recording & documentation
  sessionRecorded: boolean;
  recordingUrl?: string;
  attachments?: { name: string; type: string; url: string }[];
  // Patient satisfaction
  patientRating?: number;     // 1-5
  patientFeedback?: string;
  // Billing (private sector)
  consultationFee?: number;
  currency?: string;
  paymentStatus?: 'pending' | 'paid' | 'waived' | 'insurance';
  insuranceProvider?: string;
  // Administrative
  cancelledReason?: string;
  cancelledBy?: string;
  state: string;
  county?: string;
  orgId?: string;
}

// Re-export mock types for convenience
export type { Hospital, Patient, Referral, DiseaseAlert, VitalSigns, Diagnosis, Prescription, LabResult, MedicalRecord, Attachment, TransferPackage };
