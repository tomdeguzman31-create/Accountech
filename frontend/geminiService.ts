
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface FileData {
  data: string; // base64
  mimeType: string;
}

export const parseDocumentToQuestions = async (
  input: string | FileData, 
  subjectName?: string, 
  preferredDifficulty?: string
) => {
  const context = `
    Context: The user is extracting questions for the subject: ${subjectName || 'Accounting'}.
    Preferred Difficulty: ${preferredDifficulty || 'Average'}.
    Task: Extract accounting board exam style questions from the provided document.
  `;

  const prompt = `Parse the provided content and extract professional accounting board exam style questions. 
    ${context}
    
    Format each question into a structured JSON array. If the document contains multiple questions, extract all of them.
    Ensure questions follow the CPA Board Exam format (Stem, 4 Options, 1 Correct Key).`;

  const parts: any[] = [{ text: prompt }];

  if (typeof input === 'string') {
    parts.push({ text: `Text Content: ${input}` });
  } else {
    parts.push({
      inlineData: {
        mimeType: input.mimeType,
        data: input.data,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            options: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
              },
              required: ['A', 'B', 'C', 'D']
            },
            correctAnswer: { type: Type.STRING, description: "Must be 'A', 'B', 'C', or 'D'" },
            reference: { type: Type.STRING },
            topic: { type: Type.STRING },
            difficulty: { type: Type.STRING, description: "Use 'Easy', 'Average', or 'Difficult'" }
          },
          required: ['content', 'options', 'correctAnswer', 'reference', 'topic', 'difficulty']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
