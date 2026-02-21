// Input validation for patient and medical record data

// File upload constraints
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_TRANSFER_PACKAGE_BYTES = 20 * 1024 * 1024; // 20MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/dicom',
  'image/dicom',
];

export function validateAttachment(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File "${file.name}" exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
    return { valid: false, error: `File "${file.name}" has unsupported type (${file.type || 'unknown'}). Allowed: JPEG, PNG, GIF, WebP, PDF, DICOM` };
  }
  return { valid: true };
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super(Object.values(fields).join(', '));
    this.name = 'ValidationError';
  }
}

function sanitizeString(val: unknown): string {
  if (typeof val !== 'string') return '';
  // Remove control characters and trim
  return val.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

export function validatePatientData(data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};

  const firstName = sanitizeString(data.firstName);
  if (!firstName || firstName.length < 1) {
    errors.firstName = 'First name is required';
  } else if (firstName.length > 100) {
    errors.firstName = 'First name is too long';
  }

  const surname = sanitizeString(data.surname);
  if (!surname || surname.length < 1) {
    errors.surname = 'Surname is required';
  } else if (surname.length > 100) {
    errors.surname = 'Surname is too long';
  }

  if (!data.gender || !['male', 'female'].includes((data.gender as string).toLowerCase())) {
    errors.gender = 'Gender must be male or female';
  }

  if (!data.dateOfBirth && !data.estimatedAge) {
    errors.dateOfBirth = 'Date of birth or estimated age is required';
  }

  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth as string);
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = 'Invalid date of birth';
    } else if (dob > new Date()) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    }
  }

  if (data.phone && typeof data.phone === 'string') {
    const phone = data.phone.replace(/\s/g, '');
    if (phone.length > 0 && !/^\+?[\d-]{7,15}$/.test(phone)) {
      errors.phone = 'Invalid phone number format';
    }
  }

  if (!data.state || typeof data.state !== 'string') {
    errors.state = 'State is required';
  }

  return errors;
}

export function validateVitalSigns(vitals: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};

  const temp = Number(vitals.temperature);
  if (vitals.temperature && !isNaN(temp)) {
    if (temp < 25 || temp > 45) {
      errors.temperature = 'Temperature must be between 25-45°C';
    }
  }

  if (vitals.systolicBP) {
    const sys = Number(vitals.systolicBP);
    if (isNaN(sys) || sys < 40 || sys > 300) {
      errors.systolicBP = 'Systolic BP must be between 40-300 mmHg';
    }
  }

  if (vitals.diastolicBP) {
    const dia = Number(vitals.diastolicBP);
    if (isNaN(dia) || dia < 20 || dia > 200) {
      errors.diastolicBP = 'Diastolic BP must be between 20-200 mmHg';
    }
  }

  if (vitals.pulse) {
    const pulse = Number(vitals.pulse);
    if (isNaN(pulse) || pulse < 20 || pulse > 250) {
      errors.pulse = 'Pulse must be between 20-250 bpm';
    }
  }

  if (vitals.respiratoryRate) {
    const rr = Number(vitals.respiratoryRate);
    if (isNaN(rr) || rr < 4 || rr > 60) {
      errors.respiratoryRate = 'Respiratory rate must be between 4-60 breaths/min';
    }
  }

  if (vitals.oxygenSaturation) {
    const o2 = Number(vitals.oxygenSaturation);
    if (isNaN(o2) || o2 < 30 || o2 > 100) {
      errors.oxygenSaturation = 'Oxygen saturation must be between 30-100%';
    }
  }

  if (vitals.weight) {
    const w = Number(vitals.weight);
    if (isNaN(w) || w < 0.5 || w > 300) {
      errors.weight = 'Weight must be between 0.5-300 kg';
    }
  }

  if (vitals.height) {
    const h = Number(vitals.height);
    if (isNaN(h) || h < 20 || h > 250) {
      errors.height = 'Height must be between 20-250 cm';
    }
  }

  return errors;
}

export function validateMedicalRecord(data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.patientId || typeof data.patientId !== 'string') {
    errors.patientId = 'Patient ID is required';
  }

  if (!data.hospitalId || typeof data.hospitalId !== 'string') {
    errors.hospitalId = 'Hospital ID is required';
  }

  if (!data.chiefComplaint || (typeof data.chiefComplaint === 'string' && data.chiefComplaint.trim().length < 3)) {
    errors.chiefComplaint = 'Chief complaint is required (min 3 characters)';
  }

  if (data.vitalSigns && typeof data.vitalSigns === 'object') {
    const vitalErrors = validateVitalSigns(data.vitalSigns as Record<string, unknown>);
    Object.entries(vitalErrors).forEach(([k, v]) => {
      errors[`vitalSigns.${k}`] = v;
    });
  }

  return errors;
}
