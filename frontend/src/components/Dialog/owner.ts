import { createContext, useContext } from 'react';

/** Whether the window a dialog belongs to is on screen. One that belongs to none always is. */
export const OwnerContext = createContext(true);

export const useOwnerShown = () => useContext(OwnerContext);
