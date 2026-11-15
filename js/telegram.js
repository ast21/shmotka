// Shmotka × Telegram Mini App.
// Тема Telegram (светлая/тёмная) становится темой Shmotka, цвет кнопки Telegram — акцентом,
// а шапка и фон окна Telegram красятся в фон Shmotka. Следит за сменой темы в Telegram.
//
//   import { connectTelegram } from 'shmotka/telegram';
//   connectTelegram();                              // акцент — цвет кнопки Telegram
//   connectTelegram({ telegramAccent: false });     // акцент проекта (data-accent / --shm-accent)

/**
 * @param {object} [options]
 * @param {boolean} [options.telegramAccent=true] брать акцент из цвета кнопки Telegram
 * @param {boolean} [options.paintChrome=true] красить шапку и фон окна Telegram в фон Shmotka
 * @param {any} [options.webApp] объект Telegram.WebApp (по умолчанию window.Telegram.WebApp)
 * @param {Document} [options.document]
 * @returns {() => void} отключить слежение за темой
 */
export function connectTelegram(options = {}) {
  const {
    telegramAccent = true,
    paintChrome = true,
    webApp = globalThis.Telegram?.WebApp,
    document: doc = globalThis.document,
  } = options;
  if (!webApp || !doc) return () => {};

  const apply = () => {
    const root = doc.documentElement;
    root.dataset.theme = webApp.colorScheme === 'light' ? 'shmotka-light' : 'shmotka-dark';

    const p = webApp.themeParams || {};
    for (const name of ['--shm-accent', '--shm-accent-light', '--shm-accent-fg']) root.style.removeProperty(name);
    if (telegramAccent && p.button_color) {
      // Telegram already gives the button colour for the current scheme: use it in both themes.
      root.style.setProperty('--shm-accent', p.button_color);
      root.style.setProperty('--shm-accent-light', p.button_color);
      if (p.button_text_color) root.style.setProperty('--shm-accent-fg', p.button_text_color);
    }

    if (paintChrome && globalThis.getComputedStyle) {
      const bg = globalThis.getComputedStyle(root).getPropertyValue('--shm-bg').trim();
      if (/^#[0-9a-f]{6}$/i.test(bg)) {
        webApp.setHeaderColor?.(bg);
        webApp.setBackgroundColor?.(bg);
      }
    }
  };

  apply();
  webApp.onEvent?.('themeChanged', apply);
  return () => webApp.offEvent?.('themeChanged', apply);
}
