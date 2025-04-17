'use client';

import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { HeadingNode } from '@lexical/rich-text';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import { $createParagraphNode, $getRoot, $insertNodes, EditorState, LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { ImageNode } from './nodes/ImageNode';
import ImagePlugin from './plugins/ImagePlugin';
import { LinkPlugin } from './plugins/LinkPlugin';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import TableToolbarPlugin from './plugins/TablePlugin';
import EmojiPlugin from './plugins/EmojiPlugin';

interface LexicalEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onError?: () => void;
}

function Placeholder({ placeholder }: { placeholder: string }) {
  return (
    <div className="absolute top-[28px] left-[28px] pointer-events-none text-muted-foreground">
      {placeholder}
    </div>
  );
}

export default function LexicalEditorComponent({
  initialValue = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  onError
}: LexicalEditorProps) {
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  // Initial editor configuration
  const initialConfig = {
    namespace: 'HC-Stock-Editor',
    // Register custom nodes
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      ImageNode,
      TableNode,
      TableCellNode,
      TableRowNode
    ],
    theme: {
      root: 'p-4 min-h-[250px] outline-none',
      link: 'text-primary underline',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
      heading: {
        h1: 'text-3xl font-bold',
        h2: 'text-2xl font-bold',
        h3: 'text-xl font-bold',
      },
      list: {
        ul: 'list-disc ml-8',
        ol: 'list-decimal ml-8',
      },
      image: 'max-w-full my-2',
      table: 'border-collapse my-4 w-full',
      tableRow: '',
      tableCell: 'border border-gray-300 dark:border-gray-700 p-2',
      tableCellHeader: 'bg-gray-100 dark:bg-gray-800 font-bold text-left p-2 border border-gray-300 dark:border-gray-700',
    },
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
      if (onError) onError();
    },
    editable: !disabled,
  };

  // Handle editor changes
  const handleEditorChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const root = $getRoot();
      setIsEditorEmpty(root.getTextContent().trim().length === 0);
      
      // Convert content to HTML for storage
      const htmlString = $generateHtmlFromNodes(editor);
      onChange(htmlString);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="lexical-container relative">
        {!disabled && <ToolbarPlugin />}
        <div className="editor-inner relative">
          <RichTextPlugin
            contentEditable={<ContentEditable className="lexical-editor" />}
            placeholder={isEditorEmpty ? <Placeholder placeholder={placeholder} /> : null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <ImagePlugin />
          <TablePlugin />
          <TableToolbarPlugin />
          <EmojiPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <HtmlImportPlugin html={initialValue} />
        </div>
      </div>
    </LexicalComposer>
  );
}

// Plugin to import HTML content
function HtmlImportPlugin({ html }: { html: string }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized || !html) return;

    // Import the HTML content
    const importHtml = async (editor: LexicalEditor) => {
      editor.update(() => {
        // Clear editor first
        $getRoot().clear();

        try {
          // Create DOM parser
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);

          // Insert nodes if we have valid content
          if (nodes.length > 0) {
            $getRoot().append(...nodes);
          } else {
            // Otherwise create an empty paragraph
            $getRoot().append($createParagraphNode());
          }
        } catch (error) {
          console.error('Error importing HTML:', error);
          // Fallback to empty editor
          $getRoot().append($createParagraphNode());
        }
      });
      setIsInitialized(true);
    };

    // Get the editor instance and import HTML
    const editorRef = document.querySelector('[data-lexical-editor="true"]');
    if (editorRef) {
      const editor = (editorRef as any)._lexicalEditor;
      if (editor) {
        importHtml(editor);
      }
    }
  }, [html, isInitialized]);

  return null;
} 