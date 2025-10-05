// componentes/Notification.jsx
import React, { useEffect, useState } from 'react';
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiCloseLine
} from 'react-icons/ri';

const Notification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification && notification.type && notification.message) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  // Si no hay notificación, no renderizar nada
  if (!notification || !notification.type || !notification.message || !isVisible) {
    return null;
  }

  const getConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: RiCheckboxCircleLine,
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
      case 'error':
        return {
          icon: RiErrorWarningLine,
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
      case 'info':
        return {
          icon: RiInformationLine,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
      default:
        return {
          icon: RiInformationLine,
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
    }
  };

  const config = getConfig(notification.type);
  const Icon = config.icon;

  return (
    <div 
      className="fixed top-24 right-4 z-[9999]"
      style={{ zIndex: 9999 }}
    >
      <div className={`
        ${config.bgColor} ${config.textColor} 
        px-4 py-3 rounded-lg shadow-xl 
        flex items-center gap-3 min-w-[320px] max-w-[400px]
        transform transition-all duration-300 ease-in-out
        animate-slide-in-right
      `}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
        <span className="flex-1 text-sm font-medium">
          {notification.message}
        </span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded transition-colors"
        >
          <RiCloseLine className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Notification;