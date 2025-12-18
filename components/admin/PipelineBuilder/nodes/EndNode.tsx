'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { EndNodeData } from '@/types';

interface EndNodeProps {
  id: string;
  data: EndNodeData;
  selected?: boolean;
}

export const EndNode = memo(({ id, data, selected }: EndNodeProps) => {
  const { deleteElements } = useReactFlow();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div
      className={`group relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px] ${
        selected ? 'border-gray-700' : 'border-gray-300'
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

      {/* Input handle - top only (no output for end node) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-600"
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-700" />
          <span className="text-xs font-medium text-gray-500 uppercase">End</span>
        </div>
        <div className="font-semibold text-gray-900">
          {data.label || 'Pipeline Complete'}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 mt-1">{data.description}</div>
        )}
        <div className="text-xs text-green-600 mt-1 font-medium">
          ✓ Pipeline terminates here
        </div>
      </div>

      {/* No output handle - end node is terminal */}
    </div>
  );
});

EndNode.displayName = 'EndNode';
