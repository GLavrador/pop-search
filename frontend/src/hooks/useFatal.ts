import { useCallback, useState } from 'react';

/** Lets an event handler bring the program down the way a broken render would. */
export const useFatal = () => {
  const [, raise] = useState(null);

  return useCallback(
    (error: Error) =>
      raise(() => {
        throw error;
      }),
    [],
  );
};
