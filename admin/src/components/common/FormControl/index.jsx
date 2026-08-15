export default function FormControl({
  name = '',
  type = 'text',
  label = '',
  required = false,
  value = '',
  placeholder = '',
  onChange = () => {},
  error = '',
  className = '',
  disabled = false,
  minLength = '',
  maxLength = '',
  autoComplete = 'off',
}) {
  return (
    <div className="formWrapper relative w-full">
      {label ? (
        <label className="text-[14px] font-[500] mb-1 block text-white/80">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <input
        type={type}
        name={name}
        value={value || ''}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`relative bg-[#131318] w-full text-sm text-white rounded-lg h-11 flex items-center gap-2 overflow-hidden border border-white/10 focus-within:border-blue-400/50 transition-colors !outline-none px-4 ${className} ${
          disabled ? 'bg-white/5 cursor-not-allowed opacity-60' : ''
        }`}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />

      {error ? <div className="text-red-500 text-xs mt-1">{error}</div> : null}
    </div>
  );
}
