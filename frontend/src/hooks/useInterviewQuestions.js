import { useCallback, useEffect, useState } from 'react';
import { 
	getInterviewQuestions as apiGetInterviewQuestions,
	addInterviewQuestion as apiAddInterviewQuestion,
	updateInterviewQuestion as apiUpdateInterviewQuestion,
	deleteInterviewQuestion as apiDeleteInterviewQuestion
} from '../services/interview.service';

export function useInterviewQuestions() {
	const [categories, setCategories] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchQuestions = useCallback(async () => {
		setLoading(true);
		try {
			const data = await apiGetInterviewQuestions({ defaultOnly: 0 });
			setCategories(data?.categories || {});
		} catch (e) {
			setError(e?.response?.data?.message || 'Failed to load interview questions');
		} finally {
			setLoading(false);
		}
	}, []);

	const addQuestion = useCallback(async (payload) => {
		await apiAddInterviewQuestion(payload);
		await fetchQuestions();
	}, [fetchQuestions]);

	const updateQuestion = useCallback(async (questionId, payload) => {
		await apiUpdateInterviewQuestion(questionId, payload);
		await fetchQuestions();
	}, [fetchQuestions]);

	const deleteQuestion = useCallback(async (questionId) => {
		await apiDeleteInterviewQuestion(questionId);
		await fetchQuestions();
	}, [fetchQuestions]);

	useEffect(() => {
		fetchQuestions();
	}, [fetchQuestions]);

	return {
		categories,
		loading,
		error,
		refresh: fetchQuestions,
		setError,
		addQuestion,
		updateQuestion,
		deleteQuestion,
	};
}

