'use client';

import { useState } from 'react';
import { FieldToReview } from '@/types';

interface FieldReviewItemProps {
  field: FieldToReview;
  onAccept: (fieldId: string, comment: string) => void;
  onReject: (fieldId: string, comment: string) => void;
  disabled?: boolean;
}

export default function FieldReviewItem({
  field,
  onAccept,
  onReject,
  disabled,
}: FieldReviewItemProps) {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const handleAccept = () => {
    setStatus('accepted');
    onAccept(field.fieldId, comment);
  };

  const handleReject = () => {
    // Comment is required for rejection to give editor feedback
    if (!comment.trim()) {
      alert('Please provide feedback explaining what needs to be fixed');
      return;
    }
    setStatus('rejected');
    onReject(field.fieldId, comment);
  };

  const handleReset = () => {
    setStatus('pending');
    setComment('');
  };

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all ${status === 'accepted'
          ? 'border-green-400 bg-green-50'
          : status === 'rejected'
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 bg-white'
        }`}
    >
      {/* Header */}
      <div className={`px-5 py-3 border-b ${status === 'accepted'
          ? 'border-green-200 bg-green-100'
          : status === 'rejected'
            ? 'border-red-200 bg-red-100'
            : 'border-gray-100 bg-gray-50'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">{field.fieldLabel}</h4>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
              v{field.version}
            </span>
          </div>
          {status !== 'pending' && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'accepted'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                }`}
            >
              {status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Previous Review Comments */}
        {field.previousReviewComments && field.previousReviewComments.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <p className="font-medium text-amber-800 mb-1">Previous feedback:</p>
            {field.previousReviewComments.map((prevComment, idx) => (
              <p key={idx} className="text-amber-700">• {prevComment}</p>
            ))}
          </div>
        )}

        {/* Field Value */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Editor&apos;s response
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">
              {field.currentValue || <span className="italic text-gray-400">No response</span>}
            </p>
          </div>
        </div>

        {/* Comment Input - only show when pending or expand when needed */}
        {status === 'pending' ? (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Feedback <span className="text-gray-400 normal-case">(optional for accept, required for reject)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none transition-colors"
              rows={2}
              placeholder="Add feedback for the editor..."
            />
          </div>
        ) : comment && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your feedback</p>
            <p className="text-sm text-gray-700">{comment}</p>
          </div>
        )}

        {/* Action Buttons */}
        {status === 'pending' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAccept}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium rounded-lg transition-colors"
          >
            Change Decision
          </button>
        )}
      </div>
    </div>
  );
}
