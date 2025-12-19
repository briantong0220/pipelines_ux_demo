import {
  EditorQueueItem,
  ReviewerQueueItem,
  FieldToReview,
  AccumulatedField,
  SubtaskNodeData,
  ReviewNodeData,
  Pipeline,
  PipelineExecution,
  SubtaskExecution,
  isSubtaskExecution,
  isReviewExecution
} from '@/types';
import { getActiveExecutions } from './executions';
import { getPipelines } from './pipelines';
import { getRejectedFieldIds, getAcceptedFieldValues } from '@/lib/pipeline/executor';

/**
 * Get all subtask nodes that come before a given node in the pipeline
 * by traversing backwards through edges.
 * Excludes the current node itself to prevent infinite loops when a review
 * reject edge points back to its source subtask.
 */
function getPriorSubtaskNodeIds(pipeline: Pipeline, currentNodeId: string): string[] {
  const priorNodeIds: string[] = [];
  const visited = new Set<string>();
  
  function traverseBackwards(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // Find all edges that point TO this node
    const incomingEdges = pipeline.edges.filter(e => e.target === nodeId);
    
    for (const edge of incomingEdges) {
      const sourceNode = pipeline.nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        if (sourceNode.type === 'subtask') {
          // Skip if this is the current node (prevents self-reference in loops)
          if (sourceNode.id !== currentNodeId) {
            priorNodeIds.push(sourceNode.id);
          }
        }
        // Skip start nodes (they're just markers, not actionable)
        if (sourceNode.type !== 'start') {
          // Continue traversing backwards
          traverseBackwards(sourceNode.id);
        }
      }
    }
  }
  
  traverseBackwards(currentNodeId);
  return priorNodeIds;
}

/**
 * Gather accumulated fields from all prior subtasks that have been completed/reviewed
 */
function getAccumulatedFields(
  pipeline: Pipeline,
  execution: PipelineExecution,
  currentNodeId: string
): AccumulatedField[] {
  const priorSubtaskNodeIds = getPriorSubtaskNodeIds(pipeline, currentNodeId);
  const accumulatedFields: AccumulatedField[] = [];
  
  for (const nodeId of priorSubtaskNodeIds) {
    const subtaskExec = execution.nodeExecutions.find(
      ne => ne.nodeId === nodeId
    ) as SubtaskExecution | undefined;
    
    if (!subtaskExec || !isSubtaskExecution(subtaskExec)) continue;
    
    const pipelineNode = pipeline.nodes.find(n => n.id === nodeId);
    if (!pipelineNode || pipelineNode.type !== 'subtask') continue;
    
    const subtaskData = pipelineNode.data as SubtaskNodeData;
    
    // Only include fields that have been submitted (have versions)
    for (const history of subtaskExec.fieldHistories) {
      if (history.versions.length === 0) continue;
      
      const field = subtaskData.fields.find(f => f.id === history.fieldId);
      if (!field) continue;
      
      const latestVersion = history.versions[history.versions.length - 1];
      
      accumulatedFields.push({
        fieldId: history.fieldId,
        nodeId: nodeId,
        nodeLabel: pipelineNode.label,
        fieldLabel: field.label,
        fieldType: field.type,
        value: latestVersion.value,
        reviewStatus: latestVersion.status,
        reviewComment: latestVersion.reviewComment,
      });
    }
  }
  
  return accumulatedFields;
}

/**
 * Generate FIFO editor queue across all pipeline executions
 */
export async function getEditorQueue(): Promise<EditorQueueItem[]> {
  const executions = await getActiveExecutions();
  const pipelines = await getPipelines();

  const queueItems: EditorQueueItem[] = [];

  for (const execution of executions) {
    const currentNode = execution.nodeExecutions.find(
      ne => ne.nodeId === execution.currentNodeId
    );

    // Only include subtask nodes that are pending or need revision
    if (
      currentNode &&
      isSubtaskExecution(currentNode) &&
      (currentNode.status === 'pending' || currentNode.status === 'revision_needed')
    ) {
      const pipeline = pipelines.find(p => p.id === execution.pipelineId);
      if (!pipeline) continue;

      const pipelineNode = pipeline.nodes.find(n => n.id === currentNode.nodeId);
      if (!pipelineNode) continue;

      const subtaskData = pipelineNode.data as SubtaskNodeData;

      // Determine which fields need work
      const rejectedFieldIds = currentNode.status === 'revision_needed'
        ? getRejectedFieldIds(currentNode)
        : undefined;

      // Get accepted field values to pre-fill
      const existingFieldValues = currentNode.status === 'revision_needed'
        ? getAcceptedFieldValues(currentNode)
        : undefined;

      // Get accumulated fields from prior subtasks
      const accumulatedFields = getAccumulatedFields(pipeline, execution, currentNode.nodeId);

      const assignedTo = currentNode.assignedTo;
      let assignmentBehavior: 'any' | 'same_person' | 'different_person' | undefined;
      let previousAssignee: string | undefined;

      if (assignedTo) {
        if (assignedTo.startsWith('not:')) {
          assignmentBehavior = 'different_person';
          previousAssignee = assignedTo.slice(4);
        } else {
          assignmentBehavior = 'same_person';
          previousAssignee = assignedTo;
        }
      }

      queueItems.push({
        executionId: execution.id,
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        nodeId: currentNode.nodeId,
        nodeLabel: pipelineNode.label,
        fields: subtaskData.fields,
        rejectedFieldIds,
        existingFieldValues: existingFieldValues && Object.keys(existingFieldValues).length > 0
          ? existingFieldValues
          : undefined,
        accumulatedFields: accumulatedFields.length > 0 ? accumulatedFields : undefined,
        createdAt: currentNode.startedAt || execution.createdAt,
        assignmentBehavior,
        previousAssignee,
      });
    }
  }

  // Sort by createdAt (FIFO)
  return queueItems.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Generate FIFO reviewer queue across all pipeline executions
 */
export async function getReviewerQueue(): Promise<ReviewerQueueItem[]> {
  const executions = await getActiveExecutions();
  const pipelines = await getPipelines();

  const queueItems: ReviewerQueueItem[] = [];

  for (const execution of executions) {
    const currentNode = execution.nodeExecutions.find(
      ne => ne.nodeId === execution.currentNodeId
    );

    // Only include review nodes that are in progress
    if (
      currentNode &&
      isReviewExecution(currentNode) &&
      currentNode.status === 'in_progress'
    ) {
      const pipeline = pipelines.find(p => p.id === execution.pipelineId);
      if (!pipeline) continue;

      const pipelineNode = pipeline.nodes.find(n => n.id === currentNode.nodeId);
      if (!pipelineNode) continue;

      const reviewNodeData = pipelineNode.data as ReviewNodeData;

      // Get subtask execution to fetch field values
      const subtaskExec = execution.nodeExecutions.find(
        ne => ne.nodeId === reviewNodeData.sourceSubtaskNodeId
      );

      if (!subtaskExec || !isSubtaskExecution(subtaskExec)) continue;

      const subtaskNode = pipeline.nodes.find(
        n => n.id === reviewNodeData.sourceSubtaskNodeId
      );
      if (!subtaskNode) continue;

      const subtaskFields = (subtaskNode.data as SubtaskNodeData).fields;

      // Determine which fields should be reviewed
      // 1. Never include instruction fields
      // 2. If reviewableFieldIds is set, only include those fields
      // 3. Otherwise, include all non-instruction fields
      const reviewableFieldIds = reviewNodeData.reviewableFieldIds;
      
      const fieldsToReview: FieldToReview[] = subtaskExec.fieldHistories
        .filter(history => {
          const field = subtaskFields.find(f => f.id === history.fieldId);
          if (!field) return false;
          
          // Never review instruction fields
          if (field.type === 'instructions') return false;
          
          // If reviewableFieldIds is set, only include those fields
          if (reviewableFieldIds && reviewableFieldIds.length > 0) {
            return reviewableFieldIds.includes(history.fieldId);
          }
          
          // Otherwise, include all non-instruction fields
          return true;
        })
        .map(history => {
          const field = subtaskFields.find(f => f.id === history.fieldId);
          if (!field) {
            throw new Error(`Field ${history.fieldId} not found in subtask`);
          }

          const latestVersion = history.versions[history.versions.length - 1];
          if (!latestVersion) {
            throw new Error(`No version found for field ${history.fieldId}`);
          }

          // Get previous review comments
          const previousComments = history.versions
            .filter(v => v.reviewComment)
            .map(v => v.reviewComment as string);

          return {
            fieldId: history.fieldId,
            fieldLabel: field.label,
            fieldType: field.type,
            currentValue: latestVersion.value,
            version: latestVersion.version,
            previousReviewComments: previousComments.length > 0 ? previousComments : undefined,
            subfields: field.subfields
          };
        });

      // Get accumulated fields from prior subtasks (not including the one being reviewed)
      const accumulatedFields = getAccumulatedFields(pipeline, execution, reviewNodeData.sourceSubtaskNodeId);

      const assignedTo = currentNode.assignedTo;
      let assignmentBehavior: 'any' | 'same_person' | 'different_person' | undefined;
      let previousAssignee: string | undefined;

      if (assignedTo) {
        if (assignedTo.startsWith('not:')) {
          assignmentBehavior = 'different_person';
          previousAssignee = assignedTo.slice(4);
        } else {
          assignmentBehavior = 'same_person';
          previousAssignee = assignedTo;
        }
      }

      queueItems.push({
        executionId: execution.id,
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        nodeId: currentNode.nodeId,
        nodeLabel: pipelineNode.label,
        subtaskNodeId: reviewNodeData.sourceSubtaskNodeId,
        fieldsToReview,
        accumulatedFields: accumulatedFields.length > 0 ? accumulatedFields : undefined,
        createdAt: subtaskExec.lastUpdatedAt || execution.createdAt,
        assignmentBehavior,
        previousAssignee,
      });
    }
  }

  // Sort by createdAt (FIFO)
  return queueItems.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
