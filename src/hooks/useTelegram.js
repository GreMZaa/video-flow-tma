import { useEffect, useState } from 'react';

const tg = window.Telegram?.WebApp;

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      
      tg.enableClosingConfirmation();

      // Listen to viewport changes and force expand if height looks like half-state
      const handleViewport = () => {
        console.log('Viewport Changed:', tg.viewportHeight, tg.isExpanded);
        if (!tg.isExpanded) tg.expand();
      };
      
      tg.onEvent('viewportChanged', handleViewport);

      const intervals = [100, 300, 600, 1000, 2000, 5000].map(ms => 
        setTimeout(() => {
          if (!tg.isExpanded) tg.expand();
        }, ms)
      );

      setIsReady(true);
      return () => {
        intervals.forEach(clearTimeout);
        tg.offEvent('viewportChanged', handleViewport);
      };
    }
  }, []);

  const onClose = () => {
    tg?.close();
  };

  const onToggleButton = () => {
    if (tg?.MainButton.isVisible) {
      tg?.MainButton.hide();
    } else {
      tg?.MainButton.show();
    }
  };

  const showAlert = (message) => {
    tg?.showAlert(message);
  };

  const showHaptic = (type = 'light') => {
    switch (type) {
      case 'light': tg?.HapticFeedback.impactOccurred('light'); break;
      case 'medium': tg?.HapticFeedback.impactOccurred('medium'); break;
      case 'heavy': tg?.HapticFeedback.impactOccurred('heavy'); break;
      case 'success': tg?.HapticFeedback.notificationOccurred('success'); break;
      case 'error': tg?.HapticFeedback.notificationOccurred('error'); break;
      default: tg?.HapticFeedback.impactOccurred('light'); break;
    }
  };

  return {
    onClose,
    onToggleButton,
    showAlert,
    showHaptic,
    tg,
    user: tg?.initDataUnsafe?.user,
    queryId: tg?.initDataUnsafe?.query_id,
    isReady,
    themeParams: tg?.themeParams,
  };
};
