'use client';

import { useState, useCallback, useMemo } from 'react';
import { PipelineCanvas } from './PipelineCanvas';
import { NodePalette } from './NodePalette';
import { StartNodeConfig } from './StartNodeConfig';
import { SubtaskNodeConfig } from './SubtaskNodeConfig';
import { ReviewNodeConfig } from './ReviewNodeConfig';
import { EndNodeConfig } from './EndNodeConfig';
import { PipelineNode, PipelineEdge, PipelineNodeType, StartNodeData, SubtaskNodeData, ReviewNodeData, EndNodeData, isStartNode, isSubtaskNode, isReviewNode, isEndNode } from '@/types';
import { validatePipeline } from '@/lib/pipeline/validator';

interface PipelineBuilderProps {
  pipelineName: string;
  pipelineDescription?: string;
  initialNodes?: PipelineNode[];
  initialEdges?: PipelineEdge[];
  onSave: (name: string, description: string, nodes: PipelineNode[], edges: PipelineEdge[]) => void;
  onCancel: () => void;
}

export function PipelineBuilder({
  pipelineName: initialName,
  pipelineDescription: initialDescription,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onCancel,
}: PipelineBuilderProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [nodes, setNodes] = useState<PipelineNode[]>(initialNodes);
  const [edges, setEdges] = useState<PipelineEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // Look up the selected node from current nodes state (always fresh)
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: PipelineNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleNodeClick = useCallback((node: PipelineNode) => {
    // Store just the ID, we'll look up fresh data when rendering
    setSelectedNodeId(node.id);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, data: StartNodeData | SubtaskNodeData | ReviewNodeData | EndNodeData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
    setSelectedNodeId(null);
    setIsPanelExpanded(false);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
    setIsPanelExpanded(false);
  }, []);

  const handleEdgesUpdate = useCallback((updatedEdges: PipelineEdge[]) => {
    setEdges(updatedEdges);
  }, []);

  const handleValidate = useCallback(() => {
    const result = validatePipeline({
      id: 'temp',
      name,
      description,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    });

    if (!result.valid) {
      setValidationErrors(result.errors.map((e) => e.message));
      return false;
    }

    setValidationErrors([]);
    return true;
  }, [name, description, nodes, edges]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setValidationErrors(['Pipeline name is required']);
      return;
    }

    if (!handleValidate()) {
      return;
    }

    onSave(name, description, nodes, edges);
  }, [name, description, nodes, edges, handleValidate, onSave]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Pipeline Name"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 mt-1"
              placeholder="Description (optional)"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleValidate}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
            >
              Validate
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
            >
              Save Pipeline
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded">
            <h4 className="font-semibold text-red-900 mb-2">Validation Errors:</h4>
            <ul className="list-disc list-inside text-sm text-red-800">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <div className="w-64 bg-white border-r border-gray-300 p-4 overflow-y-auto flex-shrink-0">
          <NodePalette onDragStart={onDragStart} />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Pipeline Stats</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Total Nodes: {nodes.length}</div>
              <div>Connections: {edges.length}</div>
              <div>
                Start: {nodes.filter((n) => n.type === 'start').length}
              </div>
              <div>
                Subtasks: {nodes.filter((n) => n.type === 'subtask').length}
              </div>
              <div>
                Reviews: {nodes.filter((n) => n.type === 'review').length}
              </div>
              <div>
                End: {nodes.filter((n) => n.type === 'end').length}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative">
          <PipelineCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeClick={handleNodeClick}
            onPaneClick={handleClosePanel}
          />
        </div>

        {/* Right Panel - Node Configuration (Slide-in) */}
        <div
          className={`
            flex-shrink-0 bg-gray-50 border-l border-gray-300 overflow-hidden
            transition-all duration-300 ease-in-out
            ${selectedNode 
              ? isPanelExpanded 
                ? 'w-[calc(100%-64px)]' 
                : 'w-[500px]' 
              : 'w-0'}
          `}
        >
          {selectedNode && (
            <div className="h-full overflow-y-auto relative">
              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                className="absolute top-1 left-1 z-20 p-1 bg-white/90 border border-gray-200 rounded shadow-sm hover:bg-gray-100 transition-colors"
                title={isPanelExpanded ? 'Collapse panel' : 'Expand panel'}
              >
                {isPanelExpanded ? (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5m6 6l5 5m0 0v-5m0 5h-5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                )}
              </button>
              {isStartNode(selectedNode) && (
                <StartNodeConfigPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  onUpdate={handleNodeUpdate}
                  onClose={handleClosePanel}
                />
              )}
              {isSubtaskNode(selectedNode) && (
                <SubtaskNodeConfigPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  allNodes={nodes}
                  allEdges={edges}
                  onUpdate={handleNodeUpdate}
                  onClose={handleClosePanel}
                />
              )}
              {isReviewNode(selectedNode) && (
                <ReviewNodeConfigPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  allNodes={nodes}
                  allEdges={edges}
                  onUpdate={handleNodeUpdate}
                  onEdgesUpdate={handleEdgesUpdate}
                  onClose={handleClosePanel}
                />
              )}
              {isEndNode(selectedNode) && (
                <EndNodeConfigPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  allNodes={nodes}
                  allEdges={edges}
                  onUpdate={handleNodeUpdate}
                  onClose={handleClosePanel}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Panel wrapper components that adapt the config components for the side panel layout
function StartNodeConfigPanel({
  node,
  onUpdate,
  onClose,
}: {
  node: PipelineNode & { type: 'start'; data: StartNodeData };
  onUpdate: (nodeId: string, data: StartNodeData) => void;
  onClose: () => void;
}) {
  return (
    <div className="h-full">
      <StartNodeConfig
        nodeId={node.id}
        data={node.data}
        onUpdate={onUpdate}
        onClose={onClose}
      />
    </div>
  );
}

function SubtaskNodeConfigPanel({
  node,
  allNodes,
  allEdges,
  onUpdate,
  onClose,
}: {
  node: PipelineNode & { type: 'subtask'; data: SubtaskNodeData };
  allNodes: PipelineNode[];
  allEdges: PipelineEdge[];
  onUpdate: (nodeId: string, data: SubtaskNodeData) => void;
  onClose: () => void;
}) {
  return (
    <div className="h-full">
      <SubtaskNodeConfig
        nodeId={node.id}
        data={node.data}
        allNodes={allNodes}
        allEdges={allEdges}
        onUpdate={onUpdate}
        onClose={onClose}
      />
    </div>
  );
}

function ReviewNodeConfigPanel({
  node,
  allNodes,
  allEdges,
  onUpdate,
  onEdgesUpdate,
  onClose,
}: {
  node: PipelineNode & { type: 'review'; data: ReviewNodeData };
  allNodes: PipelineNode[];
  allEdges: PipelineEdge[];
  onUpdate: (nodeId: string, data: ReviewNodeData) => void;
  onEdgesUpdate: (edges: PipelineEdge[]) => void;
  onClose: () => void;
}) {
  return (
    <div className="h-full">
      <ReviewNodeConfig
        nodeId={node.id}
        data={node.data}
        allNodes={allNodes}
        allEdges={allEdges}
        onUpdate={onUpdate}
        onEdgesUpdate={onEdgesUpdate}
        onClose={onClose}
      />
    </div>
  );
}

function EndNodeConfigPanel({
  node,
  allNodes,
  allEdges,
  onUpdate,
  onClose,
}: {
  node: PipelineNode & { type: 'end'; data: EndNodeData };
  allNodes: PipelineNode[];
  allEdges: PipelineEdge[];
  onUpdate: (nodeId: string, data: EndNodeData) => void;
  onClose: () => void;
}) {
  return (
    <div className="h-full">
      <EndNodeConfig
        nodeId={node.id}
        data={node.data}
        allNodes={allNodes}
        allEdges={allEdges}
        onUpdate={onUpdate}
        onClose={onClose}
      />
    </div>
  );
}
