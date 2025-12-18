'use client';

import { Task } from '@/types';
import Card from '@/components/ui/Card';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Card>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
      {task.description && (
        <p className="text-gray-600 mb-4">{task.description}</p>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Fields:</p>
        <ul className="space-y-1">
          {task.fields.map((field, index) => (
            <li key={field.id} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="font-medium">{index + 1}.</span>
              <span>{field.label}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {field.type === 'text' ? 'Text' : 'Long Text'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Created {new Date(task.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
