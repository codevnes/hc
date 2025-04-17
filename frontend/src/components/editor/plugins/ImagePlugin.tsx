'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $createParagraphNode, $getSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { useCallback, useEffect, useState } from 'react';

import { ImageNode } from '../nodes/ImageNode';

export const INSERT_IMAGE_COMMAND = createCommand<{src: string, altText?: string, width?: number}>();

export default function ImagePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagePlugin: ImageNode không được đăng ký trong cấu hình editor');
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (selection !== null) {
          const imageNode = new ImageNode(payload.src, payload.altText || '', payload.width || 400);
          $insertNodeToNearestRoot(imageNode);
          if (!imageNode.getNextSibling()) {
            imageNode.insertAfter($createParagraphNode());
          }
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

export function InsertImageDialog({ onClose, onInsert }: { onClose: () => void, onInsert: (url: string, altText: string) => void }) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onInsert(url, altText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-md p-4 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Chèn hình ảnh</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">URL hình ảnh</label>
              <input 
                type="text" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả hình ảnh (alt text)</label>
              <input 
                type="text" 
                value={altText} 
                onChange={(e) => setAltText(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                placeholder="Mô tả hình ảnh"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Chèn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 