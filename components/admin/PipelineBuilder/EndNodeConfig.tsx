'use client';

import { useState, useMemo } from 'react';
import { EndNodeData, TaskField, PipelineNode, PipelineEdge, SubtaskNodeData } from '@/types';

interface EndNodeConfigProps {
  nodeId: string;
  data: EndNodeData;
  allNodes: PipelineNode[];
  allEdges: PipelineEdge[];
  onUpdate: (nodeId: string, data: EndNodeData) => void;
  onClose: () => void;
}

interface AccumulatedSubtaskFields {
  nodeId: string;
  nodeLabel: string;
  fields: TaskField[];
}

function getAllPriorSubtaskFields(
  currentNodeId: string,
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): AccumulatedSubtaskFields[] {
  const priorSubtasks: AccumulatedSubtaskFields[] = [];
  const visited = new Set<string>();
  const addedNodeIds = new Set<string>();

  function traverseBackwards(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const incomingEdges = edges.filter(e => e.target === nodeId);

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        if (sourceNode.type === 'subtask' && !addedNodeIds.has(sourceNode.id)) {
          const subtaskData = sourceNode.data as SubtaskNodeData;
          priorSubtasks.push({
            nodeId: sourceNode.id,
            nodeLabel: subtaskData.label || 'Untitled Subtask',
            fields: subtaskData.fields || [],
          });
          addedNodeIds.add(sourceNode.id);
        }
        if (sourceNode.type !== 'start') {
          traverseBackwards(sourceNode.id);
        }
      }
    }
  }

  traverseBackwards(currentNodeId);
  return priorSubtasks.reverse();
}

export function EndNodeConfig({ nodeId, data, allNodes, allEdges, onUpdate, onClose }: EndNodeConfigProps) {
  const [label, setLabel] = useState(data.label || 'Pipeline Complete');
  const [description, setDescription] = useState(data.description || '');

  const priorSubtasks = useMemo(() => {
    return getAllPriorSubtaskFields(nodeId, allNodes, allEdges);
  }, [nodeId, allNodes, allEdges]);

  const totalFields = priorSubtasks.reduce((sum, s) => sum + s.fields.length, 0);

  const handleSave = () => {
    onUpdate(nodeId, {
      ...data,
      label,
      description,
    });
    onClose();
  };

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configure End</h3>
              <p className="text-xs text-gray-500">Pipeline completion point</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full text-xl font-bold bg-transparent border-b-2 border-transparent focus:border-gray-500 focus:outline-none pb-1 placeholder:text-gray-400"
            placeholder="Pipeline Complete"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm text-gray-600 bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none pb-1 placeholder:text-gray-400"
            placeholder="Add description (optional)"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Accumulated Fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Accumulated Fields</p>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {totalFields} total
            </span>
          </div>

          {priorSubtasks.length > 0 ? (
            <div className="space-y-3">
              {priorSubtasks.map((subtask) => (
                <div key={subtask.nodeId} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {subtask.nodeLabel}
                  </p>
                  {subtask.fields.length > 0 ? (
                    <div className="space-y-1 ml-4">
                      {subtask.fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">{field.label}</span>
                          <span className="text-xs text-gray-400">
                            {field.type === 'text' ? 'Short' : field.type === 'longtext' ? 'Long' : 'Info'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic ml-4">No fields defined</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">
              No subtasks connected yet
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">End Node Behavior</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Marks pipeline execution as completed</li>
            <li>• Cannot have outgoing connections</li>
            <li>• Pipeline can have multiple end nodes</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}
