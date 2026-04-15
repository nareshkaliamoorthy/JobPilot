import { openDB } from 'idb';

const DB_NAME = 'JobTrackerDB';
const STORE_NAME = 'jobs';
const DB_VERSION = 1;

let db = null;

export const initDB = async () => {
    if (db) return db;

    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('dateApplied', 'dateApplied', { unique: false });
                store.createIndex('company', 'company', { unique: false });
            }
        },
    });

    return db;
};

// Get all jobs
export const getAllJobs = async () => {
    const database = await initDB();
    return await database.getAll(STORE_NAME);
};

// Get jobs by status
export const getJobsByStatus = async (status) => {
    const database = await initDB();
    return await database.getAllFromIndex(STORE_NAME, 'status', status);
};

// Get single job
export const getJob = async (id) => {
    const database = await initDB();
    return await database.get(STORE_NAME, id);
};

// Create job
export const createJob = async (job) => {
    const database = await initDB();
    const id = Date.now().toString();
    const newJob = {
        ...job,
        id,
        dateApplied: job.dateApplied || new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };
    await database.add(STORE_NAME, newJob);
    return newJob;
};

// Update job
export const updateJob = async (id, job) => {
    const database = await initDB();
    const existing = await database.get(STORE_NAME, id);
    const updated = { ...existing, ...job, id };
    await database.put(STORE_NAME, updated);
    return updated;
};

// Delete job
export const deleteJob = async (id) => {
    const database = await initDB();
    await database.delete(STORE_NAME, id);
};

// Clear all jobs
export const clearAllJobs = async () => {
    const database = await initDB();
    await database.clear(STORE_NAME);
};

// Export jobs as JSON
export const exportJobsAsJSON = async () => {
    const jobs = await getAllJobs();
    return JSON.stringify(jobs, null, 2);
};

// Import jobs from JSON
export const importJobsFromJSON = async (jsonString) => {
    try {
        const jobs = JSON.parse(jsonString);
        const database = await initDB();

        for (const job of jobs) {
            // Ensure required fields, generate new ID
            const newJob = {
                ...job,
                id: Date.now().toString() + Math.random(),
            };
            await database.add(STORE_NAME, newJob);
        }

        return jobs.length;
    } catch (error) {
        throw new Error('Invalid JSON format');
    }
};
