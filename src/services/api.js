import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const POLLINATIONS_TEXT_URL = 'https://text.pollinations.ai/';

export const SCENARIO_SYSTEM_PROMPT = `You are an expert AI Video Director and Cinematic Screenwriter.
Your task is to generate a JSON array of exactly 5 scenes for a high-quality cinematic video based on the user's idea.

STRICT RULES:
1. Each scene MUST have:
   - "scene_name": A short, catchy title for the scene in Russian.
   - "image_prompt": A VERY detailed visual description in English. Include lighting (cinematic, volumetric), camera work (wide shot, tracking, close-up), and atmosphere. This prompt will be used by an AI video model.
   - "voice_text": The narration script for this scene in Russian. 1-2 impactful sentences.
2. The language for "scene_name" and "voice_text" is ALWAYS Russian.
3. The language for "image_prompt" is ALWAYS English.
4. Output ONLY the raw JSON array. No explanations, no markdown blocks.
5. Ensure the "image_prompt" SPECIFICALLY mentions the main subject and style from the user's idea (e.g. if the user says "Pushkin", the prompt MUST include "Alexander Pushkin").

Format:
[
  {
    "scene_name": "...",
    "image_prompt": "...",
    "voice_text": "..."
  }
]`;

// Available System Voices (will be populated dynamically if possible, 
// but we define labels for UI consistency)
// Available System Voices for SiliconFlow (CosyVoice)
export const VOICE_OPTIONS = [
  { id: 'FunAudioLLM/CosyVoice2-0.5B:alex', name: 'Алекс (Мужской)', lang: 'ru' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:benjamin', name: 'Бенджамин (Мужской)', lang: 'ru' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:anna', name: 'Анна (Женский)', lang: 'ru' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:bella', name: 'Белла (Женский)', lang: 'ru' },
  { id: 'neural-male', name: 'Системный Мужской', lang: 'ru' },
  { id: 'neural-female', name: 'Системный Женский', lang: 'ru' },
];

/**
 * Enhances a prompt for better image/video generation.
 * Translates from Russian to English and adds cinematic keywords.
 */
export const enhancePrompt = async (prompt) => {
  if (!prompt) return '';
  
  // Basic check if prompt is likely Russian (contains Cyrillic)
  const isRussian = /[а-яА-ЯёЁ]/.test(prompt);
  
  if (!isRussian && prompt.length > 50) return prompt; // Already detailed English

  try {
    const systemPrompt = `You are a prompt engineer. Transform the user's input into a high-quality, cinematic English prompt for an AI video model (Wan-AI/Wan2.1).
    - If the input is in Russian, translate it to English.
    - Add descriptive details about lighting, camera movement, and textures.
    - Keep it under 100 words.
    - Output ONLY the enhanced English prompt. No explanations.`;

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'openai'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const enhanced = data.choices[0].message.content.trim();
      return enhanced || prompt;
    }
  } catch (e) {
    console.warn('Prompt enhancement failed, using original:', e);
  }
  return prompt;
};

/**
 * Generates an image URL. Use SiliconFlow (Flux) if apiKey is present, 
 * otherwise fallback to Pollinations.
 */
export const generateImage = async (prompt, apiKey = null) => {
  if (apiKey && apiKey.startsWith('sk-')) {
    try {
      console.log('Generating image via SiliconFlow (Flux.1)...');
      const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: prompt,
          image_size: '1024x576',
          batch_size: 1,
          num_inference_steps: 4
        })
      });

      if (response.ok) {
        const data = await response.json();
        const url = data.images?.[0]?.url || data.data?.[0]?.url;
        if (url) return url;
      }
    } catch (e) {
      console.warn('SiliconFlow Image Gen failed, falling back to Pollinations:', e);
    }
  }

  const encodedPrompt = encodeURIComponent(prompt);
  // Using 1024x576 for cinematic aspect ratio
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&seed=${Math.floor(Math.random() * 10000)}&model=flux&nologo=true`;
};

/**
 * Generates a TTS audio. Use SiliconFlow (CosyVoice) if apiKey is present,
 * otherwise fallback to Web Speech API.
 */
export const generateTTS = async (text, voiceType = 'neural-male', apiKey = null) => {
  if (apiKey && apiKey.startsWith('sk-') && voiceType.includes(':')) {
    try {
      console.log('Generating TTS via SiliconFlow (CosyVoice)...');
      const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: voiceType.split(':')[0], // e.g. FunAudioLLM/CosyVoice2-0.5B
          input: text,
          voice: voiceType,
          response_format: 'mp3'
        })
      });

      if (response.ok) {
        // SiliconFlow returns a stream or a URL? Usually it's a binary stream for /audio/speech
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        return new Promise((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = (e) => reject(e);
          audio.play().catch(reject);
        });
      }
    } catch (e) {
      console.warn('SiliconFlow TTS failed, falling back to Web Speech API:', e);
    }
  }

  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('TTS not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Find a good Russian voice
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
/**
 * Helper to fetch with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const extractJSON = (text) => {
  if (!text) return null;
  console.log('Attempting to extract JSON from:', text.substring(0, 100) + '...');
  try {
    // 1. Remove markdown blocks and weird characters
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. Find the first '[' and last ']' for array
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']') + 1;
    
    if (start !== -1 && end > start) {
      const jsonStr = cleaned.substring(start, end);
      return JSON.parse(jsonStr);
    }

    // 3. Fallback: try to find an object and extract scenes array
    const objStart = cleaned.indexOf('{');
    const objEnd = cleaned.lastIndexOf('}') + 1;
    if (objStart !== -1 && objEnd > objStart) {
      const potentialObj = JSON.parse(cleaned.substring(objStart, objEnd));
      if (Array.isArray(potentialObj.scenes)) return potentialObj.scenes;
      if (Array.isArray(potentialObj.data)) return potentialObj.data;
      if (Array.isArray(potentialObj.items)) return potentialObj.items;
      if (Array.isArray(potentialObj)) return potentialObj;
      // If it's a single object that looks like a scene, wrap it
      if (potentialObj.image_prompt || potentialObj.voice_text) return [potentialObj];
    }
  } catch (e) {
    console.error('JSON Extraction Error:', e);
  }
  return null;
};

/**
 * Generates a scenario (scenes) without an API key using Pollinations Text
 */
    console.warn('Generating scenario for:', idea, 'Style:', style);
    
    // Create a dynamic fallback based on the idea
    const dynamicFallback = [
      {
        "image_prompt": `Cinematic shot of ${idea}, high detail, 8k, ${style || ''}`.trim(),
        "voice_text": `${idea}. Погружаемся в эту историю.`,
        "scene_name": "Начало"
      },
      {
        "image_prompt": `Close up of ${idea}, emotional atmosphere, ${style || ''}`.trim(),
        "voice_text": "Каждое мгновение здесь наполнено особым смыслом.",
        "scene_name": "Развитие"
      }
    ];

    // Attempt 1: POST to /openai (more stable for complex tasks)
    try {
      const response = await fetchWithTimeout('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SCENARIO_SYSTEM_PROMPT },
            { role: 'user', content: `Тема: "${idea}". Стиль: ${style || 'Cinematic'}. Количество персонажей: ${personCount || 1}. Сгенерируй ровно 5 подробных сцен.` }
          ],
          model: 'openai',
          seed: Math.floor(Math.random() * 1000000)
        })
      }, 60000); 
      
      if (response.ok) {
        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        
        let scenes = null;
        if (Array.isArray(rawContent)) {
          scenes = rawContent;
        } else if (typeof rawContent === 'string') {
          scenes = extractJSON(rawContent);
        }
        
        if (scenes && scenes.length > 0) return scenes;
      }
    } catch (e) {
      console.warn('POST scenario attempt failed:', e.message);
    }

    // Attempt 2: GET Fallback
    try {
      const shortPrompt = `JSON array of 5 detailed scenes for video about: "${idea}". Style: ${style}. Format: [{"scene_name": "RU", "image_prompt": "EN", "voice_text": "RU"}]. No prose.`;
      const url = `https://text.pollinations.ai/${encodeURIComponent(shortPrompt)}?model=openai&cache=false&seed=${Date.now()}`;
      const response = await fetchWithTimeout(url, {}, 45000);
      if (response.ok) {
        const content = await response.text();
        const scenes = extractJSON(content);
        if (scenes && scenes.length > 0) return scenes;
      }
    } catch (e) {
      console.warn('GET scenario attempt failed:', e.message);
    }

    return dynamicFallback;
  } catch (error) {
    console.error('Scenario Generation Final Error:', error);
    return dynamicFallback;
  }
};

/**
 * Generates a video segment. Fallbacks to a static image with motion metadata if 401.
 */
/**
 * Generates a video segment. Fallbacks to a static image with motion metadata if 401.
 * Supports SiliconFlow API if apiKey is provided.
 */
export const generateVideoSegment = async (imageRef, motionPrompt, apiKey = null) => {
  try {
    // 1. If API Key is present, use SiliconFlow (Wan-AI)
    if (apiKey && apiKey.startsWith('sk-')) {
      console.log('Использование SiliconFlow для генерации видео...');
      try {
        const enhancedPrompt = await enhancePrompt(motionPrompt);
        console.log('Улучшенный промпт:', enhancedPrompt);

        const isI2V = !!imageRef;
        const model = isI2V ? "Wan-AI/Wan2.1-I2V-14B-720P" : "Wan-AI/Wan2.1-T2V-14B";
        
        const payload = {
          model: model,
          prompt: enhancedPrompt,
        };

        if (isI2V) {
          payload.image = imageRef;
        } else {
          payload.image_size = "1280x720";
        }

        const submitResponse = await fetch('https://api.siliconflow.cn/v1/video/submit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!submitResponse.ok) {
          const errText = await submitResponse.text();
          let errData = {};
          try { errData = JSON.parse(errText); } catch (e) {}
          
          if (submitResponse.status === 401) throw new Error('Ошибка 401: Неверный API ключ SiliconFlow');
          if (submitResponse.status === 402) throw new Error('Ошибка 402: Недостаточно средств на балансе SiliconFlow');
          if (submitResponse.status === 429) throw new Error('Ошибка 429: Слишком много запросов. Подождите немного.');
          throw new Error(errData.message || errData.error?.message || `Ошибка SiliconFlow: ${submitResponse.status}`);
        }

        const data = await submitResponse.json();
        console.log('SiliconFlow submit response:', data);
        
        // SiliconFlow returns task ID in various fields depending on version/model
        const requestId = data.requestId || data.request_id || 
                          (data.data && (data.data.requestId || data.data.request_id)) ||
                          data.id || (data.data && data.data.id);
        
        if (!requestId) {
          // Check if videoUrl is already there (some APIs return result immediately for small tasks)
          const instantUrl = data.videoUrl || data.video_url || 
                            (data.data && (data.data.video_url || data.data.url)) ||
                            (data.results && data.results.video_url);
          if (instantUrl) return { url: instantUrl, isMotion: false };
          
          console.error('Full SiliconFlow response:', JSON.stringify(data, null, 2));
          throw new Error('API не вернуло ID задачи. Пожалуйста, проверьте баланс или ключ.');
        }

        // Polling logic
        let attempts = 0;
        const maxAttempts = 180; // ~24 minutes (Wan-AI can be very slow)
        let lastStatus = '';
        
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 8000));
          
          try {
            // Updated to GET as per documentation/best practices for SiliconFlow
            const statusResponse = await fetch(`https://api.siliconflow.cn/v1/video/status?requestId=${requestId}`, {
              method: 'GET',
              headers: { 
                'Authorization': `Bearer ${apiKey}`
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              const result = statusData.data || statusData;
              const currentStatus = (result.status || result.state || '').toUpperCase();
              
              if (currentStatus !== lastStatus) {
                console.log(`SiliconFlow task ${requestId} status: ${currentStatus}`);
                lastStatus = currentStatus;
              }

              // 'SUCCEEDED' is the official success status in SiliconFlow for some models
              if (['SUCCEED', 'SUCCESS', 'COMPLETED', 'SUCCEEDED'].includes(currentStatus)) {
                const videoUrl = result.videoUrl || result.video_url || 
                                 (result.results && (result.results.video_url || result.results.url)) ||
                                 (result.video_info && result.video_info.url);
                
                if (videoUrl) {
                  return { url: videoUrl, isMotion: false };
                } else {
                  console.warn('SiliconFlow task status was SUCCESS but no video URL found in response:', result);
                }
              }
              
              if (['FAILED', 'ERROR', 'CANCELLED'].includes(currentStatus)) {
                const reason = result.reason || result.message || result.error_message || 'Ошибка генерации на стороне сервера';
                throw new Error(reason);
              }
            } else if (statusResponse.status === 401 || statusResponse.status === 402) {
                throw new Error(`Critical API error during polling: ${statusResponse.status}`);
            } else {
              console.warn(`Status check failed with code ${statusResponse.status}. Retrying...`);
            }
          } catch (pollingErr) {
            console.warn('Polling attempt encountered an error:', pollingErr);
            if (pollingErr.message?.includes('401') || pollingErr.message?.includes('402')) throw pollingErr;
          }
          attempts++;
        }
        throw new Error('Превышено время ожидания генерации видео (Wan-AI).');
      } catch (sfErr) {
        console.warn('SiliconFlow fail:', sfErr);
        if (sfErr.message.includes('401') || sfErr.message.includes('402')) throw sfErr;
      }
    }

    // 2. Pollinations Fallback
    // We return a high-quality image with cinematic zoom (simulated video) 
    // because real video generation is often unavailable or slow in free mode.
    const cinematicImage = generateImage(motionPrompt);
    return { url: cinematicImage, isMotion: true };
  } catch (error) {
    console.warn('Final Video Fallback:', error);
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
  return { status: 'Succeed' };
};

/**
 * Client-side video stitching using FFmpeg.wasm.
 * Supports both real MP4 segments and "Motion Images" (JPEG/PNG).
 */
export const stitchVideos = async (segments, onProgress) => {
  try {
    const ffmpeg = new FFmpeg();
    onProgress('Инициализация FFmpeg...', 5);
    
    // Check if we are in a context that supports SharedArrayBuffer (required for ffmpeg.wasm)
    if (!window.crossOriginIsolated && window.location.hostname !== 'localhost') {
      console.warn('Environment is not cross-origin isolated. FFmpeg might fail.');
      // We still try, but some browsers will block it.
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    onProgress('Загрузка ресурсов...', 20);

    const concatList = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isImage = segment.isMotion || !segment.url.includes('.mp4');
      const ext = isImage ? 'jpg' : 'mp4';
      const inputName = `input${i}.${ext}`;
      const outputName = `segment${i}.mp4`;

      try {
        const fileData = await fetchFile(segment.url);
        await ffmpeg.writeFile(inputName, fileData);

        if (isImage) {
          onProgress(`Анимация кадра ${i+1}/${segments.length}`, 20 + (i / segments.length * 60));
          // Cinematic Pan/Zoom
          await ffmpeg.exec([
            '-loop', '1', '-i', inputName,
            '-vf', `scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.0015,1.5)':d=125:s=1280x720`,
            '-c:v', 'libx264', '-t', '5', '-pix_fmt', 'yuv420p', '-r', '25',
            outputName
          ]);
        } else {
          onProgress(`Обработка видео ${i+1}/${segments.length}`, 20 + (i / segments.length * 60));
          await ffmpeg.exec([
            '-i', inputName,
            '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720',
            '-c:v', 'libx264', '-t', '5', '-pix_fmt', 'yuv420p', '-r', '25',
            outputName
          ]);
        }
        concatList.push(`file '${outputName}'`);
      } catch (err) {
        console.error(`Error processing segment ${i}:`, err);
        throw new Error(`Ошибка обработки сегмента ${i+1}: ${err.message}`);
      }
    }

    if (concatList.length === 0) throw new Error('Не удалось обработать ни один фрагмент');

    await ffmpeg.writeFile('concat.txt', concatList.join('\n'));
    onProgress('Финальная сборка...', 90);
    
    await ffmpeg.exec([
      '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
      '-c', 'copy', 'output.mp4'
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    onProgress('Завершено!', 100);
    
    return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  } catch (error) {
    console.error('Stitching failed:', error);
    throw new Error(`Сбой сборки видео: ${error.message}. Убедитесь, что браузер поддерживает необходимые технологии.`);
  }
};



