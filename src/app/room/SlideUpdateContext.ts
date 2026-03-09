import { createContext } from "react";

export const SlideUpdateContext = createContext({ isSlidesVisible: true, rerender: () => {} });
