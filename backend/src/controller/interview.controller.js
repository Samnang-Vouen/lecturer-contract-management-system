import { Op } from 'sequelize';
import { InterviewQuestion } from '../model/interviewQuestion.model.js';
import { CandidateQuestion } from '../model/candidateQuestion.model.js';
import { activeInterviewCategories } from '../utils/seedInterviewQuestions.js';
import Candidate from '../model/candidate.model.js';

// GET /api/interview-questions
const normalize = (s = '') => s.toLowerCase().trim().replace(/\s+/g, ' ');

export const getInterviewQuestions = async (req, res) => {
  try {
    const defaultOnly = req.query.defaultOnly === '1' || req.query.defaultOnly === 'true';
    const where = {};
    if (defaultOnly) where.is_default = true; // only baseline set
    const rows = await InterviewQuestion.findAll({
      where,
      order: [
        ['category', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
    // Group by category
    const categories = {};
    for (const q of rows) {
      if (!activeInterviewCategories.includes(q.category)) continue; // skip inactive categories
      if (!categories[q.category]) categories[q.category] = [];
      categories[q.category].push({ id: q.id, question_text: q.question_text });
    }
    res.json({ categories });
  } catch (e) {
    console.error('getInterviewQuestions error', e);
    res.status(500).json({ message: 'Failed to fetch interview questions' });
  }
};

// POST /api/interview-questions
export const addInterviewQuestion = async (req, res) => {
  try {
    const { question_text, category } = req.body;
    if (!question_text || !category)
      return res.status(400).json({ message: 'question_text and category required' });
    const canonical_text = normalize(question_text);
    // Check duplicate
    const dup = await InterviewQuestion.findOne({ where: { category, canonical_text } });
    if (dup) return res.status(409).json({ message: 'Duplicate question exists', id: dup.id });
    const created = await InterviewQuestion.create({
      question_text,
      canonical_text,
      category,
      is_default: false,
      is_custom: true,
    });
    res.status(201).json(created);
  } catch (e) {
    console.error('addInterviewQuestion error', e);
    res.status(500).json({ message: 'Failed to create question' });
  }
};

// PUT /api/interview-questions/:id
export const updateInterviewQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text } = req.body;
    const row = await InterviewQuestion.findByPk(id);
    if (!row) return res.status(404).json({ message: 'Question not found' });
    if (question_text) {
      const canonical_text = normalize(question_text);
      // If canonical changes and another row already has it, block
      if (canonical_text !== row.canonical_text) {
        const existing = await InterviewQuestion.findOne({
          where: { category: row.category, canonical_text },
        });
        if (existing && existing.id !== row.id) {
          return res
            .status(409)
            .json({ message: 'Another question with same text exists', id: existing.id });
        }
      }
      await row.update({ question_text, canonical_text });
    }
    res.json(row);
  } catch (e) {
    console.error('updateInterviewQuestion error', e);
    res.status(500).json({ message: 'Failed to update question' });
  }
};

// GET /api/interview-questions/search?query=foo
export const searchInterviewQuestions = async (req, res) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) return res.json([]);
    const rows = await InterviewQuestion.findAll({
      where: { question_text: { [Op.like]: `%${query}%` } },
      limit: 100, // gather enough then dedupe
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
    res.json(out);
  } catch (e) {
    console.error('searchInterviewQuestions error', e);
    res.status(500).json({ message: 'Failed to search questions' });
  }
};

// POST /api/candidate-questions
export const addCandidateQuestion = async (req, res) => {
  try {
    const { candidate_id, question_id, answer, rating, noted } = req.body;
    if (!candidate_id || !question_id)
      return res.status(400).json({ message: 'candidate_id and question_id required' });
    // Validate candidate exists
    const cand = await Candidate.findByPk(candidate_id);
    if (!cand) return res.status(404).json({ message: 'Candidate not found' });
    // Validate question exists
    const quest = await InterviewQuestion.findByPk(question_id);
    if (!quest) return res.status(404).json({ message: 'Question not found' });
    const created = await CandidateQuestion.create({
      candidate_id,
      question_id,
      answer,
      rating,
      noted,
    });
    res.status(201).json(created);
  } catch (e) {
    console.error('addCandidateQuestion error', e);
    res.status(500).json({ message: 'Failed to create candidate question' });
  }
};

// GET /api/candidates/:id/interview-details
export const getCandidateInterviewDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Use Sequelize associations for efficient joins
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
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (
      !candidateWithResponses.interviewResponses ||
      candidateWithResponses.interviewResponses.length === 0
    ) {
      return res.json({ candidate_id: id, responses: [] });
    }

    // Transform the response data
    const responses = candidateWithResponses.interviewResponses.map((response) => ({
      id: response.id,
      question_id: response.question_id,
      question_text: response.question?.question_text || '',
      category: response.question?.category || '',
      rating: response.rating ? Number(response.rating) : null,
      noted: response.noted,
      created_at: response.created_at,
    }));
    res.json({ candidate_id: id, responses });
  } catch (e) {
    console.error('getCandidateInterviewDetails error', e);
    res.status(500).json({ message: 'Failed to fetch interview details' });
  }
};

export default {
  getInterviewQuestions,
  addInterviewQuestion,
  updateInterviewQuestion,
  searchInterviewQuestions,
  addCandidateQuestion,
  getCandidateInterviewDetails,
};
