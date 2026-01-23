import React from 'react';
import { motion } from 'framer-motion';

/**
 * Universal Spinner component for loading/saving/dashboard states.
 * Props:
 * - message: string (optional)
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - overlay: boolean (default: false)
 * - className: string (optional)
 */
const Spinner = ({ message = '', size = 'medium', overlay = false, className = '' }) => {
  const spinnerSizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2',
    large: 'w-10 h-10 border-4',
  };
  const spinnerClass = spinnerSizes[size] || spinnerSizes.medium;

  const spinner = (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className={`${spinnerClass} border-primary/30 rounded-full`}></div>
      <div className={`absolute top-0 left-0 ${spinnerClass} border-primary rounded-full animate-spin border-t-transparent`}></div>
      {message && <span className="text-sm font-medium mt-3 text-gray-600 text-center">{message}</span>}
    </div>
  );

  if (overlay) {
    return (
      <motion.div 
        className="fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {spinner}
      </motion.div>
    );
  }
  return spinner;
};

export default Spinner;
