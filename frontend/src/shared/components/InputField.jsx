function InputField({ 
  id, 
  name,
  label, 
  type = 'text', 
  placeholder, 
  required = false,
  className = ''
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        name={name || id}
        type={type}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sub-bg ${className}`}
      />
    </div>
  )
}

export default InputField

