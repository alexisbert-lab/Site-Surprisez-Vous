'use client';

import React from 'react';
import { useIframeEdit } from '@/lib/iframe-edit-context';

interface Props {
  page: string;
  id: string;
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export default function EditableBlock({ page, id, children, as: Tag = 'div', className, style, ...rest }: Props) {
  const { isIframeMode, getBlockStyle, notifyBlockSelected } = useIframeEdit();

  const blockStyle = getBlockStyle(page, id);
  const mergedStyle = { ...style, ...blockStyle };

  if (!isIframeMode) {
    return (
      <Tag className={className} style={mergedStyle} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={`${className ?? ''} group/block relative`}
      style={mergedStyle}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        notifyBlockSelected(page, id, e.currentTarget as HTMLElement);
      }}
      {...rest}
    >
      {children}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover/block:opacity-100 transition-opacity"
        style={{ outline: '2px dashed #f59e0b', borderRadius: 'inherit', zIndex: 9999 }}
      />
    </Tag>
  );
}
