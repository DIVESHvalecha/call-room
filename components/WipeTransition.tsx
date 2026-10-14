"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WipeTransition({ k }: { k: string }) {
  const [show, setShow] = useState(false);
  const [first, setFirst] = useState(true);

  useEffect(() => {
    if (first) {
      setFirst(false);
      return; // no wipe on initial load
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={k}
          initial={{
            clipPath: "polygon(-30% 0, -10% 0, -30% 100%, -50% 100%)",
            opacity: 1,
          }}
          animate={{
            clipPath: [
              "polygon(-30% 0, -10% 0, -30% 100%, -50% 100%)",
              "polygon(-10% 0, 110% 0, 90% 100%, -30% 100%)",
              "polygon(110% 0, 130% 0, 110% 100%, 90% 100%)",
            ],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.85, ease: "easeInOut", times: [0, 0.55, 1] }}
          className="pointer-events-none fixed inset-0 z-50"
          style={{ background: "var(--electric)" }}
        >
          <div className="absolute inset-y-0 right-0 w-2" style={{ background: "var(--volt)" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
