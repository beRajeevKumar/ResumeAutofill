
export interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  qualification: string;
  yearsOfExperience: string;
  employmentStatus: 'Employed' | 'Unemployed' | '';
  certifications: string;
  skills: string[];
  languages: string;
}
