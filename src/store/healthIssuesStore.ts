import { useState, useEffect } from "react";

// In-memory store that maps motherId to boolean (defaulting to false: assume health is good / hide issues)
const listeners = new Set<() => void>();
const healthIssuesState: Record<string, boolean> = {};

export const getHealthIssuesState = (motherId: string): boolean => {
  return !!healthIssuesState[motherId];
};

export const setHealthIssuesState = (motherId: string, show: boolean) => {
  healthIssuesState[motherId] = show;
  listeners.forEach((listener) => listener());
};

export const useHealthIssues = (motherId: string) => {
  const [show, setShow] = useState(() => getHealthIssuesState(motherId));

  useEffect(() => {
    const handleUpdate = () => {
      setShow(getHealthIssuesState(motherId));
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [motherId]);

  return [show, (val: boolean) => setHealthIssuesState(motherId, val)] as const;
};

// List of health problem-related question IDs that are hidden by default.
// Currently empty — all counseling questions are always shown regardless of toggle.
export const HEALTH_PROBLEM_QUESTIONS: string[] = [];

export const isHealthProblemQuestion = (questionId: string): boolean => {
  return HEALTH_PROBLEM_QUESTIONS.includes(questionId);
};
