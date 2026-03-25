import { DEFAULT_QUESTION_TEXT_BY_ID, formatScore, toArray } from "./common";

export function buildQuestionRowsFromResults(resultsBody, lecturerId) {
  const groups = Object.values(resultsBody?.groups || {});
  const questionCatalog = toArray(resultsBody?.question_catalog);
  const questionMetaById = new Map(
    questionCatalog.map((question) => [
      String(question?.id),
      {
        orderNo: Number(question?.order_no),
        text: String(question?.question_text || "").trim(),
      },
    ]),
  );
  const weightedByQuestion = new Map();
  let overallWeightedSum = 0;
  let overallWeight = 0;

  groups.forEach((group) => {
    const weight = Number(group?.responses_received);
    const normalizedWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
    const lecturerData = group?.lecturer_evaluations?.[String(lecturerId)];
    if (!lecturerData) return;

    Object.entries(lecturerData.question_averages || {}).forEach(([questionId, score]) => {
      const numeric = Number(score);
      if (!Number.isFinite(numeric)) return;
      const previous = weightedByQuestion.get(questionId) || { sum: 0, weight: 0 };
      previous.sum += numeric * normalizedWeight;
      previous.weight += normalizedWeight;
      weightedByQuestion.set(questionId, previous);
    });

    const overall = Number(lecturerData.overall_average);
    if (Number.isFinite(overall)) {
      overallWeightedSum += overall * normalizedWeight;
      overallWeight += normalizedWeight;
    }
  });

  const sortedQuestionIds = Array.from(weightedByQuestion.keys()).sort((a, b) => {
    const metaA = questionMetaById.get(String(a));
    const metaB = questionMetaById.get(String(b));
    const orderA = Number.isFinite(metaA?.orderNo) ? metaA.orderNo : Number(a);
    const orderB = Number.isFinite(metaB?.orderNo) ? metaB.orderNo : Number(b);
    return orderA - orderB;
  });
  if (!sortedQuestionIds.length) return null;

  const questionOrders = [];
  const questionRows = sortedQuestionIds.map((questionId) => {
    const meta = questionMetaById.get(String(questionId));
    const displayOrder = Number.isFinite(meta?.orderNo)
      ? meta.orderNo
      : Number(questionId);
    questionOrders.push(displayOrder);

    const stat = weightedByQuestion.get(questionId);
    const average = stat && stat.weight > 0 ? stat.sum / stat.weight : null;
    const questionText = meta?.text || DEFAULT_QUESTION_TEXT_BY_ID[displayOrder] || "";
    const questionTitle = questionText ? `Q${displayOrder}. ${questionText}` : `Q${displayOrder}`;
    return [questionTitle, average === null ? "-" : formatScore(average)];
  });

  const validOrders = questionOrders.filter((order) => Number.isFinite(order));
  return {
    questionRows,
    questionCount: sortedQuestionIds.length,
    overallAverage: overallWeight > 0 ? overallWeightedSum / overallWeight : null,
    minQuestionNo: validOrders.length ? Math.min(...validOrders) : 1,
    maxQuestionNo: validOrders.length ? Math.max(...validOrders) : sortedQuestionIds.length,
  };
}