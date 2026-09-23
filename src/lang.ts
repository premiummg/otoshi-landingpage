import { createContext, useContext } from 'react';
import { EN, type Copy } from './copy';

export const LangCtx = createContext<Copy>(EN);
export const useT = () => useContext(LangCtx);
