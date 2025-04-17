'use client';

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, createCommand } from 'lexical';
import { $createTableNodeWithDimensions, TableNode } from '@lexical/table';
import { $insertNodeToNearestRoot } from '@lexical/utils';

export const INSERT_TABLE_COMMAND = createCommand<{ rows: number, columns: number, includeHeaders?: boolean }>();

export default function TablePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [showTableDialog, setShowTableDialog] = useState(false);

  useEffect(() => {
    // Kiểm tra xem TableNode có được đăng ký không (bỏ qua đoạn này nếu đã đăng ký trong config)
    try {
      // Đăng ký lệnh chèn bảng
      const removeTableCommand = editor.registerCommand(
        INSERT_TABLE_COMMAND,
        (payload) => {
          const { rows, columns, includeHeaders = true } = payload;
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const tableNode = $createTableNodeWithDimensions(rows, columns, includeHeaders);
              $insertNodeToNearestRoot(tableNode);
            }
          });
          return true;
        },
        0
      );

      return () => {
        removeTableCommand();
      };
    } catch (error) {
      console.error('Lỗi khi đăng ký lệnh bảng:', error);
    }
  }, [editor]);

  return null;
}

export function InsertTableDialog({ onClose, onInsert }: { onClose: () => void, onInsert: (rows: number, columns: number, includeHeaders: boolean) => void }) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [includeHeaders, setIncludeHeaders] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert(rows, columns, includeHeaders);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-md p-4 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Chèn bảng</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Số hàng</label>
              <input
                type="number"
                value={rows}
                min={1}
                max={10}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số cột</label>
              <input
                type="number"
                value={columns}
                min={1}
                max={10}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-headers"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="include-headers" className="text-sm">Bao gồm hàng tiêu đề</label>
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