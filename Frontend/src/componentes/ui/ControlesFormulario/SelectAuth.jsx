import { RiShieldUserLine } from "react-icons/ri";

export const SelectAuth = ({ 
  name, 
  value, 
  onChange, 
  options = [], 
  placeholder, 
  required = false 
}) => {
  return (
    <div className="relative">
      <RiShieldUserLine className="absolute top-1/2 -translate-y-1/2 left-3 text-yellow-400" />
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2.5 bg-zinc-700 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none appearance-none"
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};