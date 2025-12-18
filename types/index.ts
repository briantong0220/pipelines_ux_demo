// Core types for the human data collection app

export type UserRole = 'admin' | 'editor' | 'reviewer';

export type FieldType = 'text' | 'longtext' | 'instructions';

export interface TaskField {
  id: string;              // UUID for field
  label: string;           // Display label
  type: FieldType;         // Field type
  required?: boolean;      // Optional: mark as required
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
  label: string;           // Node display name
  description?: string;          // Instructions for reviewers
  sourceSubtaskNodeId: string;   // Which subtask node this reviews
  reviewableFieldIds?: string[]; // Which fields from the subtask should be reviewed (if undefined, all non-instruction fields)
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

export interface PipelineEdge {
  id: string;                    // UUID for edge
  source: string;                // Source node ID
  target: string;                // Target node ID
  label?: string;                // Edge label (e.g., "All Accepted", "Rejected")
  type?: string;                 // Edge component type (e.g., 'deletable') or routing logic
  data?: { type?: 'accept' | 'reject' };  // For review nodes: routing logic stored in data
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
  nodeId: string;                // References PipelineNode.id
  status: NodeExecutionStatus;   // Current status
  fieldHistories: FieldExecutionHistory[]; // Version history per field
  currentEditorAssignment?: string; // Editor working on it (if in_progress)
  startedAt?: string;            // When first started
  lastUpdatedAt?: string;        // Last activity timestamp
}

export interface ReviewExecution {
  nodeId: string;                // References PipelineNode.id
  status: NodeExecutionStatus;   // Current status
  sourceSubtaskNodeId: string;   // Which subtask this reviews
  currentReviewerAssignment?: string; // Reviewer working on it
  reviewedAt?: string;           // When review completed
  allFieldsAccepted: boolean;    // Routing decision flag
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
  executionId: string;           // PipelineExecution.id
  pipelineId: string;            // Pipeline.id
  pipelineName: string;          // Display name
  nodeId: string;                // SubtaskNode.id
  nodeLabel: string;             // Node display name
  fields: TaskField[];           // Fields to fill (current subtask)
  rejectedFieldIds?: string[];   // If revision, which fields need redo
  existingFieldValues?: Record<string, string>; // Pre-filled accepted values
  accumulatedFields?: AccumulatedField[]; // Fields from previous subtasks (read-only)
  createdAt: string;             // For FIFO ordering
}

export interface ReviewerQueueItem {
  executionId: string;           // PipelineExecution.id
  pipelineId: string;            // Pipeline.id
  pipelineName: string;          // Display name
  nodeId: string;                // ReviewNode.id
  nodeLabel: string;             // Node display name
  subtaskNodeId: string;         // Source subtask
  fieldsToReview: FieldToReview[]; // What to review (current subtask)
  accumulatedFields?: AccumulatedField[]; // Fields from previous subtasks (read-only)
  createdAt: string;             // For FIFO ordering
}

export interface FieldToReview {
  fieldId: string;               // TaskField.id
  fieldLabel: string;            // Display label
  fieldType: FieldType;          // Field type
  currentValue: string;          // Latest submitted value
  version: number;               // Version number
  previousReviewComments?: string[]; // Past comments (optional)
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
