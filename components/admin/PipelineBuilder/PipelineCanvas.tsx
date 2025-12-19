'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  NodeTypes,
  EdgeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode } from './nodes/StartNode';
import { SubtaskNode } from './nodes/SubtaskNode';
import { ReviewNode } from './nodes/ReviewNode';
import { EndNode } from './nodes/EndNode';
import DeletableEdge from './edges/DeletableEdge';
import { PipelineNode, PipelineEdge, PipelineNodeType, EdgePathType } from '@/types';

const nodeTypes: NodeTypes = {
  start: StartNode,
  subtask: SubtaskNode,
  review: ReviewNode,
  end: EndNode,
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

interface PipelineCanvasProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  edgePathType: EdgePathType;
  onNodesChange: (nodes: PipelineNode[]) => void;
  onEdgesChange: (edges: PipelineEdge[]) => void;
  onEdgePathTypeChange: (pathType: EdgePathType) => void;
  onNodeClick?: (node: PipelineNode) => void;
  onPaneClick?: () => void;
}

export function PipelineCanvas({
  nodes: externalNodes,
  edges: externalEdges,
  edgePathType,
  onNodesChange,
  onEdgesChange,
  onEdgePathTypeChange,
  onNodeClick,
  onPaneClick,
}: PipelineCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(externalNodes as Node[]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(externalEdges as Edge[]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Track if we're syncing from external to prevent feedback loops
  const isSyncingFromExternal = useRef(false);
  // Track if we're making internal changes (to skip external sync)
  const isInternalChange = useRef(false);

  // Sync external node changes (from config panels) to internal React Flow state
  // Only sync when external changes come from config panels, not from our internal updates
  useEffect(() => {
    // Skip sync if this is a result of our own internal change
    if (isInternalChange.current) return;
    // Skip sync during active drag operations
    if (isDragging.current) return;

    // Compare by serializing to avoid unnecessary updates
    const externalJSON = JSON.stringify(externalNodes);
    const internalJSON = JSON.stringify(nodes);

    if (externalJSON !== internalJSON) {
      isSyncingFromExternal.current = true;
      setNodes(externalNodes as Node[]);
      // Reset the flag after the state update has been processed
      requestAnimationFrame(() => {
        isSyncingFromExternal.current = false;
      });
    }
  }, [externalNodes, setNodes, nodes]);

  // Sync external edge changes to internal React Flow state
  useEffect(() => {
    // Skip sync if this is a result of our own internal change
    if (isInternalChange.current) return;

    const externalJSON = JSON.stringify(externalEdges);
    const internalJSON = JSON.stringify(edges);

    if (externalJSON !== internalJSON) {
      isSyncingFromExternal.current = true;
      setEdges(externalEdges as Edge[]);
      requestAnimationFrame(() => {
        isSyncingFromExternal.current = false;
      });
    }
  }, [externalEdges, setEdges, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edgeType = params.sourceHandle === 'accept'
        ? 'accept'
        : params.sourceHandle === 'reject'
          ? 'reject'
          : params.sourceHandle === 'max_attempts'
            ? 'max_attempts'
            : undefined;

      const edgeLabel = edgeType === 'max_attempts'
        ? 'Max Attempts'
        : edgeType
          ? edgeType.charAt(0).toUpperCase() + edgeType.slice(1)
          : undefined;

      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'deletable',
        data: { type: edgeType },
        label: edgeLabel,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };

      // Auto-detect sourceSubtaskNodeId for review nodes
      // When a subtask connects to a review node, set the review's sourceSubtaskNodeId
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (sourceNode?.type === 'subtask' && targetNode?.type === 'review') {
        // Mark as internal change
        isInternalChange.current = true;

        // Update the review node's data to reference this subtask
        setNodes((nds) => {
          const updated = nds.map((node) => {
            if (node.id === params.target) {
              return {
                ...node,
                data: {
                  ...node.data,
                  sourceSubtaskNodeId: params.source,
                },
              };
            }
            return node;
          });
          // Notify parent after state update via setTimeout
          setTimeout(() => {
            onNodesChange(updated as PipelineNode[]);
            isInternalChange.current = false;
          }, 0);
          return updated;
        });
      }

      // Mark as internal change
      isInternalChange.current = true;

      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        // Notify parent after state update via setTimeout
        setTimeout(() => {
          onEdgesChange(updated as PipelineEdge[]);
          isInternalChange.current = false;
        }, 0);
        return updated;
      });
    },
    [setEdges, onEdgesChange, nodes, setNodes, onNodesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow') as PipelineNodeType;
      if (!type) return;

      // Get the drag offset to account for where the user grabbed the element
      let offsetX = 0;
      let offsetY = 0;
      try {
        const offsetData = event.dataTransfer.getData('application/offset');
        if (offsetData) {
          const offset = JSON.parse(offsetData);
          offsetX = offset.x || 0;
          offsetY = offset.y || 0;
        }
      } catch {
        // Ignore parsing errors, use default offset of 0
      }

      // screenToFlowPosition expects absolute screen coordinates
      // Subtract the offset so the node appears where the user actually dropped it
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - offsetX,
        y: event.clientY - offsetY,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let nodeData: any = {};
      let label = '';

      switch (type) {
        case 'start':
          label = 'Pipeline Start';
          nodeData = { label };
          break;
        case 'subtask':
          label = 'New Subtask';
          nodeData = { fields: [], label };
          break;
        case 'review':
          label = 'New Review';
          nodeData = { sourceSubtaskNodeId: '', label };
          break;
        case 'end':
          label = 'Pipeline Complete';
          nodeData = { label };
          break;
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: nodeData,
      };

      // Mark as internal change to prevent external sync from reverting
      isInternalChange.current = true;

      setNodes((nds) => {
        const updated = nds.concat(newNode);
        // Notify parent after state update via setTimeout to avoid setState during render
        setTimeout(() => {
          onNodesChange(updated as PipelineNode[]);
          // Reset flag after parent is notified
          isInternalChange.current = false;
        }, 0);
        return updated;
      });
    },
    [reactFlowInstance, setNodes, onNodesChange]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        // Look up the node from external state to ensure we have the latest data
        const latestNode = externalNodes.find(n => n.id === node.id);
        if (latestNode) {
          onNodeClick(latestNode);
        } else {
          onNodeClick(node as PipelineNode);
        }
      }
    },
    [onNodeClick, externalNodes]
  );

  // Refs to store latest nodes/edges for deferred callbacks
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  // Track if a node is currently being dragged
  const isDragging = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const handleNodesChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      onNodesChangeInternal(changes);

      // Don't propagate changes back to parent if we're syncing from external
      if (isSyncingFromExternal.current) return;

      // Check if this is a drag operation
      const positionChanges = changes.filter((c: { type: string }) => c.type === 'position');
      const isCurrentlyDragging = positionChanges.some((c: { dragging?: boolean }) => c.dragging === true);
      const dragEnded = positionChanges.some((c: { dragging?: boolean }) => c.dragging === false);

      if (isCurrentlyDragging) {
        // We're actively dragging - just update internal state, don't sync to parent yet
        isDragging.current = true;
        return;
      }

      if (dragEnded && isDragging.current) {
        // Drag just ended - now sync the final position to parent
        isDragging.current = false;
        isInternalChange.current = true;
        setTimeout(() => {
          onNodesChange(nodesRef.current as PipelineNode[]);
          isInternalChange.current = false;
        }, 0);
        return;
      }

      // For non-drag changes (delete, selection, etc.), propagate immediately
      isInternalChange.current = true;
      setTimeout(() => {
        onNodesChange(nodesRef.current as PipelineNode[]);
        isInternalChange.current = false;
      }, 0);
    },
    [onNodesChangeInternal, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any) => {
      onEdgesChangeInternal(changes);

      // Don't propagate changes back to parent if we're syncing from external
      if (isSyncingFromExternal.current) return;

      // Mark as internal change
      isInternalChange.current = true;

      setTimeout(() => {
        onEdgesChange(edgesRef.current as PipelineEdge[]);
        isInternalChange.current = false;
      }, 0);
    },
    [onEdgesChangeInternal, onEdgesChange]
  );

  // Add pathType to edge data for rendering
  const edgesWithPathType = edges.map(edge => ({
    ...edge,
    data: {
      ...edge.data,
      pathType: edgePathType,
    },
  }));

  return (
    <div ref={reactFlowWrapper} className="w-full h-full bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edgesWithPathType}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        deleteKeyCode="Delete"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'subtask':
                return '#3b82f6';
              case 'review':
                return '#a855f7';
              case 'end':
                return '#374151';
              default:
                return '#6b7280';
            }
          }}
        />
      </ReactFlow>

      {/* Edge Path Type Toggle */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => onEdgePathTypeChange('bezier')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${edgePathType === 'bezier'
            ? 'bg-blue-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
          title="Curved edges"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20 C 10 20, 14 4, 20 4" />
          </svg>
        </button>
        <button
          onClick={() => onEdgePathTypeChange('smoothstep')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${edgePathType === 'smoothstep'
            ? 'bg-blue-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
          title="Stepped edges"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20 L 4 12 L 20 12 L 20 4" />
          </svg>
        </button>
        <button
          onClick={() => onEdgePathTypeChange('straight')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${edgePathType === 'straight'
            ? 'bg-blue-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
          title="Straight edges"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20 L 20 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
