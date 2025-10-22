import React, { useState, useRef, useCallback } from 'react';
import { FormData } from '../types';
import { extractInfoFromTextStream } from '../services/geminiService';
import { extractTextFromFile } from '../utils/fileParser';
import { QUALIFICATION_OPTIONS, LANGUAGE_OPTIONS } from '../constants';
import Pill from './Pill';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

type FillMode = 'manual' | 'resume';

const initialFormData: FormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  qualification: '',
  yearsOfExperience: '',
  employmentStatus: '',
  certifications: '',
  skills: [],
  languages: '',
};

const RegistrationForm: React.FC = () => {
  const [fillMode, setFillMode] = useState<FillMode>('manual');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, employmentStatus: e.target.value as 'Employed' | 'Unemployed' }));
  };
  
  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSkillInput(e.target.value);
  };
  
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Enter' || e.key === ',') && skillInput.trim() !== '') {
          e.preventDefault();
          const newSkills = skillInput.split(',').map(s => s.trim()).filter(s => s && !formData.skills.includes(s));
          if(newSkills.length > 0) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, ...newSkills] }));
          }
          setSkillInput('');
      }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleUpdateFromStream = useCallback((update: Partial<FormData>) => {
    setFormData(prev => {
        // Special handling for skills to merge instead of overwrite
        if (update.skills) {
            const newSkills = [...new Set([...prev.skills, ...update.skills])];
            return { ...prev, ...update, skills: newSkills };
        }
        return { ...prev, ...update };
    });
  }, []);

  const handleResumeUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      setFormData(initialFormData); // Reset form before parsing
      try {
        // Step 1: Client-side text extraction (FAST)
        const resumeText = await extractTextFromFile(file);
        // Step 2: Stream extracted text to Gemini (FAST)
        await extractInfoFromTextStream(resumeText, handleUpdateFromStream);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setFillMode('manual'); // Revert to manual on error
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  }, [handleUpdateFromStream]);

  const handleFillByResumeClick = () => {
      setFillMode('resume');
      fileInputRef.current?.click();
  };
  
  const handleModeChange = (mode: FillMode) => {
    setFillMode(mode);
    if (mode === 'manual') {
        setError(null);
        setFormData(initialFormData);
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg w-full">
      <h2 className="text-center text-3xl font-bold text-slate-800 mb-4">Registration Form</h2>
      <p className="text-center text-slate-500 mb-8">Fill in your details below or upload a resume to get started.</p>
      
      <div className="flex justify-center mb-8">
        <div className="flex bg-slate-100 rounded-full p-1">
          <button 
            onClick={() => handleModeChange('manual')}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${fillMode === 'manual' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-800'}`}
            aria-pressed={fillMode === 'manual'}
          >
            Fill Manually
          </button>
          <button 
            onClick={handleFillByResumeClick}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${fillMode === 'resume' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-800'}`}
            aria-pressed={fillMode === 'resume'}
          >
            Fill by Resume
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleResumeUpload} accept=".pdf,.docx,.txt" className="hidden" aria-hidden="true" />
      </div>

      {isLoading && 
        <div className="flex flex-col items-center justify-center text-center text-indigo-600 mb-6 p-4 bg-indigo-50 rounded-lg" aria-live="polite">
            <SpinnerIcon className="w-8 h-8 mb-2" />
            <span className="font-semibold">Parsing your resume...</span>
            <span className="text-sm text-indigo-500">Form will populate as data is extracted.</span>
        </div>
      }
      {error && <div className="text-center text-red-700 mb-6 bg-red-100 p-4 rounded-lg font-medium" role="alert">{error}</div>}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input id="firstName" name="firstName" type="text" placeholder="e.g., Jane" value={formData.firstName} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input id="lastName" name="lastName" type="text" placeholder="e.g., Doe" value={formData.lastName} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
        </div>
        
        <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-slate-700 mb-1">Middle Name <span className="text-slate-400">(Optional)</span></label>
            <input id="middleName" name="middleName" type="text" placeholder="e.g., Marie" value={formData.middleName} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
        </div>
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input id="email" type="email" name="email" placeholder="e.g., jane.doe@example.com" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
        </div>
        <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input id="phone" type="tel" name="phone" placeholder="e.g., +1 234 567 890" value={formData.phone} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
        </div>

        <div className="relative">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
            <input type="text" onFocus={(e) => e.target.type='date'} onBlur={(e) => {if(!e.target.value) e.target.type='text'}} id="dateOfBirth" name="dateOfBirth" placeholder="Select a date" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition pr-10" />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 mt-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="qualification" className="block text-sm font-medium text-slate-700 mb-1">Highest Qualification</label>
                <div className="relative">
                    <select id="qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full appearance-none bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition pr-10">
                        <option value="" disabled>Select Qualification</option>
                        {QUALIFICATION_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
            </div>
            <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input id="yearsOfExperience" name="yearsOfExperience" type="text" placeholder="e.g., 5" value={formData.yearsOfExperience} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
            </div>
        </div>

        <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Current Employment Status</span>
            <div className="flex items-center space-x-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <label className="flex items-center space-x-3 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="employmentStatus" value="Employed" checked={formData.employmentStatus === 'Employed'} onChange={handleRadioChange} className="form-radio" />
                <span>Employed</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="employmentStatus" value="Unemployed" checked={formData.employmentStatus === 'Unemployed'} onChange={handleRadioChange} className="form-radio" />
                <span>Unemployed</span>
              </label>
            </div>
        </div>

        <div>
            <label htmlFor="certifications" className="block text-sm font-medium text-slate-700 mb-1">Certifications <span className="text-slate-400">(comma-separated)</span></label>
            <input id="certifications" name="certifications" type="text" placeholder="e.g., AWS Certified Developer, PMP" value={formData.certifications} onChange={handleInputChange} className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
        </div>
        
        <div>
            <label htmlFor="skills" className="block text-sm font-medium text-slate-700 mb-1">Skills & Expertise</label>
            <div className="bg-white border border-slate-300 p-2 rounded-lg text-sm flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition">
                {formData.skills.map(skill => (
                  <Pill key={skill} text={skill} onRemove={() => removeSkill(skill)} />
                ))}
                <input
                    id="skills"
                    type="text"
                    value={skillInput}
                    onChange={handleSkillInputChange}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-grow bg-transparent outline-none p-1 text-slate-800 placeholder-slate-400"
                    placeholder={formData.skills.length === 0 ? 'Add a skill and press Enter...' : ''}
                />
            </div>
        </div>

        <div>
            <label htmlFor="languages" className="block text-sm font-medium text-slate-700 mb-1">Primary Language</label>
            <div className="relative">
                <select id="languages" name="languages" value={formData.languages} onChange={handleInputChange} className="w-full appearance-none bg-white border border-slate-300 p-3 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition pr-10">
                    <option value="" disabled>Select Language</option>
                    {/* Fix: Corrected a typo where 'q' was used instead of 'l' for the language option. */}
                    {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>
        </div>
        
        <div className="pt-4 flex justify-center">
            <button type="submit" className="bg-indigo-600 text-white font-semibold py-3 px-10 rounded-lg hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-sm hover:shadow-md">
                Next
            </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;