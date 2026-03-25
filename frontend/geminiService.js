"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocumentToQuestions = void 0;
const genai_1 = require("@google/genai");
// Always use process.env.API_KEY directly for initialization
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.API_KEY });
const parseDocumentToQuestions = async (input, subjectName, preferredDifficulty) => {
    const context = `
    Context: The user is extracting questions for the subject: ${subjectName || 'Accounting'}.
    Preferred Difficulty: ${preferredDifficulty || 'Average'}.
    Task: Extract accounting board exam style questions from the provided document.
  `;
    const prompt = `Parse the provided content and extract professional accounting board exam style questions. 
    ${context}
    
    Format each question into a structured JSON array. If the document contains multiple questions, extract all of them.
    Ensure questions follow the CPA Board Exam format (Stem, 4 Options, 1 Correct Key).`;
    const parts = [{ text: prompt }];
    if (typeof input === 'string') {
        parts.push({ text: `Text Content: ${input}` });
    }
    else {
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
                type: genai_1.Type.ARRAY,
                items: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        content: { type: genai_1.Type.STRING },
                        options: {
                            type: genai_1.Type.OBJECT,
                            properties: {
                                A: { type: genai_1.Type.STRING },
                                B: { type: genai_1.Type.STRING },
                                C: { type: genai_1.Type.STRING },
                                D: { type: genai_1.Type.STRING },
                            },
                            required: ['A', 'B', 'C', 'D']
                        },
                        correctAnswer: { type: genai_1.Type.STRING, description: "Must be 'A', 'B', 'C', or 'D'" },
                        reference: { type: genai_1.Type.STRING },
                        topic: { type: genai_1.Type.STRING },
                        difficulty: { type: genai_1.Type.STRING, description: "Use 'Easy', 'Average', or 'Difficult'" }
                    },
                    required: ['content', 'options', 'correctAnswer', 'reference', 'topic', 'difficulty']
                }
            }
        }
    });
    return JSON.parse(response.text || '[]');
};
exports.parseDocumentToQuestions = parseDocumentToQuestions;
//# sourceMappingURL=geminiService.js.map