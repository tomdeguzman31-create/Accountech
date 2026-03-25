import type { Request, Response } from 'express';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { ApiError } from '../utils/http.js';

type ParsedQuestion = {
  number: number;
  content: string;
  options: { A: string; B: string; C: string; D: string };
  answer?: 'A' | 'B' | 'C' | 'D';
  reference?: string;
};

function extractQuestions(rawText: string): ParsedQuestion[] {
  const chunks = rawText
    .split(/\n(?=\d+[\.)]\s)/g)
    .map((v) => v.trim())
    .filter(Boolean);

  const parsed: ParsedQuestion[] = [];

  for (const chunk of chunks) {
    const header = chunk.match(/^(\d+)[\.)]\s*([\s\S]*?)(?=\nA[\.)]\s)/i);
    if (!header) continue;

    const number = Number(header[1]);
    const content = header[2].trim();

    const optionA = chunk.match(/\nA[\.)]\s*([\s\S]*?)(?=\nB[\.)]\s)/i)?.[1]?.trim() ?? '';
    const optionB = chunk.match(/\nB[\.)]\s*([\s\S]*?)(?=\nC[\.)]\s)/i)?.[1]?.trim() ?? '';
    const optionC = chunk.match(/\nC[\.)]\s*([\s\S]*?)(?=\nD[\.)]\s)/i)?.[1]?.trim() ?? '';
    const optionD = chunk.match(/\nD[\.)]\s*([\s\S]*?)(?=\n(?:Ans(?:wer)?|Key|Ref|$))/i)?.[1]?.trim() ?? '';

    if (!optionA || !optionB || !optionC || !optionD) continue;

    const answer = chunk.match(/\n(?:Ans(?:wer)?|Key)\s*[:\-]\s*([ABCD])/i)?.[1]?.toUpperCase() as
      | 'A'
      | 'B'
      | 'C'
      | 'D'
      | undefined;

    const reference = chunk.match(/\nRef\s*[:\-]\s*([\s\S]*)$/i)?.[1]?.trim();

    parsed.push({
      number,
      content,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      answer,
      reference,
    });
  }

  return parsed;
}

export async function parseQuestionBankFile(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ApiError(400, 'Upload file is required');
  }

  let rawText = '';

  if (
    req.file.mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    rawText = result.value;
  } else if (req.file.mimetype === 'application/pdf') {
    const parsed = await pdf(req.file.buffer);
    rawText = parsed.text;
  } else {
    throw new ApiError(400, 'Only .docx and .pdf are supported');
  }

  const questions = extractQuestions(rawText);

  res.json({
    fileName: req.file.originalname,
    totalExtracted: questions.length,
    questions,
  });
}
