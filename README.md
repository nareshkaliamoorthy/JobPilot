# 💼 Job Tracker

A local-first, single-page React application for tracking your job search with a Kanban board interface. All data persists in the browser using IndexedDB—no backend or authentication required.

## Features

✅ **Drag-and-Drop Kanban Board** — Move jobs between 6 columns (Wishlist, Applied, Follow-up, Interview, Offer, Rejected)  
✅ **Rich Job Cards** — Company, role, LinkedIn link, resume used, days since applied, salary, notes  
✅ **Add/Edit/Delete Jobs** — Inline forms with validation  
✅ **Search & Filter** — Find jobs by company name or role  
✅ **Sort** — By date (newest/oldest first)  
✅ **Light/Dark Mode** — Toggle on the fly  
✅ **Export/Import JSON** — Backup and restore your data  
✅ **Fully Local** — 100% client-side, no backend calls  

## Tech Stack

- **React 18+** with hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **IndexedDB** via `idb` library
- **@dnd-kit** for drag-and-drop
- Responsive (laptop, tablet, mobile-friendly)

## Data Model

Each job tracks:
- **Company name** (required)
- **Job title/role** (required)
- **LinkedIn URL** (optional, clickable)
- **Resume used** (optional, dropdown)
- **Date applied** (auto-set, editable)
- **Salary range** (optional)
- **Notes** (optional, for recruiter info, referral notes, etc.)
- **Status** (Wishlist, Applied, Follow-up, Interview, Offer, Rejected)

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. **Add a Job** — Click "+ Add Job" button, fill form, save
2. **Edit a Job** — Click "Edit" on any card or click the card to edit inline
3. **Delete a Job** — Click "Delete" with confirmation
4. **Drag Jobs** — Drag cards between columns to update status
5. **Search** — Use the search bar to filter by company/role
6. **Sort** — Toggle between "Recent First" and "Oldest First"
7. **Export Data** — Click 📥 to download JSON
8. **Import Data** — Click 📤 and select a JSON file to restore
9. **Dark Mode** — Click 🌙 to toggle theme

## Project Structure

```
src/
  ├── App.jsx           # Main component (Kanban board, state, drag-drop)
  ├── JobCard.jsx       # Individual job card with drag handle
  ├── KanbanColumn.jsx  # Column container with drop zone
  ├── JobForm.jsx       # Add/Edit job modal form
  ├── db.js             # IndexedDB wrapper (idb library)
  ├── index.css         # Tailwind + custom styles
  └── main.jsx          # React entry point

Configuration:
  ├── index.html        # HTML entry point
  ├── vite.config.js    # Vite config
  ├── tailwind.config.js
  ├── postcss.config.js
  └── package.json
```

## Nice-to-Have Features (Implemented)

- ✅ Light/Dark mode toggle
- ✅ Export jobs as JSON
- ✅ Import jobs from JSON  
- ✅ Sort within a column by date

## Browser Support

Modern browsers with IndexedDB support (Chrome, Firefox, Safari, Edge)

## Local Storage

All data is stored in **IndexedDB** (browser's local database), persisting across sessions—no cloud sync required.

## Tips

- Resume names are auto-suggested from previously used resumes
- LinkedIn links are validated; click the 🔗 icon to open
- Days since applied is calculated automatically
- Dark mode preference is saved to localStorage

## Development Notes

- No backend API
- No authentication
- No external state management (React hooks only)
- Responsive grid layout (1 col mobile → 6 cols desktop)

---

Built with ❤️ for job search tracking.
