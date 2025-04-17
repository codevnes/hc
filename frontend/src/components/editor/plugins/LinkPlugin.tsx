'use client';

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';
import { mergeRegister } from '@lexical/utils';

export function LinkPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [lastSelection, setLastSelection] = useState<any>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (payload) => {
          if (payload === null) {
            setShowLinkDialog(false);
            return false;
          }

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            setLastSelection(selection.clone());
            const node = selection.getNodes()[0];
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
              setLinkUrl(parent.getURL());
            } else {
              setLinkUrl('https://');
            }
            setShowLinkDialog(true);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  const handleLinkSubmit = (url: string) => {
    editor.update(() => {
      if (lastSelection !== null) {
        editor.getEditorState().read(() => {
          if (url === '') {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
          }
        });
      }
    });
    setShowLinkDialog(false);
  };

  return (
    <>
      <LexicalLinkPlugin validateUrl={() => true} />
      {showLinkDialog && (
        <InsertLinkDialog 
          url={linkUrl} 
          onClose={() => setShowLinkDialog(false)} 
          onSubmit={handleLinkSubmit} 
        />
      )}
    </>
  );
}

function InsertLinkDialog({ 
  url, 
  onClose, 
  onSubmit 
}: { 
  url: string; 
  onClose: () => void; 
  onSubmit: (url: string) => void; 
}) {
  const [linkUrl, setLinkUrl] = useState(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(linkUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-md p-4 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Chèn liên kết</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input 
              type="url" 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
              placeholder="https://example.com"
            />
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
              {url === 'https://' ? 'Thêm' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 