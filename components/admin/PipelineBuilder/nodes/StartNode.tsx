'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { StartNodeData } from '@/types';

interface StartNodeProps {
  id: string;
  data: StartNodeData;
  selected?: boolean;
}

export const StartNode = memo(({ id, data, selected }: StartNodeProps) => {
  const { deleteElements } = useReactFlow();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div
      className={`group relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px] ${
        selected ? 'border-emerald-500' : 'border-emerald-300'
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

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-gray-500 uppercase">Start</span>
        </div>
        <div className="font-semibold text-gray-900">
          {data.label || 'Pipeline Start'}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 mt-1">{data.description}</div>
        )}
        <div className="text-xs text-emerald-600 mt-1 font-medium">
          → Execution begins here
        </div>
      </div>

      {/* Output handle only - start node has no input */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-700"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';

