import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
const Context = createContext(true);
export const useLowMotion = () => useContext(Context);
export default function MotionPolicy({ children }: { children: ReactNode }) {
  // Both server and hydration begin with static artwork; effects opt capable devices in.
  const [lowMotion, setLowMotion] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)");
    const update = () => startTransition(() => setLowMotion(query.matches || document.hidden));
    update();
    query.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => { query.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  return <Context.Provider value={lowMotion}><MotionConfig reducedMotion={lowMotion ? "always" : "user"}>{children}</MotionConfig></Context.Provider>;
}
