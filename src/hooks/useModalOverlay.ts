"use client";

import { useEffect } from 'react';

/**
 * Hook to manage modal overlay state and hide dropdowns when modals are open
 * @param isOpen - Whether the modal is currently open
 */
export function useModalOverlay(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Add class to body to indicate modal is open
      document.body.classList.add('modal-overlay-open');
      
      // On mobile, also add a more specific class
      if (window.innerWidth <= 640) {
        document.body.classList.add('mobile-modal-open');
      }

      // Immediately hide all dropdown elements
      const dropdownElements = document.querySelectorAll('.z-dropdown');
      dropdownElements.forEach(element => {
        (element as HTMLElement).style.display = 'none';
      });

      // Also hide elements with specific z-index classes that might be dropdowns
      const lowZIndexElements = document.querySelectorAll('.z-10, .z-20, .z-30');
      lowZIndexElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        // Check if element looks like a dropdown (positioned absolutely/fixed and small)
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
          if (rect.width < window.innerWidth * 0.8 && rect.height < window.innerHeight * 0.8) {
            (element as HTMLElement).style.display = 'none';
          }
        }
      });
    } else {
      // Remove classes when modal is closed
      document.body.classList.remove('modal-overlay-open');
      document.body.classList.remove('mobile-modal-open');

      // Restore visibility of hidden dropdown elements
      const dropdownElements = document.querySelectorAll('.z-dropdown');
      dropdownElements.forEach(element => {
        (element as HTMLElement).style.display = '';
      });

      // Restore other elements we might have hidden
      const lowZIndexElements = document.querySelectorAll('.z-10, .z-20, .z-30');
      lowZIndexElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
          (element as HTMLElement).style.display = '';
        }
      });
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-overlay-open');
      document.body.classList.remove('mobile-modal-open');
      
      // Restore all elements
      const allElements = document.querySelectorAll('.z-dropdown, .z-10, .z-20, .z-30');
      allElements.forEach(element => {
        (element as HTMLElement).style.display = '';
      });
    };
  }, [isOpen]);
}
