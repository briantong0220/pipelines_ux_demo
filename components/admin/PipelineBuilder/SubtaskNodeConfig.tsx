'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SubtaskNodeData, TaskField, FieldType, PipelineNode, PipelineEdge } from '@/types';

interface SubtaskNodeConfigProps {
  nodeId: string;
  data: SubtaskNodeData;
  allNodes: PipelineNode[];
  allEdges: PipelineEdge[];
  onUpdate: (nodeId: string, data: SubtaskNodeData) => void;
  onClose: () => void;
}

interface AccumulatedSubtaskFields {
  nodeId: string;
  nodeLabel: string;
  fields: TaskField[];
}

// Traverse backwards through the pipeline to find all prior subtask nodes
function getPriorSubtaskFields(
  currentNodeId: string,
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): AccumulatedSubtaskFields[] {
  const priorSubtasks: AccumulatedSubtaskFields[] = [];
  const visited = new Set<string>();

  function traverseBackwards(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const incomingEdges = edges.filter(e => e.target === nodeId);

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        if (sourceNode.type === 'subtask') {
          if (sourceNode.id !== currentNodeId) {
            const subtaskData = sourceNode.data as SubtaskNodeData;
            priorSubtasks.push({
              nodeId: sourceNode.id,
              nodeLabel: subtaskData.label || 'Untitled Subtask',
              fields: subtaskData.fields || [],
            });
          }
        }
        if (sourceNode.type !== 'start') {
          traverseBackwards(sourceNode.id);
        }
      }
    }
  }

  traverseBackwards(currentNodeId);
  return priorSubtasks;
}

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: string; description: string }[] = [
  { value: 'text', label: 'Short answer', icon: '━', description: 'Single line text' },
  { value: 'longtext', label: 'Paragraph', icon: '≡', description: 'Multi-line text' },
  { value: 'dynamic', label: 'Dynamic input', icon: '+', description: 'Expandable multi-entry' },
  { value: 'file', label: 'File upload', icon: '↑', description: 'Upload documents or images' },
  { value: 'instructions', label: 'Instructions', icon: 'ℹ', description: 'Read-only guidance' },
];

const SUBFIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Short answer', icon: '━' },
  { value: 'longtext', label: 'Paragraph', icon: '≡' },
];

interface DynamicSubfieldsConfigProps {
  subfields: TaskField[];
  onUpdate: (subfields: TaskField[]) => void;
  isActive: boolean;
}

function DynamicSubfieldsConfig({ subfields, onUpdate, isActive }: DynamicSubfieldsConfigProps) {
  const handleAddSubfield = (type: FieldType) => {
    const newSubfield: TaskField = {
      id: `subfield-${Date.now()}`,
      label: '',
      type,
    };
    onUpdate([...subfields, newSubfield]);
  };

  const handleUpdateSubfield = (subfieldId: string, updates: Partial<TaskField>) => {
    onUpdate(subfields.map(sf => sf.id === subfieldId ? { ...sf, ...updates } : sf));
  };

  const handleDeleteSubfield = (subfieldId: string) => {
    onUpdate(subfields.filter(sf => sf.id !== subfieldId));
  };

  return (
    <div
      className={`mt-3 pt-3 border-t border-gray-100 ${isActive ? 'opacity-100' : 'opacity-70'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entry Structure</span>
        <span className="text-xs text-gray-400">({subfields.length} field{subfields.length !== 1 ? 's' : ''})</span>
      </div>

      {subfields.length === 0 ? (
        <div className="text-xs text-gray-400 mb-2 italic">
          Define what each entry looks like
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {subfields.map((subfield, idx) => (
            <div key={subfield.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
              <select
                value={subfield.type}
                onChange={(e) => handleUpdateSubfield(subfield.id, { type: e.target.value as FieldType })}
                className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
              >
                {SUBFIELD_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={subfield.label}
                onChange={(e) => handleUpdateSubfield(subfield.id, { label: e.target.value })}
                placeholder="Field label"
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => handleDeleteSubfield(subfield.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {SUBFIELD_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleAddSubfield(opt.value)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface FieldCardProps {
  field: TaskField;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<TaskField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function FieldCard({
  field,
  index,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: FieldCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const currentType = FIELD_TYPE_OPTIONS.find(t => t.value === field.type) || FIELD_TYPE_OPTIONS[0];

  return (
    <div
      draggable={!isActive}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onActivate}
      className={`
        group relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isActive
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-100'
          : 'border-gray-200 hover:border-gray-300 shadow-sm'
        }
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isDragOver ? 'border-blue-400 border-dashed' : ''}
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-lg" />
      )}

      <div className="flex">
        {/* Index + Drag Handle */}
        <div
          className={`
            flex items-center justify-center gap-1 px-2 cursor-grab active:cursor-grabbing
            text-gray-300 hover:text-gray-500 transition-colors
            ${isActive ? 'pl-3' : ''}
          `}
          title="Drag to reorder"
        >
          <span className="text-xs font-medium text-gray-400 w-4 text-center">{index + 1}</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>

        {/* Field Content */}
        <div className="flex-1 p-4 pl-2">
          {/* Field Label Input */}
          <input
            ref={inputRef}
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={field.type === 'instructions' ? 'Enter instructions...' : 'Question'}
            className={`
              w-full text-base font-medium bg-transparent border-b-2 
              focus:outline-none transition-colors pb-1 mb-3
              ${isActive
                ? 'border-gray-300 focus:border-blue-500'
                : 'border-transparent'
              }
              ${field.type === 'instructions' ? 'text-amber-800' : 'text-gray-900'}
            `}
          />

          {/* Field Type & Options Row */}
          <div className="flex items-center gap-4">
            {/* Type Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTypeDropdown(!showTypeDropdown);
                }}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-sm
                  ${field.type === 'instructions'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-lg leading-none">{currentType.icon}</span>
                <span>{currentType.label}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Type Dropdown */}
              {showTypeDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTypeDropdown(false);
                    }}
                  />
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                    {FIELD_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate({ type: option.value });
                          setShowTypeDropdown(false);
                        }}
                        className={`
                          w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors
                          ${field.type === option.value ? 'bg-blue-50' : ''}
                        `}
                      >
                        <span className={`text-xl leading-none w-6 text-center ${option.value === 'instructions' ? 'text-amber-500' : 'text-gray-600'}`}>
                          {option.icon}
                        </span>
                        <div>
                          <div className={`font-medium ${field.type === option.value ? 'text-blue-700' : 'text-gray-900'}`}>
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                        {field.type === option.value && (
                          <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {field.type !== 'instructions' && field.type !== 'dynamic' && field.type !== 'file' && (
              <div className="flex-1 max-w-xs">
                {field.type === 'text' ? (
                  <div className="border-b border-gray-300 border-dotted pb-1 text-sm text-gray-400">
                    Short answer text
                  </div>
                ) : (
                  <div className="border-b border-gray-300 border-dotted pb-1 text-sm text-gray-400">
                    Long answer text
                  </div>
                )}
              </div>
            )}

            {field.type === 'file' && (
              <div className="flex-1 max-w-xs">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>↑</span>
                  <span>{field.acceptedFileTypes || 'Any file'}</span>
                  {field.maxFileSizeMB && <span>• Max {field.maxFileSizeMB}MB</span>}
                </div>
              </div>
            )}
          </div>

          {field.type === 'dynamic' && (
            <DynamicSubfieldsConfig
              subfields={field.subfields || []}
              onUpdate={(subfields) => onUpdate({ subfields })}
              isActive={isActive}
            />
          )}

          {field.type === 'file' && isActive && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Accepted file types</label>
                <input
                  type="text"
                  value={field.acceptedFileTypes || ''}
                  onChange={(e) => onUpdate({ acceptedFileTypes: e.target.value || undefined })}
                  placeholder=".pdf,.doc,.docx or image/*"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty for any file type</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max file size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={field.maxFileSizeMB || ''}
                  onChange={(e) => onUpdate({ maxFileSizeMB: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="10"
                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Action Buttons - Always visible on hover, expanded when active */}
          <div className={`
            flex items-center justify-between mt-3 pt-3 border-t border-gray-100
            ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            transition-opacity
          `}>
            {/* Required Toggle - Only for non-instruction fields */}
            {field.type !== 'instructions' ? (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-sm text-gray-600">Required</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ required: !field.required });
                  }}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${field.required ? 'bg-blue-500' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform
                      ${field.required ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </label>
            ) : (
              <span className="text-xs text-gray-400 italic">Instructions are read-only</span>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Duplicate"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified instruction card - just a text input, no configuration
interface InstructionCardProps {
  field: TaskField;
  index: number;
  onUpdate: (updates: Partial<TaskField>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function InstructionCard({
  field,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: InstructionCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`
        group relative bg-amber-50 rounded-lg border border-amber-200 transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isDragOver ? 'border-amber-400 border-dashed' : ''}
      `}
    >
      <div className="flex">
        {/* Index + Drag Handle */}
        <div
          className="flex items-center justify-center gap-1 px-2 cursor-grab active:cursor-grabbing text-amber-300 hover:text-amber-500 transition-colors"
          title="Drag to reorder"
        >
          <span className="text-xs font-medium text-amber-500 w-4 text-center">{index + 1}</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 py-3 pr-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Instructions</span>
          </div>
          <textarea
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Enter instructions for the editor..."
            className="w-full text-sm text-amber-900 bg-transparent border-none focus:outline-none resize-none placeholder:text-amber-400"
            rows={2}
          />
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="self-start p-2 m-1 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

type TabType = 'edit' | 'preview';

export function SubtaskNodeConfig({ nodeId, data, allNodes, allEdges, onUpdate, onClose }: SubtaskNodeConfigProps) {
  const [label, setLabel] = useState(data.label || '');
  const [description, setDescription] = useState(data.description || '');
  const [fields, setFields] = useState<TaskField[]>(data.fields || []);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('edit');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hidePriorFields, setHidePriorFields] = useState(data.hidePriorFields ?? false);

  const priorSubtasks = useMemo(() => {
    return getPriorSubtaskFields(nodeId, allNodes, allEdges);
  }, [nodeId, allNodes, allEdges]);

  const handleAddField = useCallback((type: FieldType = 'text') => {
    const newField: TaskField = {
      id: `field-${Date.now()}`,
      label: '',
      type,
    };
    setFields(prev => [...prev, newField]);
    setActiveFieldId(newField.id);
  }, []);

  const handleUpdateField = useCallback((fieldId: string, updates: Partial<TaskField>) => {
    setFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    ));
  }, []);

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    if (activeFieldId === fieldId) {
      setActiveFieldId(null);
    }
  }, [activeFieldId]);

  const handleDuplicateField = useCallback((fieldId: string) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (fieldToDuplicate) {
      const newField: TaskField = {
        ...fieldToDuplicate,
        id: `field-${Date.now()}`,
        label: `${fieldToDuplicate.label} (copy)`,
      };
      const index = fields.findIndex(f => f.id === fieldId);
      setFields(prev => {
        const newFields = [...prev];
        newFields.splice(index + 1, 0, newField);
        return newFields;
      });
      setActiveFieldId(newField.id);
    }
  }, [fields]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setFields(prev => {
        const newFields = [...prev];
        const [removed] = newFields.splice(draggedIndex, 1);
        newFields.splice(dragOverIndex, 0, removed);
        return newFields;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex]);

  const handleSave = () => {
    onUpdate(nodeId, {
      ...data,
      label,
      description,
      fields,
      hidePriorFields,
    });
    onClose();
  };

  // Click outside to deselect field
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="bg-gray-50 h-full flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configure Subtask</h3>
                <p className="text-xs text-gray-500">Define fields for editors to fill</p>
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
              className="w-full text-xl font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-1 placeholder:text-gray-400"
              placeholder="Untitled subtask"
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

        {/* Tabs */}
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'edit'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'preview'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'edit' ? (
        /* Edit Tab Content */
        <div
          className="flex-1 overflow-y-auto p-6"
          onClick={() => setActiveFieldId(null)}
        >
          {/* Inherited Fields */}
          {priorSubtasks.length > 0 && (
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Inherited from previous subtasks</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHidePriorFields(!hidePriorFields);
                  }}
                  className={`p-1.5 rounded transition-colors ${!hidePriorFields
                    ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    }`}
                  title={!hidePriorFields ? 'Hide from editors' : 'Show to editors'}
                >
                  {!hidePriorFields ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {!hidePriorFields && (
                <div className="space-y-2 mt-3">
                  {priorSubtasks.map((subtask) => (
                    <div key={subtask.nodeId} className="text-sm">
                      <span className="font-medium text-gray-600">{subtask.nodeLabel}:</span>
                      <span className="text-gray-500 ml-2">
                        {subtask.fields.length > 0
                          ? subtask.fields.map(f => f.label || 'Untitled').join(', ')
                          : 'No fields'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Field Cards */}
          <div className="space-y-3">
            {fields.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddField('text');
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Add your first field</p>
                <p className="text-sm text-gray-400 mt-1">Click here or use the button below</p>
              </div>
            ) : (
              fields.map((field, index) => (
                field.type === 'instructions' ? (
                  <InstructionCard
                    key={field.id}
                    field={field}
                    index={index}
                    onUpdate={(updates) => handleUpdateField(field.id, updates)}
                    onDelete={() => handleDeleteField(field.id)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                  />
                ) : (
                  <FieldCard
                    key={field.id}
                    field={field}
                    index={index}
                    isActive={activeFieldId === field.id}
                    onActivate={() => setActiveFieldId(field.id)}
                    onUpdate={(updates) => handleUpdateField(field.id, updates)}
                    onDelete={() => handleDeleteField(field.id)}
                    onDuplicate={() => handleDuplicateField(field.id)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                  />
                )
              ))
            )}
          </div>

          {/* Add Field Button */}
          {fields.length > 0 && (
            <div className="mt-4">
              <AddFieldButton onAdd={handleAddField} />
            </div>
          )}
        </div>
      ) : (
        /* Preview Tab Content */
        <div className="flex-1 overflow-y-auto">
          <PreviewPane
            label={label}
            description={description}
            fields={fields}
            priorSubtasks={priorSubtasks}
            hidePriorFields={hidePriorFields}
          />
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {fields.length} {fields.length === 1 ? 'field' : 'fields'}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 font-medium transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Field Button Component
function AddFieldButton({ onAdd }: { onAdd: (type: FieldType) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd('text')}
      className="group flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors w-full"
    >
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="font-medium text-gray-700 group-hover:text-blue-600">Add field</span>
    </button>
  );
}

// Preview Pane Component - Shows what editors will see
interface PreviewPaneProps {
  label: string;
  description: string;
  fields: TaskField[];
  priorSubtasks: AccumulatedSubtaskFields[];
  hidePriorFields: boolean;
}

function PreviewPane({ label, description, fields, priorSubtasks, hidePriorFields }: PreviewPaneProps) {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-gray-50 min-h-full">
      {/* Preview Header Banner */}
      <div className="bg-blue-600 text-white px-6 py-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-sm font-medium">Preview Mode</span>
        <span className="text-xs text-blue-200 ml-2">— This is how editors will see this subtask</span>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="border-t-4 border-blue-500 px-6 py-5">
            <h2 className="text-2xl font-bold text-gray-900">
              {label || 'Untitled subtask'}
            </h2>
            {description && (
              <p className="text-gray-600 mt-2">{description}</p>
            )}
          </div>

          {/* Prior Subtask Fields (Read-only) */}
          {!hidePriorFields && priorSubtasks.length > 0 && priorSubtasks.some(s => s.fields.length > 0) && (
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Previous responses (read-only)
                </p>
                {priorSubtasks.map((subtask) => (
                  subtask.fields.length > 0 && (
                    <div key={subtask.nodeId} className="mb-4 last:mb-0">
                      <p className="text-xs font-medium text-gray-400 mb-2">{subtask.nodeLabel}</p>
                      {subtask.fields.filter(f => f.type !== 'instructions').map((field) => (
                        <div key={field.id} className="mb-2">
                          <label className="block text-sm text-gray-600 mb-1">{field.label || 'Untitled'}</label>
                          <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-500 italic">
                            [Previous value would appear here]
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="px-6 pb-6 space-y-5">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No fields added yet</p>
                <p className="text-sm mt-1">Switch to Edit tab to add fields</p>
              </div>
            ) : (
              fields.map((field) => (
                <div key={field.id}>
                  {field.type === 'instructions' ? (
                    <p className="text-sm text-gray-600 italic py-2 whitespace-pre-wrap">
                      {field.label || 'Instructions will appear here...'}
                    </p>
                  ) : field.type === 'dynamic' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label || 'Untitled field'}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="space-y-3">
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Entry 1</span>
                            <button
                              disabled
                              className="p-1 text-gray-300 cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          {(!field.subfields || field.subfields.length === 0) ? (
                            <p className="text-xs text-gray-400 italic">No sub-fields defined</p>
                          ) : (
                            <div className="space-y-2">
                              {field.subfields.map((subfield) => (
                                <div key={subfield.id}>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    {subfield.label || 'Untitled'}
                                  </label>
                                  {subfield.type === 'text' ? (
                                    <input
                                      type="text"
                                      disabled
                                      placeholder="Short answer"
                                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white text-gray-400 cursor-not-allowed"
                                    />
                                  ) : (
                                    <textarea
                                      disabled
                                      placeholder="Long answer"
                                      rows={2}
                                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white text-gray-400 cursor-not-allowed resize-none"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          disabled
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add entry
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Editors can add multiple entries</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label || 'Untitled field'}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'text' ? (
                        <input
                          type="text"
                          disabled
                          placeholder="Short answer text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-400 cursor-not-allowed"
                        />
                      ) : (
                        <textarea
                          disabled
                          placeholder="Long answer text"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-400 cursor-not-allowed resize-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Submit Button Preview */}
          {fields.length > 0 && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium opacity-75 cursor-not-allowed"
              >
                Submit
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">
                This button is disabled in preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
