import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmModal = ({ isOpen, title = 'Are you sure?', message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center mb-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mr-4">
            <FiAlertTriangle className="text-red-500 text-2xl" />
          </span>
          <span className="font-bold text-lg text-gray-800">{title}</span>
        </div>
        <div className="mb-6 text-gray-700">{message}</div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.18s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
