import { createContext, useContext } from 'react';

export interface StatusFact {
  text: string;
  hint?: string;
}

export type StatusScope = 'search' | 'searchDemo';

interface StatusFacts {
  facts: Partial<Record<StatusScope, readonly StatusFact[]>>;
  post: (scope: StatusScope, facts: readonly StatusFact[] | null) => void;
}

// Silent by default, so a screen rendered on its own still works.
export const StatusFactsContext = createContext<StatusFacts>({ facts: {}, post: () => {} });

export const useStatusFacts = () => useContext(StatusFactsContext);
