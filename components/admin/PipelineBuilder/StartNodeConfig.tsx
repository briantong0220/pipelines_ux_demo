'use client';

import { useState } from 'react';
import { StartNodeData } from '@/types';

interface StartNodeConfigProps {
    nodeId: string;
    data: StartNodeData;
    onUpdate: (nodeId: string, data: StartNodeData) => void;
    onClose: () => void;
}

export function StartNodeConfig({ nodeId, data, onUpdate, onClose }: StartNodeConfigProps) {
    const [label, setLabel] = useState(data.label || 'Pipeline Start');
    const [description, setDescription] = useState(data.description || '');

    const handleSave = () => {
        onUpdate(nodeId, {
            ...data,
            label,
            description,
        });
        onClose();
    };

    return (
        <div className="bg-gray-50 h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Start</h3>
                            <p className="text-xs text-gray-500">Pipeline entry point</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full text-xl font-bold bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none pb-1 placeholder:text-gray-400"
                        placeholder="Pipeline Start"
                    />
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-sm text-gray-600 bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none pb-1 placeholder:text-gray-400"
                        placeholder="Add description (optional)"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-emerald-800 mb-2">Start Node Behavior</p>
                    <ul className="text-sm text-emerald-700 space-y-2">
                        <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Marks the beginning of the pipeline</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Pipeline execution starts here</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Must have exactly one outgoing connection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Pipeline can only have one start node</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 font-medium transition-colors shadow-sm"
                >
                    Save
                </button>
            </div>
        </div>
    );
}
