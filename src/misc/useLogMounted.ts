import { useEffect, useRef } from "preact/hooks";

export function useLogMount(msg?: string) {
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      console.log('[mount]', msg);
    }
    return () => console.log('[unmount]', msg);
  }, []);
}