import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const POLLINATIONS_BASE = 'https://pollinations.ai/p/';
const TTS_VOICE = 'en-US-Male-1'; // Константа голоса (Pollinations поддерживают разные голоса)

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
export const generateTTS = (text) => {
  const encodedText = encodeURIComponent(text);
  // Используем бесплатный TTS эндпоинт от Pollinations
  return `https://text-to-speech-api.pollinations.ai/tts?text=${encodedText}&voice=${TTS_VOICE}`;
};

/**
 * Sends a generation request to SiliconFlow
 */
export const generateVideoSegment = async (imageRef, motionPrompt, apiKey) => {
  if (!apiKey) throw new Error('API Key missing');

  try {
    const response = await axios.post(
      'https://api.siliconflow.cn/v1/video/generations',
      {
        model: 'THUDM/CogVideoX-5B',
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
    return response.data;
  } catch (error) {
    console.error('Video Generation Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Client-side video stitching using FFmpeg.wasm
 */
export const stitchVideos = async (videoUrls, onProgress) => {
  const ffmpeg = new FFmpeg();
  
  onProgress('Loading FFmpeg...', 10);
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  onProgress('Downloading segments...', 30);

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

  onProgress('Stitching videos...', 60);

  // Run concat command
  // Note: CogVideoX files should have the same encoding, so -c copy is fast and reliable
  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp4']);

  onProgress('Finalizing export...', 90);

  const data = await ffmpeg.readFile('output.mp4');
  const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

  onProgress('Done!', 100);
  return url;
};
