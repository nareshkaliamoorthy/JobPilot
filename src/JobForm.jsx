import React, { useState, useEffect } from 'react';

const RESUME_OPTIONS = ['SDE_Resume_v1', 'QA_Resume_v1', 'PM_Resume_v1'];
const STATUSES = ['wishlist', 'applied', 'follow-up', 'interview', 'offer', 'rejected'];

const JobForm = ({ job, onSave, onCancel, existingResumes = [] }) => {
    const [formData, setFormData] = useState(
        job || {
            company: '',
            jobTitle: '',
            linkedInUrl: '',
            resumeUsed: '',
            dateApplied: new Date().toISOString().split('T')[0],
            salaryRange: '',
            notes: '',
            status: 'wishlist',
        }
    );

    const [errors, setErrors] = useState({});

    const resumeOptions = existingResumes.length > 0
        ? existingResumes
        : [...new Set([...RESUME_OPTIONS, ...existingResumes])];

    const validateForm = () => {
        const newErrors = {};
        if (!formData.company.trim()) newErrors.company = 'Company is required';
        if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
        if (formData.linkedInUrl && !isValidUrl(formData.linkedInUrl)) {
            newErrors.linkedInUrl = 'Invalid URL';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {job ? 'Edit Job' : 'Add New Job'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Company *
                        </label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g., Google, Microsoft"
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                        {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Job Title *
                        </label>
                        <input
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            placeholder="e.g., Senior SDE, QA Lead"
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                        {errors.jobTitle && <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            LinkedIn URL
                        </label>
                        <input
                            type="url"
                            name="linkedInUrl"
                            value={formData.linkedInUrl}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/jobs/..."
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-xs"
                        />
                        {errors.linkedInUrl && <p className="text-red-500 text-xs mt-1">{errors.linkedInUrl}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Resume Used
                        </label>
                        <select
                            name="resumeUsed"
                            value={formData.resumeUsed}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select a resume</option>
                            {resumeOptions.map((resume) => (
                                <option key={resume} value={resume}>
                                    {resume}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date Applied
                        </label>
                        <input
                            type="date"
                            name="dateApplied"
                            value={formData.dateApplied}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Salary Range
                        </label>
                        <input
                            type="text"
                            name="salaryRange"
                            value={formData.salaryRange}
                            onChange={handleChange}
                            placeholder="e.g., ₹25-30 LPA"
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Recruiter name, referral info, etc."
                            rows="3"
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                        >
                            {job ? 'Update' : 'Add Job'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobForm;
