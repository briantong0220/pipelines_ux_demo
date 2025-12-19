// Core types for the human data collection app

export type UserRole = 'admin' | 'editor' | 'reviewer';

export type FieldType = 'text' | 'longtext' | 'instructions' | 'dynamic';

export interface TaskField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  subfields?: TaskField[];
}

export interface Task {
  id: string;              // UUID for task
  title: string;           // Task title
  description?: string;    // Optional task description
  fields: TaskField[];     // Array of fields
  createdAt: string;       // ISO timestamp
  createdBy: string;       // 'admin' (could be user ID in real app)
}

export interface ResponseField {
  fieldId: string;         // References TaskField.id
  value: string;           // User's response
}

export interface TaskResponse {
  id: string;              // UUID for response
  taskId: string;          // References Task.id
  fields: ResponseField[]; // Array of field responses
  submittedAt: string;     // ISO timestamp
  submittedBy: string;     // 'editor' (could be user ID in real app)
}

export interface FieldComment {
  fieldId: string;         // References TaskField.id
  comment: string;         // Reviewer's comment
}

export interface Review {
  id: string;              // UUID for review
  responseId: string;      // References TaskResponse.id
  fieldComments: FieldComment[]; // Comments on individual fields
  overallRating: number;   // 1-5 scale
  overallComment?: string; // Optional general feedback
  reviewedAt: string;      // ISO timestamp
  reviewedBy: string;      // 'reviewer' (could be user ID in real app)
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Composite types for displaying related data
export interface ResponseWithTask extends TaskResponse {
  task: Task;
}

export interface ResponseWithTaskAndReview extends ResponseWithTask {
  review?: Review;
}

// ============== PIPELINE DEFINITION TYPES ==============

export type PipelineNodeType = 'start' | 'subtask' | 'review' | 'end';

export interface StartNodeData extends Record<string, unknown> {
  label: string;           // Node display name
  description?: string;    // Optional description
}

export interface SubtaskNodeData extends Record<string, unknown> {
  label: string;           // Node display name
  fields: TaskField[];     // Fields editors need to fill
  description?: string;    // Instructions for editors
}

export interface ReviewNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  sourceSubtaskNodeId: string;
  reviewableFieldIds?: string[];
  maxAttempts?: number;
}

export interface EndNodeData extends Record<string, unknown> {
  label: string;           // Node display name
  description?: string;    // Completion message
}

export interface PipelineNode {
  id: string;                    // UUID for node
  type: PipelineNodeType;        // Node type
  label: string;                 // Display name (e.g., "Write Draft", "Review Content")
  position: { x: number; y: number }; // Canvas position for React Flow
  data: StartNodeData | SubtaskNodeData | ReviewNodeData | EndNodeData; // Type-specific data
}

export type AssignmentBehavior = 'any' | 'same_person' | 'different_person';

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: { 
    type?: 'accept' | 'reject' | 'max_attempts';
    assignmentBehavior?: AssignmentBehavior;
  };
}

export interface Pipeline {
  id: string;                    // UUID for pipeline
  name: string;                  // Pipeline name
  description?: string;          // Pipeline description
  nodes: PipelineNode[];         // All nodes in the graph
  edges: PipelineEdge[];         // All edges connecting nodes
  createdAt: string;             // ISO timestamp
  createdBy: string;             // User who created it
}

// ============== PIPELINE EXECUTION TYPES ==============

export type NodeExecutionStatus =
  | 'pending'                    // Not started
  | 'in_progress'                // Currently being worked on
  | 'completed'                  // Successfully completed
  | 'waiting_review'             // Subtask submitted, awaiting review
  | 'revision_needed';           // Review rejected some fields

export interface FieldVersion {
  version: number;               // Version number (starts at 1)
  value: string;                 // Field value
  submittedAt: string;           // ISO timestamp
  submittedBy: string;           // Editor who submitted
  status: 'pending' | 'accepted' | 'rejected'; // Field status
  reviewComment?: string;        // Reviewer's comment
  reviewedAt?: string;           // When reviewed
  reviewedBy?: string;           // Who reviewed
}

export interface FieldExecutionHistory {
  fieldId: string;               // References TaskField.id
  versions: FieldVersion[];      // All versions of this field
  currentVersion: number;        // Latest version number
}

export interface SubtaskExecution {
  nodeId: string;
  status: NodeExecutionStatus;
  fieldHistories: FieldExecutionHistory[];
  currentEditorAssignment?: string;
  assignedTo?: string;
  completedBy?: string;
  startedAt?: string;
  lastUpdatedAt?: string;
}

export interface ReviewExecution {
  nodeId: string;
  status: NodeExecutionStatus;
  sourceSubtaskNodeId: string;
  currentReviewerAssignment?: string;
  assignedTo?: string;
  completedBy?: string;
  reviewedAt?: string;
  allFieldsAccepted: boolean;
}

export interface EndExecution {
  nodeId: string;                // References PipelineNode.id
  status: NodeExecutionStatus;   // Will be 'completed' when reached
  completedAt?: string;          // When pipeline finished
}

export type NodeExecution = SubtaskExecution | ReviewExecution | EndExecution;

export interface PipelineExecution {
  id: string;                    // UUID for execution
  pipelineId: string;            // References Pipeline.id
  currentNodeId: string;         // Which node is currently active
  status: 'active' | 'completed'; // Overall pipeline status
  nodeExecutions: NodeExecution[]; // Status of all nodes
  createdAt: string;             // When execution started
  completedAt?: string;          // When pipeline completed
}

// ============== QUEUE ITEM TYPES ==============

// Represents a field from a previous subtask with its final state
export interface AccumulatedField {
  fieldId: string;               // TaskField.id
  nodeId: string;                // Which subtask node this came from
  nodeLabel: string;             // Subtask node label for display
  fieldLabel: string;            // Display label
  fieldType: FieldType;          // Field type
  value: string;                 // Final accepted value
  reviewStatus: 'accepted' | 'rejected' | 'pending'; // Review status
  reviewComment?: string;        // Reviewer's comment
}

export interface EditorQueueItem {
  executionId: string;
  pipelineId: string;
  pipelineName: string;
  nodeId: string;
  nodeLabel: string;
  fields: TaskField[];
  rejectedFieldIds?: string[];
  existingFieldValues?: Record<string, string>;
  accumulatedFields?: AccumulatedField[];
  createdAt: string;
  assignmentBehavior?: AssignmentBehavior;
  previousAssignee?: string;
}

export interface ReviewerQueueItem {
  executionId: string;
  pipelineId: string;
  pipelineName: string;
  nodeId: string;
  nodeLabel: string;
  subtaskNodeId: string;
  fieldsToReview: FieldToReview[];
  accumulatedFields?: AccumulatedField[];
  createdAt: string;
  assignmentBehavior?: AssignmentBehavior;
  previousAssignee?: string;
}

export interface FieldToReview {
  fieldId: string;
  fieldLabel: string;
  fieldType: FieldType;
  currentValue: string;
  version: number;
  previousReviewComments?: string[];
  subfields?: TaskField[];
}

// ============== FIELD REVIEW RESULT ==============

export interface FieldReviewResult {
  fieldId: string;               // TaskField.id
  status: 'accepted' | 'rejected'; // Review decision
  comment?: string;              // Reviewer's comment (optional for accept, required for reject)
}

// ============== TYPE GUARDS ==============

export function isSubtaskExecution(node: NodeExecution): node is SubtaskExecution {
  return 'fieldHistories' in node;
}

export function isReviewExecution(node: NodeExecution): node is ReviewExecution {
  return 'allFieldsAccepted' in node;
}

export function isEndExecution(node: NodeExecution): node is EndExecution {
  return !('fieldHistories' in node) && !('allFieldsAccepted' in node);
}

export function isStartNode(node: PipelineNode): node is PipelineNode & { type: 'start'; data: StartNodeData } {
  return node.type === 'start';
}

export function isSubtaskNode(node: PipelineNode): node is PipelineNode & { type: 'subtask'; data: SubtaskNodeData } {
  return node.type === 'subtask';
}

export function isReviewNode(node: PipelineNode): node is PipelineNode & { type: 'review'; data: ReviewNodeData } {
  return node.type === 'review';
}

export function isEndNode(node: PipelineNode): node is PipelineNode & { type: 'end'; data: EndNodeData } {
  return node.type === 'end';
}

export interface TemplateNodeDefinition {
  type: PipelineNodeType;
  label: string;
  position: { x: number; y: number };
  data: StartNodeData | SubtaskNodeData | ReviewNodeData | EndNodeData;
}

export interface TemplateEdgeDefinition {
  sourceIndex: number;
  targetIndex: number;
  data?: {
    type?: 'accept' | 'reject' | 'max_attempts';
  };
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category?: string;
  nodeCount: number;
  nodes: TemplateNodeDefinition[];
  edges: TemplateEdgeDefinition[];
}
