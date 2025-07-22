"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, CheckCircle, AlertCircle, X, Network } from 'lucide-react';

interface NetworkSwitchNotificationProps {
  isVisible: boolean;
  networkName: string;
  status: 'switching' | 'success' | 'error';
  onClose: () => void;
}

const NetworkSwitchNotification: React.FC<NetworkSwitchNotificationProps> = ({
  isVisible,
  networkName,
  status,
  onClose
}) => {
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  // Add viewport height detection for mobile devices
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'switching':
        return (
          <div className="relative w-full h-full">
            <Wifi className="w-full h-full text-blue-500 animate-pulse" />
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-ping"></div>
          </div>
        );
      case 'success':
        return (
          <div className="relative w-full h-full">
            <CheckCircle className="w-full h-full text-green-500" />
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        );
      case 'error':
        return (
          <div className="relative w-full h-full">
            <AlertCircle className="w-full h-full text-red-500" />
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'switching':
        return (
          <>
            <span className="block sm:inline">Switching to </span>
            <span className="font-semibold text-blue-600">{networkName}</span>
            <span className="hidden sm:inline">...</span>
          </>
        );
      case 'success':
        return (
          <>
            <span className="block sm:inline">Successfully switched to </span>
            <span className="font-semibold text-green-600">{networkName}</span>
          </>
        );
      case 'error':
        return (
          <>
            <span className="block sm:inline">Failed to switch to </span>
            <span className="font-semibold text-red-600">{networkName}</span>
          </>
        );
    }
  };

  const getStatusColors = () => {
    switch (status) {
      case 'switching':
        return {
          border: 'border-blue-300',
          background: 'bg-gradient-to-r from-blue-50 to-blue-100',
          textPrimary: 'text-blue-900',
          textSecondary: 'text-blue-700',
          shadow: 'shadow-blue-200/50'
        };
      case 'success':
        return {
          border: 'border-green-300',
          background: 'bg-gradient-to-r from-green-50 to-green-100',
          textPrimary: 'text-green-900',
          textSecondary: 'text-green-700',
          shadow: 'shadow-green-200/50'
        };
      case 'error':
        return {
          border: 'border-red-300',
          background: 'bg-gradient-to-r from-red-50 to-red-100',
          textPrimary: 'text-red-900',
          textSecondary: 'text-red-700',
          shadow: 'shadow-red-200/50'
        };
    }
  };

  const colors = getStatusColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay for better visibility - responsive */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 sm:bg-black/10 z-[9998] pointer-events-none"
          />
          
          {/* Main notification */}
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.6
            }}
            className="
              fixed z-[9999]
              top-4 left-4 right-4
              sm:top-6 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2
              md:top-8
              sm:w-auto sm:max-w-md md:max-w-lg lg:max-w-xl
              landscape:top-2
            "
            style={{ 
              paddingTop: 'max(0px, env(safe-area-inset-top))',
            }}
          >
            <div className={`
              ${colors.border} ${colors.background} ${colors.shadow}
              border-2 rounded-xl sm:rounded-2xl 
              p-4 sm:p-5 md:p-6 
              landscape:p-3 landscape:rounded-lg
              shadow-lg sm:shadow-xl md:shadow-2xl 
              backdrop-blur-md ring-1 ring-black/5
              w-full
            `}>
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Responsive icon */}
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9">
                    {getStatusIcon()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header with responsive text */}
                  <div className="flex items-center gap-2 mb-1">
                    <Network className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textPrimary}`} />
                    <p className={`
                      text-sm sm:text-base md:text-lg font-bold ${colors.textPrimary}
                      truncate
                    `}>
                      Network Switch
                    </p>
                  </div>
                  
                  {/* Message with responsive text */}
                  <p className={`
                    text-sm sm:text-base md:text-lg font-medium ${colors.textSecondary} 
                    leading-relaxed break-words
                  `}>
                    {getStatusMessage()}
                  </p>
                  
                  {/* Progress bar for switching state */}
                  {status === 'switching' && (
                    <div className="mt-3">
                      <div className="w-full bg-blue-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Close button with responsive sizing */}
                {status !== 'switching' && (
                  <button
                    onClick={onClose}
                    className={`
                      ${colors.textSecondary} hover:${colors.textPrimary} 
                      transition-colors p-1.5 sm:p-2 rounded-full hover:bg-white/50
                      flex-shrink-0
                    `}
                    aria-label="Close notification"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>
              
              {/* Status indicator dots with responsive spacing */}
              <div className="flex justify-center mt-3 sm:mt-4 gap-1.5 sm:gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={`
                      w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full 
                      ${status === 'switching' ? 'bg-blue-400' : 
                        status === 'success' ? 'bg-green-400' : 'bg-red-400'}
                    `}
                    animate={{
                      opacity: status === 'switching' ? [0.3, 1, 0.3] : 1,
                      scale: status === 'switching' ? [0.8, 1.2, 0.8] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: status === 'switching' ? Infinity : 0,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NetworkSwitchNotification;
