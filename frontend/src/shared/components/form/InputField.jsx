import { forwardRef } from 'react'

const InputField = forwardRef(({ 
  label, 
  type = 'text', 
  error, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 
                   focus:outline-none focus:ring-2 focus:ring-main-bg focus:border-transparent
                   text-gray-700 placeholder-gray-400 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

InputField.displayName = 'InputField'

export default InputField

