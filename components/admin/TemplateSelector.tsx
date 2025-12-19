'use client';

import { useState } from 'react';

interface TemplateSelectorProps {
  onSelectBlank: () => void;
  onSelectTaskReview: (taskCount: number) => void;
  onCancel: () => void;
}

export function TemplateSelector({ onSelectBlank, onSelectTaskReview, onCancel }: TemplateSelectorProps) {
  const [taskCount, setTaskCount] = useState(2);
  const [showCountPicker, setShowCountPicker] = useState(false);

  const handleTaskReviewSelect = () => {
    setShowCountPicker(true);
  };

  const handleConfirmCount = () => {
    onSelectTaskReview(taskCount);
  };

  if (showCountPicker) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
            <h2 className="text-xl font-bold text-white">Configure Template</h2>
            <p className="text-sm text-blue-100 mt-1">Set the number of task/review pairs</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Task + Review pairs
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTaskCount(Math.max(1, taskCount - 1))}
                  disabled={taskCount <= 1}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold text-gray-600"
                >
                  −
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={taskCount}
                    onChange={(e) => setTaskCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-full text-center text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl py-3 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setTaskCount(Math.min(10, taskCount + 1))}
                  disabled={taskCount >= 10}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold text-gray-600"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Pipeline Structure</h4>
              <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap py-2">
                <span className="px-3 py-1.5 bg-gray-200 rounded-md font-medium">Start</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md font-medium">T1</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md font-medium">R1</span>
                {taskCount > 2 && (
                  <>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-400 px-3 text-lg">···</span>
                    <span className="text-gray-400">→</span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md font-medium">T{taskCount}</span>
                    <span className="text-gray-400">→</span>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md font-medium">R{taskCount}</span>
                  </>
                )}
                {taskCount === 2 && (
                  <>
                    <span className="text-gray-400">→</span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md font-medium">T2</span>
                    <span className="text-gray-400">→</span>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md font-medium">R2</span>
                  </>
                )}
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-gray-700 text-white rounded-md font-medium">End</span>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Total: {2 + taskCount * 2} nodes, {1 + taskCount * 3} connections
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCountPicker(false)}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCount}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700"
              >
                Create Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Create New Pipeline</h2>
          <p className="text-sm text-gray-600 mt-1">Start from scratch or use a template</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onSelectBlank}
              className="group text-left border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Start from Scratch</h3>
              </div>
              <p className="text-sm text-gray-600">
                Build your own custom pipeline with a blank canvas
              </p>
            </button>
            
            <button
              onClick={handleTaskReviewSelect}
              className="group text-left border border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Tasks with Reviews
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Sequential tasks, each followed by a review step. Configure the number of pairs.
              </p>
              
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                  N tasks
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                  N reviews
                </span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
