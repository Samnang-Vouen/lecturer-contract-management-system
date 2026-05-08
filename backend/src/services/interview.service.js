import { Op } from 'sequelize';
import { InterviewQuestion } from '../model/interviewQuestion.model.js';
import { CandidateQuestion } from '../model/candidateQuestion.model.js';
import { activeInterviewCategories } from '../utils/seedInterviewQuestions.js';
import Candidate from '../model/candidate.model.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

const normalize = (s = '') => s.toLowerCase().trim().replace(/\s+/g, ' ');

// ---------------------------------------------------------------------------
// Service: listInterviewQuestions
// ---------------------------------------------------------------------------

export async function listInterviewQuestions({ defaultOnly }) {
  const where = {};
  if (defaultOnly) {
    where.is_default = true;
  }

  const rows = await InterviewQuestion.findAll({
    where,
    order: [
      ['category', 'ASC'],
      ['created_at', 'ASC'],
    ],
  });

  const categories = {};
  for (const q of rows) {
    if (defaultOnly && !activeInterviewCategories.includes(q.category)) continue;
    if (!categories[q.category]) {
      categories[q.category] = [];
    }
    categories[q.category].push({ id: q.id, question_text: q.question_text });
  }

  return { categories };
}

// ---------------------------------------------------------------------------
// Service: addInterviewQuestion
// ---------------------------------------------------------------------------

export async function addInterviewQuestion({ question_text, category }) {
  if (!question_text || !category) {
    throw new ValidationError('question_text and category required', {
      payload: { message: 'question_text and category required' },
    });
  }

  const canonical_text = normalize(question_text);
  const dup = await InterviewQuestion.findOne({ where: { category, canonical_text } });
  if (dup) {
    throw new ConflictError('Duplicate question exists', {
      payload: { message: 'Duplicate question exists', id: dup.id },
    });
  }

  const created = await InterviewQuestion.create({
    question_text,
    canonical_text,
    category,
    is_default: false,
    is_custom: true,
  });

  return created;
}

// ---------------------------------------------------------------------------
// Service: updateInterviewQuestion
// ---------------------------------------------------------------------------

export async function updateInterviewQuestion(id, { question_text }) {
  const row = await InterviewQuestion.findByPk(id);
  if (!row) {
    throw new NotFoundError('Question not found', { payload: { message: 'Question not found' } });
  }

  if (question_text) {
    const canonical_text = normalize(question_text);
    if (canonical_text !== row.canonical_text) {
      const existing = await InterviewQuestion.findOne({
        where: { category: row.category, canonical_text },
      });
      if (existing && existing.id !== row.id) {
        throw new ConflictError('Another question with same text exists', {
          payload: { message: 'Another question with same text exists', id: existing.id },
        });
      }
    }
    await row.update({ question_text, canonical_text });
  }

  return row;
}

// ---------------------------------------------------------------------------
// Service: deleteInterviewQuestion
// ---------------------------------------------------------------------------

export async function deleteInterviewQuestion(id) {
  const row = await InterviewQuestion.findByPk(id);
  if (!row) {
    throw new NotFoundError('Question not found', { payload: { message: 'Question not found' } });
  }
  await row.destroy();
  return { message: 'Question deleted successfully' };
}

// ---------------------------------------------------------------------------
// Service: searchInterviewQuestions
// ---------------------------------------------------------------------------

export async function searchInterviewQuestions(query) {
  if (!query) return [];

  const rows = await InterviewQuestion.findAll({
    where: { question_text: { [Op.like]: `%${query}%` } },
    limit: 100,
    order: [['question_text', 'ASC']],
  });

  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.canonical_text)) continue;
    seen.add(r.canonical_text);
    out.push({ id: r.id, question_text: r.question_text, category: r.category });
    if (out.length >= 15) break;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Service: addCandidateQuestion
// ---------------------------------------------------------------------------

export async function addCandidateQuestion({ candidate_id, question_id, answer, rating, noted }) {
  if (!candidate_id || !question_id) {
    throw new ValidationError('candidate_id and question_id required', {
      payload: { message: 'candidate_id and question_id required' },
    });
  }

  const cand = await Candidate.findByPk(candidate_id);
  if (!cand) {
    throw new NotFoundError('Candidate not found', { payload: { message: 'Candidate not found' } });
  }

  const quest = await InterviewQuestion.findByPk(question_id);
  if (!quest) {
    throw new NotFoundError('Question not found', { payload: { message: 'Question not found' } });
  }

  const existing = await CandidateQuestion.findOne({
    where: { candidate_id, question_id },
    order: [
      ['updated_at', 'DESC'],
      ['created_at', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  if (existing) {
    await existing.update({
      answer: answer !== undefined ? answer : existing.answer,
      rating: rating !== undefined ? rating : existing.rating,
      noted: noted !== undefined ? noted : existing.noted,
    });
    return { data: existing, created: false };
  }

  const created = await CandidateQuestion.create({ candidate_id, question_id, answer, rating, noted });
  return { data: created, created: true };
}

// ---------------------------------------------------------------------------
// Service: getCandidateInterviewDetails
// ---------------------------------------------------------------------------

export async function getCandidateInterviewDetails(id) {
  const candidateWithResponses = await Candidate.findByPk(id, {
    include: [
      {
        model: CandidateQuestion,
        as: 'interviewResponses',
        include: [
          {
            model: InterviewQuestion,
            as: 'question',
            attributes: ['id', 'question_text', 'category'],
          },
        ],
        order: [['created_at', 'ASC']],
      },
    ],
  });

  if (!candidateWithResponses) {
    throw new NotFoundError('Candidate not found', { payload: { message: 'Candidate not found' } });
  }

  if (
    !candidateWithResponses.interviewResponses ||
    candidateWithResponses.interviewResponses.length === 0
  ) {
    return { candidate_id: id, responses: [] };
  }

  const mergedByQuestion = new Map();
  for (const response of candidateWithResponses.interviewResponses) {
    const questionId = response.question_id;
    const existing = mergedByQuestion.get(questionId);
    const nextRating =
      response.rating !== null && response.rating !== undefined ? Number(response.rating) : null;

    if (!existing) {
      mergedByQuestion.set(questionId, {
        id: response.id,
        question_id: questionId,
        question_text: response.question?.question_text || '',
        category: response.question?.category || '',
        rating: nextRating,
        noted: response.noted || '',
        created_at: response.created_at,
      });
      continue;
    }

    mergedByQuestion.set(questionId, {
      ...existing,
      id: response.id,
      question_text: existing.question_text || response.question?.question_text || '',
      category: existing.category || response.question?.category || '',
      rating: nextRating ?? existing.rating,
      noted: response.noted || existing.noted || '',
      created_at: response.created_at,
    });
  }

  return { candidate_id: id, responses: Array.from(mergedByQuestion.values()) };
}
