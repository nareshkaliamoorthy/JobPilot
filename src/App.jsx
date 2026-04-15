import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCorners } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import JobForm from './JobForm';
import {
    getAllJobs,
    createJob,
    updateJob,
    deleteJob,
    exportJobsAsJSON,
    importJobsFromJSON,
} from './db';

const COLUMNS = [
    { id: 'wishlist', title: 'Wishlist' },
    { id: 'applied', title: 'Applied' },
    { id: 'follow-up', title: 'Follow-up' },
    { id: 'interview', title: 'Interview' },
    { id: 'offer', title: 'Offer' },
    { id: 'rejected', title: 'Rejected' },
];

function App() {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    // Load jobs from IndexedDB on mount
    useEffect(() => {
        const loadJobs = async () => {
            const allJobs = await getAllJobs();
            setJobs(allJobs);
        };
        loadJobs();
    }, []);

    // Apply theme
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Filter and sort jobs
    useEffect(() => {
        let filtered = jobs;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = jobs.filter(
                (job) =>
                    job.company.toLowerCase().includes(term) ||
                    job.jobTitle.toLowerCase().includes(term)
            );
        }

        if (sortBy === 'oldest') {
            filtered = [...filtered].sort((a, b) => new Date(a.dateApplied) - new Date(b.dateApplied));
        } else {
            filtered = [...filtered].sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
        }

        setFilteredJobs(filtered);
    }, [jobs, searchTerm, sortBy]);

    const handleAddJob = async (formData) => {
        const newJob = await createJob(formData);
        setJobs((prev) => [...prev, newJob]);
        setShowForm(false);
    };

    const handleEditJob = (job) => {
        setEditingJob(job);
        setShowForm(true);
    };

    const handleUpdateJob = async (formData) => {
        const updated = await updateJob(editingJob.id, formData);
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? updated : j)));
        setShowForm(false);
        setEditingJob(null);
    };

    const handleDeleteJob = (jobId) => {
        if (confirm('Are you sure you want to delete this job?')) {
            deleteJob(jobId).then(() => {
                setJobs((prev) => prev.filter((j) => j.id !== jobId));
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;

        const jobId = active.id;
        const newStatus = over.id;

        const job = jobs.find((j) => j.id === jobId);
        if (job && job.status !== newStatus) {
            const updated = await updateJob(jobId, { status: newStatus });
            setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
        }
    };

    const handleExport = async () => {
        const jsonData = await exportJobsAsJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonString = e.target?.result;
                const imported = await importJobsFromJSON(jsonString);
                const allJobs = await getAllJobs();
                setJobs(allJobs);
                alert(`Successfully imported ${imported} jobs!`);
            } catch (error) {
                alert(`Error importing: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };

    const jobsByStatus = COLUMNS.reduce((acc, column) => {
        acc[column.id] = filteredJobs.filter((job) => job.status === column.id);
        return acc;
    }, {});

    const existingResumes = [...new Set(jobs.map((j) => j.resumeUsed).filter(Boolean))];

    return (
        <div className={isDark ? 'dark' : ''}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4 flex-wrap">
                        <h1 className="text-2xl font-bold">💼 Job Tracker</h1>

                        <div className="flex gap-2 flex-wrap justify-end">
                            <button
                                onClick={() => {
                                    setEditingJob(null);
                                    setShowForm(true);
                                }}
                                className="btn-primary"
                            >
                                + Add Job
                            </button>

                            <button onClick={() => setIsDark(!isDark)} className="btn-secondary px-3">
                                {isDark ? '☀️' : '🌙'}
                            </button>

                            <button onClick={handleExport} className="btn-secondary px-3" title="Export">
                                📥
                            </button>

                            <label className="btn-secondary px-3 cursor-pointer">
                                📤
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Search and Sort */}
                    <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-3 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search by company or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-64 px-4 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800"
                        />

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800"
                        >
                            <option value="recent">Recent First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </header>

                {/* Kanban Board */}
                <main className="max-w-7xl mx-auto p-4">
                    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {COLUMNS.map((column) => (
                                <KanbanColumn
                                    key={column.id}
                                    status={column.id}
                                    title={column.title}
                                    jobs={jobsByStatus[column.id]}
                                    onEdit={handleEditJob}
                                    onDelete={handleDeleteJob}
                                />
                            ))}
                        </div>
                    </DndContext>
                </main>

                {/* Job Form Modal */}
                {showForm && (
                    <JobForm
                        job={editingJob}
                        onSave={editingJob ? handleUpdateJob : handleAddJob}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingJob(null);
                        }}
                        existingResumes={existingResumes}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
