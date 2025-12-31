# FalseGrip Coach — Expo App Implementation Plan

## Overview

Build a mobile-first fitness coaching chatbot using Expo/React Native. This is a port of an existing WhatsApp bot (TypeScript) to a standalone mobile app.

**Core value prop**: Fast, high-signal coaching answers + evidence-based science briefs + food photo calorie estimation.

**Target**: Working v1 with chat UI, three modes (QnA, Science Brief, Calorie Estimation), and OpenRouter API integration.

---

## Technical Decisions (Already Made)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API calls | Direct from app via thin proxy | Fast to build; no backend needed for v1 |
| State management | React hooks + Context | Simple; no Redux overhead |
| Persistence | AsyncStorage | Chat history survives app restart |
| Styling | NativeWind (Tailwind for RN) | Fast iteration, consistent with web patterns |
| Navigation | Expo Router | File-based routing, simple for single-screen v1 |
| Image handling | expo-image-picker | Camera + gallery, returns base64 |

---

## Project Structure to Create

```
falsegrip-coach/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   └── index.tsx                # Main chat screen
│
├── src/
│   ├── api/
│   │   └── openrouter.ts        # API client (ported from WhatsApp bot)
│   │
│   ├── prompts/
│   │   ├── modulePrompt.ts      # System prompts + templates (direct copy)
│   │   ├── qnaTemplate.ts       # QnA prompt builder (direct copy)
│   │   ├── scienceBrief.ts      # Science brief builder (direct copy)
│   │   └── calorieEstimator.ts  # Calorie estimator (adapted)
│   │
│   ├── hooks/
│   │   ├── useChat.ts           # Chat state management
│   │   └── useOpenRouter.ts     # API call wrapper with loading states
│   │
│   ├── components/
│   │   ├── ChatBubble.tsx       # Single message bubble
│   │   ├── ChatList.tsx         # Scrollable message list
│   │   ├── MessageInput.tsx     # Text input + send button + image attach
│   │   ├── ModeSelector.tsx     # QnA / Science / Calories toggle
│   │   ├── ImagePreview.tsx     # Selected image thumbnail before send
│   │   └── LoadingIndicator.tsx # Typing indicator while waiting
│   │
│   ├── context/
│   │   └── ChatContext.tsx      # Global chat state provider
│   │
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   │
│   └── utils/
│       └── storage.ts           # AsyncStorage helpers
│
├── assets/                      # App icons, splash screen
├── app.json                     # Expo config
├── package.json
├── tsconfig.json
├── tailwind.config.js           # NativeWind config
└── .env                         # EXPO_PUBLIC_OPENROUTER_API_KEY
```

---

## Implementation Order

### Phase 1: Project Setup
1. Initialize Expo project with TypeScript template
2. Install dependencies
3. Configure NativeWind
4. Set up environment variables

### Phase 2: Port Core Logic (No UI Yet)
1. Port `openrouter.ts` (adapt for React Native fetch)
2. Copy `modulePrompt.ts` unchanged
3. Copy `qnaTemplate.ts` unchanged  
4. Copy `scienceBrief.ts` unchanged
5. Adapt `calorieEstimator.ts` (remove Node.js file reading)

### Phase 3: Build Hooks
1. Create `useChat.ts` with message state + persistence
2. Create `useOpenRouter.ts` with loading/error states

### Phase 4: Build UI Components
1. `ChatBubble.tsx`
2. `ChatList.tsx`
3. `MessageInput.tsx`
4. `ModeSelector.tsx`
5. `ImagePreview.tsx`
6. `LoadingIndicator.tsx`

### Phase 5: Assemble Main Screen
1. Wire up `app/index.tsx` with all components
2. Connect mode selector to appropriate prompt builders
3. Add keyboard avoidance behavior
4. Test full flow

### Phase 6: Polish
1. Add AsyncStorage persistence
2. Handle errors gracefully
3. Add haptic feedback on send
4. Test on iOS + Android

---

## Detailed File Specifications

### 1. `package.json` dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-haptics": "~14.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "nativewind": "^4.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-screens": "~4.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "tailwindcss": "^3.4.0",
    "typescript": "~5.3.0"
  }
}
```

---

### 2. `src/types/index.ts`

```typescript
export type ChatMode = 'qna' | 'science' | 'calories';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: {
    uri: string;
    base64: string;
    mimeType: string;
  };
  timestamp: number;
  mode: ChatMode;
}

export interface CalorieEstimate {
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
}
```

---

### 3. `src/api/openrouter.ts` — Port Instructions

**Source file**: `src/openrouter.ts` from WhatsApp bot

**Changes required**:
1. Remove `import { fetch } from 'undici'` — use native fetch
2. Remove `import { readFile } from 'node:fs/promises'` — not needed
3. Remove `import mime from 'mime-types'` — not needed
4. Remove the `imagePath` handling in `resolveImagePart` — only support `base64Data` and `imageUrl`
5. Get API key from `process.env.EXPO_PUBLIC_OPENROUTER_API_KEY`

**Keep unchanged**:
- All type definitions (`ChatMessage`, `ContentPart`, etc.)
- `requestCompletion` method logic
- `buildHeaders` method
- `normalizeContent` method
- `generateText` method signature and logic
- `describeImage` method (just remove file path handling)

**Final signature should be**:
```typescript
export class OpenRouterClient {
  constructor(options?: { apiKey?: string; textModel?: string; visionModel?: string })
  isEnabled(): boolean
  generateText(prompt: string, systemPrompt?: string): Promise<string>
  describeImage(params: { base64Data?: string; mimeType?: string; imageUrl?: string; instruction?: string; system?: string }): Promise<string>
}
```

---

### 4. `src/prompts/modulePrompt.ts` — Direct Copy

Copy the entire file from the WhatsApp bot unchanged. It contains:
- `COMMANDS` object (won't be used but harmless to keep)
- `SUMMARY_SYSTEM_PROMPT` and `SUMMARY_PROMPT_TEMPLATE`
- `QNA_SYSTEM_PROMPT` and `QNA_PROMPT_TEMPLATE`
- `CALORIE_SYSTEM_PROMPT` and `CALORIE_PROMPT_TEMPLATE`
- `SCIENCE_SYSTEM_PROMPT` and `SCIENCE_PROMPT_TEMPLATE`

---

### 5. `src/prompts/qnaTemplate.ts` — Direct Copy

Copy the entire file unchanged. It exports:
- `buildQnAPrompt({ question, context?, askPreference? }): string`
- `generateQnAResponse({ question, context?, askPreference?, openRouterClient }): Promise<string>`

---

### 6. `src/prompts/scienceBrief.ts` — Direct Copy

Copy the entire file unchanged. It exports:
- `buildScienceBriefPrompt({ topic }): string`
- `generateScienceBrief({ topic, openRouterClient }): Promise<string>`

**Note**: There's a bug where `{{CONTEXT_SECTION}}` isn't replaced. Fix this by adding a `context` parameter or removing the placeholder from the template.

---

### 7. `src/prompts/calorieEstimator.ts` — Adapted Version

**Source**: `src/plateCalorieEstimator.ts`

**Changes**:
1. Remove all file system imports and `resolveImageDataUrl` function
2. Simplify `estimatePlateCalories` to only accept `base64Data` + `mimeType`

**New implementation**:

```typescript
import { OpenRouterClient } from '../api/openrouter';
import { CALORIE_PROMPT_TEMPLATE, CALORIE_SYSTEM_PROMPT } from './modulePrompt';

export interface CalorieEstimate {
  kcal_low: number;
  kcal_high: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
}

export const buildCaloriePrompt = (caption: string): string => {
  const c = caption.trim();
  return CALORIE_PROMPT_TEMPLATE.replace('{{CAPTION_LINE}}', c || '(no caption provided)');
};

export interface EstimatePlateCaloriesParams {
  base64Data: string;
  mimeType: string;
  captionText: string;
  openRouterClient: OpenRouterClient;
}

export const estimatePlateCalories = async (
  params: EstimatePlateCaloriesParams
): Promise<string> => {
  const { base64Data, mimeType, captionText, openRouterClient } = params;
  
  const instruction = buildCaloriePrompt(captionText);
  const imageUrl = `data:${mimeType};base64,${base64Data}`;
  
  const response = await openRouterClient.describeImage({
    imageUrl,
    instruction,
    system: CALORIE_SYSTEM_PROMPT,
  });
  
  return response; // Return raw text; prompt now asks for conversational output
};
```

---

### 8. `src/hooks/useChat.ts`

```typescript
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatMode } from '../types';

const STORAGE_KEY = 'falsegrip_chat_history';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addUserMessage = useCallback((
    content: string,
    mode: ChatMode,
    image?: { uri: string; base64: string; mimeType: string }
  ) => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      image,
      timestamp: Date.now(),
      mode,
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const addAssistantMessage = useCallback((content: string, mode: ChatMode) => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      mode,
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
  }, []);

  const saveHistory = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    setIsLoading,
    addUserMessage,
    addAssistantMessage,
    clearHistory,
    loadHistory,
    saveHistory,
  };
};
```

---

### 9. `src/hooks/useOpenRouter.ts`

```typescript
import { useMemo } from 'react';
import { OpenRouterClient } from '../api/openrouter';

export const useOpenRouter = () => {
  const client = useMemo(() => {
    return new OpenRouterClient({
      apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
      textModel: process.env.EXPO_PUBLIC_OPENROUTER_TEXT_MODEL || 'anthropic/claude-3-haiku',
      visionModel: process.env.EXPO_PUBLIC_OPENROUTER_VISION_MODEL || 'anthropic/claude-3-haiku',
    });
  }, []);

  return {
    client,
    isEnabled: client.isEnabled(),
  };
};
```

---

### 10. `src/components/ChatBubble.tsx`

```typescript
import { View, Text, Image } from 'react-native';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  
  return (
    <View className={`flex ${isUser ? 'items-end' : 'items-start'} mb-3 px-4`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        {message.image && (
          <Image
            source={{ uri: message.image.uri }}
            className="w-48 h-48 rounded-lg mb-2"
            resizeMode="cover"
          />
        )}
        <Text className={`text-base ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </Text>
      </View>
    </View>
  );
};
```

---

### 11. `src/components/ChatList.tsx`

```typescript
import { useRef, useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { ChatMessage } from '../types';
import { ChatBubble } from './ChatBubble';

interface ChatListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatList = ({ messages, isLoading }: ChatListProps) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatBubble message={item} />}
      contentContainerStyle={{ paddingVertical: 16 }}
      ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
    />
  );
};

const LoadingIndicator = () => (
  <View className="flex items-start mb-3 px-4">
    <View className="bg-gray-200 rounded-2xl px-4 py-3">
      <Text className="text-gray-500">Thinking...</Text>
    </View>
  </View>
);
```

---

### 12. `src/components/ModeSelector.tsx`

```typescript
import { View, TouchableOpacity, Text } from 'react-native';
import { ChatMode } from '../types';

interface ModeSelectorProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
}

const modes: { key: ChatMode; label: string; icon: string }[] = [
  { key: 'qna', label: 'Ask', icon: '💬' },
  { key: 'science', label: 'Science', icon: '🧪' },
  { key: 'calories', label: 'Calories', icon: '🍽️' },
];

export const ModeSelector = ({ value, onChange }: ModeSelectorProps) => {
  return (
    <View className="flex-row justify-center gap-2 py-2 border-b border-gray-200">
      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.key}
          onPress={() => onChange(mode.key)}
          className={`px-4 py-2 rounded-full ${
            value === mode.key ? 'bg-blue-500' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              value === mode.key ? 'text-white' : 'text-gray-700'
            }`}
          >
            {mode.icon} {mode.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

---

### 13. `src/components/MessageInput.tsx`

```typescript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface MessageInputProps {
  onSend: (text: string, image?: { uri: string; base64: string; mimeType: string }) => void;
  allowImage: boolean;
  disabled: boolean;
}

export const MessageInput = ({ onSend, allowImage, disabled }: MessageInputProps) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSend = () => {
    if (!text.trim() && !selectedImage) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(text.trim(), selectedImage || undefined);
    setText('');
    setSelectedImage(null);
  };

  return (
    <View className="border-t border-gray-200 p-3">
      {selectedImage && (
        <View className="mb-2 relative">
          <Image
            source={{ uri: selectedImage.uri }}
            className="w-20 h-20 rounded-lg"
          />
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
          >
            <Text className="text-white text-xs">✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View className="flex-row items-center gap-2">
        {allowImage && (
          <TouchableOpacity
            onPress={pickImage}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Text>📷</Text>
          </TouchableOpacity>
        )}
        
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={allowImage ? "Describe your meal..." : "Ask anything..."}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
          multiline
          maxLength={1000}
          editable={!disabled}
        />
        
        <TouchableOpacity
          onPress={handleSend}
          disabled={disabled || (!text.trim() && !selectedImage)}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            disabled || (!text.trim() && !selectedImage)
              ? 'bg-gray-200'
              : 'bg-blue-500'
          }`}
        >
          <Text className="text-white">↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

### 14. `app/index.tsx` — Main Screen

```typescript
import { useEffect, useState, useCallback } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ChatMode } from '../src/types';
import { useChat } from '../src/hooks/useChat';
import { useOpenRouter } from '../src/hooks/useOpenRouter';
import { ChatList } from '../src/components/ChatList';
import { MessageInput } from '../src/components/MessageInput';
import { ModeSelector } from '../src/components/ModeSelector';

import { generateQnAResponse } from '../src/prompts/qnaTemplate';
import { generateScienceBrief } from '../src/prompts/scienceBrief';
import { estimatePlateCalories } from '../src/prompts/calorieEstimator';

export default function ChatScreen() {
  const [mode, setMode] = useState<ChatMode>('qna');
  const { messages, isLoading, setIsLoading, addUserMessage, addAssistantMessage, loadHistory, saveHistory } = useChat();
  const { client, isEnabled } = useOpenRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveHistory();
    }
  }, [messages]);

  const handleSend = useCallback(async (
    text: string,
    image?: { uri: string; base64: string; mimeType: string }
  ) => {
    if (!isEnabled) {
      addAssistantMessage('API key not configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY.', mode);
      return;
    }

    addUserMessage(text, mode, image);
    setIsLoading(true);

    try {
      let response: string;

      switch (mode) {
        case 'calories':
          if (!image) {
            response = 'Please attach a photo of your meal for calorie estimation.';
          } else {
            response = await estimatePlateCalories({
              base64Data: image.base64,
              mimeType: image.mimeType,
              captionText: text,
              openRouterClient: client,
            });
          }
          break;

        case 'science':
          if (!text) {
            response = 'Please provide a topic for the science brief.';
          } else {
            response = await generateScienceBrief({
              topic: text,
              openRouterClient: client,
            });
          }
          break;

        case 'qna':
        default:
          response = await generateQnAResponse({
            question: text,
            openRouterClient: client,
          });
          break;
      }

      addAssistantMessage(response, mode);
    } catch (error) {
      console.error('Error generating response:', error);
      addAssistantMessage('Something went wrong. Please try again.', mode);
    } finally {
      setIsLoading(false);
    }
  }, [mode, isEnabled, client, addUserMessage, addAssistantMessage, setIsLoading]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ModeSelector value={mode} onChange={setMode} />
        <ChatList messages={messages} isLoading={isLoading} />
        <MessageInput
          onSend={handleSend}
          allowImage={mode === 'calories'}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

### 15. `app/_layout.tsx`

```typescript
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css'; // NativeWind styles

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

---

### 16. Environment Variables (`.env`)

```
EXPO_PUBLIC_OPENROUTER_API_KEY=your_key_here
EXPO_PUBLIC_OPENROUTER_TEXT_MODEL=anthropic/claude-3-haiku
EXPO_PUBLIC_OPENROUTER_VISION_MODEL=anthropic/claude-3-haiku
```

---

## Validation Checklist

After implementation, verify these work:

1. **QnA mode**: Type a question → get a concise response in chat
2. **Science mode**: Type a topic (e.g., "creatine") → get Evidence/Uncertainties/Practical format
3. **Calories mode**: Attach food photo + caption → get calorie/macro estimate
4. **Persistence**: Close app → reopen → chat history is preserved
5. **Mode switching**: Change modes mid-conversation → new messages use correct prompt
6. **Error handling**: Disable network → send message → see friendly error
7. **Image preview**: In calories mode, selected image shows before sending
8. **Keyboard handling**: On iOS, input stays visible when keyboard opens

---

## Files to Copy Directly from WhatsApp Bot

These files should be copied with zero or minimal changes:

| Source Path | Destination Path | Changes |
|-------------|------------------|---------|
| `src/modulePrompt.ts` | `src/prompts/modulePrompt.ts` | None |
| `src/qnaTemplate.ts` | `src/prompts/qnaTemplate.ts` | None |
| `src/scienceBrief.ts` | `src/prompts/scienceBrief.ts` | Fix `{{CONTEXT_SECTION}}` bug |

---

## Known Issues to Fix During Implementation

1. **`scienceBrief.ts`**: The `{{CONTEXT_SECTION}}` placeholder is never replaced. Either:
   - Add `context` param to `buildScienceBriefPrompt` and `generateScienceBrief`
   - Or remove the placeholder from `SCIENCE_PROMPT_TEMPLATE`

2. **`plateCalorieEstimator.ts`**: Current prompt asks for conversational output but `tryParseEstimate` tries to parse JSON. Since we're returning raw text now, this is fine—just don't port the JSON parsing logic.

3. **API key security**: For production, replace direct API calls with a proxy endpoint that holds the key server-side.

---

## Future Enhancements (Not v1)

- Trainer persona injection (from settings screen)
- User profile injection (goals, weight, constraints)
- Chat summary mode (summarize current conversation)
- Voice input
- Push notifications for daily check-ins
- Backend for multi-device sync