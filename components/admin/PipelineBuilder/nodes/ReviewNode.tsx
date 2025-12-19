'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { ReviewNodeData } from '@/types';

interface ReviewNodeProps {
  id: string;
  data: ReviewNodeData;
  selected?: boolean;
}

export const ReviewNode = memo(({ id, data, selected }: ReviewNodeProps) => {
  const { deleteElements } = useReactFlow();
  const hasMaxAttempts = data.maxAttempts !== undefined && data.maxAttempts > 0;

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div
      className={`group relative px-4 py-4 rounded-lg border-2 bg-white shadow-md ${
        hasMaxAttempts ? 'min-w-[280px]' : 'min-w-[200px]'
      } ${selected ? 'border-purple-500' : 'border-gray-300'}`}
    >
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center shadow-sm"
        title="Delete node"
      >
        ×
      </button>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-600"
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-xs font-medium text-gray-500 uppercase">Review</span>
          {hasMaxAttempts && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-300">
              max {data.maxAttempts}
            </span>
          )}
        </div>
        <div className="font-semibold text-gray-900">
          {data.label || 'Untitled Review'}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 mt-1">{data.description}</div>
        )}

        <div className={`grid mt-4 mb-2 text-xs ${hasMaxAttempts ? 'grid-cols-3' : 'grid-cols-2'} gap-1`}>
          <div className="text-center px-2 py-1.5 bg-green-100 text-green-700 rounded border border-green-300">
            ✓ Accept
          </div>
          <div className="text-center px-2 py-1.5 bg-red-100 text-red-700 rounded border border-red-300">
            ✗ Reject
          </div>
          {hasMaxAttempts && (
            <div className="text-center px-2 py-1.5 bg-orange-100 text-orange-700 rounded border border-orange-300">
              ⚡ Escalate
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="accept"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-green-700"
        style={{ left: hasMaxAttempts ? '16.66%' : '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="reject"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-red-700"
        style={{ left: hasMaxAttempts ? '50%' : '75%' }}
      />
      {hasMaxAttempts && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="max_attempts"
          className="!w-3 !h-3 !bg-orange-500 !border-2 !border-orange-700"
          style={{ left: '83.33%' }}
        />
      )}
    </div>
  );
});

ReviewNode.displayName = 'ReviewNode';
