import React from 'react';
import { motion } from 'framer-motion';

const SavingSpinner = ({ message = 'Saving...', size = 'medium' }) => {
  const spinnerSizes = {
    small: { container: 'w-4 h-4', border: 'border-2' },
    medium: { container: 'w-5 h-5', border: 'border-2' },
    large: { container: 'w-6 h-6', border: 'border-2' }
  };

  const { container, border } = spinnerSizes[size] || spinnerSizes.medium;

  return (
    <motion.div 
      className="flex items-center space-x-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <div className={`${container} ${border} border-white/30 rounded-full`}></div>
        <div className={`absolute top-0 left-0 ${container} ${border} border-white rounded-full animate-spin border-t-transparent`}></div>
      </div>
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
};

export default SavingSpinner;