import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const POLLINATIONS_BASE = 'https://pollinations.ai/p/';

// Available voices mapping
export const VOICE_OPTIONS = [
  { id: 'ru-RU-Male-1', label: 'Пушкин (RU)', lang: 'ru' },
  { id: 'ru-RU-Female-1', label: 'Алина (RU)', lang: 'ru' },
  { id: 'en-US-Male-1', label: 'George (EN)', lang: 'en' },
  { id: 'en-US-Female-1', label: 'Alice (EN)', lang: 'en' },
];

/**
 * Generates an image URL from Pollinations.ai
 */
export const generateImage = (prompt) => {
  const encodedPrompt = encodeURIComponent(prompt);
  return `${POLLINATIONS_BASE}${encodedPrompt}?width=1024&height=576&seed=${Math.floor(Math.random() * 10000)}&model=flux`;
};

/**
 * Generates a TTS audio URL
 */
export const generateTTS = (text, voiceId = 'ru-RU-Male-1') => {
  const encodedText = encodeURIComponent(text);
  return `https://text-to-speech-api.pollinations.ai/tts?text=${encodedText}&voice=${voiceId}`;
};

/**
 * Generates a scenario (scenes) from an idea using DeepSeek-V3
 */
export const generateScenario = async (idea, style, personCount, apiKey) => {
  if (!apiKey) throw new Error('API Key missing');

  const systemPrompt = `You are a cinematic screenwriter. 
Generate a JSON array of 5 scenes for a video based on the user's idea and style.
Style: ${style}
Number of people in frame: ${personCount}

Output ONLY a JSON array with this structure:
[
  {
    "image_prompt": "Detailed visual description for image generation (English)",
    "voice_text": "Narration text for this scene (Russian)",
    "scene_name": "Short scene title"
  }
]
Keep image_prompts in English for better AI performance. Keep voice_text in Russian.
Translate the visual style '${style}' into architectural and lighting details.`;

  try {
    const response = await axios.post(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Idea: ${idea}` }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // DeepSeek might return a nested object if we asked for json_object, 
    // or just the string if we asked for a list. Let's handle the string parsing.
    const content = response.data.choices[0].message.content;
    const scenes = JSON.parse(content);
    // If it's wrapped in an object like { "scenes": [...] }
    return Array.isArray(scenes) ? scenes : (scenes.scenes || []);
  } catch (error) {
    console.error('Scenario Generation Error:', error);
    throw error;
  }
};

export const generateVideoSegment = async (imageRef, motionPrompt, apiKey) => {
  if (!apiKey) throw new Error('API Key missing');

  try {
    const response = await axios.post(
      'https://api.siliconflow.cn/v1/video/submit',
      {
        model: 'THUDM/CogVideoX-5b',
        prompt: motionPrompt,
        image_url: imageRef,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    // Returns { requestId: "..." }
    return response.data;
  } catch (error) {
    console.error('Video Submission Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Polls for video generation status
 */
export const getVideoStatus = async (requestId, apiKey) => {
  try {
    const response = await axios.post(
      'https://api.siliconflow.cn/v1/video/status',
      { requestId },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Video Status Polling Error:', error);
    throw error;
  }
};

/**
 * Client-side video stitching using FFmpeg.wasm
 */
export const stitchVideos = async (videoUrls, onProgress) => {
  const ffmpeg = new FFmpeg();
  
  onProgress('Загрузка инструментов...', 10);
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  onProgress('Скачивание фрагментов...', 30);

  // Write files to FFmpeg virtual FS
  const inputFiles = [];
  for (let i = 0; i < videoUrls.length; i++) {
    const fileName = `input${i}.mp4`;
    await ffmpeg.writeFile(fileName, await fetchFile(videoUrls[i]));
    inputFiles.push(`file '${fileName}'`);
  }

  // Create concat list
  const concatList = inputFiles.join('\n');
  await ffmpeg.writeFile('concat.txt', concatList);

  onProgress('Склейка видео...', 60);

  // Run concat command
  // Note: CogVideoX files should have the same encoding, so -c copy is fast and reliable
  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp4']);

  onProgress('Завершение экспорта...', 90);

  const data = await ffmpeg.readFile('output.mp4');
  const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

  onProgress('Готово!', 100);
  return url;
};
