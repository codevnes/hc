'use client';

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $applyNodeReplacement, createEditor, DecoratorNode } from 'lexical';
import { Suspense } from 'react';

export interface ImagePayload {
  altText: string;
  src: string;
  width?: number;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__key);
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'editor-image-wrapper';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width } = serializedNode;
    const node = $createImageNode({
      src,
      altText,
      width,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) {
      element.setAttribute('width', this.__width.toString());
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      version: 1,
    };
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  setWidth(width?: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={<div>Đang tải hình ảnh...</div>}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          nodeKey={this.getKey()}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({
  src,
  altText,
  width,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width));
}

function convertImageElement(
  domNode: Node,
): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width } = domNode;
    const node = $createImageNode({
      altText,
      src,
      width: width ? parseInt(width.toString(), 10) : undefined,
    });
    return { node };
  }
  return null;
}

function ImageComponent({
  src,
  altText,
  width,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  nodeKey: string;
}): JSX.Element {
  return (
    <div className="relative">
      <img
        src={src}
        alt={altText}
        width={width}
        className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
        draggable="false"
      />
      <span className="text-xs text-gray-500 mt-1 block">
        {altText && altText.length > 0 ? altText : 'Hình ảnh'}
      </span>
    </div>
  );
} 