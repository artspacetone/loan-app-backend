import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, id, error, options, className, ...props }) => {
  const baseClasses = "block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const normalClasses = "border-gray-300 focus:ring-primary focus:border-primary";
  const errorClasses = "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`${baseClasses} ${error ? errorClasses : normalClasses} ${className}`}
        {...props}
      >
        <option value="">Select {label || 'an option'}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
