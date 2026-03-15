
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ContentEmpireOutput, BoardOfDirectorsOutput } from "../types";

// Получаем список всех доступных ключей
const getApiKeys = (): string[] => {
  const keys: any = process.env.API_KEYS;
  if (Array.isArray(keys) && keys.length > 0) return keys;
  
  const singleKey = process.env.API_KEY;
  if (singleKey && singleKey !== 'undefined') return [singleKey];
  return [];
};

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

export const getGeminiClient = () => {
  if (API_KEYS.length === 0) throw new Error("API ключи Gemini не найдены. Убедитесь, что вы добавили GEMINI_API_KEY в настройки.");
  const apiKey = API_KEYS[currentKeyIndex];
  return new GoogleGenAI({ apiKey });
};

// Функция для переключения ключа (полезно для Live API компонентов)
export const rotateApiKey = () => {
  if (API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.warn(`[Gemini] Лимит исчерпан/Ошибка. Переключение на API ключ #${currentKeyIndex + 1} из ${API_KEYS.length}`);
  }
};

// Обертка с автоматической ротацией ключей при ошибках
export async function executeWithRotation<T>(apiCall: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  let attempts = 0;
  const maxAttempts = API_KEYS.length || 1;
  let lastError: any;
  
  while (attempts < maxAttempts) {
    try {
      const ai = getGeminiClient();
      return await apiCall(ai);
    } catch (error: any) {
      lastError = error;
      console.error(`[Gemini] Ошибка с ключом #${currentKeyIndex + 1}:`, error);
      rotateApiKey();
      attempts++;
    }
  }
  throw lastError;
}

// Модуль локальной памяти (Mem0)
export const getMem0Context = (): string => {
  try {
    const facts = JSON.parse(localStorage.getItem('empire_mem0_facts') || '[]');
    if (facts.length === 0) return "";
    return `\n\n[ДОЛГОСРОЧНАЯ ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ (Mem0)]:\n- ${facts.join('\n- ')}\nОБЯЗАТЕЛЬНО учитывай эти факты для персонализации ответа и сохранения единой истории бренда.`;
  } catch {
    return "";
  }
};

export const extractAndStoreFacts = async (text: string) => {
  try {
    const response = await executeWithRotation((ai) => ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `Извлеки из текста ключевые факты о пользователе, его бизнесе, опыте, страхах или целях для сохранения в долгосрочную память.\nТекст: "${text}"\nВерни только массив строк (фактов) в формате JSON. Если новых фактов нет, верни [].`,
      config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    }));
    const newFacts: string[] = JSON.parse(response.text || "[]");
    if (newFacts.length > 0) {
      const currentMemories = JSON.parse(localStorage.getItem('empire_mem0_facts') || '[]');
      const updatedMemories = [...currentMemories, ...newFacts];
      const uniqueMemories = Array.from(new Set(updatedMemories)).slice(-20); // Храним 20 последних уникальных фактов
      localStorage.setItem('empire_mem0_facts', JSON.stringify(uniqueMemories));
    }
  } catch (e) {
    console.error("Mem0 extraction error:", e);
  }
};

export async function transcribeAudio(base64Audio: string): Promise<string> {
  const response = await executeWithRotation((ai) => ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
          { text: "Транскрибируй это аудио точно. Аудио может быть на русском или таджикском языке. Выведи только текст, без комментариев." }
        ]
      }
    ]
  }));
  return response.text || "Ошибка транскрипции.";
}

export async function generateContentEmpire(transcription: string): Promise<ContentEmpireOutput> {
  const response = await executeWithRotation((ai) => ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: `На основе следующей транскрипции голосовой заметки: "${transcription}", создай пакет контента для личного бренда профессионального бизнес-спикера. ${getMem0Context()}
    Ввод может быть на русском или таджикском языке. Вывод (контент) должен быть на русском языке и на таджикском языке.
    
    Особое внимание удели:
    1. Режиссуре видео (Video Director): Распиши посекундный план с визуальными эффектами.
    2. Лид-магниту (Money Maker): Создай структуру полезного PDF-файла или чек-листа, который можно подарить за комментарий.

    Выведи результат строго в формате JSON.
    
    Формат:
    {
      "videoDirectorPlan": {
        "hook": "Сильный зацеп",
        "timeline": [
          {"timestamp": "00:00-00:05", "visual": "Крупный план, взгляд в камеру", "speech": "Текст речи", "textOverlay": "Текст на экране"},
          {"timestamp": "00:05-00:15", "visual": "Смена локации, движение", "speech": "Текст речи", "textOverlay": "Ключевые слова"}
        ],
        "finalCta": "Призыв к действию"
      },
      "instagramPost": {
        "caption": "Увлекательная подпись",
        "hashtags": ["#тег1"]
      },
      "linkedInArticle": {
        "title": "Заголовок",
        "content": "Текст статьи"
      },
      "leadMagnet": {
        "title": "Название гайда/чек-листа",
        "description": "Краткое описание пользы",
        "points": ["Пункт 1", "Пункт 2"],
        "ctaTrigger": "Слово-триггер для Директа (например, 'ГЕЙМПЛЕЙ')"
      },
      "storyIdeas": ["Идея 1", "Идея 2", "Идея 3"]
    }`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 15000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          videoDirectorPlan: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING },
                    visual: { type: Type.STRING },
                    speech: { type: Type.STRING },
                    textOverlay: { type: Type.STRING }
                  },
                  required: ['timestamp', 'visual', 'speech', 'textOverlay']
                }
              },
              finalCta: { type: Type.STRING }
            },
            required: ['hook', 'timeline', 'finalCta']
          },
          instagramPost: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['caption', 'hashtags']
          },
          linkedInArticle: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ['title', 'content']
          },
          leadMagnet: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              points: { type: Type.ARRAY, items: { type: Type.STRING } },
              ctaTrigger: { type: Type.STRING }
            },
            required: ['title', 'description', 'points', 'ctaTrigger']
          },
          storyIdeas: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['videoDirectorPlan', 'instagramPost', 'linkedInArticle', 'leadMagnet', 'storyIdeas']
      }
    }
  }));

  try {
    // Фоновое извлечение фактов для пополнения памяти (не блокирует ответ)
    extractAndStoreFacts(transcription).catch(console.error);
    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error("Не удалось структурировать ответ от ИИ. Попробуйте еще раз.");
  }
}

export async function speakText(text: string): Promise<string> {
  const response = await executeWithRotation((ai) => ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: `Прочитай этот контент профессионально и четко: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  }));
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
}

export async function getBoardAdvice(problem: string): Promise<BoardOfDirectorsOutput> {
  const response = await executeWithRotation((ai) => ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: `Проанализируй следующую бизнес-проблему: "${problem}" и предоставь 4 стратегических совета от "Совета Директоров". ${getMem0Context()}
    
    Каждый совет должен быть в уникальном стиле:
    1. Стив Джобс (Продукт и Видение): Фокус на инновациях, дизайне и вере в идею.
    2. Уоррен Баффет (Финансы и Риски): Фокус на марже, безопасности и долгосрочной ценности.
    3. Грант Кардон (Продажи и Действие): Фокус на агрессивном маркетинге, 10X усилиях и продажах.
    4. Сунь Цзы (Стратегия): Фокус на конкурентном анализе, обмане противника и использовании слабостей.

    Отвечай строго на РУССКОМ языке и если скажуть отвечай на таджикскый язык то отвечай на таджикскый язык в формате JSON.`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 25000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobs: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              advice: { type: Type.STRING },
              quote: { type: Type.STRING }
            },
            required: ['name', 'role', 'advice', 'quote']
          },
          buffett: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              advice: { type: Type.STRING },
              quote: { type: Type.STRING }
            },
            required: ['name', 'role', 'advice', 'quote']
          },
          cardone: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              advice: { type: Type.STRING },
              quote: { type: Type.STRING }
            },
            required: ['name', 'role', 'advice', 'quote']
          },
          tzu: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              advice: { type: Type.STRING },
              quote: { type: Type.STRING }
            },
            required: ['name', 'role', 'advice', 'quote']
          }
        },
        required: ['jobs', 'buffett', 'cardone', 'tzu']
      }
    }
  }));
  
  try {
    extractAndStoreFacts(problem).catch(console.error);
    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error("Ошибка обработки данных от Совета Директоров.");
  }
}
