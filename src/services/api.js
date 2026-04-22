import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const POLLINATIONS_TEXT_URL = 'https://text.pollinations.ai/';

// Available System Voices (will be populated dynamically if possible, 
// but we define labels for UI consistency)
export const VOICE_OPTIONS = [
  { id: 'neural-male', label: 'Pro Male (Neural)', lang: 'ru' },
  { id: 'neural-female', label: 'Pro Female (Neural)', lang: 'ru' },
];

/**
 * Generates an image URL from Pollinations.ai
 */
export const generateImage = (prompt) => {
  const encodedPrompt = encodeURIComponent(prompt);
  // Using 1024x576 for cinematic aspect ratio
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&seed=${Math.floor(Math.random() * 10000)}&model=flux&nologo=true`;
};

/**
 * Generates a TTS audio using Web Speech API (Always Free & Natural)
 */
export const generateTTS = (text, voiceType = 'neural-male') => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('TTS not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Find a good Russian voice (prioritize Neural/Google/Microsoft)
    const ruVoices = voices.filter(v => v.lang.startsWith('ru'));
    let selectedVoice = ruVoices.find(v => 
      v.name.toLowerCase().includes('google') || 
      v.name.toLowerCase().includes('neural') || 
      v.name.toLowerCase().includes('natural')
    ) || ruVoices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Generates a scenario (scenes) without an API key using Pollinations Text
 */
export const generateScenario = async (idea, style, personCount) => {
  const systemPrompt = `You are a cinematic screenwriter. Generate a JSON array of 5 scenes for a video.
Style: ${style}
Number of people: ${personCount}

Output ONLY a RAW JSON array. NO markdown blocks.
[
  {
    "image_prompt": "Detailed visual description (English)",
    "voice_text": "Narration text (Russian)",
    "scene_name": "Short title"
  }
]`;

  const extractJSON = (text) => {
    try {
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        return JSON.parse(text.substring(jsonStart, jsonEnd));
      }
      // Try object if array fails
      const objStart = text.indexOf('{');
      const objEnd = text.lastIndexOf('}') + 1;
      if (objStart !== -1 && objEnd > objStart) {
        const obj = JSON.parse(text.substring(objStart, objEnd));
        return Array.isArray(obj.scenes) ? obj.scenes : (Array.isArray(obj) ? [obj] : [obj]);
      }
    } catch (e) {
      console.error('JSON Extraction Partial Failure:', e);
    }
    return null;
  };

  try {
    // Attempt 1: OpenAI-compatible POST (Better for complex instructions)
    try {
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Idea: ${idea}` }
          ],
          model: 'openai',
          json: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        const scenes = extractJSON(content);
        if (scenes) return scenes;
      }
    } catch (e) {
      console.warn('POST Scenario failed, falling back to GET...', e);
    }

    // Attempt 2: Simple GET Fallback
    const fullPrompt = `${systemPrompt}\n\nProject Idea: ${idea}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt.substring(0, 1500))}?json=true`;
    
    const response = await fetch(url);
    const content = await response.text();
    const scenes = extractJSON(content);
    
    if (scenes) return scenes;
    throw new Error('No valid scenario generated after fallback');
  } catch (error) {
    console.error('Scenario Generation Final Error:', error);
    throw error;
  }
};

/**
 * Generates a video segment. Fallbacks to a static image with motion metadata if 401.
 */
export const generateVideoSegment = async (imageRef, motionPrompt) => {
  try {
    const encodedPrompt = encodeURIComponent(motionPrompt);
    // Pollinations Video API using p-video (Wan-based)
    const url = `https://gen.pollinations.ai/video/${encodedPrompt}?seed=${Math.floor(Math.random() * 10000)}&model=p-video`;
    
    const response = await fetch(url);
    
    // Status 401 means they gated the API. We fallback to "Motion Image".
    if (response.status === 401) {
      console.warn('Video API 401 - Falling back to Motion Image');
      return { 
        url: generateImage(motionPrompt), 
        isMotion: true 
      };
    }

    if (!response.ok) throw new Error(`Video gen failed: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('video')) {
       throw new Error(`Invalid content type: ${contentType}`);
    }

    const videoBlob = await response.blob();
    return { 
      url: URL.createObjectURL(videoBlob), 
      isMotion: false 
    };
  } catch (error) {
    console.warn('Video Generation Error, using fallback:', error);
    return { 
      url: generateImage(motionPrompt), 
      isMotion: true 
    };
  }
};

/**
 * Placeholder for polling logic (deprecated in Free Mode since Pollinations is sync)
 */
export const getVideoStatus = async (requestId) => {
  // Not used in direct blob mode, but kept for interface compatibility
  return { status: 'Succeed' };
};

/**
 * Client-side video stitching using FFmpeg.wasm
 */
/**
 * Client-side video stitching using FFmpeg.wasm.
 * Supports both real MP4 segments and "Motion Images" (JPEG/PNG).
 */
export const stitchVideos = async (segments, onProgress) => {
  const ffmpeg = new FFmpeg();
  onProgress('Загрузка FFmpeg...', 10);
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  onProgress('Подготовка потоков...', 30);

  const concatList = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isImage = segment.isMotion || !segment.url.includes('blob:');
    const inputName = `input${i}.${isImage ? 'jpg' : 'mp4'}`;
    const outputName = `segment${i}.mp4`;

    await ffmpeg.writeFile(inputName, await fetchFile(segment.url));

    if (isImage) {
      onProgress(`Анимация кадра ${i+1}...`, 30 + (i / segments.length * 30));
      // Convert Image to a 3s video with Cinematic Zoom ("Ken Burns")
      // We use a safe version of zoompan that works in most FFmpeg.wasm builds
      await ffmpeg.exec([
        '-loop', '1', 
        '-i', inputName, 
        '-vf', "scale=1280:720,zoompan=z='min(zoom+0.0015,1.5)':d=75:x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':s=1280x720", 
        '-c:v', 'libx264', 
        '-t', '3', 
        '-pix_fmt', 'yuv420p', 
        outputName
      ]);
    } else {
      // It's already a video, just copy/transcode to ensure consistency
       await ffmpeg.exec([
        '-i', inputName, 
        '-vf', 'scale=1280:720', 
        '-c:v', 'libx264', 
        '-t', '3', 
        '-pix_fmt', 'yuv420p', 
        outputName
      ]);
    }
    concatList.push(`file '${outputName}'`);
  }

  await ffmpeg.writeFile('concat.txt', concatList.join('\n'));

  onProgress('Финальная склейка...', 80);
  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp4']);

  onProgress('Финализация...', 95);
  const data = await ffmpeg.readFile('output.mp4');
  onProgress('Готово!', 100);
  return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
};

