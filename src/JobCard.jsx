import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const JobCard = ({ job, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: job.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const daysAgo = Math.floor(
        (new Date() - new Date(job.dateApplied)) / (1000 * 60 * 60 * 24)
    );

    const handleLinkedInClick = (e) => {
        if (job.linkedInUrl) {
            e.preventDefault();
            window.open(job.linkedInUrl, '_blank');
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`job-card ${job.status} cursor-grab active:cursor-grabbing`}
        >
            <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.company}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{job.jobTitle}</p>
                </div>
                {job.linkedInUrl && (
                    <a
                        href={job.linkedInUrl}
                        onClick={handleLinkedInClick}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-lg"
                        title="Open LinkedIn"
                    >
                        🔗
                    </a>
                )}
            </div>

            <div className="text-xs space-y-1 mb-3">
                {job.resumeUsed && (
                    <div className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {job.resumeUsed}
                    </div>
                )}
                <p className="text-gray-500 dark:text-gray-400">
                    {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
                </p>
            </div>

            {job.salaryRange && (
                <p className="text-sm text-green-700 dark:text-green-400 mb-2">💼 {job.salaryRange}</p>
            )}

            {job.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-500 mb-2 line-clamp-2">{job.notes}</p>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(job)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(job.id)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default JobCard;
