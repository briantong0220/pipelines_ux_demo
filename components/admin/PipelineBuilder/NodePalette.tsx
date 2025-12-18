'use client';

import { PipelineNodeType } from '@/types';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: PipelineNodeType) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Node Types</h3>
      <div className="flex flex-col gap-2">
        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'start')}
          className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded cursor-move hover:bg-emerald-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-900">Start</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            Pipeline begins here
          </p>
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'subtask')}
          className="px-3 py-2 bg-blue-50 border border-blue-300 rounded cursor-move hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-900">Subtask</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Editors fill in fields
          </p>
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'review')}
          className="px-3 py-2 bg-purple-50 border border-purple-300 rounded cursor-move hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-sm font-medium text-purple-900">Review</span>
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Accept/reject fields
          </p>
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'end')}
          className="px-3 py-2 bg-gray-50 border border-gray-300 rounded cursor-move hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-700" />
            <span className="text-sm font-medium text-gray-900">End</span>
          </div>
          <p className="text-xs text-gray-700 mt-1">
            Pipeline completion
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Drag a node onto the canvas to add it to your pipeline
        </p>
      </div>
    </div>
  );
}
