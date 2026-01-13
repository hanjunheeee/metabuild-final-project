import { useState, forwardRef } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons'

const PasswordInput = forwardRef(function PasswordInput({ 
  id = 'password', 
  name,
  label = '비밀번호', 
  placeholder = '••••••••',
  required = false,
  maxLength,
  rightLink = null,
  defaultValue = '',
  value,
  onChange
}, ref) {
  const [showPassword, setShowPassword] = useState(false)

  // controlled vs uncontrolled 지원
  const inputProps = value !== undefined 
    ? { value, onChange } 
    : { defaultValue }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-sm text-gray-700">
          {label}
        </label>
        {rightLink}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          {...inputProps}
          className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sub-bg"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
})

export default PasswordInput
