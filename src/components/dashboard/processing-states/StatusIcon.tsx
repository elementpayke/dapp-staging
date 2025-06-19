import { motion } from "framer-motion";

export const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === "processing") {
    return (
      <div className="relative">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute inset-0 rounded-full border-4 border-blue-500 opacity-0"
            animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.4, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-100 opacity-70"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ rotate: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }, scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } }}
        >
          <span className="w-12 h-12 block text-blue-600">🔄</span>
        </motion.div>
      </div>
    );
  }
  if (status === "success") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="bg-green-100 rounded-full p-4 relative"
      >
        <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
          <motion.path d="M22 4L12 14.01l-3-3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.7 }} />
        </svg>
        <motion.div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(74,222,128,0) 70%)" }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1.2 }} transition={{ duration: 0.8, delay: 0.9 }} />
      </motion.div>
    );
  }
  return null;
};
