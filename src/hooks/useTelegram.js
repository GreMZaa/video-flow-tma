import { useEffect, useState } from 'react';

const tg = window.Telegram?.WebApp;

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Disable vertical swipes to prevent accidental app minimize/collapse on iOS
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      
      // Enable closing confirmation to prevent accidental swipes closing the app
      tg.enableClosingConfirmation();

      // Final aggressive expand attempts
      const intervals = [100, 300, 600, 1000].map(ms => 
        setTimeout(() => tg.expand(), ms)
      );

      setIsReady(true);
      return () => intervals.forEach(clearTimeout);
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
