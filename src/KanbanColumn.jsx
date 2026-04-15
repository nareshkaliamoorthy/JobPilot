import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import JobCard from './JobCard';

const statusColors = {
    wishlist: 'border-blue-500',
    applied: 'border-yellow-500',
    'follow-up': 'border-purple-500',
    interview: 'border-orange-500',
    offer: 'border-green-500',
    rejected: 'border-red-500',
};

const KanbanColumn = ({ status, title, jobs, onEdit, onDelete }) => {
    const { setNodeRef } = useDroppable({
        id: status,
    });

    return (
        <div className="kanban-column">
            <div className={`border-b-2 pb-4 mb-4 ${statusColors[status]}`}>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                    {title}
                    <span className="ml-2 text-sm bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                        {jobs.length}
                    </span>
                </h2>
            </div>

            <div ref={setNodeRef} className="space-y-3 min-h-96">
                <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    {jobs.length > 0 ? (
                        jobs.map((job) => (
                            <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400">No jobs</div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default KanbanColumn;
