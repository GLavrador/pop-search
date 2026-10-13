import { useState } from 'react';
import type { SearchResult } from '../../types';
import { useRobot } from '../../context/robotContext';
import { VideoCard } from '../VideoCard';
import { Why, type Asked } from './Why';

interface ResultListProps {
  results: SearchResult[];
  /** The search they answer. Without it no result can say why it is there. */
  asked?: Asked;
}

// A server from before the reasons were kept sends neither place.
const hasReasons = (result: SearchResult) =>
  result.vector_position != null || result.text_position != null;

/** The results of a search, and the one window that explains whichever of them is asked about. */
export const ResultList = ({ results, asked }: ResultListProps) => {
  const robot = useRobot();
  const [explained, setExplained] = useState<string | null>(null);
  // Looked up again every time, so the window goes with a result that left the list.
  const at = results.findIndex((result) => result.id === explained);

  const explain = (id: string) => {
    if (id !== explained) robot.notify({ kind: 'pressed', what: 'why' });
    setExplained(id);
  };

  return (
    <>
      {results.map((result) => (
        <VideoCard
          key={result.id}
          data={result}
          explaining={result.id === explained}
          onWhy={asked && hasReasons(result) ? () => explain(result.id) : undefined}
        />
      ))}

      {asked && at >= 0 && (
        <Why
          key={explained}
          data={results[at]}
          asked={asked}
          place={at + 1}
          onClose={() => setExplained(null)}
        />
      )}
    </>
  );
};
