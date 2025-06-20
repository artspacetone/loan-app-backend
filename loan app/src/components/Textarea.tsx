import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  const baseClasses = "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const normalClasses = "border-gray-300 focus:ring-primary focus:border-primary";
  const errorClasses = "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${baseClasses} ${error ? errorClasses : normalClasses} ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Textarea;
