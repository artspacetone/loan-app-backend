import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  Icon?: React.ElementType; // For Heroicons or other SVG components
}

const Input: React.FC<InputProps> = ({ label, id, error, Icon, className, ...props }) => {
  const baseClasses = "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const normalClasses = "border-gray-300 focus:ring-primary focus:border-primary";
  const errorClasses = "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500";
  const iconPadding = Icon ? "pl-10" : "";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
        )}
        <input
          id={id}
          className={`${baseClasses} ${error ? errorClasses : normalClasses} ${iconPadding} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
