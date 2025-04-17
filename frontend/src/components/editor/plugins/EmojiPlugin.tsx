'use client';

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { $insertNodes } from 'lexical';
import { $createTextNode } from 'lexical';

export const INSERT_EMOJI_COMMAND: LexicalCommand<string> = createCommand();

export default function EmojiPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<string>(
      INSERT_EMOJI_COMMAND,
      (emoji) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const emojiTextNode = $createTextNode(emoji);
        selection.insertNodes([emojiTextNode]);

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

const EMOJI_CATEGORIES = {
  smileys: {
    name: 'Mặt cười & Biểu cảm',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘']
  },
  gestures: {
    name: 'Cử chỉ & Con người',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👋', '🙌', '👏', '🤝']
  },
  animals: {
    name: 'Động vật & Thiên nhiên',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷']
  }, 
  food: {
    name: 'Đồ ăn & Thức uống',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍']
  },
  travel: {
    name: 'Du lịch & Địa điểm',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛴', '🚲', '✈️']
  }
};

export function EmojiPickerDialog({ onClose, onSelect }: { onClose: () => void, onSelect: (emoji: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  return (
    <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-w-[320px]">
      <div className="p-2">
        <div className="flex border-b pb-1 mb-2">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              className={`p-1 mr-1 rounded-md ${activeCategory === category ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
              title={EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES].name}
            >
              {EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES].emojis[0]}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border-t px-2 py-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>{EMOJI_CATEGORIES[activeCategory].name}</span>
        <button onClick={onClose} className="text-gray-600 dark:text-gray-300">Đóng</button>
      </div>
    </div>
  );
} 