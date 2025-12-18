'use client';

import { TaskField, ResponseField } from '@/types';
import Textarea from '@/components/ui/Textarea';

interface FieldReviewProps {
  field: TaskField;
  responseField: ResponseField;
  comment: string;
  onCommentChange: (comment: string) => void;
}

export default function FieldReview({ field, responseField, comment, onCommentChange }: FieldReviewProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{field.label}</p>
        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-900 whitespace-pre-wrap">{responseField.value}</p>
        </div>
      </div>
      <Textarea
        label="Your Comment"
        placeholder="Leave a comment on this field"
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={2}
      />
    </div>
  );
}
