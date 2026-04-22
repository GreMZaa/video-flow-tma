import { useEffect, useRef, useState } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState(window.Telegram?.WebApp || null);
  const [isReady, setIsReady] = useState(false);
  // Store the current callback ref to avoid stacking listeners
  const mainButtonCallbackRef = useRef(null);

  useEffect(() => {
    const initTg = () => {
      const currentTg = window.Telegram?.WebApp;
      if (!currentTg) return;

      setTg(currentTg);

      currentTg.ready();
      currentTg.expand();

      // Lock pull-to-close gesture
      if (currentTg.disableVerticalSwipes) {
        try { currentTg.disableVerticalSwipes(); } catch (e) { /* no-op on older SDK */ }
      }

      // Prevent accidental app close
      try { currentTg.enableClosingConfirmation(); } catch (e) { /* no-op */ }

      // Theme sync
      try {
        if (currentTg.setHeaderColor) currentTg.setHeaderColor('#050505');
        if (currentTg.setBackgroundColor) currentTg.setBackgroundColor('#050505');
      } catch (e) { /* no-op */ }

      setIsReady(true);
    };

    if (!tg) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.Telegram?.WebApp) {
          initTg();
          clearInterval(interval);
        }
        if (attempts > 50) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    } else {
      return initTg();
    }
  }, [tg]);

  // ─── MainButton ────────────────────────────────────────────────────────────

  const showMainButton = (text, onClick) => {
    const btn = tg?.MainButton;
    if (!btn) return;

    // Remove previous listener to prevent stacking
    if (mainButtonCallbackRef.current) {
      btn.offClick(mainButtonCallbackRef.current);
    }

    mainButtonCallbackRef.current = onClick;
    btn.setText(text);
    btn.onClick(onClick);
    btn.color = tg?.themeParams?.button_color || '#38bdf8';
    btn.textColor = tg?.themeParams?.button_text_color || '#ffffff';
    btn.show();
  };

  const hideMainButton = () => {
    const btn = tg?.MainButton;
    if (!btn) return;
    if (mainButtonCallbackRef.current) {
      btn.offClick(mainButtonCallbackRef.current);
      mainButtonCallbackRef.current = null;
    }
    btn.hide();
  };

  const setMainButtonLoading = (isLoading) => {
    const btn = tg?.MainButton;
    if (!btn) return;
    if (isLoading) {
      btn.showProgress(false); // false = don't hide text
      btn.disable();
    } else {
      btn.hideProgress();
      btn.enable();
    }
  };

  // ─── Alerts & Confirms ─────────────────────────────────────────────────────

  const showAlert = (message) => {
    if (tg) tg.showAlert(message);
    else alert(message);
  };

  const showConfirm = (message, callback) => {
    if (tg?.showConfirm) {
      tg.showConfirm(message, callback);
    } else {
      // eslint-disable-next-line no-restricted-globals
      callback(confirm(message));
    }
  };

  // ─── Haptic Feedback ────────────────────────────────────────────────────────

  const showHaptic = (type = 'light') => {
    const hf = tg?.HapticFeedback;
    if (!hf) return;
    try {
      switch (type) {
        case 'light':   hf.impactOccurred('light');   break;
        case 'medium':  hf.impactOccurred('medium');  break;
        case 'heavy':   hf.impactOccurred('heavy');   break;
        case 'success': hf.notificationOccurred('success'); break;
        case 'warning': hf.notificationOccurred('warning'); break;
        case 'error':   hf.notificationOccurred('error');   break;
        case 'select':  hf.selectionChanged();               break;
        default:        hf.impactOccurred('light');   break;
      }
    } catch (e) {
      console.warn('[TMA] Haptics failed:', e);
    }
  };

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const onClose = () => tg?.close();

  const openLink = (url) => {
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank');
  };

  // ─── Return ─────────────────────────────────────────────────────────────────

  return {
    tg,
    isReady,
    onClose,
    openLink,
    showAlert,
    showConfirm,
    showHaptic,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    user: tg?.initDataUnsafe?.user,
    queryId: tg?.initDataUnsafe?.query_id,
    themeParams: tg?.themeParams,
    platform: tg?.platform || 'unknown',
    version: tg?.version || '0',
  };
};

/**
 * Declarative hook for Telegram MainButton
 * @param {string} text - Button text
 * @param {Function} onClick - Click handler
 * @param {boolean} visible - Visibility state
 * @param {boolean} loading - Loading state
 */
export const useMainButton = (text, onClick, visible = true, loading = false) => {
  const { tg, showMainButton, hideMainButton, setMainButtonLoading } = useTelegram();

  useEffect(() => {
    if (!tg) return;

    if (visible) {
      showMainButton(text, onClick);
    } else {
      hideMainButton();
    }

    return () => {
      // Logic inside useTelegram handles offClick
    };
  }, [tg, text, onClick, visible]);

  useEffect(() => {
    if (!tg) return;
    setMainButtonLoading(loading);
  }, [tg, loading]);
};
