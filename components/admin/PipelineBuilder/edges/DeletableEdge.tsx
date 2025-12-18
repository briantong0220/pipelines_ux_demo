'use client';

import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';

function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    deleteElements({ edges: [{ id }] });
  };

  // Determine edge color based on type
  const edgeType = (data as { type?: string })?.type;
  const strokeColor = edgeType === 'accept'
    ? '#22c55e'
    : edgeType === 'reject'
      ? '#ef4444'
      : '#6b7280';

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        style={{ cursor: 'pointer' }}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHovered ? (edgeType === 'accept' ? '#16a34a' : edgeType === 'reject' ? '#dc2626' : '#374151') : strokeColor,
          strokeWidth: isHovered ? 3 : 2,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: isHovered ? 'all' : 'none',
          }}
          className="nodrag nopan"
        >
          {/* Delete button */}
          <button
            onClick={onEdgeClick}
            onMouseEnter={() => setIsHovered(true)}
            className={`
              flex items-center justify-center w-6 h-6 rounded-full shadow-md
              transition-all duration-150
              ${isHovered
                ? 'opacity-100 bg-red-500 border-2 border-red-600 scale-100'
                : 'opacity-0 bg-white border-2 border-gray-300 scale-75 pointer-events-none'
              }
            `}
            title="Delete connection"
          >
            <svg
              className={`w-3 h-3 ${isHovered ? 'text-white' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </g>
  );
}

export default memo(DeletableEdge);
