import { 
  PipelineNode, 
  PipelineEdge,
  StartNodeData,
  SubtaskNodeData,
  ReviewNodeData,
  EndNodeData,
  TemplateNodeDefinition,
  TemplateEdgeDefinition
} from '@/types';
import { MarkerType } from '@xyflow/react';

export function generateTaskReviewPipeline(taskCount: number): { 
  nodes: PipelineNode[]; 
  edges: PipelineEdge[];
} {
  const timestamp = Date.now();
  const nodeDefinitions: TemplateNodeDefinition[] = [];
  const edgeDefinitions: TemplateEdgeDefinition[] = [];
  
  const baseY = 50;
  const rowHeight = 180;
  
  nodeDefinitions.push({
    type: 'start',
    label: 'Pipeline Start',
    position: { x: 100, y: baseY },
    data: { label: 'Pipeline Start' } as StartNodeData
  });
  
  for (let i = 0; i < taskCount; i++) {
    const taskNum = i + 1;
    const yPosition = baseY + (i + 1) * rowHeight;
    
    nodeDefinitions.push({
      type: 'subtask',
      label: `Task ${taskNum}`,
      position: { x: 100, y: yPosition },
      data: {
        label: `Task ${taskNum}`,
        fields: [],
        description: ''
      } as SubtaskNodeData
    });
    
    nodeDefinitions.push({
      type: 'review',
      label: `Review ${taskNum}`,
      position: { x: 350, y: yPosition },
      data: {
        label: `Review ${taskNum}`,
        sourceSubtaskNodeId: '',
        description: ''
      } as ReviewNodeData
    });
  }
  
  const endY = baseY + (taskCount + 1) * rowHeight;
  nodeDefinitions.push({
    type: 'end',
    label: 'Pipeline Complete',
    position: { x: 100, y: endY },
    data: { label: 'Pipeline Complete', description: '' } as EndNodeData
  });
  
  edgeDefinitions.push({ sourceIndex: 0, targetIndex: 1 });
  
  for (let i = 0; i < taskCount; i++) {
    const taskIndex = 1 + i * 2;
    const reviewIndex = 2 + i * 2;
    const nextTaskIndex = taskIndex + 2;
    const endIndex = nodeDefinitions.length - 1;
    
    edgeDefinitions.push({ sourceIndex: taskIndex, targetIndex: reviewIndex });
    
    edgeDefinitions.push({ 
      sourceIndex: reviewIndex, 
      targetIndex: taskIndex, 
      data: { type: 'reject' } 
    });
    
    if (i < taskCount - 1) {
      edgeDefinitions.push({ 
        sourceIndex: reviewIndex, 
        targetIndex: nextTaskIndex, 
        data: { type: 'accept' } 
      });
    } else {
      edgeDefinitions.push({ 
        sourceIndex: reviewIndex, 
        targetIndex: endIndex, 
        data: { type: 'accept' } 
      });
    }
  }
  
  const nodeIdMap: string[] = [];
  
  const nodes: PipelineNode[] = nodeDefinitions.map((nodeDef, index) => {
    const nodeId = `${nodeDef.type}-${timestamp + index}`;
    nodeIdMap.push(nodeId);
    return {
      id: nodeId,
      type: nodeDef.type,
      label: nodeDef.label,
      position: { ...nodeDef.position },
      data: { ...nodeDef.data },
    } as PipelineNode;
  });
  
  nodes.forEach((node, index) => {
    if (node.type === 'review') {
      const reviewData = node.data as ReviewNodeData;
      const templateEdge = edgeDefinitions.find(
        e => e.targetIndex === index && nodeDefinitions[e.sourceIndex].type === 'subtask'
      );
      if (templateEdge) {
        reviewData.sourceSubtaskNodeId = nodeIdMap[templateEdge.sourceIndex];
      }
    }
  });
  
  const edges: PipelineEdge[] = edgeDefinitions.map((edgeDef, index) => {
    const sourceId = nodeIdMap[edgeDef.sourceIndex];
    const targetId = nodeIdMap[edgeDef.targetIndex];
    const edgeType = edgeDef.data?.type;
    
    const edgeLabel = edgeType === 'accept' 
      ? 'Accept' 
      : edgeType === 'reject' 
        ? 'Reject' 
        : edgeType === 'max_attempts'
          ? 'Max Attempts'
          : undefined;

    const sourceHandle = edgeType === 'accept' 
      ? 'accept' 
      : edgeType === 'reject' 
        ? 'reject'
        : edgeType === 'max_attempts'
          ? 'max_attempts'
          : 'output';
    
    return {
      id: `edge-${sourceId}-${targetId}-${timestamp + index}`,
      source: sourceId,
      sourceHandle,
      target: targetId,
      targetHandle: 'input',
      type: 'deletable',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      label: edgeLabel,
      data: edgeDef.data || {},
    } as PipelineEdge;
  });
  
  return { nodes, edges };
}
