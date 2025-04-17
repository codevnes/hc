'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { $createHeadingNode, $isHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $createListNode, $isListNode, ListNode } from '@lexical/list';
import { $getNearestNodeOfType } from '@lexical/utils';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { INSERT_IMAGE_COMMAND } from './ImagePlugin';
import { InsertImageDialog } from './ImagePlugin';
import { INSERT_TABLE_COMMAND } from './TablePlugin';
import { InsertTableDialog } from './TablePlugin';
import { INSERT_EMOJI_COMMAND } from './EmojiPlugin';
import { EmojiPickerDialog } from './EmojiPlugin';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Kiểm tra xem có phải là link không
      const nodes = selection.getNodes();
      if (nodes.length === 1) {
        const firstNode = nodes[0];
        const parent = firstNode.getParent();
        setIsLink($isLinkNode(parent));
      } else {
        setIsLink(false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow();
      
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(tag);
        } else if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          if (parentList && $isListNode(parentList)) {
            const listType = parentList.getListType();
            setBlockType(listType);
          }
        } else {
          setBlockType('paragraph');
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Thêm sự kiện click bên ngoài để đóng emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiButtonRef.current && 
        !emojiButtonRef.current.contains(event.target as Node) &&
        showEmojiPicker
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingLevel: HeadingTagType) => {
    if (blockType !== headingLevel) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode(headingLevel));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createListNode('bullet'));
        }
      });
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createListNode('number'));
        }
      });
    }
  };

  const insertLink = () => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  const handleInsertImage = (url: string, altText: string) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText });
    setShowImageDialog(false);
  };

  const insertTable = () => {
    setShowTableDialog(true);
  };

  const handleInsertTable = (rows: number, columns: number, includeHeaders: boolean) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows, columns, includeHeaders });
    setShowTableDialog(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji: string) => {
    editor.dispatchCommand(INSERT_EMOJI_COMMAND, emoji);
  };

  return (
    <>
      <div className="flex items-center gap-1 p-1 border-b flex-wrap">
        <button
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="p-2 hover:bg-muted rounded"
          title="Hoàn tác"
          type="button"
          aria-label="Hoàn tác"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8H7V3M7 8L14 15C16 13 17 12 19 12C21 12 22 13 23 15C21 13.5 20 13 19 13C17.5 13 16 14 14 16L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="p-2 hover:bg-muted rounded"
          title="Làm lại"
          type="button"
          aria-label="Làm lại"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8H17V3M17 8L10 15C8 13 7 12 5 12C3 12 2 13 1 15C3 13.5 4 13 5 13C6.5 13 8 14 10 16L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="w-[1px] h-6 bg-muted mx-1" />
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={`p-2 hover:bg-muted rounded ${isBold ? 'bg-muted' : ''}`}
          title="Đậm"
          type="button"
          aria-label="Format Bold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12H14C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4H6V12ZM6 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H6V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={`p-2 hover:bg-muted rounded ${isItalic ? 'bg-muted' : ''}`}
          title="Nghiêng"
          type="button"
          aria-label="Format Italic"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 4H10M14 20H5M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={`p-2 hover:bg-muted rounded ${isUnderline ? 'bg-muted' : ''}`}
          title="Gạch chân"
          type="button"
          aria-label="Format Underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4V11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11V4M4 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Nút thêm liên kết */}
        <button
          onClick={insertLink}
          className={`p-2 hover:bg-muted rounded ${isLink ? 'bg-muted' : ''}`}
          title="Liên kết"
          type="button"
          aria-label="Format Link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Nút chèn hình ảnh */}
        <button
          onClick={insertImage}
          className="p-2 hover:bg-muted rounded"
          title="Chèn hình ảnh"
          type="button"
          aria-label="Insert Image"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        {/* Nút chèn bảng */}
        <button
          onClick={insertTable}
          className="p-2 hover:bg-muted rounded"
          title="Chèn bảng"
          type="button"
          aria-label="Insert Table"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        
        {/* Nút chèn emoji */}
        <div className="relative">
          <button
            ref={emojiButtonRef}
            onClick={toggleEmojiPicker}
            className="p-2 hover:bg-muted rounded"
            title="Chèn emoji"
            type="button"
            aria-label="Insert Emoji"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="9" cy="9" r="1.5" fill="currentColor" />
              <circle cx="15" cy="9" r="1.5" fill="currentColor" />
            </svg>
          </button>
          {showEmojiPicker && (
            <EmojiPickerDialog onClose={() => setShowEmojiPicker(false)} onSelect={insertEmoji} />
          )}
        </div>
        
        <span className="w-[1px] h-6 bg-muted mx-1" />
        <div className="relative">
          <select
            onChange={(e) => {
              const format = e.target.value;
              switch (format) {
                case 'paragraph':
                  formatParagraph();
                  break;
                case 'h1':
                case 'h2':
                case 'h3':
                  formatHeading(format as HeadingTagType);
                  break;
                case 'bullet':
                  formatBulletList();
                  break;
                case 'number':
                  formatNumberedList();
                  break;
                default:
                  formatParagraph();
              }
            }}
            className="h-8 px-2 py-1 text-sm bg-transparent border rounded hover:bg-muted"
            value={blockType}
          >
            <option value="paragraph">Đoạn văn</option>
            <option value="h1">Tiêu đề 1</option>
            <option value="h2">Tiêu đề 2</option>
            <option value="h3">Tiêu đề 3</option>
            <option value="bullet">Danh sách dấu đầu dòng</option>
            <option value="number">Danh sách đánh số</option>
          </select>
        </div>
      </div>
      
      {/* Dialog chèn hình ảnh */}
      {showImageDialog && (
        <InsertImageDialog
          onClose={() => setShowImageDialog(false)}
          onInsert={handleInsertImage}
        />
      )}
      
      {/* Dialog chèn bảng */}
      {showTableDialog && (
        <InsertTableDialog
          onClose={() => setShowTableDialog(false)}
          onInsert={handleInsertTable}
        />
      )}
    </>
  );
} 