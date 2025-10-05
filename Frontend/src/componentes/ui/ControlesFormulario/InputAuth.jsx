import { RiMailLine, RiLockLine, RiUserLine, RiBodyScanLine, RiRulerLine, RiCalendarLine, RiShieldUserLine } from "react-icons/ri";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";

export const InputAuth = ({ 
  type = "text", 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  icon: Icon, 
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
  ...props 
}) => {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute top-1/2 -translate-y-1/2 left-3 text-yellow-400" />}
      <input
        type={showPassword ? "text" : type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2.5 bg-zinc-700 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
        placeholder={placeholder + (required ? " *" : "")}
        required={required}
        {...props}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute top-1/2 -translate-y-1/2 right-3 text-yellow-400 hover:text-yellow-400"
        >
          {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
        </button>
      )}
    </div>
  );
};