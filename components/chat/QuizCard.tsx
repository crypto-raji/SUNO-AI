"use client";

import { useState } from "react";
import type { Quiz } from "./types";

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (error) setError(null);
  }

  function handleSubmit() {
    const unanswered = quiz.questions.find((q) => !answers[q.id]?.trim());
    if (unanswered) {
      setError("Answer every question before checking your results.");
      return;
    }
    setSubmitted(true);
  }

  const score = submitted
    ? quiz.questions.filter(
        (q) => answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ).length
    : null;

  return (
    <div className="glass-panel mt-1 w-full max-w-md space-y-4 p-4">
      {submitted && (
        <p className="text-sm font-medium text-signal">
          {score}/{quiz.questions.length} correct
        </p>
      )}

      {quiz.questions.map((q, i) => {
        const isCorrect = submitted && answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

        return (
          <div key={q.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm text-paper-100">
              {i + 1}. {q.question}
            </p>

            {q.type === "multiple_choice" && q.options && (
              <div className="mt-2 flex flex-col gap-1.5">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-paper-200">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      disabled={submitted}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "true_false" && (
              <div className="mt-2 flex gap-3">
                {["True", "False"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-paper-200">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      disabled={submitted}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "short_answer" && (
              <input
                type="text"
                disabled={submitted}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Your answer"
                className="mt-2 w-full rounded-lg border border-line bg-ink-950 px-3 py-1.5 text-sm text-paper-100"
              />
            )}

            {submitted && (
              <p className={`mt-1.5 text-xs ${isCorrect ? "text-emerald-400" : "text-red-300"}`}>
                {isCorrect ? "Correct" : `Correct answer: ${q.correctAnswer}`}
              </p>
            )}
          </div>
        );
      })}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!submitted && (
        <button onClick={handleSubmit} className="glass-button w-full">
          Check answers
        </button>
      )}
    </div>
  );
}
