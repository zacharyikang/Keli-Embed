"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getCardStatesAction, updateCardMasteryAction } from "@/lib/actions/library-actions";

type MasteryContextType = {
  masteredIds: Set<string>;
  learnedIds: Set<string>;
  toggleMastery: (questionId: string) => Promise<void>;
  isMastered: (questionId: string) => boolean;
  isLoading: boolean;
  masteryPercentage: number;
  totalQuestionsCount: number;
  setTotalQuestionsCount: (count: number) => void;
};

const MasteryContext = createContext<MasteryContextType>({
  masteredIds: new Set(),
  learnedIds: new Set(),
  toggleMastery: async () => {},
  isMastered: () => false,
  isLoading: true,
  masteryPercentage: 0,
  totalQuestionsCount: 23,
  setTotalQuestionsCount: () => {},
});

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestionsCount, setTotalQuestionsCountState] = useState<number>(23);

  // Read total count from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedCount = localStorage.getItem("embedstudio:total_questions_count");
      if (cachedCount) {
        const parsed = parseInt(cachedCount, 10);
        if (!isNaN(parsed) && parsed > 0) {
          const timer = setTimeout(() => {
            setTotalQuestionsCountState(parsed);
          }, 0);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const setTotalQuestionsCount = useCallback((count: number) => {
    setTotalQuestionsCountState(count);
    if (typeof window !== "undefined") {
      localStorage.setItem("embedstudio:total_questions_count", count.toString());
    }
  }, []);

  // Sync / Load card states on mount
  useEffect(() => {
    async function loadMastery() {
      let localMastered: string[] = [];
      let localLearned: string[] = [];
      
      if (typeof window !== "undefined") {
        try {
          const cachedM = localStorage.getItem("embedstudio:mastered_ids");
          const cachedL = localStorage.getItem("embedstudio:learned_ids");
          if (cachedM) localMastered = JSON.parse(cachedM);
          if (cachedL) localLearned = JSON.parse(cachedL);
        } catch (e) {
          console.error("Failed to read from localStorage:", e);
        }
      }

      // Optimistically set from local storage first
      setMasteredIds(new Set(localMastered));
      setLearnedIds(new Set(localLearned));

      try {
        const cardStates = await getCardStatesAction();
        const dbMastered = new Set<string>();
        const dbLearned = new Set<string>();

        for (const card of cardStates) {
          if (card.intervalDays > 21) {
            dbMastered.add(card.questionId);
          }
          if (card.totalReviews > 0) {
            dbLearned.add(card.questionId);
          }
        }

        // Merge local storage and database states
        const mergedM = new Set([...localMastered, ...dbMastered]);
        const mergedL = new Set([...localLearned, ...dbLearned]);

        setMasteredIds(mergedM);
        setLearnedIds(mergedL);

        if (typeof window !== "undefined") {
          localStorage.setItem("embedstudio:mastered_ids", JSON.stringify(Array.from(mergedM)));
          localStorage.setItem("embedstudio:learned_ids", JSON.stringify(Array.from(mergedL)));
        }
      } catch (err) {
        console.error("Failed to sync card states with DB:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMastery();
  }, []);

  const toggleMastery = useCallback(async (questionId: string) => {
    // Determine new state
    const nextMastered = new Set(masteredIds);
    const nextLearned = new Set(learnedIds);
    const wasMastered = nextMastered.has(questionId);
    const isNowMastered = !wasMastered;

    if (isNowMastered) {
      nextMastered.add(questionId);
      nextLearned.add(questionId);
    } else {
      nextMastered.delete(questionId);
      nextLearned.delete(questionId);
    }

    // Update state immediately (Optimistic UI)
    setMasteredIds(nextMastered);
    setLearnedIds(nextLearned);

    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("embedstudio:mastered_ids", JSON.stringify(Array.from(nextMastered)));
        localStorage.setItem("embedstudio:learned_ids", JSON.stringify(Array.from(nextLearned)));
      } catch (e) {
        console.error(e);
      }
    }

    // Send update request to server
    try {
      await updateCardMasteryAction(questionId, isNowMastered);
    } catch (err) {
      console.error("Failed to sync mastery toggle with DB:", err);
    }
  }, [masteredIds, learnedIds]);

  const isMastered = useCallback((questionId: string) => {
    return masteredIds.has(questionId);
  }, [masteredIds]);

  const masteryPercentage = totalQuestionsCount > 0 
    ? Math.min(100, Math.max(0, Math.round((masteredIds.size / totalQuestionsCount) * 100))) 
    : 0;

  return (
    <MasteryContext.Provider
      value={{
        masteredIds,
        learnedIds,
        toggleMastery,
        isMastered,
        isLoading,
        masteryPercentage,
        totalQuestionsCount,
        setTotalQuestionsCount,
      }}
    >
      {children}
    </MasteryContext.Provider>
  );
}

export function useMastery() {
  return useContext(MasteryContext);
}
