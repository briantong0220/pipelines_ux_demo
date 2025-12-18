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

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div
      className={`group relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px] ${
        selected ? 'border-purple-500' : 'border-gray-300'
      }`}
    >
      {/* Delete button - shows on hover */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center shadow-sm"
        title="Delete node"
      >
        ×
      </button>

      {/* Input handle - top (receives from subtask) */}
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
        </div>
        <div className="font-semibold text-gray-900">
          {data.label || 'Untitled Review'}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 mt-1">{data.description}</div>
        )}
        <div className="flex justify-between gap-2 mt-3 text-xs">
          <div className="flex-1 text-center px-2 py-1 bg-green-100 text-green-700 rounded border border-green-300">
            ✓ Accept
          </div>
          <div className="flex-1 text-center px-2 py-1 bg-red-100 text-red-700 rounded border border-red-300">
            ✗ Reject
          </div>
        </div>
      </div>

      {/* Output handles - bottom (accept left, reject right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="accept"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-green-700"
        style={{ left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="reject"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-red-700"
        style={{ left: '75%' }}
      />
    </div>
  );
});

ReviewNode.displayName = 'ReviewNode';
