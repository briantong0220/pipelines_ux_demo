'use client';

import { useState } from 'react';
import { ResponseWithTask, FieldComment } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Textarea from '@/components/ui/Textarea';
import FieldReview from './FieldReview';
import RatingInput from './RatingInput';

interface ResponseReviewCardProps {
  response: ResponseWithTask;
  onReviewSubmitted: () => void;
}

export default function ResponseReviewCard({ response, onReviewSubmitted }: ResponseReviewCardProps) {
  const [fieldComments, setFieldComments] = useState<Record<string, string>>({});
  const [overallRating, setOverallRating] = useState(3);
  const [overallComment, setOverallComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateFieldComment = (fieldId: string, comment: string) => {
    setFieldComments(prev => ({ ...prev, [fieldId]: comment }));
  };

  const handleSubmit = async () => {
    setError(null);

    setIsSubmitting(true);

    try {
      const comments: FieldComment[] = response.task.fields.map(field => ({
        fieldId: field.id,
        comment: fieldComments[field.id] || ''
      }));

      const reviewResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: response.id,
          fieldComments: comments,
          overallRating,
          overallComment: overallComment.trim() || undefined
        })
      });

      const result = await reviewResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      setSuccess(true);
      onReviewSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{response.task.title}</h3>
        <p className="text-sm text-gray-500">
          Submitted {new Date(response.submittedAt).toLocaleString()}
        </p>
      </div>

      <div className="space-y-6">
        {response.task.fields.map(field => {
          const responseField = response.fields.find(f => f.fieldId === field.id);
          if (!responseField) return null;

          return (
            <FieldReview
              key={field.id}
              field={field}
              responseField={responseField}
              comment={fieldComments[field.id] || ''}
              onCommentChange={(comment) => updateFieldComment(field.id, comment)}
            />
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
        <RatingInput value={overallRating} onChange={setOverallRating} />

        <Textarea
          label="Overall Comment (optional)"
          placeholder="Leave an overall comment about this submission"
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          rows={3}
        />
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Review submitted successfully!
        </div>
      )}

      <div className="mt-6">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </Card>
  );
}
