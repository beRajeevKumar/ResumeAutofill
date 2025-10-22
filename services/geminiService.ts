import { GoogleGenAI } from "@google/genai";
import { FormData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Sends extracted resume text to the Gemini API and streams back structured data.
 * @param resumeText The raw text extracted from the user's resume.
 * @param onUpdate A callback function to progressively update the form state.
 */
export const extractInfoFromTextStream = async (
  resumeText: string,
  onUpdate: (update: Partial<FormData>) => void
): Promise<void> => {
  try {
    const prompt = `Extract information from the following resume text. Respond with key-value pairs, one per line, using '::' as a separator.
      Example:
      firstName::John
      lastName::Doe
      email::john.doe@example.com
      skills::JavaScript,React,Node.js,HTML,CSS
      employmentStatus::Employed
      
      The keys must be: firstName, middleName, lastName, email, phone, dateOfBirth, qualification, yearsOfExperience, employmentStatus, certifications, skills, languages.
      - For 'employmentStatus', determine if they are currently employed. If the latest job has an end date in the past, return 'Unemployed', otherwise 'Employed'.
      - For 'skills', return a single comma-separated list.
      - For 'languages', return the primary language, or the first from a list.
      - If a value is not found, omit the key-value pair.
      
      Resume Text:
      ---
      ${resumeText}`;
      
    const textPart = { text: prompt };

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: { parts: [textPart] },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let buffer = '';
    for await (const chunk of responseStream) {
      buffer += chunk.text;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1);

        if (line) {
          const parts = line.split('::');
          if (parts.length === 2) {
            const key = parts[0].trim() as keyof FormData;
            const value = parts[1].trim();

            const update: Partial<FormData> = {};
            if (key === 'skills') {
              update[key] = value.split(',').map(s => s.trim()).filter(Boolean);
            } else if (key === 'languages') {
              update[key] = value.split(',')[0].trim();
            } else if (key === 'employmentStatus') {
              if (value === 'Employed' || value === 'Unemployed') {
                update[key] = value;
              }
            } else {
              update[key] = value;
            }
            onUpdate(update);
          }
        }
      }
    }
    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      const parts = line.split('::');
      if (parts.length === 2) {
        const key = parts[0].trim() as keyof FormData;
        const value = parts[1].trim();
        const update: Partial<FormData> = {};
        if (key === 'skills') {
          update[key] = value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (key === 'languages') {
          update[key] = value.split(',')[0].trim();
        } else if (key === 'employmentStatus') {
          if (value === 'Employed' || value === 'Unemployed') {
            update[key] = value;
          }
        } else {
          update[key] = value;
        }
        onUpdate(update);
      }
    }

  } catch (error) {
    console.error("Error streaming data from text:", error);
    throw new Error("Failed to parse resume text. Please check the content or try again.");
  }
};
