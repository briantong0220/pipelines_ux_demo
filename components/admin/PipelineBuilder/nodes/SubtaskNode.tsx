'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { SubtaskNodeData } from '@/types';

interface SubtaskNodeProps {
  id: string;
  data: SubtaskNodeData;
  selected?: boolean;
}

export const SubtaskNode = memo(({ id, data, selected }: SubtaskNodeProps) => {
  const { deleteElements } = useReactFlow();
  const fields = data.fields || [];
  const instructionCount = fields.filter(f => f.type === 'instructions').length;
  const editableCount = fields.filter(f => f.type !== 'instructions').length;

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div
      className={`group relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px] ${selected ? 'border-blue-500' : 'border-gray-300'
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

      {/* Input handle - top (receives from previous node) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-600"
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-gray-500 uppercase">Subtask</span>
        </div>
        <div className="font-semibold text-gray-900">
          {data.label || 'Untitled Subtask'}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 mt-1">{data.description}</div>
        )}
        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
          {editableCount > 0 && (
            <span>{editableCount} {editableCount === 1 ? 'field' : 'fields'}</span>
          )}
          {instructionCount > 0 && (
            <span className="text-amber-600">{instructionCount} instr</span>
          )}
          {editableCount === 0 && instructionCount === 0 && (
            <span>No fields</span>
          )}
        </div>
      </div>

      {/* Output handle - bottom (connects to review node) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-700"
      />
    </div>
  );
});

SubtaskNode.displayName = 'SubtaskNode';
