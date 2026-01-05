import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons'

function PasswordInput({ 
  id = 'password', 
  name,
  label = '비밀번호', 
  placeholder = '••••••••',
  required = false,
  rightLink = null
}) {
  const [showPassword, setShowPassword] = useState(false)

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
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
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
}

export default PasswordInput

