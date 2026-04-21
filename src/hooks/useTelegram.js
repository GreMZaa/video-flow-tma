import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState(window.Telegram?.WebApp);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If not found yet, poll for it (useful in dev and slow networks)
    const initTg = () => {
      const currentTg = window.Telegram?.WebApp;
      if (currentTg) {
        setTg(currentTg);
        currentTg.ready();
        currentTg.expand();
        if (currentTg.disableVerticalSwipes) currentTg.disableVerticalSwipes();
        currentTg.enableClosingConfirmation();
        
        const handleViewport = () => {
          if (!currentTg.isExpanded) currentTg.expand();
        };
        currentTg.onEvent('viewportChanged', handleViewport);
        setIsReady(true);
        
        return () => {
          currentTg.offEvent('viewportChanged', handleViewport);
        };
      }
    };

    if (!tg) {
      const interval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          initTg();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      return initTg();
    }
  }, [tg]);

  const onClose = () => {
    tg?.close();
  };

  const showAlert = (message) => {
    tg?.showAlert(message);
  };

  const showHaptic = (type = 'light') => {
    if (!tg) return;
    switch (type) {
      case 'light': tg.HapticFeedback.impactOccurred('light'); break;
      case 'medium': tg.HapticFeedback.impactOccurred('medium'); break;
      case 'heavy': tg.HapticFeedback.impactOccurred('heavy'); break;
      case 'success': tg.HapticFeedback.notificationOccurred('success'); break;
      case 'error': tg.HapticFeedback.notificationOccurred('error'); break;
      default: tg.HapticFeedback.impactOccurred('light'); break;
    }
  };

  return {
    tg,
    onClose,
    showAlert,
    showHaptic,
    user: tg?.initDataUnsafe?.user,
    queryId: tg?.initDataUnsafe?.query_id,
    isReady,
    themeParams: tg?.themeParams,
  };
};
