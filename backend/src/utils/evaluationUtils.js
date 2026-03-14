/**
 * Calculate average ratings for a lecturer from their evaluation responses
 * @param {Array} lecturerEvaluations - Array of LecturerEvaluation records with EvaluationResponses
 * @returns {Object} - Contains questionAverages, overallAverage, comments, and responseCount
 */
export const calculateLecturerAverages = (lecturerEvaluations) => {
  const questionTotals = {};
  const comments = [];

  // Aggregate all responses and comments
  lecturerEvaluations.forEach((lecEval) => {
    if (lecEval.comment && lecEval.comment.trim()) {
      comments.push(lecEval.comment.trim());
    }

    lecEval.EvaluationResponses?.forEach((response) => {
      const qId = response.question_id;
      if (!questionTotals[qId]) {
        questionTotals[qId] = { sum: 0, count: 0 };
      }
      questionTotals[qId].sum += parseFloat(response.rating);
      questionTotals[qId].count++;
    });
  });

  // Calculate averages for each question
  const questionAverages = {};
  let totalAvg = 0;
  let questionCount = 0;

  Object.entries(questionTotals).forEach(([qId, data]) => {
    const avg = data.count > 0 ? data.sum / data.count : 0;
    questionAverages[qId] = parseFloat(avg.toFixed(1));
    totalAvg += parseFloat(avg.toFixed(1));
    questionCount++;
  });

  // Calculate overall average across all questions
  const overallAverage = questionCount > 0 ? parseFloat((totalAvg / questionCount).toFixed(1)) : 0;

  return {
    questionAverages,
    overallAverage,
    comments,
    responseCount: lecturerEvaluations.length,
  };
};
