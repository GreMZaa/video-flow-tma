# Video Flow: Telegram Mini App

Минималистичное приложение для пошаговой генерации видео с озвучкой и браузерным монтажом.

## ✨ Возможности
- **Step-by-Step UI**: Интерфейс вдохновлен Google Flow.
- **Image Gen**: Pollinations.ai (Flux).
- **Video Gen**: SiliconFlow (CogVideoX).
- **TTS**: Озвучка кадров мужским голосом.
- **Browser Export**: Склейка всех видео-сегментов в один MP4 прямо в телефоне пользователя через FFmpeg.wasm.

## 🚀 Деплой (Vercel)

### 1. Создание бота в Telegram
1. Напишите [@BotFather](https://t.me/BotFather).
2. Используйте `/newbot`, чтобы создать бота.
3. Затем `/setmenubutton`, выберите вашего бота и отправьте ссылку на ваше задеплоенное приложение (см. шаг ниже).

### 2. Загрузка кода
Инициализируйте репозиторий и задеплойте его:

```powershell
# Инициализация git
git init
git add .
git commit -m "feat: initial commit for Video Flow"

# Создание репозитория через GitHub CLI (если установлен)
gh repo create video-flow-tma --public --source=. --remote=upstream

# Деплой на Vercel
npm install -g vercel
vercel --prod
```

> [!IMPORTANT]
> При деплое на Vercel обязательно используется файл `vercel.json`, который я подготовил. Он включает заголовки **COOP** и **COEP**, которые критически важны для работы FFmpeg в браузере.

## 🛠 Настройка
- Перейдите в настройки внутри Mini App и вставьте ваш **SILICON_FLOW_KEY**.
- Получить ключ можно бесплатно на [siliconflow.cn](https://siliconflow.cn/).

## 📦 Стек
- React + Tailwind CSS v4
- `@ffmpeg/ffmpeg` (Client-side video stitching)
- `framer-motion` (Fluid animations)
- `@twa-dev/sdk` (Telegram integration)
