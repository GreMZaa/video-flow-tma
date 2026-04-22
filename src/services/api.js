import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const POLLINATIONS_TEXT_URL = 'https://text.pollinations.ai/';

// Available System Voices (will be populated dynamically if possible, 
// but we define labels for UI consistency)
export const VOICE_OPTIONS = [
  { id: 'neural-male', name: 'Мужской (Нейро)', lang: 'ru' },
  { id: 'neural-female', name: 'Женский (Нейро)', lang: 'ru' },
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
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const jsonStart = cleaned.indexOf('[');
      const jsonEnd = cleaned.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        return JSON.parse(cleaned.substring(jsonStart, jsonEnd));
      }
      // Try object if array fails
      const objStart = cleaned.indexOf('{');
      const objEnd = cleaned.lastIndexOf('}') + 1;
      if (objStart !== -1 && objEnd > objStart) {
        const obj = JSON.parse(cleaned.substring(objStart, objEnd));
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

              if (['SUCCEED', 'SUCCESS', 'COMPLETED'].includes(currentStatus)) {
                const videoUrl = result.videoUrl || result.video_url || 
                                 (result.results && (result.results.video_url || result.results.url)) ||
                                 (result.video_info && result.video_info.url);
                
                if (videoUrl) {
                  return { url: videoUrl, isMotion: false };
                } else {
                  console.warn('SiliconFlow succeeded but no video URL found in:', result);
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

    return { 
      url: generateImage(motionPrompt), 
      isMotion: true 
    };
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



