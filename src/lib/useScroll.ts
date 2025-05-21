import { useEffect } from "react";

export const useLockBodyScroll = (isMenuOpen: boolean) => {
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.body.style.touchAction = "none";

      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.width = "";
    };
  }, [isMenuOpen]);
};
